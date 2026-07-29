# INTEGRATED-MODEL-0004: browser lane scope for `MainWireIntegratedModelTransactionV3`

Status: scope study. This is not a design approval, an implementation plan of
record, a release record, or evidence of any kind about physiology, numerics,
or browser readiness. It records what the code currently binds and what a V3
browser lane would therefore have to own.

Provenance: produced by codex 5.6 sol against `1039e6df` on 2026-07-28, then
spot-checked against the source. The findings independently re-verified so far
are the accepted-revision/presentation-grid mismatch in section Q1, the
`coronaryCirculationIncluded: false as const` binding, and the exhaustive
result that no file under `studio/` or `components/` imports V3. Everything
else remains as written by its author, including the limits it records in Q6.


Date: 2026-07-28
Scope only: no implementation is included.

## Executive answer

This is **(b), a parallel session type**, at the large end of that category: a second scientific session, worker protocol/host, observation projection, and capability-aware Studio live-lane adapter. It is not a transaction-provider swap.

The existing `MainWireScientificSessionV1` is not generic over a transaction. It imports the non-coronary transaction and calls its step function directly (`engine/scientific/runtime/MainWireScientificSessionV1.ts:1-12`, `engine/scientific/runtime/MainWireScientificSessionV1.ts:904-920`); its public claim fixes the non-coronary assembly and makes `coronaryCirculationIncluded` the literal type `false` (`engine/scientific/runtime/MainWireScientificSessionV1.ts:116-145`); and its accepted-state alias, checkpoint fields, periodic tracker, observation DTO, release loader, controls, and assertions all use the non-coronary shapes (`engine/scientific/runtime/MainWireScientificSessionV1.ts:147-224`, `engine/scientific/runtime/MainWireScientificSessionV1.ts:383-427`, `engine/scientific/runtime/MainWireScientificSessionV1.ts:1100-1256`, `engine/scientific/runtime/MainWireScientificSessionV1.ts:1557-1771`, `engine/scientific/runtime/MainWireScientificSessionV1.ts:1794-2119`).

There is also a timing incompatibility above the session. V3 can clip a requested step at coronary or rhythm event boundaries (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:314-375`) and rejects a caller that crosses such a boundary (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:404-419`). Studio currently equates accepted revision with a uniform 2 ms grid: phase is `revision % 500` (`studio/contracts/v1/runtime.ts:31-60`), and exact replay requires each accepted revision to advance exactly 0.002 s (`studio/adapters/mainWire/MainWireExactSignalReplayWorkerV1.ts:427-471`). Therefore the V3 lane needs an operation meaning **advance through any internal event substeps to a requested presentation-grid time**, not an assumption that one transaction commit always equals one 2 ms presentation sample.

It is not structurally worse than a parallel lane because V3 already has the essential numerical ownership:

- a complete accepted tuple containing coronary, composed-rhythm, and dynamic-MCS state (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:151-158`);
- cold initialization, boundary limiting, atomic step/rollback, and dynamic-MCS conservation validation (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:254-311`, `engine/myocardium/MainWireIntegratedModelTransactionV3.ts:314-525`);
- an exact, context-bound checkpoint for all three owners (`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:99-189`, `engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:191-289`); and
- a canonical-provider regular-sinus/HeartMate-II one-cycle smoke with exact mid-cycle resume (`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:110-177`, `__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:238-400`).

I reran that V3 smoke in this checkout; it passed. I also reran the existing session/direct-noncoronary lockstep test; it passed. Those tests establish the present wiring facts and the bounded V3 execution seam. They do not establish browser readiness, long-term physiology, release readiness, or realtime performance.

## Q1. Is “add coronary and it goes in” approximately true?

No. The correct classification is **(b), a parallel session type**.

“Parallel session type” here must be read as more than adding one class behind the current `MainWireStudioSessionHostV1`. That host makes controls, periodic settlement, and V4 checkpointing mandatory methods and fixes its observation and checkpoint types (`studio/adapters/mainWire/MainWireStudioSessionHostV1.ts:26-67`, `studio/adapters/mainWire/MainWireStudioSessionHostV1.ts:69-113`). The current worker kernel likewise stores only `MainWireScientificSessionV1` in its session map (`engine/scientific/worker/MainWireScientificInProcessKernelV1.ts:214-239`) and projects every session through the current observable registry (`engine/scientific/worker/MainWireScientificInProcessKernelV1.ts:2207-2233`).

The required shape is:

1. Keep `MainWireScientificSessionV1` as the non-coronary 0.2.0 session.
2. Add a V3-specific scientific session that owns the integrated transaction’s dependencies, fixed regular-sinus configuration, MCS configuration/profile, accepted tuple, boundary-substep loop, observation readback, and V3 checkpoint context.
3. Put the substitution seam above those two concrete sessions, at a Studio live-lane driver/factory selected by an explicit model-lane discriminator and accompanied by explicit capabilities.
4. Keep the V1 persisted artifacts and exact replay path bound to the current non-coronary lane. Add new versioned types later where V3 persistence or exact replay is genuinely implemented.

Calling this (a) would understate the work and invite unsafe widening of old checkpoint and release types. Calling it (c) would overstate the numerical problem: no new cardiovascular equation assembly is required merely to run the already-existing V3 transaction in a Worker. The structural work is product/runtime ownership around an existing transaction.

The repository reachability check also confirms that V3 has no browser path to “switch on.” Its complete production import surface is the V3 checkpoint (`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:24`), the two experiment drivers (`engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3.ts:16`, `engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts:35`), and the external-AF wrapper (`engine/myocardium/MainWireIntegratedModelExternalAfTransactionV1.ts:17`). No production file under `studio/` or `components/` imports it. The two additional direct imports are tests (`__tests__/mainWireIntegratedModelTransactionV3.test.ts:45`, `__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:44`). This is an exhaustive `rg` result, not an inference.

## Q2. Where the non-coronary lane leaks, and the narrowest seam

### 2.1 Complete leak inventory inside `MainWireScientificSessionV1.ts`

The following list groups adjacent occurrences by responsibility. It covers the entire file, not just the direct step call.

