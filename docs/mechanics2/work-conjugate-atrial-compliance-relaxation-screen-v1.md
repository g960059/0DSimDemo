# Work-conjugate atrial compliance-relaxation screen V1

## Question and claim boundary

This report-only screen asks whether making the LA wall more passively
distensible and/or accelerating the current phenomenological LA contractile
state relaxation is sufficient to correct the x descent and separate transmitral
E and A in the closed-left-heart sidecar.

It does not change runtime wiring or defaults, does not fit patient data, and
does not claim that a wall stress-scale multiplier is a measured global atrial
compliance. The tested model remains `WorkConjugateAVPlaneLeftHeartV1`; right
heart, pulmonary arterial/capillary dynamics, respiration, baroreflex and full
pericardial interaction remain outside the system boundary.

## Separated factors

The screen is a 3 by 3 factorial design:

- both LA passive wall stress scales are multiplied by 0.4, 0.7 or 1.0;
- only `activationModel.params.contractileKinetics.offRatePerSec` is set to 20,
  30 or 50 per second.

The first intervention changes the passive pressure-volume response. The second
changes the realized contractile-state RT50 without changing passive mechanics.
They are deliberately not represented by a single "atrial expansibility"
parameter.

For auditability, the artifact reports a fixed-AV-plane, passive local tangent:

\[
C_{LA,\mathrm{local}}
=
\left(
\frac{P_{LA}(V+\Delta V)-P_{LA}(V-\Delta V)}{2\Delta V}
\right)^{-1},
\]

at 75 mL, zero activation and `z = 0`. This is only a local diagnostic. In the
coupled solution, effective LA compliance also depends on AV-plane motion,
activation, loading and the operating point on the nonlinear wall law.

## Result

All nine cases remain finite, periodic and inside the existing mass, force and
power residual thresholds. The local passive tangent spans 5.69 to 14.22
mL/mmHg and realized contractile RT50 spans 82 to 108 ms.

The baseline and highest-compliance anchors are repeated at 0.5, 1 and 2 ms.
This is an anchor-dose continuity check rather than a global convergence proof;
all replicas retain the same complete-fusion/zero-diastasis classification and
pass the mechanical hard gates.

At the baseline active-relaxation dose, the most distensible wall advances the
x trough from cycle phase 0.210 to 0.051 and removes the post-MVC secondary
pressure rise. It does not separate E and A: all nine cases remain classified as
complete fusion with zero diastasis. In that same passive comparison, residual
mitral velocity at atrial activation increases from 44.70 to 47.26 cm/s, and the
y descent becomes shallower (2.76 to 1.93 mmHg).

The bounded conclusion is therefore:

> Passive LA expansibility is an effective x-descent lever in this sidecar, but
> it is not a sufficient E/A-separation or y-descent solution. Faster active
> relaxation over the tested range is also insufficient by itself.

A sparse orthogonal follow-up combines passive scales 0.4 and 1.0 with LV
longitudinal/circumferential active-stress maxima ratios 0.45, 0.55 and 0.65.
The shared AV-plane remains a solved force-balance coordinate, not a prescribed
trajectory. All six cases pass the mechanical gates, but all remain complete
E/A fusion with zero diastasis. Thus the tested passive-compliance by AVPD-driver
interaction is not an E/A solution either.

This direction is consistent with the hydrodynamic relation reported by Thomas
et al.: for a fixed effective mitral area, larger net atrioventricular
compliance is associated with a less steep E-wave downslope rather than an
automatic earlier termination of early filling. It is also consistent with
Barbier et al.'s separation of early reservoir function into LA relaxation and
later reservoir function into LV base descent; passive stiffness alone is not a
complete x-descent mechanism.

## Next experiment

Retain passive stiffness, active relaxation and the shared AV-plane driver as
independent axes. Attribute E-wave tail duration to the early-diastolic LA-LV
pressure-gradient system (LV relaxation, mitral inertance/resistance and
pulmonary venous loading) before changing the active-stress source law. No case
in this report is a promotion candidate.

## Literature used for mechanism interpretation

- Thomas JD et al. *Calculation of atrioventricular compliance from the mitral
  flow profile: analytic and in vitro study*. J Am Coll Cardiol. 1992.
  <https://pubmed.ncbi.nlm.nih.gov/1552125/>
- Barbier P et al. *Left atrial relaxation and left ventricular systolic
  function determine left atrial reservoir function*. Circulation. 1999.
  <https://pubmed.ncbi.nlm.nih.gov/10421605/>
- de Vecchi A et al. *Investigating the importance of left atrial compliance on
  fluid dynamics in a novel mock circulatory loop*. 2024.
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC10803730/>
