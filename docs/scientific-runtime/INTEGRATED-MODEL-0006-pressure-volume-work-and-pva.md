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

1. a PV pane, a structural Starling/Guyton pane, or a PVA-family output needs
   the shared settled relation family;
2. the existing background analysis Workers capture the current Scenario;
3. independent low- and high-volume persistent chains start at the same settled
   operating point (concurrently when two analysis Worker leases are present);
4. every fixed-TBV load is warm-started from the preceding settled point on
   that limb; the adaptive low limb reaches at least `60%` and then may extend
   toward the existing Starling low-flow boundary;
5. source coronary tone is held fixed and each load must pass the protocol's
   declared consecutive complete-beat flow/pressure/volume closure checks;
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
suga-pva-area-max-common-isochrone-nonlinear-espvr-exponential-edpvr-settled-preload-family-v5
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
settled bidirectional preload family. Every currently available qualified
settled point participates in phase selection. At each candidate time those
contemporaneous pressure-volume points form a shape-preserving nonlinear
isochrone, and the analysis evaluates

```text
J(t) = integral over the current isochrone's measured volume domain of
         [P_iso(V,t) - P_ED(V)] dV
```

The time with the largest positive admissible `J(t)` owns the common
isochrone. The analysis recomputes this selection whenever another settled
load arrives, so both the selected time and the measured curve may evolve as
the bidirectional sweep expands. Three or four points use C0 piecewise-linear
interpolation; five or more use a monotone shape-preserving C1 cubic Hermite
curve. During an in-flight update the Workbench keeps drawing the last valid
relation until a newly admissible relation replaces it; that visual retention
does not retain stale PVA, PE, or MVO2 output values. The final family owns the
final selected phase and curve. This measured nonlinear locus owns PE, PVA,
and the PVA input to the literature MVO2 mapper. It is never drawn beyond its
measured range.

For teaching, Pane Settings can instead show the tangent to this locus at the
operating-point end-systolic volume. It reports a local elastance and a visual
volume-axis intercept, but it is explicitly display-only: it neither owns PVA
nor imposes a positive `V0`. This avoids presenting an endpoint secant or a
global straight-line fit as if it were a model-native ESPVR.
Negative apparent intercepts are not silently clamped: curvature and the fitted
load range are known to move linear ESPVR intercepts substantially
([Kass et al., PMID 2910541](https://pubmed.ncbi.nlm.nih.gov/2910541/)).

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
landmarks from both qualified preload directions. The current beat-metric owner labels
these points `maximum-volume`; therefore production calls them an
end-diastolic proxy rather than claiming inlet-valve closure.

### PE and PVA

Let `V_x` be the left ESPVR–EDPVR intersection preceding the
operating-point end-systolic volume. Inside the measured systolic range,
`P_ESPVR` is the selected shape-preserving common isochrone. If the left
intersection lies below the lowest measured point, only that unresolved tail
uses the lowest point's local tangent; the result records whether that
extension was used and its span. Then,

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

The nonlinear common-isochrone PVA used here does not reproduce the canine
coefficient study's loading protocol. The output therefore retains that
mismatch as a machine-readable limitation. Curved ESPVR experiments have
reported preserved linearity of the oxygen-consumption/PVA relation
([Nozawa et al., PMID 9689149](https://pubmed.ncbi.nlm.nih.gov/9689149/)), but
that supports using PVA as an explanatory variable; it does not calibrate this
model-specific nonlinear boundary or its intercept.

This is visibly labelled **estimated MVO2**. It does not model or measure:

- crossbridge ATP use;
- calcium cycling;
- basal metabolism or heat;
- model-specific contractility-dependent unloaded cost;
- RV or whole-heart oxygen consumption; or
- patient-specific or clinical oxygen demand.

## Current limitations

- The load family is a bidirectional fixed-total-blood-volume sweep, not a
  transient venous-occlusion protocol. Its low analysis limb extends to at
  least `60%` of source TBV and may continue toward the Starling low-flow
  boundary without changing the Workbench TBV control.
- Coronary autoregulation tone is held at its source value during the bounded
  preload reduction. This avoids mixing a short mechanical response with
  repeated 25-second controller re-equilibration, but it is not a fully
  regulated steady-state family.
- End diastole uses the model's maximum-volume landmark in V1.
- The primary ESPVR is one nonlinear common isochrone. Its atrial-capture
  relative time maximizes the integrated positive pressure area above EDPVR
  over the contemporaneous measured domain of every currently available
  settled point. The selection is intentionally updated as the family grows.
  Volume-specific maximum-pressure phases are retained only as an envelope
  diagnostic, and semilunar closure remains a comparator.
- EDPVR fitting uses volume-quadrature weights so adaptive point density does
  not silently change the represented volume interval. The primary systolic
  curve is not extrapolated for display; only the unresolved low-volume PE tail
  uses its measured endpoint tangent.
- Fits are local to the sampled settled loads and are not clinical validation.

These limitations remain beside the result rather than being hidden in a
research certification layer. A future V2 can use inlet-valve-closure ED points
or a transient occlusion family if those changes materially improve the
teaching result.
