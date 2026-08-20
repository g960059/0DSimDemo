# Passive-equilibrium point-solver V3 Engineering result

Status: completed repeatable Engineering comparison; solver selection and all
surface, branch, PVA, official, and public claims remain unestablished

## Result

The declared V3 comparison completed successfully. All three solver policies
passed the manufactured expected outcomes, solved the normal-adult reference
point, and completed all 16 fixed ranked-neighbourhood cases.

The preregistered ranking names residual-merit Armijo Newton as the Engineering
leader:

| Rank | Policy                                                  | Ranked cases | Candidate evaluations | Accepted updates | Rejected trials |
| ---: | ------------------------------------------------------- | -----------: | --------------------: | ---------------: | --------------: |
|    1 | residual-merit Armijo Newton                            |        16/16 |                 1,445 |              964 |               0 |
|    2 | component-energy Armijo Newton with terminal-root guard |        16/16 |                 1,445 |              964 |               0 |
|    3 | residual-merit Levenberg-Marquardt                      |        16/16 |                 2,342 |            1,861 |               0 |

Residual Newton and component-energy Newton produced bit-identical terminal
coordinates across all 16 ranked cases. Their work counts were also identical.
The fixed tie-break therefore places the simpler residual-merit policy first.
LM completed the same fixed set but required 897 more candidate evaluations
and 897 more accepted updates.

This is an Engineering lead, not a policy selection. The machine-readable
result keeps `selectedPointSolverPolicyEstablished:false`.

## Fixed identities

```text
declaration commit:
  b5f929e20820e5cf3e7a54dc23f96e4666ed67f4
implementation commit:
  a87637f6e8070b8d1eb0c0bd0d78464d4d23393f
report payload SHA-256:
  d30ca8cd148affb8d5f3964769b24dacf21afc38dcfa596fc25fbb0c1d3bb433
report raw-file SHA-256:
  a48c49fd1b187bd0f625d6292123f5b686b5ba99b56bb675a2fefd2dfe4cbe2b
```

The create-only report is:

[`artifacts/passive-equilibrium/point-solver-comparison-engineering-v1.json`](../../artifacts/passive-equilibrium/point-solver-comparison-engineering-v1.json)

It is 2.1 MiB, contains no archived PR558 artifact, and is repeatable
Engineering output rather than qualification evidence or runtime input.

An independent post-result code review found two report-policy gaps: efficiency
totals had not explicitly excluded failed ranked homotopies, and the
manufactured eligibility boolean had checked broad solve status without
replaying every case-specific requirement. The implementation now aggregates
work only over completed ranked cases and independently checks strict saddle
rejection, the magnitude-imbalanced root cluster, residual offset invariance,
and terminal-guard validity. Negative fixtures cover each boundary.

The magnitude-imbalanced cluster radius is not fitted to the observed result:
it is `1e-7` in scaled-coordinate units, obtained from the fixed force
tolerance `1e-10` divided by that declared case's weakest curvature `1e-3`.

This correction does not alter the recorded report or its hashes. All three
policies completed 16 of 16 ranked cases, and the retained manufactured records
pass the stricter replay. The report remains the immutable result of the single
declared run rather than a regenerated post-review artifact.

## Reference point

Residual Newton and component-energy Newton reproduced the retained reference
root coordinates:

```text
V_S = 0.00003753864062605335 m3
y   = 0.0340806157254379 m
scaled force infinity norm = 3.30562670569634e-14
minimum scaled Hessian eigenvalue = 0.17789351053676583
accepted updates = 4
candidate evaluations = 5
```

LM reached a nearby valid root with force
`4.834079163629212e-13`. Across the 16 ranked endpoints, the largest
residual-Newton/LM coordinate difference was
`1.314161130590462e-10` in declared scaled-coordinate units. This is a tight
sampled agreement, not a multi-seed, continuous-branch, or global-uniqueness
result.

All ranked stage endpoints remained strictly stable. The largest terminal
scaled-force infinity norm was `3.431178141610758e-11` for residual/component
Newton and `2.1725282522311316e-11` for LM. The smallest retained scaled
Hessian eigenvalue was about `0.1301`, far above the fixed `1e-10` floor.

## What changed relative to the archived failures

