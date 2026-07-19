# PERFORMANCE-0002: Browser end-to-end measurement protocol

Status: **draft measurement design; raw-trace V0 harness implemented; artifact schema not defined**
Version: `main-wire-browser-e2e-performance-protocol-draft-v0`

This document records the intended browser measurements and the unresolved
semantic decisions that must be settled by a thin real-browser harness before
an immutable V1 artifact is designed. It does **not** define a conforming
artifact, approve a production cutover, certify hardware, set a threshold, or
establish clinical validity.

## 1. Why Node throughput is not browser end-to-end performance

A Node benchmark can isolate numerical throughput, but it does not measure the
browser path experienced by the official scientific workbench. In particular,
it omits navigation, production asset loading and verification, Worker boot,
structured-clone and message-queue costs, scientific projection, React render,
commit-to-paint latency, long tasks, animation-frame gaps, and pause
acknowledgement. Node throughput remains useful as a lower-layer diagnostic; it
cannot substitute for this protocol or support a browser cutover claim.

## 2. Measurement boundary

The target is a production build opened in a foreground, non-headless browser
with DevTools closed and extensions disabled. Each measured trial uses:

- one fresh Worker;
- one exact scientific checkpoint V3 restore;
- the same content-addressed build, release, case, workspace, checkpoint, and
  resolved session-input identities;
- `dtSec = 0.002`, exactly 500 accepted steps, and exactly 501 scientific
  observable samples including both cycle boundaries;
- a fixed, recorded Worker command step budget;
- warm-up trials that are run first and then discarded from the artifact.

The 501 samples are not 501 React renders or paints. The current workbench
collects 125 Worker responses and commits the ready UI after the complete cycle
has been assembled. Observable sample count, Worker message count, React commit
count, and paint count must be measured and named separately.

The implemented V0 harness is the hidden, unlinked production-build route
`/:locale/scientific-performance-lab`. It emits raw traces only; those traces
may inform, but do not themselves define, final stage or artifact semantics.

## 3. Ordered stages

The protocol records a non-negative duration for every stage. Component probes
may be nested inside an end-to-end span, so consumers must not assume that all
stage or component durations are additive unless a later protocol says so.

| ID | Boundary |
| --- | --- |
| `B0-navigation` | Navigation start to production application entry |
| `B1-worker-boot` | Worker construction to opt-in sideband protocol-ready acknowledgement |
| `B2-bundled-document-verification` | In-memory digest, parse, and document-chain verification after the shared chunk is loaded |
| `B3-official-v3-restore` | Exact checkpoint V3 request to accepted restore |
| `B4-p1-confirmation` | Restore acceptance to first confirmed scientific projection |
| `B5-terminal-cycle-capture` | Terminal configured-cycle request to complete 501-sample capture |
| `B6-transport` | Out-of-band command/response transport probe |
| `B7-projection-render-paint` | Projection through React commit and next paint |
| `B8-pause-acknowledgement` | Pause request to pause acknowledgement |

`officialReadyToPaintMs` is the overall navigation-to-official-ready-to-paint
span. In addition to stage durations, each trial records Worker integration
compute time, `postMessage` call costs, round-trip and residual transport time,
an outer measured main-thread span, component intervals, long-task
observations, maximum animation-frame gap, React commits, paints, and pause
behaviour. Nested component durations must not be added or replaced by their
maximum; the harness must record an outer span or compute the union of measured
intervals.

### 3.1 V0 sideband boundary

The measurement-only Worker factory transfers a dedicated `MessagePort` before
submitting any scientific command. The Worker intercepts one exact bootstrap
envelope before the scientific kernel, acknowledges readiness on that port,
and reports per-command kernel and scientific-response `postMessage` intervals
on the same sideband. Commands and responses are forwarded unchanged through
the ordinary scientific protocol. Worker boot and bundled-document
verification begin concurrently, as they do in the Workbench. Scientific
presentation does not wait for sideband delivery; diagnostic finalization
joins whatever timing records arrive later and reports incompleteness rather
than failing or delaying the scientific result.

This makes Worker readiness and Worker-side command intervals observable
without adding timing fields to scientific payloads. The sideband is opt-in;
the ordinary scientific Workbench never connects it. Its observational
overhead still requires probe-on/off numerical and timing transparency study.

## 4. Out-of-band timing is mandatory

Performance telemetry belongs to the host measurement layer. Timing fields must
never be added to scientific commands, scientific responses, exact checkpoints,
accepted frames, or scientific projections. Doing so would contaminate
deterministic scientific identity with host timing.

Any future artifact must require all of the following assertions:

- `protocol.scientificResponseTimingFieldsAllowed === false`;
- every trial reports
  `scientificAudit.timingFieldsAddedToScientificResponse === false`;
- `claims.scientificResponseMutatedForTiming === false`.

