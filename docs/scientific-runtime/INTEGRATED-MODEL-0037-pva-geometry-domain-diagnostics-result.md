# Integrated model 0037: PVA geometry and domain diagnostics V2

## Result

The 105 numeric `EW + PE` rows retained by integrated models 0034–0036 are
useful exploratory constructions, but none is ready to be exposed as an
unqualified pressure-volume area.

This result does not rerun the 21-beat transient model. It re-examines the two
compact V1 inputs and separates three quantities that the original result
combined:

1. accepted open-path pressure-volume work;
2. the synthetic straight segment used to close a transient path;
3. systolic-line area inside and outside the volumes that supplied the fitted
   relation.

It also searches for the first systolic–passive intersection only inside the
common supported volume domain. No new certification, commit lock, journal, or
production Output is introduced.

## Row classification

Every one of the 168 method rows is classified separately for the dynamic
maximum-volume reference and the intrinsic passive center slice.

| classification              | dynamic reference | intrinsic reference |
| --------------------------- | ----------------: | ------------------: |
| domain-supported PVA        |                 0 |                   0 |
| transient PVA-like area     |                21 |                  61 |
| endpoint out of domain      |                84 |                  44 |
| systolic method unavailable |                63 |                  63 |

`Out of domain` has a narrow meaning: the retained systolic endpoint itself is
below or above the supported passive-reference interval. A row is instead
called a `transient PVA-like area` when its endpoint is supported but one or
more of the following remain true:

- the retained path needs a synthetic straight closure;
- the systolic-line area extends outside the landmark/contact volume range;
- no systolic–passive intersection exists in the common supported domain;
- the dynamic passive fit touches its declared search-grid boundary.

No arbitrary percentage threshold is used to turn those diagnostics into a
pass or failure.

## Synthetic closure is material on most transient beats

The result retains 42 unique chamber-beat work decompositions. None has exact
endpoint closure.

For the absolute synthetic-closure work divided by absolute accepted open-path
work:

| statistic |      value |
| --------- | ---------: |
| minimum   | 0.00000061 |
| median    |    0.10153 |
| maximum   |    0.26988 |
| above 1%  |    36 / 42 |
| above 5%  |    31 / 42 |

The closed-polygon number remains available as a diagnostic, but the straight
segment is not measured external work. Consequently, transient rows are not
renamed or promoted to steady-cycle PVA.

## Most systolic area is outside the fitted landmark range

For each available row, the systolic line is integrated from the retained
lower intersection to the beat-specific endpoint. The area is then split at
the actual landmark/contact volume range.

| statistic | line area outside measured range |
| --------- | -------------------------------: |
| minimum   |                          0.15723 |
| median    |                          0.81805 |
| maximum   |                          1.00000 |
| above 50% |                         81 / 105 |
| above 75% |                         70 / 105 |

For the sampled common-support method, V1 labelled the full compact-loop range
as `measuredVolumeRangeMl`. V2 reports that range but uses the 11 retained
support contacts as the relation's actual measured range. All four support
relations have a narrower contact range than the old raw-loop range.

This explains why changing the diastolic reference in 0035 produced a small
percentage change: the much larger extrapolated systolic triangle dominates
the total.

## Passive-reference domain

The dynamic maximum-volume fit is supported only over its positive-pressure
landmark range. Eighty-four endpoints lie below that range and 21 lie inside
it. All four dynamic fits touch at least one search boundary:

- both LV fits select the lowest tested volume offset;
- both RV fits select the largest tested exponent, `beta = 4.5`.

The intrinsic passive slice is supported from the model minimum through the
largest sampled continuation point. Forty-four endpoints lie below the model
minimum, so V2 no longer extends the zero-pressure clamp into that unmodelled
region. The remaining 61 endpoints lie inside the sampled interval.

Neither reference has a systolic–passive intersection inside its common
supported domain for any available row. The V1 lower intersection or
volume-axis intercept is therefore retained only as source history; it is not
treated as a domain-supported lower boundary for a corrected PVA.

V2 can retain a nonempty common-domain strip for 21 dynamic-reference rows and
59 intrinsic-reference rows. For those rows it reports the signed area of
`systolic pressure - passive pressure` over only the observed overlap. This
strip is a diagnostic of the data-supported geometry, not a replacement PVA
and not an extrapolated closure to a remote volume intercept.

## Small software corrections

Two prospective V1 failure boundaries were tightened without changing the
committed V1 result artifacts:

- a zero-slope linear relation now makes that relation locally unavailable
  instead of aborting all methods;
- the first and last accepted sample times must exactly match the retained beat
  interval before a path is projected.

## Interpretation and next step

The result establishes why the existing absolute values should not yet appear
as ordinary product PVA. It does not invalidate the accepted path, landmarks,
or comparative research value of 0034–0036.

The next product-facing step can now be small: an internal research diagnostic
view may show method, passive reference, pressure basis, open-path work,
synthetic closure fraction, systolic extrapolation fraction, and row
classification. It must not show one unqualified PVA headline.

The next scientific step is not another large passive campaign. It is a
phase-wise isochronal and relation-identifiability study aimed at finding a
systolic relation whose intercept and integration interval are supported by
the observed transient family.
