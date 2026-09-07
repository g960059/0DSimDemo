**Verdict: Conditional support.** The design is sound and honest, the numerics are untouched, and warning corridors stay advisory. Two small fail-loud gaps should be closed before landing. Nothing here falsely claims a paper confirms a range or that a synthetic test validates physiology.

**What I verified**

- Coverage is complete. The provenance table enumerates all 41 check IDs from the evidence JSON plus the four preload directions, and the existing coverage test pins evidence IDs to the actual check inventory.
- Warning vs gate is correct. The six reference-warning checks are excluded from the required set and filtered from the gates list, so they neither block nor trigger "unregistered" issues. Roles are pinned per check in `__tests__/mainWireIntegratedModelBaselineValidationV1.test.ts:192`, so reclassifying a physiological target to construction-guard to dodge the audit would break an existing test.
- Missing fields yield an honest draft. No comparison in the JSON has `coveredCheckIds`, so every empirical gate reports "no resolved, gate-specific support". Null `sourceRange` and absent `thresholdVerification` fall through to rejection without touching measurements.
- Exploratory runs are untouched. The local recovery method only reads `selectedConstruction`. The generate tool asserts at top of module, and publish asserts only for `--stage stable` (including dry-run, which is right).
- Preload text matches the policy. The 0.03 / 0.03 / 0.02 floors quoted in the cutoff rationale are the actual constants, and the guard text disclaims clinical meaning.
- All cited repository locators exist and resolve against the real files.

**Must-fix**

1. **Validate `coveredCheckIds` loudly.** A typo or an ID outside the group is silently ignored and produces a perpetual draft with a non-diagnostic message. In `MainWireBaselineGateProvenanceV1.ts` throw at load if any `coveredCheckIds` entry is not in `group.checkIds`, or if `thresholdVerification` is present with an unknown value. Three or four lines.
2. **Do not ignore source-level verification.** The JSON sources carry `verification` values such as `primary-source-metadata-checked` and `author-institution-abstract-checked-not-full-text`. A future author could mark a comparison `thresholdVerification: "passage-checked"` against a metadata-only source and the audit would admit it. Only map sources whose verification is full-text or passage level into the admissible source set, or reject the two weak values explicitly.

**Should-fix, not blocking**

- The regression locators for semilunar gradients and pulmonary-root morphology point into `__tests__/fittingGateProvenanceV1.test.ts` itself. Those are genuine boundary tests, but the evidence table citing the audit's own test file is circular. Move them into the baseline validation test file.
- The LVP/RVP guard regression cites a peak-counting helper unit test, and `settlement.period1` cites a report-corruption test. Both are tangential. Point them at a test that flips the actual check status.
- The "specification" locator for non-empirical gates is just the gateId string, which only proves the ID exists in the policy file. That is already guaranteed by the coverage assertions. Either point at the threshold constant or accept that this reference is decorative.
- `portableRepositoryReferenceV1` and the tool's realpath confinement do the same job. One is enough.
- One comparison can cover several checks with a single `thresholdRationale`. That is group-level borrowing in the sense the header comment says it prevents. Consider a per-check rationale map if that matters to you.

**Two consequences to be aware of, not defects**

- `rounded-not-plateau` is excluded only because policy v2 calls it a warning. The live launch baseline still pins policy v1, where it blocks. The audit is v2-only. That matches "warnings must not become mandatory" but is worth a one-line comment.
- Stable publication of the current, already-live artifact is now blocked until evidence lands. Re-publishing stable in a recovery scenario would need a code edit. That is the stated intent, so I am flagging it rather than objecting.

**Complexity.** About 250 lines for a structural audit is more than the minimum but bounded and readable. I would not reject it for over-engineering. The generic module plus injected resolver is defensible if a preset registry will reuse it, and it introduces no browser filesystem or network access.