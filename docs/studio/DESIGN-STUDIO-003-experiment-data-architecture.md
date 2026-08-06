# CircleHeart Studio — Experiment data architecture

Status: authoritative pre-release architecture and current direct-cutover
implementation contract for Studio identity, persistence, Snapshot publication,
Placement, and Reader runtime ownership

Date: 2026-08-01

Decision: registry-trusted exact `modelId`, mutable Experiment workspace,
immutable Experiment snapshot

This is the only active Studio data-architecture document. Superseded
`ParameterSet`, Working Set / Reader Brief entities, numeric Experiment revision,
certification-artifact, placement-mode, and session-only preview designs were
removed from the working tree and remain available only in Git history.
Current V3 scientific validation remains a separate model concern. Historical
sidecar benches, readiness artifacts, and pre-V3 authored scenario generators
are removed rather than reclassified as active evidence.

## 1. Decision

Studio's durable product model is:

```text
RegisteredModel(modelId)

ExperimentWorkspace (mutable)
  └─ ExperimentContent
       ├─ ScenarioCapture[]
       └─ ExperimentSurface

ExperimentSnapshot (immutable)
  └─ frozen ExperimentContent

ExperimentPlacement
  └─ pins one ExperimentSnapshot

StudioArticleDraft
  └─ owns ordered text and Experiment-placement blocks

SimulationSession (ephemeral)
ExperimentPreviewArtifact (disposable)
```

The minimum domain roots are:

- one exact, immutable `modelId`;
- one mutable Experiment workspace with an optimistic `draftVersion`;
- one immutable `snapshotId` for each publishable capture;
- one lineage-only `parentSnapshotId`;
- one placement that pins an immutable snapshot;
- one runtime session whose numerical and asynchronous correlation state is
  never durable content.

Studio V2 does not introduce durable `ParameterSet`, `AssessmentReport`,
`CertifiedSeed`, `PublicationManifest`, `WorkingSet`, or `ReaderBrief`
entities.

## 2. Boundary and ownership

```text
Model registry
  atomically admits the manifest, nonempty exact executable artifact bytes,
  and the model-bound executable bundle; owns exact modelId registration and
  exact-runtime resolution

Model package
  owns equations, runtime, solver semantics, fixture schema,
  checkpoint codec, minimum snapshot gate, control/output/graph catalogs,
  and the private mapping from semantic controls into complete fixtures

Studio authoring
  resolves one registry-bound exact runtime containing the allowlisted contract
  and executable adapters; owns Experiment workspace, Scenario composition, Surface, note,
  Snapshot, Placement

Simulation runtime
  owns accepted state, live stepping, settlement checks, numerical checks,
  asynchronous intent correlation

Reader delivery
  owns one-live scheduling and disposable preview artifacts
```

Studio does not interpret model checkpoint payloads or import engine-specific
state classes. Model adapters validate fixture/checkpoint compatibility every
time a capture enters or leaves the Studio authoring boundary.

## 3. Identity and integrity

### 3.1 Domain identities

The following are opaque IDs, not hashes:

```text
modelId
experimentId
snapshotId
parentSnapshotId
placementId / blockId
scenarioId
```

`experimentId` identifies one logical authoring series.

Workbench identity is model-independent and URL-addressable. `/workbench` is
the selector; `/workbench/:workbenchId` opens one opaque `experimentId`. New
IDs are browser-generated URL-safe random tokens and never encode a default
model, release name, digest, or hash. A saved Workspace remains pinned to its
own exact `content.modelId`. Opening the selector after a default-model change
therefore never reuses or mutates an older Workspace: the user may open it when
that exact release is available, export/delete it when unavailable, or create a
new opaque Workbench on the latest default release.

`snapshotId` identifies one immutable materialization. It replaces
`experimentId + numeric revision` as the exact content reference.

`parentSnapshotId` records derivation only. It never means inheritance,
read-through, or automatic propagation. A fork may create a new
`experimentId` whose first snapshot points to a snapshot from another series.

`draftVersion` is the only numeric content-side revision. It is an optimistic
concurrency token for the mutable workspace, not immutable content identity,
scientific revision, or a Reader reference.

### 3.2 Exact `modelId`

One `modelId` identifies exactly one registered execution release.

The release includes every contract element that can affect restore,
simulation, output meaning, or the minimum snapshot gate:

- model equations and model-owned defaults;
- runtime and solver semantics;
- fixture schema;
- checkpoint schema and codec;
- semantic control-to-fixture mappings and control reset behavior;
- observable and metric semantics;
- event ordering and random-number semantics where applicable;
- minimum settlement/numerical gate;
- model-owned catalogs used by stored Experiment content.

There is no many-builds-per-`modelId` concept in V2. Any normative package
change, including a behavior-preserving optimization with different package
bytes, requires a new `modelId`. `modelFamilyId` provides UI grouping across
exact releases.

This is intentionally conservative. A future compatible-build feature would
need an explicit numerical conformance profile and build provenance. V2 does
not need that complexity.

The registry admits one exact, fail-closed
`RegisteredModelPackageManifestV2`; there is no separately supplied public
contract or parallel package-content object that could disagree with it:

