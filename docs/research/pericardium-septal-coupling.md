# Pericardium + Septal Coupling

Model files:

- `engine/mechanics/pericardium.ts`
- `engine/mechanics/septum.ts`
- `engine/ModelCore.ts`
- `engine/__tests__/interactionMechanics.test.ts`

## Summary

This branch adds a deliberately limited Stage-1/2 interaction model:

1. a nonlinear pericardial pressure common to LA/LV/RA/RV, and
2. a septal volume-shift coordinate that changes LV/RV free-wall effective volume.

It is not a full TriSeg implementation. It is a real-time-safe surrogate that
preserves the graph-based closed loop and the active-stress chamber source of
truth. The next-level replacement would solve the three-wall geometry of LV free
wall, septum, and RV free wall.

## Equations

### Pericardium

The model treats the heart inside the pericardium as the four chamber blood
volumes plus a non-blood pericardial-fluid parameter:

```text
Vheart = VLV + VRV + VLA + VRA + VperiFluid
```

The pericardial elastic pressure is a slack-volume exponential with smooth
positive part:

```text
dVplus = softness * softplus((Vheart - Vslack) / softness)
Ppc    = Pbias + Pscale * (exp(dVplus / Vscale) - 1)
Pperi  = Pth + Ppc
```

`Pperi` is added once as the external pressure for all four heart chambers:

```text
PLA = Pperi + PLA_wall
PRA = Pperi + PRA_wall
PLV = Pperi + PLV_freewall
PRV = Pperi + PRV_freewall
```

This follows the common 0D model pattern: intrathoracic pressure and pericardial
constraint are external/common-mode pressures, while chamber-wall pressure is a
transmural pressure. Chung et al. model ventricular interaction and pericardial
influence as pericardium-bound coupled ventricles; later cardiopulmonary 0D
models also use an exponential pericardial pressure-volume relation.

### Septal Volume Shift

The septal shift is stored as one state variable, `septumShiftMl`:

```text
septumShiftMl > 0  => septum shifts toward the LV and constrains LV filling
septumShiftMl < 0  => septum shifts toward the RV
```

The active-stress/free-wall pressure calculation sees effective ventricular
volumes:

```text
VLVeff = VLV + septumShiftMl
VRVeff = VRV - septumShiftMl
```

The restoring pressure is nonlinear:

```text
Psep = stiffnessScale * (k1 * shift + k3 * shift^3)
```

The shift dynamics are first-order force relaxation:

```text
d(shift)/dt = (PRVfw - wLV * PLVfw - Psep) / damping
```

`wLV` is the lumped geometric force weight on LV free-wall pressure. It is not a
physiological constant; it compensates for reducing TriSeg's surface tension and
curvature balance to a single pressure-coordinate relation. With `wLV = 1`, the
high LV systolic pressure dominates the coordinate and produces a persistent
RV-side septal shift even at normal baseline. The calibrated default `wLV = 0.28`
keeps resting shift small while preserving the expected direction under RV
pressure overload.

The interaction pressure diagnostics are differences, not separately-added
pressures:

```text
PVI_LV = PLVfw(VLVeff) - PLVfw(VLV)
PVI_RV = PRVfw(VRVeff) - PRVfw(VRV)
```

Do not add `PVI_*` to the final chamber pressure. Doing so double-counts the
volume-shift effect.

## Parameters

| Parameter | Default | Unit | Rationale |
|---|---:|---|---|
| `pericardiumEnabled` | `true` | bool | Active by default, near-neutral at baseline. |
| `pericardialPressureScaleMmHg` | `1.0` | mmHg | Exponential scale; low at baseline, rises with effusion. |
| `pericardialSlackVolumeMl` | `340` | mL | Current four-chamber blood volume over the last complete beat is about 218-349 mL; slack just above the upper normal range keeps baseline Ppc small. |
| `pericardialVolumeScaleMl` | `45` | mL | Effusion of about 100 mL raises Ppc into a several-mmHg range; 180 mL causes marked low-output physiology. |
| `pericardialSoftnessMl` | `8` | mL | Smooths the slack transition and avoids hard derivative jumps. |
| `pericardialBiasMmHg` | `0` | mmHg | No baseline offset beyond `Pth`. |
| `pericardialFluidMl` | `0` | mL | Non-blood pericardial contents; not included in TBV. |
| `septalCouplingEnabled` | `true` | bool | Active by default with small resting shift. |
| `septalStiffnessScale` | `1` | multiplier | User-facing stiffness multiplier. |
| `septalK1MmHgPerMl` | `1.4` | mmHg/mL | Linear restoring term. |
| `septalK3MmHgPerMl3` | `0.006` | mmHg/mL^3 | Limits large shifts without a hard discontinuity. |
| `septalDampingMmHgSecPerMl` | `4.0` | mmHg*s/mL | Converts pressure-force residual to mL/s shift dynamics. |
| `septalMaxShiftMl` | `25` | mL | Hard safety bound, further limited by chamber floor reserve. |
| `septalLvPressureWeight` | `0.28` | dimensionless | Lumped geometry/tension weight for the simplified coordinate. |

