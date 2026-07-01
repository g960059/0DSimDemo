# Gate C Scaffold Robustness V1

Status: measured MechanicsCore2 Gate C neighborhood review, not four-chamber readiness.

Artifacts:

- `data/mechanics2/reports/gate-c-scaffold-robustness-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runGateCScaffoldRobustnessBench.ts`

## Purpose

The volume-reserve reservoir scan found a 7/7 Gate C scaffold at the center
configuration. This review asks whether that signal survives a small local
neighborhood around the RV upper pressure contribution and reservoir transfer
gain/cap.

This is intentionally still a sidecar review. It does not assemble a true
four-chamber circulation and does not change runtime behavior.

## Boundary

This review is not runtime wiring, true four-chamber coupling, morphology
acceptance, AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or
clinical validation.

The result may classify the Gate C scaffold as broad enough for a further
assembled-system review, or as too narrow to promote. It does not unlock
four-chamber, AV-plane, LandAtrial, or runtime/default work.

## Result

Decision: `gate-c-neighborhood-robust-signal`.

- 27 local neighborhood points measured.
- 18/27 preserve Gate C pass.
- The center scaffold passes.
- Passing RV upper pressure contribution spans 0.43-0.47.
- Passing reservoir variants span both gain 0.12 and gain 0.14 across
  transfer caps 3.5, 4, and 4.5 mL.
- Best passing scaffold:
  `right-volume-reserve-rv-dilated520-tref-26000-safety-0.25-pressure-0.47__vr-neighborhood-cap3.5-gain0.14-comp80`.
- Best passing mean absolute mismatch: ~5.13 mL.
- Max passing accepted transfer: ~1.77 mL.
- Max passing reservoir volume: ~19.45 mL.

This supports the Gate C scaffold as a neighborhood-level signal, not a single
point artifact. The next step is still assembled-system review before
four-chamber, AV-plane, LandAtrial, or runtime/default work.
