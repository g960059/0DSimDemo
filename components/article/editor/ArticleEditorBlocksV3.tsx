import React from "react";
import {
  ChevronDown,
  ChevronUp,
  FlaskConical,
  GripVertical,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link2,
  ListCollapse,
  ListChecks,
  Minus,
  Pilcrow,
  Plus,
  Search,
  Sigma,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  ArticleDividerPresentationV3,
} from "@/components/article/ArticleRichBlockV3";
import {
  ArticleEquationBlockEditorV3,
  ArticleImageBlockEditorV3,
  ArticleLinkBlockEditorV3,
  ArticleQuizBlockEditorV3,
} from "@/components/article/editor/ArticleEditorRichBlocksV3";
import type { ArticleSnapshotPickerItemV3 } from "@/components/article/editor/ArticleSnapshotPickerDialogV3";
import { portableArticleEditorIdV3 } from "@/components/article/editor/ArticleEditorIdentityV3";
import {
  articleBlockDropBoundaryV3,
  articleEditorInputIsComposingV3,
  articleHeadingShortcutV3,
  filterArticleInsertOptionsV3,
} from "@/components/article/editor/ArticleEditorPolicy";
import type {
  StudioArticleAccordionBlockV2,
  StudioArticleAccordionContentBlockV2,
  StudioArticleBlockV2,
  StudioArticleHeadingBlockV2,
  StudioArticleParagraphBlockV2,
} from "@/studio/contracts/v2/article";
import type { ExperimentSnapshotV2 } from "@/studio/contracts/v2/content";

export type ArticleTextBlockKindV3 =
  | "paragraph"
  | "heading"
  | "subheading";

export type StudioArticleTextBlockV2 =
  | StudioArticleHeadingBlockV2
  | StudioArticleParagraphBlockV2;

