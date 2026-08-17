# Integrated V3 Studio catalog

Status: implemented development surface. This document records what the exact
registered package can execute and observe; it is not a backlog disguised as a
catalog and makes no clinical-validation claim.

## Ownership rules

- A Control is a model-owned semantic fixture input. Applying it opens a new
  fixture epoch from the current accepted `(revision, t, state)` boundary; the
  action then expires and the resulting value is stored only as part of the
  Scenario fixture.
- There is no durable `ParameterSet` and no second model-level Knob catalog.
  Workbench and Article controls are presentation bindings to Control IDs.
- Signals and metrics share one Output ID space. Runtime status, settlement,
  numerical health, clocks, and authoring versions are not Outputs.
- A Protocol must own an executable sequence and result schema. Candidate
  names without such an owner are not registered.

## Control Catalog

All current controls have
`changeSemantics: accepted-state-warm-start`.

### Hemodynamics and rhythm

| Control ID                           |  Unit | Minimum | Default | Maximum |  Step |
| ------------------------------------ | ----: | ------: | ------: | ------: | ----: |
| `hemodynamics.systemic-resistance`   |     1 |    0.75 |    1.00 |    1.25 |  0.01 |
| `hemodynamics.pulmonary-resistance`  |     1 |    0.45 |   0.625 |    0.80 | 0.005 |
| `hemodynamics.venous-tone`           |     1 |    0.00 |    0.15 |    1.00 |  0.01 |
| `hemodynamics.arterial-stiffness`    |     1 |    0.50 |    0.75 |    1.00 |  0.01 |
| `rhythm.heart-rate-bpm`              |   bpm |      40 |      60 |     100 |     1 |
| `hemodynamics.total-blood-volume-ml` |    mL |    4200 |    5600 |    7000 |    50 |
| `ventilation.peep-cm-h2o`            | cmH2O |       0 |       0 |      20 |     1 |

### Five-wall mechanics

The material walls are `LA`, `LVFW`, `SEP`, `RVFW`, and `RA`. Each wall has
three continuous controls:

| Control family                               | Numerical primitive                                                    | Minimum | Default | Maximum | Step |
| -------------------------------------------- | ---------------------------------------------------------------------- | ------: | ------: | ------: | ---: |
| `myocardium.active-tension-scale.{wall}`     | Land `Tref` scale                                                      |    0.75 |       1 |    1.33 | 0.01 |
| `myocardium.passive-stiffness-scale.{wall}`  | equilibrium passive stress/energy/tangent and SLS branch-modulus scale |    0.75 |       1 |    1.33 | 0.01 |
| `myocardium.calcium-decay-time-scale.{wall}` | prescribed calcium-drive decay-time scale                              |    0.75 |       1 |    1.50 | 0.01 |

`myocardium.contractility` remains a convenience group control. One action
atomically writes the LVFW, SEP, and RVFW active-tension scales. It is not an
independent fixture field. SEP remains explicit because it is shared by both
ventricles. The calcium-decay control is not named generic lusitropy: there is
no SERCA/RyR state, force-frequency response, or guarantee that every clinical
relaxation phenotype is represented.

### Four-valve effective areas

| Valve | Maximum-forward EOA range/default (cm2) | Closed-reverse EROA range/default (cm2) |
| ----- | --------------------------------------: | --------------------------------------: |
| MV    |                        0.60–6.00 / 5.50 |                              0–0.60 / 0 |
| AoV   |                        0.50–4.00 / 3.50 |                              0–0.50 / 0 |
| TV    |                        0.70–9.00 / 8.00 |                              0–0.70 / 0 |
| PV    |                        0.35–5.00 / 4.00 |                              0–1.00 / 0 |

Control IDs are `valve.maximum-forward-eoa-cm2.{valve}` and
`valve.closed-reverse-eroa-cm2.{valve}`. These are continuous numerical
research inputs, not clinical severity labels. The separately retained
mild/moderate/severe research brackets are named fixtures layered over the
same primitives and still require closed-loop calibration.

### Beat-mean oxygen boundary

