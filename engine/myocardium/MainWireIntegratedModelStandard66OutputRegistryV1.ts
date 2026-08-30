import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1,
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
  projectMainWireAorticRecoveredRootPortSelectedValuesV1,
  type MainWireAorticRecoveredRootPortNumericalProjectionInputV1,
  type MainWireAorticRecoveredRootPortOutputDefinitionV1,
  type MainWireAorticRecoveredRootPortOutputIdV1,
  type MainWireAorticRecoveredRootPortOutputQuantityKindV1,
  type MainWireAorticRecoveredRootPortOutputUnitV1,
  type MainWireAorticRecoveredRootPortOutputValueV1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortOutputOverlayV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  projectMainWireIntegratedModelSelectedValuesFromNumericalReadbackV1,
  type MainWireIntegratedModelNumericalProjectionInputV1,
  type MainWireIntegratedModelOutputDefinitionV3,
  type MainWireIntegratedModelOutputIdV3,
  type MainWireIntegratedModelOutputQuantityKindV3,
  type MainWireIntegratedModelOutputUnitV3,
  type MainWireIntegratedModelOutputValueV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_V1_ID =
  "main-wire-integrated-model-standard-66-output-registry-v1" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_V1_SCHEMA_VERSION =
  1 as const;
export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_FRAME_V1_ID =
  "main-wire-integrated-model-standard-66-output-frame-v1" as const;

export type MainWireIntegratedModelStandard66OutputUnitV1 =
  | MainWireIntegratedModelOutputUnitV3
  | MainWireAorticRecoveredRootPortOutputUnitV1;

export type MainWireIntegratedModelStandard66OutputQuantityKindV1 =
  | MainWireIntegratedModelOutputQuantityKindV3
  | MainWireAorticRecoveredRootPortOutputQuantityKindV1;

export type MainWireIntegratedModelStandard66OutputDefinitionV1 =
  | MainWireIntegratedModelOutputDefinitionV3<
    MainWireIntegratedModelOutputIdV3
  >
  | MainWireAorticRecoveredRootPortOutputDefinitionV1<
    MainWireAorticRecoveredRootPortOutputIdV1
  >;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_CATALOG_V1 =
  Object.freeze([
    ...MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
    ...MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1,
  ] as const);

export type MainWireIntegratedModelStandard66OutputIdV1 =
  | MainWireIntegratedModelOutputIdV3
  | MainWireAorticRecoveredRootPortOutputIdV1;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1 =
  Object.freeze([
    ...MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
    ...MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
  ]) as readonly MainWireIntegratedModelStandard66OutputIdV1[];

export type MainWireIntegratedModelStandard66OutputValueV1 = Readonly<{
  outputId: MainWireIntegratedModelStandard66OutputIdV1;
  value: number | null;
  availability: "available" | "not-evaluated-at-accepted-state";
  quality: "authoritative-state" | "accepted-derived" | "not-assessed";
}>;

export type MainWireIntegratedModelStandard66OutputFrameV1 = Readonly<{
  frameId: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_FRAME_V1_ID;
  registryId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_V1_ID;
  schemaVersion:
    typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_V1_SCHEMA_VERSION;
  values: Readonly<
    Record<
      MainWireIntegratedModelStandard66OutputIdV1,
      MainWireIntegratedModelStandard66OutputValueV1
    >
  >;
}>;

export type MainWireIntegratedModelStandard66NumericalProjectionInputV1 =
  Readonly<{
    /** Historical exact projector input; its readback remains exactly 73 f64. */
    base: MainWireIntegratedModelNumericalProjectionInputV1;
    /** Selected overlay projector input; its available readback is 76 f64. */
    selectedAorticPort:
      MainWireAorticRecoveredRootPortNumericalProjectionInputV1;
  }>;

export type MainWireIntegratedModelStandard66OutputPartitionV1 = Readonly<{
  baseOutputIds: readonly MainWireIntegratedModelOutputIdV3[];
  selectedAorticPortOutputIds:
    readonly MainWireAorticRecoveredRootPortOutputIdV1[];
}>;

export type MainWireIntegratedModelStandard66CatalogAssertionEntryV1 =
  Readonly<{
    outputId: string;
    dependencies?: readonly string[];
  }>;

export class MainWireIntegratedModelStandard66OutputProjectionErrorV1
  extends Error {
  constructor(message: string) {
    super(`Main Wire Standard66 output projection rejected: ${message}`);
    this.name = "MainWireIntegratedModelStandard66OutputProjectionErrorV1";
  }
}

