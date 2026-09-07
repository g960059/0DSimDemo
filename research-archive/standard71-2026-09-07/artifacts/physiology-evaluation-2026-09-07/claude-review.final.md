Review complete. Verdict first, then prioritized findings, then the tau recommendation, then approve/reject conditions, then sources and uncertainties.

**Overall verdict.** The evaluation-roles v2 policy is approvable as a construction gate with three conditions. None of the blocking physiological corridors is a population-normal interval. All of them are envelopes, and the registry already says so honestly. The tau addition is approvable as a prospective analysis method under the conditions below, and it also closes a real numerical blind spot. I did not run anything, and I reviewed the working tree, which has uncommitted edits to the registry and policy files.

## Prioritized findings

**1. The single-peak guard has a blind spot after semilunar closure.** The LVP and RVP guards inspect only the thresholded forward-flow episode, so any re-rise or ringing during isovolumic relaxation or diastole is unguarded. The shape diagnostic rebound metric has the same window. Only the PAP guard covers the full cycle. The historical Standard70 re-rise near aortic closure would sit exactly in this gap once flow drops under one percent of peak. A tau fit with a monotone-decay check is the cheapest way to close it. Files: `engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1.ts:737` and `analysis/methods/mainWire/MainWireEjectionShapeDiagnosticsV1.ts:60`.

**2. The candidate's mean pulmonary pressure meets the guideline definition of pulmonary hypertension.** The PAP corridor upper bounds of 35 and 15 mmHg admit values the cited 2022 ESC/ERS source calls abnormal. The candidate's mean PAP is above the 20 mmHg definition threshold, with wedge surrogate under 15 and pulmonary vascular resistance under 2 Wood units. This is the "unclassified" PH category, not a normal resting adult. Do not widen or narrow anything. Add mean PAP as a reported value with a reference-warning at the guideline threshold in the next registry revision.

| Candidate, 1 ms | Value | Guideline context |
|---|---|---|
| mean PAP, mmHg | 20.9 | PH defined as > 20 |
| mean LA, mmHg | 10.6 | healthy PAWP upper limit 13 |
| LV EDP transmural, mmHg | 15.5 | upper normal about 12 to 15 |
| PVR, Wood units | about 1.7 | pre-capillary PH needs > 2 |

**3. The LV negative dP/dt reference corridor warns about the wrong thing.** The frozen corridor of minus 1400 to minus 700 excludes the resting control means of both cited micromanometer series. A signed value of minus 1676 is inside the published normal spread and outside the corridor. Since the role is warning, nothing blocks, but the warning is misleading. Keep the number frozen under v2. If a v3 policy is minted for tau, re-derive this corridor from the two method-matched series and record the decision timing as post-hoc, exactly as the preload floors already do. The positive dP/dt corridor is defensible: its upper bound matches mean plus two standard deviations of both series, and the candidate's 2766 is genuinely high for a resting normal.

**4. Which blocking corridors are defensible and as what.** Table below covers the 28 objective checks plus the 13 right-heart sentinels by group.

