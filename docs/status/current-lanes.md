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
The broad oracle checkpoint after Phase 5AT/PR #250 supported treating LV+RV
Land plus sourced root/Zc as the user-0 staged default baseline, then moving the
main model work to RA source-stress convention and AtrialPhysiologyBridgeV2/A2
without bundling all-chamber default, atrial figure-eight selection, official
case tuning, qDot clamp retirement, legacy deletion, or root/Zc re-litigation
into one gate.

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
  Treat E0/time-varying atrial elastance as a negative control, A0 as frozen
  comparator/fallback, A1 as a diagnostic bridge rather than final physiology,
  AV-plane reservoir coupling as a common mechanism for bridge and LandAtrial
  paths, and LandAtrial with atrial parameter packs as the final active-mechanics
  target.
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
| myocardium | Phase 5AK implements the owner-GO user-0 staged LV Land runtime selection. Phase 5AL measures explicit LV+RV Land default-candidate evidence. Phase 5AO promotes that measured path to the user-0 staged LV+RV runtime default: `lv-rv-land-default-flip-phase5ao-result-v1` records 5/5 default smoke points settled and health-ok, zero LV/RV Land solve failures, both providers and sidecars present at every default point, 5/5 previous LV-only points still RV-provider-free when requested explicitly, and 5/5 legacy rollback points provider-free and non-failed. Phase 5AP then adopts the sourced total 2x root/Zc boundary/root mechanism for the LV+RV runtime default after live-closure evidence; preview, transition-steady, and Guyton/Starling runtime surfaces resolve LV+RV Land plus adopted root/Zc through `createModelCoreRuntimeExperimentalOptions()` by default, while `runScenario`, `runToPeriodicSteady`, and the bare `ModelCore` constructor remain frozen legacy reference paths unless an explicit `runtimeActiveSourceMode` is passed. The LV/RV default uses normalized chamber-default calcium-input user-control references, not Tref/source-stress tuning. Phase 5AQ adds an explicit all-chamber Land candidate and fixes/audits atrial Land source strain to use the same AV-plane-adjusted pressure-adapter lambda as atrial pressure assembly. The candidate reaches LA/RA providers in 6/6 HR75/90 preload points with zero LA/RA Land solve failures, but remains `not-supported` because `low-preload-hr90` fails with `source active-fiber stress must be nonnegative`. Phase 5AR attributes that blocker: LA-only Land is health-ok in 6/6, while RA-only and all-chamber fail only at low-preload HR90 because raw RA Land source stress goes slightly negative before the pressure adapter (`-1.490128` to `-1.64698` Pa). Phase 5AV tests a signed RA pressure-adapter candidate: the current RA nonnegative control reproduces the low-preload HR90 runtime error, while signed RA-only and all-chamber candidates remove runtime errors and reach 5/6 measured health-ok points but still cap at low-preload HR90. Legacy active-stress is not deleted. | Legacy active-stress deletion, all-chamber Land runtime default, official case reauthoring, state-schema migration, Level 3/4 acceptance, official morphology, structural alternans removal, alternans-finality claim, direct Ao_SA adoption, AoV-boundary carrier adoption, reflection-coefficient claim, valve/load candidate timing acceptance, qDot clamp removal, accepted preload/venous/passive/geometry/source-calcium tuning, Tref fudge, Land parameter tuning, source-stress scaling, and source-stress clamping remain blocked; signed RA source-stress pressure adaptation is candidate-only and low-preload HR90 settle-blocked; arterial load, valve/load, classifier/window, PVein_LA/filling-inertance, atrial filling, and RA/LA chamber-replacement lanes remain separate | if continuing RA Land, inspect low-preload HR90 settling under signed RA pressure adaptation without source-stress clamping/tuning; separately advance A2/AV-plane/LandAtrial atrial figure-eight work plus valve/load timing/morphology gates | alternans finality, official morphology, all-chamber default, source-stress clamp/tuning, qDot clamp removal, valve/load timing acceptance, and clinical/scientific validation are not claimed |
| morphology | Phase M1 records `morphology-blocker-bundle-phase-m1-result-v1`; Phase 5X-5Z localize the LV qDot morphology blocker to real AoV/root discharge engagement rather than a dominant short-window denominator artifact. Phase 5AA records an offline prescribed-pressure arterial root inertance bench, Phase 5AB carries the lower-inertance region into closed loop, Phase 5AC adds direct isolated-bench input impedance spectra, Phase 5AD tests selected off-by-default prototype routes, Phase 5AE carries the AoV-boundary signal into a separated experimental boundary/root inertance hook, Phase 5AF sources the total 2x AoV/root candidate as the only preferred/broad Zc-range candidate, Phase 5AG shows closed-loop qDot+timing signal in 18/28 measured-health-ok comparisons, Phase 5AH attributes the weaker Land qDot headline to output-preserved but below-threshold qDot reductions rather than solve/output failure, Phase 5AI bounds the Land normal-floor LVEDP excess as passive-proxy/source-sensitivity diagnostic evidence rather than morphology acceptance, and Phase 5AP supports adopting the sourced total 2x root/Zc candidate in the live LV+RV default closure with 15/15 health-ok comparisons, output-preserved fraction 1.0, timing-signal fraction 1.0, qDot-signal fraction 0.466667, and zero output/timing-cost points. Filling comparator evidence remains 39/42 interpretable; the residual gap is `lv-failure-dobutamine` branch 1 RV beats 1-3 missing only `eaLikeInflowProxy`. | residual dobutamine RV E/A-like proxy gap; reflection coefficient remains unavailable/no-proxy; valve/load timing acceptance missing; qDot clamp removal remains unsupported; RV filling morphology blockers; accepted passive/source tuning remains blocked | keep PVein_LA/filling inertance plus atrial A1/refined figure-eight filling separate from LV default migration; derive/emit residual dobutamine RV `eaLikeInflowProxy`; use root/Zc adoption as morphology infrastructure, not official morphology acceptance | no official morphology, qDot clamp removal, valve/load timing acceptance, or clinical/scientific validation is claimed |
| atrial bridge | Phase 5.5 atrial bridge shootout, Phase 5.5B localization, and Phase 5.5C runtime baseline record measured E0/A0/A1 and stock-runtime boundary evidence. `atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1` shows stock active no-provider ModelCore settles at HR75/90 but caps at HR105, matching the measured experimental A0 HR105 cap and making the high-HR boundary `runtime-boundary-likely` rather than atrial-provider-specific. Phase 5.5B made the prior A1 repeatability blocker `not-supported` after full-beat localization, while valve and isolated sampling blockers remained. Phase 5AN adds `atrial-figure-eight-readability-phase5an-result-v1`, a focused HR75/90 normal, preload-low, and preload-high envelope comparing A0, existing A1, and `atrial-refined-reservoir-booster-bridge-v1`. Refined A1 is not supported by this artifact: it settled at HR75 normal/low/high and HR90 high-preload, but no point produced readable LA/RA loops after requiring opposing booster/reservoir signed lobes. Phase 5AS then sweeps RA-local refined A1 variants without selecting a bridge; `ra-soft-sleeve-v1` gives the strongest parameter-space signal, with both-chamber readability only at `high-preload-hr90` and RA opposed-lobe signal at `normal-hr75` plus `high-preload-hr90`. Phase 5AT tests explicit AV-plane structural candidates: single-chamber AV-plane gives the strongest local RA signal at `high-preload-hr75`, but no candidate produces both-chamber readable loops and the two-branch plus body-AV-plane composition is not enough for selection. Phase 5AU defines and measures the AtrialPhysiologyBridgeV2/A2 readout contract in the current LV+RV Land plus sourced root/Zc default closure: 6/6 points are health-ok and expose LA/RA self dV/dt, a/v wave, pressure-swing, E/A-like inflow, and valve/qDot readouts. Phase 5AW then closes the provider input gap: `atrial-a2-inputs-phase5aw-result-v1` records 6/6 health-ok points, finite LA/RA provider-context self `volumeRateMlPerSec` in 6/6, and exact sample flow-balance readback in 6/6. Phase 5AX adds pressure-decomposition debug readbacks: `atrial-pressure-decomposition-phase5ax-result-v1` records 6/6 health-ok points, finite LA/RA passive, active, AV-plane delta, and floor-hit readbacks in 6/6, with passive+active closure exact in 6/6. Phase 5AY implements an off-by-default AtrialPhysiologyBridgeV2/A2 prototype with viscous/conduit, tension-state booster, and AV-plane delta terms and measures it against the A1 refined bridge comparator: all A2 candidates are health-ok in 6/6 HR75/90 preload points with finite contribution readbacks in 6/6, but `atrial-a2-conduit-v1` is only `measured-no-readable-improvement` versus A1 and no candidate produces both-chamber readable loops. Phase 5AZ adds sourced absolute atrial target pack `atrial-waveform-targets-v1` and scores current runtime, A1, and A2 candidates against volume-derived total/passive/active emptying-fraction broad ranges: `atrial-a2-conduit-v1` is the best volume-function candidate and broad-passes both atria at `normal-hr75`, while A1 broad-passes no volume-function point; strain targets are stored but not scored until a wall/AV-plane strain proxy exists. Phase 5BA runs A2 conduit term sensitivity: the `normal-hr75` both-atria volume-function signal is preserved by full A2, no-booster, and no-AV-plane-extra variants, but disappears when the viscous/conduit term is removed; no variant gives envelope-wide both-atria broad-pass or figure-eight acceptance. Phase 5BB factors the A2 reservoir/conduit pressure terms into reusable `atrialReservoirConduitCoupling` infrastructure and confirms A2 conduit still has 6/6 health-ok points with finite, bounded LA/RA contribution readbacks across HR75/90 preload points. Phase 5BC tests valve-diode readability attribution on the same HR75/90 preload envelope and runtime/A1/A2 variant set: `atrial-valve-diode-readability-phase5bc-result-v1` is `supported`, with raw both-chamber readable loops still absent for all variants but hit-only valve-diode pressure interpolation creating both-chamber readability jumps for `a2-conduit-full`, `a2-conduit-no-booster`, and `a2-conduit-no-av-plane-extra`; every variant shows either score-only or readability-jump signal. The context input is an explicit latest-resolved flow-balance estimate to avoid an implicit pressure-flow algebraic loop, and Phase 5BC is only a post-processed diagnostic lens, not a valve model change, bridge selection, or morphology acceptance. LV Land default migration must not wait for atrial figure-eight completion. | owner selection remains pending and oracle selection review remains pending; HR105 runtime/settling boundary can be treated as edge evidence for LV default posture but must be bounded before production atrial bridge selection; existing A1 normalized valve-event contamination and Phase 5.5B isolated sampling-invariance blockers remain selection blockers; refined A1, RA-local soft-sleeve variants, current two-branch-plus-AV-plane candidates, and the first A2 prototype remain unsupported because envelope-wide opposing-lobe readability, high-preload LA sampling roughness, HR90 normal/low settling, hit-rate contamination, strain-proxy scoring, target-wide volume-function passes, and real AV-valve smoothing/complementarity evidence are not solved; A1 must not be treated as final physiology by parameter tuning alone | run a narrow off-by-default AV-valve smoothing or complementarity diagnostic before adding another A2-only gain path; use reusable `atrialReservoirConduitCoupling` from LandAtrial shadow/parameter-pack work; keep A2 off-by-default and do not tune gains from the `normal-hr75` signal alone; keep HR105/120 as edge evidence | final atrial physiology, AF validation, atrial Land/RDQ validation, production atrial bridge wiring, valve/load timing acceptance, LV default migration gating, official morphology acceptance |
| arterial load | Phase 5Y records real AoV qDot raw/post clamp engagement, and Phase 5Z no longer supports short-window denominator amplification as dominant. Phase 5AA adds the offline prescribed-pressure AoV/root inertance bench; Phase 5AB carries the lower-inertance region into closed loop through the existing `AoV_L` effective root-boundary carrier; Phase 5AC computes direct isolated-bench input impedance spectra; Phase 5AD tests selected off-by-default prototype routes; Phase 5AE adds a separated experimental boundary/root inertance hook without topology, state-layout, default-param, or direct `Ao_SA.L` changes. Phase 5AF calibrates total 2x as the preferred sourced-Zc candidate. Phase 5AG reruns that candidate over the full synthetic matrix, Phase 5AH attributes the split, Phase 5AM exposes the sourced total 2x mechanism as an explicit off-by-default runtime candidate through `rootZcMode` plus closure-local base `AoV_L`, and Phase 5AP runs the same mechanism inside the current LV+RV Land default closure. The Phase 5AP live closure result supports user-0 default adoption: 15/15 health-ok candidate comparisons, output-preserved fraction 1, valve/load timing-signal fraction 1, qDot signal fraction 0.466667, zero output/timing-cost points, and zero LV/RV Land solve failures. The runtime default now composes the sourced root/Zc mechanism with closure-local `AoV_L`; explicit current and off-by-default candidate modes remain available, and frozen legacy rollback remains fenced from experimental root/Zc composition. | reflection coefficient remains unavailable/no-proxy; no valve/load timing acceptance; qDot clamp removal remains unsupported; no official morphology acceptance; no direct Ao_SA adoption | use adopted root/Zc as the discharge-path default while keeping valve/load timing acceptance, qDot clamp retirement, and official morphology as separate gates | qDot clamp removal, valve-threshold tuning, valve/load timing acceptance, official morphology, reflection-coefficient claim, and clinical/scientific validation are unclaimed |
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
  `owner-decision-needed`, and the historical note that preceded owner GO.
