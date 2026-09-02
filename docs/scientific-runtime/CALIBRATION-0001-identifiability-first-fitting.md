# CALIBRATION-0001: identifiability-first fitting

Status: active cross-cutting plan; research use only

## Decision

Build a thin, analysis-owned calibration lane around the existing exact runner.
Its first use is a retrospective normal-reference design for the systemic and
left-heart baseline. Reuse the same closed study contract later for presets and
non-clinical case matching, but do not begin with a universal optimizer,
product fitting UI, or large cache/scheduler framework.

The order is fixed: repair evidence lineage, measure numerical resolution,
propose a practically supported coordinate subset, test the minimal search on
synthetic controls, and only then select a baseline. Prediction over a declared
condition envelope is primary. A unique raw parameter vector is not a default
result.

## Current evidence and claim scope

Standard68 is construction evidence and a workflow shakedown, not independent
physiological confirmation. Its controls and some normal-reference bounds were
inspected and changed during the same development history; `6a86738f` is one
explicit example. Several legacy healthy-reference source IDs did not resolve
in `data/myocardium/sources.json`; Step 0 now maps them to checked primary-source
metadata in `data/physiology/main-wire-normal-reference-evidence-v1.json`.
Current gate passes nevertheless cannot be reused as untouched validation, even
if their ranges later prove defensible.

Standard68 also retains a known pulmonary-waveform limitation: late PAP
re-elevation and a short pulmonary acceleration pattern were not repaired by
ordinary RV-tension adjustment. The first study makes no normal pulmonary
waveform or whole-circulation baseline claim. Right-heart outputs remain safety
sentinels; expansion of claim scope requires a pulmonary model-form study.

Before a new baseline run:

- every evidence ID and measurement meaning resolves;
- every already inspected gate and response check is marked construction;
- a genuinely lineage-disjoint H2/H3 final set is frozen before results, or
  final confirmation is explicitly unavailable; and
- broad heterogeneous normal intervals are treated as design corridors, not a
  joint population distribution.

The baseline result is an admissible interior reference set, not a unique
"normal human," population membership claim, parameter confidence interval, or
physiological optimum. Synthetic recovery tests code and inference behavior,
not biology.

## Ownership boundary

- Exact owns integration, accepted state, events, conservation, rollback,
  settlement, and checkpoints. It owns neither a fitting objective nor analysis
  placeholders.
- Versioned analysis owns observation operators, derived metrics, uncertainty,
  conditioning, fitting, and reports.
- The Model Surface owns product exposure and pins analysis methods. Product
  presets and case demos may vary only Surface-exposed controls.
- Baseline/model construction may use a separate parameter policy, but an
  internal or model-global change creates an authenticated exact candidate; it
  is not a hidden preset/case knob.

Some current timing, morphology, and pressure-volume operators are engine-side
validation code bundled with exact releases. This is acknowledged boundary
debt. The first evaluator may use a versioned read-only adapter around them, but
must not add derived fitting results to exact frames. Operator migration is a
separate focused change.

## One closed study contract

A source study definition references, rather than copies, versioned parameter,
observation, evidence, condition, objective, execution, claim, and data
policies. Resolution produces canonically ordered JSON and one SHA-256 identity.
Every evaluation and report binds that identity together with exact, Surface,
analysis-method, initialization, seed, and numerical-policy identities.

Use TypeScript and tests, following the existing source-to-canonical-JSON
pattern. The minimal policy layer records:

- for parameters: typed apply/read binding, unit, role, scope, transform,
  domain/bounds and their provenance, aliases/conflicts/ties/confounds,
  compatible identities, and allowed study modes;
- for observation methods: exact dependencies, unit, pressure basis/station,
  event/window/filter semantics, uncertainty family, and correlation group;
  and
- in each study evidence binding: lineage, use role, eligibility, data class,
  and claim class.

