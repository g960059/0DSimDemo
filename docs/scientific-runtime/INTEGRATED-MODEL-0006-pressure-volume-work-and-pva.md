# Integrated V3 pressure-volume work and PVA boundary

Status: exact path-work observer and canonical normal-adult method-specific PVA
estimate implemented; myocardial oxygen-demand mapping not implemented

## Product and scientific priority

The pressure-volume loop is the primary explanatory and measurement plane for
ventricular mechanics. Chamber pressure and volume waveforms are complementary
projections of that trajectory. Guyton/Starling analysis supplies the
circulatory loading context in which the loop moves. This ordering applies to
future Experiments about chamber contractility, active relaxation, passive
stiffness, valve disease, mechanical support, and myocardial oxygen demand.

It does not make every loop-derived quantity exact by inspection. A displayed
loop may be decimated presentation data, and a fitted line may be an unsettled
orientation aid. Scientific values must have a model-owned accepted-step or
qualified-analysis owner.

## Implemented exact observer

Standard-61 introduced the capture-to-capture LV metric, and Standard-63 adds
the corresponding RV metric:

```text
outputIds:
  myocardium.work.external.LV-transmural-pressure-volume-path
  myocardium.work.external.RV-transmural-pressure-volume-path

W_path = - sum_i 0.5 * (P_tm,i + P_tm,i+1) * (V_i+1 - V_i)
unit: mmHg*mL
```

The accumulator consumes every accepted numerical endpoint, including
event-clipped substeps. The active integral is part of the exact checkpoint,
so restore continuation cannot discard or reconstruct the first part of the
path. Canvas sampling, history retention, and graph decimation are outside the
measurement owner.

The minus sign makes the usual counter-clockwise ventricular loop positive.
Pressure is explicitly the matching ventricular transmural pressure, aligning
with the current PV graph and isolating wall load from a common external
pressure offset. It must not be compared as though it were an absolute
intracavitary catheter-work value without an explicit pressure-basis
translation.

No artificial end-to-start segment is added. Capture-to-capture electrical
boundaries do not guarantee that a transient trajectory returns to its initial
volume and pressure. Consequently:

- `W_path` is always the accepted path integral;
- it may be interpreted as closed-loop transmural external work only after a
  declared periodicity/closure gate passes; and
- it is never renamed stroke work merely because the beat accumulator emitted
  a complete electrical window.

This output is not pressure-volume area, potential energy, myocardial oxygen
consumption, efficiency, or a clinical ischemia index. One `mmHg*mL` is
`1.33322e-4 J`; any joule projection should remain a presentation conversion,
not a second numerical integration.

## Production PVA estimate V1

Production exposes one deliberately narrow completed-protocol result at
`/:locale/analysis/pva`. It is computed only after an explicit user action and
is limited to the canonical normal-adult reference. The method identity is:

```text
suga-compatible-pva-estimate-phase-wise-venous-occlusion-fixed-passive-slice-v1
```

The retained compact inputs reproduce:

| chamber | periodic EW | PE equivalent | PVA estimate | status  |
| ------- | ----------: | ------------: | -----------: | ------- |
| LV      |  1.286454 J |    0.295047 J |   1.581501 J | limited |
| RV      |  0.424312 J |    0.164090 J |   0.588402 J | limited |

The output includes the pressure basis, Emax candidate, V0, measured volume
range, extrapolated area fraction, and the dominant sensitivity. It is not a
scenario-specific live output. It does not establish generic or clinical PVA,
and it does not establish MVO2 or oxygen consumption.

