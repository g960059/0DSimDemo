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
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { qualifyMainWireIntegratedModelSnapshotV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelSnapshotQualificationV3";
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
  "main-wire-integrated-model-formal-periodic-fixed-tbv-pv-family-v1" as const;

/**
 * The formal relation stays local enough to avoid extreme-volume model
 * regimes while providing four independent loads on either side of the
 * operating point. Each direction runs in its own persistent analysis Worker.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PV_HYPOVOLEMIC_TBV_SCALES_V3 =
  Object.freeze([0.96, 0.9, 0.82, 0.74] as const);
export const MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PV_HYPERVOLEMIC_TBV_SCALES_V3 =
  Object.freeze([1.06, 1.12, 1.18, 1.24] as const);

const MINIMUM_COMPLETE_BEAT_COUNT_V3 = 3;
const STANDARD_MAXIMUM_COMPLETE_BEAT_COUNT_V3 = 5;
const DEEP_HYPOVOLEMIC_MAXIMUM_COMPLETE_BEAT_COUNT_V3 = 12;
const CENTER_MAXIMUM_COMPLETE_BEAT_COUNT_V3 = 20;
const MAXIMUM_MEASUREMENT_DURATION_SEC_V3 = 36;
const FORMAL_POST_QUALIFICATION_COMPLETE_BEAT_COUNT_V3 = 3;
const PROTOCOL_SAMPLE_DT_SEC_V3 = 0.02;
const FIXED_TBV_TOLERANCE_ML_V3 = 1e-6;
const MAXIMUM_PRESENTATION_ADVANCES_PER_POINT_V3 = 1_000;
const MAXIMUM_LOW_TARGET_ATTEMPTS_PER_POINT_V3 = 8;
const MINIMUM_LOW_SCALE_BRACKET_V3 = 0.01;
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

type AcceptedBranchV3 = Readonly<{
  status: "accepted";
  branch: MainWireIntegratedModelSessionV3;
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
 * or modified. This is deliberately weaker and faster than formal canonical
 * full-state Snapshot qualification.
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
  anchorObservation = center.branch.observe();
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
 * Opt-in multi-load pressure-volume protocol.
 *
 * Unlike the responsive Starling preview, this path keeps the complete model
 * controllers active and admits a load only after the canonical full accepted
 * state P1 qualifier passes. The live Scenario is never advanced; both preload
 * directions warm-start from the qualified center and then from the preceding
 * qualified branch in their own analysis Workers.
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
  const paired: StarlingPairV3[] = [];
  let anchorObservation: MainWireIntegratedModelObservationV3 | null = null;
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
      ),
      left: formalPressureVolumeLocusV3(
        paired.map(({ left }) => left),
        protocolComplete,
      ),
    });
  const append = (pair: StarlingPairV3) => {
    paired.push(pair);
    onProgress?.(result());
  };
  const center = await measureFormalPressureVolumeBranchV3(
    sourceSession,
    sourceGlobalTbvMl,
    hemodynamicResearchInputs,
    "operating-anchor",
  );
  if (center.status === "rejected" || !formalPairQualifiedV3(center.pair)) {
    throw new Error(
      center.status === "rejected"
        ? `formal pressure-volume center rejected: ${center.reason}`
        : "formal pressure-volume center did not establish periodic closure",
    );
  }
  anchorObservation = center.branch.observe();
  append(center.pair);

  if (
    partition === undefined ||
    partition ===
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3
  ) {
    await runFormalPressureVolumeChainV3(
      center.branch,
      sourceGlobalTbvMl,
      hemodynamicResearchInputs,
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PV_HYPOVOLEMIC_TBV_SCALES_V3,
      append,
    );
  }
  if (
    partition === undefined ||
    partition ===
      MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3
  ) {
    await runFormalPressureVolumeChainV3(
      center.branch,
      sourceGlobalTbvMl,
      hemodynamicResearchInputs,
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PV_HYPERVOLEMIC_TBV_SCALES_V3,
      append,
    );
  }
  return result(true);
}

async function runFormalPressureVolumeChainV3(
  centerBranch: MainWireIntegratedModelSessionV3,
  sourceGlobalTbvMl: number,
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
  scales: readonly number[],
  append: (pair: StarlingPairV3) => void,
): Promise<void> {
  let reliableBranch = centerBranch;
  for (const scale of scales) {
    const measured = await measureFormalPressureVolumeBranchV3(
      reliableBranch,
      sourceGlobalTbvMl * scale,
      hemodynamicResearchInputs,
      "continuation",
    );
    if (measured.status === "rejected" || !formalPairQualifiedV3(measured.pair))
      break;
    append(measured.pair);
    reliableBranch = measured.branch;
  }
}

function formalPairQualifiedV3(pair: StarlingPairV3): boolean {
  return (
    pair.left.settled &&
    pair.right.settled &&
    pair.left.evidence === "qualified-periodic" &&
    pair.right.evidence === "qualified-periodic" &&
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
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3,
  role: MainWireIntegratedModelStarlingPointV3["role"],
): Promise<MeasuredBranchV3> {
  try {
    const targetInputs = Object.freeze({
      ...hemodynamicResearchInputs,
      totalBloodVolumeMl: targetGlobalTbvMl,
    });
    const candidate =
      await sourceSession.warmStartWithHemodynamicResearchInputs(
        targetInputs,
        1,
        sourceSession.observe().mechanismResearchInputs,
      );
    const originTimeSec = candidate.currentAcceptedState().acceptedTimeSec;
    if (
      Math.abs(
        candidate.currentAcceptedState().coronary
          .fixedGlobalTotalBloodVolumeMl - targetGlobalTbvMl,
      ) > FIXED_TBV_TOLERANCE_ML_V3
    ) {
      return rejectedV3("formal warm start missed its fixed global TBV target");
    }
    const qualification = await qualifyMainWireIntegratedModelSnapshotV3({
      candidateCheckpoint: await candidate.checkpointOperational(),
      hemodynamicResearchInputs: targetInputs,
      mechanismResearchInputs: sourceSession.observe().mechanismResearchInputs,
    });
    if (
      !qualification.accepted ||
      qualification.terminalCheckpoint === null ||
      qualification.classification?.status !== "period1-converged" ||
      qualification.classification.latestPeriod1MaximumNormalizedDelta === null
    ) {
      return rejectedV3(
        qualification.message ??
          `formal fixed-TBV branch was not qualified: ${qualification.reason}`,
      );
    }

    let branch =
      await MainWireIntegratedModelSessionV3.restoreOperationalCheckpoint(
        qualification.terminalCheckpoint,
        targetInputs,
        1,
        sourceSession.observe().mechanismResearchInputs,
      );
    const beats: MainWireIntegratedModelCompletedBeatMetricsV3[] = [];
    const pressureVolumeLoops: PressureVolumeLoopPairV3[] = [];
    const pressureVolumeLoopCollector =
      new FixedTbvPressureVolumeLoopCollectorV3();
    let lastCompletedBeatId: string | null = null;
    for (
      let ordinal = 1;
      ordinal <= MAXIMUM_PRESENTATION_ADVANCES_PER_POINT_V3 &&
      beats.length < FORMAL_POST_QUALIFICATION_COMPLETE_BEAT_COUNT_V3;
      ordinal += 1
    ) {
      const acceptedTimeSec = branch.currentAcceptedState().acceptedTimeSec;
      const advance = branch.advanceToPresentationTime(
        acceptedTimeSec + PROTOCOL_SAMPLE_DT_SEC_V3,
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
        return rejectedV3(
          "fixed global TBV changed after formal periodic qualification",
        );
      }
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
      ) {
        continue;
      }
      lastCompletedBeatId = completed.endAtrialCaptureId;
      beats.push(completed);
    }
    if (beats.length < FORMAL_POST_QUALIFICATION_COMPLETE_BEAT_COUNT_V3) {
      return rejectedV3(
        "formal fixed-TBV branch could not collect its post-qualification beats",
      );
    }
    const pressureVolumeLoop = pressureVolumeLoops.at(-1);
    if (pressureVolumeLoop === undefined) {
      return rejectedV3(
        "formal fixed-TBV branch did not retain a complete pressure-volume loop",
      );
    }

    const averaged = averageBeatMetricsV3(beats);
    const common = Object.freeze({
      totalBloodVolumeMl: targetGlobalTbvMl,
      role,
      quality: "locally-converged" as const,
      curveEligible: true as const,
      completedBeatCount: qualification.completedCycleCount + beats.length,
      maximumNormalizedBeatDelta:
        qualification.classification.latestPeriod1MaximumNormalizedDelta,
      settled: true as const,
      finiteAndFixedTbvPassed: true as const,
      evidence: "qualified-periodic" as const,
      measurementWindowStatus: "canonical-period1-qualified" as const,
      acceptedMeasurementDurationSec:
        branch.currentAcceptedState().acceptedTimeSec - originTimeSec,
    });
    return Object.freeze({
      status: "accepted" as const,
      branch,
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
    ordinal <= MAXIMUM_PRESENTATION_ADVANCES_PER_POINT_V3;
    ordinal += 1
  ) {
    const acceptedTimeSec = branch.currentAcceptedState().acceptedTimeSec;
    if (acceptedTimeSec - originTimeSec >= MAXIMUM_MEASUREMENT_DURATION_SEC_V3)
      break;
    const advance = branch.advanceToPresentationTime(
      acceptedTimeSec + PROTOCOL_SAMPLE_DT_SEC_V3,
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
): MainWireIntegratedModelStarlingLocusV3 {
  const qualified = points.filter(
    (
      point,
    ): point is MainWireIntegratedModelStarlingPointV3 &
      Readonly<{
        quality: "locally-converged";
        curveEligible: true;
        settled: true;
        evidence: "qualified-periodic";
        measurementWindowStatus: "canonical-period1-qualified";
      }> =>
      point.quality === "locally-converged" &&
      point.curveEligible === true &&
      point.settled === true &&
      point.evidence === "qualified-periodic" &&
      point.measurementWindowStatus === "canonical-period1-qualified",
  );
  return Object.freeze({
    status: "measured-fixed-tbv-protocol" as const,
    protocolId:
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID,
    requirement: MAIN_WIRE_INTEGRATED_MODEL_STARLING_PROTOCOL_REQUIREMENT_V3,
    minimumBeatCount:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles,
    maximumBeatCount:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.maximumCycleCount,
    completedPointCount: qualified.length,
    totalPointCount: protocolComplete
      ? qualified.length
      : Math.max(
          qualified.length,
          1 +
            MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PV_HYPOVOLEMIC_TBV_SCALES_V3.length +
            MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PV_HYPERVOLEMIC_TBV_SCALES_V3.length,
        ),
    slowControllerPolicy: "fully-active" as const,
    convergencePolicy: "canonical-full-accepted-state-period1-closure" as const,
    points: Object.freeze(
      [...qualified].sort(
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
