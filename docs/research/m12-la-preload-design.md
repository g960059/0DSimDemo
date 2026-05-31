# M12-proper #1: LA-side preload delivery design

Design note for the post-M12-lite preload-delivery problem:

- Target at TBV 5600 mL: LV EDV ~110-120 mL, LAP ~8-12 mmHg, RAP ~2-6 mmHg,
  LAP-RAP gradient +4-6 mmHg, CO toward ~5 L/min, 0 clamps.
- Starting point: M12-lite commit `8413a87`.
- Section A is reserved for physiological/literature synthesis.
- Section B is the mathematical, physical, and engine-side analysis.

> **⚠️ Superseded-premise note (2026-05-31):** the pulmonary delivery is now a **physical
> pulmonary-venous split (no projector)** — passages below that assume the venous-pressure **projector**
> (e.g. early Section-B reasoning about projector volume-redistribution) are **superseded** by the
> Phase-2b physical-split design and the current params. The **reservoir / AV-plane (Phase-2b)** and the
> physiology gates remain active. Validity of the current split + atrial params:
> [atrial-split-validity-review.md](./atrial-split-validity-review.md).

---

## A. Physiology + literature + calibration targets [claude1]

Engine atria today (`chambers.ts`/`buildNodes`): LA `{V0 5, alpha 0.05, beta 0.4, Ees 0.25}`,
RA `{V0 5, alpha 0.05, beta 0.35, Ees 0.22}`, `ElastanceChamberModel`, activation amplitude 0.35 at a
phase offset. The A7 target table is the acceptance contract claude2 codes against and codex1's
Section-B scaffold fits to.

### A1. LA function triad — reservoir / conduit / booster, and the atrial kick

The LA is not a passive bag; it has three integrated mechanical phases [PMC4200839; aging study
PMID 11179264]:

| Phase | When | Mechanism | Share of LA contribution to SV |
|---|---|---|---|
| **Reservoir** | LV systole, MV closed | LA expands, stores pulmonary venous return (driven by base descent + venous return) | ~**40 %** |
| **Conduit** | early diastole, MV open | passive transfer LA→LV down the pressure gradient | ~**35 %** |
| **Booster pump** | late diastole | LA contracts — the "atrial kick" | ~**25 %** |

- **Atrial kick = 20–30 % of LV filling / EDV** in healthy adults [StatPearls *Atrial Kick* NBK482421];
  the early passive phase supplies the other 70–80 %.
- **Booster share RISES when the LV is stiff** (diastolic dysfunction) and is LOST in AF [JACC 2019 LA
  review] — exactly why a working active atrium matters for the abnormal lessons (a stiff-LV case
  should show an augmented a-wave).

### A2. LA pressure-waveform genesis (mechanical cause of each feature)

| Feature | Mechanical cause | Normal amplitude |
|---|---|---|
| **a-wave** | atrial **contraction** (booster) | peak ~10–12; **+3–6** above the x-trough |
| **x-descent** | atrial **relaxation** + base pulled down in systole | ~5–8 |
| **c-wave** (small) | MV **closure/bulge** into LA during LV isovolumic contraction | ~+1–2 |
| **v-wave** | LA **filling** vs closed MV in late systole (reservoir peak) | peak ~10–15; **v > a**; v ~**10.3 ± 3.9** |
| **y-descent** | MV **opens**, LA empties (conduit) | down to ~6–8 |
| **mean LAP** | circuit-set (see A4) | **8–12** (typ ~8) |

Two model notes: (i) **v > a** is the normal ordering; (ii) a true **c-wave needs MV-into-LA
mechanical coupling** a flow-only valve can't make (see `waveform-morphology.lit.md`) — active atria
give a/v/x/y, not c.

### A3. Atrial activation timing — the phase offset

- Atria contract **120–200 ms before** the ventricles (the **PR interval**, mean ~150–160 ms; P-wave
  ~80 ms + AV-nodal delay ~50–100 ms) [normal ECG]. The a-wave precedes ventricular systole.
- **Target: atrial mechanical activation LEADS ventricular by ~150 ms (range 120–200 ms).**
- The current engine already encodes ~this (`chamberActivation` advances atrial phase by `0.16/T`
  ≈ 160 ms at HR 75). **Timing is already physiological — preserve it** (HR-aware, per §B7); the deficit
  is amplitude/contractility, not timing.

### A4. Normal LA pressures, volumes, contractility — and what sets mean LAP

| Quantity | Normal target | Source |
|---|---|---|
| Mean LAP | **8–12 mmHg**, ≥ RAP by **+3–6** | hemodynamics; Klabunde |
| a-wave / v-wave peaks | a ~10–12, v ~10–15 (v > a) | invasive LA; Eur Heart J |
| LAVmax | ~**40–55 mL** (LAVI ≤ 34, upper ≤41 mL/m²) | Lang 2015; Aune 2009 |
| LAVmin | ~**18–30 mL** (LAVI min ≤ 19) | Aune 2009 |
| **LAEF (total)** | **45–65 %** (lower-normal 45 %) | Aune 2009 |
| Atrial **Emax** (if elastance) | lumped-model human **~0.5–0.6 mmHg/mL**, Emin ~0.15–0.18 | Shi/Ursino-class |
| (measured LA Ees, context only) | ~4–6 (dog, small-V referenced) — NOT the 0D target | Hoit 1994 |

**Crucial division of labour (consistent with §B5):** **mean LAP is a CIRCUIT property**, not an
atrial one. codex1's sensitivity sweep shows raising `LA.Ees` actually *lowers* mean LAP
(dLAP/dEes ≈ −2.76) — atrial contractility governs the **a-wave / booster**, while **mean LAP 8–12 is
delivered by the pulmonary-venous→LA distribution** (A5) + mobilising systemic unstressed volume
centrally. So: the model's **LA Ees 0.25 is too soft for the BOOSTER** (weak a-wave), but **do NOT use
atrial stiffness as the mean-LAP lever** — that path costs CO and over-peaks the a-wave (§B5). Fix mean
LAP in the circuit; fix the a-wave/booster in the atrium.

### A5. Pulmonary-venous compartment (the delivery side)

LAP can't reach 8–12 unless the upstream compartment supplies it:

- **Pulmonary blood volume ~450–560 mL (~10 % TBV)** [MESA 547 ± 180; Guyton ~9 %], split ≈ arterial
  **1/3**, capillary **1/6**, **venous ~45–50 %** → pulmonary-venous volume ~**200–280 mL**.
- **Pulmonary venous compliance ~7–15 mL/mmHg** (total pulmonary ~20; venous the larger share)
  [Reuben, PubMed 7452896]. The systemic venous reservoir is ≫ 100 mL/mmHg — this **asymmetry** (pulm
  venous ~10× stiffer/smaller) is what lets **LAP sit at 8–12 while RAP stays 2–6**.
- **S / D / Ar** pulmonary-venous flow [Smiseth 2003]: **S** (systolic), **D** (early-diastolic conduit,
  tracks mitral E), **Ar** (atrial reversal from the booster). Normal **S ≥ D**; *not yet exposed*
  (`Q_PVein_LA`) — the active atrium is what generates a credible **Ar**.

**Circuit caveat (per §B1–B3):** the residual is a **LAP < RAP near-inversion** because P_PVein sits
~1.5 mmHg *below* P_VC. The fix is to raise pulmonary-venous pressure *relative to caval* by ~5 mmHg —
achieved by **mobilising systemic unstressed volume centrally** (the dominant EDV/CO lever, §B5), a
modest `PVein_LA.R` reduction, and pulmonary-venous compliance in the ~7–15 mL/mmHg band — **not** by
adding pulmonary `Vu` (wrong sign at fixed TBV, §B3).

### A6. Literature / structural: is active-stress atria the right choice?

- **CircAdapt — the reference 0D-mechanics model — models LA and RA as single-walled active-stress
  chambers** (same single-fibre framework as its ventricles; the wall contracts when its myofibers do,
  producing real reservoir/conduit/booster P–V loops) [Arts 2005; CircAdapt manual]. So **active-stress
  atria is the established, validated structural choice**, and it unifies the atria with the already-
  active ventricles (the geomChi/Klotz machinery already derived applies — see §B6).
- Time-varying **elastance** atria (Ursino/Shi-class) are the common lumped shortcut — adequate for
  reservoir/conduit but they *impose* the a-wave as a prescribed pulse rather than letting it emerge,
  and need a hand-tuned Emax. The model's failure mode (**LA Ees 0.25 too soft** → weak booster) is the
  elastance shortcut mis-calibrated.

### A7. ► TARGET TABLE for claude2 (physiology acceptance gates)

**Timing:** atrial activation **leads ventricular by ~150 ms (120–200 ms)** — preserve the existing
HR-aware `~0.16/T` (~160 ms) offset (§A3/§B7); do not change timing.

