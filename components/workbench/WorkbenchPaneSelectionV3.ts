import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import { STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1, resolveStudioItemPresentationV1, studioOutputReadingV1, type ResolvedStudioItemPresentationV1 } from "@/studio/presentation/StudioItemPresentationCatalogV1";
import { controlLabelV3, graphSeriesLabelV3, outputLabelV3 } from "./WorkbenchSurfaceV3";
import { outputPaneItemManagerEntriesV3, resolveGraphSeriesPresentationV3, resolvePaneItemManagerPresentationV3 } from "./WorkbenchPaneEditorV3";
import type { WorkbenchSurfacePaneV3 } from "./WorkbenchSurfacePaneOperationsV3";
import { resolveExperimentOutputDisplayUnitV3 } from "./ExperimentPanePresentationV3";
import { STUDIO_OUTPUT_MEASUREMENT_FAMILIES_V1, studioOutputMeasurementFamilyV1, studioOutputComparisonMethodLabelsV1 } from "@/studio/presentation/StudioOutputMeasurementMethodsV1";
import { resolveWorkbenchOutputPresentationV3 } from "./WorkbenchItemPresentation";

export type WorkbenchPaneSelectionEntryV3 = Readonly<{
  id: string;
  label: string;
  selected: boolean;
  presentation: ResolvedStudioItemPresentationV1;
  detail?: string;
  reading?: "waveform" | "current";
  unit?: string;
  order?: number;
}>;

export function rememberWorkbenchPaneItemsV3(previous: WorkbenchSurfacePaneV3, current: WorkbenchSurfacePaneV3): WorkbenchSurfacePaneV3 {
  const merge = <T,>(old: readonly T[], next: readonly T[], key: (item: T) => string) => [...new Map([...old, ...next].map(item => [key(item), item])).values()];
  if (previous.role === "graph" && current.role === "graph") {
    const selected = new Set(current.series.map(item => item.seriesId));
    return { ...current, series: merge(previous.series, current.series, item => item.seriesId),
      traceColors: merge(previous.traceColors ?? [], current.traceColors ?? [], item => JSON.stringify([item.scenarioId, item.seriesId])),
      excludedTraces: merge(previous.excludedTraces.filter(trace => trace.seriesId !== null && !selected.has(trace.seriesId)), current.excludedTraces, item => JSON.stringify([item.scenarioId, item.seriesId])) };
  }
  if (previous.role === "control" && current.role === "control") return { ...current, items: merge(previous.items, current.items, item => item.controlId) };
  if (previous.role === "output" && current.role === "output") return { ...current, items: merge(previous.items, current.items, item => item.outputId) };
  return current;
}

/** Remember the last active choices separately from labels of removed items. */
export function rememberWorkbenchOutputMethodsV3(previous: ReadonlyMap<string, readonly string[]>, pane: WorkbenchSurfacePaneV3): ReadonlyMap<string, readonly string[]> {
  if (pane.role !== "output") return previous;
  const next = new Map(previous);
  for (const family of STUDIO_OUTPUT_MEASUREMENT_FAMILIES_V1) {
    const selected = pane.items.filter(item => family.methods.some(method => method.outputId === item.outputId)).sort((a, b) => a.order - b.order);
    if (selected.length > 0) next.set(family.id, selected.map(item => item.outputId));
  }
  return next;
}

