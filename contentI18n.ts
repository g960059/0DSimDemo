import type { CaseDocument, CaseI18nContent, CaseLocalizedPanel, CaseLocalizedInstance } from "@/caseDoc";
import type { Lesson, LessonI18nContent, LessonLocalizedStep } from "@/lessonDoc";
import type { NoteContent } from "@/noteTypes";

export const CONTENT_DEFAULT_LOCALE = "en";
const CASE_I18N_SCHEMA_VERSION = 2;
const LESSON_I18N_SCHEMA_VERSION = 2;

export type LocalizedResolution<T> = {
  doc: T;
  requestedLocale: string;
  resolvedLocale: string;
  defaultLocale: string;
  availableLocales: string[];
  isFallback: boolean;
};

function cleanLocale(locale: unknown): string | undefined {
  if (typeof locale !== "string") return undefined;
  const value = locale.trim().toLowerCase();
  return /^[a-z]{2}(-[a-z0-9]+)*$/i.test(value) ? value : undefined;
}

export function localeDisplayLabel(locale: string, displayLocale = locale): string {
  const normalized = cleanLocale(locale) ?? locale.trim().toLowerCase();
  if (!normalized) return locale;
  try {
    const label = new Intl.DisplayNames([cleanLocale(displayLocale) ?? CONTENT_DEFAULT_LOCALE], { type: "language" }).of(normalized);
    return label ? `${label} (${normalized.toUpperCase()})` : normalized.toUpperCase();
  } catch {
    return normalized.toUpperCase();
  }
}

function uniqueLocales(...groups: unknown[][]): string[] {
  const out: string[] = [];
  for (const group of groups) {
    for (const value of group) {
      const locale = cleanLocale(value);
      if (locale && !out.includes(locale)) out.push(locale);
    }
  }
  return out;
}

function noteOrUndefined(value: unknown): NoteContent | undefined {
  return Array.isArray(value) ? value as NoteContent : undefined;
}

function resolveLocale(i18n: Record<string, unknown> | undefined, requested: string, defaultLocale: string, availableLocales: string[]) {
  const requestedLocale = cleanLocale(requested) ?? defaultLocale;
  if (i18n?.[requestedLocale]) return requestedLocale;
  if (i18n?.[defaultLocale]) return defaultLocale;
  return availableLocales.find((locale) => i18n?.[locale]) ?? defaultLocale;
}

function lessonContentFromLegacy(lesson: Lesson): LessonI18nContent {
  const steps = lesson.steps?.reduce<Record<string, LessonLocalizedStep>>((acc, step) => {
    acc[step.id] = {
      ...(step.title ? { label: step.title } : {}),
      body: step.note,
      ...(step.stage.challenge?.prompt ? { challengePrompt: step.stage.challenge.prompt } : {}),
      ...(step.stage.challenge?.revealLabel ? { revealLabel: step.stage.challenge.revealLabel } : {}),
    };
    return acc;
  }, {});

  return {
    title: lesson.meta.title,
    ...(lesson.meta.objective ? { objective: lesson.meta.objective } : {}),
    ...(lesson.meta.level ? { level: lesson.meta.level } : {}),
    summary: lesson.noteSpine,
    ...(steps && Object.keys(steps).length > 0 ? { steps } : {}),
  };
}

export function normalizeLessonI18n(lesson: Lesson, defaultLocaleHint = CONTENT_DEFAULT_LOCALE): Lesson {
  const i18n = { ...(lesson.i18n ?? {}) };
  const defaultLocale = cleanLocale(lesson.defaultLocale) ?? cleanLocale(defaultLocaleHint) ?? CONTENT_DEFAULT_LOCALE;
  if (!i18n[defaultLocale]) {
    i18n[defaultLocale] = lessonContentFromLegacy(lesson);
  }
  const availableLocales = uniqueLocales(
    [defaultLocale],
    lesson.availableLocales ?? [],
    Object.keys(i18n),
  );
  return {
    ...lesson,
    schemaVersion: LESSON_I18N_SCHEMA_VERSION,
    defaultLocale,
    availableLocales,
    i18n,
  };
}

