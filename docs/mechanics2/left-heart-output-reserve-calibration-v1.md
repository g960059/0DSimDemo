# Left-Heart Output-Reserve Calibration V1

Status: measured Gate B calibration surface, not model acceptance.

Artifacts:

- `data/mechanics2/reports/left-heart-output-reserve-calibration-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runLeftHeartOutputReserveCalibrationBench.ts`

## Question

The pulmonary-boundary gate showed that finite PV nodes are broad no-go
surfaces, while high-drive semilunar/root plus reduced lower-bound safety
suction can locally rescue the high-contractility point. This bench asks whether
that component signal can become a broad left-heart Gate B calibration without
right-heart, four-chamber, or LandAtrial work.

## Result

Best strict surface:
`static-output-reserve-broad5`

| Surface | Pass | LV PV OK | MVF OK | Output OK | dt Stable | Flow coupled | Clamp free |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `v2-fixed2-soft-baseline` | 3/7 | 7/7 | 6/7 | 3/7 | 7/7 | 6/7 | 7/7 |
| `semilunar-loss2-root-runoff70` | 4/7 | 6/7 | 5/7 | 6/7 | 5/7 | 7/7 | 6/7 |
| `static-output-reserve-broad5` | 5/7 | 6/7 | 5/7 | 6/7 | 7/7 | 7/7 | 6/7 |
| `active-length-blend-lv7` | 4/7 | 7/7 | 5/7 | 6/7 | 6/7 | 7/7 | 6/7 |
| `active-length-blend-mvf6` | 4/7 | 7/7 | 4/7 | 6/7 | 7/7 | 7/7 | 7/7 |
| `bernoulli-high-no-clamp` | 4/7 | 6/7 | 4/7 | 6/7 | 7/7 | 7/7 | 7/7 |
| `prior-local-high-rescue` | 1/7 | 7/7 | 4/7 | 1/7 | 7/7 | 7/7 | 7/7 |

The positive signal is real but bounded:

- static output-reserve calibration improves strict pass count from 3/7 to 5/7;
- output OK improves to 6/7 while keeping `dt/2` stability 7/7 and flow coupling
  7/7;
- external active-length blending can reduce some high-drive clamp/pressure
  burden, but does not beat the broad static surface and does not remove the
  high-contractility MVF kink.

The remaining blockers are still left-heart Gate B blockers:

- `left-heart-contractility-low` remains low-output or loses biphasic MVF under
  static calibration;
- `left-heart-contractility-high` remains MVF-kink/overpressure/clamp-limited
  under static calibration.

## Decision

Continue left-heart Gate B work. The result is strong enough to keep
MechanicsCore2 moving, but not enough to unlock right-heart, four-chamber, or
LandAtrial work. The next model surface should handle high-drive reserve
dynamically in the chamber-load contract rather than relying on fixed
semilunar/root/fiber scaling.

## Claim Boundary

Not claimed:

- runtime/default wiring;
- morphology acceptance;
- output-reserve acceptance;
- right-heart or four-chamber unlock;
- LandAtrial unlock;
- CircAdapt equivalence.
