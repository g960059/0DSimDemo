# Current Development Lanes

Status: active routing note
Scope: coordination only; evidence lives in PRs, artifacts, and git history.

## Execution Policy

- Production is still unpublished with zero users. Use an internal
  staged-replacement bar, but do not claim physiology acceptance without gates.
- Oracle direction checks are disabled by owner instruction. Use local measured
  evidence, code review, and owner-provided reviews.
- Keep status docs compact. Do not paste external reviews or phase narratives
  here. Store detailed counts in PR bodies and JSON artifacts.
- New diagnostics are disposable by default. Promote only forward invariants to
  standing gates.
- The earlier one-PR stop condition is removed by owner instruction. Continue
  MechanicsCore2 architecture work through measured gates and evidence
  boundaries; do not pause solely because one phase is mixed.
- Strict raw morphology remains authoritative for user-visible model quality:
  LV/RV PV dome/rebound/curvature, MVF/TVF E/A and kink checks, LA/RA PV, and
  pressure timing. Owner visual rejection overrides any old gross-pass number
  until the checker is hardened to match it.

## Current Frontier

### Physiology Audit Gate Team

Objective: develop report-only physiology-aware morphology audit gates in
parallel with the MechanicsCore2 model team. This lane owns
`engine/diagnostics/morphology`, `tools/diagnostics`, and physiology-audit
artifacts/docs. It must not modify MechanicsCore2 source/reservoir contracts,
runtime wiring, AV-plane, LandAtrial, or existing strict morphology acceptance.

Current state: `MorphologyGatePhysiologyAuditV1` is being introduced as a
shadow/report-only layer that separates universal artifact guards, AV inflow
pattern classification, and profile-specific expectations. Profile-aware
relaxation cannot affect current gates until strict normal baseline morphology
is earned and owner visual review accepts the baseline pack.

Next action: connect the shadow audit to future visual-review packs and real
trace artifacts without changing strict gate outcomes. Keep all disease
profiles report-only.

### MechanicsCore2 / CircAdapt-lite Sidecar

Objective: pivot from the exhausted `ModelCore + Land boundary-contract patch`
lane to a sidecar mechanics architecture inspired by CircAdapt-like
chamber/valve/load ownership without copying CircAdapt source or claiming
equivalence.

Current sidecar state: `PR-M2-0+1`, `PR-M2-2+3`, `PR-M2-4+5`, the
left-heart fiber-timing attribution surface, and the first left-heart V2
transaction architecture comparison, residual attribution, semilunar/root
outflow repair, pulmonary-boundary/safety-suction comparisons,
output-reserve calibration and dynamic reserve contract comparisons, paired
left/right smoke, source-pressure bridge smoke, reservoir-ledger bridge smoke,
same-profile reservoir-solver bridge smoke, and reservoir-solver attribution
are implemented. The explicit reservoir-state, Gate C volume-reserve scaffold,
four-chamber assembly contract, assembly smoke, and first epoch-level
four-chamber subsystem smoke are also implemented.

Next PR target: change the AV-plane mechanism timing/ownership, not scalar
reservoir tuning. The first closed-loop traction transaction produces
blood-volume LA PV opposed lobes 7/7 and `dt-half` opposed lobes 7/7 with
hidden-volume cleanliness preserved, while flow-only, traction-only, and
wrong-sign traction controls are 0/7. Finite pressure-drive smoothing reduces
the raw traction pressure step to 31% of the velocity-traction reference, but
source-surface pass falls from 4/7 to 2/7 and no finite-drive variant preserves
both raw topology and source status. Explicit AV-plane coordinate readbacks
using `F = pressure * annular area` and `work = F * ds` keep the raw topology
lead at 7/7, source surface at 4/7, MVF clean at 4/7, expose finite s/e/a-prime
readbacks 7/7, and close coordinate volume/work consistency to zero error; the
same artifact reports max observed displacement 9.48 mm, max velocity
19.28 cm/s, max traction force 4.28 N, max positive power 0.83 W, and max
positive work 0.026 J. A first explicit force/position state
(`force4-stiff2-damp06-mass035`) lowers max positive power to 0.076 W and keeps
hidden-volume/work closure clean 7/7, but falls to source 2/7, topology 5/7,
and MVF clean 3/7; faster higher-force variants reach topology 6/7 only by
dropping source/MVF further. A velocity-target stateful traction timing review
keeps opposed-lobe topology 7/7 and lowers the traction pressure step from
15.21 to 5.00 mmHg, but falls from source/MVF 4/7 to 3/7 and has zero variants
that preserve raw topology and source together. This is still not morphology acceptance: source
surface and MVF cleanliness remain incomplete, visual review still shows
traction/transition artifacts, and runtime wiring, runtime AV-plane enablement,
pressure substitution, broad reservoir retuning, and LandAtrial re-entry remain
blocked.
Warm-replay lobe attribution, separated-state smokes, dual-lobe geometry,
flow-oriented LA filling-rate drive, hidden-volume-free AV-plane ejection-rate
reservoir oracles, AV-plane reservoir capacity/stretch + booster/wall-work,
explicit pulmonary venous reservoir inflow, atrial wall reference-volume shift,
pressure-capacity transfer, and two-state reservoir recoil all show source/MVF,
v-loop area, or effective-stretch signals, but do not produce accepted
blood-volume opposed-lobe quality. Do not relax the blood-volume LA PV gate.
Direct atrial pressure substitution, additive atrial active-pressure source
substitution, direct AV-gradient injection, more fixed source-state variant
sweeps, readback-only geometry overlays, simple LV-shortening
effective-geometry transactions, display-only piston volume, phase-pressure
oracles, more scalar reservoir/reference/capacity sweeps, runtime wiring,
reservoir broad retuning, runtime AV-plane enablement, and LandAtrial re-entry
remain blocked. For atrial work, pressure parity, MVF cleanup, larger v-loop
area, source/MVF improvement, or self-crossing PV loops alone are insufficient:
normal-sinus acceptance must preserve atrial PV figure-eight opposed-lobe
quality and eventually expose AV-plane velocity/a-prime readbacks.

Detailed plan: [MechanicsCore2 / CircAdapt-lite execution plan v3](../mechanics2/MechanicsCore2_CircAdaptLite_ExecutionPlan_v3.md).

Included:

- `engine/mechanics2` sidecar skeleton.
- `TraceFixtureV1` prescribed-length fixture contract.
- `HillSeriesFiberV1` with mechanical activation state `a` (not calcium).
- Pre-registered `hill-series-fiber-replay-gate-v1.yaml`.
- Isolated replay bench and tiny deterministic smoke test.
- Sharpness metrics V1 for sidecar broadness/kink QA.
- Existing valve audit V1.
- OneFiberChamber prescribed-volume pressure mapping bench.
- FlowStateValve prescribed-gradient bench.
- Minimal LeftHeartSubsystem strategic smoke with LA compliance, LV
  one-fiber chamber, FlowStateValve MV/AoV, and root load.
- MechanicsTransactionV2 and LeftHeartSubsystemV2 sidecar architecture scaffold
  with explicit/fixed-point accepted-state modes and hard-clamp/soft-pressure
  safety surfaces.
- LeftHeartResidualAttributionBench V1 for the remaining `v2-fixed2-soft`
  afterload-high, contractility-low, and contractility-high residuals.
- LeftHeartOutflowRepairBench V1 for semilunar/root variants with last-two-beat
  repeatability and `dt/2` sensitivity guards.
- LeftHeartPulmonaryBoundaryContractBench V1 for finite pulmonary venous node
  and lower-bound safety-suction/semilunar-load attribution.
- LeftHeartOutputReserveCalibrationBench V1 for static output-reserve
  calibration and external active-length blend attribution.
- LeftHeartDynamicReserveContractBench V1 for MV closure-state drive,
  high-pressure/stateful root runoff drive, split LA/LV hard-clamp readbacks,
  hard-floor versus flow-volume decoupling attribution, and the owner-approved
  clean low-contractility low-output phenotype policy.
- RightHeartSubsystemV2 and RightHeartStrategicSmokeBench V1 for the first
  RA/RV/TV/PV/PA sidecar smoke.
- RightHeartReserveCalibrationBench V1 for RV pressure mapping reserve and
  lower-bound soft-suction separation.
- PairedHeartStrategicSmokeBench V1 for side-by-side left/right Gate B surface
  compatibility without circulation coupling.
- CirculationBridgeSmokeBench V1 for source-pressure bridge feedback between
  the passed left/right surfaces.
- ReservoirBridgeSmokeBench V1 for black-box pulmonary/systemic reservoir
  ledger feedback between the passed left/right surfaces.
