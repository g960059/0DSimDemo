# CircleHeart Studio — Experiment data architecture

Status: authoritative pre-release contract; direct cutover

Date: 2026-08-05

Decision: one shared `ExperimentContent` shape moves through an ephemeral
`ExperimentSession`, an explicitly saved mutable `Experiment`, and an
immutable qualified `ExperimentSnapshot`.

This document is the persistence and runtime-ownership source of truth.
`DESIGN-STUDIO-004-reader-briefing-experiment-ia.md` owns Article, Briefing,
Reader, and navigation IA.

The application has no production users or durable production database.
Superseded schemas are deleted rather than migrated. Git history is the only
archive for `Workspace`, `ExperimentDraft`, numeric Snapshot revisions,
Snapshot lineage, and Placement-owned Briefing designs.

## 1. Canonical vocabulary

```text
Registered model release
  └─ exact immutable modelId

ExperimentSession                         ephemeral, mutable
  ├─ current ExperimentContent
  ├─ live numerical runtimes
  └─ transient UI/runtime state

Experiment                                durable, mutable by explicit Save
  ├─ experimentId
  ├─ version                              concurrency only
  └─ ExperimentContent

ExperimentSnapshot                        durable, immutable, qualified
  ├─ PublicationSnapshot
  │    └─ ExperimentContent
  └─ ArticleSnapshot
       ├─ ExperimentContent
       └─ Briefing
```

The terms are intentionally narrow:

- **Experiment** is the user-visible saved laboratory resource.
- **Workbench** is the UI used to operate an `ExperimentSession`; it is not a
  data type or persistence root.
- **ExperimentSession** is the mutable, unsaved working state in one open
  Workbench. It may start blank, from an Experiment, or from a Snapshot.
- **ExperimentSnapshot** is an immutable, minimum-gated capture. Publication
  and Article embedding are Snapshot variants, not separate domain entities.
- **ExperimentContent** is the shared scientific/presentation payload. Sharing
  this shape does not make the three lifecycle states interchangeable.

`Workspace`, `WorkbenchSession`, `ExperimentDraft`, `ExperimentRevision`, and
`Publication` are not aliases. They are removed names.

## 2. Why one content shape still needs three lifecycle states

All three states contain substantially the same Scenario and Surface content,
but they have different guarantees:

| State | Mutable | Durable | Gate required | User-visible identity |
| --- | --- | --- | --- | --- |
| ExperimentSession | yes | no | no | no durable identity |
| Experiment | yes, through Save | yes | no | `experimentId` |
| ExperimentSnapshot | no | yes | yes | `snapshotId` |

Collapsing them into one tagged record would make invalid operations easy: a
Reader could mutate a Snapshot, an unsettled Save could look published, or an
open tab could silently enter My Experiments. Separate outer types make those
state transitions explicit while reusing `ExperimentContent` inside them.

## 3. Canonical data contracts

```ts
type ExperimentContent = Readonly<{
  modelId: string;
  scenarios: readonly ExperimentScenario[];
  surface: ExperimentSurface;
}>;

type Experiment = Readonly<{
  schemaId: "circleheart-studio-experiment-v2";
  experimentId: string;
  version: number;
  content: ExperimentContent;
}>;

type PublicationExperimentSnapshot = Readonly<{
  schemaId: "circleheart-studio-experiment-snapshot-v2";
  kind: "publication";
  snapshotId: string;
  content: ExperimentContent;
  createdAt: string;
  createdBy?: string;
}>;

type ArticleExperimentSnapshot = Readonly<{
  schemaId: "circleheart-studio-experiment-snapshot-v2";
  kind: "article";
  snapshotId: string;
  content: ExperimentContent;
  briefing: ExperimentPlacementBriefing;
  createdAt: string;
  createdBy?: string;
}>;

type ExperimentSnapshot =
  | PublicationExperimentSnapshot
  | ArticleExperimentSnapshot;
```

`ExperimentSession` is not a portable persistence schema. The Workbench owns
its React state, Worker handles, desired fixtures, captured checkpoints,
request tokens, and rendering buffers. When it crosses a durable boundary it
produces validated `ExperimentContent`.

