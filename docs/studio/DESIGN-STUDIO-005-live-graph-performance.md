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

Renderer-specific subscriptions prevent an unrelated graph family from
rebuilding its projection, but that split is not the dominant measured saving
on its own. Stable selector identities, authored-output materialization, and
avoiding redundant root commits account for most of the current reduction.

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

The same narrow exception applies to progressive analysis updates emitted by
the bundled runtime. Their envelope, protocol correlation, model/runtime/
Scenario identity, input epoch, and source clock are checked on the main
thread, while the already Worker-validated growing payload is reused. The final
analysis result still goes through the full deep validator. React receives at
most one coalesced progressive analysis commit per analysis key every 400 ms;
the final result commits immediately. This keeps an incremental curve visible
without making every newly appended point a main-thread deep-validation and
render boundary.

Initialize, control, final analysis, capture, Snapshot, authoring, storage,
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

On a physical phone, tap the opt-in **Perf** button and copy the JSON report.
The report contains coarse device capabilities and aggregate timings only; it
never contains article text, fixtures, checkpoints, or output values. Desktop
developer tools may also inspect or reset the same rolling metrics:

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

### Article live projection

An Article Placement runs the same exact numerical model and receives the same
validated Worker frames as its source Experiment. The Reader projection must
not turn that scientific equivalence into avoidable presentation work:

- only outputs selected by the sealed graph and output Briefing are retained in
  the rolling UI history; the exact Worker frame itself remains complete;
- each mounted graph subscribes only to the presentation store it renders
  (sweep or pressure-volume), while structural graphs subscribe to neither;
- an off-screen graph keeps its authored dimensions but does not mount a Canvas
  or acquire an automatic PV/structural-analysis owner; and
- visibility only changes presentation ownership. It never pauses, rewinds,
  decimates, or substitutes the live numerical lane.

This boundary reduces allocations, React commits, Canvas work, and competing
background analyses in long Articles without changing accepted steps or values.

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

## Reproducible target-tier harness

Performance is measured separately from ordinary browser correctness tests.
The explicit production-preview harness builds the exact current branch,
creates the profile's target live Scenario count (four on the reference
desktop and two on constrained/mobile proxies), measures a concurrent-analysis
window, applies a real control change, and then measures the period in which
the new steady-state candidate competes for background capacity:

```bash
npm run benchmark:workbench:live
```

It runs three serialized Chromium profiles:

| Profile | Layout | CPU treatment | Purpose |
| --- | --- | --- | --- |
| `reference-desktop` | 1440 × 900 | native | developer-machine regression |
| `constrained-desktop-proxy` | 1280 × 800 | 4× CDP **main-thread** throttle, 4 reported logical cores | reproducible renderer/layout contention proxy |
| `mobile-main-thread-layout-proxy` | 390 × 844 | 4× CDP **main-thread** throttle, 4 reported logical cores | mobile layout and renderer contention only |

Each run attaches a JSON report containing every rolling diagnostic, per-lane
model-time ratio, Worker round trip, Canvas paint/display cadence, overload
events, control-to-visible-result latency, browser heap counters, environment,
and the evaluated budget. Budgets are reported by default. This harness is not
wired into pull-request or `main` GitHub Actions: absolute wall-clock budgets
calibrated on the reference device would be structurally flaky on shared
runners. To enforce them explicitly as a local reference-device check:

```bash
npm run verify:workbench:performance
```

Useful bounded overrides are:

```bash
CIRCLEHEART_PERF_SCENARIOS=4 \
CIRCLEHEART_PERF_WARMUP_MS=10000 \
CIRCLEHEART_PERF_SAMPLE_MS=30000 \
npm run benchmark:workbench:live -- --project=constrained-desktop-proxy
```

Each report includes a small calibration loop on both the renderer main thread
and a dedicated Worker. Current Chromium CDP throttling slows the former but
does not reliably slow the latter. The proxy therefore makes **no claim** about
the numerical throughput of a phone. It also does not emulate memory bandwidth,
thermal behavior, mobile GPU composition, browser power policy, or big.LITTLE
scheduling and cannot establish a device-support claim.
Before claiming a tier, repeat the diagnostic run on named physical devices
and record browser version, logical cores, memory, battery/thermal state,
Scenario count, viewport, model-time ratios, long-tail latency, and a minimum
ten-minute retained-memory soak.

