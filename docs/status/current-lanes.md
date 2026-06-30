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

Oracle GPT Pro/extended direction checks are now disabled by owner instruction
after Phase 5BF started. Do not run broad oracle direction reviews for forward
myocardium/atrial phases; use local measured evidence, code review, and owner
instructions instead. Historical oracle checkpoints remain recorded below only
as context, not as a future cadence.
The broad oracle checkpoint after Phase 5AT/PR #250 supported treating LV+RV
Land plus sourced root/Zc as the user-0 staged default baseline, then moving the
main model work to RA source-stress convention and AtrialPhysiologyBridgeV2/A2
without bundling all-chamber default, atrial figure-eight selection, official
case tuning, qDot clamp retirement, legacy deletion, or root/Zc re-litigation
into one gate.
The broad oracle checkpoint after PR #260 reinforced the same split: keep
LV+RV Land plus sourced root/Zc as the staged default floor, keep legacy
active-stress as frozen rollback/reference, do not broaden default scope yet,
and move atrial work from A1/A2 gain exploration toward LandAtrial shadow,
wall/AV-plane strain-proxy scoring, and narrow signed-RA low-preload HR90
settling attribution.

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

After the Phase 5BK/5BL LandAtrial staged-default floor, do not continue
LandAtrial parameter tuning against a single combined target-distance score
while raw education-visible morphology is failing. Phase 5BN introduces a
reusable deterministic morphology check layer for the live raw traces:
LV/RV/LA/RA PV loops, MVF/TVF, and LAP/RAP timing. Workbench, CI/artifact
runners, future preset/case/lesson validation, and subagent summaries should
all consume this same JSON. Subagents may explain likely causes, but pass/fail
comes from the deterministic checker, not screenshot eyeballing. Treat current
double-humped systolic PV-loop limbs, tri-peaked MVF, abnormal LAP shape, and
early LA kick as checker failures to localize before further atrial tuning.
Also keep the live runtime closure honest: runtime parameter patches such as
LandAtrial AV-plane geometry must survive live `setImmediateParameters()`
updates unless the caller explicitly overrides a leaf. Phase 5BN locks that
patch-persistence behavior and adds a runtime LandAtrial AV-lead regression
test, avoiding a second phase shift unless measured evidence shows one is
needed.
Phase 5BO then runs the same checker over a closure ablation matrix and records
that the gross LV systolic dome and MVF third-wave failures are not primarily
root/Zc adoption or LandAtrial AV-plane gain. LV-only Land with legacy RV/atria
already reproduces both failures, while frozen legacy keeps LV/RV PV plus MVF
OK. Treat the next fix lane as LV Land plus valve/load/filling coupling, and
treat LAP/RAP pressure timing as a separate checker-hygiene gap because frozen
legacy also fails the current pressure-extrema rule.
Phase 5BP extends that localization to bilateral ventricular Land plus
valve/load coupling. LV-only Land reproduces the LV double dome and MVF third
wave, RV-only Land reproduces the RV double dome, SDIRK2 and a simple
`lambdaAct` kinematics readback do not remove the gross failures, and a
no-zeta-drive diagnostic removes LV/RV PV double domes only by breaking AV
inflow morphology/output. Do not tune LandAtrial, qDot, valves, root/Zc, Tref,
or source-stress to hide this. The next model fix should bound or stage
ventricular Land velocity/length coupling under valve-load transitions.
Phase 5BQ then applies the morphology checker over a representative
normal-sinus knob envelope (HR75/90, preload low/high, systemic/pulmonary
afterload high, contractility low/high). It records that current user-0
all-chamber LandAtrial gross LV/RV PV plus MVF/TVF morphology passes 0/8
points, a filtered-`lambdaAct` ventricular tau candidate with legacy atria
improves the normal point but is not envelope-robust (4/8), the best
all-chamber tau plus AV-plane ablation only passes 2/8, and the off-by-default
valve/load staged strain-rate candidate is not supported. Do not adopt these
normal-point fixes as runtime defaults. Future case/preset fitting requires a
robust morphology envelope, not just a clean normal screenshot.
Phase 5BR separates Land length from zeta velocity drive and tests an
off-by-default stateful ventricular zeta-drive coupler over the same envelope.
It improves the normal point and some LV/RV PV failures, but all-chamber
gross morphology still only reaches 3/8 and depends on AV-plane-off rescue.
This is not robust enough for preset/case fitting, so no default adoption is
supported; the next implementation surface is DynamicValveTransitionV1 plus
LandAtrial AV-plane/effective-wall release timing, not more single-point Land
parameter tuning.
Phase 5BS tests an off-by-default openness-scaled valve diode smoothing path
over the same envelope. Current user-0 remains 0/8 gross pass, stateful zeta
with current LandAtrial remains 0/8, MV/TV or all-valve openness-scaled
reverse-flow smoothing remains 0/8 with current AV-plane geometry, and the best
candidate reaches only 3/8 by turning LandAtrial AV-plane off. Do not adopt
this smoothing path; use it as evidence to stop tau/limiter/smoothing sweeps
and run a ventricular SeriesElasticV1 prescribed-volume bench before runtime
adoption. Keep DynamicValveTransitionV1 as the residual-fix surface if series
elasticity leaves AV inflow transition artifacts, and keep LandAtrial
AV-plane/effective-wall release timing separate.
Phase 5BT adds the ventricular SeriesElasticV1 isolated bench using live
current user-0 `LVFiberLambda`/`RVFiberLambda` traces as prescribed
positive-control inputs. The current no-SE live stress has double-peak
transmitted stress in 11/14 measured LV/RV point traces; normal-HR90 live
traces are unavailable because the current closure does not settle under the
fitFast extraction. No-zeta and filtered-lambda synthetic replay do not
reproduce the isolated stress double peak, but this is not source-state
controlled against the live stress trace and prior closed-loop evidence shows
those approaches break AV inflow/output. The best SeriesElasticV1 candidate
(`k=0.6MPa`, no damping) keeps bounded energy and force-balance mismatch but
only reduces double peaks in 7/14 measured traces, so it is inconclusive rather
than a standalone runtime adoption candidate.
Carry the live-user0 prescribed-lambda harness forward as the positive-control
local bench, keep SeriesElasticV1 as a possible component, and move the next
structural experiment to a fuller DynamicValveTransitionV1/MV-AoV local
valve/load bench before reopening LandAtrial AV-plane/effective-wall release
timing.
Phase 5BU runs that fuller local valve/load bench as
`dynamic-valve-local-bench-phase5bu-result-v1`, replaying MV/AoV plus mirrored
TV/PV pressure-flow traces from the current user-0 all-chamber LandAtrial +
sourced-root/Zc closure. Live AV extra-wave burden is 9/14 measured AV valve
runs. The best local replay candidate
`delayed-close-hysteretic-area-soft-reverse` reduces extra AV waves in only
2/14 AV valve runs (MV 0/7; TV 2/7), preserves forward volume in 27/28 valve
runs, and is adverse-gradient-flow clean in only 4/28. The standalone local
DynamicValveTransitionV1 path is therefore not supported for runtime wiring,
MVF repair, or closed-loop morphology acceptance. Treat SeriesElasticV1 and
DynamicValveTransitionV1 as possible components, not standalone fixes; the next
structural experiment should move up to a local LV subsystem bench that couples
chamber pressure, MV/AoV flow, zeta/SeriesElastic components, and 2-3 correction
iterations before any full runtime adoption.

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
  provisional integration path when measured evidence and owner instruction
  support it.
  Treat E0/time-varying atrial elastance as a negative control, A0 as frozen
  comparator/fallback, A1 as a diagnostic bridge rather than final physiology,
  AV-plane reservoir coupling as a common mechanism for bridge and LandAtrial
  paths, and LandAtrial with atrial parameter packs as the final active-mechanics
  target.
