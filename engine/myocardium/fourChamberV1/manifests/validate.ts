import {
  EXACT_LAND_SEMISMOOTH_POLICY_V1_ID,
  CONTRACT_DIAGNOSTIC_HASH_ALGORITHM,
  FOUR_CHAMBER_CONTRACT_MANIFEST_SCHEMA_V1_ID,
  FOUR_CHAMBER_STATE_SCHEMA_V1_ID,
  FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID,
  FOUR_CHAMBER_TRISEG_LAND_MODEL_V1_ID,
  IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID,
  LAND_LENGTH_REFERENCE_ADAPTER_V1_ID,
  LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID,
  NEWTON_SCALE_POLICY_V1_ID,
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
} from "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  canonicalizeJson,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  contractManifestHashPayload,
  tissueManifestHashPayload,
  type FourChamberContractManifestV1,
  type ManifestParameterV1,
  type TissueManifestV1,
} from "@/engine/myocardium/fourChamberV1/manifests/contracts";
import { FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1 } from "@/engine/myocardium/fourChamberV1/state/fourChamberStateLayoutV1";
import { FOUR_CHAMBER_PHASE_A0_RELEASE_BLOCKERS } from "@/engine/myocardium/fourChamberV1/scope";
import {
  ALGEBRAIC_FLOW_IDS,
  BLOOD_COMPARTMENT_IDS,
  DIRECTED_ALGEBRAIC_EDGES,
  DIRECTED_CLOSED_LOOP_EDGES,
  DIRECTED_INERTIAL_EDGES,
  FOUR_CHAMBER_OWNERSHIP,
  FOUR_CHAMBER_SIGN_CONVENTIONS,
  FOUR_CHAMBER_SI_UNITS,
  INERTIAL_FLOW_IDS,
  TRISEG_ALGEBRAIC_COORDINATES,
  TRISEG_WALL_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ATRIAL_DIFF_RESERVED_PRIMITIVE_NAMES = new Set([
  "lengthReference.lambdaLandSlack",
  "viability.fViable",
]);

export type AtrialTissueManifestDiffValidationV1 = {
  readonly baseManifestSha256: string;
  readonly changedPrimitiveParameters: readonly string[];
  readonly exactPrimitiveDiff: true;
  readonly derivedParameterRecomputationStatus: "required-phase-a1";
  readonly releaseBlocked: true;
};

export function validateTissueManifestV1(
  manifest: TissueManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): TissueManifestV1 {
  validateTissueManifestShapeV1(manifest);
  assertCanonicalSha256(tissueManifestHashPayload(manifest), manifest.contentSha256, sha256Hex);
  return manifest;
}

export function finalizeTissueManifestV1(
  manifest: TissueManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): TissueManifestV1 {
  return deepFreeze(validateTissueManifestV1(manifest, sha256Hex));
}

export function validateAtrialTissueManifestDiffV1(
  base: TissueManifestV1,
  atrial: TissueManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): AtrialTissueManifestDiffValidationV1 {
  validateTissueManifestV1(base, sha256Hex);
  validateTissueManifestV1(atrial, sha256Hex);
  if (base.familyId !== "ventricular-human-37c-v1" || base.tissueClass !== "ventricular") {
    throw new Error("Atrial v1 diff base must be ventricular-human-37c-v1 with ventricular tissueClass");
  }
  if (atrial.familyId !== "atrial-human-prior-v1" || atrial.tissueClass !== "atrial") {
    throw new Error("Atrial v1 diff candidate must be atrial-human-prior-v1 with atrial tissueClass");
  }
  if (atrial.atrialDiff === undefined) throw new Error("Atrial v1 manifest requires atrialDiff");
  if (atrial.atrialDiff.baseManifestSha256 !== base.contentSha256) {
    throw new Error("atrialDiff.baseManifestSha256 does not identify the supplied ventricular base");
  }
  validateAtrialBaseInvariants(base, atrial);

  const basePrimitives = primitiveParameterMap(base);
  const atrialPrimitives = primitiveParameterMap(atrial);
  const baseNames = [...basePrimitives.keys()].sort(compareStrings);
  const atrialNames = [...atrialPrimitives.keys()].sort(compareStrings);
  if (canonicalizeJson(baseNames) !== canonicalizeJson(atrialNames)) {
    throw new Error("Atrial v1 manifest must retain the complete primitive parameter inventory of its base");
  }
  const actualChanged = baseNames.filter((name) =>
    canonicalizeJson(basePrimitives.get(name)) !== canonicalizeJson(atrialPrimitives.get(name)));
  const declaredChanged = [...atrial.atrialDiff.changedPrimitiveParameters].sort(compareStrings);
  if (new Set(declaredChanged).size !== declaredChanged.length) {
    throw new Error("atrialDiff.changedPrimitiveParameters must be unique");
  }
  if (canonicalizeJson(actualChanged) !== canonicalizeJson(declaredChanged)) {
    throw new Error(
      `atrialDiff.changedPrimitiveParameters must exactly match changed primitives; expected ${actualChanged.join(", ")}`,
    );
  }

  return Object.freeze({
    baseManifestSha256: base.contentSha256,
    changedPrimitiveParameters: Object.freeze(actualChanged),
    exactPrimitiveDiff: true,
    derivedParameterRecomputationStatus: "required-phase-a1",
    releaseBlocked: true,
  });
}

export function validateFourChamberContractManifestV1(
  manifest: FourChamberContractManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): FourChamberContractManifestV1 {
  assertExactKeys(manifest, [
    "schemaId", "modelId", "phase", "stateLayout", "runtimeBoundary", "acuteWallConstraint",
    "foundationalContracts", "adapterIds", "policyIds", "requiredTissueManifestFamilies",
    "releaseBlockers", "hashAlgorithm", "contentSha256",
  ], [], "FourChamberContractManifestV1");
  if (manifest.schemaId !== FOUR_CHAMBER_CONTRACT_MANIFEST_SCHEMA_V1_ID) {
    throw new Error("Contract manifest schemaId is invalid");
  }
  if (manifest.modelId !== FOUR_CHAMBER_TRISEG_LAND_MODEL_V1_ID) {
    throw new Error(`Contract manifest modelId must be ${FOUR_CHAMBER_TRISEG_LAND_MODEL_V1_ID}`);
  }
  if (manifest.phase !== "Phase A0") throw new Error("Contract manifest phase must be Phase A0");
  assertExactKeys(manifest.stateLayout, [
    "schemaId", "stateCount", "layoutDiagnosticHash", "diagnosticHashAlgorithm", "stateInventory",
  ], [], "stateLayout");
  if (manifest.stateLayout.schemaId !== FOUR_CHAMBER_STATE_SCHEMA_V1_ID) {
    throw new Error(`stateLayout.schemaId must be ${FOUR_CHAMBER_STATE_SCHEMA_V1_ID}`);
  }
  if (manifest.stateLayout.layoutDiagnosticHash !== FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.layoutDiagnosticHash) {
    throw new Error("stateLayout.layoutDiagnosticHash does not match the canonical Phase A0 layout");
  }
  if (manifest.stateLayout.diagnosticHashAlgorithm !== CONTRACT_DIAGNOSTIC_HASH_ALGORITHM) {
    throw new Error(`stateLayout.diagnosticHashAlgorithm must be ${CONTRACT_DIAGNOSTIC_HASH_ALGORITHM}`);
  }
  if (manifest.stateLayout.stateCount !== 59) throw new Error("Contract manifest state count must be 59");
  requireDenseArray(manifest.stateLayout.stateInventory, "stateLayout.stateInventory");
  if (manifest.stateLayout.stateInventory.length !== 59) {
    throw new Error("stateLayout.stateInventory must contain all 59 states");
  }
  manifest.stateLayout.stateInventory.forEach((state, index) => {
    assertExactKeys(
      state,
      ["key", "label", "offset", "owner", "equationsId", "unit"],
      ["wallId", "patchId"],
      `stateLayout.stateInventory[${index}]`,
    );
    if (state.offset !== index) throw new Error(`stateLayout.stateInventory[${index}] has an invalid offset`);
  });
  const expectedStateInventory = FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1.states.map((state) => ({
    key: state.key,
    label: state.label,
    offset: state.offset,
    owner: state.owner,
    equationsId: state.equationsId,
    unit: state.unit,
    ...(state.wallId === undefined ? {} : { wallId: state.wallId, patchId: state.patchId }),
  }));
  if (canonicalizeJson(manifest.stateLayout.stateInventory) !== canonicalizeJson(expectedStateInventory)) {
    throw new Error("stateLayout.stateInventory does not match the canonical Phase A0 layout");
  }
  assertExactKeys(manifest.runtimeBoundary, [
    "modelCoreIntegration", "browserRuntimeAdopted", "mechanics2Dependency",
  ], [], "runtimeBoundary");
  if (
    manifest.runtimeBoundary.modelCoreIntegration !== false
    || manifest.runtimeBoundary.browserRuntimeAdopted !== false
    || manifest.runtimeBoundary.mechanics2Dependency !== false
  ) {
    throw new Error("Phase A0 contract manifest must remain outside current runtime and mechanics2");
  }
  validateAcuteWallConstraint(manifest.acuteWallConstraint);
  validateFoundationalContracts(manifest.foundationalContracts);
  assertExactKeys(manifest.adapterIds, [
    "landLengthReference", "landNominalToKirchhoff", "oneFiberOrientationRule",
  ], [], "adapterIds");
  if (manifest.adapterIds.landLengthReference !== LAND_LENGTH_REFERENCE_ADAPTER_V1_ID) {
    throw new Error("adapterIds.landLengthReference is invalid");
  }
  if (manifest.adapterIds.landNominalToKirchhoff !== LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID) {
    throw new Error("adapterIds.landNominalToKirchhoff is invalid");
  }
  if (manifest.adapterIds.oneFiberOrientationRule !== IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID) {
    throw new Error("adapterIds.oneFiberOrientationRule is invalid");
  }
  assertExactKeys(manifest.policyIds, ["landSemismooth", "newtonScales"], [], "policyIds");
  if (manifest.policyIds.landSemismooth !== EXACT_LAND_SEMISMOOTH_POLICY_V1_ID) {
    throw new Error("policyIds.landSemismooth is invalid");
  }
  if (manifest.policyIds.newtonScales !== NEWTON_SCALE_POLICY_V1_ID) {
    throw new Error("policyIds.newtonScales is invalid");
  }
  requireDenseArray(manifest.requiredTissueManifestFamilies, "requiredTissueManifestFamilies");
  if (
    manifest.requiredTissueManifestFamilies.length !== 2
    || manifest.requiredTissueManifestFamilies[0] !== "ventricular-human-37c-v1"
    || manifest.requiredTissueManifestFamilies[1] !== "atrial-human-prior-v1"
  ) {
    throw new Error("requiredTissueManifestFamilies must name the ventricular and atrial A1 families");
  }
  requireNonEmptyStringArray(manifest.releaseBlockers, "releaseBlockers");
  if (canonicalizeJson(manifest.releaseBlockers) !== canonicalizeJson(FOUR_CHAMBER_PHASE_A0_RELEASE_BLOCKERS)) {
    throw new Error("releaseBlockers must match the canonical Phase A0 blocker set");
  }
  if (manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM) {
    throw new Error(`hashAlgorithm must be ${NORMATIVE_MANIFEST_HASH_ALGORITHM}`);
  }
  assertSha256(manifest.contentSha256, "contentSha256");
  assertCanonicalSha256(contractManifestHashPayload(manifest), manifest.contentSha256, sha256Hex);
  return manifest;
}

export function finalizeFourChamberContractManifestV1(
  manifest: FourChamberContractManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): FourChamberContractManifestV1 {
  return deepFreeze(validateFourChamberContractManifestV1(manifest, sha256Hex));
}

export function assertSha256(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || !SHA256_PATTERN.test(value)) {
    throw new Error(`${field} must be a lowercase 64-hex SHA-256 digest`);
  }
}

