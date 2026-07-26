import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2,
  runMainWireIntegratedModelPeriodicSteadyV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";

const nominalDtSec = numericArgument("--dt", 0.002);
const maximumCycleCount = integerArgument(
  "--maximum-cycles",
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V2.defaultMaximumCycleCount,
);
const outputPath = optionalArgument("--output");
const executionPurpose = executionPurposeArgument();

const result = await runMainWireIntegratedModelPeriodicSteadyV2({
  nominalDtSec,
  maximumCycleCount,
  executionPurpose,
});
const summary = Object.freeze({
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
  physiologicalAcceptanceEstablished:
    result.physiologicalAcceptanceEstablished,
  releaseAcceptanceEstablished: result.releaseAcceptanceEstablished,
  cycles: Object.freeze(result.cycles.map((cycle) => Object.freeze({
    cycleIndex: cycle.cycleIndex,
    startTimeSec: cycle.startTimeSec,
    endTimeSec: cycle.endTimeSec,
    acceptedStepCount: cycle.acceptedStepCount,
    coronaryAutoregulationWindow: cycle.coronaryAutoregulationWindow,
    period1MaximumNormalizedDelta: cycle.period1MaximumNormalizedDelta,
    period2MaximumNormalizedDelta: cycle.period2MaximumNormalizedDelta,
    worstPeriod1Group: cycle.worstPeriod1Group,
    worstPeriod1Path: cycle.worstPeriod1Path,
    lvadLimiterOwnedSampleFraction: cycle.lvadLimiterOwnedSampleFraction,
    meanLvadFlowMlPerSec: cycle.meanLvadFlowMlPerSec,
    meanAorticPressureMmHg: cycle.meanAorticPressureMmHg,
    meanLeftVentricularPressureMmHg:
      cycle.meanLeftVentricularPressureMmHg,
    meanLeftVentricularVolumeMl: cycle.meanLeftVentricularVolumeMl,
    allSignalsFiniteAndConserved: cycle.allSignalsFiniteAndConserved,
  }))),
  terminalCycleTrace: result.terminalCycleTrace,
  terminalCheckpoint: result.terminalCheckpoint,
  terminalAcceptedTimeSec: result.terminalAcceptedState.acceptedTimeSec,
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
  process.stdout.write(`${JSON.stringify({
    experimentId: summary.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    completedCycleCount: summary.completedCycleCount,
    terminationReason: summary.terminationReason,
  })}\n`);
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

function executionPurposeArgument():
"canonical-evidence" | "fixed-horizon-characterization" {
  const value = optionalArgument("--execution-purpose")
    ?? "canonical-evidence";
  if (value !== "canonical-evidence"
    && value !== "fixed-horizon-characterization") {
    throw new Error(
      "--execution-purpose must be canonical-evidence or fixed-horizon-characterization",
    );
  }
  return value;
}
