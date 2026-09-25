// app/api/jobs/[jobId]/route.js
//
// [jobId] entre corchetes es una "ruta dinamica" de Next.js: captura
// cualquier valor en esa posicion de la URL. Si el navegador llama a
// PATCH /api/jobs/JOB-004, Next.js nos da jobId = "JOB-004" automatico.
//
// Nota Next.js 15: 'params' ahora es una Promise (antes era un objeto
// normal en Next 14). Hay que hacerle 'await' antes de leer jobId, si no
// jobId queda undefined y esta ruta fallaria en silencio.

import { NextResponse } from 'next/server';
import { updateJob } from '@/lib/appsScript';

export async function PATCH(request, { params }) {
  const { jobId } = await params;

  try {
    const { fields } = await request.json();
    const result = await updateJob(jobId, fields);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[api/jobs/${jobId}] Error actualizando:`, error);
    return NextResponse.json(
      { error: 'No se pudo actualizar la vacante. Intenta de nuevo.' },
      { status: 502 }
    );
  }
}

