import {
  invertSignedSphericalCapVolumeV1,
  type SignedSphericalCapInverseV1,
} from "@/engine/myocardium/fourChamberV1/triseg/signedSphericalCapV1";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PUBLISHED_TRISEG_WALL_ORDER_V1 = Object.freeze(["LVFW", "SEP", "RVFW"] as const);
export type PublishedTriSegWallIdV1 = (typeof PUBLISHED_TRISEG_WALL_ORDER_V1)[number];

const publishedTriSegWallGeometryRegistryV1 = new WeakSet<object>();
const publishedTriSegGeometryRegistryV1 = new WeakSet<object>();

export type PublishedTriSegWallGeometryParametersV1 = Readonly<{
  wallMaterialVolumeM3: number;
  referenceMidwallAreaM2: number;
}>;

export type PublishedTriSegWallGeometryV1 = Readonly<{
  wallId: PublishedTriSegWallIdV1;
  signedMidwallCapVolumeM3: number;
  junctionRadiusM: number;
  signedCapHeightM: number;
  midwallAreaM2: number;
  signedMidwallCurvaturePerM: number;
  thicknessCurvatureRatioZ: number;
  fiberLogStrain: number;
  geometryStretch: number;
  capInverse: SignedSphericalCapInverseV1;
  parameters: PublishedTriSegWallGeometryParametersV1;
}>;

export type PublishedTriSegGeometryInputV1 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  septalMidwallCapVolumeM3: number;
  junctionRadiusM: number;
  walls: Readonly<Record<PublishedTriSegWallIdV1, PublishedTriSegWallGeometryParametersV1>>;
}>;

export type PublishedTriSegGeometryV1 = Readonly<{
  conventionId: "lumens-2009-common-x-positive-toward-rv-v1";
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  septalMidwallCapVolumeM3: number;
  junctionRadiusM: number;
  walls: Readonly<Record<PublishedTriSegWallIdV1, PublishedTriSegWallGeometryV1>>;
}>;

export function derivePublishedTriSegMidwallCapVolumesV1(
  input: PublishedTriSegGeometryInputV1,
): Readonly<Record<PublishedTriSegWallIdV1, number>> {
  assertPublishedTriSegGeometryInputShape(input);
  assertNonNegativeFinite("leftVentricularCavityVolumeM3", input.leftVentricularCavityVolumeM3);
  assertNonNegativeFinite("rightVentricularCavityVolumeM3", input.rightVentricularCavityVolumeM3);
  assertFinite("septalMidwallCapVolumeM3", input.septalMidwallCapVolumeM3);

  const left = input.walls.LVFW.wallMaterialVolumeM3;
  const septum = input.walls.SEP.wallMaterialVolumeM3;
  const right = input.walls.RVFW.wallMaterialVolumeM3;
  for (const [wallId, wall] of Object.entries(input.walls)) {
    assertPositiveFinite(`${wallId}.wallMaterialVolumeM3`, wall.wallMaterialVolumeM3);
    assertPositiveFinite(`${wallId}.referenceMidwallAreaM2`, wall.referenceMidwallAreaM2);
  }

  const volumes = {
    LVFW: -input.leftVentricularCavityVolumeM3
      - 0.5 * left
      - 0.5 * septum
      + input.septalMidwallCapVolumeM3,
    SEP: input.septalMidwallCapVolumeM3,
    RVFW: input.rightVentricularCavityVolumeM3
      + 0.5 * right
      + 0.5 * septum
      + input.septalMidwallCapVolumeM3,
  } as const;
  for (const [wallId, volume] of Object.entries(volumes)) {
    assertFinite(`${wallId} signed midwall cap volume`, volume);
  }
  return Object.freeze(volumes);
}

