import {
  solveScaledDensePartialPivotLuV1,
  type ScaledDenseLuDiagnosticsV1,
  type ScaledDenseLuFailureReasonV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID,
  evaluatePhaseB0AlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/verifiedAlgorithmicJacobianV1";
import {
  evaluatePhaseB0PublishedTriSegResidualV1,
  solvePhaseB0PublishedTriSegRootV1,
  type PhaseB0PublishedTriSegRootInputV1,
  type PhaseB0PublishedTriSegRootResultV1,
  type PhaseB0PublishedTriSegRootSuccessV1,
  type PhaseB0TriSegContinuationPointV1,
  type PhaseB0TriSegCoordinatesV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/publishedTriSegRootV1";

export const PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID =
  "phase-b0-triseg-natural-parameter-tangent-predictor-corrector-v1" as const;

export type PhaseB0TriSegNaturalParameterContinuationPolicyV1 = Readonly<{
  parameterDerivativeScaledStep: number;
  minimumScaledLoadArclength: number;
  maximumTangentPredictionHalvingDifferenceScaledInfinityNorm: number;
  maximumAnchorCorrectionScaledInfinityNorm: number;
  maximumPredictorCorrectionScaledInfinityNorm: number;
  maximumPredictorCorrectionToAcceptedCoordinateStepRatio: number;
  maximumAcceptedScaledCoordinateStep: number;
  minimumTangentDot: number;
  relativePivotTolerance: number;
}>;

export type PhaseB0TriSegNaturalParameterSegmentV1 = Readonly<{
  segmentIndex: number;
  tangentAlgorithmicJacobianId:
    typeof PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID;
  from: PhaseB0TriSegContinuationPointV1;
  to: PhaseB0TriSegContinuationPointV1;
  scaledLoadArclength: number;
  scaledLoadUnitDirection: readonly [number, number];
  parameterDerivativeActualScaledLoadStep: number;
  scaledCoordinateTangentPerUnitLoadArclength: readonly [number, number];
  tangentPredictionHalvingDifferenceScaledInfinityNorm: number;
  normalizedAugmentedTangent: readonly [number, number, number, number];
  tangentDotWithPrevious: number | null;
  predictedCoordinates: PhaseB0TriSegCoordinatesV1;
  correctedRoot: PhaseB0PublishedTriSegRootResultV1;
  predictorCorrectionScaledInfinityNorm: number | null;
  predictorCorrectionToAcceptedCoordinateStepRatio: number | null;
  acceptedCoordinateStepScaledInfinityNorm: number | null;
  coarseTangentLinearSolve: ScaledDenseLuDiagnosticsV1;
  fineTangentLinearSolve: ScaledDenseLuDiagnosticsV1;
}>;

export type PhaseB0TriSegNaturalParameterContinuationFailureV1 = Readonly<{
  phase:
    | "anchor-corrector"
    | "tangent-evaluation"
    | "predictor-domain"
    | "node-corrector";
  segmentIndex: number | null;
  reason: string;
  message: string;
  lastAcceptedCoordinates: PhaseB0TriSegCoordinatesV1;
  predictedCoordinates: PhaseB0TriSegCoordinatesV1 | null;
  tangentLinearSolveFailure: Readonly<{
    derivativeLevel: "coarse" | "fine";
    reason: ScaledDenseLuFailureReasonV1;
    diagnostics: ScaledDenseLuDiagnosticsV1 | null;
  }> | null;
}>;

export type PhaseB0TriSegNaturalParameterContinuationAuditV1 = Readonly<{
  auditId: typeof PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID;
  pathParameterization:
    "cumulative-scaled-load-arclength-using-declared-fixed-load-scales";
  parameterDerivativeStencil:
    "in-segment-forward-five-point-with-step-halving-audit";
  tangentAlgorithmicJacobianId:
    typeof PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID | null;
  scaledCoordinateDistanceNorm: "scaled-infinity-norm";
  path: readonly PhaseB0TriSegContinuationPointV1[];
  loadScales: PhaseB0TriSegContinuationPointV1;
  anchorCoordinates: PhaseB0TriSegCoordinatesV1;
  anchorRoot: PhaseB0PublishedTriSegRootResultV1;
  anchorCorrectionScaledInfinityNorm: number | null;
  segments: readonly PhaseB0TriSegNaturalParameterSegmentV1[];
  roots: readonly PhaseB0PublishedTriSegRootResultV1[];
  allConverged: boolean;
  maximumTangentPredictionHalvingDifferenceScaledInfinityNorm: number | null;
  maximumPredictorCorrectionScaledInfinityNorm: number | null;
  maximumPredictorCorrectionToAcceptedCoordinateStepRatio: number | null;
  maximumAcceptedScaledCoordinateStep: number | null;
  minimumTangentDot: number | null;
  policy: PhaseB0TriSegNaturalParameterContinuationPolicyV1;
  thresholdViolations: readonly string[];
  failure: PhaseB0TriSegNaturalParameterContinuationFailureV1 | null;
  numericalPathAccepted: boolean;
  accepted: boolean;
  branchIdentityEstablished: boolean;
  branchIdentity:
    | "numerically-tracked-from-declared-anchor-by-corrected-path"
    | "not-established";
  previousRootUse: "tangent-predictor-only";
  nearestRootSelectionApplied: false;
  minimumResidualSelectionApplied: false;
  maximumJunctionRadiusSelectionApplied: false;
  forcedPreviousSeptumApplied: false;
  pseudoArclengthApplied: false;
  supportedEnvelopeClaimed: false;
}>;

export type PhaseB0TriSegNaturalParameterPathRootInputV1 = Omit<
  PhaseB0PublishedTriSegRootInputV1,
  "leftVentricularCavityVolumeM3"
  | "rightVentricularCavityVolumeM3"
  | "initialCoordinates"
>;

type SegmentTangentSuccess = Readonly<{
  success: true;
  tangentAlgorithmicJacobianId:
    typeof PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID;
  scaledLoadArclength: number;
  scaledLoadUnitDirection: readonly [number, number];
  parameterDerivativeActualScaledLoadStep: number;
  scaledCoordinateTangentPerUnitLoadArclength: readonly [number, number];
  tangentPredictionHalvingDifferenceScaledInfinityNorm: number;
  normalizedAugmentedTangent: readonly [number, number, number, number];
  coarseTangentLinearSolve: ScaledDenseLuDiagnosticsV1;
  fineTangentLinearSolve: ScaledDenseLuDiagnosticsV1;
}>;

type SegmentTangentFailure = Readonly<{
  success: false;
  reason: string;
  message: string;
  tangentLinearSolveFailure: PhaseB0TriSegNaturalParameterContinuationFailureV1[
    "tangentLinearSolveFailure"
  ];
}>;

type SegmentTangentResult = SegmentTangentSuccess | SegmentTangentFailure;

export function auditPhaseB0TriSegNaturalParameterContinuationV1(input: Readonly<{
  rootInput: PhaseB0TriSegNaturalParameterPathRootInputV1;
  path: readonly PhaseB0TriSegContinuationPointV1[];
  loadScales?: PhaseB0TriSegContinuationPointV1;
  anchorCoordinates: PhaseB0TriSegCoordinatesV1;
  policy: PhaseB0TriSegNaturalParameterContinuationPolicyV1;
}>): PhaseB0TriSegNaturalParameterContinuationAuditV1 {
  validateInput(input);
  const path = Object.freeze(input.path.map((point) => Object.freeze({ ...point })));
  const loadScales = Object.freeze({ ...(input.loadScales ?? path[0]) });
  const anchorCoordinates = Object.freeze({ ...input.anchorCoordinates });
  const policy = Object.freeze({ ...input.policy });
  const roots: PhaseB0PublishedTriSegRootResultV1[] = [];
  const segments: PhaseB0TriSegNaturalParameterSegmentV1[] = [];
  let failure: PhaseB0TriSegNaturalParameterContinuationFailureV1 | null = null;
  const anchorRoot = solveAt(path[0], anchorCoordinates, input.rootInput);
  roots.push(anchorRoot);
  const anchorCorrectionScaledInfinityNorm = anchorRoot.converged
    ? scaledPhaseB0TriSegCoordinateDistanceV1(
      anchorCoordinates,
      anchorRoot.coordinates,
      input.rootInput.unknownScales,
    )
    : null;
  if (anchorRoot.converged === false) {
    failure = freezeFailure({
      phase: "anchor-corrector",
      segmentIndex: null,
      reason: anchorRoot.reason,
      message: anchorRoot.message,
      lastAcceptedCoordinates: anchorRoot.lastAcceptedCoordinates,
      predictedCoordinates: null,
      tangentLinearSolveFailure: null,
    });
    return finalizeAudit({
      path,
      loadScales,
      anchorCoordinates,
      anchorRoot,
      roots,
      segments,
      anchorCorrectionScaledInfinityNorm,
      policy,
      failure,
    });
  }

  let currentRoot: PhaseB0PublishedTriSegRootSuccessV1 = anchorRoot;
  let previousAugmentedTangent: readonly [number, number, number, number] | null = null;
  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    const tangent = evaluateSegmentTangent({
      rootInput: input.rootInput,
      coordinates: currentRoot.coordinates,
      from,
      to,
      loadScales,
      parameterDerivativeScaledStep: policy.parameterDerivativeScaledStep,
      relativePivotTolerance: policy.relativePivotTolerance,
    });
    if (tangent.success === false) {
      failure = freezeFailure({
        phase: "tangent-evaluation",
        segmentIndex: index,
        reason: tangent.reason,
        message: tangent.message,
        lastAcceptedCoordinates: currentRoot.coordinates,
        predictedCoordinates: null,
        tangentLinearSolveFailure: tangent.tangentLinearSolveFailure,
      });
      break;
    }
    const predictedCoordinates = Object.freeze({
      septalMidwallCapVolumeM3:
        currentRoot.coordinates.septalMidwallCapVolumeM3
        + tangent.scaledCoordinateTangentPerUnitLoadArclength[0]
          * tangent.scaledLoadArclength
          * input.rootInput.unknownScales.septalMidwallCapVolumeM3,
      junctionRadiusM:
        currentRoot.coordinates.junctionRadiusM
        + tangent.scaledCoordinateTangentPerUnitLoadArclength[1]
          * tangent.scaledLoadArclength
          * input.rootInput.unknownScales.junctionRadiusM,
    });
    const tangentDotWithPrevious = previousAugmentedTangent === null
      ? null
      : dot4(previousAugmentedTangent, tangent.normalizedAugmentedTangent);
    if (
      !Number.isFinite(predictedCoordinates.septalMidwallCapVolumeM3)
      || !Number.isFinite(predictedCoordinates.junctionRadiusM)
    ) {
      failure = freezeFailure({
        phase: "predictor-domain",
        segmentIndex: index,
        reason: "predicted-coordinates-non-finite",
        message: "natural-parameter tangent predictor produced non-finite coordinates",
        lastAcceptedCoordinates: currentRoot.coordinates,
        predictedCoordinates,
        tangentLinearSolveFailure: null,
      });
      break;
    }
    if (!(predictedCoordinates.junctionRadiusM > input.rootInput.junctionRadiusLowerBoundM)) {
      failure = freezeFailure({
        phase: "predictor-domain",
        segmentIndex: index,
        reason: "predicted-junction-radius-outside-strict-domain",
        message: "natural-parameter tangent predictor left the strict junction-radius domain",
        lastAcceptedCoordinates: currentRoot.coordinates,
        predictedCoordinates,
        tangentLinearSolveFailure: null,
      });
      break;
    }
    let correctedRoot: PhaseB0PublishedTriSegRootResultV1;
    try {
      correctedRoot = solveAt(to, predictedCoordinates, input.rootInput);
    } catch (error) {
      failure = freezeFailure({
        phase: "node-corrector",
        segmentIndex: index,
        reason: "node-corrector-threw",
        message: error instanceof Error && error.message.length > 0
          ? error.message
          : "node corrector threw without an Error message",
        lastAcceptedCoordinates: currentRoot.coordinates,
        predictedCoordinates,
        tangentLinearSolveFailure: null,
      });
      break;
    }
    roots.push(correctedRoot);
    const predictorCorrectionScaledInfinityNorm = correctedRoot.converged
      ? scaledPhaseB0TriSegCoordinateDistanceV1(
        predictedCoordinates,
        correctedRoot.coordinates,
        input.rootInput.unknownScales,
      )
      : null;
    const acceptedCoordinateStepScaledInfinityNorm = correctedRoot.converged
      ? scaledPhaseB0TriSegCoordinateDistanceV1(
        currentRoot.coordinates,
        correctedRoot.coordinates,
        input.rootInput.unknownScales,
      )
      : null;
    const predictorCorrectionToAcceptedCoordinateStepRatio =
      predictorCorrectionScaledInfinityNorm !== null
      && acceptedCoordinateStepScaledInfinityNorm !== null
        ? safeRatio(
          predictorCorrectionScaledInfinityNorm,
          acceptedCoordinateStepScaledInfinityNorm,
        )
        : null;
    segments.push(Object.freeze({
      segmentIndex: index,
      tangentAlgorithmicJacobianId: tangent.tangentAlgorithmicJacobianId,
      from,
      to,
      scaledLoadArclength: tangent.scaledLoadArclength,
      scaledLoadUnitDirection: tangent.scaledLoadUnitDirection,
      parameterDerivativeActualScaledLoadStep:
        tangent.parameterDerivativeActualScaledLoadStep,
      scaledCoordinateTangentPerUnitLoadArclength:
        tangent.scaledCoordinateTangentPerUnitLoadArclength,
      tangentPredictionHalvingDifferenceScaledInfinityNorm:
        tangent.tangentPredictionHalvingDifferenceScaledInfinityNorm,
      normalizedAugmentedTangent: tangent.normalizedAugmentedTangent,
      tangentDotWithPrevious,
      predictedCoordinates,
      correctedRoot,
      predictorCorrectionScaledInfinityNorm,
      predictorCorrectionToAcceptedCoordinateStepRatio,
      acceptedCoordinateStepScaledInfinityNorm,
      coarseTangentLinearSolve: tangent.coarseTangentLinearSolve,
      fineTangentLinearSolve: tangent.fineTangentLinearSolve,
    }));
    if (correctedRoot.converged === false) {
      failure = freezeFailure({
        phase: "node-corrector",
        segmentIndex: index,
        reason: correctedRoot.reason,
        message: correctedRoot.message,
        lastAcceptedCoordinates: currentRoot.coordinates,
        predictedCoordinates,
        tangentLinearSolveFailure: null,
      });
      break;
    }
    currentRoot = correctedRoot;
    previousAugmentedTangent = tangent.normalizedAugmentedTangent;
  }
  return finalizeAudit({
    path,
    loadScales,
    anchorCoordinates,
    anchorRoot,
    roots,
    segments,
    anchorCorrectionScaledInfinityNorm,
    policy,
    failure,
  });
}

export function buildPhaseB0TriSegLinearLoadPathV1(
  from: PhaseB0TriSegContinuationPointV1,
  to: PhaseB0TriSegContinuationPointV1,
  segmentCount: number,
): readonly PhaseB0TriSegContinuationPointV1[] {
  requirePositiveFinite(from.leftVentricularCavityVolumeM3, "from LV volume");
  requirePositiveFinite(from.rightVentricularCavityVolumeM3, "from RV volume");
  requirePositiveFinite(to.leftVentricularCavityVolumeM3, "to LV volume");
  requirePositiveFinite(to.rightVentricularCavityVolumeM3, "to RV volume");
  if (!Number.isInteger(segmentCount) || segmentCount < 1) {
    throw new Error("segmentCount must be a positive integer");
  }
  if (
    from.leftVentricularCavityVolumeM3 === to.leftVentricularCavityVolumeM3
    && from.rightVentricularCavityVolumeM3 === to.rightVentricularCavityVolumeM3
  ) {
    throw new Error("linear TriSeg load path endpoints must differ");
  }
  return Object.freeze(Array.from({ length: segmentCount + 1 }, (_, index) =>
    interpolatePoint(from, to, index / segmentCount)));
}

export function scaledPhaseB0TriSegCoordinateDistanceV1(
  left: PhaseB0TriSegCoordinatesV1,
  right: PhaseB0TriSegCoordinatesV1,
  scales: PhaseB0TriSegCoordinatesV1,
): number {
  const leftVolume = requireFinite(
    left.septalMidwallCapVolumeM3,
    "left.septalMidwallCapVolumeM3",
  );
  const rightVolume = requireFinite(
    right.septalMidwallCapVolumeM3,
    "right.septalMidwallCapVolumeM3",
  );
  const leftRadius = requireFinite(left.junctionRadiusM, "left.junctionRadiusM");
  const rightRadius = requireFinite(
    right.junctionRadiusM,
    "right.junctionRadiusM",
  );
  const volumeScale = requirePositiveFinite(
    scales.septalMidwallCapVolumeM3,
    "scales.septalMidwallCapVolumeM3",
  );
  const radiusScale = requirePositiveFinite(
    scales.junctionRadiusM,
    "scales.junctionRadiusM",
  );
  return Math.max(
    Math.abs(leftVolume - rightVolume) / volumeScale,
    Math.abs(leftRadius - rightRadius) / radiusScale,
  );
}

function evaluateSegmentTangent(input: Readonly<{
  rootInput: PhaseB0TriSegNaturalParameterPathRootInputV1;
  coordinates: PhaseB0TriSegCoordinatesV1;
  from: PhaseB0TriSegContinuationPointV1;
  to: PhaseB0TriSegContinuationPointV1;
  loadScales: PhaseB0TriSegContinuationPointV1;
  parameterDerivativeScaledStep: number;
  relativePivotTolerance: number;
}>): SegmentTangentResult {
  try {
    const q = coordinatesToVector(input.coordinates);
    const unknownScales = coordinatesToVector(input.rootInput.unknownScales);
    const residualScales = [
      input.rootInput.equilibriumResidualScaleNPerM,
      input.rootInput.equilibriumResidualScaleNPerM,
    ] as const;
    const lowerBounds = [null, input.rootInput.junctionRadiusLowerBoundM] as const;
    const loadGeometry = evaluateScaledLoadGeometry(
      input.from,
      input.to,
      input.loadScales,
    );
    const residualAt = (
      coordinatesVector: readonly number[],
      point: PhaseB0TriSegContinuationPointV1,
    ) => evaluatePublishedResidual(input.rootInput, point, coordinatesVector);
    const coordinateJacobian = evaluatePhaseB0AlgorithmicJacobianV1(
      (coordinatesVector) => residualAt(coordinatesVector, input.from),
      q,
      {
        unknownScales,
        residualScales,
        lowerBounds,
        scaledStep: input.rootInput.algorithmicJacobianScaledStep,
      },
    );
    if (
      coordinateJacobian.algorithmId
        !== PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
    ) {
      throw new Error("natural-parameter tangent Jacobian identity drifted");
    }
    const derivativeStep = Math.min(
      input.parameterDerivativeScaledStep,
      loadGeometry.scaledLoadArclength / 4,
    );
    const coarseDerivative = evaluateForwardFivePointLoadDerivative({
      residualAt: (point) => residualAt(q, point),
      from: input.from,
      loadScales: input.loadScales,
      scaledLoadUnitDirection: loadGeometry.scaledLoadUnitDirection,
      scaledStep: derivativeStep,
      residualScales,
    });
    const fineDerivative = evaluateForwardFivePointLoadDerivative({
      residualAt: (point) => residualAt(q, point),
      from: input.from,
      loadScales: input.loadScales,
      scaledLoadUnitDirection: loadGeometry.scaledLoadUnitDirection,
      scaledStep: derivativeStep / 2,
      residualScales,
    });
    const scaledJacobian = coordinateJacobian.scaledJacobian;
    const matrix = [
      scaledJacobian[0][0],
      scaledJacobian[0][1],
      scaledJacobian[1][0],
      scaledJacobian[1][1],
    ] as const;
    const coarseSolve = solveScaledDensePartialPivotLuV1(
      matrix,
      [-coarseDerivative[0], -coarseDerivative[1]],
      input.relativePivotTolerance,
    );
    if (coarseSolve.success === false) {
      return Object.freeze({
        success: false,
        reason: "coarse-tangent-linear-solve-failed",
        message: coarseSolve.message,
        tangentLinearSolveFailure: Object.freeze({
          derivativeLevel: "coarse",
          reason: coarseSolve.reason,
          diagnostics: coarseSolve.diagnostics,
        }),
      });
    }
    const fineSolve = solveScaledDensePartialPivotLuV1(
      matrix,
      [-fineDerivative[0], -fineDerivative[1]],
      input.relativePivotTolerance,
    );
    if (fineSolve.success === false) {
      return Object.freeze({
        success: false,
        reason: "fine-tangent-linear-solve-failed",
        message: fineSolve.message,
        tangentLinearSolveFailure: Object.freeze({
          derivativeLevel: "fine",
          reason: fineSolve.reason,
          diagnostics: fineSolve.diagnostics,
        }),
      });
    }
    const coarseTangent = [
      requireFinite(coarseSolve.solution[0], "coarse scaled tangent V_m_S"),
      requireFinite(coarseSolve.solution[1], "coarse scaled tangent y_m"),
    ] as const;
    const fineTangent = Object.freeze([
      requireFinite(fineSolve.solution[0], "fine scaled tangent V_m_S"),
      requireFinite(fineSolve.solution[1], "fine scaled tangent y_m"),
    ] as const);
    const tangentPredictionHalvingDifferenceScaledInfinityNorm =
      Math.max(
        Math.abs(coarseTangent[0] - fineTangent[0]),
        Math.abs(coarseTangent[1] - fineTangent[1]),
      ) * loadGeometry.scaledLoadArclength;
    const norm = Math.hypot(
      fineTangent[0],
      fineTangent[1],
      loadGeometry.scaledLoadUnitDirection[0],
      loadGeometry.scaledLoadUnitDirection[1],
    );
    const normalizedAugmentedTangent = Object.freeze([
      fineTangent[0] / norm,
      fineTangent[1] / norm,
      loadGeometry.scaledLoadUnitDirection[0] / norm,
      loadGeometry.scaledLoadUnitDirection[1] / norm,
    ] as const);
    return Object.freeze({
      success: true,
      tangentAlgorithmicJacobianId: coordinateJacobian.algorithmId,
      scaledLoadArclength: loadGeometry.scaledLoadArclength,
      scaledLoadUnitDirection: loadGeometry.scaledLoadUnitDirection,
      parameterDerivativeActualScaledLoadStep: derivativeStep,
      scaledCoordinateTangentPerUnitLoadArclength: fineTangent,
      tangentPredictionHalvingDifferenceScaledInfinityNorm:
        requireNonNegativeFinite(
          tangentPredictionHalvingDifferenceScaledInfinityNorm,
          "tangent prediction halving difference",
        ),
      normalizedAugmentedTangent,
      coarseTangentLinearSolve: coarseSolve.diagnostics,
      fineTangentLinearSolve: fineSolve.diagnostics,
    });
  } catch (error) {
    return Object.freeze({
      success: false,
      reason: "tangent-residual-or-jacobian-evaluation-failed",
      message: error instanceof Error ? error.message : String(error),
      tangentLinearSolveFailure: null,
    });
  }
}

function evaluateForwardFivePointLoadDerivative(input: Readonly<{
  residualAt: (
    point: PhaseB0TriSegContinuationPointV1,
  ) => readonly [number, number];
  from: PhaseB0TriSegContinuationPointV1;
  loadScales: PhaseB0TriSegContinuationPointV1;
  scaledLoadUnitDirection: readonly [number, number];
  scaledStep: number;
  residualScales: readonly [number, number];
}>): readonly [number, number] {
  const residuals = Array.from({ length: 5 }, (_, index) => input.residualAt(
    offsetPointAlongScaledLoad(
      input.from,
      input.loadScales,
      input.scaledLoadUnitDirection,
      index * input.scaledStep,
    ),
  ));
  const derivative = [0, 1].map((row) => (
    -25 * residuals[0][row]
    + 48 * residuals[1][row]
    - 36 * residuals[2][row]
    + 16 * residuals[3][row]
    - 3 * residuals[4][row]
  ) / (12 * input.scaledStep * input.residualScales[row]));
  return Object.freeze([
    requireFinite(derivative[0], "scaled load derivative axial residual"),
    requireFinite(derivative[1], "scaled load derivative radial residual"),
  ]);
}

function evaluatePublishedResidual(
  rootInput: PhaseB0TriSegNaturalParameterPathRootInputV1,
  point: PhaseB0TriSegContinuationPointV1,
  coordinatesVector: readonly number[],
): readonly [number, number] {
  return evaluatePhaseB0PublishedTriSegResidualV1({
    ...point,
    coordinates: vectorToCoordinates(coordinatesVector),
    walls: rootInput.walls,
    evaluateWallStress: rootInput.evaluateWallStress,
  }).residual;
}

function solveAt(
  point: PhaseB0TriSegContinuationPointV1,
  initialCoordinates: PhaseB0TriSegCoordinatesV1,
  rootInput: PhaseB0TriSegNaturalParameterPathRootInputV1,
): PhaseB0PublishedTriSegRootResultV1 {
  return solvePhaseB0PublishedTriSegRootV1({
    ...rootInput,
    ...point,
    initialCoordinates,
  });
}

function finalizeAudit(input: Readonly<{
  path: readonly PhaseB0TriSegContinuationPointV1[];
  loadScales: PhaseB0TriSegContinuationPointV1;
  anchorCoordinates: PhaseB0TriSegCoordinatesV1;
  anchorRoot: PhaseB0PublishedTriSegRootResultV1;
  roots: readonly PhaseB0PublishedTriSegRootResultV1[];
  segments: readonly PhaseB0TriSegNaturalParameterSegmentV1[];
  anchorCorrectionScaledInfinityNorm: number | null;
  policy: PhaseB0TriSegNaturalParameterContinuationPolicyV1;
  failure: PhaseB0TriSegNaturalParameterContinuationFailureV1 | null;
}>): PhaseB0TriSegNaturalParameterContinuationAuditV1 {
  const allConverged = input.roots.length === input.path.length
    && input.roots.every((root) => root.converged);
  const tangentHalvingDifferences = input.segments.map(
    (segment) => segment.tangentPredictionHalvingDifferenceScaledInfinityNorm,
  );
  const corrections = input.segments
    .map((segment) => segment.predictorCorrectionScaledInfinityNorm)
    .filter((value): value is number => value !== null);
  const correctionRatios = input.segments
    .map((segment) => segment.predictorCorrectionToAcceptedCoordinateStepRatio)
    .filter((value): value is number => value !== null);
  const steps = input.segments
    .map((segment) => segment.acceptedCoordinateStepScaledInfinityNorm)
    .filter((value): value is number => value !== null);
  const tangentDots = input.segments
    .map((segment) => segment.tangentDotWithPrevious)
    .filter((value): value is number => value !== null);
  const maximumTangentPredictionHalvingDifferenceScaledInfinityNorm =
    tangentHalvingDifferences.length === input.segments.length
    && tangentHalvingDifferences.length > 0
      ? Math.max(...tangentHalvingDifferences)
      : null;
  const maximumPredictorCorrectionScaledInfinityNorm =
    corrections.length === input.segments.length && corrections.length > 0
      ? Math.max(...corrections)
      : null;
  const maximumPredictorCorrectionToAcceptedCoordinateStepRatio =
    correctionRatios.length === input.segments.length && correctionRatios.length > 0
      ? Math.max(...correctionRatios)
      : null;
  const maximumAcceptedScaledCoordinateStep =
    steps.length === input.segments.length && steps.length > 0
      ? Math.max(...steps)
      : null;
  const minimumTangentDot = tangentDots.length > 0 ? Math.min(...tangentDots) : null;
  const thresholdViolations: string[] = [];
  if (input.failure !== null) thresholdViolations.push("structured-path-failure");
  if (!allConverged) thresholdViolations.push("not-all-path-nodes-converged");
  if (
    input.anchorCorrectionScaledInfinityNorm === null
    || input.anchorCorrectionScaledInfinityNorm
      > input.policy.maximumAnchorCorrectionScaledInfinityNorm
  ) {
    thresholdViolations.push("anchor-correction-threshold");
  }
  if (
    maximumTangentPredictionHalvingDifferenceScaledInfinityNorm === null
    || maximumTangentPredictionHalvingDifferenceScaledInfinityNorm
      > input.policy.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm
  ) {
    thresholdViolations.push("tangent-halving-difference-threshold");
  }
  if (
    maximumPredictorCorrectionScaledInfinityNorm === null
    || maximumPredictorCorrectionScaledInfinityNorm
      > input.policy.maximumPredictorCorrectionScaledInfinityNorm
  ) {
    thresholdViolations.push("predictor-correction-threshold");
  }
  if (
    maximumPredictorCorrectionToAcceptedCoordinateStepRatio === null
    || maximumPredictorCorrectionToAcceptedCoordinateStepRatio
      > input.policy.maximumPredictorCorrectionToAcceptedCoordinateStepRatio
  ) {
    thresholdViolations.push("predictor-correction-ratio-threshold");
  }
  if (
    maximumAcceptedScaledCoordinateStep === null
    || maximumAcceptedScaledCoordinateStep
      > input.policy.maximumAcceptedScaledCoordinateStep
  ) {
    thresholdViolations.push("accepted-coordinate-step-threshold");
  }
  if (minimumTangentDot !== null && minimumTangentDot < input.policy.minimumTangentDot) {
    thresholdViolations.push("tangent-dot-threshold");
  }
  const numericalPathAccepted = thresholdViolations.length === 0;
  const tangentAlgorithmicJacobianId = input.segments.length > 0
    && input.segments.every((segment) => segment.tangentAlgorithmicJacobianId
      === PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID)
    ? PHASE_B0_VERIFIED_ALGORITHMIC_JACOBIAN_V1_ID
    : null;
  const branchIdentity = numericalPathAccepted
    ? "numerically-tracked-from-declared-anchor-by-corrected-path"
    : "not-established";
  return Object.freeze({
    auditId: PHASE_B0_TRISEG_NATURAL_PARAMETER_CONTINUATION_V1_ID,
    pathParameterization:
      "cumulative-scaled-load-arclength-using-declared-fixed-load-scales",
    parameterDerivativeStencil:
      "in-segment-forward-five-point-with-step-halving-audit",
    tangentAlgorithmicJacobianId,
    scaledCoordinateDistanceNorm: "scaled-infinity-norm",
    path: input.path,
    loadScales: input.loadScales,
    anchorCoordinates: input.anchorCoordinates,
    anchorRoot: input.anchorRoot,
    anchorCorrectionScaledInfinityNorm: input.anchorCorrectionScaledInfinityNorm,
    segments: Object.freeze([...input.segments]),
    roots: Object.freeze([...input.roots]),
    allConverged,
    maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
    maximumPredictorCorrectionScaledInfinityNorm,
    maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
    maximumAcceptedScaledCoordinateStep,
    minimumTangentDot,
    policy: input.policy,
    thresholdViolations: Object.freeze(thresholdViolations),
    failure: input.failure,
    numericalPathAccepted,
    accepted: numericalPathAccepted,
    branchIdentityEstablished: numericalPathAccepted,
    branchIdentity,
    previousRootUse: "tangent-predictor-only",
    nearestRootSelectionApplied: false,
    minimumResidualSelectionApplied: false,
    maximumJunctionRadiusSelectionApplied: false,
    forcedPreviousSeptumApplied: false,
    pseudoArclengthApplied: false,
    supportedEnvelopeClaimed: false,
  });
}

function validateInput(input: Readonly<{
  rootInput: PhaseB0TriSegNaturalParameterPathRootInputV1;
  path: readonly PhaseB0TriSegContinuationPointV1[];
  loadScales?: PhaseB0TriSegContinuationPointV1;
  anchorCoordinates: PhaseB0TriSegCoordinatesV1;
  policy: PhaseB0TriSegNaturalParameterContinuationPolicyV1;
}>): void {
  if (!Array.isArray(input.path) || input.path.length < 2) {
    throw new Error("TriSeg natural-parameter continuation requires at least two path nodes");
  }
  for (const point of input.path) {
    requirePositiveFinite(point.leftVentricularCavityVolumeM3, "path LV volume");
    requirePositiveFinite(point.rightVentricularCavityVolumeM3, "path RV volume");
  }
  requireFinite(
    input.anchorCoordinates.septalMidwallCapVolumeM3,
    "anchor septalMidwallCapVolumeM3",
  );
  requirePositiveFinite(input.anchorCoordinates.junctionRadiusM, "anchor junctionRadiusM");
  requirePositiveFinite(
    input.policy.parameterDerivativeScaledStep,
    "parameterDerivativeScaledStep",
  );
  requirePositiveFinite(
    input.policy.minimumScaledLoadArclength,
    "minimumScaledLoadArclength",
  );
  requirePositiveFinite(
    input.policy.maximumTangentPredictionHalvingDifferenceScaledInfinityNorm,
    "maximumTangentPredictionHalvingDifferenceScaledInfinityNorm",
  );
  requirePositiveFinite(
    input.policy.maximumAnchorCorrectionScaledInfinityNorm,
    "maximumAnchorCorrectionScaledInfinityNorm",
  );
  requirePositiveFinite(
    input.policy.maximumPredictorCorrectionScaledInfinityNorm,
    "maximumPredictorCorrectionScaledInfinityNorm",
  );
  requirePositiveFinite(
    input.policy.maximumPredictorCorrectionToAcceptedCoordinateStepRatio,
    "maximumPredictorCorrectionToAcceptedCoordinateStepRatio",
  );
  requirePositiveFinite(
    input.policy.maximumAcceptedScaledCoordinateStep,
    "maximumAcceptedScaledCoordinateStep",
  );
  if (
    !Number.isFinite(input.policy.minimumTangentDot)
    || input.policy.minimumTangentDot < -1
    || input.policy.minimumTangentDot > 1
  ) {
    throw new Error("minimumTangentDot must lie in [-1, 1]");
  }
  requirePositiveFinite(input.policy.relativePivotTolerance, "relativePivotTolerance");
  const loadScales = input.loadScales ?? input.path[0];
  requirePositiveFinite(
    loadScales.leftVentricularCavityVolumeM3,
    "loadScales LV volume",
  );
  requirePositiveFinite(
    loadScales.rightVentricularCavityVolumeM3,
    "loadScales RV volume",
  );
  for (let index = 0; index < input.path.length - 1; index += 1) {
    const segment = evaluateScaledLoadGeometry(
      input.path[index],
      input.path[index + 1],
      loadScales,
    );
    if (segment.scaledLoadArclength < input.policy.minimumScaledLoadArclength) {
      throw new Error("consecutive TriSeg load-path nodes are identical or too close");
    }
  }
}

function evaluateScaledLoadGeometry(
  from: PhaseB0TriSegContinuationPointV1,
  to: PhaseB0TriSegContinuationPointV1,
  loadScales: PhaseB0TriSegContinuationPointV1,
): Readonly<{
  scaledLoadArclength: number;
  scaledLoadUnitDirection: readonly [number, number];
}> {
  const delta = [
    (to.leftVentricularCavityVolumeM3 - from.leftVentricularCavityVolumeM3)
      / loadScales.leftVentricularCavityVolumeM3,
    (to.rightVentricularCavityVolumeM3 - from.rightVentricularCavityVolumeM3)
      / loadScales.rightVentricularCavityVolumeM3,
  ] as const;
  const scaledLoadArclength = requireNonNegativeFinite(
    Math.hypot(delta[0], delta[1]),
    "scaled load arclength",
  );
  if (scaledLoadArclength === 0) {
    return Object.freeze({
      scaledLoadArclength,
      scaledLoadUnitDirection: Object.freeze([0, 0] as const),
    });
  }
  return Object.freeze({
    scaledLoadArclength,
    scaledLoadUnitDirection: Object.freeze([
      delta[0] / scaledLoadArclength,
      delta[1] / scaledLoadArclength,
    ] as const),
  });
}

function offsetPointAlongScaledLoad(
  from: PhaseB0TriSegContinuationPointV1,
  loadScales: PhaseB0TriSegContinuationPointV1,
  scaledLoadUnitDirection: readonly [number, number],
  scaledDistance: number,
): PhaseB0TriSegContinuationPointV1 {
  return Object.freeze({
    leftVentricularCavityVolumeM3:
      from.leftVentricularCavityVolumeM3
      + scaledDistance
        * scaledLoadUnitDirection[0]
        * loadScales.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3:
      from.rightVentricularCavityVolumeM3
      + scaledDistance
        * scaledLoadUnitDirection[1]
        * loadScales.rightVentricularCavityVolumeM3,
  });
}

function interpolatePoint(
  from: PhaseB0TriSegContinuationPointV1,
  to: PhaseB0TriSegContinuationPointV1,
  fraction: number,
): PhaseB0TriSegContinuationPointV1 {
  return Object.freeze({
    leftVentricularCavityVolumeM3:
      from.leftVentricularCavityVolumeM3
      + fraction * (to.leftVentricularCavityVolumeM3 - from.leftVentricularCavityVolumeM3),
    rightVentricularCavityVolumeM3:
      from.rightVentricularCavityVolumeM3
      + fraction * (to.rightVentricularCavityVolumeM3 - from.rightVentricularCavityVolumeM3),
  });
}

function coordinatesToVector(
  coordinates: PhaseB0TriSegCoordinatesV1,
): readonly [number, number] {
  return Object.freeze([
    coordinates.septalMidwallCapVolumeM3,
    coordinates.junctionRadiusM,
  ]);
}

function vectorToCoordinates(values: readonly number[]): PhaseB0TriSegCoordinatesV1 {
  if (values.length !== 2) throw new Error("TriSeg coordinate vector must have length two");
  return Object.freeze({
    septalMidwallCapVolumeM3: requireFinite(values[0], "septalMidwallCapVolumeM3"),
    junctionRadiusM: requirePositiveFinite(values[1], "junctionRadiusM"),
  });
}

function dot4(
  left: readonly [number, number, number, number],
  right: readonly [number, number, number, number],
): number {
  return left[0] * right[0]
    + left[1] * right[1]
    + left[2] * right[2]
    + left[3] * right[3];
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator > 0) return numerator / denominator;
  return numerator === 0 ? 0 : Number.POSITIVE_INFINITY;
}

function freezeFailure(
  failure: PhaseB0TriSegNaturalParameterContinuationFailureV1,
): PhaseB0TriSegNaturalParameterContinuationFailureV1 {
  return Object.freeze({
    ...failure,
    lastAcceptedCoordinates: Object.freeze({ ...failure.lastAcceptedCoordinates }),
    predictedCoordinates: failure.predictedCoordinates === null
      ? null
      : Object.freeze({ ...failure.predictedCoordinates }),
    tangentLinearSolveFailure: failure.tangentLinearSolveFailure === null
      ? null
      : Object.freeze({ ...failure.tangentLinearSolveFailure }),
  });
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(field + " must be finite");
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(field + " must be positive and finite");
  }
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(field + " must be nonnegative and finite");
  }
  return value;
}
