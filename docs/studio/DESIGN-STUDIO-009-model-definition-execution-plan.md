# DESIGN-STUDIO-009: Model definition and execution-plan compiler

Status: binding compiled state, topology, solver resources, and update schedule

This document owns the declarative model-definition and ahead-of-time
execution-plan boundary. DESIGN-STUDIO-007 continues to own numerical
authority, solver gates, typed accepted state, and mobile performance.

## Decision

CircleHeart separates three numerical-runtime concerns:

1. `ModelDefinitionV1` declares scientific components, state ownership,
   hydraulic nodes and paths, and conservation pools.
2. `NumericalPolicyV1` declares integration order, solve groups, retained and
   statically-condensed unknowns, integer timebase/update groups, and
   solver/storage policy.
3. `ExecutionPlanDescriptorV1` is deterministic plain data produced from the
   first two inputs. It assigns state slots, graph indices, solve blocks,
   incidence endpoints, and scratch dimensions.

The browser does **not** compile a model. Compilation runs in repository and
release tooling. The descriptor is bundled in the exact model artifact and the
Worker performs only bounded validation, buffer allocation, and
executable-kernel binding. There is no second network fetch for the plan and no
cold browser compilation penalty.

The runtime does not hash the artifact or descriptor. Registry identity,
exact manifest validation, immutable `modelId`, and stored Snapshot pins
remain the authority. A changed exact executable still mints a new model
release through release tooling, but a browser-side SHA-256 comparison is not
part of initialization.

## Compiler boundary

Compilation is a pure, host-neutral operation. It must:

- reject duplicate or nonportable IDs, missing path endpoints, self-loops,
  broken conservation pools, unknown state/component references, nonsquare
  solve blocks, and noncontiguous explicit ordinals;
- canonicalize declaration arrays by their explicit ordinals rather than
  relying on object or source-file order;
- assign logical state slots and storage-specific f64/boolean indices;
- preserve each state's exact accepted-authority pointer for cold binding;
- lower hydraulic paths to upstream/downstream node indices and kernel IDs;
- lower solve blocks to contiguous unknown ranges and state-slot indices;
- derive one component owner and kernel identity for every solve block;
- preserve the model-owned solve-system identity that assembles residuals,
  Jacobians, and converged candidates for each solve group;
- validate and lower integer base ticks, presentation cadence, and each update
  group's period/phase to an immutable schedule with an exact solve-group
  binding;
- emit only deeply immutable JSON-compatible data—never functions, module
  URLs, environment values, or digests.

Explicit ordinals are intentional. Reordering declarations must not silently
renumber a released numerical system, while adding a new component or path has
one reviewable position.

## Generated descriptor slice

The compiler compiles the current one-patch hemodynamic slice to:

- `100` logical circulation/mechanics slots (`99` f64 and `1` boolean),
  matching the accepted typed hemodynamic view;
- four state-owner blocks at the current `0 / 3 / 24 / 46` boundaries;
- `31` stored hydraulic compartments and `37` paths;
- the current `14 + 16 + 2` coupled layout, with the two TriSeg unknowns
  statically condensed and systemic venous volume dependent on the global
  blood-volume ledger;
- a `2 ms` integer base tick with one period-1/phase-0 hemodynamic update group
  and period-1 presentation, plus backward Euler, Armijo Newton, and dense
  row-major LU as the current policy—not as permanent scientific structure.

`npm --silent run compile:model:execution-plan` emits the canonical JSON
descriptor to stdout. `--write` updates the checked-in generated descriptor
that release tooling verifies byte-semantically against a fresh compilation.
Tests require exact parity with the existing hard-coded layout,
declaration-order determinism, fail-closed invalid inputs, and a synthetic
VC-to-LA bypass path that leaves state and solve numbering unchanged. The
synthetic path is a compiler test only; it does not add a Fontan or congenital
circulation claim to the model.

## Bound runtime slice

The active Standard-59 release advertises both
`runtime/execution-plan-typed-authority-binding-v1` and
`runtime/execution-plan-newton-workspace-v1`. Its exact artifact contains the
generated descriptor and a small binder; it does not contain
`ModelDefinitionV1`, `NumericalPolicyV1`, or the compiler. Historical exact
artifacts without the capability continue to load through their immutable
legacy executable contract.

At Worker initialization, the binder:

- validates and owns the portable descriptor without invoking accessors;
- requires exact sets of admitted component-, path-, and solve-system kernel
  IDs;
- resolves those IDs to compact ordinals;
- retains compiler-owned component ownership for every hydraulic node and
  path, and binds node storage, endpoints, component kernels, path kernels,
  and conservation pools into one immutable topology dispatch;
- resolves every compiler-owned state pointer to exactly one compatible
  typed-authority slot;
- allocates nonaliasing graph-index and solver-workspace typed arrays once;
- binds the state dispatch directly to the model Session's sole transactional
  typed authority before that Session can publish a frame; and
