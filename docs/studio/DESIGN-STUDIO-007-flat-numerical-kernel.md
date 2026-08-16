# DESIGN-STUDIO-007: Numerical runtime and extension policy

Status: binding current numerical-runtime architecture

This document owns the accepted numerical authority used by Workbench and
Article simulation. It also defines the boundary that future oxygen,
autonomic, topology, and multipatch work must extend. It does not define the
physiology of those future models.

Related authorities:

- [DESIGN-STUDIO-005](DESIGN-STUDIO-005-live-graph-performance.md) owns group
  playback, Worker transport, presentation cadence, and physical-device
  performance policy;
- [DESIGN-STUDIO-009](DESIGN-STUDIO-009-model-definition-execution-plan.md)
  owns `ModelDefinition`, generated execution-plan descriptors, and
  Worker-local plan binding; and
- [INTEGRATED-MODEL-0001](../scientific-runtime/INTEGRATED-MODEL-0001-current-state.md)
  records the active release's model scope and scientific claim limits.

Git history is the archive for the construction diary, individual Standard
release measurements, rejected prototypes, and superseded migration plans.

## Decision

The active Standard release uses:

- one Worker-owned accepted-state authority per Scenario;
- an integer numerical clock with a fixed `2 ms` base tick;
- two lifetime-fixed typed images for current and candidate state;
- model-owned slot bindings and reusable numerical scratch;
- one coupled circulation/coronary solve with statically condensed TriSeg
  internal coordinates;
- one generated and admitted execution plan per Scenario;
- model-owned selected-output projection into transferable typed pages; and
- cold, explicit object rehydration for capture, restore, analysis, and
  scientific-oracle work.

There is one numerical profile on every device. A device may use a lower
playback rate, lower visual cadence, fewer background jobs, or lower Canvas
cost. It may not select different equations, accepted step size, solver
tolerances, event order, output meaning, or checkpoint semantics.

Every change that alters accepted behavior, primitive output meaning, or exact
checkpoint continuation receives a new `modelId`. Artifact-byte changes alone
receive a new immutable implementation revision and may stay under the same
model only after byte-exact predecessor comparison. Graphs,
presentation-only derived values, and Article Briefing remain Surface or
content concerns.

## Non-negotiable invariants

### One accepted authority

`MainWireIntegratedTypedAuthoritySessionV1` owns live accepted state. No public
object tree, presentation store, adapter, or disposable analysis Session is a
second writable authority for that live Scenario. An analysis Worker owns only
its isolated exact fork.

Each accepted step follows one transaction:

1. read the current typed image through admitted bindings;
2. evaluate numerical and event candidates using private scratch;
3. stage every accepted-state owner into the inactive image;
4. validate cross-owner clock, revision, fixture, conservation, and shape
   invariants;
5. atomically promote the inactive image once; and
6. update non-authoritative caches only after promotion.

Any failure leaves the previously accepted image and its public meaning
unchanged. A partially failed candidate is never observable and never reused.

Hot-path validation proofs are reusable only for the exact immutable identity
whose complete plain-data graph is transitively frozen. Mutable values,
restored or copied values, partial or failed validation, and stamp-disabled
verification take the complete validator path. Release gates require the
`hot-path-lean` tier to match `full-invariant` accepted state and checkpoint
semantics.

### Exact clock and event order

Accepted time is an integer tick. Seconds are derived only at API and
presentation boundaries. Wall-clock scheduling cannot rebase, skip, or invent
accepted time.

The execution plan declares update-group ordinals, periods, phases, and exact
solve-group bindings. Event-clipped substeps remain accepted numerical
boundaries. Beat metrics and scientific derivations consume every accepted
substep, including event-clipped ones; decimated UI frames are not scientific
input.

### Exact content identity

An Experiment pins `modelId` plus Surface series. A Snapshot pins exact model
and Surface releases. An Article placement pins a Snapshot. Loading historical
content never substitutes the active bundle.

An active exact artifact does not decode another release's checkpoint or run a
dual state layout. Referenced older artifacts are loaded independently through
their own manifest and codec until their durable content references are
deliberately removed.

## Accepted-state layout

The accepted-state manifest gives each owner and mutable leaf a semantic path
and a typed slot. The active and inactive images have the same admitted layout.
Continuous values use `Float64Array`; modes, presence tags, bounded lengths,
and ordinals use explicit integer storage. Optional records and variable arrays
require declared presence or capacity metadata.

Hot numerical code resolves semantic paths once during plan binding and then
uses numeric slots. It does not rediscover object paths per tick. Fixed
configuration remains deeply immutable and is bound by identity rather than
copied into evolving state.

Public observations are detached values. Typed image buffers and writable
views do not escape the authority. Checkpoint and observation paths rehydrate
from the current image and validate the result before publication.

## Execution plan and topology

The build-time compiler turns a declarative `ModelDefinition` and
`NumericalPolicy` into an immutable data-only execution-plan descriptor. The
descriptor declares:

- accepted-state owners and slot bindings;
- component-kernel identifiers;
- circulation nodes, paths, and endpoint ordinals;
- active nonlinear solve systems;
- update-group schedule.

