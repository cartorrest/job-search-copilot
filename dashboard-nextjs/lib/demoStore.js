// lib/demoStore.js
//
// En modo demo no hay servidor ni Sheet: los datos viven en localStorage
// del navegador de cada visitante. Si localStorage no esta disponible
// (modo privado, bloqueado), la demo sigue funcionando solo en memoria.

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
    // sin localStorage: seguimos en memoria
  }
  return buildDemoData();
}

export function saveDemo(data) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignorado a proposito
  }
}

export function resetDemo() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignorado a proposito
  }
  return buildDemoData();
}
