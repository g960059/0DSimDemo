# Sweeps and Read-Only Probes

Scripts in this directory are reproducible measurement probes. They should use
the shared steady-state measurement helpers once `engine/measure.ts` lands.

- `tbv-physical-split.ts` is the canonical Option1 TBV sweep. It uses
  `measureConverged()` with integer-beat windows and reports settled status,
  projector quietness, net vs forward CO, atrial loop features, venous residuals,
  clamps, and TBV drift.
- `reservoir-only-sweep.ts` is the Stage-2 AV-plane reservoir-only probe. It
  sweeps `reservoirStrokeMl` at fixed C=4.8 pulmonary split and reports
  v/a peaks, PVF S/D/Ar, LA loop area, hysteresis, quietness, and volume/pressure
  safety gates.
- `reservoir-neutral-and-stage2-gates.md` records the stroke-zero neutral
  expectations and reservoir-only pass/fail criteria.
- Older read-only search probes are kept for provenance. Do not delete reusable
  probes without first asking lead whether they should be crystallized into a
  committed harness.
