# Integrated V3 Guyton / Starling side analysis

## Current product boundary

The Workbench may display a **structural vascular-return orientation** from one
exact accepted V3 step. It must not label that object as a simulated Guyton
response curve or as a Frank–Starling function.

`MainWireIntegratedModelGuytonStarlingOrientationV3` is read-only. It freezes
the accepted step's vascular volume ledger, vascular pressure–volume laws,
external pressures, and local edge-loss coefficients, then solves a steady
volume-constrained return map. Dynamic-edge inertance is intentionally omitted
from this steady orientation. The systemic map follows the non-coronary
`Ao → … → VC → RA` path; it does not add the parallel coronary-sinus return
branch. The pulmonary map follows `PCap → PVen → PVein → LA`.

This calculation neither advances nor forks the live session. It is a local
network orientation, not an intervention result, a clinical measurement, or an
independently validated physiological relation.

## Why a Starling locus is not emitted yet

The registered V3 Session/Worker fixture exposes hemodynamic resistance, tone,
and stiffness controls, but no fixed-total-blood-volume side-protocol
coordinate. The canonical runtime owns a fixed 5,600 mL global ledger. An exact
checkpoint embeds that ledger and its nested integrity bindings; editing its
volumes would not be an exact restore and is prohibited.

The lower circulation transaction has a protocol-only cold-start seam for a
fixed total blood volume. The registered integrated V3 lane does not yet wrap
that seam in an isolated fork/settle/qualification protocol. Consequently, a
single accepted point cannot be expanded into an apparent Starling curve by a
local slope, interpolation, or a copied legacy `ModelCore`/`SimInstance`
analysis. The presentation DTO therefore carries
`starlingLocus.status = "requires-protocol"` and no points.

## Required exact V3 protocol

A future side-analysis worker should own one explicit protocol contract:

1. Input pins the immutable `modelId`, source fixture/checkpoint identity,
   requested TBV deltas, numerical policy, and cancellation/request identity.
2. Every TBV point creates an independent integrated V3 fixture. It must use
   the existing shared-SV/VC-transmural-pressure cold-start construction, or a
   separately specified and validated conservative accepted-state transform.
   It must never modify the live scenario or reuse another branch's mutable
   numerical state.
3. Each branch reaches its own periodic settlement and minimum numerical
   qualification gate. Unsettled, alternating, non-finite, or conservation-
   failing branches remain rejected points rather than display values.
4. One qualified complete cycle supplies event-defined end-diastolic and
   end-systolic states, time-weighted RAP/LAP, and forward cardiac output. Raw
   instantaneous flow is not a cardiac-output substitute.
5. A displayed Starling locus requires enough qualified points on both sides
   of baseline and declares its interpolation, measured domain, rejected
   points, and absence of extrapolation. No local surrogate is substituted
   when the gate fails.
6. The worker returns a presentation DTO only. Settlement reports and traces
   remain ephemeral unless a later explicit scientific-artifact workflow asks
   to retain them.

Formal ESPVR/EDPVR analysis has the same independent-load requirement. A
single-beat origin line is only an end-systolic radial reference. The current
Klotz-informed single-beat diastolic construction is restricted to the LV and
is only a model reference guide unless its event selection and estimator
contract are explicitly validated. LA, RA, and RV panes receive no Klotz
overlay. Neither guide should be titled ESPVR/EDPVR in the Workbench before
the load-series protocol exists.
