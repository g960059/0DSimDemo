# Periodic five-wall mechanical-port and passive-energy corrective result

Status: both corrective arms sealed and all accounting identities passed; the
frozen admission failed the physical-refinement and fine-conjugacy gates, so
official analysis eligibility remains false

## Lineage

The first failed evidence artifact remains immutable and is interpreted only
by [INTEGRATED-MODEL-0015](INTEGRATED-MODEL-0015-periodic-five-wall-mechanical-energy-result.md).
The corrective protocol was declared in commit `73f37fc0`, the shared
projection owner and dedicated attempt were committed as `6e6f8ce0`, and the
final provenance/tombstone hardening was committed as `8d88f1b9` before the
corrective command was invoked.

The retained corrective artifact was committed unchanged as `a4af1d8f`:

[`evidence/periodic-five-wall-mechanical-energy-evidence-v1-corrective-attempt-1.json`](evidence/periodic-five-wall-mechanical-energy-evidence-v1-corrective-attempt-1.json)

Its canonical payload SHA-256 is
`72f7e3b1a0dce64f73a5d58b3f944ece9ed79e7e90afd63e6d9ec815565582a5`.
The SHA-256 of the complete serialized file is
`f0c84b2259038aac36cfbca93e2ccba1de8181213ff515316725708bae2b5d08`.

The dedicated fixed-path command was invoked once from a clean worktree. The
completed initial V1 command was already tombstoned and cannot reach a runner.
No numerical threshold, denominator, sign rule, metric, model condition,
solver, or admission flag was changed after either result was observed.

## Frozen outcome

Both arms reached canonical P1 from independent cold starts, sealed their
recomputed projections, and entered the unchanged pair comparator.

```text
execution                                           = completed
coarse arm                                          = projection-sealed
fine arm                                            = projection-sealed
evidenceStatus                                      = sealed-admission-assessed
admission status                                    = comparison-failed
officialSealedMechanicalEnergyAnalysisEligible      = false

public live Output / Graph admission                = false
PE / PVA / MVO2 / ATP use established               = false
mechanical efficiency established                    = false
physiological / clinical validation established      = false
```

Of 47 admission gates, 45 passed. The only false gates were:

```text
physicalRefinementThresholdPassed = false
fineConjugacyThresholdPassed      = false
```

This is the final result of the declared corrective attempt. It must not be
converted to a pass by removing metrics, changing the 1 mJ denominator floor,
or reclassifying the 0.2% conjugacy threshold inside V1.

## Evidence-sealing correction passed

The corrective attempt resolved the prior verifier defect. For both grids,
all five raw-free sub-bindings matched exactly:

- 53 physical metrics;
- all-five SLS backward-Euler numerical dissipation;
- all-five equilibrium-passive backward-Euler remainder;
- four conjugacy records; and
- 20 algebraic residuals.

Each published canonical SHA-256 equaled its independently recomputed SHA-256,
and both `firstMismatchId` values were null. Source scope, accepted lineage,
model condition, protocol, checkpoints, raw trace, bridge boundary, material
volume binding, and quadrature provenance also passed in both arms.

The artifact's coarse projection, fine projection, pair payload, and outer
payload hashes independently reproduce. The failure is therefore downstream
of evidence sealing rather than a replay, identity, or artifact-integrity
failure.

## Numerical and accounting results

The 1 ms source reached P1 at cycle 71 and used 1,002 accepted measurement
steps. The independent 0.5 ms source reached P1 at cycle 72 and used 2,000
accepted measurement steps. Both retained one bridge cycle and one measurement
cycle after the source checkpoint.

All algebraic, passivity, and quadrature checks were well inside their frozen
limits:

| Check                                               |         1 ms |       0.5 ms | Result                  |
| --------------------------------------------------- | -----------: | -----------: | ----------------------- |
| Maximum absolute algebraic residual (mJ)            |  `1.214e-12` |  `7.336e-13` | pass                    |
| Maximum per-step SLS reconstruction tolerance ratio |   `3.669e-5` |   `3.781e-5` | pass                    |
| LV BE/trapezoid bridge residual (mJ)                |  `5.141e-13` | `-1.251e-12` | pass                    |
| RV BE/trapezoid bridge residual (mJ)                | `-8.396e-13` |  `2.021e-13` | pass                    |
| All-five SLS physical dissipation (mJ)              |    `39.0382` |    `39.0749` | 0.094% difference; pass |

The explicitly numerical backward-Euler terms were finite, nonnegative, and
strictly decreased:

| Numerical term (mJ)              |       1 ms |     0.5 ms | fine/coarse | observed order |
| -------------------------------- | ---------: | ---------: | ----------: | -------------: |
| Equilibrium-passive BE remainder | `1.352431` | `0.681561` |  `0.503953` |       `0.9886` |
| SLS BE numerical dissipation     | `0.486317` | `0.244674` |  `0.503116` |       `0.9910` |

Their near-halving is the expected first-order signature of the declared
backward-Euler discretization. It is not a nonconvergent physical-energy
source.

## Physical-refinement failure

Thirty-nine of the 53 frozen physical comparisons passed and every required
sign agreed. Fourteen comparisons failed the universal 1% rule.

Seven failures were every equilibrium-passive stress-work entry: one for each
wall plus the all-five and ventricular-wall aggregates. Over the periodic
cycle,

