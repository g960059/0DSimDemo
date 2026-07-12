import {
  DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
  estimateStaticNetForceDerivativeNPerCmV1,
  initialWorkConjugateAVPlaneLeftHeartStateV1,
  stepWorkConjugateAVPlaneLeftHeartV1,
  workConjugateAVPlaneCoordinateInertiaNSec2PerCmFromPhysicalMassKgV1,
  type WorkConjugateAVPlaneLeftHeartOutputV1,
  type WorkConjugateAVPlaneLeftHeartInputV1,
  type WorkConjugateAVPlaneLeftHeartParamsV1,
  type WorkConjugateAVPlaneLeftHeartStateV1,
  type WorkConjugateAVPlaneOrderV1,
} from "@/engine/mechanics2/subsystems/WorkConjugateAVPlaneLeftHeartV1";
import {
  WORK_CONJUGATE_AV_PLANE_KPA_TO_MMHG_V1,
  evaluateWorkConjugateAVPlaneChamberWallV1,
  type WorkConjugateAVPlaneChamberWallParamsV1,
  type WorkConjugateAVPlaneAxisParamsV1,
  type WorkConjugateAVPlaneComponentBreakdownV1,
  type WorkConjugateAVPlaneZForceAxisDecompositionV1,
} from "@/engine/mechanics2/atrial/WorkConjugateAVPlaneChamberWallV1";
import {
  measureLaPvTwoLobesV2,
  signedLaPvLoopAreaV2,
  type LaPvLobeMeasurementReasonV2,
  type LaPvLobeMeasurementStatusV2,
  type LaPvSelfIntersectionSummaryV2,
} from "@/engine/mechanics2/diagnostics/LaPvLobeMeasurementV2";
import {
  detectPeriodicValvePhaseEventsV1,
  type ValvePhaseEventCandidateV1,
  type ValvePhaseEventContractV1,
} from "@/engine/mechanics2/diagnostics/ValvePhaseEventContractV1";
import {
  FIXED_CONTRACTILE_HILL_MAPPING_V1,
  stepEventDrivenContractileActivationV1,
  type ElectricalActivationEventV1,
  type EventDrivenContractileActivationParamsV1,
} from "@/engine/mechanics2/activation/EventDrivenContractileActivationV1";
import {
  buildContractileActivationPhenotypeResidualsV1,
  calibrateEventDrivenActivationPhenotypeV1,
  measurePeriodicContractileActivationPhenotypeFromSamplesV1,
  measurePeriodicContractileActivationPhenotypeV1,
  type ContractileActivationPhenotypeResidualsV1,
  type ContractileActivationPhenotypeCalibrationResultV1,
  type ContractileActivationPhenotypeV1,
  type PeriodicActivationPhenotypeReadbackV1,
} from "@/engine/mechanics2/activation/ContractileActivationPhenotypeV1";

export const WORK_CONJUGATE_ATRIAL_AV_PLANE_REPORT_ID_V1 =
  "work-conjugate-atrial-av-plane-report-v1" as const;
export const WORK_CONJUGATE_ATRIAL_AV_PLANE_ARTIFACT_TRACE_STRIDE_V1 = 4 as const;
const LV_PHENOTYPE_NORMALIZED_RESIDUAL_TOLERANCE_V1 = 0.015;

export type WorkConjugateAtrialAVPlaneVariantIdV1 =
  | "canonical-quasistatic-wall-viscous"
  | "physical-inertial-30g"
  | "legacy-inherited-inertia-m1p1-negative-control"
  | "atrial-active-off-control"
  | "higher-wall-viscosity-topology-control"
  | "activation-timing-sensitivity"
  | "event-driven-atrial-activation-ablation";

export type WorkConjugateAtrialAVPlanePhaseV1 =
  | "reservoir"
  | "conduit"
  | "pumping"
  | "transition";

export type WorkConjugateAtrialAVPlaneActivationTimingV1 = {
  readonly role: "prescribed-electrical-input-sidecar-artificial";
  readonly lvOnsetSec: number;
  readonly lvDuration: {
    readonly kind: "seconds" | "cycle-fraction";
    readonly value: number;
  };
  readonly laStart: {
    readonly kind: "seconds-before-cycle-end" | "cycle-fraction";
    readonly value: number;
  };
  readonly laDurationSec: number;
};

export type WorkConjugateAtrialAVPlaneContractileActivationModelV1 =
  | {
      readonly kind: "legacy-rectangular-first-order";
      readonly eventReference: "prescribed-effective-sidecar-event";
      readonly stateOwner: "left-heart-subsystem-first-order-filter";
    }
  | {
      readonly kind: "event-driven-ca-like-bounded-state";
      readonly eventReference: "prescribed-effective-sidecar-event";
      readonly stateOwner: "upstream-event-driven-contractile-state";
      readonly params: Omit<
        EventDrivenContractileActivationParamsV1,
        "electricalEventReference"
      >;
      readonly fixedHillMapping: typeof FIXED_CONTRACTILE_HILL_MAPPING_V1;
      readonly eventHistory: {
        readonly kind: "finite-periodic-history-no-beat-reset";
        readonly decayTauMultiples: typeof EVENT_HISTORY_DECAY_TAU_MULTIPLES_V1;
        readonly riseTauMultiples: typeof EVENT_HISTORY_RISE_TAU_MULTIPLES_V1;
      };
      readonly activeStressAmplitudeOwner: "existing-work-conjugate-wall";
      readonly fitPolicy:
        "fit-effective-onset-amplitude-relaxation-before-extra-shape-parameters";
      readonly claim: "dimensionless-ca-like-driver-not-calcium-concentration";
    };

/** Backward-compatible name for the LA-facing activation configuration. */
export type WorkConjugateAtrialAVPlaneLaActivationModelV1 =
  WorkConjugateAtrialAVPlaneContractileActivationModelV1;

export type WorkConjugateAtrialAVPlaneComponentV1 = {
  readonly passive: number;
  readonly active: number;
  readonly viscous: number;
  readonly total: number;
};

export type WorkConjugateAtrialAVPlaneAxisForceV1 = {
  readonly circumferentialPressureAreaForceN: WorkConjugateAtrialAVPlaneComponentV1;
  readonly circumferentialStressForceN: WorkConjugateAtrialAVPlaneComponentV1;
  readonly longitudinalStressForceN: WorkConjugateAtrialAVPlaneComponentV1;
  readonly reconstructedTotalForceN: WorkConjugateAtrialAVPlaneComponentV1;
  readonly circumferentialPressureAreaResidualN: WorkConjugateAtrialAVPlaneComponentV1;
  readonly maxAbsCircumferentialPressureAreaResidualN: number;
  readonly rawTotalForceResidualN: number;
};

export type WorkConjugateAtrialAVPlaneSampleV1 = {
  /** State/output time at the implicit-step endpoint, relative to cycle start. */
  readonly tSec: number;
  /** State/output endpoint phase; the last sample is theta=1. */
  readonly theta: number;
  readonly phase: WorkConjugateAtrialAVPlanePhaseV1;
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly laPressureMmHg: number;
  readonly lvPressureMmHg: number;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly aorticPressureMmHg: number;
  readonly returnReservoirPressureMmHg: number;
  readonly qPulmonaryVenousMlPerSec: number;
  readonly qPulmonarySourceMlPerSec: number;
  readonly qMitralMlPerSec: number;
  readonly qAorticMlPerSec: number;
  readonly qSystemicMlPerSec: number;
  readonly mitralOpen01: number;
  readonly aorticOpen01: number;
  readonly mitralVelocityCmPerSec: number;
  readonly avPlanePositionCm: number;
  readonly avPlaneVelocityCmPerSec: number;
  /** Step-start legacy protocol trace; event mechanics use laActivationDrive01. */
  readonly laElectricalActivation01: number;
  readonly lvElectricalActivation01: number;
  /** Legacy step-start target or event-model midpoint Hill drive. */
  readonly laActivationDrive01: number;
  readonly lvActivationDrive01: number;
  /** Event-model midpoint drive frozen over the step; null for legacy rows. */
  readonly laCalciumDrive: number | null;
  readonly laActivation01: number;
  readonly lvActivation01: number;
  readonly laActiveTransmuralPressureMmHg: number;
  readonly laZForceN: WorkConjugateAtrialAVPlaneComponentV1;
  readonly lvZForceN: WorkConjugateAtrialAVPlaneComponentV1;
  readonly laZForceAxisN: WorkConjugateAtrialAVPlaneAxisForceV1;
  readonly lvZForceAxisN: WorkConjugateAtrialAVPlaneAxisForceV1;
  readonly laStressKPa: {
    readonly circumferential: WorkConjugateAtrialAVPlaneComponentV1;
    readonly longitudinal: WorkConjugateAtrialAVPlaneComponentV1;
  };
  readonly lvStressKPa: {
    readonly circumferential: WorkConjugateAtrialAVPlaneComponentV1;
    readonly longitudinal: WorkConjugateAtrialAVPlaneComponentV1;
  };
  readonly avForce: {
    readonly order: WorkConjugateAVPlaneOrderV1;
    readonly laWallForceN: number;
    readonly lvWallForceN: number;
    readonly wallForceSumN: number;
    readonly externalDampingForceN: number;
    readonly beInertialForceN: number;
    readonly forceResidualN: number;
    readonly forcePowerResidualW: number;
  };
  readonly power: {
    readonly laWallRawPowerResidualW: number;
    readonly lvWallRawPowerResidualW: number;
    readonly externalDampingPowerW: number;
    readonly beInertialPowerW: number;
    readonly coupledRawPowerResidualW: number;
  };
  readonly residual: {
    readonly laMassResidualMl: number;
    readonly lvMassResidualMl: number;
    readonly avPlaneKinematicResidualCm: number;
    readonly avPlaneForceResidualN: number;
    readonly closedCircuitVolumeResidualMl: number;
    readonly totalClosedCircuitVolumeDeltaMl: number;
    readonly hiddenBloodVolumeSourceMl: 0;
    readonly maxNormalizedEquationResidual: number;
    readonly solverConverged: boolean;
    readonly physicalResiduals: readonly number[];
    readonly normalizedResiduals: readonly number[];
  };
  readonly pressureArea: {
    readonly laPressureAreaIdentityResidualN: number;
    readonly lvPressureAreaIdentityResidualN: number;
  };
  readonly allFinite: boolean;
  readonly solverConverged: boolean;
  readonly acceptedStep: boolean;
  readonly totalClosedCircuitVolumeMl: number;
  readonly totalClosedCircuitVolumeDriftFromInitialMl: number;
};

export type WorkConjugateAtrialAVPlaneCycleClosureV1 = {
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly laActivation01: number;
  readonly lvActivation01: number;
  readonly avPlanePositionCm: number;
  readonly avPlaneVelocityCmPerSec: number;
  readonly mitralFlowMlPerSec: number;
  readonly aorticFlowMlPerSec: number;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly pulmonaryVenousFlowMlPerSec: number;
  readonly aorticPressureMmHg: number;
  readonly returnReservoirPressureMmHg: number;
  readonly maxAbsVolumeMl: number;
  readonly maxAbsPressureMmHg: number;
  readonly maxAbsFlowMlPerSec: number;
  readonly maxAbsCoordinateCm: number;
  readonly maxAbsVelocityCmPerSec: number;
  readonly maxAbsActivation01: number;
  readonly pass: boolean;
};

export type WorkConjugateAtrialAVPlaneMitralReadbackV1 = {
  readonly measurementValid: boolean;
  readonly fusionClass:
    | "separated"
    | "partial-fusion"
    | "complete-fusion"
    | "not-measurable";
  readonly ePeakFlowMlPerSec: number;
  readonly aPeakFlowMlPerSec: number;
  readonly ePeakVelocityCmPerSec: number;
  readonly aPeakVelocityCmPerSec: number;
  readonly peakEToARatio: number;
  readonly eVtiCm: number;
  readonly aVtiCm: number;
  readonly vtiEToARatio: number;
  readonly earlyForwardVolumeMl: number;
  readonly lateForwardVolumeMl: number;
  readonly eAccelerationTimeSec: number;
  readonly eDecelerationTimeSec: number;
  readonly eDecelerationToAccelerationRatio: number;
  readonly eRiseMonotoneFraction: number;
  readonly eDecayMonotoneFraction: number;
  readonly velocityAtAtrialActivationOnsetCmPerSec: number;
  readonly flowAtAtrialActivationOnsetMlPerSec: number;
  readonly diastasisDurationSec: number;
  readonly eaPeakSeparationSec: number;
  readonly midDiastolicPeakVelocityCmPerSec: number;
  readonly asymmetryRegime:
    | "underdamped"
    | "transition"
    | "overdamped"
    | "not-measurable";
  readonly ePeakTheta: number;
  readonly aPeakTheta: number;
  readonly activationOnsetTheta: number;
};

export type WorkConjugateAtrialAVPlaneActivationReadbackV1 = {
  readonly eventReference: "prescribed-effective-sidecar-event";
  readonly modelKind: WorkConjugateAtrialAVPlaneLaActivationModelV1["kind"];
  readonly phaseBoundarySource: "realized-grid-event-onset";
  readonly laNominalEventOnsetTheta: number;
  readonly laEventOnsetTheta: number;
  readonly laEventGridOffsetSec: number;
  readonly laCalciumDriveAtFirstDriveSample: number | null;
  readonly laCalciumDrivePeak: number | null;
  readonly laCalciumDrivePeakTheta: number | null;
  readonly laActivationDrivePeak01: number;
  readonly laActivationDrivePeakTheta: number;
  readonly laContractilePeak01: number;
  readonly laContractilePeakTheta: number;
  readonly laEventToContractilePeakSec: number;
  readonly laContractileRt50Sec: number | null;
  readonly laActivationAtMitralClosingConductanceMidpoint01: number;
  readonly lvActivationAtMitralClosingConductanceMidpoint01: number;
  readonly laActiveTransmuralPressurePeakMmHg: number;
  readonly laActiveTransmuralPressurePeakTheta: number;
  readonly atrialWindowMitralPeakFlowMlPerSec: number;
  readonly atrialWindowMitralPeakTheta: number;
  readonly laPressurePeakMmHg: number;
  readonly laPressurePeakTheta: number;
  readonly laPressurePeakVolumeMl: number;
  readonly pressurePeakVolumePosition: {
    readonly measurementValid: boolean;
    /** (V(Pa peak)-Vmin)/(Vevent-Vmin); intentionally not clamped. */
    readonly fractionFromMinimumToEventVolume: number | null;
    readonly fractionEmptiedAtPressurePeak: number | null;
  };
  readonly pulmonaryVenousAtrialReversal: {
    readonly status: "present" | "absent";
    readonly detectionToleranceMlPerSec: 0.000001;
    readonly nadirFlowMlPerSec: number;
    readonly reversePeakMlPerSec: number;
    readonly reverseDurationSec: number;
    readonly reverseVolumeMl: number;
    readonly nadirTheta: number;
  };
};

export type WorkConjugateAtrialAVPlaneProfileV1 = {
  readonly profileId: string;
  readonly variantId: WorkConjugateAtrialAVPlaneVariantIdV1;
  readonly heartRateBpm: number;
  readonly cycleLengthSec: number;
  readonly dtSec: number;
  readonly stepsPerBeat: number;
  readonly allFinite: boolean;
  readonly allStepsConverged: boolean;
  readonly allAcceptedSteps: boolean;
  readonly periodicSteadyState: boolean;
  readonly beatsSimulated: number;
  readonly cycleClosure: WorkConjugateAtrialAVPlaneCycleClosureV1;
  readonly pressureRangeLaMmHg: readonly [number, number];
  readonly pressureRangeLvMmHg: readonly [number, number];
  readonly pressureRangeAorticMmHg: readonly [number, number];
  readonly flowRangePulmonaryVenousMlPerSec: readonly [number, number];
  readonly flowRangeMitralMlPerSec: readonly [number, number];
  readonly volumeRangeLaMl: readonly [number, number];
  readonly volumeRangeLvMl: readonly [number, number];
  readonly zRangeCm: readonly [number, number];
  readonly uRangeCmPerSec: readonly [number, number];
  readonly cardiacOutputLPerMin: number;
  readonly strokeVolumeMl: number;
  readonly activationModel: WorkConjugateAtrialAVPlaneLaActivationModelV1;
  readonly activationReadback: WorkConjugateAtrialAVPlaneActivationReadbackV1;
  readonly valvePhaseEvents: {
    readonly role: "report-only-pressure-flow-contract";
    readonly eventTimeDefinition:
      "pressure-crossover-associated-with-sustained-forward-flow-threshold";
    readonly mitral: ValvePhaseEventContractV1;
    readonly aortic: ValvePhaseEventContractV1;
  };
  readonly xvyPressureReadback: {
    /** Legacy valve model: interpolated openFraction=0.5 closing crossing. */
    readonly mitralClosingConductanceMidpointTheta: number;
    readonly mitralClosingConductanceMidpointStatus:
      "threshold-crossing" | "fallback-extremum";
    readonly mitralClosingConductanceMidpointLaPressureMmHg: number;
    readonly xTheta: number;
    readonly xPressureMmHg: number;
    readonly xDescentDepthMmHg: number;
    readonly mitralClosingConductanceMidpointToXSec: number;
    readonly postMitralClosingConductanceMidpointToXNonIncreasingFraction: number;
    readonly postMitralClosingConductanceMidpointSecondaryRiseMmHg: number;
    /** openFraction=0.5 pressure-gradient sigmoid crossing, not leaflet AVO. */
    readonly aorticConductanceOpeningMidpointTheta: number;
    readonly aorticConductanceOpeningMidpointStatus:
      "threshold-crossing" | "fallback-extremum";
    /** openFraction=0.5 pressure-gradient sigmoid crossing, not leaflet AVC. */
    readonly aorticConductanceClosingMidpointTheta: number;
    readonly aorticConductanceClosingMidpointStatus:
      "threshold-crossing" | "fallback-extremum";
    readonly aorticFlowAtConductanceClosingMidpointMlPerSec: number;
    readonly aorticForwardFlowStartTheta: number;
    readonly aorticForwardFlowStartStatus:
      "linear-zero-crossing" | "fallback-nearest-zero";
    readonly aorticForwardFlowEndTheta: number;
    readonly aorticForwardFlowEndStatus:
      "linear-zero-crossing" | "fallback-nearest-zero";
    /** Flow-end proxy only; this model has no leaflet-closure state, so not clinical IVRT. */
    readonly aorticFlowEndToMitralConductanceOpeningSec: number | null;
    readonly aorticFlowEndToMitralConductanceOpeningMeasurementValid: boolean;
    readonly cWaveCandidate: {
      readonly status:
        | "interior-ivct-peak"
        | "boundary-at-mitral-closing-conductance-midpoint"
        | "boundary-at-aortic-flow-onset"
        | "not-measurable";
      readonly peakTheta: number | null;
      readonly peakPressureMmHg: number | null;
      readonly riseFromMitralClosingConductanceMidpointMmHg: number | null;
      readonly cToXDepthMmHg: number | null;
      readonly cToXSec: number | null;
      readonly cToXNonIncreasingFraction: number | null;
      readonly postCSecondaryRiseMmHg: number | null;
    };
    readonly vTheta: number;
    readonly vPressureMmHg: number;
    readonly vWaveRiseMmHg: number;
    /** Legacy valve model: interpolated openFraction=0.5 opening crossing. */
    readonly mitralOpeningConductanceMidpointTheta: number;
    readonly mitralOpeningConductanceMidpointStatus:
      "threshold-crossing" | "fallback-extremum";
    readonly mitralOpeningConductanceMidpointLaPressureMmHg: number;
    readonly yTheta: number;
    readonly yPressureMmHg: number;
    readonly yDescentDepthMmHg: number;
    readonly yDescentMeasurementStatus:
      | "interior-trough"
      | "right-censored-at-atrial-event"
      | "not-measurable-mitral-opening-fallback";
    readonly mitralOpeningConductanceMidpointToYSec: number;
    readonly yToAtrialEventMarginSec: number;
    readonly qMitralAtYMlPerSec: number;
  };
  readonly mitral: WorkConjugateAtrialAVPlaneMitralReadbackV1;
  readonly pulmonaryVenous: {
    readonly sPeakMlPerSec: number;
    readonly dPeakMlPerSec: number;
    readonly sToDRatio: number;
    readonly sPeakTheta: number;
    readonly dPeakTheta: number;
  };
  readonly laPvLobes: {
    readonly status: LaPvLobeMeasurementStatusV2;
    readonly reason: LaPvLobeMeasurementReasonV2;
    readonly selfIntersectionCount: number;
    readonly rawSelfIntersectionCount: number;
    readonly crossings: readonly LaPvSelfIntersectionSummaryV2[];
    readonly crossingAngleDeg: number;
    readonly aLoopAreaMmHgMl: number;
    readonly vLoopAreaMmHgMl: number;
    readonly aLoopSignedAreaMmHgMl: number;
    readonly vLoopSignedAreaMmHgMl: number;
    readonly aToVAreaRatio: number;
    readonly opposedLobeOrientation: boolean;
    readonly selectionEvidenceSource:
      | "activation-burden"
      | "pumping-fraction"
      | "not-applicable";
    readonly activationEvidenceCoverage01: number | null;
    readonly aLobeActivationBurden01: number | null;
    readonly vLobeActivationBurden01: number | null;
    readonly aLobePumpingFraction01: number | null;
    readonly vLobePumpingFraction01: number | null;
  };
  readonly pathOrdering: {
    readonly reservoirConduitIntersectionCount: number;
    readonly reservoirConduitMaxAngleDeg: number;
    readonly reservoirPumpingIntersectionCount: number;
    readonly reservoirPumpingMaxAngleDeg: number;
    readonly figureEightCrossingPhase:
      | "late-conduit"
      | "early-pumping"
      | "outside-preferred-window"
      | "none";
    readonly figureEightCrossingProgress01: number;
    readonly figureEightCrossingAngleDeg: number;
    readonly conduitBeforeCrossingBelowReservoirPathFraction: number;
    readonly pumpingAfterCrossingAboveReservoirPathFraction: number;
  };
  readonly legacyPhaseAreas: {
    readonly aLoopAreaMmHgMl: number;
    readonly vLoopAreaMmHgMl: number;
    readonly aLoopSignedAreaMmHgMl: number;
    readonly vLoopSignedAreaMmHgMl: number;
    readonly opposedOrientation: boolean;
    readonly role: "phase-colored-display-diagnostic";
  };
  readonly residualExtrema: {
    readonly maxAbsMassResidualMl: number;
    readonly maxAbsClosedCircuitVolumeResidualMl: number;
    readonly maxAbsTotalVolumeDriftMl: number;
    readonly maxAbsAvPlaneKinematicResidualCm: number;
    readonly maxAbsAvPlaneForceResidualN: number;
    readonly maxAbsAvForcePowerResidualW: number;
    readonly maxAbsWallRawPowerResidualW: number;
    readonly maxAbsCoupledRawPowerResidualW: number;
    readonly maxAbsPressureAreaIdentityResidualN: number;
    readonly maxHiddenBloodVolumeSourceMl: 0;
    readonly maxNormalizedEquationResidual: number;
  };
  readonly staticPassiveReference: {
    readonly netForceDerivativeNPerCm: number;
    readonly derivativeSignGate: "pass-negative" | "fail-nonnegative";
  };
  readonly samples: readonly WorkConjugateAtrialAVPlaneSampleV1[];
};

export type WorkConjugateAtrialAVPlaneHardGatesV1 = {
  readonly finiteAndSolverConvergence: boolean;
  readonly periodicity: boolean;
  readonly closedVolumeMass: boolean;
  readonly hiddenSourceExactlyZero: boolean;
  readonly wallVirtualWorkResidual: boolean;
  readonly pressureAreaIdentity: boolean;
  readonly avForcePowerResidual: boolean;
  readonly passiveReferenceRestoringDerivativeNegative: boolean;
  readonly allHardGatesPass: boolean;
};

export type WorkConjugateAtrialAVPlaneVariantV1 = {
  readonly variantId: WorkConjugateAtrialAVPlaneVariantIdV1;
  readonly role:
    | "canonical-engineering-candidate"
    | "model-order-comparator"
    | "negative-control"
    | "topology-control"
    | "activation-timing-diagnostic"
    | "activation-model-diagnostic";
  readonly description: string;
  readonly activationTiming: WorkConjugateAtrialAVPlaneActivationTimingV1;
  readonly activationModel: WorkConjugateAtrialAVPlaneLaActivationModelV1;
  readonly params: WorkConjugateAVPlaneLeftHeartParamsV1;
  readonly profile: WorkConjugateAtrialAVPlaneProfileV1;
  readonly hardGates: WorkConjugateAtrialAVPlaneHardGatesV1;
  readonly diagnosticRole: {
    readonly morphology: "owner-visual-review-required";
    readonly mitralWaveform: "diagnostic-pending-owner-review";
    readonly clinicalFit: false;
  };
};

export type WorkConjugateAtrialAVPlaneEnvelopeCaseV1 = {
  readonly caseId: "hr60" | "hr75" | "hr100";
  readonly heartRateBpm: 60 | 75 | 100;
  readonly finite: boolean;
  readonly allStepsConverged: boolean;
  readonly allAcceptedSteps: boolean;
  readonly periodicSteadyState: boolean;
  readonly beatsSimulated: number;
  readonly cycleClosure: WorkConjugateAtrialAVPlaneCycleClosureV1;
  readonly laPvLobeStatus: LaPvLobeMeasurementStatusV2;
  readonly laPvLobeReason: LaPvLobeMeasurementReasonV2;
  readonly mitralPeakEToARatio: number;
  readonly mitralVtiEToARatio: number;
  readonly pulmonaryVenousSToDRatio: number;
  readonly xDescentDepthMmHg: number;
  readonly yDescentDepthMmHg: number;
  readonly maxNormalizedEquationResidual: number;
};

export type WorkConjugateAtrialAVPlaneStaticRootEnvelopeCaseV1 = {
  readonly caseId: string;
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly laActivation01: 0 | 0.5 | 1;
  readonly lvActivation01: 0 | 0.5 | 1;
  readonly rootCount: number;
  readonly roots: readonly {
    readonly avPlanePositionCm: number;
    readonly boundaryMarginCm: number;
    readonly forceResidualN: number;
    readonly netForceDerivativeNPerCm: number;
    readonly stableRestoringSign: boolean;
  }[];
};

export type WorkConjugateAtrialAVPlaneStaticRootEnvelopeV1 = {
  readonly role: "report-only-not-hard-gated";
  readonly domainSource: "canonical-trace-volume-min-mid-max";
  readonly avPlaneSearchDomainCm: readonly [-1.5, 1.5];
  readonly method: "uniform-0.01cm-sign-change-bracketing-plus-bisection";
  readonly mathematicalGlobalUniquenessProof: false;
  readonly caseCount: 81;
  readonly uniqueStableRootCaseCount: number;
  readonly zeroRootCaseCount: number;
  readonly multipleRootCaseCount: number;
  readonly unstableRootCaseCount: number;
  readonly minimumRootBoundaryMarginCm: number;
  readonly maximumAbsRootForceResidualN: number;
  readonly minimumAbsNetForceDerivativeNPerCm: number;
  readonly cases: readonly WorkConjugateAtrialAVPlaneStaticRootEnvelopeCaseV1[];
};

export type WorkConjugateAtrialAVPlaneActivationDtSensitivityV1 = {
  readonly role: "report-only-midpoint-drive-discretization-check";
  readonly cases: readonly {
    readonly dtSec: 0.001 | 0.0005 | 0.00025;
    readonly periodicSteadyState: boolean;
    readonly allHardGatesPass: boolean;
    readonly laContractilePeak01: number;
    readonly laEventToContractilePeakSec: number;
    readonly laContractileRt50Sec: number | null;
    readonly pressurePeakVolumePositionFraction: number | null;
  }[];
  readonly finestDtSec: 0.00025;
  readonly coarseToFineAbsoluteDifference: {
    readonly laContractilePeak01: number;
    readonly laEventToContractilePeakSec: number;
    readonly laContractileRt50Sec: number | null;
    readonly pressurePeakVolumePositionFraction: number | null;
  };
};

export type WorkConjugateAtrialAVPlanePhaseAttributionFactorIdV1 =
  | "effective-event-to-calcium-delay"
  | "lv-activation-fall-time"
  | "pulmonary-venous-series-resistance";

export type WorkConjugateAtrialAVPlanePhaseAttributionTraceSampleV1 = {
  readonly theta: number;
  readonly laVolumeMl: number;
  readonly laPressureMmHg: number;
  readonly qMitralMlPerSec: number;
  readonly qPulmonaryVenousMlPerSec: number;
  readonly laActivation01: number;
  readonly lvActivation01: number;
};

export type WorkConjugateAtrialAVPlanePhaseAttributionCaseV1 = {
  readonly caseId: string;
  readonly position: "lower" | "reference" | "higher";
  /** Null only for the shared multi-factor reference row. */
  readonly parameterValue: number | null;
  /** Null only for the shared multi-factor reference row. */
  readonly deltaFromReference: number | null;
  readonly changedParameterPaths: readonly string[];
  readonly singleFactorIsolation: {
    readonly activationModelFamilyUnchanged: true;
    readonly wallActiveStressAmplitudeUnchanged: true;
    readonly wallAndAvPlaneLawUnchanged: true;
    readonly bloodVolumeLedgerUnchanged: true;
    readonly nonlinearUnknownCount: 10;
    readonly noRuntimeOrDefaultWiring: true;
    /** Computed recursively from the complete timing/model/params projections. */
    readonly differingLeafPaths: readonly string[];
    readonly exactDeclaredPathMatch: boolean;
  };
  readonly numerics: {
    readonly allFinite: boolean;
    readonly allStepsConverged: boolean;
    readonly allAcceptedSteps: boolean;
    readonly periodicSteadyState: boolean;
    readonly allHardGatesPass: boolean;
  };
  readonly readback: {
    readonly laEventOnsetTheta: number;
    readonly laActivationDrivePeakTheta: number;
    readonly laContractilePeakTheta: number;
    readonly laPressurePeakTheta: number;
    readonly pressurePeakVolumePositionFraction: number | null;
    readonly xDescentDepthMmHg: number;
    readonly mitralClosingConductanceMidpointToXSec: number;
    readonly postMitralClosingConductanceMidpointSecondaryRiseMmHg: number;
    readonly aorticFlowEndToMitralConductanceOpeningSec: number | null;
    readonly aorticFlowEndToMitralConductanceOpeningMeasurementValid: boolean;
    readonly cWaveCandidateStatus:
      WorkConjugateAtrialAVPlaneProfileV1["xvyPressureReadback"]["cWaveCandidate"]["status"];
    readonly cToXDepthMmHg: number | null;
    readonly cToXNonIncreasingFraction: number | null;
    readonly lvElectricalTargetOffTheta: number;
    readonly lvTargetOffToHalfActivationSec: number | null;
    readonly lvActivationAtMitralOpeningConductanceMidpoint01: number;
    readonly lvActivationAtY01: number;
    readonly mitralConductanceOpeningMidpointTheta: number;
    readonly yDescentDepthMmHg: number;
    readonly yDescentMeasurementStatus:
      WorkConjugateAtrialAVPlaneProfileV1["xvyPressureReadback"]["yDescentMeasurementStatus"];
    readonly flowAtAtrialEventToEPeakRatio: number;
    readonly mitralMeasurementValid: boolean;
    readonly mitralFusionClass:
      WorkConjugateAtrialAVPlaneMitralReadbackV1["fusionClass"];
    readonly pulmonaryVenousAtrialReversalStatus: "present" | "absent";
    readonly pulmonaryVenousAtrialWindowNadirMlPerSec: number;
    readonly pulmonaryVenousReverseDurationSec: number;
    readonly pulmonaryVenousReverseVolumeMl: number;
    readonly pulmonaryVenousPressureMeanMmHg: number;
    readonly pulmonaryVenousMinusLaPressureRangeMmHg:
      readonly [number, number];
    readonly pulmonaryVenousResistiveDropMeanMmHg: number;
    readonly pulmonaryVenousInertialDropRangeMmHg:
      readonly [number, number];
    readonly pulmonaryVenousMomentumIdentityMaxAbsResidualMmHg: number;
    readonly pulmonaryVenousMomentumDifferenceSampleCount: number;
    readonly pulmonaryVenousMomentumDifferenceSource:
      "within-final-cycle-endpoint-differences-excludes-cycle-boundary";
    readonly laPvLobeStatus: LaPvLobeMeasurementStatusV2;
    readonly laPvLobeReason: LaPvLobeMeasurementReasonV2;
    readonly laPvRawSelfIntersectionCount: number;
    readonly cardiacOutputLPerMin: number;
  };
  /** Display trace only; every fourth full-resolution sample is retained. */
  readonly trace: readonly WorkConjugateAtrialAVPlanePhaseAttributionTraceSampleV1[];
};

export type WorkConjugateAtrialAVPlanePhaseAttributionV1 = {
  readonly role: "report-only-one-factor-at-a-time-causal-screen";
  readonly baselineVariantId: "event-driven-atrial-activation-ablation";
  readonly physiologyHardGated: false;
  readonly perturbationBasis:
    "local-engineering-brackets-not-clinical-priors-or-fit-bounds";
  readonly literatureContext: {
    readonly role: "soft-display-context-not-hard-gates";
    readonly currentEventIsSurfacePWave: false;
    readonly currentEventIsLocalLaDepolarization: false;
    readonly aorticValveHasLeafletClosureState: false;
    readonly flowEndToMitralConductanceOpeningComparableToClinicalIvrt: false;
    readonly ivrtSoftEnvelopeSec: readonly [0.060, 0.100];
    readonly hr75EaTwoPeakExpectation:
      "scenario-level-soft-context-not-universal-gate";
    readonly pulmonaryVenousArDurationSoftEnvelopeSec:
      readonly [0.080, 0.140];
    readonly aggregateQpvVelocityGateAllowed: false;
    readonly sources: readonly {
      readonly topic: string;
      readonly citation: string;
      readonly url: string;
    }[];
  };
  readonly reference:
    WorkConjugateAtrialAVPlanePhaseAttributionCaseV1;
  readonly factors: readonly {
    readonly factorId: WorkConjugateAtrialAVPlanePhaseAttributionFactorIdV1;
    readonly parameterPath: string;
    readonly parameterUnit: "s" | "mmHg s/mL";
    readonly referenceValue: number;
    readonly hypothesis: string;
    readonly cases: readonly WorkConjugateAtrialAVPlanePhaseAttributionCaseV1[];
  }[];
};