- rejects a malformed or aliased result before numerical session creation.

Portable data crosses the application/artifact boundary only after a complete
structural validation and ownership copy. Inside one validator module instance,
resulting transitively frozen descriptor and kernel catalog receive private,
module-local admission brands. Later Scenario bindings reuse only those owned
objects; an original input object, structural lookalike, accessor-backed value,
or object arriving through the application/artifact bundle boundary still takes
the complete path.
The bound plan itself is admitted only after its typed-array layout and values
have been checked once. Its object shells are then frozen, its mutable numerical
workspace remains Scenario-private, and runtime dispatch resolves through
private metadata rather than caller-supplied replacements. This removes
repeated deep ownership work without widening the Worker trust boundary.

Component and path bindings remain symbolic owner bindings. Each solve group
also carries one model-owned system-kernel ID. The exact artifact resolves that
ID through an immutable runtime registry to one executable binder at Scenario
initialization; functions never enter the portable descriptor. One bound plan
is retained Worker-locally for each Scenario within one physical exact
session; no state or solver scratch is shared between Scenario branches.
An atomic Scenario rebuild allocates fresh plans for every next-session branch
before exact session creation. It does not share a plan between the old and
candidate exact sessions during handoff. Failure leaves the old session and
its plans untouched. The Worker rejects cross-Scenario backing-buffer
aliasing—including solve-system ordinals—before exact session creation. State
pointer lookup is a cold initialization operation. The admitted binding keeps
only numeric slot indices in private storage and exposes no mutable mapping
array. Standard-59 uses it in the live coupled-solver adapter. This is not a
generic equation interpreter. The typed-authority Session remains the sole
accepted-state and checkpoint authority: the plan contains no current,
candidate, or sampled logical state page.

The execution-plan adapter now owns plan-aware Session creation as one atomic
operation. The Worker binds one fresh plan per Scenario, verifies that their
mutable buffers do not alias, and passes the complete map to the exact model.
The model installs each compiler-owned state-slot projection and Newton
workspace while constructing its transactional typed authority. It no longer
creates a state-less Session and then repairs it through a synchronization
callback, nor does the registered path first construct the legacy hand-written
hemodynamic pointer projection. That compatibility projection remains confined
to standalone engine tests and tools that intentionally run without a compiled
model. Authored-control warm start builds a fresh plan and workspace for the
candidate Session; only a successful clock-preserving swap adopts them. The
retired Session and its workspace are never reused by the candidate.

The compiler also emits a canonical Newton/LU workspace layout rather than an
opaque allocation total. Current unknowns, residuals, Jacobian, factors,
right-hand side, its LU-transformed copy, update, trial values, both scale
vectors, and pivots each own one named contiguous segment. The Worker allocates
the two backing arrays once;
the exact binder creates persistent views at the emitted offsets and rejects
gaps, overlap, reordering, or foreign views. At an accepted boundary the active
unknowns are loaded by the model-owned solver from the directly bound typed
authority into the `current-unknowns` segment. Standard-59 binds the existing
30-variable coupled Newton solve to those exact Scenario-owned views. Raw
Jacobian and LU factors remain distinct segments; right-hand side,
LU-transformed right-hand side, update, trial, scale vectors, and pivots are
also plan-owned. The current component-specific analytic and finite-difference
scratch remains inside its scientific kernels. Equations, residual assembly,
globalization, convergence gates, accepted-state promotion, and checkpoint
meaning are unchanged: this release changes solver-workspace ownership and
therefore mints a new `modelId`, but does not claim new physiology or a new
solver algorithm.

The compiler also derives each solve block's component owner and kernel ID
from its state slots. The binder resolves these IDs to exact catalog ordinals
and exposes immutable dispatch metadata. The current Main Wire kernel consumes
the compiled block ranges for its noncoronary, coronary, and statically
condensed TriSeg partitions, while rejecting unknown, reordered, cross-owner,
or differently sized blocks. This moves orchestration metadata—not scientific
equations—out of hand-written Studio wiring.

Hydraulic topology follows the same rule. The portable descriptor stores
numeric component-owner indices for nodes and paths in addition to endpoint
and state indices. The Worker-local binder resolves these to exact component
and path-kernel ordinals, then supplies one immutable hydraulic dispatch to the
model-owned solve-system binder. Standard-59 validates the present Main Wire
31-node/37-path graph, storage-slot ownership, and global blood-volume pool
once before admitting the coupled workspace. The current residual kernels do
not yet interpret arbitrary topology, so an added bypass fails closed until a
compatible model-owned component kernel is released. This is intentional: the
compiler removes orchestration duplication without pretending to generate
new physiology.