| Control ID                                      |      Unit | Minimum | Default | Maximum | Step |
| ----------------------------------------------- | --------: | ------: | ------: | ------: | ---: |
| `oxygen.hemoglobin-g-per-dl`                    |      g/dL |       5 |      15 |      20 |  0.1 |
| `oxygen.inspired-oxygen-fraction`               |         1 |    0.21 |    0.21 |    1.00 | 0.01 |
| `oxygen.arterial-carbon-dioxide-pressure-mm-hg` |      mmHg |      20 |      40 |      80 |    1 |
| `oxygen.respiratory-exchange-ratio`             |         1 |    0.70 |    0.80 |    1.00 | 0.01 |
| `oxygen.barometric-pressure-mm-hg`              |      mmHg |     500 |     760 |     800 |    1 |
| `oxygen.true-shunt-fraction`                    |         1 |       0 |    0.02 |    0.50 | 0.01 |
| `oxygen.target-consumption-ml-per-min`          | mL O2/min |     100 |     250 |     600 |    5 |

### Common pericardium

| Control ID                                | Unit | Minimum | Default | Maximum | Step |
| ----------------------------------------- | ---: | ------: | ------: | ------: | ---: |
| `pericardium.reference-capacity-scale`    |    1 |    0.75 |       1 |    1.25 | 0.01 |
| `pericardium.pressure-scale`              |    1 |    0.25 |       1 |       4 | 0.05 |
| `pericardium.exponential-stiffness-scale` |    1 |    0.50 |       1 |       2 | 0.05 |
| `pericardium.prescribed-fluid-volume-ml`  |   mL |       0 |       0 |     500 |   10 |

These axes map the existing common-pericardium capacity, exponential pressure
scale, exponent, and prescribed fluid volume. They are numerical mechanism
controls, not a diagnosis or calibrated tamponade severity scale.

### Coronary disease

| Control family                                                | Scope                                         | Minimum | Default | Maximum | Step |
| ------------------------------------------------------------- | --------------------------------------------- | ------: | ------: | ------: | ---: |
| `coronary.focal-diameter-loss-fraction.{territory}`           | LAD/LCx/RCA                                   |       0 |       0 |    0.85 | 0.01 |
| `coronary.structural-r1-resistance-scale.{territory}.{layer}` | each territory x subepicardial/subendocardial |    0.50 |       1 |       5 | 0.05 |
| `coronary.structural-rm-resistance-scale.{territory}.{layer}` | each territory x subepicardial/subendocardial |    0.50 |       1 |       5 | 0.05 |

Focal diameter loss is mapped through the existing focal-lesion pressure-loss
law. Structural R1 and Rm scales remain separate by territory and layer.
Autoregulatory tone is observed but its lower physiological bound is not
repurposed as a disease slider.

Heart rate owns the regular-sinus cycle length, exact-event calcium conversion,
and cycle-aligned coronary window. Its current upper bound is 100 bpm because
the existing atrial calcium prior cannot be converted above that range without
a negative event-free resting calcium term. PEEP is authored in cmH2O and
converted once into the runtime's mmHg pressure basis. This exact release has
no respiratory oscillation owner, so PEEP changes the constant alveolar level
and its defined pleural coupling, not a fabricated ventilator waveform.

The fixed-TBV range is portable across cold starts, live accepted-state edits,
checkpoints, and immutable Snapshots. The initializer changes only the shared
SV/VC transmural-pressure offset and remains within the shipped venous PV-law
domain. During a live edit, TBV still reuses the current accepted boundary.

All chamber, valve, oxygen, pericardial, and coronary values live in one exact
`mechanismResearchInputs` fixture object. Chamber, valve, pericardial, and
coronary inputs alter the numerical runtime; oxygen inputs alter only the
observer. Every complete fixture is validated before an atomic warm start.

The exact model owns 57 controls. The default controller pane remains a
curated six-item teaching surface: heart rate, total blood volume, systemic
resistance, common ventricular active tension, venous tone, and PEEP. This
curation does not remove any detailed control from the catalog.

## Signal Output Catalog

The 77 signals comprise:

- four chamber volumes;
- absolute LA/LV/RA/RV, Ao/SA/PA/PVein/VC pressures;
- transmural LA/LV/RA/RV pressures;
- MV/AoV/TV/PV valve flows;
- systemic tissue (`SA_Art`), pulmonary (`PA_PArt`), systemic venous-return
  (`VC_RA`), and pulmonary venous-return (`PVein_LA`) flows;
- total/LAD/LCx/RCA coronary inlet and common venous-outlet flows;
- territory-specific large-arterial outflow and storage rate;
- territory/layer R1, internal Qm, and R2 flows and effective tone-resistance
  scales;
- territory post-focal pressure and focal pressure loss, plus total coronary
  dissipated hydraulic power;
- common pericardial excess pressure, heart/fluid/occupied volumes, and stored
  energy;
- pleural and alveolar pressures;
- LVAD accepted flow;
- instantaneous regular-sinus heart rate and cycle phase.

Accepted-step readbacks are `null` after cold construction, exact restore, or
a fixture warm-start boundary until the first new-fixture step is accepted.
Algebraic accepted-state values remain available at those boundaries. Missing
readback is never represented as zero.

## Beat Metric Output Catalog

The session accumulates every accepted endpoint, including event-clipped
substeps, from one captured atrial activation to the next. UI sampling and
graph decimation never participate. Until a complete beat exists, every beat
metric is unavailable.

The 96 metrics comprise:

- systolic/diastolic/mean/pulse summaries for Ao, systemic arterial, and
  pulmonary arterial pressure; mean PVein, VC, LA, and RA pressure; and peak
  LV/RV absolute pressure;
- systemic and pulmonary mean pressure differences;
- four retained LV extrema metrics (`maximum`, `minimum`, extrema SV, and
  extrema EF), whose names remain explicitly non-event-defined;
- eight event-defined metrics per ventricle: EDV, absolute/transmural EDP,
  ESV, absolute/transmural ESP, SV, and EF;
- six metrics per valve: forward volume, reverse magnitude, signed net volume,
  same-valve reverse/forward fraction, and forward-flow mean/peak hydraulic
  pressure differences;
- LV and RV transmural PV path work and accepted-step absolute-pressure-rate
  maxima/minima;
- forward-only and effective-net native left/right outputs, systemic and
  pulmonary venous returns, systemic-tissue and pulmonary outputs;
- effective SVR, PVR, and pulmonary arterial compliance;
- an Ao-diastolic-minus-event-defined-absolute-LVEDP coronary perfusion
  pressure surrogate; and
- 14 oxygen-transport observations.

Clinical display convention is explicit rather than inferred from a generic
`mean/max/min` template. Systemic arterial pressure and pulmonary arterial
pressure expose systolic/diastolic values as their familiar headline values,
with mean and pulse pressure also available. CVP is labelled as time-weighted
mean RA pressure. Mean PVein remains a model pulmonary-vein-node pressure and
is not named PAWP. Valve gradients integrate the upstream-minus-downstream
pressure difference only while model flow is forward; they are hydraulic
pressure differences, not Doppler velocities or simplified-Bernoulli
gradients.

