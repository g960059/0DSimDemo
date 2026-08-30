import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAnalysisV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAnalysisV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const outputPath = parseOutputArgument(process.argv.slice(2));

const primaryRuns =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
    (sentinelArm, index) => {
      const arm = sentinelArm.sourceEnvelopeArm;
      process.stderr.write(
        `[primary ${index + 1}/${MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.length}] ${arm.armId}\n`,
      );
      return runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchV1(
        {
          dtSec: 60 / arm.heartRateBpm / 2_000,
          maximumBeatCount: 72,
        },
        arm.armId,
      );
    },
  );

const fixedRuns =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
    (sentinelArm, index) => {
      process.stderr.write(
        `[fixed48s ${index + 1}/${MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.length}] ${sentinelArm.sentinelArmId}\n`,
      );
      return runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchV1(
        sentinelArm.sentinelArmId,
      );
    },
  );

const analysis =
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAnalysisV1(
    primaryRuns,
    fixedRuns,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  execution: Object.freeze({
    primaryStepsPerCycle: 2_000 as const,
    primaryMaximumBeatCount: 72 as const,
    primaryPeriodicEarlyStopEnabled: true as const,
    fixedStepsPerCycle: 4_000 as const,
    fixedPhysicalHorizonSec: 48 as const,
    fixedPeriodicEarlyStopBeforeHorizonAccepted: false as const,
    independentCanonicalColdStartPerExecution: true as const,
    armOrder: Object.freeze(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
        (arm) => arm.sentinelArmId,
      ),
    ),
    limitingUnionOnly: true as const,
    allThirtySixEnvelopeArmsAuditedAtFixedHorizon: false as const,
    continuityEquivalentEoaVariationRecertified: false as const,
  }),
  exactIdentities: Object.freeze(
    primaryRuns.map((primaryRun, index) => {
      const fixedRun = fixedRuns[index]!;
      return Object.freeze({
        armId: primaryRun.robustnessEnvelopeArm.armId,
        primaryProtocolIdentityHash:
          primaryRun.periodicResult.protocolIdentityHash,
        fixedProtocolIdentityHash: fixedRun.periodicResult.protocolIdentityHash,
        primaryProtocolComponentHashes:
          primaryRun.periodicResult.protocolComponentHashes,
        fixedProtocolComponentHashes:
          fixedRun.periodicResult.protocolComponentHashes,
        primaryExactAssemblyAudit: primaryRun.exactAssemblyAudit,
        fixedExactAssemblyAudit: fixedRun.exactAssemblyAudit,
        primaryRunnerClaim: primaryRun.claim,
        fixedRunnerClaim: fixedRun.claim,
        fixedExecutionPolicy: fixedRun.executionPolicy,
      });
    }),
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

process.stdout.write(
  `${JSON.stringify({
    methodId: analysis.methodId,
    outputPath: resolvedOutputPath,
    byteLength: Buffer.byteLength(serialized),
    auditedUniqueArmCount: analysis.auditedUniqueArmCount,
    auditStatus: analysis.auditStatus,
    limitingUnionFixedHorizonAuditPassed:
      analysis.limitingUnionFixedHorizonAuditPassed,
    allPairedExactModelIdentitiesMatched:
      analysis.allPairedExactModelIdentitiesMatched,
    allExecutionContractsPassed: analysis.allExecutionContractsPassed,
    allNumericalComparisonsWithinTolerance:
      analysis.allNumericalComparisonsWithinTolerance,
    anyHardPhysiologyClassFlip: analysis.anyHardPhysiologyClassFlip,
    allPrimaryRunsHaveOneDistinctAorticFlowPeak:
      analysis.allPrimaryRunsHaveOneDistinctAorticFlowPeak,
    allPrimaryRunsHaveExactlyOneCompleteOnePercentFlowEpisode:
      analysis.allPrimaryRunsHaveExactlyOneCompleteOnePercentFlowEpisode,
    allPrimaryExactStationAuditsPassed:
      analysis.allPrimaryExactStationAuditsPassed,
    allPrimarySimplifiedPeakGradientVmaxIdentitiesPassed:
      analysis.allPrimarySimplifiedPeakGradientVmaxIdentitiesPassed,
    allPrimaryTwoSidedRestingVmaxAndGradientReadoutsMatched:
      analysis.allPrimaryTwoSidedRestingVmaxAndGradientReadoutsMatched,
    allPrimaryArmLevelAvAntiStenosisGatesPassed:
      analysis.allPrimaryArmLevelAvAntiStenosisGatesPassed,
    allFixedRunsHaveOneDistinctAorticFlowPeak:
      analysis.allFixedRunsHaveOneDistinctAorticFlowPeak,
    allFixedRunsHaveExactlyOneCompleteOnePercentFlowEpisode:
      analysis.allFixedRunsHaveExactlyOneCompleteOnePercentFlowEpisode,
    allFixedExactStationAuditsPassed: analysis.allFixedExactStationAuditsPassed,
    allFixedSimplifiedPeakGradientVmaxIdentitiesPassed:
      analysis.allFixedSimplifiedPeakGradientVmaxIdentitiesPassed,
    allFixedTwoSidedRestingVmaxAndGradientReadoutsMatched:
      analysis.allFixedTwoSidedRestingVmaxAndGradientReadoutsMatched,
    allFixedArmLevelAvAntiStenosisGatesPassed:
      analysis.allFixedArmLevelAvAntiStenosisGatesPassed,
    compoundComparisonValidityPassed: analysis.compoundComparisonValidityPassed,
    compoundMismatchDetected: analysis.compoundMismatchDetected,
    nonNumericalAuditFailureDetected: analysis.nonNumericalAuditFailureDetected,
    physiologyGateFailureDetected: analysis.physiologyGateFailureDetected,
    decompositionStatus: analysis.decompositionStatus,
    horizonAndTimeStepEffectsSeparated:
      analysis.horizonAndTimeStepEffectsSeparated,
    allThirtySixEnvelopeArmsAuditedAtFixedHorizon:
      analysis.allThirtySixEnvelopeArmsAuditedAtFixedHorizon,
    continuityEquivalentEoaVariationRecertified:
      analysis.continuityEquivalentEoaVariationRecertified,
    pairs: analysis.pairsInFrozenCatalogOrder.map((pair) =>
      Object.freeze({
        armId: pair.sentinelArm.sentinelArmId,
        selectionReasons: pair.sentinelArm.selectionReasons,
        primaryCompletedBeatCount:
          pair.executionAudit.primaryCompletedBeatCount,
        fixedCompletedBeatCount:
          pair.executionAudit.fixedRequestedAndCompletedBeatCount,
        fixedEndpointTimeSec: pair.executionAudit.fixedEndpointTimeSec,
        pairPassed: pair.pairPassed,
        anyMaterialMetricDifference: pair.anyMaterialMetricDifference,
        anyHardPhysiologyClassFlip: pair.anyHardPhysiologyClassFlip,
        metricComparisons: pair.metricComparisons,
      }),
    ),
  })}\n`,
);

if (!analysis.limitingUnionFixedHorizonAuditPassed) {
  process.exitCode = 2;
}

function parseOutputArgument(args: readonly string[]): string | null {
  if (args.length === 0) return null;
  if (args.length === 1 && args[0]!.startsWith("--output=")) {
    const value = args[0]!.slice("--output=".length);
    if (value === "") throw new Error("--output requires a value");
    return value;
  }
  if (args.length === 2 && args[0] === "--output" && args[1] !== "") {
    return args[1]!;
  }
  throw new Error(
    "fixed-horizon sentinel accepts only an optional --output path; numerical execution overrides are forbidden",
  );
}
