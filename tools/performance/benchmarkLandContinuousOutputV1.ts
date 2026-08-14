import { performance } from "node:perf_hooks";

import { evaluateLand2017ContinuousOutput } from "@/engine/myocardium/myofilament/land2017/outputs";
import { computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep } from "@/engine/myocardium/myofilament/land2017/tangents";

const state = Float64Array.from([0.55, 0.12, 0.08, 0.04, 0.06, 0.12]);
const input = Object.freeze({
  freeCalciumUM: 0.92,
  fiberEngineeringStrain: 0.04,
  fiberEngineeringStrainRatePerSec: 0.2,
});
const stepInput = Object.freeze({
  freeCalciumUM: input.freeCalciumUM,
  previousFiberEngineeringStrain: 0.02,
  stageFiberEngineeringStrain: input.fiberEngineeringStrain,
  dtSec: 0.002,
  stage: Object.freeze({ scheme: "BE" as const, stageIndex: 0 }),
});
const warmupEvaluations = 100_000;
const measuredEvaluations = 2_000_000;
let checksum = 0;

for (let index = 0; index < warmupEvaluations; index += 1) {
  checksum += evaluateLand2017ContinuousOutput(state, input).sourceActiveFiberStressPa;
}

const startedAtMs = performance.now();
for (let index = 0; index < measuredEvaluations; index += 1) {
  const output = evaluateLand2017ContinuousOutput(state, input);
  checksum += output.sourceActiveFiberStressPa + output.stabilizationStiffnessPa;
}
const elapsedMs = performance.now() - startedAtMs;

for (let index = 0; index < warmupEvaluations; index += 1) {
  checksum += computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep(
    state,
    stepInput,
  );
}
const tangentStartedAtMs = performance.now();
for (let index = 0; index < measuredEvaluations; index += 1) {
  checksum += computeLand2017ConsistentAlgorithmicTangentPaFromSolvedStep(
    state,
    stepInput,
  );
}
const tangentElapsedMs = performance.now() - tangentStartedAtMs;

console.log(JSON.stringify({
  schemaId: "circleheart-land-continuous-output-benchmark-v1",
  measuredEvaluations,
  continuousOutput: {
    elapsedMs,
    nanosecondsPerEvaluation: (elapsedMs * 1_000_000) / measuredEvaluations,
  },
  consistentTangent: {
    elapsedMs: tangentElapsedMs,
    nanosecondsPerEvaluation:
      (tangentElapsedMs * 1_000_000) / measuredEvaluations,
  },
  checksum,
}));
