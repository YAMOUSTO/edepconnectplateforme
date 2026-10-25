# Codebase Structure

## Overview

This repository is a small Vite + React + TypeScript SPA with no backend code in the runtime path. The working tree (excluding `node_modules` and `dist`) contains application source under `src/`, static assets under `public/`, configuration files at root, AI Studio scaffolding under `.aistudio/`, a functional specifications document under `public/assets/aistudio/`, and the codebase maps under `.planning/`.

## Directory Layout

```
[project-root]/
├── .aistudio/                    # AI Studio artifacts (images/brain state)
│   └── artifacts/brain/...      # Temp media screenshots
├── .planning/                   # Mapping/output for analysis commands
│   └── codebase/                # ARCHITECTURE.md, STRUCTURE.md
├── public/                      # Static assets served by Vite
│   └── assets/aistudio/         # Long-form PDF/text spec (French)
├── src/                         # Application source
│   ├── App.tsx                 # Shell, navigation, tab routing
│   ├── main.tsx                # React root bootstrap
│   ├── index.css               # Tailwind v4 import
│   ├── components/             # 10 view + header components
│   ├── context/                # AppProvider and useApp
│   ├── data/                   # Seed data
│   ├── types/                  # Domain types
│   └── utils/                  # Pure business rules + tests
├── index.html                   # HTML entry, root div, module script
├── package.json                 # Scripts and dependencies
├── vite.config.ts               # Vite + React + Tailwind + alias + HMR policy
├── tsconfig.json                # TS config with path alias and bundler resolution
├── metadata.json                # AI Studio metadata
├── README.md                    # AI Studio run instructions
├── .env.example                 # Example env (GEMINI_API_KEY noted)
└── .gitignore                   # Standard ignores (node_modules/build/dist/.env*)
```

## Directory Purposes

| Directory / path | Purpose | Contains | Notes |
|---|---|---|---|
| `src/` | Application code | TS/TSX, CSS | Core of the product |
| `src/components/` | Feature screens and shell piece | 10 `.tsx` files (`App`-adjacent views + `Header`) | Each screen reads `useApp()` and owns local UI state |
| `src/context/` | Global state provider | `AppContext.tsx` | Single source of truth for all collections and actions |
| `src/data/` | Seed fixtures | `mockData.ts` | All `INITIAL_*` arrays used as fallbacks |
| `src/types/` | Domain contracts | `index.ts` | All entity interfaces and union types |
| `src/utils/` | Pure logic | `rules.ts`, `rules.test.ts` | Calculations, SOD checks, formatting |
| `public/` | Static public assets | Nested under `public/assets/` | Served as-is |
| `public/assets/aistudio/` | Documentation/spec artifact | `Paste_October_22__2026_-_7_07PM_2ebefd62` | French functional/technical spec (~68KB, 1,489 lines) |
| `.aistudio/` | AI Studio workspace artifacts | `artifacts/brain/.../media_*.png` | Screenshots/temp media (ignored for app logic) |
| `.planning/codebase/` | Generated maps | `ARCHITECTURE.md`, `STRUCTURE.md` | Created by mapping workflow |

## Entry Points

| Entry | Type | Purpose |
|---|---|---|
| `index.html:13-16` | HTML | Declares `<div id="root"></div>` and loads `/src/main.tsx` as module |
| `src/main.tsx:1-5` | TSX | Calls `createRoot(document.getElementById('root')!).render(<App />)` and imports `./index.css` |
| `src/App.tsx:170-176` | TSX | Exports default `App` which wraps `AppContent` in `AppProvider` |
| `src/App.tsx:38-168` | TSX | `AppContent` implements shell layout and tab-based view switching |
| `src/context/AppContext.tsx:137-998` | TSX | `AppProvider` initializes all slices, wires persistence, exposes context value |
| `vite.config.ts:6-21` | Config | Configures React + Tailwind plugins, `@` alias to project root, HMR/disabling based on env |

## File-Size / Line-Count Table for Source Files

