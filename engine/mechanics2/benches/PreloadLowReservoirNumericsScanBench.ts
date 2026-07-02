import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  type LeftHeartDynamicReserveVariantIdV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  runFourChamberSubsystemV1,
  type FourChamberSubsystemProfileIdV1,
  type FourChamberSubsystemReservoirParamsV1,
  type FourChamberSubsystemRunV1,
} from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const PRELOAD_LOW_RESERVOIR_NUMERICS_SCAN_REPORT_ID_V1 =
  "preload-low-reservoir-numerics-scan-report-v1" as const;

type ScenarioIdV1 = "nominal" | "dt-half" | "long-epochs";

type ScenarioSpecV1 = {
  readonly scenarioId: ScenarioIdV1;
  readonly sampleRateMultiplier: number;
  readonly epochs: number;
};

type ProfileMapV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

type CandidateSpecV1 = {
  readonly candidateId: string;
  readonly transferGain01: number;
  readonly complianceScale01: number;
};

type PointSummaryV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly scenarioId: ScenarioIdV1;
  readonly status: FourChamberSubsystemRunV1["status"];
  readonly absForwardMismatchMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
  readonly leftStatus: string;
  readonly rightStatus: string;
  readonly failureReasons: readonly string[];
};

type PreloadCandidateResultV1 = {
  readonly candidate: CandidateSpecV1;
  readonly preloadLowResults: readonly PointSummaryV1[];
  readonly preloadLowPassCount: number;
  readonly maxAbsForwardMismatchMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly maxAbsReservoirVolumeMl: number | null;
  readonly maxFinalReservoirStepMl: number | null;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type FullEnvelopeValidationV1 = {
  readonly candidate: CandidateSpecV1;
  readonly profileResults: readonly PointSummaryV1[];
  readonly summary: {
    readonly pointCount: number;
    readonly passCount: number;
    readonly nominalPassCount: number;
    readonly dtHalfPassCount: number;
    readonly longEpochPassCount: number;
    readonly maxAbsForwardMismatchMl: number | null;
    readonly maxAbsAcceptedTransferMl: number | null;
    readonly maxAbsReservoirVolumeMl: number | null;
  };
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

export type PreloadLowReservoirNumericsScanReportV1 = {
  readonly reportId: typeof PRELOAD_LOW_RESERVOIR_NUMERICS_SCAN_REPORT_ID_V1;
  readonly gateId: "preloadLowReservoirNumericsScanV1";
  readonly sourceSurfaces: {
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly selectedScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35";
  };
  readonly preloadScanResults: readonly PreloadCandidateResultV1[];
  readonly validatedCandidates: readonly FullEnvelopeValidationV1[];
  readonly summary: {
    readonly scannedCandidateCount: number;
    readonly preloadLowPassCandidateCount: number;
    readonly validatedCandidateCount: number;
    readonly fullEnvelopePassCandidateCount: number;
    readonly bestCandidateId: string | null;
    readonly bestFullEnvelopePassCount: number | null;
    readonly bestMaxAbsReservoirVolumeMl: number | null;
  };
  readonly decision: {
    readonly scanStatus:
      | "preload-low-reservoir-numerics-scan-pass"
      | "preload-low-reservoir-numerics-scan-mixed"
      | "preload-low-reservoir-numerics-scan-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID: LeftHeartDynamicReserveVariantIdV1 =
  "active-length-mv-closure-stateful-root08";

const PRELOAD_LOW_PROFILE: ProfileMapV1 = {
  profileId: "preload-low",
  leftPointId: "left-heart-preload-low",
  rightPointId: "right-heart-preload-low",
};

const PROFILE_MAP: readonly ProfileMapV1[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  PRELOAD_LOW_PROFILE,
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

const SCENARIOS: readonly ScenarioSpecV1[] = [
  { scenarioId: "nominal", sampleRateMultiplier: 1, epochs: 14 },
  { scenarioId: "dt-half", sampleRateMultiplier: 2, epochs: 14 },
  { scenarioId: "long-epochs", sampleRateMultiplier: 1, epochs: 22 },
];

const CANDIDATES: readonly CandidateSpecV1[] = [0.04, 0.06, 0.08, 0.10, 0.12, 0.14]
  .flatMap((gain) => [0.5, 0.75, 1].map((compliance) => ({
    candidateId: `gain${format(gain)}-compliance${format(compliance)}`,
    transferGain01: gain,
    complianceScale01: compliance,
  })));

export function runPreloadLowReservoirNumericsScanBenchV1():
PreloadLowReservoirNumericsScanReportV1 {
  const preloadScanResults = CANDIDATES.map(runPreloadCandidate);
  const candidatesForValidation = [...preloadScanResults]
    .sort((a, b) =>
      b.preloadLowPassCount - a.preloadLowPassCount
      || (a.maxAbsReservoirVolumeMl ?? 1e9) - (b.maxAbsReservoirVolumeMl ?? 1e9)
      || (a.maxAbsForwardMismatchMl ?? 1e9) - (b.maxAbsForwardMismatchMl ?? 1e9),
    )
    .slice(0, 3)
    .map((result) => result.candidate);
  const validatedCandidates = candidatesForValidation.map(runFullEnvelopeValidation);
  const fullPasses = validatedCandidates.filter((candidate) => candidate.status === "pass");
  const best = [...validatedCandidates].sort((a, b) =>
    b.summary.passCount - a.summary.passCount
    || (a.summary.maxAbsReservoirVolumeMl ?? 1e9) - (b.summary.maxAbsReservoirVolumeMl ?? 1e9)
    || (a.summary.maxAbsForwardMismatchMl ?? 1e9) - (b.summary.maxAbsForwardMismatchMl ?? 1e9),
  )[0] ?? null;
  const scanStatus = fullPasses.length > 0
    ? "preload-low-reservoir-numerics-scan-pass"
    : preloadScanResults.some((candidate) => candidate.status === "pass")
      ? "preload-low-reservoir-numerics-scan-mixed"
      : "preload-low-reservoir-numerics-scan-blocked";
  return {
    reportId: PRELOAD_LOW_RESERVOIR_NUMERICS_SCAN_REPORT_ID_V1,
    gateId: "preloadLowReservoirNumericsScanV1",
    sourceSurfaces: {
      leftVariantId: LEFT_VARIANT_ID,
      selectedScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35",
    },
    preloadScanResults,
    validatedCandidates,
    summary: {
      scannedCandidateCount: preloadScanResults.length,
      preloadLowPassCandidateCount: preloadScanResults.filter((candidate) => candidate.status === "pass").length,
      validatedCandidateCount: validatedCandidates.length,
      fullEnvelopePassCandidateCount: fullPasses.length,
      bestCandidateId: best?.candidate.candidateId ?? null,
      bestFullEnvelopePassCount: best?.summary.passCount ?? null,
      bestMaxAbsReservoirVolumeMl: best?.summary.maxAbsReservoirVolumeMl ?? null,
    },
    decision: {
      scanStatus,
      nextAction: scanStatus === "preload-low-reservoir-numerics-scan-pass"
        ? "Promote the passing reservoir/numerics candidate into four-chamber subsystem review. Keep runtime, AV-plane, and LandAtrial blocked."
        : scanStatus === "preload-low-reservoir-numerics-scan-mixed"
          ? "Use the full-envelope validation failures to decide the next reservoir/numerics repair; do not expand to runtime, AV-plane, or LandAtrial."
          : "The preload-low residual is not solved by this reservoir gain/compliance scan. Revisit subsystem numerics or preload-low source surfaces before expansion.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function runPreloadCandidate(candidate: CandidateSpecV1): PreloadCandidateResultV1 {
  const preloadLowResults = SCENARIOS.map((scenario) =>
    runScenarioProfile(candidate, scenario, PRELOAD_LOW_PROFILE)
  );
  const failureReasons = preloadLowResults
    .filter((profile) => profile.status !== "pass")
    .map((profile) => `${profile.scenarioId}: ${profile.failureReasons.join(",")}`);
  return {
    candidate,
    preloadLowResults,
    preloadLowPassCount: preloadLowResults.filter((profile) => profile.status === "pass").length,
    maxAbsForwardMismatchMl: maxOrNull(preloadLowResults.map((profile) => profile.absForwardMismatchMl)),
    maxAbsAcceptedTransferMl: maxOrNull(preloadLowResults.map((profile) => profile.maxAbsAcceptedTransferMl)),
    maxAbsReservoirVolumeMl: maxOrNull(preloadLowResults.map((profile) => profile.maxAbsReservoirVolumeMl)),
    maxFinalReservoirStepMl: maxOrNull(preloadLowResults.map((profile) => profile.finalReservoirStepMl)),
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function runFullEnvelopeValidation(candidate: CandidateSpecV1): FullEnvelopeValidationV1 {
  const profileResults = SCENARIOS.flatMap((scenario) =>
    PROFILE_MAP.map((profile) => runScenarioProfile(candidate, scenario, profile))
  );
  const failureReasons = profileResults
    .filter((profile) => profile.status !== "pass")
    .map((profile) => `${profile.scenarioId}/${profile.profileId}: ${profile.failureReasons.join(",")}`);
  return {
    candidate,
    profileResults,
    summary: {
      pointCount: profileResults.length,
      passCount: profileResults.filter((profile) => profile.status === "pass").length,
      nominalPassCount: profileResults.filter((profile) =>
        profile.scenarioId === "nominal" && profile.status === "pass"
      ).length,
      dtHalfPassCount: profileResults.filter((profile) =>
        profile.scenarioId === "dt-half" && profile.status === "pass"
      ).length,
      longEpochPassCount: profileResults.filter((profile) =>
        profile.scenarioId === "long-epochs" && profile.status === "pass"
      ).length,
      maxAbsForwardMismatchMl: maxOrNull(profileResults.map((profile) => profile.absForwardMismatchMl)),
      maxAbsAcceptedTransferMl: maxOrNull(profileResults.map((profile) => profile.maxAbsAcceptedTransferMl)),
      maxAbsReservoirVolumeMl: maxOrNull(profileResults.map((profile) => profile.maxAbsReservoirVolumeMl)),
    },
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function runScenarioProfile(
  candidate: CandidateSpecV1,
  scenario: ScenarioSpecV1,
  profile: ProfileMapV1,
): PointSummaryV1 {
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID)
    .map((point) => withSampleRate(point, scenario.sampleRateMultiplier));
  const rightParams = buildRightHeartStrategicEnvelopeV1()
    .map(applySelectedRightScaffold)
    .map((point) => withSampleRate(point, scenario.sampleRateMultiplier));
  const run = runFourChamberSubsystemV1({
    profileId: profile.profileId,
    left: requiredPoint(leftParams, profile.leftPointId),
    right: requiredPoint(rightParams, profile.rightPointId),
    reservoir: reservoirParams(candidate, scenario),
  });
  return {
    profileId: profile.profileId,
    scenarioId: scenario.scenarioId,
    status: run.status,
    absForwardMismatchMl: run.finalState.absMismatchMl,
    maxAbsAcceptedTransferMl: run.finalState.maxAbsAcceptedTransferMl,
    maxAbsReservoirVolumeMl: run.finalState.maxAbsReservoirVolumeMl,
    finalReservoirStepMl: run.finalState.finalReservoirStepMl,
    leftStatus: run.finalState.leftStatus,
    rightStatus: run.finalState.rightStatus,
    failureReasons: run.failureReasons,
  };
}

function applySelectedRightScaffold(point: RightHeartSubsystemParamsV2): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    maxRvVolumeMl: 520,
    absoluteMaxRvVolumeMl: 640,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl * 0.25,
    rvUpperSoftLimitPressureContribution01: 0.47,
    rv: {
      ...point.rv,
      fiber: {
        ...point.rv.fiber,
        trefPa: point.fixtureId === "right-heart-contractility-low" ? 26_000 : point.rv.fiber.trefPa,
      },
    },
  };
}

function reservoirParams(
  candidate: CandidateSpecV1,
  scenario: ScenarioSpecV1,
): FourChamberSubsystemReservoirParamsV1 {
  return {
    epochs: scenario.epochs,
    transferGain01: candidate.transferGain01,
    maxTransferPerEpochMl: 3.5,
    pulmonaryVenousComplianceMlPerMmHg: 80 * candidate.complianceScale01,
    systemicVenousComplianceMlPerMmHg: 160 * candidate.complianceScale01,
    pulmonaryPressureAdjustmentBoundMmHg: 1.4,
    systemicPressureAdjustmentBoundMmHg: 1.1,
    persistentReservoirVolumeBoundMl: 28,
    repeatabilityMismatchDeltaMl: 1.2,
    repeatabilityReservoirStepMl: 4,
  };
}

function withSampleRate<T extends { readonly sampleRateHz: number }>(point: T, multiplier: number): T {
  return { ...point, sampleRateHz: point.sampleRateHz * multiplier };
}

function requiredPoint<T extends { readonly fixtureId: string }>(
  points: readonly T[],
  fixtureId: string,
): T {
  const point = points.find((candidate) => candidate.fixtureId === fixtureId);
  if (point == null) throw new Error(`Missing preload-low reservoir scan profile ${fixtureId}`);
  return point;
}

function maxOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  return finite.length === 0 ? null : round(Math.max(...finite));
}

function format(value: number): string {
  return String(Math.round(value * 100)).padStart(2, "0");
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
