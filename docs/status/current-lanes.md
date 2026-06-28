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

## Lane table

| Lane | Current state | Current blocker | Next experiment | Must not claim |
|---|---|---|---|---|
| myocardium | Phase 5C-N records a predeclared TBV-axis output-match diagnostic after the Phase 5C-M qDot clamp-threshold attribution and the Phase 5C-L paired Land source-provider run. The paired LV source-provider experiment under the same experimental ModelCore closure remains visible: every same-TBV pair converges before the 45s cap with `sourceProviderDifferenceOnly=true` within point, but output-match not-overlapped because the best Land point reaches only 0.376 of pinned legacy CO/SV and 0.091 of pinned legacy QAo peak | clamp-threshold avoidance remains unresolved; structural alternans removal is not established; SDIRK2 and an explicit output-forcing or other owner-approved match axis are still required before stronger interpretation | run SDIRK2 reference evidence and decide the next owner-approved output-match axis before any structural no-alternans interpretation | no final no-alternans acceptance, no runtime replacement, no official morphology pass |
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

1. Run SDIRK2 reference evidence for the paired Land result and decide whether explicit output forcing or another owner-approved match axis is warranted after the Phase 5C-N output-match not-overlapped diagnostic.
2. Classify residual dobutamine RV E/A-like missingness after the diagnostic inflow proxy.
3. Define/run an isolated arterial bench.
4. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
5. Keep studio MVP narrow and separate from scientific acceptance.
