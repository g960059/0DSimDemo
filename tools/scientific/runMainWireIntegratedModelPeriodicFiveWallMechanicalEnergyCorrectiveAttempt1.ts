import { type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1";
import {
  runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CORRECTIVE_ATTEMPT_1_ARTIFACT_ID,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CORRECTIVE_ATTEMPT_1_OUTPUT_PATH,
  compactMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceArtifactV1,
  createMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyExecutionFailureArtifactPayloadV1,
  mainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArtifactCommonV1,
  mainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNegativeArtifactFlagsV1,
  preflightMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceOutputV1,
  writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1,
} from "@/tools/scientific/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactV1";

const outputPath =
  preflightMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceOutputV1(
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CORRECTIVE_ATTEMPT_1_OUTPUT_PATH,
  );

await runCorrectiveAttempt1(outputPath);

async function runCorrectiveAttempt1(
  absoluteOutputPath: string,
): Promise<void> {
  progress(
    "running canonical periodic five-wall mechanical-energy corrective attempt 1",
  );
  let evidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1;
  try {
    evidence =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1();
  } catch (error) {
    const retained =
      await writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1(
        absoluteOutputPath,
        createMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyExecutionFailureArtifactPayloadV1(
          error,
          "corrective-attempt-1",
        ),
      );
    writeSummary(retained, "execution-failed", false);
    process.exitCode = 1;
    return;
  }

  const payload = completedPayload(evidence);
  const retained =
    await writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1(
      absoluteOutputPath,
      payload,
    );
  writeSummary(
    retained,
    payload.outcome.status,
    payload.officialSealedMechanicalEnergyAnalysisEligible,
  );
  if (!payload.officialSealedMechanicalEnergyAnalysisEligible) {
    process.exitCode = 1;
  }
}

function completedPayload(
  evidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
) {
  const admission = compactAdmission(evidence.admission);
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
    ...mainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArtifactCommonV1(
      "corrective-attempt-1",
    ),
    execution: Object.freeze({
      status: "completed" as const,
      failure: null,
    }),
    outcome: Object.freeze({
      status: outcomeStatus,
      failureReasons,
    }),
    evidenceStatus: evidence.status,
    coarse:
      compactMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceArtifactV1(
        evidence.coarse,
      ),
    fine: compactMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceArtifactV1(
      evidence.fine,
    ),
    admission,
    pairSealedPayloadSha256: evidence.pairSealedPayloadSha256,
    officialSealedMechanicalEnergyAnalysisEligible:
      evidence.officialSealedMechanicalEnergyAnalysisEligible,
    ...mainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNegativeArtifactFlagsV1(
      evidence,
    ),
  });
}

function compactAdmission(
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

function writeSummary(
  retained: Awaited<
    ReturnType<
      typeof writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1
    >
  >,
  status: string,
  eligible: boolean,
): void {
  process.stdout.write(
    `${JSON.stringify({
      artifactId:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CORRECTIVE_ATTEMPT_1_ARTIFACT_ID,
      outputPath: retained.absoluteOutputPath,
      byteLength: retained.byteLength,
      artifactPayloadSha256: retained.artifactPayloadSha256,
      status,
      officialSealedMechanicalEnergyAnalysisEligible: eligible,
    })}\n`,
  );
}

function progress(message: string): void {
  process.stderr.write(`${message}\n`);
}
