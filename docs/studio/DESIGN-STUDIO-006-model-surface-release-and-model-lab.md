# CircleHeart Studio — exact model, Model Surface, active bundle, and authoring

Status: authoritative pre-release contract; direct cutover

Date: 2026-08-09

Decision: keep exact numerical identity small and permanent, release the
authoring/analysis Surface independently, retain only `dev | stable | retired`,
launch new ordinary Sessions from one atomic active model/Surface bundle, and
author real content through the ordinary product with a narrow AI-assist API.

This document refines the model-release boundary in
`DESIGN-STUDIO-003-experiment-data-architecture.md`. It does not redefine
Experiment, Snapshot, Placement, or Briefing.

## 1. Identity layers

```text
Exact model kernel                    immutable modelId
  equations / state topology
  solver and event semantics
  fixture schema and control binding
  checkpoint codec and restore
  primitive controls and signals
  model-owned accepted-substep metrics
  executable artifact

Model Surface                         immutable surfaceReleaseId
  exposed controls
  derived outputs
  graphs
  Knobs
  protocols

Active model bundle                   singleton CAS pointer
  one stable, loadable modelId
  one stable, compatible surfaceReleaseId
  used only when a new ordinary Session starts

Experiment / Snapshot / Article       ordinary Supabase content
  authored in the same UI used by every author
  optionally read or changed through the same typed authoring API
```

`modelFamilyId` groups compatible exact releases. It is not executable
identity. The active bundle is operational selection, not content identity:
existing Experiments and Snapshots keep their stored exact/series pins.

## 2. Exact numerical identity

`ExactModelKernelManifestV3` contains only the numerical contract:

- `modelId` and `modelFamilyId`;
- equations, runtime and solver definitions;
- fixture schema and checkpoint codec;
- primitive controls and primitive signals;
- model-owned metrics accumulated by the numerical Session from accepted
  substeps;
- explicit capabilities; and
- the registered executable artifact guarded at registry admission.

It cannot contain graph catalogs, Studio-derived metrics, Knobs, protocols,
labels, colors, Snapshot policy, Article behavior, or product policy.
Model-owned metrics are the narrow exception: their accumulation and meaning
are executable numerical behavior and therefore belong to the exact contract.
Once exposed there, their in-progress accepted-substep accumulator and latest
completed beat are also exact checkpoint state. A Standard checkpoint restores
both alongside the numerical accepted state so one pinned checkpoint has one
future exact-output continuation; the historical operational checkpoint codec
remains unchanged for its already released model.
Exact-key validation rejects presentation and product fields.

A changed state topology, result-affecting path, parameter meaning, primitive
output meaning, event/solver semantics, or executable bytes receives a new
`modelId`. A default-off numerical feature still changes the executable and
checkpoint contract and therefore also receives a new `modelId`.

## 3. Model Surface

`ModelSurfaceReleaseManifestV1` is immutable and family-scoped. Every item
declares `requiredCapabilities`. Runtime materialization retains only items
supported by the pinned exact model and Studio build. A new graph requiring a
new signal is therefore absent for an older family member; it does not make the
entire Surface unusable.

Within one `surfaceSeriesId`, releases are append-only. Each successor names
its predecessor. Registry admission compares the predecessor structurally in
the same transaction: an existing item cannot be removed or redefined. Surface
registration is a reviewed release action, not an exploration medium.

Exact-model output IDs are reserved throughout the family. Derived outputs may
not reuse them. A released Surface item ID never acquires a new meaning.
Derivations are immutable and versioned, consume the full accepted-substep
stream in the Worker, and never derive scientific values from decimated UI
frames.

V1 Knobs are affine numeric mappings. Their complete domain must map inside
every primitive target domain, and their default must reproduce primitive
defaults. A non-neutral intervention belongs in a Scenario/Preset/Protocol,
not in Knob initialization.

Protocols remain declaration-only until accepted-boundary timing,
input-epoch, interruption and capture semantics are implemented.

Registry tools are deliberately separate from activation:

```sh
npm run publish:registry:main-wire-v3 -- \
  --project-ref <ref> --stage <dev|stable>

npm run publish:registry:model-surface -- \
  --project-ref <ref> --manifest <surface.json> --stage <dev|stable>

npm run activate:registry:model-bundle -- \
  --project-ref <ref> --model-id <modelId> \
  --surface-release-id <surfaceReleaseId> \
  --expected-version <none|integer>
```

Publishing immutable rows never changes what new users launch. Activation is
one explicit CAS operation after both rows are stable and compatible.

## 4. Lifecycle and active selection

There are exactly three stages:

| Stage | Meaning | Private Save/Snapshot | Public publication |
| --- | --- | --- | --- |
| `dev` | under evaluation | yes | no |
| `stable` | approved for ordinary product use | yes | yes |
| `retired` | unavailable for new selection, retained for history | explicitly pinned only | no new publication |

Allowed transitions are `dev → stable`, `dev → retired`, and
`stable → retired`; `retired` is terminal. `loadable=false` is an independent
emergency stop.

There is no generic `default`, `research`, release or publication channel.
`studio.active_model_bundle` is one singleton row containing a coherent exact
model and Surface pair plus a monotonically increasing version. It enforces:

1. exact model exists, is loadable, `stable`, and uses the Standard module ABI;
2. Surface exists and is `stable`;
3. both have the same `modelFamilyId`;
4. replacement is compare-and-swap; and
5. an active row cannot retire until another pair replaces it.

`get_active_model_bundle_v1()` returns both manifests in one read. A new
ordinary Session resolves this once and immediately pins the returned IDs.
Mutable Experiments resolve the deepest compatible member of their stored
Surface series by lineage, never registration time or ID sorting. Stable and
retired exact models see stable Surface releases only; a dev exact model may
reopen its dev Surface successors. Immutable Snapshots resolve their exact
Surface release.

