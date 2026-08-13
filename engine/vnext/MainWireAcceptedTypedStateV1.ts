import type {
  AcceptedStateAuthorityV1,
  AcceptedStateValidatorV1,
} from "@/engine/core/acceptedStateAuthorityV1";
import type {
  MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  encodeCanonicalFlatDataIntoV1,
  measureCanonicalFlatDataV1,
} from "@/engine/vnext/CanonicalFlatDataV1";
import {
  createTransactionalTypedStateManifestV1,
  TransactionalTypedStateImageV1,
  type TransactionalTypedStateCandidateCursorV1,
  type TransactionalTypedStateCurrentCursorV1,
  type TransactionalTypedStateImageReportV1,
  type TransactionalTypedStateImageSnapshotV1,
  type TransactionalTypedStateManifestV1,
  type TransactionalTypedStateRetainedSlotsV1,
} from "@/engine/vnext/TransactionalTypedStateImageV1";

export const MAIN_WIRE_ACCEPTED_TYPED_STATE_AUTHORITY_V1_ID =
  "main-wire-integrated-accepted-typed-state-authority-v1" as const;
export const MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_ID =
  "main-wire-integrated-accepted-typed-state-v1" as const;
export const MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_FINGERPRINT =
  "fnv1a32-9f176efc" as const;
export const MAIN_WIRE_ACCEPTED_TYPED_STATE_STRING_CAPACITY_BYTES_V1 =
  16 * 1024;
export const MAIN_WIRE_ACCEPTED_TYPED_STATE_DYNAMIC_CAPACITY_BYTES_V1 =
  16 * 1024;
export const MAIN_WIRE_ACCEPTED_TYPED_STATE_BUFFER_BYTES_V1 = 34_984 as const;
export const MAIN_WIRE_ACCEPTED_TYPED_STATE_CONTINUOUS_SLOT_COUNT_V1 =
  253 as const;
export const MAIN_WIRE_ACCEPTED_TYPED_STATE_NULLABLE_CONTINUOUS_SLOT_COUNT_V1 =
  6 as const;
export const MAIN_WIRE_ACCEPTED_TYPED_STATE_BOOLEAN_SLOT_COUNT_V1 = 2 as const;
export const MAIN_WIRE_ACCEPTED_TYPED_STATE_STRING_SLOT_COUNT_V1 = 6 as const;
export const MAIN_WIRE_ACCEPTED_TYPED_STATE_DYNAMIC_ROOT_COUNT_V1 = 11 as const;
export const MAIN_WIRE_ACCEPTED_TYPED_STATE_CONTAINER_COUNT_V1 = 80 as const;

const MAIN_WIRE_ACCEPTED_TYPED_STATE_FIXED_ARRAY_POINTERS_V1 = Object.freeze([
  "/composedRhythm/calciumStateByWall/LA",
  "/composedRhythm/calciumStateByWall/LVFW",
  "/composedRhythm/calciumStateByWall/RA",
  "/composedRhythm/calciumStateByWall/RVFW",
  "/composedRhythm/calciumStateByWall/SEP",
]);

const MAIN_WIRE_ACCEPTED_TYPED_STATE_EXTERNAL_IMMUTABLE_ROOT_POINTERS_V1 =
  Object.freeze([
    "/composedRhythm/configuration",
    "/composedRhythm/regularAtrialSourceState/configuration",
    "/composedRhythm/authoredEctopyState/configuration",
    "/composedRhythm/electricalCaptureState/configuration",
    "/composedRhythm/proximalAvGateState/configuration",
    "/composedRhythm/distalGateState/configuration",
    "/composedRhythm/ventricularBackupState/configuration",
    "/composedRhythm/ventricularBackupState/initialCaptureSeed",
    "/composedRhythm/ventricularIntervalStrengthState/configuration",
    "/composedRhythm/ventricularIntervalStrengthState/initialPriorAcceptedVentricularActivation",
    "/dynamicMechanicalSupport/inertanceProfileSnapshot",
    "/dynamicMechanicalSupport/structuralHydraulicProjection",
  ]);

