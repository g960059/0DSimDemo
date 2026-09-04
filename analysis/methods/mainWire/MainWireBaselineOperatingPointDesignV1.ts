import {
  applyMainWireBaselineCalibrationParametersV1,
  readMainWireBaselineCalibrationParameterV1,
  mainWireBaselineCalibrationParameterV1,
  mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1,
  MAIN_WIRE_BASELINE_CALIBRATION_PARAMETER_POLICY_V1_ID,
  MAIN_WIRE_BASELINE_CALIBRATION_PARAMETERS_V1,
  type MainWireBaselineCalibrationCandidateInputsV1,
  type MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type {
  MainWireStandard70BaselineCalibrationEvaluationV1,
} from "./MainWireStandard70BaselineCalibrationEvaluatorV1";
import { MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID } from "./MainWireStandard70BaselineCalibrationEvaluatorV1";
import { assertMainWireBaselineCheckCoverageV1, MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1,
  mainWireBaselineCheckBlocksV1, mainWireBaselineGateRoleV1 } from
  "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1 as reserveBase,
  type MainWireIntegratedModelFormalPreloadReserveMeasurementV1,
} from "./MainWirePressureVolumeProtocolsV3";
import {
  MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 as reserveFloors,
  mainWireStandard70PreloadReserveDirectionalResponsePassedV1,
} from "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import { buildNonCoronaryCirculationGraphV1 } from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { vascularPvLawFromNodeV1 } from "@/engine/core/circulationGraphKernelV1";

/** A bounded construction search, not a parameter-identification claim. */
export const MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1 = Object.freeze({
  policyId: "main-wire-baseline-operating-point-design-v5",
  parameterPolicyId: MAIN_WIRE_BASELINE_CALIBRATION_PARAMETER_POLICY_V1_ID,
  parameterDomains: MAIN_WIRE_BASELINE_CALIBRATION_PARAMETERS_V1.map(
    ({ parameterId, minimum, maximum, finiteDifferenceStep }) =>
      ({ parameterId, minimum, maximum, releaseStep: finiteDifferenceStep })),
  referenceId: "baseline",
  allowedHeartRatesBpm: [60, 70] as const,
  coordinates: Object.freeze([
    { parameterId: "hemodynamics.total-blood-volume-ml", step: 100, radius: 300 },
    { parameterId: "myocardium.common-ventricular-active-tension-scale", step: 0.04, radius: 0.12 },
    { parameterId: "hemodynamics.systemic-resistance", step: 0.04, radius: 0.16 },
    { parameterId: "hemodynamics.arterial-stiffness", step: 0.2, radius: 0.9 },
    { parameterId: "myocardium.common-ventricular-passive-stiffness-scale", step: 0.08, radius: 0.24 },
  ] satisfies readonly { parameterId: MainWireBaselineCalibrationParameterIdV1; step: number; radius: number }[]),
  maximumEvaluations: 49,
  nominalDtSec: 0.002,
  objective: "feasibility-then-pressure-flow-target-gap-then-worst-rest-and-reserve-margin",
  // An explicit design preference within the existing corridors, not a new
  // clinical gate: SBP 100..130 and CI 2.8..3.7 with the current reference.
  pressureFlowTargetMinimumCorridorMargin: 0.2,
  rationale: "One preload owner and common ventricular material scales. Pulsatile pressure/flow and settled, fixed-control multi-preload pressure-volume responses support conditional arterial/passive design coordinates. No parameter uniqueness or practical-rank admission is inferred. Rest scores are optimistic bounds used only to avoid reserve evaluations that cannot improve the incumbent.",
  locked: ["heart-rate", "venous-tone", "calcium-source", "Land-kinetics", "valve-areas"],
  finalQualificationRequired: ["cold", "refined-dt", "bidirectional-preload-reserve", "load-and-rate-envelope"],
  rateConditionInitialization: "same-clock-official-checkpoint-otherwise-cold",
  qualificationOrder: "refined-then-reserve-load-rate-then-selected-baseline-cold",
  earlyConditionScreen: "other-allowed-heart-rate-before-expensive-reserve",
  earlyRateInitialization: {
    seed: "same-clock-official-checkpoint-otherwise-cold",
    neighborhood: "fixed-incumbent-same-clock-counterpart-checkpoint-with-actual-source-inputs",
    sourceEligibility: "exact-accepted-and-numerical-event-safety-resolved",
    fallback: "same-clock-official-checkpoint-otherwise-cold",
  },
  additionalProposalDirections: "arterial-stiffness-with-pressure-preserving-storage-compensation",
  proposalVolumeReadback: "same-input-exact-checkpoint-arterial-volume-above-unstressed",
});

