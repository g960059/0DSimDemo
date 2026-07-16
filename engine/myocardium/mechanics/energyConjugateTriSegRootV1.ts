import {
  evaluateEnergyConjugateTriSegV1,
  evaluateTriSegGeometryV1,
  TRISEG_WALL_IDS_V1,
  type EnergyConjugateTriSegEvaluationV1,
  type TriSegCoordinatesV1,
  type TriSegGeometryV1,
  type TriSegKoiterBendingPriorV1,
  type TriSegWallGeometryParametersV1,
  type TriSegWallRecordV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";

export const ENERGY_CONJUGATE_TRISEG_ROOT_V1_ID =
  "energy-conjugate-three-wall-triseg-root-v1" as const;

export type TriSegRootOptionsV1 = Readonly<{
  maxIterations?: number;
  scaledResidualInfinityTolerance?: number;
  scaledUpdateInfinityTolerance?: number;
  finiteDifferenceScaledStep?: number;
  potentialSymmetryRelativeTolerance?: number;
  maxLineSearchBacktracks?: number;
}>;

export type EnergyConjugateTriSegRootInputV1 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  walls: TriSegWallRecordV1<TriSegWallGeometryParametersV1>;
  bendingPrior: TriSegKoiterBendingPriorV1;
  initialCoordinates: TriSegCoordinatesV1;
  evaluateWallStress: (
    geometry: TriSegGeometryV1,
  ) => TriSegWallRecordV1<number>;
  unknownScales: TriSegCoordinatesV1;
  equilibriumResidualScaleNPerM: number;
  junctionRadiusLowerBoundM: number;
  options?: TriSegRootOptionsV1;
}>;

export type TriSegPotentialStabilityV1 = Readonly<{
  coordinateConvention:
    "x=[V_m_S/V_scale,y_m/y_scale];H_x=d2Pi/dx2-in-joules";
  scaledPotentialHessianJ: readonly [
    readonly [number, number],
    readonly [number, number],
  ];
  rawMixedDerivativeJ: Readonly<{
    dVolumeGradientDRadiusCoordinate: number;
    dRadiusGradientDVolumeCoordinate: number;
  }>;
  antisymmetricPartMaximumAbsoluteJ: number;
  antisymmetricPartRelativeToHessianInfinityNorm: number;
  potentialGradientConservativeWithinTolerance: boolean;
  minimumEigenvalueJ: number;
  maximumEigenvalueJ: number;
  symmetricPartPositiveDefinite: boolean;
  strictLocalPotentialMinimum: boolean;
  classification:
    | "strict-local-potential-minimum"
    | "stationary-gradient-not-conservative-within-tolerance"
    | "stationary-point-not-a-strict-local-minimum";
  claimBoundary:
    "local-numerical-hessian-of-callback-stress-gradient-not-a-global-uniqueness-proof";
}>;

export type TriSegRootDiagnosticsV1 = Readonly<{
  iterations: number;
  acceptedLineSearchSteps: number;
  lineSearchBacktracks: number;
  finalScaledResidualInfinityNorm: number;
  finalScaledUpdateInfinityNorm: number | null;
  finiteDifferenceScaledStep: number;
}>;

export type EnergyConjugateTriSegRootSuccessV1 = Readonly<{
  converged: true;
  rootId: typeof ENERGY_CONJUGATE_TRISEG_ROOT_V1_ID;
  coordinates: TriSegCoordinatesV1;
  geometry: TriSegGeometryV1;
  fiberKirchhoffStressPaByWall: TriSegWallRecordV1<number>;
  mechanics: EnergyConjugateTriSegEvaluationV1;
  potentialStability: TriSegPotentialStabilityV1;
  stable: boolean;
  diagnostics: TriSegRootDiagnosticsV1;
  rollbackOnFailure: true;
  publishedTaylorUsedForRoot: false;
}>;

export type TriSegRootFailureReasonV1 =
  | "invalid-initial-state"
  | "singular-jacobian"
  | "line-search-failed"
  | "maximum-iterations"
  | "finite-difference-failed"
  | "final-evaluation-failed";

