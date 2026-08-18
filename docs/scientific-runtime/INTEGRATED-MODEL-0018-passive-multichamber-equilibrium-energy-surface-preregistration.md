# Passive multichamber equilibrium-energy surface V1 preregistration

Status: declared before the first normal-adult surface construction or
verification result

## Decision

The next analysis owner is a pure equilibrium-passive state function. It is
not obtained by stopping the dynamic model, setting calcium to zero, or
relabeling an end-diastolic event locus. It is constructed directly from the
five fixed equilibrium-passive constitutive energies and the existing
energy-conjugate chamber geometry.

This work is analysis-only. It does not mint a numerical model ID, change the
Standard-63 exact artifact, add a live Output or Graph, or reopen the failed
periodic mechanical-energy V1 admission recorded by
[INTEGRATED-MODEL-0017](INTEGRATED-MODEL-0017-periodic-five-wall-mechanical-energy-corrective-result.md).

The two immutable analysis owner identities are:

```text
passive-multichamber-equilibrium-energy-surface-myocardium-v1
passive-multichamber-equilibrium-energy-surface-pericardium-inclusive-v1
```

Each pericardium-inclusive surface **instance** is identified by the inclusive
owner ID, the myocardium-only owner/binding, and the canonical SHA-256 of one
full named common-pericardium binding snapshot. A nullable
`includePericardium` flag is not an identity boundary.

## Scientific boundary

Included:

- the Moyer-derived atrial equilibrium-passive stored energy, stress, and
  tangent already fixed by the normal-adult prior;
- the ventricular equilibrium-passive stored energy, stress, and tangent
  already fixed by that prior;
- the existing self-similar atrial geometry;
- the existing finite-thickness, energy-conjugate TriSeg geometry;
- the selected finite-stage stable-root TriSeg internal-equilibrium lineage;
  and
- in the inclusive variant only, the separately owned conservative common-bag
  pericardial energy.

Excluded:

- Land active stress or a Land thermodynamic potential;
- parallel-SLS stress, state, stored energy, or dissipation;
- calcium, rhythm phase, time, `dt`, accepted state, or checkpoint;
- circulation, valves, coronary coupling, intrathoracic pressure, and vascular
  pressure;
- the TriSeg `frozenMaterialStateMembranePotentialJ`, which is explicitly a
  frozen-stress virtual potential rather than constitutive stored energy; and
- any fitted EDPVR, PE, PVA, MVO2, ATP, efficiency, or clinical-normal claim.

The Klotz relation used in the fixed construction constrains an organ-scale LV
EDPVR; it does not uniquely identify a tissue law. The Moyer source is a human
LA construction and remains an explicit extrapolation boundary for the RA.
The original TriSeg literature supports ventricular interaction through a
shared septum and junction force equilibrium, but the code-owned geometry and
constitutive identities are the numerical owners for this analysis.

Primary background:

