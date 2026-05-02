import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateNights } from '@/lib/utils';
import { requireUser, isGuardResponse } from '@/lib/api-guards';

const reservationSchema = z.object({
  hotelId: z.string().uuid(),
  roomId: z.string().uuid().optional().nullable(),
  roomTypeId: z.string().uuid(),
  checkIn: z.string().min(10),
  checkOut: z.string().min(10),
  numAdults: z.number().int().min(1).max(20).default(1),
  numChildren: z.number().int().min(0).max(20).default(0),
  totalAmount: z.number().nonnegative(),
  source: z.string().max(50).default('direct'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  nationality: z.string().max(80).optional().nullable(),
  specialRequests: z.string().max(2000).optional().nullable(),
}).refine(v => !!v.email || !!v.phone, { message: 'Email or phone is required' })
  .refine(v => new Date(v.checkOut) > new Date(v.checkIn), { message: 'checkOut must be after checkIn' });

export async function POST(request: Request) {
  const parsed = reservationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const supabase = createAdminClient();

  const nights = calculateNights(body.checkIn, body.checkOut);
  if (nights < 1) return NextResponse.json({ error: 'Invalid stay length' }, { status: 400 });

  const { data: hotel } = await supabase.from('hotels').select('id').eq('id', body.hotelId).single();
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  let guestQuery = supabase.from('guests').select('id').eq('hotel_id', body.hotelId);
  if (body.email && body.phone) guestQuery = guestQuery.or(`email.eq.${body.email},phone.eq.${body.phone}`);
  else if (body.email) guestQuery = guestQuery.eq('email', body.email);
  else if (body.phone) guestQuery = guestQuery.eq('phone', body.phone);

  let { data: guest } = await guestQuery.maybeSingle();

  if (!guest) {
    const { data: newGuest, error } = await supabase
      .from('guests')
      .insert({
        hotel_id: body.hotelId,
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        nationality: body.nationality,
      })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    guest = newGuest;
  }

  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      hotel_id: body.hotelId,
      guest_id: guest!.id,
      room_id: body.roomId,
      room_type_id: body.roomTypeId,
      check_in: body.checkIn,
      check_out: body.checkOut,
      nights,
      num_adults: body.numAdults,
      num_children: body.numChildren,
      total_amount: body.totalAmount,
      balance_amount: body.totalAmount,
      source: body.source,
      special_requests: body.specialRequests,
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('folios').insert({
    reservation_id: reservation.id,
    hotel_id: body.hotelId,
    status: 'open',
    total_charges: body.totalAmount,
    balance: body.totalAmount,
  });

  return NextResponse.json({ success: true, reservation });
}

export async function GET(request: Request) {
  const guard = await requireUser();
  if (isGuardResponse(guard)) return guard;
  const { supabase } = guard;
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotelId');
  const status = searchParams.get('status');
  if (!hotelId) return NextResponse.json({ error: 'Missing hotelId' }, { status: 400 });

  let query = supabase
    .from('reservations')
    .select('*, guests(*), rooms(room_number), room_types(name)')
    .eq('hotel_id', hotelId);

  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('check_in', { ascending: false }).limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reservations: data });
}
