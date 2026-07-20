# VALIDATION-0006: HFrEF scenario expectation foundation

Status: evidence-contract foundation only; no release-bound HFrEF preset,
runtime auto-binding, calibration target, or independent validation is added by
this record.

## Purpose

This record defines the narrow claim that a future, explicitly authored HFrEF
reduced-contractility research scenario may test against its declared matched
healthy parent. The comparison is a construction-conformance check: it asks
whether an authored perturbation moved selected outputs in its preregistered
direction. It does not establish that the model represents HFrEF patients.

The distinction is deliberate. The FDA credibility framework makes model
credibility dependent on a stated context of use and the consequence of a
wrong decision. Pathmanathan and Gray likewise distinguish calibration,
component evidence, and reproduction of known behavior from validation against
data not used to build the model.

## V1 comparison contract

Any future runtime adapter must keep the pack absent unless it can resolve both
an exact HFrEF scenario-definition reference and its declared healthy-parent
evidence bundle. Names, labels, edit lineage, and user clones never imply
applicability.

When the binding is present, both subjects must use compatible release, metric,
and unit identities. Numerical verification for both runs is a prerequisite.
The future HFrEF scenario specification must separately declare which owners
are changed and which loading, rhythm, body-size, blood-volume, and controller
conditions are held fixed.

The dormant pack reserves only these paired directions:

| Metric | Expected direction from the declared healthy parent | Evidence role |
|---|---|---|
| LV ejection fraction | lower | construction conformance |
| LV end-systolic volume index | higher | construction conformance |

V1 does not emit or assess these rules in the product adapter. It does not
encode an EF diagnostic cutoff or a clinically meaningful minimum change. Each
rule remains inactive until a positive guard band is owned and versioned by an
executable scenario definition before results are inspected. A zero threshold
is intentionally rejected because numerical noise is not construction
conformance.

## Why the pack is this small

Published HFrEF pressure-volume summaries and patient-specific closed-loop
modelling support reduced LV active contractility, higher end-systolic volume,
and lower EF as useful coarse characteristics. They do not make one universal
resting haemodynamic phenotype.

The following are therefore intentionally excluded from V1 hard expectations:

- LV end-diastolic volume: chronic remodelling and acute contractility changes
  do not have the same volume response;
- LA pressure, LV filling pressure, or pulmonary wedge pressure: HFrEF may be
  clinically wet or dry;
- systemic or pulmonary pressure direction: this depends on loading,
  compensation, treatment, and the observation time;
- cardiac output or index direction: compensated HFrEF can have a preserved
  resting output, and the current runtime cannot yet prove matched loading,
  rhythm, controller, and observation-phase conditions; and
- waveform morphology, regional wall motion, neurohormonal adaptation,
  remodelling, exercise response, or treatment prediction.

The 2026 Second Universal Definition of Heart Failure also moves away from a
single rigid LVEF cutoff. Consequently, an EF threshold such as 40% may be used
later as an explicitly labelled research or treatment-trial bracket, but not as
a universal diagnostic or validation boundary in this pack.

## Evidence semantics

- Domain: `scenario-contract`.
- Modality: `direction`.
- Scope: `scenario`.
- Record role: `construction-conformance`.
- Empirical dataset references: empty.
- Product activation: deferred; no HFrEF record is emitted by the current
  Quick Check adapter.
- A healthy-reference miss remains a separate exploratory finding; it is not
  rewritten as an expected deviation.
- A passing direction record means only that the specified construction moved
  in the intended direction.
- Future empirical validation must use a separate
  `independent-validation` profile with held-out data and must not upgrade these
  construction records in place. The V2 boundary enforces agreement among a
  profile's declared domain and evidence role, its owned rules, and each
  record's evidence role.

## Runtime boundary

The current scientific-product catalog has no release-bound HFrEF scenario.
The legacy teaching case is not a scientific-product scenario definition and
must not be bound implicitly. Production application stays disabled until the
integrated base model has an immutable HFrEF definition and an explicitly
declared healthy companion. Coronary, mechanical-support, and rhythm work may
therefore proceed without this foundation assigning scientific meaning to
their intermediate states.

Activation additionally requires content-addressed child and parent scenario
definitions, a shared matched-context manifest, the exact complete numerical
verification profile for both runs, and runtime resolution of every declared
digest. The matched-context manifest must identify changed owners, held-fixed
owners, controller state, rhythm, loading, body size, blood volume, and the
observation phase. The V2 structural validator preserves these declarations;
it does not by itself resolve external artifacts or prove that a dataset was
truly withheld from calibration.

## Sources used to delimit the claim

These sources motivate the design and its limitations. They are contextual
references, not an independent validation dataset for this model.

- Walsh MN et al. AHA/ACC/ESC/WHF Expert Consensus Document: Second
  Universal Definition of Heart Failure (2026). *European Heart Journal*.
  [doi:10.1093/eurheartj/ehag500](https://doi.org/10.1093/eurheartj/ehag500)
- Warriner DR et al. Closing the loop: modelling of heart failure progression
  from health to end-stage using a meta-analysis of left ventricular
  pressure-volume loops. *PLoS ONE*. 2014;9:e114153.
  [doi:10.1371/journal.pone.0114153](https://doi.org/10.1371/journal.pone.0114153)
- Jones E et al. Phenotyping heart failure using model-based analysis and
  physiology-informed machine learning. *Journal of Physiology*. 2021;599:
  4991-5013.
  [doi:10.1113/JP281845](https://doi.org/10.1113/JP281845)
- Konstam MA, Abboud FM. Ejection fraction: misunderstood and overrated.
  *Circulation*. 2017;135:717-719.
  [doi:10.1161/CIRCULATIONAHA.116.025795](https://doi.org/10.1161/CIRCULATIONAHA.116.025795)
- Nohria A et al. Clinical assessment identifies hemodynamic profiles that
  predict outcomes in patients admitted with heart failure. *Journal of the
  American College of Cardiology*. 2003;41:1797-1804.
  [doi:10.1016/S0735-1097(03)00309-7](https://doi.org/10.1016/S0735-1097(03)00309-7)
- Pathmanathan P, Gray RA. Validation and trustworthiness of multiscale models
  of cardiac electrophysiology. *Frontiers in Physiology*. 2018;9:106.
  [doi:10.3389/fphys.2018.00106](https://doi.org/10.3389/fphys.2018.00106)
- U.S. Food and Drug Administration. Assessing the Credibility of
  Computational Modeling and Simulation in Medical Device Submissions. 2023.
  [FDA guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/assessing-credibility-computational-modeling-and-simulation-medical-device-submissions)
