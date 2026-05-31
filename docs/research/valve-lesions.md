# Valvular lesions: aortic stenosis & mitral regurgitation

Model files: `officialCases.ts` (case `valve-lesions`) · `engine/caseResolve.ts`
`INTERVENTIONS.aorticStenosis` / `.mitralRegurgitation` (→ severity knob) ·
`engine/knobs.ts` valve-lesion formulas · `engine/ModelCore.ts` valve flow.

## Parameters in play

| Lesion / mapping | Model value | Literature target (ref) | Verdict |
|---|---|---|---|
| Normal `AoV_Amax` | 3.5 cm² | aortic valve area ~3–4 cm² [Otto/ESC] | OK |
| Normal `MV_Amax` | 5 cm² | mitral valve area ~4–6 cm² | OK |
| **AS severe**: `AoV_Amax ×(1−0.75·sev)` | ×0.25 → **0.875 cm²** | severe AS: AVA ≤ 1.0 cm² [ESC/AHA] | OK (in severe range) |
| **AS severe**: `AoV_R ×(1+5·sev)` | ×6 | extra ejection impedance | OK direction |
| realised AS gradient | ≈ **19 mmHg** | severe AS: mean gradient ≥ 40 mmHg | **OFF — gradient under-scaled** |
| **MR**: `MV_Aleak = 0.3·MV_Amax·sev` | mild(0.33)→**0.495 cm²**; sev1→1.5 cm² | EROA: mild <0.2, mod 0.2–0.4, **severe ≥0.4 cm²** [ASE/AHA] | **OFF — coefficient ~3× too aggressive** |

## A. Physiological validity vs literature   [lead]

### Aortic stenosis (authored: `severe`)
- **Severity guidelines**: severe AS = AVA ≤ 1.0 cm² (indexed ≤0.6 cm²/m²), peak velocity ≥4 m/s,
  **mean gradient ≥ 40 mmHg**. Empirically AVA 1.0 cm² ≈ gradient 26; AVA 0.8 cm² ≈ gradient 40.
