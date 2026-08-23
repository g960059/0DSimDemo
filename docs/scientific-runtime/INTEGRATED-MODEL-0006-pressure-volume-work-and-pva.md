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
3. a low-volume preload-reduction chain starts at the settled operating point;
4. every next fixed-TBV load is warm-started from its preceding settled point,
   down to `60%` of source TBV;
5. source coronary tone is held fixed and each load must pass two consecutive
   complete-beat flow/pressure/volume closure comparisons;
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

For every retained load point, the on-demand analysis retains the exact
capture-to-capture accepted-step path work from its settled completed beat.
The operating-point value, rather than a re-integration of the display loop,
owns SW.

## PVA V1 operational definition

The method identity is:

```text
main-wire-integrated-model-settled-hot-start-pva-v1
suga-pva-area-max-common-isochrone-exponential-edpvr-settled-preload-reduction-v2
```

The pressure basis is ventricular transmural pressure.

### SW

For the settled operating-point beat,

```text
SW = acceptedTransmuralPathWorkMmHgMl
```

This is the accepted-substep path-work observer above, evaluated over the same
completed beat that supplies the point's compact phase loop and landmarks.
The `10 ms` phase loop is retained for relation fitting and display, not as a
second SW owner.

### ESPVR

The primary relation uses one atrial-capture-relative absolute time across the
settled preload-reduction loops. At each candidate time it fits a
volume-quadrature-weighted, monotone nonlinear pressure law and evaluates

```text
J(t) = integral over the fixed end-systolic-landmark volume domain of
         [P_iso(V,t) - P_ED(V)] dV
```

The time with the largest positive admissible `J(t)` owns ESPVR. A monotone
quadratic is used when supported by at least five points; otherwise the same
density-weighted fit falls back to a line. Linear Ees and V0 remain summary
statistics rather than owning the displayed curve or PE geometry.

Separately, the analysis retains `max_t P_iso(V,t)`, its winning time at every
sampled volume, and the resulting time range. This pressure envelope diagnoses
how strongly the single-common-time assumption fails; it does not own PE or
the estimated MVO2. Semilunar-valve closure is likewise retained only as a
comparator.

### EDPVR

V1 explicitly tests an exponential passive relation:

```text
P_ed = A [exp(B (V_ed - V0_ed)) - 1]
```

`A`, `B`, and `V0_ed` are selected by a fixed bounded,
volume-quadrature-weighted grid fit to positive-pressure maximum-volume
landmarks from the settled load family. The current beat-metric owner labels
these points `maximum-volume`; therefore production calls them an
end-diastolic proxy rather than claiming inlet-valve closure.

### PE and PVA

Let `V_x` be the left ESPVR–EDPVR intersection preceding the
operating-point end-systolic volume. Then,

```text
PE = integral from V_x to V_es of
       [P_ESPVR(V) - max(0, P_EDPVR(V))] dV

PVA = SW + PE
```

The result is unavailable unless the left intersection exists and
`P_ESPVR(V) > P_EDPVR(V)` at every sampled interval through `V_es`. Equality is
allowed only at the zero-area left boundary. One `mmHg*mL` is `1.33322e-4 J`.

## Estimated LV MVO2

For the LV only, production maps scenario-specific PVA through the classic
literature relation:

```text
MVO2_per_beat_per_100g = 1.8e-5 * PVA_per_100g + 0.02
```

LV mass is derived from the active model definition's `LVFW + SEP` material
volumes and myocardial density. Per-beat MVO2 uses the current PVA; per-minute
MVO2 uses the measured duration of the same accepted beat rather than a fixed
heart rate. The slope and intercept are from the canine LV context reported by
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

- The load family is a one-sided, low-volume fixed-total-blood-volume sweep; it
  is not a transient venous-occlusion protocol. Its analysis fork extends to
  `60%` of source TBV without changing the Workbench TBV control.
- Coronary autoregulation tone is held at its source value during the bounded
  preload reduction. This avoids mixing a short mechanical response with
  repeated 25-second controller re-equilibration, but it is not a fully
  regulated steady-state family.
- End diastole uses the model's maximum-volume landmark in V1.
- The primary ESPVR is one nonlinear common isochrone. Its atrial-capture
  relative time maximizes the integrated positive pressure area above EDPVR
  over the fixed sampled volume domain. Volume-specific maximum-pressure
  phases are retained only as an envelope diagnostic, and semilunar closure
  remains a comparator.
- ESPVR and EDPVR fits use volume-quadrature weights so adaptive point density
  does not silently change the represented volume interval. The systolic law
  uses linear endpoint tangents outside its measured isochrone range.
- Fits are local to the sampled settled loads and are not clinical validation.

These limitations remain beside the result rather than being hidden in a
research certification layer. A future V2 can use inlet-valve-closure ED points
or a transient occlusion family if those changes materially improve the
teaching result.
