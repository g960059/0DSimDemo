# Measurements: passive / length / calcium interaction

Research constructions only. Unchanged numeric corridors are not independently validated physiological limits. Exact result dt and construction identities are checked; the stopped mislabeled fine request is excluded.

| Condition | dt ms | AoP | CI | ET ms | AV mean/peak | ICT/IRT ms | Tei | E/A | EF | PCWP | Failed rest checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| length1-passive0.832 | 2 | 123.7/83.2 | 3.064 | 244.0 | 4.980/9.437 | 41.1/100.0 | 0.578 | 0.837 | 0.525 | 11.804 | right-ventricle.edv-index, pulmonary-valve.mean-gradient |
| length1-passive1.04 | 2 | 121.6/82.0 | 3.008 | 242.0 | 4.873/9.351 | 34.0/98.0 | 0.545 | 0.882 | 0.523 | 12.511 | none |
| length1-passive1.248 | 2 | 119.3/80.6 | 2.949 | 240.0 | 4.817/9.296 | 28.0/94.0 | 0.508 | 0.943 | 0.521 | 13.345 | pulmonary-artery-pressure.minimum, pcwp-surrogate.mean, right-ventricle.esv-index |
| length0.8-passive0.832 | 2 | 125.3/84.0 | 3.100 | 242.0 | 5.142/9.731 | 46.0/104.0 | 0.620 | 0.805 | 0.518 | 11.005 | aortic-valve.mean-gradient, left-ventricle.esv-index, left-ventricle.ejection-fraction, right-ventricle.edv-index, pulmonary-valve.mean-gradient |
| length0.8-passive1.04 | 2 | 123.1/82.7 | 3.043 | 240.0 | 5.103/9.680 | 40.0/100.0 | 0.583 | 0.844 | 0.518 | 11.711 | aortic-valve.mean-gradient, left-ventricle.esv-index, left-ventricle.ejection-fraction, right-ventricle.edv-index, pulmonary-valve.mean-gradient |
| length0.8-passive1.248 | 2 | 120.9/81.4 | 2.986 | 238.0 | 5.053/9.599 | 36.0/96.0 | 0.555 | 0.892 | 0.518 | 12.468 | aortic-valve.mean-gradient, aortic-valve.ejection-time, left-ventricle.ejection-fraction, right-ventricle.esv-index |
| length1-passive1.04-reserve | 2 | 121.6/82.0 | 3.008 | 242.0 | 4.873/9.351 | 34.0/98.0 | 0.545 | 0.882 | 0.523 | 12.511 | none |
| length0.8-passive0.832-reserve | 2 | 125.3/84.0 | 3.100 | 242.0 | 5.142/9.731 | 46.0/104.0 | 0.620 | 0.805 | 0.518 | 11.005 | aortic-valve.mean-gradient, left-ventricle.esv-index, left-ventricle.ejection-fraction, right-ventricle.edv-index, pulmonary-valve.mean-gradient |
| length0.8-passive1.04-Ca1.1 | 2 | 123.3/83.4 | 3.065 | 252.0 | 4.739/9.211 | 46.0/106.0 | 0.603 | 0.782 | 0.533 | 11.209 | mitral-flow.peak-e-to-a |
| length0.8-passive1.248-Ca1.1 | 2 | 121.3/82.2 | 3.013 | 248.0 | 4.764/9.151 | 42.0/102.0 | 0.581 | 0.817 | 0.532 | 11.888 | none |
| length0.8-passive1.248-Ca1.1-reserve | 2 | 121.3/82.2 | 3.013 | 248.0 | 4.764/9.151 | 42.0/102.0 | 0.581 | 0.817 | 0.532 | 11.888 | none |
| length0.8-passive1.248-Ca1.1-1ms | 1 | 121.4/82.3 | 3.016 | 247.0 | 4.754/9.170 | 42.0/103.0 | 0.587 | 0.814 | 0.532 | 11.862 | none |

## Fixed-control reserve at 2 ms

