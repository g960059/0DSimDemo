import type {
  MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  type MainWireIntegratedModelOutputIdV3,
  type MainWireIntegratedModelOutputValueV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_REGISTRY_V1_ID =
  "main-wire-integrated-model-standard68-output-registry-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_AOV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1 =
  "hemodynamics.duration.valve-forward-flow.AoV" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_CATALOG_V1 =
  Object.freeze([
    ...MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
    Object.freeze({
      outputId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_AOV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
      kind: "metric" as const,
      quantityKind: "derived" as const,
      unit: "s" as const,
      modelingStatus: "modeled" as const,
      sourceKind: "completed-beat" as const,
      sourcePath:
        "completedBeatMetrics.valveForwardPressureGradients.AoV.forwardFlowDurationSec",
      significantDigits: 4,
      scope: "beat" as const,
      dependencies: Object.freeze(["hemodynamics.flow.valve.AoV"]),
    }),
  ]);

export type MainWireIntegratedModelStandard68OutputIdV1 =
  | MainWireIntegratedModelOutputIdV3
  | typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_AOV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1;

export type MainWireIntegratedModelStandard68OutputValueV1 = Readonly<{
  outputId: MainWireIntegratedModelStandard68OutputIdV1;
  value: number | null;
  availability: "available" | "not-evaluated-at-accepted-state";
  quality: "authoritative-state" | "accepted-derived" | "not-assessed";
}>;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_IDS_V1 =
  Object.freeze(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_CATALOG_V1.map(
      ({ outputId }) => outputId,
    ),
  ) as readonly MainWireIntegratedModelStandard68OutputIdV1[];

const BASE_OUTPUT_IDS = new Set<string>(
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
);

export function partitionMainWireIntegratedModelStandard68OutputIdsV1(
  outputIds: readonly MainWireIntegratedModelStandard68OutputIdV1[],
): Readonly<{
  baseOutputIds: readonly MainWireIntegratedModelOutputIdV3[];
  includeAorticForwardFlowDuration: boolean;
}> {
  const seen = new Set<string>();
  const baseOutputIds: MainWireIntegratedModelOutputIdV3[] = [];
  let includeAorticForwardFlowDuration = false;
  for (const outputId of outputIds) {
    if (seen.has(outputId)) {
      throw new Error(`Standard68 output ${outputId} is duplicated`);
    }
    seen.add(outputId);
    if (BASE_OUTPUT_IDS.has(outputId)) {
      baseOutputIds.push(outputId as MainWireIntegratedModelOutputIdV3);
    } else if (
      outputId ===
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_AOV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1
    ) {
      includeAorticForwardFlowDuration = true;
    } else {
      throw new Error(`Standard68 output ${outputId} is unavailable`);
    }
  }
  return Object.freeze({
    baseOutputIds: Object.freeze(baseOutputIds),
    includeAorticForwardFlowDuration,
  });
}

export function mergeMainWireIntegratedModelStandard68SelectedValuesV1(
  input: Readonly<{
    outputIds: readonly MainWireIntegratedModelStandard68OutputIdV1[];
    baseValues: Readonly<
      Record<string, MainWireIntegratedModelOutputValueV3>
    >;
    completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
  }>,
): Readonly<
  Record<string, MainWireIntegratedModelStandard68OutputValueV1>
> {
  const partition = partitionMainWireIntegratedModelStandard68OutputIdsV1(
    input.outputIds,
  );
  for (const outputId of partition.baseOutputIds) {
    if (input.baseValues[outputId] === undefined) {
      throw new Error(`Standard68 base output ${outputId} is missing`);
    }
  }
  const duration = input.completedBeatMetrics
    ?.valveForwardPressureGradients.AoV.forwardFlowDurationSec ?? null;
  const forwardDurationValue = Object.freeze({
    outputId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_AOV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
    value: duration,
    availability:
      duration === null
        ? "not-evaluated-at-accepted-state" as const
        : "available" as const,
    quality:
      duration === null ? "not-assessed" as const : "accepted-derived" as const,
  });
  return Object.freeze(Object.fromEntries(input.outputIds.map((outputId) => [
    outputId,
    outputId ===
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_AOV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1
      ? forwardDurationValue
      : input.baseValues[outputId]!,
  ])));
}
