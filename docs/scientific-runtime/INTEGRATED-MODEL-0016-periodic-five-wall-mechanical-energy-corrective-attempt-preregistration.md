# Periodic five-wall mechanical-energy evidence corrective-attempt preregistration

Status: declaration only; this correction and its executable verifier must be
committed before the new 0.5 ms corrective-attempt result is evaluated

## Prior immutable outcome

The first evidence execution is permanently retained as
[`evidence/periodic-five-wall-mechanical-energy-evidence-v1.json`](evidence/periodic-five-wall-mechanical-energy-evidence-v1.json),
with canonical payload SHA-256
`41998f2dfbe07a2449dc0ca033f56b8753e115339c2cc0d8a0d8e1416927f55a`.
Its outcome remains `evidence-verification-failed`, its pair admission remains
unevaluated, and its official eligibility remains false.

The retained result and defect analysis are recorded in
[INTEGRATED-MODEL-0015](INTEGRATED-MODEL-0015-periodic-five-wall-mechanical-energy-result.md).
The original artifact must not be overwritten, amended, replaced, or relabeled
as a pass.

## Exact correction

The first attempt failed because the single-arm producer and evidence sealer
formed the whole-heart conjugacy residual with mathematically equivalent but
differently parenthesized floating-point sums, then required canonical-JSON
exact equality. The ledger itself had recomputed exactly in both arms.

The corrective implementation is limited to one evidence-layer ownership
change:

```text
recomputed accepted-step samples
  -> model-owned five-wall ledger kernel
  -> one reusable pure ledger-projection owner
  -> compact arm seal
```

The projection owner must be the only implementation that derives the 53
physical metrics, 20 algebraic residuals, four conjugacy records, all-five SLS
backward-Euler numerical dissipation, and all-five equilibrium-passive
backward-Euler remainder from a ledger. The single-arm producer and evidence
sealer must call the same owner. In particular, a projection must publish the
ledger-owned conjugacy residual instead of reconstructing an algebraically
equivalent residual with a second accumulation order.

This shared projection does not make the evidence self-attesting. The sealer
must still independently rebuild the complete ledger from the retained raw
accepted-step evidence and model-bound wall material volumes. The admission
comparator must still independently reconstruct aggregate sums, stress
assembly, SLS balances, conjugacy, backward-Euler aggregates, and LV/RV
quadrature identities from the sealed vectors.

The regression suite must contain a finite synthetic ledger for which the old
whole-heart parenthesization differs from the ledger owner in the last binary
place. It must prove that the corrected projection binds exactly and that a
tampered physical, residual, lineage, or hash field still fails closed.

## New attempt identity

The only corrective execution has this immutable outer identity:

```text
attemptId:
  main-wire-integrated-model-periodic-five-wall-mechanical-energy-evidence-v1-corrective-attempt-1

output:
  docs/scientific-runtime/evidence/
    periodic-five-wall-mechanical-energy-evidence-v1-corrective-attempt-1.json
```

The artifact must bind:

- the original failed artifact ID and canonical payload SHA-256;
- the unchanged V1 ledger, single-arm qualification, evidence, and admission
  policy identities;
- the reusable projection-owner identity;
- both fresh arm seals and the pair-sealed payload hash; and
- an explicit declaration that this is the first and only corrective attempt
  for the identified projection-binding defect.

The output path must be absent before execution and written create-only. An
existing file, an output-path race, an execution exception, an unsealed arm,
or a failed admission must remain a retained failure and must not trigger a
second execution.

## Frozen numerical protocol

Both arms are recomputed from fresh independent cold starts. The sealed coarse
projection from the failed attempt is not reused.

Every original V1 execution and admission rule remains unchanged:

| Item                                    | Frozen value                                                   |
| --------------------------------------- | -------------------------------------------------------------- |
| Condition                               | canonical `normal-default` complete identity                   |
| Coarse nominal step                     | 0.001 s                                                        |
| Fine nominal step                       | 0.0005 s                                                       |
| Source-search horizon                   | exactly 250 cycles requested per arm                           |
| Settlement                              | existing full accepted-state P1 policy                         |
| Continuation                            | one bridge cycle plus one measurement cycle                    |
| Sampling                                | every accepted endpoint; no interpolation or synthetic closure |
| Physical-vector scaled-difference limit | 1%                                                             |
| Sign gate                               | same sign when `abs(fine) >= 1 mJ`                             |
| Algebraic and quadrature absolute limit | `1e-8 mJ`                                                      |
| Fine conjugacy scaled-residual limit    | `2e-3`                                                         |
| SLS and passive numerical terms         | original nonnegative and refinement rules                      |

The prior artifact withheld the fine projection, so it supplied no fine
physical metric, sign, conjugacy, or refinement value that could be used to
tune this correction. No threshold may be relaxed after the corrective output
is observed.

## Decision boundary

If both new arms seal, the unchanged admission comparator evaluates the
previously frozen conjunction. A pass establishes only eligibility for a
sealed official mechanical-port and passive-energy analysis. A failed gate is
retained as the final corrective-attempt outcome; there is no automatic second
correction or retry.

Regardless of outcome, this attempt does not establish or publish:

- a public live Output Catalog or Graph Catalog item;
- PE, PVA, MVO2, ATP use, or mechanical efficiency;
- Land thermodynamic stored energy;
- active mechanical delivery/absorption splitting or instantaneous power;
- a physiological normal range, physiological validation, or clinical
  validation; or
- separate LV- and RV-myocardial wall energy through allocation of `SEP`.

No numerical `modelId` is minted. The correction changes only a sealed
analysis verifier; it does not alter the solver, accepted state, mechanism,
fixture, checkpoint, or exact Standard artifact.
