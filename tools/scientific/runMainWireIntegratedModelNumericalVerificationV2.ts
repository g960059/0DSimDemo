import {
  runMainWireIntegratedModelNumericalVerificationV2,
  runMainWireIntegratedModelTerminalCycleExplorationV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";

const result = runMainWireIntegratedModelNumericalVerificationV2();
const terminalCycleExploration =
  runMainWireIntegratedModelTerminalCycleExplorationV2({
    cycleCount: 5,
    nominalDtSec: 0.002,
  });

const summarizeRun = (run: typeof result.coarse) => Object.freeze({
  nominalDtSec: run.nominalDtSec,
  acceptedStepCount: run.acceptedStepCount,
  acceptedClock: run.acceptedClock,
  scheduler: run.scheduler,
  rhythm: run.rhythm,
  invariant: run.invariant,
  signal: run.signal,
  waveform: run.waveform,
});

const summary = Object.freeze({
  experimentId: result.experimentId,
  claim: result.claim,
  protocol: result.protocol,
  heartMateIiLvadOnlyTranscription:
    result.heartMateIiLvadOnlyTranscription,
  coarse: summarizeRun(result.coarse),
  fine: summarizeRun(result.fine),
  crossDt: result.crossDt,
  crossDtSummary: result.crossDtSummary,
  exploratoryPressureFlowLoopComparison:
    result.exploratoryPressureFlowLoopComparison,
  eventIdentityAndTimingMatchAcrossDt:
    result.eventIdentityAndTimingMatchAcrossDt,
  allNumericalChecksPassed: result.allNumericalChecksPassed,
  terminalCycleExploration: Object.freeze({
    experimentId: terminalCycleExploration.experimentId,
    claim: terminalCycleExploration.claim,
    input: terminalCycleExploration.input,
    cycleLengthSec: terminalCycleExploration.cycleLengthSec,
    cycles: terminalCycleExploration.cycles,
    consecutiveCycleChange:
      terminalCycleExploration.consecutiveCycleChange,
    stabilizationAssessment:
      terminalCycleExploration.stabilizationAssessment,
    allCyclesFiniteConservedAndStepBounded:
      terminalCycleExploration.allCyclesFiniteConservedAndStepBounded,
    terminalCycleTrace: terminalCycleExploration.terminalCycleTrace,
    terminalAcceptedTimeSec:
      terminalCycleExploration.terminalAcceptedState.acceptedTimeSec,
  }),
});

const serialized = `${JSON.stringify(summary, null, 2)}\n`;
const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0) {
  const outputArgument = process.argv[outputIndex + 1];
  if (!outputArgument || outputArgument.startsWith("--")) {
    throw new Error("--output requires a JSON path");
  }
  const outputPath = path.resolve(outputArgument);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, "utf8");
  process.stdout.write(`${JSON.stringify({
    experimentId: summary.experimentId,
    outputPath,
    byteLength: Buffer.byteLength(serialized),
    terminalCycleIndex:
      summary.terminalCycleExploration.terminalCycleTrace.cycleIndex,
  })}\n`);
} else {
  process.stdout.write(serialized);
}
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