## 4. Identity, integrity, and release policy

Domain identities are opaque IDs, not content hashes:

```text
modelId
experimentId
snapshotId
scenarioId
articleId
placementId
```

One exact `modelId` pins the result-affecting execution contract:

- equations and normative parameter semantics;
- solver/runtime and event-boundary semantics;
- fixture schema and control mapping;
- checkpoint codec and exact restore semantics;
- output meanings, units, and aggregation semantics; and
- the minimum Snapshot gate.

The registry checks package integrity only when registering a release. An
existing `modelId` cannot be overwritten with different normative content.
CI fails when the execution-contract fingerprint changes without a new
`modelId`. Ordinary clients trust the admitted registry and do not repeatedly
hash model packages at runtime.

An Experiment stays pinned to its exact `modelId`. The current pre-release
direct-cutover client deliberately bundles only the latest development release
and fails closed when it encounters an older development ID; it preserves the
stored bytes and never opens them with another model. Before the first stable
release or retained user Snapshot, a multi-release registry that resolves each
resource by `content.modelId` is a release blocker. At that boundary, changing
the default creates only new Sessions with the new release; old Experiments
remain executable through their retained exact release. Migration is explicit.

`Experiment.version` is only an optimistic-concurrency token. It is not a
scientific revision, publication number, or URL identity.

Snapshots deliberately carry no `sourceExperimentId`, `parentSnapshotId`,
`headSnapshotId`, or `basedOnSnapshotId`:

- an Article-origin session can create a Snapshot without an Experiment;
- editing always clones Snapshot content into a new Session;
- a Snapshot never inherits or follows later changes; and
- provenance fields would imply ownership/lineage behavior the product does
  not use.

## 5. Model contract and catalogs

The registered model exposes one allowlisted Studio surface:

```ts
type ModelContract = {
  modelId: string;
  modelFamilyId: string;
  displayName: string;
  fixtureSchemaId: string;
  checkpointCodecId: string;
  snapshotGateId: string;
  controlCatalog: readonly ControlDefinition[];
  outputCatalog: readonly OutputDefinition[];
  graphCatalog: readonly GraphDefinition[];
};
```

Signals and derived metrics share `outputCatalog`; their definition kind,
shape, scope, and dependencies distinguish them. There is no overlapping
`observableCatalog`.

There is no durable `ParameterSet`. A control action is an ephemeral command.
After application, the complete changed input is part of the Scenario fixture.
A Knob may issue several assignments as one UI action, but it creates no
second persistence identity.

## 6. Scenario capture and Preset

```ts
type ScenarioCapture = Readonly<{
  fixture: JsonValue;
  checkpoint: Readonly<{
    acceptedRevision: number;
    acceptedTimeSec: number;
    payload: JsonValue;
  }>;
}>;

type ExperimentScenario = Readonly<{
  scenarioId: string;
  label: string;
  capture: ScenarioCapture;
}>;

type ScenarioPreset = Readonly<{
  presetId: string;
  modelId: string;
  title: string;
  description: string;
  capture: ScenarioCapture;
}>;
```

Fixture and checkpoint cross durable boundaries atomically. The fixture holds
all current input values; the checkpoint holds the exact state and model time
needed to continue. The registered model validates both against `modelId`.

Changing a parameter warm-starts at the current accepted `(time, state)` and
continues visibly from there. A request generation/token may reject stale
asynchronous work, but generations are runtime-only.

A Scenario Preset includes fixture and checkpoint because its purpose is a
fast, meaningful start. Applying a Preset deep-copies the capture. It creates
no live link, warm-cache reference, certification, or publication claim.

## 7. Experiment Surface

The Surface owns durable semantic composition:

- graph panes, selected series, Scenario scope, exact exclusions, history,
  window, analysis mode, labels, and frozen trace-color allocation;
- output panes, selected output items, and one pane-level Scenario binding;
- controller panes, selected controls, slider/button presentation, order, and
  pane-level Scenario binding;