function validateTissueManifestShapeV1(manifest: TissueManifestV1): void {
  assertExactKeys(manifest, [
    "schemaId", "familyId", "tissueClass", "status", "temperatureK", "calciumUnitConvention",
    "land", "prescribedCalcium", "passiveSls", "lengthReference", "homogenization", "viability",
    "provenance", "targetPack", "hashAlgorithm", "contentSha256",
  ], ["atrialDiff"], "TissueManifestV1");
  if (manifest.schemaId !== FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID) {
    throw new Error(`TissueManifestV1.schemaId must be ${FOUR_CHAMBER_TISSUE_MANIFEST_SCHEMA_V1_ID}`);
  }
  requireNonEmpty(manifest.familyId, "familyId");
  if (manifest.tissueClass !== "atrial" && manifest.tissueClass !== "ventricular") {
    throw new Error("tissueClass must be atrial or ventricular");
  }
  if (
    (manifest.familyId === "ventricular-human-37c-v1" && manifest.tissueClass !== "ventricular")
    || (manifest.familyId === "atrial-human-prior-v1" && manifest.tissueClass !== "atrial")
  ) {
    throw new Error("Known tissue manifest familyId and tissueClass are inconsistent");
  }
  if (manifest.status !== "candidate-prior") {
    throw new Error("Phase A0 tissue manifests must remain candidate-prior until Phase A1 promotion gates pass");
  }
  requirePositiveFinite(manifest.temperatureK, "temperatureK");
  if (manifest.calciumUnitConvention !== "uM") throw new Error("calciumUnitConvention must be uM");

  assertExactKeys(manifest.land, [
    "modelId", "equationsVersion", "activeOnly", "sourceStressConvention",
    "primitiveParameters", "derivedParameters",
  ], [], "land");
  if (manifest.land.modelId !== "land2017-myofilament-v1") throw new Error("land.modelId is invalid");
  requireNonEmpty(manifest.land.equationsVersion, "land.equationsVersion");
  if (manifest.land.activeOnly !== true) throw new Error("land.activeOnly must be true");
  if (manifest.land.sourceStressConvention !== "land2017-Ta") {
    throw new Error("land.sourceStressConvention must be land2017-Ta");
  }
  assertExactKeys(manifest.prescribedCalcium, ["modelId", "parameters"], [], "prescribedCalcium");
  requireNonEmpty(manifest.prescribedCalcium.modelId, "prescribedCalcium.modelId");
  assertExactKeys(manifest.passiveSls, [
    "equilibriumModelId", "slsModelId", "slsEnabled", "parameters",
  ], [], "passiveSls");
  requireNonEmpty(manifest.passiveSls.equilibriumModelId, "passiveSls.equilibriumModelId");
  requireNonEmpty(manifest.passiveSls.slsModelId, "passiveSls.slsModelId");
  if (manifest.passiveSls.slsEnabled !== true) throw new Error("passiveSls.slsEnabled must be true");

  const parameterGroups = [
    manifest.land.primitiveParameters,
    manifest.land.derivedParameters,
    manifest.prescribedCalcium.parameters,
    manifest.passiveSls.parameters,
  ];
  const allParameterNames = new Set<string>();
  for (const parameters of parameterGroups) {
    requireDenseArray(parameters, "manifest parameter group");
    if (parameters.length === 0) throw new Error("Every manifest parameter group must be a non-empty array");
    for (let index = 0; index < parameters.length; index += 1) {
      const parameter = parameters[index];
      validateManifestParameter(parameter);
      if (allParameterNames.has(parameter.name)) throw new Error(`Duplicate manifest parameter ${parameter.name}`);
      allParameterNames.add(parameter.name);
    }
  }
  if (manifest.land.primitiveParameters.some((parameter) => parameter.kind !== "primitive")) {
    throw new Error("land.primitiveParameters must contain only primitive entries");
  }
  if (manifest.land.derivedParameters.some((parameter) => parameter.kind !== "derived")) {
    throw new Error("land.derivedParameters must contain only derived entries");
  }
  if (
    manifest.prescribedCalcium.parameters.some((parameter) => parameter.kind !== "primitive")
    || manifest.passiveSls.parameters.some((parameter) => parameter.kind !== "primitive")
  ) {
    throw new Error("Prescribed-calcium and passive/SLS manifest parameters must be primitive entries");
  }

  assertExactKeys(
    manifest.lengthReference,
    ["adapterId", "lambdaLandSlack", "evidenceId", "owner"],
    [],
    "lengthReference",
  );
  if (manifest.lengthReference.adapterId !== LAND_LENGTH_REFERENCE_ADAPTER_V1_ID) {
    throw new Error("lengthReference.adapterId is invalid");
  }
  requirePositiveFinite(manifest.lengthReference.lambdaLandSlack, "lengthReference.lambdaLandSlack");
  requireNonEmpty(manifest.lengthReference.evidenceId, "lengthReference.evidenceId");
  if (manifest.lengthReference.owner !== "tissue-manifest") throw new Error("lengthReference.owner is invalid");
  assertExactKeys(manifest.homogenization, [
    "orientationRuleId", "stressWorkAdapterId", "chiOrient", "allowFreeGain", "fitToPVLoop",
  ], [], "homogenization");
  if (manifest.homogenization.orientationRuleId !== IDENTITY_ONE_FIBER_ORIENTATION_RULE_V1_ID) {
    throw new Error("four-chamber v1 only permits identity-one-fiber-orientation-v1");
  }
  if (manifest.homogenization.stressWorkAdapterId !== LAND_NOMINAL_TO_KIRCHHOFF_ADAPTER_V1_ID) {
    throw new Error("homogenization.stressWorkAdapterId is invalid");
  }
  if (manifest.homogenization.chiOrient !== 1) {
    throw new Error("identity-one-fiber-orientation-v1 requires chiOrient=1");
  }
  if (manifest.homogenization.allowFreeGain !== false || manifest.homogenization.fitToPVLoop !== false) {
    throw new Error("homogenization forbids free gain and PV-loop fitting");
  }

  assertExactKeys(manifest.viability, ["fViable", "evidenceId", "owner"], [], "viability");
  requireClosedUnitInterval(manifest.viability.fViable, "viability.fViable");
  requireNonEmpty(manifest.viability.evidenceId, "viability.evidenceId");
  if (manifest.viability.owner !== "independent-scar-viability-evidence") {
    throw new Error("viability.owner is invalid");
  }
  assertExactKeys(manifest.provenance, ["sourceReferences", "transformationRules"], [], "provenance");
  requireNonEmptyStringArray(manifest.provenance.sourceReferences, "provenance.sourceReferences");
  requireNonEmptyStringArray(manifest.provenance.transformationRules, "provenance.transformationRules");
  assertExactKeys(manifest.targetPack, ["id", "sha256"], [], "targetPack");
  requireNonEmpty(manifest.targetPack.id, "targetPack.id");
  assertSha256(manifest.targetPack.sha256, "targetPack.sha256");

  if (manifest.tissueClass === "atrial") validateAtrialDiffMetadata(manifest.atrialDiff);
  else if (Object.hasOwn(manifest, "atrialDiff")) {
    throw new Error("Ventricular manifests must not contain atrialDiff, including undefined placeholders");
  }
  if (manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM) {
    throw new Error(`hashAlgorithm must be ${NORMATIVE_MANIFEST_HASH_ALGORITHM}`);
  }
  assertSha256(manifest.contentSha256, "contentSha256");
}