| Area | File:line evidence | Binding and consequence |
|---|---|---|
| Imports | `engine/scientific/runtime/MainWireScientificSessionV1.ts:1-44` | Imports the non-coronary runtime params, initialize/step/checkpoint/restore functions, non-coronary diagnostic sampler and periodic comparator, fixed periodic calcium, canonical provider, and non-coronary release loader. |
| Public claim | `engine/scientific/runtime/MainWireScientificSessionV1.ts:116-145` | Claims one fixed five-wall/non-coronary vertical slice; fixes the assembly and 15-node circulation strings; types `coronaryCirculationIncluded: false as const` and `deviceGraphIncluded: false as const`. Flipping those values would make the existing claim false rather than make the implementation coronary-aware. |
| State and observation types | `engine/scientific/runtime/MainWireScientificSessionV1.ts:147-224` | `AcceptedState` is `MainWireFiveWallNonCoronaryAcceptedStateV1`; the observation DTO is a fixed central-hemodynamic shape; periodic tracker boundaries and legacy exact checkpoints store `MainWireFiveWallNonCoronaryCheckpointV1`. |
| Control and periodic result types | `engine/scientific/runtime/MainWireScientificSessionV1.ts:290-388` | Fork receipts assume named non-coronary owners; closure/periodicity types come from the non-coronary comparator; dependencies contain `NonCoronaryCirculationRuntimeParamsV1` and the fixed calcium prior. |
| Private fields and constructor | `engine/scientific/runtime/MainWireScientificSessionV1.ts:399-427` | The private state and dependency fields are the concrete aliases above, so a provider parameter alone would not change the state owner. |
| Construction and restore | `engine/scientific/runtime/MainWireScientificSessionV1.ts:469-613` | Canonical construction loads release 0.2.0; V2, scientific-session V3, and V4 restore paths all call `restoreMainWireFiveWallNonCoronaryV1`. |
| State identity and analysis capsules | `engine/scientific/runtime/MainWireScientificSessionV1.ts:616-670` | Identity and hemodynamic job capsules reach into `acceptedState.circulation.totalBloodVolumeMl` and store a non-coronary transaction checkpoint. |
| State-preserving control fork | `engine/scientific/runtime/MainWireScientificSessionV1.ts:678-861` | The fork checkpoints/restores the non-coronary state, applies only the current dependency overlay, and claims preservation only for the existing circulation/mechanics owners. It has no composed-rhythm, coronary-autoregulation, or accepted dynamic-MCS owner in its receipt. |
| Step and diagnostics | `engine/scientific/runtime/MainWireScientificSessionV1.ts:873-1038` | Periodic settlement drives the current step loop; `stepInternal` directly calls `stepMainWireFiveWallNonCoronaryV1` at line 911; accepted diagnostics and periodic comparisons use non-coronary readback/comparator functions. |
| Exact checkpoints | `engine/scientific/runtime/MainWireScientificSessionV1.ts:1100-1185` | Legacy V2, scientific-session V3, and V4 exports all embed `checkpointMainWireFiveWallNonCoronaryV1`; `checkpointExact()` is only an alias to the non-coronary scientific-session V3 envelope. |
| Cold initialization | `engine/scientific/runtime/MainWireScientificSessionV1.ts:1229-1256` | Calls `initializeMainWireFiveWallNonCoronaryV1` and consumes the 15-node resolved initialization. |
| Periodic tracker | `engine/scientific/runtime/MainWireScientificSessionV1.ts:1303-1549` | Stores/restores non-coronary boundary checkpoints and classifies non-coronary accepted-state observations. This cannot silently become the V3 all-owner periodic comparator. |
| Release, codec, dependencies, controls | `engine/scientific/runtime/MainWireScientificSessionV1.ts:1557-1771` | Accepts only the canonical non-coronary release, hard-codes the non-coronary transaction checkpoint ID, builds fixed-periodic dependencies, overlays only current circulation/pericardium targets, and asserts aliases through `.circulation`/`.mechanics`. |
| Observation and restore assertions | `engine/scientific/runtime/MainWireScientificSessionV1.ts:1794-2119` | Cold, accepted-step, and restored observations read the non-coronary node volumes and valve memories directly; checkpoint and observation assertions require the same central state shape. |

### 2.2 The binding continues outside the session

These are the downstream points on the current browser path that constrain substitutability.

