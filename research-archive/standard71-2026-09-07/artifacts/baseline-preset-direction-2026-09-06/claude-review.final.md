Review complete. Below is my independent judgment; I read the registry, gate code, valve and vascular source, the candidate artifacts, and the ablation summary before the parent's reports.

## Verdicts on the candidate and the preview

**The candidate is a sound internal reference point, not a normal human, and it should not be minted yet.** The numerics are clean: two independent cold settles agree, conservation error is at machine level, the checkpoint round-trips, and every blocking rest gate passes. Two structural problems remain that would be baked into every case if the model ID is minted now.

**Late pressure peak.** Both LV and aortic-node pressure peak late in ejection.

| Signal | Peak position in ejection | Physiological expectation |
|---|---:|---|
| LVP, 1 ms | 0.76 | roughly 0.3 to 0.5 |
| Ao node, 1 ms | 0.83 | early peak in young adults, late peak only with strong reflection |

My reading of the physics differs from both earlier reviewers. With aortic inertance removed and no characteristic impedance, the aortic node is a pure windkessel. Its pressure peaks exactly when inflow falls to the runoff flow, so peak timing is set by the flow waveform shape, not by compliance. That is why the parent's compliance ablation moved the RV peak almost nowhere. That insensitivity is expected windkessel behaviour and does not prove the myocardium is innocent. Two things can move the peak earlier: a series impedance term proportional to flow, or a faster force rise. The recovered-root profile already in the repo carries a characteristic impedance that matches the invasive normal value from Murgo and colleagues.

| Quantity | Value |
|---|---:|
| Murgo 1980 aortic Zc | 47 ± 4 dyn·s·cm⁻⁵, about 0.035 mmHg·s/mL |
| Repo recovered-root Zc | 0.035 mmHg·s/mL |
| Candidate peak AoV flow | about 485 mL/s |
| Implied early forward-wave pressure Zc·Q | about 17 mmHg |

That forward-wave component is roughly half the current pulse pressure and arrives at peak flow, so it will pull the root peak earlier. The published Standard70 got a similar early component from inertance, which is why its LVP peaked near 0.38. Inertance in series with a compliance node resonates near 5 Hz, so removing it was reasonable; a resistive Zc does not resonate. I support the AV recovery-only arm the parent planned, but the discriminating arm is Zc, and it should be run with compliance scale 1.0 and 0.8 as well, because the 0.65 scale is partly compensating for the missing forward wave. This is a model-form change of zero state variables, not fitting, and it should be bounded to about four runs.

**Diastole runs hot.** Transmural LVEDP is 15.5 mmHg at an EDV index of 83, with A-wave-dominant filling. The chamber stiffness at that operating point matches the normal Klotz curve slope at EDP 15, so the passive law is not wrong; the model simply operates too high on it. That is what flattens the high-volume Starling limb and produces the borderline mean PAP. My arithmetic: mean PAP equals LA mean plus PVR times CO, and PVR here is a normal 1.7 Wood units, so the pulmonary side is a downstream symptom, not a separate priority. The likely cause is the calcium time shape. With rise and decay constants nearly equal, the transient is of the form t·exp(−t/τ), starts with near-zero slope, and peaks around 125 ms after activation. That explains long ICT with high peak dP/dt, the late force peak, and residual active stress persisting into filling. Human intact myocyte transients peak in tens of milliseconds; that figure is my recollection and should be verified against the Land 2017 intact-twitch data before it is used as a target.

**HR anchor inconsistency.** The stage policy identifies the operating point at HR 60, but the candidate is HR 70 and fails one RV volume gate at HR 60. Either the policy anchor moves to HR 70 with HR 60 as a rate-safety condition, or the HR 60 deviation is recorded explicitly. Leaving the policy and the candidate in disagreement is the one thing that should not persist.

**What the dev preview should claim.** Show raw accepted-step waveforms, the gate table with roles, the known-deviation list, the construction identity hash, and the evidence paths. Label pressures as node pressures, gradients as node differences, E/A as volume-flow ratio, and the wedge value as LA mean. Do not show a healthy badge, and do not describe warnings as defects or as passes. The preview must launch the research construction as its own ephemeral entry rather than patching the Standard70 fixture, because the public control catalog cannot express the 0.65 compliance scale, the absolute Tref, the affinity pair, or the calcium rise fraction. Arterial stiffness cannot represent 1.42 over 0.65 within its published maximum of 1.5, and the research scale acts only on systemic nodes. If knobs are enabled in the preview, label them research composites. No Snapshot or Article may pin the preview, which matches the existing model-lab contract.

