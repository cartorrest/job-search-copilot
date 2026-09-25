// lib/dates.js

export function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr);
  if (isNaN(then.getTime())) return null;
  const diffMs = Date.now() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

export function isThisWeek(dateStr) {
  const days = daysSince(dateStr);
  return days !== null && days <= 7;
}
