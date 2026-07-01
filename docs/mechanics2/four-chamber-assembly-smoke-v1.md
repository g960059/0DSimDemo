# Four-Chamber Assembly Smoke V1

Status: MechanicsCore2 sidecar assembly smoke, not true four-chamber dynamics.

Artifacts:

- `data/mechanics2/reports/four-chamber-assembly-smoke-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runFourChamberAssemblySmokeBench.ts`

## Purpose

The assembly contract fixed the ledger that a later time-domain four-chamber
subsystem must own. This smoke executes that contract on the center and
best-neighborhood Gate C scaffolds and selects the cleaner scaffold for the
first time-domain sidecar assembly.

## Boundary

This smoke still reuses the established left/right/reservoir sidecar surfaces.
It is not runtime wiring, true four-chamber dynamics, morphology acceptance,
AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or clinical
validation.

## Result

Decision: `four-chamber-assembly-smoke-pass`.

- Reviewed scaffolds: center and best-neighborhood.
- Smoke pass: 2/2.
- Selected scaffold: `best-neighborhood-pressure047-gain014-cap35`.
- Selected mean absolute forward mismatch: ~5.13 mL.
- Selected max accepted transfer: ~1.77 mL.
- Selected max reservoir volume: ~19.45 mL.

This unlocks only the first time-domain sidecar four-chamber subsystem smoke.
Runtime/default wiring, AV-plane, LandAtrial, and morphology acceptance remain
blocked.