export function evaluatePublishedTriSegWallGeometryV1(
  wallId: PublishedTriSegWallIdV1,
  signedMidwallCapVolumeM3: number,
  junctionRadiusM: number,
  parameters: PublishedTriSegWallGeometryParametersV1,
): PublishedTriSegWallGeometryV1 {
  if (!PUBLISHED_TRISEG_WALL_ORDER_V1.includes(wallId)) {
    throw new Error(`wallId must use the published TriSeg wall order, got ${wallId}`);
  }
  assertFinite("signedMidwallCapVolumeM3", signedMidwallCapVolumeM3);
  assertPositiveFinite("junctionRadiusM", junctionRadiusM);
  assertWallGeometryParametersShape(parameters, "parameters");
  assertPositiveFinite("wallMaterialVolumeM3", parameters.wallMaterialVolumeM3);
  assertPositiveFinite("referenceMidwallAreaM2", parameters.referenceMidwallAreaM2);

  const capInverse = invertSignedSphericalCapVolumeV1(signedMidwallCapVolumeM3, junctionRadiusM);
  const radiusM = Math.hypot(capInverse.signedCapHeightM, junctionRadiusM);
  const radiusSquaredM2 = radiusM * radiusM;
  const midwallAreaM2 = Math.PI * radiusSquaredM2;
  const signedMidwallCurvaturePerM = 2 * (capInverse.signedCapHeightM / radiusM) / radiusM;
  const thicknessCurvatureRatioZ = 1.5
    * signedMidwallCurvaturePerM
    * (parameters.wallMaterialVolumeM3 / midwallAreaM2);
  const zSquared = thicknessCurvatureRatioZ * thicknessCurvatureRatioZ;
  const fiberLogStrain = 0.5 * Math.log(midwallAreaM2 / parameters.referenceMidwallAreaM2)
    - zSquared / 12
    - 0.019 * zSquared * zSquared;
  const geometryStretch = Math.exp(fiberLogStrain);

  for (const [label, value] of Object.entries({
    radiusSquaredM2,
    midwallAreaM2,
    signedMidwallCurvaturePerM,
    thicknessCurvatureRatioZ,
    fiberLogStrain,
    geometryStretch,
  })) {
    assertFinite(label, value);
  }
  assertPositiveFinite("midwallAreaM2", midwallAreaM2);
  assertPositiveFinite("geometryStretch", geometryStretch);

  const result: PublishedTriSegWallGeometryV1 = Object.freeze({
    wallId,
    signedMidwallCapVolumeM3,
    junctionRadiusM,
    signedCapHeightM: capInverse.signedCapHeightM,
    midwallAreaM2,
    signedMidwallCurvaturePerM,
    thicknessCurvatureRatioZ,
    fiberLogStrain,
    geometryStretch,
    capInverse,
    parameters: Object.freeze({ ...parameters }),
  });
  publishedTriSegWallGeometryRegistryV1.add(result);
  return result;
}

export function evaluatePublishedTriSegGeometryV1(
  input: PublishedTriSegGeometryInputV1,
): PublishedTriSegGeometryV1 {
  const volumes = derivePublishedTriSegMidwallCapVolumesV1(input);
  assertPositiveFinite("junctionRadiusM", input.junctionRadiusM);
  const walls = Object.freeze({
    LVFW: evaluatePublishedTriSegWallGeometryV1(
      "LVFW",
      volumes.LVFW,
      input.junctionRadiusM,
      input.walls.LVFW,
    ),
    SEP: evaluatePublishedTriSegWallGeometryV1(
      "SEP",
      volumes.SEP,
      input.junctionRadiusM,
      input.walls.SEP,
    ),
    RVFW: evaluatePublishedTriSegWallGeometryV1(
      "RVFW",
      volumes.RVFW,
      input.junctionRadiusM,
      input.walls.RVFW,
    ),
  });

  const result: PublishedTriSegGeometryV1 = Object.freeze({
    conventionId: "lumens-2009-common-x-positive-toward-rv-v1",
    leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
    septalMidwallCapVolumeM3: input.septalMidwallCapVolumeM3,
    junctionRadiusM: input.junctionRadiusM,
    walls,
  });
  publishedTriSegGeometryRegistryV1.add(result);
  return result;
}

function assertPublishedTriSegGeometryInputShape(input: PublishedTriSegGeometryInputV1): void {
  assertExactPlainRecordV1(input, [
    "leftVentricularCavityVolumeM3",
    "rightVentricularCavityVolumeM3",
    "septalMidwallCapVolumeM3",
    "junctionRadiusM",
    "walls",
  ], "input");
  assertExactPlainRecordV1(input.walls, ["LVFW", "SEP", "RVFW"], "input.walls");
  for (const wallId of PUBLISHED_TRISEG_WALL_ORDER_V1) {
    assertWallGeometryParametersShape(input.walls[wallId], `input.walls.${wallId}`);
  }
}

function assertWallGeometryParametersShape(
  parameters: PublishedTriSegWallGeometryParametersV1,
  field: string,
): void {
  assertExactPlainRecordV1(
    parameters,
    ["wallMaterialVolumeM3", "referenceMidwallAreaM2"],
    field,
  );
}

export function assertPublishedTriSegWallGeometryV1Provenance(
  geometry: PublishedTriSegWallGeometryV1,
): void {
  if (!publishedTriSegWallGeometryRegistryV1.has(geometry)) {
    throw new Error("TriSeg wall geometry must be produced by evaluatePublishedTriSegWallGeometryV1");
  }
}

export function assertPublishedTriSegGeometryV1Provenance(
  geometry: PublishedTriSegGeometryV1,
): void {
  if (!publishedTriSegGeometryRegistryV1.has(geometry)) {
    throw new Error("TriSeg geometry must be produced by evaluatePublishedTriSegGeometryV1");
  }
  for (const wallId of PUBLISHED_TRISEG_WALL_ORDER_V1) {
    assertPublishedTriSegWallGeometryV1Provenance(geometry.walls[wallId]);
  }
}

function assertFinite(label: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite, got ${value}`);
  }
}

function assertPositiveFinite(label: string, value: number): void {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and > 0, got ${value}`);
  }
}

function assertNonNegativeFinite(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and >= 0, got ${value}`);
  }
}
