import type { PresentationAnalysisCollectorV1 } from "@/analysis/contracts/PresentationAnalysisV1";
import type { RegisteredModelPresentationBatchV2, StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import type { MainWireCardiacCycleAcceptedSampleV1 as Sample } from "./MainWireCardiacCycleMetricsV1";
import { buildMainWireFillingFlowMetricsV1 as build, MAIN_WIRE_FILLING_FLOW_METHOD_V1_ID as methodId,
  MAIN_WIRE_FILLING_FLOW_REQUIRED_EXACT_OUTPUT_IDS_V1 as requiredIds, type MainWireFillingFlowResultV1 as Result } from "./MainWireFillingFlowMetricsV1";

const maximumSamples = 8_002; // Two complete cycles, bounded to 16 s on the 2-ms grid.
const phaseId = requiredIds[0];
const pending = build([]);

/** Streaming append only; evaluate once per beat after its following A wave
 * has completed. Each observed filling sequence is delayed by one phase cycle.
 * No extra Worker, solver step, visual history readback or cross-epoch reuse. */
export class MainWireFillingFlowCollectorV1 implements PresentationAnalysisCollectorV1 {
  #scope = "";
  #samples: Sample[] = [];
  #boundaryIndices: number[] = [];
  #lastUnavailable = "";

  ingest(batch: RegisteredModelPresentationBatchV2): StudioSimulationAnalysisV2 | undefined {
    const frame = batch.terminalFrame;
    const scope = JSON.stringify([frame.modelId, frame.runtimeSessionId, frame.scenarioId, frame.inputEpoch]);
    let emission: StudioSimulationAnalysisV2 | undefined;
    const emit = (sample: Pick<Sample, "acceptedRevision" | "acceptedTimeSec">, result: Result) => {
      const unavailable = result.status === "unavailable" ? JSON.stringify(result.unavailableReasons) : "";
      if (!unavailable || unavailable !== this.#lastUnavailable) emission = {
        modelId: frame.modelId, runtimeSessionId: frame.runtimeSessionId, scenarioId: frame.scenarioId,
        inputEpoch: frame.inputEpoch, sourceAcceptedRevision: sample.acceptedRevision,
        sourceAcceptedTimeSec: sample.acceptedTimeSec, analysisId: methodId, payload: result,
      };
      this.#lastUnavailable = unavailable;
    };
    const reset = (sample: Pick<Sample, "acceptedRevision" | "acceptedTimeSec">) => {
      this.#samples = []; this.#boundaryIndices = []; emit(sample, pending);
    };
    if (scope !== this.#scope) {
      this.#scope = scope; this.#lastUnavailable = "";
      reset({ acceptedRevision: batch.acceptedRevisions[0]!, acceptedTimeSec: batch.acceptedTimesSec[0]! });
    }
    const columns = requiredIds.map(id => batch.outputIds.indexOf(id));
    for (let row = 0; row < batch.acceptedRevisions.length; row++) {
      const sample: Sample = { inputEpoch: frame.inputEpoch, acceptedRevision: batch.acceptedRevisions[row]!,
        acceptedTimeSec: batch.acceptedTimesSec[row]!, values: Object.fromEntries(requiredIds.map((id, i) => {
          const column = columns[i]!, offset = row * batch.outputIds.length + column;
          // Require an assessed value, not merely availability (code 2 is not-assessed).
          return [id, column < 0 || batch.outputStates[offset]! >= 2 ? null : batch.outputValues[offset]!];
        })) };
      if (requiredIds.some(id => !Number.isFinite(sample.values[id])) || sample.values[phaseId]! < 0 || sample.values[phaseId]! >= 1 + 1e-12) {
        reset(sample); continue;
      }
      let previous = this.#samples.at(-1);
      if (previous && (sample.acceptedRevision <= previous.acceptedRevision
        || Math.abs(sample.acceptedTimeSec - previous.acceptedTimeSec - .002) > 2e-12
        || (sample.values[phaseId]! <= previous.values[phaseId]! && previous.values[phaseId]! - sample.values[phaseId]! <= .5))) {
        reset(sample); previous = undefined;
      }
      this.#samples.push(sample);
      if (previous && previous.values[phaseId]! - sample.values[phaseId]! > .5) {
        this.#boundaryIndices.push(this.#samples.length - 2);
        if (this.#boundaryIndices.length === 3) {
          let result: Result;
          try { result = build(this.#samples); } catch { result = pending; }
          emit(sample, result);
          const remove = this.#boundaryIndices[1]!;
          this.#samples = this.#samples.slice(remove);
          this.#boundaryIndices = this.#boundaryIndices.slice(1).map(index => index - remove);
        }
      }
      if (this.#samples.length > maximumSamples) { reset(sample); this.#samples.push(sample); }
    }
    return emission;
  }
}
