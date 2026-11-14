# Progress

One entry per milestone, newest first (ARCHITECTURE.md section 30.4). Targets are in section 31.1.

## M1 Engine core (awaiting Divyanshu's approval)
- Not started. Starts only after Divyanshu approves.
- To record at the start of M1: the hash of the M0 close commit and its deployment check.

## M0 Scaffold and deploy (started Sat 17:13, done Sat 18:01)
- Built: Vite React TypeScript scaffold (strict, noUncheckedIndexedAccess), Tailwind v4 via `@tailwindcss/vite`, hash router (Home, Check-in, Earth link), layout shell with "Simulated data" tag and not-a-medical-device footer, status and 3D colour tokens, ESLint import boundaries (proved with throwaway bad imports: 10 of 10 caught), Prettier, Vitest with jsdom and Testing Library, `.gitignore` and `.gitattributes` (checked before the first `git add`).
- Tests: `npm run check` green (2 tests); `npm run build` green.
- Contrast: all status tokens pass WCAG AA; amber (Watch) text on white is 8.67:1.
- Plan updated: option B (A4 deferred), cuts (simulated replies, sensor trend charts, Library screen), `modelThreshold` for `R-RAD-03`, source review in M1, environment delays, recalculated schedule (section 31.1), handoff update for Chirag.
- Manual check (confirmed by Divyanshu):
  - Public site opens without a login and shows the shell, the "Simulated data" tag and the footer notice.
  - Home, Check-in and Earth link navigation works on the public site.
  - At 390 px wide (screenshot reviewed): the header uses two columns, text wraps cleanly, all three navigation items are visible, no horizontal clipping.
  - Keyboard: all four controls show a blue focus ring and Enter opens the navigation links. Focus order is Presenter tools → Home → Check-in → Earth link, because the footer comes before the bottom bar in the page.
  - The local dev server was not reported on separately; the deployed production build was checked instead.
- Deployed URL: https://void-shifters.vercel.app/ (Vercel, deploys every push to `main`). Checked by Claude Code at 17:52: HTTP 200, and its asset files match the local build of commit dd1a37a.
- Pushed: dd1a37a (the early scaffold push). The M0 close commit follows this entry; its hash and deployment check are recorded in the M1 entry.
- DONKI check (read-only): CCMC addresses not reachable from this network; `api.nasa.gov` returned 429 for `DEMO_KEY`. Decide before M2 (section 34, item 23).
- Known issues and follow-ups:
  - `npm audit` reports 7 moderate advisories, all one `minimatch` issue inside `typescript-eslint` (lint tooling only, not shipped). The only fix is a breaking downgrade, so it is left as is.
  - Follow-up: Tailwind's automatic source detection also scans the Markdown docs, so words such as "fixed" and "table" in the docs become unused CSS classes (about 0.6 kB), and the CSS file name changes whenever a doc changes. Harmless. Proposed fix: limit Tailwind's sources to `src/`, following the official Tailwind docs, as a "Fix:" commit after Divyanshu approves.
- Next: M1, awaiting Divyanshu's approval.
