export const SUPPORTED_LOCALES = ["ja", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";
export const FALLBACK_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "circleheart.locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function localePrefixFromPathname(pathname: string): Locale | undefined {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return isLocale(firstSegment) ? firstSegment : undefined;
}

export function localeFromPathname(pathname: string): Locale {
  return localePrefixFromPathname(pathname) ?? DEFAULT_LOCALE;
}

export function stripLocaleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const withoutLocale = isLocale(segments[0]) ? segments.slice(1) : segments;
  const normalizedPath = `/${withoutLocale.join("/")}`;
  return normalizedPath === "/" || normalizedPath === "//" ? "/" : normalizedPath;
}

export function prefixPath(path: string, locale: Locale = DEFAULT_LOCALE): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath === "/" ? `/${locale}` : `/${locale}${normalizedPath}`;
}

export function switchLocalePath(pathname: string, search: string, hash: string, locale: Locale): string {
  const canonicalPath = stripLocaleFromPathname(pathname);
  return `${prefixPath(canonicalPath, locale)}${search}${hash}`;
}

export function detectPreferredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }

  const languages = window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language];
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }

  return DEFAULT_LOCALE;
}

export function setPreferredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Preference persistence is best-effort only.
  }
}
