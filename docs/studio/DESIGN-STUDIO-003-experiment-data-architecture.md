# DESIGN-STUDIO-003: Experiment data authority

Status: active cross-cutting contract

This document distinguishes portable scientific content from ephemeral Studio
runtime state. Source schemas and tests own current fields, IDs, quotas, and
procedures.

## Durable entities

- An **Experiment Session** is ephemeral runtime state. Opening or changing one
  creates no durable content.
- An **Experiment** is a mutable, explicitly saved authoring head.
- A **Snapshot** is an immutable exact capture used for publication and Article
  placement.
- An **Article Placement** pins one Snapshot and owns an Article-local
  Briefing. It never follows a mutable Experiment head.

Experiment, Snapshot, and Article lifecycles are independent. An Article may
capture an unsaved Session without creating an Experiment, and deleting an
Experiment cannot invalidate a Snapshot retained by a published reference.

## Identity and release pins

One exact `modelId` owns equations, solver and event semantics, fixture and
checkpoint contracts, primitive signals, and model-accumulated metrics. Studio
application code, presentation catalogs, Auth, storage, and Article behavior
are independently versioned concerns.

Experiments pin their exact model and compatible Model-Surface lineage.
Snapshots additionally pin the exact Surface release used to author them.
Historical content must fail closed when a required release is unavailable; it
must never substitute the current active release.

Exact artifact revisions, analysis profiles, Model Surfaces, and active-bundle
composition are separate semantic owners. Their current registry binding and
lifecycle are defined in
[DESIGN-STUDIO-006](DESIGN-STUDIO-006-model-surface-release-and-model-lab.md).

## Portable content boundary

A portable Scenario capture contains its complete fixture and exact accepted
checkpoint as one atomic tuple. The fixture owns current inputs; the checkpoint
owns continuation state and model time. Runtime Worker handles, frames,
analysis progress, presentation buffers, caches, input epochs, focus, hover,
and device capability are not portable content.

The Model Surface owns authored graph, output, and controller composition.
Graph panes may compare several Scenarios. Output and controller panes resolve
one selected or fixed Scenario binding; a sealed Briefing materializes any
selection-dependent binding to a concrete Scenario.

## Save, capture, and admission

Save copies the current portable Experiment content. It does not require
settlement, Snapshot admission, or publication.

Snapshot capture freezes authored intent and copies each Scenario at an exact
accepted boundary. Scenarios are independent numerical lanes and need not
share one model time. A newer checkpoint may be used only while its exact
model, fixture, Scenario, and input epoch still match the frozen intent.

Snapshot admission verifies exact restore, continuation, finite execution, and
model-owned safety invariants. It does not replace the selected checkpoint and
does not establish settlement, physiological validity, clinical validity, or
certification. An ephemeral warm candidate is never persisted as such and is
not a qualification claim.

Publication is a separate explicit operation. Publishing moves a public
pointer to admitted immutable content; it does not mutate the Snapshot.

## Reference and access boundary

Private Experiments, draft Articles, immutable Snapshots, and public pointers
retain distinct access rules. A Snapshot becomes anonymously readable only
through an authorized public Experiment pointer or published Article
reference. Draft references do not make it public.

Unpublish and soft delete release mutable pointers without rewriting immutable
history. Garbage collection may remove only content that is both unreachable
and beyond its handoff/retention boundary.

Backend RLS, semantic write RPCs, optimistic concurrency, and immutable
reference checks are the durable authority. The browser and authoring CLI may
perform the same numerical admission, but neither may claim hostile-client or
server-side scientific certification. Backend trust details live in
[the Supabase boundary](../../supabase/README.md).

## Invariants

1. Exact numerical state has one owner and is captured only at accepted
   boundaries.
2. Fixture and checkpoint cross every save/capture boundary atomically.
3. Historical content retains explicit release pins.
4. Save, Snapshot admission, and publication are distinct user actions.
5. Briefing changes do not mutate numerical content.
6. Runtime acceleration state is neither portable nor qualifying evidence.
7. A failed or stale operation cannot partially replace durable content.
