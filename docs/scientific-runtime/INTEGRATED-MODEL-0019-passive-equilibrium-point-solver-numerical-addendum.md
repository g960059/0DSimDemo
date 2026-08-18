# Passive-equilibrium point-solver numerical addendum

Status: declaration only; this document, the V2 point solver, its manufactured
tests, and its fixed engineering-evidence runner must be committed before any
V2 normal-adult target is evaluated

## Immutable V1 implementation and unsealed observations

Commit `28e6c5e9c7c7072853a79758fef6a2c09984cc30` is the immutable V1
implementation boundary. Its Git tree is
`05b8df7071240931160c91203bf8ae13556471ad`; the point-owner and focused-test
blob identities are, respectively,
`43d09f16c8cd1b5fe53688c9c5d7aeaa9d2edc5d` and
`54bb27dc925429154eb1e40260c79b1eb087130f`.

Those V1 point and branch values remain V1 values. They must not be renamed,
reinterpreted, migrated, overwritten, called canonical or sealed evidence, or
made eligible by this addendum. They are retrospective, unsealed engineering
observations produced while executing the focused test. The V1
absolute-total-energy Armijo implementation and its regression tests remain
callable and unchanged.

The committed test makes exact assertions for:

- the literal midpoint point's failure reason, stage, one completed preceding
  stage, `b=24`, scaled update, two force norms, two ventricular energies, and
  `dot(g~,d)` shown below;
- both named seed participant IDs, `scaled-update-stagnated`, failed stage 0,
  and 9 completed updates;
- the complete final-step diagnostics shown below for seed `(0,+0.25)`; and
- 12 branch participants, 66 pair records, and one passing 45-pair cluster
  among the ten successful participants.

The second seed's detailed final-step values, both seeds' initial/final
coordinates, the case-volume float64 bits, and the distinct canonical indexed
midpoint are first frozen by this addendum. They were not canonical or sealed
evidence in commit `28e6c5e9`.

Four case identities are now fixed. They form three future top-level
executions, as specified below:

| Case | Status at declaration |
| --- | --- |
| Literal midpoint point | Retrospective unsealed V1 failure: `(LA,LV,RA,RV)=(57.95,98.8,72.58,111.15) mL`; failed ventricular stage 2 as `scaled-update-stagnated`; one preceding stage completed; accepted `b=24`; scaled update `5.023638240098982e-16`; current/accepted force infinity norms `7.555575135209658e-9` / `7.555574794482212e-9`; current/accepted ventricular energies `0.022765537857069962` / `0.022765537857069935` J; `dot(g~,d)=-5.788005699503025e-17`. |
| Canonical indexed midpoint point | Prospective control only; no V1 result is inferred. LV and RV are constructed by the frozen indexed endpoint formula at index 16 rather than from the decimal literals above. |
| Reference seed `(0,+0.25)` | Retrospective unsealed V1 stage-0 failure: `scaled-update-stagnated`; 9 accepted updates and 7 cumulative backtracks; final accepted `b=5`; scaled update `6.574519288468698e-12`; current/accepted force infinity norms `2.1387347493018185e-10` / `2.0719038451577632e-10`; current/accepted ventricular energies `0.026393309255454297` / `0.026393309255454266` J; `dot(g~,d)=-4.093735823433198e-20`. |
| Reference seed `(+0.25,+0.25)` | Retrospective unsealed V1 stage-0 failure: `scaled-update-stagnated`; 9 accepted updates and 33 cumulative backtracks; final accepted `b=27`; scaled update `6.324336831337613e-17`; current and accepted force infinity norms both `8.619401874909728e-9`; current and accepted ventricular energies both `0.02639330925545428` J; `dot(g~,d)=-6.656093483170479e-17`. |

The literal midpoint coordinate bits are:

```text
LA = 3f0e61ead6a30f64
LV = 3f19e65b134c0d1f
RA = 3f1306c2e7c6a33d
RV = 3f1d232675b58ec3
```

The canonical indexed midpoint is constructed in binary64, without repeated
addition, as:

```text
LV16 = fl(LVmin + fl(fl(16/32) * fl(LVmax - LVmin)))
RV16 = fl(RVmin + fl(fl(16/32) * fl(RVmax - RVmin)))
LA16 = the frozen pre-A LA axis value
RA16 = the frozen pre-A RA axis value
```

Its coordinate bits are:

```text
LA = 3f0e61ead6a30f64
LV = 3f19e65b134c0d20
RA = 3f1306c2e7c6a33d
RV = 3f1d232675b58ec2
```

The LV and RV literal values therefore are not the canonical index-16 values.
Neither may be substituted for the other or deduplicated by a decimal display.

For the two seed failures, the exact initial coordinates were
`(42e-6 m3,0.04125 m)` and
`(52.499999999999995e-6 m3,0.04125 m)`. The final retained coordinates were
`(37.538640620976045e-6 m3,0.03408061573216488 m)` and
`(37.53864041358505e-6 m3,0.03408061600555573 m)`, respectively. The
retrospective reference branch run attempted all 12 fixed participants and
retained all 66 pair records. Ten participants formed one passing 45-pair
cluster; the two failed seeds kept branch agreement false.

These observations are consistent with binary64 cancellation in the absolute
ventricular total used by the V1 Armijo comparison. They do not establish that
the affected points are valid roots, that a V2 rule will pass, or that any
threshold should be relaxed.

## Unchanged scientific contract

This addendum does not rewrite the historical text or scientific surface
contract in
[INTEGRATED-MODEL-0018](INTEGRATED-MODEL-0018-passive-multichamber-equilibrium-energy-surface-preregistration.md).
It makes only the prospective numerical-policy substitution stated under
**Prospective precedence** below. The following identities and their complete
payload semantics remain fixed:

```text
passive-multichamber-equilibrium-energy-surface-myocardium-v1
main-wire-normal-adult-passive-equilibrium-branch-policy-v1
main-wire-normal-adult-passive-equilibrium-surface-verification-policy-v1
```

The consumed equilibrium-passive material and geometry payload is replayed
byte-for-byte from V1. Its canonical SHA-256 remains an inherited dependency;
it is not rebuilt with a substituted owner label. The broader prior hash
remains source provenance only. The V1 branch-policy object and V1
surface-verification payload are also reused exactly. A new combined
solver/branch protocol hash is expected only because it contains the new
solver-policy payload beside the unchanged V1 branch policy.

