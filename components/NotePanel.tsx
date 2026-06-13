import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { BlockNoteView } from "@blocknote/mantine";
import { getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import { createReactBlockSpec } from "@blocknote/react";
import { Activity, SlidersHorizontal } from "lucide-react";
import { BlockMath as KatexBlockMath } from "react-katex";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import 'katex/dist/katex.min.css';
import type { NoteContent } from '../noteTypes';
import { AuthoredViewEmbed, type AuthoredViewRuntime } from "./workbench/AuthoredViewEmbed";
import type { AuthoredViewSpec } from "@/features/workbench/authoredViews";
import type { WorkbenchThemeId } from "./workbench/WorkbenchSidePanel";

type NoteMode = 'read' | 'edit' | 'author';

const EMPTY_EDIT_NOTE: NoteContent = [
  {
    type: "paragraph",
    content: [],
  },
];

const BareReadNoteContext = React.createContext(false);
const NoteViewContext = React.createContext<{ authoredViews: readonly AuthoredViewSpec[]; runtime?: AuthoredViewRuntime }>({ authoredViews: [] });

const editorCanEdit = (editor: unknown) => (editor as { isEditable?: boolean }).isEditable !== false;

export type HeadingAnchor = { id: string; text: string; level: number };

type StaticBlock = Record<string, unknown>;
type NormalizedListBlock = {
  type: "staticList";
  listType: "bullet" | "numbered";
  items: StaticBlock[];
};
export type NormalizedStaticBlock = StaticBlock | NormalizedListBlock;

const articleHeadingClass: Record<number, string> = {
  1: "mt-12 mb-4 text-[28px] font-semibold leading-snug text-wb-text text-balance scroll-mt-16",
  2: "mt-10 mb-3 text-[22px] font-semibold text-wb-text text-balance scroll-mt-16",
  3: "mt-8 mb-2 text-[18px] font-semibold text-wb-text text-balance scroll-mt-16",
};

const compactHeadingClass: Record<number, string> = {
  1: "mb-3 mt-5 text-lg font-semibold text-wb-text text-balance scroll-mt-16",
  2: "mb-2 mt-4 text-base font-semibold text-wb-text text-balance scroll-mt-16",
  3: "mb-2 mt-3 text-sm font-semibold text-wb-text text-balance scroll-mt-16",
};

function blockProps(block: StaticBlock): Record<string, unknown> {
  return (block.props && typeof block.props === "object" ? block.props : {}) as Record<string, unknown>;
}

function isNormalizedListBlock(block: NormalizedStaticBlock): block is NormalizedListBlock {
  return (block as NormalizedListBlock).type === "staticList" && Array.isArray((block as NormalizedListBlock).items);
}

function blockChildren(block: StaticBlock): StaticBlock[] {
  return Array.isArray(block.children) ? block.children.filter((child): child is StaticBlock => !!child && typeof child === "object") : [];
}

function headingLevel(block: StaticBlock): 1 | 2 | 3 {
  const rawLevel = blockProps(block).level;
  const level = typeof rawLevel === "number" ? rawLevel : Number.parseInt(String(rawLevel ?? "2"), 10);
  if (level === 2) return 2;
  if (level >= 3) return 3;
  return 1;
}

function inlinePlainText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((item) => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";
    const inline = item as { type?: unknown; text?: unknown; content?: unknown };
    if (inline.type === "text" && typeof inline.text === "string") return inline.text;
    return inlinePlainText(inline.content);
  }).join("");
}

