# AtrialFiberPack Prescribed-Volume V1

This bench adds the first MechanicsCore2 atrial fiber sidecar surface without
AV-plane geometry.

Report:

- `data/mechanics2/reports/atrial-fiber-pack-prescribed-volume-report-v1.json`

Result:

- Decision: `atrial-fiber-pack-prescribed-volume-signal`.
- Upstream source/reservoir contract signal is present.
- LA/RA prescribed-volume fixtures pass: 4/4.
- Pressure outputs are finite and bounded in low-pressure atrial ranges.
- LA peak pressure is ~10-11 mmHg; RA peak pressure is ~3 mmHg.
- Active pressure peaks remain late-diastolic in all fixtures.

Interpretation:

- LA/RA can be represented as CircAdapt-lite style one-fiber chamber walls in
  an isolated prescribed-volume bench.
- This only unlocks a future AV-plane-off closed-loop atrial-fiber smoke.

Claim boundary:

- No runtime wiring.
- No closed-loop atria.
- No morphology acceptance.
- No AV-plane geometry.
- No piston-volume mode.
- No LandAtrial unlock.