**LA mechanics (Normal, settled):**
- Mean LAP **8–12 mmHg**; **LAP − RAP ≈ +3–6** (must exceed RAP — fixes the inversion).
- a-wave peak ~**10–12**, v-wave peak ~**10–15**, **v > a**; a-wave amplitude **+3–6** over the x-trough.
- LAVmax **40–55 mL**, LAVmin **18–30 mL**, **LAEF 45–65 %**; booster delivers **20–30 % of LV EDV**.

**Atrial contractility/stiffness:**
- Governs the **a-wave/booster ONLY** — calibrate to the a-wave (+3–6 mmHg) & LAEF, **not** to mean LAP.
- Active-stress (preferred): atrial peak active stress is a **fraction of ventricular** (thin wall) —
  **~15–40 kPa** (codex1 prototype: LA ~20, RA ~15; sweep to the a-wave gate), softer passive law than
  the ventricle. Geometry / exact scaffold → §B6–B7.1.
- If kept elastance (interim): **Emax ≈ 0.5–0.6 mmHg/mL** (≈ 2× the current 0.25), Emin ~0.15.

**Pulmonary-venous delivery circuit:**
- Pulmonary blood volume **~500 mL**; pulmonary-venous compliance **~7–15 mL/mmHg** (≫ stiffer than
  systemic). Mean fix is **central volume mobilisation** + modest `PVein_LA.R` cut, **not** added pulm `Vu`.
- **Result gate: LAP 8–12, RAP 2–6, EDV ~110–120, CO toward ~5, 0 clamps, at TBV 5600** (no hypervolemia).

**Waveforms (when observables land):** LA a/v/x/y present (c-wave deferred — needs valve-plane coupling);
pulmonary-venous **S/D/Ar** with **S ≥ D**, Ar present (expose `Q_PVein_LA`).

### A8. ► STRUCTURAL RECOMMENDATION

**Do BOTH, staged — they are coupled, neither alone suffices (agrees with §B9):**

1. **Pulmonary-venous / distribution pass FIRST.** Mean LAP and EDV are circuit-set (§A4/§B5): mobilise
   systemic unstressed volume toward the central/pulmonary/left-heart side (the dominant EDV/CO lever),
   set pulmonary-venous compliance ~7–15 mL/mmHg, modestly reduce `PVein_LA.R`. This moves LAP from ~1.7
   toward 8–12 and fixes the LAP < RAP inversion — which **no atrial model can do alone** (the atrium
   only pressurises what it is delivered).
2. **Migrate LA/RA to active-stress** (CircAdapt-style, HR-aware pre-ventricular activation) for the
   reservoir/conduit/booster mechanics, an emergent **a-wave** and pulmonary-venous **Ar**, calibrated to
   the A7 gates. This is the human-authorised end-state, is structurally correct (CircAdapt-validated),
   and must **not** lean on passive stiffness as a mean-pressure hack (§B5).

**Why not circuit-only:** it reaches EDV/CO but leaves LAP ~4–6 with a near-flat gradient and no emergent
booster/Ar; and the active migration is already mandated. **Why not atria-only:** an active atrium with
the current under-pressured pulmonary-venous compartment still starves — it can't manufacture preload it
isn't given. The A7 gates are the shared acceptance contract for codex1's engine math and claude2's build.

### A-References

1. Hoit BD et al. "In vivo assessment of left atrial contractile performance… time-varying elastance model." *Circulation* 1994. https://pubmed.ncbi.nlm.nih.gov/8149549/
2. LA macrophysiology — three phases. *PMC4200839*. https://pmc.ncbi.nlm.nih.gov/articles/PMC4200839/ ; aging quantification PMID 11179264. https://pubmed.ncbi.nlm.nih.gov/11179264/
3. *Atrial Kick* — StatPearls (20–30 % of LV filling). https://www.ncbi.nlm.nih.gov/books/NBK482421/
4. Hoit BD. "Left atrial size and function." *JACC* 2019. https://www.jacc.org/doi/10.1016/j.jacc.2019.01.059
5. Normal LA pressure / a-c-v genesis — ScienceDirect *Heart Left Atrium Pressure*; LA V-wave 10.3 ± 3.9, *Eur Heart J* 2024. https://academic.oup.com/eurheartj/article/doi/10.1093/eurheartj/ehaf784.2935/8311010
6. Aune E et al. "Normal reference ranges for LA/RA volume indexes and EF by RT3D echo." *Eur J Echocardiogr* 2009 (LAVI max ≤41/min ≤19, LAEF ≥45 %). https://academic.oup.com/ehjcimaging/article/10/6/738/2366849
7. Lang RM et al. (ASE/EACVI) chamber quantification 2015 — LA volume ranges.
8. PR interval 120–200 ms — normal ECG (StatPearls *P wave* NBK551635).
9. Reuben SR — pulmonary venous compliance ~7–15 mL/mmHg, total pulmonary ~20. https://pubmed.ncbi.nlm.nih.gov/7452896/
10. MESA Lung Study — pulmonary blood volume ~547 ± 180 mL; Guyton ~9 % TBV.
11. Smiseth OA et al. "Pulmonary venous flow by Doppler revisited." *JACC* 2003 (S/D/Ar). https://www.jacc.org/doi/10.1016/S0735-1097(03)00126-8
12. Arts T et al. "Adaptation to mechanical load… the CircAdapt model." *Am J Physiol Heart Circ Physiol* 2005 — active-stress single-fibre atria. https://journals.physiology.org/doi/full/10.1152/ajpheart.00444.2004
13. Shi Y et al. — lumped-parameter atrial time-varying elastance (LA Emax ~0.5–0.6 mmHg/mL class).

---

## Acceptance protocol (verification gates) [claude1]

Concrete pass/fail for the human-approved **two-phase + `atrialContractility` knob** plan. Read all
metrics from a **settled** state (fixed-60 s snapshot or `converge` with `settleStatus.settled`),
**beat-averaged** over ≥1 full settled beat, at **TBV 5600** unless stated. Each phase must also keep
the **official suite GREEN (100/100, tsc 0)** and **0 clamps** — those are hard gates, not metrics.

Legend: **PASS** = ship; **MARGINAL** = acceptable, document as a known low/high-normal; **FAIL** = block.

**Reconciliation with codex1's Phase-1 sweep (important):** circuit-only with the current elastance
atria **cannot** reach mean LAP 8–12 + gradient +3–6 while holding CO ~5 (best circuit-only:
EDV 110–115 / CO 5 / RAP 2–6 but **LAP ~4–6, gradient ~0 to +1**; forcing the gradient via LA passive
stiffness drops CO and is the **forbidden** hack of §A4/§B5). The full LAP 8–12 + gradient is the
**COMBINED Phase-1+2** result — the **active-atrial booster** (Phase 2) is the *legitimate* mechanism
that lifts LAP the rest of the way (an active contraction, NOT passive stiffening). So the gates split:
**Phase 1 = standalone-achievable**, **Final = post-Phase-2 combined**, and the **inversion hard-fail
lives only at the Final gate**.

### Phase 1 — STANDALONE gates (circuit / preload delivery, elastance atria)

| # | Metric | How measured | PASS | MARGINAL | FAIL |
|---|---|---|---|---|---|
| 1.1 | **0 clamps** | `clampHitCount` over settled beat | = 0 | — | > 0 |
| 1.2 | **TBV conserved** | `totalBloodVolume()` settled | 5600 ± 50 mL | ±50–150 | drift > 150 mL |
| 1.3 | **LV EDV** | max VLV per beat | **110–115 mL** | 108–110 or 115–120 | < 108 |
| 1.4 | **CO** | SV×HR (or beat ∫Q_Ao) | **4.5–5.5 L/min** | 4.0–4.5 or 5.5–6.0 | < 4.0 or > 6.5 |
| 1.5 | **Mean RAP** | beat-mean RAP | **2–6 mmHg** | 1–2 or 6–7 | < 1 or > 7 |
| 1.6 | **EF maintained** | (EDV−ESV)/EDV | **0.55–0.65** | 0.52–0.55 or 0.65–0.70 | < 0.50 or > 0.72 |
| 1.7 | **Mean LAP raised** | beat-mean LAP | **toward ~5–6** (clearly up from the 1.7 baseline) | ~4–5 | still < ~4 (no progress) |
| 1.8 | **Inversion neutralised** | mean LAP − mean RAP | **≥ ~0** (LAP no longer below RAP) | −0.5 to 0 | < −0.5 (still clearly inverted) |
| 1.9 | **Official cases hold** | suite + per-case direction/shape vs M12-lite | all green, directions preserved | — | any case regresses |
| 1.10 | **Arterial pressure normotensive (no regression)** | beat AoP sys/dia + MAP; mean PAP | **MAP 85–95; AoP ~115–125 / 75–82 (PP ~40); PAP not moved AWAY from physiological normal** (mPAP normal 14–18 — the M12-lite ~9 is LOW, so a rise toward 14–18 is an **improvement**, not a regression) | MAP 82–85 or 95–98; AoP sys 110–115 or 125–130; mPAP nearing 20 | MAP < 82 or > 98; AoP > 130/ > 88 (hypertensive); **mPAP > 20 (new PH)** or pushed further below ~9 |

