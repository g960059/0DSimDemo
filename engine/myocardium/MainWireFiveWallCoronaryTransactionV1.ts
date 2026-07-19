import {
  commitNonCoronaryCirculationTrialWithConservativeCompanionV1,
  createInitialNonCoronaryCirculationStateV1,
  evaluateNonCoronaryCirculationBackwardEulerTrialV1,
  NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
  type NonCoronaryAbsoluteChamberPressureTangentV1,
  type NonCoronaryCirculationAcceptedStateV1,
  type NonCoronaryCirculationInitialStateInputV1,
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
} from "@/engine/core/circulationGraphKernelV1";
import {
  CoronaryBackwardEulerTransactionV1,
  createInitialCoronaryAcceptedHydraulicStateV1,
  NORMAL_CORONARY_DISEASE_INPUT_V1,
  solveCoronaryBackwardEulerTrialV1,
  type CoronaryAcceptedHydraulicStateV1,
  type CoronaryBackwardEulerSolverOptionsV1,
  type CoronaryBackwardEulerTrialV1,
  type CoronaryDiseaseInputV1,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV1";
import {
  evaluateAllCoronaryImpV1,
  type CoronaryImpEvaluationV1,
} from "@/engine/coronary/intramyocardialPressureV1";
import {
  evaluateMainWireCoronaryMechanicsCouplingV1,
  type MainWireCoronaryMechanicsCouplingEvaluationV1,
} from "@/engine/coronary/mainWireMechanicsCouplingV1";
import {
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
  type CoronaryTopologyPriorV1,
} from "@/engine/coronary/topologyPriorV1";
import {
  CORONARY_LAYER_IDS_V1,
  CORONARY_TERRITORY_IDS_V1,
  type CoronaryLayerRecordV1,
  type CoronaryTerritoryLayerRecordV1,
} from "@/engine/coronary/typesV1";
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
  commitPreparedWholeHeartMechanicsTrialV1,
  evaluatePreparedWholeHeartMechanicsTrialV1,
  initializeWholeHeartMechanicsColdV1,
  prepareWholeHeartMechanicsStepV1,
  type WholeHeartMechanicsAcceptedStateV1,
  type WholeHeartMechanicsPressureVolumeTangentMmHgPerMlV1,
  type WholeHeartMechanicsProviderV1,
  type WholeHeartMechanicsTrialV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1,
  resolveMainWireNormalAdultBloodVolumeProtocolTargetV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";

export const MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V1_ID =
  "main-wire-five-wall-coronary-transaction-v1" as const;

const PA_PER_MMHG = 133.322;

export const MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V1 =
  Object.freeze({
    circulationOwner:
      "main-wire-derived-noncoronary-plus-coronary-implicit-transaction" as const,
    modelCoreRuntimeAdopted: false as const,
    mechanicsOwner: "one-joint-five-wall-provider" as const,
    coronaryMechanicsDrive:
      "same-candidate-land-triseg-active-stress-and-cavity-pressure" as const,
    coronaryBoundaryCoupling:
      "aortic-uptake-and-coronary-sinus-right-atrial-return-in-outer-be-residual" as const,
    totalBloodVolumeOwner:
      "one-fixed-global-ledger-including-ten-coronary-volumes" as const,
    companionNewtonSemantics:
      "every-probe-restarts-from-the-same-previous-accepted-coronary-state" as const,
    mechanicsProbeContext:
      "one-audited-private-accepted-mechanics-snapshot-per-outer-step" as const,
    circulationMechanicsAndCoronaryCommit:
      "atomic-after-all-three-trials-succeed" as const,
    failureSemantics: "rollback-all-three-accepted-states" as const,
    commonIntrathoracicPressureAppliedOnce: true as const,
    commonPericardialPressureAppliedOnce: true as const,
    coronaryCirculationIncluded: true as const,
    coronaryAutoregulationAdvancedHere: false as const,
    parameterFittingOwnedHere: false as const,
  });

export type MainWireFiveWallCoronaryAcceptedStateV1<TWallState> = Readonly<{
  transactionId: typeof MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V1_ID;
  revision: number;
  acceptedTimeSec: number;
  fixedGlobalTotalBloodVolumeMl: number;
  coronaryTopologyId: CoronaryTopologyPriorV1["topologyId"];
  /** The main-wire non-coronary partition; its TBV changes with coronary storage. */
  circulation: NonCoronaryCirculationAcceptedStateV1;
  coronary: CoronaryAcceptedHydraulicStateV1;
  mechanics: WholeHeartMechanicsAcceptedStateV1<TWallState>;
}>;

export type MainWireFiveWallCoronaryCandidateMechanicsEvaluationV1<
  TWallState,
> = Readonly<{
  mechanicsTrial: WholeHeartMechanicsTrialV1<TWallState>;
  pericardium: MainWireCommonPericardiumEvaluationV1;
  coronaryMechanicsCoupling:
    MainWireCoronaryMechanicsCouplingEvaluationV1;
  impByTerritoryLayer:
    CoronaryTerritoryLayerRecordV1<CoronaryImpEvaluationV1>;
  intramyocardialPressureMmHgByTerritoryLayer:
    CoronaryTerritoryLayerRecordV1<number>;
}>;

export type MainWireFiveWallCoronaryInitializeInputV1<TWallState> = Readonly<{
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
  pericardium: MainWireCommonPericardiumBindingV1;
  circulationInitial?: Omit<
    NonCoronaryCirculationInitialStateInputV1,
    "timeSec" | "runtime"
  >;
  coronaryInitial?: CoronaryAcceptedHydraulicStateV1;
  coronaryPrior?: CoronaryTopologyPriorV1;
  /**
   * Defaults to the 5600 mL authoritative full-graph normal-adult reference
   * when the canonical circulation initialization is used. A caller-supplied
   * circulationInitial is already partitioned and retains its explicit owner.
   */
  fixedGlobalTotalBloodVolumeMl?: number;
  timeSec?: number;
}>;

export type MainWireFiveWallCoronaryColdResultV1<TWallState> = Readonly<{
  acceptedState: MainWireFiveWallCoronaryAcceptedStateV1<TWallState>;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
  transmuralPressuresMmHg: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>;
  commonIntrathoracicPressureMmHg: number;
  pericardium: MainWireCommonPericardiumEvaluationV1;
}>;

export type MainWireFiveWallCoronaryStepSuccessV1<TWallState> = Readonly<{
  converged: true;
  acceptedState: MainWireFiveWallCoronaryAcceptedStateV1<TWallState>;
  circulationTrial: NonCoronaryCirculationTrialSuccessV1<
    MainWireFiveWallCoronaryCandidateMechanicsEvaluationV1<TWallState>,
    CoronaryBackwardEulerTrialV1
  >;
  mechanicsTrial: WholeHeartMechanicsTrialV1<TWallState>;
  coronaryTrial: CoronaryBackwardEulerTrialV1;
  coronaryMechanicsCoupling:
    MainWireCoronaryMechanicsCouplingEvaluationV1;
  intramyocardialPressureMmHgByTerritoryLayer:
    CoronaryTerritoryLayerRecordV1<number>;
  calciumDrive: MainWireFiveWallFreeCalciumDriveV1;
  commonIntrathoracicPressureMmHg: number;
  pericardium: MainWireCommonPericardiumEvaluationV1;
}>;

export type MainWireFiveWallCoronaryStepFailureV1<TWallState> = Readonly<{
  converged: false;
  reason: "circulation-mechanics-or-coronary-trial-failed";
  message: string;
  rollbackState: MainWireFiveWallCoronaryAcceptedStateV1<TWallState>;
  circulationFailureReason: NonCoronaryCirculationTrialFailureReasonV1;
  lastAcceptedCandidateNodeVolumesMl:
    NonCoronaryCirculationTrialFailureV1["lastAcceptedCandidateNodeVolumesMl"];
  circulationDiagnostics: NonCoronaryCirculationTrialDiagnosticsV1;
  mechanicsCommitted: false;
  circulationCommitted: false;
  coronaryCommitted: false;
}>;

export type MainWireFiveWallCoronaryStepResultV1<TWallState> =
  | MainWireFiveWallCoronaryStepSuccessV1<TWallState>
  | MainWireFiveWallCoronaryStepFailureV1<TWallState>;

export function initializeMainWireFiveWallCoronaryV1<TWallState>(
  input: MainWireFiveWallCoronaryInitializeInputV1<TWallState>,
): MainWireFiveWallCoronaryColdResultV1<TWallState> {
  const timeSec = input.timeSec ?? 0;
  requireNonnegativeFinite(timeSec, "timeSec");
  const coronaryPrior = input.coronaryPrior
    ?? NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1;
  const coronarySeed = input.coronaryInitial
    ?? createInitialCoronaryAcceptedHydraulicStateV1(coronaryPrior);
  if (coronarySeed.revision !== 0) {
    throw new Error("initial coronary state must have revision zero");
  }
  const coronary = new CoronaryBackwardEulerTransactionV1(
    coronaryPrior,
    Object.freeze({
      ...coronarySeed,
      acceptedTimeSec: timeSec,
      revision: 0,
    }),
  ).getAcceptedState();
  const coronaryVolumeMl = coronaryBloodVolumeMl(coronary);
  const canonicalGlobalTotalBloodVolumeMl =
    MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1
      .fullGraphReferenceTotalBloodVolumeMl;
  const fixedGlobalTotalBloodVolumeMl = input.fixedGlobalTotalBloodVolumeMl
    ?? (input.circulationInitial === undefined
      ? canonicalGlobalTotalBloodVolumeMl
      : input.circulationInitial.fixedTotalBloodVolumeMl + coronaryVolumeMl);
  requirePositiveFinite(
    fixedGlobalTotalBloodVolumeMl,
    "fixedGlobalTotalBloodVolumeMl",
  );
  const circulationInitial = input.circulationInitial
    ?? canonicalNonCoronaryPartitionForCoronaryV1(
      input.runtime,
      fixedGlobalTotalBloodVolumeMl,
      coronaryVolumeMl,
    );
  const circulation = createInitialNonCoronaryCirculationStateV1({
    ...circulationInitial,
    timeSec,
    runtime: input.runtime,
  });
  const partitionTotalMl = circulation.totalBloodVolumeMl
    + coronaryVolumeMl;
  if (!nearlyEqual(partitionTotalMl, fixedGlobalTotalBloodVolumeMl)) {
    throw new Error(
      "initial non-coronary and coronary partitions do not match global TBV",
    );
  }
  const calciumEvaluation = evaluateFiveWallNormalCalciumDriveV1(
    timeSec,
    input.calciumDriveParams,
  );
  const calciumDrive = Object.freeze({
    freeCalciumUMByWall: calciumEvaluation.freeCalciumUMByWall,
  });
  const mechanicsCold = initializeWholeHeartMechanicsColdV1(input.provider, {
    timeSec,
    volumesMl: chamberVolumes(circulation),
    drivingInputs: calciumDrive,
  });
  const pericardium = evaluateMainWireCommonPericardiumBindingV1(
    input.pericardium,
    chamberVolumes(circulation),
  );
  return Object.freeze({
    acceptedState: acceptedTriplet(
      0,
      fixedGlobalTotalBloodVolumeMl,
      coronaryPrior.topologyId,
      circulation,
      coronary,
      mechanicsCold.acceptedState,
    ),
    calciumDrive,
    transmuralPressuresMmHg: Object.freeze({
      ...mechanicsCold.transmuralPressuresMmHg,
    }),
    commonIntrathoracicPressureMmHg: commonIntrathoracicPressureMmHg(
      timeSec,
      input.runtime,
    ),
    pericardium,
  });
}

function canonicalNonCoronaryPartitionForCoronaryV1(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  fixedGlobalTotalBloodVolumeMl: number,
  coronaryVolumeMl: number,
): Omit<NonCoronaryCirculationInitialStateInputV1, "timeSec" | "runtime"> {
  const targetNonCoronaryBloodVolumeMl =
    fixedGlobalTotalBloodVolumeMl - coronaryVolumeMl;
  requirePositiveFinite(
    targetNonCoronaryBloodVolumeMl,
    "target non-coronary blood volume",
  );
  const operatingPoint =
    resolveMainWireNormalAdultBloodVolumeProtocolTargetV1(
      runtime,
      targetNonCoronaryBloodVolumeMl,
    );
  return Object.freeze({
    fixedTotalBloodVolumeMl: operatingPoint.fixedTotalBloodVolumeMl,
    nodeVolumesMl: operatingPoint.nodeVolumesMl,
  });
}

export function stepMainWireFiveWallCoronaryV1<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireFiveWallCoronaryAcceptedStateV1<TWallState>,
  input: Readonly<{
    dtSec: number;
    runtime: NonCoronaryCirculationRuntimeParamsV1;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
    pericardium: MainWireCommonPericardiumBindingV1;
    coronaryPrior?: CoronaryTopologyPriorV1;
    coronaryDisease?: CoronaryDiseaseInputV1;
    coronarySolverOptions?: Partial<CoronaryBackwardEulerSolverOptionsV1>;
    /** Optional numerical/audit controls; not a physiological case parameter. */
    circulationNewtonOptions?: NonCoronaryCirculationNewtonOptionsV1;
    /** Protocol-only transient occlusion; never persisted as a case parameter. */
    protocolResistanceScaleByEdge?:
      NonCoronaryProtocolResistanceScaleByEdgeV1;
  }>,
): MainWireFiveWallCoronaryStepResultV1<TWallState> {
  validateAcceptedTriplet(previous);
  requirePositiveFinite(input.dtSec, "dtSec");
  const coronaryPrior = input.coronaryPrior
    ?? NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1;
  if (coronaryPrior.topologyId !== previous.coronaryTopologyId) {
    throw new Error("accepted coronary topology and step prior differ");
  }
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
  const mechanicsStep = prepareWholeHeartMechanicsStepV1(provider, {
    previousAcceptedState: previous.mechanics,
    candidateTimeSec,
    stepDtSec: input.dtSec,
    drivingInputs: calciumDrive,
  });
  const circulationTrial = evaluateNonCoronaryCirculationBackwardEulerTrialV1<
    MainWireFiveWallCoronaryCandidateMechanicsEvaluationV1<TWallState>,
    CoronaryBackwardEulerTrialV1
  >({
    previousAcceptedState: previous.circulation,
    dtSec: input.dtSec,
    runtime: input.runtime,
    options: input.circulationNewtonOptions,
    protocolResistanceScaleByEdge: input.protocolResistanceScaleByEdge,
    evaluateCandidateMechanics: (volumesMl) => {
      const mechanicsTrial = evaluatePreparedWholeHeartMechanicsTrialV1(
        mechanicsStep,
        volumesMl,
      );
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
      const impByTerritoryLayer = evaluateAllCoronaryImpV1(
        coronaryMechanicsCoupling.input,
        coronaryPrior.imp,
      );
      const intramyocardialPressureMmHgByTerritoryLayer =
        intramyocardialPressureRecord(impByTerritoryLayer);
      const evaluation = Object.freeze({
        mechanicsTrial,
        pericardium,
        coronaryMechanicsCoupling,
        impByTerritoryLayer,
        intramyocardialPressureMmHgByTerritoryLayer,
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
        // Deliberately restart from `previous.coronary` for every outer Newton,
        // finite-difference, and line-search probe. There is no hidden warm start.
        const coronaryTrial = solveCoronaryBackwardEulerTrialV1(
          previous.coronary,
          {
            dtSec: input.dtSec,
            boundary: Object.freeze({
              absoluteAorticPressureMmHg:
                candidate.boundaryAbsolutePressuresMmHg.Ao,
              absoluteRightAtrialPressureMmHg:
                candidate.boundaryAbsolutePressuresMmHg.RA,
              perivascularExternalPressureMmHg:
                candidate.candidateMechanicsEvaluation
                  .coronaryMechanicsCoupling.input.externalPressureMmHg,
              intramyocardialPressureMmHgByTerritoryLayer:
                candidate.candidateMechanicsEvaluation
                  .intramyocardialPressureMmHgByTerritoryLayer,
            }),
            disease: input.coronaryDisease
              ?? NORMAL_CORONARY_DISEASE_INPUT_V1,
            solverOptions: input.coronarySolverOptions,
          },
          coronaryPrior,
        );
        const hydraulics = coronaryTrial.diagnostics.hydraulics;
        return Object.freeze({
          candidateCompanionBloodVolumeMl:
            coronaryTrial.diagnostics.candidateCoronaryBloodVolumeMl,
          outerBoundaryNetVolumeRateMlPerSec: Object.freeze({
            Ao: -hydraulics.totalInletFlowMlPerSec,
            RA: hydraulics.coronarySinusOutletFlowMlPerSec,
          }),
          candidateCompanionTrial: coronaryTrial,
        });
      },
    }),
  });
  if (circulationTrial.converged === false) {
    return Object.freeze({
      converged: false as const,
      reason: "circulation-mechanics-or-coronary-trial-failed" as const,
      message: circulationTrial.message,
      rollbackState: rollbackTriplet(
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
    });
  }
  const candidateEvaluation =
    circulationTrial.candidateMechanicsEvaluation;
  const mechanicsTrial = candidateEvaluation.mechanicsTrial;
  validateCoupledTrial(previous, circulationTrial, mechanicsTrial);
  const circulationCommit =
    commitNonCoronaryCirculationTrialWithConservativeCompanionV1(
      previous.circulation,
      circulationTrial,
    );
  const coronaryTrial = circulationCommit.candidateCompanionTrial;
  if (coronaryTrial !== circulationTrial.conservativeCompanion
      ?.candidateCompanionTrial) {
    throw new Error("coronary companion promotion changed trial identity");
  }
  const nextMechanics = commitPreparedWholeHeartMechanicsTrialV1(
    mechanicsStep,
    mechanicsTrial,
  );
  const acceptedState = acceptedTriplet(
    previous.revision + 1,
    circulationCommit.fixedGlobalTotalBloodVolumeMl,
    previous.coronaryTopologyId,
    circulationCommit.acceptedNonCoronaryPartitionState,
    coronaryTrial.candidateAcceptedState,
    nextMechanics,
  );
  return Object.freeze({
    converged: true as const,
    acceptedState,
    circulationTrial,
    mechanicsTrial,
    coronaryTrial,
    coronaryMechanicsCoupling:
      candidateEvaluation.coronaryMechanicsCoupling,
    intramyocardialPressureMmHgByTerritoryLayer:
      candidateEvaluation.intramyocardialPressureMmHgByTerritoryLayer,
    calciumDrive,
    commonIntrathoracicPressureMmHg: pthMmHg,
    pericardium: candidateEvaluation.pericardium,
  });
}

function validateCoupledTrial<TWallState>(
  previous: MainWireFiveWallCoronaryAcceptedStateV1<TWallState>,
  circulation: NonCoronaryCirculationTrialSuccessV1<
    MainWireFiveWallCoronaryCandidateMechanicsEvaluationV1<TWallState>,
    CoronaryBackwardEulerTrialV1
  >,
  mechanics: WholeHeartMechanicsTrialV1<TWallState>,
): void {
  const companion = circulation.conservativeCompanion;
  if (companion === undefined) {
    throw new Error("coronary coupled trial is missing its companion readback");
  }
  const coronary = companion.candidateCompanionTrial;
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
    throw new Error("coupled circulation/mechanics/coronary trial identity mismatch");
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
      hydraulics.coronarySinusOutletFlowMlPerSec,
    )
  ) throw new Error("coronary companion volume or boundary-rate mismatch");
}

