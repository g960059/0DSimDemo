import {
  formatExperimentPressureSummaryV3,
  type ExperimentOutputPresentationItemV3,
} from "@/components/workbench/ExperimentPanePresentationV3";
import {
  controlLabelV3,
  outputLabelV3,
} from "@/components/workbench/WorkbenchSurfaceV3";
import type { MainWirePeriodicPvaV1 } from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import {
  MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1,
  MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1,
} from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import type { ExperimentSurfaceOutputPaneV2 } from "@/studio/contracts/v2/content";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import type {
  StudioSimulationFrameV2,
  StudioSimulationOutputValueV2,
} from "@/studio/contracts/v2/simulation";
import {
  resolveStudioItemPresentationV1,
  resolveStudioOutputPressureSummaryStoredLabelV1,
  resolveStudioSurfaceItemLabelV1,
  studioOutputPressureSummaryForOutputIdV1,
} from "@/studio/presentation/StudioItemPresentationCatalogV1";

const WORKBENCH_PERIODIC_PVA_ANALYSIS_OUTPUT_ID_SET_V1 = new Set<string>(
  MAIN_WIRE_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1,
);

export function resolveWorkbenchPaneItemLabelV3(
  input: Readonly<{
    kind: "control" | "output";
    itemId: string;
    storedLabel: string | undefined;
    locale: "en" | "ja";
  }>,
): string {
  const legacyDefaultLabel = input.kind === "output"
    ? outputLabelV3(input.itemId)
    : controlLabelV3(input.itemId);
  const presentation = resolveStudioItemPresentationV1({
    kind: input.kind,
    itemId: input.itemId,
    fallbackEnglishLabel: legacyDefaultLabel,
    locale: input.locale,
  });
  return resolveStudioSurfaceItemLabelV1({
    storedLabel: input.storedLabel,
    legacyDefaultLabel,
    presentation,
  });
}

export function workbenchPeriodicPvaOutputValueV3(
  periodicPva: MainWirePeriodicPvaV1 | undefined,
  outputId: string,
): StudioSimulationOutputValueV2 | undefined {
  const projection = periodicPva?.status === "available"
    ? periodicPva
    : periodicPva?.status === "collecting"
      ? periodicPva.preview
      : null;
  if (projection === null || projection === undefined) return undefined;
  let value: number | null;
  switch (outputId) {
    case MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1.potentialEnergyMilliJoule:
      if (projection.potentialEnergy === null) return undefined;
      value = projection.potentialEnergy.joule * 1e3;
      break;
    case MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1.pressureVolumeAreaMilliJoule:
      if (projection.pva === null) return undefined;
      value = projection.pva.joule * 1e3;
      break;
    case MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1.estimatedMvo2PerBeatPer100G:
      value = projection.estimatedMvo2?.status === "available"
        ? projection.estimatedMvo2.oxygenDemand.totalMlO2PerBeatPer100G
        : null;
      break;
    case MAIN_WIRE_PERIODIC_PVA_OUTPUT_IDS_V1.estimatedMvo2PerMinPer100G:
      value = projection.estimatedMvo2?.status === "available"
        ? projection.estimatedMvo2.oxygenDemand.totalMlO2PerMinPer100G
        : null;
      break;
    default:
      return undefined;
  }
  return Object.freeze({
    outputId,
    value,
    availability:
      value === null ? "not-evaluated-at-accepted-state" : "available",
    quality: value === null ? "not-assessed" : "accepted-derived",
  });
}

