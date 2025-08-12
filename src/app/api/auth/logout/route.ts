import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  // Create expired cookie
  const cookie = serialize('auth_token', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0), // Immediate expiration
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  );

  response.headers.set('Set-Cookie', cookie);
  return response;
}
