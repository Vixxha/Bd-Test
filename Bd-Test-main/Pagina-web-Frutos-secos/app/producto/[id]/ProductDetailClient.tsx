'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, ShieldCheck, Scale, Star, ArrowLeft } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { ProductVisual } from '@/components/ProductVisual';

interface ProductDetailClientProps {
  product: Product;
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(product.sell_type === 'weight' ? 0.250 : 1);
  const isOutOfStock = product.stock <= 0;

  const handleAdjustQty = (delta: number) => {
    if (product.sell_type === 'weight') {
      // Adjust by 100g (0.1 Kg)
      const newQty = Math.max(0.100, quantity + delta * 0.100);
      setQuantity(Number(Math.min(product.stock, newQty).toFixed(3)));
    } else {
      // Adjust by 1 unit
      const newQty = Math.max(1, quantity + delta);
      setQuantity(Math.min(product.stock, newQty));
    }
  };

  const handleWeightShortcut = (grams: number) => {
    const kg = grams / 1000;
    setQuantity(Math.min(product.stock, kg));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-dark/40 mb-10">
        <Link href="/" className="hover:text-primary transition-colors">
          Inicio
        </Link>
        <ChevronRight size={12} />
        <Link href="/productos" className="hover:text-primary transition-colors">
          Productos
        </Link>
        <ChevronRight size={12} />
        <span className="text-dark/80 font-medium truncate max-w-[150px] sm:max-w-xs">{product.name}</span>
      </nav>

      {/* Main product view grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left Column: Visual Container */}
        <div className="flex flex-col items-center justify-center bg-soft/40 border border-soft rounded-3xl p-8 aspect-square max-h-[500px]">
          <ProductVisual slug={product.image_url} size="xl" className="w-full h-full max-w-sm max-h-sm" />
        </div>

        {/* Right Column: Detailed Product Info */}
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full">
                {product.category}
              </span>
              <span className="text-xs text-dark/45 font-mono">SKU: {product.sku}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dark">{product.name}</h1>

            {/* Stars / Ratings */}
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < Math.floor(product.rating || 5) ? 'currentColor' : 'none'}
                    className="stroke-current"
                  />
                ))}
              </div>
              <span className="font-bold text-dark">{product.rating || 5.0}</span>
              <span className="text-dark/40">({product.reviews_count || 0} reviews)</span>
            </div>
          </div>

          {/* Pricing Block */}
          <div className="bg-soft/30 border border-soft rounded-2xl p-5 flex justify-between items-center">
            <div>
              <span className="text-xs text-dark/40 block">Precio por {product.sell_type === 'weight' ? 'Kilogramo' : 'Unidad'}</span>
              <strong className="text-3xl font-serif font-bold text-primary">
                ${product.price.toLocaleString('es-CL')}
                <span className="text-xs font-sans font-normal text-dark/50">
                  /{product.sell_type === 'weight' ? 'Kg' : 'ud'}
                </span>
              </strong>
            </div>

            <div>
              {isOutOfStock ? (
                <span className="text-xs font-bold text-red-500 bg-red-50 px-3.5 py-1.5 rounded-full border border-red-100">
                  Sin Stock disponible
                </span>
              ) : (
                <span className="text-xs font-bold text-primary bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
                  En Stock: {product.stock} {product.sell_type === 'weight' ? 'Kg' : 'uds'}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark/50">Descripción</h4>
            <p className="text-dark/70 text-sm leading-relaxed">{product.description}</p>
          </div>

          {/* Quantity Selector & Checkout Actions */}
          {!isOutOfStock && (
            <div className="space-y-4 pt-4 border-t border-soft">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Quantity adjuster */}
                <div className="space-y-2 flex-grow sm:flex-grow-0">
                  <label className="text-xs font-bold uppercase tracking-wider text-dark/50 block">Cantidad</label>
                  <div className="flex items-center border border-soft rounded-xl bg-soft/40 h-[52px] w-full sm:w-fit justify-between sm:justify-start">
                    <button
                      onClick={() => handleAdjustQty(-1)}
                      className="p-3 text-dark/60 hover:text-dark focus:outline-none"
                    >
                      <MinusIcon />
                    </button>
                    <span className="text-sm font-bold text-dark px-4 min-w-[70px] text-center">
                      {product.sell_type === 'weight' ? `${quantity.toFixed(3)} Kg` : quantity}
                    </span>
                    <button
                      onClick={() => handleAdjustQty(1)}
                      className="p-3 text-dark/60 hover:text-dark focus:outline-none"
                      disabled={quantity >= product.stock}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>

                {/* Add to Cart button */}
                <div className="flex-grow flex items-end h-[52px]">
                  <button
                    onClick={handleAddToCart}
                    className="w-full h-full bg-primary hover:bg-accent text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <ShoppingCart size={16} />
                    <span>Agregar al carrito - ${(product.price * quantity).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                  </button>
                </div>
              </div>

              {/* Weight shortcuts */}
              {product.sell_type === 'weight' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-dark/40 flex items-center gap-1">
                    <Scale size={12} className="text-primary" />
                    <span>Atajos Rápidos de Pesaje</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[100, 250, 500, 1000].map((grams) => (
                      <button
                        key={grams}
                        type="button"
                        onClick={() => handleWeightShortcut(grams)}
                        className={`text-[10px] font-bold px-3.5 py-2 rounded-lg border transition-all cursor-pointer ${
                          quantity === grams / 1000
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-dark/70 border-soft hover:bg-soft'
                        }`}
                      >
                        {grams >= 1000 ? '1 Kg' : `${grams}g`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nutritional Info Drawer (Unstructured Data) */}
          {product.nutrition && (
            <div className="pt-6 border-t border-soft space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-dark/50">Información Nutricional (por 100g)</h4>
              <div className="bg-soft/40 border border-soft rounded-2xl p-5 grid grid-cols-5 gap-3 text-center">
                <div>
                  <strong className="text-lg font-serif font-bold text-dark block">{product.nutrition.calories}</strong>
                  <span className="text-[9px] text-dark/50 uppercase tracking-wider font-semibold">Calorías</span>
                </div>
                <div>
                  <strong className="text-lg font-serif font-bold text-dark block">{product.nutrition.protein}g</strong>
                  <span className="text-[9px] text-dark/50 uppercase tracking-wider font-semibold">Proteína</span>
                </div>
                <div>
                  <strong className="text-lg font-serif font-bold text-dark block">{product.nutrition.carbohydrates}g</strong>
                  <span className="text-[9px] text-dark/50 uppercase tracking-wider font-semibold">Carbs</span>
                </div>
                <div>
                  <strong className="text-lg font-serif font-bold text-dark block">{product.nutrition.fat}g</strong>
                  <span className="text-[9px] text-dark/50 uppercase tracking-wider font-semibold">Grasas</span>
                </div>
                <div>
                  <strong className="text-lg font-serif font-bold text-dark block">{product.nutrition.fiber}g</strong>
                  <span className="text-[9px] text-dark/50 uppercase tracking-wider font-semibold">Fibra</span>
                </div>
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-soft text-xs">
            {product.origin && (
              <div>
                <span className="text-dark/45 block mb-1">Origen del producto</span>
                <strong className="text-dark font-medium">{product.origin}</strong>
              </div>
            )}
            {product.packaging_info && (
              <div>
                <span className="text-dark/45 block mb-1">Empaque</span>
                <strong className="text-dark font-medium">{product.packaging_info}</strong>
              </div>
            )}
            {product.allergens && product.allergens.length > 0 && (
              <div className="col-span-2">
                <span className="text-dark/45 block mb-1">Declaración de Alérgenos</span>
                <strong className="text-red-600 font-medium">
                  Contiene o puede contener trazas de: {product.allergens.join(', ')}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Back to catalog link */}
      <div className="mt-16 pt-8 border-t border-soft">
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-accent group"
        >
          <ArrowLeft size={14} className="transform group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al Catálogo general</span>
        </Link>
      </div>
    </div>
  );
};

// Simple icon helpers to reduce external dependency bundle overhead
const MinusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
