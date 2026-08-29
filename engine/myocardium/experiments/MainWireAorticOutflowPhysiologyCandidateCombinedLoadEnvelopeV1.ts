import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type {
  MainWireArterialCompliancePhysiologyProfileIdV1,
} from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV1";
import type {
  MainWireVentricularLandTrefForceLoadProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_V1_ID =
  "main-wire-aortic-outflow-physiology-candidate-combined-load-envelope-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_AXES_V1 =
  Object.freeze([
    "systemic-resistance",
    "systemic-arterial-tangent-stiffness",
    "stressed-venous-volume",
    "ventricular-Tref-force-scale",
  ] as const);

export type MainWireAorticOutflowPhysiologyCandidateCombinedLoadAxisV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_AXES_V1)[number];

export type MainWireAorticOutflowPhysiologyCandidateCombinedLoadLevelV1 =
  "low" | "high";

export type MainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1 =
  Readonly<{
    contextId: string;
    levels: Readonly<Record<
      MainWireAorticOutflowPhysiologyCandidateCombinedLoadAxisV1,
      MainWireAorticOutflowPhysiologyCandidateCombinedLoadLevelV1
    >>;
    codes: Readonly<Record<
      MainWireAorticOutflowPhysiologyCandidateCombinedLoadAxisV1,
      -1 | 1
    >>;
    circulatoryLoadPointId:
      MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1;
    complianceProfileId:
      MainWireArterialCompliancePhysiologyProfileIdV1;
    stressedVenousVolumePointId:
      MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
    trefForceLoadProfileId:
      MainWireVentricularLandTrefForceLoadProfileIdV1;
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_ENVELOPE_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-candidate-four-axis-full-factorial-combined-load-corner-envelope" as const,
    fixedCandidate: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V1,
    axes:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_AXES_V1,
    systemicResistanceScaleFromBaseline:
      Object.freeze({ low: 0.75, high: 4 / 3 }),
    systemicArterialTangentStiffnessScaleFromCandidate:
      Object.freeze({ low: 0.75, high: 4 / 3 }),
    stressedVenousVolumeScaleFromBaseline:
      Object.freeze({ low: 0.75, high: 4 / 3 }),
    ventricularTrefForceScaleFromCandidate:
      Object.freeze({ low: 0.9, high: 1.1 }),
    fullFactorialCornerCount: 16 as const,
    simultaneousAxisChangesPerArm: 4 as const,
    containsBaselineArm: false as const,
    pulmonaryResistanceHeldAtBaseline: true as const,
    independentCanonicalColdStartPerRun: true as const,
    valveAreaOrOpeningLawChanged: false as const,
    exactModelEquationOrStateTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

const LEVELS = Object.freeze([
  "low",
  "high",
] as const satisfies readonly
  MainWireAorticOutflowPhysiologyCandidateCombinedLoadLevelV1[]);

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1:
  readonly MainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1[] =
  Object.freeze(LEVELS.flatMap((systemicResistance) =>
    LEVELS.flatMap((systemicArterialTangentStiffness) =>
      LEVELS.flatMap((stressedVenousVolume) =>
        LEVELS.map((ventricularTrefForceScale) => context({
          "systemic-resistance": systemicResistance,
          "systemic-arterial-tangent-stiffness":
            systemicArterialTangentStiffness,
          "stressed-venous-volume": stressedVenousVolume,
          "ventricular-Tref-force-scale": ventricularTrefForceScale,
        }))))));

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXT_IDS_V1 =
  Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
      .map((candidateContext) => candidateContext.contextId),
  );

export function resolveMainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1(
  contextId: string,
): MainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
      .find((candidateContext) => candidateContext.contextId === contextId);
  if (resolved === undefined) {
    throw new Error("unsupported combined-load context: " + contextId);
  }
  return resolved;
}

function context(levels: Readonly<Record<
  MainWireAorticOutflowPhysiologyCandidateCombinedLoadAxisV1,
  MainWireAorticOutflowPhysiologyCandidateCombinedLoadLevelV1
>>): MainWireAorticOutflowPhysiologyCandidateCombinedLoadContextV1 {
  const circulatoryLoadPointId = (
    "systemic-resistance-" + levels["systemic-resistance"]
  ) as MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1;
  const complianceProfileId = levels[
    "systemic-arterial-tangent-stiffness"
  ] === "low"
    ? "arterial-stiffness-three-halves"
    : "arterial-stiffness-eight-thirds";
  const stressedVenousVolumePointId = (
    "stressed-venous-volume-" + levels["stressed-venous-volume"]
  ) as MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
  const trefForceLoadProfileId = (
    "tref-force-load-" + levels["ventricular-Tref-force-scale"]
  ) as MainWireVentricularLandTrefForceLoadProfileIdV1;
  const contextId = [
    circulatoryLoadPointId,
    complianceProfileId,
    stressedVenousVolumePointId,
    trefForceLoadProfileId,
  ].join("+");
  return Object.freeze({
    contextId,
    levels: Object.freeze({ ...levels }),
    codes: Object.freeze({
      "systemic-resistance": code(levels["systemic-resistance"]),
      "systemic-arterial-tangent-stiffness":
        code(levels["systemic-arterial-tangent-stiffness"]),
      "stressed-venous-volume": code(levels["stressed-venous-volume"]),
      "ventricular-Tref-force-scale":
        code(levels["ventricular-Tref-force-scale"]),
    }),
    circulatoryLoadPointId,
    complianceProfileId,
    stressedVenousVolumePointId,
    trefForceLoadProfileId,
  });
}

function code(
  level: MainWireAorticOutflowPhysiologyCandidateCombinedLoadLevelV1,
): -1 | 1 {
  return level === "low" ? -1 : 1;
}
