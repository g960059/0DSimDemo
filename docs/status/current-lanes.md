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
- Do not gate LV Land user-0 default migration on atrial figure-eight completion
  or HR105/HR120 edge behavior. Keep atrial figure-eight work separate and
  education-visible, while LV default decisions stay tied to LV health,
  operating point, morphology blockers, and rollback/frozen-reference posture.
- Official cases are smoke and teaching-surface checks until the model closures
  stabilize. Do not spend phase capacity on per-case fine tuning before the
  discharge path, normal-floor operating point, and atrial loop decisions settle.
- Studio/Workbench mock work is owner-led; model lanes should focus on
  mathematical model and engine evidence.

## Lane table

| Lane | Current state | Current blocker | Next experiment | Must not claim |
|---|---|---|---|---|
| myocardium | Phase 5Z records `lv-land-ejection-window-localization-phase5z-result-v1`, a diagnostic-only localization of the Phase 5Y short ejection-window denominator hypothesis. It builds on the Phase 5W developer-only LV Land envelope, Phase 5X `lv-land-default-candidate-preflight-phase5x-result-v1` default-candidate preflight, and Phase 5Y `lv-land-qdot-blocker-localization-phase5y-result-v1` qDot blocker localization, then reruns the same 14 synthetic normal-floor plus one-axis user-knob points through stock active and developer-only LV Land without qDot, valve, load, preload, Land-parameter, Tref, or source-stress tuning. Land has health ok at all 14 points, all Land points settle, and Land solve failure count is zero. After aligning physical-window duration/volume to Phase 5X per-beat morphology rows, 13/14 Land points classify as `no-phase5x-window-amplification` and only HR120 remains `classifier-window-denominator-amplification-dominant`; median Phase 5X ejection-core/AoV-open duration ratio is `0.133333`, and median high-flow-core qDot fraction is `0.542857`, below the predeclared high-core dominance threshold. Arterial root/Zc/inertance and valve/load are next diagnostic hypotheses, not Phase 5Z root-cause acceptance. Contractility-low/high Land branches match normal-floor in this artifact, so those points record matrix coverage rather than independent Land contractility sensitivity. Legacy active-stress is explicitly frozen as the positive-control reference rather than deleted. SDIRK2 alternans closure remains parallel science work, not the product migration gate. No official case, Workbench, state-schema, runtime UI, production registry, or production runtime wiring exists; Studio remains owner-led static/mock rather than model validation. | Runtime default flip, legacy active-stress deletion, official case reauthoring, Workbench runtime wiring, state-schema migration, Level 3/4 acceptance, official morphology, structural alternans removal, and final no-alternans remain blocked; arterial Zc/root/inertance, valve/load, classifier/window, and atrial filling lanes remain separate | run isolated arterial root/Zc/inertance plus valve/load diagnostics before treating LV qDot fraction as a qDot/valve-threshold blocker; keep SDIRK2 closure against the frozen reference parallel; then consider a separate default-flip PR that preserves legacy reference | no final no-alternans acceptance, no official morphology pass, no clinical/scientific validation |
| morphology | Phase M1 records `morphology-blocker-bundle-phase-m1-result-v1`, a compact post-PR #219 current-main residual blocker classification. Phase 5X adds a user-knob robustness preflight using synthetic normal-floor/preload/HR/contractility/afterload/arterial-stiffness/venous-tone points rather than official-case tuning. Phase 5Y localizes the Phase 5X LV qDot blocker to real direct AoV qDot raw/post clamp engagement plus classifier-window amplification, not to an absence of qDot evidence. Phase 5Z tests the short ejection-window denominator hypothesis after per-beat normalization and does not support it as dominant: 13/14 Land points are `no-phase5x-window-amplification`, so qDot/valve-threshold tuning is explicitly not the next fix. Filling comparator evidence remains 39/42 interpretable; the residual gap is `lv-failure-dobutamine` branch 1 RV beats 1-3 missing only `eaLikeInflowProxy`. Arterial-load comparator evidence remains 42/42 internally interpretable, with direct Zc/reflection signals still explicit `missing-no-proxy` records and proxy use forbidden. | residual dobutamine RV E/A-like proxy gap; direct Zc/reflection signal gap; isolated arterial root/Zc/inertance bench missing; valve/load diagnostics missing; RV filling morphology blockers | run isolated arterial root/Zc/inertance and valve/load diagnostics; keep atrial A1/refined figure-eight filling separate; derive/emit residual dobutamine RV `eaLikeInflowProxy` | no root-cause acceptance, no fix acceptance, no official morphology pass |
| atrial bridge | Phase 5.5 atrial bridge shootout and Phase 5.5B localization record measured E0/A0/A1 candidate evidence; Phase 5.5C runtime baseline adds measured stock-runtime evidence without remeasuring every candidate. `atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1` shows stock active no-provider ModelCore settles at HR75/90 but caps at HR105, matching the measured experimental A0 HR105 cap and making the high-HR boundary `runtime-boundary-likely` rather than atrial-provider-specific. Global elastance mode is measured as a whole-heart reference only. A1 valve diode contamination and sampling-invariance blockers remain; A1 repeatability remains `not-supported` as a blocker. No bridge is recommended or selected, and a bridge is not the final atrial physiology target. LV Land default migration must not wait for atrial figure-eight completion. | owner selection remains pending and oracle selection review remains pending; HR105 runtime/settling boundary can be treated as edge evidence for LV default posture but must be bounded before production atrial bridge selection; normalized A1 valve-event contamination and sampling-invariance blockers remain; refined educational atrial figure-eight-loop model path is not yet started | compare refined A1/provisional figure-eight candidates at HR75/90 with normal, preload-low, and preload-high envelopes; require readable LA/RA loops, visible booster loop, bounded valve/sampling contamination, and no LV/RV breakage; keep HR105 as edge evidence | final atrial physiology, AF validation, atrial Land/RDQ validation, production atrial bridge wiring, LV default migration gating |
| arterial load | Phase 5Y records real AoV qDot raw/post clamp engagement, and Phase 5Z no longer supports short-window denominator amplification as the dominant explanation after per-beat normalization. This shifts square-ejection morphology toward the discharge path: arterial root/Zc/inertance and valve/load behavior. Existing arterial-load comparator evidence remains proxy-limited; direct Zc/reflection signals are still explicit `missing-no-proxy` records and must not be inferred from pressure/flow proxies. | no isolated root/Zc/inertance bench; no direct Zc/reflection signal; no valve/load diagnostic that shows whether physical inertance can make qDot clamps unnecessary | isolated arterial root/Zc/inertance bench with fixed qDot/valve thresholds; success signal is lower dQ/dt/qDot clamp engagement and longer, smoother ejection without myocardium, Tref, qDot, or valve-threshold tuning | production/default Zc adoption, qDot clamp removal, valve-threshold tuning, official morphology pass |
| studio/product | AI-native physiology studio direction proposed; owner is leading Studio/Workbench mock work outside this lane | MVP scope can grow too large | owner-led Home + Cases + static/mock Workbench | model validation, scientific acceptance |

