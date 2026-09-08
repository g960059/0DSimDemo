import { cloneAndFreezeCanonicalJson } from "@/engine/integrity";
import { hotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import type { MainWireIntegratedModelStandard72CheckpointV1 } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import type { MainWireIntegratedModelPresentationAdvanceV3, MainWireIntegratedModelSubstepRecordV3 } from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import {
  measureMainWireIntegratedModelFormalPreloadReserveV2,
  type MainWireIntegratedModelFormalPreloadReserveMeasurementV2,
  type MainWireIntegratedModelStructuralAnalysisSessionV3,
} from "./MainWirePressureVolumeProtocolsV3";

export const MAIN_WIRE_STANDARD72_PRELOAD_RESERVE_V1_ID = "main-wire-standard72-preload-reserve-v1";

export type MainWireStandard72PreloadReserveRequestV1 = Readonly<{
  candidateInputs: MainWireBaselineCalibrationCandidateInputsV1;
  checkpoint: MainWireIntegratedModelStandard72CheckpointV1;
  nominalDtSec: .002 | .001;
  abortSignal?: AbortSignal;
}>;

type ExecutionCounts = {
  selectedProjectionAdvanceCount: number;
  internalAcceptedSubstepCount: number;
  boundaryClippedSubstepCount: number;
  forkCount: number;
  maximumRequestedDtSec: number;
};

export type MainWireStandard72PreloadReserveMeasurementV1 = MainWireIntegratedModelFormalPreloadReserveMeasurementV2 & Readonly<{
  execution: Readonly<ExecutionCounts & {
    adapterId: typeof MAIN_WIRE_STANDARD72_PRELOAD_RESERVE_V1_ID;
    nominalDtSec: .002 | .001;
    executionPath: "standard72-selected-output-projection";
    wallTimeMs: number;
  }>;
}>;

/** Runs the existing bounded V2 measurement from an independently restored exact72 source. */
export async function measureMainWireStandard72PreloadReserveV1(
  request: MainWireStandard72PreloadReserveRequestV1,
): Promise<MainWireStandard72PreloadReserveMeasurementV1> {
  const startedAt = performance.now();
  validateDt(request.nominalDtSec);
  assertNotAborted(request.abortSignal);
  if (hotPathIntegrityTierV1() !== "hot-path-lean") {
    throw new Error("Standard72 preload reserve requires hot-path-lean selected execution");
  }
  // Capture caller-owned inputs before the exact restore's asynchronous digest.
  const candidate = cloneAndFreezeCanonicalJson(request.candidateInputs) as MainWireBaselineCalibrationCandidateInputsV1;
  const nominalDtSec = request.nominalDtSec;
  const abortSignal = request.abortSignal;
  const source = await Session.restoreStandard72ExactCheckpoint(request.checkpoint,
    candidate.hemodynamicResearchInputs, candidate.ventricularContractilityScale,
    undefined, candidate.mechanismResearchInputs);
  const execution = executionCounts();
  assertNotAborted(abortSignal);
  try {
    const measurement = await measureMainWireIntegratedModelFormalPreloadReserveV2(
      wrapSession(source, nominalDtSec, abortSignal, execution), candidate.hemodynamicResearchInputs,
    );
    assertNotAborted(abortSignal);
    return Object.freeze({ ...measurement, execution: Object.freeze({
      ...execution, adapterId: MAIN_WIRE_STANDARD72_PRELOAD_RESERVE_V1_ID,
      nominalDtSec, executionPath: "standard72-selected-output-projection" as const,
      wallTimeMs: performance.now() - startedAt,
    }) });
  } catch (error) {
    // The shared protocol converts branch exceptions to rejection messages.
    // Preserve the operational cancellation category at this request boundary.
    assertNotAborted(abortSignal);
    throw error;
  }
}

/** Analysis owns the requested numerical resolution across every ephemeral fork. */
export function wrapMainWireStandard72PreloadReserveSessionV1(
  source: Session, nominalDtSec: .002 | .001, abortSignal?: AbortSignal,
): MainWireIntegratedModelStructuralAnalysisSessionV3 {
  validateDt(nominalDtSec);
  return wrapSession(source, nominalDtSec, abortSignal, executionCounts());
}

function executionCounts(): ExecutionCounts {
  return { selectedProjectionAdvanceCount: 0, internalAcceptedSubstepCount: 0,
    boundaryClippedSubstepCount: 0, forkCount: 0, maximumRequestedDtSec: 0 };
}

function wrapSession(
  source: Session, nominalDtSec: .002 | .001, abortSignal: AbortSignal | undefined,
  execution: ExecutionCounts,
): MainWireIntegratedModelStructuralAnalysisSessionV3 {
  const advance = (targetTimeSec: number): MainWireIntegratedModelPresentationAdvanceV3 => {
    assertNotAborted(abortSignal);
    const initial = source.currentAcceptedState();
    if (!Number.isFinite(targetTimeSec) || targetTimeSec < initial.acceptedTimeSec) {
      return source.advanceToPresentationTime(targetTimeSec);
    }
    if (targetTimeSec === initial.acceptedTimeSec) return Object.freeze({
      status: "already-at-target", presentationTimeSec: targetTimeSec,
      acceptedTimeSec: initial.acceptedTimeSec, acceptedRevision: initial.revision,
      internalAcceptedSubstepCount: 0, observation: source.observe(),
    });
    let internalAcceptedSubstepCount = 0;
    let boundaryClippedSubstepCount = 0;
    const substeps: MainWireIntegratedModelSubstepRecordV3[] = [];
    let ordinal = 1;
    let acceptedTimeSec = initial.acceptedTimeSec;
    let acceptedRevision = initial.revision;
    while (acceptedTimeSec < targetTimeSec) {
      assertNotAborted(abortSignal);
      const ordinalTarget = initial.acceptedTimeSec + ordinal * nominalDtSec;
      // Avoid a rounding-only final solver interval on the protocol's 10-ms grid.
      const nextTarget = Math.abs(ordinalTarget - targetTimeSec) <= 1e-12
        ? targetTimeSec : Math.min(targetTimeSec, ordinalTarget);
      if (!(nextTarget > acceptedTimeSec)) {
        throw new Error("Standard72 preload reserve numerical clock did not advance");
      }
      const result = source.advanceToPresentationTimeWithSelectedOutputProjectionV1(nextTarget, []).advance;
      execution.selectedProjectionAdvanceCount++;
      execution.maximumRequestedDtSec = Math.max(execution.maximumRequestedDtSec, nextTarget - acceptedTimeSec);
      internalAcceptedSubstepCount += result.internalAcceptedSubstepCount;
      execution.internalAcceptedSubstepCount += result.internalAcceptedSubstepCount;
      if (result.status !== "already-at-target") {
        boundaryClippedSubstepCount += result.boundaryClippedSubstepCount ?? 0;
        execution.boundaryClippedSubstepCount += result.boundaryClippedSubstepCount ?? 0;
        substeps.push(...(result.substeps ?? []));
      }
      if (result.status === "failed") return Object.freeze({ ...result,
        requestedPresentationTimeSec: targetTimeSec,
        partiallyAdvanced: result.partiallyAdvanced || acceptedRevision > initial.revision,
        internalAcceptedSubstepCount, boundaryClippedSubstepCount, substeps: Object.freeze(substeps),
      });
      if (result.status !== "advanced" || result.acceptedTimeSec <= acceptedTimeSec) {
        throw new Error("Standard72 preload reserve numerical clock did not advance");
      }
      acceptedTimeSec = result.acceptedTimeSec;
      acceptedRevision = result.acceptedRevision;
      ordinal++;
    }
    return Object.freeze({ status: "advanced", presentationTimeSec: targetTimeSec,
      acceptedTimeSec, acceptedRevision,
      acceptedRevisionSpanFromPrevious: acceptedRevision - initial.revision,
      internalAcceptedSubstepCount, boundaryClippedSubstepCount,
      substeps: Object.freeze(substeps), observation: source.observe(),
    });
  };
  const fork = (kind: "forkAtFixedGlobalTotalBloodVolume" | "forkResponsiveStarlingAtFixedGlobalTotalBloodVolume", tbv: number) => {
    assertNotAborted(abortSignal);
    const branch = source[kind](tbv);
    execution.forkCount++;
    return wrapSession(branch, nominalDtSec, abortSignal, execution);
  };
  return Object.freeze({
    currentAcceptedState: () => source.currentAcceptedState(),
    observe: () => source.observe(),
    projectCurrentAcceptedValuesV1: outputIds => source.projectCurrentAcceptedValuesV1(outputIds),
    advanceToPresentationTime: advance,
    advanceStructuralAnalysisToPresentationTimeV1: advance,
    forkAtFixedGlobalTotalBloodVolume: tbv => fork("forkAtFixedGlobalTotalBloodVolume", tbv),
    forkResponsiveStarlingAtFixedGlobalTotalBloodVolume: tbv => fork("forkResponsiveStarlingAtFixedGlobalTotalBloodVolume", tbv),
  });
}

function validateDt(nominalDtSec: number): void {
  if (nominalDtSec !== .002 && nominalDtSec !== .001) {
    throw new Error("Standard72 preload reserve nominalDtSec must be 0.002 or 0.001");
  }
}

function assertNotAborted(abortSignal: AbortSignal | undefined): void {
  if (abortSignal?.aborted) throw new DOMException("Standard72 preload reserve interrupted", "AbortError");
}
