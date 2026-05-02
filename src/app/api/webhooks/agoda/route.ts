import { NextResponse } from 'next/server';

// Agoda YCS API webhook
// SETUP: https://partners.agoda.com → YCS Connect
// ใช้ REST + JSON

export async function POST(request: Request) {
  const body = await request.json();
  
  // TODO: After YCS approval:
  // 1. Verify auth header
  // 2. Process reservation push
  // 3. Save to DB
  
  return NextResponse.json({ status: 'received' });
}
