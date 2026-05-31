import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LessonStep } from "../lessonDoc";
import { cloneNoteContent, EMPTY_AUTHOR_NOTE, staleVisibleIds, syncCheckedIds } from "../lessonAuthoring";
import type { NoteContent } from "../noteTypes";
import type { SimInstance } from "../types";
import { NotePanel } from "./NotePanel";

type LessonAuthoringProps = {
  instances: SimInstance[];
  stepsDraft: LessonStep[];
  setStepsDraft: React.Dispatch<React.SetStateAction<LessonStep[]>>;
};

export const LessonAuthoring: React.FC<LessonAuthoringProps> = ({ instances, stepsDraft, setStepsDraft }) => {
  const allInstanceIds = useMemo(() => instances.map((instance) => instance.id), [instances]);
  const instanceIdsKey = allInstanceIds.join("\u001f");
  const [stepTitleDraft, setStepTitleDraft] = useState("");
  const [stepNoteDraft, setStepNoteDraft] = useState<NoteContent>(EMPTY_AUTHOR_NOTE);
  const [stepVisibleIdsDraft, setStepVisibleIdsDraft] = useState<string[]>(allInstanceIds);
  const [predictDraft, setPredictDraft] = useState(false);
  const [revealLabelDraft, setRevealLabelDraft] = useState("Reveal");
  const [promptDraft, setPromptDraft] = useState("");
  const [noteEditorKey, setNoteEditorKey] = useState(0);
  const stepCounterRef = useRef(0);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    setStepVisibleIdsDraft((current) => syncCheckedIds(current, allInstanceIds));
  }, [instanceIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetDrafts = () => {
    setStepTitleDraft("");
    setStepNoteDraft(EMPTY_AUTHOR_NOTE);
    setStepVisibleIdsDraft(allInstanceIds);
    setPredictDraft(false);
    setRevealLabelDraft("Reveal");
    setPromptDraft("");
    setNoteEditorKey((key) => key + 1);
  };

  const toggleVisibleId = (id: string) => {
    setStepVisibleIdsDraft((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return [...current, id];
    });
  };

  const captureStep = () => {
    if (stepVisibleIdsDraft.length === 0) {
      setWarning("Select at least one visible instance before capturing a step.");
      return;
    }
    stepCounterRef.current += 1;
    const step: LessonStep = {
      id: `step-${Date.now()}-${stepCounterRef.current}`,
      ...(stepTitleDraft.trim() ? { title: stepTitleDraft.trim() } : {}),
      note: cloneNoteContent(stepNoteDraft),
      stage: {
        visibleInstances: [...stepVisibleIdsDraft],
        ...(predictDraft ? {
          challenge: {
            kind: "predict",
            ...(promptDraft.trim() ? { prompt: promptDraft.trim() } : {}),
            ...(revealLabelDraft.trim() ? { revealLabel: revealLabelDraft.trim() } : {}),
          },
        } : {}),
      },
    };
    setStepsDraft((current) => [...current, step]);
    setWarning(null);
    resetDrafts();
  };

  const deleteStep = (id: string) => {
    setStepsDraft((current) => current.filter((step) => step.id !== id));
  };

  return (
    <section className="mb-2 rounded border border-slate-800 bg-[#0B1120] overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase font-bold text-blue-400 tracking-wide">Lesson authoring</div>
          <div className="text-sm font-bold text-slate-200">{stepsDraft.length} steps</div>
        </div>
        <button
          onClick={captureStep}
          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
        >
          Capture step
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(360px,1fr)_280px] gap-3 p-3">
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-bold text-slate-400 mb-1">Step title</span>
            <input
              value={stepTitleDraft}
              onChange={(event) => setStepTitleDraft(event.target.value)}
              className="w-full bg-slate-950 border border-slate-700 outline-none focus:border-blue-500 rounded px-3 py-2 text-sm text-slate-100"
              placeholder={`Step ${stepsDraft.length + 1}`}
            />
          </label>

          <div>
            <div className="text-xs font-bold text-slate-400 mb-2">Visible instances</div>
            <div className="space-y-1.5">
              {instances.map((instance) => (
                <label key={instance.id} className="flex items-center gap-2 rounded bg-slate-950/70 border border-slate-800 px-2 py-1.5">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={stepVisibleIdsDraft.includes(instance.id)}
                    onChange={() => toggleVisibleId(instance.id)}
                  />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: instance.color }} />
                  <span className="text-xs font-bold text-slate-200 truncate">{instance.name}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 rounded bg-slate-950/70 border border-slate-800 px-2 py-1.5">
            <input
              type="checkbox"
              className="accent-amber-400"
              checked={predictDraft}
              onChange={(event) => setPredictDraft(event.target.checked)}
            />
            <span className="text-xs font-bold text-amber-200">Predict before reveal</span>
          </label>

          {predictDraft && (
            <div className="space-y-2">
              <input
                value={revealLabelDraft}
                onChange={(event) => setRevealLabelDraft(event.target.value)}
                className="w-full bg-slate-950 border border-slate-700 outline-none focus:border-amber-500 rounded px-3 py-2 text-xs text-slate-100"
                placeholder="Reveal label"
              />
              <input
                value={promptDraft}
                onChange={(event) => setPromptDraft(event.target.value)}
                className="w-full bg-slate-950 border border-slate-700 outline-none focus:border-amber-500 rounded px-3 py-2 text-xs text-slate-100"
                placeholder="Prediction prompt"
              />
            </div>
          )}

          {warning && <div className="text-xs font-semibold text-amber-300">{warning}</div>}
        </div>

        <div className="min-h-[280px] rounded border border-slate-800 overflow-hidden">
          <NotePanel
            key={`step-note-${noteEditorKey}`}
            mode="author"
            content={stepNoteDraft}
            onChange={setStepNoteDraft}
          />
        </div>

        <div className="rounded border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 text-xs font-bold text-slate-400">Captured steps</div>
          <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
            {stepsDraft.length === 0 ? (
              <div className="p-3 text-xs text-slate-500">No steps captured.</div>
            ) : (
              stepsDraft.map((step, index) => (
                <CapturedStepRow
                  key={step.id}
                  step={step}
                  index={index}
                  allInstanceIds={allInstanceIds}
                  onDelete={deleteStep}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const CapturedStepRow: React.FC<{
  step: LessonStep;
  index: number;
  allInstanceIds: string[];
  onDelete: (id: string) => void;
}> = ({ step, index, allInstanceIds, onDelete }) => {
  const staleIds = staleVisibleIds(step, allInstanceIds);
  return (
    <div className="px-3 py-2 border-b border-slate-800 last:border-b-0 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-200 truncate">{index + 1}. {step.title || step.id}</div>
        <div className="text-[11px] text-slate-500">{step.stage.visibleInstances.length} visible{step.stage.challenge?.kind === "predict" ? " · predict" : ""}</div>
        {staleIds.length > 0 && (
          <div className="text-[11px] font-semibold text-amber-300 truncate">stale: {staleIds.join(", ")}</div>
        )}
      </div>
      <button
        onClick={() => onDelete(step.id)}
        className="px-2 py-1 rounded bg-slate-800 hover:bg-red-500/20 text-[11px] font-bold text-slate-400 hover:text-red-200 transition-colors"
      >
        Delete
      </button>
    </div>
  );
};
