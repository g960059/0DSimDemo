# Atrial + pulmonary-split validity review (Phase-2 working state)

**How we investigated the physical / physiological / literature validity** of the current
Phase-2 atrial-active-stress + physical pulmonary-venous-split parameters, with the calculations,
unit conversions, and cited targets. Companion to [`m12-la-preload-design.md`](./m12-la-preload-design.md)
(design) and the validity navigator in [`README.md`](./README.md).

> ⚠️ **Honest status — most of the current atrial values are SCAFFOLDING being undone, not landed
> physiology.** The atrium currently holds ~50 mL by a *too-stiff passive law* + a *suppressed active
> a-wave* — both backwards — because the reservoir (AV-plane) drive of `m12-la-preload-design.md`
> §Phase-2b is not yet in. This doc records the current values, the calc that judges them, and the
> **migration-target physiological values + citations** so the reparam lands on physiology, not the hack.

**Primary sources** (agmsg, team 0dsim1): claude1 *INDEPENDENT PHYSIO/PHYSICS VALIDITY REVIEW* +
*AV-DELAY code+value* (this doc); codex2 *[REVIEW] physical-split* + *[REVIEW-ADDENDUM] AV delay*
— now **INTEGRATED here (two-party converged)**: both reviews independently produced the same
non-physiology list and the same reparam direction; codex2's quantitative tables + cites are merged
below, tagged **[codex2]**. Real refs only; numbers are **code-verified** or **two-party
cross-checked** (no fabricated WU/citation values).

**Current parameter snapshot (TBV 5600, converged):**
- LV (committed): sigmaPas0 200.1, bPas 23.2, lambdaPas0 0.9025, Tmax0 135000 Pa, geomChi 1.3596.
- LA active: Arel0 0.04, Tmax0 3000 Pa, sigmaPas0 2000, bPas 14, lambdaPas0 0.90, Vref 45, V0 5, Vw 15.9, geomChi 1.121, atrialLeadSec 0.16 s.
- RA active: Arel0 0.10, Tmax0 8000 Pa, sigmaPas0 210, bPas 19, Vref 35, Vw 18.2, geomChi 1.112.
- Pulmonary-venous (physical split, no projector): PCap/PVen/PVein Vu = 105/160/215 mL; Copen-class C ≈ 2.4/4.8/2.4; PVein_LA.R = 0.07.
- Behaviour: COdiff structurally 0, LA vol 52/35, RA 43/35, PV vol ~11 % TBV, PVein−VC +2.5, LAP/RAP/grad 7.7/5.7/1.8, EF_R ~0.39, 0 clamps.

---

## 0. Methodology — how each parameter was judged

**(M1) Effective chamber passive stiffness.** The passive pressure is
`Ptm = geomChi·(2h/rm)·σ_pas`, so the *chamber-level* passive scale is `sigmaPas0 × G`, with the
**geometric pressure gain** `G = geomChi·(2h/rm)`. From the reference geometries:
- LV: G = 1.3596 · 0.5694 = **0.774** → effective scale 200 · 0.774 = **155**.
- LA: G = 1.121 · 0.22 = **0.247** → effective scale 2000 · 0.247 = **494**.
- (RA: G = 1.112 · ~0.22 ≈ 0.245 → 210 · 0.245 ≈ **51**.)
So the *effective* LA passive stiffness is **494 vs the LV's 155 = ~3.2× stiffer** — the headline of §1.1.

**(M2) Wood-unit conversion (code-verified).** `solveQuadraticFlow(dP,R,B)` returns `dP/R` for B≈0
(`engine/math.ts` L28), flows integrate to mL and CO is reported in L/min ⇒ **Q is in mL/s, R in
mmHg·s/mL**. 1 WU = 1 mmHg/(L/min); 1 L/min = 1000/60 = **16.667 mL/s**; so
**R[mmHg·s/mL] × 16.667 = WU** (NOT ×60). PVein_LA.R 0.07 → 0.07·16.667 = **1.17 WU** (matches codex2).