- one Experiment note; and
- Scenario base-color seeds used only for future automatic allocation.

Device presentation is not content. Dockview geometry, area split ratios,
active tabs, hover/focus, modal state, fullscreen state, transient graph-trace
visibility, and current theme stay in memory or versioned device-local storage.

### 7.1 Graph binding

Binding is pane-level by default:

- `visible-scenarios` follows ephemeral Scenario Manager visibility;
- `fixed` names an authored Scenario subset; and
- `excludedTraces` provides precise Scenario × series exceptions.

This preserves a simple pane mental model while permitting sparse comparisons
without forcing every series item to own a binding editor.

### 7.2 Output binding

One output pane has exactly one binding:

- `active-slot` follows the Scenario Manager's active Scenario; or
- `fixed` targets exactly one explicit Scenario.

When two or more Scenarios exist, a compact content-sized binding indicator is
shown above the pane contents and opens the binding section in Pane Settings.
It is omitted for a single Scenario because there is no meaningful target
choice to explain. Output items never own independent Scenario targets.
To compare Scenarios, **Compare by Scenario** fixes the source pane to its
currently resolved Scenario, duplicates the whole pane, fixes the copy to the
next unrepresented Scenario, and places it beside the source. This produces a
predictable side-by-side comparison without a `metric × scenario` matrix in
one pane.

Scenario Manager visibility affects graph traces only. It does not hide an
Output or Controller pane, because pane visibility, splitting, and deletion
belong to Dockview layout controls rather than Scenario state.

### 7.3 Controller binding

One controller pane has one binding:

- `active-slot` follows the Scenario Manager inside a mutable Session; or
- `fixed` targets one or more explicit Scenarios.

With two or more Scenarios, the pane displays the same compact resolved mode
and target indicator as Output panes. Selecting it opens the binding section
in Pane Settings; it stays hidden for a single Scenario. Briefing capture materializes
`active-slot` into a fixed Scenario identity so later focus changes cannot
retarget published controls.

## 8. Session lifecycle

### 8.1 New Workbench

```text
open New Experiment
  → navigate to /experiments/new with no Experiment identity
  → create an ExperimentSession using the current default exact model
  → start every Scenario in its persistent Worker lane
  → do not create an Experiment or My Experiments entry
```

`experimentId` does not exist in this state. The first successful explicit Save
allocates it inside the Save boundary and replaces the URL with the durable
Experiment URL. A failed or abandoned Session consumes no Experiment identity
and creates no recoverable-looking library entry.

### 8.2 Open saved Experiment

```text
read Experiment
  → deep-copy ExperimentContent into a Session
  → restore each exact capture using Experiment.modelId
  → edit independently
  → explicit Save performs version-checked replacement
```

### 8.3 Open Snapshot

The Snapshot page is read-only. “Open in Workbench” deep-copies its content
into `/experiments/new` as a disposable Session with no Experiment ID. The user
may Save it as an Experiment, capture another Snapshot, or leave it without
adding anything to My Experiments.

No edit mutates or advances the source Snapshot.

## 9. Explicit Experiment Save

An Experiment is created only by the Save action:

```text
Save
  → pause/correlate all live Scenario lanes at accepted boundaries
  → atomically capture fixture + checkpoint for each Scenario
  → resume live lanes immediately
  → validate exact model references and Surface
  → first Save: allocate experimentId and persist Experiment(version = 0)
  → later Save: compare expected version, then persist version + 1
  → add/update My Experiments metadata
  → after first commit, replace /experiments/new with /experiments/:experimentId
```

Save does not require settlement. A user may preserve an unstable,
transitioning, or exploratory exact state.

Opening a Workbench, changing a parameter, starting from an Article, or
creating a Snapshot never implicitly saves an Experiment. An untouched default
Session does not prompt. Authored content, an uncommitted title, or an
uncaptured Briefing prompts before close/reload and ordinary in-app Link
navigation.

Live stepping and plotting never write every 2 ms. Workers and ring buffers
remain in memory; only explicit boundaries capture durable state.

