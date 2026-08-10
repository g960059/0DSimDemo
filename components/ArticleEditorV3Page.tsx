import React from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FlaskConical,
  Globe,
  GripVertical,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Loader2,
  Minus,
  Pilcrow,
  Plus,
  Search,
  Sigma,
  Trash2,
  Upload,
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
  articleReaderHref,
  myArticlesHref,
  newExperimentHref,
} from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import { ArticleExperimentPlacementV3 } from "@/components/article/ArticleExperimentPlacementV3";
import {
  ArticleDividerPresentationV3,
  ArticleEquationPresentationV3,
  ArticleImagePresentationV3,
} from "@/components/article/ArticleRichBlockV3";
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
  type StudioArticleEquationBlockV2,
  type StudioArticleHeadingBlockV2,
  type StudioArticleImageBlockV2,
  type StudioArticleParagraphBlockV2,
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

/** Notion-style continuous persistence: edits commit shortly after the pause. */
export const ARTICLE_EDITOR_AUTOSAVE_DELAY_MS_V3 = 1000;

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

/**
 * Reconciles a durable save with the Draft as it stands when the save
 * resolves. Autosave runs while the author keeps typing, so edits made during
 * the round-trip must never be replaced by the persisted (older) content.
 * The durable identity and concurrency version are always adopted.
 */
export function adoptSavedArticleDraftV3(input: Readonly<{
  saved: StudioArticleDraftV2;
  candidate: StudioArticleDraftV2;
  current: StudioArticleDraftV2;
}>): Readonly<{ draft: StudioArticleDraftV2; clean: boolean }> {
  if (input.current === input.candidate) {
    return Object.freeze({ draft: input.saved, clean: true });
  }
  return Object.freeze({
    draft: Object.freeze({
      ...input.current,
      articleId: input.saved.articleId,
      draftVersion: input.saved.draftVersion,
    }),
    clean: false,
  });
}

/**
 * Markdown-style prefixes convert a Paragraph while typing:
 * `# ` becomes a section heading, `## ` becomes a subheading.
 * The Article title itself plays the H1 role, so levels start at 2.
 */
export function articleHeadingShortcutV3(
  text: string,
): Readonly<{ level: 2 | 3; rest: string }> | null {
  if (text.startsWith("## ")) {
    return Object.freeze({ level: 3 as const, rest: text.slice(3) });
  }
  if (text.startsWith("# ")) {
    return Object.freeze({ level: 2 as const, rest: text.slice(2) });
  }
  return null;
}

/** Maps a pointer position over a block to the boundary it targets. */
export function articleBlockDropBoundaryV3(
  index: number,
  rectTop: number,
  rectHeight: number,
  clientY: number,
): number {
  return clientY < rectTop + rectHeight / 2 ? index : index + 1;
}

/**
 * Moves a block to a document boundary (0..blocks.length), the drag-and-drop
 * insertion-line semantic. Returns the same array when nothing changes.
 */
export function moveArticleBlockToBoundaryV3(
  blocks: readonly StudioArticleBlockV2[],
  blockId: string,
  boundary: number,
): readonly StudioArticleBlockV2[] {
  const sourceIndex = blocks.findIndex((block) => block.blockId === blockId);
  if (sourceIndex < 0) return blocks;
  const clamped = Math.max(0, Math.min(boundary, blocks.length));
  const targetIndex = clamped > sourceIndex ? clamped - 1 : clamped;
  if (targetIndex === sourceIndex) return blocks;
  const next = [...blocks];
  const [moved] = next.splice(sourceIndex, 1);
  if (moved === undefined) return blocks;
  next.splice(targetIndex, 0, moved);
  return Object.freeze(next);
}

export function filterArticleInsertOptionsV3<Option extends Readonly<{
  label: string;
  keywords: readonly string[];
}>>(options: readonly Option[], query: string): readonly Option[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return options;
  return options.filter((option) =>
    option.label.toLowerCase().includes(normalized)
    || option.keywords.some((keyword) =>
        keyword.toLowerCase().includes(normalized)));
}

/** IME confirmation keys are text input, never editor commands. */
export function articleEditorInputIsComposingV3(input: Readonly<{
  isComposing?: boolean;
  keyCode?: number;
}>): boolean {
  return input.isComposing === true || input.keyCode === 229;
}

export function articleEditorSaveScopeIsCurrentV3(input: Readonly<{
  currentGeneration: number;
  currentRouteKey: string;
  mounted: boolean;
  startedGeneration: number;
  startedRouteKey: string;
}>): boolean {
  return input.mounted
    && input.currentGeneration === input.startedGeneration
    && input.currentRouteKey === input.startedRouteKey;
}

export function articleEditorRetryActionV3(input: Readonly<{
  alreadyPersisted: boolean;
  hasUnsaved: boolean;
  routeHydrated: boolean;
}>): "dismiss-idle" | "dismiss-saved" | "reload" | "save" {
  if (!input.routeHydrated) return "reload";
  if (input.hasUnsaved) return "save";
  return input.alreadyPersisted ? "dismiss-saved" : "dismiss-idle";
}

/**
 * Splits around the complete browser selection. A selected range is replaced
 * by the block boundary, matching a conventional text editor's Enter key.
 */
export function splitArticleTextSelectionV3(input: Readonly<{
  text: string;
  selectionStart: number;
  selectionEnd: number;
}>): Readonly<{ before: string; after: string }> {
  const start = Math.max(0, Math.min(
    input.selectionStart,
    input.selectionEnd,
    input.text.length,
  ));
  const end = Math.max(start, Math.min(
    Math.max(input.selectionStart, input.selectionEnd),
    input.text.length,
  ));
  return Object.freeze({
    before: input.text.slice(0, start),
    after: input.text.slice(end),
  });
}

type ArticleTextBlockKindV3 = "paragraph" | "heading" | "subheading";
type StudioArticleTextBlockV2 =
  | StudioArticleHeadingBlockV2
  | StudioArticleParagraphBlockV2;

function isArticleTextBlockV3(
  block: StudioArticleBlockV2,
): block is StudioArticleTextBlockV2 {
  return block.kind === "heading" || block.kind === "paragraph";
}

type ArticleInsertMenuStateV3 = Readonly<{
  anchorBlockId: string;
  insertionIndex: number;
  replaceBlockId: string | null;
}>;

