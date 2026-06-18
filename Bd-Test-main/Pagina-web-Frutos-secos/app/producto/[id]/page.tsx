import React from 'react';
import { notFound } from 'next/navigation';
import { getProductoById } from '@/lib/db';
import { ProductDetailClient } from './ProductDetailClient';

export const revalidate = 0; // Fresh stock counts on detail load

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductoById(id);
  if (!product) {
    return {
      title: 'Producto no encontrado - NutStore',
    };
  }
  return {
    title: `${product.name} - NutStore`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductoById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
