# PERFORMANCE-0001: Current bottleneck and browser cutover gates

- Date: 2026-07-18
- Baseline release candidate: `circleheart/adult-five-wall-noncoronary@0.1.0`
- Baseline source: merged PRs #475–#478 at `f229143`
- Status: browser scientific alpha transport may proceed; production cutover is blocked

## Reproducible baseline

Run:

```bash
npm run benchmark:scientific:session -- --dt 0.002 --beats 1
```

The benchmark is measurement-only. It does not change model state schemas or
make a performance acceptance claim. A local run on 2026-07-18 measured:

| Measure | Result |
|---|---:|
| initialization | 214.4 ms |
| 500-step integration | 9,760.1 ms |
| throughput | 51.23 step/s |
| step p50 / p95 / maximum | 15.86 / 29.59 / 45.98 ms |
| mechanics Newton iterations, mean | 2.282 |
| mechanics callback calls/step, mean | 22.744 |
| mechanics callback cache hits/step, mean | 50.736 |

At this rate, 24–33 cold-settling beats require roughly 4–5.5 minutes. A Web
Worker prevents main-thread blocking, but does not shorten this duration.

## Hygiene slice result

The first bitwise-preserving slice was measured in one process after a
500-step JIT warm-up, followed by three fresh 500-step sessions. Median
integration time changed from 10,062.6 ms to 9,380.1 ms: 6.78% less wall time,
or 1.073x throughput. The accepted transaction checkpoint and diagnostic
sample remained bitwise identical to the merged #478 transaction at every one
of 500 steps.

This safe improvement is retained, but it does **not** pass the 1.5x hygiene
performance gate. The result strengthens the conclusion that allocation and
hash cleanup cannot make the browser runtime interactive; consistent tangents
and elimination of nested finite differences remain mandatory.

## Root cause

The dominant cost is nested finite differentiation, not rendering or Worker
transport:

```text
14-volume circulation Newton central difference
  -> about 22.7 unique whole-heart mechanics calls per global step
  -> two-coordinate TriSeg Newton central difference and final FD audit
  -> five Land + passive + SLS wall trials per mechanics candidate
```

With the measured Newton counts, this is approximately 1,867 Land/SLS wall
trials per global step, or about 0.93 million wall trials per 500-step beat.
CPU profiling attributes roughly 54% of self time to Land/material evaluation
and another 18–22% to mechanics, TriSeg, and contract work. Reverting only to
the earlier PR #475 execution structure would retain this amplification.

## Accepted optimization sequence

1. **Bitwise-preserving hot-path hygiene**
   - freeze graph/runtime validation at session construction;
   - hoist parameter hashes and valve validation out of candidate trials;
   - keep deep clone/fingerprint work at accepted-state and checkpoint borders;
   - replace stringified mechanics-cache keys with numeric tuple keys;
   - avoid generating or retaining dense observables during settling.

2. **Exact Land consistent tangent**
   - reuse the converged Land residual Jacobian;
   - compute the algorithmic stress tangent by implicit differentiation rather
     than solving Land again at strain plus/minus epsilon;
   - retain the existing exact one-state SLS tangent.

3. **Analytic TriSeg internal tangent**
   - assemble the two-by-two internal-coordinate tangent from material and
     geometry derivatives;
   - keep symmetry/stability checks on the analytic tangent;
   - move finite-difference comparison to tests or low-frequency shadow audit.

4. **Whole-heart pressure tangent and circulation Jacobian**
   - eliminate TriSeg coordinates by Schur complement;
   - expose the four-chamber pressure-volume tangent;
   - combine it with vascular PV, pericardium, edge-loss, valve, and root-flow
     derivatives in the 14-volume circulation Newton;
   - permit safeguarded finite difference only at declared branch boundaries.

The first layer must preserve accepted trajectories bit-for-bit. Consistent
tangent work keeps the equations but changes floating-point/Newton paths and
therefore requires a new numerical-runtime and release identity.

## Hard gates

- hygiene slice: bitwise lockstep and at least 1.5x warmed-median speedup;
- consistent-tangent candidate: at least 8x versus this baseline;
- browser production path: at least 500 step/s, stretch goal 1,000 step/s;
- official checkpoint restore plus terminal-cycle presentation within 1 s;
- nearby knob continuation to a promoted periodic solution: p95 3–5 s;
- browser command chunk: default four steps, permitting command boundaries in
  about 100 ms at the current baseline;
- main-thread transport work p95 below 16 ms and cancellation acknowledgement
  at a command boundary below 100 ms;
- unchanged TBV, continuity, rollback, atomicity, valve-event ordering, healthy
  and eight-valve-preset envelope, PV topology, and dt-halving gates.

Official presets should eventually ship an exact release-bound periodic
checkpoint. Knob changes continue from a compatible checkpoint; cold settling
is not the default browser interaction. Anderson/Poincare acceleration is a
later, separately identified protocol after the base kernel is faster.
