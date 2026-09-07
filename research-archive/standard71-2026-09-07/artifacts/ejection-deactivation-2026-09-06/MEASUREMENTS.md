# Measurements: existing-path mechanism contrasts

## closed-loop-v1

| Condition | AoP | CI | ET ms | AV mean/peak PG | ICT/IRT ms | Tei | E/A | LVEF | PCWP | Blocking observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| rate60-power16 | 113.8/76.5 | 2.915 | 236.0 | 4.836/9.277 | 47.1/94.0 | 0.598 | 0.805 | 0.524 | 10.795 | aortic-valve.ejection-time |
| rate30-power16 | 113.6/76.8 | 2.924 | 242.0 | 4.705/9.141 | 51.1/120.0 | 0.707 | 0.875 | 0.531 | 10.527 | timing.tei-index |
| no-exit | —/— | — | — | —/— | —/— | — | — | — | — | Baseline observation unavailable (left): E needs a positive interior peak above both phase boundaries; fused/truncated waves are unavailable |
| rate120-power16 | 113.6/76.0 | 2.897 | 228.0 | 5.087/9.466 | 45.1/84.0 | 0.566 | 0.730 | 0.518 | 11.031 | aortic-valve.mean-gradient, aortic-valve.ejection-time, mitral-flow.peak-e-to-a, left-ventricle.ejection-fraction, pulmonary-valve.mean-gradient |

## factorial-v1

| Condition | AoP | CI | ET ms | AV mean/peak PG | ICT/IRT ms | Tei | E/A | LVEF | PCWP | Blocking observations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| kws1-phi1 | 113.8/76.5 | 2.915 | 236.0 | 4.836/9.277 | 47.1/94.0 | 0.598 | 0.805 | 0.524 | 10.795 | aortic-valve.ejection-time |
| kws1-phi1.2 | 117.9/77.9 | 2.988 | 222.0 | 5.692/9.907 | 55.1/92.0 | 0.663 | 0.806 | 0.545 | 10.332 | aortic-valve.mean-gradient, aortic-valve.ejection-time, timing.tei-index, pulmonary-valve.mean-gradient |
| kws0.8-phi1 | 109.2/74.8 | 2.824 | 250.0 | 4.096/8.325 | 42.0/96.0 | 0.552 | 0.794 | 0.502 | 11.298 | mitral-flow.peak-e-to-a, left-ventricle.esv-index, left-ventricle.ejection-fraction, right-ventricle.esv-index |
| kws0.8-phi1.2 | 113.2/76.2 | 2.898 | 236.0 | 4.753/8.673 | 49.1/96.0 | 0.615 | 0.790 | 0.521 | 10.827 | aortic-valve.ejection-time, mitral-flow.peak-e-to-a |

## No-exit partial exact observations

A repeat preserved 433 accepted samples after 157 cycles. Period-1 converged, but the left E wave remains unresolved. This is not a successful baseline assessment or a Newton/conservation failure.

AoP 100.1/69.8, CI 2.576, ET 264.0 ms, AV mean/peak 3.586/8.931 mmHg. Do not infer a valid E/A, IRT or Tei from these partial outputs.

## Morphology of fully observed trials

| Condition | LV/Ao peaks | LV post-peak rebound mmHg | Late PV chord deficit mmHg | LV peak time/expelled-volume fraction |
| --- | --- | --- | --- | --- |
| rate60-power16 | 1/1 | 0.000 | 0.00000 | 0.774/0.880 |
| rate30-power16 | 1/1 | 0.000 | 0.00000 | 0.748/0.872 |
| rate120-power16 | 1/1 | 0.000 | 0.00000 | 0.795/0.895 |
| kws1-phi1 | 1/1 | 0.000 | 0.00000 | 0.774/0.880 |
| kws1-phi1.2 | 1/1 | 0.000 | 0.00000 | 0.761/0.872 |
| kws0.8-phi1 | 1/1 | 0.000 | 0.02444 | 0.797/0.901 |
| kws0.8-phi1.2 | 1/1 | 0.000 | 0.00000 | 0.793/0.893 |
