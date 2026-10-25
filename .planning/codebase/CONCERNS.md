# Codebase Concerns

**Analysis Date:** 2026-10-24

## Overview

EDEP CONNECT is a 100% client-side React SPA (6,563 lines across 18 source files) with no backend, no authentication, and no test runner wired up. All business state — contracts, trips, fuel stock, invoices, audit logs — lives in `localStorage`, and every authorization decision is made in the browser. The domain model and rule helpers (`src/utils/rules.ts`) are thoughtfully designed, but the enforcement layer is advisory: anyone with devtools can switch to `pdg`, edit the audit log, or rewrite invoice totals. The highest-value remediation is a persistence/auth backend plus server-side rule enforcement; the quickest wins are invoice numbering, offline fuel-stock sync, the client-portal data leak, and removing unused dependencies.

## Findings Summary

| ID | Severity | Area | Location | Description |
|----|----------|------|----------|-------------|
| SEC-01 | Critical | Security | `src/components/Header.tsx:162-199` | Any visitor can become PDG via the role-switcher dropdown |
| SEC-02 | Critical | Security | `src/context/AppContext.tsx:139-211` | No authentication; all data and RBAC live in localStorage |
| SEC-03 | Critical | Security | `src/context/AppContext.tsx:208-264` | "Immutable" audit journal is editable localStorage |
| SEC-04 | High | Security | `src/App.tsx:59-67`, `src/components/DashboardView.tsx:42-51` | Client role sees tenant-wide financial KPIs |
| SEC-05 | High | Security | `src/components/InvoiceView.tsx:66` | Client data isolation hard-coded to `'cli-smb'` |
| SEC-06 | High | Security | `src/context/AppContext.tsx:366-367` | `canAccess()` fails open for unknown permission strings |
| SEC-07 | Medium | Security | `src/context/AppContext.tsx:403-411,683-730` | Mutators skip permission checks (`addVehicle`, `addWateringRun`, `reportBreakdown`) |
| SEC-08 | Medium | Security | `src/components/ReportsView.tsx:25-36` | CSV export vulnerable to spreadsheet formula injection |
| SEC-09 | Medium | Security | `package.json:14`, `README.md:18` | Unused `@google/genai` + `GEMINI_API_KEY` instructions invite client-side secret wiring |
| SEC-10 | Low | Security | `src/main.tsx:5`, all views | No XSS sinks found (`innerHTML`/`dangerouslySetInnerHTML` absent) |
| DATA-01 | High | Data integrity | `src/context/AppContext.tsx:808-809` | Invoice numbering restarts at 0001, colliding with seeded 0038-0040 |
| DATA-02 | High | Data integrity | `src/context/AppContext.tsx:316-331` | Offline fuel movements sync without updating cistern stock |
| DATA-03 | High | Data integrity | `src/context/AppContext.tsx:926-950` | Credit notes never reduce invoice remaining balance |
| DATA-04 | High | Data integrity | `src/context/AppContext.tsx:790-801` | Invoice generated with phantom quantity 1 when no validated trips |
| DATA-05 | High | Data integrity | `src/components/ContractsView.tsx:50` | New contract invents `clientId = 'cli-' + Date.now()` (no client registry) |
| DATA-06 | Medium | Data integrity | `src/context/AppContext.tsx:420-490` | `addTrip` accepts zero/negative net weight when called outside UI |
| DATA-07 | Medium | Data integrity | `src/context/AppContext.tsx:580-624` | Fuel entry can exceed tank capacity; measured stock unclamped |
| DATA-08 | Medium | Data integrity | `src/context/AppContext.tsx:305-337` | Sync reports duplicate records as newly synced |
| DATA-09 | Medium | Data integrity | `src/context/AppContext.tsx:683-715` | Watering runs self-validated; validation logs no audit entry |
| DATA-10 | Medium | Data integrity | `src/utils/rules.ts:210` | PDG may approve their own fuel measurement (SOD-04 exception) |
| REL-01 | High | Reliability | `src/context/AppContext.tsx:140-211` | Unguarded `JSON.parse` on startup → blank screen on corrupt state |
| REL-02 | Medium | Reliability | `src/context/AppContext.tsx:214-268` | 15 unguarded `localStorage.setItem` effects; quota errors unhandled |
| REL-03 | Medium | Reliability | `src/context/AppContext.tsx:378,446,545,684` | `Date.now()` IDs collide within the same millisecond |
| REL-04 | Medium | Reliability | `src/components/DashboardView.tsx:240-242` | Division by zero when no fuel cisterns (NaN width) |
| REL-05 | Low | Reliability | `src/components/*.tsx` | No empty states; tables render bare headers |
| REL-06 | Low | Reliability | `src/components/Header.tsx:129-140` | Notification bell is inert (badge with no panel) |
| MAINT-01 | High | Maintainability | `src/context/AppContext.tsx` | 1,006-line god context; 15 state slices + 20 mutators |
| MAINT-02 | High | Maintainability | `src/components/FuelView.tsx`, `InvoiceView.tsx` | 840 / 826-line components with 4-5 inline modals each |
| MAINT-03 | Medium | Maintainability | `package.json:21-34` | 8 unused dependencies (`express`, `dotenv`, `esbuild`, `tsx`, `autoprefixer`, `motion`, `@types/express`, `@google/genai`) |
| MAINT-04 | Medium | Maintainability | `src/utils/rules.ts:41,154,223,239` | Four exported helpers used only by tests |
| MAINT-05 | Medium | Maintainability | `tsconfig.json:2-26` | No `strict`, `noUnusedLocals`, or `noUnusedParameters` |
| MAINT-06 | Medium | Maintainability | `package.json:10` | `clean` uses `rm -rf` (fails on Windows) |
| MAINT-07 | Medium | Maintainability | `src/context/AppContext.tsx:341-369`, `src/components/AuditView.tsx:24-32` | Permission matrix is documentation-only and drifts from `canAccess` |
| MAINT-08 | Medium | Maintainability | repo root | No lockfile, no ESLint/Prettier, no CI workflow |
| MAINT-09 | Low | Maintainability | `vite.config.ts:9-13`, `tsconfig.json:19-23` | `@` alias configured but never used |
| TEST-01 | High | Testing | `package.json:6-12` | No `test` script; installed code has no way to run tests |
| TEST-02 | High | Testing | `src/context/AppContext.tsx` | Zero tests for mutators, RBAC, numbering, offline sync |
| TEST-03 | Medium | Testing | `src/utils/rules.test.ts:1-2` | Node test runner + `.ts` needs strip-types/tsx; not configured; no coverage/CI |
| PERF-01 | Medium | Performance | `src/context/AppContext.tsx:952-993` | Provider value recreated every render; no `useMemo`/`useCallback`/`memo` anywhere |
| PERF-02 | Medium | Performance | `src/components/TransportView.tsx:162-167` | O(n×m) `find` calls inside every table row |
| PERF-03 | Low | Performance | `src/context/AppContext.tsx:214-268` | Full dataset serialized to localStorage on every mutation |
| A11Y-01 | Medium | Accessibility | `index.html:2` | `<html lang="en">` on an all-French UI |
| A11Y-02 | Medium | Accessibility | `src/components/ContractsView.tsx:257-267` | Modals lack `role="dialog"`, `aria-modal`, focus trap, Escape handling |
| A11Y-03 | Medium | Accessibility | all views | `<label>` elements are not associated with inputs (no `htmlFor`/`id`) |
| A11Y-04 | Low | Accessibility | `src/components/Header.tsx:130-140` | Icon-only buttons lack `aria-label` |
| A11Y-05 | Low | Accessibility | `src/components/*.tsx` | Pervasive 10px text; `text-slate-400` on white ≈ 2.8:1 contrast |
| DEPS-01 | Medium | Dependencies | `package.json:13-34` | Bleeding-edge majors (React 19.0.1, Vite 8.3, TS 7.0.2, plugin-react 6) |
| DEPS-02 | Medium | Dependencies | `package.json` | No `engines`, no `name`/`description`/`license`, version `0.0.0` |
| DOC-01 | Medium | Documentation | `README.md:1-20` | AI Studio boilerplate; documents an unused API key and no domain rules |
| DOC-02 | Low | Documentation | `.aistudio/`, `public/assets/aistudio/` | ~710 KB of committed screenshots/unreferenced assets |
| DOC-03 | Low | Documentation | `metadata.json:5` | Declares server-side Gemini capability that does not exist |

