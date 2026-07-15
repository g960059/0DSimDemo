import {
  PUBLISHED_TRISEG_WALL_ORDER_V1,
  assertPublishedTriSegGeometryV1Provenance,
  assertPublishedTriSegWallGeometryV1Provenance,
  type PublishedTriSegGeometryV1,
  type PublishedTriSegWallGeometryV1,
  type PublishedTriSegWallIdV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import { evaluateTriSegAppendixCAtanhOverArgumentV1 } from
  "@/engine/myocardium/fourChamberV1/triseg/appendixAcStableFunctionsV1";

export const PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID =
  "lumens-et-al-2009-triseg-fourth-order-taylor-oracle-v1";

export const PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_SOURCE = Object.freeze({
  doi: "10.1007/s10439-009-9774-2",
  equations: Object.freeze([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const),
  commonAxisConvention: "x positive toward RV free wall",
  appendixCAdjustedStrainContext: "abs(z) < 0.8",
} as const);

export const PUBLISHED_TRISEG_TAYLOR_DIAGNOSTIC_ABS_Z_LIMIT_V1 = 0.8;
export const PUBLISHED_TRISEG_TAYLOR_TENSION_RELATIVE_ERROR_LIMIT_V1 = 0.02;
export const PUBLISHED_TRISEG_TAYLOR_ACCEPTANCE_POLICY_V1 = Object.freeze({
  policyId: "triseg-published-taylor-component-acceptance-policy-v1",
  diagnosticAbsoluteZLimit: PUBLISHED_TRISEG_TAYLOR_DIAGNOSTIC_ABS_Z_LIMIT_V1,
  appendixA4TensionRelativeErrorLimit:
    PUBLISHED_TRISEG_TAYLOR_TENSION_RELATIVE_ERROR_LIMIT_V1,
  exactStrainReferenceStatus: "canonical-stabilized-appendix-ac-reference-v1",
} as const);

export type PublishedTriSegTaylorDomainClassificationV1 =
  | "within_2pct_tension_error_domain"
  | "within_0p8_diagnostic_envelope_but_exceeds_2pct_tension_error"
  | "out_of_domain";

export type PublishedTriSegTaylorWallOutputV1 = Readonly<{
  wallId: PublishedTriSegWallIdV1;
  fiberKirchhoffStressPa: number;
  representativeMidwallTensionNPerM: number;
  axialJunctionTensionNPerM: number;
  radialJunctionTensionNPerM: number;
  transmuralPressurePa: number;
  thicknessCurvatureRatioZ: number;
  exactAppendixA4TensionFactor: number | null;
  taylorTensionFactor: number;
  taylorTensionRelativeError: number | null;
}>;

export type PublishedTriSegTaylorOracle2009V1 = Readonly<{
  oracleId: typeof PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID;
  source: typeof PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_SOURCE;
  geometry: PublishedTriSegGeometryV1;
  walls: Readonly<Record<PublishedTriSegWallIdV1, PublishedTriSegTaylorWallOutputV1>>;
  equilibriumResidual: Readonly<{
    axialNPerM: number;
    radialNPerM: number;
    euclideanNPerM: number;
  }>;
  cavityTransmuralPressuresPa: Readonly<{
    LV: number;
    RV: number;
  }>;
  maximumAbsoluteThicknessCurvatureRatioZ: number;
  maximumTaylorTensionRelativeError: number | null;
  domainClassification: PublishedTriSegTaylorDomainClassificationV1;
  /** Necessary tension-error gate only; not strain, root, or equilibrium acceptance. */
  taylorTensionErrorDomainEligible: boolean;
}>;

export function evaluatePublishedTriSegTaylorWallV1(
  geometry: PublishedTriSegWallGeometryV1,
  fiberKirchhoffStressPa: number,
): PublishedTriSegTaylorWallOutputV1 {
  assertPublishedTriSegWallGeometryV1Provenance(geometry);
  assertFinite(`${geometry.wallId}.fiberKirchhoffStressPa`, fiberKirchhoffStressPa);
  const zSquared = geometry.thicknessCurvatureRatioZ * geometry.thicknessCurvatureRatioZ;
  const taylorCorrection = 1 + zSquared / 3 + zSquared * zSquared / 5;
  const exactAppendixA4TensionFactor = Math.abs(geometry.thicknessCurvatureRatioZ) < 1
    ? evaluateTriSegAppendixCAtanhOverArgumentV1(geometry.thicknessCurvatureRatioZ)
    : null;
  const taylorTensionRelativeError = exactAppendixA4TensionFactor === null
    ? null
    : Math.abs(exactAppendixA4TensionFactor - taylorCorrection) / exactAppendixA4TensionFactor;
  const representativeMidwallTensionNPerM = geometry.parameters.wallMaterialVolumeM3
    * fiberKirchhoffStressPa
    / (2 * geometry.midwallAreaM2)
    * taylorCorrection;
  const heightSquared = geometry.signedCapHeightM * geometry.signedCapHeightM;
  const radiusSquared = geometry.junctionRadiusM * geometry.junctionRadiusM;
  const denominator = heightSquared + radiusSquared;
  const axialJunctionTensionNPerM = representativeMidwallTensionNPerM
    * (2 * geometry.signedCapHeightM * geometry.junctionRadiusM / denominator);
  const radialJunctionTensionNPerM = representativeMidwallTensionNPerM
    * ((-heightSquared + radiusSquared) / denominator);
  const transmuralPressurePa = 2 * axialJunctionTensionNPerM / geometry.junctionRadiusM;

  for (const [label, value] of Object.entries({
    representativeMidwallTensionNPerM,
    axialJunctionTensionNPerM,
    radialJunctionTensionNPerM,
    transmuralPressurePa,
  })) {
    assertFinite(`${geometry.wallId}.${label}`, value);
  }
  if (exactAppendixA4TensionFactor !== null) {
    assertFinite(`${geometry.wallId}.exactAppendixA4TensionFactor`, exactAppendixA4TensionFactor);
  }
  if (taylorTensionRelativeError !== null) {
    assertFinite(`${geometry.wallId}.taylorTensionRelativeError`, taylorTensionRelativeError);
  }

  return Object.freeze({
    wallId: geometry.wallId,
    fiberKirchhoffStressPa,
    representativeMidwallTensionNPerM,
    axialJunctionTensionNPerM,
    radialJunctionTensionNPerM,
    transmuralPressurePa,
    thicknessCurvatureRatioZ: geometry.thicknessCurvatureRatioZ,
    exactAppendixA4TensionFactor,
    taylorTensionFactor: taylorCorrection,
    taylorTensionRelativeError,
  });
}

export function classifyPublishedTriSegTaylorDomainV1(
  maximumAbsoluteThicknessCurvatureRatioZ: number,
): PublishedTriSegTaylorDomainClassificationV1 {
  if (!Number.isFinite(maximumAbsoluteThicknessCurvatureRatioZ)
    || maximumAbsoluteThicknessCurvatureRatioZ < 0) {
    throw new Error(
      `maximumAbsoluteThicknessCurvatureRatioZ must be finite and >= 0, got ${maximumAbsoluteThicknessCurvatureRatioZ}`,
    );
  }
  if (maximumAbsoluteThicknessCurvatureRatioZ >= PUBLISHED_TRISEG_TAYLOR_DIAGNOSTIC_ABS_Z_LIMIT_V1) {
    return "out_of_domain";
  }
  const relativeError = taylorTensionRelativeErrorAtAbsZ(maximumAbsoluteThicknessCurvatureRatioZ);
  return relativeError <= PUBLISHED_TRISEG_TAYLOR_TENSION_RELATIVE_ERROR_LIMIT_V1
    ? "within_2pct_tension_error_domain"
    : "within_0p8_diagnostic_envelope_but_exceeds_2pct_tension_error";
}

export function evaluatePublishedTriSegTaylorOracle2009V1(
  geometry: PublishedTriSegGeometryV1,
  fiberKirchhoffStressPa: Readonly<Record<PublishedTriSegWallIdV1, number>>,
): PublishedTriSegTaylorOracle2009V1 {
  assertPublishedTriSegGeometryV1Provenance(geometry);
  assertExactPlainRecordV1(
    fiberKirchhoffStressPa,
    ["LVFW", "SEP", "RVFW"],
    "fiberKirchhoffStressPa",
  );
  const walls = Object.freeze({
    LVFW: evaluatePublishedTriSegTaylorWallV1(geometry.walls.LVFW, fiberKirchhoffStressPa.LVFW),
    SEP: evaluatePublishedTriSegTaylorWallV1(geometry.walls.SEP, fiberKirchhoffStressPa.SEP),
    RVFW: evaluatePublishedTriSegTaylorWallV1(geometry.walls.RVFW, fiberKirchhoffStressPa.RVFW),
  });
  const axialNPerM = sumWalls(walls, (wall) => wall.axialJunctionTensionNPerM);
  const radialNPerM = sumWalls(walls, (wall) => wall.radialJunctionTensionNPerM);
  const euclideanNPerM = Math.hypot(axialNPerM, radialNPerM);
  const maximumAbsoluteThicknessCurvatureRatioZ = Math.max(
    ...PUBLISHED_TRISEG_WALL_ORDER_V1.map((wallId) => Math.abs(walls[wallId].thicknessCurvatureRatioZ)),
  );
  const wallTaylorErrors = PUBLISHED_TRISEG_WALL_ORDER_V1.map(
    (wallId) => walls[wallId].taylorTensionRelativeError,
  );
  const maximumTaylorTensionRelativeError = wallTaylorErrors.some((error) => error === null)
    ? null
    : Math.max(...wallTaylorErrors as number[]);
  const domainClassification = classifyPublishedTriSegTaylorDomainV1(
    maximumAbsoluteThicknessCurvatureRatioZ,
  );

  for (const [label, value] of Object.entries({
    axialNPerM,
    radialNPerM,
    euclideanNPerM,
    maximumAbsoluteThicknessCurvatureRatioZ,
  })) {
    assertFinite(label, value);
  }
  if (maximumTaylorTensionRelativeError !== null) {
    assertFinite("maximumTaylorTensionRelativeError", maximumTaylorTensionRelativeError);
  }

  return Object.freeze({
    oracleId: PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_V1_ID,
    source: PUBLISHED_TRISEG_TAYLOR_ORACLE_2009_SOURCE,
    geometry,
    walls,
    equilibriumResidual: Object.freeze({ axialNPerM, radialNPerM, euclideanNPerM }),
    cavityTransmuralPressuresPa: Object.freeze({
      LV: -walls.LVFW.transmuralPressurePa,
      RV: walls.RVFW.transmuralPressurePa,
    }),
    maximumAbsoluteThicknessCurvatureRatioZ,
    maximumTaylorTensionRelativeError,
    domainClassification,
    taylorTensionErrorDomainEligible: domainClassification === "within_2pct_tension_error_domain",
  });
}

function taylorTensionRelativeErrorAtAbsZ(absoluteZ: number): number {
  const zSquared = absoluteZ * absoluteZ;
  const taylor = 1 + zSquared / 3 + zSquared * zSquared / 5;
  const exact = evaluateTriSegAppendixCAtanhOverArgumentV1(absoluteZ);
  return Math.abs(exact - taylor) / exact;
}

function sumWalls(
  walls: Readonly<Record<PublishedTriSegWallIdV1, PublishedTriSegTaylorWallOutputV1>>,
  select: (wall: PublishedTriSegTaylorWallOutputV1) => number,
): number {
  return PUBLISHED_TRISEG_WALL_ORDER_V1.reduce((sum, wallId) => sum + select(walls[wallId]), 0);
}

function assertFinite(label: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite, got ${value}`);
  }
}