function validateAtrialDiffMetadata(atrialDiff: TissueManifestV1["atrialDiff"]): void {
  if (atrialDiff === undefined) throw new Error("Atrial v1 manifest requires atrialDiff");
  assertExactKeys(atrialDiff, [
    "baseManifestSha256", "changedPrimitiveParameters", "derivedParameterRecomputation",
  ], [], "atrialDiff");
  assertSha256(atrialDiff.baseManifestSha256, "atrialDiff.baseManifestSha256");
  requireNonEmptyStringArray(atrialDiff.changedPrimitiveParameters, "atrialDiff.changedPrimitiveParameters");
  if (new Set(atrialDiff.changedPrimitiveParameters).size !== atrialDiff.changedPrimitiveParameters.length) {
    throw new Error("atrialDiff.changedPrimitiveParameters must be unique");
  }
  assertExactKeys(
    atrialDiff.derivedParameterRecomputation,
    ["status"],
    [],
    "atrialDiff.derivedParameterRecomputation",
  );
  if (atrialDiff.derivedParameterRecomputation.status !== "required-phase-a1") {
    throw new Error("Atrial derived-parameter recomputation remains required in Phase A1");
  }
}

function validateAcuteWallConstraint(
  constraint: FourChamberContractManifestV1["acuteWallConstraint"],
): void {
  assertExactKeys(constraint, [
    "deformationJacobianJ", "myocardialIncompressibility", "currentWallMaterialVolumeEqualsReference",
    "wallMaterialVolumeRemodelingWithinAcuteBeat", "kirchhoffFiberStressEqualsCauchyFiberStress",
    "workConjugateStrain", "workConjugateStress", "wallPowerDensityReferenceMeasure", "totalWallPower",
  ], [], "acuteWallConstraint");
  if (
    constraint.deformationJacobianJ !== 1
    || constraint.myocardialIncompressibility !== true
    || constraint.currentWallMaterialVolumeEqualsReference !== true
    || constraint.wallMaterialVolumeRemodelingWithinAcuteBeat !== false
    || constraint.kirchhoffFiberStressEqualsCauchyFiberStress !== true
    || constraint.workConjugateStrain !== "fiber-log-strain"
    || constraint.workConjugateStress !== "scalar-kirchhoff-fiber-stress"
    || constraint.wallPowerDensityReferenceMeasure !== "tau_f * fiber_log_strain_rate"
    || constraint.totalWallPower !== "V_wall_reference * tau_f * fiber_log_strain_rate"
  ) {
    throw new Error(
      "acuteWallConstraint must encode J=1, Vw=Vw0, Kirchhoff=Cauchy, and log-strain power v1 mechanics",
    );
  }
}

