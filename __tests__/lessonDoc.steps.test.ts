import { describe, expect, it } from "vitest";
import { LESSONS, lessonById, resolveLessonCase } from "@/lessonDoc";
import { resolveReadingColumn } from "@/readingConversion";
import { shouldUseReading } from "@/components/reading/LessonReadingRoute";

const EXPECTED_LESSON_IDS = [
  "normal-reference",
  "acute-anterior-mi",
  "systolic-heart-failure",
  "diastolic-heart-failure",
  "aortic-stenosis",
  "hypovolemic-shock",
];

describe("official lesson registry (stepless reading articles)", () => {
  it("registers exactly the expected stepless lessons", () => {
    expect(LESSONS.map((l) => l.meta.id)).toEqual(EXPECTED_LESSON_IDS);
    for (const lesson of LESSONS) {
      expect(lesson.steps, `${lesson.meta.id} must be stepless`).toBeUndefined();
      expect(lesson.noteSpine.length).toBeGreaterThan(0);
      expect(lesson.meta.level).toBe("Beginner");
      expect(lesson.meta.objective).toBeTruthy();
    }
  });

  for (const id of EXPECTED_LESSON_IDS) {
    it(`${id} routes through the reading presenter with a resolved column`, () => {
      const lesson = lessonById(id);
      expect(lesson).toBeDefined();
      const caseDoc = resolveLessonCase(lesson!);
      expect(caseDoc).toBeDefined();
      expect(shouldUseReading(lesson!, caseDoc!)).toBe(true);

      const resolved = resolveReadingColumn(caseDoc!);
      expect("column" in resolved).toBe(true);
      if ("column" in resolved) {
        // Role-sorted derived order: note -> waveform -> pvloop -> metrics -> controls.
        const ids = resolved.column.map((e) => (e.kind === "noteRef" ? e.noteId : e.panelId));
        expect(ids).toEqual(["p_note", "p1", "p2", "p3", "p4"]);
      }
    });
  }

  it("keeps normal-reference working and one-page (no steps)", () => {
    const lesson = lessonById("normal-reference");
    expect(lesson?.steps).toBeUndefined();
    expect(lesson?.noteSpine.length).toBeGreaterThan(0);
    expect(lesson?.caseId).toBe("normal-sinus");
  });
});
