'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FooterProps {
  content?: {
    title?: string;
    subtitle?: string;
    description?: string;
    button_primary_text?: string;
    button_url?: string;
    image_url?: string;
  };
}

export const Footer: React.FC<FooterProps> = ({ content }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const brandName = content?.image_url || 'Chile frutos Secos';
  const phone = content?.title || '+56 9 4919 6390';
  const contactEmail = content?.subtitle || 'ventas@chilefrutossecos.cl';
  const paymentDescription = content?.description || 'Tarjetas bancarias, transferencias o pagos contra entrega (paga después de recibir sus productos) en RM. Tenemos boleta o factura. Hasta 3 cuotas sin interés.';
  const location = content?.button_primary_text || 'Santiago, Chile';
  const businessHours = content?.button_url || 'Lunes a Viernes: 09:00 - 18:00';

  return (
    <footer className="bg-dark text-white pt-16 pb-12 mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
                C
              </span>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                Chile<span className="text-accent"> Frutos Secos</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed">
              Venta online y mayorista de frutos secos de la mejor calidad.
            </p>
            <p className="text-white/40 text-xs leading-relaxed pt-2">
              {paymentDescription}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-white">Navegación</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-white/60 hover:text-accent transition-colors duration-300">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/productos" className="text-white/60 hover:text-accent transition-colors duration-300">
                  Catálogo de Productos
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="text-white/60 hover:text-accent transition-colors duration-300">
                  Mi Carrito
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Info */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-white">Contacto e Información</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="text-white/60">Horario: {businessHours}</li>
              <li className="text-white/60">Email: {contactEmail}</li>
              <li className="text-white/60">Teléfono: {phone}</li>
              <li className="text-white/60">Ubicación: {location}</li>
            </ul>
          </div>

          {/* Newsletter signup */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-white">Newsletter</h4>
            <p className="text-white/60 text-xs mb-4 leading-relaxed">
              Suscríbete para recibir recetas saludables, novedades y descuentos exclusivos de nuestra tienda.
            </p>
            {subscribed ? (
              <div className="p-3 bg-primary/20 border border-primary/30 rounded-xl text-accent text-xs font-medium animate-fade">
                ¡Gracias por suscribirte! Revisa tu bandeja de entrada.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 text-white placeholder-white/40 text-xs px-4 py-3 rounded-xl flex-grow focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-300 border border-white/5"
                  required
                />
                <button
                  type="submit"
                  className="bg-primary text-white hover:bg-accent text-xs font-semibold px-4 py-3 rounded-xl transition-all duration-300"
                >
                  Unirse
                </button>
              </form>
            )}
          </div>
        </div>

        <hr className="border-white/10 my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-white/40 space-y-4 sm:space-y-0">
          <div>&copy; {new Date().getFullYear()} {brandName}. Todos los derechos reservados.</div>
          <div className="flex space-x-6">
            <span className="hover:text-white transition-colors duration-300 cursor-pointer">Términos y condiciones</span>
            <span className="hover:text-white transition-colors duration-300 cursor-pointer">Políticas de privacidad</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