export type WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1 = {
  readonly caseId:
    | "interaction-center"
    | "fast-rise-low-lv-longitudinal"
    | "fast-rise-high-lv-longitudinal"
    | "slow-rise-low-lv-longitudinal"
    | "slow-rise-high-lv-longitudinal";
  readonly position: "center" | "corner";
  readonly activationCalciumRiseTauSec: number;
  /** Parameter ratio Tmax,long/Tmax,circ; realized stress ratio is strain-dependent. */
  readonly lvLongitudinalToCircumferentialActiveStressMaxRatio: number;
  readonly lvLongitudinalActiveStressMaxKPa: number;
  readonly changedParameterPaths: readonly string[];
  readonly configurationAudit: {
    readonly differingLeafPaths: readonly string[];
    readonly exactDeclaredPathMatch: boolean;
    readonly activationModelFamilyUnchanged: true;
    readonly lvCircumferentialActiveStressMaxKPa: 55;
    readonly lvLongitudinalActiveStressMaxIsDeclaredAvpdDriver: true;
    readonly allOtherWallParametersUnchanged: true;
    readonly avPlaneCoordinateEquationUnchanged: true;
    readonly avPlaneTrajectoryPrescribed: false;
    readonly explicitActivationTimesAvPlaneCrossTerm: false;
    readonly bloodVolumeLedgerUnchanged: true;
    readonly nonlinearUnknownCount: 10;
    readonly noRuntimeOrDefaultWiring: true;
  };
  readonly numerics: {
    readonly allFinite: boolean;
    readonly allStepsConverged: boolean;
    readonly allAcceptedSteps: boolean;
    readonly periodicSteadyState: boolean;
    readonly allHardGatesPass: boolean;
  };
  readonly readback: {
    readonly laEventToContractilePeakSec: number;
    readonly laContractileRt50Sec: number | null;
    readonly laContractilePeak01: number;
    readonly laContractileStateTimeIntegralSec: number;
    readonly laActiveZWorkSignedJ: number;
    readonly laActiveZWorkAbsoluteJ: number;
    readonly lvRealizedActiveStressAtCircumferentialPeak: {
      readonly circumferentialKPa: number;
      readonly longitudinalKPa: number;
      readonly longitudinalToCircumferentialRatio: number | null;
    };
    readonly lvActiveZForcePeakAbsN: number;
    readonly lvActiveZWorkSignedJ: number;
    readonly lvActiveZWorkAbsoluteJ: number;
    readonly avPlaneCycleExcursionCm: number;
    readonly avPlaneCyclePeakAbsVelocityCmPerSec: number;
    readonly mitralClosingMidpointToAorticFlowEndDisplacementCm:
      number | null;
    readonly mitralClosingMidpointToAorticFlowEndMeasurementValid: boolean;
    readonly mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec:
      number | null;
    readonly pressurePeakVolumePositionFraction: number | null;
    readonly cWaveCandidateStatus:
      WorkConjugateAtrialAVPlaneProfileV1["xvyPressureReadback"]["cWaveCandidate"]["status"];
    readonly cToXDepthMmHg: number | null;
    readonly yDescentDepthMmHg: number;
    readonly yDescentMeasurementStatus:
      WorkConjugateAtrialAVPlaneProfileV1["xvyPressureReadback"]["yDescentMeasurementStatus"];
    readonly mitralFusionClass:
      WorkConjugateAtrialAVPlaneMitralReadbackV1["fusionClass"];
    readonly pulmonaryVenousAtrialReversalStatus: "present" | "absent";
    readonly pulmonaryVenousAtrialWindowNadirMlPerSec: number;
    readonly laPvLobeStatus: LaPvLobeMeasurementStatusV2;
    readonly laPvLobeReason: LaPvLobeMeasurementReasonV2;
    readonly laPvRawSelfIntersectionCount: number;
    readonly aLoopAreaMmHgMl: number;
    readonly vLoopAreaMmHgMl: number;
    readonly aToVAreaRatio: number;
    readonly figureEightCrossingPhase:
      WorkConjugateAtrialAVPlaneProfileV1["pathOrdering"]["figureEightCrossingPhase"];
    readonly conduitBeforeCrossingBelowReservoirPathFraction: number;
    readonly pumpingAfterCrossingAboveReservoirPathFraction: number;
    readonly cardiacOutputLPerMin: number;
  };
  /** Display trace only; every fourth full-resolution sample is retained. */
  readonly trace: readonly (WorkConjugateAtrialAVPlanePhaseAttributionTraceSampleV1 & {
    readonly avPlanePositionCm: number;
    readonly avPlaneVelocityCmPerSec: number;
  })[];
};

export type WorkConjugateAtrialAVPlaneInteractionContrastMetricsV1 = {
  readonly avPlaneCycleExcursionCm: number;
  readonly mitralClosingMidpointToAorticFlowEndDisplacementCm:
    number | null;
  readonly mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec:
    number | null;
  readonly pressurePeakVolumePositionFraction: number | null;
  readonly cToXDepthMmHg: number | null;
  readonly cardiacOutputLPerMin: number;
};

export type WorkConjugateAtrialAVPlaneInteractionNormalizedMagnitudeV1 = {
  readonly avPlaneCycleExcursionCm: number | null;
  readonly mitralClosingMidpointToAorticFlowEndDisplacementCm:
    number | null;
  readonly mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec:
    number | null;
  readonly pressurePeakVolumePositionFraction: number | null;
  readonly cToXDepthMmHg: number | null;
  readonly cardiacOutputLPerMin: number | null;
};

export type WorkConjugateAtrialAVPlaneCToXContrastStatusV1 =
  | "homogeneous-interior-candidate"
  | "homogeneous-boundary-candidate"
  | "not-measurable-or-heterogeneous-candidate-definition";

export type WorkConjugateAtrialAVPlaneActivationAvpdInteractionV1 = {
  readonly role: "report-only-free-coupled-two-factor-interaction-screen";
  readonly baselineVariantId: "event-driven-atrial-activation-ablation";
  readonly design: "center-plus-four-corners";
  readonly physiologyHardGated: false;
  readonly fittingBounds: false;
  readonly explicitActivationTimesAvPlaneCrossTerm: false;
  readonly avPlaneTrajectoryPrescribed: false;
  readonly avpdEmergesFromSharedWallForceBalance: true;
  readonly factors: {
    readonly activation: {
      readonly parameterPath:
        "activationModel.params.calciumKernel.riseTauSec";
      readonly unit: "s";
      readonly lower: 0.040;
      readonly center: 0.060;
      readonly higher: 0.080;
      readonly interpretation:
        "dimensionless-Ca-like-rise-shape-and-kinetics-not-timing-only-or-calcium-concentration";
    };
    readonly avpdDriver: {
      readonly parameterPath:
        "params.lvWall.axes.longitudinal.activeStressMaxKPa";
      readonly unit: "kPa";
      readonly lower: 24.75;
      readonly center: 30.25;
      readonly higher: 35.75;
      readonly derivedLongitudinalToCircumferentialActiveStressMaxRatios:
        readonly [0.45, 0.55, 0.65];
      readonly fixedLvCircumferentialActiveStressMaxKPa: 55;
      readonly interpretation:
        "active-stress-maximum-anisotropy-driver-not-realized-stress-ratio-or-prescribed-avpd-amplitude";
    };
  };
  readonly cases:
    readonly WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1[];
  readonly interactionContrast:
    WorkConjugateAtrialAVPlaneInteractionContrastMetricsV1 & {
    readonly formula:
      "(slow-high-minus-fast-high)-minus-(slow-low-minus-fast-low)";
    readonly signConvention:
      "positive-means-rise-tau-effect-is-more-positive-at-higher-lv-longitudinal-active-stress-max-ratio";
    readonly noClinicalMagnitudeThreshold: true;
    readonly cToXContrastStatus:
      WorkConjugateAtrialAVPlaneCToXContrastStatusV1;
    readonly yDescentDepthMmHg: number | null;
    readonly yDescentContrastStatus:
      | "measurable-all-corners-interior"
      | "not-measurable-one-or-more-censored-or-fallback";
    readonly cornerRangeNormalizedMagnitude:
      WorkConjugateAtrialAVPlaneInteractionNormalizedMagnitudeV1;
    readonly normalizedMagnitudePolicy:
      "absolute-contrast-divided-by-four-corner-range-null-if-range-not-positive";
  };
  readonly discretizationRobustness: {
    readonly role:
      "report-only-four-corner-interaction-discretization-check";
    readonly physiologyGate: false;
    readonly dtValuesSec: readonly [0.001, 0.0005, 0.00025];
    readonly cases: readonly {
      readonly dtSec: 0.001 | 0.0005 | 0.00025;
      readonly allCornersFinite: boolean;
      readonly allCornersPeriodicSteadyState: boolean;
      readonly allCornersHardGatesPass: boolean;
      readonly contrast:
        WorkConjugateAtrialAVPlaneInteractionContrastMetricsV1;
      readonly cToXContrastStatus:
        WorkConjugateAtrialAVPlaneCToXContrastStatusV1;
      readonly cornerRangeNormalizedMagnitude:
        WorkConjugateAtrialAVPlaneInteractionNormalizedMagnitudeV1;
    }[];
    readonly signStableAcrossDt: {
      readonly avPlaneCycleExcursionCm: boolean | null;
      readonly mitralClosingMidpointToAorticFlowEndDisplacementCm:
        boolean | null;
      readonly mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec:
        boolean | null;
      readonly pressurePeakVolumePositionFraction: boolean | null;
      readonly cToXDepthMmHg: boolean | null;
      readonly cardiacOutputLPerMin: boolean | null;
    };
    readonly coarseToFineAbsoluteDifference:
      WorkConjugateAtrialAVPlaneInteractionContrastMetricsV1;
    readonly yInteractionExcluded:
      "true-y-trough-contrast-not-measurable-when-any-corner-is-censored-or-fallback";
  };
  readonly evidenceBoundary: {
    readonly independentAvpdObservationRequiredForJointFitting: true;
    readonly laPvLoopAloneIdentifiesBothFactors: false;
    readonly sufficiencyForParameterIdentifiabilityEstablished: false;
    readonly recommendedIndependentObservables: readonly [
      "activation-timing-or-ECG-reference",
      "time-resolved-AVPD-or-mitral-annular-motion",
      "LA-volume",
      "LA-pressure-or-PAWP-waveform",
      "LV-pressure-and-volume-waveforms",
      "aortic-pressure-or-flow-waveform",
      "mitral-inflow-E-and-A",
      "pulmonary-venous-S-D-and-Ar-flow",
    ];
    readonly sources: readonly {
      readonly topic: string;
      readonly citation: string;
      readonly url: string;
    }[];
  };
};

export type WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1 = {
  readonly caseId: "lv-rt50-low" | "lv-rt50-center" | "lv-rt50-high";
  readonly rt50DoseFactor: 0.92 | 1 | 1.08;
  readonly targetPhenotype: ContractileActivationPhenotypeV1;
  readonly calibration: ContractileActivationPhenotypeCalibrationResultV1;
  readonly installationStatus:
    | "installed-for-report-only-screen"
    | "not-installed-mapping-failed"
    | "rejected-coupled-target-mismatch";
  readonly configurationAudit: {
    readonly prescribedLvContractileStateOwner:
      "upstream-event-driven-contractile-state";
    readonly laActivationFixed: true;
    readonly lvEventReferenceFixed: true;
    readonly lvEffectiveOnsetFixed: true;
    readonly lvTimeToPeakTargetFixed: true;
    readonly lvPeakExcursionTargetFixed: true;
    readonly lvExcursionIntegralTargetFixed: true;
    readonly allNonRt50PhenotypeTargetsIdentical: boolean;
    readonly rawInternalParametersArePrivateMapperCoordinates: true;
    readonly lvWallFixed: true;
    readonly valveAndCircuitParametersFixed: true;
    readonly avPlaneTrajectoryPrescribed: false;
    readonly bloodVolumeLedgerUnchanged: true;
    readonly nonlinearUnknownCount: 10;
    readonly noRuntimeOrDefaultWiring: true;
  };
  readonly numerics: {
    readonly allFinite: boolean;
    readonly allStepsConverged: boolean;
    readonly allAcceptedSteps: boolean;
    readonly periodicSteadyState: boolean;
    readonly allHardGatesPass: boolean;
  } | null;
  readonly readback: {
    readonly realizedLvPhenotypeFromCoupledTrace:
      ContractileActivationPhenotypeV1;
    readonly coupledTargetResiduals:
      ContractileActivationPhenotypeResidualsV1;
    readonly coupledTargetWithinTolerance: boolean;
    readonly lvActivationPeak01: number;
    readonly lvActivationAtAorticPressureFlowClosing01: number | null;
    readonly lvActivationAtMitralPressureFlowOpening01: number | null;
    readonly aorticPressureFlowClosingTimeSec: number | null;
    readonly mitralPressureFlowOpeningTimeSec: number | null;
    readonly aorticClosingToMitralOpeningSec: number | null;
    readonly aorticClosingToMitralOpeningUncertaintyIntervalSec:
      { readonly lowerBoundSec: number; readonly upperBoundSec: number } | null;
    readonly aorticClosingToMitralOpeningStatus:
      | "measurable-pressure-flow-contract"
      | "not-measurable";
    readonly aorticConductanceClosingToMitralConductanceOpeningSec:
      number | null;
    readonly pressureFlowTimingIsAnatomicalValveClaim: false;
    readonly pressureFlowTimingIsClinicalIvrtClaim: false;
    readonly conductanceTimingIsAnatomicalValveClaim: false;
    readonly mitralFusionClass:
      WorkConjugateAtrialAVPlaneMitralReadbackV1["fusionClass"];
    readonly eaPeakSeparationSec: number;
    readonly diastasisDurationSec: number;
    readonly flowAtAtrialEventToEPeakRatio: number | null;
    readonly yDescentMeasurementStatus:
      WorkConjugateAtrialAVPlaneProfileV1["xvyPressureReadback"]["yDescentMeasurementStatus"];
    readonly yDescentDepthMmHg: number;
    readonly yToAtrialEventMarginSec: number;
    readonly xDescentDepthMmHg: number;
    readonly pressurePeakVolumePositionFraction: number | null;
    readonly avPlaneCycleExcursionCm: number;
    readonly avPlaneCyclePeakAbsVelocityCmPerSec: number;
    readonly lvActiveZWorkSignedJ: number;
    readonly lvActiveZWorkAbsoluteJ: number;
    readonly cardiacOutputLPerMin: number;
    readonly lvPressureRangeMmHg: readonly [number, number];
    readonly laPressureRangeMmHg: readonly [number, number];
    readonly laPvLobeStatus: LaPvLobeMeasurementStatusV2;
    readonly laPvLobeReason: LaPvLobeMeasurementReasonV2;
  } | null;
  readonly valvePhaseEvents:
    WorkConjugateAtrialAVPlaneProfileV1["valvePhaseEvents"] | null;
  readonly trace: readonly {
    readonly theta: number;
    readonly laVolumeMl: number;
    readonly laPressureMmHg: number;
    readonly lvPressureMmHg: number;
    readonly qMitralMlPerSec: number;
    readonly qAorticMlPerSec: number;
    readonly laActivation01: number;
    readonly lvActivation01: number;
    readonly avPlanePositionCm: number;
    readonly avPlaneVelocityCmPerSec: number;
  }[];
};

export type WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeScreenV1 = {
  readonly role:
    "report-only-fixed-dose-lv-contractile-rt50-screen";
  readonly design: "one-factor-three-dose-phenotype-manifold";
  readonly physiologyHardGated: false;
  readonly clinicalFit: false;
  readonly baselineVariantId: "event-driven-atrial-activation-ablation";
  readonly phenotypeContract: {
    readonly finalBoundedStateMeasured: true;
    readonly baselineDefinition: "periodic-pre-event";
    readonly targetHeldFixed: readonly [
      "effective-onset-delay",
      "time-from-event-to-peak",
      "peak-excursion",
      "excursion-integral",
    ];
    readonly targetVaried: "relaxation-time-to-50";
    readonly doseFactors: readonly [0.92, 1, 1.08];
    readonly doseBasis:
      "local-engineering-screen-within-mapper-convergence-not-clinical-bounds";
    readonly coupledTargetNormalizedResidualTolerance: 0.015;
    readonly runtimeFutureLookingNormalization: false;
  };
  readonly legacyLvSubstitutionAudit: {
    readonly source:
      "current-rectangular-target-plus-first-order-lv-state";
    readonly targetPhenotype: ContractileActivationPhenotypeV1;
    readonly calibration: ContractileActivationPhenotypeCalibrationResultV1;
    readonly eventDrivenReplacementInstalled: false;
    readonly reason:
      "this-seed-bounds-local-solve-did-not-converge-no-model-family-impossibility-claim";
  };
  readonly engineeringCenter: {
    readonly source:
      "explicit-event-driven-lv-seed-not-normal-human-prior-or-legacy-equivalent";
    readonly readback: PeriodicActivationPhenotypeReadbackV1;
  };
  readonly cases:
    readonly WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1[];
  readonly discretizationRobustness: {
    readonly role:
      "report-only-fixed-raw-parameter-lv-phenotype-dt-check";
    readonly physiologyGate: false;
    readonly eventGridPhaseRobustnessEvaluated: false;
    readonly limitation:
      "dt-grids-share-the-same-event-alignment-no-half-step-phase-shift-test";
    readonly dtValuesSec: readonly [0.001, 0.0005, 0.00025];
    readonly cases: readonly {
      readonly dtSec: 0.001 | 0.0005 | 0.00025;
      readonly allRowsFinite: boolean;
      readonly allRowsPeriodicSteadyState: boolean;
      readonly allRowsHardGatesPass: boolean;
      readonly rows: readonly {
        readonly caseId:
          WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1["caseId"];
        readonly realizedLvTimeFromEventToPeakSec: number | null;
        readonly realizedLvRt50Sec: number | null;
        readonly realizedLvPeakExcursion01: number | null;
        readonly realizedLvExcursionIntegralSec: number | null;
        readonly coupledTargetNormalizedMaximumAbsolute: number | null;
        readonly aorticPressureFlowClosingStatus:
          WorkConjugateAtrialAVPlaneProfileV1["valvePhaseEvents"]["aortic"]["closing"]["status"] |
          null;
        readonly aorticPressureFlowClosingReason:
          WorkConjugateAtrialAVPlaneProfileV1["valvePhaseEvents"]["aortic"]["closing"]["reason"] |
          null;
        readonly mitralPressureFlowOpeningStatus:
          WorkConjugateAtrialAVPlaneProfileV1["valvePhaseEvents"]["mitral"]["opening"]["status"] |
          null;
        readonly mitralPressureFlowOpeningReason:
          WorkConjugateAtrialAVPlaneProfileV1["valvePhaseEvents"]["mitral"]["opening"]["reason"] |
          null;
        readonly pressureFlowIntervalMeasurable: boolean;
        readonly aorticClosingToMitralOpeningSec: number | null;
        readonly mitralFusionClass:
          WorkConjugateAtrialAVPlaneMitralReadbackV1["fusionClass"] | null;
        readonly yDescentMeasurementStatus:
          WorkConjugateAtrialAVPlaneProfileV1["xvyPressureReadback"]["yDescentMeasurementStatus"] |
          null;
        readonly yDescentDepthMmHg: number | null;
        readonly pressurePeakVolumePositionFraction: number | null;
        readonly cardiacOutputLPerMin: number | null;
      }[];
    }[];
    readonly classificationStableAcrossDt: {
      readonly pressureFlowIntervalMeasurable: boolean;
      readonly mitralFusionClass: boolean;
      readonly yDescentMeasurementStatus: boolean;
    };
    readonly coarseToFineMaximumAbsoluteDifferenceAcrossDoses: {
      readonly realizedLvRt50Sec: number | null;
      readonly realizedLvTimeFromEventToPeakSec: number | null;
      readonly realizedLvPeakExcursion01: number | null;
      readonly realizedLvExcursionIntegralSec: number | null;
      readonly coupledTargetNormalizedMaximumAbsolute: number | null;
      readonly aorticClosingToMitralOpeningSec: number | null;
      readonly yDescentDepthMmHg: number | null;
      readonly pressurePeakVolumePositionFraction: number | null;
      readonly cardiacOutputLPerMin: number | null;
    };
  };
  readonly result: {
    readonly allMappingsInstallable: boolean;
    readonly allCasesPassMechanicalHardGates: boolean;
    readonly anyInteriorY: boolean;
    readonly anySeparatedEa: boolean;
    readonly anyPartialEaFusion: boolean;
    readonly verdict:
      | "local-fixed-dose-does-not-resolve-interior-y-or-ea-separation"
      | "local-fixed-dose-produces-interior-y-or-ea-separation-diagnostic-only";
  };
  readonly falsificationPolicy: {
    readonly abandonSimpleLvRt50AsSufficientMechanismIf:
      "data-constrained-rt50-range-preserves-censoring-and-fusion-with-correct-pressure-flow-events";
    readonly doNotAbandonLvRelaxationFromThisLocalScreenAlone: true;
    readonly nextExperiment:
      "fixed-dose-la-ttp-and-la-rt50-after-lv-reference-is-calibrated-to-independent-lv-pressure-and-flow-data";
  };
};

export type WorkConjugateAtrialAVPlaneReportV1 = {
  readonly reportId: typeof WORK_CONJUGATE_ATRIAL_AV_PLANE_REPORT_ID_V1;
  readonly gateId: "workConjugateAtrialAVPlaneV1";
  readonly model: {
    readonly mode: "work-conjugate-left-heart-sidecar";
    readonly implementation: "WorkConjugateAVPlaneLeftHeartV1";
    readonly laPvLobeMeasurement: "LaPvLobeMeasurementV2";
    readonly notLeftHeartSubsystemV2Runtime: true;
    readonly notFullFourChamberRuntime: true;
    readonly clinicalValidation: false;
    readonly atrialBloodVolumeOwner: "Q_PV-minus-Q_MV";
    readonly avPlaneCoordinateOwner: "non-blood-work-coordinate";
    readonly activationStateOwnership: {
      readonly la:
        "legacy-filter-or-upstream-prescribed-bounded-contractile-state";
      readonly lv:
        "legacy-filter-or-upstream-prescribed-bounded-contractile-state";
      readonly prescribedStateAddsMechanicalUnknown: false;
    };
    readonly absentMechanisms: readonly string[];
    readonly forbiddenRuntimeHooks: readonly string[];
  };
  readonly acceptancePolicy: {
    readonly hardGatesOnly: readonly string[];
    readonly morphologyAndMvf: "diagnostic-pending-owner-visual-review";
    readonly noRoundingPolicy: "raw-values-preserved-in-report-display-labels-only";
  };
  readonly inputs: {
    readonly canonical: {
      readonly laReferenceBloodVolumeMl: 55;
      readonly laCircumferentialActiveStressMaxKPa: 2.2;
      readonly laLongitudinalActiveStressMaxKPa: 1.65;
      readonly lvReferenceBloodVolumeMl: 110;
      readonly lvCircumferentialActiveStressMaxKPa: 55;
      readonly lvLongitudinalActiveStressMaxKPa: 30.25;
      readonly returnReservoirInitialPressureMmHg: 15.5;
      readonly initialState: typeof INITIAL_STATE;
      readonly activation: WorkConjugateAtrialAVPlaneActivationTimingV1;
      readonly activationModel: WorkConjugateAtrialAVPlaneLaActivationModelV1;
      readonly dtSec: 0.001;
      readonly maxBeats: 30;
    };
    readonly massConversion: {
      readonly physicalMassKgToCoordinateInertiaNSec2PerCm: 0.01;
      readonly physical30gKg: number;
      readonly physical30gInertiaNSec2PerCm: number;
      readonly physical30gExternalDampingNSecPerCm: 0;
    };
  };
  readonly thresholds: typeof HARD_GATE_THRESHOLDS_V1;
  readonly variants: readonly WorkConjugateAtrialAVPlaneVariantV1[];
  readonly envelope: readonly WorkConjugateAtrialAVPlaneEnvelopeCaseV1[];
  readonly staticRootEnvelope: WorkConjugateAtrialAVPlaneStaticRootEnvelopeV1;
  readonly activationDtSensitivity:
    WorkConjugateAtrialAVPlaneActivationDtSensitivityV1;
  readonly phaseAttribution:
    WorkConjugateAtrialAVPlanePhaseAttributionV1;
  readonly activationAvpdInteraction:
    WorkConjugateAtrialAVPlaneActivationAvpdInteractionV1;
  readonly lvRelaxationPhenotypeScreen:
    WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeScreenV1;
  readonly canonicalHardGates: WorkConjugateAtrialAVPlaneHardGatesV1;
  readonly modelOrderResult: {
    readonly canonicalOrder: "quasistatic-wall-viscous-no-MD-term";
    readonly physical30gHardGatePass: boolean;
    readonly legacyInheritedInertiaPeriodic: boolean;
    readonly legacyInheritedInertiaRole: "negative-control";
    readonly summary: string;
  };
  readonly decision: {
    readonly status:
      | "canonical-hard-gates-pass-morphology-diagnostic"
      | "canonical-hard-gates-fail-no-adoption";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly defaultSelection: false;
    readonly fullFourChamberValidation: false;
    readonly clinicalValidation: false;
    readonly morphologyAcceptance: false;
  };
};

export type WorkConjugateAtrialAVPlaneCompactSampleV1 = {
  readonly theta: number;
  readonly phase: WorkConjugateAtrialAVPlanePhaseV1;
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly laPressureMmHg: number;
  readonly lvPressureMmHg: number;
  readonly qPulmonaryVenousMlPerSec: number;
  readonly qMitralMlPerSec: number;
  readonly qAorticMlPerSec: number;
  readonly avPlanePositionCm: number;
  readonly avPlaneVelocityCmPerSec: number;
  readonly laActivationDrive01: number;
  readonly laCalciumDrive: number | null;
  readonly laActivation01: number;
  readonly lvActivation01: number;
  readonly laActiveTransmuralPressureMmHg: number;
  readonly laTotalFzN: number;
  readonly lvTotalFzN: number;
  readonly avWallForceSumN: number;
  readonly avForceResidualN: number;
  readonly maxNormalizedEquationResidual: number;
  readonly acceptedStep: boolean;
};

export type WorkConjugateAtrialAVPlaneCompactTraceMetadataV1 = {
  readonly rawDtSec: number;
  readonly strideSamples:
    typeof WORK_CONJUGATE_ATRIAL_AV_PLANE_ARTIFACT_TRACE_STRIDE_V1;
  readonly sourceSampleCount: number;
  readonly retainedSampleCount: number;
  readonly gatesAndSummariesComputedFromFullTrace: true;
  readonly rendererUsesFullInMemoryTrace: true;
  readonly retainedEventSourceIndices: {
    readonly first: number;
    readonly last: number;
    readonly mitralClosingConductanceMidpoint: number;
    readonly xTrough: number;
    readonly vPeak: number;
    readonly mitralOpeningConductanceMidpoint: number;
    readonly yTrough: number;
    readonly ePeak: number;
    readonly aPeak: number;
    readonly laEventOnset: number;
    readonly laActivationDrivePeak: number;
    readonly laContractilePeak: number;
    readonly laActivePressurePeak: number;
    readonly laPressurePeak: number;
    readonly pulmonaryVenousAtrialWindowNadir: number;
  };
};

export type WorkConjugateAtrialAVPlaneArtifactProfileV1 =
  Omit<WorkConjugateAtrialAVPlaneProfileV1, "samples"> & {
    readonly compactTrace: WorkConjugateAtrialAVPlaneCompactTraceMetadataV1;
    readonly samples: readonly WorkConjugateAtrialAVPlaneCompactSampleV1[];
  };

export type WorkConjugateAtrialAVPlaneArtifactVariantV1 =
  Omit<WorkConjugateAtrialAVPlaneVariantV1, "profile"> & {
    readonly profile: WorkConjugateAtrialAVPlaneArtifactProfileV1;
  };

export type WorkConjugateAtrialAVPlaneArtifactLvRelaxationPhenotypeCaseV1 =
  Omit<WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1, "trace">;

export type WorkConjugateAtrialAVPlaneArtifactLvRelaxationPhenotypeScreenV1 =
  Omit<WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeScreenV1, "cases"> & {
    readonly cases:
      readonly WorkConjugateAtrialAVPlaneArtifactLvRelaxationPhenotypeCaseV1[];
    readonly compactTraceStorage:
      "dedicated-lv-relaxation-phenotype-report";
  };

export type WorkConjugateAtrialAVPlaneArtifactReportV1 =
  Omit<
    WorkConjugateAtrialAVPlaneReportV1,
    "variants" | "lvRelaxationPhenotypeScreen"
  > & {
    readonly variants: readonly WorkConjugateAtrialAVPlaneArtifactVariantV1[];
    readonly lvRelaxationPhenotypeScreen:
      WorkConjugateAtrialAVPlaneArtifactLvRelaxationPhenotypeScreenV1;
  };

export function integrateNegativeLinearFlowSegmentV1(
  startFlowMlPerSec: number,
  endFlowMlPerSec: number,
  dtSec: number,
): { readonly durationSec: number; readonly reverseVolumeMl: number } {
  if (
    !Number.isFinite(startFlowMlPerSec) ||
    !Number.isFinite(endFlowMlPerSec) ||
    !Number.isFinite(dtSec) ||
    dtSec <= 0
  ) {
    throw new RangeError("flow endpoints must be finite and dtSec must be positive finite");
  }
  if (startFlowMlPerSec < 0 && endFlowMlPerSec < 0) {
    return {
      durationSec: dtSec,
      reverseVolumeMl:
        -0.5 * (startFlowMlPerSec + endFlowMlPerSec) * dtSec,
    };
  }
  if (startFlowMlPerSec < 0 && endFlowMlPerSec >= 0) {
    const negativeFraction = -startFlowMlPerSec /
      (endFlowMlPerSec - startFlowMlPerSec);
    return {
      durationSec: negativeFraction * dtSec,
      reverseVolumeMl:
        -0.5 * startFlowMlPerSec * negativeFraction * dtSec,
    };
  }
  if (startFlowMlPerSec >= 0 && endFlowMlPerSec < 0) {
    const crossingFraction = startFlowMlPerSec /
      (startFlowMlPerSec - endFlowMlPerSec);
    const negativeFraction = 1 - crossingFraction;
    return {
      durationSec: negativeFraction * dtSec,
      reverseVolumeMl:
        -0.5 * endFlowMlPerSec * negativeFraction * dtSec,
    };
  }
  return { durationSec: 0, reverseVolumeMl: 0 };
}

export function pulmonaryVenousMomentumDecompositionV1(input: {
  readonly previousFlowMlPerSec: number;
  readonly currentFlowMlPerSec: number;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly laPressureMmHg: number;
  readonly dtSec: number;
  readonly resistanceMmHgSecPerMl: number;
  readonly inertanceMmHgSec2PerMl: number;
}): {
  readonly pressureGradientMmHg: number;
  readonly resistiveDropMmHg: number;
  readonly inertialDropMmHg: number;
  readonly identityResidualMmHg: number;
} {
  if (
    !Object.values(input).every(Number.isFinite) ||
    input.dtSec <= 0 ||
    input.resistanceMmHgSecPerMl < 0 ||
    input.inertanceMmHgSec2PerMl < 0
  ) {
    throw new RangeError(
      "PV momentum inputs must be finite with positive dt and nonnegative R/L",
    );
  }
  const pressureGradientMmHg = input.pulmonaryVenousPressureMmHg -
    input.laPressureMmHg;
  const resistiveDropMmHg = input.resistanceMmHgSecPerMl *
    input.currentFlowMlPerSec;
  const inertialDropMmHg = input.inertanceMmHgSec2PerMl *
    (input.currentFlowMlPerSec - input.previousFlowMlPerSec) /
    input.dtSec;
  return {
    pressureGradientMmHg,
    resistiveDropMmHg,
    inertialDropMmHg,
    identityResidualMmHg:
      pressureGradientMmHg - resistiveDropMmHg - inertialDropMmHg,
  };
}

type VariantSpecV1 = {
  readonly variantId: WorkConjugateAtrialAVPlaneVariantIdV1;
  readonly role: WorkConjugateAtrialAVPlaneVariantV1["role"];
  readonly description: string;
  readonly activationTiming?: WorkConjugateAtrialAVPlaneActivationTimingV1;
  readonly activationModel?: WorkConjugateAtrialAVPlaneLaActivationModelV1;
  readonly params: WorkConjugateAVPlaneLeftHeartParamsV1;
};

type RunProfileConfigV1 = {
  readonly profileId: string;
  readonly variantId: WorkConjugateAtrialAVPlaneVariantIdV1;
  readonly params: WorkConjugateAVPlaneLeftHeartParamsV1;
  readonly activationTiming?: WorkConjugateAtrialAVPlaneActivationTimingV1;
  readonly activationModel?: WorkConjugateAtrialAVPlaneLaActivationModelV1;
  /** Optional LV source used only by report-side mechanistic screens. */
  readonly lvActivationModel?:
    WorkConjugateAtrialAVPlaneContractileActivationModelV1;
  readonly heartRateBpm?: 60 | 75 | 100;
  readonly dtSec?: number;
};

type PhaseAttributionConfigurationV1 = {
  readonly activationTiming: WorkConjugateAtrialAVPlaneActivationTimingV1;
  readonly activationModel: WorkConjugateAtrialAVPlaneLaActivationModelV1;
  readonly params: WorkConjugateAVPlaneLeftHeartParamsV1;
};

type PathIntersectionV1 = {
  readonly pathAProgress01: number;
  readonly pathBProgress01: number;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
  readonly angleDeg: number;
};

