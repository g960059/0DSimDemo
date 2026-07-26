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
import { useWorkbenchTheme } from "@/features/workbench/hooks/useWorkbenchTheme";

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
  const { workbenchTheme } = useWorkbenchTheme();

  // The page is the manifest; a numerical session belongs to each placement
  // and opens as the reader reaches it, so nothing here waits on a Worker.
  const manifest = React.useMemo(
    () => resolvePreview(previewId),
    [previewId, resolvePreview],
  );
  const scrollRootRef = React.useRef<HTMLDivElement | null>(null);
  const runtimeForPlacement = useStudioReaderPlacementRuntimesV1({
    previewId: manifest === null ? null : previewId,
    placements: manifest?.resolvedReaderDocument.placements
      ?? NO_PLACEMENTS_V1,
    autoLive: true,
    rootRef: scrollRootRef,
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
      className="workbench-root flex h-full w-full flex-col overflow-hidden bg-wb-app font-sans text-wb-text"
      data-workbench-theme={workbenchTheme}
      data-testid="studio-reader-preview-v1"
      data-preview-id={previewId}
      data-preview-trust={manifest.trust}
      data-preview-share-policy={manifest.sharePolicy}
      data-publication-manifest-ref="null"
    >
      <header className="z-20 flex min-h-14 shrink-0 items-center gap-3 border-b border-wb-warning/30 bg-wb-header px-3 text-wb-text sm:px-5">
        <Link
          to={authorPreviewHref(locale)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t("studioAuthorPreview.reader.backToEdit")}
          </span>
        </Link>
        <div className="h-5 w-px bg-wb-line" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Eye className="h-4 w-4 shrink-0 text-wb-warning" />
          <strong className="truncate text-sm">
            {t("studioAuthorPreview.reader.previewBanner")}
          </strong>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-wb-warning/25 bg-wb-warning-soft px-2.5 py-1 text-[11px] font-bold text-wb-warning">
          <LockKeyhole className="h-3.5 w-3.5" />
          {t("studioAuthorPreview.reader.unpublishedBadge")}
        </span>
      </header>
      <div
        ref={scrollRootRef}
        data-studio-scrollport="true"
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="border-b border-wb-warning/25 bg-wb-warning-soft px-4 py-2.5 text-center text-xs leading-5 text-wb-warning">
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
      className="workbench-root flex h-full w-full items-center justify-center bg-wb-app p-6 font-sans text-wb-text"
      data-testid={
        failed
          ? "studio-reader-preview-unavailable-v1"
          : "studio-reader-preview-loading-v1"
      }
    >
      <section className="w-full max-w-lg rounded-2xl border border-wb-line bg-wb-panel p-7 text-center shadow-2xl">
        {failed ? (
          <AlertTriangle className="mx-auto h-8 w-8 text-wb-warning" />
        ) : (
          <span
            className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-wb-line border-t-wb-accent motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        <h1 className="mt-5 text-xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-wb-muted">{message}</p>
        {failed && (
          <Link
            to={authorPreviewHref(locale)}
            className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-wb-primary px-4 text-sm font-bold text-white transition-transform duration-150 active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("studioAuthorPreview.reader.backToEdit")}
          </Link>
        )}
      </section>
    </main>
  );
}
