import type { PresentationAnalysisCollectorV1 } from "@/analysis/contracts/PresentationAnalysisV1";
import type { RegisteredModelPresentationBatchV2, StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import {
  buildMainWireCardiacCycleMetricsV1,
  MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID as methodId,
  MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1 as requiredIds,
  type MainWireCardiacCycleAcceptedSampleV1 as Sample,
  type MainWireCardiacCycleMetricsV1 as Result,
} from "./MainWireCardiacCycleMetricsV1";

const phaseId = "rhythm.phase.regular-sinus";
const maximumSamples = 4_002; // Bounded observation window: at most 8 s at 2 ms.
const emptyResult = buildMainWireCardiacCycleMetricsV1([]);
const pendingReason = "insufficient-complete-regular-sinus-cycles";

/** One collector per method/Scenario in the existing numerical Worker.
 * Append every 2-ms sample, evaluate only on a completed phase-delimited beat.
 * Neither a visual history buffer nor a separately advanced simulation. */
export class MainWireCardiacCycleCollectorV1 implements PresentationAnalysisCollectorV1 {
  #scope = "";
  #samples: Sample[] = [];
  #hasBoundary = false;
  #lastUnavailable: string | undefined;

  ingest(batch: RegisteredModelPresentationBatchV2): StudioSimulationAnalysisV2 | undefined {
    const frame = batch.terminalFrame;
    const scope = JSON.stringify([frame.modelId, frame.runtimeSessionId, frame.scenarioId, frame.inputEpoch]);
    let emission: StudioSimulationAnalysisV2 | undefined;
    const emit = (sample: Pick<Sample, "acceptedRevision" | "acceptedTimeSec">, result: Result) => {
      emission = Object.freeze({
        modelId: frame.modelId, runtimeSessionId: frame.runtimeSessionId,
        scenarioId: frame.scenarioId, inputEpoch: frame.inputEpoch,
        sourceAcceptedRevision: sample.acceptedRevision,
        sourceAcceptedTimeSec: sample.acceptedTimeSec, analysisId: methodId, payload: result,
      });
    };
    const invalidate = (sample: Pick<Sample, "acceptedRevision" | "acceptedTimeSec">) => {
      this.#samples = [];
      this.#hasBoundary = false;
      if (this.#lastUnavailable !== pendingReason) emit(sample, emptyResult);
      this.#lastUnavailable = pendingReason;
    };
    if (scope !== this.#scope) {
      this.#scope = scope;
      this.#lastUnavailable = undefined;
      invalidate({ acceptedRevision: batch.acceptedRevisions[0]!, acceptedTimeSec: batch.acceptedTimesSec[0]! });
    }
    const columns = requiredIds.map(id => batch.outputIds.indexOf(id));
    for (let row = 0; row < batch.acceptedRevisions.length; row++) {
      const sample: Sample = {
        inputEpoch: frame.inputEpoch,
        acceptedRevision: batch.acceptedRevisions[row]!,
        acceptedTimeSec: batch.acceptedTimesSec[row]!,
        values: Object.fromEntries(requiredIds.map((id, index) => {
          const column = columns[index]!;
          const offset = row * batch.outputIds.length + column;
          // Codes 0/1 are assessed values; available-but-not-assessed (2) is not an observation.
          return [id, column < 0 || batch.outputStates[offset]! >= 2
            ? null : batch.outputValues[offset]!];
        })),
      };
      if (requiredIds.some(id => !Number.isFinite(sample.values[id])) || sample.values[phaseId]! < 0
        || sample.values[phaseId]! >= 1 + 1e-12) {
        invalidate(sample);
        continue;
      }
      let previous = this.#samples.at(-1);
      if (previous && (sample.acceptedRevision <= previous.acceptedRevision
        || Math.abs(sample.acceptedTimeSec - previous.acceptedTimeSec - 0.002) > 2e-12
        || (sample.values[phaseId]! <= previous.values[phaseId]!
          && previous.values[phaseId]! - sample.values[phaseId]! <= .5))) {
        invalidate(sample);
        previous = undefined;
      }
      this.#samples.push(sample);
      if (previous && previous.values[phaseId]! - sample.values[phaseId]! > .5) {
        if (this.#hasBoundary) {
          // Invalid observations must not stop or alter the numerical runtime.
          let result: Result;
          try { result = buildMainWireCardiacCycleMetricsV1(this.#samples); }
          catch { result = emptyResult; }
          if (result.status === "available" || result.reason !== this.#lastUnavailable) emit(sample, result);
          this.#lastUnavailable = result.status === "available" ? undefined : result.reason;
        }
        this.#samples = [previous, sample];
        this.#hasBoundary = true;
      } else if (this.#samples.length > maximumSamples) {
        invalidate(sample);
        this.#samples.push(sample);
      }
    }
    return emission;
  }
}
