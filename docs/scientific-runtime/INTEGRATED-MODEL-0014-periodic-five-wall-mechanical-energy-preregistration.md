# Periodic five-wall mechanical-port and passive-energy ledger preregistration

Status: declaration only; this policy must be committed before the first new
0.5 ms mechanical-energy ledger result is evaluated

## Decision boundary

This protocol decides whether the implemented five-wall discrete mechanical
ledger is numerically stable and internally accountable on the canonical
period-1 orbit. A pass makes the qualified ledger eligible only for a sealed
official Experiment analysis result.

It does **not** create a public live Output Catalog item or Graph Catalog item.
It does not establish potential energy (PE), pressure-volume area (PVA),
myocardial oxygen consumption (MVO2), ATP use, mechanical efficiency, a
physiological normal range, physiological validation, or a clinical claim.
Those decisions remain false even if every gate below passes.

This is a ledger of model-owned mechanical stress work, declared elastic
storage, and the existing parallel-SLS dissipation terms. Land active stress
has no admitted thermodynamic stored-energy state in the current model.
Consequently, the ledger must not be renamed myocardial energy consumption,
contractile chemical energy, or a closed thermodynamic balance.

The committed internal identifiers retain `mechanical-energy` for V1 lineage,
but the admitted scientific name is **mechanical-port and passive-energy
ledger**. The Land-active entry is signed net stress work on the wall: positive
means work on the wall and negative commonly represents net mechanical
delivery during shortening. V1 does not publish a sign-split delivery,
absorption magnitude, or instantaneous power. Defining an interval-internal
sign crossing would require a separately frozen owner and is not inferred from
accepted endpoints here.

## Separate numerical owners

The five-wall ledger follows the discrete material step. For wall `k` and
stress component `s`, it uses the accepted backward-Euler endpoint:

```text
W_on_wall[k,s]
  = sum_n stress[k,s,n+1] * (fiberLogStrain[k,n+1] - fiberLogStrain[k,n])
      * wallMaterialVolumeMl[k] * 1e-3

unit: mJ
sign: positive is work on the wall
```

The components are total, Land active, equilibrium passive, and parallel SLS.
The matching discrete transmural cavity term is:

```text
W_cavity_on_wall
  = 0.133322 * sum_n P_transmural,n+1 * (V_n+1 - V_n)

unit: mJ
sign: positive is work on the wall
```

This owner is deliberately different from the already qualified periodic PV
external-work owner:

```text
EW_transmural_by_ventricle
  = -sum_n 0.5 * (P_transmural,n + P_transmural,n+1) * (V_n+1 - V_n)

unit: mmHg*mL
sign: positive is work by the ventricle
```

The backward-Euler ledger and trapezoidal PV line integral have different
quadrature and opposite work directions. This protocol does not merge them,
rename one as the other, or require bitwise equality between them. A sealed
result may reference the existing qualified LV/RV cavity-absolute,
transmural, and external-constraint work only with its original qualification
identity and pressure basis. It must not reintegrate a plotted or decimated PV
polyline. The existing boundary remains defined by
[INTEGRATED-MODEL-0006](INTEGRATED-MODEL-0006-pressure-volume-work-and-pva.md),
[INTEGRATED-MODEL-0009](INTEGRATED-MODEL-0009-periodic-external-work-qualification.md),
and the frozen admission in
[INTEGRATED-MODEL-0010](INTEGRATED-MODEL-0010-periodic-work-admission-preregistration.md).

## Sealed result contents

The physical refinement vector contains these cycle-integrated quantities:

- for each of `LA`, `LVFW`, `SEP`, `RVFW`, and `RA`, total, Land-active,
  equilibrium-passive, and parallel-SLS stress work on the wall;
- for each wall, equilibrium-passive stored-energy change;
- for each wall, parallel-SLS stored-energy change and physical dissipation;
- transmural cavity work on the wall for `LA`, `LV`, `RA`, and `RV`; and
- exact declared sums of the same quantities across all five walls and across
  the three ventricular walls.

The result also retains numerical and accounting evidence, but these fields
are not relabeled as physical output:

- stress-assembly residual for every wall;
- equilibrium-passive backward-Euler remainder for every wall;
- parallel-SLS backward-Euler numerical dissipation, reported discrete-balance
  residual, reconstructed discrete-balance residual, and readback-agreement
  residual for every wall;
- left-atrial, right-atrial, combined-ventricular, and whole-five-wall
  transmural work-conjugacy residuals;
