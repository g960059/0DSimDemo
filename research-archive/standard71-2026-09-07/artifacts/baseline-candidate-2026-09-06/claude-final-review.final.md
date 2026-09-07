**Verdicts**

Candidate designation, `final-response-v1/vascular-center-R1.04`: **conditional approve** as the internal baseline-adoption candidate. It is the first construction in this lineage that passes every blocking rest check and both preload directions at once, and its Tref ±20% response is a genuine contractility axis rather than a relabel. It is not central normal physiology, and the biggest remaining shape defect is vascular, not myocardial.

Research implementation: **approve** the permanent research inputs and domains as implemented, with two minor asks below. Scope: research and intervention role only. The code already enforces that none of these inputs are baseline-fit coordinates, and the claims record no normality.

**Candidate assessment**

Numbers I verified from the result files. The 1 ms column is the closest re-settled construction at R1.10 in fine-v1, since the R1.04 1 ms run is still pending.

| Quantity | Published Standard70 | Candidate R1.04, 2 ms | Same myocardium, R1.10, 1 ms | Human context |
|---|---:|---:|---:|---|
| Ao sys/dia, mmHg | 99/75 | 122/84 | 126/88 | ~120/80 central |
| CI, L/min/m² | 2.73 | 3.21 | 3.19 | 3.2 ± 0.5 CMR |
| LVEF | 0.53 | 0.55 | 0.54 | 0.55–0.72 echo |
| LVEDV, mL | 141 | 158 | 160 | EDVi 83 sits above echo, inside CMR |
| ET, ms | 244 | 270 | 269 | 248–336 at HR 63; ~295 Weissler |
| ICT, ms | 63 | 65 | 64 | 20–59 |
| IRT, ms | 88 | 96 | 99 | 59–134 |
| Tei | 0.62 | 0.60 | 0.61 | 0.29–0.65 |
| E/A, volume flow | 0.82 | 0.93 | 0.93 | 0.88–2.73 age 20–39 |
| LA mean, mmHg | 9.7 | 10.6 | 10.8 | PAWP 9.4 ± 1.8 |
| PAP sys/dia, mean | n/a | 30/14, 21 | | 21 ± 4 / 9 ± 3, mPAP 14 ± 3 |
| LV +dP/dt, mmHg/s | 2587 | 2724 | 2803 | 1700 ± 400 |
| LV −dP/dt, mmHg/s | −1306 | −1657 | −1716 | −1860 ± 350 |
| LVP peak, fraction of ejection | 0.375 | 0.76 | | ~0.3–0.45 |
| AoP peak, fraction of ejection | | 0.83 | | ~0.35 young, ~0.65 augmented |

Shape. The 2 ms to 1 ms drift is small, so numerics are not the issue. The LV and aortic pressure peaks now fall at 76% and 83% of ejection, versus 37% in the published model. This is not the myocardium. With the aortic inertance removed and no characteristic impedance, the aortic node is a two-element windkessel, and its pressure can only peak when inflow falls to the runoff level near 100 mL/s. Peak aortic flow is 485 mL/s against a 322 mL/s mean, so that crossing happens late by construction. The repo already contains a recovered-root aortic profile with a 0.035 mmHg·s/mL characteristic impedance and a 0.0008 inertance, which the published model also does not use. The research kernel forbids combining that profile with the compliance scale at `engine/core/circulationGraphKernelV1.ts:106`. My main alternative is one bounded batch: candidate myocardium, that profile, compliance scale 1.0 and 0.8, no inertance override. I expect an earlier pressure peak, pulse pressure near 35–40 mmHg without the 0.65 scale, and lower node gradients through pressure recovery. If it settles and passes, it should replace the pair of L=0 and compliance 0.65, which is currently a compensation for missing impedance.

Timing and relaxation. IRT, Tei and ET are inside the frozen corridors and inside the Copenhagen prediction intervals, but each sits on the short-ejection, long-isovolumic side of center. ICT is the one hydraulic interval outside the human interval. Long ICT together with high +dP/dt is the signature of a calcium transient with a zero initial slope: the alpha waveform closes the mitral valve early at low pressure and reaches its maximum rate only near aortic opening. Rise fraction 0.9 cannot change that. −dP/dt now matches the invasive controls, and the registry itself records that the −1400 corridor excludes those controls, so treat that warning as a gate defect, not a model defect.

