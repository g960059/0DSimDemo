# DESIGN-STUDIO-007: Flat numerical kernel and mobile performance

Status: binding direct-cutover plan

This document owns the next numerical-runtime boundary for Workbench and
Article simulation. It complements DESIGN-STUDIO-005, which remains the
presentation contract. It does not relax accepted-step, Snapshot, or model
identity semantics.

## Decision

CircleHeart will not treat the current object-oriented TypeScript kernel plus
frame-per-step adapter as the final runtime architecture. The product has no
external user-authored content, so the active model and all newly sealed
content can cut over directly. Published official Snapshots are nevertheless
immutable durability obligations until their placements are re-sealed and the
unreferenced originals complete retention/GC:

- one new exact `modelId`;
- no dual write, legacy checkpoint decoder, or runtime fallback inside the new
  exact release;
- referenced historical exact artifacts remain isolated and loadable by their
  original manifest/codec rather than being interpreted by the new kernel;
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

A second iPhone 16 Pro Max report after the packed Standard ABI isolated the
same bottleneck more sharply. Numerical `presentation-advance` averaged
`42.20 ms` (p95 `52 ms`) for `32 ms` of model time, while Worker preparation
averaged only `0.10 ms`. Round trip averaged `42.99 ms`, model-time ratio
averaged `0.731`, lag p95 remained `248 ms`, and the scheduler re-anchored 25
times in about 25 seconds. The selected six-output page was only `1,120`
bytes. Transport, validation, projection, Canvas, and storage are therefore
not credible explanations for the remaining deficit.

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
`advancePresentationBatch` operation. New active releases must advertise
`runtime/exact-presentation-batch-v1`; the loader then requires the operation
and never falls back. A bounded reader for immutable pre-extension artifacts
exists solely because already-published Article Snapshots pin their exact
model bytes. It is not a vNext design seam and must be deleted after those
placements are re-sealed on the new kernel and the unreferenced originals have
completed retention/GC. For each batch the exact adapter:

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

#### Phase 1a — reference bridge (implemented, not release-ready)

The first vertical slice deliberately keeps `MainWireIntegratedModelSessionV3`
as the scientific oracle. Around it, the new reference bridge establishes:

- an integer presentation tick as its external clock;
- deterministic semantic slot discovery for fixed-topology numerical state;
- current/candidate flat buffers swapped only after a successful oracle step;
- one caller-owned `ArrayBuffer` containing tick, revision, output-state, and
  scalar-output views;
- an exact-key Worker command/result seam that transfers that one buffer in
  and out without duplicate-buffer transfer lists;
- phase telemetry separating oracle advance, flat mirror write, and output
  projection.

The 1,024-tick parity gate crosses multiple rhythm boundaries and the first
completed-beat metric transition, compares every registered output at every
tick, and compares the terminal fixed-topology flat mirror against an
independent oracle Session. Invalid output-plan/page input is rejected before
numerical advance. The current reference layout contains
440 `f64` leaves, four boolean leaves, 205 string leaves, and reports 45
nullable or variable-array roots that still require explicit tagged/bounded
storage. A representative 576-tick process accumulated 695 distinct string
values, confirming that transaction/owner labels cannot remain an interning
Map in the authoritative hot state.

A local 512-step diagnostic measured about `2.27 ms/step` for the oracle path
and `2.42 ms/step` for the reference bridge (about 1.065x total). Mirror writes
accounted for about `66.8 ms` over all 512 steps and selected-output projection
about `1.0 ms`. These values are diagnostic, machine-specific, and not a
performance gate. They show that the fixed typed portion is structurally
bounded and, more importantly, that the bridge does not conceal the dominant
solver cost. The typed presentation page and the fixed numeric/boolean buffers
are bounded; the Phase 1a bridge as a whole is deliberately **not** bounded
because its
provisional string interning table grows with transaction/owner labels and is
cloned during mirror writes. Phase 1b must replace those hot strings with
bounded model-owned codes before this path can become authoritative.

Phase 1a does **not** mint a model release, define the binary checkpoint, make
flat arrays the solver authority, or claim the phone target. Ordinary arrays
and nullable subtrees are reported but excluded from this provisional mirror;
the active object Session still owns them. An unexpected mirror/projection
failure after an oracle step poisons the bridge and forbids continuation; it
does not pretend to roll the oracle back. This avoids pretending that a
generic object flattener is the final model schema or production transaction
authority.