The naming convention follows the familiar clinical reporting surface rather
than changing the numerical definition: the
[AHA blood-pressure measurement statement](https://professional.heart.org/en/guidelines-statements/measurement-of-blood-pressure-in-humans-a-scientific-statement-from-thehyp0000000000000087)
uses systolic and diastolic pressure as the standard headline pair, while the
[2022 ESC/ERS pulmonary-hypertension guideline](https://academic.oup.com/eurheartj/article/43/38/3618/6673929)
reports systolic/diastolic/mean pulmonary arterial pressure and mean right
atrial pressure in its right-heart-catheterization variables. This provenance
governs labels only; it does not turn simulated node pressures into clinical
measurements or diagnoses.

Ventricular landmarks use the first accepted-step positive-to-nonpositive
valve-flow crossing in the beat and linearly interpolate time, volume, and
pressure at zero flow:

| Ventricle | End diastole | End systole | Event output families                                                |
| --------- | ------------ | ----------- | -------------------------------------------------------------------- |
| LV        | MV closure   | AoV closure | `...LV-at-MV-closure`, `...LV-at-AoV-closure`, `...LV-event-defined` |
| RV        | TV closure   | PV closure  | `...RV-at-TV-closure`, `...RV-at-PV-closure`, `...RV-event-defined`  |

An absent or incorrectly ordered pair produces `null`; no event is synthesized.
Absolute and transmural event pressures have different Output IDs. The event
SV is `EDV - ESV`. In valve disease it is not automatically the effective
forward stroke volume. `hemodynamics.valve-volume.net.AoV` and `.PV` are the
corresponding native effective forward beat volumes in the all-support-off
Standard fixture.

For each of `MV`, `AoV`, `TV`, and `PV`, the volume IDs are
`hemodynamics.valve-volume.{forward|reverse|net}.{valve}`. Linear
zero-crossing splitting prevents one accepted interval from being counted
wholly forward or reverse. The ratio ID is
`hemodynamics.valve-regurgitant-fraction.same-valve.{valve}`. It is deliberately
called _same-valve reverse/forward_, because it is not necessarily the clinical
regurgitant-fraction denominator used for every lesion.

The LV and RV work outputs are path work, not UI integrations of sampled Canvas
data. They use each ventricle's transmural pressure basis and are positive for
the usual counter-clockwise loop. A periodic closed path can be interpreted as
transmural external mechanical work after its periodicity gate passes; an open
transient path also has a mathematically valid path integral but is not silently
promoted to stroke work. They do not include potential energy and are not PVA
or myocardial oxygen consumption. See
[INTEGRATED-MODEL-0006](INTEGRATED-MODEL-0006-pressure-volume-work-and-pva.md).

The oxygen outputs are alveolar and arterial PO2, the A-a gradient,
end-capillary and arterial saturation/content, required mixed-venous
content/saturation/PO2, systemic DO2, target VO2, required OER, and DO2/VO2.
They use systemic-tissue beat flow, the alveolar gas equation, fixed adult Hill
ODC/content constants, true-shunt content mixing, and steady Fick closure.
When the target requires nonpositive flow or negative arterial/venous content,
dependent outputs are `null`; target VO2 is not silently reduced. This is a
static observer with no organ partition, diffusion limit, extraction ceiling,
oxygen debt, lactate state, or feedback into hemodynamics.

Every one of the 173 registered outputs declares three significant digits for
Workbench and Article presentation. The stored and transferred numerical value
is not rounded.

## Graph Catalog

The current Workbench exposes four constructors rather than many preset panes:

- `hemodynamics.pressure.waveform.comprehensive-v1`: chamber, vascular,
  post-focal coronary, focal-loss, pericardial, pleural, and alveolar mmHg
  series; LVP/LAP/AoP are the default;
- `hemodynamics.flow.waveform.comprehensive-v1`: valve, detailed coronary,
  support, systemic, pulmonary, and venous-return mL/s series; four valve flows
  are the default;
- `hemodynamics.pressure-volume`: LV/RV/RA/LA selectable, LV default;
- `hemodynamics.guyton-starling`: left, right, or bilateral on-demand analysis.

The immutable `hemodynamics.pressure.waveform` and
`hemodynamics.flow.waveform` definitions remain in Surface v2 so previously
authored Experiments retain their exact graph catalogs. New Workbench panes use
the comprehensive graph IDs above when the pinned model supports them, and
fall back to the immutable legacy IDs for historical model contracts.

Graph color, label, sweep window, history depth, and picked series belong to
the authored Experiment Surface. Output and Control panes do not use per-item
color.

## Deliberately deferred

A chamber-only ventricular control that silently assigns the septum to one
side is not registered; Standard-63 exposes LVFW, SEP, and RVFW directly and
offers only an explicit three-wall convenience group. Generic lusitropy,
force-frequency coupling, disease-calibrated valve kinetics, clinical severity
diagnosis, respiratory waveforms, rhythm modes, MCS enable/speed, dynamic
oxygen debt or lactate, organ oxygen partition, autonomic reflexes, qualified
ESPVR/EDPVR, PVA, and settled sweep protocols remain absent. The current
responsive Starling result remains an explicitly unsettled ephemeral preview
rather than publication evidence.
