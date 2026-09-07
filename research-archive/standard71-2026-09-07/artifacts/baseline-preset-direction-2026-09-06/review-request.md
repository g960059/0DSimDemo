# Independent direction review

Please give your own frank scientific and engineering judgment. Do not defer to the parent agent or user, and do not treat their hypotheses or past conclusions as constraints. You may reject or replace prior plans. Read source and evidence independently before reading the parent's conclusions. This is a read-only review: do not edit files, run fits or publish anything. Use primary literature when helpful, and distinguish sourced facts from your mathematical/physical/physiological deductions. Keep the review bounded enough to support near-term decisions.

Repository: /Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo. Read AGENTS.md and README.md. One human maintainer plus AI, no external users before release. The goal is a physiologically, physically and mathematically defensible, expressive, robust, not excessively complex cardiovascular 0D model for education/research and demo-only individualized fitting, not clinical decision making. CPU is MacBook Pro M5 Max. Avoid creating a separate infrastructure project.

Current user asks:
1. Show the baseline adoption candidate in the actual dev Workbench (parent is implementing this).
2. Independently reconsider remaining problems and future direction, without parent-context restrictions.
3. What case/preset registry would actually demonstrate broad case expressivity? Which cases and contrasts should be prioritized, what must be measured, and what remains outside this model's scope?
4. Require at least one paper, real dataset or other evidence/provenance item for registry gates, including baseline. Is that sufficient or mistaken in any way? Propose the smallest sound rule, including how mathematical/numerical invariants, engineered guards, missing evidence, measurement operators, overlapping definitions and patient-demo data should be handled. Do not invent citations just to make checks pass.

Primary materials (inspect as needed, not a required reading/conclusion list):
- analysis/registry/MainWireFittingReferenceRegistryV1.ts
- data/physiology/main-wire-normal-reference-evidence-v1.json
- analysis/policies/mainWire/MainWireBaselineGateRolesV1.ts and MainWireBaselineCalibrationStagePolicyV1.ts
- engine/myocardium/experiments/MainWireBaselineReferenceResearchV1.ts and current valve/vascular/mechanics source
- artifacts/baseline-candidate-2026-09-06/selected-evidence-final.json, selected-checkpoint-qualification-v2.json, selected-pressure-rate-quality-final.json
- artifacts/baseline-candidate-2026-09-06/selected-fine-v1/vascular-center-R1.04.result.json (large: prefer targeted fields, not whole-file context)
- artifacts/semilunar-load-ablation-2026-09-06/study-summary.json (compact current factorized results)
- Source control and existing tests / other artifacts as useful.

Do not limit yourself to AV/PV, pressure recovery, Zc, or continued fitting. Consider whether any of those are the wrong next priority. Also decide what a candidate preview should and should not claim. Separate immediate useful changes from later work and explicit non-goals. For any proposed permanent gate/model/range-policy change, state support/oppose/conditional support and the reason; the user's review rule is 1 of 2 reviewers, with final adoption judged by the parent. Reply with concrete conclusions and uncertainties, not agreement language.
