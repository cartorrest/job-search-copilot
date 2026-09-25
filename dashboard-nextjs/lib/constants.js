// lib/constants.js

// Full stage order. Metrics depend on position: 1st = saved, 2nd = applied,
// last three = closed (hired, rejected, withdrawn). See docs/metrics.md.
export const STAGES = [
  'Saved',
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected',
  'Withdrawn',
];

// Options in each card's status dropdown.
export const STATUS_FLOW = STAGES;

// Kanban board columns.
export const BOARD_COLUMNS = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer'];

// Hidden by default; shown with "Show closed".
export const CLOSED_STATUSES = ['Hired', 'Rejected', 'Withdrawn'];

// One place for each status color. Class names are written out in FULL
// (not built with ${status}) because Tailwind only generates classes it
// can see as literal text; dynamic template strings would leave cards
// without color.
export const STATUS_STYLES = {
  Saved: {
    border: 'border-l-status-saved',
    dot: 'bg-status-saved',
    badge: 'bg-status-saved/10 text-status-saved',
  },
  Hired: {
    border: 'border-l-status-hired',
    dot: 'bg-status-hired',
    badge: 'bg-status-hired/10 text-status-hired',
  },
  Applied: {
    border: 'border-l-status-applied',
    dot: 'bg-status-applied',
    badge: 'bg-status-applied/10 text-status-applied',
  },
  Screening: {
    border: 'border-l-status-screening',
    dot: 'bg-status-screening',
    badge: 'bg-status-screening/10 text-status-screening',
  },
  Interview: {
    border: 'border-l-status-interview',
    dot: 'bg-status-interview',
    badge: 'bg-status-interview/10 text-status-interview',
  },
  Offer: {
    border: 'border-l-status-offer',
    dot: 'bg-status-offer',
    badge: 'bg-status-offer/10 text-status-offer',
  },
  Rejected: {
    border: 'border-l-status-rejected',
    dot: 'bg-status-rejected',
    badge: 'bg-status-rejected/10 text-status-rejected',
  },
  Withdrawn: {
    border: 'border-l-status-withdrawn',
    dot: 'bg-status-withdrawn',
    badge: 'bg-status-withdrawn/10 text-status-withdrawn',
  },
};

// Same threshold as the template's default stall alert.
export const STALE_DAYS_THRESHOLD = 7;

// Shown in any empty column.
export const EMPTY_COLUMN_MESSAGE = 'Nothing here yet';
