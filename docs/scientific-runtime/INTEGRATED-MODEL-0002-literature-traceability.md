# INTEGRATED-MODEL-0002: literature traceability and validation map

Status: living preregistration. A citation in this document does not by itself
validate the implementation or authorize a clinical claim.

## 1. Purpose

The target release is a deliberately bounded 0D model:

`five-wall base + coronary + MCS + event-driven rhythm`.

The model is intended to explain pressure, volume, flow, global wall mechanics,
device interaction, and activation timing. It is not a waveform-fitting model,
but it is also not a spatial electrophysiology, CFD, oxygen-transport, or
patient-specific model. Every retained state must be justified by a physical
memory that materially affects an output in the intended context of use.

Evidence is kept in four non-interchangeable roles:

1. **equation anchor**: supports the form of a law or topology;
2. **construction/calibration**: supplies a parameter or target used to build it;
3. **independent validation**: was not used to choose the compared parameter;
4. **interpretation boundary**: defines what may and may not be inferred.

The same dataset must not serve roles 2 and 3 for the same output.

Validation readiness is tagged throughout this map:

- **H1**: exact numerical or physical verification invariant;
- **H2**: quantitative held-out comparison, permitted only after the observation
  artifact, units, uncertainty and analysis metric are frozen;
- **H3**: held-out direction, ordering, sign or shape check;
- **Q**: qualitative context, applicability boundary or future evidence only.

`raw-open`, `digitizable` and `raw-needed` describe data readiness, not evidence
quality. H2 does not imply that a gate is already closed, and this document does
not set a numerical tolerance from an abstract or a plotted curve. If a datum is
used to select a parameter, profile or acceptance limit, it becomes construction
evidence for that output and must be replaced by a disjoint held-out datum.

## 2. Why this complexity level

| Physical memory | Retained state | Why an algebraic substitute is insufficient | Deferred detail |
|---|---|---|---|
| Myofilament activation and viscoelastic wall response | existing Land/SLS wall states | force depends on calcium and length history | ionic EP, remodeling, multipatch |
| Coronary vascular storage and squeezing | two compliant intramyocardial volumes per layer | produces arterial/venous phasic separation and diastolic dominance | explicit tree and oxygen transport |
| Coronary metabolic/pressure adaptation | six layer tone states plus accepted physical-time integrals | resistance depends on accepted mean flow history, not a Newton candidate or retained sample | molecular mediators and autonomic control |
| Rotary support circuit inertia | one flow state per connected circuit | published circuit \(L/R\) can be material relative to a beat and rhythm transition | motor/electrical controller states |
| Rhythm and conduction history | source phase/counter, event queue/cursor, AV recovery/concealment, bounded interval history | an irregular trajectory cannot be a function of global phase alone | action potentials, ECG and regional propagation |
| IABP triggering | accepted valve/ventricular event identity and balloon transition state | phase-only triggering loses missed, early, late and irregular-beat behavior | commercial AUTO algorithms |

This is the minimum state set that can support the planned causal claims. More
detail is rejected unless a preregistered observable or replay invariant needs
it.

## 3. Coronary traceability

