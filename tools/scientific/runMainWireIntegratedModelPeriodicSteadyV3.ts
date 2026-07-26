import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
  runMainWireIntegratedModelPeriodicSteadyV3,
  type MainWireIntegratedModelPeriodicExecutionPurposeV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

const executionPurpose = executionPurposeArgument();
const nominalDtSec = numericArgument("--dt", 0.002);
const maximumCycleCount = integerArgument(
  "--maximum-cycles",
  executionPurpose === "bounded-smoke"
    ? MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.boundedSmokeDefaultMaximumCycleCount
    : MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.defaultMaximumCycleCount,
);
const outputPath = optionalArgument("--output");

const result = await runMainWireIntegratedModelPeriodicSteadyV3({
  nominalDtSec,
  maximumCycleCount,
  executionPurpose,
});
const terminalCycle = result.cycles.at(-1)!;
const summary = Object.freeze({
  artifactSchemaVersion: 3 as const,
  experimentId: result.experimentId,
  executionPurpose: result.executionPurpose,
  protocolIdentityHash: result.protocolIdentityHash,
  nominalDtSec: result.nominalDtSec,
  cycleLengthSec: result.cycleLengthSec,
  requestedMaximumCycleCount: result.requestedMaximumCycleCount,
  completedCycleCount: result.completedCycleCount,
  terminationReason: result.terminationReason,
  classification: result.classification,
  numericalPeriod1Established: result.numericalPeriod1Established,
  period2OrbitSuspected: result.period2OrbitSuspected,
  requestedHorizonCompleted: result.requestedHorizonCompleted,
  earlyClassificationStopEligible: result.earlyClassificationStopEligible,
  allCyclesFiniteConservedAndEventExact:
    result.allCyclesFiniteConservedAndEventExact,
  physiologicalAcceptanceEstablished: result.physiologicalAcceptanceEstablished,
  independentValidationEstablished: result.independentValidationEstablished,
  releaseAcceptanceEstablished: result.releaseAcceptanceEstablished,
  cycles: Object.freeze(
    result.cycles.map((cycle) =>
      Object.freeze({
        cycleIndex: cycle.cycleIndex,
        startTimeSec: cycle.startTimeSec,
        endTimeSec: cycle.endTimeSec,
        acceptedStepCount: cycle.acceptedStepCount,
        coronaryAutoregulationWindow: cycle.coronaryAutoregulationWindow,
        period1MaximumNormalizedDelta: cycle.period1MaximumNormalizedDelta,
        period2MaximumNormalizedDelta: cycle.period2MaximumNormalizedDelta,
        worstPeriod1Group: cycle.worstPeriod1Group,
        worstPeriod1Path: cycle.worstPeriod1Path,
        acceptedAtrialCaptureIds: cycle.acceptedAtrialCaptureIds,
        acceptedVentricularCaptureIds: cycle.acceptedVentricularCaptureIds,
        deliveredCalciumDepositIds: cycle.deliveredCalciumDepositIds,
        conservation: cycle.conservation,
        finiteAndEventIdentityChecks: cycle.finiteAndEventIdentityChecks,
        rawHealthyMetrics: cycle.rawHealthyMetrics,
      }),
    ),
  ),
  terminalPeriod1Closure: terminalCycle.period1,
  terminalPeriod2Closure: terminalCycle.period2,
  terminalCycleTrace: result.terminalCycleTrace,
  terminalHealthyReferenceProjection: result.terminalHealthyReferenceProjection,
  terminalCheckpoint: result.terminalCheckpoint,
  terminalAcceptedTimeSec: result.terminalAcceptedState.acceptedTimeSec,
  terminalAcceptedRevision: result.terminalAcceptedState.revision,
  terminalCheckpointExactRoundTripVerified:
    result.terminalCheckpointExactRoundTripVerified,
  policy: result.policy,
  claim: result.claim,
});
const serialized = `${JSON.stringify(summary, null, 2)}\n`;

if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  process.stdout.write(
    `${JSON.stringify({
      experimentId: summary.experimentId,
      outputPath: absoluteOutputPath,
      byteLength: Buffer.byteLength(serialized),
      executionPurpose: summary.executionPurpose,
      completedCycleCount: summary.completedCycleCount,
      terminationReason: summary.terminationReason,
      numericalPeriod1Established: summary.numericalPeriod1Established,
      healthyReferenceAssessmentEligible:
        summary.terminalHealthyReferenceProjection.assessmentEligibility
          .eligible,
      terminalCheckpointSha256: summary.terminalCheckpoint.checkpointSha256,
    })}\n`,
  );
}

function optionalArgument(name: string): string | null {
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
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be finite`);
  return parsed;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}

function executionPurposeArgument(): MainWireIntegratedModelPeriodicExecutionPurposeV3 {
  const value =
    optionalArgument("--execution-purpose") ?? "fixed-horizon-characterization";
  if (
    value !== "canonical-evidence" &&
    value !== "bounded-smoke" &&
    value !== "fixed-horizon-characterization"
  ) {
    throw new Error(
      "--execution-purpose must be canonical-evidence, bounded-smoke, or fixed-horizon-characterization",
    );
  }
  return value;
}
