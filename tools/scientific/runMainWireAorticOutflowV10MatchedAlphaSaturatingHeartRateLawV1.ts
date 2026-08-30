import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawComparisonV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1";
import { runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1.map(
    (arm, index) => {
      process.stderr.write(
        `[${index + 1}/${MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_ARMS_V1.length}] ${arm.armId}\n`,
      );
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
          { dtSec: arm.dtSec, maximumBeatCount: arm.maximumBeatCount },
          arm.calciumProfileId,
        );
      return Object.freeze({ arm, run });
    },
  );

const comparison =
  compareMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1(
    runs.map(({ arm, run }) =>
      Object.freeze({
        arm,
        calciumProfile: run.saturatingHeartRateLawProfile,
        calciumDriveParams: run.calciumDriveParams,
        periodicResult: run.periodicResult,
        referenceNonCalciumAssembly: run.referenceNonCalciumAssembly,
        exactAssemblyAudit: run.exactAssemblyAudit,
      }),
    ),
  );

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  exactIdentities: Object.freeze(
    runs.map(({ arm, run }) =>
      Object.freeze({
        armId: arm.armId,
        protocolIdentityHash: run.periodicResult.protocolIdentityHash,
        protocolComponentHashes: run.periodicResult.protocolComponentHashes,
        exactAssemblyAudit: run.exactAssemblyAudit,
        activeDesign: run.activeDesign,
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
    allNonCalciumExactAssemblyAuditHashesIdentical:
      comparison.allNonCalciumExactAssemblyAuditHashesIdentical,
    allExactReadbackStationEquationsWithinTolerance:
      comparison.allExactReadbackStationEquationsWithinTolerance,
    arms: comparison.arms.map((measured) =>
      Object.freeze({
        armId: measured.arm.armId,
        designRole: measured.arm.designRole,
        heartRateBpm: measured.arm.heartRateBpm,
        dimensionlessRateCoefficient: measured.arm.dimensionlessRateCoefficient,
        completedBeatCount: measured.completedBeatCount,
        terminationReason: measured.terminationReason,
        interpretationEligible: measured.interpretationEligible,
        ventricularTimeConstantMs:
          measured.lawMetadata.ventricularRiseTimeConstantSec * 1_000,
        onePercentFlowEjectionTimeMs:
          measured.onePercentFlowEjectionTime.interpolatedEjectionTimeSec *
          1_000,
        valveEventEjectionTimeMs:
          measured.cycleMetrics.leftVentricularValveEventEjectionTimeSec ===
          null
            ? null
            : measured.cycleMetrics.leftVentricularValveEventEjectionTimeSec *
              1_000,
        accelerationTimeMs:
          measured.cycleMetrics.timeFromAorticFlowOnsetToPeakSec * 1_000,
        strokeVolumeMl: measured.cycleMetrics.aorticForwardVolumeMl,
        strokeVolumePerOnePercentEtMlPerSec:
          measured.reportedMetrics[
            "stroke-volume-per-one-percent-et-ml-per-sec"
          ],
        peakAorticFlowMlPerSec: measured.cycleMetrics.aorticMaximumFlowMlPerSec,
        peakToMeanForwardFlowRatio:
          measured.cycleMetrics.aorticPeakToMeanForwardFlowRatio,
        peakVenaContractaVelocityMPerSec:
          measured.cycleMetrics.peakVenaContractaVelocityMPerSec,
        meanDopplerGradientMmHg: measured.cycleMetrics.meanDopplerGradientMmHg,
        peakDopplerGradientMmHg: measured.cycleMetrics.peakDopplerGradientMmHg,
        copenhagenTimingReadout: measured.copenhagenTimingReadout,
        maximumPositiveDpdtMmHgPerSec:
          measured.cycleMetrics
            .maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
        minimumNegativeDpdtMmHgPerSec:
          measured.cycleMetrics
            .minimumNegativeLeftVentricularPressureFallRateMmHgPerSec,
        leftVentricularEjectionFraction01:
          measured.cycleMetrics.leftVentricularEjectionFraction01,
        cardiacOutputLPerMin:
          measured.cycleMetrics.netAorticCardiacOutputLPerMin,
        meanAorticPressureMmHg:
          measured.cycleMetrics.meanAorticAbsolutePressureMmHg,
        exactPressureStations: measured.exactPressureStations,
      }),
    ),
    mainTrend: Object.freeze({
      heartRate90Minus50: comparison.mainTrend.heartRate90Minus50,
      rangesAcrossHeartRate: comparison.mainTrend.rangesAcrossHeartRate,
      monotonicDirectionAcrossHeartRate:
        comparison.mainTrend.monotonicDirectionAcrossHeartRate,
    }),
    endpointPriorSensitivities: comparison.endpointPriorSensitivities.map(
      (sensitivity) =>
        Object.freeze({
          dimensionlessRateCoefficient:
            sensitivity.dimensionlessRateCoefficient,
          perHeartRatePriorMinusMain: sensitivity.perHeartRatePriorMinusMain,
          heartRateTrendDifferenceOfDifferences:
            sensitivity.heartRateTrendDifferenceOfDifferences,
        }),
    ),
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
