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

- 4/7 pass on the representative sidecar envelope
- 7/7 LV PV shape OK
- 5/7 MVF OK
- 5/7 output OK
- Normal HR75, HR90, preload-low, and preload-high pass all deterministic smoke checks
- Afterload-high now fails only on low stroke volume; contractility-low remains low-output/clamp limited; contractility-high remains MVF-kink limited
- Broad preload/HR/afterload/contractility envelope remains failed

## Interpretation

This is a usable signal for continuing MechanicsCore2 sidecar exploration, but
not enough for broad investment, runtime wiring, or morphology acceptance. The
closed-loop smoke needs better upstream/downstream chamber-load ownership before
any four-chamber or LandAtrial work resumes. Fixed pulmonary venous inflow was
replaced with a pressure-flow boundary to avoid making the LA an infinite source;
this improved output/MVF coverage but did not produce an adoption surface. The
current LV fiber timing defaults reduce MVF failures at HR90 and low preload,
while exposing the next frontier as afterload output and contractility robustness.

## Claim Boundary

- Not a live `ModelCore` change.
- Not CircAdapt equivalence.
- Not patient-scale calibration.
- Not normal-sinus morphology acceptance.
- Not a LandAtrial tuning unlock.
