# Numerical runtime and extension policy

Status: binding current numerical-runtime architecture

This document defines accepted numerical authority and the durable rules for
extending it. Model physiology and scientific claim limits remain in the
[integrated-model current state](../scientific-runtime/INTEGRATED-MODEL-0001-current-state.md).
Execution-plan compilation belongs to
[DESIGN-STUDIO-009](DESIGN-STUDIO-009-model-definition-execution-plan.md), and
device performance policy belongs to
[DESIGN-STUDIO-005](DESIGN-STUDIO-005-live-graph-performance.md).

## Accepted authority

Each live Scenario has one Worker-owned numerical Session and one accepted
state. A step reads the current state, evaluates a complete candidate in
private storage, validates cross-owner invariants, and promotes the candidate
once. Failure leaves the previous accepted state unchanged. Presentation,
authoring, adapters, and analysis forks are never a second writable authority
for that Scenario.

Accepted time and scheduled updates use integer numerical identity. Event-
limited substeps remain accepted boundaries and contribute to model-owned beat
metrics. UI cadence, wall-clock scheduling, and sampled frames cannot skip,
invent, or replace numerical time.

## State and execution plan

Current and candidate state use lifetime-fixed typed images with explicit
slots for continuous values, modes, presence, and bounded collections.
Writable buffers do not escape the Session; public observations are detached.
Immutable configuration is bound by identity rather than copied into evolving
state.

A generated, data-only execution plan declares state ownership, hydraulic
topology, solve groups, workspace, and integer update schedule. The browser
validates and binds the released descriptor but does not compile the model.
Unknown kernels, paths, state bindings, solve blocks, schedules, aliasing, or
unsupported topology fail before Session creation.

The plan owns orchestration and storage, not scientific equations or accepted
state. Residuals, Jacobians, convergence gates, event semantics, and candidate
materialization remain model-owned executable kernels.

## Solver and cache boundary

The coupled solve and constitutive mechanics use model-owned equations and
component convergence gates. Predictors, factorizations, and other warm-start
data are non-authoritative caches: they may reduce work but cannot relax final
residual, conservation, bound, material, or event requirements. Restore,
fixture discontinuity, or failed candidates invalidate incompatible caches.

A change to accepted equations, integration, step policy, solver semantics,
event order, primitive output meaning, or checkpoint continuation requires a
new exact `modelId`. An implementation-only artifact revision may remain under
one `modelId` only through the repository's byte-equivalence admission path.
Performance differences between devices may change presentation and
background-work budgets, never exact numerical semantics.

## Worker and presentation boundary

The persistent Scenario Worker advances every accepted step and projects only
selected exact outputs into transferable presentation pages. A page is neither
a checkpoint nor accepted authority. Capture, restore, analysis, control warm
start, and completed-beat metrics use model-owned state rather than rebuilding
it from displayed samples.

Scenario replacement is atomic. Candidate Sessions receive fresh state,
execution plans, and mutable workspace; failure leaves the previous Session
live. No backing buffer or solver scratch is shared between Scenarios or
between retired and candidate Sessions.

## Checkpoint and durable content

The exact checkpoint binds accepted state, clocks, in-progress model-owned
accumulators, configuration identity, and continuation semantics. It excludes
presentation history and non-authoritative solver caches. Restore validates the
complete envelope before rebuilding private runtime storage.

Experiments and Snapshots retain their declared exact and Surface pins.
Historical content loads its own immutable exact artifact; a current release
does not decode another release's checkpoint or silently substitute its state
layout.

## Release evidence

A numerical-authority change must cover, in proportion to its claim:

- local equation or root agreement against an independent reference;
- conservation, bounds, event order, and failed-candidate atomicity;
- checkpoint round-trip and exact continuation;
- periodic settlement and declared morphology corridors;
- controls, warm start, analysis isolation, and primitive outputs; and
- representative physical-device execution and retained-memory behavior.

Executable gates own tolerances and measurement protocols. Passing them
establishes declared numerical behavior, not physiological or clinical
validation.

## Extension rules

New transport, autonomic, device, myocardial, or topology owners must declare
state, units, conservation, scheduling, checkpoint meaning, and failure gates.
New pathways extend the declarative topology and compatible model kernels;
they are not ad hoc runtime branches. Multirate, sparse, SIMD, WASM, or parallel
implementations require a scientific reference and evidence that ordering and
accepted semantics are unchanged.

Construction diaries, release measurements, rejected runtimes, and superseded
migration plans belong in Git history.
