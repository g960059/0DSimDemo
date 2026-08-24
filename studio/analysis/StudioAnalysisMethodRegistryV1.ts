import type {
  MetricOutputDefinitionV2,
  OutputDefinitionV2,
} from "@/studio/contracts/v2/model";
import type {
  StudioSimulationAnalysisExecutionPlanResolverV2,
} from "@/studio/contracts/v2/simulation";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  resolveMainWireIntegratedStudioAnalysisExecutionPlanV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAnalysisExecutionV3";

export const STUDIO_NO_MODEL_ANALYSIS_PROFILE_V1_ID =
  "standard-no-model-analysis-v1" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_ANALYSIS_PROFILE_V1_ID =
  "main-wire-integrated-standard-v1" as const;
export const MAIN_WIRE_INTEGRATED_STUDIO_ANALYSIS_PROFILE_V2_ID =
  "main-wire-integrated-standard-v2" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1 =
  Object.freeze({
    potentialEnergyMilliJoule:
      "myocardium.energy.potential.LV-pressure-volume-area" as const,
    pressureVolumeAreaMilliJoule:
      "myocardium.energy.pressure-volume-area.LV" as const,
    estimatedMvo2PerBeatPer100G:
      "oxygen.consumption.estimated-myocardial.LV-per-beat-per-100g" as const,
    estimatedMvo2PerMinPer100G:
      "oxygen.consumption.estimated-myocardial.LV-per-min-per-100g" as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1 =
  Object.freeze([
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
      .potentialEnergyMilliJoule,
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
      .pressureVolumeAreaMilliJoule,
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
      .estimatedMvo2PerBeatPer100G,
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
      .estimatedMvo2PerMinPer100G,
  ] as const);

export type StudioAnalysisMethodDefinitionV1 = Readonly<{
  analysisMethodId: string;
  outputCatalog: readonly MetricOutputDefinitionV2[];
}>;

export type StudioAnalysisProfileDefinitionV1 = Readonly<{
  analysisProfileId: string;
  methodCatalog: readonly StudioAnalysisMethodDefinitionV1[];
  resolveExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2;
}>;

const NO_ANALYSIS_EXECUTION_PLAN_V1:
  StudioSimulationAnalysisExecutionPlanResolverV2 = () => null;

const MAIN_WIRE_PERIODIC_PVA_OUTPUT_CATALOG_V1 = Object.freeze([
  Object.freeze({
    outputId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
        .potentialEnergyMilliJoule,
    kind: "metric" as const,
    unit: "mJ",
    significantDigits: 3,
    shape: "scalar" as const,
    scope: "window" as const,
    dependencies: Object.freeze([
      "hemodynamics.volume.LV",
      "hemodynamics.pressure.transmural.LV",
    ]),
  }),
  Object.freeze({
    outputId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
        .pressureVolumeAreaMilliJoule,
    kind: "metric" as const,
    unit: "mJ",
    significantDigits: 3,
    shape: "scalar" as const,
    scope: "window" as const,
    dependencies: Object.freeze([
      "myocardium.work.stroke.LV",
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
        .potentialEnergyMilliJoule,
    ]),
  }),
  Object.freeze({
    outputId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
        .estimatedMvo2PerBeatPer100G,
    kind: "metric" as const,
    unit: "mL O2/beat/100g",
    significantDigits: 3,
    shape: "scalar" as const,
    scope: "window" as const,
    dependencies: Object.freeze([
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
        .pressureVolumeAreaMilliJoule,
    ]),
  }),
  Object.freeze({
    outputId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
        .estimatedMvo2PerMinPer100G,
    kind: "metric" as const,
    unit: "mL O2/min/100g",
    significantDigits: 3,
    shape: "scalar" as const,
    scope: "window" as const,
    dependencies: Object.freeze([
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
        .estimatedMvo2PerBeatPer100G,
      "rhythm.heart-rate.instantaneous",
    ]),
  }),
] satisfies readonly MetricOutputDefinitionV2[]);

const MAIN_WIRE_STRUCTURAL_METHOD_V1 = Object.freeze({
  analysisMethodId:
    MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  outputCatalog: Object.freeze([]),
});

const MAIN_WIRE_FORMAL_PV_METHOD_WITHOUT_OUTPUTS_V1 = Object.freeze({
  analysisMethodId:
    MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  outputCatalog: Object.freeze([]),
});

const MAIN_WIRE_FORMAL_PV_METHOD_V2 = Object.freeze({
  analysisMethodId:
    MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  outputCatalog: MAIN_WIRE_PERIODIC_PVA_OUTPUT_CATALOG_V1,
});

const STUDIO_ANALYSIS_PROFILES_V1 = Object.freeze([
  Object.freeze({
    analysisProfileId: STUDIO_NO_MODEL_ANALYSIS_PROFILE_V1_ID,
    methodCatalog: Object.freeze([]),
    resolveExecutionPlan: NO_ANALYSIS_EXECUTION_PLAN_V1,
  }),
  Object.freeze({
    analysisProfileId: MAIN_WIRE_INTEGRATED_STUDIO_ANALYSIS_PROFILE_V1_ID,
    methodCatalog: Object.freeze([
      MAIN_WIRE_STRUCTURAL_METHOD_V1,
      MAIN_WIRE_FORMAL_PV_METHOD_WITHOUT_OUTPUTS_V1,
    ]),
    resolveExecutionPlan:
      resolveMainWireIntegratedStudioAnalysisExecutionPlanV3,
  }),
  Object.freeze({
    analysisProfileId: MAIN_WIRE_INTEGRATED_STUDIO_ANALYSIS_PROFILE_V2_ID,
    methodCatalog: Object.freeze([
      MAIN_WIRE_STRUCTURAL_METHOD_V1,
      MAIN_WIRE_FORMAL_PV_METHOD_V2,
    ]),
    resolveExecutionPlan:
      resolveMainWireIntegratedStudioAnalysisExecutionPlanV3,
  }),
] satisfies readonly StudioAnalysisProfileDefinitionV1[]);

export function resolveStudioAnalysisProfileV1(
  analysisProfileId: string,
): StudioAnalysisProfileDefinitionV1 {
  const profile = STUDIO_ANALYSIS_PROFILES_V1.find(
    (candidate) => candidate.analysisProfileId === analysisProfileId,
  );
  if (profile === undefined) {
    throw new Error(`Unsupported Studio analysis profile ${analysisProfileId}`);
  }
  return profile;
}

export function studioAnalysisOutputCatalogForProfileV1(
  analysisProfileId: string,
): readonly MetricOutputDefinitionV2[] {
  const catalog = Object.freeze(
    resolveStudioAnalysisProfileV1(analysisProfileId).methodCatalog.flatMap(
      ({ outputCatalog }) => outputCatalog,
    ),
  );
  const outputIds = new Set<string>();
  for (const { outputId } of catalog) {
    if (outputIds.has(outputId)) {
      throw new Error(
        `Studio analysis profile ${analysisProfileId} repeats output ${outputId}`,
      );
    }
    outputIds.add(outputId);
  }
  return catalog;
}

export function admitStudioAnalysisOutputCatalogForModelV1(
  analysisProfileId: string,
  exactOutputCatalog: readonly OutputDefinitionV2[],
): readonly MetricOutputDefinitionV2[] {
  const catalog = studioAnalysisOutputCatalogForProfileV1(analysisProfileId);
  const exactOutputIds = new Set(
    exactOutputCatalog.map(({ outputId }) => outputId),
  );
  for (const { outputId } of catalog) {
    if (exactOutputIds.has(outputId)) {
      throw new Error(
        `Studio analysis output ${outputId} collides with the exact model catalog`,
      );
    }
  }
  return catalog;
}
