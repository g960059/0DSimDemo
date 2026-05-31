import type { Lesson } from "@/lessonDoc";
import { parseCaseDocument } from "@/casePersist";

export const USER_LESSONS_KEY = "hemosim:user-lessons:v1";

type PersistedLessonCollection = {
  version: 1;
  lessons: unknown[];
};

export function createUserLessonId(now = Date.now(), random = Math.random()): string {
  return `user-${now}-${random.toString(36).slice(2, 10)}`;
}

function storage(): Storage | undefined {
  return typeof localStorage === "undefined" ? undefined : localStorage;
}

function parseLesson(value: unknown): Lesson | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const meta = raw.meta;
  if (!meta || typeof meta !== "object") return null;
  const rawMeta = meta as Record<string, unknown>;
  if (typeof rawMeta.id !== "string" || typeof rawMeta.title !== "string") return null;
  if (!Array.isArray(raw.noteSpine)) return null;

  const lesson: Lesson = {
    meta: {
      id: rawMeta.id,
      title: rawMeta.title,
      ...(typeof rawMeta.objective === "string" ? { objective: rawMeta.objective } : {}),
      ...(typeof rawMeta.level === "string" ? { level: rawMeta.level } : {}),
      ...(typeof rawMeta.createdAt === "number" ? { createdAt: rawMeta.createdAt } : {}),
    },
    noteSpine: raw.noteSpine,
    ...(Array.isArray(raw.steps) ? { steps: raw.steps as Lesson["steps"] } : {}),
  };

  if (typeof raw.caseId === "string") lesson.caseId = raw.caseId;
  if (raw.case !== undefined) {
    try {
      lesson.case = parseCaseDocument(JSON.stringify(raw.case));
    } catch {
      return null;
    }
  }

  return lesson.case || lesson.caseId ? lesson : null;
}

function parseCollection(text: string | null): Lesson[] {
  if (!text) return [];
  try {
    const raw = JSON.parse(text) as Partial<PersistedLessonCollection>;
    if (!raw || raw.version !== 1 || !Array.isArray(raw.lessons)) return [];
    return raw.lessons.flatMap((entry) => {
      const lesson = parseLesson(entry);
      return lesson ? [lesson] : [];
    });
  } catch {
    return [];
  }
}

export function listUserLessons(): Lesson[] {
  return parseCollection(storage()?.getItem(USER_LESSONS_KEY) ?? null);
}

export function getUserLesson(id: string): Lesson | undefined {
  return listUserLessons().find((lesson) => lesson.meta.id === id);
}

export function saveLesson(lesson: Lesson): Lesson {
  const s = storage();
  if (!s) return lesson;
  const lessons = listUserLessons();
  const next = [lesson, ...lessons.filter((entry) => entry.meta.id !== lesson.meta.id)];
  try {
    s.setItem(USER_LESSONS_KEY, JSON.stringify({ version: 1, lessons: next }));
  } catch {
    /* local lesson persistence is best-effort; authoring should not crash */
  }
  return lesson;
}
