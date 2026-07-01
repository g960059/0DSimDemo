import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  runLeftHeartDynamicReservePointV1,
  type LeftHeartDynamicReserveVariantIdV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
  runRightHeartStrategicPointV1,
  type RightHeartStrategicSmokePointResultV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const RIGHT_HEART_LOW_OUTPUT_CONTRACT_REPORT_ID_V1 =
  "right-heart-low-output-contract-report-v1" as const;

type VolumePolicyIdV1 = "current" | "rv-dilated420" | "rv-dilated520" | "rv-dilated760";

type CandidateSpecV1 = {
  readonly candidateId: string;
  readonly rvTrefPa: number;
  readonly volumePolicyId: VolumePolicyIdV1;
  readonly upperSafetyGainMultiplier: number;
  readonly maxRvVolumeMl: number;
  readonly absoluteMaxRvVolumeMl: number;
};

type CandidateResultV1 = CandidateSpecV1 & {
  readonly status: RightHeartStrategicSmokePointResultV1["status"];
  readonly pvEjectedVolumeMl: number | null;
  readonly strokeVolumeMl: number | null;
  readonly rvpPeakMmHg: number | null;
  readonly rvClampCount: number | null;
  readonly raClampCount: number | null;
  readonly maxSafetyPressureMmHg: number | null;
  readonly morphologyOk: boolean;
  readonly outputOk: boolean;
  readonly clampFree: boolean;
  readonly safetyWorkBounded: boolean;
  readonly cleanLowOutputReserve: boolean;
  readonly acceptedPhenotypeReasons: readonly string[];
  readonly failureReasons: readonly string[];
  readonly rawFailureReasons: readonly string[];
  readonly signedMismatchToLeftMl: number | null;
  readonly absMismatchToLeftMl: number | null;
  readonly relativeMismatchToLeft: number | null;
  readonly alignedWithLeftLowOutput: boolean;
  readonly cleanAlignedRightLowOutput: boolean;
};

