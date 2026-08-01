import { type Locale, prefixPath } from "./localeRouting";
import {
  isOpaqueWorkbenchIdV3,
} from "./studio/infrastructure/browser/StudioWorkbenchIdentityV3";

/** Experiment is the durable resource; Workbench is its interactive surface. */
export const experimentsHref = (locale?: Locale) => prefixPath("/experiments", locale);

export const experimentDetailHref = ({
  experimentId,
  locale,
}: Readonly<{
  experimentId: string;
  locale?: Locale;
}>) => {
  if (!isOpaqueWorkbenchIdV3(experimentId)) {
    throw new Error("Experiment detail href requires a URL-safe opaque identity");
  }
  return prefixPath(`/experiments/${experimentId}`, locale);
};

export const articlesHref = (locale?: Locale) => prefixPath("/articles", locale);

export const articleEditorHref = ({
  articleId,
  locale,
}: Readonly<{
  articleId: string;
  locale?: Locale;
}>) => prefixPath(`/articles/${encodeURIComponent(articleId)}/edit`, locale);

export const newArticleEditorHref = (locale?: Locale) =>
  prefixPath("/articles/new/edit", locale);

export const articleReaderHref = ({
  articleId,
  locale,
}: Readonly<{
  articleId: string;
  locale?: Locale;
}>) => prefixPath(`/articles/${encodeURIComponent(articleId)}`, locale);

export const articlePlacementHref = ({
  articleId,
  locale,
  placementId,
}: Readonly<{
  articleId: string;
  locale?: Locale;
  placementId: string;
}>) => `${articleReaderHref({ articleId, locale })}#${
  encodeURIComponent(`placement-${placementId}`)
}`;

export const experimentSnapshotHref = ({
  experimentId,
  locale,
  snapshotId,
}: Readonly<{
  experimentId: string;
  locale?: Locale;
  snapshotId: string;
}>) => prefixPath(
  `/experiments/${encodeURIComponent(experimentId)}/snapshots/${encodeURIComponent(snapshotId)}`,
  locale,
);

export const homeHref = (locale?: Locale) => prefixPath("/", locale);
