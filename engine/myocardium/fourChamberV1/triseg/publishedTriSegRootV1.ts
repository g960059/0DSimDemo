import {
  SCALED_DAMPED_NEWTON_V1_DEFAULTS,
  diagnoseScaledJacobian2x2V1,
  solveScaledDampedNewtonV1,
  type ScaledDampedNewtonDiagnosticsV1,
  type ScaledDampedNewtonFailureReasonV1,
  type ScaledDampedNewtonOptionsV1,
  type ScaledJacobian2x2DiagnosticsV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  evaluatePublishedTriSegGeometryV1,
  type PublishedTriSegGeometryV1,
  type PublishedTriSegWallGeometryParametersV1,
  type PublishedTriSegWallIdV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  evaluatePublishedTriSegTaylorOracle2009V1,
  type PublishedTriSegTaylorOracle2009V1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";

export const PUBLISHED_TRISEG_ROOT_V1_ID =
  "published-taylor-triseg-scaled-root-v1" as const;
export const PUBLISHED_TRISEG_MULTI_START_AUDIT_V1_ID =
  "published-triseg-multi-start-audit-v1" as const;
export const PUBLISHED_TRISEG_CONTINUATION_AUDIT_V1_ID =
  "published-triseg-continuation-audit-v1" as const;

export type PublishedTriSegCoordinatesV1 = Readonly<{
  septalMidwallCapVolumeM3: number;
  junctionRadiusM: number;
}>;

export type PublishedTriSegWallStressEvaluationV1 = Readonly<{
  fiberKirchhoffStressPa: Readonly<Record<PublishedTriSegWallIdV1, number>>;
  diagnostic?: unknown;
}>;

export type PublishedTriSegWallStressEvaluatorV1 = (
  geometry: PublishedTriSegGeometryV1,
) => PublishedTriSegWallStressEvaluationV1;

export type PublishedTriSegRootInputV1 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  walls: Readonly<
    Record<PublishedTriSegWallIdV1, PublishedTriSegWallGeometryParametersV1>
  >;
  initialCoordinates: PublishedTriSegCoordinatesV1;
  evaluateWallStress: PublishedTriSegWallStressEvaluatorV1;
  unknownScales: PublishedTriSegCoordinatesV1;
  equilibriumResidualScaleNPerM: number;
  junctionRadiusLowerBoundM: number;
  algorithmicJacobianScaledStep: number;
}>;

export type PublishedTriSegRootSuccessV1<
  RootId extends string = typeof PUBLISHED_TRISEG_ROOT_V1_ID,
> = Readonly<{
  converged: true;
  rootId: RootId;
  algorithmicJacobianId?: string;
  coordinates: PublishedTriSegCoordinatesV1;
  geometry: PublishedTriSegGeometryV1;
  wallStress: PublishedTriSegWallStressEvaluationV1;
  oracle: PublishedTriSegTaylorOracle2009V1;
  scaledJacobianDiagnostics: ScaledJacobian2x2DiagnosticsV1;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  scaledResidualInfinityNorm: number;
  scaledUpdateInfinityNorm: number;
  conditioningThresholdStatus: "record-only-threshold-unresolved";
  previousRootUse: "initial-guess-only";
  forcedSeptalTargetApplied: false;
  fallbackApplied: false;
  acceptedAsPhysiologicalRoot: false;
}>;

export type PublishedTriSegRootFailureV1<
  RootId extends string = typeof PUBLISHED_TRISEG_ROOT_V1_ID,
> = Readonly<{
  converged: false;
  rootId: RootId;
  algorithmicJacobianId?: string;
  reason: ScaledDampedNewtonFailureReasonV1 | "final-evaluation-failed";
  message: string;
  rollbackCoordinates: PublishedTriSegCoordinatesV1;
  lastAcceptedCoordinates: PublishedTriSegCoordinatesV1;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  previousRootUse: "initial-guess-only";
  forcedSeptalTargetApplied: false;
  fallbackApplied: false;
}>;

export type PublishedTriSegRootResultV1<
  RootId extends string = typeof PUBLISHED_TRISEG_ROOT_V1_ID,
