import {
  buildNonCoronaryCirculationGraphV1,
  commitNonCoronaryCirculationTrialWithConservativeCompanionV1,
  createInitialNonCoronaryCirculationStateV1,
  evaluateNonCoronaryCirculationBackwardEulerTrialV1,
  NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
  type NonCoronaryAbsoluteChamberPressureTangentV1,
  type NonCoronaryCirculationAcceptedStateV1,
  type NonCoronaryCirculationNewtonOptionsV1,
  type NonCoronaryProtocolResistanceScaleByEdgeV1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryCirculationTrialDiagnosticsV1,
  type NonCoronaryCirculationTrialFailureReasonV1,
  type NonCoronaryCirculationTrialFailureV1,
  type NonCoronaryCirculationTrialSuccessV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  respiratoryExternalPressureForKindV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  CoronaryBackwardEulerTransactionV2,
  NORMAL_CORONARY_DISEASE_INPUT_V2,
  buildCoronaryCollapseHydraulicsPriorV2,
  initializePressureLadderCoronaryStateV2,
  solveCoronaryBackwardEulerTrialV2,
  type CoronaryAcceptedHydraulicStateV2,
  type CoronaryBackwardEulerSolverOptionsV2,
  type CoronaryBackwardEulerTrialV2,
  type CoronaryCollapseHydraulicsPriorV2,
  type CoronaryDiseaseInputV2,
  type CoronaryHydraulicBoundaryInputV2,
  type CoronaryPressureLadderInitializationV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
  resolveMainWireCoronaryBoundaryV2,
  type MainWireCoronaryImpMechanismV2,
  type MainWireCoronaryShorteningImpGainPriorV2,
  type MainWireCoronaryShorteningReferenceV2,
  type MainWireCoronaryWallNumbersV2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  evaluateAllCoronaryImpV1,
  type CoronaryImpEvaluationV1,
} from "@/engine/coronary/intramyocardialPressureV1";
import {
  evaluateMainWireCoronaryMechanicsCouplingV1,
  type MainWireCoronaryMechanicsCouplingEvaluationV1,
} from "@/engine/coronary/mainWireMechanicsCouplingV1";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_FINGERPRINT_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import {
  CORONARY_TOPOLOGY_ID_V2,
  buildCoronaryTopologyV2,
  coronaryConfigurationFingerprintV2,
  coronaryTopologyPriorFingerprintV2,
  createColdCoronaryConstructionSeedV2,
  type CoronaryTopologyPriorV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryLayerRecordV2,
  type CoronaryTerritoryLayerRecordV2,
} from "@/engine/coronary/typesV2";
import {
  evaluateFiveWallNormalCalciumDriveV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  evaluateMainWireCommonPericardiumBindingV1,
  type MainWireCommonPericardiumBindingV1,
  type MainWireCommonPericardiumEvaluationV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  cloneWholeHeartMechanicsAcceptedStateV1,
  commitWholeHeartMechanicsTrialV1,
  evaluateWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  type WholeHeartMechanicsAcceptedStateV1,
  type WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  type WholeHeartMechanicsProviderV1,
  type WholeHeartMechanicsTrialV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1,
  resolveMainWireNormalAdultBloodVolumeProtocolTargetV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";

export const MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID =
  "main-wire-five-wall-coronary-transaction-v2" as const;

const PA_PER_MMHG = 133.322;
const MITRAL_FORWARD_FLOW_ACTIVE_THRESHOLD_ML_PER_SEC = 1;
const DEFAULT_IMP_MECHANISM_V2 = "cep-shortening-induced" as const;

export const MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V2 =
  Object.freeze({
    circulationOwner:
      "main-wire-derived-noncoronary-plus-sixteen-volume-coronary-v2-implicit-transaction" as const,
    mechanicsOwner: "one-joint-five-wall-provider" as const,
    coronaryBoundaryCoupling:
      "aortic-uptake-and-common-coronary-venous-right-atrial-return-in-outer-be-residual" as const,
    totalBloodVolumeOwner:
      "one-fixed-global-ledger-including-fifteen-plus-sixteen-volumes" as const,
    companionNewtonSemantics:
      "every-probe-restarts-from-the-same-previous-accepted-coronary-v2-state" as const,
    commitSemantics:
      "circulation-coronary-mechanics-and-mvc-reference-promote-once-after-all-trials-succeed" as const,
    failureSemantics: "rollback-all-accepted-owners" as const,
    impMechanism: DEFAULT_IMP_MECHANISM_V2,
    shorteningGain:
      "fixed-normal-reference-gain-never-renormalized-per-scenario" as const,
    shorteningReference:
      "previous-accepted-mitral-closure-fiber-strain" as const,
    initialShorteningReference:
      "same-scenario-cold-mechanics-strain" as const,
    mitralClosureDetector:
      "accepted-mitral-forward-flow-true-to-false-at-one-ml-per-sec" as const,
    toneUpdateInsideHydraulicNewton: false as const,
    acceptedToneMode: "fixed-until-accepted-cycle-autoregulation-phase" as const,
    outerJacobian: "full-finite-difference-fallback" as const,
    parameterFittingOwnedHere: false as const,
    simulationReady: false as const,
  });

export type MainWireCoronaryMvcReferenceStateV2 = Readonly<{
  reference: MainWireCoronaryShorteningReferenceV2;
  referenceAcceptedTimeSec: number;
  referenceRevision: number;
  mitralForwardFlowActive: boolean;
  acceptedMitralClosureEventCount: number;
}>;

export type MainWireFiveWallCoronaryBindingV2 = Readonly<{
  topologyId: CoronaryTopologyPriorV2["topologyId"];
  priorFingerprint: string;
  collapseHydraulicsFingerprint: string;
  boundaryResolverId: typeof MAIN_WIRE_CORONARY_BOUNDARY_V2_ID;
  impMechanism: MainWireCoronaryImpMechanismV2;
  shorteningImpPriorFingerprint: string;
  mvcReferenceSemantics:
    "previous-accepted-mitral-closure-fiber-strain-v1";
}>;

export type MainWireFiveWallCoronaryAcceptedStateV2<TWallState> = Readonly<{
  transactionId: typeof MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID;
  revision: number;
  acceptedTimeSec: number;
  fixedGlobalTotalBloodVolumeMl: number;
  coronaryBinding: MainWireFiveWallCoronaryBindingV2;
  circulation: NonCoronaryCirculationAcceptedStateV1;
  coronary: CoronaryAcceptedHydraulicStateV2;
  mechanics: WholeHeartMechanicsAcceptedStateV1<TWallState>;
  mvcReferenceState: MainWireCoronaryMvcReferenceStateV2;
}>;

export type MainWireFiveWallCoronaryCandidateMechanicsEvaluationV2<
  TWallState,
> = Readonly<{
  mechanicsTrial: WholeHeartMechanicsTrialV1<TWallState>;
  pericardium: MainWireCommonPericardiumEvaluationV1;
  coronaryMechanicsCoupling:
    MainWireCoronaryMechanicsCouplingEvaluationV1;
  sourceImpByTerritoryLayer:
    CoronaryTerritoryLayerRecordV2<CoronaryImpEvaluationV1>;
  sourceIntramyocardialPressureMmHgByTerritoryLayer:
    CoronaryTerritoryLayerRecordV2<number>;
}>;

export type MainWireFiveWallCoronaryCompanionTrialV2 = Readonly<{
  coronaryTrial: CoronaryBackwardEulerTrialV2;
  boundary: CoronaryHydraulicBoundaryInputV2;
}>;

export type MainWireFiveWallCoronaryInitializeInputV2<TWallState> = Readonly<{
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
  pericardium: MainWireCommonPericardiumBindingV1;
  coronaryInitial?: CoronaryAcceptedHydraulicStateV2;
  coronaryPrior?: CoronaryTopologyPriorV2;
  coronaryDisease?: CoronaryDiseaseInputV2;
  collapseHydraulics?: CoronaryCollapseHydraulicsPriorV2;
  impMechanism?: MainWireCoronaryImpMechanismV2;
  shorteningImpPrior?: MainWireCoronaryShorteningImpGainPriorV2;
  fixedGlobalTotalBloodVolumeMl?: number;
  timeSec?: number;
}>;

export type MainWireFiveWallCoronaryColdResultV2<TWallState> = Readonly<{
  acceptedState: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
  transmuralPressuresMmHg: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>;
  commonIntrathoracicPressureMmHg: number;
  pericardium: MainWireCommonPericardiumEvaluationV1;
  coronaryMechanicsCoupling:
    MainWireCoronaryMechanicsCouplingEvaluationV1;
  pressureLadderDiagnostics:
    CoronaryPressureLadderInitializationV2["diagnostics"] | null;
}>;

export type MainWireFiveWallCoronaryStepSuccessV2<TWallState> = Readonly<{
  converged: true;
  acceptedState: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>;
  circulationTrial: NonCoronaryCirculationTrialSuccessV1<
    MainWireFiveWallCoronaryCandidateMechanicsEvaluationV2<TWallState>,
    MainWireFiveWallCoronaryCompanionTrialV2
  >;
  mechanicsTrial: WholeHeartMechanicsTrialV1<TWallState>;
  coronaryTrial: CoronaryBackwardEulerTrialV2;
  coronaryBoundary: CoronaryHydraulicBoundaryInputV2;
  coronaryMechanicsCoupling:
    MainWireCoronaryMechanicsCouplingEvaluationV1;
  intramyocardialPressureMmHgByTerritoryLayer:
    CoronaryTerritoryLayerRecordV2<number>;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
  commonIntrathoracicPressureMmHg: number;
  pericardium: MainWireCommonPericardiumEvaluationV1;
  mvcReferenceUpdated: boolean;
}>;

export type MainWireFiveWallCoronaryStepFailureV2<TWallState> = Readonly<{
  converged: false;
  reason: "circulation-mechanics-or-coronary-v2-trial-failed";
  message: string;
  rollbackState: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>;
  circulationFailureReason: NonCoronaryCirculationTrialFailureReasonV1;
  lastAcceptedCandidateNodeVolumesMl:
    NonCoronaryCirculationTrialFailureV1["lastAcceptedCandidateNodeVolumesMl"];
  circulationDiagnostics: NonCoronaryCirculationTrialDiagnosticsV1;
  mechanicsCommitted: false;
  circulationCommitted: false;
  coronaryCommitted: false;
  mvcReferenceCommitted: false;
}>;

export type MainWireFiveWallCoronaryStepResultV2<TWallState> =
  | MainWireFiveWallCoronaryStepSuccessV2<TWallState>
  | MainWireFiveWallCoronaryStepFailureV2<TWallState>;

export function initializeMainWireFiveWallCoronaryV2<TWallState>(
  input: MainWireFiveWallCoronaryInitializeInputV2<TWallState>,
): MainWireFiveWallCoronaryColdResultV2<TWallState> {
  const timeSec = input.timeSec ?? 0;
  requireNonnegativeFinite(timeSec, "timeSec");
  const prior = input.coronaryPrior
    ?? MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2;
  const topology = buildCoronaryTopologyV2(prior);
  const collapseHydraulics = resolveCollapseHydraulics(
    prior,
    input.collapseHydraulics,
  );
  const impMechanism = input.impMechanism ?? DEFAULT_IMP_MECHANISM_V2;
  const shorteningImpPrior = input.shorteningImpPrior
    ?? NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2;
  const fixedGlobalTotalBloodVolumeMl =
    input.fixedGlobalTotalBloodVolumeMl
    ?? MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1
      .fullGraphReferenceTotalBloodVolumeMl;
  requirePositiveFinite(
    fixedGlobalTotalBloodVolumeMl,
    "fixedGlobalTotalBloodVolumeMl",
  );

  const constructionSeed = createColdCoronaryConstructionSeedV2(prior);
  const preliminaryCoronaryState = input.coronaryInitial === undefined
    ? Object.freeze({
      acceptedTimeSec: timeSec,
      revision: 0,
      volumeMlByNode: constructionSeed.volumeMlByNode,
      toneResistanceScaleByTerritoryLayer:
        constructionSeed.initialToneResistanceScaleByTerritoryLayer,
    })
    : Object.freeze({
      ...input.coronaryInitial,
      acceptedTimeSec: timeSec,
      revision: 0,
    });
  const preliminaryCoronary = new CoronaryBackwardEulerTransactionV2(
    prior,
    preliminaryCoronaryState,
    topology,
    collapseHydraulics,
  ).getAcceptedState();
  const preliminaryCirculation = createCanonicalNonCoronaryPartitionV2(
    input.runtime,
    fixedGlobalTotalBloodVolumeMl,
    coronaryBloodVolumeMl(preliminaryCoronary),
    timeSec,
  );
  const calciumEvaluation = evaluateFiveWallNormalCalciumDriveV1(
    timeSec,
    input.calciumDriveParams,
  );
  const calciumDrive = Object.freeze({
    freeCalciumUMByWall: calciumEvaluation.freeCalciumUMByWall,
  });
  const mechanicsCold = initializeWholeHeartMechanicsColdV1(input.provider, {
    timeSec,
    volumesMl: chamberVolumes(preliminaryCirculation),
    drivingInputs: calciumDrive,
  });
  const pthMmHg = commonIntrathoracicPressureMmHg(timeSec, input.runtime);
  const preliminaryPericardium = evaluateMainWireCommonPericardiumBindingV1(
    input.pericardium,
    chamberVolumes(preliminaryCirculation),
  );
  const preliminaryCoupling = evaluateMainWireCoronaryMechanicsCouplingV1(
    mechanicsCold,
    {
      commonIntrathoracicPressureMmHg: pthMmHg,
      commonPericardialExcessPressureMmHg:
        preliminaryPericardium.excessPressureMmHg,
    },
  );
  const initialReference = shorteningReference(
    preliminaryCoupling.effectiveFiberLogStrainByWall,
  );

  let pressureLadderDiagnostics:
    CoronaryPressureLadderInitializationV2["diagnostics"] | null = null;
  let coronary = preliminaryCoronary;
  if (input.coronaryInitial === undefined) {
    const sourceImp = evaluateAllCoronaryImpV1(preliminaryCoupling.input);
    const boundary = resolveMainWireCoronaryBoundaryV2(
      Object.freeze({
        absoluteAorticPressureMmHg: absoluteAorticPressureMmHg(
          preliminaryCirculation,
          input.runtime,
        ),
        absoluteRightAtrialPressureMmHg:
          mechanicsCold.transmuralPressuresMmHg.RA
          + pthMmHg + preliminaryPericardium.excessPressureMmHg,
        sourceIntramyocardialPressureMmHgByTerritoryLayer:
          intramyocardialPressureRecord(sourceImp),
        mechanicsInput: preliminaryCoupling.input,
        effectiveFiberLogStrainByWall:
          preliminaryCoupling.effectiveFiberLogStrainByWall,
      }),
      impMechanism,
      initialReference,
      shorteningImpPrior,
    );
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary,
      disease: input.coronaryDisease ?? NORMAL_CORONARY_DISEASE_INPUT_V2,
      toneResistanceScaleByTerritoryLayer:
        preliminaryCoronary.toneResistanceScaleByTerritoryLayer,
      collapseHydraulics,
    }, prior, topology);
    pressureLadderDiagnostics = initialized.diagnostics;
    coronary = new CoronaryBackwardEulerTransactionV2(
      prior,
      Object.freeze({
        ...initialized.acceptedState,
        acceptedTimeSec: timeSec,
        revision: 0,
      }),
      topology,
      collapseHydraulics,
    ).getAcceptedState();
  }

  const circulation = createCanonicalNonCoronaryPartitionV2(
    input.runtime,
    fixedGlobalTotalBloodVolumeMl,
    coronaryBloodVolumeMl(coronary),
    timeSec,
  );
  assertSameChamberVolumes(
    preliminaryCirculation,
    circulation,
    "pressure-ladder TBV repartition",
  );
  const pericardium = evaluateMainWireCommonPericardiumBindingV1(
    input.pericardium,
    chamberVolumes(circulation),
  );
  const coronaryMechanicsCoupling =
    evaluateMainWireCoronaryMechanicsCouplingV1(mechanicsCold, {
      commonIntrathoracicPressureMmHg: pthMmHg,
      commonPericardialExcessPressureMmHg:
        pericardium.excessPressureMmHg,
    });
  const mvcReferenceState = initialMvcReferenceState(
    timeSec,
    coronaryMechanicsCoupling.effectiveFiberLogStrainByWall,
  );
  const binding = buildBinding(
    prior,
    collapseHydraulics,
    impMechanism,
    shorteningImpPrior,
  );
  return Object.freeze({
    acceptedState: acceptedTuple(
      0,
      fixedGlobalTotalBloodVolumeMl,
      binding,
      circulation,
      coronary,
      mechanicsCold.acceptedState,
      mvcReferenceState,
    ),
    calciumDrive,
    transmuralPressuresMmHg: Object.freeze({
      ...mechanicsCold.transmuralPressuresMmHg,
    }),
    commonIntrathoracicPressureMmHg: pthMmHg,
    pericardium,
    coronaryMechanicsCoupling,
    pressureLadderDiagnostics,
  });
}

