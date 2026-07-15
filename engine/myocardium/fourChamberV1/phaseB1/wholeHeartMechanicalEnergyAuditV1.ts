import {
  WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
} from "@/engine/myocardium/fourChamberV1/energy/wholeHeartEnergyNormalizationV1";
import {
  PUBLISHED_TAYLOR_GEOMETRY_POWER_LEDGER_TREATMENT_V1,
  evaluatePublishedTaylorTriSegStagePowerAuditV1,
  type PublishedTaylorTriSegStagePowerAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/wholeHeartEnergyLedgerV1";
import type {
  ValveMomentumOutputV1,
} from "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";
import {
  reconstructPhaseB1DifferentiatedStageKinematicsV1,
  type PhaseB1DifferentiatedStageKinematicsV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/differentiatedStageKinematicsV1";
import {
  evaluatePhaseB1EventFreeEndpointV1,
  type PhaseB1EventFreeEndpointEvaluationV1,
  type PhaseB1EventFreeMonolithicModelV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  createPhaseB1EndpointStateV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  assertPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditPolicyV1";
import {
  evaluatePeripheralResistanceV1,
} from "@/engine/myocardium/fourChamberV1/vascular/linearComplianceV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_V1_ID =
  "four-chamber-phase-b1-whole-heart-mechanical-energy-audit-v1" as const;

export type PhaseB1WholeHeartMechanicalStoredEnergyBreakdownV1 = Readonly<{
  slsMode: "on" | "off";
  vascularJ: number;
  pericardialJ: number;
  equilibriumPassiveJ: number;
  slsJ: number;
  inertialJ: number;
  totalJ: number;
  mechanicalOnly: true;
  calciumDriveEnergyIncluded: false;
  activeChemicalEnergyIncluded: false;
}>;

export type PhaseB1WholeHeartMechanicalEnergyAuditInputV1 = Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  previousEndpoint: PhaseB1EndpointStateV1;
  nextEndpointLeftLimit: PhaseB1EndpointStateV1;
  dtSec: number;
}>;

export type PhaseB1WholeHeartMechanicalEnergyAuditV1 = Readonly<{
  auditId: typeof PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_V1_ID;
  auditPolicyId:
    typeof PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1.policyId;
  normalizationPowerFloorW: typeof WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1;
  slsMode: "on" | "off";
  dtSec: number;
  kinematics: PhaseB1DifferentiatedStageKinematicsV1;
  activeStressPowerByWallW: Readonly<Record<FourChamberWallId, number>>;
  activeMechanicalOutputPowerByWallW:
    Readonly<Record<FourChamberWallId, number>>;
  landAdapterSourcePowerByWallW:
    Readonly<Record<FourChamberWallId, number>>;
  landAdapterWorkResidualByWallW:
    Readonly<Record<FourChamberWallId, number>>;
  landAdapterWorkClosure: Readonly<{
    maximumRelativeResidual: number;
    relativeTolerance: 1e-12;
    accepted: boolean;
  }>;
  storedEnergyRateByBranchW: Readonly<{
    vascular: number;
    pericardial: number;
    equilibriumPassive: number;
    sls: number;
    inertial: number;
    total: number;
  }>;
  dissipationByBranchW: Readonly<{
    peripheral: number;
    signedInertialEdges: number;
    flowTotal: number;
    sls: number;
  }>;
  prescribedExternalEnvironmentPowerW: number;
  publishedTaylorGeometryPowerAudit: PublishedTaylorTriSegStagePowerAuditV1;
  publishedTaylorGeometryPowerTreatment:
    typeof PUBLISHED_TAYLOR_GEOMETRY_POWER_LEDGER_TREATMENT_V1;
  stage: Readonly<{
    activeStressPowerW: number;
    activeMechanicalOutputPowerW: number;
    continuousMechanicalEnergyResidualW: number;
    normalizationDenominatorW: number;
    normalizedResidual: number;
    normalizedResidualTolerance: 1e-5;
    publishedTaylorGeometryDefectSubtracted: true;
    correctedStageLedgerAccepted: boolean;
    geometryQualityOrWorkConjugacyAccepted: false;
  }>;
  endpointStoredEnergyJ: Readonly<{
    previous: number;
    next: number;
    delta: number;
  }>;
  backwardEulerDiagnostic: Readonly<{
    signedUnresolvedEnergyIncrementJ: number;
    normalizationDenominatorJ: number;
    normalizedUnresolvedEnergyIncrement: number;
    diagnosticOnlyNotStageClosureOrAcceptance: true;
    expectedLocalLeadingOrder: "O(dt^2)-for-smooth-one-step-data";
  }>;
  mechanicalLedgerOnly: true;
  atpChemicalEnergyOrEfficiencyClaimed: false;
  publishedTaylorGeometryDefectRetained: true;
  differentiatedLandKinematicsUsed: true;
  wholeHeartLandEnergyAuditImplemented: true;
  correctedStageLedgerAccepted: boolean;
  geometryWorkConjugacyAccepted: false;
  wholeHeartBackwardEulerEnergyAcceptanceClaimed: false;
  testReferenceOnly: true;
  phaseB1Acceptance: false;
  releaseRuntimeReachable: false;
}>;

export function auditPhaseB1WholeHeartMechanicalEnergyV1(
  input: PhaseB1WholeHeartMechanicalEnergyAuditInputV1,
): PhaseB1WholeHeartMechanicalEnergyAuditV1 {
  assertExactPlainRecordV1(input, [
    "model",
    "wallMaterialBinding",
    "previousEndpoint",
    "nextEndpointLeftLimit",
    "dtSec",
  ], "Phase B1 whole-heart mechanical energy audit input");
  const binding = assertPhaseB1WallMaterialBindingV1(
    input.wallMaterialBinding,
  );
  const dtSec = requirePositiveFinite(input.dtSec, "dtSec");
  const previousEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.previousEndpoint.timeSec,
    differentialState: input.previousEndpoint.differentialState,
    triSegCoordinates: input.previousEndpoint.triSegCoordinates,
  });
  const nextEndpoint = createPhaseB1EndpointStateV1({
    timeSec: input.nextEndpointLeftLimit.timeSec,
    differentialState: input.nextEndpointLeftLimit.differentialState,
    triSegCoordinates: input.nextEndpointLeftLimit.triSegCoordinates,
  });
  assertRoundoffEqual(
    nextEndpoint.timeSec,
    previousEndpoint.timeSec + dtSec,
    "energy audit endpoint time",
  );
  if (
    previousEndpoint.differentialState.slsMode
      !== nextEndpoint.differentialState.slsMode
  ) {
    throw new Error("energy audit cannot change SLS topology within a step");
  }
  const previousEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    input.model,
    binding,
    previousEndpoint,
  );
  const nextEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    input.model,
    binding,
    nextEndpoint,
  );
  const kinematics = reconstructPhaseB1DifferentiatedStageKinematicsV1({
    model: input.model,
    wallMaterialBinding: binding,
    previousEndpoint,
    nextEndpointLeftLimit: nextEndpoint,
    dtSec,
  });
  const strainRate = kinematics.fiberLogStrainRatePerSecByWall;
  const activeStressPowerByWallW = wallRecord((wallId) => {
    const wall = nextEvaluation.closedLoop.wallMechanics[wallId];
    return requireFinite(
      wall.wallReferenceMaterialVolumeM3
        * nextEvaluation.wallMaterialByWall[wallId]
          .wallActiveKirchhoffStressPa
        * strainRate[wallId],
      `${wallId}.activeStressPowerW`,
    );
  });
  const activeMechanicalOutputPowerByWallW = wallRecord((wallId) =>
    -activeStressPowerByWallW[wallId]);
  const landAdapterSourcePowerByWallW = wallRecord((wallId) => {
    const materialState = nextEvaluation.wallMaterialByWall[wallId];
    const context = binding.runtimeByWall[wallId].landWallAdapterContext;
    const landStretchRatePerSec = materialState.length.landStretch
      * strainRate[wallId];
    return requireFinite(
      nextEvaluation.closedLoop.wallMechanics[wallId]
        .wallReferenceMaterialVolumeM3
        * context.chiOrient
        * context.fViable
        * materialState.sourceLandOutput.sourceActiveFiberStressPa
        * landStretchRatePerSec,
      `${wallId}.landAdapterSourcePowerW`,
    );
  });
  const landAdapterWorkResidualByWallW = wallRecord((wallId) =>
    requireFinite(
      activeStressPowerByWallW[wallId]
        - landAdapterSourcePowerByWallW[wallId],
      `${wallId}.landAdapterWorkResidualW`,
    ));
  const maximumRelativeAdapterResidual = Math.max(...WALL_IDS.map((wallId) =>
    Math.abs(landAdapterWorkResidualByWallW[wallId]) / Math.max(
      WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
      Math.abs(activeStressPowerByWallW[wallId]),
      Math.abs(landAdapterSourcePowerByWallW[wallId]),
    )));
  const landAdapterWorkClosure = Object.freeze({
    maximumRelativeResidual: maximumRelativeAdapterResidual,
    relativeTolerance:
      PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1
        .landAdapterWorkRelativeTolerance,
    accepted: maximumRelativeAdapterResidual
      < PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1
        .landAdapterWorkRelativeTolerance,
  });

  const volumeRate = kinematics.volumeRateM3PerSecByCompartment;
  const vascularStoredEnergyRateW = (["SA", "SV", "PA", "PV"] as const)
    .reduce((sum, id) => sum
      + nextEvaluation.closedLoop.vascular[id].elasticPressurePa
        * volumeRate[id], 0);
  const pericardialStoredEnergyRateW =
    nextEvaluation.closedLoop.pericardium.excessPressurePa
    * (["LA", "LV", "RA", "RV"] as const).reduce(
      (sum, id) => sum + volumeRate[id],
      0,
    );
  const equilibriumPassiveStoredEnergyRateW = WALL_IDS.reduce(
    (sum, wallId) => sum
      + nextEvaluation.closedLoop.wallMechanics[wallId]
        .wallReferenceMaterialVolumeM3
        * nextEvaluation.wallMaterialByWall[wallId].passive
          .equilibriumKirchhoffStressPa
        * strainRate[wallId],
    0,
  );
  const slsStoredEnergyRateW =
    nextEndpoint.differentialState.slsMode === "on"
      && kinematics.slsAlphaRatePerSecByWall !== null
      ? WALL_IDS.reduce((sum, wallId) => sum
        + nextEvaluation.closedLoop.wallMechanics[wallId]
          .wallReferenceMaterialVolumeM3
          * nextEvaluation.wallMaterialByWall[wallId].sls.overstressPa
          * (
            strainRate[wallId]
            - kinematics.slsAlphaRatePerSecByWall![wallId]
          ), 0)
      : 0;
  const inertialStoredEnergyRateW = INERTIAL_FLOW_IDS.reduce(
    (sum, flowId) => {
      const momentum = nextEvaluation.closedLoop.inertialMomentum[flowId];
      const inertance = flowId === "Q_VC" || flowId === "Q_PV"
        ? input.model.closedLoopParameters.inletLossParametersByFlow[flowId]
          .inertancePaSec2PerM3
        : (momentum as ValveMomentumOutputV1).inertancePaSec2PerM3;
      const flowRate = (
        nextEndpoint.differentialState.inertialFlowsM3PerSec[flowId]
        - previousEndpoint.differentialState.inertialFlowsM3PerSec[flowId]
      ) / dtSec;
      return sum + inertance
        * nextEndpoint.differentialState.inertialFlowsM3PerSec[flowId]
        * flowRate;
    },
    0,
  );
  const totalStoredEnergyRateW = requireFinite(
    vascularStoredEnergyRateW
      + pericardialStoredEnergyRateW
      + equilibriumPassiveStoredEnergyRateW
      + slsStoredEnergyRateW
      + inertialStoredEnergyRateW,
    "totalStoredEnergyRateW",
  );
  const storedEnergyRateByBranchW = Object.freeze({
    vascular: vascularStoredEnergyRateW,
    pericardial: pericardialStoredEnergyRateW,
    equilibriumPassive: equilibriumPassiveStoredEnergyRateW,
    sls: slsStoredEnergyRateW,
    inertial: inertialStoredEnergyRateW,
    total: totalStoredEnergyRateW,
  });

  const peripheralDissipationW = requireNonNegativeFinite(
    evaluatePeripheralResistanceV1(
      input.model.closedLoopParameters
        .peripheralResistancePaSecPerM3ByFlow.Q_sys,
      nextEvaluation.closedLoop.algebraicFlowsM3PerSec.Q_sys,
    ).dissipationW
    + evaluatePeripheralResistanceV1(
      input.model.closedLoopParameters
        .peripheralResistancePaSecPerM3ByFlow.Q_pul,
      nextEvaluation.closedLoop.algebraicFlowsM3PerSec.Q_pul,
    ).dissipationW,
    "peripheralDissipationW",
  );
  const signedInertialEdgeDissipationW = requireNonNegativeFinite(
    INERTIAL_FLOW_IDS.reduce((sum, flowId) => sum
      + nextEvaluation.closedLoop.inertialMomentum[flowId].dissipationW, 0),
    "signedInertialEdgeDissipationW",
  );
  const flowDissipationW = requireNonNegativeFinite(
    peripheralDissipationW + signedInertialEdgeDissipationW,
    "flowDissipationW",
  );
  const slsDissipationW = nextEndpoint.differentialState.slsMode === "on"
    ? requireNonNegativeFinite(WALL_IDS.reduce((sum, wallId) => sum
      + nextEvaluation.closedLoop.wallMechanics[wallId]
        .slsPhysicalDissipationW, 0), "slsDissipationW")
    : 0;
  const dissipationByBranchW = Object.freeze({
    peripheral: peripheralDissipationW,
    signedInertialEdges: signedInertialEdgeDissipationW,
    flowTotal: flowDissipationW,
    sls: slsDissipationW,
  });

  const prescribedExternalEnvironmentPowerW = requireFinite(
    -BLOOD_COMPARTMENT_IDS.reduce((sum, compartmentId) => {
      const prescribedExternalPressurePa = isChamber(compartmentId)
        ? input.model.closedLoopParameters.intrathoracicPressurePa
        : input.model.closedLoopParameters
          .vascularComplianceParametersByCompartment[compartmentId]
          .externalPressurePa;
      return sum + prescribedExternalPressurePa * volumeRate[compartmentId];
    }, 0),
    "prescribedExternalEnvironmentPowerW",
  );
  const ventricularWallMechanicalPowerByWallW = Object.freeze({
    LVFW: wallMechanicalPower(nextEvaluation, strainRate, "LVFW"),
    SEP: wallMechanicalPower(nextEvaluation, strainRate, "SEP"),
    RVFW: wallMechanicalPower(nextEvaluation, strainRate, "RVFW"),
  });
  const hydraulicPowerW = Object.freeze({
    LV: requireFinite(
      nextEvaluation.closedLoop.chamberTransmuralPressurePa.LV
        * volumeRate.LV,
      "LV hydraulic power",
    ),
    RV: requireFinite(
      nextEvaluation.closedLoop.chamberTransmuralPressurePa.RV
        * volumeRate.RV,
      "RV hydraulic power",
    ),
  });
  const publishedTaylorGeometryPowerAudit =
    evaluatePublishedTaylorTriSegStagePowerAuditV1({
      wallMechanicalPowerByWallW: ventricularWallMechanicalPowerByWallW,
      hydraulicPowerW,
    });
  const rawGeometryPowerResidualW =
    publishedTaylorGeometryPowerAudit.rawGeometryPowerResidualW;
  const activeStressPowerW = sumWallRecord(activeStressPowerByWallW);
  const activeMechanicalOutputPowerW = sumWallRecord(
    activeMechanicalOutputPowerByWallW,
  );
  assertRoundoffEqual(
    activeStressPowerW,
    -activeMechanicalOutputPowerW,
    "active stress/output signed power",
  );
  const continuousMechanicalEnergyResidualW = requireFinite(
    totalStoredEnergyRateW
      + flowDissipationW
      + slsDissipationW
      - activeMechanicalOutputPowerW
      - prescribedExternalEnvironmentPowerW
      - rawGeometryPowerResidualW,
    "continuousMechanicalEnergyResidualW",
  );
  const stageNormalizationDenominatorW = requirePositiveFinite(
    WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1
      + Math.abs(totalStoredEnergyRateW)
      + flowDissipationW
      + slsDissipationW
      + Math.abs(activeMechanicalOutputPowerW)
      + Math.abs(prescribedExternalEnvironmentPowerW)
      + Math.abs(rawGeometryPowerResidualW),
    "stageNormalizationDenominatorW",
  );
  const stageNormalizedResidual = requireNonNegativeFinite(
    Math.abs(continuousMechanicalEnergyResidualW)
      / stageNormalizationDenominatorW,
    "stageNormalizedResidual",
  );
  const stage = Object.freeze({
    activeStressPowerW,
    activeMechanicalOutputPowerW,
    continuousMechanicalEnergyResidualW,
    normalizationDenominatorW: stageNormalizationDenominatorW,
    normalizedResidual: stageNormalizedResidual,
    normalizedResidualTolerance:
      PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1
        .correctedStageLedgerNormalizedResidualTolerance,
    publishedTaylorGeometryDefectSubtracted: true as const,
    correctedStageLedgerAccepted: stageNormalizedResidual
      < PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1
        .correctedStageLedgerNormalizedResidualTolerance,
    geometryQualityOrWorkConjugacyAccepted: false as const,
  });

  const previousStoredEnergyJ =
    evaluatePhaseB1WholeHeartMechanicalStoredEnergyBreakdownFromEndpointEvaluationV1(
      previousEvaluation,
    ).totalJ;
  const nextStoredEnergyJ =
    evaluatePhaseB1WholeHeartMechanicalStoredEnergyBreakdownFromEndpointEvaluationV1(
      nextEvaluation,
    ).totalJ;
  const deltaStoredEnergyJ = requireFinite(
    nextStoredEnergyJ - previousStoredEnergyJ,
    "deltaStoredEnergyJ",
  );
  const signedBackwardEulerEnergyResidualJ = requireFinite(
    deltaStoredEnergyJ + dtSec * (
      flowDissipationW
      + slsDissipationW
      - activeMechanicalOutputPowerW
      - prescribedExternalEnvironmentPowerW
      - rawGeometryPowerResidualW
    ),
    "signedBackwardEulerEnergyResidualJ",
  );
  const backwardEulerDenominatorJ = requirePositiveFinite(
    WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1 * dtSec
      + Math.abs(deltaStoredEnergyJ)
      + dtSec * (
        flowDissipationW
        + slsDissipationW
        + Math.abs(activeMechanicalOutputPowerW)
        + Math.abs(prescribedExternalEnvironmentPowerW)
        + Math.abs(rawGeometryPowerResidualW)
      ),
    "backwardEulerDenominatorJ",
  );
  const backwardEulerDiagnostic = Object.freeze({
    signedUnresolvedEnergyIncrementJ: signedBackwardEulerEnergyResidualJ,
    normalizationDenominatorJ: backwardEulerDenominatorJ,
    normalizedUnresolvedEnergyIncrement:
      Math.abs(signedBackwardEulerEnergyResidualJ)
      / backwardEulerDenominatorJ,
    diagnosticOnlyNotStageClosureOrAcceptance: true as const,
    expectedLocalLeadingOrder: "O(dt^2)-for-smooth-one-step-data" as const,
  });
  return Object.freeze({
    auditId: PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_V1_ID,
    auditPolicyId:
      PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1.policyId,
    normalizationPowerFloorW: WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
    slsMode: nextEndpoint.differentialState.slsMode,
    dtSec,
    kinematics,
    activeStressPowerByWallW,
    activeMechanicalOutputPowerByWallW,
    landAdapterSourcePowerByWallW,
    landAdapterWorkResidualByWallW,
    landAdapterWorkClosure,
    storedEnergyRateByBranchW,
    dissipationByBranchW,
    prescribedExternalEnvironmentPowerW,
    publishedTaylorGeometryPowerAudit,
    publishedTaylorGeometryPowerTreatment:
      PUBLISHED_TAYLOR_GEOMETRY_POWER_LEDGER_TREATMENT_V1,
    stage,
    endpointStoredEnergyJ: Object.freeze({
      previous: previousStoredEnergyJ,
      next: nextStoredEnergyJ,
      delta: deltaStoredEnergyJ,
    }),
    backwardEulerDiagnostic,
    mechanicalLedgerOnly: true,
    atpChemicalEnergyOrEfficiencyClaimed: false,
    publishedTaylorGeometryDefectRetained: true,
    differentiatedLandKinematicsUsed: true,
    wholeHeartLandEnergyAuditImplemented: true,
    correctedStageLedgerAccepted:
      kinematics.accepted
      && landAdapterWorkClosure.accepted
      && stage.correctedStageLedgerAccepted,
    geometryWorkConjugacyAccepted: false,
    wholeHeartBackwardEulerEnergyAcceptanceClaimed: false,
    testReferenceOnly: true,
    phaseB1Acceptance: false,
    releaseRuntimeReachable: false,
  });
}

