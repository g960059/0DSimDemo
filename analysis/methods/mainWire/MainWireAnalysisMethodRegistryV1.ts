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
  MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID,
  buildMainWirePeriodicPvaMethodV8,
} from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import {
  MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
  MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1,
  MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1,
  buildMainWireCardiacCycleMetricsV1,
} from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";
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
  build: typeof buildMainWirePeriodicPvaMethodV8;
}>;

export type MainWireCardiacCycleDerivationV1 = Readonly<{
  methodId: typeof MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID;
  requiredExactOutputIds:
    typeof MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1;
  build: typeof buildMainWireCardiacCycleMetricsV1;
}>;

type MainWireAnalysisDerivationRuntimeV1 =
  | Readonly<{
      kind: "periodic-pva";
      derivation: MainWirePeriodicPvaDerivationV1;
    }>
  | Readonly<{
      kind: "cardiac-cycle";
      derivation: MainWireCardiacCycleDerivationV1;
    }>;

export type ResolvedMainWireAnalysisMethodsV1 = Readonly<{
  capabilities: readonly string[];
  periodicPvaDerivation: MainWirePeriodicPvaDerivationV1 | null;
  cardiacCycleDerivation: MainWireCardiacCycleDerivationV1 | null;
  resolveExecutionPlan: StudioSimulationAnalysisExecutionPlanResolverV2;
}>;

const cardiacCycleOutputV1 = (
  outputId: string,
  unit: string,
  dependencies: readonly string[],
) => Object.freeze({
  outputId,
  kind: "metric" as const,
  unit,
  shape: "scalar" as const,
  scope: "beat" as const,
  dependencies: Object.freeze([...dependencies]),
});

const CYCLE_PHASE_DEPENDENCY_V1 = "rhythm.phase.regular-sinus";
const AORTIC_FLOW_DEPENDENCY_V1 = "hemodynamics.flow.valve.AoV";
const MITRAL_FLOW_DEPENDENCY_V1 = "hemodynamics.flow.valve.MV";
const LV_PRESSURE_DEPENDENCY_V1 = "hemodynamics.pressure.absolute.LV";
const RV_PRESSURE_DEPENDENCY_V1 = "hemodynamics.pressure.absolute.RV";
const LOCAL_GRADIENT_DEPENDENCY_V1 =
  "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV";
const VENA_CONTRACTA_GRADIENT_DEPENDENCY_V1 =
  "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV";