function validateFoundationalContracts(
  contracts: FourChamberContractManifestV1["foundationalContracts"],
): void {
  assertExactKeys(
    contracts,
    ["siUnits", "signConventions", "ownership", "topology"],
    [],
    "foundationalContracts",
  );
  assertCanonicalContractValue(contracts.siUnits, FOUR_CHAMBER_SI_UNITS, "foundationalContracts.siUnits");
  assertCanonicalContractValue(
    contracts.signConventions,
    FOUR_CHAMBER_SIGN_CONVENTIONS,
    "foundationalContracts.signConventions",
  );
  assertCanonicalContractValue(
    contracts.ownership,
    FOUR_CHAMBER_OWNERSHIP,
    "foundationalContracts.ownership",
  );
  assertExactKeys(contracts.topology, [
    "bloodCompartmentIds", "inertialFlowIds", "algebraicFlowIds", "wallIds", "triSegWallIds",
    "triSegAlgebraicCoordinates", "directedInertialEdges", "directedAlgebraicEdges",
    "directedClosedLoopEdges",
  ], [], "foundationalContracts.topology");
  const expectedTopology: FourChamberContractManifestV1["foundationalContracts"]["topology"] = {
    bloodCompartmentIds: BLOOD_COMPARTMENT_IDS,
    inertialFlowIds: INERTIAL_FLOW_IDS,
    algebraicFlowIds: ALGEBRAIC_FLOW_IDS,
    wallIds: WALL_IDS,
    triSegWallIds: TRISEG_WALL_IDS,
    triSegAlgebraicCoordinates: TRISEG_ALGEBRAIC_COORDINATES,
    directedInertialEdges: DIRECTED_INERTIAL_EDGES,
    directedAlgebraicEdges: DIRECTED_ALGEBRAIC_EDGES,
    directedClosedLoopEdges: DIRECTED_CLOSED_LOOP_EDGES,
  };
  assertCanonicalContractValue(
    contracts.topology,
    expectedTopology,
    "foundationalContracts.topology",
  );
}