## 10. Snapshot creation

Both Snapshot variants cross the same exact-model port, but the command
purpose selects a different qualification profile:

```text
briefly pause live lanes at accepted boundaries
  → atomically capture fixture + checkpoint and freeze candidate content
  → resume live lanes immediately
  → lease a warm, bounded background Worker
  → Article: exact restore + one-cycle numerical-safety verification
             (finite/conservation/event/MCS checks; settlement not required)
  → Publication: require period-1 settlement and numerical checks
                 and emit fresh terminal settled checkpoints
  → validate candidate again
  → re-check model, Surface, Scenario identity/label, and fixture at persistence
  → persist a new immutable snapshotId
```

For a Publication, the command additionally carries `experimentId` and
`expectedVersion`. The application boundary reads that saved head and rejects
any candidate whose model, Surface, Scenario order/identity/label, or fixture
differs; only checkpoint advancement is allowed. Browser persistence repeats
the saved-head/version and authored-projection check so bypassing the
Workbench UI cannot publish an unsaved or dirty Session.

The Publication profile may replace checkpoints with qualified accepted
states. The Article profile preserves the click-time checkpoint after its
detached safety verification passes. Neither profile may change model ID,
fixture, Scenario identity/order/label, or Surface.

There is no long-lived `QualifiedAnchor`. Snapshot, rapid PV-relation, and
Guyton/Starling jobs fork only when requested. They share a bounded pool of
pre-created but uninitialized Workers. Each leased Worker is single-use,
terminated after completion, and replenished with a fresh warm Worker; no
numerical state or runtime identity is reused between jobs. Snapshot has queue
priority over exploratory analysis. The hardware-derived cap prevents an
unbounded “one more Worker” policy while still allowing hypovolaemic and
hypervolaemic partitions to run in parallel on capable devices.

Settlement traces, numerical-health status, V&V reports, assessment records,
and certification chains are not Snapshot fields. Snapshot existence is the
machine-readable assertion that the purpose-specific gate passed; an Article
Snapshot therefore makes no settlement claim. Human-facing limitations,
provenance, references, and interpretation live in the model information UI,
Preset description, or Experiment note. That UI presents Scenario-local
settlement and numerical-check status separately from model-level validation
scope. Exact model IDs, fixture schema IDs, checkpoint codec IDs, integrity
metadata, and gate identities remain registry/developer concerns rather than
ordinary user-facing information.

### 10.1 Publication Snapshot

Publication captures complete `ExperimentContent`. It is the immutable target
of a saved Experiment’s published pointer. It has no independent Publication
entity and no Briefing. Because the library pointer belongs to a durable
Experiment, the first explicit Save is required before Publish. Publish never
performs that Save implicitly and never advances the Experiment version. The
current Session must be clean: authored changes are saved before publishing.

### 10.2 Article Snapshot

Article capture freezes `ExperimentContent` and the exact audience Briefing in
one object. The Briefing cannot be detached, retargeted, or edited in place.
Creating or changing a Briefing creates another Article Snapshot.

Article capture deliberately does not wait for settlement. It verifies exact
restore and one complete cycle for finite values, conservation/TBV safety,
event identity/counts, and the pinned MCS-off contract, then keeps the atomic
click-time fixture/checkpoint pair. This makes ordinary authoring capture fast
without misrepresenting the result as periodic steady state.

Snapshot creation never saves or version-advances an Experiment. A single
unsaved Session may create many Article Snapshots; Publication Snapshots
require an already-saved Experiment so they cannot become orphaned releases.

## 11. Runtime-only data

None of the following is carried by Experiment, Snapshot, or Article:

- play/pause, elapsed runtime, accepted state between captures;
- settlement/numerical-health progress and analysis workers;
- target generation, request IDs, Worker IDs, and correlation tokens;
- trace ring buffers, one-beat replay, graph caches, and render decimation;
- current Scenario Manager focus and graph-trace visibility;
- active Dockview pane, split geometry, theme, modal/drawer state; and
- Reader one-live scheduling or legend-click visibility.

