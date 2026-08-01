import React from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  FlaskConical,
  Heading2,
  Home,
  Pilcrow,
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
  articleReaderHref,
  articlesHref,
  experimentsHref,
  homeHref,
} from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import { ArticleExperimentPlacementV3 } from "@/components/article/ArticleExperimentPlacementV3";
import {
  ArticleSnapshotPickerDialogV3,
} from "@/components/article/ArticleSnapshotPickerDialogV3";
import {
  createArticleExperimentBlockV3,
  portableEditorIdV3,
  resolveArticleBriefingHandoffV3,
} from "@/components/article/ArticleEditorStateV3";
import {
  STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
  type StudioArticleBlockV2,
  type StudioArticleDraftV2,
  type StudioArticleExperimentBlockV2,
} from "@/studio/contracts/v2/article";
import type { ExperimentSnapshotV2 } from "@/studio/contracts/v2/content";
import {
  StudioBrowserContentStoreV3,
} from "@/studio/infrastructure/browser/StudioBrowserContentStoreV3";
import {
  createBrowserStudioSnapshotBriefingHandoffV3,
} from "@/studio/infrastructure/browser/StudioSnapshotBriefingHandoffV3";
import {
  loadStudioDefaultClientCompositionV2,
} from "@/studio/composition/StudioDefaultCompositionV2";
import type { ModelContractV2 } from "@/studio/contracts/v2/model";

