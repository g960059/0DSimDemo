# Standard72 production extraction — 2026-09-08

Status: **draft, not merge-ready**. The runtime foundation is qualified, but
model-specific72 admission and the old registry/artifact transition must be
completed in the same merge unit. No upload, registry mutation, default switch
or main merge occurred.

## Extraction

The new branch `codex/standard72-minimal-integration-v1` starts from current main
`ddc7b719`, including PR #612's clock/analysis/Surface improvements. The initial
extraction is commit `4e6c696c`. This archive is not copied onto that branch.

- Keep the reviewed72 checkpoint, Session, thin adapter, own settled/launch
  evidence and52 control defaults. The fixed physical fixture/material/Ca
  profiles keep their71 names and identities because they are current72
  dependencies, not a retired71 executable.
- Do not add71's executable, Session, checkpoint codec, old Surface or old test
  implementation merely to compare predecessors. The historical comparison
  remains here; current-contract tests and direct artifact parity replace that
  production dependency.
- Extract only systemic arterial storage scaling and Ao_SA inertance scaling
  into the shared circulation implementation. Do not include population-moment,
  activation/Huxley, semilunar-resistance or pulmonary-compliance research paths,
  their generalized provider/readback types, sweep tools, or research catalogs.
- Preserve the main branch's accepted-clock optimization and all existing
  production analysis changes.72 reexports the current70
  `measured-diastolic-workbench-v1` Surface. It does not freeze the older70
  Surface used in the previous archival qualification.
- Do not change physiology, solver tolerances, baseline values, normal-reference
  ranges or the active70 registration as part of this extraction.

## Verification and limitations

- The main PR smoke suite passed **768 tests /50 files**,22.27 s against a60 s
  budget. Type checking, production build and repository hygiene passed.
- New72 tests: core8, construction4, Studio9 all passed. Existing noncoronary
  circulation35, selected-owner5 and suite-manifest6 also passed. The added
  circulation cases check the actual momentum balance, constitutive inverse,
  unchanged non-systemic laws, invalid scales and competing owners. All new
  tests are registered in the canonical scientific lane.
- The first rewritten full-invariant test incorrectly required history4 in
  both tiers. The full-invariant path genuinely uses no predictor and has
  history0. The test now checks that actual tier-specific contract, exact
  roundtrip and continuation; the lean history4/1000-step equality remains
  strict. No numerical code changed to satisfy this test.
- [Final artifact qualification](standard72-minimal-artifact-binding.json):
  two builds identical; source/artifact parity, warm capture and1000-step
  continuation passed. The final extraction comparison uses the **new artifact
  versus the reviewed research artifact**, not source alone, in three cases:
  settled4935, cold4940 and an actual4935→4940 control. All3000 steps and three
  final complete checkpoints agree exactly in the same JavaScript engine.
- The first extraction comparison used source versus the research artifact.
  The independent reviewer recommended directly comparing both artifacts;
  this was adopted and regenerated as artifact-v2. The compiled artifact bytes
  did not change; only the verification path/report changed.
- [Browser report](standard72-minimal-browser-worker.json): Chromium and WebKit
  each pass ordinary and post-control Worker/JSON transport and1000-step exact
  continuation. Its artifact SHA equals the final v2 artifact SHA. This is not
  a Workbench UI test or cross-engine bit-equality guarantee.

Final artifact:2,456,516 bytes,
SHA `04d3b836f04f8fcfe5a50943eec3f935f65df055b46e4401303a9f91720f3c21`,
revision `e183f825fc018e704c6a3f84b98db46051caafe811df23017268928e8edd29b5`.
The unchanged launch envelope digest is
`a125d6aeaca4e1859adb847008afc83aa6de29715b6b23409006861b30932df2`.
The reviewed comparison artifact SHA is
`5210a42f1469072182ec6d7f18ee3ee54547a469e78af5479c812ca8ad0f45bb`.

Reports are copied verbatim here. Generated artifact bytes remain in the local
extraction worktree; this report and hash are not a backup of them. Reproduce
using the checked-in verification tools at the extraction revision and the
reviewed reference artifact, with both `--reference-artifact` and
`--reference-sha256`. The source extraction does not rewrite earlier reports.

## Known merge blocker: old deterministic artifact gate

The real `verify:registry:main-wire-algebraic-pulmonary-root-v1` command failed:
`MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.artifact.mjs differs
from its deterministic build`. Shared host/kernel changes alter the old70
build bytes even though the72 extraction itself is numerically equivalent.
The reviewer independently rebuilt with current and base sources and isolated
this difference to the extraction. The old70 registry job is mandatory in CI.
Smoke success therefore does **not** make this foundation independently
merge-ready.

Do not rewrite old artifact locks without equivalence admission, silently remove
the failing CI job, or label the draft ready. The chosen path is to finish72's
model-specific admission and intentionally retire no-longer-required old
executable/registry paths in this same draft PR, with coverage for the current
model and inherited Surface. Until then, this is a saved integration checkpoint.

## Adopted next admission boundary

Independent Astra max design review approved the following bounded design;
it did not approve an upload or registry mutation:

1. Keep the full reviewed eligibility conjunction: same construction, independent
   cold2/1 ms, applicability, periodicity/conservation/single Ca owner, τ
   observation quality and unresolved shape holds, pressure-rate quality and
   all four low/high preload admission directions. Rest alone is insufficient.
2. Bind the actual72 criterion inventory to its method-specific provenance:
   net CI, mean RAP/PAP, both CMR strata, systemic load guard and native LV
   end-filling guard. Do not reinterpret source-informed engineering bounds
   as source-derived clinical normal intervals.
3. Preserve v4 research eligibility, coarse/fine inputs and fresh72 binding as
   immutable evidence with hashes. A new production record binds those to the
   fixed fixture, model, own checkpoints, policy, final artifact, Surface and
   pinned analysis. It does not relabel old runs as newly executed72 evidence.
4. Use the same fail-closed check before generation/admission/publication side
   effects. Unknown identities, missing evidence or mismatched content are
   failures. Do not trust a persisted `status: passed` by itself.

The old global provenance audit still has16 draft entries; these are not
cleared by the new72 policy.70's old mandatory E/A, ICT/IRT/Tei/ET pass corridors
are not silently imported into72. Additional refitting,0.5 ms, all-reserve
replays or a general admission framework are not conditions of this boundary.

See the [independent review and adoption scope](standard72-minimal-review-astra-max.md).