const MAIN_WIRE_ACCEPTED_TYPED_STATE_CONSTANT_STRING_POINTERS_V1 =
  Object.freeze([
    "/composedRhythm/authoredEctopyState/stateSchemaId",
    "/composedRhythm/distalGateState/stateSchemaId",
    "/composedRhythm/electricalCaptureState/atrialGate/chamber",
    "/composedRhythm/electricalCaptureState/atrialGate/gateInstanceId",
    "/composedRhythm/electricalCaptureState/atrialGate/gateStateSchemaId",
    "/composedRhythm/electricalCaptureState/stateSchemaId",
    "/composedRhythm/electricalCaptureState/ventricularGate/chamber",
    "/composedRhythm/electricalCaptureState/ventricularGate/gateInstanceId",
    "/composedRhythm/electricalCaptureState/ventricularGate/gateStateSchemaId",
    "/composedRhythm/proximalAvGateState/stateSchemaId",
    "/composedRhythm/regularAtrialSourceState/stateSchemaId",
    "/composedRhythm/stateSchemaId",
    "/composedRhythm/ventricularBackupState/stateSchemaId",
    "/composedRhythm/ventricularIntervalStrengthState/lastAcceptedVentricularActivation/activationSchemaId",
    "/composedRhythm/ventricularIntervalStrengthState/lastAcceptedVentricularActivation/chamber",
    "/composedRhythm/ventricularIntervalStrengthState/lastAcceptedVentricularActivation/gateInstanceId",
    "/composedRhythm/ventricularIntervalStrengthState/stateSchemaId",
    "/coronary/circulation/transactionId",
    "/coronary/coronaryAutoregulation/desiredControl/controlId",
    "/coronary/coronaryAutoregulation/stateId",
    "/coronary/coronaryAutoregulationBinding/bindingId",
    "/coronary/coronaryAutoregulationBinding/flowObservable",
    "/coronary/coronaryAutoregulationBinding/law",
    "/coronary/coronaryAutoregulationBinding/perfusionPressureObservable",
    "/coronary/coronaryAutoregulationBinding/priorFingerprint",
    "/coronary/coronaryAutoregulationBinding/windowPolicy/interpretation",
    "/coronary/coronaryAutoregulationBinding/windowPolicy/kind",
    "/coronary/coronaryAutoregulationBinding/windowPolicy/quadrature",
    "/coronary/coronaryBinding/boundaryResolverId",
    "/coronary/coronaryBinding/collapseHydraulicsFingerprint",
    "/coronary/coronaryBinding/impMechanism",
    "/coronary/coronaryBinding/mvcReferenceSemantics",
    "/coronary/coronaryBinding/priorFingerprint",
    "/coronary/coronaryBinding/shorteningImpPriorFingerprint",
    "/coronary/coronaryBinding/topologyId",
    "/coronary/mechanics/contractId",
    "/coronary/mechanics/parameterIdentityHash",
    "/coronary/mechanics/parameterSetId",
    "/coronary/mechanics/providerId",
    "/coronary/transactionId",
    "/dynamicMechanicalSupport/networkId",
    "/dynamicMechanicalSupport/stateSchemaId",
    "/dynamicMechanicalSupport/unitSystemId",
    "/transactionId",
  ]);

const MAIN_WIRE_ACCEPTED_TYPED_STATE_EXTERNAL_IMMUTABLE_POINTERS_V1 =
  Object.freeze([
    ...MAIN_WIRE_ACCEPTED_TYPED_STATE_EXTERNAL_IMMUTABLE_ROOT_POINTERS_V1,
    ...MAIN_WIRE_ACCEPTED_TYPED_STATE_CONSTANT_STRING_POINTERS_V1,
  ]);

const MAIN_WIRE_ACCEPTED_TYPED_STATE_NULLABLE_CONTINUOUS_POINTERS_V1 =
  Object.freeze([
    "/composedRhythm/distalGateState/lastPassedProximalArrivalTimeSec",
    "/composedRhythm/distalGateState/lastVentricularImpulseTimeSec",
    "/composedRhythm/electricalCaptureState/atrialGate/lastCapturedActivationTimeSec",
    "/composedRhythm/electricalCaptureState/lastAcceptedImpulseBatchTimeSec",
    "/composedRhythm/proximalAvGateState/lastConductedAtrialActivationTimeSec",
    "/composedRhythm/proximalAvGateState/lastProximalAvOutputTimeSec",
  ]);

type AcceptedState = MainWireIntegratedModelAcceptedStateV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