The exploratory owners, unsuccessful methods, large artifacts, and detailed
auditors remain in Git history on branch
[`research/pva-mvo2-558-573`](https://github.com/g960059/0DSimDemo/tree/research/pva-mvo2-558-573)
and tag `research-pva-mvo2-558-573-final`. They are not production runtime
dependencies.

## Generic PVA admission boundary

The hierarchy beyond the limited method-specific result remains:

```text
accepted LV PV path
  -> qualified closed-loop external work (EW)
  -> qualified multi-load systolic/passive relations and potential energy (PE)
  -> PVA = EW + PE
  -> separately calibrated PVA-to-MVO2 mapping
```

PE cannot be inferred honestly from one displayed loop. The existing
responsive fixed-TBV support envelope is explicitly a preview and cannot own
ESPVR, EDPVR, PE, PVA, or MVO2. The formal fixed-TBV analysis already provides
the correct isolation and periodic branch machinery, but its fitted relations
must receive a separately versioned operational definition and qualification
before they can close the PE region.

Standard-62 supplied the prerequisite biventricular event landmarks: MV/TV
closure defines LV/RV end diastole and AoV/PV closure defines LV/RV end systole,
all by accepted-step zero-crossing interpolation. Standard-63 additionally
publishes biventricular path work and accepted-step pressure-rate extrema. This
improves loop annotation and event-defined SV/EF, but it does not by itself
qualify ESPVR, PE, PVA, or MVO2.

A PVA release must freeze at least:

1. pressure basis and chamber scope;
2. named end-systolic and end-diastolic/event landmarks;
3. the admitted multi-load intervention and measured load range;
4. ESPVR/EDPVR fit family, constraints, diagnostics, and extrapolation policy;
5. the exact polygon/integral used for EW and PE;
6. periodicity, loop closure, self-intersection, and rejected-point policy;
7. checkpoint and model/analysis identity; and
8. uncertainty and validation status exposed beside the value.

No single-loop radial line, tangent, arbitrary `V0`, or post-hoc choice after
viewing the result may substitute for a failed multi-load fit. PVA must remain
unavailable when its qualification contract is not satisfied.

## Myocardial oxygen-demand boundary

PVA is the preferred long-term teaching bridge from mechanics to myocardial
oxygen demand. It should coexist with inexpensive contextual proxies such as
heart rate or rate-pressure product, but those proxies must not become the
mechanistic owner of the PV-loop lesson.

An absolute MVO2 output requires a separately identified and validated mapping,
including the PVA coefficient, unloaded/intercept cost, contractility-dependent
cost, heart-rate convention, unit conversion, calibration population, and
held-out validation. Until that exists, PVA and `PVA * heart rate` may be
reported only in their declared mechanical units and scientific status. A
plausible direction is not permission to assign an absolute oxygen-consumption
number.

## Graph and Experiment contract

The future PV renderer should consume the exact work/PVA result by Output ID and
shade the corresponding region from its model-owned geometry. It must not
reintegrate a decimated visible polyline. Tooltips and legends must distinguish
path work, qualified EW, PE, and PVA rather than displaying one generic area.

Experiments need not force the learner to preregister a hypothesis. They may
support hypothesis testing, guided comparison, or open observation. Official
claims, however, must bind their declared scenario roles and measurement
window to qualified outputs. Exploratory observations can be promoted later by
creating a new claim specification and rerunning the sealed numerical inputs;
the original observation is not rewritten into a preregistered result.

## Verification gates for the next release

Before `W_path` is promoted to qualified closed-loop EW, add all of:

- analytic clockwise/counter-clockwise and open-path fixtures;
- exact checkpoint continuation through an in-progress path;
- model `dt` refinement and event-boundary invariance;
- independence from presentation cadence and Canvas decimation;
- declared periodic pressure-volume closure tolerance;
- self-intersection and valve-event-order rejection;
- absolute-versus-transmural pressure-basis tests under PEEP/pericardial load;
  and
- directional Experiment sweeps for load and chamber-mechanics controls,
  recorded as observations before any clinical monotonicity claim is admitted.

PVA then adds multi-load fit recovery, fit-failure, measured-domain,
extrapolation, and geometry-reconstruction tests. The PVA-to-MVO2 mapping has a
separate fitting and held-out validation ledger; it cannot borrow numerical
verification as clinical validation.
