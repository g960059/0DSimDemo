import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { caseDocumentToSimInstances, simInstancesToCaseDocument } from "@/caseDoc";
import { LESSONS, lessonById, resolveLessonCase, type Lesson, type StageManifest } from "@/lessonDoc";
import { createUserLessonId, getUserLesson, listUserLessons, saveLesson, USER_LESSONS_KEY } from "@/lessonPersist";
import { officialCaseById } from "@/officialCases";
import type { NoteContent } from "@/noteTypes";

const NOTE: NoteContent = [
  { type: "paragraph", content: [{ type: "text", text: "Authored lesson note.", styles: {} }] },
];

const stageManifestRejectsBooleanKnob: StageManifest = {
  visibleInstances: ["1"],
  // @ts-expect-error baroreflexEnabled is boolean-only and cannot be exposed as a numeric lesson knob.
  exposedKnobs: ["baroreflexEnabled"],
};
void stageManifestRejectsBooleanKnob;

function installLocalStorageShim(opts: { failSetItem?: boolean } = {}) {
  const data = new Map<string, string>();
  const shim: Storage = {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => { data.delete(key); },
    setItem: (key: string, value: string) => {
      if (opts.failSetItem) throw new Error("quota");
      data.set(key, value);
    },
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
    const lesson = embeddedLesson();

    expect(saveLesson(lesson)).toBe(true);
    expect(getUserLesson(lesson.meta.id)).toMatchObject({
      ...lesson,
      schemaVersion: 2,
      defaultLocale: "en",
      availableLocales: ["en"],
    });
    expect(getUserLesson(lesson.meta.id)?.i18n?.en?.title).toBe(lesson.meta.title);
    expect(getUserLesson(lesson.meta.id)?.i18n?.en?.summary).toEqual(lesson.noteSpine);
    expect(listUserLessons()).toHaveLength(1);
    expect(resolveLessonCase(lesson)?.meta.id).toBe("normal-sinus");
    expect(caseDocumentToSimInstances(resolveLessonCase(lesson)!).length).toBeGreaterThan(0);
  });

  it("round-trips valid exposed knob stage fields through localStorage", () => {
    const lesson: Lesson = {
      ...embeddedLesson("user-exposed-knobs"),
      steps: [{
        id: "step-knobs",
        note: NOTE,
        stage: {
          visibleInstances: ["1"],
          exposedKnobs: ["contractility", "HR", "peep"],
          knobInstanceId: "1",
          initialState: { contractility: 1.2, HR: 90 },
        },
      }],
    };

    expect(saveLesson(lesson)).toBe(true);
    expect(getUserLesson(lesson.meta.id)?.steps?.[0].stage).toEqual(lesson.steps?.[0].stage);
  });

  it("drops only malformed exposed knob fields while preserving otherwise valid steps", () => {
    localStorage.setItem(USER_LESSONS_KEY, `{
      "version": 1,
      "lessons": [{
        "meta": { "id": "user-bad-knobs", "title": "Bad knobs" },
        "caseId": "normal-sinus",
        "noteSpine": ${JSON.stringify(NOTE)},
        "steps": [
          { "id": "too-many", "note": ${JSON.stringify(NOTE)}, "stage": { "visibleInstances": ["1"], "exposedKnobs": ["contractility", "HR", "peep", "afterload"] } },
          { "id": "duplicate", "note": ${JSON.stringify(NOTE)}, "stage": { "visibleInstances": ["1"], "exposedKnobs": ["contractility", "contractility"] } },
          { "id": "unknown-key", "note": ${JSON.stringify(NOTE)}, "stage": { "visibleInstances": ["1"], "exposedKnobs": ["contractility", "unknown"] } },
          { "id": "boolean-key", "note": ${JSON.stringify(NOTE)}, "stage": { "visibleInstances": ["1"], "exposedKnobs": ["baroreflexEnabled"] } },
          { "id": "bad-target", "note": ${JSON.stringify(NOTE)}, "stage": { "visibleInstances": ["1"], "exposedKnobs": ["contractility"], "knobInstanceId": "2" } },
          { "id": "partial-initial", "note": ${JSON.stringify(NOTE)}, "stage": { "visibleInstances": ["1"], "initialState": { "contractility": 1e999, "HR": 88, "baroreflexEnabled": true, "unknown": 1 } } },
          { "id": "all-bad-initial", "note": ${JSON.stringify(NOTE)}, "stage": { "visibleInstances": ["1"], "initialState": { "contractility": "high" } } }
        ]
      }]
    }`);

    const lesson = getUserLesson("user-bad-knobs")!;
    expect(lesson.steps?.map((step) => step.id)).toEqual([
      "too-many",
      "duplicate",
      "unknown-key",
      "boolean-key",
      "bad-target",
      "partial-initial",
      "all-bad-initial",
    ]);
    expect(lesson.steps?.[0].stage.exposedKnobs).toBeUndefined();
    expect(lesson.steps?.[1].stage.exposedKnobs).toBeUndefined();
    expect(lesson.steps?.[2].stage.exposedKnobs).toBeUndefined();
    expect(lesson.steps?.[3].stage.exposedKnobs).toBeUndefined();
    expect(lesson.steps?.[4].stage.exposedKnobs).toEqual(["contractility"]);
    expect(lesson.steps?.[4].stage.knobInstanceId).toBeUndefined();
    expect(lesson.steps?.[5].stage.initialState).toEqual({ HR: 88 });
    expect(lesson.steps?.[6].stage.initialState).toBeUndefined();
  });

  it("resolves embedded and official caseId lessons, and leaves invalid or non-displayable embedded cases unresolved", () => {
    const embedded = embeddedLesson();
    const official = LESSONS[0];
    const invalidEmbedded = {
      ...embedded,
      case: { ...embedded.case!, schemaVersion: 999 },
    };
    const nonDisplayableEmbedded = {
      ...embedded,
      case: { ...embedded.case!, spec: { ...embedded.case!.spec, modelLimitations: [] } },
    };

    expect(resolveLessonCase(embedded)?.meta.id).toBe("normal-sinus");
    expect(resolveLessonCase(official)?.meta.id).toBe(official.caseId);
    expect(resolveLessonCase(invalidEmbedded)).toBeUndefined();
    expect(resolveLessonCase(nonDisplayableEmbedded)).toBeUndefined();
    expect(LESSONS.every((lesson) => !!resolveLessonCase(lesson))).toBe(true);
  });

  it("merges static lessons with user lessons while keeping official ids authoritative", () => {
    const userLesson = embeddedLesson("user-custom");
    expect(saveLesson(userLesson)).toBe(true);
    expect(saveLesson({ ...embeddedLesson("normal-reference"), meta: { id: "normal-reference", title: "Collision" } })).toBe(true);

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
        {
          ...embeddedLesson("user-bad-step"),
          steps: [{ id: "bad-step", note: NOTE, stage: { visibleInstances: "1" } }],
        },
      ],
    }));

    const lessons = listUserLessons();
    expect(lessons.map((lesson) => lesson.meta.id)).toEqual(["user-good", "user-bad-step"]);
    expect(lessons.find((lesson) => lesson.meta.id === "user-bad-step")?.steps).toBeUndefined();
  });

  it("returns false when localStorage cannot persist a lesson", () => {
    installLocalStorageShim({ failSetItem: true });
    const lesson = embeddedLesson("user-quota");

    expect(saveLesson(lesson)).toBe(false);
    expect(getUserLesson(lesson.meta.id)).toBeUndefined();
  });

  it("throws while building a lesson case from a half-built knob-primary instance", () => {
    const source = officialCaseById("normal-sinus")!;
    const [instance] = caseDocumentToSimInstances(source);
    const halfBuilt = { ...instance, knobBaseline: undefined };

    expect(() => simInstancesToCaseDocument([halfBuilt], source.panels, {
      id: "half-built",
      title: "Half-built",
      createdAt: 1,
      updatedAt: 1,
      spec: source.spec,
    })).toThrow(/knobs but no knobBaseline/);
  });

  it("guards every localStorage access for node environments", () => {
    Reflect.deleteProperty(globalThis, "localStorage");

    expect(listUserLessons()).toEqual([]);
    expect(getUserLesson("x")).toBeUndefined();
    expect(saveLesson(embeddedLesson("user-no-storage"))).toBe(false);
  });
});