- the LV/RV backward-Euler-to-trapezoid quadrature-bridge terms and algebraic
  residuals on the identical accepted measurement path; and
- source coverage, cycle, checkpoint, bridge, measurement, model-condition,
  protocol, and trace identities.

`SEP` remains a first-class wall. Its work, storage, dissipation, and residuals
must not be allocated to LV or RV. `LVFW + SEP + RVFW` may be reported as a
combined ventricular-wall total, but this protocol admits no separate LV- or
RV-myocardial wall-work quantity. Chamber-specific LV/RV PV work remains a
boundary measurement, not a septal allocation rule.

All internal ledger values use `mJ`. Existing PV work remains canonical in
`mmHg*mL`; `1 mmHg*mL = 0.133322 mJ` is a presentation conversion only, not a
second integration.

## Common pericardial bag boundary

Common-pericardial excess-pressure work on the bag, bag stored-energy change,
and its backward-Euler remainder may be retained as readback-only
characterization. They do not enter the physical refinement vector or the
admission conjunction, and no magnitude or direction claim is attached to
them in V1.

The common bag is not the complete external-constraint pressure basis.
Cavity-absolute minus transmural pressure can include common intrathoracic as
well as pericardial pressure. This protocol therefore does not substitute bag
work for the separately qualified external-constraint PV work and does not use
the bag to choose a future PVA pressure basis.

## Frozen execution

The only required real-model evidence pair is `normal-default` at 1 ms and
0.5 ms.

| Item                               | Frozen value                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| Model condition                    | identical complete `normal-default` condition identity                         |
| Initialization                     | independent cold start for each run                                            |
| Coarse nominal step                | 0.001 s                                                                        |
| Fine nominal step                  | 0.0005 s                                                                       |
| Numerical access                   | existing work-refinement evidence-only access for both arms                    |
| Requested P1 source-search horizon | exactly the existing canonical maximum of 250 cycles                           |
| Analysis continuation              | exactly one bridge cycle and one measurement cycle after the source checkpoint |
| Settlement                         | existing full accepted-state P1 policy                                         |
| P1 tolerance                       | existing maximum normalized delta `1e-3` for three consecutive cycles          |
| Sampling                           | every accepted endpoint, including event-clipped substeps                      |
| Interpolation/resampling           | none                                                                           |
| Synthetic end-to-start segment     | none                                                                           |

Valve-event detection, event ordering, and PV self-intersection do not gate
this signed whole-cycle ledger. V1 admits no event- or phase-partitioned work.

Both complete model-condition hashes must equal the canonical
`normal-default` identity and therefore equal each other. Equality of two
custom conditions is not sufficient for V1 admission. The protocol hashes
must be valid and different because nominal step size is part of the numerical
protocol. Neither run may inherit a checkpoint, state, controller history, or
accepted trajectory from the other.

Both arms must use the same existing work-refinement evidence-only access. A
historical Standard-access 1 ms run cannot be substituted for the coarse arm,
even when its nominal step and model condition happen to match.

Each arm must request the full canonical 250-cycle search horizon, although a
valid P1 source may settle earlier. The fixed bridge and measurement cycles
begin only after that source checkpoint and are not counted as additional
settlement-search cycles. They
must themselves retain P1; they do not extend the search when P1 was absent at
the source horizon.

Both runs must retain an exact terminal-checkpoint serialization/restore
round trip. The versioned readback bridge and the mechanical-energy
measurement must be linked to the same accepted terminal cycle, protocol,
model condition, and checkpoint. A valid bridge cannot substitute a live
observer, change solver feedback, fit a parameter, smooth a signal, or invent
a missing endpoint.

Before continuation, the source terminal accepted state must be serialized
again under the identical validated fixture and model condition. That
canonical checkpoint must equal the supplied source checkpoint exactly; a
checkpoint with only a matching clock or revision is insufficient. The
accepted mechanical readback must also pass a structural parse that binds the
declared provider model ID, `solveMode = trial`, provider claim, mechanics
identity, and all required five-wall numeric fields. An unchecked cast or a
caller assertion is not evidence.

The exact terminal accepted sample of the preceding cycle is the left endpoint
of the first measured segment. The terminal-cycle measurement then consumes
every accepted endpoint exactly once. Required coverage is exactly `1`, the
accepted segment count must match the terminal-cycle step count, and accepted
time increments must span the declared cycle without a gap or duplicate. Any
missing wall stress, fiber strain, material-energy readback, or lineage field
fails closed.