function assertCanonicalContractValue(actual: unknown, expected: unknown, field: string): void {
  if (canonicalizeJson(actual) !== canonicalizeJson(expected)) {
    throw new Error(`${field} does not match the canonical Phase A0 contract`);
  }
}

function primitiveParameterMap(manifest: TissueManifestV1): Map<string, unknown> {
  const entries = [
    ...manifest.land.primitiveParameters,
    ...manifest.prescribedCalcium.parameters,
    ...manifest.passiveSls.parameters,
  ];
  return new Map<string, unknown>([
    ...entries.map((entry) => [entry.name, entry] as const),
    ["lengthReference.lambdaLandSlack", {
      runtimeValue: manifest.lengthReference.lambdaLandSlack,
      runtimeUnit: "1",
      evidenceId: manifest.lengthReference.evidenceId,
    }],
    ["viability.fViable", {
      runtimeValue: manifest.viability.fViable,
      runtimeUnit: "1",
      evidenceId: manifest.viability.evidenceId,
    }],
  ]);
}

function validateAtrialBaseInvariants(base: TissueManifestV1, atrial: TissueManifestV1): void {
  const invariantView = (manifest: TissueManifestV1) => ({
    status: manifest.status,
    temperatureK: manifest.temperatureK,
    calciumUnitConvention: manifest.calciumUnitConvention,
    land: {
      modelId: manifest.land.modelId,
      equationsVersion: manifest.land.equationsVersion,
      activeOnly: manifest.land.activeOnly,
      sourceStressConvention: manifest.land.sourceStressConvention,
    },
    prescribedCalciumModelId: manifest.prescribedCalcium.modelId,
    passiveSls: {
      equilibriumModelId: manifest.passiveSls.equilibriumModelId,
      slsModelId: manifest.passiveSls.slsModelId,
      slsEnabled: manifest.passiveSls.slsEnabled,
    },
    lengthReference: {
      adapterId: manifest.lengthReference.adapterId,
      owner: manifest.lengthReference.owner,
    },
    homogenization: manifest.homogenization,
    viabilityOwner: manifest.viability.owner,
    hashAlgorithm: manifest.hashAlgorithm,
  });
  if (canonicalizeJson(invariantView(base)) !== canonicalizeJson(invariantView(atrial))) {
    throw new Error("Atrial v1 manifest changed a model/equation/reference invariant owned by its ventricular base");
  }
}

