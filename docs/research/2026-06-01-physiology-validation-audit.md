# Physiology validation audit — active-normal, atrial AV-plane branch

Date: 2026-06-01  
Branch/worktree measured: `codex/avplane-stretch-consistency` in `0DSimDemo-avplane-stretch`  
Model files: [`engine/ModelCore.ts`](../../engine/ModelCore.ts), [`engine/chambers.ts`](../../engine/chambers.ts),
[`engine/protocol.ts`](../../engine/protocol.ts), [`engine/harness.ts`](../../engine/harness.ts),
[`engine/measure.ts`](../../engine/measure.ts)

This note records the multi-review audit requested after the LA/RA AV-plane/reservoir work. It is a
current-branch validity ledger: literature target, model value, physical derivation or inference, and
verdict. It does **not** replace the older M12-era notes; it supersedes their operating-point numbers
for this branch.

## Method

- Code inventory: hard clamps, neutral/default parameters, UI ranges, baseline harness settings, and
  regression gates were read from `protocol.ts`, `ModelCore.ts`, `Controls.tsx`, `knobs.ts`, and tests.
- Four delegated reviews covered: code/range inventory; chamber/PV-loop physiology; valves/flow/
  regurgitation; vascular/respiratory/closed-loop numerics.
- Literature was checked against primary or guideline-like sources where possible: ASE/EACVI chamber
  quantification, Scientific Reports LA loop/MVF morphology, Klotz EDPVR, NCBI Bookshelf physiology
  chapters, NIST pressure conversions, and valve guideline/review sources.
- Current numbers below are from `runScenario(DEFAULT_PARAMS)` using `BASELINE_OPTIONS`: target TBV
  5600 mL, fixed 60 s settle, 30 s measurement, `dt=0.001`, sample 120 Hz.

## Current measured operating point

| Observable | Current value | Literature/physiology anchor | Verdict |
|---|---:|---|---|
| HR | 75 bpm | Resting adult 60-100 bpm | OK |
| TBV | 5600 mL | Average adult near 5 L; size-dependent, `~70 mL/kg` estimate | Plausible if default body size is ~80 kg; document body size |
| AoP | 123.7 / 80.0, mean 87.6 mmHg | Adult resting arterial pressure around 120/80 | OK |
| SV/CO left | 82.5 mL / 6.19 L/min | SV commonly ~60-100 mL, CO ~4-8 L/min | OK, high-normal CO |
| SV/CO right | 78.4 mL / 5.88 L/min | Should match left over steady state | OK for fixed-harness health; settled gate can be stricter |
| LAP mean | 9.99 mmHg | PCWP/LAP normal roughly 4-12 mmHg | OK |
| RAP mean | 3.07 mmHg | RA pressure typically low single digits | OK |
| PAP mean | 17.98 mmHg | Normal mean PAP is commonly around 14-18 mmHg | OK, upper-normal |
| LVEDP approx | 13.09 mmHg | Normal/slightly high filling pressure | Slightly high |
| RVEDP pre-systolic | 4.46 mmHg | RV diastolic pressure should be low single digits | OK |
| RVEDP max-volume approx | 15.23 mmHg | Max-volume sample can land during early upstroke in this model | Use only as legacy/shape proxy |
| LVEF approx | 0.694 | ASE normal biplane LVEF roughly 52-72% male, 54-74% female | OK, high-normal |
| RVEF approx | 0.536 | ASE abnormality threshold for 3D RV EF is `<45%` | OK |
| Pmsf | 17.68 mmHg | Classic/physiologic mean systemic filling pressure is lower; ICU estimates can be higher | Still high if presented as literal normal Pmsf |

Measured beat ranges:

