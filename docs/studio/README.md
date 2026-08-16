# CircleHeart Studio

Status: active pre-release architecture

Studio is the product layer over the host-neutral numerical model. It owns
Experiment authoring, immutable Snapshots, Article placements, runtime
orchestration, publication, and presentation. It does not own equations,
solver internals, or model-specific state.

There are no external users yet, but official public Articles and immutable
Snapshots exist in production. Pre-release cleanup may remove unused code and
database history only after those durable references have been exported,
re-sealed, or deliberately reset. “No external users” is not permission to
break an exact pin that a current public Article still uses.

## Canonical contracts

- [DESIGN-STUDIO-003](DESIGN-STUDIO-003-experiment-data-architecture.md)
  owns Experiment/Snapshot persistence, exact pins, capture, and publication.
- [DESIGN-STUDIO-004](DESIGN-STUDIO-004-reader-briefing-experiment-ia.md)
  owns standalone Experiments, Article placements, Briefings, responsive
  Reader behavior, and routes.
- [DESIGN-STUDIO-005](DESIGN-STUDIO-005-live-graph-performance.md) owns the
  Worker-to-Canvas presentation pipeline, group playback, diagnostics, and
  physical-device performance gates.
- [DESIGN-STUDIO-006](DESIGN-STUDIO-006-model-surface-release-and-model-lab.md)
  owns exact model/Surface identity, `dev | stable | retired`, the active
  model/Surface bundle, Model Lab, and assisted authoring.
- [DESIGN-STUDIO-007](DESIGN-STUDIO-007-flat-numerical-kernel.md) owns the
  accepted numerical authority, solver boundary, checkpoints, retained
  scientific oracles, and future-model extension rules.
- [DESIGN-STUDIO-008](DESIGN-STUDIO-008-public-content-delivery.md) owns public
  Article SSR, Markdown/JSON delivery, discovery metadata, and caching.
- [DESIGN-STUDIO-009](DESIGN-STUDIO-009-model-definition-execution-plan.md)
  owns build-time model compilation and Worker-local execution-plan binding.

Superseded Studio V1 documents, launch channels, Git recipes, and completed or
explicitly superseded vertical-slice plans live only in Git history.

## Current production boundary

New Sessions resolve one stable active model/Surface bundle. The active exact
release is Standard-60 and the active Surface is
`circleheart.main-wire.surface.workbench-v1`. The exact artifact carries its
generated execution-plan descriptor; each Scenario Worker validates and binds
one private plan before it constructs the numerical Session.

Saved content never follows the active pointer:

- an Experiment pins `modelId` and `surfaceSeriesId`;
- a Snapshot pins `modelId`, `surfaceSeriesId`, and `surfaceReleaseId`;
- an Article placement pins one immutable Snapshot; and
- a historical load failure is reported instead of substituting the active
  release.

All current official Articles, Experiments, and Snapshots were re-created on
Standard-60 before the pre-release database prune. The registry therefore has
one executable ABI: every admitted exact artifact owns a generated execution
plan and packed presentation batches. Generic exact loading remains because a
future immutable Snapshot may pin an older exact release that still implements
that ABI; no frame-per-step or execution-plan-free compatibility path remains.
New exact releases do not decode or reinterpret older checkpoints.

## Authoring and publication

Official content uses the same Experiment Session, Snapshot admission, Article
Editor, Reader, and Supabase authority as other content. AI assistance uses the
typed CLI described in [tools/authoring/README.md](../../tools/authoring/README.md):
model discovery, explicit Scenario operations, preview, exact-pinned apply,
saved-head Snapshot sealing, Briefing placement, Article block patches, and
separate publication commands.

There is no Git recipe authority, release channel, or alternate development
Editor. `/dev/model-lab` launches the checked-in local bundle for ephemeral
numerical inspection and cannot Save, seal, Brief, or publish. Durable content
is authored through the ordinary active-model Session.

Snapshot admission is purpose-neutral and shared by standalone publication and
Article placement. It validates exact restoration and the model-owned numerical
gate; it does not claim clinical validity or settled physiology.

## Repository and trust boundaries

A configured build uses Supabase as its only durable content repository. The
browser store is an unconfigured local/test adapter, not a second production
write target. Public publication remains a server-authorized operation.

Dependency direction is fixed:

```text
Studio presentation
  → Studio application
    → Studio contracts and ports
      → registered exact-model adapter
        → scientific model platform
```

Studio contracts, application code, and infrastructure do not import React or
model internals. Model-specific integration belongs behind the registered
adapter. Presentation may decimate or defer rendering, but it may not change
accepted numerical steps, checkpoints, or exact content identity.

## Cleanup rule

Delete obsolete code rather than preserving it behind “legacy” switches. The
exceptions are narrow and explicit:

1. an immutable production pin still reaches the code or artifact;
2. a current scientific replacement gate uses the implementation as an oracle;
3. an external protocol is still supported by a declared product contract; or
4. a rollback-safe database migration still requires the old shape.

When none applies, Git history is the archive.
