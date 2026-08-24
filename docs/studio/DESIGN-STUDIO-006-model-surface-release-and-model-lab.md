# Studio identity and release composition

Status: current architecture contract

This document defines identity and ownership. Experiment, Snapshot, and
publication semantics remain in
[DESIGN-STUDIO-003](DESIGN-STUDIO-003-experiment-data-architecture.md).

## Identity layers

```text
exact model release       immutable modelId
analysis profile          versioned analysisProfileId and method catalog
Model Surface             immutable surfaceReleaseId in a surfaceSeriesId
active bundle             operational pointer for new Sessions
durable content           stored exact/Surface pins
```

### Exact model

The exact model owns equations, state topology, solver and event semantics,
fixture/control binding, checkpoint continuation, primitive signals, and
metrics accumulated from accepted numerical steps. Its executable artifact and
manifest are immutable registry authority.

Exact frames contain only exact outputs. Studio analyses must not reserve an
exact output and return null until another runtime overwrites it. A change to
exact output meaning or membership changes the exact ABI and receives a new
`modelId`, even if equations and solver trajectories are unchanged.

### Analysis profile and methods

The registry row selects an `analysisProfileId`. A profile resolves executable
analysis methods and their own output catalog. Analyses consume exact captures,
accepted outputs, or declared settled families without becoming exact Session
state.

PE, PVA, and literature-mapped estimated MVO2 are analysis-method outputs. The
Workbench and Reader may compose them beside exact outputs, but exact frame
selection, exact manifests, and exact checkpoint continuation do not include
them. Changing their algorithm or catalog normally versions the analysis
method/profile rather than the numerical model.

### Model Surface

The Model Surface owns compatible product exposure: controls, graphs, and
presentation composition. A Surface cannot redefine exact or analysis
semantics. Successors within a series are immutable and additive; Snapshots pin
one release while mutable Experiments follow the compatible lineage of their
stored series.

Surface-derived presentation values are distinct from scientific analysis
methods. New scientific results should have an analysis owner rather than be
placed in the exact manifest merely to make them selectable.

### Active bundle and durable content

The active bundle is a compare-and-swap operational pointer used only when a
new ordinary Session starts. It pairs one stable loadable exact release with a
stable compatible Surface; the exact registry row supplies the analysis
profile.

Experiments store `modelId` and `surfaceSeriesId`. Snapshots additionally pin
`surfaceReleaseId`; Articles pin Snapshots. Existing content never follows the
active pointer and never silently substitutes another exact release.

## Lifecycle and compatibility

Registry lifecycle is `dev | stable | retired`. Publishing immutable rows does
not activate them. Historical exact releases and artifacts remain loadable for
durable pins until deliberately retired under the content policy.

Artifact-only optimization under one `modelId` is allowed only when the exact
manifest is unchanged and the repository's equivalence gate permits the new
revision. Otherwise mint a new exact identity. Analysis-only changes do not use
that exception because they belong to the analysis profile.

Snapshot admission checks executable consistency and model-owned numerical
gates. It does not certify settlement, physiology, or clinical validity.

## Model Lab and authoring

`/dev/model-lab` is an ephemeral launch of the checked-in local bundle using
the ordinary Worker architecture. It cannot create durable content. Official
content uses the ordinary Experiment/Snapshot/Article workflow and the same
Supabase authority as every other author.

## Implementation entry points

Only open these when the task needs the boundary:

- exact and Surface schemas/composition:
  `studio/contracts/v2/modelSurface.ts`;
- analysis profile/method catalog:
  `studio/analysis/StudioAnalysisMethodRegistryV1.ts`;
- registry resolution and client composition:
  `StudioSupabaseModelReleaseResolverV1.ts` and
  `StudioDefaultCompositionV2.ts`;
- Worker ticket and artifact admission: `studio/contracts/v2/release.ts` and
  `DynamicExactModelRuntimeLoaderV2.ts`.

Code and tests own current IDs, catalogs, lifecycle RPC shapes, and admission
details. Do not duplicate them here.
