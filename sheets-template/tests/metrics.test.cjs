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
