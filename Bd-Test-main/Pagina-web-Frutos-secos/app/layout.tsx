import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/lib/CartContext';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { Footer } from '@/components/Footer';
import { getWebPageContent } from '@/lib/db';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Frutos Secos en Chile | Venta Online y Mayorista',
  description: 'Compra frutos secos en Chile al mejor precio. Venta online y mayorista de frutos secos naturales, deshidratados, semillas, granos y harinas de calidad.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const footerContent = await getWebPageContent('footer');

  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-dark">
        <CartProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <CartDrawer />
          <Footer content={footerContent} />
        </CartProvider>
      </body>
    </html>
  );
}
