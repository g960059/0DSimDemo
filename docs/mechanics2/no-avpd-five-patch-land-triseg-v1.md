# No-AVPD five-patch Land--TriSeg V1

## Purpose and claim boundary

This is a clean research-sidecar model class. It does not replace `ModelCore`
or any browser-visible runtime. It is a structural redesign of the V2
heterogeneous LA-Land/four-Hill comparator, not another parameter fit of that
trajectory. The V2 implementation and its artifacts remain immutable
comparators.

The four chambers are represented by five myocardial material patches:

```text
LA, RA, LV free wall, interventricular septum, RV free wall
```

The ventricular free walls and septum interact through algebraic TriSeg. The
atria use one-fiber chamber geometry. The closed circulation retains systemic
and pulmonary arterial and venous compartments and all four valves. No dynamic
AV-plane coordinate is present. AVPD, MAPSE, TAPSE, and tissue-Doppler
observables are deferred observers.

The prescribed free-calcium drivers are report-only forcing families. They are
not calcium-cycling models and have not been jointly calibrated with this
five-patch closed loop. The initial parameter priors are not a normal-human or
patient fit.

## Source anchors and what is reused

- The ventricular active branch is anchored to Land et al., *A model of cardiac
  contraction based on novel measurements of tension development in human
  cardiomyocytes*, DOI
  [`10.1016/j.yjmcc.2017.03.008`](https://doi.org/10.1016/j.yjmcc.2017.03.008).
  This implementation reuses its active calcium-regulation and cross-bridge
  formulation and source parameter prior, not its complete passive and cellular
  viscoelastic material.
- The atrial active prior is anchored to Land and Niederer, *Influence of atrial
  contraction dynamics on cardiac function*, DOI
  [`10.1002/cnm.2931`](https://doi.org/10.1002/cnm.2931). It is likewise used as
  an active-branch prior, not as evidence that the composite 0D chamber law is
  literature-calibrated.
- Ventricular geometry and three-wall interaction are anchored to the TriSeg
  construction of Lumens et al., DOI
  [`10.1007/s10439-009-9774-2`](https://doi.org/10.1007/s10439-009-9774-2).
  The five-patch default does not claim that the original representative-
  tension equation is an exact generalized-force law for an arbitrary fiber
  material. Instead it retains the TriSeg spherical-cap geometry and solves
  explicit LV free-wall, septal, and RV free-wall equilibrium using the chosen
  material's generalized virtual power
  \(\sum_w V_w\sigma_{f,w}\,\partial\varepsilon_{f,w}/\partial q\). The
  original representative-tension mapping remains an explicit comparator.

All equilibrium-passive coefficients, parallel-SLS coefficients, prescribed
calcium waveform parameters, chamber geometry seeds, and macro homogenization
scales introduced here remain explicit engineering priors. Their envelope is a
model-class stress test; the citations above do not convert those quantities
into literature measurements.

## Shared material interface

Every patch uses the same constitutive topology,

\[
\tau_p = \tau_{eq,p}(\varepsilon_p) + h_p\,\tau_{Land,p}(\mathbf{x}_p,Ca_p,\lambda_p,\dot\lambda_p) + q_p,
\]

\[
q_p^{n+1}=
\frac{q_p^n+E_{ve,p}(\varepsilon_p^{n+1}-\varepsilon_p^n)}
{1+\Delta t/\tau_{ve,p}}.
\]

Natural fiber strain and Kirchhoff fiber stress are the work-conjugate pair.
The equilibrium passive branch owns the long-time stored energy. The one-state
parallel Maxwell arm owns only finite-time passive memory. It reports stored
energy, physical relaxation dissipation, and backward-Euler numerical
dissipation separately.

The Land branch owns active calcium regulation, cross-bridge population, and
cross-bridge distortion history. The explicit positive dimensionless
`activeHomogenizationScale` (h_p) maps cellular Land wall stress to effective
macro-tissue stress. Its default is one. It scales both transmitted stress and
the corresponding composite work readbacks; it does not change the source Land
parameter pack, kinetics, or (T_{ref}). The first envelope shares this scale
within the atrial pair and within the three ventricular patches instead of
fitting five independent gains. No external active SEE, post-hoc Hill
force--velocity multiplier, hidden adapter gain, or tension filter is added.
The passive/viscoelastic branch from the complete Land paper model is not
duplicated; only the active Land equations are used here.

The law is shared, but its priors are not pooled across all walls. LA and RA use
an atrial Land--Niederer literature prior for the **active branch only**. LV
free wall, septum, and RV free wall use the intact-human ventricular Land source
prior for the **active branch only**. Equilibrium-passive parameters, reference
shifts, SLS modulus/time constants, and homogenization scales are explicitly
labelled engineering seeds; the whole composite material is not claimed as a
literature-calibrated parameter set. Wall-specific geometry and explicit
macro-scale parameter groups remain visible. A parameter identity change
requires an independent cold initialization.

The default ventricular cold geometry is obtained from fixed-volume passive
TriSeg re-equilibration. The three ventricular SLS arms then start with exactly
zero overstress at that equilibrated geometry; the atrial SLS arms start with
zero overstress at their fixed-volume one-fiber cold geometries. Land states are
initialized at the prescribed diastolic free-calcium concentration, so a
nonzero basal Land active stress may remain. That basal component is reported
as a limitation and is not folded into the passive equilibrium solve or
silently cancelled.

## Nested SLS structural arms

The SLS branch is present in the state topology from the first implementation,
but nonzero viscosity is not assumed to be necessary for every patch. The
predeclared structural arms are:

1. `sls-off`: \(E_{ve}=0\) in all five patches;
2. `atrial-sls`: nonzero LA/RA branches and zero ventricular branches;
3. `all-patch-sls`: nonzero branches in all five patches.

The same unit-cube parameter point and protocol ID must be used across all
three arms. SLS magnitude is never optimized directly against LA PV loop area.
A disabled branch requires exactly zero accepted overstress.

## Non-local envelope contract

The first exploration is a deterministic space-filling envelope, not a local
optimizer or a hand-selected one-factor screen.

- A fixed maximin Latin-hypercube design supplies 64 unit-cube points.
- Atrial and ventricular kinetic/material quantities use grouped physiological
  priors rather than five independently fitted micro-parameter sets.
- Positive scales and time constants use declared log transforms.
- Every candidate and protocol starts from a new cold state.
- Cross-candidate and cross-parameter warm starts are forbidden.
- Structural arms share the same unit points and scenario manifest.
- Validation and time-step-refinement subsets are selected by fixed design
  index before results are observed.
- The runner exposes no objective function, gradient, winner ranking,
  best-candidate warm start, or score-guided resampling path.

The predeclared scenario matrix includes HR 50/60/75/100 and independent low
and high total-blood-volume, systemic-resistance, and pulmonary-resistance
challenges. Blood-volume changes are assigned only to the two compliant venous
reservoirs with a fixed 60:13 systemic:pulmonary allocation; preload is an
emergent result and is not prescribed directly. Initial compute may be sharded,
but shard assembly verifies exact membership plus per-run normalized-content,
candidate, protocol, implementation, harness, initial-state, request, and
parameter-identity hashes. Every persisted run also embeds the complete fixed
settle-and-assess schedule, the fixed `1e-4` full-state normalized return-map
tolerance, and the explicit repository-local implementation source manifest.
The implementation manifest is checked for transitive closure over every
repository-local static import before its combined source hash is recorded.

The preliminary readiness plan has 3 runs. Separately, the committed full plan
has 696 runs: 192 screening runs, 480 fixed stress-validation runs, and 24
fixed time-step-refinement runs. Screening, stress-validation, and
time-step-refinement runs retain the last two complete raw cycles and the last
three exact cycle-boundary full states. A failure additionally retains the
partial current-cycle ring. Readiness runs retain one raw cycle because their
one-beat purpose is numerical only. This bounds storage without hiding failed
trajectories. The two consecutive full-state return maps are reported when
three boundaries exist. Periodicity is evaluated only against the predeclared
`1e-4` tolerance: both maps must pass after a completed 32-beat run. The
tolerance is not a caller or CLI setting.

The full CLI executes the canonical plan in its fixed order and atomically
persists each completed run before starting the next. It then releases that
run's full payload and retains only a compact execution summary in memory.
There is intentionally no resume, skip-existing, retry-selection, or
outcome-adaptive stopping mode: an existing coordinate file is recomputed and
replaced, and a numerical failure is retained before execution continues to
the next predeclared coordinate. Deterministic sharding is available for
compute distribution, but it cannot change membership or order within a shard.
The CLI deliberately rejects the obsolete `--periodicity-tolerance` option;
its help text reports the fixed 32-beat/`1e-4` protocol instead of presenting
an override knob.

### Complete screening inspection

After the exact 192-run screening phase has been persisted to one flat
directory, it can be assembled and inspected without selecting a candidate:

```bash
npm run run:no-avpd-five-patch-model-envelope-screening-v1
npm run render:no-avpd-five-patch-model-envelope-screening-v1
```

The renderer revalidates every persisted artifact and the exact canonical
64-index x 3-arm screening assembly. It writes a compact JSON summary and a
standalone interactive HTML view. Counts remain separated by structural arm;
the table remains in canonical plan order. A point or row opens only the
retained raw LA blood-volume PV path; pulmonary-venous and mitral flows;
pulmonary-vein, LA, and LV pressures; mitral pressure gradient/open fraction;
LA fiber strain and its accepted-step backward-difference rate; and a simple LV
pressure-rate/positive-decay trace for that coordinate. LA pressure is also
split into equilibrium-passive, effective Land-active, SLS-overstress, and
total contributions through the same one-fiber work-conjugate map used by the
cavity equation. These additions are readbacks only and add no material state
or pressure source. Raw endpoints are joined by straight segments without
smoothing or resampling. The LV pressure-decay trace is not a fitted relaxation
time constant.

Matched-volume reservoir-minus-conduit pressure-component subtraction is
explicitly deferred. The retained raw endpoints generally do not contain exact
equal-volume pairs across those two paths; this V1 renderer neither interpolates
nor substitutes nearest-neighbour pairs. The component traces remain available
so a later, predeclared matched-volume method can be evaluated without silently
changing this screening contract.

True A/V lobe areas remain report-only geometric readbacks. The HTML suppresses
their morphology display unless the fixed settle-and-assess protocol marks the
run `evaluationEligible`; incomplete or unsteady runs remain available for
clearly warned raw numerical trace inspection. The renderer contains no score,
ranking, winner selection, physiology gate, fallback imputation, or
outcome-dependent ordering. V-lobe area is not a gate.

### V-lobe structural interpretation

In the atrial one-fiber geometry, fiber strain and the stress-to-pressure
factor are single-valued functions of LA blood volume. Therefore, at a matched
volume on reservoir and conduit paths, the equilibrium-passive contribution is
identical and cancels. The pressure separation has the form

\[
\Delta P_{R-C}(V)
=g(V)\left[h\,\Delta\sigma_{Land}+\Delta q_{SLS}\right].
\]

Equilibrium passive stiffness can change the operating pressure and slope, but
cannot by itself create a V lobe. Land history and the parallel-SLS overstress
are the direct branch-memory terms in this fixed-shape, zero-external-pressure
model. Pulmonary-venous inflow, mitral outflow, and LV relaxation remain
important because they determine when and how fast the same LA volumes are
revisited and therefore alter those histories. The three SLS arms are an
ablation of passive memory ownership, not an assumption that SLS is necessary
or sufficient for a physiological V lobe. The SLS-off arm can form a lobe from
atrial Land state history alone.

The V-lobe area is a projection of the complete periodic state trajectory into
the LA pressure--volume plane. It is not, in general, the energy dissipated by
the passive SLS branch: active work, blood transport, and any future external
or shape work also contribute to a closed-loop cavity PV projection. Passive
SLS dissipation is therefore reported from its constitutive balance and is not
inferred from geometric lobe area.

Accordingly, a near-zero V lobe in the SLS-off arm after periodic settling is
not by itself surprising. A near-zero lobe throughout the periodic,
one-true-crossing candidates in both SLS-enabled arms would be a negative
model-class result for this declared prior region, not a request to fit an area
correction. It would not yet falsify every no-AVPD Land--SLS model: this V1
screen holds pulmonary-vein compliance, PV-to-LA resistance/inertance, mitral
macro impedance, and LA reference geometry fixed. The next falsification
experiment, if required, must be a separately preregistered global envelope
over those load and geometry axes. Only if memory and filling/emptying are both
present yet branch separation remains absent should a work-conjugate atrial
longitudinal/shape coordinate be promoted as a structural comparator. That
comparator must not restore a single reversible AV-plane piston whose motion is
projected strongly into the entire atrial volume law: such a coordinate can
lower LAP during systolic descent yet raise the matched-volume conduit branch
during recoil. A future geometry comparator instead requires an independently
observable non-self-similar atrial shape mode, with its pressure feedback
derived work-conjugately and constrained by motion data.

## Evaluation policy

The implemented per-run hard gates are limited to numerical and physical
contracts:

- every requested step accepted and finite;
- positive blood-compartment volumes and exact closed blood-volume ledger;
- Land population conservation, nonnegative populations, and no projection;
- active stress work-map residuals;
- SLS balance and nonnegative physical/numerical dissipation;
- full-fiber TriSeg generalized-force equilibrium residuals.

The protocol predeclares a `1e-4` full-state normalized return-map tolerance.
The runner reports `established` or `not-established` against that immutable
value, but that classification does not silently rewrite the run's
numerical-completion status. The paired fixed-dt coordinates are also
implemented, while their cross-dt comparison and any model-class acceptance
rule remain a planned assembly-stage diagnostic. Until that comparator is
committed, neither periodicity nor dt refinement is a hard model-class gate.

The first implemented report-only vector contains unsmoothed chamber PV paths,
chamber pressures, valve/venous flows, prescribed-calcium anchors, raw
early/post-Ca local maxima in mitral flow, pressure-gradient crossing proxies,
global ventricular volume-excursion fractions, material stress decomposition,
and the full-state return map. It deliberately does not label those local
maxima as physiological E/A or call volume excursion an ejection fraction.
Cross-boundary x/v readbacks are suppressed until periodicity is established.

The implemented report-only LA readback now includes true-polyline A/V lobe
areas, signed orientation, and crossing topology. Later physiology evaluation
may add matched-volume branch ordering and component gaps, RA PV lobes,
a/v/x/y timing and depth, mitral/tricuspid E/A with interpeak valley,
pulmonary-vein S/D/Ar, event-aligned LV/RV ejection fraction, septal geometry,
valve reverse-flow burden, cardiac output, and chamber/vascular pressures. That
larger vector must remain report-only until its event definitions and human
reference envelopes are independently committed; it must not be collapsed into
a weighted shape score.

Model classes are compared by the fraction and connectedness of their
physiologically viable prior region across held-out scenarios. A narrow
best-fitting point is not acceptance evidence. Patient fitting, if added later,
must vary a small set of macro parameters while retaining independently
constrained cellular and tissue priors.

## Current numerical readiness evidence

At the fixed maximin-LHS index 0 and `hr60-reference`, all three structural arms
completed 200/200 steps at 5 ms from independent cold starts. Each artifact
retains 200 raw endpoints. Because this readiness protocol requests only one
cycle, it has fewer than two post-start exact cycle boundaries and makes no
periodicity or morphology claim. With the full-fiber generalized-force mapping,
the engineering-seed cold cycle requires fresh-Jacobian full Newton and a bound
of 80 iterations; it completes in 42 iterations at the difficult late
atrial/MV-transition step. Reusing one accepted-update Jacobian stalls at that
same finite constitutive state. This is a solver policy, not a material or
physiology parameter adjustment, and no Jacobian is carried across global time
steps.

The separately predeclared bounded preflight uses only the four fixed quartile
indices 0/16/32/48, not all 64 screening candidates. Its 12 combinations
(4 indices x 3 arms) completed their first 5 ms step. This is initialization
coverage only. It must not be reported as completion of the 192-run screening
phase.

An exhaustive construction test separately cold-initializes the complete
3-arm x 64-point x 10-scenario Cartesian envelope (1,920 initial states) and
verifies the canonical parameter identity and full-fiber mapping. It performs
no time marching and is therefore an initialization-contract check, not
evidence that all 696 committed time-domain runs will complete.

## Fixed HR60 screening evidence

The complete predeclared HR60 screening phase has now been executed from the
source-frozen implementation and assembled from exactly 192 independently
cold-started artifacts. Exact membership, normalized artifact hashes,
parameter identities, protocol hashes, and implementation/source closure were
revalidated before rendering. The assembly normalized SHA-256 is
`4c5a2d61e91de37c117e540661c64da6cca3175f9d0c83ba0e338da3a894dd9a`.

| structural arm | total | 32-beat complete | numerical failure | periodic | periodic + measurable true A/V lobes |
| --- | ---: | ---: | ---: | ---: | ---: |
| SLS off | 64 | 19 | 45 | 2 | 0 |
| atrial SLS | 64 | 22 | 42 | 2 | 1 |
| all-patch SLS | 64 | 19 | 45 | 2 | 1 |

Across all arms, 60/192 runs completed 32 beats and 132/192 ended as retained
numerical failures: 61 at a global line-search failure and 71 at the fixed
maximum Newton iteration count. Only six runs met both fixed full-state return
maps at `1e-4`. The two periodic SLS-off runs had multiple or degenerate
self-intersections, so neither supplied a measurable two-lobe topology.

The only periodic, one-true-crossing coordinate was the same fixed LHS index
24 in both SLS-enabled arms:

| arm at LHS 24 | return maps | A-lobe area (mmHg mL) | V-lobe area (mmHg mL) | unbounded A/V ratio |
| --- | --- | ---: | ---: | ---: |
| atrial SLS | `6.891e-5`, `5.494e-5` | 101.882 | 1.132 | 90.04 |
| all-patch SLS | `6.888e-5`, `5.492e-5` | 101.867 | 1.128 | 90.34 |

At that same coordinate, SLS-off completed all 32 beats but missed periodicity
with return maps `1.663e-4` and `1.340e-4` and retained two self-intersections.
Thus atrial SLS changed periodic stability and projected topology at this
coordinate, while adding ventricular SLS produced essentially no additional
V-lobe area. The measurable V lobe remained very small relative to the A lobe.
This isolated coordinate is not a connected viable prior region and is not a
normal-human fit, preferred arm, or physiology acceptance result.

Raw geometric lobes were measurable in 2/64 SLS-off, 14/64 atrial-SLS, and
13/64 all-patch artifacts, but all except LHS 24 in the SLS-enabled arms were
unsteady or incomplete. They remain selectable in the interactive artifact for
diagnosis and are excluded from steady-state morphology display. In particular,
an unsteady lobe is not converted into evidence by averaging areas or relaxing
the return-map tolerance after observing the result.

The remaining 504 predeclared time-domain coordinates (480 stress-validation
and 24 dt-refinement runs) have not been executed. No held-out HR/load
viability, connected viable region, physiology envelope, or structural winner
is claimed.

## Model-class boundary

The initial canonical candidate is the five-patch Land topology above. The
existing proper Hill CE--SEE model remains a control. Arts 2024 is a separate,
source-faithful future active-material backend; it must replace the complete
active branch rather than being added to Land. Parameter and state ownership
must be audited before an Arts active law is combined with any external tissue
passive or viscoelastic branch.
