# Technology Stack

**Analysis Date:** 2026-10-24

## Overview

EDEP CONNECT is a single-page React application built with Vite and TypeScript, styled entirely with Tailwind CSS v4. It runs fully in the browser: there is no server, router, state library, or network client. All business data lives in React Context state and is persisted to `localStorage`, seeded from `src/data/mockData.ts`. The dependency manifest (`package.json`) also declares several server/AI packages that are never imported by application code (see "Key Dependency Observations").

## Languages

| Language | Version / Setting | Where used |
|---|---|---|
| TypeScript | `^7.0.2` (dev dependency), targeting `ES2022` | All files under `src/`, plus `vite.config.ts` |
| TSX / JSX | `jsx: "react-jsx"` (`tsconfig.json:18`) | All React components and context |
| CSS | Tailwind CSS v4 CSS-first syntax | `src/index.css` (single line: `@import "tailwindcss";`) |
| HTML | HTML5 | `index.html` |
| JSON | — | `package.json`, `metadata.json`, `tsconfig.json` |

There is no JavaScript source outside config; `allowJs: true` is enabled (`tsconfig.json:17`) but no `.js` files exist.

## Runtime & Package Management

**Runtime:** Web browser (modern, ES2022). Node.js is required only for the Vite dev server and build; no `.nvmrc`, `.node-version`, or `engines` field pins a Node version.

**Package manager:** npm (README instructs `npm install` — `README.md:17`).

**Lockfile:** None present. `package-lock.json`, `pnpm-lock.yaml`, and `yarn.lock` are all absent from the repository root, and `node_modules/` is not installed. `.gitignore:1-8` does not ignore lockfiles, so this is a genuine gap, not a hidden file. Builds are therefore non-reproducible across machines.

