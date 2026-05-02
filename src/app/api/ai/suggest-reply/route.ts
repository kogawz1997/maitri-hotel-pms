import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateGuestReply, translateText, type Language } from '@/lib/ai';
import { requireUser, isGuardResponse } from '@/lib/api-guards';

const schema = z.object({ conversationId: z.string().uuid() });

export async function POST(request: Request) {
  const guard = await requireUser();
  if (isGuardResponse(guard)) return guard;
  const { supabase } = guard;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { conversationId } = parsed.data;

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, hotels(name, check_in_time, check_out_time, address)')
    .eq('id', conversationId)
    .single();

  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: messages } = await supabase
    .from('messages')
    .select('direction, sender_type, original_text, original_language')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  const history = (messages || []).map((m: any) => ({
    role: m.sender_type === 'guest' ? 'guest' as const : 'staff' as const,
    text: m.original_text || '',
  }));

  const { data: knowledge } = await supabase
    .from('knowledge_base')
    .select('title, content')
    .eq('hotel_id', conversation.hotel_id)
    .eq('active', true)
    .limit(10);

  const hotelInfo = Array.isArray(conversation.hotels) ? conversation.hotels[0] : conversation.hotels;
  const result = await generateGuestReply({
    conversationHistory: history,
    guestLanguage: (conversation.guest_language || 'en') as Language,
    hotelInfo: {
      name: hotelInfo?.name || '',
      checkInTime: hotelInfo?.check_in_time || '',
      checkOutTime: hotelInfo?.check_out_time || '',
      address: hotelInfo?.address || '',
    },
    knowledgeBase: knowledge || [],
  });

  if (result.needsHuman) return NextResponse.json({ needsHuman: true, reason: result.reason });

  const { translated: thaiTranslation } = await translateText({
    text: result.reply,
    fromLang: (conversation.guest_language || 'en') as Language,
    toLang: 'th',
    context: 'staff_reply',
  });

  return NextResponse.json({ reply: result.reply, thaiTranslation, confidence: result.confidence });
}