export type EnergyConjugateTriSegRootFailureV1 = Readonly<{
  converged: false;
  rootId: typeof ENERGY_CONJUGATE_TRISEG_ROOT_V1_ID;
  reason: TriSegRootFailureReasonV1;
  message: string;
  rollbackCoordinates: TriSegCoordinatesV1;
  lastAcceptedCoordinates: TriSegCoordinatesV1;
  diagnostics: TriSegRootDiagnosticsV1;
  rollbackOnFailure: true;
  publishedTaylorUsedForRoot: false;
}>;

export type EnergyConjugateTriSegRootResultV1 =
  | EnergyConjugateTriSegRootSuccessV1
  | EnergyConjugateTriSegRootFailureV1;

export type EnergyConjugateTriSegMultiStartAuditV1 = Readonly<{
  auditId: "energy-conjugate-three-wall-triseg-stable-multistart-v1";
  results: readonly EnergyConjugateTriSegRootResultV1[];
  allSeedsConvergedToStationaryPoints: boolean;
  stableRootCount: number;
  nonMinimumStationaryPointCount: number;
  nonConservativeStationaryPointCount: number;
  stableRootsSameBranchWithinTolerance: boolean;
  maximumStablePairwiseScaledCoordinateDistance: number | null;
  scaledCoordinateTolerance: number;
  selectedStableRoot: EnergyConjugateTriSegRootSuccessV1 | null;
  selectionRule:
    "discard-nonconservative-and-nonminimum-stationary-points-then-require-one-stable-coordinate-cluster";
  globalUniquenessClaimed: false;
  accepted: boolean;
}>;

type Vector2 = readonly [number, number];
type Matrix2 = readonly [Vector2, Vector2];

type RootEvaluationV1 = Readonly<{
  geometry: TriSegGeometryV1;
  fiberKirchhoffStressPaByWall: TriSegWallRecordV1<number>;
  mechanics: EnergyConjugateTriSegEvaluationV1;
  scaledResidual: Vector2;
}>;

const DEFAULT_OPTIONS = Object.freeze({
  maxIterations: 48,
  scaledResidualInfinityTolerance: 1e-9,
  scaledUpdateInfinityTolerance: 1e-10,
  finiteDifferenceScaledStep: 2e-5,
  potentialSymmetryRelativeTolerance: 5e-5,
  maxLineSearchBacktracks: 24,
});

/**
 * Damped Newton solve of the two internal shape coordinates. Failure is
 * transactional: the caller's accepted coordinates are never mutated and are
 * returned explicitly as rollbackCoordinates.
 */