- ReservoirSolverBridgeBench V1 for same-profile scalar reservoir transfer
  solves between the passed left/right surfaces.
- ReservoirSolverAttributionBench V1 for `contractility-low` residual and
  large accepted transfer classification.
- FourChamberSubsystemV1 and FourChamberSubsystemSmokeBench V1 for the first
  epoch-level sidecar four-chamber subsystem smoke.
- FourChamberSubsystemResidualReviewBench V1 for nominal, `dt-half`, and
  long-epoch residual/numerics review of the selected scaffold.
- PreloadLowReservoirNumericsScanBench V1 for the focused `preload-low`
  reservoir gain/compliance scan.
- SourceSurfaceDtHalfStabilityScanBench V1 for small standalone left/right
  source-surface `dt-half` candidate perturbations after reservoir pressure
  tuning is closed as the next fix.
- SourceSurfaceTimeIntegrationAttributionBench V1 for classifying remaining
  source-surface residuals into shape dt-parity, output reserve, and
  settling/repeatability owner classes.
- SourceSurfaceSamplingParityBench V1 for checking source-surface shape
  dt-parity on a phase-aligned sampling grid before treating it as a model
  residual.
- SourceSurfaceContractBench V1 for applying phase-aligned source shape parity,
  checking left load-conditioned output reserve, and classifying right
  preload-low source settling/repeatability.
- RightPreloadOutflowOwnershipBench V1 for the focused PV outflow
  pressure-flow/loss ownership signal on right preload-low source
  repeatability.
- FourChamberPvOutflowTransferReviewBench V1 for checking whether the
  standalone right-preload PV outflow lead can transfer directly into the
  selected four-chamber scaffold.
- FourChamberSourceAwareResidualReviewBench V1 for reclassifying selected
  four-chamber residuals against the source-surface contract and right-preload
  PV outflow ownership evidence.
- FourChamberSourceAwareContractBench V1 for applying source-aware status
  ownership as a contract layer over the selected four-chamber residual review.
- FourChamberSourceAwareContractSmokeBench V1 for the bounded source-aware
  four-chamber contract smoke and its remaining reservoir-repeatability blocker.
- PreloadLowReservoirRepeatabilityAttributionBench V1 for focused epoch-history
  attribution of the remaining preload-low reservoir blocker.
- BoundedReservoirVolumeOwnershipBench V1 for the targeted bounded
  reservoir-volume ownership signal on the preload-low long-epoch blocker.
- FourChamberBoundedReservoirContractSmokeBench V1 for applying bounded
  reservoir-volume ownership to the full source-aware smoke envelope.
- FourChamberBoundedReservoirDynamicsReviewBench V1 for limiter-duty review of
  the bounded reservoir-volume scaffold.
- FourChamberSmoothReservoirOwnershipBench V1 for smooth compatibility
  feedback candidates that preserve the source-aware smoke while reducing
  hard-bound fallback duty.
- FourChamberSmoothReservoirDynamicsReviewBench V1 for the selected smooth
  scaffold's limiter, passivity, knee, and extended stress repeatability review.
- FourChamberSmoothReservoirAssembledNumericsReviewBench V1 for assembled
  source/reservoir numerics review and `dt-half` reservoir magnitude parity.
- PreloadLowDtHalfReservoirParityAttributionBench V1 for classifying the
  localized `preload-low` `dt-half` reservoir magnitude parity residual.
- PreloadLowSourceDtInputNormalizationBench V1 for separating status-rate
  source evaluation from source-ledger forward-ejection input on the localized
  residual.
- FourChamberSourceDtInputNormalizedAssembledReviewBench V1 for applying
  source-ledger input normalization to the full selected smooth-reservoir
  assembled envelope.
- FourChamberSourceReservoirContractReviewBench V1 for promoting smooth
  reservoir dynamics plus source-ledger input normalization into a
  source/reservoir contract signal while preserving raw status-rate failures.
- AtrialFiberPackV1 and AtrialFiberPackPrescribedVolumeBench V1 for the first
  CircAdapt-lite style LA/RA one-fiber wall readiness signal without AV-plane
  geometry or piston-volume coupling.
- AtrialFiberPackClosedLoopReplayBench V1 for AV-plane-off closed-loop LA/RA
  volume replay without atrial pressure substitution.
- AtrialPressureParityAttributionBench V1 for classifying the focused LA
  pressure-parity residual before any pressure-substitution path.
- DecomposedLaPressureContractBench V1 for a shadow decomposed LA pressure
  signal that keeps source/reservoir filling baseline separate from atrial
  fiber active pulse.
- LaLatePeakResidualAttributionBench V1 for classifying the decomposed LA
  pressure contract's non-focused late-peak residuals before shadow
  substitution.
- LaPressureShadowSubstitutionBench V1 for shadow MV valve replay using the
  decomposed LA pressure contract without source-surface or runtime commit.
- LaActivePulseMvReplayRefinementBench V1 for classifying active-pulse shaping
  variants before any LAP source-surface substitution.
- LaPressureSourceSubstitutionCandidateBench V1 for testing the selected
  `fiber-active-a-window-gated` pulse as a closed-loop left-heart LA pressure
  source substitution candidate and keeping that path blocked when MVF E/A
  collapse remains visible.
- LaPressureSourceResidualAttributionBench V1 for classifying that source
  substitution residual as closed-loop MVF E/A collapse with preserved forward
  volume/output, no new clamp, no pulse gross-timing drift, and no late-gradient
  erosion.
- AtrialFiberSourceReservoirShadowReplayBench V1 for source/reservoir
  pressure-conditioned LA/RA AtrialFiber shadow replay with finite bounded
  late-active readbacks while pressure substitution remains blocked.
- AvValveAtrialGradientShadowBench V1 for confirming that simple atrial active
  gradient injection into shadow MV/TV replay is blocked even though the
  AtrialFiber source/reservoir shadow readbacks are finite and bounded.
- AvValveSourceStateContractShadowBench V1 for fixed-variant shadow replay
  where atrial active source state modifies AV valve open/closure/loss state
  without source pressure or gradient commit.
- AvValveSourceStateResidualAttributionBench V1 for classifying the fixed
  `source-open-memory` residual before any further source-state contract work.
- AvValveCyclicStateReplayBench V1 for checking whether accepted valve state
  carryover, rather than more atrial source-state tuning, preserves AV replay.
- AtrialFigureEightQualityAuditBench V1 for source/reservoir-conditioned LA/RA
  PV lobe-quality and a-prime-readback readiness auditing without pressure
  substitution or AV-plane enablement.
- AtrialLobeFailureAttributionBench V1 for warm-replay, closed-loop phase-lobe
  attribution of missing intersections, same-signed a/v lobes, and volume-order
  failures before the next lobe-generator design.
- StatefulLaChamberContractSmokeBench V1 for testing stateful LA chamber total
  pressure as a left-heart LA pressure source while AV-plane remains disabled.
- AVPlaneGeometryStateV1 disabled readback scaffold and
  AtrialChamberValveTransactionReadinessBench V1 for synthesizing atrial PV,
  stateful chamber, AV valve energy, and AV-plane velocity readiness evidence.
- LaMvSameStepTransactionReplayBench V1 for a local LA/MV same-step replay
  using AtrialFiber total pressure while LVP and pulmonary venous inflow remain
  baseline-forced.
- LaActivePressureAdditiveSourceBench V1 for testing whether adding AtrialFiber
  active pressure to the empirical LA pressure baseline can preserve left-heart
  source-surface behavior and LA PV lobe quality.
- LaMvAssembledTransactionSurfaceBench V1 for comparing same-step pulmonary
  reservoir, LA chamber, MV valve, and LV filling ownership surfaces while
  AV-plane remains disabled.
- LaMvAssembledResidualAttributionBench V1 for classifying whether the
  assembled surface residual is still transaction-owned or atrial lobe-quality
  owned.
- AtrialGeometryLobeShadowBench V1 for readback-only effective geometry and
  a-prime shadow evidence with no hidden blood-volume source.
- StatefulAtrialGeometryTransactionBench V1 for a left-heart candidate where
  LA effective geometry co-evolves inside the LA chamber/MV valve/LV filling
  step, still without runtime AV-plane enablement.
- AtrialLobeGeneratorContractBench V1 for display-piston, AtrialFiber-pressure,
  a-wave kick-pressure, and reservoir-suction pressure lobe-generator oracles
  without runtime wiring or blood-ledger mutation.
