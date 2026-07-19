# VALIDATION-0004: rapid versus canonical fixed-TBV characterization

- Date: 2026-07-19
- Source: official healthy periodic release-bound checkpoint
- Scope: fixed nine-target rapid grid paired with canonical P1 settlement at
  exactly the same TBV
- Status: characterization implemented; not an accuracy acceptance gate and
  not a change to production scientific claims

## Purpose and claim boundary

The rapid preload curve is an early visual estimate after a hidden,
compliance-projected state initialization and a short natural hold. It is not a
periodic solution. This validation pairs every rapid target with a separately
settled canonical point at the identical TBV, avoiding the invalid comparison
of differently sampled curves.

Rapid points never enter P1/P2 evidence, continuation seeds, or
ESPVR/EDPVR/PRSW fits. P2, unresolved, and failed canonical outcomes are
retained in the report but excluded from error distributions. The baseline P1
is recorded separately and is not treated as a zero-error rapid pair.

## Two-beat reference result

All nine canonical targets converged to P1 without a P2 or failed point. The
rapid path used 18 natural beats; the canonical reference used 187 beats.

| Metric | Median absolute error | Maximum absolute error |
|---|---:|---:|
| mean RAPtm | 0.255 mmHg | 0.336 mmHg |
| mean LAPtm | 0.966 mmHg | 1.776 mmHg |
| net/forward cardiac output | 0.232 L/min | 0.561 L/min |
| LV EDV | 5.18 mL | 20.69 mL |
| LV EDPtm | 0.967 mmHg | 3.735 mmHg |
| LV ESV | 5.78 mL | 11.34 mL |
| LV ESPtm | 6.31 mmHg | 16.36 mmHg |
| LV stroke work | 631 mmHg*mL | 1,828 mmHg*mL |

The rapid full-state period-1 residual was 0.109–0.258, whereas the canonical
P1 residual was approximately `5e-4`. All nine rapid points remained
finite-hold, periodicity-unclassified evidence. The error changes sign across
the low-volume lane; it is not a constant output bias and must not be repaired
with a post-hoc curve correction.

Relative errors use explicit denominator floors (1 mmHg for pressure, 0.1
L/min for flow, 1 mL for volume, and 100 mmHg*mL for stroke work). Absolute
errors remain primary when the canonical pressure is near zero.

## Three-beat refinement result

Giving every target one additional natural beat improved most pressure, flow,
end-systolic, and work summaries. It used 27 rapid natural beats. The measured
two-lane rapid wall-clock projection was 8.61 seconds on the local development
machine, compared with 6.74 seconds for the two-beat locus; canonical settlement
is deliberately excluded from these presentation-time figures.

| Metric | Two-beat median / max | Three-beat median / max |
|---|---:|---:|
| mean RAPtm | 0.255 / 0.336 mmHg | 0.187 / 0.251 mmHg |
| mean LAPtm | 0.966 / 1.776 mmHg | 0.616 / 1.315 mmHg |
| net/forward cardiac output | 0.232 / 0.561 L/min | 0.155 / 0.581 L/min |
| LV EDV | 5.18 / 20.69 mL | 5.91 / 14.85 mL |
| LV EDPtm | 0.967 / 3.735 mmHg | 0.445 / 2.625 mmHg |
| LV ESV | 5.78 / 11.34 mL | 4.36 / 9.30 mL |
| LV ESPtm | 6.31 / 16.36 mmHg | 4.71 / 13.80 mmHg |
| LV stroke work | 631 / 1,828 mmHg*mL | 312 / 1,338 mmHg*mL |

The third beat is therefore a useful default refinement, but it is not a
monotone improvement for every observable and target: maximum cardiac-output
error increased slightly, and median EDV error increased. This is why the
runtime spends later beats according to target-level drift and event quality
rather than applying an output correction or claiming that a fixed beat count
has converged.

## Adaptive rapid acquisition

Production first streams all nine two-beat points. A global 10-second soft
budget may then replace a point under the same target ID with a third, fourth,
or fifth natural-beat observation. The deadline controls new dispatches rather
than interrupting an accepted beat already in flight, so it is a soft browser
responsiveness budget rather than a supported-hardware timing guarantee.
Priority uses the full accepted-state drift
and its trend, RAP/LAP/output drift, LV PV endpoint and stroke-work drift, and
LV event quality. Optional refinement failure retains the last valid estimate.

No adaptive stage changes the claim boundary: the additional beats improve a
preview but do not satisfy the canonical three-consecutive-beat P1 gate.
Characterization summaries are grouped by completed rapid beat count so future
model versions can compare the speed/accuracy trade-off without changing the
scientific classification.

## Reproduction

```bash
npm run characterize:scientific:fast-tbv-accuracy -- --rapid-beats=2
npm run characterize:scientific:fast-tbv-accuracy -- --rapid-beats=3
```

Use `--output=<path>` to retain the deterministic JSON report. Values are
release- and source-fingerprint-bound and must be regenerated after a model or
numerical-runtime identity change.