*Why 1.10:* mobilising volume centrally raises SV → it can push MAP/AoP up (codex1's first candidate hit
MAP 100, AoP 144/91 — hypertensive). The Normal must stay **normotensive**, so the central-volume shift
must be paired with an **SVR co-tune** to hold MAP/AoP at the M12-lite operating point. Do not accept a
preload fix that trades normotension for it.

*Phase-1 intent:* EDV/CO and the partial LAP rise are **circuit-set** — mobilise systemic unstressed
volume centrally + pulmonary-venous compliance ~7–15 mL/mmHg + modest `PVein_LA.R` cut. **Do NOT** chase
mean LAP 8–12 here by stiffening a chamber — that's the forbidden hack and it costs CO. LAP 8–12 is the
**Final** gate, delivered by the Phase-2 booster.

### Phase 2 — active-stress atria (adds the booster/a-wave; must not regress Phase 1)

| # | Metric | How measured | PASS | MARGINAL | FAIL |
|---|---|---|---|---|---|
| 2.1 | **Phase-1 structural gates hold** | re-run 1.1–1.6, 1.9 (clamps/TBV/EDV/CO/RAP/EF/suite) — LAP & gradient now graduate to Final, should be *exceeded* not merely held | all PASS | — | any FAIL |
| 2.2 | **a-wave peak** | LAP at a-wave peak | **10–12 mmHg** | 9–10 or 12–14 | < 9 or > 15 |
| 2.3 | **v-wave peak** | LAP at v-wave peak | **10–15 mmHg** | 9–10 or 15–18 | < 9 or > 18 |
| 2.4 | **v > a ordering** | v_peak vs a_peak | v_peak > a_peak | within ~0.5 | a_peak > v_peak |
| 2.5 | **a-wave amplitude** | a_peak − preceding x-trough | **+3–6 mmHg** | +2–3 or +6–7 | < +2 or > +8 |
| 2.6 | **LAVmax** | max VLA per beat | **40–55 mL** | 35–40 or 55–60 | < 35 or > 65 |
| 2.7 | **LAVmin** | min VLA per beat | **18–30 mL** | 15–18 or 30–34 | < 15 or > 38 |
| 2.8 | **LAEF (total)** | (LAVmax−LAVmin)/LAVmax | **45–65 %** | 40–45 or 65–70 | < 40 or > 72 |
| 2.9 | **Booster fraction** | late-diastolic (atrial-kick) LV filling ÷ total diastolic filling (= mitral **A**-VTI ÷ total mitral-inflow VTI) | **20–30 % of LV filling** | 15–20 or 30–35 | < 15 or > 38 |
| 2.10 | **MV inflow E/A** | mitral E_peak / A_peak (QMV) | **E/A 1–2, E > A** | 0.8–1.0 or 2.0–2.5 | A > E (A-dominant) or E/A > 2.5 |
| 2.11 | **Atrial timing** | t(a-wave peak) vs t(LVP rapid upstroke) | a-wave precedes ventricular onset by **120–200 ms** | 100–120 or 200–230 | a-wave at/after ventricular onset |
| 2.12 | **PVF S/D/Ar** | `Q_PVein_LA` (now exposed) | **S ≥ D**, **Ar present** (retrograde dip in atrial systole), Ar dur ≤ mitral-A dur | S/D ~equal, Ar tiny | D > S, or no Ar at all |
| 2.13 | **Atrial PV loop = FIGURE-8** (both loops have area; reservoir dominant) | LA P–V loop (LAP vs VLA) over one settled beat: # self-crossings; signed area of each sub-loop; reservoir-limb hysteresis width | **figure-8** (≥1 self-crossing → two **opposite-orientation** sub-loops); **reservoir (V) loop NOT collapsed** — fill/empty hysteresis width **≥ ~1.5 mmHg**; **A_reservoir ≥ A_booster** (reservoir dominant, ideal ≥1.5×); each sub-loop area ≥ ~10 % of the P–V bounding box (ΔP·ΔV) | figure-8 present but reservoir ≈ booster, or hysteresis 0.5–1.5 mmHg | reservoir loop **collapsed to a near-line** (width < 0.5 mmHg / area < floor), OR no figure-8 (single loop / no crossing), OR **A_booster > A_reservoir** (booster-dominant — wrong) |

*Why 2.13 (ref: Sci Rep 2024 s41598-024-52327-6 Fig 11; LA reservoir/conduit/booster mechanics
PMC4200839):* a normal atrial PV loop is a **figure-8** — the **larger reservoir (V) loop** (LA fills
vs a closed MV in LV systole, then empties as conduit; opens an area by **hysteresis** between fill and
empty paths) crossed at a waist by the **smaller booster (a) loop** (active contraction). The current
**time-varying-elastance atria collapse the reservoir loop to a near-line** (fill and empty trace ~the
same passive curve → no hysteresis) — a known elastance artefact. **Active-stress atria fix it** because
the active **relaxation/contraction kinetics** (Ca `c`/activation `a` states) make the fill and empty
limbs follow *different* stress trajectories → real reservoir-loop area. This gate is the visual proof
the migration did its job; it cannot be faked by passive tuning.

### Final — COMBINED gates (post-Phase-2; the booster lifts LAP the rest of the way)

These are the gates that were **not** achievable by Phase 1 alone — they require the active-atrial
booster on top of the Phase-1 circuit. Read on the full Phase-1+2 system, settled.

| # | Metric | How measured | PASS | MARGINAL | FAIL |
|---|---|---|---|---|---|
| F.1 | **Mean LAP** | beat-mean LAP | **8–12 mmHg** | 7–8 | < 7 or > 13 |
| F.2 | **LAP − RAP** (gradient) | mean LAP − mean RAP | **+3 to +6** | +1 to +3 | **≤ 0 (inversion = HARD FAIL — only enforced here)** |
| F.3 | **Mean RAP still in band** | beat-mean RAP | 2–6 | 1–2 or 6–7 | < 1 or > 7 |
| F.4 | **EDV / CO / EF held** | as 1.3/1.4/1.6 | EDV 110–120, CO 4.5–5.5, EF 0.55–0.65 | per Phase-1 marginals | any Phase-1 FAIL |
| F.5 | **0 clamps + suite green** | clampHitCount, official suite | 0 clamps, 100/100 | — | any |
| F.6 | **All Phase-2 morphology** | 2.2–2.13 | all PASS/MARGINAL | — | any hard-gate FAIL (v>a, timing, Ar, figure-8) |
| F.7 | **Arterial pressure held (normotensive)** | as 1.10 | MAP 85–95, AoP ~115–125/75–82, PAP not regressed | per 1.10 marginals | hypertensive or PAP regressed |

### `atrialContractility` knob — directional gates

The new clinical knob must move the booster monotonically and physiologically (per `sim-priorities`,
**direction > absolute value**):

| # | Check | Expected | FAIL |
|---|---|---|---|
| K.1 | **↑ atrialContractility** | a-wave amplitude ↑, booster fraction ↑, PVF **Ar** ↑, mitral **A** ↑ (E/A ↓) | any of these moves the wrong way |
| K.2 | **↓ atrialContractility → 0** (atrial-kick loss, AF-like) | a-wave collapses, booster → ~0, Ar → ~0, LV EDV/CO drop modestly (lost atrial kick) | a-wave/booster unchanged, or EDV rises |
| K.3 | **stiff-LV / diastolic-dysfunction case** | **booster fraction RISES** vs Normal (atrial compensation), augmented a-wave | booster fraction falls or flat |
| K.4 | **Monotonic, no clamp/degenerate** | smooth response across the knob range, 0 clamps at every setting | clamps or non-monotonic jumps |

### Sign-off rule

- **Phase 1 (interim checkpoint, not shippable alone)** passes when 1.1–1.9 PASS — note LAP is only
  ~5–6 and the gradient ~0 here by design; that is EXPECTED, not a failure. Phase 1 is a milestone
  toward the Final gate, not a release.
- **Phase 2 add-on** passes when 2.1–2.12 PASS/MARGINAL. 2.4 (v>a), 2.11 (timing precedes), 2.12 (Ar
  present) are **qualitative hard gates** — no MARGINAL.
- **FINAL SHIP** requires **F.1–F.6 AND K.1–K.4** all PASS/MARGINAL. **F.2 inversion (LAP ≤ RAP) is the
  one never-waivable hard fail** — and it is enforced **only at Final** (Phase 1 only needs the
  inversion *neutralised*, gradient ≥ ~0).
