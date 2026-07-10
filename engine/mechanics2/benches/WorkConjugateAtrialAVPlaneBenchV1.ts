import {
  DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
  estimateStaticNetForceDerivativeNPerCmV1,
  initialWorkConjugateAVPlaneLeftHeartStateV1,
  stepWorkConjugateAVPlaneLeftHeartV1,
  workConjugateAVPlaneCoordinateInertiaNSec2PerCmFromPhysicalMassKgV1,
  type WorkConjugateAVPlaneLeftHeartOutputV1,
  type WorkConjugateAVPlaneLeftHeartParamsV1,
  type WorkConjugateAVPlaneLeftHeartStateV1,
  type WorkConjugateAVPlaneOrderV1,
} from "@/engine/mechanics2/subsystems/WorkConjugateAVPlaneLeftHeartV1";
import type {
  WorkConjugateAVPlaneAxisParamsV1,
  WorkConjugateAVPlaneComponentBreakdownV1,
  WorkConjugateAVPlaneZForceAxisDecompositionV1,
} from "@/engine/mechanics2/atrial/WorkConjugateAVPlaneChamberWallV1";
import {
  measureLaPvTwoLobesV2,
  signedLaPvLoopAreaV2,
  type LaPvLobeMeasurementReasonV2,
  type LaPvLobeMeasurementStatusV2,
  type LaPvSelfIntersectionSummaryV2,
} from "@/engine/mechanics2/diagnostics/LaPvLobeMeasurementV2";

export const WORK_CONJUGATE_ATRIAL_AV_PLANE_REPORT_ID_V1 =
  "work-conjugate-atrial-av-plane-report-v1" as const;
export const WORK_CONJUGATE_ATRIAL_AV_PLANE_ARTIFACT_TRACE_STRIDE_V1 = 4 as const;

