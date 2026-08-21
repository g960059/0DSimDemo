# Integrated model 0038: phase-wise Emax candidate and baseline research PVA

## Result

A 64-phase isochronal scan identifies compact maximum-elastance candidates for
both ventricles. Combining those relations with periodic mechanical-ledger
external work and the intrinsic passive center slices produces one baseline
research PVA per ventricle:

| ventricle | periodic external work | potential energy | baseline research PVA |
| --------- | ---------------------: | ---------------: | --------------------: |
| LV        |               1.2865 J |         0.2950 J |              1.5815 J |
| RV        |               0.4243 J |         0.1641 J |              0.5884 J |

Both values remain `extrapolation-dependent-baseline-pva`. Neither systolic
line intersects the intrinsic passive slice inside their common measured
domain, so these are research constructions rather than domain-supported or
generic PVA values.

This study introduces no new qualification system, evidence journal, public
Output, or metabolic mapping.

## Inputs

The calculation uses three existing research owners:

1. one fresh deterministic reproduction of the 21-beat systemic venous-return
   trajectory, sampled into 64 phase-aligned points per beat and ventricle;
2. the 1 ms periodic five-wall mechanical ledger for baseline external work,
   with the 0.5 and 0.25 ms values retained as numerical context; and
3. the fixed-contralateral intrinsic passive center slices.

Raw accepted-step arrays and waveform traces are not written to the result.
The artifact retains only the 256 fitted phase relations, two candidates,
leave-one-beat-out summaries, and two baseline PVA decompositions.
The transient trajectory, periodic ledger, and intrinsic passive slice are
separate research inputs; this study does not claim that their source identity
has been authenticated as one shared artifact lineage.

## Phase-wise systolic relation

For each of 64 phase samples, ventricle, and trajectory direction, the study
fits

```text
P_tm(V, phase) = E(phase) V + b(phase)
V0(phase) = -b(phase) / E(phase)
```

using the 11 occlusion or 11 release beats. The primary candidate is the
earliest maximum positive occlusion slope. Release is retained both at the
occlusion-selected phase and at its independently selected peak.

| ventricle | occlusion phase |              E |       V0 |      R² | volume span |       RMSE |
| --------- | --------------: | -------------: | -------: | ------: | ----------: | ---------: |
| LV        |        0.125000 | 1.7997 mmHg/mL | 15.19 mL | 0.99964 |    16.29 mL | 0.185 mmHg |
| RV        |        0.109375 | 0.4652 mmHg/mL | 13.40 mL | 0.98275 |    47.04 mL | 1.025 mmHg |

The selected phase is stable to leave-one-occlusion-beat-out deletion:

- LV remains at phase index 8 in all 11 deletions. Its slope range is
  1.7799–1.8030 mmHg/mL and its V0 range is 14.67–15.26 mL.
- RV remains at phase index 7 or 8. Its slope range is 0.4496–0.4741 mmHg/mL
  and its V0 range is 12.17–18.63 mL.

Release agrees more closely for RV than LV. At the occlusion-selected phase,
RV release slope differs by about -1.4%. LV release slope is about 31.7%
higher, and its independent peak occurs one phase sample earlier. This is a
material protocol-direction diagnostic. It prevents promoting the LV relation
to one direction-independent operational ESPVR.

## Baseline external work

Transient beats are used only to identify the systolic relation. Their
straight endpoint closures are not used as external work.

Baseline external work is the negative of the periodic ledger's trapezoidal
cavity work on the wall. The 1 ms values are primary because the transient
family uses the same nominal step. The finer-grid values are context only:

| ventricle |      1 ms |    0.5 ms |   0.25 ms |
| --------- | --------: | --------: | --------: |
| LV        | 1.28645 J | 1.28934 J | 1.29079 J |
| RV        | 0.42431 J | 0.42583 J | 0.42656 J |

This removes the largest semantic problem in the earlier transient rows: no
synthetic straight segment is renamed as stroke work.

## Passive reference and extrapolation

The baseline systolic endpoint is inside the intrinsic passive sampled domain
for both ventricles. The potential-energy term nevertheless starts at the
extrapolated systolic volume-axis intercept because no systolic-passive
intersection exists in the common supported interval.

A future supported result must also retain the systolic line above the
piecewise-linear passive reference from the lower intersection through the
endpoint. The implementation checks the intersection, endpoint, and every
intervening passive knot, so a second crossing cannot be hidden by a positive
net area.

| ventricle | endpoint volume | fitted V0 | line area outside fitted volume range | observed-domain strip |
| --------- | --------------: | --------: | ------------------------------------: | --------------------: |
| LV        |        64.78 mL |  15.19 mL |                                45.19% |              0.1217 J |
| RV        |        86.14 mL |  13.40 mL |                                12.49% |              0.0767 J |

The phase-wise relation greatly reduces the extrapolation problem seen in the
baseline-maximum-pressure construction, but does not eliminate it. The prior
intrinsic-reference baseline values were 3.1403 J for LV and 0.8692 J for RV.
The new values are about 49.6% and 32.3% lower, respectively. This confirms
that systolic-relation selection, rather than the small dynamic-versus-
intrinsic passive-reference difference, owns most of the prior spread.

## Interpretation

This result establishes that:

- phase-wise maximum-elastance candidates can be computed from the existing
  transient family;
- their selected phases are locally stable under leave-one-beat-out deletion;
- one periodic baseline `EW + PE` decomposition can be formed without using
  transient synthetic closure as external work; and
- phase-wise selection materially reduces the remote-V0 dependence of the
  baseline construction.

It does not establish:

- a direction-independent operational Emax or ESPVR;
- a domain-supported or generic PVA;
- a clinical EDPVR;
- whole-heart energy, MVO2, ATP use, or efficiency; or
- a production or public Output.

## Next decision

The research UI should present the phase scan, selected relation, release
sensitivity, periodic EW, PE, total area, and extrapolated fraction together.
No single unqualified PVA headline should be shown.

If a domain-supported lower intersection is required, the next numerical study
should widen the preload family rather than add another area formula. The LV
occlusion-release difference should also remain visible when deciding whether
one relation can represent both directions.

Before an older V2 geometry row is promoted, its merged diagnostic should be
corrected separately: nonpositive relations must be distinguished from missing
methods, bitwise endpoint closure must not stand in for numerical periodicity,
and the predecessor result families need semantic row-level binding. Those
corrections do not require another 21-beat model run and are not silently folded
into the phase-wise result above.
