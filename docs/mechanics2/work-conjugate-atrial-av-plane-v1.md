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

The legacy baseline uses an artificial prescribed rectangular target:

```text
LV electrical input: onset 0.04 s, duration 0.30 s
LA electrical input: onset cycleLength - 0.18 s, duration 0.15 s
dt = 0.001 s
```

The chamber activation states use the subsystem first-order rise/fall transfer.
`laStart` is an artificial effective sidecar event. It is not identified as
surface P-wave onset or measured local LA depolarization, so absolute ECG delay
claims are blocked.

## Event-driven LA activation ablation

`event-driven-atrial-activation-ablation` changes only the LA activation law.
It keeps the baseline wall parameters, active-stress maxima, event onset, LV
rectangular activation, valve/circuit load, blood-volume equations, AV-plane
equation, and ten nonlinear trial unknowns. It is not the canonical/default row.

Each prescribed event contributes a dimensionless Ca-like kernel:

```text
k(s) = N (1 - exp(-s / tau_rise))^2 exp(-s / tau_decay),  s >= 0
```

`N` makes a single-event peak equal to one. All provided causal event tails are
summed on absolute time; the state is not reset at a beat boundary. The finite
periodic history reaches back by at least `max(32 tau_decay, 16 tau_rise)` (plus
the prescribed delay), a truncation policy stored in the artifact. This driver
is a shape proxy, not a calcium-concentration prediction. A fixed Hill map
avoids adding case-fit degrees of freedom:

```text
h(c) = c^2 / (0.5^2 + c^2)
```

The existing bounded LA activation state is advanced by

```text
da/dt = k_on h(c) (1 - a) - k_off (1 - h(c)) a
```

For a frozen midpoint drive, the update is analytic and preserves `0 <= a <= 1`
without clipping. The upstream endpoint state bypasses only the legacy
first-order activation filter; it still drives the unchanged work-conjugate
wall active stress. This prevents double filtering and introduces no additional
mechanical solver state.

The retained `laElectricalActivation01` trace is the legacy rectangular
protocol marker for cross-variant timing comparison. For the event variant,
`laActivationDrive01` and `laCalciumDrive` are the actual upstream readbacks.

The report-only engineering seed is:

```text
event reference = prescribed-effective-sidecar-event
electrical-to-Ca delay = 0 ms
tau_rise / tau_decay = 60 / 65 ms
k_on / k_off = 30 / 30 s^-1
fixed Hill c50 / n = 0.5 / 2
```

It was selected as an engineering seed, not by fitting the displayed PV shape
or by calibrating intact human atrial twitch data. At HR75 it gives
contractile-state TTP about `113 ms` and RT50 about `95 ms`; these are exposed
phenomenological readbacks, not asserted normal-human targets. At fixed strain
the wall law makes active-stress timing follow this state, while dynamic active
pressure also depends on strain and peaks at a different time. The zero delay
is not a biological conduction claim: the benchmark event is already an
undefined effective timing reference. A future ECG-driven model must separately
represent surface-P-to-local-activation latency and use independent mechanical
timing data for calibration.

At HR75 the nominal event is `theta=0.775`, while the unchanged legacy pulse
actually starts on the `1 ms` grid at `theta=0.77625`. The event variant uses
that same realized grid event. The artifact stores both values and the grid
offset. State, pressure, and flow samples are timestamped at the implicit-step
endpoint; the event-model Ca/Hill drive is sampled at the step midpoint, and its
peak theta is reported at that midpoint.

For future case fitting, the preferred externally visible parameters are
effective onset, wall active-stress amplitude, and a relaxation phenotype such
as RT50. Kernel taus, Hill constants, kinetic rates, event delay, and wall
`T_max` must not all be freed together: they can compensate one another and make
the fit non-identifiable. A fitting API should map observable phenotypes onto a
fixed internal parameter manifold rather than exposing every raw constant.
Additional onset dispersion should be introduced only for a
fibrosis/dyssynchrony question with supporting data.

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

The report also performs two non-gating robustness checks:

- 81 static combinations of canonical trace LA/LV volume min/mid/max and
  LA/LV activation `0/0.5/1`, with `0.01 cm` sign-change brackets and bisection
  on `[-1.5, 1.5] cm`; this is not a mathematical global-uniqueness proof
- event-model `dt = 1.0/0.5/0.25 ms` replay

## Phase definitions and literature context

The newer readbacks separate three quantities that must not be conflated:

- `lvFallTauSec` is the time constant of the model's dimensionless LV
  activation-state decay after the rectangular target turns off.
- invasive LV relaxation `tau` is obtained from an exponential fit to measured
  LV pressure during isovolumic relaxation. It is not `lvFallTauSec`.
