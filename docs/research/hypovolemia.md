# Hypovolemia

Model files: `officialCases.ts` (case `hypovolemia`, `targetVolume: 4600`) ·
`engine/ModelCore.ts` `initializeVenousPressuresForTargetTBV` / `projectVenousPressuresToTargetTBV`
(the TBV → venous-pressure projector) · venous-return / Pmsf observables.

## Parameters in play

| Param | Model value | Literature target (ref) | Verdict |
|---|---|---|---|
| Normal TBV | 5600 mL | ~70 mL/kg → ~5 L @70 kg [Guyton&Hall] | OK |
| Hypovolemia TBV | **4600 mL** (−1000 mL ≈ −18 %) | ATLS Class II haemorrhage = 15–30 % loss (750–1500 mL) | OK — moderate hypovolemia |
| (lower bound) | 4000 mL was clamp-heavy (Class III), retuned up | — | documented |
| mechanism | ↓ stressed volume → ↓ Pmsf → ↓ venous return → ↓ preload → ↓ SV/CO | Guyton venous-return curve | OK structurally |

## A. Physiological validity vs literature   [lead]

**Hemorrhage classes (ATLS)** for a ~5 L blood volume: Class I < 15 % (<750 mL), Class II
15–30 % (750–1500 mL), Class III 30–40 % (1500–2000 mL), Class IV > 40 %. A 1000 mL reduction
(5600 → 4600, ≈18 %) is a **Class II** haemorrhage — a clear, teachable, moderate hypovolemia
that is not yet decompensated catastrophe.

**Physiology to show**: reduced circulating volume lowers the **mean systemic filling pressure
(Pmsf)** and thus venous return (Guyton: VR ∝ (Pmsf − RAP)/R_VR). Lower preload → lower EDV →
(Frank–Starling) lower SV and CO, with **low filling pressures (RAP/LAP)** and a **normal pump**
(EF preserved). It is a *preload* problem, not a *pump* problem — the key teaching contrast vs
the LV-failure case.

**Assessment of the model (TBV 4600):**
- **Direction correct** (tested): CO < normal, RAP < normal, SV down, EF preserved (~52 %), low
  filling pressures — exactly the preload-limited, normal-pump signature.
- **Magnitude**: at the model's already-low baseline CO (~3.5), an 18 % volume loss drops CO
  substantially; MAP falls into a hypotensive range. That is a fairly severe presentation for a
  Class-II loss, which reflects (i) the **absent baroreflex** (no compensatory tachycardia/
  vasoconstriction — `LIMIT_NOREFLEX`) and (ii) the model operating near its **venous-return
  floor** (below ~4000 mL the venous-pressure projector hits clamps and the state degenerates —
  which is why 4000 was rejected and 4600 chosen).
- **Pmsf reference**: classic Guyton Pmsf ≈ 7 mmHg (clinical measurements 12–19 under anaesthesia
  due to raised unstressed volume). The model's normal Pmsf ≈ 10 sits between; hypovolemia lowers it.

**Teaching verdict:** faithful in direction and category (Class-II, uncompensated). The absolute
hypotension is exaggerated by the missing baroreflex and the low baseline CO — both documented.

## B. Physical & computational rationale   [codex1]

**Target-TBV enforcement** (`engine/ModelCore.ts:378-382, 1050-1082`). No knobs/interventions — only
`targetVolume` 5600→4600 changes, applied by `initializeVenousPressuresForTargetTBV` →
`projectVenousPressuresToTargetTBV`: a **bisection finds a uniform offset on all venous-pressure state
variables** so total computed blood volume hits target (venous nodes contribute
`effectiveVu + venousStressedVolume(Ptm)`; transmural pressure evaluated/clamped to [−20, 45] mmHg).
This is a static-volume *re-initialisation*, not bleeding over time — `targetVolume` affects state
init/projection, NOT a raw param patch.

**Venous return / Pmsf math** (`engine/ModelCore.ts:912-929, 1090-1128`). Venous nodes use a nonlinear
compliance `Ceff = Ccoll + (Copen−Ccoll)·sigmoid((Ptm−Popen)/dOpen) − (Copen−Cdist)·sigmoid((Ptm−Pstiff)/dStiff)`;
stressed volume is its integral. As TBV falls the projector lowers venous Ptm → less stressed volume →
lower `Pmsf = stressedVolumeSystemic/complianceSystemic` (mL ÷ mL/mmHg = mmHg) → lower vrGradient =
Pmsf−RAP → lower preload, SV, CO. Dimensionally consistent.

**Clamp floor + TBV sweep.** State sanitation clamps venous Ptm to [−20, 45] mmHg and chamber volume to
[3, 450] mL; the projector also works within [−20, 45]. So there is a **lowest representable TBV**:

| Target TBV | CO_L | AoPMean | RAP | LAP | Pmsf | Clamp hits | Health |
|---:|---:|---:|---:|---:|---:|---:|---|
| 5600 | 3.52 | 70.1 | 2.8 | 3.2 | 10.5 | 0 | ok |
| **4600** | **2.64** | **51.7** | **0.8** | **0.9** | **6.7** | **0** | **ok** |
| 4000 | 1.91 | 36.6 | 0.2 | 0.2 | 4.4 | 8132 | warning |
| 3500 | 1.86 | 33.1 | 0.0 | 0.1 | 2.4 | 47905 | warning |

This justifies the official 4600 mL choice: a stable uncompensated preload-limited state, while
≤4000 mL is clamp-heavy and not usable as an official target without model changes. The −1000 mL is
17.9 % of the model's 5600 (or 20 % of a 5 L reference) — ATLS Class II, matching section A.

**Cross-check** (converge-settled): Normal→Hypovolemia CO 3.52→2.64, AoP 94.1/64.5→66.9/47.9,
AoPMean 70.1→51.7, RAP 2.8→0.8, LAP 3.1→0.9, Pmsf 10.5→6.7, EF_L 0.53→0.50, no clamps. Nuance: EF is
"preserved" in the teaching sense but drops slightly (0.53→0.50), not exactly unchanged.

## Open questions / for M12

- Widen the usable hypovolemia range: the venous-pressure clamp floor caps how low TBV can go before
  the projector degenerates; revisit the venous compliance / unstressed-volume model so Class III–IV
  haemorrhage is representable.
- With a baroreflex (M8), hypovolemia should show compensatory tachycardia + vasoconstriction (and
  then decompensation) rather than a static uncompensated drop.

## References

1. Guyton AC, Hall JE. *Textbook of Medical Physiology* — venous return curves, mean systemic filling pressure, blood volume.
2. ATLS (American College of Surgeons) hemorrhage classification (Class I–IV, % blood volume).
3. Maas JJ et al. "Value and determinants of the mean systemic filling pressure in critically ill patients." *Am J Physiol Heart Circ Physiol* 2015. https://journals.physiology.org/doi/full/10.1152/ajpheart.00413.2015
4. Deranged Physiology — mean systemic filling pressure. https://derangedphysiology.com/main/cicm-primary-exam/cardiovascular-system/Chapter-0284/concept-mean-systemic-filling-pressure
