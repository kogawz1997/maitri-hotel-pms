import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Omise webhook for charge events
// Set webhook URL in Omise dashboard: https://yourdomain.com/api/webhooks/omise
//
// Events:
// - charge.complete
// - charge.expired
// - refund.create

export async function POST(request: Request) {
  const event = await request.json();
  const supabase = createAdminClient();

  if (!['charge.complete', 'charge.expired', 'refund.create'].includes(event.key)) {
    return NextResponse.json({ ok: true });
  }

  const charge = event.data;
  const transactionId = charge.id;

  // Update payment status
  if (event.key === 'charge.complete') {
    const { data: payment } = await supabase
      .from('payments')
      .update({
        status: charge.status === 'successful' ? 'completed' : 'failed',
        paid_at: charge.paid_at,
        gateway_response: charge,
      })
      .eq('gateway_transaction_id', transactionId)
      .select('reservation_id, amount')
      .single();

    if (payment?.reservation_id && charge.status === 'successful') {
      // Update reservation paid amount
      const { data: resv } = await supabase
        .from('reservations')
        .select('paid_amount, total_amount')
        .eq('id', payment.reservation_id)
        .single();

      if (resv) {
        await supabase
          .from('reservations')
          .update({ paid_amount: Number(resv.paid_amount) + Number(payment.amount) })
          .eq('id', payment.reservation_id);
      }
    }
  }

  if (event.key === 'refund.create') {
    await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        refund_amount: charge.amount / 100,
      })
      .eq('gateway_transaction_id', charge.charge);
  }

  return NextResponse.json({ ok: true });
}
