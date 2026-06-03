# Parameter-validity research — navigator

A **literature-grounded record of the physical/physiological validity** of the model's parameters,
plus the calibration work built on it. This folder is the evidence base the calibration milestones
fit against. Start here to trace any parameter's validity to its canonical doc + section.

## Ground rules (all contributors)

1. **Real references only.** Cite reputable sources (Klabunde *Cardiovascular Physiology Concepts*;
   Guyton & Hall; Suga/Sagawa elastance; Sunagawa venous return; Burkhoff PV analysis; Westerhof/
   Stergiopulos windkessel; Garcia/Otto valve gradients; Bovendeerd/Arts CircAdapt; Klotz EDPVR;
   Carlsson/Arheden AVPD). **Never fabricate a citation, DOI, or page number.** No source → write
   "no source found — open question".
2. **Numbers are code-verified or two-party cross-checked.** Unit conversions (Pa↔mmHg, mmHg·s/mL↔WU,
   cmH₂O↔mmHg) must be derived and checked, not guessed. Flag "要確認/to verify" rather than assert.
3. **Separate three things** per parameter: *(a) literature target*, *(b) model value + computation*,
   *(c) verdict / open question*.
4. **Document gaps honestly** (incl. "scaffolding being undone" — see atrial-split review).
5. Note **units** explicitly. Priority: **waveform SHAPE & DIRECTION of change > absolute values**.

## Validity navigator — subsystem → canonical doc(§)

| Subsystem / parameter group | Canonical doc(s) + section |
|---|---|
| Thick-sphere geometry `geomChi` (derivation) | [derivations-geometry-and-edpvr.md](./derivations-geometry-and-edpvr.md) §A1 |
| Active-stress `Tmax0` / `σ_act` (ceiling vs realised) | derivations §A4 · [parameter-survey.md](./parameter-survey.md) §A |
| EDPVR / passive `sigmaPas0,bPas,lambdaPas0` (Klotz) | derivations §A2–A3 · parameter-survey §A · [m12-lite-calibration-journal.md](./m12-lite-calibration-journal.md) |
| Arterial / venous tree nodes (P0/Vs/Vu, compliance) | parameter-survey §B,§C |
| Edge R / L → SVR / PVR / inertance | parameter-survey §D |
| Valves (areas; AS/MR/AR/TR EROA) | parameter-survey §E · [valve-lesions.md](./valve-lesions.md) |
| Global scalings + TBV distribution | parameter-survey §F |
| Respiratory + PEEP unit bug | parameter-survey §G |
| Pericardial pressure + septal volume-shift coupling | [pericardium-septal-coupling.md](./pericardium-septal-coupling.md) |
| Guyton / Starling operating-map pane | [guyton-starling-pane.md](./guyton-starling-pane.md) |
| Coronary circulation (LAD/LCx/RCA, intramyocardial pressure, stenosis/FFR) | [coronary-circulation.md](./coronary-circulation.md) |
| Preview performance / computational load | [preview-performance.md](./preview-performance.md) |
| Current branch physiology audit (LA/RA AV-plane, RV/RA, valves, PEEP, numerics) | [2026-06-01-physiology-validation-audit.md](./2026-06-01-physiology-validation-audit.md) |
| Waveform morphology (AoP/LVP/PV-loop/E-A/PVF) | [waveform-morphology.lit.md](./waveform-morphology.lit.md) (physiology) · [waveform-morphology.codex.md](./waveform-morphology.codex.md) (measured) |
| **M12-lite calibration (as-built)** | m12-lite-calibration-journal.md |
| **Atrial active-stress + reservoir + pulmonary split** | [m12-la-preload-design.md](./m12-la-preload-design.md) (design) · [atrial-split-validity-review.md](./atrial-split-validity-review.md) (validity) · [m12-la-preload-impl-plan.md](./m12-la-preload-impl-plan.md) (implementation) |
| AV-delay timing (`atrialLeadSec`) | atrial-split-validity-review.md §1.5 |
| Case validity (baseline / AS·MR / failure·dobut / hypovolemia) | [baseline-and-normal.md](./baseline-and-normal.md) · valve-lesions.md · [lv-failure-dobutamine.md](./lv-failure-dobutamine.md) · [hypovolemia.md](./hypovolemia.md) |
| Settle / snapshot / steady-state | [../state-snapshot-and-steady-state.md](../state-snapshot-and-steady-state.md) |
| Roadmap (model SSOT) / Phase-A plan | [../ROADMAP.md](../ROADMAP.md) · [../PHASE_A_PLAN.md](../PHASE_A_PLAN.md) |

> **Note on case-doc operating-point numbers:** the hard numbers in baseline-and-normal / valve-lesions /
> lv-failure-dobutamine / hypovolemia are **M12-lite/Phase-1-era and are being changed by the in-progress
> atrial-split reparam** — they will be refreshed after the Phase-2 commit. The *literature targets* and
> *direction* in those docs remain valid.

## Document map (chronology + status)

1. **parameter-survey.md** — the broad validity survey (groups A–G) + the M12 calibration anchors. *Active reference.*
2. **derivations-geometry-and-edpvr.md** — step-by-step math behind geomChi & the EDPVR/Klotz fix. *Active.*
3. **m12-lite-calibration-journal.md** — the executed M12-lite calibration, trial-and-error, final landing. *As-built record.*
4. **waveform-morphology.lit.md / .codex.md** — canonical waveform morphology (physiology / measured). *Active.*
5. **m12-la-preload-design.md** — M12-proper #1 LA-preload + Phase-2b structural (reservoir/AV-plane, pulmonary split). *Active design (UPDATE in progress).*
6. **atrial-split-validity-review.md** — validity review of the current atrial+split params (scaffolding vs physiology, migration targets). *Active.*
7. **m12-la-preload-impl-plan.md** — claude2's in-code implementation plan for the atrial migration. *Active.*
8. Case docs: **baseline-and-normal / valve-lesions / lv-failure-dobutamine / hypovolemia** — per-case validity. *Active (numbers refresh pending Phase-2).*
9. **2026-06-01-physiology-validation-audit.md** — current-branch multi-review audit after LA/RA AV-plane work; includes measured values, derivations, and priority fixes. *Active current audit.*
10. **pericardium-septal-coupling.md** — nonlinear pericardial pressure plus septal volume-shift implementation; documents equations, parameters, gates, and TriSeg limitations. *Active.*
11. **guyton-starling-pane.md** — Guyton/Starling operating-map pane; documents local venous-return estimates, pulmonary filling pressure, worker preload sweeps, and interpretation limits. *Active.*
12. **coronary-circulation.md** — LAD/LCx/RCA coronary graph extension with intramyocardial pressure, time-varying microvascular resistance, hyperemia, and stenosis/FFR gates. *Active.*
13. **preview-performance.md** — staged computational-load plan plus implemented low-risk preview-loop and chart hot-path changes. *Active.*

**Archived (git history):** `m12-lite-plan.md` — the pre-execution M12-lite plan; **deleted** as
completed/superseded by m12-lite-calibration-journal.md (the as-built record). Recover via git if needed.

## Per-doc template

```
# <title>
Model files: ...
## Parameters in play
| param | model value (+computation) | literature target (ref) | verdict |
## A. Physiological validity vs literature
## B. Physical & computational rationale
## Open questions / for M12
## References
```
