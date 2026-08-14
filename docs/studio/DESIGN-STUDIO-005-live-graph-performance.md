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
- Every simultaneously live Scenario belongs to one group model-time clock.
  A comparative graph never presents its Scenario lanes at different playback
  rates.
- Performance work may change delivery and paint cadence, but must not invent
  interpolated scientific states or use a visual cache for qualification.

## Pipeline

```text
persistent Scenario Workers
  → equal accepted-step batches under one group TimeConductor
    → selected-signal typed-array batches + complete terminal frames
      → aligned multi-Scenario presentation slice
      → graph-owned scalar materialization
        → renderer-specific presentation store subscription
          → memoized projection
            → Canvas paint
```

The group TimeConductor requests the same accepted-step count from every live
Scenario and releases a presentation prefix only after every Worker reaches
that boundary. One slow lane therefore slows the comparison honestly instead
of letting graph traces acquire different implied clocks. React receives one
aligned group commit rather than an independent commit per Worker.

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

Scientific and background operations retain the complete `advanced` response.
The foreground scheduler instead requests `advance-presentation`. Each batch
transfers accepted revisions and times, selected scalar values, and compact
availability/quality state as typed arrays. The final accepted step also
carries one complete validated frame. Latest-value consumers therefore retain
the full model output boundary while intermediate graph samples no longer
structured-clone every unrelated output object.

The compact response validates exact keys, protocol and request correlation,
model/runtime/Scenario identity, input epoch, every accepted clock, matrix
dimensions, scalar finiteness/null sentinels, output-state codes, selected
output identity, and exact agreement between the final scalar row and complete
terminal frame. Transferred buffers are reused only on the trusted bundled
Worker path. The public decoder copies them before returning ownership.

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

The compact transport is presentation-only. Settlement, analyses, capture,
Snapshot qualification, control commits, and authoring continue to consume
complete exact frames or checkpoints. The pre-release Standard ABI requires a
model-owned packed-batch operation: intermediate accepted steps write clocks
and selected scalar outputs directly into typed arrays, while only the final
step constructs one complete frame. Every newly minted Standard exact manifest
declares `runtime/exact-presentation-batch-v1`, which makes the operation
mandatory at the artifact trust boundary. Immutable pre-extension artifacts
remain readable only for already-pinned historical Snapshots and use the old
fully validated frame-per-step projection; active releases cannot silently
fall back. This removes object allocation and validation proportional to every
future primitive output without changing numerical work.

Device diagnostics separately report model-owned advance/projection time and
Worker validation/preparation time. A Worker round-trip metric alone cannot
distinguish equation/solver cost from packing or transfer cost.

## Exact numerical hot path

Presentation work cannot compensate for a Worker that produces exact accepted
steps slower than model time. The Standard-12 executable therefore retains
successful validation proofs only for exact immutable identities whose entire
plain-data graph is transitively frozen. Mutable values, restored copies,
failed or partial validation, and stamp-disabled verification always miss and
take the complete validator path. The full-invariant reference remains
bit-identical to the shipped lean tier for accepted states and checkpoints.

A direct same-process comparison of the committed Standard-8 and Standard-10
artifacts on the M5 Max development host measured four 200-step runs. Mean
accepted-step time fell from about `2.42 ms` to `2.02 ms` (about 16.6%). The two
artifacts then produced identical accepted clocks and all 49 output records for
1,000 presentation steps through `2.0 s`, including completed-beat metrics.
This is exact-artifact regression evidence, not a phone throughput claim.

Before Standard-12 admission, the committed Standard-10 and generated
Standard-12 artifacts were also run for 1,000 exact steps from the same fixture.
All 49 output records and accepted clocks were identical through `2.0 s`. One
alternating-order M5 Max run measured about `1.287 ms/step` versus
`1.211 ms/step` (roughly 6.3% greater throughput) after coronary topology and
factorization reuse. The model-owned packed projection itself measured near
parity with repeated one-step projection on this host, confirming that it is a
growth-safe ABI rather than the phone throughput remedy.

The remaining CPU profile is distributed across dense linear solves, coronary
Jacobian and hydraulics evaluation, five-wall/TriSeg mechanics, material-state
ownership checks, and allocation/GC. No remaining presentation-only switch can
turn a physical phone running the kernel at `0.1×` into a real-time exact lane.
A larger improvement must optimize those numerical kernels (with a new exact
release and parity evidence) rather than silently enlarge `dt`, interpolate
scientific states, or derive metrics from decimated presentation data.

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
- group TimeConductor Worker duration, safe/effective playback rate, and
  presentation intervals and queued presentation frames per lane;
