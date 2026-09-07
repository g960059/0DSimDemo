# Generated measurements — kinetic/reference and gate audit

Research constructions only. Source JSON is immutable; current-policy reassessment is stored separately.

## closed-loop-v1

Wall time: 120.8 seconds.

| Condition | AoP mmHg | CI | ET ms | mPG / pPG | E/A | PCWP | Recorded rest blockers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| slack109-restore-none | 112.8/76.6 | 2.910 | 248.0 | 4.370/8.424 | 0.820 | 11.321 | none |
| slack109-restore-kuw | 114.6/77.3 | 2.954 | 240.0 | 4.939/11.187 | 0.760 | 11.069 | aortic-valve.peak-gradient, mitral-flow.peak-e-to-a, pulmonary-valve.mean-gradient |
| slack109-restore-kws | 129.6/81.1 | 3.176 | 184.0 | 9.673/17.476 | 0.854 | 9.628 | aortic-valve.mean-gradient, aortic-valve.peak-gradient, aortic-valve.ejection-time, timing.tei-index, pulmonary-valve.mean-gradient, pulmonary-valve.peak-gradient, pulmonary-valve.ejection-time |
| slack109-restore-both | 133.1/81.9 | 3.229 | 170.0 | 11.810/23.065 | 0.832 | 9.319 | aortic-valve.mean-gradient, aortic-valve.peak-gradient, aortic-valve.ejection-time, timing.tei-index, pulmonary-valve.mean-gradient, pulmonary-valve.peak-gradient, pulmonary-valve.ejection-time |
| slack107-restore-none | 113.6/76.7 | 2.918 | 240.0 | 4.686/9.003 | 0.808 | 10.886 | none |
| slack107-restore-kuw | 115.4/77.3 | 2.960 | 230.0 | 5.390/11.966 | 0.754 | 10.699 | aortic-valve.mean-gradient, aortic-valve.peak-gradient, aortic-valve.ejection-time, mitral-flow.peak-e-to-a, pulmonary-valve.mean-gradient |
| slack107-restore-kws | 129.9/80.8 | 3.168 | 178.0 | 10.338/18.388 | 0.861 | 9.448 | aortic-valve.mean-gradient, aortic-valve.peak-gradient, aortic-valve.ejection-time, timing.tei-index, pulmonary-valve.mean-gradient, pulmonary-valve.peak-gradient, pulmonary-valve.ejection-time |
| slack107-restore-both | 133.4/81.7 | 3.222 | 168.0 | 11.956/23.212 | 0.837 | 9.151 | aortic-valve.mean-gradient, aortic-valve.peak-gradient, aortic-valve.ejection-time, timing.tei-index, pulmonary-valve.mean-gradient, pulmonary-valve.peak-gradient, pulmonary-valve.ejection-time |
## reference-followup-v1

Wall time: 74.3 seconds.

| Condition | AoP mmHg | CI | ET ms | mPG / pPG | E/A | PCWP | Recorded rest blockers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| slack106-iso-1-HR70 | 113.8/76.5 | 2.915 | 236.0 | 4.836/9.277 | 0.805 | 10.795 | aortic-valve.ejection-time |
| slack106-iso-1.05-HR70 | 114.6/76.8 | 2.931 | 234.0 | 4.973/9.585 | 0.792 | 10.685 | aortic-valve.ejection-time, mitral-flow.peak-e-to-a, pulmonary-valve.mean-gradient |
| slack107-iso-1.05-HR70 | 114.4/77.0 | 2.934 | 238.0 | 4.808/9.297 | 0.794 | 10.765 | aortic-valve.ejection-time, mitral-flow.peak-e-to-a |
| source-iso-1.05-HR70 | 113.6/77.0 | 2.927 | 244.0 | 4.576/8.774 | 0.804 | 11.154 | none |
| slack106-iso-1-HR60 | 110.8/70.6 | 2.744 | 250.0 | 5.178/10.212 | 0.974 | 12.880 | aortic-valve.mean-gradient, aortic-valve.peak-gradient, right-ventricle.edv-index, right-ventricle.esv-index |
| slack106-iso-1.05-HR60 | 111.8/71.1 | 2.768 | 248.0 | 5.359/10.604 | 0.952 | 12.750 | aortic-valve.mean-gradient, aortic-valve.peak-gradient, right-ventricle.edv-index, pulmonary-valve.mean-gradient |
| slack107-iso-1.05-HR60 | 110.7/70.6 | 2.745 | 250.0 | 5.226/10.189 | 1.000 | 13.396 | aortic-valve.mean-gradient, aortic-valve.peak-gradient, pcwp-surrogate.mean, right-ventricle.edv-index |
| source-iso-1.05-HR60 | 107.3/69.1 | 2.666 | 254.0 | 4.758/9.126 | 1.190 | 15.133 | pulmonary-artery-pressure.maximum, pulmonary-artery-pressure.minimum, pcwp-surrogate.mean |
## reserve-v1

