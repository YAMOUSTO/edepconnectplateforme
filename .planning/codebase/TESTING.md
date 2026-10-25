# Testing Patterns

## Overview

Testing is limited to one hand-written **Node.js built-in test file** covering pure business-rule functions. There is no test runner in `package.json`, no `vitest`/`jest` config, no component tests, no E2E tests, and no CI configuration. The repository also ships without `node_modules` or a lockfile, so nothing can run until `npm install` is executed. `npm run lint` is a type-check (`tsc --noEmit`), not a linter.

## Current Test Setup

| Item | State | Evidence |
|---|---|---|
| Runner | Node.js `node:test` (built-in) | `import test from 'node:test';` — `src/utils/rules.test.ts:1` |
| Assertions | `node:assert/strict` | `src/utils/rules.test.ts:2` |
| TypeScript execution | Provided by `tsx` dev dependency | `"tsx": "^4.21.0"` — `package.json:32` |
| Test script | **None** | `package.json:6-12` has only `dev`, `build`, `preview`, `clean`, `lint` |
| Runner config | **None** (no `vitest.config.*`, `jest.config.*`, `playwright.config.*`) | repo root listing |
| Installed dependencies | **None** — no `node_modules`, no lockfile | verified on disk |
| CI | **None** | no `.github/`, no CI config |
| Coverage tooling | **None** | — |

The suite contains **9 `test()` blocks** (`src/utils/rules.test.ts:18-218`), all synchronous, using `assert.equal` and `assert.match`. It covers 10 of the 13 exported functions in `src/utils/rules.ts`.

## Scripts and What They Actually Do

```jsonc
// package.json:6-12
"dev":     "vite --port=3000 --host=0.0.0.0",
"build":   "vite build",
"preview": "vite preview",
"clean":   "rm -rf dist server.js",   // POSIX only; fails in default Windows cmd/PowerShell
"lint":    "tsc --noEmit"             // type-check only, no style or unused-code checks
```

- `npm run lint` will not flag unused imports, unused variables, or formatting because `tsconfig.json` enables neither `noUnusedLocals`/`noUnusedParameters` nor `strict`.
- `npm run build` transpiles and bundles but executes **zero tests**; it is not a quality gate.
- `npm run clean` is unsafe on Windows (the stated development platform); the package manager is npm.

## Test File Naming and Location

- Pattern: `<module>.test.ts` **co-located** with the module under test — `src/utils/rules.test.ts` next to `src/utils/rules.ts`.
- No `__tests__` directory, no `tests/` root, no `.spec.ts` files.
- Type-only imports are written as value imports (`import { Invoice, Payment, CreditNote } from '../types/index.ts';`, `src/utils/rules.test.ts:16`) and relative imports include extensions (`./rules.ts`, line 15). This matters for native Node execution (see below).
- No fixtures/factories directory: test data is declared inline inside each test (`dummyInvoices`, `dummyCredits`, `dummyPayments` — `src/utils/rules.test.ts:59-130`). The app fixtures in `src/data/mockData.ts` are not reused by tests.

## How to Run Tests Today

```powershell
# 1. Required once — no dependencies are installed
npm install

# 2. Run the Node built-in test suite through tsx
npx tsx --test src/utils/rules.test.ts

# 3. Type-check (this is what "lint" means)
npm run lint
```

Expected result with `tsx`: 9 tests pass, 0 failures.

Failure modes to expect:

| Attempt | Outcome |
|---|---|
| `node --test src/utils/rules.test.ts` on Node 22.x native type-stripping | Likely `SyntaxError: The requested module '../types/index.ts' does not provide an export named 'Invoice'`. Node strips types but does not elide non-`type` imports, and `Invoice`/`Payment`/`CreditNote` exist only as types (`src/utils/rules.test.ts:16`). Use `tsx`. |
| `npx vitest run` or `npm test` | No Vitest install/config and no `test` script; `rules.test.ts` also imports `node:test`, so Vitest must not collect it unless migrated. |
| Running before `npm install` | `'tsx' is not recognized` / `npx` prompts to download; no `node_modules` exists. |
| `npm run lint` | Type-check only; unused imports (`calculateEstimatedMargin` at `src/utils/rules.test.ts:11`) pass silently. |

