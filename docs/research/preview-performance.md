# Preview performance and staged optimization

Model files: [engine/previewController.ts](../../engine/previewController.ts), [components/Charts.tsx](../../components/Charts.tsx), [engine/ModelCore.ts](../../engine/ModelCore.ts)

## Parameters in play

| parameter / policy | current value | rationale | verdict |
|---|---:|---|---|
| Preview integration step `dt` | 0.001 s | Keeps valve/chamber transients stable in the existing ModelCore integration path. | Keep until a numerical convergence sweep justifies coarser steps. |
| Preview sampling `sampleHz` | 120 Hz | Supports valve-flow and atrial waveform morphology at display scale without storing every integration step. | Keep. Optimize storage/drawing first. |
| Preview buffer retention | 20 s | Covers multiple beats across low HR and allows short clinical waveform review. | Keep, but trim in one batch. |
| rAF wall-clock cap | 100 ms/frame | Prevents a hidden-tab or stalled-frame catch-up from replaying seconds of simulation on the main thread. | Keep. |

## Candid assessment

The proposed direction is correct, but doing Worker execution, typed packed samples, incremental settle, and a ModelCore hot-path rewrite in one branch would make regressions hard to attribute. The safer sequence is:

1. Add measurement and remove obvious main-thread allocation churn.
2. Downsample/draw less in charts while preserving extrema and morphology.
3. Move preview integration to a dedicated Worker once the baseline metrics exist.
4. Only then consider packed TypedArrays, SharedArrayBuffer, OffscreenCanvas, or a compiled/WASM hot path.

This branch implements step 1 and a small part of step 2 without changing physiological equations or parameters.
It also implements the first part of the workerization plan: preview integration
and pre-settle can run in a dedicated Worker when the browser supports it, while
headless tests and unsupported browsers keep the synchronous fallback.

## A. Computational model

Per visual frame, preview cost is approximately:

```
T_frame ~= N_instances * T_runFor(simSeconds, dt, sampleHz)
        + N_visiblePanels * N_visibleSignals * T_draw(samples)
        + T_bufferMaintenance
```

The simulation path currently runs inside `requestAnimationFrame`. MDN documents that rAF callbacks are requested before the next repaint and usually match the display refresh rate, while hidden/background contexts are commonly paused to reduce CPU and battery use. Therefore the preview loop should continue to use the rAF timestamp for wall-clock advancement, but must avoid doing unnecessary work inside the same callback budget.

`performance.now()` is the right local timing primitive for this because MDN describes it as a high-resolution, monotonic millisecond timestamp, also available in Workers. This branch adds a `PreviewPerfSnapshot` so future Worker work can be judged against actual `frameWallMs`, `coreWallMs`, sample counts, and trim counts.

## B. Implemented low-risk changes

### PreviewController

- Added `getPerfSnapshot()` with per-frame and per-instance wall-time/sample counters.
- Replaced repeated `buffer.shift()` trimming with a single forward scan plus one `splice(0, dropCount)`.
- Preserved the existing rAF cadence, time-scale behavior, 100 ms frame clamp, and health throttling.
- Added a Worker-backed preview path for browsers. The main thread keeps chart buffers and read-only metric/health facades; the Worker owns the real `ModelCore` instances.
- New/reset instances settle incrementally in 0.25 s simulation chunks inside the Worker. A new reset/instance signature cancels stale settle work by token.
- Main-thread rAF drops simulation ticks while a previous Worker tick is still in flight instead of queueing unbounded work.
- Unsupported Worker environments, worker construction errors, or worker runtime errors fall back to the synchronous `ModelCore` path.

The buffer-maintenance change matters because `Array.shift()` moves the whole tail of the array each time. Repeating it for several old samples creates avoidable main-thread churn. One scan plus one splice keeps the public `SimSample[]` buffer contract intact while reducing array movement.

### Charts

- Centralized waveform signal lookup in `sampleSignalValue()` so new signals do not duplicate large switch blocks.
- Centralized chamber pressure-volume lookup in `chamberPVPoint()`.
- Replaced PV-loop last-complete-beat `filter()`/`find()` allocation with index-range discovery and direct drawing.
- Added render-only PV-loop smoothing with round line caps/joins. The smoothed curve is used only for Canvas display, never for metrics, gates, or physiological validity checks.
- Added a PV-loop raw-point debug overlay behind `?pvDebug=1` or `localStorage.setItem("hemo:pvDebug", "1")`. It draws raw sample dots and the completed-beat point count so jagged display can be separated from jagged solver output.

The PV-loop change keeps the previous physiology-facing behavior: loops are still drawn from the last complete beat, with an optional closing sample, so LA/RA figure-eight morphology is not intentionally changed.

## C. Next implementation gates

| Gate | Requirement before merge |
|---|---|
| Worker preview driver | Baseline `PreviewPerfSnapshot` numbers from 1/2/4 visible instances; typed message schema; deterministic headless tests. |
| Packed sample buffers | Preserve all currently exposed `SimSample` fields or add a documented adapter; prove no LA/RA/MVF/TVF morphology loss. |
| Chart decimation | Use pixel min/max envelope, not naive subsampling, for flows and pressures so narrow peaks survive. |
| Hidden-instance policy | Decide whether invisible instances should pause or continue phase-aligned; document the UX tradeoff. |
| Hot-path ModelCore rewrite | Add convergence and morphology tests before replacing object-heavy code with arrays/scratch buffers. |

## References

1. MDN Web Docs. `Window.requestAnimationFrame()`. https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
2. MDN Web Docs. `Performance.now()`. https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
3. MDN Web Docs. "Using Web Workers." https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
4. MDN Web Docs. `OffscreenCanvas`. https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
