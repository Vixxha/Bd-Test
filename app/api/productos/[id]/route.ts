import { NextRequest, NextResponse } from 'next/server';
import { getProductoById } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductoById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (err) {
    console.error('Error in GET /api/productos/[id]:', err);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
