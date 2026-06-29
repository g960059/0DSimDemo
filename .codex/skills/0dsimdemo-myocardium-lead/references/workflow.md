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
- Measurement validity: use the checklist below.
- Success classes: pass, partial, fail, nonfinite/cap, uninterpretable.
- Claim boundary: use the checklist below.
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

## Parallel Lane Protocol

Use when 2-3 lanes run concurrently in separate worktrees/branches. Treat
`docs/status/current-lanes.md` as the shared lane registry; this section is the
procedure, not the lane list.

- Lane capsule: each lane charter names its branch/worktree, objective, owned
  files/artifacts, dependencies, claim boundary, and merge-order constraints.
- Lane claim: each lane works only inside its own lane row and owned
  files/artifacts. Do not edit another lane's row, blocker, or claim boundary.
- Serialize shared-state edits: `current-lanes.md` is shared mutable state. Edit
  only your own lane row, rebase on latest `origin/main` before pushing, and keep
  the row change in your phase PR so concurrent lanes do not clobber it. For
  shared sections such as policy, posture, and top priorities, ask the lead
  instead of editing directly.
- Closure assumptions stay lane-local: one lane's qDot, valve, load, preload, or
  closure choice must not silently become another lane's baseline.
- No cross-lane claim leakage: single-lane or edge-case evidence does not become
  a global pass or a global blocker for another lane.
- Lead owns merge order: lanes do not self-merge ahead of others. Propose ready
  PRs to the lead; the lead sequences merges and signals when to rebase. After
  any merge, other lanes refresh `origin/main` before continuing.
- One lane per worktree/branch. Keep lanes file-disjoint where possible; never
  reuse a worktree across lanes.

## Delegation And Review Gates

- Read `docs/status/current-lanes.md` for the current reviewer model names,
  oracle cadence, and escalation policy.
- Use a 1/2 gate for high-risk plan/code when the current policy calls for it;
  the lead decides which feedback to adopt.
- Skip plan review for small, mechanical, or already-chartered changes.
- Skip code review for low-risk docs/coordination edits after local verification.
- Set an informal delegate TTL. If a delegate stalls on a bounded task, continue
  locally rather than waiting indefinitely.

## Oracle Use

Use the `oracle` skill/tool when available.

- Use the current broad-review cadence from `docs/status/current-lanes.md`.
- Keep broad prompts short and non-leading. Example:

```text
この repo の現状をフラットに見て、今後の方針を率直に教えてください。PR review ではありません。
```

- Keep any PR-specific oracle review bounded and reserve it for major
  scientific, runtime, or product-direction risk.

## Experiment-First Guard

For model phases, prefer work that measures reality: implement the path, run the
experiment long enough to establish status, record compact artifacts, add focused
verification, and update only the docs needed to state evidence boundaries.
Avoid readiness-only PRs unless the next experiment is genuinely impossible or
the user explicitly asks for coordination-only work.

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

- Separate runtime adoption, product usefulness, and scientific/clinical
  validation.
- Separate diagnostic evidence from acceptance.
- Separate provisional integration paths from final physiology claims.
- Treat edge-case evidence as bounded evidence; do not let it silently become a
  global pass or a global blocker.
- State explicitly what the PR unlocks and what remains blocked.

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
