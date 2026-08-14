# DESIGN-STUDIO-009: Model definition and execution-plan compiler

Status: binding shadow-runtime plan

This document owns the declarative model-definition and ahead-of-time
execution-plan boundary. DESIGN-STUDIO-007 continues to own numerical
authority, solver gates, typed accepted state, and mobile performance.

## Decision

CircleHeart will separate three things that are currently interleaved in
hand-written TypeScript:

1. `ModelDefinitionV1` declares scientific components, state ownership,
   hydraulic nodes and paths, and conservation pools.
2. `NumericalPolicyV1` declares integration order, solve groups, retained and
   statically-condensed unknowns, and solver/storage policy.
3. `ExecutionPlanDescriptorV1` is deterministic plain data produced from the
   first two inputs. It assigns state slots, graph indices, solve blocks,
   incidence endpoints, and scratch dimensions.

The browser does **not** compile a model. Compilation runs in repository and
release tooling. After cutover, the descriptor is bundled in the existing
exact model artifact and the Worker performs only bounded validation, buffer
allocation, and executable-kernel binding. There is no second network fetch
for the plan and no cold browser compilation penalty.

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
- lower hydraulic paths to upstream/downstream node indices and kernel IDs;
- lower solve blocks to contiguous unknown ranges and state-slot indices;
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
- fixed-step `2 ms` backward Euler, Armijo Newton, and dense row-major LU as
  the current policy—not as permanent scientific structure.

`npm --silent run compile:model:execution-plan` emits the canonical JSON
descriptor to stdout. `--write` updates the checked-in generated descriptor
that release tooling verifies byte-semantically against a fresh compilation.
Tests require exact parity with the existing hard-coded layout,
declaration-order determinism, fail-closed invalid inputs, and a synthetic
VC-to-LA bypass path that leaves state and solve numbering unchanged. The
synthetic path is a compiler test only; it does not add a Fontan or congenital
circulation claim to the model.

## Bound shadow slice

Standard-35 is the first exact release to advertise
`runtime/execution-plan-descriptor-v1`. Its existing exact artifact contains
the generated descriptor and a small binder; it does not contain
`ModelDefinitionV1`, `NumericalPolicyV1`, or the compiler. Historical exact
artifacts without the capability continue to load through their immutable
legacy executable contract.

At Worker initialization, the binder:

- validates and owns the portable descriptor without invoking accessors;
- requires an exact set of admitted component- and path-kernel IDs;
- resolves those IDs to compact ordinals;
- allocates nonaliasing current/candidate state, graph-index, and solver
  workspace typed arrays once; and
- rejects a malformed or aliased result before numerical session creation.

These bindings are currently symbolic owner bindings rather than generic
executable function pointers. The bound plan is retained Worker-locally but
does not advance the numerical model. Standard-35 therefore remains
behavior-neutral: the existing typed-authority session is still the sole
execution and checkpoint authority.

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
number for Standard-35. It includes bounded descriptor validation, exact
binding, and typed allocation. This prevents a placeholder zero from being
mistaken for evidence. Before direct execution cutover, physical iPhone
measurements must show that binding is bounded and that time-to-first-frame has
not materially regressed.

## Cutover sequence

1. Add exact descriptor parity for every current generated layout that will
   become runtime-owned. **Complete for the current one-patch slice.**
2. Embed the descriptor in the exact executable without another fetch or a
   production compiler. **Complete in Standard-35.**
3. Bind known kernel IDs, allocate buffers once, and reject missing, extra, or
   aliased bindings. **Complete as a nonexecuting Worker shadow in
   Standard-35.**
4. Execute the bound plan in shadow against the current authority, including
   checkpoint continuation and the canonical scientific corpus.
5. Mint a new model release for the direct runtime cutover. Do not dual-write
   state or retain a fallback inside that release.
6. Delete the replaced hand-written layout tables only after production
   authority and physical-device gates pass.

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
