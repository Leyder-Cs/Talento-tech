import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useCartStore } from '../store/cart.store';
import { Button } from '../components/ui/Button';
import { CartDrawer } from '../components/cart/CartDrawer';
import { CategoryTreeContent } from '../components/catalog/CategoryTreeContent';
import { HorizontalFilters } from '../components/catalog/HorizontalFilters';

export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isLight, setIsLight] = useState(() => user?.theme === 'light');
  useEffect(() => {
    document.documentElement.classList.toggle('light', isLight);
  }, [isLight]);
  // Sincronizar isLight cuando el backend cambia el tema (ProfilePage)
  useEffect(() => {
    if (user?.theme) setIsLight(user.theme === 'light');
  }, [user?.theme]);
  // Sincronizar isLight cuando otra pestaña o componente cambia la clase en <html>
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const lightNow = document.documentElement.classList.contains('light');
      setIsLight(lightNow);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const totalItems = useCartStore((s) => s.getTotalItems());
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isCatalog = location.pathname.startsWith('/catalog');
  const isActive = (path: string) => location.pathname === path;

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  // Sincronizar input desde la URL al entrar a catálogo
  useEffect(() => {
    setSearchValue(searchParams.get('search') || '');
  }, [location.pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        if (searchValue) prev.set('search', searchValue);
        else prev.delete('search');
        return prev;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // ─── Dropdown de categorías ───
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const catBtnRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [catDdLeft, setCatDdLeft] = useState(-9999);

  useEffect(() => {
    if (categoriesOpen && catBtnRef.current && headerRef.current) {
      const btn = catBtnRef.current.getBoundingClientRect();
      const container = headerRef.current.getBoundingClientRect();
      setCatDdLeft(btn.left - container.left);
    }
  }, [categoriesOpen]);

  const handleSelectCategory = (slug: string) => {
    setSearchParams((prev) => {
      prev.set('category', slug);
      prev.set('page', '1');
      return prev;
    });
    setCategoriesOpen(false);
  };

  const handleClearCategory = () => {
    setSearchParams((prev) => {
      prev.delete('category');
      prev.set('page', '1');
      return prev;
    });
    setCategoriesOpen(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className={isCatalog
        ? 'sticky top-0 z-40 w-full transition-all duration-300 bg-gray-900 border-b border-gray-800'
        : `${isHome || isAuthPage ? 'fixed' : 'sticky'} top-0 z-40 w-full transition-all duration-300 ${
            (isHome || isAuthPage) && !scrolled
              ? 'bg-transparent'
              : isHome
                ? 'bg-gray-900/40 backdrop-blur-md'
                : scrolled
                  ? 'bg-gray-900/40 backdrop-blur-md border-b border-gray-700/50'
                  : 'bg-gray-900 border-b border-gray-800'
          }`
      }>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={headerRef} className="relative">
            {/* ─── Fila 1: logo, search, nav links ─── */}
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className={`font-bold text-xl ${isHome && !scrolled ? 'text-white' : 'text-emphasis'}`}>L-Health</span>
              </Link>

              {/* Search bar — visible solo en /catalog */}
              {isCatalog && (
                <div className="flex-1 max-w-xl mx-2 md:mx-4">
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Buscar productos..."
                      className="w-full pl-10 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-emphasis focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent placeholder-gray-500"
                    />
                  </div>
                </div>
              )}

              <div className="hidden md:flex items-center gap-2 ml-auto">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/catalog"
                      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        isActive('/catalog')
                          ? isHome && !scrolled ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'
                          : isHome && !scrolled
                            ? 'text-white/80 hover:text-white'
                            : 'text-gray-400 hover:text-emphasis hover:ring-1 hover:ring-gray-600/50'
                      }`}
                    >
                      Catálogo
                    </Link>
                    <button
                        onClick={() => setCartOpen(true)}
                        className={`relative p-2 transition-colors ${
                          isHome && !scrolled
                            ? 'text-white/80 hover:text-white'
                            : 'text-gray-400 hover:text-emphasis'
                        }`}
                        aria-label="Abrir carrito"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                        {totalItems > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {totalItems}
                          </span>
                        )}
                      </button>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin/dashboard"
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                          isActive('/admin/dashboard')
                            ? isHome && !scrolled ? 'text-white ring-1 ring-white/30' : 'text-emphasis ring-1 ring-accent'
                            : isHome && !scrolled
                              ? 'text-white/80 hover:text-white'
                              : 'text-gray-400 hover:text-emphasis hover:ring-1 hover:ring-gray-600/50'
                        }`}
                      >
                        Admin
                      </Link>
                    )}
                    {/* ─── User dropdown ─── */}
                    <div className="relative">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 hover:bg-white/5"
                      >
                        <div className="w-6 h-6 bg-gradient-to-br from-accent to-teal-600 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <svg
                          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {userMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                          <div className="absolute right-0 top-full mt-1 z-40 bg-gray-900 border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[170px] overflow-hidden">
                            <Link
                              to="/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-emphasis hover:bg-white/5 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Mi perfil
                            </Link>
                            <div className="border-t border-white/10 my-1" />
                            <button
                              onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Cerrar sesión
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to="/catalog"
                      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        isActive('/catalog')
                          ? isHome && !scrolled ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'
                          : isHome && !scrolled
                            ? 'text-white/80 hover:text-white'
                            : 'text-gray-400 hover:text-emphasis hover:ring-1 hover:ring-gray-600/50'
                      }`}
                    >
                      Catálogo
                    </Link>
                    <span className={`text-xs font-medium ${isHome && !scrolled ? 'text-white/70' : 'text-gray-400'}`}>
                      ¿Ya tienes cuenta?
                    </span>
                    <Link
                      to="/login"
                      className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-all duration-200 ${
                        isActive('/login')
                          ? 'bg-accent text-white'
                          : isHome && !scrolled
                            ? 'bg-accent/90 text-white hover:bg-accent'
                            : 'bg-accent text-white hover:bg-accent/90'
                      }`}
                    >
                      Ingresar
                    </Link>
                    <Link
                      to="/register"
                      className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-all duration-200 ${
                        isActive('/register')
                          ? 'bg-accent text-white'
                          : isHome && !scrolled
                            ? 'bg-accent/90 text-white hover:bg-accent'
                            : 'bg-accent text-white hover:bg-accent/90'
                      }`}
                    >
                      Registrarse
                    </Link>
                  </>
                )}

                <button
                  className={`md:hidden p-2 ${isHome && !scrolled ? 'text-white' : 'text-emphasis'}`}
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* ─── Fila 2: categorías (solo catálogo) ─── */}
            {isCatalog && (
              <div className="border-t border-gray-800 py-1.5 flex items-center gap-4">
                <button
                  ref={catBtnRef}
                  onClick={() => setCategoriesOpen(p => !p)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-emphasis transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Categorías
                  <svg
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}

            {/* ─── Categories dropdown ─── */}
            {isCatalog && (
              <div
                className={`absolute z-[36] bg-gray-900 border border-white/10 rounded-b-xl shadow-2xl overflow-hidden max-h-[70vh] min-w-[280px] sm:min-w-[400px] w-[calc(100vw-2rem)] sm:w-[720px] max-w-[calc(100vw-2rem)] origin-top transition-all duration-200 ease-out ${
                  categoriesOpen
                    ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-y-0 -translate-y-2 pointer-events-none'
                }`}
                style={{ top: '100%', left: catDdLeft }}
              >
                <CategoryTreeContent
                  selectedCategory={searchParams.get('category') || ''}
                  onSelectCategory={handleSelectCategory}
                  onClear={handleClearCategory}
                  onClose={() => setCategoriesOpen(false)}
                  variant="split"
                />
              </div>
            )}

          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-700/50 bg-gray-900">
            <div className="px-4 py-4 space-y-3">
              <Link
                to="/catalog"
                className={`block text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  isActive('/catalog')
                    ? 'text-emphasis ring-1 ring-accent'
                    : 'text-gray-400 hover:text-emphasis hover:ring-1 hover:ring-gray-600/50'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                Catálogo
              </Link>
              <button
                onClick={() => { setCartOpen(true); setMobileOpen(false); }}
                className="block w-full text-left text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 text-gray-400 hover:text-emphasis hover:ring-1 hover:ring-gray-600/50"
              >
                Carrito ({totalItems})
              </button>
              {isAuthenticated ? (
                <>
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin/dashboard"
                      className={`block text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        isActive('/admin/dashboard')
                          ? 'text-emphasis ring-1 ring-accent'
                          : 'text-gray-400 hover:text-emphasis hover:ring-1 hover:ring-gray-600/50'
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      Panel Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 text-red-400 hover:ring-1 hover:ring-red-400/30"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <div className="pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-2">¿Ya tienes cuenta?</p>
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      className="flex-1 text-center text-sm font-medium px-3 py-2 rounded-lg text-gray-400 hover:text-emphasis hover:ring-1 hover:ring-gray-600/50 transition-all duration-200"
                      onClick={() => setMobileOpen(false)}
                    >
                      Inicia sesión
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 text-center text-sm font-medium px-3 py-2 rounded-lg text-gray-400 hover:text-emphasis hover:ring-1 hover:ring-gray-600/50 transition-all duration-200"
                      onClick={() => setMobileOpen(false)}
                    >
                      Regístrate
                    </Link>
                  </div>
                </div>
                )}

              </div>
          </div>
        )}
      </header>

      {/* ─── Backdrop (categorías/filtros) ─── */}
      <div
        className={`fixed inset-0 bg-black/60 z-[25] transition-opacity duration-200 ${
          categoriesOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setCategoriesOpen(false)}
      />

      <main className="flex-1">
        <Outlet />
      </main>

      {!isAuthPage && (
      <footer className="bg-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="font-bold text-xl">L-Health</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Tu tienda de productos para la salud y el bienestar.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Enlaces rápidos</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/catalog" className="text-white/70 hover:text-white text-sm transition-colors">
                    Catálogo
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setCartOpen(true)}
                    className="text-white/70 hover:text-white text-sm transition-colors text-left"
                  >
                    Carrito
                  </button>
                </li>
                <li>
                  <Link to="/login" className="text-white/70 hover:text-white text-sm transition-colors">
                    Mi cuenta
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contacto</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li>📱 WhatsApp: +57 3132901638 </li>
                <li>✉️ Correo: leydersalazar.007@gmail.com</li>
                <li>📍 Mocoa - Putumayo</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/50 text-sm">
            <p>&copy; {new Date().getFullYear()} L-Health. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
      )}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
