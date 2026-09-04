import {
  applyMainWireBaselineCalibrationParametersV1,
  readMainWireBaselineCalibrationParameterV1,
  mainWireBaselineCalibrationParameterV1,
  mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1,
  type MainWireBaselineCalibrationCandidateInputsV1,
  type MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type {
  MainWireStandard70BaselineCalibrationEvaluationV1,
} from "./MainWireStandard70BaselineCalibrationEvaluatorV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1 as reserveBase,
  type MainWireIntegratedModelFormalPreloadReserveMeasurementV1,
} from "./MainWirePressureVolumeProtocolsV3";
import {
  MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 as reserveFloors,
  mainWireStandard70PreloadReserveDirectionalResponsePassedV1,
} from "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";

/** A bounded construction search, not a parameter-identification claim. */
export const MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1 = Object.freeze({
  policyId: "main-wire-baseline-operating-point-design-v1",
  referenceId: "baseline",
  allowedHeartRatesBpm: [60, 70] as const,
  coordinates: Object.freeze([
    { parameterId: "hemodynamics.total-blood-volume-ml", step: 100, radius: 300 },
    { parameterId: "myocardium.common-ventricular-active-tension-scale", step: 0.04, radius: 0.12 },
    { parameterId: "hemodynamics.systemic-resistance", step: 0.04, radius: 0.16 },
    { parameterId: "hemodynamics.arterial-stiffness", step: 0.08, radius: 0.32 },
    { parameterId: "myocardium.common-ventricular-passive-stiffness-scale", step: 0.08, radius: 0.24 },
  ] satisfies readonly { parameterId: MainWireBaselineCalibrationParameterIdV1; step: number; radius: number }[]),
  maximumEvaluations: 49,
  nominalDtSec: 0.002,
  objective: "feasibility-then-worst-rest-and-bidirectional-reserve-margin-then-pressure-flow-margin",
  rationale: "One preload owner and common ventricular material scales. Pulsatile pressure/flow and settled, fixed-control multi-preload pressure-volume responses support conditional arterial/passive design coordinates. No parameter uniqueness or practical-rank admission is inferred. Rest scores are optimistic bounds used only to avoid reserve evaluations that cannot improve the incumbent.",
  locked: ["heart-rate", "venous-tone", "calcium-source", "Land-kinetics", "valve-areas"],
  finalQualificationRequired: ["cold", "refined-dt", "bidirectional-preload-reserve", "load-and-rate-envelope"],
});

export type DesignScoreV1 = Readonly<{
  feasible: boolean;
  minimumMargin: number;
  pressureFlowMargin: number;
  activeConstraints: readonly string[];
}>;

export function scoreMainWireBaselineOperatingPointV1(
  evaluation: MainWireStandard70BaselineCalibrationEvaluationV1,
): DesignScoreV1 {
  const failed = { feasible: false, minimumMargin: -Infinity,
    pressureFlowMargin: -Infinity, activeConstraints: [] } as const;
  if (evaluation.status !== "accepted") return failed;
  if (evaluation.safetySentinelStatus !== "passed"
    || evaluation.failedSafetySentinelCheckIds.length > 0
    || [...evaluation.objectiveChecks, ...evaluation.safetySentinelChecks]
      .some((check) => !Number.isFinite(check.actual)
        || (check.minimum === check.maximum && check.status !== "passed"))) {
    return failed;
  }
  const margins = evaluation.objectiveChecks
    .filter((check) => check.maximum > check.minimum)
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
      .every((check) => check.status === "passed" && check.actual >= check.minimum && check.actual <= check.maximum);
  return { feasible, minimumMargin,
    pressureFlowMargin: Math.min(...pressureFlow as number[]),
    activeConstraints: margins.filter((row) => row.margin <= minimumMargin + 0.01)
      .map((row) => row.id) };
}

export function mainWireBaselineDesignBetterV1(left: DesignScoreV1, right: DesignScoreV1): boolean {
  if (left.feasible !== right.feasible) return left.feasible;
  // A finite negative margin is a continuous construction violation, not a
  // solver failure. It can guide feasibility restoration, never final adoption.
  if (!Number.isFinite(left.minimumMargin)) return false;
  if (!Number.isFinite(right.minimumMargin)) return true;
  // Changes below 0.1% of a corridor are not a reason to chase a numerical edge.
  if (Math.abs(left.minimumMargin - right.minimumMargin) > 0.001) {
    return left.minimumMargin > right.minimumMargin;
  }
  return left.pressureFlowMargin > right.pressureFlowMargin + 0.001;
}

/** The same reserve gates used for minting, not a substitute fluid-response target. */
export function scoreMainWireBaselineReserveAwareV1(
  evaluation: MainWireStandard70BaselineCalibrationEvaluationV1,
  reserve: MainWireIntegratedModelFormalPreloadReserveMeasurementV1 | null,
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
): readonly MainWireBaselineCalibrationCandidateInputsV1[] {
  const policy = MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1;
  if (!(policy.allowedHeartRatesBpm as readonly number[]).includes(anchor.hemodynamicResearchInputs.heartRateBpm)
    || current.hemodynamicResearchInputs.heartRateBpm !== anchor.hemodynamicResearchInputs.heartRateBpm) {
    throw new Error("operating-point design fixes one allowed HR per run");
  }
  const directions = policy.coordinates.flatMap((_, axis) => [1, -1].map((sign) =>
    policy.coordinates.map((__, i) => i === axis ? sign : 0)));
  return directions.flatMap((direction) => {
    const updates = policy.coordinates.map((coordinate, i) => {
      const value = readMainWireBaselineCalibrationParameterV1(current, coordinate.parameterId)
        + direction[i]! * coordinate.step * stepScale;
      return { parameterId: coordinate.parameterId, value: Number(value.toFixed(8)) };
    });
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
