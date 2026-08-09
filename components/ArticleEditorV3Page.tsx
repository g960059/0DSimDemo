import React from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  GripVertical,
  Heading2,
  Pilcrow,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  articleEditorHref,
  myArticlesHref,
  newExperimentHref,
} from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import { ArticleExperimentPlacementV3 } from "@/components/article/ArticleExperimentPlacementV3";
import {
  ArticleReaderExperimentV3,
} from "@/components/article/reader/ArticleReaderExperimentV3";
import {
  ArticleSnapshotPickerDialogV3,
  type ArticleSnapshotPickerItemV3,
} from "@/components/article/ArticleSnapshotPickerDialogV3";
import {
  createArticleExperimentBlockV3,
  portableEditorIdV3,
} from "@/components/article/ArticleEditorStateV3";
import {
  STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
  type StudioArticleBlockV2,
  type StudioArticleDraftV2,
  type StudioArticleExperimentBlockV2,
} from "@/studio/contracts/v2/article";
import type {
  ExperimentPlacementBriefingV2,
  ExperimentSnapshotV2,
} from "@/studio/contracts/v2/content";
import {
  StudioBrowserContentStoreV3,
} from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";
import {
  createStudioSupabaseContentRepositoryV1,
  type StudioSupabaseContentRepositoryV1,
} from "@/studio/infrastructure/supabase/StudioSupabaseContentRepositoryV1";
import {
  createArticleExperimentSessionTokenV3,
  StudioArticleExperimentAuthoringHandoffStoreV3,
} from "@/studio/infrastructure/browser/StudioArticleExperimentAuthoringHandoffV3";
import {
  loadStudioSnapshotClientCompositionV2,
  type StudioClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import { useUnsavedChangesGuardV3 } from "@/components/useUnsavedChangesGuardV3";

type EditorSaveStatusV3 = "idle" | "dirty" | "saving" | "saved" | "error";

type ArticleRemoteAuthoringRepositoryV3 = Pick<
  StudioSupabaseContentRepositoryV1,
  "publishArticle" | "readArticle" | "unpublishArticle"
>;

const ARTICLE_EDITOR_PEEK_FRACTION_STORAGE_KEY_V3 =
  "circleheart.article-editor.peek-fraction.v1";
const ARTICLE_EDITOR_PEEK_DEFAULT_FRACTION_V3 = 0.46;
const ARTICLE_EDITOR_PEEK_MIN_FRACTION_V3 = 0.3;
const ARTICLE_EDITOR_PEEK_MAX_FRACTION_V3 = 0.64;

export function clampArticleEditorPeekFractionV3(value: number): number {
  if (!Number.isFinite(value)) return ARTICLE_EDITOR_PEEK_DEFAULT_FRACTION_V3;
  return Math.min(
    ARTICLE_EDITOR_PEEK_MAX_FRACTION_V3,
    Math.max(ARTICLE_EDITOR_PEEK_MIN_FRACTION_V3, value),
  );
}

export function articleEditorPeekFractionForPointerV3(
  shellLeft: number,
  shellWidth: number,
  pointerClientX: number,
): number {
  if (!Number.isFinite(shellWidth) || shellWidth <= 0) {
    return ARTICLE_EDITOR_PEEK_DEFAULT_FRACTION_V3;
  }
  return clampArticleEditorPeekFractionV3(
    (shellLeft + shellWidth - pointerClientX) / shellWidth,
  );
}

export async function synchronizeRemoteArticlePublicationV3(input: Readonly<{
  repository: ArticleRemoteAuthoringRepositoryV3;
  saved: StudioArticleDraftV2;
  candidate: StudioArticleDraftV2;
  wasPublished: boolean;
}>): Promise<Readonly<{
  article: StudioArticleDraftV2;
  published: boolean;
}>> {
  if (input.candidate.visibility === "draft" && !input.wasPublished) {
    return Object.freeze({ article: input.saved, published: false });
  }
  if (input.candidate.visibility === "public") {
    await input.repository.publishArticle({
      articleId: input.saved.articleId,
      expectedVersion: input.saved.draftVersion,
      publicSlug: publicArticleSlugV3(input.saved.articleId),
    });
  } else if (input.wasPublished) {
    await input.repository.unpublishArticle(
      input.saved.articleId,
      input.saved.draftVersion,
    );
  }

  // Publication is a second authority commit. Re-read after moving (or
  // removing) the pointer so callers never replace the requested state with
  // the pre-publication draft returned by saveArticle().
  const authoritative = await input.repository.readArticle(
    input.saved.articleId,
  );
  if (authoritative === null) {
    throw new Error("Saved Article could not be read after publication update");
  }
  return Object.freeze({
    article: authoritative,
    published: authoritative.visibility === "public",
  });
}

function initialArticleEditorPeekFractionV3(): number {
  if (typeof window === "undefined") return ARTICLE_EDITOR_PEEK_DEFAULT_FRACTION_V3;
  try {
    const raw = window.localStorage.getItem(
      ARTICLE_EDITOR_PEEK_FRACTION_STORAGE_KEY_V3,
    );
    return raw === null
      ? ARTICLE_EDITOR_PEEK_DEFAULT_FRACTION_V3
      : clampArticleEditorPeekFractionV3(Number(raw));
  } catch {
    return ARTICLE_EDITOR_PEEK_DEFAULT_FRACTION_V3;
  }
}

type ArticleEditorRouteDraftResolutionV3 = Readonly<{
  draft: StudioArticleDraftV2;
  routeChanged: boolean;
  routeKey: string;
}>;

export function articleEditorRouteKeyV3(
  routeArticleId: string | undefined,
): string {
  return routeArticleId ?? "new";
}

export function articleEditorRouteHydratedV3(
  hydratedRouteKey: string | null,
  routeArticleId: string | undefined,
): boolean {
  return hydratedRouteKey === articleEditorRouteKeyV3(routeArticleId);
}

export function resolveArticleEditorRouteDraftV3(input: Readonly<{
  currentDraft: StudioArticleDraftV2;
  hydratedRouteKey: string | null;
  locale: string;
  readArticle: (articleId: string) => StudioArticleDraftV2 | null;
  routeArticleId: string | undefined;
  untitledTitle: string;
}>): ArticleEditorRouteDraftResolutionV3 {
  const routeKey = articleEditorRouteKeyV3(input.routeArticleId);
  if (input.hydratedRouteKey === routeKey) {
    return Object.freeze({
      draft: input.currentDraft,
      routeChanged: false,
      routeKey,
    });
  }
  if (input.routeArticleId === "new" || input.routeArticleId === undefined) {
    return Object.freeze({
      draft: createEmptyArticleDraftV3(input.locale, input.untitledTitle),
      routeChanged: true,
      routeKey,
    });
  }
  const stored = input.readArticle(input.routeArticleId);
  if (stored === null) {
    throw new Error(`Article not found: ${input.routeArticleId}`);
  }
  return Object.freeze({
    draft: stored,
    routeChanged: true,
    routeKey,
  });
}

export function ArticleEditorV3Page() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { articleId: routeArticleId } = useParams();
  const locale = localeFromPathname(location.pathname);
  const store = React.useMemo(() => new StudioBrowserContentStoreV3(), []);
  const remoteRepository = React.useMemo(
    createStudioSupabaseContentRepositoryV1,
    [],
  );
  const articleExperimentHandoff = React.useMemo(
    () => new StudioArticleExperimentAuthoringHandoffStoreV3(),
    [],
  );
  const [snapshots, setSnapshots] = React.useState<
    readonly ExperimentSnapshotV2[]
  >([]);
  const [snapshotPickerItems, setSnapshotPickerItems] = React.useState<
    readonly ArticleSnapshotPickerItemV3[]
  >([]);
  const [draft, setDraft] = React.useState<StudioArticleDraftV2>(() =>
    createEmptyArticleDraftV3(locale, t("articleEditor.untitled")));
  const draftRef = React.useRef(draft);
  const remoteSavedArticleIdRef = React.useRef<string | null>(null);
  const remotePublishedRef = React.useRef(false);
  const hydratedRouteKeyRef = React.useRef<string | null>(
    routeArticleId === "new" || routeArticleId === undefined
      ? articleEditorRouteKeyV3(routeArticleId)
      : null,
  );
  const [hydratedRouteKey, setHydratedRouteKey] = React.useState<string | null>(
    hydratedRouteKeyRef.current,
  );
  const [status, setStatus] = React.useState<EditorSaveStatusV3>("idle");
  const [hasUnsavedArticleChanges, setHasUnsavedArticleChanges] =
    React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [insertMenuIndex, setInsertMenuIndex] = React.useState<number | null>(null);
  const [blockMenuId, setBlockMenuId] = React.useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = React.useState<string | null>(null);
  const [focusBlockId, setFocusBlockId] = React.useState<string | null>(null);
  const pendingExperimentInsertIndexRef = React.useRef<number | null>(null);
  const pendingExperimentReplacementBlockIdRef = React.useRef<string | null>(null);
  const pendingReturnedSnapshotIdRef = React.useRef<string | null>(null);
  const slashReplacementIndexRef = React.useRef<number | null>(null);
  const [compositionBySnapshotId, setCompositionBySnapshotId] = React.useState<
    ReadonlyMap<string, StudioClientCompositionV2>
  >(() => new Map());
  const [peekBlockId, setPeekBlockId] = React.useState<string | null>(null);
  const [peekOpen, setPeekOpen] = React.useState(false);
  const [peekPortalHost, setPeekPortalHost] =
    React.useState<HTMLDivElement | null>(null);
  const [peekFraction, setPeekFraction] = React.useState(
    initialArticleEditorPeekFractionV3,
  );
  const [peekDragging, setPeekDragging] = React.useState(false);
  const splitRef = React.useRef<HTMLDivElement>(null);
  const peekCloseTimerRef = React.useRef<number | null>(null);
  const peekResizeFrameRef = React.useRef<number | null>(null);
  const peekDraggingRef = React.useRef(false);
  const pendingPeekFractionRef = React.useRef(peekFraction);

  const cancelPeekCloseTimer = React.useCallback(() => {
    if (peekCloseTimerRef.current === null) return;
    window.clearTimeout(peekCloseTimerRef.current);
    peekCloseTimerRef.current = null;
  }, []);

  const openEditorPeekV3 = React.useCallback((blockId: string) => {
    cancelPeekCloseTimer();
    setPeekBlockId(blockId);
  }, [cancelPeekCloseTimer]);

  const closeEditorPeekV3 = React.useCallback(() => {
    setPeekOpen(false);
    cancelPeekCloseTimer();
    peekCloseTimerRef.current = window.setTimeout(() => {
      peekCloseTimerRef.current = null;
      setPeekBlockId(null);
    }, 260);
  }, [cancelPeekCloseTimer]);

  React.useEffect(() => {
    if (peekBlockId === null) return undefined;
    const frame = window.requestAnimationFrame(() => setPeekOpen(true));
    return () => window.cancelAnimationFrame(frame);
  }, [peekBlockId]);

  React.useEffect(() => () => {
    cancelPeekCloseTimer();
    if (peekResizeFrameRef.current !== null) {
      window.cancelAnimationFrame(peekResizeFrameRef.current);
    }
  }, [cancelPeekCloseTimer]);

  const resizePeekFromPointer = React.useCallback((clientX: number) => {
    const bounds = splitRef.current?.getBoundingClientRect();
    if (bounds === undefined) return;
    pendingPeekFractionRef.current = articleEditorPeekFractionForPointerV3(
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

  const persistPeekFraction = React.useCallback((fraction: number) => {
    try {
      window.localStorage.setItem(
        ARTICLE_EDITOR_PEEK_FRACTION_STORAGE_KEY_V3,
        String(clampArticleEditorPeekFractionV3(fraction)),
      );
    } catch {
      // Device-local Editor geometry is optional.
    }
  }, []);

  React.useEffect(() => {
    let current = true;
    void Promise.allSettled(snapshots.map(async (snapshot) => Object.freeze({
      snapshotId: snapshot.snapshotId,
      composition: await loadStudioSnapshotClientCompositionV2(
        snapshot.content.modelId,
        snapshot.content.surfaceSeriesId,
        snapshot.surfaceReleaseId,
      ),
    }))).then((results) => {
      if (!current) return;
      setCompositionBySnapshotId(new Map(results.flatMap((result) =>
        result.status === "fulfilled"
          ? [[result.value.snapshotId, result.value.composition] as const]
          : [])));
    });
    return () => {
      current = false;
    };
  }, [snapshots]);

  React.useEffect(() => {
    let current = true;
    const load = async () => {
      const localSnapshots = remoteRepository === null
        ? store.listSnapshots()
        : Object.freeze([]);
      const nextSnapshotPickerItems = remoteRepository === null
        ? localSnapshots.map(snapshotPickerItemFromSnapshotV3)
        : (await remoteRepository.listMySnapshots()).items.map((summary) =>
            Object.freeze({
              snapshotId: summary.snapshotId,
              title: summary.title,
              createdAt: summary.createdAt,
              paneCount: summary.paneCount,
            }));
      if (!current) return;
      setSnapshotPickerItems(Object.freeze([...nextSnapshotPickerItems]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))));

      const routeKey = articleEditorRouteKeyV3(routeArticleId);
      if (hydratedRouteKeyRef.current === routeKey) {
        setHydratedRouteKey(routeKey);
        return;
      }
      setHydratedRouteKey(null);
      let nextDraft: StudioArticleDraftV2;
      if (routeArticleId === "new" || routeArticleId === undefined) {
        nextDraft = createEmptyArticleDraftV3(
          locale,
          t("articleEditor.untitled"),
        );
        remoteSavedArticleIdRef.current = null;
        remotePublishedRef.current = false;
      } else if (remoteRepository !== null) {
        const stored = await remoteRepository.readArticle(routeArticleId);
        if (stored === null) throw new Error(`Article not found: ${routeArticleId}`);
        nextDraft = stored;
        remoteSavedArticleIdRef.current = stored.articleId;
        remotePublishedRef.current = stored.visibility === "public";
      } else {
        const resolution = resolveArticleEditorRouteDraftV3({
          currentDraft: draftRef.current,
          hydratedRouteKey: hydratedRouteKeyRef.current,
          locale,
          readArticle: (articleId) => store.readArticle(articleId),
          routeArticleId,
          untitledTitle: t("articleEditor.untitled"),
        });
        nextDraft = resolution.draft;
      }
      const referencedSnapshotIds = [...new Set(nextDraft.blocks.flatMap(
        (block) => block.kind === "experiment"
          ? [block.placement.snapshotId]
          : [],
      ))];
      const nextSnapshots = remoteRepository === null
        ? localSnapshots.filter((snapshot) =>
            referencedSnapshotIds.includes(snapshot.snapshotId))
        : (await Promise.all(referencedSnapshotIds.map((snapshotId) =>
            remoteRepository.readSnapshot(snapshotId))))
            .filter((snapshot): snapshot is ExperimentSnapshotV2 =>
              snapshot !== null);
      if (!current) return;
      setSnapshots(Object.freeze(nextSnapshots));
      hydratedRouteKeyRef.current = routeKey;
      setHydratedRouteKey(routeKey);
      pendingReturnedSnapshotIdRef.current = null;
      draftRef.current = nextDraft;
      setDraft(nextDraft);
      setStatus("idle");
      setHasUnsavedArticleChanges(false);
      setError(null);
    };
    void load().catch((cause) => {
      if (!current) return;
      setHydratedRouteKey(null);
      setStatus("error");
      setError(errorMessageV3(cause));
    });
    return () => {
      current = false;
    };
  }, [locale, remoteRepository, routeArticleId, store, t]);

  const routeHydrated = articleEditorRouteHydratedV3(
    hydratedRouteKey,
    routeArticleId,
  );

  const updateDraft = React.useCallback((
    update: (current: StudioArticleDraftV2) => StudioArticleDraftV2,
  ) => {
    const next = update(draftRef.current);
    draftRef.current = next;
    setDraft(next);
    setStatus("dirty");
    setHasUnsavedArticleChanges(true);
    setError(null);
  }, []);

  const saveDraft = React.useCallback(async ():
    Promise<StudioArticleDraftV2 | null> => {
    if (!routeHydrated) return null;
    setStatus("saving");
    setError(null);
    let remotelySaved: StudioArticleDraftV2 | null = null;
    try {
      const candidate = draftRef.current;
      let saved: StudioArticleDraftV2;
      if (remoteRepository !== null) {
        const persistedArticleId = remoteSavedArticleIdRef.current;
        const normalized = normalizeArticleDraftV3(candidate);
        saved = await remoteRepository.saveArticle({
          articleId: persistedArticleId,
          expectedVersion: persistedArticleId === null
            ? null
            : candidate.draftVersion,
          article: normalized,
        });
        // Saving Article content and moving its publication pointer are two
        // semantic commits. Retain the new durable version even when the
        // latter is rejected (for example, while the owner is anonymous), so
        // the next explicit retry cannot write against a stale version.
        remotelySaved = saved;
        remoteSavedArticleIdRef.current = saved.articleId;
        const publication = await synchronizeRemoteArticlePublicationV3({
          repository: remoteRepository,
          saved,
          candidate,
          wasPublished: remotePublishedRef.current,
        });
        saved = publication.article;
        remotelySaved = publication.article;
        remotePublishedRef.current = publication.published;
      } else {
        const isInitialSave = store.readArticle(candidate.articleId) === null;
        const normalized = normalizeArticleDraftV3({
          ...candidate,
          draftVersion: isInitialSave ? 0 : candidate.draftVersion + 1,
        });
        saved = store.saveArticle(normalized);
      }
      const pendingSnapshotId = pendingReturnedSnapshotIdRef.current;
      if (pendingSnapshotId !== null) {
        const pendingHandoff = articleExperimentHandoff.read();
        if (
          pendingHandoff?.articleId === saved.articleId
          && pendingHandoff.snapshotId === pendingSnapshotId
        ) {
          articleExperimentHandoff.clear();
        }
        pendingReturnedSnapshotIdRef.current = null;
      }
      draftRef.current = saved;
      setDraft(saved);
      setStatus("saved");
      setHasUnsavedArticleChanges(false);
      if (routeArticleId !== saved.articleId) {
        navigate(articleEditorHref({ articleId: saved.articleId, locale }), {
          replace: true,
        });
      }
      return saved;
    } catch (cause) {
      if (remotelySaved !== null) {
        const adopted = Object.freeze({
          ...remotelySaved,
          // Keep the author's requested visibility visible. The error state
          // communicates that moving the publication pointer is still
          // pending; the Article body itself is already durable.
          visibility: draftRef.current.visibility,
        }) satisfies StudioArticleDraftV2;
        draftRef.current = adopted;
        setDraft(adopted);
        setHasUnsavedArticleChanges(true);
        if (routeArticleId !== adopted.articleId) {
          navigate(articleEditorHref({
            articleId: adopted.articleId,
            locale,
          }), { replace: true });
        }
      }
      setStatus("error");
      setError(errorMessageV3(cause));
      return null;
    }
  }, [
    articleExperimentHandoff,
    locale,
    navigate,
    routeArticleId,
    remoteRepository,
    routeHydrated,
    store,
  ]);

  const insertExperimentSnapshotV3 = React.useCallback((input: Readonly<{
    insertionIndex: number;
    replacementBlockId: string | null;
    snapshot: ExperimentSnapshotV2;
    briefing?: ExperimentPlacementBriefingV2;
  }>) => {
    const block = createArticleExperimentBlockV3(
      input.snapshot,
      input.briefing,
    );
    updateDraft((current) => {
      const replacementIndex = input.replacementBlockId === null
        ? -1
        : current.blocks.findIndex((candidate) =>
            candidate.blockId === input.replacementBlockId);
      const replacement = current.blocks[replacementIndex];
      if (
        replacementIndex >= 0
        && replacement !== undefined
        && (
          replacement.kind === "experiment"
          || replacement.text.length === 0
        )
      ) {
        const blocks = [...current.blocks];
        blocks[replacementIndex] = block;
        return { ...current, blocks };
      }
      return {
        ...current,
        blocks: insertArticleBlockV3(
          current.blocks,
          input.insertionIndex,
          block,
        ),
      };
    });
  }, [updateDraft]);

  React.useEffect(() => {
    const pending = articleExperimentHandoff.read();
    if (
      pending === null
      || pending.snapshotId === null
      || pending.articleId !== draft.articleId
      || pendingReturnedSnapshotIdRef.current === pending.snapshotId
    ) return;
    let current = true;
    const loadReturnedSnapshot = async () => {
      const snapshot = remoteRepository === null
        ? store.readSnapshot(pending.snapshotId!)
        : await remoteRepository.readSnapshot(pending.snapshotId!);
      if (!current || snapshot === null || pending.briefing === null) return;
      insertExperimentSnapshotV3({
        insertionIndex: pending.insertionIndex,
        replacementBlockId: pending.replacementBlockId,
        snapshot,
        briefing: pending.briefing,
      });
      // Keep the completed handoff until the Article itself is saved. If the
      // tab reloads before then, this exact immutable Snapshot can be inserted
      // again instead of silently losing the returned Placement.
      pendingReturnedSnapshotIdRef.current = pending.snapshotId;
      const nextSnapshotPickerItems = remoteRepository === null
        ? store.listSnapshots().map(snapshotPickerItemFromSnapshotV3)
        : (await remoteRepository.listMySnapshots()).items.map((summary) =>
            Object.freeze({
              snapshotId: summary.snapshotId,
              title: summary.title,
              createdAt: summary.createdAt,
              paneCount: summary.paneCount,
            }));
      if (current) {
        setSnapshots((existing) => Object.freeze([
          snapshot,
          ...existing.filter((candidate) =>
            candidate.snapshotId !== snapshot.snapshotId),
        ]));
        setSnapshotPickerItems(Object.freeze([...nextSnapshotPickerItems]
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))));
      }
    };
    void loadReturnedSnapshot().catch((cause) => {
      if (current) {
        setStatus("error");
        setError(errorMessageV3(cause));
      }
    });
    return () => {
      current = false;
    };
  }, [
    articleExperimentHandoff,
    draft.articleId,
    insertExperimentSnapshotV3,
    remoteRepository,
    store,
  ]);

  const discardPendingReturnedSnapshotV3 = React.useCallback(() => {
    if (pendingReturnedSnapshotIdRef.current === null) return;
    articleExperimentHandoff.clear();
    pendingReturnedSnapshotIdRef.current = null;
  }, [articleExperimentHandoff]);
  useUnsavedChangesGuardV3({
    enabled: hasUnsavedArticleChanges,
    message: t("common.unsavedChanges"),
    onConfirmedDiscard: discardPendingReturnedSnapshotV3,
  });

  const startArticleExperimentSessionV3 = React.useCallback(async (input: Readonly<{
    insertionIndex: number;
    replacementBlockId: string | null;
    snapshotId?: string;
    briefing?: ExperimentPlacementBriefingV2;
  }>) => {
    const savedArticle = await saveDraft();
    if (savedArticle === null) return;
    const sessionToken = createArticleExperimentSessionTokenV3();
    articleExperimentHandoff.begin({
      articleId: savedArticle.articleId,
      sessionToken,
      insertionIndex: input.insertionIndex,
      replacementBlockId: input.replacementBlockId,
      briefing: input.briefing ?? null,
    });
    setPickerOpen(false);
    const search = new URLSearchParams({
      articleId: savedArticle.articleId,
      sessionToken,
    });
    if (input.snapshotId !== undefined) {
      search.set("snapshotId", input.snapshotId);
    }
    navigate(`${newExperimentHref(locale)}?${
      search.toString()
    }`);
  }, [
    articleExperimentHandoff,
    locale,
    navigate,
    saveDraft,
  ]);

  const createExperimentFromArticleV3 = React.useCallback(() => {
    void startArticleExperimentSessionV3({
      insertionIndex: pendingExperimentInsertIndexRef.current
        ?? draftRef.current.blocks.length,
      replacementBlockId: pendingExperimentReplacementBlockIdRef.current,
    });
  }, [startArticleExperimentSessionV3]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveDraft();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveDraft]);

  React.useEffect(() => {
    if (insertMenuIndex === null && blockMenuId === null) return;
    const closeMenus = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-article-block-menu]")) {
        return;
      }
      setInsertMenuIndex(null);
      setBlockMenuId(null);
      slashReplacementIndexRef.current = null;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setInsertMenuIndex(null);
      setBlockMenuId(null);
      slashReplacementIndexRef.current = null;
    };
    document.addEventListener("pointerdown", closeMenus);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [blockMenuId, insertMenuIndex]);

  const updateBlock = (index: number, block: StudioArticleBlockV2) => {
    updateDraft((current) => ({
      ...current,
      blocks: current.blocks.map((candidate, candidateIndex) =>
        candidateIndex === index ? block : candidate),
    }));
  };

  const removeBlock = (index: number) => {
    updateDraft((current) => ({
      ...current,
      blocks: current.blocks.filter((_, candidateIndex) => candidateIndex !== index),
    }));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    updateDraft((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.blocks.length) return current;
      const blocks = [...current.blocks];
      [blocks[index], blocks[nextIndex]] = [blocks[nextIndex], blocks[index]];
      return { ...current, blocks };
    });
  };

  const moveBlockTo = (blockId: string, targetIndex: number) => {
    updateDraft((current) => {
      const sourceIndex = current.blocks.findIndex((block) =>
        block.blockId === blockId);
      if (sourceIndex < 0 || sourceIndex === targetIndex) return current;
      const blocks = [...current.blocks];
      const [moved] = blocks.splice(sourceIndex, 1);
      if (moved === undefined) return current;
      blocks.splice(Math.max(0, Math.min(targetIndex, blocks.length)), 0, moved);
      return { ...current, blocks };
    });
  };

  const addTextBlock = (
    kind: "heading" | "paragraph",
    index = draftRef.current.blocks.length,
  ) => {
    const blockId = portableEditorIdV3("block");
    const replaceCurrent = slashReplacementIndexRef.current === index;
    let focusTargetId = blockId;
    updateDraft((current) => {
      const currentBlock = current.blocks[index];
      if (
        replaceCurrent
        && currentBlock !== undefined
        && currentBlock.kind !== "experiment"
        && currentBlock.text.length === 0
      ) {
        focusTargetId = currentBlock.blockId;
        const blocks = [...current.blocks];
        blocks[index] = kind === "heading"
          ? {
              blockId: currentBlock.blockId,
              kind: "heading" as const,
              level: 2 as const,
              text: "",
            }
          : {
              blockId: currentBlock.blockId,
              kind: "paragraph" as const,
              text: "",
            };
        return { ...current, blocks };
      }
      return {
        ...current,
        blocks: insertArticleBlockV3(current.blocks, index, kind === "heading"
          ? {
            blockId,
            kind: "heading" as const,
            level: 2 as const,
            text: "",
          }
          : {
            blockId,
            kind: "paragraph" as const,
            text: "",
          }),
      };
    });
    slashReplacementIndexRef.current = null;
    setInsertMenuIndex(null);
    setFocusBlockId(focusTargetId);
  };

  const splitTextBlock = (index: number, offset: number) => {
    const nextBlockId = portableEditorIdV3("block");
    updateDraft((current) => {
      const currentBlock = current.blocks[index];
      if (
        currentBlock === undefined
        || currentBlock.kind === "experiment"
      ) return current;
      const splitOffset = Math.max(0, Math.min(offset, currentBlock.text.length));
      const before = currentBlock.text.slice(0, splitOffset);
      const after = currentBlock.text.slice(splitOffset);
      const nextBlock = {
        blockId: nextBlockId,
        kind: "paragraph" as const,
        text: after,
      };
      const blocks = [...current.blocks];
      blocks[index] = { ...currentBlock, text: before };
      blocks.splice(index + 1, 0, nextBlock);
      return { ...current, blocks };
    });
    setFocusBlockId(nextBlockId);
  };

  const removeEmptyTextBlock = (index: number) => {
    const previous = draftRef.current.blocks[index - 1];
    removeBlock(index);
    if (previous !== undefined && previous.kind !== "experiment") {
      setFocusBlockId(previous.blockId);
    }
  };

  const openExperimentPickerAt = (index: number) => {
    pendingExperimentInsertIndexRef.current = index;
    pendingExperimentReplacementBlockIdRef.current =
      slashReplacementIndexRef.current === index
        ? draftRef.current.blocks[index]?.blockId ?? null
        : null;
    slashReplacementIndexRef.current = null;
    setInsertMenuIndex(null);
    setPickerOpen(true);
  };

  const addExperiment = (snapshot: ExperimentSnapshotV2) => {
    insertExperimentSnapshotV3({
      insertionIndex: pendingExperimentInsertIndexRef.current
        ?? draftRef.current.blocks.length,
      replacementBlockId: pendingExperimentReplacementBlockIdRef.current,
      snapshot,
    });
    pendingExperimentInsertIndexRef.current = null;
    pendingExperimentReplacementBlockIdRef.current = null;
    setPickerOpen(false);
  };

  const selectSnapshotForArticleV3 = async (
    item: ArticleSnapshotPickerItemV3,
  ): Promise<void> => {
    try {
      const cached = snapshots.find((snapshot) =>
        snapshot.snapshotId === item.snapshotId) ?? null;
      const snapshot = cached ?? (remoteRepository === null
        ? store.readSnapshot(item.snapshotId)
        : await remoteRepository.readSnapshot(item.snapshotId));
      if (snapshot === null) {
        throw new Error(`Snapshot not found: ${item.snapshotId}`);
      }
      setSnapshots((existing) => Object.freeze([
        snapshot,
        ...existing.filter((candidate) =>
          candidate.snapshotId !== snapshot.snapshotId),
      ]));
      addExperiment(snapshot);
    } catch (cause) {
      setStatus("error");
      setError(errorMessageV3(cause));
      throw cause;
    }
  };

  const articleSnapshotById = React.useMemo(
    () => new Map(snapshots.map((snapshot) => [snapshot.snapshotId, snapshot])),
    [snapshots],
  );
  const selectedPeek = React.useMemo(() => {
    if (peekBlockId === null) return null;
    const index = draft.blocks.findIndex(({ blockId }) => blockId === peekBlockId);
    if (index < 0) return null;
    const block = draft.blocks[index];
    if (block === undefined || block.kind !== "experiment") return null;
    const snapshot = articleSnapshotById.get(block.placement.snapshotId) ?? null;
    return snapshot === null ? null : Object.freeze({ block, index, snapshot });
  }, [articleSnapshotById, draft.blocks, peekBlockId]);
  React.useEffect(() => {
    if (peekBlockId !== null && selectedPeek === null) closeEditorPeekV3();
  }, [closeEditorPeekV3, peekBlockId, selectedPeek]);
  const persistedArticle = routeArticleId !== undefined
    && routeArticleId !== "new";
  const savedClean = persistedArticle
    && !hasUnsavedArticleChanges
    && status !== "saving"
    && status !== "error";

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-wb-app text-wb-text"
      data-testid="article-editor-v3"
    >
      <header className="z-20 flex h-12 shrink-0 items-center gap-2 bg-wb-header px-2.5 shadow-[inset_0_-1px_0_var(--wb-border)] sm:px-4">
        <Link
          to={myArticlesHref(locale)}
          aria-label={t("articleReader.backToArticles")}
          title={t("articleReader.backToArticles")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <span className="min-w-0 flex-1" />
        <button
          type="button"
          role="switch"
          aria-checked={draft.visibility === "public"}
          aria-label={t("articleEditor.publicToggle")}
          disabled={status === "saving" || !routeHydrated}
          onClick={() => updateDraft((current) => ({
            ...current,
            visibility: current.visibility === "public" ? "draft" : "public",
          }))}
          className="inline-flex min-h-8 shrink-0 items-center gap-2 rounded-lg px-1.5 text-[11px] font-semibold text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:px-2"
        >
          <span
            aria-hidden="true"
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${draft.visibility === "public" ? "bg-wb-primary" : "bg-wb-line"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${draft.visibility === "public" ? "translate-x-[1.125rem]" : "translate-x-0.5"}`}
            />
          </span>
          <span className="hidden sm:inline">
            {t(draft.visibility === "public"
              ? "articleEditor.published"
              : "articleEditor.publish")}
          </span>
        </button>
        {savedClean ? (
          <span
            className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg bg-wb-primary px-3 text-[11px] font-semibold text-white"
            role="status"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {t("articleEditor.status.saved")}
          </span>
        ) : (
          <button
            type="button"
            onClick={saveDraft}
            disabled={status === "saving" || !routeHydrated}
            className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg bg-wb-primary px-3 text-[11px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-wb-primary-hover active:scale-[0.97] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {status === "saving"
              ? t("articleEditor.status.saving")
              : t("articleEditor.save")}
          </button>
        )}
      </header>

      <div
        ref={splitRef}
        className="article-reader-split relative flex min-h-0 flex-1 overflow-hidden"
        data-peek-mounted={peekBlockId === null ? "false" : "true"}
        data-peek-open={peekOpen ? "true" : "false"}
        data-peek-dragging={peekDragging ? "true" : "false"}
        style={{
          "--article-reader-peek-width": `${peekFraction * 100}%`,
        } as React.CSSProperties}
      >
      <main
        className="article-reader-article-pane min-w-0 flex-1 overflow-y-auto overscroll-contain"
        aria-busy={!routeHydrated}
        data-route-hydrated={routeHydrated ? "true" : "false"}
        inert={!routeHydrated}
      >
        <article className="mx-auto w-full max-w-[760px] px-5 pb-40 pt-14 sm:px-8 sm:pt-20">
          <input
            type="text"
            value={draft.title}
            onChange={(event) => updateDraft((current) => ({
              ...current,
              title: event.currentTarget.value,
            }))}
            placeholder={t("articleEditor.titlePlaceholder")}
            aria-label={t("articleEditor.title")}
            className="w-full bg-transparent text-3xl font-bold leading-tight tracking-[-0.025em] text-wb-text outline-none placeholder:text-wb-subtle sm:text-[2.5rem]"
          />

          {error !== null && (
            <p className="mt-6 rounded-xl bg-wb-danger-soft px-4 py-3 text-xs leading-5 text-wb-danger" role="alert">
              {error}
            </p>
          )}

          {snapshotPickerItems.length === 0 && (
            <div className="mt-8 rounded-xl bg-wb-soft px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="text-sm font-medium">{t("articleEditor.emptySnapshots.title")}</p>
                <p className="mt-1 text-xs leading-5 text-wb-muted">
                  {t("articleEditor.emptySnapshots.description")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  pendingExperimentInsertIndexRef.current =
                    draftRef.current.blocks.length;
                  pendingExperimentReplacementBlockIdRef.current = null;
                  createExperimentFromArticleV3();
                }}
                className="mt-3 inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-accent transition-[background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:mt-0"
              >
                {t("articleEditor.emptySnapshots.createExperiment")}
                <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              </button>
            </div>
          )}

          <div className="mt-12" data-testid="article-blocks-v3">
            {draft.blocks.map((block, index) => {
              const placementSnapshot = block.kind === "experiment"
                ? articleSnapshotById.get(block.placement.snapshotId) ?? null
                : null;
              const placementContract = placementSnapshot === null
                ? null
                : compositionBySnapshotId.get(placementSnapshot.snapshotId)
                    ?.contract ?? null;
              return (
                <ArticleBlockShellV3
                  key={block.blockId}
                  blockId={block.blockId}
                  blockKind={block.kind}
                  index={index}
                  total={draft.blocks.length}
                  insertMenuOpen={insertMenuIndex === index}
                  blockMenuOpen={blockMenuId === block.blockId}
                  onToggleInsertMenu={() => {
                    setBlockMenuId(null);
                    slashReplacementIndexRef.current = null;
                    setInsertMenuIndex((current) => current === index ? null : index);
                  }}
                  onToggleBlockMenu={() => {
                    setInsertMenuIndex(null);
                    setBlockMenuId((current) => current === block.blockId
                      ? null
                      : block.blockId);
                  }}
                  onInsertHeading={() => addTextBlock("heading", index)}
                  onInsertParagraph={() => addTextBlock("paragraph", index)}
                  onInsertExperiment={() => openExperimentPickerAt(index)}
                  onMove={(direction) => {
                    moveBlock(index, direction);
                    setBlockMenuId(null);
                  }}
                  onRemove={() => {
                    removeBlock(index);
                    setBlockMenuId(null);
                  }}
                  onDragStart={() => setDraggedBlockId(block.blockId)}
                  onDrop={() => {
                    if (draggedBlockId !== null) moveBlockTo(draggedBlockId, index);
                    setDraggedBlockId(null);
                  }}
                >
                  {block.kind === "experiment" ? (
                    <ArticleExperimentPlacementV3
                      block={block}
                      snapshot={placementSnapshot}
                      contract={placementContract}
                      index={index}
                      total={draft.blocks.length}
                      blockEditorLayout
                      showBlockActions={false}
                      onChange={(next) => updateBlock(index, next)}
                      onEdit={() => openEditorPeekV3(block.blockId)}
                      onRemove={() => removeBlock(index)}
                      onMove={(direction) => moveBlock(index, direction)}
                    />
                  ) : (
                    <ArticleTextBlockV3
                      block={block}
                      focusRequested={focusBlockId === block.blockId}
                      onFocusHandled={() => setFocusBlockId(null)}
                      onChange={(next) => updateBlock(index, next)}
                      onDeleteEmpty={() => removeEmptyTextBlock(index)}
                      onOpenInsertMenu={() => {
                        slashReplacementIndexRef.current = index;
                        setBlockMenuId(null);
                        setInsertMenuIndex(index);
                      }}
                      onSplit={(offset) => splitTextBlock(index, offset)}
                    />
                  )}
                </ArticleBlockShellV3>
              );
            })}
          </div>

          <ArticleBlockInsertionV3
            index={draft.blocks.length}
            open={insertMenuIndex === draft.blocks.length}
            empty={draft.blocks.length === 0}
            onToggle={() => {
              setBlockMenuId(null);
              slashReplacementIndexRef.current = null;
              setInsertMenuIndex((current) => current === draft.blocks.length
                ? null
                : draft.blocks.length);
            }}
            onInsertHeading={() => addTextBlock("heading")}
            onInsertParagraph={() => addTextBlock("paragraph")}
            onInsertExperiment={() => openExperimentPickerAt(draft.blocks.length)}
          />
        </article>
      </main>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t("articleReader.resizeExperiment")}
        aria-valuemin={Math.round(ARTICLE_EDITOR_PEEK_MIN_FRACTION_V3 * 100)}
        aria-valuemax={Math.round(ARTICLE_EDITOR_PEEK_MAX_FRACTION_V3 * 100)}
        aria-valuenow={Math.round(peekFraction * 100)}
        tabIndex={peekOpen ? 0 : -1}
        className="article-reader-peek-divider group relative z-10 shrink-0 touch-none outline-none"
        data-testid="article-editor-peek-divider-v3"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          peekDraggingRef.current = true;
          setPeekDragging(true);
          resizePeekFromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (peekDraggingRef.current) resizePeekFromPointer(event.clientX);
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
          else if (event.key === "Home") next = ARTICLE_EDITOR_PEEK_MIN_FRACTION_V3;
          else if (event.key === "End") next = ARTICLE_EDITOR_PEEK_MAX_FRACTION_V3;
          if (next === null) return;
          event.preventDefault();
          const clamped = clampArticleEditorPeekFractionV3(next);
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
        data-testid="article-editor-peek-column-v3"
        inert={!peekOpen}
      >
        <div
          ref={setPeekPortalHost}
          className="article-reader-peek-host h-full"
          data-testid="article-editor-peek-host-v3"
        />
      </aside>

      {selectedPeek !== null && (
        <div className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden="true">
          <ArticleReaderExperimentV3
            block={selectedPeek.block}
            snapshot={selectedPeek.snapshot}
            contract={compositionBySnapshotId.get(
              selectedPeek.snapshot.snapshotId,
            )?.contract ?? null}
            runtimeComposition={compositionBySnapshotId.get(
              selectedPeek.snapshot.snapshotId,
            ) ?? null}
            live
            expandedPresentation="peek"
            peekPortalHost={peekPortalHost}
            onActivate={() => undefined}
            onDeactivate={() => undefined}
            onClose={closeEditorPeekV3}
            onExpand={(presentation) => {
              if (presentation !== "fullscreen") return;
              startArticleExperimentSessionV3({
                insertionIndex: selectedPeek.index,
                replacementBlockId: selectedPeek.block.blockId,
                snapshotId: selectedPeek.block.placement.snapshotId,
                briefing: selectedPeek.block.placement.briefing,
              });
            }}
            onTitleCommit={(title) => {
              const normalized = title.trim();
              const fallback = selectedPeek.block.placement.briefing.defaultTitle;
              updateBlock(selectedPeek.index, Object.freeze({
                ...selectedPeek.block,
                placement: Object.freeze({
                  ...selectedPeek.block.placement,
                  titleOverride:
                    normalized.length === 0 || normalized === fallback
                      ? null
                      : normalized,
                }),
              }));
            }}
          />
        </div>
      )}
      </div>

      <ArticleSnapshotPickerDialogV3
        open={pickerOpen}
        snapshots={snapshotPickerItems}
        onCreateExperiment={createExperimentFromArticleV3}
        onClose={() => {
          pendingExperimentInsertIndexRef.current = null;
          pendingExperimentReplacementBlockIdRef.current = null;
          setPickerOpen(false);
        }}
        onSelect={selectSnapshotForArticleV3}
      />
    </div>
  );
}

function ArticleTextBlockV3({
  block,
  focusRequested,
  onChange,
  onDeleteEmpty,
  onFocusHandled,
  onOpenInsertMenu,
  onSplit,
}: Readonly<{
  block: Exclude<StudioArticleBlockV2, StudioArticleExperimentBlockV2>;
  focusRequested: boolean;
  onChange: (block: Exclude<StudioArticleBlockV2, StudioArticleExperimentBlockV2>) => void;
  onDeleteEmpty: () => void;
  onFocusHandled: () => void;
  onOpenInsertMenu: () => void;
  onSplit: (offset: number) => void;
}>) {
  const { t } = useTranslation();
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useLayoutEffect(() => {
    const element = textareaRef.current;
    if (element === null) return;
    element.style.height = "0px";
    element.style.height = `${Math.max(element.scrollHeight, block.kind === "heading" ? 52 : 48)}px`;
  }, [block.kind, block.text]);

  React.useEffect(() => {
    if (!focusRequested) return;
    const element = textareaRef.current;
    if (element !== null) {
      element.focus();
      element.setSelectionRange(element.value.length, element.value.length);
    }
    onFocusHandled();
  }, [focusRequested, onFocusHandled]);

  return (
    <div className="relative py-1" data-article-block-kind={block.kind}>
      <textarea
        ref={textareaRef}
        rows={1}
        value={block.text}
        onChange={(event) => onChange({ ...block, text: event.currentTarget.value })}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSplit(event.currentTarget.selectionStart ?? block.text.length);
            return;
          }
          if (event.key === "Backspace" && block.text.length === 0) {
            event.preventDefault();
            onDeleteEmpty();
            return;
          }
          if (event.key === "/" && block.text.length === 0) {
            event.preventDefault();
            onOpenInsertMenu();
          }
        }}
        placeholder={block.kind === "heading"
          ? t("articleEditor.headingPlaceholder")
          : t("articleEditor.paragraphPlaceholder")}
        aria-label={block.kind === "heading"
          ? t("articleEditor.heading")
          : t("articleEditor.paragraph")}
        className={`block w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-wb-subtle ${block.kind === "heading"
          ? "text-2xl font-bold leading-[1.35] tracking-tight"
          : "text-[15px] leading-7 text-wb-muted focus:text-wb-text"}`}
      />
    </div>
  );
}

function ArticleBlockShellV3({
  blockId,
  blockKind,
  children,
  index,
  total,
  insertMenuOpen,
  blockMenuOpen,
  onToggleInsertMenu,
  onToggleBlockMenu,
  onInsertHeading,
  onInsertParagraph,
  onInsertExperiment,
  onMove,
  onRemove,
  onDragStart,
  onDrop,
}: Readonly<{
  blockId: string;
  blockKind: StudioArticleBlockV2["kind"];
  children: React.ReactNode;
  index: number;
  total: number;
  insertMenuOpen: boolean;
  blockMenuOpen: boolean;
  onToggleInsertMenu: () => void;
  onToggleBlockMenu: () => void;
  onInsertHeading: () => void;
  onInsertParagraph: () => void;
  onInsertExperiment: () => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDrop: () => void;
}>) {
  const { t } = useTranslation();
  return (
    <div
      className={`group/article-block relative -ml-10 pl-10 ${blockKind === "experiment" ? "my-7" : "my-3"}`}
      data-article-block-id={blockId}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
    >
      <div
        className="absolute left-0 top-1 z-30 flex items-center text-wb-subtle opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-focus-within/article-block:opacity-100 sm:group-hover/article-block:opacity-100"
        data-article-block-menu
      >
        <button
          type="button"
          aria-label={t("articleEditor.addBlock")}
          aria-haspopup="menu"
          aria-expanded={insertMenuOpen}
          title={t("articleEditor.addBlock")}
          onClick={onToggleInsertMenu}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          draggable
          aria-label={t("articleEditor.blockHandle")}
          aria-haspopup="menu"
          aria-expanded={blockMenuOpen}
          title={t("articleEditor.blockHandle")}
          onClick={onToggleBlockMenu}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", blockId);
            onDragStart();
          }}
          className="inline-flex h-7 w-6 cursor-grab items-center justify-center rounded-md transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:cursor-grabbing active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        {insertMenuOpen && (
          <ArticleBlockTypeMenuV3
            className="left-0 top-8"
            onInsertHeading={onInsertHeading}
            onInsertParagraph={onInsertParagraph}
            onInsertExperiment={onInsertExperiment}
          />
        )}
        {blockMenuOpen && (
          <div
            className="absolute left-7 top-8 z-40 w-44 rounded-xl bg-wb-panel p-1.5 text-xs shadow-[0_16px_48px_rgba(0,0,0,0.22)] ring-1 ring-wb-line/70"
            role="menu"
            aria-label={t("articleEditor.blockHandle")}
          >
            <BlockMenuActionV3
              autoFocus
              disabled={index === 0}
              label={t("articleEditor.moveUp")}
              onClick={() => onMove(-1)}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </BlockMenuActionV3>
            <BlockMenuActionV3
              disabled={index === total - 1}
              label={t("articleEditor.moveDown")}
              onClick={() => onMove(1)}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </BlockMenuActionV3>
            <BlockMenuActionV3
              danger
              label={t("articleEditor.removeBlock")}
              onClick={onRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </BlockMenuActionV3>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function ArticleBlockInsertionV3({
  empty,
  index,
  open,
  onToggle,
  onInsertHeading,
  onInsertParagraph,
  onInsertExperiment,
}: Readonly<{
  empty: boolean;
  index: number;
  open: boolean;
  onToggle: () => void;
  onInsertHeading: () => void;
  onInsertParagraph: () => void;
  onInsertExperiment: () => void;
}>) {
  const { t } = useTranslation();
  return (
    <div
      className={`relative mt-3 -ml-10 pl-10 ${empty ? "py-10" : "py-3"}`}
      data-article-block-menu
      data-insertion-index={index}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs text-wb-subtle transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
      >
        <Plus className="h-4 w-4" />
        <span>{empty ? t("articleEditor.slashHint") : t("articleEditor.addBlock")}</span>
      </button>
      {open && (
        <ArticleBlockTypeMenuV3
          className="left-10 top-12"
          onInsertHeading={onInsertHeading}
          onInsertParagraph={onInsertParagraph}
          onInsertExperiment={onInsertExperiment}
        />
      )}
    </div>
  );
}

function ArticleBlockTypeMenuV3({
  className,
  onInsertHeading,
  onInsertParagraph,
  onInsertExperiment,
}: Readonly<{
  className: string;
  onInsertHeading: () => void;
  onInsertParagraph: () => void;
  onInsertExperiment: () => void;
}>) {
  const { t } = useTranslation();
  return (
    <div
      className={`absolute z-50 w-52 rounded-xl bg-wb-panel p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.22)] ring-1 ring-wb-line/70 ${className}`}
      role="menu"
      aria-label={t("articleEditor.addBlock")}
    >
      <BlockMenuActionV3
        autoFocus
        label={t("articleEditor.addParagraph")}
        onClick={onInsertParagraph}
      >
        <Pilcrow className="h-4 w-4" />
      </BlockMenuActionV3>
      <BlockMenuActionV3
        label={t("articleEditor.addHeading")}
        onClick={onInsertHeading}
      >
        <Heading2 className="h-4 w-4" />
      </BlockMenuActionV3>
      <BlockMenuActionV3
        label={t("articleEditor.addExperiment")}
        onClick={onInsertExperiment}
      >
        <FlaskConical className="h-4 w-4" />
      </BlockMenuActionV3>
    </div>
  );
}

function BlockMenuActionV3({
  autoFocus = false,
  children,
  danger = false,
  disabled = false,
  label,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  autoFocus?: boolean;
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      autoFocus={autoFocus}
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs transition-[color,background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${danger ? "text-wb-danger" : "text-wb-muted hover:text-wb-text"}`}
    >
      {children}
      {label}
    </button>
  );
}

