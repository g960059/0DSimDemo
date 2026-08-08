# CONTENT-0001 — PV loop basics pilot

Status: binding content acceptance plan; local numerical slice implemented;
not yet registered or published

Date: 2026-08-07

## 1. Outcome

The first official CircleHeart article teaches how preload, afterload, and
contractility change the left-ventricular pressure-volume loop. It is also the
acceptance test for the Standard exact-model ABI, Model Surface resolution,
official-content build, Snapshot admission, Article Briefing, and Reader
session path.

The milestone is complete only when one model-family recipe builds against a
`stable` Standard-ABI exact model and a `stable` Model Surface, produces an
admitted Snapshot, is published in an Article, and is observed in at least
three real learner sessions. A validated recipe without that vertical path is
not completion.

## 2. Audience and learning objective

Primary audience: junior residents and clinical engineers encountering PV
loops for the first time. The article must remain useful to clinicians who
already recognize the diagram, without exposing repository IDs, codecs,
release stages, or implementation terminology.

After reading and interacting, a learner should be able to:

1. identify EDV, ESV, stroke volume, and the loop area;
2. predict the direction of change caused by isolated preload, afterload, and
   contractility interventions; and
3. explain why a model response is an illustration under stated assumptions,
   not a patient-specific clinical prediction.

## 3. Experiment design

The Git source of truth is
`content/official/pv-loop-basics-v1.experiment.json`. It contains four stable
Scenario identities:

| Scenario | Isolated authored change | Intended comparison |
| --- | --- | --- |
| Baseline | registered defaults | reference |
| Increased preload | total blood volume 6,200 mL | EDV and SV direction |
| Increased afterload | systemic resistance 1.20 | ESP and SV direction |
| Increased contractility | global contractility 1.20 | systolic envelope and SV direction |

Values are executable teaching inputs within the registered control domain;
they are not clinical cutoffs. The build starts each Scenario from the exact
release's registered default fixture, applies these absolute assignments,
settles through the model-owned content runner, evaluates all named scientific
assertions, and then uses the common Snapshot admission service.

The first authored Experiment Surface contains one LV PV-loop graph and only
the three controls needed by the lesson. EDV, ESV, and stroke volume are
model-owned build evidence for the release assertions; exposing them later as
Reader outputs requires immutable derived-output definitions and is not
silently implied by this recipe. Article Briefing may pick a smaller Reader
projection, but may not substitute a different graph definition or numerical
Scenario.

## 4. Scientific assertions

Assertion IDs are model-family-owned executable checks. They are not prose
claims and are not inferred from presentation frames.

1. `circleheart.main-wire.pv-loop.preload-direction.v1`
   compares baseline with increased preload and requires increased EDV and
   increased stroke volume.
2. `circleheart.main-wire.pv-loop.afterload-direction.v1`
   compares baseline with increased afterload and requires increased
   end-systolic pressure and decreased stroke volume.
3. `circleheart.main-wire.pv-loop.contractility-direction.v1`
   compares baseline with increased contractility and requires a leftward or
   steeper systolic-envelope response together with increased stroke volume.

Each implementation must consume model-owned accepted-step/cycle evidence and
emit its measured values in the build report. Presentation-frame decimation,
visual inspection, or a hard-coded “passed” receipt cannot satisfy the gate.

## 5. Required release capabilities

The first Standard-ABI exact model must expose, at minimum:

- exact fixture/checkpoint restore and accepted-boundary capture;
- primitive controls for total blood volume, systemic resistance, and global
  contractility;
- primitive LV pressure, LV volume, and cycle-phase signals; and
- the numerical evidence stream needed by the three assertions.

The first Model Surface must expose the LV pressure-volume graph and the three
controls above. The current `development-36` compatibility package does not
expose global contractility as a Studio control and therefore cannot build
this recipe. The article must not be weakened or silently rebound to another
control to make the old package pass.

The first checked Model Surface source is
`studio/integrations/mainWireIntegratedV3/model-surface-standard-v1.json`.
Its presence is not a release claim: it becomes publishable only after an
actual Standard exact model materializes all referenced capabilities and both
releases complete their registry lifecycle.

## 6. Article outline

1. A short orientation to axes and one cardiac cycle.
2. Baseline versus increased preload.
3. Baseline versus increased afterload.
4. Baseline versus increased contractility.
5. A compact comparison and prediction prompt.
6. Limitations and “what the model does not claim”.

The first Reader placement should keep the graph visible in-flow when one
graph is briefed. A richer comparison may use peek, preserving the exact graph
settings captured by the author.

## 7. Required limitations

The published article must state, in ordinary language:

- this is a deterministic closed-loop teaching model, not a fitted patient;
- the first release does not model autonomic/baroreflex compensation;
- isolated controls deliberately hold other authored inputs fixed;
- qualitative directional assertions do not establish clinical diagnostic
  thresholds; and
- formal physiological/clinical validation remains scoped per claim.

## 8. Release gates

All gates are required:

- recipe validation and repository assertion-ID resolution;
- Standard-ABI exact-model and compatible Model Surface resolution;
- `stable` exact model and `stable` pinned Surface;
- all three executable scientific assertions pass with measured evidence;
- common Snapshot admission passes for every Scenario;
- generated content is reproducible from recipe + exact release + Surface;
- Article Reader opens the pinned Snapshot and fullscreen opens an
  Experiment Session; and
- no user-facing page exposes internal release IDs or schema/codec details.

## 9. Pilot

Run three to five supervised sessions with junior residents or clinical
engineers. Record task completion, incorrect predictions, moments of UI
hesitation, and spontaneous questions. Do not add telemetry infrastructure as
a prerequisite; an observation note is sufficient for the first pilot.

The pilot exit condition is at least three completed real sessions and one
review note that classifies findings as “fix before article 2” or “backlog”.

## 10. Deferred work

Baroreflex, patient fitting, broad official-case catalogs, drop-in succession,
and generalized clinical claims are outside this milestone. They are not
prerequisites for publishing this bounded open-loop lesson.

## 11. Current implementation checkpoint

The repository now contains the first Standard-ABI exact model and compatible
Model Surface needed by this lesson. The exact model adds a bounded global
ventricular-contractility primitive while leaving the historical
`development-36` release untouched. Its Workbench control transition preserves
the accepted revision, time, circulation state, and mechanics material memory;
the compatible target provider owns the subsequent accepted steps.

The first model-family runner is executable with:

```sh
npm run build:content:official:main-wire -- \
  --recipe content/official/pv-loop-basics-v1.experiment.json \
  --output dist/official/pv-loop-basics-v1.build.json
```

It runs all four Scenarios numerically, obtains periodic candidates, evaluates
the three assertions from model-owned beat evidence, calls common Snapshot
admission for every Scenario, and writes a deterministic immutable build
artifact. This is local acceptance evidence only. The exact release and Surface
remain `dev`; stable registry admission, Article publication, Reader QA, and
the learner pilot are still required by section 8.