> = PublishedTriSegRootSuccessV1<RootId> | PublishedTriSegRootFailureV1<RootId>;

export type PublishedTriSegMultiStartAuditV1<
  RootId extends string = typeof PUBLISHED_TRISEG_ROOT_V1_ID,
  AuditId extends string = typeof PUBLISHED_TRISEG_MULTI_START_AUDIT_V1_ID,
> = Readonly<{
  auditId: AuditId;
  results: readonly PublishedTriSegRootResultV1<RootId>[];
  allConverged: boolean;
  sameBranchWithinTolerance: boolean;
  maximumPairwiseScaledCoordinateDistance: number | null;
  scaledCoordinateDistanceNorm: "scaled-infinity-norm";
  scaledCoordinateTolerance: number;
  accepted: boolean;
  minimumResidualRootSelectionApplied: false;
}>;

export type PublishedTriSegContinuationPointV1 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
}>;

export type PublishedTriSegContinuationAuditV1<
  RootId extends string = typeof PUBLISHED_TRISEG_ROOT_V1_ID,
  AuditId extends string = typeof PUBLISHED_TRISEG_CONTINUATION_AUDIT_V1_ID,
> = Readonly<{
  auditId: AuditId;
  results: readonly PublishedTriSegRootResultV1<RootId>[];
  allConverged: boolean;
  initialAnchorScaledDistance: number | null;
  maximumScaledStepDistance: number | null;
  scaledCoordinateDistanceNorm: "scaled-infinity-norm";
  branchContinuityThreshold: number;
  sampledStepDistanceWithinThreshold: boolean;
  continuousIntervalRegularityClaimed: false;
  accepted: boolean;
  previousRootUse: "initial-guess-only";
}>;

export type PublishedTriSegResidualEvaluationV1 = Readonly<{
  geometry: PublishedTriSegGeometryV1;
  wallStress: PublishedTriSegWallStressEvaluationV1;
  oracle: PublishedTriSegTaylorOracle2009V1;
  residual: readonly [number, number];
}>;

export type PublishedTriSegResidualInputV1 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  coordinates: PublishedTriSegCoordinatesV1;
  walls: Readonly<
    Record<PublishedTriSegWallIdV1, PublishedTriSegWallGeometryParametersV1>
  >;
  evaluateWallStress: PublishedTriSegWallStressEvaluatorV1;
}>;

export type PublishedTriSegAlgorithmicJacobianOptionsV1 = Readonly<{
  unknownScales: readonly number[];
  residualScales: readonly number[];
  lowerBounds: readonly (number | null)[];
  scaledStep: number;
}>;

export type PublishedTriSegAlgorithmicJacobianV1 = Readonly<{
  rawJacobian: readonly (readonly number[])[];
  scaledJacobian: readonly (readonly number[])[];
}>;

export type PublishedTriSegAlgorithmicJacobianEvaluatorV1 = (
  evaluateResidual: (unknowns: readonly number[]) => readonly number[],
  unknowns: readonly number[],
  options: PublishedTriSegAlgorithmicJacobianOptionsV1,
) => PublishedTriSegAlgorithmicJacobianV1;

export type PublishedTriSegRootNewtonOptionsV1 = Required<
  Pick<
    ScaledDampedNewtonOptionsV1,
    | "maxIterations"
    | "residualInfinityTolerance"
    | "updateInfinityTolerance"
    | "armijoCoefficient"
    | "lineSearchContraction"
    | "maxLineSearchBacktracks"
    | "minimumStepLength"
    | "fractionToBoundarySafety"
    | "relativePivotTolerance"
  >
>;

export type PublishedTriSegRootApiConfigurationV1<
  RootId extends string,
  MultiStartAuditId extends string,
  ContinuationAuditId extends string,
> = Readonly<{
  rootId: RootId;
  multiStartAuditId: MultiStartAuditId;
  continuationAuditId: ContinuationAuditId;
  newtonOptions: PublishedTriSegRootNewtonOptionsV1;
  algorithmicJacobianId?: string;
  evaluateAlgorithmicJacobian?: PublishedTriSegAlgorithmicJacobianEvaluatorV1;
}>;

