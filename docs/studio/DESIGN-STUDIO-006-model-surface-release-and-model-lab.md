# CircleHeart Studio — exact model, Model Surface, and Model Lab

Status: authoritative pre-release contract; direct cutover

Date: 2026-08-07

Decision: keep exact numerical identity small and permanent, release the
authoring/analysis Surface independently, use only three lifecycle stages and
two launch channels, and provide one Model Lab. Snapshot admission remains one
Studio service rather than a release/profile dimension.

This document refines the model-release boundary in
`DESIGN-STUDIO-003-experiment-data-architecture.md`. It does not redefine
Experiment, Snapshot, Placement, or Briefing.

## 1. The release spine

```text
Exact model kernel                    immutable modelId
  equations / state topology
  solver and event semantics
  fixture schema and control binding
  checkpoint codec and restore
  primitive controls and signals
  executable artifact

Model Surface                         immutable surfaceReleaseId
  exposed control selection
  derived outputs
  graph definitions
  Knobs
  protocols

Official content recipe              immutable recipeId in Git
  scenario construction actions
  authored Surface composition
  scientific assertions
       ↓ build against one exact model + one Surface
  ExperimentSnapshot / Article content
```

`modelFamilyId` groups compatible releases of one conceptual model. It is not
an executable identity and never replaces `modelId`. There is no additional
`releaseId` below `modelId`.

## 2. Exact numerical identity

The next standard ABI uses `ExactModelKernelManifestV3`. Its exact-key shape
contains:

- `modelId`, `modelFamilyId`, and a human display name;
- equations, runtime, and solver definitions;
- fixture schema and checkpoint codec;
- primitive control definitions and primitive signal definitions;
- explicit capabilities; and
- the registered executable artifact bytes, guarded by registry integrity.

It cannot contain Snapshot admission, graph catalogs, derived metrics, Knobs,
protocols, labels, colors, Article behavior, or product policy. Exact-key
validation rejects those fields.

A new state variable, result-affecting topology/path, changed parameter
semantics, changed default-on behavior, changed primitive output semantics, or
changed numerical algorithm requires a new `modelId`. A default-off feature
still changes the executable/state/checkpoint contract and therefore receives
a new `modelId`; “off by default” is not an identity exemption.

The committed `development-36` artifact predates this split. Its bytes,
manifest, modelId, and legacy ABI remain untouched. The common Snapshot
admission service treats the gate exported by that artifact as a compatibility
adapter. The first standard-ABI successor adopts the smaller kernel boundary.

## 3. Model Surface release

`ModelSurfaceReleaseManifestV1` is immutable and family-scoped. It contains:

```ts
type ModelSurfaceReleaseManifestV1 = Readonly<{
  surfaceReleaseId: string;
  modelFamilyId: string;
  requiredCapabilities: readonly string[];
  controlCatalog: readonly SurfaceControl[];
  derivedOutputCatalog: readonly DerivedOutput[];
  graphCatalog: readonly GraphDefinition[];
  knobCatalog: readonly KnobDefinition[];
  protocolCatalog: readonly ProtocolDefinition[];
}>;
```

Before use, the client validates the immutable Surface and verifies every
required capability, primitive control reference, output dependency, graph
series, Knob target, and protocol action against the pinned exact model.
Derived calculations resolve through an immutable, versioned Studio
derivation registry. Every `derivationId` must have a matching declared
`derivation/<id>` capability; a Surface can never introduce executable code or
silently reinterpret an existing derived output.

Within one stable Surface line, additions are append-only. An existing control,
output, graph, Knob, protocol, or required capability cannot be removed or
changed. The registry compares existing definitions structurally; changing
semantics requires a new Surface release and never mutates an old row.

The executable registry boundary is:

```sh
npm run verify:registry:model-surface -- \
  --manifest path/to/surface.json [--previous path/to/prior-surface.json]

npm run publish:registry:model-surface -- \
  --project-ref <ref> --manifest path/to/surface.json \
  [--stage dev|stable] [--channel default|research]
```

Registration starts at `dev`. A default-channel move therefore requires the
explicit `--stage stable --channel default` combination. The publisher rejects
an uncommitted manifest, while Supabase rejects a reused `surfaceReleaseId`
whose immutable manifest differs.

Authored content may eventually pin `surfaceReleaseId` when it depends on a
Surface definition unavailable from its historical exact package. During the
`development-36` compatibility period, its embedded V2 catalogs remain the
runtime authority. The parallel V3/V1 contracts are introduced now so the
next exact ABI can cut over without rebinding the historical package.

## 4. Lifecycle and channels

