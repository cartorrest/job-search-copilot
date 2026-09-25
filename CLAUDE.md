# CLAUDE.md

Project rules for AI coding agents (Claude Code and similar) working in this repo.

## What this is

- `sheets-template/`: main product. Google Sheet + Apps Script (kanban board, stage history, metrics). Works without AI. UI and code comments are in Spanish on purpose: its users are Spanish-speaking job seekers.
- `dashboard-nextjs/`: technical showcase. Next.js in demo mode (`DEMO_MODE=true`) with fictional data.
- `ai-prompts/` and `original-copilot/`: provider-agnostic prompts and documentation of the v1 Claude-connected copilot (historical reference).
- `docs/`: architecture, decisions, metric definitions, lessons learned, ideas.

## Non-negotiable rules

1. **No secrets in git.** Before every commit, search for tokens, `script.google.com/macros/s/...` URLs, `.env*` files, passwords and anything from `tracker-config*`. Review `git diff --staged`.
2. **No personal data.** No CVs, real companies applied to, recruiters, emails, phone numbers or the author's specific target roles. Redact emails from screenshots.
3. **Never invent metrics or results.** Demo and sample data are fictional and labeled as such.
4. **Nothing goes online without confirmation** (push, visibility changes, deploys).
5. **Explain manual steps in plain language** for non-technical users.
6. **Do not ship untested integrations.** Ideas that cannot be tested end to end go to `docs/ideas.md`, not into the product.

## Languages

- English: `README.md`, `docs/`, `dashboard-nextjs/` (code, comments, UI), `original-copilot/how-it-worked.md`, this file.
- Spanish: `README.es.md`, `sheets-template/` (UI, comments, `SETUP_GUIDE.es.md`), `ai-prompts/`, `original-copilot/README.md`.

## Useful commands

```bash
# Sheets template logic (runs the .gs files in Node, no Google needed)
node --test sheets-template/tests/metrics.test.cjs

# Dashboard
cd dashboard-nextjs && npm install && npm test && npm run build
DEMO_MODE=true npm run dev

# Push template code to the owner's Sheet (needs clasp login and a local, git-ignored .clasp.json)
cd sheets-template && clasp push
```

## Conventions

- Metrics: the source of truth is `docs/metrics.md`. If you change a formula in `sheets-template/Metrics.gs` or `dashboard-nextjs/lib/metrics.js`, update both and the doc.
- Template UI strings live in the `LABELS` object (`sheets-template/Scripts.html`).
- Existing users' Sheets must keep working: column changes go through `migrateAppsHeaders_` in `Code.gs`, with a test.