function validateManifestParameter(parameter: ManifestParameterV1): void {
  assertExactKeys(parameter, [
    "name", "kind", "runtimeValue", "runtimeUnit", "sourceValue", "sourceUnit", "sourceId",
    "sourceLocation", "transformationRule",
  ], [], `parameter ${String(parameter?.name)}`);
  requireNonEmpty(parameter.name, "parameter.name");
  if (ATRIAL_DIFF_RESERVED_PRIMITIVE_NAMES.has(parameter.name)) {
    throw new Error(`${parameter.name} is reserved for a manifest-owned primitive`);
  }
  if (parameter.kind !== "primitive" && parameter.kind !== "derived") throw new Error("parameter.kind is invalid");
  requireFinite(parameter.runtimeValue, `${parameter.name}.runtimeValue`);
  if (typeof parameter.sourceValue === "number") requireFinite(parameter.sourceValue, `${parameter.name}.sourceValue`);
  else requireNonEmpty(parameter.sourceValue, `${parameter.name}.sourceValue`);
  requireNonEmpty(parameter.runtimeUnit, `${parameter.name}.runtimeUnit`);
  requireNonEmpty(parameter.sourceUnit, `${parameter.name}.sourceUnit`);
  requireNonEmpty(parameter.sourceId, `${parameter.name}.sourceId`);
  requireNonEmpty(parameter.sourceLocation, `${parameter.name}.sourceLocation`);
  requireNonEmpty(parameter.transformationRule, `${parameter.name}.transformationRule`);
}