export type PublishedTriSegRootApiV1<
  RootId extends string,
  MultiStartAuditId extends string,
  ContinuationAuditId extends string,
> = Readonly<{
  evaluateResidual: (
    input: PublishedTriSegResidualInputV1,
  ) => PublishedTriSegResidualEvaluationV1;
  solve: (
    input: PublishedTriSegRootInputV1,
  ) => PublishedTriSegRootResultV1<RootId>;
  auditMultiStart: (
    input: Omit<PublishedTriSegRootInputV1, "initialCoordinates">,
    initialCoordinates: readonly PublishedTriSegCoordinatesV1[],
    scaledCoordinateTolerance?: number,
  ) => PublishedTriSegMultiStartAuditV1<RootId, MultiStartAuditId>;
  auditContinuation: (
    input: Omit<
      PublishedTriSegRootInputV1,
      | "leftVentricularCavityVolumeM3"
      | "rightVentricularCavityVolumeM3"
      | "initialCoordinates"
    >,
    path: readonly PublishedTriSegContinuationPointV1[],
    initialCoordinates: PublishedTriSegCoordinatesV1,
    branchContinuityThreshold: number,
  ) => PublishedTriSegContinuationAuditV1<RootId, ContinuationAuditId>;
}>;

export const PUBLISHED_TRISEG_ROOT_DEFAULT_NEWTON_OPTIONS_V1: PublishedTriSegRootNewtonOptionsV1 =
  Object.freeze({
    maxIterations: SCALED_DAMPED_NEWTON_V1_DEFAULTS.maxIterations,
    residualInfinityTolerance:
      SCALED_DAMPED_NEWTON_V1_DEFAULTS.residualInfinityTolerance,
    updateInfinityTolerance:
      SCALED_DAMPED_NEWTON_V1_DEFAULTS.updateInfinityTolerance,
    armijoCoefficient: SCALED_DAMPED_NEWTON_V1_DEFAULTS.armijoCoefficient,
    lineSearchContraction:
      SCALED_DAMPED_NEWTON_V1_DEFAULTS.lineSearchContraction,
    maxLineSearchBacktracks:
      SCALED_DAMPED_NEWTON_V1_DEFAULTS.maxLineSearchBacktracks,
    minimumStepLength: SCALED_DAMPED_NEWTON_V1_DEFAULTS.minimumStepLength,
    fractionToBoundarySafety:
      SCALED_DAMPED_NEWTON_V1_DEFAULTS.fractionToBoundarySafety,
    relativePivotTolerance:
      SCALED_DAMPED_NEWTON_V1_DEFAULTS.relativePivotTolerance,
  });

export function createPublishedTriSegRootApiV1<
  const RootId extends string,
  const MultiStartAuditId extends string,
  const ContinuationAuditId extends string,
