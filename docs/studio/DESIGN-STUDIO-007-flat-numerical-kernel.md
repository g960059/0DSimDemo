# DESIGN-STUDIO-007: Flat numerical kernel and mobile performance

Status: binding direct-cutover plan

This document owns the next numerical-runtime boundary for Workbench and
Article simulation. It complements DESIGN-STUDIO-005, which remains the
presentation contract. It does not relax accepted-step, Snapshot, or model
identity semantics.

## Decision

CircleHeart will not treat the current object-oriented TypeScript kernel plus
frame-per-step adapter as the final runtime architecture. The product has no
external users or compatibility obligation, so the next kernel is a direct
cutover:

- one new exact `modelId`;
- no dual write, legacy checkpoint decoder, or runtime fallback;
- the current kernel retained only as a scientific test oracle until the new
  kernel passes the replacement gates;
- one production numerical profile on every device. Device tiers may change
  visual cadence and background concurrency, never equations, accepted step
  size, solver tolerance, or scientific outputs.

The target is a Worker-owned flat numerical kernel with an integer clock,
typed state and scratch buffers, a coupled residual/Jacobian solve, and a
model-owned typed presentation page. WASM, SIMD, and multirate integration are
later implementation choices, not the architecture itself.

## Evidence motivating the cutover

An iPhone 16 Pro Max report from the active Standard kernel measured one live
Scenario with no active background Worker:

- `16` exact steps per request (`32 ms` of model time);
- mean Worker round trip `40.86 ms`, p95 `53 ms`;
- mean model-time ratio `0.775`;
- model/wall lag p95 `248 ms` and repeated `250 ms` re-anchors;
- presentation materialization, store append, and Canvas paint individually
  below about `1 ms` on average.

The arithmetic is decisive: `32 / 40.86 = 0.783`, which nearly equals the
reported model-time ratio. The main thread and Canvas are not the limiting
resource. The exact Worker kernel is chronically slower than real time on this
device.

Accepted-step counters further locate the work. A representative settled run
averages roughly three outer circulation candidates, four coronary Newton
iterations, ten hydraulic residual evaluations, three mechanics evaluations,
and fifteen implicit-sensitivity linear solves per accepted step. Reducing
clone and projection overhead is useful for future output growth but cannot,
by itself, remove this numerical workload.

The desktop CDP `Emulation.setCPUThrottlingRate` benchmark is not a phone
kernel gate. Dedicated Workers are not reliably slowed by that page-level
emulation. A mobile viewport under page throttling may therefore pass while
the physical phone cannot run the Worker in real time.

## Immediate Standard ABI

The pre-release Standard ABI requires a model-owned
`advancePresentationBatch` operation. There is no one-step compatibility
fallback. For each batch the exact adapter:

1. advances every accepted numerical step in order;
2. writes accepted revision and time directly to typed arrays;
3. projects only the authored scalar outputs into a packed numeric matrix;
4. emits one complete terminal frame for control, capture, latest-value, and
   authoring correlation.

The Worker validates the complete terminal frame and the packed clocks,
dimensions, state codes, scalar values, monotonicity, and terminal-row
correlation before it transfers ownership. Invalid output selection is checked
before numerical advance. Scientific operations continue to use complete
exact frames and checkpoints.

This boundary prevents presentation cost from growing with every future O2,
autonomic, or multipatch observable. It is also the transport boundary the
flat kernel will implement, so the work is not discarded at cutover.

Opt-in device reports split one Worker request into:

- `worker.presentation-advance`: numerical advance plus model-owned selected
  output projection;
- `worker.presentation-prepare`: Worker-side validation and response packing;
- existing round-trip, store, and Canvas metrics.

That split must remain available through the flat-kernel migration. It tells
us whether a regression belongs to equations/solver, Worker preparation,
structured clone, or presentation.

## Target kernel layout

### Clock

Accepted time is owned as an integer tick. Seconds are derived only at API and
presentation boundaries. A tick cannot accumulate floating-point drift or be
rebased by a visual scheduler.

### State

Continuous numerical state is stored in indexed `Float64Array` regions.
Discrete modes, flags, and bounded ordinals use explicit integer regions. The
layout manifest gives every slot a stable semantic name for tests and
checkpoint tooling, but hot loops address numeric slots rather than object
paths.

The kernel owns:

- accepted/current state;
- candidate/next state;
- reusable residual, Jacobian, factorization, and line-search scratch;
- event and beat accumulators;
- primitive output slots.

The current and candidate buffers are swapped only after a completely
accepted transaction. A failed candidate cannot mutate accepted state.

### Worker command boundary

One persistent Compute Worker owns a Scenario. The hot command is conceptually:

```text
advanceTo(targetTick, outputPlan, destinationPage)
```

