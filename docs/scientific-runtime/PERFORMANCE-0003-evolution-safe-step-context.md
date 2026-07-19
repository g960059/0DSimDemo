# PERFORMANCE-0003: evolution-safe per-step optimization

- Date: 2026-07-19
- Candidate release: `circleheart/adult-five-wall-noncoronary@0.2.0`
- Scope: transaction/contract execution only; no constitutive equation or
  numerical tolerance change
- Status: local A/B and deterministic focused tests passed; supported-hardware
  and browser end-to-end performance gates remain separate

## Decision

The model is still evolving toward coronary circulation, autonomic control,
assist devices, and multipatch myocardium. This slice therefore optimizes a
stable boundary shared by those models: validation and ownership of an
accepted mechanics state during one outer circulation step. It does not
hard-code the current state dimension, specialize the Land/TriSeg equations,
replace TypeScript with WASM, or introduce a fixed current-model Jacobian.

The public boundary remains strict. Provider identity, accepted-state shape,
serializability, and the material-state fingerprint are audited when a step is
prepared. Newton candidates then reuse a private, defensively cloned baseline
through a short-lived branded context. Every provider call still receives its
own clone. The selected candidate is re-fingerprinted at commit, so mutation
between evaluation and promotion remains an error. Checkpoint, restore, and
standalone public APIs retain their full audits.

Driving inputs remain zero-copy for the current deeply immutable calcium
payload. The provider contract now also exposes an optional clone hook: future
mutable autonomic, coronary, or device drive payloads can be snapshotted once
at preparation and cloned per callback without teaching this transaction about
their state layout.

### Coronary transaction alignment

The same prepared mechanics context is used by the V1 and provisional V2
coronary transactions. This reuse is deliberately limited to the accepted
mechanics baseline and immutable calcium drive. Every outer Newton/finite-
difference probe still solves coronary hydraulics from the same previous
accepted coronary state, and its IMP/SIP boundary is recomputed from that
probe's same-candidate chamber mechanics. No coronary candidate, boundary, or
tone state is cached across probes.

The rapid two-to-five-beat TBV path remains presentation-only evidence. When
the V2 coronary transaction enters the scientific runtime, rapid refinement
must include all 31 blood-volume owners, six tone states, and accepted MVC
reference memory in its drift assessment; it cannot reuse the legacy 68-state
P1 closure or promote a rapid point as canonical periodic evidence.

## Profile result

A 5,000-step CPU profile and a 500-step call-count profile found that repeated
contract work, rather than the circulation matrix, dominated the safe
optimization opportunity.

| Hot path | Observed work per step | CPU self share |
|---|---:|---:|
| whole-heart fingerprint | 16.66 calls | part of 11.3% contract total |
| mechanics state encode | 100.4 calls | part of 11.3% contract total |
| recursive serializable validation | 2,522 calls | part of 11.3% contract total |
| Land/SLS state validation and clone | 580.8 validations | 8.65% |
| analytic circulation Jacobian | 2.42 assemblies | 0.86% |
| dense circulation solve | 2.42 solves | 0.52% |
| circulation graph construction | 1 call | 0.19% |
| accepted-step diagnostic sampling | 1 call | 0.11% |

Physical TriSeg and Land work remains the largest aggregate cost, but changing
those kernels now would have a higher rework and scientific-regression risk.
Graph caching and fixed-size matrix work were also rejected for this slice
because their combined measured opportunity was below 2%.

## Local A/B result

The same 3-beat, 1,500-step benchmark was run three times sequentially in the
parent worktree and three times with the prepared-step context.

| Measure (median of three) | Parent | Prepared context | Change |
|---|---:|---:|---:|
| throughput | 678.62 step/s | 782.26 step/s | +15.27% |
| integration wall time | 2,210.37 ms | 1,917.53 ms | -13.25% |
| step p50 | 1.3223 ms | 1.1253 ms | -14.90% |

Mechanics iteration counts, callback counts, circulation residual
distributions, and final accepted state were exactly unchanged in the A/B
benchmark. Focused tests also cover checked-versus-prepared trajectory equality,
mutation of the caller's accepted typed array after preparation, and mutation
of a candidate before commit.

After the drive-snapshot and worker-correlation hardening, a separate three-run
smoke produced a median 803.23 step/s, 1,867.46 ms integration time, and 1.1015
ms step p50 with unchanged iteration counts, callback counts, residuals, and
final state. This later run is intentionally not used for a cross-time speedup
claim; the sequential A/B table above remains the comparison evidence.

## Deferred work

Rich material readback is still produced for many Newton candidates that are
discarded. A future lazy-readback capability could save an estimated additional
4–8%, but it crosses more provider and diagnostic contracts and is deliberately
deferred until the coronary branch and current transaction refactor settle.
Worker-local scratch ownership is similarly deferred. Both should be expressed
as generic provider/session capabilities, not as assumptions about the present
Land/TriSeg state layout.

## Reproduction

```bash
npm run benchmark:scientific:session -- --dt 0.002 --beats 3
```

This remains a local measurement-only command. It is not a supported-hardware
performance claim.
