import { defaultParams } from "@/engine/core/params";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";

export const MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE =
  "current-root-zc-no-boundary-root-inertance-v0" as const;
export const MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE =
  "sourced-boundary-root-zc-phase5af-total2x-off-by-default-v1" as const;
export const MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID =
  "phase5ae-experimental-aortic-boundary-root-inertance-v1" as const;

export type ModelCoreRuntimeRootZcMode =
  | typeof MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE
  | typeof MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE;

export type ResolveModelCoreRuntimeRootZcInput = {
  readonly mode?: ModelCoreRuntimeRootZcMode;
  readonly baseAoVInertanceMmHgSec2PerMl?: number;
};

type RootZcEvidenceReadback = {
  readonly upstreamPhase5AFArtifactId: "arterial-root-zc-calibration-phase5af-result-v1";
  readonly upstreamPhase5AGArtifactId: "arterial-root-boundary-timing-phase5ag-result-v1";
  readonly upstreamPhase5AHArtifactId: "arterial-root-boundary-attribution-phase5ah-result-v1";
  readonly sourceCalibrationStatus: "preferred-physiological-calibration-candidate";
  readonly equivalentPhase5ACCandidateId: "phase5ab-pareto-total-2x-aov-l";
  readonly equivalentEffectiveAoVInertanceMultiple: 2;
  readonly phase5AGHealthOkCandidateComparisonCount: 28;
  readonly phase5AGQDotAndTimingOutputPreservedCount: 18;
  readonly phase5AHLandHealthOkCandidateComparisonCount: 15;
  readonly phase5AHLandQDotTimingOutputPreservedCount: 6;
  readonly phase5AHLandTimingOnlyOutputPreservedCount: 9;
  readonly phase5AHLandSolveFailureCount: 0;
  readonly productionDefaultAdoptionSupported: false;
  readonly qDotClampRemovalSupported: false;
  readonly valveLoadTimingAcceptanceSupported: false;
};

const SOURCED_BOUNDARY_ROOT_ZC_EVIDENCE_READBACK = {
  upstreamPhase5AFArtifactId: "arterial-root-zc-calibration-phase5af-result-v1",
  upstreamPhase5AGArtifactId: "arterial-root-boundary-timing-phase5ag-result-v1",
  upstreamPhase5AHArtifactId: "arterial-root-boundary-attribution-phase5ah-result-v1",
  sourceCalibrationStatus: "preferred-physiological-calibration-candidate",
  equivalentPhase5ACCandidateId: "phase5ab-pareto-total-2x-aov-l",
  equivalentEffectiveAoVInertanceMultiple: 2,
  phase5AGHealthOkCandidateComparisonCount: 28,
  phase5AGQDotAndTimingOutputPreservedCount: 18,
  phase5AHLandHealthOkCandidateComparisonCount: 15,
  phase5AHLandQDotTimingOutputPreservedCount: 6,
  phase5AHLandTimingOnlyOutputPreservedCount: 9,
  phase5AHLandSolveFailureCount: 0,
  productionDefaultAdoptionSupported: false,
  qDotClampRemovalSupported: false,
  valveLoadTimingAcceptanceSupported: false,
} as const satisfies RootZcEvidenceReadback;

export type ModelCoreRuntimeRootZcResolution =
  | {
      readonly mode: typeof MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE;
      readonly claimBoundary: "current-root-zc-no-boundary-root-adoption";
      readonly adoptionStatus: "current-default-no-boundary-root-inertance";
      readonly mechanismId: null;
      readonly additionalAorticRootInertanceMmHgSec2PerMl: 0;
      readonly equivalentEffectiveAoVInertanceMultiple: 1;
      readonly evidenceReadback: null;
      readonly experimentalOptions: ModelCoreExperimentalOptions;
    }
  | {
      readonly mode: typeof MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE;
      readonly claimBoundary: "off-by-default-sourced-boundary-root-zc-candidate-no-production-adoption";
      readonly adoptionStatus: "off-by-default-acceptance-evidence-only";
      readonly mechanismId: typeof MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID;
      readonly additionalAorticRootInertanceMmHgSec2PerMl: number;
      readonly equivalentEffectiveAoVInertanceMultiple: 2;
      readonly evidenceReadback: RootZcEvidenceReadback;
      readonly experimentalOptions: ModelCoreExperimentalOptions;
    };

export function resolveModelCoreRuntimeRootZc(
  input: ResolveModelCoreRuntimeRootZcInput = {},
): ModelCoreRuntimeRootZcResolution {
  const mode = input.mode ?? MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE;
  if (mode === MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE) {
    return {
      mode,
      claimBoundary: "current-root-zc-no-boundary-root-adoption",
      adoptionStatus: "current-default-no-boundary-root-inertance",
      mechanismId: null,
      additionalAorticRootInertanceMmHgSec2PerMl: 0,
      equivalentEffectiveAoVInertanceMultiple: 1,
      evidenceReadback: null,
      experimentalOptions: {},
    };
  }

  const additional = normalizeBaseAoVInertance(input.baseAoVInertanceMmHgSec2PerMl);
  return {
    mode,
    claimBoundary: "off-by-default-sourced-boundary-root-zc-candidate-no-production-adoption",
    adoptionStatus: "off-by-default-acceptance-evidence-only",
    mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
    additionalAorticRootInertanceMmHgSec2PerMl: additional,
    equivalentEffectiveAoVInertanceMultiple: 2,
    evidenceReadback: SOURCED_BOUNDARY_ROOT_ZC_EVIDENCE_READBACK,
    experimentalOptions: {
      boundaryRootInertance: {
        mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
        additionalAorticRootInertanceMmHgSec2PerMl: additional,
      },
    },
  };
}

function normalizeBaseAoVInertance(value: number | undefined): number {
  const baseAoVL = value ?? defaultParams().AoV_L;
  if (!Number.isFinite(baseAoVL) || baseAoVL <= 0) {
    throw new Error("Runtime root/Zc sourced boundary/root candidate requires a finite positive base AoV inertance.");
  }
  return baseAoVL;
}
