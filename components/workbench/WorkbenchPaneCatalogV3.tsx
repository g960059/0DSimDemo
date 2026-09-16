import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  STUDIO_ITEM_PRESENTATION_CATEGORY_ORDER_V1,
  studioItemPresentationMatchesQueryV1,
  type StudioItemPresentationCategoryV1,
} from "@/studio/presentation/StudioItemPresentationCatalogV1";
import type { WorkbenchPaneEditorStringsV3 } from "./WorkbenchPaneEditorV3";
import type { WorkbenchPaneSelectionEntryV3 } from "./WorkbenchPaneSelectionV3";
import { WorkbenchItemDescriptionPopoverV3 } from "./presentation/WorkbenchItemDescriptionPopoverV3";

export function workbenchPaneCatalogGroupsV3(
  entries: readonly WorkbenchPaneSelectionEntryV3[],
  query: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const order: ReadonlyMap<StudioItemPresentationCategoryV1, number> = new Map(
    STUDIO_ITEM_PRESENTATION_CATEGORY_ORDER_V1.map((category, index) => [
      category,
      index,
    ]),
  );
  const categories = [
    ...new Set(entries.map((entry) => entry.presentation.category)),
  ].sort((a, b) => (order.get(a) ?? order.size) - (order.get(b) ?? order.size));
  return categories
    .map((category) => {
      const members = entries.filter(
        (entry) => entry.presentation.category === category,
      );
      return {
        category,
        selectedCount: members.filter((entry) => entry.selected).length,
        entries: members.filter(
          (entry) =>
            studioItemPresentationMatchesQueryV1(entry.presentation, query) ||
            entry.label.toLocaleLowerCase().includes(normalizedQuery),
        ).sort((a, b) => Number(a.reading === "waveform") - Number(b.reading === "waveform")),
      };
    })
    .filter((group) => group.entries.length > 0);
}