Node available in this environment: v22.18.0; npm 11.12.1.

## Coverage Assessment

### Covered (`src/utils/rules.ts` → `src/utils/rules.test.ts`)

| Function | Rule tags | Test line |
|---|---|---|
| `calculateNetWeight` | RG-01 | 18-24 |
| `calculatePrestationAmount` | RG-01/RG-02 | 26-33 |
| `calculateTheoreticalStock` | RG-03 | 35-44 |
| `calculateStockDiscrepancy` | RG-03 | 35-44 |
| `validateFuelExit` | CAR-10 | 46-56 |
| `calculateClientBalance` | RG-04 | 58-141 |
| `determineInvoicePaymentStatus` | RG-05 | 143-176 |
| `canUserValidateTrip` | SOD-01 | 178-191 |
| `canUserValidateFuelDiscrepancy` | SOD-04 | 193-202 |
| `checkVehicleDoubleAssignment` | FLT-04 | 204-218 |

### Untested — pure functions

| Function | File | Risk |
|---|---|---|
| `calculateEstimatedMargin` | `src/utils/rules.ts:154-161` | Imported by the test file but never asserted; margin maths could regress silently |
| `checkInvoiceAndPaymentSeparation` | `src/utils/rules.ts:223-234` | SOD-03 separation is never verified |
| `formatGNF` | `src/utils/rules.ts:256-261` | Locale/currency output used in every table, dashboard, invoice |

### Untested — application layers

- **All React components** (11 files, ~4,600 lines): role filtering (`src/App.tsx:59-67`), modals, toasts, CSV export (`src/components/ReportsView.tsx:25-99`), printable invoice (`src/components/InvoiceView.tsx:669-823`).
- **`AppContext` flows** (`src/context/AppContext.tsx`): TRN-03 duplicate ticket (432), trip creation/amount (443-469), offline queueing (471-485), SOD-01 (497-500), CAR-10 stock guard (534-539), SOD-04 approval (642-649), invoice generation/numbering (752-840), emit lock (842-857), over-payment guard (868-877), credit note (926-950), audit append (271-293), `canAccess` (341-369), idempotent sync (300-338).
- **Persistence**: unguarded `localStorage`/`JSON.parse` in 14 initialisers (139-211) — corrupt storage crashes the app.
- **Fixtures**: `src/data/mockData.ts` referential integrity and totals are untested; no visual/snapshot tests exist.

Rough estimate: the tested surface is ~260 lines of pure logic; the untested surface is ~5,800 lines (context + components + data).

## Gaps and Recommended Strategy

### 1. Keep and formalise unit tests for `rules.ts`

Add a `test` script so the suite is discoverable:

```jsonc
"test": "tsx --test src/**/*.test.ts"
```

Add cases for the three untested functions and for edge branches that currently have none:

- `calculatePrestationAmount(0, 'tonne', rate)` and `unitRateGNF <= 0`.
- `validateFuelExit(0, 0)` (invalid volume branch, line 67-69).
- `determineInvoicePaymentStatus` for `annulee`/`brouillon` (line 129-131) and zero-total invoices.
- `canUserValidateFuelDiscrepancy` PDG self-approval exception (line 210).
- `calculateEstimatedMargin` with `revenueGNF = 0` (rate must be 0, line 159).
- `formatGNF` output (non-breaking space behaviour of `Intl` in `fr-GN`).

### 2. Adopt Vitest for component/integration tests

Vitest is the natural fit for this Vite 8 project. Install a Vitest major whose peer range includes Vite 8 (pin exact versions in `package-lock.json` once installed):

```powershell
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react `
  @testing-library/user-event @testing-library/jest-dom
