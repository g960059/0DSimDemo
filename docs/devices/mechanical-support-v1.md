# Mechanical circulatory and respiratory support V1

Status: research/education model; not a medical device, treatment recommender, or patient-specific predictor.

This extension adds LVAD, Impella, peripheral/central VA-ECMO, VV-ECMO, and IABP to the canonical five-wall/non-coronary closed loop. It is built from pressure-flow and conservation laws. No output waveform was used as a fitting target.

## Design boundary

The base circulation and myocardium remain the accepted-state owners. A device is evaluated inside every backward-Euler candidate, so its flow responds to the same candidate's preload, afterload, chamber pressure, and vascular pressure. Rotary device transfer is added as equal-and-opposite inlet/outlet volume rates. IABP does not transfer blood between nodes and therefore uses a separate aortic displacement-volume law.

The immutable `adult-five-wall-noncoronary@0.2.0` release is not relabeled. Mechanical support is an optional trial extension and an independent research scenario runner. With an all-off configuration, the accepted state, native pressures, and native flows are bit-exact with the extension omitted.

## Common rotary-pump law

For LVAD, Impella, and ECMO, the reference H-Q curve is written in internal units (q\,[\mathrm{mL/s}]):

\[
H_p(q,N) = H_0\left(\frac{N}{N_0}\right)^2
- R_p\left|\frac{N}{N_0}\right|^\gamma q
- B_p q|q|.
\]

The cannula, graft, tubing, and oxygenator elements use

\[
\Delta P_i = R_iq + B_iq|q|.
\]

At each implicit candidate the operating point solves

\[
H_p(q,N)-(P_{out}-P_{in})-\sum_i\Delta P_i(q)=0.
\]

The signed linear-quadratic equation is solved in closed form. Affinity-scaled profiles use \(\gamma=1\); the HeartMate-II regression uses \(\gamma=0\) because its published linear coefficient is speed independent. Reverse flow is retained; it is not replaced by `max(0,q)`. A stopped, unclamped rotary pump can therefore back-flow, while a separately commanded circuit clamp gives exactly zero flow. The solver also returns pre-pump, post-pump, and post-oxygenator pressures.

The legacy algebraic evaluator retains this quasi-static operating point as a
verification shadow. The integrated transaction instead owns circuit flow as
an accepted state and advances it with backward Euler,

\[
L_{eq}\dot q=H_p-\Delta P_{patient}-\sum_i\Delta P_i,
\]

For the published HeartMate-II coefficients used below, including both cannulae gives approximately

\[
R_{eq}=0.1707+2(0.0677)=0.3061,
\qquad
L_{eq}=0.02177+2(0.0127)=0.04717,
\]

and therefore \(L_{eq}/R_{eq}\approx0.154\) s. That is not negligible for phasic flow, tachycardia, rhythm transitions, suction/chatter, or coronary-flow coupling. The dynamic owner therefore stores \(q_n\), includes \(L/dt\) in the signed root, returns analytic pressure/previous-flow tangents, and binds the complete structural hydraulic projection to checkpoint SHA-256 identity. The algebraic reduction remains limited to steady/beat-mean comparisons and the zero-inertance equivalence test. Source coefficients: [Wang et al., 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC3894974/).

### Inlet suction and flow-domain diagnostics

Every rotary profile must select one fail-closed inlet mechanism:

- `legacy-smooth-availability`: forward flow is multiplied by the lower of a smooth pressure availability and a smooth whole-source-volume availability. Its limiter owns an explicit constraint reaction.
- `pressure-dependent-series-resistance`: the resistance is part of the hydraulic equation and residual, not a constraint reaction.
- `none`: no inlet-suction term is added.

The legacy smooth law is retained for backward compatibility in the HM3,
Impella, and ECMO research profiles. Its generic pressure/whole-compartment
volume thresholds are provisional model choices, not device-specific suction
validation. They are not transferred into the HeartMate-II profile.

An optional maximum forward flow is a numerical constraint only when a profile
explicitly supplies one. Separately, a profile can declare a published
experimental traversal limit and an advertised capacity. Those values produce diagnostic
statuses but never clip instantaneous flow.

