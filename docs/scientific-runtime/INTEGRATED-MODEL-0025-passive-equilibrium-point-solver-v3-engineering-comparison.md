# Passive-equilibrium point-solver V3 Engineering comparison

Status: declaration only; this document and its corpus definition must be
committed before the first V3 normal-adult evaluation

## Decision

The next passive-equilibrium step is a repeatable, explicitly unqualified
Engineering comparison of three point-solver policies. It is not a passive
surface construction and it is not a new qualification attempt.

The compared policies are:

1. residual-merit Armijo Newton;
2. component-energy Armijo Newton with a terminal-root guard; and
3. residual-merit Levenberg-Marquardt.

Residual-merit Newton is the leading design hypothesis, not the selected
policy. The comparison may name an Engineering leader after all declared
cases run, but it cannot select a production, public, surface, or confirmatory
solver.

The terminal-root guard has no energy-ULP allowance. It may accept only the
full Newton trial at `b=0`, and only when that trial already satisfies the
unchanged finite-domain, stationarity, and strict-stability terminal gates.
Rounded energy is diagnostic only for that guard. This prevents a
post-observation tolerance from converting an unconverged finite step into a
root.

## Historical boundary

[INTEGRATED-MODEL-0022](INTEGRATED-MODEL-0022-pr558-research-archive-retrospective.md)
owns the PR558 archive boundary. Its tag and head remain:

```text
tag: research-archive/passive-equilibrium-v2-failed-2026-08-19
head: 73a0d7008e49f451bf0062b48502295086be52a0
```

The V1 and V2 point, branch, journal, and evidence owners on that archive are
historical research records. V3 must not import or call their runner,
reservation, journal, sealing, attempt, qualification, or official-evidence
paths. The large archived artifact is not a runtime input. Its declared cases
are transcribed below under a new Engineering comparison identity; historical
qualification and eligibility do not transfer.

V3 may reuse only the current `main` pure scientific dependencies whose
formulas matched the archived implementation at declaration:

- fixed normal-adult wall geometry and passive-material values;
- equilibrium one-fibre passive energy, stress, and tangent;
- energy-conjugate TriSeg geometry and its first and second derivatives; and
- the analytic ventricular gradient and Hessian formula restated below.

Land activation, calcium, SLS history, pericardium, circulation, atria,
four-chamber Schur reduction, and any surface or branch owner are excluded.

## New Engineering identities

```text
declarationId:
  integrated-model-0025-passive-equilibrium-point-solver-v3-engineering-comparison
candidateOwnerId:
  main-wire-normal-adult-five-wall-passive-equilibrium-ventricular-candidate-engineering-v1
solverComparisonOwnerId:
  main-wire-normal-adult-passive-equilibrium-point-solver-comparison-engineering-v1
corpusId:
  main-wire-normal-adult-passive-equilibrium-point-solver-comparison-corpus-v1
reportSchemaId:
  main-wire-normal-adult-passive-equilibrium-point-solver-comparison-report-v1
```

These are Engineering identities only. They do not mint a passive-surface,
branch-policy, EDPVR, PE, PVA, MVO2, ATP, efficiency, official-evidence, or
public-output owner.

## Candidate owner

The candidate owner is pure and point-local. Its ventricular coordinate order
is exactly:

```text
z = [V_LV, V_RV, V_S, y]
q = [V_S, y]
Dq = diag(42e-6 m3, 0.033 m)
E0 = 1 J
wall order = [LVFW, SEP, RVFW]
```

For each ventricular wall `w`, it consumes the current pure geometry and
equilibrium-passive material owner and returns

```text
U_w = M_w psi_w(e_w)
H_w = M_w [C_w grad(e_w) grad(e_w)^T
           + sigma_w Hessian(e_w)]
```

in raw coordinate order `[V_LV,V_RV,V_S,y]`. The cap-coordinate gradients are
fixed as:

```text
LVFW: [-1, 0, 1]
SEP:  [ 0, 0, 1]
RVFW: [ 0, 1, 1]
```