The performance artifact itself contains timing values, but no wall-clock
timestamp, random run ID, or host-probed field is generated by the artifact
creator. Hardware and software facts are explicit caller-supplied measurement
inputs.

## 5. Controlled hardware profile

Every future artifact records a versioned profile and one of two descriptive support
classes: `minimum-supported` or `reference-development`. The profile includes:

- manufacturer, model, CPU, logical processor count, and memory;
- operating system and version, browser name, version, and channel;
- CSS viewport, device-pixel ratio, and refresh rate;
- production-build, foreground, non-headless, DevTools, extension, and power
  conditions.
- HTTP cache mode, service-worker state, network source, and whether assets
  were already resident in the OS/browser cache.

These labels describe the measured environment. They are not certifications.
Changing the machine, browser, viewport, display scale, foreground state, power
condition, or build mode requires a distinct artifact.

## 6. Artifact requirements still to be resolved

No `MainWireBrowserPerformanceArtifactV1` is defined yet. Before freezing one,
the harness must establish:

1. which V0 clock and mark boundaries remain stable enough for a V1 artifact;
2. aggregation across the 125 capture commands;
3. outer-span or interval-union semantics for owned main-thread work;
4. separate observable-sample, message, React-commit, and paint counts;
5. a verified document-chain/session-origin receipt, rather than merely a list
   of syntactically valid but unrelated digests;
6. cache/network conditions and cold-process isolation;
7. a predeclared minimum warm-up and measured-trial count before reporting p95;
8. finite-value and containment relations among round trip, Worker compute,
   handler work, transport residual, and overall duration; and
9. probe transparency: probe-on and probe-off runs must end with identical
   checkpoint SHA, observable frames, and periodic classification.

The future artifact should use strict canonical JSON, reject unknown fields,
recompute summaries, and remain separate from scientific Case/Run documents.
Those serialization choices are straightforward; the measurement meanings
above are not yet stable enough to encode.

## 7. No thresholds and no cutover claim

A future artifact's fixed claims must say:

- measurement only;
- performance acceptance not applied;
- production cutover not claimed;
- supported-hardware certification not claimed;
- clinical validation not claimed.

Any latency or throughput threshold must live in a separate, versioned,
predeclared acceptance policy created before the measurements it evaluates.
Rehashing measurement evidence must not turn it into a pass/fail record.

## 8. Pause and future partial-beat execution

Pause needs two distinct scenarios. The exact-P1 official restore path measures
the 4-step terminal-cycle capture pump. A cold research Case must separately
measure the synchronous 500-step `settlePeriodic` call that currently blocks
host cancellation until the complete beat returns. Success on the first path
must not be presented as cancellation evidence for the second.

A future release may introduce fixed release-owned partial-beat command chunks
and checkpoint the partial tracker state. That change would require a new state
schema, numerical-runtime ABI, protocol, release identity, and corresponding
scientific validation. It is not part of this measurement-contract slice.

## 9. Implemented V0 slice

The V0 implementation now includes:

- an unlinked production route that uses the official exact-V3 loader and the
  exact shared official-ready Workbench surface, including the same eight-panel
  scientific renderer;
- an opt-in `MessageChannel` sideband for Worker-ready, kernel-handle, and
  response-post intervals;
- host-side `postMessage`, message-handler, Promise, outer-stage, long-task,
  animation-frame-gap, layout-effect commit, and two-rAF/task-fence probes;
- explicit separation of 501 observable samples, 500 accepted-step samples,
  125 capture responses, 127 total official responses, ready-surface commits,
  animation-frame callbacks, and initial Paint Timing entries;
- a production-build Playwright E2E test that runs a real module Worker and
  verifies P1, the 501/500/125/127 boundaries, all 127 sideband timings, eight
  panels, finite non-negative declared intervals, monotonic request/Worker
  boundaries, redacted resource names, and fixed non-acceptance claims;
  and
- a bundle-boundary check that keeps raw release/Case bytes Worker-only while
  allowing only the lightweight official Workspace and the opt-in timing probe
  on the main thread.

A headed production-browser smoke on 2026-07-18 reached the complete state with
all expected counts. Its machine-specific timing values are intentionally not
checked in or treated as an acceptance result. CI runs the same path headlessly
as a functional E2E only; it does not enforce performance thresholds.

Command/response object-identity preservation is unit-tested with a fake
transport. The real-Worker E2E does not yet prove full probe-on/probe-off
numerical parity or perform an exhaustive structural response-key audit; those
remain transparency work before a canonical artifact can be defined.

The earlier strict schema prototype remains discarded because it mislabeled
501 observable samples as rendered frames and encoded unverified aggregation
and identity semantics. There is still no canonical performance artifact,
hardware certification, pause result, acceptance policy, or cutover claim.
