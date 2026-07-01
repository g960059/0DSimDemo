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

The first replay fixtures are procedural fixtures that lock the fixture schema
and gate semantics. They are not extracted patient traces and are not CircAdapt
reference traces.

Planning docs:

- [MechanicsCore2 / CircAdapt-lite execution plan v3](../../docs/mechanics2/MechanicsCore2_CircAdaptLite_ExecutionPlan_v3.md)
- [Sharpness metrics V1](../../docs/mechanics2/sharpness-metrics-v1.md)
- [Existing valve audit V1](../../docs/mechanics2/valve-audit-v1.md)
- [ADR-MYO-003](../../docs/myocardium/adr/ADR-MYO-003-mechanicscore2-circadapt-lite.md)

Claim boundary:

- Not CircAdapt source code or a CircAdapt-compatible implementation.
- Not clinical validation.
- Not runtime morphology acceptance.
- Not a replacement for the existing all-chamber user-0 closure.
