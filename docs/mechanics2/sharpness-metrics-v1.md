# Sharpness Metrics V1

Status: active sidecar QA metric pack

This pack supports MechanicsCore2 sidecar benches. It is not a clinical waveform
validation layer.

Metrics currently implemented in
`engine/mechanics2/metrics/ShapeQualityMetricsV1.ts`:

- dominant peak count
- secondary peak prominence ratio
- full width at half maximum
- peak area ratio
- C1 continuity score
- derivative spike ratio
- positive curvature fraction and burden

The derivative spike ratio ignores near-flat segments before computing its
median denominator. This prevents long diastatic or inactive windows from
misclassifying an otherwise smooth upstroke as a spike.

Current users:

- Hill-series fiber replay gate
- OneFiberChamber prescribed-volume bench

Claim boundary:

- Allowed: reusable sidecar QA for broadness, sharpness, and kink-like signals.
- Not allowed: final morphology acceptance, echocardiographic validation, or
  disease-profile acceptance.
