# 0DSimDemo myocardium lead workflow

Use this reference after the skill triggers for nontrivial 0DSimDemo myocardium,
atria, morphology, Land runtime replacement, or PR orchestration work.

## Phase Charter

Before opening a substantive PR phase, write a compact charter for yourself and,
when useful, to the user:

- Objective: one concrete model or experiment outcome.
- Included: implementation, runner, artifact, verifier/test, minimal docs.
- Excluded: runtime wiring, schema changes, tuning, acceptance claims, UI work,
  or other lanes that are not part of the phase.
- Measurement validity: warmup, settling criteria, cap handling, beat selection,
  period-aware windows, sampling rate, and steady-state evidence.
- Success classes: pass, partial, fail, nonfinite/cap, uninterpretable.
- Claim boundary: what this PR can and cannot unlock.
- Delegation: coding delegate, review gate, oracle use, and timeout.

If the charter only says "prepare", "audit", or "document" while a measured
experiment can reasonably run in the same PR, enlarge the PR.

## Worktree And Branch Protocol

1. Refresh `origin/main`.
2. Create a fresh sibling worktree and a `codex/...` branch.
3. If tests need dependencies, symlink or install `node_modules` according to
   existing repo practice.
4. Keep the main worktree for reference and final fast-forward only.
5. Do not touch unrelated dirty or untracked files unless the user explicitly
   asks to clean them.

## Delegation And Review Gates

- Default coding delegate: Codex 5.5 xhigh, high-speed/priority if available.
- Default plan/code review gate for high-risk work: 1/2 approval from Claude Opus
  4.8 xhigh and Codex 5.5 xhigh, with the lead deciding which feedback to adopt.
- Skip plan review for small, mechanical, or already-chartered changes.
- Skip code review for low-risk docs/coordination edits after local verification.
- Set an informal delegate TTL. If a delegate stalls on a bounded task, continue
  locally rather than waiting indefinitely.

## Oracle Use

Use the `oracle` skill/tool when available.

- Broad direction cadence: at least about once every 3 PRs and normally every
  3-5 PRs, ask the ChatGPT Pro Extended oracle in the `循環動態シミュレーター`
  project for a flat current-state and future-direction review.
- Keep broad prompts short and non-leading. Example:

```text
この repo の現状をフラットに見て、今後の方針を率直に教えてください。PR review ではありません。
```

- PR-specific oracle review is optional and reserved for major scientific,
  runtime, or product-direction risk. Limit it to at most 2 oracle interactions
  per PR.
- Do not reject only because a PR is draft or CI is still running; those are
  lead-managed states.
- Use manual login / engine browser for oracle when required. Do not rely on
  Chrome cookies if the user has forbidden that.

## Experiment-First Guard

For myocardium, atria, and morphology phases, prefer work that measures reality:

- implement the runner or model path;
- run the experiment long enough to establish settling or cap status;
- record compact machine-readable artifacts;
- include focused verifier/tests;
- update docs only to state evidence boundaries.

Avoid PRs that only add readiness scans, wording guards, or audit scaffolding
unless the user explicitly asks or the next experiment is genuinely impossible.

## Current Owner Posture

Re-read `docs/status/current-lanes.md` for exact wording. Preserve these
standing assumptions unless the owner updates them:

- Production is unpublished with zero users, so internal staged replacement can
  move faster than a public clinical-product rollout.
- Land is ultimately intended to replace the current active model.
- Faster staged replacement does not imply clinical/scientific validation,
  official morphology acceptance, or final no-alternans acceptance.
- Atrial bridge work can be provisional, but the target is a refined atrial
  model that can reproduce correct atrial figure-eight PV loops.
- Studio/Workbench mock work is owner-led; focus on foundational math/model and
  engine evidence.
- Morphology issues are first-class model problems; do not tune myocardium
  parameters to hide arterial/filling/PV-loop artifacts.

## Measurement Validity Checklist

Before interpreting results, confirm:

- Same closure invariants for paired comparisons unless the phase intentionally
  changes the closure.
- No hidden qDot, valve, afterload, preload, Tref, source-stress, or parameter
  tuning unless the phase explicitly owns that intervention.
- Independent initialization and identical protocol where comparing stock and
  Land/provider paths.
- Warmup duration and measurement windows are documented.
- Settling, cap, nonfinite, and solver health are recorded.
- Period classification is period-aware, not a single-window artifact.
- Source/commit, artifact hashes, and runner inputs are recorded when practical.

## Claim Boundary Checklist

Do not claim more than the artifact earns:

- Developer-only or shadow evidence is not production replacement.
- Production/default wiring is not clinical/scientific validation.
- Morphology diagnostics are not official morphology acceptance.
- Low-preload alternans edge evidence should not block education-visible
  improvement indefinitely, but final no-alternans requires its own gate.
- A provisional atrial bridge is not final atrial physiology, AF validation, or
  atrial Land/RDQ validation.

## CI, PR, Merge, Cleanup

1. Run focused local checks first, at minimum `git diff --check` plus relevant
   package scripts.
2. Commit intentionally.
3. Push and create a PR with summary, verification, and claim boundary.
4. Watch CI. If CI is heavy, rely on required checks and do not add unnecessary
   local full-suite reruns.
5. Address real review findings. Keep oracle PR review optional unless the PR is
   a major checkpoint.
6. Merge when checks and gates are satisfied.
7. Fast-forward the main worktree to `origin/main`.
8. Remove the phase worktree and local/remote branch when safe.
9. Leave unrelated user work untouched; clean only explicitly requested
   disposable artifacts.

## Context Handoff

At the end of a phase, ensure the next agent can continue without reconstructing
the whole thread:

- `docs/status/current-lanes.md` reflects changed lane state and top priority
  only when the PR truly changes them.
- PR body and artifact names make the evidence boundary obvious.
- If the user explicitly asks for memory persistence, add one small ad-hoc memory
  note rather than editing memory indexes directly.
