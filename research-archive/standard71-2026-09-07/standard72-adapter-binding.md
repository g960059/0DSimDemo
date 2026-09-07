# Standard72 local adapter, artifact and Worker qualification

Status: qualified for the local candidate binding only. No registry admission,
publication, production/default switch or main merge. This follow-up completes
the bounded adapter step in [the checkpoint decision](continuation-resolution.md);
it does not retrospectively change that earlier review's scope. The research
branch and PR #613 remain **DO NOT MERGE**.

## What changed

The history-preserving72 owner is now used by both Studio Session creation
routes, restore, live experiment capture, TBV warm-start/control, and analysis
checkpoint/fork paths. There is one durable72 envelope, including the existing
coupled predictor; no fallback relabels a71 checkpoint or fills missing history.
The thin release wrapper installs its own new baseline checkpoint only for an
exact baseline-fixture match. An explicit checkpoint or a different fixture
does not receive that default silently.

There is no physiological refit. HR70, TBV4935 mL, BSA1.9 m², the71 material/Ca
and vascular construction, and solver tolerances are unchanged. The existing
physical fixture ID is deliberately reused; the new identity distinguishes
numerical continuation semantics, not a new biological law. The52 controls and
baseline defaults are preserved, including the5 mL TBV grid.72 reexports the
latest compatible **production**70 Workbench Surface without changing its ID,
catalogs or pinned analysis methods. It does not copy the local71 documentation
Surface's renamed metadata. No exact-frame placeholders for analysis were added.

## Own cold reference and settled launch

The new qualification starts from the physical fixture's cold initial state.
It uses the existing public model transaction path, which does not use the
history predictor, and runs54 cycles to the accepted periodic boundary. It
matches the reviewed coarse terminal trace, completed beat and native event
timing exactly and passes the existing rest/conservation checks (27.37 s in this
run). It does not import an old checkpoint or claim to cold-replay the Studio
predictor-enabled Session path.

Because that reference path truly has no predictor, its fresh72 envelope has
an explicitly empty canonical predictor workspace. This is not recovery of
missing history from71. A restored72 Session actually advances from the periodic
boundary at46.285714… s to46.286 s and captures the grid-aligned launch, including
the resulting predictor history. No clock is reassigned. The wrapper checks
model/fixture identity, report provenance, both digests, clocks, and completed
beat preservation. The generated report and both checkpoints are checked in
under `studio/integrations/mainWireIntegratedV3/standard72-*`.

| Record | SHA-256 |
| --- | --- |
| Coarse input | `1ffa46eb77e5325622feda2321298b48ee3de4c2f52c8210e084c0a28a20c1a4` |
| Prospective admission candidate v4 | `76f38faf7e685f1447eed6f825452ce5b35c9acf8bffe786a56c913a4f493bf7` |
| Own72 periodic checkpoint (envelope digest) | `895da31d328b4f25c7df7e042dbb9c276d2653b7c6f1517e63aa10eac619a7ac` |
| Own72 aligned launch (envelope digest) | `a125d6aeaca4e1859adb847008afc83aa6de29715b6b23409006861b30932df2` |
| Final artifact, 2,471,942 bytes | `5210a42f1469072182ec6d7f18ee3ee54547a469e78af5479c812ca8ad0f45bb` |

The first qualifier command mistakenly supplied v3 admission and was rejected
by the input-hash guard before simulation. The correct reviewed v4 file was
then used; no hash guard was relaxed. Existing1 ms and low/high reserve evidence
remains evidence for the unchanged physical research construction, not a newly
executed72 fine/reserve run. No afterload trial was added.

## Verification

- Core + Studio binding + scientific-suite manifest: **23/23 tests passed**.
  This includes history4 capture, ordinary and post-control continuation,
  both initialization routes, settled launch, control change/reset and rejection
  cases. Native Starling and formal fixed-TBV PV analyses retain complete loops.
  Each analysis starts after eight warm steps and preserves the entire live
  checkpoint payload, not just the visible frame.
-71 construction, selected-session extension and documentation regressions:
  **49/49 tests passed**. `tsc --noEmit` and `git diff --check` passed.
