# FlowStateValve and LeftHeart Smoke V1

Status: MechanicsCore2 sidecar evidence, not runtime adoption.

Artifacts:

- `data/mechanics2/reports/flow-state-valve-prescribed-gradient-report-v1.json`
- `data/mechanics2/reports/left-heart-subsystem-strategic-smoke-report-v1.json`

## Result

FlowStateValveV1 passes the isolated prescribed-gradient MV/TV fixture set:

- 4/4 pass
- 4/4 clean finite E/A-like biphasic flow
- No runtime wiring or closed-loop morphology claim

LeftHeartSubsystemV1 is a mixed strategic smoke:

- 1/7 pass on the representative sidecar envelope
- 7/7 LV PV shape OK
- 2/7 MVF OK
- 4/7 output OK
- Normal HR75 passes all deterministic smoke checks
- Broad preload/HR/afterload/contractility envelope remains failed

## Interpretation

This is a usable signal for continuing MechanicsCore2 sidecar exploration, but
not enough for broad investment, runtime wiring, or morphology acceptance. The
closed-loop smoke needs better upstream/downstream chamber-load ownership before
any four-chamber or LandAtrial work resumes. Fixed pulmonary venous inflow was
replaced with a pressure-flow boundary to avoid making the LA an infinite source;
this improved output/MVF coverage but did not produce an adoption surface.

## Claim Boundary

- Not a live `ModelCore` change.
- Not CircAdapt equivalence.
- Not patient-scale calibration.
- Not normal-sinus morphology acceptance.
- Not a LandAtrial tuning unlock.
