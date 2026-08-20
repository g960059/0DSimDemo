# Intrinsic ventricular passive reduced-surface Engineering pilot result

Status: completed fixed Engineering pilot; sampled local consistency passed,
while every continuous-surface, branch, EDPVR, PVA, official, and public claim
remains unestablished

## Result

The prospectively declared 5 by 5 intrinsic ventricular passive pilot passed
its complete primary conjunction.

All 25 grid points completed their independent reference-root homotopies. The
point-local roots passed stationarity and strict-stability gates. Analytic
pressure agreed with finite differences of the reduced energy, the Schur
reduced Hessian agreed with pressure finite differences, the independent
pressure-FD cross derivatives satisfied the Maxwell gate, and every selected
rectangular pressure-work loop passed its fixed refinement rule.

The machine-readable positive result is limited to:

```text
sampledLocalIntrinsicVentricularReducedPotentialConsistencyPassed: true
```

It is not a continuous surface or a passive reference for PVA.

## Fixed identities

```text
declaration commit:
  e93801ed221c9b3c74b9d837c8d89920c90cbe35
implementation commit:
  63dcab1626c43e67f80a870365470f24238de417
protocol payload SHA-256:
  012300c76cb0ffee54fad7ad8f5756a9faadb74b580fa16b6fa3a7a17a326a2c
report payload SHA-256:
  dbdf2b76d23fc902e7b1b75fab75731c7456ff3d69ab9a23994569a723daf294
report raw-file SHA-256:
  0ba4d56c98cf933d3d693db36fa5b6086eff2e46b2aa71f7a67f1a5f19caddc7
report size:
  332372 bytes
```

The create-only report is:

[`artifacts/passive-equilibrium/intrinsic-ventricular-passive-reduced-surface-pilot-v1.json`](../../artifacts/passive-equilibrium/intrinsic-ventricular-passive-reduced-surface-pilot-v1.json)

It is below the predeclared 512 KiB limit. It retains the 25-point table,
stage digests and compact endpoints, audit tables, diagnostic summaries, five
selected primary traces, and hashes. Full iteration traces are not committed.

The fixed zero-argument runner was executed once from the clean implementation
commit. The output path did not previously exist. No second pilot execution or
post-result threshold change was performed.

## Primary point results

The primary grid used independent fractions `{0,1/32,2/32,3/32,4/32}` on both
axes. The reference root was solved once from the fixed loaded coordinates;
every other point started from that same root and followed its own 32-stage
diagonal homotopy.

```text
primary points established: 25 / 25
candidate evaluations: 2309
accepted updates: 1540
rejected trials: 0
largest terminal scaled-force infinity norm:
  3.350573568594584e-11
smallest terminal scaled internal-Hessian eigenvalue:
  0.13011676248985177
largest analytic scaled Schur antisymmetry:
  4.253979241951967e-17
```

The fixed point gates were `force <= 1e-10` and strict eigenvalue `>1e-10`.
The smallest observed eigenvalue remained far from the declared stability
boundary. All accepted Newton trials used the full step; the ranked primary
grid recorded no rejected trial. This local observation does not show that
globalization will remain unnecessary outside the sampled patch.

The sampled ranges were:

```text
reduced stored energy:
  0.013830672284781487 to 0.026393309255454377 J
intrinsic LV passive pressure:
  715.6623453808289 to 1076.3508942839 Pa
intrinsic RV passive pressure:
  174.41988578468042 to 263.3295405228981 Pa
```

These pressures exclude common pericardium and every external pressure basis.

## Energy-gradient consistency

All 30 predeclared centred energy-gradient audits passed. The largest
normalized pressure error was:

```text
9.034303141547752e-4
```

against the fixed limit `5e-3`. The largest value occurred for the LV
derivative at `grid-lv-1-rv-0`, where:

```text
analytic intrinsic pressure = 984.4460919125074 Pa
energy finite difference    = 985.3495222266622 Pa
```

The difference is the expected finite-grid truncation comparison, not a new
pressure correction.

## Reduced Hessian and Maxwell consistency

All 36 analytic-Schur versus pressure-FD components passed. The largest
normalized component error was:

```text
1.161382486232612e-3
```

against the fixed limit `2e-2`.

All nine independent pressure-FD Maxwell audits passed. Their largest
normalized cross-derivative mismatch was:

```text
2.6051128292939356e-4
```

against the fixed limit `2e-2`. The analytic scaled Schur matrix was symmetric
to about `4.3e-17` under the declared normalization. The analytic and
finite-difference checks remain separate: neither was used as a substitute for
the other.

## Rectangular path refinement

All four predeclared two-grid-step rectangles passed. The refined normalized
loop errors were:

| Rectangle             | Coarse normalized error | Refined normalized error |
| --------------------- | ----------------------: | -----------------------: |
| `rectangle-lv-0-rv-0` |  `9.291710714510604e-8` |   `2.366306180667968e-8` |
| `rectangle-lv-0-rv-2` |  `3.261639880047135e-7` |   `8.030221172343191e-8` |
| `rectangle-lv-2-rv-0` | `2.3309022699525716e-6` |   `5.794029000152662e-7` |
| `rectangle-lv-2-rv-2` |  `2.778648912758044e-6` |   `6.945831590695234e-7` |

The largest absolute refined-segment pressure-work minus endpoint-energy
difference was `1.3111817340804091e-6 J`. These leg residuals are retained as
quadrature diagnostics. They are not physical dissipation.

The refined loop result supports sampled local path consistency. Four loops on
one local patch cannot establish continuous path independence.

## Diagnostic lineages

All 20 declared diagnostic lineages reached point-local stable roots:

- primary diagonal;
- LV-first;
- RV-first;
- fixed-neighbour continuation; and
- target-to-reference reverse return.

Their maximum observed differences from the corresponding primary target or
reference endpoint were:

```text
scaled-coordinate infinity distance:
  1.8453604994530289e-10
absolute stored-energy difference:
  1.1796119636642288e-16 J
maximum chamber-pressure difference:
  1.0890312296396587e-7 Pa
```

The predeclared pressure reporting threshold was `1e-7 Pa`. Three of 20
diagnostic comparisons exceeded it slightly, so the descriptive field remains:

```text
diagnosticLineageComparisonsAllWithinReportingThresholds: false
```

The threshold was not relaxed after observing the result. The diagnostic
boolean was prospectively excluded from the primary pass conjunction. The
combination of all lineages completing and their very small endpoint spread is
useful local evidence, but it does not establish alternate-path agreement,
multi-seed robustness, a continuous branch, or global uniqueness.

## Integrity and claim boundary

The create-time writer replayed declaration and protocol bindings, the selected
solver payload, compact point envelopes, stage endpoint force and stability,
diagnostic endpoint candidates, mathematical audit tables, the pass
conjunction, failure classification, negative claims, canonical hashes, and
disk readback.

A post-result read-only review found that the non-diagnostic primary terminal
energy, pressure, and reduced-Hessian fields were being re-audited from the
retained terminal values rather than reconstructed from the candidate owner.
It also found that successful-stage digests were format-bound fingerprints,
not independently reconstructible preimages in this compact artifact. The
corrective auditor now reconstructs all 25 primary terminal candidate
projections exactly and rejects coordinated terminal, mathematical-audit, and
hash resealing. A negative regression fixture covers that case. The official
pilot was not rerun, and the committed artifact values and hashes are
unchanged.

The corrective auditor also binds the fixed implementation commit and the
committed report payload SHA-256 exactly. That archival content lock rejects
implementation or diagnostic-trace changes even when a caller recomputes the
outer canonical hash. It is separate from the scientific replay gates and is
not presented as a semantic reconstruction of omitted iteration preimages.

Successful-stage digests remain repeatability fingerprints. The artifact
retains all compact stage endpoints and selected diagnostic traces, but it does
not claim full successful-stage preimage replay.

There were no execution exceptions and no failure class. Every machine-readable
downstream claim remains `false`, including:

```text
productionPointSolverSelected
officialQualificationEstablished
confirmatoryEligibilityEstablished
continuousSurfaceEstablished
continuousBranchEstablished
alternatePathAgreementEstablished
multiSeedRobustnessEstablished
globalUniquenessEstablished
atriaIncluded
pericardiumIncluded
activeStressIncluded
slsHistoryIncluded
circulationIncluded
edpvrEstablished
peEstablished
passiveReferenceForPvaEstablished
pvaEstablished
oxygenOrMetabolicClaimEstablished
physiologicalValidationEstablished
clinicalValidationEstablished
publicCatalogEligibilityEstablished
```

## Interpretation

The result supports three specific conclusions.

1. Residual-merit Armijo Newton is adequate for this fixed local pilot. It
   solved every independently seeded stage without fallback or rejected trial.
2. On the sampled intrinsic ventricular patch, the equilibrium-passive energy,
   intrinsic pressures, analytic Schur tangent, finite differences, Maxwell
   cross derivatives, and refined pressure-work loops are numerically
   consistent under the declared gates.
3. The PR558 failure diagnosis remains coherent: the local passive roots and
   potential structure are well behaved here, while globalization based on
   tiny absolute stored-energy differences was the problematic numerical
   choice.

The result does not establish a global or clinical passive surface. It covers
neither atria nor common pericardium and must not be called EDPVR.

## Next boundary

The next surface step may prospectively declare a separate
common-pericardium-inclusive constrained pilot. It must bind one external
condition, keep atrial-volume assumptions explicit, avoid simultaneously
fixing pericardial pressure and bag volume, and compare its result with this
intrinsic surface without replacing it.

Separately, the accepted-interval mechanical ledger should be characterized at
1, 0.5, and 0.25 ms with quantity-specific convergence rules. Neither follow-up
introduces PVA. PVA remains downstream of both passive-reference comparison
and transient systolic-method comparison.
