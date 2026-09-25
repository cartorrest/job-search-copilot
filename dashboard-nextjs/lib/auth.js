// lib/auth.js
//
// Proteccion de acceso simple: una sola contraseña, sin usuarios ni base
// de datos. Cuando alguien mete la contraseña correcta, le damos una
// cookie firmada que dura 30 dias. La cookie es "firmada" (no solo un
// texto plano) para que nadie pueda inventarse una cookie valida sin
// conocer el SESSION_SECRET.
//
// Usamos la Web Crypto API (crypto.subtle) en vez del modulo 'crypto' de
// Node porque este archivo lo usa el middleware, que corre en el "Edge
// Runtime" de Vercel -- un entorno mas limitado que no tiene el modulo
// 'crypto' de Node, pero si tiene Web Crypto (es lo mismo que usan los
// navegadores).

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

async function getKey() {
  // Sin SESSION_SECRET no hay forma segura de firmar: fallamos cerrado
  // (nadie entra) en vez de usar una clave por defecto que cualquiera
  // podria leer en este repo publico.
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET falta o es muy corto (minimo 16 caracteres).');
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

  // Comparacion en tiempo constante para evitar timing attacks.
  if (expectedHex.length !== signatureHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  }
  return diff === 0;
}

export const SESSION_COOKIE_NAME = 'jt_session';
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;
