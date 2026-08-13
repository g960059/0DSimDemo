import {
  NON_CORONARY_INDEPENDENT_NODE_NAMES_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
} from "@/engine/coronary/typesV2";

export const COUPLED_HEMODYNAMICS_LAYOUT_V1_ID =
  "main-wire-coupled-hemodynamics-layout-v1" as const;

export const COUPLED_HEMODYNAMICS_TRISEG_UNKNOWN_IDS_V1 = Object.freeze([
  "TriSeg.septalMidwallCapVolume",
  "TriSeg.junctionRadius",
] as const);

export const COUPLED_HEMODYNAMICS_UNKNOWN_IDS_V1 = Object.freeze([
  ...NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.map(
    (nodeId) => `noncoronary.volume.${nodeId}` as const,
  ),
  ...CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map(
    (nodeId) => `coronary.volume.${nodeId}` as const,
  ),
  ...COUPLED_HEMODYNAMICS_TRISEG_UNKNOWN_IDS_V1,
]);

export type CoupledHemodynamicsUnknownIdV1 =
  (typeof COUPLED_HEMODYNAMICS_UNKNOWN_IDS_V1)[number];

const NON_CORONARY_START = 0;
const CORONARY_START = NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length;
const TRISEG_START = CORONARY_START
  + CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length;

/**
 * Target ordering for the replacement index-1 DAE. Phase 2a initially keeps
 * the two TriSeg rows statically condensed, so its live prefix has 30 rows.
 * Phase 2b activates the full 32-row layout without renumbering either
 * circulation block.
 */
export const COUPLED_HEMODYNAMICS_LAYOUT_V1 = Object.freeze({
  layoutId: COUPLED_HEMODYNAMICS_LAYOUT_V1_ID,
  unknownIds: COUPLED_HEMODYNAMICS_UNKNOWN_IDS_V1,
  totalUnknownCount: COUPLED_HEMODYNAMICS_UNKNOWN_IDS_V1.length,
  phase2aCondensedUnknownCount: TRISEG_START,
  blocks: Object.freeze({
    nonCoronary: Object.freeze({
      start: NON_CORONARY_START,
      length: NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length,
      endExclusive: CORONARY_START,
    }),
    coronary: Object.freeze({
      start: CORONARY_START,
      length: CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length,
      endExclusive: TRISEG_START,
    }),
    triSeg: Object.freeze({
      start: TRISEG_START,
      length: COUPLED_HEMODYNAMICS_TRISEG_UNKNOWN_IDS_V1.length,
      endExclusive: COUPLED_HEMODYNAMICS_UNKNOWN_IDS_V1.length,
    }),
  }),
  dependentBloodVolumeUnknown: "noncoronary.volume.SV" as const,
  dependentBloodVolumeStoredInUnknownVector: false as const,
  linearStorage: "row-major-f64" as const,
});

if (
  COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.nonCoronary.length !== 14
  || COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.coronary.length !== 16
  || COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.triSeg.length !== 2
  || COUPLED_HEMODYNAMICS_LAYOUT_V1.totalUnknownCount !== 32
) {
  throw new Error("coupled hemodynamics V1 layout dimensions changed");
}

export function coupledHemodynamicsUnknownIndexV1(
  unknownId: CoupledHemodynamicsUnknownIdV1,
): number {
  const index = COUPLED_HEMODYNAMICS_UNKNOWN_IDS_V1.indexOf(unknownId);
  if (index < 0) {
    throw new RangeError(`unknown coupled hemodynamics slot ${unknownId}`);
  }
  return index;
}
