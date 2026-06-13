import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { CONTROLLER_CATALOG, CONTROLLER_CATALOG_SECTIONS, type ControllerCatalogEntry } from "../../controllerCatalog";
import { buttonOptionsFromRange, normalizeControllerItems } from "../../controllerItems";
import { KNOB_RANGES, neutralKnobs, type KnobKey } from "../../engine/knobs";
import { rawDisplayParams } from "../../engine/instanceKnobs";
import { defaultControllerItemFor, readingButtonOptionsFor, roundToStep } from "../../knobMetadata";
import { RAW_PARAM_CATALOG_SECTIONS, rawParamCatalogEntry, type RawParamEntry } from "../../rawParameterCatalog";
import type { ControllerItem, PanelDef, SimInstance } from "../../types";
import { ControllerItemControl } from "../controls/ControllerItemControl";
import { controllerOptionsWithLabelKeys, translatedControllerCategory, translatedControllerItemLabel, translatedControllerOptions, translatedKnobLabel } from "../../i18nText";

type ControllerItemsBuilderProps = {
  panel?: PanelDef;
  items?: ControllerItem[];
  instances: SimInstance[];
  activeInstanceId?: string;
  updatePanelControllerItems?: (panelId: string, items: ControllerItem[]) => void;
  onItemsChange?: (items: ControllerItem[]) => void;
};

type CatalogEntry = ControllerCatalogEntry | RawParamEntry;

const clinicalCatalogByKey = new Map<string, ControllerCatalogEntry>(CONTROLLER_CATALOG.map((entry) => [entry.key, entry]));

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distinctOptionValues(item: ControllerItem): number {
  return new Set((item.options ?? []).map((option) => option.value)).size;
}

function targetInstance(panel: PanelDef | undefined, instances: SimInstance[], activeInstanceId?: string): SimInstance | undefined {
  if (!panel) {
    return instances.find((inst) => inst.id === activeInstanceId) ?? instances[0];
  }
  const isPaneTarget = (inst: SimInstance) => panel.config[inst.id]?.visible;
  return instances.find((inst) => inst.id === activeInstanceId && isPaneTarget(inst))
    ?? instances.find(isPaneTarget)
    ?? instances[0];
}

function baselineFor(panel: PanelDef | undefined, instances: SimInstance[], activeInstanceId?: string): Record<string, number> {
  const inst = targetInstance(panel, instances, activeInstanceId);
  if (!inst) return {};
  const raw = rawDisplayParams({ params: inst.params, knobs: inst.knobs, knobBaseline: inst.knobBaseline }) as unknown as Record<string, number>;
  const clinical = neutralKnobs(inst.knobBaseline ?? inst.params) as unknown as Record<string, number>;
  return { ...raw, ...clinical };
}

function catalogMetaFor(paramKey: string): { label: string; min: number; max: number; step: number; unit?: string } {
  const clinical = clinicalCatalogByKey.get(paramKey);
  if (clinical) {
    const range = KNOB_RANGES[paramKey as KnobKey] ?? [0, 1];
    return { label: clinical.label, min: range[0], max: range[1], step: clinical.step, ...(clinical.unit ? { unit: clinical.unit } : {}) };
  }
  const raw = rawParamCatalogEntry(paramKey);
  if (raw) return { label: raw.label, min: raw.min, max: raw.max, step: raw.step, ...(raw.unit ? { unit: raw.unit } : {}) };
  return { label: paramKey, min: 0, max: 1, step: 0.01 };
}

function seedButtonOptions(item: ControllerItem, baseline: number): { label: string; value: number }[] {
  return readingButtonOptionsFor(item.paramKey, baseline) ?? buttonOptionsFromRange(item);
}

function normalizedPreviewValue(item: ControllerItem, baseline: number | undefined): number {
  const meta = catalogMetaFor(item.paramKey);
  const min = item.min ?? meta.min;
  const max = item.max ?? meta.max;
  const step = item.step ?? meta.step;
  return roundToStep(clamp(Number.isFinite(baseline) ? baseline as number : (min + max) / 2, min, max), step);
}

