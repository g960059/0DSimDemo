# Cardiogenic shock: LV failure ± dobutamine

Model files: `officialCases.ts` (case `lv-failure-dobutamine`) · `engine/caseResolve.ts`
`INTERVENTIONS.lvPumpFailure` / `.dobutamine` · `engine/knobs.ts` (knob→raw).

## Parameters in play

| Knob transform | Model value @ this case | Literature target (ref) | Verdict |
|---|---|---|---|
| **lvPumpFailure(sev=0.8)** | | | |
| `contractility *(1−0.6·sev)` | ×0.52 (→ lvTmaxScale ×0.52) | severe systolic dysfunction: large ↓ contractility | OK direction |
| `relaxation *(1−0.35·sev)` | ×0.72 | impaired lusitropy in failure | OK |
| `afterload *(1+0.3·sev)` | ×1.24 | reflex vasoconstriction (↑SVR) in shock | OK direction |
| `HR +15·sev` | +12 bpm | reflex/compensatory tachycardia | OK |
| **dobutamine(dose=7)** | | | |
| `contractility *(1+0.05·dose)` | ×1.35 | β1 inotropy, dose-dependent ↑CO/↑SV | OK direction |
| `relaxation *(1+0.02·dose)` | ×1.14 | β1 lusitropy | OK |
| `afterload *(1−0.01·dose)` | ×0.93 | mild ↓SVR (β2) | OK |
| `HR +1.5·dose` | +10.5 bpm | tachycardia at higher doses | OK |

Realised (converge-settled): **LV failure** CO ≈ 2.9 L/min, AoP ≈ 83/63, LVEDP ≈ 7.5,
LAP ↑ vs normal; **+Dobutamine** CO ↑, LAP ↓, AoP ↑ (partial recovery).

## A. Physiological validity vs literature   [lead]

**Cardiogenic shock criteria** (clinical): cardiac index < ~1.8–2.2 L/min/m²; SBP < 90 /
MAP < 65 mmHg for ≥30 min; **elevated filling pressure PCWP > 15 (often >18) mmHg**; signs of
hypoperfusion. The defining triad is *low output + high filling pressure + hypoperfusion*.

**Assessment of the model's failure state (sev 0.8):**
- **Low output: YES** — CO ≈ 2.9 L/min (CI ≈ 1.6 for a 1.8 m² adult) is genuinely low-output.
  Direction and magnitude read as shock. (sev 0.6 was too mild — fixed in #3-d.)
- **Hypotension: borderline** — MAP ≈ 71 is at/above the 65 cutoff; the reflex `afterload ×1.24`
  props pressure up, which is physiologic (compensated shock) but means it is not frankly
  hypotensive. Defensible as "compensated cardiogenic shock".
- **Elevated filling pressure: UNDER-represented** — LVEDP ≈ 7.5 mmHg is raised vs the model's
  own normal (~4.6) and LAP rises, but real cardiogenic shock has PCWP > 18. The congestion
  signature is directionally right but blunted. (Partly the low-filling-pressure baseline gap
  documented in baseline-and-normal.md.)

**Dobutamine direction** is correct and well-supported: β1 agonist → ↑contractility, ↓ESV, ↑SV,
↑CO, ↓SVR, and tachycardia at higher dose. Crucially the lesson shows **CO up AND filling
pressure (LAP) down** — the hallmark "the failing, congested ventricle is unloaded by inotropy"
teaching point. The model reproduces this (tested: dobutamine CO > failure CO; LAP_dobut < LAP_failure).
Real-world caveat the modelLimitations note: no reflex/baroreflex, so this is an *uncompensated*
substrate with only the intervention's explicit HR/SVR terms.

**Teaching verdict:** directionally faithful and instructive. The main fidelity gap is that the
congestion (PCWP) is milder than clinical shock — read the *direction*, not the absolute LVEDP.

## B. Physical & computational rationale   [codex1]

> _To be authored by codex1 in `lv-failure-dobutamine.codex.md`: how `contractility` (→ global)
> and `lvTmaxScale` enter σ_act; whether stacking lvPumpFailure (×0.52 on lvTmaxScale via the
> contractility knob) and dobutamine (×1.35) composes as intended through `effectiveKnobs`
> (multiplicative in knob space, then clampKnobs); the afterload→systemicResistance→SVR mapping
> and its effect on MAP; why LVEDP stays ~7.5 (passive σ_pas curve + the operating EDV). Cross-check
> the CO/MAP numbers._

## Open questions / for M12

- The reflex `afterload ×(1+0.3·sev)` is a *baked-in* compensation; with a real baroreflex (M8)
  it should be a response, not a fixed coefficient. Document so M12 doesn't double-count.
- Once `Tmax0` is recalibrated and normal CO ~5, re-check that sev 0.8 still gives CI ~1.6–2.0.
- Filling-pressure response is blunted — revisit `bPas`/operating EDV so PCWP rises toward >15
  in severe failure.

## References

1. Klabunde RE. *Cardiovascular Physiology Concepts* — heart failure, inotropy, Frank–Starling.
2. van Diepen S et al. "Contemporary Management of Cardiogenic Shock." *Circulation* 2017 (shock criteria CI/PCWP/MAP).
3. Dobutamine pharmacology / hemodynamics — StatPearls. https://www.ncbi.nlm.nih.gov/books/NBK470431/
4. Deranged Physiology — Dobutamine. https://derangedphysiology.com/main/cicm-primary-exam/cardiovascular-system/Chapter-974/dobutamine (dose-dependent inotropy, ↓SVR, tachycardia at higher dose).
5. Majidi M et al. (and others) on dobutamine restoring ventriculo-arterial matching in cardiogenic shock. https://www.sciencedirect.com/science/article/abs/pii/S1931524410001593
