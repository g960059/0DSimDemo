# CONTENT-0001 — PV loop basics pilot

Status: binding content acceptance plan; authoring not yet complete

Date: 2026-08-09

## 1. Outcome

The first CircleHeart Article teaches how preload, afterload and contractility
change the left-ventricular pressure-volume loop. It is also the acceptance
test for the active Standard exact model/Surface bundle, Snapshot admission,
Article Briefing and the Reader-to-Experiment-Session path.

Completion means that the ordinary Experiment Session creates an admitted
Snapshot, the ordinary Article Editor places and publishes it, and at least
three real learner sessions are observed. A headless artifact alone is not
completion.

## 2. Audience and learning objective

Primary audience: junior residents and clinical engineers meeting PV loops for
the first time. The Article must remain useful to experienced clinicians
without exposing repository IDs, codecs, lifecycle stages or implementation
terminology.

After reading and interacting, a learner should be able to:

1. identify EDV, ESV, stroke volume and loop area;
2. predict the direction of change caused by isolated preload, afterload and
   contractility interventions; and
3. explain why a model response is an illustration under stated assumptions,
   not a patient-specific clinical prediction.

## 3. Experiment design

Create one saved Experiment through `/experiments/new`, using the normal
Scenario Manager and controls:

| Scenario | Isolated authored change | Intended comparison |
| --- | --- | --- |
| Baseline | registered defaults | reference |
| Increased preload | total blood volume 6,200 mL | EDV and SV direction |
| Increased afterload | systemic resistance 1.20 | ESP and SV direction |
| Increased contractility | global contractility 1.20 | systolic envelope and SV direction |

These values are teaching inputs, not clinical cutoffs. Duplicate/add
Scenarios, apply the controls, inspect the transition and measured output, then
capture through the common Snapshot admission path.

The authored Surface contains one LV PV-loop graph and only the controls and
outputs needed for the lesson. Briefing may pick a smaller Reader projection,
but may not substitute a different numerical Scenario.

AI may help draft prose, labels, presentation settings and repeated content
operations. It uses the same Experiment/Article authority. There is no recipe,
generated official-content database or alternate Editor.

## 4. Scientific review checks

Before publication, inspect accepted-step/cycle evidence and record whether:

1. increased preload increases EDV and stroke volume;
2. increased afterload increases end-systolic pressure and decreases stroke
   volume; and
3. increased contractility produces the expected leftward/steeper systolic
   response and increased stroke volume.

These are bounded content claims, not a global clinical-validation claim. If
the same checks recur across several Articles, they can then become versioned
executable evaluation helpers.

## 5. Article outline

1. A short orientation to axes and one cardiac cycle.
2. Baseline versus increased preload.
3. Baseline versus increased afterload.
4. Baseline versus increased contractility.
5. A compact comparison and prediction prompt.
6. Limitations and “what the model does not claim”.

One briefed graph stays inflow; richer comparisons may use peek. Both preserve
the exact graph settings captured by the author.

## 6. Required limitations

The published Article states in ordinary language:

- this is a deterministic closed-loop teaching model, not a fitted patient;
- the first release does not model autonomic/baroreflex compensation;
- isolated controls deliberately hold other authored inputs fixed;
- qualitative directions do not establish clinical diagnostic thresholds;
  and
- physiological/clinical validation remains scoped per claim.

## 7. Release gates

All gates are required:

- the active exact model and compatible Surface resolve together;
- the exact model and Snapshot-pinned Surface are both `stable`;
- the three review checks have measured accepted-step/cycle evidence;
- common Snapshot admission passes for every Scenario;
- the Snapshot retains its exact model and Surface pins;
- Article Reader opens it and fullscreen enters an Experiment Session; and
- no user-facing page exposes internal release IDs or schema/codec details.

## 8. Pilot

Run three to five supervised sessions with junior residents or clinical
engineers. Record task completion, incorrect predictions, moments of UI
hesitation and spontaneous questions. An observation note is enough; telemetry
is not a prerequisite.

Exit requires at least three completed sessions and one review note that sorts
findings into “fix before Article 2” or “backlog”.

## 9. Deferred work

Baroreflex, patient fitting, broad case generation, drop-in succession and
general clinical claims are outside this milestone.

## 10. Current implementation checkpoint

The Standard exact model, compatible Surface, persistent Workers, Snapshot
admission, Briefing and Reader Session path exist. The next action is to author
this Experiment and Article in the normal UI. The typed authoring CLI should be
used only where it is genuinely helpful. Any repeated numerical adjustment
observed during this work is documented before a browser/Node/Cloud execution-
host command automates it.
