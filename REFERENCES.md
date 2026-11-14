# References

Every data source, paper, library, tool and asset used in the project, with its URL. NASA items come first. Versions and licences of libraries are read from each installed package's own `package.json`.

The sources below are the evidence registry, `src/data/sources.json` (ARCHITECTURE.md section 17), listed as they stand. None is verified yet: `verified` stays false until a team member has checked the relevant claim. The M1 source check and its applied corrections are in `docs/source-review.md`.

## NASA

- 5 Hazards of Human Spaceflight. NASA Human Research Program. https://www.nasa.gov/hrp/hazards (`hrp-hazards`)
- Risks of Human Spaceflight. NASA Human Research Program. https://www.nasa.gov/hrp/risks (`hrp-risks`)
- Radiation Protection technical brief (NASA-STD-3001). NASA OCHMO. https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf (`radiation-nasa-ochmo`)
- Carbon Dioxide technical brief OCHMO-TB-004. NASA OCHMO. https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/ (`co2-nasa-ochmo`)
- Impact of Sleep Shifting Strategies on the ISS. NASA NTRS, 2024. https://ntrs.nasa.gov/citations/20240002094 (`sleep-nasa-ntrs-2024`)
- Astronaut exercise research on the station. NASA. https://www.nasa.gov/missions/station/iss-research/astronaut-exercise (`exercise-nasa`)
- An Evidence-Based Approach To Exercise Prescriptions on ISS. NASA NTRS, 2009. https://ntrs.nasa.gov/api/citations/20090013286/downloads/20090013286.pdf (`exercise-nasa-ntrs-2009`)
- SANS: 2023 Clinical Update. NASA NTRS, 2023. https://ntrs.nasa.gov/citations/20220014606 (`sans-nasa-2023`)
- Ensuring Astronaut Health (Cardiovascular and Vision Laboratory). NASA. https://www.nasa.gov/?p=207552 (`fluid-shift-nasa`)
- Human Health and Performance (Moon to Mars Architecture). NASA NTRS, 2023. https://ntrs.nasa.gov/api/citations/20230015521/downloads/Human%20Health%20and%20Performance.pdf (`delay-nasa-m2m-2023`)
- Recommendation for a Medical System Concept of Operations for Gateway Missions (NASA HRP-48012). NASA Human Research Program, NTRS 20200001341, page 17. https://ntrs.nasa.gov/api/citations/20200001341/downloads/20200001341.pdf#page=17 (`gateway-medical-conops`; excerpt supplied during review, not yet checked directly)
- NASA technical report 20170011337 on operations under communication time delay (confirm exact title). NASA NTRS, 2017. https://ntrs.nasa.gov/api/citations/20170011337/downloads/20170011337.pdf (`delay-nasa-timedelay-2017`)
- Development of Medical Capabilities and Technologies (decadal topical paper). NASA NTRS, 2021. https://ntrs.nasa.gov/api/citations/20210023828/downloads/Decadal%20Topical%20-%20Development%20of%20Medical%20Capabilities%20and%20Technologies_New%20Graphic.docx.pdf (`autonomy-nasa-exmc-2021`)
- Space Weather Database Of Notifications, Knowledge, Information (DONKI). NASA Community Coordinated Modeling Center (CCMC). https://ccmc.gsfc.nasa.gov/tools/DONKI (`donki`). The DONKI records used are listed under Data.
- NASA CCMC announcement of the DONKI API address. NASA Community Coordinated Modeling Center. https://ccmc.gsfc.nasa.gov/news/major-updates/. It documents `https://ccmc.gsfc.nasa.gov/DONKI-API/get/`, as Divyanshu confirmed on 15 November 2026. Claude Code could not open the page from its network.
- Create Health Monitoring Software for Astronauts on Space Missions, challenge page. NASA Space Apps Challenge 2026. https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/ (`spaceapps-challenge`)
- Anthropometric Measurement Procedures at the Anthropometry and Biomechanics Facility. NASA NTRS, 2024. https://ntrs.nasa.gov/citations/20240002694 (`anthropometry-nasa-ntrs-2024`)
- Winners of NASA HRP's Artemis II Data Methodology Challenge. NASA Human Research Program. https://www.nasa.gov/hrp/winners-of-nasa-hrps-artemis-ii-data-methodology-challenge/ (`hrp-artemis2-data-challenge`)
- Inspiration4 mission datasets on NASA OSDR (confirm the exact title). NASA Open Science Data Repository. https://www.nasa.gov/osdr-latest-news-i4-mission-datasets/ (`osdr-i4-nasa`)
- Inspiration4 Mission: Commercial Astronaut Data Now Available on OSDR. NASA. https://www.nasa.gov/?p=729457 (`osdr-i4-access`)
- Why We Do What We Do: Data Reuse, Open Access, and Privacy in Data Management at the Life Sciences Data Archive. NASA NTRS, 2024. https://ntrs.nasa.gov/citations/20240012051 (`lsda-privacy-ntrs-2024`)
- Ongoing HRP Research in Space. NASA Human Research Program. https://www.nasa.gov/hrp/ongoing-hrp-research/ (`hrp-ongoing-research`)