For ECMO, a pre-pump pressure below -75 mmHg produces a warning and below -100 mmHg a critical readback. These thresholds are a provisional local alarm profile, not values validated by the cited guideline and not management recommendations. In V1, source-node pressure/volume controls drainage availability; the calculated pre-pump P1 is an alarm readback and does not itself add a second Starling-resistor feedback. The ELSO circuit guideline supports monitoring circuit pressures, preventing pump-off backflow, and explicit clamping behavior, but it is not used here as evidence for the two numerical alarm thresholds: [ELSO Adult and Pediatric ECMO Circuits Guideline](https://www.elso.org/Portals/0/files/pdf/ELSO_Guidelines_for_Adult_and_Pediatric_Membrane_Oxygenation_Circuits.pdf).

## LVAD

The device is connected in parallel with the native aortic valve from LV to Ao; the valve is never removed.

The default 5200 rpm profile uses the published HeartMate 3 fit

\[
\Delta P=3.45\times10^{-6}N^2
-5.9\times10^{-5}NQ
-1.45Q^2,
\]

where (N) is rpm and (Q) is L/min. V1 replaces (Q^2) by (Q|Q|) only for the signed, out-of-forward-domain extension and labels that as a physical extrapolation. The source model is [Girfoglio et al.](https://arxiv.org/abs/2007.03527).

A HeartMate-II literature preset is also supplied. Its curve is represented directly as

\[
H=9.03\times10^{-5}\omega^2-0.1707q-0.02177\dot q,
\]

where \(\omega\) is rad/s, \(q\) is mL/s, and the integrated owner retains the inertial term. Inflow and outflow resistances are each 0.0677 mmHg·s/mL. At 9000 rpm, the steady reduction gives zero-flow head 80.21 mmHg and approximately 3.96 L/min at a 60 mmHg LV-to-aortic head.

Only this HMII preset uses the Choi pressure-dependent suction resistance

\[
R_k(P_{LV})=
\begin{cases}
0,&P_{LV}>1\ \mathrm{mmHg},\\
3.5(1-P_{LV}),&P_{LV}\leq1\ \mathrm{mmHg},
\end{cases}
\]

in mmHg·s/mL. Equality belongs to the active branch (zero resistance with its
one-sided active tangent). \(R_kq\) is included directly in total series loss,
pre-pump pressure, and hydraulic closure. It never appears as a fictitious
`pressure-collapse` constraint owner or reaction, and whole-LV volume is not an
input to this law. The formulation follows [Choi et al., 2007](https://doi.org/10.1111/j.1525-1594.2007.00350.x) as transcribed in [Wang et al., 2014](https://doi.org/10.1371/journal.pone.0085234).

HMII has no instantaneous 10 L/min hard clamp. The profile records 9 L/min as
the upper forward flow traversed in a published independent experiment and 10 L/min as advertised
capacity. Zero and reverse flow return `non-forward-flow-not-applicable`;
positive flow returns `within-published-experimental-domain`,
`above-published-experimental-domain-within-advertised-capacity`, or
`above-advertised-capacity` without altering \(q\). These classifications use
[Yang et al., 2015](https://doi.org/10.1016/j.jtcvs.2015.06.049) and
the [FDA HeartMate-II instructions](https://www.accessdata.fda.gov/cdrh_docs/pdf6/P060040S005C.pdf); advertised capacity is not evidence for a phasic clamp.
The published-experimental-domain status describes source coverage only; it is
not validation or acceptance of this repository's implementation.

Required behavior checked by the validation lane:

- speed increase raises head and flow;
- afterload increase lowers flow and can cause reverse flow;
- LVAD flow bypasses the native aortic valve and reduces native output;
- LV volume, LAP, and PV-loop area fall in the LV-failure bracket;
- biventricular failure produces a lower flow ceiling and an inlet-collapse alert.

## Impella CP

Impella is modeled from LV to Ao, also in parallel with the native valve. The clinical input is P-level, not a fixed flow command. P0-P9 map to the official CP rotor speeds:

`0, 23000, 31000, 33000, 35000, 37000, 39000, 42000, 44000, 46000 rpm`.

The bounded affinity H-Q surrogate is calibrated so a representative 70 mmHg transvalvular head traverses the official mean-flow ranges from P2 through P9. Pressure remains an input, so those ranges are not imposed as fixed flow. P0/low support retains pressure-driven retrograde flow. The speed and displayed-flow ranges, P9 peak limit, suction warning, and retrograde-flow warning come from the [FDA Impella CP with SmartAssist Instructions for Use](https://www.fda.gov/media/140767/download).

Device-arterial coupling is essential: a fixed-flow source would miss afterload dependence and low-speed backflow. A reduced two-element formulation evaluated with animal and retrospective patient data is described by [Chang, Keller, and Edelman, 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6661194/). It supports the importance of device-arterial coupling; it is not an independent validation of this repository's Impella H-Q surrogate.

## VA-ECMO

Cannulation controls select:

- peripheral VA: VC drainage to SA/descending systemic artery return;
- central VA: RA drainage to Ao/ascending aortic return.

The default pump and circuit coefficients are unit-converted from the quadratic network validated by Takahashi et al. against 36 mock-loop conditions and three clinical cases. Their reported flow RMSD was 0.12 L/min and pressure RMSD 7.7-13 mmHg. The 3500 rpm pump profile is

\[
H_p=337-0.0864q-0.003096q|q|.
\]

The 22 Fr drainage, oxygenator, and 18 Fr return quadratic coefficients are retained. Small negative linear coefficients reported for two cannulas are omitted because a passive element must remain dissipative outside the measured forward-flow domain. Consequently, this is a documented Senko-circuit profile, not a universal ECMO curve. Source: [Takahashi et al., 2026](https://doi.org/10.1186/s40635-026-00870-z).

Venous drainage and arterial return naturally raise systemic pressure while reducing RA/RV preload. The balance between reduced LV preload and increased LV afterload is case dependent. The default LV-failure bracket in this repository unloads LV volume; it must not be generalized to every patient. In the severe-shock example reviewed by Donker et al., 4 L/min VA-ECMO increased MAP 61 to 85 mmHg while LV EDV rose 158 to 173 mL and native SV fell 31 to 12 mL. This contrasting response is kept as an external validation target rather than forced into every waveform: [Donker et al., 2019](https://doi.org/10.1097/MAT.0000000000000755).

The pulmonary-hypertension bracket scales pulmonary resistance and reports mPAP, pulmonary flow, transpulmonary gradient, PVR, and RV peak pressure. Its no-support validation must satisfy mPAP >20 mmHg and PVR >2 WU; LAP is the model's wedge-pressure surrogate. Those thresholds follow the [2022 ESC/ERS pulmonary-hypertension guideline](https://publications.ersnet.org/lookup/pmid/36028254).

The severe aortic-regurgitation bracket is a **contraindication stress test**, not an application example. Retrograde VA return can worsen regurgitant recirculation, LV distension, and pulmonary edema; the runner emits a critical contextual alert whenever severe AR and VA-ECMO are combined. This concern is described in [Lorusso et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC5306351/) and [Meani et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC6531683/). The validation reports gross forward aortic flow, negative/regurgitant flow, net native output, and regurgitant fraction separately. Peripheral VA with lung failure also exposes differential hypoxemia, described below.

## VV-ECMO

VV-ECMO has two hydraulic coupling modes:

- `well-mixed-venous` (default): drain and return share one central-venous 0D node. Net hemodynamic source is exactly zero, while circuit flow and gas exchange remain available.
- `bicaval-pressure-resolved`: VC drainage and RA return are separate. This can redistribute local venous pressure and preload, but the result depends on the coarse VC-to-RA compartment resistance and should not be interpreted as direct circulatory support.

Cannulation (`femoral-jugular` or `dual-lumen`) and recirculation fraction are independent controls. Geometry-specific recirculation can be represented without inventing a pressure effect. Prospective measurements found median recirculation around 14-16% and values up to 58%: [Gehron et al., 2023](https://doi.org/10.3390/jcm12020416).

## ECMO gas exchange

Gas exchange is intentionally separated from hemodynamics and evaluated at beat mean. Oxygen content, not saturation, is transported:

\[
C_{O_2}=1.34\,Hb\,S_{O_2}+0.0031\,P_{O_2}\quad[\mathrm{mL/dL}].
\]

The membrane approaches a gas-side equilibrium with an exponential residence efficiency. The FDO2 control is constrained to 0.21-1.00 and sets equilibrium \(P_{O_2}=F_{DO_2}(760-47)\) mmHg at sea-level pressure. Every reported content, PO2, and saturation is linked by the same adult Hill approximation,

\[
S_{O_2}=\frac{P_{O_2}^{2.7}}{26.8^{2.7}+P_{O_2}^{2.7}}.
\]

This is a low-order fixed-temperature/pH dissociation curve, not a Bohr-shift or acid-base state. Oxygen transfer is capped by a profile parameter (default 220 mL/min). The default native-lung shunt is 0.05; ARDS examples set it explicitly to 0.8. In VV mode,

\[
C_{pre}=(1-r)C_v+rC_{post},\qquad
Q_{effective}=\min\{Q(1-r),CO\}.
\]

Flow beyond cardiac output is counted as additional recirculation, so oxygenation plateaus rather than declining at excessive circuit flow. Native lung function is a fixed shunt mixer. Sweep raises a normalized Michaelis-Menten CO2-removal surrogate, \(f(s)=2s/(1+s)\), which equals one at 1 L/min and approaches two. A fresh-gas factor \(1-e^{-s/0.2}\) makes sustained O2 transfer zero at zero sweep; above about 1 L/min its O2 effect is below one percent, leaving O2 primarily blood-flow/FDO2 controlled.

The default `fick-closed` venous mode solves mixed-venous content algebraically from the requested whole-body demand,

\[
\dot V_{O_2}=10\,Q_{systemic}(C_a-C_v).
\]

Thus changing VO2 changes both SvO2 and arterial oxygenation, as it should in a steady patient balance. If even \(S_v=0\) cannot close the requested demand, the result reports the achievable demand fraction and a critical alert. `prescribed-saturation` mode remains available when measured SvO2 should be treated as a boundary; in that mode VO2 is explicitly a comparison target rather than a closed balance.

ELSO emphasizes the effective-ECMO-flow/cardiac-output ratio, notes that systemic saturation often remains below 90% when the ratio is below about 0.6, and describes normal DO2/VO2 near five with supply dependence near two: [ELSO Adult VV Guideline](https://pmc.ncbi.nlm.nih.gov/articles/PMC8315725/). The factors represented in this module—CO, shunt, Hb, FDO2, VO2, and recirculation—and the direction of the VO2 response follow the low-order patient model of [Zanella et al.](https://www.sciencedirect.com/science/article/pii/S0883944116301939). Sweep-dominated CO2 behavior follows the scope of [Joyce et al., 2018](https://doi.org/10.1186/s40635-018-0183-4).

### VA differential oxygenation

A single systemic oxygen scalar cannot produce Harlequin syndrome. Peripheral VA therefore uses a conservative steady two-territory mixer. Native LV/lung blood enters the proximal territory and peripheral ECMO blood the distal territory. If native flow is below upper-body demand, ECMO blood reaches the arch; otherwise native blood reaches the distal aorta. Right-radial/brain and femoral saturations are returned separately. Central RA-to-Ao return instead uses a proximal well-mixed result and cannot emit a false peripheral-watershed alert. Both are algebraic and beat-mean, not a dynamic watershed-position model. Territorial gas readbacks are suppressed in the severe-AR stress test because gross systolic ejection and large regurgitant recirculation cannot be represented safely by this steady two-stream mixer.

## IABP

The balloon is a time-varying excluded volume in the systemic aortic compartment:

\[
P_{SA}=P_{vascular}(V_{blood}+V_b(t)).
\]

Blood volume itself is unchanged. Adding (V_b) to both pressure and the blood-volume ledger would double count the balloon and is prohibited.

Default operation is 40 cc, 1:1, inflation at phase 0.22 (within 50 ms after modeled aortic-valve closure in the LV-failure validation), and completion of deflation before the next ventricular ejection. Both transitions are smooth over 80 ms; at high heart rate deflation onset advances as needed to finish continuously at the beat boundary. Controls expose off/1:1/1:2/1:3, 30/40/50 cc-compatible volume, and inflation/deflation phase. This produces the expected second diastolic peak, lower pre-systolic trough, and lower assisted systolic pressure through vascular compliance rather than by adding a fitted pressure waveform. Metrics keep systolic-window peak, augmented-diastolic peak, pre-systolic trough, and beat-global extrema separate so augmentation is never mislabeled as systolic pressure.

The displacement-volume approach and 80 ms transition are the low-order reduction of the validated model in [Schampaert et al., 2013](https://pubmed.ncbi.nlm.nih.gov/23263334/). Correct timing is inflation at aortic-valve closure/dicrotic notch and deflation with ventricular contraction before aortic-valve opening. The current phase trigger approximates these events at the fixed one-second cycle; event-triggered valve timing remains future work.

## Clinical-style controls and readbacks

| Device | Inputs | Principal readbacks |
|---|---|---|
| LVAD | insert/enable, rpm, clamp, H-Q/suction profile | flow, head, inlet availability or series resistance, evidence-domain status, LV/Ao pressures, backflow |
| Impella | insert/enable, P0-P9, clamp | pressure-dependent flow, suction, backflow |
| VA-ECMO | rpm, clamp, central/peripheral, cannula/oxygenator coefficients | Q, P1/pre-pump, post-pump, post-oxygenator, MAP effect |
| VV-ECMO | rpm, clamp, cannulation, hydraulic coupling, recirculation | Q, effective Q, pre/post oxygen content, SaO2, CO2 removal |
| IABP | off/1:1/1:2/1:3, volume, inflation/deflation phase and duration | balloon volume, activation, assisted beat |
| Gas | FDO2, sweep, Hb, shunt, VO2, venous mode/SvO2, recirculation | O2 transfer, Fick closure/demand met, delivery/consumption, right-radial/femoral saturation |

Alerts cover inlet collapse, excessive negative ECMO drainage pressure, pump backflow, running against a clamp, low VV effective-flow ratio, low DO2/VO2, unmet Fick demand, and VA differential/upper-body hypoxemia. They report modeled conditions only.

## Reproducible validation

Run:

```bash
npm run validate:mechanical-support:v1
```

The command branches each case after 20 common stabilization beats into a 40-beat no-support continuation and a 40-beat support arm, generates unsmoothed final-beat waveforms and PV loops, gates beat-to-beat closure and nonlinear continuity, audits total-blood-volume conservation, and repeats the LVAD scenario at half the time step.

Generated results and plots are in [`data/devices/validation/v1`](../../data/devices/validation/v1/README.md). The checked matrix includes LV failure with LVAD, Impella, VA-ECMO, and IABP; high-shunt VV-ECMO; a separate high-shunt peripheral-VA differential-oxygenation challenge; biventricular failure with LVAD; pulmonary hypertension with VA-ECMO; and severe aortic regurgitation with VA-ECMO.

## Known limitations

- No patient-specific fitting, parameter estimation, or clinical outcome prediction.
- No motor current, power, thrombosis, hemolysis, thermal state, or controller AUTO logic.
- Dynamic rotary flow is modeled, but motor-current/speed dynamics and circuit compliance/blood-volume states are not.
- ECMO P1/pre-pump over-suction is alarmed but is not an additional automatic drainage-collapse limiter; its provisional legacy source-node availability and explicit profile caps own flow limitation.
- No cannula-position geometry; recirculation is a controlled low-order parameter.
- Gas exchange is not a dynamic PaO2/PaCO2, acid-base, or tissue-metabolism model.
- Fick closure is steady and whole-body; it has no organ-specific extraction, venous transit delay, temperature/pH shift, or dynamic oxygen stores.
- VA Harlequin is a two-territory steady mixer, not a spatial aortic transport model.
- The checked MCS validation lane is non-coronary. The combined transaction seam can now evaluate coronary flow, but periodic IABP-coronary augmentation has not been validated.
- IABP timing is phase based; arrhythmia and ECG/pressure trigger failures are not modeled.
- Device coefficients are profiles. A manufacturer/product name does not make a profile universal across cannulas, grafts, blood viscosity, or operating domains.
