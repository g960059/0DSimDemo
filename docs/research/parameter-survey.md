# Full parameter survey — literature validity of the model's parameter set

Author: **claude1** (claude-code) · Scope: the **full** parameter set behind `active-normal`
and the official lesson cases, going DEEPER/BROADER than the 4 headline section-A case docs.
Feeds **M12** calibration. Companion physical/computational cross-check is codex1's domain
(`*.codex.md`).

Model files: `engine/chambers.ts` (active-stress `defaultActiveLV/RV`) · `engine/ModelCore.ts`
`defaultParams()` / `buildNodes()` / `buildEdges()` / `Pth()` / `Palv()` · `engine/knobs.ts`.

## Ground rules followed
- **Real references only** — every target range below carries a real, named source (URL where
  available). Where I could not find a defensible source I say **"no source found"**.
- Each row separates **(a) literature target / (b) model value / (c) verdict**.
- **Units flagged explicitly.** Engine pressures are **mmHg**; chamber stress is **Pa**
  (`MMHG_TO_PA = 133.322`); valve areas are **cm²**; edge R is **mmHg·s/mL**, L is **mmHg·s²/mL**;
  flows are **mL/s** internally (reported CO in L/min). 1 mmHg·s/mL = **1333.22 dyn·s·cm⁻⁵**.
  1 cmH₂O = **0.7356 mmHg**.

---

## A. Active-stress chamber mechanics (`engine/chambers.ts`)

σ = σ_pas + σ_act; σ_pas = `sigmaPas0`·(exp(`bPas`·(λ−`lambdaPas0`))−1); σ_act =
`Tmax0`·tmaxScale·contractility·a·gOver·f_iso; Ptm[Pa] = geomScale·`geomChi`·(2h/rm)·σ.

| Param (LV / RV) | Model value | Literature target (ref) | Verdict |
|---|---|---|---|
| `Tmax0` | **382 500 / 162 000 Pa** (= 85k/36k × 4.5 legacy fudge) | max active **fibre** stress ~**100–120 kPa** (CircAdapt Sf,act ≈ 120 kPa [Arts 2005]; isolated trabeculae ~40–120 kPa). In-vivo *realised* myofiber stress ED **2.21 ± 0.58 kPa**, ES **16.54 ± 4.73 kPa** [Genet 2014] | **OFF — ceiling ~3–4× supra-physiological** |
| `sigmaPas0` | 2000 Pa | passive stress scale; chamber EDPVR normalises to EDP = 28.2·V_n^2.79 [Klotz 2006] | uncertain — structure OK, scale uncalibrated |
| `bPas` | 10 (in λ stretch) | exponential EDPVR stiffness; chamber Bn ≈ 2.8 [Klotz] (fibre β not directly comparable) | uncertain |
| `lambdaPas0` | 0.85 | resting/slack fibre stretch (λ<1 = below ref) | plausible |
| `lambdaFail` (with `kOver` 35) | 1.45 | descending-limb / over-stretch where active T→0: sarcomere optimum **2.2 µm**, force→0 by ~**2.8 µm** (≈ 1.27× optimum) [Sequeira 2021; ter Keurs] | plausible as a **non-restrictive guard** (heart operates λ≈1, never reaches 1.45) |
| `f_iso` width `(λ−lambdaPas0+0.3)/0.35` | ramp over Δλ≈0.35 | ascending limb (Frank–Starling): cardiac operates 1.8–2.2 µm ascending limb [CV Physiology] | plausible (shape, not calibrated) |
| `V0` dead vol | 10 / 15 mL | unstressed/dead chamber volume | plausible |
| `Vw` wall vol | 150 / 55 mL | wall vol = mass/1.05; normal LV mass ~90–140 g → **~85–135 mL**; RV mass ~1/3 LV | LV **plausible**; RV 55 vs LV 150 (≈0.37) matches RV<LV — **OK** |
| `Vref` | 120 / 135 mL | reference cavity volume (sets rmRef) | plausible |
| `geomChi` | 0.36 / 0.28 | thick-wall Laplace correction (dimensionless O(0.3)); thin-wall P=2σh/r | plausible as lumped factor; **flagged** — the supra-physiological `Tmax0` partly compensates a low χ (codex1 to verify σ→P chain) |
| `tauCa0` | 0.18 s | Ca transient decay τ ~150–250 ms; twitch time-to-peak ~150–200 ms [Coppini/CalTrack] | plausible |
| `Trel0` (Min/Max 0.045/0.12) | 0.08 s | activation/release timescale within twitch | plausible |
| `Arel0` | 0.18 | Ca-release amplitude (model-internal scale) | no literature target — model unit |
| `Kd0` | 0.18 | Ca sensitivity (half-activation) — model-internal Ca units | no direct target |
| `hillN` | 3.0 | myofilament force–pCa Hill coeff ~**3–7** intact (isolated TnC binding only ~1–2) [PMC3018540] | plausible (low end of intact cooperativity) |
| `kOn` / `kOff` | 25 / 15 | crossbridge/activation rate constants (model-internal) | no direct target |

