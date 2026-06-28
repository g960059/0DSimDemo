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

Oracle GPT Pro/extended PR review is not mandatory for every myocardium PR, but
should be used at least roughly once every three PRs, especially to check
overall scientific direction and next-plan corrections. Keep a hard cap of two
oracle PR reviews per PR.

## Lane table

| Lane | Current state | Current blocker | Next experiment | Must not claim |
|---|---|---|---|---|
| myocardium | Phase 5C-O records a Land activation/source-interface audit after the Phase 5C-M qDot clamp-threshold attribution and Phase 5C-N output-match not-overlapped diagnostic. The paired LV source-provider experiment under the same experimental ModelCore closure remains visible as the paired Land source-provider run: same-TBV pairs converge with `sourceProviderDifferenceOnly=true` within point. The settled Land trace active-stress target is only 0.00119 of pinned legacy at `delta=-1250` and 0.000892 at `delta=1000`, while provider source/commit path transients can be higher during the full run | output non-overlap is localized to the settled activation/source interface; structural alternans removal is not established; calcium/source-scale audit, explicit matched-regime forcing, and SDIRK2 are still required before stronger interpretation | run calcium input scale/unit audit and an explicit source/output-forcing bracket, plus SDIRK2 reference evidence before any structural no-alternans interpretation | no final no-alternans acceptance, no runtime replacement, no official morphology pass |
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

1. Run calcium input scale/unit audit and explicit source/output-forcing bracket after the Phase 5C-O activation/source-interface gap, while keeping SDIRK2 reference evidence required before final no-alternans interpretation.
2. Classify residual dobutamine RV E/A-like missingness after the diagnostic inflow proxy.
3. Define/run an isolated arterial bench.
4. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
5. Keep studio MVP narrow and separate from scientific acceptance.
