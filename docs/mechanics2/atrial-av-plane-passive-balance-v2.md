# AV-plane passive-balance model V2

Status: experimental sidecar, not selected. It is not wired into the runtime default or `LeftHeartSubsystemV2`.

## 1. Objective and current conclusion

V2 asks one narrow question: can the V1 shared AV-plane be changed from a damping-dominant restraint to a physically interpretable passive-force balance without adding a pressure correction or history state?

The answer is mixed.

- The candidate reproduces AV-plane displacement and velocity more plausibly,
  deepens the x descent, and shows passive/hydraulic opposition at the legacy
  best point and in the median continuous-window readback.
- It remains conservative, periodic, and numerically converged across the tested left-heart envelope.
- It does not preserve the required blood-volume PV ordering and normal mitral E/A simultaneously.
- Increasing the physiologic LA contractility parameter restores E/A, but moves the PV intersection outside the preferred late-conduit/early-pumping window.
- No tested parameter set passes the mechanics, blood-volume PV, and MVF gates jointly. V2 is therefore evidence, not a new normal model.

The implementation still contains none of `P_mem`, `P_relief`, `P_LV_recv`, a reservoir-capacity state, or a conduit-owned pressure source.

## 2. Why V1 needed this experiment

V1 used one coordinate reference for two different physical roles:

1. the geometry reference used to compute LA and LV wall deformation;
2. the zero-force position of the longitudinal passive spring.

With apexward-positive AV-plane position `z`, V1 used

\[
\widetilde V_{LA}=V_{LA}-A_{LA}(z-z_{ref}),
\qquad
\widetilde V_{LV}=V_{LV}+A_{LV}(z-z_{ref}),
\]

and

\[
F_K=-K(z-z_{ref}).
\]

At the V1 HR75 best low-activation late-diastolic sample, this gives approximately

\[
F_{hyd}=-1.38\ \mathrm{N},
\qquad
F_K=-20.11\ \mathrm{N},
\qquad
F_D=+22.82\ \mathrm{N}.
\]

Its AV-plane velocity is -1.14 cm/s and MV flow is 33% of the cycle peak, so it is not classified as quasi-static. Hydraulic and passive forces point in the same baseward direction; a large damper balances both. That is mathematically valid but cannot represent the static interpretation in Maksuti 2017: if a hydraulic force persists at momentarily static diastasis, another force such as passive tension must oppose it.

## 3. V2 state and blood-volume ownership

V2 adds no state. The state remains

\[
\mathbf{x}=
\left[
V_{LA},V_{LV},z,u,Q_{MV},Q_{AoV},P_{PV},Q_{PV},P_{Ao},P_R,a_{LA},a_{LV}
\right]^T,
\]

where

\[
\dot z=u.
\]

The blood-volume ledgers are unchanged:

\[
\dot V_{LA}=Q_{PV}-Q_{MV},
\qquad
\dot V_{LV}=Q_{MV}-Q_{AoV}.
\]

Only these blood volumes are used on physiology-facing PV axes. AV-plane displacement changes wall deformation but never creates or removes blood volume.

## 4. Geometry and passive neutral are separate

V2 defines a geometry reference `z_g` and a passive neutral position `z_p`:

\[
\widetilde V_{LA}=V_{LA}-A_{LA}(z-z_g),
\]

\[
\widetilde V_{LV}=V_{LV}+A_{LV}(z-z_g),
\]

\[
F_K=-K(z-z_p).
\]

In code, the existing `referencePositionCm` remains `z_g`. The optional `passiveNeutralPositionCm` is `z_p`; if omitted it falls back to `z_g`, so every V1 default calculation is unchanged.

The corresponding passive energy and dissipated power are

\[
\mathcal E_{AV}
=\frac{1}{2}Mu^2+\frac{1}{2}K(z-z_p)^2,
\]

\[
\mathcal D_{AV}=Du^2\ge 0.
\]

The coordinate-shift contract is

\[
(z,z_g,z_p)\mapsto(z+c,z_g+c,z_p+c),
\]

which leaves displaced volumes, spring force, hydraulic force, and force residual unchanged. This is verified by a focused unit test.

## 5. Chamber wall law is unchanged

