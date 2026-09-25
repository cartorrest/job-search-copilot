// app/api/auth/route.js
//
// The /login form POSTs the password here. If it matches DASHBOARD_PASSWORD
// (environment variable), the response sets a signed session cookie.
// Otherwise, 401.

import { NextResponse } from 'next/server';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';

export async function POST(request) {
  const { password } = await request.json();

  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const token = await createSessionToken();

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // browser JavaScript cannot read this cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });

  return response;
}
