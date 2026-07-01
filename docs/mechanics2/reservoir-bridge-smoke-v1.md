# Reservoir-Bridge Smoke V1

Status: measured MechanicsCore2 bridge smoke, not true same-step circulation.

Artifacts:

- `data/mechanics2/reports/reservoir-bridge-smoke-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runReservoirBridgeSmokeBench.ts`

## Purpose

The source-pressure circulation bridge reduced left/right forward-ejection
mismatch only by damaging subsystem morphology. This bench tests a more explicit
reservoir ledger:

- left surface: `active-length-mv-closure-stateful-root08`
- right surface: `right-heart-strategic-smoke-report-v1`
- bridge action: accumulate left-minus-right forward-ejection mismatch in
  pulmonary and systemic venous reservoirs, then feed the resulting reservoir
  pressure back to each side over several epochs

This is still a black-box bridge smoke. It conserves the paired reservoir ledger
inside the bench, but it is not a same-step four-chamber circulation solve.

## Result

Decision: `promising-mixed-signal`

- Open-reservoir reference: pass 5/7, morphology preserved 7/7, flow balanced
  5/7, mean absolute forward-ejection mismatch ~8.5 mL.
- Best reservoir variant: `ledger-high-compliance-gain025`.
- Best reservoir variant: pass 6/7, flow balanced 6/7, pressure adjustment
  bounded 7/7, reservoir ledger clean 7/7, mean absolute mismatch ~8.1 mL.
- Remaining blocker: `contractility-low`, where the bridge loses the left
  surface and still leaves a left/right forward-ejection mismatch.

The signal is better than source-pressure feedback because the reservoir ledger
stays clean and the pressure adjustments are small. It is still not an adoption
surface: stronger reservoir gains reduce mismatch more aggressively but damage
morphology.

## Boundary

This is not runtime wiring, true four-chamber coupling, morphology acceptance,
AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or clinical
validation.

Next work should turn the reservoir/mass-ledger bridge into a true same-step
coupling surface rather than continuing black-box pressure-source feedback. RV
pressure magnitude calibration remains provisional and not PH/RV-failure-ready.
