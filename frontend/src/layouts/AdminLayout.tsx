import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

const navItems = [
  {
    path: '/admin/dashboard',
    label: 'Dashboard',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    path: '/admin/products',
    label: 'Productos',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
  {
    path: '/admin/categories',
    label: 'Categorías',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  },
  {
    path: '/admin/orders',
    label: 'Pedidos',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  },
  {
    path: '/admin/returns',
    label: 'Devoluciones',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  },
  {
    path: '/admin/reviews',
    label: 'Reseñas',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  },
  {
    path: '/admin/users',
    label: 'Usuarios',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>,
  },
];

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLight, setIsLight] = useState(() => user?.theme === 'light');
  useEffect(() => {
    document.documentElement.classList.toggle('light', isLight);
  }, [isLight]);
  useEffect(() => {
    if (user?.theme) setIsLight(user.theme === 'light');
  }, [user?.theme]);
  const navigate = useNavigate();
  const location = useLocation();
  const isActivePath = (path: string) =>
    location.pathname === path ||
    (path !== '/admin/dashboard' && location.pathname.startsWith(path));

  // Cerrar sidebar al navegar en mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div id="admin-root" className="min-h-screen bg-gray-900">
      {/* ─── Mobile header con hamburguesa ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-gray-900 border-b border-gray-800/60 flex items-center px-4 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 text-gray-400 hover:text-emphasis transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-3 font-bold text-sm text-emphasis">Admin</span>
      </div>

      {/* ─── Backdrop (mobile) ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`
          fixed left-0 top-0 w-48 h-screen bg-gray-900 border-r border-gray-800/60 flex flex-col z-30
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="h-12 flex items-center gap-2 px-4 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 flex-1 min-w-0 group">
            <div className="w-7 h-7 bg-gradient-to-br from-accent to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-[10px]">Y</span>
            </div>
            <span className="font-bold text-sm text-emphasis tracking-tight">YARAK</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-emphasis"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'text-emphasis'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-full" />
                )}
                <span className={`flex-shrink-0 transition-colors duration-200 ${
                  isActive
                    ? 'text-accent'
                    : 'text-gray-500 group-hover:text-gray-300'
                }`}>
                  {item.icon}
                </span>
                <span className={isActive ? 'text-emphasis font-medium' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-2 flex-shrink-0 space-y-0.5">
          <Link
            to="/admin/profile"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/50 transition-colors group"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-accent to-teal-600 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shadow-sm flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span className="text-xs font-medium text-gray-400 truncate group-hover:text-emphasis transition-colors">
              {user?.name || 'Admin'}
            </span>
          </Link>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="lg:ml-48 pt-12 lg:pt-0 flex flex-col min-h-screen min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
