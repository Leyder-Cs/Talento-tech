import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { useCategoryTree } from '../../hooks/useCategories';
import { uploadsService } from '../../services/uploads.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { getApiError } from '../../utils/error';
import toast from 'react-hot-toast';

const FALLBACK_IMG = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f5f5f5"/><text x="100" y="105" text-anchor="middle" fill="#0D9488" font-family="Arial,sans-serif" font-size="32" font-weight="bold">L-Health</text></svg>');

const productSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  shortDescription: z
    .string()
    .min(10, 'Mínimo 10 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  description: z.string().min(20, 'Mínimo 20 caracteres'),
  price: z.coerce.number().positive('Debe ser mayor a 0'),
  stock: z.coerce.number().int().min(0, 'Mínimo 0'),
  benefits: z.string().min(10, 'Mínimo 10 caracteres'),
  ingredients: z.string().min(5, 'Mínimo 5 caracteres'),
  usageInstructions: z.string().min(10, 'Mínimo 10 caracteres'),
  contraindications: z.string().min(5, 'Mínimo 5 caracteres'),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
});

type ProductForm = z.infer<typeof productSchema>;

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categories } = useCategoryTree();
  const { data: product, isLoading } = useProduct(id || '');

  const [images, setImages] = useState<{ id: string; imageUrl: string; isPrimary: boolean }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const [pendingPrimary, setPendingPrimary] = useState<number>(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      featured: false,
      active: true,
    },
  });

  useEffect(() => {
    if (isEditing && product) {
      setValue('name', product.name);
      setValue('slug', product.slug);
      setValue('shortDescription', product.shortDescription);
      setValue('description', product.description);
      setValue('price', product.price);
      setValue('stock', product.stock);
      setValue('benefits', product.benefits);
      setValue('ingredients', product.ingredients);
      setValue('usageInstructions', product.usageInstructions);
      setValue('contraindications', product.contraindications);
      setValue('featured', product.featured);
      setValue('active', product.active);
      setValue('categoryId', product.categoryId);
      setImages(product.images || []);
    }
  }, [isEditing, product, setValue]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü\s-]/g, '')
      .replace(/[áéíóú]/g, (c: string) =>
        ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' })[c] || c,
      )
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setValue('name', name);
    if (!isEditing) {
      setValue('slug', generateSlug(name));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const existing = images.length + pendingFiles.length;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name} no es un formato válido`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} supera los 5MB`);
        continue;
      }
      if (existing + validFiles.length >= 5) {
        toast.error('Máximo 5 imágenes por producto');
        break;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    if (!id) {
      const newPending = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setPendingFiles((prev) => [...prev, ...newPending]);
      if (pendingFiles.length === 0 && images.length === 0) setPendingPrimary(0);
      (e.target as HTMLInputElement).value = '';
      return;
    }

    setUploading(true);
    try {
      const newImages = await uploadsService.uploadImages(id, validFiles);
      setImages((prev) => [...prev, ...newImages]);
      toast.success('Imágenes subidas correctamente');
    } catch {
      toast.error('Error al subir imágenes');
    }
    setUploading(false);
    (e.target as HTMLInputElement).value = '';
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await uploadsService.deleteImage(imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar imagen');
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      const updated = await uploadsService.setPrimary(imageId);
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.id === updated.id,
        })),
      );
      toast.success('Imagen principal actualizada');
    } catch {
      toast.error('Error al actualizar imagen principal');
    }
  };

  const onSubmit = (data: ProductForm) => {
    if (isEditing && id) {
      updateProduct.mutate(
        { id, data },
        {
          onSuccess: () => {
            toast.success('Producto actualizado');
            navigate('/admin/products');
          },
          onError: (err: unknown) => {
            toast.error(getApiError(err));
          },
        },
      );
    } else {
      const filesToUpload = pendingFiles.map((p) => p.file);
      createProduct.mutate(data, {
        onSuccess: async (newProduct) => {
          if (filesToUpload.length > 0) {
            try {
              const uploaded = await uploadsService.uploadImages(newProduct.id, filesToUpload);
              const primaryFile = uploaded[pendingPrimary];
              if (primaryFile) await uploadsService.setPrimary(primaryFile.id);
              pendingFiles.forEach((p) => URL.revokeObjectURL(p.preview));
              setPendingFiles([]);
            } catch {
              navigate('/admin/products');
              return;
            }
          }
          toast.success('Producto creado');
          navigate('/admin/products');
        },
        onError: (err: unknown) => {
          toast.error(getApiError(err));
        },
      });
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" dark />
        <Skeleton className="h-96 w-full" dark />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-emphasis">
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isEditing ? 'Modifica los datos del producto existente' : 'Completa los datos para crear un nuevo producto'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-gray-800/50 rounded-xl border border-white/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-emphasis">Información básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              error={errors.name?.message}
              dark
              {...register('name')}
              onChange={(e) => {
                handleNameChange(e.target.value);
              }}
            />
            <Input
              label="Slug"
              error={errors.slug?.message}
              dark
              {...register('slug')}
            />
          </div>
          <Input
            label="Descripción corta"
            error={errors.shortDescription?.message}
            dark
            {...register('shortDescription')}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Descripción completa
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none bg-gray-800 text-gray-300 placeholder-gray-500"
            />
            {errors.description && (
              <p className="text-sm text-red-400 mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-white/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-emphasis">Precio y stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Precio"
              type="number"
              step="0.01"
              error={errors.price?.message}
              dark
              {...register('price')}
            />
            <Input
              label="Stock"
              type="number"
              error={errors.stock?.message}
              dark
              {...register('stock')}
            />
            <CategorySelect
              categories={categories}
              value={watch('categoryId')}
              onChange={(val) => setValue('categoryId', val, { shouldValidate: true })}
              error={errors.categoryId?.message}
            />
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('featured')} className="w-4 h-4 rounded accent-accent" />
              <span className="text-sm text-gray-400">Destacado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('active')} className="w-4 h-4 rounded accent-accent" />
              <span className="text-sm text-gray-400">Activo</span>
            </label>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-white/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-emphasis">Detalles del producto</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Beneficios</label>
            <textarea
              {...register('benefits')}
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none bg-gray-800 text-gray-300 placeholder-gray-500"
            />
            {errors.benefits && (
              <p className="text-sm text-red-400 mt-1">{errors.benefits.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Ingredientes</label>
            <textarea
              {...register('ingredients')}
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none bg-gray-800 text-gray-300 placeholder-gray-500"
            />
            {errors.ingredients && (
              <p className="text-sm text-red-400 mt-1">{errors.ingredients.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Instrucciones de uso</label>
            <textarea
              {...register('usageInstructions')}
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none bg-gray-800 text-gray-300 placeholder-gray-500"
            />
            {errors.usageInstructions && (
              <p className="text-sm text-red-400 mt-1">{errors.usageInstructions.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Contraindicaciones</label>
            <textarea
              {...register('contraindications')}
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none bg-gray-800 text-gray-300 placeholder-gray-500"
            />
            {errors.contraindications && (
              <p className="text-sm text-red-400 mt-1">{errors.contraindications.message}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-white/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-emphasis">Imágenes</h2>
          <p className="text-sm text-gray-500">{images.length + pendingFiles.length}/5 imágenes</p>
          <div className="flex gap-4 flex-wrap">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <div className="w-24 h-24 bg-gray-700 rounded-xl overflow-hidden ring-1 ring-gray-700">
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-base-dark/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-1">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.id)}
                      className="text-white text-xs bg-accent px-2 py-1 rounded-md font-medium"
                    >
                      Principal
                    </button>
                  )}
                  <button
                    type="button"
onClick={() => handleDeleteImage(img.id)}
                      className="text-white text-xs bg-red-500 px-2 py-1 rounded-md font-medium"
                    >
                      ×
                  </button>
                </div>
                {img.isPrimary && (
                  <span className="absolute top-1.5 left-1.5 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                    Principal
                  </span>
                )}
              </div>
            ))}
            {pendingFiles.map((p, i) => (
              <div key={p.preview} className="relative group">
                <div className="w-24 h-24 bg-gray-700 rounded-xl overflow-hidden ring-1 ring-gray-700">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-base-dark/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-1">
                  {i !== pendingPrimary && (
                    <button
                      type="button"
                      onClick={() => setPendingPrimary(i)}
                      className="text-white text-xs bg-accent px-2 py-1 rounded-md font-medium"
                    >
                      Principal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(p.preview);
                      setPendingFiles((prev) => prev.filter((_, idx) => idx !== i));
                      if (i <= pendingPrimary && pendingPrimary > 0) setPendingPrimary((prev) => prev - 1);
                    }}
                    className="text-white text-xs bg-red-500 px-2 py-1 rounded-md font-medium"
                  >
                    ×
                  </button>
                </div>
                {i === pendingPrimary && (
                  <span className="absolute top-1.5 left-1.5 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                    Principal
                  </span>
                )}
              </div>
            ))}
            {(images.length + pendingFiles.length) < 5 && (
              <label className="w-24 h-24 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
                <span className="text-2xl text-gray-500">+</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          {!isEditing && images.length === 0 && pendingFiles.length === 0 && (
            <p className="text-xs text-gray-500">Selecciona imágenes y elige la principal antes de crear</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" size="lg" loading={createProduct.isPending || updateProduct.isPending}>
            {isEditing ? 'Guardar cambios' : 'Crear producto'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => navigate('/admin/products')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Tree-style category dropdown ───
function CategorySelect({
  categories,
  value,
  onChange,
  error,
}: {
  categories: { id: string; name: string; children?: { id: string; name: string }[] }[] | undefined;
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-expand the parent of the selected value
  useEffect(() => {
    if (value && categories) {
      const parent = categories.find(
        (p) => p.children?.some((c) => c.id === value),
      );
      if (parent) setExpanded((prev) => new Set(prev).add(parent.id));
    }
  }, [value, categories]);

  const getSelectedLabel = (): string => {
    if (!value || !categories) return 'Seleccionar...';
    for (const parent of categories) {
      if (parent.id === value) return parent.name;
      const child = parent.children?.find((c) => c.id === value);
      if (child) return `${parent.name} / ${child.name}`;
    }
    return 'Seleccionar...';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        Categoría
      </label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg transition-colors ${
            value
              ? 'bg-gray-800 border-gray-700 text-emphasis'
              : 'bg-gray-800 border-gray-700 text-gray-500'
          }`}
        >
          <span className={value ? 'text-emphasis' : 'text-gray-500'}>
            {getSelectedLabel()}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {categories?.length ? (
              categories.map((parent) => {
                const hasChildren = parent.children && parent.children.length > 0;
                const isExpanded = expanded.has(parent.id);
                return (
                  <div key={parent.id}>
                    {/* Parent */}
                    <button
                      type="button"
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-800 transition-colors ${
                        value === parent.id ? 'bg-accent/10 text-accent' : 'text-gray-300'
                      }`}
                      onClick={() => {
                        onChange(parent.id);
                        setOpen(false);
                      }}
                    >
                      {hasChildren ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpanded((prev) => {
                              const next = new Set(prev);
                              isExpanded ? next.delete(parent.id) : next.add(parent.id);
                              return next;
                            });
                          }}
                          className="p-0.5 rounded hover:bg-gray-700 text-gray-500"
                        >
                          <svg
                            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="w-4" />
                      )}
                      <span className="font-medium">{parent.name}</span>
                    </button>

                    {/* Children */}
                    {hasChildren && isExpanded && (
                      <div className="bg-gray-900/50">
                        {parent.children!.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 text-sm text-left hover:bg-gray-800 transition-colors ${
                              value === child.id ? 'bg-accent/10 text-accent' : 'text-gray-400'
                            }`}
                            onClick={() => {
                              onChange(child.id);
                              setOpen(false);
                            }}
                          >
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="px-3 py-2 text-sm text-gray-500">No hay categorías</p>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  );
}
