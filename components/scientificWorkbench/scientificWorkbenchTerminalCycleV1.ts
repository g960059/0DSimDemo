import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  type MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  sameSimulationReleaseRef,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";

export const SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1 = Object.freeze({
  cycleLengthSec: 1 as const,
  dtSec: 0.002 as const,
  stepCount: 500 as const,
  stepsPerWorkerCommand: 4 as const,
  workerCommandCount: 125 as const,
  observationStride: 1 as const,
  expectedAcceptedStepFrameCount: 500 as const,
  expectedRenderedFrameCount: 501 as const,
});

export type ScientificWorkbenchTerminalCycleV1 = Readonly<{
  frames: readonly MainWireScientificObservableFrameV1[];
  releaseRef: SimulationReleaseRef;
  firstRevision: number;
  finalRevision: number;
  firstAcceptedTimeSec: number;
  finalAcceptedTimeSec: number;
  durationSec: number;
  evidence: Readonly<{
    startsAtExactCheckpointRestore: true;
    subsequentFramesAreAcceptedSteps: true;
    exactReleaseRefUniform: true;
    revisionsContiguous: true;
    cadenceUniform: true;
    bothCycleBoundariesRetained: true;
    smoothingOrInterpolationApplied: false;
  }>;
}>;

export class ScientificWorkbenchTerminalCycleValidationErrorV1 extends Error {
  constructor(message: string) {
    super(`scientific workbench terminal cycle rejected: ${message}`);
    this.name = "ScientificWorkbenchTerminalCycleValidationErrorV1";
  }
}

/**
 * Retains the restored P1 boundary plus every accepted step in the following
 * one-second beat. No interpolation, smoothing, duplicate removal, or
 * resampling is allowed here; a malformed Worker history fails closed.
 */
export function assembleScientificWorkbenchTerminalCycleV1(
  boundaryFrame: MainWireScientificObservableFrameV1,
  acceptedStepFrames: readonly MainWireScientificObservableFrameV1[],
): ScientificWorkbenchTerminalCycleV1 {
  assertFrameEnvelope(boundaryFrame, "boundary frame");
  if (boundaryFrame.source !== "exact-checkpoint-restore") {
    throw new ScientificWorkbenchTerminalCycleValidationErrorV1(
      "the first frame must be the exact V3 checkpoint restore boundary",
    );
  }
  if (
    acceptedStepFrames.length
      !== SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1
        .expectedAcceptedStepFrameCount
  ) {
    throw new ScientificWorkbenchTerminalCycleValidationErrorV1(
      `expected ${SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.expectedAcceptedStepFrameCount} accepted-step frames, received ${acceptedStepFrames.length}`,
    );
  }

  const frames = [boundaryFrame, ...acceptedStepFrames];
  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1]!;
    const current = frames[index]!;
    assertFrameEnvelope(current, `frame ${index}`);
    if (current.source !== "accepted-step") {
      throw new ScientificWorkbenchTerminalCycleValidationErrorV1(
        `frame ${index} is not an accepted-step observation`,
      );
    }
    if (!sameSimulationReleaseRef(boundaryFrame.releaseRef, current.releaseRef)) {
      throw new ScientificWorkbenchTerminalCycleValidationErrorV1(
        `frame ${index} belongs to a different simulation release`,
      );
    }
    if (current.revision !== previous.revision + 1) {
      throw new ScientificWorkbenchTerminalCycleValidationErrorV1(
        `frame ${index} is not revision-contiguous`,
      );
    }
    const dtSec = current.acceptedTimeSec - previous.acceptedTimeSec;
    if (
      !Number.isFinite(dtSec)
      || Math.abs(dtSec - SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.dtSec)
        > 1e-10
    ) {
      throw new ScientificWorkbenchTerminalCycleValidationErrorV1(
        `frame ${index} does not preserve the fixed 2 ms cadence`,
      );
    }
  }

  const finalFrame = frames.at(-1)!;
  const durationSec = finalFrame.acceptedTimeSec
    - boundaryFrame.acceptedTimeSec;
  if (
    Math.abs(
      durationSec
        - SCIENTIFIC_WORKBENCH_TERMINAL_CYCLE_V1.cycleLengthSec,
    ) > 1e-9
  ) {
    throw new ScientificWorkbenchTerminalCycleValidationErrorV1(
      `terminal history spans ${durationSec} s instead of one complete cycle`,
    );
  }

  return Object.freeze({
    frames: Object.freeze(frames),
    releaseRef: Object.freeze({ ...boundaryFrame.releaseRef }),
    firstRevision: boundaryFrame.revision,
    finalRevision: finalFrame.revision,
    firstAcceptedTimeSec: boundaryFrame.acceptedTimeSec,
    finalAcceptedTimeSec: finalFrame.acceptedTimeSec,
    durationSec,
    evidence: Object.freeze({
      startsAtExactCheckpointRestore: true as const,
      subsequentFramesAreAcceptedSteps: true as const,
      exactReleaseRefUniform: true as const,
      revisionsContiguous: true as const,
      cadenceUniform: true as const,
      bothCycleBoundariesRetained: true as const,
      smoothingOrInterpolationApplied: false as const,
    }),
  });
}

function assertFrameEnvelope(
  frame: MainWireScientificObservableFrameV1,
  label: string,
): void {
  if (
    frame.frameId !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID
    || frame.registryId !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID
    || frame.schemaVersion
      !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION
  ) {
    throw new ScientificWorkbenchTerminalCycleValidationErrorV1(
      `${label} has an unsupported observable-frame envelope`,
    );
  }
  if (
    !Number.isSafeInteger(frame.revision)
    || frame.revision < 0
    || !Number.isFinite(frame.acceptedTimeSec)
    || frame.acceptedTimeSec < 0
  ) {
    throw new ScientificWorkbenchTerminalCycleValidationErrorV1(
      `${label} has an invalid accepted-state identity`,
    );
  }
}