- StateOwnedAtrialLobeGeneratorBench V1 for a left-heart state-owned
  reservoir-suction drive inside the LA source surface, with source-surface,
  MVF, LA PV lobe-quality, hidden-volume, and a-prime readbacks.
- SeparatedAtrialLobeStateGeneratorBench V1 for a left-heart separated
  reservoir/booster state surface with source-surface, MVF, LA PV lobe-quality,
  hidden-volume, and a-prime readbacks.
- DualLobeChamberValveGeneratorBench V1 for a left-heart reservoir-capacity
  and booster-compression geometry state surface coupled to LA fiber pressure,
  MV pressure-flow, and LV filling while runtime AV-plane promotion remains
  blocked.
- FlowOrientedAtrialLobeGeneratorBench V1 for a left-heart filling-rate-driven
  reservoir lobe check plus visual PV-loop review bundle, showing flow gating
  preserves source/MVF surfaces but does not repair opposed a/v lobe quality.
- AVPlaneReservoirOracleBench V1 for a hidden-volume-free AV-plane
  ejection-rate reservoir oracle with lobe-orientation counts, showing
  a-prime/s-prime readbacks can be finite while same-signed lobes still
  dominate and the v-loop remains collapsed.
- AVPlaneReservoirCapacityTransactionBench V1 for a hidden-volume-free
  AV-plane reservoir capacity/stretch, booster compression, and wall-work
  transaction comparison. Best mixed signal improves left source-surface pass
  3/7->4/7 and MVF clean 3/7->4/7 with finite a-prime readbacks, but LA PV
  lobe quality remains 1/7 and same-signed v-loops dominate.
- AtrialPressureCapacityReservoirTransactionBench V1 for a closed-loop
  pressure-only AV-capacity plus rate-gated traction transfer check. The
  isolated traction topology signal does not transfer when venous inflow and
  MV pressure-flow are live, so runtime wiring, morphology acceptance,
  AV-plane enablement, a-prime physiology, and LandAtrial unlock remain
  blocked.
- AtrialTwoStateReservoirTransactionBench V1 for a closed-loop two-state
  AV-plane reservoir chamber contract that separates early capacity/suction
  acquisition from late reservoir recoil pressure. It preserves hidden-volume
  discipline and produces an area-only v-loop signal
  (`baselineMaxVLoopArea` 72.78 mL*mmHg,
  `maxSourcePreservingVLoopArea` 107.93 mL*mmHg), but LA PV lobe quality and
  opposed-lobe orientation remain 0/7. This is mixed topology evidence, not
  AV-plane promotion or morphology acceptance.
- AtrialReservoirTopologyOrientationAttributionBench V1 for comparing
  blood-volume, cavity-plus-capacity, and effective wall-stretch PV axes on the
  two-state surface. Blood-volume and cavity-plus-capacity axes show opposed
  lobes 0/105; effective wall-stretch shows 45/105 opposed rows and 25/105
  source-preserving opposed rows. This closes scalar pressure/recoil as the
  next fix and routes the next design toward explicit accepted atrial
  cavity/blood-volume reservoir coevolution while keeping the blood-volume
  figure-eight gate strict.
- AtrialAVPlaneTractionReservoirTransactionBench V1 for a closed-loop
  left-heart topology experiment where AV-plane descent traction and accepted
  pulmonary venous reservoir flow co-evolve inside the LA/MV/LV transaction.
  The selected `traction12-flow10-cap20` variant reaches blood-volume
  opposed-lobe topology 7/7 and `dt-half` topology 7/7 while source-surface
  preservation remains 4/7; flow-only, traction-only, and wrong-sign traction
  controls are 0/7. This routes the next atrial work to traction/source/MVF
  cleanup and owner visual review, not passive reservoir sweeps or AV-plane
  promotion.
- AtrialAVPlaneWorkConjugateReviewBench V1 for checking whether finite
  pressure-drive smoothing can remove the traction spike without losing the
  topology lead. It is no-go: the best finite-drive variant reduces max
  traction pressure step from 15.21 to 4.73 mmHg, but source-surface pass drops
  from 4/7 to 2/7 and MVF clean from 4/7 to 3/7. This closes pressure-drive
  smoothing as the next fix and routes the next design to an explicit AV-plane
  position/velocity/force coordinate with work-conjugate energy readbacks.

Excluded:

- Live runtime wiring.
- CircAdapt equivalence.
- Clinical validation.
- Runtime/default adoption.
- LandAtrial tuning unlock.
- OneFiberChamber closed-loop work.

Next gates:

1. Gate A: prescribed `lS(t)` Hill-series replay passed on the procedural
   fixture set. This is necessary-only evidence.
2. Gate A2: prescribed `V(t)` OneFiberChamber bench passed on the initial
   procedural LV/RV normal and wiggle fixtures: 4/4 pass, LV peak ~127 mmHg,
   RV peak ~35 mmHg, single-dome pressure shape. This unlocks valve/left-heart
   strategic smoke, not runtime adoption.
3. Gate B: FlowStateValve prescribed-gradient bench passed 4/4 and unlocked
   left-heart strategic smoke.
4. Gate B smoke: LeftHeartSubsystemV1 is mixed, not adoption evidence. Normal
   HR75 passes, LV PV shape is 7/7 OK, but the broad 7-point envelope is only
   1/7 pass.
5. Gate B attribution signal: replacing fixed pulmonary venous inflow with a
   pressure-flow boundary preserved normal HR75 and LV PV 7/7 while improving
   MVF OK 1->2 and output OK 2->4.
6. Gate B envelope-scaling signal: raising the exploratory LV safety bound and
   lowering pulmonary venous resistance improves LeftHeartSubsystemV1 to 2/7
   pass and output OK 6/7. HR90, low-preload, low-contractility, and
   high-contractility MVF remain failed. This is still attribution-only
   evidence, not broad MechanicsCore2 investment.
7. Gate B A-wave timing signal: parameterizing and delaying the LA A-wave window
   to theta 0.86-0.98 improves LeftHeartSubsystemV1 to 3/7 pass and MVF OK 3/7,
   adding afterload-high to the passing set. This is still attribution-only
   evidence.
8. Gate B LV fiber-timing perturbation signal: the latest V1 timing surface
   improves LeftHeartSubsystemV1 to 4/7 pass and MVF OK 5/7 while keeping LV PV
   7/7. Treat the mechanism label as unresolved; do not call it proven slower
   activation/following. HR90 and low-preload now pass. Remaining failures are
   afterload-high low stroke volume, contractility-low low-output
   clamp/mass residual, and contractility-high MVF kink.
9. Gate B architecture signal: LeftHeartSubsystemV2 records same-step
   accepted-state transaction readbacks. The fixed-point hard variant worsens
   the envelope, but the fixed-point soft-pressure variant keeps LV PV 7/7,
   improves MVF OK 5->6, and converts the contractility-low point from
   low-output + MVF + mass + clamp failure into low-output only with bounded
   soft safety pressure. This is architecture-scaffold evidence, not adoption,
   broad investment, or LandAtrial unlock.
10. Gate B residual attribution: `v2-fixed2-soft` leaves three classified
    residuals after output is judged by AoV forward ejection as well as LV
    volume range. Afterload-high and contractility-low are output-reserve
    residuals with clean MVF/no hard clamp; contractility-high is a
    flow-decoupled + MVF kink artifact. This narrows the next phase to
    output-reserve acceptance/recalibration and MVF kink/root-flow causality,
    not right-heart or LandAtrial expansion.
11. Gate B outflow repair signal: semilunar/root variants show that faster root
    runoff plus semilunar loss can improve pass 3->4, output OK 3->6, and
    remove large AoV beat alternans, but high-contractility still has MVF kink,
    `dt/2` instability, and clamp hits. This is repair-direction evidence only;
    it does not unlock runtime wiring, right-heart, four-chamber, or LandAtrial.
12. Gate B boundary signal: finite pulmonary venous compliance-node variants
    are broad no-go surfaces, while a high-drive component probe that suppresses
    lower-bound safety suction and increases semilunar/root load makes
    `left-heart-contractility-high` locally pass. This points next to broad
    output-reserve calibration, not PV-node tuning or LandAtrial re-entry.
13. Gate B output-reserve calibration signal: static semilunar/root/fiber
    calibration improves strict pass count 3->5 with output OK 6/7, dt stability
    7/7, and flow coupling 7/7, but remains blocked by low-contractility
    low-output/MVF and high-contractility MVF-kink/overpressure/clamp behavior.
    External active-length blending is only a limited component signal. Next
    work should move to a dynamic chamber-load reserve contract, not fixed
    scalar calibration or right-heart/LandAtrial expansion.
