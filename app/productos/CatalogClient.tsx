'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, Search, RefreshCcw } from 'lucide-react';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';

interface CatalogClientProps {
  initialProducts: Product[];
  initialCategories: any[];
}

export const CatalogClient: React.FC<CatalogClientProps> = ({ initialProducts, initialCategories }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Selected category from URL query param
  const urlCategory = searchParams.get('filter') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [maxPrice, setMaxPrice] = useState(25000);
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Sync category state with URL parameter changes
  useEffect(() => {
    setSelectedCategory(urlCategory);
  }, [urlCategory]);

  const categories = useMemo(() => {
    return [
      { name: 'Todos', slug: 'all' },
      ...initialCategories.map((c: any) => ({
        name: c.name,
        slug: c.slug
      }))
    ];
  }, [initialCategories]);

  // Calculate price bounds
  const priceRange = useMemo(() => {
    if (initialProducts.length === 0) return { min: 0, max: 25000 };
    const prices = initialProducts.map(p => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [initialProducts]);

  // Initialize slider with max price on mount
  useEffect(() => {
    setMaxPrice(priceRange.max);
  }, [priceRange]);

  // Filter products matching criteria
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // 1. Search term match
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Category match
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      // 3. Price match
      const matchesPrice = product.price <= maxPrice;

      // 4. Stock match
      const matchesStock = !onlyInStock || product.stock > 0;

      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });
  }, [initialProducts, searchTerm, selectedCategory, maxPrice, onlyInStock]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    // Update URL query parameter
    if (cat === 'all') {
      router.push('/productos', { scroll: false });
    } else {
      router.push(`/productos?filter=${cat}`, { scroll: false });
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setMaxPrice(priceRange.max);
    setOnlyInStock(false);
    router.push('/productos', { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <header className="mb-12 space-y-4">
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-dark">Catálogo de Productos</h1>
        <p className="text-dark/50 text-sm max-w-xl">
          Explora nuestra variedad de frutos secos a granel (por kilo) y envasados. Usa los filtros para refinar tu búsqueda.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Filters Sidebar */}
        <aside className="space-y-8 bg-[#FAFAFA] border border-soft p-6 rounded-2xl h-fit">
          <div className="flex justify-between items-center pb-4 border-b border-soft">
            <h3 className="font-serif text-base font-bold text-dark flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-primary" />
              <span>Filtros</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-primary font-bold hover:text-accent flex items-center gap-1 transition-colors"
            >
              <RefreshCcw size={12} />
              <span>Limpiar</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-dark/60 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/40" size={14} />
              <input
                type="text"
                placeholder="Nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-soft bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-dark/60">Precio Máximo</label>
              <span className="text-xs font-bold text-primary">${maxPrice.toLocaleString('es-CL')}</span>
            </div>
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-dark/40">
              <span>${priceRange.min.toLocaleString('es-CL')}</span>
              <span>${priceRange.max.toLocaleString('es-CL')}</span>
            </div>
          </div>

          {/* Availability Checkbox */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-dark/60 block">Disponibilidad</label>
            <label className="flex items-center space-x-3 text-xs text-dark/75 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4.5 h-4.5 rounded-sm border border-soft text-primary focus:ring-primary accent-primary"
              />
              <span>Mostrar solo en stock</span>
            </label>
          </div>
        </aside>

        {/* Catalog Grid Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Category Quick Pills */}
          <div className="flex items-center space-x-2.5 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`text-xs px-4 py-2.5 rounded-full font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-soft text-dark/70 hover:bg-soft/70 hover:text-dark'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center border border-soft border-dashed rounded-2xl">
              <p className="font-serif text-lg font-bold text-dark">No se encontraron productos</p>
              <p className="text-xs text-dark/50 mt-1">
                Intenta ajustar los términos de búsqueda o cambiar los valores de los filtros.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 bg-primary text-white hover:bg-accent font-bold text-xs py-3 px-6 rounded-xl transition-all"
              >
                Restablecer Todo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="animate-fade-in">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