All axes, 32-stage and 64-stage paths, nine seed offsets, collection orders,
failure retention, stationarity and strict-stability rules, Newton and
backtrack limits, scales, thresholds, finite-difference gates, Maxwell gates,
path gates, pericardial cases, factorized assembly, provenance bindings, and
negative claims remain unchanged. In particular, this addendum does not admit
a surface, global uniqueness, a continuous branch, a live Output or Graph
item, PE, PVA, MVO2, ATP, efficiency, physiological validation, clinical
validation, or patient specificity.

### Prospective precedence

INTEGRATED-MODEL-0018 and every V1 outcome remain unchanged. For a future,
still-unexecuted surface instance only, this addendum prospectively supersedes
the `point-solver-policy-v1` portion of 0018 with the complete
`point-solver-policy-v2` below. If the two documents differ about Armijo
acceptance or the new binary64 guards, 0019 controls that future instance. The
surface scientific owner V1, passive material/geometry binding, branch policy
V1, surface-verification policy V1, and every other 0018 statement retain
precedence and identity. This rule has no retroactive effect on a V1 point,
failure, test, hash, or branch observation.

Only these two new scientific numerical owner/policy identities may be
introduced:

```text
main-wire-normal-adult-five-wall-passive-equilibrium-point-owner-v2
main-wire-normal-adult-passive-equilibrium-point-solver-policy-v2
```

"Only two" applies to scientific owner/policy identities. The required
technical attempt and sealing identities are distinct and fixed literally as:

```text
declarationId:
  main-wire-normal-adult-passive-equilibrium-point-solver-numerical-addendum-v1
attemptId:
  main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-reruns-v1
attemptSchemaId:
  main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-attempt-v1
evidenceSchemaId:
  main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-evidence-v1
evidenceAuditorId:
  main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-evidence-auditor-v1
auditorReportSchemaId:
  main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-auditor-report-v1
journalSchemaId:
  main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-attempt-journal-v1
authoritySchemaId:
  main-wire-normal-adult-passive-equilibrium-point-solver-v2-authoritative-clone-v1
reservationSchemaId:
  main-wire-normal-adult-passive-equilibrium-point-solver-v2-common-dir-reservation-v1
sealManifestSchemaId:
  main-wire-normal-adult-passive-equilibrium-point-solver-v2-seal-manifest-v1
tombstoneSchemaId:
  main-wire-normal-adult-passive-equilibrium-point-solver-v2-unexecuted-tombstone-v1
```

These technical IDs do not create another model, surface, branch policy, or
scientific claim owner.

V2 must use the existing pure candidate, constitutive, geometry, analytic
gradient, coupled Hessian, pressure, and Schur owners. It may not alter the
candidate energy, gradient, Hessian, Newton direction, trial-coordinate
formula, or post-acceptance force/stability/stagnation decisions. Its complete
supersession scope is:

1. compare the Armijo inequality by the exact compensated expansion sign
   specified below instead of either absolute-total comparison or a rounded
   delta; and
2. add only the binary64 guards for non-finite/non-negative/positive-zero/
   negative-zero per-candidate `rhs` and an exactly zero coordinate step.

The guards may reject a candidate that V1 could have accepted; they may never
turn a failing exact comparison into a pass. No other solver behavior is
superseded.

## Literal V2 Armijo owner

All operations below are IEEE-754 binary64 round-to-nearest, ties-to-even, in
the written order. `fl(expression)` means one binary64 operation. An
implementation must not reassociate an expression, contract operations, use a
decimal reconstruction, or replace this owner with a library summation.

The wall order is exactly:

```text
LVFW -> SEP -> RVFW
```

For each wall `w`, V2 reads the already evaluated equilibrium-passive stored
energies `Ucurrent_w` and `Utrial_w`. It does not derive them by subtracting
whole-heart or ventricular totals. It computes an error-free difference with
this exact `TwoDiff(a,b)` sequence:

```text
x       = fl(a - b)
bVirtual = fl(a - x)
aVirtual = fl(x + bVirtual)
bRound   = fl(bVirtual - b)
aRound   = fl(a - aVirtual)
y       = fl(aRound + bRound)
return (x,y)
```

For finite non-overflowing inputs, `x+y` is the exact real difference `a-b`.
V2 calls `TwoDiff(Utrial_w,Ucurrent_w)`, never the reverse. The six terms are
then exactly:

```text
[
  hi_LVFW, lo_LVFW,
  hi_SEP,  lo_SEP,
  hi_RVFW, lo_RVFW
]
```

The compensation primitive is this exact `TwoSum(a,b)` sequence:

```text
s      = fl(a + b)
bPrime = fl(s - a)
aPrime = fl(s - bPrime)
bRound = fl(b - bPrime)
aRound = fl(a - aPrime)
e      = fl(aRound + bRound)
return (s,e)
```

The six-term expansion is constructed without dropping zero components:

```text
E = []
for x in the six-term order above:
  Q = x
  N = []
  for e in E from index 0 upward:
    (Qnext,r) = TwoSum(Q,e)
    N.push(r)
    Q = Qnext
  N.push(Q)
  E = N
```

After the sixth insertion, `E` has exactly six binary64 components in the
owner's low-to-high expansion order. A rounded delta is retained for diagnosis
only and is reduced in this exact order:

```text
deltaU_eval_diagnostic = +0
for k = 0,...,5:
  deltaU_eval_diagnostic = fl(deltaU_eval_diagnostic + E[k])
```

The unchanged scaled Newton quantities are `g~`, `H~`, and
`d=-inverse(H~)*g~`. Their directional derivative is evaluated as

```text
gDotD = fl(fl(g0*d0) + fl(g1*d1))
```

For backtrack exponent `b=0,...,28`, the trial construction and Armijo right
side are exactly:

```text
alpha  = 2^(-b)
step_i = fl(fl(Dq_i*alpha)*d_i)
qtrial_i = fl(q_i + step_i)
rhs = fl(fl(fl(1e-4*alpha)*1J)*gDotD)
```