There are exactly three release stages:

| Stage | Meaning | Private Save/Snapshot | Public publication |
| --- | --- | --- | --- |
| `dev` | under active evaluation | yes | no |
| `stable` | approved for ordinary users | yes | yes |
| `retired` | historical resolution only | existing content only | no new publication |

Allowed transitions are `dev → stable`, `dev → retired`, and
`stable → retired`. `retired` is terminal. Retirement removes mutable channel
pointers but does not make historical exact content unreadable. The separate
emergency `loadable=false` registry switch remains available for a genuinely
unsafe artifact.

There are exactly two channels:

- `default`: must point at a `stable` exact release/Surface and is resolved by
  new ordinary Sessions;
- `research`: may point at `dev` or `stable` and is resolved by Model Lab.

Channel resolution is launch-time only. The returned immutable IDs are pinned
immediately. Existing Experiments and Snapshots never follow a moved channel.

## 5. Snapshot admission is not a profile

There is no `SnapshotAdmissionProfile` domain object, release axis, database
table, or content field. Article Briefing capture and standalone Experiment
publication call the same `StudioSnapshotAdmissionServiceV1`.

Admission is a product safety invariant: exact restore/round-trip, finite and
conservation checks, event identity, and bounded executable verification. It
does not establish physiological validation or settlement and cannot replace
the frozen checkpoint. If the implementation later changes incompatibly, an
internal receipt/version may be logged operationally; authors never choose a
profile and Snapshot identity does not carry one.

## 6. One Model Lab

The sole lab route is `/dev/model-lab`.

- It resolves the `research` channel and pins the returned exact model.
- It uses the same Workbench and Worker architecture as ordinary Sessions.
- Private Experiment Save and neutral Snapshot creation are permitted.
- Public Experiment publication is absent in the Lab UI and rejected by the
  database unless the Snapshot's exact model is `stable`.
- An unregistered local/dirty build may later be injected into this same Lab
  as ephemeral runtime state; it is not a second “pre-lab” product or stage.
- The route is available in development builds and can be explicitly enabled
  in production with `VITE_MODEL_LAB_ENABLED=1` for controlled research use.

## 7. Succession and migration

An explicit immutable succession relation may declare:

- `drop-in`: registry CI has proved the stated fixture/checkpoint/catalog
  compatibility; or
- `successor`: conceptual lineage only.

Neither grade silently rewrites stored content. A user chooses upgrade/clone,
which creates new content pinned to the target `modelId` and records migration
provenance outside portable numerical identity. Old content stays loadable.

## 8. Official content recipes

Official Presets, Experiments, and Articles are authored as model-family
recipes in Git rather than hand-maintained database objects. A recipe does not
contain a mutable channel or exact `modelId`. The build command receives an
exact `modelId` and Surface release, applies absolute control assignments,
runs model-owned settlement/scientific assertions, calls the same Snapshot
admission service, and emits immutable content plus a reviewed build report.

`OfficialExperimentRecipeV1` is the first checked source boundary. It owns
Scenario IDs/labels, absolute control assignments, the authored Surface, and
scientific assertion IDs. It cannot encode a checkpoint, `modelId`, channel,
stage, or admission profile. Repository recipes are checked with
`verify:content:official-recipe`; no official content is seeded until the
corresponding numerical and editorial review is ready.

Changing the default model therefore means rebuilding and reviewing official
content, not silently repinning it. User content is never rebuilt by this
pipeline.

## 9. Database authority

Supabase owns:

```text
model_releases                       immutable exact packages
model_release_availability           stage + emergency loadable switch
model_release_channels               default | research
model_surface_releases               immutable Surface manifests
model_surface_release_availability   stage
model_surface_release_channels       family + default | research
model_release_successions            explicit lineage
```

Service-role RPCs register immutable rows, advance lifecycle monotonically,
and move allowed channels. Browser RPCs can only read. Database triggers reject
both Experiment publication and Article publication when any referenced
Snapshot is not pinned to a `stable` exact model. Snapshot creation itself is
allowed for `dev`, so research work remains saveable without becoming public.

## 10. Binding invariants

1. `modelId` identifies the exact numerical kernel, not Studio presentation.
2. `surfaceReleaseId` cannot redefine primitive model semantics.
3. `default` serves only `stable`; `research` never serves `retired`.
4. Retired exact releases remain available to already-pinned content.
5. One common admission service owns every Snapshot insertion path.
6. No Snapshot admission profile enters model identity or portable content.
7. Model Lab is one Workbench surface, not a separate data model.
8. Official-content rebuilds and user migrations are explicit.