/** Only the add catalog is grouped; selected items retain their authored order. */
export function WorkbenchPaneCatalogV3({
  entries,
  query,
  expandedCategories,
  onExpandedCategoriesChange,
  strings,
  locale,
  onToggle,
}: Readonly<{
  entries: readonly WorkbenchPaneSelectionEntryV3[];
  query: string;
  expandedCategories: ReadonlySet<StudioItemPresentationCategoryV1>;
  onExpandedCategoriesChange: (
    categories: ReadonlySet<StudioItemPresentationCategoryV1>,
  ) => void;
  strings: WorkbenchPaneEditorStringsV3;
  locale: "en" | "ja";
  onToggle: (id: string) => void;
}>) {
  const prefix = React.useId();
  const [expandedWaveforms, setExpandedWaveforms] = React.useState<ReadonlySet<string>>(() => new Set());
  const groups = workbenchPaneCatalogGroupsV3(entries, query);
  const grouped =
    entries.length > 20 &&
    new Set(entries.map((entry) => entry.presentation.category)).size > 1;
  const searching = query.trim().length > 0;
  const renderEntry = (entry: WorkbenchPaneSelectionEntryV3) => {
    const label = (
      <span className="block break-words text-sm">
        {entry.label}
        {entry.detail && (
          <span className="ml-2 text-xs text-wb-subtle">{entry.detail}</span>
        )}
      </span>
    );
    const accessibleLabel =
      entry.detail &&
      entries.some(
        (other) => other.id !== entry.id && other.label === entry.label,
      )
        ? `${entry.label} (${entry.detail})`
        : entry.label;
    return (
      <div
        key={entry.id}
        data-item-id={entry.id}
        className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-1 ${entry.selected ? "bg-wb-selected" : "hover:bg-wb-hover"}`}
      >
        <input
          type="checkbox"
          checked={entry.selected}
          aria-label={accessibleLabel}
          onChange={() => onToggle(entry.id)}
          className="h-4 w-4 shrink-0 accent-[var(--wb-accent)]"
        />
        {entry.presentation.description ? (
          <WorkbenchItemDescriptionPopoverV3
            ariaLabel={
              locale === "ja" ? `${entry.label}の説明` : `About ${entry.label}`
            }
            description={entry.presentation.description}
            triggerProps={{
              className:
                "min-h-10 min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:ring-wb-accent",
              onClick: () => onToggle(entry.id),
            }}
          >
            {label}
          </WorkbenchItemDescriptionPopoverV3>
        ) : (
          <button
            type="button"
            className="min-h-10 min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:ring-wb-accent"
            onClick={() => onToggle(entry.id)}
          >
            {label}
          </button>
        )}
        {entry.unit && (
          <span
            className="shrink-0 text-xs text-wb-subtle"
            data-testid="pane-catalog-unit-v3"
          >
            {entry.unit}
          </span>
        )}
      </div>
    );
  };
  const renderMembers = (members: readonly WorkbenchPaneSelectionEntryV3[], key: string) => {
    const primary = members.filter(entry => entry.reading !== "waveform");
    const waveforms = members.filter(entry => entry.reading === "waveform");
    if (waveforms.length === 0) return members.map(renderEntry);
    const expanded = searching || expandedWaveforms.has(key);
    const selectedCount = waveforms.filter(entry => entry.selected).length;
    const label = locale === "ja" ? "波形の現在値" : "Waveform values";
    const id = `${prefix}-${key}-waveforms`;
    return <>
      {primary.map(renderEntry)}
      <div data-catalog-waveforms={key} className="mt-1 border-t border-wb-line/60 pt-1">
        {searching ? <p className="px-3 py-2 text-xs font-medium text-wb-muted">{label}</p> :
          <button type="button" aria-expanded={expanded} aria-controls={id}
            className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-xs text-wb-muted hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent"
            onClick={() => setExpandedWaveforms(previous => {
              const next = new Set(previous);
              if (next.has(key)) next.delete(key); else next.add(key);
              return next;
            })}>
            {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
            <span className="flex-1">{label}</span>
            {selectedCount > 0 && <span>{locale === "ja" ? `${selectedCount}選択` : `${selectedCount} selected`}</span>}
            <span className="tabular-nums text-wb-subtle">{waveforms.length}</span>
          </button>}
        <div id={id} hidden={!expanded}>{expanded && waveforms.map(renderEntry)}</div>
      </div>
    </>;
  };
  if (groups.length === 0)
    return (
      <p className="px-3 py-5 text-sm text-wb-muted">
        {strings.noCatalogMatches}
      </p>
    );
  if (!grouped) {
    const matches = new Set(
      groups.flatMap((group) => group.entries.map((entry) => entry.id)),
    );
    return (
      <>{renderMembers(entries.filter((entry) => matches.has(entry.id)), "all")}</>
    );
  }
  return (
    <div data-testid="pane-catalog-sections-v3" className="space-y-1">
      {groups.map((group) => {
        const expanded = searching || expandedCategories.has(group.category);
        const id = `${prefix}-${group.category}`;
        const heading = (
          <>
            {!searching &&
              (expanded ? (
                <ChevronDown
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
              ))}
            <span className="min-w-0 flex-1 text-left">
              {strings.catalogCategories[group.category]}
            </span>
            {!searching && group.selectedCount > 0 && (
              <span className="text-[11px] font-normal text-wb-muted">
                {locale === "ja"
                  ? `${group.selectedCount}選択`
                  : `${group.selectedCount} selected`}
              </span>
            )}
            <span className="text-xs font-normal tabular-nums text-wb-subtle">
              {group.entries.length}
            </span>
          </>
        );
        return (
          <section key={group.category} data-catalog-category={group.category}>
            <h3 className="sticky top-0 z-[1] bg-wb-panel">
              {searching ? (
                <div className="flex min-h-10 items-center gap-2 px-3 text-xs font-semibold text-wb-muted">
                  {heading}
                </div>
              ) : (
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={id}
                  aria-label={strings.catalogCategories[group.category]}
                  className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-wb-text hover:bg-wb-hover focus-visible:ring-2 focus-visible:ring-wb-accent"
                  onClick={() => {
                    const next = new Set(expandedCategories);
                    if (expanded) next.delete(group.category);
                    else next.add(group.category);
                    onExpandedCategoriesChange(next);
                  }}
                >
                  {heading}
                </button>
              )}
            </h3>
            <div id={id} hidden={!expanded}>
              {expanded && renderMembers(group.entries, group.category)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