## Other space agencies

- Bio-Monitor: Keeping an eye on astronauts' vital signs. Canadian Space Agency. https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp (`biomonitor-csa`)
- Monitoring Radiation for Astronaut Health. Canadian Space Agency, 2026. https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp (`csa-radiation-monitoring-2026`)
- Why Do We Conduct Science Experiments in Space? Canadian Space Agency. https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp (`csa-why-science`)

## Papers

- Barger LK, et al. Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight: an observational study. The Lancet Neurology, 2014. https://pmc.ncbi.nlm.nih.gov/articles/PMC4188436/ (`sleep-barger-2014`)
- Systematic review and meta-analysis of bone loss in space travelers. npj Microgravity, 2020. https://pmc.ncbi.nlm.nih.gov/articles/PMC7200725 (`bone-meta-2020`)
- Increased core body temperature in astronauts during long-duration space missions. Scientific Reports, 2017. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5701078/ (`temp-stahn-2017`)
- Norsk P, et al. Fluid shifts, vasodilatation and ambulatory blood pressure reduction during long duration spaceflight. The Journal of Physiology, 2015. https://pmc.ncbi.nlm.nih.gov/articles/PMC4324706/ (`bp-norsk-2015`)
- Mathyk BA, et al. Spaceflight induces changes in gene expression profiles linked to insulin and estrogen. Communications Biology, 2024. https://doi.org/10.1038/s42003-023-05213-2 (`insulin-commsbio-2024`)
- American Diabetes Association Professional Practice Committee. 6. Glycemic Goals and Hypoglycemia: Standards of Care in Diabetes—2025. Diabetes Care, 2025 (clinical practice guideline). https://pmc.ncbi.nlm.nih.gov/articles/PMC11635034/ (`hypoglycemia-ada-2025`)
- Immune System Dysregulation and Herpesvirus Reactivation Persist During Long-Duration Spaceflight. (find journal). https://core.ac.uk/works/15261213 (`immune-herpes-iss`)
- Latent virus reactivation in astronauts on the International Space Station. npj Microgravity, 2017. https://doaj.org/article/f32947e92776479e9e3b840364e87d36 (`immune-mehta-2017`)
- Using Machine Learning Methods to Forecast If Solar Flares Will Be Associated with CMEs and SEPs. The Astrophysical Journal (arXiv version linked; confirm the journal reference), 2018. https://arxiv.org/abs/1806.07117 (`sep-ml-inceoglu-2018`)
- Analysis of SEP events and their possible precursors based on the GSEP Catalog. The Astrophysical Journal Supplement Series (arXiv version linked; confirm), 2023. https://arxiv.org/abs/2306.11318 (`sep-gsep-2023`)
- Early Prediction of Sepsis From Clinical Data: The PhysioNet/Computing in Cardiology Challenge 2019. Critical Care Medicine, 2020. https://pubmed.ncbi.nlm.nih.gov/31939789/ (`sepsis-ccm-2020`; for the Earth hospital model, deferred)

## Other references

- Deltoid, Musculoskeletal Atlas. University of Washington, Department of Radiology. https://rad.uw.edu/muscle-atlas/deltoid (`deltoid-uw-atlas`)

## Data

- NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information), NASA Community Coordinated Modeling Center (CCMC). Data credit: NASA CCMC, DONKI. Solar flare (FLR), coronal mass ejection (CME) and solar energetic particle (SEP) records.
  - Address: `https://ccmc.gsfc.nasa.gov/DONKI-API/get/` (`FLR`, `CME` and `SEP`, with `startDate` and `endDate`; no API key). It is documented in NASA CCMC's announcement (see NASA above).
  - Retrieved: 14 November 2026, 17:27:07 to 17:57:49 UTC (22:57 to 23:27 IST), by `ml/fetch_donki.py` run by Divyanshu over a personal mobile hotspot, where this address answered. On the team's usual network the CCMC addresses had timed out. Every one-year request was refused (HTTP 400), and the downloader fetched each month instead (606 requests, all HTTP 200).
  - Coverage: requested 2010-01-01 to 2026-10-31, all 51 year files present. FLR: 3399 records, 2010-04-03 to 2026-10-26. CME: 10332 records, 2010-04-03 to 2026-10-31. SEP: 494 records, 2010-08-14 to 2026-09-05.
  - Stored in `ml/data/raw/donki/`, with every query in `meta.json`. Check the files offline with `py ml/fetch_donki.py --verify`.
  - Limitations: records are catalog entries, not counts of physical events, and 140 SEP records come from models (instrument names starting "MODEL:"). Months without records (55 FLR, 4 CME, 117 SEP, including all of 2018 and 2019 for SEP) mean DONKI listed none when the data was downloaded, not that nothing happened. The files are a snapshot. DONKI describes its content as experimental research information.
  - Real event used in the `solar-storm` scenario: SEP `2023-08-08T01:00:00-SEP-001` (GOES-P: SEISS >10 MeV), https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/26416/-1, listed in `public/data/space-weather.json`.
- Seed scenarios in `public/seed/`: simulated, generated by `tools/simulator` (seed 42). Fictional crew and values; not real health data.
- PhysioNet/Computing in Cardiology Challenge 2019 dataset, version 1.0.0. https://physionet.org/content/challenge-2019/1.0.0/ (`physionet-sepsis-2019`). Listed in the registry for the Earth hospital model, which is deferred; not downloaded or used.

## Libraries

Runtime (shipped in the app):

| Library | Version | Licence | URL |
|---|---|---|---|
| React and React DOM | 19.3.1 | MIT | https://react.dev/ |
| React Router | 8.5.1 | MIT | https://github.com/remix-run/react-router |
| Zustand | 5.1.0 | MIT | https://github.com/pmndrs/zustand |
| Zod | 4.6.7 | MIT | https://zod.dev |
| Recharts | 3.10.1 | MIT | https://github.com/recharts/recharts |
| Lucide React (icons) | 1.73.0 | ISC | https://lucide.dev |
| three (Three.js) | 0.187.0 | MIT | https://threejs.org/ |
| Tailwind CSS | 4.3.5 | MIT | https://tailwindcss.com |
| @tailwindcss/vite (Tailwind's Vite plugin) | 4.3.5 | MIT | https://tailwindcss.com |

Development only (build, type checking, linting, formatting and tests; not shipped):

| Library | Version | Licence | URL |
|---|---|---|---|
| Vite | 8.3.8 | MIT | https://vite.dev |
| @vitejs/plugin-react | 6.3.0 | MIT | https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#readme |
| TypeScript | 6.0.3 | Apache-2.0 | https://www.typescriptlang.org/ |
| Vitest | 5.1.0 | MIT | https://vitest.dev |
| jsdom | 31.0.1 | MIT | https://github.com/jsdom/jsdom |
| React Testing Library (@testing-library/react) | 16.3.3 | MIT | https://github.com/testing-library/react-testing-library#readme |
| DOM Testing Library (@testing-library/dom) | 10.4.2 | MIT | https://github.com/testing-library/dom-testing-library#readme |
| @testing-library/user-event | 14.6.10 | MIT | https://github.com/testing-library/user-event#readme |
| @testing-library/jest-dom | 7.0.1 | MIT | https://github.com/testing-library/jest-dom#readme |
| ESLint and @eslint/js | 10.15.0 and 10.0.1 | MIT | https://eslint.org |
| typescript-eslint | 8.72.2 | MIT | https://typescript-eslint.io/packages/typescript-eslint |
| eslint-plugin-react-hooks | 7.1.1 | MIT | https://react.dev/ |
| eslint-plugin-react-refresh | 0.5.7 | MIT | https://github.com/ArnaudBarre/eslint-plugin-react-refresh |
| globals | 17.14.0 | MIT | https://github.com/sindresorhus/globals |
| Prettier | 3.10.1 | MIT | https://prettier.io |
| @types/react, @types/react-dom, @types/node, @types/three | 19.3.0, 19.3.0, 24.19.2, 0.187.0 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped |

## Tools and assets

| Tool | Used for | URL |
|---|---|---|
| Node.js and npm | Building and running the app | https://nodejs.org |
| Vite project template (create-vite 9.3.4, `react-ts`) | The starting scaffold | https://vite.dev |
| Git and GitHub | Version control and the public repository | https://github.com/DivyanshuKirpal/nasa_hackathon |
| Vercel | Hosting the public site | https://vercel.com |

No images, fonts or other assets are used yet.
