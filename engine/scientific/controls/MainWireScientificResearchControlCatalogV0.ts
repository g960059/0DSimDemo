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
  "0.1.0" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CLASSIFICATION_V0 =
  "research-only-experimental-not-clinical" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_DIGEST_SEMANTICS =
  "sha256-canonical-json-payload-without-catalogSha256" as const;
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_SHA256_V0 =
  "b03a5e90275f3d858d21a0779d6dbd01487ef471c4428e8aaa57d792df18e7a0" as const;

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
  "circulation.venous-tone",
  "circulation.arterial-stiffness",
  "ventilation.peep-cm-h2o",
  "pericardium.prescribed-fluid-volume-ml",
] as const);

export type MainWireScientificResearchControlIdV0 =
  typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0[number];

/** Broad research anchors; these are model multipliers, not Wood units. */
export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0 =
  Object.freeze([0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4] as const);
export type MainWireScientificResearchControlScaleV0 = number;

export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0 =
  Object.freeze({
    "circulation.systemic-vascular-resistance-scale": Object.freeze({
      baseline: 1,
      allowedValues: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0,
      unit: "scale-from-release-baseline",
      uiScale: "log-like-exact-stops",
    }),
    "circulation.pulmonary-vascular-resistance-scale": Object.freeze({
      baseline: 1,
      allowedValues: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_SCALE_VALUES_V0,
      unit: "scale-from-release-baseline",
      uiScale: "log-like-exact-stops",
    }),
    "circulation.venous-tone": Object.freeze({
      baseline: 0.15,
      allowedValues: Object.freeze([0, 0.05, 0.15, 0.3, 0.5, 0.75, 1]),
      unit: "model-fraction",
      uiScale: "linear-exact-stops",
    }),
    "circulation.arterial-stiffness": Object.freeze({
      baseline: 0.75,
      allowedValues: Object.freeze([0.4, 0.55, 0.75, 1, 1.5, 2, 3]),
      unit: "model-scale",
      uiScale: "log-like-exact-stops",
    }),
    "ventilation.peep-cm-h2o": Object.freeze({
      baseline: 0,
      allowedValues: Object.freeze([0, 5, 8, 10, 12, 15, 20, 25]),
      unit: "cmH2O",
      uiScale: "practice-informed-exact-stops",
    }),
    "pericardium.prescribed-fluid-volume-ml": Object.freeze({
      baseline: 0,
      allowedValues: Object.freeze([0, 25, 50, 75, 100, 150]),
      unit: "mL",
      uiScale: "healthy-capacity-static-occupancy-exact-stops",
    }),
  } as const satisfies Readonly<Record<
    MainWireScientificResearchControlIdV0,
    Readonly<{
      baseline: number;
      allowedValues: readonly number[];
      unit: string;
      uiScale: string;
    }>
  >>);

export const MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0 =
  Object.freeze(Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_IDS_V0.map((controlId) => [
      controlId,
      MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[controlId]
        .baseline,
    ]),
  )) as Readonly<Record<MainWireScientificResearchControlIdV0, number>>;

export type MainWireScientificResearchControlDefinitionV0 = Readonly<{
  controlId: MainWireScientificResearchControlIdV0;
  displayName: string;
  group: "circulation-load" | "ventilation-restraint";
  target: Readonly<{
    resolvedSessionInputPath: string;
    releaseBaselinePath: string;
    releaseBaselineValue: number;
    runtimeUnit: string;
  }>;
  valueDomain: Readonly<{
    kind: "enumerated-broad-research-envelope";
    baseline: number;
    allowedValues: readonly number[];
    unit: string;
    uiScale: string;
  }>;
  applicationSemantics:
    | "replace-with-release-baseline-times-scale"
    | "replace-absolute-runtime-value"
    | "convert-cmH2O-to-mmHg-then-replace"
    | "convert-mL-to-m3-then-replace-static-occupancy";
  stateCompatibility:
    "accepted-state-topology-preserving-runtime-parameter-overlay";
  interpretation: string;
}>;

export type MainWireScientificResearchControlCatalogV0 = Readonly<{
  schemaId:
    typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_SCHEMA_ID;
  schemaVersion: 0;
  catalog: Readonly<{
    id: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_ID;
    version: typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_V0_VERSION;
  }>;
  classification:
    typeof MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CLASSIFICATION_V0;
  releaseRef: SimulationReleaseRef;
  controls: readonly MainWireScientificResearchControlDefinitionV0[];
  provenance: Readonly<{
    releaseBinding: Readonly<{
      releaseRef: SimulationReleaseRef;
      role: "exact-executable-release-bound-control-domain";
    }>;
    evidenceSources: readonly Readonly<{
      path: string;
      role: string;
    }>[];
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
    broadMechanisticPhysiologyExplorationIntended: true;
    numericalConvergenceOutsideValidatedBaselineNotGuaranteed: true;
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
    this.name = "MainWireScientificResearchControlCatalogValidationErrorV0";
    this.issues = immutable;
  }
}