The resolver/linter rejects unresolved IDs, unit/station incompatibility,
apply-order-dependent aliases, undeclared confounded joint fits, numerical
settings used as physiology, evidence leakage, incompatible identities,
unsupported bounds in confirmatory work, case-data policy violations, and
result/protocol mismatch. Observation equations and control catalogs remain
code-owned and are not duplicated in the study file.

For a one-maintainer repository, protocol ordering is machine checked. A result
must reference an unchanged protocol commit that precedes its result commit;
changing a bound, method, evidence role, or acceptance rule creates a new study
identity. This can be two commits in one archival branch and does not require a
ceremonial protocol-only PR. Exploratory output stays in ignored scratch storage
and cannot carry a confirmation claim.

Hashing proves ordering and consistency, not that a human never saw repository-
visible evidence. Independence is a property of data lineage. Reproducibility,
preregistered directional predictions, and explicit absence of independent
validation are the honest safeguards when sealed external evidence is absent.

## Scientific policy

### Parameter roles

Each study assigns measured input, source-locked, shared phenotype,
condition-specific nuisance, discrete model-form, or numerical roles. Known
interventions are fixed; numerical parameters are never fitted to physiology.
Internal constitutive changes are model candidates rather than product knobs.

For the first study, calcium-source and Land kinetic-family parameters remain
locked. HR is an enumerated input of 60 or 70 bpm, never a fitted continuous
coordinate. Passive stiffness begins as a diagnostic coordinate and may enter
construction fitting only when fixed-control multi-preload responses show
stable leverage; this does not identify a biological stiffness value. PVR
enters a selected subset only with matched right-heart pressure and flow
evidence.

Known compensation is encoded before simulation: TBV with unstressed venous
volume/tone/compliance; resistance with pressure difference and flow;
compliance with pulse pressure and stroke volume; unloaded geometry with
passive stiffness; and active tension with calcium amplitude, viable fraction,
orientation, and reference tension. Ordinary fitting admits one supported
coordinate or reports the identifiable combination. Bounds must not create a
precise point estimate along a flat direction.

### Observations and uncertainty

"Robust" and "sensitive" are not permanent output labels. Sensitivity depends
on output, parameter direction, condition, observation method, station, and
event regime. AV gradient, ET, ICT/IRT/Tei, dP/dt, E/A, pressure, and volume can
all change role across that tensor.

Numerical error, measurement error, practical non-identifiability, population
variation, and model discrepancy remain separate report fields. Numerical
failure means unresolved under a declared execution policy, not necessarily a
physiologically impossible candidate.

For interval-only normal-reference design, use this lexicographic objective:

1. exclude invalid/physical, numerical-unresolved, nonsettled/event-change, and
   operationally interrupted outcomes with distinct typed statuses;
2. satisfy frozen construction corridors and morphology/response constraints;
3. maximize the worst normalized interior margin over the declared envelope;
   and
4. among equivalent interiors, minimize justified reference/prior departure
   and model complexity.

This is constrained max-margin design, not likelihood fitting. It returns an
epsilon-equivalent feasible ensemble, active constraints, conditional output
spread, and unresolved directions. An empty feasible set is a result; gates are
not widened inside that study.

Data-backed component or case studies may use priors and a covariance-aware
joint likelihood only when centers, uncertainty, lineage, and station are
available. Matched time-series waveforms should be used when they carry more
information than summary indices, with sampling and autocorrelation represented.
The waveform and its ET/Tei/extrema, or SV/SVI/CO/CI at fixed HR, must not be
counted repeatedly without covariance or an explicit correlation family.

### Practical conditioning

Conditioning is assessed only after analytic role/confound screening and a
numerical-floor audit. Use transformed local finite differences at multiple
anchors, step halving, common cold or exact-compatible initialization, and
explicit event-regime checks. Each perturbation settles independently;
nearest-neighbour continuation is not used to estimate derivatives.

Scale interval rows by corridor width and numerical floor; whiten measured-data
rows only with supported covariance. Report singular spectrum, rank tolerance,
alternative epsilon-equivalent subsets, alias/confound and bound/prior
dependence, and conditional output uncertainty. Local sensitivity/SVD/pivoting
are an advisory practical-conditioning diagnostic, not proof of global or
structural identifiability. The human admits the subset.