Workbench runs all Experiment Scenarios concurrently. Presentation buffers
decouple model step cadence from the browser render cadence. Background
settlement/verification status, Worker-pool leases, queue priority, and
captured job candidates remain ephemeral.

## 12. Browser persistence and deletion

The direct-cutover browser envelope is:

```text
circleheart.studio.browser-content.v6
  ├─ experiments[]
  ├─ snapshots[]
  └─ articles[]

circleheart.studio.browser-experiment-index.v5
  └─ explicit Experiment metadata and optional publication pointer
```

Old browser envelopes are retired, not migrated. The current store validates
exact schemas, unique IDs, immutable Snapshot writes, Experiment version
progression, exact model identity, and Article placement references. Before an
Experiment Save is written, it also rechecks the Worker result against the
frozen submitted model, Surface, Scenario order/identity/label, and fixtures;
Worker capture may change checkpoints only.

The localStorage implementation is a pre-backend product prototype. Its
version checks cannot provide transactional compare-and-swap across concurrent
tabs, and Snapshot persistence plus the Experiment publication pointer are two
browser writes. Before production launch, the backend store must provide:

- atomic Experiment version compare-and-swap with explicit conflict UI;
- atomic Publication Snapshot + published-pointer commit or recovery journal;
- retained exact-model lookup by `content.modelId`;
- typed quota handling plus per-record corruption quarantine/recovery;
- a data-router navigation blocker covering browser history traversal; and
- authorization and ownership outside canonical URLs.

Deleting an Experiment removes only that mutable resource and its library
metadata. It never cascades to Snapshots or Articles. Backend retention and
garbage collection removes only Snapshots that are no longer referenced by an
Article Placement or an Experiment publication pointer. Article deletion starts
a short recovery retention window; after it expires, a periodic backend job may
delete newly unreferenced Article Snapshots. The browser prototype does not
pretend localStorage can provide that transactional retention service.

## 13. Canonical URLs

```text
/:locale/experiments                     public directory
/:locale/experiments/new
/:locale/experiments/:experimentId
/:locale/snapshots/:snapshotId
/:locale/articles                        public directory
/:locale/articles/:articleId/edit
/:locale/articles/:articleId
/:locale/me/experiments                  personal management
/:locale/me/articles                     personal management
/:locale/me/settings                     account preferences
```

User IDs are not embedded in canonical content paths. Authentication,
ownership, and authorization belong to backend metadata. IDs are opaque and
URL-safe; routes do not encode model release, hash, fixture, checkpoint, or
Briefing JSON.

An unsaved Session always uses `/experiments/new`. `:experimentId` is therefore
a durable Experiment identity, not a prospective reservation. Article handoff
context may add an ephemeral `sessionToken` query parameter; the token is
navigation correlation only and never becomes content or a canonical URL.

## 14. Normative invariants

1. `ExperimentContent` is shared; lifecycle guarantees are not.
2. Workbench is a UI, not a domain or persistence entity.
3. Only explicit Save creates or updates an Experiment.
4. Only explicit Save adds an item to My Experiments.
5. Experiment Save may be unsettled; Article Snapshot capture requires
   numerical safety but not settlement; Publication Snapshot capture requires
   period-1 settlement.
6. Every Snapshot is immutable, independently addressable, and gated.
7. Article Snapshot creation requires no Experiment; neither Snapshot variant
   version-advances an Experiment.
8. A Snapshot has no parent/source/head/base lineage fields.
9. Publication is a Publication Snapshot, not another entity.
10. Article projection is inseparable from an Article Snapshot.
11. Fixture and checkpoint are captured atomically against exact `modelId`.
12. Hashes remain registry/storage integrity mechanisms, not domain identity.
13. Runtime checks, caches, and device layout never become scientific content.
14. No compatibility aliases preserve removed pre-release structures.
15. `/experiments/new` has no `experimentId`; only a successful first Save
    allocates one.
16. Background qualification forks from one atomic capture, resumes live
    lanes immediately, and runs within a bounded single-use Worker pool.
