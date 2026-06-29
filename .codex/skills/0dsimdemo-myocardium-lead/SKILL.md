---
name: 0dsimdemo-myocardium-lead
description: Lead/orchestrator workflow for 0DSimDemo myocardium, atrial model, morphology, and staged Land replacement phases. Use when working in this repo on docs/myocardium, engine myocardium/runtime experiments, atrial bridge or refined atrial model work, PV-loop morphology lanes, PR phase orchestration, delegated plan/code/review gates, oracle direction checks, CI/merge/cleanup, or context handoff across compaction.
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
- Use plan, plan review, coding, and code review only at the granularity that
  pays for itself. Skip lightweight gates for small coordination edits.
- Delegate coding by default when a suitable high-speed Codex worker is
  available, but take over quickly if the task is bounded or a delegate stalls.
- Use 1/2 review gates for high-risk plan/code: Claude Opus 4.8 xhigh and Codex
  5.5 xhigh where available; the lead makes the adoption decision.
- Use oracle broad direction review every 3-5 PRs or at major scientific/product
  checkpoints. Do not make oracle a default per-PR reviewer.

## Scope Guard

This skill is procedural. Do not encode current PR numbers, current blockers, or
latest scientific outcomes here. Keep live state in `docs/status/current-lanes.md`
and repo artifacts. Update memory only when the user explicitly asks.