type FigureEightCrossingV1 = {
  readonly source: "conduit" | "pumping";
  readonly phase:
    | "late-conduit"
    | "early-pumping"
    | "outside-preferred-window";
  readonly pathProgress01: number;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
  readonly angleDeg: number;
  readonly preferredWindow: boolean;
};

type UnwrappedMitralSampleV1 = {
  readonly index: number;
  readonly elapsedSec: number;
  readonly sample: WorkConjugateAtrialAVPlaneSampleV1;
};

const DEFAULT_HEART_RATE_BPM = 75;
const DEFAULT_DT_SEC = 0.001;
const DEFAULT_MIN_BEATS = 5;
const DEFAULT_MAX_BEATS = 30;
const EVENT_HISTORY_DECAY_TAU_MULTIPLES_V1 = 32 as const;
const EVENT_HISTORY_RISE_TAU_MULTIPLES_V1 = 16 as const;
const LV_ELECTRICAL_ONSET_SEC = 0.04;
const LV_ELECTRICAL_DURATION_SEC = 0.30;
const LA_ELECTRICAL_ONSET_BEFORE_CYCLE_END_SEC = 0.18;
const LA_ELECTRICAL_DURATION_SEC = 0.15;
const PHYSICAL_30G_KG = 0.030;
const PHYSICAL_30G_INERTIA_N_SEC2_PER_CM =
  workConjugateAVPlaneCoordinateInertiaNSec2PerCmFromPhysicalMassKgV1(
    PHYSICAL_30G_KG,
  );
const BASE_PARAMS = DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1;

export const HARD_GATE_THRESHOLDS_V1 = {
  maxNormalizedEquationResidual: 1e-7,
  maxAbsMassResidualMl: 1e-7,
  maxAbsClosedCircuitVolumeResidualMl: 1e-7,
  maxAbsTotalVolumeDriftMl: 1e-7,
  maxAbsWallRawPowerResidualW: 1e-10,
  maxAbsPressureAreaIdentityResidualN: 1e-10,
  maxAbsAvPlaneForceResidualN: 1e-7,
  maxAbsAvForcePowerResidualW: 1e-8,
  maxAbsCoupledRawPowerResidualW: 1e-8,
  periodicVolumeMl: 1e-3,
  periodicPressureMmHg: 1e-3,
  periodicFlowMlPerSec: 1e-2,
  periodicCoordinateCm: 1e-5,
  periodicVelocityCmPerSec: 1e-4,
  periodicActivation01: 1e-6,
} as const;

const INITIAL_STATE = {
  laVolumeMl: 65,
  lvVolumeMl: 120,
  pulmonaryVenousPressureMmHg: 9,
  aorticPressureMmHg: 90,
  returnReservoirPressureMmHg: 15.5,
} as const;

const DEFAULT_ACTIVATION_TIMING_V1: WorkConjugateAtrialAVPlaneActivationTimingV1 = {
  role: "prescribed-electrical-input-sidecar-artificial",
  lvOnsetSec: LV_ELECTRICAL_ONSET_SEC,
  lvDuration: { kind: "seconds", value: LV_ELECTRICAL_DURATION_SEC },
  laStart: {
    kind: "seconds-before-cycle-end",
    value: LA_ELECTRICAL_ONSET_BEFORE_CYCLE_END_SEC,
  },
  laDurationSec: LA_ELECTRICAL_DURATION_SEC,
};

export const WORK_CONJUGATE_ATRIAL_AV_PLANE_LEGACY_ACTIVATION_MODEL_V1:
WorkConjugateAtrialAVPlaneLaActivationModelV1 = {
  kind: "legacy-rectangular-first-order",
  eventReference: "prescribed-effective-sidecar-event",
  stateOwner: "left-heart-subsystem-first-order-filter",
};

/**
 * Engineering seed for a clean single-factor activation-model ablation.
 * These are not calcium-concentration or patient-fit claims; the report exposes
 * the resulting TTP/RT50 so future fitting can use observable timing instead of
 * freely trading kernel, Hill, kinetic, and stress-amplitude parameters.
 */
export const WORK_CONJUGATE_ATRIAL_AV_PLANE_EVENT_ACTIVATION_MODEL_V1:
WorkConjugateAtrialAVPlaneLaActivationModelV1 = {
  kind: "event-driven-ca-like-bounded-state",
  eventReference: "prescribed-effective-sidecar-event",
  stateOwner: "upstream-event-driven-contractile-state",
  params: {
    electricalToCalciumDelaySec: 0,
    calciumKernel: {
      riseTauSec: 0.060,
      decayTauSec: 0.065,
    },
    contractileKinetics: {
      onRatePerSec: 30,
      offRatePerSec: 30,
    },
  },
  fixedHillMapping: FIXED_CONTRACTILE_HILL_MAPPING_V1,
  eventHistory: {
    kind: "finite-periodic-history-no-beat-reset",
    decayTauMultiples: EVENT_HISTORY_DECAY_TAU_MULTIPLES_V1,
    riseTauMultiples: EVENT_HISTORY_RISE_TAU_MULTIPLES_V1,
  },
  activeStressAmplitudeOwner: "existing-work-conjugate-wall",
  fitPolicy:
    "fit-effective-onset-amplitude-relaxation-before-extra-shape-parameters",
  claim: "dimensionless-ca-like-driver-not-calcium-concentration",
};

/**
 * Explicit engineering center for the first phenotype-controlled LV screen.
 * It is neither a normal-human prior nor a hidden replacement of the legacy
 * rectangular LV target.  The report separately tests, and fails closed on,
 * whether the legacy trace can be represented by this event-driven family.
 */
export const WORK_CONJUGATE_ATRIAL_AV_PLANE_LV_PHENOTYPE_SEED_PARAMS_V1:
EventDrivenContractileActivationParamsV1 = {
  electricalEventReference: "prescribed-effective-sidecar-event",
  electricalToCalciumDelaySec: 0.015,
  calciumKernel: {
    riseTauSec: 0.025,
    decayTauSec: 0.075,
  },
  contractileKinetics: {
    onRatePerSec: 40,
    offRatePerSec: 14,
  },
};

export const WORK_CONJUGATE_ATRIAL_AV_PLANE_CANONICAL_PARAMS_V1 =
  buildWorkConjugateAtrialAVPlaneParamsV1({
    order: "quasistatic",
    inertiaNSec2PerCm: 0,
    externalDampingNSecPerCm: 0,
  });

const VARIANT_SPECS_V1: readonly VariantSpecV1[] = [
  {
    variantId: "canonical-quasistatic-wall-viscous",
    role: "canonical-engineering-candidate",
    description: "Canonical engineering candidate: LA active 2.2 kPa, LV long active ratio 0.55, quasistatic AV coordinate with wall viscosity only.",
    params: WORK_CONJUGATE_ATRIAL_AV_PLANE_CANONICAL_PARAMS_V1,
  },
  {
    variantId: "event-driven-atrial-activation-ablation",
    role: "activation-model-diagnostic",
    description: "Single-factor LA activation-model ablation: canonical mechanics and event timing with an event-to-Ca-like-to-bounded-contractile-state path; LV activation remains canonical.",
    activationModel: WORK_CONJUGATE_ATRIAL_AV_PLANE_EVENT_ACTIVATION_MODEL_V1,
    params: WORK_CONJUGATE_ATRIAL_AV_PLANE_CANONICAL_PARAMS_V1,
  },
  {
    variantId: "physical-inertial-30g",
    role: "model-order-comparator",
    description: "Physical inertial comparator: 30 g maps to M=0.0003 N s2/cm with D=0.",
    params: buildWorkConjugateAtrialAVPlaneParamsV1({
      order: "inertial",
      inertiaNSec2PerCm: PHYSICAL_30G_INERTIA_N_SEC2_PER_CM,
      externalDampingNSecPerCm: 0,
    }),
  },
  {
    variantId: "legacy-inherited-inertia-m1p1-negative-control",
    role: "negative-control",
    description: "Legacy inherited inertia negative control: M=1.1 N s2/cm with D=0.",
    params: buildWorkConjugateAtrialAVPlaneParamsV1({
      order: "inertial",
      inertiaNSec2PerCm: 1.1,
      externalDampingNSecPerCm: 0,
    }),
  },
  {
    variantId: "atrial-active-off-control",
    role: "model-order-comparator",
    description: "Atrial-active-off control: canonical order with LA active stress removed.",
    params: buildWorkConjugateAtrialAVPlaneParamsV1({
      order: "quasistatic",
      inertiaNSec2PerCm: 0,
      externalDampingNSecPerCm: 0,
      laActiveStressScale: 0,
    }),
  },
  {
    variantId: "higher-wall-viscosity-topology-control",
    role: "topology-control",
    description: "Higher-wall-viscosity topology control: canonical order with both wall viscosities multiplied by 3.",
    params: buildWorkConjugateAtrialAVPlaneParamsV1({
      order: "quasistatic",
      inertiaNSec2PerCm: 0,
      externalDampingNSecPerCm: 0,
      wallViscosityScale: 3,
    }),
  },
  {
    variantId: "activation-timing-sensitivity",
    role: "activation-timing-diagnostic",
    description: "Transparent activation/diastasis hypothesis test with LV passive scale 20 kPa, cycle-fraction LV drive, and later LA drive; not canonical or acceptance.",
    activationTiming: {
      role: "prescribed-electrical-input-sidecar-artificial",
      lvOnsetSec: LV_ELECTRICAL_ONSET_SEC,
      lvDuration: { kind: "cycle-fraction", value: 0.30 },
      laStart: { kind: "cycle-fraction", value: 0.80 },
      laDurationSec: 0.10,
    },
    params: buildWorkConjugateAtrialAVPlaneParamsV1({
      order: "quasistatic",
      inertiaNSec2PerCm: 0,
      externalDampingNSecPerCm: 0,
      lvPassiveStressScaleKPa: 20,
      lvFallTauSec: 0.025,
      laFallTauSec: 0.050,
    }),
  },
];

