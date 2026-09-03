import type {
  MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_CATALOG_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_IDS_V1,
  type MainWireIntegratedModelStandard68OutputIdV1,
  type MainWireIntegratedModelStandard68OutputValueV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68OutputRegistryV1";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_OUTPUT_REGISTRY_V1_ID =
  "main-wire-integrated-model-standard70-output-registry-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_PV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1 =
  "hemodynamics.duration.valve-forward-flow.PV" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_OUTPUT_CATALOG_V1 =
  Object.freeze([
    ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_CATALOG_V1,
    Object.freeze({
      outputId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_PV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
      kind: "metric" as const,
      quantityKind: "derived" as const,
      unit: "s" as const,
      modelingStatus: "modeled" as const,
      sourceKind: "completed-beat" as const,
      sourcePath:
        "completedBeatMetrics.valveForwardPressureGradients.PV.forwardFlowDurationSec",
      significantDigits: 4,
      scope: "beat" as const,
      dependencies: Object.freeze(["hemodynamics.flow.valve.PV"]),
    }),
  ]);

export type MainWireIntegratedModelStandard70OutputIdV1 =
  | MainWireIntegratedModelStandard68OutputIdV1
  | typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_PV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1;

export type MainWireIntegratedModelStandard70OutputValueV1 = Readonly<{
  outputId: MainWireIntegratedModelStandard70OutputIdV1;
  value: number | null;
  availability: "available" | "not-evaluated-at-accepted-state";
  quality: "authoritative-state" | "accepted-derived" | "not-assessed";
}>;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_OUTPUT_IDS_V1 =
  Object.freeze(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_OUTPUT_CATALOG_V1.map(
      ({ outputId }) => outputId,
    ),
  ) as readonly MainWireIntegratedModelStandard70OutputIdV1[];

const STANDARD68_OUTPUT_IDS = new Set<string>(
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD68_OUTPUT_IDS_V1,
);

export function partitionMainWireIntegratedModelStandard70OutputIdsV1(
  outputIds: readonly MainWireIntegratedModelStandard70OutputIdV1[],
): Readonly<{
  standard68OutputIds: readonly MainWireIntegratedModelStandard68OutputIdV1[];
  includePulmonaryForwardFlowDuration: boolean;
}> {
  const seen = new Set<string>();
  const standard68OutputIds: MainWireIntegratedModelStandard68OutputIdV1[] = [];
  let includePulmonaryForwardFlowDuration = false;
  for (const outputId of outputIds) {
    if (seen.has(outputId)) {
      throw new Error(`Standard70 output ${outputId} is duplicated`);
    }
    seen.add(outputId);
    if (STANDARD68_OUTPUT_IDS.has(outputId)) {
      standard68OutputIds.push(outputId as MainWireIntegratedModelStandard68OutputIdV1);
    } else if (
      outputId ===
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_PV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1
    ) {
      includePulmonaryForwardFlowDuration = true;
    } else {
      throw new Error(`Standard70 output ${outputId} is unavailable`);
    }
  }
  return Object.freeze({
    standard68OutputIds: Object.freeze(standard68OutputIds),
    includePulmonaryForwardFlowDuration,
  });
}

export function mergeMainWireIntegratedModelStandard70SelectedValuesV1(
  input: Readonly<{
    outputIds: readonly MainWireIntegratedModelStandard70OutputIdV1[];
    standard68Values: Readonly<
      Record<string, MainWireIntegratedModelStandard68OutputValueV1>
    >;
    completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
  }>,
): Readonly<Record<string, MainWireIntegratedModelStandard70OutputValueV1>> {
  const duration = input.completedBeatMetrics
    ?.valveForwardPressureGradients.PV.forwardFlowDurationSec ?? null;
  const pulmonaryDurationValue = Object.freeze({
    outputId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_PV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1,
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
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_PV_FORWARD_FLOW_DURATION_OUTPUT_ID_V1
      ? pulmonaryDurationValue
      : input.standard68Values[outputId]!,
  ])));
}
