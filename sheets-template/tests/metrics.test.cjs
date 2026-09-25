// Tests for the Apps Script logic, run in Node (no Google services needed):
//   node --test sheets-template/tests/metrics.test.cjs
// Loads the .gs files into a sandbox, the same way Apps Script shares one global scope.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ctx = vm.createContext({});
for (const f of ['Code.gs', 'Metrics.gs', 'SampleData.gs']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
}
const run = (code) => JSON.parse(JSON.stringify(vm.runInContext(code, ctx)));

const NOW = '2026-09-24T12:00:00Z';
const apps = [
  { id: 'A', etapa: 'Aplicada', fuente: 'X', fechaAplicacion: '2026-09-01T12:00:00Z', fechaMovimiento: '2026-09-01T12:00:00Z' },
  { id: 'B', etapa: 'Rechazada', fuente: 'X', fechaAplicacion: '2026-09-01T12:00:00Z', fechaMovimiento: '2026-09-05T12:00:00Z' },
  { id: 'C', etapa: 'Entrevista', fuente: 'Y', fechaAplicacion: '2026-09-10T12:00:00Z', fechaMovimiento: '2026-09-20T12:00:00Z' },
  { id: 'D', etapa: 'Guardada', fuente: 'Y', fechaAplicacion: '', fechaMovimiento: '2026-09-01T12:00:00Z' },
  { id: 'E', etapa: 'Retirada', fuente: 'Y', fechaAplicacion: '2026-09-02T12:00:00Z', fechaMovimiento: '2026-09-03T12:00:00Z' },
];
const history = [
  { ts: '2026-09-01T12:00:00Z', id: 'B', prev: '', next: 'Aplicada' },
  { ts: '2026-09-05T12:00:00Z', id: 'B', prev: 'Aplicada', next: 'Rechazada' },
  { ts: '2026-09-10T12:00:00Z', id: 'C', prev: '', next: 'Aplicada' },
  { ts: '2026-09-14T12:00:00Z', id: 'C', prev: 'Aplicada', next: 'En proceso' },
  { ts: '2026-09-15T12:00:00Z', id: 'C', prev: 'En proceso', next: 'En proceso', nota: 'nota' },
  { ts: '2026-09-20T12:00:00Z', id: 'C', prev: 'En proceso', next: 'Entrevista' },
];
const metrics = (a = apps, h = history) =>
  run(`computeMetrics_(${JSON.stringify(a)}, ${JSON.stringify(h)}, DEFAULT_STAGES, 7, '${NOW}')`);

test('response rate excludes saved and withdrawn-before-reply', () => {
  const m = metrics();
  assert.equal(m.applied, 3);
  assert.equal(m.responded, 2);
});

test('funnel and days per stage come from the event log', () => {
  const m = metrics();
  assert.deepEqual(m.funnel.map((f) => f.count), [3, 1, 1, 0, 0]);
  const avg = Object.fromEntries(m.avgDaysByStage.map((s) => [s.stage, s.avgDays]));
  assert.equal(avg['Aplicada'], 4);
  assert.equal(avg['En proceso'], 6); // the note does not split the stint
});

test('stalled = open and N+ days without movement', () => {
  assert.deepEqual(metrics().staleApps.map((a) => a.id).sort(), ['A', 'D']);
});

test('reply rate by source', () => {
  const rate = Object.fromEntries(metrics().bySource.map((s) => [s.source, s.rate]));
  assert.deepEqual(rate, { X: 0.5, Y: 1 });
});

test('duplicates: normalized link or normalized company + role', () => {
  const [a, b] = run(`[normalizeLink_('https://www.linkedin.com/jobs/view/123/?utm_source=x&trk=abc'), normalizeLink_('http://linkedin.com/jobs/view/123')]`);
  assert.equal(a, b);
  assert.notEqual(run(`normalizeLink_('https://boards.example.com/jobs?gh_jid=1')`), run(`normalizeLink_('https://boards.example.com/jobs?gh_jid=2')`));
  assert.ok(run(`findDuplicate_([{ empresa: 'Acmé Corp', cargo: 'Data Analyst', link: '' }], { empresa: 'acme corp', cargo: 'data  analyst' })`));
  assert.equal(run(`findDuplicate_([{ empresa: 'Acme', cargo: 'BI Analyst', link: '' }], { empresa: 'Acme', cargo: 'Data Analyst' })`), null);
});

