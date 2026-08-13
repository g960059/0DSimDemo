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

#### Retired prototype — scalar-only shadow image

An earlier Phase 1b prototype mirrored 440 scalar and four boolean leaves into
a second pair of typed buffers. It established fixed-index feasibility, but it
was not a complete authority and duplicated every scalar object-path traversal
after the complete image below existed. The prototype, its benchmark command,
and its Session shadow writes have therefore been removed. The complete typed
image is now the only typed transaction owner; the scientific oracle remains
the released object Session rather than a second partial state mirror.

#### Phase 1b.2b.1 — transactional typed image and cold bindings (implemented reference)

The complete accepted topology is now represented by two lifetime-fixed,
model-owned `ArrayBuffer` images plus manifest-owned immutable configuration
bindings. Each mutable image is exactly `22,360` bytes and contains:

- 484 ordinary `f64` slots, six nullable-`f64` value/presence pairs, and two
  boolean slots at versioned fixed offsets;
- 229 required and 22 nullable string offset/length entries backed by a fixed
  `16 KiB` UTF-8 arena;
- six optional fixed-shape records, each represented by one presence byte plus
  ordinary typed leaves;
- three bounded rhythm queues, each represented by one `u32` length plus 16
  fixed typed item slots;
- no dynamic-root metadata or dynamic arena; and
- the 163-container mutable shape contract and fingerprint
  `fnv1a32-44b16062`.

Twelve deeply frozen model-owned object roots are intentionally retained
outside the hot images: the composed-rhythm configuration (`5,506` canonical
bytes), nine duplicated rhythm-owner configurations/seeds, the MCS inertance
profile (`2,501` bytes), and the MCS structural projection (`4,265` bytes).
Forty-four immutable schema, owner, binding, and topology strings are also
manifest constants rather than per-tick UTF-8 data. One additional binding
aliases the optional authored-pacing owner's configuration to the admitted
composed-rhythm configuration, for 57 external-immutable layout entries in
total. These values are
configuration, not evolving accepted state. Exact paths are fingerprinted.
Manifest creation proves transitive freezing for object data and stores a
private canonical reference; hot admission accepts the same object identity or
scalar value, while checkpoint restoration may take a canonical-equality
fallback. Rehydration reattaches the admitted values without rebuilding them.

The five two-component exact-event calcium states are declared as
fixed model arrays, so all ten components receive direct `f64` slots. Six
optional owner clocks use explicit presence bytes plus `f64` values, and two
optional activation identifiers use nullable UTF-8 entries. The tagged-layout
rule covers six complete nullable records: the backup owner's latest
activation, its intrinsic and VVI attempt results, the coronary autoregulation
window control, ventricular interval-deposit metadata, and authored
ventricular pacing replay state. The three rhythm queues use explicit fixed
item layouts and length tags. The potentially 100,000-event pacing
configuration is not copied into either image: its nested owner field is
rehydrated as an exact alias of the already admitted immutable composed-rhythm
configuration, while its mutable clock, revision, cursor, and counters occupy
fixed slots. Strings are
rewritten inside the inactive arena each transaction; no
lifetime interning table survives. Inspection still identifies the
high-cardinality mechanics fingerprint as a recomputable diagnostic and the
remaining activation labels as candidates for bounded model-owned codes in the
direct kernel.

The queue capacity of 16 is a **Phase-reference admission bound**, not a
scientific maximum. The default 1,024-tick trace exercised all three queues and
observed a high-water length of one for each. That proves the normal reference
path fits the storage, but does not prove that an arbitrarily dense authored
protocol does. Production cutover therefore requires either a model-owned
capacity argument covering admitted authoring inputs or a different bounded
event-storage design. High-water length is reported per queue so the evidence
cannot be replaced by an implicit assumption.

Staging first validates the complete mutable fixed container topology and the
cold-root identity/canonical bindings, then writes only the inactive image.
Invalid finite values, changed keys/prototypes, mutable optional-record
templates, an authored-pacing configuration that differs from its admitted
alias, unpaired UTF-16, or the string arena exceeding capacity
fail before promotion. Promotion is an infallible active-index swap. Public
snapshots are detached copies. Tests cover generic presence-tagged
null-to-record transitions, immutable aliases, empty-to-one-item queue
transitions, adversarial extra keys, malformed strings, capacity
exhaustion, typed-array escape mutation, 1,024 presentation ticks across all
49 outputs, and exact checkpoint continuation from tick 377 through 544.

The reference transaction initially fed the next solver step from a
model-owned rehydration of every promoted typed image. Direct completion now
establishes a stronger fact before promotion: retained slots match the private
solver result bit-exactly, and every other admitted leaf is overwritten from
that same result. After its exact private accepted-boundary proof is checked,
that result can therefore remain as a non-authoritative solver mirror. The
complete typed image is still the accepted-state authority. Detached public
views, observations, checkpoints, restores, and explicit cold audits rehydrate
from it; an escaped typed array cannot mutate the active image.

This is still not a production speedup. After allowing a restored, rehydrated,
transitively frozen composed-rhythm state to retain its complete boundary proof,
the latest representative 512-tick alternating diagnostic measured about
`1.45 ms/tick` for the released object Session and `2.13 ms/tick` for the
typed-authority reference (`1.47x`). The same diagnostic was about
`3.42 ms/tick` before that migration-layer revalidation was removed. Across 580
accepted commits, all 32,536 immutable-value checks used the identity/value fast
path and none used canonical fallback. An outer-frozen state with a mutable
calcium descendant remains ineligible for the proof and is revalidated after
mutation. An intentionally
independent-runtime projection diagnostic, whose equal object configurations
do not share identity, measured about `0.68 ms/presentation tick`; rehydration
measured about `0.020 ms/presentation tick`. String high-water usage was
`1,930` bytes inside its fixed `16 KiB` capacity. Dynamic high-water usage and
capacity are both zero: every currently admitted mutable root has explicit
typed storage. The remaining overhead at that point was dominated by rebuilding
and fully revalidating the legacy object owner graph, not by the typed page
itself. The later exact-mirror change below removes that work per accepted
substep. These figures are machine-specific diagnostics, not gates.

#### Phase 1b.2b.2a — authoritative boundary cursor (implemented reference)

The active typed image now exposes a read-only live cursor rather than an
`ArrayBuffer` or typed-array view. The cursor follows the atomic active-index
swap and permits generated slot reads only; it cannot mutate either image.
The Main Wire binding admits that cursor only when its layout ID and complete
manifest fingerprint match `fnv1a32-44b16062`. Every hot slot is resolved by
semantic pointer once from that manifest; numerical indices are not duplicated
as hand-maintained source constants. The accepted loop performs no pointer or
string lookup after construction.

