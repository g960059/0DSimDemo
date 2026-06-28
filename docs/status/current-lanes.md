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

## Owner Release Posture

Production is currently unpublished with zero users. Treat the rollout bar as
an internal staged-replacement bar, not a public clinical-product bar. If
measured developer-only Land behavior is better than legacy active-stress for
education-visible outputs and does not introduce hard health, solver, settling,
or morphology regressions, prefer moving toward production-shadow and default
candidate evidence quickly. Keep the claim boundary low: no clinical/scientific
validation, no final no-alternans, and no official morphology acceptance unless
their specific gates pass.

Current owner priorities:

- Land is intended to replace the current active model; do not let low-preload
  alternans edge-case research block education-visible improvement after measured
  preflight, morphology, and health evidence are available.
- Atria should not stop at a bridge. The target is a refined atrial model that
  can reproduce correct atrial figure-eight PV loops; use a bridge only as a
  provisional integration path when evidence or oracle direction supports it.
- Morphology fixes for PV-loop roughness, filling jaggedness, and square
  ejection are first-class model work. Use arterial/filling diagnostics and
  isolated benches; do not tune myocardium parameters to hide morphology
  problems.
- Studio/Workbench mock work is owner-led; model lanes should focus on
  mathematical model and engine evidence.

## Lane table

| Lane | Current state | Current blocker | Next experiment | Must not claim |
|---|---|---|---|---|
| myocardium | Phase 5W expands the non-production developer-only LV Land runtime flag path into a measured HR/preload envelope after the Phase 5V developer-only measured operating suite. `myocardium-developer-only-lv-land-envelope-phase5w-result-v1` compares stock active and developer-only LV Land at HR75/90 x TBV 4350/5600/6600 with independent initialization, same closure invariants, period-aware 1000 Hz measurement windows after 240 Hz settling, health/settling/output/qDot/valve/filling proxies, source/commit calls present, and Land solve failure count zero. Main-domain Land runs are health ok and settled, but HR90 main-domain Land settles as period-2 and stock active HR90/TBV5600 caps; low preload remains report-only edge evidence. The paired LV source-provider experiment under the same experimental ModelCore closure remains historical source-provider evidence with `sourceProviderDifferenceOnly=true`. No official case, Workbench, state-schema, runtime UI, production registry, or production runtime wiring exists; Studio remains owner-led static/mock rather than model validation. | Production runtime replacement, official case reauthoring, Workbench runtime wiring, state-schema migration, Level 3/4 acceptance, official morphology, structural alternans removal, and final no-alternans remain blocked; morphology Zc/filling lanes remain separate | produce production-shadow/default-candidate evidence under the users0 posture, starting with paired stock-active versus developer-only LV Land morphology and health checks; do not default-replace active model from Phase 5W alone | no final no-alternans acceptance, no official morphology pass, no clinical/scientific validation |
| morphology | Phase M1 records `morphology-blocker-bundle-phase-m1-result-v1`, a compact post-PR #219 current-main residual blocker classification. The PV-loop morphology runner was rerun with 7 branches, 17,304 metric rows, and 60,572 sample rows. Filling comparator evidence is now 39/42 interpretable; the only residual uninterpretable groups are `lv-failure-dobutamine` branch 1 RV beats 1-3, each missing only `eaLikeInflowProxy` while all other residual anti-gaming readouts are available. The arterial-load comparator is 42/42 internally interpretable, but direct Zc/reflection signals remain explicit `missing-no-proxy` records with proxy use forbidden and no hypothesis promotion. | residual dobutamine RV E/A-like proxy gap; direct Zc/reflection signal gap; Phase M1 did not run paired LV Land-vs-stock morphology or an isolated arterial bench | paired stock-active vs developer-only LV Land morphology matrix; isolated arterial bench; derive/emit residual dobutamine RV `eaLikeInflowProxy` | no root-cause acceptance, no fix acceptance, no official morphology pass |
| atrial bridge | Phase 5.5 atrial bridge shootout and Phase 5.5B localization record measured E0/A0/A1 candidate evidence; Phase 5.5C runtime baseline adds measured stock-runtime evidence without remeasuring every candidate. `atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1` shows stock active no-provider ModelCore settles at HR75/90 but caps at HR105, matching the measured experimental A0 HR105 cap and making the high-HR boundary `runtime-boundary-likely` rather than atrial-provider-specific. Global elastance mode is measured as a whole-heart reference only. A1 valve diode contamination and sampling-invariance blockers remain; A1 repeatability remains `not-supported` as a blocker. No bridge is recommended or selected, and a bridge is not the final atrial physiology target. | owner selection remains pending and oracle selection review remains pending; HR105 runtime/settling boundary plus normalized A1 valve-event contamination and sampling-invariance blockers must be resolved or explicitly bounded before Phase 6 bridge selection; refined atrial figure-eight-loop model path is not yet started | ask broad oracle direction after this PR group, then decide whether to bound HR105 as runtime edge evidence, use a provisional bridge for LV integration, or start a refined atrial figure-eight model path | final atrial physiology, AF validation, atrial Land/RDQ validation, production atrial bridge wiring |
| arterial load | Zc/reflection comparator readiness exists | no isolated bench or direct Zc/reflection signal | isolated arterial bench | production/default Zc adoption |
| studio/product | AI-native physiology studio direction proposed; owner is leading Studio/Workbench mock work outside this lane | MVP scope can grow too large | owner-led Home + Cases + static/mock Workbench | model validation, scientific acceptance |

## Weekly sync questions

1. Did any lane produce a BLOCKER for another lane?
2. Did any PR strengthen a claim boundary without evidence?
3. Is the next step an experiment or another readiness document?
4. Are we using morphology evidence to tune myocardium parameters? If yes, stop.
5. Are we using myocardium progress to claim product/clinical validity? If yes, stop.

## Current top priorities

1. Use the users0 release posture to move from developer-only LV Land evidence
   toward production-shadow/default-candidate evidence, while keeping validation
   claims narrow and measured.
2. Run paired stock-active versus developer-only LV Land morphology matrix before
   using Phase 5W to justify production-shadow morphology.
3. Resolve or explicitly bound the Phase 5.5C HR105 runtime/settling boundary and
   normalized A1 valve/sampling blockers, then choose between a provisional bridge
   and a refined atrial figure-eight model path.
4. Keep provider-local SDIRK2 solver hardening narrow; Phase 5C-R did not unlock
   final no-alternans.
5. Define/run an isolated arterial bench when morphology lane timing is
   appropriate.
6. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
7. Keep Studio/Workbench mock work owner-led and separate from scientific
   acceptance.