**(M3) EDPVR / a-wave evaluation** uses the §M1 chamber-scale and the operating volume swing vs Vref
(λ = rm(V)/rmRef) to see whether volume is held by a *stiff wall* (scaffolding) or by an *active/reservoir
drive* (physiology). **(M4) Literature comparison**: every target carries a real cite; every computed
number is code-verified or cross-checked with codex2.

---

## 1. Per-parameter-group verdicts

### 1.1 LA passive — `sigmaPas0 2000`, `bPas 14`, `lambdaPas0 0.90`
- **(a) Eval:** effective stiffness `sigmaPas0·G_LA` = 2000·0.247 = **494** vs LV 200·0.774 = **155**
  → the LA chamber is **~3.2× stiffer than the LV** passively. With `bPas 14` and the operating swing
  crossing Vref 45 (LAVmax 52 > Vref → onto the steep exp), the stiff wall **caps** LA volume at ~52.
- **(b) Verdict: SCAFFOLDING (volume-capping hack).** The LA is a *compliant reservoir* — it should be
  **softer** than the LV, not 3× stiffer. Capping volume by passive stiffness is the tell-tale of the
  missing reservoir (AV-plane) drive.
- **(c) Target:** soften to `sigmaPas0 ~300–600` (LA effective stiffness ≤ LV), a compliant LA EDPVR
  (LA accommodates ~25→55 mL over LAP ~2→12). No standardised atrial Klotz exists; the LA is a
  high-compliance chamber [LA reservoir/conduit/booster, PMC4200839]. Volume should be held by the
  **reservoir + booster**, not the wall.
- **[codex2] confirmation:** passive-only Ptm ≈ **1.8 / 6.0 / 11.5 / 18.8 / 22.4 mmHg at 35 / 40 / 45 /
  50 / 52 mL** — the 52/35 mL loop rides the steep passive limb; `sigmaPas0 2000` is 10× LV/RA = a
  *numerical volume clamp masquerading as an LA EDPVR*. The 52 mL **size** is normal (LAVI upper-normal
  <34 mL/m² [BSE, *Echo Res Pract*; PMID 32105051]); it is the *pressure cost* that is excessive. Fit
  the LA passive to a **target curve** (~2–4 @35 / 4–7 @45 / <10–12 @52 mL) → sigmaPas0 ~200–600.

### 1.2 LA active — `Tmax0 3000 Pa`, `Arel0 0.04`
- **(a) Eval:** Tmax0 3000 = **~1/45 of LV (135000)**, and `Arel0 0.04` is **down from the 0.30**
  prototype/scaffold → the Ca-driven a-wave is essentially gone; the "a-wave" is **passive end-filling**.
  Note also LA Tmax0 3000 < **RA 8000** — inverted (the LA a-wave should be the *larger* one).
- **(b) Verdict: SCAFFOLDING (booster suppressed).** Loses the atrial kick (**20–30 % of LV filling**
  [StatPearls *Atrial Kick* NBK482421]) and is the root of the too-short a→LV timing (§1.5).
- **(c) Target:** restore `Tmax0 ~15000–40000 Pa` and `Arel0 ~0.2–0.3`. Atrial active is *weaker* than
  ventricular but ~**1/4–1/3**, not 1/45: lumped-model LA Emax ≈ 1/4–1/5 of LV (≈0.5–0.6 vs 2–3 mmHg/mL)
  [Shi/Ursino-class; Hoit 1994 LA time-varying elastance], the thin wall (small `2h/rm`) supplying the
  rest of the LA<LV pressure. **Restore only after the §Phase-2b reservoir lands**, so v>a comes from the
  reservoir dominating — not from killing the booster.
