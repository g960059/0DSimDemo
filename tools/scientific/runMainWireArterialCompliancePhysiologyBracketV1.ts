import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  inputsFromMainWireArterialCompliancePhysiologyRunsV1,
  measureMainWireArterialCompliancePhysiologyBracketV1,
} from "@/analysis/methods/mainWire/MainWireArterialCompliancePhysiologyBracketV1";
import {
  MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_CLAIM_V1,
  MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_V1_ID,
  MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_PROFILE_IDS_V1,
} from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";
import {
  runMainWireNormalAdultFiveWallArterialCompliancePhysiologyResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const runs = MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_PROFILE_IDS_V1.map(
  (profileId) =>
    runMainWireNormalAdultFiveWallArterialCompliancePhysiologyResearchV1(
      { dtSec, maximumBeatCount },
      profileId,
    ),
);
const analysis = measureMainWireArterialCompliancePhysiologyBracketV1(
  inputsFromMainWireArterialCompliancePhysiologyRunsV1(runs),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    profileOrder:
      MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_PROFILE_IDS_V1,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  exactProtocolIdentityHashes: Object.freeze(runs.map((run) => Object.freeze({
    profileId: run.profile.profileId,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    protocolComponentHashes: run.periodicResult.protocolComponentHashes,
  }))),
  analysis,
  experimentClaim:
    MAIN_WIRE_ARTERIAL_COMPLIANCE_PHYSIOLOGY_BRACKET_CLAIM_V1,
  interpretationBoundary: Object.freeze({
    physiologyMagnitudeComparisonIsCalibration: false as const,
    bloodVolumeRecalibrated: false as const,
    systemicResistanceRecalibrated: false as const,
    candidateCanonicalAdoptionEstablished: false as const,
    dtRefinementCompleted: false as const,
    loadEnvelopeCompleted: false as const,
  }),
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  process.stdout.write(`${JSON.stringify({
    experimentId: report.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    arms: analysis.arms.map((arm) => ({
      profileId: arm.profile.profileId,
      arterialStiffnessScale:
        arm.profile.arterialStiffnessScaleFromBaseline,
      terminationReason: arm.cycle.terminationReason,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      strokeVolumeMl: arm.cycle.aorticForwardVolumeMl,
      maximumFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      aorticPulsePressureMmHg: arm.aorticPulsePressureMmHg,
      strokeVolumeOverPulsePressureMlPerMmHg:
        arm.strokeVolumeOverAorticPulsePressureMlPerMmHg,
      summedMeanTangentComplianceMlPerMmHg:
        arm.tangentCompliance.summedAllThreeArterialNodes
          .arithmeticMeanMlPerMmHg,
      aorticRootMeanTangentComplianceMlPerMmHg:
        arm.tangentCompliance.byNode.Ao.arithmeticMeanMlPerMmHg,
      positiveAorticRootAccumulationVolumeMl:
        arm.positiveAorticRootAccumulationVolumeMl,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
    })),
  })}\n`);
}

function optionalArgument(name: string): string | null {
  const equalsArgument = process.argv.find((argument) =>
    argument.startsWith(`${name}=`));
  if (equalsArgument !== undefined) {
    const value = equalsArgument.slice(name.length + 1);
    if (value === "") throw new Error(`${name} requires a value`);
    return value;
  }
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function numericArgument(name: string, fallback: number): number {
  const value = optionalArgument(name);
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!(parsed > 0) || !Number.isFinite(parsed)) {
    throw new Error(`${name} must be positive and finite`);
  }
  return parsed;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}