function rollbackTriplet<TWallState>(
  provider: WholeHeartMechanicsProviderV1<
    TWallState,
    MainWireFiveWallFreeCalciumDriveV1
  >,
  previous: MainWireFiveWallCoronaryAcceptedStateV1<TWallState>,
  circulationRollback: NonCoronaryCirculationAcceptedStateV1,
): MainWireFiveWallCoronaryAcceptedStateV1<TWallState> {
  return acceptedTriplet(
    previous.revision,
    previous.fixedGlobalTotalBloodVolumeMl,
    previous.coronaryTopologyId,
    circulationRollback,
    previous.coronary,
    cloneWholeHeartMechanicsAcceptedStateV1(provider, previous.mechanics),
  );
}

function acceptedTriplet<TWallState>(
  revision: number,
  fixedGlobalTotalBloodVolumeMl: number,
  coronaryTopologyId: CoronaryTopologyPriorV1["topologyId"],
  circulation: NonCoronaryCirculationAcceptedStateV1,
  coronary: CoronaryAcceptedHydraulicStateV1,
  mechanics: WholeHeartMechanicsAcceptedStateV1<TWallState>,
): MainWireFiveWallCoronaryAcceptedStateV1<TWallState> {
  if (
    circulation.revision !== revision
    || coronary.revision !== revision
    || mechanics.revision !== revision
    || !nearlyEqual(circulation.acceptedTimeSec, coronary.acceptedTimeSec)
    || !nearlyEqual(circulation.acceptedTimeSec, mechanics.acceptedTimeSec)
  ) throw new Error("accepted circulation/mechanics/coronary revisions or times differ");
  if (!nearlyEqual(
    circulation.totalBloodVolumeMl + coronaryBloodVolumeMl(coronary),
    fixedGlobalTotalBloodVolumeMl,
  )) throw new Error("accepted partitions violate the fixed global TBV ledger");
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (!nearlyEqual(
      circulation.nodeVolumesMl[chamber],
      mechanics.acceptedVolumesMl[chamber],
    )) throw new Error(`accepted ${chamber} volume mismatch`);
  }
  return Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V1_ID,
    revision,
    acceptedTimeSec: circulation.acceptedTimeSec,
    fixedGlobalTotalBloodVolumeMl,
    coronaryTopologyId,
    circulation,
    coronary,
    mechanics,
  });
}

