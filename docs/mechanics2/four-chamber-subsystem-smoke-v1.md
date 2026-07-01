# Four-Chamber Subsystem Smoke V1

Status: MechanicsCore2 sidecar epoch-level four-chamber subsystem smoke.

Artifacts:

- `data/mechanics2/reports/four-chamber-subsystem-smoke-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runFourChamberSubsystemSmokeBench.ts`

## Purpose

The assembly smoke selected `best-neighborhood-pressure047-gain014-cap35` for
the first time-domain sidecar four-chamber subsystem smoke. This smoke moves
the reservoir epoch loop into `FourChamberSubsystemV1`, then reruns the selected
and center scaffolds over the 7-point profile envelope.

## Boundary

This is still sidecar smoke evidence. It reuses the established left/right
subsystem surfaces and an epoch-level reservoir state. It is not live runtime
wiring, true four-chamber physiology acceptance, AV-plane readiness,
LandAtrial readiness, CircAdapt equivalence, or clinical validation.

## Result

Decision: `four-chamber-subsystem-smoke-pass`.

- Reviewed scaffolds: selected best-neighborhood and center.
- Smoke pass: 2/2.
- Selected scaffold: `selected-best-neighborhood-pressure047-gain014-cap35`.
- Selected mean absolute forward mismatch: ~5.13 mL.
- Selected max accepted transfer: ~1.77 mL.
- Selected max reservoir volume: ~19.45 mL.

This unlocks only time-domain four-chamber subsystem residual/numerics review.
Runtime/default wiring, AV-plane, LandAtrial, and morphology acceptance remain
blocked.
