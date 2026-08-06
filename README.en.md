[日本語](./README.md) | **English**

# CircleHeart

CircleHeart is a pre-release project for a research and teaching 0D
closed-loop cardiovascular simulation, Experiment authoring environment, and
Reader experience.

The project currently has no production users or durable production content.
It is undergoing a direct cutover from the old Case / Lesson / Studio V1 data
model to an exact-model registry and a new Experiment / Snapshot / Placement
architecture. Removed designs and implementations remain available in Git
history; they are not kept as compatibility code.

## Current authority

The sole authority for Studio data and ownership boundaries is
[`docs/studio/DESIGN-STUDIO-003-experiment-data-architecture.md`](docs/studio/DESIGN-STUDIO-003-experiment-data-architecture.md).

The central structure is:

```text
RegisteredModel(modelId)

ExperimentWorkspace (mutable)
  └─ ExperimentContent
       ├─ ScenarioCapture[] = fixture + checkpoint
       └─ ExperimentSurface = graphs + readouts + controls + one note

ExperimentSnapshot (immutable)
ExperimentPlacement (pins one snapshot)

SimulationSession / preview cache (ephemeral)
```

Key decisions:

- `modelId` is the exact immutable identity of equations, runtime, solver,
  fixture schema, checkpoint codec, catalogs, and snapshot gate
- package integrity is checked only when registering a model; runtime clients
  trust the registry
- a parameter action ends after updating the fixture; there is no durable
  `ParameterSet`
- Scenario Presets, Drafts, and Snapshots keep `fixture + checkpoint` together
- an unsettled Draft may be saved; only Snapshot creation requires settlement
  and the minimum numerical gate
- immutable versions use `snapshotId`, not a numeric revision
- `parentSnapshotId` records lineage only and never implies inheritance
- an article Placement pins one Snapshot directly
- settlement, numerical health, input epochs, and live samples are not durable
  content

## Current V3 direct-cutover state

No official Scenario Presets, Experiments, articles, or Lessons will be
authored yet.

Completed:

1. package the canonical fixture, exact checkpoint, outputs, and
   accepted-boundary capture for `MainWireIntegratedModelTransactionV3`;
2. connect that package to registry admission under an exact development
   `modelId`;
3. resolve the registry-trusted release as the default model;
4. autostart the live simulation through the generic Worker; and
5. connect the period-1/minimum-numerical Snapshot gate.

Remaining:

1. bridge capture from the single Worker runtime owner into authoring, then
   connect Workbench Save/Snapshot and Reader Placements;
2. add one-live article scheduling and disposable previews; and
3. only then author official Presets, Experiments, articles, and Lessons.

Earlier case catalogs, lesson documents, numeric Experiment revisions, Working
Set / Reader Brief types, and certification artifacts are not product-data
authorities.

## Numerical model and research material

`engine/`, `tools/`, `data/myocardium/`, and `docs/myocardium/` contain
numerical implementation, verification work, and research artifacts required
for the V3 integration. They are separate from durable Studio content.
Research-artifact integrity digests and computed results are not copied into
Experiments.

The Workbench now advances the admitted exact V3 development package. Its
Parameter catalog and durable `ParameterSet` are absent. Its registered Control
catalog exposes four numeric reset controls: systemic and pulmonary resistance,
venous tone, and arterial stiffness. The engine's `releaseReady` and
`simulationReady` claims remain false.

## Important: research and teaching only

CircleHeart is not a medical device. Do not use it for diagnosis, treatment
decisions, patient-specific predictions, or drug dosing.

As a 0D lumped-parameter model, it does not represent 3D flow, regional wall
motion, patient-specific morphology, or detailed autonomic and organ-system
interactions. Numerical outputs are subjects of verification, not fixed
physiological constants or clinical facts.

## Development

Requirements:

- Node.js 20 or later
- npm

```bash
npm install
npm run dev
```

Primary checks:

```bash
npm run typecheck
npm run check:repository-hygiene
npm run verify:registry:main-wire-v3
npm run test:fast
npm run test:pr
npm run build
```

Audit test-suite ownership:

```bash
npm run test:suites:audit
```

## Main directories

```text
studio/contracts/v2/          current Studio domain contracts
studio/application/           authoring command boundary
studio/infrastructure/model/  exact model registry implementation
studio/integrations/          exact model-specific Studio adapters
studio/composition/           registry/default application composition
studio/workers/               generic live simulation Worker boundary
engine/                       numerical model and runtime
docs/studio/                  current Studio design
docs/myocardium/              V3 research and verification documents
data/myocardium/              machine-readable research artifacts
__tests__/                    application and runtime tests
```

## Change policy

- Route new Studio work through the V2 contracts.
- Do not add fallback readers, dual writes, or compatibility aliases for the
  removed content model.
- Register a new `modelId` whenever model behavior, schema, codec, catalog, or
  gate changes.
- Official content must pin an exact registered model.
- Consult Git history instead of restoring superseded design into the working
  tree.
