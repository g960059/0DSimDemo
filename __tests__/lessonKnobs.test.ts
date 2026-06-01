import { describe, expect, it } from "vitest";
import { caseDocumentToSimInstances } from "@/caseDoc";
import { officialCaseById } from "@/officialCases";
import { applyExposedKnob, deriveStepInstances, resolveKnobTarget, resolveKnobValue } from "@/lessonKnobs";
import type { LessonStep } from "@/lessonDoc";
import type { NoteContent } from "@/noteTypes";

const NOTE: NoteContent = [
  { type: "paragraph", content: [{ type: "text", text: "Knob step.", styles: {} }] },
];

function step(stage: LessonStep["stage"]): LessonStep {
  return { id: "step", note: NOTE, stage };
}

function instances() {
  return caseDocumentToSimInstances(officialCaseById("lv-failure-dobutamine")!);
}

describe("lesson exposed knobs", () => {
  it("applies an exposed knob as a knob-primary edit and clamps out-of-range values", () => {
    const [inst] = instances();
    const changed = applyExposedKnob(inst, "contractility", 1.2);
    const clamped = applyExposedKnob(inst, "contractility", 999);

    expect(changed).not.toBe(inst);
    expect(changed.knobs?.contractility).toBe(1.2);
    expect(changed.knobBaseline).toBe(inst.knobBaseline);
    expect(changed.params.lvTmaxScale).not.toBe(inst.params.lvTmaxScale);
    expect(clamped.knobs?.contractility).toBe(2.5);
  });

  it("round-trips override-producing knobs through neutral without leaving stale override state", () => {
    const [inst] = instances();
    const stiff = applyExposedKnob(inst, "diastolicStiffness", 0.52);
    const neutral = applyExposedKnob(stiff, "diastolicStiffness", 1);
    const stiffAgain = applyExposedKnob(neutral, "diastolicStiffness", 0.52);

    expect(stiff.params.nodeOverrides?.LV).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(neutral.params, "nodeOverrides")).toBe(true);
    expect(neutral.params.nodeOverrides).toBeUndefined();
    expect(stiffAgain.params.nodeOverrides).toEqual(stiff.params.nodeOverrides);
  });

  it("resolves displayed knob values from the same state used for edits", () => {
    const [inst] = instances();
    const changed = applyExposedKnob(inst, "contractility", 1.2);

    expect(resolveKnobValue(inst, "contractility")).toBe(0.52);
    expect(resolveKnobValue(changed, "contractility")).toBe(1.2);
  });

  it("resolves the knob target by explicit visible id, fallback, and invalid absence", () => {
    expect(resolveKnobTarget(step({ visibleInstances: ["1", "2"], knobInstanceId: "2" }), ["1", "2"])).toBe("2");
    expect(resolveKnobTarget(step({ visibleInstances: ["1", "2"], knobInstanceId: "missing" }), ["1", "2"])).toBe("1");
    expect(resolveKnobTarget(step({ visibleInstances: ["missing"] }), ["1", "2"])).toBeUndefined();
    expect(resolveKnobTarget(undefined, ["1"])).toBeUndefined();
  });

  it("derives step instances from base with initial state only on the target", () => {
    const base = instances();
    const derived = deriveStepInstances(base, step({
      visibleInstances: ["1", "2"],
      knobInstanceId: "1",
      initialState: { contractility: 1.1 },
    }));

    expect(derived).not.toBe(base);
    expect(derived[0]).not.toBe(base[0]);
    expect(derived[0].knobs?.contractility).toBe(1.1);
    expect(derived[1]).toBe(base[1]);
  });

  it("returns base references when a step has no initial state", () => {
    const base = instances();

    expect(deriveStepInstances(base, undefined)).toBe(base);
    expect(deriveStepInstances(base, step({ visibleInstances: ["1"], exposedKnobs: ["contractility"] }))).toBe(base);
  });
});
