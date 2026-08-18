import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1,
  runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1";

const ARTIFACT_ID =
  "main-wire-integrated-model-periodic-five-wall-mechanical-energy-evidence-v1" as const;
const outputPath = requiredArgument("--output");

await runCliV1(outputPath);

async function runCliV1(requestedOutputPath: string): Promise<void> {
  progress("running canonical periodic five-wall mechanical-energy evidence");
  let evidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1;
  try {
    evidence =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1();
  } catch (error) {
    const retained = await writeArtifactV1(
      requestedOutputPath,
      executionFailurePayloadV1(error),
    );
    writeSummaryV1(retained, "execution-failed", false);
    process.exitCode = 1;
    return;
  }

  const payload = completedPayloadV1(evidence);
  const retained = await writeArtifactV1(requestedOutputPath, payload);
  writeSummaryV1(
    retained,
    payload.outcome.status,
    payload.officialSealedMechanicalEnergyAnalysisEligible,
  );
  if (!payload.officialSealedMechanicalEnergyAnalysisEligible) {
    process.exitCode = 1;
  }
}

function completedPayloadV1(
  evidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
) {
  const admission = compactAdmissionV1(evidence.admission);
  const failureReasons =
    evidence.admission === null
      ? Object.freeze([
          ...evidence.coarse.failureReasons.map((reason) => `coarse:${reason}`),
          ...evidence.fine.failureReasons.map((reason) => `fine:${reason}`),
        ])
      : Object.freeze([...evidence.admission.failureReasons]);
  const outcomeStatus = evidence.officialSealedMechanicalEnergyAnalysisEligible
    ? "admitted"
    : evidence.status === "evidence-verification-failed"
      ? "evidence-verification-failed"
      : "admission-failed";
  return Object.freeze({
    ...artifactCommonV1(),
    execution: Object.freeze({
      status: "completed" as const,
      failure: null,
    }),
    outcome: Object.freeze({
      status: outcomeStatus,
      failureReasons,
    }),
    evidenceStatus: evidence.status,
    coarse: compactArmEvidenceV1(evidence.coarse),
    fine: compactArmEvidenceV1(evidence.fine),
    admission,
    pairSealedPayloadSha256: evidence.pairSealedPayloadSha256,
    officialSealedMechanicalEnergyAnalysisEligible:
      evidence.officialSealedMechanicalEnergyAnalysisEligible,
    ...negativeFlagsV1(evidence),
  });
}

function executionFailurePayloadV1(error: unknown) {
  const failure =
    error instanceof Error
      ? Object.freeze({ name: error.name, message: error.message })
      : Object.freeze({ name: "NonErrorThrown", message: String(error) });
  return Object.freeze({
    ...artifactCommonV1(),
    execution: Object.freeze({
      status: "execution-failed" as const,
      failure,
    }),
    outcome: Object.freeze({
      status: "execution-failed" as const,
      failureReasons: Object.freeze([`${failure.name}: ${failure.message}`]),
    }),
    evidenceStatus: null,
    coarse: null,
    fine: null,
    admission: null,
    pairSealedPayloadSha256: null,
    officialSealedMechanicalEnergyAnalysisEligible: false as const,
    ...negativeFlagsV1(),
  });
}

function artifactCommonV1() {
  return Object.freeze({
    artifactSchemaVersion: 1 as const,
    artifactId: ARTIFACT_ID,
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

function compactArmEvidenceV1(
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

function compactAdmissionV1(
  admission: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1 | null,
) {
  if (admission === null) return null;
  const {
    coarse: _coarseProjection,
    fine: _fineProjection,
    policy: _policy,
    ...assessment
  } = admission;
  return Object.freeze(assessment);
}

function negativeFlagsV1(
  evidence?: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
) {
  return Object.freeze({
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

async function writeArtifactV1(
  requestedOutputPath: string,
  payload:
    | ReturnType<typeof completedPayloadV1>
    | ReturnType<typeof executionFailurePayloadV1>,
) {
  const artifactPayloadSha256 = await sha256CanonicalJsonHex(payload);
  const artifact = Object.freeze({ ...payload, artifactPayloadSha256 });
  const serialized = `${canonicalJsonStringify(artifact)}\n`;
  const absoluteOutputPath = path.resolve(requestedOutputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  return Object.freeze({
    absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    artifactPayloadSha256,
  });
}

function writeSummaryV1(
  retained: Awaited<ReturnType<typeof writeArtifactV1>>,
  status: string,
  eligible: boolean,
): void {
  process.stdout.write(
    `${JSON.stringify({
      artifactId: ARTIFACT_ID,
      outputPath: retained.absoluteOutputPath,
      byteLength: retained.byteLength,
      artifactPayloadSha256: retained.artifactPayloadSha256,
      status,
      officialSealedMechanicalEnergyAnalysisEligible: eligible,
    })}\n`,
  );
}

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (value === undefined || value.length === 0 || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function progress(message: string): void {
  process.stderr.write(`${message}\n`);
}
