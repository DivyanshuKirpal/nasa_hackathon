# B3 review: Chirag's complete anatomical model

Team VoidShifters, 15 November 2026. Assessed and published by Claude Code at Divyanshu's request.

**Status: published.** Crew A's 3D body on https://void-shifters.vercel.app/ is Chirag's complete anatomical model (`public/models/crew-a.glb`, version `chirag-1`). It has its ten layers, the shoulder patch and the sensor anchors. Crew B keeps the labeled placeholder until a body to its profile exists. B3's human checks are still pending.

## 1. Source

- Repository https://github.com/pkapil-star/3DBlend, commit `c1531ec0454ff3aff039d354be1e652a7aaa286e` (15 November 2026, 10:43 IST), the only commit. The clone was read only and never changed or pushed.
- The commit's author account is `pkapil-star`. The commit message ends with "Co-Authored-By: Claude Opus 5.5", so the model is labeled "AI-assisted model".
- Published file: `export/astronaut_digital_twin.glb`, copied unchanged as `public/models/crew-a.glb`: 14,987,144 bytes, SHA-256 `f5307d6296d69c3720e5b8f70575cb5e21cef139547ca410056460acb38956c8`. The app maps the file's own node names (ARCHITECTURE.md section 23.12), so no edit was needed. The Blender master and the other exports stay in the clone.

## 2. Inventory

599,615 triangles: 396 meshes in ten system groups, plus the shoulder overlay. Also 23 materials, one rig, no animations, no cameras and no compression.

| Layer (group node) | Meshes | Triangles | Notes |
|---|---|---|---|
| Skin (`SYSTEM_ExternalBody`) | 4 | 64,690 (skin alone 44,870) | skin, eyes, nails; bound to the rig; `Profile_B` shape key |
| Skeleton (`SYSTEM_Skeletal`) | 91 | 66,914 | |
| Muscles (`SYSTEM_Muscular`) | 112 | 165,432 | |
| Heart and blood vessels (`SYSTEM_Cardiovascular`) | 93 | 155,503 | heart shape key on 8 meshes |
| Lungs and airway (`SYSTEM_Respiratory`) | 12 | 22,432 | breathing shape keys on 6 meshes |
| Brain and nerves (`SYSTEM_Nervous`) | 42 | 91,616 | |
| Digestive organs, kidneys and bladder, hormone glands, lymphatic system | 12, 6, 6, 17 | 12,675, 2,615, 1,620, 15,840 | |

- The shoulder overlay sits on the right (x = −20.9 cm, y = 140.2 cm), about 14 cm across and 0.8 to 1.1 mm outside the skin.
- The three sensor anchors lie exactly on the skin.
- The skin is 174.9 cm tall, stands on the floor and is centered.

## 3. Decisions (Divyanshu, 15 November 2026)

- The atlas is published as a generic anatomical reference, with its anatomical appearance and layer controls kept. This is a narrow exception for this atlas to the rules against real people's scans and against genital or nipple detail (ARCHITECTURE.md sections 23.5 and 23.12).
- The real-volunteer origin stays documented. The app states that the model is not a replica of any crew member or astronaut.
- The original model and the source repository are preserved. Credit goes to team VoidShifters, Chirag and the upstream creators.

## 4. Provenance and licence resolution

