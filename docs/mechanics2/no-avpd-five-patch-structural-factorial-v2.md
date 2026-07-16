# No-AVPD five-patch structural factorial V2

## Purpose and claim boundary

This research-sidecar asks a model-class question rather than tuning the
existing LA pressure--volume path.  It compares two explicit structural
factors while holding the circulation, prescribed calcium, Land active law,
equilibrium-passive law, one-state parallel SLS, all four dynamic-valve laws,
and total LA wall/reference volumes fixed:

| arm | LA wall topology | external constraint |
| --- | --- | --- |
| `S0/P0` | one aggregate LA wall | none |
| `S0/P1` | one aggregate LA wall | shared pericardium |
| `S1/P0` | common-pressure LA body + LAA walls | none |
| `S1/P1` | common-pressure LA body + LAA walls | shared pericardium |

All four V2 arms share the new dynamic-valve background.  Consequently V2
`S0/P0` is not relabelled as an exact V1 comparator; the unchanged 14-variable
instantaneous-valve V1 remains separately callable and separately tested.  No
arm is wired into `ModelCore` or the browser-visible product runtime.  AVPD,
MAPSE, TAPSE, exact leaflet/sinus-vortex kinematics, LAA ostial flow, LAA
stasis, respiration, autonomic control, and patient calibration are not
claimed.

This first artifact is numerical readiness only.  LA A/V lobe areas and all
displayed morphology are report-only.  They cannot establish physiology until
the predeclared full-state return-map requirement has been met.

## Why these structural factors

