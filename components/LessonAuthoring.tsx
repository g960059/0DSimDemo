import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LessonStep, NumericKnobKey } from "../lessonDoc";
import {
  buildExposedKnobStage,
  cloneNoteContent,
  EMPTY_AUTHOR_NOTE,
  instanceIdsKey,
  isPredictStep,
  moveStep,
  staleVisibleIds,
  syncCheckedIds,
} from "../lessonAuthoring";
import type { NoteContent } from "../noteTypes";
import type { SimInstance } from "../types";
import { KNOB_RANGES } from "../engine/knobs";
import { resolveKnobValue } from "../lessonKnobs";
import { NotePanel } from "./NotePanel";
import { translatedKnobLabel } from "../i18nText";

type LessonAuthoringProps = {
  instances: SimInstance[];
  stepsDraft: LessonStep[];
  setStepsDraft: React.Dispatch<React.SetStateAction<LessonStep[]>>;
  workbenchTheme?: 'dark' | 'light';
};

const KNOB_LABELS: Record<NumericKnobKey, string> = {
  HR: "Heart rate",
  contractility: "LV contractility",
  contractilityRV: "RV contractility",
  relaxation: "Relaxation",
  diastolicStiffness: "Diastolic stiffness",
  afterload: "Afterload",
  arterialStiffness: "Arterial stiffness",
  pulmonaryResistance: "Pulmonary resistance",
  venousTone: "Venous tone",
  peep: "PEEP",
  aorticStenosis: "Aortic stenosis",
  aorticRegurgitation: "Aortic regurgitation",
  mitralStenosis: "Mitral stenosis",
  mitralRegurgitation: "Mitral regurgitation",
  tricuspidRegurgitation: "Tricuspid regurgitation",
  pulmonicStenosis: "Pulmonic stenosis",
};

const KNOB_KEYS = Object.keys(KNOB_RANGES) as NumericKnobKey[];

const formatKnobValue = (key: NumericKnobKey, value: number): string => {
  if (key === "HR") return `${Math.round(value)} bpm`;
  if (key === "peep") return `${Math.round(value)} cmH2O`;
  if (key === "venousTone") return value.toFixed(2);
  return `${value.toFixed(2)}x`;
};

