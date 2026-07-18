export const CORONARY_TERRITORY_IDS_V1 = Object.freeze([
  "LAD",
  "LCx",
  "RCA",
] as const);

export type CoronaryTerritoryIdV1 =
  (typeof CORONARY_TERRITORY_IDS_V1)[number];

export const CORONARY_LAYER_IDS_V1 = Object.freeze([
  "subepicardial",
  "subendocardial",
] as const);

export type CoronaryLayerIdV1 = (typeof CORONARY_LAYER_IDS_V1)[number];

export const CORONARY_PERFUSED_WALL_IDS_V1 = Object.freeze([
  "LVFW",
  "SEP",
  "RVFW",
] as const);

export type CoronaryPerfusedWallIdV1 =
  (typeof CORONARY_PERFUSED_WALL_IDS_V1)[number];

export type CoronaryTerritoryRecordV1<T> = Readonly<
  Record<CoronaryTerritoryIdV1, T>
>;

export type CoronaryLayerRecordV1<T> = Readonly<
  Record<CoronaryLayerIdV1, T>
>;

export type CoronaryPerfusedWallRecordV1<T> = Readonly<
  Record<CoronaryPerfusedWallIdV1, T>
>;

export type CoronaryTerritoryLayerRecordV1<T> = CoronaryTerritoryRecordV1<
  CoronaryLayerRecordV1<T>
>;