export function workbenchPaneSelectionEntriesV3(pane: WorkbenchSurfacePaneV3, contract: ModelContractV2, locale: "en" | "ja"): readonly WorkbenchPaneSelectionEntryV3[] {
  if (pane.role === "output") {
    const methodLabels = studioOutputComparisonMethodLabelsV1(pane.items.map(item => item.outputId), locale);
    return outputPaneItemManagerEntriesV3({ pane, contract, locale }).map(entry => {
      const methodLabel = methodLabels.get(entry.id);
      const summary = STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1.find(summary => summary.presentationId === entry.id);
      const definition = contract.outputCatalog.find(output => output.outputId === (summary?.memberOutputIds[0] ?? entry.id));
      const reading = studioOutputReadingV1(entry.id);
      return { ...entry, label: entry.label ?? entry.defaultLabel, unit: definition ? resolveExperimentOutputDisplayUnitV3(definition.outputId, definition.unit) : undefined,
        reading,
        ...(methodLabel ? { detail: methodLabel } : summary ? { detail: locale === "ja" ? "最高 / 最低" : "Max / min" } : reading ? { detail: locale === "ja" ? "現在値" : "Current value" } : {}) };
    });
  }
  if (pane.role === "control") return contract.controlCatalog.map(control => {
    const selected = pane.items.find(item => item.controlId === control.controlId);
    const entry = resolvePaneItemManagerPresentationV3({ kind: "control", id: control.controlId, storedLabel: selected?.label, locale, catalogFacts: { controlChangeSemantics: control.changeSemantics } });
    return { ...entry, label: entry.label ?? entry.defaultLabel, selected: selected !== undefined, unit: control.unit === "1" ? undefined : control.unit, order: selected?.order };
  });
  const graph = contract.graphCatalog.find(graph => graph.graphId === pane.graphId);
  if (!graph || !("seriesCatalog" in graph)) return [];
  return graph.seriesCatalog.map(series => {
    const selected = pane.series.find(item => item.seriesId === series.seriesId);
    const presentation = resolveGraphSeriesPresentationV3({ contract, graph, locale, seriesId: series.seriesId, storedLabel: selected?.label })!;
    return { id: series.seriesId, label: presentation.label, selected: selected !== undefined, presentation, order: selected?.order };
  });
}

/** Collapse calculation variants only in the add catalog, not in selected rows. */
export function workbenchPaneCatalogEntriesV3(entries: readonly WorkbenchPaneSelectionEntryV3[]): readonly WorkbenchPaneSelectionEntryV3[] {
  const seen = new Set<string>();
  return entries.flatMap(entry => {
    if (entry.presentation.kind !== "output") return [entry];
    const family = studioOutputMeasurementFamilyV1(entry.id);
    if (!family) return [entry];
    if (!family.methods.every(method => entries.some(candidate => candidate.id === method.outputId))) return [entry];
    if (seen.has(family.id)) return [];
    seen.add(family.id);
    const variants = family.methods.flatMap(method => entries.filter(candidate => candidate.id === method.outputId));
    const primary = variants[0]!;
    const selected = variants.find(variant => variant.selected) ?? primary;
    return [{ ...primary, id: family.id, label: primary.presentation.label, selected: variants.some(variant => variant.selected), detail: undefined,
      presentation: { ...selected.presentation, label: primary.presentation.label,
        searchTerms: variants.flatMap(variant => [...variant.presentation.searchTerms, variant.label]) } }];
  });
}

/** Replace only the numerical identity requested by the user; retain its slot and authored label. */
export function changeWorkbenchOutputMethodV3(pane: WorkbenchSurfacePaneV3, outputId: string, nextOutputId: string): WorkbenchSurfacePaneV3 {
  const family = studioOutputMeasurementFamilyV1(outputId);
  if (pane.role !== "output" || !family?.methods.some(method => method.outputId === nextOutputId)
    || pane.items.some(item => item.outputId === nextOutputId)) return pane;
  return { ...pane, items: pane.items.map(item => {
    if (item.outputId !== outputId) return item;
    const presentation = resolveWorkbenchOutputPresentationV3({ outputId, storedLabel: item.label, locale: "en" });
    const japanese = resolveWorkbenchOutputPresentationV3({ outputId, storedLabel: undefined, locale: "ja" });
    const generated = presentation.label === presentation.canonicalEnglishLabel || item.label === japanese.label;
    return { ...item, outputId: nextOutputId, label: generated ? outputLabelV3(nextOutputId) : item.label };
  }) };
}