14. Gate B dynamic reserve decision: MV valve-state closure drive plus
    active-length blending keeps LV PV and MVF 7/7, and stateful root-load
    retention cleans high-drive artifacts. With the owner-approved policy that
    `left-heart-contractility-low` clean low-output is a Gate B phenotype, the
    best stateful-root surface is 7/7 policy pass: morphology 7/7, clamp-free
    7/7, output OK 6/7, and one phenotype-accepted low-contractility point
    whose raw low-output reasons remain reported. This unlocks the next
    right-heart strategic smoke only; it is not runtime adoption,
    four-chamber readiness, AV-plane release work, or LandAtrial unlock.
15. Right-heart strategic smoke: the first RA/RV/TV/PV/PA sidecar smoke is a
    useful mixed signal, not acceptance. It records RV PV 7/7, TVF 7/7, output
    7/7, repeatability 7/7, dt stability 7/7, flow-coupling 7/7, and clamp-free
    7/7, with overall pass 4/7. The remaining failures are only
    `safety-pressure-dominant` in preload-high, pulmonary-afterload-high, and
    contractility-low. Next work should classify RV dilation / soft-safety
    ownership before paired-heart, four-chamber, AV-plane, or LandAtrial work.
16. Right-heart reserve calibration: RV pressureScale 0.52 plus lower-bound
    RV soft-suction gain 0.08 converts the right-heart strategic smoke to 7/7
    while preserving RV PV 7/7, TVF 7/7, output 7/7, repeatability 7/7,
    dt stability 7/7, flow-coupling 7/7, clamp-free 7/7, and bounded safety
    7/7. The comparison shows pressureScale alone removes high-volume safety
    residuals but creates a low-preload repeatability failure; separating lower
    suction removes that oscillation. This unlocks paired left/right smoke only,
    not runtime wiring, four-chamber readiness, AV-plane release, or LandAtrial.
17. Paired left/right smoke: the passed left `active-length-mv-closure-stateful-root08`
    surface and passed right-heart strategic smoke run side-by-side over the
    7-point profile envelope with paired pass 7/7. The only accepted phenotype
    is the owner-approved left clean low-contractility low-output point. This
    unlocks a coupled circulation-bridge smoke only; it is not circulation
    coupling, runtime wiring, four-chamber readiness, AV-plane release, or
    LandAtrial.
18. Circulation bridge smoke: right-heart fixture hygiene was tightened by
    making historical lower-suction and low/high-contractility severity
    explicit; right-heart and paired 7/7 were preserved. The first
    source-pressure bridge is no-go: open boundaries preserve morphology 7/7
    but leave flow mismatch, while feedback reduces mismatch but breaks
    morphology (best 4/7). This blocks four-chamber, AV-plane, and LandAtrial
    work and points next to an explicit reservoir/mass-ledger bridge. RV
    pressureScale remains a provisional magnitude calibration knob, not
    geometry-derived PH/RV-failure readiness.
19. Reservoir bridge smoke: explicit black-box pulmonary/systemic reservoir
    ledger feedback improves the bridge from source-pressure no-go to a
    promising mixed signal. The best `ledger-high-compliance-gain025` surface
    records pass 6/7, flow-balanced 6/7, pressure adjustment bounded 7/7,
    reservoir ledger clean 7/7, and mean absolute mismatch ~8.1 mL versus the
    open-reservoir reference ~8.5 mL. The remaining blocker is
    `contractility-low`, where the bridge loses the left surface and still
    leaves left/right forward-ejection mismatch. This supports true same-step
    reservoir/mass-ledger coupling next; it does not unlock four-chamber,
    AV-plane, LandAtrial, runtime wiring, or morphology acceptance.
20. Reservoir solver bridge: a same-profile scalar pulmonary/systemic reservoir
    transfer solve strengthens the bridge signal. The best
    `same-step-high-compliance-bound2` surface records pass 6/7, morphology
    preserved 7/7, flow-balanced 6/7, pressure adjustment bounded 7/7,
    reservoir ledger clean 7/7, and mean absolute mismatch ~4.0 mL versus the
    open-reservoir reference ~8.5 mL. The remaining blocker is
    `contractility-low`, where morphology is preserved but left/right forward
    ejection remains mismatched. The best surface also uses large accepted
    reservoir transfer in some profiles (max ~54 mL), so the next step is
    residual/transfer classification before four-chamber, AV-plane, LandAtrial,
    runtime wiring, or morphology acceptance.
21. Reservoir solver attribution: `contractility-low` is classified as
    `profile-severity-mismatch`, not a scalar-transfer tuning problem. Accepted
    bound and wider diagnostic scans preserve morphology but find no
    flow-balanced `contractility-low` transfer. The best scalar solver also
    relies on large accepted reservoir transfers in 5/7 profiles (max ~54 mL,
    max transfer/forward-flow ratio ~1.33). This blocks scalar-solver promotion
    and points next to a stateful reservoir/mass-ledger contract with explicit
    reservoir volume state. Four-chamber, AV-plane, LandAtrial, runtime wiring,
    and morphology acceptance remain blocked.
22. Reservoir-state contract: explicit pulmonary/systemic reservoir volume
    state removes the scalar solver's large static-transfer signal but does not
    pass Gate C. The best `stateful-high-compliance-cap6-gain018` surface is
    no-go with pass 5/7, morphology preserved 6/7, flow-balanced 6/7,
    pressure-bounded 7/7, ledger-clean 7/7, max accepted transfer ~4.1 mL, and
    max reservoir volume ~33.5 mL. Remaining blockers are `preload-low`
    non-repeatable reservoir state and `contractility-low` where reservoir
    pressure feedback breaks the left surface and leaves forward-ejection
    mismatch. A longer conservative run grows a persistent low-contractility
    reservoir shuttle >60 mL, so this is not just slow convergence. Four-chamber,
    AV-plane, LandAtrial, runtime wiring, and morphology acceptance remain
    blocked. Next work should address Gate C low-contractility profile severity
    / reservoir feedback ownership rather than adding four-chamber structure.
23. Low-contractility alignment attribution: the Gate C residual is not solved
    by simple right-heart severity alignment. Left low-contractility remains a
    clean low-output phenotype with AoV ejection ~11.7 mL, while baseline right
    low-contractility is clean but ejects ~31.4 mL. Lowering right RV `trefPa`
    can make forward ejection numerically close (best severity-only mismatch
    ~1.5 mL), and combining lower `trefPa` with softer right safety gains can
    reduce mismatch further (~0.29 mL), but no candidate is a clean aligned
    low-output point: failures shift to safety-pressure, volume clamp, or
    repeatability artifacts. This keeps Gate C focused on a deeper low-output
    contract / right-heart safety ownership / reservoir feedback compatibility
    problem. Four-chamber, AV-plane, LandAtrial, runtime wiring, and morphology
    acceptance remain blocked.
24. Right-heart low-output contract attribution: a broader right low-output
    scan over RV active scale, RV volume policy, and upper safety gain still
    finds no clean right low-output phenotype. 53/60 candidates can align with
    the left low-output ejection magnitude, and the best point misses by only
    ~0.04 mL, but every aligned surface fails cleanliness through safety
    pressure, clamp, repeatability, or morphology artifacts. This keeps Gate C
    blocked on right low-output / RV safety ownership itself rather than
    reservoir tuning. Four-chamber, AV-plane, LandAtrial, runtime wiring, and
    morphology acceptance remain blocked.
25. Right-heart volume-reserve contract signal: separating RV upper
    volume-reserve from its pressure contribution finds one clean aligned right
    low-output candidate. The candidate preserves right-heart 7/7 and paired
    7/7 re-entry, but stateful reservoir Gate C remains no-go with best 5/7:
    `preload-low` reservoir state is non-repeatable and `contractility-low`
    loses the right surface under reservoir feedback. This is an architecture
    signal for RV volume-reserve ownership, not four-chamber readiness.
    Four-chamber, AV-plane, LandAtrial, runtime wiring, and morphology
    acceptance remain blocked.
26. Volume-reserve reservoir Gate C signal: scanning stateful reservoir
    variants around the RV volume-reserve candidate finds a 7/7 Gate C scaffold
    signal with `right-volume-reserve-rv-dilated520-tref-26000-safety-0.25-pressure-0.45`
    plus `vr-soft-cap4-gain012-comp80`. The surface preserves morphology,
    flow balance, reservoir ledger cleanliness, bounded per-epoch transfer,
    bounded persistent reservoir state, and repeatability across 7/7. Max
    accepted transfer is ~1.5 mL and max reservoir volume is ~17.5 mL. This
    unlocks a broader assembled-system review of the MechanicsCore2 Gate C
    scaffold only; four-chamber, AV-plane, LandAtrial, runtime wiring, and
    morphology acceptance remain blocked.