export function solveEnergyConjugateTriSegRootV1(
  input: EnergyConjugateTriSegRootInputV1,
): EnergyConjugateTriSegRootResultV1 {
  validateInput(input);
  const options = resolveOptions(input.options);
  const initialScaled = coordinatesToScaled(
    input.initialCoordinates,
    input.unknownScales,
  );
  let current = initialScaled;
  let currentEvaluation: RootEvaluationV1;
  let acceptedLineSearchSteps = 0;
  let lineSearchBacktracks = 0;
  let finalScaledUpdateInfinityNorm: number | null = null;

  try {
    currentEvaluation = evaluateAtScaledCoordinates(input, current);
  } catch (error) {
    return failure(
      input,
      "invalid-initial-state",
      errorMessage(error),
      input.initialCoordinates,
      diagnostics(
        0,
        acceptedLineSearchSteps,
        lineSearchBacktracks,
        Number.POSITIVE_INFINITY,
        finalScaledUpdateInfinityNorm,
        options.finiteDifferenceScaledStep,
      ),
    );
  }

  for (let iteration = 0; iteration <= options.maxIterations; iteration += 1) {
    const residualNorm = infinityNorm(currentEvaluation.scaledResidual);
    if (residualNorm <= options.scaledResidualInfinityTolerance) {
      try {
        const stability = evaluatePotentialStability(input, current, options);
        return Object.freeze({
          converged: true as const,
          rootId: ENERGY_CONJUGATE_TRISEG_ROOT_V1_ID,
          coordinates: scaledToCoordinates(current, input.unknownScales),
          geometry: currentEvaluation.geometry,
          fiberKirchhoffStressPaByWall:
            currentEvaluation.fiberKirchhoffStressPaByWall,
          mechanics: currentEvaluation.mechanics,
          potentialStability: stability,
          stable: stability.strictLocalPotentialMinimum,
          diagnostics: diagnostics(
            iteration,
            acceptedLineSearchSteps,
            lineSearchBacktracks,
            residualNorm,
            finalScaledUpdateInfinityNorm,
            options.finiteDifferenceScaledStep,
          ),
          rollbackOnFailure: true as const,
          publishedTaylorUsedForRoot: false as const,
        });
      } catch (error) {
        return failure(
          input,
          "final-evaluation-failed",
          errorMessage(error),
          scaledToCoordinates(current, input.unknownScales),
          diagnostics(
            iteration,
            acceptedLineSearchSteps,
            lineSearchBacktracks,
            residualNorm,
            finalScaledUpdateInfinityNorm,
            options.finiteDifferenceScaledStep,
          ),
        );
      }
    }
    if (iteration === options.maxIterations) {
      return failure(
        input,
        "maximum-iterations",
        "TriSeg root reached its iteration limit",
        scaledToCoordinates(current, input.unknownScales),
        diagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          finalScaledUpdateInfinityNorm,
          options.finiteDifferenceScaledStep,
        ),
      );
    }

    let jacobian: Matrix2;
    try {
      jacobian = finiteDifferenceJacobian(
        (candidate) => evaluateAtScaledCoordinates(input, candidate).scaledResidual,
        current,
        options.finiteDifferenceScaledStep,
        input.junctionRadiusLowerBoundM
          / input.unknownScales.junctionRadiusM,
      );
    } catch (error) {
      return failure(
        input,
        "finite-difference-failed",
        errorMessage(error),
        scaledToCoordinates(current, input.unknownScales),
        diagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          finalScaledUpdateInfinityNorm,
          options.finiteDifferenceScaledStep,
        ),
      );
    }
    const update = solveNewtonUpdate(jacobian, currentEvaluation.scaledResidual);
    if (update === null) {
      return failure(
        input,
        "singular-jacobian",
        "TriSeg scaled 2x2 Jacobian is singular or ill-conditioned",
        scaledToCoordinates(current, input.unknownScales),
        diagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          finalScaledUpdateInfinityNorm,
          options.finiteDifferenceScaledStep,
        ),
      );
    }
    finalScaledUpdateInfinityNorm = infinityNorm(update);
    if (
      finalScaledUpdateInfinityNorm <= options.scaledUpdateInfinityTolerance
      && residualNorm > options.scaledResidualInfinityTolerance
    ) {
      return failure(
        input,
        "singular-jacobian",
        "TriSeg Newton update stagnated above the residual tolerance",
        scaledToCoordinates(current, input.unknownScales),
        diagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          finalScaledUpdateInfinityNorm,
          options.finiteDifferenceScaledStep,
        ),
      );
    }

    let accepted: Readonly<{
      scaled: Vector2;
      evaluation: RootEvaluationV1;
    }> | null = null;
    let stepLength = 1;
    for (
      let backtrack = 0;
      backtrack <= options.maxLineSearchBacktracks;
      backtrack += 1
    ) {
      const candidate: Vector2 = [
        current[0] + stepLength * update[0],
        current[1] + stepLength * update[1],
      ];
      try {
        const evaluation = evaluateAtScaledCoordinates(input, candidate);
        const candidateNorm = infinityNorm(evaluation.scaledResidual);
        if (candidateNorm <= (1 - 1e-4 * stepLength) * residualNorm) {
          accepted = Object.freeze({ scaled: candidate, evaluation });
          break;
        }
      } catch {
        // Inadmissible geometry is handled by the same backtracking path.
      }
      stepLength *= 0.5;
      lineSearchBacktracks += 1;
    }
    if (accepted === null) {
      return failure(
        input,
        "line-search-failed",
        "TriSeg damped Newton could not find a residual-decreasing admissible step",
        scaledToCoordinates(current, input.unknownScales),
        diagnostics(
          iteration,
          acceptedLineSearchSteps,
          lineSearchBacktracks,
          residualNorm,
          finalScaledUpdateInfinityNorm,
          options.finiteDifferenceScaledStep,
        ),
      );
    }
    current = accepted.scaled;
    currentEvaluation = accepted.evaluation;
    acceptedLineSearchSteps += 1;
  }

  throw new Error("unreachable TriSeg Newton state");
}

