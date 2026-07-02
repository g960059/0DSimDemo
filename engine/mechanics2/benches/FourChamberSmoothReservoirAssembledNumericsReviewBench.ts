import {
  runFourChamberSmoothReservoirDynamicsReviewBenchV1,
  type FourChamberSmoothReservoirDynamicsReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirDynamicsReviewBench";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const FOUR_CHAMBER_SMOOTH_RESERVOIR_ASSEMBLED_NUMERICS_REVIEW_REPORT_ID_V1 =
  "four-chamber-smooth-reservoir-assembled-numerics-review-report-v1" as const;

type ProfileParityV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly nominalEffectiveStatus: "pass" | "fail";
  readonly dtHalfEffectiveStatus: "pass" | "fail";
  readonly longEpochEffectiveStatus: "pass" | "fail";
  readonly nominalMaxAbsReservoirVolumeMl: number;
  readonly dtHalfMaxAbsReservoirVolumeMl: number;
  readonly longEpochMaxAbsReservoirVolumeMl: number;
  readonly dtHalfMaxReservoirDeltaMl: number;
  readonly longEpochMaxReservoirDeltaMl: number;
  readonly dtHalfFinalStepDeltaMl: number | null;
  readonly dtHalfReservoirParityOk: boolean;
  readonly sourceOwnedRawResidual: boolean;
};

