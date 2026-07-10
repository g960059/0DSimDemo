# Mechanistic atrial one-fiber and shared AV-plane model v1

Status: experimental sidecar vertical slice. It is not wired into the runtime default.

## 1. Design objective

This model tests whether left-atrial reservoir, conduit, and pumping behavior can emerge from a small set of physical mechanisms:

1. blood-volume conservation;
2. a one-fiber wall law derived by virtual work;
3. a single AV-plane coordinate shared by LA and LV;
4. finite-inertance smooth valves;
5. a dynamic pulmonary-venous node and volume-conserving return reservoir; and
6. Kelvin-Voigt wall dissipation.

It deliberately excludes branch-specific pressure offsets and hidden reservoir/receiver states. In particular, the implementation has no `P_mem`, `P_relief`, `P_LV_recv`, reservoir-capacity state, conduit state, or phase-owned pressure source.

The implementation is independent of `LeftHeartSubsystemV2`. Its current boundary is a closed single-heart return circuit, not the full four-chamber circuit.

## 2. State and ownership

The physical state is

\[
\mathbf{x}=
\left[
V_{LA},V_{LV},z_{AV},u_{AV},Q_{MV},Q_{AoV},P_{PV},Q_{PV},P_{Ao},P_R,a_{LA},a_{LV}
\right]^T.
\]

`z_AV` is apexward positive and `u_AV` is its velocity. This is one mechanical degree of freedom with position and velocity states, not an atrial reservoir-memory state.

The chamber blood-volume ledgers are

\[
\dot V_{LA}=Q_{PV}-Q_{MV},
\qquad
\dot V_{LV}=Q_{MV}-Q_{AoV}.
\]

These blood volumes own the physiology-facing PV axes. AV-plane displacement never creates or removes blood volume.

## 3. Shared moving boundary

The AV-plane changes the deformation coordinate seen by each wall:

\[
\widetilde V_{LA}=V_{LA}-A_{LA}(z_{AV}-z_0),
\]

\[
\widetilde V_{LV}=V_{LV}+A_{LV}(z_{AV}-z_0).
\]

Thus apexward descent increases LA geometric capacity and decreases LV geometric capacity without changing either blood-volume ledger.

The AV-plane follows an inertial piston balance:

\[
\dot z_{AV}=u_{AV},
\]

\[
M_{AV}\dot u_{AV}
=F_{LV,long}^{act}-F_{LA,long}^{act}
+c_P\left(A_{LA}P_{LA,tm}-A_{LV}P_{LV,tm}\right)
-D_{AV}u_{AV}-K_{AV}(z_{AV}-z_0).
\]

where `c_P` converts `mmHg cm^2` to N. Longitudinal active forces come from the same active wall stress used to make chamber pressure:

\[
F_{i,long}^{act}
=c_\sigma\,\sigma_{i,act}A_{i,long}\gamma_i.
\]

The longitudinal force is therefore not an independent trapezoid, receiver pressure, or fitted time waveform. Restoring force, damping, and generalized inertance act on the same measurable AV-plane coordinate. The velocity state was retained because the overdamped reduction made recoil instantaneous and could not simultaneously preserve AVPD, conduit ordering, and a finite figure-eight crossing.

## 4. One-fiber chamber wall

For chamber wall volume `V_w`, define the one-fiber extension

\[
\lambda(\widetilde V)
=\left(1+\frac{3\widetilde V}{V_w}\right)^{1/3},
\qquad
\lambda_0
=\left(1+\frac{3V_0}{V_w}\right)^{1/3}.
\]

The normalized logarithmic fiber strain and its smooth tensile part are

\[
\varepsilon=\ln\frac{\lambda}{\lambda_0},
\]

\[
\varepsilon_+
=\frac{1}{2}\left(\varepsilon+\sqrt{\varepsilon^2+\delta^2}\right).
\]

Passive stress is exponential:

\[
\sigma_{pass}
=\frac{k_p}{\beta}\left[\exp(\beta\varepsilon_+)-1\right].
\]

The active length-tension factor and stress are

\[
f_l
=\exp\left[
-\frac{1}{2}
\left(
\frac{\lambda/\lambda_0-\lambda_{opt}}{w_l}
\right)^2
\right],
\]

