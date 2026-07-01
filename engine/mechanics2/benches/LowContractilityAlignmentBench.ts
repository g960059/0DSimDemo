import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  runLeftHeartDynamicReservePointV1,
  type LeftHeartDynamicReservePointResultV1,
  type LeftHeartDynamicReserveVariantIdV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
  runRightHeartStrategicPointV1,
  type RightHeartStrategicSmokePointResultV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const LOW_CONTRACTILITY_ALIGNMENT_REPORT_ID_V1 =
  "low-contractility-alignment-report-v1" as const;

type RightSeverityCandidateV1 = {
  readonly candidateId: string;
  readonly rvTrefPa: number;
  readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"];
  readonly rightPvEjectedVolumeMl: number | null;
  readonly rightStrokeVolumeMl: number | null;
  readonly rightRvpPeakMmHg: number | null;
  readonly rightMorphologyOk: boolean;
  readonly rightOutputOk: boolean;
  readonly rightCleanLowOutputReserve: boolean;
  readonly rightFailureReasons: readonly string[];
  readonly rightRawFailureReasons: readonly string[];
  readonly rightAcceptedPhenotypeReasons: readonly string[];
  readonly signedMismatchMl: number | null;
  readonly absMismatchMl: number | null;
  readonly relativeMismatch: number | null;
  readonly flowBalanced: boolean;
  readonly cleanAlignedLowOutput: boolean;
};

type RightSafetyOwnershipCandidateV1 = RightSeverityCandidateV1 & {
  readonly safetyGainMultiplier: number;
  readonly raSoftLimitGainMmHgPerMl: number;
  readonly rvSoftLimitGainMmHgPerMl: number;
};

