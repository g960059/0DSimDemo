import {
  defineAnalysisMethodRegistryV1,
  resolveAnalysisMethodsForSurfaceV1,
  type AnalysisDerivationRegistrationV1,
} from "@/analysis/contracts/AnalysisMethodRegistryV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  resolveMainWireStructuralAnalysisExecutionPlanV1,
} from "@/analysis/methods/mainWire/MainWireStructuralAnalysisExecutionV1";
import {
  MAIN_WIRE_PERIODIC_PVA_METHOD_V1_ID,
  buildMainWirePeriodicPvaV1,
} from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import type {
  StudioSimulationAnalysisExecutionPlanResolverV2,
} from "@/studio/contracts/v2/simulation";

export const MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1 =
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

export const MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1 =
  Object.freeze([
    MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1
      .potentialEnergyMilliJoule,
    MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1
      .pressureVolumeAreaMilliJoule,
    MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1
      .estimatedMvo2PerBeatPer100G,
    MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1
      .estimatedMvo2PerMinPer100G,
  ] as const);

export type MainWirePeriodicPvaDerivationV1 = Readonly<{
  methodId: string;
  build: typeof buildMainWirePeriodicPvaV1;
}>;

type MainWireAnalysisDerivationRuntimeV1 = Readonly<{
  kind: "periodic-pva";
  derivation: MainWirePeriodicPvaDerivationV1;
}>;

export type ResolvedMainWireAnalysisMethodsV1 = Readonly<{
  capabilities: readonly string[];
  periodicPvaDerivation: MainWirePeriodicPvaDerivationV1 | null;
  resolveExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2;
}>;

const MAIN_WIRE_PERIODIC_PVA_DERIVATION_V1 = Object.freeze({
  derivationId: MAIN_WIRE_PERIODIC_PVA_METHOD_V1_ID,
  outputs: Object.freeze([
    Object.freeze({
      outputId: MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1
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
      outputId: MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1
        .pressureVolumeAreaMilliJoule,
      kind: "metric" as const,
      unit: "mJ",
      shape: "scalar" as const,
      scope: "window" as const,
      dependencies: Object.freeze([
        "myocardium.work.stroke.LV",
        MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1
          .potentialEnergyMilliJoule,
      ]),
    }),
    Object.freeze({
      outputId: MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1
        .estimatedMvo2PerBeatPer100G,
      kind: "metric" as const,
      unit: "mL O2/beat/100g",
      shape: "scalar" as const,
      scope: "window" as const,
      dependencies: Object.freeze([
        MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1
          .pressureVolumeAreaMilliJoule,
      ]),
    }),
    Object.freeze({
      outputId: MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1
        .estimatedMvo2PerMinPer100G,
      kind: "metric" as const,
      unit: "mL O2/min/100g",
      shape: "scalar" as const,
      scope: "window" as const,
      dependencies: Object.freeze([
        MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1
          .estimatedMvo2PerBeatPer100G,
        "rhythm.heart-rate.instantaneous",
      ]),
    }),
  ]),
  requiredAnalysisIds: Object.freeze([
    MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  ]),
  runtime: Object.freeze({
    kind: "periodic-pva" as const,
    derivation: Object.freeze({
      methodId: MAIN_WIRE_PERIODIC_PVA_METHOD_V1_ID,
      build: buildMainWirePeriodicPvaV1,
    }),
  }),
}) satisfies AnalysisDerivationRegistrationV1<
  MainWireAnalysisDerivationRuntimeV1
>;

export const MAIN_WIRE_ANALYSIS_METHOD_REGISTRY_V1 =
  defineAnalysisMethodRegistryV1<MainWireAnalysisDerivationRuntimeV1>({
    analysisRequestIds: Object.freeze([
      MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
    ]),
    derivations: Object.freeze([MAIN_WIRE_PERIODIC_PVA_DERIVATION_V1]),
    legacyExactOutputBindings: Object.freeze([Object.freeze({
      exactOutputIds:
        MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1,
      runtimeDerivationIds: Object.freeze([
        MAIN_WIRE_PERIODIC_PVA_METHOD_V1_ID,
      ]),
      analysisIds: Object.freeze([
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
      ]),
    })]),
    resolveExecutionPlan:
      resolveMainWireStructuralAnalysisExecutionPlanV1,
  });

/** Main Wire composition wrapper over the model-independent registry. */
export function resolveMainWireAnalysisMethodsForSurfaceV1(
  surfaceValue: unknown,
  exactOutputs: readonly Readonly<{ outputId: string }>[] = [],
): ResolvedMainWireAnalysisMethodsV1 {
  const resolved = resolveAnalysisMethodsForSurfaceV1({
    registry: MAIN_WIRE_ANALYSIS_METHOD_REGISTRY_V1,
    surfaceValue,
    exactOutputs,
  });
  const periodicPvaRuntime = resolved.derivations.find(
    ({ derivationId }) =>
      derivationId === MAIN_WIRE_PERIODIC_PVA_METHOD_V1_ID,
  )?.runtime;
  return Object.freeze({
    capabilities: resolved.capabilities,
    periodicPvaDerivation:
      periodicPvaRuntime?.kind === "periodic-pva"
        ? periodicPvaRuntime.derivation
        : null,
    resolveExecutionPlan: resolved.resolveExecutionPlan,
  });
}
