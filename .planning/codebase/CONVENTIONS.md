# Coding Conventions

Single-page React 19 admin console (Vite 8, TypeScript, Tailwind CSS v4) organised by business module. Conventions are consistent but entirely implicit: there is **no ESLint, Prettier, Biome, or EditorConfig** in the repository, so style is enforced only by `tsc --noEmit` (`package.json:11`) and by convention. This document captures the patterns a new contributor should copy.

## File and Directory Naming

| Kind | Pattern | Examples |
|---|---|---|
| React components | `PascalCase.tsx`, one view per file, suffix `View` for routed screens | `src/components/TransportView.tsx`, `src/components/Header.tsx` |
| Context/providers | `PascalCase.tsx` | `src/context/AppContext.tsx` |
| Domain types | single `index.ts` barrel of types | `src/types/index.ts` |
| Pure business rules | `camelCase.ts` | `src/utils/rules.ts` |
| Fixtures | `camelCase.ts` | `src/data/mockData.ts` |
| Tests | `<subject>.test.ts` co-located in the same folder | `src/utils/rules.test.ts` |
| CSS | single entry stylesheet | `src/index.css` |

There are no feature folders and no component sub-folders (`buttons/`, `modals/`). Every screen sits flat in `src/components/` and imports shared state from `../context/AppContext.tsx` and shared logic from `../utils/rules.ts`.

Identifiers in exports use `UPPER_SNAKE_CASE` for constants (`INITIAL_CONTRACTS`, `ROLE_LABELS`, `NAV_ITEMS` — `src/data/mockData.ts:18`, `src/components/Header.tsx:17`, `src/App.tsx:47`), `camelCase` for functions/handlers (`handleCreateContract`, `handleSync`), `is*`/`has*` for booleans (`isOfflineMode`, `hasConflict`), and `set*` for setters. Runtime IDs are string concatenations of a prefix plus `Date.now()` (`'ctr-' + Date.now()`, `src/context/AppContext.tsx:378`).

## Component Definition Style

All screens are function components declared as a named `const` typed with `React.FC`, then exported by name:

```tsx
// src/components/WateringView.tsx:15
export const WateringView: React.FC = () => {
```

- `React` is imported on every component file even though the JSX runtime is automatic (`jsx: "react-jsx"`), because `React.FC`, `React.FormEvent`, and `React.ReactNode` are referenced (`src/App.tsx:38`, `src/context/AppContext.tsx:137`). There are 11 `React.FC` usages across 11 `.tsx` files.
- Only the root `App` is a `default` export and uses a declaration (`export default function App()`, `src/App.tsx:170`). Everything else is a named export — always match this.
- Components take **no props** except the provider (`{ children: React.ReactNode }`, `src/context/AppContext.tsx:137`). Data arrives through `useApp()`.
- Inline sub-components are avoided; small local copies are made instead (`const Icon = item.icon`, `src/App.tsx:84`).
- Handlers are declared inside the component before `return` and named `handleX` (`src/components/ContractsView.tsx:40`, `src/components/FuelView.tsx:65`).
- Conditional rendering uses `&&` chains inside JSX rather than helper render functions (`src/App.tsx:155-163`).

## TypeScript Usage

Interfaces are used for entity shapes; union string literals are used instead of enums:

```ts
// src/types/index.ts:1-10
export type UserRole = 'pdg' | 'direction' | ... | 'client';

// src/types/index.ts:12
export interface User { id: string; name: string; ... }
```

Follow that split: `interface` for object contracts, `type` union for closed status/role sets (`ContractStatus`, `PaymentStatus`, `BillingUnit`). All domain statuses are lowercase French `snake_case` (`'en_panne'`, `'partiellement_payee'`, `src/types/index.ts:64-69`, `234-238`).

Key compiler facts from `tsconfig.json`:

- `strict` is **not enabled**. `null`/`undefined` are unchecked, and null-safety comes from optional fields and guards by habit.
- `noUnusedLocals` / `noUnusedParameters` are **not enabled**, so dead imports survive `npm run lint` (see Inconsistencies).
- `allowImportingTsExtensions: true` (`tsconfig.json:24`) — every relative import must/will include `.ts`/`.tsx` (`import { useApp } from '../context/AppContext.tsx'`).
- Path alias `@/*` is configured (`tsconfig.json:19-23`, `vite.config.ts:9-13`) but **never used**; all imports are relative.
- Types are imported as ordinary values, never `import type` (`src/utils/rules.ts:1`, `src/context/AppContext.tsx:2-19`).
- `any` appears in exactly three places: `payload: any` (`src/types/index.ts:311`), select casts in `src/components/InvoiceView.tsx:573` and `src/components/ReportsView.tsx:144`, plus `useState<any>` for vehicle type in `src/components/FleetView.tsx:43`. Prefer the proper union in new code.
- Non-null assertion is used once for the root mount (`document.getElementById('root')!`, `src/main.tsx:5`).
- Return contracts for mutations are inferred object literals `{ success: boolean; message: string }` declared in the context interface (`src/context/AppContext.tsx:58-125`).

## State and Hooks Patterns

- **Local UI state only** with `useState`: 136 `useState` calls, 2 `useContext`, 14 `useEffect` and **zero** `useMemo`, `useCallback`, `useReducer`, or `useRef` in the codebase. Do not introduce memoisation unless profiling justifies it, or introduce it deliberately and document why.
- Derived values are computed during render without memoisation (`const filteredTrips = ...`, `src/components/DashboardView.tsx:37-75`).
- Global state lives in one context: `AppContext` (`src/context/AppContext.tsx:48-133`) with all collections, mutations, audit logging, and `canAccess(permission)`.
- Persistence uses lazy `useState` initialisers read from `localStorage` plus one `useEffect` writer per collection:

```tsx
// src/context/AppContext.tsx:151-154 and 218-220
const [contracts, setContracts] = useState<Contract[]>(() => {
  const saved = localStorage.getItem('edep_contracts');
  return saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
});
useEffect(() => { localStorage.setItem('edep_contracts', JSON.stringify(contracts)); }, [contracts]);
```

Storage keys are always prefixed `edep_` (`edep_user`, `edep_trips`, `edep_offline_queue`, …). New persisted collections must follow this pattern and add both the reader and the writer effect.
- Mutations are synchronous functions returning a result object; views inspect `res.success` and surface `res.message`.
- Hooks access is centralised in `useApp()` which throws when used outside the provider (`src/context/AppContext.tsx:1000-1006`).

## Styling Conventions

Tailwind CSS v4 is loaded with a single directive: `@import "tailwindcss";` (`src/index.css:1`). There is **no custom CSS, no `tailwind.config.js`, no CSS variables, and no `@theme` block** — all design tokens are stock Tailwind palette utilities.

Observed visual system:

| Role | Utilities |
|---|---|
| Canvas | `bg-slate-100`, text `text-slate-800`, cards `bg-white border border-slate-200` |
| Primary accent | `amber-500` (active nav, primary buttons, key amounts, `text-amber-700`) |
| Header / hero | `bg-slate-900`, gradient `from-slate-900 via-slate-800 to-amber-950` |
| Success / finance | `emerald-600/700`, `bg-emerald-50 text-emerald-800` |
| Danger / breakdown | `rose-600/700`, `bg-rose-50 text-rose-800` |
| Module colours | transport `orange`, fleet `blue`, fuel `purple`, watering `cyan`, contracts `amber`, invoices `emerald`, audit `amber` |
| Surfaces | `rounded-xl` for controls/cards, `rounded-2xl` for panels/modals, `shadow-sm` → `shadow-2xl` for modals |
| Micro-typography | `text-[10px]`/`text-[11px]`, `font-black`/`font-extrabold`, `uppercase tracking-wider` labels |
| Motion | `transition`, `animate-pulse` for alerts; no animation library usage |

Class strings are long, inline, and ordered loosely as layout → spacing → colour → typography → effect → state. There is **no class-sorting plugin**; match neighbouring markup rather than reordering. Conditional classes use template literals with nested ternaries (`src/components/FleetView.tsx:209-218`). Dynamic bar widths use `style={{ width: ... }}` (`src/components/FuelView.tsx:270-275`), which is the accepted exception to utility-only styling. Modals uniformly use `fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4` (`src/components/ContractsView.tsx:258`).

**`motion` is a declared dependency (`package.json:23`) but is never imported**; do not assume an animation system exists without adding it deliberately.

