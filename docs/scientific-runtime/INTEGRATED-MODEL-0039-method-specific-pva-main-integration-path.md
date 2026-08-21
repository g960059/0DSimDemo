# Integrated model 0039: method-specific PVA path to main

## Decision

PVA is intended to enter `main`. The first product target is not an
unqualified live scalar. It is an on-demand completed-protocol analysis with
the explicit method identity:

```text
method ID          = suga-compatible-pva-estimate-phase-wise-venous-occlusion-fixed-passive-slice-v1
load protocol       = transient venous-return reduction, occlusion ramp
systolic relation   = maximum-positive phase-wise isochronal relation
diastolic reference = fixed-contralateral intrinsic passive center slice
pressure basis      = ventricular transmural pressure
external work       = periodic 1 ms trapezoidal cavity work
area rule           = periodic EW + systolic-minus-passive PE equivalent
lower boundary      = explicit systolic V0 extrapolation
```

Release-ramp fits remain a sensitivity diagnostic and are not silently pooled
with the occlusion relation. Generic PVA, clinical PVA, MVO2, and a live
single-beat PVA signal remain separate claims.

## Current research estimate

The checked-in projection retains the present estimates but does not publish
them as product values:

| output                                         | research estimate | product value | evidence                |
| ---------------------------------------------- | ----------------: | ------------: | ----------------------- |
| LV phase-wise venous-occlusion PVA estimate V1 |          1.5815 J |          none | extrapolation-dependent |
| RV phase-wise venous-occlusion PVA estimate V1 |          0.5884 J |          none | extrapolation-dependent |

The target surface is `completed-protocol-analysis`, not the accepted-state
output registry. A phase-wise relation requires an ensemble of preload beats
and cannot be reconstructed honestly from one live sample.

The transient family and periodic ledger now match on model condition,
protocol, terminal P1 checkpoint, accepted time, accepted revision, and 1 ms
step. That is useful source compatibility, but it is not the identity of all
PVA inputs. The fixed passive center slice was produced independently and is
not bound to the same analysis transaction. The result therefore remains
`qualification-required`.

## Method-specific output contract

The candidate contract already separates the fields needed by an eventual
main owner:

- the versioned method ID and completed-protocol target;
- phase, elastance, V0, fit residual, measured volume range, and
  leave-one-beat-out ranges;
- fixed contralateral passive-slice identity and supported volume range;
- external work, potential-energy equivalent, PVA estimate, and mechanical
  conversion ratio;
- occlusion-release slope sensitivity, extrapolated area fraction, and the
  1 ms-to-0.25 ms external-work difference; and
- blockers and limitations as separate fields.

Names intentionally use `pvaEstimate` and `potentialEnergyEquivalent`. They do
not claim true stored energy, oxygen efficiency, or a generic PVA owner.

## Qualification required before product publication

The next bounded study is `phase-wise-pva-qualification-v2`. It must:

1. generate the transient family, periodic work, and passive reference from
   one baseline analysis transaction;
2. report the estimate obtained when the baseline beat is excluded from the
   systolic fit;
3. retain Ca, Land, fibre-strain/rate, septal, contralateral-volume, and
   pericardial-pressure dispersion at the selected phase; and
4. measure local phase-resolution sensitivity near Emax.

Direction dependence and V0 extrapolation do not have to become zero. They do
have to remain visible as method uncertainty. The current LV release slope is
about 31.7% above the occlusion slope, while the RV difference is about -1.4%.
The systolic area outside the measured fit range is about 45.2% for LV and
12.5% for RV.

The passive reference is also explicit rather than generic. The LV slice fixes
RV volume; the RV slice fixes LV volume. A baseline-conditioned or
pericardium-inclusive reference would be a separately versioned method, not a
silent change to this output.

## Corrected predecessor semantics

The accompanying geometry V3 projection corrects the predecessor diagnostic
without rerunning the model:

- 21 retained nonpositive-slope rows are `relation-inadmissible`, while the 42
  genuinely missing rows remain `method-unavailable`;
- exact endpoint equality, numerical periodic qualification, and transient
  open paths are distinct fields;
- all 42 retained transient loops are open paths and none is promoted by an
  artificial closure;
- method-specific PVA and passive-reference rows are matched by scientific
  keys and retained values; and
- supported intersections are checked for a later second crossing.

Individual phase-fit failures are retained as phase-local unavailable
outcomes. One degenerate phase therefore no longer discards the other valid
phase candidates.

These are ordinary research-lane checks. No commit-hash authority, evidence
journal, or certification schema is added.

## Main integration sequence

1. Merge this research result and method-selection contract.
2. Complete the bounded V2 qualification above in one analysis transaction.
3. Add an on-demand main analysis owner and cache it by scenario, checkpoint,
   method, and protocol identity.
4. Present status, method, extrapolated fraction, direction sensitivity, and
   uncertainty beside LV and RV estimates in the advanced analysis UI.
5. Consider a generic `PVA` alias only after multiple presets and pathologies
   show that removing the method qualifier is scientifically defensible.

The intended product experience is therefore:

```text
Stroke work     available from the periodic cycle
PVA estimate    not analyzed
[Run PVA analysis]
```

After analysis, the UI may show the versioned limited estimate. It must not
run a 21-beat sweep silently on every ordinary simulation update.
