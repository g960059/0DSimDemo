import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  runLeftHeartDynamicReservePointV1,
  type LeftHeartDynamicReserveVariantIdV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runReservoirStateContractBenchWithRightParamsV1,
} from "@/engine/mechanics2/benches/ReservoirStateContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
  runRightHeartStrategicPointV1,
  summarizeRightHeartStrategicPointsV1,
  type RightHeartStrategicSmokePointResultV1,
  type RightHeartStrategicSmokeReportV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  runRightHeartSubsystemV2,
  type RightHeartSubsystemParamsV2,
} from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const RIGHT_HEART_VOLUME_RESERVE_CONTRACT_REPORT_ID_V1 =
  "right-heart-volume-reserve-contract-report-v1" as const;

type VolumePolicyIdV1 = "current" | "rv-dilated420" | "rv-dilated520" | "rv-dilated760";

type CandidateSpecV1 = {
  readonly candidateId: string;
  readonly rvTrefPa: number;
  readonly volumePolicyId: VolumePolicyIdV1;
  readonly upperSafetyGainMultiplier: number;
  readonly upperPressureContribution01: number;
  readonly maxRvVolumeMl: number;
  readonly absoluteMaxRvVolumeMl: number;
};

type CandidateResultV1 = CandidateSpecV1 & {
  readonly status: RightHeartStrategicSmokePointResultV1["status"];
  readonly pvEjectedVolumeMl: number | null;
  readonly strokeVolumeMl: number | null;
  readonly rvpPeakMmHg: number | null;
  readonly maxSafetyPressureMmHg: number | null;
  readonly maxRvVolumeMlObserved: number | null;
  readonly maxRvUpperReserveEquivalentMmHg: number | null;
  readonly morphologyOk: boolean;
  readonly clampFree: boolean;
  readonly safetyWorkBounded: boolean;
  readonly cleanLowOutputReserve: boolean;
  readonly hiddenReserveBounded: boolean;
  readonly acceptedPhenotypeReasons: readonly string[];
  readonly rawFailureReasons: readonly string[];
  readonly signedMismatchToLeftMl: number | null;
  readonly absMismatchToLeftMl: number | null;
  readonly relativeMismatchToLeft: number | null;
  readonly alignedWithLeftLowOutput: boolean;
  readonly cleanAlignedVolumeReserve: boolean;
};

