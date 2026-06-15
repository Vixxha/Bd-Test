'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowLeft, ArrowRight, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { ProductVisual } from '@/components/ProductVisual';

export default function CartPage() {
  const {
    cart,
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

  // Despacho rules in Chile: Free above 25.000, otherwise 3.500
  const shippingCost = cart.length === 0 ? 0 : cartTotal >= 25000 ? 0 : 3500;
  const orderTotal = cartTotal + shippingCost;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
      <header className="mb-12">
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-dark">Tu Carrito de Compra</h1>
        <p className="text-dark/50 text-xs mt-1">Revisa los productos seleccionados antes de confirmar tu orden.</p>
      </header>

      {cart.length === 0 ? (
        <div className="border border-soft rounded-2xl py-24 px-8 text-center bg-white max-w-xl mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-soft flex items-center justify-center text-dark/30 mx-auto">
            <ShoppingBag size={36} />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-dark">El carrito está vacío</h2>
            <p className="text-xs text-dark/50 mt-1.5 leading-relaxed">
              No tienes ningún fruto seco o producto agregado a tu carrito. ¡Explora nuestro catálogo con excelentes ofertas!
            </p>
          </div>
          <Link
            href="/productos"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white hover:bg-accent font-bold text-xs py-3.5 px-8 rounded-xl transition-all duration-300 shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Ir al Catálogo</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 px-4 text-xs font-bold uppercase tracking-wider text-dark/40 border-b border-soft">
              <div className="col-span-6">Producto</div>
              <div className="col-span-3 text-center">Cantidad</div>
              <div className="col-span-3 text-right">Total</div>
            </div>

            {cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-white rounded-2xl border border-soft p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:border-primary/20 transition-all duration-300"
              >
                {/* Product Info */}
                <div className="col-span-1 md:col-span-6 flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-soft flex-shrink-0 flex items-center justify-center">
                    <ProductVisual slug={item.product.image_url} size="sm" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-dark">{item.product.name}</h3>
                    <p className="text-[10px] text-dark/45 mt-0.5">SKU: {item.product.sku}</p>
                    <p className="text-xs font-bold text-primary mt-1 md:hidden">
                      ${item.product.price.toLocaleString('es-CL')}/{item.product.sell_type === 'weight' ? 'Kg' : 'ud'}
                    </p>
                  </div>
                </div>

                {/* Adjuster */}
                <div className="col-span-1 md:col-span-3 flex justify-start md:justify-center">
                  <div className="flex items-center border border-soft rounded-lg bg-soft/40 h-[38px]">
                    <button
                      onClick={() => handleAdjustQty(item.product.id, item.quantity, -1, item.product.sell_type)}
                      className="p-2 text-dark/60 hover:text-dark focus:outline-none"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-bold text-dark px-3 min-w-[50px] text-center">
                      {item.product.sell_type === 'weight' ? `${item.quantity} Kg` : item.quantity}
                    </span>
                    <button
                      onClick={() => handleAdjustQty(item.product.id, item.quantity, 1, item.product.sell_type)}
                      className="p-2 text-dark/60 hover:text-dark focus:outline-none"
                      disabled={item.quantity >= item.product.stock}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="col-span-1 md:col-span-3 flex md:flex-col justify-between md:items-end items-center">
                  <span className="text-[10px] uppercase font-bold text-dark/30 md:hidden">Subtotal</span>
                  <div className="flex items-center space-x-3.5">
                    <strong className="text-sm font-bold text-dark">
                      ${Math.round(item.product.price * item.quantity).toLocaleString('es-CL')}
                    </strong>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 rounded-lg text-dark/30 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <Link
              href="/productos"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-accent mt-4 group"
            >
              <ArrowLeft size={14} className="transform group-hover:-translate-x-0.5 transition-transform" />
              <span>Seguir comprando frutos secos</span>
            </Link>
          </div>

          {/* Order Summary Panel */}
          <div className="bg-[#FAFAFA] border border-soft rounded-2xl p-6 space-y-6">
            <h3 className="font-serif text-lg font-bold text-dark pb-4 border-b border-soft">Resumen del Pedido</h3>

            <div className="space-y-3.5 text-xs text-dark/70">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-dark">${cartTotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Costo de Despacho</span>
                {shippingCost === 0 ? (
                  <span className="font-bold text-primary uppercase">Gratis</span>
                ) : (
                  <span className="font-bold text-dark">${shippingCost.toLocaleString('es-CL')}</span>
                )}
              </div>
              <div className="flex items-center gap-2 p-3 bg-white border border-soft rounded-xl mt-2 text-[10px]">
                <Truck size={14} className="text-primary flex-shrink-0" />
                <span>
                  {shippingCost === 0
                    ? '¡Felicidades! Tienes despacho gratuito en tu compra.'
                    : `Agrega $${(25000 - cartTotal).toLocaleString('es-CL')} más para despacho gratuito.`}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-soft flex justify-between items-end">
              <div>
                <span className="text-xs text-dark/50 block">Total Estimado</span>
                <span className="text-[10px] text-dark/40">(Incluye IVA)</span>
              </div>
              <strong className="text-2xl font-serif font-bold text-primary">
                ${orderTotal.toLocaleString('es-CL')}
              </strong>
            </div>

            <Link
              href="/checkout"
              className="w-full py-4 px-6 bg-primary hover:bg-accent text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <span>Proceder al Checkout</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