27. Gate C scaffold robustness: a local neighborhood scan around the
    volume-reserve reservoir scaffold records 18/27 Gate C passes, including
    the center scaffold. Passing points span RV upper pressure contribution
    0.43-0.47 and reservoir gains 0.12/0.14 with transfer caps 3.5-4.5 mL;
    max passing transfer is ~1.8 mL and max passing reservoir volume is
    ~19.5 mL. This supports Gate C as a neighborhood-level scaffold signal,
    not a single point artifact, but it still unlocks only assembled-system
    review. Four-chamber, AV-plane, LandAtrial, runtime wiring, and morphology
    acceptance remain blocked.
28. Gate C assembled-system review: the center and best-neighborhood Gate C
    scaffolds both pass detailed review. Both keep 7/7 clean Gate C points,
    no transfer-limiter reliance, bounded reservoir transfer/volume/pressure
    adjustments, and only the clean low-contractility low-output phenotype on
    both sides at `contractility-low`. This supports drafting and implementing
    an explicit four-chamber assembly contract next. It still does not unlock
    four-chamber implementation by accident, AV-plane, LandAtrial, runtime
    wiring, or morphology acceptance.
29. Four-chamber assembly contract: the sidecar contract now defines the
    required chamber, valve, reservoir, and ledger surfaces for the next smoke.
    Mapping the center and best-neighborhood Gate C scaffolds into this
    contract passes 2/2 with max forward mismatch ~8.0 mL, max accepted transfer
    ~1.8 mL, and max reservoir volume ~19.5 mL. This unlocks only a sidecar
    four-chamber assembly smoke that implements the contract. Runtime/default
    work, AV-plane, LandAtrial, and morphology acceptance remain blocked.
30. Four-chamber assembly smoke: executing the assembly contract over the center
    and best-neighborhood Gate C scaffolds passes 2/2 and selects
    `best-neighborhood-pressure047-gain014-cap35` for the first time-domain
    sidecar four-chamber subsystem smoke. Selected mean forward mismatch is
    ~5.1 mL, max accepted transfer ~1.8 mL, and max reservoir volume ~19.5 mL.
    This still does not unlock runtime/default work, AV-plane, LandAtrial, or
    morphology acceptance.
31. Four-chamber subsystem smoke: the first epoch-level sidecar subsystem runs
    the selected and center scaffolds through `FourChamberSubsystemV1` and
    passes 2/2. The selected best-neighborhood scaffold keeps mean forward
    mismatch ~5.1 mL, max accepted transfer ~1.8 mL, and max reservoir volume
    ~19.5 mL. This unlocks only subsystem residual/numerics review; runtime,
    AV-plane, LandAtrial, and morphology acceptance remain blocked.
32. Four-chamber subsystem residual review: nominal selected scaffold remains
    7/7, but the review is mixed. `dt-half` is 4/7 with `preload-low`
    left/right surface loss, `afterload-high` left surface loss, and
    `contractility-low` right/phenotype-scope loss. `long-epochs` is 6/7 with
    `preload-low` persistent reservoir shuttle (~28.5 mL max reservoir volume).
    This blocks further expansion and points next to preload-low reservoir /
    numerics ownership before runtime, AV-plane, LandAtrial, or morphology
    acceptance.
33. Preload-low reservoir numerics scan: scanning 18 reservoir gain/compliance
    candidates finds no preload-low all-scenario pass. The best validated
    candidate (`gain06-compliance50`) reaches 18/21 full-envelope points and
    bounds max reservoir volume to ~12.6 mL, but still fails
    `dt-half/preload-low` through left/right surface preservation. This closes
    simple reservoir gain/compliance tuning as the fix and points next to
    dt-half source-surface or subsystem numerics ownership.
34. Four-chamber dt-half source attribution: the selected scaffold's dt-half
    subsystem failures are classified as standalone source-surface failures,
    not reservoir pressure perturbation or subsystem-only coupling. The 3-point
    attribution set records 4 subsystem-failed sides and all 4 already fail in
    standalone dt-half reruns: preload-low left shape parity, preload-low right
    repeatability/output parity, afterload-high left AoV ejected volume, and
    contractility-low right output/PV ejected volume plus shape parity. This
    closes reservoir pressure tuning as the next fix and points directly to
    standalone left/right source-surface dt-half numerics and output/parity
    ownership before further four-chamber, runtime, AV-plane, or LandAtrial work.
35. Source-surface dt-half stability scan: scanning 20 small left/right
    source-surface candidates finds no full-pass candidate. The best left
    candidate is `left-mv-closure075` with 5/7 pass, still failing
    `preload-low` dt-half shape parity and `afterload-high` AoV output. The
    best right candidate is `right-lowt30000-safety018` with 6/7 pass and one
    clean accepted low-output phenotype, still failing `preload-low`
    repeatability and dt-half output parity. This is a partial signal only;
    next work should move to source-surface time integration / output-parity
    ownership rather than more reservoir or small parameter scans.
36. Source-surface time-integration attribution: the residuals split into three
    owner classes, not one tuning knob. `left-heart-preload-low` is a
    shape-dt-parity residual with MV inflow C1 worsening at `dt-half` while
    output parity stays close. `left-heart-afterload-high` is output-reserve
    limited with small repeatability and `dt-half` output deltas.
    `right-heart-preload-low` is repeatability-before-dt-output, with final
    PV ejection differing from both the previous beat and `dt-half`.
    `right-heart-contractility-low` remains a clean accepted low-output
    phenotype. This points next to a source-surface integration/output-parity
    contract, not reservoir tuning, AV-plane, LandAtrial, or runtime wiring.
37. Source-surface sampling parity: the `left-heart-preload-low` shape
    residual is classified as sampling-grid parity rather than a model
    morphology residual. The checker now uses theta-based phase alignment and
    separates dominant shape peak count from flow-specific forward peak count.
    Raw MV inflow C1 changes from 0.105442 to 0.310388 at `dt-half`, but
    phase-aligned `dt-half` C1 is 0.106665 with aligned delta 0.001223; the
    flow-specific forward peak count remains 2 across raw base, raw `dt-half`,
    and aligned `dt-half`. Sampling is not the owner for
    `left-heart-afterload-high` output reserve or
    `right-heart-preload-low` repeatability/output residuals. Next work should
    use phase-aligned source shape parity and focus on output reserve plus
    right-source settling/repeatability.
38. Source-surface contract: phase-aligned shape parity plus load-conditioned
    left output reserve yields a left source-contract 7/7 signal. The reference
    left surface is 6/7 with only afterload-high output low, while
    `left-afterload-active-reserve103` and `left-afterload-pressure-reserve102`
    both pass 7/7. Right remains 6/7: `right-heart-preload-low` keeps
    beat-repeatability and `dt-half` output parity failures even though shape
    parity is clean, and longer epochs worsen into persistent large alternation.
    This blocks source-contract promotion and points next to right-source
    preload-low settling / volume-output ownership before four-chamber,
    runtime, AV-plane, or LandAtrial work.
39. Right preload outflow ownership: PV pressure-flow/loss ownership resolves
    the remaining right source-surface repeatability residual as a focused
    source-side signal. The best `pv-resistance150` surface passes the 7-point
    right source envelope, and right preload-low remains stable through the
    56-beat probe with near-zero repeatability delta and small `dt-half` output
    delta. Negative controls show over-damped PV loss and broad PA runoff
    feedback can still break the envelope, so this is a PV outflow ownership
    lead, not final magnitude calibration or PH/RV-failure readiness. Next work
    should rerun source/four-chamber residual review with this lead before any
    runtime, reservoir retuning, AV-plane, or LandAtrial work.
40. Four-chamber PV outflow transfer review: direct transfer of the standalone
    right-preload PV outflow lead is no-go. The selected reference remains the
    best surface across nominal, `dt-half`, and long-epoch review; no direct
    transfer candidate passes all scenarios. PV variants can improve the
    `dt-half/preload-low` right surface, but they worsen nominal or long-epoch
    four-chamber behavior through right-surface, forward-mismatch, or reservoir
    shuttle failures. Next work should build a source-aware four-chamber review
    rather than reopening reservoir tuning, AV-plane, LandAtrial, or runtime
    wiring.