/**
 * Multi-start is an audit, not a global proof. Saddles may be found by Newton;
 * only conservative-gradient strict minima participate in branch selection.
 */
export function auditStableEnergyConjugateTriSegMultiStartV1(
  input: Omit<EnergyConjugateTriSegRootInputV1, "initialCoordinates">,
  seeds: readonly TriSegCoordinatesV1[],
  scaledCoordinateTolerance = 1e-6,
): EnergyConjugateTriSegMultiStartAuditV1 {
  if (!Array.isArray(seeds) || seeds.length < 2) {
    throw new Error("TriSeg multi-start requires at least two seeds");
  }
  requirePositive(scaledCoordinateTolerance, "scaledCoordinateTolerance");
  const results = Object.freeze(seeds.map((initialCoordinates) =>
    solveEnergyConjugateTriSegRootV1({ ...input, initialCoordinates })));
  const converged = results.filter(
    (result): result is EnergyConjugateTriSegRootSuccessV1 => result.converged,
  );
  const stable = converged.filter((result) => result.stable);
  let maximumDistance: number | null = stable.length > 0 ? 0 : null;
  for (let left = 0; left < stable.length; left += 1) {
    for (let right = left + 1; right < stable.length; right += 1) {
      maximumDistance = Math.max(
        maximumDistance ?? 0,
        Math.max(
          Math.abs(
            stable[left].coordinates.septalMidwallCapVolumeM3
              - stable[right].coordinates.septalMidwallCapVolumeM3,
          ) / input.unknownScales.septalMidwallCapVolumeM3,
          Math.abs(
            stable[left].coordinates.junctionRadiusM
              - stable[right].coordinates.junctionRadiusM,
          ) / input.unknownScales.junctionRadiusM,
        ),
      );
    }
  }
  const stableRootsSameBranchWithinTolerance = stable.length >= 2
    && maximumDistance !== null
    && maximumDistance <= scaledCoordinateTolerance;
  const allSeedsConvergedToStationaryPoints = converged.length === results.length;
  return Object.freeze({
    auditId: "energy-conjugate-three-wall-triseg-stable-multistart-v1" as const,
    results,
    allSeedsConvergedToStationaryPoints,
    stableRootCount: stable.length,
    nonMinimumStationaryPointCount: converged.filter((result) =>
      result.potentialStability.potentialGradientConservativeWithinTolerance
      && !result.potentialStability.symmetricPartPositiveDefinite).length,
    nonConservativeStationaryPointCount: converged.filter((result) =>
      !result.potentialStability.potentialGradientConservativeWithinTolerance).length,
    stableRootsSameBranchWithinTolerance,
    maximumStablePairwiseScaledCoordinateDistance: maximumDistance,
    scaledCoordinateTolerance,
    selectedStableRoot: stable[0] ?? null,
    selectionRule:
      "discard-nonconservative-and-nonminimum-stationary-points-then-require-one-stable-coordinate-cluster" as const,
    globalUniquenessClaimed: false as const,
    accepted: allSeedsConvergedToStationaryPoints
      && stableRootsSameBranchWithinTolerance,
  });
}

function evaluateAtScaledCoordinates(
  input: EnergyConjugateTriSegRootInputV1,
  scaled: Vector2,
): RootEvaluationV1 {
  const coordinates = scaledToCoordinates(scaled, input.unknownScales);
  if (!(coordinates.junctionRadiusM > input.junctionRadiusLowerBoundM)) {
    throw new Error("junction radius left its strict admissible domain");
  }
  const geometry = evaluateTriSegGeometryV1({
    leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
    coordinates,
    walls: input.walls,
  });
  const fiberKirchhoffStressPaByWall = input.evaluateWallStress(geometry);
  validateWallStress(fiberKirchhoffStressPaByWall);
  const mechanics = evaluateEnergyConjugateTriSegV1({
    geometry,
    fiberKirchhoffStressPaByWall,
    bendingPrior: input.bendingPrior,
  });
  return Object.freeze({
    geometry,
    fiberKirchhoffStressPaByWall: Object.freeze({
      ...fiberKirchhoffStressPaByWall,
    }),
    mechanics,
    scaledResidual: Object.freeze([
      mechanics.equilibriumResidual.axialNPerM
        / input.equilibriumResidualScaleNPerM,
      mechanics.equilibriumResidual.radialNPerM
        / input.equilibriumResidualScaleNPerM,
    ]) as Vector2,
  });
}

