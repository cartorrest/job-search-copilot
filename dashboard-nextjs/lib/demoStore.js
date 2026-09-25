// lib/demoStore.js
//
// Demo mode has no server and no Sheet: data lives in each visitor's
// localStorage. If localStorage is unavailable (private mode, blocked),
// the demo keeps working in memory only.

import { buildDemoData } from './demoData.js';

const KEY = 'job-search-copilot-demo-v1';

export function loadDemo() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.jobs) && Array.isArray(parsed.history)) return parsed;
    }
  } catch {
    // no localStorage: stay in memory
  }
  return buildDemoData();
}

export function saveDemo(data) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // intentionally ignored
  }
}

export function resetDemo() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // intentionally ignored
  }
  return buildDemoData();
}