```ts
type RegisteredModelPackageManifestV2 = {
  schemaId: "circleheart-studio-registered-model-package-v2";
  modelId: string;
  modelFamilyId: string;
  displayName: string;
  equations: JsonObject;
  runtime: JsonObject;
  solver: JsonObject;
  fixtureSchema: {
    fixtureSchemaId: string;
    definition: JsonObject;
  };
  checkpointCodec: {
    checkpointCodecId: string;
    definition: JsonObject;
  };
  snapshotGate: {
    snapshotGateId: string;
    definition: JsonObject;
  };
  catalogs: {
    controlCatalog: ControlDefinition[];
    outputCatalog: OutputDefinition[];
    graphCatalog: GraphDefinition[];
  };
};
```

All manifest records use exact keys. Equations, runtime, solver, fixture-schema
definition, checkpoint-codec definition, and snapshot-gate definition must be
non-empty portable JSON objects. Missing or empty normative definitions are
rejected rather than filled with defaults.

The registry derives `ModelContractV2` from this manifest by explicit
allowlisting. Public model resolution cannot carry integrity digests, build
IDs, release metadata, or arbitrary catalog properties.

### 3.3 Registry-only hash

The registry computes package integrity when a model is registered. Admission
receives canonical manifest data, a nonempty exact built-artifact byte sequence,
and a trusted loader that materializes the executable bundle from those bytes:

```text
new modelId + complete manifest + exact executable artifact bytes
  → validate
  → canonicalize the complete manifest and frame it with the artifact bytes
  → calculate one internal digest over both
  → use the trusted loader to materialize and identity-check the executable bundle
  → store immutable digest-addressed bytes
  → atomically bind modelId to that digest and executable bundle

same modelId + byte-equivalent canonical manifest and artifact
  → idempotent

same modelId + any different manifest or artifact byte
  → reject
```

The digest is registry/storage metadata. It is not returned as Studio domain
identity and is not stored in Experiment, Snapshot, Placement, Preset, or
runtime commands.

The executable bundle contains the capture validator, accepted-boundary Draft
capture, minimum Snapshot gate, and fixture reducer. Each declares the exact
model/schema/codec/gate identities it uses, and all are admitted together;
there is no post-registration adapter API. A trusted loader must materialize the
bundle represented by the supplied artifact bytes. A repeated admission with
the same manifest and bytes returns the already stored runtime even if a loader
invocation would allocate new JavaScript function objects; function reference
identity is not package identity.

Clients trust authenticated delivery of the registry-admitted release. The
exact executable artifact is shipped as an ordinary ESM build input and is the
sole source for both client compositions. The main thread derives only its
public package projection; the Worker materializes the executable bundle and
owns the numerical runtime. Neither composition recreates an executable bundle
independently from the integration source, fetches raw artifact text, or
evaluates it through a Blob/data URL. Exact-byte evaluation belongs to registry
admission and CI; authenticated client delivery may apply ordinary bundler
transforms. The internal digest remains registry-private. Clients neither
recompute that digest nor rehash packages at load or during simulation. They
still perform ordinary schema, codec, model-ID, exact-key, range, and structural
compatibility validation.

For the integrated V3 development release, CI builds the exact model adapter
entry as a deterministic registry artifact, frames it with the canonical
manifest, and compares the internal digest with the checked registry-admission
lock. A pull request that changes that framed package while retaining the prior
`modelId` fails. This lock is registration/CI metadata; it is never delivered
through the client catalog or copied into Studio content.

Content-addressed blob storage may continue to use checksums internally.
Storage addressing and corruption detection are not Studio domain identity.

## 4. Model surface

One model contract exposes three model-owned catalogs:

```text
controls
outputs
graphs
```

Observable and metric catalogs are unified as `outputs`, while their runtime
semantics remain discriminated:

```ts
type OutputDefinition =
  | {
      outputId: string;
      kind: "signal";
      unit: string;
      shape: "scalar" | "vector";
      sampling: "accepted-step" | "event";
    }
  | {
      outputId: string;
      kind: "metric";
      unit: string;
      shape: "scalar" | "vector";
      scope: "instant" | "beat" | "window";
      dependencies: readonly string[];
    };
```

Graph panes, output-pane items, and control-pane items stored in an Experiment
refer to these catalog definitions by ID. A stored pane does not copy a second
catalog.

Controls are semantic, numeric reset commands rather than durable parameter
entities:

```ts
type ControlDefinition = {
  controlId: string;
  valueType: "number";
  unit: string;
  minimum: number;
  maximum: number;
  step: number;
  defaultValue: number;
  changeSemantics: "reset";
};
```

`minimum < maximum`, `step > 0`, `step` no larger than the range, and an
inclusive in-range `defaultValue` are registry admission requirements. Labels
remain application-localized and are not model-package metadata.

Graphs explicitly select one allowlisted renderer:

```ts
type GraphDefinition =
  | {
      graphId: string;
      renderer: "sweep";
      seriesCatalog: readonly {
        kind: "scalar";
        seriesId: string;
        outputId: string;
      }[];
      defaultSeriesIds: readonly string[];
    }
  | {
      graphId: string;
      renderer: "pressure-volume";
      seriesCatalog: readonly {
        kind: "pressure-volume";
        seriesId: string;
        volumeOutputId: string;
        pressureOutputId: string;
        pressureBasis: "transmural" | "intracavitary";
        cyclePhaseOutputId: string;
        guideMode: "none" | "lv-single-beat-orientation";
      }[];
      defaultSeriesIds: readonly string[];
    }
  | {
      graphId: string;
      renderer: "structural-return";
      analysisId: string;
      side: "right" | "left";
    };
```

The model owns the semantic series a graph can display. A sweep series binds
one scalar Output; every sweep series in one graph uses one registered unit. A
pressure-volume series binds the volume, pressure, and model-emitted cycle
phase roles explicitly. The renderer never guesses those roles from an output
name. `defaultSeriesIds` is a nonempty ordered subset of that graph's series
catalog and defines only its initial presentation.