| Layer | File:line evidence | Constraint |
|---|---|---|
| Resolved input | `engine/scientific/inputs/MainWireScientificResolvedSessionInputV1.ts:1-7`, `engine/scientific/inputs/MainWireScientificResolvedSessionInputV1.ts:64-120` | The input type contains non-coronary node names, non-coronary runtime params, the fixed-periodic calcium drive, and the non-coronary initialization protocol. V3 needs rhythm, coronary prior/disease/collapse/autoregulation, global blood volume, MCS config, and MCS profile identities. |
| Scientific-session exact checkpoint V3 | `engine/scientific/runtime/MainWireScientificExactCheckpointV3.ts:20-65`, `engine/scientific/runtime/MainWireScientificExactCheckpointV3.ts:161-278` | Despite the name “V3,” this envelope fixes `assembly: "fixed-normal-adult-five-wall-noncoronary"` and validates the non-coronary transaction/checkpoint IDs. It is unrelated to `MainWireIntegratedModelCheckpointV3`. |
| Scientific-session exact checkpoint V4 | `engine/scientific/runtime/MainWireScientificExactCheckpointV4.ts:29-102`, `engine/scientific/runtime/MainWireScientificExactCheckpointV4.ts:241-363`, `engine/scientific/runtime/MainWireScientificExactCheckpointV4.ts:371-434` | V4 fixes the non-coronary assembly/codec, V0 control state, fixed calcium phase, non-coronary transaction, and non-coronary periodic tracker. |
| Observable registry | `engine/scientific/observables/MainWireScientificObservableRegistryV1.ts:71-110`, `engine/scientific/observables/MainWireScientificObservableRegistryV1.ts:127-173`, `engine/scientific/observables/MainWireScientificObservableRegistryV1.ts:191-274` | The 34-entry catalog is projected from the current session observation. Coronary total flow and LVAD flow are explicitly `not-modeled` placeholders. |
| Worker command protocol | `engine/scientific/worker/scientificCommandProtocolV1.ts:149-174`, `engine/scientific/worker/scientificCommandProtocolV1.ts:293-405`, `engine/scientific/worker/scientificCommandProtocolV1.ts:465-575` | State identity includes the current TBV interpretation; origins and success payloads carry the current input, control state, scientific-session V3/V4 checkpoint, periodic result, and current frame types. |
| Worker kernel | `engine/scientific/worker/MainWireScientificInProcessKernelV1.ts:214-239`, `engine/scientific/worker/MainWireScientificInProcessKernelV1.ts:870-986`, `engine/scientific/worker/MainWireScientificInProcessKernelV1.ts:1150-1367`, `engine/scientific/worker/MainWireScientificInProcessKernelV1.ts:2207-2233` | Stores the concrete session class; invokes its `step`, V3/V4 checkpoint/restore, settlement and analyses; projects only the current registry. |
| Scientific side-analysis protocols | `engine/scientific/protocols/MainWireScientificHemodynamicJobV2.ts:8-9`, `engine/scientific/protocols/MainWireScientificHemodynamicJobV2.ts:176-190`; `engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1.ts:22-23`, `engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1.ts:77-77`, `engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1.ts:1123-1123`; `engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2.ts:2-3`, `engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2.ts:45-45`, `engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2.ts:1250-1250`; `engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3.ts:2-3`, `engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3.ts:70-70`, `engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3.ts:1157-1157`; `engine/scientific/protocols/MainWireScientificTbvContinuationSeedPredictorV1.ts:11-11`, `engine/scientific/protocols/MainWireScientificTbvContinuationSeedPredictorV1.ts:40-42` | Hemodynamic/PV/TBV jobs accept a non-coronary checkpoint or accepted state and, for the hemodynamic and PV protocols, directly invoke the non-coronary transaction. They are separate V3 adaptations, not capabilities inherited by swapping the live session. |
| Studio session host | `studio/adapters/mainWire/MainWireStudioSessionHostV1.ts:26-67`, `studio/adapters/mainWire/MainWireStudioSessionHostV1.ts:69-113` | Every hosted session must have the V0 control state/current frame and must implement `restoreV4`, `forkControl`, `settlePeriodic`, and `checkpointV4`. Those are not optional capabilities. |
| Studio runtime contract | `studio/contracts/v1/runtime.ts:31-75`, `studio/contracts/v1/runtime.ts:273-336`, `studio/contracts/v1/runtime.ts:383-411` | Presentation is a fixed 2 ms/1 s revision grid; opening requires run/input/snapshot refs; every control intent is documented as going to both live and strict lanes; successful strict work returns a converged candidate. |
| Studio runtime adapter | `studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:362-425`, `studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:608-769`, `studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:990-1123`, `studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:1257-1315` | Open always loads the current resolved input and V1 snapshot then restores V4; target intents fork current controls into live and strict hosts; strict success writes a V1 snapshot/run. |
| Adapter assertions and rotation | `studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:2072-2148`, `studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:2740-2782`, `studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:2796-2963` | Live host rotation is V4-checkpoint based; strict receipts inspect the current transaction circulation and periodic evidence/IDs. Rotation is required before 90,000 requests (`studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:148-153`). |
| Snapshot envelope | `studio/adapters/mainWire/MainWireStudioSnapshotEnvelopeV1.ts:1-62`, `studio/adapters/mainWire/MainWireStudioSnapshotEnvelopeV1.ts:118-209`, `studio/adapters/mainWire/MainWireStudioSnapshotEnvelopeV1.ts:244-320` | Stores exactly a current V4 checkpoint and current 34-observable seed, reconstructs only release 0.2.0/non-coronary codec identity, and emits a non-coronary solver/execution identity. |
| Replay checkpoint and exact worker | `studio/adapters/mainWire/MainWireStudioReplayCheckpointEnvelopeV1.ts:1-42`, `studio/adapters/mainWire/MainWireStudioReplayCheckpointEnvelopeV1.ts:118-176`, `studio/adapters/mainWire/MainWireExactSignalReplayWorkerV1.ts:54-63`, `studio/adapters/mainWire/MainWireExactSignalReplayWorkerV1.ts:111-312` | Replay origins restore V4 from a non-coronary envelope on a current host and advance at fixed 0.002 s. |
| Exact export contract | `studio/contracts/v1/export.ts:41-54`, `studio/contracts/v1/export.ts:97-120`, `studio/contracts/v1/export.ts:132-160` | The artifact promises a 0.002 s, stride-1 exact grid, validated accepted-step revision/time continuity, no interpolation, and same-recipe/same-build determinism. A decimated V3 chart stream cannot satisfy this contract. |
| V1 run artifact | `studio/contracts/v1/artifacts.ts:60-82` | A normal run artifact asserts `steadyStatus: "converged"`, `numericalHealth: "passed"`, and `snapshotIsWarmRestartable: true`. A live-only exploratory V3 source must not be encoded as this type. |
| Product bootstrap | `components/scientificProduct/ScientificProductStudioBootstrapV1.ts:75-82`, `components/scientificProduct/ScientificProductStudioBootstrapV1.ts:128-179`, `components/scientificProduct/ScientificProductStudioBootstrapV1.ts:208-280` | Bootstrap settles the current model, exports V4, writes the current snapshot, and mints the V1 converged/warm-restartable run before opening a branch. |
| Product case/release catalogs | `components/scientificProduct/scientificProductCaseCatalogV1.ts:10-62`, `components/scientificProduct/scientificProductCaseCatalogV1.ts:64-113`; `components/scientificProduct/ScientificProductReleaseBundleRegistryV1.ts:207-244`, `components/scientificProduct/ScientificProductReleaseBundleRegistryV1.ts:250-274` | Cases are only the current official/research non-coronary cases. The product bundle allowlist contains exactly the current release. The generic catalog-slot type at `components/scientificProduct/ScientificProductReleaseBundleRegistryV1.ts:53-92` is a useful product-level extension point, but the current concrete bundle is not heterogeneous. |
| Product frame projection | `components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1.ts:31-81`, `components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1.ts:181-235` | Rebuilds only the current 34-entry frame and actively rejects a supplied value for an observable catalogued as `not-modeled`. |
| Derived metrics/workbench cycles | `engine/scientific/metrics/MainWireScientificDerivedMetricRegistryV1.ts:351-388`, `engine/scientific/metrics/MainWireScientificDerivedMetricRegistryV1.ts:468-507`; `engine/scientific/metrics/MainWireScientificTransientMetricAccumulatorV1.ts:57-76`; `components/scientificWorkbench/scientificWorkbenchTerminalCycleV1.ts:24-44`, `components/scientificWorkbench/scientificWorkbenchTerminalCycleV1.ts:76-135` | Terminal cycles, transient beats, and their metrics are typed to the current observable frame and its fixed cadence/revision evidence. They cannot be advertised for the minimal V3 frame without a separate catalog/cycle contract. |

### 2.3 Claims, tests, and checked-in persisted artifacts that lock the behavior

The following tests are not incidental fixtures; they assert the bindings above:

- `__tests__/mainWireScientificSessionV1.test.ts:80-85` asserts the fixed non-coronary session claim; `__tests__/mainWireScientificSessionV1.test.ts:88-180` asserts the canonical non-coronary release and transaction checkpoint path.
- `__tests__/mainWireScientificSessionLockstepV1.test.ts:29-73` directly compares the session against `stepMainWireFiveWallNonCoronaryV1`.
- `__tests__/mainWireScientificExactCheckpointV3.test.ts:30-59`, `__tests__/mainWireScientificExactCheckpointV3.test.ts:201-219` assert the fixed non-coronary assembly and source transaction type.
- `__tests__/mainWireScientificExactCheckpointV4.test.ts:47-124`, `__tests__/mainWireScientificExactCheckpointV4.test.ts:401-430` assert the non-coronary checkpoint ID, fixed calcium phase, V0 controls, and exact round trip.
- `__tests__/mainWireScientificObservableRegistryV1.test.ts:18-64`, `__tests__/mainWireScientificObservableRegistryV1.test.ts:110-120`, `__tests__/mainWireScientificObservableRegistryV1.test.ts:178-190` assert coronary and LVAD are `not-modeled` and lock that catalog into the release.
- `__tests__/simulationReleaseV1.test.ts:228-249` asserts the non-coronary solver, state transaction, approved protocols, and “non-coronary verified-research release” claim.
- `__tests__/studioMainWireBrowserWorkerSessionHostV1.test.ts:380-410` constructs the production host fixture exclusively from `MainWireScientificSessionV1.checkpointExactV4()`.
- `__tests__/studioMainWireRuntimeAdapterV1.test.ts:3242-3282` builds runtime fixtures by restoring V4 and settling the current session.
- `__tests__/scientificProductStudioBootstrapV1.test.ts:145-185` asserts that product bootstrap persists V4 plus the current accepted-step frame.
- `__tests__/mainWireScientificProductReleaseBundleRegistryV1.test.ts:20-53` asserts that only the exact non-coronary release resolves and that an integrated release is rejected.
- `__tests__/mainWireScientificFastTbvPreviewV1.test.ts:5-21` and `__tests__/mainWireScientificPvRelationsIntegrationV2.test.ts:6-34`, `__tests__/mainWireScientificPvRelationsIntegrationV2.test.ts:250-267` restore or step the non-coronary accepted state for current side analyses.
- `__tests__/mainWireScientificResolvedWorkerProtocolV1.test.ts:388-435` asserts the non-coronary initialization protocol in current worker origins.
- `__tests__/mainWireScientificDerivedMetricRegistryV1.test.ts:18-31` and `__tests__/scientificWorkbenchTerminalCycleV1.test.ts:8-21` build the metric/cycle assertions around the current frame and non-coronary release identity.

Checked-in persisted identity is also non-coronary:

- `engine/scientific/assembly/releases/main-wire-adult-five-wall-noncoronary-0.2.0.json:1` contains the 0.2.0 non-coronary manifest, limitations, state schema, and observable placeholders.
- `data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v1.json:1` is a scientific-session V2 checkpoint whose assembly and transaction are non-coronary.
- `data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v3.json:1` is a scientific-session V3 checkpoint, but it still embeds the non-coronary transaction and assembly.
- `data/scientific/catalogs/official-healthy-periodic-document-chain-v1.json:1`, `data/scientific/documents/cases/official-healthy-periodic-v1.json:1`, `data/scientific/documents/presets/official-healthy-periodic-v1.json:1`, and `data/scientific/presets/official-healthy-periodic-v1.json:1` persist the exact 0.2.0 non-coronary release reference.

This inventory counts files that constrain V3 substitutability on the scientific-session/browser-product path. It deliberately does not count every low-level unit test of the non-coronary solver as a “session leak.”

### 2.4 The narrowest safe seam

The seam should be a **discriminated, capability-bearing Studio live-lane driver**, above the two concrete session/worker implementations:

```text
Studio scenario
  -> lane descriptor { laneKind, identity, observableCatalog, capabilities }
     -> noncoronary-v1 driver -> existing adapter/host/kernel/session unchanged
     -> integrated-v3-experimental driver
          -> V3 browser host/kernel/session
          -> MainWireIntegratedModelTransactionV3
```

The common live surface should contain only behavior both lanes can truthfully support:

- immutable lane/execution identity;
- `observe`;
- `advanceToPresentationTime(targetTimeSec)`, which may perform one fixed non-coronary step or several V3 event-boundary substeps;
- operational checkpoint/restore for Worker rotation, with the checkpoint kept lane-opaque at the common boundary;
- `dispose`; and
- a capability DTO for controls, strict periodic settlement, persisted warm snapshots, pin/promotion, exact export, and side analyses.

It should not require a generic `step(dtSec)` contract. That would reintroduce the false one-revision/one-grid-step assumption. It should not require every driver to implement controls/settlement/export and throw later; the UI must know those capabilities before offering the actions.

Effect on existing types:

- **No change** to `MainWireScientificSessionV1`, `MainWireScientificSessionExactCheckpointV3`, `MainWireScientificSessionExactCheckpointV4`, `MainWireStudioSnapshotEnvelopeV1`, `StudioRunArtifactContentV1`, or the V1 exact-export types.
- Add a new V3 session/host/protocol rather than widening the current transaction field to a union.
- Add a new, non-persisted lane descriptor/open-result version with `laneKind` and capabilities. The current lane is one explicit member with all its current capabilities; the V3 first landing is another member with controls/settlement/persisted snapshots/exact export false.
- Use a V3 observation-frame/catalog type. Shared charts may consume a catalog-neutral presentation sample, but code that reconstructs `MainWireScientificObservableFrameV1` remains non-coronary.
- If V3 user persistence is added later, use new schema IDs/media types and an additive artifact union. Do not reinterpret existing `"snapshot-envelope"` or V1 run content.

This is narrower than parameterizing `MainWireScientificSessionV1`: it leaves all current scientific guarantees and content hashes intact and generalizes only the product orchestration that genuinely needs multiple model lanes.

## Q3. The five gaps

File counts below are scope estimates, not measured effort. “Implementation files” includes TypeScript plus checked-in JSON/catalog artifacts where relevant; tests are stated separately. Some files overlap between gaps, so the counts must not be summed as a project total.

### Gap 1: checkpointing

**What exists**

`MainWireIntegratedModelCheckpointV3` already stores the outer revision/time, coronary V3 checkpoint, complete composed-rhythm checkpoint, dynamic-MCS accepted flow state, rhythm-configuration digest, MCS profile digest, and MCS structural-hydraulic digest (`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:109-189`). Restore requires the expected provider, rhythm configuration, MCS profile/config and restores all owners exactly (`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:191-289`). That is enough for an operational V3 session restore.

The checkpoint is deliberately not a release-ready product envelope: its claim says no migration/rebase, long-term physiology not established, clinical validation false, and `simulationReady: false` (`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:88-97`).

**What is missing**

- A V3 session-level input/context identity around the transaction checkpoint.
- A browser worker command and host receipt for V3 checkpoint/restore.
- An operational host-rotation path using that checkpoint.
- A V3 Studio snapshot envelope, state-codec identity, seed-frame binding, and run-artifact semantics.
- A V3 periodic tracker if strict periodic settlement is required.
- Migration/version policy and checked-in source snapshots.