type EndpointEvaluation = PhaseB1EventFreeEndpointEvaluationV1;

export function evaluatePhaseB1WholeHeartMechanicalStoredEnergyBreakdownFromEndpointEvaluationV1(
  evaluation: PhaseB1EventFreeEndpointEvaluationV1,
): PhaseB1WholeHeartMechanicalStoredEnergyBreakdownV1 {
  const vascular = (["SA", "SV", "PA", "PV"] as const).reduce(
    (sum, id) => sum + evaluation.closedLoop.vascular[id].elasticEnergyJ,
    0,
  );
  const passive = WALL_IDS.reduce((sum, wallId) => sum
    + evaluation.closedLoop.wallMechanics[wallId]
      .wallReferenceMaterialVolumeM3
      * evaluation.wallMaterialByWall[wallId].passive
        .storedEnergyDensityJPerM3, 0);
  const sls = evaluation.endpoint.differentialState.slsMode === "on"
    ? WALL_IDS.reduce((sum, wallId) => sum
      + evaluation.closedLoop.wallMechanics[wallId].slsStoredEnergyJ, 0)
    : 0;
  const inertial = INERTIAL_FLOW_IDS.reduce((sum, flowId) => sum
    + evaluation.closedLoop.inertialMomentum[flowId].kineticEnergyJ, 0);
  const pericardial = requireFinite(
    evaluation.closedLoop.pericardium.storedEnergyJ,
    "pericardialStoredEnergyJ",
  );
  const totalJ = requireFinite(
    vascular
      + pericardial
      + passive
      + sls
      + inertial,
    "endpointStoredEnergyJ",
  );
  return Object.freeze({
    slsMode: evaluation.endpoint.differentialState.slsMode,
    vascularJ: requireFinite(vascular, "vascularStoredEnergyJ"),
    pericardialJ: pericardial,
    equilibriumPassiveJ: requireFinite(passive, "passiveStoredEnergyJ"),
    slsJ: requireFinite(sls, "slsStoredEnergyJ"),
    inertialJ: requireFinite(inertial, "inertialStoredEnergyJ"),
    totalJ,
    mechanicalOnly: true,
    calciumDriveEnergyIncluded: false,
    activeChemicalEnergyIncluded: false,
  });
}

