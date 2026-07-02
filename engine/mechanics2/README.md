# MechanicsCore2

MechanicsCore2 is a sidecar mechanics lane for a CircAdapt-lite rewrite path.
It is intentionally isolated from `ModelCore`: no runtime/default wiring is
allowed until the sidecar passes its own gates.

Current scope:

- `fiber/HillSeriesFiberV1.ts`: prescribed-length active fiber smoke model.
- `fixtures/TraceFixtureV1.ts`: explicit replay fixture contract.
- `benches/HillSeriesFiberReplayBench.ts`: fail-fast isolated replay gate.
- `chamber/OneFiberChamberV1.ts`: prescribed-volume one-fiber chamber pressure
  mapping smoke model.
- `benches/OneFiberChamberPrescribedVolumeBench.ts`: provisional chamber
  pressure mapping bench.
- `audits/ExistingValveAuditV1.ts`: current valve parameter and semantics audit.
- `valve/FlowStateValveV1.ts`: stateful pressure-flow/loss/inertance valve
  sidecar component.
- `benches/FlowStateValvePrescribedGradientBench.ts`: prescribed-gradient
  MV/TV E/A-like flow smoke.
- `subsystems/LeftHeartSubsystemV1.ts`: minimal LA/LV/root sidecar smoke with
  LA compliance and FlowStateValve boundaries.
- `benches/LeftHeartSubsystemStrategicSmoke.ts`: representative left-heart
  strategic smoke gate.
- `core/MechanicsTransactionV2.ts`: generic same-step transaction helper for
  accepted-state sidecar experiments.
- `subsystems/LeftHeartSubsystemV2.ts`: left-heart transaction scaffold with
  explicit/fixed-point modes and hard-clamp vs soft-pressure safety surfaces.
- `benches/LeftHeartArchitectureComparisonBench.ts`: V1/V2 left-heart
  architecture comparison artifact for Gate B attribution.
- `benches/LeftHeartResidualAttributionBench.ts`: focused attribution of the
  V2 soft-pressure residuals before any right-heart or LandAtrial work.
- `benches/LeftHeartOutflowRepairBench.ts`: semilunar/root outflow repair
  comparison with beat-to-beat repeatability and `dt/2` sensitivity guards.
- `benches/LeftHeartPulmonaryBoundaryContractBench.ts`: finite pulmonary
  venous node and lower-bound safety-suction attribution for the left-heart
  Gate B residual.
- `benches/LeftHeartOutputReserveCalibrationBench.ts`: output-reserve
  calibration comparison, including static semilunar/root/fiber scaling and an
  external active-length blend probe.
- `benches/LeftHeartDynamicReserveContractBench.ts`: dynamic left-heart
  output-reserve contract surface with MV closure-state drive, high-pressure
  and stateful root runoff drive, and LA/LV split clamp readbacks.
- `benches/RightHeartLowOutputContractBench.ts`: Gate C attribution scan for
  right low-output phenotype, RV volume policy, and safety ownership.
- `benches/RightHeartVolumeReserveContractBench.ts`: RV volume-reserve
  pressure-contribution candidate with right/paired/reservoir re-entry checks.
- `benches/VolumeReserveReservoirGateCScanBench.ts`: Gate C reservoir scan for
  the RV volume-reserve scaffold candidate.
- `benches/GateCScaffoldRobustnessBench.ts`: local Gate C neighborhood scan
  around the volume-reserve reservoir scaffold.
- `benches/GateCAssembledSystemReviewBench.ts`: detailed review of the center
  and best-neighborhood Gate C scaffolds before four-chamber contract design.
- `core/FourChamberAssemblyContractV1.ts`: typed four-chamber assembly ledger
  contract for the next sidecar smoke.
- `benches/FourChamberAssemblyContractBench.ts`: contract smoke that maps Gate C
  scaffold results into the four-chamber ledger before true four-chamber
  dynamics are implemented.
- `benches/FourChamberAssemblySmokeBench.ts`: sidecar assembly smoke that runs
  the four-chamber ledger contract and selects the scaffold for the first
  time-domain four-chamber subsystem smoke.
- `subsystems/FourChamberSubsystemV1.ts`: epoch-level sidecar four-chamber
  subsystem state machine with pulmonary/systemic reservoir pressure feedback.
- `benches/FourChamberSubsystemSmokeBench.ts`: smoke runner for the selected
  and center four-chamber subsystem scaffolds.
