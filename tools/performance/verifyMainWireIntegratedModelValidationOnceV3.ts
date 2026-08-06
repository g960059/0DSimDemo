import { performance } from "node:perf_hooks";
import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  type MainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import { canonicalJsonStringify } from "@/engine/integrity";

const NOMINAL_DT_SEC = 0.002;

type AcceptedState = MainWireIntegratedModelAcceptedStateV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

export type MainWireIntegratedModelSequenceV3 = Readonly<{
  acceptedStepCount: number;
  canonicalAcceptedStates: readonly string[];
}>;

export type MainWireIntegratedModelTimingV3 = Readonly<{
  acceptedStepCount: number;
  elapsedMs: number;
  msPerAcceptedStep: number;
}>;

export function mainWireIntegratedModelSequenceSha256V3(
  canonicalAcceptedStates: readonly string[],
): string {
  const hash = createHash("sha256");
  for (const state of canonicalAcceptedStates) {
    hash.update(`${Buffer.byteLength(state)}:`);
    hash.update(state);
  }
  return hash.digest("hex");
}

/**
 * Drives the exported regular-sinus/all-off fixture through the same
 * limit-then-step path as the periodic-steady experiment.
 */
export function captureMainWireIntegratedModelSequenceV3(
  acceptedStepCount: number,
): MainWireIntegratedModelSequenceV3 {
  const runner = createRunner();
  const canonicalAcceptedStates: string[] = [];
  for (let stepIndex = 0; stepIndex < acceptedStepCount; stepIndex += 1) {
    canonicalAcceptedStates.push(canonicalJsonStringify(
      canonicalPlainDataProjection(runner.step()),
    ));
  }
  return Object.freeze({
    acceptedStepCount,
    canonicalAcceptedStates: Object.freeze(canonicalAcceptedStates),
  });
}

export function timeMainWireIntegratedModelAcceptedStepsV3(
  acceptedStepCount: number,
): MainWireIntegratedModelTimingV3 {
  const runner = createRunner();
  const startedAt = performance.now();
  for (let stepIndex = 0; stepIndex < acceptedStepCount; stepIndex += 1) {
    runner.step();
  }
  const elapsedMs = performance.now() - startedAt;
  return Object.freeze({
    acceptedStepCount,
    elapsedMs,
    msPerAcceptedStep: elapsedMs / acceptedStepCount,
  });
}

function createRunner() {
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
  let accepted: AcceptedState = fixture.cold.acceptedState;
  let nominalGridIndex = 1;

  return Object.freeze({
    step(): AcceptedState {
      let nominalTargetTimeSec = nominalGridIndex * NOMINAL_DT_SEC;
      while (!(nominalTargetTimeSec > accepted.acceptedTimeSec)) {
        nominalGridIndex += 1;
        nominalTargetTimeSec = nominalGridIndex * NOMINAL_DT_SEC;
      }
      const maximum = limitMainWireIntegratedModelCandidateTimeV3(
        accepted,
        nominalTargetTimeSec,
        {
          configuration: fixture.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
        },
        fixture.profile,
        fixture.config,
      );
      const result = stepMainWireIntegratedModelV3(
        fixture.provider,
        accepted,
        Object.freeze({
          candidateTimeSec: maximum.candidateTimeSec,
          coronary: fixture.coronaryStepInput,
          rhythm: Object.freeze({
            configuration: fixture.rhythm.configuration,
            externalAfNextBoundaryTimeSec: null,
            externalAtrialSourceBatch: null,
          }),
          dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
        }),
      );
      if (result.converged === false) {
        throw new Error(
          `V3 validation-once driver failed at ${accepted.acceptedTimeSec}s: `
            + result.message,
        );
      }
      accepted = result.acceptedState;
      if (accepted.acceptedTimeSec === nominalTargetTimeSec) {
        nominalGridIndex += 1;
      }
      return accepted;
    },
  });
}