function validateAcceptedTriplet<TWallState>(
  state: MainWireFiveWallCoronaryAcceptedStateV1<TWallState>,
): void {
  if (state.transactionId !== MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V1_ID) {
    throw new Error("accepted coupled coronary transaction identity is inconsistent");
  }
  acceptedTriplet(
    state.revision,
    state.fixedGlobalTotalBloodVolumeMl,
    state.coronaryTopologyId,
    state.circulation,
    state.coronary,
    state.mechanics,
  );
}

function intramyocardialPressureRecord(
  evaluations: CoronaryTerritoryLayerRecordV1<CoronaryImpEvaluationV1>,
): CoronaryTerritoryLayerRecordV1<number> {
  return Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V1.map((territoryId) => [
      territoryId,
      Object.freeze(Object.fromEntries(
        CORONARY_LAYER_IDS_V1.map((layerId) => [
          layerId,
          evaluations[territoryId][layerId].intramyocardialPressureMmHg,
        ]),
      )) as CoronaryLayerRecordV1<number>,
    ]),
  )) as CoronaryTerritoryLayerRecordV1<number>;
}

function coronaryBloodVolumeMl(
  state: CoronaryAcceptedHydraulicStateV1,
): number {
  return Object.values(state.volumeMlByNode).reduce(
    (sum, volume) => sum + volume,
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
