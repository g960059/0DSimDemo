# Integrated V3 model: current state

Status: numerically executable research model; not clinically validated

## Scope

The integrated model composes five-wall Land/TriSeg cardiac mechanics,
systemic and pulmonary circulation, coronary circulation with accepted
autoregulation state, event-driven rhythm and calcium drive, respiratory and
pericardial pressure owners, and declared mechanical-support owners. The
ordinary configuration is regular sinus rhythm with support devices off.

The model supports bounded hemodynamic, chamber, valve, pericardial, coronary,
oxygen-boundary, rhythm, and device research inputs. It does not represent a
patient-specific heart, spatial electrophysiology, CFD, autonomic reflexes,
remodeling, dynamically coupled tissue metabolism, or regional ischemia.

## Runtime authority

The typed numerical Session owns one accepted state and stages a complete
candidate before promotion. A failed step leaves the previous accepted tuple
unchanged. Accepted event-limited substeps, checkpoint continuation, fixture
epochs, and model-accumulated beat metrics are part of exact numerical
semantics.

The exact artifact carries a generated execution-plan descriptor. Each
Scenario binds private Worker-local storage before its Session starts. UI
render cadence, graph history, analysis Workers, and authoring state cannot
mutate accepted numerical state.

Code and tests own implementation details, catalogs, algorithms, and numerical
tolerances.

## Ownership layers

Three layers must remain separate:

1. **Exact model** — equations, solver and event semantics, fixture and
   checkpoint contracts, primitive signals, and metrics accumulated by the
   numerical Session. Exact frames contain only this catalog.
2. **Analysis method/profile** — computations that run from exact captures or
   settled families. PE, PVA, and literature-mapped estimated MVO2 are owned
   here; they are not null placeholders in the exact frame.
3. **Model Surface** — which compatible controls, graphs, and presentation
   objects the product exposes. It composes with an exact release and an
   analysis profile without redefining either.

An exact output-ABI correction requires a new immutable `modelId` even when it
does not change equations or solver behavior. Analysis method and profile
identities remain semantically distinct from the exact model, but the current
registry binds `analysisProfileId` as immutable model-release metadata.
Deploying another profile therefore still requires a new model release
registration until the registry gains an independently pinned analysis layer.

## Pressure-volume and oxygen interpretation

LV stroke work is the model-owned accepted-path transmural pressure-volume
work for the completed beat. The settled-family analysis separately derives a
protocol-defined nonlinear ESPVR, EDPVR, PE, PVA, and a literature-coefficient
MVO2 estimate. These results are analysis outputs and may be displayed in the
ordinary Workbench and Reader.

The MVO2 value is not a metabolic submodel. The numerical model does not own
ATP use, basal metabolism, calcium uptake/release energy, or total myocardial
oxygen consumption. PVA is therefore a method-specific mechanical proxy, not
an exact whole-heart energy identity. The completed research lane is retained
at Git tag `research-pva-mvo2-558-573-final`.

## Scientific claim limits

- Numerical verification is not physiological or clinical validation.
- Valve event, beat-volume, pressure, work, oxygen-boundary, and coronary
  outputs retain their code-defined measurement bases; similar clinical names
  do not make them interchangeable.
- The beat-mean oxygen observer does not feed back into mechanics or
  circulation.
- Structural return curves and settled preload families are protocol-defined
  analyses, not independent measurements.
- Controls are bounded research inputs, not diagnoses, severity grades, or
  treatment recommendations.
- A Snapshot admission result establishes executable consistency, not
  settlement, biological validity, or certification.

For equation anchors, calibration roles, held-out evidence, and detailed
non-claims, consult
[literature traceability](INTEGRATED-MODEL-0002-literature-traceability.md).
