import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_EVIDENCE_ARTIFACT_V1_ID =
  "main-wire-integrated-model-periodic-five-wall-mechanical-energy-evidence-v1" as const;

export function preflightMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceOutputV1(
  requestedOutputPath: string,
): string {
  const absoluteOutputPath = path.resolve(requestedOutputPath);
  if (existsSync(absoluteOutputPath)) {
    throw new Error(
      `refusing to overwrite existing evidence artifact: ${absoluteOutputPath}`,
    );
  }
  return absoluteOutputPath;
}

export async function writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1(
  absoluteOutputPath: string,
  payload: unknown,
) {
  const artifactPayloadSha256 = await sha256CanonicalJsonHex(payload);
  const artifact = Object.freeze({
    ...(payload as Readonly<Record<string, unknown>>),
    artifactPayloadSha256,
  });
  const serialized = `${canonicalJsonStringify(artifact)}\n`;
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, {
    encoding: "utf8",
    flag: "wx",
  });
  return Object.freeze({
    absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    artifactPayloadSha256,
  });
}

export function mainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArtifactCommonV1() {
  return Object.freeze({
    artifactSchemaVersion: 1 as const,
    artifactId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_EVIDENCE_ARTIFACT_V1_ID,
    declarationOrder:
      "preregistration-committed-before-first-new-0.5ms-mechanical-energy-ledger-result" as const,
    rawMechanicalInputsIncluded: false as const,
    policy: Object.freeze({
      officialEvidence:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1,
      admission:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1,
    }),
  });
}

export function compactMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceArtifactV1(
  arm: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1,
) {
  return Object.freeze({
    grid: arm.grid,
    expectedNominalDtSec: arm.expectedNominalDtSec,
    status: arm.status,
    sourceQualificationId: arm.sourceQualificationId,
    sourceStatus: arm.sourceStatus,
    sourceFailureReasons: arm.sourceFailureReasons,
    sourceScopePassed: arm.sourceScopePassed,
    sourceGatesPassed: arm.sourceGatesPassed,
    lineageBindingsPassed: arm.lineageBindingsPassed,
    ledgerRecomputationPassed: arm.ledgerRecomputationPassed,
    ledgerProjectionBindingsPassed: arm.ledgerProjectionBindingsPassed,
    quadratureProvenancePassed: arm.quadratureProvenancePassed,
    hashBindings: arm.hashBindings,
    failureReasons: arm.failureReasons,
    projection: arm.projection,
    compactProjectionSha256: arm.compactProjectionSha256,
  });
}

export function mainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNegativeArtifactFlagsV1(
  evidence?: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
) {
  return Object.freeze({
    activeDeliveryAbsorptionSplitEstablished:
      evidence?.activeDeliveryAbsorptionSplitEstablished ?? false,
    instantaneousPowerEstablished:
      evidence?.instantaneousPowerEstablished ?? false,
    publicLiveOutputCatalogAdmissionEstablished:
      evidence?.publicLiveOutputCatalogAdmissionEstablished ?? false,
    publicGraphCatalogAdmissionEstablished:
      evidence?.publicGraphCatalogAdmissionEstablished ?? false,
    PEEstablished: evidence?.PEEstablished ?? false,
    PVAEstablished: evidence?.PVAEstablished ?? false,
    MVO2Established: evidence?.MVO2Established ?? false,
    ATPUseEstablished: evidence?.ATPUseEstablished ?? false,
    mechanicalEfficiencyEstablished:
      evidence?.mechanicalEfficiencyEstablished ?? false,
    physiologicalValidationEstablished:
      evidence?.physiologicalValidationEstablished ?? false,
    clinicalValidationClaimed: evidence?.clinicalValidationClaimed ?? false,
  });
}

export function createMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyExecutionFailureArtifactPayloadV1(
  error: unknown,
) {
  const context = executionFailureContextV1(error);
  const failure = Object.freeze({
    name: error instanceof Error ? error.name : "NonErrorThrown",
    message: error instanceof Error ? error.message : String(error),
    arm: context.arm,
    stage: context.stage,
  });
  return Object.freeze({
    ...mainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArtifactCommonV1(),
    execution: Object.freeze({
      status: "execution-failed" as const,
      failure,
    }),
    outcome: Object.freeze({
      status: "execution-failed" as const,
      failureReasons: Object.freeze([`${failure.name}: ${failure.message}`]),
    }),
    evidenceStatus: null,
    coarse: context.coarse,
    fine: context.fine,
    admission: null,
    pairSealedPayloadSha256: null,
    officialSealedMechanicalEnergyAnalysisEligible: false as const,
    ...mainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNegativeArtifactFlagsV1(),
  });
}

function executionFailureContextV1(error: unknown): Readonly<{
  arm: "coarse" | "fine" | null;
  stage: string;
  coarse: ReturnType<
    typeof compactMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceArtifactV1
  > | null;
  fine: ReturnType<
    typeof compactMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceArtifactV1
  > | null;
}> {
  if (typeof error !== "object" || error === null) {
    return Object.freeze({
      arm: null,
      stage: "official-runner",
      coarse: null,
      fine: null,
    });
  }
  const record = error as Record<string, unknown>;
  const arm =
    record.arm === "coarse" || record.arm === "fine" ? record.arm : null;
  const stage =
    typeof record.stage === "string" && record.stage.length > 0
      ? record.stage
      : "official-runner";
  const completedArms =
    typeof record.completedArms === "object" && record.completedArms !== null
      ? (record.completedArms as Record<string, unknown>)
      : {};
  return Object.freeze({
    arm,
    stage,
    coarse: compactRetainedArmV1(completedArms.coarse, "coarse"),
    fine: compactRetainedArmV1(completedArms.fine, "fine"),
  });
}

function compactRetainedArmV1(
  value: unknown,
  expectedGrid: "coarse" | "fine",
): ReturnType<
  typeof compactMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceArtifactV1
> | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    record.grid !== expectedGrid ||
    (record.status !== "projection-sealed" && record.status !== "not-sealed")
  ) {
    return null;
  }
  return compactMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceArtifactV1(
    value as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1,
  );
}
