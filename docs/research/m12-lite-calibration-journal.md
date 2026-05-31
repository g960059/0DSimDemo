# M12-lite calibration — process journal & results

A full record of the trial-and-error, the dead-ends, the two human-prompted
pivots that broke the impasse, the final landing parameters, and the issues
deliberately deferred to M12-proper. Companion to `m12-lite-plan.md` (the plan)
and `parameter-survey.md` (the parameter evidence base).

Team: `lead` (claude-code 4.8, integration/decisions), `codex1` (codex 5.5,
numerical sweeps), `claude1` (claude-code, literature/validation). Coordinated
via agmsg team `0dsim1`. Review gate: codex1 + claude1, both consulted.

> **Status:** landing parameters finalised pending one last RV-case verification
> (TR / RV-failure under the gentle RV passive law). Everything else validated.

---

## TL;DR — what changed and why it's better

The headline change is **retiring the supra-physiological `Tmax0` (382→135 kPa,
the legacy `lvTmaxScale=4.5` fudge)** by re-attributing it to the correct
thick-sphere Laplace factor `geomChi` (0.36→1.36) — and then **fixing the
diastolic side-effect that move created**.

The decisive discovery (prompted by the human): **`geomChi` multiplies the
PASSIVE EDPVR term as well as the active term** (`PtmPa = geomChi·(2h/rm)·(σ_pas+σ_act)`),
so tripling `geomChi` for the FORCE correction inadvertently **stiffened diastole
~3.8×**, while `sigmaPas0` was never recalibrated. Undoing that (recalibrating the
LV passive law to a Klotz-valid EDPVR at the corrected geometry, **without touching
`Vref`** so ejection mechanics are preserved) restores normal-range filling and lifts
output — at a physically honest operating point.

### Wins (Normal baseline, settled)

| Metric | today (shipped) | M12-lite landing | normal target |
|---|---:|---:|---|
| CO (L/min) | 3.5 | **4.40** | 4–6 |
| MAP (mmHg) | 70 | **85** | 85–95 |
| AoP sys/dia | 94/64 | **120/78** | 120/80 |
| LVEF | 0.53 | **0.604** | 0.55–0.65 |
| MV E/A | 1.46 | **1.90** | 1–2 |
| EDV (mL) | 88 | 97.4 | 110–150 (still low) |
| LAP (mmHg) | 3.2 | 1.73 | 8–12 (still low) |
| Tmax0 ceiling | 382.5 kPa (fudge) | **135 kPa (physiological)** | ~100–150 |
| realised peak σ_act | — | ~10–11 kPa (active) | ~16 total ES in-vivo [Genet 2014] |

Two supra-physiological artefacts retired: the `Tmax0` ceiling **and** the
`geomChi×sigmaPas` diastolic-stiffening coupling. MR congestion preserved (see
below). AoP 120/78 is near-textbook — a real shape win, not just a number.

---

## The journey (chronological)

### 0. Starting point — the force correction un-masked a deficit

Applying the honest force params (`geomChi` 1.36 / `Tmax0` 135 kPa for LV; 1.139 /
57 kPa for RV) gave a physiological Tmax0 and better σ_act, but CO fell to ~3.2,
MAP ~61, AoP 83/56, EDV ~71, with MV E/A pushed restrictive (~3.17). The inflated
Tmax0 had been **masking** a small-EDV / low-filling problem. So normal CO/MAP/EF
needed a coupled **preload** calibration, not just force.

### 1. First conclusion: "structural" — no force-fixed param set hits all gates

codex1 swept four lever families with **force held fixed**:

1. **volume redistribution only** (SV.Vu trim + pulmonary Vu raise): neutral — EDV
   stuck ~71, LAP ~4.
2. **`Vref`/`V0` rescale** to admit EDV 120: EDV 121 ✓, E/A 1.76 ✓, but **EF
   collapsed to 0.335** — because the active stretch reference (`rmRef`, derived
   from `Vref`) moved too, gutting ejection (ESV 81).