export type WorkConjugateAtrialAVPlaneVariantIdV1 =
  | "canonical-quasistatic-wall-viscous"
  | "physical-inertial-30g"
  | "legacy-inherited-inertia-m1p1-negative-control"
  | "atrial-active-off-control"
  | "higher-wall-viscosity-topology-control"
  | "activation-timing-sensitivity";

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
  readonly tSec: number;
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
  readonly laElectricalActivation01: number;
  readonly lvElectricalActivation01: number;
  readonly laActivation01: number;
  readonly lvActivation01: number;
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
  readonly xvyPressureReadback: {
    readonly mvcTheta: number;
    readonly mvcLaPressureMmHg: number;
    readonly xTheta: number;
    readonly xPressureMmHg: number;
    readonly xDescentDepthMmHg: number;
    readonly vTheta: number;
    readonly vPressureMmHg: number;
    readonly vWaveRiseMmHg: number;
    readonly mvoTheta: number;
    readonly mvoLaPressureMmHg: number;
    readonly yTheta: number;
    readonly yPressureMmHg: number;
    readonly yDescentDepthMmHg: number;
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
    | "activation-timing-diagnostic";
  readonly description: string;
  readonly activationTiming: WorkConjugateAtrialAVPlaneActivationTimingV1;
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
  readonly laActivation01: number;
  readonly lvActivation01: number;
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
    readonly mvc: number;
    readonly xTrough: number;
    readonly vPeak: number;
    readonly mvo: number;
    readonly yTrough: number;
    readonly ePeak: number;
    readonly aPeak: number;
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

export type WorkConjugateAtrialAVPlaneArtifactReportV1 =
  Omit<WorkConjugateAtrialAVPlaneReportV1, "variants"> & {
    readonly variants: readonly WorkConjugateAtrialAVPlaneArtifactVariantV1[];
  };

type VariantSpecV1 = {
  readonly variantId: WorkConjugateAtrialAVPlaneVariantIdV1;
  readonly role: WorkConjugateAtrialAVPlaneVariantV1["role"];
  readonly description: string;
  readonly activationTiming?: WorkConjugateAtrialAVPlaneActivationTimingV1;
  readonly params: WorkConjugateAVPlaneLeftHeartParamsV1;
};

type RunProfileConfigV1 = {
  readonly profileId: string;
  readonly variantId: WorkConjugateAtrialAVPlaneVariantIdV1;
  readonly params: WorkConjugateAVPlaneLeftHeartParamsV1;
  readonly activationTiming?: WorkConjugateAtrialAVPlaneActivationTimingV1;
  readonly heartRateBpm?: 60 | 75 | 100;
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
    });
    return {
      variantId: spec.variantId,
      role: spec.role,
      description: spec.description,
      activationTiming: spec.activationTiming ?? DEFAULT_ACTIVATION_TIMING_V1,
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
  const physical30g = variant(variants, "physical-inertial-30g");
  const legacy = variant(variants, "legacy-inherited-inertia-m1p1-negative-control");
  const envelope = buildEnvelope(canonical.profile);
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
        ? "Use the SVGs for owner morphology review; do not promote runtime wiring or clinical claims from this sidecar report."
        : "Fix only the failed hard-gate mechanics/conservation issue before visual morphology review.",
      blockedClaims: [
        "LeftHeartSubsystemV2-runtime-wiring",
        "full-four-chamber-validation",
        "clinical-fit",
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

export function projectWorkConjugateAtrialAVPlaneArtifactV1(
  report: WorkConjugateAtrialAVPlaneReportV1,
): WorkConjugateAtrialAVPlaneArtifactReportV1 {
  return {
    ...report,
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
    laActivation01: sample.laActivation01,
    lvActivation01: sample.lvActivation01,
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
      mvc: -1,
      xTrough: -1,
      vPeak: -1,
      mvo: -1,
      yTrough: -1,
      ePeak: -1,
      aPeak: -1,
    };
  }
  return {
    first: 0,
    last: samples.length - 1,
    mvc: nearestSampleIndexForTheta(samples, profile.xvyPressureReadback.mvcTheta),
    xTrough: nearestSampleIndexForTheta(samples, profile.xvyPressureReadback.xTheta),
    vPeak: nearestSampleIndexForTheta(samples, profile.xvyPressureReadback.vTheta),
    mvo: nearestSampleIndexForTheta(samples, profile.xvyPressureReadback.mvoTheta),
    yTrough: nearestSampleIndexForTheta(samples, profile.xvyPressureReadback.yTheta),
    ePeak: nearestSampleIndexForTheta(samples, profile.mitral.ePeakTheta),
    aPeak: nearestSampleIndexForTheta(samples, profile.mitral.aPeakTheta),
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
  const stepsPerBeat = Math.round(cycleLengthSec / DEFAULT_DT_SEC);
  const dtSec = cycleLengthSec / stepsPerBeat;
  const activationTiming = config.activationTiming ?? DEFAULT_ACTIVATION_TIMING_V1;
  const lvDurationSec = activationDurationSec(
    activationTiming.lvDuration,
    cycleLengthSec,
  );
  const laStartSec = activationStartSec(activationTiming.laStart, cycleLengthSec);
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
      const tSec = step * dtSec;
      const laElectricalActivation01 = pulse(tSec, laStartSec, activationTiming.laDurationSec);
      const lvElectricalActivation01 = pulse(tSec, activationTiming.lvOnsetSec, lvDurationSec);
      const output = stepWorkConjugateAVPlaneLeftHeartV1(state, {
        dtSec,
        laElectricalActivation01,
        lvElectricalActivation01,
        pericardialPressureMmHg: 0,
      }, config.params);
      const acceptedStep = acceptedStepFor(output);
      state = output.state;
      allStepsConverged &&= output.residual.solverConverged;
      allAcceptedSteps &&= acceptedStep;
      beatSamples.push(sampleFromOutput({
        output,
        acceptedStep,
        tSec,
        theta: step / stepsPerBeat,
        laElectricalActivation01,
        lvElectricalActivation01,
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
  readonly params: WorkConjugateAVPlaneLeftHeartParamsV1;
  readonly initialTotalVolume: number;
}): WorkConjugateAtrialAVPlaneSampleV1 {
  const output = input.output;
  const state = output.state;
  const totalVolume = totalClosedCircuitVolumeMl(state, input.params);
  return {
    tSec: input.tSec,
    theta: input.theta,
    phase: phaseFor(output.mitralValve.openFraction01, state.laActivation01),
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
    laActivation01: state.laActivation01,
    lvActivation01: state.lvActivation01,
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
}): WorkConjugateAtrialAVPlaneProfileV1 {
  const samples = input.samples;
  const closureIndex = findMitralClosure(samples);
  const openingIndex = findMitralOpening(samples, closureIndex);
  const preAIndex = firstIndexAtOrAfterTime(samples, input.laStartSec);
  const phases = phaseSlices(samples, closureIndex, openingIndex, preAIndex);
  const closure = samples[closureIndex] ?? emptySample();
  const opening = samples[openingIndex] ?? closure;
  const xTrough = minSample(phases.reservoir, (sample) => sample.laPressureMmHg);
  const lateReservoir = phases.reservoir.slice(
    Math.max(0, phases.reservoir.indexOf(xTrough)),
  );
  const vPeak = maxSample(lateReservoir, (sample) => sample.laPressureMmHg);
  const yTrough = minSample(phases.conduit, (sample) => sample.laPressureMmHg);
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
    xvyPressureReadback: {
      mvcTheta: closure.theta,
      mvcLaPressureMmHg: closure.laPressureMmHg,
      xTheta: xTrough.theta,
      xPressureMmHg: xTrough.laPressureMmHg,
      xDescentDepthMmHg: Math.max(0, closure.laPressureMmHg - xTrough.laPressureMmHg),
      vTheta: vPeak.theta,
      vPressureMmHg: vPeak.laPressureMmHg,
      vWaveRiseMmHg: Math.max(0, vPeak.laPressureMmHg - xTrough.laPressureMmHg),
      mvoTheta: opening.theta,
      mvoLaPressureMmHg: opening.laPressureMmHg,
      yTheta: yTrough.theta,
      yPressureMmHg: yTrough.laPressureMmHg,
      yDescentDepthMmHg: Math.max(0, opening.laPressureMmHg - yTrough.laPressureMmHg),
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

function findMitralClosure(samples: readonly WorkConjugateAtrialAVPlaneSampleV1[]): number {
  for (let i = 1; i < samples.length; i += 1) {
    if (samples[i]!.theta > 0.30) break;
    if (samples[i - 1]!.mitralOpen01 >= 0.5 && samples[i]!.mitralOpen01 < 0.5) return i;
  }
  const end = Math.max(1, Math.round(samples.length * 0.3));
  return minIndex(samples.slice(0, end).map((sample) => sample.mitralOpen01));
}

function findMitralOpening(
  samples: readonly WorkConjugateAtrialAVPlaneSampleV1[],
  closureIndex: number,
): number {
  for (let i = Math.max(closureIndex + 1, 1); i < samples.length; i += 1) {
    if (samples[i]!.theta < 0.20) continue;
    if (samples[i - 1]!.mitralOpen01 < 0.5 && samples[i]!.mitralOpen01 >= 0.5) return i;
  }
  const start = Math.max(closureIndex + 1, Math.round(samples.length * 0.2));
  const end = Math.max(start + 1, Math.round(samples.length * 0.7));
  return start + maxIndex(samples.slice(start, end).map((sample) => sample.mitralOpen01));
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
  laActivation01: number,
): WorkConjugateAtrialAVPlanePhaseV1 {
  if (laActivation01 >= 0.20) return "pumping";
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
    laActivation01: 0,
    lvActivation01: 0,
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
