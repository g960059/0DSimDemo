# LA Reservoir Neutral And Stage-2 Gates

This note fixes the read-only expectations for codex2's neutral AV-plane
reservoir implementation and the first reservoir-only sweep. It is intentionally
limited to probe criteria; it is not the final LA/RA refit.

## Stage 0: Stroke-Zero Neutral Test

Run after the reservoir state exists, with all reservoir defaults disabled:

- `reservoirStrokeMl = 0` or omitted must be behavior-neutral.
- `r_LA` must remain exactly `0` and finite for the whole run.
- LA pressure must be evaluated at the physical LA volume when stroke is zero:
  `V_LA_eff == VLA`.
- Physical LA volume, TBV accounting, venous group accounting, and every flow
  equation must ignore `r_LA`.

Expected checks:

- Official suite remains green (`vitest` unchanged, currently 100/100 target).
- Baseline probes at TBV `4800,5600,6200` reproduce the pre-reservoir C=4.8
  candidate within numeric noise.
- Strict single-step/sample parity target: pressures, flows, physical volumes,
  `TBV`, and health are equal within `1e-6` when comparing stroke-zero against
  the same params without reservoir code.
- Settled metric parity target: `abs(delta)` below `0.001` for mean pressures
  and CO, below `0.01 mL` for chamber volumes, and no new clamps.
- `projectorQuiet` remains true with the existing integer-beat measurement:
  venous residual `<0.05 mL`, correction `<0.05 mL/beat`, TBV error `<0.05 mL`.

Neutral failure signals:

- Any nonzero `r_LA` when stroke is zero.
- Any TBV or venous residual change attributable to `r_LA`.
- Any LV/LA clamp introduced by the extra state.
- Any official-case snapshot drift before enabling nonzero stroke.

## Stage 2: Reservoir-Only Sweep

Purpose: prove the AV-plane coordinate creates reservoir mechanics before
passive/active LA refit. Hold all non-reservoir params fixed except the already
approved pulmonary split:

- PCap/PVen/PVein compliance: `Ccoll/Copen/Cdist = 2.4/4.8/2.4`.
- Keep current LA/RA passive and active parameters.
- Keep `PVein_LA.R` at its current value for this isolated stage.
- Sweep `reservoirStrokeMl = 0,5,10,15,20`.
- Start with `reservoirTauFillSec=0.10`, `reservoirTauRecoilSec=0.15`,
  `reservoirReleaseTheta=0.55`.
- TBV set: `4800,5600,6200`.

Hard safety gates for every stroke and TBV:

- `r_LA` is bounded in `[0, reservoirStrokeMl]`.
- `projectorQuiet == true` by the same Stage-0 criteria.
- `health.clampHitCount == 0`.
- Net left/right CO mismatch remains structural noise, target `<0.01 L/min`.
- Physical `VLA`, `TBV`, and venous group balances count blood only, never
  reservoir displacement.

Mechanism gates, evaluated versus stroke-zero at the same TBV:

- Late-systolic LA `vPeak` increases monotonically with stroke.
- `vPeak / aPeak` increases monotonically with stroke.
- LA reservoir loop area increases monotonically with stroke.
- PVF systolic component (`S`) increases with stroke.
- LA loop gains nonzero hysteresis/figure-8 tendency; at practical stroke
  `15-20 mL`, reservoir limb width should be at least `~1.5 mmHg` or clearly
  larger than stroke-zero.
- `aPeak` timing and booster amplitude should not be the main source of the
  v-wave change; reservoir stroke should primarily move the late-systolic limb.

Reservoir-only pass target:

- At TBV `5600`, stroke `15-20 mL` should produce `v > a` or at minimum a
  clear monotonic approach with no safety regression.
- Prefer `vPeak - aPeak >= 1 mmHg` in this isolated stage. The final target
  `vPeak - aPeak ~4-6 mmHg` belongs to the combined reservoir + LA refit.
- LAV max should remain in the plausible band, roughly `45-60 mL`; do not
  accept a reservoir-only sweep that creates LA collapse or ballooning.
- PVF should show a stronger systolic forward component. Ar may remain weak
  until LA active refit, but must not disappear because of a safety issue.

Stop conditions:

