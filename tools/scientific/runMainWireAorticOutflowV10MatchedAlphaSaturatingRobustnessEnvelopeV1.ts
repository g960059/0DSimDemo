import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeV1";
import { runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const stepsPerCycle = integerArgument("--steps-per-cycle", 2_000);
if (stepsPerCycle !== 500 && stepsPerCycle !== 2_000) {
  throw new Error("--steps-per-cycle must be 500 or 2000");
}
const maximumBeatCount = integerArgument("--maximum-beats", 72);
if (maximumBeatCount !== 72) {
  throw new Error("--maximum-beats must be 72 for the fixed V1 protocol");
}
const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.map(
    (arm, index) => {
      process.stderr.write(
        `[${index + 1}/${MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.length}] ${arm.armId}\n`,
      );
      return runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchV1(
        {
          dtSec: 60 / arm.heartRateBpm / stepsPerCycle,
          maximumBeatCount,
        },
        arm.armId,
      );
    },
  );

const analysis =
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1(
    runs,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  execution: Object.freeze({
    stepsPerCycle,
    maximumBeatCount,
    armOrder: Object.freeze(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_ARMS_V1.map(
        (arm) => arm.armId,
      ),
    ),
    independentCanonicalColdStartPerArm: true as const,
    fixedPhysicalHorizonAuditExecuted: false as const,
  }),
  exactIdentities: Object.freeze(
    runs.map((run) =>
      Object.freeze({
        armId: run.robustnessEnvelopeArm.armId,
        protocolIdentityHash: run.periodicResult.protocolIdentityHash,
        protocolComponentHashes: run.periodicResult.protocolComponentHashes,
        exactAssemblyAudit: run.exactAssemblyAudit,
        runnerClaim: run.claim,
      }),
    ),
  ),
  analysis,
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

let resolvedOutputPath: string | null = null;
if (outputPath !== null) {
  resolvedOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  writeFileSync(resolvedOutputPath, serialized, "utf8");
}

const metricRange = (
  metricId: keyof (typeof analysis.armsInCatalogOrder)[number]["metrics"],
) => {
  const values = analysis.armsInCatalogOrder
    .map((arm) => arm.metrics[metricId])
    .filter((value): value is number => value !== null);
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
};

const targetedGuardResiduals = analysis.safetyGuardResiduals.filter(
  (residual) =>
    (residual.safetyGuardTarget === "ejection-time" &&
      residual.metricId === "onePercentFlowEjectionTimeSec") ||
    (residual.safetyGuardTarget === "mean-doppler-gradient" &&
      residual.metricId === "meanDopplerGradientMmHg") ||
    (residual.safetyGuardTarget === "peak-doppler-gradient" &&
      residual.metricId === "peakDopplerGradientMmHg") ||
    (residual.safetyGuardTarget === "flow-derived-left-ventricular-tei-index" &&
      residual.metricId === "leftVentricularTeiIndex"),
);
const materialGuardResiduals = analysis.safetyGuardResiduals.filter(
  (residual) => residual.materialResidual === true,
);

process.stdout.write(
  `${JSON.stringify({
    methodId: analysis.methodId,
    outputPath: resolvedOutputPath,
    byteLength: Buffer.byteLength(serialized),
    stepsPerCycle,
    maximumBeatCount,
    armCount: analysis.armsInCatalogOrder.length,
    allProtocolIdentityHashesUnique: analysis.allProtocolIdentityHashesUnique,
    oneCirculationTopologyHash: analysis.oneCirculationTopologyHash,
    oneCommonPericardiumHash: analysis.oneCommonPericardiumHash,
    onePeriodicPolicyHash: analysis.onePeriodicPolicyHash,
    exactAssemblyAuditsMatchProtocolHashes:
      analysis.exactAssemblyAuditsMatchProtocolHashes,
    factorHashIsolation: analysis.factorHashIsolation,
    allExactIdentityAndDeclaredFactorIsolationGuardsPassed:
      analysis.allExactIdentityAndDeclaredFactorIsolationGuardsPassed,
    allArmsPeriod1AndIntegrationPassed:
      analysis.allArmsPeriod1AndIntegrationPassed,
    allArmsHaveOneDistinctAorticFlowPeak:
      analysis.allArmsHaveOneDistinctAorticFlowPeak,
    allArmsHaveExactlyOneCompleteOnePercentFlowEpisode:
      analysis.allArmsHaveExactlyOneCompleteOnePercentFlowEpisode,
    allExactStationAuditsPassed: analysis.allExactStationAuditsPassed,
    allSimplifiedPeakGradientVmaxIdentitiesWithinTolerance:
      analysis.allSimplifiedPeakGradientVmaxIdentitiesWithinTolerance,
    allThreeVmaxAndGradientTwoSidedRestingReferenceIntervalsMatched:
      analysis.allThreeVmaxAndGradientTwoSidedRestingReferenceIntervalsMatched,
    allArmLevelAvAntiStenosisRobustnessGatesPassed:
      analysis.allArmLevelAvAntiStenosisRobustnessGatesPassed,
    allAvAntiStenosisRobustnessGatesPassedIncludingEoaVariation:
      analysis.allAvAntiStenosisRobustnessGatesPassedIncludingEoaVariation,
    fullCornerEarlyStopRobustnessReadoutPassed:
      analysis.fullCornerEarlyStopRobustnessReadoutPassed,
    fixedPhysicalHorizonAuditStatus: analysis.fixedPhysicalHorizonAuditStatus,
    safetyGuardScreeningReadout: analysis.safetyGuardScreeningReadout,
    guardResidualSummary: Object.freeze({
      targetedGuardResiduals,
      materialResidualCount: materialGuardResiduals.length,
      materialResidualIds: materialGuardResiduals.map(
        (residual) => `${residual.guardArmId}::${residual.metricId}`,
      ),
    }),
    continuityEquivalentEoaVariation: analysis.continuityEquivalentEoaVariation,
    limitingArmsForLaterFixedHorizonAudit:
      analysis.limitingArmsForLaterFixedHorizonAudit,
    metricRanges: Object.freeze({
      onePercentFlowEjectionTimeSec: metricRange(
        "onePercentFlowEjectionTimeSec",
      ),
      correctedValveEventLvetMs: metricRange("correctedValveEventLvetMs"),
      accelerationTimeSec: metricRange("accelerationTimeSec"),
      strokeVolumeMl: metricRange("strokeVolumeMl"),
      peakVenaContractaVelocityMPerSec: metricRange(
        "peakVenaContractaVelocityMPerSec",
      ),
      meanDopplerGradientMmHg: metricRange("meanDopplerGradientMmHg"),
      peakDopplerGradientMmHg: metricRange("peakDopplerGradientMmHg"),
      activeEoaAtPeakForwardFlowUtilization01: metricRange(
        "activeEoaAtPeakForwardFlowUtilization01",
      ),
      flowWeightedMeanActiveEoaUtilization01: metricRange(
        "flowWeightedMeanActiveEoaUtilization01",
      ),
      isovolumicContractionTimeSec: metricRange("isovolumicContractionTimeSec"),
      isovolumicRelaxationTimeSec: metricRange("isovolumicRelaxationTimeSec"),
      leftVentricularTeiIndex: metricRange("leftVentricularTeiIndex"),
      maximumPositiveLeftVentricularDpdtMmHgPerSec: metricRange(
        "maximumPositiveLeftVentricularDpdtMmHgPerSec",
      ),
      meanAorticPressureMmHg: metricRange("meanAorticPressureMmHg"),
      rawLvMinusAorticNodeGradientMmHgStationAuditOnly: Object.freeze({
        mean: metricRange("meanRawLvMinusAorticNodeGradientMmHg"),
        peak: metricRange("peakRawLvMinusAorticNodeGradientMmHg"),
      }),
    }),
    armLevelAvAntiStenosisRobustnessFailureIds: analysis.armsInCatalogOrder
      .filter(
        (arm) =>
          !arm.physiologyGate.allArmLevelAvAntiStenosisRobustnessGatesPassed,
      )
      .map((arm) => arm.arm.armId),
    arms: analysis.armsInCatalogOrder.map((arm) =>
      Object.freeze({
        armId: arm.arm.armId,
        designRole: arm.arm.designRole,
        heartRateBpm: arm.arm.heartRateBpm,
        completedBeatCount: arm.ledger.completedBeatCount,
        period1AndIntegrationPassed: arm.ledger.period1AndIntegrationPassed,
        singleDistinctAorticFlowPeakPassed:
          arm.ledger.singleDistinctAorticFlowPeakPassed,
        exactStationAuditPassed: arm.ledger.exactStationAuditPassed,
        metrics: arm.metrics,
        physiologyGate: arm.physiologyGate,
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

function integerArgument(name: string, fallback: number): number {
  const value = optionalArgument(name);
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}
