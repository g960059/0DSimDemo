import type { MainWireIntegratedModelPresentationAdvanceV3, MainWireIntegratedModelSubstepRecordV3 } from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import type { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import {
  type MainWireIntegratedModelStructuralAnalysisSessionV3,
} from "./MainWirePressureVolumeProtocolsV3";

/** Only the exact owner's structural operations are needed. In particular,
 * a finite-anatomy case must fork its own owner, not a baseline-only factory. */
type ReserveSource = Pick<Session, "currentAcceptedState" | "observe" | "projectCurrentAcceptedValuesV1"
  | "advanceToPresentationTime" | "advanceToPresentationTimeWithSelectedOutputProjectionV1"> & {
  forkAtFixedGlobalTotalBloodVolume(tbv: number): ReserveSource;
  forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(tbv: number): ReserveSource;
};

/** Analysis owns the requested numerical resolution across every ephemeral fork. */
export function wrapMainWirePreloadReserveSessionV1(
  source: ReserveSource, nominalDtSec: .002 | .001, abortSignal?: AbortSignal,
): MainWireIntegratedModelStructuralAnalysisSessionV3 {
  validateDt(nominalDtSec);
  return wrapSession(source, nominalDtSec, abortSignal);
}

function wrapSession(
  source: ReserveSource, nominalDtSec: .002 | .001, abortSignal: AbortSignal | undefined,
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
        throw new Error("Preload reserve numerical clock did not advance");
      }
      const result = source.advanceToPresentationTimeWithSelectedOutputProjectionV1(nextTarget, []).advance;
      internalAcceptedSubstepCount += result.internalAcceptedSubstepCount;
      if (result.status !== "already-at-target") {
        boundaryClippedSubstepCount += result.boundaryClippedSubstepCount ?? 0;
        substeps.push(...(result.substeps ?? []));
      }
      if (result.status === "failed") return Object.freeze({ ...result,
        requestedPresentationTimeSec: targetTimeSec,
        partiallyAdvanced: result.partiallyAdvanced || acceptedRevision > initial.revision,
        internalAcceptedSubstepCount, boundaryClippedSubstepCount, substeps: Object.freeze(substeps),
      });
      if (result.status !== "advanced" || result.acceptedTimeSec <= acceptedTimeSec) {
        throw new Error("Preload reserve numerical clock did not advance");
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
    return wrapSession(branch, nominalDtSec, abortSignal);
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
    throw new Error("Preload reserve nominalDtSec must be 0.002 or 0.001");
  }
}

function assertNotAborted(abortSignal: AbortSignal | undefined): void {
  if (abortSignal?.aborted) throw new DOMException("Preload reserve interrupted", "AbortError");
}