\[
\sigma_{act}=T_{max}a(t)f_l.
\]

Electrical activation drives one first-order state:

\[
\dot a=\frac{a_\infty(t)-a}{\tau(a_\infty-a)},
\]

with separate rise and fall time constants.

The normal HR75 bench starts the periodic LV input at `theta=0.97`. LA activation starts 168 ms earlier and lasts 160 ms; LV activation lasts 288 ms. At HR75 these fixed real-time seeds correspond to LA start/duration `theta=0.76/0.20` and LV start/duration `theta=0.97/0.36`. The HR60/HR100 scouts retain the 168/160/288 ms timing rather than scaling contraction duration with cycle length. These are prescribed electrical-input seeds, not pressure-shape terms; patient fitting must replace them with measured ECG, conduction, and valve timing.

The only atrial hysteretic constitutive term is Kelvin-Voigt wall viscosity:

\[
\sigma_{visc}=\eta\dot\varepsilon.
\]

It is a rate-dependent stress, not a memory pressure. Its dissipated power is non-negative:

\[
\mathcal D_{visc}
=\eta\dot\varepsilon^2V_w\ge 0.
\]

The total wall stress is

\[
\sigma=\sigma_{pass}+\sigma_{act}+\sigma_{visc}.
\]

Virtual work gives transmural pressure. Since

\[
\frac{\partial\varepsilon}{\partial\widetilde V}
=\frac{1}{V_w\lambda^3},
\]

then

\[
P_{tm}
=V_w\sigma\frac{\partial\varepsilon}{\partial\widetilde V}
=\frac{\sigma}{\lambda^3}.
\]

The cavity pressure is

\[
P_{cav}=P_{peri}+P_{tm}.
\]

There is no empirical pressure multiplier after virtual-work conversion.

## 5. Smooth inertial valves

For each valve, let

\[
\Delta P=P_{up}-P_{down}.
\]

The algebraic opening fraction is smooth:

\[
o(\Delta P)
=\left[
1+\exp\left(-\frac{\Delta P-\Delta P_{50}}{\epsilon_P}\right)
\right]^{-1}.
\]

Effective area is

\[
A_{eff}=A_{leak}+o(A_{open}-A_{leak}).
\]

Resistance, inertance, and Bernoulli loss scale with area:

\[
R=R_{open}\left(\frac{A_{open}}{A_{eff}}\right)^2,
\]

\[
L=L_{open}\left(\frac{A_{open}}{A_{eff}}\right),
\]

\[
B=B_{open}\left(\frac{A_{open}}{A_{eff}}\right)^2.
\]

Valve flow obeys

\[
L\dot Q+RQ+BQ\sqrt{Q^2+Q_\epsilon^2}=\Delta P.
\]

This preserves finite flow acceleration and avoids a hard diode or post-step reverse-flow projection. A short post-MVO interval with `Q_MV < Q_PV` is therefore expected: exact leaflet opening and net LA emptying are not mathematically identical events.

## 6. Closed return boundary

The pulmonary-venous compliance and inertial inflow are

\[
C_{PV}\dot P_{PV}
=Q_R-Q_{PV},
\]

\[
Q_R=\frac{P_R-P_{PV}}{R_R},
\]

\[
L_{PV}\dot Q_{PV}
=P_{PV}-P_{LA}-R_{PV}Q_{PV}.
\]

The aortic compliance, systemic flow, and return compliance are

\[
C_{Ao}\dot P_{Ao}
=Q_{AoV}-Q_{sys}.
\]

\[
Q_{sys}=\frac{P_{Ao}-P_R}{R_{sys}},
\]

\[
C_R\dot P_R=Q_{sys}-Q_R.
\]

Consequently,

\[
\frac{d}{dt}
\left(
V_{LA}+V_{LV}+C_{PV}P_{PV}+C_{Ao}P_{Ao}+C_RP_R
\right)=0.
\]

This removes the unlimited-volume behavior of fixed inlet and outlet pressure sources. The return reservoir still collapses the omitted right heart and pulmonary circulation into one compliance, so it is not a substitute for a full four-chamber circuit.

## 7. Why the x, v, and y phases can emerge

Ignoring activation, viscosity, and nonlinear coefficients for the sign argument,

