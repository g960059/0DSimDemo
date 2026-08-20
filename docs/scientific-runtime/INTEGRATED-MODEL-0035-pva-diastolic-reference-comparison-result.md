# Integrated model 0035: PVA diastolic-reference comparison result

## Result

This research-only comparison changes only the diastolic reference used in the
method-specific pressure-volume area calculation from integrated-model 0034.
The accepted path-work rule and all retained systolic relations are unchanged.

The comparison completed for every row that was already available in 0034:

| quantity                                             | count |
| ---------------------------------------------------- | ----: |
| attempted method-specific rows                       |   168 |
| paired dynamic/intrinsic comparisons                 |   105 |
| rows unavailable before this comparison              |    63 |
| intrinsic rows using the zero-pressure clamp         |    81 |
| intrinsic rows using positive-pressure interpolation |    24 |

No unavailable 0034 row was promoted. In particular, this comparison does not
repair the absent semilunar-closure landmarks or the negative-slope RV
minimum-volume relations.

## Why the original 5 by 5 pilot was extended

The sampled 5 by 5 intrinsic ventricular passive surface covered only:

- LV: 133.0 to 144.4 mL;
- RV: 144.6375 to 155.8 mL.

The systolic endpoints of the available PVA rows were much smaller:

- LV: 38.87 to 96.63 mL;
- RV: 37.73 to 122.39 mL.

There was therefore no direct volume overlap. Reporting an empty comparison or
silently extrapolating the local surface would not answer the research
question.

Two one-dimensional intrinsic passive slices were consequently continued from
the retained pilot with the same residual-merit Newton solver:

| varied chamber | fixed contralateral volume | model minimum | sampled maximum | zero-pressure crossing | points |
| -------------- | -------------------------: | ------------: | --------------: | ---------------------: | -----: |
| LV             |          RV = 150.21875 mL |       53.2 mL |        144.4 mL |            69.16367 mL |     37 |
| RV             |              LV = 138.7 mL |       66.5 mL |        155.8 mL |           103.13269 mL |     37 |

Each curve contains the five retained center-slice pilot points and 32
continuation intervals down to the model minimum. All extension points retained
finite candidates, scaled force below `1e-10`, and positive local-stability
eigenvalues. This establishes only the two sampled continuation paths, not a
new two-dimensional surface or a global branch.

## Intrinsic reference rule

Positive intrinsic pressure is represented by piecewise-linear interpolation
through the sampled center slice. The linearly interpolated zero-pressure
crossing defines the lower edge of the positive-pressure relation. Below that
crossing the research reference is explicitly clamped to zero:

\[
P_{\mathrm{passive}}^{\mathrm{slice}}(V)=
\begin{cases}
0, & V\le V_{0,\mathrm{slice}},\\
\text{piecewise-linear sampled pressure}, & V>V_{0,\mathrm{slice}}.
\end{cases}
\]

This clamp is a PVA method choice. It does not claim that the intrinsic model
has zero stress or zero stored energy below the crossing. No positive-pressure
extrapolation above the sampled curve is allowed.

For each retained positive-slope systolic line, the intrinsic potential-energy
term is

\[
PE_{\mathrm{intrinsic}}
=

\int_{V_{0,\mathrm{ES}}}^{V_{\mathrm{ES}}}
P_{\mathrm{ES}}(V)\,dV
-

\int_{V_{0,\mathrm{slice}}}^{V_{\mathrm{ES}}}
P_{\mathrm{passive}}^{\mathrm{slice}}(V)\,dV,
\]

where the passive integral is zero when the systolic endpoint lies below the
slice zero-pressure crossing. The second integral is evaluated exactly for the
piecewise-linear representation.

## Comparison magnitude

Replacing the dynamic maximum-volume reference with the intrinsic slice raised
PVA in all 105 paired rows. The increase was small relative to total PVA:

| chamber | paired rows | absolute increase, range | median increase | relative increase, range | median relative increase |
| ------- | ----------: | -----------------------: | --------------: | -----------------------: | -----------------------: |
| LV      |          63 |   0.000073 to 0.002837 J |      0.000456 J |        0.0047 to 0.1314% |                  0.0353% |
| RV      |          42 |   0.000137 to 0.005521 J |      0.001002 J |        0.0765 to 0.5949% |                  0.2237% |

Selected baseline-anchored isochronal rows were:

| chamber / beat | dynamic-reference PVA | intrinsic-reference PVA |  difference | relative difference |
| -------------- | --------------------: | ----------------------: | ----------: | ------------------: |
| LV / 1         |            3.137546 J |              3.140325 J | +0.002779 J |            +0.0886% |
| LV / 10        |            2.228755 J |              2.229575 J | +0.000820 J |            +0.0368% |
| LV / 21        |            2.158912 J |              2.161749 J | +0.002837 J |            +0.1314% |
| RV / 1         |            0.865599 J |              0.869170 J | +0.003571 J |            +0.4126% |
| RV / 10        |            0.201093 J |              0.201283 J | +0.000190 J |            +0.0945% |
| RV / 21        |            0.928085 J |              0.933605 J | +0.005521 J |            +0.5949% |

At beats 1, 10, and 21, the largest diastolic-reference change was only
0.16% to 0.46% of the LV systolic-method spread and 3.0% to 10.1% of the RV
systolic-method spread. Within this slice, the choice of systolic relation is
therefore the larger source of method variability.

## Interpretation

This result supports three limited conclusions:

1. An intrinsic myocardium-only passive reference can be inserted into the
   current method-specific `EW + PE` calculation without changing path work or
   the systolic methods.
2. For this transient trajectory and these two fixed-contralateral slices, the
   dynamic versus intrinsic diastolic-reference choice changes total PVA much
   less than the systolic-method choice.
3. Most retained systolic endpoints lie below the intrinsic zero-pressure
   crossing, so 81 of 105 rows use the explicit zero-pressure clamp rather than
   positive-pressure interpolation. The small difference is therefore partly
   a property of this clamp convention and the fitted systolic-line intercepts.

The result does not establish a generic PVA, a clinical EDPVR, a continuous or
global biventricular passive surface, or a pericardium-inclusive reference. It
does not add active stress to the passive curve, change a production output, or
establish oxygen consumption.

## Next step

The next useful PVA experiment should not add more certification machinery. It
should compare the same retained loop family against one
common-pericardium-inclusive constrained passive reference, while keeping the
same systolic and area methods. That directly measures whether the external
constraint changes PVA more than the intrinsic-reference substitution observed
here.
