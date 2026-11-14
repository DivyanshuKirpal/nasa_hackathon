# Crew Health Check

Team VoidShifters' entry for the 2026 NASA Space Apps Challenge, challenge "Create Health Monitoring Software for Astronauts on Space Missions".

> Prototype for the NASA Space Apps Challenge. Not a medical device. All data in the app is simulated, and the crew members are fictional.

## What it is

A browser-only web app for a crew member checking their own health once a day. They enter a few readings; the app compares each one with that person's own in-flight normal, shows status on a body map, explains each result with a source, gives a short action card, and says whether to handle the problem on board or consult doctors on Earth, based on how long a reply from Earth would take.

Status: milestones M0 to M4 are done: the health engine, the simulated scenarios and the NASA DONKI space weather records (see [Data](#data)), Home with the body map, the daily check-in, and the alert screen with triage by communication delay (change the environment or the Mars delay slider in the header and watch the route change). The first machine learning model, `sep-risk`, is trained and evaluated (milestone A1, see [Machine learning](#machine-learning)); it is not in the app yet. The plan is in [ARCHITECTURE.md](ARCHITECTURE.md), section 31; progress is in [docs/PROGRESS.md](docs/PROGRESS.md).

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
python ml/fetch_donki.py --verify                     # check the committed DONKI files, no network
python ml/fetch_donki.py --start 2010-01-01           # NASA DONKI download (done once; the files are committed)
```

Offline machine learning (Python packages in a virtual environment; steps and expected outputs in [ml/README.md](ml/README.md)):

```
python -m venv .venv                                  # then activate it
pip install -r ml/requirements.txt
python ml/build_dataset.py                            # labelled flares from the raw DONKI files
python ml/train_sep_risk.py --seed 42                 # model file, parity file, model card and plots
```

## Machine learning

`sep-risk` is a logistic regression on eight features of a solar flare and its linked coronal mass ejection, taken from NASA DONKI records. It estimates the chance that DONKI links the flare to a solar particle event that an instrument observed. It was trained on the earlier years and tested once on held-out later years.

- The model card has the data, the label policy, the scores with their intervals, the comparison with two baselines, and the limitations: [ml/reports/sep-risk-v1.md](ml/reports/sep-risk-v1.md). Every number in it is written by `ml/train_sep_risk.py`.
- Labels: a flare is positive only when DONKI links it to an SEP record observed by an instrument. Flares with only model or unknown SEP evidence are left out. A negative means "no qualifying recorded SEP association", not that no particle event occurred.
- It is a prototype estimate, not an operational forecast. In the app it will be able to raise one watch-level alert labeled "Model estimate" (milestone A2), never an act-level alert.

## Data

- **Simulated health data.** Every crew member, reading and scenario in `public/seed/` comes from `tools/simulator` (seed 42). The crew are fictional, and the app labels this data "Simulated".
- **NASA DONKI space weather records** (Space Weather Database Of Notifications, Knowledge, Information), from NASA's Community Coordinated Modeling Center (CCMC). They are in `ml/data/raw/donki/`: one gzip JSON file per record type and year, plus `meta.json` with every query. They train the `sep-risk` model, and they give the `solar-storm` scenario its timing: SEP record `2023-08-08T01:00:00-SEP-001`.
  - Retrieved on 14 November 2026, 17:27 to 17:57 UTC (22:57 to 23:27 India time), from `https://ccmc.gsfc.nasa.gov/DONKI-API/get/`, with no API key. NASA CCMC's [official announcement](https://ccmc.gsfc.nasa.gov/news/major-updates/) documents this address as the replacement endpoint, with the migration announced for 30 September 2026. The download ran over a personal mobile hotspot, where this address answered. On the team's usual network the CCMC addresses had timed out.
  - DONKI refused every one-year request (HTTP 400). The downloader then fetched each month instead: 606 requests, all answered (HTTP 200).
  - Requested range: 2010-01-01 to 2026-10-31, and all 51 year files are present. Record counts: solar flares (FLR) 3399, coronal mass ejections (CME) 10332, solar energetic particle events (SEP) 494. The first records are dated April 2010 (FLR and CME) and August 2010 (SEP).
  - Limitations:
    - These are catalog entries, not counts of physical events. One particle event can have several SEP records, one per instrument or energy channel.
    - 140 of the 494 SEP records come from models (instrument names starting "MODEL:") rather than measurements. The `sep-risk` model learns only from SEP records observed by an instrument, as supported by official instrument documentation. Flares with only model or unknown SEP evidence are left out, not counted as negatives (decision D22 in ARCHITECTURE.md).
    - A month without records means DONKI listed none when the data was downloaded, not that nothing happened. This applies to 55 FLR months, 4 CME months and 117 SEP months, including all of 2018 and 2019 for SEP.
    - The files are a snapshot, and a later download may differ.
  - DONKI describes its content as experimental research information. Official U.S. space weather forecasts come from NOAA's Space Weather Prediction Center.

## Documents

- [ARCHITECTURE.md](ARCHITECTURE.md): the design, the milestones and the cut list
- [CLAUDE.md](CLAUDE.md): working rules for Claude Code in this repository
- [AI_USAGE.md](AI_USAGE.md): where and how AI was used
- [REFERENCES.md](REFERENCES.md): data, sources, libraries and tools
- [ml/README.md](ml/README.md): how to rebuild the dataset and the model
- [ml/reports/sep-risk-v1.md](ml/reports/sep-risk-v1.md): the model card of the `sep-risk` model
- [docs/body-model-handoff.md](docs/body-model-handoff.md): the 3D body model contract for the Blender work
