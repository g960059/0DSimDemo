import type {
  ScientificWorkbenchResearchControlDraftV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import type {
  ScientificProductScenarioPresentationV1,
} from "@/components/scientificProduct/ScientificProductScenarioRegistryV1";
import {
  scientificProductCaseByIdV1,
  type ScientificProductCaseIdV1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import { SHA256_HEX_PATTERN } from "@/engine/scientific/release/sha256";

export const SCIENTIFIC_PRODUCT_SAVED_SCENARIO_STORAGE_KEY_V1 =
  "circleheart:scientific-product:saved-scenarios:v1" as const;

export const SCIENTIFIC_PRODUCT_SAVED_SCENARIO_CATALOG_V1_ID =
  "scientific-product-saved-scenario-catalog-v1" as const;

const MAXIMUM_SAVED_SCENARIO_COUNT_V1 = 64;
const MAXIMUM_SAVED_SCENARIO_NAME_LENGTH_V1 = 120;

export type ScientificProductSavedScenarioV1 = Readonly<{
  schemaVersion: 1;
  id: string;
  name: string;
  color: string;
  sourceCaseId: ScientificProductCaseIdV1;
  releaseRef: Readonly<{
    id: string;
    version: string;
    sha256: string;
  }>;
  workspaceSha256: string;
  controlStateSha256: string;
  controls: ScientificWorkbenchResearchControlDraftV0;
  savedAtIso: string;
}>;

export type ScientificProductSavedScenarioCatalogV1 = Readonly<{
  catalogId: typeof SCIENTIFIC_PRODUCT_SAVED_SCENARIO_CATALOG_V1_ID;
  schemaVersion: 1;
  scenarios: readonly ScientificProductSavedScenarioV1[];
}>;

export type ScientificProductSavedScenarioStorageV1 = Readonly<{
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}>;

export type SaveScientificProductScenarioInputV1 = Readonly<{
  id: string;
  name: string;
  color: string;
  presentation: ScientificProductScenarioPresentationV1;
  controlStateSha256: string;
  controls: ScientificWorkbenchResearchControlDraftV0;
  savedAt: Date;
}>;

const EMPTY_SAVED_SCENARIO_CATALOG_V1: ScientificProductSavedScenarioCatalogV1 =
  Object.freeze({
    catalogId: SCIENTIFIC_PRODUCT_SAVED_SCENARIO_CATALOG_V1_ID,
    schemaVersion: 1 as const,
    scenarios: Object.freeze([]),
  });

export function readScientificProductSavedScenarioCatalogV1(
  storage: ScientificProductSavedScenarioStorageV1 | null = browserStorageV1(),
): ScientificProductSavedScenarioCatalogV1 {
  if (storage === null) return EMPTY_SAVED_SCENARIO_CATALOG_V1;
  let raw: string | null;
  try {
    raw = storage.getItem(SCIENTIFIC_PRODUCT_SAVED_SCENARIO_STORAGE_KEY_V1);
  } catch {
    return EMPTY_SAVED_SCENARIO_CATALOG_V1;
  }
  if (raw === null) return EMPTY_SAVED_SCENARIO_CATALOG_V1;
  try {
    return parseSavedScenarioCatalogV1(JSON.parse(raw));
  } catch {
    return EMPTY_SAVED_SCENARIO_CATALOG_V1;
  }
}

export function writeScientificProductSavedScenarioCatalogV1(
  catalog: ScientificProductSavedScenarioCatalogV1,
  storage: ScientificProductSavedScenarioStorageV1 | null = browserStorageV1(),
): boolean {
  if (storage === null) return false;
  try {
    storage.setItem(
      SCIENTIFIC_PRODUCT_SAVED_SCENARIO_STORAGE_KEY_V1,
      JSON.stringify(parseSavedScenarioCatalogV1(catalog)),
    );
    return true;
  } catch {
    return false;
  }
}

export function saveScientificProductScenarioV1(
  catalog: ScientificProductSavedScenarioCatalogV1,
  input: SaveScientificProductScenarioInputV1,
): ScientificProductSavedScenarioCatalogV1 {
  const descriptor = input.presentation.descriptor;
  const scenario = freezeSavedScenarioV1({
    schemaVersion: 1,
    id: requiredPortableTextV1(input.id, "saved scenario id", 160),
    name: requiredPortableTextV1(
      input.name,
      "saved scenario name",
      MAXIMUM_SAVED_SCENARIO_NAME_LENGTH_V1,
    ),
    color: requiredPortableTextV1(input.color, "saved scenario color", 48),
    sourceCaseId: descriptor.source.caseId,
    releaseRef: Object.freeze({
      id: descriptor.source.releaseId,
      version: descriptor.source.releaseVersion,
      sha256: requiredSha256V1(
        descriptor.source.releaseSha256,
        "saved scenario release SHA-256",
      ),
    }),
    workspaceSha256: requiredSha256V1(
      input.presentation.workspaceDocument.ref.sha256,
      "saved scenario Workspace SHA-256",
    ),
    controlStateSha256: requiredSha256V1(
      input.controlStateSha256,
      "saved scenario control-state SHA-256",
    ),
    controls: freezeDraftV1(input.controls),
    savedAtIso: input.savedAt.toISOString(),
  });
  const retained = catalog.scenarios.filter(({ id }) => id !== scenario.id);
  return freezeCatalogV1([scenario, ...retained].slice(
    0,
    MAXIMUM_SAVED_SCENARIO_COUNT_V1,
  ));
}

export function removeScientificProductSavedScenarioV1(
  catalog: ScientificProductSavedScenarioCatalogV1,
  scenarioId: string,
): ScientificProductSavedScenarioCatalogV1 {
  return freezeCatalogV1(
    catalog.scenarios.filter(({ id }) => id !== scenarioId),
  );
}

function parseSavedScenarioCatalogV1(
  value: unknown,
): ScientificProductSavedScenarioCatalogV1 {
  if (!isRecordV1(value)) throw new Error("saved scenario catalog is not an object");
  if (
    value.catalogId !== SCIENTIFIC_PRODUCT_SAVED_SCENARIO_CATALOG_V1_ID
    || value.schemaVersion !== 1
    || !Array.isArray(value.scenarios)
    || value.scenarios.length > MAXIMUM_SAVED_SCENARIO_COUNT_V1
  ) throw new Error("saved scenario catalog identity is unsupported");
  const scenarios = value.scenarios.map(parseSavedScenarioV1);
  if (new Set(scenarios.map(({ id }) => id)).size !== scenarios.length) {
    throw new Error("saved scenario ids must be unique");
  }
  return freezeCatalogV1(scenarios);
}

function parseSavedScenarioV1(value: unknown): ScientificProductSavedScenarioV1 {
  if (!isRecordV1(value) || value.schemaVersion !== 1) {
    throw new Error("saved scenario entry is unsupported");
  }
  const releaseRef = requiredRecordV1(value.releaseRef, "saved release ref");
  const controls = requiredRecordV1(value.controls, "saved controls");
  const savedAtIso = requiredPortableTextV1(
    value.savedAtIso,
    "saved timestamp",
    64,
  );
  const savedAtMs = Date.parse(savedAtIso);
  if (
    !Number.isFinite(savedAtMs)
    || new Date(savedAtMs).toISOString() !== savedAtIso
  ) {
    throw new Error("saved scenario timestamp is invalid");
  }
  return freezeSavedScenarioV1({
    schemaVersion: 1,
    id: requiredPortableTextV1(value.id, "saved scenario id", 160),
    name: requiredPortableTextV1(
      value.name,
      "saved scenario name",
      MAXIMUM_SAVED_SCENARIO_NAME_LENGTH_V1,
    ),
    color: requiredPortableTextV1(value.color, "saved scenario color", 48),
    sourceCaseId: requiredSourceCaseIdV1(
      value.sourceCaseId,
    ),
    releaseRef: Object.freeze({
      id: requiredPortableTextV1(releaseRef.id, "saved release id", 180),
      version: requiredPortableTextV1(
        releaseRef.version,
        "saved release version",
        80,
      ),
      sha256: requiredSha256V1(
        releaseRef.sha256,
        "saved release SHA-256",
      ),
    }),
    workspaceSha256: requiredSha256V1(
      value.workspaceSha256,
      "saved Workspace SHA-256",
    ),
    controlStateSha256: requiredSha256V1(
      value.controlStateSha256,
      "saved control-state SHA-256",
    ),
    controls: freezeDraftV1({
      systemic: requiredFiniteV1(controls.systemic, "systemic scale"),
      pulmonary: requiredFiniteV1(controls.pulmonary, "pulmonary scale"),
      venousTone: requiredFiniteV1(controls.venousTone, "venous tone"),
      arterialStiffness: requiredFiniteV1(
        controls.arterialStiffness,
        "arterial stiffness",
      ),
      peepCmH2O: requiredFiniteV1(controls.peepCmH2O, "PEEP"),
      pericardialFluidVolumeMl: requiredFiniteV1(
        controls.pericardialFluidVolumeMl,
        "pericardial fluid volume",
      ),
    } as ScientificWorkbenchResearchControlDraftV0),
    savedAtIso,
  });
}

function freezeCatalogV1(
  scenarios: readonly ScientificProductSavedScenarioV1[],
): ScientificProductSavedScenarioCatalogV1 {
  return Object.freeze({
    catalogId: SCIENTIFIC_PRODUCT_SAVED_SCENARIO_CATALOG_V1_ID,
    schemaVersion: 1 as const,
    scenarios: Object.freeze([...scenarios]),
  });
}

function freezeSavedScenarioV1(
  scenario: ScientificProductSavedScenarioV1,
): ScientificProductSavedScenarioV1 {
  return Object.freeze({
    ...scenario,
    releaseRef: Object.freeze({ ...scenario.releaseRef }),
    controls: freezeDraftV1(scenario.controls),
  });
}

function freezeDraftV1(
  draft: ScientificWorkbenchResearchControlDraftV0,
): ScientificWorkbenchResearchControlDraftV0 {
  return Object.freeze({
    systemic: requiredAllowedControlValueV1(
      draft.systemic,
      "systemic scale",
      "circulation.systemic-vascular-resistance-scale",
    ),
    pulmonary: requiredAllowedControlValueV1(
      draft.pulmonary,
      "pulmonary scale",
      "circulation.pulmonary-vascular-resistance-scale",
    ),
    venousTone: requiredAllowedControlValueV1(
      draft.venousTone,
      "venous tone",
      "circulation.venous-tone",
    ),
    arterialStiffness: requiredAllowedControlValueV1(
      draft.arterialStiffness,
      "arterial stiffness",
      "circulation.arterial-stiffness",
    ),
    peepCmH2O: requiredAllowedControlValueV1(
      draft.peepCmH2O,
      "PEEP",
      "ventilation.peep-cm-h2o",
    ),
    pericardialFluidVolumeMl: requiredAllowedControlValueV1(
      draft.pericardialFluidVolumeMl,
      "pericardial fluid volume",
      "pericardium.prescribed-fluid-volume-ml",
    ),
  });
}

function browserStorageV1(): ScientificProductSavedScenarioStorageV1 | null {
  try {
    return typeof globalThis.localStorage === "undefined"
      ? null
      : globalThis.localStorage;
  } catch {
    return null;
  }
}

function requiredRecordV1(value: unknown, label: string): Record<string, unknown> {
  if (!isRecordV1(value)) throw new Error(`${label} must be an object`);
  return value;
}

function isRecordV1(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredPortableTextV1(
  value: unknown,
  label: string,
  maximumLength: number,
): string {
  if (typeof value !== "string") throw new Error(`${label} must be text`);
  const normalized = value.trim();
  if (
    normalized.length === 0
    || normalized.length > maximumLength
    || /[\u0000-\u001f\u007f]/.test(normalized)
  ) throw new Error(`${label} is invalid`);
  return normalized;
}

function requiredSha256V1(value: unknown, label: string): string {
  const normalized = requiredPortableTextV1(value, label, 64);
  if (!SHA256_HEX_PATTERN.test(normalized)) {
    throw new Error(`${label} must be lowercase hexadecimal`);
  }
  return normalized;
}

function requiredFiniteV1(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function requiredSourceCaseIdV1(value: unknown): ScientificProductCaseIdV1 {
  const caseId = requiredPortableTextV1(value, "saved source Case id", 180);
  const caseEntry = scientificProductCaseByIdV1(caseId);
  if (caseEntry === null) {
    throw new Error("saved source Case id is not in the product catalog");
  }
  return caseEntry.caseId;
}

function requiredAllowedControlValueV1(
  value: unknown,
  label: string,
  controlId: keyof typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0,
): number {
  const finite = requiredFiniteV1(value, label);
  const domain = MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
    controlId
  ];
  if (!domain.allowedValues.some((allowed) => Object.is(allowed, finite))) {
    throw new Error(`${label} is outside the release-bound control domain`);
  }
  return finite;
}