export type DesignScoreV1 = Readonly<{
  feasible: boolean;
  minimumMargin: number;
  pressureFlowMargin: number;
  pressureFlowTargetGap: number;
  activeConstraints: readonly string[];
}>;

const objectiveCheckIdsV1 = new Set<string>(MAIN_WIRE_BASELINE_OBJECTIVE_EVIDENCE_GROUPS_V1
  .flatMap(({ checkIds }) => checkIds));
const safetySentinelCheckIdsV1 = new Set<string>(MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_RIGHT_HEART_CHECK_IDS_V1);

export function scoreMainWireBaselineOperatingPointV1(
  evaluation: MainWireStandard70BaselineCalibrationEvaluationV1,
): DesignScoreV1 {
  const failed = { feasible: false, minimumMargin: -Infinity,
    pressureFlowMargin: -Infinity, pressureFlowTargetGap: Infinity, activeConstraints: [] } as const;
  if (evaluation.status !== "accepted") return failed;
  if (evaluation.evaluatorId !== MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID) return failed;
  // A partial or mispartitioned evaluation is unresolved, never a more feasible
  // candidate merely because its difficult observations disappeared.
  if (!Array.isArray(evaluation.objectiveChecks) || !Array.isArray(evaluation.safetySentinelChecks)) return failed;
  try {
    assertMainWireBaselineCheckCoverageV1([...evaluation.objectiveChecks, ...evaluation.safetySentinelChecks]);
  } catch {
    return failed;
  }
  if (evaluation.objectiveChecks.length !== objectiveCheckIdsV1.size
    || evaluation.safetySentinelChecks.length !== safetySentinelCheckIdsV1.size
    || evaluation.objectiveChecks.some(({ checkId }) => !objectiveCheckIdsV1.has(checkId))
    || evaluation.safetySentinelChecks.some(({ checkId }) => !safetySentinelCheckIdsV1.has(checkId))) return failed;
  if (evaluation.safetySentinelStatus !== "passed"
    || evaluation.failedSafetySentinelCheckIds.length > 0
    || [...evaluation.objectiveChecks, ...evaluation.safetySentinelChecks]
      .some((check) => !Number.isFinite(check.actual)
        || (check.minimum === check.maximum && check.status !== "passed"))) {
    return failed;
  }
  const margins = evaluation.objectiveChecks
    .filter((check) => check.maximum > check.minimum
      && mainWireBaselineGateRoleV1(check.checkId) !== "reference-warning")
    .map((check) => ({ id: check.checkId, margin: Math.min(
      check.actual - check.minimum, check.maximum - check.actual,
    ) / (check.maximum - check.minimum) }));
  const pressureFlow = ["aortic-pressure.maximum", "systemic-forward-flow.cardiac-index"]
    .map((id) => margins.find((row) => row.id === id)?.margin);
  if (!margins.length || pressureFlow.some((margin) => margin === undefined)) {
    throw new Error("operating-point design requires complete pressure/flow observations");
  }
  const minimumMargin = Math.min(...margins.map((row) => row.margin));
  const feasible = evaluation.constructionGateStatus === "passed"
    && evaluation.objectiveGateStatus === "passed"
    && evaluation.failedConstructionCheckIds.length === 0
    && evaluation.failedObjectiveCheckIds.length === 0
    && [...evaluation.objectiveChecks, ...evaluation.safetySentinelChecks]
      .every((check) => !mainWireBaselineCheckBlocksV1(check));
  return { feasible, minimumMargin,
    pressureFlowMargin: Math.min(...pressureFlow as number[]),
    pressureFlowTargetGap: Math.hypot(...(pressureFlow as number[]).map((margin) => Math.max(0,
      MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1.pressureFlowTargetMinimumCorridorMargin - margin))),
    activeConstraints: margins.filter((row) => row.margin <= minimumMargin + 0.01)
      .map((row) => row.id) };
}

export function mainWireBaselineDesignBetterV1(left: DesignScoreV1, right: DesignScoreV1): boolean {
  if (left.feasible !== right.feasible) return left.feasible;
  // A finite negative margin is a continuous construction violation, not a
  // solver failure. It can guide feasibility restoration, never final adoption.
  if (!Number.isFinite(left.minimumMargin)) return false;
  if (!Number.isFinite(right.minimumMargin)) return true;
  if (left.feasible && Math.abs(left.pressureFlowTargetGap - right.pressureFlowTargetGap) > 0.001) {
    return left.pressureFlowTargetGap < right.pressureFlowTargetGap;
  }
  // Changes below 0.1% of a corridor are not a reason to chase a numerical edge.
  if (Math.abs(left.minimumMargin - right.minimumMargin) > 0.001) {
    return left.minimumMargin > right.minimumMargin;
  }
  return left.pressureFlowMargin > right.pressureFlowMargin + 0.001;
}

