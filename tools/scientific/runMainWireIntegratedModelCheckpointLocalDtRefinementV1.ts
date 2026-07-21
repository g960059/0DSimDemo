import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V2_ID,
  runMainWireIntegratedModelCheckpointLocalDtRefinementV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";
import type {
  MainWireIntegratedModelCheckpointV2,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV2";

const checkpointArtifactPath = requiredArgument("--checkpoint-artifact");
const outputPath = optionalArgument("--output");
const artifact = parseArtifact(
  readFileSync(path.resolve(checkpointArtifactPath), "utf8"),
);
const result = await runMainWireIntegratedModelCheckpointLocalDtRefinementV1({
  checkpoint: artifact.terminalCheckpoint,
});
const summarizeRun = (run: typeof result.coarse) => Object.freeze({
  nominalDtSec: run.nominalDtSec,
  acceptedStepCount: run.acceptedStepCount,
  acceptedClock: run.acceptedClock,
  scheduler: run.scheduler,
  coronaryAutoregulationWindow: run.coronaryAutoregulationWindow,
  rhythm: run.rhythm,
  invariant: run.invariant,
  signal: run.signal,
  waveform: run.waveform,
  comparisonValues: run.comparisonValues,
  terminalAcceptedTimeSec: run.terminalAcceptedState.acceptedTimeSec,
  terminalRevision: run.terminalAcceptedState.revision,
});
const summary = Object.freeze({
  experimentId: result.experimentId,
  claim: result.claim,
  sourceArtifact: Object.freeze({
    path: path.resolve(checkpointArtifactPath),
    experimentId: artifact.experimentId,
    executionPurpose: artifact.executionPurpose,
  }),
  initialCheckpoint: result.initialCheckpoint,
  coarse: summarizeRun(result.coarse),
  fine: summarizeRun(result.fine),
  crossDt: result.crossDt,
  crossDtSummary: result.crossDtSummary,
  eventIdentityAndTimingMatchAcrossDt:
    result.eventIdentityAndTimingMatchAcrossDt,
  bothRunsStartFromSameExactCheckpoint:
    result.bothRunsStartFromSameExactCheckpoint,
  allNumericalChecksPassed: result.allNumericalChecksPassed,
  periodicOrbitEstablished: result.periodicOrbitEstablished,
  physiologicalAcceptanceEstablished:
    result.physiologicalAcceptanceEstablished,
  releaseAcceptanceEstablished: result.releaseAcceptanceEstablished,
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
    initialAcceptedTimeSec: summary.initialCheckpoint.acceptedTimeSec,
    allNumericalChecksPassed: summary.allNumericalChecksPassed,
    periodicOrbitEstablished: summary.periodicOrbitEstablished,
    physiologicalAcceptanceEstablished:
      summary.physiologicalAcceptanceEstablished,
  })}\n`);
}
if (!result.allNumericalChecksPassed) process.exitCode = 1;

function parseArtifact(raw: string): Readonly<{
  experimentId: string;
  executionPurpose: string;
  terminalCheckpoint: MainWireIntegratedModelCheckpointV2;
}> {
  const parsed: unknown = JSON.parse(raw);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("checkpoint artifact must be a JSON object");
  }
  const record = parsed as Record<string, unknown>;
  const executionPurpose = record.executionPurpose;
  if (record.experimentId
      !== MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_STEADY_V2_ID
    || typeof executionPurpose !== "string"
    || ![
      "canonical-evidence",
      "bounded-smoke",
      "fixed-horizon-characterization",
    ].includes(executionPurpose)
    || record.terminalCheckpoint === null
    || typeof record.terminalCheckpoint !== "object"
    || Array.isArray(record.terminalCheckpoint)) {
    throw new Error(
      "checkpoint artifact has an unsupported experiment identity, purpose, or terminal checkpoint",
    );
  }
  return Object.freeze({
    experimentId: record.experimentId,
    executionPurpose,
    terminalCheckpoint:
      record.terminalCheckpoint as MainWireIntegratedModelCheckpointV2,
  });
}

function requiredArgument(name: string): string {
  const value = optionalArgument(name);
  if (value === null) throw new Error(`${name} is required`);
  return value;
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
