# Cardiogenic shock: LV failure ± dobutamine

> **Status note:** the operating-point **numbers** below are **M12-lite/Phase-1-era** (e.g. baseline
> `lvTmaxScale` is now 0.70, dobutamine dose retained at 7) and are being changed by the in-progress
> atrial-split reparam — to be refreshed after the Phase-2 commit. Literature targets & directions
> remain valid. See [atrial-split-validity-review.md](./atrial-split-validity-review.md).

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

**Coefficient composition** (`engine/caseResolve.ts`; `effectiveKnobs` applies ordered `*`/`+`/`=`
transforms in knob space then clamps; `applyKnobs` maps to raw). `lvPumpFailure(0.8)`: clinical
contractility 1·(1−0.6·0.8)=**0.52**, relaxation 0.72, afterload 1.24, HR 75+12=**87**. Clinical
contractility maps to **`lvTmaxScale`** (not raw global `contractility`), so resolved raw =
lvTmaxScale 0.52, rvTmaxScale 1.0, relaxation 0.72, systemicResistance 1.25·1.24=**1.55**, HR 87.
`+Dobutamine(7)` stacks: contractility 0.52·1.35=**0.702**, relaxation 0.821, afterload 1.24·0.93=1.153,
HR 87+10.5=**97.5** → lvTmaxScale 0.702, systemicResistance 1.442.

**How knobs enter the engine:** failure scales `σ_act = Tmax0·tmaxScale·…` *LV-only* (rvTmaxScale
untouched) — appropriate for "global LV failure", but note dobutamine's inotropy is also LV-only here
(`contractilityRV` unchanged). `relaxation` divides the Ca-decay τ in `internalDerivatives()` (lower →
slower Ca removal → higher filling pressure; dobutamine partly reverses). `afterload` scales systemic
resistive/dynamic edges; the **fixed reflex `afterload ×1.24` is why the low-output state is not
frankly hypotensive**. Because clinical contractility hits `lvTmaxScale` (a force scale), inotropy here
is mostly a force edit, not a full Ca-transient edit.

**Independent cross-check** (converge-settled, both `health: ok`, no clamps):

| Metric | LV failure | + Dobutamine |
|---|---:|---:|
| HR | 87 | 97.5 bpm |
| CO_L | 2.89 | 3.36 L/min |
| AoP | 82.4/62.9 | 89.3/67.6 mmHg |
| AoPMean | 67.4 | 72.4 mmHg |
| LAP | 7.4 | 6.1 mmHg |
| LVEDP | 7.5 | 5.7 mmHg |
| EF_L | 0.34 | 0.40 |

Matches section A's direction (CO up, LAP/LVEDP down). MAP wording: AoPMean 67.4 (failure) is
"borderline", not frankly normal. Filling pressure rises directionally but stays far below
cardiogenic-shock PCWP — consistent with the baseline low-filling-pressure gap.

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
