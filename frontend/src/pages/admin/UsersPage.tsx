import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '../../services/users.service';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Skeleton } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => usersService.findAll(page, 10),
  });

  const handleBlock = async (id: string) => {
    try {
      await usersService.toggleBlock(id);
      toast.success('Estado actualizado');
      refetch();
    } catch {
      toast.error('Error al actualizar');
    }
    setBlockId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await usersService.remove(deleteId);
      toast.success('Usuario eliminado');
      refetch();
    } catch {
      toast.error('Error al eliminar');
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-emphasis">Usuarios</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestiona los usuarios registrados</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" dark />
      ) : data && data.data.length > 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registro</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {data.data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center text-sm font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-200">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={user.role === 'ADMIN' ? 'info' : 'default'}>
                        {user.role === 'ADMIN' ? 'Admin' : 'Usuario'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={user.blocked ? 'danger' : 'success'}>
                        {user.blocked ? 'Bloqueado' : 'Activo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-center">
                      {new Date(user.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBlockId(user.id)}
                        >
                          {user.blocked ? 'Desbloquear' : 'Bloquear'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!text-red-400"
                          onClick={() => setDeleteId(user.id)}
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
          {data.meta && (
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-300">{data.meta.total}</span> usuario{data.meta.total !== 1 ? 's' : ''} en total
              </p>
              <Pagination
                page={data.meta.page}
                totalPages={data.meta.totalPages}
                onPageChange={setPage}
                dark
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 bg-gray-800/50 rounded-xl border border-white/5">
          No hay usuarios registrados.
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar usuario"
        message="¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        dark
      />
    </div>
  );
}
