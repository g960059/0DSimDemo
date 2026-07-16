import {
  diagnoseScaledJacobian2x2V1,
  solveScaledDampedNewtonV1,
  type ScaledDampedNewtonDiagnosticsV1,
  type ScaledDampedNewtonFailureReasonV1,
  type ScaledJacobian2x2DiagnosticsV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  evaluateScaledFivePointAlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledFivePointAlgorithmicJacobianV1";
import {
  evaluateEnergyConjugateFiniteThicknessTriSegV2,
  type EnergyConjugateFiniteThicknessTriSegV2,
  type FiniteThicknessTriSegBendingPriorV2,
} from "@/engine/myocardium/fourChamberV1/triseg/energyConjugateFiniteThicknessTriSegV2";
import {
  evaluatePublishedTriSegGeometryV1,
  type PublishedTriSegGeometryV1,
  type PublishedTriSegWallGeometryParametersV1,
  type PublishedTriSegWallIdV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";

export const ENERGY_CONJUGATE_FINITE_THICKNESS_TRISEG_ROOT_V2_ID =
  "energy-conjugate-finite-thickness-triseg-root-v2" as const;

const WALL_IDS = Object.freeze(["LVFW", "SEP", "RVFW"] as const);
type WallRecord<T> = Readonly<Record<PublishedTriSegWallIdV1, T>>;

export type EnergyConjugateTriSegCoordinatesV2 = Readonly<{
  septalMidwallCapVolumeM3: number;
  junctionRadiusM: number;
}>;

export type EnergyConjugateTriSegRootInputV2 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  walls: WallRecord<PublishedTriSegWallGeometryParametersV1>;
  bendingPrior: FiniteThicknessTriSegBendingPriorV2;
  initialCoordinates: EnergyConjugateTriSegCoordinatesV2;
  evaluateWallStress: (geometry: PublishedTriSegGeometryV1) => WallRecord<number>;
  unknownScales: EnergyConjugateTriSegCoordinatesV2;
  equilibriumResidualScaleNPerM: number;
  junctionRadiusLowerBoundM: number;
  algorithmicJacobianScaledStep: number;
}>;

export type EnergyConjugateTriSegPotentialStabilityV2 = Readonly<{
  coordinateConvention:
    "x=[V_m_S/V_scale,y_m/y_scale];H_x=d2Pi/dx2-in-joules";
  scaledPotentialHessianJ: readonly [
    readonly [number, number],
    readonly [number, number],
  ];
  antisymmetricPartMaximumAbsoluteJ: number;
  antisymmetricPartRelativeToHessianInfinityNorm: number;
  minimumEigenvalueJ: number;
  maximumEigenvalueJ: number;
  positiveDefinite: boolean;
  classification: "strict-local-potential-minimum" | "not-a-strict-local-minimum";
}>;

type RootEvaluation = Readonly<{
  geometry: PublishedTriSegGeometryV1;
  fiberKirchhoffStressPaByWall: WallRecord<number>;
  mechanics: EnergyConjugateFiniteThicknessTriSegV2;
  residual: readonly [number, number];
}>;

export type EnergyConjugateTriSegRootSuccessV2 = Readonly<{
  converged: true;
  rootId: typeof ENERGY_CONJUGATE_FINITE_THICKNESS_TRISEG_ROOT_V2_ID;
  coordinates: EnergyConjugateTriSegCoordinatesV2;
  geometry: PublishedTriSegGeometryV1;
  fiberKirchhoffStressPaByWall: WallRecord<number>;
  mechanics: EnergyConjugateFiniteThicknessTriSegV2;
  potentialStability: EnergyConjugateTriSegPotentialStabilityV2;
  scaledJacobianDiagnostics: ScaledJacobian2x2DiagnosticsV1;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  scaledResidualInfinityNorm: number;
  runtimeMechanicsReplayed: true;
  publishedTaylorUsedForRoot: false;
}>;

export type EnergyConjugateTriSegRootFailureV2 = Readonly<{
  converged: false;
  rootId: typeof ENERGY_CONJUGATE_FINITE_THICKNESS_TRISEG_ROOT_V2_ID;
  reason: ScaledDampedNewtonFailureReasonV1 | "final-evaluation-failed";
  message: string;
  rollbackCoordinates: EnergyConjugateTriSegCoordinatesV2;
  lastAcceptedCoordinates: EnergyConjugateTriSegCoordinatesV2;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  runtimeMechanicsReplayed: true;
  publishedTaylorUsedForRoot: false;
}>;

export type EnergyConjugateTriSegRootResultV2 =
  | EnergyConjugateTriSegRootSuccessV2
  | EnergyConjugateTriSegRootFailureV2;

export type EnergyConjugateTriSegStableMultiStartAuditV2 = Readonly<{
  auditId: "energy-conjugate-finite-thickness-triseg-stable-multistart-v2";
  results: readonly EnergyConjugateTriSegRootResultV2[];
  allSeedsConvergedToStationaryPoints: boolean;
  strictLocalMinimumCount: number;
  nonMinimumStationaryPointCount: number;
  stableRootsSameBranchWithinTolerance: boolean;
  maximumStablePairwiseScaledCoordinateDistance: number | null;
  scaledCoordinateTolerance: number;
  selectedStableRoot: EnergyConjugateTriSegRootSuccessV2;
  selectionRule:
    "discard-non-minimum-stationary-points-then-require-one-stable-coordinate-cluster";
  minimumResidualStationaryPointSelectionApplied: false;
  accepted: boolean;
}>;

/**
 * Solves the two internal TriSeg shape coordinates with the exact same
 * finite-thickness energy derivatives that own pressure and equilibrium in
 * the mechanistic runtime.  The published Taylor oracle is deliberately not
 * called on this path.
 */
export function solveEnergyConjugateFiniteThicknessTriSegRootV2(
  input: EnergyConjugateTriSegRootInputV2,
): EnergyConjugateTriSegRootResultV2 {
  validateInput(input);
  const unknownScales = coordinatesToVector(input.unknownScales);
  const residualScales = [
    input.equilibriumResidualScaleNPerM,
    input.equilibriumResidualScaleNPerM,
  ] as const;
  const lowerBounds = [null, input.junctionRadiusLowerBoundM] as const;
  const evaluateAt = (unknowns: readonly number[]): RootEvaluation => {
    const coordinates = vectorToCoordinates(unknowns);
    if (!(coordinates.junctionRadiusM > input.junctionRadiusLowerBoundM)) {
      throw new Error("junction radius left the strict admissible domain");
    }
    const geometry = evaluatePublishedTriSegGeometryV1({
      leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
      septalMidwallCapVolumeM3: coordinates.septalMidwallCapVolumeM3,
      junctionRadiusM: coordinates.junctionRadiusM,
      walls: input.walls,
    });
    const fiberKirchhoffStressPaByWall = input.evaluateWallStress(geometry);
    assertWallStress(fiberKirchhoffStressPaByWall);
    const mechanics = evaluateEnergyConjugateFiniteThicknessTriSegV2({
      geometry,
      fiberKirchhoffStressPaByWall,
      bendingPrior: input.bendingPrior,
    });
    return Object.freeze({
      geometry,
      fiberKirchhoffStressPaByWall,
      mechanics,
      residual: Object.freeze([
        mechanics.equilibriumResidual.axialNPerM,
        mechanics.equilibriumResidual.radialNPerM,
      ]) as readonly [number, number],
    });
  };
  const residualOnly = (unknowns: readonly number[]) =>
    evaluateAt(unknowns).residual;
  const newton = solveScaledDampedNewtonV1({
    initialUnknowns: coordinatesToVector(input.initialCoordinates),
    unknownScales,
    residualScales,
    strictLowerBounds: lowerBounds,
    options: {
      maxIterations: 48,
      residualInfinityTolerance: 1e-9,
      updateInfinityTolerance: 1e-9,
    },
    evaluate: (unknowns) => {
      try {
        const evaluation = evaluateAt(unknowns);
        const jacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
          residualOnly,
          unknowns,
          {
            unknownScales,
            residualScales,
            lowerBounds,
            scaledStep: input.algorithmicJacobianScaledStep,
          },
        );
        return {
          status: "ok" as const,
          residual: evaluation.residual,
          jacobianRowMajor: flatten2x2(jacobian.rawJacobian),
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
      converged: false as const,
      rootId: ENERGY_CONJUGATE_FINITE_THICKNESS_TRISEG_ROOT_V2_ID,
      reason: newton.reason,
      message: newton.message,
      rollbackCoordinates: vectorToCoordinates(newton.unknowns),
      lastAcceptedCoordinates: vectorToCoordinates(newton.lastAcceptedUnknowns),
      newtonDiagnostics: newton.diagnostics,
      runtimeMechanicsReplayed: true as const,
      publishedTaylorUsedForRoot: false as const,
    });
  }
  try {
    const finalEvaluation = evaluateAt(newton.unknowns);
    const finalJacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
      residualOnly,
      newton.unknowns,
      {
        unknownScales,
        residualScales,
        lowerBounds,
        scaledStep: input.algorithmicJacobianScaledStep,
      },
    );
    return Object.freeze({
      converged: true as const,
      rootId: ENERGY_CONJUGATE_FINITE_THICKNESS_TRISEG_ROOT_V2_ID,
      coordinates: vectorToCoordinates(newton.unknowns),
      geometry: finalEvaluation.geometry,
      fiberKirchhoffStressPaByWall:
        finalEvaluation.fiberKirchhoffStressPaByWall,
      mechanics: finalEvaluation.mechanics,
      potentialStability: evaluatePotentialStability(
        input,
        newton.unknowns,
        finalEvaluation,
      ),
      scaledJacobianDiagnostics: diagnoseScaledJacobian2x2V1(
        flatten2x2(finalJacobian.scaledJacobian),
      ),
      newtonDiagnostics: newton.diagnostics,
      scaledResidualInfinityNorm:
        newton.diagnostics.finalResidualInfinityNorm
        ?? Number.POSITIVE_INFINITY,
      runtimeMechanicsReplayed: true as const,
      publishedTaylorUsedForRoot: false as const,
    });
  } catch (error) {
    return Object.freeze({
      converged: false as const,
      rootId: ENERGY_CONJUGATE_FINITE_THICKNESS_TRISEG_ROOT_V2_ID,
      reason: "final-evaluation-failed" as const,
      message: error instanceof Error ? error.message : String(error),
      rollbackCoordinates: input.initialCoordinates,
      lastAcceptedCoordinates: vectorToCoordinates(newton.unknowns),
      newtonDiagnostics: newton.diagnostics,
      runtimeMechanicsReplayed: true as const,
      publishedTaylorUsedForRoot: false as const,
    });
  }
}

/**
 * Newton can correctly find both minima and saddles because both satisfy the
 * two force-balance equations.  Physical quasi-static shape selection must
 * therefore use the energy Hessian, not the smallest force residual.  This
 * audit retains every stationary point for evidence, discards non-minima, and
 * requires all surviving minima to form one scaled-coordinate cluster.
 */
export function auditStableEnergyConjugateFiniteThicknessTriSegMultiStartV2(
  input: Omit<EnergyConjugateTriSegRootInputV2, "initialCoordinates">,
  seeds: readonly EnergyConjugateTriSegCoordinatesV2[],
  scaledCoordinateTolerance = 1e-7,
): EnergyConjugateTriSegStableMultiStartAuditV2 {
  if (!Array.isArray(seeds) || seeds.length < 2) {
    throw new Error("stable TriSeg multi-start audit requires at least two seeds");
  }
  requirePositiveFinite(scaledCoordinateTolerance, "scaled coordinate tolerance");
  const results = Object.freeze(seeds.map((initialCoordinates) =>
    solveEnergyConjugateFiniteThicknessTriSegRootV2({
      ...input,
      initialCoordinates,
    })));
  const converged = results.filter(
    (result): result is EnergyConjugateTriSegRootSuccessV2 => result.converged,
  );
  const stable = converged.filter((result) =>
    result.potentialStability.positiveDefinite);
  if (stable.length === 0) {
    throw new Error("TriSeg multi-start found no strict local potential minimum");
  }
  let maximumStablePairwiseScaledCoordinateDistance = 0;
  for (let left = 0; left < stable.length; left += 1) {
    for (let right = left + 1; right < stable.length; right += 1) {
      maximumStablePairwiseScaledCoordinateDistance = Math.max(
        maximumStablePairwiseScaledCoordinateDistance,
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
  const stableRootsSameBranchWithinTolerance =
    stable.length >= 2
    && maximumStablePairwiseScaledCoordinateDistance <= scaledCoordinateTolerance;
  const allSeedsConvergedToStationaryPoints = converged.length === results.length;
  const accepted = allSeedsConvergedToStationaryPoints
    && stableRootsSameBranchWithinTolerance;
  return Object.freeze({
    auditId:
      "energy-conjugate-finite-thickness-triseg-stable-multistart-v2" as const,
    results,
    allSeedsConvergedToStationaryPoints,
    strictLocalMinimumCount: stable.length,
    nonMinimumStationaryPointCount: converged.length - stable.length,
    stableRootsSameBranchWithinTolerance,
    maximumStablePairwiseScaledCoordinateDistance,
    scaledCoordinateTolerance,
    selectedStableRoot: stable[0],
    selectionRule:
      "discard-non-minimum-stationary-points-then-require-one-stable-coordinate-cluster" as const,
    minimumResidualStationaryPointSelectionApplied: false as const,
    accepted,
  });
}

function evaluatePotentialStability(
  input: EnergyConjugateTriSegRootInputV2,
  unknowns: readonly number[],
  evaluation: RootEvaluation,
): EnergyConjugateTriSegPotentialStabilityV2 {
  const unknownScales = coordinatesToVector(input.unknownScales);
  const y = evaluation.geometry.junctionRadiusM;
  const potentialGradient = (trial: readonly number[]) => {
    const coordinates = vectorToCoordinates(trial);
    const geometry = evaluatePublishedTriSegGeometryV1({
      leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
      septalMidwallCapVolumeM3: coordinates.septalMidwallCapVolumeM3,
      junctionRadiusM: coordinates.junctionRadiusM,
      walls: input.walls,
    });
    const mechanics = evaluateEnergyConjugateFiniteThicknessTriSegV2({
      geometry,
      fiberKirchhoffStressPaByWall: input.evaluateWallStress(geometry),
      bendingPrior: input.bendingPrior,
    });
    return [
      mechanics.totalGeneralizedForce.septalMidwallCapVolumePa,
      mechanics.totalGeneralizedForce.junctionRadiusN,
    ] as const;
  };
  const gradientScales = [
    2 * input.equilibriumResidualScaleNPerM / y,
    2 * Math.PI * y * input.equilibriumResidualScaleNPerM,
  ] as const;
  const jacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
    potentialGradient,
    unknowns,
    {
      unknownScales,
      residualScales: gradientScales,
      lowerBounds: [null, input.junctionRadiusLowerBoundM],
      scaledStep: input.algorithmicJacobianScaledStep,
    },
  ).rawJacobian;
  const h00 = jacobian[0][0] * unknownScales[0] * unknownScales[0];
  const h01Raw = jacobian[0][1] * unknownScales[0] * unknownScales[1];
  const h10Raw = jacobian[1][0] * unknownScales[1] * unknownScales[0];
  const h11 = jacobian[1][1] * unknownScales[1] * unknownScales[1];
  const h01 = 0.5 * (h01Raw + h10Raw);
  const antisymmetricPartMaximumAbsoluteJ = 0.5 * Math.abs(h01Raw - h10Raw);
  const hessianInfinityNorm = Math.max(
    Math.abs(h00) + Math.abs(h01),
    Math.abs(h01) + Math.abs(h11),
    Number.MIN_VALUE,
  );
  const trace = h00 + h11;
  const discriminant = Math.hypot(h00 - h11, 2 * h01);
  const minimumEigenvalueJ = 0.5 * (trace - discriminant);
  const maximumEigenvalueJ = 0.5 * (trace + discriminant);
  const positiveDefinite = minimumEigenvalueJ > Math.max(
    1e-12,
    1e-10 * Math.abs(maximumEigenvalueJ),
  );
  return Object.freeze({
    coordinateConvention:
      "x=[V_m_S/V_scale,y_m/y_scale];H_x=d2Pi/dx2-in-joules" as const,
    scaledPotentialHessianJ: Object.freeze([
      Object.freeze([h00, h01]),
      Object.freeze([h01, h11]),
    ]) as readonly [readonly [number, number], readonly [number, number]],
    antisymmetricPartMaximumAbsoluteJ,
    antisymmetricPartRelativeToHessianInfinityNorm:
      antisymmetricPartMaximumAbsoluteJ / hessianInfinityNorm,
    minimumEigenvalueJ,
    maximumEigenvalueJ,
    positiveDefinite,
    classification: positiveDefinite
      ? "strict-local-potential-minimum" as const
      : "not-a-strict-local-minimum" as const,
  });
}

function validateInput(input: EnergyConjugateTriSegRootInputV2): void {
  requirePositiveFinite(input.leftVentricularCavityVolumeM3, "LV volume");
  requirePositiveFinite(input.rightVentricularCavityVolumeM3, "RV volume");
  requireFinite(
    input.initialCoordinates.septalMidwallCapVolumeM3,
    "initial septal cap volume",
  );
  requirePositiveFinite(
    input.initialCoordinates.junctionRadiusM,
    "initial junction radius",
  );
  requirePositiveFinite(
    input.unknownScales.septalMidwallCapVolumeM3,
    "septal cap-volume scale",
  );
  requirePositiveFinite(input.unknownScales.junctionRadiusM, "radius scale");
  requirePositiveFinite(
    input.equilibriumResidualScaleNPerM,
    "equilibrium residual scale",
  );
  requirePositiveFinite(
    input.algorithmicJacobianScaledStep,
    "algorithmic Jacobian step",
  );
  requirePositiveFinite(input.junctionRadiusLowerBoundM, "radius lower bound");
  if (typeof input.evaluateWallStress !== "function") {
    throw new Error("evaluateWallStress must be a function");
  }
}

function assertWallStress(value: WallRecord<number>): void {
  for (const wallId of WALL_IDS) {
    requireFinite(value[wallId], `${wallId} stress`);
  }
}

function coordinatesToVector(
  coordinates: EnergyConjugateTriSegCoordinatesV2,
): readonly [number, number] {
  return [coordinates.septalMidwallCapVolumeM3, coordinates.junctionRadiusM];
}

function vectorToCoordinates(
  vector: readonly number[],
): EnergyConjugateTriSegCoordinatesV2 {
  if (vector.length !== 2) throw new Error("TriSeg shape vector must have length two");
  return Object.freeze({
    septalMidwallCapVolumeM3: requireFinite(vector[0], "septal cap volume"),
    junctionRadiusM: requirePositiveFinite(vector[1], "junction radius"),
  });
}

function flatten2x2(matrix: readonly (readonly number[])[]): readonly number[] {
  if (matrix.length !== 2 || matrix.some((row) => row.length !== 2)) {
    throw new Error("expected a 2x2 matrix");
  }
  return Object.freeze([matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1]]);
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and positive`);
  }
  return value;
}