Here `1e-4` is the round-to-nearest binary64 conversion of that ECMAScript
numeric literal, `1J` is the exact binary64 value `1` carrying the fixed joule
scale, and `alpha` is the exact power of two. Neither constant is reconstructed
from text in the evidence path.

The Armijo decision never compares the rounded diagnostic delta. For each
candidate, V2 copies the six-component `E`, inserts the exact unary negation
`-rhs` as a seventh term with the same grow loop above, retains every zero, and
calls the resulting seven-component expansion `R`:

```text
R = E
Q = -rhs
N = []
for e in R from index 0 upward:
  (Qnext,r) = TwoSum(Q,e)
  N.push(r)
  Q = Qnext
N.push(Q)
R = N
```

Provided every component is finite, `R` represents the exact real value

```text
(Utrial_LVFW-Ucurrent_LVFW)
+ (Utrial_SEP-Ucurrent_SEP)
+ (Utrial_RVFW-Ucurrent_RVFW)
- rhs
```

The comparison owner scans `R[6]`, `R[5]`, ..., `R[0]` and selects the first
component whose numeric value is neither positive nor negative zero. Its sign
is the exact expansion sign. If all seven components are zero, the sign is
zero. With all components already required finite, the owner is literally:

```text
exactExpansionSign = 0
for k = 6,...,0:
  if R[k] != 0:  // numeric comparison: both +0 and -0 compare equal to zero
    exactExpansionSign = (R[k] < 0 ? -1 : +1)
    break
```

The decision is literally:

```text
accept iff exactExpansionSign(R) <= 0
```

The first accepted `b` in ascending order owns the update. Exact equality
passes, as in V1. `rhs` must be finite and strictly less than positive zero. A
`NaN`, an infinity, positive zero, or negative zero in `rhs` makes that
candidate ineligible without evaluating its energy; it must not make a
zero-decrease trial pass. A non-finite component cannot be compared and makes
that candidate ineligible. A retained expansion that does not replay exactly
under the frozen grow algorithm fails the evidence auditor.

A trial whose two coordinate bit patterns both equal the current coordinate
bit patterns is rejected as `zero-coordinate-step`. A one-ULP coordinate move
is not rejected merely for being one ULP: it must still have finite evaluated
energies and satisfy the stable inequality. The mandatory ULP fixture below
must demonstrate rejection when its stable evaluated decrease is zero or is
greater than `rhs`.

The V1 absolute totals and both rounded deltas remain diagnostics only,
assembled as
`fl(fl(U_LVFW+U_SEP)+U_RVFW)`. They do not participate in the V2 decision. The
naive delta is `fl(Utrial_total-Ucurrent_total)`. The two diagnostic residuals
are:

```text
absoluteV1Residual = fl(Utrial_total - fl(Ucurrent_total + rhs))
roundedDeltaDiagnostic = deltaU_eval_diagnostic
roundedV2Residual      = fl(deltaU_eval_diagnostic - rhs)
```

Neither rounded diagnostic participates in acceptance. The retained decision
sign comes only from `R`.

## Admissibility and failure semantics

The current candidate, `g~`, `H~`, its eigenvalues, `d`, `gDotD`, all current
wall energies, and every arithmetic intermediate required before backtracking
must be finite. A current candidate, wall-energy, gradient, Hessian, or
eigenvalue evaluation exception/non-finite value is
`candidate-evaluation-failed`. A zero or non-finite internal-Hessian
determinant is `scaled-internal-hessian-singular`; a finite Hessian below the
unchanged eigenvalue floor is
`scaled-internal-hessian-not-positive-definite`. A non-finite Newton direction,
non-finite `gDotD`, or `gDotD>=0` is `newton-direction-not-descent`. Each of
these fails before line search. Within line search, a per-candidate `rhs` that
is non-finite or does not satisfy the literal binary64 predicate `rhs < +0`
produces a not-evaluated candidate record with reason
`rhs-non-finite-or-not-strictly-negative`; the solver then continues to the
next declared `b`.

For a trial, an invalid junction radius, geometry exception, non-finite
trial coordinate/candidate field, non-finite wall energy, non-finite `TwoDiff`
or `TwoSum` intermediate, or non-finite expansion component makes that trial
inadmissible. A missing or non-finite seven-component comparison expansion, or
an exact-sign result that cannot be independently replayed, also makes it
inadmissible. A non-finite rounded diagnostic is retained with its exact bits
but, like every rounded diagnostic, cannot reject or accept the candidate. The
reason is retained and the solver continues to the next declared `b`. It may
not coerce a non-finite value to zero. If no declared candidate passes, the
stage returns the existing line-search failure with all preceding
accepted-stage and accepted-step evidence intact.

When more than one condition applies, each candidate receives the first reason
in this fixed order:

```text
rhs-non-finite-or-not-strictly-negative
trial-coordinate-non-finite
zero-coordinate-step
junction-radius-below-minimum
candidate-evaluation-exception
candidate-field-non-finite
wall-energy-non-finite
two-diff-intermediate-non-finite
two-sum-or-expansion-intermediate-non-finite
exact-comparison-unavailable
armijo-not-satisfied
armijo-satisfied
```

These are candidate diagnostic reasons, not new stage-failure identities. Only
the first `armijo-satisfied` record may own an update. Exhaustion still
produces the unchanged
`line-search-failed` stage reason.

After a V2 Armijo pass, the existing accepted-candidate singularity, strict
positive-definiteness, force-convergence, and stagnation decision order is
unchanged. No Hessian shift, steepest-descent fallback, wall-energy rescaling,
threshold change, extended backtracking, retry, or rescue path is allowed.

## Required pre-target tests

The following tests must pass before the V2 implementation and runner are
committed. They must be manufactured or pure-owner tests and must not evaluate
the four normal-adult cases in the three top-level executions declared below.

1. A large-offset cancellation fixture must show, against an exact binary64
   integer-times-power-of-two oracle, that every `TwoDiff` pair and the final
   six-component `E` represent the exact sum of the three evaluated wall
   differences and that seven-component `R` represents the exact Armijo
   difference. It must include a case where the V1 absolute-total rule loses
   the decrease and V2 makes the preregistered decision.
2. A well-conditioned equivalence fixture must show that V1 and V2 select the
   same first `b` when the absolute subtraction is resolvable, while the V2
   expansion and reduced scalar match their frozen expected bit patterns.
