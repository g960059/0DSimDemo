# INTEGRATED-MODEL-0002: evidence roles and claim boundaries

Status: durable evidence map, not an active-release or implementation catalog

Exact bibliographic metadata and equation locations are machine-owned in
[the source registry](../../data/myocardium/sources.json). This document keeps
only source roles, leakage boundaries, and non-claims that are costly to infer
from code.

## Evidence roles

Evidence has four non-interchangeable roles:

1. **Equation anchor** supports the form of a law or topology.
2. **Construction evidence** supplies a parameter, prior, or target.
3. **Independent evidence** tests a frozen implementation without having
   selected the compared parameter or gate.
4. **Interpretation evidence** limits what may be inferred.

The same observation cannot construct and independently validate the same
quantity. Derivative datasets are grouped by original subject and waveform,
not by archive name. If a held-out observation is inspected to choose a
parameter, metric, or tolerance, it becomes construction evidence and needs a
new disjoint validation source.

Evidence classes used by this repository are:

- **H1** — numerical or physical invariant established without a physiological
  population claim;
- **H2** — quantitative held-out comparison with frozen observable, units,
  uncertainty, and analysis;
- **H3** — held-out direction, ordering, sign, or shape check; and
- **Q** — qualitative context or applicability boundary.

A citation does not imply that a gate is implemented, passed, or applicable to
the current exact release. Numerical verification precedes physiological
comparison, and neither establishes clinical validation.

## Global mechanics

Land myofilament equations, passive material choices, SLS history, and TriSeg
geometry are construction owners. Their source experiments and normal-adult
priors cannot also validate the resulting chamber pressure, work, or waveform
magnitude.

Independent review must use quantities measured at a declared model/clinical
boundary and must keep modality differences explicit. Chamber volume from a
lumped cavity is not automatically interchangeable with echo or CMR
segmentation; pressure-volume path work is not ATP use or total myocardial
energy.

The integrated model has no spatial electrophysiology, regional activation,
patient-specific anatomy, remodeling, or tissue-resolved metabolism. A
five-wall result cannot claim regional ischemia, paced-QRS dyssynchrony, or
patient-specific prediction.

## Coronary evidence