export function stepMainWireFiveWallCoronaryV2<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
  input: Readonly<{
    dtSec: number;
    runtime: NonCoronaryCirculationRuntimeParamsV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    pericardium: MainWireCommonPericardiumBindingV1;
    coronaryPrior?: CoronaryTopologyPriorV2;
    coronaryDisease?: CoronaryDiseaseInputV2;
    collapseHydraulics?: CoronaryCollapseHydraulicsPriorV2;
    impMechanism?: MainWireCoronaryImpMechanismV2;
    shorteningImpPrior?: MainWireCoronaryShorteningImpGainPriorV2;
    coronarySolverOptions?: Partial<CoronaryBackwardEulerSolverOptionsV2>;
    circulationNewtonOptions?: NonCoronaryCirculationNewtonOptionsV1;
    protocolResistanceScaleByEdge?:
      NonCoronaryProtocolResistanceScaleByEdgeV1;
  }>,
): MainWireFiveWallCoronaryStepResultV2<TWallState> {
  validateAcceptedTuple(previous);
  requirePositiveFinite(input.dtSec, "dtSec");
  const prior = input.coronaryPrior
    ?? MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2;
  const topology = buildCoronaryTopologyV2(prior);
  const collapseHydraulics = resolveCollapseHydraulics(
    prior,
    input.collapseHydraulics,
  );
  const impMechanism = input.impMechanism ?? DEFAULT_IMP_MECHANISM_V2;
  const shorteningImpPrior = input.shorteningImpPrior
    ?? NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2;
  const binding = buildBinding(
    prior,
    collapseHydraulics,
    impMechanism,
    shorteningImpPrior,
  );
  assertSameBinding(previous.coronaryBinding, binding);

  const candidateTimeSec = previous.acceptedTimeSec + input.dtSec;
  const calciumEvaluation = evaluateFiveWallNormalCalciumDriveV1(
    candidateTimeSec,
    input.calciumDriveParams,
  );
  const calciumDrive = Object.freeze({
    freeCalciumUMByWall: calciumEvaluation.freeCalciumUMByWall,
  });
  const pthMmHg = commonIntrathoracicPressureMmHg(
    candidateTimeSec,
    input.runtime,
  );
  const circulationTrial = evaluateNonCoronaryCirculationBackwardEulerTrialV1<
    MainWireFiveWallCoronaryCandidateMechanicsEvaluationV2<TWallState>,
    MainWireFiveWallCoronaryCompanionTrialV2
  >({
    previousAcceptedState: previous.circulation,
    dtSec: input.dtSec,
    runtime: input.runtime,
    options: input.circulationNewtonOptions,
    protocolResistanceScaleByEdge: input.protocolResistanceScaleByEdge,
    evaluateCandidateMechanics: (volumesMl) => {
      const mechanicsTrial = evaluateWholeHeartMechanicsTrialV1(provider, {
        previousAcceptedState: previous.mechanics,
        candidateTimeSec,
        stepDtSec: input.dtSec,
        candidateVolumesMl: volumesMl,
        drivingInputs: calciumDrive,
      });
      if (
        !mechanicsTrial.diagnostics.converged
        || !mechanicsTrial.diagnostics.finite
        || mechanicsTrial.diagnostics.errors.length > 0
      ) {
        throw new Error(
          `five-wall mechanics trial failed: ${
            mechanicsTrial.diagnostics.errors.join("; ")
              || "provider reported not-ready diagnostics"
          }`,
        );
      }
      const pericardium = evaluateMainWireCommonPericardiumBindingV1(
        input.pericardium,
        volumesMl,
      );
      const coronaryMechanicsCoupling =
        evaluateMainWireCoronaryMechanicsCouplingV1(mechanicsTrial, {
          commonIntrathoracicPressureMmHg: pthMmHg,
          commonPericardialExcessPressureMmHg:
            pericardium.excessPressureMmHg,
        });
      const sourceImpByTerritoryLayer = evaluateAllCoronaryImpV1(
        coronaryMechanicsCoupling.input,
      );
      const evaluation = Object.freeze({
        mechanicsTrial,
        pericardium,
        coronaryMechanicsCoupling,
        sourceImpByTerritoryLayer,
        sourceIntramyocardialPressureMmHgByTerritoryLayer:
          intramyocardialPressureRecord(sourceImpByTerritoryLayer),
      });
      return Object.freeze({
        absolutePressuresMmHg: Object.freeze({
          LA: mechanicsTrial.transmuralPressuresMmHg.LA + pthMmHg
            + pericardium.excessPressureMmHg,
          LV: mechanicsTrial.transmuralPressuresMmHg.LV + pthMmHg
            + pericardium.excessPressureMmHg,
          RA: mechanicsTrial.transmuralPressuresMmHg.RA + pthMmHg
            + pericardium.excessPressureMmHg,
          RV: mechanicsTrial.transmuralPressuresMmHg.RV + pthMmHg
            + pericardium.excessPressureMmHg,
        }),
        ...(mechanicsTrial.transmuralPressureVolumeTangentMmHgPerMl
          === undefined
          ? {}
          : {
            absolutePressureTangent: absoluteChamberPressureTangent(
              mechanicsTrial.transmuralPressureVolumeTangentMmHgPerMl,
              pericardium,
            ),
          }),
        evaluation,
      });
    },
    conservativeCompanion: Object.freeze({
      fixedGlobalTotalBloodVolumeMl:
        previous.fixedGlobalTotalBloodVolumeMl,
      previousAcceptedCompanionBloodVolumeMl:
        coronaryBloodVolumeMl(previous.coronary),
      evaluateSameCandidate: (candidate) => {
        const mechanics = candidate.candidateMechanicsEvaluation;
        const boundary = resolveMainWireCoronaryBoundaryV2(
          Object.freeze({
            absoluteAorticPressureMmHg:
              candidate.boundaryAbsolutePressuresMmHg.Ao,
            absoluteRightAtrialPressureMmHg:
              candidate.boundaryAbsolutePressuresMmHg.RA,
            sourceIntramyocardialPressureMmHgByTerritoryLayer:
              mechanics.sourceIntramyocardialPressureMmHgByTerritoryLayer,
            mechanicsInput: mechanics.coronaryMechanicsCoupling.input,
            effectiveFiberLogStrainByWall:
              mechanics.coronaryMechanicsCoupling
                .effectiveFiberLogStrainByWall,
          }),
          impMechanism,
          previous.mvcReferenceState.reference,
          shorteningImpPrior,
        );
        // Every outer Newton/FD/line-search probe starts from the same accepted
        // V2 state. No candidate is retained as a hidden warm start.
        const coronaryTrial = solveCoronaryBackwardEulerTrialV2(
          previous.coronary,
          Object.freeze({
            dtSec: input.dtSec,
            boundary,
            disease: input.coronaryDisease
              ?? NORMAL_CORONARY_DISEASE_INPUT_V2,
            collapseHydraulics,
            solverOptions: input.coronarySolverOptions,
          }),
          prior,
          topology,
        );
        return Object.freeze({
          candidateCompanionBloodVolumeMl:
            coronaryTrial.diagnostics.candidateCoronaryBloodVolumeMl,
          outerBoundaryNetVolumeRateMlPerSec: Object.freeze({
            Ao: -coronaryTrial.diagnostics.hydraulics
              .totalInletFlowMlPerSec,
            RA: coronaryTrial.diagnostics.hydraulics
              .commonCoronaryVenousOutletFlowMlPerSec,
          }),
          candidateCompanionTrial: Object.freeze({
            coronaryTrial,
            boundary,
          }),
        });
      },
    }),
  });

  if (circulationTrial.converged === false) {
    return Object.freeze({
      converged: false as const,
      reason: "circulation-mechanics-or-coronary-v2-trial-failed" as const,
      message: circulationTrial.message,
      rollbackState: rollbackTuple(
        provider,
        previous,
        circulationTrial.rollbackState,
      ),
      circulationFailureReason: circulationTrial.reason,
      lastAcceptedCandidateNodeVolumesMl:
        circulationTrial.lastAcceptedCandidateNodeVolumesMl,
      circulationDiagnostics: circulationTrial.diagnostics,
      mechanicsCommitted: false as const,
      circulationCommitted: false as const,
      coronaryCommitted: false as const,
      mvcReferenceCommitted: false as const,
    });
  }

  const candidateEvaluation = circulationTrial.candidateMechanicsEvaluation;
  const mechanicsTrial = candidateEvaluation.mechanicsTrial;
  validateCoupledTrial(previous, circulationTrial, mechanicsTrial);
  const circulationCommit =
    commitNonCoronaryCirculationTrialWithConservativeCompanionV1(
      previous.circulation,
      circulationTrial,
    );
  const companionTrial = circulationCommit.candidateCompanionTrial;
  if (companionTrial !== circulationTrial.conservativeCompanion
      ?.candidateCompanionTrial) {
    throw new Error("coronary V2 companion promotion changed trial identity");
  }
  const nextMechanics = commitWholeHeartMechanicsTrialV1(
    provider,
    previous.mechanics,
    mechanicsTrial,
  );
  const nextMvcReference = advanceMainWireCoronaryMvcReferenceV2(
    previous.mvcReferenceState,
    Object.freeze({
      acceptedTimeSec: circulationTrial.candidateTimeSec,
      acceptedRevision: previous.revision + 1,
      mitralForwardFlowMlPerSec:
        circulationTrial.edgeFlowsMlPerSec.MV,
      effectiveFiberLogStrainByWall:
        candidateEvaluation.coronaryMechanicsCoupling
          .effectiveFiberLogStrainByWall,
    }),
  );
  const acceptedState = acceptedTuple(
    previous.revision + 1,
    circulationCommit.fixedGlobalTotalBloodVolumeMl,
    previous.coronaryBinding,
    circulationCommit.acceptedNonCoronaryPartitionState,
    companionTrial.coronaryTrial.candidateAcceptedState,
    nextMechanics,
    nextMvcReference,
  );
  return Object.freeze({
    converged: true as const,
    acceptedState,
    circulationTrial,
    mechanicsTrial,
    coronaryTrial: companionTrial.coronaryTrial,
    coronaryBoundary: companionTrial.boundary,
    coronaryMechanicsCoupling:
      candidateEvaluation.coronaryMechanicsCoupling,
    intramyocardialPressureMmHgByTerritoryLayer:
      companionTrial.boundary
        .intramyocardialPressureMmHgByTerritoryLayer,
    calciumDrive,
    commonIntrathoracicPressureMmHg: pthMmHg,
    pericardium: candidateEvaluation.pericardium,
    mvcReferenceUpdated:
      nextMvcReference.acceptedMitralClosureEventCount
      > previous.mvcReferenceState.acceptedMitralClosureEventCount,
  });
}