- Any FAIL → the responsible lever: **circuit/distribution** for EDV/CO/RAP and the *partial* LAP rise
  (Phase 1); the **active-atrial booster** (active params, atrialContractility) for the *remaining* LAP
  lift to 8–12 + the gradient + a-wave morphology (Phase 2). **Never** close the LAP/gradient gap with
  LV/atrial *passive* stiffening — that's the forbidden mean-pressure hack (costs CO, §A4/§B5).

---

## B. Mathematical / physical / engine analysis [codex1]

### B1. Current closed-loop fixed point

Current topology from `ModelCore.ts`:

```text
Systemic: Ao -> SA -> Art -> Cap -> SV -> VC -> RA -> RV
Pulmonary: RV -> PA -> PArt -> PCap -> PVen -> PVein -> LA -> LV
```

At periodic steady state, each compartment has zero beat-mean volume drift:

```text
<dV_i/dt> = <Q_in,i - Q_out,i> = 0
```

So every serial segment carries the same beat-mean flow, up to valve-storage/inertance
and regurgitant signed-flow details:

```text
Q_sys ~= Q_pulm ~= Q_mitral ~= Q_aortic ~= CO / 60
```

For the purely resistive pulmonary venous return path, the beat-mean pressure drops are:

```text
P_PArt - P_PCap  = Q * R_PArt_PCap
P_PCap - P_PVen  = Q * R_PCap_PVen
P_PVen - P_PVein = Q * R_PVen_PVein
P_PVein - P_LA   = Q * R_PVein_LA
```

For the systemic venous return endpoint:

```text
P_VC - P_RA ~= Q * R_VC_RA_eff
```

`R_VC_RA_eff` includes the waterfall/effective-downstream behavior. The measured mean drop is more
reliable than treating it as the literal raw `R=0.04` in isolation.

Combining the last pulmonary and systemic terms gives the mean LA-RA relation:

```text
P_LA - P_RA = (P_PVein - P_VC) - Q * R_PVein_LA + Q * R_VC_RA_eff
```

Equivalently:

```text
P_LA - P_RA = (P_PVein - P_VC) + Q * (R_VC_RA_eff - R_PVein_LA)
```

Current M12-lite steady state, using 2-beat averaged hidden-node instrumentation:

```text
CO 4.389 L/min, EDV/ESV 97.7/38.4 mL, EF .606
LAP mean/max 1.739/2.914 mmHg
RAP mean/max 1.828/3.248 mmHg
LAP - RAP = -0.089 mmHg

P_PVein 3.069, P_VC 4.537, P_LA 1.719, P_RA 1.843 mmHg
PVein_LA flow 67.5 mL/s, drop 1.350 mmHg
VC_RA flow 67.1 mL/s, drop 2.694 mmHg
```

Plugging the measured terms into the equation:

```text
P_LA - P_RA = (3.069 - 4.537) - 1.350 + 2.694
            = -1.468 + 1.344
            = -0.124 mmHg   (matches measured -0.089 within beat/sample averaging)
```

The inversion is therefore not mysterious. The pulmonary venous reservoir pressure is about
1.5 mmHg lower than caval pressure. The larger VC->RA drop almost cancels that, but the
PVein->LA drop consumes the remaining advantage and leaves mean LAP slightly below mean RAP.

For the target gradient:

```text
target: P_LA - P_RA = +4 to +6 mmHg

required:
P_PVein - P_VC = (P_LA - P_RA) - Q * (R_VC_RA_eff - R_PVein_LA)
```

At current flow and drops, `Q * (R_VC_RA_eff - R_PVein_LA) ~= +1.34 mmHg`.
For a +5 mmHg LA-RA gradient, the pulmonary venous reservoir must sit roughly:

```text
P_PVein - P_VC ~= 5 - 1.34 = +3.66 mmHg
```

Current value is `-1.47 mmHg`. So the design problem is not merely "raise LA pressure"; it is to
raise pulmonary venous pressure relative to systemic venous/caval pressure by about 5 mmHg, or to
change the terminal resistive drops enough to produce the same endpoint. Reducing `PVein_LA.R`
helps, but it cannot supply the whole target by itself.

### B2. Where blood volume sits

The current realised volume distribution is:

```text
heart                  238 mL
systemic vascular     4721 mL
pulmonary vascular     641 mL
pulmonary venous side  589 mL  (PCap + PVen + PVein)
```

The important point: the pulmonary tree is not actually short of blood volume. Although authored
pulmonary venous unstressed volume is only:

```text
PCap.Vu + PVen.Vu + PVein.Vu = 60 + 90 + 120 = 270 mL
```

the realised pulmonary venous-side volume is ~589 mL because the venous-pressure nodes add stressed
volume through the nonlinear compliance law:

```text
V(P) = Vu_eff + S(P)
C(P) = dS/dP
```

in `ModelCore.venousStressedVolume()` and `venousCompliance()`.

That explains the counterintuitive sweep result: adding pulmonary `Vu` at fixed TBV increases
unstressed capacity, so the projector lowers venous pressures to keep total volume fixed. It does
not raise LAP.

### B3. Pulmonary venous Windkessel equations

For each pulmonary venous-pressure node:

```text
V_i = Vu_i + S_i(P_i)

S_i(P) =
  Ccoll * P
  + (Copen - Ccoll) * dOpen  * [softplus((P - Popen)/dOpen)  - softplus((0 - Popen)/dOpen)]
  - (Copen - Cdist) * dStiff * [softplus((P - Pstiff)/dStiff) - softplus((0 - Pstiff)/dStiff)]

C_i(P) = dS_i/dP
```

The pressure-flow chain is approximately:

```text
P_PVein = P_LA + Q * R_PVein_LA
P_PVen  = P_PVein + Q * R_PVen_PVein
P_PCap  = P_PVen  + Q * R_PCap_PVen
```

The pulmonary venous volume at a given flow and LA pressure is:

```text
V_pulm_venous =
  sum_i Vu_i
  + S_PCap(P_LA + Q*(R_PVein_LA + R_PVen_PVein + R_PCap_PVen))
  + S_PVen (P_LA + Q*(R_PVein_LA + R_PVen_PVein))
  + S_PVein(P_LA + Q*R_PVein_LA)
```

At fixed total blood volume:

```text
V_total =
  V_heart(P_LA, P_RA, phase)
  + V_systemic(P_RA, Pmsf, tone, Vu_systemic)
  + V_pulmonary(P_LA, Q, Vu_pulmonary, C_pulmonary)
  + V_arterial(Q, afterload)
```

Thus increasing pulmonary `Vu` increases the right side of the equation at unchanged pressures.
The projector/closed loop compensates by lowering pressures. This is exactly what the sweeps show.

### B4. EDV determinant

LV EDV is the end-diastolic intersection between delivered LA/MV filling pressure and the LV
diastolic pressure-volume law.

During diastole:

```text
Q_MV = F(P_LA(t) - P_LV(t), MV opening, R_MV, L_MV)
V_LV(t) = V_ES + integral_diastole Q_MV dt
P_LV(t) = P_LV_passive(V_LV(t)) + residual active/timing terms
```

At end diastole, mitral flow is near zero or closing, so the quasi-static condition is:

```text
P_LV_EDP(V_ED) ~= P_LA_late - R_MV * Q_MV - L_MV * dQ_MV/dt
```

When `Q_MV` and `dQ_MV/dt` approach zero:

```text
P_LV_EDP(V_ED) ~= P_LA_late
```

The M12-lite LV EDPVR was intentionally fit so:

```text
P_LV_EDP(120 mL) ~= 10 mmHg
P_LV_EDP(100 mL) ~= 3 mmHg
```

The current LA delivered pressure is only ~2-3 mmHg (`LAP mean/max 1.7/2.9`), so the LV lands near
EDV ~98 mL. To land at EDV 110-120, the late-diastolic LA/MV delivered pressure trajectory must move
toward the 6-10 mmHg part of the LV EDPVR.

An atrial booster can change `P_LA_late(t)` and `integral Q_MV dt`, but it cannot create the missing
central/pulmonary volume alone. It must be paired with a distribution change that moves blood from
systemic reservoir into central/pulmonary/left-heart compartments.

### B5. Local sensitivities from read-only sweeps

Finite differences around the committed M12-lite base:

| Lever | Local derivative near base | Interpretation |
|---|---:|---|
| `LA.Ees` | `dEDV/dEes +8.2 mL/unit`, `dLAP/dEes -2.76 mmHg/unit` | Raising atrial systolic elastance slightly improves emptying/EDV but lowers mean LAP. Not the mean-LAP fix. |
| LA passive `alpha,beta` scale | `dEDV/dscale -3.75 mL`, `dLAP/dscale +1.53 mmHg` | Passive stiffening raises LAP but reduces filling/output; useful for pressure, dangerous as primary EDV lever. |
| Pulmonary `Vu` total | `dEDV/dVu -0.018 mL/mL`, `dLAP/dVu -0.0018 mmHg/mL` | Adding pulmonary unstressed volume lowers pressure/preload at fixed TBV. |
| Pulmonary compliance scale | `dEDV/dscale -5.25 mL`, `dLAP/dscale -0.51 mmHg` | More compliance stores blood at lower pressure; lower compliance raises pressure but is modest alone. |
| `PVein_LA.R` | `dEDV/dR -192.5 mL/(mmHg/(mL/s))`, `dLAP/dR -19 mmHg/(mmHg/(mL/s))` | Local endpoint resistance matters; lowering it recovers part of the LA-RA inversion. |
| Systemic venous `Vu` total | `dEDV/dVu -0.016 mL/mL`, `dLAP/dVu -0.0016 mmHg/mL`, `dRAP/dVu -0.0020 mmHg/mL` | Removing systemic unstressed volume mobilizes blood centrally; this is the dominant EDV/CO lever. |

Large read-only sweeps:

| Case | CO | EDV | LAP mean/max | RAP mean/max | LAP-RAP |
|---|---:|---:|---:|---:|---:|
| Base | 4.39 | 97.7 | 1.74 / 2.91 | 1.83 / 3.25 | -0.09 |
| `PVein_LA.R` half | 4.51 | 99.5 | 1.97 / 3.00 | 1.81 / 3.21 | +0.16 |
| `PVein_LA.R` near-zero | 4.12 | 104.6 | 3.91 / 5.07 | 1.77 / 3.22 | +2.14 |
| Pulmonary `Vu +230` | 4.09 | 93.4 | 1.38 / 2.39 | 1.41 / 2.80 | -0.03 |
| Pulmonary `Vu -150` | 4.55 | 100.3 | 2.02 / 3.30 | 2.14 / 3.52 | -0.12 |
| Pulmonary compliance `x0.5` | 4.58 | 100.5 | 2.03 / 3.30 | 2.17 / 3.55 | -0.14 |
| Systemic venous `Vu -1000` | 5.06 | 110.5 | 4.43 / 6.16 | 4.43 / 6.92 | -0.01 |
| LA passive `x2` | 3.96 | 102.6 | 3.99 / 11.11 | 1.78 / 3.27 | +2.20 |
| LA passive `x1.5` + systemic `Vu -1000` | 4.51 | 113.1 | 6.62 / 14.10 | 4.62 / 6.83 | +2.00 |
| `PVein_LA.R` near-zero + systemic `Vu -1000` | 5.14 | 112.8 | 5.49 / 6.62 | 4.36 / 6.87 | +1.13 |

No circuit-only sweep hit all targets simultaneously:

- EDV/CO can be reached by central-volume redistribution.
- LAP can be raised by LA passive stiffening, but then CO falls and a-wave/peak pressure becomes large.
- `PVein_LA.R` reduction improves the local gradient but does not create enough mean LAP.
- More pulmonary unstressed volume is the wrong direction.

### B6. Thin-walled atrial geometry

The same thick-sphere geometry applies to atria:

```text
ri = (3*Vi/4*pi)^(1/3)
ro = (ri^3 + 3*Vw/4*pi)^(1/3)
h  = ro - ri
rm = (ri + ro)/2
geomChi = (ri + ro)^2 / (4*ri^2)
Ptm = geomChi * (2h/rm) * sigma
```

Using atrial-scale cavities and wall thickness assumptions:

| Chamber assumption | ri | h | Vw | geomChi |
|---|---:|---:|---:|---:|
| LA Veff 40 mL, wall 2 mm | 2.122 cm | 0.200 cm | 12.4 mL | 1.0965 |
| LA Veff 40 mL, wall 3 mm | 2.122 cm | 0.300 cm | 19.5 mL | 1.1464 |
| RA Veff 50 mL, wall 2 mm | 2.285 cm | 0.200 cm | 14.3 mL | 1.0894 |
| RA Veff 50 mL, wall 3 mm | 2.285 cm | 0.300 cm | 22.4 mL | 1.1356 |
| LV M12-lite ref Veff 110 mL, Vw 150 mL | 2.972 cm | 0.987 cm | 150 mL | 1.3596 |

So atrial `geomChi` should be close to the thin-wall limit, about 1.09-1.15, not LV-like 1.36.
The pressure gain is also smaller because `2h/rm` is small:

```text
LA h=2.5 mm, rm~2.25 cm: 2h/rm ~= 0.22
LV ref:                    2h/rm ~= 0.57
```

At the same fibre stress, a thin atrium produces much less pressure than the LV. Atrial active-stress
params therefore need their own wall volume, passive law, and active ceiling; copying ventricular
values is not physically meaningful.

### B7. Active-stress atrial equations and timing

If LA/RA migrate to `ActiveStressChamberModel`, the chamber pressure law is:

```text
lambda = rm(V - V0, Vw) / rmRef(Vref - V0, Vw)

sigma_pas = sigmaPas0 * (exp(bPas * (lambda - lambdaPas0)) - 1)
gOver     = 1 / (1 + exp(kOver * (lambda - lambdaFail)))
f_iso     = clamp((lambda - lambdaPas0 + 0.3) / 0.35, 0, 1)

sigma_act = Tmax0 * tmaxScale * contractility * a * gOver * f_iso
sigma     = sigma_pas + sigma_act

Ptm = geomScale * geomChi * (2h/rm) * sigma / 133.322
```

The current active model's internal timing is:

```text
T = 60 / HR
Trel = clamp(Trel0 * (T/T0)^etaRel, TrelMin, TrelMax)
durationTheta = clamp(Trel/T, 0.02, 0.3)
theta = frac(phi)
pulse = raisedCosinePulse(theta, thetaOn, durationTheta, T)

dc/dt = -(c - cDia)/tauCa + Arel * pulse
aInf = c^n / (c^n + Kd^n)
da/dt = (aInf - a)/tauA
```

For atria, activation must precede ventricular activation by a PR-interval-like lead:

```text
atrialLeadSec ~= 0.12 to 0.16 s
thetaOn_atrium = frac(1 - atrialLeadSec / T)
```

At HR 75:

```text
T = 0.8 s
thetaOn(160 ms lead) = 1 - 0.16/0.8 = 0.80
thetaOn(120 ms lead) = 1 - 0.12/0.8 = 0.85
```

The current elastance atria already encode this HR-aware idea:

```text
tauA = frac(theta + 0.16/T) * T
```

Therefore, active-stress atria should not use a fixed dimensionless `thetaOn` as the final design if
HR is variable. Add an atrial lead in seconds, or derive effective `thetaOn` from HR at runtime.

Standalone chamber-law prototype, not closed-loop:

```text
Candidate geometry: LA V0 5, Vref 45, Veff 40, wall 2.5 mm, geomChi 1.121
Fixed total LA volume 45 mL, thetaOn 0.80 unless noted
```

| Tmax0 | Arel0 | Ca scale | lead | pMean | pMax | aMax | peak theta |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 kPa | 0.12 | 1 | 160 ms | 0.29 | 0.86 | .036 | .9275 |
| 20 kPa | 0.12 | 1 | 160 ms | 0.40 | 1.54 | .036 | .9275 |
| 40 kPa | 0.12 | 1 | 160 ms | 0.62 | 2.90 | .036 | .9275 |
| 40 kPa | 0.30 | 1 | 160 ms | 4.16 | 22.83 | .303 | .9375 |
| 40 kPa | 0.30 | 2 | 160 ms | 10.16 | 47.27 | .629 | .9612 |
| 60 kPa | 0.30 | 2 | 160 ms | 15.15 | 70.82 | .629 | .9612 |
| 20 kPa | 0.12 | 1 | 200 ms | 0.40 | 1.54 | .036 | .8775 |
| 20 kPa | 0.12 | 1 | 120 ms | 0.40 | 1.54 | .036 | .9775 |

This brackets the implementation risk:

- A naive ventricular-style Ca release scaled down to atrial Tmax is too weak.
- Stronger atrial Ca release can create a large a-wave, but can overshoot badly.
- The active model has enough dynamic range; it needs atrial-specific calibration, not a copy of
  ventricular active parameters.
- The pressure peak lags `thetaOn` because Ca/activation dynamics are not instantaneous. For
  a-wave timing, the lead may need to start earlier than the desired pressure peak.

### B7.1. Explicit initial atrial active-stress targets for implementation scaffolding

These are **implementation starting targets**, not final calibrated physiology. They are intended to
let the engine scaffolding compile/run and give the calibration branch a sane search box. Final values
must be re-fit against the TBV 5600 gates after the circuit distribution pass.

