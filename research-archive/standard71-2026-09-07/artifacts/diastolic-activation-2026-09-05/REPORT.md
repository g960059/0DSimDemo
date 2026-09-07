# Diastolic activation, length coupling and baseline reserve

Research continuation, 2026-09-05. The published Standard70 baseline, model ID,
checkpoint, Model Surface and browser default have **not** been changed.

## Outcome

The preceding study found that high-TBV filling raised late-diastolic active
pressure while scarcely increasing LVEDV or output. The new component and
closed-loop comparisons support this as a real mechanism to investigate, not
just a correlation inferred from one pressure-volume loop. Lowering the
prescribed Ca trough improves filling/output and high-volume reserve, including
when the isometric peak-force reference is held constant.

It is **not yet a defensible adopted baseline**. The better lower-Ca condition
has a late pressure peak at the edge of the current construction guard, breaks
the digitized source-amplitude constraint, and moves the operating Land stretch
farther beyond the length-response cap. Source-only replay also demonstrates
large residual force near stretch1.2 without the newer kinetic modifications.
The next structural priority is therefore the joint reference-geometry,
length-dependent activation and twitch calibration, not a broader TBV/Tref grid
or a cosmetic pressure-curve target.

Full numerical tables are in [MEASUREMENTS.md](MEASUREMENTS.md). The paired
accepted-endpoint plot is [source-vs-floor013-1ms.png](source-vs-floor013-1ms.png).
No interpolation smoothing is applied to the plotted time/PV trajectories.

## 1. Protocol and exact construction

All closed-loop comparisons use HR70, BSA1.9, TBV5050 at center, systemic
resistance1.05, source ventricular passive/SLS scale1.04, systemic arterial
PV-amplitude scale0.6 and Ao_SA L=0. Pulmonary-root algebraic behavior, valve
areas, existing ventricular bridge kinetics and all atrial components remain
unchanged. The comparison labeled `source` is this research control, **not the
published baseline**. Reference ventricular Tref is190080Pa.

The previous L-ablation result remains relevant: these runs do not attribute
elimination of the original inertial pressure shoulder to a Ca change.

Two bounded constitutive probes are added to the research fixture:

- Geometry-to-Land reference stretch: source1.09 versus1.07 (1.06 in component
  work only). Land input is the actual reference stretch times exp(fiber strain).
- Prescribed ventricular Ca trough: source0.164321 versus0.13 or0.11uM. Peak
  remains0.592586uM; the normalized transient, HR law and event timing remain
  unchanged. This is an affine amplitude/baseline transformation of the full
  transient, **not** a diastole-only intervention, measured replacement trace,
  clamp, smoothing filter or SERCA model.

Changed Ca is bound into the actual exact event configuration with fresh cold
event-memory initialization. Changed material is installed in the coupled
provider and has a distinct parameter identity. These probes are restricted to
the `intervention` research role; they are not new everyday fit knobs and cannot
export a published Standard70 checkpoint.

## 2. Component separation before closed-loop work

`component-screen.ts/json` uses the existing Land backward-Euler solver and
fixed-input initializer. Seven material/Ca variants are evaluated in a periodic
isometric protocol and on two prescribed accepted geometry histories from the
previous center/high-volume study. Three consecutive cycle-end state differences
below1e-10 are required. The isometric protocol uses1000 steps/beat atHR70; the
trajectory protocol retains the original accepted2ms sequence.

Two amplitude comparisons are kept separate: unchanged Tref, and a Tref rescale
preserving the source peak active Kirchhoff stress at geometry stretch1.1.
Tref scales output linearly without changing the component state equations.
This is a controlled reference, not a normal human force target: the source
Land stretch at that geometry is1.199 and its peak is approximately302kPa.

At the same prescribed high-volume geometry history and phase0.7, active
pressure accounting after isometric peak matching is:

| Constitutive comparison | Active pressure contribution, mmHg |
|---|---:|
| Source Ca and reference stretch | 13.073 |
| Reference stretch1.07 | 6.664 |
| Ca trough0.13uM | 5.477 |
| Both | 3.755 |

These are controlled material replays, not predicted closed-loop pressures.
The source replay differs from the original recorded peak stress by at most
2.315Pa after its stricter component settlement, against roughly75kPa peak.
Zero-rate equilibrium calculations separately confirm steep activation growth
with length below1.2; it is not solely a long-lived dynamic distortion state.

