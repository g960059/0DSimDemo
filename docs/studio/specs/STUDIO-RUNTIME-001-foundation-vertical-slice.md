# STUDIO-RUNTIME-001 — foundation vertical slice

Status: headless runtime foundation and MainWire Worker adapter implemented;
consumed by the product Workbench bridge and draft Reader Preview vertical
slices; browser performance qualification pending
Date: 2026-07-24

## Purpose

Prove the Studio-owned orchestration boundary without changing the existing
React product or creating a second scientific runtime.

This specification remains the headless foundation:

```text
Studio contract
  → SimulationSessionCoordinatorV1
    → SimulationRuntimePortV1
      → MainWireSimulationRuntimeAdapterV1
        → dedicated live Worker per branch
        → separate exclusive strict Worker lease per target
          → existing engine/scientific runtime
```

The coordinator is testable through a deterministic fake port. The production
MainWire path uses the control-aware exact checkpoint V4, exact control IDs,
resolved simulation-input artifacts, and a browser Worker host. It never
falls back to in-process execution. This slice itself contains no UI. Its
current browser consumer is documented in
[STUDIO-RUNTIME-002](STUDIO-RUNTIME-002-product-workbench-bridge.md); that
consumer is an initial existing-Workbench bridge, not the final Reader, Study
Lab, or Document Editor. The narrow Reader consumer and its trust boundary are
documented in
[STUDIO-CONTENT-001](STUDIO-CONTENT-001-reader-preview-vertical-slice.md).

## Scope

- one SimulationSession aggregate with one or more branches;
- opaque model, input, snapshot, signal-channel, and artifact refs;
- opening a branch from an exact V4 snapshot and exposing its one stored seed
  point without advancing the model;
- an automatic live command and strict steady command for every target change;
- Studio-owned target generations and late-result discard;
- a latest-generation steady candidate that never auto-promotes;
- explicit branch-candidate promotion and immutable artifact pinning;
- a continuous 1× live signal channel with accepted-boundary suspend/resume;
- terminal branch results for success, failure, supersession, and abort;
- metrics marked `collecting` until a complete beat;
- a content-addressed in-memory store for contract and orchestration tests.

## State invariants

For each branch:

```text
targetGeneration >= 0
presentationRevision advances on target intent and successful promotion
display replacement occurs at open, accepted live transition, and promotion
candidate is usable iff present, unconsumed, and generation === targetGeneration
successful promotion consumes the ephemeral candidate
late live and strict events require generation and presentationRevision
canonical snapshot = exact V4 checkpoint + resolved input ref + one seed point
canonical snapshot contains no beat history, metrics, or presentation state
```

Reset is a target-architecture transition, not an implemented command in this
foundation. The implemented aggregate lifecycle is `live → closing → closed`;
running/suspended is branch playback state, not session lifecycle.

## Target-change sequence

```text
applyParameterPatch(branches, completeResolvedTarget)
  → allocate one atomic intent id
  → increment every target branch generation
  → runtime.startTargetIntent(all target branches)
  → stop each affected live branch at an accepted command boundary
  → checkpoint and prepare every live/strict clone
  → cross the all-branch preparation barrier
  → replace each accepted live display with its first new-generation point
  → start live at 1× and strict settlement automatically

strict completion
  → generation mismatch: discard
  → P1 admission failure: branch failure, no candidate
  → generation match: retain candidate, do not display it

promoteSteadyCandidate
  → reject when no current-generation candidate
  → while playing, advance the old live trace to the candidate phase
  → runtime transactionally installs the issued snapshot
  → only after validation succeeds, supersede older live work
  → advance presentationRevision and replace the branch display with one point
  → clear the consumed ephemeral candidate
```

Implementations may coalesce not-yet-started strict jobs during a drag, but
coalescing must not alter these observable semantics. Failed promotion leaves
the accepted target, host, and presentation revision unchanged; old-live steps
already accepted while approaching the phase boundary remain ordinary streamed
advancement. A live result that crosses the transport boundary after successful
promotion is discarded by its older presentation revision.

Each live and strict branch result terminates as `success`, `failure`,
`superseded`, or `aborted`. `superseded` and `aborted` are expected lifecycle
completion, so they neither reject the aggregate lane promise nor populate the
user-visible numerical failure field. No `stale` or `available` steady-job
state is persisted or exposed as UI state; current candidate availability is
derived from an unconsumed candidate and generation equality.

The UI resolver may accept a partial edit, but the runtime command always
carries the complete resolved model-control map and its digest. A later edit is
resolved against the latest desired target, not whichever older generation has
already reached the accepted numerical branch. This makes rapid cross-control
supersession deterministic.

## One-point contract

The MainWire SnapshotEnvelope stores exactly:

1. one exact control-aware checkpoint V4;
2. the content-addressed ref of the resolved simulation input bound by the
   checkpoint base-input digest;
3. exactly one full accepted-step observable frame with the same release,
   revision, and accepted time as the checkpoint.

Opening and successful promotion project that stored frame without taking a
numerical step. An accepted live target transition instead takes one forward
step and uses that result as the sole first point of its new stream epoch.
None of these transitions yields a synthetic preceding cycle. Waveform and
loop data channels then append forward samples. Window metrics are:

```text
collecting → complete
```

only after a complete model-defined beat boundary. The canonical envelope
never stores one beat of samples, window metrics, or presentation state.

## Worker and signal-channel contract

One live scenario branch owns one dedicated Worker host. Each strict target
owns a separate exclusive Worker lease, because one Worker kernel serializes
commands and would otherwise block the foreground behind settlement. For a
multi-branch intent, every live/strict clone must be prepared before either
lane advances.

