import { performance } from "node:perf_hooks";

import {
  projectMainWireIntegratedModelSelectedValuesV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  MainWireFlatReferenceKernelV1,
  createMainWireFlatReferenceOutputPlanV1,
  createMainWireFlatReferencePresentationPageV1,
} from "@/engine/vnext/MainWireFlatReferenceKernelV1";

const BATCH_STEPS = 16;
const WARMUP_BATCHES = 4;
const MEASURED_ROUNDS = 4;
const BATCHES_PER_ROUND = 8;
const SELECTED_OUTPUT_IDS = Object.freeze([
  "hemodynamics.pressure.absolute.LV",
  "hemodynamics.pressure.absolute.LA",
  "hemodynamics.pressure.absolute.Ao",
  "hemodynamics.volume.LV",
  "hemodynamics.pressure.transmural.LV",
  "rhythm.phase.regular-sinus",
]);

const oracle = await MainWireIntegratedModelSessionV3.create();
const flat = await MainWireFlatReferenceKernelV1.create();
const plan = createMainWireFlatReferenceOutputPlanV1(SELECTED_OUTPUT_IDS);
let oracleTick = 0;
let flatTick = 0;

function advanceOracle(stepCount: number): void {
  for (let index = 0; index < stepCount; index += 1) {
    oracleTick += 1;
    const advance = oracle.advanceToPresentationTime(
      mainWireIntegratedModelPresentationTargetTimeSecV3(oracleTick),
    );
    if (advance.status !== "advanced") {
      throw new Error(`oracle benchmark failed at tick ${oracleTick}`);
    }
    projectMainWireIntegratedModelSelectedValuesV3(
      advance.observation,
      plan.outputIds,
    );
  }
}

function advanceFlat(stepCount: number) {
  const page = createMainWireFlatReferencePresentationPageV1(stepCount, plan);
  flatTick += stepCount;
  return flat.advanceTo(flatTick, plan, page);
}

for (let index = 0; index < WARMUP_BATCHES; index += 1) {
  advanceOracle(BATCH_STEPS);
  advanceFlat(BATCH_STEPS);
}

let oracleDurationMs = 0;
let flatDurationMs = 0;
let flatOracleAdvanceMs = 0;
let flatProjectionMs = 0;
for (let round = 0; round < MEASURED_ROUNDS; round += 1) {
  const measureOracle = () => {
    const startedAt = performance.now();
    for (let index = 0; index < BATCHES_PER_ROUND; index += 1) {
      advanceOracle(BATCH_STEPS);
    }
    oracleDurationMs += performance.now() - startedAt;
  };
  const measureFlat = () => {
    const startedAt = performance.now();
    for (let index = 0; index < BATCHES_PER_ROUND; index += 1) {
      const result = advanceFlat(BATCH_STEPS);
      flatOracleAdvanceMs += result.phaseTimingsMs.oracleAdvance;
      flatProjectionMs += result.phaseTimingsMs.outputProjection;
    }
    flatDurationMs += performance.now() - startedAt;
  };
  if (round % 2 === 0) {
    measureOracle();
    measureFlat();
  } else {
    measureFlat();
    measureOracle();
  }
}

if (oracleTick !== flatTick) {
  throw new Error("flat reference benchmark clocks diverged");
}
const oracleState = oracle.currentAcceptedState();
const flatState = flat.snapshotCurrentFlatState();
if (
  flatState.acceptedTick !== oracleTick
  || flatState.acceptedRevision !== oracleState.revision
) {
  throw new Error("flat reference benchmark terminal authority diverged");
}

const measuredSteps = BATCH_STEPS * BATCHES_PER_ROUND * MEASURED_ROUNDS;
const layout = flat.stateLayout();
process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-main-wire-flat-reference-benchmark-v1",
  scope: "typed-authority-reference-worker-not-a-production-speedup-gate",
  measuredSteps,
  selectedOutputCount: plan.outputIds.length,
  stateLayout: {
    continuousSlotCount: layout.continuousSlots.length,
    nullableContinuousSlotCount: layout.nullableContinuousSlots.length,
    booleanSlotCount: layout.booleanSlots.length,
    stringSlotCount: layout.stringSlots.length,
    excludedDynamicRootCount: layout.excludedDynamicRoots.length,
    terminalStringTableValueCount: flatState.stringTable.length,
  },
  oracle: {
    totalMs: oracleDurationMs,
    meanMsPerStep: oracleDurationMs / measuredSteps,
  },
  flatReference: {
    totalMs: flatDurationMs,
    meanMsPerStep: flatDurationMs / measuredSteps,
    overheadRatio: flatDurationMs / oracleDurationMs,
    phases: {
      oracleAdvanceMs: flatOracleAdvanceMs,
      outputProjectionMs: flatProjectionMs,
    },
  },
}, null, 2)}\n`);