function evaluatePotentialStability(
  input: EnergyConjugateTriSegRootInputV1,
  rootScaled: Vector2,
  options: Required<TriSegRootOptionsV1>,
): TriSegPotentialStabilityV1 {
  const potentialGradientByScaledCoordinate = (scaled: Vector2): Vector2 => {
    const mechanics = evaluateAtScaledCoordinates(input, scaled).mechanics;
    return [
      mechanics.totalGeneralizedForce.septalMidwallCapVolumePa
        * input.unknownScales.septalMidwallCapVolumeM3,
      mechanics.totalGeneralizedForce.junctionRadiusN
        * input.unknownScales.junctionRadiusM,
    ];
  };
  const raw = finiteDifferenceJacobian(
    potentialGradientByScaledCoordinate,
    rootScaled,
    options.finiteDifferenceScaledStep,
    input.junctionRadiusLowerBoundM / input.unknownScales.junctionRadiusM,
  );
  const h00 = raw[0][0];
  const h01Raw = raw[0][1];
  const h10Raw = raw[1][0];
  const h11 = raw[1][1];
  const h01 = 0.5 * (h01Raw + h10Raw);
  const antisymmetricPartMaximumAbsoluteJ = 0.5
    * Math.abs(h01Raw - h10Raw);
  const hessianInfinityNorm = Math.max(
    Math.abs(h00) + Math.abs(h01),
    Math.abs(h01) + Math.abs(h11),
    Number.MIN_VALUE,
  );
  const antisymmetricRelative = antisymmetricPartMaximumAbsoluteJ
    / hessianInfinityNorm;
  const conservative = antisymmetricRelative
    <= options.potentialSymmetryRelativeTolerance;
  const trace = h00 + h11;
  const discriminant = Math.hypot(h00 - h11, 2 * h01);
  const minimumEigenvalueJ = 0.5 * (trace - discriminant);
  const maximumEigenvalueJ = 0.5 * (trace + discriminant);
  const symmetricPartPositiveDefinite = minimumEigenvalueJ > Math.max(
    1e-12,
    1e-10 * Math.abs(maximumEigenvalueJ),
  );
  const strictLocalPotentialMinimum = conservative
    && symmetricPartPositiveDefinite;
  return Object.freeze({
    coordinateConvention:
      "x=[V_m_S/V_scale,y_m/y_scale];H_x=d2Pi/dx2-in-joules" as const,
    scaledPotentialHessianJ: Object.freeze([
      Object.freeze([h00, h01]),
      Object.freeze([h01, h11]),
    ]) as Matrix2,
    rawMixedDerivativeJ: Object.freeze({
      dVolumeGradientDRadiusCoordinate: h01Raw,
      dRadiusGradientDVolumeCoordinate: h10Raw,
    }),
    antisymmetricPartMaximumAbsoluteJ,
    antisymmetricPartRelativeToHessianInfinityNorm: antisymmetricRelative,
    potentialGradientConservativeWithinTolerance: conservative,
    minimumEigenvalueJ,
    maximumEigenvalueJ,
    symmetricPartPositiveDefinite,
    strictLocalPotentialMinimum,
    classification: !conservative
      ? "stationary-gradient-not-conservative-within-tolerance" as const
      : symmetricPartPositiveDefinite
        ? "strict-local-potential-minimum" as const
        : "stationary-point-not-a-strict-local-minimum" as const,
    claimBoundary:
      "local-numerical-hessian-of-callback-stress-gradient-not-a-global-uniqueness-proof" as const,
  });
}