#### Phase 1b.1 — canonical accepted-state authority (implemented proof)

The second reference slice moves ownership beyond a lossy fixed-leaf mirror.
This proof slice encoded every accepted boundary, including the 45
nullable/variable-array roots, into one canonical binary value inside two
fixed-capacity buffers. A candidate became current only after encode, decode,
model-owned live-state rehydration, and full accepted-state validation all
succeeded. The buffers swapped only after that complete proof. A failed
candidate left the accepted bytes unchanged, poisoned the authority, and
forbade continuation.

This slice establishes:

- two lifetime-fixed `512 KiB` state buffers, with current length and high-water
  telemetry rather than a growing string-interning map;
- deterministic tags for finite numbers, booleans, strings, dense arrays,
  plain records, null-prototype records, and numeric typed arrays;
- sorted record keys, big-endian numeric encoding, strict UTF-8, exact-length
  decode, accessor/cycle/prototype rejection, and bounded depth/item counts;
- a portable checkpoint envelope containing canonical payload bytes, explicit
  magic and length, and SHA-256 integrity;
- exact Standard checkpoint continuation, including partial-beat accumulation
  and the most recently completed beat;
- detached public observations, so mutation of an escaped typed-array view
  cannot change the bytes consumed by the next numerical step;
- an isolated reference Session that owns the accepted transaction loop; the
  registered V3 Session and every released exact artifact remain byte-identical.

Serialized MCS state is not accepted merely because its fields have the right
shape. Decode rebuilds the live MCS owner from the current runtime binding and
then re-wraps the integrated state, matching the fail-closed provenance rule
used by exact checkpoint restore. Scientific parity covers 1,024 presentation
ticks and all 49 registered outputs at every tick. A second gate captures at a
non-round 377th tick, restores the canonical bytes, and proves exact
continuation through tick 544. Repeated capture of the same state is byte
stable and one-bit payload/header tampering is rejected.

This implementation is deliberately not a speedup. A local 512-tick
alternating diagnostic measured about `2.47 ms/tick` for the released object
authority and `5.45 ms/tick` for canonical encode/decode ownership, an overhead
ratio of about `2.21x`. The terminal encoded state was about `33 KiB` and its
observed high-water mark about `33.6 KiB`, both inside the fixed `512 KiB`
capacity. These numbers are machine-specific diagnostics, not gates. They show
that binary ownership is bounded and scientifically exact, while also
falsifying the idea that a generic per-step object serializer is the final hot
kernel.

Phase 1b.1 remains non-production and has now been superseded as the reference
hot accepted boundary by Phase 1b.2b.1 below. Its canonical codec remains the
checkpoint/integrity basis and an independent proof oracle. It is not
permission to serialize the full object graph in the final inner loop.

#### Phase 1b.2a — fixed scalar slots (implemented reference)

The next reference slice freezes the scalar index space before changing solver
code. The Standard cold accepted shape deterministically admits a versioned
manifest with fingerprint `fnv1a32-8c218aa1`: 440 finite `f64` slots and four
boolean slots. Two lifetime-fixed typed buffer sets provide inactive-candidate
staging and an infallible accepted swap. Staging writes no temporary arrays and
cannot change the current slots; if full accepted-state ownership rejects the
candidate, the staged scalar buffer is aborted rather than promoted.
The fingerprint also binds all 158 fixed container shapes, including their
kind, prototype class, and ordered own-key set.

The manifest intentionally reports what it does **not** yet own: 45 nullable or
variable-array roots and 205 string leaves. It does not intern those strings,
assign provisional indices to optional values, or pretend that the scalar
mirror is a complete checkpoint. A changed fixed path/count/fingerprint fails
closed and requires a new model-owned layout version.

The scalar staging gate runs beside the complete typed-state authority for
1,024 ticks, stays commit-count aligned across every accepted substep, and
remains detached from public snapshots. A local 512-tick diagnostic measured
roughly `0.05–0.07 ms/tick` for fixed scalar staging alone. This is useful
evidence that direct fixed-slot writes are not the phone bottleneck, but it is
not a product speedup: the reference Session still pays for the existing
object solver and an object boundary adapter.

#### Phase 1b.2b.1 — transactional typed image and cold bindings (implemented reference)

The complete accepted topology is now represented by two lifetime-fixed,
model-owned `ArrayBuffer` images plus manifest-owned immutable configuration
bindings. Each mutable image is exactly `34,988` bytes and contains:

- 253 ordinary `f64` slots, six nullable-`f64` value/presence pairs, and two
  boolean slots at versioned fixed offsets;
- six required and two nullable string offset/length entries backed by a fixed
  `16 KiB` UTF-8 arena;
- nine dynamic-root offset/length pairs backed by a separate fixed `16 KiB`
  canonical arena; and
- the 80-container mutable shape contract and fingerprint
  `fnv1a32-99df72aa`.

Twelve deeply frozen model-owned object roots are intentionally retained
outside the hot images: the composed-rhythm configuration (`5,506` canonical
bytes), nine duplicated rhythm-owner configurations/seeds, the MCS inertance
profile (`2,501` bytes), and the MCS structural projection (`4,265` bytes).
Forty-four immutable schema, owner, binding, and topology strings are also
manifest constants rather than per-tick UTF-8 data. These values are
configuration, not evolving accepted state. Exact paths are fingerprinted.
Manifest creation proves transitive freezing for object data and stores a
private canonical reference; hot admission accepts the same object identity or
scalar value, while checkpoint restoration may take a canonical-equality
fallback. Rehydration reattaches the admitted values without rebuilding them.

Dynamic roots are explicit cut points rather than an escape from bounded
ownership. The five two-component exact-event calcium states are declared as
fixed model arrays, so all ten components receive direct `f64` slots. Six
optional owner clocks use explicit presence bytes plus `f64` values, and two
optional activation identifiers use nullable UTF-8 entries, instead of
canonical payloads. The remaining nine roots comprise three bounded rhythm
queues, optional rhythm records, and one autoregulation control record. Strings
are rewritten inside the inactive arena each transaction; no
lifetime interning table survives. Inspection still identifies the
high-cardinality mechanics fingerprint as a recomputable diagnostic and the
remaining activation labels as candidates for bounded model-owned codes in the
direct kernel.

Staging first validates the complete mutable fixed container topology and the
cold-root identity/canonical bindings, then writes only the inactive image.
Invalid finite values, changed keys/prototypes,
unpaired UTF-16, malformed dynamic data, or either arena exceeding capacity
fail before promotion. Promotion is an infallible active-index swap. Public
snapshots are detached copies. Tests cover null-to-record and empty-to-one-item
queue transitions, adversarial extra keys, malformed strings, capacity
exhaustion, typed-array escape mutation, 1,024 presentation ticks across all
49 outputs, and exact checkpoint continuation from tick 377 through 544.

The reference transaction now feeds the next solver step from a model-owned
rehydration of the promoted typed image, rather than from the object candidate
returned directly by the preceding solve. This makes the complete typed image
the accepted-state authority, while leaving the registered exact Session and
artifacts unchanged.

This is still not a production speedup. The latest representative 512-tick
alternating diagnostic measured about `2.39 ms/tick` for the released object
Session and `3.40 ms/tick` for the typed-authority reference (`1.42x`). Across
580 accepted commits, all 32,536 immutable-value checks used the identity/value
fast path and none used canonical fallback. An intentionally
independent-runtime projection diagnostic, whose equal object configurations
do not share identity, measured about `0.63 ms/presentation tick`; rehydration
measured about `0.033 ms/presentation tick`. String and dynamic high-water
usage were `578` and `3,683` bytes respectively, inside their fixed `16 KiB`
capacities. The remaining overhead is dominated by rebuilding and fully
revalidating the legacy object owner graph, not by the typed page itself. These
figures are machine-specific diagnostics, not gates.

#### Phase 1b.2b.2a — authoritative boundary cursor (implemented reference)

The active typed image now exposes a read-only live cursor rather than an
`ArrayBuffer` or typed-array view. The cursor follows the atomic active-index
swap and permits generated slot reads only; it cannot mutate either image.
The Main Wire binding admits that cursor only when its layout ID and complete
manifest fingerprint match `fnv1a32-99df72aa`. Every hot slot is resolved by
semantic pointer once from that manifest; numerical indices are not duplicated
as hand-maintained source constants. The accepted loop performs no pointer or
string lookup after construction.

The reference Session now reads the outer accepted clock and revision from
fixed slots and computes its next coronary/rhythm boundary from the active
typed image. The direct limiter uses manifest-bound indices for owner clocks, the
autoregulation window, regular atrial activation, and ventricular backup. It
decodes only the four bounded dynamic roots that can contribute an event
boundary: authored ventricular pacing, proximal AV output, distal ventricular
impulse, and calcium-deposit queues. Authored ectopy events come from the
already admitted immutable rhythm configuration. It also proves that
the outer, composed-rhythm, and coronary clocks/revisions agree before every
scheduling decision. Immutable atrial-source mode and exact-calcium parameters
come from the separately admitted cold rhythm configuration rather than being
duplicated in hot state slots.