export type FourChamberSmoothReservoirAssembledNumericsReviewReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_SMOOTH_RESERVOIR_ASSEMBLED_NUMERICS_REVIEW_REPORT_ID_V1;
  readonly gateId: "fourChamberSmoothReservoirAssembledNumericsReviewV1";
  readonly inputs: {
    readonly dynamicsReviewReportId: FourChamberSmoothReservoirDynamicsReviewReportV1["reportId"];
    readonly dtHalfReservoirParityToleranceMl: 8;
  };
  readonly profileParity: readonly ProfileParityV1[];
  readonly summary: {
    readonly dynamicsReviewPass: boolean;
    readonly effectiveEnvelopePass: boolean;
    readonly hardLimiterFree: boolean;
    readonly feedbackDissipative: boolean;
    readonly dtHalfReservoirParityPassCount: number;
    readonly dtHalfReservoirParityTotal: 7;
    readonly dtHalfReservoirParityFailedProfiles: readonly FourChamberSubsystemProfileIdV1[];
    readonly sourceOwnedRawResidualProfiles: readonly FourChamberSubsystemProfileIdV1[];
  };
  readonly decision: {
    readonly assembledNumericsStatus:
      | "assembled-source-reservoir-numerics-pass"
      | "assembled-source-reservoir-numerics-mixed";
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

const DT_HALF_RESERVOIR_PARITY_TOLERANCE_ML = 8;

const PROFILE_IDS: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

export function runFourChamberSmoothReservoirAssembledNumericsReviewBenchV1():
FourChamberSmoothReservoirAssembledNumericsReviewReportV1 {
  const dynamics = runFourChamberSmoothReservoirDynamicsReviewBenchV1();
  const profileParity = PROFILE_IDS.map((profileId) => parityForProfile(dynamics, profileId));
  const parityFailedProfiles = profileParity
    .filter((profile) => !profile.dtHalfReservoirParityOk)
    .map((profile) => profile.profileId);
  const sourceOwnedRawResidualProfiles = profileParity
    .filter((profile) => profile.sourceOwnedRawResidual)
    .map((profile) => profile.profileId);
  const dynamicsReviewPass =
    dynamics.decision.smoothReservoirDynamicsStatus === "smooth-reservoir-dynamics-review-pass";
  const effectiveEnvelopePass = profileParity.every((profile) =>
    profile.nominalEffectiveStatus === "pass"
    && profile.dtHalfEffectiveStatus === "pass"
    && profile.longEpochEffectiveStatus === "pass"
  );
  const assembledNumericsPass =
    dynamicsReviewPass
    && effectiveEnvelopePass
    && dynamics.summary.hardLimiterFree
    && dynamics.summary.feedbackDissipative
    && parityFailedProfiles.length === 0;
  return {
    reportId: FOUR_CHAMBER_SMOOTH_RESERVOIR_ASSEMBLED_NUMERICS_REVIEW_REPORT_ID_V1,
    gateId: "fourChamberSmoothReservoirAssembledNumericsReviewV1",
    inputs: {
      dynamicsReviewReportId: dynamics.reportId,
      dtHalfReservoirParityToleranceMl: DT_HALF_RESERVOIR_PARITY_TOLERANCE_ML,
    },
    profileParity,
    summary: {
      dynamicsReviewPass,
      effectiveEnvelopePass,
      hardLimiterFree: dynamics.summary.hardLimiterFree,
      feedbackDissipative: dynamics.summary.feedbackDissipative,
      dtHalfReservoirParityPassCount: profileParity.filter((profile) =>
        profile.dtHalfReservoirParityOk).length,
      dtHalfReservoirParityTotal: 7,
      dtHalfReservoirParityFailedProfiles: parityFailedProfiles,
      sourceOwnedRawResidualProfiles,
    },
    decision: {
      assembledNumericsStatus: assembledNumericsPass
        ? "assembled-source-reservoir-numerics-pass"
        : "assembled-source-reservoir-numerics-mixed",
      nextAction: assembledNumericsPass
        ? "Proceed to the next four-chamber source/reservoir contract gate before runtime, AV-plane, or LandAtrial unlock."
        : "Keep the smooth reservoir scaffold, but resolve the localized preload-low dt-half reservoir magnitude parity residual before runtime, AV-plane, or LandAtrial unlock.",
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

function parityForProfile(
  dynamics: FourChamberSmoothReservoirDynamicsReviewReportV1,
  profileId: FourChamberSubsystemProfileIdV1,
): ProfileParityV1 {
  const nominal = requirePoint(dynamics, "nominal", profileId);
  const dtHalf = requirePoint(dynamics, "dt-half", profileId);
  const longEpoch = requirePoint(dynamics, "long-epochs", profileId);
  const dtHalfMaxReservoirDeltaMl = round(
    Math.abs(nominal.maxAbsReservoirVolumeMl - dtHalf.maxAbsReservoirVolumeMl)
  );
  return {
    profileId,
    nominalEffectiveStatus: nominal.effectiveStatus,
    dtHalfEffectiveStatus: dtHalf.effectiveStatus,
    longEpochEffectiveStatus: longEpoch.effectiveStatus,
    nominalMaxAbsReservoirVolumeMl: nominal.maxAbsReservoirVolumeMl,
    dtHalfMaxAbsReservoirVolumeMl: dtHalf.maxAbsReservoirVolumeMl,
    longEpochMaxAbsReservoirVolumeMl: longEpoch.maxAbsReservoirVolumeMl,
    dtHalfMaxReservoirDeltaMl,
    longEpochMaxReservoirDeltaMl: round(
      Math.abs(nominal.maxAbsReservoirVolumeMl - longEpoch.maxAbsReservoirVolumeMl)
    ),
    dtHalfFinalStepDeltaMl: nominal.finalReservoirStepMl == null || dtHalf.finalReservoirStepMl == null
      ? null
      : round(Math.abs(nominal.finalReservoirStepMl - dtHalf.finalReservoirStepMl)),
    dtHalfReservoirParityOk: dtHalfMaxReservoirDeltaMl <= DT_HALF_RESERVOIR_PARITY_TOLERANCE_ML,
    sourceOwnedRawResidual: dtHalf.status !== "pass" && dtHalf.effectiveStatus === "pass",
  };
}

function requirePoint(
  dynamics: FourChamberSmoothReservoirDynamicsReviewReportV1,
  scenarioId: "nominal" | "dt-half" | "long-epochs",
  profileId: FourChamberSubsystemProfileIdV1,
): FourChamberSmoothReservoirDynamicsReviewReportV1["dynamicsPoints"][number] {
  const point = dynamics.dynamicsPoints.find((entry) =>
    entry.scenarioId === scenarioId && entry.profileId === profileId);
  if (point == null) throw new Error(`Missing assembled numerics point ${scenarioId}/${profileId}`);
  return point;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
