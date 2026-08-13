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

The current exact Standard release is:

```text
circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.standard-21
```

Standard-21 preserves Standard-20's equations, controls, checkpoint meaning,
accepted sequence, Newton selection order, and public trial ownership while
moving the common analytic Newton path's candidate numerical records into two
solver-owned pages. The current page is never written while line search uses
the other page; promotion swaps their roles only after Armijo acceptance.
Successful and failed public trials detach all retained values before the
workspace can be reused. Finite-difference fallback keeps independent
allocations because it must retain center/lower/upper vectors concurrently.
Alternating host measurements showed only a small, load-sensitive difference,
so this is a candidate-allocation and GC-pressure foundation rather than a
standalone speed claim.

Standard-20 had preserved Standard-19's equations, controls, checkpoint meaning,
accepted sequence, and Newton tie-breaking while removing diagnostic and
linear-algebra container churn. Mixed-residual auditing retains only its
single worst entry instead of freezing fifteen entries per iteration. Dense
pivot scaling and final residual maxima use in-order scalar loops rather than
temporary mapped arrays, and independent-volume/scaled-residual construction
avoids `Object.fromEntries(map(...))`. These loops preserve node order and
strict-greater tie selection. Development-host timing was too load-sensitive
to isolate a stable delta, so this is a bounded-allocation change rather than
a speed claim.

Standard-19 had preserved Standard-18's equations, controls, checkpoint meaning,
and accepted numerical sequence while removing a duplicate vascular
pressure-volume inverse from each analytic-Jacobian iteration. Each BE trial
snapshots its vascular laws once. Candidate evaluation obtains the exact
paired primal pressure and active-branch tangent from that law; the analytic
Jacobian consumes the retained tangent instead of inverting the same node at
the same candidate a second time. The conservative coronary companion shares
the same Ao pair. Both adaptive and fixed-32 law/node APIs are bit-identical
for every vascular node in the shipped graph, including saturation branches.
Five alternating 512-tick development-host runs reduced the typed-reference
median from about `2.489` to `2.458 ms/tick` (about 1.2%) and the object-Session
median by about 1.5%. This is a measured removal of repeated constitutive work,
not an iPhone qualification.

Standard-18 had preserved Standard-17's equations, controls, checkpoint meaning,
and accepted numerical sequence while reducing per-candidate infrastructure
around the non-coronary solve. The Session binds its typed accepted-state
source once rather than once per accepted substep, and that source fills the
solver-owned header and arrays without returning a transient record. One
candidate time now produces one respiratory-pressure frame shared by all
node, edge, companion, and analytic-Jacobian reads in that BE trial. The
mechanics memo keeps the same SameValueZero lookup semantics and diagnostic
counters in a flat small-entry list rather than constructing four nested Map
levels for every unique candidate. Exact source-versus-rollback comparisons,
finite-difference cache hits, public diagnostics, and failure ordering remain
intact. Alternating whole-kernel measurements were dominated by host load and
showed no stable speed delta, so this is a hot-allocation and repeated-work
cleanup rather than a device-speed claim.

Standard-17 had preserved Standard-16's equations, controls, checkpoint meaning,
and accepted numerical sequence while removing transient objects and repeated
validation/calculation from the four-valve candidate path. The typed solver
now calls a scalar valve entry point; frozen plain-data parameter objects retain
a successful validation by identity, whereas mutable and accessor-backed
objects always take the complete validation path. The public object API and
invalid-input readbacks remain intact. Opening-target, loss, and tangent
intermediates are scalar locals rather than short-lived frozen records. Paired
whole-kernel measurements were neutral within host noise (roughly ±0.5%), so
this is an allocation/ownership cleanup rather than a claimed device speedup.

Standard-16 had introduced a fail-closed typed
accepted-state read seam for the non-coronary nonlinear solver. The flat
reference runtime resolves the relevant fixed slots once, copies them into the
solver's reusable numerical workspace, and compares every scalar exactly with
the admitted rollback object before use. A divergent typed clock, TBV, volume,
dynamic flow, or valve opening is rejected before candidate evaluation. This
is an ownership-boundary milestone rather than a performance claim: paired
development-host measurements were about 1–2% slower while both authorities
are deliberately cross-checked. The next slice removes the duplicate object
authority rather than weakening that check in place.

Standard-15 had compiled the immutable coefficients of each pure-data
nonlinear venous pressure-volume inverse once per synchronous solve. The
shipped fixed-32 bisection still visits the same midpoint sequence and the
canonical 500-step accepted-state hash is unchanged. Mutable or accessor-backed
public laws retain the complete dynamic evaluation path.
Standard-14 had already compiled direct typed-completion readers and added an
exact all-rotary-support-off path. Disabled circuits still emit fresh
pressure-dependent diagnostics, while their canonical zero accepted flow,
node-rate, and Jacobian storage is shared. Standard-13 had already moved more
accepted-state ownership and candidate completion into the typed authority,
reused coronary solver scratch, sealed only selected mechanics candidates,
projected coronary pressure without diagnostic trees, and removed temporary
result-record allocations. These are execution and ownership changes rather
than new physiological claims, but the exact artifact bytes changed and
therefore receive a new `modelId`.

Fully validated, transitively frozen model-owned values still carry the
Standard-10 in-process identity proof. Mutable, partially validated, failed,
or externally supplied values take the complete validator path. A stamp-
disabled reference run remains the canonical counterfactual and must produce
the same accepted frames and exact checkpoints.

Standard-8's portable hemorrhage envelope remains intact: the shared
systemic-vein/vena-cava pressure-offset initializer supports the advertised
fixed total-blood-volume range down to `4200 mL`. These wider ranges remain
research controls, not clinical reference intervals or a validated shock-stage
model.

It pins:

- regular-sinus rhythm;
- normal-coronary configuration;
- all-off, zero-inertance mechanical support;
- eight model-owned warm-start inputs: systemic and pulmonary resistance,
  venous tone, arterial stiffness, regular-sinus heart rate, fixed total blood
  volume, PEEP, and ventricular contractility scale;
- the validation-stamped `hot-path-lean` Worker execution tier, whose accepted
  frames and exact checkpoints are locked against `full-invariant` execution;
- the Standard exact checkpoint codec v2, which wraps the numerical checkpoint
  together with in-progress beat-metric accumulation;
- 49 registered outputs: 35 accepted-state/accepted-step signals and 14
  complete-beat metrics;
- four unit-safe graph constructors: pressure sweep, flow sweep,
  pressure-volume, and on-demand bilateral Guyton/Starling orientation; and
- one public-executable Snapshot admission policy shared by Article placement and
  standalone publication.

There is no Parameter catalog or durable `ParameterSet`. The eight registered
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
not rehash the artifact during load or execution. There is one executable ABI:
`circleheart-exact-model-esm-v1`.

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

Snapshot admission is a Studio product policy rather than `modelId` identity.
Presentation lives in the separately versioned Model Surface, so ordinary
graph, Briefing, and admission work does not mint a new numerical model ID.

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
