---
title: "Arterial-load morphology audit v1"
status: "Proposed"
claim_boundary: "diagnostic-only-no-model-change"
---

# Arterial-load morphology audit v1

## 1. Objective

Audit arterial-load and semilunar-open ejection morphology:

```text
LV/AoV/aortic path
RV/PV/pulmonary path
```

The primary readouts are AoV/PV-open ejection squareness, ejection top
curvature, ejection corner sharpness, and AoP/PAP incisura morphology.

Current code is not treated as a pure single-node Windkessel: it has proximal
and downstream nodes such as `Ao`, `SA`, `Art`, and `Cap`, and dynamic edges
such as `Ao_SA`. The diagnostic hypothesis is narrower: the current proximal
arterial/load model may still be insufficient for AoP incisura, aortic-root/Zc
morphology, and reflection-driven ejection-limb curvature. This audit separates
that lane from Land/active-stress work.

This audit is diagnostic-only. It does not change model equations, solver
behavior, official case parameters, UI display smoothing, package scripts,
runtime wiring, or official morphology acceptance.

The future runner should inspect the canonical read-only official case ids:

```text
normal-sinus
acute-anterior-mi
systolic-heart-failure
lv-failure-dobutamine
```

## 2. Scope

The arterial-load audit uses the common phase labels from
[pv-loop-morphology-quality.md](pv-loop-morphology-quality.md), especially:

```text
ejection
transition
uncertain
```

The ejection limb is defined by semilunar valve open and AV valve closed. The
report should split semilunar-opening corner, core ejection, peak/top region,
semilunar-closing corner, and event-adjacent transition windows. If those
subregions cannot be inferred cleanly, the runner should report missing
evidence rather than forcing labels.

## 3. Required signals

Core LV/AoV/aortic signals:

- `lvPressurePa`, `lvVolumeM3`
- `aorticValveOpen`, `aorticFlowM3PerSec`
- `aorticPressurePa`, downstream systemic arterial pressures when available
- aortic-root/proximal arterial flow such as `Ao_SA` when available
- `mitralValveOpen`

Core RV/PV/pulmonary signals:

- `rvPressurePa`, `rvVolumeM3`
- `pulmonaryValveOpen`, `pulmonaryFlowM3PerSec`
- `pulmonaryArteryPressurePa`, downstream pulmonary arterial pressures when
  available
- pulmonary proximal arterial flow when available
- `tricuspidValveOpen`

Attribution signals:

- characteristic impedance (`Zc`) when available;
- arterial reflection coefficient and delay when available;
- aortic and pulmonary root compliance when available;
- semilunar valve open/close event time and valve residuals;
- qDot raw/post values, qDot clamp hit01, and qDot clamp impulse when available;
- valve diode and dynamic flow clamp hits when available;
- active stress, passive stress, fiber strain, and fiber strain rate when
  available;
- stroke work or pressure-volume work proxy when available;
- solver substep count.

Optional signals are not required to exist in the current runtime. If absent,
the future runner should mark the corresponding classification evidence as
`unavailable`.

## 4. Metrics

Primary ejection metrics:

- `semilunarOpenEjectionSquareness`
- `aovOpenEjectionSquareness`
- `pvOpenEjectionSquareness`
- `ejectionTopCurvature`
- `ejectionCornerSharpness`
- `cornerSharpnessAtOpen`
- `cornerSharpnessAtClose`
- `ejectionPlateauFraction`
- `ejectionLimbKinkCount`

Arterial pressure metrics:

- `arterialPressureIncisuraDepth`
- `arterialPressureIncisuraTimingSec`
- `incisuraPresenceScore`
- `aovOpenAoPIncisuraScore`
- `pvOpenPAPIncisuraScore`
- `arterialPressureTopCurvature`
- `ventricularArterialGradientProfile`
- `peakPressureTimingAsFractionOfEjection`

Attribution metrics:

- `zcCouplingScore`
- `reflectionCouplingScore`
- `rootComplianceCouplingScore`
- `semilunarValveEventCoincidenceFraction`
- `activeStressCouplingScore`
- `qDotCoincidenceFraction`
- `samplingOnlyScore`
- `aoPulmonaryAsymmetryIndex`

Every metric must be reported by chamber, semilunar valve, arterial bed, beat,
sampling mode, and transition policy. It must also carry `caseId` and
`branchId` so multi-instance official cases remain unambiguous. The runner must
preserve both `transition-inclusive` and `transition-excluded-core` values.

## 5. Classification labels

The audit may classify a finding as:

```text
arterial-load-morphology-finding
aov-open-ejection
pv-open-ejection
excessive-squareness
flat-top-curvature
sharp-corner
incisura-present
incisura-absent
incisura-inverted
flat-aop-during-ejection
flat-pap-during-ejection
aop-lacks-incisura
pap-lacks-incisura
valve-transition-corner
active-stress-plateau
afterload-too-compliant
z-candidate-deficit
zc-correlated
reflection-correlated
root-compliance-correlated
semilunar-valve-correlated
active-stress-correlated
qdot-correlated
sampling-only
transition-dominated
unclassified
```

These labels are not fix instructions. `zc-correlated` does not authorize
impedance tuning, `root-compliance-correlated` does not authorize compliance
tuning, and `active-stress-correlated` does not authorize active-stress changes.

## 6. Incisura policy

AoP/PAP incisura should be evaluated from raw arterial pressure around
semilunar close, then compared with event-aligned and resampled views. The
runner may report present, absent, inverted, transition-dominated, or
unclassified. It must not infer a clean incisura from smoothed or resampled data
when raw pressure evidence is absent.

Incisura reporting is especially sensitive to event timing, root compliance,
wave reflection, and sampling. The audit therefore requires classification
evidence rather than a single pass/fail notch score.

## 7. Anti-gaming guards

The audit is specifically designed to avoid easy false improvement:

- do not change official case parameters;
- do not change arterial resistance, compliance, Zc, reflection, semilunar
  valve thresholds, qDot clamp policy, active stress, solver settings, or model
  equations;
- do not smooth or decimate the primary ventricular pressure, arterial
  pressure, volume, flow, qDot, or valve traces;
- do not report only transition-excluded values;
- do not classify missing incisura as physiologic without raw AoP/PAP and
  semilunar-close evidence;
- do not use different formulas for aortic and pulmonary paths.

The report must always carry output-suppression readouts: SV, CO, stroke work,
peak pressure, MAP/SBP/DBP or pulmonary equivalents, ejection duration,
semilunar forward volume, semilunar reverse volume, and qDot clamp hit
fraction. A later candidate fix fails this audit if squareness improves by
collapsing output/work, creating nonphysiologic reverse flow, excessive damping,
or increasing qDot/clamp events.

## 8. Machine-readable artifact

```text
data/myocardium/protocols/arterial-load-morphology-v1.json
```

The artifact uses `schemaVersion=1`, `status=proposed`, and
`claimBoundary=diagnostic-only-no-model-change`.
