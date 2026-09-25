# Lessons learned

## 1. Model the event log from day one

The biggest mistake in v1 was storing only the **current** status of each application plus a `Last Update` date. It looked sufficient because the daily view ("where is everything right now?") worked fine.

It broke as soon as I asked analytical questions:

- *How long do applications sit in Screening before moving?* Unknowable: once an application moved to Interview, the time it spent in Screening was overwritten.
- *At which stage do most processes die?* Only approximable: a `Rejected` row does not say whether it was rejected after applying or after the third interview.
- *Is my response rate improving month over month?* Not reliably, since past states were gone.

The v1 dashboard tried to compensate with "days in the current stage, averaged by stage", which is a different metric with a misleading name.

**The fix** is cheap: an append-only table of `(timestamp, id, from, to, note)`. Current state stays as a row for readability; every metric that involves time is computed from events. This is the standard "snapshot vs. event" trade-off in analytics, and it is much easier to design in than to retrofit, because history you did not record cannot be recovered.

## 2. Define metrics before building charts

The v1 "response rate" counted everything not in `Applied` as a reply, including `Saved` and `Withdrawn`. It was easy to miss because the number looked plausible. Writing the definitions down ([metrics.md](metrics.md)) and adding a unit test with a hand-computed case exposed it immediately.

## 3. Make side effects idempotent or verifiable

Apps Script's 302 redirect means a "failed" request may have succeeded. Retrying blindly creates duplicate rows. Two patterns fixed it: read-after-write verification, and letting the server own ID generation. The alert logic had the same shape of bug (fire on day 5 exactly), fixed by storing "already alerted" state instead of relying on timing.

## 4. Deduplicate on a stable key

Company + position text is not an identifier: "Data Analyst" and "Data Analyst II (Remote)" at the same company would be treated as different, while two genuinely different roles with the same title would collide. The job URL (normalized: no protocol, `www`, tracking params or trailing slash) is a much better key. The template checks both and asks the user when in doubt instead of silently merging.

## 5. For non-technical users, remove steps rather than document them

The first template draft required deploying a web app. Every extra step is a place where someone gives up. Running the board as a dialog inside the Sheet removed deployment, URLs and secrets from the setup entirely.

## 6. Guardrails belong in the prompt *and* in the process

Truthfulness rules in the system prompt are necessary but not sufficient. A procedural control is more reliable: the model verifies the adapted CV against the source documents before delivering it, and the generic prompt in this repo goes one step further by asking for a table of every change and its source, so a human reviews a diff instead of re-reading a whole CV.