## Weekly sync questions

1. Did any lane produce a BLOCKER for another lane?
2. Did any PR strengthen a claim boundary without evidence?
3. Is the next step an experiment or another readiness document?
4. Are we using morphology evidence to tune myocardium parameters? If yes, stop.
5. Are we using myocardium progress to claim product/clinical validity? If yes, stop.

## Current top priorities

1. Run an isolated arterial root/Zc/inertance bench next, with qDot and valve
   thresholds fixed, because Phase 5Y/5Z now point square LV ejection and qDot
   clamp engagement toward the discharge path rather than Land tuning.
2. Attribute the Land normal-floor LVEDP blocker before default flip. Keep this
   diagnostic-only across preload/TBV, venous tone, passive/geometry, and
   homogenization/source-scale probes; no Tref fudge, Land-parameter tuning,
   qDot tuning, valve tuning, or official-case tuning.
3. Use the users0 release posture to move toward LV Land production-shadow or a
   default-flip RFC only after the discharge-path and normal-floor blockers are
   bounded, while preserving legacy active-stress as a frozen reference and
   rollback path.
4. Advance atrial figure-eight work in a separate lane at HR75/90 normal and
   preload envelopes. Treat HR105/120 as edge evidence, not as an LV Land
   default gate.
5. Keep provider-local SDIRK2 solver hardening narrow; Phase 5C-R did not unlock
   final no-alternans.
6. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
7. Keep official cases at smoke/teaching-surface level until closures stabilize.
8. Keep Studio/Workbench mock work owner-led and separate from scientific
   acceptance.