41. Four-chamber source-aware residual review: the selected scaffold's four raw
    failed profiles split into actionable owners. `dt-half/preload-low` combines
    left source sampling parity with a right PV outflow lead that still must not
    be directly transferred. `dt-half/afterload-high` is reclassified as a left
    load-conditioned output-reserve contract issue. `dt-half/contractility-low`
    remains a coupled low-output phenotype-scope blocker, and
    `long-epochs/preload-low` remains a reservoir-repeatability blocker. This
    points next to a source-aware four-chamber contract, not reservoir retuning,
    runtime wiring, AV-plane, or LandAtrial work.
42. Four-chamber source-aware contract: applying source-aware status ownership
    over the selected residual review gives a 20/21 contract signal. Raw
    reference is 17/21; left source-aware status reaches 18/21; left plus
    right-preload status reaches 19/21; adding explicit clean low-output
    phenotype scope reaches 20/21. The only remaining key is
    `long-epochs/preload-low` with persistent reservoir shuttle. This unlocks a
    bounded source-aware four-chamber contract smoke only, not true
    four-chamber dynamics, runtime wiring, reservoir retuning, AV-plane, or
    LandAtrial work.
43. Four-chamber source-aware contract smoke: the bounded smoke preserves
    nominal 7/7 and `dt-half` 7/7 under the source-aware policy, with total
    20/21. The sole remaining blocker is `long-epochs/preload-low` persistent
    reservoir shuttle: max reservoir volume ~28.5 mL, final reservoir step
    ~1.16 mL, and forward mismatch ~8.28 mL. Next work should target this
    repeatability blocker only; broad reservoir tuning, runtime wiring,
    AV-plane, and LandAtrial remain blocked.
44. Preload-low reservoir repeatability attribution: the remaining blocker is
    not just slow convergence. At 22 and 40 epochs, both source surfaces remain
    preserved while reservoir volume grows from ~28.5 mL to ~46.2 mL. At
    56 epochs, final reservoir step falls to ~0.35 mL, but accumulated reservoir
    load reaches ~48.9 mL and the right surface fails. This points next to a
    bounded reservoir-volume ownership contract, not broad reservoir
    gain/compliance retuning, runtime wiring, AV-plane, or LandAtrial work.
45. Bounded reservoir-volume ownership: a hard accepted reservoir-volume
    compatibility bound gives a targeted preload-low long-epoch signal.
    Unbounded reference is 0/3 across 22, 40, and 56 epochs. `hard-volume-bound28`
    and `hard-volume-bound24` are both 3/3 with source surfaces preserved; the
    best selected variant is `hard-volume-bound24` with max reservoir volume
    24 mL. This is not adoption evidence because the limiter rejects transfer
    over many epochs. Next work should apply the ownership law inside the full
    source-aware four-chamber contract smoke and rerun the complete envelope.
46. Four-chamber bounded reservoir contract smoke: applying bounded
    reservoir-volume ownership to the source-aware smoke gives raw 18/21 and
    effective 21/21. Nominal and `dt-half` are effective 7/7 without ownership
    limiter hits; long-epochs is effective 7/7 with max reservoir volume 24 mL.
    A 56-epoch preload-low stress probe also passes with left/right source
    surfaces preserved, max reservoir volume 24 mL, and final reservoir step
    0 mL. This is still contract-smoke evidence because the limiter rejects
    transfer explicitly; next work should review dynamics/numerics and limiter
    duty before runtime, AV-plane, or LandAtrial unlock.
47. Four-chamber bounded reservoir dynamics review: the bounded scaffold passes
    the source-aware smoke, but the hard bound is not a final law. Full envelope
    limiter duty is sparse at 5/350 epochs (~1.4%), while the preload-low
    56-epoch stress probe is limiter-dominant at 39/56 epochs (~69.6%).
    This keeps bounded reservoir-volume ownership as the current scaffold but
    points next to a smoother compatibility / energy ownership law before any
    runtime, AV-plane, or LandAtrial unlock.
48. Four-chamber smooth reservoir ownership: a near-bound smooth compatibility
    feedback surface, `smooth-knee20-gain035-bound24`, preserves the
    source-aware full smoke at effective 21/21 and keeps the preload-low
    56-epoch stress probe pass while reducing hard-bound fallback duty to
    0/350 full-envelope epochs and 0/56 stress epochs. This is a positive
    scaffold signal, not runtime or physiology acceptance. Next work should
    review the selected surface's dynamics/numerics before runtime, AV-plane,
    or LandAtrial unlock.
49. Four-chamber smooth reservoir dynamics review: the selected smooth-knee
    scaffold passes the focused review. The full source-aware envelope and
    preload-low 56/84/112-epoch stress probes pass, hard-bound fallback duty is
    zero, feedback is dissipative against reservoir imbalance, and the 20 mL
    knee stays clean. This is still sidecar scaffold evidence; next work should
    review assembled-system source/reservoir numerics before runtime, AV-plane,
    or LandAtrial unlock.
50. Four-chamber smooth reservoir assembled numerics review: the smooth
    scaffold remains useful but assembled numerics are mixed. Dynamics review,
    effective envelope, hard-limiter, and feedback passivity are clean, but
    `dt-half` reservoir magnitude parity is 6/7 with a localized
    `preload-low` residual: nominal max reservoir volume ~19.45 mL versus
    `dt-half` ~4.06 mL. Next work should resolve or classify that residual
    before runtime, AV-plane, or LandAtrial unlock.
51. Preload-low `dt-half` reservoir parity attribution: the localized residual
    is classified as `source-surface-dt-input-not-reservoir-feedback`.
    Nominal and `dt-half` feedback duty are both 0, hard-limiter duty is 0,
    and the `dt-half` raw residual is source-owned effective-pass. Next work
    should target preload-low source-surface dt input parity / normalization,
    not reservoir feedback retuning, before runtime, AV-plane, or LandAtrial
    unlock.
52. Preload-low source `dt` input normalization: separating source status
    evaluation from the source-ledger forward-ejection input gives a focused
    normalization signal. Raw `dt-half` reservoir delta versus nominal is
    ~15.39 mL, while canonical-ledger `dt-half` delta is 0 mL. Feedback and
    hard-limiter duty are 0 on the compared preload-low points, canonical
    ledger source statuses are clean, and status-rate source failures remain
    reported.
53. Source `dt` input normalized assembled review: applying source-ledger input
    normalization to the selected smooth scaffold gives effective envelope
    21/21 and `dt-half` reservoir parity 7/7 with no failed parity profiles.
    Raw `dt-half` source failures remain visible at `preload-low`,
    `afterload-high`, and `contractility-low`; effective `dt-half` failures
    are recomputed from the normalized run itself and are empty. Normalized
    ledger statuses are clean 7/7, and the hard limiter is free. This is a
    source/reservoir contract signal only; runtime, AV-plane, LandAtrial,
    direct PV outflow transfer, and morphology acceptance remain blocked.
54. Source/reservoir contract review: smooth reservoir dynamics plus
    source-ledger input normalization now pass the source/reservoir contract
    review. The smooth dynamics review passes, preload-low stress probes are
    3/3 repeatable, `dt-half` reservoir parity is 7/7, normalized ledger
    statuses are clean 7/7, raw status-rate source failures remain preserved
    at `preload-low`, `afterload-high`, and `contractility-low`, normalized-run
    effective `dt-half` failures are empty, and hard limiter duty remains free.
    This is enough to review AtrialFiberPack without
    AV-plane as a next sidecar scope, not enough for runtime wiring, AV-plane,
    LandAtrial, direct PV outflow transfer, or morphology acceptance.
55. AtrialFiberPack prescribed-volume readiness: LA/RA one-fiber chamber walls
    pass 4/4 prescribed-volume fixtures on top of the source/reservoir contract
    signal. The fixtures now use two warm-up cycles and score the final cycle.
    LA peak pressure is ~10-11 mmHg, RA peak pressure is ~3 mmHg, all outputs
    are finite and bounded, active pressure peaks remain late-diastolic at
    theta ~0.79-0.81, and intrinsic-length velocity cap touch count is 0/4.
    This is enough to attempt an
    AV-plane-off closed-loop atrial-fiber smoke, not enough for runtime wiring,
    AV-plane geometry, piston-volume mode, LandAtrial unlock, or morphology
    acceptance.
56. AtrialFiberPack closed-loop replay: replaying selected closed-loop LA/RA
    volume trajectories through the AV-plane-off atrial fiber pack passes 14/14
    wall replay rows: LA 7/7, RA 7/7, finite 14/14, and late-active 14/14.
    Current compliance-pressure parity remains advisory-wide in LA
    `preload-high`, `afterload-high`, and `contractility-low` (11/14 parity).
    This is a replay signal only. It does not unlock atrial pressure
    substitution, runtime wiring, AV-plane geometry, piston-volume mode,
    LandAtrial, or morphology acceptance. Future real trace artifacts should
    include the shadow audit readbacks requested by the physiology audit lane.
