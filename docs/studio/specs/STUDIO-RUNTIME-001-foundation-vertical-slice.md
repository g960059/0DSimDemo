# STUDIO-RUNTIME-001 — foundation vertical slice

Status: headless foundation implemented; MainWire Studio adapter pending
Date: 2026-07-24

## Purpose

Prove the Studio-owned orchestration boundary without changing the existing
React product or creating a second scientific runtime.

The slice is headless:

```text
Studio contract
  → SimulationSessionCoordinatorV1
    → SimulationRuntimePortV1
    → existing engine/scientific adapter
```

The coordinator and contract tests use a deterministic fake port. The Model
Platform now exposes the control-aware exact checkpoint V4 required by a real
MainWire adapter; that adapter is the next integration step.

## Scope

- one SimulationSession aggregate with one or more branches;
- opaque model, input, snapshot, signal-channel, and artifact refs;
- opening a branch from an exact snapshot and exposing its first point;
- an automatic live command and strict steady command for every target change;
- Studio-owned target generations and late-result discard;
- a latest-generation steady candidate that never auto-promotes;
- explicit session promotion and immutable artifact pinning;
- metrics marked `collecting` until a complete beat;
- a content-addressed in-memory store for contract and orchestration tests.

## State invariants

For each branch:

```text
targetGeneration >= 0
presentationRevision advances on target intent and successful promotion
displayed snapshot is changed only by open/reset/explicit promote
candidate is usable iff candidate.generation === targetGeneration
late live and strict events require generation and presentationRevision
canonical snapshot records contain no display-beat sample array
```

## Target-change sequence

```text
applyParameterPatch(branches, patch)
  → allocate one atomic intent id
  → increment every target branch generation
  → runtime.startLive(branch, generation, patch)
  → runtime.startStrictSteady(branch, generation, patch)

strict completion
  → generation mismatch: discard
  → generation match: retain candidate, do not display it

promoteSteadyCandidate
  → reject when no current-generation candidate
  → runtime transactionally installs the snapshot and supersedes older live work
  → advance presentationRevision and replace the branch display with one point
```

Implementations may coalesce not-yet-started strict jobs during a drag, but
coalescing must not alter these observable semantics. Failed promotion leaves
the runtime and presentation revision unchanged. A live result that crosses the
transport boundary after successful promotion is discarded by its older
presentation revision.

## One-point contract

Opening a branch yields one model-produced observable point immediately. It
does not yield a synthetic preceding cycle. Waveform and loop data channels
then append forward samples. Window metrics are:

```text
collecting → complete
```

only after a complete model-defined beat boundary.

## Artifact boundary

The coordinator stores envelopes and returns refs. The content-addressed store
hashes canonical bytes and deduplicates equal content. Run, assessment, and
certification remain different artifact kinds; this slice must not model them
as mutable states on one record.

## MainWire integration status

The current exact-checkpoint V3 path intentionally rejects
`research-control-target-state-v0`. The protocol reports
V3 as unavailable for a control-edited session. This slice adds a separate,
additive V4 path rather than weakening V3.

V4 binds:

- scientific release and base resolved input identity;
- complete research-control target state and its digest;
- parameter epoch;
- accepted numerical transaction and tracker state;
- canonical phase and state-codec identity.

V3 official checkpoint behavior remains unchanged. V4 emit/restore,
step/re-checkpoint/re-fork, tracker continuation, identity-substitution
rejection, and browser fail-closed behavior are covered by focused tests.

The remaining boundary is `MainWireSimulationRuntimeAdapterV1`: it must map
Studio’s atomic N-branch target intent to runtime clones, live execution, strict
settlement, V4 SnapshotEnvelope refs, and one-point projections without leaking
MainWire types into Studio contracts.

## Acceptance tests

1. open exposes exactly one initial point and `collecting` metrics;
2. one patch starts live and strict work automatically;
3. a multi-branch patch carries one intent across every target;
4. a superseded generation cannot publish live output or a candidate;
5. current strict completion creates a candidate without changing display;
6. promotion is explicit and rejects an obsolete candidate;
7. same-generation late live completion cannot overwrite a promoted display;
8. pinned canonical artifacts contain no last-beat sample history;
8. equal artifact bytes resolve to the same content ref.
