import {
  INTEGRATED_V3_LANE_BADGE_V1,
  INTEGRATED_V3_LANE_DISPLAY_NAME_V1,
  INTEGRATED_V3_LANE_ID_V1,
  INTEGRATED_V3_LANE_LIMITATIONS_V1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";

import {
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
  type ScientificProductCaseV1,
} from "./scientificProductCaseCatalogV1";

export const SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_ID_V1 =
  INTEGRATED_V3_LANE_ID_V1;

export type ScientificProductIntegratedV3CaseV1 = Readonly<{
  caseId: typeof SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_ID_V1;
  kind: "integrated-v3-experimental";
  displayName: typeof INTEGRATED_V3_LANE_DISPLAY_NAME_V1;
  description: string;
  badge: typeof INTEGRATED_V3_LANE_BADGE_V1;
  claimNotice: typeof INTEGRATED_V3_LANE_LIMITATIONS_V1[0];
}>;

export const SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1 =
  Object.freeze({
    caseId: SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_ID_V1,
    kind: "integrated-v3-experimental" as const,
    displayName: INTEGRATED_V3_LANE_DISPLAY_NAME_V1,
    description:
      "Fixed regular-sinus, normal-coronary and HeartMate II 9000 browser-Worker exploration.",
    badge: INTEGRATED_V3_LANE_BADGE_V1,
    claimNotice: INTEGRATED_V3_LANE_LIMITATIONS_V1[0],
  }) satisfies ScientificProductIntegratedV3CaseV1;

export type ScientificProductDiscoveryCaseV1 =
  | ScientificProductCaseV1
  | ScientificProductIntegratedV3CaseV1;

/**
 * Product discovery includes the experimental lane without merging it into
 * the release-bound non-coronary catalog consumed by that lane's loaders.
 */
export const SCIENTIFIC_PRODUCT_DISCOVERY_CASE_CATALOG_V1:
readonly ScientificProductDiscoveryCaseV1[] = Object.freeze([
  ...SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
  SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1,
]);

export function resolveScientificProductIntegratedV3CaseRouteV1(
  routeCaseId: string | null | undefined,
): ScientificProductIntegratedV3CaseV1 | null {
  if (typeof routeCaseId !== "string") return null;
  const trimmed = routeCaseId.trim();
  if (trimmed.length === 0) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return null;
  }
  return decoded === SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_ID_V1
    ? SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1
    : null;
}
