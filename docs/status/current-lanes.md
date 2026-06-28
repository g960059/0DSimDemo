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
| myocardium | Phase 5U records a developer-only LV Land runtime-flag RFC with a tool-only helper and ModelCore smoke construction. It uses the Phase 5C-Q `phase2b-absolute-peak-ca` mapping behind an explicit developer-only acknowledgement, and remains `rfc-draft-owner-decision-needed` with `accepted: false`. No runtime, case, Workbench, state-schema, UI, or production-registry wiring exists. Phase 5S still provides the main-domain operating-point signal while low preload remains report-only edge evidence, and the paired LV source-provider experiment under the same experimental ModelCore closure remains historical same-closure evidence with `sourceProviderDifferenceOnly=true` | Owner GO/NO-GO is required before any developer-only flag implementation beyond the tools helper. Runtime replacement, official case reauthoring, Workbench runtime wiring, state-schema migration, Level 3/4 acceptance, official morphology, structural alternans removal, and final no-alternans remain blocked; morphology Zc/filling lanes remain separate | owner GO/NO-GO for a non-production developer-only LV Land runtime flag before any case/workbench/official runtime wiring | no final no-alternans acceptance, no runtime replacement, no official morphology pass |
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

1. Owner GO/NO-GO on the Phase 5U non-production developer-only LV Land runtime flag.
2. If GO, implement only a developer-only runtime flag path with official cases, Workbench, production registries, runtime UI, and state schema still blocked.
3. Keep provider-local SDIRK2 solver hardening narrow; Phase 5C-R did not unlock final no-alternans.
4. Classify residual dobutamine RV E/A-like missingness after the diagnostic inflow proxy.
5. Define/run an isolated arterial bench.
6. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
7. Keep studio MVP narrow and separate from scientific acceptance.