Human atrial tissue is nonlinear and anisotropic, and atrial fiber direction
varies regionally and between subjects.  The present one-fiber body/LAA
decomposition is therefore a low-order compartment model, not a claim that
either region is mechanically homogeneous.  Relevant human tissue anchors are
Bellini et al. ([DOI 10.1007/s10439-012-0699-9](https://doi.org/10.1007/s10439-012-0699-9))
and Pashakhanloo et al. ([DOI 10.1161/CIRCEP.116.004133](https://doi.org/10.1161/CIRCEP.116.004133)).

The LAA is selected as the first additional atrial region because it has a
direct intervention record rather than only a waveform association.  Removing
or acutely excluding the LAA increases LA pressure--volume stiffness in an
isolated canine preparation and in human measurements:

- Davis et al. ([DOI 10.1152/ajpheart.1990.259.4.H1006](https://doi.org/10.1152/ajpheart.1990.259.4.H1006));
- Tabata et al. ([DOI 10.1016/S0002-9149(97)00903-X](https://doi.org/10.1016/S0002-9149(97)00903-X));
- Patti et al. ([DOI 10.1016/j.jcin.2018.10.021](https://doi.org/10.1016/j.jcin.2018.10.021));
- Bregasi et al. ([DOI 10.1152/ajpheart.00083.2022](https://doi.org/10.1152/ajpheart.00083.2022)).

The common pericardium is tested separately because it is the owner of global
external constraint and ventricular interaction, not a dedicated LA V-loop
generator.  Human operative measurements support a shared pericardial-pressure
component, while four-chamber mechanics studies show that pericardial
constraint materially changes chamber motion and filling:

- Boltwood et al. ([DOI 10.1016/S0735-1097(86)80299-6](https://doi.org/10.1016/S0735-1097(86)80299-6));
- Hamilton et al. ([DOI 10.1016/j.cjca.2010.12.039](https://doi.org/10.1016/j.cjca.2010.12.039));
- Pfaller et al. ([DOI 10.1007/s10237-018-1098-4](https://doi.org/10.1007/s10237-018-1098-4)).

LA V-loop formation is not assigned to either element alone.  Atrial
relaxation, ventricular relaxation and filling, venous inflow, and longitudinal
heart motion all contribute (Barbier et al.,
[DOI 10.1161/01.CIR.100.4.427](https://doi.org/10.1161/01.CIR.100.4.427);
Bowman and Kovacs,
[DOI 10.1152/ajpheart.00969.2003](https://doi.org/10.1152/ajpheart.00969.2003)).

## Four-valve pressure-driven area memory

The former instantaneous sigmoid area law made effective area and inertance
direct algebraic functions of the same pressure gradient appearing in the
momentum residual.  During AoV closure, its local residual slope can reverse:
at the legacy sigmoid midpoint and $dt=5$ ms, a preceding forward flow of
only about 5.1 mL/s is sufficient for the variable-inertance term to overturn
the unit pressure-gradient slope.  This is a structural fold, not evidence
that Newton tolerances or LA material parameters need retuning.

V2 therefore gives MV, AoV, TV, and PV the same low-order state topology,

\[
A(\xi)=A_{min}+(A_{max}-A_{min})\xi,\qquad 0\le\xi\le1,
\]

\[
\dot\xi=K_o h_\epsilon(\Delta P-P_o)(1-\xi)
-K_c h_\epsilon(P_c-\Delta P)\xi,
\]

\[
\Delta P=L(A)\dot Q+R(A)Q+B(A)Q\sqrt{Q^2+Q_\epsilon^2}.
\]

The exact backward-Euler opening equation is linear in candidate \(\xi\),

\[
\xi_{n+1}=
\frac{\xi_n+dt\,a}{1+dt(a+b)},\quad
a=K_oh_\epsilon(\Delta P-P_o),\quad
b=K_ch_\epsilon(P_c-\Delta P).
\]

It preserves the interval without clipping.  Production evaluates this exact
root at each candidate pressure, which is the Schur complement of the full
opening-state residual rather than an explicit/operator-split update.  Thus
the four accepted \(\xi\) histories are genuine dynamic states and participate
in the full-state return map, while the global solve remains 14 variables (or
15 with the LAA partition).

This follows the pressure-driven low-order class of Mynard et al.
([DOI 10.1002/cnm.1466](https://doi.org/10.1002/cnm.1466)) and the closed-loop
implementation of Rabineau et al.
([DOI 10.3389/fphys.2021.734311](https://doi.org/10.3389/fphys.2021.734311)).
The fixed first-pass prior uses $K_o=K_c=26.7\ \mathrm{mmHg^{-1}s^{-1}}$,
$P_o=P_c=0$, and a 0.05-mmHg C1 drive transition.  At fixed gradients of
+3 and -2 mmHg it gives approximately 29-ms opening and 43-ms closing 90%
times, comparable in scale to rapid normal-human valve motion observed with
high-temporal-resolution imaging (Zhong et al.,
[DOI 10.1002/jmri.27603](https://doi.org/10.1002/jmri.27603)).  These are
literature-informed engineering priors, not a normal-human calibration.

Inertance and Bernoulli loss are derived from one blood density, effective
length, and current area rather than fitted independently,

\[
L=\frac{\rho\ell_{eff}}{A},\qquad B=\frac{\rho}{2A^2}.
\]

The legacy open inertance determines \(\ell_{eff}\) so this comparison changes
the state topology rather than the open-valve load.  $A_{max}$ owns
stenosis/EOA, $A_{min}$ is currently a hydraulic floor (not a claimed normal
regurgitant EROA), $K_o,K_c$ own mobility/timing, and $\ell_{eff}$ owns
inertance.  A PV loop alone must not fit these parameters jointly.  Only the
R/B loss terms are claimed dissipative; because the reduced variable-inertance
law omits explicit leaflet fluid-energy storage, total valve passivity is not
claimed.

## LA body--appendage constraint

There remains one LA blood-volume state, \(V_{LA}\).  At each constitutive
trial it is partitioned algebraically,

\[
V_b + V_a = V_{LA},
\qquad
P_b(V_b,\mathbf{x}_b,Ca) = P_a(V_a,\mathbf{x}_a,Ca).
\]

The body and appendage have separate accepted Land/SLS histories but share the
same prescribed calcium driver and instantaneous cavity pressure.  The LAA
volume partition is the fifteenth global algebraic unknown and
\(P_b-P_a=0\) is the fifteenth residual.  It is retained in the accepted state
only as the next Newton continuation seed; it is not an additional blood-volume
state.  No ostial resistance, inertance, pressure node, or hidden blood
reservoir is introduced.
At the constrained solution,

\[
P_b\,dV_b + P_a\,dV_a = P_{LA}\,dV_{LA},
\]

so the reduced aggregate remains work-conjugate.  The production step solves
the circulation and partition monolithically, enforces the declared 5--30%
partition bounds during line search, and commits both material states only
after the global step is accepted.  A separate bounded scan plus safeguarded
bracketed-secant solver is retained for branch-symmetry, virtual-work,
no-root, and multiple-root diagnostics; it is not nested inside every global
finite-difference evaluation.

The V2 path uses a model-equation predictor for all four valve flows and both
venous-segment flows before global Newton.  Each existing momentum equation is
solved once at the previous accepted volumes and new constitutive forcing.
This selects a nearby physical branch without changing any residual or model
parameter.  The legacy V1 path retains its original initial guess and
numerical trajectory.

The fixed engineering seed assigns 15% of the aggregate reference cavity and
wall material volume to the LAA, permits an instantaneous 5--30% blood-volume
partition, and scales LAA equilibrium-passive and SLS moduli to 40% of the body
prior.  Total reference cavity volume and wall material volume are preserved
exactly.  The direction is informed by LAA exclusion studies, but the numbers
are not a normal-human calibration and are not altered after observing a
V-loop.

## Shared pericardial energy

The algebraic pericardium depends only on four chamber blood volumes and the
explicit myocardial material volumes,

\[
V_h=V_{LA}+V_{LV}+V_{RA}+V_{RV}+\sum_w V_{wall,w}.
\]

With \(x=(V_h-V_{ref})/V_{ref}\) and a C2-smoothed positive part
\(g(x)\), the stored energy is

\[
\Psi_{peri}=P_s\frac{V_{ref}}{k}
\left[\exp\{k g(x)\}-1-k g(x)\right]
+P_b(V_h-V_{ref}),
\]

and the common external pressure is derived from that same scalar potential,

\[
P_{peri}=\frac{\partial\Psi_{peri}}{\partial V_h}.
\]

Thus the four chamber cavity pressures are
\(P_{cav,i}=P_{tm,i}+P_{peri}\).  The common term cancels across the AV
valves but not against the extra-pericardial vascular compartments.  The fixed
prior uses \(V_{ref}=0.95\times606\) mL, \(P_s=500/133.322\) mmHg, and
\(k=8\).  It has no state, dashpot, respiration input, or hidden volume.

## Fixed comparison and interpretation rules

- Every arm starts independently from the same cold circulation coordinate.
- All four valve opening states start closed; the first beat is never used as
  a morphology target.
- Cross-arm warm starts and outcome-adaptive parameter changes are forbidden.
- No scalar score, optimizer, winner ranking, or fallback morphology target is
  computed.
- Mass conservation, pressure-equilibrium residual, finite outputs, and the
  exact full-state return map precede morphology interpretation.
- Raw endpoints are retained and joined without smoothing or resampling.
- A/V loop metrics never change run status.
- A structural effect is credible only if its direction persists after
  periodic settling, time-step refinement, and predeclared HR/load challenges.

The parameters have future patient-specific owners: valve EOA/EROA from
imaging and Doppler, valve opening/closing rates from leaflet timing, effective
length from hydraulic/inertial data, LAA/reference fractions
from CT or 3D echo, regional volume/strain history from cine imaging, material
and SLS terms from multi-load pressure--volume/strain observations, and
pericardial reference volume/constraint from total-heart imaging and pressure
data.  A single LA PV loop is insufficient to identify all of them.

## Current four-beat numerical artifact

The committed HR60, $dt=5$ ms artifact advances all four independently cold
arms for 800/800 steps.  Maximum absolute blood-volume ledger error is below
$2.8\times10^{-12}$ mL, and the two LAA arms keep the body--appendage pressure
mismatch below $9.8\times10^{-8}$ mmHg.  All four dynamic valves traverse
near-closed to near-open states without clipping.

However, none of the four arms establishes the fixed full-state return map:

| arm | return-map max | raw A area | raw V area | raw A/V |
| --- | ---: | ---: | ---: | ---: |
| `S0/P0` | 0.0326 | 53.47 | 1.85 | 28.97 |
| `S0/P1` | 0.1131 | 68.17 | 1.87 | 36.45 |
| `S1/P0` | 0.0835 | 58.36 | 1.34 | 43.62 |
| `S1/P1` | 0.1555 | 87.22 | 1.42 | 61.39 |

Areas are mmHg mL.  These cold-transient geometric readbacks show no evidence
that either the parallel LAA wall or the present common pericardium is
sufficient to enlarge the V lobe; both LAA arms instead have a smaller raw V
area.  Because periodicity is absent, this is a falsification/readiness signal,
not a physiological effect estimate or a basis for ranking an arm.  The raw
report and unsmoothed visual are
[`no-avpd-five-patch-structural-factorial-v2.json`](../../data/mechanics2/reports/no-avpd-five-patch-structural-factorial-v2.json)
and
[`no-avpd-five-patch-structural-factorial-v2.html`](../../data/mechanics2/visuals/no-avpd-five-patch-structural-factorial-v2.html).

## Explicitly deferred alternatives

A dynamic aspect-ratio coordinate is physiologically attractive, but an
unobserved linearized shape-relaxation mode is input--output equivalent to a
one-pole SLS in aggregate PV data.  It is therefore deferred until longitudinal
and circumferential strain or cine shape is available as an independent
observable.  Likewise, LAA ostial resistance/inertance is deferred until LAA
flow or stasis is in scope; it must not be used to manufacture loop area.

The next decision is evidence based: if the fixed LAA/pericardium factorial
does not enlarge a periodic V-loop while preserving the broader physiology
envelope, the result falsifies these elements as sufficient V-loop owners.  It
does not authorize tuning their priors against the desired drawing.