| Path | Lines | KB | Role |
|---|---|---|---|
| `src/App.tsx` | 176 | 6.7 | Shell, navigation, role filtering, tab switching |
| `src/components/AuditView.tsx` | 216 | 11.6 | Audit log table, permissions matrix |
| `src/components/ContractsView.tsx` | 454 | 20.5 | Contract CRUD/workflow, status changes with reasons |
| `src/components/DashboardView.tsx` | 376 | 17.5 | KPI cards, alerts, operational summaries |
| `src/components/FleetView.tsx` | 531 | 22.8 | Vehicles, drivers, breakdowns/pans |
| `src/components/FuelView.tsx` | 840 | 37.3 | Cisterns, movements, inventories, discrepancies |
| `src/components/Header.tsx` | 205 | 9.4 | Brand, offline/sync, role switcher, alerts |
| `src/components/InvoiceView.tsx` | 826 | 37.6 | Invoices, payments, credit notes, print preview |
| `src/components/ReportsView.tsx` | 199 | 8.5 | Report filters and CSV export |
| `src/components/TransportView.tsx` | 434 | 18.1 | Trips, weigh tickets, validation |
| `src/components/WateringView.tsx` | 291 | 12.1 | Watering runs and validation |
| `src/context/AppContext.tsx` | 1006 | 33.6 | State, mutations, permissions, audit, offline, persistence |
| `src/data/mockData.ts` | 738 | 19.5 | Seed data for all collections |
| `src/index.css` | 1 | 0 | Tailwind import |
| `src/main.tsx` | 5 | 0.2 | Bootstrap |
| `src/types/index.ts` | 314 | 6.8 | All domain types |
| `src/utils/rules.test.ts` | 218 | 7.1 | Node tests for rules |
| `src/utils/rules.ts` | 261 | 7.7 | Pure business rules |

**Total source files:** 18. **Total lines:** 7091.

## Naming Conventions Observed

| Category | Convention | Examples |
|---|---|---|
| Files (components/views) | PascalCase with `View` suffix for screens | `DashboardView.tsx`, `TransportView.tsx`, `FuelView.tsx` |
| Files (context) | PascalCase | `AppContext.tsx` |
| Files (data/utils/types) | camelCase | `mockData.ts`, `rules.ts`, `rules.test.ts`, `index.ts` |
| React components | PascalCase, default or named exports mixed | Default `export default function App()` in `App.tsx`, named exports like `export const Header`, `export const DashboardView` |
| Types/interfaces | PascalCase | `User`, `Contract`, `Trip`, `Invoice`, `AuditLog` |
| Union types | PascalCase | `UserRole`, `ContractStatus`, `VehicleStatus`, `TripStatus`, `InvoiceStatus`, `PaymentStatus` |
| Context hooks | `useApp()` | Exported from `AppContext.tsx` |
| Constants/seeds | `SCREAMING_SNAKE_CASE` | `INITIAL_USERS`, `INITIAL_TRIPS`, `NAV_ITEMS` |
| IDs | Prefixed string codes | `ctr-*`, `veh-*`, `trp-*`, `mov-*`, `inv-*`, `pay-*`, `brk-*`, `wtr-*`, `aud-*`, `queue-*` |
| CSS | Tailwind utility classes inline; no CSS modules/global custom classes beyond import | Throughout components |
| Modules | ESM with `.ts`/`.tsx` extensions in imports | `import { AppProvider } from './context/AppContext.tsx'` (TS extensions used in source) |
| Dates/timestamps | ISO-like strings | `YYYY-MM-DD`, `YYYY-MM-DD HH:MM` |

## Where to Add New Code

### New Feature View (new tab/screen)

