# Intrinsic ventricular passive reduced-surface Engineering pilot

Status: declaration only; this document and its README index must be committed
before the first normal-adult pilot evaluation

## Decision

Residual-merit Armijo Newton is selected prospectively as the primary point
solver for one nonofficial, local, 5 by 5 intrinsic ventricular passive
reduced-surface Engineering pilot.

This selects neither a production solver nor a public passive surface. The
pilot asks a narrower question:

> On one fixed local LV-RV volume patch, do independently solved stable roots,
> the reduced passive energy, intrinsic pressures, the analytic Schur tangent,
> finite differences, Maxwell reciprocity, and refined rectangular path work
> give mutually consistent sampled evidence?

The candidate contains LVFW, SEP, and RVFW equilibrium-passive myocardium and
TriSeg geometry only. Atria, common pericardium, SLS history, active stress,
circulation, external pressure, and every clinical or PVA interpretation are
excluded.

The work remains one substantial pull request with a declaration commit, an
implementation commit, and one result commit. Normal-adult pilot evaluation is
forbidden before the declaration and implementation commits are separately
fixed.

## Prospective predecessor binding

The declaration is based on the merged V3 Engineering comparison, without
reinterpreting its result:

```text
merged predecessor commit:
  402ad89f486a9c71bd5d3134fdb1c845cdcd0cf5
comparison declaration commit:
  b5f929e20820e5cf3e7a54dc23f96e4666ed67f4
comparison implementation commit:
  a87637f6e8070b8d1eb0c0bd0d78464d4d23393f
comparison report payload SHA-256:
  d30ca8cd148affb8d5f3964769b24dacf21afc38dcfa596fc25fbb0c1d3bb433
comparison report raw-file SHA-256:
  a48c49fd1b187bd0f625d6292123f5b686b5ba99b56bb675a2fefd2dfe4cbe2b
```

The comparison established an Engineering leader only. This declaration makes
the first prospective use of that leader and does not upgrade the comparison
artifact to qualification evidence.

## New Engineering identities

```text
declarationId:
  integrated-model-0027-intrinsic-ventricular-passive-reduced-surface-pilot
pilotOwnerId:
  main-wire-normal-adult-intrinsic-ventricular-passive-reduced-surface-pilot-v1
protocolId:
  main-wire-normal-adult-intrinsic-ventricular-passive-reduced-surface-pilot-protocol-v1
reportSchemaId:
  main-wire-normal-adult-intrinsic-ventricular-passive-reduced-surface-pilot-report-v1
selectedPointSolverPolicyId:
  main-wire-normal-adult-passive-equilibrium-residual-armijo-newton-v3
candidateOwnerId:
  main-wire-normal-adult-five-wall-passive-equilibrium-ventricular-candidate-engineering-v1
```

These are Engineering identities. They do not mint a production solver,
continuous surface, global branch, EDPVR, PE, PVA, official-evidence, or public
catalog owner.

## Frozen scientific scope

The energy owner is the unchanged candidate from INTEGRATED-MODEL-0025:

```text
U(V_LV,V_RV,q) = U_LVFW + U_SEP + U_RVFW
q = [V_S,y]
z = [V_LV,V_RV]
coordinate order = [V_LV,V_RV,V_S,y]
wall order = [LVFW,SEP,RVFW]
```

At a stable internal root `q*(z)`, the reduced sampled energy is

```text
Phi(z) = U(z,q*(z)).
```

The candidate's first two raw generalized-force entries are the intrinsic
passive LV and RV pressures:

```text
P_LV = partial U / partial V_LV
P_RV = partial U / partial V_RV.
```

No new material, geometry, pressure, or raw four-coordinate Hessian formula is
introduced. The pilot consumes the candidate's energy, pressure, gradient, and
ordered analytic 4 by 4 Hessian.

The pilot owns only the generic block projection

```text
H = [[H_zz,H_zq],
     [H_qz,H_qq]]

H_red = H_zz - H_zq inverse(H_qq) H_qz,
```

in fixed `z=[LV,RV]`, `q=[VS,y]` order. A non-finite or singular `H_qq`
fails the point projection; no diagonal shift or regularization is allowed.

## Selected solver policy

The primary solver is exactly residual-merit Armijo Newton V3 from
INTEGRATED-MODEL-0025. Its coordinate scales, update limit, trial sequence,
Armijo coefficient, stationarity tolerance, stability threshold, geometry
domain, and failure semantics remain unchanged:

```text
Dq = diag(42e-6 m3,0.033 m)
maximum accepted updates per stage = 48
trial exponents = 0,...,28
alpha_b = 2^(-b)
Armijo coefficient = 1e-4
scaled-force infinity tolerance = 1e-10
minimum scaled-Hessian eigenvalue, exclusive = 1e-10
minimum junction radius, exclusive = 1e-5 m
```

