import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, isGuardResponse } from '@/lib/api-guards';

const patchSchema = z.object({
  action: z.enum(['check_in', 'check_out', 'cancel']).optional(),
  hotelId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional().nullable(),
  reason: z.string().max(500).optional(),
  status: z.string().optional(),
  special_requests: z.string().max(2000).optional().nullable(),
  internal_notes: z.string().max(2000).optional().nullable(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser();
  if (isGuardResponse(guard)) return guard;
  const { supabase } = guard;
  const { id } = await params;
  const { data, error } = await supabase
    .from('reservations')
    .select('*, guests(*), rooms(room_number), room_types(name), folios(*, folio_items(*))')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ reservation: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUser();
  if (isGuardResponse(guard)) return guard;
  const { supabase } = guard;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  const updates: Record<string, unknown> = {};
  if (body.action === 'check_in') {
    updates.status = 'checked_in';
    if (body.roomId) {
      updates.room_id = body.roomId;
      await supabase.from('rooms').update({ status: 'occupied' }).eq('id', body.roomId);
    }
  } else if (body.action === 'check_out') {
    updates.status = 'checked_out';
    const { data: resv } = await supabase.from('reservations').select('room_id, hotel_id').eq('id', id).single();
    if (resv?.room_id) {
      await supabase.from('rooms').update({ status: 'cleaning' }).eq('id', resv.room_id);
      await supabase.from('housekeeping_tasks').insert({
        hotel_id: body.hotelId || resv.hotel_id,
        room_id: resv.room_id,
        task_type: 'turnover',
        priority: 'high',
        status: 'pending',
      });
    }
  } else if (body.action === 'cancel') {
    updates.status = 'cancelled';
    updates.cancelled_at = new Date().toISOString();
    updates.cancellation_reason = body.reason;
  } else {
    if (body.status) updates.status = body.status;
    if ('special_requests' in body) updates.special_requests = body.special_requests;
    if ('internal_notes' in body) updates.internal_notes = body.internal_notes;
    if ('roomId' in body) updates.room_id = body.roomId;
  }

  const { data, error } = await supabase.from('reservations').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reservation: data });
}