Current V4 is not a reusable outer shell: it fixes the non-coronary transaction/checkpoint and fixed-calcium phase (`engine/scientific/runtime/MainWireScientificExactCheckpointV4.ts:29-102`).

**What must be built for the full gap**

A V3 resolved input/preset identity, a V3 session checkpoint envelope, strict loader, worker commands, host methods, V3 snapshot artifact, optional periodic tracker, source/run binding, and corruption/round-trip/mismatch tests.

**What may be deferred for the first landing**

Defer user-persisted snapshots, save/pin/promotion, strict settlement checkpoints, migration, and replay-origin artifacts. Do implement in-memory V3 checkpoint/restore for Worker rotation; otherwise the “live” lane has a bounded Worker lifetime while the current product explicitly rotates hosts via exact checkpoint (`studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:2072-2148`).

The first lane may cold-start only from one Worker-owned deterministic preset. Its operational checkpoint must not be presented as a release-ready or user-portable snapshot.

**Size/difficulty**

- Full gap: roughly 7-12 implementation/artifact files plus 6-10 test files; **high** conceptual difficulty because identities and persisted compatibility are fail-closed.
- First landing subset: roughly 3-5 implementation files plus 3-4 tests; **medium-high**, mainly context identity and event-substep continuation.

### Gap 2: observable projection

**What exists**

The integrated state exposes:

- 16 conserved coronary volume nodes (`engine/coronary/typesV2.ts:49-76`);
- coronary node pressures, transmural pressures, every edge flow, territory inlet flows, total inlet/outlet flow, and continuity diagnostics (`engine/coronary/backwardEulerCoronaryNetworkV2.ts:98-169`);
- mechanics-derived intramyocardial pressure by territory/layer on each successful coronary step (`engine/myocardium/MainWireFiveWallCoronaryTransactionV2.ts:272-290`);
- four accepted rotary-device flows and MCS trial totals/conservation (`engine/devices/dynamicNetworkV1.ts:116-131`, `engine/devices/dynamicNetworkV1.ts:153-187`); and
- composed-rhythm accepted capture/deposit/queue state (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:151-158`).

The current catalog has useful core hemodynamic definitions, but it declares coronary total and LVAD flow `not-modeled` (`engine/scientific/observables/MainWireScientificObservableRegistryV1.ts:71-110`) and initializes them unavailable (`engine/scientific/observables/MainWireScientificObservableRegistryV1.ts:158-173`). The product projector rejects an available value for either placeholder (`components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1.ts:181-207`).

**What is missing**

- A V3 observable catalog and frame identity.
- A projection from cold/restored state and accepted V3 step readbacks.
- A decision about all 16 volumes, territory/layer pressures and flows, autoregulation state, MCS device flows/constraints, and rhythm events.
- UI metric/catalog mappings and availability rules.
- Seed-frame semantics after cold start or restore.

**What must be built for the full gap**

An independently versioned V3 registry, projection, product catalog slot, chart/metric presentation catalog, exact availability/quality policy, and tests that prevent zeros or stale step readbacks from being invented.

**What may be deferred for the first landing**

Expose only a recognisable, auditable minimum:

- existing core LV volume, LV/Ao pressure and central valve/hemodynamic signals needed by the current charts;
- `coronary.flow.total`;
- optionally the three territory inlet flows if they add little projection cost;
- `device.LVAD.flow`; and
- rhythm mode/cycle/capture counters as status, not as a falsely sampled ECG.

Omit, rather than falsely classify, the 16 coronary volumes, intramyocardial pressure matrix, detailed edge flows, device constraints, and most rhythm internals. The UI should say “modeled internally; not exposed by this experimental observable catalog” where useful. It must not reuse the current registry and change its `not-modeled` values at runtime.

**Size/difficulty**

- Full gap: roughly 4-8 implementation/catalog/UI files plus 4-6 tests; **medium-high**, with the difficulty in scientific meaning and accepted-state provenance rather than mapping syntax.
- First landing subset: roughly 2-4 implementation/catalog files plus 2-3 tests; **medium**.

### Gap 3: release and identity binding

**What exists**

The release framework can truthfully represent `lifecycleStatus: "development"` and `evidenceStatus: "unverified"` (`engine/scientific/release/simulationRelease.ts:21-36`). The current 0.2.0 release cannot represent V3: it is identified as adult-five-wall-noncoronary (`engine/scientific/assembly/mainWireAdultFiveWallNonCoronaryReleaseV1.ts:68-79`), lists “no coronary circulation” and “no device graph” (`engine/scientific/assembly/mainWireAdultFiveWallNonCoronaryReleaseV1.ts:184-192`), and declares coronary/device observable capabilities false (`engine/scientific/assembly/mainWireAdultFiveWallNonCoronaryReleaseV1.ts:350-367`).

V3’s own claim is explicit: `releaseReady: false`, long-term physiology not established, clinical validation false, and the AF/IABP synchronization blocker is open (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:110-119`). The active HMII smoke also asserts those false claims (`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:417-434`).

Mechanical-support configs exist as production presets, including HMII 9000 (`engine/devices/presetsV1.ts:15-51`), but the dynamic network intentionally supplies no release-approved inertance profile (`engine/devices/dynamicNetworkV1.ts:52-55`). The current V3 HMII smoke’s profile is explicitly test-only/not approved (`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:684-718`).

**What is missing**

- A V3 model/runtime/state/observable identity.
- A production-owned deterministic regular-sinus/coronary/HMII profile with real content digests.
- A checked-in manifest/artifact and product bundle entry.
- Evidence and governance required to promote that identity beyond development/unverified.

**What must be built for the full gap**

A new V3 release program: manifest generator/checker, exact model/runtime/state/observable/protocol snapshots, evidence artifact set, release catalog/bundle, limitations, approval gates, and compatibility policy. It must never inherit the 0.2.0 SHA or claims.

**What may be deferred for the first landing**

Do not defer identity altogether. Create a distinct, checked-in **development/unverified** manifest for the fixed experimental lane. It should:

- bind the exact regular-sinus configuration, coronary priors and active HMII config/profile;
- have no verified or clinical claim;
- repeat `releaseReady: false`, `longTermPhysiologicalValidationEstablished: false`, and `clinicalValidationClaimed: false`;
- classify the live protocol as exploratory rather than approved; and
- carry visible limitations including fixed preset, no AF/non-sinus, no controls, no strict periodicity, no exact export, and no patient-specific fit.

This uses the existing identity machinery without pretending it is a candidate or released scientific product.

**Size/difficulty**

