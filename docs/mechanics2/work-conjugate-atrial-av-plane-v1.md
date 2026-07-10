# Work-conjugate atrial AV-plane V1

Status: experimental mechanics2 sidecar. It is not `LeftHeartSubsystemV2`
runtime, not a full four-chamber runtime, and not clinical validation.

## Scope

This report tests a left-heart work-conjugate AV-plane coordinate coupled to LA
and LV chamber-wall virtual work. The accepted physiology-facing LA PV axis is
the physical LA blood-volume ledger:

```text
dV_LA/dt = Q_PV - Q_MV
dV_LV/dt = Q_MV - Q_AoV
```

The shared AV-plane coordinate `z` is a non-blood work coordinate. It changes
wall geometry and force balance, but it never creates or removes blood volume.

The implementation uses `WorkConjugateAVPlaneLeftHeartV1` and
`LaPvLobeMeasurementV2`. It deliberately contains none of `P_mem`, `P_relief`,
`P_LV_recv`, an independent AV-coordinate spring `K`, direct AV-gradient
injection, hidden volume, or a hidden blood-volume source. The spring and hidden
volume are separate concepts: a spring would add coordinate force and stored
energy, while hidden volume would alter the blood/cavity ledger. Both are absent.

## Continuous-Time Model

For chamber `i in {LA, LV}`, the cylinder-like midwall geometry is

```text
V_mid,i = V_blood,i + 0.5 V_wall,i
l_i = l_ref,i + s_i (z - z_ref)
A_mid,i = V_mid,i / l_i
```

with `s_LA = +1` and `s_LV = -1`. The strains are

```text
e_c,i = 0.5 log(A_mid,i / A_ref,i)
e_l,i = log(l_i / l_ref,i)
```

and the strain rates are derived from the same volume and coordinate rates:

```text
de_c,i/dt = 0.5 ((dV_blood,i/dt) / V_mid,i - (dl_i/dt) / l_i)
de_l,i/dt = (dl_i/dt) / l_i
```

Each axis uses passive, active, and viscous stress:

```text
sigma_pass = S_pass / beta * (exp(beta max(0, e - e_slack)) - 1)
sigma_act  = T_max a_i(t) exp(-0.5 ((e - e_peak) / w)^2)
sigma_visc = eta de/dt
sigma = sigma_pass + sigma_act + sigma_visc
```

The circumferential stress gives pressure:

```text
P_tm = V_wall / (2 V_mid) * sigma_c
P_cavity = P_pericardial + P_tm
```

The same virtual-work map gives the AV-plane force:

```text
F_z,i = s_i * 0.1 * V_wall / l_i * (0.5 sigma_c - sigma_l)
F_z = F_z,LA + F_z,LV
```

The pressure-area identity readback checks the equivalent circumferential
force:

```text
F_c,pressure-area = s_i * 0.1 * P_tm * A_mid
F_c,stress        = s_i * 0.1 * V_wall / l_i * 0.5 sigma_c
```

The canonical AV-plane equation is quasistatic wall-viscous:

```text
0 = F_z,LA + F_z,LV
dz/dt = u
```

There is no coordinate mass term `M du/dt`, no external coordinate damping
`D u`, and no independent coordinate-spring term `-K (z - z_ref)` in the
canonical row. There is separately no hidden volume. Wall viscosity remains
inside `sigma_visc`.

The inertial comparator uses backward-Euler coordinate inertia:

```text
0 = F_z - D u - M (u - u_prev) / dt
```

The 30 g unit conversion is:

```text
1 kg = 0.01 N s^2 / cm
0.030 kg -> M = 0.0003 N s^2 / cm
D = 0
```

The inherited legacy negative control keeps `M = 1.1 N s^2/cm, D = 0`.

## Canonical Inputs

The canonical engineering candidate is not a clinical fit. It uses:

- LA reference blood volume `55 mL`
- LA circumferential passive scale `12 kPa`
- LA circumferential active max `2.2 kPa`
- LA circumferential viscosity `0.5 kPa s`
- LA longitudinal passive `0.85x`, active `0.75x = 1.65 kPa`, viscosity `1.4x`
- LV reference blood volume `110 mL`
- LV circumferential passive scale `12 kPa`
- LV circumferential active max `55 kPa`
- LV active peak strain `0.08`
- LV active width `0.16`
- LV circumferential viscosity `0.5 kPa s`
- LV longitudinal passive `0.85x`, active `0.55x = 30.25 kPa`, viscosity `1.4x`

The starting state is:

```text
V_LA = 65 mL
V_LV = 120 mL
P_PV = 9 mmHg
P_Ao = 90 mmHg
P_return = 15.5 mmHg
```

The circuit keeps the closed return-compliance ledger:

```text
dP_PV/dt     = (Q_source - Q_PV) / C_PV
dP_Ao/dt     = (Q_AoV - Q_systemic) / C_Ao
dP_return/dt = (Q_systemic - Q_source) / C_return
```

The prescribed electrical activation is artificial sidecar input:

```text
LV electrical input: onset 0.04 s, duration 0.30 s
LA electrical input: onset cycleLength - 0.18 s, duration 0.15 s
dt = 0.001 s
```

The chamber activation states still use the subsystem first-order rise/fall
transfer. The activation input is not evidence that this model is clinically
timed.

## Hard Gates