export function advanceMainWireCoronaryMvcReferenceV2(
  previous: MainWireCoronaryMvcReferenceStateV2,
  input: Readonly<{
    acceptedTimeSec: number;
    acceptedRevision: number;
    mitralForwardFlowMlPerSec: number;
    effectiveFiberLogStrainByWall: MainWireCoronaryWallNumbersV2;
  }>,
): MainWireCoronaryMvcReferenceStateV2 {
  validateMvcReferenceState(previous);
  requireNonnegativeFinite(input.acceptedTimeSec, "acceptedTimeSec");
  if (!Number.isInteger(input.acceptedRevision) || input.acceptedRevision < 0) {
    throw new RangeError("acceptedRevision must be a non-negative integer");
  }
  requireFinite(input.mitralForwardFlowMlPerSec, "mitralForwardFlowMlPerSec");
  validateWallNumbers(input.effectiveFiberLogStrainByWall);
  const active = input.mitralForwardFlowMlPerSec
    > MITRAL_FORWARD_FLOW_ACTIVE_THRESHOLD_ML_PER_SEC;
  const closed = previous.mitralForwardFlowActive && !active;
  return Object.freeze({
    reference: closed
      ? shorteningReference(input.effectiveFiberLogStrainByWall)
      : shorteningReference(previous.reference.referenceFiberLogStrainByWall),
    referenceAcceptedTimeSec: closed
      ? input.acceptedTimeSec
      : previous.referenceAcceptedTimeSec,
    referenceRevision: closed
      ? input.acceptedRevision
      : previous.referenceRevision,
    mitralForwardFlowActive: active,
    acceptedMitralClosureEventCount:
      previous.acceptedMitralClosureEventCount + (closed ? 1 : 0),
  });
}