function canonicalPlainDataProjection(
  value: unknown,
  path = "$",
  seen = new WeakSet<object>(),
): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) {
    throw new Error(`accepted state contains a cycle at ${path}`);
  }
  seen.add(value);
  let projected: unknown;
  if (ArrayBuffer.isView(value)) {
    if (value instanceof DataView) {
      projected = Array.from(new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength,
      ));
    } else {
      projected = Array.from(value as unknown as ArrayLike<number>);
    }
  } else if (Array.isArray(value)) {
    projected = value.map((child, index) =>
      canonicalPlainDataProjection(child, `${path}[${index}]`, seen));
  } else {
    projected = Object.fromEntries(Object.keys(value).map((key) => [
      key,
      canonicalPlainDataProjection(
        (value as Record<string, unknown>)[key],
        `${path}.${key}`,
        seen,
      ),
    ]));
  }
  seen.delete(value);
  return projected;
}

type BuildModule = Readonly<{
  captureMainWireIntegratedModelSequenceV3:
    typeof captureMainWireIntegratedModelSequenceV3;
  timeMainWireIntegratedModelAcceptedStepsV3:
    typeof timeMainWireIntegratedModelAcceptedStepsV3;
}>;

export async function compareMainWireIntegratedModelBuildsV3(
  baselineModulePath: string,
  changedModulePath: string,
  sequenceStepCount = 500,
  timingStepCount = 100,
) {
  const loadBuildModule = async (modulePath: string): Promise<BuildModule> => {
    if (realpathSync(modulePath) === fileURLToPath(import.meta.url)) {
      return {
        captureMainWireIntegratedModelSequenceV3,
        timeMainWireIntegratedModelAcceptedStepsV3,
      };
    }
    return import(pathToFileURL(modulePath).href) as Promise<BuildModule>;
  };
  const [baseline, changed] = await Promise.all([
    loadBuildModule(baselineModulePath),
    loadBuildModule(changedModulePath),
  ]);
  const baselineSequence =
    baseline.captureMainWireIntegratedModelSequenceV3(sequenceStepCount);
  const changedSequence =
    changed.captureMainWireIntegratedModelSequenceV3(sequenceStepCount);
  let firstDifferentStep: number | null = null;
  for (let index = 0; index < sequenceStepCount; index += 1) {
    if (
      baselineSequence.canonicalAcceptedStates[index]
      !== changedSequence.canonicalAcceptedStates[index]
    ) {
      firstDifferentStep = index + 1;
      break;
    }
  }
  const timings = [
    {
      build: "baseline" as const,
      ...baseline.timeMainWireIntegratedModelAcceptedStepsV3(timingStepCount),
    },
    {
      build: "changed" as const,
      ...changed.timeMainWireIntegratedModelAcceptedStepsV3(timingStepCount),
    },
    {
      build: "baseline" as const,
      ...baseline.timeMainWireIntegratedModelAcceptedStepsV3(timingStepCount),
    },
    {
      build: "changed" as const,
      ...changed.timeMainWireIntegratedModelAcceptedStepsV3(timingStepCount),
    },
  ];
  return Object.freeze({
    sequenceStepCount,
    bitExact: firstDifferentStep === null,
    firstDifferentStep,
    baselineSequenceSha256:
      mainWireIntegratedModelSequenceSha256V3(
        baselineSequence.canonicalAcceptedStates,
      ),
    changedSequenceSha256:
      mainWireIntegratedModelSequenceSha256V3(
        changedSequence.canonicalAcceptedStates,
      ),
    timingStepCount,
    timings: Object.freeze(timings),
  });
}

if (
  process.argv[1] !== undefined
  && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
  && process.argv[2] !== undefined
  && process.argv[3] !== undefined
) {
  const result = await compareMainWireIntegratedModelBuildsV3(
    process.argv[2],
    process.argv[3],
    Number(process.argv[4] ?? 500),
    Number(process.argv[5] ?? 100),
  );
  console.log(JSON.stringify(result, null, 2));
}