export const LessonAuthoring: React.FC<LessonAuthoringProps> = ({ instances, stepsDraft, setStepsDraft, workbenchTheme }) => {
  const { t } = useTranslation();
  const allInstanceIds = useMemo(() => instances.map((instance) => instance.id), [instances]);
  const idsKey = instanceIdsKey(allInstanceIds);
  const instanceNameById = useMemo(() => new Map(instances.map((instance) => [instance.id, instance.name])), [instances]);
  const [stepTitleDraft, setStepTitleDraft] = useState("");
  const [stepNoteDraft, setStepNoteDraft] = useState<NoteContent>(EMPTY_AUTHOR_NOTE);
  const [stepVisibleIdsDraft, setStepVisibleIdsDraft] = useState<string[]>(allInstanceIds);
  const stepVisibleIdsKey = instanceIdsKey(stepVisibleIdsDraft);
  const [predictDraft, setPredictDraft] = useState(false);
  const [revealLabelDraft, setRevealLabelDraft] = useState(() => t("lessonAuthoring.reveal"));
  const [promptDraft, setPromptDraft] = useState("");
  const [exposedKnobsDraft, setExposedKnobsDraft] = useState<NumericKnobKey[]>([]);
  const [knobInstanceIdDraft, setKnobInstanceIdDraft] = useState<string | undefined>(allInstanceIds[0]);
  const [snapshotInitialDraft, setSnapshotInitialDraft] = useState(false);
  const [noteEditorKey, setNoteEditorKey] = useState(0);
  const stepCounterRef = useRef(0);
  const previousInstanceIdsRef = useRef<string[]>(allInstanceIds);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    setStepVisibleIdsDraft((current) => syncCheckedIds(current, previousInstanceIdsRef.current, allInstanceIds));
    previousInstanceIdsRef.current = allInstanceIds;
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setKnobInstanceIdDraft((current) => (
      current && stepVisibleIdsDraft.includes(current) ? current : stepVisibleIdsDraft[0]
    ));
  }, [stepVisibleIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetDrafts = () => {
    setStepTitleDraft("");
    setStepNoteDraft(EMPTY_AUTHOR_NOTE);
    setStepVisibleIdsDraft(allInstanceIds);
    setPredictDraft(false);
    setRevealLabelDraft(t("lessonAuthoring.reveal"));
    setPromptDraft("");
    setExposedKnobsDraft([]);
    setKnobInstanceIdDraft(allInstanceIds[0]);
    setSnapshotInitialDraft(false);
    setNoteEditorKey((key) => key + 1);
  };

  const toggleVisibleId = (id: string) => {
    setStepVisibleIdsDraft((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return [...current, id];
    });
  };

  const toggleExposedKnob = (key: NumericKnobKey) => {
    setExposedKnobsDraft((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      if (current.length >= 3) return current;
      return [...current, key];
    });
  };

  const captureStep = () => {
    if (stepVisibleIdsDraft.length === 0) {
      setWarning(t("lessonAuthoring.validation.visibleInstanceRequired"));
      return;
    }
    stepCounterRef.current += 1;
    const exposedKnobStage = buildExposedKnobStage(
      exposedKnobsDraft,
      knobInstanceIdDraft,
      stepVisibleIdsDraft,
      instances,
      snapshotInitialDraft,
    );
    const step: LessonStep = {
      id: `step-${Date.now()}-${stepCounterRef.current}`,
      ...(stepTitleDraft.trim() ? { title: stepTitleDraft.trim() } : {}),
      note: cloneNoteContent(stepNoteDraft),
      stage: {
        visibleInstances: [...stepVisibleIdsDraft],
        ...(exposedKnobStage ?? {}),
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

  const moveCapturedStep = (index: number, dir: -1 | 1) => {
    setStepsDraft((current) => moveStep(current, index, dir));
  };

  const finalStep = stepsDraft[stepsDraft.length - 1];
  const hasFinalPredictWarning = finalStep ? isPredictStep(finalStep) : false;
  const selectedKnobTarget = knobInstanceIdDraft
    ? instances.find((instance) => instance.id === knobInstanceIdDraft)
    : undefined;
  const showExposedTargetSelect = exposedKnobsDraft.length > 0 && stepVisibleIdsDraft.length > 1;
  const showSnapshotPreview = snapshotInitialDraft && exposedKnobsDraft.length > 0 && selectedKnobTarget;

  return (
    <section className="mb-2 rounded border border-slate-800 bg-[#0B1120] overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase font-bold text-blue-400 tracking-wide">{t("lessonAuthoring.title")}</div>
          <div className="text-sm font-bold text-slate-200">{t("lessonAuthoring.stepsCount", { count: stepsDraft.length })}</div>
        </div>
        <button
          onClick={captureStep}
          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
        >
          {t("lessonAuthoring.captureStep")}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(360px,1fr)_280px] gap-3 p-3">
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-bold text-slate-400 mb-1">{t("lessonAuthoring.stepTitle")}</span>
            <input
              value={stepTitleDraft}
              onChange={(event) => setStepTitleDraft(event.target.value)}
              className="w-full bg-slate-950 border border-slate-700 outline-none focus:border-blue-500 rounded px-3 py-2 text-sm text-slate-100"
              placeholder={t("lessonAuthoring.stepPlaceholder", { number: stepsDraft.length + 1 })}
            />
          </label>

          <div>
            <div className="text-xs font-bold text-slate-400 mb-2">{t("lessonAuthoring.visibleInstances")}</div>
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
            <span className="text-xs font-bold text-amber-200">{t("lessonAuthoring.predictBeforeReveal")}</span>
          </label>

          {predictDraft && (
            <div className="space-y-2">
              <input
                value={revealLabelDraft}
                onChange={(event) => setRevealLabelDraft(event.target.value)}
                className="w-full bg-slate-950 border border-slate-700 outline-none focus:border-amber-500 rounded px-3 py-2 text-xs text-slate-100"
                placeholder={t("lessonAuthoring.revealLabel")}
              />
              <input
                value={promptDraft}
                onChange={(event) => setPromptDraft(event.target.value)}
                className="w-full bg-slate-950 border border-slate-700 outline-none focus:border-amber-500 rounded px-3 py-2 text-xs text-slate-100"
                placeholder={t("lessonAuthoring.predictionPrompt")}
              />
            </div>
          )}

          <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-xs font-bold text-slate-400">{t("lessonAuthoring.exposedKnobs")}</div>
              {exposedKnobsDraft.length >= 3 && <div className="text-[11px] font-semibold text-amber-300">{t("lessonAuthoring.maxKnobs", { count: 3 })}</div>}
            </div>
            <div className="space-y-1.5">
              {KNOB_KEYS.map((key) => {
                const checked = exposedKnobsDraft.includes(key);
                const disabled = !checked && exposedKnobsDraft.length >= 3;
                return (
                  <label key={key} className={`flex items-center gap-2 rounded border border-slate-800 px-2 py-1.5 ${disabled ? "bg-slate-900/70 opacity-55" : "bg-slate-950/70"}`}>
                    <input
                      type="checkbox"
                      className="accent-blue-500"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleExposedKnob(key)}
                    />
                    <span className="text-xs font-bold text-slate-200 truncate">{translatedKnobLabel(t, key, KNOB_LABELS[key])}</span>
                  </label>
                );
              })}
            </div>

            {exposedKnobsDraft.length > 0 && (
              <div className="mt-3 space-y-2">
                {showExposedTargetSelect ? (
                  <label className="block">
                    <span className="block text-xs font-bold text-slate-400 mb-1">{t("lessonAuthoring.targetInstance")}</span>
                    <select
                      value={knobInstanceIdDraft ?? stepVisibleIdsDraft[0] ?? ""}
                      onChange={(event) => setKnobInstanceIdDraft(event.target.value || undefined)}
                      className="w-full bg-slate-950 border border-slate-700 outline-none focus:border-blue-500 rounded px-2 py-1.5 text-xs text-slate-100"
                    >
                      {stepVisibleIdsDraft.map((id) => (
                        <option key={id} value={id}>{instanceNameById.get(id) ?? id}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="text-[11px] font-semibold text-slate-500">
                    {t("lessonAuthoring.target", { target: instanceNameById.get(stepVisibleIdsDraft[0]) ?? stepVisibleIdsDraft[0] ?? t("common.none") })}
                  </div>
                )}
                <label className="flex items-center gap-2 rounded bg-slate-950/70 border border-slate-800 px-2 py-1.5">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={snapshotInitialDraft}
                    onChange={(event) => setSnapshotInitialDraft(event.target.checked)}
                  />
                  <span className="text-xs font-bold text-slate-200">{t("lessonAuthoring.startFromCurrentKnobValues")}</span>
                </label>
                {showSnapshotPreview && (
                  <div className="rounded bg-slate-950/70 border border-slate-800 px-2 py-1.5 text-[11px] text-slate-400">
                    {exposedKnobsDraft.map((key) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className="truncate">{translatedKnobLabel(t, key, KNOB_LABELS[key])}</span>
                        <span className="shrink-0 font-mono text-slate-200">{formatKnobValue(key, resolveKnobValue(selectedKnobTarget, key))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {warning && <div className="text-xs font-semibold text-amber-300">{warning}</div>}
        </div>

        <div className="min-h-[280px] rounded border border-slate-800 overflow-hidden">
          <NotePanel
            key={`step-note-${noteEditorKey}`}
            theme={workbenchTheme}
            mode="author"
            content={stepNoteDraft}
            onChange={setStepNoteDraft}
          />
        </div>

        <div className="rounded border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 text-xs font-bold text-slate-400">{t("lessonAuthoring.capturedSteps")}</div>
          {hasFinalPredictWarning && (
            <div className="px-3 py-2 border-b border-amber-500/20 bg-amber-500/10 text-[11px] font-semibold text-amber-200">
              {t("lessonAuthoring.finalPredictWarning")}
            </div>
          )}
          <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
            {stepsDraft.length === 0 ? (
              <div className="p-3 text-xs text-slate-500">{t("lessonAuthoring.noStepsCaptured")}</div>
            ) : (
              stepsDraft.map((step, index) => (
                <CapturedStepRow
                  key={step.id}
                  step={step}
                  index={index}
                  count={stepsDraft.length}
                  allInstanceIds={allInstanceIds}
                  instanceNameById={instanceNameById}
                  onMove={moveCapturedStep}
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
  count: number;
  allInstanceIds: string[];
  instanceNameById: Map<string, string>;
  onMove: (index: number, dir: -1 | 1) => void;
  onDelete: (id: string) => void;
}> = ({ step, index, count, allInstanceIds, instanceNameById, onMove, onDelete }) => {
  const { t } = useTranslation();
  const staleIds = staleVisibleIds(step, allInstanceIds);
  const visibleNames = step.stage.visibleInstances
    .map((id) => instanceNameById.get(id))
    .filter((name): name is string => Boolean(name));
  const visibleSummary = visibleNames.length > 0 ? t("lessonAuthoring.row.shows", { names: visibleNames.join(", ") }) : t("lessonAuthoring.row.showsNone");
  const knobTargetId = step.stage.knobInstanceId ?? step.stage.visibleInstances[0];
  const knobTargetName = knobTargetId ? (instanceNameById.get(knobTargetId) ?? knobTargetId) : t("common.none");
  const knobSummary = step.stage.exposedKnobs?.length
    ? t("lessonAuthoring.row.knobs", { knobs: step.stage.exposedKnobs.map((key) => translatedKnobLabel(t, key, KNOB_LABELS[key])).join(", "), target: knobTargetName })
    : undefined;
  const canMoveUp = index > 0;
  const canMoveDown = index < count - 1;
  const predict = isPredictStep(step);
  return (
    <div className="px-3 py-2 border-b border-slate-800 last:border-b-0 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-200 truncate">{index + 1}. {step.title || step.id}</div>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="text-[11px] text-slate-500 truncate" title={visibleSummary}>{visibleSummary}</div>
          {predict && (
            <span className="shrink-0 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-200">
              {t("lessonAuthoring.predictBadge")}
            </span>
          )}
        </div>
        {knobSummary && (
          <div className="text-[11px] text-blue-300 truncate" title={knobSummary}>{knobSummary}</div>
        )}
        {staleIds.length > 0 && (
          <div className="text-[11px] font-semibold text-amber-300 truncate">{t("lessonAuthoring.row.stale", { ids: staleIds.join(", ") })}</div>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={!canMoveUp}
          aria-label={t("lessonAuthoring.moveUpAria", { title: step.title || step.id })}
          title={t("lessonAuthoring.moveStepUp")}
          className="w-7 h-7 rounded bg-slate-800 text-[11px] font-bold text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-slate-800"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={!canMoveDown}
          aria-label={t("lessonAuthoring.moveDownAria", { title: step.title || step.id })}
          title={t("lessonAuthoring.moveStepDown")}
          className="w-7 h-7 rounded bg-slate-800 text-[11px] font-bold text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-slate-800"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => onDelete(step.id)}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-red-500/20 text-[11px] font-bold text-slate-400 hover:text-red-200 transition-colors"
        >
          {t("common.delete")}
        </button>
      </div>
    </div>
  );
};