It performs a batch without creating complete frame objects per step. The
result is a transferable typed sample page plus one terminal correlation
record. Snapshot and analysis commands share the same Worker-owned state, but
they never infer scientific values from decimated presentation samples.

### Checkpoint

The replacement kernel defines one canonical binary checkpoint codec. It
contains the exact slot layout version, integer clock, continuous/discrete
state, event state, beat accumulators, and fixture identity required for exact
continuation. Canonical encode/decode, byte stability, restore continuation,
and rejection of non-canonical input are release gates.

JSON remains appropriate for portable Studio content and manifests. It is not
the internal numerical state representation.

## Solver sequence

Implementation order is fixed because later steps depend on earlier evidence.

### Phase 0 — freeze the scientific oracle

Before changing solver organization, record fixtures and accepted trajectories
covering normal circulation, volume extremes, resistance/contractility/PEEP
controls, valve events, coronary behavior, PV analysis starts, and Snapshot
continuation. Freeze exact or explicitly justified tolerance comparisons for:

- accepted clocks and event order;
- conserved total blood volume and other invariants;
- pressure, volume, flow, coronary, and beat-metric trajectories;
- PV morphology and analysis outputs;
- failure atomicity and checkpoint continuation.

### Phase 1 — flat scalar reference kernel

Implement one Scenario and one patch with the same equations, step size, solver
order, and tolerances as the current kernel. Change layout, ownership, and ABI
only. The purpose is to prove that the typed boundary and flat state preserve
science before changing nonlinear algebra.

### Phase 2 — one coupled nonlinear solve

Express circulation, chamber mechanics, coronary hydraulics, and implicit
dependencies as one residual system with one generated or automatic-
differentiation Jacobian. Reuse one factorization for multiple right-hand
sides, and exploit the block structure with a Schur or equivalent sparse solve.

This is the primary computational intervention. It is intended to remove the
repeated outer candidate work and repeated sensitivity solves, not merely make
the existing nested loops marginally faster.

### Phase 3 — strict scalar WASM

Port the proven flat scalar kernel to a strict `f64` WASM implementation if
physical-device measurement demonstrates a benefit. A direct WASM translation
of the current object graph is explicitly rejected: it would preserve the
wrong allocation and solver structure.

WASM threads and `SharedArrayBuffer` are optional. They require a measured win
on iOS and must not become a deployment prerequisite.

### Phase 4 — multipatch layout and SIMD

Add multipatch myocardium using a structure-of-arrays layout with stable patch
indices. Scalar `f64` remains the scientific reference. SIMD is admitted only
after scalar parity and only where lane ordering does not alter accepted
semantics.

### Phase 5 — autonomic, O2, and multirate domains

Autonomic reflexes and oxygen delivery are added as explicit state owners with
declared coupling boundaries. Slower physiology may use multirate integration
only after comparison with a sufficiently small-step single-rate reference.
Multirate integration is a scientific-model change, not a presentation
performance switch, and therefore receives a new exact release and dedicated
validation.

## Gates

The flat kernel cannot replace the current exact release until all scientific
oracle tests pass and a physical-device report is attached to the release.

For the one-Scenario iPhone 16 Pro Max baseline, the initial performance goals
are:

- Worker numerical advance p95 at or below `20 ms` per `32 ms` model batch;
- complete Worker round trip p95 at or below `24 ms`;
- model-time ratio p05 at or above `1.25` after warm-up;
- model/wall lag p95 below `50 ms` with zero overload re-anchors in a
  representative one-minute run;
- no unbounded thermal decay over that run.

These are release targets, not permission to distort time. If a supported
device still cannot maintain real time, the UI must show the actual playback
rate. It must not repeatedly discard elapsed wall time behind a nominal
`Live` label.

Additional gates cover two and four Scenarios, Article peek, control changes,
background analysis contention, memory growth, and restore/capture. Device
tier policy may reduce background concurrency, live Scenario count, visual
sample cadence, or pixel density; it may not choose a different numerical
kernel profile.

## Rejected alternatives

- Increasing the exact `dt` only on phones: changes the scientific model.
- Interpolating skipped states: creates values the solver never accepted.
- Treating Canvas FPS as the primary issue: contradicted by device timings.
- Porting the current architecture directly to WASM: preserves the dominant
  nested solve and allocation structure.
- Starting with multirate integration: couples a scientific change to an
  unproven performance hypothesis.
- Maintaining old checkpoints or a dual runtime: no users require it, and the
  compatibility layer would constrain the new state layout before it exists.

## Completion

This design is complete when the flat kernel is the sole registered active
model implementation, the current TypeScript kernel is no longer reachable in
production, and the physical-device plus scientific gates are committed as
release evidence. At that point transitional typed-batch adapters may be
deleted rather than retained as a second architecture.