- Stroke increases `aPeak` more than `vPeak`.
- Stroke worsens projector quietness or introduces clamps.
- Stroke creates TBV drift without flow-accounting cause.
- Reservoir loop remains a near-line through `20 mL`; then adjust gate timing
  (`releaseTheta` / valve-based release) before touching LA active/passive
  parameters.

## Metrics To Add To `measure.ts`

These are the read-only outputs needed before final refit:

- Ca pulse onset theta/ms for LA and RA.
- Active-state peak theta/ms (`aLA`, `aRA`) for LA and RA.
- Local pressure a-wave peak theta/ms and pressure for LAP/RAP.
- Late-systolic v-wave peak theta/ms and pressure for LAP/RAP.
- MV/TV closure theta/ms.
- LV/RV max dP/dt theta/ms.
- Lead measurements: pressure a-peak to ventricular dP/dt max, and pressure
  a-peak to AV valve closure.
- PVF S, D, and Ar components.
- LA loop self-intersections, reservoir-loop area, booster-loop area, and
  reservoir-limb hysteresis width.

All timing values should be reported relative to ventricular phase zero. Keep
`atrialLeadSec` interpreted as electrical/mechanical activation onset lead, not
as pressure a-wave peak lead.

## IVR-Gated Recoil Spec For Codex2

The first reservoir implementation proved that the `r_LA` state is neutral at
stroke zero and creates LA loop hysteresis, but it does not create a v-wave. The
mechanism needs valve-state timing: the v-wave should come from rapid annular
recoil while the LA is full and both left valves are closed.

Physiology model:

- LV ejection / AoV open: AV-plane descent increases LA capacity, lowers LAP,
  raises PV-to-LA filling gradient, and stores pulmonary venous return in the
  physical LA volume.
- IVR / AoV closed and MV closed: annular recoil rapidly removes that capacity.
  Physical `VLA` is still near max, so `V_LA_eff = VLA - r_LA` jumps upward as
  `r_LA` falls. This is the late-systolic/IVR v-wave.
- MV open: keep `r_LA` near zero so LA empties normally into LV, giving y
  descent. Do not carry reservoir displacement into diastolic conduit/booster.

### Context Fields

Add optional chamber context fields:

```ts
type ChamberCtx = {
  // existing fields...
  lvVolumeMl?: number;
  lvShortening01?: number;
  mvOpen01?: number;
  aovOpen01?: number;
};
```

Source of valve openness:

- `mvOpen01 = clamp(xi_MV, 0, 1)`.
- `aovOpen01 = clamp(xi_AoV, 0, 1)`.
- Use the dynamic valve state, not raw pressure gradient, so the gate tracks the
  actual solver state.

Fallback behavior:

- If `mvOpen01`/`aovOpen01` are absent, fall back to the current phase gate only
  for experiments. The production path should pass valve openness from
  `ModelCore.chamberCtx`.

### New Parameters

Keep existing names for compatibility:

```ts
reservoirStrokeMl: 0,          // disabled by default, neutral
reservoirTauFill: 0.10,        // descent during ejection, range 0.08-0.12
reservoirTauRecoil: 0.15,      // fallback slow recoil only
reservoirReleaseTheta: 0.55,   // fallback only
```

Add:

```ts
reservoirTauRecoilIVR: 0.03,   // rapid recoil in IVR, range 0.02-0.04
reservoirValveThreshold: 0.15, // open/closed threshold for xi gates
```

Optional later knobs, not required for the first pass:

```ts
reservoirHoldTau: 0.20,        // if a hold mode is needed after AoV closes
reservoirRecoilAfterAoV: true, // explicit mode flag if desired
```

### Gate Definitions

Let:

```ts
const stroke = max(ap.reservoirStrokeMl ?? 0, 0);
const r = clamp(internal.r, 0, stroke);
const th = ap.reservoirValveThreshold ?? 0.15;
const mvOpen = clamp(ctx.mvOpen01 ?? 0, 0, 1);
const aovOpen = clamp(ctx.aovOpen01 ?? 0, 0, 1);
const mvClosed = mvOpen <= th;
const aovOpenGate = aovOpen > th;
const aovClosed = aovOpen <= th;
const ivrGate = aovClosed && mvClosed;
const diastolicGate = mvOpen > th;
const descentTarget = stroke * clamp(ctx.lvShortening01 ?? 0, 0, 1);
```

Desired precedence:

1. If `stroke <= 0`: `target = 0`, `rDot = 0`. This must preserve exact
   stroke-zero neutrality.
