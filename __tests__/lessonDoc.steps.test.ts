import { describe, expect, it } from "vitest";
import { caseDocumentToSimInstances } from "@/caseDoc";
import { lessonById, resolveLessonCase } from "@/lessonDoc";

describe("stepped lesson registry", () => {
  it("keeps stepped visibleInstances within the resolved case ids and eventually reveals all instances", () => {
    const lesson = lessonById("lv-failure-inotrope");
    expect(lesson?.steps?.length).toBe(2);
    const [predictStep, revealStep] = lesson!.steps!;

    const caseDoc = resolveLessonCase(lesson!);
    expect(caseDoc).toBeDefined();
    const resolvedIds = new Set(caseDocumentToSimInstances(caseDoc!).map((inst) => inst.id));
    const visibleUnion = new Set<string>();

    for (const step of lesson!.steps!) {
      for (const id of step.stage.visibleInstances) {
        expect(resolvedIds.has(id), `${step.id} references unknown instance ${id}`).toBe(true);
        visibleUnion.add(id);
      }
    }

    expect([...visibleUnion].sort()).toEqual([...resolvedIds].sort());
    expect(predictStep.stage.visibleInstances).toEqual(["1"]);
    expect(predictStep.stage.exposedKnobs).toEqual(["contractility"]);
    expect(predictStep.stage.knobInstanceId).toBe("1");
    expect(revealStep.stage.visibleInstances).toEqual(["1", "2"]);
    expect(revealStep.stage.exposedKnobs).toBeUndefined();
    expect(predictStep.stage.challenge?.kind).toBe("predict");
    expect(predictStep.stage.challenge?.revealLabel).toBeTruthy();
    expect(revealStep.stage.challenge?.kind).not.toBe("predict");
    expect(lesson!.steps!.at(-1)?.stage.challenge?.kind).not.toBe("predict");
  });

  it("keeps one-page lessons on noteSpine without steps", () => {
    const lesson = lessonById("normal-reference");

    expect(lesson?.steps).toBeUndefined();
    expect(lesson?.noteSpine.length).toBeGreaterThan(0);
  });
});
