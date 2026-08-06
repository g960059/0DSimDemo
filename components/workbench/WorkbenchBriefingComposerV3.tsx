import React from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ClipboardList,
  FileCheck2,
  X,
} from "lucide-react";

export type WorkbenchBriefingPaneOptionV3 = Readonly<{
  paneId: string;
  role: "graph" | "output" | "control";
  label: string;
  defaultPriority: number;
  order: number;
}>;

export type WorkbenchBriefingPanePickV3 = Readonly<{
  paneId: string;
  priority: number;
}>;

export type WorkbenchBriefingSnapshotActionV3 = Readonly<{
  disabled: boolean;
  label: string;
  pending: boolean;
  onCreate(): void;
}>;

export function WorkbenchBriefingComposerV3({
  open,
  options,
  picks,
  renderPreview,
  snapshotAction,
  strings,
  onChange,
  onClose,
}: Readonly<{
  open: boolean;
  options: readonly WorkbenchBriefingPaneOptionV3[];
  picks: readonly WorkbenchBriefingPanePickV3[];
  renderPreview: (paneId: string) => React.ReactNode;
  snapshotAction?: WorkbenchBriefingSnapshotActionV3;
  strings: Readonly<{
    close: string;
    description: string;
    empty: string;
    lowerPriority: string;
    paneKinds: Readonly<Record<WorkbenchBriefingPaneOptionV3["role"], string>>;
    preview: string;
    raisePriority: string;
    snapshotNotice: string;
    title: string;
  }>;
  onChange: (picks: readonly WorkbenchBriefingPanePickV3[]) => void;
  onClose: () => void;
}>) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;
  const pickByPaneId = new Map(picks.map((pick) => [pick.paneId, pick]));
  const sortedPicks = [...picks].sort((left, right) => {
    if (left.priority !== right.priority) return right.priority - left.priority;
    const leftOption = options.find(({ paneId }) => paneId === left.paneId);
    const rightOption = options.find(({ paneId }) => paneId === right.paneId);
    if ((leftOption?.order ?? 0) !== (rightOption?.order ?? 0)) {
      return (leftOption?.order ?? 0) - (rightOption?.order ?? 0);
    }
    return left.paneId.localeCompare(right.paneId);
  });

  const toggle = (option: WorkbenchBriefingPaneOptionV3) => {
    const selected = pickByPaneId.has(option.paneId);
    onChange(Object.freeze(selected
      ? picks.filter(({ paneId }) => paneId !== option.paneId)
      : [...picks, Object.freeze({
        paneId: option.paneId,
        priority: option.defaultPriority,
      })]));
  };
  const adjustPriority = (paneId: string, delta: number) => {
    onChange(Object.freeze(picks.map((pick) => pick.paneId === paneId
      ? Object.freeze({ ...pick, priority: Math.max(0, pick.priority + delta) })
      : pick)));
  };

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[80] flex justify-end"
      data-testid="workbench-briefing-composer-v3"
    >
      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby="workbench-briefing-title-v3"
        className="workbench-sheet-enter pointer-events-auto flex h-full w-full max-w-[680px] flex-col bg-wb-panel text-wb-text shadow-2xl sm:border-l sm:border-wb-line"
      >
        <header className="flex min-h-14 items-start gap-3 px-4 py-3 sm:px-5">
          <span className="mt-0.5 rounded-lg bg-wb-active p-2 text-wb-accent">
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="workbench-briefing-title-v3" className="text-sm font-semibold">
              {strings.title}
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-wb-muted">
              {strings.description}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            aria-label={strings.close}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[230px_minmax(0,1fr)] lg:overflow-hidden">
          <section className="px-3 pb-4 lg:overflow-y-auto lg:border-r lg:border-wb-line lg:px-4">
            <div className="grid gap-1">
              {options.map((option) => {
                const pick = pickByPaneId.get(option.paneId);
                return (
                  <div
                    key={option.paneId}
                    className={`rounded-lg px-2 py-2 transition-colors ${
                      pick === undefined ? "hover:bg-wb-hover" : "bg-wb-active"
                    }`}
                  >
                    <div className="flex min-h-9 items-center gap-2">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={pick !== undefined}
                        aria-label={option.label}
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${
                          pick === undefined ? "text-wb-subtle" : "text-wb-accent"
                        }`}
                        onClick={() => toggle(option)}
                      >
                        <span
                          className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                            pick === undefined
                              ? "border-wb-line-strong"
                              : "border-wb-accent bg-wb-accent text-white"
                          }`}
                        >
                          {pick !== undefined && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left focus-visible:outline-none"
                        onClick={() => toggle(option)}
                      >
                        <span className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold">
                            {option.label}
                          </span>
                        </span>
                        <span className="mt-0.5 block pl-4 text-[10px] text-wb-subtle">
                          {strings.paneKinds[option.role]}
                        </span>
                      </button>
                    </div>
                    {pick !== undefined && (
                      <div className="mt-1 flex items-center justify-end gap-1 pl-10">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-wb-muted hover:bg-wb-hover hover:text-wb-text disabled:opacity-35"
                          aria-label={strings.lowerPriority}
                          disabled={pick.priority === 0}
                          onClick={() => adjustPriority(option.paneId, -1)}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <output className="min-w-8 text-center font-mono text-[10px] text-wb-muted">
                          {pick.priority}
                        </output>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-wb-muted hover:bg-wb-hover hover:text-wb-text"
                          aria-label={strings.raisePriority}
                          onClick={() => adjustPriority(option.paneId, 1)}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="min-h-[360px] bg-wb-app px-4 py-4 lg:min-h-0 lg:overflow-y-auto lg:px-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-wb-subtle">
              {strings.preview}
            </p>
            {sortedPicks.length === 0 ? (
              <div className="flex min-h-56 items-center justify-center rounded-xl bg-wb-soft px-8 text-center text-xs leading-6 text-wb-muted">
                {strings.empty}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sortedPicks.map((pick, index) => {
                  const option = options.find(({ paneId }) => paneId === pick.paneId);
                  if (option === undefined) return null;
                  return (
                    <article
                      key={pick.paneId}
                      className={`min-h-40 overflow-hidden rounded-xl bg-wb-panel shadow-sm ${
                        index === 0 && sortedPicks.length > 1 ? "sm:col-span-2" : ""
                      }`}
                      data-briefing-pane-id={pick.paneId}
                      data-briefing-priority={pick.priority}
                    >
                      <header className="flex min-h-9 items-center gap-2 px-3">
                        <span className="truncate text-[11px] font-semibold text-wb-muted">
                          {option.label}
                        </span>
                      </header>
                      <div className="h-40 min-h-0 overflow-hidden">
                        {renderPreview(pick.paneId)}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {snapshotAction !== undefined && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-wb-line px-4 py-3 sm:px-5">
            <p className="max-w-md text-[10px] leading-4 text-wb-subtle">
              {strings.snapshotNotice}
            </p>
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-wb-primary px-3 text-xs font-semibold text-white hover:bg-wb-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
              disabled={snapshotAction.disabled || snapshotAction.pending}
              onClick={snapshotAction.onCreate}
            >
              <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
              {snapshotAction.label}
            </button>
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  );
}