A `structural-return` graph is an explicit on-demand cardiac analysis, not a
live output projection. It exposes neither a series catalog nor defaults; its
portable `analysisId` plus `side` select one model-owned analysis
implementation. No analysis options or arbitrary JSON configuration may be
embedded in the catalog definition.

This is an explicitly allowlisted semantic surface, not an extensible metadata
bag. Additional renderer kinds, formatting, and richer control presentation
require an explicit allowlisted contract revision. Unknown catalog keys are
rejected, including fields named like build, release, or integrity metadata.

Stored output and control items select catalog definitions only. They do not
own presentation colors or durable Scenario bindings. The Scenario Manager's
active Scenario supplies the output/controller context at runtime.

## 5. Fixture, checkpoint, and Scenario

### 5.1 Fixture

`fixture` is the complete current externally configured input:

- model parameters;
- rhythm configuration;
- valve/circulation/device configuration;
- controller targets;
- model-defined initialization configuration that remains authoritative after
  restore.

The fixture is the durable source of truth for configured parameters. A
parameter change is not stored as a durable action after it has been applied.

### 5.2 Checkpoint

`checkpoint` is the complete restorable numerical state at one accepted
solver boundary:

- accepted revision and simulation time;
- internal circulation/mechanics/device/rhythm state;
- event and solver memory required for exact continuation;
- opaque model-owned payload interpreted by the registered checkpoint codec.

“Exact” means that the registered model release can restore that accepted
state. It does not mean settled, scientifically validated, certified, or
bit-identical under a different `modelId`.

Checkpoint payloads carry numerical state, the codec's structural identities,
and corruption guards only. They do not repeat release blockers, readiness,
clinical/physiological validation flags, or an `exactResumeClaim` object. Those
semantics are pinned by `modelId` and belong to the model contract or current
scientific documentation, not every saved Scenario.

An accepted boundary exists after an accepted numerical step. Settlement is a
separate convergence property over a beat/window. Therefore an unsettled Draft
can still contain a valid exact checkpoint.

### 5.3 Atomic capture

Fixture and checkpoint are one indivisible value:

```ts
type ScenarioCapture = {
  fixture: Fixture;
  checkpoint: Checkpoint;
};
```

Changing a fixture immediately invalidates its previously paired checkpoint.
Save waits for the new fixture to be applied at an accepted command boundary,
then captures a fresh checkpoint and commits the pair atomically.

An edited fixture is never represented as a `ScenarioCapture`. Save intent has
a separate checkpoint-free ephemeral shape:

```ts
type ExperimentDesiredScenario = {
  scenarioId: string;
  label: string;
  fixture: Fixture;
};

type ExperimentDesiredContent = {
  modelId: string;
  scenarios: ExperimentDesiredScenario[];
  surface: ExperimentSurface;
};
```

Only the accepted-boundary capture port may turn this desired content into
durable `ExperimentContent` containing complete `ScenarioCapture` values.
Every persisted workspace therefore contains valid fixture/checkpoint pairs;
the desired/edit type is never written to the repository.

If a codec duplicates configured values inside its opaque checkpoint payload,
the model adapter must validate equality with the fixture at capture and
restore. Studio still treats the fixture as authoritative.

### 5.4 Exact capture adapter

The exact-runtime resolver is keyed by `modelId`. It returns one atomically
registered bundle containing the public contract and all executable adapters.
The capture adapter declares the exact triple:

```text
modelId + fixtureSchemaId + checkpointCodecId
```

All three values must match the registry-derived model contract before either
adapter function is called. The Snapshot gate additionally declares the exact
`modelId + snapshotGateId`; Draft capture declares the exact
`modelId + fixtureSchemaId + checkpointCodecId`; and the fixture reducer
declares `modelId + fixtureSchemaId`. The capture adapter exposes two
fail-closed operations:

```ts
validateFixture({ model, fixture }): void;
validateCapture({ model, capture }): Promise<void>;
```

Capture validation may restore the opaque checkpoint in an asynchronous model
runtime. Every authoring read or write awaits that validation before returning
the value or making a repository mutation visible.

Authoring applies them at these boundaries:

- workspace create and workspace/Snapshot read: validate every complete
  capture;
- Save pre-capture: validate checkpoint-free desired content, every desired
  fixture, Surface reference, and Scenario identity;
- Save post-capture: validate every complete fresh capture;
- Snapshot pre-gate and post-gate: validate every complete capture;
- Preset clone: validate the complete source capture before cloning it.

The portable fixture reducer is created from the exact-runtime resolver and
resolves its model adapter internally. Its public reduction call cannot accept
a caller-supplied adapter. Runtime context remains only `modelId` plus
`scenarioId`; fixture-schema identity is checked by the registry-bound factory
instead of being duplicated into runtime state.

## 6. Knobs and parameter changes

Studio has no durable `ParameterSet` entity.

A knob is a UI presentation of a registered control selected by the Experiment
Surface. It is not a second runtime or durable domain type. A parameter change
is one ephemeral semantic command:

```text
Knob interaction
  → controlId + value
  → require controlId in the exact model catalog
  → model-owned adapter expands it to an internal fixture patch
  → validate the complete resulting fixture
  → apply atomically at an accepted command boundary
  → action ends
```

The ephemeral desired fixture changes immediately. Save later captures and
persists the resulting fixture/checkpoint pair.