| Group | Role today | Verdict |
|---|---|---|
| settlement.period1 | numerical | Defensible, mandatory |
| LVP/RVP single-peak-no-ringing | guard | Defensible only for this model form, which has no reflection mechanism. Re-derive when propagation is added. Window too narrow, see finding 1 |
| rounded-not-plateau | warning | Correctly demoted. Corridor numbers have no source |
| AoV mean/peak gradient | guard | Defensible non-stenotic guard. Candidate peak 8.5 mmHg is consistent with a 3.5 cm² orifice |
| aortic ET 240 to 340 ms | target | Broad envelope from color TDI at HR 63. Contextual, acceptable as envelope |
| LV ICT 20 to 70 ms | target | Weakest corridor. Upper bound is wider than the cited source's 59 ms, and the candidate sits at 65 to 67 ms. Record as known deviation, do not widen further |
| LV IRT 59 to 134 ms, Tei 0.29 to 0.65 | target | Envelope from TDI. Tei is algebraically dependent on ICT, IRT, ET and adds no independent constraint |
| mitral E/A 0.8 to 2.0 | target | Defensible only as a "not reversed" sentinel. Volume-flow ratio is not Doppler velocity. Candidate 0.92 is low-normal for a young subject |
| Ao max/min, CVP mean | target | Broad resting envelope. Defensible as construction. Note the published launch baseline sits at the 90 mmHg systolic floor and the 2.5 CI floor |
| PAP max/min | target | Envelope, deliberately wider than guideline. See finding 2 |
| PCWP surrogate 4 to 13 | target | Upper bound sourced. Lower bound unsourced. Envelope |
| LV EDVi, ESVi, EF | target | Cross-modality union. Candidate is CMR-sized with echo-level EF. Not a joint normal |
| RV EDVi, ESVi, EF | target | 3D-echo sex union. HR 60 variant exceeds it. Envelope |
| CI 2.5 to 4.0 | target | Guideline exact. Defensible |
| SVI 35 to 65 | target | Engineering synthesis. Not independent of CI at fixed HR |
| PV gradient, PV ET, TV E/A, right timing, PAP morphology | sentinel | Construction sentinels without matched sources. Keep as sentinels, never promote by analogy to LV |
| RV ±dP/dt | warning | Unsupported corridors. Warning role is correct |

**5. The candidate's physiology reads as mildly volume-loaded, not centrally normal.** LV EDP 15.5 mmHg, EDVi 83 with EF 55 percent, mean LA 10.6, mean PAP 20.9, ICT 67 ms, and a flat hypervolemic response with LV EDP rising to 23 mmHg all point the same way. The preload-reserve floors are non-regression margins and do not test Starling shape. Approving the candidate as a stable in-model reference remains reasonable. Calling it a normal adult is not supported by these values, and the artifacts already avoid that claim. Keep it that way in the Surface presentation.

**6. Two low-priority implementation inconsistencies.** The trace-based size measurement uses volume extrema while the exact release path uses valve-closure landmarks, and the registry text describes only the latter. The values coincide for the candidate, but the definitions should not diverge inside one method file. Also, when both components of the rounded-not-plateau compound fail, the reported actual hides the peak-phase failure.

## Minimal tau definition

**Definition.** Fit one family only: monoexponential with free asymptote. Use the linear regression of accepted-step dP/dt against pressure over the window. Slope is minus one over tau, intercept over slope gives the asymptote. This is the Raff and Glantz derivative form. It is closed-form, deterministic, reuses the same backward-difference derivative the dP/dt checks already use, and needs no iteration. Do not use the legacy fixed-asymptote index-based semilog fit in the five-wall diagnostics file. That fit anchors the asymptote at minimum minus one mmHg, uses sample index rather than accepted time, and uses transmural pressure.

**Signal.** Intracavitary LV pressure from the terminal trace, same basis as the dP/dt extrema. Catheter references are intracavitary. At rest with zero thoracic pressure this equals transmural, but at high volume the pericardial term differs.

**Window.** Start at the accepted step of minimum dP/dt. End at the mitral zero-flow opening time from the V2 observation. Require the start to lie at or after the exact aortic closure time. If it does not, report unavailable with reason "peak-negative-dpdt-before-closure". Require a single isovolumic phase with no inlet forward flow, which the V2 observation already enforces.

**Fit-quality reporting.** Report tau, asymptote in mmHg, R², RMSE in mmHg, sample count, window duration, and a monotone flag that is false if any step in the window has non-negative dP/dt. Add a two-grid relative difference between 2 ms and 1 ms, mirroring the pressure-rate screen. Report tau against IRT as a consistency line: for a pure exponential, IRT equals tau times the log of the pressure ratio across the window.

**Roles.** The monotone flag and availability are construction guards and may block. The tau value is a reference-warning at most. Do not make the value blocking. RV tau is report-only with no corridor.

