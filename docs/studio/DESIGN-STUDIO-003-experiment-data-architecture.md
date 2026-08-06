# CircleHeart Studio — Experiment data architecture

Status: authoritative pre-release contract; direct cutover

Date: 2026-08-06

Decision: one `ExperimentContent` shape crosses three deliberately different
lifecycle boundaries: an ephemeral `ExperimentSession`, an explicitly saved
mutable `Experiment`, and a neutral immutable `ExperimentSnapshot`. A public
Experiment and an Article Placement both point to that same Snapshot type.

This document owns persistence, numerical-capture, model-release, and backend
boundaries. `DESIGN-STUDIO-004-reader-briefing-experiment-ia.md` owns Article,
Briefing, Reader, navigation, and presentation IA.

The application has no production users or durable production database.
Superseded schemas are removed rather than migrated. Git history, not live
compatibility code, is the archive for Workspace, ExperimentDraft,
PublicationSnapshot, ArticleSnapshot, numeric Snapshot revisions, nested
Snapshot Briefing, and Snapshot lineage designs.

## 1. Canonical vocabulary

```text
Registered model release
  └─ exact immutable modelId

ExperimentSession                         ephemeral, mutable
  ├─ current ExperimentContent
  ├─ live numerical lanes
  └─ transient UI/runtime state

Experiment                                durable mutable resource
  ├─ experimentId
  ├─ version                              concurrency only
  └─ current ExperimentContent

ExperimentSnapshot                        durable, neutral, immutable
  ├─ snapshotId
  └─ admitted ExperimentContent

ExperimentPublication                     mutable public pointer
  └─ currentSnapshotId ────────────────→ ExperimentSnapshot

ArticleContent                            immutable article version
  └─ ExperimentPlacement
       ├─ snapshotId ──────────────────→ ExperimentSnapshot
       └─ Briefing                       article-owned projection
```

- **Workbench** is the UI that operates an `ExperimentSession`; it is not a
  persisted entity.
- **ExperimentSession** is one open mutable working state. It may start blank,
  from an Experiment, or from a Snapshot.
- **Experiment** is the user-visible saved simulation. Save changes its current
  content pointer under optimistic concurrency.
- **ExperimentSnapshot** is one immutable, publicly executable capture. It has
  no Article/Publication kind and owns no Briefing.
- **ExperimentPublication** is only the current public pointer for a saved
  Experiment. Moving that pointer performs no numerical calculation.
- **ExperimentPlacement** belongs to an Article and owns its resolved Briefing.

`Workspace`, `WorkbenchSession`, `ExperimentDraft`, `ExperimentRevision`,
`PublicationSnapshot`, and `ArticleSnapshot` are retired names.

## 2. Why the outer lifecycle types remain separate

The inner data is intentionally shared, but the guarantees are not:

| State | Mutable | Durable | Snapshot admission | User identity |
| --- | --- | --- | --- | --- |
| ExperimentSession | yes | no | no | none |
| Experiment | by explicit Save | yes | no | `experimentId` |
| ExperimentSnapshot | no | yes | passed before insert | `snapshotId` |
| ExperimentPublication | pointer only | yes | reuses admitted Snapshot | `experimentId` |

Collapsing these into one tagged record would let an open tab silently enter My
Simulations, make a Reader artifact mutable, or make an ordinary Save appear
numerically admitted. Separate outer contracts prevent those invalid states.

## 3. Portable domain contracts

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

type ExperimentSnapshot = Readonly<{
  schemaId: "circleheart-studio-experiment-snapshot-v2";
  snapshotId: string;
  content: ExperimentContent;
  createdAt: string;
  createdBy?: string;
}>;

