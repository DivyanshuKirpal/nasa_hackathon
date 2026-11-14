# Progress

One entry per milestone, newest first (ARCHITECTURE.md section 30.4). Targets are in section 31.1.

## After M2: decisions for A1 (Sun 00:31; no milestone started)
- M2 close recorded: commit `b020fd0` pushed to `main`. Deployment confirmed once from Vercel's own commit status on GitHub (state "success", "Deployment has completed", 00:11:07 IST). The public site then served the new `data/space-weather.json` (event `2023-08-08T01:00:00-SEP-001`), with the same asset files as the local build (`index-CEAMow3E.js`, `index-D7q4ypPC.css`).
- Divyanshu accepted the M2 closure at `b020fd0` and its four additional changes: the real event in `solar-storm`, the retrieval-date fix, the clearer `--verify` wording and the documentation updates.
- **Decided for A1 (decision D22, by Divyanshu):**
  - Raw DONKI records stay unchanged.
  - A1 inventories the actual SEP instrument names and gives each one a class, `observed`, `model` or `unknown`, in a reviewed table. A name does not count as a measurement just because it lacks the `MODEL:` prefix: Divyanshu confirms each `observed` name.
  - Each SEP record is then observed-only, mixed, model-only or unknown.
  - An eligible flare is positive only when a permitted association (direct, or through one linked CME) reaches an instrument-observed SEP record (observed-only or mixed). An extra model prediction does not disqualify it.
  - A flare whose only SEP evidence is model-generated or unknown is excluded as ambiguous, never turned into a negative.
  - A negative means "no qualifying recorded SEP association", not "no SEP occurred".
  - The model card explains this selection policy and reports the record classes and the flare labels and exclusions by year and split.
  - Where it is recorded in ARCHITECTURE.md:
    - decision D22;
    - section 26.4, rewritten;
    - sections 26.1, 26.6, 26.8, 26.9, 26.10, 26.12 and 26.14, reconciled with it;
    - section 24.6, for the `solar-flare-watch` choice;
    - section 31.7, for the reviewed instrument table and a new manual check item;
    - the glossary.
- **Endpoint confirmed:**
  - Divyanshu confirmed that NASA CCMC's official announcement (https://ccmc.gsfc.nasa.gov/news/major-updates/) documents `https://ccmc.gsfc.nasa.gov/DONKI-API/get/`.
  - Claude Code's own fetch of the page was refused at the connection, so the confirmation rests on Divyanshu's check.
  - Recorded in ARCHITECTURE.md section 25, REFERENCES.md and README.md.
  - The third-party note's date and redirect details stay unconfirmed.
- Unchanged: no data was downloaded again and no code changed. Every source stays `verified: false`, including `donki`, and every protocol stays `reviewed: false`.
- **Manual checks still pending** (none confirmed yet):
  - M2: open `public/seed/sleep-debt.json` and see `"simulated": true`, the fictional crew names and `expectedAlerts`.
  - M2: open `ml/data/raw/donki/meta.json` and see `apiBase`, `requested`, `recordCounts` and `complete: true`.
  - M3: a look by eye at Home and Check-in on the deployed site.
  - M4: record the short screen capture of the decisive-moment flow.
  - M4: a look by eye at the alert screen on the deployed site.
  - M4: approve the re-check name "Blood sugar re-check (not fasting)" and the reworded `R-GLU-02` explanation.
- Next: stop. A1, M5 and every other milestone wait for Divyanshu's approval.

## M2 close: DONKI data (download Sat 22:57 to 23:27, checked and closed Sun 00:10)
- M4 close recorded: commit `291cb20` pushed to `main`. Deployment confirmed from Vercel's own commit status on GitHub (state "success", 21:30:30 IST), and the public site then served exactly the asset files of the local M4 build (`index-CEAMow3E.js`, `index-D7q4ypPC.css`).
- Downloader fixed before the download (`ml/fetch_donki.py`; ARCHITECTURE.md section 25, "Changed on 14 November 2026"). A first run with Divyanshu's personal key logged only "HTTPError" and recorded zero events for types it never downloaded. Now:
  - Every failure shows its HTTP status and the API's own error, filtered so no key, no request address with its query and no raw body appears.
  - Redirects are reported, not followed.
  - An address counts as working only if it answers with SEP records.
  - Retries are limited.
  - A type without files has the count `null`.
  - `--diagnose` and `--verify` are new.
  - Tests: 46 offline tests, including a local test server. Six deliberate bugs were each caught.
