import {
  DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1,
  initialOneFiberAVPlaneLeftHeartStateV1,
  stepOneFiberAVPlaneLeftHeartV1,
  type OneFiberAVPlaneLeftHeartParamsV1,
  type OneFiberAVPlaneLeftHeartStateV1,
} from "@/engine/mechanics2/subsystems/OneFiberAVPlaneLeftHeartV1";

export const MECHANISTIC_ATRIAL_ONE_FIBER_REPORT_ID_V1 =
  "mechanistic-atrial-one-fiber-report-v1" as const;

export type MechanisticAtrialProfileIdV1 =
  | "normal-hr75"
  | "av-plane-fixed-control"
  | "atrial-active-off-control"
  | "stiff-la-signal";

export type MechanisticAtrialPhaseV1 = "reservoir" | "conduit" | "pumping" | "transition";

export type MechanisticAtrialFigureEightCrossingPhaseV1 =
  | "late-conduit"
  | "early-pumping"
  | "outside-preferred-window"
  | "none";

export type MechanisticMitralWaveFusionClassV1 =
  | "separated"
  | "partial-fusion"
  | "complete-fusion"
  | "not-measurable";

export type MechanisticEvidenceGateStatusV1 = "pass" | "fail" | "not-applicable";

export type MechanisticMitralMeasurementApplicabilityV1 =
  | "applicable"
  | "not-applicable-fusion"
  | "not-applicable-unresolved-peaks";

export type MechanisticEWaveAsymmetryRegimeV1 =
  | "underdamped"
  | "transition"
  | "overdamped"
  | "not-measurable";

export type MechanisticMitralGateReadbackV1 = {
  readonly referenceAgeBand: "41-60";
  readonly measurementApplicability: MechanisticMitralMeasurementApplicabilityV1;
  readonly fusionEligibility: MechanisticEvidenceGateStatusV1;
  readonly ageSpecificPeakEToA: MechanisticEvidenceGateStatusV1;
  readonly atrialFillingFraction: MechanisticEvidenceGateStatusV1;
  readonly decelerationTime: MechanisticEvidenceGateStatusV1;
  readonly resolvedRiseAndDecay: MechanisticEvidenceGateStatusV1;
  readonly resolvedLowFlowDiastasis: MechanisticEvidenceGateStatusV1;
  readonly hardAcceptancePass: boolean;
  readonly supportiveDiagnosticsPass: boolean;
};

export type MechanisticAtrialSampleV1 = {
  readonly tSec: number;
  readonly theta: number;
  readonly phase: MechanisticAtrialPhaseV1;
  readonly laVolumeMl: number;
  readonly lvVolumeMl: number;
  readonly laPressureMmHg: number;
  readonly lvPressureMmHg: number;
  readonly pulmonaryVenousPressureMmHg: number;
  readonly aorticPressureMmHg: number;
  readonly returnReservoirPressureMmHg: number;
  readonly qPulmonaryVenousMlPerSec: number;
  readonly qMitralMlPerSec: number;
  readonly mitralEffectiveAreaCm2: number;
  readonly mitralJetVelocityCmPerSec: number;
  readonly mitralVelocityCmPerSec: number;
  readonly qAorticMlPerSec: number;
  readonly qSystemicMlPerSec: number;
  readonly mitralOpen01: number;
  readonly aorticOpen01: number;
  readonly avPlanePositionCm: number;
  readonly avPlaneVelocityCmPerSec: number;
  readonly ventricularActiveForceN: number;
  readonly atrialActiveForceN: number;
  readonly hydraulicForceN: number;
  readonly springForceN: number;
  readonly dampingForceN: number;
  readonly inertialForceN: number;
  readonly laActivation01: number;
  readonly lvActivation01: number;
  readonly laPassiveStressKPa: number;
  readonly laActiveStressKPa: number;
  readonly lvActiveStressKPa: number;
  readonly laMassResidualMl: number;
  readonly lvMassResidualMl: number;
  readonly avPlaneKinematicResidualCm: number;
  readonly avPlaneForceResidualN: number;
  readonly closedCircuitVolumeResidualMl: number;
  readonly nonlinearResidual: number;
  readonly solverConverged: boolean;
};

export type MechanisticAtrialProfileResultV1 = {
  readonly profileId: string;
  readonly allFinite: boolean;
  readonly pressureRangeLaMmHg: readonly [number, number];
  readonly pressureRangeLvMmHg: readonly [number, number];
  readonly pressureRangeAorticMmHg: readonly [number, number];
  readonly pressureRangePulmonaryVenousMmHg: readonly [number, number];
  readonly pressureRangeReturnReservoirMmHg: readonly [number, number];
  readonly flowRangePulmonaryVenousMlPerSec: readonly [number, number];
  readonly flowRangeSystemicMlPerSec: readonly [number, number];
  readonly volumeRangeLaMl: readonly [number, number];
  readonly volumeRangeLvMl: readonly [number, number];
  readonly cardiacOutputLPerMin: number;
  readonly strokeVolumeMl: number;
  readonly ePeakMlPerSec: number;
  readonly aPeakMlPerSec: number;
  readonly eToARatio: number;
  readonly mitralEPeakVelocityCmPerSec: number;
  readonly mitralAPeakVelocityCmPerSec: number;
  readonly mitralPeakVelocityEToARatio: number;
  readonly mitralEVtiCm: number;
  readonly mitralAVtiCm: number;
  readonly mitralVtiEToARatio: number;
  readonly mitralEarlyForwardVolumeMl: number;
  readonly mitralLateForwardVolumeMl: number;
  readonly mitralAtrialFillingFraction: number;
  readonly mitralEAccelerationTimeSec: number;
  readonly mitralEDecelerationTimeSec: number;
  readonly mitralEDecelerationToAccelerationRatio: number;
  readonly mitralERiseMonotoneFraction: number;
  readonly mitralEDecayMonotoneFraction: number;
  readonly mitralVelocityAtAtrialActivationOnsetCmPerSec: number;
  readonly mitralDiastasisDurationSec: number;
  readonly mitralEAPeakSeparationSec: number;
  readonly mitralWaveFusionClass: MechanisticMitralWaveFusionClassV1;
  readonly mitralWaveMeasurementValid: boolean;
  readonly mitralPeakMeasurementValid: boolean;
  readonly mitralDecelerationMeasurementValid: boolean;
  readonly mitralMidDiastolicPeakVelocityCmPerSec: number;
  readonly mitralEWaveAsymmetryRegime: MechanisticEWaveAsymmetryRegimeV1;
  readonly mitralGateReadback: MechanisticMitralGateReadbackV1;
  readonly atrialKickFlowGainMlPerSec: number;
  readonly pulmonaryVenousSPeakMlPerSec: number;
  readonly pulmonaryVenousDPeakMlPerSec: number;
  readonly pulmonaryVenousSToDRatio: number;
  readonly xDescentDepthMmHg: number;
  readonly earlyReservoirOvershootMmHg: number;
  readonly vWaveRiseMmHg: number;
  readonly yDescentDepthMmHg: number;
  readonly reservoirVolumeGainMl: number;
  readonly conduitVolumeDropMl: number;
  readonly conduitThroughputMl: number;
  readonly conduitFractionOfStrokeVolume: number;
  readonly mitralReverseVolumeMl: number;
  readonly aorticReverseVolumeMl: number;
  readonly mitralSignificantReverseDuty01: number;
  readonly aorticSignificantReverseDuty01: number;
  readonly aLoopAreaMmHgMl: number;
  readonly vLoopAreaMmHgMl: number;
  readonly aLoopSignedAreaMmHgMl: number;
  readonly vLoopSignedAreaMmHgMl: number;
  readonly opposedLobeOrientation: boolean;
  readonly reservoirConduitIntersection: boolean;
  readonly reservoirConduitIntersectionAngleDeg: number;
  readonly reservoirPumpingIntersection: boolean;
  readonly reservoirPumpingIntersectionAngleDeg: number;
  readonly figureEightCrossingPhase: MechanisticAtrialFigureEightCrossingPhaseV1;
  readonly figureEightCrossingProgress01: number;
  readonly figureEightCrossingAngleDeg: number;
  readonly figureEightCrossingInPreferredWindow: boolean;
  readonly conduitBelowReservoirChordFraction: number;
  readonly conduitBelowReservoirPathFraction: number;
  readonly conduitBeforeCrossingBelowReservoirPathFraction: number;
  readonly pumpingAfterCrossingAboveReservoirPathFraction: number;
  readonly pumpingAboveFigureEightChordFraction: number;
  readonly pumpingMinimumFigureEightChordMarginMmHg: number;
  readonly reservoirSecondaryPeakCount: number;
  readonly mvcTangentJumpNorm: number;
  readonly mvoTangentJumpNorm: number;
  readonly avPlaneDisplacementCm: number;
  readonly peakAvPlaneVelocityCmPerSec: number;
  readonly maxAbsMassResidualMl: number;
  readonly maxAbsAvPlaneKinematicResidualCm: number;
  readonly maxAbsAvPlaneForceResidualN: number;
  readonly maxAbsClosedCircuitVolumeResidualMl: number;
  readonly maxNonlinearResidual: number;
  readonly allStepsConverged: boolean;
  readonly periodicSteadyState: boolean;
  readonly beatsSimulated: number;
  readonly cycleClosureLaVolumeMl: number;
  readonly cycleClosureLvVolumeMl: number;
  readonly events: {
    readonly mitralClosureTheta: number;
    readonly mitralOpeningTheta: number;
    readonly preATheta: number;
  };
  readonly samples: readonly MechanisticAtrialSampleV1[];
};

