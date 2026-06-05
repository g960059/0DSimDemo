# Baseline (`active-normal`) and the Normal case

> **Status note:** refreshed 2026-06-05 after the active baseline review repair
> and RVEF/PVF refit.
> Older 2026-06-03 notes are retained as change history, but the current
> validation target is the 2026-06-05 settled baseline below.

Model files: `engine/caseBaselines.ts` (active-normal = `defaultParams()`, TBV 5600) ·
`constants.ts`/`engine/ModelCore.ts` `defaultParams()` · `engine/chambers.ts`
(active-stress `defaultActiveLV/RV`).

All official cases deviate from this operating point, so its validity is the
foundation of every lesson.

## 2026-06-05 review repair: settled active baseline after tension-lag regression

The prior branch attempted to broaden `ELV_active` by filtering LV/RV active
stress through a tension-development state. Review found that the 45/90-100 ms
first-order lag created deterministic period-2 alternans in end-systolic volume,
most visibly in hypovolemia. The default active-stress path now keeps the
`tensionPa` state allocated for future work, but bypasses it at baseline
(`tauTensionRiseSec = 0`, `tauTensionFallSec = 0`, `tensionInstantMix = 1`).
This is a deliberate stability decision: Ca/activation-to-pressure filtering
should not be re-enabled until post-settle convergence and low-preload cases are
green without loosening the settling gates.

Current fixed-settle baseline summary (`runScenario(DEFAULT_PARAMS)`, active
normal):

| Metric | Current value | Literature/physiology corridor | Verdict |
|---|---:|---:|---|
| HR | 75 bpm | resting 60-100 bpm | OK |
| AoP | 123.5/81.0 mmHg, mean 88.6 | brachial/central arterial pressure roughly 90-140/60-90; mean ~70-150 in Merck table | OK |
| PAP mean | 16.4 mmHg | Merck pulmonary artery mean 9-16; AHA normal resting pulmonary artery pressure 11-20 | Upper-normal OK |
| LAP mean | 7.3 mmHg | Merck LA mean 2-12; PCWP 4-12 as LA/LVEDP surrogate | OK |
| RAP mean | 3.5 mmHg | Merck RA 0-8 | OK |
| LVEDP | 13.1 mmHg | Merck LVEDP 5-12; PCWP 4-12; teaching gate keeps 8-14 to avoid floor artifacts | High-normal / watch |
| SV_L / CO_L | 73.3 mL / 5.50 L/min | CO at rest about 5-6 L/min; cardiac-index references give 4-8 L/min | OK |
| EF_L | 0.59 | normal LVEF commonly 55-65%; ASE biplane normal ranges include 52-72% men and 54-74% women | OK |
| EF_R | 0.52 | ASE 3D RV EF mean 58 +/- 6.5%, abnormal threshold <45% | Low-normal OK |

Derived vascular checks at this operating point:

- Realised systemic vascular resistance is about
  `(AoPMean - RAPMean) / CO_L * 80 = 1240 dyn*s/cm^5`, high-normal but compatible
  with the normal resting pressure/flow target.
- Realised pulmonary vascular resistance is about
  `(PAPMean - LAPMean) / CO_R * 80 = 132 dyn*s/cm^5` (about 1.65 WU), upper-normal
  and still below the usual pulmonary-hypertension concern range. The terminal
  PVein->LA resistance is therefore a morphology calibration term, not the whole
  pulmonary resistance budget.
- The raw UI/runtime knobs `systemicResistance = 1.0` and
  `pulmonaryResistance = 0.65` are therefore **dimensionless model multipliers**,
  not clinical SVR/PVR values. Clinical resistance should be inferred from the
  realised pressure-flow operating point.

Waveform-shape checks after the repair:

- LV PV loop remains closed and physiologic at the normal operating point; the
  diastolic limb is supported by the active-stress passive EDPVR, not by a
  pressure floor.
- QMV remains biphasic with E and A components. The normal MV loss constants
  were lowered (`MV_R = 0.002`, `MV_B = 5e-6`) so a competent baseline valve does
  not create an MS-like LA-LV pressure gap; stenosis knobs still add lesion
  severity through area loss and the v0.3 resistance multiplier. Legacy
  `knobmap-0.2` mitral-stenosis cases keep the shipped absolute MV loss baseline
  (`MV_R = 0.004`, `MV_B = 2e-5`) so old authored MS cases do not silently weaken
  when the normal default is refit.