The reference Session now reads the outer accepted clock and revision from
fixed slots and computes its next coronary/rhythm boundary from the active
typed image. The direct limiter uses manifest-bound indices for owner clocks, the
autoregulation window, regular atrial activation, and ventricular backup. It
reads proximal AV output, distal ventricular impulse, and calcium-deposit
queues from their fixed typed slots and length tags. Authored ventricular
pacing and ectopy events both come from the already admitted immutable rhythm
configuration; their mutable cursors come from fixed typed slots. It also proves that
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
slots, the ten calcium state slots, and the four mutable authored-ectopy
schedule slots before the legacy object transaction runs. A configured
authored-ventricular-pacing replay adds the same four-slot
`acceptedTimeSec / revision / cursor / emitted-count` state. Both schedule
writers binary-search their admitted immutable event lists and advance only
these fixed counters; they do not clone events or construct impulses. After
electrical capture resolves any PAC reset/preserve policy, the same candidate
also advances all seven mutable regular-atrial clock/counter slots by its pure
owner law. It therefore derives the post-capture state rather than copying it
from the object candidate. The object transaction still regenerates and
validates its own boundary internally, but admission requires its clock,
calcium, authored-schedule, and regular-atrial result to match the already
staged typed values bit-for-bit and cannot overwrite them. Once the coupled
solve succeeds, seven additional values are emitted from its accepted result
into fixed slots before promotion: the three composed-rhythm capture/deposit
counters and the accepted flow of each of the four rotary support devices.
This post-solver emission does not recompute capture or hydraulics. It verifies
the rhythm lineage and counter deltas, preserves signed reverse pump flow, and
copies the exact accepted solver result so that the next step need not recover
those values through object re-encoding.
A representative 512-tick diagnostic after proof reuse measured about
`1.45 ms/tick` for the released Session and `2.13 ms/tick` for the typed
reference (`1.47x`). Direct fixed-slot boundary validation measured about
`0.0058 ms/tick`; rehydration measured about `0.020 ms/tick`. Copying current
into the inactive image and completing the still-object-backed writable slots
remains the largest migration-layer cost at about `0.68 ms/tick`. The earlier
`3.42 ms/tick` typed measurement additionally paid for full composed-rhythm
canonical revalidation after every rehydration. Duplicate legacy solve and
object-to-image completion remain; these figures are diagnostics, not
performance gates.

The first direct-solver migration aid is a session-owned coronary
backward-Euler scratch workspace. It is neither accepted state nor checkpoint
content: an opaque handle borrows private mutable arrays exclusively for one
solve, resets a bounded residual-buffer cursor, and releases in `finally`.
Only frozen copied trial data can leave the solve. Foreign handles, concurrent
reuse, and a different node/edge order fail closed. Twelve evolving pressure
boundaries are required to match the allocation-owning solver bit-for-bit, and
previously returned trials must remain unchanged after later workspace reuse.
A later local 2,048-tick coronary-only diagnostic, after adding reusable
Jacobian, LU, and implicit-sensitivity right-hand-side storage, measured
`0.054–0.055 ms/tick` with the workspace versus about `0.061 ms/tick`
without it (`0.88–0.90x`). Three paired full lean-tier reference runs moved
from `2.17–2.23 ms/tick` without this Session resource to
`2.15–2.18 ms/tick` with it. This is an allocation-control foundation for
solver-owned typed state, not a claimed Workbench speedup; whole-transaction
timing remains dominated by repeated coupled Newton work.

The same reference audit found that lean-tier private constructors still used
the exported validation-stamp issuer, recursively re-walking graphs they had
just copied and frozen. Constructor-only issuers now retain exact identity and
context provenance directly for composed rhythm, coronary autoregulation, and
dynamic support; exported validators still require the complete independent
frozen/plain-data proof. The coronary V3-to-V2 private wrapper likewise retains
its already-validated V2 view without attempting an impossible generic proof
over mechanics typed arrays. Mutating a published mechanics typed array remains
detectable by its downstream material-state fingerprint validator. Three local
lean reference runs moved from `2.145–2.157 ms/tick` to
`2.101–2.119 ms/tick`. Stamp-disabled verification still bypasses every private
proof. These are development-host diagnostics, not phone qualification.

Direct candidate completion now consumes the private integrated-state proof
without issuing one. A proof hit requires the exact candidate plus the exact
frozen rhythm/profile/config identity triple; copied, restored, hand-built,
context-rebound, and stamp-disabled candidates still take the complete
validator. That exact admission executes synchronously before the image writes
any candidate byte and must preserve object identity. A successfully admitted
candidate can then skip the second generic container-shape traversal, while
the image still compares every retained leaf and writes every non-retained
leaf before promotion. Images without this model-owned admission callback and
all ordinary `stage` commits retain the complete generic shape validator. The
adapter retained after promotion is consequently only an exact solver mirror
of the typed authority, never a second writable authority. Public state and
checkpoint boundaries still rehydrate and validate the active image, including
a canonical byte comparison before checkpointing. The 1,024-tick/all-output
oracle, escaped-typed-array isolation, exact checkpoint continuation, and the
stamp-disabled complete-validation path remain unchanged. Three local lean
reference runs moved from `2.101–2.119 ms/tick` to
`1.862–1.883 ms/tick` (about `0.89x`). The authority report recorded one mirror
reuse for every one of 1,160 direct commits in each measured run. These are
development-host diagnostics, not phone qualification.

The generic image also admits a generation-bound candidate cursor. Beginning a
candidate copies current bytes once into the inactive image; direct fixed
`f64`/boolean writes then allocate no state object and cannot touch active
storage. Abort, promotion, or a later candidate generation permanently
invalidates the old cursor. Strings remain copied and read-only at this stage;
their writers require bounded model-owned codes or an explicit cold-boundary
operation rather than implicit variable mutation.

Exact-event calcium is the first state owner to use that write surface. Its ten
fixed state slots advance directly from the active image into the inactive
candidate using the existing exact two-decay event law and only deposits due
at the accepted candidate boundary. Across 96 evolving boundaries, including
electrical/calcium events, both the fixed-slot calcium readback and candidate
state match the existing composed-rhythm owner exactly. On the default
reference path these ten calcium values, six clock values, four
authored-ectopy schedule values, and seven regular-atrial source values are
retained through complete candidate admission. The three rhythm aggregate
counters and four rotary-device accepted flows are retained after solver
resolution as well; a pacing configuration retains its four schedule values
in addition.
The temporary object adapter must match every retained value bit-exactly and
cannot overwrite it. Every accepted substep in the 1,024-tick oracle therefore
promotes clock, calcium, authored finite-schedule, and regular-source state from
the typed candidate. A same-time captured PAC plus VVI replay regression
compares the reset regular clock and both typed schedule states with their
existing pure evaluators. The complete composed-rhythm transaction still owns
impulse construction, queue scheduling, and electrical capture; this slice
does not claim that rhythm is flat yet.

Retained and writable fixed-slot sets are compiled once into a manifest-bound
completion plan during Session initialization. A structural imitation is not
accepted: the generic image keeps the plan's manifest identity and slot sets in
private storage. Hot completion therefore performs the same bit-exact retained
checks and writes every unmigrated leaf, but does not allocate membership sets
or read already-checked retained paths a second time on each substep.

The non-production Worker vertical slice now creates the typed-authority
Session by default. Its older Phase 1a lifetime string table and per-tick full
flat mirror have been removed from the execution loop; a legacy-shaped flat
snapshot is projected only when a diagnostic explicitly requests it. Output
projection now runs synchronously against the exact private solver mirror and
returns only scalar output records plus observation-free advance metadata. The
accepted state cannot escape that seam; requesting a public observation later
rehydrates it from typed authority. Three local 512-tick/6-output lean-tier
diagnostics measured `1.410–1.426 ms/tick` for the released Session and
`1.539–1.581 ms/tick` for the complete typed-authority Worker reference
(`1.09–1.11x`). Output projection and packed-page writes together consumed only
about `1.03–1.23 ms` across all 512 ticks. This leaves roughly 9–11% reference
overhead while preserving the fixed image, transactional promotion, exact
output corpus, and detached diagnostic snapshot. The remaining cost is in the
legacy object transaction and typed completion—not Canvas, output selection,
transfer, or the retired mirror. These development-host figures are not phone
qualification.