The ventricular stored energy is the fixed reduction
`fl(fl(U_LVFW + U_SEP) + U_RVFW)`. The raw gradient is the energy-conjugate
TriSeg generalized force. The scaled internal gradient and Hessian are:

```text
g_tilde = Dq g_q / E0
H_tilde = Dq H_qq Dq / E0
```

The point-local terminal gates are all finite fields, `y > 1e-5 m`,
`max(abs(g_tilde)) <= 1e-10`, and
`lambda_min(H_tilde) > 1e-10`. A force-zero saddle is not a valid root.

The candidate result is unbranded and nonofficial. It cannot establish a
root, lineage, branch, surface, or physiological claim by itself.

## Shared solver contract

All policies use binary64 round-to-nearest/ties-to-even, the coordinate order
and scales above, at most 48 accepted updates followed by one terminal
evaluation, and these unchanged gates:

```text
maximum accepted updates per stage: 48
Newton backtrack exponents: b = 0,...,28
alpha_b: 2^(-b)
Armijo coefficient: 1e-4
scaled-force infinity tolerance: 1e-10
scaled-update stagnation limit: 1e-11
minimum scaled-Hessian eigenvalue, exclusive: 1e-10
minimum junction radius, exclusive: 1e-5 m
```

At every current and accepted candidate, finite-domain and strict-stability
gates precede force convergence. After an accepted trial, force convergence
precedes stagnation. An exactly bit-unchanged two-coordinate trial is
inadmissible. No policy may clip stress, shift the scientific Hessian, alter a
candidate, change a target, use a neighbouring target as an implicit seed, or
silently fall back to another policy.

Every result retains a compact ordered iteration trace with current force,
minimum eigenvalue, selected trial, step norm, and policy-specific merit
values. The trace is diagnostic Engineering output, not sealed evidence.

### Policy A: residual-merit Armijo Newton

```text
policyId:
  main-wire-normal-adult-passive-equilibrium-residual-armijo-newton-v3
phi(q) = 0.5 * dot(g_tilde(q), g_tilde(q))
d = -inverse(H_tilde) * g_tilde
q_b = q + Dq * (2^(-b) d)
accept first b in 0,...,28 satisfying:
  phi(q_b) <= (1 - 2*1e-4*2^(-b)) * phi(q)
```

The current Hessian must be finite, nonsingular, and strictly positive
definite. Trial candidates must also pass finite-domain and strict-stability
gates. `phi` is reduced in coordinate order `[V_S,y]`. No energy value enters
the decision.

### Policy B: component-energy Armijo Newton with terminal-root guard

```text
policyId:
  main-wire-normal-adult-passive-equilibrium-component-energy-terminal-root-guard-v3
d = -inverse(H_tilde) * g_tilde
rhs_b = 1e-4 * 2^(-b) * E0 * dot(g_tilde,d)
```

For each wall in order `[LVFW,SEP,RVFW]`, the policy evaluates
`TwoDiff(U_trial_w,U_current_w)`. It grows the resulting six terms in the
literal order
`[hi_LVFW,lo_LVFW,hi_SEP,lo_SEP,hi_RVFW,lo_RVFW]` with error-free `TwoSum`,
then inserts `-rhs_b` with the same grow operation. The sign of the
highest-index nonzero component is the comparison owner. The ordinary Armijo
candidate passes exactly when that sign is nonpositive. Non-finite arithmetic,
nonnegative `rhs_b`, and a zero-coordinate step are inadmissible.

There is one additional comparator-only decision at `b=0`. If the exact
component-energy Armijo test rejects, the full-step trial may be accepted as
`terminal-root-guard` only when all of the following are true:

- both trial coordinates are finite and at least one coordinate bit changes;
- the trial is in the declared geometry domain;
- every candidate field is finite;
- `max(abs(g_tilde_trial)) <= 1e-10`; and
- `lambda_min(H_tilde_trial) > 1e-10`.

