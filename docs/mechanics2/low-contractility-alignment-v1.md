# Low-Contractility Alignment V1

Status: measured MechanicsCore2 Gate C attribution, not four-chamber readiness.

Artifacts:

- `data/mechanics2/reports/low-contractility-alignment-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runLowContractilityAlignmentBench.ts`

## Purpose

The reservoir-state contract showed that the `contractility-low` residual is
not solved by explicit reservoir volume state. Reservoir pressure feedback
breaks the left surface and leaves left-right forward-ejection mismatch.

This attribution bench asks whether that blocker is merely a right-heart
low-contractility severity mismatch:

- left low-contractility remains the owner-approved clean low-output phenotype
  with ~11.7 mL AoV ejection.
- baseline right low-contractility remains clean morphology but ejects ~31.4 mL.
- right RV `trefPa` is scanned downward.
- a second scan also lowers RA/RV soft-safety gains to test whether the mismatch
  is only safety-pressure ownership.

## Result

Decision: `no-clean-alignment`

- Left low-contractility: pass, clean low-output phenotype, AoV ejection
  ~11.7 mL.
- Baseline right low-contractility: pass, PV ejection ~31.4 mL.
- Right severity scan: 8 candidates, 3 flow-balanced, 0 clean aligned.
- Best severity-only point: `right-low-tref-14000`, mismatch ~1.5 mL, but it
  fails on low output plus safety-pressure dominance.
- Right safety-ownership scan: 16 candidates, 0 clean aligned.
- Best safety scan point: `right-low-tref-22000-safety-0.25`, mismatch
  ~0.29 mL, but it fails on volume clamp / low-output artifacts.

The residual is therefore not safe to hide with reservoir tuning, and it is not
resolved by simply weakening right contractility or lowering right safety
pressure. Gate C needs a deeper low-output contract: right low-output phenotype,
volume safety ownership, and reservoir feedback must be made compatible before
four-chamber work.

## Boundary

This is not runtime wiring, true four-chamber coupling, morphology acceptance,
AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or clinical
validation.