function validateCoupledTrial<TWallState>(
  previous: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
  circulation: NonCoronaryCirculationTrialSuccessV1<
    MainWireFiveWallCoronaryCandidateMechanicsEvaluationV2<TWallState>,
    MainWireFiveWallCoronaryCompanionTrialV2
  >,
  mechanics: WholeHeartMechanicsTrialV1<TWallState>,
): void {
  const companion = circulation.conservativeCompanion;
  if (companion === undefined) {
    throw new Error("coronary V2 coupled trial is missing companion readback");
  }
  const coronary = companion.candidateCompanionTrial.coronaryTrial;
  if (
    circulation.baseRevision !== previous.circulation.revision
    || mechanics.baseRevision !== previous.mechanics.revision
    || coronary.baseAcceptedRevision !== previous.coronary.revision
    || !nearlyEqual(
      coronary.baseAcceptedTimeSec,
      previous.coronary.acceptedTimeSec,
    )
    || !nearlyEqual(circulation.candidateTimeSec, mechanics.candidateTimeSec)
    || !nearlyEqual(
      circulation.candidateTimeSec,
      coronary.candidateAcceptedState.acceptedTimeSec,
    )
    || !nearlyEqual(circulation.dtSec, mechanics.stepDtSec)
    || !nearlyEqual(circulation.dtSec, coronary.dtSec)
  ) {
    throw new Error(
      "coupled circulation/mechanics/coronary V2 trial identity mismatch",
    );
  }
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (!nearlyEqual(
      circulation.candidateNodeVolumesMl[chamber],
      mechanics.candidateVolumesMl[chamber],
    )) throw new Error(`coupled ${chamber} candidate volume mismatch`);
  }
  const hydraulics = coronary.diagnostics.hydraulics;
  if (
    !nearlyEqual(
      companion.candidateCompanionBloodVolumeMl,
      coronaryBloodVolumeMl(coronary.candidateAcceptedState),
    )
    || !nearlyEqual(
      companion.outerBoundaryNetVolumeRateMlPerSec.Ao,
      -hydraulics.totalInletFlowMlPerSec,
    )
    || !nearlyEqual(
      companion.outerBoundaryNetVolumeRateMlPerSec.RA,
      hydraulics.commonCoronaryVenousOutletFlowMlPerSec,
    )
  ) throw new Error("coronary V2 companion volume or boundary-rate mismatch");
}

