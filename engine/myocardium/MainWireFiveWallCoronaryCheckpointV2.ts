import {
  checkpointNonCoronaryCirculationStateV1,
  restoreNonCoronaryCirculationStateV1,
  type NonCoronaryCirculationCheckpointV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  CoronaryBackwardEulerTransactionV2,
  type CoronaryCollapseHydraulicsPriorV2,
  type CoronaryHydraulicCheckpointV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
  type MainWireCoronaryImpMechanismV2,
  type MainWireCoronaryShorteningImpGainPriorV2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  buildCoronaryTopologyV2,
  coronaryConfigurationFingerprintV2,
  coronaryTopologyPriorFingerprintV2,
  type CoronaryTopologyPriorV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
  type MainWireCoronaryMvcReferenceStateV2,
  type MainWireFiveWallCoronaryAcceptedStateV2,
  type MainWireFiveWallCoronaryBindingV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  checkpointWholeHeartMechanicsStateV1,
  restoreWholeHeartMechanicsStateV1,
  type WholeHeartMechanicsCheckpointV1,
  type WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

export const MAIN_WIRE_FIVE_WALL_CORONARY_CHECKPOINT_V2_ID =
  "circleheart.main-wire-five-wall-coronary-checkpoint.v2" as const;

/**
 * This schema is exact only while accepted coronary tone is held fixed.
 *
 * A future accepted-cycle autoregulation phase must atomically checkpoint its
 * integration accumulator (six Qm integrals, three perfusion-pressure
 * integrals, window duration/phase/start, and sample count) and must introduce
 * a new schema. It must not reinterpret this checkpoint as containing that
 * missing history.
 */
export type MainWireFiveWallCoronaryCheckpointContextV2<TWallState> =
  Readonly<{
    provider: WholeHeartMechanicsProviderV1<
      TWallState,
      MainWireFiveWallFreeCalciumDriveV1
    >;
    coronaryPrior: CoronaryTopologyPriorV2;
    collapseHydraulics: CoronaryCollapseHydraulicsPriorV2;
    impMechanism: MainWireCoronaryImpMechanismV2;
    shorteningImpPrior: MainWireCoronaryShorteningImpGainPriorV2;
  }>;

export type MainWireFiveWallCoronaryCheckpointPayloadV2 = Readonly<{
  checkpointId: typeof MAIN_WIRE_FIVE_WALL_CORONARY_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  transactionId: typeof MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID;
  revision: number;
  acceptedTimeSec: number;
  fixedGlobalTotalBloodVolumeMl: number;
  coronaryBinding: MainWireFiveWallCoronaryBindingV2;
  circulation: NonCoronaryCirculationCheckpointV1;
  coronary: CoronaryHydraulicCheckpointV2;
  mechanics: WholeHeartMechanicsCheckpointV1;
  mvcReferenceState: MainWireCoronaryMvcReferenceStateV2;
}>;

export type MainWireFiveWallCoronaryCheckpointV2 =
  MainWireFiveWallCoronaryCheckpointPayloadV2 & Readonly<{
    checkpointSha256: string;
  }>;

export async function checkpointMainWireFiveWallCoronaryV2<TWallState>(
  context: MainWireFiveWallCoronaryCheckpointContextV2<TWallState>,
  state: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
): Promise<MainWireFiveWallCoronaryCheckpointV2> {
  const expectedBinding = expectedBindingV2(context);
  assertBindingEquals(state.coronaryBinding, expectedBinding);
  validateAcceptedTupleV2(state);

  const topology = buildCoronaryTopologyV2(context.coronaryPrior);
  const coronary = new CoronaryBackwardEulerTransactionV2(
    context.coronaryPrior,
    state.coronary,
    topology,
    context.collapseHydraulics,
  ).createCheckpoint();
  const payload = Object.freeze({
    checkpointId: MAIN_WIRE_FIVE_WALL_CORONARY_CHECKPOINT_V2_ID,
    schemaVersion: 2 as const,
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    fixedGlobalTotalBloodVolumeMl: state.fixedGlobalTotalBloodVolumeMl,
    coronaryBinding: copyBinding(state.coronaryBinding),
    circulation: checkpointNonCoronaryCirculationStateV1(state.circulation),
    coronary,
    mechanics: checkpointWholeHeartMechanicsStateV1(
      context.provider,
      state.mechanics,
    ),
    mvcReferenceState: copyMvcReferenceState(state.mvcReferenceState),
  }) satisfies MainWireFiveWallCoronaryCheckpointPayloadV2;
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

/** Restore is deliberately exact: no time/revision rebase or phase change. */
export async function restoreMainWireFiveWallCoronaryV2<TWallState>(
  context: MainWireFiveWallCoronaryCheckpointContextV2<TWallState>,
  input: unknown,
): Promise<MainWireFiveWallCoronaryAcceptedStateV2<TWallState>> {
  assertCheckpointEnvelopeV2(input);
  const checkpoint = input as MainWireFiveWallCoronaryCheckpointV2;
  const { checkpointSha256, ...payload } = checkpoint;
  const calculatedSha256 = await sha256CanonicalJsonHex(payload);
  if (calculatedSha256 !== checkpointSha256) {
    throw new Error("five-wall coronary V2 checkpoint SHA-256 mismatch");
  }

  const expectedBinding = expectedBindingV2(context);
  assertBindingEquals(checkpoint.coronaryBinding, expectedBinding);
  const circulation = restoreNonCoronaryCirculationStateV1(
    checkpoint.circulation,
  );
  const topology = buildCoronaryTopologyV2(context.coronaryPrior);
  const coronaryTransaction = new CoronaryBackwardEulerTransactionV2(
    context.coronaryPrior,
    checkpoint.coronary.acceptedState,
    topology,
    context.collapseHydraulics,
  );
  const coronary = coronaryTransaction.restoreCheckpoint(
    checkpoint.coronary,
  );
  const mechanics = restoreWholeHeartMechanicsStateV1(
    context.provider,
    checkpoint.mechanics,
  );
  const restored = Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
    revision: checkpoint.revision,
    acceptedTimeSec: checkpoint.acceptedTimeSec,
    fixedGlobalTotalBloodVolumeMl: checkpoint.fixedGlobalTotalBloodVolumeMl,
    coronaryBinding: copyBinding(checkpoint.coronaryBinding),
    circulation,
    coronary,
    mechanics,
    mvcReferenceState: copyMvcReferenceState(checkpoint.mvcReferenceState),
  }) satisfies MainWireFiveWallCoronaryAcceptedStateV2<TWallState>;
  validateAcceptedTupleV2(restored);
  assertBindingEquals(restored.coronaryBinding, expectedBinding);
  return restored;
}

