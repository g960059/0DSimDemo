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

After the owner-GO LV Land default flip, do not carry the alternans-era
diagnostic cadence into every forward product/model phase. Treat old protocol
JSON, result JSON, and phase-specific verifiers as historical evidence unless
they protect a current invariant. New diagnostics should be disposable by
default: run them, record the result needed for the decision, and promote only
standing invariants to permanent gates. Permanent gates should stay small and
cross-phase: frozen legacy rollback, Land state sanity, work-conjugacy,
baseline operating-point health, user-knob morphology bounds, and official
case smoke/teaching-surface checks. Do not create one long-lived verifier per
micro-question unless that verifier protects one of those standing invariants.

## Owner Release Posture

Production is currently unpublished with zero users. Treat the rollout bar as
an internal staged-replacement bar, not a public clinical-product bar. If
measured developer-only Land behavior is better than legacy active-stress for
education-visible outputs and does not introduce hard health, solver, settling,
or morphology regressions, prefer moving toward production-shadow and default
candidate evidence quickly. Keep the claim boundary low: no clinical/scientific
validation, no alternans-finality claim, and no official morphology acceptance unless
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
| myocardium | Phase 5AK implements the owner-GO user-0 staged LV Land runtime selection. `user0-lv-land-default-flip-phase5ak-result-v1` records 4/4 LV Land smoke points settled and health-ok with zero Land solve failures, and 4/4 legacy rollback smoke points provider-free and non-failed. Preview, transition-steady, and Guyton/Starling runtime surfaces resolve LV Land through `createModelCoreRuntimeExperimentalOptions()`, while `runScenario`, `runToPeriodicSteady`, and the bare `ModelCore` constructor remain frozen legacy reference paths unless an explicit `runtimeActiveSourceMode` is passed. Phase 5AL adds explicit LV+RV Land default-candidate mode evidence without changing the runtime default: `rv-land-default-candidate-phase5al-result-v1` records 5/5 candidate smoke points settled and health-ok, zero LV/RV Land solve failures, and both providers called at every candidate point; current LV-only default remains RV-provider-free, and legacy rollback remains provider-free. The LV/RV candidate uses normalized chamber-default calcium-input user-control references, not Tref/source-stress tuning. Legacy active-stress is not deleted. | Legacy active-stress deletion, all-chamber Land runtime default, official case reauthoring, state-schema migration, Level 3/4 acceptance, official morphology, structural alternans removal, alternans-finality claim, production/default arterial root/Zc/inertance adoption, direct Ao_SA adoption, AoV-boundary carrier adoption, boundary/root production adoption, reflection-coefficient claim, valve/load candidate timing acceptance, qDot clamp removal, accepted preload/venous/passive/geometry/source-calcium tuning, Tref fudge, Land parameter tuning, and source-stress scaling remain blocked; arterial load, valve/load, classifier/window, PVein_LA/filling-inertance, and atrial filling lanes remain separate | after merge, decide whether the measured LV+RV candidate is acceptable for a staged LV+RV default flip, or continue chamber-replacement evidence with explicit RA/LA provider candidates; keep atrial figure-eight and root/Zc adoption separate | alternans finality, official morphology, all-chamber default, and clinical/scientific validation are not claimed |
| morphology | Phase M1 records `morphology-blocker-bundle-phase-m1-result-v1`; Phase 5X-5Z localize the LV qDot morphology blocker to real AoV/root discharge engagement rather than a dominant short-window denominator artifact. Phase 5AA records an offline prescribed-pressure arterial root inertance bench, Phase 5AB carries the lower-inertance region into closed loop, Phase 5AC adds direct isolated-bench input impedance spectra, Phase 5AD tests selected off-by-default prototype routes, Phase 5AE carries the AoV-boundary signal into a separated experimental boundary/root inertance hook, Phase 5AF sources the total 2x AoV/root candidate as the only preferred/broad Zc-range candidate, Phase 5AG shows closed-loop qDot+timing signal in 18/28 measured-health-ok comparisons, Phase 5AH attributes the weaker Land qDot headline to output-preserved but below-threshold qDot reductions rather than solve/output failure, and Phase 5AI bounds the Land normal-floor LVEDP excess as passive-proxy/source-sensitivity diagnostic evidence rather than morphology acceptance. Filling comparator evidence remains 39/42 interpretable; the residual gap is `lv-failure-dobutamine` branch 1 RV beats 1-3 missing only `eaLikeInflowProxy`. | residual dobutamine RV E/A-like proxy gap; reflection coefficient remains unavailable/no-proxy; production/default physical boundary/root inertance adoption missing; valve/load timing acceptance missing; qDot clamp removal remains unsupported; RV filling morphology blockers; accepted passive/source tuning remains blocked | keep PVein_LA/filling inertance plus atrial A1/refined figure-eight filling separate from LV default migration; derive/emit residual dobutamine RV `eaLikeInflowProxy` | no root-cause acceptance, no fix acceptance, official morphology is unclaimed |
| atrial bridge | Phase 5.5 atrial bridge shootout, Phase 5.5B localization, and Phase 5.5C runtime baseline record measured E0/A0/A1 and stock-runtime boundary evidence. `atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1` shows stock active no-provider ModelCore settles at HR75/90 but caps at HR105, matching the measured experimental A0 HR105 cap and making the high-HR boundary `runtime-boundary-likely` rather than atrial-provider-specific. Phase 5.5B made the prior A1 repeatability blocker `not-supported` after full-beat localization, while valve and isolated sampling blockers remained. Phase 5AN adds `atrial-figure-eight-readability-phase5an-result-v1`, a focused HR75/90 normal, preload-low, and preload-high envelope comparing A0, existing A1, and `atrial-refined-reservoir-booster-bridge-v1`. Refined A1 is measured partial: it settled at HR75 normal/low/high and HR90 high-preload, produced readable LA/RA loops only at HR75 low-preload, lowered MV/TV diode impulse per beat versus A0 across the envelope, but still had worse hit-sample rates at normal/high-preload points and one unbounded high-preload HR75 LA sampling site. No bridge is recommended or selected, and a bridge is not the final atrial physiology target. LV Land default migration must not wait for atrial figure-eight completion. | owner selection remains pending and oracle selection review remains pending; HR105 runtime/settling boundary can be treated as edge evidence for LV default posture but must be bounded before production atrial bridge selection; existing A1 normalized valve-event contamination and Phase 5.5B isolated sampling-invariance blockers remain selection blockers; refined A1 remains partial because RA lobe balance, high-preload LA sampling roughness, HR90 normal/low settling, and hit-rate contamination are not solved | tune/refactor candidate-local refined A1 lobe balance and reservoir/booster timing, distinguish low-impulse valve contacts from hit-rate contamination, and rerun the same HR75/90 normal/preload envelope; keep HR105/120 as edge evidence | final atrial physiology, AF validation, atrial Land/RDQ validation, production atrial bridge wiring, LV default migration gating |
| arterial load | Phase 5Y records real AoV qDot raw/post clamp engagement, and Phase 5Z no longer supports short-window denominator amplification as dominant. Phase 5AA adds the offline prescribed-pressure AoV/root inertance bench; Phase 5AB carries the lower-inertance region into closed loop through the existing `AoV_L` effective root-boundary carrier; Phase 5AC computes direct isolated-bench input impedance spectra; Phase 5AD tests selected off-by-default prototype routes; Phase 5AE adds a separated experimental boundary/root inertance hook without topology, state-layout, default-param, or direct `Ao_SA.L` changes. Phase 5AF calibrates total 2x as the preferred sourced-Zc candidate. Phase 5AG reruns that candidate over the full synthetic matrix, and Phase 5AH attributes the split: stock has strong qDot+timing response, while Land remains output-preserved and solve-ok but mostly timing-only below the qDot threshold; HR120 stock is a pre-existing non-health-ok edge. Phase 5AM exposes the sourced total 2x boundary/root mechanism as an explicit off-by-default runtime candidate through `rootZcMode` plus closure-local base `AoV_L` readback, while leaving current root/Zc as the default and keeping frozen legacy rollback fenced from experimental root/Zc composition. | no production/default boundary/root inertance adoption; reflection coefficient remains unavailable/no-proxy; no valve/load timing acceptance; no fix acceptance evidence that physical inertance makes qDot clamps unnecessary in the live production Land closure; qDot clamp removal remains unsupported | keep boundary/root off by default; use explicit `rootZcMode` plus executed-closure base `AoV_L` only for later live closure acceptance evidence with qDot clamps, valve thresholds, valve loss terms, load/preload, Tref, source-stress scale, and Land parameters fixed | production/default Zc adoption, qDot clamp removal, valve-threshold tuning, official morphology is unclaimed |
| studio/product | AI-native physiology studio direction proposed; owner is leading Studio/Workbench mock work outside this lane | MVP scope can grow too large | owner-led Home + Cases + static/mock Workbench | model validation, scientific acceptance |

