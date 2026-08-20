# Periodic five-wall mechanical-port ledger dt-characterization result

Status: completed fixed Engineering characterization; the declared three-grid
execution and evidence-integrity conjunction passed, while numerical trends
remain descriptive and every qualification, metabolic, PVA, official, and
public claim remains unestablished

## Result

The prospectively declared shared-source characterization completed all three
fixed arms at 1 ms, 0.5 ms, and 0.25 ms.

Each arm restored the same canonical 1 ms period-1 checkpoint, executed one
unmeasured bridge cycle, and measured exactly the following cycle. Every arm
retained its accepted-interval mechanical-port ledger, compact projection, and
source-to-ledger time, revision, material, and checkpoint lineage. Independent
replay of the projections and three-grid characterization passed.

The only new positive machine-readable result is:

```text
threeGridMechanicalPortLedgerCharacterizationCompleted: true
```

This is a numerical Engineering characterization of one fixed continuation.
It is not a qualification of the ledger quantities, a new Standard timestep,
or a PVA result.

## Fixed identities

```text
declaration commit:
  cee4a52152771b0a21c12dd2060b9ee324f60ce8
implementation commit:
  bcc57e4b41659492eb86a08d9be5597e6bc5ef80
protocol payload SHA-256:
  2fc81ec16bd9c318618c052494247ea10d948b12f0d4a90d6a85f4663daaf45d
report payload SHA-256:
  f80da199e50e18e395e958c51e98dd0ea7e878bb6c8171f2c7d23071d6414921
report raw-file SHA-256:
  a60278ce159172e86e7c115840325f5de49fa353162742ef7d1b63daa9a2613e
report size:
  154062 bytes
```

The create-only report is:

[`artifacts/mechanical-port-ledger/periodic-five-wall-mechanical-port-ledger-dt-characterization-v1.json`](../../artifacts/mechanical-port-ledger/periodic-five-wall-mechanical-port-ledger-dt-characterization-v1.json)

It is below the predeclared 512 KiB limit. The zero-argument runner was
executed once from the clean implementation commit. The output path did not
previously exist. The characterization was not rerun after observing the
result.

## Shared source and arm execution

The internally executed canonical 1 ms source established numerical period-1
at cycle 71. Its three retained classifier inputs were cycles 69, 70, and 71,
with period-1 maximum normalized deltas:

```text
cycle 69: 0.0009927684656199087
cycle 70: 0.000977654899818381
cycle 71: 0.0009627467769572906
```

The terminal checkpoint SHA-256 was:

```text
f78f97cc84f8c2d77ca2312685ae905ff5f129f231fd54504efe5917dbea6070
```

All arms restored that exact checkpoint independently.

| Arm    | Nominal dt | Bridge steps | Measured intervals |     Minimum accepted dt |      Maximum accepted dt |
| ------ | ---------: | -----------: | -----------------: | ----------------------: | -----------------------: |
| coarse |    0.001 s |         1002 |               1002 | `0.0005000000000023874` |  `0.0010000000000047748` |
| middle |   0.0005 s |         2000 |               2000 | `0.0004999999999881766` |  `0.0005000000000023874` |
| fine   |  0.00025 s |         4000 |               4000 | `0.0002499999999940883` | `0.00025000000000829914` |

The coarse arm includes event- or boundary-aligned substeps down to about half
the nominal dt. The middle and fine differences from their nominal dt are
binary64 accepted-time roundoff. They passed the predeclared roundoff-aware dt
binding; no tolerance was changed after execution.

## Finite-limit quantities

All 25 finite-limit metrics retained a consistent sign across the three grids.
Twenty-four had nonzero adjacent differences and every one of those had a
smaller middle-to-fine difference than coarse-to-middle. The remaining metric,
common-pericardium trapezoidal pressure work, was exactly zero at all three
grids, so its difference order was correctly reported as undefined.

The 24 defined difference orders ranged from:

```text
minimum: 0.2677889561397926
  RVFW physical SLS dissipation
maximum: 1.053149711720665
  RVFW active mechanical absorption magnitude
```

Most finite-limit metrics showed approximately first-order adjacent-difference
behavior. The lower RVFW physical-SLS order is retained as an observation; it
was not excluded or converted into a failure.

Selected values are:

| Quantity                            |                  1 ms |                0.5 ms |               0.25 ms |
| ----------------------------------- | --------------------: | --------------------: | --------------------: |
| LV cavity trapezoidal work on wall  | `-1286.4541324474803` | `-1289.3432298501705` | `-1290.7940663645263` |
| RV cavity trapezoidal work on wall  |  `-424.3120778589147` | `-425.83084610597024` |  `-426.5648757641655` |
| LVFW active net mechanical delivery |   `944.6291972002148` |   `947.0105882799162` |   `948.2087016693071` |
| SEP active net mechanical delivery  |   `354.1661891729007` |  `354.96218879732027` |   `355.3670109245211` |
| RVFW active net mechanical delivery |  `448.15659508005024` |   `449.7717995728974` |   `450.5679638351405` |

All values in this section are mJ per measured cycle. Active mechanical
delivery remains a stress-work port quantity. It is not activation energy,
ATP consumption, heat, MVO2, or an active stored-energy potential.

For orientation only, read-only sums across the retained wall metrics were:

```text
five-wall active net mechanical delivery:
  1764.9964504624647 -> 1770.0569383484622 -> 1772.5999157903523 mJ

five-wall physical SLS dissipation:
  39.038188104828976 -> 39.08931562076542 -> 39.11615473292375 mJ
```