Geometry targets are code-derived from thin-wall assumptions:

```text
LA: Veff_ref = Vref - V0 = 40 mL, wall thickness ~= 2.5 mm
RA: Veff_ref = Vref - V0 = 50 mL, wall thickness ~= 2.5 mm
```

| Param | LA initial target | RA initial target | Rationale |
|---|---:|---:|---|
| `V0` | 5 mL | 5 mL | preserve current elastance dead volume for continuity |
| `Vref` | 45 mL | 55 mL | current mean LA/RA volumes are ~34/38 mL; reference above mean, near target filled atria |
| `Vw` | 15.9 mL | 18.2 mL | equivalent wall volume for ~2.5 mm wall at Veff 40/50 |
| `geomChi` | 1.121 | 1.112 | thick-sphere factor for those thin-wall geometries |
| `sigmaPas0` | 80 Pa | 60-80 Pa | safe low passive scale; avoid mean-LAP hack by passive stiffness |
| `bPas` | 8 | 8 | gentle atrial passive limb for initial branch |
| `lambdaPas0` | 0.90 | 0.90 | keeps passive stress low around reference |
| `Tmax0` | 20 kPa initial, sweep 10-40 kPa | 15 kPa initial, sweep 8-30 kPa | prototype suggests 20 kPa with stronger atrial Ca release is near useful a-wave range; RA lower |
| `Arel0` | 0.30 | 0.25-0.30 | ventricular default 0.12 was too weak for atrial prototype |
| `tauCa0` | 0.08 s | 0.08 s | shorter atrial Ca transient than LV default 0.18 |
| `Trel0` | 0.09 s | 0.09 s | atrial systole duration scale; clamp around 60-120 ms |
| `thetaOn` | derived from `atrialLeadSec` | derived from `atrialLeadSec` | do not hard-code final dimensionless theta for variable HR |
| `atrialLeadSec` | 0.16 s initial, sweep 0.12-0.18 | 0.16 s initial, sweep 0.12-0.18 | atrial pressure peak should occur before ventricular onset |

If the implementation cannot add `atrialLeadSec` immediately, use the HR75-compatible static
starting point:

```text
thetaOn_LA = thetaOn_RA = 0.80   // 160 ms before ventricular theta=0 at HR 75
```

but treat that as a temporary scaffold. The HR-aware version should compute:

```text
T = 60 / HR
thetaOn_atrium = frac(1 - atrialLeadSec / T)
```

Candidate `defaultActiveLA` scaffold:

```ts
export const defaultActiveLA: ActiveChamberParams = {
  ...defaultActiveLV,
  V0: 5,
  Vw: 15.9,
  Vref: 45,
  Vmin: 1,
  Trel0: 0.09,
  TrelMin: 0.06,
  TrelMax: 0.12,
  tauCa0: 0.08,
  Arel0: 0.30,
  sigmaPas0: 80,
  bPas: 8,
  lambdaPas0: 0.90,
  Tmax0: 20000,
  geomChi: 1.121,
  thetaOn: 0.80, // temporary until atrialLeadSec is implemented
};
```

Candidate `defaultActiveRA` scaffold:

```ts
export const defaultActiveRA: ActiveChamberParams = {
  ...defaultActiveLA,
  Vref: 55,
  Vw: 18.2,
  Tmax0: 15000,
  geomChi: 1.112,
};
```

Expected calibration behavior:

- If a-wave is too small, increase `Arel0`, `caReleaseScale`, or `Tmax0`; do not first stiffen
  passive `bPas`.
- If a-wave is too tall/narrow, lower `Arel0/Tmax0` or lengthen/shift timing.
- If mean LAP remains low with good a-wave morphology, fix distribution/terminal resistance first;
  do not use atrial passive stiffness as the primary mean-pressure lever.
- If RAP overshoots, reduce central-volume shift or RA active/passive scale before lowering LA target.

### B8. Engine migration surface

Current active-stress support is hard-coded for LV/RV:

- `StateIndex` has only `cLV/aLV/cRV/aRV`.
- `activeModels` is `Record<"LV" | "RV", ActiveStressChamberModel>`.
- `reset()` initializes only LV/RV active internals.
- `setImmediateParameters()` rebuilds active models only when `n.chamber` is LV or RV.
- `rhs()` advances only LV/RV internal derivatives.
- `computePressures()` casts `heartActive` chamber to `"LV" | "RV"` and routes non-LV internals
  through RV slots; LA/RA active nodes would break.
- `chamberCtx()` is binary LV vs not-LV, so LA/RA would inherit RV scales.
- `SimSample` exposes `aLV/aRV` only.

Required migration:

1. Generalize active internal state slots to every active chamber.
   Prefer a generated mapping `activeInternal[chamber] -> { cIndex, aIndex }` over adding more
   hard-coded fields.
2. Expand `activeModels` to `Partial<Record<Chamber, ActiveStressChamberModel>>`.
3. Rebuild active models for any `heartActive` node with `active` params.
4. In `rhs()`, iterate active heart nodes and write `cDot/aDot` to that chamber's state slots.
5. In `computePressures()`, read the matching chamber's internal state and model.
6. Replace binary `chamberCtx()` with chamber-specific scales or keep LA/RA scales internal to
   `node.active` until a UI/API need exists.
7. Add `defaultActiveLA/defaultActiveRA`, including:
   - atrial wall volumes and thin-wall `geomChi`;
   - atrial passive EDPVR targets;
   - atrial active ceiling and Ca release tuned to a-wave size;
   - HR-aware atrial lead timing.
8. Extend observability only if needed: `aLA/aRA`, PVF `Q_PVein_LA`, and `Q_VC_RA` are useful
   diagnostics for the figure-8 atrial PV loop work.

### B9. Recommendation

Use approach C: both circuit co-tune and active-stress atria, staged.

The math does not support a pure circuit-only solution for the full target:

- Moving systemic unstressed volume centrally is the dominant way to reach EDV 110-120 and CO ~5.
- It leaves LAP only ~4-6 and gradient near 0 to +1.
- LA passive stiffening can raise LAP, but it creates excessive a-wave/pressure peaks and lowers CO.
- Pulmonary `Vu` increase is opposite-sign for preload at fixed TBV.
- `PVein_LA.R` reduction fixes only part of the terminal pressure drop.

Active-stress atria alone are also insufficient:

- They can shape a-wave/c-wave and atrial kick.
- They cannot create the missing central volume or raise pulmonary venous pressure relative to VC by
  the required ~5 mmHg.

Recommended staged design:

1. Circuit distribution pass:
   - mobilize systemic unstressed volume/venous reservoir toward central/pulmonary side;
   - modestly reduce `PVein_LA.R` if the human accepts lower pulmonary venous terminal resistance;
   - avoid increasing pulmonary `Vu` as a preload fix.
2. Active atria migration:
   - migrate LA/RA to active-stress with HR-aware pre-ventricular activation;
   - calibrate atrial passive and active parameters to produce physiological a/c waves without using
     passive stiffness as a blunt mean-LAP hack.
3. Calibration gate:
   - TBV 5600, 0 clamps;
   - EDV 110-120, CO near 5;
   - RAP 2-6 and LAP above RAP by a clear positive gradient;
   - LA/RA PV loops non-degenerate and figure-8-like after chart scaling/observability lands.

## Phase-2b structural design [codex1]

This is the engine-side design for the pressure/source half of the structural fix. It deliberately
does not tune LA passive stiffness as a mean-LAP lever. The goal is to let the pulmonary venous side
hold its own stressed volume and pressure so `PVein` can sit roughly 5-6 mmHg above the caval side at
CO ~5 L/min, while total TBV remains exactly conserved.

### Problem to fix

The current TBV projector is global:

```ts
initializeVenousPressuresForTargetTBV(targetTBV) {
  projectVenousPressuresToTargetTBV(targetTBV);
}
```

`projectVenousPressuresToTargetTBV()` applies one pressure offset to every `venousPressure` node
(`SV`, `VC`, `PCap`, `PVen`, `PVein`). Because the systemic reservoir is much larger and more
compliant, it dominates the closed-loop solution. The pulmonary venous pressure therefore follows the
systemic/caval pressure instead of being allocated a separate left-sided filling pressure.

That explains the Phase-2 sweep failure:

- soft LA passive law: LAP can reach ~9, but LA balloons to ~200 mL;
- Klotz-style normal-volume LA: LAV becomes plausible, but mean LAP falls to ~3-4;
- `PVein_LA.R` and pulmonary `Vu` tweaks alone move LAP only modestly;
- lowering LV contractility can raise LAP/gradient, but it breaks AoP/CO/EF.

The missing source term is not blood creation. It is allocation of stressed blood volume between the
systemic venous reservoir and the pulmonary venous/central-left reservoir.

