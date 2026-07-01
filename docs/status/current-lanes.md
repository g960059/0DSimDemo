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
Phase 5BV records that local ventricular subsystem bench as
`lv-subsystem-bench-phase5bv-result-v1`. It replays LV+MV+AoV and mirrored
RV+TV+PV subsystems against live atrial/arterial pressure boundaries from the
current user-0 all-chamber LandAtrial + sourced-root/Zc closure. The live
source reference remains gross morphology failed at 0/14 measured point-sides
(`normal-hr90` is cap/unmeasured). The best Picard composition
(`picard-series-elastic-current-valves`) improves only the local PV dome count
to 5/14, keeps bounded SeriesElasticV1 energy, but still has gross pass 0/14,
LV 0/7, RV 0/7, AV inflow 0/14, and output preserved only 7/14. This is not
supported for runtime shadow or morphology acceptance. Treat SE, dynamic valve,
and Picard correction as insufficient local composition evidence until the
chamber-pressure/source-state/valve-load coupling is redesigned more
substantially; do not resume LandAtrial tuning to compensate for this blocker.

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

### Phase 5BU-5BX Gross Morphology Override

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
Phase 5BV performs that local subsystem bench and does not earn a runtime
shadow: live is 0/14 gross pass, and the best Picard+SeriesElastic local
composition is still 0/14 gross pass with AV inflow 0/14. Phase 5CB then shows
committed-output pressure-source semantics and fixed-point coupled BE are also
0/8, and Phase 5CC shows a candidate-pressure-after-step Newton residual is
0/1 at normal-HR75 smoke. Phase 5CD adds deterministic active
source/pressure contract attribution and shows that Land ejection-window source
stress is not the dominant multi-peak cause; the residual blocker is the
stress-to-pressure adapter plus valve/load transaction. The next step is not
another tau/limiter/smoothing sweep or solver wrapper. Redesign the ventricular
chamber pressure/source-state adapter contract so pressure evaluation and
source-state advancement share one chamber/load transaction before any runtime
wiring. Keep the morphology envelope as the hard development contract.
Phase 5BW then adds opt-in live Land provider source-state tracing and records
`ventricular-source-state-coupled-step-phase5bw-result-v1`, using the live
source-state trace plus source-state-controlled SeriesElasticV1 replay instead
of the Phase 5BV synthetic calcium input. The current user-0 closure remains
gross morphology failed at 0/7 measured representative points (`normal-hr90`
is not morphology-measured), with LV/RV PV OK only 3/14 measured sides and
MVF/TVF OK only 5/14 measured sides. Source-state stress and SE stress are
single-peaked in only 8/14 sides; LV source stress itself remains multi-peaked
across several preload/afterload/contractility points, while several RV PV
failures occur despite single-peaked source stress. Treat this as evidence
against a small source-state SE/local composition fix and against further
LandAtrial tuning. The next model surface should be a source-state-preserving
ventricular `ChamberShell`/coupled-step pressure-volume/valve-load design over
the same deterministic morphology envelope. Do not tune root/Zc, qDot, valves,
Tref, source-stress, or LandAtrial parameters to hide these failures.
Phase 5BX implements that local `VentricularChamberShellV1` residual surface
and records `ventricular-chamber-shell-phase5bx-result-v1`. The shell solves
chamber pressure/volume plus inlet/outlet valve flow in one local backward
step while preserving live Land source-state inputs, and compares live source
stress versus source-state SeriesElasticV1 under current-like and
DynamicValveTransitionV1 valve modes. Phase 5CA hygiene then removes three
over-supportive replay assumptions from the 5BX evidence: SeriesElastic replay
now uses the shell trajectory's accepted previous lambda instead of the live
trace lambda when shell volume diverges, the first final-beat Land commit is no
longer skipped, and runtime-shadow support thresholds are based on measured
side counts instead of fixed 14/7 constants. After rerun, live remains 0/14
measured side gross pass and the best shell candidate
`shell-source-state-se-current-valves` is also 0/14, with PV 2/14, AV inflow
1/14, output preserved 10/14, and solve fraction 1.0. Do not use the older
"output 14/14" 5BX signal to justify this local shell. Do not wire this local
shell into runtime defaults. Treat the remaining blocker as requiring either a
source-state/pressure-adapter contract redesign or a larger coupled mechanics
step before LandAtrial tuning resumes.
Phase 5BY tests an opt-in graph-coupled provider-state step in live ModelCore:
current user-0 remains 0/8 gross pass, the best graph-coupled variant remains
0/8, and no adoption is supported. Phase 5BZ tests LV/RV source-stress pressure
adapter filtering plus 2x temporal substepping: current user-0 remains 0/8,
best candidate remains 0/8, and no source-stress adapter or temporal substep
adoption is supported. Phase 5CA also writes a reusable visual review bundle
for owner gate calibration under `~/Downloads/0dsim-morphology-review-phase5ca`;
the owner then confirmed that gate-failed examples are visually unacceptable,
and that some current OK examples are still too permissive. Therefore do not
relax `morphology-check-v1` to buy progress; treat raw LV/RV PV dome and
MVF/TVF failures as real blockers for future case/preset fitting. Phase 5CB
tests the next source-state/pressure contract surfaces: committed-output
pressure-source semantics and an opt-in fixed-point coupled backward-Euler
provider-state step. Both remain 0/8 gross pass; no pressure-source contract or
coupled-BE runtime adoption is supported. Phase 5CC then tests an opt-in
candidate-pressure-after-step Newton residual block. Because the finite-
difference Newton surface is expensive, the phase uses a `preview-smoke`
normal-HR75 triage before any full-envelope rerun. Frozen legacy passes gross
morphology, while current user-0 and both coupled-Newton variants remain 0/1
with the same LV PV, RV PV, and MVF failures. Do not adopt this Newton surface
or spend time on a full-envelope rerun; move to the active source/chamber
pressure-adapter contract instead of more solver wrappers.

