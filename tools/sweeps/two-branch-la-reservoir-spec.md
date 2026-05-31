# Two-Branch LA Reservoir Spec V2

This is the handoff spec for replacing the current LA reservoir pressure-offset
experiment with a physically separated left-atrial body plus pulmonary-vein
sleeve/reservoir branch. The goal is to break the single-P-V-curve coupling
that makes `a` and `v` waves rise together.

The "sleeve/reservoir" branch is a model abstraction for LA reservoir capacity
created by AV-plane descent and adjacent pulmonary venous compliance. It is not
intended to mean an anatomical pulmonary-vein muscle sleeve as a separate active
contractile chamber.

## Mechanism Conclusion

The current model uses one pressure-volume curve:

```txt
P_LA = P_body(VLA - rLA, active)
```

That gives only one stiffness slope. A larger reservoir recoil can only create a
larger `v` wave by moving along the same curve that also controls booster
pressure. Soft passive settings keep the `a` wave low but make `dP/dV` too small
and let LAV balloon. Hard passive settings control LAV and amplify the `v` wave,
but the same stiffness amplifies the `a` wave. This is a structural one-degree
of-freedom limit, not a sweep-space problem.

The replacement should separate the active LA body from a passive pulmonary
venous sleeve/reservoir branch:

```txt
VLA_total = V_body + V_reservoir
P_body(V_body, active) = P_reservoir(V_reservoir, q)
P_LA = common pressure
```

`q` is a capacity/unstressed-volume coordinate driven by AV-plane descent. It
does not add blood volume. Physical LA blood volume remains the node state and
must still equal the integral of `PVF - Q_MV`.

## Why This Is The Preferred Option

- It separates booster mechanics from reservoir mechanics. Body active stress
  sets the `a` wave; reservoir branch filling plus capacity recoil sets the `v`
  wave.
- It keeps mass accounting honest. The only physical LA volume state is still
  `VLA`; branch volumes are an algebraic partition of that volume.
- It lets soft LA-body passive parameters target a physiological `a` wave while
  the reservoir branch provides enough late-systolic pressure gain for `v > a`.
- It avoids sharp pressure-only jumps. `q` changes branch capacity, pressure
  changes drive flows, and the total-volume equation remains conservative.

References motivating the decomposition:

- Marino et al. 1994 define LA volume from the time integral of pulmonary
  venous inflow minus mitral outflow, which is exactly the mass-conservation
  invariant we should preserve.
- Carlsson et al. 2004 frame LA reservoir/conduit behavior through pulmonary
  venous and mitral flows and left-heart volume exchange.
- Hoit/review literature describes LA function as reservoir, conduit, and
  booster phases rather than one lumped chamber action.
- Recent mock-loop work shows LA compliance directly shapes the `a` and `v`
  pressure waves and pulmonary venous S/D behavior.

## Incremental Neutral Design

Add the new machinery behind a numeric branch gate. Defaults must remain
behavior-neutral. Do not use a string enum such as `reservoirModel: "twoBranch"`
as the enable switch because nested active overrides currently pass finite
numbers only; a string gate would be dropped by override sanitization and make
the branch impossible to enable from probes.

Recommended parameter additions to `ActiveChamberParams`:

```ts
reservoirBranchGain?: number;          // default 0: exact legacy path
reservoirStrokeMl?: number;            // max q capacity, default 0
reservoirSleeveVuMl?: number;          // unstressed sleeve volume, first seed 12
reservoirSleeveCompliance?: number;    // mL/mmHg, first seed 3.0
reservoirSleeveP0?: number;            // pressure offset, first seed 0
reservoirSleeveMinVolumeMl?: number;   // first seed 1
reservoirSleeveMaxVolumeMl?: number;   // diagnostic only, never a solver clamp
reservoirTauFill?: number;             // ejection capacity gain, first seed 0.10
reservoirTauRecoilIVR?: number;        // capacity return, first seed 0.035
reservoirValveThreshold?: number;      // default 0.15
```

Neutral condition:

```ts
const twoBranchEnabled =
  (ap.reservoirBranchGain ?? 0) > 0 &&
  (ap.reservoirStrokeMl ?? 0) > 0;
```

