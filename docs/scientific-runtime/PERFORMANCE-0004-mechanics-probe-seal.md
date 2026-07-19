# Mechanics candidate probe → seal

Status: accepted local optimization experiment
Scope: scientific TypeScript runtime, no constitutive equation or state schema change

## Decision

Keep the optimization.

The circulation Newton solve now receives an opaque mechanics candidate probe.
Discarded candidates expose only the four transmural pressures, the optional
same-candidate pressure tangent, and minimal convergence diagnostics. Material
state serialization, fingerprinting, and rich-readback validation happen only
after circulation selects one exact candidate. The selected candidate is then
sealed into the unchanged `WholeHeartMechanicsTrialV1` public contract before
either circulation or mechanics is committed.

The canonical five-wall provider explicitly opts into two independent hot-path
capabilities: a trusted read-only prepared snapshot and exclusive ownership of
every returned trial result. Both contract defaults remain defensive. A legacy
provider that reuses mutable scratch state or readback therefore keeps the old
immediate-snapshot path; it cannot create a deferred probe accidentally. The
canonical opt-ins are valid because the provider treats the aggregate accepted
state as read-only, clones every mutable wall state before each constitutive
candidate evaluation, and never reuses a returned result. These capabilities
are independent of the current Land state length, TriSeg state layout, and
future coronary, reflex, or device state blocks.

## Atomic and ownership boundaries

- A probe is an unforgeable live object backed by a private `WeakMap` entry.
- A probe can be sealed successfully only once and only by its exact originating
  prepared-step object.
- Material state and rich readback are absent from the public probe.
- Deferred probes require an explicit `exclusive-result` provider capability.
  Such a provider may not reuse or mutate returned state, diagnostics, or
  readback. All non-opted-in providers snapshot state and rich readback before
  the next candidate evaluation.
- Invalid rich readback or non-serializable selected state still fails closed
  before either accepted owner is promoted. Seal, coupled validation, and both
  pure commit stages are caught as an explicit finalization failure with the
  exact prior accepted pair returned as the atomic rollback state.
- The public trial, checkpoint, accepted-state fingerprint, and commit-time
  mutation audit are unchanged.
- A failed circulation solve does not seal any valid discarded probe. Its
  rollback state remains identical to the source accepted state.

Regression coverage includes a compatibility provider that deliberately reuses
the same mutable material state and readback for consecutive candidates, plus
selected-candidate malformed-readback and codec-failure rollback cases.

## Work removed from discarded candidates

For every discarded outer Newton candidate, the runtime no longer performs:

- whole-heart candidate-state clone;
- state encode and recursive serializability walk;
- canonical serialization and candidate fingerprint;
- recursive rich-readback validation.

The selected candidate still receives the full defensive snapshot and is
re-fingerprinted at commit. This preserves the existing post-seal mutation
check instead of trading robustness for another small speed gain.

## Warmed alternating A/B benchmark

Both revisions used the same benchmark instrumentation:

- one unmeasured warm-up beat;
- three measured beats, 1,500 steps at `dt = 2 ms`;
- seven runs per revision in alternating AB/BA order;
- hashes computed after the timed interval;
- identical release, preset, machine, and process command.

| Median of seven | #483 base | Probe → seal | Change |
|---|---:|---:|---:|
| Throughput | 800.24 step/s | 847.35 step/s | +5.89% |
| Integration time | 1,874.43 ms | 1,770.22 ms | -5.56% |
| Step p50 | 1.1289 ms | 1.0470 ms | -7.25% |
| Step p95 | 1.8117 ms | 1.6816 ms | -7.18% |

All fourteen runs produced exactly the same values for:

- observation trajectory SHA-256:
  `fc98210f1c1899798efd47b41263c3bd2a0a0857764c4513e41752538f0e7f3b`
- diagnostic trajectory SHA-256:
  `d9005bd306f401c565f4d8355e554e9875fb52510b9a16cb2e7676fa78961d0c`
- final exact checkpoint SHA-256:
  `1574fe8917b80d24f2c13554b466726a12ab8f2dd71b338d69f25930b5492c0f`

Mechanics iteration counts, callback counts, cache hits, and circulation
residual distributions were also identical. The final ownership-compatibility
and rollback-hardened diff therefore passed the predeclared 5% warmed-median
throughput gate without changing the accepted trajectory.

## Reproduction

```bash
CIRCLEHEART_BENCHMARK_LABEL=candidate \
  npm run benchmark:scientific:session -- \
  --dt 0.002 --warmup-beats 1 --beats 3
```

The benchmark remains a local engineering measurement. It is not a supported
hardware claim and says nothing about clinical accuracy.

## Deferred work

Nested material readback is still constructed inside the provider's internal
TriSeg/material solve. Making that readback lazy would change constitutive
provider contracts and may retain large solver closures, so it is not included.
Further speed work should be profile-driven and must retain the same exact
trajectory/checkpoint hash gate. Rust/WASM and fixed state-layout kernels remain
premature while coronary, autonomic, device, and MultiPatch states are evolving.