type ExperimentPlacement = Readonly<{
  schemaId: "circleheart-studio-experiment-placement-v2";
  placementId: string;
  snapshotId: string;
  briefing: ExperimentPlacementBriefing;
  titleOverride: string | null;
  caption: string | null;
}>;
```

`ExperimentSession` is not portable data. React state, Worker handles,
accepted frames, input epochs, rendering buffers, analysis progress, and device
layout stay in memory or versioned device-local storage.

## 4. Identity and exact-model release policy

Domain identities are opaque IDs, not content hashes:

```text
modelId, experimentId, snapshotId, scenarioId, articleId, placementId
```

One exact `modelId` pins every result-affecting execution contract:

- equations and parameter semantics;
- runtime, solver, and event-boundary behavior;
- fixture schema and control mapping;
- checkpoint codec and exact restore behavior;
- existing output/control identity, units, and semantics.

It does **not** identify the Studio application release. Snapshot admission,
publication policy, graph composition/presentation catalogs, Reader UI,
Briefing, database schema, Auth, and hosting are independently versioned
product concerns. Changing any of those without changing numerical execution
must not mint another `modelId`.

`development-36` still co-packages the admission implementation in its exact
artifact and therefore legitimately changed under the old package-wide lock.
That release is not rebound or renumbered. Before the next numerical release,
the registry package boundary must separate the numerical executable contract
from the Studio admission/presentation package so ordinary application work
cannot churn exact model identity.

Integrity hashes remain inside CI, the model registry, artifact storage, and
model-owned corruption checks. Registration is idempotent for identical bytes
and rejects the same `modelId` with a different manifest or artifact. Ordinary
clients resolve `modelId` through the trusted registry and do not rehash the
package at runtime.

The registry keeps old exact releases loadable. Changing the default channel
affects only new Sessions. Existing Experiments and Snapshots remain pinned to
their stored `modelId`; migration or cloning is explicit.

### 4.1 Dynamic exact-model resolution

The browser does not bundle historical releases into one application chunk.
It resolves one small, hash-free launch projection from Supabase:

```ts
type ModelWorkerReleaseTicket = Readonly<{
  modelId: string;
  manifest: RegisteredModelPackageManifest;
  moduleAbi:
    | "legacy-main-wire-v3-development-36"
    | "circleheart-exact-model-esm-v1";
  artifactUrl: string;
}>;
```

The same immutable registry launch contract also owns the default fixture and
an `analysisProfileId`. These are launch inputs, not identity. The exact
manifest and artifact bytes remain the authority for numerical behavior.

- `/experiments/new` resolves the `default` channel once, then immediately
  pins the returned `modelId` for the Session.
- an existing Experiment or Snapshot resolves its stored exact `modelId`
  directly and never follows a channel;
- one Article may resolve several exact releases, one per distinct pinned
  `modelId` among its Snapshots;
- the main thread derives the public contract from the returned manifest and
  sends the validated release ticket with Worker initialization;
- the Worker downloads only that artifact, selects the immutable module ABI,
  validates executable/manifest identity bindings, and creates the exact
  runtime;
- a missing, retired, malformed, or unsupported release fails closed. The
  loader never substitutes the current default for historical content.

Exact-model promises are cached by `modelId` for a page lifetime. Mutable
channel pointers are not used as runtime cache keys. Browser HTTP caching may
reuse immutable artifact bytes; no durable Experiment field stores URL, ABI,
cache state, or a digest.

`development-36` keeps its committed artifact byte-for-byte and is attached to
the legacy ABI only in registry metadata. The standard ABI is reserved for the
next exact release boundary. Neither operation changes its existing modelId.

`Experiment.version` is an optimistic-concurrency token only. It is neither a
scientific revision nor part of a public URL.

## 5. Scenario capture, Preset, and control actions

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

Fixture and checkpoint cross every capture/save boundary atomically. The
fixture contains all current inputs; the checkpoint contains the exact state
and model time required to continue. A Preset carries both because its purpose
is an immediate meaningful start. Applying it deep-copies the capture and
creates no live link or certification claim.

There is no durable `ParameterSet`. A slider, custom button, or Knob sends an
ephemeral absolute assignment. Once accepted, the resulting values live in the
complete fixture. Parameter changes warm-start from the current accepted
`(time, state)` boundary. Correlation generations remain runtime-only.

## 6. Experiment Surface

The Surface owns semantic authoring choices:

- graph panes, series, Scenario scope, exact trace exclusions, history,
  waveform window, analysis mode, labels, and frozen trace colors;
- output panes, selected outputs, and one pane-level Scenario binding;
- controller panes, selected controls, slider/button presentation, order, and
  one pane-level Scenario binding;
- one Experiment note; and
- Scenario base-color seeds used only for future automatic allocation.

Dockview geometry, area split ratios, active tabs, hover/focus, modal state,
fullscreen state, current Scenario Manager selection, temporary visibility,
and theme are not portable content.

Graph panes can show several Scenarios. Output and controller panes use one
`active-slot` or fixed binding per pane; explicit comparison is composed by
splitting/duplicating panes. Briefing materializes runtime-active bindings to
concrete Scenario identities.

## 7. Session, Save, admission, and publication workflows

### 7.1 New Session

`/experiments/new` has no durable identity. Opening, modifying, or closing it
does not create a row. The first successful explicit Save mints
`experimentId`; later Saves require the expected version.

### 7.2 Save

Save captures every Scenario's current fixture and exact accepted checkpoint,
then stores the complete content. Save does not require settlement or Snapshot
admission. Accepted steps are never written at the numerical step rate.

### 7.3 Snapshot intent capture and shared steady candidate

Both Article placement and standalone publication use the same sequence:

```text
brief user action
  → freeze model / Scenario order / fixture / input epoch / Surface intent
  → pause live lanes only for one accepted-boundary exact capture
  → copy the current fixture + checkpoint for every Scenario
  → immediately resume live lanes
  → select the newest already-produced Scenario/input-epoch candidate
       ├─ reuse a post-control cycle-boundary candidate when available
       └─ otherwise keep the click-time exact fixture + checkpoint
  → never await speculative convergence on the capture critical path
  → seal the selected exact fixture + checkpoint tuple
  → common Snapshot admission
  → insert one neutral immutable ExperimentSnapshot