export function runWorkConjugateAtrialAVPlaneBenchV1():
WorkConjugateAtrialAVPlaneReportV1 {
  const variants: WorkConjugateAtrialAVPlaneVariantV1[] = VARIANT_SPECS_V1.map((spec) => {
    const profile = runWorkConjugateAtrialAVPlaneProfileV1({
      profileId: `${spec.variantId}-hr75`,
      variantId: spec.variantId,
      params: spec.params,
      activationTiming: spec.activationTiming,
      activationModel: spec.activationModel,
    });
    return {
      variantId: spec.variantId,
      role: spec.role,
      description: spec.description,
      activationTiming: spec.activationTiming ?? DEFAULT_ACTIVATION_TIMING_V1,
      activationModel: spec.activationModel ??
        WORK_CONJUGATE_ATRIAL_AV_PLANE_LEGACY_ACTIVATION_MODEL_V1,
      params: spec.params,
      profile,
      hardGates: evaluateHardGates(profile),
      diagnosticRole: {
        morphology: "owner-visual-review-required",
        mitralWaveform: "diagnostic-pending-owner-review",
        clinicalFit: false,
      },
    };
  });
  const canonical = variant(variants, "canonical-quasistatic-wall-viscous");
  const eventActivation = variant(
    variants,
    "event-driven-atrial-activation-ablation",
  );
  const physical30g = variant(variants, "physical-inertial-30g");
  const legacy = variant(variants, "legacy-inherited-inertia-m1p1-negative-control");
  const envelope = buildEnvelope(canonical.profile);
  const staticRootEnvelope = buildStaticRootEnvelope(
    canonical.profile,
    WORK_CONJUGATE_ATRIAL_AV_PLANE_CANONICAL_PARAMS_V1,
  );
  const activationDtSensitivity = buildActivationDtSensitivity(eventActivation);
  const phaseAttribution = buildPhaseAttribution(eventActivation);
  const activationAvpdInteraction = buildActivationAvpdInteraction(
    eventActivation,
  );
  const lvRelaxationPhenotypeScreen =
    buildLvRelaxationPhenotypeScreen(eventActivation);
  return {
    reportId: WORK_CONJUGATE_ATRIAL_AV_PLANE_REPORT_ID_V1,
    gateId: "workConjugateAtrialAVPlaneV1",
    model: {
      mode: "work-conjugate-left-heart-sidecar",
      implementation: "WorkConjugateAVPlaneLeftHeartV1",
      laPvLobeMeasurement: "LaPvLobeMeasurementV2",
      notLeftHeartSubsystemV2Runtime: true,
      notFullFourChamberRuntime: true,
      clinicalValidation: false,
      atrialBloodVolumeOwner: "Q_PV-minus-Q_MV",
      avPlaneCoordinateOwner: "non-blood-work-coordinate",
      activationStateOwnership: {
        la: "legacy-filter-or-upstream-prescribed-bounded-contractile-state",
        lv: "legacy-filter-or-upstream-prescribed-bounded-contractile-state",
        prescribedStateAddsMechanicalUnknown: false,
      },
      absentMechanisms: [
        "P_mem",
        "P_relief",
        "P_LV_recv",
        "independent-AV-spring-K",
        "hidden-volume",
        "hidden-blood-volume-source",
      ],
      forbiddenRuntimeHooks: [
        "P_mem",
        "P_relief",
        "P_LV_recv",
        "hidden-volume-source",
        "direct-AV-gradient-injection",
      ],
    },
    acceptancePolicy: {
      hardGatesOnly: [
        "finite+solver-convergence",
        "periodicity",
        "closed-volume/mass",
        "hidden-source-exact-zero",
        "wall-virtual-work-residual",
        "pressure-area-identity",
        "AV-force/power-residual",
        "passive-reference-restoring-derivative-negative",
      ],
      morphologyAndMvf: "diagnostic-pending-owner-visual-review",
      noRoundingPolicy: "raw-values-preserved-in-report-display-labels-only",
    },
    inputs: {
      canonical: {
        laReferenceBloodVolumeMl: 55,
        laCircumferentialActiveStressMaxKPa: 2.2,
        laLongitudinalActiveStressMaxKPa: 1.65,
        lvReferenceBloodVolumeMl: 110,
        lvCircumferentialActiveStressMaxKPa: 55,
        lvLongitudinalActiveStressMaxKPa: 30.25,
        returnReservoirInitialPressureMmHg: 15.5,
        initialState: INITIAL_STATE,
        activation: DEFAULT_ACTIVATION_TIMING_V1,
        activationModel:
          WORK_CONJUGATE_ATRIAL_AV_PLANE_LEGACY_ACTIVATION_MODEL_V1,
        dtSec: DEFAULT_DT_SEC,
        maxBeats: DEFAULT_MAX_BEATS,
      },
      massConversion: {
        physicalMassKgToCoordinateInertiaNSec2PerCm: 0.01,
        physical30gKg: PHYSICAL_30G_KG,
        physical30gInertiaNSec2PerCm: PHYSICAL_30G_INERTIA_N_SEC2_PER_CM,
        physical30gExternalDampingNSecPerCm: 0,
      },
    },
    thresholds: HARD_GATE_THRESHOLDS_V1,
    variants,
    envelope,
    staticRootEnvelope,
    activationDtSensitivity,
    phaseAttribution,
    activationAvpdInteraction,
    lvRelaxationPhenotypeScreen,
    canonicalHardGates: canonical.hardGates,
    modelOrderResult: {
      canonicalOrder: "quasistatic-wall-viscous-no-MD-term",
      physical30gHardGatePass: physical30g.hardGates.allHardGatesPass,
      legacyInheritedInertiaPeriodic: legacy.profile.periodicSteadyState,
      legacyInheritedInertiaRole: "negative-control",
      summary: legacy.profile.periodicSteadyState
        ? "The legacy inertia comparator unexpectedly reached the periodic hard gate; keep it as a diagnostic row, not the canonical order."
        : "The canonical quasistatic wall-viscous and physical 30 g rows remain finite; the inherited M=1.1 row is retained as a nonperiodic negative control.",
    },
    decision: {
      status: canonical.hardGates.allHardGatesPass
        ? "canonical-hard-gates-pass-morphology-diagnostic"
        : "canonical-hard-gates-fail-no-adoption",
      nextAction: canonical.hardGates.allHardGatesPass
        ? "Calibrate the event-driven LV reference to independent LV pressure-volume and aortic-flow data, then run fixed-dose LA TTP/RT50 screens with the pressure-flow valve-event contract; retain independent AVPD/annular-motion evidence and do not promote runtime or clinical claims."
        : "Fix only the failed hard-gate mechanics/conservation issue before visual morphology review.",
      blockedClaims: [
        "LeftHeartSubsystemV2-runtime-wiring",
        "full-four-chamber-validation",
        "clinical-fit",
        "event-driven-LV-legacy-equivalence",
        "simple-LV-RT50-sufficiency",
        "joint-activation-AVPD-fit-from-LA-PV-shape-alone",
        "morphology-acceptance-without-owner-review",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      defaultSelection: false,
      fullFourChamberValidation: false,
      clinicalValidation: false,
      morphologyAcceptance: false,
    },
  };
}

function buildPhaseAttribution(
  referenceVariant: WorkConjugateAtrialAVPlaneVariantV1,
): WorkConjugateAtrialAVPlanePhaseAttributionV1 {
  if (referenceVariant.activationModel.kind !==
    "event-driven-ca-like-bounded-state") {
    throw new Error("phase attribution requires the event-driven LA activation reference");
  }
  const referenceModel = referenceVariant.activationModel;
  const referenceParams = referenceVariant.params;
  const referenceTiming = referenceVariant.activationTiming;
  const referenceConfiguration: PhaseAttributionConfigurationV1 = {
    activationTiming: referenceTiming,
    activationModel: referenceModel,
    params: referenceParams,
  };
  const referenceLvTargetOffSec = referenceTiming.lvOnsetSec +
    activationDurationSec(
      referenceTiming.lvDuration,
      referenceVariant.profile.cycleLengthSec,
    );
  const reference = phaseAttributionCaseFromProfile(
    referenceVariant.profile,
    {
      caseId: "event-activation-reference",
      position: "reference",
      parameterValue: null,
      deltaFromReference: null,
      changedParameterPaths: [],
    },
    {
      params: referenceParams,
      lvTargetOffSec: referenceLvTargetOffSec,
      referenceConfiguration,
      caseConfiguration: referenceConfiguration,
    },
  );
  const runCase = (input: {
    readonly caseId: string;
    readonly position: "lower" | "higher";
    readonly parameterValue: number;
    readonly deltaFromReference: number;
    readonly changedParameterPath: string;
    readonly params?: WorkConjugateAVPlaneLeftHeartParamsV1;
    readonly activationModel?: WorkConjugateAtrialAVPlaneLaActivationModelV1;
  }): WorkConjugateAtrialAVPlanePhaseAttributionCaseV1 => {
    const caseParams = input.params ?? referenceParams;
    const caseActivationModel = input.activationModel ?? referenceModel;
    const profile = runWorkConjugateAtrialAVPlaneProfileV1({
      profileId: `phase-attribution-${input.caseId}-hr75`,
      variantId: "event-driven-atrial-activation-ablation",
      params: caseParams,
      activationTiming: referenceTiming,
      activationModel: caseActivationModel,
    });
    return phaseAttributionCaseFromProfile(profile, {
      caseId: input.caseId,
      position: input.position,
      parameterValue: input.parameterValue,
      deltaFromReference: input.deltaFromReference,
      changedParameterPaths: [input.changedParameterPath],
    }, {
      params: caseParams,
      lvTargetOffSec: referenceLvTargetOffSec,
      referenceConfiguration,
      caseConfiguration: {
        activationTiming: referenceTiming,
        activationModel: caseActivationModel,
        params: caseParams,
      },
    });
  };
  const delayPath =
    "activationModel.params.electricalToCalciumDelaySec";
  const delayReference = referenceModel.params.electricalToCalciumDelaySec;
  const delayCases = [0.015, 0.030].map((delaySec) =>
    runCase({
      caseId: `event-to-calcium-delay-${Math.round(delaySec * 1000)}ms`,
      position: "higher",
      parameterValue: delaySec,
      deltaFromReference: delaySec - delayReference,
      changedParameterPath: delayPath,
      activationModel: {
        ...referenceModel,
        params: {
          ...referenceModel.params,
          electricalToCalciumDelaySec: delaySec,
        },
      },
    })
  );
  const lvFallPath = "params.activation.lvFallTauSec";
  const lvFallReference = referenceParams.activation.lvFallTauSec;
  const lvFallCases = [0.030, 0.050].map((tauSec) =>
    runCase({
      caseId: `lv-activation-fall-${Math.round(tauSec * 1000)}ms`,
      position: tauSec < lvFallReference ? "lower" : "higher",
      parameterValue: tauSec,
      deltaFromReference: tauSec - lvFallReference,
      changedParameterPath: lvFallPath,
      params: {
        ...referenceParams,
        activation: {
          ...referenceParams.activation,
          lvFallTauSec: tauSec,
        },
      },
    })
  );
  const pulmonaryVenousResistancePath =
    "params.pulmonaryVenousResistanceMmHgSecPerMl";
  const pulmonaryVenousResistanceReference =
    referenceParams.pulmonaryVenousResistanceMmHgSecPerMl;
  const pulmonaryVenousResistanceCases = [0.045, 0.075].map((resistance) =>
    runCase({
      caseId: `pulmonary-venous-resistance-${resistance.toFixed(3)}`,
      position: resistance < pulmonaryVenousResistanceReference
        ? "lower"
        : "higher",
      parameterValue: resistance,
      deltaFromReference:
        resistance - pulmonaryVenousResistanceReference,
      changedParameterPath: pulmonaryVenousResistancePath,
      params: {
        ...referenceParams,
        pulmonaryVenousResistanceMmHgSecPerMl: resistance,
      },
    })
  );
  return {
    role: "report-only-one-factor-at-a-time-causal-screen",
    baselineVariantId: "event-driven-atrial-activation-ablation",
    physiologyHardGated: false,
    perturbationBasis:
      "local-engineering-brackets-not-clinical-priors-or-fit-bounds",
    literatureContext: {
      role: "soft-display-context-not-hard-gates",
      currentEventIsSurfacePWave: false,
      currentEventIsLocalLaDepolarization: false,
      aorticValveHasLeafletClosureState: false,
      flowEndToMitralConductanceOpeningComparableToClinicalIvrt: false,
      ivrtSoftEnvelopeSec: [0.060, 0.100],
      hr75EaTwoPeakExpectation:
        "scenario-level-soft-context-not-universal-gate",
      pulmonaryVenousArDurationSoftEnvelopeSec: [0.080, 0.140],
      aggregateQpvVelocityGateAllowed: false,
      sources: [
        {
          topic: "surface-P-to-LA-mechanical-onset",
          citation: "Wang et al. Br Heart J. 1995;74:403-407",
          url: "https://pubmed.ncbi.nlm.nih.gov/7488455/",
        },
        {
          topic: "surface-P-to-mitral-A-annular-Am-and-PV-Ar-timing",
          citation: "Bukachi et al. Eur J Echocardiogr. 2005;6:107-116",
          url: "https://doi.org/10.1016/j.euje.2004.07.009",
        },
        {
          topic: "IVRT-and-pulmonary-venous-Ar-context",
          citation: "de Marchi et al. Heart. 2001;85:23-29",
          url: "https://doi.org/10.1136/heart.85.1.23",
        },
        {
          topic: "HR-dependent-E-A-fusion",
          citation: "Chung et al. Am J Physiol Heart Circ Physiol. 2004",
          url: "https://doi.org/10.1152/ajpheart.00404.2004",
        },
        {
          topic: "diastolic-function-definitions",
          citation: "ASE Left Ventricular Diastolic Function Guideline. 2025",
          url: "https://www.asecho.org/wp-content/uploads/2025/07/Left-Ventricular-Diastolic-Function.pdf",
        },
      ],
    },
    reference,
    factors: [
      {
        factorId: "effective-event-to-calcium-delay",
        parameterPath: delayPath,
        parameterUnit: "s",
        referenceValue: delayReference,
        hypothesis:
          "Delays the Ca-like and contractile paths without moving the electrical event, phase boundary, LV drive, load, or wall law.",
        cases: delayCases,
      },
      {
        factorId: "lv-activation-fall-time",
        parameterPath: lvFallPath,
        parameterUnit: "s",
        referenceValue: lvFallReference,
        hypothesis:
          "Changes only the phenomenological LV activation-state fall time to test the MV conductance-opening midpoint, y, and AV-plane phase attribution; it is not a myocardial relaxation-time measurement.",
        cases: lvFallCases,
      },
      {
        factorId: "pulmonary-venous-series-resistance",
        parameterPath: pulmonaryVenousResistancePath,
        parameterUnit: "mmHg s/mL",
        referenceValue: pulmonaryVenousResistanceReference,
        hypothesis:
          "Changes only the linear PV-to-LA series resistance to test whether local impedance alone can generate Ar or repair x/y/topology.",
        cases: pulmonaryVenousResistanceCases,
      },
    ],
  };
}

function buildActivationAvpdInteraction(
  referenceVariant: WorkConjugateAtrialAVPlaneVariantV1,
): WorkConjugateAtrialAVPlaneActivationAvpdInteractionV1 {
  const referenceModel = referenceVariant.activationModel;
  if (referenceModel.kind !==
    "event-driven-ca-like-bounded-state") {
    throw new Error(
      "activation-AVPD interaction requires the event-driven LA activation reference",
    );
  }
  const activationPath =
    "activationModel.params.calciumKernel.riseTauSec" as const;
  const avpdDriverPath =
    "params.lvWall.axes.longitudinal.activeStressMaxKPa" as const;
  const referenceConfiguration: PhaseAttributionConfigurationV1 = {
    activationTiming: referenceVariant.activationTiming,
    activationModel: referenceModel,
    params: referenceVariant.params,
  };
  const buildCase = (input: {
    readonly caseId:
      WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1["caseId"];
    readonly riseTauSec: 0.040 | 0.060 | 0.080;
    readonly lvLongitudinalActiveStressMaxRatio: 0.45 | 0.55 | 0.65;
    readonly dtSec?: 0.001 | 0.0005 | 0.00025;
    readonly profile?: WorkConjugateAtrialAVPlaneProfileV1;
  }): WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1 => {
    const lvLongitudinalActiveStressMaxKPa =
      referenceVariant.params.lvWall.axes.circumferential.activeStressMaxKPa *
      input.lvLongitudinalActiveStressMaxRatio;
    const activationModel: WorkConjugateAtrialAVPlaneLaActivationModelV1 = {
      ...referenceModel,
      params: {
        ...referenceModel.params,
        calciumKernel: {
          ...referenceModel.params.calciumKernel,
          riseTauSec: input.riseTauSec,
        },
      },
    };
    const params: WorkConjugateAVPlaneLeftHeartParamsV1 = {
      ...referenceVariant.params,
      lvWall: {
        ...referenceVariant.params.lvWall,
        axes: {
          ...referenceVariant.params.lvWall.axes,
          longitudinal: {
            ...referenceVariant.params.lvWall.axes.longitudinal,
            activeStressMaxKPa: lvLongitudinalActiveStressMaxKPa,
          },
        },
      },
    };
    const profile = input.profile ?? runWorkConjugateAtrialAVPlaneProfileV1({
      profileId:
        `activation-avpd-${input.caseId}-hr75-dt-${input.dtSec ?? DEFAULT_DT_SEC}`,
      variantId: "event-driven-atrial-activation-ablation",
      params,
      activationTiming: referenceVariant.activationTiming,
      activationModel,
      dtSec: input.dtSec,
    });
    const caseConfiguration: PhaseAttributionConfigurationV1 = {
      activationTiming: referenceVariant.activationTiming,
      activationModel,
      params,
    };
    const changedParameterPaths = [
      ...(input.riseTauSec === 0.060 ? [] : [activationPath]),
      ...(input.lvLongitudinalActiveStressMaxRatio === 0.55
        ? []
        : [avpdDriverPath]),
    ];
    return activationAvpdInteractionCaseFromProfile(profile, {
      caseId: input.caseId,
      position: input.caseId === "interaction-center" ? "center" : "corner",
      activationCalciumRiseTauSec: input.riseTauSec,
      lvLongitudinalToCircumferentialActiveStressMaxRatio:
        input.lvLongitudinalActiveStressMaxRatio,
      lvLongitudinalActiveStressMaxKPa,
      changedParameterPaths,
    }, {
      referenceConfiguration,
      caseConfiguration,
    });
  };
  const center = buildCase({
    caseId: "interaction-center",
    riseTauSec: 0.060,
    lvLongitudinalActiveStressMaxRatio: 0.55,
    profile: referenceVariant.profile,
  });
  const fastLow = buildCase({
    caseId: "fast-rise-low-lv-longitudinal",
    riseTauSec: 0.040,
    lvLongitudinalActiveStressMaxRatio: 0.45,
  });
  const fastHigh = buildCase({
    caseId: "fast-rise-high-lv-longitudinal",
    riseTauSec: 0.040,
    lvLongitudinalActiveStressMaxRatio: 0.65,
  });
  const slowLow = buildCase({
    caseId: "slow-rise-low-lv-longitudinal",
    riseTauSec: 0.080,
    lvLongitudinalActiveStressMaxRatio: 0.45,
  });
  const slowHigh = buildCase({
    caseId: "slow-rise-high-lv-longitudinal",
    riseTauSec: 0.080,
    lvLongitudinalActiveStressMaxRatio: 0.65,
  });
  const interactionCorners = [fastLow, fastHigh, slowLow, slowHigh] as const;
  type InteractionCornerTupleV1 = readonly [
    WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1,
    WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1,
    WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1,
    WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1,
  ];
  const differenceOfDifferences = (
    corners: InteractionCornerTupleV1,
    valueOf: (
      value: WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1,
    ) => number | null,
  ): number | null => {
    const values = corners.map(valueOf);
    if (values.some((value) => value === null)) return null;
    const [fastLowValue, fastHighValue, slowLowValue, slowHighValue] =
      values as [number, number, number, number];
    return (slowHighValue - fastHighValue) -
      (slowLowValue - fastLowValue);
  };
  const normalizedMagnitude = (
    corners: InteractionCornerTupleV1,
    contrast: number | null,
    valueOf: (
      value: WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1,
    ) => number | null,
  ): number | null => {
    if (contrast === null) return null;
    const values = corners.map(valueOf);
    if (values.some((value) => value === null)) return null;
    const numericValues = values as number[];
    const cornerRange = maxOf(numericValues) - minOf(numericValues);
    return cornerRange > 0 ? Math.abs(contrast) / cornerRange : null;
  };
  const evaluateInteractionCorners = (corners: InteractionCornerTupleV1) => {
    const cCandidateStatuses = corners.map((row) =>
      row.readback.cWaveCandidateStatus
    );
    const cContrastMeasurementValid = cCandidateStatuses.every((status) =>
      status === cCandidateStatuses[0] && status !== "not-measurable"
    );
    const cToXContrastStatus:
      WorkConjugateAtrialAVPlaneCToXContrastStatusV1 =
        !cContrastMeasurementValid
          ? "not-measurable-or-heterogeneous-candidate-definition"
          : cCandidateStatuses[0] === "interior-ivct-peak"
          ? "homogeneous-interior-candidate"
          : "homogeneous-boundary-candidate";
    const yContrastMeasurementValid = corners.every((row) =>
      row.readback.yDescentMeasurementStatus === "interior-trough"
    );
    const metrics: WorkConjugateAtrialAVPlaneInteractionContrastMetricsV1 = {
      avPlaneCycleExcursionCm: differenceOfDifferences(corners, (row) =>
        row.readback.avPlaneCycleExcursionCm
      )!,
      mitralClosingMidpointToAorticFlowEndDisplacementCm:
        differenceOfDifferences(corners, (row) =>
          row.readback.mitralClosingMidpointToAorticFlowEndDisplacementCm
        ),
      mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec:
        differenceOfDifferences(corners, (row) =>
          row.readback
            .mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec
        ),
      pressurePeakVolumePositionFraction:
        differenceOfDifferences(corners, (row) =>
          row.readback.pressurePeakVolumePositionFraction
        ),
      cToXDepthMmHg: cContrastMeasurementValid
        ? differenceOfDifferences(corners, (row) =>
          row.readback.cToXDepthMmHg
        )
        : null,
      cardiacOutputLPerMin: differenceOfDifferences(corners, (row) =>
        row.readback.cardiacOutputLPerMin
      )!,
    };
    const cornerRangeNormalizedMagnitude:
      WorkConjugateAtrialAVPlaneInteractionNormalizedMagnitudeV1 = {
        avPlaneCycleExcursionCm: normalizedMagnitude(
          corners,
          metrics.avPlaneCycleExcursionCm,
          (row) => row.readback.avPlaneCycleExcursionCm,
        ),
        mitralClosingMidpointToAorticFlowEndDisplacementCm:
          normalizedMagnitude(
            corners,
            metrics.mitralClosingMidpointToAorticFlowEndDisplacementCm,
            (row) =>
              row.readback
                .mitralClosingMidpointToAorticFlowEndDisplacementCm,
          ),
        mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec:
          normalizedMagnitude(
            corners,
            metrics
              .mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec,
            (row) => row.readback
              .mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec,
          ),
        pressurePeakVolumePositionFraction: normalizedMagnitude(
          corners,
          metrics.pressurePeakVolumePositionFraction,
          (row) => row.readback.pressurePeakVolumePositionFraction,
        ),
        cToXDepthMmHg: normalizedMagnitude(
          corners,
          metrics.cToXDepthMmHg,
          (row) => row.readback.cToXDepthMmHg,
        ),
        cardiacOutputLPerMin: normalizedMagnitude(
          corners,
          metrics.cardiacOutputLPerMin,
          (row) => row.readback.cardiacOutputLPerMin,
        ),
      };
    return {
      metrics,
      cToXContrastStatus,
      yDescentDepthMmHg: yContrastMeasurementValid
        ? differenceOfDifferences(corners, (row) =>
          row.readback.yDescentDepthMmHg
        )
        : null,
      yDescentContrastStatus: yContrastMeasurementValid
        ? "measurable-all-corners-interior" as const
        : "not-measurable-one-or-more-censored-or-fallback" as const,
      cornerRangeNormalizedMagnitude,
    };
  };
  const baseInteractionEvaluation =
    evaluateInteractionCorners(interactionCorners);
  const interactionDtValues = [0.001, 0.0005, 0.00025] as const;
  const interactionDtCases = interactionDtValues.map((dtSec) => {
    const corners: InteractionCornerTupleV1 = dtSec === DEFAULT_DT_SEC
      ? interactionCorners
      : [
        buildCase({
          caseId: "fast-rise-low-lv-longitudinal",
          riseTauSec: 0.040,
          lvLongitudinalActiveStressMaxRatio: 0.45,
          dtSec,
        }),
        buildCase({
          caseId: "fast-rise-high-lv-longitudinal",
          riseTauSec: 0.040,
          lvLongitudinalActiveStressMaxRatio: 0.65,
          dtSec,
        }),
        buildCase({
          caseId: "slow-rise-low-lv-longitudinal",
          riseTauSec: 0.080,
          lvLongitudinalActiveStressMaxRatio: 0.45,
          dtSec,
        }),
        buildCase({
          caseId: "slow-rise-high-lv-longitudinal",
          riseTauSec: 0.080,
          lvLongitudinalActiveStressMaxRatio: 0.65,
          dtSec,
        }),
      ];
    const evaluation = evaluateInteractionCorners(corners);
    return {
      dtSec,
      allCornersFinite: corners.every((row) => row.numerics.allFinite),
      allCornersPeriodicSteadyState: corners.every((row) =>
        row.numerics.periodicSteadyState
      ),
      allCornersHardGatesPass: corners.every((row) =>
        row.numerics.allHardGatesPass
      ),
      contrast: evaluation.metrics,
      cToXContrastStatus: evaluation.cToXContrastStatus,
      cornerRangeNormalizedMagnitude:
        evaluation.cornerRangeNormalizedMagnitude,
    };
  });
  const signStable = (values: readonly (number | null)[]): boolean | null => {
    if (values.some((value) => value === null || Math.abs(value) <= 1e-12)) {
      return null;
    }
    const signs = values.map((value) => Math.sign(value!));
    return signs.every((sign) => sign === signs[0]);
  };
  const nullableAbsoluteDifference = (
    a: number | null,
    b: number | null,
  ): number | null => a === null || b === null ? null : Math.abs(a - b);
  const coarseInteraction = interactionDtCases[0]!.contrast;
  const fineInteraction = interactionDtCases[2]!.contrast;
  return {
    role: "report-only-free-coupled-two-factor-interaction-screen",
    baselineVariantId: "event-driven-atrial-activation-ablation",
    design: "center-plus-four-corners",
    physiologyHardGated: false,
    fittingBounds: false,
    explicitActivationTimesAvPlaneCrossTerm: false,
    avPlaneTrajectoryPrescribed: false,
    avpdEmergesFromSharedWallForceBalance: true,
    factors: {
      activation: {
        parameterPath: activationPath,
        unit: "s",
        lower: 0.040,
        center: 0.060,
        higher: 0.080,
        interpretation:
          "dimensionless-Ca-like-rise-shape-and-kinetics-not-timing-only-or-calcium-concentration",
      },
      avpdDriver: {
        parameterPath: avpdDriverPath,
        unit: "kPa",
        lower: 24.75,
        center: 30.25,
        higher: 35.75,
        derivedLongitudinalToCircumferentialActiveStressMaxRatios:
          [0.45, 0.55, 0.65],
        fixedLvCircumferentialActiveStressMaxKPa: 55,
        interpretation:
          "active-stress-maximum-anisotropy-driver-not-realized-stress-ratio-or-prescribed-avpd-amplitude",
      },
    },
    cases: [center, fastLow, fastHigh, slowLow, slowHigh],
    interactionContrast: {
      formula:
        "(slow-high-minus-fast-high)-minus-(slow-low-minus-fast-low)",
      signConvention:
        "positive-means-rise-tau-effect-is-more-positive-at-higher-lv-longitudinal-active-stress-max-ratio",
      noClinicalMagnitudeThreshold: true,
      ...baseInteractionEvaluation.metrics,
      cToXContrastStatus: baseInteractionEvaluation.cToXContrastStatus,
      yDescentDepthMmHg: baseInteractionEvaluation.yDescentDepthMmHg,
      yDescentContrastStatus:
        baseInteractionEvaluation.yDescentContrastStatus,
      cornerRangeNormalizedMagnitude:
        baseInteractionEvaluation.cornerRangeNormalizedMagnitude,
      normalizedMagnitudePolicy:
        "absolute-contrast-divided-by-four-corner-range-null-if-range-not-positive",
    },
    discretizationRobustness: {
      role: "report-only-four-corner-interaction-discretization-check",
      physiologyGate: false,
      dtValuesSec: interactionDtValues,
      cases: interactionDtCases,
      signStableAcrossDt: {
        avPlaneCycleExcursionCm: signStable(interactionDtCases.map((row) =>
          row.contrast.avPlaneCycleExcursionCm
        )),
        mitralClosingMidpointToAorticFlowEndDisplacementCm:
          signStable(interactionDtCases.map((row) => row.contrast
            .mitralClosingMidpointToAorticFlowEndDisplacementCm
          )),
        mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec:
          signStable(interactionDtCases.map((row) => row.contrast
            .mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec
          )),
        pressurePeakVolumePositionFraction:
          signStable(interactionDtCases.map((row) =>
            row.contrast.pressurePeakVolumePositionFraction
          )),
        cToXDepthMmHg: signStable(interactionDtCases.map((row) =>
          row.contrast.cToXDepthMmHg
        )),
        cardiacOutputLPerMin: signStable(interactionDtCases.map((row) =>
          row.contrast.cardiacOutputLPerMin
        )),
      },
      coarseToFineAbsoluteDifference: {
        avPlaneCycleExcursionCm: Math.abs(
          coarseInteraction.avPlaneCycleExcursionCm -
          fineInteraction.avPlaneCycleExcursionCm,
        ),
        mitralClosingMidpointToAorticFlowEndDisplacementCm:
          nullableAbsoluteDifference(
            coarseInteraction
              .mitralClosingMidpointToAorticFlowEndDisplacementCm,
            fineInteraction
              .mitralClosingMidpointToAorticFlowEndDisplacementCm,
          ),
        mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec:
          nullableAbsoluteDifference(
            coarseInteraction
              .mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec,
            fineInteraction
              .mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec,
          ),
        pressurePeakVolumePositionFraction: nullableAbsoluteDifference(
          coarseInteraction.pressurePeakVolumePositionFraction,
          fineInteraction.pressurePeakVolumePositionFraction,
        ),
        cToXDepthMmHg: nullableAbsoluteDifference(
          coarseInteraction.cToXDepthMmHg,
          fineInteraction.cToXDepthMmHg,
        ),
        cardiacOutputLPerMin: Math.abs(
          coarseInteraction.cardiacOutputLPerMin -
          fineInteraction.cardiacOutputLPerMin,
        ),
      },
      yInteractionExcluded:
        "true-y-trough-contrast-not-measurable-when-any-corner-is-censored-or-fallback",
    },
    evidenceBoundary: {
      independentAvpdObservationRequiredForJointFitting: true,
      laPvLoopAloneIdentifiesBothFactors: false,
      sufficiencyForParameterIdentifiabilityEstablished: false,
      recommendedIndependentObservables: [
        "activation-timing-or-ECG-reference",
        "time-resolved-AVPD-or-mitral-annular-motion",
        "LA-volume",
        "LA-pressure-or-PAWP-waveform",
        "LV-pressure-and-volume-waveforms",
        "aortic-pressure-or-flow-waveform",
        "mitral-inflow-E-and-A",
        "pulmonary-venous-S-D-and-Ar-flow",
      ],
      sources: [
        {
          topic: "LA-relaxation-and-LV-base-descent-reservoir-components",
          citation: "Barbier et al. Circulation. 1999;100:427-436",
          url: "https://doi.org/10.1161/01.CIR.100.4.427",
        },
        {
          topic: "mitral-annular-motion-PV-flow-and-mitral-A-coupling",
          citation: "Keren et al. Circulation. 1988;78:621-629",
          url: "https://doi.org/10.1161/01.CIR.78.3.621",
        },
        {
          topic: "shared-AV-plane-piston-low-order-model",
          citation: "Maksuti et al. Med Eng Phys. 2015;37:87-92",
          url: "https://doi.org/10.1016/j.medengphy.2014.11.002",
        },
        {
          topic: "mitral-A-versus-PV-Ar-load-partition-under-LV-stiffness",
          citation:
            "Hobson et al. Am J Physiol Heart Circ Physiol. 2007;292:H1533-H1540",
          url: "https://doi.org/10.1152/ajpheart.00837.2006",
        },
      ],
    },
  };
}

function buildLvRelaxationPhenotypeScreen(
  referenceVariant: WorkConjugateAtrialAVPlaneVariantV1,
): WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeScreenV1 {
  if (
    referenceVariant.activationModel.kind !==
      "event-driven-ca-like-bounded-state"
  ) {
    throw new Error(
      "LV phenotype screen requires the event-driven LA activation reference",
    );
  }
  const cycleLengthSec = referenceVariant.profile.cycleLengthSec;
  const sampleIntervalSec = referenceVariant.profile.dtSec;
  const engineeringCenter =
    measurePeriodicContractileActivationPhenotypeV1(
      WORK_CONJUGATE_ATRIAL_AV_PLANE_LV_PHENOTYPE_SEED_PARAMS_V1,
      cycleLengthSec,
      sampleIntervalSec,
    );
  if (engineeringCenter === null) {
    throw new Error("LV phenotype engineering center must be measurable");
  }

  const legacyTargetPhenotype = coupledTraceLvPhenotype(
    referenceVariant.profile,
    referenceVariant.activationTiming.lvOnsetSec,
    0,
  );
  const legacyCalibration = calibrateEventDrivenActivationPhenotypeV1(
    legacyTargetPhenotype,
    WORK_CONJUGATE_ATRIAL_AV_PLANE_LV_PHENOTYPE_SEED_PARAMS_V1,
    {
      sampleIntervalSec,
      maxIterations: 48,
      normalizedResidualTolerance:
        LV_PHENOTYPE_NORMALIZED_RESIDUAL_TOLERANCE_V1,
    },
  );
  const doseFactors = [0.92, 1, 1.08] as const;
  const caseIds = [
    "lv-rt50-low",
    "lv-rt50-center",
    "lv-rt50-high",
  ] as const;
  const cases: WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1[] =
    doseFactors.map((rt50DoseFactor, index) => {
    const targetPhenotype: ContractileActivationPhenotypeV1 = {
      ...engineeringCenter.phenotype,
      relaxationTimeTo50Sec:
        rt50DoseFactor * engineeringCenter.phenotype.relaxationTimeTo50Sec,
    };
    const calibration = calibrateEventDrivenActivationPhenotypeV1(
      targetPhenotype,
      WORK_CONJUGATE_ATRIAL_AV_PLANE_LV_PHENOTYPE_SEED_PARAMS_V1,
      {
        sampleIntervalSec,
        normalizedResidualTolerance:
          LV_PHENOTYPE_NORMALIZED_RESIDUAL_TOLERANCE_V1,
      },
    );
    const base = {
      caseId: caseIds[index]!,
      rt50DoseFactor,
      targetPhenotype,
      calibration,
      configurationAudit: {
        prescribedLvContractileStateOwner:
          "upstream-event-driven-contractile-state" as const,
        laActivationFixed: true as const,
        lvEventReferenceFixed: true as const,
        lvEffectiveOnsetFixed: true as const,
        lvTimeToPeakTargetFixed: true as const,
        lvPeakExcursionTargetFixed: true as const,
        lvExcursionIntegralTargetFixed: true as const,
        allNonRt50PhenotypeTargetsIdentical:
          samePhenotypeExceptRt50(targetPhenotype, engineeringCenter.phenotype),
        rawInternalParametersArePrivateMapperCoordinates: true as const,
        lvWallFixed: true as const,
        valveAndCircuitParametersFixed: true as const,
        avPlaneTrajectoryPrescribed: false as const,
        bloodVolumeLedgerUnchanged: true as const,
        nonlinearUnknownCount: 10 as const,
        noRuntimeOrDefaultWiring: true as const,
      },
    };
    if (calibration.internalParams === null) {
      return {
        ...base,
        installationStatus: "not-installed-mapping-failed" as const,
        numerics: null,
        readback: null,
        valvePhaseEvents: null,
        trace: [],
      };
    }
    const profile = runWorkConjugateAtrialAVPlaneProfileV1({
      profileId: `${caseIds[index]}-hr75`,
      variantId: "event-driven-atrial-activation-ablation",
      params: referenceVariant.params,
      activationTiming: referenceVariant.activationTiming,
      activationModel: referenceVariant.activationModel,
      lvActivationModel: eventActivationModelFromParams(
        calibration.internalParams,
      ),
    });
    return lvRelaxationPhenotypeCaseFromProfile(
      base,
      profile,
      referenceVariant.activationTiming.lvOnsetSec,
    );
    });
  const discretizationRobustness =
    buildLvRelaxationPhenotypeDiscretizationRobustness(
      cases,
      referenceVariant,
    );
  const installedCases = cases.filter((row) => row.readback !== null);
  const anyInteriorY = installedCases.some((row) =>
    row.readback!.yDescentMeasurementStatus === "interior-trough"
  );
  const anySeparatedEa = installedCases.some((row) =>
    row.readback!.mitralFusionClass === "separated"
  );
  const anyPartialEaFusion = installedCases.some((row) =>
    row.readback!.mitralFusionClass === "partial-fusion"
  );
  return {
    role: "report-only-fixed-dose-lv-contractile-rt50-screen",
    design: "one-factor-three-dose-phenotype-manifold",
    physiologyHardGated: false,
    clinicalFit: false,
    baselineVariantId: "event-driven-atrial-activation-ablation",
    phenotypeContract: {
      finalBoundedStateMeasured: true,
      baselineDefinition: "periodic-pre-event",
      targetHeldFixed: [
        "effective-onset-delay",
        "time-from-event-to-peak",
        "peak-excursion",
        "excursion-integral",
      ],
      targetVaried: "relaxation-time-to-50",
      doseFactors: [0.92, 1, 1.08],
      doseBasis:
        "local-engineering-screen-within-mapper-convergence-not-clinical-bounds",
      coupledTargetNormalizedResidualTolerance:
        LV_PHENOTYPE_NORMALIZED_RESIDUAL_TOLERANCE_V1,
      runtimeFutureLookingNormalization: false,
    },
    legacyLvSubstitutionAudit: {
      source: "current-rectangular-target-plus-first-order-lv-state",
      targetPhenotype: legacyTargetPhenotype,
      calibration: legacyCalibration,
      eventDrivenReplacementInstalled: false,
      reason:
        "this-seed-bounds-local-solve-did-not-converge-no-model-family-impossibility-claim",
    },
    engineeringCenter: {
      source:
        "explicit-event-driven-lv-seed-not-normal-human-prior-or-legacy-equivalent",
      readback: engineeringCenter,
    },
    cases,
    discretizationRobustness,
    result: {
      allMappingsInstallable: cases.every((row) =>
        row.installationStatus === "installed-for-report-only-screen"
      ),
      allCasesPassMechanicalHardGates: installedCases.length === cases.length &&
        installedCases.every((row) => row.numerics!.allHardGatesPass),
      anyInteriorY,
      anySeparatedEa,
      anyPartialEaFusion,
      verdict: anyInteriorY || anySeparatedEa
        ? "local-fixed-dose-produces-interior-y-or-ea-separation-diagnostic-only"
        : "local-fixed-dose-does-not-resolve-interior-y-or-ea-separation",
    },
    falsificationPolicy: {
      abandonSimpleLvRt50AsSufficientMechanismIf:
        "data-constrained-rt50-range-preserves-censoring-and-fusion-with-correct-pressure-flow-events",
      doNotAbandonLvRelaxationFromThisLocalScreenAlone: true,
      nextExperiment:
        "fixed-dose-la-ttp-and-la-rt50-after-lv-reference-is-calibrated-to-independent-lv-pressure-and-flow-data",
    },
  };
}

function buildLvRelaxationPhenotypeDiscretizationRobustness(
  cases: readonly WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1[],
  referenceVariant: WorkConjugateAtrialAVPlaneVariantV1,
): WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeScreenV1["discretizationRobustness"] {
  const dtValuesSec = [0.001, 0.0005, 0.00025] as const;
  const evaluated = dtValuesSec.map((dtSec) => {
    const evaluatedRows = cases.map((row) => {
      if (
        dtSec === DEFAULT_DT_SEC && row.readback !== null &&
        row.numerics !== null
      ) {
        return {
          row: lvRelaxationDtRowFromReadback(
            row.caseId,
            row.readback,
            row.valvePhaseEvents!,
          ),
          finite: row.numerics.allFinite,
          periodic: row.numerics.periodicSteadyState,
          hardGatesPass: row.numerics.allHardGatesPass,
        };
      }
      if (row.calibration.internalParams === null) {
        return {
          row: lvRelaxationNullDtRow(row.caseId),
          finite: false,
          periodic: false,
          hardGatesPass: false,
        };
      }
      const profile = runWorkConjugateAtrialAVPlaneProfileV1({
        profileId: `${row.caseId}-hr75-dt-${dtSec}`,
        variantId: "event-driven-atrial-activation-ablation",
        params: referenceVariant.params,
        activationTiming: referenceVariant.activationTiming,
        activationModel: referenceVariant.activationModel,
        lvActivationModel: eventActivationModelFromParams(
          row.calibration.internalParams,
        ),
        dtSec,
      });
      const hardGates = evaluateHardGates(profile);
      const aorticClosingTimeSec = measurableValveEventTime(
        profile.valvePhaseEvents.aortic.closing,
      );
      const mitralOpeningTimeSec = measurableValveEventTime(
        profile.valvePhaseEvents.mitral.opening,
      );
      const intervalSec = aorticClosingTimeSec !== null &&
          mitralOpeningTimeSec !== null
        ? forwardCycleElapsedSec(
          aorticClosingTimeSec / profile.cycleLengthSec,
          mitralOpeningTimeSec / profile.cycleLengthSec,
          profile.cycleLengthSec,
        )
        : null;
      const phenotype = profile.samples.length >= 2
        ? coupledTraceLvPhenotype(
          profile,
          referenceVariant.activationTiming.lvOnsetSec,
          row.targetPhenotype.effectiveOnsetDelaySec,
        )
        : null;
      const coupledResiduals = phenotype === null
        ? null
        : buildContractileActivationPhenotypeResidualsV1(
          phenotype,
          row.targetPhenotype,
          profile.dtSec,
        );
      return {
        row: {
          caseId: row.caseId,
          realizedLvTimeFromEventToPeakSec:
            phenotype?.timeFromEventToPeakSec ?? null,
          realizedLvRt50Sec: phenotype?.relaxationTimeTo50Sec ?? null,
          realizedLvPeakExcursion01: phenotype?.peakExcursion01 ?? null,
          realizedLvExcursionIntegralSec:
            phenotype?.excursionIntegralSec ?? null,
          coupledTargetNormalizedMaximumAbsolute:
            coupledResiduals?.normalizedMaximumAbsolute ?? null,
          aorticPressureFlowClosingStatus:
            profile.valvePhaseEvents.aortic.closing.status,
          aorticPressureFlowClosingReason:
            profile.valvePhaseEvents.aortic.closing.reason,
          mitralPressureFlowOpeningStatus:
            profile.valvePhaseEvents.mitral.opening.status,
          mitralPressureFlowOpeningReason:
            profile.valvePhaseEvents.mitral.opening.reason,
          pressureFlowIntervalMeasurable: intervalSec !== null,
          aorticClosingToMitralOpeningSec: intervalSec,
          mitralFusionClass: profile.mitral.fusionClass,
          yDescentMeasurementStatus:
            profile.xvyPressureReadback.yDescentMeasurementStatus,
          yDescentDepthMmHg: profile.xvyPressureReadback.yDescentDepthMmHg,
          pressurePeakVolumePositionFraction:
            profile.activationReadback.pressurePeakVolumePosition
              .fractionFromMinimumToEventVolume,
          cardiacOutputLPerMin: profile.cardiacOutputLPerMin,
        },
        finite: profile.allFinite,
        periodic: profile.periodicSteadyState,
        hardGatesPass: hardGates.allHardGatesPass,
      };
    });
    return {
      dtSec,
      allRowsFinite: evaluatedRows.every((item) => item.finite),
      allRowsPeriodicSteadyState:
        evaluatedRows.every((item) => item.periodic),
      allRowsHardGatesPass:
        evaluatedRows.every((item) => item.hardGatesPass),
      rows: evaluatedRows.map((item) => item.row),
    };
  });
  const coarse = evaluated[0]!.rows;
  const fine = evaluated[2]!.rows;
  const nullableMaximumDifference = (
    valueOf: (row: (typeof coarse)[number]) => number | null,
  ): number | null => {
    const differences = coarse.map((row, index) => {
      const a = valueOf(row);
      const b = valueOf(fine[index]!);
      return a === null || b === null ? null : Math.abs(a - b);
    });
    return differences.some((value) => value === null)
      ? null
      : maxOf(differences as number[]);
  };
  const classificationStable = <T>(
    valueOf: (
      row: WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeScreenV1[
        "discretizationRobustness"
      ]["cases"][number]["rows"][number],
    ) => T | null,
  ): boolean => cases.every((_, caseIndex) => {
    const values = evaluated.map((dtRow) => valueOf(dtRow.rows[caseIndex]!));
    return values.every((value) => value !== null) &&
      new Set(values).size === 1;
  });
  return {
    role: "report-only-fixed-raw-parameter-lv-phenotype-dt-check",
    physiologyGate: false,
    eventGridPhaseRobustnessEvaluated: false,
    limitation:
      "dt-grids-share-the-same-event-alignment-no-half-step-phase-shift-test",
    dtValuesSec: [0.001, 0.0005, 0.00025],
    cases: evaluated,
    classificationStableAcrossDt: {
      pressureFlowIntervalMeasurable: classificationStable((row) =>
        row.pressureFlowIntervalMeasurable
      ),
      mitralFusionClass: classificationStable((row) =>
        row.mitralFusionClass
      ),
      yDescentMeasurementStatus: classificationStable((row) =>
        row.yDescentMeasurementStatus
      ),
    },
    coarseToFineMaximumAbsoluteDifferenceAcrossDoses: {
      realizedLvTimeFromEventToPeakSec: nullableMaximumDifference((row) =>
        row.realizedLvTimeFromEventToPeakSec
      ),
      realizedLvRt50Sec: nullableMaximumDifference((row) =>
        row.realizedLvRt50Sec
      ),
      realizedLvPeakExcursion01: nullableMaximumDifference((row) =>
        row.realizedLvPeakExcursion01
      ),
      realizedLvExcursionIntegralSec: nullableMaximumDifference((row) =>
        row.realizedLvExcursionIntegralSec
      ),
      coupledTargetNormalizedMaximumAbsolute: nullableMaximumDifference(
        (row) => row.coupledTargetNormalizedMaximumAbsolute,
      ),
      aorticClosingToMitralOpeningSec: nullableMaximumDifference((row) =>
        row.aorticClosingToMitralOpeningSec
      ),
      yDescentDepthMmHg: nullableMaximumDifference((row) =>
        row.yDescentDepthMmHg
      ),
      pressurePeakVolumePositionFraction: nullableMaximumDifference((row) =>
        row.pressurePeakVolumePositionFraction
      ),
      cardiacOutputLPerMin: nullableMaximumDifference((row) =>
        row.cardiacOutputLPerMin
      ),
    },
  };
}

function lvRelaxationDtRowFromReadback(
  caseId: WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1["caseId"],
  readback: NonNullable<
    WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1["readback"]
  >,
  valvePhaseEvents: NonNullable<
    WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1["valvePhaseEvents"]
  >,
): WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeScreenV1[
  "discretizationRobustness"
]["cases"][number]["rows"][number] {
  return {
    caseId,
    realizedLvTimeFromEventToPeakSec:
      readback.realizedLvPhenotypeFromCoupledTrace.timeFromEventToPeakSec,
    realizedLvRt50Sec:
      readback.realizedLvPhenotypeFromCoupledTrace.relaxationTimeTo50Sec,
    realizedLvPeakExcursion01:
      readback.realizedLvPhenotypeFromCoupledTrace.peakExcursion01,
    realizedLvExcursionIntegralSec:
      readback.realizedLvPhenotypeFromCoupledTrace.excursionIntegralSec,
    coupledTargetNormalizedMaximumAbsolute:
      readback.coupledTargetResiduals.normalizedMaximumAbsolute,
    aorticPressureFlowClosingStatus:
      valvePhaseEvents.aortic.closing.status,
    aorticPressureFlowClosingReason:
      valvePhaseEvents.aortic.closing.reason,
    mitralPressureFlowOpeningStatus:
      valvePhaseEvents.mitral.opening.status,
    mitralPressureFlowOpeningReason:
      valvePhaseEvents.mitral.opening.reason,
    pressureFlowIntervalMeasurable:
      readback.aorticClosingToMitralOpeningSec !== null,
    aorticClosingToMitralOpeningSec:
      readback.aorticClosingToMitralOpeningSec,
    mitralFusionClass: readback.mitralFusionClass,
    yDescentMeasurementStatus: readback.yDescentMeasurementStatus,
    yDescentDepthMmHg: readback.yDescentDepthMmHg,
    pressurePeakVolumePositionFraction:
      readback.pressurePeakVolumePositionFraction,
    cardiacOutputLPerMin: readback.cardiacOutputLPerMin,
  };
}

function lvRelaxationNullDtRow(
  caseId: WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1["caseId"],
): WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeScreenV1[
  "discretizationRobustness"
]["cases"][number]["rows"][number] {
  return {
    caseId,
    realizedLvTimeFromEventToPeakSec: null,
    realizedLvRt50Sec: null,
    realizedLvPeakExcursion01: null,
    realizedLvExcursionIntegralSec: null,
    coupledTargetNormalizedMaximumAbsolute: null,
    aorticPressureFlowClosingStatus: null,
    aorticPressureFlowClosingReason: null,
    mitralPressureFlowOpeningStatus: null,
    mitralPressureFlowOpeningReason: null,
    pressureFlowIntervalMeasurable: false,
    aorticClosingToMitralOpeningSec: null,
    mitralFusionClass: null,
    yDescentMeasurementStatus: null,
    yDescentDepthMmHg: null,
    pressurePeakVolumePositionFraction: null,
    cardiacOutputLPerMin: null,
  };
}

function lvRelaxationPhenotypeCaseFromProfile(
  base: Pick<
    WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1,
    "caseId" | "rt50DoseFactor" | "targetPhenotype" | "calibration" |
      "configurationAudit"
  >,
  profile: WorkConjugateAtrialAVPlaneProfileV1,
  lvEventTimeSec: number,
): WorkConjugateAtrialAVPlaneLvRelaxationPhenotypeCaseV1 {
  const aorticClosingEvent = measurableValveEventCandidate(
    profile.valvePhaseEvents.aortic.closing,
  );
  const mitralOpeningEvent = measurableValveEventCandidate(
    profile.valvePhaseEvents.mitral.opening,
  );
  const aorticClosingTimeSec = aorticClosingEvent?.eventTimeSec ?? null;
  const mitralOpeningTimeSec = mitralOpeningEvent?.eventTimeSec ?? null;
  const pressureFlowIntervalSec =
    aorticClosingTimeSec !== null && mitralOpeningTimeSec !== null
      ? forwardCycleElapsedSec(
        aorticClosingTimeSec / profile.cycleLengthSec,
        mitralOpeningTimeSec / profile.cycleLengthSec,
        profile.cycleLengthSec,
      )
      : null;
  const pressureFlowIntervalUncertainty =
    aorticClosingEvent !== null && mitralOpeningEvent !== null
      ? forwardValveEventIntervalBounds(
        aorticClosingEvent,
        mitralOpeningEvent,
        profile.cycleLengthSec,
      )
      : null;
  const aorticConductanceClosings =
    profile.valvePhaseEvents.aortic.conductanceMidpoint.fallingCrossings;
  const mitralConductanceOpenings =
    profile.valvePhaseEvents.mitral.conductanceMidpoint.risingCrossings;
  const aorticConductanceClosingTimeSec =
    aorticConductanceClosings.length === 1
      ? aorticConductanceClosings[0]!.timeSec
      : null;
  const mitralConductanceOpeningTimeSec =
    mitralConductanceOpenings.length === 1
      ? mitralConductanceOpenings[0]!.timeSec
      : null;
  const conductanceIntervalSec =
    aorticConductanceClosingTimeSec !== null &&
      mitralConductanceOpeningTimeSec !== null &&
      mitralConductanceOpeningTimeSec >= aorticConductanceClosingTimeSec
      ? mitralConductanceOpeningTimeSec - aorticConductanceClosingTimeSec
      : null;
  const periodicIntegral = (
    valueOf: (sample: WorkConjugateAtrialAVPlaneSampleV1) => number,
  ): number => {
    if (profile.samples.length === 0) return 0;
    let previous = profile.samples.at(-1)!;
    let integral = 0;
    for (const sample of profile.samples) {
      integral += 0.5 * (valueOf(previous) + valueOf(sample)) * profile.dtSec;
      previous = sample;
    }
    return integral;
  };
  const hardGates = evaluateHardGates(profile);
  const realizedLvPhenotypeFromCoupledTrace = coupledTraceLvPhenotype(
    profile,
    lvEventTimeSec,
    base.targetPhenotype.effectiveOnsetDelaySec,
  );
  const coupledTargetResiduals =
    buildContractileActivationPhenotypeResidualsV1(
      realizedLvPhenotypeFromCoupledTrace,
      base.targetPhenotype,
      profile.dtSec,
    );
  const coupledTargetWithinTolerance =
    coupledTargetResiduals.normalizedMaximumAbsolute <=
      LV_PHENOTYPE_NORMALIZED_RESIDUAL_TOLERANCE_V1;
  return {
    ...base,
    installationStatus: coupledTargetWithinTolerance
      ? "installed-for-report-only-screen"
      : "rejected-coupled-target-mismatch",
    numerics: {
      allFinite: profile.allFinite,
      allStepsConverged: profile.allStepsConverged,
      allAcceptedSteps: profile.allAcceptedSteps,
      periodicSteadyState: profile.periodicSteadyState,
      allHardGatesPass: hardGates.allHardGatesPass,
    },
    readback: {
      realizedLvPhenotypeFromCoupledTrace,
      coupledTargetResiduals,
      coupledTargetWithinTolerance,
      lvActivationPeak01: maxOf(profile.samples.map((sample) =>
        sample.lvActivation01
      )),
      lvActivationAtAorticPressureFlowClosing01:
        aorticClosingTimeSec === null
          ? null
          : interpolatedSampleValueAtTheta(
            profile.samples,
            aorticClosingTimeSec / profile.cycleLengthSec,
            (sample) => sample.lvActivation01,
          ),
      lvActivationAtMitralPressureFlowOpening01:
        mitralOpeningTimeSec === null
          ? null
          : interpolatedSampleValueAtTheta(
            profile.samples,
            mitralOpeningTimeSec / profile.cycleLengthSec,
            (sample) => sample.lvActivation01,
          ),
      aorticPressureFlowClosingTimeSec: aorticClosingTimeSec,
      mitralPressureFlowOpeningTimeSec: mitralOpeningTimeSec,
      aorticClosingToMitralOpeningSec: pressureFlowIntervalSec,
      aorticClosingToMitralOpeningUncertaintyIntervalSec:
        pressureFlowIntervalUncertainty,
      aorticClosingToMitralOpeningStatus: pressureFlowIntervalSec === null
        ? "not-measurable"
        : "measurable-pressure-flow-contract",
      aorticConductanceClosingToMitralConductanceOpeningSec:
        conductanceIntervalSec,
      pressureFlowTimingIsAnatomicalValveClaim: false,
      pressureFlowTimingIsClinicalIvrtClaim: false,
      conductanceTimingIsAnatomicalValveClaim: false,
      mitralFusionClass: profile.mitral.fusionClass,
      eaPeakSeparationSec: profile.mitral.eaPeakSeparationSec,
      diastasisDurationSec: profile.mitral.diastasisDurationSec,
      flowAtAtrialEventToEPeakRatio: profile.mitral.ePeakFlowMlPerSec > 0
        ? profile.mitral.flowAtAtrialActivationOnsetMlPerSec /
          profile.mitral.ePeakFlowMlPerSec
        : null,
      yDescentMeasurementStatus:
        profile.xvyPressureReadback.yDescentMeasurementStatus,
      yDescentDepthMmHg: profile.xvyPressureReadback.yDescentDepthMmHg,
      yToAtrialEventMarginSec:
        profile.xvyPressureReadback.yToAtrialEventMarginSec,
      xDescentDepthMmHg: profile.xvyPressureReadback.xDescentDepthMmHg,
      pressurePeakVolumePositionFraction:
        profile.activationReadback.pressurePeakVolumePosition
          .fractionFromMinimumToEventVolume,
      avPlaneCycleExcursionCm: profile.zRangeCm[1] - profile.zRangeCm[0],
      avPlaneCyclePeakAbsVelocityCmPerSec: Math.max(
        Math.abs(profile.uRangeCmPerSec[0]),
        Math.abs(profile.uRangeCmPerSec[1]),
      ),
      lvActiveZWorkSignedJ: periodicIntegral((sample) =>
        sample.lvZForceN.active * sample.avPlaneVelocityCmPerSec * 0.01
      ),
      lvActiveZWorkAbsoluteJ: periodicIntegral((sample) =>
        Math.abs(
          sample.lvZForceN.active * sample.avPlaneVelocityCmPerSec * 0.01,
        )
      ),
      cardiacOutputLPerMin: profile.cardiacOutputLPerMin,
      lvPressureRangeMmHg: profile.pressureRangeLvMmHg,
      laPressureRangeMmHg: profile.pressureRangeLaMmHg,
      laPvLobeStatus: profile.laPvLobes.status,
      laPvLobeReason: profile.laPvLobes.reason,
    },
    valvePhaseEvents: profile.valvePhaseEvents,
    trace: profile.samples
      .filter((_, index) =>
        index === 0 ||
        index === profile.samples.length - 1 ||
        index % 4 === 0
      )
      .map((sample) => ({
        theta: sample.theta,
        laVolumeMl: sample.laVolumeMl,
        laPressureMmHg: sample.laPressureMmHg,
        lvPressureMmHg: sample.lvPressureMmHg,
        qMitralMlPerSec: sample.qMitralMlPerSec,
        qAorticMlPerSec: sample.qAorticMlPerSec,
        laActivation01: sample.laActivation01,
        lvActivation01: sample.lvActivation01,
        avPlanePositionCm: sample.avPlanePositionCm,
        avPlaneVelocityCmPerSec: sample.avPlaneVelocityCmPerSec,
      })),
  };
}

function coupledTraceLvPhenotype(
  profile: WorkConjugateAtrialAVPlaneProfileV1,
  eventTimeSec: number,
  effectiveOnsetDelaySec: number,
): ContractileActivationPhenotypeV1 {
  const samples = Array.from(
    { length: profile.stepsPerBeat + 1 },
    (_, index) => ({
      timeSec: eventTimeSec + index * profile.dtSec,
      activation01: periodicProfileValueAtTimeSec(
        profile,
        eventTimeSec + index * profile.dtSec,
        (sample) => sample.lvActivation01,
      ),
    }),
  );
  const readback = measurePeriodicContractileActivationPhenotypeFromSamplesV1(
    samples,
    {
      eventTimeSec,
      eventReference: "prescribed-effective-sidecar-event",
      effectiveOnsetDelaySec,
      referenceCycleLengthSec: profile.cycleLengthSec,
    },
  );
  if (readback === null) {
    throw new Error(
      "LV activation trace must have an interior peak and falling RT50 within the event-centered cycle",
    );
  }
  return readback.phenotype;
}

function periodicProfileValueAtTimeSec(
  profile: WorkConjugateAtrialAVPlaneProfileV1,
  timeSec: number,
  valueOf: (sample: WorkConjugateAtrialAVPlaneSampleV1) => number,
): number {
  const samples = profile.samples;
  if (samples.length === 0) return valueOf(emptySample());
  const wrappedSec = ((timeSec % profile.cycleLengthSec) +
    profile.cycleLengthSec) % profile.cycleLengthSec;
  const seamToleranceSec = 32 * Number.EPSILON * Math.max(
    1,
    Math.abs(timeSec),
    profile.cycleLengthSec,
  );
  if (wrappedSec <= seamToleranceSec) return valueOf(samples.at(-1)!);
  const first = samples[0]!;
  if (wrappedSec <= first.tSec) {
    return linearInterpolate(
      valueOf(samples.at(-1)!),
      valueOf(first),
      wrappedSec / first.tSec,
    );
  }
  for (let index = 1; index < samples.length; index += 1) {
    const current = samples[index]!;
    if (current.tSec < wrappedSec) continue;
    const previous = samples[index - 1]!;
    return linearInterpolate(
      valueOf(previous),
      valueOf(current),
      (wrappedSec - previous.tSec) / (current.tSec - previous.tSec),
    );
  }
  return valueOf(samples.at(-1)!);
}

function eventActivationModelFromParams(
  params: EventDrivenContractileActivationParamsV1,
): WorkConjugateAtrialAVPlaneContractileActivationModelV1 {
  return {
    kind: "event-driven-ca-like-bounded-state",
    eventReference: "prescribed-effective-sidecar-event",
    stateOwner: "upstream-event-driven-contractile-state",
    params: {
      electricalToCalciumDelaySec: params.electricalToCalciumDelaySec,
      calciumKernel: params.calciumKernel,
      contractileKinetics: params.contractileKinetics,
    },
    fixedHillMapping: FIXED_CONTRACTILE_HILL_MAPPING_V1,
    eventHistory: {
      kind: "finite-periodic-history-no-beat-reset",
      decayTauMultiples: EVENT_HISTORY_DECAY_TAU_MULTIPLES_V1,
      riseTauMultiples: EVENT_HISTORY_RISE_TAU_MULTIPLES_V1,
    },
    activeStressAmplitudeOwner: "existing-work-conjugate-wall",
    fitPolicy:
      "fit-effective-onset-amplitude-relaxation-before-extra-shape-parameters",
    claim: "dimensionless-ca-like-driver-not-calcium-concentration",
  };
}

function samePhenotypeExceptRt50(
  candidate: ContractileActivationPhenotypeV1,
  reference: ContractileActivationPhenotypeV1,
): boolean {
  return candidate.eventReference === reference.eventReference &&
    candidate.effectiveOnsetDelaySec === reference.effectiveOnsetDelaySec &&
    candidate.timeFromEventToPeakSec === reference.timeFromEventToPeakSec &&
    candidate.peakExcursion01 === reference.peakExcursion01 &&
    candidate.excursionIntegralSec === reference.excursionIntegralSec &&
    candidate.referenceCycleLengthSec === reference.referenceCycleLengthSec &&
    candidate.baselineDefinition === reference.baselineDefinition;
}

function measurableValveEventTime(
  event: ValvePhaseEventContractV1["opening"] |
    ValvePhaseEventContractV1["closing"],
): number | null {
  return event.status === "measurable" ? event.event.eventTimeSec : null;
}

function measurableValveEventCandidate(
  event: ValvePhaseEventContractV1["opening"] |
    ValvePhaseEventContractV1["closing"],
): ValvePhaseEventCandidateV1 | null {
  return event.status === "measurable" ? event.event : null;
}

function forwardValveEventIntervalBounds(
  from: ValvePhaseEventCandidateV1,
  to: ValvePhaseEventCandidateV1,
  cycleLengthSec: number,
): { readonly lowerBoundSec: number; readonly upperBoundSec: number } {
  const wrapOffsetSec = to.eventTimeSec < from.eventTimeSec
    ? cycleLengthSec
    : 0;
  return {
    lowerBoundSec: Math.max(
      0,
      to.eventTimeUncertaintyIntervalSec.lowerBoundSec + wrapOffsetSec -
        from.eventTimeUncertaintyIntervalSec.upperBoundSec,
    ),
    upperBoundSec:
      to.eventTimeUncertaintyIntervalSec.upperBoundSec + wrapOffsetSec -
      from.eventTimeUncertaintyIntervalSec.lowerBoundSec,
  };
}

function activationAvpdInteractionCaseFromProfile(
  profile: WorkConjugateAtrialAVPlaneProfileV1,
  metadata: Pick<
    WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1,
    | "caseId"
    | "position"
    | "activationCalciumRiseTauSec"
    | "lvLongitudinalToCircumferentialActiveStressMaxRatio"
    | "lvLongitudinalActiveStressMaxKPa"
    | "changedParameterPaths"
  >,
  context: {
    readonly referenceConfiguration: PhaseAttributionConfigurationV1;
    readonly caseConfiguration: PhaseAttributionConfigurationV1;
  },
): WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1 {
  const xvy = profile.xvyPressureReadback;
  const systolicStartTheta = xvy.mitralClosingConductanceMidpointTheta;
  const systolicEndTheta = xvy.aorticForwardFlowEndTheta;
  const systolicDisplacementMeasurementValid =
    xvy.mitralClosingConductanceMidpointStatus === "threshold-crossing" &&
    xvy.aorticForwardFlowEndStatus === "linear-zero-crossing" &&
    systolicStartTheta < systolicEndTheta;
  const systolicSamples = systolicDisplacementMeasurementValid
    ? profile.samples.filter((sample) =>
      sample.theta >= systolicStartTheta && sample.theta <= systolicEndTheta
    )
    : [];
  const avPlaneAtSystolicStartCm = interpolatedSampleValueAtTheta(
    profile.samples,
    systolicStartTheta,
    (sample) => sample.avPlanePositionCm,
  );
  const avPlaneAtSystolicEndCm = interpolatedSampleValueAtTheta(
    profile.samples,
    systolicEndTheta,
    (sample) => sample.avPlanePositionCm,
  );
  const periodicIntegral = (
    valueOf: (sample: WorkConjugateAtrialAVPlaneSampleV1) => number,
  ): number => {
    if (profile.samples.length === 0) return 0;
    let previous = profile.samples[profile.samples.length - 1]!;
    let integral = 0;
    for (const sample of profile.samples) {
      integral += 0.5 * (valueOf(previous) + valueOf(sample)) * profile.dtSec;
      previous = sample;
    }
    return integral;
  };
  const lvCircumferentialActivePeakIndex = maxIndex(
    profile.samples.map((sample) =>
      sample.lvStressKPa.circumferential.active
    ),
  );
  const lvActiveStressPeakSample =
    profile.samples[lvCircumferentialActivePeakIndex] ?? emptySample();
  const lvCircumferentialActiveStressAtPeakKPa =
    lvActiveStressPeakSample.lvStressKPa.circumferential.active;
  const lvLongitudinalActiveStressAtCircumferentialPeakKPa =
    lvActiveStressPeakSample.lvStressKPa.longitudinal.active;
  const differingLeafPaths = differingConfigurationLeafPaths(
    context.referenceConfiguration,
    context.caseConfiguration,
  );
  const hardGates = evaluateHardGates(profile);
  return {
    ...metadata,
    configurationAudit: {
      differingLeafPaths,
      exactDeclaredPathMatch:
        arraysEqual(differingLeafPaths, metadata.changedParameterPaths),
      activationModelFamilyUnchanged: true,
      lvCircumferentialActiveStressMaxKPa: 55,
      lvLongitudinalActiveStressMaxIsDeclaredAvpdDriver: true,
      allOtherWallParametersUnchanged: true,
      avPlaneCoordinateEquationUnchanged: true,
      avPlaneTrajectoryPrescribed: false,
      explicitActivationTimesAvPlaneCrossTerm: false,
      bloodVolumeLedgerUnchanged: true,
      nonlinearUnknownCount: 10,
      noRuntimeOrDefaultWiring: true,
    },
    numerics: {
      allFinite: profile.allFinite,
      allStepsConverged: profile.allStepsConverged,
      allAcceptedSteps: profile.allAcceptedSteps,
      periodicSteadyState: profile.periodicSteadyState,
      allHardGatesPass: hardGates.allHardGatesPass,
    },
    readback: {
      laEventToContractilePeakSec:
        profile.activationReadback.laEventToContractilePeakSec,
      laContractileRt50Sec:
        profile.activationReadback.laContractileRt50Sec,
      laContractilePeak01:
        profile.activationReadback.laContractilePeak01,
      laContractileStateTimeIntegralSec: periodicIntegral((sample) =>
        sample.laActivation01
      ),
      laActiveZWorkSignedJ: periodicIntegral((sample) =>
        sample.laZForceN.active * sample.avPlaneVelocityCmPerSec * 0.01
      ),
      laActiveZWorkAbsoluteJ: periodicIntegral((sample) =>
        Math.abs(
          sample.laZForceN.active * sample.avPlaneVelocityCmPerSec * 0.01,
        )
      ),
      lvRealizedActiveStressAtCircumferentialPeak: {
        circumferentialKPa: lvCircumferentialActiveStressAtPeakKPa,
        longitudinalKPa:
          lvLongitudinalActiveStressAtCircumferentialPeakKPa,
        longitudinalToCircumferentialRatio:
          Math.abs(lvCircumferentialActiveStressAtPeakKPa) > 1e-12
            ? lvLongitudinalActiveStressAtCircumferentialPeakKPa /
              lvCircumferentialActiveStressAtPeakKPa
            : null,
      },
      lvActiveZForcePeakAbsN: maxOf(profile.samples.map((sample) =>
        Math.abs(sample.lvZForceN.active)
      )),
      lvActiveZWorkSignedJ: periodicIntegral((sample) =>
        sample.lvZForceN.active * sample.avPlaneVelocityCmPerSec * 0.01
      ),
      lvActiveZWorkAbsoluteJ: periodicIntegral((sample) =>
        Math.abs(
          sample.lvZForceN.active * sample.avPlaneVelocityCmPerSec * 0.01,
        )
      ),
      avPlaneCycleExcursionCm: profile.zRangeCm[1] - profile.zRangeCm[0],
      avPlaneCyclePeakAbsVelocityCmPerSec: Math.max(
        Math.abs(profile.uRangeCmPerSec[0]),
        Math.abs(profile.uRangeCmPerSec[1]),
      ),
      mitralClosingMidpointToAorticFlowEndDisplacementCm:
        systolicDisplacementMeasurementValid
          ? avPlaneAtSystolicEndCm - avPlaneAtSystolicStartCm
          : null,
      mitralClosingMidpointToAorticFlowEndMeasurementValid:
        systolicDisplacementMeasurementValid,
      mitralClosingMidpointToAorticFlowEndPeakApexwardVelocityCmPerSec:
        systolicDisplacementMeasurementValid && systolicSamples.length > 0
          ? maxOf(systolicSamples.map((sample) =>
            sample.avPlaneVelocityCmPerSec
          ))
          : null,
      pressurePeakVolumePositionFraction:
        profile.activationReadback.pressurePeakVolumePosition
          .fractionFromMinimumToEventVolume,
      cWaveCandidateStatus: xvy.cWaveCandidate.status,
      cToXDepthMmHg: xvy.cWaveCandidate.cToXDepthMmHg,
      yDescentDepthMmHg: xvy.yDescentDepthMmHg,
      yDescentMeasurementStatus: xvy.yDescentMeasurementStatus,
      mitralFusionClass: profile.mitral.fusionClass,
      pulmonaryVenousAtrialReversalStatus:
        profile.activationReadback.pulmonaryVenousAtrialReversal.status,
      pulmonaryVenousAtrialWindowNadirMlPerSec:
        profile.activationReadback.pulmonaryVenousAtrialReversal
          .nadirFlowMlPerSec,
      laPvLobeStatus: profile.laPvLobes.status,
      laPvLobeReason: profile.laPvLobes.reason,
      laPvRawSelfIntersectionCount:
        profile.laPvLobes.rawSelfIntersectionCount,
      aLoopAreaMmHgMl: profile.laPvLobes.aLoopAreaMmHgMl,
      vLoopAreaMmHgMl: profile.laPvLobes.vLoopAreaMmHgMl,
      aToVAreaRatio: profile.laPvLobes.aToVAreaRatio,
      figureEightCrossingPhase:
        profile.pathOrdering.figureEightCrossingPhase,
      conduitBeforeCrossingBelowReservoirPathFraction:
        profile.pathOrdering.conduitBeforeCrossingBelowReservoirPathFraction,
      pumpingAfterCrossingAboveReservoirPathFraction:
        profile.pathOrdering.pumpingAfterCrossingAboveReservoirPathFraction,
      cardiacOutputLPerMin: profile.cardiacOutputLPerMin,
    },
    trace: activationAvpdInteractionTrace(profile),
  };
}

function activationAvpdInteractionTrace(
  profile: WorkConjugateAtrialAVPlaneProfileV1,
): WorkConjugateAtrialAVPlaneActivationAvpdInteractionCaseV1["trace"] {
  const samples = profile.samples;
  if (samples.length === 0) return [];
  const retainedIndices = new Set<number>([0, samples.length - 1]);
  for (
    let index = 0;
    index < samples.length;
    index += WORK_CONJUGATE_ATRIAL_AV_PLANE_ARTIFACT_TRACE_STRIDE_V1
  ) {
    retainedIndices.add(index);
  }
  return [...retainedIndices]
    .sort((a, b) => a - b)
    .map((index) => {
      const sample = samples[index]!;
      return {
        theta: sample.theta,
        laVolumeMl: sample.laVolumeMl,
        laPressureMmHg: sample.laPressureMmHg,
        qMitralMlPerSec: sample.qMitralMlPerSec,
        qPulmonaryVenousMlPerSec: sample.qPulmonaryVenousMlPerSec,
        laActivation01: sample.laActivation01,
        lvActivation01: sample.lvActivation01,
        avPlanePositionCm: sample.avPlanePositionCm,
        avPlaneVelocityCmPerSec: sample.avPlaneVelocityCmPerSec,
      };
    });
}

function phaseAttributionCaseFromProfile(
  profile: WorkConjugateAtrialAVPlaneProfileV1,
  metadata: Pick<
    WorkConjugateAtrialAVPlanePhaseAttributionCaseV1,
    | "caseId"
    | "position"
    | "parameterValue"
    | "deltaFromReference"
      | "changedParameterPaths"
  >,
  context: {
    readonly params: WorkConjugateAVPlaneLeftHeartParamsV1;
    readonly lvTargetOffSec: number;
    readonly referenceConfiguration: PhaseAttributionConfigurationV1;
    readonly caseConfiguration: PhaseAttributionConfigurationV1;
  },
): WorkConjugateAtrialAVPlanePhaseAttributionCaseV1 {
  const activation = profile.activationReadback;
  const xvy = profile.xvyPressureReadback;
  const samples = profile.samples;
  const pulmonaryVenousAtrialReversal =
    activation.pulmonaryVenousAtrialReversal;
  const hardGates = evaluateHardGates(profile);
  const differingLeafPaths = differingConfigurationLeafPaths(
    context.referenceConfiguration,
    context.caseConfiguration,
  );
  const ySample = samples[nearestSampleIndexForTheta(samples, xvy.yTheta)]!;
  const lvActivationAtMitralOpeningConductanceMidpoint01 =
    interpolatedSampleValueAtTheta(
      samples,
      xvy.mitralOpeningConductanceMidpointTheta,
      (sample) => sample.lvActivation01,
    );
  const lvTargetOffToHalfActivationSec =
    sampledActivationHalfDecayAfterTime(
      samples,
      context.lvTargetOffSec,
      profile.dtSec,
      (sample) => sample.lvActivation01,
    );
  const pulmonaryVenousMomentumRows = samples.slice(1).map((sample, offset) =>
    pulmonaryVenousMomentumDecompositionV1({
      previousFlowMlPerSec: samples[offset]!.qPulmonaryVenousMlPerSec,
      currentFlowMlPerSec: sample.qPulmonaryVenousMlPerSec,
      pulmonaryVenousPressureMmHg: sample.pulmonaryVenousPressureMmHg,
      laPressureMmHg: sample.laPressureMmHg,
      dtSec: profile.dtSec,
      resistanceMmHgSecPerMl:
        context.params.pulmonaryVenousResistanceMmHgSecPerMl,
      inertanceMmHgSec2PerMl:
        context.params.pulmonaryVenousInertanceMmHgSec2PerMl,
    })
  );
  return {
    ...metadata,
    singleFactorIsolation: {
      activationModelFamilyUnchanged: true,
      wallActiveStressAmplitudeUnchanged: true,
      wallAndAvPlaneLawUnchanged: true,
      bloodVolumeLedgerUnchanged: true,
      nonlinearUnknownCount: 10,
      noRuntimeOrDefaultWiring: true,
      differingLeafPaths,
      exactDeclaredPathMatch:
        arraysEqual(differingLeafPaths, metadata.changedParameterPaths),
    },
    numerics: {
      allFinite: profile.allFinite,
      allStepsConverged: profile.allStepsConverged,
      allAcceptedSteps: profile.allAcceptedSteps,
      periodicSteadyState: profile.periodicSteadyState,
      allHardGatesPass: hardGates.allHardGatesPass,
    },
    readback: {
      laEventOnsetTheta: activation.laEventOnsetTheta,
      laActivationDrivePeakTheta: activation.laActivationDrivePeakTheta,
      laContractilePeakTheta: activation.laContractilePeakTheta,
      laPressurePeakTheta: activation.laPressurePeakTheta,
      pressurePeakVolumePositionFraction:
        activation.pressurePeakVolumePosition.fractionFromMinimumToEventVolume,
      xDescentDepthMmHg: xvy.xDescentDepthMmHg,
      mitralClosingConductanceMidpointToXSec:
        xvy.mitralClosingConductanceMidpointToXSec,
      postMitralClosingConductanceMidpointSecondaryRiseMmHg:
        xvy.postMitralClosingConductanceMidpointSecondaryRiseMmHg,
      aorticFlowEndToMitralConductanceOpeningSec:
        xvy.aorticFlowEndToMitralConductanceOpeningSec,
      aorticFlowEndToMitralConductanceOpeningMeasurementValid:
        xvy.aorticFlowEndToMitralConductanceOpeningMeasurementValid,
      cWaveCandidateStatus: xvy.cWaveCandidate.status,
      cToXDepthMmHg: xvy.cWaveCandidate.cToXDepthMmHg,
      cToXNonIncreasingFraction:
        xvy.cWaveCandidate.cToXNonIncreasingFraction,
      lvElectricalTargetOffTheta:
        context.lvTargetOffSec / profile.cycleLengthSec,
      lvTargetOffToHalfActivationSec,
      lvActivationAtMitralOpeningConductanceMidpoint01,
      lvActivationAtY01: ySample.lvActivation01,
      mitralConductanceOpeningMidpointTheta:
        xvy.mitralOpeningConductanceMidpointTheta,
      yDescentDepthMmHg: xvy.yDescentDepthMmHg,
      yDescentMeasurementStatus: xvy.yDescentMeasurementStatus,
      flowAtAtrialEventToEPeakRatio:
        profile.mitral.flowAtAtrialActivationOnsetMlPerSec /
        Math.max(Math.abs(profile.mitral.ePeakFlowMlPerSec), 1e-9),
      mitralMeasurementValid: profile.mitral.measurementValid,
      mitralFusionClass: profile.mitral.fusionClass,
      pulmonaryVenousAtrialReversalStatus:
        pulmonaryVenousAtrialReversal.status,
      pulmonaryVenousAtrialWindowNadirMlPerSec:
        pulmonaryVenousAtrialReversal.nadirFlowMlPerSec,
      pulmonaryVenousReverseDurationSec:
        pulmonaryVenousAtrialReversal.reverseDurationSec,
      pulmonaryVenousReverseVolumeMl:
        pulmonaryVenousAtrialReversal.reverseVolumeMl,
      pulmonaryVenousPressureMeanMmHg:
        meanOf(samples.map((sample) => sample.pulmonaryVenousPressureMmHg)),
      pulmonaryVenousMinusLaPressureRangeMmHg:
        range(pulmonaryVenousMomentumRows.map((row) =>
          row.pressureGradientMmHg
        )),
      pulmonaryVenousResistiveDropMeanMmHg:
        meanOf(pulmonaryVenousMomentumRows.map((row) =>
          row.resistiveDropMmHg
        )),
      pulmonaryVenousInertialDropRangeMmHg:
        range(pulmonaryVenousMomentumRows.map((row) =>
          row.inertialDropMmHg
        )),
      pulmonaryVenousMomentumIdentityMaxAbsResidualMmHg:
        maxOf(pulmonaryVenousMomentumRows.map((row) =>
          Math.abs(row.identityResidualMmHg)
        )),
      pulmonaryVenousMomentumDifferenceSampleCount:
        pulmonaryVenousMomentumRows.length,
      pulmonaryVenousMomentumDifferenceSource:
        "within-final-cycle-endpoint-differences-excludes-cycle-boundary",
      laPvLobeStatus: profile.laPvLobes.status,
      laPvLobeReason: profile.laPvLobes.reason,
      laPvRawSelfIntersectionCount:
        profile.laPvLobes.rawSelfIntersectionCount,
      cardiacOutputLPerMin: profile.cardiacOutputLPerMin,
    },
    trace: phaseAttributionTrace(profile),
  };
}

function phaseAttributionTrace(
  profile: WorkConjugateAtrialAVPlaneProfileV1,
): readonly WorkConjugateAtrialAVPlanePhaseAttributionTraceSampleV1[] {
  const samples = profile.samples;
  if (samples.length === 0) return [];
  const retainedIndices = new Set<number>([0, samples.length - 1]);
  for (
    let index = 0;
    index < samples.length;
    index += WORK_CONJUGATE_ATRIAL_AV_PLANE_ARTIFACT_TRACE_STRIDE_V1
  ) {
    retainedIndices.add(index);
  }
  return [...retainedIndices]
    .sort((a, b) => a - b)
    .map((index) => {
      const sample = samples[index]!;
      return {
        theta: sample.theta,
        laVolumeMl: sample.laVolumeMl,
        laPressureMmHg: sample.laPressureMmHg,
        qMitralMlPerSec: sample.qMitralMlPerSec,
        qPulmonaryVenousMlPerSec: sample.qPulmonaryVenousMlPerSec,
        laActivation01: sample.laActivation01,
        lvActivation01: sample.lvActivation01,
      };
    });
}

function differingConfigurationLeafPaths(
  reference: PhaseAttributionConfigurationV1,
  candidate: PhaseAttributionConfigurationV1,
): readonly string[] {
  return differingLeafPaths(reference, candidate, "").sort();
}

function differingLeafPaths(
  reference: unknown,
  candidate: unknown,
  path: string,
): string[] {
  if (Object.is(reference, candidate)) return [];
  if (
    reference === null ||
    candidate === null ||
    typeof reference !== "object" ||
    typeof candidate !== "object" ||
    Array.isArray(reference) !== Array.isArray(candidate)
  ) {
    return [path || "$root"];
  }
  if (Array.isArray(reference) && Array.isArray(candidate)) {
    const length = Math.max(reference.length, candidate.length);
    const differences: string[] = [];
    for (let index = 0; index < length; index += 1) {
      differences.push(...differingLeafPaths(
        reference[index],
        candidate[index],
        `${path}[${index}]`,
      ));
    }
    return differences;
  }
  const referenceRecord = reference as Readonly<Record<string, unknown>>;
  const candidateRecord = candidate as Readonly<Record<string, unknown>>;
  const keys = [...new Set([
    ...Object.keys(referenceRecord),
    ...Object.keys(candidateRecord),
  ])].sort();
  return keys.flatMap((key) =>
    differingLeafPaths(
      referenceRecord[key],
      candidateRecord[key],
      path ? `${path}.${key}` : key,
    )
  );
}

function arraysEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function sampledActivationHalfDecayAfterTime(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  targetOffSec: number,
  dtSec: number,
  value: (sample: WorkConjugateAtrialAVPlaneSampleV1) => number,
): number | null {
  if (samples.length === 0) return null;
  const startIndex = firstIndexAtOrAfterTime(samples, targetOffSec);
  const startValue = value(samples[startIndex]!);
  const halfValue = 0.5 * startValue;
  for (let index = startIndex + 1; index < samples.length; index += 1) {
    const previousValue = value(samples[index - 1]!);
    const currentValue = value(samples[index]!);
    if (previousValue >= halfValue && currentValue <= halfValue) {
      const delta = currentValue - previousValue;
      const crossingOffset = Math.abs(delta) < 1e-15
        ? 1
        : (halfValue - previousValue) / delta;
      return (index - startIndex - 1 + crossingOffset) * dtSec;
    }
  }
  return null;
}

export function projectWorkConjugateAtrialAVPlaneArtifactV1(
  report: WorkConjugateAtrialAVPlaneReportV1,
): WorkConjugateAtrialAVPlaneArtifactReportV1 {
  return {
    ...report,
    lvRelaxationPhenotypeScreen: {
      ...report.lvRelaxationPhenotypeScreen,
      cases: report.lvRelaxationPhenotypeScreen.cases.map((row) => {
        const { trace: _dedicatedTrace, ...summary } = row;
        return summary;
      }),
      compactTraceStorage: "dedicated-lv-relaxation-phenotype-report",
    },
    variants: report.variants.map((variant) => {
      const sourceSamples = variant.profile.samples;
      const retainedEventSourceIndices = compactTraceEventSourceIndices(
        variant.profile,
      );
      const retainedIndices = new Set<number>(
        Object.values(retainedEventSourceIndices).filter((index) => index >= 0),
      );
      for (
        let index = 0;
        index < sourceSamples.length;
        index += WORK_CONJUGATE_ATRIAL_AV_PLANE_ARTIFACT_TRACE_STRIDE_V1
      ) {
        retainedIndices.add(index);
      }
      const orderedRetainedIndices = [...retainedIndices].sort((a, b) => a - b);
      const { samples: _fullSamples, ...profileSummary } = variant.profile;
      const samples = orderedRetainedIndices.map((index) =>
        compactArtifactSample(sourceSamples[index]!)
      );
      return {
        ...variant,
        profile: {
          ...profileSummary,
          compactTrace: {
            rawDtSec: variant.profile.dtSec,
            strideSamples:
              WORK_CONJUGATE_ATRIAL_AV_PLANE_ARTIFACT_TRACE_STRIDE_V1,
            sourceSampleCount: sourceSamples.length,
            retainedSampleCount: samples.length,
            gatesAndSummariesComputedFromFullTrace: true,
            rendererUsesFullInMemoryTrace: true,
            retainedEventSourceIndices,
          },
          samples,
        },
      };
    }),
  };
}

function compactArtifactSample(
  sample: WorkConjugateAtrialAVPlaneSampleV1,
): WorkConjugateAtrialAVPlaneCompactSampleV1 {
  return {
    theta: sample.theta,
    phase: sample.phase,
    laVolumeMl: sample.laVolumeMl,
    lvVolumeMl: sample.lvVolumeMl,
    laPressureMmHg: sample.laPressureMmHg,
    lvPressureMmHg: sample.lvPressureMmHg,
    qPulmonaryVenousMlPerSec: sample.qPulmonaryVenousMlPerSec,
    qMitralMlPerSec: sample.qMitralMlPerSec,
    qAorticMlPerSec: sample.qAorticMlPerSec,
    avPlanePositionCm: sample.avPlanePositionCm,
    avPlaneVelocityCmPerSec: sample.avPlaneVelocityCmPerSec,
    laActivationDrive01: sample.laActivationDrive01,
    laCalciumDrive: sample.laCalciumDrive,
    laActivation01: sample.laActivation01,
    lvActivation01: sample.lvActivation01,
    laActiveTransmuralPressureMmHg:
      sample.laActiveTransmuralPressureMmHg,
    laTotalFzN: sample.laZForceN.total,
    lvTotalFzN: sample.lvZForceN.total,
    avWallForceSumN: sample.avForce.wallForceSumN,
    avForceResidualN: sample.avForce.forceResidualN,
    maxNormalizedEquationResidual:
      sample.residual.maxNormalizedEquationResidual,
    acceptedStep: sample.acceptedStep,
  };
}

function compactTraceEventSourceIndices(
  profile: WorkConjugateAtrialAVPlaneProfileV1,
): WorkConjugateAtrialAVPlaneCompactTraceMetadataV1["retainedEventSourceIndices"] {
  const samples = profile.samples;
  if (samples.length === 0) {
    return {
      first: -1,
      last: -1,
      mitralClosingConductanceMidpoint: -1,
      xTrough: -1,
      vPeak: -1,
      mitralOpeningConductanceMidpoint: -1,
      yTrough: -1,
      ePeak: -1,
      aPeak: -1,
      laEventOnset: -1,
      laActivationDrivePeak: -1,
      laContractilePeak: -1,
      laActivePressurePeak: -1,
      laPressurePeak: -1,
      pulmonaryVenousAtrialWindowNadir: -1,
    };
  }
  return {
    first: 0,
    last: samples.length - 1,
    mitralClosingConductanceMidpoint: nearestSampleIndexForTheta(
      samples,
      profile.xvyPressureReadback.mitralClosingConductanceMidpointTheta,
    ),
    xTrough: nearestSampleIndexForTheta(samples, profile.xvyPressureReadback.xTheta),
    vPeak: nearestSampleIndexForTheta(samples, profile.xvyPressureReadback.vTheta),
    mitralOpeningConductanceMidpoint: nearestSampleIndexForTheta(
      samples,
      profile.xvyPressureReadback.mitralOpeningConductanceMidpointTheta,
    ),
    yTrough: nearestSampleIndexForTheta(samples, profile.xvyPressureReadback.yTheta),
    ePeak: nearestSampleIndexForTheta(samples, profile.mitral.ePeakTheta),
    aPeak: nearestSampleIndexForTheta(samples, profile.mitral.aPeakTheta),
    laEventOnset: nearestSampleIndexForTheta(
      samples,
      profile.activationReadback.laEventOnsetTheta,
    ),
    laActivationDrivePeak: nearestSampleIndexForTheta(
      samples,
      profile.activationReadback.laActivationDrivePeakTheta,
    ),
    laContractilePeak: nearestSampleIndexForTheta(
      samples,
      profile.activationReadback.laContractilePeakTheta,
    ),
    laActivePressurePeak: nearestSampleIndexForTheta(
      samples,
      profile.activationReadback.laActiveTransmuralPressurePeakTheta,
    ),
    laPressurePeak: nearestSampleIndexForTheta(
      samples,
      profile.activationReadback.laPressurePeakTheta,
    ),
    pulmonaryVenousAtrialWindowNadir: nearestSampleIndexForTheta(
      samples,
      profile.activationReadback.pulmonaryVenousAtrialReversal.nadirTheta,
    ),
  };
}

function nearestSampleIndexForTheta(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  theta: number,
): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  samples.forEach((sample, index) => {
    const distance = Math.abs(sample.theta - theta);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  });
  return bestIndex;
}

