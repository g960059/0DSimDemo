# Current development lanes

Status: proposed coordination note
Scope: coordination only; no runtime/model claim

## Purpose

Track what each active team lane owns, what it may claim, what is blocked, and what the next experiment should be.

## Lane table

| Lane | Current state | Current blocker | Next experiment | Must not claim |
|---|---|---|---|---|
| myocardium | Phase 5C-D positive-control no-go recorded | same-closure legacy activeStress positive control settles to period-1 | ModelCore-equivalent positive-control closure route | Land no-alternans, runtime replacement, official morphology pass |
| morphology | PV-loop diagnostics, filling/arterial correlation and readiness artifacts exist | filling is correlation-only; arterial Zc/reflection is signal-gap limited | off-by-default filling comparator; isolated arterial bench | root cause accepted, fix accepted, official morphology pass |
| atrial bridge | Phase 5.5 shootout plan exists | no shootout runner/candidate results yet | E0/A0/A1 shootout runner | final atrial physiology, AF validation |
| arterial load | Zc/reflection comparator readiness exists | no isolated bench or direct Zc/reflection signal | isolated arterial bench | production/default Zc adoption |
| studio/product | AI-native physiology studio direction proposed | MVP scope can grow too large | Home + Cases + static/mock Workbench | model validation, scientific acceptance |

## Weekly sync questions

1. Did any lane produce a BLOCKER for another lane?
2. Did any PR strengthen a claim boundary without evidence?
3. Is the next step an experiment or another readiness document?
4. Are we using morphology evidence to tune myocardium parameters? If yes, stop.
5. Are we using myocardium progress to claim product/clinical validity? If yes, stop.

## Current top priorities

1. Resolve or replace the Phase 5C positive-control requirement.
2. Run a post-current-main PV morphology baseline artifact.
3. Implement a filling-limb off-by-default comparator.
4. Define/run an isolated arterial bench.
5. Keep studio MVP narrow and separate from scientific acceptance.
