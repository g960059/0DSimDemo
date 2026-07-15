import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID,
  IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
  LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
  LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
  buildPhaseA0ContractManifestV1,
  canonicalizeJson,
  contractManifestHashPayload,
  createPhaseA0ContractManifestPayloadV1,
  finalizeTissueManifestV1,
  tissueManifestHashPayload,
  validateAtrialTissueManifestDiffV1,
  validateFourChamberContractManifestV1,
  validateTissueManifestV1,
  type ManifestParameterV1,
  type TissueManifestV1,
} from "@/engine/myocardium/fourChamberV1";

describe("four-chamber TriSeg/Land Phase A0 manifest contracts", () => {
  it("canonicalizes dense plain JSON independently of object-key insertion order", () => {
    const left = { z: [3, { b: 2, a: 1 }], a: -0, text: "uM" };
    const right = { text: "uM", a: 0, z: [3, { a: 1, b: 2 }] };
    expect(canonicalizeJson(left)).toBe(canonicalizeJson(right));
    expect(sha256(canonicalizeJson(left))).toBe(sha256(canonicalizeJson(right)));
    expect(() => canonicalizeJson({ invalid: Number.NaN })).toThrow(/non-finite/);
    expect(() => canonicalizeJson({ invalid: undefined })).toThrow(/unsupported JSON value/);
    expect(() => canonicalizeJson(new Array(1))).toThrow(/sparse-array holes/);
    expect(() => canonicalizeJson([1, , 2])).toThrow(/sparse-array holes/);
    const arrayWithExtraProperty = [1] as number[] & { hiddenGain?: number };
    arrayWithExtraProperty.hiddenGain = 7;
    expect(() => canonicalizeJson(arrayWithExtraProperty)).toThrow(/extra unhashed array property/);
    const objectWithAccessor = {} as { gain: number };
    Object.defineProperty(objectWithAccessor, "gain", { enumerable: true, get: () => 7 });
    expect(() => canonicalizeJson(objectWithAccessor)).toThrow(/enumerable data property/);
    const objectWithHiddenField = { visible: 1 } as { visible: number; hiddenGain?: number };
    Object.defineProperty(objectWithHiddenField, "hiddenGain", { value: 7, enumerable: false });
    expect(() => canonicalizeJson(objectWithHiddenField)).toThrow(/enumerable data property/);
  });

  it("builds a payload-verified SHA-256 A0 contract manifest and rejects a full-length false digest", () => {
    const payload = createPhaseA0ContractManifestPayloadV1();
    const digest = sha256(canonicalizeJson(payload));
    const manifest = buildPhaseA0ContractManifestV1(digest, sha256);

    expect(validateFourChamberContractManifestV1(manifest, sha256)).toBe(manifest);
    expect(manifest.contentSha256).toBe(sha256(canonicalizeJson(contractManifestHashPayload(manifest))));
    expect(manifest.hashAlgorithm).toBe(NORMATIVE_MANIFEST_HASH_ALGORITHM);
    expect(manifest.stateLayout.stateCount).toBe(59);
    expect(manifest.stateLayout.stateInventory).toHaveLength(59);
    expect(manifest.acuteWallConstraint).toMatchObject({
      deformationJacobianJ: 1,
      currentWallMaterialVolumeEqualsReference: true,
      kirchhoffFiberStressEqualsCauchyFiberStress: true,
      wallPowerDensityReferenceMeasure: "tau_f * fiber_log_strain_rate",
    });
    expect(manifest.foundationalContracts.signConventions.edgePressureDrop).toBe(
      "P_upstream - P_downstream",
    );
    expect(manifest.foundationalContracts.ownership.bloodVolume).toBe("circulation-ledger");
    expect(manifest.foundationalContracts.topology.directedClosedLoopEdges).toHaveLength(8);
    expect(manifest.runtimeBoundary).toEqual({
      modelCoreIntegration: false,
      browserRuntimeAdopted: false,
      mechanics2Dependency: false,
    });
    expect(Object.isFrozen(manifest)).toBe(true);
    expect(Object.isFrozen(manifest.adapterIds)).toBe(true);
    expect(() => buildPhaseA0ContractManifestV1("0".repeat(64), sha256)).toThrow(/does not match/);
    expect(() => validateFourChamberContractManifestV1({ ...manifest, modelId: "mutated" }, sha256)).toThrow(
      /modelId must be/,
    );
    const semanticallyWrongPayload = { ...payload, modelId: "wrong-but-rehashed" };
    const semanticallyWrongManifest = {
      ...semanticallyWrongPayload,
      contentSha256: sha256(canonicalizeJson(semanticallyWrongPayload)),
    } as typeof manifest;
    expect(() => validateFourChamberContractManifestV1(semanticallyWrongManifest, sha256)).toThrow(
      /modelId must be/,
    );
    const wrongFoundationPayload = {
      ...payload,
      foundationalContracts: {
        ...payload.foundationalContracts,
        signConventions: {
          ...payload.foundationalContracts.signConventions,
          edgePressureDrop: "P_downstream - P_upstream",
        },
      },
    };
    const wrongFoundationManifest = {
      ...wrongFoundationPayload,
      contentSha256: sha256(canonicalizeJson(wrongFoundationPayload)),
    } as unknown as typeof manifest;
    expect(() => validateFourChamberContractManifestV1(wrongFoundationManifest, sha256)).toThrow(
      /foundationalContracts.signConventions does not match/,
    );
  });

  it("validates and freezes a candidate tissue schema without claiming an A1 release family exists", () => {
    const manifest = ventricularCandidateFixture();
    const frozen = finalizeTissueManifestV1(manifest, sha256);

    expect(frozen.contentSha256).toBe(sha256(canonicalizeJson(tissueManifestHashPayload(frozen))));
    expect(frozen.status).toBe("candidate-prior");
    expect(frozen.land.activeOnly).toBe(true);
    expect(frozen.passiveSls.slsEnabled).toBe(true);
    expect(frozen.homogenization).toEqual({
      orientationRuleId: IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
      stressWorkAdapterId: LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
      chiOrient: 1,
      allowFreeGain: false,
      fitToPVLoop: false,
    });
    expect(frozen.viability.owner).toBe("independent-scar-viability-evidence");
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.land.primitiveParameters)).toBe(true);
  });

  it("rejects unknown fields, false hashes, duplicate parameters, free gains, and premature release", () => {
    const valid = ventricularCandidateFixture();
    expect(() => validateTissueManifestV1({ ...valid, mysteryGain: 1 } as never, sha256)).toThrow(/unknown fields/);
    expect(() => validateTissueManifestV1({ ...valid, contentSha256: "deadbeef" }, sha256)).toThrow(/64-hex/);
    expect(() => validateTissueManifestV1({ ...valid, contentSha256: "0".repeat(64) }, sha256)).toThrow(
      /does not match/,
    );
    expect(() => validateTissueManifestV1({
      ...valid,
      prescribedCalcium: {
        ...valid.prescribedCalcium,
        parameters: [{ ...valid.land.primitiveParameters[0] }],
      },
    }, sha256)).toThrow(/Duplicate manifest parameter/);
    expect(() => validateTissueManifestV1({
      ...valid,
      homogenization: { ...valid.homogenization, chiOrient: 7 },
    } as never, sha256)).toThrow(/requires chiOrient=1/);
    expect(() => validateTissueManifestV1({ ...valid, status: "release" } as never, sha256)).toThrow(
      /remain candidate-prior/,
    );
    const mismatchedKnownFamily = rehashTissueManifest({
      ...valid,
      familyId: "atrial-human-prior-v1",
      tissueClass: "ventricular",
    });
    expect(() => validateTissueManifestV1(mismatchedKnownFamily, sha256)).toThrow(
      /familyId and tissueClass are inconsistent/,
    );
    expect(() => validateTissueManifestV1({ ...valid, atrialDiff: undefined } as never, sha256)).toThrow(
      /must not contain atrialDiff/,
    );
    for (const reservedName of ["lengthReference.lambdaLandSlack", "viability.fViable"]) {
      expect(() => validateTissueManifestV1({
        ...valid,
        land: {
          ...valid.land,
          primitiveParameters: [{ ...valid.land.primitiveParameters[0], name: reservedName }],
        },
      }, sha256)).toThrow(/reserved for a manifest-owned primitive/);
    }
    const sparseSources = [...valid.provenance.sourceReferences];
    delete sparseSources[0];
    expect(() => validateTissueManifestV1({
      ...valid,
      provenance: { ...valid.provenance, sourceReferences: sparseSources },
    }, sha256)).toThrow(/sparse-array holes/);
    const sourcesWithExtra = [...valid.provenance.sourceReferences] as string[] & { hiddenGain?: number };
    sourcesWithExtra.hiddenGain = 7;
    expect(() => validateTissueManifestV1({
      ...valid,
      provenance: { ...valid.provenance, sourceReferences: sourcesWithExtra },
    }, sha256)).toThrow(/extra unhashed array property/);
  });

  it("checks the atrial primitive diff against its exact ventricular base and keeps derived recomputation blocked", () => {
    const base = ventricularCandidateFixture();
    const atrial = atrialCandidateFixture(base, ["land.Tref"]);
    const validation = validateAtrialTissueManifestDiffV1(base, atrial, sha256);

    expect(validation).toEqual({
      baseManifestSha256: base.contentSha256,
      changedPrimitiveParameters: ["land.Tref"],
      exactPrimitiveDiff: true,
      derivedParameterRecomputationStatus: "required-phase-a1",
      releaseBlocked: true,
    });
    expect(validateTissueManifestV1(atrial, sha256)).toBe(atrial);

    const phantomDeclaration = atrialCandidateFixture(base, ["land.kTRPN"]);
    expect(() => validateAtrialTissueManifestDiffV1(base, phantomDeclaration, sha256)).toThrow(
      /exactly match changed primitives/,
    );
    const undeclaredLengthReferenceChange = rehashTissueManifest({
      ...atrial,
      lengthReference: {
        ...atrial.lengthReference,
        lambdaLandSlack: 0.95,
        evidenceId: "independent-sarcomere-length-study-v1",
      },
    });
    expect(() => validateAtrialTissueManifestDiffV1(base, undeclaredLengthReferenceChange, sha256)).toThrow(
      /expected land.Tref, lengthReference.lambdaLandSlack/,
    );
    const changedModelId = rehashTissueManifest({
      ...atrial,
      prescribedCalcium: { ...atrial.prescribedCalcium, modelId: "different-calcium-model" },
    });
    expect(() => validateAtrialTissueManifestDiffV1(base, changedModelId, sha256)).toThrow(
      /changed a model\/equation\/reference invariant/,
    );
    const wrongBase = rehashTissueManifest({
      ...base,
      familyId: "wrong-ventricular-base",
    });
    expect(() => validateAtrialTissueManifestDiffV1(wrongBase, atrial, sha256)).toThrow(/must be ventricular-human/);
  });
});