- **[codex2] tissue basis + reconciliation:** ventricular myocardium develops only **+30–50 % tension
  over atrial** (atrial ≈ 0.67–0.77× at the *fibre* level), with *faster* atrial kinetics
  [Walklate, PMC8629898] — so 1/45 is an organ-level fudge, not a tissue ratio. The **fibre** ratio
  (~0.7×) refutes 3 kPa as absurdly low; the **chamber-calibrated** Tmax0 to produce the +3–6 mmHg
  a-wave (thin wall + sub-maximal operating activation) lands at **~15–40 kPa** — both reviews converge.
  (At V=50, a=0.5, even Tmax 3000→15000 stays passive-dominated — the *decomposition*, not the volume
  target, is the problem.)

### 1.3 RA — `sigmaPas0 210`, `Tmax0 8000`, `bPas 19`
- **(a) Eval:** effective passive `210·0.245 ≈ 51` — **soft, the right direction** (RA more compliant).
  Tmax0 8000 = 8 kPa active.
- **(b) Verdict: passive PHYSIOLOGICAL (soft); active weak-ish but less wrong than LA.**
- **(c) Target:** keep the soft passive; a modest Tmax0 bump for a credible CVP a-wave once the reservoir
  scheme is in. (RA active normally ≤ LA active in pressure terms; currently inverted vs LA — fix by
  restoring LA, §1.2.)

### 1.4 Pulmonary-venous split — `Vu 105/160/215`, `C 2.4/4.8/2.4`, `PVein_LA.R 0.07`
- **(a) Eval:** pulmonary-venous Vu (PVen+PVein) = **375 mL**; PV total ~11 % TBV (~616 mL). Per-node
  Copen-class ~4.8 (×3 ≈ **14 total** mL/mmHg). PVein_LA.R 0.07 = **1.17 WU** (code-verified, M2).
- **(b) Verdict: compliance OK; PVein_LA.R NON-PHYSIOLOGICAL-HIGH; venous Vu a bit high.** Total normal
  PVR is ~1 WU (<3 WU) — so **1.17 WU in the single PVein→LA terminal segment is ~the whole normal PVR**,
  in a segment that physiologically is near-zero resistance. Looks like a reservoir-pressure hack.
- **(c) Targets:** pulmonary blood volume ~**10 % TBV (450–560 mL)** [MESA 547±180; Guyton ~9 %], venous
  portion ~**200–280 mL** (so trim Vu from 375); pulmonary-venous compliance **~7–15 mL/mmHg** [Reuben]
  — current ~14 is fine; **PVein_LA.R → ~0.01–0.02** (≈0.17–0.33 WU, near-zero terminal).
- **[codex2] cites:** normal pulmonary blood volume ~**450 mL (~9 %)** [StatPearls NBK525948];
  pulmonary-venous compliance **7–15 mL/mmHg** [Hirakawa 1981, *Jpn Circ J*]; normal **total** PVR
  **0.25–1.6 WU** [StatPearls NBK554380] — so PVein_LA.R = 1.17 WU is *most of the entire normal
  pulmonary resistance in one ostial segment* = a numerical preload-shaper, not a physical ostium.
  Fix: lower PVein_LA.R, **or** allocate a pulmonary **resistance budget** across PArt_PCap / PCap_PVen /
  PVen_PVein / PVein_LA explicitly. (Vu split is also lumped venous/cap — separate them.)

### 1.5 AV-delay — `atrialLeadSec 0.16 s` (code + value, 3/3)
- **(1) Code — NO BUG.** `thetaOnEff = frac(1 − leadSec/T)`: at T=0.8, leadSec 0.16 → 0.80 = onset
  0.20 cycle (160 ms) before ventricular θ=0 — correct lead. `raisedCosinePulse` time-integral per beat
  = (1/dur)·dur = **1** — correct, HR-independent unit Ca-drive (verified, `engine/math.ts` L40–45).
