import descriptor from "@/data/myocardium/protocols/modelcore-active-provider-state-lifecycle-v1.json";
import { DEFAULT_PARAMS } from "@/constants";
import {
  ModelCore,
  type ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";
import { stableHash, sanitizeForStableHash } from "@/engine/myocardium/kinematics/stableHash";

export const MODELCORE_ACTIVE_PROVIDER_STATE_LIFECYCLE_EVIDENCE_ID =
  "modelcore-active-provider-state-lifecycle-v1";
export const MODELCORE_TEST_STATEFUL_ACTIVE_PROVIDER_ID =
  "modelcore-experimental-stateful-active-provider-lifecycle-smoke-v1";

type LifecycleProviderState = {
  commits: number;
  pressureMutations: number;
  lastDtSec: number;
  beforeT: number;
  afterT: number;
  lastEffectiveVolumeMl: number;
};

export type ModelCoreActiveProviderStateLifecycleEvidence = {
  readonly evidenceId: typeof MODELCORE_ACTIVE_PROVIDER_STATE_LIFECYCLE_EVIDENCE_ID;
  readonly descriptorId: string;
  readonly phase: "Phase 5C-J";
  readonly claimBoundary: "experimental-provider-state-lifecycle-only";
  readonly ownerDecisionStatus: "accepted-experimental-branch-only";
  readonly productionRuntimeStatus: "not-production-runtime-replacement";
  readonly statefulProviderId: typeof MODELCORE_TEST_STATEFUL_ACTIVE_PROVIDER_ID;
  readonly lifecycleEvidence: {
    readonly initialStateVersion: number;
    readonly afterOneStepStateVersion: number;
    readonly afterOneStepCommitCount: number;
    readonly afterOneStepPressureMutationCount: number;
    readonly oneCommitPerStepObserved: boolean;
    readonly providerStateCloneOnCallObserved: boolean;
    readonly readOnlyCloneParentStateVersionBefore: number;
    readonly readOnlyCloneParentStateVersionAfter: number;
    readonly readOnlyCloneLeakObserved: boolean;
    readonly publicUnpackAfterResetStateVersion: number;
    readonly publicUnpackAfterResetCommitCount: number;
    readonly publicUnpackProviderStateResetObserved: boolean;
    readonly sampleCount: number;
    readonly stableHash: string;
  };
  readonly routeAssessment: {
    readonly routeId: "modelcore-equivalent-closure-positive-control";
    readonly lifecycleStatus: "modelcore-owned-provider-state-lifecycle-implemented";
    readonly routeSatisfactionStatus: "partial-legacy-positive-control-pass-land-pairing-not-run";
    readonly sourceProviderDifferenceOnlyStatus: "not-yet-evaluated";
    readonly finalNoAlternansClaim: "not-claimed";
  };
};

export function buildStatefulLifecycleSmokeProvider(): ModelCoreExperimentalActiveSourceProvider {
  return {
    sourceProviderId: MODELCORE_TEST_STATEFUL_ACTIVE_PROVIDER_ID,
    initialProviderState: (): LifecycleProviderState => ({
      commits: 0,
      pressureMutations: 0,
      lastDtSec: 0,
      beforeT: 0,
      afterT: 0,
      lastEffectiveVolumeMl: 0,
    }),
    cloneProviderState: (state): LifecycleProviderState => ({ ...(state as LifecycleProviderState) }),
    debugProviderState: (state): LifecycleProviderState => ({ ...(state as LifecycleProviderState) }),
    initialInternal: ({ activeModel }) => activeModel.initialInternal(),
    pressure: ({ activeModel, volumeMl, internal, chamberCtx, providerState }) => {
      (providerState as LifecycleProviderState).pressureMutations += 1;
      return activeModel.pressure(volumeMl, internal, chamberCtx);
    },
    passivePressure: ({ activeModel, volumeMl, chamberCtx, providerState }) => {
      (providerState as LifecycleProviderState).pressureMutations += 1;
      return activeModel.passivePressure(volumeMl, chamberCtx);
    },
    internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx, providerState }) => {
      (providerState as LifecycleProviderState).pressureMutations += 1;
      return activeModel.internalDerivatives(volumeMl, internal, chamberCtx);
    },
    commitProviderStateAfterStep: ({
      previousProviderState,
      stepDtSec,
      beforeStep,
      afterStep,
    }): LifecycleProviderState => {
      const previous = previousProviderState as LifecycleProviderState;
      return {
        commits: previous.commits + 1,
        pressureMutations: previous.pressureMutations,
        lastDtSec: stepDtSec,
        beforeT: beforeStep.tSec,
        afterT: afterStep.tSec,
        lastEffectiveVolumeMl: afterStep.effectiveVolumeMl,
      };
    },
  };
}