\[
\dot P_{LA}
\approx E_{LA}
\left(Q_{PV}-Q_{MV}-A_{LA}u_{AV}\right).
\]

During MV closure,

\[
\dot P_{LA}
\approx E_{LA}\left(Q_{PV}-A_{LA}u_{AV}\right).
\]

An x descent appears when AV-plane acquisition exceeds pulmonary filling:

\[
A_{LA}u_{AV}>Q_{PV}.
\]

As AV-plane descent decelerates, pulmonary filling dominates and produces the v rise.

After MVO, y descent requires

\[
Q_{MV}-Q_{PV}>-A_{LA}u_{AV}.
\]

Elastic recoil alone raises conduit pressure at equal blood volume. Finite AV-plane inertia delays that recoil, while the Kelvin-Voigt term lowers pressure during rapid conduit emptying. Their combined, dissipative dynamics create reservoir/conduit hysteresis without a branch-specific pressure or wall-memory state.

Net LA passive emptying and conduit throughput are separate quantities:

\[
\Delta V_{LA,passive}=V_{LA}(MVO)-\min_{MVO\le t<t_{preA}}V_{LA}(t),
\]

\[
V_{conduit}=SV_{LV}-\left(V_{LA,max}-V_{LA,min}\right).
\]

The second expression follows the clinical volume-ledger definition and includes blood that passes from pulmonary veins through LA to LV without being stored as LA stroke volume.

## 8. Numerical method

The implementation solves the ten coupled algebraic equations for

\[
\left[V_{LA},V_{LV},z_{AV},u_{AV},Q_{MV},Q_{AoV},P_{PV},Q_{PV},P_{Ao},P_R\right]_{n+1}
\]

with a damped Newton solve at each 1 ms step. Activation states are updated analytically over the same step. Finite-difference Jacobians and backtracking are numerical machinery only; they do not add physiological states.

Admissibility requires positive blood volumes, positive effective free-wall volumes, finite state values, and positive aortic pressure. A failed solve is reported rather than projected into a plausible-looking PV loop.

The bench advances up to 60 beats and accepts only a periodic steady state. It does not assume that a fixed beat number is settled.

C1 smoothness is expected from the smooth ODE, smooth valve-area sigmoid, finite inertance, and implicit step. The reported C1/tangent readbacks are numerical diagnostics: the model must show monotone reduction of valve-event tangent jumps under dt refinement (`2 ms -> 1 ms -> 0.5 ms`). A single-dt tangent value is not a clinical threshold.

## 9. Default seed parameters

| Group | Parameter | Seed |
|---|---|---:|
| LA wall | `V_w`, `V_0` | 22, 39 mL |
| LA passive | `k_p`, `beta` | 30 kPa, 8 |
| LA active | `T_max`, length peak, width | 8 kPa, 1.08, 0.22 |
| LA activation | rise/fall tau | 0.025/0.075 s |
| LA viscosity | `eta` | 4 kPa s |
| LV wall | `V_w`, `V_0` | 120, 80 mL |
| LV passive | `k_p`, `beta` | 12 kPa, 24 |
| LV active | `T_max` | 72 kPa |
| LV length-tension | optimum, width | 1.22, 0.18 |
| LV activation | rise/fall tau | 0.030/0.040 s |
| AV areas | `A_LA`, `A_LV` | 25, 37.5 cm2 |
| AV longitudinal tissue area | LA, LV | 4.5, 36 cm2 |
| AV fiber projection | LA, LV | 0.70, 0.95 |
| AV dynamics | `M_AV`, `D_AV`, `K_AV` | 1.1 N s2/cm, 20 N s/cm, 25 N/cm |
| activation timing | AV delay, LA duration, LV duration | 168, 160, 288 ms; HR75 theta equivalents 0.76/0.20 and 0.97/0.36 |
| MV | open/leak area | 4.5/0.03 cm2 |
| MV | midpoint/width, R/L/B | 0.12/0.10 mmHg, 0.004/0.00025/0.00002 |
| AoV | open/leak area | 3.2/0.015 cm2 |
| AoV | midpoint/width, R/L/B | 0.50/0.20 mmHg, 0.002/0.0002/0.00004 |
| PV node | `C_PV`, `R_PV`, `L_PV` | 18 mL/mmHg, 0.060 mmHg s/mL, 0.0020 mmHg s2/mL |
| Return source | `R_R`, `C_R`, initial `P_R` | 0.080 mmHg s/mL, 35 mL/mmHg, 17.5 mmHg |
| Systemic/aortic | `C_Ao`, `R_sys` | 1.3 mL/mmHg, 1.12 mmHg s/mL |
| Newton solve | iterations/tolerance/line search | 12, 1e-8, 12 |

