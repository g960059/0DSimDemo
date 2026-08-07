# DESIGN-STUDIO-005: Live graph performance

Status: active implementation and measurement contract

This document defines the Workbench and Reader live-presentation performance
boundary. It does not change the numerical model, accepted-step semantics, or
Snapshot qualification.

## Invariants

- The Worker remains the sole numerical owner.
- Every numerical step remains an exact accepted 2 ms step.
- PV points retain pressure and volume from the same accepted state.
- Waveform reduction retains the exact bucket terminal plus exact-time
  first/minimum/maximum values.
- Performance work may change delivery and paint cadence, but must not invent
  interpolated scientific states or use a visual cache for qualification.

## Pipeline

```text
persistent Scenario Worker
  → exact accepted frame batch
    → optional multi-Scenario commit coalescing
      → graph-owned scalar materialization
        → renderer-specific presentation store subscription
          → memoized projection
            → Canvas paint
```

One Scenario bypasses the multi-Scenario coalescing deadline. Multiple
Scenario lanes still share one short commit boundary so React never receives
one independent commit per Worker.

The store materializes only outputs used by authored graph panes. Output cards
read the latest validated frame directly. If an author adds a new graph item,
its live history begins with subsequent exact frames; no synthetic backfill is
created.

## Diagnostic mode

Diagnostics are off by default and retain timings only—never frames, outputs,
fixtures, checkpoints, or user content.

Open a Workbench with:

```text
/ja/experiments/new?workbenchPerf=1
```

Then inspect or reset the rolling metrics in browser developer tools:

```js
window.__circleHeartWorkbenchPerfV3.snapshot()
window.__circleHeartWorkbenchPerfV3.reset()
```

The snapshot includes:

- Worker request/response duration, including transport and response validation;
- scheduler and runtime presentation intervals;
- multi-Scenario coalescing duration;
- frame-to-scalar materialization and presentation-store append duration;
- Workbench-area React commit duration and interval; and
- Canvas draw duration and meaningful display interval by renderer.

Each metric reports count, mean, rolling p95, maximum, and latest duration.

## Presentation cadence

The default smooth profile uses eight exact samples per Worker batch, making
each batch one 16 ms presentation boundary. There is no second wall-clock
coalescing gate after the Worker response. This changes no numerical step,
output meaning, or PV tuple identity.

The production-preview A/B measurement on the reference development device
found:

- one Scenario: 16.1 ms mean display interval and Canvas p95 at or below
  0.4 ms;
- four simultaneous live Scenarios: 20.5 ms mean display interval, Canvas p95
  1.2 ms, and Worker round-trip p95 16.1 ms; and
- the former double-gated balanced path: about 48 ms mean display interval.

The user does not choose a performance mode. A diagnostic balanced profile of
16 exact samples per 32 ms batch remains available through:

```text
?workbenchPerf=1&workbenchPresentation=balanced
```

If future target-device traces show that the smooth profile reduces model-time
ratio or increases long-tail Worker round trips, use the balanced profile as a
comparison and consider a bounded Canvas presentation clock that drains
already-accepted exact samples. Do not introduce WebGL or OffscreenCanvas until
diagnostics show Canvas raster time—not allocations, projection, React
commits, or Worker transport—is the dominant budget.

## Acceptance targets

- Numerical model-time ratio remains at or above 1× in the supported Scenario
  count on the reference device.
- Canvas p95 draw duration stays comfortably below the chosen display interval.
- No monotonic growth occurs in retained sample counts or subscriber counts.
- Pausing flushes the accepted prefix; resume never rewinds or duplicates it.
- Theme changes and unrelated root status commits do not recreate unchanged
  graph projections.