## 5. Snapshot admission

There is no author-selectable admission profile. Article Briefing and
standalone publication use the same `StudioSnapshotAdmissionServiceV1`.
Admission checks exact restore/round-trip, finite/conservation behavior, event
identity and bounded executable verification. It does not claim settlement,
clinical validity, physiological validity, or certification.

Snapshot creation is a numerical execution operation. A tool may automate it
only through a real browser, Node, or future Cloud execution host that owns the
same Worker capture and admission contracts. Supplying arbitrary fixture and
checkpoint JSON directly to persistence is not an authoring shortcut.

## 6. One Model Lab

`/dev` is a compact developer inventory. `/dev/model-lab` is the sole Model
Lab and uses the same Experiment Session UI and Worker architecture as the
product.

The Lab launches one explicit checked-in local Standard model/Surface bundle.
It does not resolve a research channel, silently substitute the active model,
or introduce another content repository. Its Home action returns to `/dev`.
It is an ephemeral validation Session: Save, Snapshot, Briefing and publication
are unavailable. Durable authoring starts from the ordinary active-model
Experiment Session. This prevents a dirty local artifact from minting durable
content under an already released exact `modelId`.

The checked-in Workbench Surface is the complete ordinary product surface: all
eight supported controls, pressure and flow waveforms, four-chamber PV loops,
and Guyton/Starling structural analysis. The exact model supplies every raw
signal and its accepted-substep beat metrics. New local and registry-backed
Workbench Sessions therefore compose through the same Standard contract.
The earlier LV-only acceptance Surface used a different immutable series and
is not a second runtime authority.

## 7. Ordinary content and AI assistance

Official and user-authored Experiments/Articles use the same Supabase drafts,
Snapshots, publication RPCs, Editors and Readers. There is no Git recipe type,
recipe runner, generated official-content database, or separate development
Editor/Reader.

The first content is intentionally made through the normal UI with iterative
human/AI review. Only repeated operations observed during that work become
automation. The initial typed command seam supports:

- listing and reading the author's Experiments, Snapshots and Articles;
- saving Article drafts;
- changing an Experiment title/presentation Surface without changing numerical
  Scenario captures; and
- publishing an already admitted Snapshot or Article through semantic RPCs.

Commands use a normal author session and an `sb_publishable_` key. Service-role
keys, including legacy service-role JWTs, are rejected. Every command carries a
UUID `commandId`; mutation commands reuse it as the backend idempotency key, so
an identical retry cannot duplicate an Article or Experiment. There is an
optional policy hook for future confirmations, but the current local AI
workflow is allow-by-default as requested. Safety remains in schema validation,
exact model/Surface-aware presentation and Briefing checks, Snapshot admission,
CAS, RLS and backend publication gates.

The CLI is:

```sh
npm run author:login -- --profile official
npm run author:content -- --profile official --command path/to/command.json
```

It consumes `circleheart-studio-authoring-command-v1` JSON and emits JSON.
The executable action inventory and authentication contract live in
[`tools/authoring/README.md`](../../tools/authoring/README.md).
Authentication uses the same Google/Supabase user authority as the product.
The PKCE callback is loopback-only, project metadata is a non-secret local
profile, the rotating refresh token is held in macOS Keychain, and access
tokens remain in memory. Every refresh rotation is persisted before a durable
authoring command may execute. Credentials never enter a command document or
stdout. A complete access/refresh token pair remains an explicit, non-persisted
headless override. The credential provider is a local Node boundary shared by
the CLI and a future local MCP adapter; MCP must not introduce another token
store or authoring authority, and must serialize refresh rotation per profile
before serving concurrent requests. Logout best-effort revokes the CLI session
and always removes the local Keychain credential without touching the browser
session.

Scenario creation, parameter search/fitting, and Snapshot capture are deferred
until several real authoring sessions reveal the required operations. Their
future implementation extends the same command service with an execution-host
port. It must warm-start from valid capture state, apply hierarchical bounded
changes, evaluate requested outputs/morphology/V&V, and admit the resulting
Snapshot before persistence. It must not introduce `ParameterSet`, mutable
Snapshot, or a second Experiment data model.

## 8. Database authority

Supabase owns:

```text
model_releases                       immutable exact packages
model_release_availability           stage + loadable
model_surface_releases               immutable Surface manifests
model_surface_release_availability   stage
active_model_bundle                  singleton model + Surface CAS pointer
model_release_successions            explicit lineage

experiments / experiment_contents / experiment_snapshots
experiment_publications
articles / article_contents / article_publications
operation_receipts / profiles
```

Generic channel tables and RPCs are removed. Publication triggers continue to
require a stable, loadable exact model and stable pinned Surface for every
published Snapshot.

## 9. Binding invariants

1. `modelId` identifies exact numerical meaning, not presentation.
2. `surfaceReleaseId` cannot redefine primitive model semantics.
3. Surface successors are append-only and item capabilities degrade per item.
4. New Sessions resolve one atomic active bundle; existing content never
   follows that pointer.
5. Mutable Experiments pin a Surface series; Snapshots pin one release.
6. `dev | stable | retired` are the only lifecycle states.
7. Active rows are stable and cannot retire before replacement.
8. Model Lab is an explicit local launch, not a release lifecycle phase.
9. One common admission service owns every Snapshot insertion path.
10. Normal UI and AI commands share one content authority and data model.
11. AI commands default to no interactive approval, but cannot bypass RLS,
    CAS, model validation, Snapshot admission or publication gates.
12. Automation is added from observed authoring repetition, not speculative
    parallel workflow machinery.
13. Workbench/ExperimentSession accepts only the Standard exact-model ABI;
    unsupported historical package shapes fail closed.
