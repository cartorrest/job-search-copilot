// app/api/jobs/route.js
//
// Esta es la ruta que el navegador llama para traer todas las vacantes.
// Internamente llama a listJobs() de lib/appsScript.js, que es quien
// realmente sabe el token y habla con Google. El navegador nunca ve
// nada de eso, solo recibe el JSON final.

import { NextResponse } from 'next/server';
import { listJobs } from '@/lib/appsScript';

export async function GET() {
  try {
    const jobs = await listJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('[api/jobs] Error trayendo vacantes:', error);
    return NextResponse.json(
      { error: 'No se pudo conectar con el Tracker. Revisa la configuracion.' },
      { status: 502 }
    );
  }
}