/** Conditions are constraints; only the chosen baseline has the design target. */
export function combineMainWireBaselineConditionScoreV1(primary: DesignScoreV1, condition: DesignScoreV1): DesignScoreV1 {
  const minimumMargin = Math.min(primary.minimumMargin, condition.minimumMargin);
  return { ...primary, feasible: primary.feasible && condition.feasible, minimumMargin,
    activeConstraints: [
      ...(primary.minimumMargin <= minimumMargin + 0.01 ? primary.activeConstraints : []),
      ...(condition.minimumMargin <= minimumMargin + 0.01
        ? condition.activeConstraints.map((id) => `other-heart-rate.${id}`) : []),
    ] };
}

/** The same reserve gates used for minting, not a substitute fluid-response target. */
export function scoreMainWireBaselineReserveAwareV1(
  evaluation: MainWireStandard70BaselineCalibrationEvaluationV1,
  reserve: Pick<MainWireIntegratedModelFormalPreloadReserveMeasurementV1, "left" | "right"> | null,
): DesignScoreV1 {
  const rest = scoreMainWireBaselineOperatingPointV1(evaluation);
  const unresolved = { ...rest, feasible: false, minimumMargin: -Infinity,
    activeConstraints: ["preload-reserve.unresolved"] };
  if (!reserve || !Number.isFinite(rest.minimumMargin)) return unresolved;
  const margins = (["left", "right"] as const).flatMap((side) =>
    (["hypovolemic", "hypervolemic"] as const).flatMap((direction) => {
      const response = reserve[side][direction];
      const floors = {
        directionalFillingPressureChangeMmHg: reserveBase.minimumDirectionalFillingPressureChangeMmHg,
        directionalCardiacOutputChangeLPerMin: reserveBase.minimumDirectionalCardiacOutputChangeLPerMin,
        directionalCardiacOutputChangeFraction01: reserveFloors.minimumDirectionalCardiacOutputChangeFraction01,
        cardiacOutputSlopeLPerMinPerMmHg: reserveFloors.minimumCardiacOutputSlopeLPerMinPerMmHg,
        directionalEndDiastolicVolumeChangeMl: reserveBase.minimumDirectionalEndDiastolicVolumeChangeMl,
        directionalEndDiastolicVolumeChangeFraction01: reserveFloors.minimumDirectionalEndDiastolicVolumeChangeFraction01,
        directionalEndDiastolicTransmuralPressureChangeMmHg: reserveBase.minimumDirectionalEndDiastolicTransmuralPressureChangeMmHg,
      };
      return Object.entries(floors).map(([field, floor]) => ({
        id: `preload-reserve.${side}.${direction}.${field}`,
        // One-sided engineering floors: zero at the gate, +1 at twice the
        // floor. No population variance or upper clinical limit is invented.
        margin: (response[field as keyof typeof floors] - floor) / floor,
      }));
    }));
  const responses = [reserve.left.hypovolemic, reserve.left.hypervolemic,
    reserve.right.hypovolemic, reserve.right.hypervolemic];
  if (responses.some((response) => Object.values(response)
    .some((value) => typeof value === "number" && !Number.isFinite(value)))) return unresolved;
  const minimumMargin = Math.min(rest.minimumMargin, ...margins.map((row) => row.margin));
  return { ...rest, feasible: rest.feasible
    && responses.every(mainWireStandard70PreloadReserveDirectionalResponsePassedV1), minimumMargin,
    activeConstraints: [
      ...(rest.minimumMargin <= minimumMargin + 0.01 ? rest.activeConstraints : []),
      ...margins.filter((row) => row.margin <= minimumMargin + 0.01).map((row) => row.id),
    ] };
}

export function mainWireBaselineDesignQualificationPassedV1(
  evaluation: MainWireStandard70BaselineCalibrationEvaluationV1,
  reserveRequired: boolean,
  reserveStatus: "not-run" | "passed" | "failed",
): boolean {
  return scoreMainWireBaselineOperatingPointV1(evaluation).feasible
    && (!reserveRequired || reserveStatus === "passed");
}

export function mainWireBaselineDesignSeedV1(
  anchor: MainWireBaselineCalibrationCandidateInputsV1,
  requested: MainWireBaselineCalibrationCandidateInputsV1,
): MainWireBaselineCalibrationCandidateInputsV1 {
  return applyMainWireBaselineCalibrationParametersV1(anchor,
    MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1.coordinates.map((coordinate) => {
      const value = readMainWireBaselineCalibrationParameterV1(requested, coordinate.parameterId);
      if (!mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1(coordinate.parameterId, value)) {
        throw new Error("design seed is outside the release lattice or parameter domain");
      }
      if (Math.abs(value - readMainWireBaselineCalibrationParameterV1(anchor, coordinate.parameterId)) > coordinate.radius + 1e-8) {
        throw new Error("design seed exceeds the fixed design radius");
      }
      return { parameterId: coordinate.parameterId, value };
    }));
}

