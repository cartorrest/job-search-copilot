// app/api/auth/route.js
//
// El formulario de /login manda un POST aqui con la contraseña que el
// usuario escribio. Si coincide con DASHBOARD_PASSWORD (variable de
// entorno), le damos una cookie de sesion firmada. Si no, error 401.

import { NextResponse } from 'next/server';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';

export async function POST(request) {
  const { password } = await request.json();

  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }

  const token = await createSessionToken();

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // el JavaScript del navegador NO puede leer esta cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });

  return response;
}
