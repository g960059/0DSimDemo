import type { Lesson, LessonI18nContent, LessonLocalizedStep, NumericKnobKey } from "@/lessonDoc";
import { parseCaseDocument } from "@/casePersist";
import { KNOB_RANGES } from "@/engine/knobs";
import type { NoteContent } from "@/noteTypes";

export const USER_LESSONS_KEY = "circleheart:user-lessons:v1";

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

function isNumericKnobKey(value: unknown): value is NumericKnobKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(KNOB_RANGES, value);
}

function parseSteps(value: unknown): Lesson["steps"] | undefined {
  if (!Array.isArray(value)) return undefined;
  const steps = value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const step = entry as Record<string, unknown>;
    const stage = step.stage;
    if (typeof step.id !== "string" || !Array.isArray(step.note) || !stage || typeof stage !== "object") return [];

    const rawStage = stage as Record<string, unknown>;
    if (!Array.isArray(rawStage.visibleInstances) || !rawStage.visibleInstances.every((id) => typeof id === "string")) return [];

    const parsedStage: NonNullable<Lesson["steps"]>[number]["stage"] = {
      visibleInstances: rawStage.visibleInstances as string[],
    };
    if (rawStage.visiblePanels !== undefined) {
      const validPanels = ["waveform", "pvloop", "metrics"];
      if (!Array.isArray(rawStage.visiblePanels) || !rawStage.visiblePanels.every((panel) => typeof panel === "string" && validPanels.includes(panel))) return [];
      parsedStage.visiblePanels = rawStage.visiblePanels as NonNullable<Lesson["steps"]>[number]["stage"]["visiblePanels"];
    }
    if (rawStage.exposedKnobs !== undefined && Array.isArray(rawStage.exposedKnobs)) {
      const unique = new Set(rawStage.exposedKnobs);
      if (
        rawStage.exposedKnobs.length >= 1
        && rawStage.exposedKnobs.length <= 3
        && unique.size === rawStage.exposedKnobs.length
        && rawStage.exposedKnobs.every(isNumericKnobKey)
      ) {
        parsedStage.exposedKnobs = rawStage.exposedKnobs;
      }
    }
    if (typeof rawStage.knobInstanceId === "string" && parsedStage.visibleInstances.includes(rawStage.knobInstanceId)) {
      parsedStage.knobInstanceId = rawStage.knobInstanceId;
    }
    if (rawStage.initialState && typeof rawStage.initialState === "object" && !Array.isArray(rawStage.initialState)) {
      const initialState: Partial<Record<NumericKnobKey, number>> = {};
      for (const [key, rawValue] of Object.entries(rawStage.initialState as Record<string, unknown>)) {
        if (isNumericKnobKey(key) && typeof rawValue === "number" && Number.isFinite(rawValue)) {
          initialState[key] = rawValue;
        }
      }
      if (Object.keys(initialState).length > 0) parsedStage.initialState = initialState;
    }
    if (rawStage.challenge !== undefined) {
      if (!rawStage.challenge || typeof rawStage.challenge !== "object") return [];
      const challenge = rawStage.challenge as Record<string, unknown>;
      if (challenge.kind !== "predict" && challenge.kind !== "free") return [];
      parsedStage.challenge = {
        kind: challenge.kind,
        ...(typeof challenge.prompt === "string" ? { prompt: challenge.prompt } : {}),
        ...(typeof challenge.revealLabel === "string" ? { revealLabel: challenge.revealLabel } : {}),
      };
    }

    return [{
      id: step.id,
      ...(typeof step.title === "string" ? { title: step.title } : {}),
      note: step.note,
      stage: parsedStage,
    }];
  });
  return steps.length > 0 ? steps : undefined;
}

function parseLocalizedSteps(value: unknown): Record<string, LessonLocalizedStep> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const steps: Record<string, LessonLocalizedStep> = {};
  for (const [id, rawStep] of Object.entries(value as Record<string, unknown>)) {
    if (!rawStep || typeof rawStep !== "object" || Array.isArray(rawStep)) continue;
    const entry = rawStep as Record<string, unknown>;
    const parsed: LessonLocalizedStep = {
      ...(typeof entry.label === "string" ? { label: entry.label } : {}),
      ...(Array.isArray(entry.body) ? { body: entry.body } : {}),
      ...(typeof entry.challengePrompt === "string" ? { challengePrompt: entry.challengePrompt } : {}),
      ...(typeof entry.revealLabel === "string" ? { revealLabel: entry.revealLabel } : {}),
    };
    if (Object.keys(parsed).length > 0) steps[id] = parsed;
  }
  return Object.keys(steps).length > 0 ? steps : undefined;
}

