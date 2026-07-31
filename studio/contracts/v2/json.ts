/**
 * Portable JSON values used by Studio V2 control-plane contracts.
 *
 * Model-specific fixtures and checkpoints remain opaque to Studio. Adapters
 * validate their model-owned schema before values cross this boundary.
 */
export type StudioJsonPrimitiveV2 = null | boolean | number | string;
export type StudioJsonArrayV2 = readonly StudioJsonValueV2[];
export type StudioJsonObjectV2 = Readonly<{
  [key: string]: StudioJsonValueV2;
}>;
export type StudioJsonValueV2 =
  | StudioJsonPrimitiveV2
  | StudioJsonArrayV2
  | StudioJsonObjectV2;
