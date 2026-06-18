import React from 'react';
import { getProductos, getCategories } from '@/lib/db';
import { CatalogClient } from './CatalogClient';

export const revalidate = 0; // Fresh stock status on each request

export const metadata = {
  title: 'Catálogo de Frutos Secos - Chile Frutos Secos',
  description: 'Explora nuestra selección completa de almendras, nueces, anacardos, aceites, harinas y productos deshidratados de calidad premium.',
};

export default async function CatalogPage() {
  // Query DB directly on the server
  const products = await getProductos();
  const categories = await getCategories();

  return <CatalogClient initialProducts={products} initialCategories={categories} />;
}
