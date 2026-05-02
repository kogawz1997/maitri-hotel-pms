import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPaymentAdapter } from '@/lib/payments';
import { requireUser, isGuardResponse } from '@/lib/api-guards';

const schema = z.object({
  reservationId: z.string().uuid(),
  amount: z.number().positive().max(10_000_000),
  method: z.enum([
    'credit_card',
    'promptpay',
    'truemoney',
    'shopeepay',
    'bank_transfer',
  ]),
  description: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const guard = await requireUser();
  if (isGuardResponse(guard)) return guard;

  const { supabase } = guard;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { reservationId, amount, method, description } = parsed.data;

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, hotels(currency)')
    .eq('id', reservationId)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  const adapter = getPaymentAdapter('omise');

  try {
    const hotel = Array.isArray(reservation.hotels)
      ? reservation.hotels[0]
      : reservation.hotels;

    const currency = hotel?.currency || 'THB';

    const result = await adapter.charge({
      amount,
      currency,
      description: description || `Booking ${reservation.reservation_code}`,
      method,
      reservationId,
    });

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        hotel_id: reservation.hotel_id,
        reservation_id: reservationId,
        amount,
        currency,
        payment_method: method,
        status: result.status === 'completed' ? 'completed' : 'pending',
        gateway: 'omise',
        gateway_transaction_id: result.transactionId,
        gateway_response: result.raw,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    if (result.status === 'completed') {
      await supabase
        .from('reservations')
        .update({
          paid_amount: Number(reservation.paid_amount || 0) + amount,
        })
        .eq('id', reservationId);
    }

    return NextResponse.json({
      success: true,
      payment,
      qrCode: result.qrCode,
      paymentUrl: result.paymentUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Payment charge failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}