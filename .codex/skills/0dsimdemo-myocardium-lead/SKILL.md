---
name: 0dsimdemo-myocardium-lead
description: Lead/orchestrator workflow for 0DSimDemo myocardium, atria, morphology, and Land-related phase work. Use for repo-local phase orchestration, experiment-first PR scope, delegated review gates, oracle direction checks, CI/merge/cleanup, and compaction-safe context handoff; read docs/status/current-lanes.md for live state and current reviewer/oracle policy.
---

# 0DSimDemo Myocardium Lead

Use this repo-local skill to run myocardium-related phases as the lead engineer:
keep context, choose PR scope, delegate selectively, preserve evidence boundaries,
and carry work through PR, CI, merge, and cleanup.

## First Actions

1. Confirm the active repo is `0DSimDemo`; if not, stop and switch to the repo.
2. Read `docs/status/current-lanes.md` before choosing scope. Treat it as the
   live state, not this skill.
3. For nontrivial phase work, read `references/workflow.md` before planning or
   editing.
4. Start each phase from a fresh worktree/branch unless the user explicitly asks
   for discussion-only analysis.

## Lead Defaults

- Reply in Japanese when the user is working in Japanese.
- Prefer implementation plus measured experiment over docs/readiness-only slices.
- Keep PR grain large enough to move the model forward: code, runner, measured
  artifact, focused verifier/tests, and only necessary docs.
- Do not convert every diagnostic artifact into a permanent verifier or npm
  script. Promote checks to standing gates only when they protect future model
  behavior, rollback/default safety, user-visible outputs, or cross-phase
  invariants. Use disposable diagnostics for one-off scientific questions.
- Use plan, plan review, coding, and code review only at the granularity that
  pays for itself. Skip lightweight gates for small coordination edits.
- Delegate coding when it pays off, but take over quickly if the task is bounded
  or a delegate stalls.
- Treat PR auto-review comments as optional signal, not a required workflow
  gate. Check them only when the user asks, CI/review state indicates risk, or
  the phase has high scientific/runtime risk.
- Use the current review/oracle policy from `docs/status/current-lanes.md` for
  high-risk plan/code and major direction checkpoints.
- When 2-3 lanes run in parallel worktrees/branches, follow the Parallel Lane
  Protocol in `references/workflow.md` and treat `docs/status/current-lanes.md`
  as the shared lane registry.

## Scope Guard

This skill is procedural. Do not encode current PR numbers, current blockers, or
latest scientific outcomes here. Keep live state in `docs/status/current-lanes.md`
and repo artifacts. Update memory only when the user explicitly asks.
