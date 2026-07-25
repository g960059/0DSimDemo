import type { CaseDocument, CaseI18nContent, CaseLocalizedPanel, CaseLocalizedInstance } from "@/caseDoc";
import type { NoteContent } from "@/noteTypes";

export const CONTENT_DEFAULT_LOCALE = "en";
const CASE_I18N_SCHEMA_VERSION = 2;

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