## Formatting

Verified across all of `src/`:

- 2-space indentation, no tabs (0 tab-indented lines).
- LF line endings only (7,091 LF vs 0 CRLF).
- Single quotes for TS/TSX strings and imports (67 single-quoted `from '...'`, 0 double-quoted).
- Double quotes for JSX attributes (`className="..."`).
- Semicolons always present.
- Trailing commas in multiline objects, arrays, and parameter lists (`src/types/index.ts`, `src/context/AppContext.tsx:57-59`).
- No line-length limit: lines reach 306 characters (`src/components/ReportsView.tsx:186`), 210 (`src/components/Header.tsx:72`), 193 (`src/components/ContractsView.tsx:419`).
- Object literal spacing is normally `{ key }`, but config files use the tighter `{defineConfig}` (`vite.config.ts:4`) and `{createRoot}` (`src/main.tsx:1`) — do not copy that into app code.

## Import Organization

Observed ordering, repeated in every file (e.g. `src/components/InvoiceView.tsx:1-18`):

1. React (`import React, { useState } from 'react';`)
2. Local context (`../context/AppContext.tsx`)
3. UI/icon or component imports (`lucide-react`, other `./...` components)
4. Local utilities and types (`../utils/rules.ts`, `../types/index.ts`)

Rules:
- Always include the file extension for relative imports (`.ts` / `.tsx`).
- Import only the icons you use (though existing files contain leftovers — see below).
- No barrel/index files for components; import the concrete module.
- Never use the `@/` alias even though it is configured.

## Error Handling and Validation

- **Domain validation** lives in `src/utils/rules.ts` as pure functions returning either a number or a `{ allowed|canValidate|compliant, reason? }` object (`src/utils/rules.ts:63-79`, `167-189`). Every business rule is tagged in a JSDoc comment with its requirement code (`RG-01`, `SOD-01`, `CAR-10`, `FLT-04`).
- **Context mutations** return `{ success: false, message: '…' }` on failure instead of throwing (`src/context/AppContext.tsx:373-374`, `432-438`, `868-877`). Preserve this result-object style.
- **Views** render a dismissible toast for both success and failure. Two variants exist: `{ text, type: 'success' | 'error' }` (`src/components/TransportView.tsx:33`, `100-108`) and a plain message with fixed green styling (`src/components/ContractsView.tsx:24`, `88-93`). New work should use the typed `success | error` variant.
- **`alert()` is still used** for blocking form validation in `ContractsView` (`src/components/ContractsView.tsx:43`, `74`) and `FuelView` (`src/components/FuelView.tsx:122`); prefer inline toasts for new code.
- `throw` appears only in the context guard (`src/context/AppContext.tsx:1003`).
- HTML `required`, `type="number"`, and manual guards (`if (!title || !clientName...)`) are the validation layer; there is no schema library (no Zod/Yup).
- `JSON.parse` on `localStorage` is **unguarded** in 14 initialisers (`src/context/AppContext.tsx:141`, `148`, …); corrupt storage throws during render. If touching this code, wrap in `try/catch` and fall back to fixtures.

## Language and i18n

- The UI is **entirely French**, hardcoded in JSX. No i18n library, no translation files, no `t()` helper.
- Business labels mix French prose with requirement codes: `"Module TRN-01 à TRN-08"`, `"SOD-01 : Validation par un agent distinct du saisissant"` (`src/components/TransportView.tsx:116`, `143`).
- Numbers use `toLocaleString('fr-FR')`; currency uses `formatGNF()` built on `Intl.NumberFormat('fr-GN')` (`src/utils/rules.ts:256-261`). Always format GNF through `formatGNF`, not ad-hoc concatenation.
- Dates are ISO `YYYY-MM-DD` strings or `YYYY-MM-DD HH:mm` via `new Date().toISOString().replace('T', ' ').substring(0, 16)` (`src/context/AppContext.tsx:447`). No date library.
- Technical identifiers, action codes, and statuses are French uppercase (`VALIDATION_VOYAGE`, `DECLARATION_PANNE`) (`src/context/AppContext.tsx:511`, `729`).
- Mixed language remains in comments and type names (English identifiers, French domain values). `index.html` declares `lang="en"` (`index.html:2`) although the app is French — change to `lang="fr"` only as a deliberate fix.