Every V2 control declares `changeSemantics: "reset"`. Applying a control value
therefore replaces the complete desired fixture and starts a fresh exact-model
runtime from that fixture; it does not continue from the pre-change checkpoint
as though the value were a time-resolved intervention. The prior live session
state is ephemeral. A subsequent Save captures the new runtime's accepted
fixture/checkpoint pair.

One action may change multiple parameters. Atomic multi-parameter behavior is
model-owned reduction behavior, not a reason to create a durable
`ParameterSet`:

```ts
type ControlAction = {
  kind: "control";
  controlId: string;
  value: number;
};
```

One shared rule validates catalog defaults, the public fixture reducer, and the
admitted live simulation adapter. It rejects non-finite values, values outside
the registered inclusive range, and values off the minimum-anchored
`minimum + n * step` lattice before model state can change. A small bounded
tolerance admits only ordinary IEEE-754 rounding around a lattice point; it
does not turn `step` into presentation metadata. Registry admission also
requires the inclusive maximum to lie on that lattice and rejects a lattice
span too large for finite, reliably distinguishable step arithmetic.

This lattice is a semantic-control contract, not fixture quantization. A
complete fixture entering through capture, restore, or a future explicit
fixture replacement remains valid at any continuous value accepted by the
model-owned fixture schema; `step` constrains only catalog control actions and
their defaults.

Raw fixture paths never cross the public command boundary. The registry-bound
model adapter may map one control to several fixture fields; the internal patch
is validated and applied as one unit. Partial application is forbidden.

## 7. Scenario Preset

The only optional reusable scenario object is a named complete capture:

```ts
type ScenarioPreset = {
  presetId: string;
  modelId: string;
  title: string;
  description: string;
  capture: ScenarioCapture;
};
```

Examples include Healthy baseline, Severe AS, HFrEF, or a device-enabled
starting state.

Applying a Preset clones its capture into an Experiment. There is no live link,
inheritance, or automatic update. Preset existence does not imply
qualification; its exact capture adapter validates the source before cloning,
and Snapshot creation always runs the model's current minimum gate.

If a dedicated Preset catalog is not needed, cloning a Scenario from an
existing Snapshot provides the same numerical behavior.

## 8. Experiment data

```ts
type Scenario = {
  scenarioId: string;
  label: string;
  capture: ScenarioCapture;
};

type ExperimentSurface = {
  graphPanes: Array<{
    paneId: string;
    role: "graph";
    label: string;
    order: number;
    priority: number;
    graphId: string;
    windowSec?: number; // required only for a registered sweep renderer
    series: Array<{
      seriesId: string;
      label: string;
      colorHex: string;
      order: number;
    }>;
  }>;
  outputPanes: Array<{
    paneId: string;
    role: "output";
    label: string;
    order: number;
    priority: number;
    items: Array<{
      outputId: string;
      label: string;
      order: number;
    }>;
  }>;
  controlPanes: Array<{
    paneId: string;
    role: "control";
    label: string;
    order: number;
    priority: number;
    items: Array<{
      controlId: string;
      label: string;
      order: number;
    }>;
  }>;
  note: { text: string };
};

type ExperimentContent = {
  modelId: string;
  scenarios: Scenario[];
  surface: ExperimentSurface;
};
```

An Experiment Surface stores authored role-pane composition:

- globally unique pane IDs and a fixed `graph | output | control` role;
- a nonempty trimmed label on every pane and item;
- a canonical lowercase `#rrggbb` color only on graph series;
- nonnegative pane order, unique within each role array, and nonnegative pane
  priority;
- unique output/control IDs and item order within each pane;
- exactly one Markdown-compatible `{ text }` note; its trimmed text may be
  empty.

The three pane arrays may be empty. Larger `priority` means more prominent.
When priorities tie, renderers use ascending `order`, then ascending `paneId`,
so responsive composition is deterministic without durable geometry.

A registered sweep graph requires a nonempty `series` and an authored
`windowSec` from 1 through 6 seconds in 0.5-second steps. It omits
`historyDepth`: its existing time trace remains continuous across a control
reset and leaves the window naturally as the sweep advances. A registered
pressure-volume graph also requires a nonempty `series`, omits `windowSec`, and
stores `historyDepth` from 0 through 3. `historyDepth` selects how many completed
pre-control parameter epochs are drawn as progressively faded presentation
context; the retained samples themselves remain ephemeral runtime data.
In both cases each authored `seriesId` must exist in that graph's own series
catalog. This is what lets a left-pressure pane offer LVP/LAP/AoP while a
pressure-volume pane offers LV/RV/RA/LA without letting settings accidentally
assemble an invalid renderer binding. A `structural-return` graph requires an
empty `series`, omits `windowSec`, and also stores `historyDepth` from 0 through
3 for prior exact analysis payloads. Output panes may select any registered
output.

Default Workbench graph composition is deliberately small: one left-heart
sweep with LVP/LAP/AoP and one pressure-volume pane with LV selected. Pane
addition belongs to each Dockview role area and is rendered immediately after
the rightmost tab in that area's rightmost tab group; it is not an action owned
by an individual pane's settings.

Graph color and Scenario identity are orthogonal. Signal/chamber identity owns
a stable hue (for example LVP/LV red, LAP/LA magenta, AoP blue, RVP/RV indigo,
and RAP/RA teal). Scenario order owns the line pattern (baseline solid, then
dash/dot variants). Thus Scenario 1 and Scenario 2 LVP share the same hue and
remain directly comparable, while all Scenario 2 curves share one line
pattern. Output and control panes remain neutral.

