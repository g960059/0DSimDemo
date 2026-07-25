import * as React from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  LockKeyhole,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";

import {
  authorPreviewHref,
} from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";

import {
  useStudioAuthorPreviewV1,
} from "../StudioAuthorPreviewProviderV1";
import {
  useStudioReaderPlacementRuntimesV1,
} from "../StudioReaderPlacementRuntimesV1";
import { StudioDocumentReaderV1 } from "./StudioDocumentReaderV1";

const NO_PLACEMENTS_V1 = Object.freeze([]);

export default function StudioReaderPreviewRouteV1() {
  const { t } = useTranslation();
  const { previewId = "" } = useParams<{ previewId: string }>();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const { resolvePreview } = useStudioAuthorPreviewV1();

  // The page is the manifest; a numerical session belongs to each placement
  // and opens as the reader reaches it, so nothing here waits on a Worker.
  const manifest = React.useMemo(
    () => resolvePreview(previewId),
    [previewId, resolvePreview],
  );
  const runtimeForPlacement = useStudioReaderPlacementRuntimesV1({
    previewId: manifest === null ? null : previewId,
    placements: manifest?.resolvedReaderDocument.placements
      ?? NO_PLACEMENTS_V1,
    autoLive: true,
  });

  if (manifest === null) {
    return (
      <StudioReaderPreviewStatusV1
        title={t("studioAuthorPreview.reader.expired")}
        message={t("studioAuthorPreview.reader.expiredDescription")}
        failed
      />
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-slate-100 text-slate-900"
      data-testid="studio-reader-preview-v1"
      data-preview-id={previewId}
      data-preview-trust={manifest.trust}
      data-preview-share-policy={manifest.sharePolicy}
      data-publication-manifest-ref="null"
    >
      <header className="z-20 flex min-h-14 shrink-0 items-center gap-3 border-b border-amber-300/30 bg-slate-950 px-3 text-slate-100 shadow-lg shadow-slate-950/10 sm:px-5">
        <Link
          to={authorPreviewHref(locale)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t("studioAuthorPreview.reader.backToEdit")}
          </span>
        </Link>
        <div className="h-5 w-px bg-slate-800" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Eye className="h-4 w-4 shrink-0 text-amber-300" />
          <strong className="truncate text-sm">
            {t("studioAuthorPreview.reader.previewBanner")}
          </strong>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[11px] font-bold text-amber-100">
          <LockKeyhole className="h-3.5 w-3.5" />
          {t("studioAuthorPreview.reader.unpublishedBadge")}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs leading-5 text-amber-900">
          {t("studioAuthorPreview.reader.sessionNotice")}
        </div>
        <StudioDocumentReaderV1
          document={manifest.resolvedReaderDocument}
          runtimeForPlacement={runtimeForPlacement}
        />
      </div>
    </div>
  );
}

function StudioReaderPreviewStatusV1({
  title,
  message,
  failed = false,
}: Readonly<{
  title: string;
  message: string;
  failed?: boolean;
}>) {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  return (
    <main
      className="flex h-full w-full items-center justify-center bg-slate-950 p-6 text-slate-100"
      data-testid={
        failed
          ? "studio-reader-preview-unavailable-v1"
          : "studio-reader-preview-loading-v1"
      }
    >
      <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-7 text-center shadow-2xl">
        {failed ? (
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-300" />
        ) : (
          <span
            className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-sky-300 motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        <h1 className="mt-5 text-xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>
        {failed && (
          <Link
            to={authorPreviewHref(locale)}
            className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 text-sm font-bold text-slate-950 transition-transform duration-150 active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("studioAuthorPreview.reader.backToEdit")}
          </Link>
        )}
      </section>
    </main>
  );
}
