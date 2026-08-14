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

export type MainWireFiveWallCoupledSolveBlockLayoutV1 = Readonly<{
  blockId: string;
  componentId: string;
  kernelId: string;
  disposition: "retained" | "statically-condensed";
  start: number;
  length: number;
  endExclusive: number;
}>;

export type MainWireFiveWallCoupledSolveLayoutV1 = Readonly<{
  dimension: 30;
  nonCoronary: MainWireFiveWallCoupledSolveBlockLayoutV1;
  coronary: MainWireFiveWallCoupledSolveBlockLayoutV1;
  triSeg: MainWireFiveWallCoupledSolveBlockLayoutV1;
  retainedBlocks: readonly MainWireFiveWallCoupledSolveBlockLayoutV1[];
}>;

type MainWireFiveWallCoupledSolveLayoutInputV1 = Readonly<{
  dimension: number;
  nonCoronary: MainWireFiveWallCoupledSolveBlockLayoutV1;
  coronary: MainWireFiveWallCoupledSolveBlockLayoutV1;
  triSeg: MainWireFiveWallCoupledSolveBlockLayoutV1;
}>;

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

const ADMITTED_MAIN_WIRE_FIVE_WALL_COUPLED_SOLVE_LAYOUTS_V1 =
  new WeakSet<object>();
let canonicalMainWireFiveWallCoupledSolveLayoutV1:
  MainWireFiveWallCoupledSolveLayoutV1 | null = null;

function ownMainWireFiveWallCoupledSolveBlockLayoutV1(
  block: MainWireFiveWallCoupledSolveBlockLayoutV1,
): MainWireFiveWallCoupledSolveBlockLayoutV1 {
  return Object.freeze({
    blockId: block.blockId,
    componentId: block.componentId,
    kernelId: block.kernelId,
    disposition: block.disposition,
    start: block.start,
    length: block.length,
    endExclusive: block.endExclusive,
  });
}

/**
 * Owns the current Main Wire projection of a compiler-derived solve dispatch.
 * Component equations may use the admitted ranges, but cannot renumber them.
 */
export function bindMainWireFiveWallCoupledSolveLayoutV1(
  value: MainWireFiveWallCoupledSolveLayoutInputV1,
): MainWireFiveWallCoupledSolveLayoutV1 {
  const nonCoronaryLength = NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length;
  const coronaryLength = CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length;
  const expected = [
    [
      value.nonCoronary,
      "nonCoronary",
      "noncoronary-circulation",
      "noncoronary-backward-euler-kernel-v1",
      "retained",
      0,
      nonCoronaryLength,
    ],
    [
      value.coronary,
      "coronary",
      "coronary-circulation",
      "coronary-backward-euler-kernel-v2",
      "retained",
      nonCoronaryLength,
      coronaryLength,
    ],
    [
      value.triSeg,
      "triSeg",
      "five-wall-mechanics",
      "five-wall-land-triseg-kernel-v1",
      "statically-condensed",
      nonCoronaryLength + coronaryLength,
      2,
    ],
  ] as const;
  if (value.dimension !== nonCoronaryLength + coronaryLength) {
    throw new RangeError("Main Wire coupled solve layout dimension drifted");
  }
  for (
    const [
      block,
      blockId,
      componentId,
      kernelId,
      disposition,
      start,
      length,
    ] of expected
  ) {
    if (
      block.blockId !== blockId
      || block.componentId !== componentId
      || block.kernelId !== kernelId
      || block.disposition !== disposition
      || block.start !== start
      || block.length !== length
      || block.endExclusive !== start + length
    ) {
      throw new RangeError("Main Wire coupled solve block layout drifted");
    }
  }
  const nonCoronary = ownMainWireFiveWallCoupledSolveBlockLayoutV1(
    value.nonCoronary,
  );
  const coronary = ownMainWireFiveWallCoupledSolveBlockLayoutV1(
    value.coronary,
  );
  const triSeg = ownMainWireFiveWallCoupledSolveBlockLayoutV1(value.triSeg);
  const layout = Object.freeze({
    dimension: 30 as const,
    nonCoronary,
    coronary,
    triSeg,
    retainedBlocks: Object.freeze([nonCoronary, coronary]),
  });
  ADMITTED_MAIN_WIRE_FIVE_WALL_COUPLED_SOLVE_LAYOUTS_V1.add(layout);
  return layout;
}

export function assertMainWireFiveWallCoupledSolveLayoutV1(
  layout: MainWireFiveWallCoupledSolveLayoutV1,
): void {
  if (!ADMITTED_MAIN_WIRE_FIVE_WALL_COUPLED_SOLVE_LAYOUTS_V1.has(layout)) {
    throw new RangeError("Main Wire coupled solve layout is not admitted");
  }
}

export function createCanonicalMainWireFiveWallCoupledSolveLayoutV1():
MainWireFiveWallCoupledSolveLayoutV1 {
  canonicalMainWireFiveWallCoupledSolveLayoutV1 ??=
    bindMainWireFiveWallCoupledSolveLayoutV1({
      dimension: COUPLED_HEMODYNAMICS_LAYOUT_V1.phase2aCondensedUnknownCount,
      nonCoronary: {
        blockId: "nonCoronary",
        componentId: "noncoronary-circulation",
        kernelId: "noncoronary-backward-euler-kernel-v1",
        disposition: "retained",
        ...COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.nonCoronary,
      },
      coronary: {
        blockId: "coronary",
        componentId: "coronary-circulation",
        kernelId: "coronary-backward-euler-kernel-v2",
        disposition: "retained",
        ...COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.coronary,
      },
      triSeg: {
        blockId: "triSeg",
        componentId: "five-wall-mechanics",
        kernelId: "five-wall-land-triseg-kernel-v1",
        disposition: "statically-condensed",
        ...COUPLED_HEMODYNAMICS_LAYOUT_V1.blocks.triSeg,
      },
    });
  return canonicalMainWireFiveWallCoupledSolveLayoutV1;
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
