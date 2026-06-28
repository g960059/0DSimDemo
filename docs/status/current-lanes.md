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
| myocardium | Phase 5C-Q records the calcium unit/source-interface audit after the Phase 5C-P forcing bracket. The paired LV source-provider experiment under the same experimental ModelCore closure remains visible and preserves `sourceProviderDifferenceOnly=true` within point. The pinned legacy LV `c` peak is 0.1523, which gives a Phase 2B absolute peak free-calcium scale of 6.70 and Land CaT50Ref scale of 5.28. A simple unit-style calcium mapping (`phase2b-absolute-peak-ca`) reaches the coarse legacy output/qDot regime at the pinned point while Land remains period-1. This means Phase 5C-P's scale-30 result was a positive control, not a required scale | Structural alternans removal is still not established. Phase 5C-Q is a source-interface signal, not runtime replacement, morphology acceptance, or final no-alternans. SDIRK2/reference robustness and then Level 1-4 operating-point calibration are still required before runtime design | run SDIRK2 reference evidence for legacy pinned/raw Land/audited calcium mapping candidate, then stop extending alternans mechanism subphases and shift myocardium work toward Level 1-4 operating-point calibration plus an education-tool Definition of Done checkpoint | no final no-alternans acceptance, no runtime replacement, no official morphology pass |
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

1. Run SDIRK2 reference evidence for the legacy pinned/raw Land/audited calcium mapping candidate before any final no-alternans interpretation.
2. Do not keep extending alternans mechanism subphases after the calcium-unit audit and SDIRK2 check; shift myocardium work toward Level 1-4 operating-point calibration and an education-tool Definition of Done checkpoint.
3. Classify residual dobutamine RV E/A-like missingness after the diagnostic inflow proxy.
4. Define/run an isolated arterial bench.
5. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
6. Keep studio MVP narrow and separate from scientific acceptance.
