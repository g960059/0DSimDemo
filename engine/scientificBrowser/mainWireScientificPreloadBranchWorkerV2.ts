import {
  checkpointMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  estimateMainWireScientificFastTbvPreviewPointV1,
  refineMainWireScientificFastTbvPreviewPointV1,
  settleMainWireScientificContinuationPreloadPointV2,
  type MainWireScientificHemodynamicProtocolDependenciesV1,
  type MainWireScientificProtocolAcceptedStateV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import type {
  MainWireScientificFastTbvPointEvidenceV1,
  MainWireScientificFastTbvPreviewTargetV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";
import {
  createMainWireScientificFastTbvRefinementStageV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvRefinementPolicyV1";
import {
  MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
  type MainWireScientificPreloadBranchWorkerCommandV2,
  type MainWireScientificPreloadBranchWorkerLaneV2,
  type MainWireScientificPreloadBranchWorkerMessageV2,
} from "@/engine/scientificBrowser/MainWireScientificPreloadBranchWorkerProtocolV2";
import { SHA256_HEX_PATTERN } from "@/engine/scientific/release/sha256";

type BranchWorkerScopeV2 = Readonly<{
  postMessage: (message: MainWireScientificPreloadBranchWorkerMessageV2) => void;
}> & {
  onmessage: ((event: MessageEvent<MainWireScientificPreloadBranchWorkerCommandV2>) => void) | null;
};

type ActiveBranchV2 = {
  jobId: string;
  lane: MainWireScientificPreloadBranchWorkerLaneV2;
  dependencies: MainWireScientificHemodynamicProtocolDependenciesV1;
  baselineState: MainWireScientificProtocolAcceptedStateV1;
  fastPreviewState: MainWireScientificProtocolAcceptedStateV1;
  fastPreviewPreviousState: MainWireScientificProtocolAcceptedStateV1 | null;
  fastPreviewSourceEvidenceId: string;
  fastPreviewCursorByTargetId: Map<string, Readonly<{
    target: MainWireScientificFastTbvPreviewTargetV1;
    state: MainWireScientificProtocolAcceptedStateV1;
    evidence: Exclude<MainWireScientificFastTbvPointEvidenceV1, { evidenceClass: "failure" }>;
  }>>;
  previousContinuationState: MainWireScientificProtocolAcceptedStateV1 | null;
  continuationState: MainWireScientificProtocolAcceptedStateV1;
  continuationScale: number;
  sourceFingerprint: string;
};

const scope = globalThis as unknown as BranchWorkerScopeV2;
let active: ActiveBranchV2 | null = null;

scope.onmessage = (event): void => {
  const command = event.data;
  if (
    command.protocolId
      !== MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID
  ) return;
  try {
    if (command.kind === "initialize") {
      if (!SHA256_HEX_PATTERN.test(command.sourceFingerprint)) {
        throw new Error("preload branch source fingerprint is not SHA-256");
      }
      const capsule = command.baselineCapsule;
      if (capsule.capsuleId
          !== "main-wire-scientific-hemodynamic-job-capsule-v2") {
        throw new Error("preload branch capsule identity mismatch");
      }
      const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
      if (
        provider.providerId !== capsule.providerIdentity.providerId
        || provider.parameterSetId !== capsule.providerIdentity.parameterSetId
        || provider.parameterIdentityHash
          !== capsule.providerIdentity.parameterIdentityHash
      ) {
        throw new Error("preload branch provider identity mismatch");
      }
      const baselineState = restoreMainWireFiveWallNonCoronaryV1(
        provider,
        capsule.transactionCheckpoint,
      );
      active = {
        jobId: command.jobId,
        lane: command.lane,
        dependencies: Object.freeze({
          provider,
          runtime: capsule.runtime,
          pericardium: capsule.pericardium,
          calciumDriveParams: capsule.calciumDriveParams,
        }),
        baselineState,
        fastPreviewState: baselineState,
        fastPreviewPreviousState: null,
        fastPreviewSourceEvidenceId: "source-period1-baseline",
        fastPreviewCursorByTargetId: new Map(),
        previousContinuationState: null,
        continuationState: baselineState,
        continuationScale: 1,
        sourceFingerprint: command.sourceFingerprint,
      };
      scope.postMessage(Object.freeze({
        protocolId:
          MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
        kind: "ready" as const,
        jobId: command.jobId,
        lane: command.lane,
      }));
      return;
    }
    if (command.kind === "cancel") {
      if (active?.jobId === command.jobId) active = null;
      return;
    }
    const branch = active;
    if (command.kind === "solve-fast-preview-target") {
      if (
        branch === null
        || branch.jobId !== command.jobId
        || branch.lane !== command.lane
        || command.target.lane !== branch.lane
        || command.requestedNaturalBeatCount !== 2
      ) {
        throw new Error("fast preview target does not match active job/lane");
      }
      const sourceState = branch.fastPreviewState;
      const startedAtMs = monotonicNowMs();
      const evaluated = estimateMainWireScientificFastTbvPreviewPointV1(
        branch.dependencies,
        branch.fastPreviewState,
        command.target,
        branch.sourceFingerprint,
        branch.fastPreviewSourceEvidenceId,
        "adaptive-provisional-secant",
        branch.fastPreviewPreviousState,
      );
      const measuredBeatWallTimeMs = Math.max(
        0.01,
        (monotonicNowMs() - startedAtMs) / 2,
      );
      if (evaluated.terminalState !== null) {
        branch.fastPreviewPreviousState = sourceState;
        branch.fastPreviewState = evaluated.terminalState;
        branch.fastPreviewSourceEvidenceId = evaluated.evidence.evidenceId;
        if (
          evaluated.evidence.evidenceClass !== "failure"
          && evaluated.refinementAssessment !== null
        ) {
          branch.fastPreviewCursorByTargetId.set(
            command.target.targetId,
            Object.freeze({
              target: command.target,
              state: evaluated.terminalState,
              evidence: evaluated.evidence,
            }),
          );
        }
      }
      scope.postMessage(
        Object.freeze({
          protocolId: MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
          kind: "fast-preview-target-result" as const,
          jobId: command.jobId,
          lane: command.lane,
          target: command.target,
          requestedNaturalBeatCount: command.requestedNaturalBeatCount,
          evidence: evaluated.evidence,
          refinementStage: evaluated.refinementAssessment === null
            ? null
            : createMainWireScientificFastTbvRefinementStageV1({
                targetId: command.target.targetId,
                assessment: evaluated.refinementAssessment,
                measuredLatestBeatWallTimeMs: measuredBeatWallTimeMs,
              }),
        }),
      );
      return;
    }
    if (command.kind === "refine-fast-preview-target") {
      if (
        branch === null
        || branch.jobId !== command.jobId
        || branch.lane !== command.lane
        || command.target.lane !== branch.lane
      ) {
        throw new Error("fast preview refinement does not match active job/lane");
      }
      const cursor = branch.fastPreviewCursorByTargetId.get(
        command.target.targetId,
      );
      if (
        cursor === undefined
        || !sameFastPreviewTargetV2(cursor.target, command.target)
        || cursor.evidence.acquisition.completedNaturalBeatCountAfterPrediction
            + 1 !== command.requestedNaturalBeatCount
      ) {
        throw new Error("fast preview refinement cursor/revision mismatch");
      }
      const startedAtMs = monotonicNowMs();
      const evaluated = refineMainWireScientificFastTbvPreviewPointV1(
        branch.dependencies,
        cursor.state,
        cursor.evidence,
      );
      const measuredBeatWallTimeMs = Math.max(
        0.01,
        monotonicNowMs() - startedAtMs,
      );
      if (
        evaluated.terminalState !== null
        && evaluated.evidence.evidenceClass !== "failure"
        && evaluated.refinementAssessment !== null
      ) {
        branch.fastPreviewCursorByTargetId.set(
          command.target.targetId,
          Object.freeze({
            target: command.target,
            state: evaluated.terminalState,
            evidence: evaluated.evidence,
          }),
        );
      } else {
        branch.fastPreviewCursorByTargetId.delete(command.target.targetId);
      }
      scope.postMessage(Object.freeze({
        protocolId: MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
        kind: "fast-preview-target-result" as const,
        jobId: command.jobId,
        lane: command.lane,
        target: command.target,
        requestedNaturalBeatCount: command.requestedNaturalBeatCount,
        evidence: evaluated.evidence,
        refinementStage: evaluated.refinementAssessment === null
          ? null
          : createMainWireScientificFastTbvRefinementStageV1({
              targetId: command.target.targetId,
              assessment: evaluated.refinementAssessment,
              measuredLatestBeatWallTimeMs: measuredBeatWallTimeMs,
            }),
      }));
      return;
    }
    if (
      branch === null ||
      branch.jobId !== command.jobId ||
      branch.lane !== command.lane ||
      command.target.lane !== laneForPlanner(branch.lane)
    ) throw new Error("preload branch target does not match active job/lane");
    const audit = command.mode === "independent-audit";
    if (
      !audit
      && Math.abs(
        command.target.provenance.seedNormalizedTbv
          - branch.continuationScale,
      ) > 1e-9
    ) {
      throw new Error("preload branch continuation seed scale mismatch");
    }
    const settled = settleMainWireScientificContinuationPreloadPointV2(
      branch.dependencies,
      audit ? branch.baselineState : branch.continuationState,
      command.target.totalBloodVolumeMl,
      command.target.normalizedTbv,
      {
        previousPeriod1SeedState: audit
          ? null
          : branch.previousContinuationState,
      },
    );
    const acceptedAsSeed = !audit
      && settled.continuationSeedState !== null;
    if (acceptedAsSeed) {
      branch.previousContinuationState = branch.continuationState;
      branch.continuationState = settled.continuationSeedState!;
      branch.continuationScale = command.target.normalizedTbv;
    }
    scope.postMessage(Object.freeze({
      protocolId:
        MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
      kind: "target-result" as const,
      jobId: command.jobId,
      lane: command.lane,
      target: command.target,
      mode: command.mode,
      point: settled.point,
      seedInitialization: settled.seedInitialization,
      continuationAcceptedAsSeed: acceptedAsSeed,
      terminalCheckpoint: settled.continuationSeedState === null
        ? null
        : checkpointMainWireFiveWallNonCoronaryV1(
          branch.dependencies.provider,
          settled.continuationSeedState,
        ),
    }));
  } catch (error) {
    scope.postMessage(Object.freeze({
      protocolId: MAIN_WIRE_SCIENTIFIC_PRELOAD_BRANCH_WORKER_PROTOCOL_V2_ID,
      kind: "worker-failure" as const,
      jobId: event.data.jobId,
      lane: "lane" in event.data ? event.data.lane : active?.lane ?? null,
      message: error instanceof Error ? error.message : String(error),
    }));
  }
};

function sameFastPreviewTargetV2(
  left: MainWireScientificFastTbvPreviewTargetV1,
  right: MainWireScientificFastTbvPreviewTargetV1,
): boolean {
  return left.targetId === right.targetId
    && left.lane === right.lane
    && left.targetOrdinal === right.targetOrdinal
    && left.targetScale === right.targetScale
    && left.totalBloodVolumeMl === right.totalBloodVolumeMl;
}

function laneForPlanner(
  lane: MainWireScientificPreloadBranchWorkerLaneV2,
): "negative" | "positive" {
  return lane === "lower-volume" ? "negative" : "positive";
}

function monotonicNowMs(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