The two midpoint homotopies that had failed under the archived energy-difference
policy both completed all 32 stages under all three V3 policies. Literal and
canonical index-16 targets remained distinct binary64 cases and produced
slightly different terminal coordinates; neither was deduplicated.

The three direct archive-derived diagnostics also reached point-local stable
roots:

| Diagnostic             | Residual Newton             | LM                          | Component energy + guard                  |
| ---------------------- | --------------------------- | --------------------------- | ----------------------------------------- |
| midpoint stage-2 state | 3 updates, force `3.44e-16` | 4 updates, force `5.66e-12` | 3 updates, terminal guard on final update |
| seed `(0,+0.25)`       | 7 updates, force `2.09e-16` | 9 updates, force `3.34e-13` | 7 updates, terminal guard on final update |
| seed `(+0.25,+0.25)`   | 7 updates, force `4.84e-16` | 9 updates, force `3.31e-12` | 7 updates, terminal guard on final update |

Across the two midpoint homotopies and three direct diagnostics, the
component-energy comparator used its terminal-root guard five times. Every
guarded trial was the full `b=0` Newton trial and already satisfied force,
finite-domain, and strict-stability gates. No ULP, rounded-energy, relative
energy, or near-convergence tolerance was used.

Residual-merit Newton resolved every declared historical diagnostic without a
rescue rule or backtracking. This supports the original numerical diagnosis:
the archived failures were caused by using small binary64 stored-energy
differences as the line-search decision near an otherwise well-behaved local
root. It does not retrospectively convert the archived failed attempt into a
pass.

## Manufactured controls

All policies met the predeclared outcomes:

- positive-definite quadratic, near-flat quartic, and magnitude-imbalanced
  cases converged;
- residual policies were invariant to wall-energy offsets through `1e16 J`;
- the component-energy policy used its terminal guard only for the `1e16 J`
  cancellation control;
- the force-zero saddle was rejected by the strict-stability gate; and
- the constant-residual control did not report a root.

Focused tests also rejected policy-ID substitution, singular and non-finite
candidates, bit-unchanged coordinate trials, signed-zero/non-finite Armijo
right sides, component-energy comparison reversal, and a terminal-guard trial
whose force remained above tolerance.

## Interpretation

The comparison supports residual-merit Armijo Newton as the next prospective
point-solver policy because it:

1. passed every declared positive and negative manufactured outcome;
2. completed all ranked and archive-derived normal-adult cases;
3. matched the component-energy comparator's efficient Newton trajectory;
4. avoided an energy-cancellation-specific terminal rule; and
5. was materially more efficient than the declared LM escalation.

It does not show that LM is incorrect. LM was robust on this corpus and remains
a plausible explicit escalation if later declared cases expose a residual
Newton globalization failure. It should not be combined silently with Newton.

Likewise, the successful two archived seed diagnostics are not a replacement
for the historical 12-participant branch protocol. This PR did not run the
alternate LV-first/RV-first paths or nine-seed conjunction, and it does not
establish multi-seed robustness.

## Claim boundary

The report keeps every following claim false:

```text
selectedPointSolverPolicyEstablished
officialQualificationEstablished
confirmatoryEligibilityEstablished
surfaceConstructionEstablished
continuousBranchEstablished
alternatePathAgreementEstablished
multiSeedRobustnessEstablished
globalUniquenessEstablished
passiveReferenceForPvaEstablished
edpvrEstablished
peEstablished
pvaEstablished
oxygenOrMetabolicClaimEstablished
physiologicalValidationEstablished
clinicalValidationEstablished
publicCatalogEligibilityEstablished
```

The valid positive claims are limited to the explicitly recorded point-local
roots and primary homotopies on the fixed Engineering corpus.

## Next action

The next change should be another prospective declaration that selects
residual-merit Armijo Newton for a nonofficial local pilot. The smallest useful
pilot is a 3 by 3 or 5 by 5 LV-RV grid with independent reference-root seeding,
gradient consistency, reduced-Hessian symmetry, and rectangular path checks.

That pilot must continue to keep alternate-path, multi-seed, continuous-branch,
global-uniqueness, EDPVR, PE, and PVA claims separate. A passive reference for
PVA remains downstream of solver selection and surface verification.
