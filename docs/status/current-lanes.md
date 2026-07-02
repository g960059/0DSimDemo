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
outflow repair, pulmonary-boundary/safety-suction comparisons,
output-reserve calibration and dynamic reserve contract comparisons, paired
left/right smoke, source-pressure bridge smoke, reservoir-ledger bridge smoke,
same-profile reservoir-solver bridge smoke, and reservoir-solver attribution
are implemented. The explicit reservoir-state, Gate C volume-reserve scaffold,
four-chamber assembly contract, assembly smoke, and first epoch-level
four-chamber subsystem smoke are also implemented.

Next PR target: address source-surface time integration and output/parity
ownership directly. The source-surface `dt-half` scan finds a right-side
partial signal but no left or right full-pass candidate, so simple
source-surface parameter perturbations are not enough. Do not restart reservoir
gain/compliance tuning, runtime wiring, AV-plane work, or LandAtrial re-entry
from this evidence alone.

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
