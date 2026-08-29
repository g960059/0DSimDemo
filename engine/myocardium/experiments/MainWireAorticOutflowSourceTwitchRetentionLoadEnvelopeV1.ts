import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type {
  MainWireArterialCompliancePhysiologyProfileIdV1,
} from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";
import type {
  MainWireVentricularLandTrefForceLoadProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV9";

export const MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_ENVELOPE_V1_ID =
  "main-wire-aortic-outflow-source-twitch-retention-load-envelope-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXT_IDS_V1 =
  Object.freeze([
    "baseline",
    "systemic-resistance-low",
    "systemic-resistance-high",
    "pulmonary-resistance-low",
    "pulmonary-resistance-high",
    "systemic-arterial-stiffness-low",
    "systemic-arterial-stiffness-high",
    "stressed-venous-volume-low",
    "stressed-venous-volume-high",
    "tref-force-load-low",
    "tref-force-load-high",
  ] as const);

export type MainWireAorticOutflowSourceTwitchRetentionLoadContextIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXT_IDS_V1)[number];

export type MainWireAorticOutflowSourceTwitchRetentionLoadAxisV1 =
  | "none"
  | "systemic-resistance"
  | "pulmonary-resistance"
  | "systemic-arterial-tangent-stiffness"
  | "stressed-venous-volume"
  | "ventricular-Tref-force-scale";

export type MainWireAorticOutflowSourceTwitchRetentionLoadContextV1 =
  Readonly<{
    contextId: MainWireAorticOutflowSourceTwitchRetentionLoadContextIdV1;
    changedLoadAxis:
      MainWireAorticOutflowSourceTwitchRetentionLoadAxisV1;
    level: "low" | "baseline" | "high";
    inputScaleFromBaseline: number;
    circulatoryLoadPointId:
      MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1;
    complianceProfileId:
      MainWireArterialCompliancePhysiologyProfileIdV1;
    stressedVenousVolumePointId:
      MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
    trefForceLoadProfileId:
      MainWireVentricularLandTrefForceLoadProfileIdV1;
  }>;

export const MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_ENVELOPE_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-one-factor-load-envelope-around-source-isometric-retention-candidate" as const,
    fixedCandidate: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9,
    loadAxes: Object.freeze([
      "systemic-resistance",
      "pulmonary-resistance",
      "systemic-arterial-tangent-stiffness",
      "stressed-venous-volume",
      "ventricular-Tref-force-scale",
    ] as const),
    circulatoryAndVenousLoadScales:
      Object.freeze([0.75, 1, 4 / 3] as const),
    trefForceScale: Object.freeze([0.9, 1, 1.1] as const),
    oneLoadAxisAtATime: true as const,
    candidateSelectionStage:
      "bounded-ET-completion-after-prior-load-envelope" as const,
    independentCanonicalColdStartPerRun: true as const,
    valveAreaOrOpeningLawChanged: false as const,
    calciumOrMechanicsStateAdded: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

function context(
  contextId: MainWireAorticOutflowSourceTwitchRetentionLoadContextIdV1,
  changedLoadAxis: MainWireAorticOutflowSourceTwitchRetentionLoadAxisV1,
  level: "low" | "baseline" | "high",
  inputScaleFromBaseline: number,
  circulatoryLoadPointId:
    MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1 = "baseline",
  stressedVenousVolumePointId:
    MainWireNormalAdultStressedVenousVolumeResearchPointIdV1 = "baseline",
  trefForceLoadProfileId:
    MainWireVentricularLandTrefForceLoadProfileIdV1 =
      "tref-force-load-baseline",
  complianceProfileId:
    MainWireArterialCompliancePhysiologyProfileIdV1 =
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V9.complianceProfileId,
): MainWireAorticOutflowSourceTwitchRetentionLoadContextV1 {
  return Object.freeze({
    contextId,
    changedLoadAxis,
    level,
    inputScaleFromBaseline,
    circulatoryLoadPointId,
    complianceProfileId,
    stressedVenousVolumePointId,
    trefForceLoadProfileId,
  });
}

export const MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXTS_V1 =
  Object.freeze({
    baseline: context("baseline", "none", "baseline", 1),
    "systemic-resistance-low": context(
      "systemic-resistance-low",
      "systemic-resistance",
      "low",
      0.75,
      "systemic-resistance-low",
    ),
    "systemic-resistance-high": context(
      "systemic-resistance-high",
      "systemic-resistance",
      "high",
      4 / 3,
      "systemic-resistance-high",
    ),
    "pulmonary-resistance-low": context(
      "pulmonary-resistance-low",
      "pulmonary-resistance",
      "low",
      0.75,
      "pulmonary-resistance-low",
    ),
    "pulmonary-resistance-high": context(
      "pulmonary-resistance-high",
      "pulmonary-resistance",
      "high",
      4 / 3,
      "pulmonary-resistance-high",
    ),
    "systemic-arterial-stiffness-low": context(
      "systemic-arterial-stiffness-low",
      "systemic-arterial-tangent-stiffness",
      "low",
      0.75,
      "baseline",
      "baseline",
      "tref-force-load-baseline",
      "arterial-stiffness-three-halves",
    ),
    "systemic-arterial-stiffness-high": context(
      "systemic-arterial-stiffness-high",
      "systemic-arterial-tangent-stiffness",
      "high",
      4 / 3,
      "baseline",
      "baseline",
      "tref-force-load-baseline",
      "arterial-stiffness-eight-thirds",
    ),
    "stressed-venous-volume-low": context(
      "stressed-venous-volume-low",
      "stressed-venous-volume",
      "low",
      0.75,
      "baseline",
      "stressed-venous-volume-low",
    ),
    "stressed-venous-volume-high": context(
      "stressed-venous-volume-high",
      "stressed-venous-volume",
      "high",
      4 / 3,
      "baseline",
      "stressed-venous-volume-high",
    ),
    "tref-force-load-low": context(
      "tref-force-load-low",
      "ventricular-Tref-force-scale",
      "low",
      0.9,
      "baseline",
      "baseline",
      "tref-force-load-low",
    ),
    "tref-force-load-high": context(
      "tref-force-load-high",
      "ventricular-Tref-force-scale",
      "high",
      1.1,
      "baseline",
      "baseline",
      "tref-force-load-high",
    ),
  } satisfies Readonly<Record<
    MainWireAorticOutflowSourceTwitchRetentionLoadContextIdV1,
    MainWireAorticOutflowSourceTwitchRetentionLoadContextV1
  >>);

export function resolveMainWireAorticOutflowSourceTwitchRetentionLoadContextV1(
  contextId: MainWireAorticOutflowSourceTwitchRetentionLoadContextIdV1,
): MainWireAorticOutflowSourceTwitchRetentionLoadContextV1 {
  const resolved =
    MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_LOAD_CONTEXTS_V1[
      contextId
    ];
  if (resolved === undefined) {
    throw new Error(`unsupported source-twitch load context: ${String(contextId)}`);
  }
  return resolved;
}