```

Article authoring may capture directly from an unsaved Session. Standalone
publication additionally proves that model, Scenario identity/order, fixture,
and Surface still match the explicitly saved Experiment head. Click-time
checkpoints and selected steady-candidate checkpoints may be newer than the
saved checkpoints. The saved head authorizes the authored projection; it does
not force publication to rewind to its older numerical clock.

The click boundary freezes authored **intent**, not one cross-Scenario model
time. Scenarios are independent simulations and already own independent exact
clocks. Each detached fork may therefore publish newer cycle-boundary
candidates while preserving the frozen exact `modelId`, Scenario
identity/order, fixture, and input epoch. A later control change creates
another input epoch and cannot reuse the previous candidate. If no candidate
is already ready at the brief action, the captured live checkpoint is admitted
directly; capture never waits for the speculative Worker.

Workbench observes complete-cycle output closure for up to a bounded number of
cycles. This is an ephemeral acceleration heuristic named a *steady
candidate*. It is neither the model's formal period-1 qualification nor a
durable settlement assertion. PV/Starling analyses start from the same
candidate and may apply stricter model-owned convergence. Snapshot admission
still independently verifies executable safety. Candidate diagnostics and
settlement status are never written into Experiment or Snapshot content.

Candidate work is single-flight per Scenario/input epoch and starts after a
parameter change, not during initial load or Scenario duplication. After three
complete cycles it exposes an exact bounded warm-start candidate, then may
continue toward observed output closure in the background. PV/Starling and
Snapshot capture only read a candidate already available at request time; they
never join or promote an unfinished prewarm. The lowest-priority prewarm may
therefore improve later requests without delaying the first graph or the
author's click. The pool remains bounded for normal work; explicit Save or
Snapshot admission may use one temporary burst Worker so two already-running
bidirectional analysis lanes cannot place the author's explicit action behind
an entire sweep. Persistent live Scenario Workers are outside this pool and
never stop for detached candidate computation.

### 7.4 Common Snapshot admission

Admission answers only: “Can this selected exact candidate be restored and executed
safely as an interactive public simulation?” For Main Wire V3 it:

1. exact-restores the candidate checkpoint;
2. verifies its exact checkpoint round trip;
3. finishes the already-open cycle/window on the detached fork;
4. advances one complete canonical cycle;
5. checks finite values, conservation tolerances, event identity, and the
   model-compatible mechanical-support constraints; and
6. verifies a terminal checkpoint round trip.

Admission never replaces the selected candidate checkpoint. It does not require or
persist settlement, and it does not establish physiological validity,
clinical validity, certification, or release readiness. Those runtime and
scientific concepts remain available in human-facing model information and
formal analysis, not in Snapshot identity.

### 7.5 Publication and Article placement

After admission:

- standalone publication atomically moves an Experiment's public pointer to
  the Snapshot; and
- Article authoring inserts a Placement containing `snapshotId + briefing` in
  the next immutable Article content.

Neither pointer operation reruns numerical work. The Snapshot itself remains
neutral and can be read through whichever retained reference authorizes it.

## 8. Supabase physical model

Portable contracts stay free of database implementation fields. Supabase uses
an internal `studio` schema and semantic RPCs:

```text
model_releases (immutable)
model_release_availability
model_release_channels

experiment_contents (immutable JSONB)
experiments ───────────────→ current_content_id
experiment_snapshots ──────→ content_id
experiment_snapshot_sources saved-Experiment provenance only
experiment_publications ───→ current_snapshot_id

