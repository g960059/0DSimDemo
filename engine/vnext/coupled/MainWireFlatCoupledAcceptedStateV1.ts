import {
  NON_CORONARY_CIRCULATION_BE_V1_ID,
  NON_CORONARY_DYNAMIC_EDGE_NAMES_V1,
  NON_CORONARY_INDEPENDENT_NODE_NAMES_V1,
  NON_CORONARY_NODE_NAMES_V1,
  NON_CORONARY_VALVE_NAMES_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryToneStateV2,
} from "@/engine/coronary/typesV2";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type {
  LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  MAIN_WIRE_FIVE_WALL_IDS_V1,
  type MainWireFiveWallRecordV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
  validateMainWireFiveWallCoronaryAcceptedStateV2,
  type MainWireCoronaryMvcReferenceStateV2,
  type MainWireFiveWallCoronaryAcceptedStateV2,
  type MainWireFiveWallCoupledAcceptedCandidateBorrowV1,
  type MainWireFiveWallCoupledResidualContextV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import type {
  MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  materializeWholeHeartMechanicsAcceptedStateV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

export const MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_ID =
  "main-wire-flat-coupled-accepted-state-v1" as const;

const ACCEPTED_TIME_SLOT = 0;
const REVISION_SLOT = 1;
const FIXED_TBV_SLOT = 2;
const NON_CORONARY_START = 3;
const DYNAMIC_EDGE_START = NON_CORONARY_START
  + NON_CORONARY_NODE_NAMES_V1.length;
const VALVE_START = DYNAMIC_EDGE_START
  + NON_CORONARY_DYNAMIC_EDGE_NAMES_V1.length;
const CORONARY_START = VALVE_START + NON_CORONARY_VALVE_NAMES_V1.length;
const CORONARY_TONE_START = CORONARY_START
  + CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length;
const WALL_STATE_START = CORONARY_TONE_START
  + CORONARY_TERRITORY_IDS_V2.length * CORONARY_LAYER_IDS_V2.length;
const LAND_STATE_LENGTH = 6;
const WALL_STATE_LENGTH = LAND_STATE_LENGTH + 3;
const TRISEG_START = WALL_STATE_START
  + MAIN_WIRE_FIVE_WALL_IDS_V1.length * WALL_STATE_LENGTH;
const MVC_START = TRISEG_START + 2;

export const MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_SLOT_COUNT =
  (MVC_START + 7) as 100;

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
  || NON_CORONARY_DYNAMIC_EDGE_NAMES_V1.length !== 2
  || NON_CORONARY_VALVE_NAMES_V1.length !== 4
  || CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.length !== 16
  || CORONARY_TERRITORY_IDS_V2.length !== 3
  || CORONARY_LAYER_IDS_V2.length !== 2
  || MAIN_WIRE_FIVE_WALL_IDS_V1.length !== 5
  || MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_SLOT_COUNT !== 100
) {
  throw new Error("flat coupled accepted-state V1 layout dimensions changed");
}

type CanonicalAcceptedState = MainWireFiveWallCoronaryAcceptedStateV2<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;
type CanonicalContext = MainWireFiveWallCoupledResidualContextV1<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;
type CanonicalBorrow = MainWireFiveWallCoupledAcceptedCandidateBorrowV1<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

export type MainWireFlatCoupledAcceptedStateSnapshotV1 = Readonly<{
  acceptedTimeSec: number;
  revision: number;
  fixedGlobalTotalBloodVolumeMl: number;
  nonCoronaryNodeVolumesMl: Float64Array;
  dynamicEdgeFlowsMlPerSec: Float64Array;
  valveOpeningFractions01: Float64Array;
  coronaryConservedVolumesMl: Float64Array;
  coronaryToneResistanceScaleByTerritoryLayer: CoronaryToneStateV2;
  mechanicsMaterialState: MainWireNormalAdultFiveWallMechanicsStateV1;
  mvcReferenceState: MainWireCoronaryMvcReferenceStateV2;
}>;

export type MainWireFlatCoupledAcceptedStateReportV1 = Readonly<{
  authorityId: typeof MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_ID;
  fixedBufferCount: 2;
  slotCount: 100;
  byteLengthPerBuffer: number;
  activeBufferIndex: 0 | 1;
  commitCount: number;
  staged: boolean;
}>;

/**
 * Model-specific accepted authority for the replacement hemodynamic solve.
 * Its complete mutable state for this transaction is two fixed 100-f64
 * images: clocks, 31 conserved volumes, dynamic-flow and valve memory,
 * coronary tone, canonical Land/SLS/TriSeg material memory, and the MVC
 * shortening reference.
 *
 * A converged candidate is copied synchronously from the private component
 * probes into the inactive image. Promotion is one buffer-index swap. No
 * public trial, recursive clone, fingerprint, or frozen object graph is on
 * this admission path; rejected candidates never mutate accepted bytes.
 * Rhythm, devices, and slow-control owners remain outside this first complete
 * circulation/mechanics authority until their own flat layouts exist.
 */
export class MainWireFlatCoupledAcceptedStateV1 {
  readonly authorityId = MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_ID;

  readonly #buffers: readonly [Float64Array, Float64Array];
  readonly #coronaryBinding: CanonicalAcceptedState["coronaryBinding"];
  #activeIndex: 0 | 1 = 0;
  #staged = false;
  #commitCount = 0;

  constructor(initial: CanonicalAcceptedState) {
    const first = new Float64Array(
      MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_SLOT_COUNT,
    );
    const second = new Float64Array(
      MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_SLOT_COUNT,
    );
    this.#buffers = Object.freeze([first, second]);
    this.#coronaryBinding = Object.freeze({ ...initial.coronaryBinding });
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

  /** Stages one solver root after the model-owned component gates accept it. */
  stageConvergedSolution(
    context: CanonicalContext,
    solution: Float64Array,
  ): void {
    if (this.#staged) {
      throw new Error("flat coupled accepted state already has a candidate");
    }
    assertUnknownVector(solution);
    const current = this.currentImage();
    if (
      context.baseRevision !== current[REVISION_SLOT]
      || !Object.is(context.baseAcceptedTimeSec, current[ACCEPTED_TIME_SLOT])
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
    const destination = this.inactiveImage();
    context.withConvergedCandidate(solution, (candidate) => {
      assertBorrowMatchesSolution(candidate, solution);
      writeCandidateBorrowIntoImage(candidate, destination);
    });
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
        DYNAMIC_EDGE_START,
      ),
      dynamicEdgeFlowsMlPerSec: current.slice(DYNAMIC_EDGE_START, VALVE_START),
      valveOpeningFractions01: current.slice(VALVE_START, CORONARY_START),
      coronaryConservedVolumesMl: current.slice(
        CORONARY_START,
        CORONARY_TONE_START,
      ),
      coronaryToneResistanceScaleByTerritoryLayer:
        readCoronaryToneFromImage(current),
      mechanicsMaterialState: readMechanicsStateFromImage(current),
      mvcReferenceState: readMvcReferenceFromImage(current),
    });
  }

  /**
   * Cold migration bridge used only to prove that this image owns enough
   * state to drive the next coupled step. Production cutover must replace it
   * with direct context preparation from the active image.
   */
  materializeAcceptedObjectBridge(
    provider: MainWireNormalAdultFiveWallProviderV1,
  ): CanonicalAcceptedState {
    const image = this.currentImage();
    assertImage(image);
    const acceptedTimeSec = image[ACCEPTED_TIME_SLOT]!;
    const revision = image[REVISION_SLOT]!;
    const nodeVolumesMl = Object.freeze(Object.fromEntries(
      NON_CORONARY_NODE_NAMES_V1.map((nodeId, index) => [
        nodeId,
        image[NON_CORONARY_START + index]!,
      ]),
    )) as CanonicalAcceptedState["circulation"]["nodeVolumesMl"];
    const dynamicEdgeFlowsMlPerSec = Object.freeze(Object.fromEntries(
      NON_CORONARY_DYNAMIC_EDGE_NAMES_V1.map((edgeId, index) => [
        edgeId,
        image[DYNAMIC_EDGE_START + index]!,
      ]),
    )) as CanonicalAcceptedState["circulation"][
      "dynamicEdgeFlowsMlPerSec"
    ];
    const valveStates = Object.freeze(Object.fromEntries(
      NON_CORONARY_VALVE_NAMES_V1.map((valveId, index) => [
        valveId,
        Object.freeze({
          leafletOpeningFraction01: image[VALVE_START + index]!,
        }),
      ]),
    )) as CanonicalAcceptedState["circulation"]["valveStates"];
    const nonCoronaryTotalBloodVolumeMl = NON_CORONARY_NODE_NAMES_V1.reduce(
      (total, nodeId) => total + nodeVolumesMl[nodeId],
      0,
    );
    const circulation = Object.freeze({
      transactionId: NON_CORONARY_CIRCULATION_BE_V1_ID,
      revision,
      acceptedTimeSec,
      totalBloodVolumeMl: nonCoronaryTotalBloodVolumeMl,
      nodeVolumesMl,
      dynamicEdgeFlowsMlPerSec,
      valveStates,
    });
    const coronaryVolumes = Object.freeze(Object.fromEntries(
      CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId, index) => [
        nodeId,
        image[CORONARY_START + index]!,
      ]),
    )) as CanonicalAcceptedState["coronary"]["volumeMlByNode"];
    const coronary = Object.freeze({
      acceptedTimeSec,
      revision,
      volumeMlByNode: coronaryVolumes,
      toneResistanceScaleByTerritoryLayer:
        readCoronaryToneFromImage(image),
    });
    const acceptedVolumesMl = Object.freeze({
      LA: nodeVolumesMl.LA,
      LV: nodeVolumesMl.LV,
      RA: nodeVolumesMl.RA,
      RV: nodeVolumesMl.RV,
    });
    const mechanics = materializeWholeHeartMechanicsAcceptedStateV1(
      provider,
      Object.freeze({
        revision,
        acceptedTimeSec,
        acceptedVolumesMl,
        materialState: readMechanicsStateFromImage(image),
      }),
    );
    const accepted = Object.freeze({
      transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
      revision,
      acceptedTimeSec,
      fixedGlobalTotalBloodVolumeMl: image[FIXED_TBV_SLOT]!,
      coronaryBinding: this.#coronaryBinding,
      circulation,
      coronary,
      mechanics,
      mvcReferenceState: readMvcReferenceFromImage(image),
    }) satisfies CanonicalAcceptedState;
    validateMainWireFiveWallCoronaryAcceptedStateV2(accepted);
    return accepted;
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

