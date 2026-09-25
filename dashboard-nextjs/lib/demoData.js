// lib/demoData.js
//
// FICTIONAL data for demo mode: made-up or fictional companies, links to
// example.com, no real people. A fixed seed makes the demo start the same
// way every time; dates are relative to "today" so it never looks stale.

const DAY_MS = 24 * 60 * 60 * 1000;

const COMPANIES = [
  'Acme Corp', 'Globex', 'Initech', 'Hooli', 'Umbrella Analytics', 'Stark Digital',
  'Wayne Logistics', 'Pied Piper', 'Soylent Foods', 'Vandelay Imports', 'Wonka Labs',
  'Cyberdyne Systems', 'Tyrell Data', 'Massive Dynamic', 'Oscorp Remote', 'Dunder Mifflin',
  'Monsters Inc', 'Aperture Science', 'Black Mesa', 'Nakatomi Trading', 'Gringotts Fintech',
  'Oceanic Travel', 'Sirius Cybernetics', 'Blue Sun Retail', 'Buy n Large', 'Prestige Worldwide',
];
const ROLES = [
  'Data Analyst', 'BI Analyst', 'Project Coordinator', 'Operations Analyst',
  'Customer Success Specialist', 'Reporting Analyst', 'Junior Data Engineer', 'Product Analyst',
];
const SOURCES = ['LinkedIn', 'LinkedIn', 'Indeed', 'Referral', 'Company site', 'Get on Board', 'Wellfound'];
const SALARIES = ['', 'USD 1,500-2,000', 'USD 2,000-2,500', 'USD 2,500-3,000'];
const CVS = ['CV Data v2', 'CV Ops v1', 'CV General v3'];

// Stage sequences and how often each one appears (~30 in total).
const SCENARIOS = [
  { path: ['Applied'], weight: 11 },
  { path: ['Applied', 'Rejected'], weight: 5 },
  { path: ['Applied', 'Screening', 'Rejected'], weight: 4 },
  { path: ['Applied', 'Screening', 'Interview', 'Rejected'], weight: 3 },
  { path: ['Applied', 'Screening'], weight: 2 },
  { path: ['Applied', 'Screening', 'Interview'], weight: 2 },
  { path: ['Applied', 'Screening', 'Interview', 'Offer'], weight: 1 },
  { path: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'], weight: 1 },
  { path: ['Applied', 'Withdrawn'], weight: 1 },
  { path: ['Applied', 'Screening', 'Withdrawn'], weight: 1 },
];
const CLOSED = ['Hired', 'Rejected', 'Withdrawn'];

export function buildDemoData(today = new Date()) {
  let seed = 20260901;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const pick = (list) => list[Math.floor(rand() * list.length)];

  const paths = SCENARIOS.flatMap((s) => Array(s.weight).fill(s.path));
  const jobs = [];
  const history = [];
  const now = today.getTime();

  paths.forEach((path, idx) => {
    const jobId = `DEMO-${String(idx + 1).padStart(3, '0')}`;
    const gaps = path.map((_, step) => (step === 0 ? 0 : Math.floor(2 + rand() * 11) * DAY_MS));
    const span = gaps.reduce((a, b) => a + b, 0);
    const last = path[path.length - 1];
    const endAgo = (CLOSED.includes(last) ? Math.floor(1 + rand() * 50) : Math.floor(rand() * 21)) * DAY_MS;
    let t = now - endAgo - span - Math.floor(1 + rand() * 8) * 3600 * 1000;
    const applicationDate = new Date(t).toISOString();

    let from = '';
    path.forEach((stage, step) => {
      t += gaps[step];
      history.push({ ts: new Date(t).toISOString(), jobId, from, to: stage, note: step === 0 ? 'Created (demo data)' : '' });
      if (stage === 'Interview') {
        history.push({
          ts: new Date(Math.min(t + DAY_MS, now - 60 * 1000)).toISOString(),
          jobId, from: stage, to: stage,
          note: 'HR screen: asked about SQL, dashboards and availability. (fictional)',
        });
      }
      from = stage;
    });

    jobs.push({
      jobId,
      company: COMPANIES[idx % COMPANIES.length],
      position: pick(ROLES),
      jobUrl: `https://example.com/jobs/${jobId.toLowerCase()}`,
      source: pick(SOURCES),
      salary: pick(SALARIES),
      matchPercent: 55 + Math.floor(rand() * 40),
      bestCV: pick(CVS),
      status: last,
      applicationDate,
      lastUpdate: new Date(t).toISOString(),
      nextStep: last === 'Interview' ? 'Send thank-you note, prep case study' : last === 'Applied' ? 'Follow up if no reply' : '',
      notes: '[DEMO] Fictional company and vacancy.',
    });
  });

  return { jobs, history };
}
