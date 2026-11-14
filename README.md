# Crew Health Check

Team VoidShifters' entry for the 2026 NASA Space Apps Challenge, challenge "Create Health Monitoring Software for Astronauts on Space Missions".

> Prototype for the NASA Space Apps Challenge. Not a medical device. All data in the app is simulated, and the crew members are fictional.

## What it is

A browser-only web app for a crew member checking their own health once a day. They enter a few readings; the app compares each one with that person's own in-flight normal, shows status on a body map, explains each result with a source, gives a short action card, and says whether to handle the problem on board or consult doctors on Earth, based on how long a reply from Earth would take.

Status: milestones M0, M1, M3 and M4 are done: the health engine, Home with the body map, the daily check-in, and the alert screen with triage by communication delay (change the environment or the Mars delay slider in the header and watch the route change). M2 is only partly done: the simulated scenarios are finished, but the NASA DONKI download is still blocked, so the machine learning milestones cannot start yet (see [docs/PROGRESS.md](docs/PROGRESS.md)). The plan is in [ARCHITECTURE.md](ARCHITECTURE.md), section 31; progress is in [docs/PROGRESS.md](docs/PROGRESS.md).

Live site: https://void-shifters.vercel.app/

## Run it locally

You need Node.js 24.15 or newer, or 22.22.2 or newer (the test tools require it; developed on 24.22), and npm.

```
npm install
npm run dev        # local dev server, prints the URL
npm run check      # type check, lint and tests; must pass before every push
npm run build      # production build into dist/
npm run preview    # serve the production build
```

Other scripts: `npm run test:watch`, `npm run format` (Prettier).

Offline tools (Python 3, standard library; on Windows use `py` instead of `python`):

```
python tools/simulator/generate.py --all --seed 42    # regenerate public/seed/*.json
python -m unittest discover -s tools/tests
python -m unittest discover -s ml/tests
python ml/fetch_donki.py --start 2010-01-01           # NASA DONKI download (see its header for the API key)
```

## Documents

- [ARCHITECTURE.md](ARCHITECTURE.md): the design, the milestones and the cut list
- [CLAUDE.md](CLAUDE.md): working rules for Claude Code in this repository
- [AI_USAGE.md](AI_USAGE.md): where and how AI was used
- [REFERENCES.md](REFERENCES.md): data, sources, libraries and tools
- [docs/body-model-handoff.md](docs/body-model-handoff.md): the 3D body model contract for the Blender work