Phase 5CB records `pressure-source-contract-phase5cb-result-v1`. The current
user-0 closure remains 0/8 gross pass. The best committed-output pressure-source
candidate (`committed-output-lag-legacy-atria`) remains 0/8. The best fixed-point
coupled backward-Euler candidate (`coupled-be-legacy-atria`) also remains 0/8,
despite small badge-level movements (for example RV PV and TVF counts). Do not
adopt these surfaces. Phase 5CC records
`coupled-newton-morphology-phase5cc-result-v1`: frozen legacy passes the
normal-HR75 gross morphology smoke, current user-0 remains 0/1, and both
coupled-Newton variants remain 0/1 with unchanged LV PV, RV PV, and MVF
failures. Treat this as a no-go for the current solver-wrapper family. The next
gross morphology fix should redesign the active source/chamber pressure-adapter
contract so chamber pressure evaluation and Land source-state advancement are
owned by the same chamber/load transaction.
Phase 5CD records
`active-source-pressure-contract-phase5cd-result-v1`, a deterministic
source-stress/active-pressure/lambda/AV-gradient/diode/qDot attribution layer
over the same representative envelope. Frozen legacy remains the normal-HR75
positive morphology reference but only passes 2/8 gross points across the
broader envelope because AV inflow artifacts appear under several knob moves.
Current user-0 remains 0/8 and LV/RV Land with legacy atria remains 0/8. The
important attribution is that measured ejection-window source stress is not
multi-peaked (`sourceStateMultipeak=0` for both Land closures), while
pressure-adapter/geometry amplification appears in 7 ventricular sides and
valve diode/qDot-linked AV inflow artifacts appear in 9 current-user0 AV
inflow traces (7 with legacy atria). Treat the active source itself as
insufficient to explain the education-visible double domes; the next model work
must make the stress-to-pressure adapter and valve/load boundary part of one
chamber-owned transaction rather than another source-stress, zeta, tau,
smoothing, substep, or solver-wrapper sweep.
Phase 5CE records
`active-source-pressure-contract-v2-phase5ce-result-v1`, the first explicit
ActiveSourcePressureContractV2 no-go. It tests an off-by-default
reference-geometry active-pressure adapter that converts LV/RV Land source
stress to chamber pressure through a fixed reference-volume gain while keeping
the current passive pressure at the live volume. It reduces some
pressure-adapter/geometry attribution counts, but current user-0 remains 0/8,
LV/RV Land with legacy atria remains 0/8, and the best V2 candidate
(`v2-reference-geometry-legacy-atria`) is still 0/8 with normal-HR75 failing
LV PV, MVF, and pressure-timing checks. It also does not preserve output
cleanly enough to justify runtime shadow. Do not adopt the reference-geometry
adapter or spend another phase on fixed-gain pressure mapping. The next surface
must own chamber pressure, chamber volume/strain, valve-load boundary, and Land
provider-state advancement as one transaction.
Phase 5CF records
`ventricular-chamber-transaction-phase5cf-result-v1`, an off-by-default local
LV/RV chamber transaction that iterates ventricular volume, inlet/outlet valve
flow, and provider-state advancement together in ModelCore. The local
transaction improves the anatomy of the failure but still does not pass the
representative envelope: current user-0 remains 0/8, LV/RV Land with legacy
atria remains 0/8, `transaction-user0` remains 0/8, and the best transaction
candidate (`transaction-legacy-atria`) reaches only 3/8. The best candidate
does make LV/RV PV loops OK in 8/8, but residual AV inflow failures remain
(MVF OK 6/8, TVF OK 5/8; residual failures 2/8 and 3/8) and normal-HR75 still
fails RA PV loop, TVF, and pressure timing checks. Do not wire the local
transaction to runtime. The next surface must solve a broader chamber/load
graph or redesign the chamber pressure adapter contract; do not return to
zeta/tau/smoothing/substeps, qDot/root/Zc or valve-threshold retuning, Tref,
source-stress scaling, or LandAtrial parameter tuning for this blocker.
Phase 5CG records `chamber-load-transaction-phase5cg-result-v1`, extending
the same off-by-default fixed-point transaction to update the adjacent load
node volumes (LA/Ao/RA/PA) together with LV/RV volume, inlet/outlet valve
flows, and LV/RV provider-state advancement. This does not improve the
representative-envelope verdict over 5CF: current user-0 remains 0/8,
`transaction-user0` remains 0/8, and the best adjacent-load-node candidate is
again `transaction-legacy-atria` at 3/8. LV/RV PV loops remain OK in 8/8 for
the best candidate, but MVF/TVF remain only 6/8 and 5/8 OK respectively.
Do not adopt or wire this adjacent-node transaction. At the 5CG boundary, the
remaining fork was broader graph-level chamber/load coupling versus a chamber
pressure-adapter contract redesign.
Phase 5CH records `av-inflow-residual-attribution-phase5ch-result-v1`, a
deterministic residual attribution pass over the same 8-point envelope and 5CG
candidate surface. It keeps the best candidate as `transaction-legacy-atria`
at 3/8 and attributes all five remaining best-candidate AV inflow residuals to
AV valve diode/qDot contamination, with qDot hits at zero and diode hit
fractions about 0.42-0.53. The residuals are not dominated by pressure-gradient
second pulses, valve-state chatter, AV-plane release, continuity mismatch, or
atrial/ventricular pressure rebound in this readout. Do not adopt the
adjacent-node transaction. The next structural surface should prioritize a
chamber-transaction-owned AV valve boundary so valve state, diode policy,
pressure gradient, and accepted chamber state are committed atomically; keep
LandAtrial tuning and zeta/tau/smoothing/qDot/root/Zc retuning frozen for this
blocker.
Phase 5CI records `av-valve-boundary-transaction-phase5ci-result-v1`, adding
an off-by-default MV/TV bounded-deceleration boundary inside the 5CG chamber
transaction. This post-diode relaxation is not sufficient: tau 15/25/40ms
legacy-atria candidates remain identical to the 5CG baseline at 3/8 gross
(LV/RV PV OK 8/8, MVF OK 6/8, TVF OK 5/8), and the user-0 transfer candidate
remains 0/8. Treat 5CH diode-hit attribution as a residual boundary symptom,
not a solved mechanism. The next surface must own the AV valve state,
pressure-gradient, flow, and chamber-volume commit together rather than only
softening the reverse-flow projection after a flow candidate has already been
computed.
Phase 5CJ records `av-valve-complementarity-transaction-phase5cj-result-v1`,
an off-by-default AV valve state-coupled complementarity diagnostic inside the
same chamber transaction. This is a partial positive but not adoption evidence:
the best candidate is asymmetric (`state-coupled-tv-only-legacy-atria`) and
reaches 6/8 gross pass with LV/RV PV OK 8/8, TVF OK 8/8, MVF OK 6/8, and output
preserved 7/8. The remaining failures are MV residuals at low-preload HR75 and
contractility-low HR75 with valve-diode/qDot contamination readouts (qDot hits
zero), while the all-chamber user-0 transfer remains 0/8. Carry the TV-only
state-coupled ordering forward as diagnostic component evidence, but do not
wire it to runtime/default. The next implementation surface should focus on
the remaining left-sided MV residual with a chamber pressure/valve-load
complementarity solve or pressure-adapter contract redesign, not a symmetric
MV+TV state-coupling, tau/filter sweep, LandAtrial tuning, or valve/root/qDot
retuning.
Phase 5CK records `mv-pressure-refit-transaction-phase5ck-result-v1`, carrying
the 5CJ TV state-coupled component forward and adding an off-by-default MV
pressure-refit diagnostic inside the same transaction. This is a stronger
partial positive but still not adoption evidence: the best candidate
(`tv-state-mv-pressure-refit-legacy-atria`) reaches 7/8 gross pass with LV/RV
PV OK 8/8, TVF OK 8/8, MVF OK 7/8, settled 8/8, and output preserved 7/8. The
only remaining best-candidate gross failure is `low-preload-hr75`, localized
to MV valve diode residual evidence with qDot hits still zero; all other AV
inflow residuals are clean-biphasic. The all-chamber user-0 transfer remains
insufficient (2/8), so this does not unlock runtime/default wiring,
LandAtrial tuning, official morphology, or valve/load timing acceptance. Carry
the TV-state plus MV pressure-refit ordering as diagnostic component evidence
and narrow the next experiment to the remaining low-preload left-sided MV
residual or to a broader pressure-adapter contract if that residual cannot be
resolved without overfitting.
Phase 5CL records `mv-fixed-point-refit-transaction-phase5cl-result-v1`,
testing whether the Phase 5CK one-pass MV pressure-refit residual was a local
transaction convergence gap. The two-pass fixed-point refit candidate
(`tv-state-mv-fixedpoint2-legacy-atria`) is the first ventricular/filling
candidate to pass the full representative morphology envelope under legacy
atria: gross 8/8, LV/RV PV 8/8, MVF 8/8, TVF 8/8, settled 8/8, and all 16 AV
inflow residuals clean-biphasic. This remains non-adoption evidence because
the all-chamber user-0 transfer candidate is still only 6/8 with residual
low-preload HR75 and contractility-high HR75 AV inflow failures. Carry the
fixed-point MV refit plus TV state coupling forward as component evidence, but
do not wire it to runtime/default until the all-chamber transfer passes. The
next experiment should attribute the user-0 transfer residuals without
reopening A1/A2 or tuning valve/qDot/root/Zc/Tref/source-stress.
Phase 5CM records `mv-fixed-point-hygiene-phase5cm-result-v1`, fixing two
Phase 5CL hygiene gaps before any adoption or transfer claim: normalized
`ventricularChamberTransactionStep` now preserves requested MV pressure-refit
iterations/relaxation, and MV fixed-point refit evaluates each inner residual
from the pre-step MV flow state rather than advancing MV flow across multiple
physical timesteps inside one `ModelCore.step`. The runner records requested
and effective refit settings for each variant (`fixedpoint1/2/3/3-relax07` plus
user-0 transfer); configuration integrity is clean (`0/9` mismatches). With
the same-step hygiene in place, the 5CL 8/8 legacy-atria signal does not
survive: the best candidate is `tv-state-mv-fixedpoint3-relax07-legacy-atria`
at gross 3/8 (LV/RV PV 8/8, TVF 8/8, MVF 3/8, output 7/8), while user-0
transfer remains 0/8. Treat the Phase 5CL full-envelope pass as over-supportive
diagnostic history, not as component evidence to carry forward. The next model
surface must be a real chamber-owned AV valve boundary/complementarity and/or
pressure-adapter contract redesign, not another pointwise MV refit escalation
or LandAtrial tuning.
Phase 5CN records `av-valve-boundary-transaction-phase5cn-result-v1`, adding
an off-by-default accepted-state AV valve boundary mode. Unlike 5CL/5CM point
refits, it computes MV/TV flow once from the pre-step valve flow, accepted
chamber pressures, and accepted valve state inside the chamber transaction.
This is a partial positive but not adoption evidence: the best legacy-atria
candidate (`accepted-av-boundary-legacy-atria`) improves over the 5CM same-step
refit surface to gross 5/8, with LV/RV PV 8/8, MVF 6/8, TVF 6/8, output 7/8,
and configuration integrity `0/6` mismatches. Residual failures remain
valve-diode/qDot-contamination classified, and the all-chamber user-0 transfer
candidate remains 0/8. Do not wire this mode to runtime/default. Carry it only
as evidence that accepted-state AV boundary ownership is a better surface than
pointwise MV refit, while the next phase must broaden the pressure/valve/load
complementarity or pressure-adapter contract before LandAtrial tuning resumes.
Phase 5CO records `av-valve-complementarity-phase5co-result-v1`, adding an
off-by-default accepted-state AV valve fixed-point complementarity mode. The
inner loop keeps physical time fixed by solving MV/TV flow from the same
pre-step valve flow while iterating against accepted chamber pressures and
accepted valve state; requested/effective iteration settings are audited cleanly
(`0/8` mismatches). This modestly improves residual cleanliness but not the
envelope decision: best legacy-atria candidate
(`accepted-av-complementarity2-legacy-atria`) remains gross 5/8 with LV/RV PV
8/8, MVF 6/8, TVF 6/8, output 7/8, and residuals `13/16` clean-biphasic plus
`3/16` valve-diode/qDot-contamination classified. All-chamber user-0 transfer
remains 0/8. Do not increase accepted-state fixed-point iterations or wire this
mode to runtime/default. Carry the result as evidence that local accepted-state
AV valve complementarity is insufficient by itself; the next surface should
change the chamber pressure/valve-load contract rather than tune LandAtrial,
qDot/root/Zc/valve thresholds, Tref, or source-stress.
Phase 5CP records `pressure-load-contract-phase5cp-result-v1`, testing an
off-by-default ActiveSourcePressureContractV2 bounded active pressure geometry
gain over the same representative morphology envelope, both alone and combined
with the Phase 5CO accepted-state AV fixed-point complementarity component.
Configuration integrity remains clean (`0/7` mismatches), but the scalar
pressure/load contract does not beat the 5CO baseline: the best pressure
contract candidate
`bounded-geometry-gain115-accepted-complementarity2-legacy-atria` reaches
gross 4/8 (LV 7/8, RV 7/8, MVF 7/8, TVF 6/8, output 7/8), below
`accepted-av-complementarity2-legacy-atria` at gross 5/8; all-chamber user-0
transfer reaches only gross 2/8 with residuals dominated by valve-diode/qDot
classification (`10/16`). Do not adopt bounded active-pressure gain, widen the
gain cap, or combine more scalar caps to buy morphology. Treat Phase 5CP as a
no-go for local pressure-gain capping and move the next surface to a broader
chamber pressure/valve/load transaction that owns chamber pressure, valve flow,
accepted volume, and source-state commit together.
Phase 5CQ records
`accepted-av-boundary-diagnostics-phase5cq-result-v1`, adding
transaction-specific accepted-boundary readbacks for MV/TV accepted flow, pressure
gradient, qDot raw/post/clamp, diode impulse, complementarity residual, and
iteration count. This is diagnostic hygiene rather than a model adoption: the
accepted-state complementarity legacy-atria candidate remains gross 5/8
(LV/RV PV 8/8, MVF 7/8, TVF 6/8, output 7/8), and all-chamber user-0 transfer
remains 0/8. The important result is attribution hygiene. Accepted-boundary
diagnostics are available in 16/16 accepted legacy-atria AV readbacks and
change the local residual interpretation in 3/16; in all-chamber user-0 they
change 13/16, splitting the old standard diode/qDot classification into
accepted-boundary diode/qDot evidence (6/16) plus complementarity leak evidence
(7/16). Do not classify future accepted-state AV residuals from standard
`MV_diodeImpulse`/`TV_diodeImpulse` and qDot fields alone. Carry the
`acceptedBoundary*` fields as mandatory readbacks for the next broader chamber
pressure/valve/load transaction, without tuning LandAtrial, valves, qDot,
root/Zc, Tref, or source stress.
Phase 5CR records
`chamber-pressure-valve-load-contract-phase5cr-result-v1`, testing an
off-by-default side-local AV+semilunar pair fixed-point so inlet AV flow and
outlet semilunar flow are owned together against the same accepted side volume
projection. It is a no-go: the Phase 5CO accepted-complementarity baseline
remains gross 5/8 in legacy atria, while the pair-coupled legacy-atria
candidate drops to gross 0/8 (LV PV 1/8, RV PV 3/8, MVF 7/8, TVF 6/8,
output 7/8), and pair-coupled all-chamber user-0 transfer remains gross 0/8.
The AV residual attribution shape is unchanged in legacy atria (13/16 clean
and 3/16 accepted-boundary diode/qDot), while user-0 still shows accepted
complementarity leak in 7/16 AV readbacks. Do not continue fixed-point
iteration, pair-coupled side-local valve-load ownership, scalar pressure caps,
or morphology-by-retuning. The next surface must be an explicit chamber
pressure/source-state/valve-load residual contract rather than another
post-hoc refit or local flow fixed point.
Phase 5CS records `chamber-pressure-valve-load-contract-phase5cs-result-v1`,
testing a heavier off-by-default source-state-recomputed residual contract at
the normal-HR75 smoke point before paying for a full envelope. The smoke is a
no-go: Phase 5CO accepted-complementarity legacy atria remains gross 1/1,
while the 5CS residual-contract legacy-atria and all-chamber user-0 transfer
candidates are both gross 0/1. Runtime cost is also materially higher than the
prior diagnostics, so the full envelope was intentionally not run after the
normal smoke failed. Carry this as evidence that recomputing source state inside
a side-local residual relaxation still is not sufficient; do not keep expanding
local residual/refit variants. The next useful surface likely needs a clearer
chamber mechanical contract or a different pressure adapter abstraction rather
than another hidden iteration around the same valve/load states.
Phase 5CT records
`ventricular-pressure-decomposition-phase5ct-result-v1`, adding LV/RV
unclamped/passive/active pressure readbacks and replaying the representative
envelope across current user-0, LV/RV Land legacy-atria, and the Phase 5CO
accepted-complementarity surface. It does not unlock adoption: current user-0
and LV/RV Land legacy-atria remain gross 0/8, while accepted-complementarity
legacy atria remains gross 5/8 and accepted-complementarity user-0 transfer
remains gross 0/8. The useful signal is attribution: pre-accepted PV failures
show active-source/mixed pressure residuals, but accepted-complementarity
clears LV/RV PV sides to 8/8, so the remaining blocker on that surface is
MVF/TVF and all-chamber user-0 transfer rather than more systolic PV pressure
decomposition. Keep these readbacks for future adapter diagnostics, but do not
spend another phase on LV/RV dome-only pressure decomposition while the accepted
surface already has LV/RV PV 8/8.
Phase 5CU records
`user0-av-inflow-transfer-attribution-phase5cu-result-v1`, holding the Phase
5CO accepted-complementarity surface fixed while ablating LandAtrial AV-plane
geometry in the all-chamber user-0 transfer. It shows AV-plane release timing
is a real contributor but not a sufficient standalone rescue: current user-0
accepted-complementarity transfer remains gross 0/8 (MVF 1/8, TVF 2/8), LA
AV-plane off reaches gross 2/8 with MVF 8/8 but TVF still 2/8, RA AV-plane off
reaches gross 1/8, and both LA/RA AV-plane off reaches gross 5/8 (MVF 7/8,
TVF 5/8). The residual cause mix remains accepted-boundary diode/qDot and
complementarity leak, so do not adopt AV-plane-off or tune gains; the next
useful surface is stateful/asymmetric AV-plane release timing while preserving
accepted-boundary readbacks and the morphology envelope.
Phase 5CV records
`stateful-avplane-release-phase5cv-result-v1`, adding an off-by-default
stateful/asymmetric LandAtrial AV-plane release hook that uses atrial
`internal.r` as filtered AV-plane descent without creating a hidden blood
volume. The full 48-run envelope was intentionally stopped as too slow for
forward velocity, then a targeted 4-point smoke (normal, low/high preload, low
contractility) was run. It is partial-positive only: current all-chamber user0
accepted-complementarity remains gross 0/4 (MVF 0/4, TVF 1/4), static
LA/RA AV-plane-off reference reaches gross 2/4, and both-sided stateful release
also reaches gross 2/4 (MVF 3/4, TVF 2/4). This supports carrying stateful
release timing as a component candidate, but it does not beat the static-off
reference, does not unlock LandAtrial parameter tuning, and does not support
runtime/default adoption or atrial physiology acceptance. Remaining residuals
still include accepted-boundary diode/qDot and complementarity leak, so the
next step should split atrial pressure/release timing from accepted-boundary
residuals using smoke-first diagnostics before any full envelope rerun.
Phase 5CW records
`avplane-release-boundary-coupling-phase5cw-result-v1`, adding an off-by-default
inlet-open release-hold option to the stateful LandAtrial AV-plane release hook.
It runs a targeted 2-point smoke (normal-HR75 and low-preload-HR75) rather than
another full envelope because the full stateful-release matrix is too slow for
forward iteration. The result is a partial positive and a clearer split:
accepted legacy is gross 2/2, current all-chamber user0 remains gross 0/2,
static both-AV-plane-off reaches gross 1/2, and both stateful plus LA-held plus
both-held release each reach gross 1/2. MVF improves from 0/2 in current user0
to 2/2 in both-stateful, LA-held, and both-held release variants, but TVF stays
1/2 with a remaining accepted-boundary diode/qDot residual. Carry inlet-open
release holding as component evidence for MV-side transfer only; do not adopt it
as runtime/default, do not unlock LandAtrial parameter tuning, and do not use it
to claim atrial physiology or official morphology.
Phase 5CX records
`tv-boundary-residual-focus-phase5cx-result-v1`, adding an off-by-default
accepted-boundary adverse-gradient forward-flow scale diagnostic to test whether
the remaining TVF failure after inlet-held AV-plane release is just coasting
forward flow under adverse pressure gradient. It is a no-go over the same
2-point smoke: accepted legacy is gross 2/2, both-held user0 baseline is gross
1/2 with MVF 2/2 and TVF 1/2, and scale 0.25 plus scale 0 both remain gross
1/2 with MVF 2/2 and TVF 1/2. Scale 0 removes the complementarity leak in the
failed TV point but does not remove the accepted-boundary diode/qDot-classified
extra TV wave. Do not continue scalar adverse-gradient braking; the residual
needs a physical valve-state/pressure-flow contract rather than another limiter,
qDot tweak, valve-threshold tune, or LandAtrial parameter change.
Phase 5CY records
`valve-pressure-flow-contract-phase5cy-result-v1`, adding an off-by-default
accepted projected valve-state pressure-flow coupling diagnostic. It moves the
same accepted-boundary residual surface from a scalar brake to a physical
valve-state/area pressure-flow relation and reruns the representative 8-point
normal-sinus envelope. The signal is the strongest user-0 transfer component
evidence so far: current inlet-held user0 is gross 4/8 with MVF 8/8 and TVF 4/8,
while projected valve-state pressure-flow user0 reaches gross 7/8 with MVF 8/8
and TVF 7/8. The remaining gross failure is `contractility-low-hr75` TVF with
accepted-boundary diode/qDot classification. However, LA and RA pressure timing
still fail all 8/8 user0 points, so this does not accept atrial physiology,
does not unlock LandAtrial tuning, and does not support runtime/default
adoption. The next useful split is the remaining contractility-low TVF residual
plus a direct atrial-kick-to-ventricular-upstroke timing gate; do not interpret
the current pressure-timing badge as solved.

