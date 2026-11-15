# B3 review: Chirag's body model delivery

Team VoidShifters, 15 November 2026. Reviewed by Claude Code for Divyanshu, against `ARCHITECTURE.md` section 23 (the body model contract) and `docs/body-model-handoff.md`.

**Status: not integrated.** Both crew members keep the labeled placeholder (`placeholder-1`). Nothing was copied to `public/models/`, no model file was changed, and nothing was pushed to the model repository. Section 4 lists the decisions needed before integration can go on.

## 1. What was inspected

- Source: https://github.com/pkapil-star/3DBlend, commit `c1531ec0454ff3aff039d354be1e652a7aaa286e` ("Add Crew Health Check anatomical digital-twin asset", 15 November 2026, 10:43 IST; the repository's only commit). It was cloned read-only into a folder next to this repository, so the original Blender sources stay there unchanged.
- Git LFS: the repository has no `.gitattributes` and no LFS pointers; every file is a real binary.
- Delivered:
  - `blender/crew_health_check_master.blend` (85.5 MB);
  - `export/astronaut_digital_twin.glb` (15.0 MB, 599,615 triangles, 396 meshes, organs, skeleton and muscles);
  - ten per-system GLBs, among them `export/systems/astronaut_external.glb` (the outer body, 3.2 MB) and `export/systems/astronaut_anchors_regions_markers.glb` (anchors, the right deltoid overlay and markers);
  - manifests, nine preview renders, the build scripts and five documents: README, LICENSES, VALIDATION, INTEGRATION_THREEJS and IMPLEMENTATION_PLAN.
- Not delivered: `crew-a.glb`, `crew-b.glb` and `model-notes.md` (section 23.2). The delivery's README, LICENSES and VALIDATION files cover part of what `model-notes.md` asks for, but not the AI question or who checked the shoulder placement.

## 2. Contract checker results

`python tools/check_body_model.py <file> --crew c1` (expected height 175 cm). Only the failing lines are shown.

| File | Result | Failing checks |
|---|---|---|
| `astronaut_external.glb` | FAIL (8) | 2. nodes `body`, `patch_shoulder_r_outer`, `sensor_chest`, `sensor_upper_back`, `sensor_forearm_l` missing; 3. one skin (expected 0); 5. no mesh named `body`; 6. 64,690 triangles (at most 60,000) |
| `astronaut_digital_twin.glb` | FAIL (10) | 2. all five nodes missing; 3. one skin; 4. 391 mesh nodes with non-identity transforms; 5. no mesh named `body`; 6. 599,615 triangles; 6. 14.99 MB (at most 4 MB) |
| `astronaut_anchors_regions_markers.glb` | FAIL (6) | 2. all five nodes missing; 5. no body geometry (this file has the anchors and the overlay only) |

Read under the delivery's own names, the geometry itself meets the contract:

| Check | Measured | Contract |
|---|---|---|
| Height of `BODY_Skin` | 174.9 cm | 175 cm within 1 cm |
| Lowest point | 0.07 cm | 0 within 1 cm |
| Midline | x = 0.0 cm | within 3 cm |
| Facing | chest anchor z = 9.3 cm, upper back anchor z = −11.2 cm | chest in front |
| Right deltoid overlay (`REGION_SHOULDER_RIGHT_DELTOID`) | center x = −20.9 cm, y = 140.2 cm, about 14 cm across | right side, above 113.8 cm, at least 6 cm |
| Left forearm anchor | x = 40.7 cm | positive x |
| Triangles of `BODY_Skin` alone | 44,870 | at most 60,000 |

## 3. Findings, sorted

### 3.1 Integration issues a re-export can fix

These are packaging, not geometry. Each is a setting or a rename in Blender:

1. Names: `BODY_Skin` → `body`; `REGION_SHOULDER_RIGHT_DELTOID` → `patch_shoulder_r_outer` (and confirm it sits about 2 mm above the skin); `ANCHOR_SENSOR_CHEST`, `ANCHOR_SENSOR_UPPER_BACK`, `ANCHOR_SENSOR_LEFT_FOREARM` → `sensor_chest`, `sensor_upper_back`, `sensor_forearm_l`.
2. One file per body: the skin, the patch and the three anchors together, selected and exported alone (section 23.3), instead of the skin in one file and the anchors in another.
3. No armature, skin binding or shape keys in the export: apply the pose, remove the armature modifier and the `Profile_B` shape key on the export copy (section 23.5).
4. No separate eyes or nails: leave `BODY_Eye_L`, `BODY_Eye_R` and `BODY_Nails` out (section 23.5). With them and the rig gone, the triangle count is the skin's 44,870.
5. Record the values actually used in `model-notes.md`, with the AI answer and who checked the shoulder placement against the UW atlas (`deltoid-uw-atlas`), and when.

Under `CLAUDE.md` and section 23.1, Claude Code never edits, converts or re-exports a model file, so these fixes are Chirag's in Blender unless the team changes that rule (decision 4.5). The checker then runs again on the new files.

