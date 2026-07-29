import { type Locale, prefixPath } from "./localeRouting";
import type {
  StudioLiveLaneKindV1,
} from "./studio/adapters/mainWire/StudioLiveLaneV1";

export const caseHref = (id: string, locale?: Locale) => `${prefixPath(`/workbench/${encodeURIComponent(id)}`, locale)}?from=cases`;

export const workbenchHref = (locale?: Locale) => prefixPath("/workbench", locale);

export const workbenchLaneHref = (
  laneKind: StudioLiveLaneKindV1,
  locale?: Locale,
) =>
  `${workbenchHref(locale)}?lane=${encodeURIComponent(laneKind)}`;

/**
 * The Workbench opened to compose one experiment.
 *
 * The case is in the path because the Workbench runs it; the experiment is in
 * the query because it names which brief the composer edits. Both travel in
 * the URL so a reload composes the same experiment against the same case.
 */
export const composeExperimentHref = (
  experimentId: string,
  caseId: string,
  locale?: Locale,
) =>
  `${prefixPath(`/workbench/${encodeURIComponent(caseId)}`, locale)}`
  + `?experiment=${encodeURIComponent(experimentId)}`;

export const allCasesHref = (locale?: Locale) => prefixPath("/cases", locale);

export const authorPreviewHref = (locale?: Locale) => prefixPath("/studio/author", locale);

export const readerPreviewHref = (previewId: string, locale?: Locale) =>
  prefixPath(`/studio/preview/${encodeURIComponent(previewId)}`, locale);

export const homeHref = (locale?: Locale) => prefixPath("/", locale);
