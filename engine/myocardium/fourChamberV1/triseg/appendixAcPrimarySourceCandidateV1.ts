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
import {
  evaluateTriSegAppendixCAtanhOverArgumentV1,
  evaluateTriSegAppendixCGMinusTwoV1,
} from "@/engine/myocardium/fourChamberV1/triseg/appendixAcStableFunctionsV1";

export {
  evaluateTriSegAppendixCAtanhOverArgumentV1,
  evaluateTriSegAppendixCGMinusTwoV1,
} from "@/engine/myocardium/fourChamberV1/triseg/appendixAcStableFunctionsV1";

export const TRISEG_APPENDIX_AC_PRIMARY_SOURCE_CANDIDATE_V1_ID =
  "lumens-2009-appendix-ac-primary-source-reconstruction-candidate-v1";

export const TRISEG_APPENDIX_AC_PRIMARY_SOURCE_CANDIDATE_V1_STATUS = Object.freeze({
  candidateId: TRISEG_APPENDIX_AC_PRIMARY_SOURCE_CANDIDATE_V1_ID,
  evidenceStatus: "primary-source-reconstruction-only",
  normativeReleaseReference: false,
  sourceDoi: "10.1007/s10439-009-9774-2",
  sourceEquations: Object.freeze(["A4", "A7", "C1-C9"] as const),
  constantOffsetPolicy:
    "remove C5a's first two constant terms, then center both G contributions at G(0)=2 to remove the remaining +1/3 and reproduce C6",
  analyticalDomain: "abs(z) < 1 and abs(x) < 1",
  canonicalReferenceBlockerRetained: false,
  canonicalReferencePromotionId:
    "lumens-2009-appendix-ac-stabilized-analytical-reference-v1",
} as const);

export type TriSegAppendixAcPrimarySourceWallCandidateV1 = Readonly<{
  wallId: PublishedTriSegWallIdV1;
  sourceSphereCurvatureVariableX: number;
  thicknessCurvatureRatioZ: number;
  analyticalFiberLogStrain: number;
  fiberKirchhoffStressPa: number;
  analyticalMidwallTensionNPerM: number;
  axialJunctionTensionNPerM: number;
  radialJunctionTensionNPerM: number;
  transmuralPressurePa: number;
  domainClassification: "within_primary_source_analytical_domain";
}>;

export type TriSegAppendixAcPrimarySourceCandidateV1 = Readonly<{
  candidateId: typeof TRISEG_APPENDIX_AC_PRIMARY_SOURCE_CANDIDATE_V1_ID;
  status: typeof TRISEG_APPENDIX_AC_PRIMARY_SOURCE_CANDIDATE_V1_STATUS;
  geometry: PublishedTriSegGeometryV1;
  walls: Readonly<Record<PublishedTriSegWallIdV1, TriSegAppendixAcPrimarySourceWallCandidateV1>>;
  equilibriumResidual: Readonly<{
    axialNPerM: number;
    radialNPerM: number;
    euclideanNPerM: number;
  }>;
  cavityTransmuralPressuresPa: Readonly<{ LV: number; RV: number }>;
}>;