The first anchors are rest, fixed-control low/high preload, a preregistered
afterload perturbation, and HR 60/70. Preload and afterload provide the main
identification leverage; rate remains a safety condition. A dedicated Morris,
Sobol, profile-likelihood, or Bayesian stage is deferred until data and a
measured need justify it.

### Implemented baseline result and measured throughput

The construction search first found a continuous candidate that passed the
complete envelope, then rejected it for release because its controls were not
representable on the exposed Surface lattice. Deterministic projection and
small axial lattice continuations produced the adopted point: TBV 4900 mL,
systemic-resistance scale 0.98, arterial-stiffness scale 1.30, common
ventricular active-tension scale 1.24, and common ventricular passive-stiffness
scale 0.88. Calcium-source and Land kinetic-family coordinates remained locked.
These values identify a tested fixture; they are neither parameter precision
nor an identifiability claim.

The fitting tools retain the immutable Standard68 fixture/checkpoint as their
retrospective search anchor. The adopted coordinates are emitted only under the
new Standard69 identity; this avoids silently rewriting either the old default
or its settled checkpoint while keeping continuation reproducible.

The generated 2 ms cold baseline has AV mean/peak gradient 4.239/7.637 mmHg,
ET 254 ms, LV maximum/minimum dP/dt 2362/-1162 mmHg/s, mitral peak E/A 0.845,
ICT/IRT 64/92 ms, Tei 0.619, AoP 90.9/67.0 mmHg, CI 2.526 L/min/m2, and
single-peaked rounded LVP/RVP morphology. Under fixed controls, TBV -12% lowers
LV output by 19.1%; TBV +12% raises LV output by 3.09% and RV output by 6.04%.
The high-preload LV output/filling-pressure slope is 0.0222 L/min/mmHg and EDV
rises 3.65%, with directionally correct filling and transmural pressures. This
places the fixture just on the admitted ascending side of the high-preload
gate; it does not establish a large physiological reserve or validate the full
Frank-Starling curve.

The Standard69 additions require, in each direction and for both ventricles,
at least 3% directional CO change, 0.02 L/min/mmHg CO/filling-pressure slope,
and 3% directional EDV change. These floors were fixed after exploratory
candidate inspection. They are construction-only non-regression boundaries,
not preregistered physiological cutoffs or independent validation. The baseline
AoP maximum (90.9 mmHg) and CI (2.526 L/min/m2) are also close to their lower
construction bounds (90 mmHg and 2.5 L/min/m2), so `28/28 passed` must not be
read as a claim of a well-centred multivariate healthy population sample.

The selected lattice finalist passed continuation, independent 2 ms and 1 ms
cold solutions, fixed-control low/high preload, and the preregistered HR 70 and
systemic-afterload morphology/periodicity safety checks. HR 70 is not claimed
to satisfy every rest corridor. The baseline-local numerical floor and the
candidate-local 2% corridor allowance are separate cross-resolution error
budgets. Each time resolution still passes every buffered rest gate
independently; comparison tolerance cannot rescue an out-of-corridor result.
The 1 ms worst buffered margin is 0.0176; a previously qualified alternative
was rejected because its corresponding dP/dt margin was only 0.00245.

Measured performance on the current 18-logical-CPU workstation supports the
staged lane without a generic scheduler:

- verified same-construction continuation was 13.1 times faster than cold
  initialization in the recorded benchmark;
- each 11-point release-lattice search with eight workers completed in 37.5 to
  44.8 seconds versus 151.4 to 160.3 seconds summed evaluation time, an
  observed 3.58 to 4.04 times throughput gain;
- four preload-only candidates executed concurrently in 83.6 seconds maximum
  wall time versus 313.5 seconds summed candidate time, a 3.75 times gain; and
- the selected five-worker finalist cascade completed in 318 seconds versus
  735 seconds summed worker time, a 2.31 times gain.

