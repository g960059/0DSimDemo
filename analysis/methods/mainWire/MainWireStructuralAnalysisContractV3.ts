/**
 * Portable analysis identities shared by the exact numerical Worker and its
 * main-thread coordinator. This analysis-owned module contains no numerical
 * implementation so importing an execution plan cannot pull the model into
 * the browser bundle.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID =
  "main-wire-integrated-v3-guyton-starling-structural-orientation-v1" as const;

/**
 * Opt-in, fixed-tone settled preload-reduction pressure-volume family. This
 * identity is kept separate from the responsive structural preview so caches
 * can never satisfy a PVA request with adaptive-preview points.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID =
  "main-wire-integrated-v3-formal-fixed-tbv-pressure-volume-relations-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3 =
  "hypovolemic" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3 =
  "hypervolemic" as const;

export type MainWireIntegratedModelResponsiveStarlingPartitionV3 =
  | typeof MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3
  | typeof MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3;