- A1/A2 are frozen diagnostic scaffolds/comparators. Forward LandAtrial work
  must run against `LandAtrialDefaultFloorV1`, the Phase 5BM isolated bench,
  and the Phase 5BN reusable morphology checker before claiming improvement.
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

### Phase 5BU Gross Morphology Override

Phase 5BU supersedes the lane-table "DynamicValveTransitionV1 next" wording
below. It records `dynamic-valve-local-bench-phase5bu-result-v1`, a local
pressure-flow replay bench over the current user-0 all-chamber LandAtrial +
sourced-root/Zc closure. It includes MV/AoV and mirrored TV/PV readbacks because
the owner observed RV PV-loop failure too, but it remains a local valve/load
diagnostic rather than a runtime model change. Live source AV extra-wave burden
is 9/14 measured AV valve runs. The best local replay candidate
`delayed-close-hysteretic-area-soft-reverse` reduces extra AV waves in only
2/14 AV valve runs (MV 0/7; TV 2/7), preserves forward volume in 27/28 valve
runs, and is adverse-gradient-flow clean in only 4/28. Therefore standalone
local DynamicValveTransitionV1 is not supported for runtime wiring, MVF repair,
or closed-loop morphology acceptance.

Next gross morphology work should move up one coupling level: build a local LV
subsystem bench that updates chamber pressure, MV/AoV flow, ventricular
zeta/SeriesElastic components, and 2-3 Picard-style corrections in the same
step, then mirror to RV only if the left-sided subsystem earns it. Keep
SeriesElasticV1 and DynamicValveTransitionV1 as possible components, not
standalone fixes. Keep LandAtrial AV-plane/effective-wall release timing
separate until LV/RV PV plus MVF/TVF are robust, and do not reopen A1/A2,
LandAtrial tuning, qDot/rootZc, Tref, source-stress, valve-threshold tuning, or
normal-only patches to hide the ventricular gross morphology blocker.

## Lane table

