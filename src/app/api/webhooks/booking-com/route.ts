import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Booking.com webhook
// SETUP: ต้องเป็น Connectivity Partner ก่อน
// https://connect.booking.com
//
// Booking.com ใช้ XML push notification
// XSD: https://hotelconnect.booking.com/PMSConnectivity/

export async function POST(request: Request) {
  const body = await request.text();
  const supabase = createAdminClient();

  // TODO: After partner approval:
  // 1. Verify signature/credentials
  // 2. Parse XML (use fast-xml-parser)
  // 3. Extract reservation data
  // 4. Find/create guest
  // 5. Create reservation with source='booking_com'
  
  // Log for now
  await supabase.from('channel_sync_log').insert({
    sync_type: 'booking_pull',
    status: 'received',
    records_processed: 0,
  });

  // Booking.com expects ACK
  return new Response('<?xml version="1.0"?><response status="ok"/>', {
    headers: { 'Content-Type': 'application/xml' },
  });
}
