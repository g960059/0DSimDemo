# Right-Heart Volume-Reserve Contract V1

Status: measured MechanicsCore2 Gate C architecture signal, not four-chamber readiness.

Artifacts:

- `data/mechanics2/reports/right-heart-volume-reserve-contract-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runRightHeartVolumeReserveContractBench.ts`

## Purpose

The previous right low-output contract scan showed that right-heart forward
ejection can be aligned with the left low-output phenotype, but not cleanly:
aligned candidates failed through safety pressure, clamp, repeatability, or
morphology artifacts.

This bench tests a more explicit RV volume-reserve contract. It separates the
soft upper-volume reserve from the pressure contribution used in the right-heart
pressure-flow solve. The default contribution remains unchanged; this is a
sidecar candidate only.

The scan varies:

- RV active scale (`trefPa`)
- RV volume policy / dilation bounds
- RV upper safety gain
- RV upper soft-limit pressure contribution

The gate still rejects hidden large reserve. A candidate must align with the
left low-output ejection, be a clean right low-output phenotype, and keep the
unprojected upper-reserve equivalent bounded.

## Result

Decision: `right-volume-reserve-contract-signal`

- Candidates scanned: 108.
- Clean right low-output candidates: 2.
- Clean aligned volume-reserve candidates: 1.
- Best clean aligned candidate:
  `right-volume-reserve-rv-dilated520-tref-26000-safety-0.25-pressure-0.5`.
- Candidate PV ejection: ~10.2 mL versus left AoV ejection ~11.7 mL.
- Effective safety pressure: ~2.99 mmHg.
- Hidden upper-reserve equivalent: ~5.99 mmHg.
- Right-heart re-entry: 7/7 pass.
- Paired left/right re-entry: 7/7 pass.
- Stateful reservoir re-entry: still no-go, best 5/7. Remaining blockers are
  `preload-low` reservoir non-repeatability and `contractility-low` right-surface
  loss under reservoir feedback.

This is a real architecture signal: right low-output can be made clean without
using safety pressure as the pump, and the candidate generalizes to the right
surface and paired smoke. It is not enough for Gate C, because reservoir
feedback still breaks the low-contractility right surface.

## Boundary

This is not runtime wiring, true four-chamber coupling, morphology acceptance,
AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or clinical
validation.

Next work should focus on reservoir feedback compatibility with this
volume-reserve candidate. Four-chamber, AV-plane, LandAtrial, runtime wiring,
and morphology acceptance remain blocked.
