import { doc, getDoc, getDocFromServer, serverTimestamp, setDoc } from 'firebase/firestore';
import type { Lesson } from './lessonDoc';
import { parseLesson } from './lessonPersist';
import { normalizeLessonI18n, resolveLocalizedLesson } from './contentI18n';

const MAX_CONTENT_SIZE = 500000;
const LESSON_ID_RE = /^[a-zA-Z0-9_-]+$/;

export type LessonDocFields = {
  title: string;
  content: string;
  order: number;
  defaultLocale: string;
  availableLocales: string[];
};

export type PublishLessonResult =
  | { ok: true }
  | { ok: false; code?: string; message: string };

export function isValidLessonId(id: string): boolean {
  return id.length > 0 && id.length <= 128 && LESSON_ID_RE.test(id);
}

export function lessonDocFields(lesson: Lesson): LessonDocFields {
  const normalized = normalizeLessonI18n(lesson, lesson.defaultLocale);
  const resolvedDefault = resolveLocalizedLesson(normalized, normalized.defaultLocale ?? "en").doc;
  const content = JSON.stringify(normalized);
  if (content.length > MAX_CONTENT_SIZE) {
    throw new Error(`Lesson content is too large (${content.length}/${MAX_CONTENT_SIZE} characters).`);
  }
  return {
    title: resolvedDefault.meta.title.slice(0, 200),
    content,
    order: 0,
    defaultLocale: normalized.defaultLocale ?? "en",
    availableLocales: normalized.availableLocales ?? [normalized.defaultLocale ?? "en"],
  };
}

export function docContentToLesson(content: unknown, expectedId: string): Lesson | undefined {
  if (typeof content !== 'string') return undefined;
  try {
    const lesson = parseLesson(JSON.parse(content));
    return lesson?.meta.id === expectedId ? normalizeLessonI18n(lesson) : undefined;
  } catch {
    return undefined;
  }
}

function errorCode(err: unknown): string | undefined {
  return err && typeof err === 'object' && 'code' in err && typeof (err as { code?: unknown }).code === 'string'
    ? (err as { code: string }).code
    : undefined;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Lesson publish failed.';
}

async function lessonRef(id: string) {
  const { db } = await import('./firebaseSetup');
  return doc(db, 'lessons', id);
}

export async function publishLesson(lesson: Lesson, authorUid: string): Promise<PublishLessonResult> {
  if (!isValidLessonId(lesson.meta.id)) {
    return { ok: false, message: 'Lesson id must contain only letters, numbers, underscores, or hyphens.' };
  }

  let fields: LessonDocFields;
  try {
    fields = lessonDocFields(lesson);
  } catch (err) {
    return { ok: false, message: errorMessage(err) };
  }

  try {
    const ref = await lessonRef(lesson.meta.id);
    const existing = await getDocFromServer(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        ...fields,
        status: 'published',
        authorId: authorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { ok: true };
    }

    const data = existing.data();
    await setDoc(ref, {
      ...fields,
      status: 'published',
      authorId: data.authorId,
      createdAt: data.createdAt,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, code: errorCode(err), message: errorMessage(err) };
  }
}

export async function fetchPublishedLesson(id: string): Promise<Lesson | undefined> {
  if (!isValidLessonId(id)) return undefined;
  try {
    const snapshot = await getDoc(await lessonRef(id));
    if (!snapshot.exists()) return undefined;
    const data = snapshot.data();
    if (data.status !== 'published') return undefined;
    return docContentToLesson(data.content, id);
  } catch {
    return undefined;
  }
}
