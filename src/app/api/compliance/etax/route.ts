import { NextResponse } from 'next/server';
import { z } from 'zod';
import { etaxService } from '@/lib/compliance';
import { generateInvoiceNumber } from '@/lib/utils';
import { requireUser, isGuardResponse } from '@/lib/api-guards';

const schema = z.object({
  reservationId: z.string().uuid(),
  buyerName: z.string().max(200).optional(),
  buyerTaxId: z.string().max(50).optional(),
  buyerAddress: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const guard = await requireUser();
  if (isGuardResponse(guard)) return guard;
  const { supabase } = guard;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { reservationId, buyerName, buyerTaxId, buyerAddress } = parsed.data;

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, guests(*), hotels(name, tax_id, address, vat_rate)')
    .eq('id', reservationId)
    .single();

  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const hotel = Array.isArray(reservation.hotels) ? reservation.hotels[0] : reservation.hotels;
  const guest = Array.isArray(reservation.guests) ? reservation.guests[0] : reservation.guests;
  const vatRate = Number(hotel?.vat_rate || 0.07);
  const totalAmount = Number(reservation.total_amount);
  const subtotal = totalAmount / (1 + vatRate);
  const vatAmount = totalAmount - subtotal;
  const invoiceNumber = generateInvoiceNumber('ETAX');
  const displayBuyerName = buyerName || `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      hotel_id: reservation.hotel_id,
      reservation_id: reservationId,
      guest_id: reservation.guest_id,
      invoice_number: invoiceNumber,
      invoice_type: 'tax_invoice',
      subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      buyer_name: displayBuyerName,
      buyer_tax_id: buyerTaxId,
      buyer_address: buyerAddress,
      is_etax: true,
      etax_status: 'draft',
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = await etaxService.submit({
    invoiceNumber,
    issueDate: new Date().toISOString().split('T')[0],
    sellerTaxId: hotel?.tax_id || '',
    sellerName: hotel?.name || '',
    sellerAddress: hotel?.address || '',
    buyerTaxId,
    buyerName: displayBuyerName,
    buyerAddress,
    items: [{
      description: `ค่าที่พัก ${reservation.reservation_code}`,
      quantity: reservation.nights || 1,
      unitPrice: subtotal / Number(reservation.nights || 1),
      vatRate,
    }],
    subtotal,
    vatAmount,
    totalAmount,
  });

  await supabase.from('invoices').update({
    etax_status: result.status,
    etax_submitted_at: new Date().toISOString(),
    etax_response: result,
  }).eq('id', invoice.id);

  return NextResponse.json({ invoice, etaxResult: result });
}
