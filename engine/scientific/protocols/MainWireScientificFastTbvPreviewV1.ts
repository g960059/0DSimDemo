import type { MainWireScientificProtocolSourceIdentityV1 } from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import type { MainWireScientificTbvSeedInitializationDiagnosticsV1 } from "@/engine/scientific/protocols/MainWireScientificTbvContinuationSeedPredictorV1";

export const MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_V1_ID =
  "main-wire-scientific-rapid-tbv-finite-hold-preview-v1" as const;

export const MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1 = Object.freeze({
  policyId: "main-wire-fast-tbv-preview-acquisition-policy-v1" as const,
  policyVersion: "1.0.0" as const,
  lowerTargetScales: Object.freeze([0.88, 0.82, 0.76, 0.7, 0.64]),
  higherTargetScales: Object.freeze([1.075, 1.15, 1.225, 1.3]),
  naturalVerificationBeatCount: 2,
  nearPeriod1ResidualTolerance: 5e-2,
  maximumRapidFiniteHoldResidual: 3e-1,
  maximumContractingResidualRatio: 0.98,
  maximumTbvAbsoluteErrorMl: 1e-6,
  maximumContinuityAbsoluteResidualMl: 1e-5,
});

export type MainWireScientificFastTbvPreviewLaneV1 =
  "lower-volume" | "higher-volume";

export type MainWireScientificFastTbvPreviewTargetV1 = Readonly<{
  targetId: string;
  lane: MainWireScientificFastTbvPreviewLaneV1;
  targetOrdinal: number;
  targetScale: number;
  totalBloodVolumeMl: number;
}>;

export type MainWireScientificFastTbvLvEventStatusV1 =
  | "complete"
  | "missing-end-diastolic-event"
  | "missing-end-systolic-event"
  | "non-ejecting-beat";

export type MainWireScientificFastTbvTerminalObservationV1 = Readonly<{
  meanRapTransmuralMmHg: number;
  meanLapTransmuralMmHg: number;
  netCardiacOutputLMin: number;
  forwardCardiacOutputLMin: number;
  lvPressureVolume: Readonly<{
    endDiastolicVolumeMl: number;
    endDiastolicTransmuralPressureMmHg: number;
    endSystolicVolumeMl: number;
    endSystolicTransmuralPressureMmHg: number;
    strokeWorkMmHgMl: number;
  }> | null;
  quality: Readonly<{
    numerics: Readonly<{
      finite: boolean;
      totalBloodVolumeAbsoluteErrorMl: number;
      maximumContinuityAbsoluteResidualMl: number;
      passed: boolean;
    }>;
    lvEvents: Readonly<{
      status: MainWireScientificFastTbvLvEventStatusV1;
      endpointDisplayEligible: boolean;
    }>;
  }>;
}>;

export type MainWireScientificFastTbvClosureEvidenceV1 = Readonly<{
  policyId: typeof MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1.policyId;
  requiredCanonicalConsecutivePeriod1Beats: 3;
  observedCanonicalConsecutivePeriod1Beats: 0 | 1;
  predictorToFirstNaturalBeatMaximumNormalizedDelta: number;
  latestPeriod1MaximumNormalizedDelta: number;
  residualRatio: number;
  nearPeriod1ResidualTolerance: number;
  residualTrend: "contracting" | "flat" | "growing";
  predictorInjectionExcludedFromCanonicalP1Count: true;
}>;

export type MainWireScientificFastTbvAcquisitionV1 = Readonly<{
  target: MainWireScientificFastTbvPreviewTargetV1;
  sourceEvidenceId: string;
  initializer: MainWireScientificTbvSeedInitializationDiagnosticsV1 | null;
  plannedNaturalBeatCountAfterPrediction: 2 | 3 | 4 | 5;
  completedNaturalBeatCountAfterPrediction: 0 | 1 | 2 | 3 | 4 | 5;
  holdDurationSec: number;
}>;

type CommonFastEvidenceV1 = Readonly<{
  evidenceId: string;
  sourceFingerprint: string;
  acquisition: MainWireScientificFastTbvAcquisitionV1;
  observation: MainWireScientificFastTbvTerminalObservationV1;
  closure: MainWireScientificFastTbvClosureEvidenceV1;
}>;

