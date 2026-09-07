# Reference model-form comparison — 2026-09-06

Construction research only, not independent normality validation. No public
baseline, modelID, Surface, analysis feature or physiological gate is changed.
No afterload stress test. No amplitude-box midpoint is a target.

## Component stage (executed first)

Compare the current six-state selected Land, that material without its extra
strong-bridge exit, the complete source whole-organ six-state Land, and our
four-state fast-weak-bridge reduction of the latter. The reduction eliminates
weak population and weak distortion by their quasi-steady equations; it is not
the published Land model and has its own schema. Fixed-length equilibrium
matching, population nonnegativity, immutable trial input, and time-step
convergence are code-tested before considering a coupled implementation.

Use identical prescribed calcium and stretch assays for all families. Both
calcium profiles are model constructions, not digitized human measurements.
Run two time resolutions and three reference stretches with +/-2% neighbors.
Numerical range position is separate from physical admissibility and reserve.
The Land sensitivity cap at 1.2 is not a measured normal sarcomere boundary.

The current geometry prior deliberately sets stretch 1.1 at its loaded reference.
Its additional published Land scale 1.09 gives 1.199; the research scale 1.06
gives 1.166 there. These are different physical stretch maps, not interchangeable
labels. Actual dynamic free-wall stretch is also affected by the coupled geometry.

Prescribed recorded LVFW paths do not predict new coupled pressures, PV loops,
ET, CI or preload reserve. Diagnostic amplitude matching to a current isometric
peak is not physiological Tref calibration. Do not select a model on that peak
or on one favorable waveform alone.

## Closed-loop follow-up (frozen after seeing component results, before execution)

The source six-state material produced greater force on the recorded shortening
path despite its lower Tref. Therefore test it in the existing authenticated
closed-loop runner before implementing a new four-state mechanics provider.
This is explicitly a results-informed follow-up, not held-out confirmation.

Factorial: source Land whole-organ constants (Tref120 kPa, kuw182/s, kws12/s,
Aeff25, beta1-2.4, no extra exit) x Land slack{1.06,1.09} x ventricular calcium
floor{0.164321,0.11 microM}. The calcium peak stays0.592586 microM; common
matched-alpha time scale remains1.1. This is complete source *material* but not
the source paper's entire heart/calcium assembly. No claim these discrete
settings constitute human normal parameter limits.

Keep the previous research circulation fixed: HR70/BSA1.9/TBV5200/Rsys1.10,
systemic arterial PV-law amplitude0.6, ventricular passive+SLS scale1.248,
proximal Ao-SA L0, existing pulmonary root and other settings. In particular,
the vascular storage law is not silently reinterpreted as isolated compliance.

Cold start each condition;4 independent workers, lean accepted-step execution,
dt2ms, existing period-1 3-consecutive-cycle rule and maximum250cycles. Retain
all rest gates/warnings and shape diagnostics as observations. First screen has
no reserve protocol; only a plausible family proceeds to 1ms/cold and fixed-tone
low/high preload qualification. Rest infeasibility is not cured by widening gates.

## Sources and limits

- Land et al. 2017, DOI10.1016/j.yjmcc.2017.03.008: source equations and their
  distinct cell/whole-organ calibration context. Four-state elimination is ours.
- Regazzoni et al., DOI10.1007/s10013-020-00433-z: original analysis of generalized
  Huxley reductions supports considering macroscopic identifiability. Its
  constant-permissivity discussion does not by itself specify a complete
  calcium-controlled twitch model; a two-moment model is not treated as a
  ready-to-use heart replacement here.

The first component-v1 invocation stopped before simulation because its source
snapshot referenced an incorrect solver filename. Retained as failed setup;
component-v2 corrects the path. No candidate result was generated in v1.