export function upsertLessonLocaleContent(
  lesson: Lesson,
  locale: string,
  content: LessonI18nContent = lessonContentFromLegacy(lesson),
): Lesson {
  const targetLocale = cleanLocale(locale) ?? cleanLocale(lesson.defaultLocale) ?? CONTENT_DEFAULT_LOCALE;
  const normalized = normalizeLessonI18n(lesson, targetLocale);
  const previous = normalized.i18n?.[targetLocale] ?? {};
  const i18n = {
    ...(normalized.i18n ?? {}),
    [targetLocale]: {
      ...previous,
      ...content,
    },
  };
  return {
    ...normalized,
    defaultLocale: cleanLocale(lesson.defaultLocale) ?? targetLocale,
    availableLocales: uniqueLocales([cleanLocale(lesson.defaultLocale) ?? targetLocale], normalized.availableLocales ?? [], [targetLocale], Object.keys(i18n)),
    i18n,
  };
}

export function resolveLocalizedLesson(lesson: Lesson, locale: string): LocalizedResolution<Lesson> {
  const normalized = normalizeLessonI18n(lesson);
  const resolvedLocale = resolveLocale(normalized.i18n, locale, normalized.defaultLocale ?? CONTENT_DEFAULT_LOCALE, normalized.availableLocales ?? []);
  const content = normalized.i18n?.[resolvedLocale];
  if (!content) {
    return {
      doc: normalized,
      requestedLocale: cleanLocale(locale) ?? normalized.defaultLocale ?? CONTENT_DEFAULT_LOCALE,
      resolvedLocale,
      defaultLocale: normalized.defaultLocale ?? CONTENT_DEFAULT_LOCALE,
      availableLocales: normalized.availableLocales ?? [resolvedLocale],
      isFallback: resolvedLocale !== (cleanLocale(locale) ?? resolvedLocale),
    };
  }

  const steps = normalized.steps?.map((step) => {
    const localizedStep = content.steps?.[step.id];
    return {
      ...step,
      ...(localizedStep?.label ? { title: localizedStep.label } : {}),
      ...(noteOrUndefined(localizedStep?.body) ? { note: localizedStep.body as NoteContent } : {}),
      stage: {
        ...step.stage,
        ...(step.stage.challenge && (localizedStep?.challengePrompt || localizedStep?.revealLabel) ? {
          challenge: {
            ...step.stage.challenge,
            ...(localizedStep.challengePrompt ? { prompt: localizedStep.challengePrompt } : {}),
            ...(localizedStep.revealLabel ? { revealLabel: localizedStep.revealLabel } : {}),
          },
        } : {}),
      },
    };
  });

  const doc: Lesson = {
    ...normalized,
    meta: {
      ...normalized.meta,
      ...(content.title ? { title: content.title } : {}),
      ...(content.objective ? { objective: content.objective } : {}),
      ...(content.level ? { level: content.level } : {}),
    },
    ...(noteOrUndefined(content.summary) ? { noteSpine: content.summary as NoteContent } : {}),
    ...(steps ? { steps } : {}),
  };

  const requestedLocale = cleanLocale(locale) ?? normalized.defaultLocale ?? CONTENT_DEFAULT_LOCALE;
  return {
    doc,
    requestedLocale,
    resolvedLocale,
    defaultLocale: normalized.defaultLocale ?? CONTENT_DEFAULT_LOCALE,
    availableLocales: normalized.availableLocales ?? [resolvedLocale],
    isFallback: requestedLocale !== resolvedLocale,
  };
}

function caseContentFromLegacy(doc: CaseDocument): CaseI18nContent {
  const panels = doc.panels.reduce<Record<string, CaseLocalizedPanel>>((acc, panel) => {
    if (panel.title) acc[panel.id] = { title: panel.title };
    return acc;
  }, {});
  const instances = doc.instances.reduce<Record<string, CaseLocalizedInstance>>((acc, instance) => {
    if (instance.name) acc[instance.id] = { name: instance.name };
    return acc;
  }, {});
  return {
    title: doc.spec.title || doc.meta.title,
    ...(doc.spec.description ? { description: doc.spec.description } : {}),
    modelLimitations: doc.spec.modelLimitations,
    ...(doc.notes ? { notes: doc.notes } : {}),
    ...(Object.keys(panels).length > 0 ? { panels } : {}),
    ...(Object.keys(instances).length > 0 ? { instances } : {}),
  };
}

