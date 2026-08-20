# Integrated model 0036: PVA common-pericardium reference result

## Result

The normal-adult `healthy-slack` common pericardium did not change any PVA
value under the fixed passive-reference condition evaluated here.

| quantity                                                    | result |
| ----------------------------------------------------------- | -----: |
| method-specific rows retained from 0035                     |    168 |
| paired rows available before and after the check            |    105 |
| rows already unavailable in 0035                            |     63 |
| paired rows with changed PVA                                |      0 |
| maximum absolute constrained-minus-intrinsic PVA difference |    0 J |

This is an exact zero-branch result, not a small rounded difference.

## Fixed condition

The experiment retains the accepted path work, systolic relations, area rule,
and two intrinsic passive center slices from integrated models 0034 and 0035.
It adds the existing normal-adult common-pericardium owner at one explicit
condition:

- LA cavity volume: 35.72 mL;
- RA cavity volume: 47.31 mL;
- atrial-volume source: the normal-adult prior minimum-volume anchors;
- common intrathoracic pressure: 0 mmHg;
- pericardial case: `healthy-slack`;
- prescribed pericardial fluid: 0 mL.

The contralateral ventricular volume remains the fixed center-slice value from
0035: RV 150.21875 mL for the LV slice and LV 138.7 mL for the RV slice.

The common-pericardium reference heart volume is 600.12654 mL. Its exact zero
branch extends through 599.52642 mL total occupied volume. The largest occupied
volume in either sampled slice remained well below that boundary:

| varied chamber | maximum occupied volume | minimum slack margin | maximum pericardial excess pressure |
| -------------- | ----------------------: | -------------------: | ----------------------------------: |
| LV             |            565.96784 mL |          33.55858 mL |                              0 mmHg |
| RV             |            565.84909 mL |          33.67733 mL |                              0 mmHg |

All 74 sampled points therefore retained zero pericardial stored energy, zero
pericardial pressure, and zero pericardial tangent. The constrained passive
pressure was bit-for-bit equal to the intrinsic passive pressure at every
sampled point. The zero-pressure crossings consequently remained 69.16367 mL
for LV and 103.13269 mL for RV.

## Pressure-basis boundary

The retained loops and systolic relations use ventricular transmural pressure.
A genuinely engaged common pericardium would instead add pressure relative to
the common intrathoracic space. Reusing the old systolic line after adding a
nonzero pericardial pressure only to the passive curve would mix pressure bases.

For that reason this comparison admits a row only when the common pericardial
excess pressure is exactly zero over the relevant reference interval. All 105
previously available rows satisfy that condition. No intrathoracic-pressure
systolic refit or pericardial path-work recomputation was performed.

## Mechanism positive control

The same 74 slice points were also evaluated with the existing
`effusion-300ml-positive-control`. This control is not used in any PVA row.

| varied chamber | engaged points | excess-pressure range |
| -------------- | -------------: | --------------------: |
| LV             |        37 / 37 |  34.72 to 126.00 mmHg |
| RV             |        37 / 37 |  35.64 to 125.80 mmHg |

The positive control distinguishes the healthy result from an unconnected or
ineffective pericardium implementation. It is a mechanism check, not a clinical
effusion simulation or an alternative PVA estimate.

## Interpretation

This result establishes a narrow but useful boundary: under the normal-prior
minimum-atrial-volume condition, the default healthy common pericardium is
structurally present but slack throughout the sampled passive reference. It
therefore adds no diastolic-reference contribution beyond the intrinsic slice.

It does **not** establish that the common pericardium is irrelevant during the
transient trajectory. A pressure-basis-matched pericardial PVA would require
recomputing the loop work and systolic relations relative to the common
intrathoracic space while retaining the time-varying total occupied volume.
That larger experiment was deliberately not inferred from compact artifacts.

This study does not establish a generic PVA, clinical EDPVR, production output,
oxygen consumption, or a dynamic pericardial energy contribution.

## Practical next step

The research lane now has explicit method-specific `EW + PE` values, an
intrinsic passive-reference substitution, and this healthy common-pericardium
boundary check. The next step should expose those existing PVA results directly
in a compact research comparison view or export. Another certification layer
or a larger passive-surface campaign is not needed before doing so.
