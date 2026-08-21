# Integrated model 0040: phase-wise PVA qualification V2 result

## Result

The first versioned, method-specific PVA values are now available as an
on-demand completed-protocol analysis:

| output | status             |         EW | PE equivalent |   PVA estimate |
| ------ | ------------------ | ---------: | ------------: | -------------: |
| LV     | `limited-estimate` | 1.286454 J |    0.295047 J | **1.581501 J** |
| RV     | `limited-estimate` | 0.424312 J |    0.164090 J | **0.588402 J** |

These values populate `mainOutputValueJ` for the explicit method
`suga-compatible-pva-estimate-phase-wise-venous-occlusion-fixed-passive-slice-v1`.
They are not an unqualified `PVA` alias.

## One analysis transaction

The V2 owner executes one canonical periodic P1 source and reuses that exact
checkpoint for both:

- the 21-beat transient venous-return-reduction family; and
- the 1 ms, 0.5 ms, and 0.25 ms periodic mechanical-work characterization.

The intrinsic passive surface is recomputed in the same owner invocation from
the canonical normal-adult passive candidate. It has its own static source and
protocol bindings; it is not a dynamic continuation of the periodic
checkpoint. The fixed contralateral ventricular volume therefore remains part
of the method identity and a visible limitation.

The complete analysis took approximately 2 minutes 34 seconds on the local
development machine used for this result. It is intentionally an explicit
on-demand operation. Ordinary simulation updates and UI rendering do not run
the 21-beat family or passive surface.

## Qualification diagnostics

The V2 analysis adds the bounded checks selected in 0039:

| diagnostic                                      |         LV |         RV |
| ----------------------------------------------- | ---------: | ---------: |
| baseline-beat exclusion, relative PVA change    |    0.0071% |    0.0270% |
| 64-to-128 phase resolution, relative PVA change |         0% |    4.1471% |
| selected-phase maximum normalized state span    |     2.2188 |     1.8803 |
| release-minus-occlusion slope fraction          |    +31.65% |     -1.40% |
| systolic area outside measured volume range     |     45.19% |     12.49% |
| 1 ms-to-0.25 ms external-work difference        | 0.004340 J | 0.002253 J |

The baseline-exclusion result is stable for both ventricles. The LV phase
selection is also unchanged at 128 samples. The RV estimate changes by about
4.15%, exceeding the declared 2% phase-resolution threshold.

Selected-phase calcium is effectively identical across the occlusion beats,
but mechanical state is not. Contralateral volume, wall strain, strain rate,
and several Land-state components retain substantial preload dispersion. A
common phase is therefore a useful relation-construction rule, not evidence
that all beats share one myocardial state.

## Why both outputs remain limited

The LV output retains:

- systolic-relation extrapolation;
- selected-phase state dispersion;
- occlusion-versus-release direction sensitivity; and
- a fixed-contralateral intrinsic passive reference.

The RV output retains:

- systolic-relation extrapolation;
- phase-resolution sensitivity;
- selected-phase state dispersion; and
- a fixed-contralateral intrinsic passive reference.

The values are still useful: their method, pressure basis, work source,
passive reference, sensitivities, and limitations are all explicit. The
limitations are reasons to show a `limited-estimate` label, not reasons to
hide the number.

## Product boundary

The output surface is `completed-protocol-analysis`. It is suitable for an
advanced on-demand analysis result and is not a live accepted-state signal.
The checked-in UI reads the last completed result; the scientific command can
regenerate it explicitly.

This result does not establish:

- generic or clinical PVA;
- a live single-beat PVA signal;
- oxygen consumption, ATP use, or MVO2;
- a pericardium-inclusive or atrial passive reference; or
- silent Levenberg-Marquardt fallback.

The next product step is execution infrastructure: run this owner outside the
render path, cache by scenario/checkpoint/method identity, and present the
limited status beside the values. Further scientific work should target the
retained limitations rather than invent another PVA definition.
