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

- `modelId` and `modelFamilyId`;
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
  surfaceSeriesId: string;
  predecessorSurfaceReleaseId: string | null;
  modelFamilyId: string;
  controlCatalog: readonly SurfaceControl[];
  derivedOutputCatalog: readonly DerivedOutput[];
  graphCatalog: readonly GraphDefinition[];
  knobCatalog: readonly KnobDefinition[];
  protocolCatalog: readonly ProtocolDefinition[];
}>;
```

Every control, derived output, graph, Knob, and protocol declares its own
`requiredCapabilities`. Before use, the resolver validates the immutable
Surface and materializes only the items supported by the pinned exact model
and Studio build. Adding a graph that requires a new primitive signal therefore
hides that graph from an older family member; it does not reject the whole
Surface. Existing content fails only when it explicitly references an item that
cannot be materialized for its pinned model.
The registered manifest remains byte-exact; the filtered runtime
materialization is a separate value and cannot masquerade as the manifest named
by `surfaceReleaseId`.

Derived calculations resolve through an immutable, versioned Studio
derivation registry. Every derived item must declare its
`derivation/<derivationId>` capability. The implementation consumes the full
Worker-side accepted-substep primitive stream, including event-clipped
substeps; it must not derive scientific metrics from decimated presentation
frames. An existing derivation ID is permanently behavior-immutable and remains
loadable in future Studio builds. Changed behavior requires a new derivation ID
and repository checks must prevent deletion of any released implementation.
A Surface can never introduce executable code or silently reinterpret an
existing derived output.

Within one `surfaceSeriesId`, additions are append-only. Every non-root release
names its immediate `predecessorSurfaceReleaseId`. An existing control, output,
graph, Knob, or protocol cannot be removed or changed. Supabase fetches and
structurally compares the predecessor inside the registration transaction;
the publish tool performs the same detailed check before registration. Channel
movement is a compare-and-swap operation and accepts only the current pointer's
immediate successor. Changing semantics requires a new Surface series and never
mutates an old row.

Protocols are declaration-only until their runtime contract is implemented.
Before first use, that contract must define accepted-boundary action timing,
input-epoch changes, interruption, and what an in-progress protocol contributes
to fixture/checkpoint capture. A protocol definition alone does not imply that
unexecuted future actions are part of a Snapshot.

The executable registry boundary is:

```sh
npm run verify:registry:model-surface -- \
  --manifest path/to/surface.json [--previous path/to/prior-surface.json]

npm run publish:registry:model-surface -- \
  --project-ref <ref> --manifest path/to/surface.json \
  [--stage dev|stable] [--channel default|research]
```

`--previous` is forbidden for a root release and mandatory for every manifest
that names a predecessor. Registration starts at `dev`. A default-channel move
therefore requires the
explicit `--stage stable --channel default` combination. The publisher rejects
an uncommitted manifest, while Supabase rejects a reused `surfaceReleaseId`
whose immutable manifest differs, a non-additive successor, a forked series,
or a stale channel transition.

During the
`development-36` compatibility period, its embedded V2 catalogs remain the
runtime authority. The parallel V3/V1 contracts are introduced now so the
next exact ABI can cut over without rebinding the historical package. That
cutover is not complete until mutable Experiments resolve the latest compatible
Surface, immutable Snapshots pin the exact `surfaceReleaseId`, public gates
require both the exact model and pinned Surface to be `stable`, and an
end-to-end test proves an older exact Experiment can open after an additive
Surface release. Until then, this PR is registry scaffolding rather than a
claim that the Workbench already consumes Surface releases.

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
- It fails closed when the research registry is unavailable; it never silently
  runs the bundled default model under a Model Lab label.
- It uses the same Workbench and Worker architecture as ordinary Sessions.
- Private Experiment Save and neutral Snapshot creation are permitted.
- Public Experiment publication is absent in the Lab UI and rejected by the
  database unless the Snapshot's exact model is `stable`.
- An unregistered local/dirty build may later be injected into this same Lab
  as ephemeral runtime state; it is not a second “pre-lab” product or stage.
- The route is available in development builds and can be explicitly enabled
  in production with `VITE_MODEL_LAB_ENABLED=1` for controlled research use.
  The production flag must remain off until research-channel reads are protected
  by an authenticated research-access policy.

## 7. Succession and migration

An explicit immutable succession relation currently declares only `successor`:
conceptual lineage. `drop-in` is deliberately rejected until registration can
require a verifier version and immutable evidence artifact/digest.

A succession edge never silently rewrites stored content. A user chooses upgrade/clone,
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

Surface rows include a series and immediate predecessor; registry admission
enforces exact-definition append-only growth and channel CAS. Service-role RPCs
register immutable rows, advance lifecycle monotonically,
and move allowed channels. Browser RPCs can only read. Database triggers reject
both Experiment publication and Article publication when any referenced
Snapshot is not pinned to a `stable` exact model. Snapshot creation itself is
allowed for `dev`, so research work remains saveable without becoming public.

## 10. Binding invariants

1. `modelId` identifies the exact numerical kernel, not Studio presentation.
2. `surfaceReleaseId` cannot redefine primitive model semantics.
3. An additive Surface successor cannot remove or redefine an existing item.
4. Unsupported new items are filtered per item, not by rejecting the Surface.
5. `default` serves only `stable`; `research` never serves `retired`.
6. Retired exact releases remain available to already-pinned content.
7. One common admission service owns every Snapshot insertion path.
8. No Snapshot admission profile enters model identity or portable content.
9. Model Lab is one Workbench surface, not a separate data model.
10. Official-content rebuilds and user migrations are explicit.