## 3. Eight closed-loop screens and the reserve contrast

All eight cold constructions reached canonical period1;8 workers completed the
screen in61.8s wall time. `closed-loop-v1` retains full results, source snapshots,
construction identities, complete terminal beats and one additional accepted
cycle of material readback. Accepted material pressure reconstruction is checked
against the coupled LV pressure, not inferred from an independent fitting curve.

The source, reference-stretch-only, Ca-only and combined conditions then form a
2x2 comparison at the common isometric peak reference. Existing formal low/high
TBV reserve runs use fixed controls, the existing reservoir-settlement policy,
and2ms stepping. Four parallel outer jobs complete in95.2s including repeated
center settlement. **No afterload stress test is added.**

| Common isometric peak comparison | AoP mmHg | CI L/min/m2 | High-TBV CO change | Rest result |
|---|---:|---:|---:|---|
| Source |112.81/76.62|2.910| -0.185% |pass|
| Stretch1.07 |113.63/76.67|2.918| +2.515% |pass|
| Ca0.13 |116.11/78.23|2.990| +6.283% |pass at2ms|
| Both |116.34/77.95|2.984| +6.603% |ET and pulmonary mean-gradient fail|

Both Ca-only and combined conditions pass the existing bilateral directional
reserve checks; source and stretch-only fail high-volume response. Low-volume
responses pass in all four. These engineering response thresholds are not
claimed to define a universal human normal fluid-response percentage.

At unchanged Tref190080Pa, Ca0.13 already produces CI2.986 and Ao115.93/78.15:
the output improvement is not explained by the1.09% Tref increase used for the
isometric amplitude match. More Ca lowering is not automatically better:
Ca0.11 shifts the pressure peak later; reducing stretch without sufficient
amplitude also reduces EF. The combined intervention adds little reserve beyond
Ca-only but shortens ET and increases pulmonary gradient.

## 4. Independent1ms full-invariant confirmation

The source and Ca0.13 matched-force constructions were each run from their own
cold state at TBV5050 and5656,1ms nominal steps, with full invariants. All four
reach canonical period1. Wall time276.1s with four workers; the lower-Ca high
case takes142 cycles, so these confirmatory runs are slower than2ms screening.
Formal2ms reserve and independent1ms closed-loop contrasts are not labeled as
the same protocol, but agree closely in output response:

- Source independent high-volume CO change: -0.165%.
- Ca0.13 independent high-volume CO change: +6.276%.
- Ca0.13 center: Ao116.21/78.26, CI2.992, ET244ms, ICT51.14ms,
  IRT90ms, Tei0.578, E/A0.869. No significant extra LV/Ao peak or post-peak
  rebound; descriptive late-PV chord deficit is zero.
- Source high-volume LVEDV rises only0.183mL and PCWP11.29mmHg. Ca0.13 allows
  LVEDV to rise10.600mL while PCWP rises7.42mmHg.

The Ca-only1ms center nevertheless fails the existing compound roundness guard:
its central-range fraction0.23038 is within0.08-0.35, but its pressure peak phase
0.80083 exceeds0.8. At2ms the peak was exactly0.8. This small boundary crossing
is not evidence of a newly flat plateau, nor a reason to call the candidate
physiologically validated. High-volume peak phase is0.81102, so late peaking
deserves attention beyond the center's sampling-scale boundary difference.

The accepted high-volume phase0.7 active-pressure contribution falls13.13 to
6.85mmHg, while the passive contribution increases3.61 to4.68mmHg and LV volume
increases123.93 to128.50mL. This is consistent with relieved active filling
impedance, but the decomposition is accounting, not a percentage causal effect.

An important warning: LV Land stretch spans approximately0.999-1.207 in the
source center, versus1.012-1.227 in the lower-Ca center and1.031-1.251 at high
volume. Lowering Ca does not fix the reference-stretch issue; it permits more
filling into the capped length-response region. This must not be hidden by a
passing pressure/reserve table.

## 5. Source audit: Ca is not simply a transcription error

The Land2017 accepted manuscript was downloaded from its public university
repository; manuscript pages12-13, including Figure6, were read visually with
the PDF workflow. The source trace retained in Git at
`e4068e3b:data/myocardium/source-traces/land2017-figure6-coppini-calcium-trace-v1.json`
confirms the digitized extrema. The0.034321uM intervention is far larger than
the archived half-pixel calibration estimate0.000327uM. Unknown biological
variability does not make it a correction of the same source observation.