- Download, run by Divyanshu on 14 November from 17:27:07 to 17:57:49 UTC (22:57 to 23:27 IST):
  - Over a personal mobile hotspot, `https://ccmc.gsfc.nasa.gov/DONKI-API/get/` (`ccmc-donki-api`) answered without a key. On the team's usual network the CCMC addresses had timed out (Windows error 10060).
  - Requested 2010-01-01 to 2026-10-31, the last full month.
  - All 51 one-year requests were refused with HTTP 400. The body was not JSON, so no reason was given. The month-by-month fallback then fetched all 606 months, each answered on the first attempt with HTTP 200 and a JSON list.
  - `meta.json`: `complete: true`, no missing files, `usesPersonalKey: false`, no problems in the last run.
- Counts, copied from `meta.json`:
  - FLR: 3399 records, 2010-04-03T09:04Z to 2026-10-26T18:17Z.
  - CME: 10332 records, 2010-04-03T09:54Z to 2026-10-31T05:00Z.
  - SEP: 494 records, 2010-08-14T12:30Z to 2026-09-05T16:30Z.
  - Divyanshu's `--verify` passed, and it passed again here offline. Counts match the files, IDs are unique, no record falls outside its file window, and no ID appears in two files.
- Periods without records are kept exactly as downloaded. Each one was a successful answer with an empty list: 55 FLR months, 4 CME months and 117 SEP months, including all of 2018 and 2019 for SEP. They mean DONKI listed no record when the data was downloaded, not that no event occurred.
- `--verify` wording: it now says this itself and lists the years without records. It says "year files 17 of 17" instead of "records in 17 of 17 years", which read as if every year had records.
- **Open question for A1 (not decided; A1 not started).** Decided on 15 November as decision D22: see "After M2" above.
  - 140 of the 494 SEP records come from models (instrument names starting "MODEL:"), not measurements.
  - One particle event often has several SEP records. On the morning of 2023-07-18, eight SEP records link to the same M5.0 flare: three instruments in several energy channels, plus model output.
  - Section 26.4 labels a flare positive when it links to any SEP record, which would count model-only records. Section 26.14 says the labels describe events recorded by instruments.
  - Divyanshu should decide before A1 whether model-only SEP records count.
- Real event in `solar-storm` (M2 build item 5): SEP `2023-08-08T01:00:00-SEP-001`, measured by GOES-P SEISS >10 MeV, starting at 01:00 UTC.
  - DONKI links it to flare `2023-08-07T20:30:00-FLR-001` (X1.5, peak 20:46 UTC the day before) and to CME `2023-08-07T20:48:00-CME-001`.
  - A script chose it by the rule in `tools/simulator/scenarios.py`: the earliest SEP record of the model's test years (2023 on) that GOES measured, that starts before 09:00 UTC, and that is linked to an X-class flare that peaked the previous UTC day. It was the only record that met all of these.
  - Regenerated with seed 42. Only `basedOn` in `public/seed/solar-storm.json` and `public/data/space-weather.json` changed; readings and expected alerts are unchanged, and two runs were byte-identical. The app does not show `basedOn` yet.
- Fixed: `public/data/space-weather.json` would have shown `retrievedAt: null`, because the new `meta.json` keeps one retrieval time per file. The generator now takes the time of the file that holds the event (`2026-11-14T17:56:14Z`), and stops if it is missing.
- Credential check: scanned `meta.json`, all 51 data files (decompressed), the downloader, its tests and `ARCHITECTURE.md`. Nothing found:
  - no key, no `api_key` value, no request header;
  - no token-like string except a public article ID already in `ARCHITECTURE.md`;
  - query strings in `meta.json` hold only `startDate` and `endDate`; those inside DONKI `note` fields are links to public solar data viewers;
  - the key in the tests is a labeled fake.
- Tests:
  - `npm run check` green: 283 tests in 21 files, including the golden tests for every scenario. `npm run build` green.
  - Python: 46 downloader tests and 24 simulator tests pass. The 4 new simulator tests cover an event with its file's retrieval time, a missing retrieval time, a missing event, and `solar-storm`'s event being measured, not modelled, and starting before 09:00 UTC.
- M2 exit test passed: the golden tests are green for `baseline-healthy`, `sleep-debt` and `solar-storm`, and the DONKI raw files and `meta.json` are committed with this entry.
- Unchanged: every source stays `verified: false`, and every protocol stays `reviewed: false`.
- Blocker for A1: resolved. A1 has not started.
- Manual check for Divyanshu: open `ml/data/raw/donki/meta.json` and look for `apiBase`, `requested`, `recordCounts` and `complete: true`.
- Known issues:
  - The JavaScript bundle size warning is unchanged.
  - ARCHITECTURE.md section 25 still asks for the `DONKI-API` address to be confirmed on the official DONKI page. (Confirmed on 15 November: see "After M2" above.)
  - The A1 question above. (Decided on 15 November.)
  - Blank lines inside the `AI_USAGE.md` table split it when rendered; they were removed.
