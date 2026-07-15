import { stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  FOUR_CHAMBER_STATE_SCHEMA_V1_ID,
  CONTRACT_DIAGNOSTIC_HASH_ALGORITHM,
} from "@/engine/myocardium/fourChamberV1/ids";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  TRISEG_ALGEBRAIC_COORDINATES,
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PRESCRIBED_CALCIUM_STATE_LABELS = Object.freeze(["r", "d"] as const);
export const RATE_FREE_LAND_STATE_LABELS = Object.freeze(["CaTRPN", "B", "W", "S", "xiW", "xiS"] as const);
export const PASSIVE_SLS_STATE_LABELS = Object.freeze(["alphaV"] as const);

export type FourChamberStateOwner =
  | "circulation-volume"
  | "circulation-inertial-flow"
  | "prescribed-calcium"
  | "land2017-active-only-rate-free"
  | "passive-wall-sls";

export type FourChamberStateUnit = "m^3" | "m^3/s" | "1";

export type FourChamberStateDescriptor = {
  readonly key: string;
  readonly label: string;
  readonly offset: number;
  readonly owner: FourChamberStateOwner;
  readonly equationsId: string;
  readonly unit: FourChamberStateUnit;
  readonly wallId?: FourChamberWallId;
  readonly patchId?: "patch-0";
};

export type FourChamberStateBlock = {
  readonly blockId: string;
  readonly offset: number;
  readonly size: number;
  readonly owner: FourChamberStateOwner;
  readonly equationsId: string;
  readonly wallId?: FourChamberWallId;
  readonly patchId?: "patch-0";
  readonly states: readonly FourChamberStateDescriptor[];
};

export type FourChamberStateLayoutV1 = {
  readonly schemaId: typeof FOUR_CHAMBER_STATE_SCHEMA_V1_ID;
  readonly size: 59;
  readonly blocks: readonly FourChamberStateBlock[];
  readonly states: readonly FourChamberStateDescriptor[];
  readonly offsetByKey: Readonly<Record<string, number>>;
  readonly algebraicCoordinatesExcludedFromState: typeof TRISEG_ALGEBRAIC_COORDINATES;
  readonly avpdStatePresent: false;
  readonly hiddenBloodVolumeStatePresent: false;
  readonly diagnosticHashAlgorithm: typeof CONTRACT_DIAGNOSTIC_HASH_ALGORITHM;
  readonly layoutDiagnosticHash: string;
};

export function buildFourChamberStateLayoutV1(): FourChamberStateLayoutV1 {
  const blocks: FourChamberStateBlock[] = [];
  let offset = 0;

  const addBlock = (
    blockId: string,
    owner: FourChamberStateOwner,
    equationsId: string,
    labels: readonly string[],
    unit: FourChamberStateUnit,
    wallId?: FourChamberWallId,
  ): void => {
    const patchFields = wallId === undefined ? {} : { wallId, patchId: "patch-0" as const };
    const states = labels.map((label, localOffset) => Object.freeze({
      key: `${blockId}.${label}`,
      label,
      offset: offset + localOffset,
      owner,
      equationsId,
      unit,
      ...patchFields,
    }));

    blocks.push(Object.freeze({
      blockId,
      offset,
      size: states.length,
      owner,
      equationsId,
      ...patchFields,
      states: Object.freeze(states),
    }));
    offset += states.length;
  };

  addBlock(
    "circulation.volume",
    "circulation-volume",
    "eight-volume-conservative-ledger-v1",
    BLOOD_COMPARTMENT_IDS.map((id) => `V_${id}`),
    "m^3",
  );
  addBlock(
    "circulation.flow",
    "circulation-inertial-flow",
    "six-inertial-flow-momentum-v1",
    INERTIAL_FLOW_IDS,
    "m^3/s",
  );

  for (const wallId of WALL_IDS) {
    const prefix = `tissue.${wallId}.patch-0`;
    addBlock(
      `${prefix}.calcium`,
      "prescribed-calcium",
      "event-two-state-prescribed-calcium-v1",
      PRESCRIBED_CALCIUM_STATE_LABELS,
      "1",
      wallId,
    );
    addBlock(
      `${prefix}.land`,
      "land2017-active-only-rate-free",
      "land2017-active-only-rate-free-xi-v1",
      RATE_FREE_LAND_STATE_LABELS,
      "1",
      wallId,
    );
    addBlock(
      `${prefix}.sls`,
      "passive-wall-sls",
      "one-state-wall-sls-v1",
      PASSIVE_SLS_STATE_LABELS,
      "1",
      wallId,
    );
  }

  if (offset !== 59) {
    throw new Error(`Four-chamber baseline state layout must contain 59 states; received ${offset}`);
  }

  const states = blocks.flatMap((block) => block.states);
  const keys = states.map((state) => state.key);
  if (new Set(keys).size !== keys.length) {
    throw new Error("Four-chamber baseline state keys must be unique");
  }
  states.forEach((state, expectedOffset) => {
    if (state.offset !== expectedOffset) {
      throw new Error(`State ${state.key} has non-contiguous offset ${state.offset}`);
    }
  });

  const hashInput = {
    schemaId: FOUR_CHAMBER_STATE_SCHEMA_V1_ID,
    states: states.map(({ key, label, offset: stateOffset, owner, equationsId, unit, wallId, patchId }) => ({
      key,
      label,
      offset: stateOffset,
      owner,
      equationsId,
      unit,
      ...(wallId === undefined ? {} : { wallId, patchId }),
    })),
    algebraicCoordinatesExcludedFromState: TRISEG_ALGEBRAIC_COORDINATES,
    avpdStatePresent: false,
    hiddenBloodVolumeStatePresent: false,
  };

  return Object.freeze({
    schemaId: FOUR_CHAMBER_STATE_SCHEMA_V1_ID,
    size: 59,
    blocks: Object.freeze(blocks),
    states: Object.freeze(states),
    offsetByKey: Object.freeze(Object.fromEntries(states.map((state) => [state.key, state.offset]))),
    algebraicCoordinatesExcludedFromState: TRISEG_ALGEBRAIC_COORDINATES,
    avpdStatePresent: false,
    hiddenBloodVolumeStatePresent: false,
    diagnosticHashAlgorithm: CONTRACT_DIAGNOSTIC_HASH_ALGORITHM,
    layoutDiagnosticHash: stableHash(hashInput),
  });
}

export const FOUR_CHAMBER_BASELINE_STATE_LAYOUT_V1 = buildFourChamberStateLayoutV1();