For every accepted observation, the evidence layer must independently verify
the previous and accepted revision pair, previous and accepted time pair,
accepted `dt`, cycle bounds, step index, and mechanical provider identity.
Only successfully committed steps may enter the trace; rejected trial
candidates must never contribute to an accumulated quantity.

The evidence artifact must retain the source sample count, start-boundary
identity, terminal checkpoint hash, bridge and measurement identities, and a
SHA-256 hash of the exact raw mechanical trace. The raw trace is evidence for
the sealed analysis; it is not republished as a live series or graph.

## Frozen admission gates

### Physical refinement

Every scalar in the physical refinement vector is compared independently:

```text
scaledDifference = abs(coarse - fine) / max(abs(fine), 1 mJ)
pass             = scaledDifference <= 0.01
```

When `abs(fine) >= 1 mJ`, coarse and fine must have the same sign. Below that
floor, the formula implies an absolute-difference limit of `0.01 mJ` and no
sign requirement. The floor and one-percent limit are numerical stability
criteria, not biological tolerances.

### Exact and discrete accounting

Every algebraically exact cycle residual must have absolute magnitude at most
`1e-8 mJ`. This includes wall stress assembly and the reported,
reconstructed, and readback-agreement forms of the SLS discrete balance. A
backward-Euler remainder or finite-increment wall/cavity conjugacy residual is
not silently reclassified as an algebraically exact identity.

The finite-increment wall/cavity conjugacy residual is screened separately for
`LA`, `RA`, the combined ventricular walls, and all five walls:

```text
conjugacyScaledFine
  = abs(conjugacyResidualFine)
      / max(abs(totalWallWorkFine), abs(transmuralCavityWorkFine), 1 mJ)

pass = conjugacyScaledFine <= 2e-3
```

The coarse and fine signed residuals, scaled residuals, and trend must all be
retained. Strict coarse-to-fine decrease is not an admission gate for this
signed finite-increment residual because component cancellation can make that
ordering unstable.

For each of LV and RV, the backward-Euler cavity term and existing
trapezoidal external-work term must come from exactly the same accepted
segments. Their quadrature bridge is the algebraic identity:

```text
W_external_by_ventricle_trap_mJ
  = 0.133322 * W_external_by_ventricle_trap_mmHgMl

quadratureBridgeResidual_mJ
  = W_cavity_on_wall_BE_mJ
    + W_external_by_ventricle_trap_mJ
    - 0.5 * 0.133322 * sum_n(
        (P_transmural,n+1 - P_transmural,n) * (V_n+1 - V_n)
      )

abs(quadratureBridgeResidual_mJ) <= 1e-8 mJ
```

The bridge verifies quadrature and sign ownership; it does not equate the two
work values or create a second PV integration.

Every accepted wall step must pass the existing parallel-SLS discrete
passivity test without changing its tolerance:

```text
stepTolerance = 1e-10 * max(
  1 J/m3,
  abs(SLS stress-work increment density),
  previous SLS stored-energy density,
  next SLS stored-energy density
)
```

At that tolerance, the per-step physical dissipation and backward-Euler
numerical dissipation must be nonnegative and the discrete-balance residual
must close. The cycle-integrated physical and backward-Euler SLS dissipation
reported for every wall must also be finite and nonnegative.

The evidence layer must independently reconstruct each wall-step residual as
`SLS stress work - stored-energy change - physical dissipation - backward-Euler
numerical dissipation`, compare it with the provider-reported residual at the
same tolerance, and retain the maximum reconstructed and readback-agreement
tolerance ratios. A cycle sum cannot hide opposing per-step errors.

Across all five walls, both numerical aggregates must strictly decrease under
refinement:

```text
sum(SLS backward-Euler numerical dissipation at 0.5 ms)
  < sum(SLS backward-Euler numerical dissipation at 1 ms)

sum(equilibrium-passive backward-Euler remainder at 0.5 ms)
  < sum(equilibrium-passive backward-Euler remainder at 1 ms)
```

The SLS aggregate must be nonnegative. The equilibrium-passive aggregate may
be no lower than `-1e-8 mJ`, so only roundoff at the frozen algebraic tolerance
is accepted before the strict-decrease comparison.

These terms remain numerical diagnostics. Decrease under refinement does not
turn either term into physical dissipation.

### Admission conjunction

The sealed analysis is eligible only when all of the following are true:

