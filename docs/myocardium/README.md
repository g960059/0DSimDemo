# Myocardium model documentation

Status: current contracts and reproducible scientific evidence

Git history is the archive for superseded phase plans, decision diaries,
candidate reports, and rejected experiments. The working tree retains only
material that constrains the active model or a current scientific gate.

## Runtime boundary

The active Studio release uses the transactional typed-authority Session in
`engine/vnext/MainWireIntegratedTypedAuthoritySessionV1.ts`. One accepted image
owns circulation, mechanics, rhythm/calcium, coronary autoregulation, device
state, clocks, and checkpoints. The existing 30-volume coupled solve with
statically condensed TriSeg mechanics remains the production numerical
authority.

The object-oriented integrated Session and component reference solvers remain
available at cold analysis, checkpoint rehydration, and scientific comparison
boundaries. They are not a second Studio data model and must not become a
production fallback for the active exact release.

Current entry points include:

- `engine/vnext/MainWireIntegratedTypedAuthoritySessionV1.ts` — accepted-state
  and checkpoint authority used by Standard-63;
- `engine/myocardium/MainWireIntegratedModelTransactionV3.ts` — canonical
  model-owned transaction semantics and cold reference boundary;
- `engine/myocardium/MainWireIntegratedModelCheckpointV3.ts` — numerical
  checkpoint contract;
- `engine/myocardium/MainWireIntegratedModelOutputRegistryV3.ts` — primitive
  outputs and complete-beat metrics;
- `engine/myocardium/MainWireIntegratedModelCanonicalSequenceV3.ts` —
  canonical comparison sequence;
- `engine/myocardium/MainWireFiveWallCoronaryTransactionV3.ts` — coupled
  five-wall/coronary transaction; and
- `runtime/executionPlan` plus `engine/executionPlan` — compiled state,
  topology, workspace, and integer-schedule binding.

The active exact model exposes 57 numeric controls, 173 outputs, and four graph
definitions through the separate Workbench Surface. Standard-63 includes
wall-explicit mechanics, continuous four-valve areas and event-defined beat
metrics, common-pericardial and coronary disease axes, detailed accepted
hydraulic readback, and a beat-mean whole-body oxygen observer. The default
controller pane deliberately keeps eight controls: HR, TBV, SVR, PVR, venous
tone, and LVFW active-tension, calcium-decay-time, and passive-stiffness
scales. Official Articles and Snapshots exist, but they remain product content
rather than scientific model evidence.

## Scientific status

The runtime is numerically executable and supports exact Snapshot admission.
Its engine claim remains `releaseReady: false` and `simulationReady: false`.
Numerical convergence, conservation, replay identity, and focused mechanism
checks do not establish physiological or clinical validation. Product copy and
Articles must state the model’s limitations explicitly.

## Retained specifications

- [four-chamber Land/TriSeg model](model-spec/mainwire-four-chamber-land-triseg-v1.ja.md)
- [four-valve research brackets](main-wire-valve-disease-research-brackets-v1.md)
- [source registry](references/myocardium-source-registry.md)

`MainWireFourValveDiseaseResearchInputV1` is a numerical research fixture, not
a Studio Preset or durable Scenario. It has no checkpoint and is copied into a
model fixture before execution.

## Retained verification evidence

- [normal-adult periodic verification](verification/mainwire-normal-adult-five-wall-periodic-v1.ja.md)
- [Land membrane/TriSeg and pericardium verification](verification/mainwire-full-land-membrane-pericardium-v1.ja.md)
- [isolated arterial bench](verification/isolated-arterial-bench-v1.md)
- [LandAtrial isolated bench](verification/landatrial-isolated-bench-v1.md)

Checked-in data under `data/myocardium` is retained only when a current test,
verifier, or one of these specifications consumes it. Runtime eligibility and
Studio Snapshot admission are evaluated live; diagnostic result objects are
not durable myocardium content.

## Verification

Current model verification uses the `verify:scientific:integrated-*` commands
and suites declared in `vitest.suites.ts`. A reference implementation remains
only while a named replacement gate imports it. Historical verifiers and
artifact-replay suites belong in Git history.
