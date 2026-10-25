# External Integrations

**Analysis Date:** 2026-10-24

## Overview

EDEP CONNECT currently has **no working external integrations**. It is a fully client-side React SPA: no HTTP calls, no backend service, no database, no authentication provider, and no third-party runtime SDK is imported. The only persistence is browser `localStorage`, seeded from in-repo mock data. The repository does declare a Google Gemini SDK (`@google/genai`), a `GEMINI_API_KEY` secret, and a `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` capability flag, but no AI code exists — the declaration is vestigial from the Google AI Studio template. An `express`/`dotenv` server stack is declared but there is no server file.

## External APIs & Services

| Service | Status | Evidence |
|---|---|---|
| Google Gemini API (`@google/genai`) | **Declared, not implemented** | Dependency at `package.json:14`; no `@google/genai` import anywhere in `src/`; `GEMINI_API_KEY` only in `.env.example:1-4`; capability claim in `metadata.json:5` |
| Any REST/GraphQL API | **None** | Zero `fetch`, `axios`, or `XMLHttpRequest` matches across `src/` |
| Payment gateways / mobile money APIs | **None** | Payment methods are enum values only (`src/types/index.ts:274`); no SDK or endpoint |
| Maps / geolocation | **None** | No map library; sites are free-text strings (e.g. `Trip.departureSite` in `src/types/index.ts:113`) |
| Email / SMS / notifications | **None** | Alerts are in-app derived state (`src/components/Header.tsx:46-53`) |
| Analytics / error tracking | **None** | No Sentry, GA, PostHog, or similar package |

## Environment Variables

Declared in `.env.example` (the only env template; real `.env*` files are gitignored at `.gitignore:7-8`):

| Variable | Declared purpose | Actually read by code? |
|---|---|---|
| `GEMINI_API_KEY` | Gemini API calls; AI Studio injects from Secrets panel (`.env.example:1-4`) | **No** — no `process.env` or `import.meta.env` reference in `src/` |
| `APP_URL` | Hosted applet URL for self-referential links/OAuth/API (`.env.example:6-9`) | **No** |
| `DISABLE_HMR` | Disables Vite HMR/file watching in AI Studio (`vite.config.ts:14-20`) | **Yes**, but only in the Node-side Vite config: `process.env.DISABLE_HMR` at `vite.config.ts:17,19` |

Notes:

- **No `VITE_`-prefixed variables exist**, and there are no `import.meta.env` references anywhere in `src/`. Therefore nothing is compiled into the client bundle from the environment.
- No `.env.local`, `.env`, or `.env.production` file is present; `README.md:18` instructs the developer to create `.env.local` for `GEMINI_API_KEY`, but doing so has no effect on current code.
- No runtime validation, typing (`vite-env.d.ts` absent), or fallback logic for any variable.
- `DISABLE_HMR` is not documented in `.env.example`; it is discoverable only by reading `vite.config.ts`.

## Data Persistence Strategy

**Strategy:** browser `localStorage` only. No database, API, file storage, cache service, cookie, IndexedDB, or service worker.

- Initial state is hydrated from constants in `src/data/mockData.ts` (14 `INITIAL_*` exports: users, contracts, vehicles, drivers, trips, cisterns, fuel movements, fuel inventories, watering runs, breakdowns, invoices, payments, credit notes, audit logs).
- Each state slice is read once via a lazy `useState` initializer, then written back by a dedicated `useEffect`: `src/context/AppContext.tsx:140-268`.
- All values are serialized as raw JSON strings with `JSON.stringify`; there is no schema version, migration, or namespacing beyond the `edep_` prefix.

**localStorage keys** (all in `src/context/AppContext.tsx`):