| Condition | Side/direction | CO change % | Filling pressure change mmHg | EDV change % | EDPtm change mmHg | CO/pressure slope | Response check |
| --- | --- | --- | --- | --- | --- | --- | --- |
| length1-passive1.04-reserve | left/hypovolemic | -17.060 | -4.932 | -13.869 | -10.400 | 0.19769 | true |
| length1-passive1.04-reserve | left/hypervolemic | -0.468 | 9.604 | -0.003 | 3.428 | -0.00279 | false |
| length1-passive1.04-reserve | right/hypovolemic | -17.049 | -1.465 | -15.831 | -2.250 | 0.66518 | true |
| length1-passive1.04-reserve | right/hypervolemic | -0.439 | 3.354 | 7.807 | 2.115 | -0.00747 | false |
| length0.8-passive0.832-reserve | left/hypovolemic | -18.014 | -4.077 | -16.008 | -7.919 | 0.26018 | true |
| length0.8-passive0.832-reserve | left/hypervolemic | 5.348 | 7.037 | 6.189 | 6.132 | 0.04476 | true |
| length0.8-passive0.832-reserve | right/hypovolemic | -18.002 | -1.350 | -16.938 | -1.564 | 0.78559 | true |
| length0.8-passive0.832-reserve | right/hypervolemic | 5.364 | 2.927 | 11.678 | 1.884 | 0.10793 | true |
| length0.8-passive1.248-Ca1.1-reserve | left/hypovolemic | -17.904 | -4.323 | -15.126 | -8.735 | 0.23706 | true |
| length0.8-passive1.248-Ca1.1-reserve | left/hypervolemic | 3.656 | 8.708 | 3.939 | 4.876 | 0.02403 | true |
| length0.8-passive1.248-Ca1.1-reserve | right/hypovolemic | -17.891 | -1.417 | -16.678 | -2.029 | 0.72261 | true |
| length0.8-passive1.248-Ca1.1-reserve | right/hypervolemic | 3.690 | 2.970 | 10.602 | 1.947 | 0.07111 | true |

TBV5200 -> 4576/5824mL. Full retained endpoint values, fixed-coronary-tone protocol and settlement checks are in the JSON results. Infused saline volume in human experiments is not net TBV change; protocol-dependent response percentages are not population normal limits. No afterload stress test.

## Independent cold numerical sensitivity

| Metric | 2ms | 1ms | Difference | Relative difference % |
| --- | --- | --- | --- | --- |
| AoPmax | 121.30733 | 121.44324 | 0.13591 | 0.112 |
| AoPmin | 82.17233 | 82.26385 | 0.09152 | 0.111 |
| CI | 3.01257 | 3.01611 | 0.00354 | 0.117 |
| ETms | 248.00000 | 247.00000 | -1.00000 | -0.403 |
| AVmean | 4.76388 | 4.75425 | -0.00963 | -0.202 |
| AVpeak | 9.15132 | 9.16973 | 0.01841 | 0.201 |
| ICTms | 42.00000 | 42.00000 | 0.00000 | 0.000 |
| IRTms | 102.00000 | 103.00000 | 1.00000 | 0.980 |
| Tei | 0.58065 | 0.58704 | 0.00640 | 1.102 |
| EA | 0.81733 | 0.81376 | -0.00356 | -0.436 |
| LVEF | 0.53175 | 0.53211 | 0.00036 | 0.068 |
| EDV | 153.77567 | 153.85226 | 0.07659 | 0.050 |
| PCWP | 11.88793 | 11.86197 | -0.02596 | -0.218 |
| CVP | 4.16085 | 4.15037 | -0.01047 | -0.252 |
| positiveDpDt | 3095.98922 | 3143.14287 | 47.15365 | 1.523 |
| negativeDpDt | -1537.92639 | -1555.78196 | -17.85558 | -1.161 |

Two resolutions only, not asymptotic extrapolation, fine-resolution reserve or dedicated dP/dt spike-quality certification.

## Source-time calcium contrast at the same 2ms resolution

| Metric | Source time | Ca time x1.1 | Difference |
| --- | --- | --- | --- |
| AoPmax | 120.93535 | 121.30733 | 0.37199 |
| AoPmin | 81.39432 | 82.17233 | 0.77801 |
| CI | 2.98590 | 3.01257 | 0.02667 |
| ETms | 238.00000 | 248.00000 | 10.00000 |
| AVmean | 5.05266 | 4.76388 | -0.28878 |
| AVpeak | 9.59887 | 9.15132 | -0.44755 |
| ICTms | 36.00000 | 42.00000 | 6.00000 |
| IRTms | 96.00000 | 102.00000 | 6.00000 |
| Tei | 0.55462 | 0.58065 | 0.02602 |
| EA | 0.89221 | 0.81733 | -0.07488 |
| LVEF | 0.51755 | 0.53175 | 0.01420 |
| EDV | 156.59497 | 153.77567 | -2.81929 |
| PCWP | 12.46826 | 11.88793 | -0.58033 |
| CVP | 4.15397 | 4.16085 | 0.00688 |
| positiveDpDt | 3190.08030 | 3095.98922 | -94.09108 |
| negativeDpDt | -1627.74363 | -1537.92639 | 89.81724 |
