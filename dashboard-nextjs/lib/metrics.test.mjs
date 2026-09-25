// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeMetrics, stageRoles } from './metrics.js';
import { buildDemoData } from './demoData.js';

const NOW = '2026-09-24T12:00:00Z';

const jobs = [
  { jobId: 'A', status: 'Applied', source: 'X', applicationDate: '2026-09-01T12:00:00Z', lastUpdate: '2026-09-01T12:00:00Z' },
  { jobId: 'B', status: 'Rejected', source: 'X', applicationDate: '2026-09-01T12:00:00Z', lastUpdate: '2026-09-05T12:00:00Z' },
  { jobId: 'C', status: 'Interview', source: 'Y', applicationDate: '2026-09-10T12:00:00Z', lastUpdate: '2026-09-20T12:00:00Z' },
  { jobId: 'D', status: 'Saved', source: 'Y', applicationDate: '', lastUpdate: '2026-09-01T12:00:00Z' },
  { jobId: 'E', status: 'Withdrawn', source: 'Y', applicationDate: '2026-09-02T12:00:00Z', lastUpdate: '2026-09-03T12:00:00Z' },
];
const history = [
  { ts: '2026-09-01T12:00:00Z', jobId: 'B', from: '', to: 'Applied' },
  { ts: '2026-09-05T12:00:00Z', jobId: 'B', from: 'Applied', to: 'Rejected' },
  { ts: '2026-09-10T12:00:00Z', jobId: 'C', from: '', to: 'Applied' },
  { ts: '2026-09-14T12:00:00Z', jobId: 'C', from: 'Applied', to: 'Screening' },
  { ts: '2026-09-15T12:00:00Z', jobId: 'C', from: 'Screening', to: 'Screening', note: 'call notes' },
  { ts: '2026-09-20T12:00:00Z', jobId: 'C', from: 'Screening', to: 'Interview' },
];

test('stage roles come from position in the list', () => {
  const r = stageRoles();
  assert.equal(r.saved, 'Saved');
  assert.equal(r.applied, 'Applied');
  assert.deepEqual(r.closed, ['Hired', 'Rejected', 'Withdrawn']);
  assert.deepEqual(r.pipeline, ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']);
  assert.ok(r.response.includes('Rejected'));
  assert.ok(!r.response.includes('Withdrawn'));
});

test('response rate excludes Saved and Withdrawn-without-reply', () => {
  const m = computeMetrics(jobs, history, { now: NOW });
  assert.equal(m.applied, 3); // A, B, C
  assert.equal(m.responded, 2); // B (rejection is a reply) and C
  assert.equal(m.responseRate, 2 / 3);
});

test('v1 bug is fixed: Saved and Withdrawn are not counted as replies', () => {
  const m = computeMetrics(
    [
      { jobId: '1', status: 'Saved' },
      { jobId: '2', status: 'Withdrawn' },
      { jobId: '3', status: 'Applied' },
    ],
    [],
    { now: NOW }
  );
  assert.equal(m.responseRate, 0); // v1 reported 67%
});

test('funnel counts the furthest stage reached, using history', () => {
  const m = computeMetrics(jobs, history, { now: NOW });
  assert.deepEqual(
    m.funnel.map((f) => f.count),
    [3, 1, 1, 0, 0]
  );
  assert.equal(m.biggestDrop.from, 'Interview'); // 1 -> 0 is a 100% loss
  assert.equal(m.biggestDrop.to, 'Offer');
});

test('days per stage come from completed transitions; notes do not split a stage', () => {
  const m = computeMetrics(jobs, history, { now: NOW });
  const avg = Object.fromEntries(m.avgDaysByStage.map((s) => [s.stage, s.avgDays]));
  assert.equal(avg.Applied, 4);
  assert.equal(avg.Screening, 6);
  assert.equal(avg.Interview, undefined); // still open, not a completed stint
});

test('without history there is no time-per-stage (instead of a made-up number)', () => {
  const m = computeMetrics(jobs, [], { now: NOW });
  assert.equal(m.hasHistory, false);
  assert.deepEqual(m.avgDaysByStage, []);
});

test('stalled = open and N+ days without movement', () => {
  const m = computeMetrics(jobs, history, { now: NOW, staleDays: 7 });
  assert.deepEqual(m.staleJobs.map((j) => j.jobId).sort(), ['A', 'D']);
});

test('reply rate by source', () => {
  const m = computeMetrics(jobs, history, { now: NOW });
  const rate = Object.fromEntries(m.bySource.map((s) => [s.source, s.rate]));
  assert.equal(rate.X, 0.5);
  assert.equal(rate.Y, 1);
});

test('demo data is deterministic, fictional and internally consistent', () => {
  const today = new Date(NOW);
  const a = buildDemoData(today);
  const b = buildDemoData(today);
  assert.deepEqual(a, b);
  assert.ok(a.jobs.length >= 25);
  for (const job of a.jobs) {
    assert.match(job.jobUrl, /^https:\/\/example\.com\//);
    const events = a.history.filter((h) => h.jobId === job.jobId && h.from !== h.to);
    assert.equal(events.at(-1).to, job.status, `${job.jobId} history ends in its current status`);
    assert.ok(new Date(job.lastUpdate) <= today);
  }
});