export function buildModelCoreActiveProviderStateLifecycleEvidence(): ModelCoreActiveProviderStateLifecycleEvidence {
  const core = new ModelCore(DEFAULT_PARAMS, { activeSourceProviders: { LV: buildStatefulLifecycleSmokeProvider() } });
  const initialStateVersion = core.debugExperimentalActiveSourceProviderStates().LV?.stateVersion ?? -1;
  core.step(0.001);
  const afterOneStep = core.debugExperimentalActiveSourceProviderStates().LV;
  const afterOneStepState = afterOneStep?.stateSnapshot as LifecycleProviderState;
  const readOnlyCloneParentStateVersionBefore = afterOneStep?.stateVersion ?? -1;
  const snapshot = core.vascularReturnSnapshot("left", {
    mode: "cycle-mean",
    seconds: 0.003,
    dt: 0.001,
    sampleHz: 1000,
  });
  const afterReadOnly = core.debugExperimentalActiveSourceProviderStates().LV;
  const afterReadOnlyState = afterReadOnly?.stateSnapshot as LifecycleProviderState;
  const unpackCore = new ModelCore(DEFAULT_PARAMS, { activeSourceProviders: { LV: buildStatefulLifecycleSmokeProvider() } });
  unpackCore.step(0.001);
  const packedAfterOneStep = unpackCore.packState();
  unpackCore.step(0.001);
  unpackCore.unpackState(packedAfterOneStep);
  const afterPublicUnpack = unpackCore.debugExperimentalActiveSourceProviderStates().LV;
  const afterPublicUnpackState = afterPublicUnpack?.stateSnapshot as LifecycleProviderState;
  const lifecycleEvidence = {
    initialStateVersion,
    afterOneStepStateVersion: afterOneStep?.stateVersion ?? -1,
    afterOneStepCommitCount: afterOneStepState.commits,
    afterOneStepPressureMutationCount: afterOneStepState.pressureMutations,
    oneCommitPerStepObserved:
      afterOneStep?.stateVersion === 1
      && afterOneStepState.commits === 1
      && Math.abs(afterOneStepState.lastDtSec - 0.001) < 1e-12
      && Math.abs(afterOneStepState.afterT - 0.001) < 1e-12,
    providerStateCloneOnCallObserved: afterOneStepState.pressureMutations === 0,
    readOnlyCloneParentStateVersionBefore,
    readOnlyCloneParentStateVersionAfter: afterReadOnly?.stateVersion ?? -1,
    readOnlyCloneLeakObserved:
      afterReadOnly?.stateVersion !== readOnlyCloneParentStateVersionBefore
      || afterReadOnlyState.commits !== afterOneStepState.commits
      || Math.abs(afterReadOnlyState.afterT - afterOneStepState.afterT) > 1e-12,
    publicUnpackAfterResetStateVersion: afterPublicUnpack?.stateVersion ?? -1,
    publicUnpackAfterResetCommitCount: afterPublicUnpackState.commits,
    publicUnpackProviderStateResetObserved:
      afterPublicUnpack?.stateVersion === 0
      && afterPublicUnpackState.commits === 0
      && Math.abs(unpackCore.packState().t - packedAfterOneStep.t) < 1e-12,
    sampleCount: snapshot.sampleCount,
    stableHash: "",
  };
  return {
    evidenceId: MODELCORE_ACTIVE_PROVIDER_STATE_LIFECYCLE_EVIDENCE_ID,
    descriptorId: descriptor.id,
    phase: "Phase 5C-J",
    claimBoundary: "experimental-provider-state-lifecycle-only",
    ownerDecisionStatus: "accepted-experimental-branch-only",
    productionRuntimeStatus: "not-production-runtime-replacement",
    statefulProviderId: MODELCORE_TEST_STATEFUL_ACTIVE_PROVIDER_ID,
    lifecycleEvidence: {
      ...lifecycleEvidence,
      stableHash: stableHash(sanitizeForStableHash(lifecycleEvidence)),
    },
    routeAssessment: {
      routeId: "modelcore-equivalent-closure-positive-control",
      lifecycleStatus: "modelcore-owned-provider-state-lifecycle-implemented",
      routeSatisfactionStatus: "partial-legacy-positive-control-pass-land-pairing-not-run",
      sourceProviderDifferenceOnlyStatus: "not-yet-evaluated",
      finalNoAlternansClaim: "not-claimed",
    },
  };
}

if (process.argv.some((arg) => arg.endsWith("buildModelCoreActiveProviderStateLifecycleEvidence.ts"))) {
  console.log(JSON.stringify(buildModelCoreActiveProviderStateLifecycleEvidence(), null, 2));
}