---

## Detailed Findings

### Security

**SEC-01 — Role escalation by design (Critical).** `Header.tsx:162-199` renders every user in `INITIAL_USERS` as a one-click "Simulateur de profil & droits", calling `setCurrentUser(u)` and persisting it (`AppContext.tsx:214-216`). A demo affordance shipped as the auth mechanism means any visitor is PDG. Fix: remove the switcher from production builds or gate it behind `import.meta.env.DEV`; replace with real sign-in.

**SEC-02 — No authentication or server (Critical).** `AppContext.tsx:139-211` hydrates `currentUser` and all business collections from `localStorage`; `main.tsx` mounts the app with no route guard. There is no session, token, or tenant check. Impact: the entire ERP is advisory — direct edits to `edep_invoices` / `edep_audit_logs` in devtools are indistinguishable from legitimate actions. Fix: backend with session auth, server-owned writes, and per-record authorization; keep localStorage only as an offline cache.

**SEC-03 — "Append-only" audit log is writable client state (Critical).** `AuditView.tsx:53-56` advertises "Journal en Écriture Seule (Append-Only)", but logs are a `useState` array (`AppContext.tsx:208-211`) persisted by `useEffect` (`:262-264`). Impact: the audit trail has no evidentiary value; a user can delete or backdate entries. Fix: append-only server table with hash chaining, write-only client API.

