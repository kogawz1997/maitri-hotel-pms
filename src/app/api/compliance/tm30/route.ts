import { NextResponse } from 'next/server';
import { z } from 'zod';
import { tm30Service } from '@/lib/compliance';
import { requireUser, isGuardResponse } from '@/lib/api-guards';

const schema = z.object({ reservationId: z.string().uuid() });

export async function POST(request: Request) {
  const guard = await requireUser();
  if (isGuardResponse(guard)) return guard;
  const { supabase } = guard;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { reservationId } = parsed.data;

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, guests(*), hotels(name, address)')
    .eq('id', reservationId)
    .single();
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const guest = Array.isArray(reservation.guests) ? reservation.guests[0] : reservation.guests;
  const hotel = Array.isArray(reservation.hotels) ? reservation.hotels[0] : reservation.hotels;

  if (guest?.nationality === 'TH' || guest?.nationality === 'Thai') {
    return NextResponse.json({ message: 'Thai guest - TM30 not required' });
  }
  if (!guest?.passport_number) return NextResponse.json({ error: 'Passport number is required for TM30' }, { status: 400 });

  const result = await tm30Service.submit({
    passportNumber: guest.passport_number,
    nationality: guest.nationality,
    fullName: `${guest.first_name} ${guest.last_name || ''}`.trim(),
    arrivalDate: reservation.check_in,
    hotelName: hotel?.name || '',
    hotelAddress: hotel?.address || '',
  });

  await supabase.from('tm30_reports').insert({
    hotel_id: reservation.hotel_id,
    guest_id: reservation.guest_id,
    reservation_id: reservation.id,
    passport_number: guest.passport_number,
    nationality: guest.nationality,
    arrival_date: reservation.check_in,
    departure_date: reservation.check_out,
    status: result.success ? 'submitted' : 'pending',
    submitted_at: result.success ? new Date().toISOString() : null,
    confirmation_number: result.confirmationNumber,
    response_data: result,
  });

  if (result.success) {
    await supabase.from('reservations').update({ tm30_reported: true, tm30_reported_at: new Date().toISOString() }).eq('id', reservationId);
  }

  return NextResponse.json(result);
}