## Lane table

| Lane | Current state | Current blocker | Next experiment | Must not claim |
|---|---|---|---|---|
| myocardium | Phase 5AK implements the owner-GO user-0 staged LV Land runtime selection. Phase 5AL measures explicit LV+RV Land default-candidate evidence. Phase 5AO promotes that measured path to the user-0 staged LV+RV runtime default: `lv-rv-land-default-flip-phase5ao-result-v1` records 5/5 default smoke points settled and health-ok, zero LV/RV Land solve failures, both providers and sidecars present at every default point, 5/5 previous LV-only points still RV-provider-free when requested explicitly, and 5/5 legacy rollback points provider-free and non-failed. Phase 5AP then adopts the sourced total 2x root/Zc boundary/root mechanism for the LV+RV runtime default after live-closure evidence; preview, transition-steady, and Guyton/Starling runtime surfaces resolve LV+RV Land plus adopted root/Zc through `createModelCoreRuntimeExperimentalOptions()` by default, while `runScenario`, `runToPeriodicSteady`, and the bare `ModelCore` constructor remain frozen legacy reference paths unless an explicit `runtimeActiveSourceMode` is passed. The LV/RV default uses normalized chamber-default calcium-input user-control references, not Tref/source-stress tuning. Phase 5AQ adds an explicit all-chamber Land candidate and fixes/audits atrial Land source strain to use the same AV-plane-adjusted pressure-adapter lambda as atrial pressure assembly. The candidate reaches LA/RA providers in 6/6 HR75/90 preload points with zero LA/RA Land solve failures, but remains `not-supported` because `low-preload-hr90` fails with `source active-fiber stress must be nonnegative`. Phase 5AR attributes that blocker: LA-only Land is health-ok in 6/6, while RA-only and all-chamber fail only at low-preload HR90 because raw RA Land source stress goes slightly negative before the pressure adapter (`-1.490128` to `-1.64698` Pa). Phase 5AV tests a signed RA pressure-adapter candidate: the current RA nonnegative control reproduces the low-preload HR90 runtime error, while signed RA-only and all-chamber candidates remove runtime errors and reach 5/6 measured health-ok points but still cap at low-preload HR90. Phase 5BP records that LV/RV Land gross morphology failures are not resolved by SDIRK2 or a simple filtered-`lambdaAct` adapter, and that no-zeta-drive is only a diagnostic ablation because it fixes PV double domes while breaking AV inflow/output. Phase 5BQ tests filtered-`lambdaAct` tau, AV-plane gain ablations, and an off-by-default valve/load staged strain-rate provider over an HR/preload/afterload/contractility envelope; normal-point improvements are not envelope-robust, best all-chamber pass is only 2/8, and no runtime adoption is supported. Phase 5BR adds an off-by-default stateful zeta-drive coupler that preserves raw length while bounding only Land zeta velocity drive; it improves normal-point LV/RV morphology but still fails the all-chamber envelope (best 3/8 and AV-plane-off-dependent). Phase 5BS adds an off-by-default openness-scaled valve diode smoothing diagnostic; current-AV-plane all-chamber candidates remain 0/8 and the best 3/8 rescue requires AV-plane off, so no runtime adoption is supported. Phase 5BT records inconclusive isolated SeriesElasticV1 evidence, Phase 5BU records not-supported standalone DynamicValveTransitionV1 local valve/load evidence, Phase 5BV records not-supported local LV/RV subsystem Picard composition evidence (`live 0/14`; best local composition `gross=0/14`, LV 0/7, RV 0/7, PV 5/14, AV inflow 0/14, output 7/14), Phase 5CB records pressure-source and coupled-BE no-go evidence (both 0/8), Phase 5CC records coupled-Newton no-go smoke evidence (0/1 at normal-HR75), Phase 5CD records active source/pressure contract attribution (`current user0 0/8`, `LV/RV Land legacy atria 0/8`, `sourceStateMultipeak=0`, pressure-adapter/geometry plus valve diode/qDot-linked AV inflow failures), Phase 5CE records reference-geometry ActiveSourcePressureContractV2 no-go evidence (best V2 remains 0/8), Phase 5CF records a local LV/RV ventricular chamber transaction no-go (`current user0 0/8`, `transaction-user0 0/8`, best `transaction-legacy-atria 3/8`, LV/RV PV OK 8/8 but residual AV inflow failures), Phase 5CG records an adjacent-load-node chamber transaction no-go (best remains `transaction-legacy-atria 3/8`, LV/RV PV OK 8/8, MVF OK 6/8, TVF OK 5/8), Phase 5CH records AV inflow residual attribution: all five remaining best-candidate MVF/TVF residuals are valve-diode/qDot contamination with zero qDot hits and diode hit fractions about 0.42-0.53, Phase 5CI records that MV/TV bounded-deceleration inside the transaction is not sufficient (tau 15/25/40ms legacy-atria remains 3/8; user0 transfer remains 0/8), Phase 5CJ records a partial positive from state-coupled AV valve complementarity: best `state-coupled-tv-only-legacy-atria` reaches 6/8 gross with LV/RV PV 8/8, TVF 8/8, MVF 6/8, output 7/8, but fails low-preload HR75 and contractility-low HR75 through MV diode residuals and does not transfer to all-chamber user-0. Phase 5CK/5CL/5CM show that MV pressure-refit/fixed-point refit can appear strong only before same-step hygiene; after hygiene, 5CL's 8/8 does not survive. Phase 5CN/5CO accepted-state AV boundary/complementarity stays at best gross 5/8, Phase 5CP scalar bounded active-pressure gain drops to 4/8, and Phase 5CQ adds accepted-boundary-specific readbacks showing future residual attribution must use accepted `qDot`/diode/complementarity fields rather than standard sample fields alone. Phase 5CV adds an off-by-default stateful/asymmetric LandAtrial AV-plane release hook and records targeted 4-point partial-positive evidence: current user0 stays gross 0/4, static both-AV-plane-off reference is gross 2/4, and both-sided stateful release is also gross 2/4 with MVF 3/4 and TVF 2/4, so carry it as component evidence but do not adopt or unlock tuning. Phase 5CW adds an off-by-default inlet-open release-hold option and records targeted 2-point evidence: current user0 remains gross 0/2, both-stateful/LA-held/both-held release reach gross 1/2 and MVF 2/2, but TVF remains 1/2 with accepted-boundary diode/qDot residuals, so it is MV-side component evidence only. Legacy active-stress is not deleted. | Legacy active-stress deletion, all-chamber atrial physiology acceptance, official case reauthoring, state-schema migration, Level 3/4 acceptance, official morphology, structural alternans removal, alternans-finality claim, direct Ao_SA adoption, AoV-boundary carrier adoption, reflection-coefficient claim, valve/load candidate timing acceptance, qDot clamp removal, accepted preload/venous/passive/geometry/source-calcium tuning, Tref fudge, Land parameter tuning, source-stress scaling, source-stress clamping, global zeta-disablement, openness-scaled valve smoothing adoption, standalone SeriesElasticV1 adoption, standalone DynamicValveTransitionV1 adoption, local Picard subsystem adoption, pressure-source contract adoption, fixed-point coupled-BE adoption, coupled-Newton adoption, reference-geometry active-pressure adapter adoption, local ventricular chamber transaction adoption, adjacent-load-node chamber transaction adoption, state-coupled AV valve complementarity adoption, active-source/pressure contract acceptance, accepted-state AV boundary/complementarity adoption, scalar active-pressure gain adoption, and morphology-by-valve/qDot/root retuning remain blocked; signed RA source-stress pressure adaptation is candidate-only and low-preload HR90 settle-blocked; arterial load, valve/load, classifier/window, PVein_LA/filling-inertance, atrial filling, valve transition dynamics, and RA/LA chamber-replacement lanes remain separate | preserve accepted-boundary `qDot`/diode/complementarity readbacks as mandatory hygiene, then move to a broader chamber pressure/valve/load transaction that owns chamber pressure, valve flow, accepted volume, and source-state commit before any LandAtrial tuning; keep LandAtrial AV-plane/effective-wall release timing separate; keep Phase 5BR/5BS/5BT/5BU/5BV/5CB/5CC/5CD/5CE/5CF/5CG/5CI/5CJ-5CQ mechanisms as diagnostic/component evidence unless a later source-state-controlled chamber-owned pressure path passes the morphology envelope | alternans finality, official morphology, atrial physiology acceptance, source-stress clamp/tuning, global zeta disablement, qDot clamp removal, valve/load timing acceptance, and clinical/scientific validation are not claimed |
| morphology | Phase M1 records `morphology-blocker-bundle-phase-m1-result-v1`; Phase 5X-5Z localize the LV qDot morphology blocker to real AoV/root discharge engagement rather than a dominant short-window denominator artifact. Phase 5AA records an offline prescribed-pressure arterial root inertance bench, Phase 5AB carries the lower-inertance region into closed loop, Phase 5AC adds direct isolated-bench input impedance spectra, Phase 5AD tests selected off-by-default prototype routes, Phase 5AE carries the AoV-boundary signal into a separated experimental boundary/root inertance hook, Phase 5AF sources the total 2x AoV/root candidate as the only preferred/broad Zc-range candidate, Phase 5AG shows closed-loop qDot+timing signal in 18/28 measured-health-ok comparisons, Phase 5AH attributes the weaker Land qDot headline to output-preserved but below-threshold qDot reductions rather than solve/output failure, Phase 5AI bounds the Land normal-floor LVEDP excess as passive-proxy/source-sensitivity diagnostic evidence rather than morphology acceptance, and Phase 5AP supports adopting the sourced total 2x root/Zc candidate in the live LV+RV default closure with 15/15 health-ok comparisons, output-preserved fraction 1.0, timing-signal fraction 1.0, qDot-signal fraction 0.466667, and zero output/timing-cost points. Phase 5BN adds a reusable raw-trace morphology checker and Workbench badge for LV/RV/LA/RA PV loops, MVF/TVF, and LAP/RAP timing; it records current education-visible failures rather than tuning them away. Phase 5BO records `morphology-attribution-phase5bo-result-v1`: root/Zc current-vs-sourced and LandAtrial AV-plane-off ablations do not remove the gross LV PV/MVF failures, while LV-only Land with legacy RV/atria reproduces them and frozen legacy keeps LV/RV PV plus MVF OK. Phase 5BP records `ventricular-land-valve-load-morphology-phase5bp-result-v1`: LV-only Land reproduces LV double-dome plus MVF third-wave failures, RV-only Land reproduces RV double-dome failure, SDIRK2 and filtered-lambda diagnostics do not fix them, and no-zeta-drive fixes PV double domes only by breaking AV inflow morphology/output. Phase 5BQ records `ventricular-land-velocity-coupling-phase5bq-result-v1`: current user-0 gross morphology passes 0/8 representative points, filtered-`lambdaAct` tau with legacy atria improves normal but not the envelope, all-chamber AV-plane off/mid candidates only pass 2/8, and staged strain-rate coupling is not supported. Phase 5BR records `ventricular-land-kinematics-coupler-phase5br-result-v1`: stateful zeta-drive improves LV/RV PV normal points but all-chamber current AV-plane remains 0/8 and AV-plane-off rescue is only 3/8. Phase 5BS records `dynamic-valve-transition-phase5bs-result-v1`: openness-scaled MV/TV or all-valve diode smoothing does not improve current-AV-plane all-chamber gross pass beyond 0/8; the best candidate is AV-plane-off-only at 3/8, so smoothing is not accepted. Phase 5BT records inconclusive SeriesElasticV1 isolated evidence, Phase 5BU records not-supported standalone DynamicValveTransitionV1 local valve/load evidence, Phase 5BV records not-supported local LV/RV subsystem Picard composition evidence, Phase 5CB records pressure-source and coupled-BE no-go evidence, Phase 5CC records coupled-Newton no-go smoke evidence, Phase 5CD records deterministic active-source/pressure contract attribution pointing to pressure-adapter/geometry and valve-load transaction failures rather than ejection-window source-stress multipeaks, Phase 5CE records that a reference-geometry pressure adapter is still 0/8, Phase 5CF records that a local LV/RV chamber transaction can make LV/RV PV loops OK in the best legacy-atria candidate but still only reaches 3/8 gross because AV inflow artifacts remain, Phase 5CG records that adding adjacent load-node volumes to that transaction still leaves the best candidate at 3/8, Phase 5CH attributes all five remaining best-candidate AV inflow residuals to AV valve diode/qDot contamination with zero qDot hits, Phase 5CI shows bounded-deceleration MV/TV boundary candidates do not improve the 3/8 best gross pass, and Phase 5CJ shows state-coupled AV valve complementarity is a partial positive only in the TV-only legacy-atria path (gross 6/8; LV/RV PV 8/8; TVF 8/8; MVF 6/8; remaining MV residuals at low-preload HR75 and contractility-low HR75). Filling comparator evidence remains 39/42 interpretable; the residual gap is `lv-failure-dobutamine` branch 1 RV beats 1-3 missing only `eaLikeInflowProxy`. | residual dobutamine RV E/A-like proxy gap; reflection coefficient remains unavailable/no-proxy; valve/load timing acceptance missing; qDot clamp removal remains unsupported; raw LV/RV systolic domes and AV inflow artifacts now require a robust envelope fix rather than normal-point tuning; stateful zeta-drive alone is insufficient; openness-scaled diode smoothing is insufficient; standalone SeriesElasticV1 is inconclusive; standalone DynamicValveTransitionV1 is not supported; local Picard subsystem composition is not supported; pressure-source, fixed-point coupled-BE, coupled-Newton, current active-source/pressure contract, reference-geometry fixed-gain pressure-adapter, local LV/RV transaction, adjacent-load-node transaction, post-diode bounded-deceleration, symmetric MV/TV state-coupled complementarity, and user-0 state-coupled transfer surfaces are not supported; TV-only state-coupled ordering is diagnostic component evidence only; LandAtrial AV-plane/effective-wall release timing contributes to MVF/TVF residuals but simple gain off/mid is not robust; global zeta disablement is not acceptable; LAP/RAP pressure timing needs checker-hygiene split because legacy also fails the current pressure-extrema rule; accepted passive/source tuning remains blocked | use Phase 5BN checker as the common UI/CI/subagent/case-validation surface; preserve the 5CJ TV-only ordering as diagnostic component evidence, but next fix should focus on the remaining left-sided MV pressure/valve-load complementarity residual before closed-loop runtime shadow; keep PVein_LA/filling inertance plus atrial LandAtrial calibration separate from LV/RV gross morphology repair | no official morphology, qDot clamp removal, valve/load timing acceptance, atrial physiology acceptance, global zeta-disablement, openness-scaled smoothing adoption, standalone SeriesElasticV1 adoption, standalone DynamicValveTransitionV1 adoption, local Picard subsystem adoption, pressure-source contract adoption, fixed-point coupled-BE adoption, coupled-Newton adoption, active-source/pressure contract acceptance, reference-geometry pressure-adapter adoption, local LV/RV transaction adoption, adjacent-load-node transaction adoption, state-coupled AV valve complementarity adoption, or clinical/scientific validation is claimed |
| atrial bridge | Historical E0/A0/A1 and A2 bridge evidence remains pinned below. A1/A2 are now frozen diagnostic scaffolds/comparators, not forward selection candidates. Phase 5BK promotes all-chamber LandAtrial (`landatrial-runtime-candidate-la22-ra26`) to the user-0 staged runtime default with 6/6 health-ok/output-preserved HR75/90 preload points and zero LA/RA Land solve failures. Phase 5BL records `LandAtrialDefaultFloorV1` as the standing comparison floor and multi-objective dashboard: raw LA/RA readability is 6/6, both-atria volume-function broad-pass remains limited to `normal-hr75` and `normal-hr90`, and direct wall-strain broad-pass remains 0/6. Phase 5BM adds an isolated prescribed-volume LandAtrial bench with LA/RA AV-plane on/off comparisons and zero Land solve failures. Phase 5BN freezes further LandAtrial parameter tuning until the reusable morphology checker is in place and reporting raw LAP/LA-kick, MVF/TVF, and PV-loop failures. Phase 5BO shows the current MVF third wave is not removed by disabling LandAtrial AV-plane gain and is reproduced by LV-only Land. Phase 5BP extends that to RV: gross LV/RV PV and MVF failures belong to ventricular Land plus valve/load/filling coupling before atrial parameter tuning. Phase 5BQ shows that after LV/RV filtered-lambda tau normal-point repair, LandAtrial AV-plane off/mid can remove normal MVF failure but is not robust over preload/afterload/contractility, so simple AV-plane gain reduction is not accepted. Phase 5BS shows openness-scaled valve smoothing still leaves current AV-plane all-chamber gross pass at 0/8, while the best 3/8 candidate requires AV-plane off. Phase 5BU confirms that standalone local valve-transition replay is also not enough, and Phase 5BV confirms that a small local Picard+SE+dynamic-valve subsystem composition still leaves gross 0/14 and AV inflow 0/14. Phase 5CV stateful AV-plane release is partial-positive on a targeted smoke, and Phase 5CW inlet-open release-hold improves MVF in a 2-point smoke but leaves TVF residuals; both remain component evidence only. LandAtrial parameter tuning stays paused behind robust LV/RV PV plus MVF/TVF morphology and accepted-boundary residual cleanup. | atrial physiology acceptance remains blocked by direct wall-strain distance, incomplete volume-function envelope pass, valve-diode measurement hygiene, raw pressure timing failures, robust AV-plane/effective-wall release timing, and literature-calibrated isolated/closed-loop calibration evidence; HR105/120 remains edge evidence; no oracle direction checks | pause single-score LandAtrial tuning; after a source-state-controlled LV/RV coupled-step surface earns robust PV-loop plus MVF/TVF morphology, redesign/measure AV-plane/effective-wall release timing against the morphology envelope using `LandAtrialDefaultFloorV1` plus the Phase 5BM isolated bench; keep A1/A2 frozen | final atrial physiology, AF validation, valve/load timing acceptance, qDot clamp removal, legacy deletion, official morphology acceptance, and clinical/scientific validation |
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