- Full gap: roughly 6-12 implementation/artifact/document files plus 4-7 tests; **very high**, because most work is scientific governance and immutable identity.
- First landing development identity: roughly 3-5 implementation/artifact/catalog files plus 2-4 tests; **medium-high**. The manifest must be finalized after preset and observable catalog bytes stabilize.

### Gap 4: control and target resolution

**What exists**

The current catalog is pinned to the exact non-coronary 0.2.0 release (`engine/scientific/controls/MainWireScientificResearchControlCatalogV0.ts:23-38`), contains six circulation/pericardium controls, and resolves paths only into the current runtime/pericardium input (`engine/scientific/controls/MainWireScientificResearchControlCatalogV0.ts:248-325`). Its loader requires exact equality with the release 0.2.0 V0 payload (`engine/scientific/controls/MainWireScientificResearchControlCatalogV0.ts:207-245`).

The target state persists that catalog/release identity and a complete six-control map (`engine/scientific/controls/MainWireScientificResearchControlTargetStateV0.ts:37-74`, `engine/scientific/controls/MainWireScientificResearchControlTargetStateV0.ts:180-216`). The current session fork checkpoints/restores only the non-coronary transaction and applies current overlays (`engine/scientific/runtime/MainWireScientificSessionV1.ts:678-861`, `engine/scientific/runtime/MainWireScientificSessionV1.ts:1675-1757`).

**What is missing**

- A V3 control taxonomy: central loading, coronary disease/autoregulation demand, rhythm configuration, MCS device selection/commands, and possibly structural MCS profile selection.
- A complete target-state schema and digest.
- Transition rules distinguishing state-preserving runtime commands from structural changes that require cold start or a new accepted binding.
- Safe-boundary and rollback semantics across every V3 owner.
- V3 strict-candidate behavior and UI controls.

**What must be built for the full gap**

A new catalog/target state, resolver, V3 session fork/restart protocol, worker commands, checkpoint binding, capability-aware UI, and tests for owner preservation, structural mismatch, supersession, rollback, and control/release identity.

**What may be deferred for the first landing**

Defer all interactive controls. Ship one fixed regular-sinus + normal-coronary + active-HMII preset. Disable the controls rail and target-intent actions before they reach the adapter, with a visible explanation that the experimental lane is fixed-input. Do not opportunistically expose the existing six controls: even if some runtime fields look compatible, the present fork receipt does not prove preservation of the coronary, rhythm, autoregulation, and dynamic-MCS owners.

**Size/difficulty**

- Full gap: roughly 8-14 implementation/catalog/UI files plus 6-10 tests; **very high**.
- First landing: no V3 control implementation; capability/UI handling overlaps the lane seam, roughly 1-3 UI/contract files and 1-2 tests.

### Gap 5: exact 0.002 s export

**What exists**

The current exact path has strong and appropriate guarantees: it restores a content-addressed V4 origin on a dedicated host (`studio/adapters/mainWire/MainWireExactSignalReplayWorkerV1.ts:111-241`), advances at 0.002 s with stride 1 (`studio/adapters/mainWire/MainWireExactSignalReplayWorkerV1.ts:244-312`), validates time/revision continuity (`studio/adapters/mainWire/MainWireExactSignalReplayWorkerV1.ts:400-475`), and mints an export manifest that says no interpolation and no presentation samples were used (`studio/contracts/v1/export.ts:132-160`).

V3 has an exact transaction checkpoint, so deterministic origin restoration is possible in principle.

**What is missing**

- A V3 replay origin/input/codec and exact observable catalog.
- A V3 dedicated replay host.
- Grid advancement that consumes any event-clipped internal commits and lands exactly at each 0.002 s sample time.
- Revised continuity arithmetic: transaction revision may advance more than once between two output samples.
- Determinism/size/request-budget tests and an export manifest whose claims match that algorithm.

The event-substep point is mandatory, not an optimization. V3 first limits the candidate time (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:314-375`) and rejects a crossing (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:404-419`), whereas the current exporter asserts `revision += 1` and `time += 0.002` for each stride-1 frame (`studio/adapters/mainWire/MainWireExactSignalReplayWorkerV1.ts:427-471`).

**What must be built for the full gap**

A V3 replay envelope/codec, an `advanceToGridTime` replay loop, V3 exact sample loader/writer, revised revision/substep evidence, exact-grid tests across rhythm boundaries, and artifact/capability integration.

**What may be deferred for the first landing**

Defer it entirely. Hide or disable Export for this lane and state: “Exact 0.002 s replay export is not available for this experimental lane.” Never relabel the decimated live chart trace as exact data.

**Size/difficulty**

- Full gap: roughly 6-10 implementation/artifact files plus 5-8 tests; **high**.
- First landing: only capability/UI exclusion, overlapping the lane seam.

## Q4. Smallest honest first landing

### Proposed increment

Add an opt-in Studio case/lane named along the lines of:

> **Experimental coronary + sinus + HMII 9000**

It should:

1. Run a new V3 scientific session inside the browser Worker, not on the main thread.
2. Use a Worker-owned deterministic preset:
   - regular sinus, one-second cycle;
   - normal coronary disease/autoregulation inputs;
   - dynamic HeartMate-II LVAD at 9000 rpm;
   - a production-owned but explicitly unverified experimental inertance profile; and
   - no external AF inputs.
3. Advance to each requested 2 ms presentation-grid endpoint while using `limitMainWireIntegratedModelCandidateTimeV3` for any internal rhythm/coronary boundaries. The chart sample is taken at the grid endpoint; internal accepted revisions are not treated as sample ordinals.
4. Show signals a researcher can identify:
   - LV volume and LV/Ao pressure, reusing catalog-neutral chart components;
   - total coronary inlet flow, with optional LAD/LCx/RCA inlet flows;
   - accepted LVAD flow;
   - model time, accepted revision/substep count, “regular sinus” and “HMII 9000” status; and
   - live pacing state and achieved rate.
5. Support operational V3 checkpoint/restore for Worker rotation, but no user-visible save/restore.
6. Bind the lane to a separate development/unverified V3 manifest and product catalog entry.

The current pacing contract already distinguishes compute overload from lane failure: `degraded` means the lane re-anchors and continues while reporting wall/model separation (`studio/contracts/v1/runtime.ts:191-228`), and the adapter explicitly publishes accepted chunks after a pacing re-anchor (`studio/adapters/mainWire/MainWireSimulationRuntimeAdapterV1.ts:139-153`). Therefore the measured 15.2-16.0 ms per nominal 2 ms step is survivable for this landing, but the lane must be expected to open in `degraded` mode. No scope item should assume the planned numerics work has landed.

### Visible product wording/capabilities

At the case card and in the running lane, show:

- **Experimental / development / unverified**
- **Regular sinus only**
- **Fixed normal-coronary + HMII 9000 preset**
- **Not release-ready; not clinically validated; not patient-specific**
- **Cold/transient exploration; periodic steady state and long-term physiological validation not established**
- **May run below realtime; pacing slowdown is reported**

Expose capabilities as data, not scattered UI conditions:

| Capability | First landing |
|---|---|
| Browser-Worker V3 execution | Yes |
| Decimated live presentation | Yes |
| Operational Worker-rotation checkpoint | Yes |
| Minimal coronary/LVAD observables | Yes |
| Regular sinus | Yes |
| External AF or other non-sinus rhythm | No |
| IABP | No in this increment, even though regular-sinus phase-derived IABP is not the AF blocker |
| Interactive research controls | No |
| Strict periodic settlement/candidate | No |
| Candidate promotion/pinning | No |
| User-persisted warm snapshot | No |
| Exact 0.002 s replay/export | No |
| Existing Guyton/Starling, PV-relation, or other side-analysis jobs | No |
| Candidate/released/verified-research identity | No |

### Why this is real

It executes the actual integrated V3 initializer, boundary limiter, transaction and checkpoint in a browser Worker. The direct canonical-provider smoke already demonstrates regular sinus + active HMII + coronary V3 + exact resume and finite/nonzero accepted LVAD flow (`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:110-177`, `__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:343-434`). The first landing turns that numerical path into a production-owned Worker preset and projects actual V3 readbacks into Studio charts.

### What it deliberately does not claim

It does not call itself release 0.2.0, does not reuse the current verified-research badge, does not call the fixed input a patient scenario, does not claim periodicity or numerical health for a settled orbit, does not call presentation samples exact, does not mark internally modeled-but-unexposed signals `not-modeled`, and does not imply that the HMII inertance profile is release-approved.

It may continue beyond the one-cycle smoke as exploratory live computation, but the UI must retain the “long-term validation not established” limitation. The current V3 transaction itself makes that exact claim (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:115-119`).

## Q5. Ordered plan and forced dependencies

### 1. Freeze the first-lane contract

Decide and record:

- lane ID and display identity;
- fixed regular-sinus configuration;
- fixed normal coronary/autoregulation input;
- HMII config and experimental inertance profile;
- minimal observable IDs/units/provenance;
- capability matrix; and
- exact limitation wording.

**Dependency:** these bytes and meanings feed checkpoint context, release SHA, observable catalog SHA, worker preset selection, and UI. Changing them later intentionally changes identity.

### 2. Build the production-owned V3 preset/context

Move the bounded-smoke construction into production-owned code without importing the test helper. Use real content digests, not the smoke’s repeated-character placeholder digests (`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:684-718`). Keep the active HMII profile labeled experimental/unapproved.

Add direct tests for cold initialization, one-cycle advance, boundary clipping, conservation, accepted LVAD flow, regular-mode rejection of external-AF input, and exact V3 checkpoint/restore. Regular mode already rejects external AF fields (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:623-640`).

**Dependency:** session and manifest work cannot bind exact context until this is stable.

### 3. Build `MainWireIntegratedScientificSession` as a parallel session

Own the provider, coronary input, composed-rhythm configuration, MCS config/profile, accepted tuple, last accepted-step readback, and checkpoint context.

Implement `advanceToPresentationTime`:

1. choose the next grid target;
2. repeatedly call the V3 candidate-time limiter;
3. step to each limited endpoint;
4. stop only at the requested grid time; and
5. return the endpoint readback plus internal accepted-substep count.

Test lockstep against direct V3 execution, retry/rollback, grid endpoints spanning rhythm events, and exact continuation after checkpoint.

**Dependency:** the worker and presentation layers need this semantic boundary. Implementing the Worker first would bake in the wrong `stepCount === revisionCount` assumption.

### 4. Build the minimal V3 observable registry/projector

Define the minimal core/coronary/LVAD/status surface and accepted-state/readback availability rules. Test cold, restored, accepted-step, failed-step, and event-substep cases.

**Dependency:** the development manifest’s observable schema and the UI catalog hashes cannot be finalized before this catalog is stable.

### 5. Mint the development/unverified V3 identity

Generate and check in a new manifest/artifact with:

- the integrated V3 transaction ID;
- V3 checkpoint/state codec identity;
- exact preset/config/profile snapshots;
- the new observable schema;
- exploratory protocol classification;
- development/unverified lifecycle/evidence; and
- the explicit limitations from Q4.

Add it as a separate product release bundle/catalog member. Do not weaken the current exact allowlist behavior; extend it with a second exact identity in a new heterogeneous resolver/version.

**Dependency:** the product must not open the lane before it can name exactly what is running.

### 6. Build the V3 worker protocol, kernel, and browser host

Use a separate command protocol/version or a separately discriminated V3 command family:

- create the exact Worker-owned preset;
- observe;
- advance to presentation time;
- get/restore operational V3 checkpoint; and
- dispose.

Do not include controls, settlement, analyses, or exact export in this first protocol. Return a V3 frame and lane capabilities. Verify payload bounds, mismatch rejection, request timeouts, Worker termination, and checkpoint rotation.

**Dependency:** this consumes the session and projection; it should not invent either.

### 7. Add the Studio lane-driver seam and experimental branch

Add the discriminated lane factory and a V3 live-only driver. Preserve the current adapter as the non-coronary member.

The V3 branch should cold-start from its Worker-owned preset rather than consume a V1 run/snapshot artifact. Use a new non-persisted open command/result version with capability data. Do not create a `StudioRunArtifactContentV1`, because that would assert converged/numerically-passed/warm-restartable state (`studio/contracts/v1/artifacts.ts:68-82`).

Use time/rhythm-derived phase for V3 presentation. Do not call `runtimePresentationCanonicalPhaseV1(revision)`, whose contract is the fixed non-coronary 2 ms revision grid (`studio/contracts/v1/runtime.ts:31-60`).

**Dependency:** capability-aware application state is required before the UI can honestly disable current actions.

### 8. Integrate the case card, charts, warnings, and disabled actions

Add the experimental case to product discovery and route it through the V3 branch/controller. Reuse catalog-neutral chart components, not the function that reconstructs the current 34-entry frame. Surface `degraded` pacing and achieved rate. Disable controls, strict settlement, promote/pin, persistence, export, and side-analysis actions with the reasons in Q4.

### 9. Landing verification

Required landing gates:

- direct V3 session/direct-transaction lockstep including an event-clipped interval;
- browser worker creation, live advance, checkpoint rotation, and disposal;
- minimal frame truthfulness and no current-registry placeholder violation;
- UI case opens and displays actual coronary and LVAD signals;
- slow synthetic host remains live and reports `degraded`;
- every unavailable action is absent or disabled before invocation;
- current non-coronary Studio tests and checked-in artifact verification still pass byte-for-byte; and
- bundle inspection confirms V3 code is in the Worker path, not accidentally executed on the main thread.

