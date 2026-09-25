// lib/appsScript.js
//
// Este archivo SOLO se ejecuta en el servidor (Vercel), nunca en el navegador.
// Next.js garantiza esto porque solo lo importan archivos dentro de app/api/*,
// que son rutas de servidor. Si algun dia lo importas por error desde un
// componente de cliente, Next.js te va a tirar un error en el build -- es
// una proteccion extra, no solo disciplina.
//
// Aqui vive la unica referencia al token. Nada mas en el proyecto lo toca.

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const APPS_SCRIPT_TOKEN = process.env.APPS_SCRIPT_TOKEN;

if ((!APPS_SCRIPT_URL || !APPS_SCRIPT_TOKEN) && process.env.DEMO_MODE !== 'true') {
  // No lanzamos error en el import (rompería el build), pero sí avisamos
  // fuerte en los logs de Vercel si faltan las variables de entorno.
  console.warn(
    '[appsScript] Faltan APPS_SCRIPT_URL o APPS_SCRIPT_TOKEN en las variables de entorno.'
  );
}

/**
 * Trae TODAS las vacantes del Tracker.
 *
 * Requiere que el Apps Script tenga la accion "list" agregada
 * (ver README.md, seccion "Accion nueva requerida en Apps Script").
 */
export async function listJobs() {
  const url = `${APPS_SCRIPT_URL}?action=list&token=${encodeURIComponent(APPS_SCRIPT_TOKEN)}`;

  const res = await fetch(url, {
    method: 'GET',
    // Apps Script Web Apps responden con un redirect 302 antes del
    // contenido real. 'follow' es el default de fetch, pero lo dejamos
    // explicito porque es la causa #1 de que esto falle silenciosamente.
    redirect: 'follow',
    // Nunca cachear: siempre queremos el estado mas reciente del Sheet.
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Apps Script respondio con status ${res.status}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.jobs;
}

/**
 * Actualiza campos de una vacante especifica (ej: cambiar el Status).
 */
export async function updateJob(jobId, fields) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    body: JSON.stringify({
      token: APPS_SCRIPT_TOKEN,
      action: 'update',
      jobId,
      fields,
    }),
  });

  if (!res.ok) {
    throw new Error(`Apps Script respondio con status ${res.status}`);
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Apps Script devolvio success:false');
  }

  return data;
}
