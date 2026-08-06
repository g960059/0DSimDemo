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

The authority for Studio data and ownership boundaries is
[`docs/studio/DESIGN-STUDIO-003-experiment-data-architecture.md`](docs/studio/DESIGN-STUDIO-003-experiment-data-architecture.md),
with Reader and Briefing IA defined by
[`docs/studio/DESIGN-STUDIO-004-reader-briefing-experiment-ia.md`](docs/studio/DESIGN-STUDIO-004-reader-briefing-experiment-ia.md).

The central structure is:

```text
RegisteredModel(modelId)

ExperimentSession (ephemeral, mutable; operated in Workbench)
  └─ ExperimentContent
       ├─ ScenarioCapture[] = fixture + checkpoint
       └─ ExperimentSurface = graphs + outputs + controls + one note

Experiment (explicitly saved, mutable by version-checked Save)
  └─ ExperimentContent

ExperimentSnapshot (neutral, immutable, admitted)
  └─ ExperimentContent

ExperimentPublication = public pointer → snapshotId
ExperimentPlacement = snapshotId + Briefing + title/caption
```

Key decisions:

- `modelId` is the exact immutable identity of equations, runtime, solver,
  fixture schema, checkpoint codec, catalogs, and Snapshot admission
- package integrity is checked only when registering a model; runtime clients
  trust the registry
- a parameter action ends after updating the fixture; there is no durable
  `ParameterSet`
- Scenario Presets, Experiments, and Snapshots keep `fixture + checkpoint` together
- an unsettled Experiment may be saved; Snapshot admission restores a detached
  fork and runs one cycle of finite, conservation, and event checks
- admission neither requires settlement nor replaces the captured checkpoint
- immutable versions use `snapshotId`, not a numeric revision
- portable Snapshots carry no purpose kind or source/parent/head lineage
- an Article Placement owns its Briefing and pins a neutral Snapshot
- `/experiments/new` has no ID; only the first successful explicit Save mints
  an `experimentId`
- Snapshot/PV/Starling resume live lanes immediately after atomic capture and
  run in a bounded warm Worker pool
- opening Workbench does not add anything to My Experiments
- settlement, numerical health, input epochs, and live samples are not durable
  content

## Current V3 direct-cutover state

No official Scenario Presets, Experiments, articles, or Lessons will be
authored yet.

Completed:

1. package the canonical fixture, exact checkpoint, outputs, and
   accepted-boundary capture for `MainWireIntegratedModelTransactionV3`;
2. admit and resolve that exact release through the registry as the default;
3. run all visible Workbench Scenarios in persistent Worker lanes;
4. capture explicit Experiment Saves and common-admission immutable Snapshots;
5. author role-specific Placement Briefings against neutral Snapshots; and
6. pin those Snapshots from the Article Editor and Reader.

Remaining work includes weighted Reader extent, disposable inactive-placement
beat caches, a multi-release loader, and production OAuth/redirect, abuse-control,
and scheduled-GC configuration. Official Presets, Experiments, articles, and
Lessons follow those boundaries rather than the removed legacy structures.

In a Supabase-configured build, the remote backend exclusively owns
Experiment, Snapshot, and Article reads/writes, publication pointers, and the
exact-model registry. The browser store is only an unconfigured test/development
fallback; the product does not dual-write.

Earlier case catalogs, lesson documents, numeric Experiment revisions, Working
Set / Reader Brief types, and certification artifacts are not product-data
authorities.

## Numerical model and research material

`engine/`, `tools/`, `data/myocardium/`, and `docs/myocardium/` contain
numerical implementation, verification work, and research artifacts required
for the V3 integration. They are separate from durable Studio content.
Research-artifact integrity digests and computed results are not copied into
Experiments.

The Workbench now advances the admitted exact V3 development package. A
durable `ParameterSet` is absent; the registered Control catalog exposes the
authorable parameters. The engine's `releaseReady` and
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
supabase/                      Auth, registry, and content release spine
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
  admission changes.
- Official content must pin an exact registered model.
- Consult Git history instead of restoring superseded design into the working
  tree.
