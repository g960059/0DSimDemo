---
title: "Reusable morphology check v1"
status: "Implemented as deterministic diagnostic layer"
claim_boundary: "gross-artifact-check-no-physiology-acceptance"
---

# Reusable Morphology Check v1

## Objective

Provide one deterministic morphology checker for the same raw simulation traces
used by Workbench, CI/artifact runners, future case/preset/lesson validation,
and subagent summaries. This layer exists because health/output and broad
target-distance gates can pass while education-visible waveform morphology is
still wrong.

The checker is not a LandAtrial calibration target by itself and does not
accept official morphology. It is a gross-artifact detector and localization
surface.

## Current Profile

The first implemented profile is:

```text
normal_sinus_default
```

It expects:

- LV/RV PV-loop systolic ejection limbs to be single-peaked, smooth domes;
- LA/RA PV loops to preserve readable raw reservoir/booster structure;
- MVF/TVF to be clean normal-sinus E/A biphasic inflows without a third
  dominant forward wave;
- LAP/RAP to have physiologic a/v wave and x/y descent timing, with atrial
  active/kick timing late in the beat rather than early.

Future disease profiles should reuse the same checker with different profile
rules. Examples: AF should allow no A wave; HFpEF may allow an L-wave; mitral
stenosis should allow prolonged inflow. Normal-sinus checks must not be used
as universal disease checks.

## Runtime Contract

Core API:

```ts
morphologyCheckSummaryFromSamples(samples, {
  profileId: "normal_sinus_default",
})
```

The summary emits:

- overall status: `ok`, `warning`, `failed`, or `pending`;
- badges for `LV PV`, `RV PV`, `LA PV`, `RA PV`, `MVF`, `TVF`, `LAP`, `RAP`;
- per-check metrics and messages.

Workbench reads the same summary from the live raw sample buffer and displays a
header Morphology badge. The report runner records the same summary in
`VerificationReport.morphology`. Subagents should summarize this JSON; they
must not override deterministic pass/fail by visually inspecting screenshots.

## Phase 5BN Claim Boundary

Phase 5BN only adds the reusable checker, UI badge, runtime-mode wiring, and
artifact runner, plus a live runtime parameter-patch persistence fix. It does
not tune LandAtrial, valves, root/Zc, qDot clamps, Tref/source stress, or
official cases.

Known bad shapes such as a double-humped LV systolic PV-loop limb, tri-peaked
MVF, abnormal LAP shape, or early LA kick should be recorded as morphology
failures rather than justified by target-distance improvement. LandAtrial
parameter work should resume only against this reusable checker and the
standing LandAtrial floor/isolated bench evidence.

Runtime closure equivalence matters. The same user-0 staged runtime closure
must be inspectable in Workbench and in headless artifacts. Runtime patches such
as LandAtrial AV-plane geometry must survive live `setImmediateParameters()`
updates unless a caller explicitly overrides the same leaf. AV-lead behavior is
guarded by a runtime LandAtrial regression test; do not add another atrial phase
shift unless that test fails under the intended closure.

## Phase 5BO Attribution

Phase 5BO reuses this checker as the judge for a closure-local ablation matrix:

- user-0 default;
- user-0 default with current/no-boundary root/Zc;
- user-0 default with LandAtrial AV-plane gain disabled;
- LV+RV Land with legacy atria under sourced and current root/Zc;
- LV-only Land with legacy RV/atria under sourced and current root/Zc;
- frozen legacy active-stress rollback.

The result is diagnostic, not a fix. It localizes the gross LV systolic dome and
MVF failures away from LandAtrial tuning: LV-only Land already reproduces the
LV PV failure and the MVF third wave, while frozen legacy has single-peaked
LV/RV PV checks and biphasic MVF. Root/Zc current-vs-sourced ablation does not
remove the failures, and disabling the LandAtrial AV-plane gain does not remove
the MVF third wave. Treat the next model work as LV Land plus valve/load/filling
coupling, not A1/A2 or LandAtrial parameter tuning.

The LAP/RAP pressure-timing rule remains a separate measurement hygiene gap:
frozen legacy also fails the current pressure-extrema rule, so that badge should
not be used by itself as evidence that LandAtrial timing is worse until the
pressure waveform rule is split or tightened.