export type MainWireScientificFastTbvPointEvidenceV1 =
  | (CommonFastEvidenceV1 &
      Readonly<{
        evidenceClass: "near-period1-estimate";
        periodicityClaim: "not-demonstrated";
        eligibility: Readonly<{
          hemodynamicPreview: true;
          rapidFiniteHoldLocus: true;
          settledP1Locus: false;
          lvPvEndpointDisplay: boolean;
          continuationSeed: false;
          espvrEdpvrPrswFit: false;
        }>;
        estimateAssessment: "residual-near-period1-but-gate-incomplete";
      }>)
  | (CommonFastEvidenceV1 &
      Readonly<{
        evidenceClass: "finite-hold-unclassified";
        periodicityClaim: "not-demonstrated";
        eligibility: Readonly<{
          hemodynamicPreview: true;
          rapidFiniteHoldLocus: boolean;
          settledP1Locus: false;
          lvPvEndpointDisplay: boolean;
          continuationSeed: false;
          espvrEdpvrPrswFit: false;
        }>;
        reason: string;
      }>)
  | Readonly<{
      evidenceId: string;
      sourceFingerprint: string;
      evidenceClass: "failure";
      periodicityClaim: "none";
      acquisition: MainWireScientificFastTbvAcquisitionV1;
      eligibility: Readonly<{
        hemodynamicPreview: false;
        rapidFiniteHoldLocus: false;
        settledP1Locus: false;
        lvPvEndpointDisplay: false;
        continuationSeed: false;
        espvrEdpvrPrswFit: false;
      }>;
      failureKind:
        "solver" | "physical-bound" | "mass-conservation" | "non-finite";
      reason: string;
    }>;

export type MainWireScientificFastTbvPreviewV1 = Readonly<{
  protocolId: typeof MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_V1_ID;
  protocolVersion: "1.0.0";
  source: MainWireScientificProtocolSourceIdentityV1;
  sourceFingerprint: string;
  claim: Readonly<{
    finiteHoldEstimatesAreSettledPoints: false;
    estimatedPointsMayEnterSettledLocus: false;
    estimatedPointsMaySeedContinuation: false;
    tbvPointsMayEnterEspvrEdpvrPrswFit: false;
    predictorJumpIsNotPresentedAsPhysiologicalTime: true;
    frozenAutonomicRenalAndVascularControls: true;
  }>;
  evidence: readonly MainWireScientificFastTbvPointEvidenceV1[];
}>;

export function createMainWireScientificFastTbvPreviewTargetsV1(
  baselineTotalBloodVolumeMl: number,
): Readonly<
  Record<
    MainWireScientificFastTbvPreviewLaneV1,
    readonly MainWireScientificFastTbvPreviewTargetV1[]
  >
> {
  if (
    !(baselineTotalBloodVolumeMl > 0) ||
    !Number.isFinite(baselineTotalBloodVolumeMl)
  ) {
    throw new Error(
      "fast TBV preview baseline volume must be positive and finite",
    );
  }
  const laneTargets = (
    lane: MainWireScientificFastTbvPreviewLaneV1,
    scales: readonly number[],
  ): readonly MainWireScientificFastTbvPreviewTargetV1[] =>
    Object.freeze(
      scales.map((targetScale, index) =>
        Object.freeze({
          targetId: `fast-tbv-preview-v1-${lane}-${String(index + 1).padStart(2, "0")}-nu-${targetScale.toFixed(3).replace(".", "p")}`,
          lane,
          targetOrdinal: index + 1,
          targetScale,
          totalBloodVolumeMl: baselineTotalBloodVolumeMl * targetScale,
        }),
      ),
    );
  return Object.freeze({
    "lower-volume": laneTargets(
      "lower-volume",
      MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1.lowerTargetScales,
    ),
    "higher-volume": laneTargets(
      "higher-volume",
      MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1.higherTargetScales,
    ),
  });
}

export function emptyMainWireScientificFastTbvPreviewV1(
  input: Readonly<{
    source: MainWireScientificProtocolSourceIdentityV1;
    sourceFingerprint: string;
  }>,
): MainWireScientificFastTbvPreviewV1 {
  return Object.freeze({
    protocolId: MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_V1_ID,
    protocolVersion: "1.0.0" as const,
    source: input.source,
    sourceFingerprint: input.sourceFingerprint,
    claim: Object.freeze({
      finiteHoldEstimatesAreSettledPoints: false as const,
      estimatedPointsMayEnterSettledLocus: false as const,
      estimatedPointsMaySeedContinuation: false as const,
      tbvPointsMayEnterEspvrEdpvrPrswFit: false as const,
      predictorJumpIsNotPresentedAsPhysiologicalTime: true as const,
      frozenAutonomicRenalAndVascularControls: true as const,
    }),
    evidence: Object.freeze([]),
  });
}
