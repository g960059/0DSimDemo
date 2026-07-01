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

### MechanicsCore2 / CircAdapt-lite Sidecar

Objective: pivot from the exhausted `ModelCore + Land boundary-contract patch`
lane to a sidecar mechanics architecture inspired by CircAdapt-like
chamber/valve/load ownership without copying CircAdapt source or claiming
equivalence.

Current sidecar state: `PR-M2-0+1`, `PR-M2-2+3`, `PR-M2-4+5`, the
left-heart fiber-timing attribution surface, and the first left-heart V2
transaction architecture comparison, residual attribution, semilunar/root
outflow repair, pulmonary-boundary/safety-suction comparisons, and
output-reserve calibration and dynamic reserve contract comparisons are
implemented.

Next PR target: paired left/right MechanicsCore2 smoke using the passed
single-side Gate B surfaces. Do not start four-chamber work or LandAtrial
re-entry from isolated left/right sidecar evidence alone.

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
- Official cases are smoke/teaching-surface checks until closures stabilize.