export async function createMainWireScientificResearchControlCatalogV0():
  Promise<MainWireScientificResearchControlCatalogV0> {
  const payload = cloneAndFreezeCanonicalJson<CanonicalJsonObject>(
    mainWireScientificResearchControlCatalogPayloadV0(),
  );
  const catalogSha256 = await sha256CanonicalJsonHex(payload);
  if (catalogSha256 !== MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_CATALOG_SHA256_V0) {
    throw new Error(
      `main-wire research control catalog escaped its pinned V0 digest: ${catalogSha256}`,
    );
  }
  return loadMainWireScientificResearchControlCatalogV0({
    ...payload,
    catalogSha256,
  });
}

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
      !== canonicalJsonStringify(mainWireScientificResearchControlCatalogPayloadV0())
  ) {
    issues.push("control catalog payload must exactly match the release 0.2.0 V0 catalog");
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
      definition(
        "circulation.systemic-vascular-resistance-scale",
        "Systemic resistance scale",
        "circulation-load",
        "resolvedParameters.circulationRuntime.losses.systemicResistance",
        "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.losses.systemicResistance",
        1,
        "dimensionless-group-resistance-multiplier",
        "replace-with-release-baseline-times-scale",
        "Dimensionless multiplier of the release systemic resistance; not a directly measured SVR unit.",
      ),
      definition(
        "circulation.pulmonary-vascular-resistance-scale",
        "Pulmonary resistance scale",
        "circulation-load",
        "resolvedParameters.circulationRuntime.losses.pulmonaryResistance",
        "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.losses.pulmonaryResistance",
        0.625,
        "dimensionless-group-resistance-multiplier",
        "replace-with-release-baseline-times-scale",
        "Dimensionless multiplier of the release pulmonary resistance; not Wood units and not a pulmonary-hypertension diagnosis.",
      ),
      definition(
        "circulation.venous-tone",
        "Venous tone",
        "circulation-load",
        "resolvedParameters.circulationRuntime.vascular.venousTone",
        "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.vascular.venousTone",
        0.15,
        "model-fraction",
        "replace-absolute-runtime-value",
        "Dimensionless vascular-PV model parameter controlling venous unstressed-volume/compliance behavior.",
      ),
      definition(
        "circulation.arterial-stiffness",
        "Arterial PV stiffness",
        "circulation-load",
        "resolvedParameters.circulationRuntime.vascular.arterialStiffness",
        "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.vascular.arterialStiffness",
        0.75,
        "model-scale",
        "replace-absolute-runtime-value",
        "Dimensionless vascular-PV stiffness parameter; not pulse-wave velocity.",
      ),
      definition(
        "ventilation.peep-cm-h2o",
        "PEEP boundary",
        "ventilation-restraint",
        "resolvedParameters.circulationRuntime.respiratory.PEEP",
        "manifest.numericalRuntime.snapshot.fixedHealthyRuntime.respiratory.PEEP",
        0,
        "mmHg",
        "convert-cmH2O-to-mmHg-then-replace",
        "Airway PEEP input converted to the runtime pressure unit; ventilation is otherwise held at the release baseline.",
      ),
      definition(
        "pericardium.prescribed-fluid-volume-ml",
        "Pericardial occupancy",
        "ventilation-restraint",
        "resolvedParameters.commonPericardium.resolvedBinding.prescribedPericardialFluidVolumeM3",
        "manifest.scientificModel.snapshot.commonPericardium.resolvedBinding.prescribedPericardialFluidVolumeM3",
        0,
        "m3",
        "convert-mL-to-m3-then-replace-static-occupancy",
        "Static common-pericardium occupancy mechanism; volume alone is not a tamponade diagnosis and accumulation rate is not modeled.",
      ),
    ],
    provenance: {
      releaseBinding: {
        releaseRef: MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_RELEASE_REF_V0,
        role: "exact-executable-release-bound-control-domain",
      },
      evidenceSources: [
        {
          path: "data/scientific/validation/circulatory-load-sensitivity-envelope-v1.json",
          role: "source-level-load-response-screen-not-clinical-validation",
        },
        {
          path: "engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1.ts",
          role: "mechanistic-common-pericardium-positive-control-source",
        },
        {
          path: "engine/core/circulationGraphKernelV1.ts",
          role: "authoritative-runtime-pressure-conversion-semantics",
        },
        {
          path: "https://www.thoracic.org/statements/resources/cc/ards-guidelines.pdf",
          role: "clinical-practice-context-for-peep-anchors-not-model-validation",
        },
        {
          path: "https://pubmed.ncbi.nlm.nih.gov/29025543/",
          role: "pericardial-pressure-volume-context-not-patient-specific-validation",
        },
      ],
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
      broadMechanisticPhysiologyExplorationIntended: true,
      numericalConvergenceOutsideValidatedBaselineNotGuaranteed: true,
      parameterSearchPerformed: false,
      parameterFittingPerformed: false,
    },
  };
}

function definition(
  controlId: MainWireScientificResearchControlIdV0,
  displayName: string,
  group: MainWireScientificResearchControlDefinitionV0["group"],
  resolvedSessionInputPath: string,
  releaseBaselinePath: string,
  releaseBaselineValue: number,
  runtimeUnit: string,
  applicationSemantics:
    MainWireScientificResearchControlDefinitionV0["applicationSemantics"],
  interpretation: string,
): MainWireScientificResearchControlDefinitionV0 {
  const domain = MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_VALUE_DOMAINS_V0[
    controlId
  ];
  if (domain.baseline !== MAIN_WIRE_SCIENTIFIC_RESEARCH_CONTROL_BASELINE_VALUES_V0[controlId]) {
    throw new Error(`control ${controlId} baseline metadata diverged`);
  }
  return {
    controlId,
    displayName,
    group,
    target: {
      resolvedSessionInputPath,
      releaseBaselinePath,
      releaseBaselineValue,
      runtimeUnit,
    },
    valueDomain: {
      kind: "enumerated-broad-research-envelope",
      ...domain,
    },
    applicationSemantics,
    stateCompatibility:
      "accepted-state-topology-preserving-runtime-parameter-overlay",
    interpretation,
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