- Next: stop. A1 waits for Divyanshu's approval.

## M4 Alerts, triage and environments (started Sat 21:02, closed Sat 21:30)
- Deployments before this milestone, confirmed from Vercel's own commit status on GitHub ("success", "Deployment has completed"): M2 `5e38dc5` and M3 `9f8a297`. At 21:00 the public site also served exactly the asset files of the local M3 build.
- Fixed first, before re-check entry was switched on: a blood sugar re-check would have been labeled "Fasting blood sugar, latest re-check". Indicators may now carry `recheckLabel`; blood sugar's is "Blood sugar re-check (not fasting)". The `R-GLU-02` explanation now says its latest reading is either the routine fasting measurement or an urgent re-check. The 70 mg/dL cut-off and its source are unchanged.
- Built: the alert screen `#/alert/:alertKey` in the fixed order (Who leads, What changed, Why it matters, What to do, Evidence, Also contributing), with "Acknowledge" and, for self care, "Send to ground"; the route banner with the reply estimate, the "Start the first steps now. The reply estimate is not a reason to wait." line for an act alert that consults the ground, and the first two steps of every act alert; "Draft guidance" and the protocol note above a checklist whose ticks persist; missing data next to the alert; basis tag and sources with "Unverified source" tags; an urgent re-check form (stored as `purpose: "recheck"`, never in the fasting baseline); the environment selector and the Mars delay slider in the header; automatic outbox messages (one per alert and kind, shown as "Queued for Earth" with a "Simulated" tag); the presenter tools drawer with the scenario picker (Shift+D or the footer); Home alerts as links, with "Start now:" and the first step for act alerts.
- Tests: `npm run check` green, 283 tests in 21 files (Python unchanged: 20 tool and 9 downloader tests pass; seed files regenerate byte-identical). The plan's tests: the fixed section order; `solar-storm` at the station is `consult_ground` with 5 min, Mars near 11 min `consult_ground`, Mars far 49 min `act_on_board` (store test and screen test: the exit test); 150 slider moves leave one message per alert and kind. Four deliberate bugs (no outbox de-duplication, the "do not wait" line hidden, first steps hidden while consulting the ground, re-checks entering the fasting history) were each caught.
- Browser checks: headless Chrome 157 through the DevTools Protocol (the Chrome extension was not connected), fresh profile, against the local dev server. 27 of 27 passed: Shift+D opens the drawer with focus on its heading; `solar-storm` loads from the drawer by keyboard; "Consult the ground. Reply expected in about 5 min." with the first steps visible without scrolling at 1024 by 768 (and at 390 by 844); arrow keys on the environment selector reach Mars transit (180 s, 11 min); End on the slider gives "Act now on board. A reply from Earth would take about 49 min." with the steps still at the top; 22 more slider moves leave one consult and one report; Mars rover has the same range and logic; ticks and acknowledge by keyboard survive a reload; every alert of every scenario shows a basis tag and at least one source; a 64 mg/dL re-check keeps the alert and is named "Blood sugar re-check (not fasting)", an 88 mg/dL re-check clears it, and the day keeps its fasting reading; no sideways scrolling at 390 px; tap targets at least 44 px; every keyboard stop showed a focus ring; no console errors.
- Fixed during checks: the delay text was an `<output>` live region, so a screen reader would have read each slider value twice; it is now plain text (the slider announces its value). The reply estimate note no longer repeats "5 min".
- Known issues and follow-ups: the JavaScript bundle is 511 kB (157 kB gzipped), just over Vite's 500 kB warning; splitting the screens into lazy chunks is a later "Fix:" if wanted. The countdown to the expected reply and self-care re-check reminders need the running clock (M6). Only the active crew member's alerts queue messages until the crew switch arrives (M6).
- Docs: first draft of `docs/demo-script.md` (the decisive moment).
- Manual checks for Divyanshu: record the short screen capture of the decisive-moment flow as the demo fallback (the plan asks for it after this push), and look at the alert screen by eye on the deployed site.
- Next: stop. M5 and the A and B milestones wait for Divyanshu's approval. A1 stays blocked on the DONKI data.

