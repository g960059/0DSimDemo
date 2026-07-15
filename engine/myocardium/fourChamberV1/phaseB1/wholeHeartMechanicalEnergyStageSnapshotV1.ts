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
  reconstructPhaseB1AcceptedBackwardEulerStageKinematicsSnapshotV1,
  type PhaseB1AcceptedBackwardEulerStageKinematicsSnapshotV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/differentiatedStageKinematicsV1";
import type {
  PhaseB1EventFreeMonolithicModelV1,
  PhaseB1EventFreeMonolithicStepSuccessV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  assertPhaseB1WallMaterialBindingV1,
  type PhaseB1WallMaterialBindingV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  evaluatePhaseB1WholeHeartMechanicalStoredEnergyBreakdownFromEndpointEvaluationV1,
  type PhaseB1WholeHeartMechanicalStoredEnergyBreakdownV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditV1";
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

export const PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_STAGE_SNAPSHOT_V1_ID =
  "phase-b1-whole-heart-mechanical-energy-accepted-be-stage-snapshot-v1" as const;

const BUILDER_ISSUED_STAGE_SNAPSHOTS = new WeakSet<object>();
const STAGE_SNAPSHOT_SOURCE = new WeakMap<object, Readonly<{
  model: PhaseB1EventFreeMonolithicModelV1;
  wallMaterialBinding: PhaseB1WallMaterialBindingV1;
  acceptedStep: PhaseB1EventFreeMonolithicStepSuccessV1;
  dtSec: number;
}>>();

export type PhaseB1WholeHeartMechanicalEnergyStageSnapshotV1 = Readonly<{
  snapshotId:
    typeof PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_STAGE_SNAPSHOT_V1_ID;
  auditPolicyId:
    typeof PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1.policyId;
  scheme: "backward-Euler-endpoint-stage";
  normalizationPowerFloorW: typeof WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1;
  slsMode: "on" | "off";
  dtSec: number;
  kinematics: PhaseB1AcceptedBackwardEulerStageKinematicsSnapshotV1;
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
  endpointStoredEnergy: Readonly<{
    previous: PhaseB1WholeHeartMechanicalStoredEnergyBreakdownV1;
    nextLeftLimit: PhaseB1WholeHeartMechanicalStoredEnergyBreakdownV1;
    deltaJ: number;
  }>;
  backwardEulerDiagnostic: Readonly<{
    signedUnresolvedEnergyIncrementJ: number;
    normalizationDenominatorJ: number;
    normalizedUnresolvedEnergyIncrement: number;
    diagnosticOnlyNotStageClosureOrAcceptance: true;
  }>;
  acceptedNewtonBaseJacobianRowsReused: true;
  fullGlobalJacobianAuditRepeatedForSnapshot: false;
  lineSearchJacobianConsumed: false;
  genericNewtonPolicyChanged: false;
  numericalResultChangedBySnapshot: false;
  mechanicalLedgerOnly: true;
  atpChemicalEnergyOrEfficiencyClaimed: false;
  publishedTaylorGeometryDefectRetained: true;
  differentiatedLandKinematicsUsed: true;
  correctedStageLedgerAccepted: boolean;
  geometryWorkConjugacyAccepted: false;
  wholeHeartBackwardEulerEnergyAcceptanceClaimed: false;
  testReferenceOnly: true;
  phaseB1Acceptance: false;
  releaseRuntimeReachable: false;
}>;

export function buildPhaseB1WholeHeartMechanicalEnergyStageSnapshotV1(
  input: Readonly<{
    model: PhaseB1EventFreeMonolithicModelV1;
    wallMaterialBinding: PhaseB1WallMaterialBindingV1;
    acceptedStep: PhaseB1EventFreeMonolithicStepSuccessV1;
    dtSec: number;
  }>,
): PhaseB1WholeHeartMechanicalEnergyStageSnapshotV1 {
  assertExactPlainRecordV1(input, [
    "model",
    "wallMaterialBinding",
    "acceptedStep",
    "dtSec",
  ], "Phase B1 mechanical energy stage snapshot input");
  const binding = assertPhaseB1WallMaterialBindingV1(
    input.wallMaterialBinding,
  );
  const dtSec = requirePositiveFinite(input.dtSec, "dtSec");
  const step = input.acceptedStep;
  if (step.converged !== true) {
    throw new Error("mechanical stage snapshot requires an accepted BE step");
  }
  assertRoundoffEqual(
    step.nextEndpointLeftLimit.timeSec,
    step.previousEndpoint.timeSec + dtSec,
    "mechanical stage snapshot endpoint time",
  );
  const kinematics =
    reconstructPhaseB1AcceptedBackwardEulerStageKinematicsSnapshotV1({
      model: input.model,
      wallMaterialBinding: binding,
      previousEndpoint: step.previousEndpoint,
      nextEndpointLeftLimit: step.nextEndpointLeftLimit,
      dtSec,
      acceptedNewtonBaseTriSegConstraintJacobianRows:
        step.acceptedNewtonBaseTriSegConstraintJacobianRows,
    });
  const previousEvaluation = step.previousEvaluation;
  const nextEvaluation = step.nextEvaluation;
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
    return requireFinite(
      nextEvaluation.closedLoop.wallMechanics[wallId]
        .wallReferenceMaterialVolumeM3
        * context.chiOrient
        * context.fViable
        * materialState.sourceLandOutput.sourceActiveFiberStressPa
        * materialState.length.landStretch
        * strainRate[wallId],
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
  const slsStoredEnergyRateW = step.slsMode === "on"
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
        step.nextEndpointLeftLimit.differentialState
          .inertialFlowsM3PerSec[flowId]
        - step.previousEndpoint.differentialState
          .inertialFlowsM3PerSec[flowId]
      ) / dtSec;
      return sum + inertance
        * step.nextEndpointLeftLimit.differentialState
          .inertialFlowsM3PerSec[flowId]
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
  const slsDissipationW = step.slsMode === "on"
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
      const pressurePa = isChamber(compartmentId)
        ? input.model.closedLoopParameters.intrathoracicPressurePa
        : input.model.closedLoopParameters
          .vascularComplianceParametersByCompartment[compartmentId]
          .externalPressurePa;
      return sum + pressurePa * volumeRate[compartmentId];
    }, 0),
    "prescribedExternalEnvironmentPowerW",
  );
  const publishedTaylorGeometryPowerAudit =
    evaluatePublishedTaylorTriSegStagePowerAuditV1({
      wallMechanicalPowerByWallW: Object.freeze({
        LVFW: wallMechanicalPower(nextEvaluation, strainRate, "LVFW"),
        SEP: wallMechanicalPower(nextEvaluation, strainRate, "SEP"),
        RVFW: wallMechanicalPower(nextEvaluation, strainRate, "RVFW"),
      }),
      hydraulicPowerW: Object.freeze({
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
      }),
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
  const previousStoredEnergy =
    evaluatePhaseB1WholeHeartMechanicalStoredEnergyBreakdownFromEndpointEvaluationV1(
      previousEvaluation,
    );
  const nextStoredEnergy =
    evaluatePhaseB1WholeHeartMechanicalStoredEnergyBreakdownFromEndpointEvaluationV1(
      nextEvaluation,
    );
  const deltaStoredEnergyJ = requireFinite(
    nextStoredEnergy.totalJ - previousStoredEnergy.totalJ,
    "deltaStoredEnergyJ",
  );
  const signedUnresolvedEnergyIncrementJ = requireFinite(
    deltaStoredEnergyJ + dtSec * (
      flowDissipationW
      + slsDissipationW
      - activeMechanicalOutputPowerW
      - prescribedExternalEnvironmentPowerW
      - rawGeometryPowerResidualW
    ),
    "signedUnresolvedEnergyIncrementJ",
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
  const snapshot = Object.freeze({
    snapshotId: PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_STAGE_SNAPSHOT_V1_ID,
    auditPolicyId:
      PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1.policyId,
    scheme: "backward-Euler-endpoint-stage" as const,
    normalizationPowerFloorW: WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
    slsMode: step.slsMode,
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
    endpointStoredEnergy: Object.freeze({
      previous: previousStoredEnergy,
      nextLeftLimit: nextStoredEnergy,
      deltaJ: deltaStoredEnergyJ,
    }),
    backwardEulerDiagnostic: Object.freeze({
      signedUnresolvedEnergyIncrementJ,
      normalizationDenominatorJ: backwardEulerDenominatorJ,
      normalizedUnresolvedEnergyIncrement:
        Math.abs(signedUnresolvedEnergyIncrementJ)
        / backwardEulerDenominatorJ,
      diagnosticOnlyNotStageClosureOrAcceptance: true as const,
    }),
    acceptedNewtonBaseJacobianRowsReused: true as const,
    fullGlobalJacobianAuditRepeatedForSnapshot: false as const,
    lineSearchJacobianConsumed: false as const,
    genericNewtonPolicyChanged: false as const,
    numericalResultChangedBySnapshot: false as const,
    mechanicalLedgerOnly: true as const,
    atpChemicalEnergyOrEfficiencyClaimed: false as const,
    publishedTaylorGeometryDefectRetained: true as const,
    differentiatedLandKinematicsUsed: true as const,
    correctedStageLedgerAccepted:
      kinematics.accepted
      && landAdapterWorkClosure.accepted
      && stage.correctedStageLedgerAccepted,
    geometryWorkConjugacyAccepted: false as const,
    wholeHeartBackwardEulerEnergyAcceptanceClaimed: false as const,
    testReferenceOnly: true as const,
    phaseB1Acceptance: false as const,
    releaseRuntimeReachable: false as const,
  });
  BUILDER_ISSUED_STAGE_SNAPSHOTS.add(snapshot);
  STAGE_SNAPSHOT_SOURCE.set(snapshot, Object.freeze({
    model: input.model,
    wallMaterialBinding: binding,
    acceptedStep: step,
    dtSec,
  }));
  return snapshot;
}

export function assertPhaseB1WholeHeartMechanicalEnergyStageSnapshotSourceBindingV1(
  input: Readonly<{
    snapshot: PhaseB1WholeHeartMechanicalEnergyStageSnapshotV1;
    model: PhaseB1EventFreeMonolithicModelV1;
    wallMaterialBinding: PhaseB1WallMaterialBindingV1;
    acceptedStep: PhaseB1EventFreeMonolithicStepSuccessV1;
    dtSec: number;
  }>,
): PhaseB1WholeHeartMechanicalEnergyStageSnapshotV1 {
  assertExactPlainRecordV1(input, [
    "snapshot",
    "model",
    "wallMaterialBinding",
    "acceptedStep",
    "dtSec",
  ], "Phase B1 mechanical energy stage snapshot source binding");
  const source = STAGE_SNAPSHOT_SOURCE.get(input.snapshot);
  if (
    !BUILDER_ISSUED_STAGE_SNAPSHOTS.has(input.snapshot)
    || source === undefined
    || !Object.is(source.model, input.model)
    || !Object.is(source.wallMaterialBinding, input.wallMaterialBinding)
    || !Object.is(source.acceptedStep, input.acceptedStep)
    || !Object.is(source.dtSec, input.dtSec)
  ) {
    throw new Error("mechanical energy stage snapshot is forged or source-unbound");
  }
  return input.snapshot;
}

type EndpointEvaluation = PhaseB1EventFreeMonolithicStepSuccessV1["nextEvaluation"];

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
  if (result < 0) throw new Error(`${field} must be non-negative`);
  return result;
}