**SEC-04 — Client portal leaks other tenants' finances (High).** `App.tsx:61` grants `client` access to `dashboard`, and `DashboardView.tsx:42-51` aggregates every invoice/payment without filtering by client, so SMB sees CBG/Bel Air revenue and arrears. Fix: scope all dashboard aggregates by `currentUser.companyName`/`clientId`, or remove dashboard from the client nav.

**SEC-05 — Hard-coded tenant filter (High).** `InvoiceView.tsx:66`: `if (currentUser.role === 'client' && inv.clientId !== 'cli-smb') return false;`. Every client login maps to SMB regardless of `companyName`; the user table (`mockData.ts:80-87`) has no `clientId` field at all. Fix: add `clientId` to `User`, filter by it, and reject cross-tenant reads server-side.

**SEC-06 — `canAccess` fails open (High).** `AppContext.tsx:366-367` `default: return true;` means any typo or new feature flag is granted to every role (including `client`). Only an explicit allow-list of features is restricted. Fix: `default: return false` and centralize a typed permission map.

**SEC-07 — Unguarded mutators (Medium).** `addVehicle` (`:403-411`), `addWateringRun` (`:683-709`), `validateWateringRun` (`:711-715`), and `reportBreakdown` (`:718-730`) perform no `canAccess` check, unlike `addContract` (`:373-375`) and `createInvoiceFromPrestations` (`:760-762`). UI hiding is the only barrier. Fix: check permissions inside every mutator and throw/return a typed error.

**SEC-08 — CSV formula injection (Medium).** `ReportsView.tsx:25-36` writes user-controlled values (`departureSite`, `justification`, `supplierName`, `clientName`) into CSV cells with no escaping; `:53-54,77-78` only wrap in quotes, which Excel still interprets for `=`, `+`, `-`, `@` prefixes. Fix: prefix risky cells with `'` and escape embedded quotes/delimiters.

**SEC-09 — Gemini key guidance with no corresponding code (Medium).** `package.json:14` declares `@google/genai` but `grep` finds no import anywhere in `src/`; `README.md:18` instructs setting `GEMINI_API_KEY` in `.env.local`, and `metadata.json:5` claims `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. Vite only exposes `VITE_*` vars, so a naive wiring of `process.env.GEMINI_API_KEY` would either be undefined or require leaking the secret into the bundle. Fix: delete the dependency and env instructions, or add a server proxy and document it.

**SEC-10 — No unsafe HTML rendering (Low, informational).** No `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or `new Function` in `src/`. All user text is rendered through JSX escaping, so stored-XSS risk is limited to the CSV path above.

### Data integrity

