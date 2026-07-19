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

The prepared handle is also a one-shot transaction capability. Each emitted
trial is privately bound to the exact handle that produced it; a forged trial,
a trial from another same-time/same-provider handle with a different drive,
evaluation after successful promotion, and duplicate promotion all fail
closed. A failed promotion does not consume the handle, so validation failure
cannot silently alter accepted ownership.
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

PR #484 subsequently added the deferred candidate probe-to-seal path described
in `PERFORMANCE-0004-mechanics-probe-seal.md`. The non-coronary transaction uses
that path directly, while the provisional V2 coronary transaction intentionally
continues through the materialized compatibility trial because same-candidate
IMP evaluation requires active-stress and fiber-strain rich readback for every
outer candidate. Both paths retain the exact-context, one-shot capability
hardening described above. The 66.9% V2 step-time reduction below also includes
the implicit coronary sensitivity and exact-zero direction elision and must not
be attributed to the prepared context alone.

The rapid two-to-five-beat TBV path remains presentation-only evidence. When
the V2 coronary transaction enters the scientific runtime, rapid refinement
must include all 31 blood-volume owners, six tone states, and accepted MVC
reference memory in its drift assessment; it cannot reuse the legacy 68-state
P1 closure or promote a rapid point as canonical periodic evidence.

The provisional V2 transaction now also supplies the outer circulation Newton
with a full same-candidate coronary directional sensitivity. For each scaled
outer variable, the converged 16-volume coronary residual satisfies

\[
\frac{\mathrm dV_{cor}}{\mathrm dx}
=-\left(\frac{\partial R_{cor}}{\partial V_{cor}}\right)^{-1}
\frac{\partial R_{cor}}{\partial x}.
\]

Ao pressure and all four chamber directions are differentiated through the
same prepared Land/TriSeg evaluation, common pericardium, CEP/Land/SIP
boundary resolver, collapse law, and stenosis law. The other nine vascular
directions are recognized only when both boundary probes are exactly equal to
the base boundary; their zero derivative then skips direction probes and the
linear solve without using a numerical near-zero threshold. A development
full-FD shadow gave maximum absolute Jacobian difference `2.09e-6` and relative
Frobenius difference `1.03e-6`.

On the same local machine and the same 20 canonical 2-ms steps, the pre-Schur
full-FD commit required `53.686 ms/step` (`26.843 s` wall time per simulated
second), whereas the implicit companion path required `17.768 ms/step`
(`8.884 s` per simulated second), a 66.9% step-time reduction. Outer candidate
mechanics evaluations fell from typically 19--28 to 3--5. This is a local
development profile, not a supported-hardware claim, and it remains too slow
to reuse PR #483's ten-second multi-target rapid-preview budget. V2 browser
adoption therefore remains gated on further solver work and independent
end-to-end measurement.

The canonical V2 cold-start runner subsequently reached complete 94-entry P1
at beat 27 for both 2-ms and 1-ms integration, requiring 13,500/13,500 and
27,000/27,000 atomic commits respectively. The last three accepted boundaries
(beats 25--27) all passed; neither run was classified as P2. Wall times were
159.6 s and 295.8 s on the same local machine. These are canonical scientific
execution measurements, not browser latency targets. Separate within-dt P1
does not by itself establish cross-dt state or waveform agreement.

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
