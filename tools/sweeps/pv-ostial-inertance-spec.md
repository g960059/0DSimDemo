# PV Ostial Inertance Spec

This is the implementation handoff for the next bottleneck after the two-branch
LA reservoir. The two-branch LA model can produce `v > a` at normal LAV when the
pulmonary venous inflow edge keeps enough pulsatile impedance. Lowering the same
`PVein_LA.R` to achieve mean drop `<1 mmHg` short-circuits the end-systolic
`v` transient. The missing mechanism is separation of mean resistance from
pulsatile impedance.

## Mechanism

Current edge:

```txt
PVein -- R_mean_and_pulsatile --> LA
```

This couples two different requirements:

- Mean drainage should be easy: target mean `P_PVein - LAP < 1 mmHg`.
- Beat-to-beat pressure transients should not be instantly shorted back into the
  pulmonary-vein node: target `v/a 1.1-1.3` at LAV `50-58 mL`.

Use a low mean resistance plus an ostial inertance/damping element:

```txt
PVein -- R_ostial + L_ostial (+ B_ostial optional) --> LA
```

The inertance adds frequency-dependent impedance without adding steady pressure
drop. At steady flow, `L dq/dt = 0`, so mean drop remains governed mostly by the
low `R`. During IVR/reservoir recoil, `L dq/dt` resists abrupt flow changes, so
the LA `v` wave is not short-circuited.

This is a model abstraction for pulmonary venous ostial/entrance impedance and
near-LA flow inertia. It is not a new blood-volume compartment.

## Incremental Design

Do not mutate default `PVein_LA` behavior. Add a new optional dynamic edge path
behind a numeric gate:

```ts
pvOstialInertanceL?: number;  // default 0, disabled
pvOstialResistanceR?: number; // default existing PVein_LA.R when enabled
pvOstialQuadraticB?: number;  // default 0, optional damping
```

Because runtime overrides are numeric-only, avoid string mode switches. Enabled
condition:

```ts
const pvOstialEnabled = (params.pvOstialInertanceL ?? 0) > 0;
```

If disabled, keep the existing `PVein_LA` resistive edge exactly as-is and do
not allocate/read a new dynamic-flow state in any way that can affect results.

Recommended implementation options, in order:

1. Add `PVein_LA_dyn` as a new dynamic edge with the same `up/down`.
2. In `buildEdges()`, include either the legacy resistive `PVein_LA` or the new
   dynamic edge behavior through numeric parameters. If always adding a dynamic
   edge is simpler, keep the legacy resistive edge active and set the dynamic
   edge to zero-flow only when disabled; but the measured `PVF` must still be
   exactly the physical PVein-to-LA flow and neutral parity must pass.
3. Prefer keeping the edge name `PVein_LA` for downstream metrics if the index
   system can safely include it in `dynamicEdgeNames`. If that is too invasive,
   use `PVein_LA_dyn` internally and update the sample/debug flow lookup to use
   the active edge.

Codex2 should choose the lowest-risk path for the current index architecture.
The hard requirement is neutral parity when `pvOstialInertanceL = 0`.

## Dynamic Equation

Use the existing implicit dynamic-edge update:

```ts
qNext = (q + (dt / L) * (Pu - PdEff)) / (1 + (dt * (R + B * abs(q))) / L)
qDot = (qNext - q) / dt
```

For the ostial edge:

```txt
Pu = P_PVein
Pd = P_LA
R = pvOstialResistanceR or edge R
L = pvOstialInertanceL
B = pvOstialQuadraticB or 0
```

Do not apply pulmonary vascular resistance scaling to this edge unless an
explicit physiological reason is added later. It is local ostial impedance, not
distributed pulmonary vascular resistance.

No waterfall/collapsible behavior on this edge in the first pass. Upstream
pulmonary venous collapsibility is already represented by PCap/PVen/PVein.

## Parameter Seeds

Use the current two-branch LA near-candidate as the starting LA setup:

```txt
LA lambdaPas0 = 0.80
reservoirSleeveCompliance = 2.0
reservoirSleeveVuMl = 0
reservoirSleeveP0 = 0
reservoirStrokeMl = 20, 24, 28
reservoirBranchGain = 1
```

