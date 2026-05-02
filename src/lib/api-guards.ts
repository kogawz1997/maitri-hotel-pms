import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type AuthedContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string };
  profile: { id: string; organization_id: string; role: string; active: boolean };
};

export async function requireUser(): Promise<AuthedContext | NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, organization_id, role, active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.active === false) {
    return NextResponse.json({ error: 'User profile not active or not found' }, { status: 403 });
  }

  return { supabase, user: { id: user.id, email: user.email }, profile };
}

export function isGuardResponse(value: AuthedContext | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