function ventricularCandidateFixture(): TissueManifestV1 {
  const payload: Omit<TissueManifestV1, "contentSha256"> = {
    schemaId: FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID,
    familyId: "ventricular-human-37c-v1",
    tissueClass: "ventricular",
    status: "candidate-prior",
    temperatureK: 310.15,
    calciumUnitConvention: "uM",
    land: {
      modelId: "land2017-myofilament-v1",
      equationsVersion: "land2017-source-equations-appendix-a-v1",
      activeOnly: true,
      sourceStressConvention: "land2017-Ta",
      primitiveParameters: [parameter("land.Tref", "primitive", 40_500)],
      derivedParameters: [parameter("land.Aw", "derived", 0.25)],
    },
    prescribedCalcium: {
      modelId: "event-two-exponential-prescribed-calcium-v1",
      parameters: [parameter("calcium.tauRiseSec", "primitive", 0.03)],
    },
    passiveSls: {
      equilibriumModelId: "four-chamber-passive-energy-v1",
      slsModelId: "one-state-wall-sls-v1",
      slsEnabled: true,
      parameters: [parameter("sls.tauSec", "primitive", 0.08)],
    },
    lengthReference: {
      adapterId: LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
      lambdaLandSlack: 1,
      evidenceId: "v1-default-no-independent-prestrain-evidence",
      owner: "tissue-manifest",
    },
    homogenization: {
      orientationRuleId: IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
      stressWorkAdapterId: LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
      chiOrient: 1,
      allowFreeGain: false,
      fitToPVLoop: false,
    },
    viability: {
      fViable: 1,
      evidenceId: "healthy-default-v1",
      owner: "independent-scar-viability-evidence",
    },
    provenance: {
      sourceReferences: ["fixture-source-only"],
      transformationRules: ["fixture-SI-conversion-only"],
    },
    targetPack: {
      id: "fixture-isolated-twitch-pack",
      sha256: "1".repeat(64),
    },
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
  };
  return withTissueManifestHash(payload);
}

