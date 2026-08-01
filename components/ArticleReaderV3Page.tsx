import React from "react";
import {
  ArrowLeft,
  Home,
  PencilLine,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";

import { ModelLimitations } from "@/components/ModelLimitations";
import {
  ArticleReaderExperimentV3,
  articleReaderPlacementAfterCenterExitV3,
} from "@/components/article/reader/ArticleReaderExperimentV3";
import {
  articleEditorHref,
  articlesHref,
  experimentSnapshotHref,
  homeHref,
} from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import {
  loadStudioDefaultClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import type {
  StudioArticleDraftV2,
} from "@/studio/contracts/v2/article";
import type {
  ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import {
  StudioBrowserContentStoreV3,
} from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";

type ArticleReaderContentStateV3 =
  | Readonly<{
      kind: "ready";
      article: StudioArticleDraftV2;
      snapshots: ReadonlyMap<string, ExperimentSnapshotV2>;
    }>
  | Readonly<{ kind: "missing" }>
  | Readonly<{ kind: "error"; message: string }>;

type ArticleReaderContractStateV3 =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; contract: ModelContractV2 }>
  | Readonly<{ kind: "unavailable"; message: string }>;

export function ArticleReaderV3Page() {
  const location = useLocation();
  const { articleId } = useParams();
  return (
    <ArticleReaderV3Resource
      key={articleId ?? "missing-article"}
      articleId={articleId}
      hash={location.hash}
      pathname={location.pathname}
    />
  );
}

function ArticleReaderV3Resource({
  articleId,
  hash,
  pathname,
}: Readonly<{
  articleId: string | undefined;
  hash: string;
  pathname: string;
}>) {
  const { t } = useTranslation();
  const locale = localeFromPathname(pathname);
  const store = React.useMemo(() => new StudioBrowserContentStoreV3(), []);
  const [content] = React.useState<ArticleReaderContentStateV3>(() => {
    if (articleId === undefined) return { kind: "missing" };
    try {
      const article = store.readArticle(articleId);
      if (article === null) return { kind: "missing" };
      return {
        kind: "ready",
        article,
        snapshots: new Map(store.listSnapshots().map((snapshot) => [
          snapshot.snapshotId,
          snapshot,
        ])),
      };
    } catch (error) {
      return {
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  });
  const [contractState, setContractState] =
    React.useState<ArticleReaderContractStateV3>({ kind: "loading" });
  const [activePlacementId, setActivePlacementId] = React.useState<string | null>(
    null,
  );
  const [expandedPlacementId, setExpandedPlacementId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let current = true;
    void loadStudioDefaultClientCompositionV2().then(({ contract }) => {
      if (current) setContractState({ kind: "ready", contract });
    }).catch((error) => {
      if (current) {
        setContractState({
          kind: "unavailable",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
    return () => {
      current = false;
    };
  }, []);

  React.useEffect(() => {
    if (content.kind !== "ready" || !hash.startsWith("#placement-")) return;
    let fragment: string;
    try {
      fragment = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }
    const placementId = fragment.slice("placement-".length);
    if (!content.article.blocks.some((block) =>
      block.kind === "experiment"
      && block.placement.placementId === placementId)) return;
    setActivePlacementId(placementId);
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(fragment)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [content, hash]);

  if (content.kind !== "ready") {
    return (
      <div className="h-full overflow-y-auto bg-wb-panel text-wb-text">
        <ReaderHeaderV3 locale={locale} />
        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("articleReader.missingTitle")}
          </h1>
          <p className={`mt-3 text-sm leading-7 ${content.kind === "error" ? "text-wb-danger" : "text-wb-muted"}`}>
            {content.kind === "error"
              ? content.message
              : t("articleReader.missingDescription")}
          </p>
        </main>
      </div>
    );
  }

  const exactContract = contractState.kind === "ready"
    ? contractState.contract
    : null;

  return (
    <div
      className="h-full overflow-y-auto bg-wb-panel text-wb-text"
      data-testid="article-reader-v3"
    >
      <ReaderHeaderV3
        articleId={content.article.articleId}
        articleTitle={content.article.title}
        locale={locale}
      />

      <main className="mx-auto w-full max-w-[920px] px-5 pb-28 pt-12 sm:px-8 sm:pt-16">
        <article>
          <header className="mb-12 sm:mb-16">
            <h1 className="text-[clamp(2rem,5vw,3.35rem)] font-bold leading-[1.14] tracking-[-0.035em] text-wb-text">
              {content.article.title || t("articleReader.untitled")}
            </h1>
          </header>

          {content.article.blocks.length === 0 && (
            <p className="py-16 text-sm text-wb-muted">{t("articleReader.empty")}</p>
          )}

          {content.article.blocks.map((block) => {
            if (block.kind === "heading") {
              const Heading = block.level === 2 ? "h2" : "h3";
              return (
                <Heading
                  key={block.blockId}
                  className={block.level === 2
                    ? "mb-5 mt-14 text-2xl font-bold leading-tight tracking-[-0.02em] sm:text-3xl"
                    : "mb-4 mt-10 text-xl font-bold leading-tight tracking-[-0.015em]"}
                >
                  {block.text}
                </Heading>
              );
            }
            if (block.kind === "paragraph") {
              return (
                <p
                  key={block.blockId}
                  className="my-6 whitespace-pre-wrap text-[15px] leading-8 text-wb-text sm:text-base sm:leading-8"
                >
                  {block.text}
                </p>
              );
            }
            const snapshot = content.snapshots.get(block.placement.snapshotId) ?? null;
            const modelMatches = snapshot !== null
              && exactContract?.modelId === snapshot.content.modelId;
            const isLive = expandedPlacementId === null
              ? activePlacementId === block.placement.placementId
              : expandedPlacementId === block.placement.placementId;
            return (
              <ArticleReaderExperimentV3
                key={block.blockId}
                block={block}
                snapshot={snapshot}
                contract={modelMatches ? exactContract : null}
                live={isLive}
                expanded={expandedPlacementId === block.placement.placementId}
                {...(snapshot === null ? {} : {
                  snapshotHref: experimentSnapshotHref({
                    experimentId: snapshot.experimentId,
                    locale,
                    snapshotId: snapshot.snapshotId,
                  }),
                })}
                onActivate={() => setActivePlacementId(block.placement.placementId)}
                onDeactivate={() => setActivePlacementId((current) =>
                  articleReaderPlacementAfterCenterExitV3(
                    current,
                    block.placement.placementId,
                  ))}
                onExpand={() => {
                  setActivePlacementId(block.placement.placementId);
                  setExpandedPlacementId(block.placement.placementId);
                }}
                onClose={() => setExpandedPlacementId(null)}
              />
            );
          })}

          {contractState.kind === "unavailable" && (
            <p className="mt-10 text-xs text-wb-danger" role="alert">
              {contractState.message}
            </p>
          )}
        </article>
      </main>
    </div>
  );
}

function ReaderHeaderV3({
  articleId,
  articleTitle,
  locale,
}: Readonly<{
  articleId?: string;
  articleTitle?: string;
  locale: "en" | "ja";
}>) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-2 bg-wb-panel/95 px-3 shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--wb-border)_55%,transparent)] backdrop-blur-md sm:px-5">
      <Link
        to={homeHref(locale)}
        aria-label={t("nav.home")}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
      </Link>
      <Link
        to={articlesHref(locale)}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{t("articleReader.backToArticles")}</span>
      </Link>
      <span className="min-w-0 flex-1 truncate text-center text-[11px] font-medium text-wb-muted">
        {articleTitle ?? ""}
      </span>
      <ModelLimitations />
      {articleId !== undefined && (
        <Link
          to={articleEditorHref({ articleId, locale })}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          aria-label={t("articleReader.edit")}
          title={t("articleReader.edit")}
        >
          <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </header>
  );
}

export default ArticleReaderV3Page;