Primary sources read:
- **Z-Anatomy** (https://github.com/Z-Anatomy/Models-of-human-anatomy, README and `License.txt`): code and content are CC BY-SA 4.0, and it includes models derived from BodyParts3D. It lists material "used as reference/included and adapted":
  - a kidney by Lissie Cowley (CC BY-NC 4.0);
  - an inner-ear model (CC BY-NC-SA 4.0);
  - brain and white-matter models from the University of Washington (no licence stated);
  - cranial nerves and foramina by the University of Dundee, CAHID (CC BY 4.0).
- **BodyParts3D** (DBCLS licence page, https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html): CC BY 4.0, credit "BodyParts3D, © The Database Center for Life Science". Z-Anatomy and the delivery cite the earlier CC BY-SA 2.1 Japan; both allow adaptation and commercial use with attribution.
- **Origin** (Mitsuhashi et al., Nucleic Acids Research 2009, PMC2686534): BodyParts3D was built on the voxel model "TARO", created from MRI images of a male volunteer, then edited by hand.

To see which source each flagged part actually came from, the delivered meshes were compared with BodyParts3D 4.0 itself. The comparison used `partof_BP3D_4.0_obj_99.zip` (64,888,505 bytes) from the DBCLS archive, downloaded for this check and not kept in the repository:
1. Each BodyParts3D part was aligned to the model by a transform fitted on parts that come from BodyParts3D, then refined locally.
2. The distance from every delivered vertex to the BodyParts3D surface was measured.

Same-source controls calibrate the scale of agreement:

| Comparison | Median distance | Vertices within 2 mm | Within 5 mm |
|---|---|---|---|
| Controls: liver / femur / hip bone / bladder | 1.5 / 3.0 / 3.0 / 6.5 mm | 65 / 22 / 21 / 0% | 99.5 / 88.5 / 84 / 25% |
| **Left kidney vs BodyParts3D left kidney** | **0.83 mm** | **94.9%** | **100%** |
| **Right kidney vs BodyParts3D right kidney** | **0.88 mm** | **91.4%** | **100%** |
| Negative: kidney vs bladder / femur | 10.5 / 10.7 mm | under 1% | 8 to 9% |
| Cerebrum / brainstem / deep structures vs BodyParts3D brain | 2.0 / 1.2 / 1.5 mm | | 95.6 / 99.2 / 86.8% |
| Cerebellum outer surface vs BodyParts3D cerebellum | 2.5 mm | | 85.5% |

Results by component:

- **Kidneys: cleared.** They are BodyParts3D's own kidney meshes: sub-millimetre agreement, tighter than any control. Z-Anatomy's urinary group also has no internal kidney parts, which a separate detailed kidney model would bring. The CC BY-NC kidney Z-Anatomy lists was not the source of these meshes; at most it served as a reference.
- **Brain: cleared on the evidence.** The cerebrum, brainstem and deep structures agree with BodyParts3D at the level of the other parts from that source. The cerebellum's outer surface does too. Of its vertices beyond 5 mm, 64% lie inside the organ, consistent with Z-Anatomy's own split into 31 lobules. A different brain, such as an averaged FreeSurfer brain, would not land within about 2 mm of this volunteer's brain. The 23 white-matter tract objects in Z-Anatomy were dropped by the delivery. What remains uncertain is only what the notice says: the University of Washington models were "used as reference/included and adapted". The measured geometry shows no material from another brain.
- **Inner ear: not included.** The delivery's mapping drops every inner- and middle-ear object.
- **Cranial nerves and foramina:** kept (52 source objects). Their listed source is CC BY 4.0, compatible with CC BY-SA 4.0, and is credited.

Result: the published file is licensed CC BY-SA 4.0. Its attribution, shown under the 3D view and in the compare view, names the generic-atlas status, Z-Anatomy, BodyParts3D (DBCLS) and its volunteer MRI origin, the University of Dundee (CAHID), Chirag (team VoidShifters) and the licence. REFERENCES.md lists the sources. The ShareAlike terms apply to the model file, not to the app's code.

## 5. What the app does with it

ARCHITECTURE.md section 23.12 has the full rules. In short:
- The node map finds the skin, the patch and the anchors.
- All ten layers are kept. Only the skin shows at first, plain gray. "Anatomical layers" checkboxes show the others under a see-through skin, with the line that they show typical anatomy, not the crew member's body and not a finding.
- Pins go on the skin only, and the rig and shape keys stay at rest so pins never move.
- Loading shows progress and stops only after 15 s without data.
- Tags read "Anatomical atlas model" and "AI-assisted model".
- The compare view labels crew A "Measured on the delivered model" and crew B "Fictional measurements" (placeholder).

## 6. Performance

Measured in headless Chrome 157 on a Windows 11 laptop, from `vite preview` on localhost.

| Environment | Load to ready | New view, skin only | New view, all 10 layers | JS heap |
|---|---|---|---|---|
| Software WebGL (SwiftShader), three runs | 0.55 to 0.73 s | 16 to 32 ms | 126 to 250 ms | 61 to 69 MB |
| GPU (NVIDIA GeForce RTX 4060 Laptop, Direct3D 11) | 0.72 s | 18 ms (one frame) | 18 ms (one frame) | 61 to 64 MB |
| Software WebGL, 500 kB/s with 150 ms latency | 32.1 s, progress 0 to 100% | n/a | n/a | 63 MB |

On the site, browsers get the model Brotli-compressed (10,440,695 bytes); it loaded in 1.15 s on software WebGL and 0.96 s on the GPU from this machine (docs/PROGRESS.md, B3 entry). Real phones are not tested.

## 7. Message to Chirag (for Divyanshu to send)

> Hi Chirag, your complete anatomical model is now live as crew A's body on the team site, unchanged, with all ten layers, the deltoid overlay and the sensor anchors, credited to you and the upstream atlases. Thank you. Two things would still help: `model-notes.md` (the AI question and who checked the shoulder placement against the UW atlas), and a body to the crew B profile if you have time. Crew B stays the placeholder until then.

## 8. Notes

- The local assessment worktree is at `../nasa-b3-local`. It is no longer needed. To remove it safely, first remove its `node_modules` link (`cmd /c rmdir ..\nasa-b3-local\node_modules`, which removes only the link), then run `git worktree remove ../nasa-b3-local`.
- A new delivery of the model needs a new version (`chirag-2`), the checker, the real-asset tests and the B2 and B3 browser checks before it is published (section 23.10).