| Lane | Current state | Current blocker | Next experiment | Must not claim |
|---|---|---|---|---|
| myocardium | Phase 5AK implements the owner-GO user-0 staged LV Land runtime selection. Phase 5AL measures explicit LV+RV Land default-candidate evidence. Phase 5AO promotes that measured path to the user-0 staged LV+RV runtime default: `lv-rv-land-default-flip-phase5ao-result-v1` records 5/5 default smoke points settled and health-ok, zero LV/RV Land solve failures, both providers and sidecars present at every default point, 5/5 previous LV-only points still RV-provider-free when requested explicitly, and 5/5 legacy rollback points provider-free and non-failed. Phase 5AP then adopts the sourced total 2x root/Zc boundary/root mechanism for the LV+RV runtime default after live-closure evidence; preview, transition-steady, and Guyton/Starling runtime surfaces resolve LV+RV Land plus adopted root/Zc through `createModelCoreRuntimeExperimentalOptions()` by default, while `runScenario`, `runToPeriodicSteady`, and the bare `ModelCore` constructor remain frozen legacy reference paths unless an explicit `runtimeActiveSourceMode` is passed. The LV/RV default uses normalized chamber-default calcium-input user-control references, not Tref/source-stress tuning. Phase 5AQ adds an explicit all-chamber Land candidate and fixes/audits atrial Land source strain to use the same AV-plane-adjusted pressure-adapter lambda as atrial pressure assembly. The candidate reaches LA/RA providers in 6/6 HR75/90 preload points with zero LA/RA Land solve failures, but remains `not-supported` because `low-preload-hr90` fails with `source active-fiber stress must be nonnegative`. Phase 5AR attributes that blocker: LA-only Land is health-ok in 6/6, while RA-only and all-chamber fail only at low-preload HR90 because raw RA Land source stress goes slightly negative before the pressure adapter (`-1.490128` to `-1.64698` Pa). Phase 5AV tests a signed RA pressure-adapter candidate: the current RA nonnegative control reproduces the low-preload HR90 runtime error, while signed RA-only and all-chamber candidates remove runtime errors and reach 5/6 measured health-ok points but still cap at low-preload HR90. Phase 5BP records that LV/RV Land gross morphology failures are not resolved by SDIRK2 or a simple filtered-`lambdaAct` adapter, and that no-zeta-drive is only a diagnostic ablation because it fixes PV double domes while breaking AV inflow/output. Phase 5BQ tests filtered-`lambdaAct` tau, AV-plane gain ablations, and an off-by-default valve/load staged strain-rate provider over an HR/preload/afterload/contractility envelope; normal-point improvements are not envelope-robust, best all-chamber pass is only 2/8, and no runtime adoption is supported. Phase 5BR adds an off-by-default stateful zeta-drive coupler that preserves raw length while bounding only Land zeta velocity drive; it improves normal-point LV/RV morphology but still fails the all-chamber envelope (best 3/8 and AV-plane-off-dependent). Phase 5BS adds an off-by-default openness-scaled valve diode smoothing diagnostic; current-AV-plane all-chamber candidates remain 0/8 and the best 3/8 rescue requires AV-plane off, so no runtime adoption is supported. Phase 5BT records inconclusive isolated SeriesElasticV1 evidence, and Phase 5BU records not-supported standalone DynamicValveTransitionV1 local valve/load evidence. Legacy active-stress is not deleted. | Legacy active-stress deletion, all-chamber atrial physiology acceptance, official case reauthoring, state-schema migration, Level 3/4 acceptance, official morphology, structural alternans removal, alternans-finality claim, direct Ao_SA adoption, AoV-boundary carrier adoption, reflection-coefficient claim, valve/load candidate timing acceptance, qDot clamp removal, accepted preload/venous/passive/geometry/source-calcium tuning, Tref fudge, Land parameter tuning, source-stress scaling, source-stress clamping, global zeta-disablement, openness-scaled valve smoothing adoption, standalone SeriesElasticV1 adoption, standalone DynamicValveTransitionV1 adoption, and morphology-by-valve/qDot/root retuning remain blocked; signed RA source-stress pressure adaptation is candidate-only and low-preload HR90 settle-blocked; arterial load, valve/load, classifier/window, PVein_LA/filling-inertance, atrial filling, valve transition dynamics, and RA/LA chamber-replacement lanes remain separate | build a local LV subsystem bench that couples chamber pressure, MV/AoV flow, zeta/SeriesElastic components, and 2-3 correction iterations; mirror to RV only after the left-sided subsystem earns it; keep LandAtrial AV-plane/effective-wall release timing separate; keep Phase 5BR/5BS/5BT/5BU mechanisms as diagnostic/component evidence unless a later composition passes the full envelope | alternans finality, official morphology, atrial physiology acceptance, source-stress clamp/tuning, global zeta disablement, qDot clamp removal, valve/load timing acceptance, and clinical/scientific validation are not claimed |
| morphology | Phase M1 records `morphology-blocker-bundle-phase-m1-result-v1`; Phase 5X-5Z localize the LV qDot morphology blocker to real AoV/root discharge engagement rather than a dominant short-window denominator artifact. Phase 5AA records an offline prescribed-pressure arterial root inertance bench, Phase 5AB carries the lower-inertance region into closed loop, Phase 5AC adds direct isolated-bench input impedance spectra, Phase 5AD tests selected off-by-default prototype routes, Phase 5AE carries the AoV-boundary signal into a separated experimental boundary/root inertance hook, Phase 5AF sources the total 2x AoV/root candidate as the only preferred/broad Zc-range candidate, Phase 5AG shows closed-loop qDot+timing signal in 18/28 measured-health-ok comparisons, Phase 5AH attributes the weaker Land qDot headline to output-preserved but below-threshold qDot reductions rather than solve/output failure, Phase 5AI bounds the Land normal-floor LVEDP excess as passive-proxy/source-sensitivity diagnostic evidence rather than morphology acceptance, and Phase 5AP supports adopting the sourced total 2x root/Zc candidate in the live LV+RV default closure with 15/15 health-ok comparisons, output-preserved fraction 1.0, timing-signal fraction 1.0, qDot-signal fraction 0.466667, and zero output/timing-cost points. Phase 5BN adds a reusable raw-trace morphology checker and Workbench badge for LV/RV/LA/RA PV loops, MVF/TVF, and LAP/RAP timing; it records current education-visible failures rather than tuning them away. Phase 5BO records `morphology-attribution-phase5bo-result-v1`: root/Zc current-vs-sourced and LandAtrial AV-plane-off ablations do not remove the gross LV PV/MVF failures, while LV-only Land with legacy RV/atria reproduces them and frozen legacy keeps LV/RV PV plus MVF OK. Phase 5BP records `ventricular-land-valve-load-morphology-phase5bp-result-v1`: LV-only Land reproduces LV double-dome plus MVF third-wave failures, RV-only Land reproduces RV double-dome failure, SDIRK2 and filtered-lambda diagnostics do not fix them, and no-zeta-drive fixes PV double domes only by breaking AV inflow morphology/output. Phase 5BQ records `ventricular-land-velocity-coupling-phase5bq-result-v1`: current user-0 gross morphology passes 0/8 representative points, filtered-`lambdaAct` tau with legacy atria improves normal but not the envelope, all-chamber AV-plane off/mid candidates only pass 2/8, and staged strain-rate coupling is not supported. Phase 5BR records `ventricular-land-kinematics-coupler-phase5br-result-v1`: stateful zeta-drive improves LV/RV PV normal points but all-chamber current AV-plane remains 0/8 and AV-plane-off rescue is only 3/8. Phase 5BS records `dynamic-valve-transition-phase5bs-result-v1`: openness-scaled MV/TV or all-valve diode smoothing does not improve current-AV-plane all-chamber gross pass beyond 0/8; the best candidate is AV-plane-off-only at 3/8, so smoothing is not accepted. Phase 5BT records inconclusive SeriesElasticV1 isolated evidence, and Phase 5BU records not-supported standalone DynamicValveTransitionV1 local valve/load evidence: live AV extra-wave burden is 9/14, best local replay reduces only 2/14 AV extra-wave runs (MV 0/7; TV 2/7), and adverse-gradient-flow clean/readback count is only 4/28. Filling comparator evidence remains 39/42 interpretable; the residual gap is `lv-failure-dobutamine` branch 1 RV beats 1-3 missing only `eaLikeInflowProxy`. | residual dobutamine RV E/A-like proxy gap; reflection coefficient remains unavailable/no-proxy; valve/load timing acceptance missing; qDot clamp removal remains unsupported; raw LV/RV systolic domes and AV inflow artifacts now require a robust envelope fix rather than normal-point tuning; stateful zeta-drive alone is insufficient; openness-scaled diode smoothing is insufficient; standalone SeriesElasticV1 is inconclusive; standalone DynamicValveTransitionV1 is not supported; LandAtrial AV-plane/effective-wall release timing contributes to MVF/TVF residuals but simple gain off/mid is not robust; global zeta disablement is not acceptable; LAP/RAP pressure timing needs checker-hygiene split because legacy also fails the current pressure-extrema rule; accepted passive/source tuning remains blocked | use Phase 5BN checker as the common UI/CI/subagent/case-validation surface; next fix should build a local LV subsystem bench coupling chamber pressure, MV/AoV flow, zeta/SeriesElastic components, and 2-3 correction iterations before closed-loop runtime shadow; keep PVein_LA/filling inertance plus atrial LandAtrial calibration separate from LV/RV gross morphology repair | no official morphology, qDot clamp removal, valve/load timing acceptance, atrial physiology acceptance, global zeta-disablement, openness-scaled smoothing adoption, standalone SeriesElasticV1 adoption, standalone DynamicValveTransitionV1 adoption, or clinical/scientific validation is claimed |
| atrial bridge | Historical E0/A0/A1 and A2 bridge evidence remains pinned below. A1/A2 are now frozen diagnostic scaffolds/comparators, not forward selection candidates. Phase 5BK promotes all-chamber LandAtrial (`landatrial-runtime-candidate-la22-ra26`) to the user-0 staged runtime default with 6/6 health-ok/output-preserved HR75/90 preload points and zero LA/RA Land solve failures. Phase 5BL records `LandAtrialDefaultFloorV1` as the standing comparison floor and multi-objective dashboard: raw LA/RA readability is 6/6, both-atria volume-function broad-pass remains limited to `normal-hr75` and `normal-hr90`, and direct wall-strain broad-pass remains 0/6. Phase 5BM adds an isolated prescribed-volume LandAtrial bench with LA/RA AV-plane on/off comparisons and zero Land solve failures. Phase 5BN freezes further LandAtrial parameter tuning until the reusable morphology checker is in place and reporting raw LAP/LA-kick, MVF/TVF, and PV-loop failures. Phase 5BO shows the current MVF third wave is not removed by disabling LandAtrial AV-plane gain and is reproduced by LV-only Land. Phase 5BP extends that to RV: gross LV/RV PV and MVF failures belong to ventricular Land plus valve/load/filling coupling before atrial parameter tuning. Phase 5BQ shows that after LV/RV filtered-lambda tau normal-point repair, LandAtrial AV-plane off/mid can remove normal MVF failure but is not robust over preload/afterload/contractility, so simple AV-plane gain reduction is not accepted. Phase 5BS shows openness-scaled valve smoothing still leaves current AV-plane all-chamber gross pass at 0/8, while the best 3/8 candidate requires AV-plane off. Phase 5BU confirms that standalone local valve-transition replay is also not enough, so LandAtrial AV-plane/effective-wall release timing stays paused behind the LV/RV gross morphology subsystem blocker. | atrial physiology acceptance remains blocked by direct wall-strain distance, incomplete volume-function envelope pass, valve-diode measurement hygiene, raw pressure timing failures, robust AV-plane/effective-wall release timing, and literature-calibrated isolated/closed-loop calibration evidence; HR105/120 remains edge evidence; no oracle direction checks | pause single-score LandAtrial tuning; after a local LV/RV subsystem bench earns robust PV-loop plus MVF/TVF morphology, redesign/measure AV-plane/effective-wall release timing against the morphology envelope using `LandAtrialDefaultFloorV1` plus the Phase 5BM isolated bench; keep A1/A2 frozen | final atrial physiology, AF validation, valve/load timing acceptance, qDot clamp removal, legacy deletion, official morphology acceptance, and clinical/scientific validation |
| arterial load | Phase 5Y records real AoV qDot raw/post clamp engagement, and Phase 5Z no longer supports short-window denominator amplification as dominant. Phase 5AA adds the offline prescribed-pressure AoV/root inertance bench; Phase 5AB carries the lower-inertance region into closed loop through the existing `AoV_L` effective root-boundary carrier; Phase 5AC computes direct isolated-bench input impedance spectra; Phase 5AD tests selected off-by-default prototype routes; Phase 5AE adds a separated experimental boundary/root inertance hook without topology, state-layout, default-param, or direct `Ao_SA.L` changes. Phase 5AF calibrates total 2x as the preferred sourced-Zc candidate. Phase 5AG reruns that candidate over the full synthetic matrix, Phase 5AH attributes the split, Phase 5AM exposes the sourced total 2x mechanism as an explicit off-by-default runtime candidate through `rootZcMode` plus closure-local base `AoV_L`, and Phase 5AP runs the same mechanism inside the current LV+RV Land default closure. The Phase 5AP live closure result supports user-0 default adoption: 15/15 health-ok candidate comparisons, output-preserved fraction 1, valve/load timing-signal fraction 1, qDot signal fraction 0.466667, zero output/timing-cost points, and zero LV/RV Land solve failures. The runtime default now composes the sourced root/Zc mechanism with closure-local `AoV_L`; explicit current and off-by-default candidate modes remain available, and frozen legacy rollback remains fenced from experimental root/Zc composition. | reflection coefficient remains unavailable/no-proxy; no valve/load timing acceptance; qDot clamp removal remains unsupported; no official morphology acceptance; no direct Ao_SA adoption | use adopted root/Zc as the discharge-path default while keeping valve/load timing acceptance, qDot clamp retirement, and official morphology as separate gates | qDot clamp removal, valve-threshold tuning, valve/load timing acceptance, official morphology, reflection-coefficient claim, and clinical/scientific validation are unclaimed |
| studio/product | AI-native physiology studio direction proposed; owner is leading Studio/Workbench mock work outside this lane | MVP scope can grow too large | owner-led Home + Cases + static/mock Workbench | model validation, scientific acceptance |

