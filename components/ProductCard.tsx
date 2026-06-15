'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { ProductVisual } from './ProductVisual';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const isOutOfStock = product.stock <= 0;

  // Format category name for badges
  const formatCategory = (cat: string) => {
    switch (cat) {
      case 'almendras': return 'Almendras';
      case 'nueces': return 'Nueces';
      case 'pistachos': return 'Pistachos';
      case 'anacardos': return 'Anacardos';
      case 'semillas': return 'Semillas';
      case 'harinas': return 'Harinas';
      case 'aceites': return 'Aceites';
      case 'endulzantes': return 'Endulzantes';
      case 'deshidratados': return 'Deshidratados';
      case 'cremas': return 'Cremas';
      default: return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page when clicking button
    if (isOutOfStock) return;
    
    // Add 1 unit for envasado, or 250g (0.250 Kg) default for bulk
    const quantityToAdd = product.sell_type === 'weight' ? 0.250 : 1;
    addToCart(product, quantityToAdd);
  };

  return (
    <div className="group bg-white rounded-2xl border border-soft p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative h-full">
      <Link href={`/producto/${product.id}`} className="block flex-grow cursor-pointer">
        {/* Category Badge */}
        <div className="absolute top-6 left-6 z-10">
          <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full bg-white text-primary border border-soft shadow-sm">
            {formatCategory(product.category)}
          </span>
        </div>

        {/* Product Visual */}
        <div className="aspect-square w-full rounded-xl overflow-hidden flex items-center justify-center bg-soft relative mb-4">
          <ProductVisual
            slug={product.image_url}
            className="w-full h-full transform group-hover:scale-105 transition-transform duration-300"
            size="lg"
          />
        </div>

        {/* Info */}
        <div className="space-y-1.5">
          <h3 className="font-serif text-lg font-bold text-dark group-hover:text-primary transition-colors duration-300 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-dark/50 text-xs line-clamp-2 min-h-[2rem] leading-relaxed">
            {product.description}
          </p>

          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-xs text-dark/40 block">Precio</span>
              <strong className="text-xl font-bold text-dark">
                ${product.price.toLocaleString('es-CL')}
                <span className="text-[10px] font-normal text-dark/50">
                  /{product.sell_type === 'weight' ? 'Kg' : 'ud'}
                </span>
              </strong>
            </div>

            {/* Stock status */}
            <div className="text-right">
              {isOutOfStock ? (
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                  Agotado
                </span>
              ) : product.stock <= 5 ? (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                  Stock bajo
                </span>
              ) : (
                <span className="text-[10px] font-bold text-primary bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  Disponible
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Cart Actions */}
      <div className="pt-4 border-t border-soft mt-4">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 ${
            isOutOfStock
              ? 'bg-soft text-dark/30 cursor-not-allowed border border-soft'
              : 'bg-primary text-white hover:bg-accent hover:shadow-md'
          }`}
        >
          <ShoppingCart size={14} />
          <span>
            {product.sell_type === 'weight'
              ? 'Agregar 250g (Granel)'
              : 'Agregar al carrito'}
          </span>
        </button>
      </div>
    </div>
  );
};