- Phase 5AK remains `user0-lv-land-default-flip-phase5ak-result-v1`, the
  owner-GO LV-only staged default flip evidence.
- Phase 5AL remains `rv-land-default-candidate-phase5al-result-v1`, the
  measured LV+RV default-candidate evidence that Phase 5AO promotes.
- Phase 5AP remains `runtime-root-zc-live-closure-phase5ap-result-v1`, the
  live LV+RV default closure evidence supporting sourced root/Zc user-0 default
  adoption without qDot clamp removal or official morphology acceptance.
- Phase 5AQ remains `atrial-land-default-candidate-phase5aq-result-v1`, the
  explicit all-chamber Land candidate evidence showing LA/RA provider
  reachability 6/6 and zero LA/RA Land solve failures, but `not-supported`
  because low-preload HR90 hits negative source active-fiber stress.
- Phase 5AR remains `atrial-land-source-stress-attribution-phase5ar-result-v1`,
  the split current/LA-only/RA-only/all-chamber attribution evidence showing
  the low-preload HR90 blocker is RA raw Land source-stress sign behavior before
  the pressure adapter, not LA reachability or Land solver failure.
- Phase 5AS remains `atrial-figure-eight-ra-variant-sweep-phase5as-result-v1`,
  the RA-local refined A1 variant sweep showing soft-sleeve parameters can move
  RA lobe opposition but do not support production bridge selection.
