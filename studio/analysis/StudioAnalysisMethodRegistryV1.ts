import type {
  ModelSurfaceDerivedOutputDefinitionV1,
  ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  analysisCapabilityV1,
  assertModelSurfaceReleaseManifestV1,
  derivationCapabilityV1,
} from "@/studio/contracts/v2/modelSurface";
import type {
  StudioSimulationAnalysisExecutionPlanResolverV2,
} from "@/studio/contracts/v2/simulation";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID,
  buildMainWireIntegratedModelPeriodicPvaV1,
  resolveMainWireIntegratedStudioAnalysisExecutionPlanV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAnalysisExecutionV3";

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

type StudioCanonicalAnalysisOutputV1 = Readonly<{
  outputId: string;
  kind: "metric";
  unit: string;
  shape: "scalar" | "vector";
  scope: "instant" | "beat" | "window";
  dependencies: readonly string[];
}>;

export type StudioPeriodicPvaDerivationV1 = Readonly<{
  methodId: string;
  build: typeof buildMainWireIntegratedModelPeriodicPvaV1;
}>;

type StudioAnalysisDerivationMethodV1 = Readonly<{
  derivationId: string;
  outputs: readonly StudioCanonicalAnalysisOutputV1[];
  requiredAnalysisIds: readonly string[];
  periodicPvaDerivation?: StudioPeriodicPvaDerivationV1;
}>;

export type ResolvedStudioAnalysisMethodsV1 = Readonly<{
  capabilities: readonly string[];
  periodicPvaDerivation: StudioPeriodicPvaDerivationV1 | null;
  resolveExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2;
}>;

const KNOWN_ANALYSIS_REQUEST_IDS_V1 = new Set<string>([
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
]);

const MAIN_WIRE_PERIODIC_PVA_DERIVATION_V1 = Object.freeze({
  derivationId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID,
  outputs: Object.freeze([
    Object.freeze({
      outputId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
        .potentialEnergyMilliJoule,
      kind: "metric" as const,
      unit: "mJ",
      shape: "scalar" as const,
      scope: "window" as const,
      dependencies: Object.freeze([
        "hemodynamics.volume.LV",
        "hemodynamics.pressure.transmural.LV",
      ]),
    }),
    Object.freeze({
      outputId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
        .pressureVolumeAreaMilliJoule,
      kind: "metric" as const,
      unit: "mJ",
      shape: "scalar" as const,
      scope: "window" as const,
      dependencies: Object.freeze([
        "myocardium.work.stroke.LV",
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
          .potentialEnergyMilliJoule,
      ]),
    }),
    Object.freeze({
      outputId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
        .estimatedMvo2PerBeatPer100G,
      kind: "metric" as const,
      unit: "mL O2/beat/100g",
      shape: "scalar" as const,
      scope: "window" as const,
      dependencies: Object.freeze([
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
          .pressureVolumeAreaMilliJoule,
      ]),
    }),
    Object.freeze({
      outputId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
        .estimatedMvo2PerMinPer100G,
      kind: "metric" as const,
      unit: "mL O2/min/100g",
      shape: "scalar" as const,
      scope: "window" as const,
      dependencies: Object.freeze([
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_OUTPUT_IDS_V1
          .estimatedMvo2PerBeatPer100G,
        "rhythm.heart-rate.instantaneous",
      ]),
    }),
  ]),
  requiredAnalysisIds: Object.freeze([
    MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  ]),
  periodicPvaDerivation: Object.freeze({
    methodId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID,
    build: buildMainWireIntegratedModelPeriodicPvaV1,
  }),
}) satisfies StudioAnalysisDerivationMethodV1;

const DERIVATION_METHODS_BY_ID_V1 = new Map<string,
StudioAnalysisDerivationMethodV1>([
  [
    MAIN_WIRE_PERIODIC_PVA_DERIVATION_V1.derivationId,
    MAIN_WIRE_PERIODIC_PVA_DERIVATION_V1,
  ],
]);

/**
 * Resolves internal analysis implementations selected by one immutable
 * Surface. The returned capabilities materialize only known methods; an old
 * client that cannot execute a newer method therefore loses that analysis,
 * not the exact model or the rest of the Workbench.
 *
 * Analysis methods are code responsibilities, not a third release identity.
 * Their immutable method IDs are pinned by Surface entries.
 */
