import {
  deriveMainWireScientificTransientBeatMetricsV1,
  type MainWireScientificCompleteTransientBeatV1,
  type MainWireScientificDerivedMetricEvaluationV1,
} from "@/engine/scientific/metrics/MainWireScientificDerivedMetricRegistryV1";
import type {
  MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import {
  sameSimulationReleaseRef,
} from "@/engine/scientific/release";

export const MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1 =
  "full-accepted-step-transient-metrics-v1" as const;

const TRANSIENT_METRIC_DT_SEC_V1 = 0.002;
const TRANSIENT_METRIC_STEPS_PER_BEAT_V1 = 500;
const TRANSIENT_METRIC_SAMPLE_COUNT_PER_BEAT_V1 =
  TRANSIENT_METRIC_STEPS_PER_BEAT_V1 + 1;
const TIME_TOLERANCE_SEC_V1 = 1e-10;

/**
 * Scalar result transported after Worker-side accumulation over one complete
 * accepted-step beat. The 501 source frames remain inside the Worker.
 */
export type MainWireScientificTransientMetricIntegrationBeatV1 = Readonly<{
  policyId:
    typeof MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1;
  startAcceptedRevision: number;
  endAcceptedRevision: number;
  startAcceptedTimeSec: number;
  endAcceptedTimeSec: number;
  acceptedStepSampleCount: 501;
  evaluation: MainWireScientificDerivedMetricEvaluationV1;
  evidence: Readonly<{
    acceptedStepReadbackOnly: true;
    bothBeatBoundariesMeasured: true;
    revisionsContiguous: true;
    cadenceUniform2ms: true;
    smoothingOrInterpolationApplied: false;
    periodicOrbitClaimed: false;
    exactExportEquivalent: false;
  }>;
}>;

export type MainWireScientificTransientMetricIntegrationResultV1 =
  Readonly<{
    policyId:
      typeof MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1;
    acceptedStepFrameCountThisCall: number;
    latestCompletedBeat:
      MainWireScientificTransientMetricIntegrationBeatV1 | null;
  }>;

export type MainWireScientificTransientMetricAccumulatorV1 = Readonly<{
  update(
    frame: MainWireScientificObservableFrameV1,
  ): MainWireScientificTransientMetricIntegrationBeatV1 | null;
}>;

/**
 * Constant-policy Worker-side accumulator.
 *
 * It retains at most one 501-frame beat inside the Worker, evaluates the
 * existing complete-transient-beat metric contract unchanged, and returns
 * only the finalized scalar evaluation. A restore/readback frame is never
 * promoted into accepted-step evidence: collection starts only on an actual
 * accepted-step phase-zero frame.
 */
export function createMainWireScientificTransientMetricAccumulatorV1():
MainWireScientificTransientMetricAccumulatorV1 {
  let activeFrames: MainWireScientificObservableFrameV1[] | null = null;

  return Object.freeze({
    update(
      frame: MainWireScientificObservableFrameV1,
    ): MainWireScientificTransientMetricIntegrationBeatV1 | null {
      if (!isAcceptedStepFrameV1(frame)) {
        activeFrames = null;
        return null;
      }

      if (activeFrames !== null && !continuesBeatV1(activeFrames, frame)) {
        activeFrames = null;
      }

      const isBoundary =
        frame.revision % TRANSIENT_METRIC_STEPS_PER_BEAT_V1 === 0;
      if (activeFrames === null) {
        if (isBoundary) activeFrames = [frame];
        return null;
      }

      activeFrames.push(frame);
      if (!isBoundary) return null;

      const completedFrames = activeFrames;
      activeFrames = [frame];
      if (
        completedFrames.length
          !== TRANSIENT_METRIC_SAMPLE_COUNT_PER_BEAT_V1
      ) return null;

      const first = completedFrames[0]!;
      if (
        frame.revision - first.revision
          !== TRANSIENT_METRIC_STEPS_PER_BEAT_V1
        || Math.abs(
          frame.acceptedTimeSec - first.acceptedTimeSec - 1,
        ) > TIME_TOLERANCE_SEC_V1
      ) return null;

      const beat = Object.freeze({
        frames: Object.freeze([...completedFrames]),
        releaseRef: first.releaseRef,
        durationSec: 1,
        evidence: Object.freeze({
          exactReleaseRefUniform: true as const,
          revisionsContiguous: true as const,
          cadenceUniform: true as const,
          bothBeatBoundariesMeasured: true as const,
          transientBeatFullyMeasured: true as const,
          smoothingOrInterpolationApplied: false as const,
        }),
      }) satisfies MainWireScientificCompleteTransientBeatV1;
      const evaluation =
        deriveMainWireScientificTransientBeatMetricsV1(beat);
      if (
        evaluation.cycleAvailability !== "provisional"
        || evaluation.cycleInterpretation
          !== "provisional-complete-transient-beat"
      ) {
        throw new Error(
          "full accepted-step transient metric beat failed evaluation",
        );
      }
      return Object.freeze({
        policyId:
          MAIN_WIRE_SCIENTIFIC_TRANSIENT_METRIC_INTEGRATION_POLICY_V1,
        startAcceptedRevision: first.revision,
        endAcceptedRevision: frame.revision,
        startAcceptedTimeSec: first.acceptedTimeSec,
        endAcceptedTimeSec: frame.acceptedTimeSec,
        acceptedStepSampleCount: 501 as const,
        evaluation,
        evidence: Object.freeze({
          acceptedStepReadbackOnly: true as const,
          bothBeatBoundariesMeasured: true as const,
          revisionsContiguous: true as const,
          cadenceUniform2ms: true as const,
          smoothingOrInterpolationApplied: false as const,
          periodicOrbitClaimed: false as const,
          exactExportEquivalent: false as const,
        }),
      });
    },
  });
}

function isAcceptedStepFrameV1(
  frame: MainWireScientificObservableFrameV1,
): boolean {
  return frame.source === "accepted-step"
    && Number.isSafeInteger(frame.revision)
    && frame.revision >= 0
    && Number.isFinite(frame.acceptedTimeSec)
    && frame.acceptedTimeSec >= 0;
}

function continuesBeatV1(
  activeFrames: readonly MainWireScientificObservableFrameV1[],
  frame: MainWireScientificObservableFrameV1,
): boolean {
  const previous = activeFrames.at(-1);
  if (previous === undefined) return false;
  return frame.revision === previous.revision + 1
    && Math.abs(
      frame.acceptedTimeSec
        - previous.acceptedTimeSec
        - TRANSIENT_METRIC_DT_SEC_V1,
    ) <= TIME_TOLERANCE_SEC_V1
    && sameSimulationReleaseRef(frame.releaseRef, previous.releaseRef);
}