export function mainWireBaselineDesignNeighborsV1(
  anchor: MainWireBaselineCalibrationCandidateInputsV1,
  current: MainWireBaselineCalibrationCandidateInputsV1,
  stepScale: 1 | 0.5 | 0.25,
  arterialStorageMl?: number,
): readonly MainWireBaselineCalibrationCandidateInputsV1[] {
  const policy = MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1;
  if (!(policy.allowedHeartRatesBpm as readonly number[]).includes(anchor.hemodynamicResearchInputs.heartRateBpm)
    || current.hemodynamicResearchInputs.heartRateBpm !== anchor.hemodynamicResearchInputs.heartRateBpm) {
    throw new Error("operating-point design fixes one allowed HR per run");
  }
  const directions = policy.coordinates.flatMap((_, axis) => [1, -1].map((sign) =>
    policy.coordinates.map((__, i) => i === axis ? sign : 0)));
  const proposals = directions.map((direction) =>
    policy.coordinates.map((coordinate, i) => {
      const value = readMainWireBaselineCalibrationParameterV1(current, coordinate.parameterId)
        + direction[i]! * coordinate.step * stepScale;
      return { parameterId: coordinate.parameterId, value: Number(value.toFixed(8)) };
    }));
  if (arterialStorageMl !== undefined) {
    if (!(arterialStorageMl > 0) || !Number.isFinite(arterialStorageMl)) {
      throw new Error("arterial storage proposal requires a positive finite exact readback");
    }
    const stiffnessId = "hemodynamics.arterial-stiffness";
    const tbvId = "hemodynamics.total-blood-volume-ml";
    const stiffnessAxis = policy.coordinates.findIndex((axis) => axis.parameterId === stiffnessId);
    const oldStiffness = readMainWireBaselineCalibrationParameterV1(current, stiffnessId);
    const volumeDomain = mainWireBaselineCalibrationParameterV1(tbvId);
    for (const sign of [1, -1]) {
      const newStiffness = oldStiffness + sign * policy.coordinates[stiffnessAxis]!.step * stepScale;
      if (!(newStiffness > 0)) continue;
      // The admitted exponential law's Vs scales as 1/stiffness; Vu stays
      // fixed. Preserve instantaneous arterial pressures as a proposal only.
      // Actual closed-loop flow, pressures and reserve must all be remeasured.
      const proposedTbv = readMainWireBaselineCalibrationParameterV1(current, tbvId)
        + arterialStorageMl * (oldStiffness / newStiffness - 1);
      const tbv = volumeDomain.minimum + volumeDomain.finiteDifferenceStep
        * Math.round((proposedTbv - volumeDomain.minimum) / volumeDomain.finiteDifferenceStep);
      proposals.push(policy.coordinates.map(({ parameterId }) => ({ parameterId,
        value: Number((parameterId === stiffnessId ? newStiffness : parameterId === tbvId ? tbv
          : readMainWireBaselineCalibrationParameterV1(current, parameterId)).toFixed(8)),
      })));
    }
  }
  return proposals.flatMap((updates) => {
    if (updates.some((update, i) => {
      const domain = mainWireBaselineCalibrationParameterV1(update.parameterId);
      return update.value < domain.minimum || update.value > domain.maximum
        || Math.abs(update.value
          - readMainWireBaselineCalibrationParameterV1(anchor, update.parameterId))
            > policy.coordinates[i]!.radius + 1e-8;
    })) return [];
    // TBV's smallest accepted release step is 50 mL. Do not produce 25 mL presets.
    if (updates[0]!.value % 50 !== 0) return [];
    return [applyMainWireBaselineCalibrationParametersV1(current, updates)];
  });
}

/** All systemic AND pulmonary arterial stores affected by this scalar. */
export function mainWireBaselineArterialStorageMlV1(
  inputs: MainWireBaselineCalibrationCandidateInputsV1,
  nodeVolumesMl: Readonly<Record<string, number>>,
): number {
  return buildNonCoronaryCirculationGraphV1().nodes
    .filter((node) => node.kind === "arterial")
    .reduce((sum, node) => {
      const law = vascularPvLawFromNodeV1(node, inputs.hemodynamicResearchInputs);
      const storage = nodeVolumesMl[node.name]! - law.Vu;
      if (!(storage > 0) || !Number.isFinite(storage)) throw new Error("missing positive arterial store");
      return sum + storage;
    }, 0);
}
