# VALIDATION-0001: healthy reference screen

Status: implemented research gate; production cutover remains blocked.

## Purpose

This is the first physiology acceptance layer for the single scientific core.
It evaluates one complete, unsmoothed terminal cycle restored from the checked-in
official healthy periodic checkpoint. It does not tune parameters and it does
not compare a rendered shape to a target image.

The report keeps two questions separate:

1. Did the numerical transaction remain converged and conservative?
2. Did gross resting physiology fall inside a deliberately broad reference
   screen?

A clean nonlinear solve is not evidence that the physiology is acceptable.
Conversely, a reference miss is a model-review result, not a patient diagnosis.

## Measurement contract

- Exact `SimulationReleaseRef` and official checkpoint identity are recorded.
- The checkpoint must already contain a terminal period-1 tracker state.
- Exactly 500 contiguous accepted steps at 2 ms are measured: one 1 s cycle.
- No smoothing, resampling, parameter search, or parameter fitting is applied.
- Missing accepted-step readbacks produce `unavailable`, never zero.
- The fixed reference body surface area is 1.9 m², matching the current
  normal-adult assembly prior.

## Reference gates

The ranges are broad screens, not interchangeable clinical measurements.
In particular, model LA mean pressure is compared with the healthy PAWP
literature only as a surrogate review signal; the report does not assert that
the two measurements are identical.

| Metric | V1 range | Evidence role |
|---|---:|---|
| LV EDV index | 34–76 mL/m² | broad sex-neutral ASE/EACVI and NORRE context |
| LV ESV index | 10–29 mL/m² | broad sex-neutral ASE/EACVI and NORRE context |
| LV ejection fraction | 0.52–0.74 | inclusive healthy-adult screen |
| Cardiac index | 2.5–4.0 L/min/m² | broad resting-output screen |
| Pulmonary-artery systolic pressure | 10–35 mmHg | current ASE RVSP threshold used as a direct-model PA review screen |
| Mean LA pressure | 2–13 mmHg | PAWP-derived surrogate screen only |

Primary reference context:

- Lang RM et al. *J Am Soc Echocardiogr.* 2015;28:1–39.e14.
  [doi:10.1016/j.echo.2014.10.003](https://doi.org/10.1016/j.echo.2014.10.003)
- Kou S et al. *Eur Heart J Cardiovasc Imaging.* 2014;15:680–690.
  [doi:10.1093/ehjci/jet284](https://doi.org/10.1093/ehjci/jet284)
- Mukherjee M et al. *J Am Soc Echocardiogr.* 2025;38:141–186.
  [doi:10.1016/j.echo.2025.01.006](https://doi.org/10.1016/j.echo.2025.01.006)
- Zeder K et al. *Eur Respir J.* 2024;64:2400967.
  [doi:10.1183/13993003.00967-2024](https://doi.org/10.1183/13993003.00967-2024)

The cardiac-index screen additionally records the clinical teaching reference
used by the target pack. Source identity and interpretation are stored with
every gate in the generated artifact.

## Current result

The deterministic artifact is
`data/scientific/validation/official-healthy-reference-acceptance-v1.json`.

| Gate | Current value | Result |
|---|---:|---|
| LV EDV index | 80.394 mL/m² | fail: above 76 |
| LV ESV index | 33.799 mL/m² | fail: above 29 |
| LV ejection fraction | 0.580 | pass |
| Cardiac index | 2.796 L/min/m² | pass |
| Pulmonary-artery systolic pressure | 37.078 mmHg | fail: above 35 |
| Mean LA pressure | 8.145 mmHg | pass |
| Mechanics maximum residual | 9.86e-10 | pass |
| Circulation maximum scaled residual | 5.43e-10 | pass |
| Maximum continuity residual | 1.77e-8 mL | pass |
| Maximum fixed-TBV error | 2.73e-12 mL | pass |

This sharpens the visual impression reported during review: the current LV
operating point is volume-shifted upward even though its EF and cardiac index
are reasonable. Because EDV and ESV are both high, this evidence does not by
itself identify low contractility as the sole cause. Pulmonary systolic pressure
is also slightly above the V1 review threshold. These are explicit model-level
blockers; the target range was not widened to make the current release pass.

### Morphology readback

The same accepted cycle now has an observation-only morphology report. Its
metrics are review evidence; literature-calibrated morphology acceptance
thresholds have not yet been established.

- LA PV has two proper self-intersections, so a unique two-lobe decomposition
  is not measurable. Equal-volume reservoir pressure is above conduit pressure
  at every usable probe, but only 39/101 probes are single-valued; the remaining
  ambiguity is itself a review flag.
- RA PV has one crossing with opposed lobe orientation. Its v-to-a lobe-area
  ratio is 1.405, and 88/101 equal-volume probes are usable with reservoir above
  conduit at every usable probe.
- MV and TV each have two significant forward-flow peaks in the fixed healthy
  cycle. Thus the current quasi-steady official baseline does not show an extra
  inertance-like AV-flow peak under this explicit 5%-of-peak detector. This does
  not yet prove robustness over HR or load changes.

This reproduces the qualitative asymmetry seen in visual review: RA is already
topologically cleaner, while LA still contains an extra crossing and a poorly
single-valued reservoir/conduit overlap despite the correct sign at usable
equal-volume probes.

## Still required before production cutover

- atrial reservoir/conduit/pump PV topology and ordering;
- mitral and tricuspid E/A morphology without spurious peaks;
- the initial SVR/PVR resistance screen is recorded in `VALIDATION-0002`;
- HR, preload/TBV, vascular-compliance, and broader load envelopes;
- inotropy and lusitropy perturbations;
- background-flow resistance sensitivity;
- independent multi-start periodic basins;
- time-step refinement; and
- a basic intervention transient.

The load controls must first become typed, release-resolved operations. The
validation layer must not reintroduce arbitrary object patches or an implicit
last-write-wins parameter backend.

## Reproduction

```bash
npm run generate:scientific:healthy-reference-acceptance
npm run verify:scientific:healthy-reference-acceptance
```

The verification command checks deterministic artifact parity. It reports the
current physiology failure without treating that expected research result as a
file-integrity failure.