test('sample data: 33 fictional applications with coherent history', () => {
  const d = run(`(function () {
    var data = buildSampleData_(DEFAULT_STAGES, new Date('${NOW}'));
    return {
      apps: data.rows.map(function (r, i) { return rowToApp_(r, i + 2); }),
      hist: data.events.map(function (e) { return { ts: toIso_(e[0]), id: e[1], prev: e[2], next: e[3] }; }),
    };
  })()`);
  assert.equal(d.apps.length, 33);
  for (const app of d.apps) {
    assert.match(app.id, /^DEMO-/);
    assert.match(app.link, /^https:\/\/example\.com\//);
    const changes = d.hist.filter((h) => h.id === app.id && h.prev !== h.next);
    assert.equal(changes.at(-1).next, app.etapa);
    assert.ok(new Date(app.fechaMovimiento) <= new Date(NOW));
  }
  const m = metrics(d.apps, d.hist);
  assert.equal(m.applied, 30);
  assert.equal(m.responded, 19);
});

test('interview rounds: sample data has 1-3 rounds for processes that reached an interview', () => {
  const d = run(`(function () {
    var data = buildSampleData_(DEFAULT_STAGES, new Date('${NOW}'));
    var apps = data.rows.map(function (r, i) { return rowToApp_(r, i + 2); });
    var hist = data.events.map(function (e) { return { ts: toIso_(e[0]), id: e[1], prev: e[2], next: e[3], nota: e[4] }; });
    return { apps: apps, hist: hist, m: computeMetrics_(apps, hist, DEFAULT_STAGES, 7, '${NOW}') };
  })()`);
  const withRounds = d.apps.filter((a) => a.rondas > 0);
  assert.ok(withRounds.length > 0);
  for (const a of withRounds) {
    assert.ok(a.rondas >= 1 && a.rondas <= 3);
    const notes = d.hist.filter((h) => h.id === a.id && /^Ronda \d/.test(h.nota));
    assert.equal(notes.length, a.rondas);
    assert.ok(new Date(a.fechaMovimiento) >= new Date(notes.at(-1).ts), 'rounds count as movement');
  }
  assert.equal(d.m.interviewRounds.apps, withRounds.length);
  // Rounds are notes, so they must not change funnel or stage-time numbers.
  assert.equal(d.m.applied, 30);
  assert.ok(d.m.avgDaysByStage.every((s) => s.avgDays > 0));
});

test('migration: a sheet from the first template version gets the new columns without losing data', () => {
  const OLD = ['ID', 'Tipo', 'Empresa/Institución', 'Cargo/Programa', 'Link', 'Fuente', 'Fecha aplicación', 'Etapa', 'Fecha último movimiento', 'Versión CV/carta', 'Salario', 'Contacto', 'Próximo paso', 'Notas', 'Alerta enviada'];
  const row = ['JT-0001', 'Empleo', 'Acme', 'Analyst', 'https://x', 'LinkedIn', 'd1', 'Entrevista', 'd2', 'CV v1', '', '', 'Seguir', 'nota', ''];
  // Minimal in-memory stand-in for a Sheet.
  const grid = [OLD.slice(), row.slice()];
  const range = (r, c, nr = 1, nc = 1) => {
    const self = {
      getValues: () => grid.slice(r - 1, r - 1 + nr).map((x) => x.slice(c - 1, c - 1 + nc)),
      setValues: (v) => { v.forEach((vr, i) => vr.forEach((val, j) => { grid[r - 1 + i][c - 1 + j] = val; })); return self; },
      setValue: (val) => { grid[r - 1][c - 1] = val; return self; },
      setFontWeight: () => self, setBackground: () => self, setFontColor: () => self,
    };
    return self;
  };
  const sheet = {
    getLastColumn: () => Math.max(...grid.map((x) => x.length)),
    getRange: range,
    deleteColumn: (c) => grid.forEach((x) => x.splice(c - 1, 1)),
    insertColumnBefore: (c) => grid.forEach((x) => x.splice(c - 1, 0, '')),
    insertColumnAfter: (c) => grid.forEach((x) => x.splice(c, 0, '')),
  };
  ctx.__sheet = sheet;
  vm.runInContext('migrateAppsHeaders_(__sheet)', ctx);
  const headers = run('APP_HEADERS');
  assert.deepEqual(grid[0], headers);
  const get = (name) => grid[1][headers.indexOf(name)];
  assert.equal(get('Empresa'), 'Acme');
  assert.equal(get('Cargo'), 'Analyst');
  assert.equal(get('Etapa'), 'Entrevista');
  assert.equal(get('Versión de CV'), 'CV v1');
  assert.equal(get('Alerta enviada'), '');
  assert.equal(get('Rondas de entrevista'), '');
  // Idempotent: running it again changes nothing.
  vm.runInContext('migrateAppsHeaders_(__sheet)', ctx);
  assert.deepEqual(grid[0], headers);
});
