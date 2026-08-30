import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeFixedPhysicalHorizonSentinelResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.map(
    (arm, index) => {
      process.stderr.write(
        `[${index + 1}/${MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.length}] ${arm.armId}: primary\n`,
      );
      const primary =
        runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1(
          { dtSec: arm.dtSec, maximumBeatCount: arm.maximumBeatCount },
          arm.calciumProfileId,
        );
      process.stderr.write(
        `[${index + 1}/${MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.length}] ${arm.armId}: fixed-horizon sentinel\n`,
      );
      const sentinel =
        runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeFixedPhysicalHorizonSentinelResearchV1(
          arm.calciumProfileId,
        );
      return Object.freeze({ arm, primary, sentinel });
    },
  );

const sensitivity =
  measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1(
    runs.map(({ arm, primary, sentinel }) =>
      Object.freeze({
        arm,
        calciumProfile: primary.matchedAlphaTimingPolicyBridgeProfile,
        calciumDriveParams: primary.calciumDriveParams,
        primaryPeriodicResult: primary.periodicResult,
        sentinelPeriodicResult: sentinel.periodicResult,
        primaryRunnerAssemblyIdentity: Object.freeze({
          referenceNonCalciumAssembly: primary.referenceNonCalciumAssembly,
          exactAssemblyAudit: primary.exactAssemblyAudit,
        }),
        sentinelRunnerAssemblyIdentity: Object.freeze({
          referenceNonCalciumAssembly: sentinel.referenceNonCalciumAssembly,
          exactAssemblyAudit: sentinel.exactAssemblyAudit,
        }),
        sentinelExecutionPolicy: sentinel.executionPolicy,
      }),
    ),
  );

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  exactIdentities: Object.freeze(
    runs.map(({ arm, primary, sentinel }) =>
      Object.freeze({
        armId: arm.armId,
        primary: Object.freeze({
          protocolIdentityHash: primary.periodicResult.protocolIdentityHash,
          protocolComponentHashes:
            primary.periodicResult.protocolComponentHashes,
          exactAssemblyAudit: primary.exactAssemblyAudit,
          runnerClaim: primary.claim,
        }),
        sentinel: Object.freeze({
          protocolIdentityHash: sentinel.periodicResult.protocolIdentityHash,
          protocolComponentHashes:
            sentinel.periodicResult.protocolComponentHashes,
          exactAssemblyAudit: sentinel.exactAssemblyAudit,
          executionPolicy: sentinel.executionPolicy,
          runnerClaim: sentinel.claim,
        }),
      }),
    ),
  ),
  sensitivity,
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
    methodId: sensitivity.methodId,
    outputPath: resolvedOutputPath,
    byteLength: Buffer.byteLength(serialized),
    canonicalDesignFullyEvaluated: sensitivity.canonicalDesignFullyEvaluated,
    allRunsIntegratedWithoutFailure:
      sensitivity.allRunsIntegratedWithoutFailure,
    allRunsPeriod1Converged: sensitivity.allRunsPeriod1Converged,
    allRunsHaveOneDistinctAorticFlowPeak:
      sensitivity.allRunsHaveOneDistinctAorticFlowPeak,
    allExactReadbacksAvailableAndStationIdentitiesWithinTolerance:
      sensitivity.allExactReadbacksAvailableAndStationIdentitiesWithinTolerance,
    allPairsInterpretationEligible: sensitivity.allPairsInterpretationEligible,
    pairs: sensitivity.pairs.map((pair) =>
      Object.freeze({
        armId: pair.arm.armId,
        heartRateBpm: pair.arm.heartRateBpm,
        timingPolicy: pair.arm.timingPolicy,
        primaryCompletedBeatCount: pair.primary.completedBeatCount,
        sentinelCompletedBeatCount: pair.sentinel.completedBeatCount,
        primaryMetrics: pair.primary.metrics,
        sentinelMetrics: pair.sentinel.metrics,
        signedSentinelMinusPrimary: pair.signedSentinelMinusPrimary,
      }),
    ),
    maximumAbsoluteSentinelMinusPrimary:
      sensitivity.maximumAbsoluteSentinelMinusPrimary,
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
