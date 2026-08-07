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

## Trusted live transport boundary

The bundled persistent Worker is the authority for a live simulation lane. It
fully validates every adapter frame before that frame enters the transport
response. Repeating the same recursive ownership pass both while posting the
response and again on the main thread scales with every output value in every
frame, even though the Worker has already established their validity.

The hot `advanced` response therefore uses a narrower trusted decoder on both
sides of the dedicated-Worker boundary. It still validates the exact response
and frame keys, protocol and request correlation, model/runtime/Scenario
identity, input epoch, accepted revision, accepted time, frame count, and that
the output map is a plain data object. It does not recursively clone, freeze,
or revalidate each already-validated output record on every presentation
batch.

This exception applies only to exact live advances emitted by the bundled
runtime. Initialize, control, analysis, capture, Snapshot, authoring, storage,
registry, and other lifecycle responses continue through the full deep
validator. The client also retains its expected identity and monotonic-clock
checks before accepting an advanced batch. Public protocol validation remains
deep by default.

This is a validation-cost reduction, not yet a compact binary transport: the
Worker still sends structured-cloned object frames. A transferred typed-array
batch remains a later option if target-device measurements show structured
clone or allocation to be the remaining bottleneck.

An isolated production-preview reference run on the M5 Max development device
measured about 30 ms Worker round-trip p95 and 1.04× recent model-time ratio for
one live Scenario. With four simultaneous live Scenarios, recent ratios were
about 1.03–1.04× per lane, per-lane Worker round-trip p95 was about 33–35 ms,
Canvas draw p95 was about 1.3 ms, and a Heart-rate edit reached the visible
output in about 108 ms. These are regression references only; target-tier
device traces remain required for low-end and mobile support claims.

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
- per-Scenario model-time/wall-time ratio and model-to-wall lag;
- bounded catch-up batch and active overload re-anchor counts; and
- frame, output and primitive-value counts at the Worker delivery boundary.

Duration metrics report count, mean, rolling p95, maximum, and latest
duration. Unitless values additionally report lifetime mean, rolling mean,
rolling p05/p95, minimum and maximum; discrete events are exposed as counters.
Use rolling mean and p05 when judging steady-state model-time ratio so startup
analysis and Scenario creation do not dominate a long-lived session.

## Presentation cadence

The default smooth profile computes sixteen exact samples per Worker request,
amortizing transport and response processing across 32 ms of model time. Once
the response has been accepted, the scheduler publishes its exact ordered
prefix as two eight-frame slices separated by a 16 ms presentation boundary.
This preserves every accepted sample while keeping Worker throughput and Canvas
refresh cadence independent.

The scheduler can issue a bounded catch-up request, but the default profile does
not currently use it. Measurements with the object-frame protocol showed that
enlarging an already-late request can amplify response latency. Catch-up should
be reconsidered after the compact presentation protocol makes per-frame
transport cost predictable.

The production-preview A/B measurement on the M5 Max reference development
device is a regression control, not evidence of low-end or mobile support. It
showed that a sixteen-step compute request sustains approximately 1× model time
through four simultaneous live Scenarios, while an eight-step request falls
behind when the default PV support analysis competes for Worker time. Canvas
raster time remains well below the presentation budget. Target-tier traces are
still required before claiming low-end or mobile support.

- one balanced Scenario: about 1.03× mean model-time ratio;
- four balanced live Scenarios: approximately 0.99–1.02× mean model-time
  ratio per lane, Canvas draw p95 about 1.2 ms, and Worker round-trip p95 about
  31 ms; and
- the eight-step/catch-up experiment: below 1× model-time ratio with repeated
  overload re-anchors, so it is not the production default.

The user does not choose a performance mode. A diagnostic balanced profile
publishes all sixteen exact frames in one callback rather than pacing two
eight-frame slices and remains available through:

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
  count on each target-device tier.
- Active playback produces zero overload re-anchors; hidden-tab and explicit
  resume re-anchors remain allowed.
- Parameter input reaches the first visible accepted result within 150 ms p95.
- Meaningful graph updates remain within 50 ms p95 and presentation lag stays
  within 100 ms p95.
- Canvas p95 draw duration stays comfortably below the chosen display interval.
- No monotonic growth occurs in retained sample counts or subscriber counts.
- Pausing flushes the accepted prefix; resume never rewinds or duplicates it.
- Theme changes and unrelated root status commits do not recreate unchanged
  graph projections.
