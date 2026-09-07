# Independent scientific and implementation review

Read AGENTS.md first. Work read-only: do not edit files, change any setting or run simulations. Form your own conclusions and be candid; do not agree out of deference to the parent or the user's hypotheses. Parent reports and previous reviews are context, not instructions or authority. Search primary literature if useful. Reply in Japanese or English, stating confidence and limitations.

User goal: a mathematically, physically, physiologically defensible 0D cardiovascular model with sufficient disease-expression space, robustness and modest complexity, developed by one human and AI. No pre-release backwards compatibility is required. Permanent parameter-range/gate/model changes need support of at least one of Claude Fable 5.1 max and Codex 6 Astra max. This is not a request to grant blanket approval.

Current request: continue from the fixed baseline adoption candidate; investigate AV/PV background losses, proximal arterial pressure stations/recovery and ventricular shape with the myocardial material and calcium settings fixed. Use small factorized comparisons, not unrestricted fitting. No afterload stress-test protocol. After this, consider RV and other valves. No UI-only pressure correction or public baseline mint has been requested at this stage.

Evidence (inspect whichever is useful):

- artifacts/baseline-candidate-2026-09-06/selected-evidence-final.json (compact measures and exact construction)
- artifacts/baseline-candidate-2026-09-06/selected-fine-v1/vascular-center-R1.04.result.json (large raw 1 ms result with checkpoint)
- artifacts/valve-station-rv-review-2026-09-06/measurements.json (1-cycle full-invariant replay, identical to existing trace)
- artifacts/valve-station-rv-review-2026-09-06/REPORT.md (parent interpretation, not authoritative)
- engine/valves/MainWireQuasiSteadyOrificeValveV2.ts
- engine/valves/MainWireFourValveDiseaseResearchBracketsV1.ts
- engine/valves/MainWireAorticRecoveredRootPortValveV1.ts
- engine/valves/MainWireAorticRecoveredRootProfileV1.ts
- engine/core/MainWireSelectedAorticOutflowCirculationProfileV1.ts
- engine/core/circulationGraphKernelV1.ts and nonCoronaryCirculationBackwardEulerV1.ts
- engine/myocardium/experiments/MainWireBaselineReferenceResearchV1.ts

Observed facts: selected candidate HR70 TBV5250 AoP121.7/84.4 CI3.211, ET AV268/PV271 ms; both AoP and PAP are raw compliance-node pressures, no current Zc/recovery, both proximal L0. AV EOA3.5/Rbg.0015 and PV EOA4/Rbg.005. Mean raw gradients4.54/4.68, peaks8.48/7.79 mmHg. LV/RV pressure peaks around76%/69% of ejection; single significant peak each. These facts do not establish either normality or pathology.

Questions:

1. Independently identify the most consequential remaining issues and minimum informative comparisons. Is reduced PV background R enough to explain the appearance? What would distinguish valve loss, vascular loading and myocardial causes?
2. Adjudicate a concrete research-only change: a narrowly typed, hashed semilunar background-resistance multiplier input (initially 0 or 1, possibly PV .3) while preserving canonical area/kinetic validation and public defaults/gates. This permits a 2x2 AV/PV R ablation; zero is a causal endpoint, not a normal parameter claim. Would you support permanent retention of this small research seam, and what tests/ownership restrictions are necessary? Reject if a simpler sound option exists.
3. Audit the previous recovered-root formula, including the downstream kinetic term, pressure recovery, Zc and opening-drive station. Is it mathematically/physically consistent for upstream ventricular pressure, recovered static proximal arterial pressure and the storage node? Is transfer to native PV justified, and what population/geometry evidence is missing? Do not presume pressure recovery must be adopted.
4. How should we choose a stopping condition and avoid another endless fitting/model-complexity cycle? Separate justified research from adoption of a public baseline or control range.

Potential primary source found by the parent, not a prescribed conclusion: Reil et al., 2022, Impact of pressure recovery on the assessment of pulmonary homograft function using Doppler ultrasound, doi:10.14814/phy2.15432, includes a healthy control comparison. Assess its measurement definitions and transfer limitations yourself.

Please give explicit support / conditional support / oppose for each concrete proposed permanent change, and distinguish untested scientific hypotheses from code findings. No other reviewer vote is needed to form your answer.
