import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { caseDocumentToSimInstances } from "@/caseDoc";
import { cloneNoteContent, normalizeStepsForSave } from "@/lessonAuthoring";
import type { Lesson, LessonStep } from "@/lessonDoc";
import { getUserLesson, saveLesson } from "@/lessonPersist";
import { officialCaseById } from "@/officialCases";
import type { NoteContent } from "@/noteTypes";

const NOTE: NoteContent = [
  { type: "paragraph", content: [{ type: "text", text: "Step note.", styles: {} }] },
];

function installLocalStorageShim() {
  const data = new Map<string, string>();
  const shim: Storage = {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => { data.delete(key); },
    setItem: (key: string, value: string) => { data.set(key, value); },
  };
  Object.defineProperty(globalThis, "localStorage", { value: shim, configurable: true });
}

function step(id: string, visibleInstances: string[], predict = false): LessonStep {
  return {
    id,
    title: id,
    note: cloneNoteContent(NOTE),
    stage: {
      visibleInstances,
      ...(predict ? { challenge: { kind: "predict", revealLabel: "Reveal" } } : {}),
    },
  };
}

describe("lesson authoring step normalization", () => {
  beforeEach(() => installLocalStorageShim());
  afterEach(() => {
    globalThis.localStorage?.clear();
    Reflect.deleteProperty(globalThis, "localStorage");
  });

  it("normalizes draft steps so visibleInstances stay within embedded case ids", () => {
    const caseDoc = officialCaseById("lv-failure-dobutamine")!;
    const ids = new Set(caseDoc.instances.map((instance) => instance.id));
    const result = normalizeStepsForSave([
      step("step-1", ["1", "stale"], true),
      step("step-2", ["1", "2", "missing"]),
    ], ids);

    expect(result.ok).toBe(true);
    expect(result.ok && result.steps?.map((item) => item.stage.visibleInstances)).toEqual([["1"], ["1", "2"]]);
    expect(result.ok && result.steps?.every((item) => item.stage.visibleInstances.every((id) => ids.has(id)))).toBe(true);
  });

  it("round-trips captured steps through user lesson persistence", () => {
    const caseDoc = officialCaseById("lv-failure-dobutamine")!;
    const normalized = normalizeStepsForSave([
      step("step-1", ["1"], true),
      step("step-2", ["1", "2"]),
    ], caseDoc.instances.map((instance) => instance.id));
    expect(normalized.ok).toBe(true);

    const lesson: Lesson = {
      meta: { id: "user-stepped", title: "Stepped", createdAt: 1 },
      case: caseDoc,
      noteSpine: NOTE,
      steps: normalized.ok ? normalized.steps : undefined,
    };

    expect(saveLesson(lesson)).toBe(true);
    const saved = getUserLesson("user-stepped");
    expect(saved?.steps).toEqual(lesson.steps);
    expect(saved?.steps?.[0].stage.challenge?.kind).toBe("predict");
    expect(caseDocumentToSimInstances(saved!.case!).map((instance) => instance.id)).toEqual(["1", "2"]);
  });

  it("blocks saving when the final step is predict", () => {
    const result = normalizeStepsForSave([
      step("step-1", ["1"]),
      step("step-2", ["1"], true),
    ], ["1"]);

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.message : "").toMatch(/reveal step/);
  });

  it("keeps one-page saves unchanged when no steps are captured", () => {
    const result = normalizeStepsForSave([], ["1"]);

    expect(result).toEqual({ ok: true });
  });

  it("blocks a step whose stale ids prune to empty", () => {
    const result = normalizeStepsForSave([step("step-empty", ["stale"])], ["1"]);

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.message : "").toMatch(/no valid visible instances/);
  });
});