- **Model**: severe → AVA 0.875 cm² — squarely in the severe range, good. BUT the realised
  systolic LV–aortic gradient is only ≈ 19 mmHg, well below the ≥40 expected at this AVA. So the
  *orifice area* is calibrated but the *pressure gradient* is under-scaled — partly because the
  flow model also normalises by Amax (see section B) and partly the low-output baseline (a 0.875 cm²
  valve at the model's low CO generates a smaller gradient than at a normal 5 L/min CO).
- **Direction**: correct — AoP_sys falls, a systolic LV–Ao gradient appears, forward SV drops.
  Good teaching case; the gradient magnitude is the calibration gap (read direction, not value).

### Mitral regurgitation (authored: `mild` — was `severe`, which was degenerate)
- **Severity guidelines**: EROA mild <0.2, moderate 0.2–0.4, **severe ≥0.4 cm²**; regurgitant
  fraction severe ≥50 %; severe regurgitant volume ≥60 mL. Hallmark: a large LA systolic **v-wave**
  from retrograde flow, raised LAP/PCWP, reduced *forward* SV (total SV high, EF "preserved/high").
- **Model**: `MV_Aleak = 0.3 · MV_Amax · sev`, MV_Amax = 5 cm². Even the authored **mild** (sev 0.33)
  gives a leak area of **0.495 cm²**, which clinically is already a **severe EROA (≥0.4)**. At sev = 1
  the leak is 1.5 cm² — so large that the lumped LV empties into its 3 mL minimum-volume floor every
  beat (EF ~97 %, moderate ≡ severe — the degeneracy that forced the case down to "mild" in #3-d).
- **Finding**: the severity→leak-area coefficient is **~3× too aggressive**. To span EROA 0→~0.5 cm²
  across severity 0→1, the leak at sev 1 should be ~0.4–0.6 cm², not 1.5 cm² (coefficient ~0.1·MV_Amax,
  not 0.3·MV_Amax — or cap MV_Aleak well below MV_Amax).
- **Direction at "mild"**: correct — raised LAP/v-wave, reduced forward output, high EF. The teaching
  point holds; only the severity↔EROA scale is mis-calibrated.

## B. Physical & computational rationale   [codex1]

**Resolution.** Severity strings → numeric (mild 0.33, moderate 0.66, severe 1.0). Severe AS:
`AoV_Amax = 3.5·(1−0.75·1.0) = 0.875`, `AoV_R = 0.005·(1+5·1.0) = 0.030`. Mild MR:
`MV_Aleak = 5.0·(0.3·0.33) = 0.495`, MV_Amax stays 5.0.

**Valve flow model & the key computational finding** (`engine/ModelCore.ts:766-797, 938-960`). Each
valve is a dynamic flow `q` + opening fraction `xi`:
`qNext = (q + (dt/L)(Pu−PdEff)) / (1 + dt(R + B·|q|)/L)`, `xiEq = sigmoid(kOpen·(Pup−Pdown))`. Losses:
`areaRatio = max(Aleak + xi·(Amax−Aleak), 1e-4)/max(Amax, 1e-6)`, then `R = valveR/areaRatio²`,
`B = baseB/areaRatio²`, `L = valveL/areaRatio`. **Crucial: `Amax` is NORMALISED OUT of `areaRatio`
when the valve is fully open** — so lowering AoV_Amax 3.5→0.875 does NOT by itself create the
`1/area²` Bernoulli penalty; **the AS effect comes almost entirely from the explicit `AoV_R ×6`
term** (and opening-fraction dynamics). That is exactly why a clinically-severe AVA number yields an
under-scaled gradient. *Units verdict:* Amax/Aleak are documented as cm² but the engine uses them as
relative area scalars inside a unitless ratio — absolute AVA/EROA calibration cannot rely on the raw
area alone until the flow law uses physical area consistently.

**AS cross-check** (severe, converge-settled, `health: ok`): CO_L 3.18, AoP 86.1/60.1, AoPMean 65.2,
LVEDP 5.6; **mean LV–Ao gradient (while QAo>1 mL/s) = 14.8 mmHg, max 36.9** — well below the ≥40
severe-AS target. (Section A's ~19 is a different systolic window; same conclusion.)

**MR cross-check** (mild): CO_L 3.49, AoP 86.4/56.7, LAP mean/max 5.0/11.8, EF_L 0.86, min VLV
**13.2 mL**, QMV min/max −431.5/362.6 mL/s. Confirms even the "mild" leak is a large regurgitant
pathway. The **3 mL floor is real**: `sanitizeState()` clamps chamber volume to [3, 450]; a bigger MR
leak empties the LV into it (non-physiological EF). Mild stays off the floor (13.2 mL) but the margin
is thin — section A's caution holds.

**M12 (codex):** MR — calibrate to regurgitant fraction/volume + LA v-wave, not an EROA-looking raw
area; if keeping the relative-area law, **~0.1·MV_Amax at severity 1** (≈0.5 cm² severe endpoint)
beats the current 0.3·MV_Amax. AS — needs absolute-area-aware gradient calibration (today `AoV_R`
carries the stenosis; `AoV_Amax` is mostly relative opening geometry), coupled to the normal-CO fix.

## Open questions / for M12

- **MR**: retune `MV_Aleak` coefficient (~0.1·MV_Amax) so severity maps to EROA 0→~0.5 cm²; and/or
  lower the LV minimum-volume floor / add a wall so a regurgitant LV doesn't pin. Then the official
  MR case can be "moderate/severe" honestly.
- **AS**: calibrate the orifice/resistance split so a 0.8–1.0 cm² AVA produces a ~30–40 mmHg mean
  gradient at a normal CO (coupled to the `Tmax0`/CO recalibration).

## References

1. Baumgartner H et al. (ESC/EACVI) recommendations on the echocardiographic assessment of aortic stenosis — severe AS = AVA ≤1.0 cm², mean gradient ≥40 mmHg.
2. Otto CM, Nishimura RA et al. 2020 ACC/AHA Valvular Heart Disease Guideline.
3. AS gradient–area relationship. https://pmc.ncbi.nlm.nih.gov/articles/PMC6055582/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8503314/ (AVA 1.0 ≈ grad 26; AVA 0.8 ≈ grad 40).
4. Zoghbi WA et al. (ASE) recommendations for native valvular regurgitation — MR EROA mild/mod/severe thresholds (≥0.4 cm² severe), v-wave. https://www.ahajournals.org/doi/10.1161/01.CIR.96.10.3409
5. Mitral Regurgitation — StatPearls. https://www.ncbi.nlm.nih.gov/books/NBK553135/
