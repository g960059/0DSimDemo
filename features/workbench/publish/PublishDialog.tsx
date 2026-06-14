import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CaseDocument, CaseStatus, CaseVisibility } from "@/caseDoc";
import type { BuildCurrentDoc } from "@/features/workbench/hooks/useWorkbenchPersistence";
import type { ReadExploreMode } from "@/features/workbench/readExplore";
import { PublishIssueList } from "@/features/workbench/publish/PublishIssueList";
import {
  deriveInitialPublishDialogDraft,
  derivePublishDialogState,
  type PublishDialogDraft,
  type PublishDialogVisibility,
} from "@/features/workbench/publish/publishDialogState";

function SegmentedButton<TValue extends string>({
  value,
  selected,
  disabled = false,
  onSelect,
  children,
}: {
  value: TValue;
  selected: boolean;
  disabled?: boolean;
  onSelect: (value: TValue) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={`rounded px-2 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent disabled:cursor-not-allowed disabled:opacity-45 ${
        selected ? "bg-wb-active text-wb-text" : "text-wb-muted hover:bg-wb-hover hover:text-wb-text"
      }`}
    >
      {children}
    </button>
  );
}

export function PublishDialog({
  buildCurrentDoc,
  currentStatus,
  currentVisibility,
  isPublishing = false,
  publishSuccess,
  copyState = "idle",
  onCancel,
  onReview,
  onConfirmDraft,
  onUnpublish,
  onCopyShareLink,
  onDone,
}: {
  buildCurrentDoc: BuildCurrentDoc;
  currentStatus?: CaseStatus;
  currentVisibility?: CaseVisibility;
  isPublishing?: boolean;
  publishSuccess?: { visibility: PublishDialogVisibility; shareUrl: string } | null;
  copyState?: "idle" | "copied";
  onCancel: () => void;
  onReview: (reviewDoc: CaseDocument, entry: ReadExploreMode) => void;
  onConfirmDraft?: (draft: PublishDialogDraft) => void;
  onUnpublish?: () => void;
  onCopyShareLink?: () => void;
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const initialDoc = useMemo(() => buildCurrentDoc(), [buildCurrentDoc]);
  const [draft, setDraft] = useState<PublishDialogDraft>(() => deriveInitialPublishDialogDraft(initialDoc, {
    status: currentStatus,
    visibility: currentVisibility,
  }));

  useEffect(() => {
    setDraft(deriveInitialPublishDialogDraft(initialDoc, {
      status: currentStatus,
      visibility: currentVisibility,
    }));
  }, [currentStatus, currentVisibility, initialDoc]);

  const baseDoc = useMemo(() => buildCurrentDoc({ defaultEntry: draft.defaultEntry }), [buildCurrentDoc, draft.defaultEntry]);
  const state = useMemo(() => derivePublishDialogState(baseDoc, draft), [baseDoc, draft]);
  const selectedEntry = state.draft.defaultEntry;
  const isPublished = currentStatus === "published";
  const primaryLabel = isPublishing
    ? t(isPublished ? "publish.dialog.updating" : "publish.dialog.publishing")
    : t(isPublished ? "publish.dialog.update" : "publish.dialog.publish");
  const primaryDisabled = !state.canPublish || isPublishing;

  const setVisibility = (visibility: PublishDialogVisibility) => {
    setDraft((prev) => ({ ...prev, visibility }));
  };
  const setEntry = (defaultEntry: ReadExploreMode) => {
    setDraft((prev) => ({ ...prev, defaultEntry }));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="publish-dialog-title" className="w-full max-w-md rounded-lg border border-wb-line bg-wb-panel shadow-2xl">
        <div className="border-b border-wb-line px-5 py-4">
          <h2 id="publish-dialog-title" className="text-sm font-bold text-wb-text">{t("publish.dialog.title")}</h2>
          <p className="mt-1 text-xs leading-5 text-wb-muted">{t("publish.dialog.subtitle")}</p>
        </div>
        {publishSuccess ? (
          <div className="p-5">
            <section className="rounded-md border border-wb-accent bg-wb-accent-soft p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-wb-text">
                <Check className="h-4 w-4 text-wb-accent" />
                <span>
                  {t("publish.success.title")} · {publishSuccess.visibility === "public" ? t("publish.dialog.public") : t("publish.dialog.unlisted")}
                </span>
              </div>
              <label className="mt-4 block text-xs font-bold text-wb-muted" htmlFor="publish-share-url">
                {t("publish.success.shareUrlLabel")}
              </label>
              <input
                id="publish-share-url"
                readOnly
                value={publishSuccess.shareUrl}
                className="mt-2 w-full rounded border border-wb-line bg-wb-input px-3 py-2 text-xs font-medium text-wb-text outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
                onFocus={(event) => event.currentTarget.select()}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCopyShareLink}
                  className="inline-flex items-center gap-1.5 rounded border border-wb-line bg-transparent px-3 py-1.5 text-sm font-bold text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t(copyState === "copied" ? "publish.success.copied" : "publish.success.copyLink")}
                </button>
                <button
                  type="button"
                  onClick={onDone ?? onCancel}
                  className="rounded bg-wb-primary px-4 py-1.5 text-sm font-bold text-white hover:bg-wb-primary-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
                >
                  {t("common.done")}
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-5 p-5">
            <section>
              <div className="mb-2 text-xs font-bold text-wb-muted">{t("publish.dialog.visibility")}</div>
              <div className="inline-grid grid-cols-2 gap-1 rounded-md border border-wb-line bg-wb-input p-1">
                <SegmentedButton value="unlisted" selected={draft.visibility === "unlisted"} onSelect={setVisibility}>
                  {t("publish.dialog.unlisted")}
                </SegmentedButton>
                <SegmentedButton value="public" selected={draft.visibility === "public"} onSelect={setVisibility}>
                  {t("publish.dialog.public")}
                </SegmentedButton>
              </div>
              <p className="mt-2 text-xs leading-5 text-wb-subtle">{t("publish.dialog.visibilityHint")}</p>
            </section>

            <section>
              <div className="mb-2 text-xs font-bold text-wb-muted">{t("publish.dialog.openingView")}</div>
              <div className="inline-grid grid-cols-2 gap-1 rounded-md border border-wb-line bg-wb-input p-1">
                <SegmentedButton value="read" selected={selectedEntry === "read"} disabled={state.readDisabled} onSelect={setEntry}>
                  Read
                </SegmentedButton>
                <SegmentedButton value="explore" selected={selectedEntry === "explore"} onSelect={setEntry}>
                  Explore
                </SegmentedButton>
              </div>
              <div className="mt-2 space-y-1 text-xs leading-5 text-wb-subtle">
                <p>{t("publish.dialog.readHelp")}</p>
                <p>{t("publish.dialog.exploreHelp")}</p>
                {state.readDisabled && <p className="font-semibold text-wb-warning">{t("publish.dialog.readDisabled")}</p>}
              </div>
            </section>

            <section>
              <div className="mb-2 text-xs font-bold text-wb-muted">{t("publish.dialog.checks")}</div>
              <PublishIssueList blockers={state.blockers} warnings={state.warnings} />
            </section>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 border-t border-wb-line px-5 py-3">
          {isPublished && onUnpublish ? (
            <button
              type="button"
              onClick={onUnpublish}
              disabled={isPublishing}
              className="rounded px-2 py-1.5 text-sm font-bold text-wb-subtle hover:text-wb-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("publish.dialog.unpublish")}
            </button>
          ) : <span />}
          {!publishSuccess && (
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onCancel} className="rounded px-3 py-1.5 text-sm font-bold text-wb-muted hover:text-wb-text">{t("common.cancel")}</button>
              <button
                type="button"
                onClick={() => onReview(state.reviewDoc, selectedEntry)}
                className="rounded border border-wb-line bg-transparent px-4 py-1.5 text-sm font-bold text-wb-muted hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
              >
                {t("publish.dialog.reviewAsReader")}
              </button>
              <button
                type="button"
                disabled={primaryDisabled}
                onClick={() => onConfirmDraft?.(state.draft)}
                className="rounded bg-wb-primary px-4 py-1.5 text-sm font-bold text-white hover:bg-wb-primary-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-wb-accent"
              >
                {primaryLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
