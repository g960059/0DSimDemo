# Reservoir-Solver Bridge V1

Status: measured MechanicsCore2 bridge smoke, not true four-chamber coupling.

Artifacts:

- `data/mechanics2/reports/reservoir-solver-bridge-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runReservoirSolverBridgeBench.ts`

## Purpose

The black-box reservoir bridge was better than source-pressure feedback, but it
still used epoch-delayed reservoir pressure updates. This bench tries a
same-profile algebraic reservoir solve:

- left surface: `active-length-mv-closure-stateful-root08`
- right surface: `right-heart-strategic-smoke-report-v1`
- unknown: scalar transfer between pulmonary and systemic venous reservoirs
- constraint: paired reservoir ledger remains clean while pulmonary/systemic
  venous pressure adjustments stay bounded

This is still a sidecar bridge smoke. It is not a same-timestep ModelCore
runtime, full four-chamber solver, or clinical circulation closure.

## Result

Decision: `promising-mixed-signal`

- Open-reservoir reference: pass 5/7, morphology preserved 7/7, flow balanced
  5/7, mean absolute forward-ejection mismatch ~8.5 mL.
- Best solver variant: `same-step-high-compliance-bound2`.
- Best solver variant: pass 6/7, morphology preserved 7/7, flow balanced 6/7,
  pressure adjustment bounded 7/7, reservoir ledger clean 7/7, mean absolute
  mismatch ~4.0 mL.
- Remaining blocker: `contractility-low`, where morphology is preserved but
  left/right forward ejection remains mismatched.
- The best solver uses a large reservoir transfer in some profiles
  (max ~54 mL) while keeping pressure adjustments small. That transfer magnitude
  is evidence to carry forward, not a hidden acceptance claim.

The signal is stronger than the epoch reservoir bridge because it preserves
morphology 7/7 while reducing mismatch substantially. It still does not pass the
full envelope, and its large transfer magnitude must be explained before
four-chamber promotion.

## Boundary

This is not runtime wiring, true four-chamber coupling, morphology acceptance,
AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or clinical
validation.

Next work should classify the `contractility-low` residual and decide whether
the large accepted reservoir transfer should become a stateful reservoir volume
in a true same-step sidecar circulation contract.
