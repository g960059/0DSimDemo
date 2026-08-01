import { type Locale, prefixPath } from "./localeRouting";

export const workbenchHref = (locale?: Locale) => prefixPath("/workbench", locale);

export const articlesHref = (locale?: Locale) => prefixPath("/articles", locale);

export const homeHref = (locale?: Locale) => prefixPath("/", locale);
