# Ideas (not built yet)

Improvements that make sense but are **not implemented**, because they cannot be tested end to end yet. Contributions are welcome: open an issue or a pull request.

## v2 + Claude: the chat workflow on top of the new template

**Today** there are two separate paths:

- **v1** ([original-copilot/](../original-copilot/)): chat with Claude ("I applied to X at Y") and it writes to the Sheet through an Apps Script API. No event log, so no time-per-stage metrics.
- **v2** ([sheets-template/](../sheets-template/)): event log, interview rounds, funnel metrics and stall alerts, but you update it by hand (board or Sheet).

**The idea:** give the v2 template an optional API so an assistant can drive it with the same flow as v1, while every change still goes through the v2 functions and lands in `Historial`.

### Sketch

- A new `Api.gs` file in the template, off by default. It is enabled by setting an `API_TOKEN` script property.
- `doGet(e)` routes by parameter: with `action`, it answers JSON (after a constant-time token check); without it, it serves the board as today.
- The API is deployed as a **second** web app deployment with "Who has access: Anyone", while the board deployment stays "Only me". Each deployment has its own web app settings in the current Apps Script editor; confirm this still holds before relying on it, or fall back to a separate standalone script.
- Actions map to existing functions, so the history, dedup and rounds logic is shared, not duplicated:

| Action | Maps to | Notes |
|---|---|---|
| `GET query` (company, role or link) | `findDuplicate_` + `readApps_` | Always called before any write |
| `GET list` | `getBoardData` | Includes metrics |
| `POST create` | `createApplication` | Returns `duplicate` instead of creating |
| `POST stage` | `updateStage` | Logs to `Historial`, resets the alert |
| `POST round` | `addInterviewRound` | "I had the second interview" → round 2 |
| `POST note` / `POST update` | `addNote` / `updateFields` | |

- The v1 system prompt is adapted to the Spanish stages (Aplicada, En proceso, Entrevista…) and to the read-before-write and verify-after-write rules, which stay the same.

### Why it is not built

- It re-introduces a public URL protected by a shared token. That is acceptable for an optional power-user mode, but it needs a careful guide on rotating and revoking it.
- The last step (an assistant calling the API from a chat, with the 302 redirect behavior of Apps Script) can only be verified with a real account. Shipping it untested would contradict the rule this project is built on.

### How to verify it if you build it

1. Unit tests for the router and token check in `sheets-template/tests/` (same pattern as the existing tests: load the `.gs` files in Node with stubs).
2. `curl -sL` against a test deployment: create, duplicate detection, stage change, round, and confirm each one appears in `Historial`.
3. A full chat session with the assistant on a test Sheet before touching real data.

## Smaller ideas

- **English UI toggle** for the template: the `LABELS` object is already centralized; it needs a second dictionary and a `Config` switch.
- **Weekly summary email**: applications sent, replies and stalled items, using the metrics that already exist.
- **Import from CSV** for people coming from another tracker (history would start at import time).
