# CircleHeart Studio v1 target architecture

Status: implementation-aligned target digest; headless runtime foundation present
Date: 2026-07-24
Cutover: greenfield Studio on the existing mathematical foundation

This is a compact implementation index. The complete and authoritative design
is [DESIGN-STUDIO-002](DESIGN-STUDIO-002-cell-document-architecture.md). If
wording differs, DESIGN-STUDIO-002 wins. Neither document replaces
model-specific scientific validation.

## 1. Project boundary

```text
CircleHeart Model Platform
  model packages / simulation runtime / state codec
  numerical steady solver / assessor / CLI and worker hosts

Studio contracts
  serializable commands, events, envelopes, refs, and ports

CircleHeart Studio
  Project / Experiment / Document / SimulationSession
  certification and publication policy / Reader / Study Lab / Editor
```

- Model Platform does not know Project, Document, permissions, or publication.
- Studio does not import solver or provider internals.
- Control-plane messages are serializable. Large snapshots and high-frequency
  signals travel through refs or data channels.
- The logical boundary is enforced in this repository before deciding whether
  to split repositories. This is a software-project and dependency boundary
  now; it is not yet a claim that two physical repositories or deployments
  exist.

This is a brownfield mathematical foundation with a greenfield product layer,
not a second simulation engine and not a migration of the old product schema.

## 2. Product identity

The durable content roots are Experiment and Document. “Cell” remains a short
UI label but is not a domain identity.

```text
ExperimentDraft → ExperimentRevision
CellPlacement
SimulationSession (ephemeral aggregate of N ScenarioRuntimeBranch)
DocumentDraft → DocumentRevision
```

- One Experiment pins one model and version shared by every scenario.
- A CellPlacement references an Experiment and owns only local presentation
  settings.
- A SimulationSession is one interaction with one Experiment and owns all
  branch runtime state.
- A scratch interaction starts as a SimulationSession plus an ephemeral
  ExperimentDraft. It does not create a hidden Document.
- Saving creates a durable ExperimentDraft. Adding text or placing the
  Experiment creates a DocumentDraft and CellPlacement.

Reader, Study Lab, and Document Editor are presentation contexts over this
shared object model, not separate owners or products.

## 3. Orthogonal presentation state

Do not collapse unrelated concerns into a single mode:

```text
Extent       inflow | peek | fullscreen
Capability   read | interact | compose
Placement    standalone | document
Persistence  scratch | project-draft | revision
Session      live | closing | closed
Branch       running | suspended
Publication  association from a PublicationManifest to revisions
```

Fullscreen does not imply compose permission. Published is not a persistence
state; publication is an immutable association. A lane failure and its terminal
outcome are reported separately from session lifecycle.

## 4. Catalog, Working Set, and Brief

Composition is additive:

```text
model Catalog
  → pin into an Experiment Working Set
    → pin and rank into inflow and peek Briefs
```

Graphs are spatial and may use an authored board. Controllers and metrics are
primarily non-spatial inspector lists. Brief view specifications are copied at
pin time so later Working Set edits cannot silently change published
presentation.

On phones, preserve content while replacing spatial board layout with
sequential paging.

## 5. Runtime invariants

Every parameter target change has one semantic operation:

1. increment the affected branch `targetGeneration`;
2. apply the target to the foreground live path;
3. automatically start a strict steady job for the same target;
4. discard any completion whose generation no longer matches;
5. retain a matching strict result as a candidate only;
6. promote a candidate only by explicit user command.

Continuous drag may coalesce work that has not started, but the latest target
must always receive both paths. There is no user-facing `stale` or `available`
steady-job state. Candidate availability is derived by generation equality.

The foreground integrates at 1× physiological time. A shared control binding
issues one atomic intent to every targeted scenario branch. Partial UI edits
are resolved against the latest desired target before dispatch; each runtime
branch receives a complete exact control map plus its target digest.

The implemented MainWire host topology is:

```text
one dedicated live Worker per scenario branch
  + one separate exclusive strict Worker lease per branch target
```

The lanes are cloned from the same accepted source boundary before either
advances. A branch lane ends as `success`, `failure`, `superseded`, or
`aborted`. Supersession by a newer generation and abort on close are expected
lifecycle outcomes: they do not reject the aggregate lane promise and are not
shown as numerical runtime failures.

The high-frequency live trace is a data-plane signal channel, not a domain
event log. Suspending waits for an accepted command boundary; resuming
continues the same numerical state and stream epoch. Strict settlement is an
independent Worker lease and is not suspended with presentation playback.

## 6. One-point start

- A MainWire v1 SnapshotEnvelope contains one exact V4 checkpoint, the ref of
  its resolved simulation input, and exactly one full seed observable frame at
  the same accepted revision and time.
- Open begins from that one settled or certified point, preferably at a
  model-defined canonical phase. Reset is the same target behavior but is not
  part of the current headless foundation.
- Waveforms grow forward from that point.
- A PV loop becomes closed only after its first complete cycle.
- Beat/window metrics remain `collecting` until a complete beat exists.
- The envelope never stores a fabricated or captured “last beat,” beat sample
  history, window metrics, or presentation state.
- Thumbnails and display traces are disposable derived caches, never evidence.

## 7. Artifact promotion

The following identities remain separate:

```text
steady candidate (ephemeral)
  → pinSteadyCandidate
RunArtifact (immutable computation)
  → required AssessmentReports
CertifiedSeed (approved warm-start snapshot)
  → atomic publication
PublicationManifest
```

