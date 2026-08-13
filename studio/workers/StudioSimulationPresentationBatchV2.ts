import type {
  RegisteredModelPresentationBatchV2,
  StudioSimulationFrameV2,
  StudioSimulationOutputQualityV2,
  StudioSimulationOutputValueV2,
} from "@/studio/contracts/v2/simulation";

/**
 * Compact hot-path transport for one accepted presentation batch.
 *
 * Intermediate rows carry only authored scalar signals and accepted clocks.
 * The final row remains a complete model frame so latest-value consumers and
 * authoring correlation never depend on a lossy presentation projection.
 */
export type StudioSimulationPresentationBatchV2 =
  RegisteredModelPresentationBatchV2 & Readonly<{
    /** Adapter-owned numerical advance plus exact output projection. */
    workerAdvanceMs: number;
    /** Worker validation/packing before postMessage. */
    workerPrepareMs: number;
  }>;

export const STUDIO_SIMULATION_PRESENTATION_OUTPUT_STATE_COUNT_V2 = 6;

export function createStudioSimulationPresentationBatchV2(
  frames: readonly StudioSimulationFrameV2[],
  outputIds: readonly string[],
  timing: Readonly<{
    workerAdvanceMs: number;
    workerPrepareMs: number;
  }> = Object.freeze({ workerAdvanceMs: 0, workerPrepareMs: 0 }),
): StudioSimulationPresentationBatchV2 {
  if (frames.length === 0) {
    throw new Error("presentation batch requires at least one frame");
  }
  const acceptedRevisions = new Float64Array(frames.length);
  const acceptedTimesSec = new Float64Array(frames.length);
  const outputStates = new Uint8Array(frames.length * outputIds.length);
  const outputValues = new Float64Array(frames.length * outputIds.length);

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
    const frame = frames[frameIndex]!;
    acceptedRevisions[frameIndex] = frame.acceptedRevision;
    acceptedTimesSec[frameIndex] = frame.acceptedTimeSec;
    for (let outputIndex = 0; outputIndex < outputIds.length; outputIndex += 1) {
      const outputId = outputIds[outputIndex]!;
      const output = frame.outputs[outputId];
      if (output === undefined) {
        throw new Error(`presentation output ${outputId} is unavailable`);
      }
      const scalarValue = output.value;
      let encodedScalarValue: number;
      if (scalarValue === null) {
        encodedScalarValue = Number.NaN;
      } else if (typeof scalarValue === "number") {
        encodedScalarValue = scalarValue;
      } else {
        throw new Error(
          `presentation output ${outputId} must be a scalar or null`,
        );
      }
      const index = frameIndex * outputIds.length + outputIndex;
      outputStates[index] = studioSimulationPresentationOutputStateCodeV2(
        output,
      );
      outputValues[index] = encodedScalarValue;
    }
  }

  return Object.freeze({
    outputIds: Object.freeze([...outputIds]),
    acceptedRevisions,
    acceptedTimesSec,
    outputStates,
    outputValues,
    terminalFrame: frames[frames.length - 1]!,
    workerAdvanceMs: timing.workerAdvanceMs,
    workerPrepareMs: timing.workerPrepareMs,
  });
}

export function materializeStudioSimulationPresentationFramesV2(
  batch: RegisteredModelPresentationBatchV2,
): readonly StudioSimulationFrameV2[] {
  const frameCount = batch.acceptedRevisions.length;
  const frames: StudioSimulationFrameV2[] = [];
  for (let frameIndex = 0; frameIndex < frameCount - 1; frameIndex += 1) {
    const outputs: Record<string, StudioSimulationOutputValueV2> = {};
    for (
      let outputIndex = 0;
      outputIndex < batch.outputIds.length;
      outputIndex += 1
    ) {
      const outputId = batch.outputIds[outputIndex]!;
      const index = frameIndex * batch.outputIds.length + outputIndex;
      const state = studioSimulationPresentationOutputStateFromCodeV2(
        batch.outputStates[index]!,
      );
      const encodedValue = batch.outputValues[index]!;
      outputs[outputId] = Object.freeze({
        outputId,
        value: Number.isNaN(encodedValue) ? null : encodedValue,
        availability: state.availability,
        quality: state.quality,
      });
    }
    frames.push(Object.freeze({
      modelId: batch.terminalFrame.modelId,
      runtimeSessionId: batch.terminalFrame.runtimeSessionId,
      scenarioId: batch.terminalFrame.scenarioId,
      inputEpoch: batch.terminalFrame.inputEpoch,
      acceptedRevision: batch.acceptedRevisions[frameIndex]!,
      acceptedTimeSec: batch.acceptedTimesSec[frameIndex]!,
      outputs: Object.freeze(outputs),
    }));
  }
  frames.push(batch.terminalFrame);
  return Object.freeze(frames);
}

export function studioSimulationPresentationBatchTransferablesV2(
  batch: StudioSimulationPresentationBatchV2,
): readonly ArrayBuffer[] {
  // A future flat kernel may expose several typed views over one destination
  // page. Transfer each backing store once so that such a valid packed page
  // cannot fail with a duplicate-transfer DataCloneError.
  return Object.freeze([...new Set([
    batch.acceptedRevisions.buffer,
    batch.acceptedTimesSec.buffer,
    batch.outputStates.buffer,
    batch.outputValues.buffer,
  ])]);
}

export function studioSimulationPresentationOutputStateCodeV2(
  output: Pick<
    StudioSimulationOutputValueV2,
    "availability" | "quality"
  >,
): number {
  const availabilityOffset = output.availability === "available" ? 0 : 3;
  return availabilityOffset + qualityCodeV2(output.quality);
}

export function studioSimulationPresentationOutputStateFromCodeV2(
  code: number,
): Pick<StudioSimulationOutputValueV2, "availability" | "quality"> {
  if (
    !Number.isInteger(code)
    || code < 0
    || code >= STUDIO_SIMULATION_PRESENTATION_OUTPUT_STATE_COUNT_V2
  ) {
    throw new Error("presentation output state code is invalid");
  }
  return Object.freeze({
    availability: code < 3
      ? "available"
      : "not-evaluated-at-accepted-state",
    quality: qualityFromCodeV2(code % 3),
  });
}

function qualityCodeV2(quality: StudioSimulationOutputQualityV2): number {
  switch (quality) {
    case "authoritative-state":
      return 0;
    case "accepted-derived":
      return 1;
    case "not-assessed":
      return 2;
  }
}

function qualityFromCodeV2(code: number): StudioSimulationOutputQualityV2 {
  switch (code) {
    case 0:
      return "authoritative-state";
    case 1:
      return "accepted-derived";
    case 2:
      return "not-assessed";
    default:
      throw new Error("presentation output quality code is invalid");
  }
}