3. **`bPas`/`sigmaPas0` softening**: EF 0.56 ✓ but EDV 85, LAP 1.58, and the EDPVR
   **flattened** (P140 ≈ 9 vs Klotz ~25 — invalid).
4. **brute-soft**: CO 5.1 / EDV 114 ✓ but EF 0.74, LAP 1.58, RAP 8.21, E/A 0.93
   (A>E — backwards), Klotz-invalid.

claude1 cross-checked: all four fail a Klotz-shape gate and/or a pseudonormal
gate (e.g. family 4 has LAP 1.58 < RAP 8.21 — inverted). The apparent root cause:
**EDV, EF and the EDPVR all share one chamber geometry (`V0`/`Vref`/`Vw`)**, so the
levers fight by construction. Verdict at this point: structural; recommend HOLD.

### 2. Human pivot #1 — "did you try raising TOTAL volume via the initial state vector?"

A sharp methodological catch: the closed-loop TBV is the **conserved sum of the
initial state vector**, not a DAE parameter. We had only nudged it (5800–6200).
codex1 ran a proper grid (5600 → +50%) on both bases; claude1 validated targets.

Findings:

- **The model's TBV 5600 mL is already at/above the top of normal** (~4900 mL for a
  70 kg adult; range 4500–5500 [Nadler 1962; Feldschuh & Enson 1977; ICSH; Guyton]).
  So adding volume = frank hypervolemia.
- On the force-honest base, **EDV does NOT climb to 120 even at pathological filling**:
  EDV 76 @ LAP 7.8, EDV 82 @ LAP 12, EDV only 108 at LVEDP ~31. Decisive: the chamber
  is **left-shifted/stiff**, not volume-starved.
- **RAP overshoots LAP** as volume rises (systemic veins soak it at low pressure) —
  the gradient goes the wrong way before EDV approaches target.

So the TBV lever is **not** the clean fix — but the experiment was decisive and
isolated stiffness from starvation. (The engine's `projectTBV` preserves the
initialised TBV with fluid=bleed=0, so it does not defeat the lever; it just can't
initialise targets >~10400 mL.)

### 3. Human pivot #2 — "could the vascular/chamber compliance be wrong?" → THE breakthrough

This unlocked it. Inspecting `chambers.ts`:

```
sigma  = sigmaPas + sigmaAct
PtmPa  = geomScale · geomChi · (2h/rm) · sigma     // geomChi hits BOTH terms
```

**`geomChi` multiplies the passive EDPVR term too.** Raising it 0.36→1.36 for the
FORCE correction stiffened diastole ~3.8×, while `sigmaPas0` (flagged "uncalibrated"
in `parameter-survey.md`) stayed at 2000.

- claude1's analytic confirmation: at EDV 120 (λ=1.0), σ_pas ≈ 6963 Pa, 2h/rm ≈
  0.571 ⇒ EDP = geomChi·0.571·6963/133.3 = **~10.7 mmHg at geomChi 0.36 (≈Klotz-correct)
  but ~40 mmHg at geomChi 1.36 (~4× too stiff)**.
- codex1's TBV grid was independent proof: at matched LVEDP ~10 the OLD base (geomChi
  0.36) holds EDV ~115–118 (near-Klotz) while the NEW base (geomChi 1.36) holds only ~76.

So the "structural wall" was **largely a calibration artefact** — the passive law
was never recalibrated after the geometry correction. claude1 honestly revised the
earlier "structural" verdict. (The EF-collapse in family 2 was a *real* `Vref`
coupling; the untried path — keep `Vref`, recalibrate the passive amplitude/shape —
sidesteps it.)

### 4. The fix — recalibrate the passive law to a Klotz-valid EDPVR

Anchor the EDPVR on the Klotz reference curve through the normal operating point
(120 mL, 10 mmHg). The **correct Klotz parameterisation** is the V0-anchored
power law (after a reconciliation between the two of us — see note):

