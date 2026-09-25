/**
 * MÉTRICAS — funciones puras (sin APIs de Google), para poder probarlas fuera de Apps Script.
 * Definiciones completas en docs/metrics.md. La misma lógica vive en
 * dashboard-nextjs/lib/metrics.js: si cambias una, cambia la otra.
 */

var DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Roles de cada etapa según su posición en la lista:
 *   1ª = guardada, 2ª = aplicada, 3 últimas = aceptada, rechazada, retirada.
 */
function stageRoles_(stages) {
  var n = stages.length;
  return {
    saved: stages[0],
    applied: stages[1],
    accepted: stages[n - 3],
    rejected: stages[n - 2],
    withdrawn: stages[n - 1],
    closed: stages.slice(n - 3),
    // Camino "feliz": aplicada → ... → aceptada. Es el eje del embudo.
    pipeline: stages.slice(1, n - 2),
    // Llegar a cualquiera de estas significa que la empresa respondió (incluye rechazo).
    response: stages.filter(function (s, i) { return i > 1 && i !== n - 1; }),
  };
}

function computeMetrics_(apps, history, stages, staleDays, nowIso) {
  var roles = stageRoles_(stages);
  var now = new Date(nowIso).getTime();
  var order = {};
  stages.forEach(function (s, i) { order[s] = i; });

  // Eventos por postulación, ordenados en el tiempo.
  var eventsById = {};
  history.forEach(function (h) {
    (eventsById[h.id] = eventsById[h.id] || []).push(h);
  });
  Object.keys(eventsById).forEach(function (id) {
    eventsById[id].sort(function (a, b) { return new Date(a.ts) - new Date(b.ts); });
  });

  function reachedStages(app) {
    var set = {};
    if (app.etapa) set[app.etapa] = true;
    (eventsById[app.id] || []).forEach(function (h) {
      if (h.prev) set[h.prev] = true;
      if (h.next) set[h.next] = true;
    });
    return set;
  }

  // ---- Tasa de respuesta, embudo y por fuente -------------------------
  var pipelineIndex = {};
  roles.pipeline.forEach(function (s, i) { pipelineIndex[s] = i; });
  var funnelCounts = roles.pipeline.map(function () { return 0; });
  var applied = 0;
  var responded = 0;
  var bySource = {};

  apps.forEach(function (app) {
    var reached = reachedStages(app);
    var gotResponse = roles.response.some(function (s) { return reached[s]; });
    // Denominador: postulaciones enviadas. Fuera: las que siguen guardadas y
    // las que retiraste antes de recibir cualquier respuesta.
    if (app.etapa === roles.saved) return;
    if (app.etapa === roles.withdrawn && !gotResponse) return;

    applied++;
    if (gotResponse) responded++;

    var maxIdx = 0;
    Object.keys(reached).forEach(function (s) {
      if (pipelineIndex[s] !== undefined) maxIdx = Math.max(maxIdx, pipelineIndex[s]);
    });
    for (var i = 0; i <= maxIdx; i++) funnelCounts[i]++;

    var src = app.fuente || '(sin fuente)';
    bySource[src] = bySource[src] || { source: src, applied: 0, responded: 0 };
    bySource[src].applied++;
    if (gotResponse) bySource[src].responded++;
  });

  var funnel = roles.pipeline.map(function (stage, i) {
    var count = funnelCounts[i];
    var prev = i === 0 ? null : funnelCounts[i - 1];
    return {
      stage: stage,
      count: count,
      pctOfApplied: applied ? count / applied : null,
      conversionFromPrev: prev ? count / prev : null,
    };
  });

  // Dónde se cae más gente: la mayor pérdida relativa entre dos etapas seguidas.
  var biggestDrop = null;
  for (var k = 1; k < funnel.length; k++) {
    var from = funnel[k - 1].count;
    if (!from) continue;
    var loss = (from - funnel[k].count) / from;
    if (!biggestDrop || loss > biggestDrop.loss) {
      biggestDrop = { from: funnel[k - 1].stage, to: funnel[k].stage, loss: loss, lost: from - funnel[k].count };
    }
  }

  var sources = Object.keys(bySource).map(function (k) {
    var s = bySource[k];
    s.rate = s.applied ? s.responded / s.applied : null;
    return s;
  }).sort(function (a, b) { return b.applied - a.applied; });

  // ---- Días promedio por etapa (desde Historial) ----------------------
  // Se mide cada tramo completo: entrar a una etapa y salir de ella.
  // Las notas (etapa anterior = etapa nueva) no cuentan como cambio.
  var durations = {};
  Object.keys(eventsById).forEach(function (id) {
    var changes = eventsById[id].filter(function (h) { return h.next && h.prev !== h.next; });
    for (var j = 0; j < changes.length - 1; j++) {
      var stage = changes[j].next;
      if (roles.closed.indexOf(stage) !== -1) continue;
      var days = (new Date(changes[j + 1].ts) - new Date(changes[j].ts)) / DAY_MS;
      if (days < 0) continue;
      (durations[stage] = durations[stage] || []).push(days);
    }
  });
  var avgDaysByStage = stages
    .filter(function (s) { return durations[s]; })
    .map(function (s) {
      var list = durations[s];
      var sum = list.reduce(function (a, b) { return a + b; }, 0);
      return { stage: s, avgDays: sum / list.length, samples: list.length };
    });

  // ---- Postulaciones por semana (últimas 12, lunes a domingo) ---------
  var weeks = [];
  var monday = startOfWeek_(now);
  for (var w = 11; w >= 0; w--) weeks.push({ weekStart: new Date(monday - w * 7 * DAY_MS).toISOString().slice(0, 10), count: 0 });
  apps.forEach(function (app) {
    if (!app.fechaAplicacion || app.etapa === roles.saved) return;
    var t = new Date(app.fechaAplicacion).getTime();
    if (isNaN(t)) return;
    var idx = 11 - Math.floor((monday - startOfWeek_(t)) / (7 * DAY_MS));
    if (idx >= 0 && idx < 12) weeks[idx].count++;
  });

  // ---- Estancadas -----------------------------------------------------
  var staleApps = [];
  var active = 0;
  apps.forEach(function (app) {
    if (roles.closed.indexOf(app.etapa) !== -1) return;
    active++;
    if (!app.fechaMovimiento) return;
    var d = Math.floor((now - new Date(app.fechaMovimiento).getTime()) / DAY_MS);
    if (d >= staleDays) {
      staleApps.push({ row: app.row, id: app.id, empresa: app.empresa, cargo: app.cargo, etapa: app.etapa, daysSinceMove: d, alertaEnviada: app.alertaEnviada });
    }
  });

  return {
    total: apps.length,
    active: active,
    applied: applied,
    responded: responded,
    responseRate: applied ? responded / applied : null,
    funnel: funnel,
    biggestDrop: biggestDrop,
    avgDaysByStage: avgDaysByStage,
    weekly: weeks,
    bySource: sources,
    staleApps: staleApps,
    staleDays: staleDays,
  };
}

// Lunes 00:00 UTC de la semana de t (ms). UTC para que el resultado no dependa de la zona horaria.
function startOfWeek_(t) {
  var d = new Date(t);
  var day = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - day * DAY_MS;
}
