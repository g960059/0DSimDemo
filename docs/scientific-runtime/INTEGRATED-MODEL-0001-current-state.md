# Integrated V3 model: current state

Status: numerical implementation in progress; not registered for product use.

## Current model boundary

The candidate product model is `MainWireIntegratedModelTransactionV3`. It
combines the five-wall circulation, coronary V3, event-driven rhythm/calcium,
and dynamic mechanical-support owners behind one accepted transaction and
exact-checkpoint boundary.

The numerical implementation, checkpoint codecs, focused verification, and
offline characterization tools remain under `engine/`, `__tests__/`, and
`tools/scientific/`. These are model-development assets. They are not a second
Studio data model and they are not a browser runtime.

`MainWireIntegratedLaneBootstrapV1` and
`MainWireIntegratedLaneSessionV1` are temporary numerical harnesses for that
model work. The Bootstrap is not a Studio `ScenarioPreset`, and the Session is
not the registered Studio `SimulationSession` adapter.

## Product boundary before registration

The product exposes only Home and the pre-registration Workbench surface. No
legacy scientific Alpha, performance lab, session/release facade, or dedicated
browser Worker is retained.

Before authored experiments or lessons are created, the implementation must:

1. define the exact V3 fixture, checkpoint, output, graph, control, and protocol
   contract;
2. register that exact package under a new immutable `modelId`;
3. pass registry admission, including the one-time package-integrity check;
4. make the registered V3 package the default model; and
5. wire the generic Workbench runtime to the registered contract.

Studio persists only the exact `modelId`. Clients trust a successfully admitted
registry entry and do not rehash the model package during load or execution.

## Integrity boundaries that remain

SHA-256 remains appropriate where the digest belongs to the numerical or
storage artifact itself:

- exact-checkpoint and in-flight state tamper/corruption guards;
- deterministic schedule, binding, and structural-profile identity needed by
  a numerical owner;
- offline generated artifact and regression-evidence verification; and
- storage-layer corruption detection.

These hashes do not become Studio domain identity and are not carried as a
parallel `{ id, version, sha256 }` model reference.

## Claim boundary

Numerical convergence, conservation, replay identity, and focused mechanism
checks do not establish physiological or clinical validity. Settlement and
numerical-health status are computed live and are not durable content. A saved
checkpoint is captured only through an explicit user save; snapshot creation
is gated on the current live state without persisting assessment objects.

Literature and validation boundaries for the retained V3 mechanisms are
documented in
[`INTEGRATED-MODEL-0002-literature-traceability.md`](./INTEGRATED-MODEL-0002-literature-traceability.md).
