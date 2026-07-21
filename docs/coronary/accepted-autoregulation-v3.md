# Accepted coronary autoregulation V3

Status: accepted-state and checkpoint integration implemented. Physiological
release readiness is not claimed.

## Purpose and scope

V3 adds the missing slow owner between the passive coronary V2 hydraulics and
the six territory-layer R1 tone states. It deliberately keeps the hydraulic
Newton solve passive: every residual, line-search, finite-difference probe, and
implicit-sensitivity evaluation uses the same previous accepted tone. Only the
final converged candidate contributes to the slow state.

The reduced controller is an organ-level supply-demand surrogate. It does not
claim that flow is the biological sensor, identify individual metabolic or
myogenic mediators, model oxygen content, or diagnose ischemia.

V2 remains the immutable fixed-tone compatibility lane. V3 has a new accepted
tuple and checkpoint schema; an old V2 checkpoint is never silently treated as
if it contained an autoregulation history.

## Accepted physical-time window

The owner is a fixed-duration tumbling window. Normal periodic sinus uses a
window equal to the prescribed cycle length and aligned to its initialization
origin. Future irregular rhythm uses an explicitly selected physical duration
independent of RR intervals. Beat segmentation remains a diagnostic surface;
it is not a hidden controller input.

For accepted interval \((t_n,t_{n+1}]\), the final Backward-Euler candidate
provides

\[
Q_{m,k\ell,n+1},\qquad
\Pi_{k,n+1}=P_{d,k,n+1}^{abs}-P_{CV,n+1}^{abs}.
\]

The state advances by right-endpoint quadrature,

\[
I^Q_{k\ell}\leftarrow I^Q_{k\ell}
  +\Delta t\,Q_{m,k\ell,n+1},
\]

\[
I^\Pi_k\leftarrow I^\Pi_k
  +\Delta t\,\Pi_{k,n+1},
\qquad
T\leftarrow T+\Delta t.
\]

Window means are \(I/T\), never arithmetic means over samples. Instantaneous
reverse Qm or pressure-gradient values may be integrated; a negative completed
mean fails closed before any V3 owner is promoted.

The flow observable is the hidden C1-to-C2 `Qm` edge. Inlet flow and R1 flow
are not silently substituted. The perfusion-pressure signal uses post-focal-
lesion pressure minus common coronary-venous pressure, so focal loss and raised
venous pressure remain visible.

The caller must split a nominal step at the next window boundary. V3 exposes
the maximum admissible step duration and rejects a crossing step before the
base hydraulic transaction runs. Window endpoints are computed from integer
window index, origin, and duration rather than repeated endpoint addition.

## Tone update and anti-windup

At a complete accepted window, each layer advances once using

\[
\frac{d\log r_{k\ell}}{dt}
=\frac{1}{\tau_r}\log\left(\frac{\bar Q_{m,k\ell}}
{Q^*_{k\ell}}\right),
\qquad \tau_r=25\ \mathrm{s},
\]

with the existing bounded hyperemia branch. The hydraulic interval that closes
the window used the old tone; the updated tone first affects the next interval.

Demand, hyperemia, and the layer-specific effective tone floor are latched by
the first accepted step in a window. A different control is rejected until the
next empty boundary. The floor is

\[
r_{min,k\ell}^{eff}
=\max\left(4/45,r_{min,k\ell}^{disease}\right).
\]

Both endogenous integration and hyperemic relaxation use this effective floor.
This prevents an unobservable controller state from winding up below a CMD
vasodilatory floor while the hydraulic solver applies `max(tone, diseaseFloor)`.

The dilation-reserve scale is grounded as an order prior in the resistance
change reported by [Chilian et al. 1989](https://doi.org/10.1152/ajpheart.1989.256.2.H383).
The 25-second live response prior is order-consistent with the metabolic
adaptation half-times reported by
[Dankelman et al. 1989](https://doi.org/10.1113/jphysiol.1989.sp017460).
Neither source independently validates the assembled closed-loop response.

## Atomic transaction

`MainWireFiveWallCoronaryTransactionV3` performs the following sequence:

1. validate the V3 tuple, binding, control, and remaining window duration;
2. run the existing same-candidate circulation, coronary, mechanics, and MCS
   V2 transaction with previous accepted tone fixed;
3. read only the final converged coronary hydraulics;
4. evaluate the accumulator and optional tone update as a pure operation;
5. place the new tone into the accepted coronary state; and
6. promote circulation, coronary volume/tone, mechanics, MVC memory, and the
   accumulator together.

If either the base trial or accepted-window evaluation fails, the returned V3
rollback tuple is the previous accepted tuple. Retrying the same previous state
and input neither double-integrates nor consumes hidden history.

## Checkpoint and versioning

Checkpoint V3 binds:

- the complete verified V2 snapshot;
- six Qm time integrals;
- three perfusion-pressure time integrals;
- accepted physical duration and step count;
- window origin, index, start time, and start revision;
- the latched demand/hyperemia/floor control; and
- the immutable autoregulation law/window/observable binding.

An outer canonical-JSON SHA-256 covers the complete payload. Restore requires
the session's expected binding and rejects a valid checkpoint under another
duration or interpretation.

This V3 checkpoint does not bind an MCS command/profile and contains no rotary
circuit-flow state. The optional algebraic MCS seam is therefore a coupled
trial capability, not an exact MCS resume claim. Stateful support requires the
later combined transaction/checkpoint schema; it must not be added silently to
this coronary-only V3 schema.

There is one explicit V2-to-V3 new-run promotion. It first verifies the V2
checkpoint, preserves its physical state, starts an empty V3 window at that
accepted clock, records the source digest, and sets
`inheritedPeriodicEvidence=false`. It is not described as exact continuation
of the V2 mathematical model.

## Evidence completed and still required

Implemented verification covers duration weighting, exact window closure,
boundary-crossing rejection, retry purity, mid-window control locking,
instantaneous reverse-flow handling, negative-mean rejection, CMD floor
anti-windup, old-tone/next-tone operator ordering, whole-tuple rollback, and
mid-window checkpoint continuation.

This does not yet validate normal physiology. Before release, the V3 lane must
still complete:

- 2/1 ms and selected 0.5 ms closed-loop waveform comparisons under one
  measurement-site contract;
- fixed-IMP pressure steps and recovery time constants;
- rest to stable hyperemia to washout, with CFR and FFR-like availability;
- stenosis by structural CMD by tone-floor factorials;
- MCS and rhythm interaction protocols; and
- long-duration boundedness and exact replay.

Normal resting flow used to construct R1 remains calibration/construction
evidence, not independent validation.