- multi-Scenario coalescing duration;
- frame-to-scalar materialization and presentation-store append duration;
- Workbench-area React commit duration and interval;
- Canvas draw duration and meaningful display interval by renderer;
- group and per-Scenario model-time/wall-time ratio;
- frame, output and primitive-value counts at the Worker delivery boundary; and
- selected output count and transferred typed-array bytes for each foreground
  presentation request.

Duration metrics report count, mean, rolling p95, maximum, and latest
duration. Unitless values additionally report lifetime mean, rolling mean,
rolling p05/p95, minimum and maximum; discrete events are exposed as counters.
Use rolling mean and p05 when judging steady-state model-time ratio so startup
analysis and Scenario creation do not dominate a long-lived session.

## Group TimeConductor and presentation cadence

The default smooth profile computes sixteen exact samples per Worker request,
amortizing transport and response processing across 32 ms of model time. The
group TimeConductor issues that request to every live Scenario, waits for the
whole group, and publishes each Scenario's same-offset exact prefix through a
shared fractional presentation credit. At `1×`, the default credit releases two
eight-frame slices separated by a 16 ms presentation boundary. At `0.25×` it
earns two frames per boundary; at `2×` it earns sixteen. Fractional credit is
carried across boundaries, while a bounded ceiling prevents a delayed browser
task from creating an unbounded catch-up burst. This preserves every accepted
sample and makes compute pace, visible waveform pace, and the displayed group
multiplier describe the same clock.

Playback rate is a property of the group, not a Worker lane. Automatic mode
estimates the sustainable group rate from completed group batches, retains
10% headroom, lowers the limit immediately under pressure, and raises it only
gradually after sustained evidence. Its cold-start bound also falls with the
number of live Scenario lanes. A manual rate is permitted only at or below the
current safe maximum. Adding or removing a Scenario pauses the group,
invalidates the old estimate, and starts a new warm-up measurement.

The toolbar exposes one compact split control: play/pause on the left and the
actual group multiplier on the right. Opening the multiplier reveals a slider
with common detents and an Auto action. The slider's maximum is the measured
safe limit; it is not merely a warning after an unsafe rate was chosen.

The TimeConductor never re-anchors away accumulated wall-clock debt and never
skips exact model time to preserve a nominal `1×` label. If the device sustains
only `0.5×`, every Scenario runs together at `0.5×` and the control says so.
Presentation backpressure is measured explicitly; a rate above `1×` must not
produce a monotonically growing accepted-frame queue, and a sub-unit rate must
not emit fixed-size bursts separated by long empty gaps.

The retired independent lane scheduler could re-anchor overloaded lanes and
allowed wall-clock pressure to produce different Scenario progress. It is not
a production fallback. Catch-up remains disabled because enlarging an
already-late numerical request can amplify response latency.

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

The user does not choose a numerical performance mode. A diagnostic balanced profile
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
accepted selected signals and complete terminal frames as its source
Experiment. The Reader projection must not turn that scientific equivalence
into avoidable presentation work:

- only outputs selected by the sealed graph and output Briefing cross the hot
  intermediate transport and enter rolling UI history; every batch terminal
  remains a complete exact Worker frame;
- each mounted graph subscribes only to the presentation store it renders
  (sweep or pressure-volume), while structural graphs subscribe to neither;
- an off-screen graph keeps its authored dimensions but does not mount a Canvas
  or acquire an automatic PV/structural-analysis owner; and
- visibility only changes presentation ownership. It never pauses, rewinds,
  decimates, or substitutes the live numerical lane.

This boundary reduces allocations, React commits, Canvas work, and competing
background analyses in long Articles without changing accepted steps or values.

## Acceptance targets

- Automatic playback maintains a bounded group lag and at least 10% measured
  compute headroom at the supported Scenario count on each target-device tier.
- Every live Scenario publishes the same accepted-time prefix; no lane-specific
  re-anchor, skip, or playback rate exists.
- Presentation queue depth remains bounded at every selectable playback rate;
  fractional rates retain their cadence without dropping accepted frames.
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

The 2026-08-13 presentation-path production-preview regression run on the M5
Max development device passed all three enforced profiles. This browser run
used the then-active Standard-10 registry bundle; that release is qualified
separately by the exact same-process comparison above. Post-control/background-contention
root model-time ratios were 0.983× for four reference-desktop
Scenarios, 0.996× for two constrained-desktop proxy Scenarios, and 0.992× for
two mobile-layout proxy Scenarios. The corresponding control-to-visible-result
measurements were 136 ms, 234 ms, and 193 ms. Main-thread calibration measured
about 4.1–4.3× slowdown in both proxy profiles while their dedicated Workers
remained about 1.0–1.06×, confirming that these runs establish renderer/layout
headroom on the development host but do not qualify physical phone numerical
throughput.

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