```text
official sealed mechanical-energy analysis eligible
  = both independent runs establish canonical P1
  AND both conditions are the complete canonical normal-default identity
  AND condition/protocol identities satisfy the frozen relation
  AND both exact checkpoint round trips pass
  AND each supplied source checkpoint exactly matches a checkpoint regenerated
      from that source terminal accepted state
  AND every accepted mechanical readback has the declared provider owner,
      solve mode, mechanics identity, and complete finite structure
  AND bridge and measurement lineage is complete and consistent
  AND both raw mechanical traces are complete and hashed
  AND full cycle coverage is exact
  AND every physical refinement metric passes
  AND every required sign check passes
  AND every algebraic residual passes
  AND all four fine-grid wall/cavity conjugacy screens pass
  AND both LV/RV BE-to-trapezoid quadrature bridges pass
  AND every per-step SLS passivity check passes
  AND all physical and BE SLS dissipation totals are nonnegative
  AND both aggregate numerical remainders strictly decrease
```

The official V1 evidence entrypoint accepts no arguments. It owns both cold
starts internally, recomputes the five published digests from their complete
checkpoint, trace, bridge-boundary, and material-binding preimages, replays the
pure ledger from the retained accepted samples, and rebuilds the physical,
algebraic, conjugacy, and quadrature projections. It also checks that declared
aggregate values are exact sums of their wall or cavity components. The pure
coarse/fine comparator may report whether numerical gates pass, but it must
always leave official eligibility false; only this canonical evidence adapter
may seal the pair and set the official flag.

A diagnostic value may be retained when the conjunction fails, but it is not
qualified and must carry the failure reasons. There is no partial admission by
wall and no LV-only or RV-only success state in V1.

## Publication and architecture boundary

Even after a pass, the result must retain these negative flags:

```text
publicLiveOutputCatalogAdmissionEstablished = false
publicGraphCatalogAdmissionEstablished       = false
PEEstablished                               = false
PVAEstablished                              = false
MVO2Established                             = false
ATPUseEstablished                           = false
mechanicalEfficiencyEstablished             = false
physiologicalValidationEstablished          = false
clinicalValidationClaimed                   = false
```

The existing live LV/RV transmural pressure-volume **path-work** outputs remain
capture-window observers. A settled P1 ledger must not replace them, share
their label, or enter the live hot path. No energy bars, instantaneous power
signals, PV shading, PE region, PVA region, oxygen conversion, or efficiency
ratio is admitted to the Graph Catalog by this protocol.

Any implementation must use a model-specific periodic five-wall
mechanical-energy analysis result and companion evidence type. It must not add
or widen a generic `ExperimentProtocol`, `ResultSet`, or equivalent platform
abstraction, and it does not require a public model ID, Output Registry schema,
or model-surface change.

V1 deliberately replays the complete hashed accepted-step evidence rather than
adding an accumulator to the registered solver checkpoint. This preserves the
existing exact model identity. A future model release may own a checkpointed
accumulator, but it must retain parity with this sealed analysis and cannot be
introduced as an implementation detail of V1.

## Declaration and result handling

This document and the matching executable policy must be committed before the
new 0.5 ms mechanical-energy ledger is evaluated, serialized, or inspected.
Before this declaration commit, an engineering-only 0.5 ms continuation test
was allowed to assert cycle timing, accepted-step counts, checkpoint round-trip
format, and observer coverage. That test did not invoke the ledger kernel,
serialize wall-mechanical readback, or inspect any new energy value. This
history is recorded here so that the prospective boundary is explicit rather
than implied.

After either numerical ledger result is inspected, the required run,
reportable vector, denominator, threshold, sign rule, residual tolerance,
conjugacy screen, quadrature-bridge identity, coverage rule, SLS rule,
numerical-remainder rule, or publication flag may not be relaxed.

A failure must be retained and reported. Changing this policy after a failure
requires a new versioned preregistration and new evidence that was unseen when
that replacement policy was frozen; the original result cannot be discarded
or retroactively admitted.

After this preregistration, its executable policy, and the official evidence
runner have been committed, the evidence pair must be executed exactly once
with this command:

```sh
npm run verify:scientific:periodic-five-wall-mechanical-energy-evidence-v1 -- --output docs/scientific-runtime/evidence/periodic-five-wall-mechanical-energy-evidence-v1.json
```

The CLI accepts no model, condition, protocol, checkpoint, projection, or
cold-start argument. It must write a canonical, raw-input-free artifact for
both execution and admission failures before returning a nonzero exit status.
