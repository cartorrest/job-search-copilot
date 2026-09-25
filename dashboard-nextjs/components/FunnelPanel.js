'use client';

import { computeMetrics } from '@/lib/metrics';
import { STATUS_STYLES } from '@/lib/constants';

const pct = (x) => (x === null || x === undefined ? '—' : `${Math.round(x * 100)}%`);

export default function FunnelPanel({ jobs, history }) {
  const m = computeMetrics(jobs, history);
  if (!m.applied) return null;
  const max = Math.max(1, ...m.funnel.map((f) => f.count));
  const maxDays = Math.max(1, ...m.avgDaysByStage.map((s) => s.avgDays));

  return (
    <div className="grid gap-3 md:grid-cols-2 mb-6">
      <section className="bg-white border border-blueprint-100 rounded-xl px-4 py-3">
        <h3 className="text-sm font-medium text-ink">Funnel</h3>
        <p className="text-[11px] text-ink/40 mb-2">Applications that reached at least each stage</p>
        {m.funnel.map((f) => (
          <div key={f.stage} className="grid grid-cols-[84px_1fr_76px] items-center gap-2 my-1 text-xs">
            <span className="text-ink/70">{f.stage}</span>
            <div className="h-3 rounded bg-blueprint-50 overflow-hidden">
              <div
                className={`h-full rounded ${STATUS_STYLES[f.stage]?.dot || 'bg-blueprint-500'}`}
                style={{ width: `${Math.max(2, (f.count / max) * 100)}%` }}
              />
            </div>
            <span className="text-right tabular-nums text-ink/60">
              {f.count} · {pct(f.pctOfApplied)}
            </span>
          </div>
        ))}
        {m.biggestDrop && m.biggestDrop.lost > 0 && (
          <p className="mt-2 text-xs rounded-lg bg-status-withdrawn/10 text-status-withdrawn px-3 py-2">
            Biggest drop-off: {m.biggestDrop.from} → {m.biggestDrop.to} ({pct(m.biggestDrop.loss)} lost)
          </p>
        )}
      </section>

      <section className="bg-white border border-blueprint-100 rounded-xl px-4 py-3">
        <h3 className="text-sm font-medium text-ink">Average days per stage</h3>
        <p className="text-[11px] text-ink/40 mb-2">From the event log: time between entering and leaving a stage</p>
        {m.avgDaysByStage.length === 0 && <p className="text-xs text-ink/40">Not enough history yet.</p>}
        {m.avgDaysByStage.map((s) => (
          <div key={s.stage} className="grid grid-cols-[84px_1fr_76px] items-center gap-2 my-1 text-xs" title={`${s.samples} transitions`}>
            <span className="text-ink/70">{s.stage}</span>
            <div className="h-3 rounded bg-blueprint-50 overflow-hidden">
              <div
                className={`h-full rounded ${STATUS_STYLES[s.stage]?.dot || 'bg-blueprint-500'}`}
                style={{ width: `${Math.max(2, (s.avgDays / maxDays) * 100)}%` }}
              />
            </div>
            <span className="text-right tabular-nums text-ink/60">{s.avgDays.toFixed(1)} d</span>
          </div>
        ))}
      </section>
    </div>
  );
}