### Atrial Lane Override After Phase 5BK

The atrial table row preserves historical A1/A2 evidence, but the forward lane
state is now narrower by owner instruction: A1 and A2 are frozen as diagnostic
scaffolds/comparators, not selection candidates. Do not run further A1/A2 gain
sweeps or oracle direction checks. The active atrial implementation path is
LandAtrial shadow with atrial parameter packs, signed atrial pressure-adapter
semantics, and AV-plane/effective wall-geometry readbacks. Phase 5BF is the
first shadow baseline; Phase 5BG attributes its settle boundary without tuning:
LA-only signed LandAtrial measures all HR75/90 preload points, while RA-only
and LA+RA signed LandAtrial fail to settle at `high-preload-hr90` with zero
Land solver failures. Treat this as a RA-dominant LandAtrial settling boundary
for calibration/geometry, not as A1/A2 selection, all-chamber default support,
or atrial physiology acceptance. Phase 5BH then promotes the conservative
desensitized RA LandAtrial shadow pack: the promoted current LA+RA LandAtrial
shadow pack measures all 6 HR75/90 normal/low/high preload points with output
preserved and zero Land solve failures. Phase 5BI scores that promoted
LandAtrial shadow pack against the sourced atrial volume/function target pack
and direct wall-lambda strain readbacks: the promoted pack remains 6/6
health-ok and output-preserved with zero Land solve failures, is the best
combined-distance candidate versus current runtime and no-AV-plane ablation,
and AV-plane enabled lowers combined direct target distance relative to
no-AV-plane ablation. This is target-scoring evidence only; direct
wall/AV-plane geometry calibration remains ahead, and it does not accept
atrial physiology, all-chamber runtime default, A1/A2 selection, official
morphology, valve/load timing, or AF validation.
Phase 5BJ then scouts LandAtrial AV-plane/effective wall-geometry candidates
without changing Land source parameters, A1/A2, valves, qDot, root/Zc, or Tref:
all seven candidates measure 6/6 health-ok and output-preserved points with
zero Land solve failures. The best combined-distance scout candidate is
`landatrial-avplane-high-la20-ra24`, which lowers the mean combined
volume-plus-direct-wall-strain target distance versus current geometry
(0.468153 vs 0.51093) and gives 6/6 raw readable diagnostic points, but it
loses one both-atria volume-function broad-pass point. Treat it as the next
LandAtrial shadow geometry input to rerun/confirm, not as parameter-pack
promotion, physiology acceptance, all-chamber default support, or official
morphology.
Phase 5BK reruns that path as a larger user-0 staged-default preflight and
promotes all-chamber LandAtrial to the runtime default. The selected candidate
is `landatrial-runtime-candidate-la22-ra26`: it measures 6/6 health-ok and
output-preserved HR75/90 normal/low/high preload points, records zero LA/RA
Land solve failures, lowers mean combined volume-plus-direct-wall-strain target
distance versus current LandAtrial geometry (0.453083 vs 0.51093), and keeps
both-atria volume-function broad-pass count unchanged while improving raw
readable diagnostic count by one. Runtime surfaces that use
`createModelCoreRuntimeExperimentalOptions()` now resolve LV+RV+LA+RA Land plus
sourced root/Zc by default, with Phase 5BK AV-plane effective wall-geometry
overrides applied through `runtimeParameterPatch`. This is a user-0 staged
default only: it does not accept atrial physiology, official morphology,
valve/load timing, AF validation, qDot clamp removal, legacy deletion, or
clinical/scientific validation. A1/A2 remain frozen diagnostic
scaffolds/comparators.
Phase 5BL fixes this as `LandAtrialDefaultFloorV1` and records
`landatrial-default-floor-phase5bl-result-v1`, a standing multi-objective
dashboard built from the Phase 5BK measurements without rerunning closed-loop
simulation. The floor passes health/output (6/6 measured, health-ok, and
output-preserved; zero LA/RA Land solve failures), has raw LA/RA readability
in 6/6 points, has both-atria volume-function broad-pass only at
`normal-hr75` and `normal-hr90`, and has no both-atria direct-wall-strain
broad-pass points. Treat direct wall strain plus AV-plane/effective geometry as
the next calibration gap. Continue from this floor; do not reopen A1/A2 gain
sweeps, oracle direction checks, qDot/rootZc tuning, valve-threshold tuning,
Tref/source-stress scaling, or official-case tuning to buy atrial morphology.
Phase 5BM adds `landatrial-isolated-bench-phase5bm-result-v1`, an isolated
prescribed-volume LandAtrial bench over LA/RA with AV-plane floor on/off. It
records zero Land provider solve failures in all four isolated runs and shows
AV-plane coupling lowers minimum atrial pressure while increasing loop area in
the prescribed normal-HR75 waveform. Use this as the next calibration surface
before closed-loop atrial parameter changes; it is diagnostic only and does not
accept atrial physiology or morphology.
Phase 5BN responds to live Workbench morphology failures observed in the
user-0 staged default: double-humped LV systolic PV-loop morphology, tri-peaked
MVF, abnormal LAP shape, and early LA kick. It adds a reusable deterministic
morphology checker (`morphology-check-v1`) and Workbench header badge over raw
live samples, plus explicit `verifyBaseline --runtime=user0|legacy|none`
wiring so verification can inspect the same closure as the UI. It fixes live
runtime parameter-patch persistence so the Phase 5BK LandAtrial AV-plane
geometry patch is not lost during preview updates, and it protects runtime
LandAtrial AV-lead responsiveness with a regression test rather than adding a
second atrial phase correction. This is primarily a quality/localization
surface, not a model fix: current failures should guide the next
localization/fix phase, and LandAtrial parameter tuning should not proceed by
single-score target-distance improvement while these raw morphology checks
fail.
Phase 5BO records `morphology-attribution-phase5bo-result-v1`, an eight-variant
ablation matrix over the same checker: user-0 default, root/Zc current
ablation, LandAtrial AV-plane-off ablation, LV+RV Land with legacy atria under
sourced/current root/Zc, LV-only Land with legacy RV/atria under sourced/current
root/Zc, and frozen legacy rollback. It classifies the LV double dome as
`lv-land-valve-load-associated` and the MVF third wave as
`lv-land-filling-coupling-associated`: LV-only Land reproduces both failures,
root/Zc current-vs-sourced does not remove them, AV-plane-off does not remove
MVF, and frozen legacy keeps LV/RV PV plus MVF OK. LAP/RAP pressure timing is
`not-specific-to-landatrial` because frozen legacy also fails the current
pressure-extrema rule. This is diagnostic only and does not accept morphology,
valve/load timing, atrial physiology, qDot clamp removal, or clinical/scientific
validation.
Phase 5BP records
`ventricular-land-valve-load-morphology-phase5bp-result-v1`, a bilateral
ventricular Land valve/load diagnostic over frozen legacy, user-0 default,
LV-only, RV-only, LV+RV, SDIRK2, filtered-lambda, and no-zeta-drive variants.
It classifies LV PV and RV PV failures as `legacy-ok-land-be-and-sdirk2-fail`,
MVF as `lv-land-associated`, SDIRK2 as
`not-effective-with-solver-failures`, filtered lambda kinematics as
`not-effective`, and zeta velocity drive as a PV double-dome contributor whose
global removal breaks AV inflow/output. Treat this as a model-fix handoff for
ventricular Land velocity/length coupling under valve-load transitions, not as
a reason to resume LandAtrial target-distance tuning.

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
- Phase 5BD remains `atrial-av-valve-smoothing-phase5bd-result-v1`, the
  off-by-default MV/TV soft-floor smoothing diagnostic. It records
  `not-supported`: both soft-floor closures reduce valve diode impulse and keep
  18/18 runs health-ok with bounded AV regurgitation, but neither creates raw
  both-chamber readable loops. It does not adopt valve smoothing, accept
  valve/load timing, select A2/A1, remove qDot clamps, or accept official
  morphology.
