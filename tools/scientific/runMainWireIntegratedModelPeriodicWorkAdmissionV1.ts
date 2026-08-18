import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1,
  assessMainWireIntegratedModelPeriodicPressureBasisArmsV1,
  compareMainWireIntegratedModelPeriodicWorkRefinementV1,
  decideMainWireIntegratedModelPeriodicWorkAdmissionV1,
  type MainWireIntegratedModelPeriodicPressureBasisArmIdV1,
  type MainWireIntegratedModelPeriodicPressureBasisArmRunV1,
  type MainWireIntegratedModelPeriodicWorkRefinementRunV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicWorkAdmissionV1";
import {
  runMainWireIntegratedModelPeriodicSteadyForWorkRefinementV1,
  type MainWireIntegratedModelPeriodicSteadyResultV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";

const outputPath = requiredArgument("--output");
const maximumCycleCount = 250;

progress("[1/4] canonical normal-default at 1 ms");
const coarse = await runArm(
  "normal-default",
  0.001,
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
);

progress("[2/4] canonical normal-default at 0.5 ms");
const fine = await runArm(
  "normal-default",
  0.0005,
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
);

const peepInputs = Object.freeze({
  ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  peepCmH2O: 10,
});
progress("[3/4] canonical peep-10-cmh2o at 1 ms");
const peep = await runArm(
  "peep-10-cmh2o",
  0.001,
  peepInputs,
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
);

const effusionInputs = Object.freeze({
  ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  pericardium: Object.freeze({
    ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
      .pericardium,
    prescribedFluidVolumeMl: 200,
  }),
});
progress("[4/4] characterization-only pericardial-effusion-200ml at 1 ms");
let effusion: CompletedArm | null = null;
let effusionExecutionError: string | null = null;
try {
  effusion = await runArm(
    "pericardial-effusion-200ml",
    0.001,
    MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    effusionInputs,
  );
} catch (error) {
  effusionExecutionError = error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);
  progress(
    `characterization-only arm did not complete: ${effusionExecutionError}`,
  );
}

const numericalComparison =
  compareMainWireIntegratedModelPeriodicWorkRefinementV1(
    refinementRun(coarse.result),
    refinementRun(fine.result),
  );
const pressureArmRuns: MainWireIntegratedModelPeriodicPressureBasisArmRunV1[] = [
  pressureArmRun(coarse),
  pressureArmRun(peep),
  ...(effusion === null ? [] : [pressureArmRun(effusion)]),
];
const pressureBasisAdmission =
  assessMainWireIntegratedModelPeriodicPressureBasisArmsV1(pressureArmRuns);
const admissionDecision = decideMainWireIntegratedModelPeriodicWorkAdmissionV1(
  numericalComparison,
  pressureBasisAdmission,
);
const completedRuns = [coarse, fine, peep, ...(effusion === null ? [] : [effusion])];
const runEvidence = await Promise.all(completedRuns.map(compactRunEvidence));
const payload = Object.freeze({
  artifactSchemaVersion: 1 as const,
  artifactId:
    "main-wire-integrated-model-periodic-work-admission-evidence-v1" as const,
  declarationOrder:
    "policy-committed-before-first-new-0.5ms-execution" as const,
  policy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1,
  runEvidence,
  characterizationOnlyExecution: Object.freeze({
    armId: "pericardial-effusion-200ml" as const,
    completed: effusion !== null,
    executionError: effusionExecutionError,
    gatesAdmission: false as const,
  }),
  numericalComparison,
  pressureBasisAdmission,
  admissionDecision,
});
const artifactPayloadSha256 = await sha256CanonicalJsonHex(payload);
const artifact = Object.freeze({ ...payload, artifactPayloadSha256 });
const serialized = `${canonicalJsonStringify(artifact)}\n`;
const absoluteOutputPath = path.resolve(outputPath);
mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
writeFileSync(absoluteOutputPath, serialized, "utf8");

process.stdout.write(`${JSON.stringify({
  artifactId: artifact.artifactId,
  outputPath: absoluteOutputPath,
  byteLength: Buffer.byteLength(serialized),
  artifactPayloadSha256,
  numericalAdmissionPassed: numericalComparison.numericalAdmissionPassed,
  pressureBasisAdmissionPassed:
    pressureBasisAdmission.pressureBasisAdmissionPassed,
  officialExperimentOutputAdmissionEligible:
    admissionDecision.officialExperimentOutputAdmissionEligible,
  publicLiveOutputCatalogAdmissionEstablished:
    admissionDecision.publicLiveOutputCatalogAdmissionEstablished,
  characterizationOnlyArmCompleted: effusion !== null,
})}\n`);
if (!admissionDecision.officialExperimentOutputAdmissionEligible) {
  process.exitCode = 1;
}

