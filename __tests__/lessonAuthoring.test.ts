import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { caseDocumentToSimInstances } from "@/caseDoc";
import {
  buildExposedKnobStage,
  cloneNoteContent,
  instanceIdsKey,
  isPredictStep,
  moveStep,
  normalizeStepsForSave,
  staleVisibleIds,
  syncCheckedIds,
} from "@/lessonAuthoring";
import type { Lesson, LessonStep } from "@/lessonDoc";
import { getUserLesson, saveLesson } from "@/lessonPersist";
import { officialCaseById } from "@/officialCases";
import type { NoteContent } from "@/noteTypes";
import { resolveKnobValue } from "@/lessonKnobs";

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
      ...(predict ? { challenge: { kind: "predict", prompt: "Predict before reveal.", revealLabel: "Reveal treatment" } } : {}),
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

  it("builds exposed knob stage with visible target fallback, dedupe, cap, and no default snapshot", () => {
    const instances = caseDocumentToSimInstances(officialCaseById("lv-failure-dobutamine")!);
    const result = buildExposedKnobStage(
      ["contractility", "contractility", "HR", "peep", "afterload"],
      "missing",
      ["1", "2"],
      instances,
      false,
    );

    expect(result).toEqual({
      exposedKnobs: ["contractility", "HR", "peep"],
      knobInstanceId: "1",
    });
  });

  it("does not build exposed knob stage without knobs or visible ids", () => {
    const instances = caseDocumentToSimInstances(officialCaseById("lv-failure-dobutamine")!);

    expect(buildExposedKnobStage([], "1", ["1"], instances, false)).toBeUndefined();
    expect(buildExposedKnobStage(["contractility"], "1", [], instances, false)).toBeUndefined();
  });

  it("snapshots initial state only for exposed keys from the target instance", () => {
    const instances = caseDocumentToSimInstances(officialCaseById("lv-failure-dobutamine")!);
    const result = buildExposedKnobStage(["contractility", "HR"], "2", ["1", "2"], instances, true);

    expect(result?.exposedKnobs).toEqual(["contractility", "HR"]);
    expect(result?.knobInstanceId).toBe("2");
    expect(Object.keys(result?.initialState ?? {})).toEqual(["contractility", "HR"]);
    expect(result?.initialState?.contractility).toBe(resolveKnobValue(instances[1], "contractility"));
    expect(result?.initialState?.HR).toBe(resolveKnobValue(instances[1], "HR"));
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
    expect(saved?.steps?.[0].stage.challenge?.prompt).toBe("Predict before reveal.");
    expect(saved?.steps?.[0].stage.challenge?.revealLabel).toBe("Reveal treatment");
    expect(caseDocumentToSimInstances(saved!.case!).map((instance) => instance.id)).toEqual(["1", "2"]);
  });

  it("round-trips exposed knob authoring fields through user lesson persistence", () => {
    const caseDoc = officialCaseById("lv-failure-dobutamine")!;
    const instances = caseDocumentToSimInstances(caseDoc);
    const exposed = buildExposedKnobStage(["contractility", "HR"], "1", ["1"], instances, true)!;
    const normalized = normalizeStepsForSave([{
      ...step("step-exposed", ["1"]),
      stage: {
        visibleInstances: ["1"],
        ...exposed,
      },
    }], caseDoc.instances.map((instance) => instance.id));
    expect(normalized.ok).toBe(true);

    const lesson: Lesson = {
      meta: { id: "user-exposed", title: "Exposed", createdAt: 2 },
      case: caseDoc,
      noteSpine: NOTE,
      steps: normalized.ok ? normalized.steps : undefined,
    };

    expect(saveLesson(lesson)).toBe(true);
    const saved = getUserLesson("user-exposed");
    expect(saved?.steps?.[0].stage.exposedKnobs).toEqual(["contractility", "HR"]);
    expect(saved?.steps?.[0].stage.knobInstanceId).toBe("1");
    expect(saved?.steps?.[0].stage.initialState).toEqual(exposed.initialState);
  });

  it("keeps checked ids stable across same-id reference churn", () => {
    expect(syncCheckedIds(["1"], ["1", "2"], ["1", "2"])).toEqual(["1"]);
  });

  it("default-checks only genuinely new ids after an existing id was unchecked", () => {
    expect(syncCheckedIds(["1"], ["1", "2"], ["1", "2", "3"])).toEqual(["1", "3"]);
  });

  it("drops removed ids without re-checking previously unchecked ids", () => {
    expect(syncCheckedIds(["1"], ["1", "2"], ["1"])).toEqual(["1"]);
    expect(syncCheckedIds(["2"], ["1", "2"], ["2", "3"])).toEqual(["2", "3"]);
  });

  it("uses a stable value key for instance ids", () => {
    expect(instanceIdsKey(["1", "2"])).toBe(instanceIdsKey(["1", "2"]));
    expect(instanceIdsKey(["1", "2"])).not.toBe(instanceIdsKey(["2", "1"]));
  });

  it("moves steps without changing ids, length, or duplicating entries", () => {
    const steps = [
      step("step-1", ["1"]),
      step("step-2", ["1", "2"], true),
      step("step-3", ["2"]),
    ];
    const moved = moveStep(steps, 1, 1);
    const movedIds = moved.map((item) => item.id);

    expect(moved).not.toBe(steps);
    expect(movedIds).toEqual(["step-1", "step-3", "step-2"]);
    expect(moved).toHaveLength(steps.length);
    expect(new Set(movedIds)).toEqual(new Set(steps.map((item) => item.id)));
    expect(new Set(movedIds)).toHaveLength(movedIds.length);
    expect(moved[2]).toBe(steps[1]);
  });

  it("moves an interior step up without changing ids, length, or duplicating entries", () => {
    const steps = [
      step("step-1", ["1"]),
      step("step-2", ["1", "2"], true),
      step("step-3", ["2"]),
    ];
    const moved = moveStep(steps, 2, -1);
    const movedIds = moved.map((item) => item.id);

    expect(moved).not.toBe(steps);
    expect(movedIds).toEqual(["step-1", "step-3", "step-2"]);
    expect(moved).toHaveLength(steps.length);
    expect(new Set(movedIds)).toEqual(new Set(steps.map((item) => item.id)));
    expect(new Set(movedIds)).toHaveLength(movedIds.length);
    expect(moved[1]).toBe(steps[2]);
  });

  it("returns the same array reference for out-of-bounds step moves", () => {
    const steps = [step("step-1", ["1"])];

    expect(moveStep(steps, 0, -1)).toBe(steps);
    expect(moveStep(steps, 0, 1)).toBe(steps);
    expect(moveStep(steps, -1, 1)).toBe(steps);
    expect(moveStep(steps, 1, -1)).toBe(steps);
  });

  it("reports stale visible ids for captured steps before save-time pruning", () => {
    expect(staleVisibleIds(step("step-stale", ["1", "removed"]), ["1", "2"])).toEqual(["removed"]);
  });

  it("uses the shared predict predicate for badges and save validation", () => {
    expect(isPredictStep(step("step-predict", ["1"], true))).toBe(true);
    expect(isPredictStep(step("step-reveal", ["1"]))).toBe(false);
  });

  it("blocks saving when the final step is predict", () => {
    const result = normalizeStepsForSave([
      step("step-1", ["1"]),
      step("step-2", ["1"], true),
    ], ["1"]);

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.message : "").toMatch(/reveal step/);
  });

  it("blocks saving when reorder moves a predict step to the end", () => {
    const steps = [
      step("step-1", ["1"]),
      step("step-2", ["1"], true),
      step("step-3", ["1"]),
    ];
    const reordered = moveStep(steps, 1, 1);
    const result = normalizeStepsForSave(reordered, ["1"]);

    expect(reordered.map((item) => item.id)).toEqual(["step-1", "step-3", "step-2"]);
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
    expect(result.ok === false ? result.message : "").toMatch(/no valid visible scenarios/);
  });

  it("keeps exposed knob fields when the explicit target survives pruning", () => {
    const result = normalizeStepsForSave([{
      ...step("step-exposed", ["1", "2", "stale"]),
      stage: {
        visibleInstances: ["1", "2", "stale"],
        exposedKnobs: ["contractility"],
        knobInstanceId: "2",
        initialState: { contractility: 1.2 },
      },
    }], ["1", "2"]);

    expect(result.ok).toBe(true);
    expect(result.ok && result.steps?.[0].stage).toMatchObject({
      visibleInstances: ["1", "2"],
      exposedKnobs: ["contractility"],
      knobInstanceId: "2",
      initialState: { contractility: 1.2 },
    });
  });

  it("prunes exposed knob fields together when the explicit target is removed but keeps the step", () => {
    const result = normalizeStepsForSave([{
      ...step("step-prune", ["1", "2"]),
      stage: {
        visibleInstances: ["1", "2"],
        exposedKnobs: ["contractility"],
        knobInstanceId: "2",
        initialState: { contractility: 1.2 },
      },
    }], ["1"]);

    expect(result.ok).toBe(true);
    const stage = result.ok ? result.steps?.[0].stage : undefined;
    expect(stage?.visibleInstances).toEqual(["1"]);
    expect(stage).not.toHaveProperty("exposedKnobs");
    expect(stage).not.toHaveProperty("knobInstanceId");
    expect(stage).not.toHaveProperty("initialState");
  });

  it("does not prune legacy exposed knob steps without an explicit target", () => {
    const result = normalizeStepsForSave([{
      ...step("step-legacy", ["1", "stale"]),
      stage: {
        visibleInstances: ["1", "stale"],
        exposedKnobs: ["contractility"],
        initialState: { contractility: 1.2 },
      },
    }], ["1"]);

    expect(result.ok).toBe(true);
    expect(result.ok && result.steps?.[0].stage).toMatchObject({
      visibleInstances: ["1"],
      exposedKnobs: ["contractility"],
      initialState: { contractility: 1.2 },
    });
    expect(result.ok && result.steps?.[0].stage.knobInstanceId).toBeUndefined();
  });
});