These sums are descriptive projections, not new artifact gates.

## Quantities expected to vanish with dt

Eighteen of the 21 zero-limit metrics were nonzero. Every one of those 18
decreased in magnitude at both halvings. The three remaining metrics were the
common-pericardium quadrature difference and its backward-Euler and
trapezoidal remainders; all three were exactly zero on every grid and therefore
had undefined, rather than failed, observed orders.

For the nonzero metrics, the observed orders were:

```text
coarse to middle: 0.9680835755491053 to 1.0959397894507938
middle to fine:   0.9829960764451933 to 1.0559526076554837
```

Three aggregate summaries make the behavior particularly clear:

| Quantity                                      |                  1 ms |                0.5 ms |               0.25 ms |
| --------------------------------------------- | --------------------: | --------------------: | --------------------: |
| Sum of five equilibrium-passive BE remainders |  `1.3524310756471765` |  `0.6819476130100662` |  `0.3424012453749085` |
| Sum of five SLS BE numerical dissipations     | `0.48631736460467784` | `0.24477824833324188` | `0.12279288064321311` |
| All-five-wall BE conjugacy residual           |    `3.43869315172833` |  `1.7259561281694005` |  `0.8646282612844516` |

The halving behavior is consistent with first-order backward-Euler truncation.
It supports the earlier diagnosis that these quantities must be assessed by
their approach to zero, not by requiring coarse and fine values to agree
within one relative-percent gate.

The cavity BE-minus-trapezoidal quadrature differences also decreased at both
halvings. For example:

```text
LV: -0.8012518784423719 -> -0.3831427785296455 -> -0.18703826401474544 mJ
RV: -0.2981701241272958 -> -0.13949330884241817 -> -0.06748566410982448 mJ
```

These are quadrature differences, not physical dissipation.

## Cycle-closure quantities

The 11 stored-energy changes were retained separately from the finite-limit
and zero-limit families. Their largest absolute values were:

```text
1 ms:    0.00008631475298779764 mJ
0.5 ms:  0.0017302836476678837 mJ
0.25 ms: 0.0030181777818322625 mJ
```

The largest middle and fine values were the LA equilibrium-passive stored
energy change. The signs and magnitudes were not monotone across all walls.
This is not a contradiction of the zero-limit result: each fine-grid arm was
continued from the same 1 ms period-1 checkpoint and received only one
unmeasured bridge cycle. The experiment did not establish a separately
converged periodic orbit at each dt. Closure was therefore correctly retained
as descriptive state-drift evidence and not silently reclassified as either a
finite physical observable or a truncation remainder.

## Algebraic residuals

All 20 algebraic consistency metrics remained finite. The largest absolute
retained value was:

```text
1.2141398997300712e-12 mJ
```

It occurred in the RVFW stress-assembly residual. These fields check retained
input and reconstruction consistency. They do not become an independent
constitutive validation merely because they are small.

## Integrity and claim boundary

The create-time and readback auditors replayed:

- the declaration and protocol payload;
- the exact implementation commit and shared source identity;
- the compact three-cycle P1 classifier suffix and terminal closure;
- source-to-bridge-to-measurement time and revision lineage;
- canonical material and provider binding;
- all three retained ledger projections;
- the three-grid characterization and assessment conjunction;
- the canonical payload hash, artifact size, and disk readback.

Post-result hardening binds the committed implementation commit, report
payload SHA-256, raw-file SHA-256, and byte count. Coordinated resealing tests
cover classifier inputs, window indices, ledger endpoints, material binding,
implementation identity, and the outer payload hash. The target model was not
rerun while adding these archival locks.

All downstream claims remain false, including:

```text
ledgerNumericallyQualified
standardNominalDtChanged
standardAcceptedStepBoundChanged
canonicalPeriodicOwnerChanged
sourceProvenanceVerified
historicalQualificationTransferred
activeStoredEnergyPotentialEstablished
activationEnergyEstablished
atpConsumptionEstablished
heatEstablished
mvo2Established
wholeHeartTotalEnergyEstablished
continuumEnergyIdentityEstablished
pvaEstablished
confirmatoryEligibilityEstablished
officialQualificationEstablished
publicCatalogEligibilityEstablished
physiologicalValidationEstablished
clinicalValidationEstablished
```

## Interpretation

The result supports three limited conclusions.

1. The accepted-interval mechanical-port ledger can be replayed from one exact
   canonical checkpoint at all three declared grids while preserving event,
   conservation, material, and checkpoint lineage.
2. The nontrivial backward-Euler remainders, numerical SLS dissipation,
   cavity quadrature differences, and conjugacy residuals decrease with
   approximately first-order behavior. They are discretization quantities,
   not continuum observables that should match across dt.
3. The finite mechanical-port and physical-dissipation quantities show stable
   signs and shrinking adjacent differences on this fixed continuation.

This strengthens the scientific correction that followed PR558. It does not
retroactively pass PR558, qualify the ledger globally, or establish a total
thermodynamic energy balance.

## Next boundary

The next dynamic-ledger step, if needed, should be declared separately. A
dt-specific periodic-source study would need to converge an independent
periodic orbit at each dt before treating stored-energy cycle closure as a
periodic-limit comparison. It must not reuse this shared-source result as
evidence that those three periodic orbits already exist.

The passive-surface and transient preload-reduction programs remain separate.
Only after their pressure basis, passive reference, systolic method, and area
rule are explicitly versioned should any method-specific PVA be compared with
this mechanical ledger. No unqualified PVA should be introduced from this
result.