The 2026-08-07 production-preview regression run on the M5 Max development
device passed all three enforced profiles. Post-control/background-contention
root model-time ratios were 0.985× for four reference-desktop Scenarios, 0.989×
for two constrained-desktop proxy Scenarios, and 0.986× for two mobile-layout
proxy Scenarios. The corresponding control-to-visible-result measurements were
136 ms, 206 ms, and 159 ms. These numbers establish repeatable headroom on the
development host; the throttled results remain proxies, not physical-device
qualification.

The initial qualification matrix is deliberately honest:

| Target tier | Required live Scenarios | Additional stress run |
| --- | ---: | ---: |
| contemporary desktop | 4 | 4 plus active structural analysis |
| ordinary/low-end laptop or tablet | 2 | 4 |
| contemporary phone | 2 | 4 |
| older constrained phone | 1 | 2 |

The application does not expose a performance mode and does not silently pause
or replace a Scenario with replay. All authored Scenarios remain exact live
lanes. The matrix only distinguishes what has been physically qualified; a
four-Scenario mobile claim is promoted only after the four-lane stress run
meets the same scientific and interaction targets.

## Background numerical QoS

Live Scenario Workers own the foreground numerical experience. Snapshot,
responsive PV support, Guyton/Starling continuation, and steady-candidate
production share one bounded pool of single-use background Workers. The pool
uses this priority order:

```text
Snapshot → explicit Save → visible analysis → speculative prewarm
```

For `C` logical cores and `L` live Scenario lanes, one logical core is reserved
for the main thread and browser composition. Speculative capacity is therefore:

```text
min(configured pool cap, max(0, C - L - 1))
```

The configured cap scales from one Worker below four logical cores, to two on
ordinary machines, three from twelve cores, and four from sixteen cores. Thus
high-performance devices can run both directional analysis branches while
serving another Scenario analysis or an explicit capture. This is not an
unconditional hardware-wide fan-out: the live-Scenario-aware formula above
continues to protect foreground numerical lanes and browser composition, and
the cap never exceeds four.

This can become zero on a constrained device: speculative settlement waits
instead of competing with presentation. An explicit user operation always has
one serialized background lane available. Snapshot/Save may use one bounded
burst only when real logical-core headroom remains. No operation changes the
accepted 2 ms model step.

Changing a Scenario target cancels that Scenario's queued analysis partitions
and terminates any running analysis/prewarm Worker forked from the old input
epoch. Those results can no longer pass the epoch boundary, so allowing them to
finish would only block the replacement PV/Starling result on a serialized
device. An explicit analysis can likewise preempt speculative prewarm at the
cap. Promotion protects a prewarm that has become the exact candidate needed by
Snapshot or Save, so useful work is reused rather than restarted. Pool capacity,
queue depth, active Workers, cancellation, preemption, and burst leases are
included in diagnostic reports.

Queue priority alone does not terminate an already-running, still-current
visible analysis. The input-epoch cancellation above is narrower: a parameter
change has made that analysis impossible to admit, so there is nothing valid to
resume. Snapshot/Save can use a bounded burst when the device has real headroom,
but on a one-background-lane device either may wait for a still-current analysis
operation. Making that current responsive analysis preemptible requires an
explicit cancel-and-resume contract for all of its partitions; treating every
analysis, including author-requested formal analysis, as a disposable Worker
would leave partial UI state and wasted queued partitions. That resumable
distinction is a separate follow-up rather than an implicit promise of this
pool.

Only schedulers that are actually running count as live lanes. Initialization
reserves its future lanes before their Workers start, playback reserves them
before the first batch request, and an explicit pause returns that capacity to
background work. Scenario membership by itself does not keep a paused
Workbench artificially constrained.

An exact Scenario duplicate reuses its source Scenario's immutable structural-
analysis payload under the duplicate runtime identity. If duplication happens
before that analysis finishes, later source progress/final results propagate to
the still-equivalent duplicate as they arrive. The fixture and checkpoint are
identical at the duplication boundary, so waiting for a second identical
relation would only consume a constrained device's sole analysis lane. A
control change on either side breaks the equivalence before a new result can be
shared; the inherited relation then becomes visual history while the changed
target is recomputed. This reuse is runtime presentation state only and never
qualifies or persists a Snapshot.
