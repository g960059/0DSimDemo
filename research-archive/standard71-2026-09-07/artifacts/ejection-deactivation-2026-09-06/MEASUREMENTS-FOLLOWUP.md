# Follow-up measurements: length sensitivity and operating point

Research constructions, not admitted baselines. Existing numerical cutoffs are recorded unchanged. A failed corridor is not itself a clinical diagnosis; a passed corridor is not independent physiological validation.

| Condition | AoP | CI | ET ms | AV mean/peak | ICT/IRT ms | Tei | E/A | LVEF | PCWP | Failed rest checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fixed-length08-TBV5050 | 114.7/76.9 | 2.936 | 234.0 | 5.007/9.469 | 55.1/98.0 | 0.654 | 0.793 | 0.521 | 10.375 | aortic-valve.mean-gradient, aortic-valve.ejection-time, mitral-flow.peak-e-to-a, timing.tei-index, pulmonary-valve.mean-gradient |
| fixed-length08-TBV5656 | 126.3/84.6 | 3.169 | 248.0 | 5.182/9.881 | 30.0/88.0 | 0.476 | 1.253 | 0.521 | 17.088 | aortic-valve.mean-gradient, pulmonary-artery-pressure.maximum, pulmonary-artery-pressure.minimum, pcwp-surrogate.mean, left-ventricle.esv-index, right-ventricle.edv-index, right-ventricle.esv-index |
| fixed-length08-TBV5200-R110 | 123.1/82.7 | 3.043 | 240.0 | 5.103/9.680 | 40.0/100.0 | 0.583 | 0.844 | 0.518 | 11.711 | aortic-valve.mean-gradient, left-ventricle.esv-index, left-ventricle.ejection-fraction, right-ventricle.edv-index, pulmonary-valve.mean-gradient |
| fixed-length08-TBV5300-R110 | 126.1/84.6 | 3.109 | 242.0 | 5.220/9.897 | 34.0/100.0 | 0.554 | 0.902 | 0.518 | 12.774 | aortic-valve.mean-gradient, pulmonary-artery-pressure.minimum, left-ventricle.esv-index, left-ventricle.ejection-fraction, right-ventricle.edv-index, right-ventricle.esv-index, pulmonary-valve.mean-gradient |
| fixed-length08-TBV5200-R110-reserve | 123.1/82.7 | 3.043 | 240.0 | 5.103/9.680 | 40.0/100.0 | 0.583 | 0.844 | 0.518 | 11.710 | aortic-valve.mean-gradient, left-ventricle.esv-index, left-ventricle.ejection-fraction, right-ventricle.edv-index, pulmonary-valve.mean-gradient |
| fixed-length08-TBV5200-R110-1ms | 123.2/82.7 | 3.046 | 238.0 | 5.180/9.763 | 41.0/100.0 | 0.592 | 0.841 | 0.518 | 11.690 | aortic-valve.mean-gradient, aortic-valve.ejection-time, left-ventricle.esv-index, left-ventricle.ejection-fraction, right-ventricle.edv-index, pulmonary-valve.mean-gradient |

High-volume rest corridors are displayed for traceability, not used as a healthy resting-state gate for the challenge endpoint.

## Independent cold resolution comparison

| Metric | 2 ms | 1 ms | Difference | Relative difference % |
| --- | --- | --- | --- | --- |
| AoPmax | 123.11833 | 123.24556 | 0.12723 | 0.103 |
| AoPmin | 82.68078 | 82.73018 | 0.04940 | 0.060 |
| CI | 3.04270 | 3.04580 | 0.00310 | 0.102 |
| ETms | 240.00000 | 238.00000 | -2.00000 | -0.833 |
| meanAVGradientMmHg | 5.10306 | 5.17966 | 0.07660 | 1.501 |
| peakAVGradientMmHg | 9.68016 | 9.76310 | 0.08293 | 0.857 |
| ICTms | 40.00000 | 41.00000 | 1.00000 | 2.500 |
| IRTms | 100.00000 | 100.00000 | 0.00000 | 0.000 |
| Tei | 0.58333 | 0.59244 | 0.00910 | 1.561 |
| EA | 0.84415 | 0.84082 | -0.00332 | -0.394 |
| LVEF | 0.51787 | 0.51807 | 0.00020 | 0.039 |
| PCWP | 11.71079 | 11.68958 | -0.02121 | -0.181 |
| CVP | 4.01472 | 4.00498 | -0.00974 | -0.243 |
| positiveDpDt | 3191.90373 | 3252.37308 | 60.46935 | 1.894 |
| negativeDpDt | -1647.31793 | -1666.87963 | -19.56170 | -1.187 |

This is a two-step numerical sensitivity check, not a time-step extrapolation or complete pressure-rate quality certification. Fine resolution did not include a new formal reserve study.

## Formal fixed-control bilateral reserve at 2 ms

| Side/direction | CO change % | Filling pressure change mmHg | EDV change % | EDPtm change mmHg | CO/pressure slope | Current response gate |
| --- | --- | --- | --- | --- | --- | --- |
| left/hypovolemic | -17.621 | -4.373 | -15.253 | -8.662 | 0.23294 | true |
| left/hypervolemic | 3.156 | 7.733 | 3.942 | 4.695 | 0.02360 | true |
| right/hypovolemic | -17.603 | -1.409 | -16.757 | -1.965 | 0.72222 | true |
| right/hypervolemic | 3.193 | 3.098 | 9.914 | 1.797 | 0.05960 | true |

TBV 5200 → 4576 / 5824 mL; no afterload stress test. A high-side gain slightly above the engineering floor is not ample physiological reserve.

## Accepted LV length readback

| Condition | Minimum/maximum Land stretch | At/above cap, time fraction | Phase ~0.7 active/passive/SLS pressure mmHg |
| --- | --- | --- | --- |
| rate60-power16 | 0.99038/1.18743 | 0.00000 | 4.071/2.271/0.963 |
| rate30-power16 | 0.98535/1.18473 | 0.00000 | 3.404/2.344/1.235 |
| rate120-power16 | 0.99493/1.18927 | 0.00000 | 4.297/2.252/0.868 |
| kws1-phi1 | 0.99038/1.18743 | 0.00000 | 4.071/2.271/0.963 |
| kws1-phi1.2 | 0.97769/1.18350 | 0.00000 | 3.956/2.077/1.034 |
| kws0.8-phi1 | 1.00381/1.19121 | 0.00000 | 4.289/2.407/0.872 |
| kws0.8-phi1.2 | 0.99194/1.18773 | 0.00000 | 4.125/2.248/0.948 |
| fixed-length08-TBV5050 | 0.99602/1.19297 | 0.00000 | 3.529/2.581/0.967 |
| fixed-length08-TBV5656 | 1.01440/1.22038 | 0.15067 | 5.020/5.126/0.993 |
| fixed-length08-TBV5200-R110 | 1.00562/1.20567 | 0.10400 | 3.789/3.049/0.905 |
| fixed-length08-TBV5300-R110 | 1.01040/1.21391 | 0.12500 | 3.997/3.408/0.882 |
| fixed-length08-TBV5200-R110-reserve | 1.00562/1.20567 | 0.10400 | 3.789/3.049/0.905 |
| fixed-length08-TBV5200-R110-1ms | 1.00550/1.20587 | 0.10283 | 3.790/3.052/0.901 |

Material readback uses one additional settled cycle. Pressure components reconstruct the model pressure; they are not causal effect estimates. Cap exposure is not a measured human sarcomere-length limit or proof of the sole cause of poor reserve.