> A **Klotz-derived** EDPVR (Klotz V0/V30 + exponent Bn=2.76), reconstructed as
> `P = 30·((V−V0)/(V30−V0))^2.76` forced through (V0,0) and (V30,30), with
> `V0 = Vm·(0.6−0.006·Pm)` ⇒ for (120,10): V0 ≈ 64.8 mL, V30 ≈ 147 mL
> [Klotz et al. 2006]. (The *published* normalised curve is `EDP = An·(V/V30)^Bn`,
> An≈27.8 — our V0-anchored form is Klotz-consistent, not the verbatim equation.
> Sanity: V30≈147 is physiological; the pure-power form forced through (120,10)
> gives V30≈174 = an unphysiologically compliant LV, which is why the steep curve
> is the correct normal EDPVR.)

Klotz target EDPVR: EDV 100→2.9, 110→5.8, **120→10**, 130→15.8, 140→23.5, 150→33.

**Klotz V30 reconciliation (recorded honestly):** claude1 first used a simplified
`An·(V/V30)^Bn` form that omits V0 and mis-set V30≈174 → too-gentle P140≈15. codex1's
single-point Klotz (V30≈147) was correct; claude1 corrected the table. The **steep
high-volume limb (P jumps 10→23.5 over EDV 120→140) is the correct physiology** — a
normal LV strongly resists dilation above ~130 mL — and is **essential for the
MR/volume-overload teaching cases** (the regurgitant LV pays a steep EDP penalty →
raised LAP/PCWP → the v-wave/congestion signature).

### 5. gentle vs steep `bPas` — a real trade-off, decided on the MR case

A **single exponential `σ_pas(λ)` cannot match the Klotz power-law at BOTH ends**:

- **gentle `bPas` 10** (`sigmaPas0` ~500): compliant in the operating range → BEST
  Normal dynamics (CO 4.28), but **flat above 120** (P140 14.5) → under-resists
  dilation. On the official **MR** case it **floored** the LV (clamps 321, ESV 3.0,
  EF 0.97) — degenerate, unsafe.
- **steep `bPas` 23.2** (`sigmaPas0` 200): steep above 120 (P140 23.5, Klotz-correct)
  → MR clean (0 clamps, ESV 11, v-wave 8.86 preserved), AND — once the **RV was also
  recalibrated** (sigmaPas0 2000→492, the geomChi-compensation) — a **better Normal**
  than gentle: EDV 97.6, EF 0.604, AoP 120/78.

**Decision: STEEP.** It preserves MR teaching, avoids clamps, and lands a better
Normal. The single-exponential full-range limitation is logged as M12-proper
(a 2-region passive law would be cleaner, but the steep fit is ±1–2 mmHg of Klotz).

---

## Final landing parameters

```
LV active (chambers.ts defaultActiveLV):
  geomChi 1.359637, Tmax0 135000, V0 10, Vref 120,
  sigmaPas0 200.133, bPas 23.2, lambdaPas0 0.9025
RV active (defaultActiveRV):
  geomChi 1.138505, Tmax0 57176, V0 15, Vref 135,
  sigmaPas0 492, bPas 10, lambdaPas0 0.85
```

- LV passive recalibrated to steep Klotz; RV passive recalibrated by the
  geomChi-compensation (`sigmaPas0` 2000→492 = 2000·0.28/1.1385), `bPas` 10 kept.
- **`Vref` held at 120 (LV) / 135 (RV)** — the key to preserving EF (`rmRef`
  unchanged), and why this sidesteps the family-2 EF collapse.

**RV asymmetry — flagged latent risk (claude1):** LV steep but RV gentle is
*directionally correct* (RV is thinner-walled, lower-pressure: RVEDP ~2–6 vs LV
8–12 [Klabunde, hemodynamics]). BUT by the same logic that floored gentle-LV/MR, the gentle RV
high-volume limb is a risk for TR / RV-failure. **Pre-stamp action:** verify TR +
RV-failure don't floor under the gentle RV; if they do, the RV needs a steep refit.
Either way, a proper RV Klotz-refit is an M12-proper item.

