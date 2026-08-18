# Periodic ventricular-work admission preregistration

Status: policy and executable protocol committed as `c11dbef1` before the first
new 0.5 ms result; frozen protocol subsequently passed and is reported in
[INTEGRATED-MODEL-0011](INTEGRATED-MODEL-0011-periodic-work-admission-result.md)

## Decision boundary

This protocol decides whether periodic LV/RV pressure-volume work is stable
enough for use as a sealed official Experiment result. It does not admit an
instantaneous live Output Catalog item, pressure-volume area (PVA), myocardial
oxygen consumption, a physiological normal range, or a clinical claim.

The declaration commit must precede execution of the new 0.5 ms arm. Results
may pass or fail only the policy below. A failed result must not be rescued by
changing the tolerance, denominator, pressure basis, or required arms after
inspection.

The existing Standard numerical contract remains 1--10 ms. A separate,
analysis-only entry point owns the exact 1 ms and 0.5 ms pair. The shared 1 ms
arm is pinned against the Standard path by accepted-state checkpoint equality;
the additional 0.5 ms cycle executor is not a silent widening of the live
runtime contract.

## Numerical-refinement gate

Both runs are independent cold starts of the canonical P1 protocol under an
identical complete model-condition identity:

| Item | Frozen value |
| --- | --- |
| Coarse nominal step | 0.001 s |
| Fine nominal step | 0.0005 s |
| Required chambers | LV and RV |
| Required pressure bases | cavity absolute and ventricular transmural |
| Metric | `abs(coarse - fine) / max(abs(fine), 1 mmHg*mL)` |
| Maximum metric | 0.01 |
| Near-zero implication | at most 0.01 mmHg*mL absolute difference |
| Sign requirement | same sign when `abs(fine) >= 1 mmHg*mL` |
| Sampling | every accepted endpoint; no interpolation or resampling |

The fixed 1 mmHg·mL denominator prevents a tiny fine-grid value from turning
roundoff into an unbounded relative error while preserving a stricter absolute
criterion near zero. The 1% limit is an output-stability requirement, not a
biological tolerance. The earlier 10, 5, 2, and 1 ms characterization was known
when this policy was written; the new 0.5 ms value was not.

## Pressure-basis contract

For each accepted segment, the analysis retains three signed line integrals:

```text
W_cavity      = - integral P_cavity dV
W_transmural  = - integral P_transmural dV
W_constraint  = - integral (P_cavity - P_transmural) dV

W_cavity = W_transmural + W_constraint
```

`W_cavity` is the conventional intracavitary PV-loop external-work coordinate.
Suga's original PVA diagrams explicitly use intraventricular pressure measured
from atmospheric pressure. `W_transmural` is the ventricular-wall distending
load coordinate. `W_constraint` records energy exchanged with the common
external-pressure/pericardial boundary; it is not discarded or attributed
silently to myocardium.

A constant external-pressure offset contributes exactly zero to a closed loop,
which is covered analytically. A varying pericardial pressure may exchange
nonzero work and must satisfy the decomposition identity within
`1e-8 mmHg*mL`. This policy deliberately does **not** choose the future primary
PVA/MVO2 pressure basis. That decision requires the later multi-load PVA
definition and separate energetic calibration.

The distinction is required by the physical boundary. Measured intracavitary
pressure can be decomposed into transmural and pericardial/extracardiac
pressure, and contractile loading follows transmural rather than an arbitrary
uniform extracardiac offset. See
[Tyberg et al. 1978](https://pubmed.ncbi.nlm.nih.gov/668760/),
[Suga et al. 1980](https://www.jstage.jst.go.jp/article/jjphysiol1950/30/6/30_6_907/_pdf),
and the isolated-heart extracardiac-pressure experiment by
[Midei et al. 1987](https://doi.org/10.1007/BF02584289).

## Real-model pressure arms

All completed arms use the same 1 ms canonical P1 analysis route and must
retain exact checkpoint round-trip evidence.

| Arm | PEEP | Pericardial fluid | Role |
| --- | ---: | ---: | --- |
| `normal-default` | 0 cmH2O | 0 mL | required |
| `peep-10-cmh2o` | 10 cmH2O | 0 mL | required |
| `pericardial-effusion-200ml` | 0 cmH2O | 200 mL | characterization only |

Both required arms must establish biventricular cavity and transmural endpoint
closure and pass the work decomposition. Their condition and protocol hashes
must be valid and distinct. No direction or magnitude claim is attached to the
PEEP arm; it verifies that the pressure-boundary accounting remains explicit
under a non-default extracardiac-pressure condition.

The effusion arm is retained because a variable pericardial constraint is more
informative than a uniform offset, but it is not allowed to decide admission.
Failure or nonconvergence in this deliberately stronger characterization must
remain visible rather than being relabelled a required pass.

## Admission result

The final decision is a conjunction:

```text
official sealed Experiment work eligible
  = numerical-refinement gate passed
  AND both required pressure-basis arms passed
```

Even a pass leaves the following false:

- public live Output Catalog admission;
- PVA admission;
- physiological or population validation;
- clinical validation; and
- a PVA-to-MVO2 conversion.

Periodic work is a settled-cycle analysis result, not an instantaneous observer.
It may later be referenced by a sealed Experiment result. A separate product
contract would be needed if the live Workbench is to schedule, label, and show
that analysis without confusing it with capture-to-capture path work.

## Evidence command

After this preregistration is committed, execute exactly:

```text
npm run verify:scientific:periodic-work-admission-v1 -- \
  --output docs/scientific-runtime/evidence/periodic-work-admission-v1.json
```

The compact artifact records the frozen policy, input arm, numerical-access
identity, complete condition/protocol hashes, P1 result, raw terminal-trace
hash, exact checkpoint hash, pressure-work values and closures, decomposition,
refinement metrics, and final negative/positive admission flags. The complete
raw trace remains hashed rather than being mistaken for a presentation series.
