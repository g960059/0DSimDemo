# Independent concrete review: prospective baseline eligibility

Use your own physiological, mathematical and implementation judgment. Be candid; do not defer to the primary agent's preferences. You are Claude Fable 5.1 max through Claude Code. Review only; do not edit files. The project is a pre-release educational cardiovascular 0D simulator, one human plus AI, seeking sound, expressive, robust and not overly complex physiology. Permanent policy changes require at least one of two reviewers to approve; adoption is the primary agent's decision. This is not a request to certify clinical validation.

Please inspect the actual files and tests, sources if needed, and return APPROVE or REQUEST_CHANGES with actionable findings and exact approval scope. Consider whether this is scientifically defensible without becoming an elaborate framework. No model substitution.

Worktree: /Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo

Files under review:
- analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1.ts
- analysis/policies/mainWire/MainWirePreloadReserveAdmissionV1.ts
- analysis/methods/mainWire/MainWireBaselinePressureRateQualityV1.ts (diff: shared primitive observation math, production checkpoint wrapper retained)
- tools/scientific/assessMainWireProspectiveBaselineV1.ts
- __tests__/mainWireProspectiveBaselineAdmissionV1.test.ts
- Supporting unchanged research screen, resting reference profile/comparison, tau observer and existing gate roles/evidence registry.

The old published gate policy and old result statuses are not rewritten. The new policy evaluates scientific eligibility for promotion of an explicitly distinct research construction, not mint or public release. It retains numerical/conservation/ordered-native-event/gradient/unexplained-ringing/rebound checks, verifies tau usability at both grids and raw +/-dPdt two-grid/neighbor support. Its code owns explicit source-informed operating criteria and engineering load guards. Phasic PAP and method-mismatched timing/shape/dPdt references remain visibly strict warnings, not automatic normality assertions. Indexed anatomy requires both sex strata for automatic generic-sex-unspecified baseline eligibility; otherwise demographic review, not a disease verdict. SVI is coupled context, not a second independent CO target. ASE2025 Table1 p539 confirms resting LVEDP >16 (Figure1 p540 shows pressure-upstroke timing). Native MV flow cessation is not presumed clinically identical.

Reserve qualification preserves the fixed-tone reservoir-settled protocol and inherited response floors except the universal1mmHg pressure-amplitude floor. Both grids must pass direction/CO/EDV/transmural floors. Each linear criterion's margin must exceed the coefficient-weighted sum of primitive center/endpoint differences across grids. This is two-grid sensitivity, not a rigorous error bound, clinical reserve normality, or convergence proof. No afterload test.

Candidate files:
- artifacts/physiology-evaluation-2026-09-07/admission-coarse-confirmation-v1/same-material-TBV4935.result.json (fresh2ms,54cycles,72.4s including reserve; no parameter change)
- artifacts/physiology-evaluation-2026-09-07/volume-midpoint-fine-v1/same-material-TBV4935.result.json (independentcold1ms,56cycles,220s including reserve)
- artifacts/physiology-evaluation-2026-09-07/working-baseline-selection.json
- artifacts/physiology-evaluation-2026-09-07/REPORT.md

Why repeat coarse: its old counterpart had no reserve step-protocol marker. Rather than invent backwards-compatibility evidence, one current2ms run was repeated. Same construction identity is required in the new assessor. The new report file will be prospective-admission-candidate-v2.json if available during review.

Please assess both the actual implementation and what evidence would still be needed before production binding. Treat runner-generated artifacts as local scientific evidence, not authenticated arbitrary third-party JSON. Do not request a general serialization framework without a concrete relevant failure.