export function runWorkConjugateAtrialAVPlaneProfileV1(
  config: RunProfileConfigV1,
): WorkConjugateAtrialAVPlaneProfileV1 {
  const heartRateBpm = config.heartRateBpm ?? DEFAULT_HEART_RATE_BPM;
  const cycleLengthSec = 60 / heartRateBpm;
  const requestedDtSec = config.dtSec ?? DEFAULT_DT_SEC;
  const stepsPerBeat = Math.round(cycleLengthSec / requestedDtSec);
  const dtSec = cycleLengthSec / stepsPerBeat;
  const activationTiming = config.activationTiming ?? DEFAULT_ACTIVATION_TIMING_V1;
  const activationModel = config.activationModel ??
    WORK_CONJUGATE_ATRIAL_AV_PLANE_LEGACY_ACTIVATION_MODEL_V1;
  const lvActivationModel = config.lvActivationModel ??
    WORK_CONJUGATE_ATRIAL_AV_PLANE_LEGACY_ACTIVATION_MODEL_V1;
  const eventActivationParams: EventDrivenContractileActivationParamsV1 | null =
    activationModel.kind === "event-driven-ca-like-bounded-state"
      ? {
        ...activationModel.params,
        electricalEventReference: activationModel.eventReference,
      }
      : null;
  const lvEventActivationParams:
    EventDrivenContractileActivationParamsV1 | null =
      lvActivationModel.kind === "event-driven-ca-like-bounded-state"
        ? {
          ...lvActivationModel.params,
          electricalEventReference: lvActivationModel.eventReference,
        }
        : null;
  const lvDurationSec = activationDurationSec(
    activationTiming.lvDuration,
    cycleLengthSec,
  );
  const nominalLaStartSec = activationStartSec(
    activationTiming.laStart,
    cycleLengthSec,
  );
  const laEventStepIndex = firstActivePulseStepIndex(
    stepsPerBeat,
    dtSec,
    nominalLaStartSec,
    activationTiming.laDurationSec,
  );
  const laStartSec = laEventStepIndex * dtSec;
  const activationEvents = activationModel.kind ===
    "event-driven-ca-like-bounded-state"
    ? periodicActivationEvents(
      laStartSec,
      cycleLengthSec,
      eventActivationParams!,
      DEFAULT_MAX_BEATS,
    )
    : [];
  const lvActivationEvents = lvActivationModel.kind ===
    "event-driven-ca-like-bounded-state"
    ? periodicActivationEvents(
      activationTiming.lvOnsetSec,
      cycleLengthSec,
      lvEventActivationParams!,
      DEFAULT_MAX_BEATS,
    )
    : [];
  let state = initialWorkConjugateAVPlaneLeftHeartStateV1(INITIAL_STATE, config.params);
  const initialTotalVolume = totalClosedCircuitVolumeMl(state, config.params);
  let samples: WorkConjugateAtrialAVPlaneSampleV1[] = [];
  let closure = cycleClosureReadback(state, state, false);
  let periodicSteadyState = false;
  let allStepsConverged = true;
  let allAcceptedSteps = true;
  let beatsSimulated = 0;
  for (let beat = 0; beat < DEFAULT_MAX_BEATS; beat += 1) {
    const beatStart = state;
    const beatSamples: WorkConjugateAtrialAVPlaneSampleV1[] = [];
    for (let step = 0; step < stepsPerBeat; step += 1) {
      const stepStartTimeSec = step * dtSec;
      const stateTimeSec = (step + 1) * dtSec;
      const absoluteStepStartTimeSec = beat * cycleLengthSec + stepStartTimeSec;
      const laElectricalActivation01 = pulse(
        stepStartTimeSec,
        nominalLaStartSec,
        activationTiming.laDurationSec,
      );
      const lvElectricalActivation01 = pulse(
        stepStartTimeSec,
        activationTiming.lvOnsetSec,
        lvDurationSec,
      );
      const eventActivation = activationModel.kind ===
        "event-driven-ca-like-bounded-state"
        ? stepEventDrivenContractileActivationV1(
          { activation01: state.laActivation01 },
          {
            stepStartTimeSec: absoluteStepStartTimeSec,
            dtSec,
            events: activationEvents,
          },
          eventActivationParams!,
        )
        : null;
      const lvEventActivation = lvActivationModel.kind ===
        "event-driven-ca-like-bounded-state"
        ? stepEventDrivenContractileActivationV1(
          { activation01: state.lvActivation01 },
          {
            stepStartTimeSec: absoluteStepStartTimeSec,
            dtSec,
            events: lvActivationEvents,
          },
          lvEventActivationParams!,
        )
        : null;
      const laActivationDrive01 = eventActivation?.hillDrive01 ??
        laElectricalActivation01;
      const lvActivationDrive01 = lvEventActivation?.hillDrive01 ??
        lvElectricalActivation01;
      let subsystemInput: WorkConjugateAVPlaneLeftHeartInputV1;
      if (eventActivation !== null && lvEventActivation !== null) {
        subsystemInput = {
          dtSec,
          laActivationSource: "prescribed-contractile-state",
          laElectricalActivation01,
          laPrescribedContractileActivation01:
            eventActivation.state.activation01,
          lvActivationSource: "prescribed-contractile-state",
          lvElectricalActivation01,
          lvPrescribedContractileActivation01:
            lvEventActivation.state.activation01,
          pericardialPressureMmHg: 0,
        };
      } else if (eventActivation !== null) {
        subsystemInput = {
          dtSec,
          laActivationSource: "prescribed-contractile-state",
          laElectricalActivation01,
          laPrescribedContractileActivation01:
            eventActivation.state.activation01,
          lvElectricalActivation01,
          pericardialPressureMmHg: 0,
        };
      } else if (lvEventActivation !== null) {
        subsystemInput = {
          dtSec,
          laElectricalActivation01,
          lvActivationSource: "prescribed-contractile-state",
          lvElectricalActivation01,
          lvPrescribedContractileActivation01:
            lvEventActivation.state.activation01,
          pericardialPressureMmHg: 0,
        };
      } else {
        subsystemInput = {
          dtSec,
          laElectricalActivation01,
          lvElectricalActivation01,
          pericardialPressureMmHg: 0,
        };
      }
      const output = stepWorkConjugateAVPlaneLeftHeartV1(
        state,
        subsystemInput,
        config.params,
      );
      const acceptedStep = acceptedStepFor(output);
      state = output.state;
      allStepsConverged &&= output.residual.solverConverged;
      allAcceptedSteps &&= acceptedStep;
      beatSamples.push(sampleFromOutput({
        output,
        acceptedStep,
        tSec: stateTimeSec,
        theta: (step + 1) / stepsPerBeat,
        laElectricalActivation01,
        lvElectricalActivation01,
        laActivationDrive01,
        lvActivationDrive01,
        laCalciumDrive: eventActivation?.calciumDrive ?? null,
        laEventOnsetSec: laStartSec,
        params: config.params,
        initialTotalVolume,
      }));
      if (!acceptedStep) break;
    }
    beatsSimulated = beat + 1;
    samples = beatSamples;
    closure = cycleClosureReadback(beatStart, state);
    periodicSteadyState = beat + 1 >= DEFAULT_MIN_BEATS && closure.pass;
    if (periodicSteadyState || !allAcceptedSteps) break;
  }
  return summarizeProfile({
    profileId: config.profileId,
    variantId: config.variantId,
    samples,
    cycleClosure: closure,
    periodicSteadyState,
    allStepsConverged,
    allAcceptedSteps,
    beatsSimulated,
    dtSec,
    cycleLengthSec,
    heartRateBpm,
    stepsPerBeat,
    params: config.params,
    laStartSec,
    nominalLaStartSec,
    activationModel,
  });
}

