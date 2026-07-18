import {
  createMainWireScientificResearchControlCatalogV0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_ID,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_VERSION,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CLASSIFICATION_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_RELEASE_REF_V0,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0,
  type MainWireScientificResearchControlCatalogV0,
  type MainWireScientificResearchControlScaleV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlCatalogV0";
import {
  canonicalJsonStringify,
  cloneAndFreezeCanonicalJson,
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_V0_SCHEMA_ID =
  "circleheart-main-wire-scientific-research-control-target-state-v0" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_RESOLVER_V0_ID =
  "main-wire-release-bound-research-control-target-state-resolver-v0" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_V0_DIGEST_SEMANTICS =
  "sha256-canonical-json-payload-without-targetStateSha256" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_TARGET_STATE_SHA256_V0 =
  "496b101c4b2e62466e7f6285d02e7dcd1dc81276969363859c8ecce6405d0337" as const;

export type MainWireScientificResearchControlValuesV0 = Readonly<{
  "circulation.systemic-vascular-resistance-scale":
    MainWireScientificResearchControlScaleV0;
  "circulation.pulmonary-vascular-resistance-scale":
    MainWireScientificResearchControlScaleV0;
}>;

export type MainWireScientificResearchControlTargetStateV0 = Readonly<{
  schemaId:
    typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_V0_SCHEMA_ID;
  schemaVersion: 0;
  releaseRef: SimulationReleaseRef;
  catalogRef: Readonly<{
    schemaId:
      typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID;
    catalogId: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_ID;
    catalogVersion:
      typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_VERSION;
    catalogSha256: string;
  }>;
  classification:
    typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CLASSIFICATION_V0;
  controls: MainWireScientificResearchControlValuesV0;
  provenance: Readonly<{
    resolverId:
      typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_RESOLVER_V0_ID;
    resolverVersion: "0.0.0";
    resolution: "complete-target-state-not-patch";
    digestSemantics:
      typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_V0_DIGEST_SEMANTICS;
  }>;
  claims: Readonly<{
    completeTargetState: true;
    baselineScaleIsOne: true;
    partialPatchAccepted: false;
    arbitraryParameterPatchAccepted: false;
    implicitLastWriteWinsApplied: false;
    researchOnly: true;
    experimental: true;
    clinicalDiagnosisClaimed: false;
    clinicalValidationClaimed: false;
    patientSpecificFitClaimed: false;
  }>;
  targetStateSha256: string;
}>;

type MainWireScientificResearchControlTargetStatePayloadV0 = Omit<
  MainWireScientificResearchControlTargetStateV0,
  "targetStateSha256"
>;

export class MainWireScientificResearchControlTargetStateValidationErrorV0
  extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutable = Object.freeze([...issues]);
    super(
      `main-wire research control target state rejected: ${immutable.join("; ")}`,
    );
    this.name =
      "MainWireScientificResearchControlTargetStateValidationErrorV0";
    this.issues = immutable;
  }
}

/** Creates a complete, release- and catalog-bound target state. */
export async function createMainWireScientificResearchControlTargetStateV0(
  controls: unknown,
): Promise<MainWireScientificResearchControlTargetStateV0> {
  const validatedControls = loadCompleteControlValuesV0(controls);
  const catalog = await createMainWireScientificResearchControlCatalogV0();
  const payload = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(
    mainWireScientificResearchControlTargetStatePayloadV0(
      validatedControls,
      catalog,
    ),
  );
  const targetStateSha256 = await sha256CanonicalJsonHex(payload);
  return loadMainWireScientificResearchControlTargetStateV0({
    ...payload,
    targetStateSha256,
  });
}

/** The neutral V0 target is explicit: both release-relative scales are one. */
export async function createMainWireScientificResearchControlBaselineTargetStateV0():
  Promise<MainWireScientificResearchControlTargetStateV0> {
  const baseline = await createMainWireScientificResearchControlTargetStateV0({
    "circulation.systemic-vascular-resistance-scale": 1,
    "circulation.pulmonary-vascular-resistance-scale": 1,
  });
  if (
    baseline.targetStateSha256
      !== MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_TARGET_STATE_SHA256_V0
  ) {
    throw new Error(
      "main-wire research control baseline escaped its pinned V0 digest",
    );
  }
  return baseline;
}

/**
 * Loads an exact complete target state. This API deliberately has no patch or
 * composition mode: missing controls and every additional key fail closed.
 */
