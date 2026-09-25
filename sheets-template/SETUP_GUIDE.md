# Setup guide: Job Tracker for Google Sheets

5 minutes, no coding, no cost, no AI required. Everything stays in your own Google account. The template UI is in Spanish; see "Translate" below.

## 1. Make your copy

Open the copy link **[https://docs.google.com/spreadsheets/d/1aMhLnESFdDVQW_BF3mCvEKvnzSgsn_lmgHHoIvxBlzY/copy](https://docs.google.com/spreadsheets/d/1aMhLnESFdDVQW_BF3mCvEKvnzSgsn_lmgHHoIvxBlzY/copy)** and click **Make a copy**.

## 2. First-time setup

1. Wait for the **Job Tracker** menu to appear (reload if it does not).
2. **Job Tracker → Configurar por primera vez** (first-time setup).
3. Google asks for authorization. You will see **"Google hasn't verified this app"**. That is expected: the script lives inside *your* copy and runs as *you*; Google shows this for any script that has not gone through its commercial verification. It only asks to edit *this* spreadsheet, show the board dialog, schedule a daily check and (optionally) email *you*. It calls no external servers, and all the code is visible under **Extensions → Apps Script**.
4. Click **Advanced → Go to Job Tracker (unsafe) → Allow**, then run the menu item again.

This creates three sheets: **Postulaciones** (one row per application), **Historial** (the event log metrics are built from; do not delete it) and **Config** (stalled threshold, optional alert email, stage list).

## 3. Open the board

**Job Tracker → Abrir tablero.** Use **Cargar datos de ejemplo** to load 33 fictional applications, and **Borrar datos de ejemplo** to remove only those.

- Drag cards between columns, or use the **Mover a…** selector (works on phones).
- Click a card for its timeline, editable fields and dated notes.
- **Multiple interview rounds:** keep the application in the single *Entrevista* stage and click **+ Ronda de entrevista** for each round (HR screen, technical, final…). Cards show "Ronda 2", "Ronda 3", and each round is logged in the timeline. The funnel stays comparable across companies that run a different number of rounds.
- **Métricas** tab: response rate, funnel and biggest drop-off, average days per stage, applications per week, reply rate by source. Definitions: [docs/metrics.md](../docs/metrics.md).
- **Copiar prompt para IA** builds a prompt for any chatbot with the application's data, its timeline and strict "do not invent experience" rules.
- Manual edits in the Sheet are logged too (`onEdit`), and new rows typed by hand get an ID.

## Optional

- **Email alerts:** put your address in **Config**. A daily trigger emails you once per application that has been stalled for N+ days; the flag resets on every stage change.
- **As a web page (desktop and phone):** the board can also run as its own page, full screen in a browser tab on your computer and as a home-screen icon on your phone. Same data, same Sheet. Extensions → Apps Script → Deploy → New deployment → Web app, **Execute as: Me**, **Who has access: Only myself**, then bookmark the URL. Only you, signed in, can open it. Deployments are not copied with the Sheet, so each person deploys their own; after code changes, publish a new version under Manage deployments (the URL stays the same).
- **Stages:** edit the list in **Config** (keep the order: 1st = saved, 2nd = applied, last three = accepted, rejected, withdrawn), then rerun first-time setup.
- **Translate:** all UI strings live in the `LABELS` object in `Scripts.html`.

