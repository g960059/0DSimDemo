import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V6 as CANDIDATE,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V6_CLAIM,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV6";

export const MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_DT_V1_ID =
  "main-wire-aortic-outflow-source-twitch-retention-dt-v1" as const;

const dtValuesSec = Object.freeze([0.004, 0.002, 0.001, 0.0005] as const);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const arms = dtValuesSec.map((dtSec) => {
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
    runnerClaim: run.claim,
  });
});
const reference = arms[arms.length - 1]!;
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_OUTFLOW_SOURCE_TWITCH_RETENTION_DT_V1_ID,
  design: Object.freeze({
    dtValuesSec,
    maximumBeatCount,
    independentCanonicalColdStartPerRun: true as const,
    candidateFixedBeforeDtComparison: true as const,
    candidate: CANDIDATE,
    candidateClaim: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V6_CLAIM,
    parameterSearchOrFitting: false as const,
  }),
  arms: Object.freeze(arms.map((arm) => Object.freeze({
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
      isovolumicContractionTimeSec: nullableDifference(
        arm.cycle.leftVentricularIsovolumicContractionTimeSec,
        reference.cycle.leftVentricularIsovolumicContractionTimeSec,
      ),
      leftVentricularTeiIndex: nullableDifference(
        arm.cycle.leftVentricularTeiIndex,
        reference.cycle.leftVentricularTeiIndex,
      ),
      maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec:
        nullableDifference(
          arm.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
          reference.cycle
            .maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
        ),
      maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec:
        nullableDifference(
          arm.cycle
            .maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
          reference.cycle
            .maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
        ),
    }),
  }))),
  interpretationBoundary: Object.freeze({
    finestDtIsExactContinuumSolutionClaimed: false as const,
    acceptedStepThresholdMetricsHaveDtQuantization: true as const,
    allArmsMustRemainPeriod1AndOneProminentFlowPeak: true as const,
    strictSampleLocalMaximumCountRetainedAsDiagnostic: true as const,
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
    arms: report.arms.map((arm) => ({
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
      meanDopplerExcessOverFullyOpenUniformFlowFactor:
        arm.cycle.aorticMeanDopplerExcessOverFullyOpenUniformFlowFactor,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      distinctFlowPeakCount:
        arm.cycle.aorticFlowDistinctPeakCountAboveFivePercent,
      maximumSecondaryFlowPeakProminenceFractionOfGlobalMaximum:
        arm.cycle
          .maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum,
      isovolumicContractionTimeMs:
        arm.cycle.leftVentricularIsovolumicContractionTimeSec === null
          ? null
          : arm.cycle.leftVentricularIsovolumicContractionTimeSec * 1000,
      leftVentricularTeiIndex: arm.cycle.leftVentricularTeiIndex,
      maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec:
        arm.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
      maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec:
        arm.cycle
          .maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
      differenceFromFinest: arm.differenceFromFinest,
    })),
  })}\n`);
}

function nullableDifference(
  value: number | null,
  reference: number | null,
): number | null {
  return value === null || reference === null ? null : value - reference;
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
