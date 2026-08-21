# Integrated V3 pressure-volume work, PVA, and MVO2 estimate

Status: accepted-step path-work observer and on-demand Workbench PVA analysis
implemented; LV MVO2 is a literature-coefficient estimate, not a metabolic
submodel

## Product boundary

PVA belongs in the pressure-volume Workbench pane. Production has no dedicated
PVA page and does not ship the research lane's ledgers, large artifacts,
auditors, or archived protocol UI. The detailed history remains available at
immutable tag
[`research-pva-mvo2-558-573-final`](https://github.com/g960059/0DSimDemo/tree/research-pva-mvo2-558-573-final).

The production workflow is deliberately direct:

1. the user enables **Settled PVA / MVO2 analysis** in a PV pane;
2. the existing background analysis Workers capture the current Scenario;
3. the hypovolemic and hypervolemic partitions run in parallel;
4. each partition starts at the settled operating point and warm-starts every
   next fixed-TBV load from its preceding qualified point;
5. each load must pass full accepted-state period-1 closure;
6. the merged settled point family is projected to SW, ESPVR, EDPVR, PE, PVA,
   and, for the LV, a literature MVO2 estimate; and
7. progress, cancellation after Scenario edits, cache reuse, and bounded
   history use the existing Workbench analysis runtime.

No ledger quantity is needed to produce the result. This is intentional: the
mechanical-port ledger cannot own crossbridge cycling, calcium uptake/release,
basal metabolism, or absolute myocardial oxygen consumption.

## Accepted-step pressure-volume path observer

The model also publishes capture-to-capture LV and RV path work:

```text
myocardium.work.external.LV-transmural-pressure-volume-path
myocardium.work.external.RV-transmural-pressure-volume-path

W_path = - sum_i 0.5 * (P_tm,i + P_tm,i+1) * (V_i+1 - V_i)
unit: mmHg*mL
```

It consumes every accepted numerical endpoint, including event-clipped
substeps, and is checkpoint-continuable. It remains a path integral until a
declared closed periodic beat exists; it is not renamed PVA or MVO2.

The on-demand PVA projector instead integrates the complete retained anchor PV
loop with the same trapezoidal sign convention. The anchor belongs to the
settled load family, so the resulting positive value is reported as SW.

## PVA V1 operational definition

The method identity is:

```text
main-wire-integrated-model-settled-hot-start-pva-v1
suga-pva-linear-espvr-exponential-edpvr-settled-fixed-tbv-v1
```

The pressure basis is ventricular transmural pressure.

### SW

For the settled operating-point loop,

```text
SW = - closed_trapezoidal_integral(P_tm dV)
```

The formal protocol's complete retained `20 ms` loop sample, not the separately
decimated visible polyline, owns this calculation. This V1 SW estimate is not
the accepted-substep path-work observer above; a later payload extension can
carry that exact beat value without changing the PVA geometry.

### ESPVR

The primary V1 relation is the classic linear regression through settled
semilunar-valve-closure landmarks:

```text
P_es = E_es (V_es - V0_es)
```

A quadratic regression through the same points is retained as a nonlinear
diagnostic. It reports curvature, fit quality, and whether its derivative is
positive throughout the measured volume range. It does not silently replace
the primary linear Suga convention.

### EDPVR

V1 explicitly tests an exponential passive relation:

```text
P_ed = A [exp(B (V_ed - V0_ed)) - 1]
```

`A`, `B`, and `V0_ed` are selected by a fixed bounded grid fit to positive-
pressure maximum-volume landmarks from the settled load family. The current
beat-metric owner labels these points `maximum-volume`; therefore production
calls them an end-diastolic proxy rather than claiming inlet-valve closure.

### PE and PVA

At the operating-point end-systolic volume,

```text
PE = integral from V0_es to V_es of
       [P_ESPVR(V) - max(0, P_EDPVR(V))] dV

PVA = SW + PE
```

The result is unavailable when the relations do not define a positive finite
decomposition. One `mmHg*mL` is `1.33322e-4 J`.

## Estimated LV MVO2

For the LV only, production maps scenario-specific PVA through the classic
literature relation:

```text
MVO2_per_beat_per_100g = 1.8e-5 * PVA_per_100g + 0.02
```

LV mass uses the fixed normal-adult `LVFW + SEP` material-volume convention
(`108.3 g`), and the V1 teaching projection uses `60 beats/min`. The slope and
intercept are from the canine LV context reported by
[Suga et al. (PMID 3790043)](https://pubmed.ncbi.nlm.nih.gov/3790043/).
[PMID 1478216](https://pubmed.ncbi.nlm.nih.gov/1478216/) supplies supporting
human linearity context, not the coefficient calibration.

This is visibly labelled **estimated MVO2**. It does not model or measure:

- crossbridge ATP use;
- calcium cycling;
- basal metabolism or heat;
- model-specific contractility-dependent unloaded cost;
- RV or whole-heart oxygen consumption; or
- patient-specific or clinical oxygen demand.

## Current limitations

- The load family varies fixed total blood volume; it is not a transient
  venous-occlusion protocol.
- Slow controllers remain fully active while each load settles, so the family
  is not a pure instantaneous preload change at frozen inotropy.
- End diastole uses the model's maximum-volume landmark in V1.
- Linear ESPVR is the primary Suga convention; quadratic curvature is
  diagnostic only.
- Fits are local to the sampled settled loads and are not clinical validation.

These limitations remain beside the result rather than being hidden in a
research certification layer. A future V2 can use inlet-valve-closure ED points
or a frozen-slow-controller chain if those changes materially improve the
teaching result.
