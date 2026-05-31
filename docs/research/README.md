# Parameter validity research — official lesson cases

Purpose: a **literature-grounded record of the physical/physiological validity** of
every parameter used by the official lesson cases (`officialCases.ts`) and the
`active-normal` baseline they build on. This is the evidence base that the M12
calibration milestone will fit against.

## What this IS and is NOT

- **IS**: a referenced rationale — for each parameter, the literature target range,
  the model's value + how it computes (knob → raw → engine math), and a verdict
  (plausible / off / uncertain), with **real citations**.
- **IS NOT**: M12 calibration/validation. We are not fitting parameters to data
  here; we are documenting where the current values stand vs the literature so M12
  can prioritise. Per project priority: **waveform SHAPE and the DIRECTION of change
  matter more than absolute values** — but absolute values still matter for trust.

## Ground rules (both team members)

1. **Real references only.** Cite reputable sources — textbooks (Klabunde *Cardiovascular
   Physiology Concepts*; Guyton & Hall), classic papers (Suga & Sagawa time-varying
   elastance; Sunagawa/Sagawa venous return & guyton; Burkhoff PV analysis; Westerhof/
   Stergiopulos windkessel; Garcia/Otto valvular gradients). **Never fabricate a citation,
   DOI, or page number.** If you cannot find a source, write "no source found — open question".
3. **Separate three things explicitly** for each parameter: *(a) literature target*,
   *(b) model value + computation*, *(c) verdict / open question*.
4. **Document known calibration gaps honestly** (e.g. the model's normal CO ≈ 3.5 L/min is
   LOW vs a normal adult ~5–6 L/min; this is a real gap to record, not hide).
5. Note **dimensions/units** explicitly (Pa vs mmHg, cm² vs mm², mL/min vs mL/s).

## Division of labour (team 0dsim1)

- **lead (claude-code 4.8)** — section **A. Physiological validity vs literature**: target
  ranges, references, the qualitative direction each lesson should show, known gaps.
- **codex1 (codex 5.5)** — section **B. Physical & computational rationale**: the engine
  math (how the raw param enters σ_act / σ_pas / valve flow / venous return), dimensional
  analysis, numerical considerations, and an independent cross-check of section A's numbers.

Coordinate via `/agmsg`. Each `docs/research/<case>.md` carries both sections.

## Per-doc template

```
# <Case title>

Model files: officialCases.ts (the case) · engine/caseResolve.ts (interventions) ·
engine/knobs.ts (knob→raw) · engine/chambers.ts (active-stress) · constants.ts (defaults)

## Parameters in play
| Knob / param | Model value (+ how computed) | Literature target (ref) | Verdict |
|---|---|---|---|

## A. Physiological validity vs literature   [lead]
...

## B. Physical & computational rationale      [codex1]
...

## Open questions / for M12
...

## References
1. ...
```

## Index

- [baseline-and-normal.md](./baseline-and-normal.md) — the active-normal reference operating point.
- [lv-failure-dobutamine.md](./lv-failure-dobutamine.md) — lvPumpFailure + dobutamine coefficients.
- [valve-lesions.md](./valve-lesions.md) — aortic stenosis & mitral regurgitation mappings.
- [hypovolemia.md](./hypovolemia.md) — target blood volume / preload.