>(
  configuration: PublishedTriSegRootApiConfigurationV1<
    RootId,
    MultiStartAuditId,
    ContinuationAuditId
  >,
): PublishedTriSegRootApiV1<RootId, MultiStartAuditId, ContinuationAuditId> {
  validateConfiguration(configuration);
  const evaluateAlgorithmicJacobian =
    configuration.evaluateAlgorithmicJacobian ??
    evaluatePublishedTriSegFivePointJacobianV1;
  const algorithmicJacobianIdentity = configuration.algorithmicJacobianId === undefined
    ? Object.freeze({})
    : Object.freeze({
      algorithmicJacobianId: configuration.algorithmicJacobianId,
    });

  const evaluateResidual = (
    input: PublishedTriSegResidualInputV1,
  ): PublishedTriSegResidualEvaluationV1 => {
    requireNonNegativeFinite(
      input.leftVentricularCavityVolumeM3,
      "leftVentricularCavityVolumeM3",
    );
    requireNonNegativeFinite(
      input.rightVentricularCavityVolumeM3,
      "rightVentricularCavityVolumeM3",
    );
    requireFinite(
      input.coordinates.septalMidwallCapVolumeM3,
      "septalMidwallCapVolumeM3",
    );
    requirePositiveFinite(input.coordinates.junctionRadiusM, "junctionRadiusM");
    const geometry = evaluatePublishedTriSegGeometryV1({
      leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
      septalMidwallCapVolumeM3: input.coordinates.septalMidwallCapVolumeM3,
      junctionRadiusM: input.coordinates.junctionRadiusM,
      walls: input.walls,
    });
    const wallStress = input.evaluateWallStress(geometry);
    validateWallStress(wallStress);
    const oracle = evaluatePublishedTriSegTaylorOracle2009V1(
      geometry,
      wallStress.fiberKirchhoffStressPa,
    );
    return Object.freeze({
      geometry,
      wallStress,
      oracle,
      residual: Object.freeze([
        requireFinite(
          oracle.equilibriumResidual.axialNPerM,
          "TriSeg axial residual",
        ),
        requireFinite(
          oracle.equilibriumResidual.radialNPerM,
          "TriSeg radial residual",
        ),
      ]) as readonly [number, number],
    });
  };

  const solve = (
    input: PublishedTriSegRootInputV1,
  ): PublishedTriSegRootResultV1<RootId> => {
    validateRootInput(input);
    const initial = coordinatesToVector(input.initialCoordinates);
    const unknownScales = coordinatesToVector(input.unknownScales);
    const residualScales = [
      input.equilibriumResidualScaleNPerM,
      input.equilibriumResidualScaleNPerM,
    ] as const;
    const lowerBounds = [null, input.junctionRadiusLowerBoundM] as const;
    const evaluateAt = (
      unknowns: readonly number[],
    ): PublishedTriSegResidualEvaluationV1 => {
      const coordinates = vectorToCoordinates(unknowns);
      if (!(coordinates.junctionRadiusM > input.junctionRadiusLowerBoundM)) {
        throw new Error("junction radius left the strict admissible domain");
      }
      return evaluateResidual({
        leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
        rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
        coordinates,
        walls: input.walls,
        evaluateWallStress: input.evaluateWallStress,
      });
    };
    const residualOnly = (unknowns: readonly number[]) =>
      evaluateAt(unknowns).residual;

    const newton = solveScaledDampedNewtonV1({
      initialUnknowns: initial,
      unknownScales,
      residualScales,
      strictLowerBounds: lowerBounds,
      options: configuration.newtonOptions,
      evaluate: (unknowns) => {
        try {
          const evaluation = evaluateAt(unknowns);
          const jacobian = evaluateAlgorithmicJacobian(residualOnly, unknowns, {
            unknownScales,
            residualScales,
            lowerBounds,
            scaledStep: input.algorithmicJacobianScaledStep,
          });
          return {
            status: "ok" as const,
            residual: evaluation.residual,
            jacobianRowMajor: flattenMatrix(jacobian.rawJacobian),
            diagnostic: Object.freeze({
              wallStressDiagnostic: evaluation.wallStress.diagnostic,
              domainClassification: evaluation.oracle.domainClassification,
            }),
          };
        } catch (error) {
          return {
            status: "inadmissible" as const,
            reason: error instanceof Error ? error.message : String(error),
          };
        }
      },
    });

    if (newton.converged === false) {
      return Object.freeze({
        converged: false,
        rootId: configuration.rootId,
        ...algorithmicJacobianIdentity,
        reason: newton.reason,
        message: newton.message,
        rollbackCoordinates: vectorToCoordinates(newton.unknowns),
        lastAcceptedCoordinates: vectorToCoordinates(
          newton.lastAcceptedUnknowns,
        ),
        newtonDiagnostics: newton.diagnostics,
        previousRootUse: "initial-guess-only",
        forcedSeptalTargetApplied: false,
        fallbackApplied: false,
      });
    }

    try {
      const finalEvaluation = evaluateAt(newton.unknowns);
      const finalJacobian = evaluateAlgorithmicJacobian(
        residualOnly,
        newton.unknowns,
        {
          unknownScales,
          residualScales,
          lowerBounds,
          scaledStep: input.algorithmicJacobianScaledStep,
        },
      );
      const scaledJacobianDiagnostics = diagnoseScaledJacobian2x2V1(
        flattenMatrix(finalJacobian.scaledJacobian),
      );
      return Object.freeze({
        converged: true,
        rootId: configuration.rootId,
        ...algorithmicJacobianIdentity,
        coordinates: vectorToCoordinates(newton.unknowns),
        geometry: finalEvaluation.geometry,
        wallStress: finalEvaluation.wallStress,
        oracle: finalEvaluation.oracle,
        scaledJacobianDiagnostics,
        newtonDiagnostics: newton.diagnostics,
        scaledResidualInfinityNorm:
          newton.diagnostics.finalResidualInfinityNorm ??
          Number.POSITIVE_INFINITY,
        scaledUpdateInfinityNorm: newton.diagnostics.finalUpdateInfinityNorm,
        conditioningThresholdStatus: "record-only-threshold-unresolved",
        previousRootUse: "initial-guess-only",
        forcedSeptalTargetApplied: false,
        fallbackApplied: false,
        acceptedAsPhysiologicalRoot: false,
      });
    } catch (error) {
      return Object.freeze({
        converged: false,
        rootId: configuration.rootId,
        ...algorithmicJacobianIdentity,
        reason: "final-evaluation-failed",
        message: error instanceof Error ? error.message : String(error),
        rollbackCoordinates: input.initialCoordinates,
        lastAcceptedCoordinates: vectorToCoordinates(newton.unknowns),
        newtonDiagnostics: newton.diagnostics,
        previousRootUse: "initial-guess-only",
        forcedSeptalTargetApplied: false,
        fallbackApplied: false,
      });
    }
  };

  const auditMultiStart = (
    input: Omit<PublishedTriSegRootInputV1, "initialCoordinates">,
    initialCoordinates: readonly PublishedTriSegCoordinatesV1[],
    scaledCoordinateTolerance = 1e-8,
  ): PublishedTriSegMultiStartAuditV1<RootId, MultiStartAuditId> => {
    if (!Array.isArray(initialCoordinates) || initialCoordinates.length < 2) {
      throw new Error(
        "TriSeg multi-start audit requires at least two predeclared seeds",
      );
    }
    requirePositiveFinite(
      scaledCoordinateTolerance,
      "scaledCoordinateTolerance",
    );
    const results = Object.freeze(
      initialCoordinates.map((seed) =>
        solve({ ...input, initialCoordinates: seed }),
      ),
    );
    const converged = results.filter(
      (result): result is PublishedTriSegRootSuccessV1<RootId> =>
        result.converged,
    );
    let maximumPairwiseScaledCoordinateDistance: number | null = null;
    if (converged.length === results.length) {
      maximumPairwiseScaledCoordinateDistance = 0;
      for (let left = 0; left < converged.length; left += 1) {
        for (let right = left + 1; right < converged.length; right += 1) {
          maximumPairwiseScaledCoordinateDistance = Math.max(
            maximumPairwiseScaledCoordinateDistance,
            scaledCoordinateDistance(
              converged[left].coordinates,
              converged[right].coordinates,
              input.unknownScales,
            ),
          );
        }
      }
    }
    const allConverged = converged.length === results.length;
    const sameBranchWithinTolerance =
      allConverged &&
      maximumPairwiseScaledCoordinateDistance !== null &&
      maximumPairwiseScaledCoordinateDistance <= scaledCoordinateTolerance;
    return Object.freeze({
      auditId: configuration.multiStartAuditId,
      results,
      allConverged,
      sameBranchWithinTolerance,
      maximumPairwiseScaledCoordinateDistance,
      scaledCoordinateDistanceNorm: "scaled-infinity-norm",
      scaledCoordinateTolerance,
      accepted: allConverged && sameBranchWithinTolerance,
      minimumResidualRootSelectionApplied: false,
    });
  };

  const auditContinuation = (
    input: Omit<
      PublishedTriSegRootInputV1,
      | "leftVentricularCavityVolumeM3"
      | "rightVentricularCavityVolumeM3"
      | "initialCoordinates"
    >,
    path: readonly PublishedTriSegContinuationPointV1[],
    initialCoordinates: PublishedTriSegCoordinatesV1,
    branchContinuityThreshold: number,
  ): PublishedTriSegContinuationAuditV1<RootId, ContinuationAuditId> => {
    if (!Array.isArray(path) || path.length < 2) {
      throw new Error(
        "TriSeg continuation audit requires at least two ordered points",
      );
    }
    requirePositiveFinite(
      branchContinuityThreshold,
      "branchContinuityThreshold",
    );
    const results: PublishedTriSegRootResultV1<RootId>[] = [];
    let seed = initialCoordinates;
    for (const point of path) {
      requireNonNegativeFinite(point.leftVentricularCavityVolumeM3, "path.LV");
      requireNonNegativeFinite(point.rightVentricularCavityVolumeM3, "path.RV");
      const result = solve({
        ...input,
        ...point,
        initialCoordinates: seed,
      });
      results.push(result);
      if (!result.converged) break;
      seed = result.coordinates;
    }
    const allConverged =
      results.length === path.length &&
      results.every((result) => result.converged);
    let initialAnchorScaledDistance: number | null = null;
    let maximumScaledStepDistance: number | null = null;
    if (allConverged) {
      const successful = results as PublishedTriSegRootSuccessV1<RootId>[];
      initialAnchorScaledDistance = scaledCoordinateDistance(
        initialCoordinates,
        successful[0].coordinates,
        input.unknownScales,
      );
      maximumScaledStepDistance = initialAnchorScaledDistance;
      for (let index = 1; index < successful.length; index += 1) {
        maximumScaledStepDistance = Math.max(
          maximumScaledStepDistance,
          scaledCoordinateDistance(
            successful[index - 1].coordinates,
            successful[index].coordinates,
            input.unknownScales,
          ),
        );
      }
    }
    const sampledStepDistanceWithinThreshold =
      allConverged &&
      maximumScaledStepDistance !== null &&
      maximumScaledStepDistance <= branchContinuityThreshold;
    return Object.freeze({
      auditId: configuration.continuationAuditId,
      results: Object.freeze(results),
      allConverged,
      initialAnchorScaledDistance,
      maximumScaledStepDistance,
      scaledCoordinateDistanceNorm: "scaled-infinity-norm",
      branchContinuityThreshold,
      sampledStepDistanceWithinThreshold,
      continuousIntervalRegularityClaimed: false,
      accepted: allConverged && sampledStepDistanceWithinThreshold,
      previousRootUse: "initial-guess-only",
    });
  };

  return Object.freeze({
    evaluateResidual,
    solve,
    auditMultiStart,
    auditContinuation,
  });
}

