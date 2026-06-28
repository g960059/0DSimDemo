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
| myocardium | Phase 5V implements a non-production developer-only LV Land runtime flag path and records a developer-only measured operating suite. The fixed Phase 5S diagnostic points all converge with health ok, source/commit calls present, Land solve failure count zero, main-domain period-1, and exact Phase 5S Land output reproduction. No official case, Workbench, state-schema, runtime UI, production registry, or production runtime wiring exists; low preload remains report-only edge evidence and the paired LV source-provider experiment under the same experimental ModelCore closure remains historical source-provider evidence with `sourceProviderDifferenceOnly=true` | Production runtime replacement, official case reauthoring, Workbench runtime wiring, state-schema migration, Level 3/4 acceptance, official morphology, structural alternans removal, and final no-alternans remain blocked; morphology Zc/filling lanes remain separate | developer-only measured envelope expansion without official case/workbench/runtime wiring | no final no-alternans acceptance, no runtime replacement, no official morphology pass |
| morphology | PV-loop diagnostics plus diagnostic E/A-like inflow proxy exist; current-main baseline snapshot remains historical | filling comparator retains residual E/A-like missingness in dobutamine RV groups; arterial Zc/reflection remains signal-gap limited | classify residual dobutamine RV E/A missingness; isolated arterial bench | no root-cause acceptance, no fix acceptance, no official morphology pass |
| atrial bridge | Phase 5.5 atrial bridge shootout and Phase 5.5B localization record measured E0/A0/A1 candidate evidence; Phase 5.5C runtime baseline adds measured stock-runtime evidence without remeasuring every candidate. `atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1` shows stock active no-provider ModelCore settles at HR75/90 but caps at HR105, matching the measured experimental A0 HR105 cap and making the high-HR boundary `runtime-boundary-likely` rather than atrial-provider-specific. Global elastance mode is measured as a whole-heart reference only. A1 valve diode contamination and sampling-invariance blockers remain; A1 repeatability remains `not-supported` as a blocker. No bridge is recommended or selected. | owner selection remains pending and oracle selection review remains pending; HR105 runtime/settling boundary plus normalized A1 valve-event contamination and sampling-invariance blockers must be resolved or explicitly bounded before Phase 6 bridge selection | ask broad oracle direction after this PR group, then decide whether to bound HR105 as runtime edge evidence or start a new tuned A1/atrial Land path | final atrial physiology, AF validation, atrial Land/RDQ validation, production atrial bridge wiring |
| arterial load | Zc/reflection comparator readiness exists | no isolated bench or direct Zc/reflection signal | isolated arterial bench | production/default Zc adoption |
| studio/product | AI-native physiology studio direction proposed; owner is leading Studio/Workbench mock work outside this lane | MVP scope can grow too large | owner-led Home + Cases + static/mock Workbench | model validation, scientific acceptance |

## Weekly sync questions

1. Did any lane produce a BLOCKER for another lane?
2. Did any PR strengthen a claim boundary without evidence?
3. Is the next step an experiment or another readiness document?
4. Are we using morphology evidence to tune myocardium parameters? If yes, stop.
5. Are we using myocardium progress to claim product/clinical validity? If yes, stop.

## Current top priorities

1. Resolve or explicitly bound the Phase 5.5C HR105 runtime/settling boundary and normalized A1 valve/sampling blockers before Decision 21 Phase 6 bridge selection.
2. Expand the developer-only LV Land measured envelope through non-production harnesses only; keep official cases, Workbench, production registries, runtime UI, and state schema blocked.
3. Keep provider-local SDIRK2 solver hardening narrow; Phase 5C-R did not unlock final no-alternans.
4. Classify residual dobutamine RV E/A-like missingness after the diagnostic inflow proxy.
5. Define/run an isolated arterial bench when morphology lane timing is appropriate.
6. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
7. Keep Studio/Workbench mock work owner-led and separate from scientific acceptance.