- Phase 5BE remains `atrial-strain-proxy-scoring-phase5be-result-v1`, the
  cuberoot-volume wall-strain proxy scoring bridge. It ranks the current
  runtime atrial path as the lowest combined volume+strain-distance baseline,
  records no both-atria strain-proxy pass for any runtime/A1/A2 candidate, and
  does not directly validate atrial strain, select A1/A2, or accept morphology.
- Phase 5BF remains `atrial-land-shadow-phase5bf-result-v1`, the first
  LandAtrial shadow baseline. It adds a reusable atrial-calibrated Land
  parameter pack, signed atrial pressure-adapter provider, and direct AV-plane
  effective wall-geometry readbacks. All-chamber LandAtrial shadow has zero
  runtime errors and 6/6 health-ok points over HR75/90 normal/low/high preload,
  but it remains `landatrial-shadow-partial-settle-blocked` because
  `high-preload-hr90` is settle-failed. It does not select A1/A2, does not
  accept atrial physiology, and does not flip all-chamber default.
- Phase 5BG remains
  `atrial-land-shadow-settling-attribution-phase5bg-result-v1`, the first
  LandAtrial settling-attribution pass after A1/A2 freeze. It keeps the same
  HR75/90 normal/low/high preload envelope and records a
  `ra-dominant-landatrial-settling-boundary`: LA-only signed LandAtrial measures
  6/6 points, RA-only and LA+RA signed fail only at `high-preload-hr90`, current
  all-chamber nonnegative control still runtime-errors at `low-preload-hr90`,
  and Land solver failures remain zero. It does not tune or accept atrial
  physiology, default all chambers, select A1/A2, or change qDot/root/Zc/valves.