- PVF is guarded as S/D/Ar: current S/D forward-volume ratio is about 0.79,
  systolic filling fraction is about 0.44, and reverse/forward volume is about
  0.048. This restores the systolic contribution above the 40% raised-LAP
  screening threshold while keeping atrial reversal visible but minor. Systolic
  PVF shoulders or two systolic peaks are not rejected because pulmonary venous
  systolic flow can split into S1/S2; the gate checks phase, systolic fraction,
  D/S balance, and bounded Ar rather than enforcing one cosmetic systolic peak.
- RCA pressure-overload test now verifies the intended shape response: with
  fixed PVR loading, PAPMean rises by >4 mmHg, RCA diastolic fraction increases,
  and RCA flow falls. This keeps the coronary gate focused on the mechanical
  heart-coronary interaction rather than a single absolute PAP delta.

EDPVR/parameter interpretation after the fit:

- There is no portable "normal alpha/beta" for this code without naming the
  pressure law. The legacy TVE fallback uses `Ped = beta*(exp(alpha*(V-V0))-1)`,
  while active-stress uses fibre stretch
  `sigmaPas0*(exp(bPas*smoothHinge(lambda-lambdaPas0))-1)` mapped through shell
  geometry. `alpha/beta` and `sigmaPas0/bPas/lambdaPas0` are therefore not
  numerically comparable.
- Klotz/Burkhoff normalisation supports validating the **resulting pressure-volume
  curve**, not the literal parameter names. Klotz reports a normalised EDPVR of
  the form `EDP = An * EDV^Bn` with `An` about 28 mmHg and `Bn` about 2.8 after
  scaling. The current active LV passive curve remains close to the Klotz-style
  120 mL / 10 mmHg anchor documented below. The legacy TVE passive `alpha/beta`
  remains too compliant and should be treated as a teaching/reference waveform,
  not a validated passive EDPVR.
- `ELV_active` and `ERV_active` are **apparent elastance** signals
  `max(Ptm,0)/(Veff-V0)`. They are useful for comparing active-stress and TVE
  timing, but are not Ees regressions and should not be fitted as if they were
  load-independent ESPVR slopes.

## 2026-06-03 refresh: LV/AoV default and EDPVR floor

This branch updates the default active-normal operating point to remove the
AS-like LVP/AoP peak separation seen in the workbench and to keep the LV
diastolic limb on a positive passive EDPVR instead of a pressure-floor artifact.

- LV force scale: `lvTmaxScale` **0.85 -> 0.70**. This keeps the realised LV peak
  stress within a physiological active-stress envelope while preventing the
  normal LV from outrunning the single-node aortic root / dynamic-flow envelope.
- Dynamic flow safety clamp: **1200 -> 1500 mL/s**. A larger test cap produced LV
  volume-floor hits; 1500 reduces visual peak separation without degeneracy.
- Semilunar valve parameters are now first-class runtime values:
  `AoV_B`, `PV_B`, and each valve's `Aref`.
- Valve loss semantics changed from `A/Amax` to **`A/Aref`**, so a stenotic
  `Amax` remains meaningful even when the valve is fully open.
- LV passive stress now uses a smooth positive hinge
  `smoothHinge(lambda - lambdaPas0)` before the exponential, matching the intended
  non-negative passive stress law and avoiding negative passive pressure followed
  by floor clamp.

Fixed-settle baseline summary after this change: AoP **119.5/75.0** mmHg, mean
AoP **82.3** mmHg, LAP **10.3**, RAP **3.3**, LVEDP **11.6**, CO_L **6.05 L/min**,
EF_L **0.69**. LV passive points are: 60 mL **0.02**, 100 mL **3.43**, 120 mL
**10.01**, 140 mL **23.51** mmHg. The normal workbench waveform gate now requires
`|max(LVP)-max(AoP)| < 8 mmHg` and zero LV floor hits over the final beat.