- Lumens et al., 2009, DOI
  [`10.1007/s10439-009-9774-2`](https://doi.org/10.1007/s10439-009-9774-2);
- Klotz et al., 2006, DOI
  [`10.1152/ajpheart.01240.2005`](https://doi.org/10.1152/ajpheart.01240.2005);
- Moyer et al., 2015, DOI
  [`10.1007/s10439-015-1256-0`](https://doi.org/10.1007/s10439-015-1256-0).

## Mathematical definition

Let

```text
V = (V_LA, V_LV, V_RA, V_RV)
q = (V_{m,S}, y_m)
```

where `q` contains the septal midwall cap volume and common junction radius.
For the fixed normal-adult material condition,

```text
U_myo(V, q)
  = sum_wall V_wall * psi_eq,wall(e_wall(V, q))
```

All scalar energy reductions use the frozen orders
`(LVFW,SEP,RVFW)` within the ventricular component,
`(LA,LVFW,SEP,RVFW,RA)` for a direct five-wall total, and
`(LA,ventricles,RA)` for factorized assembly. The same ordered scalar owners are
reused for raw total energy, reference subtraction, projection, and sealing;
equivalent regrouping is not permitted.

The atrial strains do not depend on `q`. At fixed ventricular volumes, the
analysis selects `q†(V_LV,V_RV)` through the frozen finite-stage homotopy
lineage from the loaded normal anchor and requires

```text
gradient_q U_myo = 0
H_qq is positive definite
```

The owner deliberately calls this the **deterministically selected local
stable-root homotopy lineage**. Deterministic homotopy and alternate-path
agreement can qualify sampled roots numerically; they do not prove a continuous
branch between stages, a global minimum, or global uniqueness.

The myocardium-only reduced energy is

```text
Phi_myo(V)
  = U_myo(V, q†(V_LV,V_RV)) - U_myo(V_ref, q†(V_ref,LV,V_ref,RV))
```

and factorizes exactly under the present topology:

```text
Phi_myo(V)
  = Phi_LA(V_LA)
  + Phi_ventricles(V_LV, V_RV)
  + Phi_RA(V_RA)
```

The reference is the fixed component gauge anchor:

```text
V_ref = { LA: 35.72, LV: 144.4, RA: 47.31, RV: 155.8 } mL
```

Both raw constitutive stored energy and reference-relative energy are retained.
Only differences of the latter are interpreted; the subtraction fixes a gauge
and does not alter pressure.

The equations define the point-local owner. V1 numerical eligibility is
limited to the frozen sampled points and declared verification paths below. It
does not establish existence, uniqueness, or differentiability of one branch
at every unsampled point of the continuous Cartesian box.

For one explicit common-pericardium binding,

```text
Phi_inclusive(V)
  = Phi_myo(V)
  + Psi_peri(sum_i V_i + sum_wall V_wall + V_fluid)
  - Psi_peri(reference occupied volume)

P_inclusive = P_transmural + p_peri * 1
H_inclusive = H_myo + k_peri * 1 * 1^T
```

This pressure is relative to the common intrathoracic reference. It is not
called absolute intravascular pressure.

## Sign and canonical units

The work convention is

```text
dPhi = sum_i P_i dV_i
```

Positive pressure and positive volume increment therefore represent positive
work done by a chamber on the passive wall/constraint.

Canonical numerical units are:

- volume: `m3`;
- stored energy: `J`;
- pressure: `Pa`;
- pressure-volume tangent: `Pa/m3`.

Clinical-unit conversion is presentation-only and is excluded from all
qualification gates. This prevents the currently mixed rounded mmHg constants
elsewhere in the repository from entering the state-function verification.

## Declared component domain and factorized axes

The V1 component-wise input bounds are:

```text
LA: [35.72, 80.18] mL
LV: [53.2, 144.4] mL
RA: [47.31, 98.04] mL
RV: [66.5, 155.8] mL
```

This box is not claimed to contain only simultaneously physiological whole-heart
states. It is the Cartesian product of fixed construction anchors.

The frozen axes are:

- 33 LV values from 53.2 to 144.4 mL in 32 equal indexed intervals;
- 33 RV values from 66.5 to 155.8 mL in 32 equal indexed intervals;
- 33 LA values: 16 indexed intervals from minimum to pre-A and 16 from pre-A
  to maximum;
- 33 RA values constructed by the same minimum/pre-A/maximum rule.

Every value is computed directly from the indexed endpoint formula rather than
by repeated floating-point addition. The unique numerical construction is a
`33 x 33` biventricular surface plus two 33-point atrial slices: 1,155 points,
not a dense four-dimensional grid. A 3-by-3-by-3-by-3 anchor lattice at axis
indices `{0,16,32}` is assembled twice: once by a direct full five-wall point
evaluation and once from the three canonical component records. At all 81
anchors, reference-relative energy, four pressures, and the reduced
four-chamber tangent must be canonical-value identical under the frozen
`LA,ventricles,RA` assembly order. This gate also requires exact-zero atrial
cross blocks, one and only one SEP contribution, and exact named chamber/index
mapping. One index, wall, or block-mapping tamper must fail the gate.

The official claim is complete coverage of the 1,155 frozen samples and the
declared audit paths, not continuous-box coverage. One required sampled point
outside the input bounds, outside the Moyer supported strain range, or without
a qualified internal equilibrium fails closed. No failed point may be deleted
after inspection to narrow the sampled claim.

## Internal-equilibrium protocol

Each ventricular point owns an independent deterministic continuation from the
loaded reference anchor. A neighbouring grid result is never an implicit
scientific seed.

The prior's loaded TriSeg coordinates are a deterministic seed and coordinate
scale only; they are not assumed to be the passive-equilibrium root. The fixed
8 mmHg construction anchor is retained as characterization and is not an
admission target that the new solve is forced to reproduce.

The solver and verification policies have the literal identities:

```text
main-wire-normal-adult-passive-equilibrium-point-solver-policy-v1
main-wire-normal-adult-passive-equilibrium-branch-policy-v1
main-wire-normal-adult-passive-equilibrium-surface-verification-policy-v1
```

The component reference root is solved first from the prior's loaded
coordinates and must itself be a strict local stable equilibrium. That one
sealed root is the common stage-0 source for every primary point. For target
`(LV_t,RV_t)`, the primary 32-stage diagonal homotopy is

```text
LV_k = LV_ref + (k / 32) * (LV_t - LV_ref)
RV_k = RV_ref + (k / 32) * (RV_t - RV_ref)
k = 1, ..., 32
```

The internal solver is a scaled damped Newton minimizer. With

```text
Dq = diag(abs(42e-6 m3), 0.033 m)
E0 = 1 J
x  = inverse(Dq) * q
g~ = Dq * gradient_q(U) / E0
H~ = Dq * H_qq * Dq / E0
```

it uses:

```text
coordinate scales               = (abs(42e-6 m3), 0.033 m)
maximum Newton iterations        = 48 per stage
maximum line-search backtracks   = 28
initial line-search step          = 1
line-search contraction           = 1/2
Armijo coefficient               = 1e-4
scaled force infinity tolerance  = 1e-10
scaled update stagnation limit   = 1e-11
minimum scaled H_qq eigenvalue   > 1e-10
junction radius                  > 1e-5 m
```

At each iteration, the unregularized Newton direction is
`d = -inverse(H~) * g~`. A non-positive-definite/singular `H~` or
`dot(g~,d) >= 0` fails the stage. Candidate steps are exactly `alpha = 2^-b`,
`b = 0,...,28`, and must remain in the admissible geometry and satisfy

```text
U(q + Dq*(alpha*d)) <= U(q) + 1e-4 * alpha * E0 * dot(g~, d)
```

No Hessian shift, steepest-descent fallback, dynamic provider, calcium cold
solve, SLS relaxation, hidden spring, or unreported rescue path is permitted.
If the force tolerance has not been reached and the accepted scaled update has
infinity norm at most `1e-11`, the stage fails as stagnated. Every successful
stage, not only the terminal point, must satisfy the strict scaled-Hessian
stability gate. A failed stage is a retained point failure.

The branch audit lattice is exactly LV/RV axis indices `{0,16,32}`. From the
sealed reference root, the LV-first path takes 32 indexed LV-only stages to
`LV_t` followed by 32 indexed RV-only stages to `RV_t`; the RV-first path
reverses those roles. Each stage uses the same endpoint formula as the primary
path.

The same lattice uses all nine required scaled-coordinate seed offsets in the
Cartesian product `{-0.25, 0, 0.25} x {-0.25, 0, 0.25}` around the loaded seed,
with `q_seed = q_loaded + Dq * delta`.
Each seed must first solve the reference point and then traverse the primary
diagonal homotopy. No seed is excluded after evaluation: one seed failure or
more than one stable root cluster fails branch qualification. Agreement gates
are:

```text
maximum scaled-coordinate difference <= 1e-7
absolute stored-energy difference     <= 1e-10 J
scaled pressure difference            <= 1e-7
```

Here coordinate difference is
`max_i(abs(qA_i-qB_i)/Dq_i)`, and pressure difference is
`max_c(abs(PA_c-PB_c)/max(abs(PA_c),abs(PB_c),1 Pa))`.

Forward, reverse, and serpentine **collection orders** re-evaluate every point
through its own primary homotopy and compare only the sorted result payload.
They are not reverse branch paths and never seed one target from another.

This is sampled branch agreement, not a proof of global uniqueness.

## Point-owner outputs

Every equilibrated point retains:

- the four chamber volumes;
- the two internal coordinates;
- five wall strains, passive stresses, tangents, and stored energies;
- raw and reference-relative total equilibrium-passive stored energy;
- four intrinsic myocardial transmural pressures;
- the raw coupled Hessian in the four ordered coordinates
  `(V_LV,V_RV,V_{m,S},y_m)`;
- the reduced four-chamber pressure-volume tangent after the internal-coordinate
  Schur complement;
- scaled stationarity, internal Hessian eigenvalues, Newton iterations,
  backtracks, and homotopy lineage; and
- all fixed prior/material/geometry identity bindings.

Provenance is split into three canonical payload hashes:

1. `passiveMaterialGeometryBindingSha256` owns the wall-to-material mapping,
   consumed passive parameters, named wall tuple `(LA,LVFW,SEP,RVFW,RA)` and
   its material volumes, atrial reference volumes, TriSeg reference areas and
   geometry identity, and the exact loaded internal-coordinate seed;
2. `pointSolverBranchProtocolSha256` owns the complete solver and branch policy
   snapshots, not only their IDs, including scales, tolerances, `V_ref`, all
   continuation schedules, seed offsets, and failure semantics; and
3. `surfaceVerificationProtocolSha256` owns the complete axes, sampling,
   factorized assembly order, audit/finite-difference/path sets, thresholds,
   pericardium-condition list, and verification policy snapshot.

The sealed stage-0 root has its own canonical digest over the reference
volumes, complete root/solver evidence, and the first two hashes. Every
ventricular point lineage must reference that exact digest. The broader
normal-adult prior hash remains source provenance but is not a substitute,
because it also contains active and SLS inputs that this surface excludes.

A point that is not equilibrated returns a versioned failure reason and solver
evidence. It does not throw away an already completed preceding stage.

## Verification gates

Numerical floors are frozen before inspecting the normal-adult target. Any
change after a target result requires a new policy ID and preregistration.

Every numerical threshold and `h`-halving trend gate is applied per condition,
per audit point, and per reported scalar/component or declared matrix pair.
Global maxima and their first-owner IDs are summaries only; maxima at two step
sizes are never compared when their owning point or component differs.

Unless a gate states otherwise, vector norm means maximum absolute component
and matrix norm means maximum absolute entry. The scaled error between like
scalars is

```text
abs(a-b) / max(abs(a), abs(b), floor)
```

with unit-specific floors `1e-12 J` for energy, `1 Pa` for pressure, and
`1e6 Pa/m3` for pressure-volume tangent. Matrix pairwise error for a reduced
chamber tangent is the maximum of that componentwise expression. Its
antisymmetry is

```text
max_ij abs(H_ij-H_ji) / max(max_ij abs((H_ij+H_ji)/2), 1e6 Pa/m3)
```

The raw coupled ventricular/internal Hessian has mixed coordinate units and is
never tested with the `Pa/m3` floor. In its ordered coordinates define

```text
D4  = diag(1e-6 m3, 1e-6 m3, abs(42e-6 m3), 0.033 m)
H4~ = D4 * H4 * D4 / 1 J
```

and test `max(abs(H4~-transpose(H4~))) /
max(max(abs((H4~+transpose(H4~))/2)),1)`.

### Owner and algebraic binding

- Atrial energy, strain, and pressure are projected directly from the existing
  pure atrial replay and must be canonical-value identical when re-evaluated.
- Ventricular pressure and internal generalized forces must reproduce the
  existing virtual-work mapping when supplied the same passive stresses.
- Total stored energy must equal the canonical five-wall sum within `1e-12 J`.
- The dimensionless raw coupled Hessian, Schur complement, and factorized
  four-chamber tangent must be finite and symmetric within `1e-12` under their
  respective scaled antisymmetry definitions. With
  `z=(V_LV,V_RV)` the reduced ventricular tangent is fixed as
  `H_zz - H_zq * inverse(H_qq) * H_qz`.
- Myocardium-only cross terms involving an atrium must be exact zero after
  canonical-zero normalization.

### Energy-gradient consistency

The frozen interior audit set is the 81-point Cartesian product of axis indices
`{8,16,24}` for LA, LV, RA, and RV. Every pericardium-inclusive condition uses
the same 81 points. Off-grid finite-difference perturbations around these points
are required verification points and use their own primary homotopy; they are
not counted among the 1,155 stored surface samples. At every point,
independently recompute

```text
D_i Phi(h) = [Phi(V + h e_i) - Phi(V - h e_i)] / (2h)
```

with `h = 0.01 mL` and `h/2`. The fine-step pressure disagreement must be at
most `1e-5` relative to `max(abs(P), 1 Pa)`. It must improve on halving unless
already below `1e-8` scaled disagreement.

### Maxwell reciprocity

At every one of the same 81 frozen interior audit points, for myocardium-only
and for each inclusive condition separately, the following three constructions
must agree:

1. the analytic full Hessian and internal-coordinate Schur complement;
2. a centered finite difference of the pressure vector; and
3. a centered second/mixed finite difference of the stored energy.

Pressure and energy Hessians use `h = 0.01 mL` and `h/2`. For diagonal entries,

```text
H_ii = [Phi(V+h*e_i) - 2*Phi(V) + Phi(V-h*e_i)] / h^2
```

and for `i != j`,

```text
H_ij = [Phi(++ ) - Phi(+-) - Phi(-+) + Phi(--)] / (4*h_i*h_j)
```

The fine-step pairwise matrix gates are:

```text
analytic Schur vs pressure finite difference <= 1e-5
analytic Schur vs energy finite difference   <= 1e-4
pressure FD vs energy finite difference      <= 1e-4
```

Each independently constructed matrix must also have scaled antisymmetry at
most `1e-6`. Let `E_AP`, `E_AE`, and `E_PE` denote the declared componentwise
pairwise errors for analytic-versus-pressure-FD,
analytic-versus-energy-FD, and pressure-FD-versus-energy-FD. Their trend gates
are fixed as

```text
E_AP(h/2) < E_AP(h), unless E_AP(h/2) <= 1e-8
E_AE(h/2) < E_AE(h), unless E_AE(h/2) <= 1e-7
E_PE(h/2) < E_PE(h), unless E_PE(h/2) <= 1e-7
```

For myocardium-only, the only nontrivial mixed pair is LV/RV. Atrial cross
entries are required to be algebraic exact zero and independently zero under
pressure finite differences; mixed differences of a large total energy are
not used to manufacture a zero through cancellation. Energy finite differences
are evaluated componentwise on the smallest owners—atrial slice,
biventricular surface, and pericardial energy—and then combined in the frozen
factor order. At an inclusive point, the Hessian constraint is called engaged
exactly when `pressureDerivativePaPerM3 > 0`. At each such point the pericardial
mixed difference must reproduce the same nonzero `k_peri` for all six chamber
pairs, and the inclusive analytic matrix must add that identical tangent to
every entry. A canonical-zero tangent point uses the structural zero identity
instead of a nonzero mixed-energy gate, even when another point in the same
condition is engaged.

### Path independence

For each of the six chamber pairs, the rectangle uses axis indices 8 and 24 for
the two varied chambers while the other two chambers remain at index 16. The
same rectangles are used for myocardium-only and every inclusive instance.
Compare each open-leg pressure integral with endpoint `delta Phi` and the
complete closed-loop integral with zero. Composite trapezoidal subdivisions
are 8, 16, and 32 per leg. `Path absolute-work variation` is the sum over all
segments of `abs(0.5*(P_left+P_right)*delta V)`.

At 32 subdivisions, every open leg and closed loop must satisfy

```text
open:   abs(integral-delta Phi) / max(leg absolute-work variation, abs(delta Phi), 1 mJ) <= 1e-4
closed: abs(loop work) / max(path absolute-work variation, 1 mJ) <= 1e-4
```

All 8/16/32 values and observed trends are retained, but strict monotonicity is
not a gate because signed quadrature error can cross zero. Forward/reverse
traversal and rotated starting vertices must give sign-reversed/equivalent
results within the same final magnitude gate. The external condition may not
change along a path.

### Pericardial additive identity

The inclusive owner is a surface family. Each condition hash binds the common
pericardium binding ID, parameter-set ID, mode, all four parameter fields, the
ordered `(LA,LVFW,SEP,RVFW,RA)` wall-volume tuple, prescribed fluid volume,
and the underlying common-pericardium/transition identities. The following
`on` bindings are three separate instance identities, result records, condition
hashes, and statuses:

- healthy-slack common bag;
- global-capacity 430 mL positive control; and
- 300 mL effusion-occupancy positive control.

Healthy-slack is the primary inclusive instance; the other two are fixed
mechanism controls, not alternative values hidden under the healthy identity.
For each instance, energy, common pressure, and rank-one tangent must reproduce
the separately owned pericardium evaluation within `1e-10` using the energy,
pressure, and tangent floors declared above. The exact-off negative control is
not a fourth inclusive instance and must equal the myocardium-only point
exactly. Wall and fluid volumes are counted once.

Eligibility is reported separately as

```text
myocardiumSurfaceVerificationQualified
inclusiveSurfaceVerificationQualifiedByCondition[conditionHash]
```

Failure of one inclusive condition does not rewrite the myocardium-only status
or another condition's result.

### Convexity status

Strict positive definiteness of `H_qq` is required for every selected internal
equilibrium. Eigenvalues of the reduced chamber Hessian are recorded.

The following statuses remain separate:

```text
potential verification qualified
sampled local convexity characterized
declared-domain global convexity proven
```

The third status is false in V1. Strictly convex material energy does not by
itself prove that the geometry-reduced chamber-volume surface is globally
convex. Sampled negative reduced-Hessian eigenvalues, if present, are retained
rather than clipped.

## Required negative controls

Before any official construction, tests must demonstrate failure for:

- one chamber-pressure sign reversal or chamber-index swap;
- `Pa`/`mmHg` or `m3`/`mL` conversion omission;
- a volume derivative taken with internal coordinates incorrectly frozen;
- omission of the internal-coordinate Schur complement;
- one perturbed off-diagonal Hessian entry;
- pericardial pressure without energy, or energy without pressure;
- double-counted wall or pericardial-fluid volume;
- nonzero exact-off pericardium;
- Land-active or SLS stress entering the passive surface;
- Moyer evaluation outside its supported strain range;
- a condition identity changed along one path; and
- a synthetic double-well mislabeled as a proven global minimum.

## Evidence and execution boundary

Implementation proceeds in this order:

1. point owner and manufactured/constitutive binding tests;
2. selected-branch solver and Schur-complement tests;
3. factorized surface and numerical verification owner;
4. tamper tests for every projection and identity binding;
5. a fixed, zero-argument official owner and create-only serializer; and
6. one official construction only after code, tests, and this declaration are
   committed in a clean worktree.

The artifact must retain completed point failures; all three complete
binding/protocol snapshots and their hashes; the sealed stage-0 root digest;
prior/material identities; runtime platform provenance; all factorized point
arrays; audit extrema and first-failure IDs; canonical SHA-256 bindings; and
negative claim flags. It must be written create-only; failed construction and
failed verification are immutable results.

Because the current common-pericardium binding has no independent parameter
hash and stores the five wall volumes as an ordered tuple, the artifact must
retain and hash its full snapshot together with an explicit named wall-order
projection. The snapshot must agree exactly with the myocardium binding.

No checkpoint is needed because this is a pure state-function construction.
Collection order is not scientific identity: points are sorted by frozen axis
indices before hashing, and forward/reverse/serpentine collections must yield
the same compact payload.

## Admission boundary

Potential analysis eligibility requires the conjunction of complete domain
sampling coverage and declared-path coverage, internal-equilibrium
qualification, owner bindings, energy-gradient consistency, Maxwell
reciprocity, path independence, tamper rejection, and canonical evidence
sealing. Pericardial additive identity is additionally required for each
condition-specific inclusive status.

Even if all gates pass, the following remain false:

```text
public live Output / Graph admission
EDPVR or passive filling-path ownership
PE / PVA / MVO2 / ATP use
mechanical or metabolic efficiency
dynamic hysteresis or SLS dissipation ownership
global minimum or global convexity proof
continuous-box branch existence / uniqueness / differentiability
physiological or clinical validation
patient specificity
clinical effusion or constrictive-pericarditis disease validation
SEP energy allocation to LV versus RV
```

The first useful public derivative of this work will be a versioned conditional
slice with every other chamber condition shown. It will not be an unqualified
`EDPVR` alias.
