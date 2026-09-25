'use client';

export default function FilterBar({ jobs, filters, setFilters }) {
  const sources = Array.from(new Set(jobs.map((j) => j.source).filter(Boolean))).sort();

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <input
        type="text"
        placeholder="Search company or role..."
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        className="flex-1 min-w-[200px] rounded-lg border border-blueprint-100 bg-white px-3 py-2 text-sm outline-none focus:border-blueprint-500 transition-colors"
      />

      <select
        value={filters.source}
        onChange={(e) => setFilters({ ...filters, source: e.target.value })}
        className="rounded-lg border border-blueprint-100 bg-white px-3 py-2 text-sm outline-none focus:border-blueprint-500 transition-colors"
      >
        <option value="">All sources</option>
        {sources.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filters.sortBy}
        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
        className="rounded-lg border border-blueprint-100 bg-white px-3 py-2 text-sm outline-none focus:border-blueprint-500 transition-colors"
      >
        <option value="lastUpdate">Sort: last update</option>
        <option value="matchPercent">Sort: best match</option>
        <option value="applicationDate">Sort: application date</option>
      </select>

      <label className="flex items-center gap-1.5 text-sm text-ink/70 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.showClosed}
          onChange={(e) => setFilters({ ...filters, showClosed: e.target.checked })}
        />
        Show closed
      </label>
    </div>
  );
}
