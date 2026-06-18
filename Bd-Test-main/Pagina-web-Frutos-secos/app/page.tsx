import React from 'react';
import Link from 'next/link';
import { ArrowRight, Leaf, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { getProductos, getWebPageContent, getCategories } from '@/lib/db';
import { ProductCard } from '@/components/ProductCard';

export const revalidate = 0; // Disable caching to reflect updates immediately

export default async function HomePage() {
  const products = await getProductos();
  // Show first 4 products as featured
  const featuredProducts = products.slice(0, 4);

  // Load dynamic contents from database
  const heroContent = await getWebPageContent('hero');
  const shippingContent = await getWebPageContent('shipping');
  const originContent = await getWebPageContent('natural_origin');
  const secureContent = await getWebPageContent('secure_shopping');
  const aboutUsContent = await getWebPageContent('about_us');

  const dbCats = await getCategories();
  const colors: Record<string, string> = {
    nueces: 'bg-emerald-50 text-primary border-emerald-100',
    almendras: 'bg-amber-50 text-amber-800 border-amber-100',
    anacardos: 'bg-orange-50/50 text-orange-900 border-orange-100/50',
    semillas: 'bg-teal-50 text-teal-800 border-teal-100',
    aceites: 'bg-blue-50/50 text-blue-900 border-blue-100/50',
    harinas: 'bg-purple-50 text-purple-800 border-purple-100',
    endulzantes: 'bg-yellow-50 text-yellow-800 border-yellow-100',
    deshidratados: 'bg-rose-50 text-rose-800 border-rose-100',
  };

  const categories = dbCats.map((c: any) => ({
    name: c.name,
    slug: c.slug,
    desc: c.slug === 'nueces' ? 'Mariposa seleccionadas' 
          : c.slug === 'almendras' ? 'Calibre gigante natural' 
          : c.slug === 'anacardos' ? 'Castañas de cajú premium'
          : c.slug === 'semillas' ? 'Superalimentos naturales'
          : c.slug === 'aceites' ? 'Orgánicos y prensados'
          : 'Selección premium',
    color: colors[c.slug] || 'bg-stone-50 text-stone-800 border-stone-100'
  }));

  return (
    <div className="space-y-24 pb-24 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F4F9F6] via-white to-white py-20 lg:py-32 border-b border-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="space-y-8 max-w-xl">
              <div className="inline-flex items-center space-x-2 bg-mint/30 border border-mint text-primary px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles size={12} />
                <span>{heroContent?.badge || "Calidad de Selección Premium"}</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-6xl font-bold text-dark leading-tight">
                {heroContent?.title ? (
                  heroContent.title
                ) : (
                  <>
                    Alimentación <br />
                    <span className="text-primary italic">pura e inteligente</span> para tu día.
                  </>
                )}
              </h1>
              <p className="text-dark/60 text-base sm:text-lg leading-relaxed">
                {heroContent?.subtitle || "Descubre nuestra variedad de frutos secos a granel y productos envasados orgánicos. 100% natural, sin aditivos, seleccionados a mano para garantizar frescura y calidad superior."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/productos"
                  className="bg-primary text-white hover:bg-accent font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  <span>{heroContent?.button_primary_text || "Ver Catálogo"}</span>
                  <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/productos?filter=nueces"
                  className="bg-white border border-soft text-dark hover:bg-soft font-bold px-8 py-4 rounded-2xl text-center transition-all duration-300"
                >
                  {heroContent?.button_secondary_text || "Ver Nueces Peladas"}
                </Link>
              </div>
            </div>

            {/* Graphic Showcase Frame (No real images by default) */}
            <div className="hidden lg:flex items-center justify-center relative">
              {/* Abstract premium layout */}
              <div className="w-[450px] h-[450px] rounded-3xl bg-soft border border-mint/40 relative flex items-center justify-center p-4 overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-radial from-white via-transparent to-transparent opacity-50" />
                
                {heroContent?.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={heroContent.image_url} alt="Banner Destacado" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  /* Floating SVGs decoration */
                  <div className="w-64 h-64 rounded-full bg-primary/5 flex items-center justify-center p-8 animate-pulse">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-primary fill-current">
                      <path d="M50,15 C72,15 80,35 80,55 C80,75 68,85 50,85 C32,85 20,75 20,55 C20,35 28,15 50,15 Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
                      <path d="M45,25 C30,22 28,45 35,50 C28,52 26,72 45,75 C42,65 40,58 45,50 Z" opacity="0.8" />
                      <path d="M55,25 C70,22 72,45 65,50 C72,52 74,72 55,75 C58,65 60,58 55,50 Z" opacity="0.8" />
                    </svg>
                  </div>
                )}

                {/* Badges in frame */}
                <div className="absolute bottom-10 left-10 bg-white p-4 rounded-2xl shadow-md border border-soft flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary">
                    <Leaf size={20} />
                  </div>
                  <div>
                    <strong className="text-xs text-dark block">100% Orgánico</strong>
                    <span className="text-[10px] text-dark/50">Certificado de origen</span>
                  </div>
                </div>

                <div className="absolute top-10 right-10 bg-white p-4 rounded-2xl shadow-md border border-soft flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <strong className="text-xs text-dark block">Control POS</strong>
                    <span className="text-[10px] text-dark/50">Stock en tiempo real</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dark">Explora por Categorías</h2>
          <p className="text-dark/50 text-sm">
            Encuentra de forma rápida los mejores productos según tus requerimientos diarios.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/productos?filter=${cat.slug}`}
              className="group border border-soft rounded-2xl p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all duration-300 bg-white cursor-pointer h-full"
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${cat.color}`}>
                  <Leaf size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-dark group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-dark/50 mt-1">{cat.desc}</p>
                </div>
              </div>
              <div className="flex items-center text-xs text-primary font-bold mt-6 group-hover:translate-x-1 transition-transform">
                <span>Ver más</span>
                <ArrowRight size={12} className="ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4 max-w-lg">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dark">Productos Destacados</h2>
            <p className="text-dark/50 text-sm">
              Una cuidada selección de frutos secos a granel y envasados de alta demanda y frescura inigualable.
            </p>
          </div>
          <Link
            href="/productos"
            className="flex items-center text-sm font-bold text-primary hover:text-accent border-b border-primary hover:border-accent pb-0.5 transition-colors group"
          >
            <span>Ver todo el catálogo</span>
            <ArrowRight size={14} className="ml-1 transform group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* Services Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-soft/50 border border-soft rounded-3xl p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-soft flex items-center justify-center text-primary flex-shrink-0 shadow-xs">
              <Truck size={22} />
            </div>
            <div>
              <h4 className="font-serif text-base font-bold text-dark">
                {shippingContent?.title || "Despacho Rápido"}
              </h4>
              <p className="text-xs text-dark/50 mt-1 leading-relaxed">
                {shippingContent?.subtitle || "Envío gratuito en Santiago por compras superiores a $25.000. Despachos en 24-48 horas."}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-soft flex items-center justify-center text-primary flex-shrink-0 shadow-xs">
              <Leaf size={22} />
            </div>
            <div>
              <h4 className="font-serif text-base font-bold text-dark">
                {originContent?.title || "Origen Natural"}
              </h4>
              <p className="text-xs text-dark/50 mt-1 leading-relaxed">
                {originContent?.subtitle || "Productos libres de aditivos artificiales, pesticidas y preservantes químicos. 100% natural."}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-soft flex items-center justify-center text-primary flex-shrink-0 shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="font-serif text-base font-bold text-dark">
                {secureContent?.title || "Compra Segura"}
              </h4>
              <p className="text-xs text-dark/50 mt-1 leading-relaxed">
                {secureContent?.subtitle || "Stock y ventas sincronizadas en tiempo real con nuestra tienda física y POS de administración."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
