# PV boundary guides and bidirectional load-series analysis

## Product boundary

The Workbench deliberately exposes two different objects on the LV pressure–
volume pane. They must not be presented as interchangeable measurements.

1. **Textbook PV guides** are immediate orientation aids. They are enabled by
   default, require no additional simulation, and are drawn from the latest
   complete LV beat. They are not measured multibeat ESPVR/EDPVR relations.
2. **Load-series analysis** is an opt-in research protocol under pane settings.
   It runs additional fixed-total-blood-volume branch simulations, applies
   event and numerical quality gates, and may reject a curve.

The visible graph legend continues to name only the physiological series
(`Left ventricle`). The guide distinction belongs in pane settings and
accessible descriptive text, not in a larger permanent legend.

## Immediate textbook guides

All internal guide construction uses LV transmural pressure. When the pane is
displayed with chamber pressure, a local external-pressure offset from the
selected contact is added as a display translation. That translated curve is
not a separately fitted intracavitary relation.

### Systolic orientation line

The display convention fixes `V0_guide = 0` and selects a plausible systolic
sample that maximizes

\[
E_{guide}=\frac{P_{LV,tm}}{V_{LV}-V0_{guide}}.
\]

The resulting support line passes through the upper-left systolic boundary of
the displayed beat and is extended modestly above it for the familiar
textbook appearance. `V0_guide`, its slope, and the contact must not be
reported as measured `V0`, `Ees`, or a formal multibeat ESPVR.

### Diastolic orientation curve

The end-diastolic anchor preferentially uses the sustained transition from
forward mitral flow to closed/non-forward flow while the aortic valve is not
forward-flowing. Maximum LV volume is a degraded fallback when the event
signals are unavailable.

For an anchor `(Vm, Pm)` with `0 < Pm < 30 mmHg`, the display uses the
single-beat normalized construction described by Klotz et al.:

\[
V_0=V_m(0.6-0.006P_m),
\]

\[
V_{30}=V_0+\frac{V_m-V_0}{(P_m/28.2)^{1/2.79}},
\]

\[
P(V)=28.2\left(\frac{V-V_0}{V_{30}-V_0}\right)^{2.79}.
\]

The curve is anchored exactly at the displayed ED contact. It fails closed
outside the supported filling-pressure range, for incomplete cycles, or for a
non-LV pressure/volume pairing.

## Advanced fixed-TBV analysis

Protocol V3 retains V2's lower-loading lane and adds a higher-loading-direction
lane. Both start from immutable clones of the same accepted source state. TBV,
model parameters, and all non-intervention controls remain fixed; the sole
intervention is a bounded change in `VC_RA` resistance.

- lower-loading direction: increased `VC_RA` resistance with achieved lower LV
  EDV;
- higher-loading direction: decreased `VC_RA` resistance with achieved higher
  LV EDV.

The second lane is therefore a resistance perturbation with an achieved EDV
increase. It is not saline loading, passive-leg raising, literal blood-volume
loading, or an in-vivo caval-occlusion experiment. Each lane owns its own
direction, periodicity, alternans, event, fit-point, and span checks. The lanes
are not pooled into one relation until direction-equivalence and hysteresis
have been validated.

The current persistent-worker transport evaluates the independent lanes
serially. This avoids a second correlation/cancellation protocol while the
model kernel is still changing. Parallel lane workers remain a performance
follow-up, not a scientific claim.

Formal systolic endpoints currently use the end of sustained forward aortic
ejection. A true iterative maximum-elastance endpoint is explicitly marked
unsupported until full-resolution post-ejection trajectories and iterative
`V0` convergence are validated. Thus Advanced is more rigorous than the
default guide, but it is still an experimental model protocol rather than a
patient measurement or a universally valid intrinsic ventricular property.

## References

- Suga H, Sagawa K, Shoukas AA. Load independence of the instantaneous
  pressure-volume ratio of the canine left ventricle and effects of epinephrine
  and heart rate on the ratio. *Circ Res*. 1973.
  <https://pubmed.ncbi.nlm.nih.gov/4691336/>
- Kass DA, Midei M, Graves W, Brinker JA, Maughan WL. Use of a conductance
  (volume) catheter and transient inferior vena caval occlusion for rapid
  determination of pressure-volume relationships in man. *Cathet Cardiovasc
  Diagn*. 1988. <https://doi.org/10.1002/ccd.1810150314>
- Klotz S, et al. Single-beat estimation of end-diastolic pressure-volume
  relationship. *Am J Physiol Heart Circ Physiol*. 2006.
  <https://doi.org/10.1152/ajpheart.01240.2005>
- Burkhoff D, Mirsky I, Suga H. Assessment of systolic and diastolic
  ventricular properties via pressure-volume analysis. *Am J Physiol Heart
  Circ Physiol*. 2005. <https://doi.org/10.1152/ajpheart.00138.2005>
