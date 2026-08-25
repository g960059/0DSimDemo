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

## Lifecycle

Registry lifecycle is `dev | stable | retired`. Publishing does not activate a
release. Retirement blocks ordinary activation and new publication but does
not break historical pins; only an explicit availability transition does so.

Snapshot admission establishes executable consistency, not settlement,
physiological validity, or certification.

`/dev/model-lab` is an ephemeral launch of the checked-in bundle through the
ordinary Worker path. It cannot create durable content.
