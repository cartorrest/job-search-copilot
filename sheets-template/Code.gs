/**
 * JOB TRACKER — plantilla de Google Sheets
 * ----------------------------------------
 * Todo vive dentro de este Sheet: no hay tokens, APIs externas ni IA.
 *
 *   Postulaciones  -> estado actual de cada postulación (una fila por postulación)
 *   Historial      -> log de eventos: cada cambio de etapa o nota agrega una fila
 *   Config         -> días para marcar "estancada", correo opcional y lista de etapas
 *
 * El tablero (Index.html) se abre desde el menú "Job Tracker" como una ventana
 * dentro del Sheet. Opcionalmente se puede implementar como web app
 * ("Ejecutar como: yo", "Acceso: solo yo") para usarlo desde el celular.
 *
 * Archivos del proyecto:
 *   Code.gs        -> menú, configuración, lectura/escritura, alertas
 *   Metrics.gs     -> cálculo de métricas (funciones puras, sin APIs de Google)
 *   SampleData.gs  -> datos de ejemplo ficticios
 */

const SHEETS = {
  apps: 'Postulaciones',
  history: 'Historial',
  config: 'Config',
};

const APP_HEADERS = [
  'ID', 'Empresa', 'Cargo', 'Link', 'Fuente', 'Fecha aplicación', 'Etapa',
  'Rondas de entrevista', 'Fecha último movimiento', 'Versión de CV',
  'Salario', 'Contacto', 'Próximo paso', 'Notas', 'Alerta enviada',
];

// Índices (base 0) de cada columna de Postulaciones.
const COL = {
  id: 0, empresa: 1, cargo: 2, link: 3, fuente: 4, fechaAplicacion: 5,
  etapa: 6, rondas: 7, fechaMovimiento: 8, cv: 9,
  salario: 10, contacto: 11, proximoPaso: 12, notas: 13, alertaEnviada: 14,
};

// Versiones anteriores de la plantilla: columnas renombradas o eliminadas.
const RENAMED_HEADERS = { 'Empresa/Institución': 'Empresa', 'Cargo/Programa': 'Cargo', 'Versión CV/carta': 'Versión de CV' };
const REMOVED_HEADERS = ['Tipo'];

const HISTORY_HEADERS = ['Timestamp', 'ID', 'Etapa anterior', 'Etapa nueva', 'Nota'];

// Config se lee por posición de fila (no por texto), así se puede traducir la columna A.
const CONFIG_ROWS = [
  ['Días sin movimiento para marcar "estancada"', 7, 'Número entero. Las filas estancadas se pintan de naranja.'],
  ['Correo para alertas (opcional)', '', 'Déjalo en blanco si no quieres correos. Se envía máximo un correo por postulación.'],
  ['Idioma', 'es', 'Idioma de la interfaz. Por ahora: es.'],
  ['Etapas (en orden, separadas por coma)', '', 'La 1ª es "guardada", la 2ª es "aplicada" y las 3 últimas son cierres: aceptada, rechazada, retirada. Puedes agregar etapas en el medio.'],
];
const CONFIG_ROW = { staleDays: 2, email: 3, language: 4, stages: 5 };

const DEFAULT_STAGES = [
  'Guardada', 'Aplicada', 'En proceso', 'Entrevista', 'Oferta',
  'Aceptada', 'Rechazada', 'Retirada',
];
const ID_PREFIX = 'JT-';
const DAILY_HANDLER = 'dailyCheck';

// ---------------------------------------------------------------------
// MENÚ Y APERTURA DEL TABLERO
// ---------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Job Tracker')
    .addItem('Configurar por primera vez', 'setup')
    .addItem('Abrir tablero', 'openBoard')
    .addSeparator()
    .addItem('Cargar datos de ejemplo', 'loadSampleData')
    .addItem('Borrar datos de ejemplo', 'clearSampleData')
    .addSeparator()
    .addItem('Revisar estancadas ahora', 'dailyCheck')
    .addToUi();
}

function openBoard() {
  ensureSheets_();
  const html = buildBoardHtml_().setWidth(1400).setHeight(860);
  SpreadsheetApp.getUi().showModalDialog(html, 'Job Tracker');
}

