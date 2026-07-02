# Preload-Low Reservoir Numerics Scan V1

Status: MechanicsCore2 sidecar scan for the four-chamber subsystem
`preload-low` residual.

Artifacts:

- `data/mechanics2/reports/preload-low-reservoir-numerics-scan-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runPreloadLowReservoirNumericsScanBench.ts`

## Purpose

The four-chamber subsystem residual review found two `preload-low` problems:

- `dt-half` loses left and right surface preservation.
- `long-epochs` grows a persistent reservoir shuttle.

This scan tests whether reservoir transfer gain and venous compliance can fix
those residuals without using profile-specific oracle transfer.

## Boundary

This is a sidecar scan only. It is not runtime wiring, true four-chamber
dynamics, morphology acceptance, AV-plane readiness, LandAtrial readiness,
CircAdapt equivalence, or clinical validation.

## Result

Decision: `preload-low-reservoir-numerics-scan-blocked`.

- Scanned candidates: 18.
- Preload-low all-scenario pass candidates: 0.
- Validated candidates: 3.
- Full-envelope pass candidates: 0.
- Best validated candidate: `gain06-compliance50`.
- Best full-envelope pass count: 18/21.
- Best max reservoir volume: ~12.56 mL.

The scan is informative but negative. Lower gain and lower compliance can bound
the long-epoch reservoir volume, but every top candidate still fails
`dt-half/preload-low` through left and right surface preservation. This points
away from reservoir gain/compliance tuning and toward `dt-half` source-surface
or subsystem numerics ownership.