| Signal | Min | Max | Notes |
|---|---:|---:|---|
| LVP | 1.81 | 149.46 | systolic pressure high but plausible with current AoP |
| RVP | 0.98 | 37.91 | systolic mildly high; pre-systolic RVEDP is normal |
| LAP | 6.56 | 15.76 | v/a wave range plausible, upper tail high-normal |
| RAP | 1.53 | 6.64 | mean plausible, range plausible |
| VLV | 37.59 | 122.69 | EF 69.4% |
| VRV | 68.14 | 146.85 | EF 53.6% |
| VLA | 30.94 | 57.74 | LA emptying fraction 46.4% |
| VRA | 40.64 | 74.40 | RA emptying fraction 45.4% |
| QMV | -48.3 | 299.7 mL/s | biphasic forward inflow with brief closure backflow |
| QTV | -21.6 | 284.3 mL/s | biphasic forward inflow |
| QPV | -1.08 | 927.9 mL/s | minimal pulmonary regurgitation |

Morphology gates:

| Feature | Current value | Verdict |
|---|---:|---|
| LA PV-loop self-intersections | 3 | Figure-eight present, but count alone is too weak |
| RA PV-loop self-intersections | 3 | Figure-eight present, but count alone is too weak |
| QMV peaks | 299.7 at theta 0.521; 122.9 at theta 0.949 | Biphasic E/A-like inflow present |
| QTV peaks | 284.3 at theta 0.562; 256.7 at theta 0.969 | Biphasic inflow present |
| PV regurgitant fraction | 0.00022 | Competent default valve |
| TV regurgitant fraction | 0.0102 | Small closure backflow; acceptable default |

## Physical derivations and checks

### 1. Body size and TBV

The default `targetTBV=5600 mL` is not a universal average adult; it implies a large-normal adult if
using the common `~70 mL/kg` estimate:

```text
body_mass ~= 5600 mL / (70 mL/kg) = 80 kg
```

If the application presents the default as "average adult", 5.0 L is closer. If it presents the
default as a larger adult or simulation-normal body, 5.6 L is acceptable. Indexed chamber comparisons
below assume a BSA around 1.8-2.0 m2, so LA max 58 mL gives LAVI about 29-32 mL/m2, below the ASE/EACVI
upper normal 34 mL/m2.

### 2. Clinical SVR and PVR are derived from pressures and CO, not raw knobs

The engine `systemicResistance=0.80` and `pulmonaryResistance=0.65` are dimensionless multipliers.
Clinical resistance should be computed from the settled operating point:

```text
SVR[dyn*s/cm5] = 80 * (MAP - RAP) / CO_L
               = 80 * (87.62 - 3.07) / 6.19
               = 1093 dyn*s/cm5

PVR[dyn*s/cm5] = 80 * (mPAP - LAP) / CO_R
               = 80 * (17.98 - 9.99) / 5.88
               = 109 dyn*s/cm5
```

PVR is within the normal 37-250 dyn*s/cm5 range given by NCBI Bookshelf. SVR now sits in a normal
adult range, matching the normotensive arterial pressure.

### 3. Arterial compliance from pulse pressure

The runtime vascular compliance parameters are lumped model coefficients, so a clinical sanity check
should use stroke volume and pulse pressure:

```text
C_art ~= SV / pulse_pressure
      = 82.54 / (123.69 - 79.95)
      = 1.89 mL/mmHg
```

This is plausible for an adult systemic arterial tree. It should be documented as an output-derived
apparent compliance, not a direct one-to-one reading of node parameters.

### 4. Ventricular EF and filling pressure

```text
LVEF = (LVEDV - LVESV) / LVEDV
     = (122.69 - 37.59) / 122.69
     = 0.694

RVEF = (RVEDV - RVESV) / RVEDV
     = (146.85 - 68.14) / 146.85
     = 0.536
```

Both EF values are in normal or high-normal range. The legacy `RVEDPApprox` remains high because it is
max-volume anchored and can sample early RV upstroke; a pre-systolic window gives 4.46 mmHg and is the
physiologic right-heart gate used by the strengthened baseline test.

### 5. Atrial volumes and emptying fraction