function rollbackTuple<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
  circulationRollback: NonCoronaryCirculationAcceptedStateV1,
): MainWireFiveWallCoronaryAcceptedStateV2<TWallState> {
  return acceptedTuple(
    previous.revision,
    previous.fixedGlobalTotalBloodVolumeMl,
    previous.coronaryBinding,
    circulationRollback,
    previous.coronary,
    cloneWholeHeartMechanicsAcceptedStateV1(provider, previous.mechanics),
    previous.mvcReferenceState,
  );
}

function acceptedTuple<TWallState>(
  revision: number,
  fixedGlobalTotalBloodVolumeMl: number,
  coronaryBinding: MainWireFiveWallCoronaryBindingV2,
  circulation: NonCoronaryCirculationAcceptedStateV1,
  coronary: CoronaryAcceptedHydraulicStateV2,
  mechanics: WholeHeartMechanicsAcceptedStateV1<TWallState>,
  mvcReferenceState: MainWireCoronaryMvcReferenceStateV2,
): MainWireFiveWallCoronaryAcceptedStateV2<TWallState> {
  if (
    circulation.revision !== revision
    || coronary.revision !== revision
    || mechanics.revision !== revision
    || !nearlyEqual(circulation.acceptedTimeSec, coronary.acceptedTimeSec)
    || !nearlyEqual(circulation.acceptedTimeSec, mechanics.acceptedTimeSec)
  ) {
    throw new Error(
      "accepted circulation/mechanics/coronary V2 revisions or times differ",
    );
  }
  if (!nearlyEqual(
    circulation.totalBloodVolumeMl + coronaryBloodVolumeMl(coronary),
    fixedGlobalTotalBloodVolumeMl,
  )) throw new Error("accepted 31-volume partitions violate fixed global TBV");
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (!nearlyEqual(
      circulation.nodeVolumesMl[chamber],
      mechanics.acceptedVolumesMl[chamber],
    )) throw new Error(`accepted ${chamber} volume mismatch`);
  }
  validateBinding(coronaryBinding);
  validateMvcReferenceState(mvcReferenceState);
  if (
    mvcReferenceState.referenceRevision > revision
    || mvcReferenceState.referenceAcceptedTimeSec
      > circulation.acceptedTimeSec + 1e-12
  ) throw new Error("MVC reference is newer than the accepted tuple");
  return Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
    revision,
    acceptedTimeSec: circulation.acceptedTimeSec,
    fixedGlobalTotalBloodVolumeMl,
    coronaryBinding: Object.freeze({ ...coronaryBinding }),
    circulation,
    coronary,
    mechanics,
    mvcReferenceState: copyMvcReferenceState(mvcReferenceState),
  });
}

