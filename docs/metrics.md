# Metric definitions

Every number on the dashboards comes from one of the definitions below. Both implementations follow them:

- Sheets template: [`sheets-template/Metrics.gs`](../sheets-template/Metrics.gs)
- Next.js demo: [`dashboard-nextjs/lib/metrics.js`](../dashboard-nextjs/lib/metrics.js) (unit tests in `metrics.test.mjs`)

## Stage roles

Stages are a configurable ordered list. Metrics rely on **position**, not on names, so a user can rename or add stages:

| Position | Role | Template default | Demo default |
|---|---|---|---|
| 1st | saved (not sent yet) | Guardada | Saved |
| 2nd | applied | Aplicada | Applied |
| middle | in process | En proceso, Entrevista, Oferta | Screening, Interview, Offer |
| 3rd to last | accepted | Aceptada | Hired |
| 2nd to last | rejected | Rechazada | Rejected |
| last | withdrawn | Retirada | Withdrawn |

## Data model

- **Applications** hold the *current* state (one row each).
- **History** is an append-only event log: `timestamp, id, previous stage, new stage, note`. A row with `previous = new` is a note (e.g. interview notes), not a stage change.
- "Stages reached" by an application = its current stage plus every stage that appears in its history.

## Definitions

### Sent applications (denominator)
All applications **except** those still in *saved*, and those in *withdrawn* that never reached a response stage (you withdrew before hearing back).

### Response rate
`responded / sent`, where *responded* = sent applications that reached any stage after *applied*, **including rejection** (a rejection is a reply), **excluding withdrawn**.

> v1 counted every status other than `Applied` as a response, so `Saved` and `Withdrawn` inflated the rate. With 1 saved, 1 withdrawn and 1 applied-with-no-reply, v1 reported 67% where the correct value is 0%. There is a unit test for exactly this case.

### Funnel
For each stage on the happy path (*applied → … → accepted*), the number of sent applications whose **furthest stage reached** is at or beyond it. Rejected or withdrawn applications count up to the stage they reached before closing (read from history). Without history, a rejected application only counts as *applied*.

**Biggest drop-off**: the consecutive pair of funnel stages with the largest *relative* loss, `(count[i-1] - count[i]) / count[i-1]`.

### Average days per stage
From history only. For each application, stage changes are sorted by time; each completed stint (enter stage X → next stage change) contributes `days = t_next - t_enter`. Notes do not split a stint. Closed stages are excluded, and so is the stage an application is currently in (the stint is not finished). The panel shows the number of stints behind each average.

If there is no history, this metric is **not shown** rather than approximated.

### Applications per week
Sent applications grouped by the Monday (UTC) of their application date, last 12 weeks including the current one.

### Response rate by source
Same definition as the response rate, grouped by the `Source` field.

### Stalled
Applications not in a closed stage whose last movement is at least **N days** old (`N` is set in `Config`, default 7). In the Sheet this is a live conditional format (`TODAY()` based), so it does not depend on the daily trigger. The daily trigger only sends the optional email, **once per application** until its stage changes.

## Known limitations

- Small samples: with fewer than ~20 sent applications, rates move a lot with each reply. The panels show counts next to every percentage for that reason.
- History starts when the template is installed. Applications imported from elsewhere have no past events, so time-per-stage only covers what happens afterwards.
- Edits pasted in bulk into the Sheet are logged with an unknown previous stage.