article_contents (immutable JSONB)
articles ──────────────────→ current_draft_content_id
article_snapshot_refs       derived index of Placement/Briefing in blocks
article_publications ───────→ current_content_id

operation_receipts          idempotent command results
profiles
```

An `ExperimentSnapshot` owns complete portable content semantically. The DB
may share one immutable `experiment_contents` row between an Experiment and a
Snapshot when the bytes are identical. Export/read materializes the portable
shape; `content_id` never enters the domain contract.

`experiment_snapshot_sources` exists only as backend provenance and
publication enforcement. It has no row for Session-origin Article captures
and is not exported in `ExperimentSnapshot`. Keeping the relation outside the
immutable Snapshot row also lets a deleted Experiment be collected while an
Article safely retains the Snapshot. There is no `parent_snapshot_id`.

Article `blocks` are the source of truth. `article_snapshot_refs` is generated
inside the Save RPC from each Experiment Placement; clients cannot submit a
second independent Briefing/reference list.

All client writes use semantic, idempotent RPCs. Direct table writes are
revoked. Each command is keyed by `(actor_id, operation_id)` and either returns
the original result for the same request or rejects reuse with different data.
Experiment and Article Saves use expected-version compare-and-swap and never
auto-merge.

List routes return cursor-paginated summaries only. Complete fixture,
checkpoint, Surface, and Article blocks are resolved through separately
authorized detail reads when an item is opened or selected; opening a library
must never download every stored numerical checkpoint.

Anonymous Auth is created at the first backend Save, not when a visitor merely
opens or forks a public simulation. Anonymous users can retain private work and
later link magic-link email or Google identity. Publishing requires a linked
non-anonymous account.

When `VITE_SUPABASE_URL` and its publishable browser key are configured, the
frontend uses these RPC/read functions as its sole durable repository. It does
not also write localStorage. The browser content store remains only for
unconfigured tests and local development; it is not a migration layer or an
offline replica.

Exact executable artifacts are uploaded by the trusted release command to the
public `model-releases` Storage bucket before registry admission. The object
path is immutable and model-scoped. Ordinary clients may download it but have
no upload or registry-write authority. The release command verifies existing
bytes before reusing a path, registers the exact release, and only then moves a
mutable channel such as `default`.

## 9. Retention and deletion

Snapshots are retained while referenced by a public Experiment or any retained
Article content. A newly admitted but unreferenced Snapshot receives a 24-hour
handoff grace so a failed handoff can retry. Operation receipts use the same
24-hour lifetime. Scheduled GC removes expired
unreferenced Snapshots, unreachable immutable content, and old idempotency
receipts in bounded batches.

Deleting an Experiment never deletes a Snapshot still used by an Article or
publication. Deleting/unpublishing the last owner removes only pointers first;
soft-deleted roots and unreachable immutable content become eligible for
bounded physical collection after one hour. Supabase Storage is not the sole
archive for exact model releases; registry artifacts remain reproducibly
available from the release pipeline as well.

## 10. Non-goals for the first backend cut

- no CRDT or automatic merge;
- no Realtime replication of numerical frames;
- no server-side normal simulation stepping;
- no Cloud Run dependency for ordinary Save/Snapshot/publication;
- no Assessment, Certification, ParameterSet, or durable settlement entity;
- no legacy data migration or compatibility readers; and
- no patient-specific data workflow.

Cloud Run Jobs may later host patient fitting or expensive batch analysis, but
browser Web Workers remain the interactive numerical owner.

## 11. Required invariants

1. Every durable Scenario carries fixture and exact checkpoint together.
2. Every Experiment and Snapshot pins one exact registered `modelId`.
3. Snapshot rows are insert-only and neutral; no purpose, Briefing, status, or
   qualification payload is stored in them.
4. The same admission implementation is used before every Snapshot insert.
5. Admission cannot mutate the captured candidate.
6. An Article Placement owns one Briefing and pins one Snapshot.
7. Briefing changes create new immutable Article content, not a new Snapshot
   unless a new numerical capture is intentionally requested.
8. Experiment Save may be unsettled and requires no admission.
9. Opening or forking a Session creates no durable Experiment.
10. Numerical model integrity is enforced at CI/registry admission, not
    rehashed by each client.
11. All backend writes are semantic, authenticated, idempotent, and
    version-checked where the resource is mutable.
12. Device layout and live status never leak into portable content.
13. Existing content resolves its stored exact model; it never falls back to a
    channel-selected model after load failure.