3. A non-descent or non-finite `gDotD` must fail before trial acceptance.
4. Reversing the wall order, reversing `TwoDiff` arguments, changing one sign,
   reassociating either expansion, changing the `-rhs` insertion, or tampering
   with one retained bit pattern, exact sign, or decision flag must fail the
   owner/auditor binding.
5. An exactly unchanged coordinate trial must fail as
   `zero-coordinate-step`. A manufactured one-ULP move with zero or
   insufficient stable decrease must fail the V2 Armijo inequality. A genuine
   one-ULP move is not categorically forbidden.
6. Exceptions, `NaN`, infinities, signed zero in `rhs`, and exhaustion of all
   29 candidates must exercise the exact failure semantics above.
7. A boundary counterexample must have a rounded
   `deltaU_eval_diagnostic<=rhs` while the highest-index nonzero component of
   exact `R` is positive. V2 must reject it. This exact false-accept control is
   mandatory and may not be replaced by a non-boundary cancellation example.
8. An invalid RHS in a decision-search record must be retained and skipped. An
   invalid RHS or evaluation exception in a diagnostic-only record after the
   selected update must not revoke or change that update.

No test may tune a constant from the three retained V1 outcomes. The tests
must bind the complete V2 solver-policy payload and reject a V1/V2 owner or
policy substitution.

## Frozen diagnostic evidence

Every Newton iteration in the one shared V2 reference-root solve, every
attempted primary stage of the literal and canonical midpoint executions, and
the two named seed stage-0 participants must retain the closed
iteration-evidence union below. For all of those solves, a
`line-search-entered` iteration has exactly 29 records; only the declared
pretrial-failure or converged `line-search-not-entered` arm has zero. The
reference root may not use the compact evidence allowed for other unchanged
branch participants. Every binary64 field has
the closed shape `{value, float64BitsHex, classification}`. A finite value
retains its JSON number and its lower-case, 16-character, big-endian IEEE-754
hexadecimal bit pattern. A non-finite diagnostic uses `value:null`, retains its
bit pattern and the exact classification `positive-infinity`,
`negative-infinity`, or `nan`. A non-finite value required by a numerical gate
cannot pass that gate. A diagnostic-only non-finite value is retained and
replayed but cannot alter the exact Armijo decision. Positive and negative zero
both use `classification:"finite"` and remain distinguishable by their bit
patterns.

```text
IterationEvidenceV2 =
  | {
      status: "line-search-not-entered";
      outcome: "converged" | "pretrial-failure";
      reason:
        "scaled-force-tolerance-reached"
        | "junction-radius-below-minimum"
        | "candidate-evaluation-failed"
        | "scaled-internal-hessian-singular"
        | "scaled-internal-hessian-not-positive-definite"
        | "newton-iteration-limit"
        | "newton-direction-not-descent";
      currentSolverEvidence: fields available before that decision;
      candidateRecords: [];
    }
  | {
      status: "line-search-entered";
      decision:
        | {
            outcome: "line-search-failed";
            selectedBacktrackExponent: null;
            stageFailureReason: "line-search-failed";
          }
        | {
            outcome: "accepted-candidate-failed";
            selectedBacktrackExponent: 0,...,28;
            stageFailureReason:
              "scaled-internal-hessian-singular"
              | "scaled-internal-hessian-not-positive-definite";
          }
        | {
            outcome: "force-converged";
            selectedBacktrackExponent: 0,...,28;
            stageFailureReason: null;
          }
        | {
            outcome: "scaled-update-stagnated";
            selectedBacktrackExponent: 0,...,28;
            stageFailureReason: "scaled-update-stagnated";
          }
        | {
            outcome: "continue-newton";
            selectedBacktrackExponent: 0,...,28;
            stageFailureReason: null;
          };
      currentSolverEvidence: complete finite g/H/d/gDotD/eigenvalue evidence;
      candidateRecords: exact tuple for b=0,...,28;
    };
```

`line-search-not-entered` always owns exactly zero candidate records. It is the
only representation for a pretrial failure, an already converged current
candidate, or the iteration limit. Before entering line search, V2 requires a
finite Newton direction and finite, strictly negative `gDotD`. It does not
precheck all future `rhs` values. Each `rhs` is guarded in its own ordered
candidate record so that a decision-inert candidate after the selected update
cannot revoke that update.

`outcome:"converged"` is permitted only with
`reason:"scaled-force-tolerance-reached"`; every other reason requires
`outcome:"pretrial-failure"`. For `line-search-entered`, the closed `decision`
union above is the only allowed outcome/reason/selection combination.
`line-search-failed` has no `selected-update` record. Every other arm has
exactly one, at the smallest `b` whose otherwise-admissible evaluated record
satisfies the exact comparison. The accepted-candidate decision order remains
strictly: determinant/singularity, strict positive definiteness, force
convergence, scaled-update stagnation, then continue Newton.

The `line-search-not-entered` field-presence rules are exact:

| Reason | Required current fields | Forbidden fields |
| --- | --- | --- |
| `junction-radius-below-minimum` | stage/iteration identity and current coordinate wrappers | candidate, gradient, Hessian, direction, `gDotD`, and candidates |
| `candidate-evaluation-failed` | stage/iteration identity, current coordinates, and exception `{name,message}` | completed candidate, gradient, Hessian, direction, `gDotD`, and candidates |
| `scaled-internal-hessian-singular` or `scaled-internal-hessian-not-positive-definite` | complete current candidate, gradient, Hessian, determinant, and eigenvalues | direction, `gDotD`, and candidates |
| `scaled-force-tolerance-reached` or `newton-iteration-limit` | complete current candidate, gradient, Hessian, determinant, and eigenvalues | direction, `gDotD`, and candidates |
| `newton-direction-not-descent` | complete current candidate/Hessian evidence plus every direction quantity that was computed before failure | any quantity after the failing operation and all candidates |

`newton-direction-not-descent` additionally owns
`directionFailureKind:"direction-non-finite" | "gdotd-non-finite" |
"gdotd-non-negative"`. Their exact field presence is:

- `direction-non-finite` requires both direction wrappers and forbids
  `gDotD`, RHS, and candidates;