## M3 Home and check-in (written Sat 20:20 to 20:40, verified and closed Sat 21:00)
- Built: the store (`src/store/`: Zustand with `persist`, key `chc-state`, version 1, validated on load; bad storage falls back to the default scenario), the mission clock module (`src/clock/missionClock.ts`; time stands still until M6), the seed loader and memoized selectors, shared components (`StatusBadge`, `Card`, `Tag`, `SourceLink`, `BodyMap2D`), Home (body map, status by area with readings in place, active alerts, Today card) and the 9-step daily check-in (validation, "How to measure", "Why it matters in space" with sources and "Unverified source" tags, "Skip for now", yesterday's value as a hint, summary).
- Tests: `npm run check` green, 246 tests in 18 files (Python: 20 tool and 9 downloader tests, unchanged), including the three the plan asks for: Home with `sleep-debt` lists `R-SLEEP-01`; check-in accepts a sleep value and refuses an out-of-range one with an inline message; in `baseline-healthy` a temperature 2.5 °C above the baseline turns Abdomen to Act.
- Browser checks: the Chrome extension was not connected, so Claude Code drove the installed Chrome (157) headless through the DevTools Protocol with a fresh profile, keyboard input only. All 15 checks passed: first load shows `sleep-debt` with Head Watch and the sleep alert; a full check-in by keyboard with one step skipped; an out-of-range value refused inline; focus moves to each new step heading; a 40.1 °C reading turns Abdomen to Act; the skipped step stays listed as due; both survive a reload; no sideways scrolling at 390 px on Home and Check-in; every tap target at least 44 px; smallest text 16 px; every keyboard stop showed a focus ring; no console errors.
- Fixed from the browser checks: status rows now have a spoken name with clear breaks ("Head: Watch. Sleep has been low…" instead of the parts run together), and on a phone the headline gets its own line. Fixed from re-reading the exit checks: the Today card now names the steps still to do today.
- Manual check for Divyanshu: a quick look by eye at Home and Check-in on the deployed site (the automated checks cannot judge appearance).
- Next: M4 (approved).

## M2 Seed data and DONKI cache (started Sat 20:04, closed Sat 20:20: seed part done, DONKI part NOT met; DONKI part completed Sun 00:10, see "M2 close" above)
- M1 close recorded: commit 09f9cee pushed to `main`. Deployment confirmed at 20:05 from Vercel's own commit status on GitHub: state "success", "Deployment has completed" (the same record exists for M0's 556edb5). This is a commit-to-deployment record, not an inference from identical files.
- Built: `tools/simulator/` (`model.py`, `scenarios.py`, `generate.py`; standard library, seed 42, three fictional crew members), six scenarios in `public/seed/` (`baseline-healthy`, `sleep-debt`, `solar-storm`, `fever`, `low-glucose`, `early-mission`) with `index.json`, `public/data/space-weather.json`, Zod schemas for the scenario, index and space weather files, and `ml/fetch_donki.py` (standard library; resumable; key only from the `NASA_API_KEY` environment variable, never printed or written to `meta.json`).
- Engine: readings may carry `purpose: "recheck"`. Urgent re-checks count for "latest" rules but never enter a baseline, streak, average or the overdue list, and never replace the day's routine reading (needed before any re-check entry exists).
- Tests: `npm run check` green, 209 tests in 15 files, including golden tests (every scenario gives exactly its expected alerts at 09:00 on its mission day, for every crew member) and the re-check rules. Python: 20 simulator tests and 9 downloader tests pass. Determinism: three runs with seed 42 gave byte-identical files.
- **DONKI: not retrieved.** Investigated 20:04 to 20:08, inside the 20-minute limit. Every CCMC host refused or timed out, from the team's network and from an outside fetch service; `api.nasa.gov` refused the shared `DEMO_KEY` (retry after about 9 hours). The hand-entered fallback was not possible: the DONKI website is on the same hosts, and no event is typed from memory. So `solar-storm` uses fictional timing (`basedOn: null`), `space-weather.json` lists no event, and no `ml/data/raw/donki/` exists. The M2 exit test's DONKI half ("raw files and meta.json committed") is NOT passed.
- **Blocker for A1:** no training data. Needs a personal api.nasa.gov key set privately as `NASA_API_KEY`, or the CCMC servers answering again, then `py ml/fetch_donki.py --start 2010-01-01`. (Resolved on 15 November: see "M2 close" above.)
- Tooling: tests now have their own `tsconfig.test.json` (Node types for reading generated files); app code is still checked without Node types.
- Manual check for Divyanshu: open `public/seed/sleep-debt.json` and see `"simulated": true`, the fictional crew names and `expectedAlerts`.
- Next: M3 (approved).

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