Exploration therefore uses up to eight workers, exact-identity checkpoint
continuation, periodicity-triggered early stop, and release-lattice preflight.
Preload-only screening precedes full qualification; independent cold and 1 ms
checks remain finalist-only. The mint path intentionally retains a cold source
reconstruction and deterministic double artifact build. Performance work stops
at this boundary unless new measurements show a research-lane bottleneck.

The complete search, preload-screen, finalist, and rejected-result corpus is
retained in archival PR #586 rather than merged into main. Standard68 remains
immutable. Main retains the reusable study implementation plus a separately
minted Standard69 validation, checkpoint, exact artifact, descriptor, and
admission lock for the selected fixture. Together they preserve the
rest/reserve, release-lattice, and refined-time-step decision boundaries
without making exploratory output part of the production tree or rewriting an
already admitted exact identity.

The adopted finalist is
`mainwire-baseline-release-lattice-robustness-recovery-00-final-qualification-v1.json`
in archival commit `fb816da4a2bb142b3d82b372970c849e42d0fd14` (PR #586).
It binds search digest
`3674bf2cd759a46fd3da069c72f518e4b19d2def6e41c78561e1eee149d165f6`,
numerical-floor digest
`6c68b16724d3a83d9604b4e268feb1a5ff3774049e8668c1166298c765f1d5bd`,
study-identity digest
`a3e061253f593e2a988b47090f707685b3ba5047dcc08c2b04f1ce056d8f3468`,
and checkpoint digest
`6f94efd89653069aa613a377723728141d940e6131afe797b3c1dfa38d8918c3`.
These pointers preserve selection provenance without merging the exploratory
report corpus into main.

## Minimal implementation sequence

### Step 0 — provenance and honest status

Resolve gate sources and evidence roles, mark current Standard68 evidence as
construction, add a machine check requiring reason/provenance for bound changes,
and freeze either a disjoint final set or `confirmation unavailable`. Stop if
lineage or observation meaning cannot be resolved.

### Step A — evaluator and numerical floor

Wrap the existing baseline generator without changing exact semantics. Produce
canonical accepted output or distinct physical, numerical, and operational
outcomes. Measure repeat determinism, settlement variation, cold versus one
common compatible checkpoint, integrated time-step refinement at the actual
HR/event schedule, and wall time. Repair numerical or observation methods first
if their uncertainty materially consumes a corridor margin.

### Step A-prime — policy compiler

Implement only the typed policies, study resolver/hash, linter, and tests needed
for Step B. No UI, generic optimizer API, persistent cross-study cache, custom
scheduler, or broad resume ledger. Compile and commit the Step B protocol before
its result.

### Step B — conditioning and subset proposal

Start with one preload owner, SVR, arterial stiffness, common active-tension
scale, and diagnostic passive stiffness. Include TBV plus venous tone only as a
deliberately non-identifiable negative control; include a known positive
control. Apply the common-initialization, multi-anchor audit and propose several
small alternatives. Stop if no stable two-to-four-coordinate subset or useful
combination exists; add a targeted observation/condition, reduce scope, or move
to model-form study rather than expanding an intuition-driven grid.

### Step C — minimal search and synthetic controls

Use a seeded small maximin/space-filling design and the simplest stable bounded
refinement over the proposed coordinates. With several interior synthetic
truths and starts, require recovery of supported combinations and refusal to
claim unique values for the confounded pair. Stop if results depend materially
on start, finite-difference step, numerical policy, or event regime. This admits
the search machinery, not model physiology.

### Step D — retrospective normal-reference design

Freeze one admitted subset, then run the interval max-margin objective. Preserve
materially distinct feasible basins and return an ensemble. Re-run finalists
cold, from another valid initialization, in reversed condition order, and with
refined time step. No bound, role, observation, or method changes within the
study. Failure begins a new protocol or named model-form hypothesis.

### Later reuse

Presets bind different evidence and a Surface-exposed phenotype; needing an
internal change means minting a model. Non-clinical case matching fixes known
inputs, fits only an admitted Surface subset, and reports ensembles,
identifiable combinations, and prediction bands. It never reports diagnosis,
treatment advice, population membership, or a clinically validated prediction.

Only synthetic or published-source case data may enter Git. Real-person data
stay local and are not persisted, cached, logged, exported, or committed by
default. Plain SHA-256 of low-entropy measurements is not anonymization; any
necessary durable reference requires an explicit data policy and opaque or
keyed identity.

Dedicated RV/pulmonary, MV/diastolic, and TV/PV studies follow with
station-appropriate methods; LV thresholds are not copied to RV. Safety
sentinels remain active throughout.

## Stop fitting and compare model form when

- structured phase-, station-, or condition-dependent residuals remain;
- conditions require incompatible shared values, unsupported bounds, or prior
  extremes;
- the target is beneath numerical resolution or insensitive to admitted
  coordinates;
- improvement disappears with initialization, order, settlement, or time-step
  refinement;
- improvement introduces ringing, flattened ejection, nonphysical gradients,
  lost reserve, conservation error, or solver fragility; or
- extra freedom widens parameter profiles without reducing prediction spread.

Use the smallest factorized design justified by the mechanism. One-factor
ablation is sufficient only when interaction is implausible; otherwise use a
prespecified fractional/full factorial and limited interactions. Each model
candidate gets the same frozen evidence, nuisance policy, numerical tests, and
search budget. Fitting may not hide an observation-station mismatch or rescue a
rejected topology.

## Acceptance and maintenance

The lane is accepted when protocol/result lineage and claim/data restrictions
are machine checked; exact frames and product persistence contain no fitting
state; all completed evaluations reconcile to accepted or typed outcomes;
infeasible and operational failures cannot win through a finite penalty; known
confounds are refused as unique estimates; positive controls and supported
synthetic combinations are recovered; correlated observations are not counted
twice; and finalist conclusions survive initialization, order, settlement, and
time-step checks.

Persistent caching, parallel scheduling, profile likelihood, noisy coverage,
and UI follow only if the measured baseline lane needs them. Any future cache
separates exact simulation, observation projection, and objective/evidence
identities; parameter distance alone never authorizes continuation.

One human maintainer owns evidence roles, bound/prior changes, unlocking source
parameters, final-evidence opening, subset and model-form admission, case-data
classification, and published claim wording. Automation performs linting,
execution, audits, and reproducibility checks.

AI review uses a 1/2 gate: at least one of two requested reviews must judge a
change admissible, while the implementing agent owns the final evidence-backed
adoption decision. Review consensus does not override source, tests, scope, or
the simplicity requirement. AI findings are advisory provenance, not
independent scientific validation.

## Review synthesis and anchors

Independent Codex 5.6 Sol Max and Claude Fable 5.1 Max reviews both rejected the
larger initial plan. This revision accepts their shared findings: current
Standard68 evidence is construction-only, interval design precedes statistical
fitting, pulmonary claim scope is limited, and infrastructure must stay behind
scientific need. It adopts the smaller local-conditioning MVP; a dedicated
global screen is deferred. It keeps machine-hashed protocol ordering without
requiring a multi-human or protocol-only-PR ceremony.

Methodological anchors:

- Marquis et al.: <https://doi.org/10.1016/j.mbs.2018.07.001>
- Olsen et al.: <https://doi.org/10.1007/s00422-018-0784-8>
- Raue et al.: <https://doi.org/10.1093/bioinformatics/btp358>
- Bjordalsbakke et al.: <https://doi.org/10.1016/j.mbs.2021.108731>
- Schiavazzi et al.: <https://doi.org/10.1002/cnm.2799>

These sources support methods, not this model's physiology or clinical use.
Relevant local prior art remains in Git rather than this durable document: the
removed fitting lane before `782b7f1b`, load-envelope work at `8f4e41b7` and
`f5f1ef68`, and the Standard68 construction history.
