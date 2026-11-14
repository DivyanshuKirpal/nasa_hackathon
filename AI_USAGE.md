# Use of artificial intelligence

The Space Apps rules ask teams to acknowledge AI-generated code, data, images and text. This log lists every kind of AI use in the project: the tool, what it was used for, and which files. A new line is added whenever AI is used for a new kind of task.

## AI tools used to build the project

| Date | Tool | Used for | Files |
|---|---|---|---|
| 14 Nov 2026 | Claude (claude.ai) | Writing the planning documents: design, milestones and working rules | `ARCHITECTURE.md`, `CLAUDE.md` |
| 14 Nov 2026 | Claude Code (model Claude Opus 5.5) | M0: project scaffold and configuration (Vite, TypeScript, Tailwind, ESLint import rules, Prettier, Vitest), the app shell and placeholder screens, the colour tokens and their contrast check, the shell smoke test, and these documentation stubs. Divyanshu reviews and runs every change | `package.json`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `index.html`, `src/`, `README.md`, `AI_USAGE.md`, `REFERENCES.md`, `docs/PROGRESS.md` |
| 14 Nov 2026 | Claude Code (model Claude Opus 5.5) | Updating the plan after the team's scope decisions (schedule, cuts, deferrals) and the body model handoff | `ARCHITECTURE.md`, `CLAUDE.md`, `docs/body-model-handoff.md` |
| 14 Nov 2026 | Claude Code (model Claude Opus 5.5) | M1: the health engine (schemas, baseline, conditions, rules, triage, status), its tests, and the data files. Copied from ARCHITECTURE.md: the indicators, regions, environments, sources and six P0 rules. Drafted by Claude Code, for team review: the `howToMeasure` texts, the `explain` texts of five rules and four protocols | `src/engine/`, `src/data/`, `eslint.config.js` |
| 14 Nov 2026 | Claude Code (model Claude Opus 5.5) | Source check: fetched the primary papers behind questionable registry entries (Europe PMC, PubMed Central, a web fetch service) and quoted the supporting passages. Corrections are proposed for a person to confirm, not applied | `docs/source-review.md` |
| 14 Nov 2026 | Claude Code (model Claude Fable 5.2) | M2: the seed simulator and its tests, the DONKI downloader, the scenario schemas and golden tests. The scenario files are simulated data produced by this AI-written generator (fictional crew and values, labeled "simulated") | `tools/simulator/`, `tools/tests/`, `ml/fetch_donki.py`, `ml/tests/`, `public/seed/`, `public/data/space-weather.json`, `src/engine/`, `src/data/__tests__/` |
| 14 Nov 2026 | Claude Code (models Claude Fable 5.2, then Claude Opus 5.5) | M3: the store, mission clock, seed loader, selectors, Home with the body map, the daily check-in, their tests; browser checks of the running app in headless Chrome (keyboard only, 390 px) and the fixes they found | `src/store/`, `src/clock/`, `src/components/`, `src/features/home/`, `src/features/checkin/`, `src/lib/`, `src/test/` |
| 14 Nov 2026 | Claude Code (model Claude Opus 5.5) | M4: the alert screen, route banner, environment selector and delay slider, outbox messages, urgent re-check entry, the presenter tools drawer, their tests and the first demo script draft; browser checks of these flows in headless Chrome | `src/features/alerts/`, `src/features/demo/`, `src/components/`, `src/link/`, `src/store/`, `src/lib/`, `docs/demo-script.md` |
| 14 to 15 Nov 2026 | Claude Code (model Claude Opus 5.5) | M2 close: rewrote the DONKI downloader's error reporting, retries, month fallback, `--diagnose` and `--verify`, and its tests; checked the downloaded DONKI files with read-only scripts (counts, gaps, a credential scan); picked the real particle event for `solar-storm` by a scripted rule; fixed the retrieval date in the space weather file. The DONKI records are NASA data that Divyanshu downloaded with this script; AI did not create or change them | `ml/fetch_donki.py`, `ml/tests/test_fetch_donki.py`, `tools/simulator/`, `tools/tests/`, `public/seed/solar-storm.json`, `public/data/space-weather.json`, `ARCHITECTURE.md`, `README.md`, `REFERENCES.md`, `docs/PROGRESS.md` |
| 15 Nov 2026 | Claude Code (model Claude Fable 5.2) | Documentation after M2: recorded the team's label decision for A1 (D22) and the DONKI endpoint announcement | `ARCHITECTURE.md`, `README.md`, `REFERENCES.md`, `docs/PROGRESS.md` |
| 15 Nov 2026 | Claude Code (model Claude Fable 5.2) | A1: the dataset builder, the feature code, the training and evaluation script and their tests. Claude Code also read official instrument documentation through a web fetch service to classify the DONKI SEP instrument names, and recorded the sources. The model file, the parity file, the model card and its plots are written by these scripts from NASA DONKI records; no number in them is typed by a person or by the AI | `ml/features.py`, `ml/build_dataset.py`, `ml/train_sep_risk.py`, `ml/sep_instrument_classes.json`, `ml/tests/`, `ml/README.md`, `ml/requirements.txt`, `ml/data/processed/`, `ml/artifacts/`, `ml/reports/`, `src/data/models/sep-risk-v1.json` |

## AI inside the product

Each model gets a line here and a model card when it is built (ARCHITECTURE.md section 26):

- `sep-risk`: **trained in A1 (15 November 2026), not in the app yet (A2).** A logistic regression on eight features from NASA DONKI flare and CME records. It estimates the chance that a flare is linked to an instrument-observed solar particle event. Its results, limits and label policy are in the model card, [ml/reports/sep-risk-v1.md](ml/reports/sep-risk-v1.md). It is a machine-learning model inside the product, built by code that Claude Code wrote.
- `personal-pattern` (milestone A3): a personal pattern check on each crew member's own readings.
- `earth-hospital`: deferred until after the hackathon (team decision, 14 November 2026).

## AI used by teammates

- Chirag builds the two 3D body models in Blender with his own Claude. What the AI did is recorded here from his `docs/model-notes.md` when the files arrive (milestone B3).
