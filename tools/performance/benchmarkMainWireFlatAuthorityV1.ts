import { performance } from "node:perf_hooks";

import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  projectMainWireIntegratedModelSelectedValuesV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  createMainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  createMainWireAcceptedTypedBoundaryBindingV1,
  limitMainWireAcceptedTypedCandidateTimeV1,
  readMainWireAcceptedTypedClockV1,
  stageMainWireAcceptedTypedCalciumCandidateV1,
  stageMainWireAcceptedTypedClockCandidateV1,
} from "@/engine/vnext/MainWireAcceptedTypedBoundaryV1";
import {
  createMainWireAcceptedTypedStateManifestV1,
} from "@/engine/vnext/MainWireAcceptedTypedStateV1";
import {
  MainWireFlatAuthoritativeReferenceSessionV1,
} from "@/engine/vnext/MainWireFlatAuthoritativeReferenceSessionV1";
import {
  TransactionalTypedStateImageV1,
} from "@/engine/vnext/TransactionalTypedStateImageV1";

const WARMUP_TICKS = 64;
const MEASURED_TICKS = 512;

const objectSession = await MainWireIntegratedModelSessionV3.create();
const flatSession = await MainWireFlatAuthoritativeReferenceSessionV1.create();
const runtime = await createMainWireIntegratedModelRuntimeV3();
const typedManifest = createMainWireAcceptedTypedStateManifestV1(
  runtime.cold.acceptedState,
);
const typedImage = new TransactionalTypedStateImageV1(
  typedManifest,
  runtime.cold.acceptedState,
);
const typedBoundaryBinding =
  createMainWireAcceptedTypedBoundaryBindingV1(typedManifest);

let objectDurationMs = 0;
let flatDurationMs = 0;
let typedStageDurationMs = 0;
let typedRehydrateDurationMs = 0;
let typedBoundaryDurationMs = 0;
let typedCalciumCandidateDurationMs = 0;

for (let tick = 1; tick <= WARMUP_TICKS + MEASURED_TICKS; tick += 1) {
  const target = mainWireIntegratedModelPresentationTargetTimeSecV3(tick);
  const objectFirst = tick % 2 === 0;
  const advanceObject = () => {
    const startedAt = performance.now();
    const result = objectSession.advanceToPresentationTime(target);
    const duration = performance.now() - startedAt;
    if (result.status !== "advanced") {
      throw new Error(`object authority failed at tick ${tick}`);
    }
    if (tick > WARMUP_TICKS) objectDurationMs += duration;
    return result;
  };
  const advanceFlat = () => {
    const startedAt = performance.now();
    const result = flatSession.advanceToPresentationTime(target);
    const duration = performance.now() - startedAt;
    if (result.status !== "advanced") {
      throw new Error(`flat authority failed at tick ${tick}`);
    }
    if (tick > WARMUP_TICKS) flatDurationMs += duration;
    return result;
  };
  const objectResult = objectFirst ? advanceObject() : null;
  const flatResult = advanceFlat();
  const resolvedObjectResult = objectResult ?? advanceObject();
  const stageStartedAt = performance.now();
  typedImage.stage(resolvedObjectResult.observation.acceptedState);
  const stagedAt = performance.now();
  typedImage.rehydrateStaged();
  const rehydratedAt = performance.now();
  typedImage.promote();
  const cursor = typedImage.currentCursor();
  const boundaryStartedAt = performance.now();
  const clock = readMainWireAcceptedTypedClockV1(cursor, typedBoundaryBinding);
  const nextBoundary = limitMainWireAcceptedTypedCandidateTimeV1(
    cursor,
    typedBoundaryBinding,
    mainWireIntegratedModelPresentationTargetTimeSecV3(tick + 1),
    runtime.rhythm.configuration,
    null,
  );
  const boundaryFinishedAt = performance.now();
  const candidateCursor = typedImage.beginCandidateFromCurrent();
  stageMainWireAcceptedTypedClockCandidateV1(
    cursor,
    candidateCursor,
    typedBoundaryBinding,
    nextBoundary.candidateTimeSec,
  );
  stageMainWireAcceptedTypedCalciumCandidateV1(
    cursor,
    candidateCursor,
    typedBoundaryBinding,
    nextBoundary.candidateTimeSec,
    runtime.rhythm.configuration.calciumParametersByWall,
  );
  typedImage.abort();
  const candidateFinishedAt = performance.now();
  if (tick > WARMUP_TICKS) {
    typedStageDurationMs += stagedAt - stageStartedAt;
    typedRehydrateDurationMs += rehydratedAt - stagedAt;
    typedBoundaryDurationMs += boundaryFinishedAt - boundaryStartedAt;
    typedCalciumCandidateDurationMs +=
      candidateFinishedAt - boundaryFinishedAt;
  }
  if (
    resolvedObjectResult.acceptedRevision !== flatResult.acceptedRevision
    || resolvedObjectResult.acceptedTimeSec !== flatResult.acceptedTimeSec
  ) {
    throw new Error("flat authority benchmark accepted clock diverged");
  }
  if (clock.acceptedTimeSec !== resolvedObjectResult.acceptedTimeSec) {
    throw new Error("typed boundary benchmark accepted clock diverged");
  }
}

const objectOutputs = projectMainWireIntegratedModelSelectedValuesV3(
  objectSession.observe(),
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
);
const flatOutputs = projectMainWireIntegratedModelSelectedValuesV3(
  flatSession.observe(),
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
);
if (JSON.stringify(objectOutputs) !== JSON.stringify(flatOutputs)) {
  throw new Error("flat authority benchmark terminal outputs diverged");
}

const authority = flatSession.authorityReport();
process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-main-wire-flat-authority-benchmark-v1",
  scope: "phase-1b-reference-authority-not-a-production-speedup-gate",
  warmupTicks: WARMUP_TICKS,
  measuredTicks: MEASURED_TICKS,
  objectAuthority: {
    totalMs: objectDurationMs,
    meanMsPerTick: objectDurationMs / MEASURED_TICKS,
  },
  typedAcceptedStateAuthority: {
    totalMs: flatDurationMs,
    meanMsPerTick: flatDurationMs / MEASURED_TICKS,
    overheadRatio: flatDurationMs / objectDurationMs,
    authority,
  },
  isolatedTypedImageProjection: {
    stageMeanMsPerPresentationTick:
      typedStageDurationMs / MEASURED_TICKS,
    rehydrateMeanMsPerPresentationTick:
      typedRehydrateDurationMs / MEASURED_TICKS,
    boundaryMeanMsPerPresentationTick:
      typedBoundaryDurationMs / MEASURED_TICKS,
    calciumCandidateMeanMsPerPresentationTick:
      typedCalciumCandidateDurationMs / MEASURED_TICKS,
    report: typedImage.report(),
  },
}, null, 2)}\n`);