- [Final artifact report](standard72-adapter-artifact-binding.json): two builds
  have identical bytes; source and artifact frames agree; actual experiment
  capture after eight post-control warm steps has history4 and continues exactly
  for1000 steps. Snapshot admission passed. Artifact revision is
  `33b55a8c50383451a374b4dedd1b83b9082193d4d7f6e7ec668600816e251e00`.
- [Real browser Worker report](standard72-adapter-browser-worker.json):
  Chromium151.0.7922.34 and WebKit26.5 each pass an ordinary simulation-adapter
  case and an execution-plan case after an actual TBV4935→4940 mL control.
  In each case the artifact's capture crosses Worker→main structured clone,
  JSON serialization/deserialization, and main→Worker structured clone. A new
  Session then matches the uninterrupted Session for1000 steps, all exact
  outputs/time/revision, and the final complete checkpoint including predictor
  and beat accumulators. Each snapshot is admitted.

The browser harness loads the exact final artifact bytes in a real module
Worker. Requests are intercepted in isolated headless contexts; it does not
use the current user tab, external services or a registry. It is **not a
Workbench UI test** and does not test a checkpoint transfer between engines or
between browser versions. Exact continuation here is scoped to the same
browser engine and artifact.

### Cross-engine readback, not a bit-equality claim

Chromium and WebKit produce different final checkpoint hashes. Across the two
tested conditions, the final completed-beat differences were at most2.63e−12
mmHg for pressure/gradient,9.24e−13 mL for volume,6.40e−14 L/min for flow and
7.54e−10 mmHg/s for pressure rate. Pressure-volume work is not included in the
volume unit group. No nonnumeric completed-beat differences were observed.
This short readback is consistent with floating-point implementation effects;
it is not a general cross-platform error bound or proof of long-run equivalence.
No solver change or new tolerance was introduced to force equal hashes.

The first artifact/browser run also passed but predates three additional
wrapper provenance guards. Its artifact SHA was `3e3575effd0c2b38d3c8623f3319cdc2654876ec22f5bd2f3e81eb1920c6da34`.
The final reports linked above were regenerated against the guard-containing
artifact; old passing results are not used as proof for changed bytes.

## Reproduction and preservation

Use this archival source revision and its lockfile. Restore the earlier selected
evidence bundle for the input paths, then choose **new** output directories:

The tested integration source is recorded in commit `7d647da5`; the tests and
reports were produced from those changes before that commit was created. This
note does not rewrite provenance fields in previously generated records.

```sh
npx vite-node --script tools/scientific/qualifyMainWireStandard72BindingV1.ts --output artifacts/standard72-cold-repeat --coarse artifacts/physiology-evaluation-2026-09-07/admission-coarse-confirmation-v1/same-material-TBV4935.result.json --admission artifacts/physiology-evaluation-2026-09-07/prospective-admission-candidate-v4.json
npx vite-node --script tools/scientific/verifyMainWireStandard72ArtifactBindingV1.ts --output artifacts/standard72-artifact-repeat
npx vite-node --script tools/scientific/verifyMainWireStandard72BrowserV1.ts --artifact artifacts/standard72-artifact-repeat/Standard72.artifact.mjs --evidence artifacts/standard72-artifact-repeat/artifact-binding.json --output artifacts/standard72-browser-repeat.json
```

The fresh checkpoint/report files, executable source, test and qualification
tools, compact final artifact report and full browser readback are preserved in
Git. The generated2.47 MB artifact and earlier v1/v2 local output directories
are not added to the old42 MB evidence bundle; their local copies remain intact.
A recorded artifact hash is not a backup of those bytes. Rebuild from the
archived source and verify the hash rather than silently treating any rebuild
as the measured artifact. The frozen71 documentation package is unchanged.

## Review and next boundary

The [scoped external review and primary adoption decision](standard72-adapter-review-astra-max.md)
are separate from the earlier core approval. Registration, publication,
Workbench UI, cross-engine continuation and general physiological validation
are outside this follow-up's qualification.

Next, extract only the current72 owner, required physical dependencies, inherited
Surface/analysis, reference evidence and regressions onto the production lane.
Resolve model-specific admission explicitly before executable publication or a
default switch. Do not copy the research branch's obsolete variants, old gate
assumptions or exploration tools wholesale. A72 document should reuse the
authoring modules and freeze a new package, not overwrite71. The existing
generic document-reader PR #614 remains independent and unmerged.