const DEFAULT_API = createPublishedTriSegRootApiV1({
  rootId: PUBLISHED_TRISEG_ROOT_V1_ID,
  multiStartAuditId: PUBLISHED_TRISEG_MULTI_START_AUDIT_V1_ID,
  continuationAuditId: PUBLISHED_TRISEG_CONTINUATION_AUDIT_V1_ID,
  newtonOptions: PUBLISHED_TRISEG_ROOT_DEFAULT_NEWTON_OPTIONS_V1,
});

export const evaluatePublishedTriSegResidualV1 = DEFAULT_API.evaluateResidual;
export const solvePublishedTriSegRootV1 = DEFAULT_API.solve;
export const auditPublishedTriSegMultiStartV1 = DEFAULT_API.auditMultiStart;
export const auditPublishedTriSegContinuationV1 = DEFAULT_API.auditContinuation;

function evaluatePublishedTriSegFivePointJacobianV1(
  evaluateResidual: (unknowns: readonly number[]) => readonly number[],
  unknowns: readonly number[],
  options: PublishedTriSegAlgorithmicJacobianOptionsV1,
): PublishedTriSegAlgorithmicJacobianV1 {
  const { unknownScales, residualScales, lowerBounds, scaledStep } = options;
  assertVector(unknowns, "unknowns");
  assertPositiveVector(unknownScales, unknowns.length, "unknownScales");
  assertPositiveVector(residualScales, undefined, "residualScales");
  assertLowerBounds(lowerBounds, unknowns.length);
  requirePositiveFinite(scaledStep, "scaledStep");
  const baselineResidual = copyResidual(
    evaluateResidual(unknowns),
    residualScales.length,
  );
  const rawJacobian = Array.from({ length: residualScales.length }, () =>
    Array<number>(unknowns.length).fill(0),
  );
  const scaledJacobian = Array.from({ length: residualScales.length }, () =>
    Array<number>(unknowns.length).fill(0),
  );
  for (let column = 0; column < unknowns.length; column += 1) {
    const step = scaledStep * unknownScales[column];
    const lowerBound = lowerBounds[column];
    const centeredAdmissible =
      lowerBound === null || unknowns[column] - 2 * step > lowerBound;
    const multiples = centeredAdmissible ? [-2, -1, 1, 2] : [1, 2, 3, 4];
    const samples = multiples.map((multiple) =>
      evaluateOffset(
        evaluateResidual,
        unknowns,
        column,
        multiple * step,
        residualScales.length,
      ),
    );
    for (let row = 0; row < residualScales.length; row += 1) {
      const derivative = centeredAdmissible
        ? (samples[0][row] -
            8 * samples[1][row] +
            8 * samples[2][row] -
            samples[3][row]) /
          (12 * step)
        : (-25 * baselineResidual[row] +
            48 * samples[0][row] -
            36 * samples[1][row] +
            16 * samples[2][row] -
            3 * samples[3][row]) /
          (12 * step);
      requireFinite(derivative, `rawJacobian[${row}][${column}]`);
      rawJacobian[row][column] = derivative;
      scaledJacobian[row][column] =
        (derivative * unknownScales[column]) / residualScales[row];
      requireFinite(
        scaledJacobian[row][column],
        `scaledJacobian[${row}][${column}]`,
      );
    }
  }
  return Object.freeze({
    rawJacobian: freezeMatrix(rawJacobian),
    scaledJacobian: freezeMatrix(scaledJacobian),
  });
}