---

## Validation

### Official cases at the steep landing (settled)

| Case | clamps | direction / shape | verdict |
|---|---:|---|---|
| Normal | 0 | CO 4.40, MAP 85, EDV 97.6, EF .604, LAP 1.75, E/A 1.90 | clean, honest |
| LV failure | 0 | CO 3.60 < normal, LAP 5.35 > normal, EF .395 | ✓ |
| + Dobutamine (dose 7) | 0 | CO 4.40 > failure 3.60, LAP 2.80 < 5.35, MAP 93 > 82 | ✓ **self-fixed** |
| Aortic stenosis | 0 | CO 4.05 < normal, LAP 2.6 > normal, EF .52 | ✓ |
| Mitral regurgitation | 0 | LAPmax 13.6 vs normal 2.9, v-wave 8.86, fwd output ↓ | ✓ congestion preserved |
| Hypovolemia | →0 | retuned targetVolume 4600→4800 (see below) | ✓ after retune |

- **Dobutamine self-fixed:** the force-only base had broken the dobutamine
  directionality test (dobutamine CO < failure CO, because tachycardia cut filling
  at the low-CO operating point). At the higher-CO steep landing it passes with the
  **current dose 7** — so the planned `dose 7→3` edit is **NOT needed**.
- **Hypovolemia was a new regression:** shipped-old @TBV 4600 = 0 clamps; steep
  landing @4600 = 1792 clamps (RA floor, because baseline filling is lower).
  **Fix: official hypovolemia targetVolume 4600→4800 mL** (0 clamps, still teaches
  low-preload/output: CO 3.22<4.40, MAP 62<85, EDV 83<97, RAP .69<1.83). The deeper
  fix (representing Class III–IV hemorrhage without flooring) is M12-proper.

### Snapshot / settle methodology (human-flagged)

The frozen baseline snapshot used `settleMode:"fixed"`, `settleSeconds:8` — but the
model settles at ~22.5 s (converge detector: 27 beats), so **8 s is a transient**
(worst normalised delta ~0.09 vs the settled state). codex1's settle scan: fixed
50/60 s reach the long-run asymptote (cycle delta 0.000). **Action: set
`BASELINE_OPTIONS.settleSeconds` 8→60** (byte-stable AND settled) for the regenerated
snapshot. Split policy: **fixed-60 for frozen snapshots, `converge` for physiology
gates** (caseOps/grounded metrics should require `settleStatus.settled`).

---

## Waveform morphology findings (this session)

- **PV-loop ejection-top apex** (human observation: peak looks shifted right). Measured
  apex at fraction (EDV−V_peakP)/(EDV−ESV) = **0.189** (~19% into ejection), vs a
  normal-young band of **~25–50% inboard** [Murgo 1980; Kondiboyina 2022]. So mildly
  **over-right** — directionally a young compliant aorta DOES peak early (right-of-centre
  is correct), but the model's apex is pinned too close to AV-open. Root cause: the
  **single-node Windkessel has no wave reflection** (no late-systolic augmentation, no
  diastolic hump), the **same root as the structurally-absent AoP incisura**.
  **Do NOT "fix" by shifting the apex left** — a central/late apex is the stiff/old
  pattern, wrong for a young Normal. Proper fix = distributed/transmission-line arterial
  load [Nichols & O'Rourke, McDonald's; CircAdapt TL tree]. M12-proper.
- Confirmed unchanged-good shapes: LVP no aortic-closure notch; rounded PV-loop top;
  LAP a/v waves + x/y descents (c-wave still absent — needs valve-plane coupling).

---

## Deferred to M12-proper (consolidated)

