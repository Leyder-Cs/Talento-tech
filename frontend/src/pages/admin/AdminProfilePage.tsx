import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useUpdatePassword } from '../../hooks/useAuth';
import { Badge } from '../../components/ui/Badge';

export function AdminProfilePage() {
  const { user } = useAuthStore();
  const { mutate: changePassword, isPending } = useUpdatePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) return;
    changePassword({ currentPassword, newPassword });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-accent to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-emphasis">Mi Perfil</h1>
          <p className="text-sm text-gray-400 mt-0.5">Panel de administración</p>
        </div>
      </div>

      <div className="max-w-lg space-y-6">
        {/* ─── Datos personales ─── */}
        <div className="bg-gray-800/50 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-accent to-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-accent/20">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-emphasis">{user?.name}</h2>
              <p className="text-gray-400 mt-0.5">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-3 border-b border-gray-800">
              <span className="text-gray-400">Rol</span>
              <Badge variant="info">Administrador</Badge>
            </div>
          </div>
        </div>

        {/* ─── Cambiar contraseña ─── */}
        <div className="bg-gray-800/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Cambiar contraseña
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Contraseña actual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-emphasis placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-emphasis placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-emphasis placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            {newPassword !== confirmPassword && confirmPassword && (
              <p className="text-xs text-red-400">Las contraseñas no coinciden</p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={isPending || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