- Phase 5BK remains `landatrial-runtime-candidate-phase5bk-result-v1`, the
  user-0 staged all-chamber LandAtrial default promotion evidence. It records
  `landatrial-runtime-candidate-la22-ra26` as the best/recommended candidate,
  6/6 health-ok and output-preserved measured points, zero LA/RA Land solve
  failures, mean combined target distance 0.453083 versus 0.51093 for current
  geometry, and claim boundary
  `landatrial-runtime-candidate-user0-staged-default-no-physiology-acceptance`.
  It does not accept atrial physiology, official morphology, valve/load timing,
  AF validation, qDot clamp removal, root/Zc retuning, or clinical/scientific
  validation.
- Phase 5BL remains `landatrial-default-floor-phase5bl-result-v1`, the
  `LandAtrialDefaultFloorV1` dashboard. It reuses Phase 5BK measurements,
  records 6/6 health/output floor pass and zero LA/RA Land solve failures,
  keeps A1/A2 frozen, and identifies direct wall strain plus AV-plane/effective
  geometry as the next calibration gap without accepting atrial physiology.
- Phase 5BM remains `landatrial-isolated-bench-phase5bm-result-v1`, the first
  isolated prescribed-volume LandAtrial bench after the default floor. It runs
  LA/RA with AV-plane floor on/off, records zero Land solve failures, and
  separates atrial muscle/effective-geometry signals from closed-loop valve,
  root/Zc, and preload effects.
