# Phase 5C-B Low-Preload Domain Extension Plan


> **Some paths below are retired.** This document names tools, tests, and
> artifacts from lanes that were removed from the working tree. They are
> recoverable from git history (`git show <commit>:<path>`); do not read
> them as commands you can run today.

## Context

Phase 5C-A added a deterministic Land shadow alternans comparator for the fixed
legacy activeStress low-preload period-2 VLV trajectory. At the start of
Phase 5C-B, the verifier passed as an artifact report, but its artifact gate
remained `FAIL/review` because the prescribed legacy LV volume reached
31.5227 mL while the selected thick-sphere-v2 LV calibration domain started at
50.0000 mL.

The immediate priority is still to replace the legacy active stress path with
Land evidence and then check morphology/no-alternans behavior. PR #166 also
adds a future Phase 5.5 atrial bridge shootout before Phase 6 closed-loop
interpretation, but it does not remove the Phase 5C-A ventricular low-preload
domain blocker.

## Recommended Default

Implement a narrow **Phase 5C-B selected-v2 low-preload domain extension gate**.

The PR should:

1. Add an explicit low-preload domain-extension verifier/report that computes
   the fixed Phase 5C-A legacy VLV envelope and checks the selected
   thick-sphere-v2 LV geometry over that envelope.
2. Extend the selected LV `sweepCavityVolumeMinM3` only if the gate records:
   finite geometry, finite derivative checks, finite pressure-map composition
   smoke, anchor-in-domain, deterministic hashes, and no change to runtime
   wiring or production claims.
   The PR must also assert that `anchorCavityVolumeM3` and
   `sweepCavityVolumeMaxM3` remain unchanged.
3. Re-run Phase 4D/5A/5B/5C-A gates, re-derive their calibration-readiness
   numbers, and update only the expected stable hashes whose payload
   legitimately includes the selected LV parameter-set domain. This is not a
   mechanical hash bump: the Phase 4D geometry samples and finite-difference
   midpoint consume `sweepCavityVolumeMinM3`, so the downstream numbers must be
   recomputed from a clean run.
4. Make Phase 5C-A's artifact gate transition from the current calibration
   domain `FAIL/review` to a readiness pass only if all prescribed legacy VLV
   samples are covered by the new explicit domain envelope.
5. Preserve all boundaries: no ModelCore wiring, no chamber/runtime/case wiring,
   no official morphology pass, no final robust no-alternans claim, no calcium
   cycling alternans claim, no RV pressure overload/interdependence/RHF claim,
   and no TriSeg adoption.

Recommended provisional LV lower bound: 30.0 mL (`3.0e-5 m3`), because it
covers the observed 31.5227 mL minimum with a small predeclared margin while
remaining positive and below the current 50.0 mL selected-domain floor. This
also matches the already selected RV lower sweep bound, so it is a narrow LV
domain-extension alignment rather than a novel backend family. The validation
should keep the observed legacy VLV minimum at least 1.0 mL above the extended
LV floor so future low-preload protocol drift fails with a direct margin
assertion instead of an opaque artifact-gate status change.

The parameter-set provenance should record that the lower floor comes from the
fixed Phase 5C-A low-preload legacy VLV envelope plus RV-domain parity, while
remaining calibration-readiness-only.

## Non-Goals

- Do not introduce closed-loop Land runtime replacement.
- Do not wire the selected mechanics path into `ModelCore`, cases, workbench, or
  official-case execution.
- Do not select or implement the Phase 5.5 atrial bridge.
- Do not claim official morphology acceptance or robust no-alternans.
- Do not validate RV pressure overload, septal bowing, ventricular
  interdependence, right-heart failure, or full TriSeg behavior.

## Required Test Updates

- Invert the Phase 5C-A Land shadow comparator test that currently preserves
  the calibration-domain artifactGate failure.
- Rename that test to describe domain-covered shadow replay readiness.
- Keep assertions that `newMyocardiumCheckStatus` remains
  `not-performed-not-satisfied`, `productionRuntimeStatus` remains
  `not-live-runtime-replacement`, `officialMorphologyPass` remains
  `not-claimed`, and `finalNoAlternansClaim` remains `not-claimed`.
- Add or update focused coverage for the selected LV 30 mL floor, unchanged LV
  anchor/max, finite derivative closure at the low-preload envelope, and
  pressure-map composition smoke.

## Validation Targets

- `npm run verify:myocardium-selected-mechanics-calibration-readiness`
- `npm run verify:myocardium-local-monolithic-coupling-readiness`
- `npm run verify:myocardium-local-monolithic-sdirk2-readiness`
- `npm run verify:myocardium-land-shadow-alternans-comparator-readiness`
- focused Phase 4D/5A/5B/5C-A vitest files
- `npx tsc --noEmit`
- `git diff --check`

## Review Questions

1. Is it acceptable to update the selected LV parameter-set domain in this
   narrow readiness-only phase, or should the phase first add a read-only
   domain-extension candidate without changing the selected parameter set?
2. Are the proposed checks sufficient to prevent a hidden production claim?
3. Should the Phase 5C-A artifact gate become pass after domain coverage, or
   should it retain a separate review status until a later closed-loop new
   myocardium check is implemented?
