# No-AVPD four-chamber Hill–TriSeg V1

## Scope and claim boundary

This is a clean-room research sidecar. It does not replace `ModelCore`, the
existing left/right-heart sidecars, or any browser-visible runtime. It contains
four cardiac chambers, four valves, systemic and pulmonary vascular
compartments, pulmonary/systemic venous inflow dynamics, five myocardial wall
patches, and algebraic TriSeg ventricular interaction.
The state-layout and public sidecar model IDs remain V1; the report identifies
the numerical activation revision as equations version
no-avpd-four-chamber-hill-triseg-equations-v2-activation-midpoint.

It deliberately contains no dynamic AV-plane coordinate. MAPSE/TAPSE and
s'/e'/a' are deferred observers, not hidden mechanical or blood-volume states.
Respiration, baroreflex, a distributed pulmonary bed, and a full pericardial
interaction model are also outside V1.

The initial numeric parameter set is an engineering seed. It is not a calibrated
normal-human parameter set and must not be presented as clinically validated.
Each wall material has an explicit engineering parameter-set ID, and the report
embeds the complete parameter snapshot. The prescribed-Ca waveform and
Land-form CaT50 front end have **not** yet been jointly calibrated against
multi-length force--Ca and twitch protocols. Land's human ventricular front-end
values are also an explicit engineering extrapolation when used in LA and RA;
only the atrial Ca waveform is currently distinct.

## Blood-volume ownership

The only blood-volume states are

\[
\mathbf V=(V_{LA},V_{LV},V_{SA},V_{SV},V_{RA},V_{RV},V_{PA},V_{PVe}).
\]

The flow orientation is

\[
PVe\xrightarrow{PVF}LA\xrightarrow{MV}LV
\xrightarrow{AoV}SA\xrightarrow{Q_{sys}}SV
\xrightarrow{SVF}RA\xrightarrow{TV}RV
\xrightarrow{PulmV}PA\xrightarrow{Q_{pul}}PVe.
\]

Backward-Euler mass residuals are assembled pairwise:

\[
\begin{aligned}
r_{LA}&=\Delta V_{LA}-\Delta t(Q_{PVF}-Q_{MV}),\\
r_{LV}&=\Delta V_{LV}-\Delta t(Q_{MV}-Q_{AoV}),\\
r_{SA}&=\Delta V_{SA}-\Delta t(Q_{AoV}-Q_{sys}),\\
r_{SV}&=\Delta V_{SV}-\Delta t(Q_{sys}-Q_{SVF}),\\
r_{RA}&=\Delta V_{RA}-\Delta t(Q_{SVF}-Q_{TV}),\\
r_{RV}&=\Delta V_{RV}-\Delta t(Q_{TV}-Q_{PulmV}),\\
r_{PA}&=\Delta V_{PA}-\Delta t(Q_{PulmV}-Q_{pul}),\\
r_{PVe}&=\Delta V_{PVe}-\Delta t(Q_{pul}-Q_{PVF}).
\end{aligned}
\]

Therefore \(\sum r_i=\Delta V_{TBV}\) algebraically. No activation,
constitutive, SLS, septal, geometry, or observer variable owns blood volume.

## Myocardial wall model

The patches are LA, RA, LV free wall, interventricular septum, and RV free wall.
Each patch uses one fiber, a serial Hill CE–SEE active branch, an equilibrium
passive branch, and one SLS memory arm.

The finite-strain implementation uses a multiplicative fiber-stretch split,
represented additively in natural strain:

\[
\lambda_f=\lambda_{CE}\lambda_{SEE},\qquad
\varepsilon_f=\varepsilon_{CE}+\varepsilon_{SEE}.
\]

The transmitted active stress is not the sum of CE and SEE stresses:

\[
\tau_{CE}=\tau_{SEE},\qquad
\tau=\tau_{pass,eq}+\tau_{SEE}+q_{SLS}.
\]

The CE includes a broad overlap envelope and a finite unloaded shortening velocity. C1
ramps regularize the unloaded-velocity endpoint and the SEE slack transition;
the SEE stress is differentiated from the corresponding smoothed stored-energy
potential. The solver first follows the accepted CE root by an exact-tangent
local Newton continuation. If that physical branch cannot be followed
monotonically, a scale-aware all-root scan around the accepted CE state,
length-factor peak, velocity joins, and SEE slack point selects the nearest
detected admissible root. Both paths evaluate the identical constitutive law;
the local path is only an acceleration. This is a safeguarded continuation
algorithm within the validated fitting envelope, not a mathematical guarantee
of finding every root for arbitrary unbounded parameter combinations. Trial
evaluations do not mutate accepted state. An exactly unloaded zero-force
manifold may be neutrally stable; its accepted representative is the
continuation point rather than a tolerance-run boundary.

The one-state SLS update is

\[
q^{n+1}=\frac{q^n+E_{SLS}(\varepsilon^{n+1}-\varepsilon^n)}
{1+\Delta t/\tau_{SLS}}.
\]

Its stored energy, physical relaxation dissipation, and backward-Euler
numerical dissipation are reported separately. The SLS time constant is a
minimal effective hysteresis parameter, not the LV pressure-decay time
constant. Constitutive parameters are immutable during an accepted trajectory:
parameter fitting or an interactive parameter change must restart the material
state. In particular, an SLS-off configuration rejects a non-zero stored
overstress instead of silently deleting its energy.

## Chamber mechanics

LA and RA use spherical one-fiber geometry. Pressure follows virtual work:

\[
P=V_w\tau_f\frac{\partial\varepsilon_f}{\partial V}.
\]

LV free wall, septum, and RV free wall use the three-spherical-cap TriSeg
geometry of Lumens et al. The common junction radius and signed septal cap
volume are algebraic unknowns. They have no mass or damping. The same wall
generalized-force mapping generates LV/RV pressure and both junction
equilibrium residuals. The default is the literature-faithful Lumens 2009
Eq. 15/16 representative-strain and representative-tension approximation,
whose virtual work is \(\sum_w T_w\,dA_w\). An explicitly opt-in alternative
uses \(\sum_w V_w\sigma_w\,d\varepsilon_{f,w}\) on the same geometry and
fiber stresses. The latter is a variational work-pair alternative, not a
correction to the original TriSeg equations and not a claim that active stress
has a stored-energy potential. Both pressure and junction residuals always use
the selected mapping together. A geometry with one fixed wall tension greater
than the sum of the other two has no force-triangle equilibrium in the Lumens
mapping and must return a safe nonconverged trial.

## Activation

Activation is not a prescribed force or pressure waveform. Each wall uses the
following ownership chain:

```text
periodic activation event
  -> two-state dimensional prescribed free-Ca transient
  -> one-state Land-form CaTRPN occupancy
  -> normalized thin-filament availability
  -> Hill CE--SEE serial equilibrium
```