- Phase 5AT remains
  `atrial-figure-eight-av-plane-candidate-phase5at-result-v1`, the explicit
  AV-plane structural candidate diagnostic showing AV-plane-driven reservoir
  mechanics are a useful axis, but the current two-branch plus body-AV-plane
  composition does not support bridge selection.
- Phase 5AU remains
  `atrial-physiology-bridge-v2-contract-phase5au-result-v1`, the A2 readout
  contract showing current default closure exposes LA/RA dV/dt and waveform
  readouts in 6/6 points, while provider pressure calls still lack self
  `volumeRateMlPerSec`.
- Phase 5AW remains `atrial-a2-inputs-phase5aw-result-v1`, the narrow A2
  input-groundwork evidence showing provider pressure calls now receive finite
  LA/RA self `volumeRateMlPerSec` in 6/6 HR75/90 preload points and SimSample
  exposes exact same-sample flow-balance dV/dt readbacks, without implementing
  A2 or selecting an atrial bridge.
- Phase 5AX remains `atrial-pressure-decomposition-phase5ax-result-v1`, the
  pressure-decomposition debug evidence showing LA/RA passive, active, AV-plane
  pressure-delta, and pressure-floor readbacks are finite in 6/6 HR75/90 preload
  points with passive+active closure exact, without implementing A2 or selecting
  an atrial bridge.
