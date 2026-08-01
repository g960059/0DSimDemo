import React from "react";
import { createPortal } from "react-dom";
import {
  ClipboardList,
  FileCheck2,
  X,
} from "lucide-react";

import {
  ArticleBriefingEditorV3,
} from "@/components/article/ArticleExperimentPlacementV3";
import type {
  ExperimentPlacementBriefingV2,
  ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";

export type WorkbenchBriefingSnapshotActionV3 = Readonly<{
  disabled: boolean;
  label: string;
  pending: boolean;
  onCreate(): void;
}>;

/**
 * Workbench shell for the shared role-specific Briefing editor.
 *
 * It deliberately owns no second pane-pick representation. The edited value
 * is the exact Placement Briefing that can be validated and copied into the
 * session handoff after an immutable Snapshot has been created.
 */
export function WorkbenchBriefingComposerV3({
  briefing,
  contract,
  open,
  snapshot,
  snapshotAction,
  strings,
  onChange,
  onClose,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  contract: ModelContractV2 | null;
  open: boolean;
  snapshot: ExperimentSnapshotV2;
  snapshotAction?: WorkbenchBriefingSnapshotActionV3;
  strings: Readonly<{
    close: string;
    description: string;
    snapshotNotice: string;
    title: string;
  }>;
  onChange: (briefing: ExperimentPlacementBriefingV2) => void;
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

        <div className="min-h-0 flex-1 overflow-y-auto bg-wb-app px-3 pb-6 sm:px-5">
          <ArticleBriefingEditorV3
            briefing={briefing}
            contract={contract}
            snapshot={snapshot}
            showIntro={false}
            testId="workbench-role-briefing-editor-v3"
            onChange={onChange}
          />
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