No ULP count, energy floor, rounded energy decrease, relative energy
tolerance, later backtrack, or near-convergence force threshold is part of the
guard. A guarded trial that is not already a valid terminal root is rejected.

### Policy C: residual-merit Levenberg-Marquardt

```text
policyId:
  main-wire-normal-adult-passive-equilibrium-residual-lm-v3
phi(q) = 0.5 * dot(g_tilde(q), g_tilde(q))
A = transpose(H_tilde) * H_tilde
b = -transpose(H_tilde) * g_tilde
```

At the first nonterminal iteration:

```text
mu = 1e-3 * max(A_00, A_11)
nu = 2
```

Strict positive definiteness guarantees a positive finite diagonal. The state
`(mu,nu)` carries across accepted updates. For damping attempt `j=0,...,28`:

```text
d = inverse(A + mu I) * b
q_trial = q + Dq * d
predicted = 0.5 * dot(d, mu*d + b)
rho = (phi(q) - phi(q_trial)) / predicted
```

The first finite, domain-valid, strictly stable trial with a changed
coordinate, `predicted > 0`, and `rho > 0` is accepted. After acceptance:

```text
mu = mu * max(1/3, 1 - (2*rho - 1)^3)
nu = 2
```

After rejection:

```text
mu = mu * nu
nu = 2 * nu
```

A non-finite `mu`, `nu`, direction, predicted reduction, or ratio rejects the
attempt; exhaustion of 29 damping attempts fails the stage. No trust-region
policy, second regularizer, gradient-descent fallback, or adaptive threshold is
included.

## Fixed comparison corpus

The corpus is fixed before any V3 normal-adult evaluation. Normal-adult cases
may not be discovered by a scan and then added to the ranked set.

### Manufactured mandatory cases

1. `quadratic-spd`: a two-coordinate positive-definite quadratic with an exact
   zero root; all three policies must reach the terminal gates.
2. `near-flat-quartic`: one weak quadratic-plus-quartic coordinate and one
   unit quadratic coordinate; all three policies must converge without a
   threshold change.
3. `magnitude-imbalanced`: a strictly stable quadratic whose two scaled
   coordinates differ materially in curvature; all three policies must reach
   the same root cluster.
4. `large-energy-offset-family`: identical gradient/Hessian fields with wall
   energy offsets `{0,1e8,1e16}` J; residual decisions must be offset invariant,
   and the terminal guard may act only when its strict root gates pass.
5. `saddle-control`: a force-zero point with a negative Hessian eigenvalue;
   all three policies must reject it as not strictly stable.
6. `constant-residual-control`: finite stable Hessian fields with no reduction
   in residual merit; no policy may report a root.

Manufactured tests also cover non-finite values, singular matrices,
bit-unchanged trials, one-ULP coordinate changes, exact component-energy
comparison orientation, LM gain-ratio rejection, 48-update exhaustion, and
policy-ID substitution.

### Normal-adult ranked cases

Reference volumes and bounds are fixed in cubic metres:

```text
Vref = { LV: 144.4e-6, RV: 155.8e-6 }
Vmin = { LV:  53.2e-6, RV:  66.5e-6 }
q_loaded = { V_S: 42e-6, y: 0.033 }
```

Each policy first solves the reference point from `q_loaded`. Each nonreference
target then starts from that policy's own reference root and traverses an
independent 32-stage diagonal homotopy:

```text
V_k = Vref + (k/32) * (Vtarget - Vref), k=1,...,32
```

The ranked target set is the 4 by 4 inward neighbourhood formed by independent
fractions

```text
f_LV,f_RV in {0, 1/32, 2/32, 4/32}
Vtarget_LV = Vref_LV - f_LV*(Vref_LV - Vmin_LV)
Vtarget_RV = Vref_RV - f_RV*(Vref_RV - Vmin_RV)
```

The reference case `(0,0)` is evaluated once and reused only as the declared
root for the other 15 independently solved lineages. Neighbouring targets do
not seed one another.