The prescribed calcium driver owns rise and decay states only. The mechanics2
V2 propagator partitions every absolute-time interval at cycle, delayed-release
onset, and release-end boundaries. On each smooth segment it applies the exact
homogeneous two-state transition and a 16-point Gauss--Legendre convolution of
the raised-cosine forcing. It therefore supplies both endpoint
\(Ca_i^{n+1}\) and interval-midpoint \(Ca_i^{n+1/2}\), in micromolar, before
the global Newton solve; both are held fixed during Newton iterations. The
shared myocardium calcium V1 backward-Euler residual is not modified.

The V1 ventricular seed at HR60 has
diastolic calcium (0.10\,\mu\mathrm M), peak-amplitude target
(0.75\,\mu\mathrm M), rise time 94 ms, decay half-time 155 ms, and release
width 30 ms. The atrial seed uses the same amplitude but faster 65/105/22 ms
rise/decay/release kinetics. These are report-only starting values, not a fitted
normal-human calcium trace. During this numerical-propagator ablation their
existing zero-initial single-pulse V1 normalization and time constants are held
fixed deliberately. Recalibrating an exact-propagator pulse is a separate future
physiology experiment, not mixed into the present numerical comparison.

For every CE root candidate, define the midpoint CE log strain
\(\varepsilon_{CE}^{n+1/2}=(\varepsilon_{CE}^{n}
+\varepsilon_{CE}^{n+1})/2\). The accepted CaTRPN occupancy \(x^n\) is
advanced with an exponential-midpoint (Rush--Larsen) step:

\[
q_m=\left(\frac{Ca_i^{n+1/2}}
{Ca_{T50}(\lambda_{CE}^{n+1/2})}\right)^{n_{TRPN}},
\qquad x_\infty=\frac{q_m}{1+q_m},
\qquad
x^{n+1}=x_\infty+(x^n-x_\infty)
\exp\left[-\Delta t\,k_{TRPN}(1+q_m)\right].
\]

The differentiable Land-form length branch is

\[
Ca_{T50}(\lambda_{CE})=Ca_{T50,ref}
+\beta_1(\lambda_{CE}-1),\qquad \lambda_{CE}<1.2.
\]

The implementation does not clamp the source cap. Hill's admissible CE domain
is strictly below (log 1.2); geometry references were re-normalized as a
coordinate change, with corresponding passive and overlap-reference shifts, so
the initial trajectory has margin below that bound.

Fast tropomyosin regulation is reduced to the normalized equilibrium gate

\[
g(x)=\frac{(1+X_{50}^{m})x^m}{x^m+X_{50}^{m}}.
\]

The default path remains algebraic, \(a^{n+1}=g(x^{n+1})\), so its state
layout and trajectories are unchanged. An opt-in reduced dynamic path adds one
normalized thin-filament availability state per enabled wall,

\[
E_a=\exp(-\Delta t/\tau_a),\qquad
a^{n+1}=E_a a^n+(1-E_a)g(x^{n+1}).
\]

This is the exact endpoint-target-hold update, evaluated inside every CE root
candidate. Its same-step tangent is

\[
\frac{\partial a^{n+1}}{\partial\varepsilon_{CE}^{n+1}}
=(1-E_a)g'(x^{n+1})
\frac{\partial x^{n+1}}{\partial\varepsilon_{CE}^{n+1}}.
\]

Only the selected CE root commits the trial state. Cold initialization places
the optional state at \(g(x^0)\), and the exact beat-boundary return map includes
it. This lag is a deliberately minimal dynamic realization of the reduced
equilibrium gate. It is **not** Land Eq. 48: blocked/unblocked conservation and
the Land \(B,W,S,\zeta_W,\zeta_S\) crossbridge states remain absent. The first
screening value \(\tau_a=25\) ms is an engineering candidate, not a fitted human
atrial kinetic constant.

The serial active law is

\[
T_{CE}=T_{max}\,a^{n+1}\,f_L(\varepsilon_{CE}^{n+1})
f_V\!\left(\frac{\varepsilon_{CE}^{n+1}-\varepsilon_{CE}^n}{\Delta t}\right)
=T_{SEE}.
\]

The exact local tangent includes the endpoint dependence of the midpoint Land
step (including the one-half midpoint chain factor) and all three same-step
active-force terms

