# Diastolic activation - generated measurements

All outputs below are research constructions, not the published baseline.

## Closed-loop screen (2 ms, lean settlement)

| Condition | AoP mmHg | CI | EF | ET ms | mPG / pPG mmHg | E/A | PCWP | Rest failures |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| source-same-Tref | 112.81/76.62 | 2.910 | 0.546 | 248.0 | 4.370/8.424 | 0.820 | 11.321 | none |
| slack107-same-Tref | 112.05/75.96 | 2.884 | 0.520 | 242.0 | 4.542/8.488 | 0.836 | 11.146 | left-ventricle.ejection-fraction |
| floor013-same-Tref | 115.93/78.15 | 2.986 | 0.533 | 246.0 | 4.641/8.840 | 0.873 | 10.481 | none |
| slack107-floor013-same-Tref | 114.47/77.18 | 2.943 | 0.511 | 242.0 | 4.636/8.620 | 0.901 | 10.609 | left-ventricle.esv-index, left-ventricle.ejection-fraction |
| slack107-iso-matched | 113.63/76.67 | 2.918 | 0.532 | 240.0 | 4.686/9.003 | 0.808 | 10.886 | none |
| floor013-iso-matched | 116.11/78.23 | 2.990 | 0.534 | 246.0 | 4.671/8.928 | 0.872 | 10.452 | none |
| slack107-floor013-iso-matched | 116.34/77.95 | 2.984 | 0.525 | 238.0 | 4.987/9.330 | 0.877 | 10.304 | aortic-valve.ejection-time, pulmonary-valve.mean-gradient |
| floor011-same-Tref | 117.14/78.72 | 3.014 | 0.526 | 244.0 | 4.749/8.795 | 0.919 | 10.264 | waveform.LVP.rounded-not-plateau |

## Formal fixed-control reserve (2 ms)

| Condition | Low-volume CO decrease % | High-volume CO increase % | High LVEDV increase mL | High PCWP increase mmHg | Response gate |
| --- | --- | --- | --- | --- | --- |
| source-same-Tref | 17.363 | -0.185 | 0.154 | 11.274 | failed-response |
| slack107-iso-matched | 17.965 | 2.515 | 3.374 | 9.329 | failed-response |
| floor013-iso-matched | 17.563 | 6.283 | 10.566 | 7.403 | passed |
| slack107-floor013-iso-matched | 17.960 | 6.603 | 11.001 | 7.043 | passed |

## Independent 1 ms full-invariant confirmation

High-volume cases are not subject to resting-normality admission.

| Condition | AoP mmHg | CI | ET ms | ICT / IRT ms | Tei | central range fraction | pressure peak phase | Rest-check readback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| source-same-Tref-center | 112.97/76.68 | 2.914 | 246.0 | 49.14/93.00 | 0.578 | 0.209486 | 0.786885 | none |
| source-same-Tref-high | 115.82/79.30 | 2.909 | 250.0 | 66.14/69.00 | 0.541 | 0.238467 | 0.789474 | mitral-flow.peak-e-to-a, pulmonary-artery-pressure.maximum, pulmonary-artery-pressure.minimum, pcwp-surrogate.mean, right-ventricle.edv-index, right-ventricle.esv-index |
| floor013-iso-matched-center | 116.21/78.26 | 2.992 | 244.0 | 51.14/90.00 | 0.578 | 0.230378 | 0.800830 | waveform.LVP.rounded-not-plateau |
| floor013-iso-matched-high | 126.03/85.06 | 3.180 | 257.0 | 29.00/81.00 | 0.428 | 0.239966 | 0.811024 | waveform.LVP.rounded-not-plateau, pulmonary-artery-pressure.maximum, pulmonary-artery-pressure.minimum, pcwp-surrogate.mean, left-ventricle.esv-index, right-ventricle.edv-index, right-ventricle.esv-index |

The compound roundness guard fails on peak phase, not central range, in the lower-Ca 1 ms cases. Its current bounds remain unchanged (central 0.08-0.35; peak phase 0.2-0.8).

## Accepted LV pressure accounting at cycle phase 0.7 (1 ms)

These are trajectory contributions, not causal percentages.

| Condition | Ca uM | LV volume | Land stretch | active mmHg | passive mmHg | SLS mmHg | external mmHg | LVP mmHg |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| source-same-Tref-center | 0.197061 | 108.705 | 1.125252 | 4.840 | 1.536 | 1.081 | 0.000 | 7.456 |
| source-same-Tref-high | 0.197061 | 123.927 | 1.158489 | 13.132 | 3.608 | 1.155 | 1.264 | 19.159 |
| floor013-iso-matched-center | 0.165363 | 115.107 | 1.140360 | 3.701 | 2.396 | 0.986 | 0.000 | 7.083 |
| floor013-iso-matched-high | 0.165363 | 128.495 | 1.172045 | 6.847 | 4.679 | 0.987 | 0.749 | 13.262 |

## Equal-Tref source protocol audit (HR60, isometric, Land Ta)

Both materials use Tref120 kPa. Timing is measured from figure origin and is not claimed identical to the paper's TPT method.

| Material | Ca | stretch | peak Ta kPa | minimum Ta kPa | min / peak % | peak time ms | RT50 / RT95 ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Land2017-intact | digitized | 1 | 51.190 | 0.079 | 0.153 | 206 | 122/283 |
| Land2017-intact | alphaFit | 1 | 50.565 | 0.079 | 0.156 | 198 | 117/288 |
| Land2017-intact | digitized | 1.1 | 123.874 | 0.509 | 0.411 | 221 | 171/337 |
| Land2017-intact | alphaFit | 1.1 | 122.902 | 0.511 | 0.416 | 212 | 175/356 |
| Land2017-intact | digitized | 1.2 | 170.208 | 12.158 | 7.143 | 256 | 297/564 |
| Land2017-intact | alphaFit | 1.2 | 169.878 | 12.229 | 7.199 | 248 | 329/591 |
| current-rounded | digitized | 1 | 38.406 | 0.076 | 0.197 | 250 | 91/174 |
| current-rounded | alphaFit | 1 | 36.804 | 0.075 | 0.204 | 238 | 93/190 |
| current-rounded | digitized | 1.1 | 105.843 | 0.492 | 0.465 | 284 | 141/222 |
| current-rounded | alphaFit | 1.1 | 103.117 | 0.487 | 0.472 | 274 | 156/250 |
| current-rounded | digitized | 1.2 | 160.790 | 11.838 | 7.363 | 358 | 268/487 |
| current-rounded | alphaFit | 1.2 | 160.141 | 11.819 | 7.380 | 359 | 292/505 |

## Fixed isometric peak-reference material contrasts

Reference is current geometry stretch1.1 (Land1.199), HR70, Tref190.08kPa; not a human normal force target.

| Variant | matched Tref kPa | center prescribed-trajectory active mmHg | high prescribed-trajectory active mmHg |
| --- | --- | --- | --- |
| source | 190.080 | 4.828 | 13.073 |
| slack107 | 208.456 | 3.552 | 6.664 |
| slack106 | 219.055 | 3.083 | 5.440 |
| floor013 | 192.146 | 2.777 | 5.477 |
| floor011 | 193.110 | 1.869 | 3.790 |
| slack107-floor013 | 210.551 | 2.032 | 3.755 |
| slack106-floor011 | 222.647 | 1.089 | 2.017 |