```text
W_equilibrium-passive,BE = delta stored energy + passive BE remainder
```

The stored-energy changes were near zero, while the BE remainder nearly
halved. Consequently, all-five equilibrium-passive stress work changed from
`1.352271` to `0.681408 mJ`, and the ventricular-wall aggregate changed from
`0.903964` to `0.454840 mJ`. Applying a same-value 1% convergence gate to these
entries conflicts with their numerical-remainder role.

The other seven failures were confined to atrial-scale port quantities:

| Metric                           |   1 ms (mJ) | 0.5 ms (mJ) |      Frozen scaled difference |
| -------------------------------- | ----------: | ----------: | ----------------------------: |
| LA total wall stress work        |  `-15.8202` |  `-16.2130` |                        2.423% |
| LA Land-active wall stress work  |  `-17.5252` |  `-17.7323` |                        1.168% |
| LA parallel-SLS wall stress work |   `1.39231` |   `1.36173` |                        2.245% |
| LA cavity work on wall           |  `-16.0898` |  `-16.3493` |                        1.587% |
| RA total wall stress work        |  `0.437885` |  `0.317870` | `0.120015 mJ` with 1 mJ floor |
| RA Land-active wall stress work  | `-0.519282` | `-0.564839` | `0.045556 mJ` with 1 mJ floor |
| RA cavity work on wall           |  `0.397044` |  `0.297066` | `0.099979 mJ` with 1 mJ floor |

By contrast, every LVFW, SEP, and RVFW total and Land-active entry passed;
every ventricular-wall parallel-SLS entry passed; LV and RV cavity work
passed; and all-five and ventricular-wall total, Land-active, parallel-SLS,
and SLS physical-dissipation aggregates passed. Their largest scaled
difference was 0.574%.

That two-grid agreement is characterization only. For nonzero continuum
targets it does not establish an observed convergence order or prove that the
pair lies in the asymptotic regime.

The result therefore does not support a blanket claim that five-wall mechanics
or ventricular mechanical-port work failed to converge. It shows that one
universal physical-vector rule combined continuum-scale ventricular quantities,
small atrial ports, and terms whose mathematical target is a vanishing
discretization remainder.

## Conjugacy failure

Every conjugacy residual decreased by almost one half:

| Aggregate           | 1 ms scaled residual | 0.5 ms scaled residual | fine/coarse absolute residual | Observed order | Fine 0.2% gate |
| ------------------- | -------------------: | ---------------------: | ----------------------------: | -------------: | -------------- |
| LA                  |               1.675% |                 0.833% |                    `0.505442` |       `0.9844` | fail           |
| RA                  |               4.084% |                 2.080% |                    `0.509406` |       `0.9731` | fail           |
| Ventricles combined |               0.183% |                 0.091% |                    `0.501299` |       `0.9963` | pass           |
| Whole heart         |               0.199% |                 0.100% |                    `0.501720` |       `0.9950` | pass           |

Readback recomputation was exact. The pattern is consistent with a finite-step
geometric work-conjugacy remainder under a first-order endpoint rule, not with
a persistent loss of wall-cavity coupling. The frozen fine-grid magnitude
screen nevertheless required every aggregate to pass, so the atrial values
correctly keep admission false.

## Scientific interpretation

V1 established several useful facts without admitting a public quantity:

1. the accepted-step ledger, provider/material ownership, exact checkpoint
   continuation, stress assembly, SLS decomposition, and BE-to-trapezoid bridge
   are internally reproducible;
2. ventricular and whole-heart total/Land-active work, parallel-SLS work, SLS
   physical dissipation, and LV/RV cavity work were stable across the declared
   grid pair;
3. passive and conjugacy BE residuals showed the expected approximately
   first-order decrease; and
4. atrial port estimates were not sufficiently grid-stable under the frozen
   universal rule.

These are model-verification observations, not physiological validation,
clinical normal values, thermodynamic Land energy, PE, PVA, or oxygen cost.
The all-or-nothing V1 admission remains false.

## Next boundary

There is no further V1 retry. A future version must change the measurement
taxonomy before it changes any tolerance:

1. **Continuum-target quantities:** assess signed mechanical-port work, stored
   energy change, and physical SLS dissipation with a preregistered three-grid
   convergence/Richardson uncertainty rule rather than assuming the fine value
   is exact.
2. **Discrete numerical terms:** assess equilibrium-passive BE remainder, SLS
   BE numerical dissipation, and wall-cavity conjugacy residual by finite,
   sign, monotone-decrease, and observed-order gates. They must not be required
   to approach the same nonzero value across grids.
3. **Atrial quantities:** retain LA/RA separately and qualify them only when
   their own absolute uncertainty is resolved; they must not inherit a
   ventricular-scale relative rule or be hidden inside a whole-heart pass.
4. **Tiered qualification:** keep exact accounting, ventricular/global
   continuum characterization, atrial/local characterization, and public
   catalog admission as separate conjunctions. Passing one tier must not
   silently elevate another.

The next model-native scientific construction may proceed independently as a
pure passive multichamber equilibrium-energy surface. It should not use this
failed dynamic V1 admission as an EDPVR, PE, or PVA owner. A later dynamic
ledger V2 can then use that passive state-function owner to separate physical
storage from endpoint-discretization remainder explicitly.
