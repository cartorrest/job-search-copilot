// lib/appsScript.js
//
// Server-only. It is imported exclusively by app/api/* route handlers, so
// it never ships to the browser.
//
// This is the only place that reads the Apps Script token.

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const APPS_SCRIPT_TOKEN = process.env.APPS_SCRIPT_TOKEN;

if ((!APPS_SCRIPT_URL || !APPS_SCRIPT_TOKEN) && process.env.DEMO_MODE !== 'true') {
  // Do not throw at import time (it would break the build), but warn loudly
  // in the Vercel logs when the environment variables are missing.
  console.warn(
    '[appsScript] APPS_SCRIPT_URL or APPS_SCRIPT_TOKEN is missing from the environment.'
  );
}

/**
 * Loads EVERY application from the tracker.
 *
 * Requires the "list" action in the v1 Apps Script
 * (see original-copilot/apps-script-v1/Code.gs).
 */
export async function listJobs() {
  const url = `${APPS_SCRIPT_URL}?action=list&token=${encodeURIComponent(APPS_SCRIPT_TOKEN)}`;

  const res = await fetch(url, {
    method: 'GET',
    // Apps Script web apps answer with a 302 redirect before the real
    // content. 'follow' is fetch's default; it is explicit here because a
    // missing redirect is the #1 cause of silent failures.
    redirect: 'follow',
    // Never cache: always read the latest state of the Sheet.
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
 * Updates fields of one application (e.g. change its Status).
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