**DATA-01 — Invoice number collision (High).** `AppContext.tsx:808-809` computes `FAC-2026-${invoices.length + 1}`. Seed invoices are `FAC-2026-0038/0039/0040` (`mockData.ts:552,588,624`), so the first generated invoice is `FAC-2026-0004` (out of order) and the 36th generated invoice becomes `FAC-2026-0039`, duplicating an existing legal document number. Fix: persist a monotonic counter/sequence per fiscal year, seeded above the max existing number.

**DATA-02 — Offline fuel movements never affect stock (High).** In offline mode `addFuelMovement` queues the movement and returns early (`AppContext.tsx:566-578`), skipping the `setCisterns` update (`:586-588`). `synchronizeOfflineQueue` appends the movement to `fuelMovements` (`:316-323`) but never adjusts `cisterns`. Impact: every offline distribution silently inflates physical stock until a manual inventory catches it. Fix: replay stock deltas during sync inside a single transaction/state update.

**DATA-03 — Credit notes ignored in balances (High).** `issueCreditNote` (`:926-950`) creates the note but does not touch `invoice.remainingAmountGNF` or `paidAmountGNF`. `DashboardView.tsx:47` sums `remainingAmountGNF`, while `calculateClientBalance` (`rules.ts:107`) subtracts credit notes — two different receivables figures for the same client. Fix: derive outstanding from `total - credits - payments` in one shared selector.

**DATA-04 — Invoices for zero activity (High).** `AppContext.tsx:790-801`: for non-tonnage billing, `const qty = validTrips.length > 0 ? validTrips.length : 1;` — an invoice is created for one unit even when no validated trip exists in the period. Fix: return `{ success: false, message: 'Aucune prestation validée sur la période' }` when the filtered set is empty.

**DATA-05 — No client registry (High).** `ContractsView.tsx:50` sets `clientId: 'cli-' + Date.now()` for every new contract, while the SMB contract uses `'cli-smb'` (`mockData.ts:95`) that matches no `User`. Client identity is therefore a free-text string duplicated across contracts/invoices. Fix: introduce a `clients` collection, select from it, and validate referential integrity.

**DATA-06 — Zero-weight trips accepted (Medium).** `addTrip` (`:420-490`) never checks `netWeight > 0`; `calculateNetWeight` returns `0` for invalid input (`rules.ts:6-9`), producing a recorded trip with `calculatedAmountGNF: 0`. `TransportView.tsx:60-63` guards the UI only. Fix: validate in the mutator.

**DATA-07 — Tank capacity and negative measurements unvalidated (Medium).** Entry (`:580-584`) simply adds volume with no `<= capacityLiters` check; `recordFuelInventory` (`:607-624`) accepts any number for `measuredPhysicalStockLiters` (including negative or > capacity) and `validateFuelDiscrepancy` then writes it into the cistern (`:654-660`). Fix: clamp/validate both and require a reason when outside tolerance.

**DATA-08 — Sync counter overstates results (Medium).** `AppContext.tsx:305-337`: `count++` runs outside the `setTrips`/`setFuelMovements` updater, so items rejected as duplicates still increment the reported "synchronisés" total, and a conflicting item is cleared from the queue with no record. Fix: compute dedupe first, return explicit `{synced, skipped}` counts, keep conflicts.

**DATA-09 — Self-validated watering (Medium).** `addWateringRun` writes `status: 'valide'` directly (`:689`), and `validateWateringRun` (`:711-715`) has no SOD check and emits no audit entry, unlike trip and fuel validation. Fix: create as `saisi`, require a distinct validator, log it.

**DATA-10 — SOD-04 self-approval exception (Medium).** `rules.ts:210`: `if (measurerId === currentUserId && currentUserRole !== 'pdg')` — the PDG can approve an inventory they measured, contradicting the SOD-04 text rendered in `FuelView.tsx:403-406`. Fix: apply the rule to all roles and log a documented override instead.

### Reliability

**REL-01 — Unguarded state hydration (High).** Fifteen initializers (`AppContext.tsx:139-211`) call `JSON.parse(saved)` with no `try/catch`; one corrupted or hand-edited entry throws during render and the app never mounts. Fix: a `safeParse` helper that validates shape and falls back to seed data.

**REL-02 — Unhandled persistence failures (Medium).** `:214-268` writes the full dataset on every change with no error handling; Safari private mode / quota exhaustion throws inside effects. Fix: wrap writes, surface a persistent warning, and debounce.

