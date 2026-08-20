# Periodic five-wall mechanical-port ledger dt characterization

Status: declaration only; this document and its README index must be committed
before the first normal-adult source or replay evaluation for this protocol

## Decision

The next dynamic-mechanics step is one nonofficial Engineering
characterization of the accepted-path mechanical-port ledger at three fixed
nominal steps:

```text
coarse:  0.001 s
middle:  0.0005 s
fine:    0.00025 s
```

The experiment asks whether quantities with different numerical meanings show
the corresponding refinement patterns when all three arms start from one
shared canonical period-1 checkpoint and independently execute one unmeasured
bridge cycle followed by one measured cycle.

This is not a new periodic qualification and has no blanket relative-error
admission rule. Finite-limit mechanical quantities, zero-limit discretization
remainders, cycle-closure diagnostics, and algebraic integrity residuals are
classified before execution and are never judged by one common threshold.

The work remains one substantial pull request with a declaration commit, an
implementation commit, and one result commit. Normal-adult source or replay
evaluation is forbidden until the declaration and implementation commits are
separately fixed and clean.

## Predecessor binding

The experiment consumes the merged Engineering ledger without changing its
scientific meaning:

```text
mechanical-port ledger implementation commit:
  f69ca7f8f0830eb7facfea10fb09904fee9c87cd
mechanical-port ledger merge commit:
  31d15b564367d8467d7d82f4d91d9c79d6913deb
declaration parent / current main commit:
  b1d46922ab5e2aabdb417f8f2a1dede6c7504933
pure ledger owner:
  main-wire-five-wall-mechanical-port-ledger-engineering-v1
integrated replay owner:
  main-wire-integrated-model-periodic-five-wall-mechanical-port-ledger-engineering-v1
```

The predecessor established the ledger structure and accepted-path bridge. It
did not numerically qualify any ledger quantity. This declaration does not
reinterpret it as qualification evidence.

## New Engineering identities

```text
declarationId:
  integrated-model-0029-periodic-five-wall-mechanical-port-ledger-dt-characterization
characterizationOwnerId:
  main-wire-integrated-model-periodic-five-wall-mechanical-port-ledger-dt-characterization-v1
protocolId:
  main-wire-integrated-model-periodic-five-wall-mechanical-port-ledger-dt-characterization-protocol-v1
numericalAccessId:
  main-wire-integrated-model-periodic-mechanical-port-ledger-1ms-0.5ms-0.25ms-access-v1
projectionOwnerId:
  main-wire-five-wall-mechanical-port-ledger-dt-projection-v1
reportSchemaId:
  main-wire-integrated-model-periodic-five-wall-mechanical-port-ledger-dt-characterization-report-v1
```

These are Engineering identities only. They do not revise the Standard V3
periodic policy or mint a new Standard runner, official-evidence owner, PVA,
oxygen-demand, metabolic, or public-output identity.

## Shared source and fixed execution order

The zero-argument runner owns one normal-adult source execution:

```text
runner: runMainWireIntegratedModelPeriodicSteadyV3
nominalDtSec: 0.001
maximumCycleCount: 250
executionPurpose: canonical-evidence
condition: normal-adult regular-sinus all-off defaults
required classification: P1
```

The source is executed exactly once. Its exact terminal checkpoint, terminal
cycle index, condition identity, protocol identity, classification, complete
accepted-state comparator, checkpoint digest, and exact checkpoint round-trip
status are retained. The source is internally created rather than supplied by
a caller, but this Engineering protocol does not transfer official,
historical, physiological, or public qualification.

After a successful P1 source, all three replay arms use that same source
checkpoint. They are attempted in fixed order `coarse`, `middle`, `fine`, but
no arm consumes another arm's terminal state:

1. exact-restore and exact-round-trip the shared source checkpoint;
2. run one unmeasured bridge cycle at the arm's nominal step;
3. run one measured cycle at the same step;
4. reduce only committed successful accepted intervals from the measured
   cycle into the unchanged V1 ledger;
5. checkpoint and exact-round-trip the arm terminal state.

After source success, an earlier arm failure does not suppress later arms.
All three arms are attempted once with all-settled retention. Source failure
prevents every arm because no shared checkpoint exists; it is retained as a
failed characterization result rather than replaced by a cold start.

## Analysis-only fine-grid access

The Standard periodic policy remains unchanged:

```text
Standard minimum nominal dt: 0.001 s
Standard maximum accepted steps per cycle: 1100
```

The two finer arms use a new analysis-only numerical access owned by this
protocol. It accepts exactly the set `{0.001,0.0005,0.00025}` seconds and no
intermediate or smaller value. Its accepted-step bounds are fixed by arm:

