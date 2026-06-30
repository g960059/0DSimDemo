# LandAtrial Default Floor V1

Status: user-0 staged default floor

## Purpose

`LandAtrialDefaultFloorV1` fixes the current all-chamber Land runtime baseline
after Phase 5BK so future atrial work compares against one stable floor instead
of reopening A1/A2 bridge tuning or rerunning broad candidate sweeps.

## Runtime Composition

- LV/RV: Land source providers with sourced root/Zc runtime default.
- LA/RA: atrial-calibrated Land provider pack
  `landatrial-fast-lowpressure-shadow-parameter-pack-v1`.
- Atrial geometry override: LA `avPlaneGainMl=22`, RA `avPlaneGainMl=26`.
- Legacy active-stress remains frozen rollback/reference.

The code contract is `LANDATRIAL_DEFAULT_FLOOR_V1_CONTRACT` in
`engine/myocardium/landAtrialDefaultFloor.ts`.

## Standing Dashboard Axes

Future calibration should report the floor against these axes, not a single
combined score alone:

- health/output over HR75/90 normal, low-preload, and high-preload points
- raw LA/RA PV-loop readability
- volume-function broad ranges
- a/v pressure-wave timing
- AV-plane/effective-wall geometry readbacks
- direct wall-strain target distances
- valve-diode measurement hygiene
- HR75/90 preload robustness

## Claim Boundary

This floor does not accept atrial physiology, official morphology, valve/load
timing, AF behavior, qDot clamp removal, legacy deletion, or clinical/scientific
validation. A1/A2 are frozen diagnostic scaffolds/comparators, not forward
selection candidates.

## Phase 5BL

`landatrial-default-floor-phase5bl-result-v1` reuses the Phase 5BK closed-loop
measurements and records the multi-objective floor dashboard without rerunning
simulation. It keeps direct wall-strain as the main open calibration gap and
keeps valve diode behavior as measurement hygiene, not an accepted mechanism.
