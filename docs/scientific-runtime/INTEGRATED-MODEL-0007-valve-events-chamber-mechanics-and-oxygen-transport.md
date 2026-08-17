# Integrated V3 valve events, five-wall mechanics, and oxygen transport

Status: introduced in Standard-62 and extended in Standard-63; numerically
verified, not clinically validated

## Release boundary

Standard-62 added one exact fixture object, `mechanismResearchInputs`, for
valve, chamber, and oxygen research inputs. Standard-63 extends that same
exact Scenario boundary to five independently owned parts:

- continuous four-valve effective areas;
- five-wall active, passive, and prescribed calcium-decay scales; and
- static whole-body oxygen-transport boundaries;
- common-pericardial capacity, pressure/stiffness, and fluid-volume inputs; and
- territory/layer-explicit coronary focal and structural resistance inputs.

The valve, mechanics, pericardial, and coronary parts change the numerical
runtime. Oxygen transport is a completed-beat observer and cannot feed back
into hemodynamics, calcium, mechanics, coronary regulation, or rhythm. One
Standard fixture and checkpoint therefore remain the complete durable Scenario
boundary; there is no hidden ParameterSet or user-visible protocol object.

## Valve-event landmarks

The beat accumulator consumes every accepted numerical endpoint, including
event-limited substeps. At each endpoint it observes all four signed valve
flows, LV/RV volume, and LV/RV absolute and transmural pressure.

The first positive-to-nonpositive flow crossing in a capture-to-capture beat
defines closure:

| Event       | Owned ventricular landmark |
| ----------- | -------------------------- |
| MV closure  | LV end diastole            |
| AoV closure | LV end systole             |
| TV closure  | RV end diastole            |
| PV closure  | RV end systole             |

For endpoint flows `q0 > 0` and `q1 <= 0`, the crossing fraction is
`a = q0 / (q0 - q1)`. Event time, volume, and both pressure bases are linearly
interpolated with that same `a`. The observer never substitutes a pressure
crossing, volume extremum, scheduled rhythm phase, or synthetic valve event.

Event-defined SV is `EDV - ESV`; EF is `SV / EDV`. Both remain unavailable
unless the named end-diastolic and end-systolic events exist in the correct
order and EDV is positive. The earlier LV maximum/minimum, extrema SV, and
extrema EF remain available under explicitly different Output IDs.

## Four-valve volume ledger

Every valve owns a forward-volume, reverse-volume-magnitude, and signed-net
ledger. When signed flow crosses zero inside one accepted interval, the
linearly interpolated interval is split at the crossing before trapezoidal
integration. Thus a coarse accepted interval cannot be assigned wholly to the
forward or reverse ledger.

For each valve:

```text
net volume = forward volume - reverse volume
same-valve fraction = reverse volume / forward volume
```

The ratio is intentionally named `same-valve` rather than generic clinical
regurgitant fraction. In particular, a clinical MR or AR denominator may use a
different total-stroke-volume definition. In the all-support-off Standard
fixture, net AoV and net PV volume are the native effective forward LV and RV
beat volumes. Event-defined ventricular SV is not silently relabelled as
effective forward SV in regurgitant disease.

## Continuous valve areas

Each valve exposes maximum-forward EOA and closed-reverse EROA. Background
series resistance and healthy opening/closing kinetics remain fixed. The
controls are numerical research bounds, not guideline severity intervals or
patient-specific diagnoses.

The retained mild/moderate/severe valve-disease brackets are named research
fixtures over these same primitives. Their label, evidence basis, and need for
post-solve calibration remain explicit. Standard-63 does not claim
disease-calibrated leaflet memory, independent directional valve mechanics, or
clinical-grade severity classification.

## Five-wall mechanics

The numerical material walls are LA, LVFW, SEP, RVFW, and RA. Standard-63
exposes the walls directly because SEP is mechanically shared and cannot be
honestly hidden inside an LV-only or RV-only primitive.

- Active-tension scale multiplies Land `Tref` for one wall.
- Passive-stiffness scale multiplies equilibrium passive stress, stored
  energy, and tangent, and the SLS branch modulus for one wall. SLS relaxation
  time remains fixed.
- Calcium-decay-time scale multiplies the prescribed biexponential calcium
  decay constant for one wall.

`myocardium.contractility` is a convenience action that atomically assigns the
same active-tension scale to LVFW, SEP, and RVFW. It has no separate fixture
field and cannot overwrite a later wall-specific assignment.

Calcium-decay time is a mechanistic primitive, not a generic lusitropy claim.
The model has no conserved SR/RyR/SERCA state, no force-frequency relation, and
no guarantee that a clinical active-relaxation phenotype maps to one scale.
Passive stiffness is separately controlled rather than folded into that term.

