import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateNights } from '@/lib/utils';

const quoteSchema = z.object({
  hotelId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  checkIn: z.string().min(10),
  checkOut: z.string().min(10),
  ratePlanId: z.string().uuid().optional().nullable(),
}).refine(v => new Date(v.checkOut) > new Date(v.checkIn), { message: 'checkOut must be after checkIn' });

export async function POST(request: Request) {
  const parsed = quoteSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { hotelId, roomTypeId, checkIn, checkOut } = parsed.data;
  const supabase = createAdminClient();

  const nights = calculateNights(checkIn, checkOut);
  if (nights < 1 || nights > 365) return NextResponse.json({ error: 'Invalid stay length' }, { status: 400 });

  const { data: rates } = await supabase
    .from('rate_calendar')
    .select('date, rate, available_count, min_stay')
    .eq('hotel_id', hotelId)
    .eq('room_type_id', roomTypeId)
    .gte('date', checkIn)
    .lt('date', checkOut)
    .order('date');

  let totalPrice = 0;
  const breakdown: Array<{ date: string; rate: number }> = [];

  if (rates && rates.length === nights) {
    rates.forEach((r: any) => {
      totalPrice += Number(r.rate);
      breakdown.push({ date: r.date, rate: Number(r.rate) });
    });
  } else {
    const { data: roomType } = await supabase
      .from('room_types')
      .select('base_rate')
      .eq('hotel_id', hotelId)
      .eq('id', roomTypeId)
      .single();
    if (!roomType) return NextResponse.json({ error: 'Room type not found' }, { status: 404 });
    totalPrice = Number(roomType.base_rate || 0) * nights;
  }

  const { data: existingResvs } = await supabase
    .from('reservations')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('room_type_id', roomTypeId)
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)
    .not('status', 'in', '(cancelled,no_show)');

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('room_type_id', roomTypeId)
    .neq('status', 'maintenance')
    .neq('status', 'blocked');
  const available = (rooms?.length || 0) - (existingResvs?.length || 0);

  return NextResponse.json({
    nights,
    totalPrice,
    pricePerNight: nights > 0 ? totalPrice / nights : 0,
    available: Math.max(0, available),
    breakdown,
  });
}
