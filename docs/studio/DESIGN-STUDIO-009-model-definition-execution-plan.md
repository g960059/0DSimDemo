# Model definition and execution-plan compiler

Status: binding compiled-state, topology, resource, and schedule boundary

This document defines how declarative model structure becomes a Worker-local
runtime plan. Numerical authority and solver admission remain in
[DESIGN-STUDIO-007](DESIGN-STUDIO-007-flat-numerical-kernel.md).

## Contract

Three artifacts have distinct owners:

1. `ModelDefinition` declares scientific components, accepted-state ownership,
   hydraulic nodes and paths, and conservation pools.
2. `NumericalPolicy` declares integration and solve groups, retained or
   condensed unknowns, update schedules, and storage policy.
3. `ExecutionPlanDescriptor` is deterministic portable data compiled from the
   first two. It assigns state slots, graph indices, solve blocks, endpoint
   ordinals, schedules, and workspace layout.

The descriptor contains no functions, module URLs, environment values,
digests, current state, or solver results. It is bundled with the exact
artifact; the browser never compiles a model or fetches a second plan.

## Compilation

Compilation is pure and host-neutral. It rejects duplicate or nonportable
identities, broken state ownership, invalid path endpoints, malformed
conservation pools, incompatible solve blocks, and invalid integer schedules.
Explicit ordinals, rather than source or object order, determine released
layout.

The compiler lowers declared structure only. It does not generate physiology,
residual equations, Jacobians, convergence rules, or constitutive kernels.
Adding a component or pathway is therefore incomplete until a compatible
model-owned executable kernel and scientific evidence are released.

## Admission and binding

At Scenario creation, the Worker fully validates and owns the portable
descriptor and admitted kernel catalogs. It requires exact kernel sets,
resolves symbolic identities to compact ordinals, verifies every state pointer
and solve-system owner, rejects aliased mutable storage, and allocates one
private plan and workspace for that Scenario.

Portable data does not acquire authority merely by matching a shape. Only the
validator's owned immutable result may use the bounded reuse path inside that
runtime instance. Values crossing another module or artifact boundary undergo
complete admission again.

The bound plan contains numeric indices and private metadata, not mutable
caller mappings. Functions remain in the exact artifact's kernel registry and
are selected only during cold binding. Unsupported or reordered blocks,
topology, schedules, or storage fail before numerical evaluation.

## Runtime ownership

The plan owns topology dispatch, state-slot projection, update scheduling, and
named workspace segments. The model-owned solve-system binder owns residual
assembly, Jacobians, globalization, convergence, and converged candidate
materialization. The typed numerical Session remains the sole accepted-state
and checkpoint authority.

Workspace arrays and views are persistent but Scenario-private. Raw Jacobians,
factorizations, right-hand sides, updates, trials, scales, and pivots have
nonoverlapping admitted segments. Candidate Session construction allocates new
plans before an atomic handoff; retired mutable storage is never reused.

The integer schedule determines when a declared solve group runs and when a
presentation target may be emitted. A descriptor can represent additional
groups, but the exact artifact must explicitly support their kernels and
semantics. The runtime never approximates an unsupported multirate model.

## Identity and evolution

Registry identity and exact-manifest admission, not a browser-side descriptor
hash, bind the released implementation. A changed descriptor that alters exact
state, solve behavior, scheduling, outputs, or continuation requires a new
exact release. Byte-only artifact revisions follow the separate equivalence
path.

Future transport, autonomic, multipatch, or alternate-topology models extend
declarations and policies without turning the plan into a generic equation
interpreter. Standalone scientific tools may keep explicit construction paths,
but production cannot silently fall back when released plan binding fails.

Tests own descriptor determinism, malformed-input rejection, generated parity,
kernel-set admission, nonaliasing, schedule behavior, checkpoint continuation,
and cold-start timing. Release diaries, concrete layout counts, performance
snapshots, and completed cutover narratives belong in Git history.
