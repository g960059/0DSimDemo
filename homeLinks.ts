import { type Locale, prefixPath } from "./localeRouting";

export const lessonHref = (id: string, locale?: Locale) => prefixPath(`/lesson/${encodeURIComponent(id)}`, locale);

export const caseHref = (id: string, locale?: Locale) => `${prefixPath(`/workbench/${encodeURIComponent(id)}`, locale)}?from=cases`;

export const workbenchHref = (locale?: Locale) => prefixPath("/workbench", locale);

export const allCasesHref = (locale?: Locale) => prefixPath("/cases", locale);

export const authorPreviewHref = (locale?: Locale) => prefixPath("/studio/author", locale);

export const readerPreviewHref = (previewId: string, locale?: Locale) =>
  prefixPath(`/studio/preview/${encodeURIComponent(previewId)}`, locale);

export const homeHref = (locale?: Locale) => prefixPath("/", locale);
