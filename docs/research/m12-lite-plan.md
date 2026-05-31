# M12-lite calibration plan

A focused first calibration to bring the `active-normal` baseline to roughly
physiological values **while preserving the current waveform morphology**. Driven
by the validity findings in this folder. NOT full M12 (no UQ / multi-objective
optimisation); the goal is to retire the headline gaps.

## Target spec (normal resting adult)

| Metric | Current model | Target | Source |
|---|---:|---|---|
| CO | 3.5 L/min | ~5 (4–6) | baseline-and-normal.md |
| SV | 47 mL | ~70 (60–100) | " |
| MAP (AoPMean) | 70 | ~85–95 | " |
| AoP sys/dia | 94/64 | ~120/80 | " |
| PAP mean | 9 | ~14–18 | " |
| LAP / PCWP | 3.1 | ~8–12 | " |
| RAP | 2.8 | ~2–6 | " |
| LVEF | 0.53 | ~0.55–0.65 | " |
| peak σ_act | 46.9 kPa | ~80–110 kPa (realised) | Bovendeerd 1992 |
| Tmax0 ceiling | 382.5 kPa | ~100–150 kPa (physiological) | CircAdapt/Arts |
| AS severe mean gradient | ~15 | ~30–40 mmHg (at normal CO) | ESC/AHA |

## Lever findings (read-only nodeOverrides.active sweep, lead)

Primary stress→pressure lever is **`geomChi`** (the thick-sphere Laplace conversion;
the dev note in `chambers.ts` already flagged it). Raising geomChi alone (keeping the
inflated Tmax0):

| geomChi | CO | AoP | EF | clamps |
|---:|---:|---|---:|---|
| 0.36 (now) | 3.52 | 94/64 | 0.53 | 0 |
| 0.5 | 4.18 | 111/72 | 0.68 | 0 |
| 0.7 | 4.80 | 121/73 | 0.83 | 12 |
| 1.0 | 5.15 | 125/74 | 0.92 | 109 |

**Key constraint:** a single force lever raises CO but **overshoots EF (0.83–0.92, supra-
physiological) and triggers clamps**, because EDV does not grow to match. Lowering Tmax0 to a
physiological ceiling *with* higher geomChi drops CO below baseline (the product geomChi·Tmax0
falls). So CO~5 with EF~55–65 needs a **coordinated co-tune of force AND diastolic/preload**, not
one lever.

### Refined force×filling sweep (read-only, lead)

| Config | CO | MAP | AoP | EF | EDV | ESV | clamps |
|---|---:|---:|---|---:|---:|---:|---|
| baseline (chi0.36, T382k) | 3.52 | 70 | 94/64 | 0.53 | 88 | 41 | 0 |
| **chi1.0, T180k, vt0.40** | 4.10 | 78 | 109/71 | 0.66 | 83 | 29 | 0 |
| **chi1.0, T190k, vt0.55** | 4.30 | 80 | 114/73 | 0.69 | 83 | 26 | 0 |
| chi1.0, T200k, vt0.45 | 4.40 | 81 | 117/74 | 0.71 | 83 | 24 | 0 |
| chi0.6, T382k, bP5, vt0.30 | 5.08 | 91 | 135/83 | 0.78 | 87 | 20 | 0 |

**Two findings that reshape the plan:**

1. **The "supra-physiological Tmax0" debt IS retire-able now, cleanly.** `geomChi ≈ 1.0` (a proper
   thick-sphere Laplace) + `Tmax0 ≈ 180–200 kPa` (physiological) gives **EF 0.66–0.71 (in/near range),
   AoP ~115/74 (MORE physiological than baseline 94/64), no clamps** — and a physiological Tmax0. This
   alone is a clear net win and the safe M12-lite target.
2. **EDV is the binding constraint and does NOT respond to the easy preload levers.** EDV stays ~83–88
   mL (vs a normal ~110–120) even as `venousTone` is pushed 0.2→0.55 and `bPas` softened — because LV
   filling is limited by **pulmonary venous return / atrial filling**, not systemic venous tone (which
   sets RV preload) or LV diastolic stiffness. So **CO~5 with EF~0.60 is blocked by the small EDV**,
   not by force. Reaching it needs a deeper preload/structural calibration (pulmonary-vein compliance/
   resistance, atrial properties, blood-volume distribution) — a larger M12 piece.

### Revised M12-lite scope (what to do now vs defer)

- **Now (M12-lite):** retire the Tmax0 debt — `geomChi ~1.0`, `Tmax0 ~185 kPa` (RV scaled), giving a
  physiological ceiling, EF ~0.66, AoP ~115/74, CO ~4.2 (up from 3.5), no clamps. Re-verify shape +
  all cases. CO ~4.2 is still below 5 but the heart is now physiologically parameterised.
- **Defer (M12 proper):** the EDV/preload calibration to lift CO→5 at EF~0.60 (pulmonary venous
  return / atrial / volume distribution); the AS area-aware flow law; raising PAP mean toward ~15.

## Planned approach (coordinated co-tune)

1. **Force → pressure**: raise `geomChi` toward a correct thick-sphere Laplace value and lower
   `Tmax0` to ~100–150 kPa so the realised peak σ_act sits ~80–110 kPa; if needed raise activation
   (`Arel0`/Ca params) so `a` reaches a healthier fraction than ~0.12.
2. **Diastolic / preload → EDV**: co-tune `bPas`/`sigmaPas0` (EDPVR), `V0`/`Vref`, and the
   filling/venous-return operating point so EDV grows enough to land EF ~55–65 at CO~5, and LAP/RAP
   reach ~8–12 / ~2–6.
3. **Pulmonary side**: raise PAP mean toward ~15 (pulmonary resistance / compliance).
4. **AS gradient** (after CO is fixed): make the valve flow law use absolute effective area (so the
   Bernoulli penalty is area-driven, not only `AoV_R`), targeting a ~30–40 mmHg severe-AS mean
   gradient at the new normal CO.

## Guards (must not regress)

- **Waveform morphology preserved** (the reason active-stress was chosen): AoP dicrotic notch, LVP
  no-notch, LAP/CVP a-c-v + x-y, LV PV-loop shape, MV E/A — per `waveform-morphology.md` (the team
  morphology review). Re-run the morphology check after calibration.
- **No state clamps** at the new operating point (`health: ok`).
- All official cases re-verified (directionality + non-degeneracy guards) and re-tuned if needed.
- The frozen baseline snapshot and the research-doc numbers updated deliberately.

## Division of labour (team 0dsim1)

- **codex1** — numerical optimisation: search (geomChi, Tmax0, Arel0) × (bPas, V0/Vref, filling)
  against the target spec with the clamp/shape constraints; report a candidate parameter set + the
  resulting metrics.
- **claude1** — validate the target ranges + the correct thick-sphere Laplace factor for geomChi;
  confirm the candidate against literature.
- **lead** — integrate, re-verify shape + all cases, update docs/snapshot, run the review gate.

> Sequencing: execute only AFTER the morphology review lands (so the shapes to protect are known and
> the in-flight measurements are on a stable baseline).