```text
0.001 s:   1100
0.0005 s:  2200
0.00025 s: 4400
```

The bounds provide the same ten-percent event-clipping headroom at each grid.
They are execution guards, not convergence thresholds. The fine-grid access
may be reached only through the characterization replay owner. It cannot be
passed into the Standard runner, cannot widen Standard's public option type,
and cannot change the canonical one-cycle executor.

The existing one-millisecond replay entry point retains its current Standard
policy check and behavior. A new versioned characterization entry point may
share its private accepted-cycle implementation but must require the exact
access identity and step set above. Importing or constructing any owner must
not execute the model.

## Unchanged ledger semantics

The characterization reuses the complete V1 ledger. In particular:

- wall backward-Euler work uses right-endpoint stress;
- cavity backward-Euler and trapezoidal works remain distinct;
- active stress work remains a mechanical port quantity only;
- equilibrium-passive stored change and BE remainder remain distinct;
- physical SLS dissipation and BE numerical dissipation remain distinct;
- common-pericardium work remains outside transmural chamber work;
- SEP remains unallocated between LV and RV; and
- stress assembly and SLS readback residuals retain their predecessor
  integrity meanings.

No projection may change a sign, unit, summation order, wall or chamber order,
pressure basis, storage formula, or source binding from the V1 ledger.

## Frozen projection taxonomy

Every projected value is measured in millijoules. Ordered identifiers and
their source fields are frozen in the protocol payload. Duplicate or missing
identifiers fail replay.

### Finite-limit quantities

The following 25 quantities are expected to approach finite path values and
are characterized by adjacent-grid differences, not by convergence to zero:

1. trapezoidal transmural cavity work for `LA`, `LV`, `RA`, and `RV`;
2. active mechanical `deliveryPositive`, `absorptionMagnitude`, and
   `netDelivery` for `LA`, `LVFW`, `SEP`, `RVFW`, and `RA`;
3. physical SLS dissipation for the same five walls; and
4. trapezoidal common-pericardium pressure work.

For values `x_1`, `x_1/2`, and `x_1/4`, retain:

```text
d_coarse_middle = abs(x_1 - x_1/2)
d_middle_fine   = abs(x_1/2 - x_1/4)
scaled d = d / max(abs(left),abs(right),1 mJ)
difference order = log2(d_coarse_middle / d_middle_fine)
sign class at each grid = negative | zero | positive
```

The order is reported only when both differences are positive and finite.
Otherwise it is `null` with a closed reason. Sign consistency and shrinking
adjacent difference are descriptive booleans. There is no one-percent gate,
no required sign, and no result-dependent metric exclusion.

### Zero-limit discretization quantities

The following 21 quantities are expected to tend toward zero under temporal
refinement:

1. equilibrium-passive BE remainder for five walls;
2. SLS BE numerical dissipation for five walls;
3. cavity BE-minus-trapezoidal quadrature difference for four chambers;
4. common-pericardium quadrature difference, BE remainder, and trapezoidal
   remainder; and
5. left-atrial, right-atrial, combined-ventricular, and all-five-wall
   conjugacy residuals.

For residual magnitudes `r_1`, `r_1/2`, and `r_1/4`, retain:

```text
r_h = abs(value_h)
coarse-to-middle order = log2(r_1 / r_1/2)
middle-to-fine order   = log2(r_1/2 / r_1/4)
monotone magnitude decrease on each refinement
```

An exact zero has explicit status. `0/0`, division by zero, overflow, NaN, and
infinity never enter canonical JSON as invented numeric values; the order is
`null` with a closed reason. Monotonic decrease and observed order are
descriptive characterization fields, not qualification gates.

### Cycle-closure diagnostics

The following 11 endpoint changes are reported separately:

- equilibrium-passive stored-energy change for five walls;
- SLS stored-energy change for five walls; and
- common-pericardium stored-energy change.

These would vanish on an exactly periodic orbit at the corresponding grid.
The three replay arms instead share one 1 ms source and use one bridge cycle,
so their residual orbit adaptation is part of what is being observed. They are
not relabelled as temporal truncation error and do not share the zero-limit
assessment above.

### Algebraic integrity residuals

Stress-assembly residuals and SLS reported/reconstructed/readback residuals
are retained for every wall and arm. All must be finite. Their maximum
absolute values and exact source fields are replayed, but they do not receive
an observed-order interpretation. The canonical stress-assembly residual
remains an algebraic input-consistency field, not independent constitutive
validation.

## Characterization result rule

The only positive experiment-level boolean is:

```text
threeGridMechanicalPortLedgerCharacterizationCompleted
```

It is true only when:

1. the internally owned source completes with P1 classification and exact
   terminal checkpoint round-trip;
2. all three fixed replay arms complete their bridge and measured cycles;
3. all arm checkpoint, accepted-state lineage, event, material-volume,
   provider-identity, conservation, and finite-value gates pass;
4. each arm's complete V1 ledger and compact projection hash replay;
5. the 25 finite-limit, 21 zero-limit, 11 closure, and algebraic residual
   identifier sets are exact and complete;
6. every retained numerical leaf is finite before nullable order projection;
7. pair/triple characterization records independently recompute from the
   three arm projections; and
8. no execution or integrity exception occurs.

Numerical monotonicity, sign consistency, and observed order are not in this
conjunction. A scientifically interesting lack of convergence therefore
produces a completed characterization with negative descriptive fields, not a
fabricated integrity failure. Conversely, an incomplete or tampered arm can
never be treated as scientific nonconvergence; it fails characterization
integrity.

Failure classes are fixed as `source-not-p1`, `source-execution-failure`,
`shared-checkpoint-binding-failure`, `arm-execution-failure`,
`ledger-integrity-failure`, `projection-integrity-failure`, and
`artifact-integrity-failure`.

## Compact artifact and execution governance

The implementation commit may run only pure, manufactured, mocked, replay,
and existing one-millisecond parity tests. It must not execute the normal-adult
source, either fine replay arm, or the zero-argument characterization runner.

After that commit is clean, the fixed zero-argument runner may perform the
source and three arms exactly once and write create-only to:

```text
artifacts/mechanical-port-ledger/
  periodic-five-wall-mechanical-port-ledger-dt-characterization-v1.json
```

The path is checked before source execution. A pre-existing file fails before
any target work. The runner has no caller-supplied fixture, checkpoint, dt,
threshold, metric list, source result, projection, or output path.

The report binds the declaration and implementation commits, predecessor
owners, complete protocol and numerical-access payloads and hashes, source
summary and checkpoint digest, all three complete ledgers, compact
projections, characterization records, integrity assessment, and negative
claims. The independent auditor reconstructs all projections and trend
records from the retained ledgers and verifies the canonical payload hash.

The committed JSON must be canonical-hashable and no larger than `524288`
bytes. It must not contain a raw checkpoint, accepted interval, successful
step, waveform trace, or mutable runtime input. A full trace may exist only as
an uncommitted local or CI diagnostic and is not a runtime dependency.

The output is repeatable Engineering evidence, not an immutable official
qualification artifact. No threshold or taxonomy may change after inspecting
the result. A future rerun requires a new versioned protocol or a distinct
explicit output path; it may not overwrite the committed report.

## Machine-readable claim boundary

The report must retain all following claims as `false`, regardless of the
observed numerical trends:

```text
officialQualificationEstablished
canonicalSourceAuthenticationEstablished
historicalQualificationTransferred
numericalPeriodicityEstablishedByCharacterization
ledgerNumericallyQualified
continuumLimitEstablished
temporalConvergenceEstablished
productionDtSelected
continuousPowerEstablished
activeStoredEnergyPotentialEstablished
activationEnergyEstablished
atpUseEstablished
heatEstablished
mvo2Established
mechanicalEfficiencyEstablished
edpvrEstablished
peEstablished
pvaEstablished
wholeHeartPvaEstablished
physiologicalValidationEstablished
clinicalValidationEstablished
publicCatalogEligibilityEstablished
```

A completed characterization establishes only that the fixed three-grid
measurement and its integrity replay completed. Individual observed trends
remain Engineering measurements.

## Required verification and next boundary

Before the one target execution, typecheck, manufactured projection tests,
mocked runner tests, one-millisecond canonical parity, suite-manifest audit,
formatting, and diff checks must pass. Tests must cover exact identifier sets,
sign orientation, zero/null order cases, overflow rejection, arm-order
independence, all-settled failure retention, hash tampering, create-only
preflight, and the artifact size limit.

After the result commit, run the focused tests, full fast suite, build,
registry verification, repository hygiene, and diff checks. An independent
read-only review must verify the one source plus three-arm execution count,
shared-checkpoint binding, exact dt/access policy, taxonomy, formulas,
artifact hashes and size, and negative claims.

The result determines the next declaration rather than changing this one:

- credible finite-limit stabilization and zero-limit decay support a separate
  versioned numerical-qualification protocol with prospectively selected
  tolerances;
- inconsistent or nonmonotone trends trigger diagnostic investigation rather
  than threshold relaxation; and
- neither outcome authorizes PVA. Pericardium-inclusive passive-surface work
  and later transient load protocols remain separate scientific owners.