- clinical IVRT is the interval from anatomical aortic-valve closure to
  anatomical mitral-valve opening. `SmoothInertialValveV2.openFraction01` is a
  pressure-gradient sigmoid/conductance fraction, not a leaflet-position state.
  Its `0.5` crossings therefore must not be labeled as anatomical aortic-valve
  closure or mitral-valve opening.

The report now stores the conductance-midpoint crossings explicitly and also a
linear `Q_Ao=0` forward-flow-end to MV-conductance-opening-midpoint interval.
The latter is a circuit phase proxy, not clinical IVRT. The artifact retains
`60-100 ms` only as separate human IVRT literature context and explicitly marks
the current proxy as non-comparable. The 2025 ASE update separately describes
an invasive LV pressure-relaxation constant above `48 ms` as abnormal; neither
number may be applied to `lvFallTauSec`.

Likewise, `prescribed-effective-sidecar-event` is neither surface P-wave onset
nor measured local LA depolarization. Surface-P-to-LA-mechanical timing from the
literature is therefore recorded only as context. It is not used to set an
absolute event delay in this experiment.

For the HR75 canonical-normal scenario, two identifiable mitral peaks with an
interior minimum are a future phenotype target. A long zero-flow diastasis is
not required, and this is not a universal age-independent hard gate. The
aggregate lumped `Q_PV` is also not a single-vein Doppler velocity, so published
PV Ar velocity thresholds cannot be applied directly. Presence, duration, and
reverse volume remain report-only.

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
MV E/A = not measurable (complete fusion)
z excursion = 0.991 cm
max |u| = 8.304 cm/s
x descent = 0.611 mmHg
```

The model-derived MV-conductance-closing-midpoint-to-x depth is retained, but it
is not interpreted as anatomical valve-closure-to-x or as a strict monotonicity
gate. A small
physiological c wave may interrupt the early descent. The report locates the
maximum LA pressure from that MV conductance midpoint to the linearly
interpolated onset of forward aortic flow as a `cWaveCandidate`, then reports
c-to-x (`x'`) depth, monotonic fraction, and secondary rise. This is a c-like
phase diagnostic, not proof of a resolved clinical c wave, and it must not be
repaired by adding a pressure hook or hidden reservoir source.

The numerical E- and A-window extrema remain in JSON for diagnosis, but their
ratio is not presented as a physiological E/A measurement when
`measurementValid=false`.

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
MV conductance-opening midpoint theta = 0.451
MV E/A peak ratio = 1.552
E peak flow = 247.639 mL/s
flow at A onset = 88.167 mL/s
x descent = 1.136 mmHg
A lobe area = 2.212 mmHg mL
v lobe area = 14.309 mmHg mL
```

This row improves timing and x descent but collapses the A lobe relative to the
v lobe. It is a transparent tradeoff row, not canonical and not acceptance.
It also changes LV passive stiffness and multiple timing constants, so it is not
a clean activation-law attribution comparator.

## Current activation-law result

The clean event-model ablation passes the same numerical/mechanical hard gates,
but does not by itself solve the waveform.

```text
                                      legacy       event model
