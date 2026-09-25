/**
 * DATOS DE EJEMPLO — 30 postulaciones FICTICIAS con historial coherente.
 * Todas usan IDs "DEMO-xx", así "Borrar datos de ejemplo" las quita sin tocar tus datos.
 */

var DEMO_PREFIX = 'DEMO-';

var DEMO_COMPANIES = [
  'Acme Corp', 'Globex', 'Initech', 'Hooli', 'Umbrella Analytics', 'Stark Digital',
  'Wayne Logistics', 'Pied Piper', 'Soylent Foods', 'Vandelay Imports', 'Wonka Labs',
  'Cyberdyne Systems', 'Tyrell Data', 'Massive Dynamic', 'Oscorp Remote', 'Dunder Mifflin',
  'Monsters Inc', 'Aperture Science', 'Black Mesa', 'Nakatomi Trading', 'Gringotts Fintech',
  'Oceanic Travel', 'Sirius Cybernetics', 'Blue Sun Retail', 'Buy n Large', 'Prestige Worldwide',
];
var DEMO_ROLES = [
  'Data Analyst', 'BI Analyst', 'Project Coordinator', 'Operations Analyst', 'Customer Success Specialist',
  'Reporting Analyst', 'Junior Data Engineer', 'Product Analyst', 'Administrative Assistant', 'Virtual Assistant',
];
var DEMO_SOURCES = ['LinkedIn', 'LinkedIn', 'Indeed', 'Referido', 'Página de la empresa', 'Workana', 'Get on Board'];
var DEMO_ROUND_NOTES = [
  'Filtro con RR. HH.: experiencia, disponibilidad y expectativa salarial. (ficticio)',
  'Entrevista técnica: caso práctico con SQL y un dashboard. (ficticio)',
  'Entrevista final con el líder del equipo: cultura y proyectos. (ficticio)',
];

/**
 * Cada escenario es la secuencia de etapas (por rol) y cuántos días pasa en cada una.
 * Roles: s=guardada a=aplicada p=en proceso i=entrevista o=oferta ac=aceptada r=rechazada w=retirada
 */
var DEMO_SCENARIOS = [
  { path: ['a'], weight: 11 },                          // sin respuesta
  { path: ['a', 'r'], weight: 5 },                      // rechazo directo
  { path: ['a', 'p', 'r'], weight: 4 },
  { path: ['a', 'p', 'i', 'r'], weight: 3 },
  { path: ['a', 'p'], weight: 2 },                      // en curso
  { path: ['a', 'p', 'i'], weight: 2 },
  { path: ['a', 'p', 'i', 'o'], weight: 1 },
  { path: ['a', 'p', 'i', 'o', 'ac'], weight: 1 },
  { path: ['a', 'w'], weight: 1 },                      // retirada sin respuesta
  { path: ['a', 'p', 'w'], weight: 1 },                 // retirada después de responder
  { path: ['s'], weight: 2 },                           // guardada, aún sin aplicar
];

function loadSampleData() {
  ensureSheets_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const apps = ss.getSheetByName(SHEETS.apps);
  const history = ss.getSheetByName(SHEETS.history);

  const existing = readApps_().some(a => a.id.indexOf(DEMO_PREFIX) === 0);
  if (existing) {
    ss.toast('Los datos de ejemplo ya están cargados.', 'Job Tracker', 5);
    return;
  }

  const data = buildSampleData_(getStages_(), new Date());
  apps.getRange(apps.getLastRow() + 1, 1, data.rows.length, APP_HEADERS.length).setValues(data.rows);
  history.getRange(history.getLastRow() + 1, 1, data.events.length, HISTORY_HEADERS.length).setValues(data.events);
  sortHistory_(history);
  ss.toast(data.rows.length + ' postulaciones ficticias cargadas. Abre el tablero para verlas.', 'Job Tracker', 6);
}

function clearSampleData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let removed = 0;
  [SHEETS.apps, SHEETS.history].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) return;
    const idCol = name === SHEETS.apps ? 1 : 2;
    const ids = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues();
    // De abajo hacia arriba para que los números de fila no se corran.
    for (let i = ids.length - 1; i >= 0; i--) {
      if (String(ids[i][0]).indexOf(DEMO_PREFIX) === 0) {
        sheet.deleteRow(i + 2);
        if (name === SHEETS.apps) removed++;
      }
    }
  });
  ss.toast(removed ? removed + ' postulaciones de ejemplo borradas.' : 'No había datos de ejemplo.', 'Job Tracker', 5);
}