## Remaining problems and direction

**Immediate, before mint, in this order.**
1. Record the HR anchor decision in the stage policy.
2. Run the Zc arm with compliance scale 1.0 and 0.8, recovery off, background R unchanged, then the AV recovery-only arm. Decide the vascular owner for mint from those results.
3. One bounded calcium-shape batch targeting EDP near 10 and E/A above 1, using only the existing rise-fraction and floor inputs, with the whole rest gate set as the acceptance criterion. If it fails, record the deviation and stop.
4. Add the known-deviation record to the registry: late peak, ICT above the human interval, EDP, mean PAP, high peak dP/dt.

**Later work.** Source-kinetics transfer of the Land family, native PV pressure recovery, and rhythm and support admission. Pressure recovery at the pulmonary valve is a wrong near-term priority: the gradients are inside the guards and the recoverable static pressure is one to two mmHg.

**Explicit non-goals.** Continued parameter fitting, valve background R set to zero as a default, display-only Zc correction, gate widening to admit a candidate, and any claim of unique identification of human material constants.

One measurement note: the VC node sits about 4 mmHg above RA because the entire venous-return resistance lives on one edge. That is acceptable for Guyton curves, but any displayed CVP must be RA pressure. Pulmonary venous mean is 3 mmHg above LA mean, so a wedge surrogate defined on the pulmonary venous node would read at the top of the healthy range rather than mid-range.

## Case registry and the evidence rule

**Cases that would demonstrate expressivity.** All of the following are Surface-exposed today. Each should be a single-knob or two-knob contrast against the baseline with a preregistered directional signature and one numerical acceptance record.

| Case | Knobs | Signature to measure | Scope limit to state |
|---|---|---|---|
| Hypovolemia and volume loading | TBV ±12%, ±20% | CO, CVP, LA mean, pulse pressure, Starling slope both sides | no baroreflex, so no compensatory HR or SVR |
| Systolic failure, compensated and not | common active tension 0.6 and 0.4, with and without TBV up | EF, ESV, LA mean, PV loop shift | no remodeling |
| Aortic stenosis | AoV EOA 1.0 cm² | mean and peak node gradient, LV peak pressure, ejection time | node gradient is not Doppler or recovered catheter gradient |
| Mitral and aortic regurgitation | EROA 0.4 and 0.3 cm² | regurgitant fraction, LA v-wave, loop without isovolumic phases | acute lesion only |
| Diastolic stiffness | LV wall passive ×2 | EDP, E/A, CO preload sensitivity | contrast is blurred while the baseline itself runs at EDP 15 |
| Pulmonary hypertension with RV failure | PVR ×2.5, RVFW active 0.5 | PAP, RVEDV, LVEDV fall, septal interaction | the five-wall septum is a distinctive capability worth showing |
| Tamponade | pericardial fluid 300 to 600 mL | CVP up, CO down, equalized diastolic pressures | no respiratory variation |
| PEEP | 10 and 15 cmH₂O | venous return and CO fall | no lung mechanics |
| Rate | HR 40, 70, 100 | force-frequency, filling time, E and A merging | fixed AV delay |
| Coronary focal loss | LAD 70 to 90% | coronary flow and reserve | no ischemia feedback into mechanics |

Priority contrasts are baseline versus aortic stenosis, mitral regurgitation, systolic failure, hypovolemia, and pulmonary hypertension with RV failure. Those five produce qualitatively different loops and waveforms from single knobs. Diastolic stiffness should follow only after the baseline diastole is corrected.

Every case must record settlement, conservation residual, solver iteration and backtrack statistics, the preregistered sign checks, and the single-peak guards. The guards need to be case-aware: a late aortic peak in aortic stenosis is real physiology, not ringing. Outside scope for all cases: autonomic reflexes, remodeling, respiration, exercise, pharmacology beyond knob mappings, spatial dyssynchrony, and any patient-specific prediction.

