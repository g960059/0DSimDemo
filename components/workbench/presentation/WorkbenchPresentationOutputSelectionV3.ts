import type { ExperimentSurfaceV2 } from "@/studio/contracts/v2/content";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";

const WORKBENCH_PRESENTATION_OUTPUT_SELECTION_CACHE_V3 = new WeakMap<
  ExperimentSurfaceV2,
  WeakMap<ModelContractV2, ReadonlySet<string>>
>();

/**
 * Selects only outputs consumed by authored graph panes. Output cards read the
 * latest validated frame directly and do not require a six-second history.
 */
export function workbenchPresentationOutputSelectionV3(
  contract: ModelContractV2,
  surface: ExperimentSurfaceV2,
): ReadonlySet<string> {
  const cached = WORKBENCH_PRESENTATION_OUTPUT_SELECTION_CACHE_V3
    .get(surface)
    ?.get(contract);
  if (cached !== undefined) return cached;

  const outputIds = new Set<string>();
  let sweepPresent = false;
  for (const pane of surface.graphPanes) {
    const graph = contract.graphCatalog.find(
      ({ graphId }) => graphId === pane.graphId,
    );
    if (graph === undefined || graph.renderer === "structural-return") continue;
    if (graph.renderer === "sweep") sweepPresent = true;
    for (const authoredSeries of pane.series) {
      const binding = graph.seriesCatalog.find(
        ({ seriesId }) => seriesId === authoredSeries.seriesId,
      );
      if (binding === undefined) continue;
      if (graph.renderer === "sweep" && binding.kind === "scalar") {
        outputIds.add(binding.outputId);
      } else if (
        graph.renderer === "pressure-volume"
        && binding.kind === "pressure-volume"
      ) {
        outputIds.add(binding.volumeOutputId);
        outputIds.add(binding.pressureOutputId);
        outputIds.add(binding.cyclePhaseOutputId);
      }
    }
  }
  if (sweepPresent) {
    const cyclePhaseOutputId = workbenchModelCyclePhaseOutputIdV3(contract);
    if (cyclePhaseOutputId !== undefined) outputIds.add(cyclePhaseOutputId);
  }

  const selection = outputIds as ReadonlySet<string>;
  const contractCache = WORKBENCH_PRESENTATION_OUTPUT_SELECTION_CACHE_V3
    .get(surface) ?? new WeakMap<ModelContractV2, ReadonlySet<string>>();
  contractCache.set(contract, selection);
  WORKBENCH_PRESENTATION_OUTPUT_SELECTION_CACHE_V3.set(
    surface,
    contractCache,
  );
  return selection;
}

/** Canonical model-emitted phase used to segment every sweeping trace. */
export function workbenchModelCyclePhaseOutputIdV3(
  contract: ModelContractV2,
): string | undefined {
  for (const graph of contract.graphCatalog) {
    if (graph.renderer !== "pressure-volume") continue;
    const cyclePhaseOutputId = graph.seriesCatalog[0]?.cyclePhaseOutputId;
    if (cyclePhaseOutputId !== undefined) return cyclePhaseOutputId;
  }
  return undefined;
}
