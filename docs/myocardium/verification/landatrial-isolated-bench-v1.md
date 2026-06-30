# LandAtrial Isolated Bench V1

Status: diagnostic bench

## Purpose

This bench isolates the LandAtrial active mechanics and AV-plane/effective-wall
geometry from closed-loop valve, root/Zc, preload, and venous-return effects.
It is intended to guide LandAtrial calibration after `LandAtrialDefaultFloorV1`,
not to accept atrial physiology by itself.

## Protocol

- Chamber variants: LA and RA.
- Geometry variants: Phase 5BK AV-plane floor on/off.
- Volume input: prescribed normal-HR75 atrial volume waveform with reservoir,
  conduit, and booster phases.
- Land providers: the runtime LandAtrial floor provider pack.
- Outputs: passive/active pressure split, source active stress, direct wall
  lambda/strain, AV-plane effective-volume correction, and loop area.

## Boundaries

The bench does not change runtime defaults, tune A1/A2, tune valves, retune
root/Zc, or claim official morphology. It should be used before closed-loop
LandAtrial parameter changes so atrial muscle/geometry effects stay separated
from discharge and valve artifacts.

## Phase 5BM

`landatrial-isolated-bench-phase5bm-result-v1` records LA/RA AV-plane on/off
runs with zero Land provider solve failures. In the prescribed normal-HR75
waveform, AV-plane coupling lowers minimum atrial pressure and increases loop
area while keeping the Land provider finite. This supports using the bench as
the next calibration surface for direct wall strain and effective geometry.