- Phase 5AY remains `atrial-a2-prototype-phase5ay-result-v1`, the first
  off-by-default AtrialPhysiologyBridgeV2/A2 prototype evidence. It implements
  viscous/conduit, tension-state booster, and AV-plane delta pressure terms and
  records finite contribution readbacks in 6/6 points for each A2 candidate, but
  the best candidate (`atrial-a2-conduit-v1`) is only
  `measured-no-readable-improvement` versus the A1 refined bridge comparator and
  does not support atrial bridge selection.
- Phase 5AZ remains `atrial-waveform-target-pack-phase5az-result-v1`, the
  sourced absolute atrial target-pack and current-candidate scoring evidence.
  It stores `atrial-waveform-targets-v1` for figure-eight, volume-derived
  reservoir/conduit/booster, pressure-wave timing, and later strain targets.
  Current scoring is volume-derived only: `atrial-a2-conduit-v1` broad-passes
  both atria at `normal-hr75`, A1 broad-passes no volume-function point, and no
  candidate is selected.
- Phase 5BA remains `atrial-a2-sensitivity-phase5ba-result-v1`, the A2 conduit
  term-attribution evidence. The limited `normal-hr75` both-atria
  volume-function signal is preserved by full A2, no-booster, and
  no-AV-plane-extra variants, but disappears when the viscous/conduit term is
  removed. No variant supports envelope-wide A2 selection or figure-eight
  acceptance.