type ArticleEditorFocusRequestV3 = Readonly<{
  blockId: string;
  caret: "start" | "end" | number;
}>;

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
  const routeArticleIdRef = React.useRef(routeArticleId);
  routeArticleIdRef.current = routeArticleId;
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
  const hasUnsavedRef = React.useRef(false);
  const saveChainRef = React.useRef<Promise<unknown>>(Promise.resolve());
  const saveScopeRef = React.useRef({
    generation: 0,
    mounted: true,
    routeKey: articleEditorRouteKeyV3(routeArticleId),
  });
  const [error, setError] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [insertMenu, setInsertMenu] =
    React.useState<ArticleInsertMenuStateV3 | null>(null);
  const [blockMenuId, setBlockMenuId] = React.useState<string | null>(null);
  const [publishMenuOpen, setPublishMenuOpen] = React.useState(false);
  const [draggedBlockId, setDraggedBlockId] = React.useState<string | null>(null);
  const [dropBoundary, setDropBoundary] = React.useState<number | null>(null);
  const [focusRequest, setFocusRequest] =
    React.useState<ArticleEditorFocusRequestV3 | null>(null);
  const pendingExperimentInsertIndexRef = React.useRef<number | null>(null);
  const pendingExperimentReplacementBlockIdRef = React.useRef<string | null>(null);
  const pendingReturnedSnapshotIdRef = React.useRef<string | null>(null);
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
  const [peekMaximized, setPeekMaximized] = React.useState(false);

  const saveRouteKey = articleEditorRouteKeyV3(routeArticleId);
  React.useLayoutEffect(() => {
    const scope = saveScopeRef.current;
    scope.generation += 1;
    scope.mounted = true;
    scope.routeKey = saveRouteKey;
    return () => {
      scope.generation += 1;
      scope.mounted = false;
    };
  }, [saveRouteKey]);
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
    setPeekMaximized(false);
    setPeekBlockId(blockId);
  }, [cancelPeekCloseTimer]);

  const closeEditorPeekV3 = React.useCallback(() => {
    setPeekMaximized(false);
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
    setPeekMaximized(false);
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
      hasUnsavedRef.current = false;
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
    if (next === draftRef.current) return;
    draftRef.current = next;
    setDraft(next);
    setStatus("dirty");
    hasUnsavedRef.current = true;
    setHasUnsavedArticleChanges(true);
    setError(null);
  }, []);

  const performSaveV3 = React.useCallback(async ():
    Promise<StudioArticleDraftV2 | null> => {
    if (!articleEditorRouteHydratedV3(
      hydratedRouteKeyRef.current,
      routeArticleIdRef.current,
    )) return null;
    const startedRouteKey = articleEditorRouteKeyV3(
      routeArticleIdRef.current,
    );
    const startedGeneration = saveScopeRef.current.generation;
    const saveStillBelongsToThisRouteV3 = () => {
      const scope = saveScopeRef.current;
      return articleEditorSaveScopeIsCurrentV3({
        currentGeneration: scope.generation,
        currentRouteKey: articleEditorRouteKeyV3(routeArticleIdRef.current),
        mounted: scope.mounted,
        startedGeneration,
        startedRouteKey,
      }) && scope.routeKey === startedRouteKey;
    };
    const candidate = draftRef.current;
    const alreadyPersisted = remoteRepository !== null
      ? remoteSavedArticleIdRef.current !== null
      : store.readArticle(candidate.articleId) !== null;
    if (!hasUnsavedRef.current && alreadyPersisted) {
      setStatus("saved");
      setError(null);
      return candidate;
    }
    setStatus("saving");
    setError(null);
    let remotelySaved: StudioArticleDraftV2 | null = null;
    try {
      let saved: StudioArticleDraftV2;
      if (remoteRepository !== null) {
        const persistedArticleId = remoteSavedArticleIdRef.current;
        const normalized = prepareArticleDraftForSaveV3(candidate);
        saved = await remoteRepository.saveArticle({
          articleId: persistedArticleId,
          expectedVersion: persistedArticleId === null
            ? null
            : candidate.draftVersion,
          article: normalized,
        });
        if (!saveStillBelongsToThisRouteV3()) return null;
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
        if (!saveStillBelongsToThisRouteV3()) return null;
        saved = publication.article;
        remotelySaved = publication.article;
        remotePublishedRef.current = publication.published;
      } else {
        const isInitialSave = store.readArticle(candidate.articleId) === null;
        const normalized = prepareArticleDraftForSaveV3({
          ...candidate,
          draftVersion: isInitialSave ? 0 : candidate.draftVersion + 1,
        });
        saved = store.saveArticle(normalized);
      }
      if (!saveStillBelongsToThisRouteV3()) return null;
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
      // The author may have kept typing while the save round-trip was in
      // flight. Never replace those newer edits with the persisted content.
      const adoption = adoptSavedArticleDraftV3({
        saved,
        candidate,
        current: draftRef.current,
      });
      draftRef.current = adoption.draft;
      setDraft(adoption.draft);
      setStatus(adoption.clean ? "saved" : "dirty");
      hasUnsavedRef.current = !adoption.clean;
      setHasUnsavedArticleChanges(!adoption.clean);
      if (routeArticleIdRef.current !== saved.articleId) {
        // Claim the canonical route as already hydrated so the route effect
        // keeps the in-memory Draft instead of re-reading (and replacing) it.
        hydratedRouteKeyRef.current = saved.articleId;
        setHydratedRouteKey(saved.articleId);
        navigate(articleEditorHref({ articleId: saved.articleId, locale }), {
          replace: true,
        });
      }
      return saved;
    } catch (cause) {
      if (!saveStillBelongsToThisRouteV3()) return null;
      if (remotelySaved !== null) {
        const adoption = adoptSavedArticleDraftV3({
          saved: remotelySaved,
          candidate,
          current: draftRef.current,
        });
        const adopted = Object.freeze({
          ...adoption.draft,
          // Keep the author's requested visibility visible. The error state
          // communicates that moving the publication pointer is still
          // pending; the Article body itself is already durable.
          visibility: draftRef.current.visibility,
        }) satisfies StudioArticleDraftV2;
        draftRef.current = adopted;
        setDraft(adopted);
        hasUnsavedRef.current = true;
        setHasUnsavedArticleChanges(true);
        if (routeArticleIdRef.current !== adopted.articleId) {
          hydratedRouteKeyRef.current = adopted.articleId;
          setHydratedRouteKey(adopted.articleId);
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
    remoteRepository,
    store,
  ]);

  /** All saves share one serialized chain so autosave and explicit saves never interleave. */
  const saveDraft = React.useCallback((): Promise<StudioArticleDraftV2 | null> => {
    const run = saveChainRef.current.then(() => performSaveV3());
    saveChainRef.current = run;
    return run;
  }, [performSaveV3]);

  React.useEffect(() => {
    if (status !== "dirty" || !routeHydrated) return undefined;
    const timer = window.setTimeout(() => {
      void saveDraft();
    }, ARTICLE_EDITOR_AUTOSAVE_DELAY_MS_V3);
    return () => window.clearTimeout(timer);
  }, [draft, routeHydrated, saveDraft, status]);

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
          || (isArticleTextBlockV3(replacement) && replacement.text.length === 0)
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
  const discardUnsavedArticleV3 = React.useCallback(() => {
    // A save that was already in flight may still complete after the author
    // confirms navigation. Invalidate its UI scope immediately so it cannot
    // adopt the old Draft or navigate back to the canonical Article route.
    saveScopeRef.current.generation += 1;
    discardPendingReturnedSnapshotV3();
  }, [discardPendingReturnedSnapshotV3]);
  useUnsavedChangesGuardV3({
    enabled: hasUnsavedArticleChanges,
    message: t("common.unsavedChanges"),
    onConfirmedDiscard: discardUnsavedArticleV3,
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
        void saveDraft();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveDraft]);

  const closeInsertMenuV3 = React.useCallback((restoreFocus: boolean) => {
    if (insertMenu === null) return;
    if (restoreFocus && insertMenu.replaceBlockId !== null) {
      setFocusRequest({ blockId: insertMenu.replaceBlockId, caret: "end" });
    }
    setInsertMenu(null);
  }, [insertMenu]);

  React.useEffect(() => {
    if (insertMenu === null && blockMenuId === null && !publishMenuOpen) return;
    const closeMenus = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-article-block-menu]")) {
        return;
      }
      setInsertMenu(null);
      setBlockMenuId(null);
      setPublishMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeInsertMenuV3(true);
      setBlockMenuId(null);
      setPublishMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeMenus);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [blockMenuId, closeInsertMenuV3, insertMenu, publishMenuOpen]);

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

  const insertTextBlockV3 = (
    kind: ArticleTextBlockKindV3,
    insertionIndex: number,
    replaceBlockId: string | null,
  ) => {
    const blockId = portableEditorIdV3("block");
    let focusTargetId = blockId;
    updateDraft((current) => {
      const template = kind === "paragraph"
        ? { blockId, kind: "paragraph" as const, text: "" }
        : {
            blockId,
            kind: "heading" as const,
            level: kind === "heading" ? 2 as const : 3 as const,
            text: "",
          };
      if (replaceBlockId !== null) {
        const replacementIndex = current.blocks.findIndex((candidate) =>
          candidate.blockId === replaceBlockId);
        const replacement = current.blocks[replacementIndex];
        if (
          replacementIndex >= 0
          && replacement !== undefined
          && isArticleTextBlockV3(replacement)
          && replacement.text.length === 0
        ) {
          focusTargetId = replacement.blockId;
          const blocks = [...current.blocks];
          blocks[replacementIndex] = { ...template, blockId: replacement.blockId };
          return { ...current, blocks };
        }
      }
      return {
        ...current,
        blocks: insertArticleBlockV3(current.blocks, insertionIndex, template),
      };
    });
    setFocusRequest({ blockId: focusTargetId, caret: "end" });
  };

  const insertRichArticleBlockV3 = (
    kind: "equation" | "image" | "divider",
    insertionIndex: number,
    replaceBlockId: string | null,
  ) => {
    const generatedBlockId = portableEditorIdV3("block");
    const template: StudioArticleBlockV2 = kind === "equation"
      ? { blockId: generatedBlockId, kind, expression: "" }
      : kind === "image"
        ? {
            blockId: generatedBlockId,
            kind,
            url: "",
            altText: "",
            caption: "",
          }
        : { blockId: generatedBlockId, kind };
    let insertedBlockId = generatedBlockId;
    let trailingParagraphId: string | null = null;
    updateDraft((current) => {
      let blocks = [...current.blocks];
      let resolvedIndex = Math.max(0, Math.min(insertionIndex, blocks.length));
      if (replaceBlockId !== null) {
        const replacementIndex = blocks.findIndex((candidate) =>
          candidate.blockId === replaceBlockId);
        const replacement = blocks[replacementIndex];
        if (
          replacementIndex >= 0
          && replacement !== undefined
          && isArticleTextBlockV3(replacement)
          && replacement.text.length === 0
        ) {
          insertedBlockId = replacement.blockId;
          blocks[replacementIndex] = { ...template, blockId: replacement.blockId };
          resolvedIndex = replacementIndex + 1;
        } else {
          blocks.splice(resolvedIndex, 0, template);
          resolvedIndex += 1;
        }
      } else {
        blocks.splice(resolvedIndex, 0, template);
        resolvedIndex += 1;
      }
      if (kind === "divider") {
        trailingParagraphId = portableEditorIdV3("block");
        blocks.splice(resolvedIndex, 0, {
          blockId: trailingParagraphId,
          kind: "paragraph",
          text: "",
        });
      }
      return { ...current, blocks: Object.freeze(blocks) };
    });
    setFocusRequest({
      blockId: trailingParagraphId ?? insertedBlockId,
      caret: "start",
    });
  };

  const convertTextBlockV3 = (blockId: string, target: ArticleTextBlockKindV3) => {
    updateDraft((current) => {
      const index = current.blocks.findIndex((candidate) =>
        candidate.blockId === blockId);
      const block = current.blocks[index];
      if (block === undefined || !isArticleTextBlockV3(block)) return current;
      const converted: StudioArticleBlockV2 = target === "paragraph"
        ? { blockId: block.blockId, kind: "paragraph", text: block.text }
        : {
            blockId: block.blockId,
            kind: "heading",
            level: target === "heading" ? 2 : 3,
            text: block.text,
          };
      if (
        converted.kind === block.kind
        && (converted.kind === "paragraph"
          || (block.kind === "heading" && converted.level === block.level))
      ) return current;
      const blocks = [...current.blocks];
      blocks[index] = converted;
      return { ...current, blocks };
    });
    setBlockMenuId(null);
    setFocusRequest({ blockId, caret: "end" });
  };

  const applyHeadingShortcutV3 = (
    index: number,
    blockId: string,
    shortcut: Readonly<{ level: 2 | 3; rest: string }>,
  ) => {
    updateDraft((current) => {
      const block = current.blocks[index];
      if (block === undefined || block.kind !== "paragraph") return current;
      const blocks = [...current.blocks];
      blocks[index] = {
        blockId: block.blockId,
        kind: "heading",
        level: shortcut.level,
        text: shortcut.rest,
      };
      return { ...current, blocks };
    });
    setFocusRequest({ blockId, caret: "end" });
  };

  const splitTextBlock = (
    index: number,
    selectionStart: number,
    selectionEnd: number,
  ) => {
    const nextBlockId = portableEditorIdV3("block");
    updateDraft((current) => {
      const currentBlock = current.blocks[index];
      if (
        currentBlock === undefined
        || !isArticleTextBlockV3(currentBlock)
      ) return current;
      const { before, after } = splitArticleTextSelectionV3({
        text: currentBlock.text,
        selectionStart,
        selectionEnd,
      });
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
    setFocusRequest({ blockId: nextBlockId, caret: "start" });
  };

  const removeEmptyTextBlock = (index: number) => {
    const previous = draftRef.current.blocks[index - 1];
    removeBlock(index);
    if (previous !== undefined && isArticleTextBlockV3(previous)) {
      setFocusRequest({ blockId: previous.blockId, caret: "end" });
    }
  };

  const mergeTextBlockIntoPreviousV3 = (index: number) => {
    const blocks = draftRef.current.blocks;
    const block = blocks[index];
    const previous = blocks[index - 1];
    if (
      block === undefined || !isArticleTextBlockV3(block)
      || previous === undefined || !isArticleTextBlockV3(previous)
    ) return;
    const caret = previous.text.length;
    updateDraft((current) => {
      const mergeBlock = current.blocks[index];
      const mergeTarget = current.blocks[index - 1];
      if (
        mergeBlock === undefined || !isArticleTextBlockV3(mergeBlock)
        || mergeTarget === undefined || !isArticleTextBlockV3(mergeTarget)
      ) return current;
      const merged = [...current.blocks];
      merged[index - 1] = {
        ...mergeTarget,
        text: mergeTarget.text + mergeBlock.text,
      };
      merged.splice(index, 1);
      return { ...current, blocks: merged };
    });
    setFocusRequest({ blockId: previous.blockId, caret });
  };

  const focusNearestTextBlockV3 = (fromIndex: number, direction: -1 | 1) => {
    const blocks = draftRef.current.blocks;
    for (
      let index = fromIndex + direction;
      index >= 0 && index < blocks.length;
      index += direction
    ) {
      const candidate = blocks[index];
      if (candidate !== undefined && isArticleTextBlockV3(candidate)) {
        setFocusRequest({
          blockId: candidate.blockId,
          caret: direction === -1 ? "end" : "start",
        });
        return;
      }
    }
  };

  const startWritingAtEndV3 = () => {
    const blocks = draftRef.current.blocks;
    const last = blocks[blocks.length - 1];
    if (
      last !== undefined
      && isArticleTextBlockV3(last)
      && last.text.length === 0
    ) {
      setFocusRequest({ blockId: last.blockId, caret: "end" });
      return;
    }
    insertTextBlockV3("paragraph", blocks.length, null);
  };

  const openInsertMenuFromSlashV3 = (index: number, blockId: string) => {
    setBlockMenuId(null);
    setInsertMenu({
      anchorBlockId: blockId,
      insertionIndex: index,
      replaceBlockId: blockId,
    });
  };

  const handleInsertOptionV3 = (kind: ArticleInsertOptionKindV3) => {
    if (insertMenu === null) return;
    if (kind === "experiment") {
      pendingExperimentInsertIndexRef.current = insertMenu.insertionIndex;
      pendingExperimentReplacementBlockIdRef.current = insertMenu.replaceBlockId;
      setInsertMenu(null);
      setPickerOpen(true);
      return;
    }
    if (kind === "paragraph" || kind === "heading" || kind === "subheading") {
      insertTextBlockV3(kind, insertMenu.insertionIndex, insertMenu.replaceBlockId);
    } else {
      insertRichArticleBlockV3(
        kind,
        insertMenu.insertionIndex,
        insertMenu.replaceBlockId,
      );
    }
    setInsertMenu(null);
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

  const setArticleVisibilityV3 = (visibility: "draft" | "public") => {
    updateDraft((current) => current.visibility === visibility
      ? current
      : { ...current, visibility });
    void saveDraft();
  };

  const retryEditorErrorV3 = React.useCallback(() => {
    const alreadyPersisted = remoteRepository !== null
      ? remoteSavedArticleIdRef.current !== null
      : store.readArticle(draftRef.current.articleId) !== null;
    const action = articleEditorRetryActionV3({
      alreadyPersisted,
      hasUnsaved: hasUnsavedRef.current,
      routeHydrated,
    });
    if (action === "reload") {
      window.location.reload();
    } else if (action === "save") {
      void saveDraft();
    } else {
      // Errors from optional operations (for example reading a selected
      // Snapshot) are not save failures. Dismiss them without creating or
      // rewriting an otherwise clean Article.
      setStatus(action === "dismiss-saved" ? "saved" : "idle");
      setError(null);
    }
  }, [remoteRepository, routeHydrated, saveDraft, store]);

  const commitBlockDropV3 = () => {
    if (draggedBlockId !== null && dropBoundary !== null) {
      const blockId = draggedBlockId;
      const boundary = dropBoundary;
      updateDraft((current) => {
        const blocks = moveArticleBlockToBoundaryV3(
          current.blocks,
          blockId,
          boundary,
        );
        return blocks === current.blocks ? current : { ...current, blocks };
      });
    }
    setDraggedBlockId(null);
    setDropBoundary(null);
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
  const draggedBlockIndex = draggedBlockId === null
    ? -1
    : draft.blocks.findIndex((block) => block.blockId === draggedBlockId);
  const visibleDropBoundary = dropBoundary !== null
    && draggedBlockIndex >= 0
    && dropBoundary !== draggedBlockIndex
    && dropBoundary !== draggedBlockIndex + 1
    ? dropBoundary
    : null;

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-wb-app text-wb-text"
      data-testid="article-editor-v3"
    >
      <header className="z-30 flex h-12 shrink-0 items-center gap-1 bg-wb-header px-2.5 shadow-[inset_0_-1px_0_var(--wb-border)] sm:px-4">
        <Link
          to={myArticlesHref(locale)}
          aria-label={t("articleReader.backToArticles")}
          title={t("articleReader.backToArticles")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <span className="min-w-0 flex-1" />
        <ArticleEditorSaveStatusV3
          persisted={persistedArticle}
          status={status}
          onRetry={retryEditorErrorV3}
        />
        {persistedArticle && (
          <a
            href={articleReaderHref({ articleId: draft.articleId, locale })}
            target="_blank"
            rel="noreferrer"
            aria-label={t("articleEditor.preview")}
            title={t("articleEditor.preview")}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        <ArticlePublishMenuV3
          articleHref={articleReaderHref({ articleId: draft.articleId, locale })}
          disabled={!routeHydrated}
          open={publishMenuOpen}
          saving={status === "saving"}
          visibility={draft.visibility}
          onToggleOpen={() => {
            setInsertMenu(null);
            setBlockMenuId(null);
            setPublishMenuOpen((current) => !current);
          }}
          onSetVisibility={setArticleVisibilityV3}
        />
      </header>

      <div
        ref={splitRef}
        className="article-reader-split relative flex min-h-0 flex-1 overflow-hidden"
        data-peek-mounted={peekBlockId === null ? "false" : "true"}
        data-peek-open={peekOpen ? "true" : "false"}
        data-peek-dragging={peekDragging ? "true" : "false"}
        data-peek-maximized={peekMaximized ? "true" : "false"}
        style={{
          "--article-reader-peek-width": peekMaximized
            ? "100%"
            : `${peekFraction * 100}%`,
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
            onKeyDown={(event) => {
              if (articleEditorInputIsComposingV3(event.nativeEvent)) return;
              if (event.key === "Enter") {
                event.preventDefault();
                const first = draftRef.current.blocks[0];
                if (first !== undefined && isArticleTextBlockV3(first)) {
                  setFocusRequest({ blockId: first.blockId, caret: "start" });
                } else {
                  insertTextBlockV3("paragraph", 0, null);
                }
                return;
              }
              if (event.key === "ArrowDown") {
                const blocks = draftRef.current.blocks;
                if (blocks.some(isArticleTextBlockV3)) {
                  event.preventDefault();
                  focusNearestTextBlockV3(-1, 1);
                }
              }
            }}
            placeholder={t("articleEditor.titlePlaceholder")}
            aria-label={t("articleEditor.title")}
            className="w-full bg-transparent text-3xl font-bold leading-tight tracking-[-0.025em] text-wb-text outline-none placeholder:text-wb-subtle sm:text-[2.5rem]"
          />

          {error !== null && (
            <p className="mt-6 rounded-xl bg-wb-danger-soft px-4 py-3 text-xs leading-5 text-wb-danger" role="alert">
              {error}
            </p>
          )}

          {routeHydrated
            && draft.blocks.length === 0
            && snapshotPickerItems.length === 0 && (
            <div className="mt-8 rounded-xl bg-wb-soft/60 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
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

          <div className="mt-6" data-testid="article-blocks-v3">
            {draft.blocks.map((block, index) => {
              const placementSnapshot = block.kind === "experiment"
                ? articleSnapshotById.get(block.placement.snapshotId) ?? null
                : null;
              const placementContract = placementSnapshot === null
                ? null
                : compositionBySnapshotId.get(placementSnapshot.snapshotId)
                    ?.contract ?? null;
              const previousBlock = draft.blocks[index - 1];
              const hasTextAbove = draft.blocks.slice(0, index)
                .some(isArticleTextBlockV3);
              const hasTextBelow = draft.blocks.slice(index + 1)
                .some(isArticleTextBlockV3);
              return (
                <ArticleBlockShellV3
                  key={block.blockId}
                  blockId={block.blockId}
                  blockKind={block.kind}
                  index={index}
                  total={draft.blocks.length}
                  insertMenuOpen={insertMenu?.anchorBlockId === block.blockId}
                  blockMenuOpen={blockMenuId === block.blockId}
                  dragging={draggedBlockId === block.blockId}
                  dropIndicator={visibleDropBoundary === index
                    ? "top"
                    : index === draft.blocks.length - 1
                        && visibleDropBoundary === draft.blocks.length
                      ? "bottom"
                      : null}
                  onOpenInsertMenu={() => {
                    setBlockMenuId(null);
                    setInsertMenu((current) =>
                      current?.anchorBlockId === block.blockId
                        ? null
                        : {
                            anchorBlockId: block.blockId,
                            insertionIndex: index + 1,
                            replaceBlockId: null,
                          });
                  }}
                  onSelectInsertOption={handleInsertOptionV3}
                  onCloseInsertMenu={() => closeInsertMenuV3(true)}
                  onToggleBlockMenu={() => {
                    setInsertMenu(null);
                    setBlockMenuId((current) => current === block.blockId
                      ? null
                      : block.blockId);
                  }}
                  convertTarget={!isArticleTextBlockV3(block)
                    ? null
                    : block.kind === "paragraph"
                      ? "paragraph"
                      : block.level === 2 ? "heading" : "subheading"}
                  onConvert={(target) => convertTextBlockV3(block.blockId, target)}
                  onMove={(direction) => {
                    moveBlock(index, direction);
                    setBlockMenuId(null);
                  }}
                  onRemove={() => {
                    removeBlock(index);
                    setBlockMenuId(null);
                  }}
                  onDragStart={() => {
                    setInsertMenu(null);
                    setBlockMenuId(null);
                    setDraggedBlockId(block.blockId);
                  }}
                  onDragEnd={() => {
                    setDraggedBlockId(null);
                    setDropBoundary(null);
                  }}
                  onDragOverBoundary={(boundary) => {
                    if (draggedBlockId !== null) setDropBoundary(boundary);
                  }}
                  onDrop={commitBlockDropV3}
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
                  ) : block.kind === "equation" ? (
                    <ArticleEquationBlockEditorV3
                      block={block}
                      focus={focusRequest?.blockId === block.blockId}
                      onFocusHandled={() => setFocusRequest(null)}
                      onChange={(next) => updateBlock(index, next)}
                    />
                  ) : block.kind === "image" ? (
                    <ArticleImageBlockEditorV3
                      block={block}
                      focus={focusRequest?.blockId === block.blockId}
                      onFocusHandled={() => setFocusRequest(null)}
                      onChange={(next) => updateBlock(index, next)}
                      onUpload={remoteRepository === null
                        ? undefined
                        : (file) => remoteRepository.uploadArticleImage(file)}
                    />
                  ) : block.kind === "divider" ? (
                    <ArticleDividerPresentationV3 block={block} className="my-5" />
                  ) : (
                    <ArticleTextBlockV3
                      block={block}
                      focusCaret={focusRequest?.blockId === block.blockId
                        ? focusRequest.caret
                        : null}
                      onFocusHandled={() => setFocusRequest(null)}
                      onChange={(next) => updateBlock(index, next)}
                      onHeadingShortcut={(shortcut) =>
                        applyHeadingShortcutV3(index, block.blockId, shortcut)}
                      onDeleteEmpty={() => removeEmptyTextBlock(index)}
                      onMergeWithPrevious={
                        previousBlock !== undefined
                          && isArticleTextBlockV3(previousBlock)
                          ? () => mergeTextBlockIntoPreviousV3(index)
                          : undefined
                      }
                      onFocusPrevious={hasTextAbove
                        ? () => focusNearestTextBlockV3(index, -1)
                        : undefined}
                      onFocusNext={hasTextBelow
                        ? () => focusNearestTextBlockV3(index, 1)
                        : undefined}
                      onOpenInsertMenu={() =>
                        openInsertMenuFromSlashV3(index, block.blockId)}
                      onSplit={(selectionStart, selectionEnd) =>
                        splitTextBlock(index, selectionStart, selectionEnd)}
                    />
                  )}
                </ArticleBlockShellV3>
              );
            })}
          </div>

          <button
            type="button"
            aria-label={t("articleEditor.slashHint")}
            data-testid="article-end-writing-area-v3"
            onClick={startWritingAtEndV3}
            onDragOver={(event) => {
              if (draggedBlockId === null) return;
              event.preventDefault();
              setDropBoundary(draft.blocks.length);
            }}
            onDrop={(event) => {
              event.preventDefault();
              commitBlockDropV3();
            }}
            className={`block w-full cursor-text rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${draft.blocks.length === 0 ? "py-2" : "min-h-28 py-3"}`}
          >
            {draft.blocks.length === 0 && (
              <span className="text-[15px] leading-7 text-wb-subtle">
                {t("articleEditor.slashHint")}
              </span>
            )}
          </button>
        </article>
      </main>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t("articleReader.resizeExperiment")}
        aria-valuemin={Math.round(ARTICLE_EDITOR_PEEK_MIN_FRACTION_V3 * 100)}
        aria-valuemax={100}
        aria-valuenow={peekMaximized ? 100 : Math.round(peekFraction * 100)}
        tabIndex={peekOpen ? 0 : -1}
        className="article-reader-peek-divider group z-10 shrink-0 touch-none outline-none"
        data-testid="article-editor-peek-divider-v3"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          setPeekMaximized(false);
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
          if (event.key === "End") {
            event.preventDefault();
            setPeekMaximized(true);
            return;
          }
          let next: number | null = null;
          if (event.key === "ArrowLeft") {
            if (peekMaximized) return;
            next = peekFraction + 0.025;
          } else if (event.key === "ArrowRight") {
            setPeekMaximized(false);
            next = peekMaximized
              ? ARTICLE_EDITOR_PEEK_MAX_FRACTION_V3
              : peekFraction - 0.025;
          } else if (event.key === "Home") {
            setPeekMaximized(false);
            next = ARTICLE_EDITOR_PEEK_MIN_FRACTION_V3;
          }
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
        className="article-reader-peek-column min-w-0 shrink-0 overflow-hidden"
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
            peekMaximized={peekMaximized}
            onActivate={() => undefined}
            onDeactivate={() => undefined}
            onClose={closeEditorPeekV3}
            onExpand={() => undefined}
            onOpenExperimentSession={() => {
              void startArticleExperimentSessionV3({
                insertionIndex: selectedPeek.index,
                replacementBlockId: selectedPeek.block.blockId,
                snapshotId: selectedPeek.block.placement.snapshotId,
                briefing: selectedPeek.block.placement.briefing,
              });
            }}
            onPeekMaximizedChange={setPeekMaximized}
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

function ArticleEditorSaveStatusV3({
  persisted,
  status,
  onRetry,
}: Readonly<{
  persisted: boolean;
  status: EditorSaveStatusV3;
  onRetry: () => void;
}>) {
  const { t } = useTranslation();
  const label = status === "saving"
    ? t("articleEditor.status.saving")
    : status === "dirty"
      ? t("articleEditor.status.dirty")
      : status === "error"
        ? t("articleEditor.status.error")
        : persisted || status === "saved"
          ? t("articleEditor.status.saved")
          : "";
  return (
    <div
      role="status"
      data-testid="article-editor-status-v3"
      className={`flex min-w-0 shrink-0 items-center gap-1.5 px-1.5 text-[11px] ${status === "error" ? "text-wb-danger" : "text-wb-subtle"}`}
    >
      {status === "saving" && (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
      )}
      <span className="truncate">{label}</span>
      {status === "error" && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-md px-1.5 py-0.5 font-semibold text-wb-accent transition-[background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          {t("articleEditor.status.retry")}
        </button>
      )}
    </div>
  );
}

function ArticlePublishMenuV3({
  articleHref,
  disabled,
  open,
  saving,
  visibility,
  onToggleOpen,
  onSetVisibility,
}: Readonly<{
  articleHref: string;
  disabled: boolean;
  open: boolean;
  saving: boolean;
  visibility: "draft" | "public";
  onToggleOpen: () => void;
  onSetVisibility: (visibility: "draft" | "public") => void;
}>) {
  const { t } = useTranslation();
  const published = visibility === "public";
  return (
    <div className="relative shrink-0" data-article-block-menu>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={onToggleOpen}
        data-testid="article-publish-button-v3"
        className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-[color,background-color,transform] duration-150 active:scale-[0.97] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${published ? "text-wb-accent hover:bg-wb-accent-soft" : "bg-wb-primary text-white hover:bg-wb-primary-hover"}`}
      >
        {published ? (
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-wb-accent" />
        ) : (
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {published
          ? t("articleEditor.published")
          : t("articleEditor.publishMenu.label")}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={t("articleEditor.publishMenu.label")}
          data-testid="article-publish-menu-v3"
          className="absolute right-0 top-10 z-50 w-72 rounded-xl bg-wb-panel p-4 shadow-[0_16px_48px_rgba(0,0,0,0.22)] ring-1 ring-wb-line/70"
        >
          {published ? (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-wb-accent" />
                {t("articleEditor.publishMenu.publishedTitle")}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-wb-muted">
                {t("articleEditor.publishMenu.publishedDescription")}
              </p>
              <a
                href={articleHref}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-wb-soft px-3 text-xs font-semibold text-wb-text transition-[background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              >
                {t("articleEditor.publishMenu.view")}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <button
                type="button"
                disabled={saving}
                onClick={() => onSetVisibility("draft")}
                className="mt-2 inline-flex min-h-8 w-full items-center justify-center rounded-lg px-3 text-xs font-semibold text-wb-danger transition-[background-color,transform] duration-150 hover:bg-wb-danger-soft active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              >
                {saving
                  ? t("articleEditor.status.saving")
                  : t("articleEditor.publishMenu.unpublish")}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">
                {t("articleEditor.publishMenu.draftTitle")}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-wb-muted">
                {t("articleEditor.publishMenu.draftDescription")}
              </p>
              <button
                type="button"
                disabled={saving}
                onClick={() => onSetVisibility("public")}
                className="mt-3 inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-wb-primary px-3 text-xs font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-wb-primary-hover active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                {saving
                  ? t("articleEditor.status.saving")
                  : t("articleEditor.publishMenu.publish")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ArticleEquationBlockEditorV3({
  block,
  focus,
  onChange,
  onFocusHandled,
}: Readonly<{
  block: StudioArticleEquationBlockV2;
  focus: boolean;
  onChange: (block: StudioArticleEquationBlockV2) => void;
  onFocusHandled: () => void;
}>) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  React.useEffect(() => {
    if (!focus) return;
    inputRef.current?.focus();
    onFocusHandled();
  }, [focus, onFocusHandled]);
  return (
    <div
      className="my-3 rounded-xl bg-wb-soft/55 px-4 py-3.5 focus-within:bg-wb-soft"
      data-article-block-kind="equation"
    >
      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-wb-subtle">
        {t("articleEditor.equation.label")}
        <textarea
          ref={inputRef}
          rows={2}
          value={block.expression}
          onChange={(event) => onChange({
            ...block,
            expression: event.currentTarget.value,
          })}
          placeholder={t("articleEditor.equation.placeholder")}
          spellCheck={false}
          className="mt-2 block min-h-14 w-full resize-y bg-transparent font-mono text-sm font-normal normal-case leading-6 tracking-normal text-wb-text outline-none placeholder:text-wb-subtle"
        />
      </label>
      {block.expression.length === 0 ? (
        <p className="border-t border-wb-line/60 pt-3 text-center text-xs text-wb-subtle">
          {t("articleEditor.equation.previewHint")}
        </p>
      ) : (
        <ArticleEquationPresentationV3
          block={block}
          className="border-t border-wb-line/60 pt-4"
        />
      )}
    </div>
  );
}

function articleImageEditorUrlAllowedV3(value: string): boolean {
  if (value.length === 0) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      || (url.protocol === "http:"
        && (url.hostname === "localhost" || url.hostname === "127.0.0.1"));
  } catch {
    return false;
  }
}

function ArticleImageBlockEditorV3({
  block,
  focus,
  onChange,
  onFocusHandled,
  onUpload,
}: Readonly<{
  block: StudioArticleImageBlockV2;
  focus: boolean;
  onChange: (block: StudioArticleImageBlockV2) => void;
  onFocusHandled: () => void;
  onUpload?: ((file: File) => Promise<string>) | undefined;
}>) {
  const { t } = useTranslation();
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const urlRef = React.useRef<HTMLInputElement | null>(null);
  const [urlDraft, setUrlDraft] = React.useState(block.url);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => setUrlDraft(block.url), [block.url]);
  React.useEffect(() => {
    if (!focus) return;
    urlRef.current?.focus();
    onFocusHandled();
  }, [focus, onFocusHandled]);

  const commitUrl = () => {
    const next = urlDraft.trim();
    if (!articleImageEditorUrlAllowedV3(next)) {
      setError(t("articleEditor.image.invalidUrl"));
      return;
    }
    setError(null);
    if (next !== block.url) onChange({ ...block, url: next });
  };

  const upload = async (file: File) => {
    if (onUpload === undefined) return;
    setUploading(true);
    setError(null);
    try {
      const url = await onUpload(file);
      setUrlDraft(url);
      onChange({ ...block, url });
    } catch (cause) {
      setError(errorMessageV3(cause));
    } finally {
      setUploading(false);
      if (fileRef.current !== null) fileRef.current.value = "";
    }
  };

  return (
    <div className="my-4" data-article-block-kind="image">
      {block.url.length > 0 && (
        <ArticleImagePresentationV3 block={block} className="my-4" />
      )}
      <div className="rounded-xl bg-wb-soft/55 px-4 py-3.5 focus-within:bg-wb-soft">
        <div className="flex flex-wrap items-center gap-2">
          {onUpload !== undefined && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file !== undefined) void upload(file);
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-wb-panel px-3 text-xs font-semibold text-wb-text shadow-sm ring-1 ring-wb-line/70 hover:bg-wb-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              >
                {uploading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Upload className="h-3.5 w-3.5" />}
                {uploading
                  ? t("articleEditor.image.uploading")
                  : t("articleEditor.image.upload")}
              </button>
            </>
          )}
          <label className="min-w-52 flex-1">
            <span className="sr-only">{t("articleEditor.image.url")}</span>
            <input
              ref={urlRef}
              type="url"
              value={urlDraft}
              onChange={(event) => {
                setUrlDraft(event.currentTarget.value);
                setError(null);
              }}
              onBlur={commitUrl}
              onKeyDown={(event) => {
                if (articleEditorInputIsComposingV3(event.nativeEvent)) return;
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitUrl();
                }
              }}
              placeholder={t("articleEditor.image.urlPlaceholder")}
              className="min-h-8 w-full rounded-lg bg-wb-panel px-3 text-xs text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
            />
          </label>
        </div>
        {error !== null && (
          <p className="mt-2 text-xs text-wb-danger" role="alert">{error}</p>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-[11px] font-medium text-wb-muted">
            {t("articleEditor.image.altText")}
            <input
              type="text"
              value={block.altText}
              onChange={(event) => onChange({
                ...block,
                altText: event.currentTarget.value,
              })}
              placeholder={t("articleEditor.image.altPlaceholder")}
              className="mt-1 block min-h-8 w-full rounded-lg bg-wb-panel px-3 text-xs text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
            />
          </label>
          <label className="text-[11px] font-medium text-wb-muted">
            {t("articleEditor.image.caption")}
            <input
              type="text"
              value={block.caption}
              onChange={(event) => onChange({
                ...block,
                caption: event.currentTarget.value,
              })}
              placeholder={t("articleEditor.image.captionPlaceholder")}
              className="mt-1 block min-h-8 w-full rounded-lg bg-wb-panel px-3 text-xs text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ArticleTextBlockV3({
  block,
  focusCaret,
  onChange,
  onDeleteEmpty,
  onFocusHandled,
  onFocusNext,
  onFocusPrevious,
  onHeadingShortcut,
  onMergeWithPrevious,
  onOpenInsertMenu,
  onSplit,
}: Readonly<{
  block: StudioArticleTextBlockV2;
  focusCaret: "start" | "end" | number | null;
  onChange: (block: StudioArticleTextBlockV2) => void;
  onDeleteEmpty: () => void;
  onFocusHandled: () => void;
  onFocusNext?: (() => void) | undefined;
  onFocusPrevious?: (() => void) | undefined;
  onHeadingShortcut: (shortcut: Readonly<{ level: 2 | 3; rest: string }>) => void;
  onMergeWithPrevious?: (() => void) | undefined;
  onOpenInsertMenu: () => void;
  onSplit: (selectionStart: number, selectionEnd: number) => void;
}>) {
  const { t } = useTranslation();
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const subheading = block.kind === "heading" && block.level === 3;

  React.useLayoutEffect(() => {
    const element = textareaRef.current;
    if (element === null) return;
    element.style.height = "0px";
    const minHeight = block.kind === "heading"
      ? (subheading ? 44 : 52)
      : 48;
    element.style.height = `${Math.max(element.scrollHeight, minHeight)}px`;
  }, [block.kind, block.text, subheading]);

  React.useEffect(() => {
    if (focusCaret === null) return;
    const element = textareaRef.current;
    if (element !== null) {
      element.focus();
      const position = focusCaret === "end"
        ? element.value.length
        : focusCaret === "start"
          ? 0
          : Math.max(0, Math.min(focusCaret, element.value.length));
      element.setSelectionRange(position, position);
    }
    onFocusHandled();
  }, [focusCaret, onFocusHandled]);

  const accessibleName = block.kind === "heading"
    ? (subheading
        ? t("articleEditor.subheading")
        : t("articleEditor.heading"))
    : t("articleEditor.paragraph");

  return (
    <div className="relative py-1" data-article-block-kind={block.kind}>
      <textarea
        ref={textareaRef}
        rows={1}
        value={block.text}
        onChange={(event) => {
          const value = event.currentTarget.value;
          if (block.kind === "paragraph") {
            const shortcut = articleHeadingShortcutV3(value);
            if (shortcut !== null) {
              onHeadingShortcut(shortcut);
              return;
            }
          }
          onChange({ ...block, text: value });
        }}
        onKeyDown={(event) => {
          if (articleEditorInputIsComposingV3(event.nativeEvent)) return;
          const element = event.currentTarget;
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSplit(
              element.selectionStart ?? block.text.length,
              element.selectionEnd ?? block.text.length,
            );
            return;
          }
          if (event.key === "Backspace") {
            if (block.text.length === 0) {
              event.preventDefault();
              onDeleteEmpty();
              return;
            }
            if (
              element.selectionStart === 0
              && element.selectionEnd === 0
              && onMergeWithPrevious !== undefined
            ) {
              event.preventDefault();
              onMergeWithPrevious();
              return;
            }
          }
          if (
            event.key === "ArrowUp"
            && element.selectionStart === 0
            && element.selectionEnd === 0
            && onFocusPrevious !== undefined
          ) {
            event.preventDefault();
            onFocusPrevious();
            return;
          }
          if (
            event.key === "ArrowDown"
            && element.selectionStart === block.text.length
            && element.selectionEnd === block.text.length
            && onFocusNext !== undefined
          ) {
            event.preventDefault();
            onFocusNext();
            return;
          }
          if (event.key === "/" && block.text.length === 0) {
            event.preventDefault();
            onOpenInsertMenu();
          }
        }}
        placeholder={block.kind === "heading"
          ? (subheading
              ? t("articleEditor.subheadingPlaceholder")
              : t("articleEditor.headingPlaceholder"))
          : t("articleEditor.paragraphPlaceholder")}
        aria-label={accessibleName}
        className={`block w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-wb-subtle ${block.kind === "heading"
          ? (subheading
              ? "text-lg font-semibold leading-[1.4] tracking-tight"
              : "text-2xl font-bold leading-[1.35] tracking-tight")
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
  convertTarget,
  dragging,
  dropIndicator,
  onOpenInsertMenu,
  onSelectInsertOption,
  onCloseInsertMenu,
  onToggleBlockMenu,
  onConvert,
  onMove,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOverBoundary,
  onDrop,
}: Readonly<{
  blockId: string;
  blockKind: StudioArticleBlockV2["kind"];
  children: React.ReactNode;
  index: number;
  total: number;
  insertMenuOpen: boolean;
  blockMenuOpen: boolean;
  convertTarget: ArticleTextBlockKindV3 | null;
  dragging: boolean;
  dropIndicator: "top" | "bottom" | null;
  onOpenInsertMenu: () => void;
  onSelectInsertOption: (kind: ArticleInsertOptionKindV3) => void;
  onCloseInsertMenu: () => void;
  onToggleBlockMenu: () => void;
  onConvert: (target: ArticleTextBlockKindV3) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOverBoundary: (boundary: number) => void;
  onDrop: () => void;
}>) {
  const { t } = useTranslation();
  return (
    <div
      className={`group/article-block relative -ml-5 pl-5 transition-opacity duration-150 sm:-ml-14 sm:pl-14 ${blockKind === "experiment"
        ? "my-7"
        : blockKind === "image"
          ? "my-6"
          : blockKind === "divider"
            ? "my-5"
            : blockKind === "equation"
              ? "my-3"
              : "my-0.5"} ${dragging ? "opacity-40" : ""}`}
      data-article-block-id={blockId}
      onDragOver={(event) => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        onDragOverBoundary(articleBlockDropBoundaryV3(
          index,
          rect.top,
          rect.height,
          event.clientY,
        ));
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
    >
      {dropIndicator !== null && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 left-5 z-20 h-[3px] rounded-full bg-wb-accent sm:left-14 ${dropIndicator === "top" ? "-top-[2px]" : "-bottom-[2px]"}`}
        />
      )}
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
          onClick={onOpenInsertMenu}
          className="hidden h-7 w-7 items-center justify-center rounded-md transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:inline-flex"
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
          onDragEnd={onDragEnd}
          className="inline-flex h-6 w-5 cursor-grab items-center justify-center rounded-md transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:cursor-grabbing active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:h-7 sm:w-6"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        {insertMenuOpen && (
          <ArticleInsertMenuV3
            className="left-0 top-8"
            onClose={onCloseInsertMenu}
            onSelect={onSelectInsertOption}
          />
        )}
        {blockMenuOpen && (
          <div
            className="absolute left-7 top-8 z-40 w-48 rounded-xl bg-wb-panel p-1.5 text-xs shadow-[0_16px_48px_rgba(0,0,0,0.22)] ring-1 ring-wb-line/70"
            role="menu"
            aria-label={t("articleEditor.blockHandle")}
          >
            {convertTarget !== null && (
              <>
                <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-wb-subtle">
                  {t("articleEditor.turnInto")}
                </p>
                {convertTarget !== "paragraph" && (
                  <BlockMenuActionV3
                    autoFocus
                    label={t("articleEditor.addParagraph")}
                    onClick={() => onConvert("paragraph")}
                  >
                    <Pilcrow className="h-3.5 w-3.5" />
                  </BlockMenuActionV3>
                )}
                {convertTarget !== "heading" && (
                  <BlockMenuActionV3
                    autoFocus={convertTarget === "paragraph"}
                    label={t("articleEditor.addHeading")}
                    onClick={() => onConvert("heading")}
                  >
                    <Heading2 className="h-3.5 w-3.5" />
                  </BlockMenuActionV3>
                )}
                {convertTarget !== "subheading" && (
                  <BlockMenuActionV3
                    label={t("articleEditor.addSubheading")}
                    onClick={() => onConvert("subheading")}
                  >
                    <Heading3 className="h-3.5 w-3.5" />
                  </BlockMenuActionV3>
                )}
                <div className="mx-2 my-1.5 h-px bg-wb-line/70" aria-hidden="true" />
              </>
            )}
            <BlockMenuActionV3
              autoFocus={convertTarget === null}
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

export type ArticleInsertOptionKindV3 =
  | "paragraph"
  | "heading"
  | "subheading"
  | "equation"
  | "image"
  | "divider"
  | "experiment";

type ArticleInsertMenuOptionV3 = Readonly<{
  kind: ArticleInsertOptionKindV3;
  label: string;
  hint: string;
  keywords: readonly string[];
}>;

const ARTICLE_INSERT_OPTION_ICONS_V3: Readonly<Record<
  ArticleInsertOptionKindV3,
  React.ComponentType<Readonly<{ className?: string }>>
>> = {
  paragraph: Pilcrow,
  heading: Heading2,
  subheading: Heading3,
  equation: Sigma,
  image: ImageIcon,
  divider: Minus,
  experiment: FlaskConical,
};

function ArticleInsertMenuV3({
  className,
  onClose,
  onSelect,
}: Readonly<{
  className: string;
  onClose: () => void;
  onSelect: (kind: ArticleInsertOptionKindV3) => void;
}>) {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const options = React.useMemo<readonly ArticleInsertMenuOptionV3[]>(() => [
    {
      kind: "paragraph",
      label: t("articleEditor.addParagraph"),
      hint: t("articleEditor.insertMenu.paragraphHint"),
      keywords: ["text", "paragraph", "p", "honbun"],
    },
    {
      kind: "heading",
      label: t("articleEditor.addHeading"),
      hint: t("articleEditor.insertMenu.headingHint"),
      keywords: ["heading", "h2", "midashi", "#"],
    },
    {
      kind: "subheading",
      label: t("articleEditor.addSubheading"),
      hint: t("articleEditor.insertMenu.subheadingHint"),
      keywords: ["subheading", "h3", "komidashi", "##"],
    },
    {
      kind: "equation",
      label: t("articleEditor.addEquation"),
      hint: t("articleEditor.insertMenu.equationHint"),
      keywords: ["equation", "math", "formula", "tex", "latex", "数式"],
    },
    {
      kind: "image",
      label: t("articleEditor.addImage"),
      hint: t("articleEditor.insertMenu.imageHint"),
      keywords: ["image", "photo", "picture", "figure", "画像"],
    },
    {
      kind: "divider",
      label: t("articleEditor.addDivider"),
      hint: t("articleEditor.insertMenu.dividerHint"),
      keywords: ["divider", "separator", "line", "hr", "区切り"],
    },
    {
      kind: "experiment",
      label: t("articleEditor.addExperiment"),
      hint: t("articleEditor.insertMenu.experimentHint"),
      keywords: ["simulation", "experiment", "sim", "graph"],
    },
  ], [t]);
  const filtered = filterArticleInsertOptionsV3(options, query);
  const clampedActiveIndex = Math.min(
    activeIndex,
    Math.max(0, filtered.length - 1),
  );

  return (
    <div
      className={`absolute z-50 w-64 rounded-xl bg-wb-panel p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.22)] ring-1 ring-wb-line/70 ${className}`}
      role="menu"
      aria-label={t("articleEditor.addBlock")}
      data-testid="article-insert-menu-v3"
    >
      <div className="flex items-center gap-2 border-b border-wb-line/70 px-2.5 pb-2 pt-1">
        <Search className="h-3.5 w-3.5 shrink-0 text-wb-subtle" aria-hidden="true" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (articleEditorInputIsComposingV3(event.nativeEvent)) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) =>
                filtered.length === 0 ? 0 : (current + 1) % filtered.length);
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => filtered.length === 0
                ? 0
                : (current - 1 + filtered.length) % filtered.length);
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              const active = filtered[clampedActiveIndex];
              if (active !== undefined) onSelect(active.kind);
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
          }}
          placeholder={t("articleEditor.insertMenu.searchPlaceholder")}
          aria-label={t("articleEditor.insertMenu.searchPlaceholder")}
          className="w-full bg-transparent text-xs text-wb-text outline-none placeholder:text-wb-subtle"
        />
      </div>
      <div className="pt-1.5">
        {filtered.length === 0 && (
          <p className="px-2.5 py-3 text-xs text-wb-subtle">
            {t("articleEditor.insertMenu.empty")}
          </p>
        )}
        {filtered.map((option, optionIndex) => {
          const Icon = ARTICLE_INSERT_OPTION_ICONS_V3[option.kind];
          const active = optionIndex === clampedActiveIndex;
          return (
            <button
              key={option.kind}
              type="button"
              role="menuitem"
              aria-label={option.label}
              onClick={() => onSelect(option.kind)}
              onPointerEnter={() => setActiveIndex(optionIndex)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-[background-color] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${active ? "bg-wb-hover" : ""}`}
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-wb-soft text-wb-muted">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-wb-text">
                  {option.label}
                </span>
                <span className="block truncate text-[10px] text-wb-subtle">
                  {option.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
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

export function prepareArticleDraftForSaveV3(
  draft: StudioArticleDraftV2,
): StudioArticleDraftV2 {
  return {
    ...draft,
    blocks: draft.blocks.map((block) => {
      if (block.kind !== "experiment") {
        return block;
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