No component-energy rescue, terminal-root guard, LM fallback, trust-region
fallback, neighbouring implicit seed, tolerance relaxation, or failed-point
interpolation is permitted. LM remains a separately declared future
escalation candidate only.

## Frozen 5 by 5 primary grid

Reference and minimum volumes are unchanged:

```text
Vref = {LV:144.4e-6,RV:155.8e-6} m3
Vmin = {LV: 53.2e-6,RV: 66.5e-6} m3
q_loaded = {V_S:42e-6 m3,y:0.033 m}
```

The axis fractions are exactly

```text
f in {0/32,1/32,2/32,3/32,4/32}
V_X(i) = Vref_X + (i/32)*(Vmin_X - Vref_X), i=0,...,4.
```

Point IDs use `grid-lv-i-rv-j` in LV-major, then RV-minor order. The reference
root `(0,0)` is solved once from `q_loaded`. Every other primary point begins
from that same reference root and follows its own 32-stage diagonal homotopy:

```text
V_k = Vref + (k/32)*(Vtarget - Vref), k=1,...,32.
```

No primary point may use a neighbouring grid result as its initial state. A
failed stage retains the completed prefix, failed-stage result, reason, and
available terminal candidate. Failed points are never imputed.

The primary grid is sampled qualification data only. Passing all 25 points
does not establish continuity between points, global uniqueness, or a usable
constitutive surface outside this fixed patch.

## Frozen diagnostic lineages

Diagnostic lineages are evaluated only after the 25 primary attempts and
cannot rescue a failed primary point or alter the primary result. The fixed
diagnostic targets are:

```text
center:        grid-lv-2-rv-2
LV-heavy:      grid-lv-4-rv-1
RV-heavy:      grid-lv-1-rv-4
far-corner:    grid-lv-4-rv-4
```

For each target, retain these comparisons:

1. `primary-diagonal`: the primary 32-stage lineage.
2. `lv-first`: 32 stages from reference to `(Vtarget_LV,Vref_RV)`, followed by
   32 stages to the target at fixed `Vtarget_LV`.
3. `rv-first`: the analogous RV-first two-leg lineage.
4. `neighbour-continuation`: one direct target solve starting from the primary
   root at `(i-1,j)` when `i>=j` and `i>0`; otherwise from `(i,j-1)`.
5. `reverse-return`: start at the primary target root and traverse 32 diagonal
   stages back to the reference volumes.

The first four compare target endpoints. `reverse-return` compares its
terminal reference coordinates with the independently solved reference root.
The report retains scaled-coordinate distance, absolute energy difference,
and LV/RV pressure differences for every comparable pair.

Diagnostic agreement uses fixed reporting thresholds:

```text
scaled-coordinate infinity distance <= 1e-7
absolute stored-energy difference <= 1e-10 J
LV and RV pressure absolute difference <= 1e-7 Pa
```

The observed all-diagnostics boolean is descriptive only. It cannot establish
alternate-path agreement, multi-seed robustness, a continuous branch, or
global uniqueness.

## Primary mathematical audits

All following audits are fixed before any normal-adult pilot evaluation. A
sampled positive pilot result requires every eligible primary audit below to
pass. An unevaluable audit is a failure, not a skipped pass.

### Point-local root and stability

Every primary point must complete its fixed lineage and end with:

```text
all candidate fields finite
scaled force infinity norm <= 1e-10
minimum scaled internal-Hessian eigenvalue > 1e-10
junction radius > 1e-5 m.
```

The analytic reduced Hessian must be finite. Its dimensionless scaled form is

```text
Dv = diag(Vref_LV - Vmin_LV,Vref_RV - Vmin_RV)
Hred_tilde = Dv Hred Dv / 1 J.
```

Its analytic antisymmetry gate is

```text
abs(Hred_tilde_01 - Hred_tilde_10)
  / max(max_abs(Hred_tilde),1e-12) <= 1e-12.
```

This checks the ordered projection. It is not by itself an independent
Maxwell test.

### Energy-gradient consistency

At all primary points with an interior LV index `i=1,2,3`, compare the analytic
`P_LV(i,j)` with the centred energy difference

```text
P_LV_energy_FD = [Phi(i-1,j)-Phi(i+1,j)] / (2*dV_LV),
dV_LV = (Vref_LV-Vmin_LV)/32.
```

The RV formula is analogous at `j=1,2,3`. The normalized error is

```text
abs(P_FD-P_analytic) / max(abs(P_analytic),1000 Pa).
```

Every one of the 30 axis audits must be at most `5e-3`.

### Reduced-Hessian and Maxwell consistency

At the nine interior points `(i,j)` with `i,j in {1,2,3}`, compare each
analytic reduced-Hessian column with the centred finite difference of the
corresponding analytic pressure over the primary grid spacing. Component error
is

```text
abs(H_pressure_FD-Hred)
  / max(abs(Hred),1e6 Pa/m3).
```

All 36 component errors must be at most `2e-2`.

