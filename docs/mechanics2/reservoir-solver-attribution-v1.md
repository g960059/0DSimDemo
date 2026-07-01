# Reservoir-Solver Attribution V1

Status: measured MechanicsCore2 attribution, not four-chamber readiness.

Artifacts:

- `data/mechanics2/reports/reservoir-solver-attribution-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runReservoirSolverAttributionBench.ts`

## Purpose

The reservoir-solver bridge improved the paired signal but still had two
promotion blockers:

- `contractility-low` remained flow-mismatched.
- Some passing profiles used large accepted reservoir transfer.

This attribution bench separates those issues before any four-chamber,
AV-plane, or LandAtrial work.

## Result

Decision: `stateful-reservoir-required`

- Accepted transfer summary: 7 total profiles, 5 large-transfer profiles.
- Maximum accepted transfer: ~54 mL.
- Maximum transfer-to-forward-flow ratio: ~1.33.
- `contractility-low`: accepted transfer 0 mL, accepted mismatch ~19.8 mL.
- `contractility-low` accepted-bound and wide-diagnostic scans both preserve
  morphology but never find a flow-balanced transfer.
- Classification: `profile-severity-mismatch`.

The scalar solver is useful as an oracle-like diagnostic: it shows reservoir
transfer can preserve morphology and reduce mismatch in most profiles. It is
not a promotion path. Passing profiles depend on large static reservoir offsets,
and the low-contractility mismatch is not solved by wider scalar transfer.

## Boundary

This is not runtime wiring, true four-chamber coupling, morphology acceptance,
AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or clinical
validation.

Next work should create a stateful reservoir / mass-ledger contract. It must
carry reservoir volume state explicitly and keep `contractility-low` mismatch
plus large persistent transfer as Gate C blockers until resolved.
