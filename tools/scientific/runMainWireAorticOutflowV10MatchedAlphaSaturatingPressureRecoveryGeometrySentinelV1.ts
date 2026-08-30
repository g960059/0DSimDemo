import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { measureMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1";
import { MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1 } from "@/analysis/methods/mainWire/MainWireAorticValveLvotKineticCorrectionV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_NEW_EXACT_SIMULATION_CELL_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const outputPath = parseOutputArgument(process.argv.slice(2));

const reusedD3p0Runs =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
    (sentinelArm, index) => {
      process.stderr.write(
        `[reused-d3p0 ${index + 1}/${MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.length}] ${sentinelArm.sentinelArmId}\n`,
      );
      return runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchV1(
        sentinelArm.sentinelArmId,
      );
    },
  );

const newGeometryRuns =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_NEW_EXACT_SIMULATION_CELL_IDS_V1.map(
    (cellId, index) => {
      process.stderr.write(
        `[new-geometry ${index + 1}/${MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_NEW_EXACT_SIMULATION_CELL_IDS_V1.length}] ${cellId}\n`,
      );
      return runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelResearchV1(
        cellId,
      );
    },
  );

process.stderr.write(
  `[analysis] ${MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1.length} exact AA cells x ${MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1.length} algebraic LVOT profiles\n`,
);
const analysis =
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1(
    Object.freeze({ reusedD3p0Runs, newGeometryRuns }),
  );

const d3p0IdentityBySentinelArmId = new Map(
  reusedD3p0Runs.map((run) => [run.fixedHorizonSentinelArm.sentinelArmId, run]),
);
const newGeometryIdentityByCellId = new Map(
  newGeometryRuns.map((run) => [run.pressureRecoveryGeometryCell.cellId, run]),
);
const exactIdentitiesInClosedCatalogOrder = Object.freeze(
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1.map(
    (cell) => {
      const run = cell.existingD3p0ExactSimulationReused
        ? d3p0IdentityBySentinelArmId.get(
            cell.sourceFixedHorizonSentinelArm.sentinelArmId,
          )
        : newGeometryIdentityByCellId.get(cell.cellId);
      if (run === undefined) {
        throw new Error(`missing exact identity for ${cell.cellId}`);
      }
      return Object.freeze({
        cellId: cell.cellId,
        sentinelArmId: cell.sourceFixedHorizonSentinelArm.sentinelArmId,
        geometryId: cell.geometryProfile.geometryId,
        executionRoute: cell.executionRoute,
        executionPolicyId: run.executionPolicy.policyId,
        protocolIdentityHash: run.periodicResult.protocolIdentityHash,
        protocolComponentHashes: run.periodicResult.protocolComponentHashes,
        pressureRecoveryProfileId: run.aorticValveResearchProfile.profileId,
        recoveredRootPortValveProfileId:
          run.recoveredRootPortValveProfile.profileId,
        ascendingAorticDiameterCm:
          run.aorticValveResearchProfile.ascendingAorticDiameterCm,
        ascendingAorticAreaCm2:
          run.aorticValveResearchProfile.ascendingAorticAreaCm2,
        completedBeatCount: run.periodicResult.completedBeatCount,
        periodicityStatus: run.periodicResult.periodicity.status,
      });
    },
  ),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  execution: Object.freeze({
    fixedPhysicalHorizonSec:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1.fixedPhysicalHorizonSec,
    fixedStepsPerCycle:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1.fixedStepsPerCycle,
    retainedD3p0ExistingExactSimulationCount: reusedD3p0Runs.length,
    newExactSimulationCount: newGeometryRuns.length,
    analyzedGeometryCellCount: exactIdentitiesInClosedCatalogOrder.length,
    algebraicLvotProfileCount:
      MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1.length,
    independentCanonicalColdStartPerExecution: true as const,
    periodicTerminationBeforeFixedHorizonAccepted: false as const,
    exactCellOrder: Object.freeze(
      exactIdentitiesInClosedCatalogOrder.map((identity) => identity.cellId),
    ),
  }),
  exactIdentitiesInClosedCatalogOrder,
  analysis,
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;
const lvotMaximumCorrectedGradientRangeMmHg = finiteRange(
  analysis.lvotSummariesInClosedCatalogOrder.map(
    (summary) =>
      summary.maximumLvotCorrectedGradientInstantaneous
        .lvotCorrectedSimplifiedBernoulliGradientMmHg,
  ),
);
const lvotCorrectedAtMaximumJetVelocityRangeMmHg = finiteRange(
  analysis.lvotSummariesInClosedCatalogOrder.map(
    (summary) =>
      summary.atMaximumJetVelocityInstantaneous
        .lvotCorrectedSimplifiedBernoulliGradientMmHg,
  ),
);
const lvotCorrectedMeanRangeMmHg = finiteRange(
  analysis.lvotSummariesInClosedCatalogOrder.map(
    (summary) =>
      summary.onePercentEpisodeResearchOnlyTimeWeightedMean
        .lvotCorrectedSimplifiedBernoulliGradientMmHg,
  ),
);

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
    auditStatus: analysis.auditStatus,
    geometryStressAuditPassed: analysis.geometryStressAuditPassed,
    exactGeometryCellCount: exactIdentitiesInClosedCatalogOrder.length,
    algebraicLvotReadoutCount:
      analysis.lvotSummariesInClosedCatalogOrder.length,
    metricRanges: analysis.metricRanges,
    limitedUnionContinuityEoaVariation:
      analysis.limitedUnionContinuityEoaVariation,
    lvotMaximumCorrectedGradientRangeMmHg,
    lvotCorrectedAtMaximumJetVelocityRangeMmHg,
    lvotCorrectedMeanRangeMmHg,
    endpointMinusD3p0KeyMetricDeltas:
      analysis.geometryTripletsInFrozenSentinelOrder.map((triplet) =>
        Object.freeze({
          sentinelArmId: triplet.sentinelArmId,
          endpoints: triplet.endpointMinusD3p0MetricDeltas.map((delta) =>
            Object.freeze({
              endpointGeometryId: delta.endpointGeometryId,
              onePercentFlowEjectionTimeSec:
                delta.endpointMinusD3p0.onePercentFlowEjectionTimeSec,
              strokeVolumeMl: delta.endpointMinusD3p0.strokeVolumeMl,
              peakVenaContractaVelocityMPerSec:
                delta.endpointMinusD3p0.peakVenaContractaVelocityMPerSec,
              meanDopplerGradientMmHg:
                delta.endpointMinusD3p0.meanDopplerGradientMmHg,
              peakDopplerGradientMmHg:
                delta.endpointMinusD3p0.peakDopplerGradientMmHg,
              meanExactLocalPortGradientMmHg:
                delta.endpointMinusD3p0.meanExactLocalPortGradientMmHg,
              meanRawLvMinusAorticNodeGradientMmHg:
                delta.endpointMinusD3p0.meanRawLvMinusAorticNodeGradientMmHg,
            }),
          ),
        }),
      ),
  })}\n`,
);

if (!analysis.geometryStressAuditPassed) {
  process.exitCode = 2;
}

function finiteRange(values: readonly number[]): Readonly<{
  minimum: number;
  maximum: number;
}> {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("summary range requires a non-empty finite value set");
  }
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
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
    "pressure-recovery geometry sentinel accepts only an optional --output path; numerical execution overrides are forbidden",
  );
}
