# Periodic five-wall mechanical-port and passive-energy ledger result

Status: the first preregistered evidence execution failed closed during the
fine-arm evidence seal; no mechanical-energy analysis was admitted

## Lineage

The complete policy, numerical runner, ledger, evidence sealer, and immutable
artifact writer were committed as `0c688dca` and `a30edd33` before the first
new 0.5 ms execution. The retained artifact was committed unchanged as
`2f2b74e3`:

[`evidence/periodic-five-wall-mechanical-energy-evidence-v1.json`](evidence/periodic-five-wall-mechanical-energy-evidence-v1.json)

Its canonical payload SHA-256 is
`41998f2dfbe07a2449dc0ca033f56b8753e115339c2cc0d8a0d8e1416927f55a`.
The SHA-256 of the complete serialized file is
`6040146406d1b99726920af99e0ef1a231a00e3984577f48161df634dee5359e`.

The documented official command was invoked exactly once against a previously
absent create-only output path. The process completed normally and wrote the
failure artifact before returning a nonzero exit status. No tolerance,
denominator, physical metric, sign rule, P1 policy, model condition, numerical
grid, or admission flag was changed after execution.

## Frozen outcome

The executable decision is:

```text
evidenceStatus                                      = evidence-verification-failed
coarse 1 ms arm                                     = projection-sealed
fine 0.5 ms source                                  = qualified-for-refinement-comparison
fine 0.5 ms arm                                     = not-sealed
pair admission                                      = not evaluated
officialSealedMechanicalEnergyAnalysisEligible      = false

publicLiveOutputCatalogAdmissionEstablished         = false
publicGraphCatalogAdmissionEstablished               = false
PE / PVA / MVO2 / ATP use established                = false
mechanical efficiency established                    = false
physiological / clinical validation established      = false
```

The retained failure reason is
`fine:ledger-projection-binding-mismatch`. This outcome must not be rewritten
as a passing V1 result, even if the verifier defect described below is fixed.

## What passed before the failure

The 1 ms arm reached its P1 source at cycle 71, then retained P1 through the
declared bridge and measurement cycles. It sealed all source, protocol,
condition, checkpoint, accepted-lineage, readback, material-volume, raw-trace,
quadrature, algebraic, and per-step SLS gates.

The independent 0.5 ms source also qualified for refinement comparison. Its
source scope, all single-arm scientific gates, accepted lineage, five published
hash bindings, ledger recomputation, and quadrature provenance passed. The
recomputed ledger was canonical-JSON identical to the ledger returned by the
single-arm measurement owner. The failure occurred only while requiring a
second, redundant compact projection of that already identical ledger to be
bit-exact to the producer projection.

Because the fine projection was not sealed, the pair comparator correctly did
not expose or evaluate the 53-metric refinement vector. No conclusion about
the preregistered 1% physical-refinement gate, conjugacy magnitude, or
backward-Euler remainder convergence follows from this artifact.

## Verifier defect

The single-arm owner reports whole-heart work conjugacy from the ledger-owned
field `workConjugacyResidualMilliJ.allFiveWalls`. The ledger constructs that
field using these accumulation orders:

```text
wall   = reduce([LA, LVFW, SEP, RVFW, RA])
cavity = LA + LV + RA + RV
```

The evidence sealer independently reconstructed the same mathematical residual
with different parenthesization:

```text
wall   = LA + (LVFW + SEP + RVFW) + RA
cavity = LA + (LV + RV) + RA
```

It then compared the complete projection with canonical-JSON string equality.
Floating-point addition is not associative, so mathematically equivalent
whole-heart sums can differ in their last binary place. The 1 ms values happened
to serialize identically; the 0.5 ms values did not. The ledger itself,
including its owned residual, had already recomputed exactly.

This is an evidence-sealing false negative, not evidence that the wall
mechanics, passive storage, SLS dissipation, cavity work, or their physical
refinement failed. Conversely, the unavailable fine projection must not be
reconstructed from the coarse result or treated as an implicit pass.

## Corrective boundary

The V1 artifact and decision remain immutable. A corrective attempt requires a
new declaration commit, artifact identity, and create-only path. Before that
attempt:

1. one reusable pure projection owner must derive all physical metrics,
   algebraic residuals, and conjugacy fields from the recomputed ledger;
2. both the single-arm producer and evidence sealer must call that owner rather
   than maintain algebraically equivalent copies;
3. a regression fixture must demonstrate the previous non-associative
   whole-heart summation failure and the corrected exact binding;
4. independent admission checks must continue to recompute aggregate sums,
   conjugacy, SLS balances, and quadrature identities from the sealed vectors;
   and
5. every numerical and scientific threshold from the original preregistration
   must remain unchanged.

Only a newly identified, preregistered execution may decide the mechanical-port
and passive-energy ledger admission. PE, PVA, MVO2, active delivery/absorption
splitting, instantaneous power, and public catalog publication remain outside
that correction.