/**
 * Fail-closed catalog composition: base identities remain a prefix, overlay
 * identities cannot collide, and every declared dependency resolves in the
 * composed exact catalog.
 */
export function assertMainWireIntegratedModelStandard66OutputCatalogV1(
  baseCatalog: readonly MainWireIntegratedModelStandard66CatalogAssertionEntryV1[] =
    MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
  overlayCatalog: readonly MainWireIntegratedModelStandard66CatalogAssertionEntryV1[] =
    MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_CATALOG_V1,
): void {
  const baseIds = uniqueCatalogIdsV1(baseCatalog, "base");
  const overlayIds = uniqueCatalogIdsV1(overlayCatalog, "overlay");
  for (const outputId of overlayIds) {
    if (baseIds.has(outputId)) {
      throw new Error(
        `Main Wire Standard66 output catalog collision: ${outputId}`,
      );
    }
  }
  const composedIds = new Set([...baseIds, ...overlayIds]);
  for (const [catalogName, catalog] of [
    ["base", baseCatalog],
    ["overlay", overlayCatalog],
  ] as const) {
    for (const definition of catalog) {
      for (const dependency of definition.dependencies ?? []) {
        if (!composedIds.has(dependency)) {
          throw new Error(
            `Main Wire Standard66 ${catalogName} output ${definition.outputId} `
              + `has unknown dependency ${dependency}`,
          );
        }
      }
    }
  }
}

assertMainWireIntegratedModelStandard66OutputCatalogV1();

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_SNAPSHOT_V1 =
  Object.freeze({
    registryId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_V1_SCHEMA_VERSION,
    frameId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_FRAME_V1_ID,
    catalog: MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_CATALOG_V1,
    historicalRegistryChanged: false as const,
    historicalCatalogIsExactPrefix: true as const,
    unavailableValuePolicy: "null-never-zero" as const,
    availabilityAndQualityAreSeparate: true as const,
  });

/** Validates globally, then partitions without widening either projector. */
export function partitionMainWireIntegratedModelStandard66OutputIdsV1(
  outputIds: readonly MainWireIntegratedModelStandard66OutputIdV1[],
): MainWireIntegratedModelStandard66OutputPartitionV1 {
  const baseOutputIds: MainWireIntegratedModelOutputIdV3[] = [];
  const selectedAorticPortOutputIds:
    MainWireAorticRecoveredRootPortOutputIdV1[] = [];
  const seen = new Set<string>();
  for (const outputId of outputIds) {
    if (!STANDARD_66_OUTPUT_ID_SET_V1.has(outputId)) {
      throw new MainWireIntegratedModelStandard66OutputProjectionErrorV1(
        `selected output ${String(outputId)} is not registered`,
      );
    }
    if (seen.has(outputId)) {
      throw new MainWireIntegratedModelStandard66OutputProjectionErrorV1(
        `selected output ${outputId} is duplicated`,
      );
    }
    seen.add(outputId);
    if (BASE_OUTPUT_ID_SET_V1.has(outputId)) {
      baseOutputIds.push(outputId as MainWireIntegratedModelOutputIdV3);
    } else {
      selectedAorticPortOutputIds.push(
        outputId as MainWireAorticRecoveredRootPortOutputIdV1,
      );
    }
  }
  return Object.freeze({
    baseOutputIds: Object.freeze(baseOutputIds),
    selectedAorticPortOutputIds: Object.freeze(
      selectedAorticPortOutputIds,
    ),
  });
}

/**
 * Merges already-projected owners in the caller's request order. This is the
 * seam used by a selected Session subclass when the historical owner projects
 * cold/restored accepted-state values without a numerical readback.
 */