2. If `diastolicGate`: `target = 0`, `tau = reservoirTauRecoilIVR`.
3. Else if `ivrGate`: `target = 0`, `tau = reservoirTauRecoilIVR`.
4. Else if `aovOpenGate && mvClosed`: `target = descentTarget`,
   `tau = reservoirTauFill`.
5. Else: hold or gently decay toward current value. First pass:
   `target = r`, `tau = reservoirTauRecoil` so no unintended phase release.

The diastolic and IVR branches both target zero. The key distinction is that
IVR happens before MV opens, so the rapid recoil creates pressure while VLA is
still near maximum. Once MV opens, the same zero target keeps the capacity
coordinate out of the y-descent/conduit phase.

Reference implementation:

```ts
function reservoirRDot(ap: ActiveChamberParams, internal: ChamberInternal, ctx: ChamberCtx) {
  const stroke = Math.max(ap.reservoirStrokeMl ?? 0, 0);
  if (stroke <= 0) return 0;

  const r = clamp(internal.r, 0, stroke);
  const th = ap.reservoirValveThreshold ?? 0.15;
  const mvOpen = clamp(ctx.mvOpen01 ?? 0, 0, 1);
  const aovOpen = clamp(ctx.aovOpen01 ?? 0, 0, 1);
  const mvClosed = mvOpen <= th;
  const aovClosed = aovOpen <= th;
  const descentTarget = stroke * clamp(ctx.lvShortening01 ?? 0, 0, 1);

  let target = r;
  let tau = ap.reservoirTauRecoil ?? 0.15;

  if (mvOpen > th) {
    target = 0;
    tau = ap.reservoirTauRecoilIVR ?? 0.03;
  } else if (aovClosed && mvClosed) {
    target = 0;
    tau = ap.reservoirTauRecoilIVR ?? 0.03;
  } else if (aovOpen > th && mvClosed) {
    target = descentTarget;
    tau = ap.reservoirTauFill ?? 0.10;
  }

  return clamp(
    (target - r) / Math.max(tau, 1e-3),
    -stroke / 0.01,
    stroke / 0.02,
  );
}
```

Clamp rationale:

- Faster negative bound allows IVR recoil over `~20-40 ms`.
- Positive bound remains slower, consistent with descent/filling over ejection.
- `sanitizeState` must clamp `r` into `[0, reservoirStrokeMl]` and count no node
  clamp for this internal reservoir bound.

### Required Neutral Tests

- With omitted reservoir params and with explicit `reservoirStrokeMl: 0`, full
  suite remains green (`102/102` target).
- Stroke-zero sample parity against pre-reservoir behavior: pressures, flows,
  physical volumes, `TBV`, `rLA`, and health unchanged within existing neutral
  test tolerance.
- `rLA == 0` for the entire stroke-zero run.
- `rRA == 0`; reservoir remains LA-only unless explicitly configured later.

### Required Positive Tests

With `reservoirStrokeMl > 0`:

- During ejection (`aovOpen01 > threshold`, `mvOpen01 <= threshold`), `rLA`
  rises toward `stroke * lvShortening01`.
- During IVR (`aovOpen01 <= threshold`, `mvOpen01 <= threshold`), `rLA` falls
  rapidly toward zero before MV opens.
- `VLA` and `TBV` remain physical blood-volume states; changing `rLA` must never
  directly alter mass.
- At fixed passive/active params, increasing stroke should increase the
  late-systolic/IVR v-wave pressure or at minimum create a visible recoil-linked
  pressure bump. If vPeak still decreases monotonically, the gate is not yet
  implementing the intended physics.

### Sweep Expectations After Implementation

Re-run `tools/sweeps/reservoir-only-sweep.ts`:

```sh
env TBVS=4800,5600,6200 STROKES=0,5,10,15,20 SAMPLE_HZ=1000 \
  npx tsx tools/sweeps/reservoir-only-sweep.ts
```

Expected improvement versus phase-gated recoil:

- `vPeak` should increase with stroke or show a clear recoil-linked late
  systolic/IVR bump.
- `vPeak / aPeak` should increase with stroke.
- `PVF` systolic filling and LA loop area should remain monotone/non-regressed.
- `projectorQuiet`, `clamps0`, `TBV drift 0`, and `rLA` bounds still pass.
- Only after these pass should Stage 3 LA passive/active refit resume.