export type MechanisticAtrialRunConfigV1 = {
  readonly profileId: string;
  readonly params: OneFiberAVPlaneLeftHeartParamsV1;
  readonly heartRateBpm?: number;
  readonly dtSec?: number;
  readonly minBeats?: number;
  readonly maxBeats?: number;
  readonly laActivationStartTheta?: number;
  readonly laActivationDurationTheta?: number;
  readonly lvActivationStartTheta?: number;
  readonly lvActivationDurationTheta?: number;
  readonly initialStateOverrides?: Partial<OneFiberAVPlaneLeftHeartStateV1>;
};

export type MechanisticAtrialOneFiberReportV1 = {
  readonly reportId: typeof MECHANISTIC_ATRIAL_ONE_FIBER_REPORT_ID_V1;
  readonly model: {
    readonly atrialBloodVolumeOwner: "Q_ven-minus-Q_AV";
    readonly pressureLaw: "one-fiber-virtual-work";
    readonly avPlane: "shared-inertial-force-coordinate";
    readonly valve: "smooth-area-inertial-flow";
    readonly circulationBoundary: "closed-return-compliance";
    readonly forbiddenPressureHooks: readonly ["P_mem", "P_relief", "P_LV_recv"];
  };
  readonly normalParameters: OneFiberAVPlaneLeftHeartParamsV1;
  readonly normalActivationTiming: {
    readonly timingMode: "prescribed-fixed-real-time";
    readonly avDelaySec: number;
    readonly laDurationSec: number;
    readonly lvDurationSec: number;
    readonly laStartTheta: number;
    readonly laDurationTheta: number;
    readonly lvStartTheta: number;
    readonly lvDurationTheta: number;
  };
  readonly profiles: readonly MechanisticAtrialProfileResultV1[];
  readonly gates: {
    readonly numericalPass: boolean;
    readonly normalEnvelopePass: boolean;
    readonly normalPhasePass: boolean;
    readonly normalMitralEligibilityPass: boolean;
    readonly normalMitralPeakEaPass: boolean;
    readonly normalMitralSupportiveDiagnosticsPass: boolean;
    readonly normalMitralWaveformPass: boolean;
    readonly normalFigureEightPass: boolean;
    readonly mechanismControlsPass: boolean;
  };
  readonly gateRationale: {
    readonly conduitVolume: string;
    readonly mitralWaveform: string;
    readonly figureEight: string;
    readonly phaseWaveProminence: string;
    readonly mechanismControls: string;
    readonly reservoirTransition: string;
    readonly tangentContinuity: string;
  };
  readonly decision: {
    readonly status:
      | "mechanistic-atrial-vertical-slice-signal"
      | "mechanistic-atrial-vertical-slice-mixed"
      | "mechanistic-atrial-vertical-slice-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly fullFourChamberCircuit: false;
    readonly morphologyAcceptance: false;
    readonly patientSpecificValidation: false;
  };
};

const DEFAULT_HEART_RATE_BPM = 75;
const DEFAULT_DT_SEC = 0.001;
const DEFAULT_MIN_BEATS = 12;
const DEFAULT_MAX_BEATS = 60;
const DEFAULT_LA_ACTIVATION_START_THETA = 0.76;
const DEFAULT_LA_ACTIVATION_DURATION_THETA = 0.20;
const DEFAULT_LV_ACTIVATION_START_THETA = 0.97;
const DEFAULT_LV_ACTIVATION_DURATION_THETA = 0.36;
const DEFAULT_AV_DELAY_SEC = 0.168;
const DEFAULT_LA_ACTIVATION_DURATION_SEC = 0.160;
const DEFAULT_LV_ACTIVATION_DURATION_SEC = 0.288;
const MITRAL_FUSION_VELOCITY_CM_PER_SEC = 20;
const MIDDLE_AGE_MITRAL_PEAK_EA_RANGE = [0.69, 2.07] as const;
const MIDDLE_AGE_MITRAL_E_DECELERATION_TIME_SEC_RANGE = [0.143, 0.219] as const;
const ADULT_ATRIAL_FILLING_FRACTION_RANGE = [0.12, 0.46] as const;
const ENGINEERING_WAVEFORM_MONOTONICITY_FLOOR = 0.80;
const ENGINEERING_PUMPING_CHORD_FRACTION_FLOOR = 0.80;