If `twoBranchEnabled` is false, `pressure()` must call the existing active-stress
pressure path with the physical chamber volume and return without branch solving.
`internalDerivatives()` must return `rDot = 0` for reservoir state. This exact
early return is what preserves stroke-zero/sample parity and the official suite.

## Pressure Formulation

Refactor the existing active-stress pressure body into a helper that does not
apply any reservoir offset:

```ts
private bodyPressure(VBodyMl: number, internal: ChamberInternal, ctx: ChamberCtx): number
```

Reservoir sleeve pressure for first pass:

```ts
function sleevePressure(VResMl: number, qMl: number, ap: ActiveChamberParams) {
  const Vu = ap.reservoirSleeveVuMl ?? 12;
  const C = Math.max(ap.reservoirSleeveCompliance ?? 3.0, 0.25);
  const P0 = ap.reservoirSleeveP0 ?? 0;
  const Veff = Math.max(VResMl - Vu - qMl, -C * 5);
  return clamp(P0 + Veff / C, -5, 80);
}
```

Use linear sleeve compliance first. If it causes excessive high-volume
distension, add a soft nonlinear limb later; do not add that complexity before
proving the split.

Solve `P_body(VBody) = P_sleeve(VLA - VBody, q)` by bracketed bisection. The
solver must preserve exact volume partitioning: in every normal and fallback
path, `VBody + VReservoir == VLA` to floating-point precision. Do not use
`max(VLA - VBody, sleeveMin)` inside the valid bracket because that silently
creates volume.

```ts
type BranchSolveFlag = "ok" | "lowVolumeConstrained" | "unbracketedEndpoint";

function twoBranchState(VLA: number, internal: ChamberInternal, ctx: ChamberCtx) {
  const qMax = Math.max(ap.reservoirStrokeMl ?? 0, 0);
  const q = clamp(internal.r, 0, qMax) * (ap.reservoirBranchGain ?? 1);
  const sleeveMin = ap.reservoirSleeveMinVolumeMl ?? 1;
  const bodyMin = ap.V0 + ap.Vmin;

  const finalize = (vb: number, flag: BranchSolveFlag) => {
    const vBody = clamp(vb, 0, Math.max(VLA, 0));
    const vRes = VLA - vBody;
    const pBody = bodyPressure(vBody, internal, ctx);
    const pRes = sleevePressure(vRes, q, ap);
    return {
      p: clamp(0.5 * (pBody + pRes), -5, 260),
      vBody,
      vRes,
      pBody,
      pRes,
      equilibriumError: pBody - pRes,
      flag,
    };
  };

  if (VLA < bodyMin + sleeveMin) {
    const weight = bodyMin / Math.max(bodyMin + sleeveMin, 1e-9);
    return finalize(VLA * weight, "lowVolumeConstrained");
  }

  let lo = bodyMin;
  let hi = VLA - sleeveMin;
  const f = (vb: number) => bodyPressure(vb, internal, ctx) - sleevePressure(VLA - vb, q, ap);
  const fLo = f(lo);
  const fHi = f(hi);

  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo > 0 || fHi < 0) {
    return finalize(Math.abs(fLo) <= Math.abs(fHi) ? lo : hi, "unbracketedEndpoint");
  }

  for (let i = 0; i < 32; i++) {
    const mid = 0.5 * (lo + hi);
    if (f(mid) >= 0) hi = mid;
    else lo = mid;
  }

  return finalize(0.5 * (lo + hi), "ok");
}
```

The expected normal case is monotone: `P_body` rises with `VBody` and
`P_sleeve` falls as `VBody` takes volume away from the sleeve. The code must not
assume that blindly, because active stretch terms, `gOver`/failure behavior, and
the sleeve pressure floor can break a clean bracket at extreme states. Bracket
failure is a diagnostic event and a parameter/formulation warning, not a reason
to violate `VBody + VReservoir == VLA`.

`reservoirSleeveMaxVolumeMl` is diagnostic only. It may flag overdistension in
debug output, but must never clamp `VReservoir` in the pressure solve because
that would break the exact partition and TBV interpretation.

## Reservoir Capacity State

Reuse existing `ChamberInternal.r` as `qResMl`. Do not add a fourth internal
state unless the shared type is already being changed for another reason.

Valve-state gate:

```ts
function reservoirQDot(ap: ActiveChamberParams, internal: ChamberInternal, ctx: ChamberCtx) {
  const stroke = Math.max(ap.reservoirStrokeMl ?? 0, 0);
  const gain = ap.reservoirBranchGain ?? 0;
  if (stroke <= 0 || gain <= 0) return 0;

  const q = clamp(internal.r, 0, stroke);
  const th = ap.reservoirValveThreshold ?? 0.15;
  const mvOpen = clamp(ctx.mvOpen01 ?? 0, 0, 1);
  const aovOpen = clamp(ctx.aovOpen01 ?? 0, 0, 1);
  const mvClosed = mvOpen <= th;
  const aovClosed = aovOpen <= th;
  const descent = stroke * clamp(ctx.lvShortening01 ?? 0, 0, 1);

  let target = q;
  let tau = ap.reservoirTauFill ?? 0.10;

  if (aovOpen > th && mvClosed) {
    target = descent;                 // LV ejection: AV-plane descent increases capacity
    tau = ap.reservoirTauFill ?? 0.10;
  } else if (aovClosed && mvClosed) {
    target = 0;                       // IVR: capacity returns before MV opens, creating v wave
    tau = ap.reservoirTauRecoilIVR ?? 0.035;
  } else if (mvOpen > th) {
    target = 0;                       // diastole: keep reservoir out of conduit/booster
    tau = Math.max(ap.reservoirTauRecoilIVR ?? 0.035, 0.035);
  }

  return clamp((target - q) / Math.max(tau, 1e-3), -stroke / 0.025, stroke / 0.04);
}
```

Start with `tauRecoilIVR = 0.035`, not `0.015`. The old pressure-offset model
needed very sharp recoil to create a `v` wave, but that was also what produced
residual/quiet failure. The branch model should get `v` gain from capacity and
compliance, not from a near-discontinuous pressure jump.

The expected pressure morphology is `c -> x' -> v -> y`: during ejection,
increasing `q` should create the systolic `x'` descent/pressure dip; during IVR,
capacity return should create the late-systolic/end-systolic `v` wave before MV
opening; after MV opens, the model should produce the `y` descent and early
diastolic conduit/D-wave behavior from normal flow dynamics. If early-diastolic
recoil is intentionally not modeled as a D-wave suction term in the first pass,
document that limitation explicitly in the sweep report.

## Debug Outputs

Add read-only diagnostics when the branch is enabled:

```ts
qLAReservoirMl
VLABodyMl
VLAReservoirMl
PLABodyMmHg
PLAReservoirMmHg
PLAEquilibriumErrorMmHg
twoBranchSolveFlag
reservoirSleeveOverMax01
```

Existing `rLA` can report `qLAReservoirMl` for continuity, but naming a new
debug observable will make plots easier to read. These diagnostics must not
enter TBV accounting.

## First Parameter Seeds

Use the branch only in probes at first:

```ts
LA active/passive:
  sigmaPas0: 300, 450, 600
  Arel0: current/default first, then 0.16-0.24 only after v/a works
  Tmax0: current/default first, then 15000-30000 only if a is too weak

Reservoir branch:
  reservoirBranchGain: 1
  reservoirStrokeMl: 12, 16, 20
  reservoirSleeveVuMl: 8, 12, 16
  reservoirSleeveCompliance: 2.0, 3.0, 4.0
  reservoirTauFill: 0.10
  reservoirTauRecoilIVR: 0.03, 0.035, 0.04
  PVein_LA.R: 0.01, 0.02
```

Do not continue pushing pulmonary venous `Vu` down as a primary lever. In the
current TBV-fixed model it reduced pulmonary unstressed volume and redistributed
volume into stressed/LA compartments, which raised LAV/LAP instead of solving
the target.

## Required Gates

Neutral gates:

- `reservoirBranchGain = 0` or `reservoirStrokeMl = 0` gives full sample parity
  against current baseline: pressures, flows, physical volumes, TBV, health.
- Full official suite remains green with no snapshot drift except intentional
  added debug fields if snapshots cover them.
- `rLA/qLAReservoirMl == 0` for every sample in neutral runs.
- The same neutral gates apply to official and pathological cases, not only to
  the TBV5600 normal probe.

Mass and numerical gates:

- Physical `VLA` remains a node blood volume. It must match the last-beat
  integral of `PVF - Q_MV` within existing measurement residual tolerance.