function expectedBindingV2<TWallState>(
  context: MainWireFiveWallCoronaryCheckpointContextV2<TWallState>,
): MainWireFiveWallCoronaryBindingV2 {
  buildCoronaryTopologyV2(context.coronaryPrior);
  if (![
    "source-cep-land-active",
    "cep-only-control",
    "cep-shortening-induced",
  ].includes(context.impMechanism)) {
    throw new Error("unsupported main-wire coronary V2 IMP mechanism");
  }
  return Object.freeze({
    topologyId: context.coronaryPrior.topologyId,
    priorFingerprint:
      coronaryTopologyPriorFingerprintV2(context.coronaryPrior),
    collapseHydraulicsFingerprint:
      coronaryConfigurationFingerprintV2(context.collapseHydraulics),
    boundaryResolverId: MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
    impMechanism: context.impMechanism,
    shorteningImpPriorFingerprint:
      coronaryConfigurationFingerprintV2(context.shorteningImpPrior),
    mvcReferenceSemantics:
      "previous-accepted-mitral-closure-fiber-strain-v1" as const,
  });
}

function validateAcceptedTupleV2<TWallState>(
  state: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
): void {
  if (
    state.transactionId !== MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID
    || !Number.isInteger(state.revision)
    || state.revision < 0
    || !Number.isFinite(state.acceptedTimeSec)
    || state.acceptedTimeSec < 0
    || !Number.isFinite(state.fixedGlobalTotalBloodVolumeMl)
    || state.fixedGlobalTotalBloodVolumeMl <= 0
  ) throw new Error("five-wall coronary V2 accepted tuple identity is invalid");
  if (
    state.circulation.revision !== state.revision
    || state.coronary.revision !== state.revision
    || state.mechanics.revision !== state.revision
    || state.circulation.acceptedTimeSec !== state.acceptedTimeSec
    || state.coronary.acceptedTimeSec !== state.acceptedTimeSec
    || state.mechanics.acceptedTimeSec !== state.acceptedTimeSec
  ) throw new Error("five-wall coronary V2 accepted tuple clocks differ");

  assertExactKeys(
    state.coronary.volumeMlByNode,
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
    "coronary V2 volume state",
  );
  assertExactKeys(
    state.coronary.toneResistanceScaleByTerritoryLayer,
    CORONARY_TERRITORY_IDS_V2,
    "coronary V2 tone territories",
  );
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    assertExactKeys(
      state.coronary.toneResistanceScaleByTerritoryLayer[territoryId],
      CORONARY_LAYER_IDS_V2,
      `${territoryId} coronary V2 tone layers`,
    );
  }
  const nonCoronaryVolumeMl = Object.values(
    state.circulation.nodeVolumesMl,
  ).reduce((sum, value) => sum + value, 0);
  const coronaryVolumeMl = CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.reduce(
    (sum, nodeId) => sum + state.coronary.volumeMlByNode[nodeId],
    0,
  );
  if (Math.abs(
    nonCoronaryVolumeMl + coronaryVolumeMl
      - state.fixedGlobalTotalBloodVolumeMl,
  ) > 1e-8) {
    throw new Error("five-wall coronary V2 checkpoint violates global TBV");
  }
  for (const chamberId of ["LA", "LV", "RA", "RV"] as const) {
    if (state.circulation.nodeVolumesMl[chamberId]
      !== state.mechanics.acceptedVolumesMl[chamberId]) {
      throw new Error(
        `five-wall coronary V2 checkpoint ${chamberId} volume mismatch`,
      );
    }
  }
  validateMvcReferenceState(state.mvcReferenceState, state);
}