```text
LAEF = (LAVmax - LAVmin) / LAVmax
     = (57.74 - 30.94) / 57.74
     = 0.464

RAEF = (RAVmax - RAVmin) / RAVmax
     = (74.40 - 40.64) / 74.40
     = 0.454
```

LA size and total emptying fraction are plausible. RA volume is no longer dilated at the default
body-size assumption, and RA emptying is now near the lower end of the normal-imaging target band
instead of the previous 27%.

### 6. AV-plane volume effect

The atrial AV-plane term is physically motivated by the approximate volume swept by annular descent:

```text
delta_V ~= annular_area * longitudinal_descent
```

An annular effective area of a few cm2 and a MAPSE/TAPSE-scale descent of about 1-2 cm gives several
to low-teen mL. The current LA `avPlaneGainMl=8` and RA `avPlaneGainMl=12` are therefore plausible
first-order gains. The remaining issue is not the idea of the gain; it is calibration and validation:
the shortening anchors in `chamberCtx()` are currently fixed to broad ED/ES reference values and
should become beat-adaptive or measured from the current cycle.

### 7. PEEP unit mismatch

UI labels PEEP and respiratory pressure amplitudes in `cmH2O`, but the engine pressure state is in
`mmHg`. In `ModelCore.Pth()` and `ModelCore.Palv()`, PEEP is currently used numerically as mmHg:

```text
Pth  = Pth0 + 0.20 * PEEP + respAmpTh * sin(...)
Palv = PEEP + respAmpAlv * sin(...)
```

The conversion is:

```text
1 inH2O = 249.0889 Pa       (NIST)
1 inH2O = 2.54 cmH2O
1 cmH2O = 249.0889 / 2.54 = 98.0665 Pa
1 mmHg  = 133.3224 Pa
1 cmH2O = 98.0665 / 133.3224 = 0.73556 mmHg
```

Therefore a UI PEEP of 10 cmH2O should enter the hemodynamic pressure equations as 7.36 mmHg, not
10 mmHg. Current nonzero PEEP is about 36% too large if interpreted as `cmH2O`. This is a **likely
unit bug** and should be fixed or the UI labels changed.

### 8. Valve `Amax` is not absolute area in the full-open loss law

The current valve loss code computes:

```text
area      = Aleak + xi * (Amax - Aleak)
areaRatio = area / Amax
R_eff     = R / areaRatio^2
B_eff     = B / areaRatio^2
```

When the valve is fully open (`xi=1`):

```text
areaRatio = Amax / Amax = 1
R_eff = R
B_eff = B
```

So `Amax` has no effect on full-open resistance or gradient. It only affects partially open and leak
states through the normalized ratio. This is physically inconsistent with a UI/control labeled in
`cm2`: a smaller absolute orifice should raise full-open loss. Either change the loss law to use an
absolute reference area, or relabel `Amax` as a relative valve-opening shape/scale rather than an
absolute anatomical orifice area.

### 9. Regurgitant fraction gates

The default PV regurgitation check uses:

```text
RF = integral(max(-QPV, 0) dt) / integral(max(QPV, 0) dt)
   = 0.00022
```

That is appropriate as a "competent default valve" numerical gate. It is stricter than clinical
severity thresholds and should not be described as a clinical PR severity classifier. The same applies
to TV closure backflow: the current 1.0% is a numerical default-valve check, not a diagnosis.

## Subsystem verdicts

### Chambers

**LV:** geometry/passive law and current output are plausible. LVEF is high-normal and LVEDP is
slightly high but within a reasonable default-normal tolerance. Keep existing LV PV-loop and EDPVR
checks.

**RV:** the RV/RA refit moved the default from borderline to acceptable: RVEF 53.6%, pre-systolic
RVEDP 4.46 mmHg, and PAP mean 18.0 mmHg. The max-volume `RVEDPApprox` remains a legacy proxy and
should not be used as the physiologic RVEDP gate.

