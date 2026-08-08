import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArticleReaderExperimentV3,
  articleReaderPlacementAfterCenterExitV3,
  type ArticleReaderExpandedPresentationV3,
} from "@/components/article/reader/ArticleReaderExperimentV3";
import {
  newExperimentHref,
} from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import {
  loadStudioSnapshotClientCompositionV2,
  type StudioClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import type {
  StudioArticleDraftV2,
} from "@/studio/contracts/v2/article";
import type {
  ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import {
  StudioBrowserContentStoreV3,
} from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";
import {
  createStudioSupabaseContentRepositoryV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
import {
  createExperimentSessionTokenV3,
  StudioExperimentSessionHandoffStoreV3,
} from "@/studio/infrastructure/browser/StudioExperimentSessionHandoffV3";

type ArticleReaderContentStateV3 =
  | Readonly<{ kind: "loading" }>
  | Readonly<{
      kind: "ready";
      article: StudioArticleDraftV2;
      snapshots: ReadonlyMap<string, ExperimentSnapshotV2>;
    }>
  | Readonly<{ kind: "missing" }>
  | Readonly<{ kind: "error"; message: string }>;

type ArticleReaderContractStateV3 =
  | Readonly<{ kind: "loading" }>
  | Readonly<{
      kind: "ready";
      compositionBySnapshotId: ReadonlyMap<string, StudioClientCompositionV2>;
      errors: readonly string[];
    }>;

type ArticleReaderExpandedPlacementV3 = Readonly<{
  placementId: string;
  presentation: ArticleReaderExpandedPresentationV3;
}>;

const ARTICLE_READER_PEEK_FRACTION_STORAGE_KEY_V3 =
  "circleheart.article-reader.peek-fraction.v3";
const ARTICLE_READER_PEEK_DEFAULT_FRACTION_V3 = 0.46;
const ARTICLE_READER_PEEK_MIN_FRACTION_V3 = 0.3;
const ARTICLE_READER_PEEK_MAX_FRACTION_V3 = 0.64;

export function clampArticleReaderPeekFractionV3(value: number): number {
  if (!Number.isFinite(value)) return ARTICLE_READER_PEEK_DEFAULT_FRACTION_V3;
  return Math.min(
    ARTICLE_READER_PEEK_MAX_FRACTION_V3,
    Math.max(ARTICLE_READER_PEEK_MIN_FRACTION_V3, value),
  );
}

export function articleReaderPeekFractionForPointerV3(
  shellLeft: number,
  shellWidth: number,
  pointerClientX: number,
): number {
  if (!Number.isFinite(shellWidth) || shellWidth <= 0) {
    return ARTICLE_READER_PEEK_DEFAULT_FRACTION_V3;
  }
  return clampArticleReaderPeekFractionV3(
    (shellLeft + shellWidth - pointerClientX) / shellWidth,
  );
}

function initialArticleReaderPeekFractionV3(): number {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return ARTICLE_READER_PEEK_DEFAULT_FRACTION_V3;
  }
  try {
    const raw = window.localStorage.getItem(
      ARTICLE_READER_PEEK_FRACTION_STORAGE_KEY_V3,
    );
    return raw === null
      ? ARTICLE_READER_PEEK_DEFAULT_FRACTION_V3
      : clampArticleReaderPeekFractionV3(Number(raw));
  } catch {
    return ARTICLE_READER_PEEK_DEFAULT_FRACTION_V3;
  }
}

export function ArticleReaderV3Page() {
  const location = useLocation();
  const { articleId } = useParams();
  return (
    <ArticleReaderV3Resource
      key={articleId ?? "missing-article"}
      articleId={articleId}
      hash={location.hash}
      pathname={location.pathname}
      search={location.search}
    />
  );
}

function ArticleReaderV3Resource({
  articleId,
  hash,
  pathname,
  search,
}: Readonly<{
  articleId: string | undefined;
  hash: string;
  pathname: string;
  search: string;
}>) {
  const { t } = useTranslation();
  const locale = localeFromPathname(pathname);
  const navigate = useNavigate();
  const store = React.useMemo(() => new StudioBrowserContentStoreV3(), []);
  const remoteRepository = React.useMemo(
    createStudioSupabaseContentRepositoryV1,
    [],
  );
  const experimentSessionHandoff = React.useMemo(
    () => new StudioExperimentSessionHandoffStoreV3(),
    [],
  );
  const [content, setContent] = React.useState<ArticleReaderContentStateV3>({
    kind: "loading",
  });
  const [contractState, setContractState] =
    React.useState<ArticleReaderContractStateV3>({ kind: "loading" });
  const [activePlacementId, setActivePlacementId] = React.useState<string | null>(
    null,
  );
  const [expandedPlacement, setExpandedPlacement] =
    React.useState<ArticleReaderExpandedPlacementV3 | null>(null);
  const [peekOpen, setPeekOpen] = React.useState(false);
  const [peekPortalHost, setPeekPortalHost] =
    React.useState<HTMLDivElement | null>(null);
  const [peekFraction, setPeekFraction] = React.useState(
    initialArticleReaderPeekFractionV3,
  );
  const [peekDragging, setPeekDragging] = React.useState(false);
  const splitRef = React.useRef<HTMLDivElement>(null);
  const peekCloseTimerRef = React.useRef<number | null>(null);
  const peekResizeFrameRef = React.useRef<number | null>(null);
  const peekDraggingRef = React.useRef(false);
  const pendingPeekFractionRef = React.useRef(peekFraction);
  React.useEffect(() => {
    let current = true;
    const load = async () => {
      if (articleId === undefined) {
        setContent({ kind: "missing" });
        return;
      }
      const article = remoteRepository === null
        ? store.readArticle(articleId)
        : await remoteRepository.readArticle(articleId);
      if (!current) return;
      if (article === null) {
        setContent({ kind: "missing" });
        return;
      }
      const snapshotIds = Object.freeze(article.blocks.flatMap((block) =>
        block.kind === "experiment" ? [block.placement.snapshotId] : []));
      const snapshots = remoteRepository === null
        ? store.listSnapshots().filter(({ snapshotId }) =>
            snapshotIds.includes(snapshotId))
        : (await Promise.all(snapshotIds.map((snapshotId) =>
            remoteRepository.readSnapshot(snapshotId))))
            .filter((snapshot): snapshot is ExperimentSnapshotV2 =>
              snapshot !== null);
      if (current) {
        setContent({
          kind: "ready",
          article,
          snapshots: new Map(snapshots.map((snapshot) => [
            snapshot.snapshotId,
            snapshot,
          ])),
        });
      }
    };
    void load().catch((error) => {
      if (current) {
        setContent({
          kind: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
    return () => {
      current = false;
    };
  }, [articleId, remoteRepository, store]);
  const openExperimentSessionV3 = React.useCallback((snapshotId: string) => {
    const sessionToken = createExperimentSessionTokenV3();
    experimentSessionHandoff.begin({
      sessionToken,
      snapshotId,
      returnHref: `${pathname}${search}${hash}`,
    });
    const query = new URLSearchParams({ sessionToken, snapshotId });
    navigate(`${newExperimentHref(locale)}?${query.toString()}`);
  }, [experimentSessionHandoff, hash, locale, navigate, pathname, search]);

  const cancelPeekCloseTimer = React.useCallback(() => {
    if (peekCloseTimerRef.current === null) return;
    window.clearTimeout(peekCloseTimerRef.current);
    peekCloseTimerRef.current = null;
  }, []);

  const persistPeekFraction = React.useCallback((fraction: number) => {
    try {
      window.localStorage.setItem(
        ARTICLE_READER_PEEK_FRACTION_STORAGE_KEY_V3,
        String(clampArticleReaderPeekFractionV3(fraction)),
      );
    } catch {
      // Reader geometry is optional device-local preference only.
    }
  }, []);

  const openExpandedPlacement = React.useCallback((
    placementId: string,
    presentation: ArticleReaderExpandedPresentationV3,
  ) => {
    cancelPeekCloseTimer();
    setExpandedPlacement(Object.freeze({ placementId, presentation }));
    if (presentation !== "peek") setPeekOpen(false);
  }, [cancelPeekCloseTimer]);

  const finishPeekClose = React.useCallback(() => {
    if (peekOpen) return;
    cancelPeekCloseTimer();
    setExpandedPlacement((current) =>
      current?.presentation === "peek" ? null : current);
  }, [cancelPeekCloseTimer, peekOpen]);

  const closeExpandedPlacement = React.useCallback(() => {
    if (expandedPlacement?.presentation !== "peek") {
      setExpandedPlacement(null);
      return;
    }
    setPeekOpen(false);
    cancelPeekCloseTimer();
    peekCloseTimerRef.current = window.setTimeout(() => {
      peekCloseTimerRef.current = null;
      setExpandedPlacement((current) =>
        current?.presentation === "peek" ? null : current);
    }, 260);
  }, [cancelPeekCloseTimer, expandedPlacement?.presentation]);

  React.useEffect(() => {
    if (expandedPlacement?.presentation !== "peek") return undefined;
    const frame = window.requestAnimationFrame(() => setPeekOpen(true));
    return () => window.cancelAnimationFrame(frame);
  }, [expandedPlacement]);

  React.useEffect(() => () => {
    cancelPeekCloseTimer();
    if (peekResizeFrameRef.current !== null) {
      window.cancelAnimationFrame(peekResizeFrameRef.current);
    }
  }, [cancelPeekCloseTimer]);

  const resizePeekFromPointer = React.useCallback((clientX: number) => {
    const bounds = splitRef.current?.getBoundingClientRect();
    if (bounds === undefined) return;
    pendingPeekFractionRef.current = articleReaderPeekFractionForPointerV3(
      bounds.left,
      bounds.width,
      clientX,
    );
    if (peekResizeFrameRef.current !== null) return;
    peekResizeFrameRef.current = window.requestAnimationFrame(() => {
      peekResizeFrameRef.current = null;
      setPeekFraction(pendingPeekFractionRef.current);
    });
  }, []);

  React.useEffect(() => {
    if (content.kind !== "ready") return undefined;
    let current = true;
    const snapshots = [...content.snapshots.values()];
    setContractState({ kind: "loading" });
    void Promise.allSettled(snapshots.map(async (snapshot) => Object.freeze({
      snapshotId: snapshot.snapshotId,
      composition: await loadStudioSnapshotClientCompositionV2(
        snapshot.content.modelId,
        snapshot.content.surfaceSeriesId,
        snapshot.surfaceReleaseId,
      ),
    }))).then((results) => {
      if (!current) return;
      const compositions = new Map<string, StudioClientCompositionV2>();
      const errors: string[] = [];
      for (const result of results) {
        if (result.status === "fulfilled") {
          compositions.set(result.value.snapshotId, result.value.composition);
        } else {
          errors.push(
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason),
          );
        }
      }
      setContractState({
        kind: "ready",
        compositionBySnapshotId: compositions,
        errors: Object.freeze(errors),
      });
    });
    return () => {
      current = false;
    };
  }, [content]);

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
        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {content.kind === "loading"
              ? t("articleReader.loading")
              : t("articleReader.missingTitle")}
          </h1>
          <p className={`mt-3 text-sm leading-7 ${content.kind === "error" ? "text-wb-danger" : "text-wb-muted"}`}>
            {content.kind === "loading"
              ? ""
              : content.kind === "error"
                ? content.message
                : t("articleReader.missingDescription")}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-wb-panel text-wb-text"
      data-testid="article-reader-v3"
    >
      <div
        ref={splitRef}
        className="article-reader-split relative flex min-h-0 flex-1 overflow-hidden"
        data-peek-mounted={
          expandedPlacement?.presentation === "peek" ? "true" : "false"
        }
        data-peek-open={peekOpen ? "true" : "false"}
        data-peek-dragging={peekDragging ? "true" : "false"}
        style={{
          "--article-reader-peek-width": `${peekFraction * 100}%`,
        } as React.CSSProperties}
      >
        <div
          className="article-reader-article-pane min-w-0 flex-1 overflow-y-auto overscroll-contain"
          data-testid="article-reader-article-pane-v3"
        >
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
            const runtimeComposition = snapshot === null
              || contractState.kind !== "ready"
              ? null
              : contractState.compositionBySnapshotId.get(
                  snapshot.snapshotId,
                ) ?? null;
            const isLive = expandedPlacement === null
              ? activePlacementId === block.placement.placementId
              : expandedPlacement.placementId === block.placement.placementId;
            const expandedPresentation =
              expandedPlacement?.placementId === block.placement.placementId
                ? expandedPlacement.presentation
                : null;
            return (
              <ArticleReaderExperimentV3
                key={block.blockId}
                block={block}
                snapshot={snapshot}
                contract={runtimeComposition?.contract ?? null}
                runtimeComposition={runtimeComposition}
                live={isLive}
                expandedPresentation={expandedPresentation}
                peekPortalHost={peekPortalHost}
                onActivate={() => setActivePlacementId(block.placement.placementId)}
                onDeactivate={() => setActivePlacementId((current) =>
                  articleReaderPlacementAfterCenterExitV3(
                    current,
                    block.placement.placementId,
                  ))}
                onExpand={(presentation) => {
                  if (presentation === "fullscreen") {
                    openExperimentSessionV3(block.placement.snapshotId);
                    return;
                  }
                  setActivePlacementId(block.placement.placementId);
                  openExpandedPlacement(
                    block.placement.placementId,
                    presentation,
                  );
                }}
                onClose={closeExpandedPlacement}
              />
            );
          })}

          {contractState.kind === "ready" && contractState.errors.length > 0 && (
            <p className="mt-10 text-xs text-wb-danger" role="alert">
              {contractState.errors.join(" ")}
            </p>
          )}
            </article>
          </main>
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t("articleReader.resizeExperiment")}
          aria-valuemin={Math.round(ARTICLE_READER_PEEK_MIN_FRACTION_V3 * 100)}
          aria-valuemax={Math.round(ARTICLE_READER_PEEK_MAX_FRACTION_V3 * 100)}
          aria-valuenow={Math.round(peekFraction * 100)}
          aria-valuetext={t("articleReader.experimentWidth", {
            percent: Math.round(peekFraction * 100),
          })}
          tabIndex={peekOpen ? 0 : -1}
          className="article-reader-peek-divider group relative z-10 shrink-0 touch-none outline-none"
          data-testid="article-reader-peek-divider-v3"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            peekDraggingRef.current = true;
            setPeekDragging(true);
            resizePeekFromPointer(event.clientX);
          }}
          onPointerMove={(event) => {
            if (!peekDraggingRef.current) return;
            resizePeekFromPointer(event.clientX);
          }}
          onPointerUp={(event) => {
            if (!peekDraggingRef.current) return;
            resizePeekFromPointer(event.clientX);
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            const next = pendingPeekFractionRef.current;
            setPeekFraction(next);
            persistPeekFraction(next);
            peekDraggingRef.current = false;
            setPeekDragging(false);
          }}
          onPointerCancel={() => {
            peekDraggingRef.current = false;
            setPeekDragging(false);
          }}
          onKeyDown={(event) => {
            let next: number | null = null;
            if (event.key === "ArrowLeft") next = peekFraction + 0.025;
            else if (event.key === "ArrowRight") next = peekFraction - 0.025;
            else if (event.key === "Home") {
              next = ARTICLE_READER_PEEK_MIN_FRACTION_V3;
            } else if (event.key === "End") {
              next = ARTICLE_READER_PEEK_MAX_FRACTION_V3;
            }
            if (next === null) return;
            event.preventDefault();
            const clamped = clampArticleReaderPeekFractionV3(next);
            pendingPeekFractionRef.current = clamped;
            setPeekFraction(clamped);
            persistPeekFraction(clamped);
          }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-wb-line transition-[width,background-color] duration-150 group-hover:w-0.5 group-hover:bg-wb-accent group-focus-visible:w-0.5 group-focus-visible:bg-wb-accent"
          />
        </div>

        <aside
          aria-hidden={!peekOpen}
          aria-label={t("articleReader.drawerTitle")}
          className="article-reader-peek-column min-w-0 shrink-0 overflow-hidden bg-wb-panel"
          data-testid="article-reader-peek-column-v3"
          inert={!peekOpen}
          onTransitionEnd={(event) => {
            if (event.currentTarget !== event.target || peekOpen) return;
            finishPeekClose();
          }}
        >
          <div
            ref={setPeekPortalHost}
            className="article-reader-peek-host h-full"
            data-testid="article-reader-peek-host-v3"
          />
        </aside>
      </div>
    </div>
  );
}

export default ArticleReaderV3Page;
