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
  disabledReason?: string;
  label: string;
  pending: boolean;
  onCreate(): void;
}>;

/**
 * Workbench shell for the shared role-specific Briefing editor.
 *
 * It deliberately owns no second pane-pick representation. The edited value
 * is the exact Briefing validated and frozen inside the immutable Article
 * Snapshot; the session handoff carries only return-navigation intent.
 */
export function WorkbenchBriefingComposerV3({
  briefing,
  captureScenarioId,
  contract,
  open,
  snapshot,
  snapshotAction,
  strings,
  onChange,
  onClose,
}: Readonly<{
  briefing: ExperimentPlacementBriefingV2;
  captureScenarioId: string;
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
  const [present, setPresent] = React.useState(open);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const openerRef = React.useRef<HTMLElement | null>(null);
  const previousOpenRef = React.useRef(false);
  const snapshotNoticeId = React.useId();
  const sealing = snapshotAction?.pending ?? false;
  React.useEffect(() => {
    if (open) {
      if (!previousOpenRef.current) {
        openerRef.current = document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      }
      previousOpenRef.current = true;
      setPresent(true);
      const frame = window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus({ preventScroll: true });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    if (previousOpenRef.current) {
      previousOpenRef.current = false;
      openerRef.current?.focus({ preventScroll: true });
      openerRef.current = null;
    }
    const timeout = window.setTimeout(() => setPresent(false), 180);
    return () => window.clearTimeout(timeout);
  }, [open]);

  React.useEffect(() => {
    return () => {
      openerRef.current?.focus({ preventScroll: true });
      openerRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sealing) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open, sealing]);

  if (!present || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[80] flex justify-end"
      data-testid="workbench-briefing-composer-v3"
    >
      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby="workbench-briefing-title-v3"
        aria-hidden={!open}
        inert={!open}
        className={`pointer-events-auto flex h-full w-full flex-col bg-wb-panel text-wb-text shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none sm:border-l sm:border-wb-line lg:w-[min(42rem,45vw)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
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
            ref={closeButtonRef}
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-wb-muted hover:bg-wb-hover hover:text-wb-text disabled:cursor-wait disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            aria-label={strings.close}
            disabled={sealing}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div
          className={`min-h-0 flex-1 overflow-y-auto bg-wb-app px-3 pb-6 transition-opacity sm:px-5 ${
            sealing ? "opacity-65" : ""
          }`}
          aria-busy={sealing}
          inert={sealing}
        >
          <ArticleBriefingEditorV3
            briefing={briefing}
            captureScenarioId={captureScenarioId}
            contract={contract}
            snapshot={snapshot}
            showIntro={false}
            testId="workbench-role-briefing-editor-v3"
            onChange={onChange}
          />
        </div>

        {snapshotAction !== undefined && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-wb-line px-4 py-3 sm:px-5">
            <p
              id={snapshotNoticeId}
              className="max-w-md text-[10px] leading-4 text-wb-subtle"
            >
              {snapshotAction.disabledReason ?? strings.snapshotNotice}
            </p>
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-wb-primary px-3 text-xs font-semibold text-white hover:bg-wb-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
              disabled={snapshotAction.disabled || snapshotAction.pending}
              aria-describedby={snapshotNoticeId}
              title={snapshotAction.disabledReason}
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
