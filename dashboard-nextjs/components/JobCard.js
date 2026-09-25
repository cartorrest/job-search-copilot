'use client';

import StatusDropdown from './StatusDropdown';
import { daysSince, formatDate } from '@/lib/dates';
import { CLOSED_STATUSES, STALE_DAYS_THRESHOLD, STATUS_STYLES } from '@/lib/constants';
import { formatMatchPercent, isValidUrl } from '@/lib/format';

export default function JobCard({ job, history = [], onStatusChange }) {
  const daysStale = daysSince(job.lastUpdate);
  const isStale =
    !CLOSED_STATUSES.includes(job.status) && daysStale !== null && daysStale >= STALE_DAYS_THRESHOLD;
  const matchLabel = formatMatchPercent(job.matchPercent);
  const hasValidUrl = isValidUrl(job.jobUrl);
  const styles = STATUS_STYLES[job.status] || {};
  const timeline = [...history].sort((a, b) => new Date(b.ts) - new Date(a.ts));

  return (
    <div
      className={`bg-white border border-blueprint-100 border-l-4 ${styles.border || ''} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative`}
    >
      {/* Blueprint-style stamp with the Job ID */}
      <span className="job-id-stamp absolute top-3 right-3 text-blueprint-300">{job.jobId}</span>

      {hasValidUrl ? (
        <a
          href={job.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display font-semibold text-ink leading-snug pr-16 block hover:text-blueprint-500"
        >
          {job.company}
        </a>
      ) : (
        <p className="font-display font-semibold text-ink leading-snug pr-16">{job.company}</p>
      )}
      <p className="text-sm text-ink/70 mb-3">{job.position}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.source && (
          <span className="text-[11px] bg-blueprint-50 text-blueprint-700 rounded-full px-2 py-0.5">
            {job.source}
          </span>
        )}
        {matchLabel && (
          <span className="text-[11px] bg-blueprint-50 text-blueprint-700 rounded-full px-2 py-0.5">
            {matchLabel} match
          </span>
        )}
        {job.salary && (
          <span className="text-[11px] bg-blueprint-50 text-blueprint-700 rounded-full px-2 py-0.5">
            {job.salary}
          </span>
        )}
        {isStale && (
          <span className="text-[11px] bg-status-rejected/10 text-status-rejected rounded-full px-2 py-0.5">
            {daysStale}d without movement
          </span>
        )}
      </div>

      {job.nextStep && (
        <p className="text-xs text-ink/60 mb-3">
          <span className="font-medium text-ink/80">Next:</span> {job.nextStep}
        </p>
      )}

      {timeline.length > 0 && (
        <details className="mb-3 text-xs">
          <summary className="cursor-pointer text-ink/50 hover:text-ink/80 select-none">
            History ({timeline.length})
          </summary>
          <ol className="mt-2 border-l-2 border-blueprint-100 pl-3 space-y-1.5">
            {timeline.map((h, i) => (
              <li key={i}>
                <span className="text-ink/40">{formatDate(h.ts)} · </span>
                {h.from === h.to ? (
                  <span className="text-ink/70">{h.note}</span>
                ) : (
                  <span className="text-ink/80">
                    {h.from ? `${h.from} → ${h.to}` : `Created as ${h.to}`}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-blueprint-50">
        <span className="text-[11px] text-ink/40">Updated {formatDate(job.lastUpdate)}</span>
        <StatusDropdown job={job} onStatusChange={onStatusChange} />
      </div>
    </div>
  );
}