function finiteDifferenceJacobian(
  evaluate: (point: Vector2) => Vector2,
  center: Vector2,
  requestedStep: number,
  strictSecondCoordinateLowerBound: number,
): Matrix2 {
  const centerValue = evaluate(center);
  const columns: [Vector2, Vector2] = [
    [0, 0],
    [0, 0],
  ];
  for (let coordinate = 0; coordinate < 2; coordinate += 1) {
    let step = requestedStep;
    let derivative: Vector2 | null = null;
    for (let attempt = 0; attempt < 10 && derivative === null; attempt += 1) {
      const minusOne = shifted(center, coordinate, -step);
      const minusTwo = shifted(center, coordinate, -2 * step);
      const plusOne = shifted(center, coordinate, step);
      const plusTwo = shifted(center, coordinate, 2 * step);
      const minusAdmissible = coordinate === 0
        || minusTwo[1] > strictSecondCoordinateLowerBound;
      if (minusAdmissible) {
        const fm2 = tryEvaluate(evaluate, minusTwo);
        const fm1 = tryEvaluate(evaluate, minusOne);
        const fp1 = tryEvaluate(evaluate, plusOne);
        const fp2 = tryEvaluate(evaluate, plusTwo);
        if (fm2 && fm1 && fp1 && fp2) {
          derivative = [
            (fm2[0] - 8 * fm1[0] + 8 * fp1[0] - fp2[0]) / (12 * step),
            (fm2[1] - 8 * fm1[1] + 8 * fp1[1] - fp2[1]) / (12 * step),
          ];
        }
      }
      if (derivative === null) {
        const fp1 = tryEvaluate(evaluate, plusOne);
        const fp2 = tryEvaluate(evaluate, plusTwo);
        if (fp1 && fp2) {
          derivative = [
            (-3 * centerValue[0] + 4 * fp1[0] - fp2[0]) / (2 * step),
            (-3 * centerValue[1] + 4 * fp1[1] - fp2[1]) / (2 * step),
          ];
        }
      }
      step *= 0.5;
    }
    if (derivative === null || derivative.some((value) => !Number.isFinite(value))) {
      throw new Error(`failed to differentiate TriSeg coordinate ${coordinate}`);
    }
    columns[coordinate] = derivative;
  }
  return Object.freeze([
    Object.freeze([columns[0][0], columns[1][0]]) as Vector2,
    Object.freeze([columns[0][1], columns[1][1]]) as Vector2,
  ]) as Matrix2;
}

function solveNewtonUpdate(jacobian: Matrix2, residual: Vector2): Vector2 | null {
  const [a, b] = jacobian[0];
  const [c, d] = jacobian[1];
  const determinant = a * d - b * c;
  const matrixNorm = Math.max(Math.abs(a) + Math.abs(b), Math.abs(c) + Math.abs(d));
  if (!Number.isFinite(determinant)
    || Math.abs(determinant) <= 1e-14 * Math.max(1, matrixNorm ** 2)) {
    return null;
  }
  const update: Vector2 = [
    (-d * residual[0] + b * residual[1]) / determinant,
    (c * residual[0] - a * residual[1]) / determinant,
  ];
  return update.every(Number.isFinite) ? update : null;
}

function failure(
  input: EnergyConjugateTriSegRootInputV1,
  reason: TriSegRootFailureReasonV1,
  message: string,
  lastAcceptedCoordinates: TriSegCoordinatesV1,
  rootDiagnostics: TriSegRootDiagnosticsV1,
): EnergyConjugateTriSegRootFailureV1 {
  return Object.freeze({
    converged: false as const,
    rootId: ENERGY_CONJUGATE_TRISEG_ROOT_V1_ID,
    reason,
    message,
    rollbackCoordinates: Object.freeze({ ...input.initialCoordinates }),
    lastAcceptedCoordinates: Object.freeze({ ...lastAcceptedCoordinates }),
    diagnostics: rootDiagnostics,
    rollbackOnFailure: true as const,
    publishedTaylorUsedForRoot: false as const,
  });
}

function diagnostics(
  iterations: number,
  acceptedLineSearchSteps: number,
  lineSearchBacktracks: number,
  finalScaledResidualInfinityNorm: number,
  finalScaledUpdateInfinityNorm: number | null,
  finiteDifferenceScaledStep: number,
): TriSegRootDiagnosticsV1 {
  return Object.freeze({
    iterations,
    acceptedLineSearchSteps,
    lineSearchBacktracks,
    finalScaledResidualInfinityNorm,
    finalScaledUpdateInfinityNorm,
    finiteDifferenceScaledStep,
  });
}

