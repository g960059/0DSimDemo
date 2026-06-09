import type { LessonStep, NumericKnobKey } from "@/lessonDoc";
import type { NoteContent } from "@/noteTypes";
import type { SimInstance } from "@/types";
import { resolveKnobValue } from "@/lessonKnobs";

export const EMPTY_AUTHOR_NOTE: NoteContent = [
  { type: "paragraph", content: [{ type: "text", text: "", styles: {} }] },
];

export type NormalizedStepsResult =
  | { ok: true; steps?: LessonStep[] }
  | { ok: false; message: string };

export function cloneNoteContent(note: NoteContent): NoteContent {
  return JSON.parse(JSON.stringify(note)) as NoteContent;
}

export function instanceIdsKey(ids: string[]): string {
  return ids.join("\u001f");
}

export function syncCheckedIds(prevChecked: string[], prevIds: string[], nextIds: string[]): string[] {
  const next = new Set(nextIds);
  const prev = new Set(prevIds);
  const kept = prevChecked.filter((id) => next.has(id));
  const checked = new Set(prevChecked);
  const added = nextIds.filter((id) => !prev.has(id) && !checked.has(id));
  return [...kept, ...added];
}

export function moveStep(steps: LessonStep[], index: number, dir: -1 | 1): LessonStep[] {
  const target = index + dir;
  if (index < 0 || index >= steps.length || target < 0 || target >= steps.length) return steps;

  const next = [...steps];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function isPredictStep(step: LessonStep): boolean {
  return step.stage.challenge?.kind === "predict";
}

export function buildExposedKnobStage(
  exposedKnobs: NumericKnobKey[],
  requestedTargetId: string | undefined,
  visibleInstanceIds: string[],
  instances: SimInstance[],
  snapshotInitial: boolean,
): Pick<LessonStep["stage"], "exposedKnobs" | "knobInstanceId" | "initialState"> | undefined {
  const uniqueKnobs = Array.from(new Set(exposedKnobs)).slice(0, 3);
  if (uniqueKnobs.length === 0 || visibleInstanceIds.length === 0) return undefined;

  const targetId = requestedTargetId && visibleInstanceIds.includes(requestedTargetId)
    ? requestedTargetId
    : visibleInstanceIds[0];
  const targetInstance = instances.find((instance) => instance.id === targetId);
  if (snapshotInitial && !targetInstance) return undefined;

  return {
    exposedKnobs: uniqueKnobs,
    knobInstanceId: targetId,
    ...(snapshotInitial && targetInstance ? {
      initialState: Object.fromEntries(
        uniqueKnobs.map((key) => [key, resolveKnobValue(targetInstance, key)]),
      ) as Partial<Record<NumericKnobKey, number>>,
    } : {}),
  };
}

export function staleVisibleIds(step: LessonStep, validIds: Iterable<string>): string[] {
  const valid = new Set(validIds);
  return step.stage.visibleInstances.filter((id) => !valid.has(id));
}

export function normalizeStepsForSave(steps: LessonStep[], validIds: Iterable<string>): NormalizedStepsResult {
  if (steps.length === 0) return { ok: true };
  if (isPredictStep(steps[steps.length - 1])) {
    return { ok: false, message: "Add a reveal step after the final predict step before saving." };
  }

  const valid = new Set(validIds);
  const normalized = steps.map((step) => {
    const visibleInstances = step.stage.visibleInstances.filter((id) => valid.has(id));
    const shouldPruneExposedKnobs = Boolean(
      step.stage.exposedKnobs
      && step.stage.knobInstanceId
      && !visibleInstances.includes(step.stage.knobInstanceId),
    );
    const stage = { ...step.stage };
    if (shouldPruneExposedKnobs) {
      delete stage.exposedKnobs;
      delete stage.knobInstanceId;
      delete stage.initialState;
    }
    return {
      ...step,
      note: cloneNoteContent(step.note),
      stage: {
        ...stage,
        visibleInstances,
      },
    };
  });

  const emptyStep = normalized.find((step) => step.stage.visibleInstances.length === 0);
  if (emptyStep) {
    return { ok: false, message: `Step "${emptyStep.title || emptyStep.id}" has no valid visible scenarios.` };
  }

  return { ok: true, steps: normalized };
}
