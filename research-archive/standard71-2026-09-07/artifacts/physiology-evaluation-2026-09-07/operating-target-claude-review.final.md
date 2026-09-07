Review complete. Verification status first, then the candidate, then policy, then the smallest next step.

## What I could and could not verify

- **Verified from full text today:** SCMR 2025 reference values (PMC12159681, Tables 2, 5, 8, 11) and Carlsson 2012 (PMC3419124: 144 healthy adults, CI 3.2 ± 0.5, SVI 51 ± 7, HR 64 ± 9, ascending-aorta phase contrast, Mosteller BSA, CI falls about 8 mL/min/m² per year).
- **Not verified:** ESC/ERS 2022 Table 11. The OUP and ERS pages returned truncated text or 403. The registry marks this source "metadata-checked" only, so nobody in the repo has passage-verified the RAP, PAP, CI and SVI rows either. The mean PAP >20 mmHg PH definition is confirmed by secondary sources. The Table 11 mPAP and PAWP rows I would quote from memory (8 to 20, 6 to 12) are unverified.
- **Not accessible:** Healthy Hearts Consortium 2024 (JACC CVI, jacc.org and Elsevier 403; website tables are downloads only). Known from abstracts: n = 9,088, mean age 61 ± 13, three segmentation conventions. Do not cite it as gate support until someone reads the tables.
- **From memory, unverified:** ASE 2016 treats invasive LVEDP >16 mmHg as elevated.

## Current candidate (HR70 R1.04, immutable 2026-09-06 report)

The 16 targets pass, but three facts should block admission as a "resting normal baseline" until reviewers decide otherwise.

| Quantity | Candidate | Coherent reference | Reading |
|---|---|---|---|
| Mean PAP | 20.9 | PH definition >20 (ESC/ERS 2022) | Above threshold |
| PAP sys / dia | 30.4 / 14.1 | Table 11 30 / 12; Kovacs UL 29.6 | Admitted only by the widened 35 / 15 gate |
| Event LVEDP (transmural) | 15.5 (HR60: 19.5) | Not gated; mean LA 10.6 is gated | High-normal to elevated, ungated |
| LV EDVi / ESVi / EF | 83.2 / 37.4 / 55.1% | SCMR 2025 men 46–104 / 11–41 / 53–79 | Male-range, ESVi near UL, EF near LL |
| Same vs women | | 46–91 / 11–34 / 55–80 | ESVi fails, EF at LL |
| RV EDVi | 83.1 | SCMR men 83 ± 17; current gate UL 87 (3D echo union) | CMR-central, but 4 mL/m² from the echo bound |
| CI / SVI | 3.21 / 45.9 | Carlsson 3.2 ± 0.5 / 51 ± 7 | Central |

Two coherence observations for the reviewers, offered as hypotheses rather than prescriptions. First, the anatomical prior is a male CMR-center subject: its LV EDV 144.4 mL and RV EDV 155.8 mL at BSA 1.9 give 76 and 82 mL/m², matching SCMR men (75 ± 15, 83 ± 17) rather than women (69, 73). So declaring sex male is not a choice made to pass the candidate. It is already implied by the prior, and the LV ESVi verdict is meaningless without it. Second, the candidate has drifted from that prior toward dilation with lower EF and higher EDP: EDV +9.5%, ESV +33%, EF 63% to 55%, EDP 15.5 mmHg, and a flattened hypervolemic response. The pulmonary decomposition is mPAP 20.9 = mean LA 10.6 + PVR × CO with PVR about 1.7 WU, so the mean PAP excess comes from a high-normal LA pressure plus upper-normal PVR, not from an abnormal pulmonary bed alone.

## Policy design for the 16 targets

Support as written, with honest basis labels:
- **CI 2.5–4.0.** Carlsson (verified) and SCMR LV CO ranges contain it. Label as CMR-flow context; the model's positive-only valve flow is the same observable as phase-contrast aortic flow when there is no regurgitation.
- **SVI 35–65.** Carlsson 37–65 (mean ± 2 SD, my calculation) and SCMR men 30–69 (verified) contain it. Re-declare its basis as CMR, not RHC; the Table 11 33–47 disagreement is a modality and cohort difference. At fixed HR one of CI and SVI is redundant; at HR70 the CI gate is the binding one.
- **PCWP surrogate 4–13, CVP 1–8, AV ET 240–340.** Keep as targets with context-only support (Zeder, Table 11 unverified, Copenhagen). None is verified gate support.
- **Aortic 90–140 / 60–90.** Keep as declared design choices. Stop trying to source them; no central-aortic cohort will match this node.

Revise (needs one reviewer's agreement, then a prospective re-score):
- **LV and RV volumes/EF to a single modality: SCMR 2025 CMR, sex male, age band 30–49.** Proposed bounds: LV 46–104 / 11–41 / 53–79; RV 49–117 / 12–56 / 44–77 (age 40–49 men: 45–114 / 14–55 / 41–72). Rationale is coherence with the prior and with the 0D blood-pool volume, not candidate outcome: the HR70 candidate passes old and new. The HR60 RV EDVi "failure" at 91.7 against the echo-union 87 is an artifact of that union; it is CMR-central. Re-score HR60 prospectively, do not rewrite the 09-06 report. Caveats to record: pooled 1.5T/3T, papillaries in mass, random-effects quantiles, and the 2015 Kawel-Boehm numbers in the registry are superseded by the same author's 2025 update.

Demote:
- **PV ET 220–350** to reference-warning. It has no method-matched source and its bounds are an LVET analogy. Keep the single-complete-episode requirement mandatory.
- **PAP max/min:** do not widen, do not narrow now. Add **mean PAP** as an observed quantity with a reference warning above 20 mmHg. The measurement already exists in the macro-physiology envelope but not in baseline validation measurements.
- Add **event LVEDP** (absolute at MV closure and transmural at maximum volume, both already in the V3 beat metrics) as an observed quantity with a warning, threshold pending verification of the ASE source.

Registry cleanup: the healthy context file declares PA systolic 10–35 and LA mean 2–13, but the policy hard-codes 15–35 and 4–13 and never reads those two context gates. Two declarations of one quantity with different numbers is a provenance defect.

## Smallest next step

1. One diff: add mean PAP and event LVEDP observations plus warnings to the prospective assessment; declare sex male and age band 30–49 in the reference context; relabel the 16 bases as above; demote PV ET. No numeric change to any hard gate in this diff.
2. Send that diff to the external reviewers together with the SCMR-based LV/RV revision as a separate, clearly optional second diff.
3. Treat mean PAP ≤20 and an LVEDP inside the verified reference as admission preconditions for the next candidate. That implies one targeted LA-pressure/PVR-side re-fit, not a grid and not a Ca/Land shape pass.

Approval verdict deferred until the diff exists. Daily fitting stays useful because the coarse hard gates are unchanged, the two new warnings show the direction that matters, and nothing above lets a citation convert a provisional interval into verified normality.