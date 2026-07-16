import type {
  MainWireHemodynamicRuntimeControlsV1,
  MainWireHeartBoundaryNodeNameV1,
  MainWireNonCoronaryCirculationNodeNameV1,
  MainWireNonCoronaryVascularNodeNameV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import {
  MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import {
  propagateExactEventCalciumV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  advanceMainWireDynamicValveApertureBackwardEulerV1,
  type MainWireDynamicValveMomentumV1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/mainWireDynamicValveApertureV1";
import {
  evaluateMainWireNonCoronaryBackwardEulerVolumeResidualV1,
  compileMainWireNonCoronaryPrecompiledContextV1,
  evaluateMainWireNonCoronaryWithPrecompiledContextV1,
  MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_VALVE_FLOW_NAMES_V1,
  type MainWireNonCoronaryBackwardEulerVolumeResidualV1,
  type MainWireNonCoronaryDynamicFlowNameV1,
  type MainWireNonCoronaryPrecompiledContextV1,
  type MainWireNonCoronarySameTimeLevelEvaluationV1,
  type MainWireNonCoronaryValveFlowNameV1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1";
import {
  getRuntimeTriSegEquilibriumResidualV2,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/closedLoopSameTimeLevelV1";
import {
  deriveOdeResidualScalePerSec,
  type FourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  evaluateScaledFivePointAlgorithmicJacobianV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledFivePointAlgorithmicJacobianV1";
import {
  solveScaledDampedNewtonV1,
  type ScaledDampedNewtonDiagnosticsV1,
  type ScaledDampedNewtonFailureReasonV1,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledDampedNewtonV1";
import type { StrictAffineConstraintV1 } from
  "@/engine/myocardium/fourChamberV1/numerics/strictAffineDomainV1";
import {
  PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicNumericalPolicyV1";
import {
  evaluatePhaseB1EventFreeEndpointV1,
  type PhaseB1EventFreeEndpointEvaluationV1,
  type PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1CalciumStateByWallV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1MainWireDistributedNewtonResidualLabelsV1,
  buildPhaseB1MainWireDistributedNewtonUnknownLabelsV1,
  createPhaseB1MainWireDistributedEndpointV1,
  decodePhaseB1MainWireDistributedEndpointNewtonUnknownsV1,
  encodePhaseB1MainWireDistributedEndpointNewtonUnknownsV1,
  type PhaseB1MainWireDistributedEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedEndpointV1";
import type {
  PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  assertPhaseB1WallRuntimeMaterialV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  MainWireVascularPvTrialDomainErrorV1,
  mainWireVascularPhysicalVolumeBoundsM3V1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireVascularPvLawSiV1";
import {
  evaluatePhaseB1WallBackwardEulerV1,
  type PhaseB1WallBackwardEulerEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
export const PHASE_B1_MAIN_WIRE_DISTRIBUTED_MONOLITHIC_BE_V1_ID =
  "four-chamber-phase-b1-main-wire-distributed-monolithic-be-v1" as const;

export const PHASE_B1_MAIN_WIRE_DISTRIBUTED_RESEARCH_MODEL_V1_ID =
  "four-chamber-phase-b1-main-wire-distributed-research-v1" as const;

export const PHASE_B1_MAIN_WIRE_MECHANICS_PROXY_AUDIT_V1 = Object.freeze({
  auditId: "phase-b1-main-wire-mechanics-only-proxy-audit-v1",
  proxyPurpose: "chamber-wall-triseg-pericardial-mechanics-only",
  proxyVascularVolumeRule: Object.freeze({
    SA: "Ao+SA+Art+Cap",
    SV: "SV+VC",
    PA: "PA+PArt+PCap",
    PV: "PVen+PVein",
  }),
  proxyValveFlowsCopied: Object.freeze(["Q_MV", "Q_AoV", "Q_TV", "Q_PuV"]),
  proxyLegacyInletFlows: Object.freeze({ Q_VC: 0, Q_PV: 0 }),
  legacyProxyVascularPressuresConsumed: false,
  legacyProxyAlgebraicFlowsConsumed: false,
  legacyProxyInletMomentumConsumed: false,
  legacyProxyVolumeResidualConsumed: false,
  distributedCirculationOwner:
    "mainWireNonCoronarySameTimeLevelV1.ts",
  circulationIntegrationMode: "replace-not-augment",
  duplicateAggregateCirculationStatePresent: false,
} as const);

export type PhaseB1MainWireDistributedResearchModelV1 = Readonly<{
  modelId: typeof PHASE_B1_MAIN_WIRE_DISTRIBUTED_RESEARCH_MODEL_V1_ID;
  mechanicsProxyModel: PhaseB1EventFreeMonolithicModelV1;
  mainWireRuntimeControls: MainWireHemodynamicRuntimeControlsV1;
  internalPrecompiledCirculationContext:
    MainWireNonCoronaryPrecompiledContextV1;
  vascularExternalPressurePa: Readonly<{ pth: number; palv: number }>;
  maximumNewtonIterations: number;
  researchOnly: true;
  candidatePriorOnly: true;
  physiologicalValidation: false;
  phaseB1Acceptance: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1MainWireDistributedEndpointEvaluationV1 = Readonly<{
  evaluationId: "phase-b1-main-wire-distributed-endpoint-evaluation-v1";
  endpoint: PhaseB1MainWireDistributedEndpointV1;
  mechanicsProxyEndpoint: PhaseB1EndpointStateV1;
  mechanicsProxyEvaluation: PhaseB1EventFreeEndpointEvaluationV1;
  distributedCirculation: MainWireNonCoronarySameTimeLevelEvaluationV1;
  mechanicsProxyAudit: typeof PHASE_B1_MAIN_WIRE_MECHANICS_PROXY_AUDIT_V1;
  chamberAbsolutePressurePa: Readonly<
    Record<MainWireHeartBoundaryNodeNameV1, number>
  >;
  valveApertureState01ByFlow: Readonly<
    Record<MainWireNonCoronaryValveFlowNameV1, number>
  >;
  effectiveValveAreaM2ByFlow: Readonly<
    Record<MainWireNonCoronaryValveFlowNameV1, number>
  >;
  circulationCrossCoupledToChamberWallPressure: true;
  projectionApplied: false;
  hiddenStateClippingApplied: false;
  fallbackApplied: false;
}>;

export type PhaseB1MainWireDistributedResidualEvaluationV1 = Readonly<{
  residual: readonly number[];
  residualLabels: readonly string[];
  volumeResidual: MainWireNonCoronaryBackwardEulerVolumeResidualV1;
  momentumResidualPaByFlow: Readonly<
    Record<MainWireNonCoronaryDynamicFlowNameV1, number>
  >;
  wallBackwardEulerByWall: Readonly<
    Record<FourChamberWallId, PhaseB1WallBackwardEulerEvaluationV1>
  >;
  landResidualPerSecByWall: Readonly<
    Record<FourChamberWallId, readonly number[]>
  >;
  slsResidualPerSecByWall:
    | Readonly<Record<FourChamberWallId, number>>
    | null;
  triSegResidualNPerM: Readonly<{ axial: number; radial: number }>;
  nextEndpoint: PhaseB1MainWireDistributedEndpointV1;
  nextEvaluation: PhaseB1MainWireDistributedEndpointEvaluationV1;
  calciumResidualCount: 0;
  mechanicsProxyCirculationResidualConsumed: false;
  projectionApplied: false;
  hiddenStateClippingApplied: false;
  fallbackApplied: false;
}>;

export type PhaseB1MainWireDistributedStepSuccessV1 = Readonly<{
  converged: true;
  solverId: typeof PHASE_B1_MAIN_WIRE_DISTRIBUTED_MONOLITHIC_BE_V1_ID;
  modelId: typeof PHASE_B1_MAIN_WIRE_DISTRIBUTED_RESEARCH_MODEL_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  unknownCount: 58 | 53;
  residualCount: 58 | 53;
  storedDifferentialStateCount: 70 | 65;
  calciumStoredStateCount: 10;
  calciumNewtonUnknownCount: 0;
  calciumResidualCount: 0;
  previousEndpoint: PhaseB1MainWireDistributedEndpointV1;
  nextEndpointLeftLimit: PhaseB1MainWireDistributedEndpointV1;
  calciumDriveStateByWallAtEndLeftLimit: PhaseB1CalciumStateByWallV1;
  previousEvaluation: PhaseB1MainWireDistributedEndpointEvaluationV1;
  nextEvaluation: PhaseB1MainWireDistributedEndpointEvaluationV1;
  residualEvaluation: PhaseB1MainWireDistributedResidualEvaluationV1;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  minimumLandSimplexMargin: number;
  minimumVascularPvDomainMarginM3: number;
  totalBloodVolumeChangeM3: number;
  summedVolumeResidualM3PerSec: number;
  algorithmicJacobian:
    "exploratory-nonlinear-scaled-five-point-no-generalized-jacobian-audit";
  generalizedJacobianAuditClaimed: false;
  semismoothActiveSetFrozen: false;
  eventFree: true;
  innerLandSolveUsed: false;
  projectionApplied: false;
  hiddenStateClippingApplied: false;
  postStepBloodVolumeProjectionApplied: false;
  flowClampApplied: false;
  fallbackApplied: false;
  researchOnly: true;
  physiologicalValidation: false;
  phaseB1Acceptance: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1MainWireDistributedStepFailureV1 = Readonly<{
  converged: false;
  solverId: typeof PHASE_B1_MAIN_WIRE_DISTRIBUTED_MONOLITHIC_BE_V1_ID;
  modelId: typeof PHASE_B1_MAIN_WIRE_DISTRIBUTED_RESEARCH_MODEL_V1_ID;
  slsMode: PhaseB1SlsModeV1;
  unknownCount: 58 | 53;
  reason: ScaledDampedNewtonFailureReasonV1 | "final-evaluation-failed";
  failureClass:
    | "recoverable-trial-domain"
    | "recoverable-nonlinear-convergence"
    | "terminal-model-evaluation"
    | "terminal-accepted-state-evaluation";
  retryableByStepSubdivision: boolean;
  message: string;
  rollbackEndpoint: PhaseB1MainWireDistributedEndpointV1;
  lastAcceptedDiagnosticEndpoint: PhaseB1MainWireDistributedEndpointV1 | null;
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1;
  projectionApplied: false;
  hiddenStateClippingApplied: false;
  postStepBloodVolumeProjectionApplied: false;
  flowClampApplied: false;
  fallbackApplied: false;
  researchOnly: true;
  physiologicalValidation: false;
  phaseB1Acceptance: false;
  browserRuntimeAdopted: false;
  releaseRuntimeReachable: false;
}>;

export type PhaseB1MainWireDistributedStepResultV1 =
  | PhaseB1MainWireDistributedStepSuccessV1
  | PhaseB1MainWireDistributedStepFailureV1;

export function createPhaseB1MainWireDistributedResearchModelV1(
  input: Omit<
    PhaseB1MainWireDistributedResearchModelV1,
    | "modelId"
    | "internalPrecompiledCirculationContext"
    | "researchOnly"
    | "candidatePriorOnly"
    | "physiologicalValidation"
    | "phaseB1Acceptance"
    | "browserRuntimeAdopted"
    | "releaseRuntimeReachable"
  >,
): PhaseB1MainWireDistributedResearchModelV1 {
  assertExactPlainRecordV1(
    input,
    [
      "mechanicsProxyModel",
      "mainWireRuntimeControls",
      "vascularExternalPressurePa",
      "maximumNewtonIterations",
    ],
    "Phase B1 main-wire distributed model input",
  );
  assertExactPlainRecordV1(
    input.vascularExternalPressurePa,
    ["pth", "palv"],
    "vascularExternalPressurePa",
  );
  if (
    !Number.isInteger(input.maximumNewtonIterations)
    || input.maximumNewtonIterations <= 0
  ) {
    throw new Error("maximumNewtonIterations must be a positive integer");
  }
  const vascularPthPa = requireFinite(
    input.vascularExternalPressurePa.pth,
    "vascularExternalPressurePa.pth",
  );
  requireFinite(input.vascularExternalPressurePa.palv, "vascularExternalPressurePa.palv");
  assertCommonIntrathoracicPressureGaugeV1(
    vascularPthPa,
    input.mechanicsProxyModel.closedLoopParameters.intrathoracicPressurePa,
  );
  const internalPrecompiledCirculationContext =
    compileMainWireNonCoronaryPrecompiledContextV1(
      input.mainWireRuntimeControls,
    );
  const resolvedGraph = internalPrecompiledCirculationContext.resolvedGraph;
  if (resolvedGraph.dynamicEdgeNames.join(",") !== "Ao_SA,PA_PArt") {
    throw new Error(
      "distributed V1 requires exactly two dynamic vascular roots; PVein_LA or another edge cannot become a hidden seventh flow",
    );
  }
  return Object.freeze({
    modelId: PHASE_B1_MAIN_WIRE_DISTRIBUTED_RESEARCH_MODEL_V1_ID,
    mechanicsProxyModel: input.mechanicsProxyModel,
    mainWireRuntimeControls: resolvedGraph.runtimeControls,
    internalPrecompiledCirculationContext,
    vascularExternalPressurePa: Object.freeze({ ...input.vascularExternalPressurePa }),
    maximumNewtonIterations: input.maximumNewtonIterations,
    researchOnly: true as const,
    candidatePriorOnly: true as const,
    physiologicalValidation: false as const,
    phaseB1Acceptance: false as const,
    browserRuntimeAdopted: false as const,
    releaseRuntimeReachable: false as const,
  });
}

export function evaluatePhaseB1MainWireDistributedEndpointV1(input: Readonly<{
  model: PhaseB1MainWireDistributedResearchModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  endpoint: PhaseB1MainWireDistributedEndpointV1;
}>): PhaseB1MainWireDistributedEndpointEvaluationV1 {
  assertExactPlainRecordV1(
    input,
    ["model", "wallMaterialBinding", "endpoint"],
    "distributed endpoint evaluation input",
  );
  validateModel(input.model);
  const endpoint = createPhaseB1MainWireDistributedEndpointV1({
    timeSec: input.endpoint.timeSec,
    differentialState: input.endpoint.differentialState,
    triSegCoordinates: input.endpoint.triSegCoordinates,
  });
  const mechanicsProxyEndpoint = buildMechanicsProxyEndpoint(endpoint);
  const mechanicsProxyEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    input.model.mechanicsProxyModel,
    input.wallMaterialBinding,
    mechanicsProxyEndpoint,
  );
  const chamberAbsolutePressurePa = Object.freeze({
    LV: mechanicsProxyEvaluation.closedLoop.chamberAbsolutePressurePa.LV,
    LA: mechanicsProxyEvaluation.closedLoop.chamberAbsolutePressurePa.LA,
    RV: mechanicsProxyEvaluation.closedLoop.chamberAbsolutePressurePa.RV,
    RA: mechanicsProxyEvaluation.closedLoop.chamberAbsolutePressurePa.RA,
  });
  const distributedCirculation = evaluateMainWireNonCoronaryWithPrecompiledContextV1({
    state: Object.freeze({
      bloodVolumesM3: endpoint.differentialState.bloodVolumesM3,
      dynamicFlowsM3PerSec: endpoint.differentialState.dynamicFlowsM3PerSec,
      valveApertureState01ByFlow:
        endpoint.differentialState.valveApertureState01ByFlow,
    }),
    chamberAbsolutePressurePa,
    externalPressurePa: input.model.vascularExternalPressurePa,
    precompiledContext: input.model.internalPrecompiledCirculationContext,
  });
  for (const chamber of ["LV", "LA", "RV", "RA"] as const) {
    assertRoundoffEqual(
      distributedCirculation.absolutePressurePaByNode[chamber],
      chamberAbsolutePressurePa[chamber],
      `distributed ${chamber} chamber pressure coupling`,
    );
  }
  return Object.freeze({
    evaluationId: "phase-b1-main-wire-distributed-endpoint-evaluation-v1",
    endpoint,
    mechanicsProxyEndpoint,
    mechanicsProxyEvaluation,
    distributedCirculation,
    mechanicsProxyAudit: PHASE_B1_MAIN_WIRE_MECHANICS_PROXY_AUDIT_V1,
    chamberAbsolutePressurePa,
    valveApertureState01ByFlow:
      endpoint.differentialState.valveApertureState01ByFlow,
    effectiveValveAreaM2ByFlow: valveFlowRecord((flowName) =>
      distributedCirculation.valveMomentumByFlow[flowName].effectiveAreaM2),
    circulationCrossCoupledToChamberWallPressure: true as const,
    projectionApplied: false as const,
    hiddenStateClippingApplied: false as const,
    fallbackApplied: false as const,
  });
}

export function stepPhaseB1MainWireDistributedMonolithicBackwardEulerV1(
  input: Readonly<{
    model: PhaseB1MainWireDistributedResearchModelV1;
    wallMaterialBinding: PhaseB1WallMaterialBindingV1;
    previousEndpoint: PhaseB1MainWireDistributedEndpointV1;
    dtSec: number;
  }>,
): PhaseB1MainWireDistributedStepResultV1 {
  assertExactPlainRecordV1(
    input,
    ["model", "wallMaterialBinding", "previousEndpoint", "dtSec"],
    "distributed monolithic step input",
  );
  validateModel(input.model);
  const dtSec = requirePositiveFinite(input.dtSec, "dtSec");
  const previousEndpoint = createPhaseB1MainWireDistributedEndpointV1({
    timeSec: input.previousEndpoint.timeSec,
    differentialState: input.previousEndpoint.differentialState,
    triSegCoordinates: input.previousEndpoint.triSegCoordinates,
  });
  assertAcceptedAtrialPopulationOnlyZeroDistortionV1(
    previousEndpoint,
    input.wallMaterialBinding,
  );
  const slsMode = previousEndpoint.differentialState.slsMode;
  const layout = buildLayout(
    input.model.mechanicsProxyModel.newtonScaleRegistry,
    slsMode,
    input.model.internalPrecompiledCirculationContext,
  );
  const calciumDriveStateByWallAtEndLeftLimit = propagateCalciumByWall(
    previousEndpoint.differentialState.calciumByWall,
    input.wallMaterialBinding,
    dtSec,
  );
  const previousEvaluation = evaluatePhaseB1MainWireDistributedEndpointV1({
    model: input.model,
    wallMaterialBinding: input.wallMaterialBinding,
    endpoint: previousEndpoint,
  });
  const initialUnknowns = encodePhaseB1MainWireDistributedEndpointNewtonUnknownsV1(
    previousEndpoint,
  );
  assertInsideLandDomain(initialUnknowns, layout);
  const decodeEndpoint = (unknowns: readonly number[]) =>
    decodePhaseB1MainWireDistributedEndpointNewtonUnknownsV1({
      timeSec: previousEndpoint.timeSec + dtSec,
      slsMode,
      calciumByWall: calciumDriveStateByWallAtEndLeftLimit,
      valveApertureState01ByFlow:
        previousEndpoint.differentialState.valveApertureState01ByFlow,
      unknowns,
    });
  const evaluateResidual = (unknowns: readonly number[]) =>
    evaluateDistributedResidual(
      input.model,
      input.wallMaterialBinding,
      previousEndpoint,
      previousEvaluation,
      decodeEndpoint(unknowns),
      dtSec,
    );
  const newton = solveScaledDampedNewtonV1({
    initialUnknowns,
    unknownScales: layout.unknownScales,
    residualScales: layout.residualScales,
    strictLowerBounds: layout.strictLowerBounds,
    strictAffineConstraints: layout.strictAffineConstraints,
    options: {
      maxIterations: input.model.maximumNewtonIterations,
      residualInfinityTolerance:
        input.model.mechanicsProxyModel.newtonScaleRegistry.tolerances
          .globalResidualInfinityNorm,
      updateInfinityTolerance:
        input.model.mechanicsProxyModel.newtonScaleRegistry.tolerances
          .globalUpdateInfinityNorm,
      armijoCoefficient:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.armijoCoefficient,
      lineSearchContraction:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.lineSearchContraction,
      maxLineSearchBacktracks:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.maxLineSearchBacktracks,
      minimumStepLength:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.minimumStepLength,
      fractionToBoundarySafety:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.fractionToBoundarySafety,
      relativePivotTolerance:
        PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1.relativePivotTolerance,
    },
    evaluate: (unknowns) => {
      try {
        const base = evaluateResidual(unknowns);
        const residualOnly = (trial: readonly number[]) =>
          evaluateResidual(trial).residual;
        const jacobian = evaluateScaledFivePointAlgorithmicJacobianV1(
          residualOnly,
          unknowns,
          {
            unknownScales: layout.unknownScales,
            residualScales: layout.residualScales,
            lowerBounds: layout.strictLowerBounds,
            strictAffineConstraints: layout.strictAffineConstraints,
            scaledStep:
              PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
                .algorithmicJacobianScaledStep,
          },
        );
        return {
          status: "ok" as const,
          residual: base.residual,
          jacobianRowMajor: jacobian.rawJacobian.flat(),
          diagnostic: Object.freeze({
            maximumAbsoluteVolumeResidualM3PerSec: Math.max(
              ...Object.values(base.volumeResidual.residualM3PerSecByNode)
                .map(Math.abs),
            ),
            triSegResidualNPerM: Math.hypot(
              base.triSegResidualNPerM.axial,
              base.triSegResidualNPerM.radial,
            ),
            algorithmicJacobian:
              "exploratory-nonlinear-scaled-five-point-no-generalized-jacobian-audit",
          }),
        };
      } catch (error) {
        if (!(error instanceof MainWireVascularPvTrialDomainErrorV1)) {
          throw error;
        }
        return {
          status: "inadmissible" as const,
          reason: errorMessage(error),
        };
      }
    },
  });
  if (newton.converged === false) {
    let lastAcceptedDiagnosticEndpoint: PhaseB1MainWireDistributedEndpointV1 | null = null;
    try {
      lastAcceptedDiagnosticEndpoint = evaluateDistributedResidual(
        input.model,
        input.wallMaterialBinding,
        previousEndpoint,
        previousEvaluation,
        decodeEndpoint(newton.lastAcceptedUnknowns),
        dtSec,
      ).nextEndpoint;
    } catch {
      lastAcceptedDiagnosticEndpoint = null;
    }
    const classification = classifyNewtonFailureV1(newton.reason);
    return failureResult(
      input.model,
      slsMode,
      layout.unknownCount,
      newton.reason,
      classification.failureClass,
      classification.retryableByStepSubdivision,
      newton.message,
      previousEndpoint,
      lastAcceptedDiagnosticEndpoint,
      newton.diagnostics,
    );
  }
  try {
    const residualEvaluation = evaluateDistributedResidual(
      input.model,
      input.wallMaterialBinding,
      previousEndpoint,
      previousEvaluation,
      decodeEndpoint(newton.unknowns),
      dtSec,
    );
    const nextEndpointLeftLimit = residualEvaluation.nextEndpoint;
    assertAcceptedAtrialPopulationOnlyZeroDistortionV1(
      nextEndpointLeftLimit,
      input.wallMaterialBinding,
    );
    const minimumLandSimplexMargin = minimumLandMargin(
      newton.unknowns,
      layout,
    );
    if (!(minimumLandSimplexMargin > 0)) {
      throw new Error("accepted Land state is outside its strict simplex");
    }
    const minimumVascularPvDomainMarginM3 = vascularPvDomainMarginM3(
      nextEndpointLeftLimit,
      input.model.internalPrecompiledCirculationContext,
    );
    const totalBloodVolumeChangeM3 = sumDistributedVolumes(
      nextEndpointLeftLimit,
    ) - sumDistributedVolumes(previousEndpoint);
    return Object.freeze({
      converged: true as const,
      solverId: PHASE_B1_MAIN_WIRE_DISTRIBUTED_MONOLITHIC_BE_V1_ID,
      modelId: input.model.modelId,
      slsMode,
      unknownCount: layout.unknownCount,
      residualCount: layout.unknownCount,
      storedDifferentialStateCount: slsMode === "on" ? 70 as const : 65 as const,
      calciumStoredStateCount: 10 as const,
      calciumNewtonUnknownCount: 0 as const,
      calciumResidualCount: 0 as const,
      previousEndpoint,
      nextEndpointLeftLimit,
      calciumDriveStateByWallAtEndLeftLimit,
      previousEvaluation,
      nextEvaluation: residualEvaluation.nextEvaluation,
      residualEvaluation,
      newtonDiagnostics: newton.diagnostics,
      minimumLandSimplexMargin,
      minimumVascularPvDomainMarginM3,
      totalBloodVolumeChangeM3,
      summedVolumeResidualM3PerSec:
        residualEvaluation.volumeResidual.summedResidualM3PerSec,
      algorithmicJacobian:
        "exploratory-nonlinear-scaled-five-point-no-generalized-jacobian-audit" as const,
      generalizedJacobianAuditClaimed: false as const,
      semismoothActiveSetFrozen: false as const,
      eventFree: true as const,
      innerLandSolveUsed: false as const,
      projectionApplied: false as const,
      hiddenStateClippingApplied: false as const,
      postStepBloodVolumeProjectionApplied: false as const,
      flowClampApplied: false as const,
      fallbackApplied: false as const,
      researchOnly: true as const,
      physiologicalValidation: false as const,
      phaseB1Acceptance: false as const,
      browserRuntimeAdopted: false as const,
      releaseRuntimeReachable: false as const,
    });
  } catch (error) {
    return failureResult(
      input.model,
      slsMode,
      layout.unknownCount,
      "final-evaluation-failed",
      "terminal-accepted-state-evaluation",
      false,
      errorMessage(error),
      previousEndpoint,
      null,
      newton.diagnostics,
    );
  }
}

function evaluateDistributedResidual(
  model: PhaseB1MainWireDistributedResearchModelV1,
  binding: PhaseB1WallMaterialBindingV1,
  previousEndpoint: PhaseB1MainWireDistributedEndpointV1,
  previousEvaluation: PhaseB1MainWireDistributedEndpointEvaluationV1,
  nextEndpoint: PhaseB1MainWireDistributedEndpointV1,
  dtSec: number,
): PhaseB1MainWireDistributedResidualEvaluationV1 {
  const previous = previousEndpoint.differentialState;
  const provisionalNext = nextEndpoint.differentialState;
  if (previous.slsMode !== provisionalNext.slsMode) {
    throw new Error("SLS topology cannot change within a distributed step");
  }
  const provisionalEvaluation = evaluatePhaseB1MainWireDistributedEndpointV1({
    model,
    wallMaterialBinding: binding,
    endpoint: nextEndpoint,
  });
  const valveApertureState01ByFlow = valveFlowRecord((flowName) =>
    advanceMainWireDynamicValveApertureBackwardEulerV1({
      parameters:
        model.internalPrecompiledCirculationContext
          .dynamicValveParametersByFlow[flowName],
      previousApertureState01:
        previous.valveApertureState01ByFlow[flowName],
      pressureGradientPa:
        provisionalEvaluation.distributedCirculation
          .valveMomentumByFlow[flowName].pressureGradientPa,
      timeStepSec: dtSec,
    }).nextApertureState01);
  const nextEndpointWithCondensedValveApertures =
    createPhaseB1MainWireDistributedEndpointV1({
      timeSec: nextEndpoint.timeSec,
      differentialState: provisionalNext.slsMode === "on"
        ? Object.freeze({
            ...provisionalNext,
            slsMode: "on" as const,
            valveApertureState01ByFlow,
          })
        : Object.freeze({
            ...provisionalNext,
            slsMode: "off" as const,
            valveApertureState01ByFlow,
          }),
      triSegCoordinates: nextEndpoint.triSegCoordinates,
    });
  const next = nextEndpointWithCondensedValveApertures.differentialState;
  const nextEvaluation = evaluatePhaseB1MainWireDistributedEndpointV1({
    model,
    wallMaterialBinding: binding,
    endpoint: nextEndpointWithCondensedValveApertures,
  });
  assertValvePressureGradientInvariantAcrossApertureCondensation(
    provisionalEvaluation,
    nextEvaluation,
  );
  const volumeResidual = evaluateMainWireNonCoronaryBackwardEulerVolumeResidualV1({
    previousBloodVolumesM3: previous.bloodVolumesM3,
    nextBloodVolumesM3: next.bloodVolumesM3,
    nextFlowsM3PerSec:
      nextEvaluation.distributedCirculation.allFlowsM3PerSec,
    timeStepSec: dtSec,
  });
  const momentumResidualPaByFlow = dynamicFlowRecord((flowName) => {
    const acceleration = nextEvaluation.distributedCirculation
      .dynamicFlowAccelerationM3PerSec2[flowName];
    const inertance = dynamicFlowInertance(
      nextEvaluation.distributedCirculation,
      flowName,
    );
    return requireFinite(
      inertance * (
        (next.dynamicFlowsM3PerSec[flowName]
          - previous.dynamicFlowsM3PerSec[flowName]) / dtSec
        - acceleration
      ),
      `momentumResidualPaByFlow.${flowName}`,
    );
  });
  const wallBackwardEulerByWall = wallRecord((wallId) =>
    evaluatePhaseB1WallBackwardEulerV1({
      wallMaterial: assertPhaseB1WallRuntimeMaterialV1(
        binding.runtimeByWall[wallId],
      ),
      previousFiberLogStrain:
        previousEvaluation.mechanicsProxyEvaluation
          .wallMaterialByWall[wallId].fiberLogStrain,
      nextFiberLogStrain:
        nextEvaluation.mechanicsProxyEvaluation
          .wallMaterialByWall[wallId].fiberLogStrain,
      endpointFreeCalciumUM:
        nextEvaluation.mechanicsProxyEvaluation
          .freeCalciumUMByWall[wallId],
      previousLandState: previous.landByWall[wallId],
      nextLandState: next.landByWall[wallId],
      slsMode: next.slsMode,
      previousAlphaV: previous.slsMode === "on"
        ? previous.slsAlphaVByWall[wallId]
        : null,
      nextAlphaV: next.slsMode === "on"
        ? next.slsAlphaVByWall[wallId]
        : null,
      dtSec,
    }));
  const landResidualPerSecByWall = wallRecord((wallId) => Object.freeze(
    wallBackwardEulerByWall[wallId].landResidual.map((value, row) =>
      requireFinite(value / dtSec, `${wallId}.landResidual[${row}]PerSec`)),
  ));
  const slsResidualPerSecByWall = next.slsMode === "on"
    ? wallRecord((wallId) => requireFinite(
        requireFinite(
          wallBackwardEulerByWall[wallId].slsResidual,
          `${wallId}.slsResidual`,
        ) / dtSec,
        `${wallId}.slsResidualPerSec`,
      ))
    : null;
  const triSeg = getRuntimeTriSegEquilibriumResidualV2(
    nextEvaluation.mechanicsProxyEvaluation.closedLoop,
  );
  const triSegResidualNPerM = Object.freeze({
    axial: triSeg.axialNPerM,
    radial: triSeg.radialNPerM,
  });
  const residual = Object.freeze([
    ...MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.map(
      (nodeName) => volumeResidual.residualM3PerSecByNode[nodeName],
    ),
    ...MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1.map(
      (flowName) => momentumResidualPaByFlow[flowName],
    ),
    ...WALL_IDS.flatMap((wallId) => landResidualPerSecByWall[wallId]),
    ...(slsResidualPerSecByWall === null
      ? []
      : WALL_IDS.map((wallId) => slsResidualPerSecByWall[wallId])),
    triSegResidualNPerM.axial,
    triSegResidualNPerM.radial,
  ]);
  const residualLabels = buildPhaseB1MainWireDistributedNewtonResidualLabelsV1(
    next.slsMode,
  );
  if (residual.length !== residualLabels.length) {
    throw new Error("distributed residual dimension drifted");
  }
  residual.forEach((value, index) => requireFinite(value, `residual[${index}]`));
  return Object.freeze({
    residual,
    residualLabels,
    volumeResidual,
    momentumResidualPaByFlow,
    wallBackwardEulerByWall,
    landResidualPerSecByWall,
    slsResidualPerSecByWall,
    triSegResidualNPerM,
    nextEndpoint: nextEndpointWithCondensedValveApertures,
    nextEvaluation,
    calciumResidualCount: 0 as const,
    mechanicsProxyCirculationResidualConsumed: false as const,
    projectionApplied: false as const,
    hiddenStateClippingApplied: false as const,
    fallbackApplied: false as const,
  });
}

function buildMechanicsProxyEndpoint(
  endpoint: PhaseB1MainWireDistributedEndpointV1,
): PhaseB1EndpointStateV1 {
  const state = endpoint.differentialState;
  const bloodVolumesM3 = Object.freeze({
    LA: state.bloodVolumesM3.LA,
    LV: state.bloodVolumesM3.LV,
    SA: sumNodeVolumes(state.bloodVolumesM3, ["Ao", "SA", "Art", "Cap"]),
    SV: sumNodeVolumes(state.bloodVolumesM3, ["SV", "VC"]),
    RA: state.bloodVolumesM3.RA,
    RV: state.bloodVolumesM3.RV,
    PA: sumNodeVolumes(state.bloodVolumesM3, ["PA", "PArt", "PCap"]),
    PV: sumNodeVolumes(state.bloodVolumesM3, ["PVen", "PVein"]),
  });
  const inertialFlowsM3PerSec = Object.freeze({
    Q_MV: state.dynamicFlowsM3PerSec.Q_MV,
    Q_AoV: state.dynamicFlowsM3PerSec.Q_AoV,
    Q_VC: 0,
    Q_TV: state.dynamicFlowsM3PerSec.Q_TV,
    Q_PuV: state.dynamicFlowsM3PerSec.Q_PuV,
    Q_PV: 0,
  });
  const differentialState = state.slsMode === "on"
    ? Object.freeze({
        slsMode: "on" as const,
        bloodVolumesM3,
        inertialFlowsM3PerSec,
        calciumByWall: state.calciumByWall,
        landByWall: state.landByWall,
        slsAlphaVByWall: state.slsAlphaVByWall,
      })
    : Object.freeze({
        slsMode: "off" as const,
        bloodVolumesM3,
        inertialFlowsM3PerSec,
        calciumByWall: state.calciumByWall,
        landByWall: state.landByWall,
      });
  return createPhaseB1EndpointStateV1({
    timeSec: endpoint.timeSec,
    differentialState,
    triSegCoordinates: endpoint.triSegCoordinates,
  });
}

function buildLayout(
  registry: FourChamberNewtonScaleRegistryV1,
  slsMode: PhaseB1SlsModeV1,
  circulationContext: MainWireNonCoronaryPrecompiledContextV1,
) {
  const labels = buildPhaseB1MainWireDistributedNewtonUnknownLabelsV1(slsMode);
  const unknownScales = labels.map((label) =>
    scaleForLabel(label, registry, circulationContext));
  const residualScales = labels.map((label) => {
    if (label.startsWith("circulation.main-wire.volume.")) {
      return deriveOdeResidualScalePerSec(
        scaleForLabel(label, registry, circulationContext),
      );
    }
    if (label.startsWith("circulation.main-wire.dynamic-flow.")) {
      return registry.residualScales.flowMomentumPa;
    }
    if (label.includes(".land.") || label.includes(".sls.")) {
      return deriveOdeResidualScalePerSec(
        scaleForLabel(label, registry, circulationContext),
      );
    }
    if (label.startsWith("algebraic.triseg.")) {
      return registry.residualScales.publishedTriSegEquilibriumNPerM;
    }
    throw new Error(`no distributed residual scale for ${label}`);
  });
  const strictLowerBounds: Array<number | null> = labels.map((label) =>
    /\.land\.(CaTRPN|B|W|S)$/.test(label) ? 0 : null);
  for (let index = 0; index < 15; index += 1) {
    strictLowerBounds[index] =
      PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
        .strictBloodVolumeLowerBoundM3;
  }
  strictLowerBounds[labels.length - 1] =
    PHASE_B1_EVENT_FREE_MONOLITHIC_NUMERICAL_POLICY_V1
      .strictJunctionRadiusLowerBoundM;
  const vascularStrictAffineConstraints: StrictAffineConstraintV1[] = [];
  for (const nodeName of MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1) {
    const law = circulationContext.vascularPvLawByNode[nodeName];
    const bounds = mainWireVascularPhysicalVolumeBoundsM3V1(law);
    if (bounds === null) continue;
    const volumeIndex = requiredLabelIndex(
      labels,
      `circulation.main-wire.volume.${nodeName}`,
    );
    strictLowerBounds[volumeIndex] = Math.max(
      strictLowerBounds[volumeIndex] ?? Number.NEGATIVE_INFINITY,
      bounds.minimumM3,
    );
    vascularStrictAffineConstraints.push(Object.freeze({
      constraintId: `${nodeName}.vascular-pv-upper-volume-bound`,
      coefficients: basis(labels.length, [[volumeIndex, -1]]),
      lowerBound: -bounds.maximumM3,
    }));
  }
  const landStrictAffineConstraints: StrictAffineConstraintV1[] = [];
  for (const wallId of WALL_IDS) {
    const ca = requiredLabelIndex(
      labels,
      `tissue.${wallId}.patch-0.land.CaTRPN`,
    );
    const b = requiredLabelIndex(labels, `tissue.${wallId}.patch-0.land.B`);
    const w = requiredLabelIndex(labels, `tissue.${wallId}.patch-0.land.W`);
    const s = requiredLabelIndex(labels, `tissue.${wallId}.patch-0.land.S`);
    landStrictAffineConstraints.push(Object.freeze({
      constraintId: `${wallId}.one-minus-CaTRPN-positive`,
      coefficients: basis(labels.length, [[ca, -1]]),
      lowerBound: -1,
    }));
    landStrictAffineConstraints.push(Object.freeze({
      constraintId: `${wallId}.unbound-population-U-positive`,
      coefficients: basis(labels.length, [[b, -1], [w, -1], [s, -1]]),
      lowerBound: -1,
    }));
  }
  const strictAffineConstraints = Object.freeze([
    ...vascularStrictAffineConstraints,
    ...landStrictAffineConstraints,
  ]);
  const unknownCount = labels.length as 58 | 53;
  if (
    unknownCount !== (slsMode === "on" ? 58 : 53)
    || unknownScales.length !== unknownCount
    || residualScales.length !== unknownCount
    || strictLowerBounds.length !== unknownCount
  ) {
    throw new Error("distributed Newton layout dimension drifted");
  }
  return Object.freeze({
    unknownCount,
    labels,
    unknownScales: Object.freeze(unknownScales),
    residualScales: Object.freeze(residualScales),
    strictLowerBounds: Object.freeze(strictLowerBounds),
    vascularStrictAffineConstraints:
      Object.freeze(vascularStrictAffineConstraints),
    landStrictAffineConstraints: Object.freeze(landStrictAffineConstraints),
    strictAffineConstraints,
  });
}

function scaleForLabel(
  label: string,
  registry: FourChamberNewtonScaleRegistryV1,
  circulationContext: MainWireNonCoronaryPrecompiledContextV1,
): number {
  const volume = /^circulation\.main-wire\.volume\.(.+)$/.exec(label);
  if (volume !== null) {
    const node = volume[1] as MainWireNonCoronaryCirculationNodeNameV1;
    if (node === "LA" || node === "LV" || node === "RA" || node === "RV") {
      return registry.unknownScales.bloodVolumeM3[node];
    }
    const source = circulationContext.resolvedGraph.vascularNodes
      .find((candidate) => candidate.name === node);
    if (source === undefined) throw new Error(`unknown main-wire volume node ${node}`);
    return Math.max(
      Math.abs(source.effectiveUnstressedVolumeMl),
      Math.abs(source.sourceSpecMainWireUnits.x0),
      10,
    ) * 1e-6;
  }
  if (label.startsWith("circulation.main-wire.dynamic-flow.")) {
    return registry.unknownScales.inertialFlowM3PerSec;
  }
  if (/\.land\.(CaTRPN|B|W|S)$/.test(label)) {
    return registry.unknownScales.calciumAndPopulation;
  }
  const distortion = /^tissue\.(LA|RA|LVFW|SEP|RVFW)\.patch-0\.land\.xi[WS]$/.exec(
    label,
  );
  if (distortion !== null) {
    return registry.unknownScales.landDistortionByWall[
      distortion[1] as FourChamberWallId
    ];
  }
  if (label.endsWith(".sls.alphaV")) {
    return registry.unknownScales.slsViscousStrain;
  }
  if (label === "algebraic.triseg.V_m_S") {
    return registry.unknownScales.septalMidwallVolumeM3;
  }
  if (label === "algebraic.triseg.y_m") {
    return registry.unknownScales.junctionRadiusM;
  }
  throw new Error(`no distributed unknown scale for ${label}`);
}

function vascularPvDomainMarginM3(
  endpoint: PhaseB1MainWireDistributedEndpointV1,
  circulationContext: MainWireNonCoronaryPrecompiledContextV1,
): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (const nodeName of MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1) {
    const law = circulationContext.vascularPvLawByNode[nodeName];
    const bounds = mainWireVascularPhysicalVolumeBoundsM3V1(law);
    if (bounds === null) continue;
    const volume = endpoint.differentialState.bloodVolumesM3[nodeName];
    minimum = Math.min(
      minimum,
      volume - bounds.minimumM3,
      bounds.maximumM3 - volume,
    );
  }
  return requireFinite(minimum, "minimum vascular PV domain margin");
}

function propagateCalciumByWall(
  calciumAtStart: PhaseB1CalciumStateByWallV1,
  binding: PhaseB1WallMaterialBindingV1,
  dtSec: number,
): PhaseB1CalciumStateByWallV1 {
  return wallRecord((wallId) => {
    const state = calciumAtStart[wallId];
    const material = assertPhaseB1WallRuntimeMaterialV1(
      binding.runtimeByWall[wallId],
    );
    const propagated = propagateExactEventCalciumV1(
      [state.r, state.d],
      dtSec,
      material.prescribedCalciumParameters,
    );
    return Object.freeze({ r: propagated[0], d: propagated[1] });
  });
}

function dynamicFlowInertance(
  evaluation: MainWireNonCoronarySameTimeLevelEvaluationV1,
  flowName: MainWireNonCoronaryDynamicFlowNameV1,
): number {
  if (MAIN_WIRE_NON_CORONARY_VALVE_FLOW_NAMES_V1.includes(
    flowName as MainWireNonCoronaryValveFlowNameV1,
  )) {
    return (evaluation.valveMomentumByFlow[
      flowName as MainWireNonCoronaryValveFlowNameV1
    ] as MainWireDynamicValveMomentumV1).inertancePaSec2PerM3;
  }
  if (flowName !== "Ao_SA" && flowName !== "PA_PArt") {
    throw new Error(`unsupported distributed dynamic flow ${flowName}`);
  }
  const root = evaluation.vascularFlowEvaluationByFlow[flowName];
  if (root.integrationClass !== "dynamic-flow-state") {
    throw new Error(`${flowName} lost its dynamic-flow state`);
  }
  return root.inertancePaSec2PerM3;
}

function validateModel(model: PhaseB1MainWireDistributedResearchModelV1): void {
  assertExactPlainRecordV1(model, [
    "modelId",
    "mechanicsProxyModel",
    "mainWireRuntimeControls",
    "internalPrecompiledCirculationContext",
    "vascularExternalPressurePa",
    "maximumNewtonIterations",
    "researchOnly",
    "candidatePriorOnly",
    "physiologicalValidation",
    "phaseB1Acceptance",
    "browserRuntimeAdopted",
    "releaseRuntimeReachable",
  ], "Phase B1 main-wire distributed model");
  if (model.modelId !== PHASE_B1_MAIN_WIRE_DISTRIBUTED_RESEARCH_MODEL_V1_ID) {
    throw new Error("distributed research model ID is invalid");
  }
  if (
    model.researchOnly !== true
    || model.candidatePriorOnly !== true
    || model.physiologicalValidation !== false
    || model.phaseB1Acceptance !== false
    || model.browserRuntimeAdopted !== false
    || model.releaseRuntimeReachable !== false
  ) {
    throw new Error("distributed model must remain research-only and fail closed");
  }
  if (!Number.isInteger(model.maximumNewtonIterations)
      || model.maximumNewtonIterations <= 0) {
    throw new Error("distributed maximumNewtonIterations is invalid");
  }
  const context = model.internalPrecompiledCirculationContext;
  if (context.resolvedGraph.runtimeControls !== model.mainWireRuntimeControls) {
    throw new Error("distributed model controls are not bound to its internal precompiled context");
  }
  assertCommonIntrathoracicPressureGaugeV1(
    model.vascularExternalPressurePa.pth,
    model.mechanicsProxyModel.closedLoopParameters.intrathoracicPressurePa,
  );
  const graph = context.resolvedGraph;
  if (graph.dynamicEdgeNames.join(",") !== "Ao_SA,PA_PArt") {
    throw new Error("distributed V1 dynamic vascular state boundary changed");
  }
}

function assertCommonIntrathoracicPressureGaugeV1(
  vascularPthPa: number,
  mechanicsPthPa: number,
): void {
  const vascular = requireFinite(vascularPthPa, "vascularExternalPressurePa.pth");
  const mechanics = requireFinite(
    mechanicsPthPa,
    "mechanicsProxyModel.closedLoopParameters.intrathoracicPressurePa",
  );
  const tolerancePa = 64 * Number.EPSILON * Math.max(
    1,
    Math.abs(vascular),
    Math.abs(mechanics),
  );
  if (Math.abs(vascular - mechanics) > tolerancePa) {
    throw new Error(
      "vascular pth and mechanics intrathoracic pressure must share one synchronized pressure gauge",
    );
  }
}

function failureResult(
  model: PhaseB1MainWireDistributedResearchModelV1,
  slsMode: PhaseB1SlsModeV1,
  unknownCount: 58 | 53,
  reason: PhaseB1MainWireDistributedStepFailureV1["reason"],
  failureClass: PhaseB1MainWireDistributedStepFailureV1["failureClass"],
  retryableByStepSubdivision: boolean,
  message: string,
  rollbackEndpoint: PhaseB1MainWireDistributedEndpointV1,
  lastAcceptedDiagnosticEndpoint: PhaseB1MainWireDistributedEndpointV1 | null,
  newtonDiagnostics: ScaledDampedNewtonDiagnosticsV1,
): PhaseB1MainWireDistributedStepFailureV1 {
  return Object.freeze({
    converged: false as const,
    solverId: PHASE_B1_MAIN_WIRE_DISTRIBUTED_MONOLITHIC_BE_V1_ID,
    modelId: model.modelId,
    slsMode,
    unknownCount,
    reason,
    failureClass,
    retryableByStepSubdivision,
    message,
    rollbackEndpoint,
    lastAcceptedDiagnosticEndpoint,
    newtonDiagnostics,
    projectionApplied: false as const,
    hiddenStateClippingApplied: false as const,
    postStepBloodVolumeProjectionApplied: false as const,
    flowClampApplied: false as const,
    fallbackApplied: false as const,
    researchOnly: true as const,
    physiologicalValidation: false as const,
    phaseB1Acceptance: false as const,
    browserRuntimeAdopted: false as const,
    releaseRuntimeReachable: false as const,
  });
}

function classifyNewtonFailureV1(
  reason: ScaledDampedNewtonFailureReasonV1,
): Readonly<{
  failureClass: PhaseB1MainWireDistributedStepFailureV1["failureClass"];
  retryableByStepSubdivision: boolean;
}> {
  if (reason === "model-evaluation-inadmissible") {
    return Object.freeze({
      failureClass: "recoverable-trial-domain" as const,
      retryableByStepSubdivision: true,
    });
  }
  if (
    reason === "scaled-linear-solve-failed"
    || reason === "non-descent-direction"
    || reason === "fraction-to-boundary-failed"
    || reason === "line-search-failed"
    || reason === "maximum-iterations"
  ) {
    return Object.freeze({
      failureClass: "recoverable-nonlinear-convergence" as const,
      retryableByStepSubdivision: true,
    });
  }
  return Object.freeze({
    failureClass: "terminal-model-evaluation" as const,
    retryableByStepSubdivision: false,
  });
}

function minimumLandMargin(
  unknowns: readonly number[],
  layout: ReturnType<typeof buildLayout>,
): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < unknowns.length; index += 1) {
    const lower = layout.strictLowerBounds[index];
    if (lower !== null && /\.land\.(CaTRPN|B|W|S)$/.test(layout.labels[index])) {
      minimum = Math.min(minimum, unknowns[index] - lower);
    }
  }
  for (const constraint of layout.landStrictAffineConstraints) {
    const value = constraint.coefficients.reduce(
      (sum, coefficient, index) => sum + coefficient * unknowns[index],
      0,
    );
    minimum = Math.min(minimum, value - constraint.lowerBound);
  }
  return requireFinite(minimum, "minimum Land simplex margin");
}

function assertValvePressureGradientInvariantAcrossApertureCondensation(
  provisional: PhaseB1MainWireDistributedEndpointEvaluationV1,
  condensed: PhaseB1MainWireDistributedEndpointEvaluationV1,
): void {
  for (const flowName of MAIN_WIRE_NON_CORONARY_VALVE_FLOW_NAMES_V1) {
    const before = provisional.distributedCirculation
      .valveMomentumByFlow[flowName].pressureGradientPa;
    const after = condensed.distributedCirculation
      .valveMomentumByFlow[flowName].pressureGradientPa;
    const tolerancePa = 32 * Number.EPSILON * Math.max(
      1,
      Math.abs(before),
      Math.abs(after),
    );
    if (Math.abs(after - before) > tolerancePa) {
      throw new Error(
        `${flowName} pressure gradient changed across algebraic valve-aperture condensation`,
      );
    }
  }
}

function assertInsideLandDomain(
  unknowns: readonly number[],
  layout: ReturnType<typeof buildLayout>,
): void {
  if (!(minimumLandMargin(unknowns, layout) > 0)) {
    throw new Error("initial distributed Land state is outside its strict simplex");
  }
}

function assertAcceptedAtrialPopulationOnlyZeroDistortionV1(
  endpoint: PhaseB1MainWireDistributedEndpointV1,
  binding: PhaseB1WallMaterialBindingV1,
): void {
  const tolerance = 1024 * Number.EPSILON;
  for (const wallId of ["LA", "RA"] as const) {
    const material = binding.runtimeByWall[wallId].landEquationParameters;
    const isPopulationOnly = Object.is(material.values.Aeff, 0)
      && Object.is(material.derived.Aw, 0)
      && Object.is(material.derived.As, 0);
    if (!isPopulationOnly) continue;
    const state = endpoint.differentialState.landByWall[wallId];
    const maximumAbsoluteDistortion = Math.max(
      Math.abs(state[4]),
      Math.abs(state[5]),
    );
    if (maximumAbsoluteDistortion > tolerance) {
      throw new Error(
        `${wallId} population-only Land left the accepted zero-distortion manifold`,
      );
    }
  }
}

function sumDistributedVolumes(
  endpoint: PhaseB1MainWireDistributedEndpointV1,
): number {
  return MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.reduce(
    (sum, node) => sum + endpoint.differentialState.bloodVolumesM3[node],
    0,
  );
}

function sumNodeVolumes(
  values: Readonly<Record<MainWireNonCoronaryCirculationNodeNameV1, number>>,
  nodes: readonly MainWireNonCoronaryVascularNodeNameV1[],
): number {
  return requirePositiveFinite(
    nodes.reduce((sum, node) => sum + values[node], 0),
    `mechanics proxy ${nodes.join("+")} volume`,
  );
}

function wallRecord<T>(
  build: (wallId: FourChamberWallId) => T,
): Readonly<Record<FourChamberWallId, T>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    build(wallId),
  ]))) as Readonly<Record<FourChamberWallId, T>>;
}

function dynamicFlowRecord<T>(
  build: (flowName: MainWireNonCoronaryDynamicFlowNameV1) => T,
): Readonly<Record<MainWireNonCoronaryDynamicFlowNameV1, T>> {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1.map((flowName) => [
      flowName,
      build(flowName),
    ]),
  )) as Readonly<Record<MainWireNonCoronaryDynamicFlowNameV1, T>>;
}

function valveFlowRecord<T>(
  build: (flowName: MainWireNonCoronaryValveFlowNameV1) => T,
): Readonly<Record<MainWireNonCoronaryValveFlowNameV1, T>> {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_NON_CORONARY_VALVE_FLOW_NAMES_V1.map((flowName) => [
      flowName,
      build(flowName),
    ]),
  )) as Readonly<Record<MainWireNonCoronaryValveFlowNameV1, T>>;
}

function requiredLabelIndex(labels: readonly string[], label: string): number {
  const index = labels.indexOf(label);
  if (index < 0) throw new Error(`distributed Newton layout is missing ${label}`);
  return index;
}

function basis(
  dimension: number,
  entries: readonly (readonly [number, number])[],
): readonly number[] {
  const coefficients = Array.from({ length: dimension }, () => 0);
  for (const [index, value] of entries) coefficients[index] = value;
  return Object.freeze(coefficients);
}

function assertRoundoffEqual(actual: number, expected: number, field: string): void {
  const tolerance = 256 * Number.EPSILON * Math.max(
    1,
    Math.abs(actual),
    Math.abs(expected),
  );
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${field} disagrees beyond roundoff`);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
