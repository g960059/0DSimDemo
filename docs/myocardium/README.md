# Myocardium model documentation

Status: current contracts and reproducible numerical evidence only

Git history is the archive for superseded phase plans, decision diaries,
candidate reports, and rejected experiments. They are intentionally absent
from this tree so they cannot be mistaken for the current implementation.

## Runtime entry points

- `engine/myocardium/MainWireIntegratedModelTransactionV3.ts` owns the current
  integrated atomic transaction.
- `engine/myocardium/MainWireIntegratedModelCheckpointV3.ts` owns its exact
  checkpoint contract.
- `engine/myocardium/MainWireIntegratedModelRuntimeV3.ts` and
  `engine/myocardium/MainWireIntegratedModelSessionV3.ts` own the canonical
  regular-sinus/all-off development runtime used by Studio.
- `engine/myocardium/MainWireIntegratedModelOutputRegistryV3.ts` owns the
  initial registered output surface.
- `engine/myocardium/MainWireIntegratedModelCanonicalSequenceV3.ts` owns the
  canonical execution sequence.
- `engine/myocardium/runtimeActiveSource.ts` and
  `engine/myocardium/runtimeRootZc.ts` contain the current runtime selections.
- `engine/myocardium/MainWireFiveWallCoronaryTransactionV3.ts` is the current
  coronary transaction boundary.

The exact experimental V3 development package is the Studio default and live
Workbench runtime. It is not release-ready or simulation-ready, exposes no
portable controls yet, and ships no authored product content. Product
experiments, lesson pages, and reusable `ScenarioPreset` records are authored
only after deliberate promotion of that boundary.

## Retained specifications

- [four-chamber Land/TriSeg model](model-spec/mainwire-four-chamber-land-triseg-v1.ja.md)
- [four-valve research brackets](main-wire-valve-disease-research-brackets-v1.md)
- [source registry](references/myocardium-source-registry.md)

`MainWireFourValveDiseaseResearchInputV1` is a numerical fixture input derived
from one or more research brackets. It is not a Studio `ScenarioPreset`; it has
no checkpoint and is copied into a simulation fixture before execution.

## Retained verification evidence

- [normal-adult periodic verification](verification/mainwire-normal-adult-five-wall-periodic-v1.ja.md)
- [Land membrane/TriSeg and pericardium verification](verification/mainwire-full-land-membrane-pericardium-v1.ja.md)
- [isolated arterial bench](verification/isolated-arterial-bench-v1.md)
- [LandAtrial isolated bench](verification/landatrial-isolated-bench-v1.md)

Checked-in data under `data/myocardium` is retained only when a current test,
verifier, or the documents above consume it. Runtime eligibility and Studio
snapshot qualification are evaluated live; they are not durable myocardium
objects.

## Verification commands

Current model verification uses the `verify:scientific:integrated-*` commands
and the test suites declared in `vitest.suites.ts`. Historical phase verifiers
and artifact-replay suites live only in Git history.
