// lib/constants.js

// Orden completo de etapas. Las metricas dependen de la posicion:
// 1a = guardada, 2a = aplicada, 3 ultimas = cierres (contratado,
// rechazado, retirado). Ver docs/metrics.md.
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

// Opciones del desplegable de cada tarjeta.
export const STATUS_FLOW = STAGES;

// Las columnas del tablero (Kanban).
export const BOARD_COLUMNS = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer'];

// Estados que se ocultan por defecto y solo se ven con "Ver cerradas".
export const CLOSED_STATUSES = ['Hired', 'Rejected', 'Withdrawn'];

// Un solo lugar con el color de cada estado. Las clases estan escritas
// COMPLETAS (no armadas con ${status}) porque Tailwind necesita verlas
// tal cual, como texto literal, para generarlas -- si las armaramos
// dinamicamente con un template string, Tailwind nunca las detectaria
// y la tarjeta se veria sin color.
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

// Mismo criterio que usa el trigger de alertas por correo en Apps Script.
export const STALE_DAYS_THRESHOLD = 7;

// Mensaje generico para cuando una columna del tablero no tiene ninguna
// vacante. Un solo lugar decide el texto, asi que se ve igual sin
// importar cual columna este vacia (Applied, Screening, Interview,
// Offer, o las de cerradas cuando "Ver cerradas" esta activo).
export const EMPTY_COLUMN_MESSAGE = 'Nothing here yet';
