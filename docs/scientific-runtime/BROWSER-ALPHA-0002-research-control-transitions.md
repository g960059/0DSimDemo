# Browser alpha research-control transitions V0

Status: implementation contract for the release `circleheart/adult-five-wall-noncoronary@0.2.0` browser alpha.

## Scope

The first browser control surface exposes only two release-relative research controls:

- systemic vascular resistance scale (SVR): `0.75`, `1`, or `4/3`;
- pulmonary vascular resistance scale (PVR): `0.75`, `1`, or `4/3`.

The complete pair is content-addressed as one target state. Partial patches,
arbitrary values, clinical interpretation, parameter fitting, and saved-case
compatibility are outside this V0 contract.

## One scientific transition, two presentation policies

Both presentation modes start with the same state-preserving Worker command.
The command forks a new target session from the source session at an exact
accepted command boundary and then replaces only the two catalog-owned
circulation losses. Presentation mode is deliberately not part of the
scientific command.

The fork preserves fixed total blood volume, all circulation node volumes,
semilunar root flows, four-valve opening memory, and the five-wall
Land/SLS/TriSeg state. The source session remains active. Only the target's
periodic-settlement tracker is reset. Because pressure and flow in the source
observation were evaluated with the old losses, the fork observation exposes
volumes and valve memory but marks pressure, flow, and derived diagnostics
unavailable. The fixed-TBV conservation error is the sole diagnostic exception:
it remains an available zero-valued audit because total blood volume is copied
exactly. The first accepted target step evaluates all other readbacks with the
new losses.

The Worker owns the current target digest and monotonically increasing
parameter epoch. A fork is compare-and-swap guarded by source session ID,
revision, accepted time, total blood volume, control digest, and parameter
epoch. A stale or incomplete request fails without allocating a target.

The immutable Case and Workspace refs shown by the page remain base ancestry,
not a claim that transient or promoted target frames belong to a new persisted
Case. The controller reports the control digest, parameter epoch, and evidence
class of the currently displayed frames separately. Live display is labeled as
an open transient; a promoted steady target is labeled only after P1 and its
following cycle pass the gate below.

### Settle, then show

The source plot remains visible while the target runs at most one complete beat
per `settlePeriodic` command. A target is not presented as steady before the
periodic tracker reports P1 convergence. P2 suspicion, the bounded beat limit,
step failure, cancellation, or transport failure cannot replace the source
plot.

After P1, the browser captures the following complete one-second cycle as 125
commands of four accepted 2 ms steps. The P1 boundary plus all 500 steps form a
validated, revision-contiguous, 501-frame history. Only after that validation
does the browser atomically promote the target plot and control context. It then
disposes the former source session.

### Show the transition live

The browser retains the original source session and plot for reset. The target
runs one command at a time, always with four 2 ms steps and observation stride
one. Every accepted frame is retained in a rolling 501-frame history; React
plot-history commits are animation-frame batched and capped near 30 Hz, and the
memoized renderer does not recompute for intervening command-status updates.
No resampling, smoothing, or interpolation is applied.

Pause and reset take effect only between commands, so an accepted four-step
transaction is never visually or scientifically split. Resume continues from
the last target accepted state. Reset disposes the target and restores the
retained source plot and source control context exactly. A hidden document
requests an automatic pause at the same command boundary.

The browser client has a bounded 8,192-request identity ledger. The verified
official bootstrap consumes 127 entries, and the controller counts every later
fork, settle, transient, and dispose request against the same ledger. Live mode
auto-pauses before submitting a regular command when no regular entry remains;
resume is then disabled, but the transport's separately reserved recovery
capacity still permits target disposal and exact reset to the retained source.
Capacity exhaustion is therefore a bounded pause/reset condition, not a false
transport failure or steady-state claim.

Live presentation is an open transient and does not claim periodic steady
state. A later steady promotion must pass the full P1 and following-cycle gate.

## Checkpoint boundary

V2/V3 exact checkpoints bind the original resolved input, not the V0 control
target. A forked target therefore cannot emit those checkpoint schemas. A
future control-aware checkpoint must bind the base resolved-input digest, the
complete target state and digest, and the parameter epoch before persistence is
enabled.

## Required browser evidence

Production Playwright coverage uses the real module Worker and verifies:

- steady mode never replaces the source renderer before P1 plus 501-frame
  capture, then performs one atomic promotion;
- live mode advances accepted revisions, stops at a command boundary on pause,
  resumes monotonically, and restores the exact retained source on reset;
- displayed evidence and control identity remain source-bound during hidden
  settlement, switch to open-transient target identity during live display, and
  switch atomically to validated target identity on steady promotion;
- no page or unexpected console error occurs in either path.

This evidence is a browser integration check, not a physiology acceptance,
hardware performance threshold, clinical validation, or patient-specific fit.