### Archive-derived diagnostic cases

These cases are reported separately and never enter ranking or threshold
selection:

1. literal midpoint homotopy target `LV=98.8e-6`, `RV=111.15e-6`;
2. canonical indexed midpoint homotopy target constructed as
   `Vmin + (16/32)*(Vref-Vmin)` in binary64;
3. archived midpoint stage-2 state with
   `LV=141.55000000000003e-6`, `RV=153.009375e-6`, seeded at
   `V_S=37.30367803529229e-6`, `y=0.03399501819258049`;
4. reference-volume seed `q_loaded + Dq*[0,+0.25]`; and
5. reference-volume seed `q_loaded + Dq*[+0.25,+0.25]`.

The two midpoint decimal constructions remain distinct even if their later
homotopy stages round to the same values. The diagnostic report compares
failure class, terminal force, stability, accepted updates, and candidate
evaluations. It does not overwrite or upgrade the archive result.

## Engineering comparison and result policy

A policy passes a case only when the returned terminal candidate satisfies all
point-local terminal gates. A nonreference homotopy passes only when all 32
stages pass in order. Failures retain the completed prefix, failed stage,
reason, and terminal candidate when available.

The Engineering leader is determined only from the manufactured mandatory set
and the 16 normal-adult ranked cases, in this order:

1. reject a policy that violates any manufactured expected outcome;
2. maximize the number of completed normal-adult ranked cases;
3. minimize total candidate evaluations across completed ranked cases;
4. minimize total accepted updates across completed ranked cases; and
5. break an exact tie in the fixed order residual-Armijo Newton,
   residual-LM, component-energy terminal-root guard.

Archive-derived cases cannot change the ranking. The report may publish
`engineeringLeadingPolicyId`, but must always publish:

```text
selectedPointSolverPolicyEstablished: false
officialQualificationEstablished: false
confirmatoryEligibilityEstablished: false
surfaceConstructionEstablished: false
continuousBranchEstablished: false
alternatePathAgreementEstablished: false
multiSeedRobustnessEstablished: false
globalUniquenessEstablished: false
passiveReferenceForPvaEstablished: false
edpvrEstablished: false
peEstablished: false
pvaEstablished: false
oxygenOrMetabolicClaimEstablished: false
physiologicalValidationEstablished: false
clinicalValidationEstablished: false
publicCatalogEligibilityEstablished: false
```

Point-local stable-root and primary-homotopy booleans are case-local. They may
not be generalized to a continuous surface or a global constitutive curve.

## Implementation and execution order

The work is one substantial PR but uses three commits:

1. declaration: this document and its README index only;
2. implementation: pure candidate owner, generic policy kernel, fixed corpus,
   manufactured tests, compact runner, and package/test registration; and
3. result: one compact JSON report and a human-readable result document.

Commit 1 must precede any V3 normal-adult evaluation. Commit 2 may run only
manufactured tests before it is committed. The explicit comparison runner may
run only after Commit 2 is clean and committed. It must not import or execute
the archived V2 runner or read the archived large artifact. Importing a module
must never run a normal-adult case.

The JSON report is compact, canonical-hashable, and create-only at its
requested output path. It records declaration and implementation commits,
complete policy and corpus payload hashes, per-case compact results, ranking,
and every negative claim above. It is repeatable Engineering output, not an
immutable qualification artifact and not runtime input. A later rerun must use
a different output path or explicitly remove an uncommitted local output; it
may not overwrite a committed report.

After the result commit, typecheck, the focused tests, the suite manifest, the
full fast suite, build, repository hygiene, and diff checks are required. An
independent read-only review must confirm that no historical qualification,
surface, branch, PVA, or public claim was introduced.

## Next boundary

If one policy leads without violating the declared failure and claim
boundaries, a later declaration may select it prospectively. Only after that
selection may a nonofficial 3 by 3 or 5 by 5 local passive-surface pilot be
designed. That pilot remains solver-development evidence; it is not yet a
passive reference for PVA.