The pre-release Experiment domain admits at most four Scenarios. Durable
content validation, Worker add/duplicate admission, and the Scenario inspector
all enforce that same limit, preserving the one-to-one mapping between Scenario
ordinal and the four admitted line patterns.

It does not store viewport dimensions, `inflow | peek | fullscreen`, active
fullscreen state, open inspector state, Worker handles, runtime samples, or
settlement status.

### 8.1 Scenario Manager and controller inspector

Workbench presents the Scenario Manager inside the Dockview `control` role
area. It owns no numerical state. The active Scenario is ephemeral UI state;
controller items are durable Surface selections without Scenario bindings.
Selecting a Scenario makes that branch the neutral output/controller context.
Every visible control action therefore applies only to the active Scenario.

Each Scenario owns one persistent bidirectional numerical Worker and one live
scheduler lane. All admitted Scenarios are wall-clock paced concurrently; the
active Scenario selects only the neutral output/controller inspector context.
This avoids serial branch restoration, keeps numerical ownership off the main
thread, and lets graph panes compare every Scenario live. The following
operations are runtime-pool commands, not optimistic UI array edits:

```text
add from Preset  -> validate the complete Preset capture and create one lane
duplicate        -> capture the selected exact branch and create an independent lane
select           -> change the inspector context without pausing another lane
rename           -> change branch metadata only
delete           -> dispose one lane; at least one must remain
```

Add and duplicate activate the new branch. Deleting the active branch selects
a deterministic remaining branch. Pool mutations temporarily pause all lanes
at accepted boundaries; a failed lane construction leaves the existing pool
unchanged. Save and Snapshot commands capture every lane only at their explicit
authoring boundaries. Runtime session IDs, input epochs, schedulers, and lane
membership never become durable Experiment content.

Adding, duplicating, or deleting a Scenario does not rewrite the Surface.
Duplicating creates an independent exact branch: later control changes and
accepted steps in the copy cannot mutate the baseline fixture or checkpoint.

## 9. Mutable workspace

```ts
type ExperimentWorkspace = {
  experimentId: string;
  draftVersion: number;
  headSnapshotId: string | null;
  basedOnSnapshotId: string | null;
  content: ExperimentContent;
};
```

`headSnapshotId` is the current immutable head of this logical series.

`basedOnSnapshotId` is the immutable snapshot from which the current Draft was
derived. For an ordinary edit it equals the current head. For a new fork,
`headSnapshotId` is null and `basedOnSnapshotId` is the source snapshot.

The workspace may be saved while live, transitioning, unsettled, or
numerically unhealthy. These statuses are recomputed runtime signals and are
not durable fields.

## 10. Immutable Experiment Snapshot

```ts
type ExperimentSnapshot = {
  snapshotId: string;
  experimentId: string;
  parentSnapshotId: string | null;
  content: ExperimentContent;
  createdAt: string;
  createdBy?: string;
};
```

There is no numeric snapshot revision.

Snapshot creation is the only sealed write path. Snapshot tables/collections
must not expose generic insert, migration bypass, caller-supplied qualification
flags, or a raw commit port from the public Studio barrel. The in-memory V2
composition factory keeps the repository and a module-private runtime
capability inside the module and returns a plain frozen façade of bound
authoring functions plus read-only queries. Application dependencies are
ECMAScript `#private` fields. Possessing an object with a look-alike commit
method or `Symbol` is not sufficient to publish a Snapshot.

The existence of a Snapshot means only:

> The exact stored content passed the minimum snapshot gate pinned by its
> `modelId` at creation time.

It does not claim complete scientific V&V, clinical validation, regulatory
certification, or freedom from future model defects.

No `settled: true`, `verificationPassed: true`, Assessment report, or
Certification object is duplicated into Snapshot content. An operational
command receipt may be retained outside the domain model.

## 11. Save and Snapshot command boundaries

### 11.1 Save Draft

```text
SaveDraft(expectedDraftVersion, desiredContent,
          captureCorrelation?)
  1. clone and freeze checkpoint-free ExperimentDesiredContent
  2. exactly bind the model capture adapter and validate modelId, Scenario
     identity/order/label, every desired fixture, and Surface references
  3. if captureCorrelation is omitted, require every desired Scenario to
     already exist with an exactly equal fixture, then reuse those checkpoints
     while allowing Surface, label, order, or Scenario removal to change
  4. otherwise validate one runtime-only session ID and expected input epoch
     for every desired Scenario in exact order
  5. call captureAcceptedCandidate with experimentId, exact model,
     desiredContent, session ID, and expected epochs
  6. wait until each new or dirty Scenario reaches an accepted command boundary
  7. construct complete atomic fixture/checkpoint pairs
  8. require the port to confirm the same Experiment, session, Scenario order,
     and input epochs; reject stale or cross-session completion
  9. validate every complete returned or reused capture
 10. prove the capture port preserved modelId, Scenario order/identity/label,
     fixture values, and Surface exactly
 11. compare-and-swap draftVersion
 12. expose either the whole complete workspace or none
```

The capture correlation is runtime-only and is never written into Workspace or
Snapshot content. This also rejects the ABA case in which a fixture changes and
later returns to the same JSON value while an older capture is still pending.

Surface/label/order-only Save therefore does not require a live runtime. A new
Scenario or changed fixture always requires explicit capture correlation and a
fresh accepted-boundary capture. Save does not require settlement or the
minimum snapshot gate.

### 11.2 Create Snapshot

