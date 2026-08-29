import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_PRIOR_LOAD_ENVELOPE_SELECTED_CANDIDATE_V1 as CANDIDATE,
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_SELECTION_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowVelocityDistortionCandidateV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_CANDIDATE_DT_V1_ID =
  "main-wire-aortic-outflow-velocity-distortion-candidate-dt-v1" as const;

const dtValuesSec = Object.freeze([0.004, 0.002, 0.001, 0.0005] as const);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const rawArms = dtValuesSec.map((dtSec) => {
  const run =
    runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
      { dtSec, maximumBeatCount },
      CANDIDATE.kuwProfileId,
      CANDIDATE.complianceProfileId,
      CANDIDATE.characteristicResistancePlacementProfileId,
      CANDIDATE.rootInertanceProfileId,
      CANDIDATE.sarcomereReferenceProfileId,
      CANDIDATE.calciumSensitivityLengthProfileId,
      CANDIDATE.twitchRetentionCandidateId,
      "baseline",
      "baseline",
      CANDIDATE.trefForceLoadProfileId,
      CANDIDATE.sourceVelocityDistortionProfileId,
      CANDIDATE.strongBridgeDeactivationExitProfileId,
    );
  return Object.freeze({
    dtSec,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
      run.periodicResult,
      run.calciumDriveParams,
      `dt-${dtSec}`,
    ),
    diastolicFlow:
      measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
        run.periodicResult,
      ),
    runnerClaim: run.claim,
  });
});
const reference = rawArms[rawArms.length - 1]!;
const arms = Object.freeze(rawArms.map((arm) => Object.freeze({
  ...arm,
  differenceFromFinest: Object.freeze({
    ejectionTimeSec:
      arm.cycle.aorticEjectionTimeProxySec
      - reference.cycle.aorticEjectionTimeProxySec,
    accelerationTimeSec:
      arm.cycle.timeFromAorticFlowOnsetToPeakSec
      - reference.cycle.timeFromAorticFlowOnsetToPeakSec,
    aorticForwardVolumeMl:
      arm.cycle.aorticForwardVolumeMl
      - reference.cycle.aorticForwardVolumeMl,
    peakVenaContractaVelocityMPerSec:
      arm.cycle.peakVenaContractaVelocityMPerSec
      - reference.cycle.peakVenaContractaVelocityMPerSec,
    meanDopplerGradientMmHg:
      arm.cycle.meanDopplerGradientMmHg
      - reference.cycle.meanDopplerGradientMmHg,
    peakDopplerGradientMmHg:
      arm.cycle.peakDopplerGradientMmHg
      - reference.cycle.peakDopplerGradientMmHg,
    meanAorticPressureMmHg:
      arm.cycle.meanAorticAbsolutePressureMmHg
      - reference.cycle.meanAorticAbsolutePressureMmHg,
  }),
})));
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_CANDIDATE_DT_V1_ID,
  design: Object.freeze({
    dtValuesSec,
    maximumBeatCount,
    independentCanonicalColdStartPerRun: true as const,
    candidateFixedBeforeDtComparison: true as const,
    candidate: CANDIDATE,
    candidateSelectionClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_SELECTION_CLAIM_V1,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    finestDtIsExactContinuumSolutionClaimed: false as const,
    acceptedStepThresholdMetricsHaveDtQuantization: true as const,
    allArmsMustRemainPeriod1AndSinglePeak: true as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    clinicalValidationEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
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
    arms: arms.map((arm) => ({
      dtSec: arm.dtSec,
      terminationReason: arm.cycle.terminationReason,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      fullyOpenUniformFlowDopplerGradientLowerBoundMmHg:
        arm.cycle.aorticFullyOpenUniformFlowDopplerGradientLowerBoundMmHg,
      dynamicAreaDopplerPenaltyFactor:
        arm.cycle.aorticDynamicAreaDopplerPenaltyFactor,
      jetVelocityWaveformNonuniformityFactor:
        arm.cycle.aorticJetVelocityWaveformNonuniformityFactor,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      diastolicFlow: arm.diastolicFlow.value,
      diastolicFlowUnavailabilityReason: arm.diastolicFlow.reason,
      differenceFromFinest: arm.differenceFromFinest,
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

function integerArgument(name: string, fallback: number): number {
  const value = optionalArgument(name);
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!(parsed > 0) || !Number.isInteger(parsed)) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}