function validateConfiguration(
  configuration: PublishedTriSegRootApiConfigurationV1<string, string, string>,
): void {
  for (const [field, value] of [
    ["rootId", configuration.rootId],
    ["multiStartAuditId", configuration.multiStartAuditId],
    ["continuationAuditId", configuration.continuationAuditId],
  ] as const) {
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`${field} must be a nonempty string`);
    }
  }
  const values = Object.values(configuration.newtonOptions);
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("newtonOptions must contain positive finite values");
  }
  if (
    (configuration.algorithmicJacobianId === undefined)
      !== (configuration.evaluateAlgorithmicJacobian === undefined)
  ) {
    throw new Error(
      "algorithmicJacobianId and evaluateAlgorithmicJacobian must be configured together",
    );
  }
  if (
    configuration.algorithmicJacobianId !== undefined
    && configuration.algorithmicJacobianId.length === 0
  ) {
    throw new Error("algorithmicJacobianId must be a nonempty string");
  }
}

function validateRootInput(input: PublishedTriSegRootInputV1): void {
  requireNonNegativeFinite(
    input.leftVentricularCavityVolumeM3,
    "leftVentricularCavityVolumeM3",
  );
  requireNonNegativeFinite(
    input.rightVentricularCavityVolumeM3,
    "rightVentricularCavityVolumeM3",
  );
  requireFinite(
    input.initialCoordinates.septalMidwallCapVolumeM3,
    "initial septal volume",
  );
  requirePositiveFinite(
    input.initialCoordinates.junctionRadiusM,
    "initial junction radius",
  );
  requirePositiveFinite(
    input.unknownScales.septalMidwallCapVolumeM3,
    "septal scale",
  );
  requirePositiveFinite(input.unknownScales.junctionRadiusM, "junction scale");
  requirePositiveFinite(
    input.equilibriumResidualScaleNPerM,
    "equilibriumResidualScaleNPerM",
  );
  requireNonNegativeFinite(
    input.junctionRadiusLowerBoundM,
    "junctionRadiusLowerBoundM",
  );
  requirePositiveFinite(
    input.algorithmicJacobianScaledStep,
    "algorithmicJacobianScaledStep",
  );
  if (typeof input.evaluateWallStress !== "function") {
    throw new Error("evaluateWallStress must be a function");
  }
}

