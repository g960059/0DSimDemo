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
- [Volume-reserve reservoir Gate C scan V1](../../docs/mechanics2/volume-reserve-reservoir-gate-c-scan-v1.md)
- [Gate C scaffold robustness V1](../../docs/mechanics2/gate-c-scaffold-robustness-v1.md)
- [Gate C assembled-system review V1](../../docs/mechanics2/gate-c-assembled-system-review-v1.md)
- [Four-chamber assembly contract V1](../../docs/mechanics2/four-chamber-assembly-contract-v1.md)
- [Four-chamber assembly smoke V1](../../docs/mechanics2/four-chamber-assembly-smoke-v1.md)
- [Four-chamber subsystem smoke V1](../../docs/mechanics2/four-chamber-subsystem-smoke-v1.md)
- [Four-chamber subsystem residual review V1](../../docs/mechanics2/four-chamber-subsystem-residual-review-v1.md)
- [ADR-MYO-003](../../docs/myocardium/adr/ADR-MYO-003-mechanicscore2-circadapt-lite.md)

Claim boundary:

- Not CircAdapt source code or a CircAdapt-compatible implementation.
- Not clinical validation.
- Not runtime morphology acceptance.
- Not a replacement for the existing all-chamber user-0 closure.