- Phase 5BP remains
  `ventricular-land-valve-load-morphology-phase5bp-result-v1`, the bilateral
  ventricular Land valve/load diagnostic. It records that LV-only Land
  reproduces LV PV double-dome plus MVF third-wave failures, RV-only Land
  reproduces RV PV double-dome failure, SDIRK2 and filtered-lambda diagnostics
  do not fix the gross morphology, and no-zeta-drive is diagnostic-only because
  it fixes PV domes while breaking AV inflow/output.
- Phase 5BH remains `ra-landatrial-calibration-scout-phase5bh-result-v1`, the
  RA LandAtrial calibration scout and shadow-pack promotion. It adds a reusable
  LandAtrial parameter-set variant helper, compares RA Ca-sensitivity/kinetics
  and AV-plane-gain candidates without A1/A2, qDot, root/Zc, valve, Tref, or
  source-stress tuning, and promotes the conservative desensitized RA shadow
  parameter pack. The promoted current LA+RA LandAtrial shadow pack is supported
  over 6/6 HR75/90 preload points with health/output preserved and zero Land
  solve failures. It does not flip all chambers to runtime default, accept
  atrial physiology, or claim official morphology.
- Phase 5BI remains `landatrial-target-scoring-phase5bi-result-v1`, the first
  direct target-scoring artifact after A1/A2 freeze and Phase 5BH shadow-pack
  promotion. It compares the current atrial active-stress reference, promoted
  LA+RA LandAtrial shadow pack, and a no-AV-plane ablation over HR75/90
  normal/low/high preload. The promoted LandAtrial shadow pack records 6/6
  measured health-ok/output-preserved points, zero Land solve failures, two
  both-atria volume-function broad-pass points, five both-atria raw-readable
  points under existing diagnostic thresholds, and the lowest combined
  volume-plus-direct-wall-strain target distance. AV-plane enabled lowers
  combined target distance versus the no-AV-plane ablation. It does not accept
  atrial physiology, all-chamber runtime default, A1/A2 selection, official
  morphology, valve/load timing, root/Zc changes, qDot clamp retirement, or AF
  validation.