\[
\frac{\partial T_{CE}}{\partial\varepsilon_{CE}}
=T_{max}\left(a'f_Lf_V+af_L'f_V+af_L\frac{f_V'}{\Delta t}\right).
\]

Thus length-dependent Ca sensitivity is neither one step late nor multiplied in
post hoc after the CE--SEE solve. The broad (f_L) envelope only limits
out-of-range filament overlap; Land-form (Ca_{T50}) owns the main
length-dependent recruitment. The initial reduced-gate candidate uses
(n_{Tm}=3); the source (n_{Tm}=5) and predeclared (n_{Tm}=2.2) remain
sensitivity candidates at fixed (T_{max}).

LA, RA, LV free wall, septum, and RV free wall have separate event onsets, so
atrial/interventricular or septal dyssynchrony can later be represented without
coupling onset to calcium amplitude, (Ca_{T50}), (T_{max}), or kinetics.

This is prescribed free calcium, not a conserved calcium-cycling model. It has
no SR inventory, RyR refractoriness, SERCA, troponin-buffer feedback to free
calcium, ATP ledger, post-rest potentiation, or cellular calcium-alternans
mechanism. It can expose mechanical/hemodynamic period-2 behavior under a
period-1 calcium input, but it cannot claim to reproduce or exclude true
calcium-cycling alternans.

The optional availability variable is the only additional activation state; no
general CE--SEE or SLS constitutive substep is introduced. SEE kinematics, SLS
state evolution, CE work, stored-energy, and dissipation ledgers retain their
one-global-step definitions. Component tests require the calcium transition to
compose across arbitrary event-aligned partitions, check the exact availability
update and its zero/infinite-time-constant limits, and independently verify the
endpoint CE tangent by centered finite differences.

## Transaction and solver contract

The global unknowns are eight next-step volumes, four next-step valve flows,
PVF, and SVF. Prescribed-Ca trials are staged before the global solve. Local
CaTRPN/CE–SEE/SLS trials and the two TriSeg coordinates are condensed inside
each pure global residual evaluation. A damped, scaled dense Newton solve with
line search is used.

A step is committed only if all of the following pass:

- global residual convergence;
- all five CE–SEE local solves and either loaded-branch stability or an exact
  neutral unloaded-manifold continuation;
- TriSeg algebraic force equilibrium;
- finite, admissible volumes and geometry;
- total blood-volume closure;
- valve/venous momentum residuals;
- passive/SEE/SLS energy and dissipation checks.

On rejection, `output.state` is the exact previous state. A best trial or failed
candidate is never committed. Five calcium-driver states, five CaTRPN/CE/SLS
states, all blood volumes and flows, and the TriSeg continuation cache commit as
one transaction only after all gates pass.

## Acceptance policy

Hard V1 gates are structural:

- eight-compartment volume ledger and total blood-volume conservation;
- CE–SEE force balance and kinematic constraint;
- passive/SEE/SLS thermodynamic checks and explicit CE work accounting;
- TriSeg junction balance and virtual-work identity;
- valve passivity and pressure–flow–inertance residual;
- trial/accepted state separation.

Accordingly, report `status="pass"` has the explicit scope
`structural-numerical-only`. The report embeds the exact parameter snapshot,
cycle length, sampling interval, and flags stating that physiology, limit-cycle
convergence, time-step refinement, and calcium-cycling alternans are not passing
gates for that run.

Time-step refinement and limit-cycle convergence are required before fitted
parameters or morphology are interpreted, but neither is already a passing hard
gate in V1. The bench reports a transparent sampled cycle-to-cycle diagnostic:
for the final two complete beats, it compares the latest sample of the final
beat with the nearest sampled phase in the preceding beat, reports the signed
phase mismatch, all eight compartment-volume drifts, and their maximum absolute
drift. This field is `null` when fewer than two complete beats are available.

When `cycleLengthSec / dtSec` is an integer, the bench additionally captures
the exact accepted state at step-index cycle boundaries and reports one-beat
and two-beat return-map residuals over every accepted state component except
absolute time. The algebraic TriSeg continuation coordinates are included, as
is each wall's optional thin-filament availability state whenever the opt-in
one-state activation lag is used. The algebraic activation form has 46
components; a left-atrial-only lag has 47. Raw max/RMS drift remains separated
by native unit; an absent optional-state group is reported as a zero-count,
zero-drift group rather than omitted. The sampled cycle diagnostic records the
same optional state and reports zero maximum availability drift when no wall
has it. No boundary is interpolated for a noninteger step ratio. This
exact-boundary field is still report-only: V1 applies no threshold and performs
no period-1/period-2 classification, because a small return residual alone does
not establish orbit stability or uniqueness.

The following remain report-only until a defined population, measurement
protocol, parameter-fitting prior, and validation data set are fixed:

- LA figure-eight morphology and x/y depths;
- MV E/A peaks, deceleration time, and diastasis;
- pulmonary venous S/D/Ar morphology;
- chamber pressures, volumes, EF, and stroke-volume ranges;
- absolute septal curvature.
- LVP 50/80/90% peak widths, tip/dome classification, and Ca-to-force phase
  offsets. Shape labels describe only the upper dome above 50% of pulse height,
  and peak offsets are not interpreted as causal propagation delays;
- period-1, period-2-like, drifting, or unsettled waveform classification.

The baseline persona for visual comparison is a supine, resting, sinus-rhythm
adult at HR60 without respiration or autonomic feedback. Report artifacts must
show LA/LV/RV PV loops, LAP/LVP, RAP/RVP, MV/TV flow, PVF, activation, septal
position/curvature, and numeric conservation/energy residuals.

Before any normal-physiology or patient-fitting acceptance, this parameter family
must pass a protocol matrix rather than a waveform-only fit:

- measured periodic Ca nadir, peak, rise/decay timing, and time-step convergence;
- force--Ca curves at multiple CE/sarcomere lengths and isometric twitch timing;
- shortening and eccentric force--velocity protocols;
- quick-release/series-stiffness protocols for SEE;
- independent stress-relaxation data for the SLS arm;
- closed-loop period-1 return maps under dt, dt/2, and dt/4, plus warm-start
  independence.

The current mitral E/A and pulmonary-venous S/D/Ar summaries are fixed-phase
window flow proxies. They are not valve-event-resolved Doppler measurements.

### Event-resolved and time-step diagnostics

The bench also provides a separate, additive event-resolved diagnostic when a
complete cycle is retained at every accepted step. It does not change the
structural status. A smooth valve has no binary leaflet-contact state, so the
primary operational MVO/MVC markers are the upward/downward zero crossings of

\[
P_{atrium}-P_{ventricle}-\Delta P_{opening\ midpoint},
\]

which is exactly the model's 50%-open point. Pressure-gradient zero crossings
and flow zero crossings are retained as distinct readbacks; they must not be
substituted for one another. The scheduled activation event and the prescribed
Ca-release onset are also reported separately. Neither is an ECG P wave, and
the volumetric valve flow is not pulsed-wave Doppler velocity.

E and A peaks, their interpeak minimum, and the a/x/v/y pressure-volume extrema
are extracted from two consecutive, actually observed cycles in event-bounded
windows. No phase-folded cycle is reused as a synthetic future beat. The only
interpolation is piecewise linear interpolation of a declared crossing or
scheduled phase. No smoothing, spline fitting, decimation, or physiology
threshold is applied. Interpeak minimum/E-peak ratio and both prominences remain
continuous readbacks; two peaks are not promoted to separated waves merely
because two local maxima exist. The valve `flowSmoothingMlPerSec` is a numerical
Bernoulli regularizer, not a measurement resolution or physiological E-end; its
auxiliary crossing is labelled accordingly and does not classify E/A
separation. A window-boundary extremum is explicitly marked as censored.

The companion time-step artifact independently cold-starts the same parameter
snapshot and initial-state definition at 200, 400, and 800 steps/cycle. Each
event-anchor cycle contains N+1 raw points, including a distinct final boundary;
the following observed cycle supplies the post-boundary x/v/y windows. Since
the grids are nested, pairs are compared at exact common phase nodes without
waveform interpolation.
Native-unit max and RMS differences, span-normalized descriptive differences,
event shifts, and the fine-pair/coarse-pair change ratio are report-only. The
ratio is not an observed convergence order or an error estimate. Agreement does
not establish accuracy or physiological normality, and an unsettled return map
can confound apparent time-step differences. Main event-topology comparison
includes crossing counts, selection status, presence, and boundary censoring.
The optional tail crossing of the valve numerical regularizer is reported in a
separate auxiliary-topology flag and cannot make the main topology disagree.

The current cold 32-beat 200/400/800-step artifact isolates the activation
integration change without changing any physiological parameter. For the
400-to-800 common-node pair, the principal pre-change versus current results
are:

| Signal                | Endpoint-BE baseline max difference |                  Current max difference | Current difference / joint span |
| --------------------- | ----------------------------------: | --------------------------------------: | ------------------------------: |
| LA free Ca            |          0.0307048 \(\mu\mathrm M\) | \(4.89\times10^{-10}\) \(\mu\mathrm M\) |         \(6.52\times10^{-8}\%\) |
| LA CaTRPN             |                           0.0368555 |                              0.00207716 |                          0.327% |
| LA thin-filament gate |                           0.0903930 |                              0.00519242 |                          0.568% |
| LA SEE tension        |                        0.884792 kPa |                            0.287071 kPa |                           2.59% |
| LAP                   |                       0.428220 mmHg |                           0.159635 mmHg |                           2.31% |
| MV flow               |                        18.4690 mL/s |                            8.33835 mL/s |                           2.64% |

The corresponding CaTRPN and thin-filament fine/coarse change ratios are 0.253
and 0.254; these are descriptive ratios, not asserted convergence orders. The
old and current normalized artifact SHA-256 values are respectively
666669d38bc3ab482cb9e684a9dba4f4e160088c435d0c899b7e6b5d84025b3e and
c2d90cb09305bc467cd69d6c82b67ade2047159f53328fec14dd6c3f5f54d04b.
The midpoint-Ca trace stored on each grid is a method-stage readback at that
grid's own interval midpoint; unlike endpoint states, values attached to a
shared endpoint are not observations at the same physical time and must not be
used as a common-time state-convergence error.

This numerical improvement is not a physiology result. At N=800 the MV
interpeak-minimum/E-peak ratio remains 0.464, the LA x trough remains deep, the
y trough remains shallow, and the reservoir/conduit lobe separation remains
small. Their timing and amplitudes therefore remain report-only targets for the
next, separately identified physiology experiment.

The reproducible commands are:

```sh
npm run verify:no-avpd-four-chamber-dt-refinement-v1 -- \
  --beats 32 --steps-per-cycle 200,400,800
npm run render:no-avpd-four-chamber-dt-refinement-v1
```

The compact JSON is written to
`data/mechanics2/reports/no-avpd-four-chamber-hill-triseg-dt-refinement-v1.json`.
The HTML renderer embeds every raw trace point and verifies the normalized
artifact hash before drawing. To keep the bundle compact it records, but does
not embed, each full source-result body; `sourceRunSha256` is therefore a content
address whose independent recomputation requires retaining the separate full
source result. The parameter snapshot and its verifiable hash are embedded.

Checkpoint compatibility and complete artifact identity use separate hashes.
`implementationSha256` covers only state-transition/equation sources and is the
compatibility key for an exact same-parameter checkpoint. The additional
`harnessImplementationSha256` covers the bench, report-only diagnostics, and
runner as well as the state-transition hash. Therefore a display/diagnostic
change creates a distinct artifact without falsely declaring the numerical
checkpoint state incompatible with unchanged equations.

### Predeclared LV calcium-decay isolation matrix

The first physiology sensitivity experiment changes only the prescribed
calcium decay half-time in the LV free wall and septum. All rate anchors are
scaled together; atrial activation/material, Land kinetics, Hill force--velocity
and SEE parameters, mitral valve, circulation, and RV free-wall calcium remain
fixed. The three candidates (155, 136, and 116 ms at HR60) are independently
cold-started for 32 beats at HR60 with a 5 ms global step and every accepted
step retained for the last two cycles. A one-beat normalized full-state drift
of at most \(10^{-3}\) marks a waveform as ready for _between-candidate
description only_: it changes neither structural status nor physiology
acceptance. No scalar winner score or physiology threshold is applied.

The rationale is deliberately narrower than fitting the visible waveform.
Invasive human data distinguish active LV pressure relaxation from passive
stiffness: Zile et al. reported an isovolumic pressure-decay \(\tau\) of
35\(\pm\)10 ms in controls and 59\(\pm\)14 ms in diastolic heart failure
([DOI 10.1056/NEJMoa032566](https://www.nejm.org/doi/abs/10.1056/NEJMoa032566)).
The model calcium decay half-time is **not** that clinical pressure \(\tau\):
CaTRPN, thin-filament regulation, CE--SEE force transmission, load, and the
selected pressure-fit window intervene between them. Likewise, the single
closed-loop dynamic LV PV trajectory is **not** an EDPVR measurement; passive
stiffness requires separately initialized, activation-controlled loading
protocols.

| HR60 LV/septal Ca decay | Structural/readiness result                                                                                         | MV filling                                                   | LA/LV readbacks                                                                                                                               |
| ----------------------: | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
|                  155 ms | pass; drift \(4.51\times10^{-4}\)                                                                                   | E/A 0.560; valley/E 0.482; flow at atrial Ca release/E 0.490 | free-asymptote pressure-fit \(\tau\) 79.6 ms; EF 0.421; early reservoir filling 0.146; matched-volume reservoir-minus-conduit mean 0.269 mmHg |
|                  136 ms | pass; drift \(3.64\times10^{-4}\)                                                                                   | E/A 0.559; valley/E 0.417; flow at atrial Ca release/E 0.424 | free-asymptote pressure-fit \(\tau\) 71.6 ms; EF 0.403; early reservoir filling 0.153; matched-volume gap mean 0.268 mmHg                     |
|                  116 ms | fail at step 202 (1.01 s): `global-solver:maximum-iterations,final-candidate-invalid`; no complete diagnostic cycle | not interpretable                                            | not interpretable                                                                                                                             |

Thus 136 ms makes the interpeak valley clearer and shortens the model pressure-
decay readbacks, but it does not improve E/A or the matched-volume LA lobe gap;
the y descent becomes shallower (2.06 to 1.83 mmHg) and EF falls. The 116 ms
failure is a structural/numerical failure of this 5 ms protocol, not evidence
of a physiological lower bound. A separate time-step diagnostic completed all
32 beats and 12,800 accepted steps at 2.5 ms with the same 116 ms material/
activation parameters; its final one-beat normalized full-state drift was
$3.78\times10^{-4}$. This localizes the failure to the combination of the
116 ms candidate and the coarser 5 ms solve much more strongly, although it
does not by itself prove convergence order or identify the failed Newton mode.
These mixed effects preclude selecting a winner.

The interpretation also keeps pressure, flow, and volume observations
separate. Normal-human simultaneous LA pressure--volume data place a meaningful
fraction of reservoir filling between minimum volume and the x trough (about
37% in the protocol reported by Toma et al.;
[PubMed 3652092](https://pubmed.ncbi.nlm.nih.gov/3652092/)), whereas this matrix
gives only 14.6--15.3%. Courtois et al.'s simultaneous pressure/Doppler study
shows that regional LV pressure gradients and pressure-crossover timing matter
for E-wave interpretation, although that experiment was performed in dogs
([DOI 10.1161/01.CIR.78.3.661](https://doi.org/10.1161/01.CIR.78.3.661)).
Human measurements by Nakatani et al. show that mitral inertance can make flow
lag the transvalvular pressure gradient and cannot be discarded when reading
E-wave deceleration
([PubMed 11179082](https://pubmed.ncbi.nlm.nih.gov/11179082/)).

The report therefore preserves both pressure quantities instead of forcing a
single interpretation. Raw (P_{LA}-P_{LV}) remains positive from E peak to
the interpeak valley in both passing candidates, so it has no post-E zero
crossing or reverse-gradient area. The model valve acceleration head,

\[
P_{LA}-P_{LV}-R_{MV}(A)Q_{MV}
-B_{MV}(A)Q_{MV}\sqrt{Q_{MV}^{2}+Q_{smooth}^{2}},
\]

does cross zero immediately after E peak (76.6 ms after MVO for 155 ms and
75.8 ms for 136 ms) and has a negative E-to-valley area (0.0214 and
0.0242 mmHg s). Thus the E-wave deceleration is dynamically consistent with
the implemented inertial valve equation even though the raw chamber-pressure
difference does not reverse. This is a model-accounting result, not validation
of the selected resistance, Bernoulli, or inertance parameters.

The next experiments therefore remain sequential: first bracket the LV active-
relaxation change at finer time step and establish whether the 116 ms failure is
numerical; next measure passive LV behavior with a true EDPVR-style component
protocol; then vary LA passive/SLS properties; and only after those owners are
identified vary pulmonary loading while preserving total blood volume and mean
loading conditions. Mitral parameters should be revisited only after comparing
the now-explicit inertial pressure-head diagnostic with simultaneous pressure--
flow evidence. Changing all of these axes together would destroy causal
attribution.

The reproducible matrix command is:

```sh
npm run verify:no-avpd-physiology-matrix-v1
```

Its compact report is written to
`data/mechanics2/reports/no-avpd-physiology-matrix-v1.json`; the compressed full
candidate reports remain content-addressed under
`data/mechanics2/reports/no-avpd-physiology-matrix-v1/candidates/`.

The 116 ms fail/pass observation is also retained as a dedicated diagnostic,
not merely as an ad hoc rerun:

```sh
npm run verify:no-avpd-116ms-dt-interaction-v1
```

The compact artifact is
`data/mechanics2/reports/no-avpd-lv-ca-decay-116ms-dt-interaction-v1.json`, with
the two full source reports stored as content-addressed gzip evidence in the
adjacent directory. It reproduces the 5 ms failure at step index 202 after
1.01 s and the independent-cold 2.5 ms completion of all 12,800 accepted steps
with one-beat normalized drift $3.78\times10^{-4}$. Two time steps, one of
which fails, cannot establish a convergence order, an error estimate, waveform
accuracy, or physiology acceptance; the artifact intentionally computes none
of those quantities.

### Fully relaxed passive LV--TriSeg component relation

The dynamic diastolic limb of a closed-loop LV PV trajectory is not an EDPVR.
It contains residual CE--SEE tension, SLS history, RV/septal interaction,
valve-flow dynamics, and changing atrial and vascular loads. To isolate the
equilibrium-passive owner, the component bench independently solves

\[
P_{LV}^{tm}\!\left(V_{LV}\mid P_{RV}^{tm}=5\ \mathrm{mmHg},\ P_{ext}=0\right)
\]

at $V_{LV}=60,65,\ldots,180$ mL. Activation, CE--SEE tension, and SLS
overstress are exactly zero in all three ventricular walls; the septal cap and
junction radius remain free TriSeg algebraic coordinates. An outer RV-volume
solve holds the declared RV transmural pressure. A point is unavailable if any
inner scan solve fails and ambiguous if the sampled pressure is non-monotone or
has multiple root brackets. Even a successful point establishes uniqueness
only on that declared discrete scan and stationary TriSeg branch, not a global
energy minimum.

All 25 default-seed points are available and monotone. The readback is:

| $V_{LV}$ (mL) | $P_{LV}^{tm}$ (mmHg) | centered $dP/dV$ (mmHg/mL) | required $V_{RV}$ (mL) |
| ------------: | -------------------: | -------------------------: | ---------------------: |
|            60 |                2.443 |                   boundary |                 319.32 |
|           100 |                5.340 |                     0.0772 |                 311.93 |
|           140 |                8.736 |                     0.0929 |                 304.96 |
|           150 |                9.684 |                     0.0967 |                 303.68 |
|           160 |               10.669 |                     0.1003 |                 302.61 |
|           180 |               12.742 |                   boundary |                 300.95 |

Across the interior grid, $dP/dV=0.0703$--$0.1053$ mmHg/mL. Thus the
current passive LV--septal relation is neither flat nor a sufficient explanation
by itself for the visually broad dynamic filling limb. This is not yet a claim
of normal-human stiffness. Klotz et al. derived a normalized EDPVR shape from
80 ex vivo human hearts and emphasized that single-beat reconstruction must be
anchored by a measured pressure--volume point and estimated zero-pressure
volume; their group-level method was less accurate for individual hearts
([DOI 10.1152/ajpheart.01240.2005](https://doi.org/10.1152/ajpheart.01240.2005)).
The present slice has neither a subject-specific anchor nor a declared body
surface area and fixes RV load, so direct numerical normality grading against
that curve would overclaim.

Maintaining $P_{RV}^{tm}=5$ mmHg requires $V_{RV}=301$--319 mL throughout
this slice. This must **not** be compared directly with the approximately
131 mL phase-zero RV volume of the settled closed loop: the latter has
$P_{RV}^{tm}=1.467$ mmHg and retains RVFW SEE tension and SLS overstress. At
the load-matched component point
$V_{LV}=149.42$ mL and $P_{RV}^{tm}=1.467$ mmHg, the fully relaxed solution
instead requires $V_{RV}=151.08$ mL, gives $P_{LV}^{tm}=9.244$ mmHg, and has
septal-cap volume 21.58 mL. The dynamic/component difference is therefore of
order 20 mL under matched load, while most of the apparent 131-versus-305 mL
difference was a boundary-condition mismatch. Phase zero is also a numerical
cycle boundary, not automatically the physiological end-diastolic event.

A uniform constant external pressure cannot repair or even change this fixed-
transmural relation. With $P_{cav}=P_{tm}+P_{ext}$, a common $P_{ext}$ is a
gauge shift when the root condition remains $P_{RV}^{tm}=\mathrm{constant}$;
RV volume, LV transmural pressure, and TriSeg equilibrium must be invariant.
A volume-dependent pericardial potential can alter closed-loop absolute loading,
and a fixed-_cavitary_-pressure protocol would change when $P_{ext}$ changes,
but those are different experiments. The 300 mL marker is therefore retained
only as search-headroom warning for the 5 mmHg transmural stress slice, not as
evidence by itself of a missing pericardium or abnormal RV stiffness.

The reproducible component artifacts are:

```sh
npm run verify:no-avpd-passive-lv-edpvr-v1
npm run render:no-avpd-passive-lv-edpvr-v1
```

They write
`data/mechanics2/reports/no-avpd-passive-lv-edpvr-v1.json` and
`data/mechanics2/visuals/no-avpd-passive-lv-edpvr-v1.html`. All plotted points
are the raw independent equilibrium solutions; no smoothing, decimation, or
renderer-side derivative reconstruction is applied.

### Passive RV-load and RVFW-stiffness owner matrix

The report-only owner matrix reuses the unchanged fully relaxed component bench
above and separates two one-factor families. The load family holds the RV free-
wall passive tangent modulus at $1\times$ while setting
$P_{RV}^{tm}=1.5,2,$ or $5$ mmHg. The stiffness family holds
$P_{RV}^{tm}=5$ mmHg while scaling that modulus by $0.5\times$, $1\times$, or
$2\times$. The latter are log-symmetric engineering probes around the seed,
not physiological bounds. The two family declarations share the identical
$(5\ \mathrm{mmHg},1\times)$ reference, so six declared candidates require
only five unique bench executions.

All 25 LV-volume points in each unique execution are available, monotone in LV
pressure, and retained without smoothing or decimation. The current artifact
reports the following ranges across $V_{LV}=60$--180 mL:

| $P_{RV}^{tm}$ (mmHg) | RVFW tangent scale | required $V_{RV}$ (mL) | $P_{LV}^{tm}$ (mmHg) | septal-cap volume (mL) | centered $dP/dV$ (mmHg/mL) |
| -------------------: | -----------------: | ---------------------: | -------------------: | ---------------------: | -------------------------: |
|                  1.5 |          $1\times$ |         152.11--169.67 |        1.585--12.521 |            0.89--24.91 |             0.0551--0.1094 |
|                  2.0 |          $1\times$ |         175.91--194.69 |        1.804--12.542 |           -1.63--24.05 |             0.0568--0.1091 |
|                  5.0 |        $0.5\times$ |         448.26--464.20 |        2.331--12.675 |           -9.57--17.48 |             0.0717--0.1047 |
|                  5.0 |          $1\times$ |         300.95--319.32 |        2.443--12.742 |           -9.97--18.00 |             0.0703--0.1053 |
|                  5.0 |          $2\times$ |         206.70--227.46 |        2.549--12.800 |          -10.37--18.46 |             0.0688--0.1058 |

This matrix selects no scalar winner and applies no physiology gate. In
particular, 5 mmHg is retained as a high-distension stress slice, not asserted
to be a normal resting RV end-diastolic transmural pressure. Healthy RV-volume
reference values depend on body-surface-area indexing, age, and sex
([Maceira et al., PubMed 17088316](https://pubmed.ncbi.nlm.nih.gov/17088316/)),
while this sidecar has no declared BSA or subject-specific volume convention.
Rain et al.'s exponential RV EDPVR fit is useful as a protocol precedent, but
its control group comprised seven subjects and the relation was reconstructed
from intracavitary, single-beat measurements; it is not a direct target for the
present wall modulus
([PubMed 24056688](https://pubmed.ncbi.nlm.nih.gov/24056688/)). The matrix
therefore reads the outputs as coupled biventricular quantities, consistent
with the TriSeg interaction described by Lumens et al.
([PMC2758607](https://pmc.ncbi.nlm.nih.gov/articles/PMC2758607/)).

Two structural boundaries remain explicit. First, at fixed transmural load a
uniform constant $P_{ext}$ is a gauge shift, so invariance to that shift is a
negative-control identity rather than another sensitivity axis. Second, in
this passive branch the reference midwall area and passive reference strain
enter through the effective reference
$A_{ref,eff}=A_{ref}\exp(2\varepsilon_0)$; they are not independently
identifiable here. Wall volume, septal parameters, reference geometry, and a
volume-dependent pericardial pressure are not covered by this matrix.

The reproducible report and renderer commands are:

```sh
npm run verify:no-avpd-passive-rv-owner-sensitivity-v1
npm run render:no-avpd-passive-rv-owner-sensitivity-v1
```

They write
`data/mechanics2/reports/no-avpd-passive-rv-owner-sensitivity-v1.json` and
`data/mechanics2/visuals/no-avpd-passive-rv-owner-sensitivity-v1.html`.

## LA morphology owner screen

The first LA-specific screen keeps the circulation, valves, ventricular
materials, activation timing, and all non-LA walls fixed. It is evidence-only:
E/A separation is neither an objective nor a gate, no scalar winner is chosen,
and the 2.5 ms confirmation is reserved for a separately promoted candidate.

| Candidate | Single changed owner          | Structural result | Matched V-gap area (mmHg mL) | Matched width (mL) | A primary-turn angle | Late rebound (mmHg) |
| --------- | ----------------------------- | ----------------- | ---------------------------: | -----------------: | -------------------: | ------------------: |
| B         | none                          | pass              |                        3.077 |             11.976 |                67.6° |               0.717 |
| V1        | LA SLS 4 to 8 kPa             | pass              |                        3.684 |             11.735 |                68.5° |               0.719 |
| A1        | LA Ca decay 105 to 90 ms      | pass              |                        2.680 |             12.967 |                44.4° |               0.648 |
| A2        | LA thin-filament nTm 3 to 2.2 | fail at step 204  |                            — |                  — |                    — |                   — |

V1 increases the matched-volume V-gap area by about 20% and its mean pressure
gap by about 22%, with essentially unchanged EF, but it does not round the A
corner. A1 reduces the local turn from 67.6° to 44.4° and the late rebound by
about 10%, but shrinks the V-gap area by about 13%. This establishes two
separable parameter owners; it does not justify combining or accepting them
before the upstream ventricular work mapping is settled. A2's 5 ms line-search
failure is a numerical result, not evidence that nTm 2.2 is physiologically
inadmissible.

The baseline matched-volume gap decomposes into 0.203 mmHg from CE--SEE series
tension, 0.066 mmHg from SLS overstress, and approximately zero from the
equilibrium passive spring. The pumping path contains a raw max--min--max
sequence, 12.099 to 10.936 to 11.653 mmHg. At the late maximum the thin-filament
availability has fallen, while the force--velocity factor and series tension
have recovered; the second shoulder is therefore associated with the active
tail and force--velocity branch rather than the SLS arm.

Changing calcium decay does not repair the very fast leading edge. Across B,
V1, and A1, thin-filament 10--90% rise remains 13.2--14.0 ms and total-LAP
10--90% rise remains about 16.2 ms. Published human atrial experimental values
compiled for model calibration place time-to-peak tension around 78--112 ms and
50% relaxation around 75--103 ms
([PMC6297809](https://pmc.ncbi.nlm.nih.gov/articles/PMC6297809/)). This is not a
direct chamber-pressure calibration, but it makes the present algebraic
thin-filament gate a higher-priority structural question than further corner
fitting.

The supplied LA1/5/10/11 comparison remains qualitative. It used an artificial
silicone atrium, a rigid piston-driven ventricle and annulus, externally imposed
atrial pressurization, and a 150-sample centered moving average at 1 kHz; its
rounded corners and absolute loop areas are not normal-human targets
([Meskin et al. 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC10803730/)).
Likewise, a zero-flow valley between E and A is not a universal normality rule:
healthy exercise measurements can contain fused waves, and healthy resting E/A
depends strongly on heart rate and age
([RIGHT-NET](https://pubmed.ncbi.nlm.nih.gov/40182403/),
[normal filling study](https://pubmed.ncbi.nlm.nih.gov/3350026/)). The continuous
valley/E, overlap, duration, and peak/VTI readbacks are retained for causal
context only.

The compact artifact is
`data/mechanics2/reports/no-avpd-atrial-morphology-owner-screen-v1.json`; each
candidate's complete source result is stored beside it as a compressed,
content-addressed file. Reproduce it with
`npm run verify:no-avpd-atrial-morphology-owner-screen-v1`.

### Dynamic thin-filament availability × LA SLS 2×2

The follow-up matrix changes only two LA-wall factors: algebraic versus the
one-state 25 ms availability lag, and SLS modulus 4 versus 8 kPa. All four arms
use independent cold starts, 32 beats at HR60, raw 5 ms accepted endpoints, the
Lumens 2009 TriSeg mapping, and the same global Newton policy. E/A is retained
only as continuous context and is neither an objective, gate, nor ranking term.

Initial runs with the ordinary two-accepted-iteration Jacobian reuse policy
failed only in the lag arms near phase 0.025. Exact replay of each failed next
step showed that a fresh Jacobian accepted both steps in eight iterations,
whereas increasing the iteration cap alone did not rescue LAG25_SLS8 and a
smaller line-search floor did not rescue either failure. The declared matrix
therefore uses a fresh finite-difference Jacobian on every Newton iteration for
**all four arms**, while retaining the 14-iteration cap and 5 ms step. Under
that common numerical protocol every arm accepted all 6400 steps:

| Candidate  | Structural result | 1-beat full-state drift | V-gap area (mmHg mL) | A primary corner | Ca release to primary LAP peak | thin-filament 10--90 | LAP 10--90 | A rebound (mmHg) |
| ---------- | ----------------- | ----------------------: | -------------------: | ---------------: | -----------------------------: | -------------------: | ---------: | ---------------: |
| ALG_SLS4   | pass, 6400/6400   |  \(4.506\times10^{-4}\) |                3.077 |            67.6° |                          37 ms |             13.24 ms |   16.21 ms |            0.717 |
| ALG_SLS8   | pass, 6400/6400   |  \(5.052\times10^{-4}\) |                3.684 |            68.5° |                          37 ms |             13.24 ms |   16.21 ms |            0.719 |
| LAG25_SLS4 | pass, 6400/6400   |  \(2.703\times10^{-4}\) |                2.215 |            22.6° |                          52 ms |             25.07 ms |   20.87 ms |            0.839 |
| LAG25_SLS8 | pass, 6400/6400   |  \(2.973\times10^{-4}\) |                2.825 |            22.5° |                          52 ms |             25.07 ms |   20.81 ms |            0.837 |

The lag removes about 45° from the local A-loop turn and reduces the maximum
raw LA series-tension step from about 2.77 to 1.74 kPa, with no CE-strain jump
or root-switch signature in the retained cycle. This supports the diagnosis
that the sharp corner was primarily an instantaneous-regulation artifact. The
primary-peak remaining-volume fraction changes only from 0.920 to 0.876, so
even with the lag the primary pressure peak still precedes most active atrial
emptying; the old left-shifted \(r_{P_a}\approx0.14\) failure is not recreated.
It
does not yet validate \(\tau_a=25\) ms: the resulting 25 ms thin-filament 10--90
rise remains much shorter than the published 78--112 ms human atrial cellular
time-to-peak-tension range, and chamber-pressure rise is not interchangeable
with an isometric single-cell twitch.

The tradeoff is explicit. At either SLS level the lag shrinks matched-volume
V-gap area by about 0.86 mmHg mL. Raising SLS from 4 to 8 kPa restores about
0.61 mmHg mL with negligible effect on A-corner rounding. LAG25_SLS8 is thus
the most useful **next confirmation candidate** for the stated combination of
a rounder A-loop and a larger V-loop; it is not an accepted physiological fit,
an automatic winner, or a new default. Before promotion it needs a predeclared
time-step confirmation and loading/heart-rate checks, followed by calibration
against human atrial mechanics rather than the mock-loop curve alone.

The compact artifact is
`data/mechanics2/reports/no-avpd-atrial-thin-filament-sls-matrix-v1.json`; the
four complete compressed sources are stored in the adjacent candidate
directory. The raw-cycle visual is
`data/mechanics2/visuals/no-avpd-atrial-thin-filament-sls-matrix-v1.html`.
Reproduce both with
`npm run verify:no-avpd-atrial-thin-filament-sls-matrix-v1` and
`npm run render:no-avpd-atrial-thin-filament-sls-matrix-v1`.

## TriSeg generalized-force mapping audit

An independent report-only audit compares the literature-faithful Lumens 2009
Eq. 15/16 representative-wall mapping

\[
Q_q^{area}=\sum_w T_w\frac{\partial A_w}{\partial q}
\]

with the opt-in full-fiber generalized-force alternative,

\[
Q_q^{fiber}=\sum_w V_{w}\sigma_w
\frac{\partial\varepsilon_{f,w}}{\partial q}.
\]

The Lumens `T*dA` virtual-work check closes to numerical precision because both
routes use the same representative-tension area mapping. The full-fiber
directional derivative is a different mapping definition, so equality between
the two is neither assumed nor required. At four settled-cycle points, the
full-fiber minus Lumens values are:

| Point         | LV pressure (mmHg) | RV pressure (mmHg) | Septal-cap residual (mmHg) | Junction-radius residual (N) |
| ------------- | -----------------: | -----------------: | -------------------------: | ---------------------------: |
| systolic peak |              1.083 |             0.0545 |                    -19.754 |                        6.273 |
| MVO50         |              0.119 |             0.0042 |                     -1.424 |                        0.616 |
| E peak        |              0.085 |             0.0023 |                     -1.071 |                        0.476 |
| A peak        |              0.067 |             0.0017 |                     -0.980 |                        0.449 |

The mismatch is also nonzero at all 36 passive-grid points. As an independent
identity, finite differences of the simple potential
`Psi = 0.5*K*epsilon_f^2` agree with `Vw*sigma*d(epsilon_f)/dq` to a maximum
relative residual of $2.35\times10^{-8}$, while the Lumens area mapping remains
different. This verifies the passive quadratic test identity for the opt-in
work pair; it does not make that mapping a correction, prove an active-stress
potential, or select a physiological winner. The numerical divergence is
therefore report-only mapping-definition evidence, not a blocking structural
failure. The audit changes neither physics, parameters, equilibrium, nor
acceptance status.

The audit artifact is
`data/mechanics2/reports/no-avpd-triseg-fiber-work-audit-v1.json`. Reproduce it
with `npm run verify:no-avpd-triseg-fiber-work-audit-v1`. The artifact records
the source and current model implementation hashes separately plus
`sourceImplementationMatchesCurrent`; a false value marks historical,
content-addressed report-only evidence rather than a current-run result.

### TriSeg mapping A/B

The canonical mapping comparison used independent passive-reequilibrated cold
starts, 32 beats at HR60, and a 5 ms step. Both the Lumens and full-fiber
candidates passed passive equilibrium and all 6400 closed-loop steps, with no
cross-mapping warm checkpoint and byte-identical non-mapping parameters. At the
fixed passive biventricular volumes, full-fiber minus Lumens was:

| Passive readback       |    Difference |
| ---------------------- | ------------: |
| junction radius        |   -0.07393 cm |
| septal cap volume      |    +2.0378 mL |
| LV transmural pressure | +0.03263 mmHg |
| RV transmural pressure | +0.09236 mmHg |

The exact one-beat maximum normalized state drift was
\(4.506\times10^{-4}\) for Lumens and \(4.696\times10^{-4}\) for full-fiber.
Relative to Lumens, full-fiber used 127 more global iterations, 824 fewer
global residual evaluations, 23 fewer Jacobian evaluations, and 629 fewer line
search backtracks. These mixed, small structural-numerical differences do not
select a physiological winner. E/A remains report-only and was not used for
gating or ranking; the default therefore remains the literature-faithful Lumens
mapping. The canonical compact artifact is
`data/mechanics2/reports/no-avpd-triseg-mapping-ab-v1.json`. Reproduce it with
`npm run verify:no-avpd-triseg-mapping-ab-v1`.

## Validation acceleration and fitting boundary

The intended fitting workflow is multi-fidelity. This is a promotion policy for
spending computation on plausible candidates; it does not weaken any structural
gate or turn a low-fidelity result into physiological evidence. The current V1
bench exposes some of the required building blocks, but it does not yet provide
an outer fitting API or automatically promote candidates between the following
levels.

| Fidelity | Required work                                                                                                                                              | Permitted conclusion                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| F0       | Parameter-domain, prior, convexity/passivity, state-domain, and component-protocol checks without a closed-loop run                                        | Reject an inadmissible candidate before simulation                                                      |
| F1       | Short closed-loop screening, compact online metrics, and the cheapest predeclared time step that remains inside all numerical sampling limits              | Reject or rank candidates; no morphology or normal-physiology acceptance                                |
| F2       | Standard-fidelity closed loop, a protocol-defined periodic-state tolerance, and the ordinary morphology/haemodynamic residual set                          | Short-list a candidate for confirmation; current V1 reports rather than hard-gates periodic convergence |
| F3       | Cold-start confirmation at a 1 ms reference step plus the declared refinement subset, multiple load/heart-rate protocols, and cold/warm-start independence | Eligible for acceptance only after all scientific and structural gates pass                             |

A failure at a higher fidelity overrides a lower-fidelity ranking. Hard failures
and the smooth residual objective must remain separate: feasibility gates reject
a candidate, whereas continuous pressure, flow, timing, work, and prior
residuals guide an optimizer. Discrete shape labels, intersection counts, and
pass/fail badges must not be inserted directly into a nominally smooth least-
squares objective.

### Accelerations already allowed in V1

The global sidecar uses a modified-Newton policy within each time step. The
finite-difference Jacobian may be reused for at most two accepted Newton updates,
is invalidated when the accepted residual ratio exceeds 0.75, and a failed step
using a stale Jacobian is retried once with a fresh Jacobian. This is an
algebraically equivalent solver acceleration, not a change to the constitutive
or circulation equations. Jacobian builds, reused iterations, fresh retries,
residual evaluations, and line-search backtracks are retained in the report.
There is no cross-time-step factorization reuse in V1.

An accepted cycle-boundary report may also be resumed as an exact checkpoint,
but only when parameter hash, implementation hash, model/equation/state-layout/
rhythm identifiers, cycle length, time step, total-blood-volume class, and source
artifact integrity match. It therefore continues the **same parameter and time-
step trajectory**; it is not parameter continuation. A warm checkpoint reduces
repeated settling work, but `warmStartIsAcceptanceEvidence=false`: it cannot
establish uniqueness, period-1 stability, or absence of another cold-start
attractor. F3 must include an independent cold-start result.

During settling and candidate screening, dense samples should be retained only
for the last two complete beats plus the final cycle boundary. Earlier beats are
represented by online hard diagnostics and deterministic solver-work counters;
the retained final beats supply the sampled cycle comparison. Full transient
retention is opt-in when a protocol needs it. Compact retention changes only the
artifact size, never the accepted state, residual evaluations, or commit gates.

### Time-step coarsening limit

Time-step coarsening is a screening device, not a model reduction. The prescribed
calcium driver retains the first hard resolution bound,

\[
\Delta t\leq
\min_p\frac{w_{\mathrm{release},p}(CL)}{N_{\min,p}},
\]

and rejects a step that violates it. With the current HR60 atrial seed this bound
is 5.5 ms; over the declared 0.6--1.0 s seed range the strictest bound is 4.5 ms.
The V2 calcium propagator resolves event boundaries internally, but this global
guard remains as a conservative mechanics-resolution policy. Passing it is
necessary but not evidence of accuracy: the midpoint Land step, backward-Euler
SLS and circulation updates, finite-difference CE velocity, valve inertance,
and event timing can all remain time-step sensitive. Consequently an
F1 coarse run may only reject or rank. F2/F3 results must be recomputed at their
declared steps, and final interpretation requires the predeclared refinement
comparison rather than agreement at one coarse step.

### Artifact identity and future optimization work

Within the future F0--F3 outer protocol, every retained result must identify its
fidelity, parameter snapshot and parameter SHA-256, implementation SHA-256,
normalized artifact SHA-256, model/equation/state-layout/rhythm IDs, time step,
beat and sampling policy, initialization mode, checkpoint source, and
deterministic solver-work counters. Promotion records must additionally identify
the parent candidate and exact residual/prior definition. Results with different
hashes are distinct experiments, not interchangeable cache entries.

The current dense finite-difference global Jacobian remains the reference path.
An analytic/block Jacobian, Schur-complement solve, cross-step factorization,
parameter-continuation cache, and persistent worker pool are deferred until an
outer fitting API fixes candidate identity, fidelity selection, smooth residuals,
hard gates, cancellation, and provenance. Only then can profiling determine the
correct parallel unit (normally a nearby candidate chain per worker) and parity
tests can prevent an optimized path from silently changing the accepted model.

## Primary references

- Lumens J et al. Three-wall segment (TriSeg) model. _Ann Biomed Eng._ 2009.
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC2758607/>
- Toma Y et al. Simultaneous normal-human LA pressure and volume analysis.
  _Circulation._ 1987. <https://pubmed.ncbi.nlm.nih.gov/3652092/>
- Caballero L et al. NORRE normal Doppler reference ranges. _Eur Heart J
  Cardiovasc Imaging._ 2015. <https://doi.org/10.1093/ehjci/jev083>
- Smiseth OA et al. Mechanisms of pulmonary venous flow. _J Am Coll Cardiol._ 1999. <https://www.jacc.org/doi/full/10.1016/S0735-1097%2899%2900300-9>
- Sonnenblick EH. Series elasticity in heart muscle. _Am J Physiol._ 1964.
  <https://doi.org/10.1152/ajplegacy.1964.207.6.1330>
- Land S et al. Human cardiomyocyte contraction model and length-dependent
  CaTRPN regulation. _J Mol Cell Cardiol._ 2017.
  <https://doi.org/10.1016/j.yjmcc.2017.03.008>
- Niederer SA et al. Length-dependent tension development in rat cardiac
  trabeculae. _Biophys J._ 2006.
  <https://doi.org/10.1529/biophysj.105.069534>
- Rice JJ et al. Approximate cardiac myofilament activation model. _Biophys J._ 2008. <https://doi.org/10.1529/biophysj.107.119487>
