import {
  canonicalJsonStringify,
  cloneAndFreezeCanonicalJson,
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID =
  "circleheart-main-wire-scientific-research-control-catalog-v0" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_ID =
  "main-wire-release-bound-research-controls" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_VERSION =
  "0.0.0" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CLASSIFICATION_V0 =
  "research-only-experimental-not-clinical" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_DIGEST_SEMANTICS =
  "sha256-canonical-json-payload-without-catalogSha256" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_SHA256_V0 =
  "490adfaa139bfed7d746e61a7f3fda201622801ff3818c0bfae6eadcf08b94f7" as const;

export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_RELEASE_REF_V0:
  SimulationReleaseRef = Object.freeze({
    id: "circleheart/adult-five-wall-noncoronary",
    version: "0.2.0",
    sha256:
      "75a4aac4458de6f03db4fe3d43a919a9d06ec34e5f18e2ae48fbf63475f9e7e4",
  });

export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0 = Object.freeze([
  "circulation.systemic-vascular-resistance-scale",
  "circulation.pulmonary-vascular-resistance-scale",
] as const);

export type MainWireScientificResearchControlIdV0 =
  typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0[number];

export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0 =
  Object.freeze([0.75, 1, 1.3333333333333333] as const);

export type MainWireScientificResearchControlScaleV0 =
  typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0[number];

export type MainWireScientificResearchControlDefinitionV0 = Readonly<{
  controlId: MainWireScientificResearchControlIdV0;
  displayName: string;
  target: Readonly<{
    resolvedSessionInputPath:
      | "resolvedParameters.circulationRuntime.losses.systemicResistance"
      | "resolvedParameters.circulationRuntime.losses.pulmonaryResistance";
    releaseBaselinePath:
      | "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.losses.systemicResistance"
      | "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.losses.pulmonaryResistance";
    releaseBaselineValue: 1 | 0.625;
  }>;
  valueDomain: Readonly<{
    kind: "enumerated-multiplicative-scale";
    baseline: 1;
    allowedValues:
      typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0;
    unit: "scale-from-release-baseline";
  }>;
  applicationSemantics: "replace-with-release-baseline-times-scale";
  stateCompatibility:
    "accepted-state-topology-preserving-circulation-loss-only";
}>;

export type MainWireScientificResearchControlCatalogV0 = Readonly<{
  schemaId:
    typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID;
  schemaVersion: 0;
  catalog: Readonly<{
    id: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_ID;
    version:
      typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_VERSION;
  }>;
  classification:
    typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CLASSIFICATION_V0;
  releaseRef: SimulationReleaseRef;
  controls: readonly [
    MainWireScientificResearchControlDefinitionV0,
    MainWireScientificResearchControlDefinitionV0,
  ];
  provenance: Readonly<{
    releaseBinding: Readonly<{
      releaseRef: SimulationReleaseRef;
      role: "exact-executable-release-bound-control-domain";
    }>;
    sourceLevelEvidence: Readonly<{
      path:
        "data/scientific/validation/circulatory-load-sensitivity-envelope-v1.json";
      envelopeId: "main-wire-circulatory-load-sensitivity-envelope-v1";
      envelopeSha256: string;
      digestSemantics: "sha256-canonical-json";
      role:
        "source-level-structural-response-screen-not-release-bound-validation";
    }>;
    catalogDigestSemantics:
      typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_DIGEST_SEMANTICS;
  }>;
  claims: Readonly<{
    researchOnly: true;
    experimental: true;
    officialTrustClaimed: false;
    clinicalDiagnosisClaimed: false;
    clinicalValidationClaimed: false;
    patientSpecificFitClaimed: false;
    arbitraryParameterPatchAccepted: false;
    completeTargetStateRequired: true;
    parameterSearchPerformed: false;
    parameterFittingPerformed: false;
  }>;
  catalogSha256: string;
}>;

type MainWireScientificResearchControlCatalogPayloadV0 = Omit<
  MainWireScientificResearchControlCatalogV0,
  "catalogSha256"
>;

export class MainWireScientificResearchControlCatalogValidationErrorV0
  extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const immutable = Object.freeze([...issues]);
    super(`main-wire research control catalog rejected: ${immutable.join("; ")}`);
    this.name =
      "MainWireScientificResearchControlCatalogValidationErrorV0";
    this.issues = immutable;
  }
}

/** Builds the sole V0 catalog and binds its identity to its canonical payload. */
export async function createMainWireScientificResearchControlCatalogV0():
  Promise<MainWireScientificResearchControlCatalogV0> {
  const payload = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(
    mainWireScientificResearchControlCatalogPayloadV0(),
  );
  const catalogSha256 = await sha256CanonicalJsonHex(payload);
  if (
    catalogSha256
      !== MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_SHA256_V0
  ) {
    throw new Error(
      "main-wire research control catalog escaped its pinned V0 digest",
    );
  }
  return loadMainWireScientificResearchControlCatalogV0({
    ...payload,
    catalogSha256,
  });
}

