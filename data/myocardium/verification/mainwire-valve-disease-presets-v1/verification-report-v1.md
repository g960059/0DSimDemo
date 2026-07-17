# Main-wire valve-disease presets V1: verification report

## Scope

This report records a bounded feasibility check of the quasi-steady four-valve
disease model. It is not a clinical validation or a patient fit. The vascular
system is not yet finally calibrated, so area seeds and all load-dependent
outputs remain provisional. No chamber, vascular, Land, calcium, pericardial,
or leaflet-kinetic parameter was fitted to a disease waveform.

The canonical valve has one bounded leaflet-opening memory state and an
algebraic signed loss law

$$
\Delta P=R_{legacy}Q+B(A)Q|Q|.
$$

Clinical EOA/EROA enters only through $B(A)$. The fixed linear term is a legacy
main-wire series-loss prior, not a literature-derived valve resistance. Root
inertance remains at Ao--SA and PA--PArt; no valve bulk-flow inertance was added.

## Reference runs at dt = 2 ms

All listed runs started from the canonical initial condition, used the same
fixed total-blood-volume owner and the same circulation, mechanics, calcium,
and pericardium parameters, and stopped only after three consecutive period-1
closures or failure. All 17 retained cases converged without integration
failure in 24--33 beats. The maximum AoV--PV net stroke mismatch among the nine
reference cases below was 0.059 mL/cycle. The largest target-valve hydraulic
power residual was $1.1\times10^{-11}$ mmHg mL/s.

| case | target | CO (L/min) | MAP (mmHg) | Vmax (m/s) | mean $4v^2$ (mmHg) | RF (%) | RVol (mL) |
|---|---|---:|---:|---:|---:|---:|---:|
| healthy | AoV | 5.313 | 88.48 | 2.05 | 8.71 | 0 | 0 |
| AS-moderate research bracket | AoV | 5.125 | 85.53 | 3.70 | 38.51 | 0 | 0 |
| AR-moderate research bracket | AoV | 4.209 | 72.08 | 2.54 | 12.63 | 43.0 | 53.0 |
| MS-moderate research bracket | MV | 5.211 | 86.89 | 1.67 | 5.54 | 0 | 0 |
| MR-moderate research bracket | MV | 5.021 | 83.95 | 1.10 | 1.48 | 28.2 | 32.9 |
| TS-moderate research bracket | TV | 4.789 | 81.54 | 1.40 | 3.06 | 0 | 0 |
| TR-moderate research bracket | TV | 5.028 | 84.61 | 0.49 | 0.30 | 19.3 | 20.1 |
| PS-moderate provisional bracket | PV | 4.238 | 73.32 | 3.47 | 26.60 | 0 | 0 |
| PR-moderate provisional bracket | PV | 5.018 | 84.38 | 1.81 | 4.72 | 29.3 | 34.6 |

`mean 4v^2` is the accepted-sample time mean during positive target-valve flow,
not catheter peak-to-peak gradient and not the modeled node-to-node gradient.
RF is same-valve reverse volume divided by forward volume. These outputs are
reported without a clinical pass/fail judgment.

Positive controls preserved the intended direction of response:

- AS-severe: EOA 0.80 cm2, Vmax 4.54 m/s, peak $4v^2$ 82.5 mmHg.
- AR-severe: EROA 0.35 cm2, RF 56.0%, RVol 76.8 mL.
- MR-severe: EROA 0.45 cm2, RF 40.0%, RVol 52.7 mL.
- TR-severe: EROA 0.50 cm2, RF 27.3%, RVol 30.3 mL.
- PS provisional mild/moderate/severe: Vmax 2.52/3.47/3.95 m/s.
- PR provisional mild/moderate/severe: RF 10.8/29.3/43.5%.

PS-severe remained just below the conventional 4 m/s boundary. It was not
iteratively forced across that boundary because vascular calibration is still
pending. The PS/PR values show that an area-only ordered preset is feasible;
they must be revalidated after vascular and operating-point calibration.

## Pathological event availability

AR-severe converged and retained valid hemodynamics, conservation, and valve
metrics, but had only one MV forward-flow interval (phase 0.356--0.580). No
post-atrial-onset MV closing transition existed after atrial calcium onset at
phase 0.852. The summary therefore records
`mitral-closing-transition-after-atrial-onset-not-observed`, and sets the
event-dependent three-phase physiology and LA-PV morphology to `null`. It does
not fabricate a normal A-wave timing. This is a measurement-availability result,
not an integration failure.

## dt-halving from one shared checkpoint

Healthy and AS-severe each branched independently at dt=2 ms and dt=1 ms from
the same converged dt=2 ms cycle-boundary checkpoint. Both branches reconverged
to period 1. No interpolation and no convergence-order claim were used.

| case | target readback | dt=2 ms | dt=1 ms | relative change |
|---|---|---:|---:|---:|
| healthy | AoV forward volume (mL) | 88.513 | 88.630 | +0.13% |
| healthy | AoV Vmax (m/s) | 2.049 | 2.044 | -0.24% |
| healthy | AoV peak $4v^2$ (mmHg) | 16.799 | 16.718 | -0.49% |
| AS-severe | AoV forward volume (mL) | 79.836 | 79.919 | +0.10% |
| AS-severe | AoV Vmax (m/s) | 4.540 | 4.547 | +0.15% |
| AS-severe | AoV peak $4v^2$ (mmHg) | 82.448 | 82.700 | +0.31% |

The largest fixed-scale pointwise difference was 0.080 for healthy PV opening
fraction and 0.173 for AS-severe AoV opening fraction, localized around sharp
valve events. The integrated/peak target readbacks above were much less
sensitive. No post-hoc numerical pass threshold was applied.

## R = 0 ablation

The isolated valve bench reduces exactly to the signed Bernoulli law when
$R_{legacy}=0$. In the closed loop, however, healthy stopped at 6.244 s after
six complete beats with Newton stagnation, and AS-severe stopped at 0.956 s at
the iteration limit. Thus no quantitative periodic R=0 sensitivity is claimed.
The result indicates that the fixed linear term also conditions the
$Q\propto\sqrt{|\Delta P|}$ zero-gradient singular slope in the current
monolithic finite-difference Newton solver. Keeping it is not evidence that its
value is physiologically calibrated.

## Reproduction boundary

Raw accepted-sample JSON is intentionally not committed. It can be regenerated
with, for example:

```bash
npx vite-node --script tools/myocardium/runMainWireNormalAdultFiveWallPeriodicSteadyV1.ts \
  --dt 0.002 --max-beats 64 --valve-disease MR-moderate --output /tmp/mr.json
npx vite-node --script tools/myocardium/measureMainWireValveDiseaseCycleMetricsV1.ts \
  --input /tmp/mr.json --output /tmp/mr-metrics.json
npx vite-node --script tools/myocardium/summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1.ts \
  --input /tmp/mr.json --output /tmp/mr-summary.json
```

The exact compact outputs in this directory retain protocol/preset hashes,
periodicity, conservation, loss decomposition, passivity, and phase-proxy
readbacks. The main scientific specification and primary references are in
`docs/myocardium/main-wire-valve-disease-presets-v1.md`.