Primitive-output projection remains an exact-model-owned boundary rather than
portable execution-plan data.

The browser does not compile the model. During Scenario initialization the
Worker validates the exact descriptor and binding catalog, requires exact set
equality for declared kernels, binds one private plan, and allocates
non-aliasing workspace. Unknown components, paths, solve blocks, or schedules
fail closed.

The plan is topology data, not executable code and not accepted state. A new
Fontan pathway, shunt, bypass, or compartment graph therefore requires a new
declarative topology and compatible model-owned kernels, not ad hoc branching
inside the current fixed graph. Compilation success alone is not scientific
validation.

## Numerical solve

The active release solves 30 circulation volumes:

- 14 independent non-coronary volumes;
- 16 coronary volumes; and
- systemic venous volume as the total-blood-volume dependent state.

TriSeg's two internal coordinates are solved by the model-owned mechanics
kernel and statically condensed from the circulation root. The accepted solve
uses component residuals, component-owned convergence gates, deterministic
globalization, and reusable dense row-major factorization workspace.

Predictors and other warm-start data are algorithmic cache. They may reduce
iterations but never relax final residual, conservation, bound, material, or
event gates. A changed fixture, discontinuous clock/revision, restore, or
failed candidate invalidates incompatible predictor history.

The object Session remains a scientific oracle, not a production fallback
path. The rejected promoted 32-variable construction experiment is retained in
Git history. Its replacement evidence lives in the current 30-row
analytic-versus-central Jacobian gate, the six-case accepted trajectory corpus,
and the typed-authority parity and checkpoint gates.

## Worker and presentation boundary

One persistent Scenario Worker owns one exact numerical Session. Its hot
operation is conceptually:

```text
advanceTo(targetTick, outputPlan, destinationPage)
```

The exact adapter advances every accepted tick in order, projects only selected
scalar outputs into a transferable typed page, and emits one complete terminal
frame for controls, capture, authoring correlation, and latest-value reads.
Output identity, scalar shape, destination layout, clocks, state codes,
monotonicity, and terminal correlation are checked before transfer. Invalid
selection or destination layout is rejected before numerical advance.

The packed page is a presentation transport, not a checkpoint and not accepted
authority. Snapshot admission, analysis, control warm start, and complete beat
metrics use exact model-owned state rather than reconstructing from samples.

## Checkpoint and cold boundaries

The public Standard checkpoint is a versioned, digest-bound envelope containing
accepted revision and `acceptedTimeSec`, the model-owned numerical checkpoint,
in-progress beat accumulation, and the most recently completed beat metrics.
Its nested numerical checkpoint owns accepted circulation, mechanics, rhythm,
event, and device state plus the configuration identities and bindings used to
bind continuation to the restore context. It does not expose the internal
typed-layout ID or an integer tick field. Canonical JSON digest validation,
malformed-input rejection, clock correlation, restore continuation, and
fixture binding are release gates.

Configuration values and persisted rhythm-transition metadata derived through
host transcendental functions cross a model-owned canonical-precision boundary
before they are hashed or persisted. This absorbs permitted cross-runtime ULP
differences without weakening checkpoint identity: restore still requires
exact equality of the canonical values within one release.

The public Standard checkpoint omits non-authoritative solver predictors.
Restore rebuilds those caches from admitted state. A private construction
checkpoint may carry additional tamper-evident diagnostic state, but it is not
the public durability contract.

Capture validation, Snapshot admission, formal analysis, explicit observation,
and restore may rehydrate a complete public object. These are cold boundaries;
their allocation cost is not returned to every live tick.

## Scientific release gates

A candidate exact release may become active only after it passes its declared
scientific corpus. At minimum, a numerical-authority or solver replacement
must cover:

- one-step candidate-versus-oracle node-volume differences within the
  predeclared tolerance;
- total-blood-volume, coronary-ledger, and flow-continuity limits;
- deterministic accepted clock and scheduled-event order;
- rejected-step and failed-candidate atomicity;
- checkpoint round-trip and continuation;
- periodic settlement and healthy morphology corridors;
- the valve-disease numerical robustness envelope with zero finite-difference
  fallback on the admitted analytic path;
- controls, control warm start, analysis isolation, and all primitive outputs;
  and
- representative one- and multi-Scenario physical-device reports.

Tolerance values belong beside the executable gate that enforces them. They
must be frozen before comparing a replacement; they are not loosened in
response to a candidate result.

Free-running trajectories can diverge after a solver change even when both
methods solve the same local equations. Reviews therefore separate local
equation/root evidence, conservation and event invariants, morphology and
output policy, and exact continuation within each release. A reference sequence
hash is not, by itself, the definition of physiological correctness.

Passing these gates establishes declared numerical behavior, not clinical
validation. The active model remains `releaseReady: false` and
`simulationReady: false` until its independent scientific program says
otherwise.

## Physical-device gate

The numerical gate is measured in the dedicated Worker on a physical supported
device. Page-only browser CPU throttling is not a substitute because it does
not reliably throttle dedicated Workers.

