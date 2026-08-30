import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { compareMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1";
import { runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.map(
    (arm) => {
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1(
          { dtSec: arm.dtSec, maximumBeatCount: arm.maximumBeatCount },
          arm.calciumProfileId,
        );
      return Object.freeze({ arm, run });
    },
  );

const comparison =
  compareMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1(
    runs.map(({ arm, run }) =>
      Object.freeze({
        arm,
        calciumProfile: run.matchedAlphaTimingPolicyBridgeProfile,
        calciumDriveParams: run.calciumDriveParams,
        periodicResult: run.periodicResult,
      }),
    ),
  );

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  design: Object.freeze({
    arms: MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1,
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CLAIM_V1,
  }),
  exactIdentities: Object.freeze(
    runs.map(({ arm, run }) =>
      Object.freeze({
        armId: arm.armId,
        protocolIdentityHash: run.periodicResult.protocolIdentityHash,
        protocolComponentHashes: run.periodicResult.protocolComponentHashes,
        exactAssemblyAudit: run.exactAssemblyAudit,
        runnerClaim: run.claim,
      }),
    ),
  ),
  comparison,
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

let resolvedOutputPath: string | null = null;
if (outputPath !== null) {
  resolvedOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  writeFileSync(resolvedOutputPath, serialized, "utf8");
}

process.stdout.write(
  `${JSON.stringify({
    methodId: comparison.methodId,
    outputPath: resolvedOutputPath,
    byteLength: Buffer.byteLength(serialized),
    allArmsInterpretationEligible: comparison.allArmsInterpretationEligible,
    allArmsPeriod1AndIntegrationPassed:
      comparison.allArmsPeriod1AndIntegrationPassed,
    allArmsHaveOneDistinctAorticFlowPeak:
      comparison.allArmsHaveOneDistinctAorticFlowPeak,
    allExactReadbackStationEquationsWithinTolerance:
      comparison.allExactReadbackStationEquationsWithinTolerance,
    arms: comparison.arms.map((measured) => {
      const cycle = measured.cycleMetrics;
      const calciumProfile = runs.find(
        ({ arm }) => arm.armId === measured.arm.armId,
      )!.run.matchedAlphaTimingPolicyBridgeProfile;
      const primaryEtSec =
        measured.onePercentFlowEjectionTime.interpolatedEjectionTimeSec;
      return Object.freeze({
        armId: measured.arm.armId,
        timingPolicy: measured.arm.timingPolicy,
        heartRateBpm: measured.arm.heartRateBpm,
        dtSec: measured.arm.dtSec,
        completedBeatCount: measured.completedBeatCount,
        completedPhysicalTimeSec: measured.completedPhysicalTimeSec,
        terminationReason: measured.terminationReason,
        interpretationEligible: measured.interpretationEligible,
        ventricularRiseTimeConstantMs:
          calciumProfile.ventricularRiseTimeConstantSec * 1_000,
        configuredCalciumPulseTimeToPeakMs:
          cycle.configuredCalciumPulseTimeToPeakSec * 1_000,
        configuredSupradiastolicCalciumCycleExposureUMSec:
          cycle.configuredSupradiastolicCalciumCycleExposureUMSec,
        onePercentFlowEjectionTimeMs: primaryEtSec * 1_000,
        onePercentFlowEjectionFractionOfRr:
          primaryEtSec / measured.arm.cycleLengthSec,
        valveEventEjectionTimeMs:
          cycle.leftVentricularValveEventEjectionTimeSec === null
            ? null
            : cycle.leftVentricularValveEventEjectionTimeSec * 1_000,
        accelerationTimeMs: cycle.timeFromAorticFlowOnsetToPeakSec * 1_000,
        strokeVolumeMl: cycle.aorticForwardVolumeMl,
        strokeVolumePerPrimaryEtMlPerSec:
          cycle.aorticForwardVolumeMl / primaryEtSec,
        peakAorticFlowMlPerSec: cycle.aorticMaximumFlowMlPerSec,
        peakToMeanForwardFlowRatio: cycle.aorticPeakToMeanForwardFlowRatio,
        peakVenaContractaVelocityMPerSec:
          cycle.peakVenaContractaVelocityMPerSec,
        meanDopplerGradientMmHg: cycle.meanDopplerGradientMmHg,
        peakDopplerGradientMmHg: cycle.peakDopplerGradientMmHg,
        ictMs:
          cycle.leftVentricularIsovolumicContractionTimeSec === null
            ? null
            : cycle.leftVentricularIsovolumicContractionTimeSec * 1_000,
        ivrtMs:
          cycle.leftVentricularIsovolumicRelaxationTimeSec === null
            ? null
            : cycle.leftVentricularIsovolumicRelaxationTimeSec * 1_000,
        teiIndex: cycle.leftVentricularTeiIndex,
        maximumPositiveDpdtMmHgPerSec:
          cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
        minimumNegativeDpdtMmHgPerSec:
          cycle.minimumNegativeLeftVentricularPressureFallRateMmHgPerSec,
        leftVentricularEjectionFraction01:
          cycle.leftVentricularEjectionFraction01,
        cardiacOutputLPerMin: cycle.netAorticCardiacOutputLPerMin,
        meanAorticPressureMmHg: cycle.meanAorticAbsolutePressureMmHg,
        distinctAorticFlowPeakCount:
          cycle.aorticFlowDistinctPeakCountAboveFivePercent,
        copenhagenTimingReadout: measured.copenhagenTimingReadout,
        exactPressureStations: measured.exactPressureStations,
        observationStations: measured.observationStations,
      });
    }),
    metricContrasts: comparison.metricContrasts,
  })}\n`,
);

function optionalArgument(name: string): string | null {
  const equalsArgument = process.argv.find((argument) =>
    argument.startsWith(`${name}=`),
  );
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
