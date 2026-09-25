# Architecture

## v1: personal copilot (used during a real job search)

```mermaid
flowchart LR
  U[User] -- "vacancy / short phrase" --> C[Claude Project<br/>instructions + truthfulness rules]
  C -- reads --> K[Project Knowledge<br/>CVs + private config]
  C -- "GET query, POST create/update<br/>+ shared token" --> A[Apps Script web app]
  A --> S[(Google Sheet<br/>current status only)]
  T[Daily trigger<br/>day 5 and day 10] --> A
  T -- email --> U
  B[Browser] -- "password → HMAC-signed cookie" --> D[Next.js on Vercel]
  D -- "API routes, token server-side" --> A
```

- The model never holds the tracker's state; it queries the Sheet before every write.
- The token lives in two places only: the private knowledge file and Vercel's environment variables. The browser never sees it: the dashboard's API routes act as a proxy, and `middleware.js` guards every route with a signed session cookie.

## v2: open template (this repo's main product)

```mermaid
flowchart LR
  subgraph Sheet["Google Sheet (a copy per user)"]
    P[(Postulaciones<br/>current state)]
    H[(Historial<br/>event log)]
    CFG[(Config<br/>stale days, email, stages)]
    GS[Apps Script<br/>Code.gs · Metrics.gs]
    UI[Board dialog<br/>Index.html]
  end
  U[User] -- "menu: Job Tracker → Abrir tablero" --> UI
  UI -- google.script.run --> GS
  GS -- "read / write + append event" --> P
  GS --> H
  U -- "edits a cell by hand" --> OE[onEdit trigger] --> H
  DT[Daily trigger] -- "≥ N days and not yet alerted" --> M[Optional email]
  UI -- "Copy AI prompt" --> AI[Any chatbot<br/>ChatGPT · Gemini · Claude]
```

- **No API, no token.** The board runs inside the Sheet as a dialog, under the owner's own Google account. The optional web app (for phones) is deployed as *execute as me* and *access: only me*.
- **Event log first.** Every stage change, from the board or from a manual edit, appends to `Historial`. Metrics are computed from events, not from snapshots.
- **AI is optional and provider-agnostic.** The board builds a prompt with the application's data and the truthfulness rules; the user pastes it into any chatbot. No API keys.

## Next.js demo (portfolio showcase)

```mermaid
flowchart LR
  V[Visitor] --> MW{middleware.js}
  MW -- "DEMO_MODE=true" --> P[Dashboard]
  P -- "localStorage" --> LS[(Fictional demo data<br/>jobs + history)]
  MW -- "DEMO_MODE off" --> L[Login] --> P2[Dashboard] -- "/api/jobs" --> R[API routes<br/>token server-side] --> A[Apps Script]
```

One environment variable switches between the public demo (no login, fictional data, API routes disabled) and the private mode the original dashboard used.
