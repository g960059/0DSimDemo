# Periodic multi-load valve-event PV locus preregistration

Status: initial 0.74 input was rejected before model initialization because it
fell below the declared TBV input domain; corrected 0.75 policy must be
committed before the first new independent nine-load numerical output

## Preflight amendment before numerical output

The initial declaration used the existing formal-family lowest ratio `0.74`.
At the default 5600 mL baseline this resolves to 4144 mL, below the validated
hemodynamic input domain `[4200, 7000] mL`. The first command stopped in input
validation before model initialization, settlement, or any numerical output.

The lowest ratio is therefore corrected to `0.75`, exactly 4200 mL. No fit,
event point, pressure, volume, work, or convergence result was available when
this correction was chosen. The executable policy records the attempted
value, input-domain bound, rejection stage, and the negative output-inspection
claims. The corrected policy requires a second declaration commit before the
first numerical run.

## Decision boundary

This protocol decides whether the model can retain a reproducible,
biventricular pressure-volume locus at inlet-valve and semilunar-valve closure
across a local fixed-total-blood-volume family. A pass admits those measured
event points for a sealed official Experiment result.

It does **not** admit ESPVR, EDPVR, potential energy, PVA, MVO2, a live Output
Catalog item, a physiological normal range, or a clinical claim. Those names
remain false even when a descriptive line fits the semilunar-closure points.

## Why the names are deliberately narrower

The existing accepted-step observer defines:

- LV/RV end diastole at the first MV/TV positive-to-nonpositive flow crossing;
- LV/RV end ejection at the first AoV/PV positive-to-nonpositive flow
  crossing; and
- both cavity-absolute and ventricular-transmural pressure at the linearly
  interpolated crossing.

These are useful and unambiguous valve-event landmarks. They are not by
definition the maximum time-varying-elastance points. Human measurements found
that end-ejection/dicrotic-notch and other convenient definitions of end
systole can materially underestimate isochronal `Emax`
([Starling et al. 1987](https://pubmed.ncbi.nlm.nih.gov/3594773/)). The original
time-varying-elastance work instead considered instantaneous multi-load
pressure-volume relationships
([Suga and Sagawa 1974](https://pubmed.ncbi.nlm.nih.gov/4841253/)). ESPVR may
also become detectably curvilinear outside a local operating range or as
contractile state changes
([Burkhoff et al. 1987](https://pubmed.ncbi.nlm.nih.gov/2438948/)).

Likewise, an inlet-closure pressure-volume point is a dynamic whole-cycle
observation. It includes active relaxation, atrial contraction, ventricular
interaction, pericardial load, and vascular loading. It is not an ex vivo or
quasistatic passive EDPVR. The Klotz single-beat construction is an empirical
population-shape estimator, with the authors explicitly noting better group
than individual accuracy; it is not permission to relabel this model's
inlet-closure locus
([Klotz et al. 2006](https://pubmed.ncbi.nlm.nih.gov/16428349/)).

## Frozen execution

All nine loads are independent cold starts. No point inherits the accepted
state, controller history, coronary tone, or numerical trajectory of an
adjacent load.

| Item | Frozen value |
| --- | --- |
| Baseline | default complete hemodynamic and mechanism fixture |
| TBV ratios | 0.75, 0.82, 0.90, 0.96, 1.00, 1.06, 1.12, 1.18, 1.24 |
| Nominal step | 0.001 s |
| Maximum cycles | 250 per load |
| Settlement | canonical full accepted-state P1 |
| Slow controllers | fully active |
| Chambers | LV and RV |
| Pressure bases | cavity absolute and ventricular transmural |
| Sampling | every accepted endpoint, including event-clipped substeps |
| Branch history | none; independent cold start per load |

Every load must pass P1, finite/conservation/event checks, exact terminal
checkpoint round trip, and complete terminal-cycle lineage. The exact terminal
sample of the preceding cycle is retained separately as the left endpoint of
the first accepted segment. This closes a previously implicit trace boundary:
the protocol cannot miss a crossing between cycle start and its first accepted
endpoint.

The nine complete model-condition hashes must be valid and distinct. The
protocol identity must be valid and shared across loads, because only the
fixed-TBV condition changes. The load set must be exact and bilateral around
the baseline.

## Frozen event gate

For each of MV, AoV, TV, and PV, closure is:

```text
q_previous > 0 and q_next <= 0

crossing fraction = q_previous / (q_previous - q_next)
```

Time, chamber volume, cavity pressure, and transmural pressure are linearly
interpolated on that same accepted segment. Each valve must have exactly one
closure crossing in the terminal cycle. MV/TV closure must precede AoV/PV
closure, and event-defined stroke volume must be nonnegative. Missing or
multiple crossings fail closed; the first plausible point is not silently
selected from an ambiguous cycle.

## Descriptive line and measured diastolic locus

For each chamber and pressure basis, ordinary least squares summarizes the
nine semilunar-closure points. The diagnostic is labeled
`event-defined-end-ejection`, not ESPVR. It passes its preregistered descriptive
screen only when:

- all nine points are present;
- slope is positive;
- `R² >= 0.98`;
- RMSE divided by `max(observed pressure range, 1 mmHg)` is at most `0.08`;
  and
- maximum absolute residual on the same denominator is at most `0.15`.

The fixed 1 mmHg floor is a numerical denominator, not a biological
tolerance. A pass allows the line to be shown as a descriptive overlay beside
its points. Its extrapolated zero-pressure intercept may not define PE or PVA.
A failure leaves the measured points intact and rejects only the straight-line
summary.

The inlet-closure points remain a sorted measured locus. Volume and pressure
monotonicity are reported, but no polynomial, exponential, Klotz curve,
interpolation, zero-pressure volume, or extrapolation is admitted in this
protocol.

## PVA boundary retained

Suga's PVA is the area bounded by the systolic PV loop and end-systolic and
end-diastolic relations, and its oxygen relationship was established under a
stable inotropic background
([Suga et al. 1981](https://pubmed.ncbi.nlm.nih.gov/7457620/)). Therefore this
protocol cannot construct PE from convenient event labels alone. Its hardcoded
decision flags remain:

```text
ESPVR established = false
EDPVR established = false
PE established    = false
PVA established   = false
MVO2 established  = false
```

The next candidate protocol must compare an operational isochronal/maximal-
elastance systolic boundary with the end-ejection locus and separately expose
the model's passive chamber boundary under a declared biventricular and
pericardial constraint. Only then can PE geometry be preregistered.

## Evidence command

After this declaration and its executable policy are committed, execute
exactly:

```text
npm run verify:scientific:periodic-valve-event-locus-v1 -- \
  --output docs/scientific-runtime/evidence/periodic-valve-event-locus-v1.json
```

The compact artifact retains policy and decision objects, run identities,
cycle classifications, start/trace/checkpoint hashes, biventricular event
points, linear and monotonicity diagnostics, and admitted periodic work at each
load. Raw accepted traces remain hashed rather than being republished as a
presentation series.