export type LowContractilityAlignmentReportV1 = {
  readonly reportId: typeof LOW_CONTRACTILITY_ALIGNMENT_REPORT_ID_V1;
  readonly gateId: "lowContractilityAlignmentGateV1";
  readonly sourceSurfaces: {
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly rightReportId: "right-heart-strategic-smoke-report-v1";
  };
  readonly leftLowContractility: {
    readonly pointId: "left-heart-contractility-low";
    readonly status: LeftHeartDynamicReservePointResultV1["status"];
    readonly aovEjectedVolumeMl: number | null;
    readonly strokeVolumeMl: number | null;
    readonly lvpPeakMmHg: number | null;
    readonly morphologyOk: boolean;
    readonly cleanLowOutputReserve: boolean;
    readonly failureReasons: readonly string[];
    readonly rawFailureReasons: readonly string[];
    readonly acceptedPhenotypeReasons: readonly string[];
  };
  readonly rightBaselineLowContractility: {
    readonly pointId: "right-heart-contractility-low";
    readonly rvTrefPa: number;
    readonly status: RightHeartStrategicSmokePointResultV1["status"];
    readonly pvEjectedVolumeMl: number | null;
    readonly strokeVolumeMl: number | null;
    readonly rvpPeakMmHg: number | null;
    readonly morphologyOk: boolean;
    readonly cleanLowOutputReserve: boolean;
    readonly failureReasons: readonly string[];
    readonly rawFailureReasons: readonly string[];
    readonly acceptedPhenotypeReasons: readonly string[];
  };
  readonly rightSeverityScan: readonly RightSeverityCandidateV1[];
  readonly rightSafetyOwnershipScan: readonly RightSafetyOwnershipCandidateV1[];
  readonly summary: {
    readonly candidateCount: number;
    readonly cleanAlignedCount: number;
    readonly flowBalancedCount: number;
    readonly rightMorphologyOkCount: number;
    readonly rightPhenotypeAcceptedCount: number;
    readonly safetyCandidateCount: number;
    readonly safetyCleanAlignedCount: number;
    readonly bestCandidateId: string | null;
    readonly bestAbsMismatchMl: number | null;
    readonly bestRvTrefPa: number | null;
    readonly bestSafetyCandidateId: string | null;
    readonly bestSafetyAbsMismatchMl: number | null;
    readonly bestSafetyRvTrefPa: number | null;
    readonly bestSafetyGainMultiplier: number | null;
    readonly baselineAbsMismatchMl: number | null;
    readonly baselineRightPvEjectedVolumeMl: number | null;
    readonly leftAovEjectedVolumeMl: number | null;
  };
  readonly decision: {
    readonly alignmentStatus:
      | "right-severity-alignment-signal"
      | "alignment-requires-safety-ownership"
      | "no-clean-alignment"
      | "inconclusive";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberCoupling: false;
    readonly morphologyAcceptance: false;
    readonly fourChamberUnlock: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID: LeftHeartDynamicReserveVariantIdV1 =
  "active-length-mv-closure-stateful-root08";

const RIGHT_TREF_SCAN_PA = [14_000, 18_000, 22_000, 26_000, 30_000, 34_000, 38_000, 42_000] as const;
const RIGHT_SAFETY_TREF_SCAN_PA = [14_000, 18_000, 22_000, 26_000] as const;
const RIGHT_SAFETY_GAIN_MULTIPLIERS = [1, 0.5, 0.25, 0.1] as const;

export function runLowContractilityAlignmentBenchV1(): LowContractilityAlignmentReportV1 {
  const leftLow = requiredLeft(
    buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID),
    "left-heart-contractility-low",
  );
  const rightLow = requiredRight(buildRightHeartStrategicEnvelopeV1(), "right-heart-contractility-low");
  const leftResult = runLeftHeartDynamicReservePointV1(leftLow);
  const rightBaseline = runRightHeartStrategicPointV1(rightLow);
  const rightSeverityScan = RIGHT_TREF_SCAN_PA.map((rvTrefPa) =>
    evaluateRightSeverityCandidate(leftResult, rightLow, rvTrefPa)
  );
  const rightSafetyOwnershipScan = RIGHT_SAFETY_TREF_SCAN_PA.flatMap((rvTrefPa) =>
    RIGHT_SAFETY_GAIN_MULTIPLIERS.map((safetyGainMultiplier) =>
      evaluateRightSafetyOwnershipCandidate(leftResult, rightLow, rvTrefPa, safetyGainMultiplier)
    )
  );
  const best = [...rightSeverityScan].sort((a, b) =>
    (a.absMismatchMl ?? 1e9) - (b.absMismatchMl ?? 1e9)
    || Number(b.cleanAlignedLowOutput) - Number(a.cleanAlignedLowOutput)
    || Number(b.rightMorphologyOk) - Number(a.rightMorphologyOk),
  )[0] ?? null;
  const bestSafety = [...rightSafetyOwnershipScan].sort((a, b) =>
    (a.absMismatchMl ?? 1e9) - (b.absMismatchMl ?? 1e9)
    || Number(b.cleanAlignedLowOutput) - Number(a.cleanAlignedLowOutput)
    || Number(b.rightMorphologyOk) - Number(a.rightMorphologyOk),
  )[0] ?? null;
  const cleanAligned = rightSeverityScan.filter((candidate) => candidate.cleanAlignedLowOutput);
  const cleanSafetyAligned = rightSafetyOwnershipScan.filter((candidate) => candidate.cleanAlignedLowOutput);
  const baselineMismatch = summarizeMismatch(
    leftResult.finalBeat?.aovEjectedVolumeMl ?? null,
    rightBaseline.finalBeat?.pvEjectedVolumeMl ?? null,
  );
  const alignmentStatus = leftResult.status !== "pass" || rightBaseline.status !== "pass"
    ? "inconclusive"
    : cleanAligned.length > 0 ? "right-severity-alignment-signal"
      : cleanSafetyAligned.length > 0 ? "alignment-requires-safety-ownership"
        : "no-clean-alignment";
  return {
    reportId: LOW_CONTRACTILITY_ALIGNMENT_REPORT_ID_V1,
    gateId: "lowContractilityAlignmentGateV1",
    sourceSurfaces: {
      leftVariantId: LEFT_VARIANT_ID,
      rightReportId: "right-heart-strategic-smoke-report-v1",
    },
    leftLowContractility: {
      pointId: "left-heart-contractility-low",
      status: leftResult.status,
      aovEjectedVolumeMl: leftResult.finalBeat?.aovEjectedVolumeMl ?? null,
      strokeVolumeMl: leftResult.finalBeat?.strokeVolumeMl ?? null,
      lvpPeakMmHg: leftResult.finalBeat?.lvpPeakMmHg ?? null,
      morphologyOk: leftResult.classifications.morphologyOk,
      cleanLowOutputReserve: leftResult.classifications.cleanLowOutputReserve,
      failureReasons: leftResult.failureReasons,
      rawFailureReasons: leftResult.rawFailureReasons,
      acceptedPhenotypeReasons: leftResult.acceptedPhenotypeReasons,
    },
    rightBaselineLowContractility: {
      pointId: "right-heart-contractility-low",
      rvTrefPa: rightLow.rv.fiber.trefPa,
      status: rightBaseline.status,
      pvEjectedVolumeMl: rightBaseline.finalBeat?.pvEjectedVolumeMl ?? null,
      strokeVolumeMl: rightBaseline.finalBeat?.strokeVolumeMl ?? null,
      rvpPeakMmHg: rightBaseline.finalBeat?.rvpPeakMmHg ?? null,
      morphologyOk: rightBaseline.classifications.morphologyOk,
      cleanLowOutputReserve: rightBaseline.classifications.cleanLowOutputReserve,
      failureReasons: rightBaseline.failureReasons,
      rawFailureReasons: rightBaseline.rawFailureReasons,
      acceptedPhenotypeReasons: rightBaseline.acceptedPhenotypeReasons,
    },
    rightSeverityScan,
    rightSafetyOwnershipScan,
    summary: {
      candidateCount: rightSeverityScan.length,
      cleanAlignedCount: cleanAligned.length,
      flowBalancedCount: rightSeverityScan.filter((candidate) => candidate.flowBalanced).length,
      rightMorphologyOkCount: rightSeverityScan.filter((candidate) => candidate.rightMorphologyOk).length,
      rightPhenotypeAcceptedCount: rightSeverityScan.filter((candidate) =>
        candidate.rightAcceptedPhenotypeReasons.length > 0
      ).length,
      safetyCandidateCount: rightSafetyOwnershipScan.length,
      safetyCleanAlignedCount: cleanSafetyAligned.length,
      bestCandidateId: best?.candidateId ?? null,
      bestAbsMismatchMl: best?.absMismatchMl ?? null,
      bestRvTrefPa: best?.rvTrefPa ?? null,
      bestSafetyCandidateId: bestSafety?.candidateId ?? null,
      bestSafetyAbsMismatchMl: bestSafety?.absMismatchMl ?? null,
      bestSafetyRvTrefPa: bestSafety?.rvTrefPa ?? null,
      bestSafetyGainMultiplier: bestSafety?.safetyGainMultiplier ?? null,
      baselineAbsMismatchMl: baselineMismatch.absMismatch,
      baselineRightPvEjectedVolumeMl: rightBaseline.finalBeat?.pvEjectedVolumeMl ?? null,
      leftAovEjectedVolumeMl: leftResult.finalBeat?.aovEjectedVolumeMl ?? null,
    },
    decision: {
      alignmentStatus,
      nextAction: alignmentStatus === "right-severity-alignment-signal"
        ? "Treat the Gate C low-contractility residual as a profile-severity alignment issue before changing reservoir structure. Re-run paired/reservoir gates with an explicitly registered aligned right low-contractility profile; do not unlock four-chamber, AV-plane, or LandAtrial yet."
        : alignmentStatus === "alignment-requires-safety-ownership"
          ? "Treat the Gate C low-contractility residual as a combined profile-severity and right-heart safety-ownership issue. Do not tune the reservoir to hide it; register a right low-output phenotype/safety contract candidate and re-run paired/reservoir gates before any four-chamber, AV-plane, or LandAtrial work."
        : alignmentStatus === "no-clean-alignment"
          ? "Do not tune the reservoir to hide low-contractility mismatch. The right severity scan found no clean aligned low-output point, so classify deeper right/left low-output contract ownership before four-chamber work."
          : "Source low-contractility surfaces are not clean enough for alignment classification.",
      blockedClaims: [
        "four-chamber-unlock",
        "AV-plane-unlock",
        "LandAtrial-unlock",
        "runtime-wiring",
        "morphology-acceptance",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberCoupling: false,
      morphologyAcceptance: false,
      fourChamberUnlock: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function evaluateRightSafetyOwnershipCandidate(
  left: LeftHeartDynamicReservePointResultV1,
  rightBase: RightHeartSubsystemParamsV2,
  rvTrefPa: number,
  safetyGainMultiplier: number,
): RightSafetyOwnershipCandidateV1 {
  const right = runRightHeartStrategicPointV1({
    ...rightBase,
    fixtureId: "right-heart-contractility-low",
    raSoftLimitGainMmHgPerMl: rightBase.raSoftLimitGainMmHgPerMl * safetyGainMultiplier,
    rvSoftLimitGainMmHgPerMl: rightBase.rvSoftLimitGainMmHgPerMl * safetyGainMultiplier,
    rv: {
      ...rightBase.rv,
      fiber: { ...rightBase.rv.fiber, trefPa: rvTrefPa },
    },
  });
  const mismatch = summarizeMismatch(
    left.finalBeat?.aovEjectedVolumeMl ?? null,
    right.finalBeat?.pvEjectedVolumeMl ?? null,
  );
  const rightMorphologyOk = right.classifications.morphologyOk;
  const flowBalanced =
    mismatch.absMismatch != null
    && mismatch.relativeMismatch != null
    && (mismatch.absMismatch <= 8 || mismatch.relativeMismatch <= 0.18);
  const rightCleanLowOutputReserve = right.classifications.cleanLowOutputReserve;
  return {
    candidateId: `right-low-tref-${rvTrefPa}-safety-${safetyGainMultiplier}`,
    rvTrefPa,
    safetyGainMultiplier,
    raSoftLimitGainMmHgPerMl: round(rightBase.raSoftLimitGainMmHgPerMl * safetyGainMultiplier),
    rvSoftLimitGainMmHgPerMl: round(rightBase.rvSoftLimitGainMmHgPerMl * safetyGainMultiplier),
    rightStatus: right.status,
    rightPvEjectedVolumeMl: right.finalBeat?.pvEjectedVolumeMl ?? null,
    rightStrokeVolumeMl: right.finalBeat?.strokeVolumeMl ?? null,
    rightRvpPeakMmHg: right.finalBeat?.rvpPeakMmHg ?? null,
    rightMorphologyOk,
    rightOutputOk: right.classifications.outputOk,
    rightCleanLowOutputReserve,
    rightFailureReasons: right.failureReasons,
    rightRawFailureReasons: right.rawFailureReasons,
    rightAcceptedPhenotypeReasons: right.acceptedPhenotypeReasons,
    signedMismatchMl: mismatch.signedMismatch,
    absMismatchMl: mismatch.absMismatch,
    relativeMismatch: mismatch.relativeMismatch,
    flowBalanced,
    cleanAlignedLowOutput:
      right.status === "pass"
      && rightMorphologyOk
      && rightCleanLowOutputReserve
      && flowBalanced,
  };
}

function evaluateRightSeverityCandidate(
  left: LeftHeartDynamicReservePointResultV1,
  rightBase: RightHeartSubsystemParamsV2,
  rvTrefPa: number,
): RightSeverityCandidateV1 {
  const right = runRightHeartStrategicPointV1({
    ...rightBase,
    fixtureId: "right-heart-contractility-low",
    rv: {
      ...rightBase.rv,
      fiber: { ...rightBase.rv.fiber, trefPa: rvTrefPa },
    },
  });
  const mismatch = summarizeMismatch(
    left.finalBeat?.aovEjectedVolumeMl ?? null,
    right.finalBeat?.pvEjectedVolumeMl ?? null,
  );
  const rightMorphologyOk = right.classifications.morphologyOk;
  const flowBalanced =
    mismatch.absMismatch != null
    && mismatch.relativeMismatch != null
    && (mismatch.absMismatch <= 8 || mismatch.relativeMismatch <= 0.18);
  const rightCleanLowOutputReserve = right.classifications.cleanLowOutputReserve;
  return {
    candidateId: `right-low-tref-${rvTrefPa}`,
    rvTrefPa,
    rightStatus: right.status,
    rightPvEjectedVolumeMl: right.finalBeat?.pvEjectedVolumeMl ?? null,
    rightStrokeVolumeMl: right.finalBeat?.strokeVolumeMl ?? null,
    rightRvpPeakMmHg: right.finalBeat?.rvpPeakMmHg ?? null,
    rightMorphologyOk,
    rightOutputOk: right.classifications.outputOk,
    rightCleanLowOutputReserve,
    rightFailureReasons: right.failureReasons,
    rightRawFailureReasons: right.rawFailureReasons,
    rightAcceptedPhenotypeReasons: right.acceptedPhenotypeReasons,
    signedMismatchMl: mismatch.signedMismatch,
    absMismatchMl: mismatch.absMismatch,
    relativeMismatch: mismatch.relativeMismatch,
    flowBalanced,
    cleanAlignedLowOutput:
      right.status === "pass"
      && rightMorphologyOk
      && rightCleanLowOutputReserve
      && flowBalanced,
  };
}

function summarizeMismatch(
  leftEjected: number | null,
  rightEjected: number | null,
): {
  readonly signedMismatch: number | null;
  readonly absMismatch: number | null;
  readonly relativeMismatch: number | null;
} {
  if (leftEjected == null || rightEjected == null) {
    return { signedMismatch: null, absMismatch: null, relativeMismatch: null };
  }
  const signedMismatch = leftEjected - rightEjected;
  const absMismatch = Math.abs(signedMismatch);
  const meanForward = (Math.abs(leftEjected) + Math.abs(rightEjected)) / 2;
  return {
    signedMismatch: round(signedMismatch),
    absMismatch: round(absMismatch),
    relativeMismatch: meanForward > 1e-9 ? round(absMismatch / meanForward) : null,
  };
}

function requiredLeft(
  params: readonly LeftHeartSubsystemParamsV2[],
  fixtureId: string,
): LeftHeartSubsystemParamsV2 {
  const match = params.find((candidate) => candidate.fixtureId === fixtureId);
  if (match == null) throw new Error(`Missing left fixture ${fixtureId}`);
  return match;
}

function requiredRight(
  params: readonly RightHeartSubsystemParamsV2[],
  fixtureId: string,
): RightHeartSubsystemParamsV2 {
  const match = params.find((candidate) => candidate.fixtureId === fixtureId);
  if (match == null) throw new Error(`Missing right fixture ${fixtureId}`);
  return match;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
