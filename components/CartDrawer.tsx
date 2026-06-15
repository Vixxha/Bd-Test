'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { ProductVisual } from './ProductVisual';

export const CartDrawer: React.FC = () => {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartTotal,
  } = useCart();

  const handleAdjustQty = (productId: string, currentQty: number, delta: number, sellType: 'unit' | 'weight') => {
    const step = sellType === 'weight' ? 0.100 : 1;
    const newQty = Math.max(0, currentQty + delta * step);
    if (newQty === 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, Number(newQty.toFixed(3)));
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-xs cursor-pointer"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sliding Sheet */}
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col justify-between transition-transform duration-300 transform ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-soft flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <ShoppingBag size={20} className="text-primary" />
            <h3 className="font-serif text-lg font-bold text-dark">Mi Carrito</h3>
            {cart.length > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-xl hover:bg-soft text-dark/70 hover:text-dark transition-all duration-300"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
              <div className="w-16 h-16 rounded-full bg-soft flex items-center justify-center text-dark/30">
                <ShoppingBag size={28} />
              </div>
              <div>
                <p className="font-serif text-lg font-bold text-dark">El carrito está vacío</p>
                <p className="text-xs text-dark/50 mt-1 max-w-xs mx-auto">
                  Agrega deliciosos frutos secos o envasados desde nuestro catálogo.
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 bg-primary text-white hover:bg-accent font-bold text-xs py-3 px-6 rounded-xl transition-all duration-300"
              >
                Volver a la Tienda
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center space-x-4 p-3 rounded-2xl border border-soft hover:border-primary/20 transition-all duration-300"
              >
                {/* Visual */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-soft flex-shrink-0 flex items-center justify-center">
                  <ProductVisual slug={item.product.image_url} size="sm" />
                </div>

                {/* Info & Adjustments */}
                <div className="flex-grow min-w-0">
                  <h4 className="font-serif text-sm font-bold text-dark truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-[10px] text-dark/50 mt-0.5">
                    ${item.product.price.toLocaleString('es-CL')}/{item.product.sell_type === 'weight' ? 'Kg' : 'ud'}
                  </p>

                  <div className="flex items-center justify-between mt-2.5">
                    {/* Qty button panel */}
                    <div className="flex items-center border border-soft rounded-lg bg-soft/50">
                      <button
                        onClick={() => handleAdjustQty(item.product.id, item.quantity, -1, item.product.sell_type)}
                        className="p-1 text-dark/60 hover:text-dark focus:outline-none"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold text-dark px-2 min-w-[32px] text-center">
                        {item.product.sell_type === 'weight' ? `${item.quantity} kg` : item.quantity}
                      </span>
                      <button
                        onClick={() => handleAdjustQty(item.product.id, item.quantity, 1, item.product.sell_type)}
                        className="p-1 text-dark/60 hover:text-dark focus:outline-none"
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <span className="text-sm font-bold text-dark text-right">
                      ${Math.round(item.product.price * item.quantity).toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 rounded-xl text-dark/40 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-soft bg-white sticky bottom-0 z-10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-dark/60 font-semibold uppercase tracking-wider">Subtotal</span>
              <strong className="text-2xl font-bold text-dark">
                ${cartTotal.toLocaleString('es-CL')}
              </strong>
            </div>

            <p className="text-[10px] text-dark/40">
              * El costo de despacho se calcula al momento del checkout.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/carrito"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 px-4 rounded-xl border border-soft text-dark hover:bg-soft text-center font-bold text-xs transition-all duration-300"
              >
                Ver Carrito
              </Link>
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-primary text-white hover:bg-accent text-center font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <span>Checkout</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
