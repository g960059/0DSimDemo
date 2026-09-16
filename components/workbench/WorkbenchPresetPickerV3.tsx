import React from "react";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ScenarioPresetV2 } from "@/studio/contracts/v2/content";
import { STUDIO_PRESET_GROUPS_V1, studioPresetMatchesSearchV1, studioPresetPresentationV1 } from "@/studio/presentation/StudioPresetPresentationV1";
import { WorkbenchAnchoredDialogV3, type WorkbenchPopoverAnchorV3 } from "./WorkbenchAnchoredDialogV3";

export type WorkbenchPresetDocumentationLinksV3 = Readonly<Record<string, Readonly<{ href: string; label: string }>>>;

/** Selecting a row adds a Scenario; details are optional and never change the live selection. */
export function WorkbenchPresetPickerV3({ presets, documentationLinks, disabledReason, anchor, onAdd, onClose }: Readonly<{
  presets: readonly ScenarioPresetV2[];
  documentationLinks?: WorkbenchPresetDocumentationLinksV3;
  disabledReason?: string;
  anchor: WorkbenchPopoverAnchorV3;
  onAdd: (preset: ScenarioPresetV2) => void;
  onClose: () => void;
}>) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith("ja") ? "ja" : "en";
  const [query, setQuery] = React.useState("");
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const items = React.useMemo(() => presets.map(preset => ({ preset, ...studioPresetPresentationV1(preset, locale) })), [presets, locale]);
  const matching = items.filter(item => studioPresetMatchesSearchV1(item.searchTerms, query));
  const detail = items.find(item => item.preset.presetId === detailId);
  const documentation = detail && documentationLinks?.[detail.preset.presetId];
  const add = (preset: ScenarioPresetV2) => { if (disabledReason === undefined) onAdd(preset); };
  return <WorkbenchAnchoredDialogV3 anchor={anchor} title={t("workbench.editor.presetPicker.title")} closeLabel={t("common.close")}
    onClose={onClose} onBack={detail ? () => setDetailId(null) : undefined} backLabel={t("workbench.editor.presetPicker.back")}
    focusKey={detailId ?? "list"} testId="workbench-preset-picker-v3"
    footer={detail ? <button type="button" disabled={disabledReason !== undefined} onClick={() => add(detail.preset)}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-wb-primary px-4 text-sm font-semibold text-white hover:bg-wb-primary-hover focus-visible:ring-2 focus-visible:ring-wb-accent disabled:opacity-40"><Plus className="h-4 w-4" aria-hidden="true" />{t("workbench.editor.presetPicker.add")}</button> : undefined}>
    {disabledReason && <p className="px-4 py-2 text-xs text-wb-muted" role="status">{disabledReason}</p>}
    {detail ? <section aria-label={t("workbench.editor.presetPicker.overview")} className="min-h-0 overflow-y-auto px-4 py-4">
      <h3 className="mb-3 text-base font-semibold">{detail.label}</h3>
      {detail.summary && <p className="text-sm leading-7 text-wb-muted">{detail.summary}</p>}
      {documentation && <a href={documentation.href} target="_blank" rel="noreferrer noopener"
        aria-label={`${detail.label}: ${documentation.label} (${t("workbench.editor.presetPicker.newTab")})`}
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded text-sm text-wb-accent hover:underline focus-visible:ring-2 focus-visible:ring-wb-accent">
        {documentation.label}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>}
    </section> : <>
      <div className="shrink-0 px-3 pb-2 pt-3">
        <label className="flex items-center gap-2 rounded-lg border border-wb-line bg-wb-soft px-3 text-wb-muted focus-within:ring-2 focus-within:ring-wb-accent">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <input type="search" value={query} aria-label={t("workbench.editor.presetPicker.search")} placeholder={t("workbench.editor.presetPicker.search")}
            onChange={event => setQuery(event.target.value)} className="h-10 min-w-0 flex-1 bg-transparent text-base text-wb-text outline-none sm:text-sm" />
        </label>
      </div>
      <p className="sr-only" role="status">{t("workbench.editor.presetPicker.resultCount", { count: matching.length })}</p>
      <div className="min-h-0 overflow-y-auto overscroll-contain px-2 pb-3" data-testid="workbench-preset-list-scroll-v3">
        {STUDIO_PRESET_GROUPS_V1.map(group => {
          const entries = matching.filter(item => item.group === group);
          if (!entries.length) return null;
          return <section key={group} aria-label={t(`workbench.editor.presetPicker.groups.${group}`)}>
            <h3 className="px-2 pb-1 pt-2 text-xs font-medium text-wb-subtle">{t(`workbench.editor.presetPicker.groups.${group}`)}</h3>
            {entries.map(item => <div key={item.preset.presetId} className="flex items-stretch gap-1" data-preset-id={item.preset.presetId}>
              <button type="button" disabled={disabledReason !== undefined} onClick={() => add(item.preset)}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent disabled:opacity-40">
                <span className="min-w-0 flex-1 break-words">{item.label}</span><Plus className="h-3.5 w-3.5 shrink-0 text-wb-subtle" aria-hidden="true" />
              </button>
              <button type="button" aria-label={`${item.label}: ${t("workbench.editor.presetPicker.details")}`} onClick={() => setDetailId(item.preset.presetId)}
                className="min-h-11 shrink-0 rounded-lg px-2 text-xs text-wb-accent hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent">{t("workbench.editor.presetPicker.details")}</button>
            </div>)}
          </section>;
        })}
        {!matching.length && <p className="px-2 py-4 text-sm text-wb-muted">{t(items.length ? "workbench.editor.presetPicker.noMatches" : "workbench.editor.presetPicker.empty")}</p>}
      </div>
    </>}
  </WorkbenchAnchoredDialogV3>;
}