function assertExactKeys(
  value: object,
  required: readonly string[],
  optional: readonly string[],
  field: string,
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object`);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error(`${field} must be a plain object`);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) throw new Error(`${field} must not contain symbol keys`);
  const actual = ownKeys as string[];
  if (actual.some((key) => !Object.prototype.propertyIsEnumerable.call(value, key))) {
    throw new Error(`${field} must not contain non-enumerable fields`);
  }
  for (const key of actual) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) {
      throw new Error(`${field}.${key} must be a data property`);
    }
  }
  const allowed = new Set([...required, ...optional]);
  const unknown = actual.filter((key) => !allowed.has(key));
  const missing = required.filter((key) => !Object.hasOwn(value, key));
  if (unknown.length > 0) throw new Error(`${field} contains unknown fields: ${unknown.join(", ")}`);
  if (missing.length > 0) throw new Error(`${field} is missing required fields: ${missing.join(", ")}`);
}

function requireDenseArray(value: unknown, field: string): asserts value is readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  if (Object.getPrototypeOf(value) !== Array.prototype) {
    throw new Error(`${field} must use the plain Array prototype`);
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") throw new Error(`${field} must not contain symbol keys`);
    if (key === "length") continue;
    if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length) {
      throw new Error(`${field} contains an extra unhashed array property ${key}`);
    }
    if (!Object.prototype.propertyIsEnumerable.call(value, key)) {
      throw new Error(`${field}[${key}] must be enumerable`);
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) {
      throw new Error(`${field}[${key}] must be a data property`);
    }
  }
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) throw new Error(`${field} must not contain sparse-array holes`);
  }
}

function requireNonEmpty(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${field} must be a non-empty string`);
}

function requireFinite(value: unknown, field: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${field} must be finite`);
}

function requirePositiveFinite(value: unknown, field: string): asserts value is number {
  requireFinite(value, field);
  if (value <= 0) throw new Error(`${field} must be positive`);
}

function requireClosedUnitInterval(value: unknown, field: string): asserts value is number {
  requireFinite(value, field);
  if (value < 0 || value > 1) throw new Error(`${field} must be within [0, 1]`);
}

function requireNonEmptyStringArray(value: unknown, field: string): asserts value is readonly string[] {
  requireDenseArray(value, field);
  if (value.length === 0) throw new Error(`${field} must be a non-empty array`);
  for (let index = 0; index < value.length; index += 1) requireNonEmpty(value[index], `${field}[${index}]`);
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    if (!Object.isFrozen(value)) Object.freeze(value);
  }
  return value;
}
