import {
  applyMainWireBaselineCalibrationParametersV1,
  readMainWireBaselineCalibrationParameterV1,
  mainWireBaselineCalibrationParameterV1,
  type MainWireBaselineCalibrationCandidateInputsV1,
  type MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type {
  MainWireStandard70BaselineCalibrationEvaluationV1,
} from "./MainWireStandard70BaselineCalibrationEvaluatorV1";

/** A bounded construction search, not a parameter-identification claim. */
export const MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1 = Object.freeze({
  policyId: "main-wire-baseline-operating-point-design-v1",
  referenceId: "baseline",
  heartRateBpm: 60,
  coordinates: Object.freeze([
    { parameterId: "hemodynamics.total-blood-volume-ml", step: 100, radius: 300 },
    { parameterId: "myocardium.common-ventricular-active-tension-scale", step: 0.04, radius: 0.12 },
    { parameterId: "hemodynamics.systemic-resistance", step: 0.04, radius: 0.16 },
  ] satisfies readonly { parameterId: MainWireBaselineCalibrationParameterIdV1; step: number; radius: number }[]),
  maximumEvaluations: 49,
  nominalDtSec: 0.002,
  objective: "feasibility-then-worst-rest-corridor-margin-then-pressure-flow-margin",
  rationale: "One preload owner and one common ventricular amplitude; systemic resistance is a conditional design coordinate with matched pressure/flow observations and fixed arterial stiffness. No parameter uniqueness or practical-rank admission is inferred from this search.",
  locked: ["heart-rate", "venous-tone", "arterial-stiffness", "passive-stiffness", "calcium-source", "Land-kinetics", "valve-areas"],
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
  if (evaluation.constructionGateStatus !== "passed"
    || evaluation.objectiveGateStatus !== "passed"
    || evaluation.safetySentinelStatus !== "passed"
    || evaluation.failedConstructionCheckIds.length > 0
    || evaluation.failedObjectiveCheckIds.length > 0
    || evaluation.failedSafetySentinelCheckIds.length > 0
    || [...evaluation.objectiveChecks, ...evaluation.safetySentinelChecks]
      .some((check) => check.status !== "passed" || !Number.isFinite(check.actual)
        || check.actual < check.minimum || check.actual > check.maximum)) {
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
  return { feasible: true, minimumMargin,
    pressureFlowMargin: Math.min(...pressureFlow as number[]),
    activeConstraints: margins.filter((row) => row.margin <= minimumMargin + 0.01)
      .map((row) => row.id) };
}

export function mainWireBaselineDesignBetterV1(left: DesignScoreV1, right: DesignScoreV1): boolean {
  if (left.feasible !== right.feasible) return left.feasible;
  if (!left.feasible) return false;
  // Changes below 0.1% of a corridor are not a reason to chase a numerical edge.
  if (Math.abs(left.minimumMargin - right.minimumMargin) > 0.001) {
    return left.minimumMargin > right.minimumMargin;
  }
  return left.pressureFlowMargin > right.pressureFlowMargin + 0.001;
}

export function mainWireBaselineDesignNeighborsV1(
  anchor: MainWireBaselineCalibrationCandidateInputsV1,
  current: MainWireBaselineCalibrationCandidateInputsV1,
  stepScale: 1 | 0.5 | 0.25,
): readonly MainWireBaselineCalibrationCandidateInputsV1[] {
  const policy = MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1;
  if (anchor.hemodynamicResearchInputs.heartRateBpm !== policy.heartRateBpm
    || current.hemodynamicResearchInputs.heartRateBpm !== policy.heartRateBpm) {
    throw new Error("operating-point design is pinned to HR60");
  }
  const directions = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0],
    [0, 0, 1], [0, 0, -1], [1, 1, 1], [-1, -1, -1]];
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