/** Web app opcional. Implementar con "Ejecutar como: yo" y "Acceso: solo yo". */
function doGet() {
  return buildBoardHtml_()
    .setTitle('Job Tracker')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function buildBoardHtml_() {
  return HtmlService.createTemplateFromFile('Index').evaluate();
}

/** Permite <?!= include('Styles') ?> dentro de Index.html. */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

// ---------------------------------------------------------------------
// CONFIGURACIÓN INICIAL
// ---------------------------------------------------------------------

function setup() {
  ensureSheets_();
  installDailyTrigger_();
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Listo',
    'Se crearon las pestañas Postulaciones, Historial y Config, y la revisión diaria de postulaciones estancadas.\n\n' +
      'Siguiente paso: menú Job Tracker → Abrir tablero.\n' +
      'Si quieres ver cómo se ve con datos, usa "Cargar datos de ejemplo" (luego los puedes borrar).',
    ui.ButtonSet.OK
  );
}

/** Crea pestañas, encabezados, validaciones y formatos si no existen. Es seguro correrlo varias veces. */
function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const config = getOrCreateSheet_(ss, SHEETS.config);
  if (config.getLastRow() === 0) {
    config.getRange(1, 1, 1, 3).setValues([['Opción', 'Valor', 'Ayuda']]).setFontWeight('bold');
    const rows = CONFIG_ROWS.map(r => r.slice());
    rows[CONFIG_ROW.stages - 2][1] = DEFAULT_STAGES.join(', ');
    config.getRange(2, 1, rows.length, 3).setValues(rows);
    config.setColumnWidth(1, 320);
    config.setColumnWidth(2, 420);
    config.setColumnWidth(3, 520);
    config.setFrozenRows(1);
  }

  const apps = getOrCreateSheet_(ss, SHEETS.apps);
  if (apps.getLastRow() === 0) {
    apps.getRange(1, 1, 1, APP_HEADERS.length).setValues([APP_HEADERS])
      .setFontWeight('bold').setBackground('#1F4E6B').setFontColor('#FFFFFF');
    apps.setFrozenRows(1);
    apps.setColumnWidths(1, APP_HEADERS.length, 140);
    apps.setColumnWidth(COL.empresa + 1, 200);
    apps.setColumnWidth(COL.cargo + 1, 220);
    apps.setColumnWidth(COL.notas + 1, 280);
  } else {
    migrateAppsHeaders_(apps);
  }
  applyAppsFormatting_(apps);

  const history = getOrCreateSheet_(ss, SHEETS.history);
  if (history.getLastRow() === 0) {
    history.getRange(1, 1, 1, HISTORY_HEADERS.length).setValues([HISTORY_HEADERS])
      .setFontWeight('bold').setBackground('#1F4E6B').setFontColor('#FFFFFF');
    history.setFrozenRows(1);
    history.setColumnWidth(1, 170);
    history.setColumnWidth(5, 360);
    history.getRange('A2:A').setNumberFormat('yyyy-mm-dd hh:mm');
  }

  removeDefaultBlankSheet_(ss);
  ss.setActiveSheet(apps);
}

/**
 * Actualiza Sheets creados con una versión anterior de la plantilla:
 * renombra columnas, borra las que ya no se usan y agrega las nuevas en su lugar.
 */
function migrateAppsHeaders_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;
  let header = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  if (header.join('|') === APP_HEADERS.join('|')) return;

  header = header.map(h => RENAMED_HEADERS[h] || h);
  sheet.getRange(1, 1, 1, header.length).setValues([header]);

  for (let i = header.length - 1; i >= 0; i--) {
    if (REMOVED_HEADERS.indexOf(header[i]) !== -1) {
      sheet.deleteColumn(i + 1);
      header.splice(i, 1);
    }
  }
  APP_HEADERS.forEach((h, i) => {
    if (header.indexOf(h) !== -1) return;
    if (i < header.length) sheet.insertColumnBefore(i + 1);
    else sheet.insertColumnAfter(header.length);
    sheet.getRange(1, i + 1).setValue(h);
    header.splice(i, 0, h);
  });
  sheet.getRange(1, 1, 1, APP_HEADERS.length)
    .setFontWeight('bold').setBackground('#1F4E6B').setFontColor('#FFFFFF');
}

