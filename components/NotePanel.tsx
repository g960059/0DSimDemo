import React, { useMemo, useState } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import 'katex/dist/katex.min.css';
import katex from 'katex';

const BlockMath = ({ math }: { math: string }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (containerRef.current) {
            try {
                katex.render(math, containerRef.current, { displayMode: true, throwOnError: false });
            } catch(e) {}
        }
    }, [math]);
    return <div ref={containerRef} />;
};

// ==========================================
// Domain Schema (Adapter target)
// ==========================================
export interface NoteDocument {
    id: string;
    title: string;
    blocks: DomainBlock[];
}

export type DomainBlock = 
    | { type: 'paragraph'; text: string }
    | { type: 'equation'; tex: string }
    | { type: 'quiz'; question: string; options: string[]; answerIndex: number }
    | { type: 'controller_ref'; paramKey: string }
    | { type: 'graph_ref'; viewId: string }
    | { type: 'unsupported'; raw: any };

// ==========================================
// Custom Blocks Implementation
// ==========================================

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

      return (
        <div className="my-2 p-4 bg-slate-800 rounded-lg border border-slate-700 relative group" contentEditable={false}>
            {isEditing ? (
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
                    className="cursor-pointer flex justify-center text-slate-200" 
                    onClick={() => setIsEditing(true)}
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
      const options = props.block.props.options.split('|');
      const correctIndex = parseInt(props.block.props.answerIndex, 10);

      if (isEditing) {
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
                      onChange={(e) => props.editor.updateBlock(props.block, { type: "quiz", props: { question: e.target.value }})}
                      className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-slate-200 text-sm mb-2" 
                      placeholder="Question"
                  />
                  {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-1">
                          <input type="radio" checked={correctIndex === idx} onChange={() => props.editor.updateBlock(props.block, { type: "quiz", props: { answerIndex: idx.toString() }})} />
                          <input 
                              value={opt} onChange={(e) => updateOption(idx, e.target.value)}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-sm"
                          />
                      </div>
                  ))}
                  <button className="text-xs text-indigo-400 mt-2" onClick={() => props.editor.updateBlock(props.block, { type: "quiz", props: { options: props.block.props.options + '|New Option' }})}>+ Add Option</button>
              </div>
          );
      }

      return (
        <div className="my-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700 relative" contentEditable={false}>
            <button className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 text-xs" onClick={() => setIsEditing(true)}>⚙</button>
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
                    )
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
      // In a real app we'd link to the simulation state context here.
      // For now, it's a visual ref block.
      return (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-900/30 border border-blue-700/50 text-blue-300 text-xs font-mono font-medium mx-1" contentEditable={false}>
            ⎈ {props.block.props.label}
        </div>
      );
    },
  }
);

// We define our custom schema
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    equation: equationBlock(),
    quiz: quizBlock(),
    controller_ref: controllerRefBlock(),
  },
});

// ==========================================
// Adapter Logic
// ==========================================
function blockNoteToDomain(blocks: typeof schema.Block[]): NoteDocument {
    const domainBlocks: DomainBlock[] = blocks.map(b => {
        if (b.type === "paragraph") {
            // Very naive text extraction just for POC
            const text = Array.isArray(b.content) ? b.content.map((c: any) => c.type === 'text' ? c.text : '').join('') : '';
            return { type: 'paragraph', text };
        }
        if (b.type === "equation") {
            return { type: 'equation', tex: b.props.tex as string };
        }
        if (b.type === "quiz") {
            return { 
                type: 'quiz', 
                question: b.props.question as string, 
                options: (b.props.options as string).split('|'), 
                answerIndex: parseInt(b.props.answerIndex as string, 10) 
            };
        }
        if (b.type === "controller_ref") {
            return { type: 'controller_ref', paramKey: b.props.paramKey as string };
        }
        return { type: 'unsupported', raw: b };
    });

    return {
        id: 'draft',
        title: 'Draft',
        blocks: domainBlocks
    };
}


// ==========================================
// Component
// ==========================================
interface NotePanelProps {
    initialContent?: string;
    onDocumentChange?: (doc: NoteDocument) => void;
}

const DEFAULT_NOTE_CONTENT = [
  {
    type: "paragraph",
    content: [{ type: "text", text: "The Ventricular Pressure-Volume relationship is governed by the time-varying elastance function.", styles: {} }]
  },
  {
    type: "equation",
    props: { tex: "P(t) = E(t) \\cdot (V(t) - V_0)" }
  },
  {
    type: "paragraph",
    content: [{ type: "text", text: "Can you identify which parameter drives the systolic peak pressure?", styles: {} }]
  },
  {
    type: "quiz",
    props: {
        question: "Which term represents cardiac contractility?",
        options: "V0 (Dead volume)|Ees (End-systolic elastance)|R (Resistance)",
        answerIndex: "1"
    }
  },
  {
    type: "paragraph",
    content: [{ type: "text", text: "Try adjusting the following parameter in the controls pane:", styles: {} }]
  },
  {
    type: "controller_ref",
    props: { paramKey: "LV_Ees", label: "Left Ventricle Ees" }
  }
] as any; // Using any to bypass initial strict typing just to load the starter structure

export const NotePanel: React.FC<NotePanelProps> = ({ initialContent, onDocumentChange }) => {
    
    // We will expand this to support custom blocks (Equation, Quiz, ControllerRef, GraphRef)
    const editor = useCreateBlockNote({
        schema,
        initialContent: initialContent ? JSON.parse(initialContent) : DEFAULT_NOTE_CONTENT,
    });

    const handleChange = () => {
        if (onDocumentChange) {
            // Convert internal schema to our Domain Schema layer
            const doc = blockNoteToDomain(editor.document);
            onDocumentChange(doc);
            
            // Helpful logging to console to see the domain model stream
            // console.log("Exported note document:", doc);
        }
    };

    return (
        <div className="flex-1 h-full w-full bg-[#0B1120] rounded-b-xl overflow-y-auto custom-scrollbar p-3 sm:p-5 text-slate-200 blocknote-dark-theme-override isolate">
            <BlockNoteView 
                editor={editor} 
                theme="dark"
                onChange={handleChange}
                // Custom CSS to make the editor blend seamlessly
                className="min-h-full"
            />
        </div>
    );
};