function writeAcceptedObjectIntoImage(
  accepted: CanonicalAcceptedState,
  destination: Float64Array,
): void {
  destination[ACCEPTED_TIME_SLOT] = accepted.acceptedTimeSec;
  destination[REVISION_SLOT] = accepted.revision;
  destination[FIXED_TBV_SLOT] = accepted.fixedGlobalTotalBloodVolumeMl;
  NON_CORONARY_NODE_NAMES_V1.forEach((nodeId, index) => {
    destination[NON_CORONARY_START + index] =
      accepted.circulation.nodeVolumesMl[nodeId];
  });
  NON_CORONARY_DYNAMIC_EDGE_NAMES_V1.forEach((edgeId, index) => {
    destination[DYNAMIC_EDGE_START + index] =
      accepted.circulation.dynamicEdgeFlowsMlPerSec[edgeId];
  });
  NON_CORONARY_VALVE_NAMES_V1.forEach((valveId, index) => {
    destination[VALVE_START + index] =
      accepted.circulation.valveStates[valveId].leafletOpeningFraction01;
  });
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.forEach((nodeId, index) => {
    destination[CORONARY_START + index] =
      accepted.coronary.volumeMlByNode[nodeId];
  });
  writeCoronaryToneIntoImage(
    accepted.coronary.toneResistanceScaleByTerritoryLayer,
    destination,
  );
  writeMechanicsStateIntoImage(accepted.mechanics.materialState, destination);
  writeMvcReferenceIntoImage(accepted.mvcReferenceState, destination);
}

