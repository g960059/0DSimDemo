# CALIBRATION-0001: identifiability-first fitting

Status: active cross-cutting boundary; research use only

## Decision and claim scope

Calibration is a thin, analysis-owned layer around an authenticated exact
runner. It is not part of exact integration, accepted state, checkpoint
semantics, or product persistence.

The first use is a retrospective normal-reference design for a systemic and
left-heart baseline. It seeks reproducible feasible operating points inside
construction corridors. It is not population inference, independent
physiological validation, patient fitting, or evidence that one biological
parameter vector is uniquely identified.

All baseline gates and response floors inspected during construction remain
construction evidence. A final-confirmation claim requires lineage-disjoint
evidence frozen before its results are observed; otherwise confirmation is
explicitly unavailable. Hashing proves content and ordering, not that evidence
was unseen.

The current claim includes baseline construction sentinels for PAP/PV-flow
morphology, but excludes clinical or envelope-wide pulmonary-waveform
validation. Right-heart outputs remain safety sentinels until a dedicated
RV/pulmonary model-form study supports broader scope.

## Ownership

- Exact owns integration, accepted state, events, conservation, rollback,
  settlement, and checkpoints.
- Versioned analysis owns observation methods, derived metrics, uncertainty,
  conditioning, calibration, and reports.
- The Model Surface owns product exposure and pins compatible analysis methods.
- Baseline construction may use a separate parameter policy. Changing an
  internal constitutive primitive or topology creates an authenticated exact
  candidate rather than a hidden preset or case-fitting knob.

Some existing timing, morphology, and pressure-volume operators remain in
engine-side validation code bundled with exact releases. Analysis may adapt
them read-only, but derived calibration state must not enter exact frames.
Migrating an operator is a separate focused change.

## Closed study contract

A source study references versioned parameter, observation, evidence,
condition, objective, execution, claim, and data policies. Resolution closes
those references into canonical JSON and one content identity. Every
evaluation and result binds the resolved study, exact model, analysis method,
initialization, and numerical policy used to create it.

The policy layer records, without copying code-owned catalogs or formulas:

- parameter role, scope, unit, transform, supported domain, provenance,
  aliases, ties, conflicts, confounds, and compatible identities;
- observation dependencies, unit, pressure basis and station, event/window
  semantics, uncertainty family, and correlation group; and
- evidence lineage, use role, eligibility, data class, and claim class.

Resolution fails closed on unresolved references, unit or station mismatch,
apply-order-dependent aliases, undeclared confounded joint fits, numerical
settings used as physiology, incompatible identities, evidence leakage,
unsupported confirmatory bounds, data-policy violations, or result/study
identity mismatch. A policy change creates a new study identity.

Exploratory output carries no confirmation claim. Reports that use an
additional qualification policy bind that policy's ID and digest. Historical
reports remain evidence of their pinned historical study and are not silently
upgraded to the current policy.

## Parameter policy

Each study classifies coordinates as measured input, source-locked, shared
phenotype, condition-specific nuisance, discrete model form, or numerical.
Numerical parameters are never fitted to physiology. Known interventions stay
fixed.

For the initial baseline design:

- calcium-source and Land kinetic-family parameters are source-locked;
- heart rate is an enumerated 60 or 70 bpm condition, not a continuous fitted
  coordinate;
- only one unsupported preload owner is admitted at a time among total blood
  volume, unstressed venous volume, tone, and compliance;
- resistance requires matched pressure difference and flow context;
- arterial compliance or stiffness requires pulsatile information;
- active tension is represented by the smallest supported amplitude owner; and
- passive stiffness is freed only when multi-preload diastolic information
  provides stable leverage.

Known compensations such as preload-owner aliases, unloaded geometry versus
passive stiffness, and active tension versus calcium amplitude or viable
fraction are declared before execution. A flat direction yields a supported
combination or an unresolved set, not precise individual estimates created by
bounds.

## Observations, uncertainty, and objective

Sensitivity is indexed by output, condition, parameter direction, observation
method, station, and event regime. No output is permanently labelled robust or
sensitive. Numerical error, measurement error, practical non-identifiability,
population variation, and model discrepancy remain separate.

An interval-only normal-reference design uses lexicographic decisions:

1. separate invalid/physical, numerical-unresolved, nonsettled/event-change,
   and operational outcomes;
2. require the frozen construction and morphology/response constraints;
3. maximize the worst normalized interior margin over declared conditions;
4. among practically equivalent interiors, prefer supported reference
   proximity and lower complexity.

