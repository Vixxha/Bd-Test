'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CreditCard, DollarSign, Wallet, ArrowLeft, CheckCircle2, Phone, Calendar, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/CartContext';
import { ProductVisual } from '@/components/ProductVisual';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Santiago');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'debit' | 'credit' | 'transfer'>('cash');

  // Order status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  const shippingCost = cart.length === 0 ? 0 : cartTotal >= 25000 ? 0 : 3500;
  const orderTotal = cartTotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setError('Por favor completa todos los campos del formulario.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      payment_method: paymentMethod,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_address: address,
      shipping_city: city,
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }))
    };

    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al procesar el pedido.');
      }

      // Order created successfully
      setCreatedOrder(data);
      clearCart();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al procesar el pedido.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS SCREEN: Receipt layout
  if (createdOrder) {
    const formattedDate = new Date(createdOrder.created_at).toLocaleString('es-CL');
    return (
      <div className="max-w-xl mx-auto px-4 py-16 animate-fade-in space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-primary flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-dark">¡Compra Completada!</h1>
          <p className="text-dark/50 text-xs">Tu orden ha sido registrada en el sistema y sincronizada con el stock.</p>
        </div>

        {/* Thermal Receipt Box */}
        <div className="bg-[#FCFCFC] border border-dashed border-dark/20 rounded-2xl p-6 sm:p-8 font-mono text-xs text-dark/80 shadow-md">
          <div className="text-center space-y-1">
            <div className="font-bold text-sm tracking-widest text-primary font-sans">NUTSTORE E-COMMERCE</div>
            <div>Sincronizado con POS Venta</div>
            <div>Santiago, Chile</div>
          </div>

          <div className="border-t border-dashed border-dark/20 my-4" />

          {/* Metadata */}
          <div className="space-y-1">
            <div>N° Pedido: <strong className="text-dark">{createdOrder.id.substr(0, 8).toUpperCase()}</strong></div>
            <div>Fecha: {formattedDate}</div>
            <div>Cliente: {createdOrder.customer_name}</div>
            <div>Teléfono: {createdOrder.customer_phone}</div>
            <div>Dirección: {createdOrder.shipping_address}, {createdOrder.shipping_city}</div>
            <div>Pago: <strong className="uppercase">{
              createdOrder.payment_method === 'cash' ? 'EFECTIVO' : 
              createdOrder.payment_method === 'debit' ? 'DÉBITO' : 
              createdOrder.payment_method === 'credit' ? 'CRÉDITO' : 'TRANSFERENCIA'
            }</strong></div>
          </div>

          <div className="border-t border-dashed border-dark/20 my-4" />

          {/* Items */}
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-1 font-bold">
              <div className="col-span-8">DETALLE</div>
              <div className="col-span-4 text-right">TOTAL</div>
            </div>
            {cart.length > 0 ? (
              // In case items are read from cart prior to clear
              cart.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1 text-[11px]">
                  <div className="col-span-8 leading-relaxed">
                    {item.product.name} <br />
                    <span className="text-[10px] text-dark/50">
                      {item.product.sell_type === 'weight' ? `${item.quantity} Kg` : `${item.quantity} ud`} x ${item.product.price.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="col-span-4 text-right">
                    ${Math.round(item.product.price * item.quantity).toLocaleString('es-CL')}
                  </div>
                </div>
              ))
            ) : (
              createdOrder.items?.map((item: any, idx: number) => {
                // If backend returned items list
                return (
                  <div key={idx} className="grid grid-cols-12 gap-1 text-[11px]">
                    <div className="col-span-8 leading-relaxed">
                      Item N° {idx + 1} (Ref: {item.product_id?.substr(0,5)}) <br />
                      <span className="text-[10px] text-dark/50">
                        {item.quantity} x ${Number(item.price).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="col-span-4 text-right">
                      ${Math.round(Number(item.price) * Number(item.quantity)).toLocaleString('es-CL')}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-dashed border-dark/20 my-4" />

          {/* Totals */}
          <div className="space-y-1.5 text-right">
            <div>Subtotal: ${cartTotal > 0 ? cartTotal.toLocaleString('es-CL') : (createdOrder.total_amount - shippingCost).toLocaleString('es-CL')}</div>
            {shippingCost > 0 && <div>Despacho: ${shippingCost.toLocaleString('es-CL')}</div>}
            <div className="font-bold text-sm text-primary">
              TOTAL PAGADO: ${createdOrder.total_amount.toLocaleString('es-CL')}
            </div>
          </div>

          <div className="border-t border-dashed border-dark/20 my-4" />
          <div className="text-center text-[10px] text-dark/50">
            ¡Gracias por comprar en NutStore! <br />
            Tu pedido se encuentra pendiente de validación por despacho.
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/"
            className="bg-primary text-white hover:bg-accent font-bold text-xs py-3.5 px-8 rounded-xl transition-all shadow-sm"
          >
            Volver a la Página Principal
          </Link>
        </div>
      </div>
    );
  }

  // CART EMPTY CHECKOUT PRE-PREVENTION
  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-soft rounded-full flex items-center justify-center mx-auto text-dark/30">
          <ShoppingBag size={28} />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold text-dark">No hay ítems para checkout</h1>
          <p className="text-xs text-dark/50 mt-1 max-w-xs mx-auto">
            Por favor agrega frutos secos al carrito antes de ingresar al checkout.
          </p>
        </div>
        <Link
          href="/productos"
          className="inline-flex items-center gap-1.5 bg-primary text-white hover:bg-accent px-6 py-3 rounded-xl font-bold text-xs shadow-sm"
        >
          <ArrowLeft size={12} />
          <span>Explorar Productos</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
      <header className="mb-12">
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-dark">Ingresar Datos de Compra</h1>
        <p className="text-dark/50 text-xs mt-1">Completa los campos para procesar la transacción en tiempo real.</p>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium animate-fade">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white border border-soft p-6 sm:p-8 rounded-2xl space-y-6">
            <h3 className="font-serif text-lg font-bold text-dark pb-3 border-b border-soft">1. Información de Envío</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="form-group space-y-1.5 col-span-2">
                <label htmlFor="name-input" className="text-xs font-bold text-dark/60">Nombre Completo *</label>
                <input
                  id="name-input"
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-xl border border-soft focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div className="form-group space-y-1.5">
                <label htmlFor="email-input" className="text-xs font-bold text-dark/60">Correo Electrónico *</label>
                <input
                  id="email-input"
                  type="email"
                  placeholder="Ej: juan@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-xl border border-soft focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div className="form-group space-y-1.5">
                <label htmlFor="phone-input" className="text-xs font-bold text-dark/60">WhatsApp / Teléfono *</label>
                <input
                  id="phone-input"
                  type="tel"
                  placeholder="Ej: +56 9 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-xl border border-soft focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div className="form-group space-y-1.5 col-span-2">
                <label htmlFor="address-input" className="text-xs font-bold text-dark/60">Dirección Completa *</label>
                <input
                  id="address-input"
                  type="text"
                  placeholder="Calle, Número, Departamento / Oficina"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-xl border border-soft focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div className="form-group space-y-1.5">
                <label htmlFor="city-select" className="text-xs font-bold text-dark/60">Ciudad *</label>
                <select
                  id="city-select"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs px-4 py-3.5 rounded-xl border border-soft focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                >
                  <option value="Santiago">Santiago</option>
                  <option value="Viña del Mar">Viña del Mar</option>
                  <option value="Valparaíso">Valparaíso</option>
                  <option value="Concepción">Concepción</option>
                  <option value="Antofagasta">Antofagasta</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="bg-white border border-soft p-6 sm:p-8 rounded-2xl space-y-6">
            <h3 className="font-serif text-lg font-bold text-dark pb-3 border-b border-soft">2. Método de Pago</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-emerald-50/20 text-primary'
                    : 'border-soft bg-white text-dark/70 hover:bg-soft/30'
                }`}
              >
                <DollarSign size={18} />
                <span className="text-[10px] font-bold mt-1.5">Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('debit')}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all cursor-pointer ${
                  paymentMethod === 'debit'
                    ? 'border-primary bg-emerald-50/20 text-primary'
                    : 'border-soft bg-white text-dark/70 hover:bg-soft/30'
                }`}
              >
                <CreditCard size={18} />
                <span className="text-[10px] font-bold mt-1.5">Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all cursor-pointer ${
                  paymentMethod === 'credit'
                    ? 'border-primary bg-emerald-50/20 text-primary'
                    : 'border-soft bg-white text-dark/70 hover:bg-soft/30'
                }`}
              >
                <CreditCard size={18} />
                <span className="text-[10px] font-bold mt-1.5">Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all cursor-pointer ${
                  paymentMethod === 'transfer'
                    ? 'border-primary bg-emerald-50/20 text-primary'
                    : 'border-soft bg-white text-dark/70 hover:bg-soft/30'
                }`}
              >
                <Wallet size={18} />
                <span className="text-[10px] font-bold mt-1.5">Transferencia</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Panel */}
        <div className="lg:col-span-5 bg-[#FAFAFA] border border-soft rounded-2xl p-6 sm:p-8 space-y-6">
          <h3 className="font-serif text-lg font-bold text-dark pb-3 border-b border-soft">Tu Compra</h3>

          {/* Selected Items */}
          <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-soft flex-shrink-0 flex items-center justify-center">
                    <ProductVisual slug={item.product.image_url} size="sm" />
                  </div>
                  <div>
                    <span className="font-bold text-dark block leading-relaxed">{item.product.name}</span>
                    <span className="text-[10px] text-dark/45 block">
                      {item.product.sell_type === 'weight' ? `${item.quantity} Kg` : `${item.quantity} ud`} x ${item.product.price.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
                <strong className="text-dark">
                  ${Math.round(item.product.price * item.quantity).toLocaleString('es-CL')}
                </strong>
              </div>
            ))}
          </div>

          <div className="border-t border-soft pt-4 space-y-3.5 text-xs text-dark/75">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-dark">${cartTotal.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between">
              <span>Costo Despacho</span>
              {shippingCost === 0 ? (
                <span className="font-bold text-primary uppercase">Gratis</span>
              ) : (
                <span className="font-bold text-dark">${shippingCost.toLocaleString('es-CL')}</span>
              )}
            </div>
          </div>

          <div className="border-t border-soft pt-4 flex justify-between items-end">
            <div>
              <span className="text-xs text-dark/50 block font-semibold">Monto Total</span>
              <span className="text-[10px] text-dark/40">(Con IVA incluido)</span>
            </div>
            <strong className="text-2xl font-serif font-bold text-primary">
              ${orderTotal.toLocaleString('es-CL')}
            </strong>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className={`w-full py-4 px-6 bg-primary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-300 ${
                loading ? 'opacity-70 cursor-not-allowed bg-accent' : 'hover:bg-accent'
              }`}
            >
              <span>{loading ? 'Procesando Pedido...' : 'Confirmar y Pagar'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