function writeCandidateBorrowIntoImage(
  candidate: CanonicalBorrow,
  destination: Float64Array,
): void {
  destination[ACCEPTED_TIME_SLOT] = candidate.candidateTimeSec;
  destination[REVISION_SLOT] = candidate.candidateRevision;
  destination[FIXED_TBV_SLOT] = candidate.fixedGlobalTotalBloodVolumeMl;
  destination.set(candidate.nonCoronaryNodeVolumesMl, NON_CORONARY_START);
  destination.set(candidate.dynamicEdgeFlowsMlPerSec, DYNAMIC_EDGE_START);
  for (let index = 0; index < candidate.valveStates.length; index += 1) {
    destination[VALVE_START + index] =
      candidate.valveStates[index]!.leafletOpeningFraction01;
  }
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.forEach((nodeId, index) => {
    destination[CORONARY_START + index] = candidate.coronaryVolumesMl[nodeId];
  });
  writeCoronaryToneIntoImage(
    candidate.coronaryToneResistanceScaleByTerritoryLayer,
    destination,
  );
  writeMechanicsStateIntoImage(candidate.mechanicsMaterialState, destination);
  writeMvcReferenceIntoImage(candidate.mvcReferenceState, destination);
}

function writeCoronaryToneIntoImage(
  tone: CoronaryToneStateV2,
  destination: Float64Array,
): void {
  let slot = CORONARY_TONE_START;
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      destination[slot] = tone[territoryId][layerId];
      slot += 1;
    }
  }
}