The non-coronary outer Newton solve now has the same Session-owned allocation
boundary as the coronary solve. Its opaque workspace retains volume scales,
scaled and line-search unknowns, the analytic Jacobian, LU factor storage,
right-hand sides, and solutions. Every array is private to one synchronous
borrow, released in `finally`, dimension-checked, and overwritten before use.
Returned successful and failed trials remain frozen object values and never
alias the workspace; a later reuse is required not to change an earlier trial.
Foreign or concurrent handles fail closed. The equations, residual order,
pivot order, line-search order, tolerances, and checkpoint bytes are unchanged.
Together with removal of the duplicate generic shape walk after exact model
admission, three local 1,024-tick/all-49-output reference runs measured
`1.487–1.504 ms/tick` across five repetitions, versus approximately
`1.542–1.556 ms/tick` immediately before this slice. A CPU profile still
attributes the dominant
cost to repeated coupled candidate mechanics and non-coronary Newton work, not
presentation projection or typed-page transfer. These figures are development
diagnostics only and do not qualify an iPhone or a production cutover.

The five-wall material boundary now makes its two ownership claims explicit.
A trusted material kernel may read the prepared accepted wall state without a
second clone, and it may transfer a newly created result state only when it
promises exclusive ownership after return. Atrial reuse remains defensive: a
cache hit is still cloned into each whole-heart candidate, while cold and
ventricular results from the production kernel are exclusive and can be
retained. Mutation regressions cover both an atrial and a ventricular typed
state and prove that neither the accepted baseline nor a later candidate can
be changed through an escaped earlier candidate.

The coronary transaction now carries these exclusive whole-heart candidates as
private, unforgeable probes through the outer Newton solve. Model-owned coronary
coupling may inspect the live probe's typed readback, but discarded probes can
neither be committed nor exposed. Only the selected candidate is recursively
validated, snapshotted, fingerprinted, and sealed into the unchanged public
trial. A selected seal failure returns the existing accepted tuple with every
owner marked uncommitted. The regression requires more than one center
candidate while observing exactly three material encodes for the whole step:
accepted-state audit, selected seal, and commit audit. Across five local
1,024-tick/all-49-output lean-tier repetitions, the combined ownership and
selected-only-seal slice measured `1.411–1.427 ms/tick`, down from
`1.487–1.504 ms/tick` before the slice. It preserves the solver equation/order,
public checkpoint, and exact 49-output corpus; it remains a development-host
diagnostic rather than phone qualification.

Direct typed completion now also compiles one manifest-bound reader plan at
cold initialization. Only a candidate that has synchronously passed the
model-owned private accepted-boundary admission may use it. That path resolves
each admitted object leaf through its fixed segment list without restarting a
descriptor-checked walk from the root for every slot; optional-record and
bounded-array presence already staged in the inactive image determines whether
their leaf readers run. Generic `stage`, restore, external input, and completion
without the private model admission remain on the complete shape/accessor-safe
path. The authority report counts successful reader-plan uses and the
1,024-tick gate requires one use per direct commit. Three alternating 1,024-tick
local diagnostics measured `1.277–1.290 ms/tick` with this plan versus
`1.308–1.326 ms/tick` at the immediately preceding revision (roughly 2–4%
lower). The equations, solver order, typed image bytes, checkpoint, and all 49
outputs remain exact. These values are development-host diagnostics, not phone
qualification.

The reference bridge now has an exact all-rotary-support-off path as well.
Disabled LVAD, Impella, VA-ECMO, and VV-ECMO circuits still publish fresh
pressure-dependent diagnostic readback for every candidate, while their
canonical zero flow state, zero node-rate vectors, and zero Jacobians reuse
deeply frozen storage. The immutable config/structural projection pair also
owns a cold compiled pump record. If any rotary device is enabled, evaluation
uses the original complete dynamic-network path; IABP timing remains evaluated
in both paths. Three 1,024-tick local measurements were `1.241–1.255 ms/tick`
versus `1.269–1.293 ms/tick` at the preceding reader-plan revision (roughly
2–4% lower). All-off and mixed-device unit gates, the 1,024-tick 49-output
corpus, and checkpoint continuation remain exact. This is another development
host result rather than an iPhone qualification result.

The nonlinear venous pressure-volume inverse now snapshots and compiles its
pure-data law coefficients once per synchronous solve. The two transition
width products and zero-pressure softplus anchors no longer repeat at every
bisection midpoint. Frozen plain-data laws may retain that compiled value by
identity; mutable laws are never retained, and accessor-backed or non-plain
objects use the original dynamic expression. The fixed-32 ModelCore-compatible
inverse delegates to this same evaluator but preserves its original bounds,
midpoint order, comparison order, and iteration count. Six alternating local
512-tick diagnostics measured `1.223 ms/tick` against `1.244 ms/tick` at the
preceding revision (about 1.7% lower). The canonical 500-step accepted-state
SHA-256 remained byte-identical. This is a small scaling-oriented removal of
repeated transcendental work, not an iPhone qualification or a replacement for
the direct solver-owned typed-state work below.

#### Phase 1b.2b.2b — direct solver-owned typed state (in progress)

Before production cutover, move each state owner and the solver from object
property access to generated typed offsets/tags. Replace hot
transaction/fingerprint strings with bounded codes or recomputable
diagnostics. Rehydration and complete graph validation already no longer occur
once per accepted substep, but the nonlinear solver still reads and constructs
the attested object mirror. Move that remaining work onto generated typed
offsets/tags so rehydration is needed only at cold start, checkpoint restore,
diagnostics, or an explicit boundary adapter. The object Session then becomes
test-oracle code only.

The first Standard-16 slice makes that transition explicit for the
non-coronary solver's accepted clock, TBV, 15 node volumes, two dynamic-edge
flows, and four valve openings. A model-owned binding resolves their typed
slots once and stages them into reusable solver arrays. During this migration
the rollback object is still retained and every staged scalar is compared with
it exactly before Newton evaluation. This deliberately costs about 1–2% on the
development host; it proves the boundary and its rejection behavior, but is
not presented as a speedup. A later model release may remove that duplicate
authority only after the typed owner independently satisfies the full
accepted-state and checkpoint corpus.

Standard-17 then moves the four-valve candidate path onto scalar accepted-state
inputs. It retains validation only for frozen plain-data valve parameters,
never for mutable or accessor-backed objects, and removes the former duplicate
parameter/input validation, opening-target evaluation, and frozen temporary
loss/tangent records. The public object valve API remains the cold/general
adapter. Whole-kernel timing was neutral within development-host noise, so the
slice is retained for bounded allocation ownership rather than counted as a
performance qualification.

Standard-18 retains the typed accepted-state source as one Session-owned
binding and lets it fill the solver's reusable numerical header and arrays in
place. The BE trial also evaluates its candidate-time respiratory pressure
frame once, then shares those exact scalar results across candidate,
companion, edge, and analytic-Jacobian readers. Its mechanics memo preserves
the former SameValueZero tuple identity and call/hit/unique counters in a
flat small-entry list, avoiding four nested Maps on the common analytic path
whose measured hit count is zero. Source scalars are still compared exactly
against the admitted rollback object before Newton can consume them. No stable
whole-kernel speed delta was distinguishable from development-host load, so
these changes narrow hot allocation and repeated work without claiming phone
qualification.

