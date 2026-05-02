import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const setupSchema = z.object({
  fullName: z.string().max(120).optional().nullable(),
  hotelName: z.string().min(2).max(120),
});

function slugify(value: string) {
  const base = value.toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return `${base || 'hotel'}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(request: Request) {
  const parsed = setupSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const userClient = await createClient();
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: existingProfile } = await admin
    .from('user_profiles')
    .select('id, organization_id')
    .eq('id', user.id)
    .maybeSingle();
  if (existingProfile) {
    return NextResponse.json({ success: true, organizationId: existingProfile.organization_id, alreadyConfigured: true });
  }

  const { hotelName, fullName } = parsed.data;
  const slug = slugify(hotelName);

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: hotelName, slug })
    .select()
    .single();
  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 });

  const { data: hotel, error: hotelError } = await admin
    .from('hotels')
    .insert({ organization_id: org.id, name: hotelName, slug, type: 'hotel' })
    .select()
    .single();
  if (hotelError) return NextResponse.json({ error: hotelError.message }, { status: 500 });

  const { error: profileError } = await admin.from('user_profiles').insert({
    id: user.id,
    organization_id: org.id,
    email: user.email || '',
    full_name: fullName,
    role: 'owner',
  });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ success: true, organizationId: org.id, hotelId: hotel.id });
}