## Measured Current Behavior

At the active-stress baseline after this implementation:

- Ppc over the last complete beat: about 0.00-0.26 mmHg.
- septumShiftMl: about 0.50-0.59 mL.
- PVI_LV: about -0.39 to +0.36 mmHg.
- baseline summary: AoP 123.5/79.9, PAP mean 17.9, RAP mean 3.1, LAP mean 9.9, SV_L 82.3 mL, CO_L 6.17 L/min.

Pericardial effusion (`pericardialFluidMl = 100`) raises peak Ppc above baseline
by more than 2 mmHg, increases RAP and LVEDP, lowers LV EDV, and lowers SV_L.
The regression test gates these directions.

RV pressure overload (`pulmonaryResistance = 4x baseline`) raises PAP and moves
the mean septal shift more than 2 mL toward the LV relative to baseline. The test
also requires a positive LV interaction-pressure diagnostic.

## Acceptance Gates

Implemented in `engine/__tests__/interactionMechanics.test.ts`:

- modules are monotone and neutral when disabled;
- pericardium/septum off yields `Ppc = Pperi = septumShiftMl = PVI_* = 0`;
- effusion raises Ppc, RAP, LVEDP, lowers SV_L, and lowers LV EDV;
- RV pressure overload raises PAP and increases septal shift toward the LV.

Baseline gates in `engine/__tests__/baseline.test.ts` remain in the normal range.

## Literature Grounding

- Chung et al. (1997), "A dynamic model of ventricular interaction and pericardial influence", describes pericardium-bound left/right ventricles represented as coupled chambers with free walls and interventricular septum, and reports passive/active ventricular interaction plus pericardial effects. DOI: <https://doi.org/10.1152/ajpheart.1997.272.6.h2942>. Metadata/abstract: <https://scholars.uky.edu/en/publications/a-dynamic-model-of-ventricular-interaction-and-pericardial-influe>.
- Lumens et al. (2009), "Three-Wall Segment (TriSeg) Model Describing Mechanics and Hemodynamics of Ventricular Interaction", is the canonical three-wall LV free wall/septum/RV free wall approach. DOI: <https://doi.org/10.1007/s10439-009-9774-2>.
- CircAdapt TriSeg documentation describes a two-cavity, three-wall element and solves septal geometry by minimizing total wall deformation energy: <https://framework.circadapt.org/2407/userguide/components/node/cavity/TriSeg.html>.
- CircAdapt VanOsta2024 documentation states that a one-fiber wall model establishes stress-pressure relationships and that TriSeg facilitates interventricular interaction across the septum: <https://framework.circadapt.org/2409/userguide/models/VanOsta2024.html>.
- Regazzoni et al. (2020/2022) emphasize energy-consistent 3D-0D coupling with boundary conditions accounting for chamber interaction, pericardium, and surrounding tissue: <https://arxiv.org/abs/2011.15040>.
- A cardiopulmonary model paper documents pericardial volume coupling and an exponential pericardial pressure-volume relationship in a four-chamber model: <https://purehost.bath.ac.uk/ws/portalfiles/portal/30586655/Cardiopulmonary_Model_paper_JEIM.pdf>.

## Open Questions

- Replace `septalLvPressureWeight` with an explicit geometry/tension term when a
  TriSeg-lite implementation is introduced.
- Add a dedicated tamponade/constriction lesson case after clinical ranges are
  reviewed.
- Distinguish displayed absolute pressure from transmural pressure in the UI
  before using high PEEP/effusion cases for teaching.