Standard-19 snapshots the immutable vascular PV laws once per BE trial and
retains each candidate's exact paired primal pressure and constitutive tangent.
The analytic Jacobian consumes that tangent rather than repeating the same
adaptive inverse at the same node and candidate; the conservative companion
also shares the Ao pair. Law-based and node-based APIs are bit-identical under
both inverse policies. Five alternating local 512-tick diagnostics moved the
typed-reference median from about `2.489` to `2.458 ms/tick` and the object
Session median by about 1.5%. This reduces repeated constitutive work while
leaving solver order, residual algebra, saturation branches, and accepted
state unchanged.

Standard-20 removes transient arrays and records from Newton diagnostics and
dense pivot scaling without changing residual algebra or selection order.
Mixed continuity auditing materializes only the worst entry, in the same node
order with the same strict-greater tie rule. Row scales, final residual maxima,
independent-volume projection, and scaled-residual construction use direct
loops rather than mapped/spread intermediates. Host timing could not separate
this allocation cleanup from concurrent load, so it carries no standalone
speed claim.

Standard-21 gives the common analytic Newton path two reusable candidate
numerical pages. The current candidate remains untouched while line search
overwrites only the inactive page; accepting a step swaps page roles. Node
volume, pressure, vascular tangent, edge/dynamic flow, valve, continuity, and
scaled-residual records therefore live for the workspace rather than for one
candidate evaluation. A public success or failure detaches every externally
retained value before the workspace is released, and workspace reuse is tested
against a structured clone of the earlier trial. Finite-difference evaluation
continues to allocate independent vectors because it simultaneously retains
center, lower, and upper residuals. Alternating 512-tick host measurements were
small and load-sensitive (roughly neutral to about 1% lower), so this is a
bounded-allocation/GC-pressure step, not an iPhone qualification.

Standard-22 replaces those pages' repeated name-keyed numerical records with
fixed-index buffers. Node volumes and pressures, vascular tangents, edge and
dynamic flows, node rates, continuity residuals, and scaled residuals use
`Float64Array`; valve results occupy fixed arrays in the verified valve order.
The public trial remains the same detached name-keyed object and is materialized
once, only after convergence. The finite-difference path receives its own page
per simultaneously retained probe. Six alternating 512-tick host pairs were
faster in five pairs, with a paired-ratio median near `0.94`; one pair was a
severe concurrent-load outlier. This supports the fixed-offset direction but
does not replace an iPhone device gate.

Standard-23 applies the same fixed-topology principle inside the coronary
backward-Euler solve without changing its residuals or Newton ordering. The
Session-owned workspace compiles edge pressure endpoints and conserved-node
incidence into private typed indices, retains scalar derivative and boundary
scratch, and calls scalar projections of the unchanged collapsible-PV,
collapse-resistance, and signed-loss laws when the paired diagnostic record is
not consumed. Public hydraulic and trial records remain detached and frozen.
Canonical and reversed edge orders must both match the allocation-owning path
over repeated evolving boundaries. A local 2,048-tick coronary diagnostic
measured `0.0374 ms/tick` with that workspace versus `0.0472 ms/tick` without
it (`0.79x`). Three alternating whole-kernel host pairs favored the candidate
by about 0.5–3.5% with a paired-ratio median near `0.99`; the smaller and
load-sensitive end-to-end delta is not an iPhone device qualification.

Failure atomicity, event order, beat accumulation, controls, analysis forks,
and checkpoint continuation must pass against the Phase 0 corpus before Phase
2 changes solver algebra.

### Phase 2 — one coupled nonlinear solve

This is the primary computational intervention. Three independent design
reviews converged on the same diagnosis: the dominant cost is the nested
non-coronary, mechanics, and coronary solve organization, not TypeScript,
presentation transport, or dense linear algebra at this dimension.

The target index-1 DAE has one stable ordering:

- 14 independent non-coronary conserved volumes; dependent `SV` remains the
  fixed-total-blood-volume algebraic elimination;
- 16 coronary conserved volumes;
- two TriSeg internal coordinates.

Phase 2a first solves the 30-volume prefix while retaining the already-audited
TriSeg algorithmic tangent as a static condensation. Phase 2b activates the
two reserved TriSeg rows without renumbering either circulation block. This
staging distinguishes errors caused by circulation/coronary coupling from
errors caused by promoting mechanics coordinates into the global solve.

The first Phase 2b executable is now a construction-only 32-row residual. Its
first 30 rows evaluate the real non-coronary and coronary backward-Euler laws,
while mechanics is evaluated once at the caller's two scaled TriSeg
coordinates with no local internal Newton. The final two rows are the same
scaled generalized-force equilibrium equations used by the former local
solve. An intentionally slow all-central-difference Newton converges both from
the prior accepted context and from the Phase 2a volume root. On the canonical
one-step case, both seeds select the same 32-coordinate root, its first 30
values agree with the statically condensed solution to seven decimal places,
and its two internal coordinates agree with the independent local mechanics
solve to eight decimal places. This establishes equation/root equivalence for
the first case only.

The next construction slice assembles all 32 residual rows for the first 30
physical-volume columns from component-owned analytic derivatives. The
non-coronary local block uses the fixed-internal chamber tangent, the coronary
block uses its direct volume/boundary writers, and the final two mechanics rows
use the provider-owned equilibrium derivative. The subsequent slice adds a
direct 14-by-4 local circulation derivative with respect to absolute chamber
pressure, then chains the two internal-coordinate pressure/strain/active-
stress directions through the same coronary boundary writer. All 32 columns
are therefore analytic. The independent all-central-difference solver remains
executable as the oracle. In the canonical one-step case, the complete
analytic block stays below `2e-6` maximum absolute and `2e-5` relative
Frobenius difference against a scale-aware finite-difference shadow; both
solvers select the same root to eight decimal places. This removes all 64
Jacobian residual probes per assembly. It is still neither an accepted-state
authority nor an end-to-end performance claim.

The promoted solve now uses the same component-owned convergence law as the
accepted 30-volume path rather than a uniform raw-residual tolerance. The
non-coronary rows use the node-wise mixed continuity audit, the coronary rows
use their absolute-plus-relative volume gate, and the two mechanics rows use
the provider's generalized-force tolerance. Over all six solver-replacement
corpus cases for one model second each (`3,000` accepted steps), an independently
materialized 30-volume root plus the matching local TriSeg coordinates satisfies
the 32-row system and selects the same first 30 coordinates to seven decimal
places (maximum absolute difference below `1e-6 mL`). Four scale-aware
Jacobian shadows per case sample non-coronary, coronary, and both promoted
mechanics columns; every sample remains below the same `2e-6` maximum-absolute
and `2e-5` relative-Frobenius gates. The analytic path performs zero Jacobian
residual probes.

That trajectory gate establishes equation, root, and derivative parity; it is
deliberately not a standalone convergence claim because each promoted solve is
seeded with the independently verified reference root. A solve seeded from the
previous accepted tuple, and even small perturbations of the exact root, can
still exhaust the strictly monotone Armijo search near semismooth valve events.
The all-central-difference oracle fails at the same event, so this is not an
analytic-Jacobian defect. Before the 32-row system can become accepted
authority, it needs an accepted-history predictor and a globalization rule
that can admit a trial satisfying the complete component convergence law even
when floating-point or branch-switching noise prevents the scalar merit from
meeting strict Armijo decrease. Scientific residual gates must not be relaxed
to hide that failure.

