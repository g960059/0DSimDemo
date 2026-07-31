import { type Locale, prefixPath } from "./localeRouting";

export const workbenchHref = (locale?: Locale) => prefixPath("/workbench", locale);

export const homeHref = (locale?: Locale) => prefixPath("/", locale);