The residual context and Newton workspace receive the same admitted layout.
The context gathers component unknowns, dispatches each retained residual
block by its compiler-bound kernel identity, and materializes the converged
candidate through the same ranges. The solver rejects any context/workspace
layout mismatch before it evaluates a residual. Component equations remain
ordinary model-owned TypeScript functions; the portable descriptor never
contains executable code or a generic physiology interpreter.

The Studio adapter no longer reconstructs the Main Wire
`nonCoronary / coronary / triSeg` system or copies accepted state into a second
page. During exact Session creation it prepares the compiler-owned workspace
and asks the neutral runtime binder to resolve the compiled solve-system
ordinal. The selected model-owned
binder validates the exact three-block contract and creates the coupled
workspace once. This keeps scientific assembly inside the model package while
making future solve systems selectable from `NumericalPolicyV1` without new
Studio-specific wiring.

The binder also owns the compiled update schedule. It validates integer base
and presentation periods, period/phase arithmetic, and the exact solve-group
ordinal before a Scenario can advance. The exact host converts accepted clocks
to integer base ticks, derives each presentation target from that schedule,
and dispatches the compiled solve group only when it is due. The Standard-59
host accepts exactly the present single period-1 hemodynamic group and fails
closed on a synthetic multirate schedule; it does not silently approximate a
multirate model. The compiler and neutral binder already admit multiple
groups, so a later scientific release can add transport or controller rates
without changing descriptor shape or returning to floating-point scheduler
identities.

## Cold-start evidence

Opt-in Workbench performance reports now distinguish:

- artifact fetch;
- module import plus exact factory construction;
- manifest/contract validation;
- authoring setup;
- model session creation;
- first exact frame;
- total Worker initialization and main-thread round trip.

`executionPlanBindMs` remains `null` for historical artifacts and is a measured
number for plan-capable exact releases. Full portable-descriptor admission is
included in `exactRuntimeLoad.contractValidationMs`. `executionPlanBindMs`
includes exact kernel-set binding, cross-bundle bound-plan admission, and
plan-owned typed allocation for every initially restored Scenario. Direct
installation into the model's accepted typed authority is
included in `sessionCreateMs`, because it is part of atomic exact Session
construction rather than a post-create synchronization phase.
The application/artifact crossing performs exactly one full admission and
retains the resulting owned descriptor in the frozen runtime. A validator
module instance may then reuse its privately owned frozen descriptor and kernel
catalog across Scenario bindings; this optimization neither transfers a
private brand across a bundle boundary nor caches a mutable source object.
This prevents a placeholder zero from being mistaken for evidence and makes
cold-start cost explicit as a bounded function of the admitted Scenario count.
Physical iPhone reports confirm that descriptor binding is bounded; continued
reports keep initialization and time-to-first-frame regressions visible.
Exact artifact URLs are immutable release identities. New uploads therefore
carry a one-year `max-age=31536000` Storage TTL, and the Worker fetch uses the
browser's shared HTTP cache even for historical objects created before that
metadata policy. The registry publisher inspects existing bytes first; it may
repair cache metadata with a byte-identical PUT, but it refuses a path whose
bytes differ. This reduces repeated two-megabyte fetch/revalidation cost across
dedicated Scenario Workers without adding a production compiler, changing a
model ID, or weakening the exact manifest check performed after import.
`npm run benchmark:model:execution-plan-binding` supplies a local diagnostic:
it compares repeated Scenario allocation using one privately owned descriptor
and kernel catalog against the former repeated ownership path while keeping
the same bound-plan typed allocation in both arms. It is evidence, not a
machine-independent CI budget; physical-device initialization timing remains
the product gate.

## Current completion boundary

Standard-59 completes the one-patch direct cutover: generated descriptor
parity, exact-artifact embedding, exact kernel-set binding, private Scenario
allocation, accepted-authority state binding, Newton/LU workspace ownership,
solve-block and residual dispatch, hydraulic topology binding, integer update
scheduling, checkpoint continuation, physical-device execution, registration,
and activation.

The remaining hand-written declarations are retained only where a standalone
scientific tool or replacement oracle still imports them. They must be moved
behind explicit test/tool boundaries before deletion; production does not
silently fall back to them inside Standard-59.

## Future model development

Oxygen delivery/balance, autonomic reflexes, multipatch myocardium, AV-plane
displacement, and alternate congenital topologies will be added later as
scientific model changes. This compiler does not invent those equations.
Instead, it gives them stable component/state/path declarations and lets a
numerical policy place fast hydraulics, slower transport, controllers, and
mechanics into explicit update and solve groups. A future multirate policy is
therefore a policy/compiler change backed by convergence tests, not another
ad-hoc rewrite of the runtime layout.

Land remains a specialized component kernel. The compiler schedules and binds
it; it does not expand Land equations into a generic expression interpreter.
Likewise, the initial compiler does not generate residual or Jacobian source.
Component-owned analytic kernels remain authoritative while the descriptor
first removes topology, indexing, allocation, and orchestration duplication.