The first predictor/globalization experiments narrow that failure further.
Linear and quadratic accepted-root extrapolation, geometrically damped
extrapolation, a component-converged line-search fast path, and one local
TriSeg initialization at each predicted chamber-volume tuple do not carry the
promoted system through the complete baseline valve transition. They move the
first failure from step 16 to steps 17–18, but do not remove it. At the same
event, static condensation of the analytic `32×32` matrix agrees with an
independent central-difference Jacobian of the condensed 30-volume residual to
`4.73e-7` maximum absolute error, and the mechanics `2×2` block determinant is
well separated from zero. The construction derivative is therefore not the
observed defect; the expanded Newton direction crosses a semismooth active-set
boundary where strict monotone globalization is not robust.

For the one-patch production candidate, the 30-volume system with the existing
model-owned TriSeg static condensation remains the preferred authority. It is
the exact local block elimination of the promoted equations, already clears
the solve and flat-acceptance host gates, and is more robust at the valve
transition. The 32-row executable remains a derivative/root oracle and the
forward-compatible contract for future multipatch block solvers. Promoting it
to authority now would add risk without demonstrating a measured performance
benefit. Reopening that decision requires an active-set or trust-region method
that passes the same six-case free-running gates; fallback by loosening
residuals or silently changing the 2 ms backward-Euler equation is forbidden.

A separate scaled Powell-dogleg executable now tests the missing
globalization mechanism without changing that authority decision. It forms
`r_s = S_r^-1 r` and `A = S_r^-1 J S_x`, computes the Newton and Cauchy steps
in normalized unknown coordinates, and selects their dogleg intersection with
a deterministic trust radius. Actual residual evaluations, not the linear
model, decide the reduction ratio. The scalar least-squares merit is only a
trial-selection device: a candidate is accepted as converged only when the
existing component-owned non-coronary, coronary, and mechanics gates pass.
A stationary non-root therefore fails closed. Open volume bounds and the
dependent-SV directional limit are applied before every trial evaluation.

At the frozen baseline step-18 valve transition, the former Armijo solve still
fails as a falsifiable oracle while the dogleg solve crosses the same branch
surface, passes the unchanged component gates within 32 updates, and matches
the independently condensed 30-volume root plus locally eliminated TriSeg
coordinates to seven decimal places. The gate also confirms that a rejected
trust-region trial was required; a disguised full-Newton success would not
satisfy it. This establishes that trust-region globalization addresses the
known event, but it does **not** promote the 32-row system. Full six-case
free-running trajectory, event-order, rollback, and checkpoint-continuation
gates remain prerequisites. Until those pass with a measured benefit, the
dogleg implementation is a shadow solver and the 30-volume condensation is the
P=1 production candidate.

The first executable uses one deterministic damped semismooth Newton and a
fixed row-major `Float64Array` Jacobian with partial-pivot dense LU. At 30–32
unknowns, the roughly 10,000 floating-point operations of dense factorization
are small compared with repeated mechanics, hydraulic, and transcendental-law
evaluation. Fixed block metadata is nevertheless preserved so multipatch can
later use patch-local elimination and a bordered Schur solve without changing
the component contract.

Each component writes its residual and analytic tangent contribution into
fixed destinations. A finite-difference shadow remains a development gate,
not a production fallback. Runtime operator-overloading AD, runtime code
generation, generic sparse libraries, and Jacobian-free Newton–Krylov are not
part of the first slice. Build-time generated assembly becomes eligible when
multipatch repetition makes its review and tooling cost worthwhile.

The Phase 2a construction solver now evaluates the real 30-row residual and
solves it with the dense flat Newton. Its coronary writer obtains the
16-row residual, the `16×16` fixed-boundary volume tangent, the `16×9`
boundary tangent, and inlet/outlet observable tangents from one hydraulic
evaluation. Component-owned writers assemble all four Jacobian blocks from
one coupled candidate:

- the non-coronary writer provides the physical `14×14` local block,
  including the fixed-total-volume dependent-`SV` column and native edge
  chain, without differentiating through the legacy implicit companion solve;
- direct coronary inlet/outlet tangents add the Ao and RA companion-rate
  contributions to that block;
- the same dependent-`SV` chain and direct companion-rate tangents form the
  `14×16` upper-right block;
- the production mechanics provider exposes its condensed chamber pressure,
  ventricular fiber-strain, and active-stress rows, which common-pericardium,
  cavity-pressure, and shortening-IMP derivatives compose into a `9×14`
  boundary matrix; and
- multiplication by the coronary writer's `16×9` boundary tangent gives the
  `16×14` lower-left block, while its fixed-boundary `16×16` tangent supplies
  the lower-right block.

The production provider consequently needs zero full-residual finite-
difference probes per Jacobian rather than the original 60. Providers without
the required physical tangents retain a 14-column finite-difference shadow;
that fallback is a construction aid and is not eligible for production
cutover. At the canonical cold candidate, direct block comparisons with the
real 30-row central-difference oracle are gated at `2e-6 mL/mL` maximum
absolute and `2e-5` relative Frobenius error. The analytic and all-FD Newton
solutions agree to nine decimal digits.

Dense LU acts on a row/column-equilibrated Jacobian. Unknown scales come from
the initial physical volumes and residual scales use the corresponding
equation-volume scale; line-search merit, lower bounds, and returned updates
remain in physical units. Convergence itself is component-owned: the
non-coronary block applies the same node-wise mixed `atol + rtol` continuity
gate as public trial admission, including eliminated `SV`, and the coronary
block applies its existing absolute-plus-relative residual gate. A single raw
infinity norm remains diagnostic; it does not replace those physical
admission rules.

The first cold implementation established correctness but not a runtime win.
A 30-sample diagnostic measured median times of `1.28 ms` for the analytic
coupled solve, `18.99 ms` for the full central-difference oracle, and `1.17 ms`
for the nested path. The analytic assembly was `14.8x` faster than its FD
oracle but only `0.91x` as fast as the nested path. That result rejected
production cutover and isolated the remaining cost to repeated graph
construction, validation, object snapshots, and candidate materialization
around the coupled algebra.

The follow-up slice preserves the equations while replacing that cold bridge
with session-owned scratch, a prepared non-coronary evaluator, direct typed
coronary residual/boundary/volume writers, and dense LU that equilibrates and
factors the caller-owned matrix in place. A modified-Newton experiment reuses
one accepted Jacobian for at most two accepted Newton updates. The canonical
candidate still needs three Newton updates, but now performs four residual
evaluations and two Jacobian builds/factorizations rather than three. The
full-Newton and modified-Newton solutions agree to eight decimal digits, both
satisfy the component-owned physical admission gates, and reuse of the same
workspace is deterministic.

The production-like benchmark gives the legacy nested solver its production
coronary and non-coronary scratch workspaces. After 1,000 warm-up solves, three
independent 5,000-solve runs measured coupled/legacy median pairs of
`0.434/0.793 ms`, `0.441/0.808 ms`, and `0.441/0.805 ms`, for speedups of
`1.827x`, `1.835x`, and `1.824x`. Thus the local host diagnostic now clears the
predeclared `1.8x` solve-only threshold reproducibly. This is evidence that
eliminating the nested algebra is worthwhile; it is not an iPhone
qualification or authorization to replace the accepted-step authority.

