import * as React from "react";
import {
  ArrowLeft,
  Eye,
  FlaskConical,
  LockKeyhole,
  PanelsTopLeft,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import {
  homeHref,
  readerPreviewHref,
  workbenchHref,
} from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import type {
  StudioAuthorDraftV1,
} from "@/studio/contracts/v1";

import {
  useStudioAuthorPreviewV1,
} from "../StudioAuthorPreviewProviderV1";
import {
  StudioDocumentBlockEditorV1,
  type StudioDocumentEditorValueV1,
} from "./StudioDocumentBlockEditorV1";

export default function StudioDocumentAuthorRouteV1() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = localeFromPathname(location.pathname);
  const {
    draft,
    lastPreviewId,
    replaceDocumentContent,
    materializePreview,
  } = useStudioAuthorPreviewV1();
  const experiment = draft.experiments[0];
  const brief = experiment?.readerBriefs[0];
  const [editorValue, setEditorValue] =
    React.useState<StudioDocumentEditorValueV1>(
      () => editorValueFromDraftV1(draft),
    );
  const [editorBaseRevision, setEditorBaseRevision] = React.useState(
    draft.revision,
  );
  const [editorDirty, setEditorDirty] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setEditorValue(editorValueFromDraftV1(draft));
    setEditorBaseRevision(draft.revision);
    setEditorDirty(false);
  }, [draft.draftId]);

  const commitDocument = React.useCallback((
    value: StudioDocumentEditorValueV1 = editorValue,
  ) => {
    const normalized = normalizeEditorValueV1(value);
    if (
      normalized.title.length === 0
      || normalized.blocks.length === 0
      || normalized.blocks.some((block) =>
        block.kind !== "experiment-placement" && block.text.length === 0)
    ) {
      throw new Error(t("studioAuthorPreview.author.requiredFields"));
    }
    const next = replaceDocumentContent({
      expectedRevision: editorBaseRevision,
      title: normalized.title,
      blocks: normalized.blocks,
    });
    setEditorValue(editorValueFromDraftV1(next));
    setEditorBaseRevision(next.revision);
    setEditorDirty(false);
    setErrorMessage(null);
    return next;
  }, [
    editorBaseRevision,
    editorValue,
    replaceDocumentContent,
    t,
  ]);

  const requestCommit = React.useCallback((
    value: StudioDocumentEditorValueV1,
  ) => {
    try {
      commitDocument(value);
    } catch (error) {
      setErrorMessage(errorMessageV1(error));
    }
  }, [commitDocument]);

  const openReaderPreview = React.useCallback(() => {
    try {
      commitDocument();
      const manifest = materializePreview();
      navigate(readerPreviewHref(manifest.previewId, locale));
    } catch (error) {
      setErrorMessage(errorMessageV1(error));
    }
  }, [commitDocument, locale, materializePreview, navigate]);

  const openWorkbench = React.useCallback(() => {
    try {
      commitDocument();
    } catch {
      // Workbench navigation is never a validation gate. An invalid local
      // title remains uncommitted; the last valid session draft is retained.
    }
    navigate(workbenchHref(locale));
  }, [commitDocument, locale, navigate]);

  const returnHome = React.useCallback(() => {
    try {
      commitDocument();
    } catch {
      // Leaving the editor must remain possible while a field is being
      // rewritten. The last valid session draft stays available on return.
    }
    navigate(homeHref(locale));
  }, [commitDocument, locale, navigate]);

  const reopenLastPreview = React.useCallback(() => {
    if (lastPreviewId === null) return;
    try {
      // Preserve current author edits while intentionally reopening the older,
      // immutable preview materialization.
      commitDocument();
    } catch {
      // The immutable older Preview remains openable even while the current
      // editor buffer is temporarily invalid.
    }
    navigate(readerPreviewHref(lastPreviewId, locale));
  }, [commitDocument, lastPreviewId, locale, navigate]);

  return (
    <div
      className="h-full w-full overflow-y-auto bg-slate-950 text-slate-100"
      data-testid="studio-document-author-v1"
      data-draft-revision={draft.revision}
      data-editor-dirty={String(editorDirty)}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <header className="mb-8 flex flex-col gap-5 border-b border-slate-800 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={returnHome}
              className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("studioAuthorPreview.author.backHome")}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-sky-300">
                {t("studioAuthorPreview.author.badge")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                <LockKeyhole className="h-3.5 w-3.5" />
                {t("studioAuthorPreview.author.sessionOnly")}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("studioAuthorPreview.author.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              {t("studioAuthorPreview.author.description")}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <button
              type="button"
              onClick={openWorkbench}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm font-bold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 active:scale-[0.98]"
              data-testid="studio-author-open-workbench-v1"
            >
              <PanelsTopLeft className="h-4 w-4" />
              {t("studioAuthorPreview.author.openWorkbench")}
            </button>
            <button
              type="button"
              onClick={openReaderPreview}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-bold text-slate-950 shadow-lg shadow-sky-950/30 transition-transform duration-150 active:scale-[0.97] motion-reduce:transform-none"
            >
              <Eye className="h-4 w-4" />
              {t("studioAuthorPreview.author.openPreview")}
            </button>
            {lastPreviewId !== null && (
              <button
                type="button"
                onClick={reopenLastPreview}
                className="text-xs font-semibold text-sky-300 transition-colors hover:text-sky-200"
              >
                {t("studioAuthorPreview.author.reopenLastPreview")}
              </button>
            )}
          </div>
        </header>

        {errorMessage !== null && (
          <p
            role="alert"
            className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
          >
            {errorMessage}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/10 sm:p-7"
            aria-labelledby="studio-author-document-heading"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {t("studioAuthorPreview.author.documentLabel")}
                </p>
                <h2
                  id="studio-author-document-heading"
                  className="mt-1 text-lg font-bold"
                >
                  {t("studioAuthorPreview.author.documentHeading")}
                </h2>
              </div>
              <span className="font-mono text-xs text-slate-500">
                rev {draft.revision}
              </span>
            </div>

            <StudioDocumentBlockEditorV1
              value={editorValue}
              onChange={(value) => {
                setEditorValue(value);
                setEditorDirty(true);
                setErrorMessage(null);
              }}
              onCommitRequest={requestCommit}
            />
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-violet-400/10 p-2 text-violet-300">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-300">
                    Experiment
                  </p>
                  <h2 className="mt-1 text-base font-bold">
                    {t("studioAuthorPreview.author.experimentHeading")}
                  </h2>
                </div>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <AuthorFactV1
                  label={t("studioAuthorPreview.author.source")}
                  value={experiment?.scenarios[0]?.label ?? "—"}
                />
                <AuthorFactV1
                  label={t("studioAuthorPreview.author.extent")}
                  value={brief?.extent ?? "—"}
                />
                <AuthorFactV1
                  label={t("studioAuthorPreview.author.graph")}
                  value={brief?.graphPanes
                    .flatMap((pane) => pane.scenarios)
                    .flatMap((scenario) => scenario.items)
                    .map(({ label }) => label)
                    .join(" / ") ?? "—"}
                />
                <AuthorFactV1
                  label={t("studioAuthorPreview.author.control")}
                  value={brief?.controls[0]?.label ?? "—"}
                />
              </dl>
              <p className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2.5 text-xs leading-5 text-amber-100">
                {t("studioAuthorPreview.author.uncertifiedNotice")}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <h2 className="text-sm font-bold">
                {t("studioAuthorPreview.author.boundaryHeading")}
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {t("studioAuthorPreview.author.boundaryDescription")}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function AuthorFactV1({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 border-t border-slate-800 pt-3 first:border-t-0 first:pt-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-200">{value}</dd>
    </div>
  );
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function editorValueFromDraftV1(
  draft: StudioAuthorDraftV1,
): StudioDocumentEditorValueV1 {
  return {
    title: draft.document.title,
    blocks: draft.document.blocks,
  };
}

function normalizeEditorValueV1(
  value: StudioDocumentEditorValueV1,
): StudioDocumentEditorValueV1 {
  const blocks = value.blocks.map((block) =>
    block.kind === "experiment-placement"
      ? block
      : { ...block, text: block.text.trim() });
  return {
    title: value.title.trim(),
    // Empty text blocks are a transient authoring state, not document
    // content. Dropping them on commit lets authors clear and rewrite without
    // turning navigation into a validation trap.
    blocks: blocks.filter((block) =>
      block.kind === "experiment-placement" || block.text.length > 0),
  };
}
