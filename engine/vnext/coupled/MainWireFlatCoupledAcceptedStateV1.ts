import {
  NON_CORONARY_INDEPENDENT_NODE_NAMES_V1,
  NON_CORONARY_NODE_NAMES_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
} from "@/engine/coronary/typesV2";
import type {
  MainWireFiveWallCoronaryAcceptedStateV2,
  MainWireFiveWallCoupledResidualContextV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";

export const MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_ID =
  "main-wire-flat-coupled-accepted-state-v1" as const;

const ACCEPTED_TIME_SLOT = 0;
const REVISION_SLOT = 1;
const FIXED_TBV_SLOT = 2;
const NON_CORONARY_START = 3;
const CORONARY_START = NON_CORONARY_START
  + NON_CORONARY_NODE_NAMES_V1.length;

export const MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_SLOT_COUNT =
  (CORONARY_START + CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length) as 34;

const SV_NODE_INDEX = NON_CORONARY_NODE_NAMES_V1.indexOf("SV");
const INDEPENDENT_NODE_INDEXES = Object.freeze(
  NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.map((nodeId) => {
    const index = NON_CORONARY_NODE_NAMES_V1.indexOf(nodeId);
    if (index < 0) throw new Error(`unknown non-coronary node ${nodeId}`);
    return index;
  }),
);

if (
  SV_NODE_INDEX < 0
  || NON_CORONARY_NODE_NAMES_V1.length !== 15
  || NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length !== 14
  || CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length !== 16
  || MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_SLOT_COUNT !== 34
) {
  throw new Error("flat coupled accepted-state V1 layout dimensions changed");
}

export type MainWireFlatCoupledAcceptedStateSnapshotV1 = Readonly<{
  acceptedTimeSec: number;
  revision: number;
  fixedGlobalTotalBloodVolumeMl: number;
  nonCoronaryNodeVolumesMl: Float64Array;
  coronaryConservedVolumesMl: Float64Array;
}>;

export type MainWireFlatCoupledAcceptedStateReportV1 = Readonly<{
  authorityId: typeof MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_ID;
  fixedBufferCount: 2;
  slotCount: 34;
  byteLengthPerBuffer: number;
  activeBufferIndex: 0 | 1;
  commitCount: number;
  staged: boolean;
}>;

/**
 * First model-specific accepted authority for the replacement hemodynamic
 * solve. Its complete mutable state is two fixed 34-f64 images: clock,
 * revision, fixed TBV, 15 non-coronary volumes, and 16 coronary volumes.
 *
 * The public object transaction is deliberately absent. A candidate becomes
 * active only after the exact component convergence gates accept the supplied
 * 30-row root; promotion is one buffer-index swap. Rejected candidates never
 * mutate accepted bytes. Mechanics, rhythm, devices, and slow controls are
 * not claimed by this V1 owner and must remain outside it until their own flat
 * layouts and admission laws exist.
 */
export class MainWireFlatCoupledAcceptedStateV1<TWallState> {
  readonly authorityId = MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_ID;

  readonly #buffers: readonly [Float64Array, Float64Array];
  readonly #residualScratch = new Float64Array(30);
  #activeIndex: 0 | 1 = 0;
  #staged = false;
  #commitCount = 0;

  constructor(
    initial: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
  ) {
    const first = new Float64Array(
      MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_SLOT_COUNT,
    );
    const second = new Float64Array(
      MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_SLOT_COUNT,
    );
    this.#buffers = Object.freeze([first, second]);
    writeAcceptedObjectIntoImage(initial, first);
    second.set(first);
    assertImage(first);
  }

  /** Copies the active 30 independent unknowns into caller-owned scratch. */
  readCurrentUnknownsInto(destination: Float64Array): void {
    assertUnknownVector(destination);
    const current = this.currentImage();
    for (let index = 0; index < INDEPENDENT_NODE_INDEXES.length; index += 1) {
      destination[index] = current[
        NON_CORONARY_START + INDEPENDENT_NODE_INDEXES[index]!
      ]!;
    }
    destination.set(
      current.subarray(
        CORONARY_START,
        CORONARY_START + CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length,
      ),
      NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length,
    );
  }

  /**
   * Stages one solver root after re-running the model-owned component gates.
   * The context must have been prepared from this exact accepted clock/TBV.
   */
  stageConvergedSolution(
    context: MainWireFiveWallCoupledResidualContextV1<TWallState>,
    solution: Float64Array,
  ): void {
    if (this.#staged) {
      throw new Error("flat coupled accepted state already has a candidate");
    }
    assertUnknownVector(solution);
    const current = this.currentImage();
    if (
      context.baseRevision !== current[REVISION_SLOT]
      || !Object.is(
        context.baseAcceptedTimeSec,
        current[ACCEPTED_TIME_SLOT],
      )
      || !Object.is(
        context.fixedGlobalTotalBloodVolumeMl,
        current[FIXED_TBV_SLOT],
      )
    ) {
      throw new Error(
        "flat coupled candidate context differs from accepted authority",
      );
    }
    for (let index = 0; index < solution.length; index += 1) {
      const value = solution[index]!;
      if (
        !Number.isFinite(value)
        || value < context.lowerBoundsMl[index]!
        || value > context.upperBoundsMl[index]!
      ) {
        throw new RangeError(
          `flat coupled candidate ${index} is outside its admitted domain`,
        );
      }
    }
    if (!context.isResidualConverged(solution, this.#residualScratch)) {
      throw new Error("flat coupled candidate failed component convergence");
    }
    const dependentSvVolumeMl = current[FIXED_TBV_SLOT]! - sum(solution);
    if (!(dependentSvVolumeMl > context.minimumDependentSvVolumeMl)) {
      throw new Error("flat coupled candidate leaves no dependent SV volume");
    }
    const nextRevision = context.baseRevision + 1;
    const nextAcceptedTimeSec = context.baseAcceptedTimeSec + context.stepDtSec;
    if (
      !Number.isSafeInteger(nextRevision)
      || !Number.isFinite(nextAcceptedTimeSec)
      || !(nextAcceptedTimeSec > context.baseAcceptedTimeSec)
    ) {
      throw new Error("flat coupled candidate clock cannot advance exactly");
    }

    const destination = this.inactiveImage();
    destination[ACCEPTED_TIME_SLOT] = nextAcceptedTimeSec;
    destination[REVISION_SLOT] = nextRevision;
    destination[FIXED_TBV_SLOT] = current[FIXED_TBV_SLOT]!;
    for (let index = 0; index < INDEPENDENT_NODE_INDEXES.length; index += 1) {
      destination[
        NON_CORONARY_START + INDEPENDENT_NODE_INDEXES[index]!
      ] = solution[index]!;
    }
    destination[NON_CORONARY_START + SV_NODE_INDEX] = dependentSvVolumeMl;
    destination.set(
      solution.subarray(NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length),
      CORONARY_START,
    );
    assertImage(destination);
    this.#staged = true;
  }

  /** Promotes the complete staged image with one accepted-index swap. */
  promote(): void {
    if (!this.#staged) {
      throw new Error("flat coupled accepted state has no staged candidate");
    }
    this.#activeIndex = this.#activeIndex === 0 ? 1 : 0;
    this.#staged = false;
    this.#commitCount += 1;
  }

  /** Expected solver/admission rejection abandons only inactive bytes. */
  abort(): void {
    this.#staged = false;
  }

  /** Cold detached readback for tests, checkpoints, and diagnostics. */
  snapshot(): MainWireFlatCoupledAcceptedStateSnapshotV1 {
    const current = this.currentImage();
    return Object.freeze({
      acceptedTimeSec: current[ACCEPTED_TIME_SLOT]!,
      revision: current[REVISION_SLOT]!,
      fixedGlobalTotalBloodVolumeMl: current[FIXED_TBV_SLOT]!,
      nonCoronaryNodeVolumesMl: current.slice(
        NON_CORONARY_START,
        CORONARY_START,
      ),
      coronaryConservedVolumesMl: current.slice(CORONARY_START),
    });
  }

  report(): MainWireFlatCoupledAcceptedStateReportV1 {
    return Object.freeze({
      authorityId: MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_ID,
      fixedBufferCount: 2 as const,
      slotCount: MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_SLOT_COUNT,
      byteLengthPerBuffer: this.#buffers[0].byteLength,
      activeBufferIndex: this.#activeIndex,
      commitCount: this.#commitCount,
      staged: this.#staged,
    });
  }

  private currentImage(): Float64Array {
    return this.#buffers[this.#activeIndex];
  }

  private inactiveImage(): Float64Array {
    return this.#buffers[this.#activeIndex === 0 ? 1 : 0];
  }
}

function writeAcceptedObjectIntoImage<TWallState>(
  state: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
  destination: Float64Array,
): void {
  destination[ACCEPTED_TIME_SLOT] = state.acceptedTimeSec;
  destination[REVISION_SLOT] = state.revision;
  destination[FIXED_TBV_SLOT] = state.fixedGlobalTotalBloodVolumeMl;
  for (let index = 0; index < NON_CORONARY_NODE_NAMES_V1.length; index += 1) {
    destination[NON_CORONARY_START + index] =
      state.circulation.nodeVolumesMl[NON_CORONARY_NODE_NAMES_V1[index]!];
  }
  for (
    let index = 0;
    index < CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length;
    index += 1
  ) {
    destination[CORONARY_START + index] = state.coronary.volumeMlByNode[
      CORONARY_CONSERVED_VOLUME_NODE_IDS_V2[index]!
    ];
  }
}

function assertUnknownVector(value: Float64Array): void {
  if (!(value instanceof Float64Array) || value.length !== 30) {
    throw new RangeError("flat coupled unknown vector must contain 30 f64 values");
  }
}

function assertImage(image: Float64Array): void {
  if (
    !(image instanceof Float64Array)
    || image.length !== MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_SLOT_COUNT
    || !Number.isFinite(image[ACCEPTED_TIME_SLOT])
    || image[ACCEPTED_TIME_SLOT]! < 0
    || !Number.isSafeInteger(image[REVISION_SLOT])
    || image[REVISION_SLOT]! < 0
    || !Number.isFinite(image[FIXED_TBV_SLOT])
    || !(image[FIXED_TBV_SLOT]! > 0)
  ) {
    throw new Error("flat coupled accepted-state image is invalid");
  }
  let totalBloodVolumeMl = 0;
  for (let index = NON_CORONARY_START; index < image.length; index += 1) {
    const value = image[index]!;
    if (!Number.isFinite(value) || !(value > 0)) {
      throw new Error(`flat coupled accepted volume ${index} is invalid`);
    }
    totalBloodVolumeMl += value;
  }
  const toleranceMl = 1e-9 * Math.max(1, image[FIXED_TBV_SLOT]!);
  if (Math.abs(totalBloodVolumeMl - image[FIXED_TBV_SLOT]!) > toleranceMl) {
    throw new Error("flat coupled accepted state violates fixed TBV");
  }
}

function sum(values: Float64Array): number {
  let total = 0;
  for (let index = 0; index < values.length; index += 1) {
    total += values[index]!;
  }
  return total;
}
