# Bounded calcium-time / passive-material interaction

Research only. The preceding passive contrast found that changing the filling
operating point can improve reserve but does little to improve ET or EF.
Earlier calcium-time probes at a different slack/material/loading point
lengthened ejection and improved high-side reserve, while impairing E/A and
Tei. That prior result is not assumed to transport unchanged to this point.

Run two new independent cold 2 ms jobs: length-sensitivity scale 0.8,
Tref 238816.54628141236 Pa, slack 1.06, HR 70, TBV 5200 mL, Rsys 1.10,
arterial PV-law scale 0.6 and root L 0, at passive scales 1.04 and 1.248.
Both use ventricular calcium-time scale 1.1. Their exact source-time controls
are the already completed passive-factorial-v1 rows, not newly refitted
controls. The passive input also scales the SLS modulus.

The matched-alpha source dilation preserves periodic Ca extrema, not the
entire waveform or Ca integral. Atrial timing and sources, HR, material
kinetic rates and all other parameters remain fixed. This is a declared
source-waveform counterfactual, not an ordinary source-locked baseline fit,
a measured intact-human Ca calibration or an admitted production model.

Use two numerical workers and existing lean settling/full terminal readback.
Record pressure, CI, ET, gradients, ICT, IRT, Tei, E/A, EF, volumes, filling
pressure, morphology and solver diagnostics together. Do not change the
current numerical cutoffs. No afterload stress test. Advance at most one
point to independent fine resolution and fixed-control reserve only if the
joint response warrants it; a small number of passing gates is not the sole
selection rule. No new dynamical state, material law or fitting framework.
