# Calibration: ownership, evidence and reuse

Fitting is an analysis-owned research workflow around the exact runner, not
part of numerical integration or durable simulation state. Its result is a
representative construction, not a uniquely identified biological parameter
vector, clinical diagnosis or patient prediction.

## Baseline and presets

Baseline and disease presets use the same exact input contract. Each reference
defines its own intended phenotype, evidence, measurements and acceptance
roles. Healthy ranges must not be applied wholesale to a disease case. A common
feature can be an explicit teaching target or contextual observation without
being claimed universal to the disease.

Inputs admitted by the model may be fitted directly; UI knobs are convenient
projections, not the boundary of case expression. Numerical settings are never
physiology fitting parameters. Free only a small, justified set and declare
aliases/confounds such as blood volume versus venous tone/compliance, unloaded
geometry versus passive stiffness, or active tension versus calcium amplitude.
Unresolved directions remain unresolved; bounds do not establish identifiability.

Changing an admitted input, a selected preset or a document does not by itself
change the exact model. Changes to fixed constitutive parameters, equations,
input semantics or numerical/checkpoint behavior are model development. See
[release ownership](../studio/DESIGN-STUDIO-006-model-surface-release-and-model-lab.md).

## Evidence and assessment

Every criterion needs at least one traceable source and an explicit role:
construction constraint, phenotype target or contextual comparison. Record
the population, condition, method, pressure basis/station, timing convention,
units and uncertainty. A cited paper does not make an engineering threshold a
published normal range. Data inspected while constructing a model remain
construction evidence, not independent confirmation.

Do not label an output permanently robust or sensitive: dependence varies with
parameter direction, load, event regime and measurement method. Derived metrics
from the same waveform or algebraically dependent flow indices do not add
independent evidence. Separate numerical error, measurement uncertainty,
population variation, non-identifiability and model discrepancy.

Missing observations, physical/numerical rejection, nonsettlement and operational
failure must remain distinguishable. Feasibility precedes ranking. Never widen
criteria automatically to admit a candidate, or smooth a waveform to hide a
numerical artifact. Shape metrics are method-bound observations; a schematic
single-peaked or rounded contour is not a universal human reference.

## Execution and qualification

Bind every result to the exact model, typed construction, source snapshot,
observation/reference policies, time step and initialization. A successor model
requires its own evaluation. Historical results can inform initialization but
cannot be relabeled as new-model evidence.

Use lean observation during settlement, bounded parallel workers and compatible
checkpoint continuation for screening. Reconfirm periodicity after reuse and
preserve input order in reported results. A warm start is not independent cold
qualification. Finalists use independent starts and refined time steps; any
required preload-response qualification uses its declared fixed-control protocol.

The case command supports periodic rest screening and a bounded local search
against the selected reference. A completed search is not final qualification:
it does not automatically adopt, publish or select a preset. Retain partial
polls, unavailable target components, local response ambiguity and bound
dependence in its report. Baseline qualification remains a separate command.
CLI help and executable tests own available coordinates, operations and budgets.

Compare measurement methods on the same observed beats and verify their time
bases before treating differences as physiological residuals. A presentation
windowed pressure rate and native accepted-step extrema are different estimands;
neither matching their numbers nor meeting a new display metric is a fitting goal.

Keep measurement availability local to the affected side and estimand whenever
the shared trace and exact beat are valid. Preserve event anomalies separately
from recoverable values: a last-closure timing measurement must not silently
replace native first-closure volumes or make a reopened-valve case rank as
qualified. Re-observation records bind both the original numerical source and
the new analysis source; they are not new numerical or time-step verification.

Stop tuning and compare model form when structured residuals, unsupported bound
dependence, loss of response reserve, conservation/solver failure, or strong
initialization/resolution dependence persist. Assess physiologically motivated
alternatives under the same declared evidence; fitting cannot repair a station
or measurement mismatch.

## Records and data

An adopted case binds its own inputs, capture and assessment. The selected
baseline controls new-session startup; saved scenarios retain their own state.
Document generation reuses constitutive modules but resolves this case's
coefficients, initial state and observations. Historical documents remain
self-contained when their implementation or authoring adapter is retired.

Only synthetic or published-source case data belong in Git. Real-person data
remain local unless an explicit data policy authorizes persistence, export and
reuse. Plain hashes of low-entropy measurements are not anonymization.

Rebuilding and resuming are different operations. A same-run resume keeps its
original source, inputs, job identities and budgets. A material refresh creates
a new record: re-observation retains the original numerical source; layout-only
rendering retains the original measurements, interpretation and assessment.
Neither is a new numerical qualification. `fit:registry:family` rebuilds the
current roots before their AS comparisons. A selected parent's full input is
explicitly bound to the child, with only aortic area free; a held parent blocks
the child instead of silently substituting an old public background.

Methodological context (not physiological validation):

- <https://doi.org/10.1016/j.mbs.2018.07.001>
- <https://doi.org/10.1007/s00422-018-0784-8>
- <https://doi.org/10.1093/bioinformatics/btp358>
- <https://doi.org/10.1016/j.mbs.2021.108731>
- <https://doi.org/10.1002/cnm.2799>
