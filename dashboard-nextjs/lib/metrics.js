// lib/metrics.js
//
// Pipeline metrics. Official definitions live in docs/metrics.md, and the
// same logic lives in sheets-template/Metrics.gs: change both together.
//
// Changes from v1:
// - Response rate no longer counts "Saved" or "Withdrawn" as replies.
//   Denominator = sent applications (excluding saved ones and those
//   withdrawn before any reply). Numerator = applications that reached any
//   stage implying a reply from the company (rejection included).
// - Time per stage comes from the event history (enter a stage -> leave
//   it). Without history it cannot be measured, and the function says so
//   instead of making up a number.

import { STAGES } from './constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Roles by position: 1st = saved, 2nd = applied, last three = closed.
export function stageRoles(stages = STAGES) {
  const n = stages.length;
  return {
    saved: stages[0],
    applied: stages[1],
    accepted: stages[n - 3],
    rejected: stages[n - 2],
    withdrawn: stages[n - 1],
    closed: stages.slice(n - 3),
    pipeline: stages.slice(1, n - 2),
    response: stages.filter((_, i) => i > 1 && i !== n - 1),
  };
}

/**
 * @param {Array} jobs     [{ jobId, status, source, applicationDate, lastUpdate }]
 * @param {Array} history  [{ ts, jobId, from, to, note }]
 * @param {Object} opts    { stages, staleDays, now }
 */
export function computeMetrics(jobs, history = [], opts = {}) {
  const stages = opts.stages || STAGES;
  const staleDays = opts.staleDays ?? 7;
  const now = opts.now ? new Date(opts.now).getTime() : Date.now();
  const roles = stageRoles(stages);

  const eventsById = {};
  for (const h of history) (eventsById[h.jobId] ||= []).push(h);
  for (const list of Object.values(eventsById)) list.sort((a, b) => new Date(a.ts) - new Date(b.ts));

  const reachedStages = (job) => {
    const set = new Set(job.status ? [job.status] : []);
    for (const h of eventsById[job.jobId] || []) {
      if (h.from) set.add(h.from);
      if (h.to) set.add(h.to);
    }
    return set;
  };

  // ---- Response, funnel and source ----
  const pipelineIndex = Object.fromEntries(roles.pipeline.map((s, i) => [s, i]));
  const funnelCounts = roles.pipeline.map(() => 0);
  const bySourceMap = {};
  let applied = 0;
  let responded = 0;

  for (const job of jobs) {
    const reached = reachedStages(job);
    const gotResponse = roles.response.some((s) => reached.has(s));
    if (job.status === roles.saved) continue;
    if (job.status === roles.withdrawn && !gotResponse) continue;

    applied++;
    if (gotResponse) responded++;

    let maxIdx = 0;
    for (const s of reached) if (pipelineIndex[s] !== undefined) maxIdx = Math.max(maxIdx, pipelineIndex[s]);
    for (let i = 0; i <= maxIdx; i++) funnelCounts[i]++;

    const src = job.source || '(no source)';
    bySourceMap[src] ||= { source: src, applied: 0, responded: 0 };
    bySourceMap[src].applied++;
    if (gotResponse) bySourceMap[src].responded++;
  }

  const funnel = roles.pipeline.map((stage, i) => ({
    stage,
    count: funnelCounts[i],
    pctOfApplied: applied ? funnelCounts[i] / applied : null,
    conversionFromPrev: i && funnelCounts[i - 1] ? funnelCounts[i] / funnelCounts[i - 1] : null,
  }));

  let biggestDrop = null;
  for (let k = 1; k < funnel.length; k++) {
    const from = funnel[k - 1].count;
    if (!from) continue;
    const loss = (from - funnel[k].count) / from;
    if (!biggestDrop || loss > biggestDrop.loss) {
      biggestDrop = { from: funnel[k - 1].stage, to: funnel[k].stage, loss, lost: from - funnel[k].count };
    }
  }

  const bySource = Object.values(bySourceMap)
    .map((s) => ({ ...s, rate: s.applied ? s.responded / s.applied : null }))
    .sort((a, b) => b.applied - a.applied);

  // ---- Days per stage (completed stints only, from history) ----
  const durations = {};
  for (const list of Object.values(eventsById)) {
    const changes = list.filter((h) => h.to && h.from !== h.to);
    for (let j = 0; j < changes.length - 1; j++) {
      const stage = changes[j].to;
      if (roles.closed.includes(stage)) continue;
      const days = (new Date(changes[j + 1].ts) - new Date(changes[j].ts)) / DAY_MS;
      if (days >= 0) (durations[stage] ||= []).push(days);
    }
  }
  const avgDaysByStage = stages
    .filter((s) => durations[s])
    .map((s) => ({
      stage: s,
      avgDays: durations[s].reduce((a, b) => a + b, 0) / durations[s].length,
      samples: durations[s].length,
    }));

  // ---- Per week (last 12) ----
  const monday = startOfWeek(now);
  const weekly = Array.from({ length: 12 }, (_, i) => ({
    weekStart: new Date(monday - (11 - i) * 7 * DAY_MS).toISOString().slice(0, 10),
    count: 0,
  }));
  for (const job of jobs) {
    if (!job.applicationDate || job.status === roles.saved) continue;
    const t = new Date(job.applicationDate).getTime();
    if (Number.isNaN(t)) continue;
    const idx = 11 - Math.floor((monday - startOfWeek(t)) / (7 * DAY_MS));
    if (idx >= 0 && idx < 12) weekly[idx].count++;
  }

  // ---- Stalled ----
  const staleJobs = [];
  let active = 0;
  for (const job of jobs) {
    if (roles.closed.includes(job.status)) continue;
    active++;
    if (!job.lastUpdate) continue;
    const d = Math.floor((now - new Date(job.lastUpdate).getTime()) / DAY_MS);
    if (d >= staleDays) staleJobs.push({ jobId: job.jobId, daysSinceMove: d });
  }

  return {
    total: jobs.length,
    active,
    applied,
    responded,
    responseRate: applied ? responded / applied : null,
    funnel,
    biggestDrop,
    avgDaysByStage,
    hasHistory: history.length > 0,
    weekly,
    bySource,
    staleJobs,
    staleDays,
  };
}

function startOfWeek(t) {
  const d = new Date(t);
  const day = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - day * DAY_MS;
}