Diastole. I counted active-stress samples across the material readbacks. Roughly half of all wall samples lie between 0.3 and 3 kPa, and the recorded diastole is about half the cycle. So residual active fiber stress of 1–3 kPa persists through much of filling, comparable to the passive stress at those pressures. My reading is that the slow calcium tail acting on troponin whose relative length sensitivity is still about twice the measured value drives the upper-edge diastolic picture: LVEDP transmural 15.5 mmHg, LA a-wave 16 mmHg, E/A 0.93, chamber compliance 1.8 mL/mmHg on the high-volume side. That is an interpretation from this model's traces, not a validated attribution.

Preload reserve and intervention response. Hypervolemic CO rises 6.9% versus 4.3% published, with a smaller LA rise of 6.8 versus 8.7 mmHg and EDV response 1.8 versus 0.76 mL/mmHg. That is a real improvement in the filling side. The ±20% Tref runs gave EF 0.50, 0.55, 0.58 with ESV 84, 71, 65 mL and monotone dP/dt, all single-peaked. The −20% endpoint crosses the EF and ESVi corridors, so the normal band below the candidate is narrow. That is acceptable for disease expression but means no "mildly weaker normal" preset exists without a corridor failure.

Measurement caveats the maintainer asked for. Every timing here is a valve-event interval, not tissue Doppler. The gradients are node differences, roughly Doppler-equivalent at 4.5 mean and 8.4 peak, and the 10 mmHg peak corridor with a 3.5 cm² orifice caps peak flow near 490 mL/s, which biases toward a flat ejection contour. E/A is a volume-flow ratio. LA mean is not a wedge. None of the corridors are validated normal intervals; the registry says so, and I concur.

Source-transfer and velocity batches. I do not read them as a dismissal. With source rates, Aeff 25 and no bridge exit, strong bridges cycle fast and the calcium tail is long, so tension tracks calcium and IRT lands at 160–180 ms while shortening collapses force early and ET falls to 180–250 ms. The velocity batch shows the two levers separately: phi 0.4 restores ET to 280 and mean gradient to 4.3 but leaves IRT at 180, and adding the 60/s exit yields ET 282, ICT 53, IRT 98, Tei 0.54, E/A 1.09, EF 0.53 at Tref 160 kPa. That single point fails only the peak-gradient guards and ESVi and has a sharp 3900 mmHg/s upstroke. It is the strongest evidence that a source-kinetics lineage can meet timing at a lower Tref. It deserves one more bounded batch under the candidate's vascular settings, but it is not a reason to hold the current candidate.

Tref 239 kPa. Orientation and viability fractions are both 1, so this is a true fiber-level doubling of the source whole-organ value inside this geometry. It is a coordinate of this construction, not a measured tension, and I no longer treat it as blocking. The 320 kPa ceiling is correctly intervention-only in code and tests.

**Research implementation, remaining uncertainty, and what must happen before public adoption**

Research inputs. Joint affinity calibration bounded at CaT50Ref 0.5–1.2 and beta1 in [−2.4, 0] with a positive capped CaT50 guard, rise fraction 0.3–1 with decay never shorter than rise, Ca peak 0.4–1.2 µM, and the intervention-only Tref ceiling are all sound and single-owned. The test file already covers exact next-cycle restoration, wrong-construction rejection, duplicate-owner rejection and baseline-role rejection. Two asks: allow Ca peak up to 1.5 µM if the source-transfer lineage continues, since intact human estimates reach there, and add a test that a research checkpoint restored under a different affinity pair is refused, matching the existing Tref and rise-fraction cases.

Conditions on the candidate designation, in order:

1. The pending 1 ms cold re-settle of the exact R1.04 construction passes all blocking checks with drift no larger than fine-v1 showed, and the ±20% headroom batch stays monotone and single-peaked.
2. An HR 60 settle of the same construction is reported. HR 60 is in the declared fit set and the calcium law depends on HR, so this is not a new gate.
3. The characteristic-impedance batch above is run and a decision recorded, before any mint, on L=0 plus compliance 0.65 versus the recovered-root profile.
4. The mint plan folds the research inputs into one fixed material and calcium profile with single owners. If compliance 0.65 survives, it must merge into `arterialStiffness`, whose current 1.5 maximum cannot express 1.42/0.65.
5. The evidence registry records, as known deviations and not gates, the late pressure peak, ICT above the human interval, and ET and Tei off center.

What stays uncertain after that: whether the diastolic residual activation is acceptable for the normal preset, whether a faster calcium upstroke is needed to fix ICT, and whether the RV and pulmonary side at mPAP 21 and PA diastolic 14 should be re-centered. None of these justify new state variables or smoothing. The model should not be described as independently validated human physiology at any stage of this adoption.