### Minimal engine change

Refactor the projector into a split venous projector.

1. Keep the existing `venousPressure` node model.
2. Add a generic helper:

```ts
projectVenousGroupToVolume(nodes: NodeSpec[], targetVolume: number): void
```

The helper solves the same scalar offset problem as the current projector, but over only a provided
node group. It should use the existing `effectiveVu()` and `venousStressedVolume()` functions, and it
should clamp each group's pressure states to the same `[-20, 45]` safe range.

3. Replace `projectVenousPressuresToTargetTBV(targetTBV)` with:

```ts
projectVenousPressuresToTargets(expectedTBV) {
  const pulmonaryNodes = [PCap, PVen, PVein];
  const systemicNodes = [SV, VC];

  const nonProjectedVolume = totalBloodVolume(excluding venousPressure nodes);
  const pulmonaryTarget = p.pulmonaryVenousTargetVolumeMl;
  const systemicTarget = expectedTBV - nonProjectedVolume - pulmonaryTarget;

  projectVenousGroupToVolume(pulmonaryNodes, pulmonaryTarget);
  projectVenousGroupToVolume(systemicNodes, systemicTarget);
}
```

4. Use it in both places that currently call the global projector:

- `initializeVenousPressuresForTargetTBV(targetTBV)`;
- the post-step `if (this.p.projectTBV)` projection path.

5. If `pulmonaryVenousTargetVolumeMl <= 0`, preserve the old global-projector behavior. This gives a
behavior-neutral default until Phase-2b enables the split mode.

### Parameters

Add one explicit structural parameter first:

```ts
pulmonaryVenousTargetVolumeMl: number
```

Recommended default for behavior-neutral migration: `0` means disabled.

Recommended Phase-2b starting value: `500` mL for `PCap + PVen + PVein`, with an allowed calibration
range around `450-560` mL. This is the realized pulmonary venous-side volume target, not extra TBV and
not simply a `Vu` increase.

Then recalibrate the pulmonary venous compliance by node spec, not by a UI knob:

- current effective open compliances are very soft: `PCap.Copen 22`, `PVen.Copen 28`,
  `PVein.Copen 40` mL/mmHg, aggregate ~90 mL/mmHg before the high-pressure stiffening term;
- target aggregate compliance around the normal operating range should be much lower, roughly
  `18-22` mL/mmHg for `PCap + PVen + PVein`;
- a practical first split is `PCap.Copen ~6-8`, `PVen.Copen ~5-6`, `PVein.Copen ~6-8`
  mL/mmHg, with `Cdist` kept below `Copen` and `Pstiff` around the low-teens as today.

This corresponds to a terminal pulmonary venous compliance on the order of the literature target in
§A5 while still leaving a capillary cushion. It is intentionally a large stiffening versus the current
node specs.

Keep `PVein_LA.R` as a secondary calibration lever. It can be modestly lowered, but it cannot replace
the split allocation because at CO ~5 its whole pressure-drop budget is only about 1 mmHg at the
current value.

### Rough numeric target

At CO 5 L/min:

```text
Q = 5000 / 60 = 83 mL/s
PVein_LA.R = 0.012
PVein - LAP = Q * R ~= 1.0 mmHg
```

So for LAP 10 mmHg:

```text
PVein ~= 11.0 mmHg
PVen  ~= 11.8 mmHg  (adds PVen_PVein.R 0.01)
PCap  ~= 14.3 mmHg  (adds PCap_PVen.R 0.03)
```

If RAP/VC is ~4-5 mmHg, this is the needed `PVein` elevation of roughly +5-6 mmHg over the caval side.

With `PCap + PVen + PVein` unstressed volume still near 270 mL, a 500 mL target means about 230 mL of
pulmonary venous-side stressed volume. Around an 11-13 mmHg operating pressure, that implies effective
aggregate compliance near:

```text
230 mL / 12 mmHg ~= 19 mL/mmHg
```

That is the design reason for a target volume around 500 mL plus aggregate compliance around
18-22 mL/mmHg.

### TBV conservation and mass balance

This design keeps TBV conserved the same way the current projector does: after every integration step,
the algebraic projector solves pressure offsets so that computed blood volume equals `expectedTBV`.
The difference is only that the pulmonary and systemic venous groups get separate offsets and explicit
volume targets.

The invariant is:

```text
expectedTBV
  = nonProjectedVolume
  + pulmonaryProjectedVolume
  + systemicProjectedVolume
```

Hemorrhage and fluid still update only `expectedTBV`. If `expectedTBV` changes, the systemic target
absorbs the remainder after the pulmonary target is satisfied. If the pulmonary target is unreachable
inside pressure clamps, the projector should clamp to the nearest reachable pulmonary volume and put
the residual into the systemic group, while health should report a warning such as
`pulmonary venous target unreachable`.

This preserves the ODE mass balance contract: flows still move volume between nodes, and the projector
remains the existing algebraic TBV constraint rather than a hidden source/sink.

### Implementation notes and tests

Implementation surface:

- `CoreRuntimeParams`, `NEUTRAL_PARAMS`, `CORE_NUMERIC_KEYS`, `HARD_CLAMP`:
  add `pulmonaryVenousTargetVolumeMl`, hard-clamped to `[0, 900]`;
- `defaultParams()`:
  default `pulmonaryVenousTargetVolumeMl: 0`;
- `ModelCore.projectVenousPressuresToTargetTBV()`:
  refactor into split/group projection helpers;
- `initializeVenousPressuresForTargetTBV()` and post-step projection:
  route through the new split-aware projector;
- `debugObservables()` / metrics diagnostics:
  expose `pulmonaryVenousVolume` and ideally `P_PVein - P_VC`.

Tests:

1. default `pulmonaryVenousTargetVolumeMl: 0` is behavior-neutral versus the current projector;
2. with split mode enabled, total TBV remains within the existing mass-conservation tolerance;
3. increasing `pulmonaryVenousTargetVolumeMl` raises `P_PVein - P_VC` monotonically at fixed TBV;
4. the Phase-2b target lands near `PVein ~11`, RAP 2-6, 0 clamps, before active-atria morphology tuning;
5. unreachable target values warn rather than silently pushing node pressures into clamps.

Expected calibration order:

1. enable split projector with pulmonary target around 500 mL;
2. stiffen `PCap/PVen/PVein` compliance to the aggregate 18-22 mL/mmHg range;
3. modestly retune `PVein_LA.R` only after `PVein - VC` is in the right range;
4. hand off to the reservoir mechanism pass for `v > a`, figure-8 loop area, and LAEF/booster final tuning.

### #2 LA reservoir physics/model [codex1]

This is the engine-side physics design for the LA reservoir half of Phase-2b. The physiology/citation
part is intentionally left as a separate claude1 subsection. The modeling claim here is narrow:
atrial active stress can tune the booster pump, but it should not be asked to create the whole
late-systolic reservoir `v` wave. The missing mechanical coordinate is AV-plane / mitral-annulus
descent during ventricular systole.

During LV systole, longitudinal shortening pulls the mitral annulus toward the apex. In a lumped LA
model this is equivalent to increasing LA reservoir capacity while the mitral valve is closed. That
temporary capacity increase lowers LA pressure at the same blood volume, draws pulmonary venous
return into the LA, and stores mechanical displacement. When annular descent relaxes in late systole
or isovolumic relaxation, while the mitral valve is still mostly closed, the same physical LA blood
volume is presented to a smaller mechanical capacity. That raises the `v` wave without increasing the
atrial contraction `a` wave by the same amount.

The minimal lumped term is an LA-only reservoir displacement state:

```text
r_LA(t) >= 0                       mechanical capacity displacement, mL
V_LA_eff = max(V_LA - r_LA, Vmin)  volume used by the LA wall-stress law
P_LA = P_active_stress(V_LA_eff, c_LA, a_LA, ctx)
```

`r_LA` is not blood volume. It must not be added to or removed from the LA state, TBV, or any venous
node. It is an AV-plane-driven change in the pressure-volume relation, equivalent to a transient
increase in LA unstressed/capacitance volume.

Use a first-order state rather than a purely algebraic `r_LA = f(LV volume)` term, because the target
observable is a phase-loop morphology problem. The state gives the LA pressure-volume loop hysteresis
needed for a figure-8 / reservoir loop instead of a single-valued passive curve:

```text
theta = frac(phi)
lvShortening01 = clamp((LV_ED_ref - V_LV) / max(LV_SV_ref, 1), 0, 1)
descentTarget = reservoirStrokeMl * lvShortening01 * systolicGate(theta)

tau = descentTarget > r_LA ? reservoirTauFillSec : reservoirTauRecoilSec
dr_LA/dt = (descentTarget - r_LA) / tau
```

The practical gate should fill early/mid systole, hold through reservoir filling, then release before
or around mitral opening:

```text
systolicGate(theta) ~= 1 during LV ejection
systolicGate(theta) decays toward 0 during late systole / IVR
```

If the engine surface can provide valve state cleanly, prefer a gate that uses `mitralOpen01` from
the existing valve state so recoil is mostly complete when MV opens. If that coupling is too invasive
for the first pass, phase-based release with a `reservoirReleaseTheta` parameter is acceptable and
keeps the chamber model decoupled from the valve solver.

Recommended starting parameters for LA only:

```ts
reservoirStrokeMl: 15,        // calibration range 10-20
reservoirTauFillSec: 0.10,    // range 0.08-0.12
reservoirTauRecoilSec: 0.15,  // range 0.12-0.18
reservoirReleaseTheta: 0.55,  // tune against MV opening / late systole
reservoirCoupling: 1.0,
```

Expected magnitude:

```text
Delta P_v ~= E_LA,closed * Delta r_release
```

At the Phase-2b target LAV range 50-55 mL, use the local closed-mitral LA slope from the active-stress
model after the pulmonary preload split is enabled. A useful first target is `E_LA,closed ~0.3-0.5`
mmHg/mL. Then a late-systolic recoil of 10-12 mL produces:

```text
0.4 mmHg/mL * 12 mL ~= 4.8 mmHg
```

That is the right order to move the current low `v` wave to `v > a` without making atrial active
stress so large that booster stroke or `a` wave dominates. The full 10-20 mL reservoir stroke should
show up primarily as pulmonary venous reservoir filling and LA loop area; only the released part before
MV opening should appear as the extra `v` pressure.

Implementation surface:

- `ChamberCtx`:
  add LV-to-LA coupling inputs used only by the LA reservoir model:
  `lvVolumeMl`, `lvShortening01`, and optionally `mitralOpen01` or `ventricularSystole01`.
- `ModelCore.chamberCtx("LA", x)`:
  compute `lvShortening01` from the current LV volume and a beat-level or fixed reference, e.g.
  `clamp((LV_ED_ref - V_LV) / max(LV_SV_ref, 1), 0, 1)`. A fixed first pass can use ED/SV references
  near the normal target; a better pass updates ED/ES references beat-wise.
- `ActiveChamberParams`:
  add optional reservoir parameters, defaulting to zero/disabled. With `reservoirStrokeMl <= 0`, the
  pressure result must be identical to the current active-stress model.
- `ChamberInternal` and active state indexing:
  add an `r` state for active chambers, or an optional `r` index for chambers with reservoir params.
  The simpler, safer integrator change is to reserve `r` for every active chamber and keep it clamped
  at zero unless the chamber is LA and `reservoirStrokeMl > 0`.
- `ActiveStressChamberModel.pressure()`:
  for LA reservoir mode only, evaluate passive and active wall stress at `V_LA_eff = V_LA - r_LA`.
  Do not alter `V_LA` itself.
- `ActiveStressChamberModel.internalDerivatives()`:
  return `rDot` from the first-order target above, alongside the existing Ca/activation derivatives.

Mass and energy consistency:

- Mass is conserved because flows still integrate only the physical LA blood volume state:
  `dV_LA/dt = Q_PVein_LA - Q_MV`. `r_LA` never appears in that mass equation.
- TBV is conserved because `totalBloodVolume()` should continue to count the physical `V_LA`, not
  `V_LA_eff`.
- The extra work is mechanical work from LV longitudinal shortening / AV-plane motion. In the first
  implementation it is a one-way prescribed coupling from LV kinematics to LA mechanics, not a blood
  source and not a hidden pressure offset.
- If a future stricter energy audit is needed, account for the external work term roughly as
  `P_LA * dr_LA/dt` against the ventricular longitudinal-work budget. That should not block the first
  pass as long as stroke is kept in the 10-20 mL range and default behavior remains disabled.

Tests and calibration checks:

1. With all reservoir parameters zero, active-stress chamber pressures and the settled baseline are
   behavior-neutral.
2. `r_LA` remains finite and clamped in `[0, reservoirStrokeMl]` with no node clamps.
3. Increasing `reservoirStrokeMl` at fixed atrial active params increases pulmonary venous systolic
   inflow, LA reservoir loop area, and `v/a` ratio monotonically over the practical range.
4. Increasing atrial `Tmax0` / `Arel0` at fixed reservoir stroke primarily changes `a` wave and booster
   stroke, not the late-systolic reservoir mechanism.
5. TBV and LA physical volume accounting are unchanged by `r_LA`; only pressure and therefore flows
   respond to the reservoir coordinate.
6. Phase-2b acceptance target after split preload plus reservoir: LAV max 50-55 mL, reservoir stroke
   10-20 mL, `v` about 4-6 mmHg above the current scalar-active result and preferably `v > a`, without
   sacrificing AoP/CO/EF or introducing clamps.

### Phase-2b #1 — Pulmonary-venous pressure: what holds the LA-RAP gradient [physiology, claude1]

Normal pulmonary venous pressure = LA filling pressure ~ PCWP **8-12 mmHg**, sitting **~+5-6 above
caval/RAP 2-6**. Two things hold it: (i) the LEFT heart fills at higher pressure than the right — the
LV is stiffer than the RV, so LV-EDP 8-12 > RV-EDP 2-6, and each atrium reflects its ventricle's
filling pressure; (ii) the pulmonary-venous compartment is STIFFER and SMALLER than the systemic venous
reservoir, so it pressurizes to 8-12 while the high-compliance systemic veins sit at 2-6.

Split-allocation targets: pulmonary blood volume **~450-560 mL (~10% of TBV)** [MESA; Guyton] =
arterial ~1/3, capillary ~1/6, **venous ~45-50% → pulmonary-venous volume ~200-280 mL**.
Pulmonary-venous compliance **~7-15 mL/mmHg** [Reuben PMID 7452896] vs systemic venous ≫100 — this
asymmetry holds ~200-280 mL at mean 8-12 while systemic stays 2-6. Gate: PVein mean 8-12 delivered to
the LA with a small PVein→LA drop, RAP 2-6 (Final gradient +3-6).

### Phase-2b #2 — LA reservoir mechanism (v-wave / figure-8): AV-plane descent [physiology, claude1]

MECHANISM CONFIRMED: the LA reservoir v-wave is driven PRIMARILY by **AV-plane (mitral-annulus)
DESCENT** in ventricular systole, NOT mainly LA wall relaxation. LV longitudinal shortening pulls the
AV-plane toward the LV apex → expands the LA → aspirates pulmonary venous return = reservoir filling +
v-wave. LA wall relaxation is a SECONDARY (early-reservoir) term.

- Evidence: AVPD is the major contributor to LV pumping — the heart as a "piston unit", AVPD ~60-70% of
  SV [Carlsson & Arheden, Am J Physiol Heart Circ Physiol 2007, PMID 17098822]; ventricular contraction
  aspirates ~70% of SV from pulmonary+caval veins, independent of HR/heart size [Steding-Ehrenborg].
  LV long-axis shortening is the DOMINANT determinant of LA reservoir strain via AV-plane descent
  [EHJCI 2022]. "LA relaxation + LV systolic function determine LA reservoir function"
  [Barbier, Circulation 1999;100:427] — relaxation = early-reservoir, LV systole/base-descent = dominant.
- WHY THE MODEL FAILS (structural gap): the lumped LA is FIXED-POSITION — no base descent. Its only
  systolic filling is passive distension + active relaxation, so a booster strong enough for LAEF 45-65%
  overpowers the small passive v-wave → v<a + collapsed reservoir loop. The missing physics is the
  AV-plane reservoir drive.
- v>a BASIS: reservoir is the LARGEST atrial phase (reservoir/conduit/booster ~40/35/25 [PMC4200839]);
  v-wave = peak reservoir filling at end-systole (max LA volume), a-wave = booster. v>a because reservoir
  volume > booster volume, with pulmonary venous return under higher pressure.
- TARGETS for the base-descent reservoir term (codex1's `r_LA` model): DRIVEN by LV systolic longitudinal
  shortening/ejection (AVPD-coupled), active during ventricular systole, INDEPENDENT of the booster.
  v-wave exceeds a-wave by **+4-6 mmHg** (v ~12-15, a ~8-10); **reservoir stroke ~15-20 mL**. Yields the
  figure-8 reservoir-dominant loop (gate 2.13), LAEF 45-65%, booster 20-30%, LAP 8-12.
- Refs: Carlsson & Arheden 2007 PMID 17098822; Steding-Ehrenborg (piston/aspiration); Barbier
  Circulation 1999;100:427; EHJCI 2022 (reservoir strain determinants); PMC4200839 (LA triad);
  Reuben PMID 7452896 (pulm-venous compliance); MESA/Guyton (pulm blood vol).