function buildWorkConjugateAtrialAVPlaneParamsV1(options: {
  readonly order: WorkConjugateAVPlaneOrderV1;
  readonly inertiaNSec2PerCm: number;
  readonly externalDampingNSecPerCm: number;
  readonly laActiveStressScale?: number;
  readonly wallViscosityScale?: number;
  readonly lvPassiveStressScaleKPa?: number;
  readonly laFallTauSec?: number;
  readonly lvFallTauSec?: number;
}): WorkConjugateAVPlaneLeftHeartParamsV1 {
  const laActiveStressMaxKPa = 2.2 * (options.laActiveStressScale ?? 1);
  const wallViscosityScale = options.wallViscosityScale ?? 1;
  const lvPassiveStressScaleKPa = options.lvPassiveStressScaleKPa ?? 12;
  const laCircumferential: WorkConjugateAVPlaneAxisParamsV1 = {
    ...BASE_PARAMS.laWall.axes.circumferential,
    passiveStressScaleKPa: 12,
    activeStressMaxKPa: laActiveStressMaxKPa,
    viscosityKPaSec: 0.5 * wallViscosityScale,
  };
  const lvCircumferential: WorkConjugateAVPlaneAxisParamsV1 = {
    ...BASE_PARAMS.lvWall.axes.circumferential,
    passiveStressScaleKPa: lvPassiveStressScaleKPa,
    activeStressMaxKPa: 55,
    activeStrainPeak: 0.08,
    activeStrainWidth: 0.16,
    viscosityKPaSec: 0.5 * wallViscosityScale,
  };
  return {
    ...BASE_PARAMS,
    laWall: {
      ...BASE_PARAMS.laWall,
      referenceBloodVolumeMl: 55,
      axes: {
        circumferential: laCircumferential,
        longitudinal: {
          ...laCircumferential,
          passiveStressScaleKPa: 12 * 0.85,
          activeStressMaxKPa: laActiveStressMaxKPa * 0.75,
          viscosityKPaSec: 0.5 * 1.4 * wallViscosityScale,
        },
      },
    },
    lvWall: {
      ...BASE_PARAMS.lvWall,
      referenceBloodVolumeMl: 110,
      axes: {
        circumferential: lvCircumferential,
        longitudinal: {
          ...lvCircumferential,
          passiveStressScaleKPa: lvPassiveStressScaleKPa * 0.85,
          activeStressMaxKPa: 55 * 0.55,
          viscosityKPaSec: 0.5 * 1.4 * wallViscosityScale,
        },
      },
    },
    activation: {
      ...BASE_PARAMS.activation,
      laFallTauSec: options.laFallTauSec ?? BASE_PARAMS.activation.laFallTauSec,
      lvFallTauSec: options.lvFallTauSec ?? BASE_PARAMS.activation.lvFallTauSec,
    },
    avPlane: {
      order: options.order,
      externalDampingNSecPerCm: options.externalDampingNSecPerCm,
      inertiaNSec2PerCm: options.inertiaNSec2PerCm,
    },
    initialReturnReservoirPressureMmHg: 15.5,
    nonlinearSolverIterations: 18,
    nonlinearLineSearchSteps: 16,
  };
}

function sampleFromOutput(input: {
  readonly output: WorkConjugateAVPlaneLeftHeartOutputV1;
  readonly acceptedStep: boolean;
  readonly tSec: number;
  readonly theta: number;
  readonly laElectricalActivation01: number;
  readonly lvElectricalActivation01: number;
  readonly laActivationDrive01: number;
  readonly lvActivationDrive01: number;
  readonly laCalciumDrive: number | null;
  readonly laEventOnsetSec: number;
  readonly params: WorkConjugateAVPlaneLeftHeartParamsV1;
  readonly initialTotalVolume: number;
}): WorkConjugateAtrialAVPlaneSampleV1 {
  const output = input.output;
  const state = output.state;
  const totalVolume = totalClosedCircuitVolumeMl(state, input.params);
  return {
    tSec: input.tSec,
    theta: input.theta,
    phase: phaseFor(
      output.mitralValve.openFraction01,
      input.tSec,
      input.laEventOnsetSec,
    ),
    laVolumeMl: state.laVolumeMl,
    lvVolumeMl: state.lvVolumeMl,
    laPressureMmHg: output.la.cavityPressureMmHg,
    lvPressureMmHg: output.lv.cavityPressureMmHg,
    pulmonaryVenousPressureMmHg: state.pulmonaryVenousPressureMmHg,
    aorticPressureMmHg: state.aorticPressureMmHg,
    returnReservoirPressureMmHg: state.returnReservoirPressureMmHg,
    qPulmonaryVenousMlPerSec: output.pulmonaryVenousFlowMlPerSec,
    qPulmonarySourceMlPerSec: output.pulmonarySourceFlowMlPerSec,
    qMitralMlPerSec: output.mitralValve.qMlPerSec,
    qAorticMlPerSec: output.aorticValve.qMlPerSec,
    qSystemicMlPerSec: output.systemicOutflowMlPerSec,
    mitralOpen01: output.mitralValve.openFraction01,
    aorticOpen01: output.aorticValve.openFraction01,
    mitralVelocityCmPerSec:
      output.mitralValve.qMlPerSec / Math.max(input.params.mitralValve.openAreaCm2, 1e-9),
    avPlanePositionCm: state.avPlanePositionCm,
    avPlaneVelocityCmPerSec: state.avPlaneVelocityCmPerSec,
    laElectricalActivation01: input.laElectricalActivation01,
    lvElectricalActivation01: input.lvElectricalActivation01,
    laActivationDrive01: input.laActivationDrive01,
    lvActivationDrive01: input.lvActivationDrive01,
    laCalciumDrive: input.laCalciumDrive,
    laActivation01: state.laActivation01,
    lvActivation01: state.lvActivation01,
    laActiveTransmuralPressureMmHg:
      output.la.transmuralPressureMmHg.active,
    laZForceN: breakdown(output.la.zForceN),
    lvZForceN: breakdown(output.lv.zForceN),
    laZForceAxisN: axisForce(output.la.zForceAxisDecompositionN),
    lvZForceAxisN: axisForce(output.lv.zForceAxisDecompositionN),
    laStressKPa: {
      circumferential: breakdown(output.la.stressesKPa.circumferential),
      longitudinal: breakdown(output.la.stressesKPa.longitudinal),
    },
    lvStressKPa: {
      circumferential: breakdown(output.lv.stressesKPa.circumferential),
      longitudinal: breakdown(output.lv.stressesKPa.longitudinal),
    },
    avForce: output.avForce,
    power: output.power,
    residual: {
      laMassResidualMl: output.residual.laMassResidualMl,
      lvMassResidualMl: output.residual.lvMassResidualMl,
      avPlaneKinematicResidualCm: output.residual.avPlaneKinematicResidualCm,
      avPlaneForceResidualN: output.residual.avPlaneForceResidualN,
      closedCircuitVolumeResidualMl: output.residual.closedCircuitVolumeResidualMl,
      totalClosedCircuitVolumeDeltaMl:
        output.residual.totalClosedCircuitVolumeDeltaMl,
      hiddenBloodVolumeSourceMl: output.residual.hiddenBloodVolumeSourceMl,
      maxNormalizedEquationResidual:
        output.residual.maxNormalizedEquationResidual,
      solverConverged: output.residual.solverConverged,
      physicalResiduals: output.residual.physicalResiduals,
      normalizedResiduals: output.residual.normalizedResiduals,
    },
    pressureArea: output.pressureArea,
    allFinite: output.allFinite,
    solverConverged: output.residual.solverConverged,
    acceptedStep: input.acceptedStep,
    totalClosedCircuitVolumeMl: totalVolume,
    totalClosedCircuitVolumeDriftFromInitialMl: totalVolume -
      input.initialTotalVolume,
  };
}

function summarizeProfile(input: {
  readonly profileId: string;
  readonly variantId: WorkConjugateAtrialAVPlaneVariantIdV1;
  readonly samples: readonly WorkConjugateAtrialAVPlaneSampleV1[];
  readonly cycleClosure: WorkConjugateAtrialAVPlaneCycleClosureV1;
  readonly periodicSteadyState: boolean;
  readonly allStepsConverged: boolean;
  readonly allAcceptedSteps: boolean;
  readonly beatsSimulated: number;
  readonly dtSec: number;
  readonly cycleLengthSec: number;
  readonly heartRateBpm: number;
  readonly stepsPerBeat: number;
  readonly params: WorkConjugateAVPlaneLeftHeartParamsV1;
  readonly laStartSec: number;
  readonly nominalLaStartSec: number;
  readonly activationModel: WorkConjugateAtrialAVPlaneLaActivationModelV1;
}): WorkConjugateAtrialAVPlaneProfileV1 {
  const samples = input.samples;
  const mitralClosingEvent = findMitralClosingConductanceMidpoint(
    samples,
  );
  const closureIndex = mitralClosingEvent.index;
  const mitralOpeningEvent = findMitralOpeningConductanceMidpoint(
    samples,
    closureIndex,
  );
  const openingIndex = mitralOpeningEvent.index;
  const aorticConductanceOpeningEvent = findAorticOpening(
    samples,
    closureIndex,
    openingIndex,
  );
  const aorticConductanceOpeningIndex =
    aorticConductanceOpeningEvent.index;
  const aorticConductanceClosingEvent = findAorticClosure(
    samples,
    aorticConductanceOpeningIndex,
    openingIndex,
  );
  const aorticForwardFlowStartEvent = findAorticForwardFlowBoundary(
    samples,
    closureIndex,
    openingIndex,
    "start",
  );
  const aorticForwardFlowEndEvent = findAorticForwardFlowBoundary(
    samples,
    aorticForwardFlowStartEvent.index,
    openingIndex,
    "end",
  );
  const mitralOpeningIsThresholdCrossing =
    mitralOpeningEvent.measurementStatus === "threshold-crossing";
  const aorticFlowEndToMitralConductanceOpeningMeasurementValid =
    aorticForwardFlowEndEvent.measurementStatus === "linear-zero-crossing" &&
    mitralOpeningIsThresholdCrossing &&
    aorticForwardFlowEndEvent.theta < mitralOpeningEvent.theta;
  const preAIndex = firstIndexAtOrAfterTime(samples, input.laStartSec);
  const phases = phaseSlices(samples, closureIndex, openingIndex, preAIndex);
  const closure = samples[closureIndex] ?? emptySample();
  const xTrough = minSample(phases.reservoir, (sample) => sample.laPressureMmHg);
  const ivct = samples.slice(
    Math.min(closureIndex, aorticForwardFlowStartEvent.index),
    Math.max(closureIndex, aorticForwardFlowStartEvent.index) + 1,
  );
  const cPeak = ivct.length > 0
    ? maxSample(ivct, (sample) => sample.laPressureMmHg)
    : closure;
  const cPeakIvctIndex = ivct.indexOf(cPeak);
  const cWaveCandidateStatus = ivct.length < 2 ||
      mitralClosingEvent.measurementStatus !== "threshold-crossing" ||
      aorticForwardFlowStartEvent.measurementStatus !== "linear-zero-crossing" ||
      aorticForwardFlowStartEvent.index <= closureIndex
    ? "not-measurable" as const
    : cPeakIvctIndex <= 0
    ? "boundary-at-mitral-closing-conductance-midpoint" as const
    : cPeakIvctIndex >= ivct.length - 1
    ? "boundary-at-aortic-flow-onset" as const
    : "interior-ivct-peak" as const;
  const cPeakReservoirIndex = phases.reservoir.indexOf(cPeak);
  const xTroughReservoirIndex = phases.reservoir.indexOf(xTrough);
  const cToX = cPeakReservoirIndex >= 0 &&
      xTroughReservoirIndex >= cPeakReservoirIndex
    ? phases.reservoir.slice(cPeakReservoirIndex, xTroughReservoirIndex + 1)
    : [];
  const lateReservoir = phases.reservoir.slice(
    Math.max(0, phases.reservoir.indexOf(xTrough)),
  );
  const vPeak = maxSample(lateReservoir, (sample) => sample.laPressureMmHg);
  const yTrough = minSample(phases.conduit, (sample) => sample.laPressureMmHg);
  const yTroughIndex = phases.conduit.indexOf(yTrough);
  const yDescentMeasurementStatus = !mitralOpeningIsThresholdCrossing
    ? "not-measurable-mitral-opening-fallback" as const
    : yTroughIndex >= phases.conduit.length - 1
    ? "right-censored-at-atrial-event" as const
    : "interior-trough" as const;
  const postMitralClosingConductanceMidpointToX = phases.reservoir.slice(
    0,
    Math.max(0, phases.reservoir.indexOf(xTrough)) + 1,
  );
  const mitral = analyzeMitralInflow(
    samples,
    openingIndex,
    closureIndex,
    preAIndex,
    input.dtSec,
    input.cycleLengthSec,
  );
  const lobeMeasurement = measureLaPvTwoLobesV2(samples.map((sample) => ({
    laVolumeMl: sample.laVolumeMl,
    laPressureMmHg: sample.laPressureMmHg,
    theta: sample.theta,
    phase: sample.phase,
    laActivation01: sample.laActivation01,
  })));
  const reservoirConduitIntersections = pathIntersections(
    phases.reservoir,
    phases.conduit,
  );
  const reservoirPumpingIntersections = pathIntersections(
    phases.reservoir,
    phases.pumping,
  );
  const crossing = selectFigureEightCrossing(
    reservoirConduitIntersections,
    reservoirPumpingIntersections,
  );
  const conduitBelow = crossing
    ? pathOrderFraction(
      phases.conduit,
      phases.reservoir,
      "below",
      0,
      crossing.source === "conduit" ? crossing.pathProgress01 : 1,
    )
    : 0;
  const pumpingAbove = crossing
    ? pathOrderFraction(
      phases.pumping,
      phases.reservoir,
      "above",
      crossing.source === "pumping" ? crossing.pathProgress01 : 0,
      1,
    )
    : 0;
  const aLoopSignedArea = lobeMeasurement.status === "measurable"
    ? lobeMeasurement.aLobe.signedAreaMmHgMl
    : 0;
  const vLoopSignedArea = lobeMeasurement.status === "measurable"
    ? lobeMeasurement.vLobe.signedAreaMmHgMl
    : 0;
  const legacyPhaseASigned = signedLaPvLoopAreaV2(phases.pumping);
  const legacyPhaseVSigned = signedLaPvLoopAreaV2([
    ...phases.reservoir,
    ...phases.conduit,
  ]);
  const aorticForwardVolumeMl = integrateSamples(
    samples,
    input.dtSec,
    (sample) => Math.max(0, sample.qAorticMlPerSec),
  );
  const sPeakSample = maxSample(
    phases.reservoir,
    (sample) => sample.qPulmonaryVenousMlPerSec,
  );
  const dPeakSample = maxSample(
    phases.conduit,
    (sample) => sample.qPulmonaryVenousMlPerSec,
  );
  const derivative = estimateStaticNetForceDerivativeNPerCmV1({
    laVolumeMl: 55,
    lvVolumeMl: 110,
    avPlanePositionCm: 0,
    laActivation01: 0,
    lvActivation01: 0,
    pericardialPressureMmHg: 0,
  }, input.params);
  const activationReadback = activationReadbackFor({
    samples,
    eventIndex: preAIndex,
    closureIndex,
    mitralClosingConductanceMidpointTheta: mitralClosingEvent.theta,
    dtSec: input.dtSec,
    cycleLengthSec: input.cycleLengthSec,
    activationModel: input.activationModel,
    nominalEventOnsetSec: input.nominalLaStartSec,
    appliedEventOnsetSec: input.laStartSec,
  });
  const mitralValvePhaseEvents = detectPeriodicValvePhaseEventsV1(samples.map((sample) => ({
    timeSec: sample.tSec,
    upstreamPressureMmHg: sample.laPressureMmHg,
    downstreamPressureMmHg: sample.lvPressureMmHg,
    forwardFlowMlPerSec: sample.qMitralMlPerSec,
    conductance01: sample.mitralOpen01,
  })), input.cycleLengthSec);
  const aorticValvePhaseEvents = detectPeriodicValvePhaseEventsV1(samples.map((sample) => ({
    timeSec: sample.tSec,
    upstreamPressureMmHg: sample.lvPressureMmHg,
    downstreamPressureMmHg: sample.aorticPressureMmHg,
    forwardFlowMlPerSec: sample.qAorticMlPerSec,
    conductance01: sample.aorticOpen01,
  })), input.cycleLengthSec);
  return {
    profileId: input.profileId,
    variantId: input.variantId,
    heartRateBpm: input.heartRateBpm,
    cycleLengthSec: input.cycleLengthSec,
    dtSec: input.dtSec,
    stepsPerBeat: input.stepsPerBeat,
    allFinite: samples.every(sampleFinite),
    allStepsConverged: input.allStepsConverged &&
      samples.every((sample) => sample.solverConverged),
    allAcceptedSteps: input.allAcceptedSteps &&
      samples.every((sample) => sample.acceptedStep),
    periodicSteadyState: input.periodicSteadyState,
    beatsSimulated: input.beatsSimulated,
    cycleClosure: input.cycleClosure,
    pressureRangeLaMmHg: range(samples.map((sample) => sample.laPressureMmHg)),
    pressureRangeLvMmHg: range(samples.map((sample) => sample.lvPressureMmHg)),
    pressureRangeAorticMmHg: range(samples.map((sample) => sample.aorticPressureMmHg)),
    flowRangePulmonaryVenousMlPerSec: range(samples.map((sample) =>
      sample.qPulmonaryVenousMlPerSec
    )),
    flowRangeMitralMlPerSec: range(samples.map((sample) => sample.qMitralMlPerSec)),
    volumeRangeLaMl: range(samples.map((sample) => sample.laVolumeMl)),
    volumeRangeLvMl: range(samples.map((sample) => sample.lvVolumeMl)),
    zRangeCm: range(samples.map((sample) => sample.avPlanePositionCm)),
    uRangeCmPerSec: range(samples.map((sample) => sample.avPlaneVelocityCmPerSec)),
    cardiacOutputLPerMin: aorticForwardVolumeMl / input.cycleLengthSec * 0.06,
    strokeVolumeMl: aorticForwardVolumeMl,
    activationModel: input.activationModel,
    activationReadback,
    valvePhaseEvents: {
      role: "report-only-pressure-flow-contract",
      eventTimeDefinition:
        "pressure-crossover-associated-with-sustained-forward-flow-threshold",
      mitral: mitralValvePhaseEvents,
      aortic: aorticValvePhaseEvents,
    },
    xvyPressureReadback: {
      mitralClosingConductanceMidpointTheta: mitralClosingEvent.theta,
      mitralClosingConductanceMidpointStatus:
        mitralClosingEvent.measurementStatus,
      mitralClosingConductanceMidpointLaPressureMmHg:
        mitralClosingEvent.laPressureMmHg,
      xTheta: xTrough.theta,
      xPressureMmHg: xTrough.laPressureMmHg,
      xDescentDepthMmHg: Math.max(
        0,
        mitralClosingEvent.laPressureMmHg - xTrough.laPressureMmHg,
      ),
      mitralClosingConductanceMidpointToXSec: forwardCycleElapsedSec(
        mitralClosingEvent.theta,
        xTrough.theta,
        input.cycleLengthSec,
      ),
      postMitralClosingConductanceMidpointToXNonIncreasingFraction:
        nonIncreasingPressureFraction(
          postMitralClosingConductanceMidpointToX,
          input.dtSec,
        ),
      postMitralClosingConductanceMidpointSecondaryRiseMmHg:
        secondaryPressureRiseMmHg(
          postMitralClosingConductanceMidpointToX,
        ),
      aorticConductanceOpeningMidpointTheta:
        aorticConductanceOpeningEvent.theta,
      aorticConductanceOpeningMidpointStatus:
        aorticConductanceOpeningEvent.measurementStatus,
      aorticConductanceClosingMidpointTheta:
        aorticConductanceClosingEvent.theta,
      aorticConductanceClosingMidpointStatus:
        aorticConductanceClosingEvent.measurementStatus,
      aorticFlowAtConductanceClosingMidpointMlPerSec:
        aorticConductanceClosingEvent.qAorticMlPerSec,
      aorticForwardFlowStartTheta: aorticForwardFlowStartEvent.theta,
      aorticForwardFlowStartStatus:
        aorticForwardFlowStartEvent.measurementStatus,
      aorticForwardFlowEndTheta: aorticForwardFlowEndEvent.theta,
      aorticForwardFlowEndStatus:
        aorticForwardFlowEndEvent.measurementStatus,
      aorticFlowEndToMitralConductanceOpeningSec:
        aorticFlowEndToMitralConductanceOpeningMeasurementValid
          ? forwardCycleElapsedSec(
            aorticForwardFlowEndEvent.theta,
            mitralOpeningEvent.theta,
            input.cycleLengthSec,
          )
          : null,
      aorticFlowEndToMitralConductanceOpeningMeasurementValid,
      cWaveCandidate: {
        status: cWaveCandidateStatus,
        peakTheta: cWaveCandidateStatus === "not-measurable"
          ? null
          : cPeak.theta,
        peakPressureMmHg: cWaveCandidateStatus === "not-measurable"
          ? null
          : cPeak.laPressureMmHg,
        riseFromMitralClosingConductanceMidpointMmHg:
          cWaveCandidateStatus === "not-measurable"
            ? null
            : Math.max(
              0,
              cPeak.laPressureMmHg - mitralClosingEvent.laPressureMmHg,
            ),
        cToXDepthMmHg: cWaveCandidateStatus === "not-measurable"
          ? null
          : Math.max(
            0,
            cPeak.laPressureMmHg - xTrough.laPressureMmHg,
          ),
        cToXSec: cWaveCandidateStatus === "not-measurable"
          ? null
          : forwardCycleElapsedSec(
            cPeak.theta,
            xTrough.theta,
            input.cycleLengthSec,
          ),
        cToXNonIncreasingFraction: cWaveCandidateStatus === "not-measurable"
          ? null
          : nonIncreasingPressureFraction(cToX, input.dtSec),
        postCSecondaryRiseMmHg: cWaveCandidateStatus === "not-measurable"
          ? null
          : secondaryPressureRiseMmHg(cToX),
      },
      vTheta: vPeak.theta,
      vPressureMmHg: vPeak.laPressureMmHg,
      vWaveRiseMmHg: Math.max(0, vPeak.laPressureMmHg - xTrough.laPressureMmHg),
      mitralOpeningConductanceMidpointTheta: mitralOpeningEvent.theta,
      mitralOpeningConductanceMidpointStatus:
        mitralOpeningEvent.measurementStatus,
      mitralOpeningConductanceMidpointLaPressureMmHg:
        mitralOpeningEvent.laPressureMmHg,
      yTheta: yTrough.theta,
      yPressureMmHg: yTrough.laPressureMmHg,
      yDescentDepthMmHg: Math.max(
        0,
        mitralOpeningEvent.laPressureMmHg - yTrough.laPressureMmHg,
      ),
      yDescentMeasurementStatus,
      mitralOpeningConductanceMidpointToYSec: forwardCycleElapsedSec(
        mitralOpeningEvent.theta,
        yTrough.theta,
        input.cycleLengthSec,
      ),
      yToAtrialEventMarginSec:
        ((samples[preAIndex]?.theta ?? yTrough.theta) - yTrough.theta) *
        input.cycleLengthSec,
      qMitralAtYMlPerSec: yTrough.qMitralMlPerSec,
    },
    mitral,
    pulmonaryVenous: {
      sPeakMlPerSec: sPeakSample.qPulmonaryVenousMlPerSec,
      dPeakMlPerSec: dPeakSample.qPulmonaryVenousMlPerSec,
      sToDRatio: sPeakSample.qPulmonaryVenousMlPerSec /
        Math.max(dPeakSample.qPulmonaryVenousMlPerSec, 1e-9),
      sPeakTheta: sPeakSample.theta,
      dPeakTheta: dPeakSample.theta,
    },
    laPvLobes: {
      status: lobeMeasurement.status,
      reason: lobeMeasurement.reason,
      selfIntersectionCount: lobeMeasurement.selfIntersectionCount,
      rawSelfIntersectionCount: lobeMeasurement.rawSelfIntersectionCount,
      crossings: lobeMeasurement.crossings,
      crossingAngleDeg: lobeMeasurement.status === "measurable"
        ? lobeMeasurement.crossing.angleDeg
        : 0,
      aLoopAreaMmHgMl: Math.abs(aLoopSignedArea),
      vLoopAreaMmHgMl: Math.abs(vLoopSignedArea),
      aLoopSignedAreaMmHgMl: aLoopSignedArea,
      vLoopSignedAreaMmHgMl: vLoopSignedArea,
      aToVAreaRatio: Math.abs(aLoopSignedArea) /
        Math.max(Math.abs(vLoopSignedArea), 1e-9),
      opposedLobeOrientation: lobeMeasurement.opposedLobeOrientation,
      selectionEvidenceSource: lobeMeasurement.status === "measurable"
        ? lobeMeasurement.selectionEvidenceSource
        : "not-applicable",
      activationEvidenceCoverage01: lobeMeasurement.status === "measurable"
        ? lobeMeasurement.activationEvidenceCoverage01
        : null,
      aLobeActivationBurden01: lobeMeasurement.status === "measurable"
        ? lobeMeasurement.aLobe.activationBurden01
        : null,
      vLobeActivationBurden01: lobeMeasurement.status === "measurable"
        ? lobeMeasurement.vLobe.activationBurden01
        : null,
      aLobePumpingFraction01: lobeMeasurement.status === "measurable"
        ? lobeMeasurement.aLobe.pumpingFraction01
        : null,
      vLobePumpingFraction01: lobeMeasurement.status === "measurable"
        ? lobeMeasurement.vLobe.pumpingFraction01
        : null,
    },
    pathOrdering: {
      reservoirConduitIntersectionCount: reservoirConduitIntersections.length,
      reservoirConduitMaxAngleDeg: maxOf(
        reservoirConduitIntersections.map((row) => row.angleDeg),
      ),
      reservoirPumpingIntersectionCount: reservoirPumpingIntersections.length,
      reservoirPumpingMaxAngleDeg: maxOf(
        reservoirPumpingIntersections.map((row) => row.angleDeg),
      ),
      figureEightCrossingPhase: crossing?.phase ?? "none",
      figureEightCrossingProgress01: crossing?.pathProgress01 ?? 0,
      figureEightCrossingAngleDeg: crossing?.angleDeg ?? 0,
      conduitBeforeCrossingBelowReservoirPathFraction: conduitBelow,
      pumpingAfterCrossingAboveReservoirPathFraction: pumpingAbove,
    },
    legacyPhaseAreas: {
      aLoopAreaMmHgMl: Math.abs(legacyPhaseASigned),
      vLoopAreaMmHgMl: Math.abs(legacyPhaseVSigned),
      aLoopSignedAreaMmHgMl: legacyPhaseASigned,
      vLoopSignedAreaMmHgMl: legacyPhaseVSigned,
      opposedOrientation: legacyPhaseASigned * legacyPhaseVSigned < 0,
      role: "phase-colored-display-diagnostic",
    },
    residualExtrema: residualExtremaFor(samples),
    staticPassiveReference: {
      netForceDerivativeNPerCm: derivative,
      derivativeSignGate: derivative < 0 ? "pass-negative" : "fail-nonnegative",
    },
    samples,
  };
}