export function mergeMainWireIntegratedModelStandard66SelectedValuesV1(
  input: Readonly<{
    outputIds: readonly MainWireIntegratedModelStandard66OutputIdV1[];
    baseValues: Readonly<
      Record<string, MainWireIntegratedModelOutputValueV3>
    >;
    selectedAorticPortValues: Readonly<
      Record<string, MainWireAorticRecoveredRootPortOutputValueV1>
    >;
  }>,
): Readonly<Record<string, MainWireIntegratedModelStandard66OutputValueV1>> {
  const partition = partitionMainWireIntegratedModelStandard66OutputIdsV1(
    input.outputIds,
  );
  assertProjectedKeysV1(
    input.baseValues,
    partition.baseOutputIds,
    "historical",
  );
  assertProjectedKeysV1(
    input.selectedAorticPortValues,
    partition.selectedAorticPortOutputIds,
    "selected aortic-port",
  );
  const values: Record<
    string,
    MainWireIntegratedModelStandard66OutputValueV1
  > = {};
  for (const outputId of input.outputIds) {
    const value = BASE_OUTPUT_ID_SET_V1.has(outputId)
      ? input.baseValues[outputId]
      : input.selectedAorticPortValues[outputId];
    if (value === undefined || value.outputId !== outputId) {
      throw new MainWireIntegratedModelStandard66OutputProjectionErrorV1(
        `selected output ${outputId} is missing from its projection owner`,
      );
    }
    values[outputId] = value;
  }
  return Object.freeze(values);
}

/**
 * Direct hot-path composition. The V3 projector sees only the exact 73-f64
 * owner while the overlay projector independently validates its 76-f64 owner.
 */
export function projectMainWireIntegratedModelStandard66SelectedValuesFromNumericalReadbacksV1(
  input: MainWireIntegratedModelStandard66NumericalProjectionInputV1,
  outputIds: readonly MainWireIntegratedModelStandard66OutputIdV1[],
): Readonly<Record<string, MainWireIntegratedModelStandard66OutputValueV1>> {
  if (input.base.acceptedTimeSec !== input.selectedAorticPort.acceptedTimeSec) {
    throw new MainWireIntegratedModelStandard66OutputProjectionErrorV1(
      "historical and selected aortic-port projection clocks differ",
    );
  }
  const partition = partitionMainWireIntegratedModelStandard66OutputIdsV1(
    outputIds,
  );
  const baseValues =
    projectMainWireIntegratedModelSelectedValuesFromNumericalReadbackV1(
      input.base,
      partition.baseOutputIds,
    );
  const selectedAorticPortValues =
    projectMainWireAorticRecoveredRootPortSelectedValuesV1(
      input.selectedAorticPort,
      partition.selectedAorticPortOutputIds,
    );
  return mergeMainWireIntegratedModelStandard66SelectedValuesV1({
    outputIds,
    baseValues,
    selectedAorticPortValues,
  });
}

export function projectMainWireIntegratedModelStandard66FrameFromNumericalReadbacksV1(
  input: MainWireIntegratedModelStandard66NumericalProjectionInputV1,
): MainWireIntegratedModelStandard66OutputFrameV1 {
  const values =
    projectMainWireIntegratedModelStandard66SelectedValuesFromNumericalReadbacksV1(
      input,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
    ) as Readonly<
      Record<
        MainWireIntegratedModelStandard66OutputIdV1,
        MainWireIntegratedModelStandard66OutputValueV1
      >
    >;
  return Object.freeze({
    frameId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_FRAME_V1_ID,
    registryId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_REGISTRY_V1_SCHEMA_VERSION,
    values,
  });
}

const BASE_OUTPUT_ID_SET_V1 = new Set<string>(
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
);
const STANDARD_66_OUTPUT_ID_SET_V1 = new Set<string>(
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
);

function uniqueCatalogIdsV1(
  catalog: readonly MainWireIntegratedModelStandard66CatalogAssertionEntryV1[],
  catalogName: string,
): Set<string> {
  const ids = new Set<string>();
  for (const definition of catalog) {
    if (ids.has(definition.outputId)) {
      throw new Error(
        `Main Wire Standard66 ${catalogName} output catalog duplicates `
          + definition.outputId,
      );
    }
    ids.add(definition.outputId);
  }
  return ids;
}

function assertProjectedKeysV1(
  values: Readonly<Record<string, Readonly<{ outputId: string }>>>,
  expectedOutputIds: readonly string[],
  owner: string,
): void {
  const actualKeys = Object.keys(values);
  if (actualKeys.length !== expectedOutputIds.length) {
    throw new MainWireIntegratedModelStandard66OutputProjectionErrorV1(
      `${owner} projection returned an unexpected output count`,
    );
  }
  for (const outputId of expectedOutputIds) {
    if (values[outputId]?.outputId !== outputId) {
      throw new MainWireIntegratedModelStandard66OutputProjectionErrorV1(
        `${owner} projection is missing ${outputId}`,
      );
    }
  }
}
