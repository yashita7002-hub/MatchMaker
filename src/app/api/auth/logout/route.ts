import { NextResponse } from 'next/server';
import { serializeClearCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', serializeClearCookie());
  return response;
}
