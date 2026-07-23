import { type Locale, prefixPath } from "./localeRouting";

export const lessonHref = (id: string, locale?: Locale) => prefixPath(`/lesson/${encodeURIComponent(id)}`, locale);

export const caseHref = (id: string, locale?: Locale) => `${prefixPath(`/workbench/${encodeURIComponent(id)}`, locale)}?from=cases`;

export const workbenchHref = (locale?: Locale) => prefixPath("/workbench", locale);

export const allCasesHref = (locale?: Locale) => prefixPath("/cases", locale);

export const integratedPreviewHref = (locale?: Locale) =>
  prefixPath("/integrated-preview", locale);

export const homeHref = (locale?: Locale) => prefixPath("/", locale);