## Historical Evidence Pins

These pins keep older live verifiers from losing the trail after Phase 5AK
advances the current lane. They are evidence anchors, not current gates.

- Phase 5C-L remains the paired Land source-provider result: paired Land
  source-provider, paired LV source-provider experiment under the same
  experimental ModelCore closure, `sourceProviderDifferenceOnly=true`.
- Historical exact phrase: paired LV source-provider experiment under the same experimental ModelCore closure; `sourceProviderDifferenceOnly=true`.
- Phase 5C-M remains the qDot clamp-threshold attribution blocker.
- Phase 5S remains the operating-point calibration checkpoint.
- Phase 5T remains `owner-review-ready-not-accepted` and points to a
  developer-only LV Land runtime-flag design RFC.
- Phase 5U remains `rfc-draft-owner-decision-needed` with owner GO/NO-GO in the
  historical developer-only path.
- Phase 5V remains the developer-only measured operating suite; historical text:
  No official case, Workbench, state-schema, runtime UI, production registry, or
  production runtime wiring exists. It pointed toward static/mock education UX.
- Phase 5W remains the developer-only LV Land envelope.
- Phase 5X remains `lv-land-default-candidate-preflight-phase5x-result-v1`
  after the developer-only LV Land envelope.
- Phase 5Y remains `lv-land-qdot-blocker-localization-phase5y-result-v1`.
- Phase 5Z remains `lv-land-ejection-window-localization-phase5z-result-v1`.
- Phase 5AH remains `arterial-root-boundary-attribution-phase5ah-result-v1`;
  it records 15/15 health-ok output-preserved Land comparisons, qDot clamp
  removal remains unsupported, and it points to Land normal-floor LVEDP.