```text
CreateSnapshot(expectedDraftVersion, expectedHeadSnapshotId)
  1. load the saved Draft only; never absorb unsaved runtime state implicitly
  2. freeze and detach the candidate content
  3. resolve and exactly bind its capture adapter; validate all captures
  4. settle every Scenario from that frozen candidate
  5. run the model-pinned minimum numerical gate
  6. capture fresh settled checkpoints and validate all resulting captures
  7. verify that fixture, Scenario identity, and Surface were not changed by
     qualification
  8. compare-and-swap draftVersion and headSnapshotId
  9. through the sealed capability, atomically insert Snapshot and advance the
     workspace head
```

A slow gate is safe: if the Draft or head changes while it is running, the
final compare-and-swap fails and no Snapshot becomes visible.

Snapshot commit advances the persisted Workspace to the qualified checkpoints,
but does not silently restore or replace an already-running Worker session.
The caller must mark that live session divergent and explicitly restart or
rebind it before presenting it as the Snapshot state.

For one-click UX, `SaveAndSnapshot` may orchestrate the two explicit commands.
It must not weaken either boundary.

### 11.3 Fork and rebase

Root `CreateWorkspace` always creates `headSnapshotId = null` and
`basedOnSnapshotId = null`. It cannot claim a source Snapshot. `ForkWorkspace`
takes only a new `experimentId` and source `snapshotId`; it loads and clones the
source content inside the application, sets `headSnapshotId = null`, and sets
`basedOnSnapshotId` to the source. Caller-supplied fork content is forbidden.

Parent changes never auto-propagate. Rebase is an explicit operation that
creates a new Draft and later a new Snapshot. `RebaseDraft`:

```text
RebaseDraft(expectedDraftVersion, expectedHeadSnapshotId,
            targetSnapshotId, resolvedCompleteContent)
  1. compare the caller's expected Draft version and head
  2. require that the target Snapshot exists
  3. require current Draft, target, and resolved content to use the same exact
     modelId
  4. validate every capture in the caller-resolved complete content
  5. increment draftVersion, keep headSnapshotId unchanged, and set
     basedOnSnapshotId = targetSnapshotId
  6. publish either that whole rebased Draft or none
```

Studio does not compute a merge and does not treat the target as inherited
content. The caller supplies the already conflict-resolved complete content.
The next Snapshot's one `parentSnapshotId` is the rebased Draft's
`basedOnSnapshotId`, so it points to the explicit rebase target. After the
atomic Snapshot commit, both head and based-on advance to the new Snapshot.

V2 records one parent, so it supports fork/rebase but does not claim true merge
semantics. A future merge feature would require multiple parent IDs and a
domain-aware conflict model.

## 12. Article Placement

```ts
type ExperimentPlacement = {
  placementId: string;
  snapshotId: string;
  caption: string | null;
  briefing?: {
    scenarioIds?: string[];
    panePicks: Array<{
      paneId: string;
      priority: number;
    }>;
  };
};
```

Placement pins an immutable Snapshot directly.

Article content nests each Placement beneath its owning Experiment block.
The same Snapshot may be placed repeatedly with independent Placement IDs and
independent inline Briefings. Lineage and `experimentId` are never overloaded
for document ownership. Lesson-page content may reuse the same nesting rule.

`briefing` is an inline, pure projection rather than a `ReaderBrief` entity or
ID:

- every Scenario and pane ID must exist in the pinned Snapshot and be unique;
- omission means “use every Scenario and pane from the complete Surface”;
- a present Briefing always owns `panePicks`, which may be empty to select no
  panes; omitted `scenarioIds` means every Scenario and an explicit empty array
  means none;
- each pick supplies only a nonnegative placement priority. It cannot override
  the pane label, color, items, values, graph contract, control defaults, or
  note, and there is no item-level selection;
- larger priority means more prominent. Ties use the selected Surface pane's
  ascending `order`, then ascending `paneId`.

This value preserves the historically useful Working Set → Reader Brief
behavior—compose a rich Experiment once, then project a smaller article view—
without giving either projection a second lifecycle or identity. There is no
Placement revision or presentation-mode enum.

Workbench may carry the current author-selected Briefing across its mandatory
post-Snapshot runtime restart and into Article insertion through a browser
`sessionStorage` handoff keyed by the newly created exact `snapshotId`. This is
ephemeral navigation state, not Snapshot, Workspace, Placement, or Article
domain content. It never changes the complete Snapshot Surface. Article
insertion reads the handoff, validates it through the ordinary Placement-to-
Snapshot boundary, and uses it only as the new Placement's initial inline
`briefing`. An explicit empty `panePicks` remains empty. Missing, corrupt,
cross-Snapshot, or stale selections are treated as no handoff and the Article
falls back to its ordinary complete-Surface insertion policy.

The renderer derives density and extent from:

```text
Snapshot Surface
+ Placement briefing
+ viewport
+ renderer policy/version
```

The renderer derives inline/peek/fullscreen extent automatically from selected
pane count and complexity, priority, viewport, and renderer policy. Extent is
never durable content. Fullscreen activation remains ephemeral and
user-controlled.

The current Article Editor renders a pinned static composition while authoring.
It never invents live values, and it labels this state as pinned/static. Live
Reader ownership belongs to the delivery policy below, not the editor preview.

Browser-only pre-release authoring persists Workspaces, Snapshots, and Article
Drafts inside one versioned, exact-key local-storage envelope. Snapshot and
advanced Workspace visibility are written as one envelope update. This is a
replaceable persistence adapter, not a domain identity or a commitment to a
future server database schema.