function wallMechanicalPower(
  evaluation: EndpointEvaluation,
  strainRate: Readonly<Record<FourChamberWallId, number>>,
  wallId: "LVFW" | "SEP" | "RVFW",
): number {
  const wall = evaluation.closedLoop.wallMechanics[wallId];
  return requireFinite(
    wall.wallReferenceMaterialVolumeM3
      * wall.totalKirchhoffStressPa
      * strainRate[wallId],
    `${wallId}.wallMechanicalPowerW`,
  );
}

function isChamber(
  compartmentId: BloodCompartmentId,
): compartmentId is "LA" | "LV" | "RA" | "RV" {
  return compartmentId === "LA"
    || compartmentId === "LV"
    || compartmentId === "RA"
    || compartmentId === "RV";
}

function wallRecord<Value>(
  build: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    build(wallId),
  ]))) as Readonly<Record<FourChamberWallId, Value>>;
}

function sumWallRecord(
  values: Readonly<Record<FourChamberWallId, number>>,
): number {
  return requireFinite(
    WALL_IDS.reduce((sum, wallId) => sum + values[wallId], 0),
    "wall power total",
  );
}

function assertRoundoffEqual(
  actual: number,
  expected: number,
  field: string,
): void {
  const tolerance = 256 * Number.EPSILON
    * Math.max(1, Math.abs(actual), Math.abs(expected));
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${field} mismatch`);
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
  if (!(result > 0)) throw new Error(`${field} must be positive`);
  return result;
}

function requireNonNegativeFinite(value: unknown, field: string): number {
  const result = requireFinite(value, field);
  if (result < 0) throw new Error(`${field} must be nonnegative`);
  return result;
}