type EditorSaveStatusV3 = "idle" | "dirty" | "saving" | "saved" | "error";

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
  const briefingHandoff = React.useMemo(
    createBrowserStudioSnapshotBriefingHandoffV3,
    [],
  );
  const [snapshots, setSnapshots] = React.useState<readonly ExperimentSnapshotV2[]>([]);
  const [draft, setDraft] = React.useState<StudioArticleDraftV2>(() =>
    createEmptyArticleDraftV3(locale, t("articleEditor.untitled")));
  const draftRef = React.useRef(draft);
  const hydratedRouteKeyRef = React.useRef<string | null>(
    routeArticleId === "new" || routeArticleId === undefined
      ? articleEditorRouteKeyV3(routeArticleId)
      : null,
  );
  const [status, setStatus] = React.useState<EditorSaveStatusV3>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [modelContract, setModelContract] = React.useState<ModelContractV2 | null>(null);

  React.useEffect(() => {
    let current = true;
    void loadStudioDefaultClientCompositionV2().then(({ contract }) => {
      if (current) setModelContract(contract);
    }).catch(() => {
      if (current) setModelContract(null);
    });
    return () => {
      current = false;
    };
  }, []);

  React.useEffect(() => {
    try {
      const nextSnapshots = [...store.listSnapshots()].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt));
      setSnapshots(Object.freeze(nextSnapshots));
      const resolution = resolveArticleEditorRouteDraftV3({
        currentDraft: draftRef.current,
        hydratedRouteKey: hydratedRouteKeyRef.current,
        locale,
        readArticle: (articleId) => store.readArticle(articleId),
        routeArticleId,
        untitledTitle: t("articleEditor.untitled"),
      });
      if (resolution.routeChanged) {
        hydratedRouteKeyRef.current = resolution.routeKey;
        draftRef.current = resolution.draft;
        setDraft(resolution.draft);
        setStatus("idle");
        setError(null);
      }
    } catch (cause) {
      setStatus("error");
      setError(errorMessageV3(cause));
    }
  }, [locale, routeArticleId, store, t]);

  const updateDraft = React.useCallback((
    update: (current: StudioArticleDraftV2) => StudioArticleDraftV2,
  ) => {
    const next = update(draftRef.current);
    draftRef.current = next;
    setDraft(next);
    setStatus("dirty");
    setError(null);
  }, []);

  const saveDraft = React.useCallback(() => {
    setStatus("saving");
    setError(null);
    try {
      const candidate = draftRef.current;
      const isInitialSave = store.readArticle(candidate.articleId) === null;
      const normalized = normalizeArticleDraftV3({
        ...candidate,
        draftVersion: isInitialSave ? 0 : candidate.draftVersion + 1,
      });
      const saved = store.saveArticle(normalized);
      draftRef.current = saved;
      setDraft(saved);
      setStatus("saved");
      if (routeArticleId !== saved.articleId) {
        navigate(articleEditorHref({ articleId: saved.articleId, locale }), {
          replace: true,
        });
      }
    } catch (cause) {
      setStatus("error");
      setError(errorMessageV3(cause));
    }
  }, [locale, navigate, routeArticleId, store]);

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

  const addTextBlock = (kind: "heading" | "paragraph") => {
    updateDraft((current) => ({
      ...current,
      blocks: [...current.blocks, kind === "heading"
        ? {
          blockId: portableEditorIdV3("block"),
          kind: "heading" as const,
          level: 2 as const,
          text: t("articleEditor.newHeading"),
        }
        : {
          blockId: portableEditorIdV3("block"),
          kind: "paragraph" as const,
          text: "",
        }],
    }));
  };

  const addExperiment = (snapshot: ExperimentSnapshotV2) => {
    const handedOff = briefingHandoff?.read(snapshot.snapshotId) ?? null;
    const briefing = resolveArticleBriefingHandoffV3(snapshot, handedOff);
    if (handedOff !== null && briefing === null) {
      briefingHandoff?.clear(snapshot.snapshotId);
    }
    const block = createArticleExperimentBlockV3(
      snapshot,
      briefing ?? undefined,
    );
    updateDraft((current) => ({
      ...current,
      blocks: [...current.blocks, block],
    }));
  };

  const articleSnapshotById = React.useMemo(
    () => new Map(snapshots.map((snapshot) => [snapshot.snapshotId, snapshot])),
    [snapshots],
  );

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-wb-app text-wb-text"
      data-testid="article-editor-v3"
    >
      <header className="z-20 flex h-12 shrink-0 items-center gap-2 bg-wb-header px-2.5 shadow-[inset_0_-1px_0_var(--wb-border)] sm:px-4">
        <Link
          to={homeHref(locale)}
          aria-label={t("nav.home")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <Home className="h-4 w-4" />
        </Link>
        <span className="hidden text-xs font-semibold tracking-tight text-wb-accent sm:inline">
          {t("common.appName")}
        </span>
        <span className="hidden text-wb-subtle sm:inline" aria-hidden="true">/</span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-wb-muted">
          {draft.title || t("articleEditor.untitled")}
        </span>

        <Link
          to={articlesHref(locale)}
          className="hidden min-h-8 items-center rounded-lg px-2.5 text-[11px] font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:inline-flex"
        >
          {t("articleLibrary.title")}
        </Link>
        {routeArticleId !== "new" && (
          <Link
            to={articleReaderHref({ articleId: draft.articleId, locale })}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            aria-label={t("articleEditor.preview")}
            title={t("articleEditor.preview")}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
        <Link
          to={experimentsHref(locale)}
          className="hidden min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:inline-flex"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          {t("nav.workbench")}
        </Link>
        <span
          className={`hidden min-w-12 text-right text-[10px] sm:inline ${status === "error" ? "text-wb-danger" : "text-wb-subtle"}`}
          role={status === "error" ? "alert" : "status"}
        >
          {t(`articleEditor.status.${status}`)}
        </span>
        <button
          type="button"
          onClick={saveDraft}
          disabled={status === "saving"}
          className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg bg-wb-primary px-3 text-[11px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-wb-primary-hover active:scale-[0.97] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <Save className="h-3.5 w-3.5" />
          {t("articleEditor.save")}
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
          <div className="mt-4 flex items-center gap-2 text-[10px] text-wb-subtle">
            <span>{t("articleEditor.draft")}</span>
            <span aria-hidden="true">·</span>
            <span>{t("articleEditor.snapshotCount", { count: snapshots.length })}</span>
          </div>

          {error !== null && (
            <p className="mt-6 rounded-xl bg-wb-danger-soft px-4 py-3 text-xs leading-5 text-wb-danger" role="alert">
              {error}
            </p>
          )}

          {snapshots.length === 0 && (
            <div className="mt-8 rounded-xl bg-wb-soft px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div>
                <p className="text-sm font-medium">{t("articleEditor.emptySnapshots.title")}</p>
                <p className="mt-1 text-xs leading-5 text-wb-muted">
                  {t("articleEditor.emptySnapshots.description")}
                </p>
              </div>
              <Link
                to={experimentsHref(locale)}
                className="mt-3 inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-accent transition-[background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent sm:mt-0"
              >
                {t("articleEditor.emptySnapshots.openWorkbench")}
                <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </div>
          )}

          <div className="mt-12" data-testid="article-blocks-v3">
            {draft.blocks.map((block, index) => {
              if (block.kind === "experiment") {
                return (
                  <ArticleExperimentPlacementV3
                    key={block.blockId}
                    block={block}
                    snapshot={articleSnapshotById.get(block.placement.snapshotId) ?? null}
                    contract={modelContract}
                    index={index}
                    total={draft.blocks.length}
                    onChange={(next) => updateBlock(index, next)}
                    onRemove={() => removeBlock(index)}
                    onMove={(direction) => moveBlock(index, direction)}
                  />
                );
              }
              return (
                <ArticleTextBlockV3
                  key={block.blockId}
                  block={block}
                  index={index}
                  total={draft.blocks.length}
                  onChange={(next) => updateBlock(index, next)}
                  onRemove={() => removeBlock(index)}
                  onMove={(direction) => moveBlock(index, direction)}
                />
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-1.5" aria-label={t("articleEditor.addBlock")}>
            <AddBlockButtonV3
              label={t("articleEditor.addHeading")}
              onClick={() => addTextBlock("heading")}
            >
              <Heading2 className="h-3.5 w-3.5" />
            </AddBlockButtonV3>
            <AddBlockButtonV3
              label={t("articleEditor.addParagraph")}
              onClick={() => addTextBlock("paragraph")}
            >
              <Pilcrow className="h-3.5 w-3.5" />
            </AddBlockButtonV3>
            <AddBlockButtonV3
              label={t("articleEditor.addExperiment")}
              onClick={() => setPickerOpen(true)}
            >
              <FlaskConical className="h-3.5 w-3.5" />
            </AddBlockButtonV3>
          </div>
        </article>
      </main>

      <ArticleSnapshotPickerDialogV3
        open={pickerOpen}
        snapshots={snapshots}
        onClose={() => setPickerOpen(false)}
        onSelect={addExperiment}
      />
    </div>
  );
}

function ArticleTextBlockV3({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: Readonly<{
  block: Exclude<StudioArticleBlockV2, StudioArticleExperimentBlockV2>;
  index: number;
  total: number;
  onChange: (block: Exclude<StudioArticleBlockV2, StudioArticleExperimentBlockV2>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}>) {
  const { t } = useTranslation();
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useLayoutEffect(() => {
    const element = textareaRef.current;
    if (element === null) return;
    element.style.height = "0px";
    element.style.height = `${Math.max(element.scrollHeight, block.kind === "heading" ? 52 : 48)}px`;
  }, [block.kind, block.text]);

  return (
    <div className="group relative my-5 pr-0 sm:pr-24" data-article-block-kind={block.kind}>
      <textarea
        ref={textareaRef}
        rows={1}
        value={block.text}
        onChange={(event) => onChange({ ...block, text: event.currentTarget.value })}
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
      <div className="mt-1 flex items-center justify-end gap-0.5 text-wb-subtle sm:absolute sm:right-0 sm:top-0 sm:mt-0 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <TextBlockActionV3
          label={t("articleEditor.moveUp")}
          disabled={index === 0}
          onClick={() => onMove(-1)}
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </TextBlockActionV3>
        <TextBlockActionV3
          label={t("articleEditor.moveDown")}
          disabled={index === total - 1}
          onClick={() => onMove(1)}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </TextBlockActionV3>
        <TextBlockActionV3 label={t("articleEditor.removeBlock")} onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </TextBlockActionV3>
      </div>
    </div>
  );
}

function TextBlockActionV3({
  children,
  label,
  disabled = false,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] disabled:pointer-events-none disabled:opacity-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
    >
      {children}
    </button>
  );
}

function AddBlockButtonV3({
  children,
  label,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
    >
      {children}
      {label}
    </button>
  );
}

function createEmptyArticleDraftV3(locale: string, title: string): StudioArticleDraftV2 {
  return Object.freeze({
    schemaId: STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
    articleId: portableEditorIdV3("article"),
    draftVersion: 0,
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
      return {
        ...block,
        placement: {
          ...block.placement,
          caption: caption.length === 0 ? null : caption,
        },
      };
    }),
  };
}

function errorMessageV3(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default ArticleEditorV3Page;