function sortHistory_(sheet) {
  if (sheet.getLastRow() > 2) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, HISTORY_HEADERS.length).sort({ column: 1, ascending: true });
  }
}

/** Genera filas y eventos. Pseudoaleatorio con semilla fija: siempre produce los mismos datos. */
function buildSampleData_(stages, today) {
  const roles = stageRoles_(stages);
  const roleToStage = {
    s: roles.saved, a: roles.applied, p: stages[2], i: stages[3] || stages[2], o: stages[4] || stages[3],
    ac: roles.accepted, r: roles.rejected, w: roles.withdrawn,
  };
  let seed = 20260901;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const pick = list => list[Math.floor(rand() * list.length)];

  const scenarios = [];
  DEMO_SCENARIOS.forEach(s => { for (let k = 0; k < s.weight; k++) scenarios.push(s.path); });

  const rows = [];
  const events = [];
  scenarios.forEach((path, idx) => {
    const id = DEMO_PREFIX + String(idx + 1).padStart(2, '0');
    const empresa = DEMO_COMPANIES[idx % DEMO_COMPANIES.length];
    const cargo = pick(DEMO_ROLES);
    const fuente = pick(DEMO_SOURCES);
    let rounds = 0;

    // Cada etapa dura entre 2 y 12 días. Los procesos cerrados terminan en cualquier
    // momento de las últimas ~10 semanas; los abiertos tuvieron su último movimiento
    // hace 0-20 días (así algunas quedan "estancadas" y otras no).
    const gaps = path.map((_, step) => (step === 0 ? 0 : Math.floor(2 + rand() * 11) * DAY_MS));
    const span = gaps.reduce((a, b) => a + b, 0);
    const isClosed = roles.closed.indexOf(roleToStage[path[path.length - 1]]) !== -1;
    const endAgo = (isClosed ? Math.floor(1 + rand() * 50) : Math.floor(rand() * 21)) * DAY_MS;
    let t = today.getTime() - endAgo - span - Math.floor(1 + rand() * 8) * 3600 * 1000;
    const start = new Date(t);
    let prev = '';
    path.forEach((role, step) => {
      const stage = roleToStage[role];
      t += gaps[step];
      events.push([new Date(t), id, prev, stage, step === 0 ? 'Postulación creada (dato de ejemplo)' : '']);
      if (role === 'i') {
        // 1 a 3 rondas, cada 12 h (el tramo más corto entre etapas es de 2 días).
        rounds = 1 + Math.floor(rand() * 3);
        for (let k = 0; k < rounds; k++) {
          const when = Math.min(t + (k + 1) * DAY_MS / 2, today.getTime() - (rounds - k) * 60 * 1000);
          events.push([new Date(when), id, stage, stage, 'Ronda ' + (k + 1) + ' de entrevista: ' + DEMO_ROUND_NOTES[k]]);
        }
      }
      prev = stage;
    });

    const lastStage = roleToStage[path[path.length - 1]];
    const row = new Array(APP_HEADERS.length).fill('');
    row[COL.id] = id;
    row[COL.empresa] = empresa;
    row[COL.cargo] = cargo;
    row[COL.link] = 'https://example.com/vacantes/' + id.toLowerCase();
    row[COL.fuente] = fuente;
    row[COL.fechaAplicacion] = start;
    row[COL.etapa] = lastStage;
    row[COL.rondas] = rounds;
    // Las rondas también cuentan como movimiento.
    row[COL.fechaMovimiento] = new Date(Math.max.apply(null, events.filter(e => e[1] === id).map(e => e[0].getTime())));
    row[COL.cv] = pick(['CV general v2', 'CV datos v1', 'CV operaciones v1']);
    row[COL.salario] = pick(['', 'USD 1.500-2.000', 'USD 2.000-2.500', 'A convenir']);
    row[COL.contacto] = rand() < 0.3 ? 'Reclutador ficticio' : '';
    row[COL.proximoPaso] = lastStage === roleToStage.i ? 'Enviar agradecimiento y preparar prueba técnica' : lastStage === roleToStage.a ? 'Hacer seguimiento si no responden' : '';
    row[COL.notas] = '[DATO DE EJEMPLO] Empresa y vacante ficticias.';
    rows.push(row);
  });

  return { rows: rows, events: events };
}