These are scout seeds, not population priors or fitted clinical values.

## 10. Patient-specific fitting hierarchy

Do not fit all parameters simultaneously. The recommended order is:

1. Fix cycle timing and activation timing from ECG and valve events.
2. Fit blood-volume offsets (`V_0`) and boundary flow/afterload to measured chamber volumes, stroke volume, and pressure level.
3. Fit passive LA stiffness (`k_p`, `beta`) to pressure-volume or pressure-strain observations.
4. Fit atrial active stress to A-wave augmentation and A-loop work.
5. Fit AV-plane area/force/inertance/tether parameters to measured AVPD, tissue velocity, and, when available, acceleration.
6. Fit valve area/loss/inertance to E/A flow, gradients, and opening transients.
7. Fit wall viscosity last, using reservoir/conduit branch separation and loop area.

`V_0`, passive stiffness, AV area, and viscosity can be correlated if only one PV loop is available. Future calibration must include multi-observable sensitivities and profile likelihoods before claiming identifiability.

## 11. Current evidence

The generated report is `data/mechanics2/reports/mechanistic-atrial-one-fiber-report-v1.json`.

The 15-case envelope report is `data/mechanics2/reports/mechanistic-atrial-envelope-report-v1.json`.

Both committed JSON artifacts contain deterministic per-profile summaries only. Renderers recompute the full periodic traces in memory; raw per-step samples are intentionally omitted from Git artifacts.

The normal-HR75 visual is `data/mechanics2/visuals/mechanistic-atrial-one-fiber-normal-hr75.svg`.

Current normal-HR75 sidecar signal:

- LA pressure: 7.515 to 12.019 mmHg;
- LV pressure: 6.354 to 91.293 mmHg;
- aortic pressure: 59.413 to 86.794 mmHg;
- pulmonary-venous / return-reservoir pressure: 12.381 to 12.720 / 16.485 to 16.566 mmHg;
- cardiac output: 3.009 L/min;
- stroke volume: 40.120 mL;
- fixed-open-area bulk MV E/A: 1.386;
- fixed-open-area bulk MV E/A peak velocities: 39.108 / 28.208 cm/s;
- atrial filling fraction from the fixed-open-area bulk MV VTI partition: 0.283;
- E acceleration time / deceleration time / DT-to-AT ratio: 52.0 ms / 164.0 ms / 3.153;
- MV velocity at A-activation onset: 12.962 cm/s, so the waveform is classified `separated`;
- diastasis duration: 168 ms;
- E-wave asymmetry regime: `transition`;
- AVPD: 0.525 cm;
- peak AV-plane velocity: 3.177 cm/s;
- x descent / v rise / y descent: 1.876 / 0.981 / 2.432 mmHg;
- post-MVC reservoir overshoot: 0 mmHg;
- reservoir volume gain: 14.435 mL;
- conduit throughput: 24.456 mL, 61.0% of stroke volume;
- A-loop / v-loop area: 7.131 / 10.547 mmHg mL, signed areas +7.131 / -10.547, ratio 0.676, so the two lobes have opposed orientation;
- integrated MV / AoV reverse volume: 0.152 / 0.406 mL per beat, with no reverse interval above the significant-flow threshold;
- figure-eight crossing: present in late conduit, normalized path progress 0.932, angle 53.294 degrees;
- conduit-before-crossing below-reservoir path fraction and pumping-after-crossing above-reservoir path fraction: both 1.000;
- pumping above figure-eight chord fraction: 1.000;
- normalized MVC/MVO tangent jump: 0.0199 / 0.4164 at 1 ms, 0.0102 / 0.2257 at 0.5 ms, and 0.0368 / 0.6988 at 2 ms; and
- all ten implicit equation residuals and the closed-circuit volume residual are within the configured numerical gate.

