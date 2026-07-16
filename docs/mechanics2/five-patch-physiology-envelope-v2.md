# Five-patch filling/relaxation physiology envelope V2

## Purpose

V2 asks a narrower question than a shape-fitting study:

> Does the fixed no-AVPD five-patch model contain a broad, numerically periodic,
> hemodynamically plausible operating region when filling, relaxation, loading,
> and valve hydraulics are varied together over a predeclared global envelope?

The immediate objective is to find and characterize an operating region in
which chamber pressures, output, ventricular volume excursion, and valve flow
are mutually interpretable. LA A/V-loop morphology is retained for visual and
quantitative diagnosis, but it is not an optimization target and cannot make a
candidate eligible.

This is a new protocol layered on the model class documented in
[`no-avpd-five-patch-land-triseg-v1.md`](./no-avpd-five-patch-land-triseg-v1.md).
It does not mutate the V1 protocol or reinterpret V1 artifacts.

The machine-readable sources of truth are:

- `data/mechanics2/protocols/five-patch-physiology-envelope-v2.json`;
- `engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeDefinitionV2.ts`;
- `engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeParameterApplicationV2.ts`.

If this document and those files disagree, the committed JSON and its runtime
validation are authoritative.

## Claim boundary

V2 remains a research sidecar. It is not adopted by `ModelCore` or any
browser-visible clinical runtime. It is not a patient fit, a normal-human
calibration, a physiology acceptance result, a structural winner declaration,
or proof of a mechanism for the LA V loop.

The fixed structural model class is:

```text
Land 2017 active-only
+ equilibrium passive elasticity
+ fixed one-state parallel SLS in all five patches
+ LA/RA one-fiber chamber geometry
+ LV-free-wall/septum/RV-free-wall TriSeg geometry and equilibrium
+ four valves and closed systemic/pulmonary circulation
```

There is no dynamic AV-plane state, independent atrial shape coordinate,
pericardium, or active series-elastic element. AVPD, MAPSE, TAPSE, and tissue
Doppler remain deferred observables. The prescribed calcium waveforms are
forcing functions, not calcium-cycling models. Land cellular parameters,
calcium peak amplitudes, and SLS parameters remain fixed in this envelope.

