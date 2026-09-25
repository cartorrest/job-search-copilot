'use client';

import { useEffect, useMemo, useState } from 'react';
import JobCard from '@/components/JobCard';
import FilterBar from '@/components/FilterBar';
import MetricsBar from '@/components/MetricsBar';
import FunnelPanel from '@/components/FunnelPanel';
import DemoBanner from '@/components/DemoBanner';
import { BOARD_COLUMNS, CLOSED_STATUSES, STATUS_STYLES, EMPTY_COLUMN_MESSAGE } from '@/lib/constants';
import { parseMatchPercent } from '@/lib/format';
import { loadDemo, saveDemo, resetDemo } from '@/lib/demoStore';

export default function Dashboard({ demo }) {
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    sortBy: 'lastUpdate',
    showClosed: false,
  });

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadJobs() {
    setLoading(true);
    setError(null);
    if (demo) {
      const data = loadDemo();
      setJobs(data.jobs);
      setHistory(data.history);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/jobs', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setJobs(data.jobs);
      setHistory(data.history || []);
    } catch {
      setError('Could not reach the tracker. Check the environment variables in Vercel.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    const data = resetDemo();
    setJobs(data.jobs);
    setHistory(data.history);
  }

  async function handleStatusChange(jobId, newStatus) {
    const previousJobs = jobs;
    const previousHistory = history;
    const current = jobs.find((j) => j.jobId === jobId);
    const now = new Date().toISOString();
    const nextJobs = jobs.map((j) => (j.jobId === jobId ? { ...j, status: newStatus, lastUpdate: now } : j));
    const nextHistory = [...history, { ts: now, jobId, from: current?.status || '', to: newStatus, note: '' }];

    // Optimistic update: the card moves right away and rolls back on failure.
    setJobs(nextJobs);
    setHistory(nextHistory);

    if (demo) {
      saveDemo({ jobs: nextJobs, history: nextHistory });
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { Status: newStatus } }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setJobs(previousJobs);
      setHistory(previousHistory);
      alert('Could not update the status. Please try again.');
    }
  }

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (j) => j.company?.toLowerCase().includes(q) || j.position?.toLowerCase().includes(q)
      );
    }
    if (filters.source) {
      result = result.filter((j) => j.source === filters.source);
    }
    if (!filters.showClosed) {
      result = result.filter((j) => !CLOSED_STATUSES.includes(j.status));
    }

    return [...result].sort((a, b) => {
      if (filters.sortBy === 'matchPercent') {
        return (parseMatchPercent(b.matchPercent) || 0) - (parseMatchPercent(a.matchPercent) || 0);
      }
      if (filters.sortBy === 'applicationDate') {
        return new Date(b.applicationDate || 0) - new Date(a.applicationDate || 0);
      }
      return new Date(b.lastUpdate || 0) - new Date(a.lastUpdate || 0);
    });
  }, [jobs, filters]);

  const historyByJob = useMemo(() => {
    const map = {};
    for (const h of history) (map[h.jobId] ||= []).push(h);
    return map;
  }, [history]);

  const columns = filters.showClosed ? [...BOARD_COLUMNS, ...CLOSED_STATUSES] : BOARD_COLUMNS;

  return (
    <div className="blueprint-bg min-h-screen">
      {demo && <DemoBanner onReset={handleReset} />}
      <div className="px-4 sm:px-6 py-8">
        <header className="mb-6">
          <h1 className="font-display font-semibold text-2xl text-ink">Job Search Copilot</h1>
          <p className="text-sm text-ink/60">Application pipeline, live from a Google Sheet</p>
        </header>

        {loading && <p className="text-sm text-ink/60">Loading applications...</p>}

        {error && (
          <div className="bg-status-rejected/10 text-status-rejected text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <MetricsBar jobs={jobs} history={history} />
            <FunnelPanel jobs={jobs} history={history} />
            <FilterBar jobs={jobs} filters={filters} setFilters={setFilters} />

            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((status) => {
                const columnJobs = filteredJobs.filter((j) => j.status === status);
                return (
                  <div key={status} className="min-w-[280px] w-[280px] flex-shrink-0">
                    <h2 className="text-sm font-medium text-ink/70 mb-3 flex items-center gap-1.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${STATUS_STYLES[status]?.dot || 'bg-ink/40'}`}
                      />
                      {status} <span className="text-ink/40">({columnJobs.length})</span>
                    </h2>
                    <div className="flex flex-col gap-3">
                      {columnJobs.length === 0 ? (
                        <p className="text-xs text-ink/30 text-center py-6 px-2">{EMPTY_COLUMN_MESSAGE}</p>
                      ) : (
                        columnJobs.map((job) => (
                          <JobCard
                            key={job.jobId}
                            job={job}
                            history={historyByJob[job.jobId] || []}
                            onStatusChange={handleStatusChange}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
