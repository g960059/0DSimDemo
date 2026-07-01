# Paired-Heart Strategic Smoke V1

Status: measured paired left/right MechanicsCore2 sidecar smoke, not coupled
circulation or four-chamber acceptance.

Artifacts:

- `data/mechanics2/reports/paired-heart-strategic-smoke-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runPairedHeartStrategicSmokeBench.ts`

## Purpose

This bench pairs the passed single-side Gate B surfaces without yet coupling
the circulations:

- Left: `active-length-mv-closure-stateful-root08` from
  `left-heart-dynamic-reserve-contract-report-v1`
- Right: `right-heart-strategic-smoke-report-v1`

The point profiles are matched as normal HR75/90, preload low/high, afterload
high, contractility low/high. The afterload profile maps to systemic afterload
on the left and pulmonary afterload on the right.

## Result

- Paired pass: 7/7
- Left pass: 7/7
- Right pass: 7/7
- Accepted phenotype count: 1

The accepted phenotype is the owner-approved left-heart clean
low-contractility low-output point. The right-heart low-contractility point
passes without a phenotype override.

## Boundary

This is not circulation coupling. It does not claim runtime wiring, four-chamber
integration, AV-plane release readiness, LandAtrial readiness, or clinical
validation. It only supports the next coupled circulation-bridge smoke.