export type MainWireAcceptedTypedStateAuthorityReportV1 = Readonly<
  Omit<TransactionalTypedStateImageReportV1, "authorityId"> & {
    authorityId: typeof MAIN_WIRE_ACCEPTED_TYPED_STATE_AUTHORITY_V1_ID;
    poisonedReason: string | null;
    directCandidateCommitCount: number;
  }
>;

/** Exact model admission for the Phase 1b.2b typed accepted-state image. */
export function createMainWireAcceptedTypedStateManifestV1(
  coldAcceptedState: AcceptedState,
): TransactionalTypedStateManifestV1 {
  const manifest = createTransactionalTypedStateManifestV1(
    MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_ID,
    coldAcceptedState,
    MAIN_WIRE_ACCEPTED_TYPED_STATE_STRING_CAPACITY_BYTES_V1,
    MAIN_WIRE_ACCEPTED_TYPED_STATE_DYNAMIC_CAPACITY_BYTES_V1,
    {
      fixedArrayPointers:
        MAIN_WIRE_ACCEPTED_TYPED_STATE_FIXED_ARRAY_POINTERS_V1,
      externalImmutablePointers:
        MAIN_WIRE_ACCEPTED_TYPED_STATE_EXTERNAL_IMMUTABLE_POINTERS_V1,
      nullableContinuousPointers:
        MAIN_WIRE_ACCEPTED_TYPED_STATE_NULLABLE_CONTINUOUS_POINTERS_V1,
    },
  );
  const layout = manifest.numericalLayout;
  if (
    manifest.fingerprint
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_LAYOUT_V1_FINGERPRINT
    || manifest.bufferByteLength
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_BUFFER_BYTES_V1
    || layout.continuousSlots.length
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_CONTINUOUS_SLOT_COUNT_V1
    || layout.nullableContinuousSlots.length
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_NULLABLE_CONTINUOUS_SLOT_COUNT_V1
    || layout.booleanSlots.length
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_BOOLEAN_SLOT_COUNT_V1
    || layout.stringSlots.length
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_STRING_SLOT_COUNT_V1
    || layout.externalImmutableRoots.length !== 56
    || layout.excludedDynamicRoots.length
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_DYNAMIC_ROOT_COUNT_V1
    || layout.containers.length
      !== MAIN_WIRE_ACCEPTED_TYPED_STATE_CONTAINER_COUNT_V1
  ) {
    throw new Error(
      "Main Wire accepted typed-state layout changed without a new version "
        + `(${manifest.fingerprint}; ${manifest.bufferByteLength}; `
        + `${layout.continuousSlots.length}/`
        + `${layout.nullableContinuousSlots.length}/`
        + `${layout.booleanSlots.length}/`
        + `${layout.stringSlots.length}/${layout.excludedDynamicRoots.length}/`
        + `${layout.externalImmutableRoots.length}/${layout.containers.length})`,
    );
  }
  return manifest;
}

/**
 * Model-owned transactional authority. The solver still produces an object
 * adapter in Phase 1b.2b.2a, but only the rehydrated inactive typed image plus
 * its admitted immutable cold roots can be promoted and observed by the next
 * accepted transaction.
 */