1. **Circuit-structure / preload delivery** — an independent EDV lever +
   pulmonary-venous-return/LA circuit so EDV→~120 and LAP→8–12 *without* RAP
   overshoot (now EDV 97.6 / LAP 1.75). Also fixes the **LAP<RAP near-inversion**
   (normal LAP exceeds RAP by ~3–6). codex1's sweeps localised this to the LA-side
   filling topology (PVein–LA coupling / LA compliance), **not** mere venous-compliance
   scalars: even extreme pulmonary-venous stiffening raised RAP before LAP.
2. **Distributed arterial load / wave reflection** (transmission-line) — one root for
   the absent AoP incisura, the over-right PV apex (0.189), and the missing diastolic
   hump. Don't chase with R/L/C tuning.
3. **RV EDPVR Klotz-refit** — steep high-volume limb scaled to RVEDP ~4–6 @ RVEDV
   ~120–150; gate on TR / RV-failure behaviour.
4. **Venous-pressure projector clamp floor** (hypovolemia RA-floor) — revisit venous
   compliance/Vu so Class III–IV hemorrhage is representable without clamps.
5. **c-wave** (LAP/CVP) — needs valve-plane motion or closed-valve P_V−P_A coupling.
6. **Pulmonary-vein flow observable** (Q_PVein_LA) — not surfaced; add to assess S/D/Ar.
7. **Single-exponential `σ_pas` full-range fidelity** — steep LV fits ±1–2 mmHg now;
   a 2-region passive law is cleaner if ever needed.

---

## References (as cited by the team; real sources only)

- Klotz S et al. *Single-beat estimation of the end-diastolic pressure-volume
  relationship.* Am J Physiol Heart Circ Physiol 2006 — EDPVR normalisation; the
  published normalised curve is `EDP = An·(V/V30)^Bn` (An≈27.8, Bn=2.76) with the
  single-beat V0/V30. Our journal uses a Klotz-**derived** V0-anchored reconstruction
  (same V0/V30/Bn), not the verbatim published equation.
- Lang RM et al. (ASE/EACVI) *Recommendations for cardiac chamber quantification by
  echocardiography in adults.* 2015 — normal LV/RV **volume & EF** ranges (chamber
  size/function: LVEDV, LVEF, RV linear dims/TAPSE). Does NOT report filling
  *pressures* — those (RVEDP 2–6 / LVEDP 8–12) are cited to Klabunde below.
- Klabunde RE. *Cardiovascular Physiology Concepts* — normal filling pressures
  (RVEDP ~2–6, LVEDP/LAP ~8–12 mmHg), E:A, hemodynamic relationships.
- Genet M et al. 2014 — in-vivo realised myofibre stress (ED ~2.2 / ES ~16.5 kPa).
  NB: Genet's ~16 kPa is **total** ES myofibre stress (passive+active); the model's
  ~10–11 kPa is **active-only** — a sanity benchmark, not a 1:1 equivalence.
- Nadler SB et al. 1962; Feldschuh J, Enson Y. *Prediction of normal blood volume.*
  Circulation 1977; ICSH; Guyton & Hall — total blood volume ~70 mL/kg.
- Murgo JP et al. *Aortic input impedance in normal man.* Circulation 1980 — arterial
  wave types A/B/C, early- vs late-systolic peak.
- Kondiboyina A et al. J Physiol 2022 — young aortic pressure (early peak, negative
  augmentation, diastolic hump).
- Nichols WW, O'Rourke MF. *McDonald's Blood Flow in Arteries* — wave reflection /
  augmentation index; transmission-line arterial load.
- Venous capacitance ~24× arterial (systemic ≫ pulmonary venous compliance):
  the 24× ratio is classically Guyton & Hall / Rothe CG (*Physiol Rev* 1983);
  Gelman S. *Venous function and central venous pressure.* Anesthesiology 2008 is a
  supporting review.
- Nagueh SF et al. (ASE) 2016 — diastolic function / E:A / restrictive thresholds.
- CircAdapt large-vessel transmission-line arterial tree — PMC6677326.
- MESA (pulmonary blood volume ~547 ± 180 mL); Guyton (~9% of TBV).
