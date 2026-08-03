import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useFeaturedProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { Button } from '../../components/ui/Button';
import { LandingProductCard } from '../../components/landing/LandingProductCard';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { openWhatsApp, DEFAULT_NUMBER } from '../../utils/whatsapp';

const CATEGORY_ICONS: Record<string, string> = {
  Suplementos: '💊',
  Cosmética: '🧴',
  'Cuidado personal': '🧖',
  Infusiones: '🍵',
  Aceites: '🫒',
  'Bienestar': '✨',
};

function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] || '📦';
}

export function LandingPage() {
  const { data: featured, isLoading } = useFeaturedProducts();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const lastManualRef = useRef(0);
  const [pos, setPos] = useState(0);
  const [animate, setAnimate] = useState(false);
  const len = featured?.length || 0;
  const allItems = featured ? [...featured, ...featured, ...featured] : [];
  const step = 272;

  const offset = useCallback((i: number) => {
    if (!containerRef.current) return 0;
    const cw = containerRef.current.offsetWidth;
    return cw / 2 - i * step - 128;
  }, [step]);

  const update = useCallback((next: number) => {
    indexRef.current = next;
    setPos(next);
  }, []);

  const advance = useCallback(() => {
    const next = indexRef.current + 1;
    setAnimate(true);
    update(next);
    if (next < len || next >= len * 2) {
      setTimeout(() => {
        setAnimate(false);
        update(next < len ? next + len : next - len);
      }, 400);
    }
  }, [len, update]);

  const goTo = useCallback((dir: 'left' | 'right') => {
    lastManualRef.current = Date.now();
    const next = indexRef.current + (dir === 'left' ? -1 : 1);
    setAnimate(true);
    update(next);
    if (next < len || next >= len * 2) {
      setTimeout(() => {
        setAnimate(false);
        update(next < len ? next + len : next - len);
      }, 400);
    }
  }, [len, update]);

  useEffect(() => {
    if (len > 0) {
      const start = len + 2;
      indexRef.current = start;
      setPos(start);
    }
  }, [len]);

  useEffect(() => {
    if (len === 0) return;
    const interval = setInterval(() => {
      if (Date.now() - lastManualRef.current < 8000) return;
      advance();
    }, 4000);
    return () => clearInterval(interval);
  }, [len, advance]);

  return (
    <div className="relative">
      {/* ────────────── HERO ────────────── */}
      <section
        className="pt-16 pb-24 lg:pt-20 lg:pb-32 overflow-hidden"
        style={{
          background: `
            linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.05) 100%),
            url('/images/Home/vecteezy_balance-and-wellness-or-health-concept-with-pile-of-black_11484742.jpg') center right / cover no-repeat,
            #000
          `,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          {/* Columna texto */}
          <div>
            <h2 className="text-5xl sm:text-6xl font-bold text-white tracking-tight mb-6">
              Bienestar que <span className="text-accent">se</span><br />
              <span className="text-accent">adapta a ti</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-10">
              En YARAK seleccionamos cuidadosamente cada producto para ofrecerte lo mejor
              en suplementos, cuidado personal y bienestar. Trabajamos con marcas comprometidas
              con la calidad y la eficacia.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/catalog">
                <Button size="lg" className="!bg-accent text-white hover:!bg-accent/90 border-0">
                  Explorar catálogo
                </Button>
              </Link>
              <Button
                size="lg"
                className="!bg-transparent border-2 border-white/20 text-white hover:!bg-white/10"
                  onClick={() => openWhatsApp(`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || DEFAULT_NUMBER}`)}
              >
                Hablar con un asesor
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 sm:gap-6 mt-8 sm:mt-12 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                Envío a toda Colombia
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Coordinación por WhatsApp
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Devoluciones sin complicación
              </span>
            </div>
          </div>

          {/* Columna collage decorativo */}
          <div className="relative h-[520px] hidden lg:block">
            <div
              className="absolute top-8 left-4 w-[250px] h-[320px] flex items-center justify-center text-8xl shadow-2xl -rotate-3 overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #0D9488, #115e59)', borderRadius: '24px 24px 200px 24px' }}
            >
              <img src="/images/Home/beauty.jpg" alt="Cuidado de la piel" className="w-full h-full object-cover" />
            </div>
            <div
              className="absolute top-12 right-0 w-[250px] h-[320px] flex items-center justify-center text-8xl shadow-2xl rotate-3 overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #0f766e, #1a2e2c)', borderRadius: '200px 24px 24px 24px' }}
            >
              <img src="/images/Home/man-wellness.jpg" alt="Bienestar masculino" className="w-full h-full object-cover" />
            </div>
            <div
              className="absolute bottom-6 left-32 w-[210px] h-[210px] border border-white/10 flex items-center justify-center text-6xl shadow-2xl -rotate-2 overflow-hidden"
              style={{ borderRadius: '24px' }}
            >
              <img src="/images/Home/woman-wellness.jpg" alt="Bienestar femenino" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ────────────── CATEGORÍAS ────────────── */}
      <section className="relative py-12 overflow-hidden">
        {/* Background image with blur */}
        <div className="absolute inset-0">
          <img
            src="/images/Home/lucas-calloch-P-yzuyWFEIk-unsplash.jpg"
            alt=""
            className="w-full h-full object-cover blur-xl scale-110"
          />
          <div className="absolute inset-0 bg-base-dark/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight text-center mb-6">
            Explora por categoría
          </h2>
          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-base-dark/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center animate-pulse">
                  <div className="w-10 h-10 bg-white/10 rounded-full mx-auto mb-3" />
                  <div className="h-4 bg-white/10 rounded w-20 mx-auto mb-2" />
                  <div className="h-3 bg-white/10 rounded w-14 mx-auto" />
                </div>
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="relative grid grid-cols-2 md:grid-cols-3 gap-4">
              <Link
                to="/catalog"
                className="absolute -top-8 right-0 inline-flex items-center gap-1 text-sm font-medium text-white/50 hover:text-white transition-colors"
              >
                Ver más
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              {(() => {
                const parentCategories = categories?.filter(cat => !cat.parentId) || categories || [];
                return parentCategories.slice(0, 6).map((cat) => (
                <div
                  key={cat.id}
                  className="relative bg-base-dark/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center hover:bg-base-dark/70 hover:border-white/20 transition-all duration-200 group"
                >
                  <Link
                    to={`/catalog?category=${cat.slug}`}
                    className="block"
                  >
                  {cat.imageUrl ? (
                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/20 group-hover:scale-110 transition-all duration-200">
                      <img
                        src={`${import.meta.env.VITE_API_URL}/uploads/category-image/${cat.id}`}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
                      {getCategoryIcon(cat.name)}
                    </span>
                  )}
                  <p className="text-white font-medium text-sm">{cat.name}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {cat._count?.products ?? 0} productos
                  </p>
                  </Link>
                </div>
              ));
              })()}
            </div>
          ) : (
            <p className="text-gray-400 text-center">No hay categorías disponibles.</p>
          )}
        </div>
      </section>

      {/* ────────────── MÁS VENDIDOS ────────────── */}
      <section className="py-8 lg:py-12" style={{ backgroundColor: 'rgb(var(--mas-vendidos-bg))' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3 text-center">Productos</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emphasis tracking-tight mb-8 text-center">
            Más vendidos
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="relative" ref={containerRef}>
              <Link
                to="/catalog"
                className="absolute -top-7 right-0 inline-flex items-center gap-1 text-sm font-medium text-emphasis hover:text-emphasis/70 transition-colors z-10"
              >
                Ver más productos
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <button
                onClick={() => goTo('left')}
                className="absolute left-1 sm:left-0 top-1/2 -translate-y-1/2 z-20 text-gray-400 hover:text-emphasis transition"
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => goTo('right')}
                className="absolute right-1 sm:right-0 top-1/2 -translate-y-1/2 z-20 text-gray-400 hover:text-emphasis transition"
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="overflow-hidden p-4">
                <div
                  ref={trackRef}
                  className="flex gap-4"
                  style={{
                    transform: `translateX(${offset(pos)}px)`,
                    transition: animate ? 'transform 400ms ease-in-out' : 'none',
                  }}
                >
                  {(() => {
                    const cw = containerRef.current?.offsetWidth ?? 0;
                    const startX = cw / 2 - pos * step - 128;
                    return allItems.map((product, i) => {
                      const dist = Math.abs(i - pos);
                      let scaleVal: number;
                      if (dist === 0) scaleVal = 1;
                      else if (dist === 1) scaleVal = 0.92;
                      else scaleVal = 0.85;
                      let opacityVal: number;
                      if (dist === 0) opacityVal = 1;
                      else if (dist === 1) opacityVal = 0.9;
                      else opacityVal = 0.6;
                      const dir = Math.sign(i - pos);
                      let translateVal = 0;
                      if (dist === 1) translateVal = -dir * 10.24;
                      else if (dist >= 2) translateVal = -dir * 39.68;
                      return (
                        <div
                          key={`${product.id}-${i}`}
                          className="flex-shrink-0 w-64"
                          style={{
                            transform: `translateX(${translateVal}px) scale(${scaleVal})`,
                            opacity: opacityVal,
                            transition: animate ? 'transform 400ms ease-in-out, opacity 400ms ease-in-out' : 'none',
                          }}
                        >
                          <LandingProductCard product={product} simplified />
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center">No hay productos destacados en este momento.</p>
          )}
        </div>
      </section>

      {/* ────────────── NUESTRA HISTORIA ────────────── */}
      <section className="relative py-24 overflow-hidden">
        {/* Background image with blur */}
        <div className="absolute inset-0">
          <img
            src="/images/Home/adrien-hobbs-N4V229Gz07Y-unsplash.jpg"
            alt=""
            className="w-full h-full object-cover blur-md scale-110"
          />
          <div className="absolute inset-0 bg-base-dark/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <div className="hidden lg:flex items-center justify-center">
            <div className="w-72 h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src="/images/Home/vecteezy_lemon-for-beauty-and-health-beautiful-healthy-young-woman_7485899.jpg"
                alt="Cuidado personal"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">Nuestra historia</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
              Comprometidos con tu bienestar
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              En YARAK creemos que el cuidado personal es la base de una vida plena.
              Por eso trabajamos incansablemente para ofrecerte productos de la más alta
              calidad, seleccionados con rigor y respaldados por marcas de confianza.
            </p>
          </div>
        </div>
      </section>

      {/* ────────────── HECHO PARA TI ────────────── */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: 'rgb(var(--mas-vendidos-bg))' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">Por qué elegirnos</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-emphasis tracking-tight mb-10">
            Hecho para ti
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: '01',
                title: 'Calidad',
                desc: 'Seleccionamos productos que cumplen con los más altos estándares.',
              },
              {
                number: '02',
                title: 'Variedad',
                desc: 'Encuentra desde suplementos hasta cosmética en un solo lugar.',
              },
              {
                number: '03',
                title: 'Comodidad',
                desc: 'Pide por catálogo y recibe en la puerta de tu casa.',
              },
            ].map((item, i) => (
              <div key={i} className="p-8">
                <span className="text-5xl font-bold text-emphasis/20">{item.number}</span>
                <h3 className="text-xl font-semibold text-emphasis mt-4 mb-2">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────── CTA ────────────── */}
      <section className="py-8 lg:py-12" style={{ backgroundColor: 'rgb(var(--mas-vendidos-bg))' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-accent p-6 sm:p-12 lg:p-16 text-center shadow-xl">
            <div className="relative z-10">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-white/70">Contacto</p>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight text-white">
                ¿Listo para empezar?
              </h2>
              <p className="text-white/80 mb-10 max-w-xl mx-auto text-lg">
                Contáctanos por WhatsApp para recibir asesoría personalizada.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/catalog">
                  <Button size="lg" className="!bg-white !text-accent hover:!bg-white/90 border-0">
                    Ver catálogo completo
                  </Button>
                </Link>
                <Button
                  size="lg"
                  className="!bg-transparent border-2 border-white text-white hover:!bg-white/10"
                onClick={() => openWhatsApp(`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || DEFAULT_NUMBER}`)}
                >
                  Contactar por WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
