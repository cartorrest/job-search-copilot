/**
 * v1 ORIGINAL (referencia histórica). La plantilla nueva está en /sheets-template.
 *
 * JOB SEARCH TRACKER — Apps Script backend
 * ------------------------------------------------
 * Expone un Web App con dos entradas:
 *   - doGet  -> consultar vacantes existentes (action=query) o por Job ID (action=get)
 *   - doPost -> crear (action=create) o actualizar (action=update) una vacante
 * Además incluye el trigger diario que revisa vacantes sin actualizar
 * y manda alertas por correo a los 5 y 10 días.
 *
 * CONFIGURACIÓN REQUERIDA ANTES DE USAR (ver DEPLOY_INSTRUCTIONS.md):
 *   1. Reemplaza SHEET_ID con el ID de tu Google Sheet.
 *   2. Ve a Project Settings > Script Properties y crea:
 *        TRACKER_TOKEN  = un token secreto que tú inventes
 *        ALERT_EMAIL    = tu correo para recibir las alertas
 *   3. Despliega como Web App (Execute as: Me, Who has access: Anyone).
 *   4. Corre createDailyTrigger() UNA VEZ manualmente desde el editor.
 */

const SHEET_ID = 'PON_AQUI_EL_ID_DE_TU_GOOGLE_SHEET';
const SHEET_NAME = 'Tracker';

const COLUMNS = [
  'Job ID', 'Company', 'Position', 'Job URL', 'Source', 'Salary',
  'Recruiter', 'Recruiter Contact', 'Match %', 'Best CV', 'CV Adapted',
  'Status', 'Interview Stage', 'Application Date', 'Next Step',
  'Last Update', 'Notes'
];

const CLOSED_STATUSES = ['Hired', 'Rejected', 'Withdrawn'];

// ---------------------------------------------------------------------
// AUTENTICACIÓN
// ---------------------------------------------------------------------

function checkToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('TRACKER_TOKEN');
  return expected && token === expected;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------
// GET — consultar vacantes
// ---------------------------------------------------------------------

function doGet(e) {
  const params = e.parameter;

  if (!checkToken_(params.token)) {
    return jsonResponse_({ error: 'unauthorized' });
  }

  const sheet = getSheet_();
  const rows = getAllRows_(sheet);

  if (params.action === 'get' && params.jobId) {
    const row = rows.find(r => r['Job ID'] === params.jobId);
    return jsonResponse_({ found: !!row, record: row || null });
  }

  if (params.action === 'query') {
    const company = (params.company || '').toLowerCase().trim();
    const position = (params.position || '').toLowerCase().trim();

    const matches = rows.filter(r => {
      const rowCompany = (r['Company'] || '').toLowerCase();
      const rowPosition = (r['Position'] || '').toLowerCase();
      const companyMatch = company && rowCompany.includes(company);
      const positionMatch = !position || rowPosition.includes(position);
      return companyMatch && positionMatch;
    });

    return jsonResponse_({ found: matches.length > 0, matches: matches });
  }

  // action=list: usada por el dashboard Next.js para traer todo de una vez.
  if (params.action === 'list') {
    const fieldMap = {
      'Job ID': 'jobId',
      'Company': 'company',
      'Position': 'position',
      'Job URL': 'jobUrl',
      'Source': 'source',
      'Salary': 'salary',
      'Recruiter': 'recruiter',
      'Recruiter Contact': 'recruiterContact',
      'Match %': 'matchPercent',
      'Best CV': 'bestCV',
      'CV Adapted': 'cvAdapted',
      'Status': 'status',
      'Interview Stage': 'interviewStage',
      'Application Date': 'applicationDate',
      'Next Step': 'nextStep',
      'Last Update': 'lastUpdate',
      'Notes': 'notes'
    };
  
    const jobs = rows
      .filter(r => r['Job ID'] !== '') // ignora filas vacias al final del Sheet
      .map(r => {
        const job = {};
        Object.keys(fieldMap).forEach(col => {
          let value = r[col];
          // Si la celda quedo guardada como fecha real (no texto), la
          // convertimos a 'yyyy-MM-dd' con tu mismo helper formatDate_
          // que ya usas en el resto del script, para que el JSON sea
          // siempre texto plano y consistente.
          if (value instanceof Date) {
            value = formatDate_(value);
          }
          job[fieldMap[col]] = value;
        });
        return job;
      });
  
    return jsonResponse_({ jobs: jobs });
  }

  return jsonResponse_({ error: 'invalid_action' });
}