/**
 * Loads only the exact V0 catalog. Unknown keys, reordered/replaced controls,
 * substituted provenance, release drift, and rehashed mutations fail closed.
 */
export async function loadMainWireScientificResearchControlCatalogV0(
  value: unknown,
): Promise<MainWireScientificResearchControlCatalogV0> {
  const canonical = cloneCanonicalObject(value);
  const issues = exactObjectIssues(canonical, [
    "schemaId",
    "schemaVersion",
    "catalog",
    "classification",
    "releaseRef",
    "controls",
    "provenance",
    "claims",
    "catalogSha256",
  ], "control catalog");

  if (
    typeof canonical.catalogSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(canonical.catalogSha256)
  ) {
    issues.push("control catalog.catalogSha256 must be a lowercase SHA-256 digest");
  }

  const { catalogSha256: ignoredDigest, ...payload } = canonical;
  if (
    canonicalJsonStringify(payload)
    !== canonicalJsonStringify(
      mainWireScientificResearchControlCatalogPayloadV0(),
    )
  ) {
    issues.push(
      "control catalog payload must exactly match the release 0.2.0 V0 catalog",
    );
  }

  const computedDigest = await sha256CanonicalJsonHex(payload);
  if (canonical.catalogSha256 !== computedDigest) {
    issues.push("control catalog.catalogSha256 does not match its canonical payload");
  }
  if (ignoredDigest === undefined) {
    issues.push("control catalog.catalogSha256 is required");
  }

  if (issues.length > 0) {
    throw new MainWireScientificResearchControlCatalogValidationErrorV0(issues);
  }
  return canonical as unknown as MainWireScientificResearchControlCatalogV0;
}

function mainWireScientificResearchControlCatalogPayloadV0():
  MainWireScientificResearchControlCatalogPayloadV0 {
  return {
    schemaId: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID,
    schemaVersion: 0,
    catalog: {
      id: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_ID,
      version: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_VERSION,
    },
    classification: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CLASSIFICATION_V0,
    releaseRef: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_RELEASE_REF_V0,
    controls: [
      controlDefinition(
        "circulation.systemic-vascular-resistance-scale",
        "Systemic vascular resistance scale",
        "resolvedParameters.circulationRuntime.losses.systemicResistance",
        "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.losses.systemicResistance",
        1,
      ),
      controlDefinition(
        "circulation.pulmonary-vascular-resistance-scale",
        "Pulmonary vascular resistance scale",
        "resolvedParameters.circulationRuntime.losses.pulmonaryResistance",
        "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.losses.pulmonaryResistance",
        0.625,
      ),
    ],
    provenance: {
      releaseBinding: {
        releaseRef: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_RELEASE_REF_V0,
        role: "exact-executable-release-bound-control-domain",
      },
      sourceLevelEvidence: {
        path:
          "data/scientific/validation/circulatory-load-sensitivity-envelope-v1.json",
        envelopeId: "main-wire-circulatory-load-sensitivity-envelope-v1",
        envelopeSha256:
          "4d7283c681d16a173c74f25273e6bd8c87538f50513936e8ed4e889fb4e1862b",
        digestSemantics: "sha256-canonical-json",
        role:
          "source-level-structural-response-screen-not-release-bound-validation",
      },
      catalogDigestSemantics:
        MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_DIGEST_SEMANTICS,
    },
    claims: {
      researchOnly: true,
      experimental: true,
      officialTrustClaimed: false,
      clinicalDiagnosisClaimed: false,
      clinicalValidationClaimed: false,
      patientSpecificFitClaimed: false,
      arbitraryParameterPatchAccepted: false,
      completeTargetStateRequired: true,
      parameterSearchPerformed: false,
      parameterFittingPerformed: false,
    },
  };
}

function controlDefinition(
  controlId: MainWireScientificResearchControlIdV0,
  displayName: string,
  resolvedSessionInputPath:
    MainWireScientificResearchControlDefinitionV0["target"]["resolvedSessionInputPath"],
  releaseBaselinePath:
    MainWireScientificResearchControlDefinitionV0["target"]["releaseBaselinePath"],
  releaseBaselineValue: 1 | 0.625,
): MainWireScientificResearchControlDefinitionV0 {
  return {
    controlId,
    displayName,
    target: {
      resolvedSessionInputPath,
      releaseBaselinePath,
      releaseBaselineValue,
    },
    valueDomain: {
      kind: "enumerated-multiplicative-scale",
      baseline: 1,
      allowedValues:
        MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0,
      unit: "scale-from-release-baseline",
    },
    applicationSemantics: "replace-with-release-baseline-times-scale",
    stateCompatibility:
      "accepted-state-topology-preserving-circulation-loss-only",
  };
}

function cloneCanonicalObject(value: unknown): CanonicalJsonObject {
  let canonical: Readonly<CanonicalJsonObject>;
  try {
    canonical = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw new MainWireScientificResearchControlCatalogValidationErrorV0([
      error instanceof Error ? error.message : String(error),
    ]);
  }
  if (!isRecord(canonical)) {
    throw new MainWireScientificResearchControlCatalogValidationErrorV0([
      "control catalog must be an object",
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
