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
| myocardium | Phase 5C-P records a calcium/source forcing bracket after the Phase 5C-O activation/source-interface gap. The paired LV source-provider experiment under the same experimental ModelCore closure remains visible as the paired Land source-provider run: same-TBV pairs converge with `sourceProviderDifferenceOnly=true` within point. In the explicit forcing bracket, all 18 forced Land points converge; `calcium-scale-30` at `delta=-1250` reaches the legacy output/qDot clamp regime within coarse output-regime thresholds, not waveform or morphology acceptance, while Land remains period-1 | Phase 5C-M qDot clamp-threshold attribution and Phase 5C-N output-match not-overlapped remain unresolved for structural attribution; calcium-input forcing weakens pure low-output clamp avoidance, but structural alternans removal is not established; legacy active internal `c` to Land free-calcium unit/source mapping and SDIRK2 are still required before stronger interpretation | audit the calcium unit/source interface, then run SDIRK2 reference evidence before any final no-alternans interpretation | no final no-alternans acceptance, no runtime replacement, no official morphology pass |
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

1. Audit the legacy active internal `c` to Land free-calcium unit/source mapping after Phase 5C-P, while keeping SDIRK2 reference evidence required before final no-alternans interpretation.
2. Do not keep extending alternans mechanism subphases after the calcium-unit audit and SDIRK2 check; shift myocardium work toward Level 1-4 operating-point calibration and an education-tool Definition of Done checkpoint.
3. Classify residual dobutamine RV E/A-like missingness after the diagnostic inflow proxy.
4. Define/run an isolated arterial bench.
5. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
6. Keep studio MVP narrow and separate from scientific acceptance.
