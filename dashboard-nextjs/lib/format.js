// lib/format.js
//
// The Sheet is filled by hand, so formats vary: "Match %" can be a decimal
// like 0.4 (cell formatted as a percentage), a plain number like 55, or
// text like "65-70%". These helpers normalize it so the dashboard never
// breaks or shows odd numbers.

export function parseMatchPercent(value) {
  if (value === '' || value === null || value === undefined) return null;

  if (typeof value === 'number') {
    // Decimal from a percentage-formatted cell: 0.4 -> 40
    return value <= 1 ? Math.round(value * 100) : Math.round(value);
  }

  // Text: take the first number found (e.g. "65-70%" -> 65)
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