Follow-up in the same 2026-06-03 refit tightened competent-valve closure for the
default baseline: all four `Aleak` defaults are **0 cm²**, and `tauClose` is now
MV **12 ms**, AoV **5 ms**, TV **10 ms**, PV **6 ms**. This targets a competent
baseline rather than trace AR/MR/TR/PR. The resulting fixed-settle summary is
AoP **119.9/76.5** mmHg, mean AoP **83.9**, LAP **8.8**, RAP **3.2**, LVEDP
**9.8**, CO_L **5.81 L/min**, EF_L **0.66**. Final-beat regurgitant fractions
are gated in tests at MV <0.5 %, AoV <0.1 %, TV <0.5 %, PV <0.1 %. These closure
time constants are lumped first-order coaptation constants; they are not intended
as direct leaflet-motion MRI durations.

Important limitation: the total instantaneous `LVP-AoP` during the very short
0D ejection interval still contains dynamic-flow residual and is tracked in the
snapshot (`AoV_grad_mean` / `AoV_grad_peak`). The true valve-loss terms (`R q` and
`B q|q|`) remain only a few mmHg in normal default; AS-like display is prevented
without pretending the single-node root/inertance residual is a validated Doppler
mean gradient.

The workbench now exposes PV-derived elastance waveforms: `ELV_active` /
`ERV_active` are the active-stress apparent elastance `Ptm/(Veff - V0)`, while
`ELV_timeVarying` / `ERV_timeVarying` are the legacy time-varying elastance
fallback evaluated at the same effective volume and phase. These are comparison
signals, not new state variables. The active-stress signals are not ESPVR/Ees
regression estimates: they are instantaneous apparent elastance traces. LV/RV
active-stress pressure generation has a reserved `tensionPa` state, but the
2026-06-05 default bypasses the filter because the attempted lead-lag mix caused
post-settle alternans in low-preload cases. The active-stress model remains the
default chamber formulation, but apparent-elastance smoothing is deferred until
it can pass the convergence gates.

The LV/RV active-stress target also includes a bounded Hill-like force-velocity
factor derived from the chamber's normalised shortening velocity
`-dV/dt / stroke-volume-reference`. During ejection, fibre shortening slightly
reduces force generation; lengthening has only a small capped stabilising effect.
This is a crossbridge/shortening-velocity connection at the chamber boundary, not
a new independent state. The default coefficients are intentionally conservative
so the baseline AoP/LVP gap, CO, EF, LVEDP, and regurgitant-fraction gates remain
inside the normal corridor.

Pulmonary venous flow (`PVF`, PVein -> LA) is now guarded as an S/D/Ar waveform.
The terminal pulmonary venous resistance/inertance is `PVein_LA.R = 0.028
mmHg/(mL/s)` and `pvOstialInertanceL = 0.002`. The resistance bounds atrial
reversal; the small inertance restores a visible systolic contribution without
turning the tracing into a high-reversal pattern. The test intentionally does
not require a single-peaked S wave: clinical pulmonary venous Doppler often
splits systolic flow into S1/S2, so the guard checks phase windows, systolic
fraction, S/D balance, and reverse-flow fraction rather than forbidding a
systolic shoulder.

Literature anchors for this interpretation are the time-varying elastance
overview (PMC5018161), Ca/crossbridge-dependent elastance discussion in the RV
elastance literature (AJRCCM 207:678), and the diastolic suction caveat
(PMC2928592).

### 2026-06-05 EDPVR review

The code contains two different passive-pressure conventions, so `alpha/beta`
must not be compared across them as if they were the same quantity.

- Legacy time-varying elastance fallback:
  `Ped = beta * (exp(alpha * (V - V0)) - 1)`. Defaults are LV
  `alpha=0.015 mL^-1`, `beta=0.8 mmHg`; RV `alpha=0.012`, `beta=0.5`.
  These are too compliant to be treated as validated normal EDPVR references:
  the LV fallback gives about 2.3, 3.4, 4.8, and 5.7 mmHg at 100, 120, 140,
  and 150 mL, respectively.
- Active-stress passive law:
  `sigmaPas = sigmaPas0 * (exp(bPas * smoothHinge(lambda - lambdaPas0)) - 1)`,
  then stress is converted to transmural chamber pressure by the shell geometry.
  Here `bPas` is per stretch, not a chamber-level `mL^-1` beta.