function validateWallStress(
  evaluation: PublishedTriSegWallStressEvaluationV1,
): void {
  if (evaluation === null || typeof evaluation !== "object") {
    throw new Error("wall stress evaluator must return an object");
  }
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    requireFinite(
      evaluation.fiberKirchhoffStressPa[wallId],
      `fiberKirchhoffStressPa.${wallId}`,
    );
  }
}

function coordinatesToVector(
  coordinates: PublishedTriSegCoordinatesV1,
): readonly [number, number] {
  return Object.freeze([
    coordinates.septalMidwallCapVolumeM3,
    coordinates.junctionRadiusM,
  ]);
}

function vectorToCoordinates(
  values: ArrayLike<number>,
): PublishedTriSegCoordinatesV1 {
  if (values.length !== 2) {
    throw new Error("TriSeg coordinate vector must have length two");
  }
  return Object.freeze({
    septalMidwallCapVolumeM3: requireFinite(
      values[0],
      "septalMidwallCapVolumeM3",
    ),
    junctionRadiusM: requirePositiveFinite(values[1], "junctionRadiusM"),
  });
}

function flattenMatrix(
  matrix: readonly (readonly number[])[],
): readonly number[] {
  if (matrix.length !== 2 || matrix.some((row) => row.length !== 2)) {
    throw new Error("TriSeg Jacobian must be 2x2");
  }
  return Object.freeze([
    matrix[0][0],
    matrix[0][1],
    matrix[1][0],
    matrix[1][1],
  ]);
}

