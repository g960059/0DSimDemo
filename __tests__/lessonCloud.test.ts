import { describe, expect, it } from 'vitest';
import { docContentToLesson, isValidLessonId, lessonDocFields } from '../lessonCloud';
import { LESSONS, type Lesson } from '../lessonDoc';

const lesson = LESSONS[0];

describe('lessonCloud pure helpers', () => {
  it('builds Firestore lesson fields with bounded title, JSON content, and order', () => {
    const fields = lessonDocFields({
      ...lesson,
      meta: { ...lesson.meta, title: 'x'.repeat(250) },
    });

    expect(fields.title).toHaveLength(200);
    expect(fields.order).toBe(0);
    expect(JSON.parse(fields.content).meta.id).toBe(lesson.meta.id);
  });

  it('rejects content over the Firestore rules size guard', () => {
    const tooLarge: Lesson = {
      meta: { id: 'huge', title: 'Huge' },
      caseId: 'normal-sinus',
      noteSpine: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'x'.repeat(500001), styles: {} }],
        },
      ],
    };

    expect(() => lessonDocFields(tooLarge)).toThrow(/too large/);
  });

  it('parses content only when JSON, lesson schema, and expected id all match', () => {
    const content = JSON.stringify(lesson);

    expect(docContentToLesson(content, lesson.meta.id)?.meta.id).toBe(lesson.meta.id);
    expect(docContentToLesson(content, 'other-id')).toBeUndefined();
    expect(docContentToLesson('{bad json', lesson.meta.id)).toBeUndefined();
    expect(docContentToLesson(JSON.stringify({ meta: { id: lesson.meta.id } }), lesson.meta.id)).toBeUndefined();
    expect(docContentToLesson({ content }, lesson.meta.id)).toBeUndefined();
  });

  it('validates Firestore-safe lesson ids', () => {
    expect(isValidLessonId('abc-XYZ_123')).toBe(true);
    expect(isValidLessonId('')).toBe(false);
    expect(isValidLessonId('has space')).toBe(false);
    expect(isValidLessonId('slash/id')).toBe(false);
    expect(isValidLessonId('x'.repeat(128))).toBe(true);
    expect(isValidLessonId('x'.repeat(129))).toBe(false);
  });
});
