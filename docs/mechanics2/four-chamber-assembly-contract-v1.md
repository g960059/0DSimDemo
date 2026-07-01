# Four-Chamber Assembly Contract V1

Status: MechanicsCore2 sidecar assembly contract, not runtime wiring.

Artifacts:

- `data/mechanics2/reports/four-chamber-assembly-contract-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runFourChamberAssemblyContractBench.ts`

## Purpose

Gate C passed both the center and best-neighborhood assembled scaffold reviews.
This contract turns that signal into a typed four-chamber assembly ledger before
any true four-chamber dynamics are implemented.

The contract fixes the minimum owned surfaces for the next sidecar assembly:

- chambers: LA, LV, RA, RV,
- valves: MV, AoV, TV, PV,
- reservoirs: pulmonary venous and systemic venous,
- ledgers: left/right forward ejection, mismatch, reservoir volumes,
  reservoir residual, pressure adjustments, accepted transfer, and accepted
  phenotypes.

## Boundary

This is not true four-chamber dynamics. It does not introduce runtime wiring,
AV-plane state, LandAtrial, morphology acceptance, CircAdapt equivalence, or
clinical validation.

If this contract passes, the next step is a sidecar four-chamber assembly smoke
that implements this ledger. Runtime/default work remains blocked.

## Result

Decision: `four-chamber-assembly-contract-pass`.

- Reviewed scaffolds: center and best-neighborhood.
- Contract pass: 2/2.
- Required chamber/valve/reservoir sets are present.
- Accepted phenotype scope is limited to clean low-contractility low-output on
  both sides at `contractility-low`.
- Max passing forward mismatch: ~8.0 mL.
- Max passing accepted transfer: ~1.77 mL.
- Max passing reservoir volume: ~19.45 mL.

This unlocks a sidecar four-chamber assembly smoke that implements this
contract. It does not unlock runtime/default work, AV-plane, LandAtrial, or
morphology acceptance.
