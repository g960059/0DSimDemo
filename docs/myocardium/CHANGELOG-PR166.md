# PR #166 changelog

This PR is docs/data-only and introduces myocardium planning updates after review.

## Initial addition

- Added ADR-MYO-002 for Phase 6 atrial bridge selection.
- Added atrial bridge v1 model spec.
- Added atrial bridge verification plan.
- Added Phase 5.5 atrial bridge shootout roadmap.
- Added atrial bridge protocol, target, pending decision and supplemental source data artifacts.

## Review delta addition

The follow-up PR review requested that Phase 2B / Level 3 accepted deltas also be captured in this docs/data PR.

Added:

- `data/myocardium/protocols/phase2b-mechanistic-report-fields-v1.json`
- `data/myocardium/protocols/level3-source-stress-transfer-gate-v1.json`
- `data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json`
- `data/myocardium/decisions/phase2b-level3-review-deltas-v1.json`
- `docs/myocardium/review-notes/phase2b-level3-review-deltas.md`
- `docs/myocardium/review-notes/README.md`

Captured requirements:

1. Phase 2B report fields for strain, lambda, `h(lambda)`, Ca absolute target vs amplitude, Ca/stress timing, CaT50 and Ca-at-stress-peak.
2. Clarification that `peakAmplitudeUM=0.9` with diastolic Ca `0.12 uM` implies an absolute target peak of approximately `1.02 uM`; measured `~1.016 uM` is not a 13% overshoot.
3. Level 3 source-stress transfer gate: `~37 kPa` source stress should transfer to expected `10–16 kPa` chamber-realized stress and `~120 mmHg` class morphology without `Tref` rescaling or free gain.
4. Land absolute-scale check against the intact-human reference/expected scale at the same lambda/Ca condition.
5. Layer-consistency gate for FWHM, time-to-peak, relaxation tau and Ca-to-stress delay through loaded single-chamber, partitioned coupling and closed loop.
6. Alternans policy: reproduce legacy activeStress alternans, check new myocardium under the same protocol, and require SDIRK2/equivalent second-order reference before robust no-alternans interpretation.
7. Atrial bridge cross-reference via ADR-MYO-002 and Phase 5.5 planning artifacts.

## Runtime behavior

No runtime TypeScript behavior changes are introduced by this PR.