- `gdotd-non-finite` and `gdotd-non-negative` require both direction wrappers
  and the `gDotD` wrapper and forbid RHS and candidates.

No pretrial union arm owns a candidate RHS.

`line-search-entered` always owns exactly 29 candidate records, even after a
decision is known. Each record has common fields `b`, `alpha`, `rhs`, both
steps, both trial coordinates, `decisionRole`, and `selectedForUpdate`.
`decisionRole` is exactly `decision-search`, `selected-update`, or
`diagnostic-only-after-selection`. Exactly one record may be
`selected-update`; every later record is diagnostic-only and cannot modify the
state.

Each candidate record is itself this closed union:

```text
CandidateRecordV2 =
  | {
      status: "not-evaluated";
      common fields only;
      reason:
        "rhs-non-finite-or-not-strictly-negative"
        | "trial-coordinate-non-finite"
        | "zero-coordinate-step"
        | "junction-radius-below-minimum"
        | "candidate-evaluation-exception";
      evaluationAttempted: boolean;
      exception: {name,message} only when reason is
        "candidate-evaluation-exception";
      no trial energy, force, TwoDiff, E, R, delta, residual, or sign fields;
    }
  | {
      status: "evaluated";
      common fields;
      complete wrapped candidate fields, wall energies, force, TwoDiff terms,
        E[0..5], R[0..6], rounded diagnostics, and exactExpansionSign;
      reason:
        "candidate-field-non-finite"
        | "wall-energy-non-finite"
        | "two-diff-intermediate-non-finite"
        | "two-sum-or-expansion-intermediate-non-finite"
        | "exact-comparison-unavailable"
        | "armijo-not-satisfied"
        | "armijo-satisfied";
      armijoSatisfied: boolean;
    };
```

For `not-evaluated`, `evaluationAttempted` is false for the first four reasons
and true for `candidate-evaluation-exception`. The listed absence of later
fields is mandatory; placeholder zeroes or null-filled pseudo-evaluations are
forbidden. For `evaluated`, all listed fields are present even when a wrapped
value is non-finite. `exactExpansionSign` is `-1`, `0`, or `+1` only when all
`R` components are finite and replayable; otherwise it is `null`. A non-finite
rounded diagnostic remains an `evaluated` record and does not change its
`armijo-not-satisfied` or `armijo-satisfied` reason.

For reason precedence, `candidate-field-non-finite` means a returned non-energy
candidate or trial-force field; wall energies are classified separately as
`wall-energy-non-finite`.

`armijoSatisfied` is true exactly for `reason:"armijo-satisfied"` and false for
every other evaluated reason. When a selected record exists,
`selectedForUpdate` is true exactly for that one
`decisionRole:"selected-update"` record. A selected record must be
`armijo-satisfied`; an `armijo-satisfied` record after selection remains
unselected and diagnostic-only. A line-search failure has no selected record.

For every `b`, the owner first computes all common scalar wrappers in this
fixed order: `alpha`, both steps, both trial coordinates, then `rhs`. It then
applies the declared reason precedence. This is why an RHS-guard record still
owns trial-coordinate wrappers while owning no candidate evaluation. No
later-`b` guard or diagnostic record can change an earlier selected update.

Candidate reasons use the precedence listed in the admissibility section. An
Armijo-satisfied record after the selected record remains
`diagnostic-only-after-selection` with `selectedForUpdate:false`. A replayable
diagnostic-only exception or inadmissible candidate does not alter the selected
update; a missing record, wrong union arm, forbidden field, or replay mismatch
fails engineering evidence.

Every `currentSolverEvidence` contains the ordered values available at its
decision boundary. A complete pretrial solve record and every
`line-search-entered` record contain ordered `g~`, ordered symmetric `H~`, `d`,
`gDotD`, ordered `H~*d+g~`, its infinity norm, and the ascending two
eigenvalues, as well as current coordinates, force, fixed wall energies, and
absolute ventricular total. A failure before a quantity exists omits that
quantity and records the exact reason; it must not synthesize a value.

The residual components are evaluated literally as:

```text
r0 = fl(fl(fl(H00*d0) + fl(H01*d1)) + g0)
r1 = fl(fl(fl(H10*d0) + fl(H11*d1)) + g1)
```

Every `evaluated` candidate record contains:

- `b`, `alpha`, both `step` values, both trial coordinates, and their float64
  bits;
- fixed-order current and trial energies for `LVFW`, `SEP`, and `RVFW`;
- all six per-wall `TwoDiff` terms, all six `E` components, all seven `R`
  components, the naive delta, and `deltaU_eval_diagnostic`, with float64 bits;
- `rhs`, `absoluteV1Residual`, and `roundedV2Residual`, with float64 bits;
- `exactExpansionSign`, the exact Armijo boolean, and the highest-index
  nonzero `R` owner, or the declared all-zero equality case;
- trial scaled-gradient components and force infinity norm when evaluation is
  valid;
- geometry, finite-value, zero-step, and candidate-admissibility flags;
- V1-diagnostic and V2-decision booleans, rejection reason, and
  `selectedForUpdate`; and
- whether the record was evaluated after the first accepted candidate solely
  to complete diagnostic coverage.

The canonical solver still selects the first passing candidate and does not
use any later candidate for the state update. For these engineering stages,
the evidence owner assesses the remaining candidates after that selection to
complete the fixed 29-record union. Those decision-inert records cannot change
the selected update.

For V2, `stageZeroRootPayload` is the full reference-root payload, not a compact
digest preimage. It contains every owner and policy identity/hash, passive
material/geometry binding, A/B/manifest and authority/reservation lineage,
exact reference chamber-volume and initial-coordinate bits, every closed
iteration record, completed solver evidence, terminal candidate
coordinates/energy/gradient/Hessian/eigenvalues, stationarity and
strict-stability gates, and failure-retention fields. Its owner computes:

```text
stageZeroRootSha256 = sha256CanonicalJsonHex(stageZeroRootPayload)
```

On a passing attempt, the artifact retains that exact object as
`admittedReferenceRootPayload` and the exact hash as
`admittedReferenceRootSha256`; these are aliases of the admitted
`stageZeroRootPayload` and `stageZeroRootSha256`, not a second projection or
rehash owner. The auditor report is outside the root-hash preimage, binds the
root hash, and must independently replay every root iteration and terminal
gate before the root becomes sealed or admitted. The artifact separately
retains `referenceRootAuditorReport` and
`referenceRootAuditorReportSha256`.