function validateAcceptedTuple<TWallState>(
  state: MainWireFiveWallCoronaryAcceptedStateV2<TWallState>,
): void {
  if (state.transactionId !== MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID) {
    throw new Error("accepted coupled coronary V2 transaction id is invalid");
  }
  acceptedTuple(
    state.revision,
    state.fixedGlobalTotalBloodVolumeMl,
    state.coronaryBinding,
    state.circulation,
    state.coronary,
    state.mechanics,
    state.mvcReferenceState,
  );
}

function buildBinding(
  prior: CoronaryTopologyPriorV2,
  collapseHydraulics: CoronaryCollapseHydraulicsPriorV2,
  impMechanism: MainWireCoronaryImpMechanismV2,
  shorteningImpPrior: MainWireCoronaryShorteningImpGainPriorV2,
): MainWireFiveWallCoronaryBindingV2 {
  return Object.freeze({
    topologyId: prior.topologyId,
    priorFingerprint: coronaryTopologyPriorFingerprintV2(prior),
    collapseHydraulicsFingerprint:
      coronaryConfigurationFingerprintV2(collapseHydraulics),
    boundaryResolverId: MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
    impMechanism,
    shorteningImpPriorFingerprint:
      coronaryConfigurationFingerprintV2(shorteningImpPrior),
    mvcReferenceSemantics:
      "previous-accepted-mitral-closure-fiber-strain-v1" as const,
  });
}

