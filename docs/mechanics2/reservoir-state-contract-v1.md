# Reservoir-State Contract V1

Status: measured MechanicsCore2 Gate C diagnostic, not four-chamber readiness.

Artifacts:

- `data/mechanics2/reports/reservoir-state-contract-report-v1.json`
- Runner: `npx vite-node --script tools/mechanics2/runReservoirStateContractBench.ts`

## Purpose

The reservoir-solver bridge showed that per-profile scalar transfer can preserve
morphology and reduce mismatch, but it relied on large static transfer in many
profiles and did not solve `contractility-low`.

This bench replaces the profile-oracle scalar solve with an explicit
pulmonary/systemic reservoir volume state:

- reservoir volume state changes only through accepted left-right transfer
- reservoir pressure follows the stored volume and venous compliance
- per-epoch transfer is bounded
- the total pulmonary/systemic reservoir ledger must remain clean
- persistent large shuttles and non-repeatable final state are Gate C blockers

## Result

Decision: `no-go`

Best variant: `stateful-high-compliance-cap6-gain018`

- Pass: 5/7
- Morphology preserved: 6/7
- Flow-balanced: 6/7
- Pressure adjustment bounded: 7/7
- Reservoir ledger clean: 7/7
- Per-epoch transfer bounded: 7/7
- Persistent reservoir bounded: 7/7
- Repeatable final state: 6/7
- Mean final absolute mismatch: ~8.1 mL versus open reference ~8.5 mL
- Max accepted transfer: ~4.1 mL
- Max reservoir volume: ~33.5 mL

This is a useful negative/diagnostic result. The stateful contract removes the
scalar solver's large static transfer signal, but it does not reach Gate C. The
remaining blockers are:

- `preload-low`: flow-balanced and morphology-preserved, but final reservoir
  state is not repeatable.
- `contractility-low`: reservoir pressure feedback breaks the left surface and
  leaves left-right forward-ejection mismatch.

The longer conservative variant confirms this is not just slow convergence:
`contractility-low` grows to a persistent reservoir shuttle above 60 mL and
still does not become a clean flow-balanced state.

## Boundary

This is not runtime wiring, true four-chamber coupling, morphology acceptance,
AV-plane readiness, LandAtrial readiness, CircAdapt equivalence, or clinical
validation.

Next work should treat Gate C as blocked by low-contractility profile severity
and reservoir state feedback. Do not unlock four-chamber, AV-plane, or
LandAtrial work from this result.
