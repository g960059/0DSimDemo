import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { caseDocumentToSimInstances } from "@/caseDoc";
import { LESSONS, lessonById, resolveLessonCase, type Lesson } from "@/lessonDoc";
import { createUserLessonId, getUserLesson, listUserLessons, saveLesson, USER_LESSONS_KEY } from "@/lessonPersist";
import { officialCaseById } from "@/officialCases";
import type { NoteContent } from "@/noteTypes";

const NOTE: NoteContent = [
  { type: "paragraph", content: [{ type: "text", text: "Authored lesson note.", styles: {} }] },
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

function embeddedLesson(id = createUserLessonId(1, 0.25)): Lesson {
  return {
    meta: { id, title: "User authored lesson", createdAt: 1 },
    case: officialCaseById("normal-sinus")!,
    noteSpine: NOTE,
  };
}

describe("lesson persistence and resolution", () => {
  beforeEach(() => installLocalStorageShim());
  afterEach(() => {
    globalThis.localStorage?.clear();
    Reflect.deleteProperty(globalThis, "localStorage");
  });

  it("round-trips an embedded-case lesson through localStorage", () => {
    const lesson = saveLesson(embeddedLesson());

    expect(getUserLesson(lesson.meta.id)).toEqual(lesson);
    expect(listUserLessons()).toHaveLength(1);
    expect(resolveLessonCase(lesson)?.meta.id).toBe("normal-sinus");
    expect(caseDocumentToSimInstances(resolveLessonCase(lesson)!).length).toBeGreaterThan(0);
  });

  it("resolves embedded and official caseId lessons, and leaves invalid embedded cases unresolved", () => {
    const embedded = embeddedLesson();
    const official = LESSONS[0];
    const invalidEmbedded = {
      ...embedded,
      case: { ...embedded.case!, schemaVersion: 999 },
    };

    expect(resolveLessonCase(embedded)?.meta.id).toBe("normal-sinus");
    expect(resolveLessonCase(official)?.meta.id).toBe(official.caseId);
    expect(resolveLessonCase(invalidEmbedded)).toBeUndefined();
    expect(LESSONS.every((lesson) => !!resolveLessonCase(lesson))).toBe(true);
  });

  it("merges static lessons with user lessons while keeping official ids authoritative", () => {
    const userLesson = saveLesson(embeddedLesson("user-custom"));
    saveLesson({ ...embeddedLesson("normal-reference"), meta: { id: "normal-reference", title: "Collision" } });

    expect(lessonById(userLesson.meta.id)?.meta.title).toBe("User authored lesson");
    expect(lessonById("normal-reference")?.meta.title).toBe("Normal Physiology Reference");
  });

  it("skips malformed localStorage values and corrupt entries", () => {
    localStorage.setItem(USER_LESSONS_KEY, "{not json");
    expect(listUserLessons()).toEqual([]);

    localStorage.setItem(USER_LESSONS_KEY, JSON.stringify({
      version: 1,
      lessons: [
        embeddedLesson("user-good"),
        { meta: { id: "bad", title: "Bad" }, noteSpine: NOTE, case: "not a case" },
        { meta: { id: "missing-case", title: "Missing" }, noteSpine: NOTE },
      ],
    }));

    expect(listUserLessons().map((lesson) => lesson.meta.id)).toEqual(["user-good"]);
  });

  it("guards every localStorage access for node environments", () => {
    Reflect.deleteProperty(globalThis, "localStorage");

    expect(listUserLessons()).toEqual([]);
    expect(getUserLesson("x")).toBeUndefined();
    expect(saveLesson(embeddedLesson("user-no-storage")).meta.id).toBe("user-no-storage");
  });
});