- Phase 5BB remains `atrial-reservoir-conduit-coupling-phase5bb-result-v1`, the
  reusable coupling componentization smoke. It factors the A2 viscous/conduit,
  booster-gate, and AV-plane-extra terms into
  `engine/myocardium/atrialReservoirConduitCoupling.ts` and confirms A2 conduit
  still records finite, bounded LA/RA contribution readbacks in 6/6 HR75/90
  preload points.
- Phase 5BC remains `atrial-valve-diode-readability-phase5bc-result-v1`, the
  valve-diode readability attribution diagnostic. It records `supported`
  post-processed evidence: raw both-chamber readable loops remain absent for all
  runtime/A1/A2 variants, while hit-only valve-diode pressure interpolation creates
  both-chamber readability jumps for `a2-conduit-full`, `a2-conduit-no-booster`,
  and `a2-conduit-no-av-plane-extra`. It does not change the valve model,
  select A2/A1, accept valve/load timing, or accept official morphology.
- Phase 5AV remains
  `atrial-land-ra-source-stress-convention-phase5av-result-v1`, the signed RA
  pressure-adapter candidate evidence showing the nonnegative adapter runtime
  error is removed but low-preload HR90 remains settle-blocked.

## Weekly sync questions

1. Did any lane produce a BLOCKER for another lane?
2. Did any PR strengthen a claim boundary without evidence?
3. Is the next step an experiment or another readiness document?
4. Are we using morphology evidence to tune myocardium parameters? If yes, stop.
5. Are we using myocardium progress to claim product/clinical validity? If yes, stop.

## Current top priorities

1. Land plus sourced root/Zc is now the user-0 staged LV+RV runtime default after
   owner GO and Phase 5AP. Do not delete
   legacy active-stress yet; keep it as frozen reference, debug fallback, and
   rollback while RA/LA chamber-replacement lanes advance separately.
2. Phase 5AV moved the RA blocker from nonnegative-adapter runtime error to
   low-preload HR90 settling under signed RA pressure adaptation. Do not treat
   signed adaptation as all-chamber support, and do not solve this by
   source-stress clamping, Tref/source-calcium tuning, qDot/valve tuning,
   root/Zc re-litigation, official case tuning, or legacy deletion.
3. Keep Phase 5AP bounded: it supports user-0 root/Zc default adoption, but it
   does not unlock qDot clamp removal, valve/load timing acceptance, official
   morphology, reflection coefficients, or clinical/scientific validation.
4. Advance atrial figure-eight work in a separate lane at HR75/90 normal and
   preload envelopes. Phase 5AS and 5AT show parameter-only RA soft-sleeve
   tuning and current two-branch-plus-AV-plane composition are insufficient for
   selection; Phase 5AU records the A2 readout contract, Phase 5AW adds the self
   `volumeRateMlPerSec` provider input, Phase 5AX adds pressure-decomposition
   debug output, Phase 5AY implements the first A2 prototype, Phase 5AZ adds
   sourced absolute atrial waveform/function targets plus volume-derived scoring,
   Phase 5BA attributes the limited A2 conduit signal to the viscous/conduit
   term rather than booster or AV-plane-extra terms, and Phase 5BB factors those
   terms into reusable coupling infrastructure. Phase 5BC supports valve-diode
   contamination as a likely current readability limiter by post-processed
   valve-hit cleanup, so the next atrial-morphology experiment should be a
   narrow off-by-default AV-valve smoothing/complementarity diagnostic before
   another A2-only gain path. A2 still has no selection claim; use the target
   pack and reusable coupling from LandAtrial shadow work rather than tuning by
   visual loop shape alone. A1 is a diagnostic bridge, not the final model; the
   forward physiology direction is reusable AV-plane reservoir coupling plus
   LandAtrial parameter-pack shadow work. Treat HR105/120 as edge evidence, not
   as an LV Land default gate.
5. Keep provider-local SDIRK2 solver hardening narrow; Phase 5C-R did not unlock
   alternans-finality claim.
6. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
7. Keep official cases at smoke/teaching-surface level until closures stabilize.
8. Keep Studio/Workbench mock work owner-led and separate from scientific
   acceptance.