/** Selection is a draft. Retain presentation metadata when an item is unchecked and rechecked. */
export function toggleWorkbenchPaneSelectionV3(pane: WorkbenchSurfacePaneV3, id: string, previous: WorkbenchSurfacePaneV3, rememberedMethodIds?: readonly string[]): WorkbenchSurfacePaneV3 {
  const nextOrder = (items: readonly { order: number }[]) => items.reduce((n, item) => Math.max(n, item.order + 1), 0);
  if (pane.role === "graph") {
    const found = pane.series.some(item => item.seriesId === id);
    const original = previous.role === "graph" ? previous.series.find(item => item.seriesId === id) : undefined;
    return { ...pane,
      ...(!found && previous.role === "graph" ? {
        traceColors: [...(pane.traceColors ?? []).filter(trace => trace.seriesId !== id), ...(previous.traceColors ?? []).filter(trace => trace.seriesId === id)],
        excludedTraces: [...pane.excludedTraces.filter(trace => trace.seriesId !== id), ...previous.excludedTraces.filter(trace => trace.seriesId === id)],
      } : {}),
      series: found ? pane.series.filter(item => item.seriesId !== id) : [...pane.series, { ...original, seriesId: id, label: original?.label ?? graphSeriesLabelV3(id), order: nextOrder(pane.series) }] };
  }
  if (pane.role === "control") {
    const found = pane.items.some(item => item.controlId === id);
    const original = previous.role === "control" ? previous.items.find(item => item.controlId === id) : undefined;
    return { ...pane, items: found ? pane.items.filter(item => item.controlId !== id) : [...pane.items, { ...original, controlId: id, label: original?.label ?? controlLabelV3(id), order: nextOrder(pane.items), presentation: original?.presentation ?? { kind: "slider" } }] };
  }
  const family = STUDIO_OUTPUT_MEASUREMENT_FAMILIES_V1.find(family => family.id === id);
  if (family) {
    const ids = family.methods.map(method => method.outputId);
    if (pane.items.some(item => ids.includes(item.outputId))) return { ...pane, items: pane.items.filter(item => !ids.includes(item.outputId)) };
    const remembered = previous.role === "output" ? previous.items.filter(item => (rememberedMethodIds ?? ids).includes(item.outputId) && ids.includes(item.outputId)).sort((a, b) => a.order - b.order) : [];
    const additions = remembered.length > 0 ? remembered : [{ outputId: ids[0]!, label: outputLabelV3(ids[0]!), order: 0 }];
    const order = nextOrder(pane.items);
    return { ...pane, items: [...pane.items, ...additions.map((item, index) => ({ ...item, order: order + index }))] };
  }
  const summary = STUDIO_OUTPUT_PRESSURE_SUMMARIES_V1.find(summary => summary.presentationId === id);
  const ids: readonly string[] = summary?.memberOutputIds ?? [id];
  if (ids.every(id => pane.items.some(item => item.outputId === id))) return { ...pane, items: pane.items.filter(item => !ids.includes(item.outputId)) };
  const label = summary ? resolveStudioItemPresentationV1({ kind: "output", itemId: summary.presentationId, fallbackEnglishLabel: summary.presentationId, locale: "en" }).canonicalEnglishLabel : undefined;
  const order = nextOrder(pane.items);
  return { ...pane, items: [...pane.items, ...ids.filter(id => !pane.items.some(item => item.outputId === id)).map((outputId, index) => {
    const original = previous.role === "output" ? previous.items.find(item => item.outputId === outputId) : undefined;
    return { ...original, outputId, label: original?.label ?? label ?? outputLabelV3(outputId), order: order + index };
  })] };
}

export function canCommitWorkbenchPaneV3(pane: WorkbenchSurfacePaneV3, contract: ModelContractV2, creating: boolean): boolean {
  if (pane.role !== "graph") return !creating || pane.items.length > 0;
  const graph = contract.graphCatalog.find(graph => graph.graphId === pane.graphId);
  if (!graph) return false;
  return !("seriesCatalog" in graph) || pane.series.length > 0;
}

export function finalizeWorkbenchPaneSelectionV3(pane: WorkbenchSurfacePaneV3): WorkbenchSurfacePaneV3 {
  if (pane.role !== "graph") return pane;
  const ids = new Set(pane.series.map(item => item.seriesId));
  return { ...pane, traceColors: pane.traceColors?.filter(trace => trace.seriesId === null || ids.has(trace.seriesId)), excludedTraces: pane.excludedTraces.filter(trace => trace.seriesId === null || ids.has(trace.seriesId)) };
}
