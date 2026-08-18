import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_POLICY_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_TBV_RATIOS_V1,
  assessMainWireIntegratedModelPeriodicValveEventLocusV1,
  type MainWireIntegratedModelPeriodicValveEventLocusRunV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicValveEventLocusV1";
import {
  runMainWireIntegratedModelPeriodicSteadyV3,
  type MainWireIntegratedModelPeriodicSteadyResultV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

const outputPath = requiredArgument("--output");
const policy =
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_POLICY_V1;
const baselineTotalBloodVolumeMl =
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3
    .totalBloodVolumeMl;
const completed: CompletedRun[] = [];

for (
  let index = 0;
  index < MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_TBV_RATIOS_V1.length;
  index += 1
) {
  const totalBloodVolumeRatio =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_TBV_RATIOS_V1[index]!;
  const totalBloodVolumeMl = baselineTotalBloodVolumeMl * totalBloodVolumeRatio;
  progress(
    `[${index + 1}/${policy.requiredLoadCount}] independent canonical fixed-TBV ` +
      `${totalBloodVolumeRatio.toFixed(2)} (${totalBloodVolumeMl.toFixed(3)} mL)`,
  );
  const result = await runMainWireIntegratedModelPeriodicSteadyV3({
    nominalDtSec: policy.nominalDtSec,
    maximumCycleCount: policy.maximumCycleCount,
    executionPurpose: policy.executionPurpose,
    hemodynamicResearchInputs: Object.freeze({
      ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      totalBloodVolumeMl,
    }),
    mechanismResearchInputs:
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  });
  progress(
    `TBV ratio ${totalBloodVolumeRatio.toFixed(2)}: ` +
      `${result.terminationReason} after ${result.completedCycleCount} cycles`,
  );
  completed.push(Object.freeze({ totalBloodVolumeRatio, totalBloodVolumeMl, result }));
}

const assessment = assessMainWireIntegratedModelPeriodicValveEventLocusV1(
  completed.map(assessmentRun),
);
const runEvidence = await Promise.all(completed.map(compactRunEvidence));
const payload = Object.freeze({
  artifactSchemaVersion: 1 as const,
  artifactId:
    "main-wire-integrated-model-periodic-valve-event-locus-evidence-v1" as const,
  declarationOrder:
    "preflight-corrected-policy-committed-before-first-nine-load-numerical-output" as const,
  policy,
  baselineTotalBloodVolumeMl,
  runEvidence,
  assessment,
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
  eventDefinedLocusEstablished: assessment.eventDefinedLocusEstablished,
  biventricularBothPressureBasesLinearDiagnosticPassed:
    assessment.biventricularBothPressureBasesLinearDiagnosticPassed,
  officialExperimentEventLocusEligible:
    assessment.officialExperimentEventLocusEligible,
  espvrAdmissionEstablished: assessment.espvrAdmissionEstablished,
  edpvrAdmissionEstablished: assessment.edpvrAdmissionEstablished,
  pvaAdmissionEstablished: assessment.pvaAdmissionEstablished,
})}\n`);
if (!assessment.officialExperimentEventLocusEligible) process.exitCode = 1;

type CompletedRun = Readonly<{
  totalBloodVolumeRatio: number;
  totalBloodVolumeMl: number;
  result: MainWireIntegratedModelPeriodicSteadyResultV3;
}>;

function assessmentRun(
  completedRun: CompletedRun,
): MainWireIntegratedModelPeriodicValveEventLocusRunV1 {
  const { result } = completedRun;
  return Object.freeze({
    totalBloodVolumeRatio: completedRun.totalBloodVolumeRatio,
    totalBloodVolumeMl: completedRun.totalBloodVolumeMl,
    nominalDtSec: result.nominalDtSec,
    executionPurpose: result.executionPurpose,
    modelConditionIdentityHash: result.modelConditionIdentityHash,
    protocolIdentityHash: result.protocolIdentityHash,
    numericalPeriod1Established: result.numericalPeriod1Established,
    allCyclesFiniteConservedAndEventExact:
      result.allCyclesFiniteConservedAndEventExact,
    terminalCheckpointSha256: result.terminalCheckpoint.checkpointSha256,
    terminalCheckpointExactRoundTripVerified:
      result.terminalCheckpointExactRoundTripVerified,
    terminalCycleStartTraceSample: result.terminalCycleStartTraceSample,
    terminalCycleTrace: result.terminalCycleTrace,
  });
}

async function compactRunEvidence(completedRun: CompletedRun) {
  const { result } = completedRun;
  const pressureWork = result.terminalPeriodicPressureBasisWork;
  return Object.freeze({
    totalBloodVolumeRatio: completedRun.totalBloodVolumeRatio,
    totalBloodVolumeMl: completedRun.totalBloodVolumeMl,
    nominalDtSec: result.nominalDtSec,
    executionPurpose: result.executionPurpose,
    numericalAccess: result.numericalAccess,
    modelConditionIdentityHash: result.modelConditionIdentityHash,
    protocolIdentityHash: result.protocolIdentityHash,
    completedCycleCount: result.completedCycleCount,
    terminationReason: result.terminationReason,
    classification: result.classification,
    numericalPeriod1Established: result.numericalPeriod1Established,
    allCyclesFiniteConservedAndEventExact:
      result.allCyclesFiniteConservedAndEventExact,
    terminalCycleStartTraceSampleSha256:
      result.terminalCycleStartTraceSample === null
        ? null
        : await sha256CanonicalJsonHex(result.terminalCycleStartTraceSample),
    terminalCycleTraceSampleCount: result.terminalCycleTrace.sampleCount,
    terminalCycleTraceSha256: await sha256CanonicalJsonHex(
      result.terminalCycleTrace,
    ),
    terminalCheckpointSha256: result.terminalCheckpoint.checkpointSha256,
    terminalCheckpointExactRoundTripVerified:
      result.terminalCheckpointExactRoundTripVerified,
    periodicPressureBasisWork: Object.freeze({
      status: pressureWork.status,
      leftVentricle: compactPressureWork(pressureWork.leftVentricle),
      rightVentricle: compactPressureWork(pressureWork.rightVentricle),
      pvaEstablished: pressureWork.pvaEstablished,
    }),
  });
}

function compactPressureWork(
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
    pvaEstablished: chamber.pvaEstablished,
    failureReasons: chamber.failureReasons,
  });
}

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (value === undefined || value.length === 0) {
    throw new Error(`missing required ${name} argument`);
  }
  return value;
}

function progress(message: string): void {
  process.stderr.write(`${message}\n`);
}