The typed limiter is compared field-for-field with the admitted object limiter
over 96 evolving presentation boundaries. The complete 1,024-tick/all-output
oracle and exact checkpoint-continuation gates remain unchanged. The injected
test authority deliberately falls back to the original object limiter, so
authority-failure tests do not gain an accidental typed precondition.

This slice moves scheduling authority, not the nonlinear solve. The inactive
typed candidate now owns the six synchronized outer/composed/coronary clock
slots as well as the ten calcium state slots before the legacy object
transaction runs. The object transaction still regenerates and validates its
own boundary internally, but admission requires its clock and calcium result to
match the already-staged typed values bit-for-bit and cannot overwrite them.
A representative 512-tick diagnostic measured about `2.39 ms/tick` for the
released Session and `3.40 ms/tick` for the typed reference (`1.42x`). Direct
fixed-slot boundary selection measured about `0.0065 ms/tick`, while copying
current into the inactive image and staging all five calcium owners measured
about `0.0061 ms/tick`. The improvement comes from removing immutable
configuration traversal from each accepted transaction; duplicate legacy solve
and mutable-owner work remains. These figures are diagnostics, not performance
gates.

The generic image also admits a generation-bound candidate cursor. Beginning a
candidate copies current bytes once into the inactive image; direct fixed
`f64`/boolean writes then allocate no state object and cannot touch active
storage. Abort, promotion, or a later candidate generation permanently
invalidates the old cursor. Strings and dynamic roots remain copied and
read-only at this stage; their writers require explicit bounded tagged layouts
rather than an implicit variable arena mutation API.

Exact-event calcium is the first state owner to use that write surface. Its ten
fixed state slots advance directly from the active image into the inactive
candidate using the existing exact two-decay event law and only deposits due
at the accepted candidate boundary. Across 96 evolving boundaries, including
electrical/calcium events, both the fixed-slot calcium readback and candidate
state match the existing composed-rhythm owner exactly. On the default
reference path these ten calcium values and six clock values are retained
through complete candidate admission; the temporary object adapter must match
them bit-exactly and cannot overwrite them. Every accepted substep in the
1,024-tick oracle therefore promotes both clock and calcium state from the typed
candidate. The complete composed-rhythm transaction still owns queue scheduling
and electrical capture; this slice does not claim that rhythm is flat yet.

The non-production Worker vertical slice now creates the typed-authority
Session by default. Its older Phase 1a lifetime string table and per-tick full
flat mirror have been removed from the execution loop; a legacy-shaped flat
snapshot is projected only when a diagnostic explicitly requests it. In a
512-tick/6-output diagnostic, the released Session measured about
`2.37 ms/tick`, the complete typed-authority Worker reference about
`3.59 ms/tick`, and output-page projection only about `1.35 ms` in total across
all 512 ticks. This isolates the remaining cost in the legacy object
transaction and typed admission—not Canvas, output selection, transfer, or the
retired mirror.

#### Phase 1b.2b.2b — direct solver-owned typed state (next)

Before production cutover, move each state owner and the solver from object
property access to generated typed offsets/tags. Replace hot
transaction/fingerprint strings with bounded codes or recomputable
diagnostics. Rehydration and complete graph validation then occur only at cold
start, checkpoint restore, diagnostics, or an explicit boundary adapter—not
once per accepted substep. The object Session becomes test-oracle code only.
Failure atomicity, event order, beat accumulation, controls, analysis forks,
and checkpoint continuation must pass against the Phase 0 corpus before Phase
2 changes solver algebra.

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
- Teaching the new kernel to decode old checkpoints or running both kernels for
  one active Scenario: no user-authored data requires it, and that compatibility
  layer would constrain the new state layout before it exists. Exact historical
  artifacts remain readable only while immutable published content references
  them.

## Completion

This design is complete when the flat kernel is the sole registered active
model implementation, official placements have been re-sealed, unreferenced
historical Snapshots have completed retention/GC, the current TypeScript kernel
is no longer reachable in production, and the physical-device plus scientific
gates are committed as release evidence. At that point transitional
typed-batch adapters may be deleted rather than retained as a second
architecture.