function readCoronaryToneFromImage(image: Float64Array): CoronaryToneStateV2 {
  let slot = CORONARY_TONE_START;
  const record: Record<string, Readonly<Record<string, number>>> = {};
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    const layers: Record<string, number> = {};
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      layers[layerId] = image[slot]!;
      slot += 1;
    }
    record[territoryId] = Object.freeze(layers);
  }
  return Object.freeze(record) as CoronaryToneStateV2;
}

function writeMechanicsStateIntoImage(
  state: MainWireNormalAdultFiveWallMechanicsStateV1,
  destination: Float64Array,
): void {
  let slot = WALL_STATE_START;
  for (const wallId of MAIN_WIRE_FIVE_WALL_IDS_V1) {
    const wall = state.wallStateByWall[wallId];
    if (wall.landState.length !== LAND_STATE_LENGTH) {
      throw new Error(`flat ${wallId} Land state dimension changed`);
    }
    destination.set(wall.landState, slot);
    slot += LAND_STATE_LENGTH;
    destination[slot++] = wall.slsState.viscousLogStrain;
    destination[slot++] = wall.previousFiberLogStrain;
    destination[slot++] = wall.previousFreeCalciumUM;
  }
  destination[TRISEG_START] =
    state.trisegCoordinates.septalMidwallCapVolumeM3;
  destination[TRISEG_START + 1] = state.trisegCoordinates.junctionRadiusM;
}