For each chamber wall volume `V_w`, V1/V2 use

\[
\lambda(\widetilde V)=
\left(1+\frac{3\widetilde V}{V_w}\right)^{1/3},
\qquad
\lambda_0=
\left(1+\frac{3V_0}{V_w}\right)^{1/3}.
\]

Logarithmic fiber strain and its smooth tensile part are

\[
\varepsilon=\log\frac{\lambda}{\lambda_0},
\]

\[
\varepsilon_+
=\frac{1}{2}
\left(\varepsilon+\sqrt{\varepsilon^2+\delta^2}\right).
\]

Passive, active, and viscous stresses are

\[
\sigma_{pass}
=\frac{k_p}{\beta}
\left[\exp(\beta\varepsilon_+)-1\right],
\]

\[
\sigma_{act}=T_{max}a(t)
\exp\left[-\frac{1}{2}
\left(
\frac{\lambda/\lambda_0-\lambda_{opt}}{w_l}
\right)^2\right],
\]

\[
\sigma_{visc}=\eta\dot\varepsilon.
\]

Virtual work gives

\[
P_{tm}
=\frac{\sigma_{pass}+\sigma_{act}+\sigma_{visc}}{\lambda^3}.
\]

The passive-balance candidate leaves all V1 wall parameters, including `T_A,max = 8 kPa` and `T_V,max = 72 kPa`, unchanged. The separate LA-contractility bracket uses `T_A,max = 12 kPa`; it is explicitly not part of the passive-only attribution.

An important coupled effect remains: even with identical `T_V,max`, the new AV-plane trajectory changes `lambda` and therefore the active length factor. Peak computed LV longitudinal active force rises from 142.7 N in V1 to 172.6 N in the passive candidate. The passive experiment is consequently not a pure force-trace clamp.

## 6. Longitudinal active and hydraulic forces

Longitudinal active force is obtained from the same chamber active stress:

\[
F_{i,long}^{act}
=c_\sigma\,\sigma_{i,act}A_{i,long}\gamma_i,
\]

where `gamma_i` is a fiber-to-long-axis projection and `c_sigma = 0.1 N/(kPa cm^2)`.

The hydraulic force is

\[
F_{hyd}
=c_P\left(A_{LA}P_{LA,tm}-A_{LV}P_{LV,tm}\right),
\]

with

\[
c_P=0.0133322\ \frac{\mathrm N}{\mathrm{mmHg\,cm^2}}.
\]

The AV-plane equation is

\[
M\dot u
=F_{LV,long}^{act}-F_{LA,long}^{act}
+F_{hyd}-Du-K(z-z_p).
\]

Equivalently, the force residual checked by the implicit solver is

\[
r_F=
F_{LV,long}^{act}-F_{LA,long}^{act}
+F_{hyd}+F_K+F_D+F_I,
\]

where

\[
F_D=-Du,
\qquad
F_I=-M\dot u.
\]

## 7. Valve and circuit equations are unchanged

Both MV and AoV retain the smooth finite-inertance V2 valve. For pressure difference `Delta P`:

\[
o(\Delta P)=
\left[1+\exp\left(-\frac{\Delta P-\Delta P_{50}}{\epsilon_P}\right)\right]^{-1},
\]

\[
A_{eff}=A_{leak}+o(A_{open}-A_{leak}),
\]

\[
L(A_{eff})\dot Q
+R(A_{eff})Q
+B(A_{eff})Q\sqrt{Q^2+Q_\epsilon^2}
=\Delta P.
\]

There is no hard MVO switch and no post-step flow projection.

The sidecar boundary remains a closed left-heart return circuit with dynamic pulmonary-venous, aortic, and return-compliance nodes. It is not the full four-chamber runtime circuit and is independent of `LeftHeartSubsystemV2`.

## 8. Parameter comparison

| Variant | M (N s2/cm) | D (N s/cm) | K (N/cm) | z_p (cm) | T_A,max (kPa) | Role |
|---|---:|---:|---:|---:|---:|---|
| V1 baseline | 1.1 | 20 | 25 | 0 | 8 | historical control |
| passive balance | 0.3 | 8 | 80 | 0 | 8 | mechanistic candidate, not selected |
| LA-contractility bracket | 0.3 | 8 | 80 | 0 | 12 | physiologic parameter bracket |
| topology-only comparator | 0.5 | 16 | 80 | 0 | 8 | retains crossing/order but degenerates lobe area |
| K=0 control | 0.3 | 8 | 0 | 0 | 8 | non-periodic negative control |
| neutral-shift control | 0.3 | 8 | 80 | 1 | 8 | identifiability diagnostic |