export class MainWireAcceptedTypedStateAuthorityV1
  implements AcceptedStateAuthorityV1<AcceptedState> {
  readonly authorityId = MAIN_WIRE_ACCEPTED_TYPED_STATE_AUTHORITY_V1_ID;

  readonly #manifest: TransactionalTypedStateManifestV1;
  readonly #image: TransactionalTypedStateImageV1<AcceptedState>;
  readonly #ownDecoded: AcceptedStateValidatorV1<AcceptedState>;
  #currentState: AcceptedState;
  #poisonedReason: string | null = null;
  #directCandidateCommitCount = 0;

  constructor(
    coldAcceptedState: AcceptedState,
    initialState: AcceptedState,
    validate: AcceptedStateValidatorV1<AcceptedState>,
    ownDecoded: AcceptedStateValidatorV1<AcceptedState>,
  ) {
    validate(initialState);
    this.#ownDecoded = ownDecoded;
    this.#manifest = createMainWireAcceptedTypedStateManifestV1(
      coldAcceptedState,
    );
    this.#image = new TransactionalTypedStateImageV1(
      this.#manifest,
      initialState,
    );
    this.#currentState = this.ownAndValidate(this.#image.rehydrateCurrent());
  }

  current(): AcceptedState {
    this.assertHealthy();
    return this.#currentState;
  }

  /** Immutable model-owned layout used to bind hot-path slots once. */
  manifest(): TransactionalTypedStateManifestV1 {
    this.assertHealthy();
    return this.#manifest;
  }

  snapshot(): AcceptedState {
    this.assertHealthy();
    return this.ownAndValidate(this.#image.rehydrateCurrent());
  }

  commit(candidate: AcceptedState): AcceptedState {
    this.assertHealthy();
    try {
      this.#image.stage(candidate);
      const owned = this.ownAndValidate(this.#image.rehydrateStaged());
      this.#image.promote();
      this.#currentState = owned;
      return owned;
    } catch (error) {
      this.#image.abort();
      const message = error instanceof Error ? error.message : String(error);
      this.#poisonedReason = `candidate commit failed: ${message}`;
      throw new Error(
        `Main Wire accepted typed-state authority is poisoned: `
          + this.#poisonedReason,
      );
    }
  }

  /** Begins one inactive typed transaction for a migrated state owner. */
  beginDirectCandidate(): TransactionalTypedStateCandidateCursorV1 {
    this.assertHealthy();
    return this.#image.beginCandidateFromCurrent();
  }

  /**
   * Admits the still-object-backed owners without overwriting migrated slots,
   * then promotes the complete validated typed candidate exactly once.
   */
  commitDirectCandidate(
    adapterCandidate: AcceptedState,
    retained: TransactionalTypedStateRetainedSlotsV1,
  ): AcceptedState {
    this.assertHealthy();
    try {
      this.#image.completeCandidateFromObject(adapterCandidate, retained);
      const owned = this.ownAndValidate(this.#image.rehydrateStaged());
      this.#image.promote();
      this.#currentState = owned;
      this.#directCandidateCommitCount += 1;
      return owned;
    } catch (error) {
      this.#image.abort();
      const message = error instanceof Error ? error.message : String(error);
      this.#poisonedReason = `direct candidate commit failed: ${message}`;
      throw new Error(
        `Main Wire accepted typed-state authority is poisoned: `
          + this.#poisonedReason,
      );
    }
  }

  /** Expected solver rejection abandons the inactive candidate without poison. */
  abortDirectCandidate(): void {
    this.assertHealthy();
    this.#image.abort();
  }

  report(): MainWireAcceptedTypedStateAuthorityReportV1 {
    const report = this.#image.report();
    return Object.freeze({
      ...report,
      authorityId: MAIN_WIRE_ACCEPTED_TYPED_STATE_AUTHORITY_V1_ID,
      poisonedReason: this.#poisonedReason,
      directCandidateCommitCount: this.#directCandidateCommitCount,
    });
  }

  snapshotImage(): TransactionalTypedStateImageSnapshotV1 {
    this.assertHealthy();
    return this.#image.snapshot();
  }

  /** Hot model-owned reads follow the active image after every promotion. */
  currentCursor(): TransactionalTypedStateCurrentCursorV1 {
    this.assertHealthy();
    return this.#image.currentCursor();
  }

  /** Cold-boundary proof that the cached solver adapter still matches storage. */
  assertCurrentMatches(candidate: AcceptedState): void {
    this.assertHealthy();
    const authoritative = this.snapshot();
    const authoritativeBytes = canonicalBytes(authoritative);
    const candidateBytes = canonicalBytes(candidate);
    if (
      authoritativeBytes.byteLength !== candidateBytes.byteLength
      || !authoritativeBytes.every(
        (value, index) => value === candidateBytes[index],
      )
    ) {
      throw new Error(
        "Main Wire accepted typed-state adapter differs from its active image",
      );
    }
  }

  private ownAndValidate(candidate: AcceptedState): AcceptedState {
    return this.#ownDecoded(candidate);
  }

  private assertHealthy(): void {
    if (this.#poisonedReason !== null) {
      throw new Error(
        `Main Wire accepted typed-state authority is poisoned: `
          + this.#poisonedReason,
      );
    }
  }
}

function canonicalBytes(value: unknown): Uint8Array {
  const bytes = new Uint8Array(measureCanonicalFlatDataV1(value));
  const length = encodeCanonicalFlatDataIntoV1(value, bytes);
  if (length !== bytes.byteLength) {
    throw new Error("Main Wire typed-state canonical length changed");
  }
  return bytes;
}