**REL-03 — Millisecond IDs (Medium).** `'ctr-' + Date.now()`, `'trp-' + Date.now()`, `'mov-'`, `'queue-'`, `'pay-'`, `'inv-'` (`:378,446,545,584,671,684,696,812,880`) can collide when two records are created in the same tick (batch sync, fast clicks). Fix: `crypto.randomUUID()`.

**REL-04 — Division by zero (Medium).** `DashboardView.tsx:240-242` evaluates `totalFuelStock / totalFuelCapacity` with no guard (contrast `:64,169` which do guard); if all fuel cisterns are removed/renamed the gauge renders `NaN%`. `FuelView.tsx:225` divides by `c.capacityLiters` without a guard. Fix: guard or use a helper returning `0`.

**REL-05 / REL-06 — UX gaps (Low).** Tables (`TransportView.tsx:161-256`, `FuelView.tsx:345-392`, `InvoiceView.tsx:393-417`) render an empty `<tbody>` with no "no records" state. The header bell (`Header.tsx:129-140`) shows an alert count but has no click handler or panel. Timers (`setTimeout` for toasts) are never cleared on unmount.

### Maintainability

- **MAINT-01/02:** `AppContext.tsx` is 1,006 lines holding 15 state slices and 20 mutators; `FuelView.tsx` (840) and `InvoiceView.tsx` (826) each embed four to five modals plus tables. Extract `useLocalStorageCollection` + per-domain hooks, and split views into `Modal`/`Table`/`Header` subcomponents.
- **MAINT-03:** `express`, `dotenv`, `esbuild`, `tsx`, `autoprefixer`, `motion`, `@types/express`, `@google/genai` are declared but never imported (`grep` over `*.ts/*.tsx` returns zero hits). `autoprefixer` is also unnecessary with Tailwind v4 + the Vite plugin.
- **MAINT-04:** `calculateTheoreticalStock`, `calculateEstimatedMargin`, `checkInvoiceAndPaymentSeparation`, `checkVehicleDoubleAssignment` are only referenced by `rules.test.ts`. SOD-03 and FLT-04 are therefore advertised constraints that are never enforced.
- **MAINT-05:** `tsconfig.json` sets neither `strict` nor `noUnused*`; unused imports (`canAccess` in `FuelView.tsx:29`, `Building`/`CheckCircle2` in several views) and `as any` casts (`ReportsView.tsx:144`, `InvoiceView.tsx:573`, `FleetView.tsx:43`, `types/index.ts:312`) pass the "lint" step. `"types": ["vite/client"]` also excludes Node globals used in `vite.config.ts` (`process.env`, `path`), so `npm run lint` is expected to fail once dependencies are installed — unverified here because `node_modules` is absent.
- **MAINT-06/08:** `clean` (`package.json:10`) is `rm -rf dist server.js` (no `server.js` exists; fails in cmd.exe). No lockfile, no ESLint/Prettier/Biome, no `.github/` workflow.
- **MAINT-07:** Permission logic exists in three incompatible places: `AppContext.canAccess` (enforcement), `App.tsx:59-67` (nav visibility), and `AuditView.tsx:24-32` (display matrix). `AuditView` claims e.g. Commercial may create contracts while `canAccess('contracts_manage')` allows `commercial` but navigation/matrix differ elsewhere; there is no test asserting they agree.
- **MAINT-09:** The `@` alias (`vite.config.ts:9-13`, `tsconfig.json:19-23`) is unused — every import is relative with explicit `.ts`/`.tsx` extensions.

### Testing Gaps

- **TEST-01/03:** `package.json` has no `test` script and no test runner in devDependencies. `src/utils/rules.test.ts` uses `node:test` + `node:assert` on a `.ts` file (`:1-2`) and imports with `.ts` extensions, which requires `node --experimental-strip-types` (Node ≥22.6) or `tsx` — `tsx` is installed but never invoked. Coverage is 0% as measured.
- **TEST-02:** The 12 existing tests cover pure helpers only. Untested and high-risk: invoice numbering, credit-note math, offline sync/dedupe, permission gating, `addTrip`/`addFuelMovement` validation, localStorage corruption recovery, and every React view. No DOM/component tests, no fixtures for the context, no CI gate.

