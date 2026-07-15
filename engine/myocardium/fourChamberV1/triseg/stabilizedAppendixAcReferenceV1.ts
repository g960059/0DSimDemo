import highPrecisionPackJson from
  "@/engine/myocardium/fourChamberV1/triseg/referencePacks/stabilizedAppendixAcHighPrecisionPackV1.json";
import {
  assertCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PUBLISHED_TRISEG_WALL_ORDER_V1,
  assertPublishedTriSegGeometryV1Provenance,
  assertPublishedTriSegWallGeometryV1Provenance,
  type PublishedTriSegGeometryV1,
  type PublishedTriSegWallGeometryV1,
  type PublishedTriSegWallIdV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1,
  evaluateTriSegAppendixCAtanhOverArgumentWithDiagnosticsV1,
  evaluateTriSegAppendixCGMinusTwoWithDiagnosticsV1,
  evaluateTriSegAppendixCZTimesGPrimeWithDiagnosticsV1,
  type TriSegAppendixAcStableFunctionEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/triseg/appendixAcStableFunctionsV1";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_ID =
  "lumens-2009-appendix-ac-stabilized-analytical-reference-v1" as const;
export const STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SCHEMA_ID =
  "stabilized-triseg-appendix-ac-high-precision-pack-v1" as const;
export const STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SHA256 =
  "c2ff9b98ebfc2015a13ccab399f8240790859515f90af061110a0aa69b4c7cee" as const;

export const STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS = Object.freeze({
  referenceId: STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_ID,
  status: "canonical-component-reference",
  normativeWithinOriginalSphericalOneFiberAssumptions: true,
  anatomicalTruthClaimed: false,
  physiologicalValidationClaimed: false,
  triSegRootAcceptanceImplied: false,
  closedLoopReleaseEligible: false,
  sourceDoi: "10.1007/s10439-009-9774-2",
  sourceEquations: Object.freeze(["A4", "A6", "C5a", "C6", "C7"] as const),
  runtimeArithmetic: "IEEE-754-binary64-stabilized-series-and-log1p",
  independentPackArithmetic:
    "python-stdlib-decimal-direct-log-formulas-180-digits-audited-at-240-digits",
  independentPackSha256: STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SHA256,
} as const);

export const STABILIZED_TRISEG_APPENDIX_AC_NORMALIZATION_V1 = Object.freeze({
  policyId: "triseg-appendix-ac-c5a-full-constant-offset-normalization-v1",
  rule:
    "remove the first two constant terms identified in Appendix C5a, then remove the remaining +1/3 by centering both G contributions at G(0)=2",
  flatWallLimit: "0.5*ln(Am/Amref)",
  referenceMidwallAreaSemantics:
    "wall-specific flat-wall zero-strain reference area scale after the declared C5a offset removal; never a chamber-pressure gain",
  fitToSingleClosedLoopAllowed: false,
} as const);

export type StabilizedTriSegAppendixAcHighPrecisionVectorV1 = Readonly<{
  id: string;
  input: Readonly<{
    midwallAreaM2: string;
    referenceMidwallAreaM2: string;
    sourceSphereCurvatureVariableX: string;
    thicknessCurvatureRatioZ: string;
  }>;
  expected: Readonly<{
    gXMinusTwo: string;
    gZMinusTwo: string;
    atanhOverZ: string;
    fiberLogStrain: string;
    strainDerivativeByMidwallAreaAtFixedCurvaturePerM2: string;
    tensionPerWallVolumeStressPerM2: string;
  }>;
}>;

export type StabilizedTriSegAppendixAcHighPrecisionPackV1 = Readonly<{
  schemaId: typeof STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SCHEMA_ID;
  referenceId: typeof STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_ID;
  sourceDoi: "10.1007/s10439-009-9774-2";
  sourceEquations: readonly ["A4", "A6", "C5a", "C6", "C7"];
  normalization: string;
  arithmetic: Readonly<{
    engine: "python-stdlib-decimal-direct-log-formulas";
    precisionDecimalDigits: 180;
    precisionStabilityAuditDecimalDigits: 240;
    serializedSignificantDigits: 80;
    rounding: "ROUND_HALF_EVEN";
    runtimeSeriesImplementationImported: false;
    strainDerivativeEquationPath: "differentiate-normalized-c5a-via-direct-g-prime";
    tensionEquationPath: "appendix-a4-direct-atanh-over-z";
  }>;
  vectors: readonly StabilizedTriSegAppendixAcHighPrecisionVectorV1[];
}>;

export type StabilizedTriSegAppendixAcKernelInputV1 = Readonly<{
  midwallAreaM2: number;
  referenceMidwallAreaM2: number;
  sourceSphereCurvatureVariableX: number;
  thicknessCurvatureRatioZ: number;
}>;

export type StabilizedTriSegAppendixAcKernelV1 = Readonly<{
  referenceId: typeof STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_ID;
  input: StabilizedTriSegAppendixAcKernelInputV1;
  gXMinusTwo: TriSegAppendixAcStableFunctionEvaluationV1;
  gZMinusTwo: TriSegAppendixAcStableFunctionEvaluationV1;
  atanhOverZ: TriSegAppendixAcStableFunctionEvaluationV1;
  fiberLogStrain: number;
  strainDerivativeByMidwallAreaAtFixedCurvaturePerM2: number;
  tensionPerWallVolumeStressPerM2: number;
  appendixA6WorkConjugacyResidualPerM2: number;
}>;

export type StabilizedTriSegAppendixAcWallReferenceV1 = Readonly<{
  wallId: PublishedTriSegWallIdV1;
  kernel: StabilizedTriSegAppendixAcKernelV1;
  fiberKirchhoffStressPa: number;
  analyticalMidwallTensionNPerM: number;
  workConjugateMidwallTensionNPerM: number;
  workConjugacyResidualNPerM: number;
  axialJunctionTensionNPerM: number;
  radialJunctionTensionNPerM: number;
  transmuralPressurePa: number;
  domainClassification: "within_appendix_ac_analytical_domain";
}>;

export type StabilizedTriSegAppendixAcReferenceV1 = Readonly<{
  referenceId: typeof STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_ID;
  status: typeof STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS;
  normalization: typeof STABILIZED_TRISEG_APPENDIX_AC_NORMALIZATION_V1;
  stableFunctionPolicy: typeof TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1;
  highPrecisionPackSha256: typeof STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SHA256;
  geometry: PublishedTriSegGeometryV1;
  walls: Readonly<Record<PublishedTriSegWallIdV1, StabilizedTriSegAppendixAcWallReferenceV1>>;
  equilibriumResidual: Readonly<{
    axialNPerM: number;
    radialNPerM: number;
    euclideanNPerM: number;
  }>;
  cavityTransmuralPressuresPa: Readonly<{ LV: number; RV: number }>;
  closedLoopReleaseEligible: false;
}>;

const HIGH_PRECISION_PACK = deepFreeze(
  highPrecisionPackJson as unknown as StabilizedTriSegAppendixAcHighPrecisionPackV1,
);

export function validateStabilizedTriSegAppendixAcHighPrecisionPackV1(
  sha256Hex: CanonicalSha256HexProvider,
): StabilizedTriSegAppendixAcHighPrecisionPackV1 {
  assertExactPlainRecordV1(HIGH_PRECISION_PACK, [
    "arithmetic",
    "normalization",
    "referenceId",
    "schemaId",
    "sourceDoi",
    "sourceEquations",
    "vectors",
  ], "stabilizedAppendixAcHighPrecisionPack");
  if (
    HIGH_PRECISION_PACK.schemaId !== STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SCHEMA_ID
    || HIGH_PRECISION_PACK.referenceId !== STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_ID
    || HIGH_PRECISION_PACK.sourceDoi !== "10.1007/s10439-009-9774-2"
  ) {
    throw new Error("Stabilized Appendix-A/C high-precision pack identity is invalid");
  }
  assertExactPlainRecordV1(HIGH_PRECISION_PACK.arithmetic, [
    "engine",
    "precisionDecimalDigits",
    "precisionStabilityAuditDecimalDigits",
    "rounding",
    "runtimeSeriesImplementationImported",
    "serializedSignificantDigits",
    "strainDerivativeEquationPath",
    "tensionEquationPath",
  ], "stabilizedAppendixAcHighPrecisionPack.arithmetic");
  if (
    HIGH_PRECISION_PACK.arithmetic.engine !== "python-stdlib-decimal-direct-log-formulas"
    || HIGH_PRECISION_PACK.arithmetic.precisionDecimalDigits !== 180
    || HIGH_PRECISION_PACK.arithmetic.precisionStabilityAuditDecimalDigits !== 240
    || HIGH_PRECISION_PACK.arithmetic.serializedSignificantDigits !== 80
    || HIGH_PRECISION_PACK.arithmetic.rounding !== "ROUND_HALF_EVEN"
    || HIGH_PRECISION_PACK.arithmetic.runtimeSeriesImplementationImported !== false
    || HIGH_PRECISION_PACK.arithmetic.strainDerivativeEquationPath
      !== "differentiate-normalized-c5a-via-direct-g-prime"
    || HIGH_PRECISION_PACK.arithmetic.tensionEquationPath
      !== "appendix-a4-direct-atanh-over-z"
  ) {
    throw new Error("Stabilized Appendix-A/C pack lost its independent arithmetic contract");
  }
  const expectedIds = [
    "flat-reference",
    "flat-area-only",
    "near-zero-positive",
    "near-zero-negative",
    "series-switch-below",
    "series-switch-above",
    "moderate-positive",
    "moderate-negative",
    "distinct-x-z",
    "diagnostic-envelope-edge",
    "analytical-domain-edge",
  ];
  if (
    HIGH_PRECISION_PACK.vectors.length !== expectedIds.length
    || HIGH_PRECISION_PACK.vectors.some((vector, index) => vector.id !== expectedIds[index])
  ) {
    throw new Error("Stabilized Appendix-A/C pack vector inventory or order changed");
  }
  for (const vector of HIGH_PRECISION_PACK.vectors) validateHighPrecisionVector(vector);
  assertCanonicalSha256(
    HIGH_PRECISION_PACK,
    STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SHA256,
    sha256Hex,
    "highPrecisionPackSha256",
  );
  return HIGH_PRECISION_PACK;
}

export function evaluateStabilizedTriSegAppendixAcKernelV1(
  input: StabilizedTriSegAppendixAcKernelInputV1,
): StabilizedTriSegAppendixAcKernelV1 {
  assertExactPlainRecordV1(input, [
    "midwallAreaM2",
    "referenceMidwallAreaM2",
    "sourceSphereCurvatureVariableX",
    "thicknessCurvatureRatioZ",
  ], "stabilizedAppendixAcKernelInput");
  assertPositiveFinite("midwallAreaM2", input.midwallAreaM2);
  assertPositiveFinite("referenceMidwallAreaM2", input.referenceMidwallAreaM2);
  assertSignedCurvaturePair(
    input.sourceSphereCurvatureVariableX,
    input.thicknessCurvatureRatioZ,
  );
  const gXMinusTwo = evaluateTriSegAppendixCGMinusTwoWithDiagnosticsV1(
    input.sourceSphereCurvatureVariableX,
  );
  const gZMinusTwo = evaluateTriSegAppendixCGMinusTwoWithDiagnosticsV1(
    input.thicknessCurvatureRatioZ,
  );
  const atanhOverZ = evaluateTriSegAppendixCAtanhOverArgumentWithDiagnosticsV1(
    input.thicknessCurvatureRatioZ,
  );
  const zTimesGPrime = evaluateTriSegAppendixCZTimesGPrimeWithDiagnosticsV1(
    input.thicknessCurvatureRatioZ,
  );
  const fiberLogStrain = 0.5 * Math.log(input.midwallAreaM2 / input.referenceMidwallAreaM2)
    - gXMinusTwo.value / 12
    + gZMinusTwo.value / 4;
  const strainDerivativeByMidwallAreaAtFixedCurvaturePerM2 = 1
    / (2 * input.midwallAreaM2)
    - zTimesGPrime.value / (4 * input.midwallAreaM2);
  const tensionPerWallVolumeStressPerM2 = atanhOverZ.value / (2 * input.midwallAreaM2);
  const appendixA6WorkConjugacyResidualPerM2 = tensionPerWallVolumeStressPerM2
    - strainDerivativeByMidwallAreaAtFixedCurvaturePerM2;
  for (const [label, value] of Object.entries({
    fiberLogStrain,
    strainDerivativeByMidwallAreaAtFixedCurvaturePerM2,
    tensionPerWallVolumeStressPerM2,
    appendixA6WorkConjugacyResidualPerM2,
  })) assertFinite(label, value);
  assertPositiveFinite(
    "strainDerivativeByMidwallAreaAtFixedCurvaturePerM2",
    strainDerivativeByMidwallAreaAtFixedCurvaturePerM2,
  );
  return Object.freeze({
    referenceId: STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_ID,
    input: Object.freeze({ ...input }),
    gXMinusTwo,
    gZMinusTwo,
    atanhOverZ,
    fiberLogStrain,
    strainDerivativeByMidwallAreaAtFixedCurvaturePerM2,
    tensionPerWallVolumeStressPerM2,
    appendixA6WorkConjugacyResidualPerM2,
  });
}

export function evaluateStabilizedTriSegAppendixAcWallReferenceV1(
  geometry: PublishedTriSegWallGeometryV1,
  fiberKirchhoffStressPa: number,
): StabilizedTriSegAppendixAcWallReferenceV1 {
  assertPublishedTriSegWallGeometryV1Provenance(geometry);
  assertFinite(`${geometry.wallId}.fiberKirchhoffStressPa`, fiberKirchhoffStressPa);
  const curvature = geometry.signedMidwallCurvaturePerM;
  const sourceSphereCurvatureVariableX = 3
    * curvature * curvature * curvature
    * geometry.parameters.wallMaterialVolumeM3
    / (8 * Math.PI);
  const kernel = evaluateStabilizedTriSegAppendixAcKernelV1({
    midwallAreaM2: geometry.midwallAreaM2,
    referenceMidwallAreaM2: geometry.parameters.referenceMidwallAreaM2,
    sourceSphereCurvatureVariableX,
    thicknessCurvatureRatioZ: geometry.thicknessCurvatureRatioZ,
  });
  const wallVolumeStressN = geometry.parameters.wallMaterialVolumeM3 * fiberKirchhoffStressPa;
  const analyticalMidwallTensionNPerM = wallVolumeStressN
    * kernel.tensionPerWallVolumeStressPerM2;
  const workConjugateMidwallTensionNPerM = wallVolumeStressN
    * kernel.strainDerivativeByMidwallAreaAtFixedCurvaturePerM2;
  const workConjugacyResidualNPerM = analyticalMidwallTensionNPerM
    - workConjugateMidwallTensionNPerM;
  const heightSquared = geometry.signedCapHeightM * geometry.signedCapHeightM;
  const radiusSquared = geometry.junctionRadiusM * geometry.junctionRadiusM;
  const denominator = heightSquared + radiusSquared;
  const axialJunctionTensionNPerM = analyticalMidwallTensionNPerM
    * 2 * geometry.signedCapHeightM * geometry.junctionRadiusM / denominator;
  const radialJunctionTensionNPerM = analyticalMidwallTensionNPerM
    * (-heightSquared + radiusSquared) / denominator;
  const transmuralPressurePa = 2 * axialJunctionTensionNPerM / geometry.junctionRadiusM;
  for (const [label, value] of Object.entries({
    analyticalMidwallTensionNPerM,
    workConjugateMidwallTensionNPerM,
    workConjugacyResidualNPerM,
    axialJunctionTensionNPerM,
    radialJunctionTensionNPerM,
    transmuralPressurePa,
  })) assertFinite(`${geometry.wallId}.${label}`, value);
  return Object.freeze({
    wallId: geometry.wallId,
    kernel,
    fiberKirchhoffStressPa,
    analyticalMidwallTensionNPerM,
    workConjugateMidwallTensionNPerM,
    workConjugacyResidualNPerM,
    axialJunctionTensionNPerM,
    radialJunctionTensionNPerM,
    transmuralPressurePa,
    domainClassification: "within_appendix_ac_analytical_domain",
  });
}

export function evaluateStabilizedTriSegAppendixAcReferenceV1(
  geometry: PublishedTriSegGeometryV1,
  fiberKirchhoffStressPa: Readonly<Record<PublishedTriSegWallIdV1, number>>,
): StabilizedTriSegAppendixAcReferenceV1 {
  assertPublishedTriSegGeometryV1Provenance(geometry);
  assertExactPlainRecordV1(
    fiberKirchhoffStressPa,
    ["LVFW", "SEP", "RVFW"],
    "fiberKirchhoffStressPa",
  );
  const walls = Object.freeze({
    LVFW: evaluateStabilizedTriSegAppendixAcWallReferenceV1(
      geometry.walls.LVFW,
      fiberKirchhoffStressPa.LVFW,
    ),
    SEP: evaluateStabilizedTriSegAppendixAcWallReferenceV1(
      geometry.walls.SEP,
      fiberKirchhoffStressPa.SEP,
    ),
    RVFW: evaluateStabilizedTriSegAppendixAcWallReferenceV1(
      geometry.walls.RVFW,
      fiberKirchhoffStressPa.RVFW,
    ),
  });
  const axialNPerM = sumWalls(walls, (wall) => wall.axialJunctionTensionNPerM);
  const radialNPerM = sumWalls(walls, (wall) => wall.radialJunctionTensionNPerM);
  const euclideanNPerM = Math.hypot(axialNPerM, radialNPerM);
  return Object.freeze({
    referenceId: STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_ID,
    status: STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS,
    normalization: STABILIZED_TRISEG_APPENDIX_AC_NORMALIZATION_V1,
    stableFunctionPolicy: TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1,
    highPrecisionPackSha256: STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SHA256,
    geometry,
    walls,
    equilibriumResidual: Object.freeze({ axialNPerM, radialNPerM, euclideanNPerM }),
    cavityTransmuralPressuresPa: Object.freeze({
      LV: -walls.LVFW.transmuralPressurePa,
      RV: walls.RVFW.transmuralPressurePa,
    }),
    closedLoopReleaseEligible: false,
  });
}

function validateHighPrecisionVector(
  vector: StabilizedTriSegAppendixAcHighPrecisionVectorV1,
): void {
  assertExactPlainRecordV1(vector, ["expected", "id", "input"], `highPrecisionVector.${vector.id}`);
  assertExactPlainRecordV1(vector.input, [
    "midwallAreaM2",
    "referenceMidwallAreaM2",
    "sourceSphereCurvatureVariableX",
    "thicknessCurvatureRatioZ",
  ], `highPrecisionVector.${vector.id}.input`);
  assertExactPlainRecordV1(vector.expected, [
    "atanhOverZ",
    "fiberLogStrain",
    "gXMinusTwo",
    "gZMinusTwo",
    "strainDerivativeByMidwallAreaAtFixedCurvaturePerM2",
    "tensionPerWallVolumeStressPerM2",
  ], `highPrecisionVector.${vector.id}.expected`);
  const area = parseDecimalString(vector.input.midwallAreaM2, `${vector.id}.midwallAreaM2`);
  const referenceArea = parseDecimalString(
    vector.input.referenceMidwallAreaM2,
    `${vector.id}.referenceMidwallAreaM2`,
  );
  assertPositiveFinite(`${vector.id}.midwallAreaM2`, area);
  assertPositiveFinite(`${vector.id}.referenceMidwallAreaM2`, referenceArea);
  const x = parseDecimalString(
    vector.input.sourceSphereCurvatureVariableX,
    `${vector.id}.sourceSphereCurvatureVariableX`,
  );
  const z = parseDecimalString(
    vector.input.thicknessCurvatureRatioZ,
    `${vector.id}.thicknessCurvatureRatioZ`,
  );
  assertSignedCurvaturePair(x, z);
  const parsedExpected = Object.fromEntries(
    Object.entries(vector.expected).map(([field, value]) => [
      field,
      parseDecimalString(value, `${vector.id}.expected.${field}`),
    ]),
  );
  const strainDerivative = parsedExpected.strainDerivativeByMidwallAreaAtFixedCurvaturePerM2;
  const tensionFactor = parsedExpected.tensionPerWallVolumeStressPerM2;
  if (relativeDifference(strainDerivative, tensionFactor) > 2e-15) {
    throw new Error(`${vector.id} violates the frozen Appendix-A6/A4 work-conjugacy identity`);
  }
}

function assertSignedCurvaturePair(x: number, z: number): void {
  if (!Number.isFinite(x) || !(Math.abs(x) < 1) || !Number.isFinite(z) || !(Math.abs(z) < 1)) {
    throw new Error(`Appendix-A/C analytical domain requires abs(x)<1 and abs(z)<1, got x=${x}, z=${z}`);
  }
  if ((x === 0) !== (z === 0) || (x !== 0 && Math.sign(x) !== Math.sign(z))) {
    throw new Error(`Appendix-A/C x and z must represent one signed-curvature branch, got x=${x}, z=${z}`);
  }
}

function parseDecimalString(value: string, field: string): number {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    throw new Error(`${field} must be a canonical non-empty decimal string`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must parse to a finite number`);
  return parsed;
}

function relativeDifference(left: number, right: number): number {
  return Math.abs(left - right) / Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

function sumWalls(
  walls: Readonly<Record<PublishedTriSegWallIdV1, StabilizedTriSegAppendixAcWallReferenceV1>>,
  select: (wall: StabilizedTriSegAppendixAcWallReferenceV1) => number,
): number {
  return PUBLISHED_TRISEG_WALL_ORDER_V1.reduce((sum, wallId) => sum + select(walls[wallId]), 0);
}

function assertFinite(label: string, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite, got ${value}`);
}

function assertPositiveFinite(label: string, value: number): void {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and > 0, got ${value}`);
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