The next slice closes that distinction. Externally solved non-coronary and
coronary candidates are independently re-evaluated through the existing mixed
continuity, hydraulic, ledger, valve, and mechanics admission laws, then enter
the exact same one-shot seal/commit/rollback finalizer as the nested path. No
borrowed candidate array escapes its synchronous evaluator; the cache owns
fixed destinations, and a second finalization attempt is rejected. Global
coupled iterations are not reported as coronary-local Newton work. The
authority path also requires the complete component-owned analytic Jacobian
and fails closed instead of using the 14-column finite-difference construction
fallback.

After aligning Newton convergence with those public component gates, three
independent 5,000-step host diagnostics measured solve-only coupled/legacy
speedups of `1.804x`, `1.805x`, and `1.806x`. The complete path—context
preparation, coupled solve, canonical trial materialization, and atomic
finalization—measured `1.296x`, `1.297x`, and `1.296x`. The accepted-state
authority therefore remains below the `1.8x` cutover gate. This is a useful
negative result: the residual/Jacobian organization is faster, but the current
object-oriented re-evaluation and public-trial bridge consume most of that
gain. Production cutover is rejected until final candidate ownership and
materialization are flat and single-pass.

The first model-specific flat acceptance owner now tests that missing boundary
without extending the generic reflective state image. Its initial 34-f64
volume-only proof has been replaced by two fixed 100-f64 images. They contain
accepted time, revision, fixed TBV, all 15 non-coronary and 16 coronary
volumes, two dynamic-edge flow memories, four valve opening memories, six
coronary-tone values, all five canonical Land/SLS wall states, the two TriSeg
coordinates, and the seven-scalar MVC shortening reference. A converged
30-row root is range-checked and rechecked by the component convergence law;
the selected private mechanics probe and the other component memories are
then copied synchronously into the inactive image. Promotion remains one
active-index swap. No public trial, generic clone, recursive fingerprint, or
frozen accepted object graph is created on this path.

Three independent 5,000-step host diagnostics measured flat-acceptance/legacy
median pairs of `0.452/0.834 ms`, `0.444/0.818 ms`, and `0.442/0.817 ms`, for
speedups of `1.845x`, `1.841x`, and `1.847x`. Flat admission itself measured
about `0.001 ms` and the index swap about `0.00004 ms`; the coupled solve still
dominates. This clears the predeclared `1.8x` host threshold and confirms that
public-object materialization was the limiting boundary, not the coupled
algebra.

The expanded owner is parity-gated against the same converged root passed
through the existing canonical finalizer. Non-coronary and coronary volumes,
dynamic flows, valve openings, coronary tone, Land/SLS/TriSeg material state,
and the MVC reference must all agree. A 1,000-step host diagnostic after the
expansion measured flat/legacy medians of `0.459/0.840 ms` (`1.831x`), while
flat admission was `0.005 ms` and the index swap below the timer's useful
resolution. The result remains above the predeclared host gate even after the
additional 66 accepted-state scalars.

This owner is nevertheless a migration proof, not a complete accepted Session.
Its residual context is still prepared from the old object state. Rhythm,
devices, event clocks, accepted slow autoregulation ownership, and checkpoint
encoding also remain outside the image. It therefore cannot yet drive the
production multi-step Session by itself and is not eligible for a model
release. The next authority slice must prepare the next residual directly from
the active image, add the remaining model-owned memories, and materialize
public objects only at cold readback boundaries. The `1.8x` result authorizes
that migration; it does not authorize production cutover.

An exact `14+16` block-Schur linear solve was also implemented and measured.
At one patch it reached only about `1.53x` over the legacy nested path because
fourteen auxiliary solves and block copying outweighed the smaller factors, so
the experiment was removed. Dense `30x30` LU remains the simpler and faster
P=1 baseline. A bordered/block solver becomes eligible again only when
multipatch repetition changes that cost balance.

The Newton domain now also owns physical lower bounds for all 16 coronary
storage volumes and the coupled fixed-blood-volume inequality. The dependent
`SV` volume is recomputed as total blood volume minus all 30 independent
unknowns. An exact directional step limit keeps every line-search trial in
the open positive-`SV` domain before any residual evaluation. These are
solver admissibility conditions, not post-hoc clipping.

The initial coupled implementation keeps the exact 2 ms backward-Euler clock,
event clipping, closed-form valve/Land eliminations, and all accepted-state
owners unchanged. It replaces three outer candidates, about four inner
coronary Newton iterations, and fifteen implicit-sensitivity solves with one
coupled nonlinear solve. Full Newton remains the reference. The tested
modified-Newton candidate may reuse a validated Jacobian for one subsequent
accepted update, but production use still requires the full branch, trajectory,
rollback, and checkpoint gates. Higher-order integration or WASM may be
evaluated only after this baseline identifies their marginal value.

The old nested runtime is a test oracle, not the production fallback. A six-
case corpus freezes 500 accepted steps for baseline, low preload, high
afterload, high PEEP, tachycardia, and high contractility before any new-solver
output is inspected. Legacy hashes prove that the oracle did not move; they do
not require a different floating-point algorithm to reproduce the old bit
path. Candidate acceptance instead uses predeclared conservation, residual,
event, pressure, volume, flow, morphology, and checkpoint-continuation gates.

The first trajectory shadow runs the coupled solve from the exact pre-step
state beside every one of those 3,000 accepted legacy steps, using the actual
event-limited `dt` and accepted calcium drive. All six cases complete with at
most five coupled Newton updates. Across the corpus, the largest independent
volume difference from the nested solution is `3.05e-8 mL`, the dependent-SV
continuity residual remains below `1.18e-9 mL`, and the coupled residual
infinity norm remains below `3.05e-8 mL` while every component-owned admission
gate passes. Mean Jacobian evaluations range from `1.318` to `1.532` per
accepted step. This demonstrates local branch agreement
while the legacy state still drives the trajectory; it is not yet evidence
that a new-solver-driven trajectory preserves event order, rollback, or
checkpoint continuation.

A separate candidate-driven baseline now advances 500 accepted 2 ms steps
using only the coupled branch's preceding accepted tuple; the nested branch is
an independently advancing observation oracle. Both reach revision 500 at one
second, and every non-coronary and coronary stored volume remains inside the
predeclared `1e-5 mL` corridor. This proves that the coupled candidate can own
its next step without returning to the nested state. It does not yet cover
integrated rhythm/event clipping, dynamic mechanical support, accepted
autoregulation, checkpoint continuation, or the remaining five scenarios.

The solver-architecture hypothesis is itself falsifiable. The regular-sinus,
device-off accepted-state authority must improve host kernel time by at least
`1.8x` to justify productionization. The public-object authority remains only
`~1.296x`, while the model-specific flat authority now measures `~1.831x` and
clears the host gate. Production cutover still requires a genuinely
flat-driven multi-step trajectory and the integrated iPhone gate; the host
result does not waive either condition or justify a premature WASM port.

The complete 100-scalar image now also drives a 500-step, one-second accepted
trajectory through an explicit cold object bridge. After every index swap the
bridge reconstructs the old circulation, coronary, mechanics, and MVC public
state, including a freshly encoded and fingerprinted mechanics snapshot; only
that reconstructed state prepares the following coupled context. The flat
trajectory reaches revision 500 and remains within the existing `1e-5 mL`
volume corridor beside an independently advancing nested oracle. This proves
that no accepted circulation/mechanics scalar required by the next step is
missing from the image. It does not count as the final hot path: the bridge is
named, documented, and measured as a cold migration boundary and must be
deleted from per-step execution before cutover.