## Comments and Documentation

- JSDoc block comments document business rules above each exported rule with the requirement ID and, where relevant, the formula in French (`src/utils/rules.ts:3-5`, `37-40`, `81-84`). New rule functions must follow this.
- Inline `//` comments explain regulatory intent or non-obvious math (`src/context/AppContext.tsx:309`, `431`, `463`), plus `// Alert expiration proche` in fixtures (`src/data/mockData.ts:288`).
- JSX sections are marked with `{/* Header */}`, `{/* Modal: … */}`, `{/* Tab 1: Vehicles */}` (`src/components/FleetView.tsx:119`, `184`, `391`). Keep these; they are the only navigation aid in 800-line views.
- No README/API documentation exists beyond the AI Studio boilerplate (`README.md:1-20`).

## UI Composition Patterns to Copy

- Page scaffold: `<div className="space-y-6">` → toast → header block with module badge + `h2` + description → content.
- Tables: wrapper `bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden` containing an `overflow-x-auto` and `<table className="w-full text-left text-xs text-slate-600">`; header row `bg-slate-100 text-[11px] uppercase` (`src/components/TransportView.tsx:137-160`).
- Tabs are local `useState` unions with underline styling (`src/components/FleetView.tsx:33`, `154-182`).
- Modals are conditionally mounted plain `div`s, never a portal or `<dialog>`; close with `X` icon from `lucide-react`.
- Status badges are inline ternaries mapping state to `bg-*/text-*/border-*` strings; reuse the existing palette per entity.
- Offline mode is simulated globally and consistently labelled `HL` on records (`src/components/TransportView.tsx:174-177`).

## Notable Inconsistencies and Deviations

| Issue | Evidence | Guidance |
|---|---|---|
| Many unused `lucide-react` imports | `TransportView.tsx:3-16` imports `Plus, Clock, AlertCircle, Truck, User, Building, WifiOff, FileCheck2, ShieldCheck` but only uses `Scale`, `CheckCircle2`, `X`; similar in `FleetView`, `InvoiceView`, `ReportsView`, `AuditView` | Remove on touch; lint will not catch them |
| `calculateEstimatedMargin` imported but unused in tests | `src/utils/rules.test.ts:11` | Either test it or drop the import |
| `motion`, `@google/genai`, `express`, `dotenv` declared but unused in `src/` | `package.json:14`, `21-23`; no server entry point exists | Do not build on them without verifying setup |
| `any` casts in select handlers | `src/components/InvoiceView.tsx:573`, `src/components/ReportsView.tsx:144` | Cast to the real union (`Payment['paymentMethod']`, report union) |
| `alert()` for validation | `src/components/ContractsView.tsx:43`, `src/components/FuelView.tsx:122` | Use the typed toast pattern |
| Two different toast state shapes | string vs `{ text, type }` | Standardise on `{ text, type }` |
| `window.print()` used inside a modal without print-scoped layout | `src/components/InvoiceView.tsx:680`; only `print:hidden` on the action bar (`674`) | Add `@media print` rules if printing is a real requirement |
| `npm run clean` uses `rm -rf` | `package.json:10` | Fails in default Windows shells; use a cross-platform script if scripts are touched |
| Hardcoded years/periods | `FAC-2026-…` (`src/context/AppContext.tsx:809`), fixture dates in 2026 (`src/data/mockData.ts`) | Derive from `new Date()` for new numbering/periods |
| No `strict` TypeScript | `tsconfig.json` (no `strict`) | Do not rely on the compiler for null-safety; write guards |
| `<html lang="en">` with French UI | `index.html:2` | Fix when touching the shell |

## Sources

- `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `README.md`
- `src/App.tsx`, `src/main.tsx`, `src/index.css`
- `src/context/AppContext.tsx`, `src/types/index.ts`, `src/utils/rules.ts`, `src/utils/rules.test.ts`, `src/data/mockData.ts`
- `src/components/Header.tsx`, `DashboardView.tsx`, `ContractsView.tsx`, `FleetView.tsx`, `TransportView.tsx`, `FuelView.tsx`, `WateringView.tsx`, `InvoiceView.tsx`, `ReportsView.tsx`, `AuditView.tsx`

*Convention analysis: 2026-10-24*
