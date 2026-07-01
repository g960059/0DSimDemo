# Current Development Lanes

Status: active routing note
Scope: coordination only; evidence lives in PRs, artifacts, and git history.

## Execution Policy

- Production is still unpublished with zero users. Use an internal
  staged-replacement bar, but do not claim physiology acceptance without gates.
- Oracle direction checks are disabled by owner instruction. Use local measured
  evidence, code review, and owner-provided reviews.
- Keep status docs compact. Do not paste external reviews or phase narratives
  here. Store detailed counts in PR bodies and JSON artifacts.
- New diagnostics are disposable by default. Promote only forward invariants to
  standing gates.
- Strict raw morphology remains authoritative for user-visible model quality:
  LV/RV PV dome/rebound/curvature, MVF/TVF E/A and kink checks, LA/RA PV, and
  pressure timing. Owner visual rejection overrides any old gross-pass number
  until the checker is hardened to match it.

## Current Frontier

### MechanicsCore2 / CircAdapt-lite Sidecar

Objective: pivot from the exhausted `ModelCore + Land boundary-contract patch`
lane to a sidecar mechanics architecture inspired by CircAdapt-like
chamber/valve/load ownership without copying CircAdapt source or claiming
equivalence.

Current PR target: `PR-M2-0+1`.

Detailed plan: [MechanicsCore2 / CircAdapt-lite execution plan v3](../mechanics2/MechanicsCore2_CircAdaptLite_ExecutionPlan_v3.md).

Included:

- `engine/mechanics2` sidecar skeleton.
- `TraceFixtureV1` prescribed-length fixture contract.
- `HillSeriesFiberV1` with mechanical activation state `a` (not calcium).
- Pre-registered `hill-series-fiber-replay-gate-v1.yaml`.
- Isolated replay bench and tiny deterministic smoke test.

Excluded:

- Live runtime wiring.
- CircAdapt equivalence.
- Clinical validation.
- Runtime/default adoption.
- LandAtrial tuning unlock.
- OneFiberChamber closed-loop work.

Next gates:

1. Gate A: prescribed `lS(t)` Hill-series replay. If no-go, do not proceed to a
   full sidecar just because the roadmap exists.
2. Gate B: left-heart subsystem strategic gate with owner visual review before
   broad MechanicsCore2 investment.

Parallel prep, not blocking this PR:

- Existing valve audit for q-state/area/loss/closure semantics.
- Sharpness calibration pack for peak-width and C1 metrics.
- Numerics ownership for stepper, residuals, mass/energy, and dt convergence.

## Stopped Lane

### ModelCore + Land Boundary-Contract Patch Lane

Status: stopped unless the owner explicitly reopens it.

Reason: strict morphology V1.1 remains failed after the patch surfaces recorded
through PR #325. The latest accepted-volume chamber/valve/load architecture
smoke produced only a partial signal: gross morphology stayed 0/2, TVF did not
improve, and LV positive-curvature burden worsened. This is not a good signal.

Do not continue:

- Source-pressure ownership variants.
- Work-conjugate/stateless pressure adapter sweeps.
- Scalar pressure gain caps.
- Valve threshold/deadband/coasting patches.
- qDot/rootZc/Tref/source-stress tuning.
- lambda/tau/zeta smoothing sweeps.
- Local pointwise MV pressure refits.
- Solver wrapper/substep experiments as morphology fixes.
- LandAtrial tuning to hide LV/RV/MVF/TVF blockers.

Keep as reusable QA/reference:

- Strict morphology checker V1.1+.
- Accepted-boundary qDot/diode/complementarity readbacks.
- Pressure decomposition readbacks.
- Visual review bundle discipline.
- Frozen legacy active-stress positive control.
- Frozen current Land/user0 comparator.

## Owner Release Posture

- Land remains the intended replacement direction for the current active model,
  but Land re-entry into MechanicsCore2 must receive accepted geometry/velocity
  states rather than raw chamber-volume spikes.
- A1/A2 remain frozen diagnostic scaffolds/comparators.
- LandAtrial remains the final atrial active-mechanics target, but tuning stays
  locked while LV/RV PV and MVF/TVF raw morphology are failing.
- Official cases are smoke/teaching-surface checks until closures stabilize.
