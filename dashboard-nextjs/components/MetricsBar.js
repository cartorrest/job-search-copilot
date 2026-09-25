'use client';

import { computeMetrics } from '@/lib/metrics';
import { STALE_DAYS_THRESHOLD } from '@/lib/constants';

const pct = (x) => (x === null || x === undefined ? '—' : `${Math.round(x * 100)}%`);

function StatCard({ label, value, sublabel }) {
  return (
    <div className="bg-white border border-blueprint-100 rounded-xl px-4 py-3 min-w-[150px] flex-1">
      <p className="text-xl font-display font-semibold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-ink/60">{label}</p>
      {sublabel && <p className="text-[11px] text-ink/40 mt-0.5">{sublabel}</p>}
    </div>
  );
}

export default function MetricsBar({ jobs, history }) {
  const m = computeMetrics(jobs, history, { staleDays: STALE_DAYS_THRESHOLD });

  const slowest = [...m.avgDaysByStage].sort((a, b) => b.avgDays - a.avgDays)[0];
  const bestSource = m.bySource
    .filter((s) => s.applied >= 3)
    .sort((a, b) => b.rate - a.rate)[0];

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <StatCard label="Applied this week" value={m.weekly.at(-1).count} sublabel="Monday to today" />
      <StatCard
        label="Response rate"
        value={pct(m.responseRate)}
        sublabel={m.applied ? `${m.responded} of ${m.applied} sent got a reply` : undefined}
      />
      <StatCard
        label="Slowest stage"
        value={slowest ? slowest.stage : '—'}
        sublabel={
          slowest
            ? `${slowest.avgDays.toFixed(1)} days avg · ${slowest.samples} transitions`
            : m.hasHistory
              ? 'Not enough transitions yet'
              : 'Needs stage history'
        }
      />
      <StatCard
        label="Best source by reply rate"
        value={bestSource ? bestSource.source : '—'}
        sublabel={bestSource ? `${pct(bestSource.rate)} of ${bestSource.applied} applications` : 'Min. 3 applications'}
      />
      <StatCard label="Stalled" value={m.staleJobs.length} sublabel={`${m.staleDays}+ days without movement`} />
    </div>
  );
}