| Model choice | Equation anchor | Construction role | Independent check | Non-claim |
|---|---|---|---|---|
| Compliant intramyocardial pump rather than resistance-only bed | [Burattini et al. 1985](https://doi.org/10.1007/BF02407768), [Spaan et al. 2000](https://doi.org/10.1152/ajpheart.2000.278.2.H383) | compliance split and IMP sensitivity | simultaneous source-inlet, Art-out, Q1, Q2 and venous waveform features | no vessel-resolved pressure or flow |
| Mechanics-derived IMP with transmural heterogeneity | [Bovendeerd et al. 2006](https://doi.org/10.1007/s10439-006-9189-2), [Algranati et al. 2010](https://doi.org/10.1152/ajpheart.00925.2009) | bounded EPI/ENDO IMP gains | loading/contractility and RCA/LCA direction tests not used to tune those gains | no direct tissue-pressure prediction |
| LAD/LCx/RCA and EPI/ENDO parallel territories | [Hiramatsu et al. 1998](https://doi.org/10.1111/j.1469-7793.1998.619bn.x), [Munneke et al. 2022](https://doi.org/10.3389/fphys.2022.830925) | resting territory allocation | human phasic vessel comparison and transmural reserve directions | no collateral or regional ischemic border zone |
| Linear plus signed quadratic focal loss | [Young and Tsai 1973](https://doi.org/10.1016/0021-9290(73)90099-7) | authored lesion geometry/bracket | ordered pressure-drop and flow sweeps across unseen combinations | no angiographic diameter reconstruction |
| Separate focal epicardial loss, structural microvascular resistance, and impaired-vasodilation tone-floor axes | [Rahman et al. 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7242900/) supplies endotype/claim-boundary context; model parameters remain explicit mechanism hypotheses | one-factor macro lesion, structural R1/Rm, and tone-floor sweeps before limited interaction tests | no claim that the tone-floor axis equals clinical “functional CMD”; that cohort's functional endotype had elevated resting flow with normal/decreased minimal resistance |
| Slow integral flow homeostasis (a deliberately reduced controller, not a transcription of either source) | coronary adjustment dynamics in [Dankelman et al. 1989](https://doi.org/10.1113/jphysiol.1989.sp017460) and interacting control mechanisms in [Cornelissen et al. 2002](https://doi.org/10.1152/ajpheart.00491.2001) | reference flow and bounded time constant | pressure-step, demand-step, hyperemia/recovery, CMD floor and cross-dt response | no molecular metabolic pathway |
| FFR-like output only under stable hyperemia | [De Bruyne et al. 1994](https://doi.org/10.1161/01.CIR.89.3.1013), [Pijls et al. 1995](https://doi.org/10.1161/01.CIR.92.11.3183) | measurement-site definition only | zero-lesion identity and ordered lesion response | no diagnostic or treatment threshold claim |

Human phasic flow is a held-out reference context. In 301 patients, mean
diastolic-to-systolic velocity ratios were about 1.85/1.76 in the left coronary
arteries at rest/hyperemia and 1.53/1.58 in the RCA
([Nijjer et al. 2021](https://pubmed.ncbi.nlm.nih.gov/34338643/)). These are
velocity ratios in a clinical cohort, not exact flow targets for every model
territory. They become acceptance ranges only after measurement-site and phase
definitions are fixed in the protocol.

Resting mean flow is a construction target. It cannot also pass the normal-flow
validation gate. The independent coronary gates are therefore waveform phase,
pressure response, reserve, lesion/CMD separation, recovery dynamics, and
cross-step convergence.

### 3.1 Held-out coronary evidence hierarchy

| Class | Independent protocol and endpoint | Data readiness | Allowed use and leakage boundary |
|---|---|---|---|
| **H2/H3** | In conscious dogs, Canty et al. lowered circumflex pressure at approximately fixed global demand and measured microsphere endocardial flow and regional function. Flow remained about 1.05 to 0.99 mL/min/g from 84 to 49 mmHg; reported lower pressure limits were about 39 +/- 5.6 mmHg for wall thickening and 42 +/- 7.4 mmHg for segment shortening ([Canty et al. 1988](https://doi.org/10.1161/01.RES.63.4.821)). | Figures are digitizable; point-level raw data are unavailable. | Gate the normalized plateau--knee--decline shape and coupled flow/function loss. The canine knee pressures are not universal human targets. |
| **H3** | In 26 patients with isolated LAD disease, PET flow and invasively measured distal pressure spanned 46--124 mmHg; the reported resting-flow slope was small and not significant ([Di Gioia et al. 2020](https://doi.org/10.1016/j.jacc.2020.06.074)). | Scatter is digitizable; raw paired observations are not public. | Human plateau-slope and normalization check only. The cross-sectional cohort does not define a within-patient lower autoregulatory knee. |
| **H2/H3** | Simultaneous human coronary pressure-flow measurements provide diastolic/systolic velocity ratios and the held-out LCA-over-RCA distribution described above ([Seligman/Nijjer et al. 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9724998/)). | Open tables and figures; underlying IDEAL observations are not public. | Gate explicitly matched measurement-site and phase definitions. Do not compare a clinical Doppler velocity ratio directly with a hidden compartment flow. |
| **H3** | Graded canine stenoses measured by epicardial Doppler and radiolabeled microspheres show decreasing hyperemic reserve and disproportionate loss of endocardial reserve as stenosis increases ([Nohara et al. 1989](https://doi.org/10.1016/0002-8703(89)90005-7)). | Figures are digitizable but the article/raw data are not openly available. | Gate normalized lesion severity and transmural ordering after the digitization protocol is frozen; do not fit an absolute human lesion law. |
| **H3** | In patients with angiographically normal epicardial arteries, diabetes or hypertension reduced coronary flow reserve principally through lower hyperemic velocity ([Michels et al. 2007](https://doi.org/10.1016/j.amjhyper.2007.08.005)). | Published summary/figures; raw observations are unavailable. | Gate the distinction between structural microvascular impairment and focal epicardial stenosis, not disease-specific magnitude. |
| **H3** | In 86 patients with angina and no obstructive disease, structural CMD combined reduced reserve with high minimal resistance and lower peak flow, whereas the labelled functional endotype had high resting flow with normal/decreased minimal resistance ([Rahman et al. 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7242900/)). | Open aggregate tables/figures; reusable pressure/flow beat series are unavailable. | Endotype direction and non-equivalence gate only. It prevents relabelling a high model tone floor as clinical functional CMD and does not validate an absolute R1/Rm or tone-floor scale. |

The H2 coronary artifacts must be digitized independently, reconciled and
frozen before a model result is viewed. Burattini, Spaan, Bovendeerd,
Algranati, Hiramatsu, Munneke, Young/Tsai, both 1989 Dankelman experiments,
Cornelissen, De Bruyne and Pijls remain equation/construction sources in this
program. Their parameter values, response times, resting-flow targets and FFR
definitions cannot also close a held-out gate. In particular, the 25 s
integral-controller coefficient is a deliberately reduced construction choice:
it is not a first-order conversion of a Dankelman output `t50`, and this model
does not reproduce either paper's cannulated-left-main measurement station,
constant-pressure/constant-flow protocol, or pressure-flow-ratio endpoint.

Pradhan, Feigl, Gorman and Brengelmann separated metabolic feedback,
adrenergic feed-forward control and a myogenic pressure contribution, fitted
their combined control model to exercise data, and then evaluated predictions
against pacing and autoregulation experiments
([Pradhan et al. 2016](https://doi.org/10.1152/ajpheart.00663.2015)). This is
strong evidence that demand and pressure interventions should be tested
separately. It is not a reason to add three poorly identifiable controller
states to the present release. The current one-state-per-layer integral owner
is therefore an explicit reduced mechanism: it may claim only bounded flow
homeostasis until pressure, pacing/demand and hyperemia protocols show that the
missing feed-forward/myogenic separation is necessary. Bai et al.'s cannulated
LAD 20 mmHg pressure interventions across 60--180 mmHg provide additional
experimental direction and vascular-volume context
([Bai et al. 1994](https://doi.org/10.1152/ajpheart.1994.266.6.H2359)), but their
anesthetized-dog station and range are not direct human acceptance bands.

## 4. MCS traceability

| Model choice | Equation/parameter anchor | Independent check | Non-claim |
|---|---|---|---|
| Signed rotary H-Q law with patient pressure coupling | [Wang et al. 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC3894974/) and device-specific published curves | held-out mock-loop pressure/flow points and ordered afterload/speed sweeps | no universal product curve |
| One accepted circuit-flow state, BE integrated | Wang HeartMate-II pump/cannula \(R,L\) values | analytic-versus-FD Jacobian, constant-boundary transient, dt halving and algebraic shadow | no motor torque/current dynamics |
| Explicit reverse flow, clamp reaction and profile-specific inlet suction | HMII Choi pressure-dependent series resistance from Wang; legacy smooth availability only for provisional non-HMII profiles | stopped-pump backflow, clamp/disable transitions, exact series-resistance residual/tangent, explicit constraint reaction ownership, and the low-flow/backflow regimes measured by [Boes et al. 2019](https://doi.org/10.1109/TBME.2018.2876840) | no universal suction threshold, chamber-collapse geometry or chatter controller claim |
| Impella P-level maps to speed, not fixed flow | [FDA Impella CP IFU](https://www.fda.gov/media/140767/download) | pressure-dependent flow at multiple heads, including held-out heads | no clinical displayed-flow accuracy claim |
| VA/VV circuit topology and pressure stations | [Takahashi et al. 2026](https://doi.org/10.1186/s40635-026-00870-z), [ELSO circuit guideline](https://www.elso.org/Portals/0/files/pdf/ELSO_Guidelines_for_Adult_and_Pediatric_Membrane_Oxygenation_Circuits.pdf) | conservation, cannulation-direction tests, held-out mock-loop cases | no cannula-position or management recommendation |
| IABP as aortic displacement volume with event-owned timing | [Sun 1991](https://doi.org/10.1152/ajpheart.1991.261.4.H1300) and [Schampaert et al. 2013](https://pubmed.ncbi.nlm.nih.gov/23263334/) | valve-event timing, pressure augmentation/afterload directions, missed-trigger matrix | no pneumatic console, balloon occlusivity/geometry, proprietary trigger algorithm or patient-validated model |

For the cited HeartMate-II circuit,

\[
R_{eq}=0.3061\ \mathrm{mmHg\,s/mL},\qquad
L_{eq}=0.04717\ \mathrm{mmHg\,s^2/mL},\qquad
L_{eq}/R_{eq}\approx0.154\ \mathrm{s}.
\]

Consequently the quasi-static implementation may remain a beat-mean shadow,
but cannot be the release owner for rhythm-aware phasic claims. Other pumps
must receive their own inertance evidence; HeartMate-II values must not be
silently copied into HeartMate 3, Impella, or ECMO profiles.

The HMII construction profile also transcribes the Choi inlet law as a series
resistance `Rk = 0` for `P_LV > 1 mmHg` and
`Rk = 3.5(1 - P_LV) mmHg s/mL` otherwise. It is part of the hydraulic
residual and has no availability constraint reaction or whole-LV-volume
multiplier. The equality point belongs to the active branch for deterministic
semismooth differentiation. This law is construction evidence from Wang/Choi;
it must not be reused as its own suction validation.

There is no universal 10 L/min instantaneous flow clamp in the HMII equation.
Yang et al. independently traversed 1.6--4.3, 2.0--6.8 and 3.0--9.0 L/min
instantaneous ranges at 9000 rpm under their low, nominal and high mock-loop
conditions ([Yang et al. 2015](https://doi.org/10.1016/j.jtcvs.2015.06.049)).
The FDA-advertised `up to 10 L/min` value is retained as an official-domain
diagnostic only. Crossing either published domain marker is reported without
clipping flow, adding a reaction or claiming that this implementation has been
validated throughout that domain. Because both markers describe forward flow,
zero and reverse samples are explicitly `non-forward-flow-not-applicable` and
are never counted as lying inside the Yang forward-flow traversal. Reverse
diastolic flow is nevertheless a physically admissible rotary-pump regime:
Boes et al. observed it in three of four measured pumps under partial support.
Sunagawa's HeartMate-II normal-heart mock loop further reported a peak near
`-3 L/min` at 8000 rpm and almost no regurgitant flow at 10000 rpm; at 6000 rpm
the instantaneous range was approximately `-5` to `+7 L/min`
([Sunagawa et al. 2015](https://doi.org/10.1016/j.jtcvs.2015.04.015)). These
observations support retaining signed flow and make an intermediate-speed
negative minimum mechanistically plausible, but they do not validate the
amount, residence fraction, or closed-loop loading produced here.

The held-out MCS evidence hierarchy is now preregistered separately from those
construction sources:

1. **H2, digitizable: HeartMate II component validation.** Sunagawa et al.
   measured independent
   steady H-Q points at 6000, 8000, and 10000 rpm and 200 Hz pulsatile
   pressure-flow loops in normal and failing mock circulations
   ([Sunagawa et al. 2015](https://doi.org/10.1016/j.jtcvs.2015.04.015)).
   Only their newly obtained markers and waveforms are held out; curves copied
   from earlier work are not. Stanfield et al. provide a second independent
   9000 rpm dataset with three repeated 100 bpm pressure conditions and
   reported beat mean/variation, pulsatility index, and dynamic H-Q loops
   ([Stanfield et al. 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3705790/)).
   Their Table 3 reports HeartMate-II/axial-1 values at 9000 rpm and 100 bpm:
   flow `4.8 +/- 1.6`, `3.4 +/- 2.5`, and `5.0 +/- 1.3 L/min`, head
   `55 +/- 24`, `70 +/- 38`, and `53 +/- 19 mmHg`, and flow pulsatility index
   `0.96`, `2.01`, and `0.74` in normotensive, hypertensive, and hypotensive
   conditions. Those tabulated values require no digitization; the loop traces
   still require duplicate digitization and freezing before quantitative shape
   comparison.
   [May-Newman 2022](https://doi.org/10.1111/aor.14157) supplies a separate
   directional H-Q result: HeartMate-II mock-loop studies at 8 and 11 krpm and
   LV ejection fractions of 10--28% produced counter-clockwise dynamic
   pressure-flow loops whose enclosed area increased with ejection fraction.
   This direction can be checked without pretending that speed, ventricular
   function, compliance, or pressure stations match the present fixture.
   These datasets will be frozen before model comparison.
   Pump-only validation uses measured pressure difference as the boundary input
   and compares mean flow, bias/RMSE, reverse-flow fraction, loop area, and
   pressure-flow phase; it does not retune the closed-loop circulation.
   Stanfield's reported variation is not treated as replicate uncertainty
   unless its interpretation is confirmed.
2. **H2, raw-needed: Impella component validation.** Direct outlet-sensor
   measurements across
   P1--P9 and multiple heads are the preferred independent evidence
   ([Said et al. 2026](https://doi.org/10.1093/ehjacc/zuag066)). The numerical
   figure data are not currently available, so no quantitative acceptance gate
   will be invented from the abstract or console-displayed flow. Raw points and
   repeat uncertainty must be obtained before this gate can close.
3. **H3: Combined Impella/VA-ECMO construction-independent directions.** The
   75 bpm shock-loop tables of Yahagi et al. cover Impella P0--P9, Senko ECMO
   0--3000 rpm, and their combinations
   ([Yahagi et al. 2024](https://doi.org/10.1038/s41598-024-64721-1)). They can
   presently gate monotonic directions, flow sign, and the reported P4--P6
   transition from retrograde to antegrade aortic flow at 3000 rpm. Missing
   component bill-of-material and repeat uncertainty prevent their use as an
   absolute device-profile fit or magnitude gate.
4. **Q: Future rhythm--MCS--coronary interaction context.** A short-duration goat
   ventricular-fibrillation experiment reports Impella P0/P4/P8 pressure,
   pulmonary-flow, and coronary-flow responses
   ([Yokota et al. 2026](https://doi.org/10.1093/ehjopen/oeaf173)). It is useful
   as a normalized direction/plausibility comparison only, not HeartMate-II
   calibration, human prediction, or a generic VF validation claim.

The remaining device and circuit evidence has different readiness and must not
be collapsed into one generic "MCS validated" label:

| Class | Subsystem and independent evidence | Data readiness | Release use and limitation |
|---|---|---|---|
| **H3** | In a porcine shock model, increasing peripheral VA-ECMO from 1 to 5 L/min raised systolic pressure from 60 +/- 7 to 97 +/- 8 mmHg, lowered native cardiac output from 2.8 +/- 0.3 to 1.86 +/- 0.53 L/min, and increased LV end-systolic volume and stroke work, while LVEDP and LVEDV were not significantly monotone ([Ostadal et al. 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4537539/)). | Open article/tables; no point-level raw data. | Coupled direction gate for pressure, native output, end-systolic volume and work. It must not impose a universal LVEDP/EDV response or animal magnitude. |
| **H2** | Whole-human-blood pressure-flow curves cover 14 return cannulae and 18 drainage cannulae across manufacturers ([Broman et al. return cannulae](https://doi.org/10.1177/0267659119830521), [Broman et al. drainage cannulae](https://doi.org/10.1177/0267659119830514)). | Graphical curves are digitizable; raw curve points are unavailable. | Quantitative component gate only for the same brand, diameter, length, fluid and pressure-station definition. No transfer between cannulae. |
| **H2/H3** | In 15 VV-ECMO patients, critical drainage near -100 mmHg occurred at about 5.5 L/min for 25 F and 4.7 L/min for 23 F cannulae; in-vitro flow overestimated these limits by about 44% and 41% ([Robak et al. 2022](https://doi.org/10.1097/MAT.0000000000001668)). | Summary values are available; patient-level raw data and full curves are needed for a quantitative profile gate. | Exact-cannula suction/availability envelope and direction check. It is not a generic ECMO pump curve. |
| **Q** | In 14 VV-ECMO patients, recirculation was 19.0 +/- 12.2% with multistage and 38.0 +/- 13.7% with conventional drainage. In one case, raising circuit flow from 4.19 to 5.54 L/min increased recirculation from 30% to 66% and reduced effective flow ([Palmér et al. 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC5098462/)). | Open article/summary measurements; no reusable point-level raw dataset. | Applicability/non-claim boundary while recirculation and gas transport are absent. Blood flow must not be presented as oxygen delivery. |
| **H3, blocked** | Proper, premature and late IABP timing produced different beatwise LV pressure-volume responses in low-EF postoperative patients ([Schreuder et al. 2005](https://doi.org/10.1016/j.athoracsur.2004.07.073)). | Figures are potentially digitizable; raw beats are unavailable. | Direction and mistiming gate only after accepted AoV/electrical events drive balloon transitions. A phase-derived IABP cannot close this gate or claim irregular-beat timing validity. |
| **H3, blocked** | Later deflation approaching LV ejection changed pressure-time indices more than conventional timing in 43 patients, without a significant cardiac-output or stroke-volume-index difference across settings ([Kern et al. 1999](https://doi.org/10.1016/S0002-8703(99)70373-X)). | Abstract-level aggregate changes are available; per-beat traces and reusable patient-level data are not. | Timing-direction context only. It prohibits claiming that later deflation universally increases output and does not identify one transferable delay parameter. |
| **H3, blocked** | Deflation during isovolumic contraction changed ventriculoarterial coupling and efficiency relative to conventional timing in eight dogs ([Sakamoto et al. 1995](https://doi.org/10.1097/00002480-199507000-00077)). | Aggregate animal results only; species/loading transfer is unsupported. | Construction rationale for ventricular-event deflation and a mistiming direction check, not a human magnitude gate. |
| **H3, boundary evidence** | In 288 recordings from nine dogs with chronic aortic stenosis, late LV--aortic pressure crossover preceded flow/Doppler end-ejection by `37 +/- 29 ms`, whereas the aortic incisura differed by `2 +/- 17 ms` ([Bermejo et al. 2004](https://doi.org/10.1161/01.CIR.0000139846.66047.62)). | Flowmeter and Doppler were the experimental references; reusable raw traces are unavailable. | A model pressure crossover must not be described as an independently validated anatomical leaflet-closure time. This is especially restrictive for stenotic valves and blocks a clinical IABP timing claim. |

Acceptance limits for digitized H-Q data will be fixed before simulation from
the combined measurement, repeat, digitization, and numerical uncertainty.
Where repeat uncertainty or raw points are unavailable, the evidence remains a
direction, sign, or transition-interval check rather than an arbitrary hard
absolute tolerance. Manufacturer IFUs, Wang/Choi coefficients, and the
Takahashi Senko construction dataset remain construction/transcription
evidence for their respective profiles and cannot be reused as held-out data.
Schampaert displacement/timing data likewise remain IABP construction evidence;
Said remains `raw-needed`, Yahagi is presently H3, and the Broman exact-cannula
curves are H2 only after a frozen two-reader digitization and uncertainty record.

## 5. Rhythm traceability

| Model choice | Equation/data anchor | Independent check | Non-claim |
|---|---|---|---|
| Exact accepted-time activation events driving a two-state calcium kernel | existing Land calcium interface and exact event propagation | fixed-sinus compatibility, off-grid chunk invariance, rollback and exact resume | no action potential or ECG |
| Separate atrial and ventricular activations | chamber physiology and conduction identity | loss-of-atrial-activation and AV-delay interventions at matched ventricular rate | no regional atrial contraction |
| Recovery-dependent AV gate with concealed conduction | [Jørgensen et al. 2002](https://doi.org/10.1006/bulm.2002.0313) | patient-disjoint LTAFDB RR distributions plus held-out human recovery/accommodation directions; the Jørgensen trace is component reproduction only | no AV-node anatomy or drug prediction |
| Stationary AF atrial source uses an unconditioned Pearson-IV parent, exact conditioning on positive AA, and an explicit nonnegative finite moving-average filter with a reported induced ACF | [Climent et al. 2011](https://doi.org/10.1007/s11517-011-0823-2) | frozen I-AFDB atrial annotations and patient-disjoint LTAFDB end-to-end RR metrics; per-seed conditioned-density/ACF reproduction is self-consistency only | conditioned moments differ from the parent, the filtered marginal is not claimed to remain exactly Pearson-IV, negative ACF is outside V1, and no AF initiation/termination, re-entry, rotor or spatial mechanism is claimed |
| Authored PAC/PVC enter chamber capture rather than editing RR intervals | [Breithardt and Seipel 1976](https://pubmed.ncbi.nlm.nih.gov/1269126/) and accepted electrical-capture causality | patient-disjoint clean MITDB N-A-N/N-V-N coupling and post-ectopic interval distributions | no stochastic ectopy burden, retrograde VA conduction, fusion or QRS morphology |
| PVC mechanical strength follows accepted filling/interval history rather than a fitted PVC waveform | [Takagi et al. 1986](https://pubmed.ncbi.nlm.nih.gov/2443582/) and [Huizar et al. 2016](https://doi.org/10.1161/CIRCEP.115.003387) | longer coupling interval should not reduce ectopic stroke volume or `dP/dtmax` in a matched reduced-model sweep; report the post-ectopic beat separately | no ventricular origin, regional propagation, QRS dyssynchrony, chronic PVC-cardiomyopathy or subject-level magnitude claim |
| Distal conduction is downstream of AV-node conduction | [Narula and Samet 1970](https://doi.org/10.1161/01.CIR.41.6.947) | MITDB 231 P-to-QRS delay/drop sequence after source-lineage audit | no anatomic localization or Mobitz diagnosis from a 2:1 pattern |
| Escape and simple VVI are independent ventricular sources suppressed only by accepted ventricular capture | [Kennelly and Lane 1978](https://pubmed.ncbi.nlm.nih.gov/87278/), [Grendahl et al. 1979](https://doi.org/10.1111/j.1540-8159.1979.tb05221.x), and [FDA Micra clinician manual](https://www.accessdata.fda.gov/cdrh_docs/pdf15/P150033D.pdf) | exact accepted-event ordering, silence/escape direction and device-timer tests | the fixed escape timer does not reproduce overdrive-suppression recovery, exit block, sensing threshold, blanking, hysteresis, rate response or capture management |
| Irregular RR has an effect separate from mean rate | [Clark et al. 1997](https://doi.org/10.1016/S0735-1097(97)00254-4) | matched-rate regular versus irregular intervention: CO down, PCWP/RAP up in the reference population direction | no patient-level magnitude prediction |
| Interval-strength effects require one accepted-ventricular-event SR-load state | [Rice et al. 2000](https://doi.org/10.1152/ajpheart.2000.278.3.H913) and [Wier and Yue 1986](https://doi.org/10.1113/jphysiol.1986.sp016167) ferret construction data | [Hardman et al. 1994](https://doi.org/10.1007/BF00788281) supplies an independent human directional/history check for restitution, postextrasystolic potentiation and its decay; [Gwathmey et al. 1990](https://doi.org/10.1172/JCI114611) remains inspected construction context | no absolute human cellular calcium, exact explained-variance, HF-specific calcium handling or alternans claim |

The Clark intervention is especially useful because it separates rhythm
irregularity from mean rate: in 16 patients, matched-rate irregular pacing
changed cardiac output from `5.2 +/- 2.4` to `4.4 +/- 1.6 L/min`, pulmonary
capillary wedge pressure from `14 +/- 6` to `17 +/- 7 mmHg`, and right-atrial
pressure from `8 +/- 4` to `10 +/- 6 mmHg`. These are group means under acute
right-ventricular-apical pacing after AV-node ablation. The present lumped
activation owner has no pacing-site propagation or QRS dyssynchrony, so the
study supplies directional population validation and study-design structure,
not magnitude fitting or a claim to reproduce RV-apical pacing.

The one-state interval-strength reduction is deliberately smaller than a
finite list of fitted RR coefficients, but it still retains distributed event
history through its accepted SR-load state. In 15 catheterized patients with
AF, Hardman et al. found that `LV dP/dtmax` depended on as many as six preceding
intervals and separately identified mechanical restitution,
postextrasystolic potentiation, and decay of potentiation. The preregistered
reduced-model check is therefore an impulse-history direction test: a short
coupling interval weakens the immediate event, can potentiate a later event,
and that excess must decay under repeated reference intervals. The published
`91%` maximum explained variation, patient coefficients, and absolute
`dP/dtmax` are not fitting targets for the calcium-strength scalar.

AF is not represented by drawing independent RR intervals and suppressing the
atria. The release path is atrial impulses -> accepted AV recovery/concealment
-> ventricular activations -> calcium events. A static explicit schedule stays
available as a deterministic replay backend, not as the biological AF model.

### 5.1 Electrical composition boundary

The generated V1 event time denotes effective calcium onset. It must therefore
not be reused as though it were simultaneously a sinoatrial discharge, atrial
depolarization, AV-nodal input, His-Purkinje activation, pacemaker stimulus and
mechanical contraction. The composition boundary for additional phenotypes is:

`source impulse -> chamber capture -> AV/infra-His decision -> ventricular capture -> effective calcium event`

An IABP or other beat-timed actuator consumes the accepted electrical event
selected by its controller; it does not alter this lineage. The capture owner
provides deterministic same-time arbitration, independent atrial and
ventricular refractory gates, route restrictions and AV-parent lineage. Its
priority order is a simulator composition rule, not a measured hierarchy. A
blocked pacemaker stimulus is retained as a blocked stimulus, while escape and
demand pacing are generated only after the relevant absence-of-capture rule is
evaluated. Fusion, paced-QRS morphology, excitable tissue propagation and
regional activation are outside this lumped model.

The standalone IABP actuator follows that boundary without claiming an ECG or
commercial AUTO controller. It starts deflation at an accepted captured
ventricular activation and starts inflation only at a later, lineage-bound
valve event. Assist ratio counts accepted ventricular captures, not nominal
beat phase. In the present competent-valve hydraulic law, the valve owns no
bulk-flow inertia or leaflet contact: once the LV--aortic pressure gradient
becomes nonpositive, reverse effective area is exactly zero and a hydraulic
support reaction replaces reverse flow; with regurgitation it instead marks the
transition into reverse flow. A located pressure crossing can therefore
establish **modeled aortic-valve forward-flow cessation** (and, for a competent
valve, the onset of reverse-hydraulic support), but not an independently
validated anatomical leaflet-closure or clinical dicrotic-notch time. Bermejo
et al. show why that distinction matters: pressure crossover can precede
measured end-ejection, particularly in aortic stenosis. The event must retain
this model-specific name and applicability;
the IABP physiology gate remains blocked until its timing is compared at the
declared pressure/flow station. Substituting the end of a fixed phase interval
would still recreate a separate timing error and is not acceptable.

The electrical owner and its checkpoint establish determinism, rollback and
exact-resume evidence only. They do not by themselves validate a PAC, PVC, AV
block or pacing phenotype. Checkpoint SHA-256 is used for accidental-change
detection and provenance, not authentication against an adversary.

### 5.2 Generated sinus/flutter held-out protocol

Jørgensen's one flutter and one AF trace, its recovery/concealment equation and
the reproduced 4:1 sequence are construction/component-reproduction evidence,
not independent validation. Generated rhythm uses the following disjoint
hierarchy:

| Class | Independent evidence | Data readiness | Preregistered use |
|---|---|---|---|
| **H3** | Human extrastimulus studies at multiple basic cycle lengths found that AV nodal effective refractory period lengthened while functional refractory period shortened slightly as the basic cycle length shortened ([Denes et al. 1974](https://doi.org/10.1161/01.CIR.49.1.32)). | Published tables/figures; no raw event series. | Gate signs and ordering across cycle lengths, not an exact single-path patient curve. |
| **H3** | Abrupt acceleration in ten patients produced crescendo, decrescendo or effectively instantaneous AV nodal accommodation depending on preceding history ([Lehmann et al. 1984](https://doi.org/10.1016/0002-9149(84)90686-6)). | Published figures; raw beat series unavailable. | Gate the transient delay sequence after a rate step, rather than only the terminal n:m conduction ratio. |
| **H2, protocol-ready** | SHDB-AF contains raw two-lead Holters for 122 subjects/128 approximately 24-hour records, with 98 expert-reviewed records and 45 annotated flutter intervals comprising 195,659 beats ([SHDB-AF v1.0.1](https://physionet.org/content/shdb-af/1.0.1/), [dataset paper](https://doi.org/10.1038/s41597-025-04777-4)). | `raw-open`: WFDB signals, R peaks, rhythm intervals and metadata. Atrial activation times are not supplied. | Select stable AFL intervals and freeze signal-quality, transition, medication and exclusion rules before simulation. R peaks support RR median/IQR/CV immediately. Conduction-ratio sequence/transition matrix, integer-multiple residual and AA-to-RR delay become H2 only after a blinded F-wave annotation subset is frozen. |
| **Q** | Large ambulatory reference data place healthy resting heart rate and PR within broad population ranges ([Mason et al. 2007](https://doi.org/10.1016/j.jelectrocard.2006.09.003)). | Published percentiles; no open beat-level cohort. | Default-sinus plausibility only; PR includes atrial and His-Purkinje conduction and is not the model AV delay. |

The SHDB-AF dataset version and checksums, patient-level split, stable-flutter
definition, artifact handling, medication strata and analysis code must be
frozen first. If any SHDB subject is used to select AV parameters or an
acceptance limit, that subject is construction data and validation remains
patient-disjoint. SHDB-AF currently supports a regular-flutter ventricular
response claim only; it does not authorize AF, ECG morphology, drug-response or
patient-specific prediction claims.

For future extensions, Climent records cannot both construct and validate an AF
source. Gwathmey force-interval curves have already been inspected during
construction and therefore cannot serve as held-out evidence; an independent
human force-interval validation source remains open. Clark remains an H3
irregularity intervention only while it is not used to tune the response
magnitude.

### 5.3 Phenotype owners and disjoint evidence

The implementation sequence is `regular/AF/authored sources -> chamber capture
-> proximal AV recovery/concealment -> distal gate -> escape/VVI arbitration
-> accepted ventricular capture -> interval-strength and exact calcium`.
Each layer is checked before it is allowed to alter calcium or hemodynamics.
A blocked impulse or failed capture may update the state of the component that
processed it, but it must not advance the accepted-ventricular clock, deposit a
calcium event, inhibit physiological escape, or create a mechanical beat.

The stationary AF construction law first defines an **unconditioned parent**
Pearson-IV distribution whose four explicit moments satisfy the strict Type-IV
criterion in Climent Eq. 8 and whose fourth moment exists. Because that parent
has support on the whole real line whereas an AA interval must be positive, the
source uses exact rejection conditioning: a tilt-accepted parent draw is
accepted if and only if `AA > 0`. Nonpositive parent draws are counted
explicitly; they are not clamped, floored or substituted. The source innovation
therefore follows the parent law conditioned on positivity, not the
unconditioned Climent parent. Its moments differ from the configured parent
moments, and neither exact parent-moment identity nor finite-sample PDF
reproduction is claimed.

The subsequent finite moving-average filter accepts only nonnegative taps,
requires `c0 > 0`, and checks unit DC gain with compensated summation and a
fixed absolute `64 * Number.EPSILON` tolerance that does not grow with tap
magnitude. These restrictions structurally preserve positive AA intervals. The
unit-DC condition preserves the **conditioned innovation mean**, not the
configured unconditioned parent mean. The owner reports, rather than fits, the
finite-lag ACF induced by those taps. This V1 can represent only nonnegative
induced ACF values; negative autocorrelation requires a future positive-support
construction. The moving-average output is not claimed to retain the exact
positive-conditioned Pearson-IV marginal.
Climent found no significant PDF change after filtering in the studied series,
which is construction evidence rather than a mathematical identity. Climent
reported skewness 0.06--2.24,
kurtosis 3.28--13.27, lag-1 autocorrelation -0.03--0.46 and lag-2
autocorrelation -0.02--0.28 across the 20 source series. These ranges and the
paper's example series are construction context, not population priors,
defaults, fitted bounds or held-out limits.

The seeded owner uses a declared xoshiro128** stream, Box--Muller normal draws,
Marsaglia--Tsang gamma draws and a symmetric Pearson-VII/Student-t proposal.
Each Marsaglia--Tsang Gamma draw has its own finite 1,024-attempt hard bound.
That inner computational-safety bound is distinct from, and is not counted as,
the outer Pearson proposal bound; exhausting it fails without a Gamma or AA
substitute. It can theoretically reject an otherwise admissible configuration,
so this is not a physiological truncation or an efficiency/validity claim. A
pure constant-source verification seam exercises the same bounded core but is
not a production random source or model parameter.
Because `atan(y)` lies in `(-pi/2, pi/2)`, the exponential tilt has the explicit
envelope `exp(abs(lambda2)*pi/2)`. One total per-innovation proposal bound
counts both tilt rejections and nonpositive-parent rejections. Exceeding it is a
hard error, never truncation or substitution. Mathematical Pearson-IV
admissibility does not guarantee practical rejection efficiency, so an
admissible configuration can still hit this bound and no efficiency acceptance
claim is made. Full PRNG words, the Box--Muller spare, Gamma-attempt count, MA
history, tilt and nonpositive-parent counters, and canonical next-source
lineage are checkpointed. Restore verifies that the MA history is the exact
newest slice of the stored interval vector and that its source ID is canonical.
The output is an
atrial `primary-intrinsic` proposal only: capture and Jørgensen-style AV
recovery/concealment remain separate responsibilities. The AF claim remains
stationary; AF onset, termination, medication response, autonomic modulation,
patient fitting and coherent atrial calcium are outside this release. I-AFDB
and LTAFDB have not been inspected or used by this owner.

This coherent-atrial-calcium exclusion is a scope boundary, not evidence that
the fibrillating atria are mechanically silent. Plappert et al. assigned unique
activation series to 20 atrial wall patches and, after patient-specific fitting
in 17 patients, found that uncoordinated atrial contraction produced lower
overall pressure errors than a no-atrial-contraction ablation
([Plappert et al. 2025/2026](https://doi.org/10.1113/JP289469)). That result is
construction/comparative context because the same cohort was used for fitting.
The present release deliberately has one LA and one RA wall: depositing every
fibrillatory impulse into either whole wall would create a false coherent atrial
pump. It therefore represents loss of coordinated atrial kick and the
ventricular consequences of AF, but does not claim AF atrial pressure
morphology or atrial ejection. Residual uncoordinated atrial mechanics requires
either a separately validated population-reduction actuator or the deferred
multipatch release; it must not be added by scaling a whole-wall pulse until a
matched observable and evidence contract are frozen.

PAC and PVC are authored interventions, not draws from a fitted burden model.
A PAC has an explicit sinus-node reset policy (`reset` or `preserve`) because
human responses include both behaviors; a PVC does not directly reset the
sinus clock. No compensatory-pause event is inserted. The post-ectopic interval
therefore emerges from the still-running source, AV/distal refractory state and
ventricular capture. Patient-disjoint MITDB checks use a local clean-NN baseline
`B`, coupling interval `CI`, post-ectopic interval `PEI`, and the joint
metrics `CI/B`, `PEI/B`, and `(CI+PEI)/(2B)`; a universal
"PAC incomplete/PVC complete compensation" rule is not imposed.

The ectopic beat is not assigned a hand-drawn low-output waveform. In Takagi's
23-patient pulsed-Doppler study, PVC stroke volume and preceding inflow both
rose with coupling interval, and shorter coupling intervals reduced the
combined PVC-plus-postextrasystolic output. Huizar's controlled canine pacing
study likewise found greater PVC stroke volume and `dP/dtmax` at longer
coupling intervals, while also showing that spatial dyssynchrony and pacing
origin are separate mechanisms. The reduced model can therefore gate the
coupling-interval direction through filling and its single interval-strength
state, but it must not infer spatial origin or fit either study's magnitude.

The distal gate consumes already conducted AV-node outputs. It has pass,
refractory, authored-mask and disconnect modes. Equality at its ready boundary
passes; a distal drop never rewinds the proximal AV-node state. Complete block
therefore leaves atrial/AV activity intact while ventricular capture can arise
only from escape or pacing. This is a timing-compatible reduced phenotype, not
an anatomic localization or a surface-ECG diagnosis.

Escape and VVI are independent ventricular sources. An accepted ventricular
capture schedules physiological escape at `t + Tesc` and simple VVI at
`t + 60000/LRL` ms. At exact equality, endogenous/PVC/escape candidates are
arbitrated before a demand-paced candidate. A pacing stimulus advances its
device timer whether or not it captures, whereas only captured pacing resets
the accepted-ventricular and escape clocks. The approximately 35--40/min rates
reported in a small chronic-complete-block cohort are plausibility context, not
a healthy default or localization rule.

The fixed escape deadline is intentionally the smallest useful phenotype.
Grendahl et al. found that escape recovery after ventricular overdrive pacing
was often gradual, with mean first recovery time about `1.45` basal escape RR
intervals among records without apparent exit block, and that irregular
recovery also occurred. Those data are a recorded limitation, not a reason to
add another empirical state before a case requires overdrive-suppression or
exit-block behavior.

The first interval-strength extension is one normalized SR-load scalar from
Rice et al. For accepted ventricular interval Δt,

\[
a_n=1-e^{-\Delta t_n/\tau},\qquad
R_n=a_n\beta S_{n-1},\qquad
I_n=\gamma(1-ha_n),
\]

\[
S_n=S_{n-1}-R_n+rR_n+I_n.
\]

Only the accepted ventricular event updates `S`, and `R_n` scales the
existing exact-event calcium deposit. The published ferret construction values
and Rice example parameters are not human defaults. The human Gwathmey
force-interval material was inspected during construction and is context only,
not independent validation. The preregistered construction-shape check is a
weaker extrasystolic release at shorter coupling interval, followed by
post-extrasystolic potentiation that returns toward steady behavior as the
extrasystolic interval lengthens; independent human validation remains open.

Dataset lineage is tracked by original subject and waveform, not by derivative
dataset name. BUT-PDB is a curated extraction from MITDB, the MIT-BIH
Supraventricular Arrhythmia Database and LTAFDB, while MIT-BIH P-wave
annotations also reuse MITDB recordings. For example, two BUT-PDB records are
different excerpts of MITDB 231. These derivatives cannot be placed in a
separate fold and called independent. I-AFDB, LTAFDB, MITDB, BUT-PDB and P-wave
annotations require one origin ledger before construction/held-out splits are
frozen.

## 6. Cross-subsystem preregistration

The principal construction-independent coupled evidence is:

| Class | Matched intervention | Allowed coupled claim |
|---|---|---|
| **H3** | At matched ventricular rates of 75, 85 and 100/min in patients with LV dysfunction, AV-sequential pacing produced a higher cardiac index than ventricular-only pacing in every patient, with mean increases of 17%, 23% and 29%, and uniformly higher pulse pressure when atrial contraction preceded the ventricle physiologically ([AV-sequential pacing study](https://doi.org/10.1016/0002-9149(82)91947-6)). | A matched-rate mechanism-isolation test may require coherent atrial activation to improve cardiac index/pulse-pressure direction. The magnitude is not universal and ventricular-only pacing is not asserted to be clinically identical to flutter. |
| **H3** | Clark et al. studied 16 patients after AV-node ablation and replayed each patient's previously recorded AF ventricular sequence by right-ventricular-apical VVT pacing. Against regular VVI pacing at the same mean rate, irregular replay reduced cardiac output from 5.2 +/- 2.4 to 4.4 +/- 1.6 L/min and increased PCWP from 14 +/- 6 to 17 +/- 7 mmHg and right-atrial pressure from 8 +/- 4 to 10 +/- 6 mmHg ([Clark et al. 1997](https://doi.org/10.1016/S0735-1097(97)00254-4)). | Replay the same accepted ventricular interval sequence with coordinated atrial calcium suppressed, then compare it with a regular matched-mean-rate sequence. Gate CO and filling-pressure directions only. Acute RV-apical pacing, mixed ventricular function, and ablated AV conduction preclude magnitude, normal-sinus, or generic AF validation claims. |
| **H3** | In profound porcine shock, conductance pressure-volume analysis found VA-ECMO increased pressure-volume area whereas Impella CP did not increase it relative to shock, while both improved perfusion ([Møller-Helgestad et al. 2019](https://doi.org/10.4244/EIJ-D-18-00684)). | Gate the topology-level distinction between transaortic unloading and peripheral VA afterload, not device-profile magnitude. |
| **H3/Q** | In a porcine coronary-dissection model, Impella usually raised distal coronary pressure but worsened it in a severe TIMI-1 flap case ([Kariya et al. 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7522595/)). | Require the coupled model to expose regime changes; do not claim that increased support universally improves coronary perfusion. |

These studies have published summary/figure data but no open point-level
coupled dataset. They therefore support direction and regime checks, not
post-hoc numerical tolerances.

Before inspecting the final combined outputs, the following expectations are
locked:

| Intervention | Required direction/relation | Failure interpretation |
|---|---|---|
| all extensions off | base accepted state and native flows bit-exact | integration defect |
| increasing LVAD/Impella support at fixed profile | support flow generally increases; native AoV flow and LV pressure-volume work generally fall until a limiter or topology changes the regime | inspect pressure coupling, not force a monotone fit through suction |
| peripheral VA increase | systemic pressure/afterload rises; LV unloading is case dependent and must be reported rather than assumed | a single prescribed LV direction is scientifically invalid |
| matched-rate coherent atrial activation versus atrial mechanical suppression | cardiac index and pulse pressure follow the AV-sequential reference direction when ventricular timing and loading are held fixed | mechanism-isolation failure; do not reinterpret ventricular-only pacing as a complete flutter surrogate |
| Impella versus peripheral VA at comparable shocked loading | Impella and VA expose different LV pressure-volume-work directions while both may improve systemic perfusion | topology/coupling defect if both devices are forced into one generic support response |
| coronary hyperemia with no structural CMD | tone approaches the physiologic lower bound and flow reserve rises | controller or floor defect |
| increasing focal lesion at stable hyperemia | distal pressure and territory flow do not improve | lesion law or measurement-site defect |
| increasing structural CMD at fixed lesion | CFR/MRR-like reserve worsens without pretending that FFR uniquely identifies CMD | macro/micro attribution defect |
| matched-rate irregular ventricular rhythm | beat dispersion rises; mean CO is expected not to improve, with filling pressures expected not to fall in the Clark-style intervention | rhythm-history/calcium model requires review; magnitude is not fitted |
| authored PVC coupling interval, otherwise matched | longer coupling interval should not reduce ectopic stroke volume or ectopic `dP/dtmax`; the post-ectopic beat is reported separately | filling/interval-strength coupling defect; do not add a fitted PVC waveform or claim pacing-origin mechanics |
| tachycardia | diastolic fraction shortens and coronary reserve demand increases | phase/event or demand policy defect |
| IABP inflation after accepted modeled AoV forward-flow cessation | diastolic augmentation occurs without changing TBV | trigger/displacement defect |
| failed candidate at any subsystem | every accepted owner, counter and accumulator is byte-equivalent to the previous tuple | atomicity defect |

These directions are conditional, not universal monotonicity claims. A limiter,
valve transition, reverse-flow regime, or changed topology must be surfaced as
a regime change rather than hidden by smoothing or post-hoc fitting.

## 7. Numerical and physiological acceptance layers

No physiological result is considered until all **H1** numerical gates pass:

1. residual and analytic/FD Jacobian checks;
2. exact volume-transfer conservation and bounded TBV drift;
3. same-input retry purity and complete rollback;
4. exact checkpoint continuation, including mid-window/mid-event states;
5. 2/1 ms and selected 0.5 ms convergence for declared waveform metrics;
6. deterministic chunking and event-boundary invariance;
7. long-duration boundedness.

Physiology then uses separate **H2/H3** gates for:

- normal ranges that were not construction targets;
- paired intervention directions;
- ordered sweeps and ratios;
- waveform timing/shape at explicit measurement sites;
- stochastic distribution and autocorrelation with uncertainty across seeds;
- explicit `not-modeled` availability.

### 7.1 Raw waveform measurement contract

Waveform descriptors are calculated from accepted raw endpoints without
resampling, interpolation, smoothing or shape fitting. A trace is not eligible
for physiological review until its full accepted-state periodicity and the
relevant conservation gates pass. The following definitions are frozen before
the corrected HMII trace is inspected:

| Signal/loop | Measurement contract | Allowed check | Prohibited shortcut |
|---|---|---|---|
| Device-off LV pressure-volume loop | x is LV volume, y is absolute LV pressure; boundaries come from accepted valve events | signed orientation/area, self-intersection, event-defined EDV/ESV and modality-matched healthy reference | choosing EDV/ESV from arbitrary extrema after viewing the loop or mixing echo and CMR ranges |
| Device-on LV pressure-volume loop | same raw axes, with continuous LVAD drainage retained | report native AoV forward stroke volume, LVAD beat volume, total output, support fraction and LV volume excursion separately | calling `(Vmax-Vmin)/Vmax` native LVEF or requiring vertical isovolumic limbs |
| Aortic/LV pressure | accepted absolute pressures plus MV/AoV signed flow, effective area and leaflet state | valve-event ordering, crossings, extrema, means and pulse pressure | demanding one universal single-peaked morphology |
| HMII H-Q loop | x is signed LVAD flow and y is pump pressure rise with traversal direction | direction, signed area, phase lag, mean/min/max flow and low/reverse/high-domain residence | treating the FDA advertised capacity as a clamp or Stanfield within-beat variation as replicate uncertainty |
| Coronary flow | each series carries artery, layer, compartment edge and station identity | event-defined systolic/diastolic integrals, DSVR and reverse-flow fraction at the same station | comparing total coronary inlet directly with LAD subendocardial `Qm` or clinical Doppler velocity as if they were identical quantities |

Device-off volume references are selected from one declared modality and
cohort, such as [NORRE echo](https://doi.org/10.1093/ehjci/jet284),
[UK Biobank CMR](https://doi.org/10.1186/s12968-017-0327-9), or the
[Healthy Hearts Consortium](https://doi.org/10.1016/j.jcmg.2024.01.009), with
age/sex/body-size handling frozen before comparison. High-fidelity human PV
loops ([Kohli and Kovács](https://doi.org/10.14814/phy2.13160)) and central
aortic pressure morphology ([Murgo et al.](https://doi.org/10.1161/01.CIR.62.1.105))
provide timing/shape context, not a pooled numerical range.

The present broad 2D-echo LV-volume screen is retained rather than replaced.
A companion UK Biobank CMR readout reports each Petersen sex-by-age stratum
separately because full short-axis stack volumetry is topologically closer to
the model cavity than a 2D biplane estimate, but still includes papillary
muscles in the measured cavity and is not bit-identical to conserved blood
volume. The canonical V3 EDVi/ESVi values (`81.85/34.16 mL/m2`) lie inside all
six reported 45--74-year strata; that observation does not create a pooled CMR
gate or override the failed echo screen.

Pulmonary review likewise uses the complete pressure-flow state. V3 has
PASP/PADP/mPAP `37.80/6.52/17.93 mmHg`, pulse pressure `31.28 mmHg`, model-side
PVR `(mPAP-LAmean)/CO = 1.69 WU`, and `SV/pulse pressure = 2.90 mL/mmHg`.
This pattern points more toward the pulsatile-compliance/inertance axis than an
isolated resistive elevation, but it is not parameter identification. Wright's
healthy invasive analysis separates resistance and compliance
([Wright et al. 2016](https://doi.org/10.1113/JP271788)); McQuillan's large
echocardiographic cohort found a lower-risk upper 95% PASP near `37.2 mmHg`
with age/BMI dependence
([McQuillan et al. 2001](https://doi.org/10.1161/hc4801.100076)). Therefore the
existing `35 mmHg` review gate remains visible, but PASP alone must not select
PVR or a retuned pulmonary parameter.

For an x=flow, y=pressure-difference HMII plot, loop direction must include the
dynamic phase lag; inferring a clockwise loop from only the systolic and
diastolic extrema is invalid. Stanfield's tabulated means/within-beat variation
do not by themselves fix traversal direction. In an independent HeartMate-II
mock-loop study at 8 and 11 krpm, May-Newman found counter-clockwise H-Q loops
for LV ejection fractions of 10--28%, with area increasing with ejection
fraction ([May-Newman 2022](https://doi.org/10.1111/aor.14157)). A present
counter-clockwise result is therefore directionally compatible, not a
validation pass: heart rate, speed, ventricular function, pressure station,
compliance and bypass regime still differ. Stanfield's 100 bpm normotensive,
hypertensive and hypotensive amplitudes remain H2 candidates only after those
contracts are matched.

Human left-coronary/LAD flow is expected to be diastolic dominant, with a
stronger effect in the subendocardium. Systolic reversal is permitted but not
required. This is a directional check against
[Kajiya et al.](https://doi.org/10.1093/cvr/27.5.845),
[Chilian and Marcus](https://doi.org/10.1161/01.RES.50.6.775), and the
Seligman/Nijjer measurement context; the internal compartment flow remains a
model state, not a direct Doppler-velocity prediction.

This separation follows the risk-informed credibility framing in the
[FDA computational modeling guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/assessing-credibility-computational-modeling-and-simulation-medical-device-submissions)
and [ASME V&V 40](https://www.asme.org/codes-standards/find-codes-standards/assessing-credibility-of-computational-modeling-through-verification-and-validation-application-to-medical-devices).

## 8. Current decisions and open evidence

- Coronary V3 accepted physical-time autoregulation is adopted as the owner;
  physiological parameterization and release-bound cross-dt protocols remain
  open. The reduced active-rest-to-hyperemia companion reproduces decreasing
  reserve across its structural-resistance axis at 2 ms and 1 ms, but retains
  a failed rest-convergence/target aggregate gate and makes no clinical CMD,
  CFR, FFR or MRR claim.
- Stateful MCS is required for phasic/rhythm release claims; the algebraic
  model remains a validation shadow and a legacy beat-mean lane.
- Exact-event calcium, signed finite-history deterministic sinus/flutter,
  AV recovery/concealment, and a pending effective-event queue are now
  implemented as one generated owner. They remain insufficient for AF or
  other clinical arrhythmia labels without source-specific independent
  evidence and the preregistered stochastic/phenotype layers.
- Autonomic reflexes and multipatch are intentionally deferred. Their absence
  is an applicability limit, not a parameter to compensate elsewhere.
- No integrated release, clinical diagnosis, or treatment recommendation is
  claimed until every release gate in `INTEGRATED-MODEL-0001` is closed.