**Applicability.** Left ventricle at HR 60 or 70 with a complete isovolumic relaxation, at least 20 accepted samples in the window, and no regurgitant or shunt flow. With mitral regurgitation there is no true isovolumic phase, so the method reports unavailable rather than a number.

**Evidence interpretation.** Bind one human series matched to the free-asymptote family. Yamakado 1997 reports both asymptote and no-asymptote constants in 55 normal subjects aged 20 to 77 and found no age relation, but I could not read the numeric values. Verify them in full text before binding. Hirota 1980 reports 33 plus or minus 8 ms in 18 controls, with age correlation, but the fit family is not stated in the abstract. The guideline cutoff of 48 ms is a clinical, method-agnostic threshold for impaired relaxation. Do not use it as the corridor for a free-asymptote fit. If no matched series is verified, record tau descriptively with no corridor. A rough exponential estimate from the candidate's 96 ms IRT lands near 50 ms, so the value will likely sit at or above the clinical cutoff. Measure before interpreting.

**Preserving frozen reports.** Mint a v3 evaluation-policy id and a new registry revision. Make check coverage policy-scoped so v1 and v2 reports validate without a tau check. Put tau in a new analysis partition, not the objective partition, so the conditioning-study identity and the 28-check numerical floor audit do not churn. Tau derives from the persisted checkpoint by exact replay, so no exact frame field, no exact dynamics change, and no re-mint are needed. The launch baseline's tau can be attached as a separate assessment artifact.

## Approve and reject conditions

**Approve the roles v2 policy if:** no blocking numbers change; the negative dP/dt corridor is labelled as excluding published normal means; mean PAP is added as a reference-warning at the guideline threshold; and the post-closure ventricular window gains a guard, either via tau monotonicity or by extending the ringing guard to the full cycle as PAP already does.

**Approve the tau addition if:** intracavitary pressure, accepted-time abscissa, single pinned free-asymptote family, window and unavailability rules as above, full fit-quality fields, two-grid check, value role limited to warning, evidence bound only to a verified method-matched human series, v3 policy with scoped coverage, and no exact-model change.

**Reject the tau addition if:** it uses transmural pressure, sample index, an arbitrary fixed asymptote, mixed Weiss, Glantz, and logistic thresholds in one corridor, a blocking role on the value, or any exact-frame field.

**Uncertainties.** Full texts of Hirota 1980, Yamakado 1997, and the Circulation Heart Failure tau editorial returned 403, so fit families and numeric ranges there are unverified. I did not verify whether the persisted launch report includes the terminal trace. I did not rerun any candidate.

Sources:
- [Hirota 1980, A clinical study of left ventricular relaxation](https://pubmed.ncbi.nlm.nih.gov/7190882/)
- [Yamakado 1997, Effects of aging on LV relaxation in humans](https://www.ahajournals.org/doi/10.1161/01.CIR.95.4.917)
- [Weiss 1976, Hemodynamic determinants of LV pressure fall, canine](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=%22Hemodynamic%20determinants%20of%20the%20time-course%20of%20fall%20in%20canine%20left%20ventricular%20pressure%22&format=json&resultType=core)
- [Matsubara 1995, Logistic time constant of isovolumic relaxation](https://pubmed.ncbi.nlm.nih.gov/7554217/)
- [Langer 2005, Tau requires consideration of the pressure asymptote](https://www.researchgate.net/publication/8000891_Estimation_of_the_left_ventricular_relaxation_time_constant_Tau_requires_consideration_of_the_pressure_asymptote)
- [Circulation Heart Failure editorial, The time constant of LV relaxation](https://www.ahajournals.org/doi/10.1161/CIRCHEARTFAILURE.110.941773)
- [Grading diastolic function, hemodynamic validation of guidelines, tau > 48 ms](https://link.springer.com/article/10.1186/s12947-015-0023-6)
- [Are we on the right way to calculate tau, JASE 2009](https://www.onlinejase.com/article/S0894-7317(09)00488-X/fulltext)
- [Humbert 2022 ESC/ERS pulmonary hypertension guideline](https://publications.ersnet.org/lookup/pmid/36028254)