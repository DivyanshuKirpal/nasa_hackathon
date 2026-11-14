# Demo script

First draft, written in milestone M4 (14 November 2026). Only the decisive moment is scripted so far. A2 adds the radiation outlook step before it; M8 adds the person, the second opinion and the body steps, with timings, and runs the whole script on the deployed site.

Everything in the demo is simulated, and the crew members are fictional. The app is a prototype, not a medical device. Say both out loud once.

## Before you start

- Open https://void-shifters.vercel.app/ in a fresh browser window, at 1024 by 768 or larger, zoom 100%.
- Keep the fallback ready: Divyanshu's screen capture of this exact flow, recorded after the M4 push.
- If the app shows an earlier demo's state, press Shift+D and load the scenario again: loading resets the readings, ticks and outbox.

## The decisive moment: one alert, two answers (about one minute)

| Step | Do | The audience sees | Say |
|---|---|---|---|
| 1 | Press Shift+D, or choose "Presenter tools" in the footer. Under "A solar particle event starts today", choose "Load". | Home for Crew member A on mission day 120, on the space station. An Act alert, "Solar particle event in progress", with "Start now: Stop your current task and make it safe." | "A solar particle event has just started. This crew is on the space station." |
| 2 | Open the alert. | The banner "Who leads": "Consult the ground. Reply expected in about 5 min." Under it: "Start the first steps now. The reply estimate is not a reason to wait.", then the first two steps. | "Close to Earth, an answer comes back in minutes, so the ground leads. The crew still starts the first steps right away." |
| 3 | In the header, set Environment to "Mars transit vehicle". | The delay slider appears at "3 min each way (Mars near)". The banner: "Consult the ground. Reply expected in about 11 min." | "Now the same crew is on the way to Mars. At the nearest point, a signal takes about three minutes each way." |
| 4 | Move the slider to the right end (keyboard: End). | "22 min each way (Mars far)". The banner turns to "Act now on board. A reply from Earth would take about 49 min." The first steps stay where they were. A second line appears: "Queued for Earth: a report". | "At the far point, the answer would take about 49 minutes. The prototype gives this alert 30 minutes to act, so the crew leads and Earth gets a report instead of a question. The steps never move: only who leads changes." |
| 5 | Scroll to "What to do" and "Evidence". | The checklist with the "Draft guidance" tag and its note, the basis tag "Illustrative threshold", the NASA sources and their "Unverified source" tags. | "Every alert shows where its numbers come from and how firm they are. These steps are drafts: no health adviser has reviewed them yet." |

Facts behind the talking points, so nobody improvises a number:

- The Mars one-way delay ranges up to about 22 minutes (`delay-nasa-m2m-2023`; light-time figures in `delay-nasa-timedelay-2017`). The slider runs from 180 s to 1320 s.
- The 5 minutes the ground needs to answer, and the station's 0 s delay, are prototype assumptions, not measured values. The banner says so.
- The 30 minutes to act comes from the prototype's rule `R-RAD-01` (`timeToActMin`); it is a design value of this prototype, not a published figure.

## Not in this step yet

- The countdown to the expected reply and the Earth link screen (M6).
- The radiation outlook from the trained model (A2). It is blocked until the NASA DONKI data is downloaded (see `docs/PROGRESS.md`).