Ostial sweep:

```txt
pvOstialResistanceR = 0.01, 0.015, 0.02
pvOstialInertanceL = 0, 0.001, 0.002, 0.004, 0.008
pvOstialQuadraticB = 0 first; then 1e-5, 3e-5 only if damping is needed
dt = 0.001 first; then dt = 0.0005 for the best candidates
```

Interpretation:

- If `L=0`, behavior must match the current low-R resistive runs.
- Increasing `L` should raise `v/a` without raising mean drop much.
- If `L` must be so high that oscillations or dt sensitivity appear, add small
  `B` damping before changing LA passive/active again.

## Required Metrics

Add debug/sample outputs:

```ts
PVFOstial?: number;          // physical PVein->LA flow, same semantic as PVF
PVeinLADropMean?: number;    // measured/probe metric is enough if not sample
pvOstialQ?: number;          // dynamic q if separate from PVF
pvOstialInertialDrop?: number; // L * dq/dt, diagnostic if easy
pvOstialResistiveDrop?: number; // R * q + B*q*abs(q), diagnostic if easy
```

At minimum, `PVF`, `P_PVein`, `LAP`, and the dynamic q state must be enough for
the sweep to compute mean drop, pulsatile drop, and dt sensitivity.

## Neutral Gates

With `pvOstialInertanceL = 0` or omitted:

- Full official suite remains green (`106/106` current target).
- Stroke-zero/two-branch-neutral sample parity: pressures, flows, chamber
  volumes, TBV, health, `PVF`, and pulmonary venous group balances unchanged
  within existing neutral tolerance.
- No extra dynamic state may create nonzero flow, TBV drift, or changed
  `PVein_LA` accounting while disabled.
- Existing probes that set only `PVEIN_LA_R` must continue to work.

## Positive Gates At TBV5600

Use the two-branch LA candidate plus ostial sweep. A passing point must satisfy:

- `vPeak > aPeak`, target `v/a 1.1-1.3`.
- LAV max `50-58 mL`; exploratory upper bound `60 mL` only for diagnosis.
- Mean `P_PVein - LAP < 1 mmHg`.
- `vPeak` `12-15 mmHg`, `aPeak` `10-12 mmHg` after active/passive final touch.
- Pressure `a` peak timing `90-130 ms` after ventricular phase zero.
- `v` peak near end-systole/AoV-close-adjacent and before/near MV opening.
- LA pressure morphology still has `c -> x' -> v -> y`.
- PVF S/D/Ar plausible. Inertance must not create ringing or large nonphysical
  reverse flow.
- `projectorQuiet == true`, venous residual `<0.05 mL`, correction
  `<0.05 mL/beat`, TBV drift `<0.05 mL`, `clamps0`, structural CO diff near
  zero, and physical mass accounting unchanged.

## Numerical Stability Gates

For the best TBV5600 candidate:

- Re-run `dt=0.001` and `dt=0.0005`; key metrics should be stable:
  `v/a` within `~0.03`, LAVmax within `~1 mL`, mean drop within `~0.1 mmHg`,
  no new residual/clamp issues.
- Dynamic q should not saturate at the generic flow clamp.
- If oscillation appears, first add small `B` damping; do not fix ringing by
  increasing mean `R` above the `<1 mmHg` drop budget.

## Scale Gates

After TBV5600 passes:

- Re-run TBV `4800, 5600, 6200`.
- Preserve physical pulmonary split quietness and structural CO-diff behavior.
- Run official and pathological case quiet/residual/clamp gates.
- Only then proceed to RA co-refit.

## Stop Conditions

Stop and revisit formulation if:

- `L` raises mean drop above `1 mmHg` before `v/a` reaches `1.1`.
- `v/a` improvement requires obvious PVF ringing or large reverse flow.
- `dt=0.0005` materially changes the result from `dt=0.001`.
- Neutral parity fails when `L=0`.
- The best point still needs LAV above `60 mL`.

If these occur, the next mechanism is not more tuning of a single edge; it is a
small pulmonary-vein ostial sub-branch with compliance plus inertance, or a
nonlinear sleeve law that is soft at low volume and stiffer only at the
end-systolic reservoir limb.