function activationReadbackFor(input: {
  readonly samples: readonly WorkConjugateAtrialAVPlaneSampleV1[];
  readonly eventIndex: number;
  readonly closureIndex: number;
  readonly mitralClosingConductanceMidpointTheta: number;
  readonly dtSec: number;
  readonly cycleLengthSec: number;
  readonly activationModel: WorkConjugateAtrialAVPlaneLaActivationModelV1;
  readonly nominalEventOnsetSec: number;
  readonly appliedEventOnsetSec: number;
}): WorkConjugateAtrialAVPlaneActivationReadbackV1 {
  const samples = input.samples.length > 0 ? input.samples : [emptySample()];
  const eventIndex = Math.min(Math.max(input.eventIndex, 0), samples.length - 1);
  const sequence: UnwrappedMitralSampleV1[] = [];
  for (let offset = 0; offset <= samples.length; offset += 1) {
    const index = (eventIndex + offset) % samples.length;
    sequence.push({
      index,
      elapsedSec: offset * input.dtSec,
      sample: samples[index]!,
    });
  }
  let closureOrdinal = sequence.findIndex(
    (point, ordinal) => ordinal > 0 && point.index === input.closureIndex,
  );
  if (closureOrdinal < 1) closureOrdinal = sequence.length - 1;
  const atrialWindow = sequence.slice(0, closureOrdinal + 1);
  const eventSample = sequence[0]!.sample;
  const activationDrivePeak = sequence[maxIndex(sequence.map((point) =>
    point.sample.laActivationDrive01
  ))]!;
  const contractilePeakOrdinal = maxIndex(sequence.map((point) =>
    point.sample.laActivation01
  ));
  const contractilePeak = sequence[contractilePeakOrdinal]!;
  const baselineActivation01 = eventSample.laActivation01;
  const halfRelaxationActivation01 = baselineActivation01 +
    0.5 * (contractilePeak.sample.laActivation01 - baselineActivation01);
  let contractileRt50Sec: number | null = null;
  for (let ordinal = contractilePeakOrdinal + 1; ordinal < sequence.length; ordinal += 1) {
    const previous = sequence[ordinal - 1]!;
    const current = sequence[ordinal]!;
    if (
      previous.sample.laActivation01 >= halfRelaxationActivation01 &&
      current.sample.laActivation01 <= halfRelaxationActivation01
    ) {
      const delta = current.sample.laActivation01 -
        previous.sample.laActivation01;
      const crossingTimeSec = Math.abs(delta) < 1e-15
        ? current.elapsedSec
        : previous.elapsedSec + input.dtSec *
          (halfRelaxationActivation01 - previous.sample.laActivation01) /
          delta;
      contractileRt50Sec = crossingTimeSec - contractilePeak.elapsedSec;
      break;
    }
  }
  const calciumSequence = sequence.filter((point) =>
    point.sample.laCalciumDrive !== null
  );
  const calciumPeak = calciumSequence.length > 0
    ? calciumSequence[maxIndex(calciumSequence.map((point) =>
      point.sample.laCalciumDrive ?? Number.NEGATIVE_INFINITY
    ))]!
    : null;
  const activePressurePeak = atrialWindow[maxIndex(atrialWindow.map((point) =>
    point.sample.laActiveTransmuralPressureMmHg
  ))]!;
  const atrialWindowMitralPeak = atrialWindow[maxIndex(atrialWindow.map((point) =>
    point.sample.qMitralMlPerSec
  ))]!;
  const laPressurePeak = atrialWindow[maxIndex(atrialWindow.map((point) =>
    point.sample.laPressureMmHg
  ))]!;
  const minimumVolume = minOf(atrialWindow.map((point) =>
    point.sample.laVolumeMl
  ));
  const volumeDenominator = eventSample.laVolumeMl - minimumVolume;
  const pressurePeakVolumePosition = Math.abs(volumeDenominator) > 1e-6
    ? (laPressurePeak.sample.laVolumeMl - minimumVolume) / volumeDenominator
    : null;
  const pulmonaryVenousNadir = atrialWindow[minIndex(atrialWindow.map((point) =>
    point.sample.qPulmonaryVenousMlPerSec
  ))]!;
  let reverseDurationSec = 0;
  let reverseVolumeMl = 0;
  for (let ordinal = 0; ordinal + 1 < atrialWindow.length; ordinal += 1) {
    const a = atrialWindow[ordinal]!.sample.qPulmonaryVenousMlPerSec;
    const b = atrialWindow[ordinal + 1]!.sample.qPulmonaryVenousMlPerSec;
    const negativeSegment = integrateNegativeLinearFlowSegmentV1(
      a,
      b,
      input.dtSec,
    );
    reverseDurationSec += negativeSegment.durationSec;
    reverseVolumeMl += negativeSegment.reverseVolumeMl;
  }
  const laActivationAtMitralClosingConductanceMidpoint01 =
    interpolatedSampleValueAtTheta(
      samples,
      input.mitralClosingConductanceMidpointTheta,
      (sample) => sample.laActivation01,
    );
  const lvActivationAtMitralClosingConductanceMidpoint01 =
    interpolatedSampleValueAtTheta(
      samples,
      input.mitralClosingConductanceMidpointTheta,
      (sample) => sample.lvActivation01,
    );
  // sequence[0] is the state at the realized event boundary; the event enters
  // the following midpoint-driven step, whose endpoint is sequence[1].
  const calciumAtFirstDriveSample = sequence[1]!.sample.laCalciumDrive;
  const activationDriveSamplingOffsetSec = input.activationModel.kind ===
    "event-driven-ca-like-bounded-state"
    ? 0.5 * input.dtSec
    : input.dtSec;
  const drivePeakTheta = wrapTheta(
    activationDrivePeak.sample.theta -
    activationDriveSamplingOffsetSec / input.cycleLengthSec,
  );
  const calciumPeakTheta = calciumPeak === null
    ? null
    : wrapTheta(
      calciumPeak.sample.theta - 0.5 * input.dtSec / input.cycleLengthSec,
    );
  return {
    eventReference: input.activationModel.eventReference,
    modelKind: input.activationModel.kind,
    phaseBoundarySource: "realized-grid-event-onset",
    laNominalEventOnsetTheta:
      input.nominalEventOnsetSec / input.cycleLengthSec,
    laEventOnsetTheta: eventSample.theta,
    laEventGridOffsetSec:
      input.appliedEventOnsetSec - input.nominalEventOnsetSec,
    laCalciumDriveAtFirstDriveSample: calciumAtFirstDriveSample,
    laCalciumDrivePeak: calciumPeak?.sample.laCalciumDrive ?? null,
    laCalciumDrivePeakTheta: calciumPeakTheta,
    laActivationDrivePeak01: activationDrivePeak.sample.laActivationDrive01,
    laActivationDrivePeakTheta: drivePeakTheta,
    laContractilePeak01: contractilePeak.sample.laActivation01,
    laContractilePeakTheta: contractilePeak.sample.theta,
    laEventToContractilePeakSec: contractilePeak.elapsedSec,
    laContractileRt50Sec: contractileRt50Sec,
    laActivationAtMitralClosingConductanceMidpoint01,
    lvActivationAtMitralClosingConductanceMidpoint01,
    laActiveTransmuralPressurePeakMmHg:
      activePressurePeak.sample.laActiveTransmuralPressureMmHg,
    laActiveTransmuralPressurePeakTheta: activePressurePeak.sample.theta,
    atrialWindowMitralPeakFlowMlPerSec:
      atrialWindowMitralPeak.sample.qMitralMlPerSec,
    atrialWindowMitralPeakTheta: atrialWindowMitralPeak.sample.theta,
    laPressurePeakMmHg: laPressurePeak.sample.laPressureMmHg,
    laPressurePeakTheta: laPressurePeak.sample.theta,
    laPressurePeakVolumeMl: laPressurePeak.sample.laVolumeMl,
    pressurePeakVolumePosition: {
      measurementValid: pressurePeakVolumePosition !== null,
      fractionFromMinimumToEventVolume: pressurePeakVolumePosition,
      fractionEmptiedAtPressurePeak: pressurePeakVolumePosition === null
        ? null
        : 1 - pressurePeakVolumePosition,
    },
    pulmonaryVenousAtrialReversal: {
      status: pulmonaryVenousNadir.sample.qPulmonaryVenousMlPerSec < -0.000001
        ? "present"
        : "absent",
      detectionToleranceMlPerSec: 0.000001,
      nadirFlowMlPerSec: pulmonaryVenousNadir.sample.qPulmonaryVenousMlPerSec,
      reversePeakMlPerSec: Math.max(
        0,
        -pulmonaryVenousNadir.sample.qPulmonaryVenousMlPerSec,
      ),
      reverseDurationSec,
      reverseVolumeMl,
      nadirTheta: pulmonaryVenousNadir.sample.theta,
    },
  };
}

function evaluateHardGates(
  profile: WorkConjugateAtrialAVPlaneProfileV1,
): WorkConjugateAtrialAVPlaneHardGatesV1 {
  const residual = profile.residualExtrema;
  const finiteAndSolverConvergence = profile.allFinite &&
    profile.allStepsConverged &&
    profile.allAcceptedSteps &&
    residual.maxNormalizedEquationResidual <=
      HARD_GATE_THRESHOLDS_V1.maxNormalizedEquationResidual;
  const periodicity = profile.periodicSteadyState && profile.cycleClosure.pass;
  const closedVolumeMass =
    residual.maxAbsMassResidualMl <= HARD_GATE_THRESHOLDS_V1.maxAbsMassResidualMl &&
    residual.maxAbsClosedCircuitVolumeResidualMl <=
      HARD_GATE_THRESHOLDS_V1.maxAbsClosedCircuitVolumeResidualMl &&
    residual.maxAbsTotalVolumeDriftMl <=
      HARD_GATE_THRESHOLDS_V1.maxAbsTotalVolumeDriftMl;
  const hiddenSourceExactlyZero = residual.maxHiddenBloodVolumeSourceMl === 0;
  const wallVirtualWorkResidual = residual.maxAbsWallRawPowerResidualW <=
    HARD_GATE_THRESHOLDS_V1.maxAbsWallRawPowerResidualW;
  const pressureAreaIdentity = residual.maxAbsPressureAreaIdentityResidualN <=
    HARD_GATE_THRESHOLDS_V1.maxAbsPressureAreaIdentityResidualN;
  const avForcePowerResidual =
    residual.maxAbsAvPlaneForceResidualN <=
      HARD_GATE_THRESHOLDS_V1.maxAbsAvPlaneForceResidualN &&
    residual.maxAbsAvForcePowerResidualW <=
      HARD_GATE_THRESHOLDS_V1.maxAbsAvForcePowerResidualW &&
    residual.maxAbsCoupledRawPowerResidualW <=
      HARD_GATE_THRESHOLDS_V1.maxAbsCoupledRawPowerResidualW;
  const passiveReferenceRestoringDerivativeNegative =
    profile.staticPassiveReference.netForceDerivativeNPerCm < 0;
  return {
    finiteAndSolverConvergence,
    periodicity,
    closedVolumeMass,
    hiddenSourceExactlyZero,
    wallVirtualWorkResidual,
    pressureAreaIdentity,
    avForcePowerResidual,
    passiveReferenceRestoringDerivativeNegative,
    allHardGatesPass: finiteAndSolverConvergence &&
      periodicity &&
      closedVolumeMass &&
      hiddenSourceExactlyZero &&
      wallVirtualWorkResidual &&
      pressureAreaIdentity &&
      avForcePowerResidual &&
      passiveReferenceRestoringDerivativeNegative,
  };
}

function buildEnvelope(
  hr75: WorkConjugateAtrialAVPlaneProfileV1,
): readonly WorkConjugateAtrialAVPlaneEnvelopeCaseV1[] {
  const hr60 = runWorkConjugateAtrialAVPlaneProfileV1({
    profileId: "canonical-quasistatic-wall-viscous-hr60",
    variantId: "canonical-quasistatic-wall-viscous",
    params: WORK_CONJUGATE_ATRIAL_AV_PLANE_CANONICAL_PARAMS_V1,
    heartRateBpm: 60,
  });
  const hr100 = runWorkConjugateAtrialAVPlaneProfileV1({
    profileId: "canonical-quasistatic-wall-viscous-hr100",
    variantId: "canonical-quasistatic-wall-viscous",
    params: WORK_CONJUGATE_ATRIAL_AV_PLANE_CANONICAL_PARAMS_V1,
    heartRateBpm: 100,
  });
  return [
    envelopeCase("hr60", 60, hr60),
    envelopeCase("hr75", 75, hr75),
    envelopeCase("hr100", 100, hr100),
  ];
}

function buildStaticRootEnvelope(
  profile: WorkConjugateAtrialAVPlaneProfileV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): WorkConjugateAtrialAVPlaneStaticRootEnvelopeV1 {
  const volumeGrid = (range: readonly [number, number]) => [
    range[0],
    0.5 * (range[0] + range[1]),
    range[1],
  ] as const;
  const laVolumes = volumeGrid(profile.volumeRangeLaMl);
  const lvVolumes = volumeGrid(profile.volumeRangeLvMl);
  const activationGrid = [0, 0.5, 1] as const;
  const cases: WorkConjugateAtrialAVPlaneStaticRootEnvelopeCaseV1[] = [];
  for (let laVolumeIndex = 0; laVolumeIndex < laVolumes.length; laVolumeIndex += 1) {
    for (let lvVolumeIndex = 0; lvVolumeIndex < lvVolumes.length; lvVolumeIndex += 1) {
      for (const laActivation01 of activationGrid) {
        for (const lvActivation01 of activationGrid) {
          const input = {
            laVolumeMl: laVolumes[laVolumeIndex]!,
            lvVolumeMl: lvVolumes[lvVolumeIndex]!,
            laActivation01,
            lvActivation01,
            pericardialPressureMmHg: 0,
          };
          const rootPositions = staticNetForceRootsV1(input, params);
          const roots = rootPositions.map((avPlanePositionCm) => {
            const netForceDerivativeNPerCm =
              estimateStaticNetForceDerivativeNPerCmV1({
                ...input,
                avPlanePositionCm,
              }, params);
            return {
              avPlanePositionCm,
              boundaryMarginCm: Math.min(
                avPlanePositionCm - (-1.5),
                1.5 - avPlanePositionCm,
              ),
              forceResidualN: staticNetWallForceN({
                ...input,
                avPlanePositionCm,
              }, params),
              netForceDerivativeNPerCm,
              stableRestoringSign: netForceDerivativeNPerCm < 0,
            };
          });
          cases.push({
            caseId: `laV${laVolumeIndex}-lvV${lvVolumeIndex}-laA${laActivation01}-lvA${lvActivation01}`,
            laVolumeMl: input.laVolumeMl,
            lvVolumeMl: input.lvVolumeMl,
            laActivation01,
            lvActivation01,
            rootCount: roots.length,
            roots,
          });
        }
      }
    }
  }
  return {
    role: "report-only-not-hard-gated",
    domainSource: "canonical-trace-volume-min-mid-max",
    avPlaneSearchDomainCm: [-1.5, 1.5],
    method: "uniform-0.01cm-sign-change-bracketing-plus-bisection",
    mathematicalGlobalUniquenessProof: false,
    caseCount: 81,
    uniqueStableRootCaseCount: cases.filter((row) =>
      row.rootCount === 1 && row.roots[0]!.stableRestoringSign
    ).length,
    zeroRootCaseCount: cases.filter((row) => row.rootCount === 0).length,
    multipleRootCaseCount: cases.filter((row) => row.rootCount > 1).length,
    unstableRootCaseCount: cases.filter((row) =>
      row.roots.some((root) => !root.stableRestoringSign)
    ).length,
    minimumRootBoundaryMarginCm: minOf(cases.flatMap((row) =>
      row.roots.map((root) => root.boundaryMarginCm)
    )),
    maximumAbsRootForceResidualN: maxOf(cases.flatMap((row) =>
      row.roots.map((root) => Math.abs(root.forceResidualN))
    )),
    minimumAbsNetForceDerivativeNPerCm: minOf(cases.flatMap((row) =>
      row.roots.map((root) => Math.abs(root.netForceDerivativeNPerCm))
    )),
    cases,
  };
}

function buildActivationDtSensitivity(
  variantRow: WorkConjugateAtrialAVPlaneVariantV1,
): WorkConjugateAtrialAVPlaneActivationDtSensitivityV1 {
  const dtValues = [0.001, 0.0005, 0.00025] as const;
  const profiles = dtValues.map((dtSec) => dtSec === DEFAULT_DT_SEC
    ? variantRow.profile
    : runWorkConjugateAtrialAVPlaneProfileV1({
      profileId: `event-driven-atrial-activation-ablation-dt-${dtSec}`,
      variantId: "event-driven-atrial-activation-ablation",
      params: variantRow.params,
      activationTiming: variantRow.activationTiming,
      activationModel: variantRow.activationModel,
      dtSec,
    }));
  const cases: WorkConjugateAtrialAVPlaneActivationDtSensitivityV1["cases"] =
    profiles.map((profile, index) => ({
      dtSec: dtValues[index]!,
      periodicSteadyState: profile.periodicSteadyState,
      allHardGatesPass: evaluateHardGates(profile).allHardGatesPass,
      laContractilePeak01: profile.activationReadback.laContractilePeak01,
      laEventToContractilePeakSec:
        profile.activationReadback.laEventToContractilePeakSec,
      laContractileRt50Sec:
        profile.activationReadback.laContractileRt50Sec,
      pressurePeakVolumePositionFraction:
        profile.activationReadback.pressurePeakVolumePosition
          .fractionFromMinimumToEventVolume,
    }));
  const coarse = cases[0]!;
  const fine = cases[2]!;
  const nullableAbsoluteDifference = (
    a: number | null,
    b: number | null,
  ) => a === null || b === null ? null : Math.abs(a - b);
  return {
    role: "report-only-midpoint-drive-discretization-check",
    cases,
    finestDtSec: 0.00025,
    coarseToFineAbsoluteDifference: {
      laContractilePeak01: Math.abs(
        coarse.laContractilePeak01 - fine.laContractilePeak01,
      ),
      laEventToContractilePeakSec: Math.abs(
        coarse.laEventToContractilePeakSec -
        fine.laEventToContractilePeakSec,
      ),
      laContractileRt50Sec: nullableAbsoluteDifference(
        coarse.laContractileRt50Sec,
        fine.laContractileRt50Sec,
      ),
      pressurePeakVolumePositionFraction: nullableAbsoluteDifference(
        coarse.pressurePeakVolumePositionFraction,
        fine.pressurePeakVolumePositionFraction,
      ),
    },
  };
}

function staticNetForceRootsV1(
  input: {
    readonly laVolumeMl: number;
    readonly lvVolumeMl: number;
    readonly laActivation01: number;
    readonly lvActivation01: number;
    readonly pericardialPressureMmHg: number;
  },
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): readonly number[] {
  const minimumZCm = -1.5;
  const maximumZCm = 1.5;
  const intervalCount = 300;
  const rootToleranceN = 1e-10;
  const roots: number[] = [];
  let leftZCm = minimumZCm;
  let leftForceN = staticNetWallForceN({ ...input, avPlanePositionCm: leftZCm }, params);
  for (let interval = 1; interval <= intervalCount; interval += 1) {
    const rightZCm = minimumZCm +
      (maximumZCm - minimumZCm) * interval / intervalCount;
    const rightForceN = staticNetWallForceN(
      { ...input, avPlanePositionCm: rightZCm },
      params,
    );
    if (Math.abs(leftForceN) <= rootToleranceN) roots.push(leftZCm);
    if (leftForceN * rightForceN < 0) {
      let lowerZCm = leftZCm;
      let upperZCm = rightZCm;
      let lowerForceN = leftForceN;
      for (let iteration = 0; iteration < 64; iteration += 1) {
        const midpointZCm = 0.5 * (lowerZCm + upperZCm);
        const midpointForceN = staticNetWallForceN(
          { ...input, avPlanePositionCm: midpointZCm },
          params,
        );
        if (lowerForceN * midpointForceN <= 0) {
          upperZCm = midpointZCm;
        } else {
          lowerZCm = midpointZCm;
          lowerForceN = midpointForceN;
        }
      }
      roots.push(0.5 * (lowerZCm + upperZCm));
    }
    leftZCm = rightZCm;
    leftForceN = rightForceN;
  }
  if (Math.abs(leftForceN) <= rootToleranceN) roots.push(maximumZCm);
  return roots.filter((root, index) =>
    index === 0 || Math.abs(root - roots[index - 1]!) > 1e-5
  );
}

function staticNetWallForceN(
  input: {
    readonly laVolumeMl: number;
    readonly lvVolumeMl: number;
    readonly avPlanePositionCm: number;
    readonly laActivation01: number;
    readonly lvActivation01: number;
    readonly pericardialPressureMmHg: number;
  },
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): number {
  const chamberInput = (
    bloodVolumeMl: number,
    activation01: number,
    wallParams: WorkConjugateAVPlaneChamberWallParamsV1,
  ) => evaluateWorkConjugateAVPlaneChamberWallV1({
    bloodVolumeMl,
    bloodVolumeDotMlPerSec: 0,
    avPlanePositionCm: input.avPlanePositionCm,
    avPlaneVelocityCmPerSec: 0,
    activation01,
    pericardialPressureKPa: input.pericardialPressureMmHg /
      WORK_CONJUGATE_AV_PLANE_KPA_TO_MMHG_V1,
  }, wallParams);
  const la = chamberInput(input.laVolumeMl, input.laActivation01, params.laWall);
  const lv = chamberInput(input.lvVolumeMl, input.lvActivation01, params.lvWall);
  return la.zForceN.total + lv.zForceN.total;
}

function envelopeCase(
  caseId: WorkConjugateAtrialAVPlaneEnvelopeCaseV1["caseId"],
  heartRateBpm: WorkConjugateAtrialAVPlaneEnvelopeCaseV1["heartRateBpm"],
  profile: WorkConjugateAtrialAVPlaneProfileV1,
): WorkConjugateAtrialAVPlaneEnvelopeCaseV1 {
  return {
    caseId,
    heartRateBpm,
    finite: profile.allFinite,
    allStepsConverged: profile.allStepsConverged,
    allAcceptedSteps: profile.allAcceptedSteps,
    periodicSteadyState: profile.periodicSteadyState,
    beatsSimulated: profile.beatsSimulated,
    cycleClosure: profile.cycleClosure,
    laPvLobeStatus: profile.laPvLobes.status,
    laPvLobeReason: profile.laPvLobes.reason,
    mitralPeakEToARatio: profile.mitral.peakEToARatio,
    mitralVtiEToARatio: profile.mitral.vtiEToARatio,
    pulmonaryVenousSToDRatio: profile.pulmonaryVenous.sToDRatio,
    xDescentDepthMmHg: profile.xvyPressureReadback.xDescentDepthMmHg,
    yDescentDepthMmHg: profile.xvyPressureReadback.yDescentDepthMmHg,
    maxNormalizedEquationResidual:
      profile.residualExtrema.maxNormalizedEquationResidual,
  };
}

function residualExtremaFor(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
): WorkConjugateAtrialAVPlaneProfileV1["residualExtrema"] {
  return {
    maxAbsMassResidualMl: maxOf(samples.flatMap((sample) => [
      Math.abs(sample.residual.laMassResidualMl),
      Math.abs(sample.residual.lvMassResidualMl),
    ])),
    maxAbsClosedCircuitVolumeResidualMl: maxOf(samples.map((sample) =>
      Math.abs(sample.residual.closedCircuitVolumeResidualMl)
    )),
    maxAbsTotalVolumeDriftMl: maxOf(samples.map((sample) =>
      Math.abs(sample.totalClosedCircuitVolumeDriftFromInitialMl)
    )),
    maxAbsAvPlaneKinematicResidualCm: maxOf(samples.map((sample) =>
      Math.abs(sample.residual.avPlaneKinematicResidualCm)
    )),
    maxAbsAvPlaneForceResidualN: maxOf(samples.map((sample) =>
      Math.abs(sample.residual.avPlaneForceResidualN)
    )),
    maxAbsAvForcePowerResidualW: maxOf(samples.map((sample) =>
      Math.abs(sample.avForce.forcePowerResidualW)
    )),
    maxAbsWallRawPowerResidualW: maxOf(samples.flatMap((sample) => [
      Math.abs(sample.power.laWallRawPowerResidualW),
      Math.abs(sample.power.lvWallRawPowerResidualW),
    ])),
    maxAbsCoupledRawPowerResidualW: maxOf(samples.map((sample) =>
      Math.abs(sample.power.coupledRawPowerResidualW)
    )),
    maxAbsPressureAreaIdentityResidualN: maxOf(samples.flatMap((sample) => [
      Math.abs(sample.pressureArea.laPressureAreaIdentityResidualN),
      Math.abs(sample.pressureArea.lvPressureAreaIdentityResidualN),
    ])),
    maxHiddenBloodVolumeSourceMl: maxOf(samples.map((sample) =>
      sample.residual.hiddenBloodVolumeSourceMl
    )) as 0,
    maxNormalizedEquationResidual: maxOf(samples.map((sample) =>
      sample.residual.maxNormalizedEquationResidual
    )),
  };
}

function cycleClosureReadback(
  start: WorkConjugateAVPlaneLeftHeartStateV1,
  end: WorkConjugateAVPlaneLeftHeartStateV1,
  computePass = true,
): WorkConjugateAtrialAVPlaneCycleClosureV1 {
  const closure = {
    laVolumeMl: end.laVolumeMl - start.laVolumeMl,
    lvVolumeMl: end.lvVolumeMl - start.lvVolumeMl,
    laActivation01: end.laActivation01 - start.laActivation01,
    lvActivation01: end.lvActivation01 - start.lvActivation01,
    avPlanePositionCm: end.avPlanePositionCm - start.avPlanePositionCm,
    avPlaneVelocityCmPerSec: end.avPlaneVelocityCmPerSec -
      start.avPlaneVelocityCmPerSec,
    mitralFlowMlPerSec: end.mitralValve.qMlPerSec -
      start.mitralValve.qMlPerSec,
    aorticFlowMlPerSec: end.aorticValve.qMlPerSec -
      start.aorticValve.qMlPerSec,
    pulmonaryVenousPressureMmHg: end.pulmonaryVenousPressureMmHg -
      start.pulmonaryVenousPressureMmHg,
    pulmonaryVenousFlowMlPerSec: end.pulmonaryVenousFlowMlPerSec -
      start.pulmonaryVenousFlowMlPerSec,
    aorticPressureMmHg: end.aorticPressureMmHg - start.aorticPressureMmHg,
    returnReservoirPressureMmHg: end.returnReservoirPressureMmHg -
      start.returnReservoirPressureMmHg,
  };
  const readback = {
    ...closure,
    maxAbsVolumeMl: Math.max(
      Math.abs(closure.laVolumeMl),
      Math.abs(closure.lvVolumeMl),
    ),
    maxAbsPressureMmHg: Math.max(
      Math.abs(closure.pulmonaryVenousPressureMmHg),
      Math.abs(closure.aorticPressureMmHg),
      Math.abs(closure.returnReservoirPressureMmHg),
    ),
    maxAbsFlowMlPerSec: Math.max(
      Math.abs(closure.mitralFlowMlPerSec),
      Math.abs(closure.aorticFlowMlPerSec),
      Math.abs(closure.pulmonaryVenousFlowMlPerSec),
    ),
    maxAbsCoordinateCm: Math.abs(closure.avPlanePositionCm),
    maxAbsVelocityCmPerSec: Math.abs(closure.avPlaneVelocityCmPerSec),
    maxAbsActivation01: Math.max(
      Math.abs(closure.laActivation01),
      Math.abs(closure.lvActivation01),
    ),
  };
  return {
    ...readback,
    pass: computePass &&
      readback.maxAbsVolumeMl <= HARD_GATE_THRESHOLDS_V1.periodicVolumeMl &&
      readback.maxAbsPressureMmHg <= HARD_GATE_THRESHOLDS_V1.periodicPressureMmHg &&
      readback.maxAbsFlowMlPerSec <= HARD_GATE_THRESHOLDS_V1.periodicFlowMlPerSec &&
      readback.maxAbsCoordinateCm <= HARD_GATE_THRESHOLDS_V1.periodicCoordinateCm &&
      readback.maxAbsVelocityCmPerSec <= HARD_GATE_THRESHOLDS_V1.periodicVelocityCmPerSec &&
      readback.maxAbsActivation01 <= HARD_GATE_THRESHOLDS_V1.periodicActivation01,
  };
}

function analyzeMitralInflow(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  openingIndex: number,
  closureIndex: number,
  preAIndex: number,
  dtSec: number,
  cycleLengthSec: number,
): WorkConjugateAtrialAVPlaneMitralReadbackV1 {
  const sequence: UnwrappedMitralSampleV1[] = [];
  for (let offset = 0; offset <= samples.length; offset += 1) {
    const index = (openingIndex + offset) % Math.max(samples.length, 1);
    sequence.push({
      index,
      elapsedSec: offset * dtSec,
      sample: samples[index] ?? emptySample(),
    });
    if (offset > 0 && index === closureIndex) break;
  }
  if (sequence.length < 8 || sequence.at(-1)!.elapsedSec > cycleLengthSec) {
    return emptyMitralReadback(samples[preAIndex] ?? emptySample());
  }
  const activationOrdinalRaw = sequence.findIndex(({ index }) => index === preAIndex);
  const activationOrdinal = activationOrdinalRaw > 2
    ? activationOrdinalRaw
    : Math.max(2, Math.floor(sequence.length * 0.70));
  const eSearch = sequence.slice(0, activationOrdinal);
  const aSearch = sequence.slice(activationOrdinal);
  const ePeakOrdinal = maxIndex(eSearch.map(({ sample }) =>
    Math.max(0, sample.mitralVelocityCmPerSec)
  ));
  const aPeakOrdinal = activationOrdinal + maxIndex(aSearch.map(({ sample }) =>
    Math.max(0, sample.mitralVelocityCmPerSec)
  ));
  const ePeakVelocity = maxOf(eSearch.map(({ sample }) =>
    Math.max(0, sample.mitralVelocityCmPerSec)
  ));
  const aPeakVelocity = maxOf(aSearch.map(({ sample }) =>
    Math.max(0, sample.mitralVelocityCmPerSec)
  ));
  if (ePeakVelocity <= 1 || aPeakVelocity <= 1 || ePeakOrdinal >= aPeakOrdinal) {
    return emptyMitralReadback(sequence[activationOrdinal]?.sample ?? emptySample());
  }
  const between = sequence.slice(ePeakOrdinal + 1, aPeakOrdinal);
  const turningOrdinal = between.length
    ? ePeakOrdinal + 1 + minIndex(between.map(({ sample }) =>
      sample.mitralVelocityCmPerSec
    ))
    : ePeakOrdinal;
  const ePeak = sequence[ePeakOrdinal]!.sample;
  const aPeak = sequence[aPeakOrdinal]!.sample;
  const turning = sequence[turningOrdinal]!.sample;
  const activationOnset = sequence[activationOrdinal]!.sample;
  const turningVelocity = Math.max(0, turning.mitralVelocityCmPerSec);
  const distinctPeaks = turningOrdinal > ePeakOrdinal && turningOrdinal < aPeakOrdinal &&
    ePeakVelocity - turningVelocity >= 0.15 * ePeakVelocity &&
    aPeakVelocity - turningVelocity >= 0.15 * aPeakVelocity;
  const velocityAtActivationOnset = Math.max(0, activationOnset.mitralVelocityCmPerSec);
  const fusionClass = !distinctPeaks
    ? "complete-fusion"
    : velocityAtActivationOnset > 5
      ? "partial-fusion"
      : "separated";
  const eVtiEndOrdinal = Math.min(turningOrdinal, activationOrdinal);
  const eVtiCm = integrateMitralSequence(
    sequence,
    0,
    eVtiEndOrdinal,
    ({ sample }) => Math.max(0, sample.mitralVelocityCmPerSec),
  );
  const aVtiCm = integrateMitralSequence(
    sequence,
    activationOrdinal,
    sequence.length - 1,
    ({ sample }) => Math.max(0, sample.mitralVelocityCmPerSec),
  );
  const earlyForwardVolumeMl = integrateMitralSequence(
    sequence,
    0,
    eVtiEndOrdinal,
    ({ sample }) => Math.max(0, sample.qMitralMlPerSec),
  );
  const lateForwardVolumeMl = integrateMitralSequence(
    sequence,
    activationOrdinal,
    sequence.length - 1,
    ({ sample }) => Math.max(0, sample.qMitralMlPerSec),
  );
  const eOnsetOrdinal = waveOnsetOrdinal(sequence, ePeakOrdinal, ePeakVelocity);
  const eAccelerationTimeSec = sequence[ePeakOrdinal]!.elapsedSec -
    sequence[eOnsetOrdinal]!.elapsedSec;
  const eDecelerationTimeSec = projectedEDecelerationTime(
    sequence,
    ePeakOrdinal,
    turningOrdinal,
  );
  const eEndOrdinal = sustainedLowFlowStartOrdinal(
    sequence,
    ePeakOrdinal + 1,
    activationOrdinal,
    5,
    dtSec,
  );
  const diastasisDurationSec = eEndOrdinal >= 0 && eEndOrdinal < activationOrdinal
    ? sequence[activationOrdinal]!.elapsedSec - sequence[eEndOrdinal]!.elapsedSec
    : 0;
  const midDiastolicPeakVelocityCmPerSec = eEndOrdinal >= 0
    ? maxOf(sequence.slice(eEndOrdinal, activationOrdinal + 1).map(({ sample }) =>
      Math.max(0, sample.mitralVelocityCmPerSec)
    ))
    : 0;
  const measurementValid = fusionClass === "separated" &&
    eAccelerationTimeSec > 0 &&
    eVtiCm > 0 &&
    aVtiCm > 0;
  const asymmetryRatio = eDecelerationTimeSec / Math.max(eAccelerationTimeSec, 1e-9);
  return {
    measurementValid,
    fusionClass,
    ePeakFlowMlPerSec: Math.max(0, ePeak.qMitralMlPerSec),
    aPeakFlowMlPerSec: Math.max(0, aPeak.qMitralMlPerSec),
    ePeakVelocityCmPerSec: ePeakVelocity,
    aPeakVelocityCmPerSec: aPeakVelocity,
    peakEToARatio: ePeakVelocity / Math.max(aPeakVelocity, 1e-9),
    eVtiCm,
    aVtiCm,
    vtiEToARatio: eVtiCm / Math.max(aVtiCm, 1e-9),
    earlyForwardVolumeMl,
    lateForwardVolumeMl,
    eAccelerationTimeSec,
    eDecelerationTimeSec,
    eDecelerationToAccelerationRatio: asymmetryRatio,
    eRiseMonotoneFraction: monotoneFraction(sequence, 0, ePeakOrdinal, "rising"),
    eDecayMonotoneFraction: monotoneFraction(
      sequence,
      ePeakOrdinal,
      turningOrdinal,
      "falling",
    ),
    velocityAtAtrialActivationOnsetCmPerSec: velocityAtActivationOnset,
    flowAtAtrialActivationOnsetMlPerSec: Math.max(0, activationOnset.qMitralMlPerSec),
    diastasisDurationSec,
    eaPeakSeparationSec: sequence[aPeakOrdinal]!.elapsedSec -
      sequence[ePeakOrdinal]!.elapsedSec,
    midDiastolicPeakVelocityCmPerSec,
    asymmetryRegime: eWaveAsymmetryRegime(asymmetryRatio, measurementValid),
    ePeakTheta: ePeak.theta,
    aPeakTheta: aPeak.theta,
    activationOnsetTheta: activationOnset.theta,
  };
}