The V2 candidate has

\[
\tau_{M/D}=\frac{M}{D}=37.5\ \mathrm{ms},
\]

\[
\omega_n=\sqrt{K/M}=16.3\ \mathrm{rad/s},
\]

\[
\zeta=\frac{D}{2\sqrt{MK}}\approx0.82.
\]

It is intentionally underdamped but not weakly damped.

### Literature comparison

Maksuti 2015 used an imposed contraction-force waveform and an AV piston without an explicit spring. Converted to the units used here, its reported inertial and resistance seeds are approximately

\[
M\approx0.40\ \mathrm{N\,s^2/cm},
\qquad
D\approx4.00\ \mathrm{N\,s/cm}.
\]

Its ventricular and atrial contraction-force amplitudes were approximately 98 N and 20 N. These were model inputs, not direct in-vivo measurements.

Zeile 2021 retained

\[
L_{AVP}\dot v
=-R_{AVP}v-A_{LV}P_{LV}+A_{LA}P_{LA}+F_C,
\]

with no explicit `K`. Its fitted heart-failure example corresponds to approximately

\[
M=0.272\ \mathrm{N\,s^2/cm},
\qquad
D=4.32\ \mathrm{N\,s/cm},
\]

\[
F_{VC}=62.8\ \mathrm N,
\qquad
F_{AC}=12.0\ \mathrm N,
\]

and 1.0 cm total AVPD. Nine parameters were estimated from measurements of only one differential state, and the paper itself discusses overfitting risk.

The ranges 60-130 N for ventricular and 10-25 N for atrial active force are therefore retained only as a non-blocking comparison with published model inputs. They are not population reference intervals or acceptance gates. The V2 projection produces 172.6 N and 1.92 N, respectively, so the comparison fails and the absolute force projection remains unconstrained.

Maksuti 2017 did not identify `M`, `D`, or `K`. It estimated diastatic hydraulic force at approximately 1-3 N, compared with a total peak filling force of 5-10 N, and stated that passive tension must oppose hydraulic force at momentary static diastasis.

Therefore:

- `M=0.3` in V2 is close to the published piston-model scale.
- `D=8` is twice the Maksuti/Zeile seed and remains an effective sidecar parameter.
- `K=80` has no direct literature identification. It is only an effective longitudinal tether hypothesis and cannot be promoted to a normal value.

## 9. Normal HR75 result

| Readback | V1 | Passive balance | LA-contractility bracket |
|---|---:|---:|---:|
| AVPD (cm) | 0.525 | 1.221 | 1.249 |
| s-prime (cm/s) | 3.18 | 9.46 | 9.68 |
| e-prime (cm/s) | 1.23 | 6.95 | 7.09 |
| a-prime (cm/s) | 1.14 | 0.16 | 0.25 |
| a-prime ratio to V1 | 1.00 | 0.136 | 0.222 |
| x descent (mmHg) | 1.88 | 5.98 | 6.84 |
| y descent (mmHg) | 2.43 | 3.94 | 3.76 |
| MV peak E/A | 1.39 | 2.75 | 1.84 |
| true-lobe status | measurable | not-measurable: multiple-self-intersections | measurable |
| true A-loop area (mmHg mL) | 8.43 | 0 | 94.13 |
| true v-loop area (mmHg mL) | 11.84 | 0 | 0.51 |
| legacy phase A/v area (mmHg mL) | 7.13 / 10.55 | 5.01 / 47.47 | 19.52 / 74.11 |
| conduit below reservoir before crossing | 1.00 | 0.58 | 1.00 only before an early crossing |
| selected crossing | late conduit | late conduit | outside preferred window |