function parseLessonI18n(value: unknown): Record<string, LessonI18nContent> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const i18n: Record<string, LessonI18nContent> = {};
  for (const [locale, rawContent] of Object.entries(value as Record<string, unknown>)) {
    if (!rawContent || typeof rawContent !== "object" || Array.isArray(rawContent)) continue;
    const entry = rawContent as Record<string, unknown>;
    const steps = parseLocalizedSteps(entry.steps);
    const content: LessonI18nContent = {
      ...(typeof entry.title === "string" ? { title: entry.title } : {}),
      ...(typeof entry.objective === "string" ? { objective: entry.objective } : {}),
      ...(typeof entry.level === "string" ? { level: entry.level } : {}),
      ...(Array.isArray(entry.summary) ? { summary: entry.summary } : {}),
      ...(steps ? { steps } : {}),
    };
    if (Object.keys(content).length > 0) i18n[locale] = content;
  }
  return Object.keys(i18n).length > 0 ? i18n : undefined;
}

function lessonI18nFromLegacy(rawMeta: Record<string, unknown>, noteSpine: NoteContent, steps?: Lesson["steps"]): Record<string, LessonI18nContent> {
  const localizedSteps = steps?.reduce<Record<string, LessonLocalizedStep>>((acc, step) => {
    acc[step.id] = {
      ...(step.title ? { label: step.title } : {}),
      body: step.note,
      ...(step.stage.challenge?.prompt ? { challengePrompt: step.stage.challenge.prompt } : {}),
      ...(step.stage.challenge?.revealLabel ? { revealLabel: step.stage.challenge.revealLabel } : {}),
    };
    return acc;
  }, {});
  return {
    en: {
      title: rawMeta.title as string,
      ...(typeof rawMeta.objective === "string" ? { objective: rawMeta.objective } : {}),
      ...(typeof rawMeta.level === "string" ? { level: rawMeta.level } : {}),
      summary: noteSpine,
      ...(localizedSteps && Object.keys(localizedSteps).length > 0 ? { steps: localizedSteps } : {}),
    },
  };
}

function parseLessonLocales(raw: Record<string, unknown>, rawMeta: Record<string, unknown>, noteSpine: NoteContent, steps?: Lesson["steps"]) {
  const i18n = parseLessonI18n(raw.i18n) ?? lessonI18nFromLegacy(rawMeta, noteSpine, steps);
  const defaultLocale = typeof raw.defaultLocale === "string" ? raw.defaultLocale : Object.keys(i18n)[0] ?? "en";
  const availableLocales = Array.isArray(raw.availableLocales) && raw.availableLocales.every((locale) => typeof locale === "string")
    ? raw.availableLocales
    : Array.from(new Set([defaultLocale, ...Object.keys(i18n)]));
  return { defaultLocale, availableLocales, i18n };
}

export function parseLesson(value: unknown): Lesson | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const meta = raw.meta;
  if (!meta || typeof meta !== "object") return null;
  const rawMeta = meta as Record<string, unknown>;
  if (typeof rawMeta.id !== "string" || typeof rawMeta.title !== "string") return null;
  if (!Array.isArray(raw.noteSpine)) return null;
  const steps = parseSteps(raw.steps);
  const localized = parseLessonLocales(raw, rawMeta, raw.noteSpine, steps);

  const lesson: Lesson = {
    ...(typeof raw.schemaVersion === "number" ? { schemaVersion: raw.schemaVersion } : { schemaVersion: 2 }),
    defaultLocale: localized.defaultLocale,
    availableLocales: localized.availableLocales,
    i18n: localized.i18n,
    meta: {
      id: rawMeta.id,
      title: rawMeta.title,
      ...(typeof rawMeta.objective === "string" ? { objective: rawMeta.objective } : {}),
      ...(typeof rawMeta.level === "string" ? { level: rawMeta.level } : {}),
      ...(typeof rawMeta.createdAt === "number" ? { createdAt: rawMeta.createdAt } : {}),
    },
    noteSpine: raw.noteSpine,
    ...(steps ? { steps } : {}),
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

export function saveLesson(lesson: Lesson): boolean {
  const s = storage();
  if (!s) return false;
  const lessons = listUserLessons();
  const next = [lesson, ...lessons.filter((entry) => entry.meta.id !== lesson.meta.id)];
  try {
    s.setItem(USER_LESSONS_KEY, JSON.stringify({ version: 1, lessons: next }));
    return getUserLesson(lesson.meta.id)?.meta.id === lesson.meta.id;
  } catch {
    /* local lesson persistence is best-effort; authoring should not crash */
    return false;
  }
}