### Performance

- **PERF-01:** The provider passes an inline object literal (`AppContext.tsx:952-993`) recreated on every render; there is no `useMemo`, `useCallback`, or `React.memo` anywhere in `src/` (grep: zero matches). Every mutation re-renders `AppContent` and all nine views that are mounted.
- **PERF-02:** Row-level lookups run inside render loops: `TransportView.tsx:163-167` performs four `find`s per trip; `FleetView.tsx:188-189` and `:298-299` do the same per card; `InvoiceView.tsx:395` scans invoices per payment. Fine at seed scale, quadratic at 10k+ records.
- **PERF-03:** Every state change serializes the entire collection (`:219-267`), 15 separate `JSON.stringify` calls per interaction burst. Bundle size is acceptable (lucide tree-shaken; unused deps are not imported), but no `build.target`, chunking, or bundle analysis is configured.

### Accessibility & UX

- **A11Y-01:** `index.html:2` declares `lang="en"`; all content, labels, and error messages are French. Screen readers will mispronounce the app.
- **A11Y-02:** Modal containers (`ContractsView.tsx:257-267,412-451`, `TransportView.tsx:260-278`, `FuelView.tsx:495-506,727-738,799-808`, `InvoiceView.tsx:450-461,670-693`, `WateringView.tsx:192-203`, `FleetView.tsx:392-403`) are plain `<div className="fixed inset-0 ...">` with no `role="dialog"`, `aria-modal`, labelled heading, focus trap, initial focus, or Escape handler. Keyboard users tab into the page behind the overlay.
- **A11Y-03:** Labels are siblings of inputs, never associated: e.g. `ContractsView.tsx:272-279`, `TransportView.tsx:283-308`, `FuelView.tsx:510-521`. Clicking a label does not focus its control and assistive tech cannot name the field.
- **A11Y-04/05:** Icon-only buttons (`Header.tsx:130-140`, `InvoiceView.tsx:310-316`) rely on `title` at best. Font sizes of 10-11px are used for table headers, badges, and metadata; `text-slate-400` (#94a3b8) on white is ~2.8:1, below WCAG AA 4.5:1. Tab-like nav buttons lack `role="tab"`/`aria-selected`, and `nav` items lack `aria-current="page"`.
- **UX:** `window.print()` (`InvoiceView.tsx:680`) is applied to the whole document — only the action bar is `print:hidden` (`:674`), so the app header/sidebar are included in the PDF. `App.tsx:115` shows the active label from unfiltered `NAV_ITEMS`, which can name a module the current role cannot see.

### Dependency & Config Risks

- **DEPS-01:** React `^19.0.1` with `@types/react ^19.3.0`, Vite `^8.3.0`, `@vitejs/plugin-react ^6.1.1`, TypeScript `^7.0.2`, Tailwind `^4.3.3`, `@google/genai ^2.4.0` — all very recent majors with caret ranges, so installs drift. No `npm audit`/Renovate/CI to catch incompatibilities. A `package-lock.json` is absent, so two machines can resolve differently.
- **DEPS-02:** `package.json:2-4` still says `"name": "react-example"`, `"version": "0.0.0"`, no `description`, `license`, or `engines`. `README.md:13` says only "Node.js"; nothing pins Node ≥20.19/22 for Vite 8.
- **Config drift:** `metadata.json:5` advertises a server-side Gemini capability and `.env.example:1-4` a runtime-injected key, but the repo contains no server entry point and the `.gitignore` (`:7`) only excludes `.env*` — not `.aistudio/` or generated artifacts.

### Documentation Gaps

- **DOC-01:** `README.md` is the untouched AI Studio template: it documents `GEMINI_API_KEY` (unused), omits `npm run lint`/`build`/`preview`, never mentions the role model, the RG/SOD rule codes, the offline mode, or that data is browser-local and disposable.
- **DOC-02/03:** `.aistudio/artifacts/.../` holds four PNGs (~642 KB) and `public/assets/aistudio/Paste_October_22__2026_-_7_07PM_2ebefd62` (70 KB) is referenced by no file (grep for `Paste_October`/`assets/aistudio`: zero hits). Business rules (RG-01…RG-11, SOD-01…SOD-04, TRN/FIN/CAR/FLT IDs) exist only as comments and UI copy — no spec document in the repo.

---

## Remediation Roadmap

### Quick wins (≤1 day, no architecture change)

1. **DATA-01** sequential invoice numbering seeded from max existing number.
2. **SEC-04/SEC-05** scope dashboard and invoice queries by client identity; add `clientId` to `User`.
3. **DATA-03/DATA-04** single receivables selector (subtract credit notes) and reject empty-period invoices.
4. **DATA-02** replay cistern stock deltas during `synchronizeOfflineQueue`; **DATA-08** return accurate sync counts.
5. **SEC-06** `canAccess` default → `false`; add checks to `addVehicle`, `addWateringRun`, `validateWateringRun`, `reportBreakdown`.
6. **MAINT-03** remove the eight unused dependencies; add `package-lock.json` and `engines`.
7. **MAINT-06** replace `clean` with `rimraf`/`node --eval` cross-platform call; rename `lint` to `typecheck` and add a real ESLint/Prettier config.
8. **TEST-03** add `"test": "tsx --test src/**/*.test.ts"` and a CI job; enable `strict` + `noUnusedLocals` incrementally.
9. **A11Y-01** `lang="fr"`; associate labels (`htmlFor`/`id`); add `aria-label` to icon buttons.
10. **REL-01** `safeParse` wrapper around all localStorage reads; **REL-03** `crypto.randomUUID()`.
11. **SEC-08** CSV cell escaping; **DOC-02** delete `.aistudio/` artifacts and the orphaned public asset.

### Medium effort (1–2 weeks)

12. Replace the role-switcher with a login screen and a session model (**SEC-01/SEC-02**); keep the simulator under `import.meta.env.DEV`.
13. Extract `AppContext` into per-domain hooks with `useMemo` provider value (**MAINT-01/PERF-01**); split `FuelView`/`InvoiceView` into table + modal components (**MAINT-02**).
14. Introduce a `clients` registry with referential validation (**DATA-05**) and typed permission map shared by `canAccess`, navigation, and the audit matrix (**MAINT-07**).
15. Add validation to `addTrip`, fuel entry/inventory (capacity, non-negative) (**DATA-06/DATA-07**); SOD check for watering (**DATA-09**) and remove the PDG self-approval bypass (**DATA-10**).
16. Build an accessible `Modal` primitive (`role="dialog"`, focus trap, Escape, backdrop) and an empty-state table component (**A11Y-02, REL-05**).
17. Raise contrast/typography floor (12px minimum, `slate-500` minimum on white) and add print stylesheet for invoices.

### Larger efforts (1–2 months)

18. **Backend + persistence:** API with session auth, server-enforced RBAC and SOD, PostgreSQL (or equivalent) schema for the existing types, optimistic offline sync with conflict resolution. This is the prerequisite for **SEC-02/SEC-03**, real audit immutability, and multi-tenant isolation.
19. **Audit hardening:** append-only, hash-chained audit store with write-only client access; reconciliation report comparing derived vs stored balances.
20. **Test platform:** React Testing Library + Vitest for views/context, integration tests for the offline queue and invoicing lifecycle, coverage gates in CI.
21. **Observability & release:** error boundary + Sentry-style reporting, CI/CD, staging environment, versioned migrations, seeded demo data separated from production bootstrap.

## Sources

- `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `metadata.json`, `.env.example`, `.gitignore`, `README.md`
- `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/types/index.ts`
- `src/context/AppContext.tsx`, `src/data/mockData.ts`, `src/utils/rules.ts`, `src/utils/rules.test.ts`
- `src/components/Header.tsx`, `DashboardView.tsx`, `ContractsView.tsx`, `FleetView.tsx`, `TransportView.tsx`, `FuelView.tsx`, `WateringView.tsx`, `InvoiceView.tsx`, `ReportsView.tsx`, `AuditView.tsx`
- `.aistudio/artifacts/brain/6e9f41c0-.../.tempmediaStorage/` (4 PNGs), `public/assets/aistudio/Paste_October_22__2026_-_7_07PM_2ebefd62`

*Concerns audit: 2026-10-24*
