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
| myocardium | Phase 5AD records `arterial-root-zc-prototype-smoke-phase5ad-result-v1`, a selected off-by-default root/Zc prototype smoke over normal-floor, HR90, arterial-stiffness-high, and bounded low-preload edge points for stock active and developer-only LV Land. It compares current closure, the Phase 5AB `AoV_L` 2x boundary carrier reference, direct `Ao_SA.L` 1.5x/2x edge overrides, and a combined `AoV_L` 2x + `Ao_SA.L` 1.5x candidate. It records 40 runs: 38 measured, 33 measured health ok, Land solve failure count zero. Measured-health-ok lower-clamp output-preserved comparisons are 5 for the AoV-boundary carrier reference, 0 for direct `Ao_SA.L`-only candidates, and 3 for the combined candidate; combined is classified not robust and 7 non-ok/unmeasured runs are boundary-tracked. Legacy active-stress is frozen as positive-control reference rather than deleted. SDIRK2 alternans closure remains parallel science work, not product migration gate. | Runtime default flip, legacy active-stress deletion, official case reauthoring, Workbench runtime wiring, state-schema migration, Level 3/4 acceptance, official morphology, structural alternans removal, final no-alternans, production/default arterial root/Zc/inertance adoption, direct Ao_SA adoption, AoV-boundary carrier adoption, physical Zc calibration, reflection-coefficient claim, valve/load candidate timing acceptance, and Land normal-floor LVEDP attribution remain blocked; arterial load, valve/load, classifier/window, PVein_LA/filling-inertance, and atrial filling lanes remain separate | do not adopt direct `Ao_SA.L`; either physicalize the AoV-boundary signal as a separate off-by-default boundary/root inertance mechanism with sourced calibration, or run the sourced physiological Zc calibration PR before further prototype adoption; separately attribute the Land normal-floor LVEDP blocker | no final no-alternans acceptance, no official morphology pass, no clinical/scientific validation |
| morphology | Phase M1 records `morphology-blocker-bundle-phase-m1-result-v1`; Phase 5X-5Z localize the LV qDot morphology blocker to real AoV/root discharge engagement rather than a dominant short-window denominator artifact. Phase 5AA records an offline prescribed-pressure arterial root inertance bench, Phase 5AB carries the lower-inertance Pareto region into closed loop, Phase 5AC adds direct isolated-bench input impedance spectra, and Phase 5AD tests selected off-by-default prototype routes. Phase 5AD blocks direct `Ao_SA.L`-only adoption as the root/Zc fix from smoke evidence while preserving the AoV-boundary carrier as a diagnostic signal, not physical adoption. Filling comparator evidence remains 39/42 interpretable; the residual gap is `lv-failure-dobutamine` branch 1 RV beats 1-3 missing only `eaLikeInflowProxy`. | residual dobutamine RV E/A-like proxy gap; reflection coefficient remains unavailable/no-proxy; sourced physiological Zc calibration missing; physical boundary/root inertance mechanism missing; valve/load timing diagnostics missing; RV filling morphology blockers | physicalize the AoV-boundary signal as an off-by-default boundary/root inertance mechanism or run sourced Zc calibration first; keep PVein_LA/filling inertance and atrial A1/refined figure-eight filling separate; derive/emit residual dobutamine RV `eaLikeInflowProxy` | no root-cause acceptance, no fix acceptance, no official morphology pass |
| atrial bridge | Phase 5.5 atrial bridge shootout and Phase 5.5B localization record measured E0/A0/A1 candidate evidence; Phase 5.5C runtime baseline adds measured stock-runtime evidence without remeasuring every candidate. `atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1` shows stock active no-provider ModelCore settles at HR75/90 but caps at HR105, matching the measured experimental A0 HR105 cap and making the high-HR boundary `runtime-boundary-likely` rather than atrial-provider-specific. Global elastance mode is measured as a whole-heart reference only. A1 valve diode contamination and sampling-invariance blockers remain; A1 repeatability remains `not-supported` as a blocker. No bridge is recommended or selected, and a bridge is not the final atrial physiology target. LV Land default migration must not wait for atrial figure-eight completion. | owner selection remains pending and oracle selection review remains pending; HR105 runtime/settling boundary can be treated as edge evidence for LV default posture but must be bounded before production atrial bridge selection; normalized A1 valve-event contamination and sampling-invariance blockers remain; refined educational atrial figure-eight-loop model path is not yet started | compare refined A1/provisional figure-eight candidates at HR75/90 with normal, preload-low, and preload-high envelopes; require readable LA/RA loops, visible booster loop, bounded valve/sampling contamination, and no LV/RV breakage; keep HR105 as edge evidence | final atrial physiology, AF validation, atrial Land/RDQ validation, production atrial bridge wiring, LV default migration gating |
| arterial load | Phase 5Y records real AoV qDot raw/post clamp engagement, and Phase 5Z no longer supports short-window denominator amplification as dominant. Phase 5AA adds the offline prescribed-pressure AoV/root inertance bench; Phase 5AB carries the lower-inertance region into closed loop through the existing `AoV_L` effective root-boundary carrier; Phase 5AC computes direct isolated-bench input impedance spectra; Phase 5AD tests selected off-by-default prototype routes. Phase 5AD finds 0 health-ok lower-clamp output-preserved comparisons for direct `Ao_SA.L`-only candidates, while the AoV-boundary carrier reference still carries 5 and combined carries 3 but is not robust. This blocks direct Ao_SA adoption and points toward a separate physical boundary/root inertance mechanism or sourced Zc calibration. | no production/off-by-default physical boundary/root inertance implementation; no sourced physiological Zc calibration; reflection coefficient remains unavailable/no-proxy; no candidate valve/load timing diagnostic; no fix acceptance evidence that physical inertance makes qDot clamps unnecessary in the live production closure | do not adopt direct `Ao_SA.L`; physicalize the AoV-boundary signal as an off-by-default boundary/root inertance mechanism with sourced calibration, or first run a sourced Zc calibration PR | production/default Zc adoption, qDot clamp removal, valve-threshold tuning, official morphology pass |
| studio/product | AI-native physiology studio direction proposed; owner is leading Studio/Workbench mock work outside this lane | MVP scope can grow too large | owner-led Home + Cases + static/mock Workbench | model validation, scientific acceptance |

## Weekly sync questions

1. Did any lane produce a BLOCKER for another lane?
2. Did any PR strengthen a claim boundary without evidence?
3. Is the next step an experiment or another readiness document?
4. Are we using morphology evidence to tune myocardium parameters? If yes, stop.
5. Are we using myocardium progress to claim product/clinical validity? If yes, stop.

## Current top priorities

1. Do not adopt direct `Ao_SA.L` as the root/Zc fix from Phase 5AD smoke
   evidence. Either physicalize the AoV-boundary signal as a separate
   off-by-default boundary/root inertance mechanism with sourced calibration, or
   run a sourced physiological Zc calibration PR before further prototype
   adoption. Keep qDot clamps, valve thresholds, valve loss terms, load/preload,
   Tref, source-stress scale, and Land parameters fixed.
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