### 3.2 Optional, can wait (M7 or later)

- The arms are at about 30 degrees, the contract says about 40. That's cosmetic; pins and anchors still work.
- Guide measurements more than 2 cm from the crew A profile: shoulder breadth 36.6 cm (profile 42), chest 109.7 cm (102), waist 83.6 cm (86), forearm 25.0 cm (27). These are guides, not checks; if the model is accepted, the manifest and section 23.8 take the measured values (section 22.3).
- The skin is open at the two eyelid rims (42 boundary edges, from the delivery's own validation).
- The full anatomical model is far too heavy for the web view: 15 MB and 600,000 triangles. Only the outer body would be used.

### 3.3 Decisions that need Divyanshu (and Chirag)

1. **Provenance.** The delivery's README says the anatomy comes from "one adult male donor dataset (BodyParts3D via Z-Anatomy)", and the outer skin was built from that atlas. The handoff (section 5, step 2) says not to use scans or likenesses of real people, and `CLAUDE.md` says never to use real people's scans. The delivery's manifest calls it "not a representation of any specific person". Does this source fit the rule, or does the team want a different base mesh? The handoff suggested Blender Studio's CC0 Human Base Meshes.
2. **Licence.** The delivery is under CC BY-SA 4.0 (ShareAlike): serving the model file from the public site shares it under that licence, and the attribution text in the delivery's `docs/LICENSES.md` must be shown wherever the model is shown. The app code itself is not affected, according to that file; this review gives no legal advice. Also, the delivery leaves open whether the kidney mesh carries a non-commercial (CC BY-NC 4.0) condition; that matters only if organs are ever shipped. Does the team accept these terms for the outer body?
3. **Scope.** The contract asks for a neutral mannequin for soreness pins and sensors; the delivery is an anatomical digital twin with organs, skeleton, muscles, heart and lung animation. Showing internal anatomy would change what the Body screen claims to be. Use only the outer body, or nothing from this delivery?
4. **Crew B.** There is no second body. The delivery's `Profile_B` is a shape key on the same skin: "heavier build, same stature", at most 2.8 cm of surface change. Crew B's contract profile is slimmer and longer-legged (inseam 84, shoulders 37, chest 88, waist 72), so `Profile_B` does not match it. Keep the placeholder for crew B, ask Chirag for `crew-b.glb`, or change crew B's profile?
5. **Who converts.** Your B3 brief mentioned integration fixes on working copies, but `CLAUDE.md` and section 23.1 forbid Claude Code from changing model files. If the team wants converted copies made here (renames, rig and shape key removal, merging the anchors), that rule and the handoff must change first. Otherwise Chirag re-exports.
6. **AI label.** The delivery does not say whether an AI tool generated or changed the geometry, directly or through a script it wrote. The build scripts re-pose, merge and decimate meshes. Until Chirag answers, the team cannot set `aiAssisted` correctly for his model (the placeholder is AI-assisted and says so).

## 4. Draft message to Chirag (for Divyanshu to send)

> Hi Chirag, thanks for the delivery (3DBlend, commit c1531ec). The geometry fits: height 174.9 cm, feet on the ground, facing +Z, the right deltoid overlay and the three anchors on the right sides. The app can't load it yet because of packaging. Our checker says, for `astronaut_external.glb`:
> - FAIL 2: no node `body`, `patch_shoulder_r_outer`, `sensor_chest`, `sensor_upper_back`, `sensor_forearm_l`. Fix: rename `BODY_Skin`, `REGION_SHOULDER_RIGHT_DELTOID` and the three `ANCHOR_SENSOR_*` objects to those names.
> - FAIL 3: one skin (expected 0). Fix: on an export copy, apply the pose, remove the armature modifier and delete the `Profile_B` shape key.
> - FAIL 6: 64,690 triangles (at most 60,000). Fix: export only the skin, the patch and the three anchors (no eyes, nails or rig); the skin alone is 44,870.
> - One file per crew member, `crew-a.glb` and `crew-b.glb`, with the export settings in section 6 of the handoff, plus `model-notes.md`, including whether an AI tool generated or changed the geometry.
>
> Two questions from the team before you re-export: is the BodyParts3D/Z-Anatomy base acceptable under our "no real-person scans" rule, and what should crew B be (its profile is slimmer and longer-legged than `Profile_B`)? Divyanshu will confirm.

## 5. Credits

- The app is team VoidShifters' work. Chirag is the team member responsible for the Blender body models; his delivery above is work in progress and is not in the app yet.
- If the outer body is integrated later, the 3D view must carry the delivery's required attribution: Z-Anatomy (CC BY-SA 4.0) and BodyParts3D, © The Database Center for Life Science (CC BY-SA 2.1 Japan), modified for this project. The exact wording is in the delivery's `docs/LICENSES.md`. That attribution also goes into REFERENCES.md, and Chirag's use of AI into AI_USAGE.md once he states it.