The live Worker emits high-frequency batches on a branch-bound signal channel
at 1× physiological time. The control-plane state retains only first/latest
points, point count, and window-metric state. Suspend waits for the current
accepted command boundary. Resume continues the same accepted numerical state
and the same stream epoch; target replacement and successful promotion create
a new epoch. The coordinator installs the new one-point state before explicitly
activating that epoch, so even an immediate first batch cannot race the state
replacement. A current-epoch Worker failure, malformed batch, sequence gap, or
metric regression fails closed by suspending that branch; an explicitly stale
identity is discarded. Strict work remains independent of playback suspension.
Pacing uses one cumulative wall/model-time deadline within an epoch, so a short
stall can be caught up instead of becoming permanent drift. The maximum
unreported lag is predeclared as one canonical cycle (1,000 ms in this release).
Exceeding it re-anchors the pacing epoch rather than continuing to label a
slower trace as 1×: the accepted chunk is still published, model timestamps and
step counts are never rewritten, the lane keeps running, and the discarded
wall/model separation is reported as degraded pacing with a cumulative total.
Sustained sub-1× compute — ordinary with several scenarios live at once — is a
reported operating state, not a lane failure. Pacing returns to `realtime-1x`
only after a full canonical cycle of throughput at or above 1× with no further
re-anchor. Likewise, a signal observer exception
is reported once through that failure channel to all subscribers and never
causes a silent detach or loss of the accepted numerical state.

Every Worker observable frame is validated against the exact frame/registry
schema, release, source, complete observable catalog, finite-value,
availability, and quality contract before projection. If a multi-step Worker
command fails after accepting some steps, that validated partial progress
becomes the branch's last accepted hosted state before the branch fails closed;
the Worker and host-side accepted-state identities therefore never diverge.

## Strict candidate admission

Strict settlement is allowed to create a candidate only when its receipt is
`period1-converged`, `periodicSteadyStateClaimed` is true, and
`period2OrbitSuspected` is false. The receipt's retained closure evidence,
completed-beat count, anchor, and P1 classification must agree with the exact
checkpoint's periodic tracker, retained boundary transactions, and terminal
transaction. A zero-beat claim or identity-only checkpoint is insufficient.
This period-1 (P1) numerical admission does not run or imply morphology,
conservation, case-specific Assessment, or Certification. A matching candidate
remains ephemeral and off-display until the user explicitly promotes or pins
it.

## Artifact boundary

The coordinator stores envelopes and returns refs. The content-addressed store
hashes canonical bytes and deduplicates equal content. Run, assessment, and
certification remain different artifact kinds; this slice must not model them
as mutable states on one record.

The JSON store also supports an atomic batch boundary: every entry is detached,
validated, and hashed before a final synchronous commit, and cancellation is
checked immediately before that commit. Bootstrap stages its dependent input,
snapshot, lineage, and run graph privately, then exposes the complete graph as
one batch so cancellation cannot leave a partially materialized source.

Opening requires a canonical `StudioRunArtifactContentV1`, not merely the
existence of a run ref. Its input, snapshot, target digest, execution identity,
claims, and parent-run ref are validated against the requested source before a
Worker is allocated. Promotion accepts only the exact candidate issued by the
adapter’s successful current-generation strict lane.

## MainWire integration status

Studio accepts the MainWire exact-checkpoint V4 path only. There is no V3
fallback, compatibility reader, control-name alias, or migration adapter in
the Studio boundary.

V4 binds:

- scientific release and base resolved input identity;
- complete research-control target state and its digest;
- parameter epoch;
- accepted numerical transaction and tracker state;
- canonical phase and state-codec identity.

`MainWireSimulationRuntimeAdapterV1` maps Studio’s atomic N-branch target
intent to prepared runtime clones, live execution, strict settlement, V4
SnapshotEnvelope refs, one-point projections, explicit promotion, and signal
channels without leaking MainWire types into Studio contracts.

This is a user-zero greenfield cutover. Reusable mathematical runtime code is
retained, but old Studio schemas and content do not define a production
compatibility contract. Physical repository separation remains an independent
follow-up decision. The initial product Workbench wiring is implemented
separately in
[STUDIO-RUNTIME-002](STUDIO-RUNTIME-002-product-workbench-bridge.md); final
product contexts remain follow-up work.

## Acceptance criteria

1. open validates exact V4 checkpoint, input, and snapshot binding;
2. open exposes exactly one same-revision/time initial point and `collecting`
   metrics without a numerical step;
3. one patch starts live and strict work automatically;
4. a multi-branch patch crosses one preparation barrier before any lane runs;
5. a superseded or aborted branch terminates without becoming a runtime
   failure;
6. a superseded generation cannot publish live output or a candidate;
7. strict output requires P1 admission and creates a candidate without
   changing display;
8. promotion is explicit and rejects an obsolete candidate;
9. same-generation late live completion cannot overwrite a promoted display;
10. the signal channel advances against a cumulative 1× deadline within an
    epoch, catches up bounded transient lag, and beyond the declared one-cycle
    lag budget re-anchors that epoch — publishing the accepted chunk, keeping
    the lane running, reporting degraded pacing, and retaining the discarded
    separation as a cumulative deficit — returning to 1× only after a full
    cycle at or above 1× with no further re-anchor; suspend/resume preserves
    numerical state and stream epoch;
11. pinned canonical artifacts contain no last-beat sample history;
12. equal artifact bytes resolve to the same content ref;
13. source run content is lineage-validated before open;
14. current-epoch signal corruption, Worker failure, or observer publication
    failure is reported through the signal failure channel and suspends the
    branch without silently detaching the observer;
15. running promotion reaches the candidate phase before its one-point swap.
