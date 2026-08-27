import React from "react";
import { ArrowLeft, Home, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import {
  defaultArticleBriefingV3,
} from "@/studio/application/article/ArticleExperimentPlacementV3";
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
  loadStudioSnapshotClientCompositionV2,
  type StudioClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  type ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import {
  BrowserContentStore,
} from "@/studio/infrastructure/browser/BrowserContentStore";
import {
  createStudioSupabaseContentRepositoryV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";

export function ExperimentSnapshotPage() {
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
  const store = React.useMemo(() => new BrowserContentStore(), []);
  const remoteRepository = React.useMemo(
    createStudioSupabaseContentRepositoryV1,
    [],
  );
  const [snapshot, setSnapshot] = React.useState<
    ExperimentSnapshotV2 | null | undefined
  >(() => {
    if (remoteRepository !== null) return undefined;
    if (snapshotId === undefined) return null;
    try {
      return store.readSnapshot(snapshotId);
    } catch {
      return null;
    }
  });
  const briefing = React.useMemo(() =>
    snapshot === null || snapshot === undefined
      ? null
      : defaultArticleBriefingV3(snapshot), [snapshot]);
  const [composition, setComposition] =
    React.useState<StudioClientCompositionV2 | null>(null);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    if (remoteRepository === null) return undefined;
    let current = true;
    if (snapshotId === undefined) {
      setSnapshot(null);
      return undefined;
    }
    void remoteRepository.readSnapshot(snapshotId).then((next) => {
      if (current) setSnapshot(next);
    }).catch(() => {
      if (current) setSnapshot(null);
    });
    return () => {
      current = false;
    };
  }, [remoteRepository, snapshotId]);

  React.useEffect(() => {
    let current = true;
    if (snapshot === null || snapshot === undefined) {
      setComposition(null);
      return undefined;
    }
    void loadStudioSnapshotClientCompositionV2(
      snapshot.content.modelId,
      snapshot.content.surfaceSeriesId,
      snapshot.surfaceReleaseId,
    ).then((next) => {
      if (current) setComposition(next);
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
        <span className="min-w-0 flex-1 truncate text-center text-xs text-wb-muted">
          {snapshot?.content.scenarios[0]?.label ?? ""}
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
        {snapshot === undefined ? (
          <div className="py-20 text-center text-sm text-wb-muted" role="status">
            {t("snapshotReader.loading")}
          </div>
        ) : snapshot === null ? (
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
            {briefing !== null && <ArticleReaderExperimentV3
              block={Object.freeze({
                blockId: `snapshot-view-${snapshot.snapshotId}`,
                kind: "experiment",
                placement: Object.freeze({
                  schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
                  placementId: `snapshot-view-${snapshot.snapshotId}`,
                  snapshotId: snapshot.snapshotId,
                  briefing,
                  titleOverride: null,
                  caption: null,
                }),
              })}
              snapshot={snapshot}
              contract={composition?.modelSurface.contract ?? null}
              runtimeComposition={composition}
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

export default ExperimentSnapshotPage;