Hard gates are intentionally limited to numerical and mechanical contracts:

- finite numeric replay and solver convergence
- accepted-step replay propagation when `output.acceptedStep` is available
- periodicity, including `LA` and `LV` activation-state closure with
  `maxAbsActivation01 <= 1e-6`
- closed volume and mass residuals
- exact hidden blood source `0`
- wall virtual-work raw residual
- pressure-area identity residual
- AV force/power residual
- passive-reference net-force derivative `< 0`

Morphology and mitral-flow readbacks remain diagnostic pending owner visual
review. They are not hard acceptance gates.

## Current HR75 Readback

The canonical HR75 quasistatic wall-viscous row currently passes the hard
gates. It gives one measurable true LA PV crossing:

The values below are display-rounded. The JSON report is the numerical source
of truth.

```text
A lobe area = 13.842 mmHg mL
v lobe area = 10.043 mmHg mL
A/v ratio = 1.378
conduit-below-reservoir fraction = 1
pumping-above-reservoir fraction = 1
MV E/A peak ratio = 1.105
MV E/A VTI ratio = 0.746
z excursion = 0.991 cm
max |u| = 8.304 cm/s
x descent = 0.689 mmHg
```

The shallow x descent is a reported limitation. It must not be repaired by
adding a pressure hook or hidden reservoir source.

The model-order result is:

- canonical quasistatic wall-viscous: hard gates pass
- physical 30 g inertial comparator: hard gates pass
- legacy inherited `M = 1.1`: finite and solver-converged but not periodic in
  the bounded 30-beat replay, retained as a negative control

## Activation Timing Sensitivity

`activation-timing-sensitivity` is a diagnostic-only row for the external
activation/diastasis hypothesis. It adds no state and no pressure hook. It uses:

- LV passive scale `20 kPa`
- LV electrical duration `0.30 cycle`
- LV activation fall tau `25 ms`
- LA electrical start `0.80 cycle`, later than the canonical HR75 start
- LA electrical duration `0.10 s`
- LA activation fall tau `50 ms`

Current HR75 readback:

```text
MVO theta = 0.45
MV E/A peak ratio = 1.552
E peak flow = 247.639 mL/s
flow at A onset = 88.167 mL/s
x descent = 1.146 mmHg
A lobe area = 2.212 mmHg mL
v lobe area = 14.309 mmHg mL
```

This row improves timing and x descent but collapses the A lobe relative to the
v lobe. It is a transparent tradeoff row, not canonical and not acceptance.

## Artifacts

- Report: `data/mechanics2/reports/work-conjugate-atrial-av-plane-report-v1.json`
- Composite SVG: `data/mechanics2/visuals/work-conjugate-atrial-av-plane-normal-hr75-review.svg`
- PV-only SVG: `data/mechanics2/visuals/work-conjugate-atrial-av-plane-normal-hr75-pv-loop.svg`
- Order/control SVG: `data/mechanics2/visuals/work-conjugate-atrial-av-plane-order-ablation-review.svg`

The simulation report and SVG renderer retain the full `1 ms` in-memory trace.
All gates, extrema, morphology measurements, waveform summaries, and plotted
curves are computed from that full trace. The committed JSON is a separate
event-aware compact projection: it retains every fourth sample plus first/last
and the nearest MVC, x, v, MVO, y, E-peak, and A-peak samples.

Each compact profile records raw `dt`, stride, source and retained sample counts,
the retained event source indices, and
`gatesAndSummariesComputedFromFullTrace: true`. Its slim samples retain raw,
unrounded theta/phase, LA/LV volume and pressure, PV/MV/Ao flow, AV-plane `z/u`,
LA/LV activation, LA/LV total `Fz`, AV wall-force sum/residual, maximum normalized
equation residual, and `acceptedStep`. The artifact hash and parity test cover
this compact projection; they do not substitute it for the full-trace bench or
renderer input.

## Claim Boundaries

This sidecar can support mechanics review of a work-conjugate AV-plane model.
It does not claim:

- `LeftHeartSubsystemV2` runtime integration
- default selection
- full four-chamber validation
- clinical normality
- morphology acceptance before owner visual review

## Primary References

These references motivate the piston, hydraulic-force, AV-plane-mechanics, and
LA phase terminology used for engineering review. This candidate is not a
direct parameter fit or reproduction of any of them.

1. Maksuti E, Bjallmark A, Broome M. [Modelling the heart with the
   atrioventricular plane as a piston unit](https://pubmed.ncbi.nlm.nih.gov/25466260/).
   Medical Engineering & Physics. 2015;37:87-92.
2. Maksuti E, et al. [Hydraulic forces contribute to left ventricular diastolic
   filling](https://www.nature.com/articles/srep43505). Scientific Reports.
   2017;7:43505.
3. Zeile C, et al. [An Intra-Cycle Optimal Control Framework for Ventricular
   Assist Devices Based on Atrioventricular Plane Displacement
   Modeling](https://link.springer.com/article/10.1007/s10439-021-02848-2).
   Annals of Biomedical Engineering. 2021;49:3508-3523.
4. Smiseth OA, et al. [Imaging of the left atrium: pathophysiology insights and
   clinical utility](https://academic.oup.com/ehjcimaging/article/23/1/2/6380641).
   European Heart Journal - Cardiovascular Imaging. 2022;23:2-13.
