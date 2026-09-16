import { STUDIO_PV_TRAIL_MAX_BEATS_V2 } from "@/studio/contracts/v2/content";
import { finiteWorkbenchScalarValueV3, type WorkbenchScalarSampleV3 } from "./WorkbenchScalarSampleV3";

export type WorkbenchCompletedCyclesV3 = readonly (readonly WorkbenchScalarSampleV3[])[];
const EMPTY_CYCLES: WorkbenchCompletedCyclesV3 = Object.freeze([]);
// A safety bound for missing/abnormal phase transitions, not a normal beat window.
const MAX_ACTIVE_POINTS = 16_384;

/** Presentation-only, model-phase-bound ring. Each incoming sample is visited
 * once; completed exact cycles are frozen once and shared across graph panes. */
export class WorkbenchCompletedCycleBufferV3 {
  readonly phaseOutputId: string;
  #completed: WorkbenchCompletedCyclesV3 = EMPTY_CYCLES;
  #active: WorkbenchScalarSampleV3[] = [];
  #startsAtBoundary = false;
  #last: WorkbenchScalarSampleV3 | undefined;
  #lastPhase: number | null = null;
  #minimumPhase = Infinity;
  #maximumPhase = -Infinity;
  #activeSnapshot: readonly WorkbenchScalarSampleV3[] | undefined;
  #cyclePosition = 0;

  constructor(phaseOutputId: string) { this.phaseOutputId = phaseOutputId; }
  get snapshot(): WorkbenchCompletedCyclesV3 { return this.#completed; }
  get cyclePosition(): number { return this.#cyclePosition; }
  get currentCycle(): readonly WorkbenchScalarSampleV3[] {
    return this.#activeSnapshot ??= Object.freeze([...this.#active]);
  }
  clone(): WorkbenchCompletedCycleBufferV3 {
    const copy = new WorkbenchCompletedCycleBufferV3(this.phaseOutputId);
    copy.#completed = this.#completed;
    copy.#active = [...this.#active];
    copy.#startsAtBoundary = this.#startsAtBoundary;
    copy.#last = this.#last;
    copy.#lastPhase = this.#lastPhase;
    copy.#minimumPhase = this.#minimumPhase;
    copy.#maximumPhase = this.#maximumPhase;
    copy.#cyclePosition = this.#cyclePosition;
    return copy;
  }
  append(samples: readonly WorkbenchScalarSampleV3[]): void {
    this.#activeSnapshot = undefined;
    for (const sample of samples) {
      const last = this.#last;
      if (last && (sample.inputEpoch !== last.inputEpoch || sample.acceptedTimeSec < last.acceptedTimeSec
        || sample.acceptedRevision < last.acceptedRevision)) {
        this.#completed = EMPTY_CYCLES;
        this.#start(undefined, false);
        this.#lastPhase = null;
      } else if (last && sample.acceptedRevision === last.acceptedRevision
        && sample.acceptedTimeSec === last.acceptedTimeSec) continue;
      const phase = finiteWorkbenchScalarValueV3(sample, this.phaseOutputId);
      this.#last = sample;
      if (phase === null || phase < 0 || phase >= 1 || !Number.isFinite(sample.acceptedTimeSec)) {
        this.#start(undefined, false);
        this.#lastPhase = null;
        continue;
      }
      const wraps = this.#lastPhase !== null && phase + 1e-6 < this.#lastPhase;
      if (this.#lastPhase !== null) this.#cyclePosition += Math.max(0, phase - this.#lastPhase + (wraps ? 1 : 0));
      if (wraps) {
        if (this.#startsAtBoundary && this.#active.length >= 3 && this.#maximumPhase - this.#minimumPhase >= 0.8) {
          // Include the real next-boundary state, never a synthetic closing edge.
          this.#active.push(sample);
          this.#completed = Object.freeze([...this.#completed, Object.freeze(this.#active)].slice(-STUDIO_PV_TRAIL_MAX_BEATS_V2));
        }
        this.#start(sample, true);
      } else if (this.#active.length === 0) {
        this.#start(sample, phase <= 0.03);
      } else if (this.#active.length >= MAX_ACTIVE_POINTS) {
        this.#start(sample, false);
      } else {
        this.#active.push(sample);
        this.#minimumPhase = Math.min(this.#minimumPhase, phase);
        this.#maximumPhase = Math.max(this.#maximumPhase, phase);
      }
      this.#lastPhase = phase;
    }
  }
  #start(sample: WorkbenchScalarSampleV3 | undefined, startsAtBoundary: boolean): void {
    this.#active = sample ? [sample] : [];
    this.#startsAtBoundary = startsAtBoundary;
    const phase = sample ? finiteWorkbenchScalarValueV3(sample, this.phaseOutputId) : null;
    this.#minimumPhase = phase ?? Infinity;
    this.#maximumPhase = phase ?? -Infinity;
  }
}