function atrialCandidateFixture(base: TissueManifestV1, declaredChanges: readonly string[]): TissueManifestV1 {
  const payload: Omit<TissueManifestV1, "contentSha256"> = {
    ...tissueManifestHashPayload(base),
    familyId: "atrial-human-prior-v1",
    tissueClass: "atrial",
    land: {
      ...base.land,
      primitiveParameters: base.land.primitiveParameters.map((entry) =>
        entry.name === "land.Tref" ? { ...entry, runtimeValue: 30_000, sourceValue: 30_000 } : entry),
    },
    atrialDiff: {
      baseManifestSha256: base.contentSha256,
      changedPrimitiveParameters: [...declaredChanges],
      derivedParameterRecomputation: { status: "required-phase-a1" },
    },
  };
  return withTissueManifestHash(payload);
}

function rehashTissueManifest(manifest: TissueManifestV1): TissueManifestV1 {
  return withTissueManifestHash(tissueManifestHashPayload(manifest));
}

function withTissueManifestHash(
  payload: Omit<TissueManifestV1, "contentSha256">,
): TissueManifestV1 {
  return {
    ...payload,
    contentSha256: sha256(canonicalizeJson(payload)),
  };
}

function parameter(name: string, kind: ManifestParameterV1["kind"], runtimeValue: number): ManifestParameterV1 {
  return {
    name,
    kind,
    runtimeValue,
    runtimeUnit: "SI-or-declared-interface-unit",
    sourceValue: runtimeValue,
    sourceUnit: "source-unit",
    sourceId: "fixture-source-only",
    sourceLocation: "fixture-location",
    transformationRule: "fixture-identity-transform",
  };
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