DESIGN-STUDIO-005 owns the current thresholds: bounded group lag and backlog,
at least 10% measured compute headroom at the supported Scenario count,
control-to-visible-result and graph-presentation latency, Canvas budget,
retained-memory stability, and physical-device qualification. Reports must
separate numerical advance, Worker round trip, presentation, and background
contention, and include a minimum ten-minute retained-memory/thermal run on the
named device tier.

One- and multi-Scenario Workbench, Article peek, control changes, background
analysis, restore, and capture are separate lanes. The Group TimeConductor
calibrates one shared capability ceiling and initial rate for all live
Scenarios. After calibration it never silently lowers an explicit selection.
If capacity later deteriorates, every Scenario slows together, every accepted
frame remains ordered, and the UI shows a performance warning. It does not let
waveforms drift apart, re-anchor a lane, or discard elapsed model time behind a
nominal `Live` label.

The path to the current boundary was empirical: the object runtime initially
needed about `41–43 ms` to produce `32 ms` of model time on an iPhone 16 Pro
Max; packed transport alone did not improve that cost; direct typed authority
and the condensed solve produced roughly a threefold host improvement; and a
post-cutover two-Scenario phone report measured numerical advance p95 near
`15 ms`. Individual release diaries and raw reports remain in Git history.

## Future model extension rules

The present release does not add AV-plane displacement, autonomic reflexes,
oxygen transport, multipatch myocardium, Fontan circulation, or congenital
bypass topology. Those features require separate mathematical design and new
exact releases.

### Oxygen delivery and balance

Oxygen content, transport, consumption, and balance enter as explicit state
owners with declared units, conservation laws, and coupling to flow. A slower
oxygen timescale may use multirate integration only after comparison with a
sufficiently small-step single-rate reference. UI sampling never substitutes
for integration.

### Autonomic reflexes

Autonomic state owns its delays, filters, efferent targets, saturation, and
event/update schedule. It must not hide controller state inside controls or
presentation. Baseline-off behavior, activation transients, intervention
directions, and interaction with authored controls receive dedicated gates.

### Multipatch myocardium

Patches use stable semantic identities and a structure-of-arrays numerical
layout. The scalar `f64` implementation is the scientific reference. SIMD or
parallel evaluation is admitted only after scalar parity and only when lane or
reduction order cannot change accepted semantics.

Land remains a component-owned constitutive kernel. Adding patches should
instantiate admitted patch bindings and workspace, not copy a chamber-specific
hot loop or create a new accepted authority.

### Topology and congenital pathways

New compartments and bypasses extend the declarative node/path graph and its
component catalog. Each topology declares conservation ownership, path law,
direction/sign convention, state slots, initialization, checkpoint meaning,
and failure gates. Unsupported topology fails during compilation or binding;
the runtime does not silently ignore a path.

### AV-plane displacement and other mechanics

AVPD changes mechanics and chamber coupling and therefore belongs to a future
mechanical model, not to this performance refactor. It must enter through a
model-owned component contract and consistent tangent/residual evidence. The
current static-condensation choice does not preclude that work, but it does not
validate it either.

## Solver and integration changes

The current `2 ms` backward-Euler method is not assumed optimal forever.
TR-BDF2, SDIRK2, another L-stable method, sparse/block factorization, or a new
globalization policy is eligible only as a separately reviewed numerical-model
change with a new exact release.

Before changing integration order or step policy, the dt-halving lane must
quantify not only scalar outputs but morphology such as E/A timing, atrial
figure-eight shape, pulmonary-venous S/D/Ar, valve events, and the aortic
dicrotic notch. Performance work never changes `dt` only on slower devices.

WASM, SIMD, `SharedArrayBuffer`, and Worker parallelism are optional
implementations. They require a measured device benefit and the same scientific
gates. Porting an object graph directly to WASM is not useful if it preserves
allocation and solver structure. Cross-engine transcendental behavior must be
measured before promising bit identity across JavaScript and WASM engines.

## Rejected shortcuts

- Increasing `dt` only on phones changes the scientific model.
- Interpolating skipped states creates values the solver never accepted.
- Treating Canvas FPS as the numerical gate ignores Worker capacity.
- Running two authorities for one live Scenario creates ambiguous ownership.
- Decoding old checkpoints inside a new exact release weakens exact identity.
- Starting with multirate solely as a performance switch mixes model science
  with presentation policy.
- Special-casing today's chamber, coronary, or path count in a generic runtime
  makes every future model repeat the optimization from zero.

## Retention and cleanup

The Standard-61 exact release candidate satisfies this authority boundary.
Before release, all official Article/Snapshot placements were re-created on
Standard-60 and the obsolete model/content rows were pruned transactionally.
The execution-plan-free and frame-per-step compatibility paths have therefore
been deleted. The generic exact loader remains an identity-preserving loader
for future immutable releases that implement the current Standard ABI; it is
not a compatibility interpreter.

Nonproduction bridges, benchmark-only runtimes, rejected solvers, and release
diaries belong in Git history. A retained older implementation must be reached
by an immutable production pin or imported by a named scientific replacement
gate. Names such as `legacy`, `shadow`, or `reference` do not decide retention;
actual reachability and evidence ownership do.