function scaledCoordinateDistance(
  left: PublishedTriSegCoordinatesV1,
  right: PublishedTriSegCoordinatesV1,
  scales: PublishedTriSegCoordinatesV1,
): number {
  return Math.max(
    Math.abs(left.septalMidwallCapVolumeM3 - right.septalMidwallCapVolumeM3) /
      scales.septalMidwallCapVolumeM3,
    Math.abs(left.junctionRadiusM - right.junctionRadiusM) /
      scales.junctionRadiusM,
  );
}

function evaluateOffset(
  evaluateResidual: (unknowns: readonly number[]) => readonly number[],
  unknowns: readonly number[],
  column: number,
  offset: number,
  expectedResidualLength: number,
): readonly number[] {
  const trial = [...unknowns];
  trial[column] += offset;
  return copyResidual(evaluateResidual(trial), expectedResidualLength);
}

function copyResidual(
  values: readonly number[],
  expectedLength: number,
): readonly number[] {
  assertVector(values, "residual");
  if (values.length !== expectedLength) {
    throw new Error(
      `Residual length changed from ${expectedLength} to ${values.length}`,
    );
  }
  return [...values];
}

function assertVector(values: readonly number[], field: string): void {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${field} must be a nonempty dense array`);
  }
  for (let index = 0; index < values.length; index += 1) {
    if (!Object.hasOwn(values, index)) {
      throw new Error(`${field} must not contain holes`);
    }
    requireFinite(values[index], `${field}[${index}]`);
  }
}

function assertPositiveVector(
  values: readonly number[],
  expectedLength: number | undefined,
  field: string,
): void {
  assertVector(values, field);
  if (expectedLength !== undefined && values.length !== expectedLength) {
    throw new Error(`${field} length must equal ${expectedLength}`);
  }
  values.forEach((value, index) =>
    requirePositiveFinite(value, `${field}[${index}]`),
  );
}

function assertLowerBounds(
  values: readonly (number | null)[],
  expectedLength: number,
): void {
  if (!Array.isArray(values) || values.length !== expectedLength) {
    throw new Error(`lowerBounds length must equal ${expectedLength}`);
  }
  values.forEach((value, index) => {
    if (value !== null) requireFinite(value, `lowerBounds[${index}]`);
  });
}

function freezeMatrix(matrix: number[][]): readonly (readonly number[])[] {
  return Object.freeze(matrix.map((row) => Object.freeze(row)));
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
  return value;
}
