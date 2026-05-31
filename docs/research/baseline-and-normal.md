# Baseline (`active-normal`) and the Normal case

Model files: `engine/caseBaselines.ts` (active-normal = `defaultParams()`, TBV 5600) ·
`constants.ts`/`engine/ModelCore.ts` `defaultParams()` · `engine/chambers.ts`
(active-stress `defaultActiveLV/RV`).

All official cases deviate from this operating point, so its validity is the
foundation of every lesson.

## Parameters in play

| Param | Model value (+ how computed) | Literature target (ref) | Verdict |
|---|---|---|---|
| HR | 75 bpm | resting 60–100, typ ~70 [Klabunde] | OK |
| TBV | 5600 mL | ~70 mL/kg → ~4900 mL @70 kg; 5–5.5 L typical [Guyton&Hall] | slightly high, OK |
| `contractility`/`lvTmaxScale` | 1.0 / 1.0 (multipliers on Tmax0) | — | OK (neutral) |
| LV `Tmax0` | **382 500 Pa = 382.5 kPa** (note: 85 kPa × 4.5 legacy fudge) | peak active myofiber stress **~30–110 kPa** [Bovendeerd 1992] | **OFF — supra-physiological ceiling (M12 debt)** |
| RV `Tmax0` | 162 000 Pa = 162 kPa (36 kPa × 4.5) | RV peak stress lower than LV | OFF — same 4.5× fudge |
| `bPas` (EDPVR stiffness, fibre) | 10 (in stretch λ units), `sigmaPas0` 2000 Pa, `lambdaPas0` 0.85 | exponential EDPVR P=k·e^(βV); β is chamber-level [mL⁻¹], Klotz-normalisable [Klotz 2006/2007] | uncertain — structure OK, magnitude uncalibrated |
| `systemicResistance` | 1.25 (× internal SVR) | SVR 800–1200 dyn·s·cm⁻⁵ [LiDCO/Klabunde] | check vs realised MAP/CO |
| `pulmonaryResistance` | 1.0 | PVR <250 dyn·s·cm⁻⁵ | OK |
| `venousTone` | 0.2 (0–1) | sets stressed/unstressed split → Pmsf | uncertain |

## A. Physiological validity vs literature   [lead]

**Reference normal resting hemodynamics** (adult): cardiac output 4–8 L/min (classic
~5), cardiac index 2.5–4.0 L/min/m²; stroke volume 60–130 mL; RAP 2–6 mmHg; RV/PA
systolic 15–25 mmHg; LAP / PCWP 6–12 mmHg; SVR 800–1200 dyn·s·cm⁻⁵; LVEF ~55–65 %.

**What the model settles to at active-normal** (engine cross-check, converge-settled, codex1):
CO ≈ 3.52 L/min, AoP ≈ 94.1/64.5, **AoPMean (engine time-average) = 70.1 mmHg** (note: the
dia+⅓·PP estimate from 94/64 is ~74 — label which convention you mean), LAP ≈ 3.1, RAP ≈ 2.8,
PAP mean ≈ 9.1, LVEDP ≈ 4.7, EF_L ≈ 0.53, Pmsf ≈ 10.5.

**Honest gaps to record for M12** (priority = SHAPE > values, but these matter for trust):

1. **CO ≈ 3.5 L/min is LOW** vs a normal adult ~5–6 L/min (≈ a cardiac index ~1.9 for a
   1.8 m² adult — clinically that is a low-output state). SV ≈ 47 mL is below the 60–130
   range. So the absolute operating point is hypodynamic; lessons should be read as
   *relative* changes, which is exactly the documented priority.
2. **Mean PAP ≈ 9 mmHg is low** vs ~14–18 mmHg normal mean PAP; the pulmonary side is
   under-pressured.
3. **LAP ≈ 3 mmHg is low-normal** (vs 6–12); filling pressures sit at the bottom of range.
4. **Active-stress `Tmax0` is the single biggest calibration debt.** Peak active myofiber
   stress in single-fibre / CircAdapt-class models is ~30–110 kPa [Bovendeerd 1992; CircAdapt].
   The model's `Tmax0` = 382.5 kPa is ~3.5–4× that ceiling — a direct artefact of the
   `lvTmaxScale = 4.5` fudge folded into `Tmax0` (note in `chambers.ts`). The realised
   *peak σ_act* is below the ceiling (a/gOver/f_iso are ≤1 fractions — see section B), but
   the inflated ceiling is non-physiological and must be re-derived in M12.

**Direction the Normal case should show**: a closed, convex LV PV loop (ESV<EDV, positive
area); a dicrotic notch on AoP; E/A pattern on MV inflow; everything within "looks like a
real tracing" even if absolute numbers are low.

## B. Physical & computational rationale   [codex1]