export function ArticleAccordionBlockEditorV3({
  block,
  focus,
  onChange,
  onFocusHandled,
  onUpload,
}: Readonly<{
  block: StudioArticleAccordionBlockV2;
  focus: boolean;
  onChange: (block: StudioArticleAccordionBlockV2) => void;
  onFocusHandled: () => void;
  onUpload?: ((file: File) => Promise<string>) | undefined;
}>) {
  const { t } = useTranslation();
  const titleRef = React.useRef<HTMLInputElement | null>(null);
  const [insertOpen, setInsertOpen] = React.useState(false);
  React.useEffect(() => {
    if (!focus) return;
    titleRef.current?.focus();
    onFocusHandled();
  }, [focus, onFocusHandled]);
  const updateNested = (
    index: number,
    next: StudioArticleAccordionContentBlockV2,
  ) => {
    const blocks = [...block.blocks];
    blocks[index] = next;
    onChange({ ...block, blocks: Object.freeze(blocks) });
  };
  const moveNested = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= block.blocks.length) return;
    const blocks = [...block.blocks];
    const [item] = blocks.splice(index, 1);
    if (item === undefined) return;
    blocks.splice(target, 0, item);
    onChange({ ...block, blocks: Object.freeze(blocks) });
  };
  return (
    <div
      className="my-5 rounded-xl bg-wb-soft/60 px-4 py-4 sm:px-5"
      data-article-block-kind="accordion"
    >
      <label className="flex items-center gap-2.5">
        <ListCollapse className="h-4 w-4 shrink-0 text-wb-accent" aria-hidden="true" />
        <span className="sr-only">{t("articleEditor.accordion.title")}</span>
        <input
          ref={titleRef}
          type="text"
          value={block.title}
          onChange={(event) => onChange({ ...block, title: event.currentTarget.value })}
          placeholder={t("articleEditor.accordion.titlePlaceholder")}
          className="min-h-9 min-w-0 flex-1 bg-transparent text-sm font-semibold text-wb-text outline-none placeholder:text-wb-subtle"
        />
      </label>
      <div className="mt-3 border-t border-wb-line/60 pt-2">
        {block.blocks.map((nested, index) => (
          <div
            key={nested.blockId}
            className="group/nested relative border-b border-wb-line/45 py-3 last:border-b-0"
          >
            <div className="mb-1 flex justify-end gap-0.5 opacity-100 sm:absolute sm:right-0 sm:top-2 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-focus-within/nested:opacity-100 sm:group-hover/nested:opacity-100">
              <NestedBlockActionV3
                disabled={index === 0}
                label={t("articleEditor.moveUp")}
                onClick={() => moveNested(index, -1)}
              >
                <ChevronUp className="h-3 w-3" />
              </NestedBlockActionV3>
              <NestedBlockActionV3
                disabled={index === block.blocks.length - 1}
                label={t("articleEditor.moveDown")}
                onClick={() => moveNested(index, 1)}
              >
                <ChevronDown className="h-3 w-3" />
              </NestedBlockActionV3>
              <NestedBlockActionV3
                label={t("articleEditor.removeBlock")}
                onClick={() => onChange({
                  ...block,
                  blocks: Object.freeze(block.blocks.filter((_, candidateIndex) =>
                    candidateIndex !== index)),
                })}
              >
                <Trash2 className="h-3 w-3" />
              </NestedBlockActionV3>
            </div>
            <ArticleAccordionNestedEditorV3
              block={nested}
              onChange={(next) => updateNested(index, next)}
              onUpload={onUpload}
            />
          </div>
        ))}
        <div className="relative mt-2">
          <button
            type="button"
            disabled={block.blocks.length >= 100}
            aria-expanded={insertOpen}
            onClick={() => setInsertOpen((current) => !current)}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-muted transition-[background-color,color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("articleEditor.accordion.addContent")}
          </button>
          {insertOpen && (
            <ArticleInsertMenuV3
              className="bottom-9 left-0"
              allowedKinds={ARTICLE_ACCORDION_INSERT_KINDS_V3}
              onClose={() => setInsertOpen(false)}
              onSelect={(kind) => {
                const nested = createAccordionContentTemplateV3(kind);
                if (nested !== null) {
                  onChange({
                    ...block,
                    blocks: Object.freeze([...block.blocks, nested]),
                  });
                }
                setInsertOpen(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function NestedBlockActionV3({
  children,
  disabled = false,
  label,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-wb-subtle transition-[background-color,color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.96] disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
    >
      {children}
    </button>
  );
}

function ArticleAccordionNestedEditorV3({
  block,
  onChange,
  onUpload,
}: Readonly<{
  block: StudioArticleAccordionContentBlockV2;
  onChange: (block: StudioArticleAccordionContentBlockV2) => void;
  onUpload?: ((file: File) => Promise<string>) | undefined;
}>) {
  const { t } = useTranslation();
  if (block.kind === "paragraph" || block.kind === "heading") {
    return (
      <textarea
        rows={block.kind === "heading" ? 1 : 3}
        value={block.text}
        onChange={(event) => onChange({ ...block, text: event.currentTarget.value })}
        placeholder={block.kind === "heading"
          ? t("articleEditor.subheadingPlaceholder")
          : t("articleEditor.paragraphPlaceholder")}
        className={`block w-full resize-y bg-transparent pr-0 text-wb-text outline-none placeholder:text-wb-subtle sm:pr-24 ${block.kind === "heading" ? "min-h-9 text-sm font-semibold" : "min-h-16 text-sm leading-7"}`}
      />
    );
  }
  if (block.kind === "equation") {
    return (
      <ArticleEquationBlockEditorV3
        block={block}
        focus={false}
        onFocusHandled={() => undefined}
        onChange={onChange}
      />
    );
  }
  if (block.kind === "image") {
    return (
      <ArticleImageBlockEditorV3
        block={block}
        focus={false}
        onFocusHandled={() => undefined}
        onChange={onChange}
        onUpload={onUpload}
      />
    );
  }
  if (block.kind === "divider") {
    return <ArticleDividerPresentationV3 block={block} className="my-4" />;
  }
  if (block.kind === "link") {
    return (
      <ArticleLinkBlockEditorV3
        block={block}
        focus={false}
        onFocusHandled={() => undefined}
        onChange={onChange}
      />
    );
  }
  return (
    <ArticleQuizBlockEditorV3
      block={block}
      focus={false}
      onFocusHandled={() => undefined}
      onChange={onChange}
    />
  );
}

export function ArticleTextBlockV3({
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
              ? "article-heading-3"
              : "article-heading-2")
          : "article-paragraph"}`}
      />
    </div>
  );
}

export function ArticleBlockShellV3({
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
          : blockKind === "accordion" || blockKind === "quiz" || blockKind === "link"
            ? "my-5"
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
  | "accordion"
  | "quiz"
  | "link"
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
  accordion: ListCollapse,
  quiz: ListChecks,
  link: Link2,
  experiment: FlaskConical,
};

const ARTICLE_ACCORDION_INSERT_KINDS_V3 = Object.freeze([
  "paragraph",
  "heading",
  "subheading",
  "equation",
  "image",
  "divider",
  "quiz",
  "link",
] satisfies readonly ArticleInsertOptionKindV3[]);

function ArticleInsertMenuV3({
  allowedKinds,
  className,
  onClose,
  onSelect,
}: Readonly<{
  allowedKinds?: readonly ArticleInsertOptionKindV3[];
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
      kind: "accordion",
      label: t("articleEditor.addAccordion"),
      hint: t("articleEditor.insertMenu.accordionHint"),
      keywords: ["accordion", "details", "disclosure", "advanced", "補足", "詳細"],
    },
    {
      kind: "quiz",
      label: t("articleEditor.addQuiz"),
      hint: t("articleEditor.insertMenu.quizHint"),
      keywords: ["quiz", "question", "choice", "check", "問題", "確認"],
    },
    {
      kind: "link",
      label: t("articleEditor.addLink"),
      hint: t("articleEditor.insertMenu.linkHint"),
      keywords: ["link", "article", "series", "url", "リンク", "記事"],
    },
    {
      kind: "experiment",
      label: t("articleEditor.addExperiment"),
      hint: t("articleEditor.insertMenu.experimentHint"),
      keywords: ["simulation", "experiment", "sim", "graph"],
    },
  ], [t]);
  const allowed = React.useMemo(() => allowedKinds === undefined
    ? options
    : options.filter((option) => allowedKinds.includes(option.kind)),
  [allowedKinds, options]);
  const filtered = filterArticleInsertOptionsV3(allowed, query);
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

export function createRichArticleBlockTemplateV3(
  kind: "equation" | "image" | "divider" | "accordion" | "quiz" | "link",
  blockId: string,
): StudioArticleBlockV2 {
  if (kind === "equation") return { blockId, kind, expression: "" };
  if (kind === "image") {
    return { blockId, kind, url: "", altText: "", caption: "" };
  }
  if (kind === "divider") return { blockId, kind };
  if (kind === "link") {
    return { blockId, kind, href: "", label: "", description: "" };
  }
  if (kind === "quiz") {
    const firstChoiceId = portableArticleEditorIdV3("choice");
    const secondChoiceId = portableArticleEditorIdV3("choice");
    return {
      blockId,
      kind,
      question: "",
      choices: Object.freeze([
        { choiceId: firstChoiceId, label: "" },
        { choiceId: secondChoiceId, label: "" },
      ]),
      correctChoiceId: firstChoiceId,
      explanation: "",
    };
  }
  return {
    blockId,
    kind,
    title: "",
    blocks: Object.freeze([{
      blockId: portableArticleEditorIdV3("block"),
      kind: "paragraph",
      text: "",
    }]),
  };
}

function createAccordionContentTemplateV3(
  kind: ArticleInsertOptionKindV3,
): StudioArticleAccordionContentBlockV2 | null {
  const blockId = portableArticleEditorIdV3("block");
  if (kind === "paragraph") return { blockId, kind, text: "" };
  if (kind === "heading" || kind === "subheading") {
    return {
      blockId,
      kind: "heading",
      level: kind === "heading" ? 2 : 3,
      text: "",
    };
  }
  if (
    kind === "equation"
    || kind === "image"
    || kind === "divider"
    || kind === "quiz"
    || kind === "link"
  ) {
    return createRichArticleBlockTemplateV3(kind, blockId) as
      StudioArticleAccordionContentBlockV2;
  }
  return null;
}

export function snapshotPickerItemFromSnapshotV3(
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