- Phase 5BJ remains `landatrial-geometry-scout-phase5bj-result-v1`, the
  LandAtrial AV-plane/effective wall-geometry scout. It keeps A1/A2 frozen and
  compares current LandAtrial geometry with AV-plane gain and wall-reference
  candidates over HR75/90 normal/low/high preload. All candidates record 6/6
  health-ok/output-preserved points and zero Land solve failures. The best
  combined-distance candidate is `landatrial-avplane-high-la20-ra24`
  (LA `avPlaneGainMl=20`, RA `avPlaneGainMl=24`), improving mean combined
  target distance from 0.51093 to 0.468153 and raw readable diagnostic points
  from 5/6 to 6/6, while reducing both-atria volume-function broad-pass count
  from 2 to 1. It is a next shadow geometry input only; it does not promote a
  new shadow parameter pack, accept atrial physiology, select A1/A2, flip all
  chambers to runtime default, accept official morphology, change valve/load
  timing, retune root/Zc, retire qDot clamps, or validate AF.
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

1. Phase 5BP is now the active blocker for education-visible gross morphology:
   fix or bound ventricular Land velocity/length coupling under valve-load
   transitions before doing more closed-loop LandAtrial parameter tuning. Do
   not use global zeta-disablement, qDot/root/Zc/valve retuning, Tref, or
   source-stress scaling to hide the PV double-dome and AV inflow artifacts.
2. Land plus sourced root/Zc is now the user-0 staged all-chamber runtime
   default after owner GO through Phase 5BK. Do not delete legacy active-stress
   yet; keep it as frozen reference, debug fallback, and rollback while
   physiology acceptance gates mature.
3. Phase 5BL fixes `LandAtrialDefaultFloorV1` as the comparison floor for
   future atrial calibration. The floor is stable enough for user-0 default
   work, but it is not atrial physiology acceptance. Direct wall strain,
   AV-plane/effective wall geometry, valve measurement hygiene, and isolated
   atrial bench work should proceed from this floor, not from A1/A2 bridge
   tuning. Phase 5BM adds the first isolated prescribed-volume LandAtrial bench;
   use it before closed-loop parameter tuning.
4. Keep Phase 5AP bounded: it supports user-0 root/Zc default adoption, but it
   does not unlock qDot clamp removal, valve/load timing acceptance, official
   morphology, reflection coefficients, or clinical/scientific validation.
5. Advance atrial figure-eight work in a separate lane at HR75/90 normal and
   preload envelopes, but freeze A1/A2 as diagnostic scaffolds/comparators.
   Do not add more A1/A2 gain sweeps, soft-floor rescue attempts, or bridge
   selection PRs. The forward physiology direction is LandAtrial with atrial
   parameter packs plus AV-plane/effective-geometry wall-strain readbacks.
   Phase 5BF adds that first LandAtrial shadow path and direct AV-plane wall
   geometry readbacks; Phase 5BG localizes the remaining settle boundary to
   RA-dominant `high-preload-hr90` behavior; Phase 5BH promotes the RA shadow
   parameter pack that settles the HR75/90 preload envelope; Phase 5BK promotes
   the selected LA22/RA26 AV-plane geometry plus atrial-calibrated Land providers
   to the user-0 staged all-chamber runtime default; Phase 5BL fixes that path
   as `LandAtrialDefaultFloorV1` with a standing multi-objective dashboard;
   Phase 5BM adds the isolated LandAtrial prescribed-volume/AV-plane bench.
   Continue calibration from that LandAtrial default floor and isolated bench,
   not from A1/A2 bridge tuning. Treat HR105/120 as edge evidence, not as a
   default gate.
6. Keep provider-local SDIRK2 solver hardening narrow; Phase 5C-R did not unlock
   alternans-finality claim.
7. Keep morphology evidence diagnostic-only when feeding myocardium decisions.
8. Keep official cases at smoke/teaching-surface level until closures stabilize.
9. Keep Studio/Workbench mock work owner-led and separate from scientific
   acceptance.
