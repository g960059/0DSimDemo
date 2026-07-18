import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_RELEASE_REF_V1,
  type MainWireScientificResearchPresetMetadataV1,
  type MainWireScientificResearchPresetIdV1,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
} from "@/engine/scientific/presets";

export const SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1 =
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID;

export const SCIENTIFIC_PRODUCT_RELEASE_REF_V1 =
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_RELEASE_REF_V1;

export type ScientificProductValveResearchCaseIdV1 = Exclude<
  MainWireScientificResearchPresetIdV1,
  "main-wire/healthy-cold"
>;

export type ScientificProductCaseIdV1 =
  | typeof SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1
  | ScientificProductValveResearchCaseIdV1;

type ScientificProductOfficialCaseV1 = Readonly<{
  caseId: typeof SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1;
  kind: "official-exact-periodic";
  displayName: "Healthy periodic baseline";
  description: string;
  badge: "Official pinned reference";
  claimNotice: string;
  source: Readonly<{
    presetId: typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID;
    presetVersion:
      typeof OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION;
    initialization: "exact-v3-checkpoint";
  }>;
  claims: Readonly<{
    classification: "official-pinned-reference-not-clinical-validation";
    clinicalValidationClaimed: false;
    patientSpecificFitClaimed: false;
  }>;
}>;

type ScientificProductResearchCaseV1 = Readonly<{
  caseId: ScientificProductValveResearchCaseIdV1;
  kind: "research-bracket";
  displayName: string;
  description: string;
  badge: "Research bracket";
  claimNotice: string;
  source: Readonly<{
    presetId: ScientificProductValveResearchCaseIdV1;
    presetVersion: MainWireScientificResearchPresetMetadataV1["presetVersion"];
    catalogEntry: MainWireScientificResearchPresetMetadataV1;
  }>;
  claims: MainWireScientificResearchPresetMetadataV1["claims"];
}>;

export type ScientificProductCaseV1 =
  | ScientificProductOfficialCaseV1
  | ScientificProductResearchCaseV1;

const OFFICIAL_HEALTHY_CASE_V1: ScientificProductOfficialCaseV1 = Object.freeze({
  caseId: SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1,
  kind: "official-exact-periodic",
  displayName: "Healthy periodic baseline",
  description:
    "Pinned healthy reference restored from the release-bound exact V3 periodic checkpoint.",
  badge: "Official pinned reference",
  claimNotice:
    "Official catalog reference; clinical validation and patient-specific fit are not claimed.",
  source: Object.freeze({
    presetId: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_ID,
    presetVersion: OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_VERSION,
    initialization: "exact-v3-checkpoint",
  }),
  claims: Object.freeze({
    classification: "official-pinned-reference-not-clinical-validation",
    clinicalValidationClaimed: false,
    patientSpecificFitClaimed: false,
  }),
});

const RESEARCH_CASES_V1 = Object.freeze(
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries
    .filter(isProductValveResearchEntry)
    .map((entry): ScientificProductResearchCaseV1 => Object.freeze({
      caseId: entry.presetId,
      kind: "research-bracket",
      displayName: entry.displayName,
      description: researchDescription(entry),
      badge: "Research bracket",
      claimNotice:
        "Built-in research bracket only; not a diagnosis, clinical validation, or patient-specific fit.",
      source: Object.freeze({
        presetId: entry.presetId,
        presetVersion: entry.presetVersion,
        catalogEntry: entry,
      }),
      claims: entry.claims,
    })),
);

/**
 * Product discovery catalog only. Executable parameters, checkpoints, and
 * scientific trust decisions remain owned by the release-bound Worker loaders.
 */
export const SCIENTIFIC_PRODUCT_CASE_CATALOG_V1:
readonly ScientificProductCaseV1[] = Object.freeze([
  OFFICIAL_HEALTHY_CASE_V1,
  ...RESEARCH_CASES_V1,
]);

export const SCIENTIFIC_PRODUCT_CASE_IDS_V1 = Object.freeze(
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1.map((entry) => entry.caseId),
);

export const SCIENTIFIC_PRODUCT_CASE_ROUTE_ALIASES_V1 = Object.freeze({
  "normal-sinus": SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1,
  "aortic-stenosis": "main-wire/as-severe",
} satisfies Readonly<Record<string, ScientificProductCaseIdV1>>);

export type ScientificProductCaseRouteAliasV1 =
  keyof typeof SCIENTIFIC_PRODUCT_CASE_ROUTE_ALIASES_V1;

export type ScientificProductCaseRouteResolutionV1 = Readonly<{
  requestedCaseId: string;
  canonicalCaseId: ScientificProductCaseIdV1;
  aliasApplied: ScientificProductCaseRouteAliasV1 | null;
  caseEntry: ScientificProductCaseV1;
}>;

const PRODUCT_CASE_BY_ID_V1 = new Map<
  ScientificProductCaseIdV1,
  ScientificProductCaseV1
>(SCIENTIFIC_PRODUCT_CASE_CATALOG_V1.map((entry) => [entry.caseId, entry]));

export function scientificProductCaseByIdV1(
  caseId: string,
): ScientificProductCaseV1 | null {
  return PRODUCT_CASE_BY_ID_V1.get(caseId as ScientificProductCaseIdV1) ?? null;
}

/** Resolve an exact product case id or one deliberately retained legacy alias. */
export function resolveScientificProductCaseRouteV1(
  routeCaseId: string | null | undefined,
): ScientificProductCaseRouteResolutionV1 | null {
  const requestedCaseId = normalizedRouteCaseId(routeCaseId);
  if (requestedCaseId === null) return null;
  const aliasApplied = Object.prototype.hasOwnProperty.call(
    SCIENTIFIC_PRODUCT_CASE_ROUTE_ALIASES_V1,
    requestedCaseId,
  )
    ? requestedCaseId as ScientificProductCaseRouteAliasV1
    : null;
  const canonicalCaseId = aliasApplied === null
    ? requestedCaseId as ScientificProductCaseIdV1
    : SCIENTIFIC_PRODUCT_CASE_ROUTE_ALIASES_V1[aliasApplied];
  const caseEntry = scientificProductCaseByIdV1(canonicalCaseId);
  if (caseEntry === null) return null;
  return Object.freeze({
    requestedCaseId,
    canonicalCaseId: caseEntry.caseId,
    aliasApplied,
    caseEntry,
  });
}

function normalizedRouteCaseId(
  routeCaseId: string | null | undefined,
): string | null {
  if (typeof routeCaseId !== "string") return null;
  const trimmed = routeCaseId.trim();
  if (trimmed.length === 0) return null;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return null;
  }
}

function researchDescription(
  entry: MainWireScientificResearchPresetMetadataV1,
): string {
  if (entry.physiology.kind === "healthy-cold-research-baseline") {
    return "Healthy cold-start research baseline; periodic steady state is established by the runtime before a steady plot is shown.";
  }
  const valve = titleCase(entry.physiology.valve);
  return valve + " " + entry.physiology.lesion
    + " using the built-in severe research bracket.";
}

function isProductValveResearchEntry(
  entry: MainWireScientificResearchPresetMetadataV1,
): entry is MainWireScientificResearchPresetMetadataV1 & Readonly<{
  presetId: ScientificProductValveResearchCaseIdV1;
}> {
  return entry.presetId !== "main-wire/healthy-cold"
    && entry.physiology.kind === "single-valve-severe-research-bracket";
}

function titleCase(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}