export function materializeWorkbenchOutputPresentationItemsV3(
  input: Readonly<{
    contract: ModelContractV2;
    frame: StudioSimulationFrameV2 | null;
    locale: "en" | "ja";
    notAssessedNotice: string;
    pane: ExperimentSurfaceOutputPaneV2;
    periodicPva?: MainWirePeriodicPvaV1;
    periodicPvaAnalysisError?: string;
  }>,
): readonly ExperimentOutputPresentationItemV3[] {
  const outputById = new Map(
    input.contract.outputCatalog.map((output) => [output.outputId, output]),
  );
  const sortedItems = [...input.pane.items].sort(
    (left, right) => left.order - right.order,
  );
  const selectedById = new Map(
    sortedItems.map((item) => [item.outputId, item]),
  );
  const consumedOutputIds = new Set<string>();
  const result: ExperimentOutputPresentationItemV3[] = [];

  for (const item of sortedItems) {
    if (consumedOutputIds.has(item.outputId)) continue;
    const summary = studioOutputPressureSummaryForOutputIdV1(item.outputId);
    const summaryDefinitions = summary?.memberOutputIds.flatMap((outputId) => {
      const definition = outputById.get(outputId);
      return definition === undefined ? [] : [definition];
    });
    const hasCompleteSummarySelection =
      summary?.memberOutputIds.every((outputId) => selectedById.has(outputId))
      ?? false;
    if (
      summary !== undefined &&
      summaryDefinitions?.length === summary.memberOutputIds.length &&
      hasCompleteSummarySelection
    ) {
      summary.memberOutputIds.forEach((outputId) =>
        consumedOutputIds.add(outputId),
      );
      const selectedMembers = summary.memberOutputIds.flatMap((outputId) => {
        const selectedItem = selectedById.get(outputId);
        return selectedItem === undefined ? [] : [selectedItem];
      });
      const outputValues = summary.memberOutputIds.map(
        (outputId) => input.frame?.outputs[outputId],
      );
      const maximum = scalarAvailableOutputV3(
        input.frame?.outputs[summary.maximumOutputId],
      );
      const minimum = scalarAvailableOutputV3(
        input.frame?.outputs[summary.minimumOutputId],
      );
      const mean = scalarAvailableOutputV3(
        input.frame?.outputs[summary.meanOutputId],
      );
      const quality = outputValues.some(
        (output) => output === undefined || output.quality === "not-assessed",
      )
        ? "not-assessed"
        : outputValues.some((output) => output?.quality === "accepted-derived")
          ? "accepted-derived"
          : "authoritative-state";
      const storedLabel = resolveStudioOutputPressureSummaryStoredLabelV1({
        summary,
        items: selectedMembers,
        locale: input.locale,
        fallbackEnglishLabel: outputLabelV3,
      });
      result.push({
        itemId: summary.presentationId,
        label: resolveWorkbenchPaneItemLabelV3({
          kind: "output",
          itemId: summary.presentationId,
          storedLabel,
          locale: input.locale,
        }),
        value: null,
        displayValue: formatExperimentPressureSummaryV3({
          maximum,
          minimum,
          mean,
          significantDigits: summaryDefinitions[0]!.significantDigits,
        }),
        unit: summaryDefinitions[0]!.unit,
        availability: outputValues.every(
          (output) => output?.availability === "available",
        )
          ? "available"
          : "unavailable",
        quality,
        ...(quality === "not-assessed"
          ? { qualityNotice: input.notAssessedNotice }
          : {}),
      });
      continue;
    }

    const definition = outputById.get(item.outputId);
    if (definition === undefined) continue;
    const outputValue =
      workbenchPeriodicPvaOutputValueV3(input.periodicPva, item.outputId)
      ?? input.frame?.outputs[item.outputId];
    const pvaNotice = WORKBENCH_PERIODIC_PVA_ANALYSIS_OUTPUT_ID_SET_V1.has(
      item.outputId,
    )
      ? periodicPvaOutputNoticeV3(
          input.periodicPva,
          input.periodicPvaAnalysisError,
        )
      : undefined;
    result.push({
      itemId: item.outputId,
      label: resolveWorkbenchPaneItemLabelV3({
        kind: "output",
        itemId: item.outputId,
        storedLabel: item.label,
        locale: input.locale,
      }),
      value: scalarAvailableOutputV3(outputValue),
      unit: definition.unit,
      significantDigits: definition.significantDigits,
      availability: outputValue?.availability ?? "unavailable",
      quality: outputValue?.quality ?? "not-assessed",
      ...(pvaNotice !== undefined
        ? { qualityNotice: pvaNotice }
        : outputValue?.quality === "not-assessed"
          ? { qualityNotice: input.notAssessedNotice }
          : {}),
    });
  }
  return result;
}

export function scalarAvailableOutputV3(
  output: StudioSimulationOutputValueV2 | undefined,
): number | null {
  return output?.availability === "available" &&
    output.quality !== "not-assessed" &&
    typeof output.value === "number" &&
    Number.isFinite(output.value)
    ? output.value
    : null;
}

function periodicPvaOutputNoticeV3(
  periodicPva: MainWirePeriodicPvaV1 | undefined,
  analysisError: string | undefined,
): string | undefined {
  if (analysisError !== undefined) {
    return `PVA analysis unavailable: ${analysisError}`;
  }
  if (periodicPva === undefined) return "PVA analysis is waiting to start";
  if (periodicPva.status === "available") {
    return periodicPva.edpvr.parameterBoundaryHit
      ? "EDPVR zero-pressure intercept reached its search boundary; PE/PVA extrapolation is limited"
      : undefined;
  }
  if (periodicPva.status === "collecting") {
    if (periodicPva.preview?.stage === "pva") {
      return `Provisional PVA from ${periodicPva.preview.pointCount} settled points; refining to at least ${periodicPva.progress.totalPointCount}`;
    }
    if (periodicPva.preview?.stage === "relations") {
      return `Provisional ESPVR / EDPVR from ${periodicPva.preview.pointCount} settled points`;
    }
    return `PVA analysis ${periodicPva.progress.completedPointCount} settled points; minimum ${periodicPva.progress.totalPointCount}`;
  }
  return `PVA analysis unavailable: ${periodicPva.reason}`;
}
