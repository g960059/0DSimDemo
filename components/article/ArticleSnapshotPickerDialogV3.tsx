import React from "react";
import { ArrowUpRight, Check, FlaskConical, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { experimentSnapshotHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import type {
  ArticleExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";

export type ArticleSnapshotPickerDialogV3Props = Readonly<{
  open: boolean;
  snapshots: readonly ArticleExperimentSnapshotV2[];
  onCreateExperiment: () => void;
  onClose: () => void;
  onSelect: (snapshot: ArticleExperimentSnapshotV2) => void;
}>;

export function ArticleSnapshotPickerDialogV3({
  open,
  snapshots,
  onCreateExperiment,
  onClose,
  onSelect,
}: ArticleSnapshotPickerDialogV3Props) {
  const { t } = useTranslation();
  const dialogRef = React.useRef<HTMLDialogElement | null>(null);
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="article-snapshot-picker-title-v3"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      className="m-auto max-h-[min(720px,86dvh)] w-[min(620px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-wb-panel p-0 text-wb-text shadow-2xl backdrop:bg-black/55"
      data-testid="article-snapshot-picker-v3"
    >
      <header className="flex items-start gap-3 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0 flex-1">
          <h2
            id="article-snapshot-picker-title-v3"
            className="text-base font-semibold tracking-tight"
          >
            {t("articleEditor.snapshotPicker.title")}
          </h2>
          <p className="mt-1 text-xs leading-5 text-wb-muted">
            {t("articleEditor.snapshotPicker.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="max-h-[calc(86dvh-7.5rem)] overflow-y-auto px-3 pb-4 sm:px-4 sm:pb-5">
        <button
          type="button"
          onClick={onCreateExperiment}
          className="mb-2 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-wb-text transition-[color,background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wb-primary text-white">
            <Plus className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block">{t("articleEditor.snapshotPicker.createExperiment")}</span>
            <span className="mt-0.5 block text-[11px] font-normal leading-4 text-wb-muted">
              {t("articleEditor.snapshotPicker.createExperimentHint")}
            </span>
          </span>
        </button>
        {snapshots.length === 0 ? (
          <div className="mx-2 my-8 flex flex-col items-center text-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-wb-soft text-wb-subtle">
              <FlaskConical className="h-4 w-4" />
            </span>
            <p className="mt-4 text-sm font-medium">
              {t("articleEditor.emptySnapshots.title")}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-wb-muted">
              {t("articleEditor.emptySnapshots.description")}
            </p>
          </div>
        ) : (
          <ul className="grid gap-1" aria-label={t("articleEditor.snapshotPicker.listLabel")}>
            {snapshots.map((snapshot) => (
              <li key={snapshot.snapshotId} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(snapshot);
                    onClose();
                  }}
                  className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-3 text-left transition-[background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wb-soft text-wb-muted group-hover:text-wb-accent">
                    <FlaskConical className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {snapshot.content.scenarios[0]?.label ?? snapshot.snapshotId}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-wb-subtle">
                      {snapshot.snapshotId}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-wb-subtle">
                    {snapshot.content.surface.graphPanes.length
                      + snapshot.content.surface.outputPanes.length
                      + snapshot.content.surface.controlPanes.length} {t("articleEditor.panes")}
                  </span>
                  <Check className="h-4 w-4 shrink-0 text-wb-subtle opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                </button>
                <Link
                  to={experimentSnapshotHref({
                    locale,
                    snapshotId: snapshot.snapshotId,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  title={t("articleEditor.openSnapshot")}
                  aria-label={t("articleEditor.openSnapshot")}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-wb-subtle transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-accent active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}