function applyAppsFormatting_(sheet) {
  const stages = getStages_();
  const maxRows = sheet.getMaxRows();
  const n = Math.max(maxRows - 1, 1);

  sheet.getRange(2, COL.rondas + 1, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireNumberBetween(0, 20).setAllowInvalid(false)
      .setHelpText('Número de rondas de entrevista (0 a 20).').build()
  );
  sheet.getRange(2, COL.etapa + 1, n, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(stages, true).setAllowInvalid(false).build()
  );
  [COL.fechaAplicacion, COL.fechaMovimiento, COL.alertaEnviada].forEach(c => {
    sheet.getRange(2, c + 1, n, 1).setNumberFormat('yyyy-mm-dd');
  });
  // Al insertar la columna de rondas en un Sheet viejo, Google le copia el formato de
  // fecha de la columna vecina y "3" se ve como una fecha. Forzamos número entero.
  sheet.getRange(2, COL.rondas + 1, n, 1).setNumberFormat('0');

  // Filas estancadas en naranja. Se calcula en vivo con TODAY(), no depende del trigger.
  const closed = stageRoles_(stages).closed;
  const e = colLetter_(COL.etapa);
  const m = colLetter_(COL.fechaMovimiento);
  const notClosed = closed.map(s => `$${e}2<>"${s.replace(/"/g, '""')}"`).join(',');
  const formula = `=AND($A2<>"",$${m}2<>"",TODAY()-INT($${m}2)>=INDIRECT("${SHEETS.config}!B${CONFIG_ROW.staleDays}"),${notClosed})`;
  const range = sheet.getRange(2, 1, n, APP_HEADERS.length);
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(formula)
    .setBackground('#FDE7CF')
    .setRanges([range])
    .build();
  // Reemplaza solo nuestra regla (la identificamos por el fondo) y conserva las del usuario.
  const others = sheet.getConditionalFormatRules().filter(r => {
    const cond = r.getBooleanCondition();
    return !(cond && String(cond.getBackground() || '').toUpperCase() === '#FDE7CF');
  });
  sheet.setConditionalFormatRules(others.concat([rule]));
}

function installDailyTrigger_() {
  const exists = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === DAILY_HANDLER);
  if (!exists) {
    ScriptApp.newTrigger(DAILY_HANDLER).timeBased().everyDays(1).atHour(8).create();
  }
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function removeDefaultBlankSheet_(ss) {
  const ours = Object.values(SHEETS);
  ss.getSheets().forEach(sh => {
    if (ours.indexOf(sh.getName()) === -1 && sh.getLastRow() === 0 && ss.getSheets().length > ours.length) {
      if (/^(Hoja|Sheet|Página|Feuille)\s?\d+$/i.test(sh.getName())) ss.deleteSheet(sh);
    }
  });
}

function colLetter_(index0) {
  let n = index0 + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// ---------------------------------------------------------------------
// LECTURA
// ---------------------------------------------------------------------

function getConfig_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.config);
  const read = row => (sheet ? sheet.getRange(row, 2).getValue() : '');
  const days = parseInt(read(CONFIG_ROW.staleDays), 10);
  return {
    staleDays: isNaN(days) || days < 1 ? 7 : days,
    email: String(read(CONFIG_ROW.email) || '').trim(),
    language: String(read(CONFIG_ROW.language) || 'es').trim(),
    stages: getStages_(),
  };
}

function getStages_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.config);
  const raw = sheet ? String(sheet.getRange(CONFIG_ROW.stages, 2).getValue() || '') : '';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  return list.length >= 5 ? list : DEFAULT_STAGES.slice();
}

function readApps_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.apps);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, APP_HEADERS.length).getValues();
  const apps = [];
  values.forEach((r, i) => {
    if (!r[COL.id]) return;
    apps.push(rowToApp_(r, i + 2));
  });
  return apps;
}

function rowToApp_(r, rowNumber) {
  return {
    row: rowNumber,
    id: String(r[COL.id]),
    empresa: String(r[COL.empresa] || ''),
    cargo: String(r[COL.cargo] || ''),
    link: String(r[COL.link] || ''),
    fuente: String(r[COL.fuente] || ''),
    fechaAplicacion: toIso_(r[COL.fechaAplicacion]),
    etapa: String(r[COL.etapa] || ''),
    rondas: readRounds_(r[COL.rondas]),
    fechaMovimiento: toIso_(r[COL.fechaMovimiento]),
    cv: String(r[COL.cv] || ''),
    salario: String(r[COL.salario] || ''),
    contacto: String(r[COL.contacto] || ''),
    proximoPaso: String(r[COL.proximoPaso] || ''),
    notas: String(r[COL.notas] || ''),
    alertaEnviada: toIso_(r[COL.alertaEnviada]),
  };
}

function readHistory_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.history);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, HISTORY_HEADERS.length).getValues()
    .filter(r => r[1])
    .map(r => ({ ts: toIso_(r[0]), id: String(r[1]), prev: String(r[2] || ''), next: String(r[3] || ''), nota: String(r[4] || '') }));
}