The passive candidate improves the x trough and AV-plane kinematics, but its
true-lobe detector is not measurable because the blood-volume PV curve has three
topological crossings. The reported 5.01 / 47.47 mmHg mL areas are legacy
phase-slice diagnostics only. The LA-contractility bracket restores E/A and
large true A-loop area, but the true v lobe collapses below the shared area
floor and the phase crossing is outside the preferred late-conduit/early-pumping
window.

The passive candidate's best-point late-diastolic readback is retained only as a
legacy diagnostic (`diagnosticRole = legacy-best-point-not-acceptance`). It is a
single selected sample, not the acceptance result. At that point:

\[
|u_{AV}|=0.074\ \mathrm{cm/s}\le0.1,
\qquad
\frac{|Q_{MV}|}{\max|Q_{MV}|}=0.090\le0.1,
\]

\[
|F_D|=0.59\ \mathrm N\le1,
\qquad
|F_I|=0.93\ \mathrm N\le1.
\]

At that sample, it gives

\[
F_{hyd}=-1.342\ \mathrm N,
\qquad
F_K=+1.728\ \mathrm N,
\]

\[
F_{LV,act}-F_{LA,act}=-0.045\ \mathrm N,
\]

\[
r_{quasi}=0.341\ \mathrm N,
\qquad
r_F\approx0\ \mathrm N.
\]

This explains the retained legacy force-direction diagnostic only. It is not
the mechanics acceptance result, and those point thresholds are not claimed as
clinical normal limits.

The predeclared continuous late-diastolic window is the current mechanics
readback. For the passive candidate it spans 36 ms, from theta 0.73625 to 0.78,
with 36 samples. It preserves the median passive/hydraulic opposition signal
(`F_hyd` median -1.336882 N, `F_K` median +1.572385 N, opposed fraction 1.0)
and the median hydraulic magnitude remains inside the 1-3 N engineering window.
However it fails the quasi-static/dynamic criteria: max AV-plane speed
0.241005 cm/s, max mitral-flow fraction 0.115926, max damping force 1.928040 N,
max inertial force 1.943365 N, and dynamic-to-hydraulic p95 2.842629 all exceed
their predeclared limits. The quasi-static residual itself remains bounded
(max 0.340888 N), but the continuous-window mechanics gate is false.

## 10. Passive-neutral identifiability

Changing only

\[
z_p:0\rightarrow1\ \mathrm{cm}
\]

changes the periodic LA blood-volume midpoint by approximately 26.0 mL while the selected shape readbacks change by at most 7.2%.

The closed sidecar can redistribute blood volume and shift the absolute AV-plane orbit to compensate for `z_p`. Thus `z_p` is weakly identifiable from normalized PV morphology alone. It must not be fitted from loop shape. It needs absolute chamber-volume and AV-plane-coordinate measurements, with a declared anatomical origin.

The `K=0` control is non-periodic and develops actual state drift. Its LV
cycle-closure drift is -31.743823 mL, the retained absolute drift diagnostic is
31.743823 mL, all-steps convergence is false, solver failure is observed,
`maxAbsAvPlaneForceResidualN` is 107.407479, and `maxNonlinearResidual` is
81861.492674. This shows that the current sidecar needs a restoring constraint,
but it does not prove that a linear spring with `K=80 N/cm` is the correct
biological representation.

## 11. Calibration and envelope evidence

The explicit calibration audit evaluates 288 combinations:

\[
M\in\{0.3,0.4,0.5,0.6\},
\]

\[
D\in\{8,9,10,11\},
\]

\[
K\in\{60,70,80\},
\]

\[
T_{A,max}\in\{8,10,12,14,16,18\}\ \mathrm{kPa}.
\]

Acceptance is the intersection of shared, independently stated gates: periodic
numerics and conservation; observation readbacks for AVPD, s-prime, e-prime,
x-depth gain, non-collapse, a-prime non-collapse, and LA pressure sanity; the
predeclared continuous late-diastolic mechanics window; true blood-volume lobe
measurement with opposed orientation, phase-crossing coordinate match, true-lobe
area floors, angle floor, and 95% path-ordering floors; and the fixed-open-area
bulk MV E/A gate. The PV thresholds are explicitly tagged
`engineering-anti-degeneracy-diagnostic-not-clinical-cutoff`; the continuous
mechanics window is tagged
`engineering-late-diastolic-mechanics-window-not-literature-normal-range`; the
published active-force comparison is non-blocking model-input context, not an
in-vivo reference interval.