- **(2) Concept — leadSec is the ACTIVATION-ONSET lead, not the pressure-peak.** This is *sound*: onset-lead
  ≈ the electrical **PR interval (120–200 ms)**; the a-wave *pressure* peak then lags the onset by the
  Ca→activation→tension kinetics = the model's analog of the **atrial electromechanical delay** (real
  PA interval; interatrial EMD ~30 ms [PMC8356573; PMC4291603]). **Spec/validate on the realized a-wave
  PRESSURE-PEAK → LV-upstroke lead (~90–130 ms)**, with leadSec the tunable that achieves it.
- **(3) Value — 0.16 s reasonable.** In the PR range; fixed-ms is more physiological than a fixed
  *fraction* because PR shortens only modestly (not proportionally) with HR [SA-node/PR physiology,
  StatPearls NBK459238]. The measured 63.5 ms (< 90–130) is an **artifact of the suppressed booster**
  (§1.2: passive end-filling peaks at end-diastole), NOT a timing bug — restore the active a-wave first,
  then calibrate leadSec to the peak-lead. (Optional: mild HR-shortening; guard leadSec/T>1 at HR>375.)
- **[codex2] corroboration (converges 3/3) + quantification:** the Ca pulse peaks at **θ≈0.856 ≈ 115 ms
  before** ventricular phase-zero (HR75); the *mechanical* a-wave peak then lags the electrical onset by
  **O(60–70 ms)** — LA mechanical activation delay **63±5 ms rest / 73±5 ms at +20 bpm** [PMC6099378],
  interatrial EMD **17±8 ms** [Barletta, PMID 11466141]. So PR≈160 − Pa-to-peak≈65 → a-wave peak
  **≈90–100 ms before R**, matching the target — i.e. **leadSec 0.16 s is well-chosen as an *onset* lead**,
  but the observable must be the pressure a-wave peak / mitral contribution (aR = PR − Pa) [*Europace*
  13(9):1262]. Actions: **rename `atrialLeadSec` → `atrialActivationLeadSec`** (don't tune it directly to
  the pressure peak); add θ-instrumentation (Ca onset, activation-a peak, LAP a-peak, MV/TV close,
  LV/RV dP/dt max — all ms vs ventricular phase-zero); for HR-sweeps make it an **AV-delay function**
  (e.g. leadSec = clamp(baseLead + k·(T−0.8), 0.10, 0.20)), not 0.16 baked as universal physiology.

### 1.6 Resulting hemodynamics — gradient +1.8, EF_R 0.39
- **gradient +1.8 (target +3–6):** a **RAP problem, not a LAP problem** — LAP 7.7 is ~at target, but
  **RAP 5.7 is high** (normal 2–6). Root: the conservative *proportional* TBV correction loads the
  systemic/caval side (no pulmonary↔systemic mobilization), over-filling the caval compartment. **Fix:**
  allow systemic→central mobilization to bring RAP to ~3–4 → gradient +3–6.
- **EF_R 0.39 (normal RVEF 45–65 % [Lang 2015]):** LOW — partly the now-higher PAP 17 afterload (itself
  an improvement toward the normal 14–18 mPAP), but check RA→RV preload delivery and RV–PA coupling;
  possible structural sign, not afterload alone.

---

## 2. Scaffolding → physiology: migration-target summary

| Param | Current (scaffolding) | Why non-physiological | Physiological target | Cite |
|---|---|---|---|---|
| LA `sigmaPas0` | 2000 (eff. 494) | 3.2× stiffer than LV; should be softer | **~300–600** (eff. ≤ LV) | PMC4200839 |
| LA `Tmax0` | 3000 (~1/45 LV) | booster off (also < RA, inverted) | **~15000–40000 Pa** (~1/4–1/3 LV) | Shi/Ursino; Hoit 1994 |
| LA `Arel0` | 0.04 | a-wave suppressed | **~0.2–0.3** | NBK482421 (atrial kick 20–30 %) |
| RA `Tmax0` | 8000 | weak-ish | modest bump (≤ LA) | — |
| `PVein_LA.R` | 0.07 (1.17 WU) | ~whole normal PVR in one terminal | **~0.01–0.02** (<<1 WU) | normal PVR <~1 WU |
| Pulm-venous Vu | 375 mL | a bit high | **~200–280 mL** | MESA; Guyton |
| `atrialLeadSec` | 0.16 s | onset-lead (sound); gate on peak | keep ~0.16; gate **aPeak→LV 90–130 ms** | PR 120–200; PMC8356573 |