57. LA pressure-parity attribution: the three focused LA residual rows classify
    as baseline-offset dominant, wall-pulse-scale mismatch, wall pressure
    decoupled from the current waveform, and late A-wave phase aligned. One row
    also has a current v-wave/reservoir component. Raw atrial fiber pressure
    remains unsuitable for substitution; the next model surface should separate
    filling-pressure baseline/reservoir state from atrial wall pulse scaling.
58. Decomposed LA pressure contract smoke: a shadow contract that preserves the
    selected source/reservoir filling baseline and replaces only the empirical
    A-wave pulse with normalized atrial-fiber active pressure improves mean
    delta from ~8.16 mmHg raw-fiber to ~0.25 mmHg decomposed. The three focused
    residual rows pass, but total pass is 4/7 because `normal-hr75`,
    `normal-hr90`, and `contractility-high` retain non-focused late-peak
    residuals. This is not a source-surface substitution unlock.
59. LA late-peak residual attribution: the three non-focused decomposed
    late-peak residual rows classify as current late-window boundary-tail
    dominant while remaining pressure-parity clean. This permits only a shadow
    source-surface substitution smoke; runtime wiring, morphology acceptance,
    AV-plane geometry, piston-volume mode, and LandAtrial remain blocked.
60. LA pressure shadow substitution smoke: replaying MV with decomposed LAP is
    blocked as substitution evidence. Pressure-gradient support is clean 7/7,
    but pass is only 2/7 because four profiles collapse E/A into a single
    shadow MVF peak and low-contractility amplifies shadow forward volume. Next
    work should classify/refine the decomposed active pulse and MV replay
    response; do not move to runtime, AV-plane, LandAtrial, or reservoir
    retuning from this signal.
61. LA active-pulse MV replay refinement: the raw fiber active pulse remains
    blocked, but `fiber-active-a-window-gated` passes the shadow MV replay 7/7
    with MVF clean 7/7, no E/A single-peak collapse, mean QMV RMS delta
    ~1.58 mL/s, and mean forward-volume ratio ~0.997. This permits only a
    shadow decomposed-LAP substitution candidate using that selected pulse
    shape; runtime, AV-plane, LandAtrial, morphology acceptance, and reservoir
    retuning remain blocked.
62. AV valve/source state contract shadow: direct source pressure and direct
    AV-gradient commit remain blocked. A fixed source-state valve replay
    surface gives a mixed signal (`source-open-memory` best fixed variant:
    1/14 pass, clean shape 6/14, forward-volume parity 5/14) versus the prior
    direct-gradient 0/14 pass and clean shape 1/14. Residuals split into MV
    adverse-gradient forward flow and TV C1/forward-volume failures, so the
    next step is residual attribution plus a true same-step source/valve/chamber
    transaction, not runtime, AV-plane, LandAtrial, or reservoir retuning.
63. AV valve/source state residual attribution: `source-open-memory` rescues
    only `preload-low` MV. The remaining 13/14 failures are already present in
    current-pressure valve replay, with 4 MV adverse-gradient forward-flow
    rows, 2 MV volume/peak rows, and 7 TV C1/forward-volume-underfill rows.
    Stop fixed source-state variant sweeps; next work should implement a true
    same-step source/valve/chamber transaction, not pressure/gradient commit,
    runtime, AV-plane, LandAtrial, or reservoir retuning.
64. AV valve cyclic accepted-state replay: replaying AV valves with cyclic
    valve-state carryover improves the shadow replay from zero-state 0/14 to
    `cyclic-current-pressure` 4/14, with forward-volume parity 14/14, clean
    shape 7/14, mean Q RMS delta ~0.46 mL/s, and cyclic state delta 0. The
    remaining failures are adverse-gradient forward-flow rows with phase-local
    causal-gradient support needs (mean ~1.53 mmHg, max ~6.85 mmHg, max duty
    ~0.079). The source-open-memory variant is worse, so the next owner is
    accepted valve state plus pressure-flow causality/energy, not more
    source-state tuning. Pressure/gradient commit, runtime, AV-plane,
    LandAtrial, and morphology acceptance remain blocked.
65. AV valve causal-energy ownership shadow: extending the cyclic replay with
    causal-support readbacks shows that effective pressure-flow causality can
    explain the remaining rows (`cyclic-causal-support-readback-oracle` 14/14,
    max applied support ~6.85 mmHg, mean ~1.53 mmHg, max duty ~0.079) without
    changing q/state. But applying pressure support inside the step is worse
    (`cyclic-causal-pressure-step-oracle` 3/14, forward-volume parity 9/14,
    mean Q RMS ~8.52 mL/s, max support ~26.9 mmHg), and loss-only damping is
    also worse (3/14). Treat this as a same-step transaction requirement, not
    a pressure-support promotion. Pressure/gradient commit, runtime,
    AV-plane, LandAtrial, and morphology acceptance remain blocked.
66. Atrial figure-eight quality audit: after full-run AtrialFiber warm replay
    and closed-loop intersection scoring, source/reservoir-conditioned current
    pressure still has basic figure-eight 1/14 and lobe-quality 0/14, while
    AtrialFiber pressure has basic figure-eight 13/14 but lobe-quality only
    1/14 (LA 1/7, RA 0/7). AV-plane velocity/a-prime readbacks are absent by
    design. This keeps pressure-parity/MVF-only optimization blocked and
    points atrial work toward stateful atrial chamber P-V co-evolution with
    explicit future AV-plane position/velocity readbacks. Pressure
    substitution, runtime, AV-plane enablement, LandAtrial, and morphology
    acceptance remain blocked.
67. Stateful LA chamber contract smoke: using stateful LA chamber total
    pressure directly as the left-heart LA pressure source is mixed, not a
    promotion path. It preserves MV forward-volume parity 7/7 and mass 7/7, but
    source-surface pass is only 1/7, LA PV lobe-quality is only 1/7, and
    contract pass is 0/7. This confirms P-V co-evolution is necessary but
    direct chamber-pressure substitution is still insufficient. Next atrial
    work should co-own LA chamber pressure and MV valve/source state in a
    same-step transaction, with AV-plane position/velocity readbacks designed
    but not enabled. Runtime, AV-plane enablement, a-prime claims, LandAtrial,
    and morphology acceptance remain blocked.
68. Atrial chamber/valve transaction readiness contract: the sidecar now has a
    disabled AV-plane geometry/readback scaffold with zero hidden blood-volume
    source and a synthesis report that names the four required owners:
    atrial PV figure-eight lobe quality, stateful atrial chamber pressure-volume
    contract, same-step AV valve pressure-flow/energy contract, and AV-plane
    position/velocity readbacks. The readiness report is blocked with
    current-pressure lobe-quality 0/14, AtrialFiber lobe-quality 1/14,
    stateful LA source-surface pass 1/7, stateful LA contract pass 0/7,
    AV-valve fixed replay 4/14, oracle replay 14/14, AV-plane enabled 0/2, and
    a-prime readback 0/2. Next work should implement the measured same-step
    atrial chamber/AV valve transaction that owns those residuals. Runtime,
    AV-plane enablement, a-prime claims, LandAtrial, and morphology acceptance
    remain blocked.
69. Local LA/MV same-step transaction replay: replaying LA/MV with AtrialFiber
    total pressure, baseline LVP, and baseline pulmonary venous inflow is a
    no-go, not a promotion path. Best pass is 0/7, MVF clean 3/7, forward-volume
    parity 0/7, LA PV lobe-quality 0/7, and local LA volume-ledger cleanliness
    0/7, with mean MV forward-volume ratio ~0.11 and max LA volume drift
    ~471 mL. This shows a forced local LA/MV replay is ill-closed; the next
    transaction must own pulmonary reservoir/inflow, LA chamber pressure, MV
    valve pressure-flow, and LV filling together rather than forcing LVP/PV
    inflow from the baseline. Runtime, AV-plane enablement, a-prime claims,
    LandAtrial, and morphology acceptance remain blocked.
70. Additive LA active-pressure source comparison: adding AtrialFiber active
    pressure to the empirical LA pressure baseline preserves volume/output/mass
    parity in the best gain-0.50 variant, but it is still not a promotion path.
    Best source-surface pass is 2/7, contract pass 0/7, LA PV lobe-quality
    0/7, and MVF clean 2/7. This closes pressure-source addition as a shortcut:
    the next transaction must co-own pulmonary reservoir/inflow, LA pressure-
    volume evolution, MV pressure-flow/energy, and LV filling rather than
    adding atrial active pressure to a pre-existing source surface. Runtime,
    AV-plane enablement, a-prime claims, LandAtrial, and morphology acceptance
    remain blocked.
