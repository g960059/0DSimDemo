import type { LessonStep } from "@/lessonDoc";
import type { NoteContent } from "@/noteTypes";

export const EMPTY_AUTHOR_NOTE: NoteContent = [
  { type: "paragraph", content: [{ type: "text", text: "", styles: {} }] },
];

export type NormalizedStepsResult =
  | { ok: true; steps?: LessonStep[] }
  | { ok: false; message: string };

export function cloneNoteContent(note: NoteContent): NoteContent {
  return JSON.parse(JSON.stringify(note)) as NoteContent;
}

export function syncCheckedIds(prevChecked: string[], nextIds: string[]): string[] {
  const next = new Set(nextIds);
  const kept = prevChecked.filter((id) => next.has(id));
  const keptSet = new Set(kept);
  const added = nextIds.filter((id) => !keptSet.has(id));
  return [...kept, ...added];
}

export function staleVisibleIds(step: LessonStep, validIds: Iterable<string>): string[] {
  const valid = new Set(validIds);
  return step.stage.visibleInstances.filter((id) => !valid.has(id));
}

export function normalizeStepsForSave(steps: LessonStep[], validIds: Iterable<string>): NormalizedStepsResult {
  if (steps.length === 0) return { ok: true };
  if (steps[steps.length - 1].stage.challenge?.kind === "predict") {
    return { ok: false, message: "Add a reveal step after the final predict step before saving." };
  }

  const valid = new Set(validIds);
  const normalized = steps.map((step) => {
    const visibleInstances = step.stage.visibleInstances.filter((id) => valid.has(id));
    return {
      ...step,
      note: cloneNoteContent(step.note),
      stage: {
        ...step.stage,
        visibleInstances,
      },
    };
  });

  const emptyStep = normalized.find((step) => step.stage.visibleInstances.length === 0);
  if (emptyStep) {
    return { ok: false, message: `Step "${emptyStep.title || emptyStep.id}" has no valid visible instances.` };
  }

  return { ok: true, steps: normalized };
}