A sealed root is staged immediately in journal state `reference-root`; every
later failure artifact retains the full admitted payload, hash, and auditor
report. If the root itself fails or its audit fails, the same state retains the
complete closed root-attempt/failure evidence, while both admitted-root fields
are null. A failed or unaudited root payload is never assigned an admitted-root
hash.

Each reference-root iteration payload, the full reference-root payload, each
of the four case payloads, each of the three top-level execution envelopes, and
their ordered aggregate payload has a canonical SHA-256. An independent
auditor must recompute all float64 bits, `TwoDiff`, both expansions, exact
highest-component sign, diagnostics, gates, union-arm field presence, reason
precedence, first-pass selection, and hashes from the retained evaluated
energies and solver quantities. A self-reported pass is insufficient.

## Four cases in exactly three top-level executions

### Two-commit seal before target execution

There are two implementation-sealing commits after this declaration:

1. Commit **A** contains the V2 owner and complete policy payload, manufactured
   tests, zero-argument runner, independent auditor, and no normal-adult target
   result. It also contains the exact 0019 document blob used by those owners.
2. Commit **B** has A as its direct parent and changes only the fixed data-only
   seal manifest and unexecuted-attempt tombstone. The manifest pins A's full
   SHA, the exact Git blob IDs for V2 implementation, tests, runner, auditor,
   and this 0019 document, all inherited policy/binding blobs, and the
   authoritative-clone record described below. B may not change solver,
   auditor, runner, test, model, or UI code.

After A and before B, the seal operator resolves the authoritative clone's Git
common directory with `git rev-parse --git-common-dir`, resolves that result to
its canonical filesystem directory without serializing the path, and creates
this record with filesystem `wx`:

```text
<resolvedGitCommonDir>/circleheart-scientific-attempts/authoritative-clone-v1.json
```

The sealing step creates the fixed `circleheart-scientific-attempts` directory
if absent and flushes the Git common directory before creating the record. It
may not redirect either component to another directory.

The authority payload contains exactly `authoritySchemaId`, one opaque
lower-case 32-hex-character `authoritativeCloneId` generated once before the
create-only write, `declarationId`, `attemptId`, `attemptSchemaId`,
`reservationSchemaId`, A's full SHA, and the fixed relative record suffix. The
file and its containing directory are flushed;
the record is never rewritten, replaced, or deleted. A second create attempt
fails. After an interruption, B sealing may read the already durable record
only when every field exactly matches A and this declaration; any partial or
mismatching record fails closed. Its canonical payload digest is

```text
authoritativeCloneRecordSha256 =
  sha256CanonicalJsonHex(authorityPayload)
```

B's manifest pins the authority schema, clone ID, relative suffix, full
authority payload, and `authoritativeCloneRecordSha256`. It also defines
`sealManifestSha256 = sha256CanonicalJsonHex(sealManifestPayload)`. No absolute
or user-identifying filesystem path enters either payload. Because the
authority record is Git-external, creating it does not add a third B diff.

The seal-manifest and tombstone paths are exactly:

```text
docs/scientific-runtime/evidence/
  passive-equilibrium-point-solver-v2-seal-manifest-v1.json
docs/scientific-runtime/evidence/
  passive-equilibrium-point-solver-v2-unexecuted-tombstone-v1.json
```

B cannot contain its own commit SHA without self-reference. The runner proves
that clean `HEAD` is B by requiring: B's direct parent is the A SHA pinned by
the manifest; `git diff A..HEAD` contains exactly the two allowed data files;
their schemas and contents pass; and every pinned blob read from `HEAD` matches
the manifest. It then resolves its own Git common directory and requires the
authority record at the fixed suffix to match the manifest's full payload,
clone ID, and canonical digest. Absence or mismatch rejects that clone before
reservation. The observed B SHA is then retained in the attempt reservation
and final artifact. The runner must not run from A, a descendant of B, a
recreated commit with any additional diff, or a clone lacking the exact pinned
authority record.

### Fixed cases and execution order

After B exists in a clean worktree, one attempt may perform exactly three
top-level executions in this order:

| Top-level execution ID | Frozen content |
| --- | --- |
| `literal-midpoint-primary-v2` | One primary solve using the literal `(LA,LV,RA,RV)` bit tuple `(3f0e61ead6a30f64,3f19e65b134c0d1f,3f1306c2e7c6a33d,3f1d232675b58ec3)`. It begins from the one shared V2 sealed reference root and attempts the unchanged 32-stage path. |
| `canonical-index16-primary-v2` | One distinct primary solve using the indexed-formula bit tuple `(3f0e61ead6a30f64,3f19e65b134c0d20,3f1306c2e7c6a33d,3f1d232675b58ec2)`. It begins independently from the same shared root and attempts the unchanged 32-stage path. |
| `reference-branch-audit-v2` | One complete reference-lattice branch audit. Its fixed participants include exactly one stage-0 execution from `q_loaded+Dq*(0,+0.25)` and exactly one from `q_loaded+Dq*(+0.25,+0.25)`, which own the remaining two frozen cases. |

The shared V2 reference root is solved exactly once before these executions.
The two midpoint continuations do not seed one another. The two named seed
cases are not executed separately before or after the branch audit. When the
shared root is available, the unchanged branch policy requires all 12
participants and all 66 pair records, and each named seed therefore executes
once inside that audit.

Each top-level boundary has all-settled semantics: a scientific failure,
exception, or evidence-audit failure is caught and retained, then every later
top-level execution whose dependencies are available is still attempted in
the fixed order. This is sequential all-settled coverage, not parallel
execution. Literal failure does not suppress canonical or branch execution;
canonical failure does not suppress branch execution. Every top-level entry
ends as `fulfilled`, `scientific-failure`, `execution-exception`,
`evidence-audit-failure`, or `dependency-failed`. An exception retains only
the sanitized `{name,message}` and stage identity; raw candidate-owner inputs
are not serialized. Status precedence is dependency unavailable, execution
exception, evidence-audit failure, audited scientific failure, then audited
fulfillment; exactly one status is retained per entry.