contractile-state TTP                         150 ms       113 ms
contractile-state RT50                         52 ms        95 ms
LA activation at MV-close conductance mid     0.396        0.298
LA pressure-peak theta                        0.964        0.914
r_Pa                                          0.129        0.356
MV-close-conductance-midpoint-to-x depth       0.611        0.470 mmHg
c-like candidate                              Ao-flow bound Ao-flow bound
c-to-x (x') depth                             0.742        0.908 mmHg
c-to-x non-increasing fraction                0.979        0.958
y descent observed lower bound               >=2.528      >=2.761 mmHg
post-MV-close-mid secondary pressure rise     0.062        0.371 mmHg
PV atrial reversal                            absent       absent
LA PV topology                                measurable   multiple intersections
```

In the event row, contractile state peaks near `theta=0.918`, active transmural
pressure near `theta=0.926`, and total LA pressure near `theta=0.914`; they are
reported separately rather than treated as one timing observable.

Here

```text
r_Pa = (V(Pa peak) - V_min) / (V_event - V_min)
```

is intentionally not clamped. The larger value moves the pressure apex toward
the higher-volume/right side of the pumping window, consistent with the visual
concern. However, the event variant creates three self-intersections and leaves
fused E/A and absent pulmonary-venous atrial reversal. The larger rise after the
MV closing conductance midpoint is not by itself evidence of an abnormal x
descent: in both rows the c-like pressure maximum lies at the aortic forward-flow
onset boundary, after which x' is mostly non-increasing. The event row has a
deeper x' but a larger c-like rise. Neither row establishes a resolved
physiological c wave.

Both reported y minima occur at the atrial-event boundary and are explicitly
marked right-censored, so their descent depths are lower bounds rather than true
trough depths. An earlier draft called the interval between the aortic and
mitral `openFraction=0.5` crossings IVRT and obtained `277-281 ms`. That
interpretation was rejected: at the supposed aortic "closure," forward aortic
flow was still roughly `173-188 mL/s`. The corrected report keeps those
crossings as conductance midpoints and uses a separately named flow-end proxy.
The later section below now adds a pressure-crossover plus sustained-flow event
contract, but not a leaflet-contact state or measured valve boundary; therefore
no clinical IVRT claim is allowed. Activation timing is a contributing factor,
not a sufficient mechanism, and this variant must remain diagnostic.

The report-only sign-change scan finds one root with negative net-force
derivative in all 81 static cases. In
the `1.0 -> 0.25 ms` check, peak activation changes by about `4.3e-6`, TTP by
`0.25 ms`, RT50 by `0.25 ms`, and `r_Pa` by `0.00023`. These results support the
numerical implementation, not physiological acceptance.

## One-factor phase attribution

The next screen uses the event-driven LA row as the common reference and changes
one declared path at a time. It does not reuse `activation-timing-sensitivity`,
because that older row simultaneously changes LV passive stiffness, LV/LA
timing, and two activation fall constants.

The local engineering brackets are not clinical priors or fitting bounds:

- effective event-to-Ca-like delay: `0 -> 15/30 ms`; the electrical event and
  all phase/window boundaries remain fixed
- LV activation-state fall time: `40 -> 30/50 ms`; LV target duration, walls,
  LA activation, and load remain fixed
- PV-to-LA series resistance: `0.060 -> 0.045/0.075 mmHg s/mL`; PV compliance,
  inertance, source resistance, MV, initial load, and activation remain fixed

All seven rows pass the existing numerical/mechanical hard gates. Current
display-rounded results are:

| row | `r_Pa` | x' depth (mmHg) | Ao-flow-end to MV-mid (ms) | y | MV | QPV nadir (mL/s) | Ar | raw crossings |
|---|---:|---:|---:|---|---|---:|---|---:|
| event reference | 0.356 | 0.908 | 120 | >=2.761, censored | complete fusion | 85.455 | absent | 3 |
| delay 15 ms | 0.325 | 0.990 | 120 | >=2.751, censored | complete fusion | 84.324 | absent | 2 |
| delay 30 ms | 0.295 | 1.102 | 120 | >=2.750, censored | complete fusion | 83.201 | absent | 2 |
| LV fall 30 ms | 0.391 | 0.811 | 91 | 2.679, interior | partial fusion | 81.671 | absent | 5 |
| LV fall 50 ms | 0.390 | 1.008 | 147 | >=2.499, censored | complete fusion | 80.293 | absent | 2 |
| PV R 0.045 | 0.342 | 0.782 | 118 | >=2.960, censored | complete fusion | 92.398 | absent | 0 |
| PV R 0.075 | 0.361 | 0.963 | 123 | >=2.409, censored | complete fusion | 79.753 | absent | 3 |

This screen changes the causal ranking:

1. Adding effective event-to-Ca delay moves the contractile and pressure peaks
   but neither separates E/A nor creates PV Ar. It is not the next mechanism to
   tune.
2. Faster LV activation-state decay moves the MV conductance-opening midpoint
   earlier, shortens the aortic-flow-end interval, creates an interior y trough,
   and changes complete to partial fusion. The interval is not clinical IVRT,
   and topology worsens to five raw intersections. This is mechanism evidence,
   not an accepted parameter.
3. PV series resistance strongly moves x', y, QPV nadir, mean PV pressure, and
   cardiac output, but does not create reversal. `P_PV-P_LA` remains positive
   throughout every tested row. A pure resistance perturbation was therefore
   insufficient in this local bracket; it must not be made to look successful
   by simultaneously compensating PV compliance/source or MV.

This result motivated the explicit pressure-flow valve-event contract and
phenotype-controlled LV relaxation experiment reported below. That contract
separates pressure crossover, sustained forward flow, and conductance midpoint;
it still does not establish leaflet contact or clinical IVRT. MV timing, E/A,
y, and PV D remain emergent outputs. No multi-factor candidate or
runtime/default promotion follows from this screen. The two-factor screen below
is a separate interaction probe, not a tuned candidate and not a replacement
for the one-factor attribution.

## Activation by AVPD-driver interaction

Activation and AV-plane motion should not be assumed independent. In a paced
porcine study, early LA reservoir filling was associated with preceding LA
ejection and LA relaxation, whereas late reservoir filling depended on LV
long-axis shortening/base descent. Human Doppler/annular-motion data likewise
show systolic annular descent aligned with pulmonary-venous systolic inflow and
an atrial-phase annular component aligned with mitral A flow. These findings
support testing an interaction, but do not supply fitting bounds for this
engineering sidecar.

The interaction screen deliberately adds no `activation * z` coefficient and
does not prescribe or rescale `z(t)`. It retains the same one shared
work-conjugate coordinate, ten nonlinear unknowns, valve/circuit load, and
blood-volume ledger. It changes only:

- Ca-like kernel rise tau: center `60 ms`, corners `40/80 ms`; decay tau,
  contractile kinetics, event time, Hill mapping, and wall stress maxima remain
  fixed. This is a rise-shape/kinetics factor, not a timing-only factor: realized
  contractile peak changes from about `0.690` to `0.722` and its cycle integral
  from about `0.107` to `0.129 s`.
- LV longitudinal/circumferential `activeStressMax` parameter ratio: center
  `0.55`, corners `0.45/0.65`; the actual changed leaf is longitudinal
  `activeStressMaxKPa`, `30.25 -> 24.75/35.75 kPa`, while the circumferential
  maximum remains `55 kPa`.

The second factor is therefore an active-stress-maximum anisotropy driver of
AVPD, not a realized stress ratio or an AVPD-amplitude knob. The strain-dependent
length-tension envelopes are evaluated separately on each axis; at peak realized
LV circumferential active stress, the realized longitudinal/circumferential
stress ratio is about `0.479` in the low-maximum rows and `0.504` in the
high-maximum rows, not `0.45/0.65`. Activation peak/integral, realized stresses,
active z-force, and signed/absolute active z-work are retained in the report.
AV-plane displacement and velocity still emerge from the wall force balance.
The center plus four corners all pass the existing numerical and mechanical hard
gates:

| row | TTP/RT50 (ms) | `a_peak` | cycle z (cm) | systolic z (cm) | peak systolic u (cm/s) | `r_Pa` | x' candidate (mmHg/status) | y lower bound (mmHg) | A/v |
|---|---:|---:|---:|---:|---:|---:|---|---:|---:|
| center 60 ms / Tmax ratio 0.55 | 113/95 | 0.711 | 0.945 | 0.779 | 8.538 | 0.356 | 0.908 / Ao-flow boundary | >=2.761 | n/m |
| fast 40 ms / Tmax ratio 0.45 | 101/87 | 0.690 | 1.209 | 0.565 | 10.655 | 0.388 | 1.907 / Ao-flow boundary | >=2.878 | 0.00003 |
| fast 40 ms / Tmax ratio 0.65 | 101/87 | 0.690 | 0.970 | 0.910 | 7.632 | 0.384 | 0.683 / interior | >=2.723 | n/m |
| slow 80 ms / Tmax ratio 0.45 | 121/102 | 0.722 | 1.224 | 0.575 | 10.719 | 0.330 | 1.958 / Ao-flow boundary | >=2.791 | n/m |
| slow 80 ms / Tmax ratio 0.65 | 121/102 | 0.722 | 0.987 | 0.928 | 8.264 | 0.328 | 0.966 / interior | >=2.630 | n/m |

On the `1 ms` screen, the faster rise moves `r_Pa` from about `0.33` to `0.38`,
in the desired direction for the pressure apex. Raising the LV longitudinal
active-stress maximum increases the defined systolic displacement and reduces
peak systolic apexward velocity. It also changes the c-like candidate from an
aortic-flow-onset boundary in the low rows to an interior IVCT-window peak in
the high rows, so the four x' depths do not share one measurement definition.
Neither pattern is an acceptance result because the remaining waveform and
topology failures persist.

Here `systolic z` is the apexward-positive displacement from the interpolated
MV-closing conductance midpoint to the linearly interpolated end of forward
aortic flow. The different behavior of whole-cycle excursion and this systolic
displacement is precisely why the LV anisotropy ratio must not be mislabeled as
a direct AVPD scale. Keren et al. reported `12.8 +/- 1.4 mm` systolic mitral
annular descent in normal subjects, whereas this screen's differently defined
systolic displacement is about `5.65-9.28 mm`; the event definitions and
measurement methods differ, so this is soft context rather than a gate or a
normal-range comparison.

For each output `Y`, the stored interaction contrast is

```text
I_Y = (Y_slow,high - Y_fast,high) - (Y_slow,low - Y_fast,low)
```

and gives, display-rounded:

```text
I_systolic-z = +0.00805 cm
I_systolic-u = +0.568 cm/s
I_cycle-z    = +0.00094 cm
I_rPa        = +0.00214
I_x'         = n/m (heterogeneous boundary/interior candidate definitions)
I_y          = n/m (one or more corner troughs censored; all four here)
I_CO         = +0.00469 L/min
```

There is no clinical or statistical threshold attached to these local
contrasts, and raw contrasts with different units are not ranked against one
another. The report additionally stores `|I_Y| / (four-corner range)` with a
null result for a nonpositive range. On the `1 ms` grid this is about `18.4%`
for peak systolic velocity, `3.6%` for `r_Pa`, `2.2%` for systolic displacement,
`1.5%` for cardiac output, and `0.4%` for whole-cycle excursion. x' is excluded
because its boundary/interior candidate definitions differ. The y interaction
is also not measurable: a difference of four event-bound lower-bound values is
neither an estimate nor a bound for the true trough interaction.

All four corners were rerun at `1.0`, `0.5`, and `0.25 ms`. Systolic-displacement
contrast changes `+0.00805 -> +0.00820 cm`, peak-velocity contrast
`+0.568 -> +0.580 cm/s`, whole-cycle contrast `+0.000939 -> +0.001053 cm`, and
output contrast `+0.004685 -> +0.004725 L/min`; their signs remain stable.
By contrast `I_rPa` changes `+0.00214 -> +0.00165 -> -0.00109`, so the apparent
`r_Pa` interaction is not discretization-robust and must not be interpreted.
x' remains unmeasurable under the homogeneous-definition rule at every dt, and
y is excluded by censoring. This refinement therefore identifies a robust local
interaction primarily in AV-plane dynamics, not in the desired pressure-apex
morphology.

All corners retain complete E/A fusion, absent aggregate PV atrial reversal,
and an atrial-event-censored y minimum. The fast/low corner has one measured
crossing, but its A/v ratio is only about `3e-5` and the selected crossing is
outside the preferred phase window; it is not a morphology success.

This screen shows non-additive sensitivity between the selected activation and
LV longitudinal-stress parameters inside a model that already shares `z`; it is
not independent validation of a physiological coupling hypothesis and does not
identify an acceptable combined parameter set. For case-specific joint fitting,
LA PV shape alone is insufficient: time-resolved AVPD or mitral-annular motion
must independently constrain the shared coordinate. Recommended evidence also
includes activation timing/ECG, LA pressure and volume, LV pressure and volume,
aortic pressure or flow, full mitral E/A, and pulmonary-venous S/D/Ar. This is a
core observable set, not a proof that the parameters become identifiable.
Hobson et al. provide load-partition evidence under altered LV stiffness; the
recommended observable set is a modeling inference, not an identifiability
result reported by that experiment.

## Phenotype-normalized activation and fixed-dose LV RT50

The LA/LV activation ownership contract is now chamber-symmetric. Each chamber
can either retain the subsystem's legacy first-order filter or receive a bounded
contractile-state endpoint from an upstream event-driven model. The per-step
output records the source, state owner, previous/current contractile state,
electrical protocol marker, and prescribed value for both chambers. Prescribing
the endpoint adds no nonlinear unknown or mechanical state: the wall law,
shared `z` equation, ten-entry trial vector, and blood ledger are unchanged.

Raw kernel and kinetic parameters are not suitable patient-facing fit
coordinates because changing one generally changes timing, amplitude, and
active work together. `ContractileActivationPhenotypeV1` therefore defines one
periodic event on the final bounded state `a(t)` by

```text
a_pre       = periodic state immediately before the event
Delta a_pk  = max(a) - a_pre
TTP         = t(max(a)) - t_event
RT50        = t_falling(a_pre + Delta a_pk/2) - t(max(a))
I_a         = integral_cycle max(a(t) - a_pre, 0) dt
```

The event reference and effective event-to-Ca-like onset delay are explicit.
At configuration time, the mapper solves the four positive internal coordinates
`riseTau`, `decayTau`, `k_on`, and `k_off` in bounded log space against TTP,
RT50, peak excursion, and integral. It reports scaled residuals and a
finite-difference Jacobian condition estimate in scaled log coordinates. This
is a local numerical-conditioning check, not a parameter-identifiability
claim. A nonconverged, unmeasurable, or
ill-conditioned candidate has `internalParams: null` and cannot be installed.
This is offline configuration machinery; runtime does not inspect a future
trace, renormalize a beat, or add a state. The extra numerical code is isolated
from the low-order mechanical model, and raw internal coordinates remain mapper
implementation details rather than fit parameters.

The first audit attempted to represent the current rectangular-target plus
first-order LV trace. Its realized phenotype is approximately:

```text
TTP=299.5 ms, RT50=28.2 ms, peak excursion=0.999996, integral=0.3100 s
```

That request did not converge on the present single-event four-coordinate
manifold (`max normalized residual about 1.29`; local condition estimate about
`1.72e5`). It was therefore not installed. This is a failure of this seed,
bounds, and local solve; it does not prove that the entire model family cannot
represent the waveform. In particular, the experiment below must not be
described as a drop-in replacement of the current LV waveform.
The long near-plateau followed by rapid decay also makes peak time a fragile
observable; forcing a nominally exact replacement would defeat the fail-closed
contract.

Instead, a separate, explicitly labeled engineering center was used to test the
mechanism within a locally representable event-driven family. It is not a
normal-human prior and not legacy-equivalent. Its center phenotype is
TTP `115.5 ms`, RT50 `126.3 ms`, peak excursion `0.8314`, and integral
`0.1716 s`. The fixed-dose screen changes only the RT50 target to
`92/100/108%`; onset delay, TTP, peak excursion, integral, LA activation,
LV wall maxima, AV-plane law, valves, and circuit parameters are held fixed.
The raw mapper coordinates necessarily co-vary to realize that phenotype
constraint.

| LV RT50 dose | target / coupled RT50 (ms) | coupled TTP (ms) | peak | integral (s) | pressure-qualified Ao-flow-threshold cessation to MV sustained-flow-threshold onset proxy (ms) | conductance-midpoint proxy (ms) | MV | diastasis (ms) | y | `r_Pa` | CO (L/min) |
|---|---:|---:|---:|---:|---:|---:|---|---:|---|---:|---:|
| 92% | 116.2 / 117.5 | 114.7 | 0.8303 | 0.1711 | 319.9 [317, 323] | 325.6 | complete fusion | 0 | right-censored, >=1.320 mmHg | 0.664 | 3.695 |
| 100% | 126.3 / 126.3 | 115.5 | 0.8314 | 0.1716 | 278.5 [275, 282] | 284.5 | complete fusion | 0 | right-censored, >=1.563 mmHg | 0.501 | 3.742 |
| 108% | 136.4 / 137.9 | 116.5 | 0.8256 | 0.1730 | 253.8 [251, 257] | 260.4 | partial fusion | 0 | right-censored, >=1.616 mmHg | 0.447 | 3.737 |

The pressure-qualified column subtracts the operational aortic forward-flow
threshold-cessation time from the operational mitral forward-flow-threshold
onset time after pressure-crossover association and sustain-window
qualification. It is a simulation phase proxy: neither endpoint is a measured
leaflet-contact event, and the interval is not clinical IVRT. The conductance
midpoint column is a separate non-anatomical circuit diagnostic. Brackets in
the pressure-qualified column propagate the two operational event-time
uncertainty intervals; they do not fold pressure-to-flow association latency
into event-time uncertainty.

All three mappings and their coupled-trace readbacks meet the `1.5%`
normalized phenotype residual limit (coupled maximum about `1.1%`), have
finite local condition estimates (about `55-148`), reach periodic state, and
pass the existing conservation/work hard gates. Nevertheless, no row creates
diastasis, separated E/A, or an interior y trough. The high row reaches only
partial fusion. Increasing the RT50 target also shortens, rather than lengthens,
the pressure-qualified flow-threshold phase proxy and moves `r_Pa` in the
undesired direction in this family. That result is a reminder that pressure,
load, AVPD,
and the parts of the waveform not fixed by four summary measures remain
coupled; it is not evidence for a universal inverse RT50 relation.

The same installed raw parameter sets were rerun at `1.0`, `0.5`, and
`0.25 ms`, without recalibrating at each grid. All nine rows remain finite,
periodic, and hard-gate passing; Ao cessation and MV onset are measurable under
the same pressure-flow contract in every row. Complete/complete/partial fusion
and the three right-censored y classifications are unchanged. The largest
coarse-to-fine absolute differences across doses are about `0.0047 ms` for TTP,
`0.0022 ms` for realized RT50, `1.57 ms` for the pressure-qualified
flow-threshold phase proxy, `0.0079 mmHg` for the reported y lower bound,
`0.0061` for `r_Pa`, and `0.0023 L/min` for output. The qualitative negative
result is therefore dt-grid stable over this check, although morphology
fractions should still be interpreted from raw values rather than rounded
labels. The event and delay times align with all three grids; no half-step shift
was tested, so this is not evidence of event-grid phase robustness.

The local result is therefore negative but useful: within this uncalibrated
engineering center and the tested `92-108%` range, varying LV RT50 alone was not
sufficient to resolve the remaining morphology. It does not eliminate LV
relaxation as a physiological contributor, because this center has not been fit
to independent LV pressure/volume and aortic flow. The next activation
experiment should first calibrate that LV reference, then run fixed-dose LA TTP
and LA RT50 while retaining the same pressure-flow event contract. AVPD
parameters should remain constrained by time-resolved annular motion rather
than compensating for an uncalibrated activation waveform.

The valve diagnostic now separately reports:

1. upstream-minus-downstream pressure crossover and its bracket;
2. a sustained forward-flow threshold transition plus
   `eventTimeUncertaintyIntervalSec`, which brackets the operational flow event;
3. the pressure-to-flow delay plus `pressureFlowAssociationIntervalSec`, which
   includes association latency and is not event-time uncertainty; and
4. conductance-midpoint crossings, explicitly marked as non-anatomical.

For the event-driven-LA/current-LV reference, MV pressure crossover/qualified
forward-flow-threshold onset are about `0.4641/0.4661 s`, while aortic pressure
crossover/qualified forward-flow-threshold cessation are about
`0.3402/0.3431 s`. The aortic conductance trace has multiple midpoint crossings
even though the pressure-flow contract resolves one qualified rising and one
qualified falling phase event. This directly supports keeping both operational
pressure-flow and conductance timing separate from MVO/MVC/AVO/AVC terminology.
They remain simulation event diagnostics, not measured leaflet-contact times or
clinical IVRT.

The staged physiological rationale is unchanged. LV pressure fall and filling
reflect active relaxation together with load and restoring forces, rather than
one activation time alone (Weiss et al.; Ishida et al.; Nikolic et al.). LA
reservoir/x behavior additionally combines LA relaxation and LV base descent
(Barbier et al.), while transmitral/PV partition depends on coupled atrial,
ventricular, and loading conditions (Keren et al.; Hobson et al.). Consequently,
phenotype-controlled activation is an attribution tool, not permission to tune
the PV boundary or AVPD until the desired curve appears.

## Artifacts

- Report: `data/mechanics2/reports/work-conjugate-atrial-av-plane-report-v1.json`
- Composite SVG: `data/mechanics2/visuals/work-conjugate-atrial-av-plane-normal-hr75-review.svg`
- PV-only SVG: `data/mechanics2/visuals/work-conjugate-atrial-av-plane-normal-hr75-pv-loop.svg`
- Order/control SVG: `data/mechanics2/visuals/work-conjugate-atrial-av-plane-order-ablation-review.svg`
- Activation ablation SVG: `data/mechanics2/visuals/work-conjugate-atrial-av-plane-activation-ablation-review.svg`
- Phase-attribution SVG: `data/mechanics2/visuals/work-conjugate-atrial-av-plane-phase-attribution-review.svg`
- Activation-by-AVPD interaction SVG: `data/mechanics2/visuals/work-conjugate-atrial-av-plane-activation-avpd-interaction-review.svg`
- LV relaxation phenotype report: `data/mechanics2/reports/work-conjugate-atrial-av-plane-lv-relaxation-phenotype-v1.json`
- LV relaxation phenotype SVG: `data/mechanics2/visuals/work-conjugate-atrial-av-plane-lv-relaxation-phenotype-review.svg`

The bench retains each benchmark variant's full `1 ms` profile in memory.
All gates, extrema, morphology measurements, waveform summaries, and diagnostic
readbacks are computed from the relevant full profile. The composite, PV-only,
order/control, and activation-ablation SVG panels plot those full in-memory
variant profiles. The committed main JSON instead stores an event-aware compact
projection of each variant: every fourth sample plus first/last and the nearest
MV conductance-closing midpoint, x, v, MV conductance-opening midpoint, y,
E-peak, A-window peak, LA event, activation-driver peak, contractile peak,
active-pressure peak, LA pressure peak, and PV atrial-window nadir samples
(whether or not reversal is present).

Each compact profile records raw `dt`, stride, source and retained sample counts,
the retained event source indices, and
`gatesAndSummariesComputedFromFullTrace: true`. Its slim samples retain raw,
unrounded theta/phase, LA/LV volume and pressure, PV/MV/Ao flow, AV-plane `z/u`,
LA activation driver, Ca-like drive where applicable, LA/LV activation, LA
active transmural pressure, LA/LV total `Fz`, AV wall-force sum/residual, maximum
normalized equation residual, and `acceptedStep`. The artifact hash and parity
test cover this compact projection; they do not substitute it for full-profile
bench calculations or the corresponding full-profile SVG panels.

The phase-attribution SVG does not plot the full profile. Its top-level
`phaseAttribution` object is already compact and the renderer uses those
every-fourth-sample plus first/last display traces. The object stores the common
reference, each single changed path and value, isolation manifest, numerical
status, c/x'/Ao-flow-end-to-MV-mid/y/E-A/PV-Ar/topology/load readbacks, and those
compact display traces. These rows are not appended to the canonical/order
variant list and are not used for default selection.

The activation-by-AVPD SVG likewise plots its object's compact display traces,
not the full profiles used to calculate the readbacks. The separate top-level
`activationAvpdInteraction` object stores the center and four free-coupled
corners, exact two-leaf configuration diff audit, every-fourth-sample plus
first/last `V_LA/P_LA/z/u` traces, emergent readbacks, and
difference-of-differences. It explicitly records that no `z(t)` replay,
activation-by-z cross-term, new state, runtime wiring, clinical threshold, or
fitting bound was introduced.

The LV-relaxation phenotype cases also calculate events and coupled readbacks
from full profiles but retain every-fourth-sample display traces. The phenotype
SVG plots those compact traces. The committed main JSON omits them from
`lvRelaxationPhenotypeScreen` and records
`compactTraceStorage: "dedicated-lv-relaxation-phenotype-report"`; the dedicated
JSON retains the compact traces together with the legacy replacement audit,
configuration-time mapper residual/condition readbacks, three fixed-dose
targets, private-coordinate reproduction audit, pressure-flow and conductance
events, and coupled mechanics summaries. Failed mappings remain visible but are
not installed.

## Claim Boundaries

This sidecar can support mechanics review of a work-conjugate AV-plane model.
It does not claim:

- `LeftHeartSubsystemV2` runtime integration
- default selection
- full four-chamber validation
- clinical normality
- joint activation/AVPD parameter identification from LA PV shape alone
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
5. Kockskämper J, et al. [Angiotensin II and myosin light-chain
   phosphorylation contribute to the stretch-induced slow force response in
   human atrial myocardium](https://doi.org/10.1093/cvr/cvn126).
   Cardiovascular Research. 2008;79:642-651.
6. Dalen H, et al. [Reference Values and Distribution of Conventional
   Echocardiographic Doppler Measures and Longitudinal Tissue Doppler
   Velocities in a Population Free From Cardiovascular Disease](https://doi.org/10.1161/CIRCIMAGING.109.926022).
   Circulation: Cardiovascular Imaging. 2010;3:614-622.
7. Lewalle A, et al. [Human atrial skinned muscle fibers exhibit reduced
   length-dependent activation but show faster force development kinetics than
   ventricular muscle](https://doi.org/10.1016/j.yjmcc.2025.12.001).
   Journal of Molecular and Cellular Cardiology. 2026;211:64-77.
8. Wang K, et al. [Atrial electromechanical sequence in normal subjects and
   patients with DDD pacemakers](https://pmc.ncbi.nlm.nih.gov/articles/PMC484047/).
   British Heart Journal. 1995;74:403-407.
9. Bukachi F, et al. [Pulmonary venous flow reversal and its relationship to
   atrial mechanical function in normal subjects](https://academic.oup.com/ehjcimaging/article/6/2/107/2367052).
   European Journal of Echocardiography. 2005;6:107-116.
10. de Marchi SF, et al. [Pulmonary venous flow velocity patterns in 404
    individuals without cardiovascular disease](https://pmc.ncbi.nlm.nih.gov/articles/PMC1729579/).
    Heart. 2001;85:23-29.
11. Chung CS, Karamanoglu M, Kovacs SJ. [Duration of diastole and its phases as
    a function of heart rate during supine bicycle exercise](https://journals.physiology.org/doi/abs/10.1152/ajpheart.00404.2004).
    American Journal of Physiology Heart and Circulatory Physiology.
    2004;287:H2003-H2008.
12. Nagueh SF, et al. [Recommendations for the Evaluation of Left Ventricular
    Diastolic Function by Echocardiography and for HFpEF Diagnosis](https://www.asecho.org/wp-content/uploads/2025/07/Left-Ventricular-Diastolic-Function.pdf).
    Journal of the American Society of Echocardiography. 2025;38:537-569.
13. Cheng TO. [Mechanism of x descent in atrial pressure
    pulse](https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/581532).
    Archives of Internal Medicine. 1973;132:114-115.
14. Barbier P, Solomon SB, Schiller NB, Glantz SA. [Left atrial relaxation and
    left ventricular systolic function determine left atrial reservoir
    function](https://doi.org/10.1161/01.CIR.100.4.427). Circulation.
    1999;100:427-436.
15. Keren G, Sonnenblick EH, LeJemtel TH. [Mitral anulus motion: relation to
    pulmonary venous and transmitral flows in normal subjects and in patients
    with dilated cardiomyopathy](https://doi.org/10.1161/01.CIR.78.3.621).
    Circulation. 1988;78:621-629.
16. Hobson TN, Flewitt JA, Belenkie I, Tyberg JV. [Wave intensity analysis of
    left atrial mechanics and energetics in anesthetized
    dogs](https://doi.org/10.1152/ajpheart.00837.2006). American Journal of
    Physiology Heart and Circulatory Physiology. 2007;292:H1533-H1540.
17. Weiss JL, Frederiksen JW, Weisfeldt ML. [Hemodynamic determinants of the
    time-course of fall in canine left ventricular pressure](https://doi.org/10.1172/JCI108522).
    Journal of Clinical Investigation. 1976;58:751-760.
18. Ishida Y, Meisner JS, Tsujioka K, et al. [Left ventricular filling dynamics:
    influence of left ventricular relaxation and left atrial
    pressure](https://doi.org/10.1161/01.CIR.74.1.187). Circulation.
    1986;74:187-196.
19. Nikolic SD, Yellin EL, Tamura K, et al. [Passive properties of canine left
    ventricle: diastolic stiffness and restoring
    forces](https://doi.org/10.1161/01.RES.62.6.1210). Circulation Research.
    1988;62:1210-1222.
