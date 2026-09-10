# Integrated model: scope and authority

Status: executable education/research model; not clinically validated.

## Scope

The current model combines five-wall Land/TriSeg mechanics, systemic and
pulmonary circulation, coronary hydraulics and autoregulation, rhythm and
calcium drive, and respiratory/pericardial pressure. The public configuration
uses regular sinus rhythm with mechanical support off.

Finite anatomy choices are fixed constructions, not simulated remodeling.
Different settings or a disease label do not qualify a new phenotype. Regional
ischemia, spatial electrophysiology, distributed vascular waves, autonomic
reflexes, evolving anatomy and dynamically coupled tissue metabolism are not
represented. Engine-side rhythm/device paths do not imply public support.

The selected release, inputs, coefficients, measurement definitions and case
assessments are authoritative in their registries and self-contained model
documents. This file deliberately does not repeat per-release equations or
construction history.

## Runtime authority

The exact Session owns the accepted numerical state, event-limited substeps,
checkpoint continuation, input epochs and model-accumulated beat metrics. A
failed trial cannot partially promote a new accepted tuple. Each Scenario owns
private Worker storage. Rendering, background analysis and authoring cannot
mutate the accepted numerical state.

Identity and release consequences are defined in
[Studio release composition](../studio/DESIGN-STUDIO-006-model-surface-release-and-model-lab.md).
Source and tests own algorithms, tolerances and supported contracts.

## Interpretation boundaries

- Numerical verification and publication are not physiological or clinical
  validation. Qualification belongs to the tested construction and conditions.
- Clinical names do not imply identical pressure stations, event definitions
  or measurement methods. Hydraulic gradients are not automatically Doppler
  gradients, and model node pressures are not arbitrary catheter locations.
- Valve-area controls alone do not represent a diagnosis, chronic remodeling,
  leaflet pathology or an independently qualified severity grade.
- ESPVR, EDPVR, Starling curves, PE and PVA are protocol-defined analyses.
  They are not additional independent measurements of the same simulation.
- PVA-derived oxygen estimates are mechanical proxies, not an ATP/metabolism
  model or an exact whole-heart energy identity. The coronary reference bed
  and anatomy-aware derived oxygen estimate have different mass assumptions.
- A Snapshot admission establishes executable consistency, not settlement or
  biological validity. Controls are research inputs, not treatment advice.

Source roles and non-claims are retained in
[literature traceability](INTEGRATED-MODEL-0002-literature-traceability.md).
Completed studies and retired implementations are recoverable from Git history;
historical reader documents retain their own scientific records.
