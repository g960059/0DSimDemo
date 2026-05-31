import { describe, expect, it } from "vitest";
import { caseDocumentToSimInstances } from "@/caseDoc";
import { lessonById } from "@/lessonDoc";
import { officialCaseById } from "@/officialCases";

describe("stepped lesson registry", () => {
  it("keeps stepped visibleInstances within the resolved case ids and eventually reveals all instances", () => {
    const lesson = lessonById("lv-failure-inotrope");
    expect(lesson?.steps?.length).toBe(2);

    const caseDoc = officialCaseById(lesson!.caseId);
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
  });

  it("keeps one-page lessons on noteSpine without steps", () => {
    const lesson = lessonById("normal-reference");

    expect(lesson?.steps).toBeUndefined();
    expect(lesson?.noteSpine.length).toBeGreaterThan(0);
  });
});
