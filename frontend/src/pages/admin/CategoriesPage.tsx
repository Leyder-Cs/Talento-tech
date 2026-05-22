import { useState, useRef } from 'react';
import {
  useCategoryTree,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/useCategories';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { getApiError, MAX_UPLOAD_SIZE_MB } from '../../utils/error';
import api from '../../services/axios.config';
import type { Category } from '../../types';
import toast from 'react-hot-toast';

export function CategoriesPage() {
  const { data: tree, isLoading } = useCategoryTree();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Modal state (edit / top-level create) ───
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; imageUrl: string | null } | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // ─── Tree expand state ───
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // ─── Inline subcategory form ───
  const [subParentId, setSubParentId] = useState<string | null>(null);
  const [subName, setSubName] = useState('');
  const [subImageUrl, setSubImageUrl] = useState('');
  const [subUploading, setSubUploading] = useState(false);

  // ─── Delete confirmation ───
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Modal: open for top-level create ───
  const openCreate = () => {
    setEditingCategory(null);
    setName('');
    setImageUrl('');
    setModalOpen(true);
  };

  // ─── Modal: open for edit (any category) ───
  const openEdit = (cat: { id: string; name: string; imageUrl: string | null }) => {
    setEditingCategory(cat);
    setName(cat.name);
    setImageUrl(cat.imageUrl ?? '');
    setModalOpen(true);
  };

  // ─── Inline sub form: open ───
  const openSubForm = (parentId: string) => {
    setSubParentId(parentId);
    setSubName('');
    setSubImageUrl('');
    if (subFileInputRef.current) subFileInputRef.current.value = '';
  };

  const closeSubForm = () => {
    setSubParentId(null);
    setSubName('');
    setSubImageUrl('');
    if (subFileInputRef.current) subFileInputRef.current.value = '';
  };

  // ─── Image upload (modal) ───
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`La imagen no puede superar los ${MAX_UPLOAD_SIZE_MB}MB`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const { data } = await api.post<{ imageUrl: string }>('/uploads/category', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.imageUrl);
      toast.success('Imagen subida');
    } catch (err: unknown) {
      toast.error(getApiError(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Image upload (inline sub form) ───
  const handleSubFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`La imagen no puede superar los ${MAX_UPLOAD_SIZE_MB}MB`);
      if (subFileInputRef.current) subFileInputRef.current.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    setSubUploading(true);
    try {
      const { data } = await api.post<{ imageUrl: string }>('/uploads/category', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubImageUrl(data.imageUrl);
      toast.success('Imagen subida');
    } catch (err: unknown) {
      toast.error(getApiError(err));
    } finally {
      setSubUploading(false);
      if (subFileInputRef.current) subFileInputRef.current.value = '';
    }
  };

  // ─── Save from modal (create top-level or edit) ───
  const handleSave = () => {
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!imageUrl) { toast.error('Debes subir una imagen'); return; }

    const payload = { name: name.trim(), imageUrl };

    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, data: payload },
        {
          onSuccess: () => { toast.success('Categoría actualizada'); setModalOpen(false); },
          onError: (err: unknown) => toast.error(getApiError(err)),
        },
      );
    } else {
      createCategory.mutate(payload, {
        onSuccess: () => { toast.success('Categoría creada'); setModalOpen(false); },
        onError: (err: unknown) => toast.error(getApiError(err)),
      });
    }
  };

  // ─── Save inline subcategory ───
  const handleCreateSub = () => {
    if (!subName.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!subImageUrl) { toast.error('Debes subir una imagen'); return; }
    if (!subParentId) return;

    createCategory.mutate(
      { name: subName.trim(), imageUrl: subImageUrl, parentId: subParentId },
      {
        onSuccess: () => {
          toast.success('Subcategoría creada');
          closeSubForm();
          // Auto-expand parent so the user sees the new sub
          setExpanded((prev) => new Set(prev).add(subParentId));
        },
        onError: (err: unknown) => toast.error(getApiError(err)),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteCategory.mutate(deleteId, {
      onSuccess: () => { toast.success('Categoría eliminada'); setDeleteId(null); },
      onError: (err: unknown) => toast.error(getApiError(err)),
    });
  };

  const renderCategoryRow = (cat: Category, isChild = false) => (
    <div key={cat.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-800/30 transition-colors ${isChild ? 'pl-14' : ''}`}>
      {!isChild && (
        <button
          onClick={() => toggleExpand(cat.id)}
          className={`p-0.5 rounded transition-colors ${cat.children?.length ? 'text-gray-400 hover:text-emphasis' : 'text-gray-700 cursor-default'}`}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${expanded.has(cat.id) ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image + name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {cat.imageUrl ? (
          <img
            src={cat.imageUrl.startsWith('http') || cat.imageUrl.startsWith('data:')
              ? cat.imageUrl
              : `${import.meta.env.VITE_API_URL}${cat.imageUrl}`
            }
            alt=""
            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {cat.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-gray-200 truncate">{cat.name}</span>
      </div>

      {/* Count */}
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-sm font-semibold text-gray-300 flex-shrink-0">
        {cat._count?.products || 0}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
          Editar
        </Button>
        {!isChild && (
          <Button variant="ghost" size="sm" onClick={() => openSubForm(cat.id)}>
            + Sub
          </Button>
        )}
        <Button variant="ghost" size="sm" className="!text-red-400" onClick={() => setDeleteId(cat.id)}>
          Eliminar
        </Button>
      </div>
    </div>
  );

  const renderInlineSubForm = (parentId: string) => {
    if (subParentId !== parentId) return null;
    return (
      <div className="px-14 py-3 bg-gray-800/40 border-t border-gray-800/60">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Nombre de la subcategoría"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            className="flex-1 min-w-[180px] px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-emphasis placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <input
            ref={subFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleSubFileUpload}
            className="block max-w-[200px] text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 cursor-pointer"
          />
          {subUploading && <span className="text-xs text-amber-500">Subiendo...</span>}
          {subImageUrl && (
            <img src={subImageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-700 flex-shrink-0" />
          )}
          <Button
            size="sm"
            onClick={handleCreateSub}
            loading={createCategory.isPending && subParentId === parentId}
          >
            Crear
          </Button>
          <Button variant="ghost" size="sm" onClick={closeSubForm}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emphasis">Categorías</h1>
            <p className="text-sm text-gray-400 mt-0.5">Organiza tus productos por categorías</p>
          </div>
        </div>
        <Button onClick={openCreate}>+ Nueva categoría</Button>
      </div>

      {/* ─── Tree ─── */}
      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" dark />
      ) : tree && tree.length > 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-white/5 overflow-hidden">
          {/* Header row */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
            <div className="w-4" />
            <span className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</span>
            <span className="w-8 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</span>
            <div className="flex items-center gap-1" />
          </div>

          {tree.map((parent) => (
            <div key={parent.id}>
              {renderCategoryRow(parent)}
              {expanded.has(parent.id) && parent.children?.map((child) => renderCategoryRow(child, true))}
              {expanded.has(parent.id) && renderInlineSubForm(parent.id)}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No hay categorías"
          message="Crea tu primera categoría para organizar los productos."
          actionLabel="Crear categoría"
          onAction={openCreate}
          dark
        />
      )}

      {/* ─── Modal: create top-level / edit ─── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
        dark
      >
        <div className="space-y-4">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} dark />
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Imagen</label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 cursor-pointer"
              />
            </div>
            {uploading && <p className="text-sm text-amber-500 mt-1.5">Subiendo imagen...</p>}
            {imageUrl && (
              <div className="mt-3">
                <img src={imageUrl} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-gray-700" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={createCategory.isPending || updateCategory.isPending}>
              {editingCategory ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Confirm delete ─── */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar categoría"
        message="¿Estás seguro? No se puede eliminar una categoría que tenga productos o subcategorías asociadas."
        confirmText="Eliminar"
        loading={deleteCategory.isPending}
        dark
      />
    </div>
  );
}
