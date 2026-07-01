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
- [ADR-MYO-003](../../docs/myocardium/adr/ADR-MYO-003-mechanicscore2-circadapt-lite.md)

Claim boundary:

- Not CircAdapt source code or a CircAdapt-compatible implementation.
- Not clinical validation.
- Not runtime morphology acceptance.
- Not a replacement for the existing all-chamber user-0 closure.
