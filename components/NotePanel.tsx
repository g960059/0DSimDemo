import React, { useEffect, useState } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import 'katex/dist/katex.min.css';
import katex from 'katex';
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

function renderInlineContent(content: unknown): React.ReactNode {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;

  return content.map((item, index) => {
    if (typeof item === "string") return <React.Fragment key={index}>{item}</React.Fragment>;
    if (!item || typeof item !== "object") return null;

    const inline = item as { type?: unknown; text?: unknown; content?: unknown };
    if (inline.type === "text" && typeof inline.text === "string") {
      return <React.Fragment key={index}>{inline.text}</React.Fragment>;
    }
    return <React.Fragment key={index}>{renderInlineContent(inline.content)}</React.Fragment>;
  });
}

function renderStaticBlock(block: Record<string, unknown>, index: number, bareRead: boolean): React.ReactNode {
  const type = block.type;
  const props = (block.props && typeof block.props === "object" ? block.props : {}) as Record<string, unknown>;
  const children = renderInlineContent(block.content);

  if (type === "heading") {
    return <h2 key={index} className="mb-3 mt-5 text-xl font-semibold text-slate-100">{children}</h2>;
  }
  if (type === "bulletListItem") {
    return <li key={index} className="ml-5 list-disc text-slate-200">{children}</li>;
  }
  if (type === "numberedListItem") {
    return <li key={index} className="ml-5 list-decimal text-slate-200">{children}</li>;
  }
  if (type === "equation") {
    return <div key={index} className="my-3 text-center font-mono text-sm text-slate-200">{String(props.tex ?? "")}</div>;
  }
  if (type === "quiz") {
    return (
      <div key={index} className="my-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <div className="font-medium text-slate-200">{String(props.question ?? "")}</div>
      </div>
    );
  }
  if (type === "controller_ref") {
    if (bareRead) {
      return <span key={index} className="inline text-slate-400 text-xs font-mono font-medium">{String(props.label ?? "")}</span>;
    }
    return (
      <div key={index} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-900/30 border border-blue-700/50 text-blue-300 text-xs font-mono font-medium mx-1">
        ⎈ {String(props.label ?? "")}
      </div>
    );
  }

  return <p key={index} className="mb-3 leading-7 text-slate-200">{children}</p>;
}

const StaticReadNote: React.FC<{ content: NoteContent; bareRead: boolean }> = ({ content, bareRead }) => (
  <div className={bareRead ? "flex-1 h-full w-full overflow-y-auto custom-scrollbar py-1 text-slate-200 blocknote-dark-theme-override isolate" : "flex-1 h-full w-full bg-[#0B1120] rounded-b-xl overflow-y-auto custom-scrollbar p-3 sm:p-5 text-slate-200 blocknote-dark-theme-override isolate"}>
    {content.map((block, index) => renderStaticBlock(block, index, bareRead))}
  </div>
);

const BlockMath = ({ math }: { math: string }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, { displayMode: true, throwOnError: false });
      } catch {
        /* KaTeX renders best-effort output with throwOnError=false. */
      }
    }
  }, [math]);
  return <div ref={containerRef} />;
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
              <BlockMath math={props.block.props.tex} />
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
}

export const NotePanel: React.FC<NotePanelProps> = ({ mode = 'read', content, onChange, bare }) => {
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

  if (!editable && typeof window === "undefined") {
    return <StaticReadNote content={(hasContent ? content : EMPTY_EDIT_NOTE) as NoteContent} bareRead={bareRead} />;
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