**The evidence rule.** Requiring at least one paper or dataset for every gate is mistaken as literally stated, because two gate classes have no population evidence by nature and forcing citations there invites fabricated support. The registry already has the right vocabulary in its threshold basis and evaluation role fields. The smallest sound rule is a closed basis class per gate, each with its own provenance requirement, enforced by the existing compile-time lint:

- **Numerical invariant.** Settlement, conservation, checkpoint round-trip. Provenance is the code contract plus a test. No citation, and the class may never be described as physiological.
- **Engineered guard.** Peak counts, rebound, gradient caps. Provenance is the recorded failure it guards against, an artifact path and commit, plus the statement that no population claim follows. No citation required, and the role stays construction-guard.
- **Physiological corridor, target or warning.** Requires at least one verified source with a source comparison that names population, method, and range, plus a written operator-mismatch statement. A numeric range used to set or justify a bound must be full-text-locator-checked. Metadata-checked sources may appear only as unverified context.
- **Missing evidence.** The gate may exist only as guard or warning, never as physiological target. Under that rule exactly one current group changes: pulmonary ejection time drops to guard until a source exists.
- **Overlapping definitions.** Tei, EF, CI and SVI at fixed HR declare their components and inherit their evidence. They may not be counted as independent passes.
- **Measurement operators.** Each check binds its observation method ID, station, and pressure basis, which the registry already does. A source with a different operator class is admissible only with the mismatch written.
- **Patient-demo data.** Never registry evidence. Only synthetic or published open data enters Git, with license and subject-disjoint lineage.
- **Baseline.** A baseline is a construction, not a gate. Its provenance is the candidate identity, evidence paths, commit, and known-deviation record. No paper supports a specific 0D parameter vector, and the registry should not pretend otherwise.

A concrete weakness to fix under that rule: most source comparisons quote table numbers while their source entry says metadata-checked only. Either those numbers were read from full text and the verification field is stale, or they came from memory and are not yet load-bearing.

**Positions on permanent changes.**

| Proposal | Position | Reason |
|---|---|---|
| Mint the candidate as public launch baseline now | Oppose | vascular owner unresolved, diastole hot, HR anchor inconsistent |
| Dev-only ephemeral preview with the claims above | Support | reversible, no durable content |
| Zc arm before any mint decision | Support | zero-state model-form test, physically motivated, bounded cost |
| Research affinity, rise fraction, Ca peak, Tref intervention ceiling | Support | already isolated from baseline-fit roles |
| Widen the +dP/dt or ICT corridors | Oppose | candidate is genuinely high against the cited controls |
| Re-derive the −dP/dt warning corridor from the cited observed range | Conditional support | evidence-driven, must stay a warning, must cite the verbatim range |
| Evidence rule as literally stated | Oppose | replace with the basis-class rule above |
| Basis-class rule with lint | Support | one demotion, no invented citations |
| Widen RVEDVI or PA diastolic gates for HR 60 or C×1.5 | Oppose | record as deviations instead |
| Display-only Zc correction, valve R zero default | Oppose | agrees with prior adjudication |

**Uncertainties.** I ran nothing. The forward-wave estimate assumes the root pressure adds Zc times valve flow to the node pressure; the LV peak will move with it because the valve loss also peaks with flow, but I expect the LV peak near 0.45 to 0.55 rather than 0.35, since the slow calcium rise remains. The calcium time-to-peak figure is computed from the stored constants; the human comparison value is from memory and needs a checked source before it becomes a target.

Sources:
- [Murgo et al. 1980, UTHSCSA record](https://scholars.uthscsa.edu/en/publications/aortic-input-impedance-in-normal-man-relationship-to-pressure-wav)
- [Murgo et al. 1980, PubMed](https://pubmed.ncbi.nlm.nih.gov/7379273/)
- [Aortic input impedance increases with age, Hypertension](https://www.ahajournals.org/doi/10.1161/01.hyp.0000164579.73656.c4)
- [Ventricular ejection overview, ScienceDirect](https://www.sciencedirect.com/topics/biochemistry-genetics-and-molecular-biology/heart-ventricle-ejection)