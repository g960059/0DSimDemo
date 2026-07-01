# Right-Heart Strategic Smoke V1

Status: measured right-heart MechanicsCore2 sidecar smoke, not acceptance.

Artifacts:

- `data/mechanics2/reports/right-heart-strategic-smoke-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runRightHeartStrategicSmokeBench.ts`

## Purpose

This smoke ports the left-heart MechanicsCore2 sidecar contract pattern to the
right heart without wiring runtime or starting four-chamber work. It introduces
a standalone RA/RV/TV/PV/PA subsystem with:

- RV `OneFiberChamberV1`
- TV/PV `FlowStateValveV1`
- fixed-point accepted-state volume/pressure/valve transaction
- RA pressure source with a normal-sinus A-wave window
- PA runoff load
- RV/RA soft-pressure safety readbacks

TVF is scored as smooth single-or-biphasic forward inflow for this strategic
smoke. This is narrower than final physiology acceptance: the gate still fails
kinks through C1 continuity and keeps raw morphology readbacks in the report.

## Result

The 7-point right-heart envelope is mixed but useful:

- Pass: 4/7
- RV PV OK: 7/7
- TVF OK: 7/7
- Output OK: 7/7
- Repeatability OK: 7/7
- `dt/2` stable: 7/7
- Flow-coupled: 7/7
- Clamp-free: 7/7
- Safety-work bounded: 4/7

The passing points are normal HR75, normal HR90, preload-low, and
contractility-high. The remaining points fail only by `safety-pressure-dominant`:

- `right-heart-preload-high`
- `right-heart-pulmonary-afterload-high`
- `right-heart-contractility-low`

This is a good architecture signal compared with the prior ModelCore patch
lane: RV PV shape, TVF shape, output, repeatability, and flow-volume coupling
are not the current blockers. The current right-heart blocker is RV dilation /
soft safety-pressure ownership under high preload, pulmonary afterload, and low
contractility.

## Boundary

This PR does not claim right-heart physiology acceptance. It does not unlock
runtime wiring, four-chamber integration, AV-plane release work, or LandAtrial
tuning.

Next work should stay in MechanicsCore2 right-heart smoke and decide whether
the RV dilation/safety-pressure residual is a fixture-envelope issue, a missing
right-heart compliance/afterload contract, or a required phenotype policy.