This is constrained design, not a likelihood fit. It returns feasible sets,
active constraints, conditional output spread, and unresolved directions. An
empty feasible set is a valid outcome; the study does not widen its own gates.

Data-backed component or non-clinical case studies may use a covariance-aware
likelihood only when measurement centre, uncertainty, lineage, method, and
station are available. A waveform and metrics derived from that waveform, or
SV/SVI/CO/CI at fixed HR, cannot be counted as independent evidence without an
explicit correlation model.

## Practical conditioning and search

Analytic role/confound screening precedes numerical conditioning. Local
finite differences use transformed coordinates, multiple relevant conditions,
step checks, compatible common initialization, and event-regime checks.
Interval observations are scaled by corridor width and numerical floor;
measured observations are whitened only with supported covariance.

The conditioning report includes singular spectrum, rank tolerance,
alternative small subsets, alias/confound and bound dependence, and conditional
prediction uncertainty. Local sensitivity, singular-value analysis, and
pivoting diagnose practical conditioning at the declared anchors; they do not
prove global or structural identifiability and cannot automatically admit a
parameter subset.

Search begins only after an admissible small subset is declared. Feasibility
dominates score, materially distinct basins are retained, and finalists are
checked with independent initialization and refined numerical resolution.
Continuation and parallel execution may accelerate exploration only when exact
identity and checkpoint compatibility are proven; they do not replace cold
qualification. Performance work requires a measured research-lane bottleneck
and must not weaken these contracts.

Standard70 provides bounded construction-checkpoint, same-model checkpoint,
and nearby-parameter continuation paths for that research lane. Each path must
re-establish period-1 convergence and the applicable baseline gates before
a candidate can be admitted. Diagnostic failure results remain observable.
Executable benchmarks own measured performance;
machine-local timings and worker mechanics are not part of this durable
contract. A proposed Standard70 finalist must still pass the Standard70
candidate runner; an older runner's result is not silently relabelled.
Bidirectional preload-reserve, alternate-start, and refined-step checks remain
finalist/mint work rather than per-candidate screening.

## Qualification levels

A construction-only baseline may be minted when its exact artifact and settled
checkpoint are independently registry-verifiable, its frozen rest and response
gates pass, failure classes remain distinct, and its limited claim is explicit.
This does not by itself qualify the machinery as a general fitter.

Before reuse for preset design or non-clinical case matching, the search must
also demonstrate recovery of supported combinations on multiple interior
synthetic controls, refusal of deliberately confounded raw parameters,
stability across multiple starts, and finalist agreement under reversed
condition order. Data-backed reuse additionally requires held-out conditions
and uncertainty appropriate to the supplied measurements.

## Stop fitting and compare model form

Stop continuous fitting when any of the following persists:

- structured phase-, station-, or condition-dependent residuals;
- incompatible shared values across conditions or reliance on unsupported
  bounds;
- a target below numerical resolution or insensitive to admitted coordinates;
- improvement that disappears with initialization, order, settlement, or time
  step;
- improvement that introduces ringing, flattened ejection, nonphysical
  gradients, lost reserve, conservation error, or solver fragility; or
- extra freedom that widens parameter profiles without reducing prediction
  uncertainty.

Compare the smallest physiologically motivated set of model forms under one
frozen evidence, nuisance, numerical, and search policy. Use prespecified
interactions when mechanisms plausibly interact. Fitting cannot conceal an
observation-station mismatch or rescue a rejected topology.

## Reuse and data boundary

Presets vary only an admitted Surface-exposed phenotype. Needing an internal
change means minting a model. Non-clinical case matching fixes known inputs,
fits only an admitted Surface subset, returns ensembles or supported
combinations, and makes no diagnosis, treatment, population-membership, or
patient-prediction claim.

Only synthetic or published-source case data may enter Git. Real-person data
remain local and are not persisted, reused in caches, logged, exported, or
committed by default. Plain hashes of low-entropy measurements are not
anonymization; any durable sensitive reference requires an explicit data policy
and opaque or keyed identity.

Dedicated RV/pulmonary, mitral/diastolic, and tricuspid/pulmonic studies use
station- and chamber-appropriate methods. LV thresholds are not copied to RV.
Safety sentinels remain active throughout.

## Methodological context

These sources inform calibration and identifiability methods, not the model's
physiological or clinical validity:

- <https://doi.org/10.1016/j.mbs.2018.07.001>
- <https://doi.org/10.1007/s00422-018-0784-8>
- <https://doi.org/10.1093/bioinformatics/btp358>
- <https://doi.org/10.1016/j.mbs.2021.108731>
- <https://doi.org/10.1002/cnm.2799>