71. LA/MV assembled transaction surface: the first same-step pulmonary-
    reservoir/LA-chamber/MV-valve/LV-filling surface is mixed evidence, not a
    promotion path. The best fixed-pressure reference has source-surface pass
    0/7, contract pass 0/7, LA PV lobe-quality 1/7, MVF clean 3/7, and
    transaction convergence 0/7. Pulmonary venous compliance-node variants
    reduce the max transaction residual from ~1.03 mL to ~0.14 mL, but still
    leave contract pass 0/7, LA PV lobe-quality 0/7, and MVF clean 3/7. This
    says residual iteration/pressure-reservoir ownership alone is insufficient;
    next work should classify the remaining LA PV lobe and MVF residuals before
    enabling AV-plane geometry or LandAtrial. Runtime, morphology acceptance,
    a-prime claims, and LandAtrial remain blocked.
72. LA/MV assembled residual attribution: the assembled residual is now
    classified as atrial-geometry/lobe-quality before AV-plane enablement.
    Across 28 rows, LA PV lobe fails 27/28; 14 rows have clean flow-volume and
    mass but still fail lobe quality, and 14 rows have bounded transaction
    residuals but still fail lobe quality. Pulmonary compliance reduces
    residuals without lobe gain. This keeps AV-plane runtime enablement blocked
    but moves the next structural owner to stateful atrial geometry/lobe quality.
73. Atrial geometry lobe shadow: a readback-only effective geometry overlay is
    not enough. Warm replay removes the final-beat cold-start ambiguity and
    shows the baseline/no-gain lobe-quality count is 2/7, but geometry gains
    0/6/12/18 mL still do not improve beyond 2/7. Hidden-volume source remains
    zero, hidden-volume-clean is 7/7, and a-prime shadow readbacks are present
    7/7. This closes post-hoc geometry overlays as a shortcut; the next model
    surface needs geometry/lobe state to co-evolve inside the atrial chamber/
    valve transaction before any AV-plane physiology or runtime claim.
74. Stateful atrial geometry transaction: moving simple LV-shortening geometry
    into the LA chamber/MV valve/LV filling transaction is also not a promotion
    path. Best remains no-geometry fixed-pressure with source-surface pass 0/7,
    contract pass 0/7, LA PV lobe-quality 1/7, and MVF clean 3/7. Stretch-
    volume, capacity-volume, and phase-reservoir capacity geometry variants
    keep hidden-volume-clean 7/7 and expose a-prime readbacks, but none improves
    lobe quality or MVF morphology; the lobe decomposition shows self-
    intersections are usually present while opposed a/v lobes remain 1/7. The
    compliance-node variant lowers residuals while lobe quality falls to 0/7.
    Simple effective-geometry displacement is therefore blocked; next work
    should classify a different atrial lobe generator before any AV-plane
    physiology or runtime claim.
75. Atrial lobe-generator oracle: direct display-piston volume and simple
    phase-pressure oracles are insufficient. Best is blood-volume plus
    AtrialFiber pressure with lobe-quality 2/7 and opposed-lobe count 2/7;
    piston display volume increases volume separation but does not increase
    pass count, and reservoir-suction/kick pressure variants also remain 2/7.
    This keeps runtime, blood-ledger mutation, AV-plane enablement, a-prime
    physiology, and LandAtrial blocked while routing the next work to a real
    state-owned atrial chamber/valve lobe generator.
76. State-owned atrial lobe generator: a reservoir-suction state inside the
    left-heart LA source surface gives a useful but insufficient signal. The
    best contract variant has source-surface pass 3/7, contract pass 2/7, LA PV
    lobe-quality 2/7, and MVF clean 3/7; stronger suction improves source-
    surface and MVF to 5/7 but leaves LA PV lobe-quality at 1/7. Hidden-volume
    cleanliness and output parity remain 7/7. This is mixed evidence for a
    state-owned lobe coordinate, not a promotion path; next work should broaden
    the atrial chamber/valve lobe generator rather than tune scalar suction,
    and runtime, AV-plane physiology, a-prime clinical claims, LandAtrial, and
    morphology acceptance remain blocked.
77. Atrial lobe failure attribution: warm-replay, closed-loop phase-lobe
    scoring classifies the residual as structural, not a pressure-parity
    problem. Across current and AtrialFiber pressure sources, lobe-quality pass
    is 1/28 and basic figure-eight is 14/28. Current-pressure rows are dominated
    by missing self-intersections, while AtrialFiber rows mostly have
    same-signed a/v lobes; RA AtrialFiber also has negative v-minus-a volume
    separation. This routes the next model surface to separated reservoir and
    booster state ownership, with AV-plane/annular velocity slots designed but
    not promoted.
78. Separated atrial lobe state generator: distinct reservoir and booster
    pressure states provide only mixed evidence. The best contract variant
    reaches source-surface pass 4/7, contract pass 2/7, LA PV lobe-quality 2/7,
    and MVF clean 4/7; stronger variants improve source-surface/MVF to 5/7 but
    leave lobe-quality at 1/7. Hidden-volume cleanliness and output parity stay
    7/7, and the geometry side variant exposes a-prime readbacks without lobe
    promotion. This closes scalar reservoir/booster pressure-state tuning as a
    promotion path; next work needs lobe state to co-evolve with LA volume, MV
    pressure-flow/energy, pulmonary inflow, and LV filling.
79. Dual-lobe chamber/valve generator: reservoir-capacity and booster-
    compression geometry states now co-evolve inside the left-heart LA fiber,
    MV valve, and LV filling surface. The best hybrid surface improves
    source-surface/MVF to 5/7, keeps MV/AoV volume parity, hidden-volume
    cleanliness, and a-prime readbacks at 7/7, but LA PV lobe-quality remains
    2/7. This is useful architecture evidence, not promotion: lobe direction is
    still structurally blocked, and next work should target the pressure-volume
    orientation owner rather than pressure parity, scalar suction, or AV-plane
    gain tuning.

Parallel prep, not blocking the next strategic gate:

- Numerics ownership for stepper, residuals, mass/energy, and dt convergence.
- Official cases remain out of scope while sidecar model closure is unstable.

## Stopped Lane

### ModelCore + Land Boundary-Contract Patch Lane

Status: stopped unless the owner explicitly reopens it.

Reason: strict morphology V1.1 remains failed after the patch surfaces recorded
through PR #325. The latest accepted-volume chamber/valve/load architecture
smoke produced only a partial signal: gross morphology stayed 0/2, TVF did not
improve, and LV positive-curvature burden worsened. This is not a good signal.

Do not continue:

- Source-pressure ownership variants.
- Work-conjugate/stateless pressure adapter sweeps.
- Scalar pressure gain caps.
- Valve threshold/deadband/coasting patches.
- qDot/rootZc/Tref/source-stress tuning.
- lambda/tau/zeta smoothing sweeps.
- Local pointwise MV pressure refits.
- Solver wrapper/substep experiments as morphology fixes.
- LandAtrial tuning to hide LV/RV/MVF/TVF blockers.

Keep as reusable QA/reference:

- Strict morphology checker V1.1+.
- Accepted-boundary qDot/diode/complementarity readbacks.
- Pressure decomposition readbacks.
- Visual review bundle discipline.
- Frozen legacy active-stress positive control.
- Frozen current Land/user0 comparator.

## Owner Release Posture

- Land remains the intended replacement direction for the current active model,
  but Land re-entry into MechanicsCore2 must receive accepted geometry/velocity
  states rather than raw chamber-volume spikes.
- A1/A2 remain frozen diagnostic scaffolds/comparators.
- LandAtrial remains the final atrial active-mechanics target, but tuning stays
  locked while LV/RV PV and MVF/TVF raw morphology are failing.
- Future MechanicsCore2 atria should enter as one-fiber atrial chamber/fiber
  packs after source/four-chamber closure. Explicit AV-plane displacement is a
  0DSimDemo geometry extension, not a copied CircAdapt baseline, and remains
  locked until the source-aware four-chamber contract is stable. Normal-sinus
  atrial acceptance needs readable figure-eight lobe quality plus AV-plane
  velocity/a-prime proxy readiness; pressure parity alone is not sufficient.
- Official cases are smoke/teaching-surface checks until closures stabilize.