- `VLABodyMl + VLAReservoirMl == VLA` within `1e-6`.
- `abs(PLABodyMmHg - PLAReservoirMmHg) < 1e-4` after bisection.
- `projectorQuiet == true`, venous residual `<0.05 mL`, TBV drift `<0.05 mL`,
  correction `<0.05 mL/beat`, `clamps0`, structural CO diff near zero.
- The quiet/residual/correction/clamp gates must hold for TBV5600, all official
  cases, and the pathological case set used by the existing suite.
- No branch-volume clamp should be counted as a physiological node clamp. If the
  solver hits branch bounds often, treat it as a parameter failure.
- `twoBranchSolveFlag` should be `"ok"` for settled normal samples. Rare
  transient fallback flags may be tolerated only during startup and must not
  appear in the measured last beat.

Physiology gates at TBV 5600 first:

- LAV max `50-58 mL`; accept up to `60 mL` only as a transient exploratory point.
- `vPeak > aPeak`, target `v/a = 1.1-1.3`.
- `vPeak` physiological band `12-15 mmHg` as upper-normal, not a target to exceed
  casually. Mean normal `v` is closer to `~10-12 mmHg` in published human data,
  so sustained `v > 15` should be treated as a warning.
- `aPeak` `10-12 mmHg` after active refit. Before active refit, the trend must
  be toward separation, not larger coupled waves.
- Pressure `a` peak timing `90-130 ms` after ventricular phase zero.
- `v` peak timing should be end-systolic/AoV-close-adjacent and before or near MV
  opening, not a mid-systolic artifact.
- LA pressure morphology should show `c -> x' -> v -> y`; specifically, the
  `q`-up/ejection phase should produce an `x'` descent or at least a clear
  systolic pressure dip before the `v` rise.
- LA loop gains figure-8/reservoir limb without self-intersection explosion.
- PVF S/D/Ar remain plausible; no large reverse flow caused by branch artifacts.
- Conduit/D-wave and mitral E/A behavior remain physiological. If first-pass
  branch dynamics do not capture early-diastolic recoil/D-wave suction, call that
  out as a known limitation rather than hiding it in a passing `v/a` metric.

Scale gates:

- Re-run TBV `4800, 5600, 6200` after the TBV5600 point passes.
- Preserve physical pulmonary split quietness and structural CO-diff behavior.
- Do not proceed to RA refit until LA branch neutral and TBV-scale gates pass.

## Implementation Order

1. Refactor active-stress pressure into `bodyPressure()` with no reservoir side
   effects.
2. Add the two-branch numeric params with defaults disabled. Enabling is only
   `(reservoirBranchGain > 0 && reservoirStrokeMl > 0)`.
3. Add exact early-return neutral path for disabled branch state.
4. Add sleeve pressure and exact-partition branch state solver for enabled LA
   only, including low-volume and unbracketed endpoint diagnostics.
5. Replace `reservoirRDot()` with numeric-gated `reservoirQDot()` for the branch
   path; keep the old offset path only for temporary comparison probes if useful.
6. Add debug observables and branch-solve flags.
7. Add neutral sample-parity test.
8. Run the branch-positive TBV5600 sweep, official/pathological quiet gates, then
   all-TBV scale sweep.

## Stop Conditions

Stop and revisit the formulation if any of these occur:

- `v/a` only improves when `tauRecoilIVR <= 0.02`; that means we are still using
  a numerical pressure jump instead of reservoir compliance.
- `q` changes create TBV/venous residual drift despite physical `VLA` being the
  only mass state.
- The branch solve frequently pins `VBody` or `VReservoir` at bounds.
- `twoBranchSolveFlag !== "ok"` appears in settled measured beats.
- Branch success requires solver clamping to `reservoirSleeveMaxVolumeMl`;
  `sleeveMax` is not a physical solver bound.
- Soft body passive still requires LAV above `60 mL` to produce `v > a`.
- The pressure trace loses the `x'` descent or moves the `v` peak away from
  end-systole/AoV closure.
- `v/a` passes only by making PVF D-wave, conduit flow, or mitral E/A clearly
  nonphysiological.

If those happen, the next mechanism to add is not more tuning; it is a more
physiological sleeve law with nonlinear compliance and a pulmonary-vein ostial
resistance/inertance sub-branch.