/**
 * Número de rondas guardado en la celda. Si la celda quedó con formato de fecha,
 * Sheets devuelve un Date (3 → 2-ene-1900): lo convertimos de vuelta a número.
 */
function readRounds_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    const serial = Math.round((value.getTime() - new Date(1899, 11, 30).getTime()) / (24 * 60 * 60 * 1000));
    return serial > 0 && serial < 100 ? serial : 0;
  }
  const n = parseInt(value, 10);
  return isNaN(n) || n < 0 ? 0 : n;
}

// google.script.run no puede transportar objetos Date: todo viaja como texto ISO.
function toIso_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return isNaN(value.getTime()) ? '' : value.toISOString();
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toISOString();
}

// ---------------------------------------------------------------------
// FUNCIONES QUE LLAMA EL TABLERO (google.script.run)
// ---------------------------------------------------------------------

/** Todo lo que el tablero necesita en una sola llamada. */
function getBoardData() {
  ensureSheets_();
  const config = getConfig_();
  const apps = readApps_();
  const history = readHistory_();
  return {
    apps: apps,
    history: history,
    config: { staleDays: config.staleDays, stages: config.stages, hasEmail: !!config.email, language: config.language },
    metrics: computeMetrics_(apps, history, config.stages, config.staleDays, new Date().toISOString()),
  };
}

function getApplications() {
  return readApps_();
}

function getMetrics() {
  const config = getConfig_();
  return computeMetrics_(readApps_(), readHistory_(), config.stages, config.staleDays, new Date().toISOString());
}

/**
 * Crea una postulación. Si parece duplicada (mismo link, o misma empresa + cargo)
 * devuelve { duplicate: app } sin crear nada, salvo que form.force === true.
 */
function createApplication(form) {
  form = form || {};
  const empresa = String(form.empresa || '').trim();
  const cargo = String(form.cargo || '').trim();
  if (!empresa || !cargo) throw new Error('Empresa y Cargo son obligatorios.');

  return withLock_(() => {
    const apps = readApps_();
    if (!form.force) {
      const dup = findDuplicate_(apps, form);
      if (dup) return { duplicate: dup };
    }

    const stages = getStages_();
    const etapa = stages.indexOf(form.etapa) !== -1 ? form.etapa : stageRoles_(stages).applied;
    const now = new Date();
    const fechaAplicacion = form.fechaAplicacion ? new Date(form.fechaAplicacion + 'T12:00:00') : now;
    const id = nextId_(apps);

    const row = new Array(APP_HEADERS.length).fill('');
    row[COL.id] = id;
    row[COL.empresa] = empresa;
    row[COL.cargo] = cargo;
    row[COL.link] = String(form.link || '').trim();
    row[COL.fuente] = String(form.fuente || '').trim();
    row[COL.fechaAplicacion] = fechaAplicacion;
    row[COL.etapa] = etapa;
    row[COL.rondas] = 0;
    row[COL.fechaMovimiento] = now;
    row[COL.cv] = String(form.cv || '').trim();
    row[COL.salario] = String(form.salario || '').trim();
    row[COL.contacto] = String(form.contacto || '').trim();
    row[COL.proximoPaso] = String(form.proximoPaso || '').trim();
    row[COL.notas] = String(form.notas || '').trim();

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.apps);
    sheet.appendRow(row);
    appendHistory_(id, '', etapa, 'Postulación creada', now);
    return { app: rowToApp_(row, sheet.getLastRow()) };
  });
}

/** Cambia la etapa, registra el evento en Historial y reinicia la alerta. */
function updateStage(id, newStage, note) {
  const stages = getStages_();
  if (stages.indexOf(newStage) === -1) throw new Error('Etapa no válida: ' + newStage);

  return withLock_(() => {
    const found = findRow_(id);
    const prev = String(found.values[COL.etapa] || '');
    if (prev === newStage) return { app: rowToApp_(found.values, found.row) };

    const now = new Date();
    const sheet = found.sheet;
    sheet.getRange(found.row, COL.etapa + 1).setValue(newStage);
    sheet.getRange(found.row, COL.fechaMovimiento + 1).setValue(now);
    sheet.getRange(found.row, COL.alertaEnviada + 1).setValue('');
    appendHistory_(id, prev, newStage, String(note || ''), now);

    const values = sheet.getRange(found.row, 1, 1, APP_HEADERS.length).getValues()[0];
    return { app: rowToApp_(values, found.row) };
  });
}

function updateNotes(id, notes) {
  return updateFields(id, { notas: notes });
}