The paper combines Ca and force data from different preparations, then retunes
the cellular model for intact twitch and whole-organ use. Its reported
rest-length force peak/minimum are51/0.078kPa; this is not a direct joint human
Ca-force-length dataset or validation of our geometry reference.
[Land et al., 2017](https://doi.org/10.1016/j.yjmcc.2017.03.008).

`source-twitch-audit-v2.json` compares source whole-organ Land and current
rounded material, both atTref120kPa andHR60, using either the archived digitized
Ca or the analytic alpha fit aligned to the source figure. At fixed stretch1,
source Land plus digitized Ca gives51.190/0.0785kPa and relaxation50/95 times
122/283ms, consistent with the stated force and relaxation magnitudes. Peak
time here is measured from the figure origin, not asserted identical to the
paper's time-to-peak processing. The first audit used cellular-source
Tref40.5kPa for the source material;v2 explicitly corrects the comparison to a
common120kPa reference. The raw first audit is retained, not used as an
equal-amplitude comparison.

At stretch1.1 versus1.2, even source Land plus original digitized Ca increases
minimum force0.509 to12.158kPa. Alpha-fit results are similar,0.511 to12.229kPa.
Thus persistent high-stretch activation is not explained just by alpha fitting
or the new bridge-exit mechanism. Current rounded material further delays the
fixed-length peak compared with source Land; because several kinetic choices
differ together, this audit does not assign that delay to a single rate.

Joint Ca/contractile calibration is also needed in other integrated human
electromechanical models; that precedent supports a joint audit, not importing
their parameters into this0D construction.
[Margara et al., 2021](https://doi.org/10.1016/j.pbiomolbio.2020.06.007).
Similarly, a lumped-circulation study distinguishes cellular length activation,
Frank-Starling behavior and fluid responsiveness; our reserve cannot be reduced
to the single length cap alone.
[Kosta and Dauby, 2021](https://doi.org/10.1371/journal.pcbi.1009469).

## 6. Small implementation fix and verification

The compound `rounded-not-plateau` guard previously returned the central-range
value even when only peak timing failed. It could therefore say a value inside
its bounds had failed. The check now reports the actual failing peak-phase value
and its0.2-0.8 bounds with an explicit peak-phase unit. Pass/fail logic and all
thresholds are unchanged; valid baseline check records are unchanged. Raw run
files retain their original source snapshot and pre-fix diagnostic readback.

Research readback tests now reconstruct active stress for all three ventricular
walls using their actual accepted states and changed Land stretch, so changing
only a diagnostic label would fail. Ca event extrema/timing/owner tests remain.

108 tests across8 selected files passed, including research ownership/rebinding,
baseline checks, shape diagnostics, core circulation, typed-authority and
current rounded-ejection fixture regression. TypeScript no-emit check and
`git diff --check` pass. An initial Vitest invocation had a min/max worker-option
conflict and ran no tests; the corrected bounded-worker invocations above passed.
This is targeted verification, not a full repository-suite claim.

## 7. Next bounded step and fitting-workflow implication

1. Keep L=0 as the separate waveform-coupling candidate, not a Ca benefit.
2. Retain Ca0.13 as a useful **counterfactual**, not a promoted source fit. Keep
   the current published Ca/baseline unchanged.
3. Revisit geometry-to-Land reference stretch with the current twitch/bridge
   choices. Preserve the source-Ca amplitude constraint while comparing a small
   set of material constructions against resting/loaded component behavior,
   early-versus-late pressure generation and closed-loop preload response.
   Restore source kinetic choices factor by factor where useful. Do not treat
   reference stretch, Tref and Ca sensitivity as independent freely fitted knobs.
4. Once a consistent fixed material construction exists, resume low-dimensional
   hemodynamic fitting for central CI/AoP and baseline-relative intervention
   headroom. No new general fitting framework or additional afterload test is
   needed for this step.
5. Keep the fast-to-slow sequence used here: component protocol, small parallel
   2ms screens, selected low/high reserve, then1ms full-invariant confirmation.
   Numeric guard boundaries and morphology meanings must be visible in research
   results without adding noisy labels to the public waveform UI.

No additional human decision is required by these findings. Adoption remains
blocked by scientific qualification, not by lack of permission to continue.