export function evaluateTriSegAppendixAcPrimarySourceWallCandidateV1(
  geometry: PublishedTriSegWallGeometryV1,
  fiberKirchhoffStressPa: number,
): TriSegAppendixAcPrimarySourceWallCandidateV1 {
  assertPublishedTriSegWallGeometryV1Provenance(geometry);
  assertFinite(`${geometry.wallId}.fiberKirchhoffStressPa`, fiberKirchhoffStressPa);
  const curvature = geometry.signedMidwallCurvaturePerM;
  const sourceSphereCurvatureVariableX = 3
    * curvature
    * curvature
    * curvature
    * geometry.parameters.wallMaterialVolumeM3
    / (8 * Math.PI);
  const z = geometry.thicknessCurvatureRatioZ;
  assertOpenUnitDomain(`${geometry.wallId}.sourceSphereCurvatureVariableX`, sourceSphereCurvatureVariableX);
  assertOpenUnitDomain(`${geometry.wallId}.thicknessCurvatureRatioZ`, z);

  // Appendix C first eliminates C5a's first two constant terms. Centering both
  // remaining G contributions at G(0)=2 then removes the residual +1/3 and
  // gives the verified flat-wall limit 0.5*ln(Am/Amref).
  const analyticalFiberLogStrain = 0.5
    * Math.log(geometry.midwallAreaM2 / geometry.parameters.referenceMidwallAreaM2)
    - evaluateTriSegAppendixCGMinusTwoV1(sourceSphereCurvatureVariableX) / 12
    + evaluateTriSegAppendixCGMinusTwoV1(z) / 4;
  const analyticalMidwallTensionNPerM = geometry.parameters.wallMaterialVolumeM3
    * fiberKirchhoffStressPa
    / (2 * geometry.midwallAreaM2)
    * evaluateTriSegAppendixCAtanhOverArgumentV1(z);
  const heightSquared = geometry.signedCapHeightM * geometry.signedCapHeightM;
  const radiusSquared = geometry.junctionRadiusM * geometry.junctionRadiusM;
  const denominator = heightSquared + radiusSquared;
  const axialJunctionTensionNPerM = analyticalMidwallTensionNPerM
    * 2
    * geometry.signedCapHeightM
    * geometry.junctionRadiusM
    / denominator;
  const radialJunctionTensionNPerM = analyticalMidwallTensionNPerM
    * (-heightSquared + radiusSquared)
    / denominator;
  const transmuralPressurePa = 2 * axialJunctionTensionNPerM / geometry.junctionRadiusM;

  for (const [label, value] of Object.entries({
    sourceSphereCurvatureVariableX,
    analyticalFiberLogStrain,
    analyticalMidwallTensionNPerM,
    axialJunctionTensionNPerM,
    radialJunctionTensionNPerM,
    transmuralPressurePa,
  })) {
    assertFinite(`${geometry.wallId}.${label}`, value);
  }

  return Object.freeze({
    wallId: geometry.wallId,
    sourceSphereCurvatureVariableX,
    thicknessCurvatureRatioZ: z,
    analyticalFiberLogStrain,
    fiberKirchhoffStressPa,
    analyticalMidwallTensionNPerM,
    axialJunctionTensionNPerM,
    radialJunctionTensionNPerM,
    transmuralPressurePa,
    domainClassification: "within_primary_source_analytical_domain",
  });
}

export function evaluateTriSegAppendixAcPrimarySourceCandidateV1(
  geometry: PublishedTriSegGeometryV1,
  fiberKirchhoffStressPa: Readonly<Record<PublishedTriSegWallIdV1, number>>,
): TriSegAppendixAcPrimarySourceCandidateV1 {
  assertPublishedTriSegGeometryV1Provenance(geometry);
  assertExactPlainRecordV1(
    fiberKirchhoffStressPa,
    ["LVFW", "SEP", "RVFW"],
    "fiberKirchhoffStressPa",
  );
  const walls = Object.freeze({
    LVFW: evaluateTriSegAppendixAcPrimarySourceWallCandidateV1(
      geometry.walls.LVFW,
      fiberKirchhoffStressPa.LVFW,
    ),
    SEP: evaluateTriSegAppendixAcPrimarySourceWallCandidateV1(
      geometry.walls.SEP,
      fiberKirchhoffStressPa.SEP,
    ),
    RVFW: evaluateTriSegAppendixAcPrimarySourceWallCandidateV1(
      geometry.walls.RVFW,
      fiberKirchhoffStressPa.RVFW,
    ),
  });
  const axialNPerM = sumWalls(walls, (wall) => wall.axialJunctionTensionNPerM);
  const radialNPerM = sumWalls(walls, (wall) => wall.radialJunctionTensionNPerM);
  const euclideanNPerM = Math.hypot(axialNPerM, radialNPerM);

  return Object.freeze({
    candidateId: TRISEG_APPENDIX_AC_PRIMARY_SOURCE_CANDIDATE_V1_ID,
    status: TRISEG_APPENDIX_AC_PRIMARY_SOURCE_CANDIDATE_V1_STATUS,
    geometry,
    walls,
    equilibriumResidual: Object.freeze({ axialNPerM, radialNPerM, euclideanNPerM }),
    cavityTransmuralPressuresPa: Object.freeze({
      LV: -walls.LVFW.transmuralPressurePa,
      RV: walls.RVFW.transmuralPressurePa,
    }),
  });
}

function sumWalls(
  walls: Readonly<Record<PublishedTriSegWallIdV1, TriSegAppendixAcPrimarySourceWallCandidateV1>>,
  select: (wall: TriSegAppendixAcPrimarySourceWallCandidateV1) => number,
): number {
  return PUBLISHED_TRISEG_WALL_ORDER_V1.reduce((sum, wallId) => sum + select(walls[wallId]), 0);
}

function assertOpenUnitDomain(label: string, value: number): void {
  if (!Number.isFinite(value) || !(Math.abs(value) < 1)) {
    throw new Error(`${label} must satisfy the primary-source analytical domain abs(value) < 1, got ${value}`);
  }
}

function assertFinite(label: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite, got ${value}`);
  }
}
