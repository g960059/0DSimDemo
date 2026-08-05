import React from "react";
import { ArrowLeft, Home, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import {
  defaultArticleBriefingV3,
} from "@/components/article/ArticleEditorStateV3";
import {
  ArticleReaderExperimentV3,
} from "@/components/article/reader/ArticleReaderExperimentV3";
import {
  homeHref,
  experimentsHref,
  newExperimentHref,
} from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import {
  loadStudioDefaultClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  type ArticleExperimentSnapshotV2,
  type ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import {
  StudioBrowserContentStoreV3,
} from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";

export function ExperimentSnapshotV3Page() {
  const location = useLocation();
  const { snapshotId } = useParams();
  return (
    <ExperimentSnapshotV3Resource
      key={snapshotId ?? "missing-snapshot"}
      pathname={location.pathname}
      snapshotId={snapshotId}
    />
  );
}

function ExperimentSnapshotV3Resource({
  pathname,
  snapshotId,
}: Readonly<{
  pathname: string;
  snapshotId: string | undefined;
}>) {
  const { t } = useTranslation();
  const locale = localeFromPathname(pathname);
  const navigate = useNavigate();
  const store = React.useMemo(() => new StudioBrowserContentStoreV3(), []);
  const [snapshot] = React.useState<ExperimentSnapshotV2 | null>(() => {
    if (snapshotId === undefined) return null;
    try {
      return store.readSnapshot(snapshotId);
    } catch {
      return null;
    }
  });
  const readerSnapshot = React.useMemo<ArticleExperimentSnapshotV2 | null>(() => {
    if (snapshot === null) return null;
    if (snapshot.kind === "article") return snapshot;
    return Object.freeze({
      schemaId: snapshot.schemaId,
      snapshotId: snapshot.snapshotId,
      kind: "article" as const,
      content: snapshot.content,
      briefing: defaultArticleBriefingV3(snapshot),
      createdAt: snapshot.createdAt,
      ...(snapshot.createdBy === undefined
        ? {}
        : { createdBy: snapshot.createdBy }),
    });
  }, [snapshot]);
  const [contract, setContract] = React.useState<ModelContractV2 | null>(null);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    let current = true;
    void loadStudioDefaultClientCompositionV2().then((composition) => {
      if (
        current
        && snapshot !== null
        && composition.contract.modelId === snapshot.content.modelId
      ) {
        setContract(composition.contract);
      }
    }).catch(() => {
      // The immutable Snapshot stays readable when its exact release is not
      // present in this pre-release client catalog; live controls stay closed.
    });
    return () => {
      current = false;
    };
  }, [snapshot]);

  return (
    <div className="h-full overflow-y-auto bg-wb-panel text-wb-text" data-testid="experiment-snapshot-v3">
      <header className="sticky top-0 z-40 flex h-12 items-center gap-2 bg-wb-panel/95 px-3 shadow-[inset_0_-1px_0_var(--wb-border)] backdrop-blur-md sm:px-5">
        <Link
          to={homeHref(locale)}
          aria-label={t("nav.home")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          to={experimentsHref(locale)}
          aria-label={t("nav.workbench")}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("nav.workbench")}</span>
        </Link>
        <span className="min-w-0 flex-1 truncate text-center font-mono text-[10px] text-wb-subtle">
          {snapshot?.snapshotId ?? ""}
        </span>
        {snapshot !== null && (
          <button
            type="button"
            aria-label={t("snapshotReader.editInWorkbench")}
            onClick={() => {
              navigate(`${newExperimentHref(locale)}?snapshotId=${
                encodeURIComponent(snapshot.snapshotId)
              }`);
            }}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">
              {t("snapshotReader.editInWorkbench")}
            </span>
          </button>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1080px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        {snapshot === null ? (
          <div className="py-20 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{t("snapshotReader.missingTitle")}</h1>
            <p className="mt-3 text-sm text-wb-muted">{t("snapshotReader.missingDescription")}</p>
          </div>
        ) : (
          <>
            <header className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-wb-accent">
                {t("snapshotReader.eyebrow")}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
                {snapshot.content.scenarios[0]?.label ?? snapshot.snapshotId}
              </h1>
              {snapshot.content.surface.note.text.length > 0 && (
                <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-wb-muted">
                  {snapshot.content.surface.note.text}
                </p>
              )}
            </header>
            {readerSnapshot !== null && <ArticleReaderExperimentV3
              block={Object.freeze({
                blockId: `snapshot-view-${snapshot.snapshotId}`,
                kind: "experiment",
                placement: Object.freeze({
                  schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
                  placementId: `snapshot-view-${snapshot.snapshotId}`,
                  snapshotId: snapshot.snapshotId,
                  titleOverride: null,
                  caption: null,
                }),
              })}
              snapshot={readerSnapshot}
              contract={contract}
              live
              expandedPresentation={expanded ? "fullscreen" : null}
              forceInline
              onActivate={() => undefined}
              onDeactivate={() => undefined}
              onExpand={() => setExpanded(true)}
              onClose={() => setExpanded(false)}
            />}
          </>
        )}
      </main>
    </div>
  );
}

export default ExperimentSnapshotV3Page;