/** Edita campos de texto (no la etapa: para eso está updateStage). */
function updateFields(id, fields) {
  const editable = ['empresa', 'cargo', 'link', 'fuente', 'cv', 'salario', 'contacto', 'proximoPaso', 'notas'];
  return withLock_(() => {
    const found = findRow_(id);
    Object.keys(fields || {}).forEach(key => {
      if (editable.indexOf(key) === -1) return;
      const value = String(fields[key] == null ? '' : fields[key]).trim();
      found.sheet.getRange(found.row, COL[key] + 1).setValue(value);
    });
    const values = found.sheet.getRange(found.row, 1, 1, APP_HEADERS.length).getValues()[0];
    return { app: rowToApp_(values, found.row) };
  });
}

/** Nota con fecha (ej. apuntes de una entrevista). Queda en la línea de tiempo sin cambiar la etapa. */
function addNote(id, text) {
  text = String(text || '').trim();
  if (!text) throw new Error('La nota está vacía.');
  return withLock_(() => {
    const found = findRow_(id);
    const etapa = String(found.values[COL.etapa] || '');
    const event = appendHistory_(id, etapa, etapa, text, new Date());
    return { event: event };
  });
}

/**
 * Registra una ronda más de entrevista (1ª con RR. HH., 2ª técnica, final…).
 * No cambia la etapa: la etapa "Entrevista" sigue siendo una sola, así el embudo
 * compara procesos entre sí aunque cada empresa tenga un número distinto de rondas.
 * Cuenta como movimiento: actualiza la fecha y reinicia la alerta.
 */
function addInterviewRound(id, note) {
  return withLock_(() => {
    const found = findRow_(id);
    const round = readRounds_(found.values[COL.rondas]) + 1;
    const etapa = String(found.values[COL.etapa] || '');
    const now = new Date();
    found.sheet.getRange(found.row, COL.rondas + 1).setValue(round);
    found.sheet.getRange(found.row, COL.fechaMovimiento + 1).setValue(now);
    found.sheet.getRange(found.row, COL.alertaEnviada + 1).setValue('');
    const text = 'Ronda ' + round + ' de entrevista' + (note && String(note).trim() ? ': ' + String(note).trim() : '');
    const event = appendHistory_(id, etapa, etapa, text, now);
    return { round: round, event: event };
  });
}

// ---------------------------------------------------------------------
// ESCRITURA: helpers
// ---------------------------------------------------------------------

function withLock_(fn) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function findRow_(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.apps);
  const last = sheet.getLastRow();
  if (last >= 2) {
    const values = sheet.getRange(2, 1, last - 1, APP_HEADERS.length).getValues();
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][COL.id]) === String(id)) return { sheet: sheet, row: i + 2, values: values[i] };
    }
  }
  throw new Error('No encontré la postulación ' + id + '. ¿La borraste del Sheet?');
}

function appendHistory_(id, prev, next, note, when) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.history);
  sheet.appendRow([when, id, prev, next, note]);
  return { ts: toIso_(when), id: id, prev: prev, next: next, nota: note };
}

