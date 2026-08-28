import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ENVELOPE_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_POINT_IDS_V1,
  compareMainWireAorticOutflowLengthDependenceEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowLengthDependenceEnvelopeV1";
import {
  runMainWireNormalAdultFiveWallVentricularLengthDependenceResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ENVELOPE_EXPERIMENT_V1_ID =
  "main-wire-aortic-outflow-length-dependence-envelope-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const runs = MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_POINT_IDS_V1.map(
  (pointId) => Object.freeze({
    pointId,
    run: runMainWireNormalAdultFiveWallVentricularLengthDependenceResearchV1(
      { dtSec, maximumBeatCount },
      pointId,
    ),
  }),
);
const comparison = compareMainWireAorticOutflowLengthDependenceEnvelopeV1(
  runs.map(({ pointId, run }) => Object.freeze({
    pointId,
    periodicResult: run.periodicResult,
  })),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ENVELOPE_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    pointOrder: MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_POINT_IDS_V1,
    claim: MAIN_WIRE_AORTIC_OUTFLOW_LENGTH_DEPENDENCE_ENVELOPE_CLAIM_V1,
  }),
  resolvedPoints: Object.freeze(runs.map(({ run }) => Object.freeze({
    materialPoint: run.materialPoint,
    exactProtocolIdentityHash: run.periodicResult.protocolIdentityHash,
    runnerClaim: run.claim,
  }))),
  comparison,
  interpretationBoundary: Object.freeze({
    exactOffIsPhysiologicalCandidate: false as const,
    independentLengthDependenceRecalibrationRequired: true as const,
    clinicalValidationEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
    dtRefinementRequiredBeforeAdoption: true as const,
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
    referenceLengthIsometricInvariance:
      report.comparison.referenceLengthIsometricInvariance,
    sampledDirectionality: report.comparison.sampledDirectionality,
    stableNonzeroBranchDirectionality:
      report.comparison.stableNonzeroBranchDirectionality,
    exactOffBoundary: report.comparison.exactOffBoundary,
    arms: report.comparison.arms.map((arm) => ({
      pointId: arm.pointId,
      terminationReason: arm.cycle.terminationReason,
      periodicSteadyStateClaimed: arm.cycle.periodicSteadyStateClaimed,
      lengthDependenceScale:
        arm.materialPoint
          .ventricularLandLengthDependenceScaleFromBaseline,
      aorticMaximumFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      aorticEjectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      ejectionTimeGapToHealthyLower95PiMs:
        arm.ejectionTimeGapToHealthyLower95PiSec * 1000,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      cardiacOutputLPerMin: arm.cycle.netAorticCardiacOutputLPerMin,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      aorticPulsePressureMmHg: arm.aorticPulsePressureMmHg,
      peakLeftVentricularPressureMmHg:
        arm.cycle.peakLeftVentricularPressureMmHg,
      lvfwActiveStressAtFlowEndToPeakRatio:
        arm.loadedLvfw.activeStressAtFlowEndToPeakRatio,
      aorticFlowPeakCount:
        arm.cycle.aorticFlowPeakCountAboveFivePercent,
      candidateScreen: arm.candidateScreen,
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
