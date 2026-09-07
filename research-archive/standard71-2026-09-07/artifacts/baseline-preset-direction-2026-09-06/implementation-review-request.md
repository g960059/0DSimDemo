Please independently review a bounded permanent implementation for the user's 1-of-2 review gate. Be frank and disagree when warranted. Read AGENTS.md. Repository: /Users/hirakawa/.codex/worktrees/b4ee/0DSimDemo. One human plus AI; avoid overengineering. This is read-only: do not edit, run commands, run fits or publish. No need to review numerical research files or rerun literature searches for this implementation review.

User wants each baseline/preset registry gate to require at least one appropriate evidence/provenance record. Proposed implementation distinguishes empirical thresholds from mathematical/numerical contracts and engineered guards. Exploratory runs remain possible; missing direct per-check evidence prevents baseline regeneration or stable publication through current tools. Existing warning corridors must not become mandatory. Current numerical cutoffs, roles, production artifact, and launch baseline are intentionally unchanged. A separate dev-only preview exists but is not being minted.

Review these exact files:
- analysis/registry/FittingGateProvenanceV1.ts
- analysis/registry/MainWireBaselineGateProvenanceV1.ts
- analysis/registry/MainWireFittingReferenceRegistryV1.ts
- tools/registry/assertFittingReferenceEvidenceV1.ts
- tools/registry/generateMainWireIntegratedStudioStandard70BaselineV1.ts
- tools/registry/publishMainWireIntegratedStudioModelV3.ts (new stable admission check only)
- __tests__/fittingGateProvenanceV1.test.ts
Inspect related source/tests as needed. Existing source comparisons in data/physiology/main-wire-normal-reference-evidence-v1.json are retrospective, not automatically qualified: only comparisons with explicit coveredCheckIds, passage verification and thresholdRationale can support a mandatory empirical gate. The absence of these fields should remain an honest draft, not a candidate failure or numerical measurement change.

Check correctness, evidence coverage per check (including four preload directions), warning-vs-gate distinction, whether repository locators point to relevant tests, bypass/missing-field behavior, and whether this is unnecessarily complex. Does it falsely claim a paper confirms an inferred range, or a synthetic test validates physiology? Current helper is a structural provenance audit, not an automated scientific truth verifier. State Support / Conditional support / Oppose for landing this permanent implementation and concrete must-fix issues. Keep the answer concise and actionable. You may reject the implementation or propose a substantially simpler approach; do not assume the parent's design is correct.