Klotz/Burkhoff single-beat EDPVR normalisation uses a power-law form
`P = alpha * V^beta` after deriving `V0`, `V30`, and the empirical normalised
constants (`An` about 27.8 mmHg, `Bn` about 2.76). Using a representative normal
LV anchor of 120 mL at 10 mmHg, the current active-stress LV passive curve is
close to that Klotz-style target:

| Volume | Active-stress LV passive | Klotz-style LV target (120 mL / 10 mmHg anchor) | Legacy LV fallback |
|---:|---:|---:|---:|
| 100 mL | 3.43 mmHg | 2.89 mmHg | 2.29 mmHg |
| 120 mL | 10.01 mmHg | 10.00 mmHg | 3.37 mmHg |
| 140 mL | 23.51 mmHg | 23.48 mmHg | 4.82 mmHg |
| 150 mL | 34.60 mmHg | 33.13 mmHg | 5.73 mmHg |

RV active-stress passive points are 100 mL 1.18, 120 mL 2.50, 135 mL 3.67,
150 mL 5.04, and 190 mL 9.90 mmHg. This fits a normal low-pressure RV operating
range (RVEDP commonly around 0-8 mmHg), but the high-volume limb remains a
calibration risk for TR/RV-failure scenarios and is now protected by a baseline
passive-pressure gate.

## Parameters in play

| Param | Model value (+ how computed) | Literature target (ref) | Verdict |
|---|---|---|---|
| HR | 75 bpm | resting 60–100, typ ~70 [Klabunde] | OK |
| TBV | 5600 mL | ~70 mL/kg → ~4900 mL @70 kg; 5–5.5 L typical [Guyton&Hall] | slightly high, OK |
| `contractility`/`lvTmaxScale` | 1.0 / 0.70 (multipliers on Tmax0) | realised LV pressure and CO in normal range | OK (calibrated default scale) |
| LV `Tmax0` | 135 000 Pa = 135 kPa | peak active myofiber stress roughly 30–110 kPa, with model ceiling intentionally near the upper physiologic range [Bovendeerd 1992] | OK/calibrated ceiling |
| RV `Tmax0` | 74 088 Pa = 74.1 kPa | RV peak stress lower than LV; realised RVEF >0.50 | OK/calibrated ceiling |
| LV passive EDPVR | `sigmaPas0` 200.133 Pa, `bPas` 23.2, `lambdaPas0` 0.9025 | Klotz-normalisable LV EDPVR: V120/P10 gives P100 ~2.9, P140 ~23.5 | OK |
| RV passive EDPVR | `sigmaPas0` 492 Pa, `bPas` 10, `lambdaPas0` 0.85 | RVEDP normal roughly 0–8 mmHg; RV is low-pressure and more compliant than LV | OK near normal, high-volume limb guarded |
| `systemicResistance` | 1.0 (dimensionless multiplier; base systemic edges are slightly lower than the earlier graph) | realised SVR ≈1240 dyn·s·cm⁻⁵ from MAP/RAP/CO | high-normal OK |
| `pulmonaryResistance` | 0.65 (dimensionless multiplier) | realised PVR ≈132 dyn·s·cm⁻⁵; mPAP normal <20 mmHg | upper-normal OK |
| `PVein_LA` terminal edge | `R=0.028`, `L=0.002` | PVF S fraction >0.40, reverse fraction <0.055, visible S/D/Ar | calibrated morphology gate |
| MV normal loss | `MV_R=0.002`, `MV_B=5e-6` | competent normal MV should keep mean/peak transmitral gradients low | OK; lesion knobs add stenosis |
| `venousTone` | 0.15 (0–1) | sets stressed/unstressed split → Pmsf | calibrated; interpret via realised RAP/venous return |

## A. Physiological validity vs literature   [lead]

**Reference normal resting hemodynamics** (adult): cardiac output 4–8 L/min (classic
~5), cardiac index 2.5–4.0 L/min/m²; stroke volume 60–130 mL; RAP 2–6 mmHg; RV/PA
systolic 15–25 mmHg; LAP / PCWP 6–12 mmHg; SVR 800–1200 dyn·s·cm⁻⁵; LVEF ~55–65 %.

