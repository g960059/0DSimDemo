import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowV10LimitingCornerDtConvergenceV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10LimitingCornerDtConvergenceV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10_CLAIM,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_VALUES_SEC_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10LimitingCornerDtConvergenceV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const inputs = MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1.flatMap(
  (selection) =>
    MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_VALUES_SEC_V1.map(
      (dtSec) => Object.freeze({
        selectionId: selection.selectionId,
        dtSec,
        run:
          runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
            { dtSec, maximumBeatCount },
            CANDIDATE.kuwProfileId,
            selection.context.complianceProfileId,
            CANDIDATE.characteristicResistancePlacementProfileId,
            CANDIDATE.rootInertanceProfileId,
            CANDIDATE.sarcomereReferenceProfileId,
            CANDIDATE.calciumSensitivityLengthProfileId,
            CANDIDATE.twitchRetentionCandidateId,
            selection.context.circulatoryLoadPointId,
            selection.context.stressedVenousVolumePointId,
            selection.context.trefForceLoadProfileId,
            CANDIDATE.sourceVelocityDistortionProfileId,
            CANDIDATE.strongBridgeDeactivationExitProfileId,
            CANDIDATE.atrioventricularDelayProfileId,
            CANDIDATE.pressureRecoveryProfileId,
            CANDIDATE.recoveredRootPortValveProfileId,
          ),
      }),
    ),
);
const comparison =
  measureMainWireAorticOutflowV10LimitingCornerDtConvergenceV1(inputs);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  design: Object.freeze({
    dtValuesSec:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_VALUES_SEC_V1,
    maximumBeatCount,
    candidate: CANDIDATE,
    candidateClaim: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10_CLAIM,
    limitingCorners: MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1,
  }),
  exactIdentities: Object.freeze(inputs.map((input) => Object.freeze({
    selectionId: input.selectionId,
    dtSec: input.dtSec,
    protocolIdentityHash: input.run.periodicResult.protocolIdentityHash,
    protocolComponentHashes:
      input.run.periodicResult.protocolComponentHashes,
    runnerClaim: input.run.claim,
  }))),
  comparison,
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

let resolvedOutputPath: string | null = null;
if (outputPath !== null) {
  resolvedOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  writeFileSync(resolvedOutputPath, serialized, "utf8");
}

process.stdout.write(`${JSON.stringify({
  methodId: comparison.methodId,
  evaluatedDtValuesSec: comparison.evaluatedDtValuesSec,
  maximumBeatCount,
  outputPath: resolvedOutputPath,
  byteLength: Buffer.byteLength(serialized),
  canonicalDesignFullyEvaluated: comparison.canonicalDesignFullyEvaluated,
  protocolIdentityStableAcrossDtWithinEveryContext:
    comparison.protocolIdentityStableAcrossDtWithinEveryContext,
  allContextProtocolIdentitiesDistinct:
    comparison.allContextProtocolIdentitiesDistinct,
  allRunsPeriod1AndIntegrated: comparison.allRunsPeriod1AndIntegrated,
  allStrictPeakCountsStableAcrossDt:
    comparison.allStrictPeakCountsStableAcrossDt,
  allDistinctPeakCountsStableAcrossDt:
    comparison.allDistinctPeakCountsStableAcrossDt,
  allArmsHaveOneDistinctAorticFlowPeak:
    comparison.allArmsHaveOneDistinctAorticFlowPeak,
  allExactEvaluatorProximalPortReadbacksAvailableAndWithinTolerance:
    comparison
      .allExactEvaluatorProximalPortReadbacksAvailableAndWithinTolerance,
  allStationReconstructionResidualsWithinTolerance:
    comparison.allStationReconstructionResidualsWithinTolerance,
  allOwnedOpeningTargetsWithinTolerance:
    comparison.allOwnedOpeningTargetsWithinTolerance,
  allSourceResistanceReadbacksWithinTolerance:
    comparison.allSourceResistanceReadbacksWithinTolerance,
  allExactPowerBalancesWithinTolerance:
    comparison.allExactPowerBalancesWithinTolerance,
  allValveDissipationLedgersWithinTolerance:
    comparison.allValveDissipationLedgersWithinTolerance,
  convergenceByContext: comparison.convergenceByContext.map((entry) => ({
    selectionId: entry.selection.selectionId,
    contextId: entry.selection.context.contextId,
    finestReferenceDtSec: entry.finestReferenceDtSec,
    protocolIdentityStableAcrossDt: entry.protocolIdentityStableAcrossDt,
    strictPeakCountStableAcrossDt: entry.strictPeakCountStableAcrossDt,
    distinctPeakCountStableAcrossDt: entry.distinctPeakCountStableAcrossDt,
    maximumAbsoluteDifferenceFromFinest:
      entry.maximumAbsoluteDifferenceFromFinest,
    arms: entry.arms.map((arm) => ({
      dtSec: arm.dtSec,
      terminationReason: arm.terminationReason,
      metrics: arm.metrics,
      differenceFromFinest: arm.differenceFromFinest,
      exactAudit: arm.exactAudit,
    })),
  })),
})}\n`);

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