At the same nine points, the independent pressure-FD Maxwell error is

```text
abs(dP_LV/dV_RV - dP_RV/dV_LV)
  / max(abs(dP_LV/dV_RV),abs(dP_RV/dV_LV),1e6 Pa/m3)
  <= 2e-2.
```

The analytic symmetry gate and pressure-FD Maxwell gate are separate. Passing
one cannot substitute for the other.

### Rectangular path refinement

The four fixed two-grid-step rectangles have lower index corners

```text
(0,0), (0,2), (2,0), (2,2)
```

and opposite corners `(i+2,j+2)`. Traverse each rectangle counterclockwise in
physical `(V_LV,V_RV)` coordinates. `W_coarse` uses one trapezoidal pressure
segment per side. `W_refined` splits every side at the already-solved
one-grid-step midpoint and uses two trapezoidal segments.

For each resolution define

```text
E_loop = abs(W_loop) / max(sum(abs(segment work)),1e-12 J).
```

Each rectangle passes only when

```text
E_loop_refined <= 1e-3
and
abs(W_refined) <= max(0.6*abs(W_coarse),1e-10 J).
```

The report also retains, for every refined segment, pressure work minus the
exact endpoint energy difference. Those leg residuals are diagnostics and do
not get reclassified as physical dissipation.

The loop test is a sampled quadrature/path-consistency audit. It does not
prove continuous path independence.

## Frozen pilot result rule

The positive Engineering boolean is named exactly:

```text
sampledLocalIntrinsicVentricularReducedPotentialConsistencyPassed
```

It is true only when:

1. all 25 primary point lineages pass;
2. all 25 terminal point/stability and analytic projection gates pass;
3. all 30 energy-gradient audits pass;
4. all 36 pressure-FD/reduced-Hessian component audits pass;
5. all nine pressure-FD Maxwell audits pass;
6. all four rectangular path-refinement audits pass;
7. complete protocol/source bindings and all report hashes replay; and
8. no execution or integrity exception occurs.

Diagnostic lineage agreement is retained separately and is not part of this
conjunction. No partial pass, percentage threshold, result-dependent point
exclusion, threshold revision, or failed-point interpolation is allowed.

Failure classes are fixed as `point-solve-failure`,
`strict-stability-or-projection-failure`, `energy-gradient-inconsistency`,
`reduced-hessian-inconsistency`, `maxwell-inconsistency`,
`path-refinement-inconsistency`, `source-binding-failure`, and
`execution-or-integrity-failure`.

## Compact artifact and execution governance

The implementation commit may run manufactured and synthetic polynomial
surface tests only. Those tests must cover Schur algebra, gradient and
pressure-FD orientation, Maxwell error, rectangular work orientation,
threshold boundaries, failed-point retention, hash replay, output
create-only behavior, and the 512 KiB artifact limit. They must not import a
module that evaluates the normal-adult grid at top level.

After the implementation commit is clean, the fixed zero-argument runner may
perform the normal-adult pilot exactly once and write create-only to:

```text
artifacts/passive-equilibrium/
  intrinsic-ventricular-passive-reduced-surface-pilot-v1.json
```

The runner binds the declaration commit, implementation commit, predecessor
identities, complete protocol payload/hash, candidate owner/source bindings,
selected solver policy payload/hash, all primary attempts, diagnostic
summaries, audit records, result conjunction, and negative claims.

The committed JSON must be canonical-hashable and at most `524288` bytes. It
contains the compact 25-point table, failure summaries, audit tables, hashes,
and only preselected diagnostic traces: the reference root, the four primary
diagnostic targets, and any first failure in each fixed failure class. Full
iteration traces may be emitted only as an uncommitted CI or local diagnostic
artifact and are not runtime input.

The output path is checked before any normal-adult evaluation and written with
create-only semantics. A pre-existing output fails before the runner starts.
The result is repeatable Engineering output, not official qualification
evidence and not a runtime dependency.

## Machine-readable claim boundary

The report must retain every following claim as `false`, independent of the
pilot outcome:

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

Even a passing pilot establishes only the named sampled local intrinsic
ventricular consistency boolean on the frozen 5 by 5 patch.

## Required review and next boundary

After the result commit, run typecheck, focused manufactured and replay tests,
the suite-manifest audit, the full fast suite, build, registry verification,
repository hygiene, and diff checks. An independent read-only review must
confirm the execution count, fixed point set, solver identity, Schur and
finite-difference orientation, result conjunction, artifact size, and negative
claims.

The next scientific step after this pilot is selected by its result:

- if the primary sampled audits pass, design a separate, prospectively
  declared pericardium-inclusive constrained pilot;
- if a fixed primary point fails, retain the failure and declare a separate
  solver/branch escalation experiment rather than silently invoking LM; and
- independently, characterize the mechanical ledger at 1, 0.5, and 0.25 ms
  under its own quantity-specific convergence protocol.

No PVA method is introduced by this declaration.