1. Phase 5CL is now the active blocker for education-visible gross morphology:
   owner visual review confirms the morphology checker is directionally trusted
   and not too strict for failed examples. Current user-0, committed-output
   pressure-source, and fixed-point coupled-BE candidates all remain 0/8 gross
   pass in Phase 5CB, and the Phase 5CC diagnostic Newton residual remains 0/1
   at normal-HR75. Phase 5CD then shows current user-0 and LV/RV Land with
   legacy atria are both 0/8 over the representative envelope, with
   sourceStateMultipeak=0 during measured ejection windows and dominant
   pressure-adapter/geometry plus valve diode/qDot-linked AV inflow contract
   failures. Phase 5CE then tests a fixed reference-geometry active-pressure
   adapter and still gets 0/8 for the best V2 candidate, so fixed-gain pressure
   mapping is also not enough. Phase 5CF then tests a local LV/RV chamber
   transaction where ventricular volume, inlet/outlet valve flows, and Land
   provider-state advancement are iterated together. It improves LV/RV PV loops
   in the best legacy-atria transaction candidate, but still only reaches 3/8
   gross pass because AV inflow and timing artifacts remain. The next
   implementation surface must broaden the chamber/load graph or redesign the
   chamber pressure adapter contract, not simply wire the local transaction.
   Phase 5CG then includes adjacent load-node volumes (LA/Ao/RA/PA) in the
   same transaction and still reaches only 3/8 for the best legacy-atria
   candidate, with residual MVF/TVF failures. The next implementation surface
   must move beyond local LV/RV plus first-neighbor transactions. Phase 5CH
   attributes all five remaining best-candidate AV inflow residuals to AV
   valve diode/qDot contamination, with zero qDot hits and diode hit fractions
   around 0.42-0.53. The next implementation surface should prioritize a
   chamber-transaction-owned AV valve boundary, not a pressure-gradient,
   AV-plane, zeta, tau, or LandAtrial parameter sweep. Phase 5CI then tests
   MV/TV bounded-deceleration inside that transaction and finds no improvement:
   tau 15/25/40ms legacy-atria candidates remain at 3/8 and user0 transfer
   remains 0/8. The next implementation surface must own valve state,
   pressure gradient, flow, and chamber-volume commit together, not merely
   soften the diode projection after candidate flow computation.
   Phase 5CJ then tests an AV valve state-coupled complementarity ordering.
   The asymmetric TV-only legacy-atria candidate is the first strong partial
   positive in this sequence (gross 6/8; LV/RV PV 8/8; TVF 8/8; MVF 6/8), but
   it still fails low-preload HR75 and contractility-low HR75 through MV
   valve-diode residuals and does not transfer to all-chamber user-0. Treat it
   as diagnostic component evidence. The next surface should narrow to the
   remaining left-sided MV pressure/valve-load complementarity residual while
   preserving the 5CJ PV and TVF gains.
   Phase 5CK carries that ordering forward with an MV pressure-refit diagnostic.
   The best legacy-atria candidate reaches 7/8 gross pass with LV/RV PV 8/8,
   TVF 8/8, MVF 7/8, settled 8/8, output preserved 7/8, and a single remaining
   `low-preload-hr75` MV valve-diode residual with qDot hits still zero. This is
   the strongest morphology signal in the transaction sequence, but it still
   does not transfer cleanly to all-chamber user-0 (2/8) and does not support
   runtime/default adoption. The next surface should narrow to the remaining
   low-preload left-sided MV residual while preserving the 5CK PV/TVF/MVF gains,
   or pivot to a broader pressure-adapter contract if that residual cannot be
   solved without fitting one point.
   Phase 5CL then tests a two-pass MV fixed-point pressure refit and initially
   appears to produce the first 8/8 legacy-atria full-envelope pass. Phase 5CM
   fixes the hygiene gaps before that evidence is used: normalized transaction
   options now preserve MV pressure-refit iterations/relaxation, each fixed-point
   inner residual is evaluated from the pre-step MV flow state rather than
   advancing MV flow through multiple physical timesteps, and the artifact
   records requested/effective settings for fixedpoint1/2/3/3-relax07 plus
   user-0 transfer. Configuration integrity is clean (`0/9` mismatches), but
   the true same-step fixed-point evidence collapses: best legacy-atria is
   `tv-state-mv-fixedpoint3-relax07-legacy-atria` at gross 3/8 with LV/RV PV
   8/8, TVF 8/8, MVF 3/8, output 7/8, and MV valve-diode residuals still
   dominant; user-0 transfer is 0/8. Treat the 5CL 8/8 signal as
   over-supportive diagnostic history, not as a path to preserve.
   Phase 5CN then adds an accepted-state AV valve boundary mode that solves
   MV/TV flow from the pre-step valve flow, accepted chamber pressures, and
   accepted valve state. This is a real step forward relative to 5CM
   (`accepted-av-boundary-legacy-atria` reaches gross 5/8 with LV/RV PV 8/8,
   MVF 6/8, TVF 6/8, output 7/8), but it still leaves MV/TV diode-classified
   residuals and transfers to all-chamber user-0 at only 0/8. Treat it as
   partial component evidence, not a runtime/default candidate. The next
   surface should broaden the chamber-owned pressure/valve/load complementarity
   or pressure-adapter contract, not another pointwise MV refit escalation or a
   LandAtrial transfer lane.
   Phase 5CO then tests accepted-state AV valve fixed-point complementarity
   with clean requested/effective settings (`0/8` mismatches). It does not
   materially unlock the envelope: best legacy-atria remains gross 5/8, LV/RV
   PV 8/8, MVF 6/8, TVF 6/8, output 7/8, and user-0 transfer remains 0/8.
   Residuals improve only to `13/16` clean-biphasic with three remaining
   valve-diode/qDot-classified failures. Treat accepted-state local valve
   complementarity as exhausted for now. The next surface should change the
   chamber pressure/valve-load contract itself.
   Phase 5CP then tests bounded active-pressure geometry gain as that
   pressure/load contract surface. It is also not enough: best bounded
   pressure-contract legacy-atria candidate is gross 4/8, below the Phase 5CO
   accepted-complementarity baseline at 5/8, and the all-chamber user-0 transfer
   remains only 2/8. Treat scalar active pressure gain capping as exhausted for
   now; the next surface must be a broader chamber pressure/valve/load
   transaction, not another local pressure-gain cap.
   Phase 5CQ adds accepted-boundary-specific AV diagnostics to prevent residual
   attribution from reading stale or non-accepted flow fields. It does not
   improve the accepted-complementarity envelope (legacy-atria stays gross 5/8
   and user-0 transfer stays 0/8), but it changes residual interpretation in
   3/16 accepted legacy-atria AV readbacks and 13/16 accepted user-0 readbacks.
   Future accepted-state AV residual claims must use the accepted-boundary
   qDot/diode/complementarity fields, not standard valve sample fields alone.
   Phase 5CR then tests whether side-local AV+semilunar pair fixed-point
   ownership can broaden the contract without moving to a full residual solve.
   It does not: the pair-coupled legacy-atria candidate drops to gross 0/8
   versus the Phase 5CO accepted-complementarity baseline at 5/8, and
   all-chamber user-0 transfer remains 0/8. Treat side-local pair fixed-point
   valve-load ownership as exhausted too.
   Phase 5CS then recomputes source-state pressure inside a side-local
   residual relaxation contract and fails even the normal-HR75 smoke
   (`accepted-complementarity legacy 1/1`, residual-contract legacy 0/1,
   residual-contract user-0 0/1), with enough runtime cost that a full envelope
   is not worth running for this surface.
   Phase 5CT then adds LV/RV pressure decomposition readbacks. It confirms that
   raw user-0 and LV/RV Land legacy-atria PV failures carry active/mixed
   pressure residuals, but the accepted-complementarity surface already clears
   LV/RV PV sides to 8/8; the remaining accepted-surface blocker is AV inflow
   and all-chamber user-0 transfer.
   Phase 5CU then localizes that user-0 transfer residual: simple AV-plane
   off is not an adoption path, but LA AV-plane off repairs MVF to 8/8 and
   both LA/RA off improves gross to 5/8, so AV-plane release timing is a real
   contributor that must be redesigned statefully/asymmetrically rather than
   retuned as a static gain.
   Phase 5CV adds the stateful/asymmetric release hook and Phase 5CW adds an
   inlet-open release-hold option. The combined evidence is partial-positive
   for MV-side user0 transfer only: current user0 remains gross 0/2 in the
   5CW targeted smoke, while both-stateful/LA-held/both-held release reaches
   gross 1/2 and MVF 2/2, but TVF remains 1/2 through accepted-boundary
   diode/qDot residuals. Carry the release-hold hook as component evidence, but
   do not treat it as a runtime/default or atrial-physiology path.
   Phase 5CX then tests scalar adverse-gradient forward-flow braking inside the
   accepted-boundary path and records it as exhausted: scale 0 removes the
   measured complementarity leak in the failed TV point, but TVF still fails
   1/2 through an accepted-boundary diode/qDot-classified extra wave. Do not
   continue scalar braking/limiter variants; the next useful surface is a
   physical valve-state/pressure-flow contract.
   Phase 5CY adds that projected valve-state pressure-flow contract and shows a
   strong representative-envelope signal: user0 improves from gross 4/8
   (MVF 8/8, TVF 4/8) to gross 7/8 (MVF 8/8, TVF 7/8). The remaining gross
   failure is the `contractility-low-hr75` TVF residual, still
   accepted-boundary diode/qDot-classified. This is component evidence only:
   LAP/RAP pressure timing still fails all 8/8 user0 points.
   Phase 5CZ adds the direct normal-sinus AV timing guard requested by owner
   visual review: `left-av-delay` and `right-av-delay` compare LA/RA active
   peak timing against the LV/RV pressure upstroke and are folded into the
   LAP/RAP badges. The direct delay gate is not the current blocker
   (`current user0 7/7 measured`, 1 unsettled point; `valve-pressure-flow
   user0 8/8`), but pressure-waveform timing remains blocked (`0/7` and
   `0/8`). Therefore old screenshots showing excessive LA-to-LV separation
   would now be caught directly, but current atrial pressure morphology is
   still not accepted and LandAtrial calibration stays locked.
   Phase 5DA then localizes the remaining Phase 5CY `contractility-low-hr75`
   TVF residual with a narrow extra-wave window. The failed TVF point has a
   mid-diastolic extra forward wave (`theta≈0.7725`) but the local window has
   zero accepted diode hits, zero qDot clamp hits, zero complementarity leak,
   and zero RA AV-plane correction range in the user0 pressure-flow candidate.
   This revises the coarse Phase 5CY residual label: the remaining TVF blocker
   is not an instantaneous diode/qDot event or static RA AV-plane release; it
   is a mid-diastolic pressure-flow coasting/energy-consistency problem in the
   right AV valve/load contract.
   Phase 5DB fixes the stateful LandAtrial AV-plane release hygiene gap: atrial
   `internal.r` is shared by reservoir-branch volume state and stateful
   AV-plane descent fraction, but `sanitizeState()` had clamped it with the
   reservoir-stroke upper bound even when reservoir-branch mode was disabled.
   With current LandAtrial reservoir stroke zero, the Phase 5CV/5CW stateful
   descent coordinate was therefore clamped to zero every step. The fix uses a
   0..1 upper bound only for non-reservoir stateful AV-plane release, preserves
   the reservoir-branch bound otherwise, and records
   `avplane-state-hygiene-phase5db-result-v1`: pressure-flow and
   accepted-complementarity stateful inlet-held variants both measure 2/2
   settled/health-ok points with LA/RA stateful flag 2/2, nonzero LA/RA
   descent/correction 2/2, and requested/effective mismatch 0. Therefore the
   Phase 5DA zero RA AV-plane correction in the failed TVF extra-wave window is
   local coasting/timing evidence, not a global state persistence/readback
   failure. This does not unlock LandAtrial tuning or atrial physiology
   acceptance.
   Phase 5DC records
   `post-hygiene-pressure-flow-envelope-phase5dc-result-v1`, rebuilding the
   Phase 5CY full representative envelope and Phase 5DA targeted residual after
   the Phase 5DB stateful AV-plane state fix. The user0 pressure-flow frontier
   persists at gross 7/8 with MVF 8/8 and TVF 7/8, and the remaining failed
   point remains `contractility-low-hr75` TVF. The targeted window keeps the
   same qualitative interpretation: extra wave at `theta≈0.7775`, zero
   accepted diode hits, zero qDot clamp hits, and zero complementarity leak.
   RA AV-plane correction is now globally/statefully nonzero after 5DB, but
   this does not rescue the local TVF extra-wave window. Treat the next surface
   as right AV pressure-flow coasting/energy consistency, not AV-plane state
   persistence, LandAtrial parameter tuning, valve-threshold tuning, qDot, or
   root/Zc work.
   Phase 5DD records
   `right-av-energy-coasting-phase5dd-result-v1`, adding an off-by-default
   accepted-state valve-pressure-flow `energy-coasting` cap that refuses
   same-step forward-flow acceleration when the current pressure gradient does
   not exceed the current-flow R/B loss. It does not improve the frontier:
   baseline user0 pressure-flow plus inlet-held AV-plane release remains
   gross 7/8 (LV/RV PV 8/8, MVF 8/8, TVF 7/8), and energy-coasting user0 is
   identical at gross 7/8. The remaining failed point is still
   `contractility-low-hr75` with TVF plus LA/RA pressure timing failure; the
   extra TVF wave remains at `theta≈0.7775` with zero accepted diode hits,
   zero qDot clamp hits, zero complementarity leak, and positive accepted
   pressure gradient/area readbacks. Therefore the residual is not solved by a
   scalar pressure-loss coasting cap. Treat the next surface as right AV valve
   openness/state decay or a broader AV valve boundary contract, not as
   energy-loss retuning, LandAtrial parameter tuning, valve-threshold tuning,
   qDot, root/Zc, Tref, or source-stress work.
   Phase 5DE records `tv-pressure-deadband-phase5de-result-v1`, testing
   off-by-default TV accepted-boundary pressure deadband and deadband-close
   variants at 0.35/0.60mmHg over the same representative envelope. This also
   does not improve the frontier: baseline, deadband, and deadband-close user0
   variants all remain gross 7/8 with LV/RV PV 8/8, MVF 8/8, TVF 7/8, and the
   same `contractility-low-hr75` TVF plus LA/RA pressure-timing failure. The
   close variants lower the extra-wave window's TV accepted valve state only
   modestly (`~0.64` to `~0.59`) and still leave a three-peak TVF trace. Do not
   continue scalar TV pressure-deadband/threshold variants; the remaining
   right-AV residual needs a broader AV valve boundary contract or profile/
   physiology classification, not a one-parameter valve-state patch.
   Phase 5DF records `tvf-phase-attribution-phase5df-result-v1`, targeting
   normal-HR75 and the remaining `contractility-low-hr75` failure under the
   current user0 pressure-flow plus inlet-held AV-plane release closure. It
   classifies the TVF residual as a true mid-diastolic extra wave, not an
   atrial-kick phase-window artifact: the failed point has QTV E at
   `theta≈0.5625`, an extra wave at `theta≈0.7775` while RA active state is
   near zero, and a separate A wave at `theta≈0.9525`; the direct right AV
   delay remains plausible (`~182ms`). Therefore do not loosen the TVF window
   or treat this as an early A wave. The remaining right-sided blocker is a
   pressure-flow/valve-load/atrial-pressure boundary problem during diastasis;
   the broader AV boundary contract remains the next model surface.
   Phase 5DG records `right-av-passive-diastasis-guard-phase5dg-result-v1`,
   testing an off-by-default accepted-boundary passive-diastasis guard that
   refuses small-gradient forward-flow reacceleration when atrial active state
   is low. This does not improve the frontier: baseline user0 pressure-flow
   plus inlet-held AV-plane release remains gross 7/8 (MVF 8/8, TVF 7/8), and
   the best TV-only guard at 0.50mmHg is also gross 7/8 with the same
   `contractility-low-hr75` TVF residual. The guard applies in the failed
   window (`~0.0875` duty for the best variant) but does not remove the extra
   wave; therefore the residual is not a simple passive reacceleration problem
   that can be solved by scalar gradient/active-state gating. Continue toward a
   broader AV valve/load/complementarity boundary contract rather than another
   scalar deadband/coasting/passive-guard variant.
   Phase 5DH records `av-forward-momentum-projection-phase5dh-result-v1`,
   testing an off-by-default valve-area forward-momentum projection inside the
   accepted-boundary pressure-flow step. Unlike the scalar Phase 5DD/5DE/5DG
   variants, the TV-only projection improves the current user0 all-chamber
   frontier to gross 8/8 over the representative normal-sinus envelope with
   LV/RV PV 8/8, MVF 8/8, and TVF 8/8. The targeted
   `contractility-low-hr75` TVF failure becomes OK; the projection duty in that
   TV window is measurable (`~0.195`, impulse integral `~0.63 ml/s`). This is
   strong component evidence that the remaining residual is an AV valve
   forward-momentum/area ownership problem. It is not runtime/default adoption:
   the candidate is a local projection surface, output-preserved remains 7/8
   under the simple envelope criterion because the low-contractility point has
   low CO by design, and owner visual trace review plus bounded-duty/energy
   readbacks are still required before any shadow/default claim.
   Phase 5DI records
   `av-forward-momentum-contract-review-phase5di-result-v1` and writes an owner
   visual review bundle to
   `~/Downloads/0dsim-morphology-review-phase5di/index.html`. It adds explicit
   accepted-boundary forward-momentum area-scale, ceiling, and excess readbacks
   so the Phase 5DH lead can be judged for overcorrection rather than by
   gross-pass count alone. The TV-only projection remains gross 8/8 over the
   representative normal-sinus envelope (LV/RV PV 8/8, MVF 8/8, TVF 8/8), with
   max TV projection duty `~0.288` and max mean absolute impulse `~0.72 ml/s`.
   The classification is `visual-review-required-before-adoption`: this is a
   strong boundary-contract lead, not runtime/default adoption, and the next
   step must wait for owner visual acceptance of the raw trace bundle before
   formalizing a shadow/default contract.
   Phase 5DJ records `pv-dome-concavity-gate-phase5dj-result-v1`, promoting
   the owner visual rejection of the Phase 5DI raw PV traces into the standing
   morphology checker. The old ventricular PV check counted only prominent
   peaks/troughs and roughness, so broad systolic mid-ejection valleys with late
   rebound could pass as "single-peaked." The updated checker evaluates the
   ejection core by normalized ejected volume and fails broad rebound/positive
   curvature. Rechecking the same Phase 5DI closure now invalidates the old
   gross-pass interpretation: the TV forward-momentum projection is LV PV 0/8,
   RV PV 0/8, and gross 0/8, while MVF remains 8/8 and TVF remains 8/8. Treat
   Phase 5DH/5DI as an AV inflow residual lead only, not PV-loop morphology
   acceptance. The next model surface must restore a visually acceptable LV/RV
   systolic dome under this stricter raw-trace gate before any forward-momentum
   or AV boundary contract can be considered for shadow/default adoption.
   Phase 5DK records `av-inflow-kink-gate-phase5dk-result-v1`, promoting the
   owner visual rejection of the Phase 5DI QTV projection into the standing AV
   inflow checker. The old AV flow check counted diastolic E/A peaks but did
   not score visible C1 breaks, so a kinked E-wave or forward-momentum plateau
   could pass as biphasic. The updated checker adds wave-level kink/slope-jump
   scoring. Rechecking the same Phase 5DI closure shows that the TV projection
   is not an AV inflow acceptance path either: baseline is MVF 6/8 and TVF 4/8,
   while projection is MVF 6/8 and TVF 3/8 with gross still 0/8. This preserves
   the owner judgment that QTV baseline is visibly better than projection and
   QMV remains not decided by this visual comparison. Do not formalize the
   forward-momentum projection while it worsens TVF smoothness relative to the
   baseline; the next AV boundary work must avoid creating C1-discontinuous
   inflow waves, not merely remove the third peak.
   Phase 5DL records `morphology-check-v11-phase5dl-result-v1`, closing the
   checker-hygiene caveats before the next model surface. The PV dome rebound
   and curvature guard now evaluates only the post-primary-peak ejection core
   and treats sparse dome cores as unevaluable failures rather than silent
   passes. The AV inflow kink guard now takes circular wave segments, so A waves
   crossing the beat boundary are checked instead of clipped. Rechecking the
   Phase 5DI bundle under this V1.1 hygiene preserves the owner visual
   rejection and is stricter than the earlier 5DK counts: baseline is gross
   0/8 with LV PV 1/8, RV PV 3/8, MVF 6/8, TVF 4/8; the TV forward-momentum
   projection is gross 0/8 with LV PV 1/8, RV PV 2/8, MVF 6/8, TVF 2/8.
   Treat the pressure-flow/inlet-held frontier and forward-momentum projection
   as rejected morphology candidates under the standing raw-trace checker.
   Forward momentum remains a subsystem lead only; the next model work should
   be a stateful AV valve pressure-flow/area/momentum contract, not more
   projection, deadband, qDot, root/Zc, Tref, source-stress, or LandAtrial
   tuning.
   Phase 5DM records
   `av-valve-boundary-contract-v2-phase5dm-result-v1`, an off-by-default
   stateful AV valve pressure-flow/loss/inertance contract that changes the
   accepted-boundary flow equation itself rather than post-projecting `q`.
   It confirms that the forward-momentum/area-memory lead is real but not a
   morphology acceptance path. Under the strict Phase 5DL morphology V1.1 gate,
   the baseline inlet-held pressure-flow frontier remains gross 0/8 (LV PV
   1/8, RV PV 3/8, MVF 6/8, TVF 4/8, output 7/8), while the best V2 candidate
   (`stateful-v2-tv-loss12-inertance4`) remains gross 0/8 but improves AV
   inflow to MVF 7/8 and TVF 7/8 with bounded measurable TV V2 duty
   (`max duty ~0.035`, `max lossScale ~9.14`). This is component evidence for
   stateful valve pressure-flow ownership, not adoption: the PV dome/rebound
   blocker still dominates, pressure timing still fails, and LandAtrial tuning
   remains locked. The next model phase should preserve this AV inflow lead but
   move to the systolic PV dome side of the same chamber/load contract, rather
   than adding more AV projection/deadband/scalar guards.
   Phase 5DN records `pv-dome-attribution-phase5dn-result-v1`, a disposable
   attribution run testing whether a simple 2x temporal substep explains the
   strict PV dome blocker before adding another model surface. It does not
   support solver-substep adoption. On the 4-point focused attribution surface,
   baseline pressure-flow remains LV/RV PV 1/4 and 1/4 with MVF 3/4 and TVF
   2/4; adding the 2x substep improves RV PV to 3/4 but leaves LV PV at 1/4
   and worsens TVF to 1/4. The Phase 5DM stateful V2 TV lead improves TVF to
   3/4 without improving LV/RV PV (1/4 and 1/4), while V2 plus substep again
   improves only RV PV (3/4) and trades TVF down to 2/4. The substep also does
   not reduce the LV positive-curvature burden (`meanLvPositiveCurvature` rises
   from `~0.113` to `~0.142` in baseline pressure-flow). Classify this as
   `temporal-substep-rv-only-partial-lv-blocked`: useful evidence that some RV
   dome failure is time-discretization sensitive, but the dominant LV systolic
   dome/curvature failure requires a systolic pressure/outlet-load/source-state
   ownership contract. Keep the V2 AV inflow lead, but do not unlock
   LandAtrial tuning, runtime/default adoption, solver substepping, qDot/rootZc,
   valve-threshold, Tref, or source-stress tuning from this evidence.
   Phase 5DO records `systolic-outflow-contract-phase5do-result-v1`, adding
   off-by-default semilunar accepted-state pressure-flow/loss/inertance
   ownership plus AoV/PV accepted-boundary readbacks and testing selected
   candidates over a 6-point systolic-focused morphology envelope. This is a
   larger structural test, not a compatibility/default path. The candidate
   surface does not improve the strict morphology frontier: baseline remains
   gross 0/6 (LV PV 1/6, RV PV 2/6, MVF 4/6, TVF 2/6), semilunar pressure-flow
   remains gross 0/6 with the same LV/RV PV counts and only TVF 3/6, semilunar
   stateful V2 remains gross 0/6 and regresses RV PV to 1/6 while improving MVF
   to 5/6, and AV V2 plus semilunar V2 remains gross 0/6 with TVF 5/6 but RV PV
   1/6. Semilunar stateful duty is bounded and measurable, but the strict PV
   dome positive-curvature burden does not fall (`meanLvPositiveCurvature`
   baseline `~0.118`, semilunar pressure-flow `~0.164`, semilunar V2 `~0.154`).
   Treat this as a no-go for semilunar valve-law-only repair. Preserve the
   readbacks and AV V2 component lead, but the next model surface must move up
   to a chamber pressure/accepted volume/source-state/outlet-load contract;
   do not continue scalar semilunar loss/inertance sweeps, solver substeps,
   qDot/rootZc/valve-threshold/Tref/source-stress tuning, or LandAtrial tuning.
   Do not use global zeta-disablement, qDot/root/Zc/valve retuning, Tref,
   source-stress scaling, pressure-source lag, fixed-point BE, coupled Newton
   wrappers, reference-geometry pressure mapping, bounded pressure-gain capping,
   local LV/RV transaction wiring, side-local pair fixed-point flow ownership,
   side-local source-state residual relaxation, or LandAtrial parameter tuning
   to hide the PV double-dome and AV inflow artifacts. The next implementation
   surface should preserve accepted-boundary and LV/RV pressure-decomposition
   readbacks while focusing on AV inflow residuals and all-chamber user-0
   transfer, not another post-hoc refit, local fixed-point variant, or PV
   dome-only decomposition.
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
