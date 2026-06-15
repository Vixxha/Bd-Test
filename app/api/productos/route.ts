import { NextResponse } from 'next/server';
import { getProductos } from '@/lib/db';

export async function GET() {
  try {
    const products = await getProductos();
    return NextResponse.json(products);
  } catch (err) {
    console.error('Error in GET /api/productos:', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
