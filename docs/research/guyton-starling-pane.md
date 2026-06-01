# Guyton / Starling Pane

Model files:

- `engine/guytonStarling.ts`
- `engine/guytonStarlingWorker.ts`
- `components/Charts.tsx` (`GuytonPanel`)
- `engine/ModelCore.ts` (`debugObservables()`)
- `engine/__tests__/guytonStarling.test.ts`

## Summary

This branch restores the disabled Guyton pane as a closed-loop operating map:

1. right-sided systemic venous return vs RAP/CVP,
2. left-sided pulmonary venous return vs LAP/PCWP,
3. current operating point from `ModelCore.metrics()`,
4. a waterfall-aware local venous-return line from `debugObservables()`, and
5. a background preload sweep for a Starling-like pump-response curve.

The pane is deliberately labeled and implemented as a local summary of the
current closed-loop model. It is not an open-loop causal claim that RAP alone
sets venous return.

## Equations

### Systemic Guyton Line

The existing model already reports systemic filling pressure, RAP, CO, stressed
volume, unstressed volume, and systemic compliance. The pane estimates an
operational venous-return resistance from the current beat:

```text
Rvr_sys = (Pmsf_abs - RAP_mean) / CO_R
```

with units:

```text
mmHg / (L/min)
```

The classic straight-line estimate is:

```text
VR_sys(RAP) = max(0, (Pmsf_abs - RAP) / Rvr_sys)
```

The displayed primary curve uses the model's vena-caval waterfall convention:

```text
RAP_eff = smoothMax(RAP, Pth + Pcrit_VC)
VR_sys  = max(0, (Pmsf_abs - RAP_eff) / Rvr_sys)
```

`Pcrit_VC` is currently zero in `ModelCore`, so the collapse reference is `Pth`.
The low-RAP plateau follows the classic observation that venous return stops
increasing after right atrial pressure becomes sufficiently negative.

### Pulmonary / Left-Sided Line

The left pane adds pulmonary venous filling pressure for the PCap/PVen/PVein
group:

```text
Pmpf_tm  = stressedVolume_pulmVenous / compliance_pulmVenous
Pmpf_abs = Pmpf_tm + weightedExternalPressure_pulmVenous
```

The local pulmonary return estimate is:

```text
Rvr_pulm = (Pmpf_abs - LAP_mean) / CO_L
LAP_eff  = smoothMax(LAP, Palv + Pcrit_pulm)
VR_pulm  = max(0, (Pmpf_abs - LAP_eff) / Rvr_pulm)
```

This matches the existing pulmonary-capillary waterfall edge, whose external
pressure is alveolar pressure (`Palv`) and whose current critical pressure is
zero.

### Absolute Filling Pressure

The legacy `Pmsf` field is preserved as the previous transmural-style observable
so existing tests and cases do not change. The pane uses additional absolute
coordinates:

```text
Pmsf_abs = Pmsf_tm + sum(C_i * Pext_i) / sum(C_i)
Pmpf_abs = Pmpf_tm + sum(C_i * Pext_i) / sum(C_i)
```

This keeps the displayed x-axis pressure and the intercept pressure in the same
absolute pressure convention as RAP/LAP.

### Starling-Like Curve

A background worker generates Starling-like preload-sweep points:

```text
targetTBV = baselineTBV + deltaV
deltaV in [-600, -300, 0, +300, +600] mL
```

For each point, the worker constructs a fresh `ModelCore`, initializes venous
pressures for the target TBV, settles the model, and records:

```text
Right: (RAP_mean, CO_R)
Left:  (LAP_mean, CO_L)
```

The worker marks points whose settled state or health status is not clean. Until
the worker returns, the pane draws a dashed local Starling surrogate anchored at
the current operating point. That surrogate is a visual placeholder, not a
calibration target.

## Parameters And Diagnostics

| Quantity | Source | Notes |
|---|---|---|
| `PmsfAbs` | `debugObservables()` | Absolute systemic filling pressure for the pane. |
| `systemicComplianceEff` | `debugObservables()` | Sum of state-dependent systemic vascular compliance. |
| `PmpfAbs` | `debugObservables()` | Pulmonary venous filling pressure for LAP-axis view. |
| `pulmonaryVenousComplianceEff` | `debugObservables()` | PCap/PVen/PVein effective compliance. |
| `Rvr` | `engine/guytonStarling.ts` | Operational local slope, clamped for display stability. |
| `collapsePressure` | `Pth` or `Palv` | Mirrors `VC_RA` and `PCap_PVen` waterfall externals. |

## Acceptance Gates

Implemented in `engine/__tests__/guytonStarling.test.ts`:

- right-sided venous-return curve passes near the current operating point;
- classic line has near-zero flow at the filling-pressure intercept;
- waterfall-aware line plateaus at low downstream pressure;
- left pane uses `PmpfAbs` and pulmonary venous compliance;
- higher target TBV shifts the systemic filling-pressure estimate upward.

Existing observability tests continue to verify that Pmsf and stressed volume
remain finite and ordered.

## Literature Grounding

- Guyton et al. described the normal venous-return curve and the plateau at
  sufficiently negative right atrial pressure: <https://cir.nii.ac.jp/crid/1360011144273647872>.
- Brengelmann's "Understanding Guyton's venous return curves" discusses mean
  systemic pressure, right atrial pressure, and venous resistance as a useful but
  debated closed-loop description: <https://pmc.ncbi.nlm.nih.gov/articles/PMC3191500/>.
- NCBI Bookshelf's venous-return chapter summarizes the usual teaching diagram:
  venous return falls as RAP rises, reaches zero at mean systemic pressure, and
  plateaus near negative RAP: <https://www.ncbi.nlm.nih.gov/books/NBK54476/>.
- Maas et al. report clinically estimated mean systemic filling pressure ranges
  in critically ill patients, which is relevant when interpreting model Pmsf as a
  filling-pressure observable rather than a literal normal value:
  <https://pubmed.ncbi.nlm.nih.gov/26209056/>.
- Patterson, Piper, and Starling's 1914 paper is the classical mechanical basis
  for length-dependent ventricular output:
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC1420422/>.
- A modern historical review summarizes the Frank-Starling law and its relation
  to preload, stroke volume, and cardiac output:
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC5418489/>.

## Open Questions

- Replace the dashed local Starling surrogate entirely once the worker sweep is
  fast enough and cached across pane openings.
- Add `GUYTON_3D` as a true contour/plane view after the right/left panes have
  user validation.
- Revisit absolute vs transmural filling-pressure labels before using high PEEP
  or high pericardial-pressure cases for teaching.