function readMechanicsStateFromImage(
  image: Float64Array,
): MainWireNormalAdultFiveWallMechanicsStateV1 {
  let slot = WALL_STATE_START;
  const walls = {} as {
    -readonly [TWall in (typeof MAIN_WIRE_FIVE_WALL_IDS_V1)[number]]:
      LandSlsWallMaterialStateV1;
  };
  for (const wallId of MAIN_WIRE_FIVE_WALL_IDS_V1) {
    const landState = image.slice(slot, slot + LAND_STATE_LENGTH);
    slot += LAND_STATE_LENGTH;
    walls[wallId] = Object.freeze({
      landState,
      slsState: Object.freeze({ viscousLogStrain: image[slot++]! }),
      previousFiberLogStrain: image[slot++]!,
      previousFreeCalciumUM: image[slot++]!,
    });
  }
  return Object.freeze({
    wallStateByWall: Object.freeze(walls) as MainWireFiveWallRecordV1<
      LandSlsWallMaterialStateV1
    >,
    trisegCoordinates: Object.freeze({
      septalMidwallCapVolumeM3: image[TRISEG_START]!,
      junctionRadiusM: image[TRISEG_START + 1]!,
    }),
  });
}

function writeMvcReferenceIntoImage(
  state: MainWireCoronaryMvcReferenceStateV2,
  destination: Float64Array,
): void {
  destination[MVC_START] =
    state.reference.referenceFiberLogStrainByWall.LVFW;
  destination[MVC_START + 1] =
    state.reference.referenceFiberLogStrainByWall.SEP;
  destination[MVC_START + 2] =
    state.reference.referenceFiberLogStrainByWall.RVFW;
  destination[MVC_START + 3] = state.referenceAcceptedTimeSec;
  destination[MVC_START + 4] = state.referenceRevision;
  destination[MVC_START + 5] = state.mitralForwardFlowActive ? 1 : 0;
  destination[MVC_START + 6] = state.acceptedMitralClosureEventCount;
}

function readMvcReferenceFromImage(
  image: Float64Array,
): MainWireCoronaryMvcReferenceStateV2 {
  return Object.freeze({
    reference: Object.freeze({
      referenceFiberLogStrainByWall: Object.freeze({
        LVFW: image[MVC_START]!,
        SEP: image[MVC_START + 1]!,
        RVFW: image[MVC_START + 2]!,
      }),
    }),
    referenceAcceptedTimeSec: image[MVC_START + 3]!,
    referenceRevision: image[MVC_START + 4]!,
    mitralForwardFlowActive: image[MVC_START + 5] === 1,
    acceptedMitralClosureEventCount: image[MVC_START + 6]!,
  });
}

function assertBorrowMatchesSolution(
  candidate: CanonicalBorrow,
  solution: Float64Array,
): void {
  for (let index = 0; index < INDEPENDENT_NODE_INDEXES.length; index += 1) {
    if (
      !sameCandidateScalar(
        candidate.nonCoronaryNodeVolumesMl[INDEPENDENT_NODE_INDEXES[index]!],
        solution[index],
      )
    ) {
      throw new Error(
        `coupled non-coronary candidate changed solver root at ${index}: ${
          candidate.nonCoronaryNodeVolumesMl[INDEPENDENT_NODE_INDEXES[index]!]
        } versus ${solution[index]}`,
      );
    }
  }
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.forEach((nodeId, index) => {
    if (
      !sameCandidateScalar(
        candidate.coronaryVolumesMl[nodeId],
        solution[NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.length + index],
      )
    ) {
      throw new Error("coupled coronary candidate changed solver root");
    }
  });
  const chamberNodeIds = ["LA", "LV", "RA", "RV"] as const;
  for (const chamberId of chamberNodeIds) {
    const nodeIndex = NON_CORONARY_NODE_NAMES_V1.indexOf(chamberId);
    if (
      nodeIndex < 0
      || !sameCandidateScalar(
        candidate.mechanicsCandidateVolumesMl[chamberId],
        candidate.nonCoronaryNodeVolumesMl[nodeIndex],
      )
    ) {
      throw new Error("coupled mechanics candidate changed chamber volumes");
    }
  }
}