function emptyMitralReadback(
  activationOnset: WorkConjugateAtrialAVPlaneSampleV1,
): WorkConjugateAtrialAVPlaneMitralReadbackV1 {
  return {
    measurementValid: false,
    fusionClass: "not-measurable",
    ePeakFlowMlPerSec: 0,
    aPeakFlowMlPerSec: 0,
    ePeakVelocityCmPerSec: 0,
    aPeakVelocityCmPerSec: 0,
    peakEToARatio: 0,
    eVtiCm: 0,
    aVtiCm: 0,
    vtiEToARatio: 0,
    earlyForwardVolumeMl: 0,
    lateForwardVolumeMl: 0,
    eAccelerationTimeSec: 0,
    eDecelerationTimeSec: 0,
    eDecelerationToAccelerationRatio: 0,
    eRiseMonotoneFraction: 0,
    eDecayMonotoneFraction: 0,
    velocityAtAtrialActivationOnsetCmPerSec: 0,
    flowAtAtrialActivationOnsetMlPerSec: 0,
    diastasisDurationSec: 0,
    eaPeakSeparationSec: 0,
    midDiastolicPeakVelocityCmPerSec: 0,
    asymmetryRegime: "not-measurable",
    ePeakTheta: 0,
    aPeakTheta: 0,
    activationOnsetTheta: activationOnset.theta,
  };
}

function integrateMitralSequence(
  sequence: readonly UnwrappedMitralSampleV1[],
  startOrdinal: number,
  endOrdinal: number,
  value: (sample: UnwrappedMitralSampleV1) => number,
): number {
  let integral = 0;
  for (let i = startOrdinal; i < endOrdinal; i += 1) {
    const a = sequence[i]!;
    const b = sequence[i + 1]!;
    integral += 0.5 * (value(a) + value(b)) * (b.elapsedSec - a.elapsedSec);
  }
  return integral;
}

function projectedEDecelerationTime(
  sequence: readonly UnwrappedMitralSampleV1[],
  peakOrdinal: number,
  turningOrdinal: number,
): number {
  const peak = sequence[peakOrdinal]!;
  const peakVelocity = Math.max(0, peak.sample.mitralVelocityCmPerSec);
  const candidates = sequence.slice(peakOrdinal + 1, turningOrdinal + 1).filter(({ sample }) => {
    const velocity = Math.max(0, sample.mitralVelocityCmPerSec);
    return velocity <= 0.90 * peakVelocity && velocity >= 0.50 * peakVelocity;
  });
  if (candidates.length < 3) return 0;
  const meanTime = candidates.reduce((sum, point) => sum + point.elapsedSec, 0) /
    candidates.length;
  const meanVelocity = candidates.reduce(
    (sum, point) => sum + Math.max(0, point.sample.mitralVelocityCmPerSec),
    0,
  ) / candidates.length;
  let numerator = 0;
  let denominator = 0;
  for (const point of candidates) {
    const centeredTime = point.elapsedSec - meanTime;
    numerator += centeredTime *
      (Math.max(0, point.sample.mitralVelocityCmPerSec) - meanVelocity);
    denominator += centeredTime * centeredTime;
  }
  const slope = numerator / Math.max(denominator, 1e-12);
  if (slope >= -1e-9) return 0;
  const intercept = meanVelocity - slope * meanTime;
  const projectedZeroSec = -intercept / slope;
  const decelerationTimeSec = projectedZeroSec - peak.elapsedSec;
  return decelerationTimeSec > 0 && projectedZeroSec <= sequence.at(-1)!.elapsedSec
    ? decelerationTimeSec
    : 0;
}

function waveOnsetOrdinal(
  sequence: readonly UnwrappedMitralSampleV1[],
  peakOrdinal: number,
  peakVelocityCmPerSec: number,
): number {
  const threshold = Math.max(0.5, 0.05 * peakVelocityCmPerSec);
  for (let i = 0; i < peakOrdinal; i += 1) {
    if (Math.max(0, sequence[i]!.sample.mitralVelocityCmPerSec) >= threshold) return i;
  }
  return 0;
}

function sustainedLowFlowStartOrdinal(
  sequence: readonly UnwrappedMitralSampleV1[],
  startOrdinal: number,
  endOrdinal: number,
  thresholdCmPerSec: number,
  dtSec: number,
): number {
  const required = Math.max(3, Math.ceil(0.015 / Math.max(dtSec, 1e-9)));
  for (let i = startOrdinal; i + required <= endOrdinal + 1; i += 1) {
    let sustained = true;
    for (let j = i; j < i + required; j += 1) {
      if (Math.max(0, sequence[j]!.sample.mitralVelocityCmPerSec) > thresholdCmPerSec) {
        sustained = false;
        break;
      }
    }
    if (sustained) return i;
  }
  return -1;
}

function monotoneFraction(
  sequence: readonly UnwrappedMitralSampleV1[],
  startOrdinal: number,
  endOrdinal: number,
  direction: "rising" | "falling",
): number {
  const peak = maxOf(sequence.slice(startOrdinal, endOrdinal + 1).map(({ sample }) =>
    Math.max(0, sample.mitralVelocityCmPerSec)
  ));
  const tolerance = 0.002 * Math.max(peak, 1);
  let eligible = 0;
  let monotone = 0;
  for (let i = startOrdinal; i < endOrdinal; i += 1) {
    const delta = sequence[i + 1]!.sample.mitralVelocityCmPerSec -
      sequence[i]!.sample.mitralVelocityCmPerSec;
    eligible += 1;
    if (direction === "rising" ? delta >= -tolerance : delta <= tolerance) monotone += 1;
  }
  return eligible > 0 ? monotone / eligible : 0;
}

function eWaveAsymmetryRegime(
  ratio: number,
  measurable: boolean,
): WorkConjugateAtrialAVPlaneMitralReadbackV1["asymmetryRegime"] {
  if (!measurable) return "not-measurable";
  if (ratio < 2.64) return "underdamped";
  if (ratio <= 3.78) return "transition";
  return "overdamped";
}

function pathOrderFraction(
  path: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  reference: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  relation: "below" | "above",
  minimumProgress01: number,
  maximumProgress01: number,
): number {
  if (path.length < 3 || reference.length < 2) return 0;
  const progress = normalizedArcProgress(path);
  const eligible = path.flatMap((sample, index) => {
    if (index === 0 || index === path.length - 1) return [];
    const progress01 = progress[index]!;
    if (progress01 < minimumProgress01 || progress01 > maximumProgress01) return [];
    const pressure = pathPressureEnvelopeAtVolume(
      reference,
      sample.laVolumeMl,
      relation === "below" ? "lower" : "upper",
    );
    return pressure === undefined ? [] : [{ sample, pressure }];
  });
  if (eligible.length === 0) return 0;
  return eligible.filter(({ sample, pressure }) => relation === "below"
    ? sample.laPressureMmHg <= pressure
    : sample.laPressureMmHg >= pressure).length / eligible.length;
}

function pathPressureEnvelopeAtVolume(
  path: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  volumeMl: number,
  envelope: "lower" | "upper",
): number | undefined {
  const candidates: number[] = [];
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const lo = Math.min(a.laVolumeMl, b.laVolumeMl);
    const hi = Math.max(a.laVolumeMl, b.laVolumeMl);
    if (volumeMl < lo || volumeMl > hi) continue;
    const deltaVolume = b.laVolumeMl - a.laVolumeMl;
    if (Math.abs(deltaVolume) <= 1e-9) {
      candidates.push(a.laPressureMmHg, b.laPressureMmHg);
      continue;
    }
    const alpha = (volumeMl - a.laVolumeMl) / deltaVolume;
    candidates.push(a.laPressureMmHg + alpha * (b.laPressureMmHg - a.laPressureMmHg));
  }
  if (!candidates.length) return undefined;
  return envelope === "lower" ? Math.min(...candidates) : Math.max(...candidates);
}

function pathIntersections(
  pathA: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  pathB: readonly WorkConjugateAtrialAVPlaneSampleV1[],
): readonly PathIntersectionV1[] {
  if (pathA.length < 2 || pathB.length < 2) return [];
  const combined = [...pathA, ...pathB];
  const volumeRange = Math.max(
    maxOf(combined.map((sample) => sample.laVolumeMl)) -
      minOf(combined.map((sample) => sample.laVolumeMl)),
    1e-9,
  );
  const pressureRange = Math.max(
    maxOf(combined.map((sample) => sample.laPressureMmHg)) -
      minOf(combined.map((sample) => sample.laPressureMmHg)),
    1e-9,
  );
  const progressA = normalizedArcProgress(pathA, volumeRange, pressureRange);
  const progressB = normalizedArcProgress(pathB, volumeRange, pressureRange);
  const intersections: PathIntersectionV1[] = [];
  for (let i = 0; i < pathA.length - 1; i += 1) {
    for (let j = 0; j < pathB.length - 1; j += 1) {
      const a = pathA[i]!;
      const b = pathA[i + 1]!;
      const c = pathB[j]!;
      const d = pathB[j + 1]!;
      const intersection = segmentIntersection(a, b, c, d);
      if (!intersection) continue;
      const tangentA = [
        (b.laVolumeMl - a.laVolumeMl) / volumeRange,
        (b.laPressureMmHg - a.laPressureMmHg) / pressureRange,
      ];
      const tangentB = [
        (d.laVolumeMl - c.laVolumeMl) / volumeRange,
        (d.laPressureMmHg - c.laPressureMmHg) / pressureRange,
      ];
      const denominator = Math.max(
        Math.hypot(tangentA[0]!, tangentA[1]!) *
          Math.hypot(tangentB[0]!, tangentB[1]!),
        1e-12,
      );
      const cosine = Math.min(1, Math.abs(
        (tangentA[0]! * tangentB[0]! + tangentA[1]! * tangentB[1]!) /
          denominator,
      ));
      intersections.push({
        pathAProgress01: progressA[i]! + intersection.t *
          (progressA[i + 1]! - progressA[i]!),
        pathBProgress01: progressB[j]! + intersection.u *
          (progressB[j + 1]! - progressB[j]!),
        volumeMl: a.laVolumeMl + intersection.t * (b.laVolumeMl - a.laVolumeMl),
        pressureMmHg: a.laPressureMmHg +
          intersection.t * (b.laPressureMmHg - a.laPressureMmHg),
        angleDeg: Math.acos(cosine) * 180 / Math.PI,
      });
    }
  }
  return intersections;
}

function selectFigureEightCrossing(
  reservoirConduit: readonly PathIntersectionV1[],
  reservoirPumping: readonly PathIntersectionV1[],
): FigureEightCrossingV1 | undefined {
  const candidates = [
    ...reservoirConduit.map((intersection) => ({
      source: "conduit" as const,
      intersection,
      distanceFromPhaseBoundary: 1 - intersection.pathBProgress01,
      preferredWindow: intersection.pathBProgress01 >= 0.5,
    })),
    ...reservoirPumping.map((intersection) => ({
      source: "pumping" as const,
      intersection,
      distanceFromPhaseBoundary: intersection.pathBProgress01,
      preferredWindow: intersection.pathBProgress01 <= 0.5,
    })),
  ];
  if (candidates.length === 0) return undefined;
  const preferred = candidates.filter((candidate) => candidate.preferredWindow);
  const selected = [...(preferred.length ? preferred : candidates)].sort((a, b) =>
    a.distanceFromPhaseBoundary - b.distanceFromPhaseBoundary
  )[0]!;
  return {
    source: selected.source,
    phase: selected.preferredWindow
      ? selected.source === "conduit" ? "late-conduit" : "early-pumping"
      : "outside-preferred-window",
    pathProgress01: selected.intersection.pathBProgress01,
    volumeMl: selected.intersection.volumeMl,
    pressureMmHg: selected.intersection.pressureMmHg,
    angleDeg: selected.intersection.angleDeg,
    preferredWindow: selected.preferredWindow,
  };
}

function segmentIntersection(
  a: WorkConjugateAtrialAVPlaneSampleV1,
  b: WorkConjugateAtrialAVPlaneSampleV1,
  c: WorkConjugateAtrialAVPlaneSampleV1,
  d: WorkConjugateAtrialAVPlaneSampleV1,
): { readonly t: number; readonly u: number } | undefined {
  const rx = b.laVolumeMl - a.laVolumeMl;
  const ry = b.laPressureMmHg - a.laPressureMmHg;
  const sx = d.laVolumeMl - c.laVolumeMl;
  const sy = d.laPressureMmHg - c.laPressureMmHg;
  const denominator = cross2d(rx, ry, sx, sy);
  if (Math.abs(denominator) <= 1e-12) return undefined;
  const qpx = c.laVolumeMl - a.laVolumeMl;
  const qpy = c.laPressureMmHg - a.laPressureMmHg;
  const t = cross2d(qpx, qpy, sx, sy) / denominator;
  const u = cross2d(qpx, qpy, rx, ry) / denominator;
  if (t < 0 || t > 1 || u < 0 || u > 1) return undefined;
  return { t, u };
}

function phaseSlices(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  closureIndex: number,
  openingIndex: number,
  preAIndex: number,
) {
  return {
    reservoir: samples.slice(Math.max(0, closureIndex), Math.max(closureIndex, openingIndex) + 1),
    conduit: samples.slice(Math.max(0, openingIndex), Math.max(openingIndex, preAIndex) + 1),
    pumping: [
      ...samples.slice(Math.max(0, preAIndex)),
      ...samples.slice(0, Math.max(0, closureIndex) + 1),
    ],
  };
}

type ConductanceMidpointEventV1 = {
  /** First discrete sample on the far side of the crossing. */
  readonly index: number;
  /** Linearly interpolated openFraction=0.5 crossing, or fallback sample. */
  readonly theta: number;
  readonly laPressureMmHg: number;
  readonly qAorticMlPerSec: number;
  readonly measurementStatus: "threshold-crossing" | "fallback-extremum";
};

function findMitralClosingConductanceMidpoint(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
): ConductanceMidpointEventV1 {
  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index]!.theta > 0.30) break;
    if (
      samples[index - 1]!.mitralOpen01 >= 0.5 &&
      samples[index]!.mitralOpen01 < 0.5
    ) {
      return interpolatedConductanceMidpointEvent(
        samples,
        index,
        samples[index - 1]!.mitralOpen01,
        samples[index]!.mitralOpen01,
      );
    }
  }
  const end = Math.max(1, Math.round(samples.length * 0.3));
  const index = minIndex(
    samples.slice(0, end).map((sample) => sample.mitralOpen01),
  );
  return fallbackConductanceMidpointEvent(samples, index);
}

function findMitralOpeningConductanceMidpoint(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  closureIndex: number,
): ConductanceMidpointEventV1 {
  for (
    let index = Math.max(closureIndex + 1, 1);
    index < samples.length;
    index += 1
  ) {
    if (samples[index]!.theta < 0.20) continue;
    if (
      samples[index - 1]!.mitralOpen01 < 0.5 &&
      samples[index]!.mitralOpen01 >= 0.5
    ) {
      return interpolatedConductanceMidpointEvent(
        samples,
        index,
        samples[index - 1]!.mitralOpen01,
        samples[index]!.mitralOpen01,
      );
    }
  }
  const start = Math.max(closureIndex + 1, Math.round(samples.length * 0.2));
  const end = Math.max(start + 1, Math.round(samples.length * 0.7));
  const index = start + maxIndex(
    samples.slice(start, end).map((sample) => sample.mitralOpen01),
  );
  return fallbackConductanceMidpointEvent(samples, index);
}

function findAorticOpening(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  mitralClosureIndex: number,
  mitralOpeningIndex: number,
): ConductanceMidpointEventV1 {
  const start = Math.max(1, mitralClosureIndex + 1);
  const end = Math.max(start + 1, mitralOpeningIndex);
  for (let index = start; index <= end && index < samples.length; index += 1) {
    if (
      samples[index - 1]!.aorticOpen01 < 0.5 &&
      samples[index]!.aorticOpen01 >= 0.5
    ) {
      return interpolatedConductanceMidpointEvent(
        samples,
        index,
        samples[index - 1]!.aorticOpen01,
        samples[index]!.aorticOpen01,
      );
    }
  }
  const window = samples.slice(start, Math.min(end + 1, samples.length));
  const index = window.length > 0
    ? start + maxIndex(window.map((sample) => sample.aorticOpen01))
    : Math.min(Math.max(mitralClosureIndex, 0), samples.length - 1);
  return fallbackConductanceMidpointEvent(samples, index);
}

function findAorticClosure(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  aorticOpeningIndex: number,
  mitralOpeningIndex: number,
): ConductanceMidpointEventV1 {
  const start = Math.max(1, aorticOpeningIndex + 1);
  const end = Math.max(start + 1, mitralOpeningIndex);
  for (let index = start; index <= end && index < samples.length; index += 1) {
    if (
      samples[index - 1]!.aorticOpen01 >= 0.5 &&
      samples[index]!.aorticOpen01 < 0.5
    ) {
      return interpolatedConductanceMidpointEvent(
        samples,
        index,
        samples[index - 1]!.aorticOpen01,
        samples[index]!.aorticOpen01,
      );
    }
  }
  const window = samples.slice(start, Math.min(end + 1, samples.length));
  const index = window.length > 0
    ? start + minIndex(window.map((sample) => sample.aorticOpen01))
    : Math.min(Math.max(aorticOpeningIndex, 0), samples.length - 1);
  return fallbackConductanceMidpointEvent(samples, index);
}

function interpolatedConductanceMidpointEvent(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  index: number,
  previousConductance01: number,
  currentConductance01: number,
): ConductanceMidpointEventV1 {
  const previous = samples[index - 1] ?? emptySample();
  const current = samples[index] ?? previous;
  const delta = currentConductance01 - previousConductance01;
  const rawFraction = Math.abs(delta) < 1e-15
    ? 1
    : (0.5 - previousConductance01) / delta;
  const fraction = Math.min(1, Math.max(0, rawFraction));
  return {
    index,
    theta: linearInterpolate(previous.theta, current.theta, fraction),
    laPressureMmHg: linearInterpolate(
      previous.laPressureMmHg,
      current.laPressureMmHg,
      fraction,
    ),
    qAorticMlPerSec: linearInterpolate(
      previous.qAorticMlPerSec,
      current.qAorticMlPerSec,
      fraction,
    ),
    measurementStatus: "threshold-crossing",
  };
}

function fallbackConductanceMidpointEvent(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  index: number,
): ConductanceMidpointEventV1 {
  const boundedIndex = Math.min(
    Math.max(index, 0),
    Math.max(samples.length - 1, 0),
  );
  const sample = samples[boundedIndex] ?? emptySample();
  return {
    index: boundedIndex,
    theta: sample.theta,
    laPressureMmHg: sample.laPressureMmHg,
    qAorticMlPerSec: sample.qAorticMlPerSec,
    measurementStatus: "fallback-extremum",
  };
}

function interpolatedSampleValueAtTheta(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  theta: number,
  valueOf: (sample: WorkConjugateAtrialAVPlaneSampleV1) => number,
): number {
  if (samples.length === 0) return valueOf(emptySample());
  if (theta <= samples[0]!.theta) return valueOf(samples[0]!);
  for (let index = 1; index < samples.length; index += 1) {
    const current = samples[index]!;
    if (current.theta < theta) continue;
    const previous = samples[index - 1]!;
    const deltaTheta = current.theta - previous.theta;
    const fraction = Math.abs(deltaTheta) < 1e-15
      ? 1
      : (theta - previous.theta) / deltaTheta;
    return linearInterpolate(valueOf(previous), valueOf(current), fraction);
  }
  return valueOf(samples.at(-1)!);
}

function linearInterpolate(
  start: number,
  end: number,
  fraction: number,
): number {
  return start + fraction * (end - start);
}

function findAorticForwardFlowBoundary(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  searchStartIndex: number,
  searchEndIndex: number,
  boundary: "start" | "end",
): {
  readonly index: number;
  readonly theta: number;
  readonly measurementStatus:
    "linear-zero-crossing" | "fallback-nearest-zero";
} {
  const start = Math.max(1, searchStartIndex + 1);
  const end = Math.min(
    samples.length - 1,
    Math.max(start, searchEndIndex),
  );
  for (let index = start; index <= end; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    const crosses = boundary === "start"
      ? previous.qAorticMlPerSec <= 0 && current.qAorticMlPerSec > 0
      : previous.qAorticMlPerSec > 0 && current.qAorticMlPerSec <= 0;
    if (!crosses) continue;
    const deltaFlow = current.qAorticMlPerSec - previous.qAorticMlPerSec;
    const fraction = Math.abs(deltaFlow) < 1e-15
      ? 1
      : -previous.qAorticMlPerSec / deltaFlow;
    return {
      index,
      theta: previous.theta + fraction * (current.theta - previous.theta),
      measurementStatus: "linear-zero-crossing",
    };
  }
  const window = samples.slice(start, end + 1);
  const offset = minIndex(window.map((sample) =>
    Math.abs(sample.qAorticMlPerSec)
  ));
  const index = window.length > 0
    ? start + offset
    : Math.min(Math.max(searchStartIndex, 0), samples.length - 1);
  return {
    index,
    theta: samples[index]?.theta ?? 0,
    measurementStatus: "fallback-nearest-zero",
  };
}

function firstIndexAtOrAfterTime(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  timeSec: number,
): number {
  const index = samples.findIndex((sample) => sample.tSec >= timeSec);
  return index >= 0 ? index : Math.max(0, samples.length - 1);
}

function normalizedArcProgress(
  points: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  volumeScale?: number,
  pressureScale?: number,
): readonly number[] {
  const effectiveVolumeScale = volumeScale ?? Math.max(
    maxOf(points.map((point) => point.laVolumeMl)) -
      minOf(points.map((point) => point.laVolumeMl)),
    1e-9,
  );
  const effectivePressureScale = pressureScale ?? Math.max(
    maxOf(points.map((point) => point.laPressureMmHg)) -
      minOf(points.map((point) => point.laPressureMmHg)),
    1e-9,
  );
  const cumulative = [0];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    cumulative.push(cumulative[i - 1]! + Math.hypot(
      (b.laVolumeMl - a.laVolumeMl) / effectiveVolumeScale,
      (b.laPressureMmHg - a.laPressureMmHg) / effectivePressureScale,
    ));
  }
  const total = Math.max(cumulative.at(-1)!, 1e-12);
  return cumulative.map((value) => value / total);
}

function phaseFor(
  mitralOpen01: number,
  tSec: number,
  laEventOnsetSec: number,
): WorkConjugateAtrialAVPlanePhaseV1 {
  if (tSec >= laEventOnsetSec) return "pumping";
  if (mitralOpen01 <= 0.35) return "reservoir";
  if (mitralOpen01 >= 0.65) return "conduit";
  return "transition";
}

function activationDurationSec(
  duration: WorkConjugateAtrialAVPlaneActivationTimingV1["lvDuration"],
  cycleLengthSec: number,
): number {
  return duration.kind === "cycle-fraction"
    ? duration.value * cycleLengthSec
    : duration.value;
}

function activationStartSec(
  start: WorkConjugateAtrialAVPlaneActivationTimingV1["laStart"],
  cycleLengthSec: number,
): number {
  return start.kind === "cycle-fraction"
    ? start.value * cycleLengthSec
    : cycleLengthSec - start.value;
}

function periodicActivationEvents(
  eventTimeWithinCycleSec: number,
  cycleLengthSec: number,
  params: EventDrivenContractileActivationParamsV1,
  futureBeatCount: number,
): readonly ElectricalActivationEventV1[] {
  const tailWindowSec = params.electricalToCalciumDelaySec + Math.max(
    EVENT_HISTORY_DECAY_TAU_MULTIPLES_V1 *
      params.calciumKernel.decayTauSec,
    EVENT_HISTORY_RISE_TAU_MULTIPLES_V1 *
      params.calciumKernel.riseTauSec,
  );
  const historyBeatCount = Math.max(
    1,
    Math.ceil((tailWindowSec + eventTimeWithinCycleSec) / cycleLengthSec),
  );
  const events: ElectricalActivationEventV1[] = [];
  for (let beat = -historyBeatCount; beat <= futureBeatCount; beat += 1) {
    events.push({ timeSec: beat * cycleLengthSec + eventTimeWithinCycleSec });
  }
  return events;
}

function firstActivePulseStepIndex(
  stepsPerBeat: number,
  dtSec: number,
  startSec: number,
  durationSec: number,
): number {
  for (let step = 0; step < stepsPerBeat; step += 1) {
    if (pulse(step * dtSec, startSec, durationSec) > 0) return step;
  }
  throw new RangeError("LA activation pulse must overlap the sampled cycle");
}

function pulse(tSec: number, startSec: number, durationSec: number): number {
  return tSec >= startSec && tSec < startSec + durationSec ? 1 : 0;
}

function totalClosedCircuitVolumeMl(
  state: WorkConjugateAVPlaneLeftHeartStateV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): number {
  return state.laVolumeMl + state.lvVolumeMl +
    params.pulmonaryVenousComplianceMlPerMmHg * state.pulmonaryVenousPressureMmHg +
    params.aorticComplianceMlPerMmHg * state.aorticPressureMmHg +
    params.returnReservoirComplianceMlPerMmHg * state.returnReservoirPressureMmHg;
}

function integrateSamples(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  dtSec: number,
  value: (sample: WorkConjugateAtrialAVPlaneSampleV1) => number,
): number {
  if (samples.length < 2) return 0;
  let integral = 0;
  for (let i = 0; i < samples.length - 1; i += 1) {
    integral += 0.5 * (value(samples[i]!) + value(samples[i + 1]!)) * dtSec;
  }
  return integral;
}

function forwardCycleElapsedSec(
  fromTheta: number,
  toTheta: number,
  cycleLengthSec: number,
): number {
  const forwardTheta = ((toTheta - fromTheta) % 1 + 1) % 1;
  return forwardTheta * cycleLengthSec;
}

function wrapTheta(theta: number): number {
  return ((theta % 1) + 1) % 1;
}

function nonIncreasingPressureFraction(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  dtSec: number,
): number {
  if (samples.length < 2) return 0;
  const toleranceMmHg = 2 * dtSec;
  let nonIncreasing = 0;
  for (let index = 0; index + 1 < samples.length; index += 1) {
    if (
      samples[index + 1]!.laPressureMmHg -
      samples[index]!.laPressureMmHg <= toleranceMmHg
    ) {
      nonIncreasing += 1;
    }
  }
  return nonIncreasing / (samples.length - 1);
}

function secondaryPressureRiseMmHg(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
): number {
  if (samples.length < 2) return 0;
  let runningMinimum = samples[0]!.laPressureMmHg;
  let maximumRise = 0;
  for (const sample of samples.slice(1)) {
    maximumRise = Math.max(maximumRise, sample.laPressureMmHg - runningMinimum);
    runningMinimum = Math.min(runningMinimum, sample.laPressureMmHg);
  }
  return maximumRise;
}

function sampleFinite(sample: WorkConjugateAtrialAVPlaneSampleV1): boolean {
  return numericValues(sample).every(Number.isFinite);
}

function numericValues(value: unknown): readonly number[] {
  if (typeof value === "number") return [value];
  if (Array.isArray(value)) return value.flatMap(numericValues);
  if (value != null && typeof value === "object") {
    return Object.values(value).flatMap(numericValues);
  }
  return [];
}

function range(values: readonly number[]): readonly [number, number] {
  return values.length ? [minOf(values), maxOf(values)] : [0, 0];
}

function minOf(values: readonly number[]): number {
  return values.length ? Math.min(...values) : 0;
}

function maxOf(values: readonly number[]): number {
  return values.length ? Math.max(...values) : 0;
}

function meanOf(values: readonly number[]): number {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function minIndex(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let best = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i]! < values[best]!) best = i;
  }
  return best;
}

function maxIndex(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let best = 0;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i]! > values[best]!) best = i;
  }
  return best;
}

function minSample(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  value: (sample: WorkConjugateAtrialAVPlaneSampleV1) => number,
): WorkConjugateAtrialAVPlaneSampleV1 {
  return samples.length ? samples[minIndex(samples.map(value))]! : emptySample();
}

function maxSample(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  value: (sample: WorkConjugateAtrialAVPlaneSampleV1) => number,
): WorkConjugateAtrialAVPlaneSampleV1 {
  return samples.length ? samples[maxIndex(samples.map(value))]! : emptySample();
}

function cross2d(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

function breakdown(
  value: WorkConjugateAVPlaneComponentBreakdownV1,
): WorkConjugateAtrialAVPlaneComponentV1 {
  return {
    passive: value.passive,
    active: value.active,
    viscous: value.viscous,
    total: value.total,
  };
}

function axisForce(
  value: WorkConjugateAVPlaneZForceAxisDecompositionV1,
): WorkConjugateAtrialAVPlaneAxisForceV1 {
  return {
    circumferentialPressureAreaForceN: breakdown(value.circumferentialPressureAreaForceN),
    circumferentialStressForceN: breakdown(value.circumferentialStressForceN),
    longitudinalStressForceN: breakdown(value.longitudinalStressForceN),
    reconstructedTotalForceN: breakdown(value.reconstructedTotalForceN),
    circumferentialPressureAreaResidualN: breakdown(value.circumferentialPressureAreaResidualN),
    maxAbsCircumferentialPressureAreaResidualN:
      value.maxAbsCircumferentialPressureAreaResidualN,
    rawTotalForceResidualN: value.rawTotalForceResidualN,
  };
}

function variant(
  variants: readonly WorkConjugateAtrialAVPlaneVariantV1[],
  variantId: WorkConjugateAtrialAVPlaneVariantIdV1,
): WorkConjugateAtrialAVPlaneVariantV1 {
  const row = variants.find((candidate) => candidate.variantId === variantId);
  if (!row) throw new Error(`missing variant ${variantId}`);
  return row;
}

function acceptedStepFor(output: WorkConjugateAVPlaneLeftHeartOutputV1): boolean {
  const maybeAccepted = (output as WorkConjugateAVPlaneLeftHeartOutputV1 & {
    readonly acceptedStep?: unknown;
  }).acceptedStep;
  return typeof maybeAccepted === "boolean"
    ? maybeAccepted
    : output.allFinite && output.residual.solverConverged;
}

function emptySample(): WorkConjugateAtrialAVPlaneSampleV1 {
  const zero: WorkConjugateAtrialAVPlaneComponentV1 = {
    passive: 0,
    active: 0,
    viscous: 0,
    total: 0,
  };
  const axis: WorkConjugateAtrialAVPlaneAxisForceV1 = {
    circumferentialPressureAreaForceN: zero,
    circumferentialStressForceN: zero,
    longitudinalStressForceN: zero,
    reconstructedTotalForceN: zero,
    circumferentialPressureAreaResidualN: zero,
    maxAbsCircumferentialPressureAreaResidualN: 0,
    rawTotalForceResidualN: 0,
  };
  return {
    tSec: 0,
    theta: 0,
    phase: "transition",
    laVolumeMl: 0,
    lvVolumeMl: 0,
    laPressureMmHg: 0,
    lvPressureMmHg: 0,
    pulmonaryVenousPressureMmHg: 0,
    aorticPressureMmHg: 0,
    returnReservoirPressureMmHg: 0,
    qPulmonaryVenousMlPerSec: 0,
    qPulmonarySourceMlPerSec: 0,
    qMitralMlPerSec: 0,
    qAorticMlPerSec: 0,
    qSystemicMlPerSec: 0,
    mitralOpen01: 0,
    aorticOpen01: 0,
    mitralVelocityCmPerSec: 0,
    avPlanePositionCm: 0,
    avPlaneVelocityCmPerSec: 0,
    laElectricalActivation01: 0,
    lvElectricalActivation01: 0,
    laActivationDrive01: 0,
    lvActivationDrive01: 0,
    laCalciumDrive: null,
    laActivation01: 0,
    lvActivation01: 0,
    laActiveTransmuralPressureMmHg: 0,
    laZForceN: zero,
    lvZForceN: zero,
    laZForceAxisN: axis,
    lvZForceAxisN: axis,
    laStressKPa: { circumferential: zero, longitudinal: zero },
    lvStressKPa: { circumferential: zero, longitudinal: zero },
    avForce: {
      order: "quasistatic",
      laWallForceN: 0,
      lvWallForceN: 0,
      wallForceSumN: 0,
      externalDampingForceN: 0,
      beInertialForceN: 0,
      forceResidualN: 0,
      forcePowerResidualW: 0,
    },
    power: {
      laWallRawPowerResidualW: 0,
      lvWallRawPowerResidualW: 0,
      externalDampingPowerW: 0,
      beInertialPowerW: 0,
      coupledRawPowerResidualW: 0,
    },
    residual: {
      laMassResidualMl: 0,
      lvMassResidualMl: 0,
      avPlaneKinematicResidualCm: 0,
      avPlaneForceResidualN: 0,
      closedCircuitVolumeResidualMl: 0,
      totalClosedCircuitVolumeDeltaMl: 0,
      hiddenBloodVolumeSourceMl: 0,
      maxNormalizedEquationResidual: 0,
      solverConverged: false,
      physicalResiduals: [],
      normalizedResiduals: [],
    },
    pressureArea: {
      laPressureAreaIdentityResidualN: 0,
      lvPressureAreaIdentityResidualN: 0,
    },
    allFinite: true,
    solverConverged: false,
    acceptedStep: false,
    totalClosedCircuitVolumeMl: 0,
    totalClosedCircuitVolumeDriftFromInitialMl: 0,
  };
}