The joint candidate count is zero. The stored ranking score only orders rows for review; it is not an acceptance objective and is not used to fit a loop shape.

For the passive candidate, all 11 normal/dt/HR/preload/afterload/LA-stiffness cases are numerically valid and directional checks pass. Blood-volume topology passes in 0 of 11 cases. Broad-envelope morphology is therefore diagnostic failure, not a gate to relax until it passes.

## 12. Gate hierarchy

Hard evidence:

- LA and LV blood-volume conservation;
- closed-circuit conservation;
- AV-plane kinematic and force residuals;
- finite, periodic implicit solutions;
- coordinate-shift invariance;
- no forbidden pressure hook or added history state;
- dt parity.

Comparative mechanistic evidence:

- sign and magnitude of hydraulic/passive forces across the predeclared
  continuous late-diastolic window; the old best-point sample is legacy-only and
  not an acceptance result;
- AVPD and prime readbacks;
- x/y/v wave prominence;
- K=0 and neutral-shift controls;
- active-force amplification caused by length coupling. The published force-input comparison is advisory rather than a gate because it is not an in-vivo reference interval.

Normal morphology evidence, currently failed:

- exactly one measurable true-lobe blood-volume self-intersection whose
  coordinate matches the legacy phase-crossing coordinate;
- conduit below reservoir before crossing;
- pumping above reservoir after crossing;
- opposed, non-degenerate A and v lobe areas;
- separated MV E/A with age-band peak ratio;
- supportive VTI, AFF, deceleration, and diastasis readbacks.

Broad envelope morphology is not a universal hard gate. However, zero topology passes across 11 cases is a blocker for model selection, not a reason to weaken the definition.

## 13. Next experiment

Do not add a memory state or pressure relief term. The next experiment should place this same coordinate and wall law in the full circulation with measured or constrained:

1. absolute LA and LV blood volumes;
2. an anatomical AV-plane coordinate origin;
3. time-varying atrial and ventricular short-axis areas;
4. mitral valve area/loss and LV receiver loading;
5. ECG/activation and valve timing;
6. MAPSE and s-prime/e-prime/a-prime observations.

Only after these measurements constrain `z_p`, `K`, and the active-force projection should a nonlinear passive tether or pathology-specific parameter be considered.

## 14. Implementation and artifacts

- Core compatibility extension: `engine/mechanics2/core/SharedAVPlaneV1.ts`
- V2 bench: `engine/mechanics2/benches/AtrialAVPlanePassiveBalanceBenchV2.ts`
- Main report: `data/mechanics2/reports/atrial-av-plane-passive-balance-report-v2.json`
- Calibration audit: `data/mechanics2/reports/atrial-av-plane-passive-balance-calibration-v2.json`
- Review SVG: `data/mechanics2/visuals/atrial-av-plane-passive-balance-review-v2.svg`
- Focused test: `__tests__/atrialAVPlanePassiveBalanceV2.test.ts`

## References

1. Maksuti E, Bjallmark A, Broome M. [Modelling the heart with the atrioventricular plane as a piston unit](https://doi.org/10.1016/j.medengphy.2014.11.002). Medical Engineering & Physics. 2015;37:87-92.
2. Maksuti E, et al. [Hydraulic forces contribute to left ventricular diastolic filling](https://www.nature.com/articles/srep43505). Scientific Reports. 2017;7:43505.
3. Zeile C, et al. [A Personalized Switched Systems Approach for the Optimal Control of Ventricular Assist Devices based on Atrioventricular Plane Displacement](https://optimization-online.org/wp-content/uploads/2020/05/7811.pdf). IEEE Transactions on Biomedical Engineering / preprint source.
4. Stoylen A, et al. [Regional motion of the AV-plane is related to cardiac anatomy and deformation of the AV-plane](https://onlinelibrary.wiley.com/doi/10.1111/cpf.12845). Clinical Physiology and Functional Imaging. 2023.
5. [Normal ranges for automatic measurements of tissue Doppler indices of mitral annular motion, HUNT3](https://pubmed.ncbi.nlm.nih.gov/31544286/).