## Whole-body oxygen observer

The observer uses completed-beat systemic-tissue flow `Q`, prescribed Hb,
FiO2, PaCO2, respiratory exchange ratio `R`, barometric pressure `PB`, true
shunt fraction `s`, and target VO2.

```text
PAO2 = FiO2 * (PB - 47 mmHg) - PaCO2 / R
SO2(PO2) = PO2^2.7 / (26.8^2.7 + PO2^2.7)
CO2 content = 1.34 * Hb * SO2 + 0.0031 * PO2
delta content = target VO2 / (Q * 10)
CaO2 = CcO2 - s / (1 - s) * delta content
required CvO2 = CaO2 - delta content
DO2 = Q * 10 * CaO2
required OER = target VO2 / DO2
```

The arterial equation follows exactly from true-shunt content mixing
`CaO2 = (1-s)CcO2 + sCvO2` plus steady Fick closure. PO2 is inverted from
content with the same fixed Hill curve. Target VO2 never becomes a delivered
VO2 state: if flow is nonpositive or the requested closure requires negative
arterial or venous content, the dependent outputs are unavailable.

This V1 observer deliberately omits organ partition, diffusion limitation,
regional coronary oxygen extraction, extraction ceilings, oxygen debt,
lactate, acid-base shifts of the ODC, temperature, dyshemoglobins, and any
metabolic feedback. It is suitable for transparent supply-boundary
Experiments, not a claim that tissue oxygen demand is met.

## Common-pericardial and coronary disease axes

The common-pericardium inputs separately scale reference capacity, pressure
scale, exponential stiffness, and prescribed fluid volume. Accepted readback
exposes excess pressure, heart volume, fluid volume, total occupied volume,
and stored energy. These variables allow mechanism-level constriction and
effusion Experiments, but do not assign a clinical tamponade diagnosis.

The coronary inputs expose focal diameter loss separately for LAD, LCx, and
RCA and structural R1/Rm resistance scales separately for subepicardial and
subendocardial layers. The focal input is translated by the existing
Young-Tsai-style lesion mapper. The autoregulatory tone floor remains a fixed
model parameter rather than a disease control.

The coronary readback publishes territory inlet, large-arterial outflow and
storage, layer R1/internal-Qm/R2 flow, post-focal pressure and loss, effective
tone scale, common venous outlet, and total dissipated hydraulic power.
Internal Qm is an internal network branch flow and is not relabelled myocardial
tissue perfusion. These signals are a prerequisite for future coronary supply
Experiments, not a validated ischemia or FFR claim.

## Output presentation

Standard-63 registers 173 outputs: 77 signals and 96 completed-beat metrics.
Every definition declares three significant digits. Workbench and Article
presentation use that metadata, while runtime pages, captures, checkpoints,
and computed references retain the unrounded numerical value.

Pressure summaries follow clinical display convention: arterial and pulmonary
arterial pressures expose systolic/diastolic/mean/pulse values, whereas CVP is
the time-weighted mean RA pressure. Mean LA, mean pulmonary-vein-node pressure,
and peak LV/RV pressures stay separately named. Forward-flow valve pressure
differences are explicitly hydraulic, not Doppler/Bernoulli gradients.

## Verification and claim limit

The release gates cover:

- analytic open and closed PV-path work fixtures;
- valve-flow zero-crossing interval splitting;
- interpolated MV/AoV event landmarks and exact checkpoint continuation;
- baseline availability of all four closure events;
- strict fixture shape and numerical bounds;
- isolation of wall-specific calcium decay;
- changed material identity for active/passive wall controls;
- Fick, shunt, ODC, infeasibility, and direction tests for oxygen transport;
- exact catalog projection of pericardial and detailed coronary accepted
  readback;
- forward-flow-only valve pressure-gradient accumulation, all-node pressure
  summaries, LV/RV pressure-rate extrema, and LV/RV PV path work;
- a combined AS/MR runtime smoke test that emits event-defined EDV/ESV/SV/EF,
  MV reverse volume, AoV net volume, and systemic DO2; and
- exact Standard-63 artifact and registry admission.

These gates establish implementation and numerical-contract behavior only.
They do not validate normal ranges, disease severity, patient fitting, or
clinical outcome claims. Future PVA, PVA-times-heart-rate, and calibrated MVO2
must use separately qualified multi-load PV relations and a held-out fitting
ledger as specified in
[INTEGRATED-MODEL-0006](INTEGRATED-MODEL-0006-pressure-volume-work-and-pva.md).
