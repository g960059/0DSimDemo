import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalPortLedgerEngineeringV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerEngineeringV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_CHARACTERIZATION_V1_ID =
  "main-wire-integrated-model-periodic-five-wall-mechanical-port-ledger-dt-characterization-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_V1_ID =
  "main-wire-integrated-model-periodic-five-wall-mechanical-port-ledger-dt-characterization-protocol-v1" as const;

export { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID };

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROJECTION_V1_ID =
  "main-wire-five-wall-mechanical-port-ledger-dt-projection-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_REPORT_V1_ID =
  "main-wire-integrated-model-periodic-five-wall-mechanical-port-ledger-dt-characterization-report-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_DECLARATION_V1 =
  deepFreeze({
    declarationId:
      "integrated-model-0029-periodic-five-wall-mechanical-port-ledger-dt-characterization" as const,
    declarationCommitSha: "cee4a52152771b0a21c12dd2060b9ee324f60ce8" as const,
    declarationDocumentPath:
      "docs/scientific-runtime/INTEGRATED-MODEL-0029-periodic-five-wall-mechanical-port-ledger-dt-characterization.md" as const,
    declarationDocumentGitBlobSha1:
      "13c8669165236470e7314d2c6fb912a24665ef01" as const,
    declarationParentCommitSha:
      "b1d46922ab5e2aabdb417f8f2a1dede6c7504933" as const,
    ledgerImplementationCommitSha:
      "f69ca7f8f0830eb7facfea10fb09904fee9c87cd" as const,
    ledgerMergeCommitSha: "31d15b564367d8467d7d82f4d91d9c79d6913deb" as const,
    declarationStatus:
      "committed-before-first-normal-adult-source-or-replay-evaluation" as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1 =
  deepFreeze([
    {
      armId: "coarse" as const,
      nominalDtSec: 0.001 as const,
      maximumAcceptedStepCountPerCycle:
        MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.maximumAcceptedStepCountPerRun,
    },
    {
      armId: "middle" as const,
      nominalDtSec: 0.0005 as const,
      maximumAcceptedStepCountPerCycle: 2_200 as const,
    },
    {
      armId: "fine" as const,
      nominalDtSec: 0.00025 as const,
      maximumAcceptedStepCountPerCycle: 4_400 as const,
    },
  ] as const);

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1)[number];

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmIdV1 =
  MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmV1["armId"];

export type MainWireIntegratedModelPeriodicMechanicalPortLedgerNominalDtSecV1 =
  MainWireIntegratedModelPeriodicMechanicalPortLedgerDtArmV1["nominalDtSec"];

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_FINITE_LIMIT_METRIC_IDS_V1 =
  deepFreeze([
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1.map(
      (chamberId) => `cavity.${chamberId}.trapezoidalWorkOnWallMilliJ` as const,
    ),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.flatMap((wallId) => [
      `wall.${wallId}.activeMechanical.deliveryPositiveMilliJ` as const,
      `wall.${wallId}.activeMechanical.absorptionMagnitudeMilliJ` as const,
      `wall.${wallId}.activeMechanical.netDeliveryMilliJ` as const,
    ]),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map(
      (wallId) =>
        `wall.${wallId}.parallelSls.physicalDissipationMilliJ` as const,
    ),
    "commonPericardium.trapezoidalPressureWorkOnBagMilliJ" as const,
  ] as const);

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ZERO_LIMIT_METRIC_IDS_V1 =
  deepFreeze([
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map(
      (wallId) =>
        `wall.${wallId}.equilibriumPassiveBackwardEulerRemainderMilliJ` as const,
    ),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map(
      (wallId) =>
        `wall.${wallId}.parallelSls.backwardEulerNumericalDissipationMilliJ` as const,
    ),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_CHAMBER_IDS_V1.map(
      (chamberId) => `cavity.${chamberId}.quadratureDifferenceMilliJ` as const,
    ),
    "commonPericardium.quadratureDifferenceMilliJ" as const,
    "commonPericardium.backwardEulerRemainderMilliJ" as const,
    "commonPericardium.trapezoidalRemainderMilliJ" as const,
    "conjugacy.leftAtrium" as const,
    "conjugacy.rightAtrium" as const,
    "conjugacy.ventricularWallsCombined" as const,
    "conjugacy.allFiveWalls" as const,
  ] as const);

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_CLOSURE_METRIC_IDS_V1 =
  deepFreeze([
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map(
      (wallId) =>
        `wall.${wallId}.equilibriumPassiveStoredEnergyChangeMilliJ` as const,
    ),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map(
      (wallId) =>
        `wall.${wallId}.parallelSls.storedEnergyChangeMilliJ` as const,
    ),
    "commonPericardium.storedEnergyChangeMilliJ" as const,
  ] as const);

export const MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ALGEBRAIC_RESIDUAL_METRIC_IDS_V1 =
  deepFreeze([
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.map(
      (wallId) => `wall.${wallId}.stressAssemblyResidualMilliJ` as const,
    ),
    ...MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_WALL_IDS_V1.flatMap((wallId) => [
      `wall.${wallId}.parallelSls.reportedDiscreteBalanceResidualMilliJ` as const,
      `wall.${wallId}.parallelSls.reconstructedDiscreteBalanceResidualMilliJ` as const,
      `wall.${wallId}.parallelSls.readbackAgreementResidualMilliJ` as const,
    ]),
  ] as const);

export type MainWireFiveWallMechanicalPortLedgerFiniteLimitMetricIdV1 =
  (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_FINITE_LIMIT_METRIC_IDS_V1)[number];

export type MainWireFiveWallMechanicalPortLedgerZeroLimitMetricIdV1 =
  (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ZERO_LIMIT_METRIC_IDS_V1)[number];

export type MainWireFiveWallMechanicalPortLedgerClosureMetricIdV1 =
  (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_CLOSURE_METRIC_IDS_V1)[number];

export type MainWireFiveWallMechanicalPortLedgerAlgebraicResidualMetricIdV1 =
  (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ALGEBRAIC_RESIDUAL_METRIC_IDS_V1)[number];

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_NEGATIVE_CLAIMS_V1 =
  deepFreeze({
    officialQualificationEstablished: false as const,
    canonicalSourceAuthenticationEstablished: false as const,
    historicalQualificationTransferred: false as const,
    numericalPeriodicityEstablishedByCharacterization: false as const,
    ledgerNumericallyQualified: false as const,
    continuumLimitEstablished: false as const,
    temporalConvergenceEstablished: false as const,
    productionDtSelected: false as const,
    continuousPowerEstablished: false as const,
    activeStoredEnergyPotentialEstablished: false as const,
    activationEnergyEstablished: false as const,
    atpUseEstablished: false as const,
    heatEstablished: false as const,
    mvo2Established: false as const,
    mechanicalEfficiencyEstablished: false as const,
    edpvrEstablished: false as const,
    peEstablished: false as const,
    pvaEstablished: false as const,
    wholeHeartPvaEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationEstablished: false as const,
    publicCatalogEligibilityEstablished: false as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_V1 =
  deepFreeze({
    protocolId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_V1_ID,
    characterizationOwnerId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_CHARACTERIZATION_V1_ID,
    reportSchemaId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_REPORT_V1_ID,
    declaration:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_DECLARATION_V1,
    predecessor: {
      pureLedgerOwnerId:
        MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID,
      integratedReplayOwnerId:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_ENGINEERING_V1_ID,
    },
    sourceExecution: {
      nominalDtSec: 0.001 as const,
      maximumCycleCount: 250 as const,
      executionPurpose: "canonical-evidence" as const,
      requiredClassification: "period1-converged" as const,
      sourceExecutionCount: 1 as const,
      normalAdultRegularSinusAllOffDefaults: true as const,
    },
    numericalAccess: {
      accessId:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ACCESS_V1_ID,
      exactArms:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_MECHANICAL_PORT_LEDGER_DT_ARMS_V1,
      standardMinimumNominalDtSec:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.minimumNominalDtSec,
      standardMaximumAcceptedStepCountPerCycle:
        MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.maximumAcceptedStepCountPerRun,
      inheritedInvariantTolerance:
        MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance,
      acceptedDtBinding:
        "abs(maxAcceptedDtSec-nominalDtSec)<=16*Number.EPSILON*max(abs(retainedCycleTimesSec),1)" as const,
      changesStandardPeriodicPolicy: false as const,
      standardRunnerAcceptsThisAccess: false as const,
      analysisReplayOnly: true as const,
    },
    replay: {
      sharedSourceCheckpoint: true as const,
      independentArmContinuation: true as const,
      armAttemptOrder: ["coarse", "middle", "fine"] as const,
      earlierArmFailureSuppressesLaterArms: false as const,
      unmeasuredBridgeCycleCountPerArm: 1 as const,
      measuredCycleCountPerArm: 1 as const,
      acceptedSuccessfulIntervalsOnly: true as const,
      rawResampling: false as const,
    },
    projection: {
      projectionOwnerId:
        MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROJECTION_V1_ID,
      valueUnit: "mJ" as const,
      finiteLimitMetricIds:
        MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_FINITE_LIMIT_METRIC_IDS_V1,
      zeroLimitMetricIds:
        MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ZERO_LIMIT_METRIC_IDS_V1,
      closureMetricIds:
        MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_CLOSURE_METRIC_IDS_V1,
      algebraicResidualMetricIds:
        MAIN_WIRE_FIVE_WALL_MECHANICAL_PORT_LEDGER_ALGEBRAIC_RESIDUAL_METRIC_IDS_V1,
      finiteDifferenceScaleFloorMilliJ: 1 as const,
      finiteDifferenceOrder:
        "log2(abs(x_coarse-x_middle)/abs(x_middle-x_fine))" as const,
      zeroLimitOrder: "log2(abs(r_left)/abs(r_right))" as const,
      undefinedOrderRepresentation: "null-with-closed-reason" as const,
      observedTrendIsQualificationGate: false as const,
    },
    completionRule: {
      positiveBoolean:
        "threeGridMechanicalPortLedgerCharacterizationCompleted" as const,
      requiresSourceP1: true as const,
      requiresAllThreeArms: true as const,
      requiresProjectionAndTrendIndependentReplay: true as const,
      monotonicityIsRequired: false as const,
      signConsistencyIsRequired: false as const,
      observedOrderIsRequired: false as const,
    },
    artifact: {
      path: "artifacts/mechanical-port-ledger/periodic-five-wall-mechanical-port-ledger-dt-characterization-v1.json" as const,
      createOnly: true as const,
      maximumCommittedBytes: 524_288 as const,
      rawCheckpointIncluded: false as const,
      acceptedIntervalsIncluded: false as const,
      successfulStepsIncluded: false as const,
      waveformTraceIncluded: false as const,
      runtimeDependency: false as const,
    },
    negativeClaims:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_NEGATIVE_CLAIMS_V1,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_PROTOCOL_PAYLOAD_SHA256_V1 =
  "2fc81ec16bd9c318618c052494247ea10d948b12f0d4a90d6a85f4663daaf45d" as const;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreeze(child);
  }
  return value;
}