The integrated reference Session now stages all continuously changing owners
that were still visible outside that 100-scalar partition into the existing
global typed image: electrical-capture and ventricular-backup clocks,
coronary-window duration/count/integrals, redundant circulation and mechanics
volumes, and the fixed-width mechanics fingerprint. A manifest-wide 1,024-tick
diagnostic classifies every changing slot and fails if an unclassified hot
owner appears. In the baseline run, `1,017` of `1,032` accepted commits were
already byte-exact after owner staging; only `15` rhythm/window event commits
needed the exhaustive object completion path. The complete all-49-output
trajectory remained inside the existing scientific corridor, with maximum
relative output difference about `1.92e-9` versus the nested oracle, and exact
checkpoint continuation still passed.

That result deliberately did **not** qualify the migration as a speedup. One
alternating 512-tick host diagnostic measured about `2.06 ms/tick` for the
nested object authority and `2.15 ms/tick` for the integrated typed reference
(`1.045x` overhead), despite eliminating exhaustive completion on 98.5% of
commits.

The next reference slice now makes those 98.5% ordinary commits model-owned.
A manifest-bound promotion plan records every continuous, boolean, and
fixed-width string slot that the solver and continuous owners must explicitly
write during the current candidate generation. The inactive image tracks those
writes in preallocated bitmaps. Promotion rejects any missing write before the
buffer index can change. Full-invariant runs additionally compare the entire
typed candidate with the admitted object oracle; lean runs skip that 484-leaf
comparison. Rhythm transitions, queue changes, nullable-event records,
autoregulation control changes, and window rollover still use the exhaustive
completion path. A 1,024-tick lean/full pair remained inside the all-49-output
scientific corridor, and the lean authority promoted `1,017` ordinary
candidates with only `15` event completions. Three local lean profiles measured
about `0.871`, `0.925`, and `0.937 ms/tick`, compared with roughly
`0.93–0.96 ms/tick` before this slice. This is a real but modest host gain;
noise overlaps it, so it is not a production gate.

The reference still constructs a complete accepted object before that typed
promotion. Therefore the next performance boundary is no longer another
retained-slot or comparison optimization: it is a model-owned typed candidate
admission that evaluates the selected 30-volume root, applies coronary
autoregulation and rhythm/device owners, validates clocks/conservation/event
ownership directly, and promotes the single global image without first
materializing the public object graph. Public objects must then exist only at
observation, checkpoint, capture, and explicit debug-oracle boundaries. Until
that boundary exists, the integrated Session remains a parity oracle and must
not replace the active release.

The coupled solver now exposes the selected converged component candidate as a
synchronous, context-owned borrow before public trial finalization. The global
typed authority copies the complete 100-value hemodynamic partition, material
fingerprint, and MVC state from that borrow; retaining any borrowed array or
record beyond the callback is forbidden. Full public finalization remains in
place as the independent oracle and a 1,024-tick regression requires every
typed slot, all 49 outputs, and canonical checkpoint continuation to agree.

The same borrow carries a fixed ten-value coronary readback: six internal Qm
flows, three post-focal-lesion pressures, and common coronary venous pressure.
The accepted autoregulation owner consumes that packed readback directly. Its
window state and rollover decision are compared exactly with the legacy public
trial promotion on every reference step, including the first complete window.
This removes public coronary diagnostics from the future typed authority's
dependency graph without changing the backward-Euler right-endpoint law.

This seam alone is intentionally not a speed claim: public finalization still
runs as an oracle and a local lean profile remained about `0.934 ms/tick`.
The next deletion boundary is preparation of the following coupled context
from the active global typed image, followed by lazy public materialization at
observation, checkpoint, capture, or explicit full-invariant audit boundaries.

That preparation boundary now has two narrower construction seams. The
non-coronary evaluator reads the accepted clock, TBV, volumes, dynamic flows,
and valve openings directly from the active typed image, then requires exact
agreement with the still-present rollback object before solving. The coronary
evaluator snapshots accepted volumes, tone, disease, collapse, and topology
once per accepted step and owns one reusable hydraulic page. An exactly
identical candidate-volume/boundary tuple therefore shares one hydraulic
evaluation between residual and analytic-linearization assembly; mutable
scratch never escapes the opaque evaluator. Canonical trials and admitted
state continue through the existing component finalizers.

These seams reduce repeated validation and hydraulic reconstruction, but they
are not independently performance-positive at one patch. A local lean profile
after both changes measured about `0.941 ms/tick`, overlapping the preceding
`0.934 ms/tick` reference. Their value is ownership and scaling: the next
ordinary-tick path can prepare from the sole typed authority and stage a
converged root without reviving public accepted state. Until that path removes
public finalization, no runtime speedup is claimed.

The first trajectory optimization uses only **admitted** 30-volume roots to
predict the next Newton seed. The first eligible step uses a first-order
accepted displacement. Once three accepted roots exist, the selected policy
uses the second finite difference to form a quadratic extrapolation. Prediction
is not accepted state and changes no equation, timestep, bound, residual
tolerance, or component-owned convergence law. History advances only after
the exact root has been staged and the complete flat image promoted. A
restore, parameter change, revision/time discontinuity, or mismatch with the
current accepted root clears the history. An extrapolation outside the open
per-volume and dependent-SV domain is geometrically damped and ultimately
falls back to the context seed; a predicted solve that fails also retries from
that seed.

In one 1,000-step sequential host diagnostic after 100 warm-up steps, the
context-seeded coupled path required mean `3.171` Newton updates and `1.958`
Jacobian evaluations per accepted step. The accepted-root predictor reduced
those to `1.987` and `1.240`, respectively. Median complete flat-step time
fell from `0.549 ms` to `0.419 ms`; against the independently advancing nested
oracle, the measured median speedup rose from `1.335x` to `1.766x`. All 1,099
eligible warm-up/measured predictions were admitted without damping or solver
fallback in that run. A separate 200-step regression solves every context
from both seeds, requires branch agreement inside the established numerical
corridor, records history only after promotion, and proves a discontinuous
cold context falls back and resets. These host numbers establish marginal
value, not the production phone gate. Cross-step Jacobian reuse remains a
separate concern rather than an implied consequence of the predictor result.

The quadratic policy was then measured independently rather than inferred
from the linear result. In a 1,000-step baseline diagnostic it reduced mean
Newton updates from `1.987` to `1.387`, residual evaluations from `3.000` to
`2.389`, and Jacobian evaluations from `1.240` to `1.031`. Median complete
flat-step time fell from about `0.423 ms` to `0.329 ms`, and median speedup over
the nested observation rose from `1.756x` to `2.224x`. One solve used the
defined context-seed retry in that longer run; no accepted state came from a
failed prediction. A separate 500-step run for each of baseline, low preload,
high afterload, high PEEP, tachycardia, and high contractility reduced mean
residual evaluations in every case (`2.926`–`3.334` linear versus
`2.366`–`2.616` quadratic), without damping or retry. A six-case regression
advances both predictors from their own accepted state, keeps their roots
inside the predeclared `1e-5 mL` corridor, and requires less residual work in
every case. These are construction cases, not clinical validation.

