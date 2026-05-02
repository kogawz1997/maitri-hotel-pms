import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { translateText, type Language } from '@/lib/ai';
import { detectLanguage } from '@/lib/utils';
import { getChannel } from '@/lib/channels';

export async function POST(request: Request) {
  const { conversationId, text, fromAISuggestion } = await request.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const guestLang = (conversation.guest_language || 'en') as Language;
  const sourceLang = detectLanguage(text) as Language;

  // Translate to guest language if needed
  let translatedText = text;
  if (sourceLang !== guestLang) {
    const result = await translateText({
      text,
      fromLang: sourceLang,
      toLang: guestLang,
      context: 'staff_reply',
    });
    translatedText = result.translated;
  }

  // Send via channel
  let channelMessageId = '';
  let status = 'sent';
  try {
    const adapter = getChannel(conversation.channel);
    const result = await adapter.sendMessage({
      channelUserId: conversation.channel_user_id,
      text: translatedText,
    });
    channelMessageId = result.messageId;
    status = result.status;
  } catch (e) {
    console.error('Channel send error:', e);
    status = 'failed';
  }

  // Save message
  const { data: message } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      direction: 'outbound',
      sender_type: fromAISuggestion ? 'ai' : 'staff',
      sender_id: user.id,
      original_text: translatedText,
      original_language: guestLang,
      translated_text: text,
      message_type: 'text',
      channel_message_id: channelMessageId,
      status,
      ai_generated: !!fromAISuggestion,
      ai_reviewed_by: fromAISuggestion ? user.id : null,
    })
    .select()
    .single();

  return NextResponse.json({ success: true, message });
}