**Active-stress chamber math** (`engine/chambers.ts:150-199`). Transmural pressure from
single-fibre stress: `λ = rm/rmRef` (dimensionless mid-wall stretch, thick spherical shell);
`σ_pas = sigmaPas0·(exp(bPas·(λ−λpas0))−1)`; `σ_act = Tmax0·tmaxScale·contractility·a·gOver·f_iso`;
`PtmPa = geomScale·geomChi·(2h/rm)·(σ_pas+σ_act)`; `Ptm_mmHg = PtmPa/133.322`, clamped [−5, 260].
Dimensionally coherent if Tmax0/sigmaPas0 are Pa and geomScale/geomChi/(2h/rm)/a/gOver/f_iso are
dimensionless; bPas is per-unit-stretch (λ dimensionless). The exponential σ_pas is a reasonable
EDPVR surrogate but its parameters are calibration values, not a chamber-level Klotz β.

**Tmax0 ceiling — quantified (the key nuance):** on a settled normal run (1000 Hz, 2 s) the **peak LV
σ_act was 46.9 kPa = 12.3 % of the 382.5 kPa Tmax0 ceiling**, at `a = 0.123`, `λ = 0.911`,
`gOver ≈ 1.0`, `f_iso = 1.0`, VLV 80.8 mL, passive stress 1.69 kPa (across beats `a` ∈ 0.00002–0.123,
`λ` ∈ 0.788–0.930, `f_iso` ∈ 0.679–1.0). So the **realised peak stress (46.9 kPa) IS physiological**
(within the ~30–110 kPa range) — the heart is not generating supra-physiological force. The
calibration debt is structural: **activation `a` only reaches ~12 %, so the inflated 4.5× Tmax0
ceiling is what recovers the current (low) operating point.** M12 should re-derive Tmax0 from a
physiological ceiling AND fix the activation scaling together.

**Vascular / units** (`engine/ModelCore.ts:632-655, 938-960`). Flows are mL/s; SV = trapezoidal
integral of positive valve flow per beat; CO = SV·HR/1000 L/min (unit-consistent). Raw
`systemicResistance` is a **dimensionless multiplier** on internal systemic edge resistances (engine
units ≈ mmHg/(mL/s) with a quadratic loss when B>0) — it is NOT clinical SVR; convert a realised
operating point via (MAP−RAP)/CO, not the raw number.

**Venous tone / Pmsf** (`engine/ModelCore.ts:985-987, 1090-1128`). `effectiveVu = Vu −
venousToneGain·venousTone`; at venousTone 0.2 this lowers systemic venous unstressed volume → raises
stressed volume. `Pmsf = stressedVolumeSystemic / complianceSystemic` (mmHg) — a coherent
Guyton-style 0D approximation (heart + pulmonary excluded by design).

**Independent cross-check** (converge-settled, `health: ok`, no clamps): CO_L 3.52, AoP 94.1/64.5,
AoPMean 70.1, PAP mean 9.1, LAP/RAP 3.1/2.8, LVEDP 4.7, EF_L 0.53, Pmsf 10.5 — all consistent with
section A. (MAP convention: time-averaged AoPMean 70.1 vs dia+⅓PP estimate ~74.)

**Numerical notes:** the [−5, 260] mmHg chamber-pressure clamp is protective but can hide
over-high-stress calibrations; clinical inotropy maps to `lvTmaxScale`, not raw `contractility`, so it
does not drive the `betaDrive`/Ca-release branch; the low normal CO/PAP is a *calibration* issue, not
an integrator-health one.

## Open questions / for M12

- Re-derive `Tmax0` from a physiological peak fibre stress (~100 kPa) + an explicit `lvTmaxScale`
  rather than the folded 4.5×; re-fit so normal CO lands ~5 L/min without breaking shape.
- Calibrate `bPas`/`sigmaPas0` to a Klotz-normalised human EDPVR.
- Raise the pulmonary operating pressure (PAP mean toward ~15).

## References

1. Klabunde RE. *Cardiovascular Physiology Concepts*, 3rd ed. (normal hemodynamics, SVR, EDPVR).
2. Guyton AC, Hall JE. *Textbook of Medical Physiology* (blood volume, venous return, Pmsf).
3. Bovendeerd PHM et al. "Dependence of local left ventricular wall mechanics on myocardial fiber orientation: a model study." *J Biomech* 1992. https://pubmed.ncbi.nlm.nih.gov/1400513/ (peak fiber stress ~30–110 kPa).
4. Arts T, Delhaas T, Bovendeerd P, et al. "Adaptation to mechanical load… the CircAdapt model." *Am J Physiol Heart Circ Physiol* 2005. https://journals.physiology.org/doi/abs/10.1152/ajpheart.00444.2004 (single-fibre Tmax, CircAdapt chamber). https://framework.circadapt.org/2407/userguide/components/node/cavity/Chamber.html
5. Klotz S et al. "Single-beat estimation of the EDPVR" and the Klotz curve normalization. *Am J Physiol* 2006/2007 (EDPVR β, normalization).
6. Normal hemodynamic parameter table — LiDCO. https://www.lidco.com/wp-content/uploads/2017/03/5559-NHP-one-pager-flyer-2.pdf
7. Maas JJ et al. "Mean systemic filling pressure… critically ill." *Am J Physiol Heart Circ Physiol* 2015. https://journals.physiology.org/doi/full/10.1152/ajpheart.00413.2015 (Pmsf 12–19 mmHg clinical; classic Guyton ~7).
