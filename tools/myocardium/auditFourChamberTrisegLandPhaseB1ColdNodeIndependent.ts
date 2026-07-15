import {
  evaluateLandLengthStateV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landLengthReferenceV1";
import {
  evaluateExactEventCalciumV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  evaluateFourChamberClosedLoopSameTimeLevelV1,
  type FourChamberClosedLoopSameTimeLevelEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/closedLoopSameTimeLevelV1";
import {
  initializeLand2017IsometricSteadyStateV1,
} from "@/engine/myocardium/fourChamberV1/land/isolatedLandTargetPackV1";
import {
  sourceLand2017StateToRateFreeV1,
  writeRateFreeLand2017RhsV1,
  type RateFreeLand2017StateV1,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import type {
  CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  solveScaledDensePartialPivotLuV1,
  type ScaledDenseLuDiagnosticsV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  evaluateScaledFivePointAlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledFivePointAlgorithmicJacobianV1";
import type {
  StrictAffineConstraintV1,
} from "@/engine/myocardium/fourChamberV1/numerics/strictAffineDomainV1";
import type {
  PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  evaluatePhaseB1WallMaterialStateV1,
  type PhaseB1WallMaterialStateEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import type {
  PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  buildPhaseB1SyntheticClosedLoopScaffoldV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticClosedLoopScaffoldV1";
import type {
  PublishedTriSegTaylorDomainClassificationV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_V1_ID =
  "phase-b1-cold-node-independent-lower-kernel-audit-v1" as const;

/**
 * Audit-only differentiating numerics.  These constants are deliberately
 * owned here instead of imported from the implementation under audit.
 */
export const PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_NUMERICS_V1 = Object.freeze({
  fullColdJacobianScaledStep: 2 ** -18,
  coarseReequilibratedTangentScaledStep: 2 ** -17,
  fineReequilibratedTangentScaledStep: 2 ** -19,
  junctionRadiusLowerBoundM: 1e-6,
  relativePivotTolerance: 64 * Number.EPSILON,
  derivativeDisagreementMultiplier: 10,
  relativeStaticTangentUncertaintyFloor: 1e-6,
} as const);

type Matrix2 = readonly [number, number, number, number];

export type PhaseB1ColdNodeIndependentAuditInputV1 = Readonly<{
  slsMode: PhaseB1SlsModeV1;
  eta: number;
  endpoint: PhaseB1EndpointStateV1;
  unknowns: readonly number[];
  sha256Hex: CanonicalSha256HexProvider;
}>;

export type PhaseB1ColdNodeIndependentAuditResultV1 = Readonly<{
  auditId: typeof PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  eta: number;
  unknownCount: 37 | 32;
  materialUnknownCount: 35 | 30;
  endpointUnknownScaledInfinityDifference: number;
  residual: readonly number[];
  scaledResidualInfinityNorm: number;
  maximumAbsolutePopulationRhsPerSec: number;
  maximumAbsoluteDistortionConstraint: number;
  maximumAbsoluteSlsConstraint: number;
  triSegResidualNPerM: Readonly<{ axial: number; radial: number }>;
  fullColdJacobian: Readonly<{
    dimension: 37 | 32;
    scaledStep: number;
    stencilByColumn: readonly (
      | "centered-five-point"
      | "forward-five-point"
      | "backward-five-point"
    )[];
    maximumAbsoluteScaledEntry: number;
  }>;
  materialSchur: Readonly<{
    scaledGeneralizedForceTangent: Matrix2;
    luDiagnosticsByTriSegCoordinate: readonly [
      ScaledDenseLuDiagnosticsV1,
      ScaledDenseLuDiagnosticsV1,
    ];
    minimumRelativePivot: number;
    maximumPivotGrowthFactor: number;
  }>;
  reequilibrated: Readonly<{
    scaledCoarseGeneralizedForceTangent: Matrix2;
    scaledFineGeneralizedForceTangent: Matrix2;
    baseGeneralizedForces: readonly [number, number];
    taylorDomainClassification: PublishedTriSegTaylorDomainClassificationV1;
    taylorTensionErrorDomainEligible: boolean;
    maximumAbsoluteThicknessCurvatureRatioZ: number;
    maximumTaylorTensionRelativeError: number | null;
  }>;
  tangentDiagnostics: Readonly<{
    symmetricFineTangent: Matrix2;
    eigenvaluesAscending: readonly [number, number];
    derivativeDisagreementTwoNorm: number;
    uncertaintyBound: number;
    classification:
      | "robust-restoring"
      | "robust-saddle"
      | "robust-antirestoring-maximum"
      | "indeterminate";
    robustSignedMargin: number;
    sigmaMinimum: number;
    conditionNumber2: number;
    schurToReequilibratedDifferenceTwoNorm: number;
  }>;
  residualRebuiltWithoutColdCoreImport: true;
  fullJacobianUsesNonlinearResidualFiniteDifferences: true;
  localMaterialReequilibratedAtEveryTwoDimensionalStencilSample: true;
  taylorFlagDerivedFromFreshClosedLoopEvaluation: true;
}>;

type AuditContext = Readonly<{
  slsMode: PhaseB1SlsModeV1;
  eta: number;
  endpoint: PhaseB1EndpointStateV1;
  scaffold: ReturnType<typeof buildPhaseB1SyntheticClosedLoopScaffoldV1>;
  binding: PhaseB1WallMaterialBindingV1;
  freeCalciumUMByWall: Readonly<Record<FourChamberWallId, number>>;
  unknownCount: 37 | 32;
  materialUnknownCount: 35 | 30;
  unknownScales: readonly number[];
  residualScales: readonly number[];
  strictLowerBounds: readonly (number | null)[];
  strictAffineConstraints: readonly StrictAffineConstraintV1[];
}>;

type DecodedUnknowns = Readonly<{
  landByWall: Readonly<Record<FourChamberWallId, RateFreeLand2017StateV1>>;
  slsAlphaVByWall: Readonly<Record<FourChamberWallId, number>> | null;
  triSegCoordinates: Readonly<{ V_m_S: number; y_m: number }>;
}>;

type ResidualEvaluation = Readonly<{
  residual: readonly number[];
  closedLoop: FourChamberClosedLoopSameTimeLevelEvaluationV1;
  maximumAbsolutePopulationRhsPerSec: number;
  maximumAbsoluteDistortionConstraint: number;
  maximumAbsoluteSlsConstraint: number;
  triSegResidualNPerM: Readonly<{ axial: number; radial: number }>;
}>;

export function auditPhaseB1ColdNodeIndependentlyV1(
  input: PhaseB1ColdNodeIndependentAuditInputV1,
): PhaseB1ColdNodeIndependentAuditResultV1 {
  const context = buildContext(input);
  const unknowns = Object.freeze([...input.unknowns]);
  const decoded = decodeUnknowns(context, unknowns);
  const residualEvaluation = evaluateColdResidualIndependently(context, unknowns);
  const fullJacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
    (trial) => evaluateColdResidualIndependently(context, trial).residual,
    unknowns,
    {
      unknownScales: context.unknownScales,
      residualScales: context.residualScales,
      lowerBounds: context.strictLowerBounds,
      strictAffineConstraints: context.strictAffineConstraints,
      scaledStep:
        PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_NUMERICS_V1
          .fullColdJacobianScaledStep,
    },
  );
  const schur = buildMaterialSchurAudit(
    context,
    residualEvaluation,
    fullJacobian.scaledJacobian,
    decoded.triSegCoordinates,
  );
  const reequilibrated = buildReequilibratedTangentAudit(
    context,
    decoded.triSegCoordinates,
  );
  const fineSymmetric = symmetricPart(reequilibrated.scaledFineGeneralizedForceTangent);
  const eigenvaluesAscending = symmetricEigenvalues(fineSymmetric);
  const derivativeDisagreementTwoNorm = matrixTwoNorm(subtractMatrix(
    reequilibrated.scaledCoarseGeneralizedForceTangent,
    reequilibrated.scaledFineGeneralizedForceTangent,
  ));
  const symmetricNorm = Math.max(
    Math.abs(eigenvaluesAscending[0]),
    Math.abs(eigenvaluesAscending[1]),
  );
  const uncertaintyBound = Math.max(
    PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_NUMERICS_V1
      .derivativeDisagreementMultiplier * derivativeDisagreementTwoNorm,
    PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_NUMERICS_V1
      .relativeStaticTangentUncertaintyFloor * Math.max(1, symmetricNorm),
  );
  const classification = classifyStaticTangent(eigenvaluesAscending, uncertaintyBound);
  const singularValues = diagnoseTwoByTwo(
    reequilibrated.scaledFineGeneralizedForceTangent,
  );
  const endpointUnknowns = encodeEndpointMaterialAndTriSeg(input.endpoint, input.slsMode);

  return Object.freeze({
    auditId: PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_V1_ID,
    slsMode: input.slsMode,
    eta: input.eta,
    unknownCount: context.unknownCount,
    materialUnknownCount: context.materialUnknownCount,
    endpointUnknownScaledInfinityDifference: scaledInfinityDistance(
      endpointUnknowns,
      unknowns,
      context.unknownScales,
    ),
    residual: residualEvaluation.residual,
    scaledResidualInfinityNorm: maximumAbsolute(residualEvaluation.residual.map(
      (value, index) => value / context.residualScales[index],
    )),
    maximumAbsolutePopulationRhsPerSec:
      residualEvaluation.maximumAbsolutePopulationRhsPerSec,
    maximumAbsoluteDistortionConstraint:
      residualEvaluation.maximumAbsoluteDistortionConstraint,
    maximumAbsoluteSlsConstraint:
      residualEvaluation.maximumAbsoluteSlsConstraint,
    triSegResidualNPerM: residualEvaluation.triSegResidualNPerM,
    fullColdJacobian: Object.freeze({
      dimension: context.unknownCount,
      scaledStep: fullJacobian.scaledStep,
      stencilByColumn: fullJacobian.stencilByColumn,
      maximumAbsoluteScaledEntry: maximumAbsolute(fullJacobian.scaledJacobian.flat()),
    }),
    materialSchur: schur,
    reequilibrated,
    tangentDiagnostics: Object.freeze({
      symmetricFineTangent: fineSymmetric,
      eigenvaluesAscending,
      derivativeDisagreementTwoNorm,
      uncertaintyBound,
      classification,
      robustSignedMargin: restoringMargin(
        classification,
        eigenvaluesAscending,
        uncertaintyBound,
      ),
      sigmaMinimum: singularValues.sigmaMinimum,
      conditionNumber2: singularValues.conditionNumber2,
      schurToReequilibratedDifferenceTwoNorm: matrixTwoNorm(subtractMatrix(
        schur.scaledGeneralizedForceTangent,
        reequilibrated.scaledFineGeneralizedForceTangent,
      )),
    }),
    residualRebuiltWithoutColdCoreImport: true,
    fullJacobianUsesNonlinearResidualFiniteDifferences: true,
    localMaterialReequilibratedAtEveryTwoDimensionalStencilSample: true,
    taylorFlagDerivedFromFreshClosedLoopEvaluation: true,
  });
}

function buildContext(input: PhaseB1ColdNodeIndependentAuditInputV1): AuditContext {
  if (input.slsMode !== "on" && input.slsMode !== "off") {
    throw new Error("independent cold audit slsMode must be on or off");
  }
  requireHomotopyFraction(input.eta);
  if (input.endpoint.differentialState.slsMode !== input.slsMode) {
    throw new Error("independent cold audit endpoint SLS mode mismatch");
  }
  const unknownCount = (input.slsMode === "on" ? 37 : 32) as 37 | 32;
  const materialUnknownCount = (unknownCount - 2) as 35 | 30;
  if (input.unknowns.length !== unknownCount) {
    throw new Error("independent cold audit unknown dimension mismatch");
  }
  input.unknowns.forEach((value, index) => requireFinite(value, `unknowns[${index}]`));
  const scaffold = buildPhaseB1SyntheticClosedLoopScaffoldV1(input.sha256Hex);
  const binding = buildPhaseB1WallMaterialBindingV1(
    scaffold.phaseA1TissueManifestBundle,
    input.sha256Hex,
  );
  const freeCalciumUMByWall = wallRecord((wallId) => {
    const state = input.endpoint.differentialState.calciumByWall[wallId];
    return evaluateExactEventCalciumV1(
      [state.r, state.d],
      binding.runtimeByWall[wallId].prescribedCalciumParameters,
    ).freeCalciumUM;
  });
  const registry = scaffold.newtonScaleRegistry;
  const unknownScales = Object.freeze([
    ...WALL_IDS.flatMap((wallId) => [
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.landDistortionByWall[wallId],
      registry.unknownScales.landDistortionByWall[wallId],
    ]),
    ...(input.slsMode === "on"
      ? WALL_IDS.map(() => registry.unknownScales.slsViscousStrain)
      : []),
    registry.unknownScales.septalMidwallVolumeM3,
    registry.unknownScales.junctionRadiusM,
  ]);
  const residualScales = Object.freeze([
    ...WALL_IDS.flatMap((wallId) => [
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.calciumAndPopulation,
      registry.unknownScales.landDistortionByWall[wallId],
      registry.unknownScales.landDistortionByWall[wallId],
    ]),
    ...(input.slsMode === "on"
      ? WALL_IDS.map(() => registry.unknownScales.slsViscousStrain)
      : []),
    registry.residualScales.publishedTriSegEquilibriumNPerM,
    registry.residualScales.publishedTriSegEquilibriumNPerM,
  ]);
  const strictLowerBounds: (number | null)[] = Array(unknownCount).fill(null);
  const strictAffineConstraints: StrictAffineConstraintV1[] = [];
  for (let wallIndex = 0; wallIndex < WALL_IDS.length; wallIndex += 1) {
    const offset = 6 * wallIndex;
    for (let coordinate = 0; coordinate < 4; coordinate += 1) {
      strictLowerBounds[offset + coordinate] = 0;
    }
    const calciumUpper = Array<number>(unknownCount).fill(0);
    calciumUpper[offset] = -1;
    strictAffineConstraints.push(Object.freeze({
      constraintId: `independent-cold.${WALL_IDS[wallIndex]}.CaTRPN<1`,
      coefficients: Object.freeze(calciumUpper),
      lowerBound: -1,
    }));
    const populationUpper = Array<number>(unknownCount).fill(0);
    populationUpper[offset + 1] = -1;
    populationUpper[offset + 2] = -1;
    populationUpper[offset + 3] = -1;
    strictAffineConstraints.push(Object.freeze({
      constraintId: `independent-cold.${WALL_IDS[wallIndex]}.B+W+S<1`,
      coefficients: Object.freeze(populationUpper),
      lowerBound: -1,
    }));
  }
  strictLowerBounds[unknownCount - 1] =
    PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_NUMERICS_V1.junctionRadiusLowerBoundM;
  return Object.freeze({
    slsMode: input.slsMode,
    eta: input.eta,
    endpoint: input.endpoint,
    scaffold,
    binding,
    freeCalciumUMByWall,
    unknownCount,
    materialUnknownCount,
    unknownScales,
    residualScales,
    strictLowerBounds: Object.freeze(strictLowerBounds),
    strictAffineConstraints: Object.freeze(strictAffineConstraints),
  });
}

function evaluateColdResidualIndependently(
  context: AuditContext,
  unknowns: readonly number[],
): ResidualEvaluation {
  const decoded = decodeUnknowns(context, unknowns);
  const materialByWallMutable: Partial<Record<
    FourChamberWallId,
    PhaseB1WallMaterialStateEvaluationV1
  >> = {};
  const closedLoop = evaluateClosedLoop(context, decoded.triSegCoordinates, ({
    wallId,
    fiberLogStrain,
    wallReferenceMaterialVolumeM3,
  }) => {
    const material = evaluatePhaseB1WallMaterialStateV1({
      wallMaterial: context.binding.runtimeByWall[wallId],
      fiberLogStrain,
      freeCalciumUM: context.freeCalciumUMByWall[wallId],
      landState: decoded.landByWall[wallId],
      slsMode: context.slsMode,
      alphaV: context.slsMode === "on"
        ? requireRecord(decoded.slsAlphaVByWall, "slsAlphaVByWall")[wallId]
        : null,
    });
    materialByWallMutable[wallId] = material;
    return wallOutput(context, material, wallReferenceMaterialVolumeM3);
  });
  const materialByWall = wallRecord((wallId) => {
    const value = materialByWallMutable[wallId];
    if (value === undefined) throw new Error(`wall ${wallId} was not evaluated`);
    return value;
  });
  const residualByWall = wallRecord((wallId) => {
    const material = context.binding.runtimeByWall[wallId];
    const state = materialByWall[wallId];
    const land = decoded.landByWall[wallId];
    const rhs = writeRateFreeLand2017RhsV1(
      land,
      {
        freeCalciumUM: context.freeCalciumUMByWall[wallId],
        landStretch: state.length.landStretch,
      },
      material.landEquationParameters,
    );
    return Object.freeze([
      rhs[0],
      rhs[1],
      rhs[2],
      rhs[3],
      land[4] + material.landEquationParameters.derived.Aw * state.length.landStretch,
      land[5] + material.landEquationParameters.derived.As * state.length.landStretch,
    ]);
  });
  const slsResidualByWall = context.slsMode === "on"
    ? wallRecord((wallId) =>
      requireRecord(decoded.slsAlphaVByWall, "slsAlphaVByWall")[wallId]
      - materialByWall[wallId].fiberLogStrain)
    : null;
  const triSegResidualNPerM = Object.freeze({
    axial: closedLoop.triSegOracle.equilibriumResidual.axialNPerM,
    radial: closedLoop.triSegOracle.equilibriumResidual.radialNPerM,
  });
  const residual = Object.freeze([
    ...WALL_IDS.flatMap((wallId) => residualByWall[wallId]),
    ...(slsResidualByWall === null
      ? []
      : WALL_IDS.map((wallId) => slsResidualByWall[wallId])),
    triSegResidualNPerM.axial,
    triSegResidualNPerM.radial,
  ]);
  if (residual.length !== context.unknownCount) {
    throw new Error("independent cold residual dimension drifted");
  }
  residual.forEach((value, index) => requireFinite(value, `residual[${index}]`));
  return Object.freeze({
    residual,
    closedLoop,
    maximumAbsolutePopulationRhsPerSec: Math.max(
      ...WALL_IDS.flatMap((wallId) => residualByWall[wallId].slice(0, 4).map(Math.abs)),
    ),
    maximumAbsoluteDistortionConstraint: Math.max(
      ...WALL_IDS.flatMap((wallId) => residualByWall[wallId].slice(4).map(Math.abs)),
    ),
    maximumAbsoluteSlsConstraint: slsResidualByWall === null
      ? 0
      : Math.max(...WALL_IDS.map((wallId) => Math.abs(slsResidualByWall[wallId]))),
    triSegResidualNPerM,
  });
}

function buildMaterialSchurAudit(
  context: AuditContext,
  residual: ResidualEvaluation,
  scaledJacobian: readonly (readonly number[])[],
  triSegCoordinates: Readonly<{ V_m_S: number; y_m: number }>,
): PhaseB1ColdNodeIndependentAuditResultV1["materialSchur"] {
  const materialCount = context.materialUnknownCount;
  const scaledA = scaledJacobian.slice(0, materialCount).flatMap((row) =>
    row.slice(0, materialCount));
  const solvedByCoordinate: number[][] = [];
  const diagnostics: ScaledDenseLuDiagnosticsV1[] = [];
  for (let coordinate = 0; coordinate < 2; coordinate += 1) {
    const scaledB = scaledJacobian.slice(0, materialCount).map(
      (row) => row[materialCount + coordinate],
    );
    const solved = solveScaledDensePartialPivotLuV1(
      scaledA,
      scaledB,
      PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_NUMERICS_V1.relativePivotTolerance,
    );
    if (solved.success === false) {
      throw new Error(`independent material Schur solve failed: ${solved.message}`);
    }
    solvedByCoordinate.push([...solved.solution]);
    diagnostics.push(solved.diagnostics);
  }
  const qScales = context.unknownScales.slice(materialCount);
  const triResidualScale = context.residualScales[materialCount];
  const schurScaledTriResidual: number[] = [];
  for (let row = 0; row < 2; row += 1) {
    for (let coordinate = 0; coordinate < 2; coordinate += 1) {
      let value = scaledJacobian[materialCount + row][materialCount + coordinate];
      for (let column = 0; column < materialCount; column += 1) {
        value -= scaledJacobian[materialCount + row][column]
          * solvedByCoordinate[coordinate][column];
      }
      schurScaledTriResidual.push(value);
    }
  }
  const rawTriResidualTangent = schurScaledTriResidual.map((value, index) =>
    value * triResidualScale / qScales[index % 2]);
  const y = triSegCoordinates.y_m;
  const generalizedScales = generalizedForceScales(context);
  const tangent = Object.freeze([
    (2 / y) * rawTriResidualTangent[0] * qScales[0] / generalizedScales[0],
    ((2 / y) * rawTriResidualTangent[1]
      - 2 * residual.triSegResidualNPerM.axial / (y * y))
      * qScales[1] / generalizedScales[0],
    (2 * Math.PI * y) * rawTriResidualTangent[2]
      * qScales[0] / generalizedScales[1],
    (2 * Math.PI * y * rawTriResidualTangent[3]
      + 2 * Math.PI * residual.triSegResidualNPerM.radial)
      * qScales[1] / generalizedScales[1],
  ] as const);
  const diagnosticTuple = Object.freeze([
    diagnostics[0],
    diagnostics[1],
  ] as const);
  return Object.freeze({
    scaledGeneralizedForceTangent: tangent,
    luDiagnosticsByTriSegCoordinate: diagnosticTuple,
    minimumRelativePivot: Math.min(
      diagnosticTuple[0].relativeMinimumPivot,
      diagnosticTuple[1].relativeMinimumPivot,
    ),
    maximumPivotGrowthFactor: Math.max(
      diagnosticTuple[0].pivotGrowthFactor,
      diagnosticTuple[1].pivotGrowthFactor,
    ),
  });
}

function buildReequilibratedTangentAudit(
  context: AuditContext,
  coordinates: Readonly<{ V_m_S: number; y_m: number }>,
): PhaseB1ColdNodeIndependentAuditResultV1["reequilibrated"] {
  const qScales = context.unknownScales.slice(context.materialUnknownCount);
  const generalizedScales = generalizedForceScales(context);
  const generalizedForceAt = (values: readonly number[]) => {
    const closedLoop = evaluateFullyReequilibratedClosedLoop(context, {
      V_m_S: values[0],
      y_m: values[1],
    });
    return Object.freeze([
      2 * closedLoop.triSegOracle.equilibriumResidual.axialNPerM / values[1],
      2 * Math.PI * values[1]
        * closedLoop.triSegOracle.equilibriumResidual.radialNPerM,
    ] as const);
  };
  const baseCoordinates = Object.freeze([coordinates.V_m_S, coordinates.y_m]);
  const options = (scaledStep: number) => ({
    unknownScales: qScales,
    residualScales: generalizedScales,
    lowerBounds: [
      null,
      PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_NUMERICS_V1.junctionRadiusLowerBoundM,
    ],
    scaledStep,
  } as const);
  const coarse = evaluateScaledFivePointAlgorithmicJacobianV1(
    generalizedForceAt,
    baseCoordinates,
    options(
      PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_NUMERICS_V1
        .coarseReequilibratedTangentScaledStep,
    ),
  );
  const fine = evaluateScaledFivePointAlgorithmicJacobianV1(
    generalizedForceAt,
    baseCoordinates,
    options(
      PHASE_B1_COLD_NODE_INDEPENDENT_AUDIT_NUMERICS_V1
        .fineReequilibratedTangentScaledStep,
    ),
  );
  const fresh = evaluateFullyReequilibratedClosedLoop(context, coordinates);
  const oracle = fresh.triSegOracle;
  return Object.freeze({
    scaledCoarseGeneralizedForceTangent: matrixTuple(coarse.scaledJacobian),
    scaledFineGeneralizedForceTangent: matrixTuple(fine.scaledJacobian),
    baseGeneralizedForces: generalizedForceAt(baseCoordinates),
    taylorDomainClassification: oracle.domainClassification,
    taylorTensionErrorDomainEligible: oracle.taylorTensionErrorDomainEligible,
    maximumAbsoluteThicknessCurvatureRatioZ:
      oracle.maximumAbsoluteThicknessCurvatureRatioZ,
    maximumTaylorTensionRelativeError:
      oracle.maximumTaylorTensionRelativeError,
  });
}

function evaluateFullyReequilibratedClosedLoop(
  context: AuditContext,
  coordinates: Readonly<{ V_m_S: number; y_m: number }>,
): FourChamberClosedLoopSameTimeLevelEvaluationV1 {
  return evaluateClosedLoop(context, coordinates, ({
    wallId,
    fiberLogStrain,
    wallReferenceMaterialVolumeM3,
  }) => {
    const material = context.binding.runtimeByWall[wallId];
    const length = evaluateLandLengthStateV1(
      material.landWallAdapterContext,
      { fiberLogStrain },
    );
    const sourceSteadyState = initializeLand2017IsometricSteadyStateV1(
      length.landStretch,
      context.freeCalciumUMByWall[wallId],
      material.landEquationParameters,
    );
    const landState = sourceLand2017StateToRateFreeV1(
      sourceSteadyState,
      length.landStretch,
      material.landEquationParameters,
    );
    const evaluation = evaluatePhaseB1WallMaterialStateV1({
      wallMaterial: material,
      fiberLogStrain,
      freeCalciumUM: context.freeCalciumUMByWall[wallId],
      landState,
      slsMode: context.slsMode,
      alphaV: context.slsMode === "on" ? fiberLogStrain : null,
    });
    return wallOutput(context, evaluation, wallReferenceMaterialVolumeM3);
  });
}

function evaluateClosedLoop(
  context: AuditContext,
  triSegCoordinates: Readonly<{ V_m_S: number; y_m: number }>,
  evaluateWall: Parameters<typeof evaluateFourChamberClosedLoopSameTimeLevelV1>[0]["evaluateWall"],
): FourChamberClosedLoopSameTimeLevelEvaluationV1 {
  return evaluateFourChamberClosedLoopSameTimeLevelV1({
    atrialGeometryPriorByChamber: context.scaffold.atrialGeometryPriorByChamber,
    triSegWalls: context.scaffold.triSegReference.walls,
    vascularComplianceParametersByCompartment:
      context.scaffold.vascularComplianceParametersByCompartment,
    peripheralResistancePaSecPerM3ByFlow:
      context.scaffold.peripheralResistancePaSecPerM3ByFlow,
    valveLossParametersByFlow: context.scaffold.valveLossParametersByFlow,
    inletLossParametersByFlow: context.scaffold.inletLossParametersByFlow,
    pericardiumParameters: context.scaffold.pericardiumParameters,
    intrathoracicPressurePa: context.scaffold.intrathoracicPressurePa,
    state: Object.freeze({
      timeSec: context.endpoint.timeSec,
      bloodVolumesM3: context.endpoint.differentialState.bloodVolumesM3,
      inertialFlowsM3PerSec:
        context.endpoint.differentialState.inertialFlowsM3PerSec,
      triSegCoordinates: Object.freeze({ ...triSegCoordinates }),
    }),
    evaluateWall,
  });
}

function wallOutput(
  context: AuditContext,
  evaluation: PhaseB1WallMaterialStateEvaluationV1,
  wallReferenceMaterialVolumeM3: number,
) {
  const runtime = context.binding.runtimeByWall[evaluation.wallId];
  const totalStressPa = evaluation.passive.equilibriumKirchhoffStressPa
    + evaluation.sls.overstressPa
    + (1 - context.eta)
      * context.scaffold.targetFiberStressPaByWall[evaluation.wallId]
    + context.eta * evaluation.wallActiveKirchhoffStressPa;
  const totalTangentPa = evaluation.passive.dStressDFiberLogStrainPa
    + evaluation.sls.stressPartialPaPerFiberLogStrainAtFixedAlpha
    + context.eta
      * evaluation.wallActiveStressPartialPaPerFiberLogStrainAtFixedLandState;
  const slsStoredEnergyJ = wallReferenceMaterialVolumeM3
    * evaluation.sls.storedEnergyDensityJPerM3;
  const slsPhysicalDissipationW = evaluation.sls.mode === "on"
    ? wallReferenceMaterialVolumeM3
      * evaluation.sls.overstressPa * evaluation.sls.overstressPa
      / (runtime.passiveSls.compiledSls.EVPa
        * runtime.passiveSls.compiledSls.tauSec)
    : 0;
  return Object.freeze({
    equilibriumPassive: evaluation.passive,
    activeKirchhoffStressPa: evaluation.wallActiveKirchhoffStressPa,
    activeStressTimeDerivativePaPerSec: 0,
    slsOverstressPa: evaluation.sls.overstressPa,
    slsStoredEnergyJ,
    slsPhysicalDissipationW,
    totalKirchhoffStressPa: requireFinite(totalStressPa, "totalStressPa"),
    totalTangentAtFixedInternalStatePa:
      requireFinite(totalTangentPa, "totalTangentPa"),
  });
}

function decodeUnknowns(
  context: AuditContext,
  unknowns: readonly number[],
): DecodedUnknowns {
  if (unknowns.length !== context.unknownCount) {
    throw new Error("independent cold unknown decoder dimension mismatch");
  }
  let offset = 0;
  const landByWall = wallRecord(() => Object.freeze([
    requireFinite(unknowns[offset++], "CaTRPN"),
    requireFinite(unknowns[offset++], "B"),
    requireFinite(unknowns[offset++], "W"),
    requireFinite(unknowns[offset++], "S"),
    requireFinite(unknowns[offset++], "xiW"),
    requireFinite(unknowns[offset++], "xiS"),
  ] as RateFreeLand2017StateV1));
  const slsAlphaVByWall = context.slsMode === "on"
    ? wallRecord(() => requireFinite(unknowns[offset++], "alphaV"))
    : null;
  const triSegCoordinates = Object.freeze({
    V_m_S: requireFinite(unknowns[offset++], "V_m_S"),
    y_m: requirePositiveFinite(unknowns[offset++], "y_m"),
  });
  if (offset !== context.unknownCount) {
    throw new Error("independent cold unknown decoder offset drifted");
  }
  return Object.freeze({ landByWall, slsAlphaVByWall, triSegCoordinates });
}

function encodeEndpointMaterialAndTriSeg(
  endpoint: PhaseB1EndpointStateV1,
  slsMode: PhaseB1SlsModeV1,
): readonly number[] {
  const state = endpoint.differentialState;
  if (state.slsMode !== slsMode) throw new Error("endpoint SLS mode drifted");
  return Object.freeze([
    ...WALL_IDS.flatMap((wallId) => state.landByWall[wallId]),
    ...(state.slsMode === "on"
      ? WALL_IDS.map((wallId) => state.slsAlphaVByWall[wallId])
      : []),
    endpoint.triSegCoordinates.V_m_S,
    endpoint.triSegCoordinates.y_m,
  ]);
}

function generalizedForceScales(context: AuditContext): readonly [number, number] {
  return Object.freeze([
    context.scaffold.newtonScaleRegistry.residualScales
      .virtualWorkSeptalVolumePa,
    context.scaffold.newtonScaleRegistry.residualScales
      .virtualWorkJunctionRadiusN,
  ] as const);
}

function wallRecord<T>(
  build: (wallId: FourChamberWallId) => T,
): Readonly<Record<FourChamberWallId, T>> {
  return Object.freeze(Object.fromEntries(
    WALL_IDS.map((wallId) => [wallId, build(wallId)]),
  )) as Readonly<Record<FourChamberWallId, T>>;
}

function requireRecord<T>(value: T | null, field: string): T {
  if (value === null) throw new Error(`${field} is required`);
  return value;
}

function matrixTuple(matrix: readonly (readonly number[])[]): Matrix2 {
  if (matrix.length !== 2 || matrix.some((row) => row.length !== 2)) {
    throw new Error("expected a 2x2 matrix");
  }
  return Object.freeze([
    matrix[0][0],
    matrix[0][1],
    matrix[1][0],
    matrix[1][1],
  ] as const);
}

function symmetricPart(matrix: Matrix2): Matrix2 {
  const offDiagonal = 0.5 * (matrix[1] + matrix[2]);
  return Object.freeze([matrix[0], offDiagonal, offDiagonal, matrix[3]] as const);
}

function symmetricEigenvalues(matrix: Matrix2): readonly [number, number] {
  const center = 0.5 * (matrix[0] + matrix[3]);
  const radius = Math.hypot(0.5 * (matrix[0] - matrix[3]), matrix[1]);
  return Object.freeze([center - radius, center + radius] as const);
}

function subtractMatrix(left: Matrix2, right: Matrix2): Matrix2 {
  return Object.freeze([
    left[0] - right[0],
    left[1] - right[1],
    left[2] - right[2],
    left[3] - right[3],
  ] as const);
}

function matrixTwoNorm(matrix: Matrix2): number {
  return diagnoseTwoByTwo(matrix).sigmaMaximum;
}

function diagnoseTwoByTwo(matrix: Matrix2) {
  const [a, b, c, d] = matrix;
  const trace = a * a + b * b + c * c + d * d;
  const determinant = a * d - b * c;
  const discriminant = Math.sqrt(Math.max(
    0,
    trace * trace - 4 * determinant * determinant,
  ));
  const sigmaMaximum = Math.sqrt(Math.max(0, 0.5 * (trace + discriminant)));
  const sigmaMinimum = Math.sqrt(Math.max(0, 0.5 * (trace - discriminant)));
  return Object.freeze({
    sigmaMaximum,
    sigmaMinimum,
    conditionNumber2: sigmaMinimum > 0
      ? sigmaMaximum / sigmaMinimum
      : Number.POSITIVE_INFINITY,
  });
}

function classifyStaticTangent(
  eigenvalues: readonly [number, number],
  uncertaintyBound: number,
): PhaseB1ColdNodeIndependentAuditResultV1["tangentDiagnostics"]["classification"] {
  const [minimum, maximum] = eigenvalues;
  if (minimum > uncertaintyBound) return "robust-restoring";
  if (maximum < -uncertaintyBound) return "robust-antirestoring-maximum";
  if (minimum < -uncertaintyBound && maximum > uncertaintyBound) {
    return "robust-saddle";
  }
  return "indeterminate";
}

function restoringMargin(
  classification: PhaseB1ColdNodeIndependentAuditResultV1[
    "tangentDiagnostics"
  ]["classification"],
  eigenvalues: readonly [number, number],
  uncertaintyBound: number,
): number {
  if (classification === "robust-restoring") {
    return eigenvalues[0] - uncertaintyBound;
  }
  if (classification === "robust-antirestoring-maximum") {
    return -eigenvalues[1] - uncertaintyBound;
  }
  if (classification === "robust-saddle") {
    return Math.min(-eigenvalues[0], eigenvalues[1]) - uncertaintyBound;
  }
  return 0;
}

function scaledInfinityDistance(
  left: readonly number[],
  right: readonly number[],
  scales: readonly number[],
): number {
  if (left.length !== right.length || left.length !== scales.length) {
    throw new Error("scaled distance dimension mismatch");
  }
  return Math.max(...left.map((value, index) =>
    Math.abs(value - right[index]) / scales[index]));
}

function maximumAbsolute(values: readonly number[]): number {
  return values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
}

function requireHomotopyFraction(value: number): void {
  requireFinite(value, "eta");
  if (value < 0 || value > 1) throw new Error("eta must be in [0, 1]");
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (!(finite > 0)) throw new Error(`${field} must be positive`);
  return finite;
}