export function runMechanisticAtrialOneFiberBenchV1(): MechanisticAtrialOneFiberReportV1 {
  const profiles = ([
    "normal-hr75",
    "av-plane-fixed-control",
    "atrial-active-off-control",
    "stiff-la-signal",
  ] as const).map(runProfile);
  const normal = profile(profiles, "normal-hr75");
  const avFixed = profile(profiles, "av-plane-fixed-control");
  const activeOff = profile(profiles, "atrial-active-off-control");
  const stiff = profile(profiles, "stiff-la-signal");
  const numericalPass = profiles.every((row) =>
    row.allFinite &&
    row.maxAbsMassResidualMl <= 1e-6 &&
    row.maxAbsAvPlaneKinematicResidualCm <= 1e-7 &&
    row.maxAbsAvPlaneForceResidualN <= 1e-5 &&
    row.maxAbsClosedCircuitVolumeResidualMl <= 1e-6 &&
    row.maxNonlinearResidual <= 1e-7 &&
    row.allStepsConverged &&
    row.periodicSteadyState &&
    row.volumeRangeLaMl[0] > 0 && row.volumeRangeLvMl[0] > 0
  );
  const normalEnvelopePass =
    normal.pressureRangeLaMmHg[0] > -3 && normal.pressureRangeLaMmHg[1] < 30 &&
    normal.pressureRangeLvMmHg[1] >= 80 && normal.pressureRangeLvMmHg[1] <= 200 &&
    normal.pressureRangeAorticMmHg[0] >= 45 && normal.pressureRangeAorticMmHg[1] <= 180 &&
    normal.cardiacOutputLPerMin >= 3 && normal.cardiacOutputLPerMin <= 8 &&
    normal.avPlaneDisplacementCm >= 0.5 && normal.avPlaneDisplacementCm <= 1.8 &&
    normal.peakAvPlaneVelocityCmPerSec <= 20;
  const normalPhasePass =
    normal.xDescentDepthMmHg >= 0.5 &&
    normal.vWaveRiseMmHg >= 0.5 &&
    normal.yDescentDepthMmHg >= 0.5 &&
    normal.reservoirVolumeGainMl >= 5 &&
    normal.conduitVolumeDropMl > 0 &&
    normal.conduitThroughputMl >= 5;
  const normalMitralEligibilityPass =
    normal.mitralGateReadback.fusionEligibility === "pass";
  const normalMitralPeakEaPass =
    normal.mitralGateReadback.ageSpecificPeakEToA === "pass";
  const normalMitralSupportiveDiagnosticsPass =
    normal.mitralGateReadback.supportiveDiagnosticsPass;
  const normalMitralWaveformPass =
    normal.mitralGateReadback.hardAcceptancePass;
  const normalFigureEightPass =
    normal.figureEightCrossingInPreferredWindow &&
    normal.figureEightCrossingAngleDeg >= 10 &&
    normal.conduitBeforeCrossingBelowReservoirPathFraction >= 0.95 &&
    normal.pumpingAfterCrossingAboveReservoirPathFraction >= 0.95 &&
    normal.pumpingAboveFigureEightChordFraction >=
      ENGINEERING_PUMPING_CHORD_FRACTION_FLOOR &&
    opposedLobeAreasPassV1(
      normal.aLoopSignedAreaMmHgMl,
      normal.vLoopSignedAreaMmHgMl,
      5,
      10,
    ) &&
    normal.reservoirSecondaryPeakCount <= 1 &&
    normal.earlyReservoirOvershootMmHg <= 0.1 * normal.xDescentDepthMmHg;
  const mechanismControlsPass =
    normal.xDescentDepthMmHg >= avFixed.xDescentDepthMmHg + 0.4 &&
    normal.aLoopAreaMmHgMl >= activeOff.aLoopAreaMmHgMl * 1.5 &&
    normal.atrialKickFlowGainMlPerSec >= 10 &&
    activeOff.atrialKickFlowGainMlPerSec <= normal.atrialKickFlowGainMlPerSec * 0.25 &&
    stiff.pressureRangeLaMmHg[1] >= normal.pressureRangeLaMmHg[1] + 0.5;
  const status = !numericalPass
    ? "mechanistic-atrial-vertical-slice-blocked"
    : normalEnvelopePass && normalPhasePass && normalMitralWaveformPass &&
        normalFigureEightPass && mechanismControlsPass
      ? "mechanistic-atrial-vertical-slice-signal"
      : "mechanistic-atrial-vertical-slice-mixed";
  return {
    reportId: MECHANISTIC_ATRIAL_ONE_FIBER_REPORT_ID_V1,
    model: {
      atrialBloodVolumeOwner: "Q_ven-minus-Q_AV",
      pressureLaw: "one-fiber-virtual-work",
      avPlane: "shared-inertial-force-coordinate",
      valve: "smooth-area-inertial-flow",
      circulationBoundary: "closed-return-compliance",
      forbiddenPressureHooks: ["P_mem", "P_relief", "P_LV_recv"],
    },
    normalParameters: DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1,
    normalActivationTiming: {
      timingMode: "prescribed-fixed-real-time",
      avDelaySec: DEFAULT_AV_DELAY_SEC,
      laDurationSec: DEFAULT_LA_ACTIVATION_DURATION_SEC,
      lvDurationSec: DEFAULT_LV_ACTIVATION_DURATION_SEC,
      laStartTheta: DEFAULT_LA_ACTIVATION_START_THETA,
      laDurationTheta: DEFAULT_LA_ACTIVATION_DURATION_THETA,
      lvStartTheta: DEFAULT_LV_ACTIVATION_START_THETA,
      lvDurationTheta: DEFAULT_LV_ACTIVATION_DURATION_THETA,
    },
    profiles,
    gates: {
      numericalPass,
      normalEnvelopePass,
      normalPhasePass,
      normalMitralEligibilityPass,
      normalMitralPeakEaPass,
      normalMitralSupportiveDiagnosticsPass,
      normalMitralWaveformPass,
      normalFigureEightPass,
      mechanismControlsPass,
    },
    gateRationale: {
      conduitVolume: "The 5 mL floor applies to SV_LV minus total LA stroke volume; net post-MVO LA emptying must only remain positive.",
      mitralWaveform: "The reported velocity is the fixed-open-area bulk surrogate Q_MV/A_open, not PW-Doppler modal velocity. Transferring the ASE E-at-A >20 cm/s rule to this surrogate is a conservative engineering applicability screen, not clinical equivalence; it makes E/A, VTI partition, and DT not applicable rather than abnormal. Only the ASE 2025 age-41-60 peak E/A range 0.69-2.07 is a hard sidecar normal gate. AFF 0.12-0.46 and DT 143-219 ms are age-dependent supportive diagnostics; AT, DT/AT, diastasis duration, and rise/decay shape have no clinical hard cutoff here.",
      figureEight: "Normal reference morphology permits the interior crossing in late conduit or early pumping and requires opposed signed A/v lobe areas. Before it, at least 95% of eligible conduit samples must lie below the lower reservoir envelope; after it, at least 95% of pumping samples must lie above the upper reservoir envelope. The orientation, 80% crossing-to-MVC chord, angle, and area rules are engineering anti-degeneracy diagnostics, not literature normal ranges.",
      phaseWaveProminence: "The 0.5 mmHg x/y/v prominence floor is only a finite-resolution engineering detector for a named wave, not a clinical normal amplitude. Absolute amplitudes remain reported and are not fitted to this floor.",
      mechanismControls: "The stiff-LA control must raise peak LA pressure by at least 0.5 mmHg. This is a directional attribution margin above numerical noise, not a disease cutoff.",
      reservoirTransition: "Because c-wave mechanics are omitted, post-MVC pressure overshoot must stay below 10% of x-descent depth.",
      tangentContinuity: "C1 continuity follows from the smooth valve coefficients and implicit ODE. Numerical verification is based on monotone tangent-jump reduction under dt=2, 1, and 0.5 ms refinement; the single-dt jump remains diagnostic only.",
    },
    decision: {
      status,
      nextAction: status === "mechanistic-atrial-vertical-slice-signal"
        ? "Verify the same mechanism across preload, afterload, heart-rate, and contractility envelopes before any runtime integration."
        : status === "mechanistic-atrial-vertical-slice-mixed"
          ? "Inspect the normal blood-volume PV and flow/AV-plane traces; change only wall, shared-coordinate, valve, or venous physical parameters."
          : "Repair conservation or force-balance numerics before interpreting morphology.",
      blockedClaims: [
        "runtime-wiring",
        "full-four-chamber-circuit",
        "morphology-acceptance",
        "patient-specific-validation",
        "default-selection",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      fullFourChamberCircuit: false,
      morphologyAcceptance: false,
      patientSpecificValidation: false,
    },
  };
}

function runProfile(profileId: MechanisticAtrialProfileIdV1): MechanisticAtrialProfileResultV1 {
  return runMechanisticAtrialProfileV1({ profileId, params: paramsForProfile(profileId) });
}

export function runMechanisticAtrialProfileV1(
  config: MechanisticAtrialRunConfigV1,
): MechanisticAtrialProfileResultV1 {
  const params = config.params;
  const heartRateBpm = config.heartRateBpm ?? DEFAULT_HEART_RATE_BPM;
  const cycleLengthSec = 60 / heartRateBpm;
  const dtSec = config.dtSec ?? DEFAULT_DT_SEC;
  const stepsPerBeat = Math.round(cycleLengthSec / dtSec);
  const effectiveDtSec = cycleLengthSec / stepsPerBeat;
  const minBeats = config.minBeats ?? DEFAULT_MIN_BEATS;
  const maxBeats = config.maxBeats ?? DEFAULT_MAX_BEATS;
  const lvActivationStartTheta = config.lvActivationStartTheta ??
    DEFAULT_LV_ACTIVATION_START_THETA;
  const laActivationStartTheta = config.laActivationStartTheta ?? positiveModulo(
    lvActivationStartTheta - DEFAULT_AV_DELAY_SEC / cycleLengthSec,
    1,
  );
  const laActivationDurationTheta = config.laActivationDurationTheta ??
    DEFAULT_LA_ACTIVATION_DURATION_SEC / cycleLengthSec;
  const lvActivationDurationTheta = config.lvActivationDurationTheta ??
    DEFAULT_LV_ACTIVATION_DURATION_SEC / cycleLengthSec;
  let state = initialOneFiberAVPlaneLeftHeartStateV1(config.initialStateOverrides ?? {}, params);
  let finalSamples: MechanisticAtrialSampleV1[] = [];
  let priorBeatStart = { la: state.laVolumeMl, lv: state.lvVolumeMl };
  let periodicSteadyState = false;
  let allStepsConverged = true;
  let beatsSimulated = 0;
  for (let beat = 0; beat < maxBeats; beat += 1) {
    const beatStart = state;
    const beatSamples: MechanisticAtrialSampleV1[] = [];
    for (let phaseStep = 0; phaseStep < stepsPerBeat; phaseStep += 1) {
      const theta = phaseStep / stepsPerBeat;
      const output = stepOneFiberAVPlaneLeftHeartV1(state, {
        dtSec: effectiveDtSec,
        laElectricalActivation01: periodicPulse(
          theta,
          laActivationStartTheta,
          laActivationDurationTheta,
        ),
        lvElectricalActivation01: periodicPulse(
          theta,
          lvActivationStartTheta,
          lvActivationDurationTheta,
        ),
        pericardialPressureMmHg: 0,
      }, params);
      state = output.state;
      allStepsConverged &&= output.allFinite && output.residual.solverConverged;
      beatSamples.push({
        tSec: theta * cycleLengthSec,
        theta,
        phase: phaseFor(output.mitralValve.openFraction01, output.la.activation01),
        laVolumeMl: state.laVolumeMl,
        lvVolumeMl: state.lvVolumeMl,
        laPressureMmHg: output.la.cavityPressureMmHg,
        lvPressureMmHg: output.lv.cavityPressureMmHg,
        pulmonaryVenousPressureMmHg: state.pulmonaryVenousPressureMmHg,
        aorticPressureMmHg: state.aorticPressureMmHg,
        returnReservoirPressureMmHg: state.returnReservoirPressureMmHg,
        qPulmonaryVenousMlPerSec: output.pulmonaryVenousFlowMlPerSec,
        qMitralMlPerSec: output.mitralValve.qMlPerSec,
        mitralEffectiveAreaCm2: output.mitralValve.effectiveAreaCm2,
        mitralJetVelocityCmPerSec: output.mitralValve.qMlPerSec /
          Math.max(output.mitralValve.effectiveAreaCm2, 1e-9),
        mitralVelocityCmPerSec: output.mitralValve.qMlPerSec /
          Math.max(params.mitralValve.openAreaCm2, 1e-9),
        qAorticMlPerSec: output.aorticValve.qMlPerSec,
        qSystemicMlPerSec: output.systemicOutflowMlPerSec,
        mitralOpen01: output.mitralValve.openFraction01,
        aorticOpen01: output.aorticValve.openFraction01,
        avPlanePositionCm: output.avPlane.positionCm,
        avPlaneVelocityCmPerSec: output.avPlane.velocityCmPerSec,
        ventricularActiveForceN: output.avPlane.ventricularActiveForceN,
        atrialActiveForceN: output.avPlane.atrialActiveForceN,
        hydraulicForceN: output.avPlane.hydraulicForceN,
        springForceN: output.avPlane.springForceN,
        dampingForceN: output.avPlane.dampingForceN,
        inertialForceN: output.avPlane.inertialForceN,
        laActivation01: output.la.activation01,
        lvActivation01: output.lv.activation01,
        laPassiveStressKPa: output.la.passiveStressKPa,
        laActiveStressKPa: output.la.activeStressKPa,
        lvActiveStressKPa: output.lv.activeStressKPa,
        laMassResidualMl: output.residual.laMassResidualMl,
        lvMassResidualMl: output.residual.lvMassResidualMl,
        avPlaneKinematicResidualCm: output.residual.avPlaneKinematicResidualCm,
        avPlaneForceResidualN: output.residual.avPlaneForceResidualN,
        closedCircuitVolumeResidualMl: output.residual.closedCircuitVolumeResidualMl,
        nonlinearResidual: output.residual.maxNormalizedEquationResidual,
        solverConverged: output.residual.solverConverged,
      });
    }
    beatsSimulated = beat + 1;
    priorBeatStart = { la: beatStart.laVolumeMl, lv: beatStart.lvVolumeMl };
    finalSamples = beatSamples;
    periodicSteadyState = beat + 1 >= minBeats && cycleStateConverged(beatStart, state);
    if (periodicSteadyState || !allStepsConverged) break;
  }
  return summarizeProfile(
    config.profileId,
    finalSamples,
    priorBeatStart,
    periodicSteadyState,
    allStepsConverged,
    beatsSimulated,
    effectiveDtSec,
    cycleLengthSec,
    laActivationStartTheta,
  );
}

function paramsForProfile(profileId: MechanisticAtrialProfileIdV1): OneFiberAVPlaneLeftHeartParamsV1 {
  const base = DEFAULT_ONE_FIBER_AV_PLANE_LEFT_HEART_PARAMS_V1;
  if (profileId === "av-plane-fixed-control") {
    return {
      ...base,
      avPlane: {
        ...base.avPlane,
        atrialFiberProjection01: 0,
        ventricularFiberProjection01: 0,
        stiffnessNPerCm: 1e6,
        dampingNSecPerCm: 1e6,
      },
    };
  }
  if (profileId === "atrial-active-off-control") {
    return { ...base, laWall: { ...base.laWall, activeStressMaxKPa: 0 } };
  }
  if (profileId === "stiff-la-signal") {
    return {
      ...base,
      laWall: { ...base.laWall, passiveStiffnessKPa: base.laWall.passiveStiffnessKPa * 2.5 },
    };
  }
  return base;
}

function summarizeProfile(
  profileId: string,
  samples: readonly MechanisticAtrialSampleV1[],
  priorBeatStart: { readonly la: number; readonly lv: number },
  periodicSteadyState: boolean,
  allStepsConverged: boolean,
  beatsSimulated: number,
  dtSec: number,
  cycleLengthSec: number,
  laActivationStartTheta: number,
): MechanisticAtrialProfileResultV1 {
  const closureIndex = findMitralClosure(samples);
  const openingIndex = findMitralOpening(samples, closureIndex);
  const mitralWaveform = analyzeMitralInflow(
    samples,
    openingIndex,
    closureIndex,
    dtSec,
    cycleLengthSec,
    laActivationStartTheta,
  );
  const mitralGateReadback = assessMitralWaveform(mitralWaveform);
  const fallbackPreAIndex = firstIndexAtOrAfterTheta(samples, laActivationStartTheta);
  const preAIndex = mitralWaveform.activationOnsetIndex > openingIndex &&
      mitralWaveform.activationOnsetIndex < samples.length
    ? mitralWaveform.activationOnsetIndex
    : fallbackPreAIndex;
  const closure = samples[Math.max(0, closureIndex)]!;
  const opening = samples[Math.max(0, openingIndex)]!;
  const reservoir = validSlice(samples, closureIndex, openingIndex + 1);
  const conduit = validSlice(samples, openingIndex, preAIndex + 1);
  const pumping = [
    ...validSlice(samples, preAIndex, samples.length),
    ...validSlice(samples, 0, closureIndex + 1),
  ];
  const xIndexLocal = minIndex(reservoir.map((sample) => sample.laPressureMmHg));
  const xTrough = reservoir[xIndexLocal] ?? closure;
  const earlyReservoir = reservoir.slice(0, xIndexLocal + 1);
  const lateReservoir = reservoir.slice(xIndexLocal);
  const yTrough = conduit[minIndex(conduit.map((sample) => sample.laPressureMmHg))] ?? opening;
  const sWindow = reservoir;
  const dWindow = conduit;
  const pressureLa = samples.map((sample) => sample.laPressureMmHg);
  const pressureLv = samples.map((sample) => sample.lvPressureMmHg);
  const pressureAo = samples.map((sample) => sample.aorticPressureMmHg);
  const pressurePv = samples.map((sample) => sample.pulmonaryVenousPressureMmHg);
  const pressureReturn = samples.map((sample) => sample.returnReservoirPressureMmHg);
  const flowPv = samples.map((sample) => sample.qPulmonaryVenousMlPerSec);
  const flowSystemic = samples.map((sample) => sample.qSystemicMlPerSec);
  const laVolumes = samples.map((sample) => sample.laVolumeMl);
  const lvVolumes = samples.map((sample) => sample.lvVolumeMl);
  const ePeak = mitralWaveform.ePeakFlowMlPerSec;
  const aPeak = mitralWaveform.aPeakFlowMlPerSec;
  const sPeak = maxOf(sWindow.map((sample) => sample.qPulmonaryVenousMlPerSec));
  const dPeak = maxOf(dWindow.map((sample) => sample.qPulmonaryVenousMlPerSec));
  const aorticForwardVolumeMl = samples.reduce((sum, sample) =>
    sum + dtSec * Math.max(0, sample.qAorticMlPerSec), 0);
  const mitralReverseVolumeMl = samples.reduce((sum, sample) =>
    sum + dtSec * Math.max(0, -sample.qMitralMlPerSec), 0);
  const aorticReverseVolumeMl = samples.reduce((sum, sample) =>
    sum + dtSec * Math.max(0, -sample.qAorticMlPerSec), 0);
  const mitralReverseThreshold = Math.max(
    1,
    0.01 * maxOf(samples.map((sample) => Math.max(0, sample.qMitralMlPerSec))),
  );
  const aorticReverseThreshold = Math.max(
    1,
    0.01 * maxOf(samples.map((sample) => Math.max(0, sample.qAorticMlPerSec))),
  );
  const mitralSignificantReverseDuty01 = samples.filter((sample) =>
    sample.qMitralMlPerSec < -mitralReverseThreshold
  ).length / Math.max(samples.length, 1);
  const aorticSignificantReverseDuty01 = samples.filter((sample) =>
    sample.qAorticMlPerSec < -aorticReverseThreshold
  ).length / Math.max(samples.length, 1);
  const laStrokeVolumeMl = maxOf(laVolumes) - minOf(laVolumes);
  const conduitThroughputMl = Math.max(0, aorticForwardVolumeMl - laStrokeVolumeMl);
  const reservoirChordFraction = conduitBelowChordFraction(conduit, closure, opening);
  const reservoirPathFraction = conduitBelowPathFraction(conduit, reservoir);
  const reservoirConduitIntersections = pathIntersections(reservoir, conduit);
  const reservoirPumpingIntersections = pathIntersections(reservoir, pumping);
  const reservoirConduitTopology = pathIntersectionMetrics(reservoirConduitIntersections);
  const reservoirPumpingTopology = pathIntersectionMetrics(reservoirPumpingIntersections);
  const figureEightCrossing = selectFigureEightCrossing(
    reservoirConduitIntersections,
    reservoirPumpingIntersections,
  );
  const conduitBeforeCrossingFraction = figureEightCrossing
    ? pathOrderFraction(
      conduit,
      reservoir,
      "below",
      0,
      figureEightCrossing.source === "conduit" ? figureEightCrossing.pathProgress01 : 1,
    )
    : 0;
  const pumpingAfterCrossingFraction = figureEightCrossing
    ? pathOrderFraction(
      pumping,
      reservoir,
      "above",
      figureEightCrossing.source === "pumping" ? figureEightCrossing.pathProgress01 : 0,
      1,
    )
    : 0;
  const pumpingChord = figureEightCrossing
    ? pathAboveChordMetrics(
      pumping,
      figureEightCrossing,
      closure,
      figureEightCrossing.source === "pumping" ? figureEightCrossing.pathProgress01 : 0,
    )
    : { fraction: 0, minimumMarginMmHg: 0 };
  const aLoopSignedAreaMmHgMl = signedLaPvLoopAreaV1(pumping);
  const vLoopSignedAreaMmHgMl = signedLaPvLoopAreaV1([...reservoir, ...conduit]);
  return {
    profileId,
    allFinite: samples.every((sample) => Object.values(sample).every((value) =>
      typeof value !== "number" || Number.isFinite(value)
    )),
    pressureRangeLaMmHg: range(pressureLa),
    pressureRangeLvMmHg: range(pressureLv),
    pressureRangeAorticMmHg: range(pressureAo),
    pressureRangePulmonaryVenousMmHg: range(pressurePv),
    pressureRangeReturnReservoirMmHg: range(pressureReturn),
    flowRangePulmonaryVenousMlPerSec: range(flowPv),
    flowRangeSystemicMlPerSec: range(flowSystemic),
    volumeRangeLaMl: range(laVolumes),
    volumeRangeLvMl: range(lvVolumes),
    cardiacOutputLPerMin: round(aorticForwardVolumeMl / cycleLengthSec * 0.06),
    strokeVolumeMl: round(aorticForwardVolumeMl),
    ePeakMlPerSec: round(ePeak),
    aPeakMlPerSec: round(aPeak),
    eToARatio: round(ePeak / Math.max(aPeak, 1e-9)),
    mitralEPeakVelocityCmPerSec: round(mitralWaveform.ePeakVelocityCmPerSec),
    mitralAPeakVelocityCmPerSec: round(mitralWaveform.aPeakVelocityCmPerSec),
    mitralPeakVelocityEToARatio: round(mitralWaveform.peakVelocityEToARatio),
    mitralEVtiCm: round(mitralWaveform.eVtiCm),
    mitralAVtiCm: round(mitralWaveform.aVtiCm),
    mitralVtiEToARatio: round(mitralWaveform.vtiEToARatio),
    mitralEarlyForwardVolumeMl: round(mitralWaveform.earlyForwardVolumeMl),
    mitralLateForwardVolumeMl: round(mitralWaveform.lateForwardVolumeMl),
    mitralAtrialFillingFraction: round(mitralWaveform.atrialFillingFraction),
    mitralEAccelerationTimeSec: round(mitralWaveform.eAccelerationTimeSec),
    mitralEDecelerationTimeSec: round(mitralWaveform.eDecelerationTimeSec),
    mitralEDecelerationToAccelerationRatio: round(
      mitralWaveform.eDecelerationToAccelerationRatio,
    ),
    mitralERiseMonotoneFraction: round(mitralWaveform.eRiseMonotoneFraction),
    mitralEDecayMonotoneFraction: round(mitralWaveform.eDecayMonotoneFraction),
    mitralVelocityAtAtrialActivationOnsetCmPerSec: round(
      mitralWaveform.velocityAtAtrialActivationOnsetCmPerSec,
    ),
    mitralDiastasisDurationSec: round(mitralWaveform.diastasisDurationSec),
    mitralEAPeakSeparationSec: round(mitralWaveform.eaPeakSeparationSec),
    mitralWaveFusionClass: mitralWaveform.fusionClass,
    mitralWaveMeasurementValid: mitralWaveform.measurementValid,
    mitralPeakMeasurementValid: mitralWaveform.peakMeasurementValid,
    mitralDecelerationMeasurementValid: mitralWaveform.decelerationMeasurementValid,
    mitralMidDiastolicPeakVelocityCmPerSec: round(
      mitralWaveform.midDiastolicPeakVelocityCmPerSec,
    ),
    mitralEWaveAsymmetryRegime: mitralWaveform.asymmetryRegime,
    mitralGateReadback,
    atrialKickFlowGainMlPerSec: round(Math.max(
      0,
      aPeak - samples[preAIndex]!.qMitralMlPerSec,
    )),
    pulmonaryVenousSPeakMlPerSec: round(sPeak),
    pulmonaryVenousDPeakMlPerSec: round(dPeak),
    pulmonaryVenousSToDRatio: round(sPeak / Math.max(dPeak, 1e-9)),
    xDescentDepthMmHg: round(Math.max(0, closure.laPressureMmHg - xTrough.laPressureMmHg)),
    earlyReservoirOvershootMmHg: round(Math.max(
      0,
      maxOf(earlyReservoir.map((sample) => sample.laPressureMmHg)) - closure.laPressureMmHg,
    )),
    vWaveRiseMmHg: round(Math.max(0, maxOf(lateReservoir.map((sample) => sample.laPressureMmHg)) -
      xTrough.laPressureMmHg)),
    yDescentDepthMmHg: round(Math.max(0, opening.laPressureMmHg - yTrough.laPressureMmHg)),
    reservoirVolumeGainMl: round(maxOf(reservoir.map((sample) => sample.laVolumeMl)) -
      minOf(reservoir.map((sample) => sample.laVolumeMl))),
    conduitVolumeDropMl: round(Math.max(0, opening.laVolumeMl -
      minOf(conduit.map((sample) => sample.laVolumeMl)))),
    conduitThroughputMl: round(conduitThroughputMl),
    conduitFractionOfStrokeVolume: round(
      conduitThroughputMl / Math.max(aorticForwardVolumeMl, 1e-9),
    ),
    mitralReverseVolumeMl: round(mitralReverseVolumeMl),
    aorticReverseVolumeMl: round(aorticReverseVolumeMl),
    mitralSignificantReverseDuty01: round(mitralSignificantReverseDuty01),
    aorticSignificantReverseDuty01: round(aorticSignificantReverseDuty01),
    aLoopAreaMmHgMl: round(Math.abs(aLoopSignedAreaMmHgMl)),
    vLoopAreaMmHgMl: round(Math.abs(vLoopSignedAreaMmHgMl)),
    aLoopSignedAreaMmHgMl: round(aLoopSignedAreaMmHgMl),
    vLoopSignedAreaMmHgMl: round(vLoopSignedAreaMmHgMl),
    opposedLobeOrientation: opposedLobeAreasPassV1(
      aLoopSignedAreaMmHgMl,
      vLoopSignedAreaMmHgMl,
    ),
    reservoirConduitIntersection: reservoirConduitTopology.intersects,
    reservoirConduitIntersectionAngleDeg: round(reservoirConduitTopology.maxAngleDeg),
    reservoirPumpingIntersection: reservoirPumpingTopology.intersects,
    reservoirPumpingIntersectionAngleDeg: round(reservoirPumpingTopology.maxAngleDeg),
    figureEightCrossingPhase: figureEightCrossing?.phase ?? "none",
    figureEightCrossingProgress01: round(figureEightCrossing?.pathProgress01 ?? 0),
    figureEightCrossingAngleDeg: round(figureEightCrossing?.angleDeg ?? 0),
    figureEightCrossingInPreferredWindow: figureEightCrossing?.preferredWindow ?? false,
    conduitBelowReservoirChordFraction: round(reservoirChordFraction),
    conduitBelowReservoirPathFraction: round(reservoirPathFraction),
    conduitBeforeCrossingBelowReservoirPathFraction: round(conduitBeforeCrossingFraction),
    pumpingAfterCrossingAboveReservoirPathFraction: round(pumpingAfterCrossingFraction),
    pumpingAboveFigureEightChordFraction: round(pumpingChord.fraction),
    pumpingMinimumFigureEightChordMarginMmHg: round(pumpingChord.minimumMarginMmHg),
    reservoirSecondaryPeakCount: countProminentPeaks(
      lateReservoir.map((sample) => sample.laPressureMmHg),
      0.25,
    ),
    mvcTangentJumpNorm: round(tangentJump(samples, closureIndex)),
    mvoTangentJumpNorm: round(tangentJump(samples, openingIndex)),
    avPlaneDisplacementCm: round(maxOf(samples.map((sample) => sample.avPlanePositionCm)) -
      minOf(samples.map((sample) => sample.avPlanePositionCm))),
    peakAvPlaneVelocityCmPerSec: round(maxOf(samples.map((sample) =>
      Math.abs(sample.avPlaneVelocityCmPerSec)
    ))),
    maxAbsMassResidualMl: round(maxOf(samples.flatMap((sample) => [
      Math.abs(sample.laMassResidualMl),
      Math.abs(sample.lvMassResidualMl),
    ]))),
    maxAbsAvPlaneKinematicResidualCm: round(maxOf(samples.map((sample) =>
      Math.abs(sample.avPlaneKinematicResidualCm)
    ))),
    maxAbsAvPlaneForceResidualN: round(maxOf(samples.map((sample) =>
      Math.abs(sample.avPlaneForceResidualN)
    ))),
    maxAbsClosedCircuitVolumeResidualMl: round(maxOf(samples.map((sample) =>
      Math.abs(sample.closedCircuitVolumeResidualMl)
    ))),
    maxNonlinearResidual: round(maxOf(samples.map((sample) => sample.nonlinearResidual))),
    allStepsConverged: allStepsConverged && samples.every((sample) => sample.solverConverged),
    periodicSteadyState,
    beatsSimulated,
    cycleClosureLaVolumeMl: round(samples.at(-1)!.laVolumeMl - priorBeatStart.la),
    cycleClosureLvVolumeMl: round(samples.at(-1)!.lvVolumeMl - priorBeatStart.lv),
    events: {
      mitralClosureTheta: round(closure.theta),
      mitralOpeningTheta: round(opening.theta),
      preATheta: round(samples[Math.min(preAIndex, samples.length - 1)]!.theta),
    },
    samples: samples.map(roundSample),
  };
}

function phaseFor(mitralOpen01: number, laActivation01: number): MechanisticAtrialPhaseV1 {
  if (laActivation01 >= 0.20) return "pumping";
  if (mitralOpen01 <= 0.35) return "reservoir";
  if (mitralOpen01 >= 0.65) return "conduit";
  return "transition";
}

function periodicPulse(theta: number, start: number, duration: number): number {
  const local = positiveModulo(theta - start, 1);
  if (local >= duration) return 0;
  return Math.sin(Math.PI * local / duration) ** 2;
}

function findMitralClosure(samples: readonly MechanisticAtrialSampleV1[]): number {
  for (let i = 1; i < samples.length; i += 1) {
    if (samples[i]!.theta > 0.30) break;
    if (samples[i - 1]!.mitralOpen01 >= 0.5 && samples[i]!.mitralOpen01 < 0.5) return i;
  }
  return Math.max(0, minIndex(samples.slice(0, Math.round(samples.length * 0.3))
    .map((sample) => sample.mitralOpen01)));
}

function findMitralOpening(samples: readonly MechanisticAtrialSampleV1[], closureIndex: number): number {
  for (let i = Math.max(closureIndex + 1, 1); i < samples.length; i += 1) {
    if (samples[i]!.theta < 0.20) continue;
    if (samples[i - 1]!.mitralOpen01 < 0.5 && samples[i]!.mitralOpen01 >= 0.5) return i;
  }
  const start = Math.max(closureIndex + 1, Math.round(samples.length * 0.2));
  return start + maxIndex(samples.slice(start, Math.round(samples.length * 0.7))
    .map((sample) => sample.mitralOpen01));
}

type MitralWaveformAnalysisV1 = {
  readonly turningIndex: number;
  readonly activationOnsetIndex: number;
  readonly ePeakFlowMlPerSec: number;
  readonly aPeakFlowMlPerSec: number;
  readonly ePeakVelocityCmPerSec: number;
  readonly aPeakVelocityCmPerSec: number;
  readonly peakVelocityEToARatio: number;
  readonly eVtiCm: number;
  readonly aVtiCm: number;
  readonly vtiEToARatio: number;
  readonly earlyForwardVolumeMl: number;
  readonly lateForwardVolumeMl: number;
  readonly atrialFillingFraction: number;
  readonly eAccelerationTimeSec: number;
  readonly eDecelerationTimeSec: number;
  readonly eDecelerationToAccelerationRatio: number;
  readonly eRiseMonotoneFraction: number;
  readonly eDecayMonotoneFraction: number;
  readonly velocityAtAtrialActivationOnsetCmPerSec: number;
  readonly diastasisDurationSec: number;
  readonly eaPeakSeparationSec: number;
  readonly fusionClass: MechanisticMitralWaveFusionClassV1;
  readonly measurementValid: boolean;
  readonly peakMeasurementValid: boolean;
  readonly decelerationMeasurementValid: boolean;
  readonly midDiastolicPeakVelocityCmPerSec: number;
  readonly asymmetryRegime: MechanisticEWaveAsymmetryRegimeV1;
};

type UnwrappedMitralSampleV1 = {
  readonly index: number;
  readonly elapsedSec: number;
  readonly sample: MechanisticAtrialSampleV1;
};

function analyzeMitralInflow(
  samples: readonly MechanisticAtrialSampleV1[],
  openingIndex: number,
  closureIndex: number,
  dtSec: number,
  cycleLengthSec: number,
  laActivationStartTheta: number,
): MitralWaveformAnalysisV1 {
  const sequence: UnwrappedMitralSampleV1[] = [];
  for (let offset = 0; offset <= samples.length; offset += 1) {
    const index = (openingIndex + offset) % samples.length;
    sequence.push({ index, elapsedSec: offset * dtSec, sample: samples[index]! });
    if (offset > 0 && index === closureIndex) break;
  }
  const fallbackIndex = firstIndexAtOrAfterTheta(samples, laActivationStartTheta);
  if (sequence.length < 8 || sequence.at(-1)!.elapsedSec > cycleLengthSec) {
    return emptyMitralWaveformAnalysis(fallbackIndex);
  }
  const activationOnsetOrdinal = findAtrialActivationOnsetOrdinal(
    sequence,
    laActivationStartTheta,
  );
  const eSearch = sequence.slice(0, activationOnsetOrdinal);
  const ePeakOrdinal = maxIndex(eSearch
    .map(({ sample }) => Math.max(0, sample.mitralVelocityCmPerSec)));
  const aSearch = sequence.slice(activationOnsetOrdinal);
  const aPeakOrdinal = activationOnsetOrdinal + maxIndex(aSearch
    .map(({ sample }) => Math.max(0, sample.mitralVelocityCmPerSec)));
  const eCandidatePeak = maxOf(eSearch
    .map(({ sample }) => Math.max(0, sample.mitralVelocityCmPerSec)));
  const aCandidatePeak = maxOf(aSearch
    .map(({ sample }) => Math.max(0, sample.mitralVelocityCmPerSec)));
  if (eCandidatePeak <= 1 || aCandidatePeak <= 1) {
    return emptyMitralWaveformAnalysis(
      fallbackIndex,
      "not-measurable",
      sequence[activationOnsetOrdinal]?.index ?? fallbackIndex,
    );
  }
  if (eSearch.length < 3 || ePeakOrdinal <= 0 ||
    ePeakOrdinal >= activationOnsetOrdinal - 1 ||
    aPeakOrdinal <= activationOnsetOrdinal || aPeakOrdinal <= ePeakOrdinal + 2) {
    return emptyMitralWaveformAnalysis(
      fallbackIndex,
      "not-measurable",
      sequence[activationOnsetOrdinal]?.index ?? fallbackIndex,
    );
  }
  const between = sequence.slice(ePeakOrdinal + 1, aPeakOrdinal);
  const turningOrdinal = ePeakOrdinal + 1 + minIndex(between
    .map(({ sample }) => sample.mitralVelocityCmPerSec));
  const ePeak = sequence[ePeakOrdinal]!.sample;
  const aPeak = sequence[aPeakOrdinal]!.sample;
  const turning = sequence[turningOrdinal]!.sample;
  const activationOnset = sequence[activationOnsetOrdinal]!.sample;
  const ePeakVelocity = Math.max(0, ePeak.mitralVelocityCmPerSec);
  const aPeakVelocity = Math.max(0, aPeak.mitralVelocityCmPerSec);
  const turningVelocity = Math.max(0, turning.mitralVelocityCmPerSec);
  const distinctPeaks = turningOrdinal > ePeakOrdinal && turningOrdinal < aPeakOrdinal &&
    ePeakVelocity - turningVelocity >= 0.15 * ePeakVelocity &&
    aPeakVelocity - turningVelocity >= 0.15 * aPeakVelocity;
  const velocityAtActivationOnset = Math.max(0, activationOnset.mitralVelocityCmPerSec);
  const fusionClass: MechanisticMitralWaveFusionClassV1 = !distinctPeaks
    ? "complete-fusion"
    : velocityAtActivationOnset > MITRAL_FUSION_VELOCITY_CM_PER_SEC
      ? "partial-fusion"
      : "separated";
  const eVtiCm = integrateMitralSequence(
    sequence,
    0,
    turningOrdinal,
    ({ sample }) => Math.max(0, sample.mitralVelocityCmPerSec),
  );
  const aVtiCm = integrateMitralSequence(
    sequence,
    turningOrdinal,
    sequence.length - 1,
    ({ sample }) => Math.max(0, sample.mitralVelocityCmPerSec),
  );
  const earlyForwardVolumeMl = integrateMitralSequence(
    sequence,
    0,
    turningOrdinal,
    ({ sample }) => Math.max(0, sample.qMitralMlPerSec),
  );
  const lateForwardVolumeMl = integrateMitralSequence(
    sequence,
    turningOrdinal,
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
    activationOnsetOrdinal,
    MITRAL_FUSION_VELOCITY_CM_PER_SEC,
    dtSec,
  );
  const diastasisDurationSec = eEndOrdinal >= 0 && eEndOrdinal < activationOnsetOrdinal
    ? sequence[activationOnsetOrdinal]!.elapsedSec - sequence[eEndOrdinal]!.elapsedSec
    : 0;
  const midDiastolicPeakVelocityCmPerSec = eEndOrdinal >= 0
    ? maxOf(sequence.slice(eEndOrdinal, activationOnsetOrdinal + 1)
      .map(({ sample }) => Math.max(0, sample.mitralVelocityCmPerSec)))
    : 0;
  const peakMeasurementValid = fusionClass === "separated" &&
    eAccelerationTimeSec > 0 && eVtiCm > 0 && aVtiCm > 0;
  const decelerationMeasurementValid = peakMeasurementValid && eDecelerationTimeSec > 0;
  const asymmetryRatio = eDecelerationTimeSec / Math.max(eAccelerationTimeSec, 1e-9);
  return {
    turningIndex: sequence[turningOrdinal]!.index,
    activationOnsetIndex: sequence[activationOnsetOrdinal]!.index,
    ePeakFlowMlPerSec: Math.max(0, ePeak.qMitralMlPerSec),
    aPeakFlowMlPerSec: Math.max(0, aPeak.qMitralMlPerSec),
    ePeakVelocityCmPerSec: ePeakVelocity,
    aPeakVelocityCmPerSec: aPeakVelocity,
    peakVelocityEToARatio: ePeakVelocity / Math.max(aPeakVelocity, 1e-9),
    eVtiCm,
    aVtiCm,
    vtiEToARatio: eVtiCm / Math.max(aVtiCm, 1e-9),
    earlyForwardVolumeMl,
    lateForwardVolumeMl,
    atrialFillingFraction: aVtiCm / Math.max(eVtiCm + aVtiCm, 1e-9),
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
    diastasisDurationSec,
    eaPeakSeparationSec: sequence[aPeakOrdinal]!.elapsedSec -
      sequence[ePeakOrdinal]!.elapsedSec,
    fusionClass,
    measurementValid: peakMeasurementValid,
    peakMeasurementValid,
    decelerationMeasurementValid,
    midDiastolicPeakVelocityCmPerSec,
    asymmetryRegime: eWaveAsymmetryRegime(asymmetryRatio, decelerationMeasurementValid),
  };
}

function emptyMitralWaveformAnalysis(
  turningIndex: number,
  fusionClass: MechanisticMitralWaveFusionClassV1 = "not-measurable",
  activationOnsetIndex = turningIndex,
): MitralWaveformAnalysisV1 {
  return {
    turningIndex,
    activationOnsetIndex,
    ePeakFlowMlPerSec: 0,
    aPeakFlowMlPerSec: 0,
    ePeakVelocityCmPerSec: 0,
    aPeakVelocityCmPerSec: 0,
    peakVelocityEToARatio: 0,
    eVtiCm: 0,
    aVtiCm: 0,
    vtiEToARatio: 0,
    earlyForwardVolumeMl: 0,
    lateForwardVolumeMl: 0,
    atrialFillingFraction: 0,
    eAccelerationTimeSec: 0,
    eDecelerationTimeSec: 0,
    eDecelerationToAccelerationRatio: 0,
    eRiseMonotoneFraction: 0,
    eDecayMonotoneFraction: 0,
    velocityAtAtrialActivationOnsetCmPerSec: 0,
    diastasisDurationSec: 0,
    eaPeakSeparationSec: 0,
    fusionClass,
    measurementValid: false,
    peakMeasurementValid: false,
    decelerationMeasurementValid: false,
    midDiastolicPeakVelocityCmPerSec: 0,
    asymmetryRegime: "not-measurable",
  };
}

function findAtrialActivationOnsetOrdinal(
  sequence: readonly UnwrappedMitralSampleV1[],
  expectedStartTheta: number,
): number {
  for (let i = 1; i < sequence.length - 1; i += 1) {
    const previous = sequence[i - 1]!.sample.laActivation01;
    const current = sequence[i]!.sample.laActivation01;
    const thetaDistance = positiveModulo(sequence[i]!.sample.theta - expectedStartTheta, 1);
    if (thetaDistance <= 0.25 && current >= 0.02 && current > previous + 1e-5) return i;
  }
  let nearest = 2;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let i = 2; i < sequence.length - 2; i += 1) {
    const distance = Math.min(
      positiveModulo(sequence[i]!.sample.theta - expectedStartTheta, 1),
      positiveModulo(expectedStartTheta - sequence[i]!.sample.theta, 1),
    );
    if (distance < nearestDistance) {
      nearest = i;
      nearestDistance = distance;
    }
  }
  return nearest;
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
  const points = candidates;
  const meanTime = points.reduce((sum, point) => sum + point.elapsedSec, 0) / points.length;
  const meanVelocity = points.reduce(
    (sum, point) => sum + Math.max(0, point.sample.mitralVelocityCmPerSec),
    0,
  ) / points.length;
  let numerator = 0;
  let denominator = 0;
  for (const point of points) {
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
  return decelerationTimeSec > 0 && decelerationTimeSec <=
      sequence.at(-1)!.elapsedSec
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

function eWaveAsymmetryRegime(
  decelerationToAccelerationRatio: number,
  measurable: boolean,
): MechanisticEWaveAsymmetryRegimeV1 {
  if (!measurable) return "not-measurable";
  if (decelerationToAccelerationRatio < 2.64) return "underdamped";
  if (decelerationToAccelerationRatio <= 3.78) return "transition";
  return "overdamped";
}

function assessMitralWaveform(
  waveform: MitralWaveformAnalysisV1,
): MechanisticMitralGateReadbackV1 {
  const measurementApplicability: MechanisticMitralMeasurementApplicabilityV1 =
    !waveform.peakMeasurementValid
      ? waveform.fusionClass === "complete-fusion" ||
          waveform.fusionClass === "partial-fusion"
        ? "not-applicable-fusion"
        : "not-applicable-unresolved-peaks"
      : "applicable";
  const applicable = measurementApplicability === "applicable";
  const fusionEligibility: MechanisticEvidenceGateStatusV1 =
    waveform.fusionClass === "separated" && applicable ? "pass" : "not-applicable";
  const ageSpecificPeakEToA = evidenceGate(
    applicable,
    waveform.peakVelocityEToARatio >= MIDDLE_AGE_MITRAL_PEAK_EA_RANGE[0] &&
      waveform.peakVelocityEToARatio <= MIDDLE_AGE_MITRAL_PEAK_EA_RANGE[1],
  );
  const atrialFillingFraction = evidenceGate(
    applicable,
    waveform.atrialFillingFraction >= ADULT_ATRIAL_FILLING_FRACTION_RANGE[0] &&
      waveform.atrialFillingFraction <= ADULT_ATRIAL_FILLING_FRACTION_RANGE[1],
  );
  const decelerationTime = evidenceGate(
    waveform.decelerationMeasurementValid,
    waveform.eDecelerationTimeSec >=
        MIDDLE_AGE_MITRAL_E_DECELERATION_TIME_SEC_RANGE[0] &&
      waveform.eDecelerationTimeSec <=
        MIDDLE_AGE_MITRAL_E_DECELERATION_TIME_SEC_RANGE[1],
  );
  const resolvedRiseAndDecay = evidenceGate(
    applicable,
    waveform.eRiseMonotoneFraction >= ENGINEERING_WAVEFORM_MONOTONICITY_FLOOR &&
      waveform.eDecayMonotoneFraction >= ENGINEERING_WAVEFORM_MONOTONICITY_FLOOR,
  );
  const resolvedLowFlowDiastasis = evidenceGate(
    applicable,
    waveform.diastasisDurationSec > 0 &&
      waveform.midDiastolicPeakVelocityCmPerSec <= MITRAL_FUSION_VELOCITY_CM_PER_SEC,
  );
  return {
    referenceAgeBand: "41-60",
    measurementApplicability,
    fusionEligibility,
    ageSpecificPeakEToA,
    atrialFillingFraction,
    decelerationTime,
    resolvedRiseAndDecay,
    resolvedLowFlowDiastasis,
    hardAcceptancePass: fusionEligibility === "pass" && ageSpecificPeakEToA === "pass",
    supportiveDiagnosticsPass:
      atrialFillingFraction === "pass" &&
      decelerationTime === "pass" &&
      resolvedRiseAndDecay === "pass" &&
      resolvedLowFlowDiastasis === "pass",
  };
}

function evidenceGate(
  applicable: boolean,
  passed: boolean,
): MechanisticEvidenceGateStatusV1 {
  return applicable ? passed ? "pass" : "fail" : "not-applicable";
}

function monotoneFraction(
  sequence: readonly UnwrappedMitralSampleV1[],
  startOrdinal: number,
  endOrdinal: number,
  direction: "rising" | "falling",
): number {
  const peak = maxOf(sequence.slice(startOrdinal, endOrdinal + 1)
    .map(({ sample }) => Math.max(0, sample.mitralVelocityCmPerSec)));
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

function conduitBelowChordFraction(
  conduit: readonly MechanisticAtrialSampleV1[],
  closure: MechanisticAtrialSampleV1,
  opening: MechanisticAtrialSampleV1,
): number {
  const dv = opening.laVolumeMl - closure.laVolumeMl;
  if (Math.abs(dv) < 1e-9 || conduit.length === 0) return 0;
  const eligible = conduit.filter((sample) => {
    const lo = Math.min(closure.laVolumeMl, opening.laVolumeMl);
    const hi = Math.max(closure.laVolumeMl, opening.laVolumeMl);
    return sample.laVolumeMl >= lo && sample.laVolumeMl <= hi;
  });
  if (eligible.length === 0) return 0;
  const below = eligible.filter((sample) => {
    const alpha = (sample.laVolumeMl - closure.laVolumeMl) / dv;
    const chordPressure = closure.laPressureMmHg +
      alpha * (opening.laPressureMmHg - closure.laPressureMmHg);
    return sample.laPressureMmHg < chordPressure;
  }).length;
  return below / eligible.length;
}

function conduitBelowPathFraction(
  conduit: readonly MechanisticAtrialSampleV1[],
  reservoir: readonly MechanisticAtrialSampleV1[],
): number {
  return pathOrderFraction(conduit, reservoir, "below", 0, 1);
}

function pathOrderFraction(
  path: readonly MechanisticAtrialSampleV1[],
  reference: readonly MechanisticAtrialSampleV1[],
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
  const ordered = eligible.filter(({ sample, pressure }) => relation === "below"
    ? sample.laPressureMmHg <= pressure
    : sample.laPressureMmHg >= pressure).length;
  return ordered / eligible.length;
}

function pathPressureEnvelopeAtVolume(
  path: readonly MechanisticAtrialSampleV1[],
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

type PathIntersectionV1 = {
  readonly pathAProgress01: number;
  readonly pathBProgress01: number;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
  readonly angleDeg: number;
};

type FigureEightCrossingV1 = {
  readonly source: "conduit" | "pumping";
  readonly phase: MechanisticAtrialFigureEightCrossingPhaseV1;
  readonly pathProgress01: number;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
  readonly angleDeg: number;
  readonly preferredWindow: boolean;
};

function pathIntersections(
  pathA: readonly MechanisticAtrialSampleV1[],
  pathB: readonly MechanisticAtrialSampleV1[],
): readonly PathIntersectionV1[] {
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

function pathIntersectionMetrics(
  intersections: readonly PathIntersectionV1[],
): { readonly intersects: boolean; readonly maxAngleDeg: number } {
  return {
    intersects: intersections.length > 0,
    maxAngleDeg: intersections.reduce(
      (maximum, intersection) => Math.max(maximum, intersection.angleDeg),
      0,
    ),
  };
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

function pathAboveChordMetrics(
  path: readonly MechanisticAtrialSampleV1[],
  start: Pick<FigureEightCrossingV1, "volumeMl" | "pressureMmHg">,
  end: MechanisticAtrialSampleV1,
  minimumProgress01: number,
): { readonly fraction: number; readonly minimumMarginMmHg: number } {
  const deltaVolume = end.laVolumeMl - start.volumeMl;
  if (path.length < 3 || Math.abs(deltaVolume) <= 1e-9) {
    return { fraction: 0, minimumMarginMmHg: 0 };
  }
  const volumeLow = Math.min(start.volumeMl, end.laVolumeMl);
  const volumeHigh = Math.max(start.volumeMl, end.laVolumeMl);
  const progress = normalizedArcProgress(path);
  const margins = path.flatMap((sample, index) => {
    if (index === 0 || index === path.length - 1) return [];
    if (progress[index]! < minimumProgress01) return [];
    if (sample.laVolumeMl < volumeLow || sample.laVolumeMl > volumeHigh) return [];
    const alpha = (sample.laVolumeMl - start.volumeMl) / deltaVolume;
    const chordPressure = start.pressureMmHg +
      alpha * (end.laPressureMmHg - start.pressureMmHg);
    return [sample.laPressureMmHg - chordPressure];
  });
  if (margins.length === 0) return { fraction: 0, minimumMarginMmHg: 0 };
  return {
    fraction: margins.filter((margin) => margin >= 0).length / margins.length,
    minimumMarginMmHg: Math.min(...margins),
  };
}

function normalizedArcProgress(
  path: readonly MechanisticAtrialSampleV1[],
  volumeScaleMl?: number,
  pressureScaleMmHg?: number,
): readonly number[] {
  if (path.length === 0) return [];
  const volumeScale = volumeScaleMl ?? Math.max(
    maxOf(path.map((sample) => sample.laVolumeMl)) -
      minOf(path.map((sample) => sample.laVolumeMl)),
    1e-9,
  );
  const pressureScale = pressureScaleMmHg ?? Math.max(
    maxOf(path.map((sample) => sample.laPressureMmHg)) -
      minOf(path.map((sample) => sample.laPressureMmHg)),
    1e-9,
  );
  const cumulative = [0];
  for (let i = 1; i < path.length; i += 1) {
    cumulative.push(cumulative[i - 1]! + Math.hypot(
      (path[i]!.laVolumeMl - path[i - 1]!.laVolumeMl) / volumeScale,
      (path[i]!.laPressureMmHg - path[i - 1]!.laPressureMmHg) / pressureScale,
    ));
  }
  const total = Math.max(cumulative.at(-1)!, 1e-12);
  return cumulative.map((value) => value / total);
}

function segmentIntersection(
  a: MechanisticAtrialSampleV1,
  b: MechanisticAtrialSampleV1,
  c: MechanisticAtrialSampleV1,
  d: MechanisticAtrialSampleV1,
): { readonly t: number; readonly u: number } | undefined {
  const rx = b.laVolumeMl - a.laVolumeMl;
  const ry = b.laPressureMmHg - a.laPressureMmHg;
  const sx = d.laVolumeMl - c.laVolumeMl;
  const sy = d.laPressureMmHg - c.laPressureMmHg;
  const denominator = rx * sy - ry * sx;
  if (Math.abs(denominator) <= 1e-12) return undefined;
  const qpx = c.laVolumeMl - a.laVolumeMl;
  const qpy = c.laPressureMmHg - a.laPressureMmHg;
  const t = (qpx * sy - qpy * sx) / denominator;
  const u = (qpx * ry - qpy * rx) / denominator;
  const epsilon = 1e-9;
  return t > epsilon && t < 1 - epsilon && u > epsilon && u < 1 - epsilon
    ? { t, u }
    : undefined;
}

function tangentJump(samples: readonly MechanisticAtrialSampleV1[], index: number): number {
  const width = 1;
  if (index < width || index + width >= samples.length) return Number.POSITIVE_INFINITY;
  const beforeA = samples[index - width]!;
  const beforeB = samples[index]!;
  const afterA = samples[index]!;
  const afterB = samples[index + width]!;
  const volumeRange = Math.max(
    maxOf(samples.map((sample) => sample.laVolumeMl)) - minOf(samples.map((sample) => sample.laVolumeMl)),
    1e-9,
  );
  const pressureRange = Math.max(
    maxOf(samples.map((sample) => sample.laPressureMmHg)) - minOf(samples.map((sample) => sample.laPressureMmHg)),
    1e-9,
  );
  const before = [
    (beforeB.laVolumeMl - beforeA.laVolumeMl) /
      (Math.max(beforeB.theta - beforeA.theta, 1e-9) * volumeRange),
    (beforeB.laPressureMmHg - beforeA.laPressureMmHg) /
      (Math.max(beforeB.theta - beforeA.theta, 1e-9) * pressureRange),
  ];
  const after = [
    (afterB.laVolumeMl - afterA.laVolumeMl) /
      (Math.max(afterB.theta - afterA.theta, 1e-9) * volumeRange),
    (afterB.laPressureMmHg - afterA.laPressureMmHg) /
      (Math.max(afterB.theta - afterA.theta, 1e-9) * pressureRange),
  ];
  const scale = Math.max(
    Math.hypot(before[0]!, before[1]!),
    Math.hypot(after[0]!, after[1]!),
    1e-9,
  );
  return Math.hypot(before[0]! - after[0]!, before[1]! - after[1]!) / scale;
}

function countProminentPeaks(values: readonly number[], prominence: number): number {
  let count = 0;
  for (let i = 1; i < values.length - 1; i += 1) {
    if (values[i]! > values[i - 1]! && values[i]! >= values[i + 1]! &&
      values[i]! - Math.min(values[i - 1]!, values[i + 1]!) >= prominence) count += 1;
  }
  return count;
}

function cycleStateConverged(
  start: OneFiberAVPlaneLeftHeartStateV1,
  end: OneFiberAVPlaneLeftHeartStateV1,
): boolean {
  return Math.abs(end.laVolumeMl - start.laVolumeMl) <= 0.05 &&
    Math.abs(end.lvVolumeMl - start.lvVolumeMl) <= 0.05 &&
    Math.abs(end.avPlane.positionCm - start.avPlane.positionCm) <= 5e-4 &&
    Math.abs(end.avPlane.velocityCmPerSec - start.avPlane.velocityCmPerSec) <= 0.005 &&
    Math.abs(end.mitralValve.qMlPerSec - start.mitralValve.qMlPerSec) <= 0.1 &&
    Math.abs(end.aorticValve.qMlPerSec - start.aorticValve.qMlPerSec) <= 0.1 &&
    Math.abs(end.pulmonaryVenousPressureMmHg - start.pulmonaryVenousPressureMmHg) <= 0.005 &&
    Math.abs(end.pulmonaryVenousFlowMlPerSec - start.pulmonaryVenousFlowMlPerSec) <= 0.1 &&
    Math.abs(end.aorticPressureMmHg - start.aorticPressureMmHg) <= 0.005 &&
    Math.abs(end.returnReservoirPressureMmHg - start.returnReservoirPressureMmHg) <= 0.005;
}

export type MechanisticLaPvPointV1 = Pick<
  MechanisticAtrialSampleV1,
  "laVolumeMl" | "laPressureMmHg"
>;

export function signedLaPvLoopAreaV1(samples: readonly MechanisticLaPvPointV1[]): number {
  if (samples.length < 3) return 0;
  let twiceArea = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const a = samples[i]!;
    const b = samples[(i + 1) % samples.length]!;
    twiceArea += a.laVolumeMl * b.laPressureMmHg - b.laVolumeMl * a.laPressureMmHg;
  }
  return 0.5 * twiceArea;
}

export function opposedLobeAreasPassV1(
  aSignedAreaMmHgMl: number,
  vSignedAreaMmHgMl: number,
  minimumAAreaMmHgMl = 0,
  minimumVAreaMmHgMl = 0,
): boolean {
  return Math.abs(aSignedAreaMmHgMl) >= minimumAAreaMmHgMl &&
    Math.abs(vSignedAreaMmHgMl) >= minimumVAreaMmHgMl &&
    aSignedAreaMmHgMl * vSignedAreaMmHgMl < 0;
}

function validSlice<T>(values: readonly T[], start: number, end: number): readonly T[] {
  const safeStart = Math.max(0, Math.min(start, values.length - 1));
  const safeEnd = Math.max(safeStart + 1, Math.min(end, values.length));
  return values.slice(safeStart, safeEnd);
}

function firstIndexAtOrAfterTheta(
  samples: readonly MechanisticAtrialSampleV1[],
  theta: number,
): number {
  const index = samples.findIndex((sample) => sample.theta >= theta);
  return index >= 0 ? index : Math.max(0, samples.length - 1);
}

function profile(
  profiles: readonly MechanisticAtrialProfileResultV1[],
  profileId: MechanisticAtrialProfileIdV1,
): MechanisticAtrialProfileResultV1 {
  return profiles.find((row) => row.profileId === profileId)!;
}

function range(values: readonly number[]): readonly [number, number] {
  return [round(minOf(values)), round(maxOf(values))];
}

function minIndex(values: readonly number[]): number {
  let index = 0;
  for (let i = 1; i < values.length; i += 1) if (values[i]! < values[index]!) index = i;
  return index;
}

function maxIndex(values: readonly number[]): number {
  let index = 0;
  for (let i = 1; i < values.length; i += 1) if (values[i]! > values[index]!) index = i;
  return index;
}

function minOf(values: readonly number[]): number {
  return values.length ? Math.min(...values) : 0;
}

function maxOf(values: readonly number[]): number {
  return values.length ? Math.max(...values) : 0;
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function roundSample(sample: MechanisticAtrialSampleV1): MechanisticAtrialSampleV1 {
  return Object.fromEntries(Object.entries(sample).map(([key, value]) => [
    key,
    typeof value === "number" ? round(value) : value,
  ])) as unknown as MechanisticAtrialSampleV1;
}
