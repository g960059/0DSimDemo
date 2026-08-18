# Standard-63 public mechanism qualification ledger

Status: implemented audit boundary; no numerical-model change and no clinical
validation claim

## Purpose

Standard-63 exposes 57 controls and 173 outputs. Catalog exposure establishes
that a user can author an input and observe a named value. It does not establish
that every closed-loop response has a universal direction, that the default
state represents a population, or that a simulated magnitude is clinically
validated.

The machine-readable
`MainWireIntegratedStudioQualificationLedgerV1` therefore separates four
evidence levels:

1. **Definition ownership** — the control is bound to one explicit fixture and
   kernel quantity.
2. **Component direction** — an analytic or isolated component test establishes
   a local response while other inputs are fixed.
3. **Closed-loop characterization** — a versioned intervention, observation
   window, periodicity/eligibility rule, and failure policy establish what this
   exact model did under that protocol.
4. **Clinical validation** — independent data and held-out acceptance criteria
   establish the permitted clinical interpretation and population.

All 57 public controls have level 1 ownership. Some families have complete or
partial level 2 evidence. The ledger deliberately marks every family's general
closed-loop direction as `not-qualified` and clinical validation as
`not-established`. A local monotonicity test must never be promoted directly to
a universal physiological claim.

Run the fail-closed coverage audit with:

```text
npm run audit:scientific:standard63-qualification
```

The audit rejects missing or multiply owned controls, representative outputs
that are absent from the exact registry, and unknown literature anchors. It is
an inventory/claim-boundary gate, not a model fit or a substitute for the future
Experiment evidence ledger.

## Current family boundary

The ledger groups controls only where they share a numerical owner:

- regular-sinus timing;
- fixed total blood volume;
- systemic/pulmonary resistive loss;
- venous stressed-volume distribution and arterial stiffness;
- constant respiratory external pressure;
- five-wall active tension, passive stiffness, and prescribed calcium decay;
- four-valve forward EOA and reverse EROA;
- beat-mean whole-body oxygen boundaries;
- common-pericardial inputs; and
- focal, structural-R1, and structural-Rm coronary disease inputs.

The grouping is not a clinical ontology. For example, prescribed calcium decay
is not renamed generic lusitropy, an EOA control is not a severity diagnosis,
and a coronary resistance multiplier is not a validated CMD endotype.

## Default Workbench contract

Default UI curation is now exported as data rather than duplicated in tests and
documentation. The default controller pane contains eight controls:

- heart rate;
- total blood volume;
- systemic and pulmonary vascular resistance;
- venous tone; and
- LV free-wall active-tension, prescribed calcium-decay-time, and passive-
  stiffness scales.

The default output pane contains 19 atomic outputs covering HR, familiar
aortic/pulmonary pressure summaries, mean LA/RA pressure, event-defined LV
ED/ES/SV/EF, effective AoV output, LV transmural PV path work, and systemic
oxygen delivery. Clinical pressure triplets may be visually composed by the
presentation layer, but their numerical output identities remain separate.

After the first complete capture-to-capture beat, every default beat output
must be finite and available. This is a baseline **availability** gate only. It
does not establish a normal range, disease threshold, or patient
representativeness.

## Exact fixture readback

Workbench and Article Reader recover controller values from the saved exact
Scenario fixture. The readback now covers all 57 controls, including
wall-specific mechanics, valve areas, oxygen boundaries, pericardium, and
territory/layer coronary inputs. A non-default saved fixture must therefore not
be displayed as the catalog default.

`myocardium.contractility` remains a convenience action rather than an
independent fixture field. It has a numeric readback only while LVFW, SEP, and
RVFW active-tension scales are equal. Once a wall-specific edit makes them
different, Workbench and Article Reader present the convenience action as
mixed rather than replacing it with a default or invented average. Applying
the convenience action makes all three detailed controls equal again.

## Literature role

The ledger records literature anchors with a role and two explicit negative
claims: an anchor does not by itself establish magnitude validation, and only a
source actually transcribed into the implementation is marked as such.

- [Guyton 1955](https://doi.org/10.1152/physrev.1955.35.1.123) anchors venous-
  return/cardiac-response physiology, not the magnitude of this model's
  operating point.
- [Land et al. 2017](https://doi.org/10.1016/j.yjmcc.2017.03.008) is the active
  myofilament model source; its cell-scale measurements do not validate the
  assembled whole-heart output.
- [Klotz et al. 2006](https://doi.org/10.1152/ajpheart.01240.2005) anchors
  whole-organ EDPVR measurement context. It is not treated as a direct tissue
  law or proof of the current passive scale.
- [Gorlin and Gorlin 1990](https://doi.org/10.1016/0735-1097(90)90210-G)
  anchors the flow/area/gradient measurement context. The current hydraulic
  EOA is not silently relabelled anatomic, Doppler, or Gorlin area.
- [Fenn, Rahn, and Otis 1946](https://doi.org/10.1152/ajplegacy.1946.146.5.637)
  anchors the alveolar-gas relation; it does not validate the omitted lung or
  tissue-oxygen dynamics.
- [Young and Tsai 1973](https://doi.org/10.1016/0021-9290(73)90099-7) anchors
  the focal stenosis loss law, while
  [Algranati et al. 2010](https://doi.org/10.1152/ajpheart.00925.2009) provides
  myocardium-coronary interaction context. Neither establishes clinical FFR,
  CFR, or CMD equivalence.

## Next qualification order

The ledger is intentionally smaller than an Experiment protocol system. The
next model-owned evidence should be added only in this order:

1. qualify a periodic closed LV/RV loop before promoting PV path work to EW;
2. freeze and qualify multi-load ESPVR/EDPVR measurement contracts;
3. derive exact PE and PVA geometry from those admitted relations;
4. build chamber-mechanics and valve anchor Experiments from the qualified
   measurements; and
5. calibrate any PVA-to-MVO2 mapping separately with held-out data.

Exploratory Experiments remain free to produce unexpected observations. An
observation becomes an official directional claim only after a separate claim
record binds its Scenario roles, model/surface release, observation window,
eligibility policy, and sealed rerun evidence.
