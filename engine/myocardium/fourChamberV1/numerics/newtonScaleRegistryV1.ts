import { stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  CONTRACT_DIAGNOSTIC_HASH_ALGORITHM,
  NEWTON_SCALE_POLICY_V1_ID,
  NORMATIVE_MANIFEST_HASH_ALGORITHM,
} from "@/engine/myocardium/fourChamberV1/ids";
import {
  assertCanonicalSha256,
  canonicalizeJson,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  BLOOD_COMPARTMENT_IDS,
  TRISEG_WALL_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberWallId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const MILLILITER_TO_CUBIC_METER = 1e-6;
export const MILLIMETER_TO_METER = 1e-3;
export const MMHG_TO_PASCAL = 133.322387415;
export const HUNDRED_MILLILITER_M3 = 1e-4;

const FOUR_CHAMBER_NEWTON_SCALE_REGISTRIES_V1 = new WeakSet<object>();

export const FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1 = deepFreeze({
  id: NEWTON_SCALE_POLICY_V1_ID,
  adaptiveRescaling: false,
  defaultUnknownOffset: 0,
  bloodVolumeFloorM3: HUNDRED_MILLILITER_M3,
  inertialFlowM3PerSec: HUNDRED_MILLILITER_M3,
  septalMidwallVolumeM3: HUNDRED_MILLILITER_M3,
  junctionRadiusM: 30 * MILLIMETER_TO_METER,
  fiberLogStrain: 0.1,
  slsViscousStrain: 0.1,
  calciumAndPopulation: 1,
  landDistortionFloor: 0.1,
  calciumInterfaceUM: 1,
  referenceTimeSec: 1,
  flowMomentumResidualPa: 10 * MMHG_TO_PASCAL,
  pressureScalePa: 100 * MMHG_TO_PASCAL,
  volumeScaleM3: HUNDRED_MILLILITER_M3,
  lengthScaleM: 30 * MILLIMETER_TO_METER,
  tissueStressFloorPa: 1_000,
  globalResidualTolerance: 1e-8,
  globalUpdateTolerance: 1e-8,
  localMaterialResidualTolerance: 1e-10,
});

export type TissueStressScaleInputs = {
  readonly landReferenceTensionPa: number;
  readonly passiveTensileStressScalePa: number;
  readonly compressionStressScalePa: number;
};

export type TriSegScaleInputs = {
  readonly wallReferenceMaterialVolumeM3: number;
  readonly midwallReferenceAreaM2: number;
};

export type FourChamberNewtonScaleRegistryInput = {
  readonly referenceBloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  readonly landDistortionCoefficientsByWall: Readonly<
    Record<FourChamberWallId, { readonly Aw: number; readonly As: number }>
  >;
  readonly tissueStressInputsByWall: Readonly<Record<FourChamberWallId, TissueStressScaleInputs>>;
  readonly triSegInputsByWall: Readonly<Record<TriSegWallId, TriSegScaleInputs>>;
  readonly referenceCenteredGeometryOffsets?: {
    readonly septalMidwallVolumeM3: number;
    readonly junctionRadiusM: number;
    readonly evidenceId: string;
  };
};

export type FourChamberNewtonScaleRegistryV1 = {
  readonly policyId: typeof NEWTON_SCALE_POLICY_V1_ID;
  readonly policy: typeof FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1;
  readonly fixedBeforeRun: true;
  readonly adaptiveRescaling: false;
  readonly unknownOffsetDefault: 0;
  readonly unknownScales: {
    readonly bloodVolumeM3: Readonly<Record<BloodCompartmentId, number>>;
    readonly inertialFlowM3PerSec: number;
    readonly septalMidwallVolumeM3: number;
    readonly junctionRadiusM: number;
    readonly fiberLogStrain: number;
    readonly slsViscousStrain: number;
    readonly calciumAndPopulation: number;
    readonly calciumInterfaceUM: number;
    readonly landDistortionByWall: Readonly<Record<FourChamberWallId, number>>;
  };
  readonly unknownOffsets: {
    readonly default: 0;
    readonly septalMidwallVolumeM3: number;
    readonly junctionRadiusM: number;
    readonly evidenceId: string;
  };
  readonly residualScales: {
    readonly referenceTimeSec: number;
    readonly flowMomentumPa: number;
    readonly pressurePa: number;
    readonly virtualWorkSeptalVolumePa: number;
    readonly virtualWorkJunctionRadiusN: number;
    readonly tissueStressByWallPa: Readonly<Record<FourChamberWallId, number>>;
    readonly publishedTriSegWallTensionByWallNPerM: Readonly<Record<TriSegWallId, number>>;
    readonly publishedTriSegEquilibriumNPerM: number;
  };
  readonly tolerances: {
    readonly globalResidualInfinityNorm: number;
    readonly globalUpdateInfinityNorm: number;
    readonly localMaterialResidualInfinityNorm: number;
  };
  readonly diagnosticHashAlgorithm: typeof CONTRACT_DIAGNOSTIC_HASH_ALGORITHM;
  readonly registryDiagnosticHash: string;
  readonly hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
  readonly registryContentSha256: string;
};

export type FourChamberNewtonScaleRegistryHashPayloadV1 = Pick<
  FourChamberNewtonScaleRegistryV1,
  "policy" | "unknownScales" | "unknownOffsets" | "residualScales" | "tolerances"
>;

export function buildFourChamberNewtonScaleRegistryV1(
  input: FourChamberNewtonScaleRegistryInput,
  sha256Hex: CanonicalSha256HexProvider,
): FourChamberNewtonScaleRegistryV1 {
  const policy = FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1;
  const bloodVolumeM3 = mapRecord(BLOOD_COMPARTMENT_IDS, (compartmentId) =>
    Math.max(
      requirePositiveFinite(input.referenceBloodVolumesM3[compartmentId], `referenceBloodVolumesM3.${compartmentId}`),
      policy.bloodVolumeFloorM3,
    ));
  const landDistortionByWall = mapRecord(WALL_IDS, (wallId) => {
    const coefficients = input.landDistortionCoefficientsByWall[wallId];
    if (coefficients === undefined) throw new Error(`landDistortionCoefficientsByWall.${wallId} is required`);
    const Aw = requireFinite(coefficients.Aw, `landDistortionCoefficientsByWall.${wallId}.Aw`);
    const As = requireFinite(coefficients.As, `landDistortionCoefficientsByWall.${wallId}.As`);
    return Math.max(Math.abs(Aw), Math.abs(As), policy.landDistortionFloor);
  });
  const tissueStressByWallPa = mapRecord(WALL_IDS, (wallId) =>
    deriveTissueStressScalePa(input.tissueStressInputsByWall[wallId], wallId));
  const publishedTriSegWallTensionByWallNPerM = mapRecord(TRISEG_WALL_IDS, (wallId) => {
    const geometry = input.triSegInputsByWall[wallId];
    if (geometry === undefined) throw new Error(`triSegInputsByWall.${wallId} is required`);
    const wallReferenceMaterialVolumeM3 = requirePositiveFinite(
      geometry.wallReferenceMaterialVolumeM3,
      `triSegInputsByWall.${wallId}.wallReferenceMaterialVolumeM3`,
    );
    const midwallReferenceAreaM2 = requirePositiveFinite(
      geometry.midwallReferenceAreaM2,
      `triSegInputsByWall.${wallId}.midwallReferenceAreaM2`,
    );
    return wallReferenceMaterialVolumeM3 * tissueStressByWallPa[wallId] / (2 * midwallReferenceAreaM2);
  });
  const publishedTriSegEquilibriumNPerM = TRISEG_WALL_IDS.reduce(
    (sum, wallId) => sum + publishedTriSegWallTensionByWallNPerM[wallId],
    0,
  );
  const virtualWorkJunctionRadiusN =
    policy.pressureScalePa * policy.volumeScaleM3 / policy.lengthScaleM;
  const referenceCenteredGeometryOffsets = input.referenceCenteredGeometryOffsets;
  const unknownOffsets = referenceCenteredGeometryOffsets === undefined
    ? {
      default: 0 as const,
      septalMidwallVolumeM3: 0,
      junctionRadiusM: 0,
      evidenceId: "zero-offset-v1",
    }
    : {
      default: 0 as const,
      septalMidwallVolumeM3: requireFinite(
        referenceCenteredGeometryOffsets.septalMidwallVolumeM3,
        "referenceCenteredGeometryOffsets.septalMidwallVolumeM3",
      ),
      junctionRadiusM: requireFinite(
        referenceCenteredGeometryOffsets.junctionRadiusM,
        "referenceCenteredGeometryOffsets.junctionRadiusM",
      ),
      evidenceId: requireNonEmpty(
        referenceCenteredGeometryOffsets.evidenceId,
        "referenceCenteredGeometryOffsets.evidenceId",
      ),
    };

  const hashInput = {
    policy,
    unknownScales: {
      bloodVolumeM3,
      inertialFlowM3PerSec: policy.inertialFlowM3PerSec,
      septalMidwallVolumeM3: policy.septalMidwallVolumeM3,
      junctionRadiusM: policy.junctionRadiusM,
      fiberLogStrain: policy.fiberLogStrain,
      slsViscousStrain: policy.slsViscousStrain,
      calciumAndPopulation: policy.calciumAndPopulation,
      calciumInterfaceUM: policy.calciumInterfaceUM,
      landDistortionByWall,
    },
    unknownOffsets,
    residualScales: {
      referenceTimeSec: policy.referenceTimeSec,
      flowMomentumPa: policy.flowMomentumResidualPa,
      pressurePa: policy.pressureScalePa,
      virtualWorkSeptalVolumePa: policy.pressureScalePa,
      virtualWorkJunctionRadiusN,
      tissueStressByWallPa,
      publishedTriSegWallTensionByWallNPerM,
      publishedTriSegEquilibriumNPerM,
    },
    tolerances: {
      globalResidualInfinityNorm: policy.globalResidualTolerance,
      globalUpdateInfinityNorm: policy.globalUpdateTolerance,
      localMaterialResidualInfinityNorm: policy.localMaterialResidualTolerance,
    },
  };

  const registry = deepFreeze<FourChamberNewtonScaleRegistryV1>({
    policyId: NEWTON_SCALE_POLICY_V1_ID,
    fixedBeforeRun: true,
    adaptiveRescaling: false,
    unknownOffsetDefault: 0,
    ...hashInput,
    diagnosticHashAlgorithm: CONTRACT_DIAGNOSTIC_HASH_ALGORITHM,
    registryDiagnosticHash: stableHash(hashInput),
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    registryContentSha256: computeCanonicalSha256(hashInput, sha256Hex),
  });
  FOUR_CHAMBER_NEWTON_SCALE_REGISTRIES_V1.add(registry);
  return validateFourChamberNewtonScaleRegistryV1(registry, sha256Hex);
}

export function assertCanonicalFourChamberNewtonScaleRegistryV1(
  registry: FourChamberNewtonScaleRegistryV1,
): FourChamberNewtonScaleRegistryV1 {
  if (
    registry === null
    || typeof registry !== "object"
    || !FOUR_CHAMBER_NEWTON_SCALE_REGISTRIES_V1.has(registry)
  ) {
    throw new Error(
      "Newton scale registry must be the canonical compiled registry",
    );
  }
  return registry;
}

export function fourChamberNewtonScaleRegistryHashPayloadV1(
  registry: FourChamberNewtonScaleRegistryV1,
): FourChamberNewtonScaleRegistryHashPayloadV1 {
  return Object.freeze({
    policy: registry.policy,
    unknownScales: registry.unknownScales,
    unknownOffsets: registry.unknownOffsets,
    residualScales: registry.residualScales,
    tolerances: registry.tolerances,
  });
}

export function validateFourChamberNewtonScaleRegistryV1(
  registry: FourChamberNewtonScaleRegistryV1,
  sha256Hex: CanonicalSha256HexProvider,
): FourChamberNewtonScaleRegistryV1 {
  assertExactKeys(registry, [
    "policyId", "policy", "fixedBeforeRun", "adaptiveRescaling", "unknownOffsetDefault",
    "unknownScales", "unknownOffsets", "residualScales", "tolerances", "diagnosticHashAlgorithm",
    "registryDiagnosticHash", "hashAlgorithm", "registryContentSha256",
  ], "FourChamberNewtonScaleRegistryV1");
  if (registry.policyId !== NEWTON_SCALE_POLICY_V1_ID) throw new Error("Newton scale policy ID is invalid");
  if (canonicalizeJson(registry.policy) !== canonicalizeJson(FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1)) {
    throw new Error("Newton scale policy does not match the canonical Phase A0 policy");
  }
  if (!registry.fixedBeforeRun || registry.adaptiveRescaling || registry.unknownOffsetDefault !== 0) {
    throw new Error("Newton scale registry must be fixed before run with adaptive rescaling disabled");
  }
  assertExactKeys(registry.unknownScales, [
    "bloodVolumeM3", "inertialFlowM3PerSec", "septalMidwallVolumeM3", "junctionRadiusM",
    "fiberLogStrain", "slsViscousStrain", "calciumAndPopulation", "calciumInterfaceUM",
    "landDistortionByWall",
  ], "unknownScales");
  validatePositiveRecord(registry.unknownScales.bloodVolumeM3, BLOOD_COMPARTMENT_IDS, "bloodVolumeM3");
  validatePositiveRecord(registry.unknownScales.landDistortionByWall, WALL_IDS, "landDistortionByWall");
  for (const [field, value] of Object.entries(registry.unknownScales)) {
    if (field === "bloodVolumeM3" || field === "landDistortionByWall") continue;
    requirePositiveFinite(value as number, `unknownScales.${field}`);
  }
  assertExactKeys(registry.unknownOffsets, [
    "default", "septalMidwallVolumeM3", "junctionRadiusM", "evidenceId",
  ], "unknownOffsets");
  if (registry.unknownOffsets.default !== 0) throw new Error("unknownOffsets.default must be zero");
  requireFinite(registry.unknownOffsets.septalMidwallVolumeM3, "unknownOffsets.septalMidwallVolumeM3");
  requireFinite(registry.unknownOffsets.junctionRadiusM, "unknownOffsets.junctionRadiusM");
  requireNonEmpty(registry.unknownOffsets.evidenceId, "unknownOffsets.evidenceId");
  assertExactKeys(registry.residualScales, [
    "referenceTimeSec", "flowMomentumPa", "pressurePa", "virtualWorkSeptalVolumePa",
    "virtualWorkJunctionRadiusN", "tissueStressByWallPa", "publishedTriSegWallTensionByWallNPerM",
    "publishedTriSegEquilibriumNPerM",
  ], "residualScales");
  validatePositiveRecord(registry.residualScales.tissueStressByWallPa, WALL_IDS, "tissueStressByWallPa");
  validatePositiveRecord(
    registry.residualScales.publishedTriSegWallTensionByWallNPerM,
    TRISEG_WALL_IDS,
    "publishedTriSegWallTensionByWallNPerM",
  );
  for (const [field, value] of Object.entries(registry.residualScales)) {
    if (field === "tissueStressByWallPa" || field === "publishedTriSegWallTensionByWallNPerM") continue;
    requirePositiveFinite(value as number, `residualScales.${field}`);
  }
  assertExactKeys(registry.tolerances, [
    "globalResidualInfinityNorm", "globalUpdateInfinityNorm", "localMaterialResidualInfinityNorm",
  ], "tolerances");
  for (const [field, value] of Object.entries(registry.tolerances)) {
    requirePositiveFinite(value, `tolerances.${field}`);
  }
  const payload = fourChamberNewtonScaleRegistryHashPayloadV1(registry);
  if (registry.diagnosticHashAlgorithm !== CONTRACT_DIAGNOSTIC_HASH_ALGORITHM) {
    throw new Error("Newton registry diagnostic hash algorithm is invalid");
  }
  if (!/^[0-9a-f]{8}$/.test(registry.registryDiagnosticHash)) {
    throw new Error("Newton registry diagnostic hash must be lowercase 8-hex FNV-1a");
  }
  if (registry.registryDiagnosticHash !== stableHash(payload)) {
    throw new Error("Newton registry diagnostic hash does not match its payload");
  }
  if (registry.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM) {
    throw new Error("Newton registry normative hash algorithm is invalid");
  }
  assertCanonicalSha256(payload, registry.registryContentSha256, sha256Hex, "registryContentSha256");
  assertCanonicalFourChamberNewtonScaleRegistryV1(registry);
  return registry;
}

export function deriveTissueStressScalePa(
  input: TissueStressScaleInputs | undefined,
  wallId = "wall",
): number {
  if (input === undefined) throw new Error(`tissueStressInputsByWall.${wallId} is required`);
  return Math.max(
    requirePositiveFinite(input.landReferenceTensionPa, `${wallId}.landReferenceTensionPa`),
    requirePositiveFinite(input.passiveTensileStressScalePa, `${wallId}.passiveTensileStressScalePa`),
    requirePositiveFinite(input.compressionStressScalePa, `${wallId}.compressionStressScalePa`),
    FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1.tissueStressFloorPa,
  );
}

export function scaleUnknown(value: number, scale: number, offset: number): number {
  const result = (requireFinite(value, "value") - requireFinite(offset, "offset")) /
    requirePositiveFinite(scale, "scale");
  return requireDerivedFinite(result, "scaled unknown");
}

export function unscaleUnknown(scaledValue: number, scale: number, offset: number): number {
  const result = requireFinite(offset, "offset") +
    requireFinite(scaledValue, "scaledValue") * requirePositiveFinite(scale, "scale");
  return requireDerivedFinite(result, "unscaled unknown");
}

export function scaleResidual(residual: number, residualScale: number): number {
  const result = requireFinite(residual, "residual") /
    requirePositiveFinite(residualScale, "residualScale");
  return requireDerivedFinite(result, "scaled residual");
}

export function deriveOdeResidualScalePerSec(stateScale: number): number {
  return requirePositiveFinite(stateScale, "stateScale") /
    FOUR_CHAMBER_NEWTON_SCALE_POLICY_V1.referenceTimeSec;
}

export function scaleJacobianEntry(
  jacobianEntry: number,
  unknownScale: number,
  residualScale: number,
): number {
  const result = requireFinite(jacobianEntry, "jacobianEntry") *
    requirePositiveFinite(unknownScale, "unknownScale") /
    requirePositiveFinite(residualScale, "residualScale");
  return requireDerivedFinite(result, "scaled Jacobian entry");
}

function mapRecord<Key extends string, Value>(
  keys: readonly Key[],
  map: (key: Key) => Value,
): Readonly<Record<Key, Value>> {
  return Object.freeze(Object.fromEntries(keys.map((key) => [key, map(key)]))) as Readonly<Record<Key, Value>>;
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function requireNonEmpty(value: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function requireDerivedFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} became non-finite`);
  return value;
}

function assertExactKeys(value: object, expected: readonly string[], field: string): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error(`${field} must be a plain object`);
  const actual = Reflect.ownKeys(value);
  if (actual.some((key) => typeof key !== "string")) throw new Error(`${field} must not contain symbol keys`);
  const actualStrings = actual as string[];
  for (const key of actualStrings) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !descriptor.enumerable || !("value" in descriptor)) {
      throw new Error(`${field}.${key} must be an enumerable data property`);
    }
  }
  const expectedSet = new Set(expected);
  const unknown = actualStrings.filter((key) => !expectedSet.has(key));
  const missing = expected.filter((key) => !Object.hasOwn(value, key));
  if (unknown.length > 0) throw new Error(`${field} contains unknown fields: ${unknown.join(", ")}`);
  if (missing.length > 0) throw new Error(`${field} is missing fields: ${missing.join(", ")}`);
}

function validatePositiveRecord<Key extends string>(
  record: Readonly<Record<Key, number>>,
  keys: readonly Key[],
  field: string,
): void {
  assertExactKeys(record, keys, field);
  for (const key of keys) requirePositiveFinite(record[key], `${field}.${key}`);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    if (!Object.isFrozen(value)) Object.freeze(value);
  }
  return value;
}
