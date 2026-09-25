# Key decisions

Short ADRs: context, decision, consequence.

## 1. The Google Sheet is the single source of truth

**Context.** In v1 the assistant could "remember" applications from earlier chats. Memory drifts and is not queryable.
**Decision.** Status and existence of an application are only read from the Sheet. The assistant queries it before every write, even if the vacancy was discussed minutes earlier.
**Consequence.** No duplicates across chats, and the user can fix anything by editing a cell. Costs one extra call per write.

## 2. The token stays on the server

**Context.** v1 exposed an Apps Script web app that anyone with the URL and token could call.
**Decision.** The Next.js dashboard calls Apps Script only from API routes. The browser gets an HMAC-signed session cookie, never the token. Session signing fails closed if `SESSION_SECRET` is missing.
**Consequence.** A leaked page or bundle does not leak write access to the Sheet. v2 goes further and removes the token entirely (see 5).

## 3. Verify before retrying (idempotency by reading)

**Context.** Apps Script web apps answer with a 302 redirect. The server-side write can succeed even when the client sees an error or a non-JSON body.
**Decision.** A failed or odd response is never treated as "not saved". The client re-queries; only if the record is truly missing does it retry. The script, not the client, assigns IDs.
**Consequence.** No duplicate rows from retries. The same rule is in the system prompt so the model follows it too.

## 4. Truthfulness over ATS optimization

**Context.** Most AI CV tools push keywords to raise an ATS score, which invites exaggeration.
**Decision.** Hard rules in every prompt: never invent experience, tools, dates or metrics; ask when unsure; list gaps instead of hiding them; verify the adapted CV against the source before delivering it.
**Consequence.** Lower keyword match on some applications, but CVs that hold up in interviews. This is the project's main differentiator and it is kept verbatim in the generic prompts.

## 5. The template runs inside the Sheet, with no token

**Context.** Asking non-technical users to deploy a web app and manage a secret is where most setups fail.
**Decision.** The board opens as a dialog from a custom menu. The web app is optional (for phones) and deployed as "execute as me, only me".
**Consequence.** Setup is: make a copy, click a menu, accept Google's permission screen. There is nothing to leak.

## 6. An event log instead of snapshots

**Context.** v1 stored only the current status and a `Last Update` date, so time-per-stage could not be computed (see [lessons-learned.md](lessons-learned.md)).
**Decision.** Append-only `Historial` sheet. Every stage change (board or manual edit, via `onEdit`) and every note adds a row.
**Consequence.** Funnel, drop-off and days-per-stage come from real transitions. Current state is still a plain row, so the Sheet stays readable.

## 7. Alerts are level-triggered, not edge-triggered

**Context.** v1 emailed only when an application was *exactly* 5 or 10 days old. A missed trigger run meant a missed alert.
**Decision.** Alert when "≥ N days without movement **and** not alerted yet". An `Alerta enviada` column stores the date and resets on every stage change. The orange highlight is a conditional format, independent of the trigger.
**Consequence.** Missed runs self-heal the next day, and nobody gets the same email twice.

## 8. AI is optional and provider-agnostic

**Context.** The v1 copilot needed a paid Claude subscription.
**Decision.** The template works with zero AI. A "Copy AI prompt" button builds a self-contained prompt (application data, timeline, rules, task by stage) for any chatbot.
**Consequence.** Accessible to anyone; no API keys, no cost, no vendor lock-in.