- Phase 5AI remains `land-normal-floor-lvedp-attribution-phase5ai-result-v1`,
  `bounded-small-lvedp-excess-diagnostic-only`, and the default-flip RFC handoff.
- Phase 5AJ remains `user0-lv-land-default-flip-rfc-phase5aj-result-v1`,
  `owner-decision-needed`, and the historical note: actual default flip still requires owner GO.

## Weekly sync questions

1. Did any lane produce a BLOCKER for another lane?
2. Did any PR strengthen a claim boundary without evidence?
3. Is the next step an experiment or another readiness document?
4. Are we using morphology evidence to tune myocardium parameters? If yes, stop.
5. Are we using myocardium progress to claim product/clinical validity? If yes, stop.

## Current top priorities

1. Land is now the user-0 staged LV runtime default after owner GO. Do not delete
   legacy active-stress yet; keep it as frozen reference, debug fallback, and
   rollback while chamber-replacement lanes advance separately.
2. Phase 5AL has measured an explicit LV+RV Land default-candidate path. Treat it
   as candidate evidence, not a runtime flip; the next myocardium decision is
   staged LV+RV default adoption versus more chamber-local candidate evidence.
   Do not bundle that decision with root/Zc adoption, atrial figure-eight
   selection, official case tuning, qDot/valve/Tref/source-stress tuning, or
   legacy deletion.
3. Keep the Phase 5AH boundary/root attribution bounded: it explains the weaker
   Land qDot response and HR120 stock edge, but it does not unlock
   production/default root/Zc adoption, qDot clamp removal, valve/load timing
   acceptance, or official morphology.
4. Advance atrial figure-eight work in a separate lane at HR75/90 normal and
   preload envelopes. Treat HR105/120 as edge evidence, not as an LV Land
   default gate.
5. Keep provider-local SDIRK2 solver hardening narrow; Phase 5C-R did not unlock
   alternans-finality claim.
6. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
7. Keep official cases at smoke/teaching-surface level until closures stabilize.
8. Keep Studio/Workbench mock work owner-led and separate from scientific
   acceptance.