export type RightHeartVolumeReserveContractReportV1 = {
  readonly reportId: typeof RIGHT_HEART_VOLUME_RESERVE_CONTRACT_REPORT_ID_V1;
  readonly gateId: "rightHeartVolumeReserveContractGateV1";
  readonly sourceSurfaces: {
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly rightReportId: "right-heart-strategic-smoke-report-v1";
  };
  readonly leftLowContractility: {
    readonly aovEjectedVolumeMl: number | null;
    readonly status: string;
    readonly acceptedPhenotypeReasons: readonly string[];
  };
  readonly baselineRightLowContractility: CandidateResultV1;
  readonly candidates: readonly CandidateResultV1[];
  readonly summary: {
    readonly totalCandidates: number;
    readonly cleanRightLowOutputCount: number;
    readonly alignedWithLeftCount: number;
    readonly cleanAlignedVolumeReserveCount: number;
    readonly hiddenReserveBoundedCount: number;
    readonly bestCandidateId: string | null;
    readonly bestAbsMismatchToLeftMl: number | null;
    readonly bestCleanAlignedCandidateId: string | null;
    readonly bestCleanAlignedReserveEquivalentMmHg: number | null;
    readonly baselineAbsMismatchToLeftMl: number | null;
  };
  readonly reentry: {
    readonly candidateId: string | null;
    readonly rightSurfaceSummary: RightHeartStrategicSmokeReportV1["summary"] | null;
    readonly pairedPassCount: number | null;
    readonly pairedTotal: number;
    readonly pairedRemainingBlockers: readonly string[];
    readonly reservoirStateStatus: string | null;
    readonly reservoirBestVariantId: string | null;
    readonly reservoirBestPassCount: number | null;
    readonly reservoirBestMeanAbsMismatchMl: number | null;
    readonly reservoirRemainingBlockers: readonly string[];
  };
  readonly decision: {
    readonly rightVolumeReserveContractStatus:
      | "right-volume-reserve-contract-signal"
      | "right-volume-reserve-contract-blocked";
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

const RV_TREF_SCAN_PA = [18_000, 22_000, 26_000] as const;
const UPPER_SAFETY_GAIN_MULTIPLIERS = [1, 0.5, 0.25] as const;
const UPPER_PRESSURE_CONTRIBUTIONS = [0, 0.25, 0.5] as const;
const VOLUME_POLICIES: readonly Omit<CandidateSpecV1, "candidateId" | "rvTrefPa" | "upperSafetyGainMultiplier" | "upperPressureContribution01">[] = [
  { volumePolicyId: "current", maxRvVolumeMl: 340, absoluteMaxRvVolumeMl: 380 },
  { volumePolicyId: "rv-dilated420", maxRvVolumeMl: 420, absoluteMaxRvVolumeMl: 520 },
  { volumePolicyId: "rv-dilated520", maxRvVolumeMl: 520, absoluteMaxRvVolumeMl: 640 },
  { volumePolicyId: "rv-dilated760", maxRvVolumeMl: 760, absoluteMaxRvVolumeMl: 920 },
];

export function runRightHeartVolumeReserveContractBenchV1(): RightHeartVolumeReserveContractReportV1 {
  const leftLow = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID)
    .find((point) => point.fixtureId === "left-heart-contractility-low");
  const rightLow = buildRightHeartStrategicEnvelopeV1()
    .find((point) => point.fixtureId === "right-heart-contractility-low");
  if (leftLow == null) throw new Error("Missing left-heart-contractility-low");
  if (rightLow == null) throw new Error("Missing right-heart-contractility-low");

  const leftResult = runLeftHeartDynamicReservePointV1(leftLow);
  const leftTarget = leftResult.finalBeat?.aovEjectedVolumeMl ?? null;
  const baselineSpec: CandidateSpecV1 = {
    candidateId: "baseline-right-low-contractility",
    rvTrefPa: rightLow.rv.fiber.trefPa,
    volumePolicyId: "current",
    upperSafetyGainMultiplier: 1,
    upperPressureContribution01: 1,
    maxRvVolumeMl: rightLow.maxRvVolumeMl,
    absoluteMaxRvVolumeMl: rightLow.absoluteMaxRvVolumeMl,
  };
  const baselineRightLowContractility = evaluateCandidate(rightLow, baselineSpec, leftTarget);
  const candidates = buildCandidateSpecs().map((spec) => evaluateCandidate(rightLow, spec, leftTarget));
  const cleanAligned = candidates.filter((candidate) => candidate.cleanAlignedVolumeReserve);
  const best = [...candidates].sort((a, b) =>
    (a.absMismatchToLeftMl ?? 1e9) - (b.absMismatchToLeftMl ?? 1e9)
    || Number(b.cleanAlignedVolumeReserve) - Number(a.cleanAlignedVolumeReserve)
    || Number(b.cleanLowOutputReserve) - Number(a.cleanLowOutputReserve)
    || Number(b.hiddenReserveBounded) - Number(a.hiddenReserveBounded),
  )[0] ?? null;
  const bestCleanAligned = [...cleanAligned].sort((a, b) =>
    (a.absMismatchToLeftMl ?? 1e9) - (b.absMismatchToLeftMl ?? 1e9)
  )[0] ?? null;
  const reentry = bestCleanAligned == null
    ? emptyReentry()
    : runRightSurfaceReentry(rightLow, bestCleanAligned);
  const rightVolumeReserveContractStatus = cleanAligned.length > 0
    ? "right-volume-reserve-contract-signal"
    : "right-volume-reserve-contract-blocked";

  return {
    reportId: RIGHT_HEART_VOLUME_RESERVE_CONTRACT_REPORT_ID_V1,
    gateId: "rightHeartVolumeReserveContractGateV1",
    sourceSurfaces: {
      leftVariantId: LEFT_VARIANT_ID,
      rightReportId: "right-heart-strategic-smoke-report-v1",
    },
    leftLowContractility: {
      aovEjectedVolumeMl: leftTarget,
      status: leftResult.status,
      acceptedPhenotypeReasons: leftResult.acceptedPhenotypeReasons,
    },
    baselineRightLowContractility,
    candidates,
    summary: {
      totalCandidates: candidates.length,
      cleanRightLowOutputCount: candidates.filter((candidate) => candidate.cleanLowOutputReserve).length,
      alignedWithLeftCount: candidates.filter((candidate) => candidate.alignedWithLeftLowOutput).length,
      cleanAlignedVolumeReserveCount: cleanAligned.length,
      hiddenReserveBoundedCount: candidates.filter((candidate) => candidate.hiddenReserveBounded).length,
      bestCandidateId: best?.candidateId ?? null,
      bestAbsMismatchToLeftMl: best?.absMismatchToLeftMl ?? null,
      bestCleanAlignedCandidateId: bestCleanAligned?.candidateId ?? null,
      bestCleanAlignedReserveEquivalentMmHg: bestCleanAligned?.maxRvUpperReserveEquivalentMmHg ?? null,
      baselineAbsMismatchToLeftMl: baselineRightLowContractility.absMismatchToLeftMl,
    },
    reentry,
    decision: {
      rightVolumeReserveContractStatus,
      nextAction: rightVolumeReserveContractStatus === "right-volume-reserve-contract-signal"
        ? "The clean aligned RV volume-reserve candidate exists, but re-entry must be judged by the full right/paired surface before stateful reservoir Gate C. Do not unlock four-chamber, AV-plane, or LandAtrial until reservoir feedback also preserves both surfaces."
        : "Do not proceed to four-chamber, AV-plane, or LandAtrial. RV volume reserve does not yet provide a clean aligned right low-output phenotype.",
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

function emptyReentry(): RightHeartVolumeReserveContractReportV1["reentry"] {
  return {
    candidateId: null,
    rightSurfaceSummary: null,
    pairedPassCount: null,
    pairedTotal: 7,
    pairedRemainingBlockers: ["no-clean-aligned-candidate"],
    reservoirStateStatus: null,
    reservoirBestVariantId: null,
    reservoirBestPassCount: null,
    reservoirBestMeanAbsMismatchMl: null,
    reservoirRemainingBlockers: ["no-clean-aligned-candidate"],
  };
}

function runRightSurfaceReentry(
  rightLowBase: RightHeartSubsystemParamsV2,
  candidate: CandidateResultV1,
): RightHeartVolumeReserveContractReportV1["reentry"] {
  const rightPointResults = buildRightHeartStrategicEnvelopeV1()
    .map((point) => runRightHeartStrategicPointV1(applyVolumeReserveCandidate(point, rightLowBase, candidate)));
  const rightParams = buildRightHeartStrategicEnvelopeV1()
    .map((point) => applyVolumeReserveCandidate(point, rightLowBase, candidate));
  const reservoir = runReservoirStateContractBenchWithRightParamsV1(
    rightParams,
    `right-volume-reserve:${candidate.candidateId}`,
  );
  const rightSurfaceSummary = summarizeRightHeartStrategicPointsV1(rightPointResults);
  const leftPoints = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID)
    .map(runLeftHeartDynamicReservePointV1);
  const pairedRemainingBlockers: string[] = [];
  let pairedPassCount = 0;
  for (const right of rightPointResults) {
    const left = leftPoints.find((point) => point.pointId === leftPointIdForRightPoint(right.pointId));
    const failures = [
      ...(left == null ? ["left:missing"] : left.failureReasons.map((reason) => `left:${reason}`)),
      ...right.failureReasons.map((reason) => `right:${reason}`),
    ];
    if (failures.length === 0) pairedPassCount++;
    else pairedRemainingBlockers.push(`${right.pointId}: ${failures.join(",")}`);
  }
  return {
    candidateId: candidate.candidateId,
    rightSurfaceSummary,
    pairedPassCount,
    pairedTotal: rightPointResults.length,
    pairedRemainingBlockers,
    reservoirStateStatus: reservoir.decision.reservoirStateStatus,
    reservoirBestVariantId: reservoir.decision.bestVariantId,
    reservoirBestPassCount: reservoir.decision.bestPassCount,
    reservoirBestMeanAbsMismatchMl: reservoir.decision.bestMeanAbsMismatchMl,
    reservoirRemainingBlockers: reservoir.decision.remainingBlockers,
  };
}

function applyVolumeReserveCandidate(
  point: RightHeartSubsystemParamsV2,
  rightLowBase: RightHeartSubsystemParamsV2,
  candidate: CandidateResultV1,
): RightHeartSubsystemParamsV2 {
  const lowContractilityTref = point.fixtureId === "right-heart-contractility-low"
    ? candidate.rvTrefPa
    : point.rv.fiber.trefPa;
  return {
    ...point,
    maxRvVolumeMl: candidate.maxRvVolumeMl,
    absoluteMaxRvVolumeMl: candidate.absoluteMaxRvVolumeMl,
    rvSoftLimitGainMmHgPerMl: rightLowBase.rvSoftLimitGainMmHgPerMl * candidate.upperSafetyGainMultiplier,
    rvUpperSoftLimitPressureContribution01: candidate.upperPressureContribution01,
    rv: {
      ...point.rv,
      fiber: { ...point.rv.fiber, trefPa: lowContractilityTref },
    },
  };
}

function leftPointIdForRightPoint(rightPointId: string): string {
  switch (rightPointId) {
    case "right-heart-normal-hr75": return "left-heart-normal-hr75";
    case "right-heart-normal-hr90": return "left-heart-normal-hr90";
    case "right-heart-preload-low": return "left-heart-preload-low";
    case "right-heart-preload-high": return "left-heart-preload-high";
    case "right-heart-pulmonary-afterload-high": return "left-heart-afterload-high";
    case "right-heart-contractility-low": return "left-heart-contractility-low";
    case "right-heart-contractility-high": return "left-heart-contractility-high";
    default: return rightPointId;
  }
}

function buildCandidateSpecs(): readonly CandidateSpecV1[] {
  const specs: CandidateSpecV1[] = [];
  for (const rvTrefPa of RV_TREF_SCAN_PA) {
    for (const volumePolicy of VOLUME_POLICIES) {
      for (const upperSafetyGainMultiplier of UPPER_SAFETY_GAIN_MULTIPLIERS) {
        for (const upperPressureContribution01 of UPPER_PRESSURE_CONTRIBUTIONS) {
          specs.push({
            candidateId: [
              "right-volume-reserve",
              volumePolicy.volumePolicyId,
              `tref-${rvTrefPa}`,
              `safety-${upperSafetyGainMultiplier}`,
              `pressure-${upperPressureContribution01}`,
            ].join("-"),
            rvTrefPa,
            upperSafetyGainMultiplier,
            upperPressureContribution01,
            ...volumePolicy,
          });
        }
      }
    }
  }
  return specs;
}

function evaluateCandidate(
  rightBase: RightHeartSubsystemParamsV2,
  spec: CandidateSpecV1,
  leftTargetMl: number | null,
): CandidateResultV1 {
  const params: RightHeartSubsystemParamsV2 = {
    ...rightBase,
    fixtureId: "right-heart-contractility-low",
    maxRvVolumeMl: spec.maxRvVolumeMl,
    absoluteMaxRvVolumeMl: spec.absoluteMaxRvVolumeMl,
    rvSoftLimitGainMmHgPerMl: rightBase.rvSoftLimitGainMmHgPerMl * spec.upperSafetyGainMultiplier,
    rvUpperSoftLimitPressureContribution01: spec.upperPressureContribution01,
    rv: {
      ...rightBase.rv,
      fiber: { ...rightBase.rv.fiber, trefPa: spec.rvTrefPa },
    },
  };
  const result = runRightHeartStrategicPointV1(params);
  const inspectRun = runRightHeartSubsystemV2(params);
  const finalBeatSamples = inspectRun.finalBeatSamples;
  const maxRvVolumeMlObserved = maxFinite(finalBeatSamples.map((sample) => sample.acceptedRvVolumeMl));
  const maxRvUpperReserveEquivalentMmHg = maxRvVolumeMlObserved == null
    ? null
    : round(Math.max(0, maxRvVolumeMlObserved - spec.maxRvVolumeMl) * params.rvSoftLimitGainMmHgPerMl);
  const mismatch = summarizeMismatch(leftTargetMl, result.finalBeat?.pvEjectedVolumeMl ?? null);
  const alignedWithLeftLowOutput =
    mismatch.absMismatch != null
    && mismatch.relativeMismatch != null
    && (mismatch.absMismatch <= 8 || mismatch.relativeMismatch <= 0.18);
  const hiddenReserveBounded = (maxRvUpperReserveEquivalentMmHg ?? 999) <= 8;
  return {
    ...spec,
    status: result.status,
    pvEjectedVolumeMl: result.finalBeat?.pvEjectedVolumeMl ?? null,
    strokeVolumeMl: result.finalBeat?.strokeVolumeMl ?? null,
    rvpPeakMmHg: result.finalBeat?.rvpPeakMmHg ?? null,
    maxSafetyPressureMmHg: result.finalBeat?.maxSafetyPressureMmHg ?? null,
    maxRvVolumeMlObserved,
    maxRvUpperReserveEquivalentMmHg,
    morphologyOk: result.classifications.morphologyOk,
    clampFree: result.classifications.clampFree,
    safetyWorkBounded: result.classifications.safetyWorkBounded,
    cleanLowOutputReserve: result.classifications.cleanLowOutputReserve,
    hiddenReserveBounded,
    acceptedPhenotypeReasons: result.acceptedPhenotypeReasons,
    rawFailureReasons: result.rawFailureReasons,
    signedMismatchToLeftMl: mismatch.signedMismatch,
    absMismatchToLeftMl: mismatch.absMismatch,
    relativeMismatchToLeft: mismatch.relativeMismatch,
    alignedWithLeftLowOutput,
    cleanAlignedVolumeReserve:
      result.status === "pass"
      && result.classifications.cleanLowOutputReserve
      && alignedWithLeftLowOutput
      && hiddenReserveBounded,
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

function maxFinite(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
