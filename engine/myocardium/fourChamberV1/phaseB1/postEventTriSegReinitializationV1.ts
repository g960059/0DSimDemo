import {
  evaluateScaledFivePointAlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledFivePointAlgorithmicJacobianV1";
import {
  solveScaledDampedNewtonV1,
  type ScaledDampedNewtonDiagnosticsV1,
  type ScaledDampedNewtonFailureReasonV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import {
  PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicNumericalPolicyV1";
import {
  evaluatePhaseB1EventFreeEndpointV1,
  type PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  evaluatePhaseB1WallMaterialStateV1,
  type PhaseB1WallMaterialStateEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import {
  TRISEG_WALL_IDS,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  evaluatePublishedTriSegGeometryV1,
  type PublishedTriSegGeometryV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  evaluatePublishedTriSegTaylorOracle2009V1,
  type PublishedTriSegTaylorOracle2009V1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_POST_EVENT_TRISEG_REINITIALIZATION_V1_ID =
  "four-chamber-phase-b1-post-event-triseg-reinitialization-v1" as const;

export type PhaseB1PostEventTriSegEvaluationV1 = Readonly<{
  geometry: PublishedTriSegGeometryV1;
  wallMaterialByWall: Readonly<
    Record<TriSegWallId, PhaseB1WallMaterialStateEvaluationV1>
  >;
  oracle: PublishedTriSegTaylorOracle2009V1;
  residualNPerM: readonly [axial: number, radial: number];
}>;

export type PhaseB1PostEventTriSegReinitializationSuccessV1 = Readonly<{
  converged: true;
  solverId: typeof PHASE_B1_POST_EVENT_TRISEG_REINITIALIZATION_V1_ID;
  previousEndpoint: PhaseB1EndpointStateV1;
  endpointAfterReinitialization: PhaseB1EndpointStateV1;
  evaluation: PhaseB1PostEventTriSegEvaluationV1;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  semismoothConstitutiveLinearizationUsed: true;
  differentialStateChanged: false;
  projectionApplied: false;
  fallbackApplied: false;
  phaseB1Acceptance: false;
  testReferenceOnly: true;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1PostEventTriSegReinitializationFailureV1 = Readonly<{
  converged: false;
  solverId: typeof PHASE_B1_POST_EVENT_TRISEG_REINITIALIZATION_V1_ID;
  reason: ScaledDampedNewtonFailureReasonV1 | "final-evaluation-failed";
  message: string;
  rollbackEndpoint: PhaseB1EndpointStateV1;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  projectionApplied: false;
  fallbackApplied: false;
  phaseB1Acceptance: false;
  testReferenceOnly: true;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1PostEventTriSegReinitializationResultV1 =
  | PhaseB1PostEventTriSegReinitializationSuccessV1
  | PhaseB1PostEventTriSegReinitializationFailureV1;

export function reinitializePhaseB1PostEventTriSegV1(input: Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  endpointAfterCalciumJump: PhaseB1EndpointStateV1;
}>): PhaseB1PostEventTriSegReinitializationResultV1 {
  assertExactPlainRecordV1(input, [
    "model",
    "wallMaterialBinding",
    "endpointAfterCalciumJump",
  ], "Phase B1 post-event TriSeg reinitialization input");
  const previousEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.endpointAfterCalciumJump.timeSec,
    differentialState: input.endpointAfterCalciumJump.differentialState,
    triSegCoordinates: input.endpointAfterCalciumJump.triSegCoordinates,
  });
  const initialWholeHeartEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    input.model,
    input.wallMaterialBinding,
    previousEndpoint,
  );
  const initialUnknowns = Object.freeze([
    previousEndpoint.triSegCoordinates.V_m_S,
    previousEndpoint.triSegCoordinates.y_m,
  ]);
  const unknownScales = Object.freeze([
    input.model.newtonScaleRegistry.unknownScales.septalMidwallVolumeM3,
    input.model.newtonScaleRegistry.unknownScales.junctionRadiusM,
  ]);
  const residualScales = Object.freeze([
    input.model.newtonScaleRegistry.residualScales
      .publishedTriSegEquilibriumNPerM,
    input.model.newtonScaleRegistry.residualScales
      .publishedTriSegEquilibriumNPerM,
  ]);
  const lowerBounds = Object.freeze([
    null,
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .strictJunctionRadiusLowerBoundM,
  ] as const);
  const evaluateActual = (coordinates: readonly number[]) =>
    evaluateAtCoordinates(
      input.model,
      input.wallMaterialBinding,
      previousEndpoint,
      initialWholeHeartEvaluation.freeCalciumUMByWall,
      coordinates,
    );
  const newton = solveScaledDampedNewtonV1({
    initialUnknowns,
    unknownScales,
    residualScales,
    strictLowerBounds: lowerBounds,
    options: {
      maxIterations:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.maxNewtonIterations,
      residualInfinityTolerance:
        input.model.newtonScaleRegistry.tolerances.globalResidualInfinityNorm,
      updateInfinityTolerance:
        input.model.newtonScaleRegistry.tolerances.globalUpdateInfinityNorm,
      armijoCoefficient:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.armijoCoefficient,
      lineSearchContraction:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.lineSearchContraction,
      maxLineSearchBacktracks:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
          .maxLineSearchBacktracks,
      minimumStepLength:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.minimumStepLength,
      fractionToBoundarySafety:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
          .fractionToBoundarySafety,
      relativePivotTolerance:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
          .relativePivotTolerance,
    },
    evaluate: (coordinates) => {
      let base: PhaseB1PostEventTriSegEvaluationV1;
      try {
        base = evaluateActual(coordinates);
      } catch (error) {
        return { status: "inadmissible" as const, reason: errorMessage(error) };
      }
      try {
        const linearizedResidual = (trialCoordinates: readonly number[]) =>
          evaluateSemismoothLinearizedResidual(
            input.model,
            previousEndpoint,
            base,
            trialCoordinates,
          );
        assertResidualsRoundoffEqual(
          linearizedResidual(coordinates),
          base.residualNPerM,
        );
        const jacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
          linearizedResidual,
          coordinates,
          {
            unknownScales,
            residualScales,
            lowerBounds,
            scaledStep:
              PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
                .algorithmicJacobianScaledStep,
          },
        );
        return {
          status: "ok" as const,
          residual: base.residualNPerM,
          jacobianRowMajor: jacobian.rawJacobian.flat(),
          diagnostic: Object.freeze({
            triSegResidualInfinityNormNPerM: Math.max(
              Math.abs(base.residualNPerM[0]),
              Math.abs(base.residualNPerM[1]),
            ),
          }),
        };
      } catch (error) {
        return { status: "failed" as const, reason: errorMessage(error) };
      }
    },
  });
  if (newton.converged === false) {
    return failure(
      newton.reason,
      newton.message,
      previousEndpoint,
      newton.diagnostics,
    );
  }
  try {
    const evaluation = evaluateActual(newton.unknowns);
    const endpointAfterReinitialization = createPhaseB1EndpointStateV1({
      timeSec: previousEndpoint.timeSec,
      differentialState: previousEndpoint.differentialState,
      triSegCoordinates: Object.freeze({
        V_m_S: newton.unknowns[0],
        y_m: newton.unknowns[1],
      }),
    });
    return Object.freeze({
      converged: true,
      solverId: PHASE_B1_POST_EVENT_TRISEG_REINITIALIZATION_V1_ID,
      previousEndpoint,
      endpointAfterReinitialization,
      evaluation,
      newtonDiagnostics: newton.diagnostics,
      semismoothConstitutiveLinearizationUsed: true,
      differentialStateChanged: false,
      projectionApplied: false,
      fallbackApplied: false,
      phaseB1Acceptance: false,
      testReferenceOnly: true,
      releaseRuntimeReachable: false,
    });
  } catch (error) {
    return failure(
      "final-evaluation-failed",
      errorMessage(error),
      previousEndpoint,
      newton.diagnostics,
    );
  }
}

function evaluateAtCoordinates(
  model: PhaseB1EventFreeMonolithicModelV1,
  binding: PhaseB1WallMaterialBindingV1,
  endpoint: PhaseB1EndpointStateV1,
  freeCalciumUMByWall: Readonly<Record<TriSegWallId | "LA" | "RA", number>>,
  coordinates: readonly number[],
): PhaseB1PostEventTriSegEvaluationV1 {
  if (coordinates.length !== 2) {
    throw new Error("post-event TriSeg coordinates must contain two values");
  }
  const differential = endpoint.differentialState;
  const geometry = evaluatePublishedTriSegGeometryV1({
    leftVentricularCavityVolumeM3: differential.bloodVolumesM3.LV,
    rightVentricularCavityVolumeM3: differential.bloodVolumesM3.RV,
    septalMidwallCapVolumeM3: requireFinite(coordinates[0], "V_m_S"),
    junctionRadiusM: requirePositiveFinite(coordinates[1], "y_m"),
    walls: model.closedLoopParameters.triSegWalls,
  });
  const wallMaterialByWall = triSegWallRecord((wallId) =>
    evaluatePhaseB1WallMaterialStateV1({
      wallMaterial: binding.runtimeByWall[wallId],
      fiberLogStrain: geometry.walls[wallId].fiberLogStrain,
      freeCalciumUM: freeCalciumUMByWall[wallId],
      landState: differential.landByWall[wallId],
      slsMode: differential.slsMode,
      alphaV: differential.slsMode === "on"
        ? differential.slsAlphaVByWall[wallId]
        : null,
    }));
  const oracle = evaluatePublishedTriSegTaylorOracle2009V1(
    geometry,
    triSegWallRecord((wallId) =>
      wallMaterialByWall[wallId].totalWallKirchhoffStressPa),
  );
  return Object.freeze({
    geometry,
    wallMaterialByWall,
    oracle,
    residualNPerM: Object.freeze([
      oracle.equilibriumResidual.axialNPerM,
      oracle.equilibriumResidual.radialNPerM,
    ] as [number, number]),
  });
}

function evaluateSemismoothLinearizedResidual(
  model: PhaseB1EventFreeMonolithicModelV1,
  endpoint: PhaseB1EndpointStateV1,
  base: PhaseB1PostEventTriSegEvaluationV1,
  trialCoordinates: readonly number[],
): readonly [number, number] {
  if (trialCoordinates.length !== 2) {
    throw new Error("post-event TriSeg trial coordinates must contain two values");
  }
  const differential = endpoint.differentialState;
  const trialGeometry = evaluatePublishedTriSegGeometryV1({
    leftVentricularCavityVolumeM3: differential.bloodVolumesM3.LV,
    rightVentricularCavityVolumeM3: differential.bloodVolumesM3.RV,
    septalMidwallCapVolumeM3: requireFinite(trialCoordinates[0], "trial.V_m_S"),
    junctionRadiusM: requirePositiveFinite(trialCoordinates[1], "trial.y_m"),
    walls: model.closedLoopParameters.triSegWalls,
  });
  const linearizedStress = triSegWallRecord((wallId) => {
    const baseMaterial = base.wallMaterialByWall[wallId];
    return requireFinite(
      baseMaterial.totalWallKirchhoffStressPa
        + baseMaterial
          .totalStressPartialPaPerFiberLogStrainAtFixedInternalState
          * (
            trialGeometry.walls[wallId].fiberLogStrain
            - base.geometry.walls[wallId].fiberLogStrain
          ),
      `${wallId}.linearizedPostEventStressPa`,
    );
  });
  const oracle = evaluatePublishedTriSegTaylorOracle2009V1(
    trialGeometry,
    linearizedStress,
  );
  return Object.freeze([
    oracle.equilibriumResidual.axialNPerM,
    oracle.equilibriumResidual.radialNPerM,
  ] as [number, number]);
}

function failure(
  reason: PhaseB1PostEventTriSegReinitializationFailureV1["reason"],
  message: string,
  rollbackEndpoint: PhaseB1EndpointStateV1,
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1,
): PhaseB1PostEventTriSegReinitializationFailureV1 {
  return Object.freeze({
    converged: false,
    solverId: PHASE_B1_POST_EVENT_TRISEG_REINITIALIZATION_V1_ID,
    reason,
    message,
    rollbackEndpoint,
    newtonDiagnostics,
    projectionApplied: false,
    fallbackApplied: false,
    phaseB1Acceptance: false,
    testReferenceOnly: true,
    releaseRuntimeReachable: false,
  });
}

function triSegWallRecord<Value>(
  build: (wallId: TriSegWallId) => Value,
): Readonly<Record<TriSegWallId, Value>> {
  return Object.freeze(Object.fromEntries(TRISEG_WALL_IDS.map((wallId) => [
    wallId,
    build(wallId),
  ]))) as Readonly<Record<TriSegWallId, Value>>;
}

function assertResidualsRoundoffEqual(
  actual: readonly number[],
  expected: readonly number[],
): void {
  for (let index = 0; index < 2; index += 1) {
    const tolerance = 2048 * Number.EPSILON * Math.max(
      1,
      Math.abs(actual[index]),
      Math.abs(expected[index]),
    );
    if (Math.abs(actual[index] - expected[index]) > tolerance) {
      throw new Error("post-event semismooth base residual mismatch");
    }
  }
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (result <= 0) throw new Error(`${field} must be positive`);
  return result;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
