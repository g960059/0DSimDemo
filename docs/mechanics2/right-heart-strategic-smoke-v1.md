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

After reserve calibration, the 7-point right-heart envelope passes this
strategic smoke:

- Pass: 7/7
- RV PV OK: 7/7
- TVF OK: 7/7
- Output OK: 7/7
- Repeatability OK: 7/7
- `dt/2` stable: 7/7
- Flow-coupled: 7/7
- Clamp-free: 7/7
- Safety-work bounded: 7/7

This is a good architecture signal compared with the prior ModelCore patch
lane: RV PV shape, TVF shape, output, repeatability, flow-volume coupling, and
bounded soft safety are no longer the current right-heart strategic-smoke
blockers. The reserve comparison is recorded separately in
`right-heart-reserve-calibration-report-v1.json`.

## Boundary

This PR does not claim right-heart physiology acceptance. It does not unlock
runtime wiring, four-chamber integration, AV-plane release work, or LandAtrial
tuning.

This result can unlock a paired left/right MechanicsCore2 smoke. It still does
not unlock runtime wiring, four-chamber integration, AV-plane release work, or
LandAtrial tuning.