**Dev commands** (`package.json:6-12`):

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite --port=3000 --host=0.0.0.0` | Dev server on port 3000, exposed on all interfaces |
| `build` | `vite build` | Static production build to `dist/` |
| `preview` | `vite preview` | Serve the built bundle |
| `clean` | `rm -rf dist server.js` | POSIX-only cleanup; references a `server.js` that does not exist |
| `lint` | `tsc --noEmit` | Type-check only; no ESLint |

## Frameworks & Libraries

### Core

| Package | Declared | Purpose / Evidence |
|---|---|---|
| `react` | `^19.0.1` | UI runtime; imported in every component (e.g. `src/App.tsx:1`) |
| `react-dom` | `^19.0.1` | `createRoot` mount in `src/main.tsx:1-5` |
| `vite` | `^8.3.0` | Build/dev server; config in `vite.config.ts` |
| `@vitejs/plugin-react` | `^6.1.1` | React Fast Refresh/JSX transform (`vite.config.ts:2,8`) |
| `tailwindcss` | `^4.3.3` | Utility CSS engine (`devDependencies`) |
| `@tailwindcss/vite` | `^4.3.3` | Tailwind v4 Vite plugin (`vite.config.ts:1,8`) |
| `lucide-react` | `^0.546.0` | Icon set, imported by all 10 view/header components (e.g. `src/App.tsx:13-25`) |

### Declared but not imported anywhere in `src/`

| Package | Declared | Evidence of non-use |
|---|---|---|
| `@google/genai` | `^2.4.0` | Zero matches for `genai`/`GoogleGenAI` in `src/` (repo-wide grep matches only `package.json:14`, `.env.example`, `metadata.json`, `README.md`) |
| `express` | `^4.21.2` | No `server.js`, no `app.listen`, no import of `express` anywhere |
| `dotenv` | `^17.2.3` | No import; Vite loads `.env` files itself |
| `motion` | `^12.23.24` | No import of `motion`/`framer-motion`; animations are CSS classes only (`animate-pulse` in `src/components/Header.tsx:70`) |
| `@types/express` | `^4.17.21` | Only useful with the unused `express` dependency |
| `autoprefixer` | `^10.4.21` | No `postcss.config.*`; Tailwind v4 handles vendor prefixing |
| `esbuild` | `^0.25.0` | No direct invocation; Vite bundles its own toolchain |
| `tsx` | `^4.21.0` | No npm script uses `tsx`; the test file is TypeScript run by Node's runner only if invoked manually |

### Testing

| Item | Detail |
|---|---|
| Framework | Node.js built-in test runner (`node:test`) + `node:assert/strict` — `src/utils/rules.test.ts:1-2` |
| Test files | Exactly one: `src/utils/rules.test.ts` (197 lines, pure unit tests of `src/utils/rules.ts`) |
| Test script | **Missing** — `package.json:6-12` defines no `test` command |
| Runner config | None (`vitest.config.*`, `jest.config.*` absent) |
| Assertion library | `node:assert/strict` |
| Coverage tooling | None |

To run the existing suite, a command such as `npx tsx --test src/utils/rules.test.ts` would be required, but it is not defined in the project.

### Build / Dev tooling

- **Vite 8** config at `vite.config.ts`: `react()` + `tailwindcss()` plugins, alias `@` → project root (`vite.config.ts:9-13`).
- **HMR toggle:** `process.env.DISABLE_HMR` disables HMR and file watching, with a comment stating this is for the AI Studio agent environment (`vite.config.ts:14-20`).
- **TypeScript:** `tsc --noEmit` is the only quality gate (`package.json:11`).
- **No** ESLint, Prettier, Biome, Stylelint, Husky, lint-staged, or CI workflow files.

## TypeScript Configuration Highlights

File: `tsconfig.json`

| Option | Value | Implication |
|---|---|---|
| `target` | `ES2022` | Modern browser output |
| `module` / `moduleResolution` | `ESNext` / `bundler` | Bundler-style ESM resolution |
| `lib` | `ES2022`, `DOM`, `DOM.Iterable` | Browser APIs available |
| `types` | `["vite/client"]` | Only Vite client ambient types are auto-included; Node globals (e.g. `process` used in `vite.config.ts:17-19`) are not declared by `types`, creating a likely `Cannot find name 'process'` error under `tsc --noEmit` unless `@types/node` is otherwise pulled in |
| `strict` | **Absent** (defaults to `false`) | `strictNullChecks`, `noImplicitAny`, etc. are all off |
| `skipLibCheck` | `true` | Dependency `.d.ts` errors ignored |
| `isolatedModules` | `true` | Per-file transpilation safe |
| `moduleDetection` | `force` | Every file treated as a module |
| `allowJs` | `true` | JS allowed, though none exists |
| `allowImportingTsExtensions` | `true` | Enables explicit `.ts`/`.tsx` import specifiers used throughout `src/` |
| `noEmit` | `true` | Type-check only; Vite emits |
| `jsx` | `react-jsx` | No need to import React for JSX (yet files still do, e.g. `src/App.tsx:1`) |
| `paths` | `@/*` → `./*` | Mirrors the Vite alias; **not used** — all imports are relative |
| `experimentalDecorators` | `true` | Unused (no decorators in code) |
| `useDefineForClassFields` | `false` | No classes in application code |
| `include` | **Absent**; only `"exclude": ["dist"]` | The whole project, including `vite.config.ts` and `src/utils/rules.test.ts`, is type-checked |
| `noUnusedLocals` / `noUnusedParameters` / `noUncheckedIndexedAccess` | Absent | Dead code and unsafe indexing are not flagged |

## Styling Approach

- Tailwind CSS v4, CSS-first configuration: `src/index.css` contains only `@import "tailwindcss";` (1 line). There is **no** `tailwind.config.js/ts` and **no** `postcss.config.js`.
- `@tailwindcss/vite` is the only styling plugin (`vite.config.ts:1,8`).
- Design system is expressed inline via utility classes: slate neutrals, amber accent (`bg-amber-500`), rounded cards (`rounded-2xl`, `rounded-xl`), `font-sans`, responsive `sm:`/`md:`/`lg:` breakpoints. Example: `src/App.tsx:70-108`.
- No CSS modules, styled-components, Sass, or custom theme tokens. No dark-mode toggle; slate-900 header is hard-coded (`src/components/Header.tsx:57`).
- Fonts are default system font stack (no webfont link in `index.html`).
- Currency/number formatting uses `Intl.NumberFormat('fr-GN')` in `src/utils/rules.ts:256-262`, with French locale `toLocaleString('fr-FR')` in views.

## Application Architecture Dependencies

| Concern | Choice | Evidence |
|---|---|---|
| Routing | None — tab state in component | `App.tsx:27-36,40,155-163` |
| Global state | React Context + `useState` | `src/context/AppContext.tsx:135-137` |
| Persistence | `localStorage` | `src/context/AppContext.tsx:140-268` |
| HTTP client | None | No `fetch`/`axios`/`XMLHttpRequest` matches in `src/` |
| Forms | Native controlled inputs + local `useState` | e.g. `src/components/ContractsView.tsx` |
| Dates | Native `Date` + ISO string slicing | `src/context/AppContext.tsx:281,379,447` |
| IDs | `Date.now()` + `Math.random()` strings | `src/context/AppContext.tsx:280,378,406` |
| Export | `Blob` + `URL.createObjectURL` CSV download; `window.print()` for invoices | `src/components/ReportsView.tsx:25-36`, `src/components/InvoiceView.tsx:680` |

## Runtime & Hosting Assumptions

- **Development:** Node.js + npm; `npm run dev` serves on `0.0.0.0:3000` (`package.json:7`).
- **Production:** static files from `dist/` served by any static host. README and `.env.example` indicate the app is generated for Google AI Studio, with `APP_URL` injected as the Cloud Run service URL (`.env.example:6-9`, `README.md:5-9`).
- **No** Dockerfile, `vercel.json`, `netlify.toml`, GitHub Actions, or other deployment config exists.
- Assumes a browser with `localStorage` enabled; no SSR, no service worker, no PWA manifest (grep for `serviceWorker`/`manifest.json` returns nothing).

## Key Dependency Observations

1. **Declared-but-unused surface area (6 packages):** `@google/genai`, `express`, `dotenv`, `motion`, `@types/express`, `autoprefixer`. Removing them would shrink install size and eliminate the false impression of an AI backend (`package.json:14,21-23,29,34`).
2. **No lockfile and no installed `node_modules`:** version ranges resolve differently over time; `^7.0.2` TypeScript and `^8.3.0` Vite are major-version ranges that can introduce breaking changes on a fresh install.
3. **TypeScript `^7.0.2`** is a very new major compared with typical React/Vite templates; combined with `strict` being off, type safety is weaker than it appears. The `lint` script's success cannot be verified here because dependencies are not installed.
4. **`process` usage under `types: ["vite/client"]`:** `vite.config.ts:17,19` reads `process.env.DISABLE_HMR`, but `tsconfig.json:7` excludes Node ambient types, so `tsc --noEmit` is likely to report `Cannot find name 'process'` on a clean install.
5. **Missing test runner wiring:** a real test suite exists (`src/utils/rules.test.ts`) but is invisible to CI/users because `package.json` has no `test` script and no runner devDependency is configured for TypeScript execution.
6. **Missing lint/format configuration:** `lint` is only `tsc --noEmit`; no rules for unused imports, hooks, or formatting are enforced.
7. **`clean` script references `server.js`** (`package.json:10`), a leftover from a server-based template; no `server.js` exists.
8. **`@/*` path alias is configured twice** (`tsconfig.json:19-23`, `vite.config.ts:9-13`) but never used; all internal imports are relative with explicit `.ts`/`.tsx` extensions.
9. **Unused but installed-adjacent tooling:** `tsx` has no script; `esbuild` and `autoprefixer` add no behavior.
10. **No engine constraints:** `package.json` lacks `engines`, so Node versions below Vite 8's requirement fail at runtime rather than install time.

## Sources

- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `metadata.json`
- `.env.example`
- `.gitignore`
- `README.md`
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/types/index.ts`
- `src/context/AppContext.tsx`
- `src/utils/rules.ts`
- `src/utils/rules.test.ts`
- `src/data/mockData.ts`
- `src/components/Header.tsx`
- `src/components/ReportsView.tsx`
- `src/components/InvoiceView.tsx`
- `src/components/ContractsView.tsx`

---

*Stack analysis: 2026-10-24*
