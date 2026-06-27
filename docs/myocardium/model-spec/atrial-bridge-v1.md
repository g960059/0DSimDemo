---
title: "Atrial bridge v1 — Model specification"
status: "Proposed"
date: "2026-06-27"
source_adr: "../adr/ADR-MYO-002-atrial-bridge.md"
---

# Atrial bridge v1 — Model specification

## 1. Scope

This specification defines the temporary atrial bridge used to support Phase 6 LV/RV Land closed-loop evaluation.

It is not a final atrial myofilament model. It does not implement atrial Land, RDQ, conservative Ca cycling, regional atrial activation, or atrial scar mechanics.

The bridge exists to provide a physiologically usable LA/RA preload source while preventing a poor time-varying elastance model from contaminating LV/RV Land evaluation.

## 2. Candidate bridge IDs

```text
atrial-elastance-negative-control-v0
legacy-atrial-active-bridge-v0
atrial-reservoir-booster-bridge-v1
```

Only `atrial-reservoir-booster-bridge-v1` is intended as the preferred new bridge candidate. The legacy active bridge is a comparator/fallback. The elastance bridge is a negative control.

## 3. Common input contract

```ts
export type AtrialBridgeInput = {
  chamber: "LA" | "RA";

  activation: ActivationEvent;

  volumeM3: number;
  volumeRateM3PerSec: number;

  venousPressurePa: number;
  ventricularPressurePa: number;

  avValveOpen01: number;
  externalPressurePa: number;

  dtSec: number;
};
```

Requirements:

- `activation` comes from the same `ActivationScheduler` family as ventricular myocardium.
- Atrial bridge must not compute rhythm/AV delay internally.
- Volume rate is supplied by the closed-loop integrator or chamber coordinate owner.
- The bridge must not read LV/RV Land internal states.

## 4. Common output contract

```ts
export type AtrialBridgeOutput = {
  chamberPressurePa: number;

  passivePressurePa: number;
  viscousPressurePa: number;
  boosterPressurePa: number;
  externalPressurePa: number;

  reservoirIndex01: number;
  conduitIndex01: number;
  boosterIndex01: number;

  roughnessMetrics: {
    pressureHighFrequencyEnergy: number;
    pvLoopRoughness: number;
    dPdtSpikeCount: number;
  };

  health: {
    finite: boolean;
    inCalibrationDomain: boolean;
    clampUsed: boolean;
    legacyComparator?: boolean;
    negativeControl?: boolean;
  };
};
```

`reservoirIndex01`, `conduitIndex01`, and `boosterIndex01` are diagnostic fractions, not conservation variables.

## 5. A1 — AtrialReservoirBoosterBridgeV1

### 5.1 Pressure decomposition

The preferred bridge has the form:

```text
P_A = P_passive(V_A)
    + P_viscous(dV_A/dt)
    + P_booster(x_A, V_A)
    + P_external
```

Responsibilities:

- passive reservoir pressure describes filling compliance;
- viscous/conduit term damps high-frequency flow/volume disturbances;
- booster term is a stateful contraction term driven by activation;
- external term carries pericardial/AV-plane/ventricular coupling when available.

### 5.2 Minimal state

```ts
export type AtrialReservoirBoosterState = {
  activation01: number;
  boosterPressurePa: number;
  relaxationMemory01?: number;
};
```

### 5.3 Activation dynamics

A minimal implementation may use:

```text
dx_A/dt = (x_inf(phi_A) - x_A) / tau_x
```

where `phi_A` is derived from `activation.timeSinceActivationSec` and `activation.cycleLengthSec`.

The activation state must be smooth at cycle boundaries and must not reset pressure discontinuously.

### 5.4 Booster dynamics

A minimal pressure-state implementation may use:

```text
dP_booster/dt = (P_target(x_A, V_A) - P_booster) / tau_P
```

A more mechanics-consistent implementation may instead maintain a booster tension state and map it through a wall/kinematics derivative:

```text
P_booster = Vw_A * T_A * dE_A/dV_A
```

The pressure-state version is acceptable for the Phase 5.5 bridge shootout if it passes the smoothness, anti-overdamping, and preload-stability gates.

The pressure-state booster is not an atrial twitch-shape model. If future work targets detailed a-wave morphology, AF mechanical remodeling, atrial myopathy, or atrial myofilament physiology, the bridge must be upgraded to a work-conjugate tension/state formulation or replaced by LandAtrial/RDQAtrial rather than fitting the first-order pressure filter harder.

## 6. E0 — atrial-elastance-negative-control-v0

The time-varying elastance candidate is retained only as a negative control:

```text
P_A = E_A(t) * (V_A - V0_A)
```

It must report:

```ts
health.negativeControl = true
```

It must not be selected for Phase 6 unless the owner explicitly overrides ADR-MYO-002 with a new accepted decision.

## 7. A0 — legacy-atrial-active-bridge-v0

The legacy atrial active-stress bridge may be used only as comparator/fallback.

Requirements:

- LA/RA only;
- frozen parameter set;
- no old global active-stress knob semantics;
- no legacy LV/RV active-stress;
- no final-model claim;
- provenance declares `legacyComparator=true`;
- outputs must be converted to the common `AtrialBridgeOutput` contract.

This candidate is useful because it currently appears to produce a comparatively smooth atrial figure-eight PV loop. That behavior must be quantified before the legacy path is removed.

## 8. Required diagnostics

Every candidate must report:

- mean LA/RA pressure;
- a-wave/v-wave timing proxy;
- E/A-like inflow proxy when paired with AV valve flow;
- A-loop and V-loop area proxy;
- A/V loop ratio;
- PV loop roughness;
- pressure high-frequency energy;
- dP/dt spike count;
- qDot/valve event contamination;
- beat-to-beat repeatability;
- LV/RV preload stability contribution.

## 9. Claim boundaries

`AtrialReservoirBoosterBridgeV1` may claim:

- stateful reservoir/conduit/booster bridge behavior;
- smoother atrial preload support than time-fixed elastance;
- temporary support for LV/RV Land closed-loop evaluation.

It must not claim:

- atrial Land/RDQ myofilament physiology;
- SR calcium cycling;
- regional atrial activation/scar/fibrosis;
- definitive atrial disease modeling.

## 10. AF-forward-compatible substrate note

The additive reservoir/conduit/booster decomposition is intentionally compatible with future AF-oriented modeling because atrial kick loss can be represented structurally by disabling or attenuating the booster component while preserving reservoir and conduit behavior.

This is only an architectural affordance. It is not a validation claim for AF, atrial myopathy, or ablation physiology.

## 11. Future path

The recommended future sequence is:

```text
legacy-atrial-active-bridge-v0 baseline
→ atrial-reservoir-booster-bridge-v1
→ LandAtrialV1
→ RDQAtrialV1 if LandAtrialV1 fails defined atrial targets
```

Land/RDQ atrial work remains Phase 7+ research. The bridge shootout is not a substitute for a mechanistic atrial model.
