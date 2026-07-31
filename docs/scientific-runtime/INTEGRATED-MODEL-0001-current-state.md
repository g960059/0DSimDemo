# Integrated V3 model: current state

Status: exact experimental development package registered and wired as the
default live Workbench model; not release-ready or clinically validated.

## Current model boundary

`MainWireIntegratedModelTransactionV3` combines the five-wall circulation,
coronary V3, event-driven rhythm/calcium, and dynamic mechanical-support owners
behind one accepted transaction and exact-checkpoint boundary.

The numerical implementation, checkpoint codecs, focused verification, and
offline characterization tools remain under `engine/`, `__tests__/`, and
`tools/scientific/`. These are model-development assets, not a second Studio
data model.

`MainWireIntegratedModelRuntimeV3` and
`MainWireIntegratedModelSessionV3` own the canonical numerical runtime and
accepted-boundary session used behind the registered Studio simulation adapter.
They are engine internals: durable Studio content stores only the exact
`modelId`, fixture, and checkpoint.

## Current product wiring

The product exposes Home and a live V3 Workbench. Workbench materializes the
trusted client registry projection from the committed exact executable
artifact, starts the generic simulation Worker automatically, and advances the
actual integrated V3 accepted state. Its Dockview graph, output, and control
role areas are derived from the registered model catalogs and share one
page-owned Worker. It does not invoke a mock graph or a legacy model facade.

The current exact development release is:

```text
circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.development-2
```

It pins:

- regular-sinus rhythm;
- normal-coronary configuration;
- all-off, zero-inertance mechanical support;
- the integrated V3 exact checkpoint codec;
- eight initial signals and two graph definitions; and
- the candidate periodic Snapshot gate.

Its parameter and control catalogs are empty. Portable controls have not yet
been admitted, so no durable `ParameterSet` or pretend knob mapping is exposed.

Registry admission performs the one-time exact manifest/artifact integrity
check. The trusted loader evaluates those exact self-contained module bytes and
materializes the executable bundle from them; arbitrary bytes cannot be paired
with source-created functions. Browser clients load that committed admitted
artifact and do not rehash it during load or execution.

The model-pinned Snapshot gate restores the frozen candidate exactly, runs the
periodic qualification protocol, accepts only period-1 convergence without
numerical, event, or conservation failure, and emits a fresh terminal exact
checkpoint. This gate is used only by Snapshot creation; Draft save remains
allowed for an unsettled state.

The live Worker does not yet expose accepted-boundary Draft capture to the
main-thread authoring application. The default browser composition therefore
does not construct an authoring facade against a second, invisible runtime
host. That Worker-to-authoring bridge is implemented together with the Save UI;
until then the Workbench is intentionally live/read-only.

No official Scenario Preset, Experiment, Snapshot, article Placement, or Lesson
content ships in this cutover. Those are authored only after the development
package and portable controls are deliberately promoted.

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
numerical-health status are computed at runtime and are not durable content. An
explicit Draft save captures an exact accepted-boundary checkpoint, but the
saved Draft may remain unsettled or numerically unhealthy and makes no
qualification claim. Snapshot creation qualifies the frozen saved Draft,
captures fresh settled checkpoints, and persists neither status flags nor
assessment objects.

The development package's underlying engine claim remains
`releaseReady: false` and `simulationReady: false`. Passing the candidate
Snapshot gate does not change that claim.

Literature and validation boundaries for the retained V3 mechanisms are
documented in
[`INTEGRATED-MODEL-0002-literature-traceability.md`](./INTEGRATED-MODEL-0002-literature-traceability.md).