type CompletedArm = Readonly<{
  armId: MainWireIntegratedModelPeriodicPressureBasisArmIdV1;
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3;
  result: MainWireIntegratedModelPeriodicSteadyResultV3;
}>;

async function runArm(
  armId: MainWireIntegratedModelPeriodicPressureBasisArmIdV1,
  nominalDtSec: 0.001 | 0.0005,
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3,
): Promise<CompletedArm> {
  const result =
    await runMainWireIntegratedModelPeriodicSteadyForWorkRefinementV1({
      nominalDtSec,
      maximumCycleCount,
      executionPurpose: "canonical-evidence",
      hemodynamicResearchInputs,
      mechanismResearchInputs,
    });
  progress(
    `${armId} ${nominalDtSec}s: ${result.terminationReason} after ` +
      `${result.completedCycleCount} cycles`,
  );
  return Object.freeze({
    armId,
    hemodynamicResearchInputs,
    mechanismResearchInputs,
    result,
  });
}

function refinementRun(
  result: MainWireIntegratedModelPeriodicSteadyResultV3,
): MainWireIntegratedModelPeriodicWorkRefinementRunV1 {
  return Object.freeze({
    executionPurpose: "canonical-evidence" as const,
    numericalAccess: result.numericalAccess,
    nominalDtSec: result.nominalDtSec,
    modelConditionIdentityHash: result.modelConditionIdentityHash,
    protocolIdentityHash: result.protocolIdentityHash,
    numericalPeriod1Established: result.numericalPeriod1Established,
    terminalCheckpointExactRoundTripVerified:
      result.terminalCheckpointExactRoundTripVerified,
    terminalPressureBasisWork: result.terminalPeriodicPressureBasisWork,
  });
}

function pressureArmRun(
  arm: CompletedArm,
): MainWireIntegratedModelPeriodicPressureBasisArmRunV1 {
  return Object.freeze({
    armId: arm.armId,
    peepCmH2O: arm.hemodynamicResearchInputs.peepCmH2O,
    prescribedPericardialFluidVolumeMl:
      arm.mechanismResearchInputs.pericardium.prescribedFluidVolumeMl,
    ...refinementRun(arm.result),
  });
}

async function compactRunEvidence(arm: CompletedArm) {
  const result = arm.result;
  const work = result.terminalPeriodicPressureBasisWork;
  return Object.freeze({
    armId: arm.armId,
    peepCmH2O: arm.hemodynamicResearchInputs.peepCmH2O,
    prescribedPericardialFluidVolumeMl:
      arm.mechanismResearchInputs.pericardium.prescribedFluidVolumeMl,
    nominalDtSec: result.nominalDtSec,
    numericalAccess: result.numericalAccess,
    modelConditionIdentityHash: result.modelConditionIdentityHash,
    protocolIdentityHash: result.protocolIdentityHash,
    completedCycleCount: result.completedCycleCount,
    terminationReason: result.terminationReason,
    classification: result.classification,
    numericalPeriod1Established: result.numericalPeriod1Established,
    allCyclesFiniteConservedAndEventExact:
      result.allCyclesFiniteConservedAndEventExact,
    terminalCycleTraceSampleCount: result.terminalCycleTrace.sampleCount,
    terminalCycleTraceSha256: await sha256CanonicalJsonHex(
      result.terminalCycleTrace,
    ),
    terminalCheckpointSha256: result.terminalCheckpoint.checkpointSha256,
    terminalCheckpointExactRoundTripVerified:
      result.terminalCheckpointExactRoundTripVerified,
    pressureBasisWork: Object.freeze({
      status: work.status,
      leftVentricle: compactChamberWork(work.leftVentricle),
      rightVentricle: compactChamberWork(work.rightVentricle),
      conventionalPvLoopExternalWorkEstablishedBiventricular:
        work.conventionalPvLoopExternalWorkEstablishedBiventricular,
      pvaEstablished: work.pvaEstablished,
    }),
  });
}

function compactChamberWork(
  chamber:
    MainWireIntegratedModelPeriodicSteadyResultV3[
      "terminalPeriodicPressureBasisWork"
    ]["leftVentricle"],
) {
  return Object.freeze({
    qualifiedWorkMmHgMl: chamber.qualifiedWorkMmHgMl,
    cavityPressureVolumeClosure: chamber.cavityPressureVolumeClosure,
    transmuralPressureVolumeClosure: chamber.transmuralPressureVolumeClosure,
    decompositionResidualMmHgMl: chamber.decompositionResidualMmHgMl,
    decompositionPassed: chamber.decompositionPassed,
    failureReasons: chamber.failureReasons,
  });
}

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function progress(message: string): void {
  process.stderr.write(`${message}\n`);
}
