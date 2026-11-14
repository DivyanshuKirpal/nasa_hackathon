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

## AI inside the product

Planned, not built yet. Each model gets a line here and a model card when it is built (ARCHITECTURE.md section 26):

- `sep-risk` (milestones A1 and A2): a logistic regression trained on NASA DONKI space weather data.
- `personal-pattern` (milestone A3): a personal pattern check on each crew member's own readings.
- `earth-hospital`: deferred until after the hackathon (team decision, 14 November 2026).

## AI used by teammates

- Chirag builds the two 3D body models in Blender with his own Claude. What the AI did is recorded here from his `docs/model-notes.md` when the files arrive (milestone B3).
