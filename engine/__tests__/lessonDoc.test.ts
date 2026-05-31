import { describe, expect, it } from "vitest";
import { caseDocumentToSimInstances } from "@/caseDoc";
import { LESSONS, lessonById } from "@/lessonDoc";
import { officialCaseById } from "@/officialCases";

describe("lesson registry", () => {
  it("resolves each lesson caseId to official case instances", () => {
    expect(LESSONS.length).toBeGreaterThan(0);
    for (const lesson of LESSONS) {
      expect(lessonById(lesson.meta.id)).toBe(lesson);
      const caseDoc = officialCaseById(lesson.caseId);
      expect(caseDoc).toBeDefined();
      expect(caseDocumentToSimInstances(caseDoc!).length).toBe(caseDoc!.instances.length);
    }
  });
});
