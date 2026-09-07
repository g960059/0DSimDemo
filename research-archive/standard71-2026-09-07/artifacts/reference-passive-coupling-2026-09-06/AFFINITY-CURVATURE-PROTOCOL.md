# State-free affinity-curvature component contrast

The analytic fixed-length assay confirms a source-transfer amplification of
relative length sensitivity when CaT50Ref2.5 becomes0.805 with beta1-2.4 fixed.
This is not proof that the intact source is wrong: preparations and fits differ.
No new numerical clinical threshold follows from the Tanner permeabilized data.

Test one smaller model-form alternative at component level only:

  linear: CaT50 = CaRef + beta1 * (min(lambda,1.2)-1)
  log-affine: CaT50 = CaRef * exp(beta1/CaRef * (min(lambda,1.2)-1))

Both match value and derivative at lambda1 for each beta1. The existing1.2
length cap is retained and no new state or continuous parameter is added.
The exponential positive-affinity law is a mathematical modelling hypothesis,
not a thermodynamically calibrated molecular law or a human normality claim.
Use beta1-2.4 and-1.92 to distinguish curvature from slope. All four retain
the same selected material Tref238816.5463 and actual Ca source.

For these fixed histories only, evaluate the alternative using equivalent
Ca input to the existing linear kernel: Ca_eff = Ca_actual * CaT50_linear /
CaT50_alternative. This leaves Eq47's dimensionless ratio identical; the
selected bridge exit depends on CaTRPN, not Ca_eff. This is a component
computational adapter, not an altered physiological Ca waveform, admissible
checkpoint, or implemented exact model. Preserve actual Ca and adapter policy
in the result. A coupled implementation would require derivative, solver,
hash/provenance and regression coverage; do not use this trick in the runtime.

Reuse TBV5050/5656 and5200 accepted histories, hold geometry/passive/length
fixed, and use time-defined late ejection. Advance only if force is usefully
redistributed without major filling active-force increase. Do not choose by
cosmetic curve shape or add a free exponent fit.