| Key | State slice | Lines |
|---|---|---|
| `edep_user` | Current user / role | 140, 215 |
| `edep_offline_queue` | Pending offline writes | 147, 267 |
| `edep_contracts` | Contracts | 152, 219 |
| `edep_vehicles` | Fleet vehicles | 157, 223 |
| `edep_trips` | Weighbridge trips | 164, 227 |
| `edep_cisterns` | Fuel/water cisterns and stock | 169, 231 |
| `edep_fuel_movements` | Fuel in/out movements | 174, 235 |
| `edep_fuel_inventories` | Physical stock counts/variances | 179, 239 |
| `edep_watering` | Road-watering runs | 184, 243 |
| `edep_breakdowns` | Vehicle breakdowns | 189, 247 |
| `edep_invoices` | Invoices | 194, 251 |
| `edep_payments` | Payments | 199, 255 |
| `edep_credit_notes` | Credit notes | 204, 259 |
| `edep_audit_logs` | Audit trail | 209, 263 |

`users`, `drivers`, and `isOfflineMode` are never persisted (`src/context/AppContext.tsx:144,145,161`); role/user changes persist only through `edep_user`.

**Read/write failure handling:** none. `JSON.parse` runs without `try/catch` in every initializer; malformed or truncated storage will throw during render. `localStorage.setItem` calls are unguarded, so quota errors or blocked storage (private mode, Safari ITP) surface as uncaught exceptions.

**Data reset:** there is no UI or code path to clear or migrate `localStorage`; resetting requires manual browser storage clearing.

## Authentication & Identity Model

**Auth provider:** none. There is no login screen, password field, token, session, OAuth flow, or JWT handling.

- `currentUser` is a `User` object chosen from 9 hard-coded profiles in `src/data/mockData.ts:18` (`INITIAL_USERS`), defaulting to `INITIAL_USERS[0]` (the PDG) at `src/context/AppContext.tsx:139-142`.
- The header exposes a **"Simulateur de profil & droits"** dropdown that calls `setCurrentUser` on click — effectively unauthenticated role switching (`src/components/Header.tsx:143-191`).
- Persistence of identity is `localStorage['edep_user']`; any user can edit it to assume the PDG role.
- Authorization is UI/state-level only: `canAccess(feature)` role matrix in `src/context/AppContext.tsx:341-369`, plus segregation-of-duties helpers in `src/utils/rules.ts:167-234` (`canUserValidateTrip`, `canUserValidateFuelDiscrepancy`, `checkInvoiceAndPaymentSeparation`). These functions run in the same client the user controls, so they are not security controls.
- No per-user data isolation: every profile can read all in-memory contracts, invoices, and audit logs; the navigation filter in `src/App.tsx:59-67` only hides tabs.

**Implication:** the app is a demo/prototype identity model. Real deployment requires an external identity provider and server-side enforcement; neither is present.

## Backend / Server Presence

| Item | Finding |
|---|---|
| `express` dependency | Declared (`package.json:21`) but never imported |
| Server entry point | **None** — no `server.js`, `server.ts`, `src/server`, or `app.listen` |
| `dotenv` | Declared (`package.json:22`) but never imported |
| API routes | **None** |
| `clean` script | Deletes `dist` and `server.js` (`package.json:10`), a leftover reference to a file that does not exist |
| Build output | Static SPA assets from `vite build` (no SSR, no API) |
| Deployment config | None (no Dockerfile, no `vercel.json`/`netlify.toml`, no CI workflow) |

The README describes deployment via Google AI Studio (`README.md:5-9`) and `.env.example` mentions an AI Studio-injected Cloud Run URL, but the repository contains nothing that serves requests.

## Network Call Inventory