**What the model settles to at active-normal** (fixed-settle baseline after the
2026-06-05 review repair and RVEF/PVF refit): CO ≈ 5.50 L/min,
AoP ≈ 123.5/81.0, AoPMean ≈ 88.6 mmHg, LAP ≈ 7.3, RAP ≈ 3.5,
PAP mean ≈ 16.4, LVEDP ≈ 13.1, EF_L ≈ 0.59, EF_R ≈ 0.52.

**Honest gaps to record for M12** (priority = SHAPE > values, but these matter for trust):

1. The baseline is now in the intended normal hemodynamic corridor. EF_R is
   low-normal but above the stricter 0.50 default gate, so RV
   failure/pressure-overload scenarios should continue to be guarded by shape
   and convergence tests.
2. The apparent elastance traces remain comparison observables, not Ees
   regressions; the active trace can look sharper than a measured elastance curve
   because it is computed as instantaneous pressure over distending volume.
3. The legacy time-varying elastance fallback remains too compliant on its
   passive limb and should not be used as a validated EDPVR reference without
   refitting.
4. The RV passive high-volume limb is intentionally gentle; TR/RV-failure
   scenarios need explicit high-volume no-floor/no-collapse guards.

**Direction the Normal case should show**: a closed, convex LV PV loop (ESV<EDV, positive
area); a dicrotic notch on AoP; E/A pattern on MV inflow; everything within "looks like a
real tracing" even if absolute numbers are low.

## B. Physical & computational rationale   [codex1]

**Active-stress chamber math** (`engine/chambers.ts:150-199`). Transmural pressure from
single-fibre stress: `λ = rm/rmRef` (dimensionless mid-wall stretch, thick spherical shell);
`σ_pas = sigmaPas0·(exp(bPas·smoothHinge(λ−λpas0))−1)`; `σ_act = Tmax0·tmaxScale·contractility·a·gOver·f_iso`;
`PtmPa = geomScale·geomChi·(2h/rm)·(σ_pas+σ_act)`; `Ptm_mmHg = PtmPa/133.322`, clamped [−5, 260].
Dimensionally coherent if Tmax0/sigmaPas0 are Pa and geomScale/geomChi/(2h/rm)/a/gOver/f_iso are
dimensionless; bPas is per-unit-stretch (λ dimensionless). The exponential σ_pas is a reasonable
EDPVR surrogate but its parameters are calibration values, not a chamber-level Klotz β.

**Tmax0 ceiling - quantified direction:** the old 382.5 kPa LV ceiling has been
replaced by a 135 kPa LV ceiling and a 74.1 kPa RV ceiling. Those values should be
read as maximum active-stress capacity before activation, length-tension,
tension-development, and force-velocity factors. Realised beat pressure is still
guarded by the LVP/AoP, CO, EF, and pressure-floor gates rather than by assuming
`Tmax0` itself is a directly observed peak fibre stress.

**Vascular / units** (`engine/ModelCore.ts:632-655, 938-960`). Flows are mL/s; SV = trapezoidal
integral of positive valve flow per beat; CO = SV·HR/1000 L/min (unit-consistent). Raw
`systemicResistance` is a **dimensionless multiplier** on internal systemic edge resistances (engine
units ≈ mmHg/(mL/s) with a quadratic loss when B>0) — it is NOT clinical SVR; convert a realised
operating point via (MAP−RAP)/CO, not the raw number.

**Venous tone / Pmsf** (`engine/ModelCore.ts:985-987, 1090-1128`). `effectiveVu = Vu −
venousToneGain·venousTone`; at venousTone 0.15 this lowers systemic venous unstressed volume → raises
stressed volume. `Pmsf = stressedVolumeSystemic / complianceSystemic` (mmHg) — a coherent
Guyton-style 0D approximation (heart + pulmonary excluded by design).

**Independent cross-check** (fixed-settle baseline snapshot): CO_L 5.50,
AoP 123.5/81.0, AoPMean 88.6, PAP mean 16.4, LAP/RAP 7.3/3.5,
LVEDP 13.1, EF_L 0.59, EF_R 0.52. Passive LV points are now Klotz-like
around a 120 mL / 10 mmHg anchor; passive RV points stay in a normal low-pressure
corridor.