// ---------------------------------------------------------------------
// POST — crear o actualizar
// ---------------------------------------------------------------------

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse_({ error: 'invalid_json' });
  }

  if (!checkToken_(body.token)) {
    return jsonResponse_({ error: 'unauthorized' });
  }

  const sheet = getSheet_();
  const today = formatDate_(new Date());

  if (body.action === 'create') {
    if (!body.company || !body.position) {
      return jsonResponse_({ error: 'missing_company_or_position' });
    }

    const jobId = generateJobId_(sheet);
    const newRow = COLUMNS.map(col => {
      switch (col) {
        case 'Job ID': return jobId;
        case 'Company': return body.company || '';
        case 'Position': return body.position || '';
        case 'Job URL': return body.jobUrl || '';
        case 'Source': return body.source || '';
        case 'Salary': return body.salary || '';
        case 'Recruiter': return body.recruiter || '';
        case 'Recruiter Contact': return body.recruiterContact || '';
        case 'Match %': return body.matchPercent || '';
        case 'Best CV': return body.bestCv || '';
        case 'CV Adapted': return body.cvAdapted || '';
        case 'Status': return body.status || 'Applied';
        case 'Interview Stage': return body.interviewStage || '';
        case 'Application Date': return body.applicationDate || today;
        case 'Next Step': return body.nextStep || '';
        case 'Last Update': return today;
        case 'Notes': return body.notes || '';
        default: return '';
      }
    });

    sheet.appendRow(newRow);
    return jsonResponse_({ success: true, jobId: jobId, action: 'created' });
  }

  if (body.action === 'update') {
    if (!body.jobId) {
      return jsonResponse_({ error: 'missing_jobId' });
    }

    const data = sheet.getDataRange().getValues();
    const header = data[0];
    const jobIdCol = header.indexOf('Job ID');
    const lastUpdateCol = header.indexOf('Last Update');

    for (let i = 1; i < data.length; i++) {
      if (data[i][jobIdCol] === body.jobId) {
        const rowIndex = i + 1; // 1-indexed en Sheets

        Object.keys(body.fields || {}).forEach(fieldName => {
          const colIndex = header.indexOf(fieldName);
          if (colIndex !== -1) {
            sheet.getRange(rowIndex, colIndex + 1).setValue(body.fields[fieldName]);
          }
        });

        // Last Update siempre se actualiza al día de hoy, sin excepción
        sheet.getRange(rowIndex, lastUpdateCol + 1).setValue(today);

        return jsonResponse_({ success: true, jobId: body.jobId, action: 'updated' });
      }
    }

    return jsonResponse_({ error: 'jobId_not_found' });
  }

  return jsonResponse_({ error: 'invalid_action' });
}

// ---------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------

function getSheet_() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

function getAllRows_(sheet) {
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    header.forEach((col, idx) => { row[col] = data[i][idx]; });
    rows.push(row);
  }
  return rows;
}

function generateJobId_(sheet) {
  const data = sheet.getDataRange().getValues();
  let maxNum = 0;
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][0] || '');
    const match = id.match(/^JOB-(\d+)$/);
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
  }
  const nextNum = maxNum + 1;
  return 'JOB-' + String(nextNum).padStart(4, '0');
}

function formatDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function daysBetween_(dateStr, today) {
  const past = new Date(dateStr);
  const diffMs = today.getTime() - past.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------
// ALERTAS DIARIAS — vacantes sin actualizar hace 5 o 10 días
// ---------------------------------------------------------------------

function checkStaleApplications() {
  const sheet = getSheet_();
  const rows = getAllRows_(sheet);
  const today = new Date();
  const alertEmail = PropertiesService.getScriptProperties().getProperty('ALERT_EMAIL');

  if (!alertEmail) return;

  const stale5 = [];
  const stale10 = [];

  rows.forEach(row => {
    const status = row['Status'];
    const lastUpdate = row['Last Update'];
    if (!lastUpdate || CLOSED_STATUSES.includes(status)) return;

    const days = daysBetween_(lastUpdate, today);

    if (days === 5) stale5.push(row);
    if (days === 10) stale10.push(row);
  });

  if (stale5.length === 0 && stale10.length === 0) return;

  let body = '';
  if (stale5.length > 0) {
    body += 'PRIMERA ALERTA (5 días sin actualización):\n';
    stale5.forEach(r => {
      body += `- ${r['Company']} | ${r['Position']} | Status: ${r['Status']} | Job ID: ${r['Job ID']}\n`;
    });
    body += '\n';
  }
  if (stale10.length > 0) {
    body += 'SEGUNDA ALERTA (10 días sin actualización):\n';
    stale10.forEach(r => {
      body += `- ${r['Company']} | ${r['Position']} | Status: ${r['Status']} | Job ID: ${r['Job ID']}\n`;
    });
  }

  MailApp.sendEmail(alertEmail, 'Job Tracker: vacantes sin actualización', body);
}

/**
 * Corre esta función UNA SOLA VEZ manualmente desde el editor de Apps Script
 * para instalar el trigger diario. No se vuelve a necesitar después.
 */
function createDailyTrigger() {
  ScriptApp.newTrigger('checkStaleApplications')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
}
