// middleware.js
//
// Runs before every page and API route.
//
// Private mode: without a valid session cookie, redirect to /login. The
// login page, the password route and Next's static files are always open.

import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, isValidSessionToken } from '@/lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Demo mode: no login, and the routes that talk to Apps Script are
  // disabled (the demo never touches a real Sheet).
  if (process.env.DEMO_MODE === 'true') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'disabled_in_demo' }, { status: 404 });
    }
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  const isPublicPath =
    pathname === '/login' ||
    pathname === '/api/auth' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  if (isPublicPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await isValidSessionToken(token);

  if (!valid) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next's static assets (_next/static, etc.)
  matcher: ['/((?!_next/static|_next/image).*)'],
};
