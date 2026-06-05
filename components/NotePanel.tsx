import React, { useEffect, useState } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { BlockMath as KatexBlockMath } from "react-katex";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import 'katex/dist/katex.min.css';
import type { NoteContent } from '../noteTypes';

type NoteMode = 'read' | 'edit' | 'author';

const EMPTY_EDIT_NOTE: NoteContent = [
  {
    type: "paragraph",
    content: [],
  },
];

const BareReadNoteContext = React.createContext(false);

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
  1: "mt-12 mb-4 text-[28px] font-semibold leading-snug text-slate-50 text-balance scroll-mt-16",
  2: "mt-10 mb-3 text-[22px] font-semibold text-slate-50 text-balance scroll-mt-16",
  3: "mt-8 mb-2 text-[18px] font-semibold text-slate-100 text-balance scroll-mt-16",
};

const compactHeadingClass: Record<number, string> = {
  1: "mb-3 mt-5 text-lg font-semibold text-slate-100 text-balance scroll-mt-16",
  2: "mb-2 mt-4 text-base font-semibold text-slate-100 text-balance scroll-mt-16",
  3: "mb-2 mt-3 text-sm font-semibold text-slate-100 text-balance scroll-mt-16",
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
        inline.styles?.bold ? "font-semibold text-slate-100" : "",
        inline.styles?.italic ? "italic" : "",
      ].filter(Boolean).join(" ");

      if (inline.styles?.code) {
        return (
          <code key={index} className={`rounded bg-slate-800/70 px-1.5 py-0.5 font-mono text-[0.88em] text-sky-200 ring-1 ring-slate-700/60 ${classes}`}>
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
          className="font-medium text-sky-400 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-300"
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
  const [selected, setSelected] = useState<number | null>(null);
  const choices = options.split("|").map((option) => option.trim()).filter((option) => option.length > 0);
  const correctIndex = Number.parseInt(answerIndex, 10);

  return (
    <div data-answer-index={Number.isFinite(correctIndex) ? correctIndex : -1}>
      <div className="mb-3 font-medium text-slate-200">{question}</div>
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
                isCorrect ? "border-green-500 bg-green-900/30 text-green-200" :
                isWrong ? "border-red-500 bg-red-900/30 text-red-200" :
                "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className={`mt-3 text-xs font-semibold ${selected === correctIndex ? "text-green-400" : "text-red-400"}`}>
          {selected === correctIndex ? "✓ Correct!" : "✗ Try again"}
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
): React.ReactNode {
  if (isNormalizedListBlock(block)) {
    const listClass = block.listType === "bullet"
      ? "my-5 list-disc space-y-2 pl-6 marker:text-slate-500"
      : "my-5 list-decimal space-y-2 pl-6 marker:text-slate-500";
    const Tag = block.listType === "bullet" ? "ul" : "ol";
    return React.createElement(
      Tag,
      { key: index, className: listClass },
      block.items.map((item, itemIndex) => (
        <li key={itemIndex} className={bareRead ? "text-[17px] leading-[1.75] text-slate-300 text-pretty" : "leading-7 text-slate-200 text-pretty"}>
          {renderInlineContent(item.content)}
          {renderStaticChildren(item, bareRead, nextHeadingId)}
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
    const nestedChildren = renderStaticChildren(staticBlock, bareRead, nextHeadingId);
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
  const nestedChildren = renderStaticChildren(staticBlock, bareRead, nextHeadingId);
  if (type === "equation") {
    return (
      <div key={index} className="my-7 overflow-x-auto text-center text-slate-100">
        <KatexBlockMath math={String(props.tex ?? "")} />
        {nestedChildren}
      </div>
    );
  }
  if (type === "quiz") {
    return (
      <div key={index} className="my-7 rounded-md border border-slate-800 bg-slate-900/45 p-4">
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
    return <span key={index} className="mx-1 inline rounded bg-slate-800/45 px-1.5 py-0.5 font-mono text-xs text-slate-500">{String(props.label ?? "")}</span>;
  }
  if (type === "blockquote") {
    return <blockquote key={index} className="my-6 border-l-2 border-sky-400/50 bg-slate-900/35 py-3 pl-5 pr-4 text-slate-300 text-pretty">{children}{nestedChildren}</blockquote>;
  }
  if (type === "codeBlock") {
    return <pre key={index} className="my-6 overflow-x-auto rounded-md border border-slate-800 bg-slate-950/80 p-4 font-mono text-sm text-slate-200"><code>{inlinePlainText(staticBlock.content) || String(props.code ?? "")}</code></pre>;
  }

  return <p key={index} className={bareRead ? "my-[1em] text-[17px] leading-[1.75] text-slate-300 text-pretty" : "mb-3 leading-7 text-slate-200"}>{children}{nestedChildren}</p>;
}

function renderStaticChildren(block: StaticBlock, bareRead: boolean, nextHeadingId: () => string | undefined): React.ReactNode {
  const children = blockChildren(block);
  if (children.length === 0) return null;
  return (
    <div className="mt-3">
      {normalizeStaticBlocks(children).map((child, index) => renderStaticBlockInternal(child, index, bareRead, nextHeadingId))}
    </div>
  );
}

export function renderStaticBlock(block: NormalizedStaticBlock, index: number, bareRead: boolean, headingAnchorId?: string | string[]): React.ReactNode {
  const headingAnchorIds = Array.isArray(headingAnchorId) ? headingAnchorId : headingAnchorId ? [headingAnchorId] : [];
  let headingIndex = 0;
  return renderStaticBlockInternal(block, index, bareRead, () => headingAnchorIds[headingIndex++]);
}

const StaticReadNote: React.FC<{ content: NoteContent; bareRead: boolean; headingAnchorIds?: string[] }> = ({ content, bareRead, headingAnchorIds = [] }) => {
  let headingIndex = 0;
  return (
    <div className={bareRead ? "flex-1 h-full w-full py-1 text-slate-200 blocknote-dark-theme-override isolate" : "flex-1 h-full w-full bg-[#0B1120] rounded-b-xl overflow-y-auto custom-scrollbar p-3 sm:p-5 text-slate-200 blocknote-dark-theme-override isolate"}>
      {normalizeStaticBlocks(content).map((block, index) => renderStaticBlockInternal(block, index, bareRead, () => headingAnchorIds[headingIndex++]))}
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
      const [isEditing, setIsEditing] = useState(false);
      const [tex, setTex] = useState(props.block.props.tex);
      const editable = editorCanEdit(props.editor);

      useEffect(() => {
        if (!editable && isEditing) setIsEditing(false);
      }, [editable, isEditing]);

      return (
        <div className="my-2 p-4 bg-slate-800 rounded-lg border border-slate-700 relative group" contentEditable={false}>
          {isEditing && editable ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={tex}
                onChange={(e) => setTex(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-slate-200 text-sm font-mono"
                autoFocus
              />
              <button
                className="self-end bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs"
                onClick={() => {
                  props.editor.updateBlock(props.block, { type: "equation", props: { tex } });
                  setIsEditing(false);
                }}
              >
                Save Math
              </button>
            </div>
          ) : (
            <div
              className={`flex justify-center text-slate-200 ${editable ? 'cursor-pointer' : ''}`}
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
          <div className="my-2 p-4 bg-indigo-900/30 rounded-lg border border-indigo-700/50" contentEditable={false}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-indigo-400">EDIT QUIZ</span>
              <button className="text-xs bg-indigo-600 px-2 py-1 roundedtext-white" onClick={() => setIsEditing(false)}>Done</button>
            </div>
            <input
              value={props.block.props.question}
              onChange={(e) => props.editor.updateBlock(props.block, { type: "quiz", props: { question: e.target.value } })}
              className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-slate-200 text-sm mb-2"
              placeholder="Question"
            />
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-1">
                <input type="radio" checked={correctIndex === idx} onChange={() => props.editor.updateBlock(props.block, { type: "quiz", props: { answerIndex: idx.toString() } })} />
                <input
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-sm"
                />
              </div>
            ))}
            <button className="text-xs text-indigo-400 mt-2" onClick={() => props.editor.updateBlock(props.block, { type: "quiz", props: { options: props.block.props.options + '|New Option' } })}>+ Add Option</button>
          </div>
        );
      }

      return (
        <div className="my-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700 relative" contentEditable={false}>
          {editable && (
            <button className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 text-xs" onClick={() => setIsEditing(true)}>⚙</button>
          )}
          <div className="font-medium text-slate-200 mb-3">{props.block.props.question}</div>
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
                    isCorrect ? 'bg-green-900/30 border-green-500 text-green-200' :
                    isWrong ? 'bg-red-900/30 border-red-500 text-red-200' :
                    'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <div className={`mt-3 text-xs font-semibold ${selected === correctIndex ? 'text-green-400' : 'text-red-400'}`}>
              {selected === correctIndex ? '✓ Correct!' : '✗ Try again'}
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
          <span className="inline text-slate-400 text-xs font-mono font-medium" contentEditable={false}>
            {props.block.props.label}
          </span>
        );
      }

      return (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-900/30 border border-blue-700/50 text-blue-300 text-xs font-mono font-medium mx-1" contentEditable={false}>
          ⎈ {props.block.props.label}
        </div>
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
  },
});

interface NotePanelProps {
  mode?: NoteMode;
  content?: NoteContent;
  onChange?: (blocks: NoteContent) => void;
  bare?: boolean;
  headingAnchorIds?: string[];
}

export const NotePanel: React.FC<NotePanelProps> = ({ mode = 'read', content, onChange, bare, headingAnchorIds }) => {
  const hasContent = Array.isArray(content) && content.length > 0;
  const editable = mode !== 'read';
  const bareRead = bare === true && !editable;

  if (!editable && !hasContent) {
    return (
      <div className={bareRead ? "flex-1 h-full w-full overflow-y-auto custom-scrollbar py-1 text-slate-500 text-sm" : "flex-1 h-full w-full bg-[#0B1120] rounded-b-xl overflow-y-auto custom-scrollbar p-3 sm:p-5 text-slate-500 text-sm"}>
        No notes for this case yet.
      </div>
    );
  }

  if (!editable) {
    return <StaticReadNote content={(hasContent ? content : EMPTY_EDIT_NOTE) as NoteContent} bareRead={bareRead} headingAnchorIds={headingAnchorIds} />;
  }

  return (
    <NoteEditor
      editable={editable}
      content={(hasContent ? content : EMPTY_EDIT_NOTE) as NoteContent}
      onChange={onChange}
      bareRead={bareRead}
    />
  );
};

const NoteEditor: React.FC<{ editable: boolean; content: NoteContent; onChange?: (blocks: NoteContent) => void; bareRead?: boolean }> = ({ editable, content, onChange, bareRead = false }) => {
  const editor = useCreateBlockNote({
    schema,
    initialContent: content as any,
  });

  const handleChange = () => {
    if (editable) onChange?.(editor.document as NoteContent);
  };

  return (
    <BareReadNoteContext.Provider value={bareRead}>
      <div className={bareRead ? "flex-1 h-full w-full overflow-y-auto custom-scrollbar py-1 text-slate-200 blocknote-dark-theme-override isolate" : "flex-1 h-full w-full bg-[#0B1120] rounded-b-xl overflow-y-auto custom-scrollbar p-3 sm:p-5 text-slate-200 blocknote-dark-theme-override isolate"}>
        <BlockNoteView
          editor={editor}
          editable={editable}
          theme="dark"
          onChange={handleChange}
          className="min-h-full"
        />
      </div>
    </BareReadNoteContext.Provider>
  );
};
