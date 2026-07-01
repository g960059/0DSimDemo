# Right-Heart Reserve Calibration V1

Status: measured right-heart MechanicsCore2 reserve calibration, not runtime
wiring or physiology acceptance.

Artifacts:

- `data/mechanics2/reports/right-heart-reserve-calibration-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runRightHeartReserveCalibrationBench.ts`

## Purpose

The first right-heart strategic smoke localized its three failures to
`safety-pressure-dominant` while preserving RV PV shape, TVF shape, output,
repeatability, `dt/2` stability, flow coupling, and clamp-free behavior at
7/7. This bench checks whether that residual is best treated as a right-heart
stress-to-pressure reserve gap rather than a morphology, valve, or output
failure.

## Result

The historical baseline `rv-pressure-scale046` remains mixed:

- Pass: 4/7
- RV PV OK: 7/7
- TVF OK: 7/7
- Output OK: 7/7
- Safety-work bounded: 4/7

The selected candidate is `rv-pressure-scale052-lower-suction008`, which
separates upper dilation reserve from the lower-volume safety surface:

- Pass: 7/7
- RV PV OK: 7/7
- TVF OK: 7/7
- Output OK: 7/7
- Safety-work bounded: 7/7
- High-drive artifact: 0

The comparison is important: `rv-pressure-scale052` removes the high-volume
safety residual but creates a low-preload repeatability failure. Reducing only
the RV lower-bound soft-suction gain removes that low-preload oscillation while
keeping the upper-volume pressure reserve.

This is a right-heart reserve calibration signal. It does not establish
right-heart physiology acceptance.

## Boundary

This result can unlock a paired left/right MechanicsCore2 smoke. It does not
unlock runtime wiring, four-chamber integration, AV-plane release work, or
LandAtrial tuning.
