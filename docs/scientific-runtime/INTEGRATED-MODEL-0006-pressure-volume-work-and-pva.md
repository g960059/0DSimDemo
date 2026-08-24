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
   toward the existing Starling low-flow boundary, while the high limb attempts
   the full measured `1.08–1.40×` schedule unless it encounters a numerical
   boundary;
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
suga-pva-anchor-local-late-systolic-area-max-common-isochrone-nonlinear-espvr-exponential-edpvr-settled-preload-family-v8
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

The primary relation uses one atrial-capture-relative absolute time. Every
currently settled load contributes to the contemporaneous shape-preserving
nonlinear isochrone. The scoring interval is fixed before the time search from
the operating anchor's retained end-systolic volume:

```text
D_anchor = [0.9 V_ES,anchor, 1.1 V_ES,anchor]

J(t) = integral over D_anchor of
       [P_iso(V,t) - max(0, P_ED(V))] dV
```

Every candidate must cover that complete physical volume interval without
pressure extrapolation and must remain above the nonnegative EDPVR throughout
it. Candidate time is restricted to the operating anchor's late-systolic
window: from its maximum-pressure phase to its retained end-systolic phase,
with `0.025` cycle of margin on each side. The analysis evaluates 32
deterministic coarse times inside that window and subdivides the two neighboring
coarse intervals around the winner into 32 local intervals. This compares all
candidates on the same physical pressure-volume domain while avoiding an
all-cycle search dominated by phases unrelated to end systole. It is only the
phase-selection score; PE and PVA remain physical pressure-volume integrals.
Monotonicity is not used to preselect a smaller set of times; the selected
relation is checked separately over the actual low-volume-to-anchor PVA
domain. As later low- or high-TBV points settle, the common time, nonlinear
locus, and full-family EDPVR may all update; `D_anchor` and the anchor-derived
time window do not. Three or four points use C0 piecewise-linear interpolation;
five or more use a
shape-preserving C1 cubic Hermite curve. The low-volume-to-anchor-ESV PVA
domain must be strictly pressure-increasing. A later point above
the operating anchor may reveal a turn in the fixed-phase surface section; it
is retained as measured diagnostic geometry. During an in-flight update the
Workbench keeps drawing the last valid relation until a newly admissible
relation replaces it; that visual retention does not retain stale PVA, PE, or
MVO2 output values. This measured nonlinear locus owns PE, PVA, and the PVA
input to the literature MVO2 mapper. It is never drawn beyond its measured
range. No separate classical `Ees`/`V0` line is fitted or displayed.

Separately, the analysis retains `max_t P_iso(V,t)` over the currently sampled
family, its winning time at every sampled volume, and the resulting time
range. Pane Settings can add this upper pressure envelope as a thin overlay;
the option is off by default. It diagnoses how strongly the single-common-time
assumption fails and does not own PE, PVA, or the estimated MVO2.

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
  relative time maximizes positive active-pressure area over the fixed
  `0.9–1.1 ×` anchor-ESV interval within the anchor late-systolic window. All
  settled loads participate, so the phase may update as the sweep expands.
  Volume-specific maximum-pressure phases are retained only as an optional
  envelope diagnostic.
- EDPVR fitting uses volume-quadrature weights so adaptive point density does
  not silently change the represented volume interval. The primary systolic
  curve is not extrapolated for display; only the unresolved low-volume PE tail
  uses its measured endpoint tangent.
- Fits are local to the sampled settled loads and are not clinical validation.

These limitations remain beside the result rather than being hidden in a
research certification layer. A future V2 can use inlet-valve-closure ED points
or a transient occlusion family if those changes materially improve the
teaching result.