export function normalizeCaseI18n(doc: CaseDocument, defaultLocaleHint = CONTENT_DEFAULT_LOCALE): CaseDocument {
  const i18n = { ...(doc.i18n ?? {}) };
  const defaultLocale = cleanLocale(doc.defaultLocale) ?? cleanLocale(defaultLocaleHint) ?? CONTENT_DEFAULT_LOCALE;
  if (!i18n[defaultLocale]) {
    i18n[defaultLocale] = caseContentFromLegacy(doc);
  }
  const availableLocales = uniqueLocales(
    [defaultLocale],
    doc.availableLocales ?? [],
    Object.keys(i18n),
  );
  return {
    ...doc,
    schemaVersion: CASE_I18N_SCHEMA_VERSION,
    defaultLocale,
    availableLocales,
    i18n,
  };
}

export function upsertCaseLocaleContent(
  doc: CaseDocument,
  locale: string,
  content: CaseI18nContent = caseContentFromLegacy(doc),
): CaseDocument {
  const targetLocale = cleanLocale(locale) ?? cleanLocale(doc.defaultLocale) ?? CONTENT_DEFAULT_LOCALE;
  const normalized = normalizeCaseI18n(doc, targetLocale);
  const previous = normalized.i18n?.[targetLocale] ?? {};
  const i18n = {
    ...(normalized.i18n ?? {}),
    [targetLocale]: {
      ...previous,
      ...content,
    },
  };
  return {
    ...normalized,
    defaultLocale: cleanLocale(doc.defaultLocale) ?? targetLocale,
    availableLocales: uniqueLocales([cleanLocale(doc.defaultLocale) ?? targetLocale], normalized.availableLocales ?? [], [targetLocale], Object.keys(i18n)),
    i18n,
  };
}

export function resolveLocalizedCaseDocument(doc: CaseDocument, locale: string): LocalizedResolution<CaseDocument> {
  const normalized = normalizeCaseI18n(doc);
  const resolvedLocale = resolveLocale(normalized.i18n, locale, normalized.defaultLocale ?? CONTENT_DEFAULT_LOCALE, normalized.availableLocales ?? []);
  const content = normalized.i18n?.[resolvedLocale];
  if (!content) {
    return {
      doc: normalized,
      requestedLocale: cleanLocale(locale) ?? normalized.defaultLocale ?? CONTENT_DEFAULT_LOCALE,
      resolvedLocale,
      defaultLocale: normalized.defaultLocale ?? CONTENT_DEFAULT_LOCALE,
      availableLocales: normalized.availableLocales ?? [resolvedLocale],
      isFallback: resolvedLocale !== (cleanLocale(locale) ?? resolvedLocale),
    };
  }

  const title = content.title ?? normalized.spec.title ?? normalized.meta.title;
  const docWithLocale: CaseDocument = {
    ...normalized,
    meta: {
      ...normalized.meta,
      title,
    },
    spec: {
      ...normalized.spec,
      title,
      ...(content.description !== undefined ? { description: content.description } : {}),
      ...(content.modelLimitations ? { modelLimitations: content.modelLimitations } : {}),
    },
    instances: normalized.instances.map((instance) => ({
      ...instance,
      ...(content.instances?.[instance.id]?.name ? { name: content.instances[instance.id].name } : {}),
    })),
    panels: normalized.panels.map((panel) => ({
      ...panel,
      ...(content.panels?.[panel.id]?.title ? { title: content.panels[panel.id].title } : {}),
    })),
    ...(content.notes ? { notes: content.notes } : {}),
  };

  const requestedLocale = cleanLocale(locale) ?? normalized.defaultLocale ?? CONTENT_DEFAULT_LOCALE;
  return {
    doc: docWithLocale,
    requestedLocale,
    resolvedLocale,
    defaultLocale: normalized.defaultLocale ?? CONTENT_DEFAULT_LOCALE,
    availableLocales: normalized.availableLocales ?? [resolvedLocale],
    isFallback: requestedLocale !== resolvedLocale,
  };
}

export function resolveLocalized(doc: Lesson, locale: string): LocalizedResolution<Lesson>;
export function resolveLocalized(doc: CaseDocument, locale: string): LocalizedResolution<CaseDocument>;
export function resolveLocalized(doc: Lesson | CaseDocument, locale: string): LocalizedResolution<Lesson | CaseDocument> {
  return "instances" in doc
    ? resolveLocalizedCaseDocument(doc, locale)
    : resolveLocalizedLesson(doc, locale);
}