The reported MV velocities used for E/A are

\[
v_{MV,bulk}=\frac{Q_{MV}}{A_{open}}.
\]

This is a fixed-open-area bulk-flow surrogate, not clinical pulsed-wave Doppler. It has no sample volume between leaflet tips, no beam angle, no modal spectral envelope, and no dynamic sample-position effect. The model also reports `Q_MV/A_eff` as an effective-orifice jet velocity, but that value is not used for the clinical-normal gate.

Mechanism controls:

- fixing the AV-plane reduces x-descent depth by more than the configured 0.4 mmHg attribution margin;
- removing LA active stress reduces A-loop area and removes local A-wave flow augmentation; and
- increasing LA passive stiffness raises peak LA pressure by more than the configured 0.5 mmHg attribution margin without adding a new state.

## 12. Gate semantics and next verification

This result supports only a mechanistic vertical-slice signal. It does not establish:

- runtime/default adoption;
- a full four-chamber circulation;
- population morphology acceptance;
- pathology coverage;
- patient-specific parameter identifiability; or
- superiority over the current runtime.

The 15-case scout envelope covers preload, afterload, HR 60/75/100, LV contractility, LA stiffness, AV coupling, and dt 0.5/1/2 ms. The preload seed brackets the reference return pressure at 13.5/17.5/21.5 mmHg, and the AV-coupling seed brackets the reference LV longitudinal tissue area at 24/36/48 cm2. Its gates are deliberately layered:

- numerical conservation, convergence, finite values, chamber and PV/return boundary bounds, valve reverse-flow burden, and expected directional responses are hard across all cases;
- normal-HR75 morphology is hard only for the reference and dt replicas;
- HR, load, stiffness, contractility, and coupling morphology are diagnostic and may lose a figure-eight loop;
- the 5 mL conduit floor applies to `SV_LV - total LA stroke volume`, not net post-MVO LA emptying;
- the 0.5 mmHg x/y/v prominence floor is a finite-resolution named-wave detector, not a clinical pressure-amplitude range;
- the 10-degree crossing-angle floor rejects a degenerate tangency and is not a physiological normal range;
- the conduit/reservoir path ordering, pumping/reservoir path ordering, and crossing-to-MVC chord rules are engineering reference-morphology checks for this artifact, not clinical ranges;
- opposed signed A/v lobe orientation is required in the reference and dt replicas so that a same-direction self-intersection cannot pass merely by having sufficient absolute area;
- because c-wave mechanics are intentionally omitted, post-MVC reservoir overshoot must remain below 10% of x-descent depth; this is a model-scope morphology rule, not a population normal range; and
- C1/valve-event continuity is evaluated by smooth-ODE consistency and monotone dt refinement, not by a single clinical C1 cutoff.

Mitral waveform gates are intentionally narrower:

- if fixed-open-area bulk MV velocity at A-activation onset is greater than 20 cm/s, the E/A, VTI partition, and DT readbacks are `not-applicable-fusion`; transferring the ASE PW-Doppler rule to this bulk surrogate is a conservative engineering applicability screen, not a claim of measurement equivalence or abnormal diastolic function;
- the hard normal MVF gate is only the ASE 2025 middle-age peak E/A range, 0.69 to 2.07, after fusion eligibility;
- Kuo 1987 atrial filling fraction, here encoded as 0.12 to 0.46, is supportive because it is age and disease dependent;
- ASE/EAE 2009 age-41-60 DT 143 to 219 ms is supportive because 2025 clinical interpretation no longer treats DT alone as the hard normal discriminator here; and
- AT, DT/AT, low-flow diastasis duration, monotone E rise/decay, and E-wave asymmetry regime are diagnostics for mechanism and waveform resolution. They are not clinical acceptance ranges in this sidecar.

All current numerical, broad-envelope, PV/return-boundary and valve-burden, directional-response, dt-parity, smooth-valve-event, and normal-dt topology gates pass. This remains a scout envelope, not pathology validation. Report future failures as failures; do not repair them with branch pressure terms.

## 13. Validation decision

This subsystem can validate the following, and only within the sidecar assumptions:

- mass conservation for LA, LV, PV compliance, aortic compliance, and return compliance;
- virtual-work pressure conversion for the one-fiber wall law;
- work-coordinate separation: `z_AV` changes wall geometry/capacity/work but never creates blood volume;
- smooth finite-inertance valve/flow evolution without hard diode projection;
- normal-HR75 middle-age E/A eligibility when the waveform is separated;
- supportive AFF, DT, AT, DT/AT, diastasis, and rise/decay diagnostics for the generated MVF surrogate;
- finite x/v/y pressure-wave readability and blood-volume-ledger figure-eight morphology in the reference and dt-replica rows;
- C1-like valve-event behavior as a numerical dt-refinement property; and
- directional mechanism controls for fixed AV-plane, atrial-active-off, and stiff-LA variants.

The following are deferred to a full circuit or to patient-specific calibration:

- absolute clinical PW-Doppler velocity ranges, sample-position effects, and spectral-envelope measurement equivalence; a full circuit is necessary for realistic loading but is not sufficient without a PW-Doppler observation model;
- LV filling-pressure or diastolic-dysfunction classification from concordant clinical indices such as e', E/e', LAVI, TR/PASP, LARS, pulmonary venous flow, Valsalva response, and clinical context;
- age-specific acceptance outside the declared middle-age reference band;
- fusion acceptance across heart rate, PR interval, preload, afterload, conduction delay, and rhythm envelopes;
- right-heart, pulmonary-arterial, pulmonary-venous S/D/Ar, pericardial, and total-blood-volume interactions;
- pathology validation, patient-specific identifiability, and population normal ranges;
- runtime/default adoption or superiority over `LeftHeartSubsystemV2`; and
- public clinical claims.

Therefore the current decision is `mechanistic-atrial-vertical-slice-signal`: the model has a useful mechanism signal and a passing sidecar envelope, while `runtime-wiring`, `full-four-chamber-circuit`, `morphology-acceptance`, `patient-specific-validation`, and `default-selection` remain blocked claims.

## 14. Literature relationship

This is a reduction informed by, not a reproduction of:

- Maksuti et al., *Modelling the heart with the atrioventricular plane as a piston unit* (2015): <https://pubmed.ncbi.nlm.nih.gov/25466260/>
- Maksuti et al., AV-plane area and hydraulic-force analysis (2017): <https://www.nature.com/articles/srep43505>
- Zeile et al., AV-plane displacement modelling (2021): <https://link.springer.com/article/10.1007/s10439-021-02848-2>
- Soundappan et al., AV-plane contribution and ventricular pumping analysis (2023): <https://www.nature.com/articles/s41598-023-41694-1>
- Smiseth et al., LA reservoir, conduit, and pump volume definitions (2022): <https://academic.oup.com/ehjcimaging/article/23/1/2/6380641>
- Patel et al., simultaneous LA/LV conduit-flow quantification and reproducibility (2021): <https://pmc.ncbi.nlm.nih.gov/articles/PMC8497225/>
- Nordsletten et al., experimental human-myocardium viscoelastic constitutive modelling (2021): <https://pubmed.ncbi.nlm.nih.gov/34487858/>
- Nagueh et al., ASE 2025 LV diastolic-function and HFpEF update: <https://www.asecho.org/wp-content/uploads/2025/07/Left-Ventricular-Diastolic-Function.pdf>
- Nagueh et al., ASE/EAE 2009 LV diastolic-function recommendations: <https://www.asecho.org/wp-content/uploads/2025/04/Archive_2009_LV-Diastolic-Function.pdf>
- Kuo et al., atrial filling fraction by pulsed Doppler and age effects (1987): <https://doi.org/10.1016/0002-9149(87)90870-8>
- Amrute et al., E-wave asymmetry and DT/AT as a mechanism-derived index (2021): <https://doi.org/10.1152/AJPHEART.00650.2020>

Differences from those sources include the present one-fiber virtual-work wall, a single generalized AV-plane inertance rather than a full bond-graph mechanical network, algebraic smooth valve area, fixed-open-area bulk MV velocity rather than PW Doppler, Kelvin-Voigt rather than fractional myocardial viscoelasticity, and a reduced closed return reservoir. Those differences must remain explicit when interpreting the artifact.