The browser adapter repeats the durable invariants rather than trusting plain
JSON from UI code. Draft writes compare-and-swap one exact `draftVersion` while
preserving head, based-on lineage, and `modelId`. Snapshot writes accept only
the opaque runtime authority minted after the persistent Worker client's
correlated sealed-authoring response; casts, clones, and hand-built structural
look-alikes are rejected. Commit then advances version, head, and based-on
together, permits qualification to change checkpoints only, and rejects every
duplicate `snapshotId`. Envelope reads fail closed on dangling or cyclic
lineage. Article drafts start at version zero and advance by exactly one;
Article writes resolve every Placement against its pinned Snapshot and reject
unknown Snapshot, Scenario, or pane identities.

Authoring seeds and Experiment exports carry the target Experiment's immutable
Snapshot series together with the complete parent closure required by any
cross-Experiment fork. The closure is deterministic and parent-first, while
Workbench Snapshot counts continue to count only Snapshots owned by that
Workbench. This keeps an exported fork self-contained without confusing
lineage ancestors with locally authored revisions.

This local-storage adapter is single-renderer authoring infrastructure.
Its persisted version check rejects an already-visible stale write, but browser
local storage cannot make the read/compare/write sequence transactional across
two tabs. Concurrent-tab authoring is therefore unsupported until the adapter
is replaced by a server transaction or an equivalent cross-context lock; the
domain repository CAS contract remains mandatory for that replacement.

## 13. Reader runtime ownership and preview

Article experiments autostart under one resource policy:

```text
focused / screen-centered Placement
  → one active live SimulationSession

previously active Placement
  → disposable cached preview

not-yet-active Placement
  → poster or graph-strip preview
```

Moving focus suspends or closes the old live owner before activating the new
one. Cached content never accepts control input; interaction first promotes
the Placement to live ownership.

The preview artifact is outside Snapshot identity:

```ts
type ExperimentPreviewArtifact = {
  snapshotId: string;
  cacheFormatVersion: number;
  generatedAt: string;
  scenarios: Array<{
    scenarioId: string;
    kind: "loopable-beat" | "trace-strip" | "poster";
    timeRange?: {
      startSec: number;
      endSec: number;
    };
    loopable: boolean;
    samples: JsonValue;
  }>;
};
```

A normal periodic cardiovascular case may use one complete beat. Transient,
stochastic, event-driven, or nonperiodic states use a bounded trace or poster
instead of pretending one beat is representative.

Preview artifacts:

- are regenerable and may be deleted without correctness loss;
- are never a gate input, scientific export, metric authority, or checkpoint;
- are visibly labelled `Replay` or `Cached` when not live;
- solve first paint without adding a seed observable to durable Experiment
  content.

## 14. Runtime-only state

SimulationSession may internally own:

- current fixture and accepted numerical state;
- an input epoch / intent token;
- settlement and numerical-health evaluations;
- live pacing and presentation samples;
- pending capture/gate jobs;
- delivery scheduling state.

Inside one active Workbench or Article Placement, every Scenario owns a live
lane and advances concurrently. The one-live resource policy in Section 13 is
between Article Placements; it never serializes the Scenarios inside the
selected Experiment.

The input epoch rejects late asynchronous results after rapid control changes.
It is an implementation counter, not a domain field. It must not enter
Experiment, Snapshot, Placement, Preset, or preview identity.

Slider pointer events, knob actions, settlement reports, and per-step samples
are not written to durable storage.

### 14.1 Live calculation and presentation cadence

Numerical stepping and UI presentation use separate cadences. The Worker keeps
the exact 2 ms accepted-step stream. Live pacing normally waits until sixteen
steps are wall-clock due and crosses the Worker boundary once for that exact
32 ms model-time batch; this removes hundreds of request/response round trips
per model second without advancing ahead of real time. Every accepted frame in
the batch still returns in order. The Workbench then notifies presentation
consumers at approximately 30 frames per second; pausing, saving, or a hard pending-frame
bound flushes every accepted frame before the command boundary. Coalescing
therefore reduces transport and React churn without changing numerical
stepping or checkpoint history.

Presentation keeps two bounded resolutions from the same accepted frames.
Sweep graphs use a 60 Hz terminal-plus-extrema buffer for the authored time
window. Pressure-volume graphs use a separate bounded exact 2 ms scalar-orbit
buffer for the current and recent complete beats, so systolic geometry is not
reduced to roughly 40--60 vertices per beat. The latter is a display cache, not
a second numerical state or a source for Snapshot qualification.

`acceptedTimeSec` remains the exact model clock and may restart at zero after a
model-owned cold-reset control. A separate monotonic `presentationTimeSec` maps
each input epoch onto one continuous visual timeline. Sweep paths split their
stroke at an epoch boundary but keep the previous samples in the same window,
so the waveform does not disappear on commit and naturally sweeps away without
claiming numerical continuity across the reset. PV/structural panes instead
archive completed pre-control epochs up to authored `historyDepth`; their
historical orbit, single-beat end-systolic/Klotz-informed orientation references
(not formal ESPVR/EDPVR relations), Guyton curve, and any qualified Starling
locus are rendered with age-based opacity and never reused as current analysis.

Canvas elements keep one context, size observer, and pending animation frame
for their mounted lifetime. Live samples are already monotonic in presentation
time, so renderers preserve array identity instead of copying and sorting the
full bounded buffer on every paint. Canvas device-pixel ratio is capped
independently of numerical resolution. OffscreenCanvas and WebGL are not the
default: they are introduced only if production profiling shows main-thread
render saturation after the bounded multi-resolution caches, because another
Worker cannot reduce the numerical kernel's CPU cost.