| Role | Sources | Permitted use | Boundary |
| --- | --- | --- | --- |
| compliant intramyocardial pump topology | [Burattini et al.](https://doi.org/10.1007/BF02407768), [Spaan et al.](https://doi.org/10.1152/ajpheart.2000.278.2.H383) | equation/topology anchor | no vessel-resolved prediction |
| mechanics-derived intramyocardial pressure | [Bovendeerd et al.](https://doi.org/10.1007/s10439-006-9189-2), [Algranati et al.](https://doi.org/10.1152/ajpheart.00925.2009) | construction and transmural-mechanism context | no direct tissue-pressure validation |
| focal loss law | [Young and Tsai](https://doi.org/10.1016/0021-9290(73)90099-7) | equation anchor | no angiographic reconstruction |
| reduced autoregulation | [Dankelman et al.](https://doi.org/10.1113/jphysiol.1989.sp017460), [Cornelissen et al.](https://doi.org/10.1152/ajpheart.00491.2001) | construction context for bounded flow adaptation | no molecular or autonomic pathway claim |
| pressure/flow indices | [De Bruyne et al.](https://doi.org/10.1161/01.CIR.89.3.1013), [Pijls et al.](https://doi.org/10.1161/01.CIR.92.11.3183) | measurement-site definition | no diagnostic threshold or treatment claim |

Resting flow used during construction cannot pass a normal-flow validation
gate. Stronger independent checks include plateau/knee/decline shape
([Canty et al.](https://doi.org/10.1161/01.RES.63.4.821)), human plateau
direction ([Di Gioia et al.](https://doi.org/10.1016/j.jacc.2020.06.074)),
measurement-matched phasic flow
([Seligman/Nijjer et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC9724998/)),
transmural reserve ordering
([Nohara et al.](https://doi.org/10.1016/0002-8703(89)90005-7)), and separation
of structural from functional microvascular endotypes
([Rahman et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7242900/)).

Those studies support normalized shapes and directions unless point-level data,
measurement stations, and uncertainty are frozen. Clinical Doppler velocity is
not a hidden compartment flow, and FFR/CFR/MRR-like outputs remain
model-defined research indices.

## Mechanical-support evidence

Mechanical-support sources describe engine-side research paths; the current
Standard exact fixture fixes dynamic support off.

| Role | Sources | Permitted use | Boundary |
| --- | --- | --- | --- |
| rotary pressure-flow topology | [Wang et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC3894974/) | construction of a signed pump/circuit relation | no universal product curve |
| Impella operating context | [FDA Impella CP IFU](https://www.fda.gov/media/140767/download) | product-domain and pressure-dependent-flow context | no displayed-flow accuracy or management claim |
| ECMO circuit topology | [ELSO circuit guideline](https://www.elso.org/Portals/0/files/pdf/ELSO_Guidelines_for_Adult_and_Pediatric_Membrane_Oxygenation_Circuits.pdf) | topology and pressure-station context | no cannula-position or treatment recommendation |
| IABP timing/displacement | [Sun](https://doi.org/10.1152/ajpheart.1991.261.4.H1300), [Schampaert et al.](https://pubmed.ncbi.nlm.nih.gov/23263334/) | event/timing construction context | no commercial controller or balloon-geometry claim |

Independent pump evidence must keep speed, pressure station, circuit loading,
and waveform definitions matched. Signed reverse flow and regime transitions
must be reported rather than clipped or smoothed. Mock-loop data can validate a
component or direction without validating a closed-loop patient response.

## Rhythm evidence

Alternative rhythm/conduction sources describe engine-side research paths; the
current Standard exact fixture fixes regular sinus rhythm.

Jørgensen-style recovery/concealment and rhythm-generation sources are
construction evidence. Independent checks must be subject-disjoint and may
separate:

- AV recovery and rate-step accommodation
  ([Denes et al.](https://doi.org/10.1161/01.CIR.49.1.32),
  [Lehmann et al.](https://doi.org/10.1016/0002-9149(84)90686-6));
- ventricular-interval irregularity at matched mean rate
  ([Clark et al.](https://doi.org/10.1016/S0735-1097(97)00254-4)); and
- stable flutter timing from raw, patient-disjoint records
  ([SHDB-AF](https://physionet.org/content/shdb-af/1.0.1/)).

MITDB-derived archives and annotations are not independent merely because they
have different dataset names. Origin lineage must be resolved before any
construction/held-out split.

The lumped rhythm owner does not produce ECG morphology, spatial propagation,
fusion, medication response, autonomic modulation, or patient-specific
arrhythmia. Whole-wall atrial activation cannot represent uncoordinated
regional atrial mechanics. PAC/PVC, block, escape, and pacing labels describe
reduced event phenotypes, not anatomical localization or diagnosis.

## Coupled independent evidence

The following studies are useful mainly for preregistered directions and
regime distinctions:

- matched-rate AV-sequential versus ventricular-only pacing may test the
  direction of cardiac-index and pulse-pressure change
  ([study](https://doi.org/10.1016/0002-9149(82)91947-6));
- matched-mean-rate irregular ventricular pacing may test cardiac-output and
  filling-pressure directions, not reproduce RV-apical pacing magnitude
  ([Clark et al.](https://doi.org/10.1016/S0735-1097(97)00254-4));
- Impella and peripheral VA support should not be collapsed into one generic
  LV pressure-volume response
  ([Møller-Helgestad et al.](https://doi.org/10.4244/EIJ-D-18-00684)); and
- mechanical support may change coronary perfusion differently across lesion
  regimes, so universal monotonic benefit is prohibited
  ([Kariya et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC7522595/)).

These coupled sources support H3 direction/regime checks unless matched raw
data and uncertainty justify an H2 protocol. They do not authorize device
selection or treatment recommendations.

## Measurement and credibility boundary

Physiological comparison is eligible only after numerical conservation,
rollback, checkpoint continuation, deterministic event handling, and temporal
discretization behavior are established for the tested protocol.

Measurements use accepted endpoints and declared units, pressure basis,
station, event definitions, and aggregation windows. A proxy may not be
silently relabeled as an unavailable clinical or physical quantity. Acceptance
metrics and tolerances are frozen before inspecting the result.

Evidence and claims follow the risk-informed separation described by the
[FDA computational modeling guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/assessing-credibility-computational-modeling-and-simulation-medical-device-submissions)
and
[ASME V&V 40](https://www.asme.org/codes-standards/find-codes-standards/assessing-credibility-computational-modeling-through-verification-and-validation-application-to-medical-devices).
No numerical, component, or coupled gate by itself establishes clinical
validity, diagnosis, treatment efficacy, or certification.