export function resolveStudioAnalysisMethodsForSurfaceV1(
  surfaceValue: unknown,
  exactOutputs: readonly Readonly<{ outputId: string }>[] = [],
): ResolvedStudioAnalysisMethodsV1 {
  assertModelSurfaceReleaseManifestV1(surfaceValue);
  const surface: ModelSurfaceReleaseManifestV1 = surfaceValue;
  const selectedAnalysisIds = new Set<string>();
  const capabilities = new Set<string>();
  const requiredDerivationIds = new Set<string>();

  for (const item of [
    ...surface.controlCatalog,
    ...surface.derivedOutputCatalog,
    ...surface.graphCatalog,
    ...surface.knobCatalog,
    ...surface.protocolCatalog,
  ]) {
    for (const capability of item.requiredCapabilities) {
      if (!capability.startsWith("analysis/")) continue;
      const analysisId = capability.slice("analysis/".length);
      if (KNOWN_ANALYSIS_REQUEST_IDS_V1.has(analysisId)) {
        selectedAnalysisIds.add(analysisId);
        capabilities.add(analysisCapabilityV1(analysisId));
      }
    }
    for (const capability of item.requiredCapabilities) {
      if (capability.startsWith("derivation/")) {
        requiredDerivationIds.add(capability.slice("derivation/".length));
      }
    }
  }

  const outputDerivationIds = new Set<string>();
  for (const output of surface.derivedOutputCatalog) {
    outputDerivationIds.add(output.derivationId);
  }
  let periodicPvaDerivation: StudioPeriodicPvaDerivationV1 | null = null;
  for (const derivationId of new Set([
    ...requiredDerivationIds,
    ...outputDerivationIds,
  ])) {
    const method = DERIVATION_METHODS_BY_ID_V1.get(derivationId);
    if (method === undefined) continue;
    const declaredOutputs = surface.derivedOutputCatalog.filter(
      (output) => output.derivationId === derivationId,
    );
    if (!declaredOutputs.every((output) =>
      methodOwnsOutputSemanticsV1(method, output))) continue;
    capabilities.add(derivationCapabilityV1(derivationId));
    if (method.periodicPvaDerivation !== undefined) {
      periodicPvaDerivation = method.periodicPvaDerivation;
    }
    for (const analysisId of method.requiredAnalysisIds) {
      if (!KNOWN_ANALYSIS_REQUEST_IDS_V1.has(analysisId)) continue;
      selectedAnalysisIds.add(analysisId);
      capabilities.add(analysisCapabilityV1(analysisId));
    }
  }

  // Standard 64 and earlier exposed these IDs from the exact catalog before
  // Surface-owned derivations existed. Preserve those immutable releases
  // without reviving analysisProfileId as a third release selector.
  const exactOutputIds = new Set(exactOutputs.map(({ outputId }) => outputId));
  if (
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1.every(
      (outputId) => exactOutputIds.has(outputId),
    )
  ) {
    periodicPvaDerivation =
      MAIN_WIRE_PERIODIC_PVA_DERIVATION_V1.periodicPvaDerivation ?? null;
    selectedAnalysisIds.add(
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
    );
    capabilities.add(analysisCapabilityV1(
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
    ));
  }

  const resolveExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2 =
    (analysisId) => selectedAnalysisIds.has(analysisId)
      ? resolveMainWireIntegratedStudioAnalysisExecutionPlanV3(analysisId)
      : null;
  return Object.freeze({
    capabilities: Object.freeze([...capabilities].sort()),
    periodicPvaDerivation,
    resolveExecutionPlan,
  });
}

function methodOwnsOutputSemanticsV1(
  method: StudioAnalysisDerivationMethodV1,
  output: ModelSurfaceDerivedOutputDefinitionV1,
): boolean {
  const canonical = method.outputs.find(
    ({ outputId }) => outputId === output.outputId,
  );
  return canonical !== undefined
    && output.kind === canonical.kind
    && output.unit === canonical.unit
    && output.shape === canonical.shape
    && output.scope === canonical.scope
    && sameStringsV1(output.dependencies, canonical.dependencies);
}

function sameStringsV1(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}
