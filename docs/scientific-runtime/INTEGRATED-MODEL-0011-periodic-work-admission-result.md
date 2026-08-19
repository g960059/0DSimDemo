# Periodic ventricular-work admission result

Status: preregistered numerical-refinement and pressure-basis gates passed;
periodic work eligible for sealed official Experiment results; public live
Output Catalog and PVA remain unadmitted

## Lineage

The complete policy and executable runner were committed as `c11dbef1` before
the first new 0.5 ms execution. The retained compact evidence is
[`evidence/periodic-work-admission-v1.json`](evidence/periodic-work-admission-v1.json),
with canonical payload SHA-256
`276d11e9bfc1a9fc4da5a05a47aa12c52ad539fadf29fe2ee13988b3f01b3b81`.

No tolerance, denominator, arm, pressure basis, P1 policy, or pass condition
was changed after inspecting the fine result.

## Numerical-refinement result

Both normal-default runs independently reached canonical P1 and shared the
same complete model-condition hash. Their protocol hashes were distinct, as
required by their numerical grids. Exact checkpoint round trips, complete
accepted traces, closure gates, and both ventricular pressure bases passed.

| Chamber / pressure basis | 1 ms (mmHg·mL) | 0.5 ms (mmHg·mL) | Scaled difference | Limit | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| LV cavity absolute | 9649.2628 | 9669.9800 | 0.2142% | 1% | pass |
| LV transmural | 9649.2628 | 9669.9800 | 0.2142% | 1% | pass |
| RV cavity absolute | 3182.6556 | 3193.9837 | 0.3547% | 1% | pass |
| RV transmural | 3182.6556 | 3193.9837 | 0.3547% | 1% | pass |

The 1 ms arm reached P1 after 71 cycles and the 0.5 ms arm after 72 cycles.
Neither result is a clinical normal value. The comparison establishes only the
declared numerical stability of this exact default canonical orbit.

## Pressure-basis result

Both required 1 ms real-model arms passed biventricular cavity and transmural
closure, exact checkpoint round trip, and
`W_cavity = W_transmural + W_constraint` decomposition. Required condition and
protocol identities were valid and distinct.

| Arm | P1 cycle | LV `W_cavity / W_transmural / W_constraint` | RV `W_cavity / W_transmural / W_constraint` | Result |
| --- | ---: | ---: | ---: | --- |
| normal-default | 71 | 9649.2628 / 9649.2628 / 0 | 3182.6556 / 3182.6556 / 0 | required pass |
| PEEP 10 cmH2O | 27 | 8977.8739 / 8977.8563 / 0.0176 | 2925.5082 / 2925.5054 / 0.0028 | required pass |
| pericardial fluid 200 mL | 164 | 5872.4062 / 5914.5670 / -42.1608 | 1961.9955 / 1997.5293 / -35.5338 | characterization pass |

All values are signed mmHg·mL. The largest observed decomposition residual was
`6.37e-12 mmHg*mL`, below the preregistered `1e-8 mmHg*mL` limit.

The PEEP external-constraint term is near zero. Because the qualifier retains
the actual accepted path and permits a small preregistered endpoint-closure
residual, it is not forced to exactly zero by an artificial closing segment.
The much larger signed difference in the non-gating effusion arm shows why a
variable pericardial constraint must remain explicit. It is a model
characterization, not a validated effusion/tamponade magnitude or direction
claim.

## Admission decision

The executable decision is:

```text
numericalRefinementAdmissionPassed         = true
pressureBasisAdmissionPassed               = true
officialExperimentOutputAdmissionEligible  = true

publicLiveOutputCatalogAdmissionEstablished = false
pvaAdmissionEstablished                    = false
physiologicalValidationEstablished          = false
clinicalValidationClaimed                   = false
```

An official Experiment may therefore seal and reference periodic LV/RV cavity,
transmural, and external-constraint work together with this analysis identity
and eligibility evidence. It must not replace the existing live
capture-to-capture transmural **path work** output with the settled P1 value or
call either quantity PVA.

## Next boundary

The next scientific step is not another EW formula. It is a separately frozen,
multi-load measurement protocol for event-defined end-systolic/end-diastolic
points, ESPVR/EDPVR fit diagnostics, measured-domain and failure policy, and PE
geometry. Only that layer can decide a PVA pressure-basis contract. An absolute
PVA-to-MVO2 mapping remains a later fitting and held-out-validation project.