function validateBinding(binding: MainWireFiveWallCoronaryBindingV2): void {
  if (binding.topologyId !== CORONARY_TOPOLOGY_ID_V2) {
    throw new Error("coronary V2 binding topology id is unsupported");
  }
  if (binding.boundaryResolverId !== MAIN_WIRE_CORONARY_BOUNDARY_V2_ID) {
    throw new Error("coronary V2 binding boundary resolver is unsupported");
  }
  if (
    binding.impMechanism !== "source-cep-land-active"
    && binding.impMechanism !== "cep-only-control"
    && binding.impMechanism !== "cep-shortening-induced"
  ) {
    throw new Error("coronary V2 binding IMP mechanism is unsupported");
  }
  if (
    binding.mvcReferenceSemantics
    !== "previous-accepted-mitral-closure-fiber-strain-v1"
  ) {
    throw new Error("coronary V2 binding MVC reference semantics are unsupported");
  }
  for (const [label, value] of [
    ["prior", binding.priorFingerprint],
    ["collapse", binding.collapseHydraulicsFingerprint],
    ["shortening IMP", binding.shorteningImpPriorFingerprint],
  ] as const) {
    if (!/^fnv1a32-[0-9a-f]{8}$/.test(value)) {
      throw new Error(`${label} fingerprint must use the coronary FNV-1a contract`);
    }
  }
}

function assertSameBinding(
  accepted: MainWireFiveWallCoronaryBindingV2,
  requested: MainWireFiveWallCoronaryBindingV2,
): void {
  if (JSON.stringify(accepted) !== JSON.stringify(requested)) {
    throw new Error("accepted coronary V2 binding and step configuration differ");
  }
}

function resolveCollapseHydraulics(
  prior: CoronaryTopologyPriorV2,
  supplied: CoronaryCollapseHydraulicsPriorV2 | undefined,
): CoronaryCollapseHydraulicsPriorV2 {
  if (supplied !== undefined) return supplied;
  return coronaryTopologyPriorFingerprintV2(prior)
    === MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_FINGERPRINT_V2
    ? MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2
    : buildCoronaryCollapseHydraulicsPriorV2(
      buildCoronaryTopologyV2(prior),
    );
}

function initialMvcReferenceState(
  timeSec: number,
  fiberLogStrainByWall: MainWireCoronaryWallNumbersV2,
): MainWireCoronaryMvcReferenceStateV2 {
  return Object.freeze({
    reference: shorteningReference(fiberLogStrainByWall),
    referenceAcceptedTimeSec: timeSec,
    referenceRevision: 0,
    mitralForwardFlowActive: false,
    acceptedMitralClosureEventCount: 0,
  });
}

function shorteningReference(
  fiberLogStrainByWall: MainWireCoronaryWallNumbersV2,
): MainWireCoronaryShorteningReferenceV2 {
  validateWallNumbers(fiberLogStrainByWall);
  return Object.freeze({
    referenceFiberLogStrainByWall: Object.freeze({
      ...fiberLogStrainByWall,
    }),
  });
}

function copyMvcReferenceState(
  state: MainWireCoronaryMvcReferenceStateV2,
): MainWireCoronaryMvcReferenceStateV2 {
  return Object.freeze({
    ...state,
    reference: shorteningReference(
      state.reference.referenceFiberLogStrainByWall,
    ),
  });
}

function validateMvcReferenceState(
  state: MainWireCoronaryMvcReferenceStateV2,
): void {
  validateWallNumbers(state.reference.referenceFiberLogStrainByWall);
  requireNonnegativeFinite(
    state.referenceAcceptedTimeSec,
    "MVC referenceAcceptedTimeSec",
  );
  if (!Number.isInteger(state.referenceRevision) || state.referenceRevision < 0) {
    throw new RangeError("MVC referenceRevision must be non-negative integer");
  }
  if (typeof state.mitralForwardFlowActive !== "boolean") {
    throw new TypeError("mitralForwardFlowActive must be boolean");
  }
  if (
    !Number.isInteger(state.acceptedMitralClosureEventCount)
    || state.acceptedMitralClosureEventCount < 0
  ) throw new RangeError("MVC event count must be non-negative integer");
}

