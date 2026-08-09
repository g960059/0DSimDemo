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
circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.development-36
```

It pins:

- regular-sinus rhythm;
- normal-coronary configuration;
- all-off, zero-inertance mechanical support;
- seven model-owned warm-start inputs: systemic and pulmonary resistance, venous
  tone, arterial stiffness, regular-sinus heart rate, fixed total blood
  volume, and PEEP;
- the validation-stamped `hot-path-lean` Worker execution tier, whose accepted
  frames and exact checkpoints are locked against `full-invariant` execution;
- the integrated V3 exact checkpoint codec v5;
- 49 registered outputs: 35 accepted-state/accepted-step signals and 14
  complete-beat metrics;
- four unit-safe graph constructors: pressure sweep, flow sweep,
  pressure-volume, and on-demand bilateral Guyton/Starling orientation; and
- one public-executable Snapshot admission policy shared by Article placement and
  standalone publication.

There is no Parameter catalog or durable `ParameterSet`. The seven registered
numeric controls are the only public input authority. Each control resolves in
the model-owned reducer, rebuilds a complete portable fixture, and atomically
starts its next input epoch from the current accepted `(revision, t, state)`
boundary. The changed fixture and a fresh checkpoint bound to it are what a
later explicit Draft save captures; the transient control action itself is not
durable content.

The beat metrics are accumulated from every accepted numerical substep,
including event-clipped substeps, rather than from decimated UI frames. They
remain unavailable until a complete atrial-capture-to-capture beat has been
observed. The extrema-derived LV volumes, stroke volume, and ejection fraction
are deliberately not labelled EDV/ESV because they are not yet tied to named
valve events.

Registry admission performs the one-time exact manifest/artifact integrity
check. New Sessions resolve the active model/Surface bundle once; existing Experiments and
Snapshots resolve their stored exact `modelId`. The trusted Worker loader then
evaluates that release's self-contained module bytes and materializes the
executable bundle from them; arbitrary bytes cannot be paired with
source-created functions. Browser clients trust the registry response and do
not rehash the artifact during load or execution. `development-36` uses a
registry-only legacy ABI adapter, leaving its committed bytes and modelId
unchanged.

The model-compatible Snapshot admission policy is purpose-neutral. Before
admission, Workbench freezes the click-time model/fixture/input intent and may
reuse the newest exact cycle-boundary candidate already produced by the
post-control background lane shared with PV/Starling. It never waits for that
speculative lane; the click-time capture is the fallback. The runtime-only
candidate may continue to observe bounded beat-to-beat output closure, but is
not formal period-1 qualification. Admission then restores the selected candidate
exactly, verifies checkpoint round-trip identity, finishes the open
cycle/window on a detached fork, advances one complete regular-sinus cycle,
and applies the canonical finite, conservation, event-identity, and MCS-off
checks. It preserves the selected candidate checkpoint byte-for-byte.
Settlement is neither required nor claimed, and the same admission runs before
Article placement and standalone publication. Experiment Save remains an exact
current-live capture and is allowed for an unsettled state.

Snapshot admission is a Studio product policy, not part of future numerical
`modelId` identity. `development-36` remains an immutable transitional bundle
that still co-packages this policy; the next exact-model release boundary must
separate the numerical executable artifact from admission and presentation so
non-numerical product work does not mint a new model ID.

The live Worker exposes correlated accepted-boundary Experiment capture to the
main-thread authoring application. Explicit Save captures each Scenario's
current fixture and exact checkpoint; accepted steps between saves remain
ephemeral Worker state and are never written at the numerical step rate.

The systemic and pulmonary return panes request one read-only analysis only
when needed. They freeze one accepted input target, opportunistically reuse its
latest ready single-flight candidate without awaiting convergence, and show a
structural
volume-constrained orientation plus its operating point. The same on-demand
request initializes two disposable analysis Workers from that exact candidate
checkpoint, and runs hypovolemic and hypervolemic fixed-TBV continuations in
parallel while the persistent live Worker resumes. Their actual progressive
points are merged into one responsive Starling preview. Its short
warm-up/measurement protocol is explicitly unsettled and is not qualified
periodic evidence. A pressure-volume pane can instead opt into a separate
formal analysis identity. That path warm-starts bounded fixed-TBV loads, admits
only canonical full-accepted-state period-1 qualified branches, and fits the
event-consistent multi-load ESPVR/EDPVR loci directly. Formal analysis remains
ephemeral numerical evidence rather than clinical or independent physiological
validation. The complete boundary is specified in
[`INTEGRATED-MODEL-0003-guyton-starling-side-analysis.md`](./INTEGRATED-MODEL-0003-guyton-starling-side-analysis.md).

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
explicit Experiment Save captures an exact accepted-boundary checkpoint but
makes no admission claim. Every immutable Snapshot must pass the same numerical
admission while retaining its selected exact steady-candidate checkpoint;
neither Article placement nor publication claims settlement. No path persists
candidate diagnostics, status flags, or assessment objects.

The development package's underlying engine claim remains
`releaseReady: false` and `simulationReady: false`. Passing Snapshot admission
does not change that claim.

Literature and validation boundaries for the retained V3 mechanisms are
documented in
[`INTEGRATED-MODEL-0002-literature-traceability.md`](./INTEGRATED-MODEL-0002-literature-traceability.md).
The exact Studio Control, Output, and Graph surface is listed in
[`INTEGRATED-MODEL-0004-studio-catalog.md`](./INTEGRATED-MODEL-0004-studio-catalog.md).
