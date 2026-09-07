# Studio identity and release composition

Status: current architecture contract

Studio persists two semantic identities:

```text
exact model       immutable modelId
Model Surface     immutable surfaceReleaseId in a surfaceSeriesId
```

The active bundle is only the pointer used for new Sessions. Experiments store
`modelId` and `surfaceSeriesId`; Snapshots additionally pin
`surfaceReleaseId`; Articles pin Snapshots.

## Ownership

The exact model owns equations, state topology, solver and event semantics,
fixture/control binding, checkpoint continuation, primitive signals, and
metrics accumulated from accepted numerical steps. Exact frames contain only
exact outputs.

Analysis remains a code responsibility, not a third release layer. An
immutable Model Surface pins versioned method IDs for its derived outputs and
structural analyses. Unknown methods make only those items unavailable. Old
method implementations remain loadable for pinned historical Surfaces.

The Model Surface owns its display name and compatible exposure: controls,
derived outputs, graphs, knobs, protocols, and presentation composition. An
additive successor may add items without changing existing definitions.
Changing or removing an exposed definition requires another Surface series.

The default fixture for a new Session is launch metadata. Saved content owns
its captured fixture/checkpoint, so changing that default does not change
existing content or `modelId`.

## Identity decision table

This table applies after an identity is fixed: registry publication (including
`dev`), or an earlier durable replay contract that resolves by that identity.
Before fixation, research candidates may change without minting another exact
model. Record the actual source/artifact content hash, inputs, initialization,
numerical settings, and assessment versions; a dirty worktree's HEAD alone is
not a reproducible identity. Candidate names are not published contracts.

| Change | Required identity action |
| --- | --- |
| Equation, state, solver, event, fixture schema, checkpoint, existing primitive control/signal/metric semantics | New `modelId` |
| Add a true primitive control, signal, or exact accumulated metric | New `modelId`, then expose through a Surface |
| New analysis algorithm for new outputs | New method ID and additive Surface release; keep `modelId` |
| Change the algorithm behind an existing Surface output | New method ID and new Surface series; keep `modelId` |
| Exact-artifact analysis request, protocol, or payload semantics | New exact capability ID and `modelId` |
| Add a derived output or graph | Additive Surface release |
| Expose another exact output already owned by the pinned model | Additive Surface release |
| Hide an exact output already exposed by the Surface | New Surface series |
| Change or remove an existing Surface item | New Surface series |
| UI layout, styling, locale copy, graph implementation | No semantic identity change |
| Visible model name | Surface release |
| New-session default fixture | Launch-default update only |
| Artifact refactor or optimization | Same `modelId` only if the exact manifest is unchanged and the byte-exact equivalence gate passes |

Manual naming does not grant compatibility. Repository admission compares the
exact manifest and artifact evidence; any admitted numerical difference must
mint a new `modelId`.

## Change-proportionate validation

Minting, scientific assessment, executable qualification, and document
publication are different decisions; none automatically repeats all the others.

- Equations, fixed construction parameters, or numerical behavior: recheck the
  affected numerical and physiological claims, including relevant responses.
- Checkpoint/continuation changes: check warmed uninterrupted versus restored
  execution, events, capture/fork isolation, and the actual Worker path. Two
  restored twins alone do not establish uninterrupted continuation.
- Baseline/preset input selection: keep the exact identity; qualify the adopted
  input's settlement and intended physiological claims, not every search trial.
- Analysis or assessment policy changes: reassess under the new version, using
  retained raw signals when sufficient. Do not overwrite the old assessment.
- Equivalent artifacts or presentation-only changes: check executable binding
  or Surface compatibility without reapproving unchanged scientific judgments.

Evidence reuse needs explicit correspondence of construction, inputs, numerical
path, measurement definitions, and policy. A construction hash alone is not
sufficient. Preserve original runs and reference flags; reused evidence is not
a fresh execution of the successor. Release binding may pin the new artifact,
launch checkpoint, and Surface without changing the scientific assessment.
The external 1/2 review gate applies to changed scientific judgments, including
criteria and evidence-reuse decisions, not each mechanical build or registration
step. A new release/version registry or general-purpose gate language is not
needed for this separation.

Reuse documentation modules when authoring, but freeze self-contained documents
with their actual model/Surface/analysis and assessment references. Sharing
equations does not make an older frozen document the successor's specification.

## Lifecycle

Registry lifecycle is `dev | stable | retired`. Publishing does not activate a
release. Retirement blocks ordinary activation and new publication but does
not break historical pins; only an explicit availability transition does so.

Snapshot admission establishes executable consistency, not settlement,
physiological validity, or certification.

`/dev/model-lab` is an ephemeral launch of the checked-in bundle through the
ordinary Worker path. It cannot create durable content.

Keep CI focused on the active implementation and the adoption candidate.
Retained immutable artifacts need integrity and supported-replay checks, not
rebuilding every old generation from today's shared source. Retire unused
implementations only after current runtime, Surface, analysis, and fitting
dependencies are migrated; document availability does not require retaining
the old numerical source.