### 14.2 Portable JSON and signed zero

All Studio V2 portable JSON boundaries reject non-finite numbers and negative
zero (`-0`). This includes manifest admission, canonical serialization,
fixture/capture cloning, and portable fixture reduction. JSON text cannot
preserve the sign of zero, so accepting it would make canonical identity and
round trips ambiguous. A model for which signed zero is scientifically
meaningful must encode that sign explicitly in its model-owned schema or
checkpoint codec rather than relying on a JSON number.

## 15. Invariants

1. A `modelId` maps to one immutable registered manifest, nonempty executable
   artifact, and exact executable bundle.
2. The manifest and artifact bytes are the sources for the public allowlisted
   contract and registry-internal digest; no parallel public contract exists.
3. Missing, empty, extra, or changed normative manifest/artifact content is rejected;
   changing it requires a new `modelId`.
4. Domain objects and clients never use a package hash as identity or receive
   build/release/integrity metadata through the public model contract.
5. Every executable adapter is atomically registry-bound and exactly matches
   its model plus applicable fixture schema, checkpoint codec, or Snapshot gate
   before it is called.
6. Desired Save input is checkpoint-free and ephemeral; every persisted
   Scenario fixture/checkpoint pair is complete, captured atomically, and
   validated at each authoring ingress/egress boundary.
7. Save capture confirms its runtime session and every expected input epoch;
   that correlation is never persisted.
8. Fixture is authoritative for configured parameters.
9. Portable JSON never contains negative zero.
10. Draft may be unsettled; Snapshot may exist only after the minimum gate.
11. Snapshot write access exists only through the factory-composed,
    capability-sealed `CreateSnapshot` path.
12. Gate evaluation and stored content refer to the same frozen candidate.
13. `draftVersion` and head are compare-and-swap protected.
14. Root creation cannot claim lineage; Fork clones its source internally.
15. Rebase keeps the current head, advances `basedOnSnapshotId` to an existing
    exact-model target, and stores caller-resolved complete content.
16. Snapshot and parent references are immutable.
17. Parent means lineage only; no implicit inheritance or propagation.
18. Placement pins a Snapshot and only selects existing IDs.
19. Responsive layout is derived, not durable geometry.
20. Runtime epochs, settlement, numerical health, and samples are not durable
    content.
21. Preview artifacts cannot participate in qualification or exact restore.
22. At most one article Placement owns an active live simulation.

## 16. Pre-release direct cutover

There is no production Studio database or user-authored content to migrate.
The cutover is therefore intentionally destructive:

- no V1 data reader, migration, dual-write, fallback, or compatibility alias;
- the V3 browser store deletes the retired V2 local envelope without reading
  or migrating it;
- the exact integrated V3 development release is now the registered/default
  Workbench path, but no official Preset, Experiment, Snapshot, Placement, or
  Lesson content is authored until that development boundary is deliberately
  promoted;
- the default-model setting is only an authoring convenience. Creating an
  Experiment resolves it once and stores the exact `modelId`; saved content
  never stores a mutable `default` alias;
- obsolete Studio content contracts, sample articles, preview routes, and
  superseded design documents are deleted rather than deprecated.

Current V3 engine tests and source-grounding data remain available for model
development. Historical sidecar evidence and generated replay artifacts live
only in Git history. Content-addressed storage may still use hashes internally,
but neither old release refs nor storage hashes enter the new Studio domain.

## 17. Delivery state and sequence

Completed in the current development cutover:

1. single-manifest contracts, fail-closed validation, atomic
   manifest/artifact/executable-bundle registry admission, exact-runtime
   resolution, workspace repository, and factory-composed sealed Snapshot
   gateway;
2. a canonical regular-sinus, normal-coronary, all-off/zero-inertance fixture,
   accepted-boundary Draft capture, exact checkpoint restore, and an integrated
   V3 live numerical session;
3. one development package for `MainWireIntegratedModelTransactionV3` under
   the exact immutable `modelId`
   `circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.development-12`;
4. trusted client resolution of that registry-admitted release as the default,
   with no client-side package rehash;
5. Workbench autostart through the generic Worker protocol into catalog-driven
   Dockview graph, output, and control role areas with one page-owned Worker;
   pane geometry and settings-open state remain ephemeral; and
6. a model-pinned candidate periodic Snapshot gate that accepts only period-1
   converged, numerically admissible terminal checkpoints;
7. a persistent Worker-to-authoring bridge for accepted-boundary Draft capture,
   explicit header Save, gated Snapshot creation, exact checkpoint resume, and
   one versioned browser persistence envelope; and
8. addable/removable custom Surface panes with editable labels, graph-series
   colors, authored sweep windows, placement-local Briefing pickup/priority,
   and a minimal Article Editor that supports repeated pinned Snapshot placement
   without pretending its authoring preview is live.

Still deliberately deferred:

1. one-live article Reader scheduling and disposable preview artifacts;
2. server persistence, collaboration, and authenticated publication; and
3. official Scenario Presets, Experiments, published articles, and Lesson pages.

The current development package makes no physiological, clinical,
release-ready, or simulation-ready claim. Model catalogs are runtime and
presentation interfaces; their presence is not scientific validation evidence.

No step adds a hidden compatibility reader, automatic parent propagation,
client-side package hash verification, or content encoded with a superseded
schema.
