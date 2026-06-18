import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chile Frutos Secos - Punto de Venta e Inventario",
  description: "Sistema de punto de venta e inventario local Chile Frutos Secos enfocado en la venta a granel y productos envasados en tiempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
