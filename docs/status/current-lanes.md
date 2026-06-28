# Current development lanes

Status: proposed coordination note
Scope: coordination only; no runtime/model claim

## Purpose

Track what each active team lane owns, what it may claim, what is blocked, and what the next experiment should be.

## Execution Policy

The review gate for myocardium work is intentionally heavy, so PRs must not
shrink into documentation, audit, or readiness-only slices by default. A phase
PR should be large enough to produce real progress: implement the experiment,
run it, record the measured evidence, add focused verifier/tests, and update
only the docs needed to state the evidence boundary. Preparing for a later
experiment is not enough when the experiment can reasonably be run in the same
PR. Measurement comes first; the gate exists to review results, not to defer
them.

Oracle GPT Pro/extended is not a per-PR review gate by default. Use it roughly
every 3-5 PRs for a broad, flat direction review in the ChatGPT
`循環動態シミュレーター` project, asking for the repo's current-state review and
future direction without over-constraining the prompt. Keep a hard cap of two
oracle interactions per PR/session if a PR-specific escalation is still needed.

## Lane table

| Lane | Current state | Current blocker | Next experiment | Must not claim |
|---|---|---|---|---|
| myocardium | Phase 5C-R records provider-local Land SDIRK2 commit-solver evidence after the Phase 5C-Q calcium unit/source-interface audit. At the pinned point, `phase2b-calcium-mapped-sdirk2` preserves the coarse legacy output/qDot regime and remains period-1 with score delta 0.0017 vs BE, but provider-local SDIRK2 stage1 solve failures remain high. The robustness status is `sdirk2-reference-inconclusive`, not an acceptance. The paired LV source-provider experiment under the same experimental ModelCore closure remains the historical same-closure evidence with `sourceProviderDifferenceOnly=true` | Final no-alternans and structural alternans removal remain blocked because the SDIRK2 reference is provider-local, not global ModelCore SDIRK2, and the SDIRK2 commit solver reports failures. The practical next focus is Level 1-4 operating-point calibration and education-tool Definition of Done; further SDIRK2 hardening should be treated as a narrow technical blocker, not another broad alternans-mechanism subphase | shift myocardium work toward Level 1-4 operating-point calibration plus an education-tool Definition of Done checkpoint; only revisit provider-local SDIRK2 solver hardening if final no-alternans acceptance is explicitly in scope | no final no-alternans acceptance, no runtime replacement, no official morphology pass |
| morphology | PV-loop diagnostics plus diagnostic E/A-like inflow proxy exist; current-main baseline snapshot remains historical | filling comparator retains residual E/A-like missingness in dobutamine RV groups; arterial Zc/reflection remains signal-gap limited | classify residual dobutamine RV E/A missingness; isolated arterial bench | no root-cause acceptance, no fix acceptance, no official morphology pass |
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

1. Shift myocardium work toward Level 1-4 operating-point calibration and an education-tool Definition of Done checkpoint.
2. Keep provider-local SDIRK2 solver hardening narrow; Phase 5C-R did not unlock final no-alternans.
3. Classify residual dobutamine RV E/A-like missingness after the diagnostic inflow proxy.
4. Define/run an isolated arterial bench.
5. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
6. Keep studio MVP narrow and separate from scientific acceptance.
