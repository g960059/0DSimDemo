# MechanicsCore2 Left-Heart Outflow Repair V1

Status: measured Gate B repair surface, not model acceptance.

This report tests whether semilunar/root outflow ownership can repair the
`v2-fixed2-soft` residuals from the left-heart architecture V2 surface. It adds
two guards that the previous residual report did not own:

- beat-to-beat repeatability, using the previous and final measured beats;
- `dt/2` sensitivity, using a 480 Hz rerun against the default 240 Hz run.

Artifact:
`data/mechanics2/reports/left-heart-outflow-repair-report-v1.json`

Runner:
`npx vite-node --script tools/mechanics2/runLeftHeartOutflowRepairBench.ts`

## Result

Best measured surface:
`semilunar-loss2-root-runoff70`

| Surface | Pass | LV PV OK | MVF OK | Output OK | Repeatability OK | dt Stable | Flow coupled | Clamp free |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `v2-fixed2-soft-baseline` | 3/7 | 7/7 | 6/7 | 3/7 | 5/7 | 7/7 | 6/7 | 7/7 |
| `semilunar-loss2` | 2/7 | 7/7 | 4/7 | 3/7 | 6/7 | 7/7 | 6/7 | 7/7 |
| `semilunar-loss4` | 1/7 | 7/7 | 3/7 | 4/7 | 6/7 | 6/7 | 7/7 | 7/7 |
| `semilunar-loss2-root-runoff70` | 4/7 | 6/7 | 5/7 | 6/7 | 7/7 | 5/7 | 7/7 | 6/7 |
| `semilunar-loss4-root-runoff70` | 3/7 | 7/7 | 5/7 | 5/7 | 7/7 | 6/7 | 7/7 | 6/7 |

The positive signal is bounded:

- adding faster root runoff to semilunar loss removes the large beat-to-beat
  AoV ejection alternans from the baseline surface;
- output coverage improves from 3/7 to 6/7 on the best surface;
- volume-derived stroke and forward AoV ejection become coupled on 7/7 points.

The negative signal remains blocking:

- high contractility still has MVF kink, dt sensitivity, and volume clamp hits;
- preload-low loses a clean biphasic MVF on the best surface;
- contractility-low remains low output;
- the best surface is therefore a repair direction, not an adoption candidate.

## Decision

Continue left-heart Gate B work, but do not unlock right-heart, four-chamber, or
LandAtrial work from this result. The result narrows the next model change to
semilunar/root outflow ownership rather than LA/LV active timing or atrial
parameter tuning.

The next left-heart phase should replace scalar semilunar/root variants with a
structured outflow contract that can preserve:

- LV PV shape;
- MVF E/A morphology;
- forward AoV ejection;
- beat-to-beat repeatability;
- `dt/2` stability;
- clamp-free high-contractility behavior.

## Claim Boundary

Not claimed:

- runtime/default wiring;
- morphology acceptance;
- output-reserve acceptance;
- right-heart or four-chamber unlock;
- LandAtrial unlock;
- CircAdapt equivalence.
