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
| myocardium | Phase 5Y records `lv-land-qdot-blocker-localization-phase5y-result-v1`, a diagnostic-only localization of the Phase 5X LV qDot morphology blocker. It builds on the Phase 5W developer-only LV Land envelope and the Phase 5X `lv-land-default-candidate-preflight-phase5x-result-v1` artifact, then reruns the Phase 5X synthetic normal-floor plus one-axis user-knob sweep through stock active and developer-only LV Land without qDot, valve, load, preload, Land-parameter, Tref, or source-stress tuning. Land has health ok at all 14 points, all Land points settle, and Land solve failure count is zero. All 14 Land points show direct AoV qDot raw/post clamp engagement, while the Phase 5X morphology `qDotClampHitFraction=1` signal is amplified by a short morphology-classified ejection core relative to the broader AoV-open window. The normal-floor LVEDP blocker remains recorded. Legacy active-stress is explicitly frozen as the positive-control reference rather than deleted. SDIRK2 alternans closure remains parallel science work, not the product migration gate. No official case, Workbench, state-schema, runtime UI, production registry, or production runtime wiring exists; Studio remains owner-led static/mock rather than model validation. | Runtime default flip, legacy active-stress deletion, official case reauthoring, Workbench runtime wiring, state-schema migration, Level 3/4 acceptance, official morphology, structural alternans removal, and final no-alternans remain blocked; classifier/window, arterial Zc/root/load, and atrial filling lanes remain separate | split the Phase 5Y qDot localization into classifier/window and operating-point analysis versus arterial root/Zc/load morphology; keep SDIRK2 closure against the frozen reference parallel; then consider a separate default-flip PR that preserves legacy reference | no final no-alternans acceptance, no official morphology pass, no clinical/scientific validation |
| morphology | Phase M1 records `morphology-blocker-bundle-phase-m1-result-v1`, a compact post-PR #219 current-main residual blocker classification. Phase 5X adds a user-knob robustness preflight using synthetic normal-floor/preload/HR/contractility/afterload/arterial-stiffness/venous-tone points rather than official-case tuning. Phase 5Y localizes the Phase 5X LV qDot blocker to real direct AoV qDot raw/post clamp engagement plus classifier-window amplification, not to an absence of qDot evidence. This keeps morphology as an acceptance gate rather than a retroactive explanation and explicitly forbids qDot/valve tuning as the fix in this phase. Filling comparator evidence remains 39/42 interpretable; the residual gap is `lv-failure-dobutamine` branch 1 RV beats 1-3 missing only `eaLikeInflowProxy`. Arterial-load comparator evidence remains 42/42 internally interpretable, with direct Zc/reflection signals still explicit `missing-no-proxy` records and proxy use forbidden. | residual dobutamine RV E/A-like proxy gap; direct Zc/reflection signal gap; Phase 5Y classifier/window versus arterial-root/load attribution; RV filling morphology blockers; no isolated arterial bench | use Phase 5Y to split classifier/window and operating-point work from arterial Zc/root morphology; keep atrial A1/refined figure-eight filling separate; derive/emit residual dobutamine RV `eaLikeInflowProxy` | no root-cause acceptance, no fix acceptance, no official morphology pass |
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
2. Use Phase 5Y qDot blocker localization to split classifier/window and
   operating-point work from arterial root/Zc/load morphology before a default
   flip PR.
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