**LA:** output morphology is now much better: LA loop is figure-eight-like and MVF is biphasic. The
remaining caution is parameter identifiability. LA `Tmax0=92000 Pa` is high for an atrium and actual
activation fractions suppress the realized pressure contribution. The model should separate passive
compliance, booster contraction, and AV-plane reservoir gain so the observed LA loop does not depend
on a degenerate combination of high ceiling and low realized activation.

**RA:** the RA loop and TVF shape now pass the same kind of morphology gate as LA, and the refit also
adds physiology gates: RA max 74 mL, RA min 41 mL, and RAEF 45%. This is still lower than the 3D RA
emptying fraction near 53% reported in normal cohorts, but it is no longer the previous under-emptying
failure mode.

### Valves and flows

Current anatomical `Amax` values are broadly plausible as nominal normal or high-normal sizes:

| Valve | Current `Amax` | Literature anchor | Verdict |
|---|---:|---|---|
| MV | 5.0 cm2 | Normal mitral area commonly around 4-6 cm2; echo-Doppler normal AV valve source supports this scale | Plausible |
| AoV | 3.5 cm2 | Normal adult AVA commonly around 3-4 cm2 | Plausible high-normal |
| TV | 8.0 cm2 | BSE tricuspid/pulmonary guideline: normal TV orifice 7-9 cm2 | Plausible |
| PV | 4.0 cm2 | Normal pulmonary valve area is smaller than TV and often around 3 cm2 | Plausible high |

However, because the current loss law normalizes by `Amax`, the full-open gradients are governed by
`R/B/L`, not absolute `Amax`. This makes the anatomical-area labels misleading.

Valve timing constants are reasonable first-order model values. `tauOpen` 10-20 ms and `tauClose`
20-35 ms imply effective motion over roughly two to three time constants, which matches a rapid
mechanical opening/closure timescale. `kOpen` remains a dimensionless numerical gain with no direct
physiological target; document it that way.

`AoV_B` and `PV_B` are not exposed in `CoreRuntimeParams`, so the semilunar valves fall back to edge
defaults while MV/TV have runtime `B` fields. Either expose them symmetrically or document that only
AV-valve `B` is currently tunable.

### Vascular, respiratory, and numerics

**TBV and vascular output:** TBV is plausible for a large adult. Apparent SVR/PVR and arterial
compliance are plausible. Pulmonary mean pressure and LAP are in a reasonable range.

**Pmsf:** `Pmsf=17.68 mmHg` remains high if presented as literal normal physiology. Treat current
`Pmsf` as a model filling-pressure observable until venous
unstressed/stressed partition is recalibrated.

**Respiratory:** `respRate=0.25 Hz` = 15/min is normal. The PEEP unit issue is the priority. A second
code-path issue is that `respRate` is hard-clamped in `HARD_CLAMP`, but it is not copied or smoothed in
`smoothParams()`, so `setTargetParameters({ respRate })` may not affect the running core. Add a test.

**Closed-loop validation:** mass conservation tests are strong. The live health warning/fail thresholds
for left/right CO mismatch (>1 and >2 L/min) are acceptable as UI health signals, but a settled
validation gate should be tighter, for example `<0.5 L/min` or a percent-of-CO criterion.

**Morphology validation:** self-intersection count is useful as a regression smoke test, but it is too
weak as physiology. It can pass when a loop is noisy or over-folded. Add phase-aware atrial gates:
reservoir vs booster loop signed areas, v-wave > a-wave for LA, volume range, atrial emptying fraction,
E/A or E-to-A peak separation, and regurgitant fraction.

## Priority recommendations

1. **P0: fix PEEP units.** Convert cmH2O UI inputs to mmHg in the engine or relabel the UI/knobs as
   mmHg. Include `Pth0`, `respAmpTh`, and `respAmpAlv` in the same unit decision.
2. **P0: clarify or change valve `Amax`.** The current law makes `Amax` non-physical at full opening.
   Either use an absolute-area loss law or relabel the knob.
