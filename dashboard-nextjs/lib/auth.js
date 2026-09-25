// lib/auth.js
//
// Simple access control: one password, no users, no database. The right
// password gets an HMAC-signed cookie valid for 30 days, so nobody can
// forge a valid cookie without SESSION_SECRET.
//
// Uses the Web Crypto API (crypto.subtle) instead of Node's 'crypto'
// module because the middleware runs on the Edge Runtime, which only has
// Web Crypto.

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function getKey() {
  // Without SESSION_SECRET there is no safe way to sign: fail closed
  // (nobody gets in) instead of falling back to a default key that anyone
  // could read in this public repo.
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET is missing or too short (16+ characters).');
  }
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionToken() {
  const expires = Date.now() + SESSION_DURATION_MS;
  const key = await getKey();
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(String(expires)));
  return `${expires}.${toHex(signature)}`;
}

export async function isValidSessionToken(token) {
  if (!token) return false;
  try {
    return await verifySessionToken(token);
  } catch {
    return false;
  }
}

async function verifySessionToken(token) {
  const [expiresStr, signatureHex] = token.split('.');
  if (!expiresStr || !signatureHex) return false;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const key = await getKey();
  const encoder = new TextEncoder();
  const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(expiresStr));
  const expectedHex = toHex(expectedSignature);

  // Constant-time comparison to avoid timing attacks.
  if (expectedHex.length !== signatureHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  }
  return diff === 0;
}

export const SESSION_COOKIE_NAME = 'jt_session';
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;
