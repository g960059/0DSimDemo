# Method-specific pressure-volume area research result

Status: exploratory result implemented; method-specific PVA values computed;
generic PVA, ESPVR, EDPVR, qualification, and oxygen-consumption claims remain
unestablished

## Why this slice exists

The preceding work established accepted ventricular pressure-volume paths, a
transient multi-load family, and several candidate systolic relations. It did
not actually combine a named systolic relation, a named diastolic reference,
and an area rule. This research slice makes that combination explicit and
computes the resulting values without adding another certification system.

The calculation reuses the existing 21-beat systemic venous-return trajectory
in memory. No production Output, Standard owner, artifact hash protocol, or
qualification status is introduced.

## Method tuple

Every reported row binds the following tuple:

```text
pressure basis:
  ventricular transmural pressure

systolic relation:
  baseline-anchored isochronal
  semilunar-flow closure
  minimum volume
  sampled common support envelope

diastolic reference:
  direction-specific positive-pressure offset-power fit
  through the maximum-volume landmark of each transient beat

external work:
  accepted trapezoidal PV path
  plus an explicit straight segment from the final endpoint to the first

potential energy:
  integral of systolic pressure minus diastolic pressure
  from their first upward intersection to the method's systolic endpoint

PVA:
  closed-path external work + potential energy
```

For a systolic line

```text
P_es(V) = E_es (V - V0)
```

and the exploratory dynamic diastolic reference

```text
P_ed(V) = alpha max(0, V - Vd)^beta,
```

the potential-energy term is evaluated analytically after numerically locating
their lower intersection. A row remains unavailable if the systolic relation
has nonpositive slope, its beat-specific landmark is absent, the references do
not close before the endpoint, or the area becomes negative or non-finite.

The conversion is `1 mmHg mL = 1.33322e-4 J`.

## Result

The single research execution attempted 168 rows:

```text
2 ventricles x 21 beats x 4 systolic methods = 168

available:   105
unavailable:  63
```

The unavailable rows have two transparent causes:

- all 42 semilunar-closure rows are unavailable because none of the retained
  ventricular flow traces supplied the required post-maximum strict
  positive-to-nonpositive crossing;
- all 21 RV minimum-volume rows are unavailable because the fitted relation
  has negative slope.

Those failures do not erase the isochronal and support-envelope results, or the
LV minimum-volume result.

### Selected PVA values

| Ventricle | Beat | State          | Available methods |     Range (J) | Spread (J) |
| --------- | ---: | -------------- | ----------------: | ------------: | ---------: |
| LV        |    1 | baseline       |                 3 | 2.4195–3.1375 |     0.7180 |
| LV        |   10 | peak occlusion |                 3 | 1.7100–2.2288 |     0.5188 |
| LV        |   21 | recovery       |                 3 | 1.5474–2.1589 |     0.6116 |
| RV        |    1 | baseline       |                 2 | 0.7810–0.8656 |     0.0846 |
| RV        |   10 | peak occlusion |                 2 | 0.1946–0.2011 |     0.0065 |
| RV        |   21 | recovery       |                 2 | 0.8732–0.9281 |     0.0549 |

At the nearly closed baseline beat, the LV values are:

| Systolic method              | External work (J) | Potential energy (J) | PVA (J) |
| ---------------------------- | ----------------: | -------------------: | ------: |
| baseline-anchored isochronal |            1.2865 |               1.8510 |  3.1375 |
| minimum volume               |            1.2865 |               1.1331 |  2.4195 |
| sampled support envelope     |            1.2865 |               1.2228 |  2.5093 |

The baseline LV endpoint mismatch is only about `5e-5 mL` and
`2.4e-4 mmHg`; its straight-closure correction is about `0.0059 mmHg mL`.
The transient beats are not independently settled loops. At beat 10 the LV
straight-closure correction is about `-765 mmHg mL`, and at beat 21 it is about
`+585 mmHg mL`. Those values are retained because the chosen area rule is part
of the method, but they prevent interpreting the transient rows as ordinary
steady-cycle PVA.

## What this establishes

- The model can now compute `EW + PE` for an explicit, versioned method tuple.
- Systolic-method choice materially changes the LV result.
- A missing semilunar-flow landmark can remain local instead of blocking all
  other PVA methods.
- The RV minimum-volume locus is unsuitable as a positive-slope systolic
  relation in this trajectory.
- The dynamic maximum-volume reference is numerically fit for both directions
  and ventricles (`R²` approximately 0.988–0.998), but remains an exploratory
  reference rather than an EDPVR.

## What this does not establish

This result does not establish a generic PVA, ESPVR, EDPVR, an independently
periodic orbit for every transient beat, an intrinsic passive reference,
physiological or clinical validity, MVO2, ATP use, or efficiency. In
particular, negative extrapolated volume intercepts and the transient
straight-closure corrections must remain visible rather than being hidden
behind one unqualified PVA number.

The next useful step is comparison of the dynamic maximum-volume reference
against the existing intrinsic passive reduced surface and, later, a
common-pericardium-inclusive passive reference. That comparison can change the
diastolic member of the tuple without changing the external-work or systolic
method definitions introduced here.