If the shared root returns a scientific failure, throws, fails sealing, or
fails its evidence audit, both midpoint executions are retained as
`dependency-failed` without evaluating their targets, and the full 12-member
branch audit is retained as `dependency-failed`. During the branch-audit stage,
the runner must nevertheless attempt each of the two named root-independent
seed stage-0 diagnostics exactly once, in `(0,+0.25)` then
`(+0.25,+0.25)` order, because those solves do not require the common sealed
root. They remain diagnostic case failures and cannot convert the unavailable
full branch audit into a pass. No other audit participant is synthesized from
a failed shared-root dependency.

### Crash-safe common-directory and worktree reservation

The fixed runtime paths are:

```text
commonDirAuthority:
  <resolvedGitCommonDir>/circleheart-scientific-attempts/authoritative-clone-v1.json
commonDirReservation:
  <resolvedGitCommonDir>/circleheart-scientific-attempts/main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-reruns-v1.reservation.json
journal:
  docs/scientific-runtime/evidence/
    passive-equilibrium-point-solver-v2-engineering-reruns-v1.journal.json
journalStage:
  docs/scientific-runtime/evidence/
    passive-equilibrium-point-solver-v2-engineering-reruns-v1.journal.json.next
artifact:
  docs/scientific-runtime/evidence/
    passive-equilibrium-point-solver-v2-engineering-reruns-v1.json
```

Before reserving an attempt, the zero-argument runner checks clean `HEAD==B`,
all manifest/blob/policy and authority-record bindings, platform dependencies,
and absence of the common-directory reservation, journal, journal-stage, and
artifact paths. It accepts no caller target, seed, path, retry flag, clone ID,
or owner substitution. A failure during this read-only preflight creates no
reservation or worktree path, evaluates no target, and does **not** consume the
attempt. The same command may be invoked after that external/preflight defect
is corrected.

After preflight and before creating the worktree journal or invoking the
shared-root solver, the runner atomically opens `commonDirReservation` with
filesystem `wx`. The immutable reservation payload contains the A and observed
B SHAs, `sealManifestSha256`, the full authority payload and
`authoritativeCloneRecordSha256`, `authoritativeCloneId`, every technical ID
listed above, and the fixed authority/reservation suffixes. It contains no
absolute path. Its canonical payload hash is:

```text
commonDirReservationSha256 =
  sha256CanonicalJsonHex(commonDirReservationPayload)
```

The runner writes the complete payload, flushes the file, and flushes the
`circleheart-scientific-attempts` directory before proceeding.

Successful exclusive file creation is the attempt-consumption boundary. A
write, flush, crash, or kill after `wx` has created the reservation directory
entry is a consumed fail-closed attempt even if the payload is empty or
incomplete; it cannot be treated as a preflight failure. The reservation is
never deleted, replaced, or reused. Every worktree sharing that Git common
directory resolves the same fixed reservation path and therefore rejects a
second invocation. Only after a complete, durable reservation passes an
immediate self-read and canonical digest check may the runner create the
worktree journal with `wx`, flush the file and parent directory, and record
`state:"reserved"`, the full reservation payload, and
`commonDirReservationSha256`.

An `wx` failure that creates no directory entry consumes no new attempt and
evaluates no target. If it failed because another worktree won the race, that
winner's permanent reservation remains authoritative and blocks this runner.

Failure to create or flush the worktree journal after the common-directory
reservation is still a consumed attempt and must not invoke the shared-root
solver. Once the common-directory reservation exists, a crash, kill, write
error, scientific failure, or dependency failure consumes the attempt; the
same attempt ID must never resume or rerun.

This filesystem exclusion claim covers every worktree that shares the pinned
Git common directory. It does not claim worldwide mutual exclusion among
physically independent clones. Instead, B authorizes exactly one clone
identity by pinning the pre-existing create-only authority record; a runner in
another clone fails before reservation when its local authority record is
absent or does not match. Copying bytes outside this protocol is not
reclassified as a second authorized scientific attempt.

The journal state sequence is exactly:

```text
reserved
-> reference-root
-> literal
-> canonical
-> branch-audit
-> completed | failed
```

At every transition, a cumulative staged envelope is written to the
`journalStage` path with `wx`, flushed, atomically renamed over the journal,
and followed by a parent-directory flush. The rename consumes the stage path;
its unexpected existence is a fail-closed sign of an interrupted consumed
attempt. The prior valid journal remains the recovery record if a transition
is interrupted before rename. Each envelope retains all completed raw-free
diagnostics, hashes, exceptions, scientific failures, audit failures, and
dependency statuses, plus the full common-directory reservation payload and
its canonical digest. The runner continues after a retained scientific failure
according to the all-settled rules above. If the process remains alive, it
must reach `completed` only for a passing conjunction and `failed` otherwise,
then write the final artifact create-only with `wx` before returning a nonzero
failure exit when applicable. The artifact status is exactly `pass` for a
completed conjunction and `failed` otherwise.

A crash can leave only the permanent common-directory reservation, or that
reservation plus the latest durable journal state, and no final artifact. The
reservation alone proves consumption; neither automatic recovery nor a second
execution under this ID is allowed. A human result document may describe the
partial attempt, but cannot complete missing targets or relabel it as a pass.

The final artifact binds commit
`28e6c5e9c7c7072853a79758fef6a2c09984cc30`, the A and observed B SHAs, this
addendum's pinned blob, both V2 scientific identities, every technical schema
ID, the inherited V1 material/geometry binding, the exact V1 branch and
surface-verification policies, a `referenceRootOutcome` from the closed union
below, all staged diagnostic/auditor hashes, the authority and reservation
payloads and digests, complete all-settled coverage, and runtime platform
provenance.