function nextId_(apps) {
  let max = 0;
  apps.forEach(a => {
    const m = String(a.id).match(/^JT-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return ID_PREFIX + String(max + 1).padStart(4, '0');
}

// ---------------------------------------------------------------------
// DEDUPLICACIÓN: por link normalizado o por empresa + cargo normalizados
// ---------------------------------------------------------------------

function findDuplicate_(apps, form) {
  const link = normalizeLink_(form.link);
  const key = normalizeText_(form.empresa) + '|' + normalizeText_(form.cargo);
  for (let i = 0; i < apps.length; i++) {
    const a = apps[i];
    if (link && normalizeLink_(a.link) === link) return a;
    if (normalizeText_(a.empresa) + '|' + normalizeText_(a.cargo) === key) return a;
  }
  return null;
}

function normalizeLink_(url) {
  let s = String(url || '').trim().toLowerCase();
  if (!s) return '';
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '').split('#')[0];
  const parts = s.split('?');
  let base = parts[0].replace(/\/+$/, '');
  // Conserva parámetros que identifican la vacante (ej. ?jk=, ?gh_jid=, ?currentJobId=) y descarta los de rastreo.
  const keep = (parts[1] || '').split('&').filter(p => p && !/^(utm_|ref|refid|trk|tracking|source|src|from|origin)/.test(p)).sort();
  return keep.length ? base + '?' + keep.join('&') : base;
}

function normalizeText_(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------
// EDICIONES A MANO EN EL SHEET
// ---------------------------------------------------------------------

/**
 * Trigger simple: si alguien cambia la Etapa directamente en el Sheet, también
 * queda en Historial. Si agrega una fila nueva a mano, le asigna ID.
 * (Los cambios que hace el propio script no disparan onEdit.)
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEETS.apps) return;

  const firstRow = Math.max(e.range.getRow(), 2);
  const lastRow = e.range.getLastRow();
  if (lastRow < 2) return;

  const etapaCol = COL.etapa + 1;
  const touchesStage = e.range.getColumn() <= etapaCol && etapaCol <= e.range.getLastColumn();
  const singleCell = e.range.getNumRows() === 1 && e.range.getNumColumns() === 1;
  const rows = sheet.getRange(firstRow, 1, lastRow - firstRow + 1, APP_HEADERS.length).getValues();
  const now = new Date();
  let apps = null;

  rows.forEach((r, i) => {
    const rowNumber = firstRow + i;
    const hasContent = r[COL.empresa] || r[COL.cargo];

    if (!r[COL.id] && hasContent) {
      apps = apps || readApps_();
      const id = nextId_(apps);
      apps.push({ id: id });
      const etapa = r[COL.etapa] || stageRoles_(getStages_()).applied;
      sheet.getRange(rowNumber, COL.id + 1).setValue(id);
      if (!r[COL.etapa]) sheet.getRange(rowNumber, COL.etapa + 1).setValue(etapa);
      if (!r[COL.fechaAplicacion]) sheet.getRange(rowNumber, COL.fechaAplicacion + 1).setValue(now);
      sheet.getRange(rowNumber, COL.fechaMovimiento + 1).setValue(now);
      appendHistory_(id, '', etapa, 'Agregada a mano en el Sheet', now);
      return;
    }

    if (touchesStage && r[COL.id] && r[COL.etapa]) {
      const prev = singleCell ? String(e.oldValue || '') : '';
      const next = String(r[COL.etapa]);
      if (singleCell && prev === next) return;
      sheet.getRange(rowNumber, COL.fechaMovimiento + 1).setValue(now);
      sheet.getRange(rowNumber, COL.alertaEnviada + 1).setValue('');
      appendHistory_(String(r[COL.id]), prev, next, singleCell ? 'Cambio hecho en el Sheet' : 'Cambio en bloque hecho en el Sheet (etapa anterior desconocida)', now);
    }
  });
}

// ---------------------------------------------------------------------
// ALERTA DIARIA
// ---------------------------------------------------------------------

/**
 * Corre una vez al día. Regla: "≥ N días sin movimiento Y todavía no se avisó".
 * Así, si el trigger falla un día, la alerta sale al día siguiente en vez de perderse.
 * El resaltado naranja del Sheet es un formato condicional y no depende de esto.
 */
function dailyCheck() {
  const config = getConfig_();
  const stale = computeMetrics_(readApps_(), [], config.stages, config.staleDays, new Date().toISOString()).staleApps;
  const pending = stale.filter(a => !a.alertaEnviada);

  let sent = false;
  if (config.email && pending.length) {
    const lines = pending.map(a => `- ${a.empresa} | ${a.cargo} | ${a.etapa} | ${a.daysSinceMove} días sin movimiento (${a.id})`);
    MailApp.sendEmail(
      config.email,
      `Job Tracker: ${pending.length} postulación(es) sin movimiento`,
      `Estas postulaciones llevan ${config.staleDays} días o más sin moverse. ¿Toca hacer seguimiento?\n\n` +
        lines.join('\n') +
        `\n\nAbre tu Sheet: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}\n\n` +
        'Solo recibirás un aviso por postulación hasta que cambie de etapa.'
    );
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.apps);
    const today = new Date();
    pending.forEach(a => sheet.getRange(a.row, COL.alertaEnviada + 1).setValue(today));
    sent = true;
  }

  // Si lo corrió una persona desde el menú, le mostramos el resultado.
  try {
    const msg = stale.length === 0
      ? 'No hay postulaciones estancadas.'
      : `${stale.length} postulación(es) con ${config.staleDays}+ días sin movimiento (pintadas de naranja).` +
        (sent ? ` Se envió correo por ${pending.length}.` : config.email ? ' Ya se había avisado por correo.' : ' No hay correo configurado en Config.');
    SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Job Tracker', 8);
  } catch (err) {
    // Sin interfaz (trigger automático): no pasa nada.
  }
}