1. Create a new component in `src/components/` following `*View.tsx` naming and named export style (e.g., `src/components/NewView.tsx`).
2. Add a new `TabId` union member in `src/App.tsx:27-36`.
3. Add an entry to `NAV_ITEMS` with label/icon/optional restrictions in `src/App.tsx:47-57`.
4. Update `visibleNavItems` role filtering if the new tab should be restricted (`src/App.tsx:59-67`).
5. Add a conditional render in `AppContent` (`src/App.tsx:155-163`).
6. If the view needs global data/actions, extend `AppContextType` and `AppProvider`, add persistence `useEffect` if needed, and update `src/types/index.ts` and `src/data/mockData.ts` accordingly.

### New Domain Type

1. Add interface/union to `src/types/index.ts`. Follow existing patterns (string IDs, union literals, optional fields).
2. If the entity needs seed data, add an `INITIAL_*` array to `src/data/mockData.ts`.
3. If it belongs to global state, add a slice to `src/context/AppContext.tsx` (state, initializer with `localStorage` key, persistence `useEffect`, actions, and include in context value).

### New Business Rule

1. Add a pure function to `src/utils/rules.ts`. Keep it side-effect free and typed against `src/types/index.ts`.
2. Export it and use it in `AppContext` (for mutations) and/or in views (for display/calculations).
3. Add tests in `src/utils/rules.test.ts` using `node:test`/`node:assert/strict` (patterns already present). Note: no test script exists in `package.json` currently.

### New Mock/Seed Data

1. Add to `src/data/mockData.ts` following existing structure and type imports.
2. Wire into `AppContext` initializers as fallbacks when `localStorage` is empty.
3. Be careful not to create data that would conflict with audit expectations or invoice numbering assumptions.

### New Configuration

- Vite changes go in `vite.config.ts` (alias `@` currently points to project root; server HMR/watch behavior is intentionally controlled by `DISABLE_HMR` env var per comments).
- TypeScript changes go in `tsconfig.json`. Path alias `@/*` maps to `./*`.
- Dependencies in `package.json`. Note: some dependencies (`@google/genai`, `express`, `dotenv`, `motion`) are present but unused by current source.

## Orphaned / Unused Assets

| Path | Type | Observation |
|---|---|---|
| `public/assets/aistudio/Paste_October_22__2026_-_7_07PM_2ebefd62` | Text/spec file | French functional/technical cahier des charges (~68KB, 1,489 lines). Not imported or referenced by any source file. Treated as documentation artifact. |
| `.aistudio/` (entire tree) | AI Studio artifacts | Contains `artifacts/brain/...` with PNG screenshots (`media_1792685999734_41fcc2a2.png`, `media_1792686031599_79ac9463.png`, `media_1792686037553_8ec7bf0d.png`, `media_1792686066514_6600334e.png`). No references in source. Orphaned with respect to runtime. |
| `src/utils/rules.ts` exports | Unused rules | `calculateTheoreticalStock` imported in `AppContext.tsx:39` but not used; `calculateEstimatedMargin` and `checkInvoiceAndPaymentSeparation` not referenced in app code (only tests use some). `checkVehicleDoubleAssignment` imported but not called. |
| Dependencies | Possibly unused | `@google/genai`, `express`, `dotenv`, `motion` declared in `package.json` but no imports found in `src/`. |
| Root scripts | Limited | `npm run lint` only does `tsc --noEmit`; no `test` or `typecheck` scripts despite `rules.test.ts` and Node test usage. |

**Notes on the asset file:** the file under `public/assets/aistudio/` has no file extension shown in listing and starts with a French specification header; it is not referenced by imports or HTML. It is present in the tree but appears orphaned from the running application.

## Sources

- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `metadata.json`, `README.md`, `.gitignore`
- `src/main.tsx`, `src/App.tsx`, `src/index.css`
- `src/context/AppContext.tsx`, `src/types/index.ts`, `src/data/mockData.ts`
- `src/utils/rules.ts`, `src/utils/rules.test.ts`
- `src/components/*.tsx` (all 10 view/header components)
- `public/assets/aistudio/Paste_October_22__2026_-_7_07PM_2ebefd62` (existence/size/encoding checked)

*Structure analysis: 2026-10-24*
