export const SUPPORTED_LOCALES = ["ja", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";
export const FALLBACK_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "circleheart.locale";
export const LOCALE_COOKIE_KEY = "__session";
export const LOCALE_COOKIE_VALUE_PREFIX = "circleheart-locale-v1.";
export const LOCALE_NEGOTIATION_PATH = "/_locale";
const LOCALE_COOKIE_MAX_AGE_SECONDS = 31_536_000;

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

export function localeFromCookieHeader(
  cookieHeader: string | null | undefined,
): Locale | undefined {
  const value = cookieValueFromHeaderV1(cookieHeader, LOCALE_COOKIE_KEY);
  if (value === undefined || !value.startsWith(LOCALE_COOKIE_VALUE_PREFIX)) {
    return undefined;
  }
  const locale = value.slice(LOCALE_COOKIE_VALUE_PREFIX.length);
  return isLocale(locale) ? locale : undefined;
}

function cookieValueFromHeaderV1(
  cookieHeader: string | null | undefined,
  cookieName: string,
): string | undefined {
  if (cookieHeader === null || cookieHeader === undefined) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== cookieName) {
      continue;
    }
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      // A malformed saved preference must not block locale negotiation.
      return undefined;
    }
  }
  return undefined;
}

export function localeFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): Locale | undefined {
  if (acceptLanguage === null || acceptLanguage === undefined) return undefined;
  let best: Readonly<{ locale: Locale; quality: number; order: number }> | null = null;
  for (const [order, item] of acceptLanguage.split(",").entries()) {
    const [rawRange = "", ...rawParameters] = item.trim().split(";");
    const locale = rawRange.toLowerCase().split("-")[0];
    if (!isLocale(locale)) continue;
    let quality = 1;
    const qualityParameter = rawParameters.find((parameter) =>
      /^\s*q\s*=/i.test(parameter));
    if (qualityParameter !== undefined) {
      const parsed = Number(qualityParameter.split("=", 2)[1]?.trim());
      quality = Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
        ? parsed
        : 0;
    }
    if (quality === 0) continue;
    if (
      best === null
      || quality > best.quality
      || (quality === best.quality && order < best.order)
    ) {
      best = Object.freeze({ locale, quality, order });
    }
  }
  return best?.locale;
}

export function detectPreferredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }

  if (typeof document !== "undefined") {
    const cookieLocale = localeFromCookieHeader(document.cookie);
    if (cookieLocale !== undefined) return cookieLocale;
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
  if (typeof document === "undefined") return;
  try {
    const existingSession = cookieValueFromHeaderV1(
      document.cookie,
      LOCALE_COOKIE_KEY,
    );
    if (
      existingSession !== undefined
      && !existingSession.startsWith(LOCALE_COOKIE_VALUE_PREFIX)
    ) {
      // Never overwrite a future server-owned session with a locale hint.
      return;
    }
    const secure = window.location?.protocol === "https:" ? "; Secure" : "";
    const cookieValue = `${LOCALE_COOKIE_VALUE_PREFIX}${locale}`;
    document.cookie = `${LOCALE_COOKIE_KEY}=${encodeURIComponent(cookieValue)}`
      + `; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
      + secure;
  } catch {
    // Cookie persistence can be blocked independently from local storage.
  }
}