```

Minimal config:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/utils/rules.test.ts'], // keep node:test file on tsx until migrated
  },
});
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

Then either migrate `rules.test.ts` to Vitest (`import { describe, it, expect } from 'vitest'`) or keep the Node runner and exclude it as above. Add scripts: `test:unit`, `test:watch`, `test:coverage`.

Priority component/integration targets (highest business risk first):

1. **`AppContext` integration** — render a harness with `AppProvider` and a consumer; exercise trip creation, TRN-03 duplicate, SOD-01 self-validation block, CAR-10 negative-stock block, SOD-04 approval, invoice emit lock, over-payment rejection, offline queue + idempotent sync. Seed `localStorage` per test and clear it in `afterEach` (the provider persists on every change).
2. **Role/permission matrix** — assert `canAccess` per role and the nav filtering in `src/App.tsx:59-67` (client sees 3 items, chauffeur 4, others 9).
3. **`InvoiceView` / `TransportView`** — form validation messages, toast variants, disabled actions when `canAccess` is false, invoice totals rendering via `formatGNF`.
4. **`ReportsView`** — CSV row/header generation by stubbing `URL.createObjectURL` and clicking export.
5. **Fixtures** — a referential-integrity test over `src/data/mockData.ts`.

### 3. Add Playwright for E2E smoke flows

Install `@playwright/test`; run against `npm run dev` (port 3000) or `npm run preview`. Minimum journeys:

- Switch role via the header dropdown; verify navigation and action buttons change.
- Record a trip, attempt duplicate ticket, validate as a second permitted user.
- Toggle offline mode, record a trip, return online, sync; verify no duplicate.
- Generate → emit → pay → credit note on an invoice; verify status transitions and locked emission.
- Export CSV for each report type.

### 4. Testability refactors worth doing

- Extract mutation logic from `AppContext` into pure functions (e.g. `applyTrip`, `applyPayment`) and inject a storage adapter with `try/catch` around `JSON.parse`.
- Split 800-line views (`FuelView.tsx`, `InvoiceView.tsx`) into modal/table sub-components and replace `alert()` with toast state so failures are assertable.

### 5. Coverage targets

No thresholds exist. A pragmatic sequence: 90%+ on `src/utils/rules.ts`, 70%+ on `src/context/AppContext.tsx`, and smoke-level coverage of each view plus the role matrix. Enforce with `coverage.thresholds` only after the baseline is green.

## Manual QA Checklist

Use `npm run dev` and the header role simulator (`src/components/Header.tsx:145-199`).

**Cross-cutting**
- [ ] All 9 roles: nav matches `App.tsx:59-67`; forbidden actions hidden.
- [ ] Reload persists data (`edep_*` keys) and audit entries grow.
- [ ] Offline toggle: banner/queue counter; create each offline record, sync, no duplicates.
- [ ] Header badge counts low fuel + active breakdowns + queue; desktop sidebar and mobile drawer navigate.
- [ ] `npm run build` succeeds; `npm run preview` serves the app.

**Dashboard:** invoiced/collected/outstanding reconcile with invoice/payment tabs; contract filter changes tonnage; alerts match fleet/fuel data.
**Contracts:** required-field validation; create persists; brouillon → soumis → actif → suspendu requires a reason and writes audit; unauthorised roles see no validate actions.
**Fleet:** add vehicle updates counts; breakdown flips vehicle to `en_panne`; resolve restores `disponible` and records cost; licence expiry highlight.
**Transport:** live net weight/amount; duplicate ticket rejected (TRN-03); gross ≤ tare rejected; SOD-01 blocks self-validation but allows another authorised user; offline rows show `HL`.
**Fuel:** entry increases / distribution decreases stock; over-draw refused (CAR-10); low-stock gauge; inventory discrepancy sign correct; SOD-04 blocks measurer and unauthorised roles; approval sets stock to physical value.
**Watering:** rotation count recalculates volume (20,000 L/rotation); offline run appears after sync; totals update.
**Invoices:** sequential `FAC-2026-####`; draft shows Émettre, then lock icon; over-payment rejected, partial payment recomputes status; credit note ≤ total and reflected in balance; print preview totals correct; client role sees only SMB.
**Reports:** each type downloads BOM `;`-separated CSV with correct headers/date filter and filename.
**Audit:** previous actions listed with user/role/time/before/after/reason; filter works; current role highlighted in matrix.

## Sources

- `package.json` (scripts, dependencies)
- `tsconfig.json`, `vite.config.ts`
- `src/utils/rules.test.ts`, `src/utils/rules.ts`
- `src/context/AppContext.tsx`, `src/data/mockData.ts`
- `src/App.tsx`, `src/components/*.tsx`
- Filesystem checks: no `node_modules`, no lockfile, no test/CI configuration

*Testing analysis: 2026-10-24*