function entrySearchText(entry: CatalogEntry, translatedLabel: string): string {
  return `${entry.key} ${entry.label} ${translatedLabel} ${entry.unit ?? ""}`.toLowerCase();
}

export function ControllerItemsBuilder({
  panel,
  items: authoredItems,
  instances,
  activeInstanceId,
  updatePanelControllerItems,
  onItemsChange,
}: ControllerItemsBuilderProps) {
  const { t } = useTranslation();
  const normalized = useMemo(
    () => normalizeControllerItems(authoredItems ?? (panel?.view?.kind === "control" ? panel.view.controllerItems ?? [] : [])),
    [authoredItems, panel?.view],
  );
  const items = normalized.items;
  const [editWarnings, setEditWarnings] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const warnings = editWarnings.length > 0 ? editWarnings : normalized.warnings;
  const baselines = useMemo(() => baselineFor(panel, instances, activeInstanceId), [activeInstanceId, instances, panel]);
  const usedKeys = new Set(items.map((item) => item.paramKey));
  const query = search.trim().toLowerCase();

  const clinicalEntries = useMemo(() => {
    return CONTROLLER_CATALOG_SECTIONS.flatMap((section) => section.controls).filter((entry) => {
      const label = translatedKnobLabel(t, entry.key, entry.label);
      return !query || entrySearchText(entry, label).includes(query);
    });
  }, [query, t]);

  const rawSections = useMemo(() => {
    return RAW_PARAM_CATALOG_SECTIONS.map((section) => ({
      ...section,
      controls: section.controls.filter((entry) => {
        const label = translatedKnobLabel(t, entry.key, entry.label);
        return !query || entrySearchText(entry, label).includes(query);
      }),
    })).filter((section) => section.controls.length > 0);
  }, [query, t]);

  const commit = (nextItems: ControllerItem[]) => {
    const next = normalizeControllerItems(nextItems);
    setEditWarnings(next.warnings);
    if (panel && updatePanelControllerItems) {
      updatePanelControllerItems(panel.id, next.items);
      return;
    }
    onItemsChange?.(next.items);
  };

  const updateItem = (index: number, patch: Partial<ControllerItem>) => {
    commit(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const removeItem = (index: number) => {
    commit(items.filter((_item, itemIndex) => itemIndex !== index));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  const updateOption = (itemIndex: number, optionIndex: number, patch: Partial<{ label: string; value: number; labelKey?: string }>) => {
    const item = items[itemIndex];
    const nextOptions = (item.options ?? []).map((option, index) => index === optionIndex ? { ...option, ...patch } : option);
    updateItem(itemIndex, { options: nextOptions });
  };

  const setDraft = (key: string, value: string) => {
    setDrafts((current) => ({ ...current, [key]: value }));
  };

  const clearDraft = (key: string) => {
    setDrafts((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const commitItemLabelDraft = (itemIndex: number, key: string, value: string) => {
    clearDraft(key);
    const item = items[itemIndex];
    if (!item) return;
    const meta = catalogMetaFor(item.paramKey);
    const displayedLabel = translatedControllerItemLabel(t, item, meta.label);
    if (value.trim() === displayedLabel.trim()) return;
    updateItem(itemIndex, { label: value, labelKey: undefined });
  };

  const commitRangeDraft = (itemIndex: number, key: string, field: "min" | "max" | "step", value: string) => {
    clearDraft(key);
    const item = items[itemIndex];
    const meta = catalogMetaFor(item.paramKey);
    const fallback = item[field] ?? meta[field];
    const parsed = Number(value);
    const nextValue = value.trim() !== "" && Number.isFinite(parsed) && (field !== "step" || parsed > 0) ? parsed : fallback;
    updateItem(itemIndex, { [field]: nextValue });
  };

  const commitOptionLabelDraft = (itemIndex: number, optionIndex: number, key: string, value: string) => {
    clearDraft(key);
    const item = items[itemIndex];
    const option = item?.options?.[optionIndex];
    if (!item || !option) return;
    const displayedOption = translatedControllerOptions(t, [option])[0];
    if (value.trim() === displayedOption.label.trim()) return;
    updateOption(itemIndex, optionIndex, { label: value, labelKey: undefined });
  };

  const commitOptionValueDraft = (itemIndex: number, optionIndex: number, key: string, value: string) => {
    clearDraft(key);
    const previousValue = items[itemIndex]?.options?.[optionIndex]?.value ?? 0;
    const parsed = Number(value);
    updateOption(itemIndex, optionIndex, { value: value.trim() !== "" && Number.isFinite(parsed) ? parsed : previousValue });
  };

  const addEntry = (entry: CatalogEntry) => {
    const nextItem = defaultControllerItemFor(entry.key);
    commit([...items, { ...nextItem, labelKey: entry.key }]);
    setExpanded((current) => ({ ...current, [entry.key]: false }));
  };

  const renderCatalogButton = (entry: CatalogEntry) => {
    const added = usedKeys.has(entry.key);
    const label = translatedKnobLabel(t, entry.key, entry.label);
    return (
      <button
        key={entry.key}
        type="button"
        disabled={added}
        onClick={() => addEntry(entry)}
        title={`${label} — ${entry.key}`}
        className={`group/entry flex min-h-7 w-full items-center gap-2 rounded px-2 text-left text-xs transition-colors ${
          added
            ? "cursor-default text-wb-subtle"
            : "text-wb-muted hover:bg-wb-hover hover:text-wb-text"
        }`}
      >
        <span className="min-w-0 flex-1 truncate font-medium">
          {label}
          {entry.unit && <span className="ml-1 text-[11px] text-wb-subtle">{entry.unit}</span>}
        </span>
        {added
          ? <Check className="h-3 w-3 shrink-0 text-wb-subtle" />
          : <Plus className="h-3.5 w-3.5 shrink-0 text-wb-subtle opacity-0 transition-opacity group-hover/entry:opacity-100" />}
      </button>
    );
  };

  return (
    <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-2">
      <div className="grid min-h-0 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="min-h-0 overflow-y-auto pr-4 custom-scrollbar">
          <div className="mb-2 flex h-9 items-center gap-2 border-b border-wb-line px-1">
            <Search className="h-3.5 w-3.5 text-wb-subtle" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("workbench.controllerBuilder.searchControls")}
              className="min-w-0 flex-1 rounded bg-transparent text-xs font-medium text-wb-text outline-none placeholder:text-wb-subtle focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
            />
          </div>
          <div className="space-y-1">
            <details open className="group">
              <summary className="flex cursor-pointer select-none items-center gap-1.5 py-1.5 text-[11px] font-medium text-wb-subtle transition-colors hover:text-wb-muted [&::-webkit-details-marker]:hidden">
                <ChevronDown className="h-3 w-3 shrink-0 transition-transform group-open:rotate-0 -rotate-90" />
                {t("workbench.controllerBuilder.clinicalKnobs")}
              </summary>
              <div className="grid pb-1 sm:grid-cols-2">
                {clinicalEntries.map(renderCatalogButton)}
              </div>
            </details>
            {rawSections.map((section) => (
              <details key={section.title} open={query.length > 0 ? true : undefined} className="group">
                <summary className="flex cursor-pointer select-none items-center gap-1.5 py-1.5 text-[11px] font-medium text-wb-subtle transition-colors hover:text-wb-muted [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="h-3 w-3 shrink-0 transition-transform group-open:rotate-0 -rotate-90" />
                  {translatedControllerCategory(t, section.title)}
                </summary>
                <div className="grid pb-1 sm:grid-cols-2">
                  {section.controls.map(renderCatalogButton)}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto pl-4 lg:border-l lg:border-wb-line custom-scrollbar">
          <div className="mb-1 flex h-9 items-center text-[11px] font-medium text-wb-subtle">{t("workbench.controllerBuilder.selectedControls")}</div>
          {items.length === 0 ? (
            <div className="px-1 py-3 text-xs text-wb-subtle">
              {t("workbench.controllerBuilder.addFromLeft")}
            </div>
          ) : (
            <div className="divide-y divide-wb-line">
              {items.map((item, index) => {
                const meta = catalogMetaFor(item.paramKey);
                const baseline = normalizedPreviewValue(item, baselines[item.paramKey]);
                const isButton = item.kind === "buttonGroup";
                const optionWarning = isButton && distinctOptionValues(item) < 2;
                const isExpanded = expanded[item.paramKey] ?? false;
                const itemLabelDraftKey = `${item.paramKey}:label`;
                const displayedItemLabel = translatedControllerItemLabel(t, item, meta.label);
                return (
                  <div key={item.paramKey} className="py-1.5">
                    <div className="group/row grid min-h-8 grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-1">
                      <input
                        type="text"
                        value={drafts[itemLabelDraftKey] ?? displayedItemLabel}
                        onChange={(event) => setDraft(itemLabelDraftKey, event.target.value)}
                        onBlur={(event) => commitItemLabelDraft(index, itemLabelDraftKey, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            event.currentTarget.blur();
                          }
                        }}
                        className="h-8 min-w-0 rounded bg-transparent px-1.5 text-xs font-semibold text-wb-text outline-none transition-colors hover:bg-wb-hover focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
                        aria-label={`${item.paramKey} label`}
                      />
                      <div className="flex shrink-0 rounded bg-wb-input p-0.5" aria-label={t("workbench.controllerBuilder.controlType")}>
                        {(["slider", "buttonGroup"] as const).map((kind) => (
                          <button
                            key={kind}
                            type="button"
                            onClick={() => updateItem(index, {
                              kind,
                              ...(kind === "buttonGroup" ? { options: controllerOptionsWithLabelKeys(item, seedButtonOptions(item, baseline), baseline) } : { options: undefined }),
                            })}
                            className={`h-6 rounded px-2 text-[10px] font-bold transition-colors ${item.kind === kind ? "bg-wb-active text-wb-text" : "text-wb-subtle hover:text-wb-muted"}`}
                          >
                            {kind === "slider" ? t("workbench.controllerBuilder.slider") : t("workbench.controllerBuilder.button")}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => setExpanded((current) => ({ ...current, [item.paramKey]: !isExpanded }))} className="inline-flex h-7 w-7 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text" aria-label={isExpanded ? t("workbench.controllerBuilder.collapse") : t("workbench.controllerBuilder.expand")}>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                      <div className="flex shrink-0 items-center opacity-60 transition-opacity group-hover/row:opacity-100">
                        <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} className="inline-flex h-7 w-6 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text disabled:opacity-25" aria-label={t("workbench.viewEditor.moveUp")}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="inline-flex h-7 w-6 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text disabled:opacity-25" aria-label={t("workbench.viewEditor.moveDown")}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => removeItem(index)} className="inline-flex h-7 w-6 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-danger" aria-label={t("workbench.controllerBuilder.removeControl")}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-1.5 space-y-3 pl-1.5">
                        <div>
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-wb-subtle">{t("workbench.controllerBuilder.advancedRange")}</span>
                            <span className="text-[10px] text-wb-subtle">{t("workbench.controllerBuilder.engineRange", { min: meta.min, max: meta.max })}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(["min", "max", "step"] as const).map((field) => {
                              const draftKey = `${item.paramKey}:range:${field}`;
                              return (
                                <label key={field} className="grid gap-1 text-[11px] font-medium text-wb-subtle">
                                  {t(`workbench.controllerBuilder.${field}`)}
                                  <input
                                    type="number"
                                    value={drafts[draftKey] ?? String(item[field] ?? meta[field])}
                                    min={field === "step" ? undefined : meta.min}
                                    max={field === "step" ? undefined : meta.max}
                                    step={field === "step" ? "any" : item.step}
                                    onChange={(event) => setDraft(draftKey, event.target.value)}
                                    onBlur={(event) => commitRangeDraft(index, draftKey, field, event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        event.currentTarget.blur();
                                      }
                                    }}
                                    className="h-7 min-w-0 rounded bg-wb-input px-2 text-[11px] font-semibold normal-case text-wb-text outline-none transition-colors focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {isButton && (
                          <div className="space-y-1.5">
                            {(item.options ?? []).map((option, optionIndex) => {
                              const optionLabelDraftKey = `${item.paramKey}:option:${optionIndex}:label`;
                              const optionValueDraftKey = `${item.paramKey}:option:${optionIndex}:value`;
                              const displayedOptionLabel = translatedControllerOptions(t, [option])[0].label;
                              return (
                                <div key={`${option.label}-${optionIndex}`} className="grid grid-cols-[minmax(0,1fr)_5.5rem_auto] items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={drafts[optionLabelDraftKey] ?? displayedOptionLabel}
                                    onChange={(event) => setDraft(optionLabelDraftKey, event.target.value)}
                                    onBlur={(event) => commitOptionLabelDraft(index, optionIndex, optionLabelDraftKey, event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        event.currentTarget.blur();
                                      }
                                    }}
                                    className="h-7 min-w-0 rounded bg-wb-input px-2 text-[11px] font-semibold text-wb-text outline-none transition-colors focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
                                    aria-label={`${displayedItemLabel} option label`}
                                  />
                                  <input
                                    type="number"
                                    value={drafts[optionValueDraftKey] ?? String(option.value)}
                                    min={meta.min}
                                    max={meta.max}
                                    step={item.step}
                                    onChange={(event) => setDraft(optionValueDraftKey, event.target.value)}
                                    onBlur={(event) => commitOptionValueDraft(index, optionIndex, optionValueDraftKey, event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        event.currentTarget.blur();
                                      }
                                    }}
                                    className="h-7 min-w-0 rounded bg-wb-input px-2 text-[11px] font-semibold text-wb-text outline-none transition-colors focus:bg-wb-soft focus-visible:ring-1 focus-visible:ring-wb-accent"
	                                    aria-label={`${displayedItemLabel} option value`}
	                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateItem(index, { options: (item.options ?? []).filter((_option, optionItemIndex) => optionItemIndex !== optionIndex) })}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-danger"
                                    aria-label={`Remove ${option.label}`}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                            <button
                              type="button"
                              disabled={(item.options?.length ?? 0) >= 3}
                              onClick={() => updateItem(index, { options: [...(item.options ?? []), { label: t("workbench.controllerBuilder.optionNumber", { number: (item.options?.length ?? 0) + 1 }), value: baseline }] })}
                              className="h-7 rounded bg-wb-hover px-2.5 text-[11px] font-bold text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text disabled:opacity-30"
                            >
                              {t("workbench.controllerBuilder.addOption")}
                            </button>
                            {optionWarning && <div className="text-[10px] font-semibold text-amber-200">{t("workbench.controllerBuilder.needsDistinctValues")}</div>}
                          </div>
                        )}

                        <div>
                          <div className="mb-1.5 text-[11px] font-medium text-wb-subtle">{t("workbench.controllerBuilder.preview")}</div>
                          <ControllerItemControl
                            item={{
                              ...item,
                              label: translatedControllerItemLabel(t, item, meta.label),
                              ...(item.options ? { options: translatedControllerOptions(t, item.options) } : {}),
                            }}
                            value={baseline}
                            baseline={baseline}
                            onChange={() => {}}
                            unit={meta.unit}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-1 rounded bg-amber-500/10 px-2 py-2 text-[10px] font-semibold text-amber-100">
          {warnings.map((warning) => <div key={warning}>{warning}</div>)}
        </div>
      )}
    </div>
  );
}