- `benches/FourChamberSubsystemResidualReviewBench.ts`: residual/numerics
  review for the selected four-chamber subsystem scaffold under nominal,
  `dt-half`, and longer-epoch probes.
- `benches/PreloadLowReservoirNumericsScanBench.ts`: focused preload-low
  reservoir gain/compliance scan after the four-chamber subsystem residual
  review.
- `benches/FourChamberDtHalfSourceAttributionBench.ts`: focused attribution of
  `dt-half` surface losses against standalone source surfaces, reservoir
  pressure perturbation, and subsystem coupling.
- `benches/SourceSurfaceDtHalfStabilityScanBench.ts`: small source-surface
  candidate scan after `dt-half` attribution closes reservoir pressure tuning
  as the next fix.
- `benches/SourceSurfaceTimeIntegrationAttributionBench.ts`: attribution of
  remaining source-surface residuals into shape dt-parity, output reserve, and
  settling/repeatability ownership classes.
- `benches/SourceSurfaceSamplingParityBench.ts`: sampling-grid attribution for
  source-surface shape dt-parity checks using phase-aligned `dt-half` waveform
  comparisons.
- `benches/SourceSurfaceContractBench.ts`: source-surface contract probe using
  phase-aligned shape parity, left load-conditioned output reserve, and right
  preload-low settling/repeatability classification.
- `benches/RightPreloadOutflowOwnershipBench.ts`: focused PV outflow
  pressure-flow/loss ownership probe for the right preload-low source-surface
  repeatability residual.
- `benches/FourChamberPvOutflowTransferReviewBench.ts`: direct-transfer review
  for the standalone right-preload PV outflow lead against the selected
  four-chamber scaffold.
- `benches/FourChamberSourceAwareResidualReviewBench.ts`: source-aware
  residual review that reclassifies selected four-chamber failures against the
  source-surface contract and right-preload PV outflow ownership evidence.
- `benches/FourChamberSourceAwareContractBench.ts`: source-aware status
  contract layer over the selected four-chamber residual review.
- `benches/FourChamberSourceAwareContractSmokeBench.ts`: bounded smoke for the
  source-aware status contract and its remaining reservoir-repeatability
  blocker.
- `benches/PreloadLowReservoirRepeatabilityAttributionBench.ts`: focused
  epoch-history attribution for the source-aware contract smoke's remaining
  preload-low reservoir-repeatability blocker.
- `benches/BoundedReservoirVolumeOwnershipBench.ts`: targeted bounded
  reservoir-volume ownership signal for the preload-low long-epoch blocker.
- `benches/FourChamberBoundedReservoirContractSmokeBench.ts`: source-aware
  full-envelope smoke for bounded reservoir-volume ownership.
- `benches/FourChamberBoundedReservoirDynamicsReviewBench.ts`: limiter-duty
  review for the bounded reservoir-volume ownership scaffold.
- `benches/FourChamberSmoothReservoirOwnershipBench.ts`: smooth compatibility
  feedback candidates that reduce hard-bound fallback duty while preserving the
  source-aware four-chamber smoke.
- `benches/FourChamberSmoothReservoirDynamicsReviewBench.ts`: focused
  dynamics/numerics review of the selected smooth reservoir ownership surface.
- `benches/FourChamberSmoothReservoirAssembledNumericsReviewBench.ts`:
  assembled source/reservoir numerics review that localizes the remaining
  `preload-low` `dt-half` reservoir magnitude parity residual.
- `benches/PreloadLowDtHalfReservoirParityAttributionBench.ts`: focused
  attribution showing the localized `preload-low` `dt-half` reservoir parity
  residual is source-surface input driven, not reservoir feedback driven.
- `benches/PreloadLowSourceDtInputNormalizationBench.ts`: focused diagnostic
  separating source status evaluation from source-ledger forward-ejection input
  on the localized `preload-low` `dt-half` residual.
- `benches/FourChamberSourceDtInputNormalizedAssembledReviewBench.ts`:
  assembled review applying source-ledger input normalization to the selected
  smooth reservoir scaffold while keeping raw status-rate failures visible.

The first replay fixtures are procedural fixtures that lock the fixture schema
and gate semantics. They are not extracted patient traces and are not CircAdapt
reference traces.

Planning docs:

- [MechanicsCore2 / CircAdapt-lite execution plan v3](../../docs/mechanics2/MechanicsCore2_CircAdaptLite_ExecutionPlan_v3.md)
- [Sharpness metrics V1](../../docs/mechanics2/sharpness-metrics-v1.md)
- [Existing valve audit V1](../../docs/mechanics2/valve-audit-v1.md)
- [FlowStateValve and LeftHeart smoke V1](../../docs/mechanics2/flow-state-valve-left-heart-v1.md)
- [Left-heart architecture V2](../../docs/mechanics2/left-heart-architecture-v2.md)
- [Left-heart residual attribution V1](../../docs/mechanics2/left-heart-residual-attribution-v1.md)
- [Left-heart outflow repair V1](../../docs/mechanics2/left-heart-outflow-repair-v1.md)
- [Left-heart pulmonary boundary contract V1](../../docs/mechanics2/left-heart-pulmonary-boundary-contract-v1.md)
- [Left-heart output-reserve calibration V1](../../docs/mechanics2/left-heart-output-reserve-calibration-v1.md)
- [Left-heart dynamic reserve contract V1](../../docs/mechanics2/left-heart-dynamic-reserve-contract-v1.md)
- [Right-heart low-output contract V1](../../docs/mechanics2/right-heart-low-output-contract-v1.md)
- [Right-heart volume-reserve contract V1](../../docs/mechanics2/right-heart-volume-reserve-contract-v1.md)
- [Right preload outflow ownership V1](../../docs/mechanics2/right-preload-outflow-ownership-v1.md)
- [Volume-reserve reservoir Gate C scan V1](../../docs/mechanics2/volume-reserve-reservoir-gate-c-scan-v1.md)
- [Gate C scaffold robustness V1](../../docs/mechanics2/gate-c-scaffold-robustness-v1.md)
- [Gate C assembled-system review V1](../../docs/mechanics2/gate-c-assembled-system-review-v1.md)
- [Four-chamber assembly contract V1](../../docs/mechanics2/four-chamber-assembly-contract-v1.md)
- [Four-chamber assembly smoke V1](../../docs/mechanics2/four-chamber-assembly-smoke-v1.md)
- [Four-chamber subsystem smoke V1](../../docs/mechanics2/four-chamber-subsystem-smoke-v1.md)
- [Four-chamber subsystem residual review V1](../../docs/mechanics2/four-chamber-subsystem-residual-review-v1.md)
- [Preload-low reservoir numerics scan V1](../../docs/mechanics2/preload-low-reservoir-numerics-scan-v1.md)
- [Four-chamber dt-half source attribution V1](../../docs/mechanics2/four-chamber-dthalf-source-attribution-v1.md)
- [Source-surface dt-half stability scan V1](../../docs/mechanics2/source-surface-dthalf-stability-scan-v1.md)
- [Source-surface time-integration attribution V1](../../docs/mechanics2/source-surface-time-integration-attribution-v1.md)
- [Source-surface sampling parity V1](../../docs/mechanics2/source-surface-sampling-parity-v1.md)
- [Source-surface contract V1](../../docs/mechanics2/source-surface-contract-v1.md)
- [Four-chamber PV outflow transfer review V1](../../docs/mechanics2/four-chamber-pv-outflow-transfer-review-v1.md)
- [Four-chamber source-aware residual review V1](../../docs/mechanics2/four-chamber-source-aware-residual-review-v1.md)
- [Four-chamber source-aware contract V1](../../docs/mechanics2/four-chamber-source-aware-contract-v1.md)
- [Four-chamber source-aware contract smoke V1](../../docs/mechanics2/four-chamber-source-aware-contract-smoke-v1.md)
- [Preload-low reservoir repeatability attribution V1](../../docs/mechanics2/preload-low-reservoir-repeatability-attribution-v1.md)
- [Bounded reservoir volume ownership V1](../../docs/mechanics2/bounded-reservoir-volume-ownership-v1.md)
- [Four-chamber bounded reservoir contract smoke V1](../../docs/mechanics2/four-chamber-bounded-reservoir-contract-smoke-v1.md)
- [Four-chamber bounded reservoir dynamics review V1](../../docs/mechanics2/four-chamber-bounded-reservoir-dynamics-review-v1.md)
- [ADR-MYO-003](../../docs/myocardium/adr/ADR-MYO-003-mechanicscore2-circadapt-lite.md)

Claim boundary:

- Not CircAdapt source code or a CircAdapt-compatible implementation.
- Not clinical validation.
- Not runtime morphology acceptance.
- Not a replacement for the existing all-chamber user-0 closure.
