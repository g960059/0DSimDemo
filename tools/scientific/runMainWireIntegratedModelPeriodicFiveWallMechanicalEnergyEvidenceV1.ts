import { type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1";
import {
  runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_EVIDENCE_ARTIFACT_V1_ID,
  compactMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceArtifactV1,
  createMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyExecutionFailureArtifactPayloadV1,
  mainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArtifactCommonV1,
  mainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNegativeArtifactFlagsV1,
  preflightMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceOutputV1,
  writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1,
} from "@/tools/scientific/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactV1";

const outputPath =
  preflightMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceOutputV1(
    requiredArgument("--output"),
  );

await runCliV1(outputPath);

async function runCliV1(requestedOutputPath: string): Promise<void> {
  progress("running canonical periodic five-wall mechanical-energy evidence");
  let evidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1;
  try {
    evidence =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1();
  } catch (error) {
    const retained =
      await writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1(
        requestedOutputPath,
        createMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyExecutionFailureArtifactPayloadV1(
          error,
        ),
      );
    writeSummaryV1(retained, "execution-failed", false);
    process.exitCode = 1;
    return;
  }

  const payload = completedPayloadV1(evidence);
  const retained =
    await writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1(
      requestedOutputPath,
      payload,
    );
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
    ...mainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArtifactCommonV1(),
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

function writeSummaryV1(
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
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_EVIDENCE_ARTIFACT_V1_ID,
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