const MAIN_WIRE_CARDIAC_CYCLE_DERIVATION_V1 = Object.freeze({
  derivationId: MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
  outputs: Object.freeze([
    cardiacCycleOutputV1(
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1.aorticMeanLocalGradientMmHg,
      "mmHg",
      [
        CYCLE_PHASE_DEPENDENCY_V1,
        AORTIC_FLOW_DEPENDENCY_V1,
        LOCAL_GRADIENT_DEPENDENCY_V1,
      ],
    ),
    cardiacCycleOutputV1(
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .aorticMeanVenaContractaGradientMmHg,
      "mmHg",
      [
        CYCLE_PHASE_DEPENDENCY_V1,
        AORTIC_FLOW_DEPENDENCY_V1,
        VENA_CONTRACTA_GRADIENT_DEPENDENCY_V1,
      ],
    ),
    ...([
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1.leftVentricularEjectionTimeMs,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .leftVentricularEjectionTimeThresholdMs,
    ] as const).map((outputId) => cardiacCycleOutputV1(
      outputId,
      "ms",
      [CYCLE_PHASE_DEPENDENCY_V1, AORTIC_FLOW_DEPENDENCY_V1],
    )),
    ...([
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .leftVentricularIsovolumicContractionTimeMs,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .leftVentricularIsovolumicRelaxationTimeMs,
    ] as const).map((outputId) => cardiacCycleOutputV1(
      outputId,
      "ms",
      [
        CYCLE_PHASE_DEPENDENCY_V1,
        AORTIC_FLOW_DEPENDENCY_V1,
        MITRAL_FLOW_DEPENDENCY_V1,
      ],
    )),
    cardiacCycleOutputV1(
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .leftVentricularMyocardialPerformanceIndex,
      "1",
      [
        CYCLE_PHASE_DEPENDENCY_V1,
        AORTIC_FLOW_DEPENDENCY_V1,
        MITRAL_FLOW_DEPENDENCY_V1,
      ],
    ),
    cardiacCycleOutputV1(
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1.aorticForwardFlowShapeFactor,
      "1",
      [CYCLE_PHASE_DEPENDENCY_V1, AORTIC_FLOW_DEPENDENCY_V1],
    ),
    ...([
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .leftVentricularMaximumPressureRate5Ms,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .leftVentricularMinimumPressureRate5Ms,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .leftVentricularMaximumPressureRate10Ms,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .leftVentricularMinimumPressureRate10Ms,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .leftVentricularMaximumPressureRate20Ms,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .leftVentricularMinimumPressureRate20Ms,
    ] as const).map((outputId) => cardiacCycleOutputV1(
      outputId,
      "mmHg/s",
      [CYCLE_PHASE_DEPENDENCY_V1, LV_PRESSURE_DEPENDENCY_V1],
    )),
    ...([
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .rightVentricularMaximumPressureRate5Ms,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .rightVentricularMinimumPressureRate5Ms,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .rightVentricularMaximumPressureRate10Ms,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .rightVentricularMinimumPressureRate10Ms,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .rightVentricularMaximumPressureRate20Ms,
      MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1
        .rightVentricularMinimumPressureRate20Ms,
    ] as const).map((outputId) => cardiacCycleOutputV1(
      outputId,
      "mmHg/s",
      [CYCLE_PHASE_DEPENDENCY_V1, RV_PRESSURE_DEPENDENCY_V1],
    )),
  ]),
  requiredAnalysisIds: Object.freeze([]),
  runtime: Object.freeze({
    kind: "cardiac-cycle" as const,
    derivation: Object.freeze({
      methodId: MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
      requiredExactOutputIds:
        MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1,
      build: buildMainWireCardiacCycleMetricsV1,
    }),
  }),
}) satisfies AnalysisDerivationRegistrationV1<
  MainWireAnalysisDerivationRuntimeV1
>;

const MAIN_WIRE_PERIODIC_PVA_DERIVATION_V1 = Object.freeze({
  derivationId: MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID,
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
      methodId: MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID,
      build: buildMainWirePeriodicPvaMethodV8,
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
    derivations: Object.freeze([
      MAIN_WIRE_PERIODIC_PVA_DERIVATION_V1,
      MAIN_WIRE_CARDIAC_CYCLE_DERIVATION_V1,
    ]),
    resolveExecutionPlan:
      resolveMainWireStructuralAnalysisExecutionPlanV1,
  });

/** Main Wire composition wrapper over the model-independent registry. */
export function resolveMainWireAnalysisMethodsForSurfaceV1(
  surfaceValue: unknown,
): ResolvedMainWireAnalysisMethodsV1 {
  const resolved = resolveAnalysisMethodsForSurfaceV1({
    registry: MAIN_WIRE_ANALYSIS_METHOD_REGISTRY_V1,
    surfaceValue,
  });
  const periodicPvaRuntime = resolved.derivations.find(
    ({ derivationId }) =>
      derivationId === MAIN_WIRE_PERIODIC_PVA_METHOD_V8_ID,
  )?.runtime;
  const cardiacCycleRuntime = resolved.derivations.find(
    ({ derivationId }) =>
      derivationId === MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
  )?.runtime;
  return Object.freeze({
    capabilities: resolved.capabilities,
    periodicPvaDerivation:
      periodicPvaRuntime?.kind === "periodic-pva"
        ? periodicPvaRuntime.derivation
        : null,
    cardiacCycleDerivation:
      cardiacCycleRuntime?.kind === "cardiac-cycle"
        ? cardiacCycleRuntime.derivation
        : null,
    resolveExecutionPlan: resolved.resolveExecutionPlan,
  });
}
