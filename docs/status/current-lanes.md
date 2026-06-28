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
| myocardium | Phase 5S records closed-loop operating-point calibration diagnostics after Phase 5C-R. The Phase 5C-Q `phase2b-absolute-peak-ca` Land BE provider runs cleanly at fixed diagnostic points `-1250`, `0`, and `1000` mL with zero Land solve failures. Main-domain points `0` and `1000` sit in a coarse legacy output/stress regime and remain period-1; the low-preload point remains report-only edge evidence. The paired LV source-provider experiment under the same experimental ModelCore closure remains the historical same-closure evidence with `sourceProviderDifferenceOnly=true`. The education-tool DoD checkpoint is `draft-do-d-ready-for-owner-review`, not accepted | Runtime replacement, Level 3/4 acceptance, official morphology, structural alternans removal, and final no-alternans remain blocked. The next decision is owner review of the education-tool Definition of Done and a developer-only runtime-flag design boundary; morphology Zc/filling lanes remain separate | owner-review the education-tool Definition of Done, then decide whether a developer-only LV Land runtime flag design is warranted before any case/workbench/official runtime wiring | no final no-alternans acceptance, no runtime replacement, no official morphology pass |
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

1. Owner-review the Phase 5S education-tool Definition of Done checkpoint.
2. Decide whether a developer-only LV Land runtime flag design is warranted before any case/workbench/official runtime wiring.
3. Keep provider-local SDIRK2 solver hardening narrow; Phase 5C-R did not unlock final no-alternans.
4. Classify residual dobutamine RV E/A-like missingness after the diagnostic inflow proxy.
5. Define/run an isolated arterial bench.
6. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
7. Keep studio MVP narrow and separate from scientific acceptance.