Wall time: 75.2 seconds.

| Condition | AoP mmHg | CI | ET ms | mPG / pPG | E/A | PCWP | Recorded rest blockers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| slack106-iso-1-HR70 | 113.8/76.5 | 2.915 | 236.0 | 4.836/9.277 | 0.805 | 10.795 | aortic-valve.ejection-time |
| source-iso-1.05-HR70 | 113.6/77.0 | 2.927 | 244.0 | 4.576/8.774 | 0.804 | 11.154 | none |
| slack109-restore-kuw | 114.6/77.3 | 2.954 | 240.0 | 4.939/11.187 | 0.760 | 11.069 | aortic-valve.peak-gradient, mitral-flow.peak-e-to-a, pulmonary-valve.mean-gradient |
## confirmation-1ms-v1

Wall time: 172.8 seconds.

| Condition | AoP mmHg | CI | ET ms | mPG / pPG | E/A | PCWP | Recorded rest blockers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| slack106-center-1ms | 114.0/76.6 | 2.919 | 233.0 | 4.991/9.418 | 0.804 | 10.768 | aortic-valve.ejection-time, pulmonary-valve.mean-gradient |
| slack106-high-1ms | 120.8/81.6 | 3.026 | 243.0 | 4.867/8.927 | 1.622 | 19.257 | pulmonary-artery-pressure.maximum, pulmonary-artery-pressure.minimum, pcwp-surrogate.mean, right-ventricle.edv-index, right-ventricle.esv-index |

## Fixed-tone 2 ms bilateral reserve

+/-12% TBV; constant HR and external controls. These are model-design margins, not a human fluid-responsiveness definition.

| Condition | Low CO decrease % | High CO increase % | High LVEDV increase % | High PCWP increase mmHg | Response checks |
| --- | --- | --- | --- | --- | --- |
| slack106-iso-1-HR70 | 18.167 | 3.656 | 3.207 | 8.460 | passed |
| source-iso-1.05-HR70 | 17.616 | 0.246 | 0.488 | 11.525 | failed-response |
| slack109-restore-kuw | 17.691 | 0.590 | 0.896 | 11.473 | failed-response |

## Conservative AV gradient floor

For this algebraic, nonnegative-loss valve with EOA(t) <= 3.5 cm², Jensen gives mean ΔP >= B(3.5) (SV / ET)². This drops the positive linear loss and assumes a perfectly flat flow profile: it is a lower bound, not a fitted mean gradient, clinical diagnostic cutoff, or a reason to raise a gate.

| Condition | SV mL | Ideal minimum mean PG mmHg |
| --- | --- | --- |
| slack109-restore-none | 78.976 | 3.291 |
| slack109-restore-kuw | 80.188 | 3.623 |
| slack109-restore-kws | 86.212 | 7.124 |
| slack109-restore-both | 87.651 | 8.627 |
| slack107-restore-none | 79.201 | 3.534 |
| slack107-restore-kuw | 80.352 | 3.961 |
| slack107-restore-kws | 85.987 | 7.573 |
| slack107-restore-both | 87.442 | 8.791 |

## Pressure accounting at cycle phase ~0.7

Trajectory contributions, not causal fractions. Source control is from the previous study, re-observed without altering it.

| Condition | Ca uM | Volume mL | Land lambda | Active | Passive | SLS | External | LVP mmHg | Cycle lambda range |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| slack106-center-1ms | 0.197061 | 113.842 | 1.107069 | 4.077 | 2.270 | 0.958 | 0.000 | 7.304 | 0.990244–1.187645 |
| slack106-high-1ms | 0.197061 | 130.189 | 1.143656 | 7.813 | 5.028 | 1.093 | 1.374 | 15.307 | 1.000640–1.196820 |
| source-same-Tref-center | 0.197061 | 108.705 | 1.125252 | 4.840 | 1.536 | 1.081 | 0.000 | 7.456 | 0.999323–1.206547 |
| source-same-Tref-high | 0.197061 | 123.927 | 1.158489 | 13.132 | 3.608 | 1.155 | 1.264 | 19.159 | 1.008192–1.210625 |

## Time and volume peak coordinates

These are separately normalized coordinates, not curvature gates.

| Condition | Old sample-index peak phase | Elapsed-time peak phase | Expelled-volume fraction at peak | Late PV chord deficit mmHg |
| --- | --- | --- | --- | --- |
| slack106-center-1ms | 0.778261 | 0.778261 | 0.884380 | 0.000000 |
| slack106-high-1ms | 0.784232 | 0.784232 | 0.888312 | 0.000000 |
| source-same-Tref-center | 0.786885 | 0.786885 | 0.890778 | 0.000000 |
| source-same-Tref-high | 0.789474 | 0.789474 | 0.890336 | 0.000000 |
