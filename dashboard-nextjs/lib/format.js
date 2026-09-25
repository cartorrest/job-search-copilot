// lib/format.js
//
// El Sheet lo llenas a mano, asi que los formatos varian: "Match %"
// a veces es un decimal tipo 0.4 (cuando la celda esta formateada como
// porcentaje en Sheets), a veces un numero plano tipo 55, y a veces
// texto tipo "65-70%". Estas funciones normalizan eso para que el
// dashboard no se rompa ni muestre numeros raros.

export function parseMatchPercent(value) {
  if (value === '' || value === null || value === undefined) return null;

  if (typeof value === 'number') {
    // Si viene como decimal (celda formateada como % en Sheets), 0.4 -> 40
    return value <= 1 ? Math.round(value * 100) : Math.round(value);
  }

  // Es texto: sacamos el primer numero que encontremos (ej: "65-70%" -> 65)
  const match = String(value).match(/\d+(\.\d+)?/);
  return match ? Math.round(parseFloat(match[0])) : null;
}

export function formatMatchPercent(value) {
  const parsed = parseMatchPercent(value);
  return parsed === null ? null : `${parsed}%`;
}

export function isValidUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}