function validateMvcReferenceState<TWallState>(
  mvc: MainWireCoronaryMvcReferenceStateV2,
  state: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
): void {
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    if (!Number.isFinite(
      mvc.reference.referenceFiberLogStrainByWall[wallId],
    )) throw new Error(`MVC reference ${wallId} strain must be finite`);
  }
  if (
    !Number.isFinite(mvc.referenceAcceptedTimeSec)
    || mvc.referenceAcceptedTimeSec < 0
    || mvc.referenceAcceptedTimeSec > state.acceptedTimeSec
    || !Number.isInteger(mvc.referenceRevision)
    || mvc.referenceRevision < 0
    || mvc.referenceRevision > state.revision
    || typeof mvc.mitralForwardFlowActive !== "boolean"
    || !Number.isInteger(mvc.acceptedMitralClosureEventCount)
    || mvc.acceptedMitralClosureEventCount < 0
  ) throw new Error("five-wall coronary V2 MVC reference state is invalid");
}

function assertBindingEquals(
  actual: MainWireFiveWallCoronaryBindingV2,
  expected: MainWireFiveWallCoronaryBindingV2,
): void {
  if (canonicalJsonStringify(actual) !== canonicalJsonStringify(expected)) {
    throw new Error("five-wall coronary V2 checkpoint binding mismatch");
  }
}

function assertCheckpointEnvelopeV2(
  input: unknown,
): asserts input is MainWireFiveWallCoronaryCheckpointV2 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("unsupported five-wall coronary V2 checkpoint schema");
  }
  const checkpoint = input as Partial<MainWireFiveWallCoronaryCheckpointV2>;
  if (
    checkpoint.checkpointId !== MAIN_WIRE_FIVE_WALL_CORONARY_CHECKPOINT_V2_ID
    || checkpoint.schemaVersion !== 2
    || checkpoint.transactionId
      !== MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID
  ) throw new Error("unsupported five-wall coronary V2 checkpoint schema");
  assertExactKeys(
    input as Record<string, unknown>,
    [
      "checkpointId",
      "schemaVersion",
      "transactionId",
      "revision",
      "acceptedTimeSec",
      "fixedGlobalTotalBloodVolumeMl",
      "coronaryBinding",
      "circulation",
      "coronary",
      "mechanics",
      "mvcReferenceState",
      "checkpointSha256",
    ],
    "five-wall coronary V2 checkpoint envelope",
  );
  if (typeof checkpoint.checkpointSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(checkpoint.checkpointSha256)) {
    throw new Error("five-wall coronary V2 checkpoint SHA-256 is invalid");
  }
}

function assertExactKeys(
  record: object,
  expectedKeys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(record).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} keys mismatch`);
  }
}

function copyBinding(
  binding: MainWireFiveWallCoronaryBindingV2,
): MainWireFiveWallCoronaryBindingV2 {
  return Object.freeze({ ...binding });
}

function copyMvcReferenceState(
  state: MainWireCoronaryMvcReferenceStateV2,
): MainWireCoronaryMvcReferenceStateV2 {
  return Object.freeze({
    ...state,
    reference: Object.freeze({
      referenceFiberLogStrainByWall: Object.freeze({
        ...state.reference.referenceFiberLogStrainByWall,
      }),
    }),
  });
}
