export const CORONARY_TERRITORY_IDS_V2 = Object.freeze([
  "LAD",
  "LCx",
  "RCA",
] as const);

export type CoronaryTerritoryIdV2 =
  (typeof CORONARY_TERRITORY_IDS_V2)[number];

export const CORONARY_LAYER_IDS_V2 = Object.freeze([
  "subepicardial",
  "subendocardial",
] as const);

export type CoronaryLayerIdV2 = (typeof CORONARY_LAYER_IDS_V2)[number];

export type CoronaryTerritoryRecordV2<T> = Readonly<
  Record<CoronaryTerritoryIdV2, T>
>;

export type CoronaryLayerRecordV2<T> = Readonly<
  Record<CoronaryLayerIdV2, T>
>;

export type CoronaryTerritoryLayerRecordV2<T> =
  CoronaryTerritoryRecordV2<CoronaryLayerRecordV2<T>>;

export const CORONARY_PERFUSED_WALL_IDS_V2 = Object.freeze([
  "LVFW",
  "SEP",
  "RVFW",
] as const);

export type CoronaryPerfusedWallIdV2 =
  (typeof CORONARY_PERFUSED_WALL_IDS_V2)[number];

export type CoronaryPerfusedWallRecordV2<T> = Readonly<
  Record<CoronaryPerfusedWallIdV2, T>
>;

export const CORONARY_BOUNDARY_NODE_IDS_V2 = Object.freeze([
  "Ao",
  "RA",
] as const);

export type CoronaryBoundaryNodeIdV2 =
  (typeof CORONARY_BOUNDARY_NODE_IDS_V2)[number];

export const CORONARY_CONSERVED_VOLUME_NODE_IDS_V2 = Object.freeze([
  "LAD.Art",
  "LAD.IM.Art.subepicardial",
  "LAD.IM.Ven.subepicardial",
  "LAD.IM.Art.subendocardial",
  "LAD.IM.Ven.subendocardial",
  "LCx.Art",
  "LCx.IM.Art.subepicardial",
  "LCx.IM.Ven.subepicardial",
  "LCx.IM.Art.subendocardial",
  "LCx.IM.Ven.subendocardial",
  "RCA.Art",
  "RCA.IM.Art.subepicardial",
  "RCA.IM.Ven.subepicardial",
  "RCA.IM.Art.subendocardial",
  "RCA.IM.Ven.subendocardial",
  "CV",
] as const);

export type CoronaryConservedVolumeNodeIdV2 =
  (typeof CORONARY_CONSERVED_VOLUME_NODE_IDS_V2)[number];

export type CoronaryHydraulicNodeIdV2 =
  | CoronaryBoundaryNodeIdV2
  | CoronaryConservedVolumeNodeIdV2;

export type CoronaryConservedVolumeRecordV2<T> = Readonly<
  Record<CoronaryConservedVolumeNodeIdV2, T>
>;

export const CORONARY_EDGE_IDS_V2 = Object.freeze([
  "Ao_LAD.Art",
  "LAD.Art_LAD.IM.Art.subepicardial",
  "LAD.IM.Art.subepicardial_LAD.IM.Ven.subepicardial",
  "LAD.IM.Ven.subepicardial_CV",
  "LAD.Art_LAD.IM.Art.subendocardial",
  "LAD.IM.Art.subendocardial_LAD.IM.Ven.subendocardial",
  "LAD.IM.Ven.subendocardial_CV",
  "Ao_LCx.Art",
  "LCx.Art_LCx.IM.Art.subepicardial",
  "LCx.IM.Art.subepicardial_LCx.IM.Ven.subepicardial",
  "LCx.IM.Ven.subepicardial_CV",
  "LCx.Art_LCx.IM.Art.subendocardial",
  "LCx.IM.Art.subendocardial_LCx.IM.Ven.subendocardial",
  "LCx.IM.Ven.subendocardial_CV",
  "Ao_RCA.Art",
  "RCA.Art_RCA.IM.Art.subepicardial",
  "RCA.IM.Art.subepicardial_RCA.IM.Ven.subepicardial",
  "RCA.IM.Ven.subepicardial_CV",
  "RCA.Art_RCA.IM.Art.subendocardial",
  "RCA.IM.Art.subendocardial_RCA.IM.Ven.subendocardial",
  "RCA.IM.Ven.subendocardial_CV",
  "CV_RA",
] as const);

export type CoronaryEdgeIdV2 = (typeof CORONARY_EDGE_IDS_V2)[number];

export type CoronaryToneStateV2 = CoronaryTerritoryLayerRecordV2<number>;