export async function loadMainWireScientificResearchControlTargetStateV0(
  value: unknown,
): Promise<MainWireScientificResearchControlTargetStateV0> {
  const canonical = cloneCanonicalObject(value, "control target state");
  const issues = exactObjectIssues(canonical, [
    "schemaId",
    "schemaVersion",
    "releaseRef",
    "catalogRef",
    "classification",
    "controls",
    "provenance",
    "claims",
    "targetStateSha256",
  ], "control target state");

  let controls: MainWireScientificResearchControlValuesV0 | null = null;
  try {
    controls = loadCompleteControlValuesV0(canonical.controls);
  } catch (error) {
    if (
      error
      instanceof MainWireScientificResearchControlTargetStateValidationErrorV0
    ) {
      issues.push(...error.issues);
    } else {
      issues.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (
    typeof canonical.targetStateSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(canonical.targetStateSha256)
  ) {
    issues.push(
      "control target state.targetStateSha256 must be a lowercase SHA-256 digest",
    );
  }

  const catalog = await createMainWireScientificResearchControlCatalogV0();
  const { targetStateSha256: ignoredDigest, ...payload } = canonical;
  if (controls !== null) {
    const expectedPayload =
      mainWireScientificResearchControlTargetStatePayloadV0(controls, catalog);
    if (
      canonicalJsonStringify(payload)
      !== canonicalJsonStringify(expectedPayload)
    ) {
      issues.push(
        "control target state payload must exactly match its release-bound catalog",
      );
    }
  }

  const computedDigest = await sha256CanonicalJsonHex(payload);
  if (canonical.targetStateSha256 !== computedDigest) {
    issues.push(
      "control target state.targetStateSha256 does not match its canonical payload",
    );
  }
  if (ignoredDigest === undefined) {
    issues.push("control target state.targetStateSha256 is required");
  }

  if (issues.length > 0) {
    throw new MainWireScientificResearchControlTargetStateValidationErrorV0(
      issues,
    );
  }
  return canonical as unknown as
    MainWireScientificResearchControlTargetStateV0;
}

function mainWireScientificResearchControlTargetStatePayloadV0(
  controls: MainWireScientificResearchControlValuesV0,
  catalog: MainWireScientificResearchControlCatalogV0,
): MainWireScientificResearchControlTargetStatePayloadV0 {
  return {
    schemaId:
      MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_V0_SCHEMA_ID,
    schemaVersion: 0,
    releaseRef: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_RELEASE_REF_V0,
    catalogRef: {
      schemaId: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID,
      catalogId: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_ID,
      catalogVersion:
        MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_VERSION,
      catalogSha256: catalog.catalogSha256,
    },
    classification: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CLASSIFICATION_V0,
    controls,
    provenance: {
      resolverId:
        MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_RESOLVER_V0_ID,
      resolverVersion: "0.0.0",
      resolution: "complete-target-state-not-patch",
      digestSemantics:
        MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_TARGET_STATE_V0_DIGEST_SEMANTICS,
    },
    claims: {
      completeTargetState: true,
      baselineScaleIsOne: true,
      partialPatchAccepted: false,
      arbitraryParameterPatchAccepted: false,
      implicitLastWriteWinsApplied: false,
      researchOnly: true,
      experimental: true,
      clinicalDiagnosisClaimed: false,
      clinicalValidationClaimed: false,
      patientSpecificFitClaimed: false,
    },
  };
}

function loadCompleteControlValuesV0(
  value: unknown,
): MainWireScientificResearchControlValuesV0 {
  const canonical = cloneCanonicalObject(value, "control target values");
  const issues = exactObjectIssues(
    canonical,
    MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0,
    "control target values",
  );
  for (const controlId of MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0) {
    if (!isAllowedScale(canonical[controlId])) {
      issues.push(
        `${controlId} must be one of ${
          MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0.join(", ")
        }`,
      );
    }
  }
  if (issues.length > 0) {
    throw new MainWireScientificResearchControlTargetStateValidationErrorV0(
      issues,
    );
  }
  return canonical as unknown as MainWireScientificResearchControlValuesV0;
}

function isAllowedScale(
  value: unknown,
): value is MainWireScientificResearchControlScaleV0 {
  return typeof value === "number"
    && (MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0 as
      readonly number[]).includes(value);
}

function cloneCanonicalObject(
  value: unknown,
  path: string,
): CanonicalJsonObject {
  let canonical: Readonly<CanonicalJsonObject>;
  try {
    canonical = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new MainWireScientificResearchControlTargetStateValidationErrorV0([
      `${path}: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }
  if (!isRecord(canonical)) {
    throw new MainWireScientificResearchControlTargetStateValidationErrorV0([
      `${path} must be an object`,
    ]);
  }
  return canonical;
}

function exactObjectIssues(
  value: unknown,
  expectedKeys: readonly string[],
  path: string,
): string[] {
  if (!isRecord(value)) return [`${path} must be an object`];
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return canonicalJsonStringify(actual) === canonicalJsonStringify(expected)
    ? []
    : [`${path} must contain exactly keys ${expected.join(", ")}`];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
