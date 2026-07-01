# Circulation-Bridge Smoke V1

Status: measured MechanicsCore2 bridge smoke, not true closed circulation.

Artifacts:

- `data/mechanics2/reports/circulation-bridge-smoke-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runCirculationBridgeSmokeBench.ts`

## Purpose

The paired-heart smoke showed that the selected left and right sidecar
surfaces can pass side-by-side, but it did not couple their circulations. This
bench probes a minimal source-pressure feedback bridge:

- left surface: `active-length-mv-closure-stateful-root08`
- right surface: `right-heart-strategic-smoke-report-v1`
- bridge action: adjust left pulmonary venous source pressure and right
  systemic venous source pressure from left-minus-right forward ejection
  mismatch

This is intentionally not a blood-volume ledger. It is a cheap bridge smoke to
decide whether source-pressure feedback is a viable next coupling surface.

## Result

Decision: `no-go`

- Open-boundary reference: pass 5/7, morphology preserved 7/7, flow balanced
  5/7, mean absolute forward-ejection mismatch ~8.5 mL.
- Best feedback variant: `shared-source-pressure-feedback-gain020`.
- Best feedback variant reduces mean mismatch to ~6.4 mL, but pass falls to
  4/7 and morphology preserved falls to 4/7.
- Higher-gain variants reduce mismatch more aggressively but damage morphology
  further.

The signal is useful but negative: source-pressure feedback trades flow balance
against left/right subsystem morphology. It should not be promoted into a
four-chamber or runtime path.

## Boundary

This is not circulation coupling, runtime wiring, four-chamber readiness,
AV-plane readiness, LandAtrial readiness, morphology acceptance, or clinical
validation. It does not transfer blood volume between sides.

Next work should build an explicit reservoir/mass-ledger bridge and keep RV
pressure magnitude calibration provisional. The current RV pressure scale is a
sidecar calibration knob, not a geometry-derived PH/RV-failure-ready model.
