import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { CONTROLLER_CATALOG_SECTIONS } from "../../controllerCatalog";
import { buttonOptionsFromRange, normalizeControllerItems } from "../../controllerItems";
import { KNOB_RANGES, neutralKnobs, type KnobKey } from "../../engine/knobs";
import { defaultControllerItemFor, readingButtonOptionsFor, roundToStep } from "../../knobMetadata";
import type { ControllerItem, PanelDef, SimInstance } from "../../types";
import { ControllerItemControl } from "../controls/ControllerItemControl";
import { controllerOptionsWithLabelKeys, translatedControllerCategory, translatedControllerItemLabel, translatedControllerOptions, translatedKnobLabel } from "../../i18nText";

type ControllerItemsBuilderProps = {
  panel: PanelDef;
  instances: SimInstance[];
  activeInstanceId?: string;
  updatePanelControllerItems: (panelId: string, items: ControllerItem[]) => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distinctOptionValues(item: ControllerItem): number {
  return new Set((item.options ?? []).map((option) => option.value)).size;
}

function targetInstance(panel: PanelDef, instances: SimInstance[], activeInstanceId?: string): SimInstance | undefined {
  const isPaneTarget = (inst: SimInstance) => panel.config[inst.id]?.visible;
  return instances.find((inst) => inst.id === activeInstanceId && isPaneTarget(inst))
    ?? instances.find(isPaneTarget)
    ?? instances[0];
}

function baselineFor(panel: PanelDef, instances: SimInstance[], activeInstanceId?: string): Record<string, number> {
  const inst = targetInstance(panel, instances, activeInstanceId);
  if (!inst) return {};
  return neutralKnobs(inst.knobBaseline ?? inst.params) as unknown as Record<string, number>;
}

function seedButtonOptions(item: ControllerItem, baseline: number): { label: string; value: number }[] {
  return readingButtonOptionsFor(item.paramKey, baseline) ?? buttonOptionsFromRange(item);
}

function normalizedPreviewValue(item: ControllerItem, baseline: number | undefined): number {
  const min = item.min ?? KNOB_RANGES[item.paramKey as KnobKey]?.[0] ?? 0;
  const max = item.max ?? KNOB_RANGES[item.paramKey as KnobKey]?.[1] ?? 1;
  const step = item.step ?? 0.01;
  return roundToStep(clamp(Number.isFinite(baseline) ? baseline as number : (min + max) / 2, min, max), step);
}

export function ControllerItemsBuilder({
  panel,
  instances,
  activeInstanceId,
  updatePanelControllerItems,
}: ControllerItemsBuilderProps) {
  const { t } = useTranslation();
  const normalized = useMemo(
    () => normalizeControllerItems(panel.view?.kind === "control" ? panel.view.controllerItems ?? [] : []),
    [panel.view],
  );
  const items = normalized.items;
  const [editWarnings, setEditWarnings] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const warnings = editWarnings.length > 0 ? editWarnings : normalized.warnings;
  const baselines = useMemo(() => baselineFor(panel, instances, activeInstanceId), [activeInstanceId, instances, panel]);
  const usedKeys = new Set(items.map((item) => item.paramKey));

  const commit = (nextItems: ControllerItem[]) => {
    const next = normalizeControllerItems(nextItems);
    setEditWarnings(next.warnings);
    updatePanelControllerItems(panel.id, next.items);
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

  const updateOption = (itemIndex: number, optionIndex: number, patch: Partial<{ label: string; value: number }>) => {
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
    updateItem(itemIndex, {
      label: value,
      ...(value.trim() === (item?.label ?? "").trim() ? {} : { labelKey: undefined }),
    });
  };

  const commitOptionLabelDraft = (itemIndex: number, optionIndex: number, key: string, value: string) => {
    clearDraft(key);
    const option = items[itemIndex]?.options?.[optionIndex];
    updateOption(itemIndex, optionIndex, {
      label: value,
      ...(value.trim() === (option?.label ?? "").trim() ? {} : { labelKey: undefined }),
    });
  };

  const commitOptionValueDraft = (itemIndex: number, optionIndex: number, key: string, value: string) => {
    clearDraft(key);
    const previousValue = items[itemIndex]?.options?.[optionIndex]?.value ?? 0;
    const parsed = Number(value);
    updateOption(itemIndex, optionIndex, { value: value.trim() !== "" && Number.isFinite(parsed) ? parsed : previousValue });
  };

  return (
    <div className="space-y-3">
      <div className="rounded bg-slate-950/20 px-2 py-2 text-[11px] font-medium text-slate-400">
        {t("workbench.controllerBuilder.description")}
      </div>

      <div className="divide-y divide-slate-800/70 rounded bg-slate-950/20">
        {CONTROLLER_CATALOG_SECTIONS.map((section) => (
          <div key={section.title} className="px-2 py-2">
            <div className="mb-1.5 text-[10px] font-bold uppercase text-slate-500">{translatedControllerCategory(t, section.title)}</div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {section.controls.map((entry) => {
                const added = usedKeys.has(entry.key);
                return (
                  <button
                    key={entry.key}
                    type="button"
                    disabled={added}
                    onClick={() => {
                      const nextItem = defaultControllerItemFor(entry.key);
                      commit([...items, { ...nextItem, labelKey: entry.key }]);
                    }}
                    className={`flex min-h-8 items-center justify-between gap-2 rounded border px-2 text-left text-xs font-semibold transition-colors ${
                      added
                        ? "border-slate-800/70 bg-slate-900/25 text-slate-600"
                        : "border-slate-700/70 bg-slate-950/45 text-slate-300 hover:border-slate-500 hover:text-slate-100"
                    }`}
                  >
                    <span className="min-w-0 truncate">{translatedKnobLabel(t, entry.key, entry.label)}</span>
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded bg-slate-950/20 px-2 py-3 text-xs font-medium text-slate-500">
          {t("workbench.controllerBuilder.empty")}
        </div>
      ) : (
        <div className="divide-y divide-slate-800/70 rounded bg-slate-950/20">
          {items.map((item, index) => {
            const range = KNOB_RANGES[item.paramKey as KnobKey] ?? [item.min ?? 0, item.max ?? 1];
            const baseline = normalizedPreviewValue(item, baselines[item.paramKey]);
            const isButton = item.kind === "buttonGroup";
            const optionWarning = isButton && distinctOptionValues(item) < 2;
            const itemLabelDraftKey = `${item.paramKey}:label`;
            return (
              <div key={item.paramKey} className="space-y-2 px-2 py-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={drafts[itemLabelDraftKey] ?? item.label ?? ""}
                    onChange={(event) => setDraft(itemLabelDraftKey, event.target.value)}
                    onBlur={(event) => commitItemLabelDraft(index, itemLabelDraftKey, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                    }}
                    className="h-8 min-w-0 flex-1 rounded border border-slate-700/70 bg-slate-950/70 px-2 text-xs font-bold text-slate-100 outline-none focus:border-slate-500"
                    aria-label={`${item.paramKey} label`}
                  />
                  <div className="flex shrink-0 rounded border border-slate-700 bg-slate-900 p-0.5">
                    {(["slider", "buttonGroup"] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => updateItem(index, {
                          kind,
                          ...(kind === "buttonGroup" ? { options: controllerOptionsWithLabelKeys(item, seedButtonOptions(item, baseline), baseline) } : { options: undefined }),
                        })}
                        className={`h-6 rounded px-2 text-[10px] font-bold transition-colors ${item.kind === kind ? "bg-sky-500/20 text-sky-100" : "text-slate-500 hover:text-slate-300"}`}
                      >
                        {kind === "slider" ? t("workbench.controllerBuilder.slider") : t("workbench.controllerBuilder.button")}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30" aria-label={`Move ${item.label} up`}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30" aria-label={`Move ${item.label} down`}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => removeItem(index)} className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-300" aria-label={`Remove ${item.label}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {isButton && (
                  <div className="space-y-1">
                    {(item.options ?? []).map((option, optionIndex) => {
                      const optionLabelDraftKey = `${item.paramKey}:option:${optionIndex}:label`;
                      const optionValueDraftKey = `${item.paramKey}:option:${optionIndex}:value`;
                      return (
                        <div key={`${option.label}-${optionIndex}`} className="grid grid-cols-[minmax(0,1fr)_5.5rem_auto] items-center gap-1.5">
                          <input
                            type="text"
                            value={drafts[optionLabelDraftKey] ?? option.label}
                            onChange={(event) => setDraft(optionLabelDraftKey, event.target.value)}
                            onBlur={(event) => commitOptionLabelDraft(index, optionIndex, optionLabelDraftKey, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                event.currentTarget.blur();
                              }
                            }}
                            className="h-7 min-w-0 rounded border border-slate-800 bg-slate-950/70 px-2 text-[11px] font-semibold text-slate-200 outline-none focus:border-slate-500"
                            aria-label={`${item.label} option label`}
                          />
                          <input
                            type="number"
                            value={drafts[optionValueDraftKey] ?? String(option.value)}
                            min={range[0]}
                            max={range[1]}
                            step={item.step}
                            onChange={(event) => setDraft(optionValueDraftKey, event.target.value)}
                            onBlur={(event) => commitOptionValueDraft(index, optionIndex, optionValueDraftKey, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                event.currentTarget.blur();
                              }
                            }}
                            className="h-7 min-w-0 rounded border border-slate-800 bg-slate-950/70 px-2 text-[11px] font-semibold text-slate-200 outline-none focus:border-slate-500"
                            aria-label={`${item.label} option value`}
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(index, { options: (item.options ?? []).filter((_option, optionItemIndex) => optionItemIndex !== optionIndex) })}
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-300"
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
                      onClick={() => updateItem(index, { options: [...(item.options ?? []), { label: `Option ${(item.options?.length ?? 0) + 1}`, value: baseline }] })}
                      className="h-7 rounded border border-slate-700/70 px-2 text-[11px] font-bold text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 disabled:opacity-30"
                    >
                      {t("workbench.controllerBuilder.addOption")}
                    </button>
                    {optionWarning && <div className="text-[10px] font-semibold text-amber-200">{t("workbench.controllerBuilder.needsDistinctValues")}</div>}
                  </div>
                )}

                <div className="rounded border border-slate-800/70 bg-slate-950/35 p-2">
                  <div className="mb-1 text-[10px] font-semibold uppercase text-slate-500">{t("workbench.panelGrid.preview")}</div>
                  <ControllerItemControl
                    item={{
                      ...item,
                      label: translatedControllerItemLabel(t, item),
                      ...(item.options ? { options: translatedControllerOptions(t, item.options) } : {}),
                    }}
                    value={baseline}
                    baseline={baseline}
                    onChange={() => {}}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-1 rounded bg-amber-500/10 px-2 py-2 text-[10px] font-semibold text-amber-100">
          {warnings.map((warning) => <div key={warning}>{warning}</div>)}
        </div>
      )}
    </div>
  );
}
