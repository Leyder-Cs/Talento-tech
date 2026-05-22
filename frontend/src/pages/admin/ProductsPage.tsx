import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, useToggleProduct, useDeleteProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const token = useAuthStore((s) => s.token);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useProducts({
    page,
    limit: 15,
    category: categoryFilter || undefined,
    search: searchTerm || undefined,
    includeInactive: 'true',
  });
  const { data: categories } = useCategories();
  const toggleProduct = useToggleProduct();
  const deleteProduct = useDeleteProduct();

  const handleToggle = (id: string) => {
    toggleProduct.mutate(id, {
      onSuccess: () => toast.success('Estado actualizado'),
      onError: () => toast.error('Error al actualizar'),
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteProduct.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Producto eliminado');
        setDeleteId(null);
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al eliminar'),
    });
  };

  const handleExportTxt = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/products/export/txt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'productos-lhealth.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Exportado correctamente');
    } catch {
      toast.error('Error al exportar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emphasis">Productos</h1>
            <p className="text-sm text-gray-400 mt-0.5">Gestiona tu catálogo de productos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleExportTxt}>
            Exportar .txt
          </Button>
          <Link to="/admin/products/new">
            <Button>+ Nuevo producto</Button>
          </Link>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl border border-white/5 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-gray-800 text-gray-300 placeholder-gray-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-gray-800 text-gray-300 min-w-[180px]"
          >
            <option value="">Todas las categorías</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} dark />
      ) : data && data.data.length > 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {data.data.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-gray-700">
                          <img
                            src={
                              product.images?.[0]
                                ? product.images[0].imageUrl
                                : 'https://via.placeholder.com/40x40?text=H'
                            }
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40x40?text=H';
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200 line-clamp-1">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{product.category?.name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-emphasis">
                      ${product.price.toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={product.stock < 5 ? 'danger' : 'default'}>
                        {product.stock}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={product.active ? 'success' : 'danger'}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="sm">Editar</Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(product.id)}
                        >
                          {product.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!text-red-400"
                          onClick={() => setDeleteId(product.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-300">{data.meta.total}</span> producto{data.meta.total !== 1 ? 's' : ''} en total
            </p>
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
              dark
            />
          </div>
        </div>
      ) : (
        <EmptyState
          title="No hay productos"
          message="Crea tu primer producto para empezar."
          actionLabel="Crear producto"
          onAction={() => (window.location.href = '/admin/products/new')}
          dark
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar producto"
        message="¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        loading={deleteProduct.isPending}
        dark
      />
    </div>
  );
}
