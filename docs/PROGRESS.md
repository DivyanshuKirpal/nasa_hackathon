# Progress

One entry per milestone, newest first (ARCHITECTURE.md section 30.4). Targets are in section 31.1.

## M2 Seed data and DONKI cache (awaiting Divyanshu's approval)
- Not started. Starts only after Divyanshu approves.
- To record at the start of M2: the hash of the M1 commit and its deployment check.
- Open before M2: how to reach DONKI (section 34, item 23); the CCMC servers and NTRS were unreachable from the team's network on 14 November.

## M1 Engine core (started Sat 18:08, done Sat 19:23)
- M0 close recorded: commit 556edb5 pushed to `main`; https://void-shifters.vercel.app/ served its build within about 30 seconds (HTTP 200, asset files identical to the local build of 556edb5, shell text present in the deployed bundle). Re-checked at 18:08: still serving that build.
- Built: `src/engine/` (Zod schemas and derived types; median, MAD and mean; baselines with the section 10 windows; every condition type and comparison kind, including `modelThreshold`; rules with one alert per rule per crew member and superseding; triage exactly as section 13.3; region and overall status with missing-data reporting; cross-reference checks; `evaluate()`). `src/data/`: indicators (10), regions (7), sources (37, all `verified: false`), environments (5), the six P0 rules and their six draft protocols, loaded and validated by `src/data/index.ts`.
- `sep_risk` stays inactive until A2: the feed has no value, so no condition on it can pass. No model threshold is typed anywhere; `rules.json` has no `modelThreshold` rule yet.
- Tests: 183 passing in 13 files (`npm run check` green; `npm run build` green). They cover baseline window edges, readiness and the spread floor; every comparison kind, including a not-ready baseline and a missing model; every condition type with missing data; superseding and deduplication; every cell of the section 13.5 table from the real rules and environments; link-down cases; missing habitat feeds and missing data kept next to active alerts; draft notes on protocols; and the cross-reference checks. Five deliberate bugs were each caught by the tests (mutation checks).
- Triage table: computed by the engine, 0 mismatches against section 13.5 (reply estimates 5, 5, 11 and 49 min). Approved by Divyanshu.
- Source review (`docs/source-review.md`): approved corrections applied (`bp-norsk-2015`, the Mathyk 2024 title and DOI, the Barger paper). New sources: `hypoglycemia-ada-2025` (glucose cut-off and protocol, passages read directly) and `gateway-medical-conops` (Moon delay; excerpt supplied by Divyanshu because the PDF could not be retrieved here). The `R-RAD-01` wording was checked against the NASA radiation brief. All sources stay `verified: false`.
- Decided in review: Environment shows No data when today's habitat sample is missing, and `Evaluation` reports `missingFeeds` and `regionGaps` next to any alert; Skin's Good means "no active alert" only; status order Act > Watch > No data > Good; `R-TEMP-02` basis `illustrative` (thresholds unchanged); study findings worded as observations in particular studies; 250 mSv worded as a design requirement, not the alert trigger or a harmless dose; CO2 evidence names the day's worst 1-hour average; the station's 0 s and the 5-minute ground handling are prototype assumptions; an act alert routed to the ground still starts on board.
- Protocols: all six remain drafts (`reviewed: false`), each with a `note` the protocol screen must show (M4). `P-GLU-LOW` is a draft adaptation of the ADA guideline: 15 g of fast-acting carbohydrate if awake and able to swallow safely, nothing by mouth otherwise, immediate help for danger signs, a 15-minute re-check that is not a fasting measurement. No medication instructions. Approval of these drafts is not clinical validation; no health adviser has reviewed them.
- Changed tooling: `resolveJsonModule` in `tsconfig.app.json`; the ESLint import boundary lets engine and body view tests import Vitest (boundary re-proved).
- Manual check: Divyanshu approved the triage table, the source corrections, the rewordings and the status semantics. No browser check applies: no screen uses the engine yet, so the engine is unit-tested only, not browser-tested.
- Known issues: NTRS-hosted sources other than the supplied Moon excerpt are unchecked. The data model has no way to mark a glucose reading as a non-fasting urgent re-check; M3 or M4 must keep such re-checks out of the fasting baseline. The Tailwind Markdown scanning and `npm audit` follow-ups from M0 are unchanged (not in scope).
- Next: M2, after Divyanshu's approval.

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