export function slugifyHeading(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

export function deriveHeadingAnchors(blocks: NoteContent): HeadingAnchor[] {
  const seen = new Map<string, number>();
  const anchors: HeadingAnchor[] = [];

  const visit = (items: StaticBlock[]) => {
    for (const block of items) {
      if (block.type === "heading") {
        const text = inlinePlainText(block.content).trim();
        const baseId = slugifyHeading(text);
        const nextCount = (seen.get(baseId) ?? 0) + 1;
        seen.set(baseId, nextCount);
        anchors.push({
          id: nextCount === 1 ? baseId : `${baseId}-${nextCount}`,
          text,
          level: headingLevel(block),
        });
      }
      visit(blockChildren(block));
    }
  };

  visit(blocks.filter((block): block is StaticBlock => !!block && typeof block === "object"));
  return anchors;
}

export function renderInlineContent(content: unknown): React.ReactNode {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;

  return content.map((item, index) => {
    if (typeof item === "string") return <React.Fragment key={index}>{item}</React.Fragment>;
    if (!item || typeof item !== "object") return null;

    const inline = item as { type?: unknown; text?: unknown; href?: unknown; styles?: Record<string, unknown>; content?: unknown };
    if (inline.type === "text" && typeof inline.text === "string") {
      const classes = [
        inline.styles?.bold ? "font-semibold text-wb-text" : "",
        inline.styles?.italic ? "italic" : "",
      ].filter(Boolean).join(" ");

      if (inline.styles?.code) {
        return (
          <code key={index} className={`rounded bg-wb-input px-1.5 py-0.5 font-mono text-[0.88em] text-wb-accent ring-1 ring-wb-line ${classes}`}>
            {inline.text}
          </code>
        );
      }

      if (classes) return <span key={index} className={classes}>{inline.text}</span>;
      return <React.Fragment key={index}>{inline.text}</React.Fragment>;
    }

    if (inline.type === "link" && typeof inline.href === "string") {
      return (
        <a
          key={index}
          href={inline.href}
          className="font-medium text-wb-accent underline decoration-wb-accent/40 underline-offset-4 hover:text-wb-text"
        >
          {renderInlineContent(inline.content)}
        </a>
      );
    }
    return <React.Fragment key={index}>{renderInlineContent(inline.content)}</React.Fragment>;
  });
}

export function normalizeStaticBlocks(blocks: NoteContent): NormalizedStaticBlock[] {
  const normalized: NormalizedStaticBlock[] = [];
  const safeBlocks = blocks.filter((block): block is StaticBlock => !!block && typeof block === "object");

  for (let index = 0; index < safeBlocks.length; index += 1) {
    const block = safeBlocks[index];
    const type = block.type;
    if (type !== "bulletListItem" && type !== "numberedListItem") {
      normalized.push(block);
      continue;
    }

    const items: StaticBlock[] = [block];
    while (safeBlocks[index + 1]?.type === type) {
      index += 1;
      items.push(safeBlocks[index]);
    }
    normalized.push({
      type: "staticList",
      listType: type === "bulletListItem" ? "bullet" : "numbered",
      items,
    });
  }

  return normalized;
}

export const StaticQuiz: React.FC<{ question: string; options: string; answerIndex: string }> = ({ question, options, answerIndex }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const choices = options.split("|").map((option) => option.trim()).filter((option) => option.length > 0);
  const correctIndex = Number.parseInt(answerIndex, 10);

  return (
    <div data-answer-index={Number.isFinite(correctIndex) ? correctIndex : -1}>
      <div className="mb-3 font-medium text-wb-text">{question}</div>
      <div className="flex flex-col gap-2">
        {choices.map((option, index) => {
          const isSelected = selected === index;
          const isCorrect = isSelected && index === correctIndex;
          const isWrong = isSelected && index !== correctIndex;
          return (
            <button
              key={`${option}:${index}`}
              type="button"
              onClick={() => setSelected(index)}
              aria-pressed={isSelected}
              className={`rounded border px-3 py-2 text-left text-sm transition-colors ${
                isCorrect ? "border-wb-accent bg-wb-accent-soft text-wb-text" :
                isWrong ? "border-wb-danger bg-wb-hover text-wb-danger" :
                "border-wb-line bg-wb-panel text-wb-muted hover:bg-wb-hover hover:text-wb-text"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className={`mt-3 text-xs font-semibold ${selected === correctIndex ? "text-wb-accent" : "text-wb-danger"}`}>
          {selected === correctIndex ? t("notes.quiz.correct") : t("notes.quiz.tryAgain")}
        </div>
      )}
    </div>
  );
};

function renderStaticBlockInternal(
  block: NormalizedStaticBlock,
  index: number,
  bareRead: boolean,
  nextHeadingId: () => string | undefined,
  viewCtx: { authoredViews: readonly AuthoredViewSpec[]; runtime?: AuthoredViewRuntime } = { authoredViews: [] },
): React.ReactNode {
  if (isNormalizedListBlock(block)) {
    const listClass = block.listType === "bullet"
      ? "my-5 list-disc space-y-2 pl-6 marker:text-wb-subtle"
      : "my-5 list-decimal space-y-2 pl-6 marker:text-wb-subtle";
    const Tag = block.listType === "bullet" ? "ul" : "ol";
    return React.createElement(
      Tag,
      { key: index, className: listClass },
      block.items.map((item, itemIndex) => (
        <li key={itemIndex} className={bareRead ? "text-[17px] leading-[1.75] text-wb-muted text-pretty" : "leading-7 text-wb-text text-pretty"}>
          {renderInlineContent(item.content)}
          {renderStaticChildren(item, bareRead, nextHeadingId, viewCtx)}
        </li>
      )),
    );
  }

  const staticBlock = block as StaticBlock;
  const type = staticBlock.type;
  const props = blockProps(staticBlock);
  const children = renderInlineContent(staticBlock.content);

  if (type === "heading") {
    const level = headingLevel(staticBlock);
    const Tag = (`h${level}`) as keyof React.JSX.IntrinsicElements;
    const headingId = nextHeadingId();
    const nestedChildren = renderStaticChildren(staticBlock, bareRead, nextHeadingId, viewCtx);
    return (
      <React.Fragment key={index}>
        {React.createElement(
          Tag,
          {
            id: headingId,
            className: bareRead ? articleHeadingClass[level] : compactHeadingClass[level],
          },
          children,
        )}
        {nestedChildren}
      </React.Fragment>
    );
  }
  const nestedChildren = renderStaticChildren(staticBlock, bareRead, nextHeadingId, viewCtx);
  if (type === "equation") {
    return (
      <div key={index} className="my-7 overflow-x-auto text-center text-wb-text">
        <KatexBlockMath math={String(props.tex ?? "")} />
        {nestedChildren}
      </div>
    );
  }
  if (type === "quiz") {
    return (
      <div key={index} className="my-7 rounded-md border border-wb-line bg-wb-input p-4">
        <StaticQuiz
          question={String(props.question ?? "")}
          options={String(props.options ?? "")}
          answerIndex={String(props.answerIndex ?? "0")}
        />
        {nestedChildren}
      </div>
    );
  }
  if (type === "controller_ref") {
    return <span key={index} className="mx-1 inline rounded bg-wb-input px-1.5 py-0.5 font-mono text-xs text-wb-subtle">{String(props.label ?? "")}</span>;
  }
  if (type === "view_ref") {
    return (
      <AuthoredViewEmbed
        key={index}
        viewId={String(props.viewId ?? "")}
        authoredViews={viewCtx.authoredViews}
        runtime={viewCtx.runtime}
        className={bareRead ? "sm:-mx-8" : ""}
      />
    );
  }
  if (type === "blockquote") {
    return <blockquote key={index} className="my-6 border-l-2 border-wb-accent bg-wb-input py-3 pl-5 pr-4 text-wb-muted text-pretty">{children}{nestedChildren}</blockquote>;
  }
  if (type === "codeBlock") {
    return <pre key={index} className="my-6 overflow-x-auto rounded-md border border-wb-line bg-wb-panel p-4 font-mono text-sm text-wb-text"><code>{inlinePlainText(staticBlock.content) || String(props.code ?? "")}</code></pre>;
  }

  return <p key={index} className={bareRead ? "my-[1em] text-[17px] leading-[1.75] text-wb-muted text-pretty" : "mb-3 leading-7 text-wb-text"}>{children}{nestedChildren}</p>;
}

function renderStaticChildren(
  block: StaticBlock,
  bareRead: boolean,
  nextHeadingId: () => string | undefined,
  viewCtx: { authoredViews: readonly AuthoredViewSpec[]; runtime?: AuthoredViewRuntime } = { authoredViews: [] },
): React.ReactNode {
  const children = blockChildren(block);
  if (children.length === 0) return null;
  return (
    <div className="mt-3">
      {normalizeStaticBlocks(children).map((child, index) => renderStaticBlockInternal(child, index, bareRead, nextHeadingId, viewCtx))}
    </div>
  );
}

export function renderStaticBlock(block: NormalizedStaticBlock, index: number, bareRead: boolean, headingAnchorId?: string | string[]): React.ReactNode {
  const headingAnchorIds = Array.isArray(headingAnchorId) ? headingAnchorId : headingAnchorId ? [headingAnchorId] : [];
  let headingIndex = 0;
  return renderStaticBlockInternal(block, index, bareRead, () => headingAnchorIds[headingIndex++]);
}

const StaticReadNote: React.FC<{
  content: NoteContent;
  bareRead: boolean;
  headingAnchorIds?: string[];
  authoredViews: readonly AuthoredViewSpec[];
  viewRuntime?: AuthoredViewRuntime;
  theme?: WorkbenchThemeId;
}> = ({ content, bareRead, headingAnchorIds = [], authoredViews, viewRuntime }) => {
  let headingIndex = 0;
  const viewCtx = { authoredViews, runtime: viewRuntime };
  return (
    <div className={bareRead ? "flex-1 h-full w-full py-1 text-wb-text isolate" : "flex-1 h-full w-full rounded-b-xl bg-wb-aux p-3 text-wb-text isolate overflow-y-auto custom-scrollbar sm:p-5"}>
      {normalizeStaticBlocks(content).map((block, index) => renderStaticBlockInternal(block, index, bareRead, () => headingAnchorIds[headingIndex++], viewCtx))}
    </div>
  );
};

const equationBlock = createReactBlockSpec(
  {
    type: "equation",
    propSchema: {
      tex: { default: "e=mc^2" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { t } = useTranslation();
      const [isEditing, setIsEditing] = useState(false);
      const [tex, setTex] = useState(props.block.props.tex);
      const editable = editorCanEdit(props.editor);

      useEffect(() => {
        if (!editable && isEditing) setIsEditing(false);
      }, [editable, isEditing]);

      return (
        <div className="group relative my-2 rounded-lg border border-wb-line bg-wb-input p-4" contentEditable={false}>
          {isEditing && editable ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={tex}
                onChange={(e) => setTex(e.target.value)}
                className="w-full rounded border border-wb-line bg-wb-panel p-1 font-mono text-sm text-wb-text"
                autoFocus
              />
              <button
                className="self-end rounded bg-wb-primary px-2 py-1 text-xs text-white hover:bg-wb-primary-hover"
                onClick={() => {
                  props.editor.updateBlock(props.block, { type: "equation", props: { tex } });
                  setIsEditing(false);
                }}
              >
                {t("notes.editor.saveMath")}
              </button>
            </div>
          ) : (
            <div
              className={`flex justify-center text-wb-text ${editable ? 'cursor-pointer' : ''}`}
              onClick={() => { if (editable) setIsEditing(true); }}
            >
              <KatexBlockMath math={props.block.props.tex} />
            </div>
          )}
        </div>
      );
    },
  }
);

const quizBlock = createReactBlockSpec(
  {
    type: "quiz",
    propSchema: {
      question: { default: "Question goes here?" },
      options: { default: "Option A|Option B|Option C" },
      answerIndex: { default: "0" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { t } = useTranslation();
      const [selected, setSelected] = useState<number | null>(null);
      const [isEditing, setIsEditing] = useState(false);
      const editable = editorCanEdit(props.editor);
      const options = props.block.props.options.split('|');
      const correctIndex = parseInt(props.block.props.answerIndex, 10);

      useEffect(() => {
        if (!editable && isEditing) setIsEditing(false);
      }, [editable, isEditing]);

      if (isEditing && editable) {
        const updateOption = (index: number, val: string) => {
          const newOpts = [...options];
          newOpts[index] = val;
          props.editor.updateBlock(props.block, { type: "quiz", props: { options: newOpts.join('|') } });
        };
        return (
          <div className="my-2 rounded-lg border border-wb-line bg-wb-input p-4" contentEditable={false}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-wb-accent">{t("notes.editor.editQuiz")}</span>
              <button className="rounded bg-wb-primary px-2 py-1 text-xs text-white" onClick={() => setIsEditing(false)}>{t("common.done")}</button>
            </div>
            <input
              value={props.block.props.question}
              onChange={(e) => props.editor.updateBlock(props.block, { type: "quiz", props: { question: e.target.value } })}
              className="mb-2 w-full rounded border border-wb-line bg-wb-panel p-1 text-sm text-wb-text"
              placeholder={t("notes.editor.question")}
            />
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-1">
                <input type="radio" checked={correctIndex === idx} onChange={() => props.editor.updateBlock(props.block, { type: "quiz", props: { answerIndex: idx.toString() } })} />
                <input
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  className="flex-1 rounded border border-wb-line bg-wb-input px-2 py-0.5 text-sm text-wb-text"
                />
              </div>
            ))}
            <button className="mt-2 text-xs text-wb-accent" onClick={() => props.editor.updateBlock(props.block, { type: "quiz", props: { options: props.block.props.options + `|${t("notes.editor.newOption")}` } })}>+ {t("notes.editor.addOption")}</button>
          </div>
        );
      }

      return (
        <div className="relative my-2 rounded-lg border border-wb-line bg-wb-input p-4" contentEditable={false}>
          {editable && (
            <button className="absolute right-2 top-2 text-xs text-wb-subtle hover:text-wb-text" onClick={() => setIsEditing(true)}>⚙</button>
          )}
          <div className="mb-3 font-medium text-wb-text">{props.block.props.question}</div>
          <div className="flex flex-col gap-2">
            {options.map((opt, idx) => {
              const isSelected = selected === idx;
              const isCorrect = isSelected && idx === correctIndex;
              const isWrong = isSelected && idx !== correctIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setSelected(idx)}
                  className={`text-left px-3 py-2 rounded text-sm transition-colors border ${
                    isCorrect ? 'border-wb-accent bg-wb-accent-soft text-wb-text' :
                    isWrong ? 'border-wb-danger bg-wb-hover text-wb-danger' :
                    'border-wb-line bg-wb-panel text-wb-muted hover:bg-wb-hover hover:text-wb-text'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <div className={`mt-3 text-xs font-semibold ${selected === correctIndex ? 'text-wb-accent' : 'text-wb-danger'}`}>
              {selected === correctIndex ? t("notes.quiz.correct") : t("notes.quiz.tryAgain")}
            </div>
          )}
        </div>
      );
    },
  }
);

const controllerRefBlock = createReactBlockSpec(
  {
    type: "controller_ref",
    propSchema: {
      paramKey: { default: "LV_Ees" },
      label: { default: "Left Ventricular Elastance (Ees)" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const bareRead = React.useContext(BareReadNoteContext);

      if (bareRead) {
        return (
          <span className="inline font-mono text-xs font-medium text-wb-muted" contentEditable={false}>
            {props.block.props.label}
          </span>
        );
      }

      return (
        <div className="mx-1 inline-flex items-center gap-1.5 rounded border border-wb-line bg-wb-accent-soft px-2 py-0.5 font-mono text-xs font-medium text-wb-accent" contentEditable={false}>
          ⎈ {props.block.props.label}
        </div>
      );
    },
  }
);

const viewRefBlock = createReactBlockSpec(
  {
    type: "view_ref",
    propSchema: {
      viewId: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { authoredViews, runtime } = React.useContext(NoteViewContext);
      return (
        <AuthoredViewEmbed
          viewId={props.block.props.viewId}
          authoredViews={authoredViews}
          runtime={runtime}
        />
      );
    },
  }
);

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    equation: equationBlock(),
    quiz: quizBlock(),
    controller_ref: controllerRefBlock(),
    view_ref: viewRefBlock(),
  },
});

interface NotePanelProps {
  mode?: NoteMode;
  content?: NoteContent;
  onChange?: (blocks: NoteContent) => void;
  bare?: boolean;
  headingAnchorIds?: string[];
  authoredViews?: readonly AuthoredViewSpec[];
  viewRuntime?: AuthoredViewRuntime;
  theme?: WorkbenchThemeId;
}

export const NotePanel: React.FC<NotePanelProps> = ({ mode = 'read', content, onChange, bare, headingAnchorIds, authoredViews = [], viewRuntime, theme = 'dark' }) => {
  const { t } = useTranslation();
  const hasContent = Array.isArray(content) && content.length > 0;
  const editable = mode !== 'read';
  const bareRead = bare === true && !editable;

  if (!editable && !hasContent) {
    return (
      <div className={bareRead ? "flex-1 h-full w-full overflow-y-auto custom-scrollbar py-1 text-wb-subtle text-sm" : "flex-1 h-full w-full rounded-b-xl bg-wb-aux p-3 text-sm text-wb-subtle overflow-y-auto custom-scrollbar sm:p-5"}>
        {t("notes.empty")}
      </div>
    );
  }

  if (!editable) {
    return (
      <StaticReadNote
        content={(hasContent ? content : EMPTY_EDIT_NOTE) as NoteContent}
        bareRead={bareRead}
        headingAnchorIds={headingAnchorIds}
        authoredViews={authoredViews}
        viewRuntime={viewRuntime}
        theme={theme}
      />
    );
  }

  return (
    <NoteEditor
      editable={editable}
      content={(hasContent ? content : EMPTY_EDIT_NOTE) as NoteContent}
      onChange={onChange}
      bareRead={bareRead}
      authoredViews={authoredViews}
      viewRuntime={viewRuntime}
      theme={theme}
    />
  );
};

const NoteEditor: React.FC<{
  editable: boolean;
  content: NoteContent;
  onChange?: (blocks: NoteContent) => void;
  bareRead?: boolean;
  authoredViews: readonly AuthoredViewSpec[];
  viewRuntime?: AuthoredViewRuntime;
  theme: WorkbenchThemeId;
}> = ({ editable, content, onChange, bareRead = false, authoredViews, viewRuntime, theme }) => {
  const { t } = useTranslation();
  const editor = useCreateBlockNote({
    schema,
    initialContent: content as any,
  });

  const handleChange = () => {
    if (editable) onChange?.(editor.document as NoteContent);
  };

  const getSlashMenuItems = async (query: string) => {
    const viewItems = authoredViews.map((view) => ({
      title: view.title,
      subtext: view.kind === "controller" ? t("notes.viewRef.controllerKind") : t("notes.viewRef.metricsKind"),
      group: t("notes.viewRef.menuGroup"),
      aliases: [view.title, view.kind, t("notes.viewRef.menuTitle")],
      icon: view.kind === "controller" ? <SlidersHorizontal size={18} /> : <Activity size={18} />,
      onItemClick: () => {
        insertOrUpdateBlockForSlashMenu(editor as any, {
          type: "view_ref",
          props: { viewId: view.id },
        } as any);
      },
    }));
    return filterSuggestionItems([
      ...getDefaultReactSlashMenuItems(editor as any),
      ...viewItems,
    ], query);
  };

  return (
    <NoteViewContext.Provider value={{ authoredViews, runtime: viewRuntime }}>
      <BareReadNoteContext.Provider value={bareRead}>
        <div className={bareRead ? "flex-1 h-full w-full overflow-y-auto custom-scrollbar py-1 text-wb-text isolate" : "flex-1 h-full w-full rounded-b-xl bg-wb-aux p-3 text-wb-text isolate overflow-y-auto custom-scrollbar sm:p-5"}>
          <BlockNoteView
            editor={editor}
            editable={editable}
            theme={theme}
            onChange={handleChange}
            slashMenu={false}
            className="min-h-full"
          >
            <SuggestionMenuController triggerCharacter="/" getItems={getSlashMenuItems} />
          </BlockNoteView>
        </div>
      </BareReadNoteContext.Provider>
    </NoteViewContext.Provider>
  );
};
