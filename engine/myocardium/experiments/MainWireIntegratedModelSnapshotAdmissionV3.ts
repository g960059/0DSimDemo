import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import type {
  MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  alignMainWireIntegratedModelRegularSinusAllOffCandidateV3,
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { canonicalJsonStringify } from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_ADMISSION_V3_ID =
  "main-wire-integrated-public-executable-snapshot-admission-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_ADMISSION_NOMINAL_DT_SEC_V3 =
  0.002 as const;

export type MainWireIntegratedModelSnapshotAdmissionResultV3 =
  | Readonly<{
      status: "accepted";
      admissionId:
        typeof MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_ADMISSION_V3_ID;
    }>
  | Readonly<{
      status: "rejected";
      admissionId:
        typeof MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_ADMISSION_V3_ID;
      reason: string;
    }>;

/**
 * Detached public-executable admission for every immutable Snapshot.
 *
 * Admission deliberately establishes neither settlement nor physiological
 * validity. It restores the atomic click-time checkpoint exactly, advances a
 * fork through the open cycle plus one complete regular-sinus cycle, and uses
 * the canonical finite/conservation/event machinery. The original candidate
 * remains byte-for-byte the Snapshot content when this verifier passes.
 */
export async function admitMainWireIntegratedModelSnapshotV3(
  input: Readonly<{
    candidateCheckpoint: unknown;
    hemodynamicResearchInputs:
      MainWireIntegratedModelHemodynamicResearchInputsV3;
  }>,
): Promise<MainWireIntegratedModelSnapshotAdmissionResultV3> {
  try {
    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
      input.hemodynamicResearchInputs,
    );
    const context =
      createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
        fixture,
      );
    const restored = await restoreMainWireIntegratedModelV3(
      context,
      input.candidateCheckpoint,
    );
    const candidateRoundTrip = await checkpointMainWireIntegratedModelV3(
      context,
      restored,
    );
    if (
      canonicalJsonStringify(candidateRoundTrip)
      !== canonicalJsonStringify(input.candidateCheckpoint)
    ) {
      throw new Error("candidate checkpoint exact round-trip differs");
    }

    const alignment =
      alignMainWireIntegratedModelRegularSinusAllOffCandidateV3(
        fixture,
        restored,
        MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_ADMISSION_NOMINAL_DT_SEC_V3,
      );
    const cycle = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      fixture,
      alignment.terminalAcceptedState,
      1,
      MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_ADMISSION_NOMINAL_DT_SEC_V3,
    );
    assertNoRepeatedAcceptedEventIdsV3([
      ...alignment.acceptedAtrialCaptureIds,
      ...cycle.acceptedAtrialCaptureIds,
    ], "atrial capture");
    assertNoRepeatedAcceptedEventIdsV3([
      ...alignment.acceptedVentricularCaptureIds,
      ...cycle.acceptedVentricularCaptureIds,
    ], "ventricular capture");
    assertNoRepeatedAcceptedEventIdsV3([
      ...alignment.deliveredCalciumDepositIds,
      ...cycle.deliveredCalciumDepositIds,
    ], "calcium deposit");

    const terminalCheckpoint = await checkpointMainWireIntegratedModelV3(
      context,
      cycle.terminalAcceptedState,
    );
    const terminalRestored = await restoreMainWireIntegratedModelV3(
      context,
      terminalCheckpoint,
    );
    const terminalRoundTrip = await checkpointMainWireIntegratedModelV3(
      context,
      terminalRestored,
    );
    if (
      canonicalJsonStringify(terminalRoundTrip)
      !== canonicalJsonStringify(terminalCheckpoint)
    ) {
      throw new Error("terminal checkpoint exact round-trip differs");
    }
    return Object.freeze({
      status: "accepted" as const,
      admissionId: MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_ADMISSION_V3_ID,
    });
  } catch (error) {
    return Object.freeze({
      status: "rejected" as const,
      admissionId: MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_ADMISSION_V3_ID,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

function assertNoRepeatedAcceptedEventIdsV3(
  ids: readonly string[],
  label: string,
): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${label} identity repeated across verification window`);
  }
}