function resolveOptions(
  options: TriSegRootOptionsV1 | undefined,
): Required<TriSegRootOptionsV1> {
  const result = { ...DEFAULT_OPTIONS, ...options };
  if (!Number.isInteger(result.maxIterations) || result.maxIterations <= 0) {
    throw new Error("maxIterations must be a positive integer");
  }
  if (!Number.isInteger(result.maxLineSearchBacktracks)
    || result.maxLineSearchBacktracks <= 0) {
    throw new Error("maxLineSearchBacktracks must be a positive integer");
  }
  requirePositive(
    result.scaledResidualInfinityTolerance,
    "scaledResidualInfinityTolerance",
  );
  requirePositive(
    result.scaledUpdateInfinityTolerance,
    "scaledUpdateInfinityTolerance",
  );
  requirePositive(result.finiteDifferenceScaledStep, "finiteDifferenceScaledStep");
  requirePositive(
    result.potentialSymmetryRelativeTolerance,
    "potentialSymmetryRelativeTolerance",
  );
  return Object.freeze(result);
}

function validateInput(input: EnergyConjugateTriSegRootInputV1): void {
  requirePositive(input.leftVentricularCavityVolumeM3, "LV cavity volume");
  requirePositive(input.rightVentricularCavityVolumeM3, "RV cavity volume");
  requireFinite(
    input.initialCoordinates.septalMidwallCapVolumeM3,
    "initial septal cap volume",
  );
  requirePositive(input.initialCoordinates.junctionRadiusM, "initial radius");
  requirePositive(
    input.unknownScales.septalMidwallCapVolumeM3,
    "septal cap-volume scale",
  );
  requirePositive(input.unknownScales.junctionRadiusM, "junction-radius scale");
  requirePositive(input.equilibriumResidualScaleNPerM, "residual scale");
  requirePositive(input.junctionRadiusLowerBoundM, "radius lower bound");
  if (typeof input.evaluateWallStress !== "function") {
    throw new Error("evaluateWallStress must be a function");
  }
}

function validateWallStress(stress: TriSegWallRecordV1<number>): void {
  if (stress === null || typeof stress !== "object" || Array.isArray(stress)) {
    throw new Error("wall stress must be a wall record");
  }
  const keys = Object.keys(stress).sort();
  const expected = [...TRISEG_WALL_IDS_V1].sort();
  if (keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])) {
    throw new Error("wall stress must contain exactly LVFW, SEP, and RVFW");
  }
  for (const wallId of TRISEG_WALL_IDS_V1) {
    requireFinite(stress[wallId], `${wallId} stress`);
  }
}

function coordinatesToScaled(
  coordinates: TriSegCoordinatesV1,
  scales: TriSegCoordinatesV1,
): Vector2 {
  return [
    coordinates.septalMidwallCapVolumeM3
      / scales.septalMidwallCapVolumeM3,
    coordinates.junctionRadiusM / scales.junctionRadiusM,
  ];
}

function scaledToCoordinates(
  scaled: Vector2,
  scales: TriSegCoordinatesV1,
): TriSegCoordinatesV1 {
  const coordinates = {
    septalMidwallCapVolumeM3:
      scaled[0] * scales.septalMidwallCapVolumeM3,
    junctionRadiusM: scaled[1] * scales.junctionRadiusM,
  } as const;
  requireFinite(
    coordinates.septalMidwallCapVolumeM3,
    "septal midwall cap volume",
  );
  requirePositive(coordinates.junctionRadiusM, "junction radius");
  return Object.freeze(coordinates);
}

function shifted(center: Vector2, coordinate: number, delta: number): Vector2 {
  return coordinate === 0
    ? [center[0] + delta, center[1]]
    : [center[0], center[1] + delta];
}

function tryEvaluate(
  evaluate: (point: Vector2) => Vector2,
  point: Vector2,
): Vector2 | null {
  try {
    const result = evaluate(point);
    return result.every(Number.isFinite) ? result : null;
  } catch {
    return null;
  }
}

function infinityNorm(vector: Vector2): number {
  return Math.max(Math.abs(vector[0]), Math.abs(vector[1]));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be positive and finite`);
  }
  return value;
}
