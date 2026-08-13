import type {
  MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  createTransactionalScalarSlotManifestV1,
  type TransactionalScalarSlotManifestV1,
} from "@/engine/vnext/TransactionalScalarSlotsV1";

export const MAIN_WIRE_ACCEPTED_SCALAR_SLOT_LAYOUT_V1_ID =
  "main-wire-integrated-accepted-scalar-slots-v1" as const;
export const MAIN_WIRE_ACCEPTED_SCALAR_SLOT_LAYOUT_V1_FINGERPRINT =
  "fnv1a32-8c218aa1" as const;
export const MAIN_WIRE_ACCEPTED_SCALAR_SLOT_COUNT_V1 = 440 as const;
export const MAIN_WIRE_ACCEPTED_BOOLEAN_SLOT_COUNT_V1 = 4 as const;
export const MAIN_WIRE_ACCEPTED_DYNAMIC_ROOT_COUNT_V1 = 45 as const;
export const MAIN_WIRE_ACCEPTED_STRING_SLOT_COUNT_V1 = 205 as const;
export const MAIN_WIRE_ACCEPTED_CONTAINER_COUNT_V1 = 158 as const;

type AcceptedState = MainWireIntegratedModelAcceptedStateV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

/**
 * Model-owned admission for the Phase 1b.2 scalar manifest. Any fixed-shape
 * change requires an explicit layout version rather than silently moving slot
 * indices.
 */
export function createMainWireAcceptedScalarSlotManifestV1(
  coldAcceptedState: AcceptedState,
): TransactionalScalarSlotManifestV1 {
  const manifest = createTransactionalScalarSlotManifestV1(
    MAIN_WIRE_ACCEPTED_SCALAR_SLOT_LAYOUT_V1_ID,
    coldAcceptedState,
  );
  if (
    manifest.fingerprint
      !== MAIN_WIRE_ACCEPTED_SCALAR_SLOT_LAYOUT_V1_FINGERPRINT
    || manifest.continuousSlots.length
      !== MAIN_WIRE_ACCEPTED_SCALAR_SLOT_COUNT_V1
    || manifest.booleanSlots.length
      !== MAIN_WIRE_ACCEPTED_BOOLEAN_SLOT_COUNT_V1
    || manifest.excludedDynamicRoots.length
      !== MAIN_WIRE_ACCEPTED_DYNAMIC_ROOT_COUNT_V1
    || manifest.excludedStringSlots.length
      !== MAIN_WIRE_ACCEPTED_STRING_SLOT_COUNT_V1
    || manifest.containers.length !== MAIN_WIRE_ACCEPTED_CONTAINER_COUNT_V1
  ) {
    throw new Error(
      "Main Wire accepted scalar layout changed without a new layout version "
        + `(${manifest.fingerprint}; ${manifest.continuousSlots.length}/`
        + `${manifest.booleanSlots.length}/`
        + `${manifest.excludedDynamicRoots.length}/`
        + `${manifest.excludedStringSlots.length}/`
        + `${manifest.containers.length})`,
    );
  }
  return manifest;
}
