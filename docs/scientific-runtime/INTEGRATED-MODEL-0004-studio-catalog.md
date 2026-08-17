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

| Control ID | Fixture key | Unit | Minimum | Default | Maximum | Step |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `hemodynamics.systemic-resistance` | `systemicResistance` | 1 | 0.75 | 1.00 | 1.25 | 0.01 |
| `hemodynamics.pulmonary-resistance` | `pulmonaryResistance` | 1 | 0.45 | 0.625 | 0.80 | 0.005 |
| `hemodynamics.venous-tone` | `venousTone` | 1 | 0.00 | 0.15 | 1.00 | 0.01 |
| `hemodynamics.arterial-stiffness` | `arterialStiffness` | 1 | 0.50 | 0.75 | 1.00 | 0.01 |
| `rhythm.heart-rate-bpm` | `heartRateBpm` | bpm | 40 | 60 | 100 | 1 |
| `hemodynamics.total-blood-volume-ml` | `totalBloodVolumeMl` | mL | 4200 | 5600 | 7000 | 50 |
| `ventilation.peep-cm-h2o` | `peepCmH2O` | cmH2O | 0 | 0 | 20 | 1 |

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

## Signal Output Catalog

The 35 signals comprise:

- four chamber volumes;
- absolute LA/LV/RA/RV, Ao/SA/PA/PVein/VC pressures;
- transmural LA/LV/RA/RV pressures;
- MV/AoV/TV/PV valve flows;
- systemic tissue (`SA_Art`), pulmonary (`PA_PArt`), systemic venous-return
  (`VC_RA`), and pulmonary venous-return (`PVein_LA`) flows;
- total/LAD/LCx/RCA coronary inlet flows;
- common pericardial excess pressure;
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

| Output ID | Unit | Definition |
| --- | ---: | --- |
| `hemodynamics.pressure.mean.Ao` | mmHg | time-weighted complete-beat mean |
| `hemodynamics.pressure.systolic.Ao` | mmHg | complete-beat maximum |
| `hemodynamics.pressure.diastolic.Ao` | mmHg | complete-beat minimum |
| `hemodynamics.pressure.pulse.Ao` | mmHg | maximum minus minimum |
| `hemodynamics.pressure.mean.PA` | mmHg | time-weighted complete-beat mean |
| `hemodynamics.pressure.mean.LA` | mmHg | time-weighted complete-beat mean |
| `hemodynamics.pressure.mean.RA` | mmHg | time-weighted complete-beat mean |
| `hemodynamics.volume.maximum.LV` | mL | complete-beat maximum |
| `hemodynamics.volume.minimum.LV` | mL | complete-beat minimum |
| `hemodynamics.stroke-volume.LV-extrema` | mL | LV maximum minus minimum |
| `hemodynamics.ejection-fraction.LV-extrema` | 1 | extrema SV divided by maximum LV volume |
| `myocardium.work.external.LV-transmural-pressure-volume-path` | mmHg*mL | negative signed `P_tm dV` line integral over accepted capture-to-capture endpoints; no synthetic closing segment |
| `hemodynamics.output.native-left` | L/min | positive AoV-flow beat integral divided by duration |
| `hemodynamics.output.systemic-tissue` | L/min | signed `SA_Art` beat integral divided by duration |
| `hemodynamics.output.pulmonary` | L/min | signed `PA_PArt` beat integral divided by duration |

Maximum/minimum LV volume is intentionally not called EDV/ESV. Event-defined
EDV/ESV can be added only when the corresponding valve-event measurement
contract is implemented.

The LV work output is path work, not a UI integration of sampled Canvas data.
It uses the model's transmural pressure basis and is positive for the usual
counter-clockwise LV loop. A periodic closed path can be interpreted as
transmural external mechanical work after its periodicity gate passes; an open
transient path also has a mathematically valid path integral but is not silently
promoted to stroke work. It does not include potential energy and is not PVA or
myocardial oxygen consumption. See
[INTEGRATED-MODEL-0006](INTEGRATED-MODEL-0006-pressure-volume-work-and-pva.md).

## Graph Catalog

The registry exposes four constructors rather than many preset panes:

- `hemodynamics.pressure.waveform`: chamber, vascular, pericardial, pleural,
  and alveolar mmHg series; LVP/LAP/AoP are the default;
- `hemodynamics.flow.waveform`: valve, coronary, support, systemic,
  pulmonary, and venous-return mL/s series; four valve flows are the default;
- `hemodynamics.pressure-volume`: LV/RV/RA/LA selectable, LV default;
- `hemodynamics.guyton-starling`: left, right, or bilateral on-demand analysis.

Graph color, label, sweep window, history depth, and picked series belong to
the authored Experiment Surface. Output and Control panes do not use per-item
color.

## Deliberately deferred

LV-only contractility is not registered: the current provider owns a shared
LVFW/SEP/RVFW material construction and has no honest continuous LV-only scale.
Valve disease, respiratory waveforms, rhythm modes, MCS enable/speed, oxygen
balance, qualified ESPVR/EDPVR, PVA, and settled sweep protocols likewise
remain absent until their numerical owner, fixture mapping, exact restore, and
endpoint tests exist. The current responsive Starling result remains an
explicitly unsettled ephemeral preview rather than publication evidence.