**Numerical notes:** the [−5, 260] mmHg chamber-pressure clamp is protective but
can hide over-high-stress calibrations. The normal baseline therefore additionally
guards LV/RV passive pressure points, pressure-floor hits, LVP/AoP peak gap,
CO/EF, transmitral gradients, valvular regurgitation, and PVF morphology.

## Open questions / for M12

- Refit the legacy time-varying elastance fallback passive `alpha/beta` before
  presenting it as a physiologic EDPVR comparator.
- Add TR/RV-failure high-volume EDPVR gates so the deliberately gentle RV passive
  limb does not hide dilation pathologies.
- Keep atrial passive parameters tied to reservoir/conduit/booster behavior rather
  than claiming validated normal atrial `alpha/beta` targets.

## References

1. Klabunde RE. *Cardiovascular Physiology Concepts*, 3rd ed. (normal hemodynamics, SVR, EDPVR).
2. Guyton AC, Hall JE. *Textbook of Medical Physiology* (blood volume, venous return, Pmsf).
3. Bovendeerd PHM et al. "Dependence of local left ventricular wall mechanics on myocardial fiber orientation: a model study." *J Biomech* 1992. https://pubmed.ncbi.nlm.nih.gov/1400513/ (peak fiber stress ~30–110 kPa).
4. Arts T, Delhaas T, Bovendeerd P, et al. "Adaptation to mechanical load… the CircAdapt model." *Am J Physiol Heart Circ Physiol* 2005. https://journals.physiology.org/doi/abs/10.1152/ajpheart.00444.2004 (single-fibre Tmax, CircAdapt chamber). https://framework.circadapt.org/2407/userguide/components/node/cavity/Chamber.html
5. Klotz S et al. "Single-beat estimation of the EDPVR" and the Klotz curve normalization. *Am J Physiol* 2006 and *Nature Protocols* 2007. https://pure.johnshopkins.edu/en/publications/single-beat-estimation-of-end-diastolic-pressure-volume-relations-5/ ; https://www.nature.com/articles/nprot.2007.270
6. Normal hemodynamic parameter table — LiDCO. https://www.lidco.com/wp-content/uploads/2017/03/5559-NHP-one-pager-flyer-2.pdf
7. Maas JJ et al. "Mean systemic filling pressure… critically ill." *Am J Physiol Heart Circ Physiol* 2015. https://journals.physiology.org/doi/full/10.1152/ajpheart.00413.2015 (Pmsf 12–19 mmHg clinical; classic Guyton ~7).
8. Merck Manual Professional Edition. "Normal Pressures in the Heart and Great Vessels." https://www.merckmanuals.com/professional/multimedia/table/normal-pressures-in-the-heart-and-great-vessels
9. Bozkurt S. "A mathematical model of cardiac function to evaluate clinical cases in adults and children." *PLOS One* 2019. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0224663
10. StatPearls, "Physiology, Cardiac Output." https://www.ncbi.nlm.nih.gov/books/NBK470455/
11. StatPearls, "Physiology, Cardiac Index." https://www.ncbi.nlm.nih.gov/books/NBK539905/
12. StatPearls, "Pulmonary Capillary Wedge Pressure." https://www.ncbi.nlm.nih.gov/books/NBK557748/
13. Lang RM et al. "Recommendations for Cardiac Chamber Quantification by Echocardiography in Adults." ASE/EACVI 2015. https://asecho.org/wp-content/uploads/2016/02/2015_ChamberQuantificationREV.pdf
14. American Heart Association. "Pulmonary Hypertension." https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/pulmonary-hypertension-high-blood-pressure-in-the-heart-to-lung-system
15. Luo C et al. "Modeling left ventricular diastolic dysfunction: classification and key indicators." *Theoretical Biology and Medical Modelling* 2011. https://link.springer.com/article/10.1186/1742-4682-8-14
16. Wang VY et al. "Evaluation of a Novel Finite Element Model of Active Contraction in the Heart." *Frontiers in Physiology* 2018. https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2018.00425/full
