import { type Locale, prefixPath } from "./localeRouting";
import {
  isOpaqueWorkbenchIdV3,
} from "./studio/infrastructure/browser/StudioWorkbenchIdentityV3";

export const workbenchHref = (locale?: Locale) => prefixPath("/workbench", locale);

export const workbenchDetailHref = ({
  locale,
  workbenchId,
}: Readonly<{
  locale?: Locale;
  workbenchId: string;
}>) => {
  if (!isOpaqueWorkbenchIdV3(workbenchId)) {
    throw new Error("Workbench detail href requires a URL-safe opaque identity");
  }
  return prefixPath(`/workbench/${workbenchId}`, locale);
};

export const articlesHref = (locale?: Locale) => prefixPath("/articles", locale);

export const homeHref = (locale?: Locale) => prefixPath("/", locale);