**Direction:** SOFT LA passive + STRONG active a-wave + the **AV-plane reservoir drive** (§Phase-2b of
`m12-la-preload-design.md`) hold ~50 mL *naturally* with v>a — replacing the stiff-passive + dead-booster
hack. NOT a geometry problem (geomChi/Vw/Vref are codex1-derived and sound); it is the passive/active
balance + the missing reservoir. Circuit: mobilise systemic volume off the RA to fix the gradient.

**[codex2] reparam steps (A–E, converged):** A) fit LA passive to the *target curve* (not by volume) →
sigmaPas0 200–600; B) after softening, raise LA active (Tmax0 15–40k; shape phase via Arel0/tauCa0);
C) **RA co-refit** (RAP 2–5, **RVEF >0.45**); D) lower PVein_LA.R **or** allocate the pulmonary
resistance budget explicitly; E) keep the conservative TBV correction as a *ledger*, but label any
non-zero correction during measurement as **numerical support** (not physiology). *Both reviews agree:
the volume target is fine; the **decomposition** of how it is achieved is what is non-physiological.*

## References
1. *Atrial Kick* — StatPearls NBK482421 (atrial kick = 20–30 % of LV filling). https://www.ncbi.nlm.nih.gov/books/NBK482421/
2. Left-atrial macrophysiology (reservoir/conduit/booster), PMC4200839. https://pmc.ncbi.nlm.nih.gov/articles/PMC4200839/
3. Hoit BD et al. LA contractile performance by time-varying elastance, *Circulation* 1994. https://pubmed.ncbi.nlm.nih.gov/8149549/ ; Shi/Ursino-class lumped models (LA Emax ~0.5–0.6 vs LV 2–3 mmHg/mL).
4. Reuben SR — pulmonary venous compliance ~7–15 mL/mmHg. https://pubmed.ncbi.nlm.nih.gov/7452896/
5. MESA Lung Study (pulmonary blood volume ~547±180 mL); Guyton & Hall (~9–10 % TBV).
6. Lang RM et al. (ASE/EACVI) chamber quantification 2015 — normal RVEF 45–65 %.
7. Atrial electromechanical delay / PA interval — PMC8356573; PMC4291603 (interatrial EMD ~30 ms).
8. PR interval 120–200 ms; rate-dependence — StatPearls SA node NBK459238.
9. `engine/math.ts` (solveQuadraticFlow, raisedCosinePulse) — code-verified R units and pulse normalization.
10. [codex2] LAVI normal <34 mL/m² — BSE normal chamber values, *Echo Res Pract*, PMID 32105051.
11. [codex2] Walklate et al. — atrial vs ventricular myofilament tension/kinetics (atrial ≈ 0.67–0.77× fibre tension, faster kinetics), PMC8629898.
12. [codex2] Pulmonary blood volume ~9 % — StatPearls NBK525948; normal total PVR 0.25–1.6 WU — StatPearls NBK554380.
13. [codex2] Hirakawa S et al. — pulmonary venous compliance ~7–15 mL/mmHg, *Jpn Circ J* 1981.
14. [codex2] LA mechanical activation delay 63±5 ms — PMC6099378; interatrial EMD 17±8 ms — Barletta, PMID 11466141; LA EMD by a-wave peak / aR = PR − Pa — *Europace* 13(9):1262.
