import {
  MAIN_WIRE_INTEGRATED_MODEL_STARLING_PROTOCOL_REQUIREMENT_V3,
  type MainWireIntegratedModelPressureVolumeLoopPointV3,
  type MainWireIntegratedModelStarlingLocusV3,
  type MainWireIntegratedModelStarlingPointV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import type {
  MainWireIntegratedModelCompletedBeatMetricsV3,
  MainWireIntegratedModelPressureVolumeLandmarkV3,
  MainWireIntegratedModelVentricularPressureVolumeLandmarksV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  type MainWireIntegratedModelObservationV3,
  MainWireIntegratedModelSessionV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import type { MainWireIntegratedModelHemodynamicResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
  type MainWireIntegratedModelResponsiveStarlingPartitionV3,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";

export {
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
  type MainWireIntegratedModelResponsiveStarlingPartitionV3,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";

export const MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_PROTOCOL_V3_ID =
  "main-wire-integrated-model-responsive-fixed-tone-tbv-starling-preview-v3" as const;

/**
 * Deterministic first targets. The low chain may replace an unsafe target by
 * bisection against its last reliable point, so actual low scales can differ.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_TBV_SCALES_V3 =
  Object.freeze([
    0.23, 0.27, 0.31, 0.36, 0.42, 0.48, 0.54, 0.6, 0.66, 0.72, 0.78, 0.84, 0.9,
    0.95, 1, 1.08, 1.16, 1.24, 1.32, 1.4,
  ] as const);

export const MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_TBV_SCALES_V3 =
  Object.freeze([
    0.95, 0.9, 0.84, 0.78, 0.72, 0.66, 0.6, 0.54, 0.48, 0.42, 0.36, 0.31, 0.27,
    0.23,
  ] as const);

export const MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_TBV_SCALES_V3 =
  Object.freeze([1.08, 1.16, 1.24, 1.32, 1.4] as const);

export const MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_LOW_FLOW_TARGET_L_PER_MIN_V3 = 0.5;

export const MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID =
  "main-wire-integrated-model-fixed-tone-settled-hot-start-pv-family-v1" as const;

/**
 * The PVA relation follows one monotone adaptive preload-reduction chain from
 * the settled Scenario anchor to at least 60% of source TBV. Coronary tone is
 * held at the source value and every retained point passes complete-beat P1
 * closure. Step size responds to the preceding point's settlement effort; the
 * chain still retains at least nine points across the declared volume span.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_POINT_COUNT_V3 = 9;
export const MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3 = 0.6;

/**
 * Nominal low-volume targets used only to extend the shared Starling family.
 * The PVA/ESPVR/EDPVR fit remains limited to the adaptive
 * operating-anchor-to-60% core above, so this tail cannot change PVA.
 * Rejected jumps insert settled midpoints and the limb stops at low flow or a
 * bounded numerical boundary.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_FORMAL_STARLING_LOW_EXTENSION_TBV_SCALES_V3 =
  Object.freeze([0.54, 0.48, 0.42, 0.36, 0.31, 0.27, 0.23] as const);

/** High-volume arm retained for the bidirectional Starling presentation. */
export const MAIN_WIRE_INTEGRATED_MODEL_FORMAL_STARLING_HYPERVOLEMIC_TBV_SCALES_V3 =
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_TBV_SCALES_V3;

export const MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_CORE_POINT_COUNT_V3 =
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_POINT_COUNT_V3;

const MAIN_WIRE_INTEGRATED_MODEL_FORMAL_SETTLED_FAMILY_POINT_COUNT_V3 =
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_CORE_POINT_COUNT_V3 +
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_STARLING_LOW_EXTENSION_TBV_SCALES_V3.length +
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_STARLING_HYPERVOLEMIC_TBV_SCALES_V3.length;

export function mainWireIntegratedModelFormalPvaTargetGlobalTbvMlV3(
  sourceGlobalTbvMl: number,
  scale: number,
): number {
  if (
    !Number.isFinite(sourceGlobalTbvMl) ||
    !(sourceGlobalTbvMl > 0) ||
    !Number.isFinite(scale) ||
    !(scale > 0) ||
    scale > 1
  ) {
    throw new Error("formal PVA TBV scale must lie in (0, 1]");
  }
  return sourceGlobalTbvMl * scale;
}

const MINIMUM_COMPLETE_BEAT_COUNT_V3 = 3;
const STANDARD_MAXIMUM_COMPLETE_BEAT_COUNT_V3 = 5;
const DEEP_HYPOVOLEMIC_MAXIMUM_COMPLETE_BEAT_COUNT_V3 = 12;
const FORMAL_SOURCE_MAXIMUM_COMPLETE_BEAT_COUNT_V3 = 20;
const CENTER_MAXIMUM_COMPLETE_BEAT_COUNT_V3 = 20;
const MAXIMUM_MEASUREMENT_DURATION_SEC_V3 = 36;
const RESPONSIVE_PROTOCOL_SAMPLE_DT_SEC_V3 = 0.02;
const FORMAL_PROTOCOL_SAMPLE_DT_SEC_V3 = 0.01;
const FIXED_TBV_TOLERANCE_ML_V3 = 1e-6;
const MAXIMUM_RESPONSIVE_PRESENTATION_ADVANCES_PER_POINT_V3 = 1_000;
const MAXIMUM_FORMAL_PRESENTATION_ADVANCES_PER_POINT_V3 = 4_000;
const MAXIMUM_LOW_TARGET_ATTEMPTS_PER_POINT_V3 = 8;
const MAXIMUM_FORMAL_HOT_START_ATTEMPTS_PER_POINT_V3 = 8;
const MINIMUM_LOW_SCALE_BRACKET_V3 = 0.01;
const MINIMUM_FORMAL_TBV_BRACKET_ML_V3 = 1;
const FORMAL_PVA_INITIAL_SCALE_STEP_V3 = 0.07;
const FORMAL_PVA_MINIMUM_SCALE_STEP_V3 = 0.005;
const FORMAL_PVA_MAXIMUM_SCALE_STEP_V3 = 0.07;
const FLOW_ABSOLUTE_CLOSURE_L_PER_MIN_V3 = 0.05;
const FLOW_RELATIVE_CLOSURE_V3 = 0.01;
const ATRIAL_PRESSURE_CLOSURE_MMHG_V3 = 0.15;
const AORTIC_PRESSURE_CLOSURE_MMHG_V3 = 0.5;
const VENTRICULAR_VOLUME_CLOSURE_ML_V3 = 1;
const EARLY_PREVIEW_MAXIMUM_CLOSURE_SCORE_V3 = 2;
const FINAL_PREVIEW_MAXIMUM_CLOSURE_SCORE_V3 = 4;
const DESCENDING_LIMB_ABSOLUTE_DROP_L_PER_MIN_V3 = 0.15;
const DESCENDING_LIMB_RELATIVE_DROP_V3 = 0.03;
const DESCENDING_LIMB_STEP_TOLERANCE_L_PER_MIN_V3 = 0.01;
const MINIMUM_PRESSURE_VOLUME_LOOP_SAMPLE_COUNT_V3 = 12;

type StarlingPairV3 = Readonly<{
  right: MainWireIntegratedModelStarlingPointV3;
  left: MainWireIntegratedModelStarlingPointV3;
}>;

type PressureVolumeLoopPairV3 = Readonly<{
  left: readonly MainWireIntegratedModelPressureVolumeLoopPointV3[];
  right: readonly MainWireIntegratedModelPressureVolumeLoopPointV3[];
}>;

type CompletedPressureVolumeBeatPairV3 = Readonly<{
  loops: PressureVolumeLoopPairV3;
  completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3;
}>;

class FixedTbvPressureVolumeLoopCollectorV3 {
  private completedBeatId: string | null = null;
  private left: MainWireIntegratedModelPressureVolumeLoopPointV3[] = [];
  private right: MainWireIntegratedModelPressureVolumeLoopPointV3[] = [];

  accept(
    observation: MainWireIntegratedModelObservationV3,
  ): PressureVolumeLoopPairV3 | null {
    const sample = pressureVolumeSamplePairV3(observation);
    const nextCompletedBeatId =
      observation.completedBeatMetrics?.endAtrialCaptureId ?? null;
    if (sample === null || nextCompletedBeatId === null) return null;
    if (this.completedBeatId === null) {
      this.completedBeatId = nextCompletedBeatId;
      this.left = [sample.left];
      this.right = [sample.right];
      return null;
    }
    if (nextCompletedBeatId === this.completedBeatId) {
      this.left.push(sample.left);
      this.right.push(sample.right);
      return null;
    }
    const completed =
      this.left.length >= MINIMUM_PRESSURE_VOLUME_LOOP_SAMPLE_COUNT_V3 &&
      this.right.length >= MINIMUM_PRESSURE_VOLUME_LOOP_SAMPLE_COUNT_V3
        ? Object.freeze({
            left: Object.freeze([...this.left, sample.left]),
            right: Object.freeze([...this.right, sample.right]),
          })
        : null;
    this.completedBeatId = nextCompletedBeatId;
    this.left = [sample.left];
    this.right = [sample.right];
    return completed;
  }
}

class FormalFixedTbvPressureVolumeLoopCollectorV3 {
  private previousPhase01: number | null = null;
  private fullCycleStarted = false;
  private left: MainWireIntegratedModelPressureVolumeLoopPointV3[] = [];
  private right: MainWireIntegratedModelPressureVolumeLoopPointV3[] = [];

  accept(
    observation: MainWireIntegratedModelObservationV3,
  ): CompletedPressureVolumeBeatPairV3 | null {
    const sample = formalPressureVolumeSamplePairV3(observation);
    if (sample === null) return null;
    if (this.previousPhase01 === null) {
      this.previousPhase01 = sample.left.phase01!;
      this.left = [sample.left];
      this.right = [sample.right];
      return null;
    }
    if (sample.left.phase01! >= this.previousPhase01) {
      this.left.push(sample.left);
      this.right.push(sample.right);
      this.previousPhase01 = sample.left.phase01!;
      return null;
    }
    const completed =
      this.fullCycleStarted &&
      this.left.length >= MINIMUM_PRESSURE_VOLUME_LOOP_SAMPLE_COUNT_V3 &&
      this.right.length >= MINIMUM_PRESSURE_VOLUME_LOOP_SAMPLE_COUNT_V3
        ? Object.freeze({
            loops: Object.freeze({
              left: Object.freeze([...this.left]),
              right: Object.freeze([...this.right]),
            }),
            completedBeatMetrics: observation.completedBeatMetrics!,
          })
        : null;
    this.fullCycleStarted = true;
    this.previousPhase01 = sample.left.phase01!;
    this.left = [sample.left];
    this.right = [sample.right];
    return completed;
  }
}

function pressureVolumeSamplePairV3(
  observation: MainWireIntegratedModelObservationV3,
): Readonly<{
  left: MainWireIntegratedModelPressureVolumeLoopPointV3;
  right: MainWireIntegratedModelPressureVolumeLoopPointV3;
}> | null {
  const step = observation.lastAcceptedStep;
  if (step === null) return null;
  const volumes = observation.acceptedState.coronary.circulation.nodeVolumesMl;
  const pressures =
    step.coronaryStep.baseStep.mechanicsTrial.transmuralPressuresMmHg;
  const pair = Object.freeze({
    left: Object.freeze({
      volumeMl: volumes.LV,
      pressureMmHg: pressures.LV,
    }),
    right: Object.freeze({
      volumeMl: volumes.RV,
      pressureMmHg: pressures.RV,
    }),
  });
  if (
    ![
      pair.left.volumeMl,
      pair.left.pressureMmHg,
      pair.right.volumeMl,
      pair.right.pressureMmHg,
    ].every(Number.isFinite)
  )
    throw new Error("fixed-TBV pressure-volume loop sample is not finite");
  return pair;
}

function formalPressureVolumeSamplePairV3(
  observation: MainWireIntegratedModelObservationV3,
): Readonly<{
  left: MainWireIntegratedModelPressureVolumeLoopPointV3 &
    Readonly<{ phase01: number }>;
  right: MainWireIntegratedModelPressureVolumeLoopPointV3 &
    Readonly<{ phase01: number }>;
}> | null {
  const pair = pressureVolumeSamplePairV3(observation);
  const completedBeat = observation.completedBeatMetrics;
  if (pair === null || completedBeat === null) return null;
  const elapsedSinceLastCaptureSec =
    observation.acceptedState.acceptedTimeSec - completedBeat.endTimeSec;
  const phase01 = elapsedSinceLastCaptureSec / completedBeat.durationSec;
  if (!Number.isFinite(phase01) || phase01 < -1e-12 || phase01 >= 1 + 1e-12) {
    throw new Error("fixed-TBV pressure-volume loop phase is outside one beat");
  }
  const ownedPhase01 = Math.max(0, Math.min(1 - Number.EPSILON, phase01));
  return Object.freeze({
    left: Object.freeze({
      ...pair.left,
      phase01: ownedPhase01,
    }),
    right: Object.freeze({
      ...pair.right,
      phase01: ownedPhase01,
    }),
  });
}

type AcceptedBranchV3 = Readonly<{
  status: "accepted";
  branch: MainWireIntegratedModelSessionV3;
  observation: MainWireIntegratedModelObservationV3;
  pair: StarlingPairV3;
}>;

type RejectedBranchV3 = Readonly<{
  status: "rejected";
  reason: string;
}>;

type MeasuredBranchV3 = AcceptedBranchV3 | RejectedBranchV3;

export type MainWireIntegratedModelResponsiveStarlingResultV3 = Readonly<{
  protocolId: typeof MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_PROTOCOL_V3_ID;
  /** Internal exact readback used to anchor the structural return curve. */
  anchorObservation: MainWireIntegratedModelObservationV3;
  right: MainWireIntegratedModelStarlingLocusV3;
  left: MainWireIntegratedModelStarlingLocusV3;
}>;

export type MainWireIntegratedModelFormalPressureVolumeResultV3 = Readonly<{
  protocolId: typeof MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID;
  anchorObservation: MainWireIntegratedModelObservationV3;
  right: MainWireIntegratedModelStarlingLocusV3;
  left: MainWireIntegratedModelStarlingLocusV3;
}>;

/**
 * Fast, ephemeral fixed-tone preload-response preview.
 *
 * One locally period-1-settled center is measured first in the same frozen-tone
 * responsive regime as its surrounding points. Each requested direction then
 * continues independently from that settled boundary and always warm-starts
 * from its previous reliable point. Studio requests the two directions in
 * parallel Workers; an undefined partition retains a complete sequential
 * execution for engine-level use. The source live session is never advanced
 * or modified. It is a fast preview; the PVA path instead requires every
 * retained load to pass the same complete-beat closure gate.
 */
export function runMainWireIntegratedModelResponsiveStarlingProtocolV3(
  sourceSession: MainWireIntegratedModelSessionV3,
  onProgress?: (
    result: MainWireIntegratedModelResponsiveStarlingResultV3,
  ) => void,
  partition?: MainWireIntegratedModelResponsiveStarlingPartitionV3,
): MainWireIntegratedModelResponsiveStarlingResultV3 {
  const sourceGlobalTbvMl =
    sourceSession.currentAcceptedState().coronary.fixedGlobalTotalBloodVolumeMl;
  const paired: StarlingPairV3[] = [];
  let anchorObservation: MainWireIntegratedModelObservationV3 | null = null;
  const result = (
    protocolComplete = false,
  ): MainWireIntegratedModelResponsiveStarlingResultV3 =>
    Object.freeze({
      protocolId: MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_PROTOCOL_V3_ID,
      anchorObservation: requiredAnchorObservationV3(anchorObservation),
      right: responsiveLocusV3(
        paired.map(({ right }) => right),
        protocolComplete,
      ),
      left: responsiveLocusV3(
        paired.map(({ left }) => left),
        protocolComplete,
      ),
    });
  const append = (pair: StarlingPairV3) => {
    paired.push(pair);
    onProgress?.(result());
  };

  const center = measureBranchV3(sourceSession, sourceGlobalTbvMl, {
    role: "operating-anchor",
    maximumBeatCount: CENTER_MAXIMUM_COMPLETE_BEAT_COUNT_V3,
    requireLocalConvergence: true,
  });
  if (
    center.status === "rejected" ||
    !responsiveSettledAnchorPairV3(center.pair)
  ) {
    throw new Error(
      center.status === "rejected"
        ? `responsive Starling settled center rejected: ${center.reason}`
        : "responsive Starling center did not establish local period-1 closure",
    );
  }
  anchorObservation = center.observation;
  append(center.pair);
  if (!center.pair.left.curveEligible || !center.pair.right.curveEligible) {
    return result(true);
  }

  if (
    partition === undefined ||
    partition ===
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3
  )
    runHypovolemicChainV3(center.branch, sourceGlobalTbvMl, append);
  if (
    partition === undefined ||
    partition ===
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3
  )
    runHypervolemicChainV3(
      center.branch,
      center.pair,
      sourceGlobalTbvMl,
      append,
    );
  return result(true);
}

/**
 * Shared settled pressure-volume / Starling protocol.
 *
 * The live Scenario is never advanced. A persistent analysis Worker first
 * settles an isolated copy at the Scenario TBV with the active coronary
 * controller. It then freezes the controller state at that settled endpoint
 * and admits each load after three consecutive complete beats satisfy the
 * declared flow/pressure/volume closure gates. The adaptive low-volume core
 * publishes progressive PVA previews while a second persistent Worker may run
 * the high-volume Starling arm from the same captured Scenario source.
 */
export async function runMainWireIntegratedModelFormalPressureVolumeProtocolV3(
  sourceSession: MainWireIntegratedModelSessionV3,
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
  onProgress?: (
    result: MainWireIntegratedModelFormalPressureVolumeResultV3,
  ) => void,
  partition?: MainWireIntegratedModelResponsiveStarlingPartitionV3,
): Promise<MainWireIntegratedModelFormalPressureVolumeResultV3> {
  const sourceGlobalTbvMl =
    sourceSession.currentAcceptedState().coronary.fixedGlobalTotalBloodVolumeMl;
  if (
    Math.abs(sourceGlobalTbvMl - hemodynamicResearchInputs.totalBloodVolumeMl) >
    FIXED_TBV_TOLERANCE_ML_V3
  ) {
    throw new Error("formal PVA source and Scenario TBV differ");
  }
  const paired: StarlingPairV3[] = [];
  let anchorObservation: MainWireIntegratedModelObservationV3 | null = null;
  const expectedPointCount = formalExpectedPointCountV3(partition);
  const result = (
    protocolComplete = false,
  ): MainWireIntegratedModelFormalPressureVolumeResultV3 =>
    Object.freeze({
      protocolId:
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID,
      anchorObservation: requiredAnchorObservationV3(anchorObservation),
      right: formalPressureVolumeLocusV3(
        paired.map(({ right }) => right),
        protocolComplete,
        expectedPointCount,
      ),
      left: formalPressureVolumeLocusV3(
        paired.map(({ left }) => left),
        protocolComplete,
        expectedPointCount,
      ),
    });
  const append = (pair: StarlingPairV3) => {
    paired.push(pair);
    onProgress?.(result());
  };
  const settledSource = settleFormalPressureVolumeSourceV3(
    sourceSession,
    sourceGlobalTbvMl,
  );
  if (settledSource.status === "rejected") {
    throw new Error(
      `formal pressure-volume source rejected: ${settledSource.reason}`,
    );
  }
  const center = await measureFormalPressureVolumeBranchV3(
    settledSource.branch,
    sourceGlobalTbvMl,
    "operating-anchor",
  );
  if (center.status === "rejected" || !formalPairQualifiedV3(center.pair)) {
    throw new Error(
      center.status === "rejected"
        ? `formal pressure-volume center rejected: ${center.reason}`
        : "formal pressure-volume center did not establish periodic closure",
    );
  }
  anchorObservation = center.observation;
  append(center.pair);

  let lowBoundary = Object.freeze({
    branch: center.branch,
    targetGlobalTbvMl: sourceGlobalTbvMl,
  });
  if (
    partition === undefined ||
    partition ===
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3
  ) {
    lowBoundary = await runFormalPressureVolumeChainV3(
      center.branch,
      sourceGlobalTbvMl,
      append,
    );
  }
  if (
    partition === undefined ||
    partition ===
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3
  ) {
    await runFormalHypervolemicStarlingChainV3(
      center.branch,
      center.pair,
      sourceGlobalTbvMl,
      append,
    );
  }
  if (
    partition === undefined ||
    partition ===
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3
  ) {
    await runFormalLowStarlingExtensionV3(
      lowBoundary.branch,
      sourceGlobalTbvMl,
      lowBoundary.targetGlobalTbvMl,
      append,
    );
  }
  return result(true);
}

function formalExpectedPointCountV3(
  _partition: MainWireIntegratedModelResponsiveStarlingPartitionV3 | undefined,
): number {
  return MAIN_WIRE_INTEGRATED_MODEL_FORMAL_SETTLED_FAMILY_POINT_COUNT_V3;
}

/**
 * Establishes the analysis source before any slow state is frozen.
 *
 * Workbench may request an analysis soon after the first accepted frame. The
 * request clock is therefore provenance, not evidence that the Scenario is
 * already periodic. This isolated active-controller branch closes that gap;
 * the subsequent fixed-tone family always starts from its period-1 endpoint.
 */
function settleFormalPressureVolumeSourceV3(
  sourceSession: MainWireIntegratedModelSessionV3,
  sourceGlobalTbvMl: number,
):
  | Readonly<{
      status: "settled";
      branch: MainWireIntegratedModelSessionV3;
    }>
  | RejectedBranchV3 {
  let branch: MainWireIntegratedModelSessionV3;
  try {
    branch = sourceSession.forkAtFixedGlobalTotalBloodVolume(sourceGlobalTbvMl);
  } catch (error) {
    return rejectedV3(error);
  }
  const originTimeSec = branch.currentAcceptedState().acceptedTimeSec;
  const beats: MainWireIntegratedModelCompletedBeatMetricsV3[] = [];
  let lastCompletedBeatId: string | null =
    branch.observe().completedBeatMetrics?.endAtrialCaptureId ?? null;
  for (
    let ordinal = 1;
    ordinal <= MAXIMUM_FORMAL_PRESENTATION_ADVANCES_PER_POINT_V3;
    ordinal += 1
  ) {
    const acceptedTimeSec = branch.currentAcceptedState().acceptedTimeSec;
    if (acceptedTimeSec - originTimeSec >= MAXIMUM_MEASUREMENT_DURATION_SEC_V3)
      break;
    const advance = branch.advanceToPresentationTime(
      acceptedTimeSec + FORMAL_PROTOCOL_SAMPLE_DT_SEC_V3,
    );
    if (advance.status !== "advanced") {
      return rejectedV3(
        advance.status === "failed"
          ? advance.message
          : `unexpected formal source-settlement status ${advance.status}`,
      );
    }
    const acceptedTbvMl =
      advance.observation.acceptedState.coronary.fixedGlobalTotalBloodVolumeMl;
    if (
      Math.abs(acceptedTbvMl - sourceGlobalTbvMl) > FIXED_TBV_TOLERANCE_ML_V3
    ) {
      return rejectedV3(
        "global TBV changed during active-controller source settlement",
      );
    }
    const completed = advance.observation.completedBeatMetrics;
    if (
      completed === null ||
      completed.endAtrialCaptureId === lastCompletedBeatId
    ) {
      continue;
    }
    lastCompletedBeatId = completed.endAtrialCaptureId;
    beats.push(completed);
    if (
      beats.length >= MINIMUM_COMPLETE_BEAT_COUNT_V3 &&
      period1ConvergedV3(beats)
    ) {
      return Object.freeze({ status: "settled" as const, branch });
    }
    if (beats.length >= 5 && period2DetectedV3(beats)) {
      return rejectedV3("active-controller source reached a period-2 boundary");
    }
    if (beats.length >= FORMAL_SOURCE_MAXIMUM_COMPLETE_BEAT_COUNT_V3) break;
  }
  return rejectedV3(
    "active-controller source did not establish complete-beat period-1 closure",
  );
}

async function runFormalPressureVolumeChainV3(
  centerBranch: MainWireIntegratedModelSessionV3,
  sourceGlobalTbvMl: number,
  append: (pair: StarlingPairV3) => void,
): Promise<
  Readonly<{
    branch: MainWireIntegratedModelSessionV3;
    targetGlobalTbvMl: number;
  }>
> {
  let reliableBranch = centerBranch;
  let reliableTargetGlobalTbvMl = sourceGlobalTbvMl;
  let reliableScale = 1;
  let retainedPointCount = 1;
  let desiredScaleStep = FORMAL_PVA_INITIAL_SCALE_STEP_V3;
  while (
    reliableScale >
    MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3 + 1e-12
  ) {
    const remainingScale =
      reliableScale -
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3;
    const remainingRequiredPoints = Math.max(
      1,
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_POINT_COUNT_V3 -
        retainedPointCount,
    );
    // Begin almost as coarsely as the +8% high-volume arm, then reserve enough
    // low-volume range for the remaining required points at the minimum step.
    // A scale-dependent ceiling progressively densifies the difficult tail.
    const futureRequiredPointCount = Math.max(
      0,
      remainingRequiredPoints - 1,
    );
    const pointCountBoundedStep = Math.max(
      FORMAL_PVA_MINIMUM_SCALE_STEP_V3,
      remainingScale -
        futureRequiredPointCount * FORMAL_PVA_MINIMUM_SCALE_STEP_V3,
    );
    let attemptedScaleStep = Math.min(
      remainingScale,
      desiredScaleStep,
      pointCountBoundedStep,
      formalPvaScaleStepCeilingV3(reliableScale),
    );
    let accepted = false;
    let lastRejectedReason = "adaptive PVA load was not attempted";
    for (
      let attempt = 0;
      attempt < MAXIMUM_FORMAL_HOT_START_ATTEMPTS_PER_POINT_V3;
      attempt += 1
    ) {
      const targetScale = Math.max(
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3,
        reliableScale - attemptedScaleStep,
      );
      const targetGlobalTbvMl =
        mainWireIntegratedModelFormalPvaTargetGlobalTbvMlV3(
          sourceGlobalTbvMl,
          targetScale,
        );
      const measured = await measureFormalPressureVolumeBranchV3(
        reliableBranch,
        targetGlobalTbvMl,
        "continuation",
        formalPvaMinimumCompleteBeatCountV3(targetScale),
      );
      if (
        measured.status === "accepted" &&
        formalPairQualifiedV3(measured.pair)
      ) {
        append(measured.pair);
        reliableBranch = measured.branch;
        reliableTargetGlobalTbvMl = targetGlobalTbvMl;
        reliableScale = targetScale;
        retainedPointCount += 1;
        desiredScaleStep = adaptiveFormalPvaScaleStepV3(
          attemptedScaleStep,
          measured.pair,
        );
        accepted = true;
        break;
      }
      lastRejectedReason =
        measured.status === "rejected"
          ? measured.reason
          : "adaptive PVA load did not retain a settled fixed-tone pair";
      attemptedScaleStep *= 0.5;
      if (
        attemptedScaleStep < FORMAL_PVA_MINIMUM_SCALE_STEP_V3 ||
        sourceGlobalTbvMl * attemptedScaleStep <
          MINIMUM_FORMAL_TBV_BRACKET_ML_V3
      ) {
        break;
      }
    }
    if (!accepted) {
      throw new Error(
        `formal adaptive pressure-volume load below scale ${reliableScale} rejected: ${lastRejectedReason}`,
      );
    }
  }
  return Object.freeze({
    branch: reliableBranch,
    targetGlobalTbvMl: reliableTargetGlobalTbvMl,
  });
}

function formalPvaScaleStepCeilingV3(reliableScale: number): number {
  if (reliableScale >= 0.9) return 0.07;
  if (reliableScale >= 0.8) return 0.065;
  if (reliableScale >= 0.72) return 0.055;
  if (reliableScale >= 0.66) return 0.045;
  return 0.03;
}

function formalPvaMinimumCompleteBeatCountV3(targetScale: number): number {
  if (targetScale >= 0.82) return 3;
  if (targetScale >= 0.7) return 4;
  return 5;
}

function adaptiveFormalPvaScaleStepV3(
  acceptedScaleStep: number,
  pair: StarlingPairV3,
): number {
  const completedBeatCount = Math.max(
    pair.left.completedBeatCount,
    pair.right.completedBeatCount,
  );
  const closureScore = Math.max(
    pair.left.maximumNormalizedBeatDelta,
    pair.right.maximumNormalizedBeatDelta,
  );
  const multiplier =
    completedBeatCount <= 5 && closureScore <= 0.6
      ? 1.25
      : completedBeatCount >= 10 || closureScore > 0.9
        ? 0.7
        : 1;
  return Math.min(
    FORMAL_PVA_MAXIMUM_SCALE_STEP_V3,
    Math.max(FORMAL_PVA_MINIMUM_SCALE_STEP_V3, acceptedScaleStep * multiplier),
  );
}

async function runFormalHypervolemicStarlingChainV3(
  centerBranch: MainWireIntegratedModelSessionV3,
  centerPair: StarlingPairV3,
  sourceGlobalTbvMl: number,
  append: (pair: StarlingPairV3) => void,
): Promise<void> {
  let reliableBranch = centerBranch;
  let reliableTargetGlobalTbvMl = sourceGlobalTbvMl;
  const reliablePairs: StarlingPairV3[] = [centerPair];
  for (const scale of MAIN_WIRE_INTEGRATED_MODEL_FORMAL_STARLING_HYPERVOLEMIC_TBV_SCALES_V3) {
    const targetGlobalTbvMl = sourceGlobalTbvMl * scale;
    const measured = await measureFormalPressureVolumeTargetV3(
      reliableBranch,
      reliableTargetGlobalTbvMl,
      targetGlobalTbvMl,
    );
    if (
      measured.status === "rejected" ||
      !formalPairQualifiedV3(measured.pair)
    ) {
      break;
    }
    append(measured.pair);
    reliableBranch = measured.branch;
    reliableTargetGlobalTbvMl = targetGlobalTbvMl;
    reliablePairs.push(measured.pair);
    if (
      reliablePairs.length >= 4 &&
      mainWireIntegratedModelStarlingDescendingLimbV3(
        reliablePairs.map(({ right }) => right),
      ) !== null &&
      mainWireIntegratedModelStarlingDescendingLimbV3(
        reliablePairs.map(({ left }) => left),
      ) !== null
    ) {
      break;
    }
  }
}

async function runFormalLowStarlingExtensionV3(
  coreBoundaryBranch: MainWireIntegratedModelSessionV3,
  sourceGlobalTbvMl: number,
  coreBoundaryGlobalTbvMl: number,
  append: (pair: StarlingPairV3) => void,
): Promise<void> {
  let reliableBranch = coreBoundaryBranch;
  let reliableScale = coreBoundaryGlobalTbvMl / sourceGlobalTbvMl;
  for (const requestedScale of MAIN_WIRE_INTEGRATED_MODEL_FORMAL_STARLING_LOW_EXTENSION_TBV_SCALES_V3) {
    let targetScale: number = requestedScale;
    let reachedRequestedScale = false;
    for (
      let attempt = 0;
      attempt < MAXIMUM_LOW_TARGET_ATTEMPTS_PER_POINT_V3;
      attempt += 1
    ) {
      const measured = await measureFormalPressureVolumeBranchV3(
        reliableBranch,
        sourceGlobalTbvMl * targetScale,
        "continuation",
        5,
      );
      if (
        measured.status === "accepted" &&
        formalPairQualifiedV3(measured.pair)
      ) {
        append(measured.pair);
        reliableBranch = measured.branch;
        reliableScale = targetScale;
        if (starlingPairReachedLowFlowTargetV3(measured.pair)) return;
        if (Math.abs(targetScale - requestedScale) < 1e-12) {
          reachedRequestedScale = true;
          break;
        }
        targetScale = requestedScale;
        continue;
      }
      if (reliableScale - targetScale <= MINIMUM_LOW_SCALE_BRACKET_V3) break;
      targetScale = midpointV3(reliableScale, targetScale);
    }
    if (!reachedRequestedScale) break;
  }
}

/**
 * Keeps a requested high-volume display target exact while permitting internal
 * homotopy points when a direct load jump is numerically too large. Internal
 * points are settlement aids only: they are neither returned nor fitted.
 */
async function measureFormalPressureVolumeTargetV3(
  reliableBranch: MainWireIntegratedModelSessionV3,
  reliableTargetGlobalTbvMl: number,
  requestedTargetGlobalTbvMl: number,
): Promise<MeasuredBranchV3> {
  let sourceBranch = reliableBranch;
  let sourceTargetGlobalTbvMl = reliableTargetGlobalTbvMl;
  let trialTargetGlobalTbvMl = requestedTargetGlobalTbvMl;
  let lastRejected: RejectedBranchV3 = rejectedV3(
    "formal pressure-volume target was not attempted",
  );
  for (
    let attempt = 0;
    attempt < MAXIMUM_FORMAL_HOT_START_ATTEMPTS_PER_POINT_V3;
    attempt += 1
  ) {
    const measured = await measureFormalPressureVolumeBranchV3(
      sourceBranch,
      trialTargetGlobalTbvMl,
      "continuation",
    );
    if (measured.status === "accepted") {
      if (
        Math.abs(trialTargetGlobalTbvMl - requestedTargetGlobalTbvMl) <=
        FIXED_TBV_TOLERANCE_ML_V3
      ) {
        return measured;
      }
      sourceBranch = measured.branch;
      sourceTargetGlobalTbvMl = trialTargetGlobalTbvMl;
      trialTargetGlobalTbvMl = requestedTargetGlobalTbvMl;
      continue;
    }
    lastRejected = measured;
    if (
      Math.abs(sourceTargetGlobalTbvMl - trialTargetGlobalTbvMl) <=
      MINIMUM_FORMAL_TBV_BRACKET_ML_V3
    ) {
      return lastRejected;
    }
    trialTargetGlobalTbvMl =
      0.5 * (sourceTargetGlobalTbvMl + trialTargetGlobalTbvMl);
  }
  return lastRejected;
}

function formalPairQualifiedV3(pair: StarlingPairV3): boolean {
  return (
    pair.left.settled &&
    pair.right.settled &&
    pair.left.evidence === "fixed-tone-periodic" &&
    pair.right.evidence === "fixed-tone-periodic" &&
    pair.left.curveEligible &&
    pair.right.curveEligible
  );
}

function responsiveSettledAnchorPairV3(pair: StarlingPairV3): boolean {
  return [pair.left, pair.right].every(
    (point) =>
      point.role === "operating-anchor" &&
      point.quality === "locally-converged" &&
      point.curveEligible === true &&
      point.settled === true &&
      point.evidence === "responsive-settled-anchor" &&
      point.measurementWindowStatus === "responsive-period1-settled",
  );
}

function runHypovolemicChainV3(
  centerBranch: MainWireIntegratedModelSessionV3,
  sourceGlobalTbvMl: number,
  append: (pair: StarlingPairV3) => void,
): void {
  let reliableBranch = centerBranch;
  let reliableScale = 1;

  for (const requestedScale of MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_TBV_SCALES_V3) {
    let targetScale: number = requestedScale;
    let unsafeScale: number | null = null;
    let boundaryCandidate: StarlingPairV3 | null = null;
    let reachedRequestedScale = false;

    for (
      let attempt = 0;
      attempt < MAXIMUM_LOW_TARGET_ATTEMPTS_PER_POINT_V3;
      attempt += 1
    ) {
      const measured = measureBranchV3(
        reliableBranch,
        sourceGlobalTbvMl * targetScale,
        {
          role: "continuation",
          maximumBeatCount:
            targetScale <= 0.54
              ? DEEP_HYPOVOLEMIC_MAXIMUM_COMPLETE_BEAT_COUNT_V3
              : STANDARD_MAXIMUM_COMPLETE_BEAT_COUNT_V3,
          requireLocalConvergence: false,
        },
      );
      if (
        measured.status === "accepted" &&
        measured.pair.left.curveEligible &&
        measured.pair.right.curveEligible
      ) {
        append(measured.pair);
        reliableBranch = measured.branch;
        reliableScale = targetScale;
        if (starlingPairReachedLowFlowTargetV3(measured.pair)) return;
        if (Math.abs(targetScale - requestedScale) < 1e-12) {
          reachedRequestedScale = true;
          break;
        }

        // A midpoint made the original jump safe. Retry the original target
        // from this closer, fully advanced checkpoint before declaring a
        // numerical boundary.
        targetScale = requestedScale;
        continue;
      }

      unsafeScale = targetScale;
      if (measured.status === "accepted") boundaryCandidate = measured.pair;
      if (reliableScale - unsafeScale <= MINIMUM_LOW_SCALE_BRACKET_V3) break;
      targetScale = midpointV3(reliableScale, unsafeScale);
    }

    if (reachedRequestedScale) continue;
    if (boundaryCandidate !== null) append(boundaryCandidate);
    break;
  }
}

function starlingPairReachedLowFlowTargetV3(pair: StarlingPairV3): boolean {
  return (
    Math.max(pair.left.cardiacOutputLPerMin, pair.right.cardiacOutputLPerMin) <=
    MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_LOW_FLOW_TARGET_L_PER_MIN_V3
  );
}

function runHypervolemicChainV3(
  centerBranch: MainWireIntegratedModelSessionV3,
  centerPair: StarlingPairV3,
  sourceGlobalTbvMl: number,
  append: (pair: StarlingPairV3) => void,
): void {
  let reliableBranch = centerBranch;
  const reliablePairs: StarlingPairV3[] = [centerPair];
  for (const scale of MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_TBV_SCALES_V3) {
    const measured = measureBranchV3(
      reliableBranch,
      sourceGlobalTbvMl * scale,
      {
        role: "continuation",
        maximumBeatCount: STANDARD_MAXIMUM_COMPLETE_BEAT_COUNT_V3,
        requireLocalConvergence: false,
      },
    );
    if (measured.status === "rejected") break;
    append(measured.pair);
    if (
      !measured.pair.left.curveEligible ||
      !measured.pair.right.curveEligible
    ) {
      break;
    }
    reliableBranch = measured.branch;
    reliablePairs.push(measured.pair);
    if (
      reliablePairs.length >= 4 &&
      mainWireIntegratedModelStarlingDescendingLimbV3(
        reliablePairs.map(({ right }) => right),
      ) !== null &&
      mainWireIntegratedModelStarlingDescendingLimbV3(
        reliablePairs.map(({ left }) => left),
      ) !== null
    )
      break;
  }
}

export type MainWireIntegratedModelStarlingDescendingLimbV3 = Readonly<{
  peakPressureMmHg: number;
  firstDecliningPressureMmHg: number;
  confirmedDecliningPressureMmHg: number;
}>;

/**
 * A descending limb is present only after two consecutive post-plateau drops
 * and a clinically visible aggregate fall. This rejects one-point noise while
 * allowing the high-volume continuation to stop before extreme filling
 * pressures dominate a comparison plot.
 */
export function mainWireIntegratedModelStarlingDescendingLimbV3(
  points: readonly Pick<
    MainWireIntegratedModelStarlingPointV3,
    "cardiacOutputLPerMin" | "curveEligible" | "fillingPressureMmHg"
  >[],
): MainWireIntegratedModelStarlingDescendingLimbV3 | null {
  const ordered = points
    .filter(
      ({ cardiacOutputLPerMin, curveEligible, fillingPressureMmHg }) =>
        curveEligible &&
        Number.isFinite(cardiacOutputLPerMin) &&
        Number.isFinite(fillingPressureMmHg),
    )
    .sort(
      (left, right) => left.fillingPressureMmHg - right.fillingPressureMmHg,
    );
  if (ordered.length < 4) return null;
  const peakFlowLPerMin = Math.max(
    ...ordered.map(({ cardiacOutputLPerMin }) => cardiacOutputLPerMin),
  );
  const plateauToleranceLPerMin = Math.max(0.05, 0.01 * peakFlowLPerMin);
  let peakIndex = 0;
  ordered.forEach((point, index) => {
    if (point.cardiacOutputLPerMin >= peakFlowLPerMin - plateauToleranceLPerMin)
      peakIndex = index;
  });
  const requiredDropLPerMin = Math.max(
    DESCENDING_LIMB_ABSOLUTE_DROP_L_PER_MIN_V3,
    DESCENDING_LIMB_RELATIVE_DROP_V3 * peakFlowLPerMin,
  );
  for (let index = peakIndex + 2; index < ordered.length; index += 1) {
    const peak = ordered[peakIndex]!;
    const firstDeclining = ordered[index - 1]!;
    const confirmation = ordered[index]!;
    if (
      firstDeclining.cardiacOutputLPerMin >
        peak.cardiacOutputLPerMin -
          DESCENDING_LIMB_STEP_TOLERANCE_L_PER_MIN_V3 ||
      confirmation.cardiacOutputLPerMin >
        firstDeclining.cardiacOutputLPerMin -
          DESCENDING_LIMB_STEP_TOLERANCE_L_PER_MIN_V3 ||
      peakFlowLPerMin - confirmation.cardiacOutputLPerMin < requiredDropLPerMin
    )
      continue;
    return Object.freeze({
      peakPressureMmHg: peak.fillingPressureMmHg,
      firstDecliningPressureMmHg: firstDeclining.fillingPressureMmHg,
      confirmedDecliningPressureMmHg: confirmation.fillingPressureMmHg,
    });
  }
  return null;
}

async function measureFormalPressureVolumeBranchV3(
  sourceSession: MainWireIntegratedModelSessionV3,
  targetGlobalTbvMl: number,
  role: MainWireIntegratedModelStarlingPointV3["role"],
  minimumCompleteBeatCount: number = MINIMUM_COMPLETE_BEAT_COUNT_V3,
): Promise<MeasuredBranchV3> {
  let branch: MainWireIntegratedModelSessionV3;
  try {
    // A preload-reduction PVA family is a short mechanical perturbation, not a
    // sequence of 25-second coronary-controller re-equilibrations. Preserve
    // the source tone, reset its accepted averaging window beyond this bounded
    // branch, and hot-start the next load from the preceding settled endpoint.
    branch =
      sourceSession.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(
        targetGlobalTbvMl,
      );
    const originTimeSec = branch.currentAcceptedState().acceptedTimeSec;
    const beats: MainWireIntegratedModelCompletedBeatMetricsV3[] = [];
    const pressureVolumeBeats: CompletedPressureVolumeBeatPairV3[] = [];
    const pressureVolumeLoopCollector =
      new FormalFixedTbvPressureVolumeLoopCollectorV3();
    let lastCompletedBeatId: string | null =
      branch.observe().completedBeatMetrics?.endAtrialCaptureId ?? null;
    let locallyConverged = false;
    for (
      let ordinal = 1;
      ordinal <= MAXIMUM_FORMAL_PRESENTATION_ADVANCES_PER_POINT_V3;
      ordinal += 1
    ) {
      const acceptedTimeSec = branch.currentAcceptedState().acceptedTimeSec;
      if (
        acceptedTimeSec - originTimeSec >=
        MAXIMUM_MEASUREMENT_DURATION_SEC_V3
      )
        break;
      const advance = branch.advanceToPresentationTime(
        acceptedTimeSec + FORMAL_PROTOCOL_SAMPLE_DT_SEC_V3,
      );
      if (advance.status !== "advanced") {
        return rejectedV3(
          advance.status === "failed"
            ? advance.message
            : `unexpected formal measurement advance status ${advance.status}`,
        );
      }
      const acceptedTbvMl =
        advance.observation.acceptedState.coronary
          .fixedGlobalTotalBloodVolumeMl;
      if (
        Math.abs(acceptedTbvMl - targetGlobalTbvMl) > FIXED_TBV_TOLERANCE_ML_V3
      ) {
        return rejectedV3("fixed global TBV changed during PVA settlement");
      }
      const completedPressureVolumeLoop = pressureVolumeLoopCollector.accept(
        advance.observation,
      );
      if (completedPressureVolumeLoop !== null) {
        pressureVolumeBeats.push(completedPressureVolumeLoop);
      }
      const completed = advance.observation.completedBeatMetrics;
      if (
        completed === null ||
        completed.endAtrialCaptureId === lastCompletedBeatId
      ) {
        continue;
      }
      lastCompletedBeatId = completed.endAtrialCaptureId;
      beats.push(completed);
      if (beats.length >= minimumCompleteBeatCount) {
        if (period1ConvergedV3(beats)) {
          locallyConverged = true;
          break;
        }
        if (beats.length >= 5 && period2DetectedV3(beats)) {
          return rejectedV3(
            "fixed-tone PVA branch reached a period-2 boundary",
          );
        }
      }
      const maximumBeatCount =
        role === "operating-anchor"
          ? CENTER_MAXIMUM_COMPLETE_BEAT_COUNT_V3
          : DEEP_HYPOVOLEMIC_MAXIMUM_COMPLETE_BEAT_COUNT_V3;
      if (beats.length >= maximumBeatCount) break;
    }
    if (!locallyConverged) {
      return rejectedV3(
        "fixed-tone PVA branch did not establish complete-beat period-1 closure",
      );
    }
    const pressureVolumeBeat = pressureVolumeBeats.at(-1);
    if (pressureVolumeBeat === undefined) {
      return rejectedV3(
        "formal fixed-TBV branch did not retain a complete pressure-volume loop",
      );
    }

    // Report only the converged suffix; earlier beats belong to the hot-start
    // transient and must not bias the retained filling pressure or output.
    const averaged = averageBeatMetricsV3(beats.slice(-2));
    const selectedBeat = pressureVolumeBeat.completedBeatMetrics;
    const common = Object.freeze({
      totalBloodVolumeMl: targetGlobalTbvMl,
      role,
      quality: "locally-converged" as const,
      curveEligible: true as const,
      completedBeatCount: beats.length,
      maximumNormalizedBeatDelta: recentBeatClosureScoreV3(beats),
      settled: true as const,
      finiteAndFixedTbvPassed: true as const,
      evidence: "fixed-tone-periodic" as const,
      measurementWindowStatus: "fixed-tone-period1-settled" as const,
      acceptedMeasurementDurationSec:
        branch.currentAcceptedState().acceptedTimeSec - originTimeSec,
      acceptedBeatDurationSec: selectedBeat.durationSec,
    });
    return Object.freeze({
      status: "accepted" as const,
      branch,
      observation: branch.observe(),
      pair: Object.freeze({
        right: Object.freeze({
          ...common,
          fillingPressureMmHg: averaged.meanRightAtrialPressureMmHg,
          cardiacOutputLPerMin: averaged.nativeRightCardiacOutputLPerMin,
          acceptedTransmuralPathWorkMmHgMl:
            selectedBeat.rightVentricularTransmuralPressureVolumePathWorkMmHgMl,
          ventricularPressureVolumeLoop: pressureVolumeBeat.loops.right,
          ventricularPressureVolumeLandmarks:
            selectedBeat.rightVentricularPressureVolumeLandmarks,
        }),
        left: Object.freeze({
          ...common,
          fillingPressureMmHg: averaged.meanLeftAtrialPressureMmHg,
          cardiacOutputLPerMin: averaged.nativeLeftCardiacOutputLPerMin,
          acceptedTransmuralPathWorkMmHgMl:
            selectedBeat.leftVentricularTransmuralPressureVolumePathWorkMmHgMl,
          ventricularPressureVolumeLoop: pressureVolumeBeat.loops.left,
          ventricularPressureVolumeLandmarks:
            selectedBeat.leftVentricularPressureVolumeLandmarks,
        }),
      }),
    });
  } catch (error) {
    return rejectedV3(error);
  }
}

function measureBranchV3(
  sourceSession: MainWireIntegratedModelSessionV3,
  targetGlobalTbvMl: number,
  options: Readonly<{
    role: MainWireIntegratedModelStarlingPointV3["role"];
    maximumBeatCount: number;
    requireLocalConvergence: boolean;
  }>,
): MeasuredBranchV3 {
  let branch: MainWireIntegratedModelSessionV3;
  try {
    branch =
      sourceSession.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(
        targetGlobalTbvMl,
      );
  } catch (error) {
    return rejectedV3(error);
  }
  const originTimeSec = branch.currentAcceptedState().acceptedTimeSec;
  const beats: MainWireIntegratedModelCompletedBeatMetricsV3[] = [];
  const pressureVolumeLoops: PressureVolumeLoopPairV3[] = [];
  const pressureVolumeLoopCollector =
    new FixedTbvPressureVolumeLoopCollectorV3();
  let lastCompletedBeatId: string | null = null;
  let quality: MainWireIntegratedModelStarlingPointV3["quality"] =
    "convergence-cap";

  for (
    let ordinal = 1;
    ordinal <= MAXIMUM_RESPONSIVE_PRESENTATION_ADVANCES_PER_POINT_V3;
    ordinal += 1
  ) {
    const acceptedTimeSec = branch.currentAcceptedState().acceptedTimeSec;
    if (acceptedTimeSec - originTimeSec >= MAXIMUM_MEASUREMENT_DURATION_SEC_V3)
      break;
    const advance = branch.advanceToPresentationTime(
      acceptedTimeSec + RESPONSIVE_PROTOCOL_SAMPLE_DT_SEC_V3,
    );
    if (advance.status !== "advanced") {
      return rejectedV3(
        advance.status === "failed"
          ? advance.message
          : `unexpected advance status ${advance.status}`,
      );
    }
    const acceptedTbvMl =
      advance.observation.acceptedState.coronary.fixedGlobalTotalBloodVolumeMl;
    if (Math.abs(acceptedTbvMl - targetGlobalTbvMl) > FIXED_TBV_TOLERANCE_ML_V3)
      return rejectedV3("fixed global TBV changed during the branch");

    const completedPressureVolumeLoop = pressureVolumeLoopCollector.accept(
      advance.observation,
    );
    if (completedPressureVolumeLoop !== null) {
      pressureVolumeLoops.push(completedPressureVolumeLoop);
    }
    const completed = advance.observation.completedBeatMetrics;
    if (
      completed === null ||
      completed.endAtrialCaptureId === lastCompletedBeatId
    )
      continue;
    lastCompletedBeatId = completed.endAtrialCaptureId;
    beats.push(completed);

    if (
      beats.length >= MINIMUM_COMPLETE_BEAT_COUNT_V3 &&
      period1ConvergedV3(beats)
    ) {
      quality = "locally-converged";
      break;
    }
    if (beats.length >= 5 && period2DetectedV3(beats)) {
      quality = "period-2-boundary";
      break;
    }
    if (
      !options.requireLocalConvergence &&
      beats.length >= MINIMUM_COMPLETE_BEAT_COUNT_V3 &&
      recentBeatClosureScoreV3(beats) <= EARLY_PREVIEW_MAXIMUM_CLOSURE_SCORE_V3
    ) {
      quality = "adaptive-preview";
      break;
    }
    if (beats.length >= options.maximumBeatCount) break;
  }

  if (beats.length < MINIMUM_COMPLETE_BEAT_COUNT_V3) {
    return rejectedV3(
      `fewer than ${MINIMUM_COMPLETE_BEAT_COUNT_V3} complete beats were accepted`,
    );
  }
  if (quality === "convergence-cap" && period2DetectedV3(beats)) {
    quality = "period-2-boundary";
  } else if (
    quality === "convergence-cap" &&
    !options.requireLocalConvergence &&
    recentBeatClosureScoreV3(beats) <= FINAL_PREVIEW_MAXIMUM_CLOSURE_SCORE_V3
  ) {
    quality = "adaptive-preview";
  }
  const measurementBeats = beats.slice(-2);
  const pressureVolumeLoop = pressureVolumeLoops.at(-1);
  if (pressureVolumeLoop === undefined) {
    return rejectedV3(
      "fixed-TBV branch did not retain a complete pressure-volume loop",
    );
  }
  const averaged = averageBeatMetricsV3(measurementBeats);
  const lastBeatDelta = recentBeatClosureScoreV3(beats);
  const acceptedMeasurementDurationSec =
    branch.currentAcceptedState().acceptedTimeSec - originTimeSec;
  const curveEligible =
    quality === "locally-converged" || quality === "adaptive-preview";
  const responsiveSettledAnchor =
    options.role === "operating-anchor" && quality === "locally-converged";
  const common = Object.freeze({
    totalBloodVolumeMl: targetGlobalTbvMl,
    role: options.role,
    quality,
    curveEligible,
    completedBeatCount: beats.length,
    maximumNormalizedBeatDelta: lastBeatDelta,
    settled: responsiveSettledAnchor,
    finiteAndFixedTbvPassed: true as const,
    evidence: responsiveSettledAnchor
      ? ("responsive-settled-anchor" as const)
      : ("responsive-preview" as const),
    measurementWindowStatus: responsiveSettledAnchor
      ? ("responsive-period1-settled" as const)
      : quality === "locally-converged"
        ? ("complete-beat-converged" as const)
        : quality === "adaptive-preview"
          ? ("complete-beat-preview" as const)
          : quality === "period-2-boundary"
            ? ("period-2-detected" as const)
            : ("complete-beat-cap" as const),
    acceptedMeasurementDurationSec,
  });
  return Object.freeze({
    status: "accepted" as const,
    branch,
    observation: branch.observe(),
    pair: Object.freeze({
      right: Object.freeze({
        ...common,
        fillingPressureMmHg: averaged.meanRightAtrialPressureMmHg,
        cardiacOutputLPerMin: averaged.nativeRightCardiacOutputLPerMin,
        ventricularPressureVolumeLoop: pressureVolumeLoop.right,
        ventricularPressureVolumeLandmarks:
          averaged.rightVentricularPressureVolumeLandmarks,
      }),
      left: Object.freeze({
        ...common,
        fillingPressureMmHg: averaged.meanLeftAtrialPressureMmHg,
        cardiacOutputLPerMin: averaged.nativeLeftCardiacOutputLPerMin,
        ventricularPressureVolumeLoop: pressureVolumeLoop.left,
        ventricularPressureVolumeLandmarks:
          averaged.leftVentricularPressureVolumeLandmarks,
      }),
    }),
  });
}

function period1ConvergedV3(
  beats: readonly MainWireIntegratedModelCompletedBeatMetricsV3[],
): boolean {
  const consecutiveComparisonCount = 2;
  if (beats.length < consecutiveComparisonCount + 1) return false;
  const suffix = beats.slice(-(consecutiveComparisonCount + 1));
  return suffix
    .slice(1)
    .every((beat, index) => beatPairClosureScoreV3(suffix[index]!, beat) <= 1);
}

function recentBeatClosureScoreV3(
  beats: readonly MainWireIntegratedModelCompletedBeatMetricsV3[],
): number {
  if (beats.length < 2) return Number.POSITIVE_INFINITY;
  const adjacent = beatPairClosureScoreV3(beats.at(-2)!, beats.at(-1)!);
  return beats.length < 3
    ? adjacent
    : Math.max(beatPairClosureScoreV3(beats.at(-3)!, beats.at(-2)!), adjacent);
}

function period2DetectedV3(
  beats: readonly MainWireIntegratedModelCompletedBeatMetricsV3[],
): boolean {
  if (beats.length < 5) return false;
  const p2 =
    beatPairClosureScoreV3(beats.at(-5)!, beats.at(-3)!) <= 1 &&
    beatPairClosureScoreV3(beats.at(-4)!, beats.at(-2)!) <= 1 &&
    beatPairClosureScoreV3(beats.at(-3)!, beats.at(-1)!) <= 1;
  const adjacent = beatPairClosureScoreV3(beats.at(-2)!, beats.at(-1)!);
  return p2 && adjacent > 1;
}

function beatPairClosureScoreV3(
  left: MainWireIntegratedModelCompletedBeatMetricsV3,
  right: MainWireIntegratedModelCompletedBeatMetricsV3,
): number {
  const flowScore = (leftValue: number, rightValue: number) =>
    Math.abs(leftValue - rightValue) /
    Math.max(
      FLOW_ABSOLUTE_CLOSURE_L_PER_MIN_V3,
      FLOW_RELATIVE_CLOSURE_V3 *
        Math.max(Math.abs(leftValue), Math.abs(rightValue)),
    );
  return Math.max(
    flowScore(
      left.nativeLeftCardiacOutputLPerMin,
      right.nativeLeftCardiacOutputLPerMin,
    ),
    flowScore(
      left.nativeRightCardiacOutputLPerMin,
      right.nativeRightCardiacOutputLPerMin,
    ),
    Math.abs(
      left.meanLeftAtrialPressureMmHg - right.meanLeftAtrialPressureMmHg,
    ) / ATRIAL_PRESSURE_CLOSURE_MMHG_V3,
    Math.abs(
      left.meanRightAtrialPressureMmHg - right.meanRightAtrialPressureMmHg,
    ) / ATRIAL_PRESSURE_CLOSURE_MMHG_V3,
    Math.abs(left.meanAorticPressureMmHg - right.meanAorticPressureMmHg) /
      AORTIC_PRESSURE_CLOSURE_MMHG_V3,
    Math.abs(
      left.maximumLeftVentricularVolumeMl -
        right.maximumLeftVentricularVolumeMl,
    ) / VENTRICULAR_VOLUME_CLOSURE_ML_V3,
    Math.abs(
      left.minimumLeftVentricularVolumeMl -
        right.minimumLeftVentricularVolumeMl,
    ) / VENTRICULAR_VOLUME_CLOSURE_ML_V3,
  );
}

function averageBeatMetricsV3(
  beats: readonly MainWireIntegratedModelCompletedBeatMetricsV3[],
): Readonly<{
  meanLeftAtrialPressureMmHg: number;
  meanRightAtrialPressureMmHg: number;
  nativeLeftCardiacOutputLPerMin: number;
  nativeRightCardiacOutputLPerMin: number;
  leftVentricularPressureVolumeLandmarks: MainWireIntegratedModelVentricularPressureVolumeLandmarksV3;
  rightVentricularPressureVolumeLandmarks: MainWireIntegratedModelVentricularPressureVolumeLandmarksV3;
}> {
  if (beats.length === 0) throw new Error("Starling beat average is empty");
  const mean = (
    read: (beat: MainWireIntegratedModelCompletedBeatMetricsV3) => number,
  ) => beats.reduce((sum, beat) => sum + read(beat), 0) / beats.length;
  return Object.freeze({
    meanLeftAtrialPressureMmHg: mean((beat) => beat.meanLeftAtrialPressureMmHg),
    meanRightAtrialPressureMmHg: mean(
      (beat) => beat.meanRightAtrialPressureMmHg,
    ),
    nativeLeftCardiacOutputLPerMin: mean(
      (beat) => beat.nativeLeftCardiacOutputLPerMin,
    ),
    nativeRightCardiacOutputLPerMin: mean(
      (beat) => beat.nativeRightCardiacOutputLPerMin,
    ),
    leftVentricularPressureVolumeLandmarks: averagePressureVolumeLandmarksV3(
      beats.map((beat) => beat.leftVentricularPressureVolumeLandmarks),
    ),
    rightVentricularPressureVolumeLandmarks: averagePressureVolumeLandmarksV3(
      beats.map((beat) => beat.rightVentricularPressureVolumeLandmarks),
    ),
  });
}

function averagePressureVolumeLandmarksV3(
  landmarks: readonly MainWireIntegratedModelVentricularPressureVolumeLandmarksV3[],
): MainWireIntegratedModelVentricularPressureVolumeLandmarksV3 {
  if (landmarks.length === 0) {
    throw new Error("pressure-volume landmark average is empty");
  }
  const average = (
    selected: readonly MainWireIntegratedModelPressureVolumeLandmarkV3[],
    event: MainWireIntegratedModelPressureVolumeLandmarkV3["event"],
  ): MainWireIntegratedModelPressureVolumeLandmarkV3 =>
    Object.freeze({
      volumeMl:
        selected.reduce((sum, point) => sum + point.volumeMl, 0) /
        selected.length,
      pressureMmHg:
        selected.reduce((sum, point) => sum + point.pressureMmHg, 0) /
        selected.length,
      event,
    });
  const endSystolic = landmarks.map(({ endSystolic }) => endSystolic);
  return Object.freeze({
    pressureBasis: "transmural" as const,
    endDiastolic: average(
      landmarks.map(({ endDiastolic }) => endDiastolic),
      "maximum-volume",
    ) as MainWireIntegratedModelVentricularPressureVolumeLandmarksV3["endDiastolic"],
    endSystolic: average(
      endSystolic,
      endSystolic.every(({ event }) => event === "semilunar-valve-closure")
        ? "semilunar-valve-closure"
        : "minimum-volume-fallback",
    ) as MainWireIntegratedModelVentricularPressureVolumeLandmarksV3["endSystolic"],
  });
}

function responsiveLocusV3(
  points: readonly MainWireIntegratedModelStarlingPointV3[],
  protocolComplete: boolean,
): MainWireIntegratedModelStarlingLocusV3 {
  return Object.freeze({
    status: "responsive-fixed-tbv-preview" as const,
    points: Object.freeze(
      [...points].sort(
        (left, right) => left.fillingPressureMmHg - right.fillingPressureMmHg,
      ),
    ),
    protocolId: MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_PROTOCOL_V3_ID,
    warmupDurationSec: 0,
    measurementDurationSec: MAXIMUM_MEASUREMENT_DURATION_SEC_V3,
    minimumBeatCount: MINIMUM_COMPLETE_BEAT_COUNT_V3,
    maximumBeatCount: CENTER_MAXIMUM_COMPLETE_BEAT_COUNT_V3,
    slowControllerPolicy: "coronary-tone-frozen-at-branch-source" as const,
    completedPointCount: points.length,
    totalPointCount: protocolComplete
      ? points.length
      : Math.max(
          points.length,
          MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_TBV_SCALES_V3.length,
        ),
  });
}

function formalPressureVolumeLocusV3(
  points: readonly MainWireIntegratedModelStarlingPointV3[],
  protocolComplete: boolean,
  expectedPointCount: number,
): MainWireIntegratedModelStarlingLocusV3 {
  const settled = points.filter(
    (
      point,
    ): point is MainWireIntegratedModelStarlingPointV3 &
      Readonly<{
        quality: "locally-converged";
        curveEligible: true;
        settled: true;
        evidence: "fixed-tone-periodic";
        measurementWindowStatus: "fixed-tone-period1-settled";
      }> =>
      point.quality === "locally-converged" &&
      point.curveEligible === true &&
      point.settled === true &&
      point.evidence === "fixed-tone-periodic" &&
      point.measurementWindowStatus === "fixed-tone-period1-settled",
  );
  return Object.freeze({
    status: "measured-fixed-tbv-protocol" as const,
    protocolId:
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID,
    requirement: MAIN_WIRE_INTEGRATED_MODEL_STARLING_PROTOCOL_REQUIREMENT_V3,
    minimumBeatCount: MINIMUM_COMPLETE_BEAT_COUNT_V3,
    maximumBeatCount: CENTER_MAXIMUM_COMPLETE_BEAT_COUNT_V3,
    completedPointCount: settled.length,
    totalPointCount: protocolComplete
      ? settled.length
      : Math.max(settled.length, expectedPointCount),
    slowControllerPolicy:
      "active-source-period1-then-coronary-tone-frozen" as const,
    convergencePolicy: "complete-beat-output-period1-closure" as const,
    points: Object.freeze(
      [...settled].sort(
        (left, right) => left.fillingPressureMmHg - right.fillingPressureMmHg,
      ),
    ),
  });
}

function rejectedV3(error: unknown): RejectedBranchV3 {
  return Object.freeze({
    status: "rejected" as const,
    reason: error instanceof Error ? error.message : String(error),
  });
}

function midpointV3(left: number, right: number): number {
  return 0.5 * (left + right);
}

function requiredAnchorObservationV3(
  observation: MainWireIntegratedModelObservationV3 | null,
): MainWireIntegratedModelObservationV3 {
  if (observation === null) {
    throw new Error("responsive Starling anchor observation is unavailable");
  }
  return observation;
}