**Headline finding (A1, adversarially checked).** Peak active **fibre** stress in single-fibre /
CircAdapt-class models and isolated human/mammalian trabeculae is ~**40–120 kPa** (CircAdapt uses
Sf,act ≈ 120 kPa [Arts 2005]; Bovendeerd 1992 ~30–110 kPa). In-vivo volumetric-averaged myofiber
stress in **normal humans** is only **2.21 kPa at ED and 16.54 kPa at ES** [Genet 2014] — because
in vivo the muscle never operates at maximal isometric capacity. The model's `Tmax0` = **382.5 kPa**
(LV) is the maximal-capacity scalar and is **~3–4× above the ~100–120 kPa ceiling**. The *realised*
peak σ_act is far lower (a·gOver·f_iso are all ≤1 fractions — codex1's quantification), so waveforms
look right, but the inflated ceiling is the single biggest active-mechanics calibration debt. It is a
direct artefact of folding the old `lvTmaxScale = 4.5` into `Tmax0` (see `chambers.ts` note). **Must
be re-derived in M12** from a physiological ~100–120 kPa peak plus an explicit scale.

---

## B. Arterial tree nodes (`buildNodes()`)

Nonlinear arterial law: Ptm = `P0`·(exp((V−Vu)/VsEff)−1), VsEff = `Vs`/arterialStiffness.

| Node | Model (P0 mmHg / Vs mL / Vu mL) | Literature target (ref) | Verdict |
|---|---|---|---|
| Ao (aorta) | 50 / 150 / 0 | aorta carries ~80% of systemic arterial compliance; total systemic C ~**1.1–1.6 mL/mmHg** [Liu 1990] | plausible (operating AoP 94/64 realised) |
| SA (systemic art.) | 50 / 400 / 0 | conduit arteries | plausible |
| Art (arterioles) | 45 / 120 / 0 | small-artery/arteriolar compartment | plausible |
| PA (pulm. artery) | 20 / 60 / 0 | pulm arterial C ~**4 mL/mmHg** (range 2.9 normal) [Sanz 2009/PMC5461956] | plausible but PAP runs low (see F) |
| PArt (pulm. art.) | 20 / 90 / 0 | — | plausible |
| Cap (capillary) | linear C = **15 mL/mmHg** | high-compliance lumped exchange vessel | uncertain — model lump, no clean target |

Units OK (P0 in mmHg, Vs/Vu in mL). Arterial `Vu = 0` everywhere is a **modelling choice** — all
arterial volume is treated as "stressed" through the exponential P0 law rather than split into an
unstressed pool (contrast the venous nodes, which carry explicit Vu). Note for M12 / codex1.

---

## C. Venous / low-pressure nodes (recruitment compliance)

C_eff(Ptm) = `Ccoll` + (`Copen`−Ccoll)·σ((Ptm−`Popen`)/`dOpen`) − (Copen−`Cdist`)·σ((Ptm−`Pstiff`)/`dStiff`);
collapses below Popen, stiffens above Pstiff. Tone shifts Vu via `venousToneGain`·venousTone.

| Node | Model Vu (mL) / key compliances | Literature target (ref) | Verdict |
|---|---|---|---|
| SV (systemic veins) | **2500** / Ccoll 15, Copen 130, Cdist 35; Popen −2, Pstiff 16 | veins = capacitance reservoir; venous C ≫ arterial (~24×) [Gelman 2008] | plausible — large reservoir compliance |
| VC (vena cava) | **250** / Ccoll 5, Copen 45, Cdist 12 | collapsible great veins | plausible (collapse modelled via Popen) |
| PCap (pulm cap) | 60 | pulmonary blood vol ~**10%** TBV [Guyton] | plausible |
| PVen / PVein | 90 / 120 | pulmonary venous reservoir | plausible |
| **Total venous Vu** | SV+VC = **2750 mL ≈ 49% of 5600** | unstressed vol ~**60–70%** of TBV, ~2/3 of which is venous [Rothe 1983; JACC 2022] | plausible — Vu floor sits in the venous reservoir as expected |

(a) **Literature**: ~64% of TBV is in systemic veins, unstressed volume ~60–70% of TBV [Guyton &
Hall; Rothe Physiol Rev 1983]. (b) **Model**: explicit venous Vu totals 3020 mL across SV/VC/PCap/
PVen/PVein, of which systemic SV+VC = 2750 mL. (c) **Verdict**: the venous compartment correctly holds
the dominant unstressed reservoir; total venous *volume* (Vu + stressed) needs the settled-state
measurement (codex1) to confirm the 60–70% fraction. Units OK.

---

## D. Edge resistances & inertances (`buildEdges()`)

R in mmHg·s/mL; global `systemicResistance`×1.25 multiplies **only** `group:"systemic"` edges
(Ao_SA, SA_Art, Art_Cap); `pulmonaryResistance`×1.0 multiplies only `group:"pulmonary"`
(PA_PArt, PArt_PCap). Verified in `effectiveLosses()`.

**Systemic R sum** = (0.05+0.08+0.65)×1.25 + (0.15+0.05+0.04) = **1.215 mmHg·s/mL ≈ 1620 dyn·s·cm⁻⁵**.
- (a) Normal SVR ~**900–1500 dyn·s·cm⁻⁵** (~0.7–1.1 mmHg·s/mL) [Klabunde; LiDCO]. (b) Model 1620.
  (c) **Slightly high** — but internally consistent: with the documented low CO (~3.5 L/min) and
  MAP ~74/RAP ~3, SVR = (74−3)/58.3 = 1.22 mmHg·s/mL, i.e. the elevated SVR is exactly what props
  MAP up at low output. Tracks the low-CO baseline gap; re-falls into range once CO is recalibrated.
- **Arteriolar dominance correct**: `Art_Cap` R = 0.65 is 53% of the systemic chain — arterioles as
  the principal resistance site, physiologically right [Klabunde].

**Pulmonary R sum** = (0.01+0.04)×1.0 + (0.03+0.01+0.02) = **0.11 mmHg·s/mL ≈ 147 dyn·s·cm⁻⁵**.
- (a) Normal PVR **< 250 dyn·s·cm⁻⁵** (~0.08–0.12 mmHg·s/mL) [Klabunde]. (b) Model 0.11. (c) **OK**
  — and consistent with realised (mPAP 9 − LAP 3)/CO ≈ 0.10.

**Inertances L** (mmHg·s²/mL): AoV 0.002, Ao_SA 0.002, PV 0.001, PA_PArt 0.004.
- (a) Total arterial inertance ~**0.005 mmHg·s²/mL** (4-element windkessel, dog: 0.0051–0.0054)
  [Stergiopulos & Westerhof 1999]. (b) Model 0.001–0.004. (c) **plausible** — same order of magnitude.

---

## E. Valves (opening-fraction area dynamics)

Forward/regurgitant flow via effective area ratio; R = vR/areaRatio². Areas in **cm²**.

| Valve | Model `Amax` (cm²) | Literature anatomic/effective area (ref) | Verdict |
|---|---|---|---|
| MV | 5.0 | ~**4–6 cm²** (planimetry 3.4–3.6) [Iung; PubMed 8021055] | OK |
| AoV | 3.5 | normal AVA ~**2.0–3.5 (–4) cm²** [Otto; Medscape] | OK (upper edge) |
| TV | 8.0 | ~**4–9 cm²** (up to 9 anatomic) [PubMed 8021055] | OK (large end) |
| PV | 4.0 | normal PV area **3.01 ± 0.36 cm²** (Doppler) [PubMed 1428292] | **slightly high (~+3 SD)** — consider ~3.0 |
| `Aleak` (all) | 1e-4 cm² | near-zero competent-valve leak | OK |

| Opening dynamics | Model | Literature (ref) | Verdict |
|---|---|---|---|
| `kOpen` | 2.0 | opening-fraction sigmoid steepness (model) | no direct target |
| `tauOpen` | 10–12 ms | AoV opens in **~27 ms** (MRI Tro) [PMC8440328] | plausible (τ of 1st-order ⇒ ~2–3τ full open ≈ 30 ms) |
| `tauClose` | 20–30 ms | AoV closes in **~44 ms** (MRI Trc) | plausible |
| valve `R` / `L` | 0.002–0.005 / 0.0002–0.002 | open-valve resistance/inertance (lumped) | plausible (small, as expected) |

**MR/AR/TR leak recalibration sanity-check (commit `23dd74e`).** New coefficients map severity-1 to:
MR 0.1·MV_Amax = **0.50 cm²**, AR 0.083·AoV_Amax = **0.29 cm²**, TR 0.06·TV_Amax = **0.48 cm²**.
ASE severe thresholds (EROA): MR **≥0.40**, AR **≥0.30**, TR **≥0.40 cm²** [Zoghbi 2017]. → MR 0.50 ✓
(severe), TR 0.48 ✓ (severe), AR 0.29 ✓ (right at the severe knee). **Recalibration is well-aligned**;
the only nuance is AR sits exactly on the 0.30 threshold, so severity-1 AR is "borderline severe"
rather than comfortably severe — acceptable, but note it for M12 if a margin is wanted.

---

## F. Global scalings

| Param | Model | Literature (ref) | Verdict |
|---|---|---|---|
| `systemicResistance` | 1.25 | yields SVR ~1620 dyn·s·cm⁻⁵ (see D) | slightly high (low-CO coupled) |
| `pulmonaryResistance` | 1.0 | yields PVR ~147 dyn·s·cm⁻⁵ | OK |
| `arterialStiffness` | 1.0 | neutral multiplier on Vs | OK (neutral) |
| `venousTone` | 0.2 (0–1) | sets stressed/unstressed split → Pmsf ~7 (Guyton) to 12–19 (clinical) [Maas 2015] | uncertain — operating Pmsf ~10 is reasonable |
| `HR` | 75 bpm | resting 60–100 [Klabunde] | OK |
| **TBV distribution** | Vu: SV 2500, VC 250, PCap 60, PVen 90, PVein 120; arterial Vu 0 | Guyton split: **veins ~64%, arteries ~13%, pulmonary ~9%, heart ~7%** | systemic-venous reservoir correct; arterial-Vu=0 lump differs from textbook split — note |

(c) The model concentrates its unstressed reservoir in the systemic veins (correct), but because
arterial `Vu = 0`, a literal compartment-by-compartment % comparison to Guyton needs the settled
*stressed* volumes (codex1). Direction and reservoir location are right.

---

## G. Respiratory + the PEEP unit handling

`Pth()` = `Pth0` + **0.20·PEEP** + `respAmpTh`·sin(2π`respRate`·t);
`Palv()` = **PEEP** + `respAmpAlv`·sin(2π·respRate·t).

| Param | Model default | Literature (ref) | Verdict |
|---|---|---|---|
| `Pth0` | 0 | intrathoracic/pleural ~**−4 (exp) to −8 (insp) mmHg** [Klabunde] | OK as a *baseline offset* (0 = referenced to atmospheric); true resting ~−4 not modelled |
| `respAmpTh` / `respAmpAlv` | 0 / 0 | respiratory swing amplitude | OK (off by default; respiration opt-in) |
| `respRate` | 0.25 Hz = **15/min** | normal **12–16/min** [Klabunde] | OK |

### The PEEP unit issue — quantified (flagged finding)

The UI labels PEEP in **cmH₂O**, but the engine treats the number as **mmHg** in both `Pth` and
`Palv`. Two distinct effects, of opposite consequence:

1. **Alveolar path (`Palv = PEEP`): genuine ~36% over-statement, uncompensated.** A clinical
   PEEP of 10 cmH₂O = **7.36 mmHg**, but the engine adds the raw **10** as mmHg → **+36%**
   (factor 1/0.7356 = 1.36). This over-pressures every `ext:"palv"` consumer — the **PCap** node
   external pressure and the **PCap_PVen** waterfall. So under PEEP the pulmonary-capillary
   compartment is over-loaded by ~36%. **This is a real bug** and should get the 0.7356 conversion.

2. **Pleural path (`Pth = … + 0.20·PEEP`): the unit error is *masked* by the 0.20 coefficient.**
   Physiologically only a **fraction** of alveolar/airway pressure transmits to the pleural space:
   transmission ratio ~**0.24–0.50** in normal lungs (≈37% at high compliance, ≈24% at low; ~50%
   when both lung and chest-wall compliance are normal) [Chapin/Marini, PubMed 3902386]. The engine
   adds 0.20·10 = **2.0 mmHg**. Relative to the *true* alveolar rise (7.36 mmHg), that is an effective
   transmission of 2.0/7.36 = **0.27** — which lands squarely inside the physiological 0.24–0.50 band.
   So the 0.20 coefficient applied to the cmH₂O-numbered PEEP ≈ 0.27 transmission of the true mmHg
   pressure: the **unit error and the low coefficient nearly cancel** on the pleural path. Functional,
   but fragile — it is right *by accident*, not by construction.

**Recommendation (M12):** convert PEEP cmH₂O→mmHg (×0.7356) once at the input, then use a clean,
explicit pleural transmission coefficient (~0.25–0.5) on the converted value. That fixes the
alveolar over-statement and makes the pleural path correct by design instead of by cancellation.

---

## Open questions / for M12 (priority order)

1. **`Tmax0` ceiling ~3–4× supra-physiological** (382.5 kPa vs ~100–120 kPa). Re-derive from a
   physiological peak fibre stress + explicit scale; re-fit so normal **CO → ~5 L/min** (currently
   ~3.5) without breaking waveform shape. This also relaxes the elevated SVR (F) and under-scaled
   valve gradients back toward range.
2. **PEEP alveolar over-statement (+36%)** — add the cmH₂O→mmHg conversion; replace the
   accidental-cancellation pleural path with an explicit transmission coefficient.
3. **PV `Amax` = 4.0 cm²** is ~+3 SD high vs 3.01 ± 0.36 — trim to ~3.0 if valve-area fidelity matters.
4. **`sigmaPas0`/`bPas`** uncalibrated — fit to a Klotz-normalised human EDPVR.
5. **Arterial Vu = 0** — decide whether to give arteries an explicit unstressed pool for a literal
   Guyton-style compartmental volume split.
6. **AR severity-1 EROA = 0.29 cm²** sits exactly on the 0.30 severe knee — fine, but add margin if
   a clearly-severe AR lesson is wanted.

## References

1. Arts T, Delhaas T, Bovendeerd P, et al. "Adaptation to mechanical load… the CircAdapt model." *Am J Physiol Heart Circ Physiol* 2005. https://journals.physiology.org/doi/abs/10.1152/ajpheart.00444.2004 (single-fibre Sf,act ≈ 120 kPa).
2. Bovendeerd PHM et al. "Dependence of local LV wall mechanics on myocardial fiber orientation." *J Biomech* 1992. https://pubmed.ncbi.nlm.nih.gov/1400513/ (peak fiber stress ~30–110 kPa).
3. Genet M et al. "Distribution of normal human LV myofiber stress at end diastole and end systole." *J Appl Physiol* 2014. https://pmc.ncbi.nlm.nih.gov/articles/PMC4101610/ (ED 2.21 ± 0.58, ES 16.54 ± 4.73 kPa).
4. Klotz S et al. "Single-beat estimation of the end-diastolic pressure–volume relationship." *Am J Physiol Heart Circ Physiol* 2006. https://journals.physiology.org/doi/full/10.1152/ajpheart.01240.2005 (normalized EDP = 28.2·V_n^2.79).
5. Sequeira V, van der Velden J. "Cardiac sarcomere mechanics in health and disease." *Biophys Rev* 2021. https://link.springer.com/article/10.1007/s12551-021-00840-7 (optimum 2.2 µm, descending limb to ~2.8 µm).
6. Length–tension / Frank–Starling. CV Physiology. https://cvphysiology.com/cardiac-function/cf004 ; Deranged Physiology length–tension. https://derangedphysiology.com/main/cicm-primary-exam/musculoskeletal-system/Chapter-141/relationship-between-muscle-length-and-tension
7. Troponin-C Ca binding & cooperativity. *J Physiol/Biophys* PMC3018540. https://pmc.ncbi.nlm.nih.gov/articles/PMC3018540/ (isolated TnC Hill ~1–2; intact force–pCa higher).
8. Liu Z, Brin KP, Yin FCP. "Estimation of total systemic arterial compliance in humans." *J Appl Physiol* 1986/1990. https://journals.physiology.org/doi/abs/10.1152/jappl.1990.69.1.112 (~1.1–1.6 mL/mmHg).
9. Pulmonary arterial compliance ~4 mL/mmHg. "The Critical Role of Pulmonary Arterial Compliance in PH." *Ann Am Thorac Soc* 2017. https://pmc.ncbi.nlm.nih.gov/articles/PMC5461956/
10. Guyton AC, Hall JE. *Textbook of Medical Physiology* — blood-volume distribution (systemic 84%: veins ~64%, arteries ~13%, arterioles/caps ~7%; heart ~7%, pulmonary ~9%).
11. Rothe CF. "Reflex control of veins and vascular capacitance." *Physiol Rev* 1983 (unstressed volume ~60–70% TBV). Gelman S. "Venous function and central venous pressure." *Anesthesiology* 2008. Fudim M et al. "Venous Tone and Stressed Blood Volume in HF." *JACC* 2022. https://www.jacc.org/doi/10.1016/j.jacc.2022.02.050
12. Stergiopulos N, Westerhof BE, Westerhof N. "Total arterial inertance as the fourth element of the windkessel model." *Am J Physiol* 1999. https://journals.physiology.org/doi/full/10.1152/ajpheart.1999.276.1.H81 (L ~0.005 mmHg·s²/mL).
13. AV-valve orifice areas (MV, TV). *J Am Soc Echocardiogr* 1994. https://pubmed.ncbi.nlm.nih.gov/8021055/
14. Aortic & pulmonary valve orifice areas in normal adults (Doppler). *Am J Cardiol* 1992. https://pubmed.ncbi.nlm.nih.gov/1428292/ (PV 3.01 ± 0.36 cm²).
15. Aortic valve opening/closing dynamics (MRI sub-ms). *PMC8440328*. https://pmc.ncbi.nlm.nih.gov/articles/PMC8440328/ (Tro ~27.5, Trc ~43.8 ms).
16. Zoghbi WA et al. (ASE) recommendations for native valvular regurgitation — EROA severe thresholds (MR ≥0.40, AR ≥0.30, TR ≥0.40 cm²). https://www.ahajournals.org/doi/10.1161/01.CIR.96.10.3409
17. Airway→pleural pressure transmission. Chapin/Marini et al. "Influence of lung and chest wall compliances on transmission of airway pressure to the pleural space." *Am Rev Respir Dis* 1985. https://pubmed.ncbi.nlm.nih.gov/3902386/ (24–37%; ~50% when compliances normal).
18. Klabunde RE. *Cardiovascular Physiology Concepts*, 3rd ed. (SVR/PVR ranges, HR, intrathoracic pressure, respiratory rate).
