import { NextRequest, NextResponse } from 'next/server';
import { crearVenta } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      payment_method,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      items
    } = body;

    // Validate inputs
    if (
      !payment_method ||
      !customer_name ||
      !customer_email ||
      !customer_phone ||
      !shipping_address ||
      !shipping_city ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json({ error: 'Faltan datos requeridos en la solicitud' }, { status: 400 });
    }

    // Capture headers for parallel MongoDB metadata logs
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Calculate total amount
    const totalAmount = Math.round(
      items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    );

    // Call data layer parallel transactional flow
    const createdOrder = await crearVenta({
      total_amount: totalAmount,
      payment_method,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      status: 'pending',
      user_agent: userAgent,
      ip_address: ipAddress,
      items
    });

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (err: any) {
    console.error('Error creating sale in POST /api/ventas:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno al registrar la venta' },
      { status: 500 }
    );
  }
}