Promoting a candidate in the current session is independent from pinning it as
a RunArtifact.

The current strict adapter admits a candidate only from a period-1 converged
receipt that claims periodic steady state and does not suspect a period-2
orbit. The retained closure evidence, beat count, anchor, classification,
checkpoint periodic tracker, boundary transactions, and terminal transaction
must agree; a zero-beat claim is rejected. This is numerical P1 admission, not
a full scientific Assessment or Certification. The candidate remains
off-display until explicit promotion.
The adapter promotes only a candidate it issued for the current target. While
the branch is running, it first advances the old trace to the candidate’s
canonical phase, then performs the one-point pointer swap. Successful
promotion consumes that ephemeral candidate; it cannot be promoted again.

An Assessment identifies an immutable subject plus assessor and profile
versions. Its reuse key is:

```text
subjectHash × assessorRef × profileRef
```

Certification policy can add gates to a model’s non-bypassable minimum profile
but cannot remove them. Reader never runs heavyweight certification
assessments; it opens a pre-certified seed.

## 8. Versioning and commands

Studio uses command-oriented application services, an append-only audit trail,
and materialized immutable revisions. It does not event-source the numerical
engine.

- Domain commands are durable and versioned.
- Session commands are ephemeral runtime operations.
- Slider pointer events are not durable history.
- Undo appends a compensating command or changes only the ephemeral session.
- Publication pins materialized snapshots and immutable artifact refs; it does
  not depend on replay under a future engine.

## 9. Model catalog and manual presets

The model package owns versioned signal, metric, parameter, transition-policy,
capability, state-codec, assessor, and minimum-gate declarations. Studio owns
case policy, expected findings, layout, renderers, and publication policy.

Studio v1 includes a manual preset as a named immutable ParameterSet:

```ts
type ParameterSet = {
  modelRef: ModelRef;
  values: readonly ParameterValue[];
  provenance: "authored" | "target-matched" | "fitted";
  publicSourceRefs: readonly ArtifactRef[];
  limitations: readonly string[];
};
```

Applying a ParameterSet never certifies it. It follows the normal settle,
assessment, and certification path.

## 10. Fitting boundary

Preset creation and patient fitting are not one feature.

- v1: authored ParameterSet; no optimizer or fitting contract.
- v1.5: versioned scalar target-driven fitting contract and job.
- v2: patient fitting with observed-data governance, identifiability,
  uncertainty, residuals, and held-out evaluation.

Patient fitting is a separate asynchronous service that reuses batch forward
execution and assessment primitives without moving inverse-problem concerns
into the kernel. A fitting result is a candidate, never a ParameterSet or
CertifiedSeed. Adoption is explicit and must be followed by settle,
assessment, and certification.

Observed, assumed, fitted, and simulated values retain discriminated
provenance. Patient data and sensitive lineage live behind a separate PHI
store, credential, audit, lifecycle, and consent boundary unreachable from
publication, embeds, and general-purpose MCP.

## 11. Greenfield cutover

The current product has user 0 and is not public. Studio v1 therefore does not
implement:

- backward-compatible reading of the old Studio schema;
- dual writes or staged traffic migration;
- generic migration ports;
- automatic reuse of current official cases, articles, or presets.

Useful model, runtime, renderer, artifact, and verification code is reused.
Current content may remain as read-only regression input, then be re-authored
after the mathematical model and certification policy are final.

The Studio MainWire path is V4-only and fail-closed. It has no V3 fallback,
control-ID aliases, compatibility reader, or migration adapter.
A branch opens only after canonical RunArtifact content has been checked
against its input, snapshot, target, execution identity, claims, and parent
run—not merely because an artifact ref exists.

Published future revisions are immutable and continue to pin executable model,
runtime, solver, and state-codec versions. Upgrading creates a new draft,
resettles, reassesses, and republishes.

## 12. v1 delivery slices

1. Contracts, model adapter, runtime orchestration, and artifact storage.
2. Standalone scratch, multi-scenario Study Lab, and Experiment versioning.
3. Assessment, certification, and author seeds.
4. Presentation Compose and Reader inflow/peek/fullscreen.
5. Document model, atomic publication, and official content re-authoring.

The first blocking runtime spike proves:

- exact warm restart from an arbitrary pinned run;
- immediate one-point projection;
- simultaneous live and strict paths for every target generation;
- late-result discard and no automatic candidate promotion;
- N-branch operation and offscreen suspend/resume without numerical change;
- deterministic input/snapshot association and explicit performance budgets.

Legacy coexistence is not a delivery slice.

The headless contracts, coordinator, V4 envelope/target codecs, Worker host,
runtime adapter, generation discard, signal suspend/resume, P1 candidate
admission, and explicit promotion boundary are present. Browser performance
budgets, viewport-driven scheduling, Reset, and product UI integration remain
to be qualified or implemented; their presence in the target design is not a
claim that the UI exists.

## 13. v1 non-goals

AI authoring, Community, free canvas, sweep/batch/Parquet, patient fitting,
general-purpose MCP write, cross-model comparison, migration adapters,
intervention-protocol authoring, and a general snapshot-codec registry are
post-v1.

## 14. Required companion specifications

Implementation detail belongs in versioned companion specifications:

1. domain and artifact schema/invariants;
2. runtime protocol and state machine;
3. assessment, certification, and publication;
4. transport, job lifecycle, and reproducibility;
5. document content model;
6. verification and performance plan.

The first active companion is
[STUDIO-RUNTIME-001](specs/STUDIO-RUNTIME-001-foundation-vertical-slice.md).