**Outbound calls: zero.** Verified by grep across `src/` for `fetch(`, `axios`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon` — no matches.

**Inbound endpoints: zero.**

The only browser-level I/O is:

| Operation | Mechanism | Location |
|---|---|---|
| Read/write app state | `localStorage` | `src/context/AppContext.tsx:140-268` |
| CSV export (local download) | `Blob` + `URL.createObjectURL` + anchor `download` | `src/components/ReportsView.tsx:25-36` |
| Invoice printing | `window.print()` | `src/components/InvoiceView.tsx:680` |
| UI timers | `setTimeout` for toast dismissal (4–5 s) | e.g. `src/components/ContractsView.tsx:68`, `src/components/TransportView.tsx:94` |

## Simulated "Offline" Integration

The app models field connectivity but does not implement networking:

- `isOfflineMode` is an in-memory boolean toggled by the header button (`src/context/AppContext.tsx:145,295-297`; `src/components/Header.tsx:103-114`).
- Writes while "offline" are queued in `offlineQueue` under `edep_offline_queue` (`src/context/AppContext.tsx:471-485,566-578,693-705`).
- `synchronizeOfflineQueue()` merges queued items directly into React state with idempotency checks on `clientTripId`, `clientMovementId`, and `clientRunId` (`src/context/AppContext.tsx:300-338`). No HTTP request is made; nothing leaves the browser.
- There is no connectivity detection (`navigator.onLine` is never read) and no automatic retry/backoff.

## File & Asset Integrations

- No file upload/ingest. Contract `documentRef` is a free-text string (`src/types/index.ts:56`); no storage provider.
- No external image/font/CDN references at runtime; `index.html` links no fonts or scripts beyond `/src/main.tsx`.
- Non-shipping artifacts are committed: four PNGs under `.aistudio/artifacts/brain/.../.tempmediaStorage/` and one file under `public/assets/aistudio/` (~68 KB). These are AI Studio scratch assets, not used by `src/`.

## Integration Risks & Gaps

1. **False AI capability claim.** `metadata.json:5` advertises `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`, `.env.example` documents a Gemini key, and `@google/genai` is installed — yet no AI call exists. Consumers/deploy tooling may assume an AI backend that is absent (`package.json:14`, `metadata.json:5`).
2. **Unused server stack is an attack/maintenance surface.** `express` and `dotenv` add dependency risk with no server to justify them (`package.json:21-22`).
3. **No real persistence durability.** All business records (contracts, invoices, payments, audit logs) live in one browser profile's `localStorage`; clearing site data, switching browsers/devices, or using private mode destroys them. There is no backup, export of full state, or sync.
4. **Unvalidated storage parsing.** Every `JSON.parse(localStorage.getItem(...))` is unguarded (`src/context/AppContext.tsx:140-211`); a partial write or manual edit yields a white-screen crash with no recovery path.
5. **Quota limits.** A single-origin ~5 MB budget must hold 14 JSON collections including a growing audit log and offline queue; `setItem` failures are not caught (`src/context/AppContext.tsx:214-268`). Long-lived use will eventually throw `QuotaExceededError`.
6. **Identity spoofing by design.** `edep_user` plus a public role switcher means any user can become PDG; all permission checks are client-side (`src/components/Header.tsx:173-182`, `src/context/AppContext.tsx:341-369`).
7. **Personal data exposure.** 9 employee/client records with names, emails, and phone numbers are bundled into the JS payload via `src/data/mockData.ts:18+` and stored plaintext in `localStorage`.
8. **No audit integrity.** Audit entries are client-generated and mutable via devtools/localStorage; there is no append-only store or server timestamp (`src/context/AppContext.tsx:271-293`).
9. **No env validation or typing.** A missing/invalid `GEMINI_API_KEY` or `APP_URL` cannot be detected because nothing reads them; `.env` files are gitignored but no schema documents required values beyond comments.
10. **No CORS/auth/rate-limit concerns today** only because no backend exists; introducing one (or Gemini calls) will require server-side proxying to avoid exposing `GEMINI_API_KEY` in the browser.
11. **Deployment assumptions are undocumented in-repo.** Hosting depends on AI Studio/Cloud Run comments in `.env.example:6-8`; there is no build/deploy configuration in the repository.

## Sources

- `package.json`
- `.env.example`
- `.gitignore`
- `README.md`
- `metadata.json`
- `vite.config.ts`
- `index.html`
- `src/context/AppContext.tsx`
- `src/data/mockData.ts`
- `src/types/index.ts`
- `src/utils/rules.ts`
- `src/components/Header.tsx`
- `src/components/ReportsView.tsx`
- `src/components/InvoiceView.tsx`
- `src/components/TransportView.tsx`
- `src/components/ContractsView.tsx`
- `src/App.tsx`

---

*Integration audit: 2026-10-24*