export function insertArticleBlockV3(
  blocks: readonly StudioArticleBlockV2[],
  index: number,
  block: StudioArticleBlockV2,
): readonly StudioArticleBlockV2[] {
  const insertionIndex = Math.max(0, Math.min(index, blocks.length));
  const next = [...blocks];
  next.splice(insertionIndex, 0, block);
  return Object.freeze(next);
}

function createEmptyArticleDraftV3(locale: string, title: string): StudioArticleDraftV2 {
  return Object.freeze({
    schemaId: STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
    articleId: portableEditorIdV3("article"),
    draftVersion: 0,
    visibility: "draft",
    locale,
    title,
    blocks: Object.freeze([]),
  });
}

function normalizeArticleDraftV3(draft: StudioArticleDraftV2): StudioArticleDraftV2 {
  return {
    ...draft,
    title: draft.title.trim(),
    blocks: draft.blocks.map((block) => {
      if (block.kind === "heading" || block.kind === "paragraph") {
        return { ...block, text: block.text.trim() };
      }
      const caption = block.placement.caption?.trim() ?? "";
      const titleOverride = block.placement.titleOverride?.trim() ?? "";
      return {
        ...block,
        placement: {
          ...block.placement,
          titleOverride: titleOverride.length === 0 ? null : titleOverride,
          caption: caption.length === 0 ? null : caption,
        },
      };
    }),
  };
}

function snapshotPickerItemFromSnapshotV3(
  snapshot: ExperimentSnapshotV2,
): ArticleSnapshotPickerItemV3 {
  return Object.freeze({
    snapshotId: snapshot.snapshotId,
    title: snapshot.content.scenarios[0]?.label ?? "Untitled",
    createdAt: snapshot.createdAt,
    paneCount: snapshot.content.surface.graphPanes.length
      + snapshot.content.surface.outputPanes.length
      + snapshot.content.surface.controlPanes.length,
  });
}

function errorMessageV3(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function publicArticleSlugV3(articleId: string): string {
  return `article-${articleId.toLocaleLowerCase()}`;
}

export default ArticleEditorV3Page;