function validateWallNumbers(value: MainWireCoronaryWallNumbersV2): void {
  for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
    requireFinite(value[wallId], `${wallId} fiber log strain`);
  }
}

function createCanonicalNonCoronaryPartitionV2(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  fixedGlobalTotalBloodVolumeMl: number,
  coronaryVolumeMl: number,
  timeSec: number,
): NonCoronaryCirculationAcceptedStateV1 {
  const targetNonCoronaryBloodVolumeMl =
    fixedGlobalTotalBloodVolumeMl - coronaryVolumeMl;
  requirePositiveFinite(
    targetNonCoronaryBloodVolumeMl,
    "target non-coronary blood volume",
  );
  const operatingPoint = resolveMainWireNormalAdultBloodVolumeProtocolTargetV1(
    runtime,
    targetNonCoronaryBloodVolumeMl,
  );
  return createInitialNonCoronaryCirculationStateV1({
    fixedTotalBloodVolumeMl: operatingPoint.fixedTotalBloodVolumeMl,
    nodeVolumesMl: operatingPoint.nodeVolumesMl,
    timeSec,
    runtime,
  });
}

function assertSameChamberVolumes(
  left: NonCoronaryCirculationAcceptedStateV1,
  right: NonCoronaryCirculationAcceptedStateV1,
  label: string,
): void {
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (!nearlyEqual(
      left.nodeVolumesMl[chamber],
      right.nodeVolumesMl[chamber],
    )) throw new Error(`${label} changed ${chamber} cold volume`);
  }
}

function absoluteAorticPressureMmHg(
  circulation: NonCoronaryCirculationAcceptedStateV1,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): number {
  const graph = buildNonCoronaryCirculationGraphV1();
  const node = graph.nodes[graph.nodeIndex.get("Ao")!];
  if (node.name !== "Ao" || node.ext !== undefined) {
    throw new Error("main-wire Ao boundary topology changed");
  }
  return vascularTransmuralPressureFromPhysicalVolumeV1(
    node,
    circulation.nodeVolumesMl.Ao,
    runtime.vascular,
    "adaptive-volume-tolerance",
  );
}

function intramyocardialPressureRecord(
  evaluations: CoronaryTerritoryLayerRecordV2<CoronaryImpEvaluationV1>,
): CoronaryTerritoryLayerRecordV2<number> {
  return Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Object.freeze(Object.fromEntries(
        CORONARY_LAYER_IDS_V2.map((layerId) => [
          layerId,
          evaluations[territoryId][layerId].intramyocardialPressureMmHg,
        ]),
      )) as CoronaryLayerRecordV2<number>,
    ]),
  )) as CoronaryTerritoryLayerRecordV2<number>;
}

function coronaryBloodVolumeMl(
  state: CoronaryAcceptedHydraulicStateV2,
): number {
  return CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.reduce(
    (sum, nodeId) => sum + state.volumeMlByNode[nodeId],
    0,
  );
}

function chamberVolumes(
  circulation: NonCoronaryCirculationAcceptedStateV1,
): Readonly<{ LA: number; LV: number; RA: number; RV: number }> {
  return Object.freeze({
    LA: circulation.nodeVolumesMl.LA,
    LV: circulation.nodeVolumesMl.LV,
    RA: circulation.nodeVolumesMl.RA,
    RV: circulation.nodeVolumesMl.RV,
  });
}

function commonIntrathoracicPressureMmHg(
  timeSec: number,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): number {
  return respiratoryExternalPressureForKindV1(
    "pth",
    timeSec,
    runtime.respiratory,
  );
}

function absoluteChamberPressureTangent(
  transmural: WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  pericardium: MainWireCommonPericardiumEvaluationV1,
): NonCoronaryAbsoluteChamberPressureTangentV1 {
  const commonPericardiumTangentMmHgPerMl =
    pericardium.pressureDerivativePaPerM3 * 1e-6 / PA_PER_MMHG;
  requireFinite(
    commonPericardiumTangentMmHgPerMl,
    "common pericardium pressure tangent",
  );
  const matrix = NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.map(
    (pressureChamber) => Object.freeze(
      NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.map((volumeChamber) => {
        const intrinsic = transmural[pressureChamber][volumeChamber];
        requireFinite(
          intrinsic,
          `${pressureChamber}/${volumeChamber} transmural pressure tangent`,
        );
        return intrinsic + commonPericardiumTangentMmHgPerMl;
      }),
    ),
  ) as unknown as NonCoronaryAbsoluteChamberPressureTangentV1[
    "dPressureDVolumeMmHgPerMl"
  ];
  return Object.freeze({
    rowPressureOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    columnVolumeOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    units: "mmHg/mL" as const,
    pressureKind: "absolute" as const,
    derivativeSemantics:
      "candidate-algorithmic-at-fixed-accepted-state-time-dt-and-drive" as const,
    dPressureDVolumeMmHgPerMl: matrix,
  });
}

function requirePositiveFinite(value: number, label: string): void {
  requireFinite(value, label);
  if (!(value > 0)) throw new RangeError(`${label} must be positive`);
}

function requireNonnegativeFinite(value: number, label: string): void {
  requireFinite(value, label);
  if (value < 0) throw new RangeError(`${label} must be non-negative`);
}

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`);
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right)
    <= 1e-10 * Math.max(1, Math.abs(left), Math.abs(right));
}
