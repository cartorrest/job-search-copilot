// middleware.js
//
// Next.js ejecuta este archivo automaticamente antes de servir CUALQUIER
// pagina o ruta de API (siempre que el archivo se llame exactamente
// "middleware.js" y viva en la raiz del proyecto -- no hace falta
// importarlo en ningun lado).
//
// Logica: si la cookie de sesion no existe o no es valida, mandamos al
// usuario a /login. Dejamos pasar sin chequeo: la propia pagina de login,
// la ruta que valida la contraseña, y los archivos estaticos de Next.

import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, isValidSessionToken } from '@/lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Modo demo: sin login, y las rutas que hablan con Apps Script quedan
  // apagadas (la demo nunca toca un Sheet real).
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
  // Corre en todo excepto archivos estaticos de Next (_next/static, etc.)
  matcher: ['/((?!_next/static|_next/image).*)'],
};
