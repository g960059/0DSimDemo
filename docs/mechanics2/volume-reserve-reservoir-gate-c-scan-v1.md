# Volume-Reserve Reservoir Gate C Scan V1

Status: measured MechanicsCore2 Gate C scaffold signal, not four-chamber readiness.

Artifacts:

- `data/mechanics2/reports/volume-reserve-reservoir-gate-c-scan-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runVolumeReserveReservoirGateCScanBench.ts`

## Purpose

The right-heart volume-reserve contract found a clean low-output RV candidate
that preserved the right-heart and paired surfaces, but the default stateful
reservoir variants still failed Gate C at `contractility-low`.

This bench fixes the RV volume-reserve family and scans a small stateful
reservoir set. It asks whether the remaining blocker is the specific reservoir
variant, or whether reservoir feedback fundamentally breaks the RV
volume-reserve surface.

## Result

Decision: `volume-reserve-reservoir-pass`

- Best RV candidate:
  `right-volume-reserve-rv-dilated520-tref-26000-safety-0.25-pressure-0.45`.
- Best reservoir variant: `vr-soft-cap4-gain012-comp80`.
- Gate C pass: 7/7.
- Morphology preserved: 7/7.
- Flow-balanced: 7/7.
- Reservoir ledger clean: 7/7.
- Per-epoch transfer bounded: 7/7.
- Persistent reservoir bounded: 7/7.
- Repeatable final state: 7/7.
- Max accepted transfer: ~1.5 mL.
- Max reservoir volume: ~17.5 mL.
- Max pulmonary/systemic pressure adjustment: ~0.22 / ~0.11 mmHg.

This is the first MechanicsCore2 Gate C scaffold signal where explicit
reservoir state, right-heart volume reserve, and the owner-approved low-output
phenotype coexist across the 7-point envelope.

## Boundary

This is not runtime wiring, true four-chamber coupling, morphology acceptance,
AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or clinical
validation.

The result unlocks a broader assembled-system review of the MechanicsCore2
Gate C scaffold. It does not yet unlock four-chamber, AV-plane, LandAtrial, or
runtime/default work.
