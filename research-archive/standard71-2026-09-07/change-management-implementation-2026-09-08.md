# Change management: independent review and first implementation

Research record only; DO NOT MERGE PR613 into production. The production change
is commit `ca98df0e` in PR615. No exact-model registration, publication, active
bundle switch, launch-default change, numerical equation/parameter change, or
physiological threshold relaxation was performed in this step.

## Independent opinions and decision

The maintainer requested fresh Fable 5.1 max and Codex 6 Astra max opinions,
without the primary agent's conclusion or the other reviewer's answer. Both
received the same open factual request and inspected the implementation and
history. Fable used a fresh Claude Code print session with `claude-fable-5-1`,
`--effort max`, safe mode, plan permissions and no session persistence. The
response reported the requested primary model. Astra was spawned with
`gpt-6-astra`, max reasoning, and no conversation fork. Neither reran numerical
experiments during the policy review.

- [Fable answer](change-management-claude-fable-5.1-max.md)
- [Astra answer](change-management-astra-6-max.md)

Both favor keeping72 now, fixing candidates only at the durable replay
boundary, reusing applicable scientific evidence, and reducing old-generation
CI. Fable judged the original71-to72 mint unnecessary; Astra distinguishes
the current immutable exact contract from an unfixed candidate. The latter is
adopted. DB registration/reference state was not checked, so the claim that71
was never registered is not treated as a verified DB fact.

The maintainer approved the synthesis. The requested1/2 policy-review gate is
satisfied for this judgment; this is not an independent implementation or
scientific-validation approval.

Accepted boundaries:

- Track actual candidate content/input/numerical/assessment identities; dirty
  HEAD alone is insufficient. Freeze upon durable replay commitment, including
  dev registration, not merely public release.
- Keep the existing exact model/Surface identity architecture. Do not add
  physiology/solver/checkpoint release registries.
- Choose tests by changed claims, not by whether a model number changed.
- Reuse scientific assessment only when construction, inputs, numerics,
  measurements and policy correspond. Preserve original runs and warnings.
- Reuse authoring modules, not a frozen71 document relabelled as72. A shared
  construction hash does not establish document or measurement compatibility.
- Do not repeat external scientific votes for mechanical registration steps.

Not adopted: unconditional construction-hash-only evidence/document reuse,
blanket reuse after analysis changes, or immediate deletion of70 dependencies
while Studio/fitting still use70. There is no new generic gate language.

## Implementation

AGENTS and DESIGN-STUDIO-006/007 now distinguish candidate fixation and
impact-proportionate verification. The independently frozen document rule is
retained.

The72 admission function now has a separately callable, sealed scientific
assessment check. Its lock has separate `scientificAdmission` and
`releaseQualification` sections. Artifact, launch checkpoint, Surface and
analysis binding remain mandatory, but are not encoded as new scientific
approval. `--update` cannot change the pinned assessment or issue approval.
Missing/changed assessment or qualification prevents writes and publication.

Same-runtime restored-twin alignment is explicitly distinguished from warmed
uninterrupted-versus-restored continuation. The latter remains covered by
source/artifact/Worker qualification; twins alone do not establish it.

CI no longer rebuilds65-69 for registry admission. It verifies the retained
active70 artifact/client/lock against the comparison Git ref and validates
manifest/artifact hashes, without building a historical host. This lane has
no update mode and fails closed for a missing comparison ref or changed files.
The current source tests and Workbench browser tests remain.72 has its own
candidate package and continuation tests. Historical implementations still
needed by current code/tests are not deleted in this step.

One pre-existing negative Surface-publication test exposed validation-order
dependence on whether AGENTS.md was dirty. Invalid extensions now fail before
the committed-file check. Allowed module/JSON validation and the no-side-effect
publication boundary are unchanged.

## Verification on the implementation worktree

- TypeScript typecheck and test-mode production build: passed.
- PR smoke:768 tests /50 files,22.43s;60s budget unchanged.
- Fast suite:1076 tests /89 files,25.80s;60s budget unchanged. These overlap the
  PR suite and must not be counted as additional independent evidence.
-72 checkpoint8, construction4, Studio binding9, and admission17 tests passed.
  Retained-package guard7 and publication boundary25 also passed. A first
  publication-boundary run had the invalid-extension error-order failure above;
  it passed after the repair and in both broad suites.
- Actual retained70 Workbench browser suite:13 tests passed,51.6s. This is not
  a claim that the final72 Workbench entry has been migrated or UI-verified.
-72 deterministic artifact/admission CLI: both update and read-only verification
  passed. Artifact SHA remains
  `04d3b836f04f8fcfe5a50943eec3f935f65df055b46e4401303a9f91720f3c21`;
  no new executable revision or physics was introduced by these policy changes.
- Retained70 integrity verification, repository hygiene (891 tracked paths),
  and diff whitespace: passed. Remote CI is a separate run, not implied here.
- The DO NOT MERGE archive worktree's hygiene command still reports existing
  workstation paths in older archived reports and the prior DESIGN-STUDIO-008
  index omission. None of the new policy/review files was reported. Those
  historical files were not rewritten or imported into the production branch.

## Remaining

72 remains an unactivated candidate. Finish its actual Workbench, fitting,
baseline assessment disclosure and model-documentation wiring before changing
the active bundle. Preserve the latest compatible production Surface/analysis.
Then retire unneeded70/older runtime and registry dependencies. PR614's
independent reader is still separate. No new model number is needed for these
presentation/integration changes unless they alter the fixed exact contract.