A residual-gated cross-step factor experiment then used the preceding
factored Jacobian for at most the first update and rebuilt it on any failed
line search or stagnation. All 1,099 eligible attempts produced an accepted
residual-decreasing update, reducing fresh Jacobian evaluations to mean
`1.032` per step. It nevertheless increased mean Newton updates from `1.987`
to `2.163` and measured `0.424 ms` median flat-step time (`1.742x` over the
nested observation) rather than the predictor-only run's `0.419 ms`
(`1.766x`). Raising intra-solve modified-Newton reuse from two to three updates
similarly reduced Jacobian builds but increased iteration count and did not
improve time. Both implementations were removed. Jacobian assembly is now
cheap enough that a stale direction's extra residual/update work cancels its
savings at one patch; future reuse requires a materially better update such
as a tested low-rank quasi-Newton correction, not simple factor retention.

Component timing also changes the next priority. In a profiled 1,100-step
predictor run, residual evaluation consumed about `388 ms` over `3,355` calls
(`0.116 ms` mean), while the component-owned analytic Jacobian writers used
about `39 ms` over `1,393` calls (`0.028 ms` mean). Convergence and dependent-SV
checks were sub-microsecond on average. The remaining host solve is therefore
dominated by repeated residual materialization, not dense Jacobian assembly.
The next optimization must replace the generic public-object candidate path
with a model-specific flat residual/mechanics evaluator that writes fixed
numeric scratch and materializes rich readback only for the selected root. It
must not weaken component convergence or accepted-state finalization.

The first model-owned candidate seam now removes public mechanics readback from
rejected coupled residual candidates without changing the accepted boundary.
The production five-wall provider privately mints an opaque prepared numerical
step from the accepted material state, candidate clock, calcium drive, and
parameter identity. Each candidate returns only the chamber pressure/tangent,
ventricular strain and active-stress values needed by the coupled residual,
the isolated candidate material state, and model-owned evaluation counters.
Providers that do not own this seam continue through the complete generic
mechanics contract. The selected root is always re-evaluated through the
existing public trial and the common one-shot seal/commit/rollback finalizer;
the lightweight result can neither be published nor committed directly.

An A→B→A regression proves that later candidate evaluations cannot mutate an
earlier candidate or the accepted material state. Public-versus-numerical tests
require identical pressures, condensed tangents, ventricular strains, active
stresses, and encoded candidate material state. Three alternating pairs of
10,000-step baseline diagnostics, after 1,000 warm-up steps, with the nested
observation disabled and under the default development `full-invariant` tier,
gave identical coupled iteration, residual, and Jacobian counts. The
model-owned path was faster in all three pairs. Its paired median ratios were
about `0.990` for complete-step median, `0.976` for solve median, `0.944` for
complete-step p95, and `0.939` for solve p95. These machine-specific
measurements establish that rejected-candidate readback is real overhead,
especially in the tail, but they also falsify it as the main remaining
bottleneck.

The next mechanics slice must therefore replace the remaining model-specific
candidate object graph with provider-owned fixed numeric scratch. It should
retain the same constitutive solve and algorithmic tangent, write only the
pressure, tangent, strain, active-stress, and candidate-state slots consumed by
the coupled system, and materialize detailed wall diagnostics only once for the
selected root. No accepted-state/checkpoint schema change, looser convergence
gate, or stale candidate reuse is implied by this optimization.

A second ownership correction removes state and public-step materialization
from that rejected-candidate path. Internal numerical TriSeg candidates retain
their private material evaluations but do not clone a five-wall aggregate
state. Only the converged numerical result materializes one owned candidate
state. The generic mechanics prepared step, including its clone, canonical
fingerprint, and serializability checks, is now created lazily only if the
caller requests canonical trial materialization/finalization or if the provider
does not implement the numerical seam. The exact accepted public path remains
unchanged.

Three alternating 10,000-step pairs after this change again had identical
iteration/residual/Jacobian counts. Under the production-relevant
`hot-path-lean` tier, the model-owned-to-generic paired median ratios were about
`0.945` for complete-step median, `0.931` for solve median, `0.931` for
complete-step p95, and `0.912` for solve p95. The same comparison under the
default development `full-invariant` tier showed larger ratios of about
`0.913`, `0.892`, `0.915`, and `0.889`, respectively, because deferred public
validation is deliberately more expensive in that tier. The benchmark now
reports its effective integrity tier so those two claims cannot be conflated.
This is a meaningful host improvement, but the path still allocates geometry,
constitutive, derivative, Hessian, and tangent object graphs for every residual
candidate. Those allocations, not the deferred public boundary, are the next
target.

The Phase 2b construction seam now also exposes the two scaled TriSeg internal
coordinates as explicit caller-owned unknowns. At one fixed chamber-volume and
coordinate tuple, the model-owned provider evaluates the existing constitutive
and geometric equations once without running its local two-variable Newton. It
returns the two equilibrium residuals and an analytic `6×6` mechanics block:
four transmural-pressure rows followed by two internal-equilibrium rows, with
columns ordered as `LA`, `LV`, `RA`, `RV`, scaled septal cap volume, and scaled
junction radius. Ventricular strain and active-stress derivatives use a separate
documented `3×4` row-major block. A central-difference shadow checks the complete
`6×6` derivative, and static condensation of its two internal coordinates must
reproduce the established four-chamber pressure tangent. The returned arrays
are owned by one evaluation and an A→B probe cannot mutate A. This remains a
construction interface used by the 32-variable shadow; it cannot be sealed,
committed, checkpointed, or treated as an accepted performance improvement by
itself.

### Phase 3 — strict scalar WASM

Port the proven flat scalar kernel to a strict `f64` WASM implementation if
physical-device measurement demonstrates a benefit. A direct WASM translation
of the current object graph is explicitly rejected: it would preserve the
wrong allocation and solver structure.

WASM threads and `SharedArrayBuffer` are optional. They require a measured win
on iOS and must not become a deployment prerequisite.

JavaScript transcendental functions also require an independent portability
experiment. The 500-step canonical sequence must be computed in V8 and WebKit
JavaScriptCore. A mismatch establishes that current hashes promise
within-engine determinism only; it does not by itself imply a scientific
failure. A portable `libm` implementation or strict-f64 WASM becomes eligible
only after that mismatch is measured and a cross-engine bit contract is shown
to be necessary.

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

The fixed 2 ms backward-Euler method is also not assumed to be scientifically
optimal forever. Before considering TR-BDF2, SDIRK2, or another L-stable
second-order method, the existing dt-halving lane must quantify morphology
effects including E/A, atrial figure-eight shape, pulmonary-venous S/D/Ar,
and the aortic dicrotic notch. Integration-order work receives its own exact
model release and is never combined with the first coupled-solver cutover.

## Gates

The flat kernel cannot replace the current exact release until all scientific
oracle tests pass and a physical-device report is attached to the release.

The coupled-solver science gate additionally requires:

- one-step candidate versus nested-oracle node-volume difference at or below
  `1e-6 mL` for the frozen construction corpus;
- total-blood-volume, coronary-ledger, and continuity limits at or below their
  predeclared `1e-8 mL` gates;
- exact scheduled-event order and rejected-step atomicity;
- periodic-settlement and healthy morphology corridors;
- the valve-disease robustness envelope with zero finite-difference fallback;
- exact checkpoint continuation within the candidate exact release.

The one-step comparison diagnoses whether both implementations solve the same
equations. Free-running 500-step divergence is recorded and bounded by
observable/morphology policy rather than by the legacy sequence hash.

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