### Dependency edges in compact form

```text
fixed preset/profile
  -> V3 session context/checkpoint
  -> V3 worker host
  -> Studio live driver

minimal observable catalog
  -> V3 frame
  -> development manifest + product catalog hash
  -> charts/UI

lane capabilities
  -> Studio branch type
  -> disabled controls/strict/persist/export actions

V3 advance-to-time semantics
  -> presentation phase/retention
  -> future exact-grid replay
```

### Specific risks

1. **False V3 checkpoint substitution.** “Scientific session checkpoint V3” is the non-coronary envelope (`engine/scientific/runtime/MainWireScientificExactCheckpointV3.ts:20-39`); “integrated model checkpoint V3” is the coronary/rhythm/MCS checkpoint (`engine/myocardium/MainWireIntegratedModelCheckpointV3.ts:38-60`). Reusing the former would be a schema/guarantee defect.
2. **Revision is not a 2 ms sample index.** Event clipping can add accepted revisions between grid samples. Current phase, retention, metric, and exact-export arithmetic assume otherwise (`studio/contracts/v1/runtime.ts:48-75`, `studio/adapters/mainWire/MainWireExactSignalReplayWorkerV1.ts:427-471`).
3. **Release contamination.** Adding V3 to the current 0.2.0 manifest or product bundle would contradict checked-in “no coronary circulation/no device graph” limitations and change a content-addressed identity (`engine/scientific/assembly/mainWireAdultFiveWallNonCoronaryReleaseV1.ts:184-192`).
4. **Artifact reinterpretation.** Widening V4 transaction fields, V1 snapshot contents, or V1 run claims would make old content-addressed artifacts mean something new. All V3 persisted formats must be additive/versioned.
5. **Observable lie.** Sending coronary/LVAD values through the current registry contradicts its catalog and is rejected by the product projector (`components/scientificProduct/ScientificProductStudioObservableFrameProjectionV1.ts:181-207`).
6. **Unapproved MCS profile.** A production config preset is not a release-approved dynamic inertance profile; the dynamic network explicitly says none is supplied (`engine/devices/dynamicNetworkV1.ts:52-55`).
7. **Evidence overreach.** The active V3 HMII test is one bounded cycle and explicitly asserts no release readiness or long-term physiological validation (`__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:110-117`, `__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts:429-434`). The production V3 periodic fixture is regular sinus with all four MCS devices disabled (`engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts:91-125`, `engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts:320-381`).
8. **Control preservation overclaim.** Reusing the V0 fork because central runtime fields happen to overlap would not prove preservation of composed rhythm, coronary window/tone, and dynamic-MCS accepted flows.
9. **Performance and request budgeting.** The lane should survive below realtime, but V3 checkpoint payload size, serialization time, command chunk size, 60 s request timeout, and 90,000-request rotation need browser measurement. Current browser limits are 100,000 requests, 16 transient steps/command and 60 s/request (`engine/scientificBrowser/mainWireScientificBrowserRuntimeLimitsV1.ts:10-16`).
10. **AF scope creep.** V3 itself records `iabpAcceptedVentricularSynchronization: "open"` and rejects phase-derived IABP with external AF/non-sinus rhythm (`engine/myocardium/MainWireIntegratedModelTransactionV3.ts:89-95`, `engine/myocardium/MainWireIntegratedModelTransactionV3.ts:923-949`). External AF is not part of this landing.

## Guarantee traps to flag during implementation

These are the places most likely to produce the recurring “type/comment/document claims more than the code supports” defect:

- Do not change `coronaryCirculationIncluded: false` to `boolean` or `true` in the current claim while the class still steps the non-coronary transaction.
- Do not call `MainWireScientificSessionExactCheckpointV3` an integrated-model V3 checkpoint.
- Do not put V3 values into current `not-modeled` observable slots.
- Do not mint a V1 run artifact for a live-only, unsettled source.
- Do not call a presentation trace “exact 0.002 s export.”
- Do not derive V3 rhythm phase from accepted transaction revision.
- Do not call the test/experimental HMII inertance profile release-approved.
- Do not describe one-cycle smoke or all-off periodic evidence as active-MCS long-term validation.
- Do not advertise controls merely because the UI has sliders; capability must follow a V3 owner-preserving transition protocol.
- Do not use release 0.2.0’s identity, verified-research status, claims, approved protocols, or limitations for the V3 lane.

## Q6. What I could not verify in this environment

1. I did not reproduce the stated 15.2-16.0 ms/2 ms V3 performance number. No matching V3 benchmark output or script exposing those exact numbers was found in the repository. I treat the product owner’s measurement as given.
2. I could not verify the projected 4.5 ms and 1.4-2.2 ms numerics-workstream outcomes; they are plans, not current code behavior in this checkout.
3. I did not run an implemented V3 browser lane because none exists. Therefore Worker bundle size, actual browser serialization/checkpoint size, UI responsiveness, memory growth, request timeout margin, and host-rotation latency remain unmeasured.
4. I did not run the Playwright browser suite or the full repository test matrix. I ran only:
   - `__tests__/mainWireIntegratedModelRealProviderSmokeV3.test.ts` — passed; and
   - `__tests__/mainWireScientificSessionLockstepV1.test.ts` — passed.
5. I could not verify a release-approved dynamic MCS inertance profile because the source explicitly states that none is defined. Selecting and governing the first production-owned experimental profile is a required product/scientific decision.
6. I could not verify an active-MCS V3 periodic steady source. The production V3 periodic fixture is all-off; the active HMII evidence is the bounded smoke/experimental verification path.
7. I could not verify which of the 16 coronary volumes, intramyocardial pressures, rhythm internals, and MCS diagnostics researchers want in the first durable observable catalog. Q4 proposes a minimum, not a scientific-product decision.
8. I could inspect only checked-in persisted artifacts. I could not inventory user-created IndexedDB, remote, or previously exported Studio artifacts outside this repository; that increases the reason not to reinterpret any V1 schema.
9. I did not verify AF/non-sinus behavior beyond the source contracts and tests because it is explicitly outside the requested first scope.

## Bottom line

The smallest safe route is a parallel, explicitly experimental V3 live lane with its own session, worker commands, minimal truthful observable catalog, development/unverified identity, operational checkpoint rotation, and capability-driven UI exclusions. Preserve the existing non-coronary session and every V1/V3/V4 persisted contract as-is. Controls, strict settlement, user persistence, and exact 0.002 s export are separate follow-on scopes; external AF remains blocked and out of scope.