3. **P0: add `respRate` target-path test/fix.** `setTargetParameters()` should update respiratory
   rate just as it updates PEEP and respiratory amplitudes.
4. **P1: continue RV/RA refinement against phase-aware metrics.** The first refit now gates RVEF,
   pre-systolic RVEDP, RA volume, and RAEF. Remaining work is to reduce the high-normal left filling
   tail and decide whether the target RAEF should move closer to ~53%.
5. **P1: keep strengthening atrial morphology gates.** The baseline now includes phase-window E/A
   peaks, loop area, mid-volume pressure spread, RA volume, RAEF, and pre-systolic RVEDP. Remaining
   targets are reservoir/booster signed sub-areas and v/a timing.
6. **P1: document default body size.** TBV 5600 mL and indexed chamber gates need an explicit BSA/body
   mass assumption.
7. **P2: make AV-plane shortening adaptive.** Derive shortening from the current beat's ED/ES rather
   than fixed reference ED/ES values.
8. **P2: expose or document semilunar `B`.** Add `AoV_B` and `PV_B` to runtime params or state that
   semilunar quadratic loss is fixed.
9. **P2: tighten settled CO-balance validation.** Keep broad UI health thresholds, add stricter
   settled-test thresholds.

## References

1. Meskin M, Starkey PA, Kaspersen AE, et al. "Investigating the importance of left atrial compliance
   on fluid dynamics in a novel mock circulatory loop." *Scientific Reports* 14, 1864 (2024).
   https://www.nature.com/articles/s41598-024-52327-6
2. Lang RM, Badano LP, Mor-Avi V, et al. "Recommendations for Cardiac Chamber Quantification by
   Echocardiography in Adults: An Update from the American Society of Echocardiography and the
   European Association of Cardiovascular Imaging." *JASE* 2015. https://asecho.org/wp-content/uploads/2016/02/2015_ChamberQuantificationREV.pdf
3. Klotz S, Hay I, Dickstein ML, et al. "Single-beat estimation of end-diastolic pressure-volume
   relationship: A novel method with potential for noninvasive application." *Am J Physiol Heart Circ
   Physiol* 2006;291:H403-H412. https://doi.org/10.1152/ajpheart.01240.2005
4. Nair R, Lamaa N. "Pulmonary Capillary Wedge Pressure." StatPearls/NCBI Bookshelf.
   https://www.ncbi.nlm.nih.gov/sites/books/NBK557748/
5. Thudium M, et al. "Physiology, Pulmonary Vascular Resistance." StatPearls/NCBI Bookshelf.
   https://www.ncbi.nlm.nih.gov/books/NBK554380/
6. StatPearls. "Physiology, Blood Volume." NCBI Bookshelf. https://www.ncbi.nlm.nih.gov/books/NBK526077/
7. NIST. "Pressure and Gas Flow Unit Conversions." https://www.nist.gov/pml/owm/metric-si/unit-conversion/pressure-and-gas-flow-unit-conversions
8. Zaidi A, Knight DS, Augustine DX, et al. "Echocardiographic assessment of the tricuspid and
   pulmonary valves: a practical guideline from the British Society of Echocardiography." *Echo
   Research and Practice* 2020. https://pmc.ncbi.nlm.nih.gov/articles/PMC8052586/
9. "Atrioventricular valve orifice areas in normal subjects: determination by cross-sectional and
   Doppler echocardiography." PubMed. https://pubmed.ncbi.nlm.nih.gov/8021055/
10. Zoghbi WA, Adams D, Bonow RO, et al. "Recommendations for Noninvasive Evaluation of Native
    Valvular Regurgitation." ASE/SCMR guideline, 2017. https://www.asecho.org/wp-content/uploads/2025/04/2017VavularRegurgitationGuideline.pdf
11. "Imaging assessment of the right atrium: anatomy and function." *European Heart Journal -
    Cardiovascular Imaging* 2022. https://academic.oup.com/ehjcimaging/article/23/7/867/6515395