function sameCandidateScalar(left: number, right: number): boolean {
  return Number.isFinite(left)
    && Number.isFinite(right)
    && Math.abs(left - right) <= 1e-12 * Math.max(1, Math.abs(left), Math.abs(right));
}

function assertImage(image: Float64Array): void {
  if (
    !(image instanceof Float64Array)
    || image.length !== MAIN_WIRE_FLAT_COUPLED_ACCEPTED_STATE_V1_SLOT_COUNT
  ) {
    throw new RangeError("flat coupled accepted image must contain 100 f64s");
  }
  for (let index = 0; index < image.length; index += 1) {
    if (!Number.isFinite(image[index])) {
      throw new Error(`flat coupled accepted image ${index} is not finite`);
    }
  }
  if (!(image[ACCEPTED_TIME_SLOT]! >= 0)) {
    throw new Error("flat coupled accepted time must be non-negative");
  }
  if (!Number.isSafeInteger(image[REVISION_SLOT]) || image[REVISION_SLOT]! < 0) {
    throw new Error("flat coupled accepted revision must be non-negative");
  }
  if (!(image[FIXED_TBV_SLOT]! > 0)) {
    throw new Error("flat coupled fixed TBV must be positive");
  }
  for (let slot = NON_CORONARY_START; slot < DYNAMIC_EDGE_START; slot += 1) {
    if (!(image[slot]! > 0)) {
      throw new Error("flat coupled non-coronary volume must be positive");
    }
  }
  for (let slot = VALVE_START; slot < CORONARY_START; slot += 1) {
    if (image[slot]! < 0 || image[slot]! > 1) {
      throw new Error("flat coupled valve opening must lie in [0, 1]");
    }
  }
  for (let slot = CORONARY_START; slot < CORONARY_TONE_START; slot += 1) {
    if (!(image[slot]! > 0)) {
      throw new Error("flat coupled coronary volume must be positive");
    }
  }
  for (let slot = CORONARY_TONE_START; slot < WALL_STATE_START; slot += 1) {
    if (!(image[slot]! > 0)) {
      throw new Error("flat coupled coronary tone must be positive");
    }
  }
  let totalBloodVolumeMl = 0;
  for (let slot = NON_CORONARY_START; slot < DYNAMIC_EDGE_START; slot += 1) {
    totalBloodVolumeMl += image[slot]!;
  }
  for (let slot = CORONARY_START; slot < CORONARY_TONE_START; slot += 1) {
    totalBloodVolumeMl += image[slot]!;
  }
  if (Math.abs(totalBloodVolumeMl - image[FIXED_TBV_SLOT]!) > 1e-8) {
    throw new Error("flat coupled accepted image violates the TBV ledger");
  }
  for (let wall = 0; wall < MAIN_WIRE_FIVE_WALL_IDS_V1.length; wall += 1) {
    const calciumSlot = WALL_STATE_START + wall * WALL_STATE_LENGTH
      + LAND_STATE_LENGTH + 2;
    if (image[calciumSlot]! < 0) {
      throw new Error("flat coupled previous calcium must be non-negative");
    }
  }
  const referenceTime = image[MVC_START + 3]!;
  const referenceRevision = image[MVC_START + 4]!;
  const active = image[MVC_START + 5]!;
  const eventCount = image[MVC_START + 6]!;
  if (
    referenceTime < 0
    || referenceTime > image[ACCEPTED_TIME_SLOT]!
    || !Number.isSafeInteger(referenceRevision)
    || referenceRevision < 0
    || referenceRevision > image[REVISION_SLOT]!
    || (active !== 0 && active !== 1)
    || !Number.isSafeInteger(eventCount)
    || eventCount < 0
  ) {
    throw new Error("flat coupled MVC reference state is invalid");
  }
}

function assertUnknownVector(values: Float64Array): void {
  if (!(values instanceof Float64Array) || values.length !== 30) {
    throw new RangeError("flat coupled unknown vector must contain 30 f64s");
  }
}