```text
referenceRootOutcome =
  | admitted {
      admittedReferenceRootPayload: full sealed V2 root payload,
      admittedReferenceRootSha256: canonical payload digest,
      rootFailureReason: null,
      referenceRootAuditorReport: full passing report,
      referenceRootAuditorReportSha256: canonical report digest
    }
  | not-admitted {
      admittedReferenceRootPayload: null,
      admittedReferenceRootSha256: null,
      referenceRootAttemptEvidence: full closed attempt/failure evidence,
      rootFailureReason: exact retained scientific, execution, audit, or
        post-audit sealing/write/readback reason,
      auditOutcome:
        | not-run {
            referenceRootAuditorReport: null,
            referenceRootAuditorReportSha256: null,
            auditorNotRunReason: exact retained upstream reason
          }
        | failed {
            referenceRootAuditorReport: full failing report,
            referenceRootAuditorReportSha256: canonical report digest,
            auditorNotRunReason: null
          }
        | execution-failed {
            referenceRootAuditorReport: null,
            referenceRootAuditorReportSha256: null,
            auditorNotRunReason: null,
            auditorExecutionFailure: sanitized retained exception
          }
        | passed-but-scientific-failure {
            referenceRootAuditorReport:
              full passing replay report for the closed scientific failure,
            referenceRootAuditorReportSha256: canonical report digest,
            auditorNotRunReason: null,
            auditorExecutionFailure: null
          }
        | passed-but-sealing-failed {
            referenceRootAuditorReport: full passing report,
            referenceRootAuditorReportSha256: canonical report digest,
            auditorNotRunReason: null,
            auditorExecutionFailure: null
          }
    }
```

The `admitted` arm is required for artifact `status:"pass"`. A root scientific
failure, execution exception, sealing failure, or audit failure selects only
the `not-admitted` arm and therefore forces artifact `status:"failed"`. The
arms cannot be merged: a failed artifact never fabricates a sealed root, while
an admitted artifact never substitutes failure evidence for the independently
replayed root. Within `not-admitted`, an upstream failure before audit selects
only `auditOutcome:not-run`, an auditor exception before a report selects only
`execution-failed`, an audit rejection selects only `failed`, a correctly
replayed root scientific failure selects only
`passed-but-scientific-failure`, and an error after a passing audit of a
scientifically successful root but before durable sealed-root admission
selects only `passed-but-sealing-failed`. The retained `rootFailureReason`,
root scientific status, report status, and field-presence variant must agree;
no caller chooses among them.

No scan, exploratory target, automatic retry, official surface construction,
or live publication may run in this attempt. Another numerical change requires
another preregistered solver-policy identity and another attempt ID.

### Required binding for a future surface instance

The analysis-only surface owner retains its V1 scientific identity, but a
future surface instance must fail closed unless its immutable input bundle
contains and independently verifies all of:

- `declarationId` above, the exact committed 0019 Git blob pinned by B, and the
  A and B commit relationship;
- the complete `point-solver-policy-v2` payload and its canonical SHA-256;
- the exact unchanged branch-policy-V1 payload paired with that V2 solver
  payload, plus the resulting new combined solver/branch protocol SHA-256;
- the unchanged passive material/geometry binding and
  surface-verification-policy-V1 payload/hash;
- the seal-manifest schema, complete manifest payload, observed B SHA, and
  every pinned implementation/test/runner/auditor blob;
- the complete authoritative-clone payload and digest, complete durable
  common-directory reservation payload and digest, and their exact IDs and
  A/B/manifest bindings;
- the create-only engineering artifact's canonical payload SHA-256,
  `status:"pass"`, completed journal lineage, four-case/three-execution
  coverage, and independent auditor pass; and
- the passing attempt's full `admittedReferenceRootPayload`, its
  `admittedReferenceRootSha256`, and the independent root-auditor report and
  report hash.

Before evaluating the first surface point, the surface owner must independently
resolve its Git common directory and reread the pinned authority and permanent
reservation records; both full payloads and digests must match the manifest,
engineering artifact, and surface input bundle. It then independently replays
the full admitted root, recomputes `admittedReferenceRootSha256`, and uses that
exact payload as its construction `stageZeroRootPayload`. Canonical payload
equality and hash equality are both required; a matching hash is not a license
to accept different retained fields. The owner may not call a root solver to
create, refresh, normalize, or replace that construction root.

Every surface point result or retained point failure must then satisfy:

```text
point.stageZeroRootSha256 == admittedReferenceRootSha256
```

The surface aggregator verifies this equality over the complete point lineage
before any scientific gate. A missing hash, one mismatching point, a different
construction-root payload, or any alternate root re-solve fails the surface
instance before its first eligible result; there is no rescue or substitution
path.

An artifact with `failed`, partial, dependency-failed, missing, resumed, or
unsealed status is not an input. Neither a V1 protocol hash nor an unsealed
retrospective value may substitute for any V2 binding. The future surface
artifact must carry this entire input bundle and its own exact recomputation;
otherwise the surface construction is ineligible before its first point.

## Pre-surface decision boundary

Proceeding to the previously declared surface construction requires the
conjunction of:

- all manufactured V2 owner, bit-pattern, oracle, negative, tamper, and
  failure-retention tests passing before target execution;
- one durable common-directory reservation matching the authority record,
  manifest, A/B commits, attempt IDs, and all worktree-journal/final-artifact
  readbacks;
- one shared reference root completing and sealing exactly once, with every
  Newton iteration represented by the closed evidence union and independently
  replayed, and its full payload and canonical hash retained without a compact
  substitute;
- the literal-midpoint and canonical-index16 executions each independently
  completing their unchanged 32-stage primary lineage and terminal Schur
  projection without line-search, stagnation, stationarity, or stability
  failure;
- both named seed stage-0 reruns reaching strict stable roots and completing
  their required primary participant lineages without a failure;
- all three ordered top-level execution envelopes settling as `fulfilled` and
  all four frozen cases passing; no dependency-failed coverage is admissible;
- exact coverage and independent replay of every required diagnostic record;
- the canonical V2 reference branch audit passing all unchanged participant,
  66-pair coordinate, stored-energy, pressure, lineage, and binding gates; and
- every expected payload and canonical SHA-256 matching its independent
  auditor reconstruction; and
- journal state `completed`, a sealed create-only engineering artifact with
  `status:"pass"`, and exact authority/reservation/seal-manifest/A/B bindings.

A failure of any conjunct is the final engineering outcome and keeps surface
construction ineligible. A pass establishes only that the preregistered V2
point solver may be used by the still-unexecuted analysis-only surface owner.
It does not itself establish the surface, its verification gates, a global
branch, physiology, or any public or clinical claim.