export type RightHeartLowOutputContractReportV1 = {
  readonly reportId: typeof RIGHT_HEART_LOW_OUTPUT_CONTRACT_REPORT_ID_V1;
  readonly gateId: "rightHeartLowOutputContractGateV1";
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
    readonly cleanAlignedCount: number;
    readonly clampFreeCount: number;
    readonly safetyBoundedCount: number;
    readonly bestCandidateId: string | null;
    readonly bestAbsMismatchToLeftMl: number | null;
    readonly bestCleanAlignedCandidateId: string | null;
    readonly bestCleanAlignedPvEjectedVolumeMl: number | null;
    readonly baselineAbsMismatchToLeftMl: number | null;
  };
  readonly decision: {
    readonly rightLowOutputContractStatus:
      | "right-low-output-contract-signal"
      | "right-low-output-contract-blocked";
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
const UPPER_SAFETY_GAIN_MULTIPLIERS = [1, 0.5, 0.25, 0.1, 0.05] as const;
const VOLUME_POLICIES: readonly Omit<CandidateSpecV1, "candidateId" | "rvTrefPa" | "upperSafetyGainMultiplier">[] = [
  { volumePolicyId: "current", maxRvVolumeMl: 340, absoluteMaxRvVolumeMl: 380 },
  { volumePolicyId: "rv-dilated420", maxRvVolumeMl: 420, absoluteMaxRvVolumeMl: 520 },
  { volumePolicyId: "rv-dilated520", maxRvVolumeMl: 520, absoluteMaxRvVolumeMl: 640 },
  { volumePolicyId: "rv-dilated760", maxRvVolumeMl: 760, absoluteMaxRvVolumeMl: 920 },
];

export function runRightHeartLowOutputContractBenchV1(): RightHeartLowOutputContractReportV1 {
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
    maxRvVolumeMl: rightLow.maxRvVolumeMl,
    absoluteMaxRvVolumeMl: rightLow.absoluteMaxRvVolumeMl,
  };
  const baselineRightLowContractility = evaluateCandidate(rightLow, baselineSpec, leftTarget);
  const candidates = buildCandidateSpecs().map((spec) => evaluateCandidate(rightLow, spec, leftTarget));
  const cleanAligned = candidates.filter((candidate) => candidate.cleanAlignedRightLowOutput);
  const best = [...candidates].sort((a, b) =>
    (a.absMismatchToLeftMl ?? 1e9) - (b.absMismatchToLeftMl ?? 1e9)
    || Number(b.cleanAlignedRightLowOutput) - Number(a.cleanAlignedRightLowOutput)
    || Number(b.cleanLowOutputReserve) - Number(a.cleanLowOutputReserve),
  )[0] ?? null;
  const bestCleanAligned = [...cleanAligned].sort((a, b) =>
    (a.absMismatchToLeftMl ?? 1e9) - (b.absMismatchToLeftMl ?? 1e9)
  )[0] ?? null;
  const rightLowOutputContractStatus = cleanAligned.length > 0
    ? "right-low-output-contract-signal"
    : "right-low-output-contract-blocked";

  return {
    reportId: RIGHT_HEART_LOW_OUTPUT_CONTRACT_REPORT_ID_V1,
    gateId: "rightHeartLowOutputContractGateV1",
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
      cleanAlignedCount: cleanAligned.length,
      clampFreeCount: candidates.filter((candidate) => candidate.clampFree).length,
      safetyBoundedCount: candidates.filter((candidate) => candidate.safetyWorkBounded).length,
      bestCandidateId: best?.candidateId ?? null,
      bestAbsMismatchToLeftMl: best?.absMismatchToLeftMl ?? null,
      bestCleanAlignedCandidateId: bestCleanAligned?.candidateId ?? null,
      bestCleanAlignedPvEjectedVolumeMl: bestCleanAligned?.pvEjectedVolumeMl ?? null,
      baselineAbsMismatchToLeftMl: baselineRightLowContractility.absMismatchToLeftMl,
    },
    decision: {
      rightLowOutputContractStatus,
      nextAction: rightLowOutputContractStatus === "right-low-output-contract-signal"
        ? "Register the clean aligned right low-output contract candidate and re-run paired/reservoir Gate C. Do not unlock four-chamber, AV-plane, or LandAtrial until reservoir feedback also preserves the left surface."
        : "Do not proceed to four-chamber, AV-plane, or LandAtrial. Right low-output remains blocked by clamp/safety/repeatability ownership even when RV severity and dilation policy are scanned.",
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

function buildCandidateSpecs(): readonly CandidateSpecV1[] {
  const specs: CandidateSpecV1[] = [];
  for (const rvTrefPa of RV_TREF_SCAN_PA) {
    for (const volumePolicy of VOLUME_POLICIES) {
      for (const upperSafetyGainMultiplier of UPPER_SAFETY_GAIN_MULTIPLIERS) {
        specs.push({
          candidateId: `right-low-${volumePolicy.volumePolicyId}-tref-${rvTrefPa}-safety-${upperSafetyGainMultiplier}`,
          rvTrefPa,
          upperSafetyGainMultiplier,
          ...volumePolicy,
        });
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
  const result = runRightHeartStrategicPointV1({
    ...rightBase,
    fixtureId: "right-heart-contractility-low",
    maxRvVolumeMl: spec.maxRvVolumeMl,
    absoluteMaxRvVolumeMl: spec.absoluteMaxRvVolumeMl,
    rvSoftLimitGainMmHgPerMl: rightBase.rvSoftLimitGainMmHgPerMl * spec.upperSafetyGainMultiplier,
    rv: {
      ...rightBase.rv,
      fiber: { ...rightBase.rv.fiber, trefPa: spec.rvTrefPa },
    },
  });
  const mismatch = summarizeMismatch(leftTargetMl, result.finalBeat?.pvEjectedVolumeMl ?? null);
  const alignedWithLeftLowOutput =
    mismatch.absMismatch != null
    && mismatch.relativeMismatch != null
    && (mismatch.absMismatch <= 8 || mismatch.relativeMismatch <= 0.18);
  return {
    ...spec,
    status: result.status,
    pvEjectedVolumeMl: result.finalBeat?.pvEjectedVolumeMl ?? null,
    strokeVolumeMl: result.finalBeat?.strokeVolumeMl ?? null,
    rvpPeakMmHg: result.finalBeat?.rvpPeakMmHg ?? null,
    rvClampCount: result.finalBeat?.rvClampCount ?? null,
    raClampCount: result.finalBeat?.raClampCount ?? null,
    maxSafetyPressureMmHg: result.finalBeat?.maxSafetyPressureMmHg ?? null,
    morphologyOk: result.classifications.morphologyOk,
    outputOk: result.classifications.outputOk,
    clampFree: result.classifications.clampFree,
    safetyWorkBounded: result.classifications.safetyWorkBounded,
    cleanLowOutputReserve: result.classifications.cleanLowOutputReserve,
    acceptedPhenotypeReasons: result.acceptedPhenotypeReasons,
    failureReasons: result.failureReasons,
    rawFailureReasons: result.rawFailureReasons,
    signedMismatchToLeftMl: mismatch.signedMismatch,
    absMismatchToLeftMl: mismatch.absMismatch,
    relativeMismatchToLeft: mismatch.relativeMismatch,
    alignedWithLeftLowOutput,
    cleanAlignedRightLowOutput:
      result.status === "pass"
      && result.classifications.cleanLowOutputReserve
      && alignedWithLeftLowOutput,
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

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
