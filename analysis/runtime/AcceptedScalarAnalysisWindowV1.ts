import type {
  MainWireCardiacCycleAcceptedSampleV1,
} from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";
import type {
  StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";

const DEFAULT_ACCEPTED_ANALYSIS_WINDOW_SEC_V1 = 8;
const EMPTY_ACCEPTED_ANALYSIS_SAMPLES_V1 = Object.freeze(
  [] as MainWireCardiacCycleAcceptedSampleV1[],
);

export type AcceptedScalarAnalysisWindowSnapshotV1 = Readonly<
  Record<string, readonly MainWireCardiacCycleAcceptedSampleV1[]>
>;
const EMPTY_ACCEPTED_ANALYSIS_SNAPSHOT_V1 = Object.freeze(
  Object.create(null),
) as AcceptedScalarAnalysisWindowSnapshotV1;

export type AcceptedScalarAnalysisWindowOptionsV1 = Readonly<{
  requiredExactOutputIds: readonly string[];
  expectedFrameIntervalSec: number;
  windowSec?: number;
}>;

type ScenarioWindowV1 = Readonly<{
  inputEpoch: number;
  samples: readonly MainWireCardiacCycleAcceptedSampleV1[];
}>;

/**
 * Analysis-owned retention of every exact presentation-boundary frame
 * delivered by the runtime. Internal accepted solver substeps remain exact
 * model semantics but are not exposed as frames. This store is separate from
 * visual sweep/orbit buffers: no bucketization, resampling, presentation-time
 * remapping, or pane-dependent trimming occurs.
 */
export class AcceptedScalarAnalysisWindowStoreV1 {
  readonly #requiredExactOutputIds: readonly string[];
  readonly #expectedFrameIntervalSec: number;
  readonly #windowSec: number;
  readonly #windows = new Map<string, ScenarioWindowV1>();
  readonly #listeners = new Set<() => void>();
  #snapshot: AcceptedScalarAnalysisWindowSnapshotV1 =
    EMPTY_ACCEPTED_ANALYSIS_SNAPSHOT_V1;

  constructor(options: AcceptedScalarAnalysisWindowOptionsV1) {
    const required = [...new Set(options.requiredExactOutputIds)];
    const windowSec = options.windowSec
      ?? DEFAULT_ACCEPTED_ANALYSIS_WINDOW_SEC_V1;
    const expectedFrameIntervalSec = options.expectedFrameIntervalSec;
    if (
      required.length === 0
      || required.some((outputId) => outputId.length === 0)
      || !Number.isFinite(expectedFrameIntervalSec)
      || expectedFrameIntervalSec <= 0
      || !Number.isFinite(windowSec)
      || windowSec <= 0
    ) {
      throw new Error("Accepted analysis window configuration is invalid");
    }
    this.#requiredExactOutputIds = Object.freeze(required);
    this.#expectedFrameIntervalSec = expectedFrameIntervalSec;
    this.#windowSec = windowSec;
  }

  get requiredExactOutputIds(): readonly string[] {
    return this.#requiredExactOutputIds;
  }

  appendFrames(frames: readonly StudioSimulationFrameV2[]): void {
    const grouped = new Map<string, StudioSimulationFrameV2[]>();
    for (const frame of frames) {
      const scenarioFrames = grouped.get(frame.scenarioId) ?? [];
      scenarioFrames.push(frame);
      grouped.set(frame.scenarioId, scenarioFrames);
    }
    let changed = false;
    for (const [scenarioId, scenarioFrames] of grouped) {
      for (const frame of scenarioFrames) {
        changed = this.#appendFrame(scenarioId, frame) || changed;
      }
    }
    if (changed) this.#publishSnapshot();
  }

  readonly getSnapshot = (): AcceptedScalarAnalysisWindowSnapshotV1 =>
    this.#snapshot;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  getScenarioSamples(
    scenarioId: string,
  ): readonly MainWireCardiacCycleAcceptedSampleV1[] {
    return this.#windows.get(scenarioId)?.samples
      ?? EMPTY_ACCEPTED_ANALYSIS_SAMPLES_V1;
  }

  resetScenario(scenarioId: string): boolean {
    const changed = this.#windows.delete(scenarioId);
    if (changed) this.#publishSnapshot();
    return changed;
  }

  removeScenario(scenarioId: string): boolean {
    return this.resetScenario(scenarioId);
  }

  reset(): void {
    if (this.#windows.size === 0) return;
    this.#windows.clear();
    this.#publishSnapshot();
  }

  #appendFrame(scenarioId: string, frame: StudioSimulationFrameV2): boolean {
    const values: Record<string, number | null> = {};
    for (const outputId of this.#requiredExactOutputIds) {
      const output = frame.outputs[outputId];
      if (
        output?.availability !== "available"
        || output.quality === "not-assessed"
        || typeof output.value !== "number"
        || !Number.isFinite(output.value)
      ) {
        return this.#windows.delete(scenarioId);
      }
      values[outputId] = Object.is(output.value, -0) ? 0 : output.value;
    }
    const next = Object.freeze({
      inputEpoch: frame.inputEpoch,
      acceptedRevision: frame.acceptedRevision,
      acceptedTimeSec: frame.acceptedTimeSec,
      values: Object.freeze(values),
    });
    const current = this.#windows.get(scenarioId);
    const previous = current?.samples.at(-1);
    let retained: readonly MainWireCardiacCycleAcceptedSampleV1[];
    if (
      current === undefined
      || current.inputEpoch !== frame.inputEpoch
      || previous === undefined
      || frame.acceptedRevision <= previous.acceptedRevision
      || !continuousFrameIntervalV1(
        previous.acceptedTimeSec,
        frame.acceptedTimeSec,
        this.#expectedFrameIntervalSec,
      )
    ) {
      retained = Object.freeze([next]);
    } else {
      const oldestTimeSec = frame.acceptedTimeSec - this.#windowSec;
      const firstRetainedIndex = firstAtOrAfterV1(
        current.samples,
        oldestTimeSec,
      );
      retained = Object.freeze([
        ...current.samples.slice(firstRetainedIndex),
        next,
      ]);
    }
    this.#windows.set(scenarioId, Object.freeze({
      inputEpoch: frame.inputEpoch,
      samples: retained,
    }));
    return true;
  }

  #publishSnapshot(): void {
    this.#snapshot = this.#windows.size === 0
      ? EMPTY_ACCEPTED_ANALYSIS_SNAPSHOT_V1
      : Object.freeze(Object.fromEntries(
          [...this.#windows].map(([scenarioId, window]) => [
            scenarioId,
            window.samples,
          ]),
        ));
    for (const listener of this.#listeners) listener();
  }
}

function continuousFrameIntervalV1(
  previousTimeSec: number,
  nextTimeSec: number,
  expectedIntervalSec: number,
): boolean {
  const intervalSec = nextTimeSec - previousTimeSec;
  const toleranceSec = Math.max(1e-12, expectedIntervalSec * 1e-9);
  return intervalSec > 0
    && Math.abs(intervalSec - expectedIntervalSec) <= toleranceSec;
}

export function exactOutputSelectionWithAnalysisV1(
  selectedPresentationOutputIds: ReadonlySet<string>,
  requiredAnalysisOutputIds: readonly string[],
): ReadonlySet<string> {
  return new Set([
    ...selectedPresentationOutputIds,
    ...requiredAnalysisOutputIds,
  ]);
}

function firstAtOrAfterV1(
  samples: readonly MainWireCardiacCycleAcceptedSampleV1[],
  timeSec: number,
): number {
  let lower = 0;
  let upper = samples.length;
  while (lower < upper) {
    const middle = lower + Math.floor((upper - lower) / 2);
    if (samples[middle]!.acceptedTimeSec < timeSec) lower = middle + 1;
    else upper = middle;
  }
  // Preserve one preceding endpoint for interpolation at the retained edge.
  return Math.max(0, lower - 1);
}