The active formulation is anchored to the human ventricular Land model
([Land et al. 2017](https://doi.org/10.1016/j.yjmcc.2017.03.008)) and the atrial
active prior to Land--Niederer
([Land and Niederer 2018](https://doi.org/10.1002/cnm.2931)). TriSeg geometry is
anchored to the three-wall interaction model of Lumens et al.
([DOI 10.1007/s10439-009-9774-2](https://doi.org/10.1007/s10439-009-9774-2)).
These sources motivate the model topology and priors; they do not validate the
composite 0D parameter set or the V2 screening thresholds.

## Why filling and relaxation are varied together

In this fixed-shape one-fiber atrium, matched-volume reservoir--conduit
separation cannot be assigned to equilibrium passive stiffness alone. It is a
projection of constitutive memory and the complete closed-loop trajectory.
Pulmonary-venous impedance, mitral hydraulics, LV relaxation, activation
timing, preload, and afterload determine when a volume is revisited and which
Land/SLS states are present at that instant.

Bowman and Kovacs found that normal left-heart volume is not exactly constant
through the cycle and related LA conduit volume to early LV filling
([PMID 14751859](https://pubmed.ncbi.nlm.nih.gov/14751859/)). That result
supports treating conduit behavior as a coupled filling phenomenon rather than
adding a reversible atrial pressure correction or assuming that an independent
AV-plane state is necessary for an LA figure-eight projection.

Accordingly, V2 changes a small set of identifiable macro axes together while
holding the structural model class fixed. This is a global model-class probe,
not a local continuation from the only visually promising V1 coordinate.

## Predeclared 64 x 12 envelope

A deterministic maximin Latin hypercube supplies 64 points in a 12-dimensional
unit cube. The selected seed and its minimum pairwise distance are pinned in
the protocol JSON. Simulation outcomes cannot change the design, bounds, point
membership, or execution order.

| axis | transform | range | coupled interpretation |
| --- | --- | ---: | --- |
| atrial active scale | log | 0.15--0.90 | shared LA/RA active homogenization scale |
| ventricular active scale | log | 0.80--2.50 | shared LV free-wall/septum/RV free-wall active scale |
| atrial calcium-decay scale | log | 0.40--1.20 | shared LA/RA prescribed-calcium decay time scale |
| ventricular calcium-decay scale | log | 0.45--1.25 | shared three-wall prescribed-calcium decay time scale |
| AV delay | linear | 0.12--0.22 s | atrial-to-next-ventricular onset separation in physical time |
| ventricular passive-tangent scale | log | 0.60--2.50 | shared three-wall equilibrium-passive tangent scale |
| mitral hydraulic area scale | log | 0.70--1.50 | coherent area, loss, and inertance transform |
| pulmonary-venous resistance scale | log | 0.50--2.00 | pulmonary-vein compartment to LA segment |
| pulmonary-venous inertance scale | log | 0.25--4.00 | pulmonary-vein compartment to LA segment |
| pulmonary-vein compliance scale | log | 0.50--2.00 | pulmonary venous reservoir compliance |
| blood-volume scale | linear | 0.85--1.15 | exact total-volume change assigned to venous reservoirs |
| systemic-resistance scale | log | 0.70--1.40 | systemic peripheral resistance |

The AV delay is represented in seconds and remains invariant under a change in
heart rate. Existing within-atrial and within-ventricular onset offsets are
preserved.

The single mitral axis represents one hydraulic size change rather than five
independently fitted valve coefficients. For scale \(s\),

\[
A_{open},A_{leak}\mapsto s(A_{open},A_{leak}),\qquad
R_{open},K_{Bernoulli}\mapsto s^{-2}(R_{open},K_{Bernoulli}),\qquad
L_{open}\mapsto s^{-1}L_{open}.
\]

The opening midpoint, opening width, and flow-smoothing parameter are fixed.
Candidate and scenario load scales compose multiplicatively.

Total-blood-volume changes preserve the initial LA, LV, systemic-arterial, RA,
RV, and pulmonary-arterial volumes. The exact volume difference is assigned to
the systemic-venous and pulmonary-venous reservoirs in a fixed 60:13 ratio,
with the pulmonary reservoir used as the exact remainder to avoid ledger drift.

## Execution protocol

Every coordinate/scenario pair starts from a new cold initialization. States,
Newton histories, or accepted solutions cannot be transferred between
candidates. Adaptive sampling, gradients, local optimization, scalar winner
scores, result-dependent run extension, and automatic winner selection are
forbidden.

The phases are fixed before results are inspected:

1. **Numerical readiness:** LHS indices 0, 16, 32, and 48 at HR 60, one beat,
   \(\Delta t=2\) ms. This checks only cold-start numerical construction. It
   makes no periodicity or physiology claim.
2. **Screening:** all 64 indices at HR 60, 32 beats,
   \(\Delta t=2\) ms.
3. **Stress validation:** fixed indices 0, 4, ..., 60 under HR
   50/60/75/100, blood-volume 0.85/1.15, systemic-resistance 0.75/1.35, and
   pulmonary-resistance 0.65/1.50 scenarios. This phase is predeclared but is
   not scheduled in the first implementation slice.
4. **Time-step refinement:** fixed indices 0, 16, 32, and 48 at HR 60 with
   \(\Delta t=2\) and 1 ms. This phase is also deferred from the first slice.

Screening, stress-validation, and time-step-refinement coordinates are single
continuous 32-beat runs. Calcium amplitude is ramped commonly over beats 1--4
with multipliers 0.25, 0.50, 0.75, and 1.00. Beats 5--29 are discarded for
settling. Beats 30--32 are the assessment interval. The last three exact
cycle-boundary states and last two raw cycles are retained.

Two consecutive full-state normalized return maps must each have maximum
absolute dimensionless residual no greater than \(10^{-4}\). Morphology is not
a settling test. The one-beat readiness phase is explicitly exempt from the
periodicity requirement.

## Predeclared eligibility

Eligibility has two layers. The first is numerical. A run must complete, every
accepted output must be finite, every blood-compartment volume must remain
positive, the absolute closed blood-volume residual must be at most
\(10^{-6}\) mL, and the required consecutive return maps must pass. Existing
Land, SLS, and TriSeg validity readbacks remain part of numerical integrity.

The second layer is a deliberately broad operating-point screen evaluated from
the raw final assessment cycle:

| readback | inclusive plausibility interval |
| --- | ---: |
| LA pressure | -3--30 mmHg |
| peak LV pressure | 80--200 mmHg |
| aortic pressure | 45--180 mmHg |
| cardiac output | 3--8 L/min |
| LV ejection fraction | 0.40--0.75 |
| pulmonary-vein pressure | 0.1--40 mmHg |

For MV, AoV, TV, and PV, reverse volume must not exceed the larger of 1 mL and
5% of forward volume. Reverse-flow duty is report-only.

These intervals are **plausibility screens, not normal-human calibration
targets**. They are intentionally broad guards against uninterpretable
operating states. Passing them does not establish normal physiology, and
failing one does not by itself identify a constitutive mechanism. They cannot
be tightened, relaxed, or reweighted after viewing V2 outcomes; a changed
policy requires a new protocol version.

LV relaxation time, pressure-decay fit quality, peak negative \(dP/dt\), MVO
timing/pressure, transmitral E/A/valley/VTI/deceleration, LA phasic volumes,
x/v/y pressure landmarks, and pulmonary-vein S/D/Ar are secondary physiology
readbacks. They remain report-only until event definitions and reference
envelopes are independently fixed. Human catheter data show that the fitted
LV relaxation constant is informative but definition- and disease-dependent
([PMID 6538061](https://pubmed.ncbi.nlm.nih.gov/6538061/)); it is therefore not
silently promoted to a V2 gate.

## V-loop policy

The LA V loop is diagnostic output only. The protocol may report:

- proper crossing count;
- signed and absolute A- and V-lobe areas and their unbounded ratio;
- reservoir--conduit matched-volume overlap width;
- mean and integrated matched-volume pressure gap;
- normalized width and gap measures;
- branch monotonicity and matched-volume coverage.

None of these quantities may affect settling, numerical eligibility, broad
operating-point eligibility, candidate ordering, candidate selection,
parameter-range revision, or stress-test membership. There is no weighted
shape score and no preferred candidate selected by lobe area.

Matsuzaki et al. observed A and V loops in simultaneous human LA pressure--
dimension relations and showed that A-loop behavior changes with loading and
disease ([PMID 2024603](https://pubmed.ncbi.nlm.nih.gov/2024603/)). That is an
important topology and variability anchor, but pressure--dimension loops from a
small mixed cohort do not supply a universal pressure--blood-volume area target
for this model. V-loop evidence is inspected only after numerical periodicity
and the independently declared operating-point screen; it is never fed back
into V2 design.

A connected plausible region with consistently measurable V loops would
justify a separately preregistered physiology-comparison study. Near-zero or
misordered V loops throughout the eligible region would instead be preserved
as a negative result for this fixed model class and prior envelope. Either
outcome is evidence; neither authorizes a post-hoc pressure correction.

## Command surface

The V2 runner and renderer are available through the following fixed command
surface:

```bash
# four fixed one-beat numerical-readiness coordinates
npm run verify:no-avpd-five-patch-physiology-envelope-readiness-v2

# print the immutable full plan without simulation
npm run plan:no-avpd-five-patch-physiology-envelope-full-v2

# stream all 64 HR60 screening coordinates to disk
npm run run:no-avpd-five-patch-physiology-envelope-screening-v2

# validate the exact screening assembly and render visual readbacks
npm run render:no-avpd-five-patch-physiology-envelope-screening-v2
```

The CLI preserves fixed membership and canonical order, persists failed
trajectories rather than omitting them, and exposes no score, best-point
selection, resume-based outcome filtering, or tolerance override. When an
output directory is supplied, each full raw-cycle payload is atomically
persisted and released before the next coordinate; only compact hashes and
execution summaries remain in memory.

The screening renderer requires the canonical unsharded 64-run assembly
manifest. It verifies the manifest hash, protocol/phase/shard identity,
ordered run IDs, and ordered artifact hashes before rendering. Missing, stale,
mixed-shard, or otherwise noncanonical assemblies are rejected rather than
displayed.

## Interpretation order

Results are interpreted in this order:

1. cold-start numerical readiness;
2. 32-beat completion and full-state periodicity;
3. broad pressure/output/volume/valve plausibility;
4. connectedness and width of the plausible region in the predeclared design;
5. report-only filling, relaxation, and A/V-loop morphology;
6. held-out HR/load behavior and fixed time-step comparison.

This ordering prevents an attractive PV projection from concealing an
unsettled, non-conservative, or hemodynamically implausible trajectory. It also
keeps the central model-selection question at the level of a viable prior
region rather than a locally fitted picture.
