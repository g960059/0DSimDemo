import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_CLAIM_BOUNDARY_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_EQUATIONS_VERSION_ID_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_MODEL_ID_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_RHYTHM_TOPOLOGY_ID_V1,
  NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1,
  initialNoAvpdFourChamberHillTriSegStateV1,
  stepNoAvpdFourChamberHillTriSegV1,
  totalBloodVolumeMl,
  type NoAvpdFourChamberHillTriSegParamsV1,
  type NoAvpdFourChamberHillTriSegStateV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";
import {
  summarizeNoAvpdEventResolvedDiagnosticsV1,
  type NoAvpdEventResolvedDiagnosticsV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdEventResolvedDiagnosticsV1";

export const NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_BENCH_ID_V1 =
  "no-avpd-four-chamber-hill-triseg-bench-v1" as const;

export type NoAvpdFourChamberWarmStartProvenanceV1 = {
  readonly resumeMode: "exact-same-parameter-checkpoint";
  readonly sourceArtifactId: string;
  readonly sourceNormalizedSha256: string;
  readonly sourceParameterSha256: string;
  readonly sourceImplementationSha256: string;
  readonly sourceModelId: typeof NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_MODEL_ID_V1;
  readonly sourceEquationsVersionId: typeof NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_EQUATIONS_VERSION_ID_V1;
  readonly sourceStateLayoutId: typeof NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1;
  readonly sourceRhythmTopologyId: typeof NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_RHYTHM_TOPOLOGY_ID_V1;
  readonly sourceCycleLengthSec: number;
  readonly sourceDtSec: number;
  readonly sourceTotalBloodVolumeMl: number;
  readonly periodClassification: "period-1" | "period-2" | "unclassified";
};

export type NoAvpdFourChamberBenchOptionsV1 = {
  readonly beats: number;
  readonly dtSec: number;
  readonly sampleEverySteps: number;
  readonly params?: NoAvpdFourChamberHillTriSegParamsV1;
  /** Exact accepted state at a cycle boundary; never a best failed trial. */
  readonly initialState?: NoAvpdFourChamberHillTriSegStateV1;
  /** Required whenever initialState is supplied. */
  readonly warmStartProvenance?: NoAvpdFourChamberWarmStartProvenanceV1;
  /** Compact reports retain the last two complete beats plus the final boundary. */
  readonly sampleRetention?: "all" | "last-two-complete-beats";
};

export type NoAvpdFourChamberBenchWallIdV1 =
  "la" | "ra" | "lvFreeWall" | "septum" | "rvFreeWall";

type NoAvpdFourChamberBenchWallScalarsV1 = Readonly<
  Record<NoAvpdFourChamberBenchWallIdV1, number>
>;

type NoAvpdFourChamberDynamicWallIdV1 =
  keyof NoAvpdFourChamberHillTriSegStateV1["walls"];

type NoAvpdFourChamberReturnMapUnitGroupV1 =
  | "volumesMl"
  | "flowsMlPerSec"
  | "calciumDriverStates01"
  | "wallStrains"
  | "wallSlsOverstressPa"
  | "wallCaTroponin01"
  | "wallThinFilamentAvailability01"
  | "triSegJunctionRadiusCm"
  | "triSegSeptalCapVolumeMl";

type NoAvpdFourChamberReturnMapDriftStatsV1 = {
  readonly componentCount: number;
  readonly maxAbs: number;
  readonly rms: number;
};

type NoAvpdFourChamberReturnMapComparisonV1 = {
  readonly beatSpan: 1 | 2;
  readonly earlierRunBeatIndex: number;
  readonly laterRunBeatIndex: number;
  readonly earlierBoundaryTimeSec: number;
  readonly laterBoundaryTimeSec: number;
  readonly expectedSeparationSec: number;
  readonly observedSeparationSec: number;
  readonly phaseAlignmentErrorSec: number;
  /** Raw differences are grouped so RMS values never mix physical units. */
  readonly rawDriftByNativeUnit: Readonly<
    Record<
      NoAvpdFourChamberReturnMapUnitGroupV1,
      NoAvpdFourChamberReturnMapDriftStatsV1
    >
  >;
  readonly normalizedFullStateDrift: {
    readonly componentCount: number;
    readonly maxAbsDimensionless: number;
    readonly rmsDimensionless: number;
    readonly maximumComponentPath: string;
    readonly normalizationMethod: "abs-delta/max(1-native-unit,abs-earlier,abs-later)-per-component";
  };
};

type NoAvpdFourChamberExactBoundaryStateV1 = {
  readonly runBeatIndex: number;
  readonly state: NoAvpdFourChamberHillTriSegStateV1;
};

const NO_AVPD_FOUR_CHAMBER_DYNAMIC_WALL_IDS_V1: readonly NoAvpdFourChamberDynamicWallIdV1[] =
  ["leftAtrium", "rightAtrium", "leftFreeWall", "septum", "rightFreeWall"];

export type NoAvpdFourChamberBenchSampleV1 = {
  readonly timeSec: number;
  readonly beatIndex: number;
  readonly phase01: number;
  readonly volumesMl: NoAvpdFourChamberHillTriSegStateV1["volumes"];
  readonly pressuresMmHg: {
    readonly la: number;
    readonly lv: number;
    readonly sa: number;
    readonly sv: number;
    readonly ra: number;
    readonly rv: number;
    readonly pa: number;
    readonly pve: number;
  };
  readonly flowsMlPerSec: {
    readonly mv: number;
    readonly aov: number;
    readonly systemic: number;
    readonly svf: number;
    readonly tv: number;
    readonly pulmonaryValve: number;
    readonly pulmonary: number;
    readonly pvf: number;
  };
  readonly activations01: {
    readonly la: number;
    readonly ra: number;
    readonly lvFreeWall: number;
    readonly septum: number;
    readonly rvFreeWall: number;
  };
  /** Dimensional prescribed free calcium; this is not a force command. */
  readonly freeCalciumUm: NoAvpdFourChamberBenchWallScalarsV1;
  /** Accepted Land-form regulatory-site occupancy. */
  readonly caTroponin01: NoAvpdFourChamberBenchWallScalarsV1;
  /** Algebraic thin-filament availability derived from CaTRPN. */
  readonly thinFilamentAvailability01: NoAvpdFourChamberBenchWallScalarsV1;
  readonly triSeg: {
    readonly junctionRadiusCm: number;
    readonly septalCapVolumeMl: number;
    readonly septalCurvaturePerM: number;
    readonly relativeResidual: number;
  };
  readonly wallReadback: Readonly<
    Record<
      "la" | "ra" | "lvFreeWall" | "septum" | "rvFreeWall",
      {
        readonly totalStrain: number;
        readonly ceStrain: number;
        readonly freeCalciumUm: number;
        readonly midpointFreeCalciumUm: number;
        readonly caTroponin01: number;
        readonly thinFilamentAvailability01: number;
        readonly halfActivationCalciumUm: number | null;
        readonly totalStressKPa: number;
        readonly contractileTensionKPa: number;
        readonly seriesTensionKPa: number;
        readonly passiveStressKPa: number;
        readonly slsOverstressKPa: number;
        readonly lengthFactor: number;
        readonly forceVelocityFactor: number;
      }
    >
  >;
  /**
   * Accepted dynamic-state evidence retained for phase-matched cycle drift.
   * It is diagnostic only and does not add a convergence gate.
   */
  readonly acceptedDynamicState: {
    readonly flows: NoAvpdFourChamberHillTriSegStateV1["flows"];
    readonly calciumDrivers: NoAvpdFourChamberHillTriSegStateV1["calciumDrivers"];
    readonly walls: NoAvpdFourChamberHillTriSegStateV1["walls"];
    readonly triSegContinuation: NoAvpdFourChamberHillTriSegStateV1["triSegContinuation"];
  };
  readonly numeric: {
    readonly globalIterations: number;
    readonly globalResidualEvaluations: number;
    readonly globalJacobianEvaluations: number;
    readonly globalJacobianReusedIterations: number;
    readonly globalFreshJacobianRetries: number;
    readonly globalLineSearchBacktracks: number;
    readonly globalMaxScaledResidual: number;
    readonly totalBloodVolumeResidualMl: number;
    readonly maxSerialEquilibriumResidualPa: number;
    readonly maxSlsBalanceResidualJPerM3: number;
    readonly maxSerialWorkBalanceResidualJPerM3: number;
  };
};

export type NoAvpdFourChamberBenchResultV1 = {
  readonly benchId: typeof NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_BENCH_ID_V1;
  /** `pass` below covers structural and numerical gates only. */
  readonly statusScope: "structural-numerical-only";
  readonly status: "pass" | "fail";
  readonly failureReason: string | null;
  readonly beatsRequested: number;
  readonly beatsCompleted: number;
  readonly dtSec: number;
  readonly runProtocol: {
    readonly modelId: typeof NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_MODEL_ID_V1;
    readonly equationsVersionId: typeof NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_EQUATIONS_VERSION_ID_V1;
    readonly stateLayoutId: typeof NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1;
    readonly rhythmTopologyId: typeof NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_RHYTHM_TOPOLOGY_ID_V1;
    readonly cycleLengthSec: number;
    readonly heartRateBpm: number;
    readonly sampleEverySteps: number;
    readonly sampledIntervalSec: number;
    readonly sampleRetention: "all" | "last-two-complete-beats";
    readonly initialization: {
      readonly mode: "cold" | "warm-resume";
      readonly initialTimeSec: number;
      readonly phaseAnchor: "cycle-boundary";
      readonly warmStartIsAcceptanceEvidence: false;
      readonly provenanceVerification: "caller-owned-runner-may-verify";
      readonly provenance: NoAvpdFourChamberWarmStartProvenanceV1 | null;
    };
    readonly timeStepRefinementPerformed: false;
    readonly limitCycleIsHardGate: false;
    readonly physiologyIsHardGate: false;
    readonly prescribedCalciumCanClaimCalciumCyclingAlternans: false;
    readonly modelClaimBoundary: typeof NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_CLAIM_BOUNDARY_V1;
  };
  /** Exact input object used by this report; its hash is added by the writer. */
  readonly parameterSnapshot: NoAvpdFourChamberHillTriSegParamsV1;
  readonly stateLayoutId: typeof NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1;
  /** Accepted terminal checkpoint for an explicitly provenance-checked resume. */
  readonly finalState: NoAvpdFourChamberHillTriSegStateV1;
  readonly samples: readonly NoAvpdFourChamberBenchSampleV1[];
  readonly lastBeatSamples: readonly NoAvpdFourChamberBenchSampleV1[];
  readonly hardDiagnostics: {
    readonly allStepsAccepted: boolean;
    readonly maxAbsTotalBloodVolumeDriftMl: number;
    readonly maxAbsStepBloodVolumeResidualMl: number;
    readonly maxGlobalScaledResidual: number;
    readonly maxTriSegRelativeResidual: number;
    readonly maxSerialEquilibriumResidualPa: number;
    readonly maxSlsBalanceResidualJPerM3: number;
    readonly maxSerialWorkBalanceResidualJPerM3: number;
  };
  /** Deterministic work counters; wall-clock time is reported only by the CLI. */
  readonly solverWork: {
    readonly stepsAttempted: number;
    readonly stepsAccepted: number;
    readonly totalGlobalIterations: number;
    readonly totalGlobalResidualEvaluations: number;
    readonly totalGlobalJacobianEvaluations: number;
    readonly totalGlobalJacobianReusedIterations: number;
    readonly totalGlobalFreshJacobianRetries: number;
    readonly totalGlobalLineSearchBacktracks: number;
    readonly maximumGlobalIterationsPerStep: number;
    readonly maximumGlobalResidualEvaluationsPerStep: number;
    readonly meanGlobalIterationsPerAcceptedStep: number | null;
    readonly meanGlobalResidualEvaluationsPerAcceptedStep: number | null;
  };
  /**
   * A sampled, report-only comparison between the final two complete beats.
   * This is intentionally not part of `status`: V1 has not fixed a convergence
   * tolerance or a time-step-refinement protocol.
   */
  readonly reportOnlyCycleConvergence: {
    readonly previousBeatIndex: number;
    readonly currentBeatIndex: number;
    readonly previousSampleTimeSec: number;
    readonly currentSampleTimeSec: number;
    readonly previousPhase01: number;
    readonly currentPhase01: number;
    /** Signed shortest phase mismatch, current minus previous, in seconds. */
    readonly comparedPhaseOffsetSec: number;
    /** Current-beat minus previous-beat blood volume at the compared samples. */
    readonly compartmentVolumeDriftMl: NoAvpdFourChamberHillTriSegStateV1["volumes"];
    readonly maxAbsCompartmentVolumeDriftMl: number;
    readonly dynamicStateDrift: {
      readonly flowsMlPerSec: {
        readonly mitralValve: number;
        readonly aorticValve: number;
        readonly tricuspidValve: number;
        readonly pulmonaryValve: number;
        readonly pulmonaryVenousFlow: number;
        readonly systemicVenousFlow: number;
      };
      readonly calciumDrivers: NoAvpdFourChamberHillTriSegStateV1["calciumDrivers"];
      readonly walls: NoAvpdFourChamberHillTriSegStateV1["walls"];
      readonly triSegContinuation: NoAvpdFourChamberHillTriSegStateV1["triSegContinuation"];
    };
    readonly maxAbsFlowStateDriftMlPerSec: number;
    readonly maxAbsCalciumDriverStateDrift01: number;
    readonly maxAbsWallStrainDrift: number;
    readonly maxAbsWallSlsOverstressDriftPa: number;
    readonly maxAbsWallCaTroponinDrift01: number;
    /** Zero when no wall uses the opt-in dynamic thin-filament state. */
    readonly maxAbsWallThinFilamentAvailabilityDrift01: number;
    readonly absTriSegJunctionRadiusDriftCm: number;
    readonly absTriSegSeptalCapVolumeDriftMl: number;
  } | null;
  /**
   * Exact accepted-state return-map residuals at step-index cycle boundaries.
   * This remains report-only: neither a tolerance nor a period classifier is
   * defined in V1, and it cannot change `status`.
   */
  readonly reportOnlyExactBeatBoundaryReturnMap: {
    readonly evidenceStatus: "report-only-not-an-acceptance-gate";
    readonly availability:
      | "available-exact-integer-step-boundaries"
      | "unavailable-cycle-length-not-integer-multiple-of-dt";
    readonly boundaryDetectionMethod: "accepted-step-index-modulo-integer-steps-per-cycle-no-interpolation";
    readonly stateDefinition: "all-accepted-state-components-except-absolute-time-including-triseg-continuation";
    readonly cycleLengthOverDt: number;
    readonly stepsPerCycle: number | null;
    readonly totalBoundaryCountCaptured: number;
    readonly retainedBoundaryCount: number;
    readonly lastBoundaryRunBeatIndex: number | null;
    readonly oneBeatMapResidual: NoAvpdFourChamberReturnMapComparisonV1 | null;
    readonly twoBeatMapResidual: NoAvpdFourChamberReturnMapComparisonV1 | null;
    readonly comparisonSemantics: {
      readonly oneBeat: "final-boundary-minus-one-beat-earlier-boundary";
      readonly twoBeat: "final-boundary-minus-two-beats-earlier-boundary";
    };
    readonly thresholdsApplied: false;
    readonly periodClassification: "not-performed";
    readonly interpretationBoundary: "small-residuals-alone-do-not-establish-stability-or-a-period-class";
  };
  /** Raw-sample shape descriptors only; none is an acceptance threshold. */
  readonly reportOnlyLvpMorphology: {
    readonly evidenceStatus: "report-only-not-an-acceptance-gate";
    readonly sampleTreatment: "raw-last-beat-samples-no-smoothing";
    readonly thresholdCrossingMethod: "piecewise-linear-between-raw-samples";
    readonly baselineMinimumMmHg: number;
    readonly peakMmHg: number;
    readonly pulseAmplitudeMmHg: number;
    readonly peakPhase01: number;
    readonly width50Sec: number | null;
    readonly width80Sec: number | null;
    readonly width90Sec: number | null;
    readonly width50FractionOfCycle: number | null;
    readonly width80FractionOfCycle: number | null;
    readonly width90FractionOfCycle: number | null;
    readonly width80ToWidth50: number | null;
    readonly width90ToWidth50: number | null;
    readonly width90ToWidth80: number | null;
    readonly secondaryLocalPeakCountAbove50: number;
    readonly maximumRisingSideReversalMmHg: number;
    readonly maximumFallingSideReversalMmHg: number;
    readonly reversalToleranceMmHg: number;
    readonly nonUnimodalityDetected: boolean;
    readonly classification:
      | "pointed-single-dome"
      | "rounded-single-dome"
      | "flat-topped-single-dome"
      | "multi-peaked-or-shouldered"
      | "incomplete-threshold-crossings";
    readonly classificationRule: "descriptive-only:nonunimodal-first;otherwise-width90-to-width50";
    readonly classificationScope: "upper-dome-above-50-percent-of-pulse-only";
    readonly classificationCutoffs: {
      readonly pointedUpperExclusive: 0.25;
      readonly flatToppedLowerExclusive: 0.65;
    };
  } | null;
  /** Peak timing through the LVFW Ca -> myofilament -> force -> pressure chain. */
  readonly reportOnlyLvActivationTiming: {
    readonly evidenceStatus: "report-only-not-an-acceptance-gate";
    readonly peakMethod: "maximum-raw-sample-earliest-phase-on-tie";
    readonly peakOffsetConvention: "signed-shortest-phase-difference";
    readonly offsetInterpretation: "peak-phase-offset-not-causal-propagation-delay";
    readonly freeCalciumPeakPhase01: number;
    readonly caTroponinPeakPhase01: number;
    readonly thinFilamentAvailabilityPeakPhase01: number;
    readonly seriesTensionPeakPhase01: number;
    readonly lvPressurePeakPhase01: number;
    readonly calciumToCaTroponinPeakOffsetSec: number;
    readonly caTroponinToThinFilamentPeakOffsetSec: number;
    readonly thinFilamentToSeriesTensionPeakOffsetSec: number;
    readonly seriesTensionToLvPressurePeakOffsetSec: number;
    readonly calciumToLvPressurePeakOffsetSec: number;
  } | null;
  readonly reportOnlyPhysiology: {
    readonly evidenceStatus: "fixed-phase-window-proxies-not-acceptance-gates";
    readonly mitralPeakMethod: "fixed-phase-window-maximum-flow-proxy";
    readonly pulmonaryVenousPeakMethod: "fixed-phase-window-extremum-flow-proxy";
    readonly lvEndDiastolicVolumeMl: number | null;
    readonly lvEndSystolicVolumeMl: number | null;
    readonly lvEjectionFraction01: number | null;
    readonly rvEndDiastolicVolumeMl: number | null;
    readonly rvEndSystolicVolumeMl: number | null;
    readonly rvEjectionFraction01: number | null;
    readonly mitralEPeakMlPerSec: number | null;
    readonly mitralAPeakMlPerSec: number | null;
    readonly mitralEToA: number | null;
    readonly pulmonaryVenousSPeakMlPerSec: number | null;
    readonly pulmonaryVenousDPeakMlPerSec: number | null;
    readonly pulmonaryVenousArMinMlPerSec: number | null;
  };
  /**
   * Raw operational smooth-valve/Ca/waveform events. These do not alter the
   * structural status and are not clinical leaflet or Doppler measurements.
   */
  readonly reportOnlyEventResolvedDiagnostics: NoAvpdEventResolvedDiagnosticsV1;
};

export function runNoAvpdFourChamberHillTriSegBenchV1(
  options: NoAvpdFourChamberBenchOptionsV1 = {
    beats: 2,
    dtSec: 0.002,
    sampleEverySteps: 2,
  },
): NoAvpdFourChamberBenchResultV1 {
  const params =
    options.params ?? DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
  const sampleRetention = options.sampleRetention ?? "all";
  const coldInitial = initialNoAvpdFourChamberHillTriSegStateV1(params);
  const initial = options.initialState ?? coldInitial;
  validateBenchInitialization(
    initial,
    coldInitial,
    params,
    options.dtSec,
    options.initialState == null ? null : (options.warmStartProvenance ?? null),
    options.initialState != null,
  );
  if (options.initialState == null && options.warmStartProvenance != null) {
    throw new Error("warmStartProvenance requires initialState");
  }
  const initialTimeSec = initial.timeSec;
  const requestedDurationSec = options.beats * params.cycleLengthSec;
  const stepCount = Math.ceil(requestedDurationSec / options.dtSec);
  const exactStepsPerCycle = exactIntegerStepsPerCycle(
    params.cycleLengthSec,
    options.dtSec,
  );
  const exactBoundaryStates: NoAvpdFourChamberExactBoundaryStateV1[] =
    exactStepsPerCycle === null ? [] : [{ runBeatIndex: 0, state: initial }];
  let totalExactBoundaryCountCaptured = exactBoundaryStates.length;
  const initialBloodVolumeMl = totalBloodVolumeMl(initial.volumes);
  let state = initial;
  const samples: NoAvpdFourChamberBenchSampleV1[] = [];
  let failureReason: string | null = null;
  let maxAbsTotalBloodVolumeDriftMl = 0;
  let maxAbsStepBloodVolumeResidualMl = 0;
  let maxGlobalScaledResidual = 0;
  let maxTriSegRelativeResidual = 0;
  let maxSerialEquilibriumResidualPa = 0;
  let maxSlsBalanceResidualJPerM3 = 0;
  let maxSerialWorkBalanceResidualJPerM3 = 0;
  let stepsAttempted = 0;
  let stepsAccepted = 0;
  let totalGlobalIterations = 0;
  let totalGlobalResidualEvaluations = 0;
  let totalGlobalJacobianEvaluations = 0;
  let totalGlobalJacobianReusedIterations = 0;
  let totalGlobalFreshJacobianRetries = 0;
  let totalGlobalLineSearchBacktracks = 0;
  let maximumGlobalIterationsPerStep = 0;
  let maximumGlobalResidualEvaluationsPerStep = 0;

  for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
    const output = stepNoAvpdFourChamberHillTriSegV1(
      state,
      options.dtSec,
      params,
    );
    stepsAttempted += 1;
    totalGlobalIterations += output.solver.iterations;
    totalGlobalResidualEvaluations += output.solver.residualEvaluations;
    totalGlobalJacobianEvaluations += output.solver.jacobianEvaluations;
    totalGlobalJacobianReusedIterations +=
      output.solver.jacobianReusedIterations;
    totalGlobalFreshJacobianRetries += output.solver.freshJacobianRetries;
    totalGlobalLineSearchBacktracks += output.solver.lineSearchBacktracks;
    maximumGlobalIterationsPerStep = Math.max(
      maximumGlobalIterationsPerStep,
      output.solver.iterations,
    );
    maximumGlobalResidualEvaluationsPerStep = Math.max(
      maximumGlobalResidualEvaluationsPerStep,
      output.solver.residualEvaluations,
    );
    if (!output.accepted || output.evaluation === null) {
      failureReason = `step-${stepIndex}:${output.failureReasons.join(",")}`;
      break;
    }
    stepsAccepted += 1;
    state = output.state;
    if (
      exactStepsPerCycle !== null &&
      (stepIndex + 1) % exactStepsPerCycle === 0
    ) {
      exactBoundaryStates.push({
        runBeatIndex: (stepIndex + 1) / exactStepsPerCycle,
        state,
      });
      totalExactBoundaryCountCaptured += 1;
      if (exactBoundaryStates.length > 3) exactBoundaryStates.shift();
    }
    const evaluation = output.evaluation;
    const wallTrials = [
      evaluation.leftAtrium.materialTrial,
      evaluation.rightAtrium.materialTrial,
      ...Object.values(evaluation.ventricles.materialTrials),
    ];
    const totalVolumeDriftMl =
      totalBloodVolumeMl(state.volumes) - initialBloodVolumeMl;
    const stepVolumeResidualMl =
      output.totalBloodVolumeResidualMl ?? Number.NaN;
    const triSegResidual =
      evaluation.ventricles.triSeg.diagnostics.relativeResidualMagnitude;
    const serialResidual = maximum(
      wallTrials.map((trial) =>
        Math.abs(trial.readback.stresses.serialEquilibriumResidualPa),
      ),
    );
    const slsResidual = maximum(
      wallTrials.map((trial) =>
        Math.abs(trial.readback.slsBalance.discreteBalanceResidualJPerM3),
      ),
    );
    const serialWorkResidual = maximum(
      wallTrials.map((trial) =>
        Math.abs(trial.readback.serialWork.discreteBalanceResidualJPerM3),
      ),
    );
    maxAbsTotalBloodVolumeDriftMl = Math.max(
      maxAbsTotalBloodVolumeDriftMl,
      Math.abs(totalVolumeDriftMl),
    );
    maxAbsStepBloodVolumeResidualMl = Math.max(
      maxAbsStepBloodVolumeResidualMl,
      Math.abs(stepVolumeResidualMl),
    );
    maxGlobalScaledResidual = Math.max(
      maxGlobalScaledResidual,
      output.solver.maxScaledResidual,
    );
    maxTriSegRelativeResidual = Math.max(
      maxTriSegRelativeResidual,
      triSegResidual,
    );
    maxSerialEquilibriumResidualPa = Math.max(
      maxSerialEquilibriumResidualPa,
      serialResidual,
    );
    maxSlsBalanceResidualJPerM3 = Math.max(
      maxSlsBalanceResidualJPerM3,
      slsResidual,
    );
    maxSerialWorkBalanceResidualJPerM3 = Math.max(
      maxSerialWorkBalanceResidualJPerM3,
      serialWorkResidual,
    );

    if (
      stepIndex % Math.max(1, options.sampleEverySteps) === 0 ||
      stepIndex === stepCount - 1
    ) {
      const triSegGeometry = evaluation.ventricles.triSeg.geometry;
      if (!triSegGeometry.valid) {
        failureReason = `step-${stepIndex}:invalid-triseg-geometry`;
        break;
      }
      const elapsedRunSec = state.timeSec - initialTimeSec;
      const sampleCycleCoordinate = cycleCoordinateAtAcceptedStep(
        stepIndex + 1,
        exactStepsPerCycle,
        elapsedRunSec,
        params.cycleLengthSec,
      );
      samples.push({
        timeSec: state.timeSec,
        beatIndex: sampleCycleCoordinate.beatIndex,
        phase01: sampleCycleCoordinate.phase01,
        volumesMl: state.volumes,
        pressuresMmHg: {
          la: evaluation.pressures.leftAtriumMmHg,
          lv: evaluation.pressures.leftVentricleMmHg,
          sa: evaluation.pressures.systemicArteryMmHg,
          sv: evaluation.pressures.systemicVeinMmHg,
          ra: evaluation.pressures.rightAtriumMmHg,
          rv: evaluation.pressures.rightVentricleMmHg,
          pa: evaluation.pressures.pulmonaryArteryMmHg,
          pve: evaluation.pressures.pulmonaryVeinMmHg,
        },
        flowsMlPerSec: {
          mv: evaluation.flowReadback.mitralMlPerSec,
          aov: evaluation.flowReadback.aorticMlPerSec,
          systemic: evaluation.flowReadback.systemicPeripheralMlPerSec,
          svf: evaluation.flowReadback.systemicVenousMlPerSec,
          tv: evaluation.flowReadback.tricuspidMlPerSec,
          pulmonaryValve: evaluation.flowReadback.pulmonaryValveMlPerSec,
          pulmonary: evaluation.flowReadback.pulmonaryPeripheralMlPerSec,
          pvf: evaluation.flowReadback.pulmonaryVenousMlPerSec,
        },
        activations01: {
          la: evaluation.activations01.leftAtrium,
          ra: evaluation.activations01.rightAtrium,
          lvFreeWall: evaluation.activations01.leftFreeWall,
          septum: evaluation.activations01.septum,
          rvFreeWall: evaluation.activations01.rightFreeWall,
        },
        freeCalciumUm: {
          la: evaluation.freeCalciumUm.leftAtrium,
          ra: evaluation.freeCalciumUm.rightAtrium,
          lvFreeWall: evaluation.freeCalciumUm.leftFreeWall,
          septum: evaluation.freeCalciumUm.septum,
          rvFreeWall: evaluation.freeCalciumUm.rightFreeWall,
        },
        caTroponin01: {
          la: evaluation.leftAtrium.materialTrial.readback.caTroponin01,
          ra: evaluation.rightAtrium.materialTrial.readback.caTroponin01,
          lvFreeWall:
            evaluation.ventricles.materialTrials.leftFreeWall.readback
              .caTroponin01,
          septum:
            evaluation.ventricles.materialTrials.septum.readback.caTroponin01,
          rvFreeWall:
            evaluation.ventricles.materialTrials.rightFreeWall.readback
              .caTroponin01,
        },
        thinFilamentAvailability01: {
          la: evaluation.leftAtrium.materialTrial.readback
            .thinFilamentAvailability01,
          ra: evaluation.rightAtrium.materialTrial.readback
            .thinFilamentAvailability01,
          lvFreeWall:
            evaluation.ventricles.materialTrials.leftFreeWall.readback
              .thinFilamentAvailability01,
          septum:
            evaluation.ventricles.materialTrials.septum.readback
              .thinFilamentAvailability01,
          rvFreeWall:
            evaluation.ventricles.materialTrials.rightFreeWall.readback
              .thinFilamentAvailability01,
        },
        triSeg: {
          junctionRadiusCm:
            evaluation.ventricles.triSeg.coordinates.junctionRadiusCm,
          septalCapVolumeMl:
            evaluation.ventricles.triSeg.coordinates.septalCapVolumeMl,
          septalCurvaturePerM: triSegGeometry.walls.septum.curvaturePerM,
          relativeResidual: triSegResidual,
        },
        wallReadback: {
          la: wallReadback(evaluation.leftAtrium.materialTrial),
          ra: wallReadback(evaluation.rightAtrium.materialTrial),
          lvFreeWall: wallReadback(
            evaluation.ventricles.materialTrials.leftFreeWall,
          ),
          septum: wallReadback(evaluation.ventricles.materialTrials.septum),
          rvFreeWall: wallReadback(
            evaluation.ventricles.materialTrials.rightFreeWall,
          ),
        },
        acceptedDynamicState: {
          flows: state.flows,
          calciumDrivers: state.calciumDrivers,
          walls: state.walls,
          triSegContinuation: state.triSegContinuation,
        },
        numeric: {
          globalIterations: output.solver.iterations,
          globalResidualEvaluations: output.solver.residualEvaluations,
          globalJacobianEvaluations: output.solver.jacobianEvaluations,
          globalJacobianReusedIterations:
            output.solver.jacobianReusedIterations,
          globalFreshJacobianRetries: output.solver.freshJacobianRetries,
          globalLineSearchBacktracks: output.solver.lineSearchBacktracks,
          globalMaxScaledResidual: output.solver.maxScaledResidual,
          totalBloodVolumeResidualMl: stepVolumeResidualMl,
          maxSerialEquilibriumResidualPa: serialResidual,
          maxSlsBalanceResidualJPerM3: slsResidual,
          maxSerialWorkBalanceResidualJPerM3: serialWorkResidual,
        },
      });
      if (sampleRetention === "last-two-complete-beats") {
        const latestBeatIndex = samples[samples.length - 1]!.beatIndex;
        const minimumRetainedBeatIndex = Math.max(0, latestBeatIndex - 2);
        const firstRetainedIndex = samples.findIndex(
          (sample) => sample.beatIndex >= minimumRetainedBeatIndex,
        );
        if (firstRetainedIndex > 0) samples.splice(0, firstRetainedIndex);
      }
    }
  }

  const elapsedRunSec = state.timeSec - initialTimeSec;
  const beatsCompleted = Math.floor(
    elapsedRunSec / params.cycleLengthSec + 1e-9,
  );
  // A sample exactly on the cycle boundary belongs to the next beat by floor(),
  // so select the last fully completed interval rather than the last sample id.
  const finalCompleteBeatIndex = beatsCompleted > 0 ? beatsCompleted - 1 : 0;
  const lastBeatSamples = samples.filter(
    (sample) => sample.beatIndex === finalCompleteBeatIndex,
  );
  const eventAnchorBeatIndex = beatsCompleted >= 2 ? beatsCompleted - 2 : null;
  const observedTwoCycleEventSamples =
    eventAnchorBeatIndex === null
      ? []
      : samples
          .filter(
            (sample) =>
              sample.beatIndex === eventAnchorBeatIndex ||
              sample.beatIndex === eventAnchorBeatIndex + 1 ||
              (sample.beatIndex === eventAnchorBeatIndex + 2 &&
                Math.abs(sample.phase01) <= 1e-12),
          )
          .map((sample) => ({
            ...sample,
            phase01: sample.beatIndex - eventAnchorBeatIndex + sample.phase01,
          }))
          .sort((left, right) => left.phase01 - right.phase01);
  return {
    benchId: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_BENCH_ID_V1,
    statusScope: "structural-numerical-only",
    status:
      failureReason === null && beatsCompleted >= options.beats
        ? "pass"
        : "fail",
    failureReason,
    beatsRequested: options.beats,
    beatsCompleted,
    dtSec: options.dtSec,
    runProtocol: {
      modelId: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_MODEL_ID_V1,
      equationsVersionId:
        NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_EQUATIONS_VERSION_ID_V1,
      stateLayoutId: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1,
      rhythmTopologyId: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_RHYTHM_TOPOLOGY_ID_V1,
      cycleLengthSec: params.cycleLengthSec,
      heartRateBpm: 60 / params.cycleLengthSec,
      sampleEverySteps: Math.max(1, options.sampleEverySteps),
      sampledIntervalSec: options.dtSec * Math.max(1, options.sampleEverySteps),
      sampleRetention,
      initialization: {
        mode: options.initialState == null ? "cold" : "warm-resume",
        initialTimeSec,
        phaseAnchor: "cycle-boundary",
        warmStartIsAcceptanceEvidence: false,
        provenanceVerification: "caller-owned-runner-may-verify",
        provenance:
          options.initialState == null
            ? null
            : (options.warmStartProvenance ?? null),
      },
      timeStepRefinementPerformed: false,
      limitCycleIsHardGate: false,
      physiologyIsHardGate: false,
      prescribedCalciumCanClaimCalciumCyclingAlternans: false,
      modelClaimBoundary: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_CLAIM_BOUNDARY_V1,
    },
    parameterSnapshot: params,
    stateLayoutId: NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1,
    finalState: state,
    samples,
    lastBeatSamples,
    hardDiagnostics: {
      allStepsAccepted: failureReason === null,
      maxAbsTotalBloodVolumeDriftMl,
      maxAbsStepBloodVolumeResidualMl,
      maxGlobalScaledResidual,
      maxTriSegRelativeResidual,
      maxSerialEquilibriumResidualPa,
      maxSlsBalanceResidualJPerM3,
      maxSerialWorkBalanceResidualJPerM3,
    },
    solverWork: {
      stepsAttempted,
      stepsAccepted,
      totalGlobalIterations,
      totalGlobalResidualEvaluations,
      totalGlobalJacobianEvaluations,
      totalGlobalJacobianReusedIterations,
      totalGlobalFreshJacobianRetries,
      totalGlobalLineSearchBacktracks,
      maximumGlobalIterationsPerStep,
      maximumGlobalResidualEvaluationsPerStep,
      meanGlobalIterationsPerAcceptedStep:
        stepsAccepted > 0 ? totalGlobalIterations / stepsAccepted : null,
      meanGlobalResidualEvaluationsPerAcceptedStep:
        stepsAccepted > 0
          ? totalGlobalResidualEvaluations / stepsAccepted
          : null,
    },
    reportOnlyCycleConvergence: summarizeCycleConvergence(
      samples,
      beatsCompleted,
      params.cycleLengthSec,
    ),
    reportOnlyExactBeatBoundaryReturnMap: summarizeExactBeatBoundaryReturnMap(
      exactBoundaryStates,
      totalExactBoundaryCountCaptured,
      params.cycleLengthSec,
      options.dtSec,
      exactStepsPerCycle,
    ),
    reportOnlyLvpMorphology: summarizeLvpMorphology(
      lastBeatSamples,
      params.cycleLengthSec,
    ),
    reportOnlyLvActivationTiming: summarizeLvActivationTiming(
      lastBeatSamples,
      params.cycleLengthSec,
    ),
    reportOnlyPhysiology: summarizePhysiology(lastBeatSamples),
    reportOnlyEventResolvedDiagnostics:
      summarizeNoAvpdEventResolvedDiagnosticsV1({
        samples: observedTwoCycleEventSamples,
        params,
        dtSec: options.dtSec,
        sampleEverySteps: Math.max(1, options.sampleEverySteps),
        exactStepsPerCycle,
        eventAnchorBeatIndex,
      }),
  };
}

function validateBenchInitialization(
  initial: NoAvpdFourChamberHillTriSegStateV1,
  coldInitial: NoAvpdFourChamberHillTriSegStateV1,
  params: NoAvpdFourChamberHillTriSegParamsV1,
  dtSec: number,
  provenance: NoAvpdFourChamberWarmStartProvenanceV1 | null,
  warm: boolean,
): void {
  if (warm && provenance == null) {
    throw new Error("warm initialState requires warmStartProvenance");
  }
  const values = [
    initial.timeSec,
    ...Object.values(initial.volumes),
    initial.flows.mitralValve.qMlPerSec,
    initial.flows.aorticValve.qMlPerSec,
    initial.flows.tricuspidValve.qMlPerSec,
    initial.flows.pulmonaryValve.qMlPerSec,
    initial.flows.pulmonaryVenousFlowMlPerSec,
    initial.flows.systemicVenousFlowMlPerSec,
    ...Object.values(initial.calciumDrivers).flatMap((driver) => [
      driver.riseState01,
      driver.decayState01,
    ]),
    ...Object.values(initial.walls).flatMap((wall) => [
      wall.totalStrain,
      wall.ceStrain,
      wall.slsOverstressPa,
      wall.caTroponin01,
    ]),
    initial.triSegContinuation.junctionRadiusCm,
    initial.triSegContinuation.septalCapVolumeMl,
  ];
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("initialState contains a non-finite value");
  }
  if (initial.timeSec < 0)
    throw new Error("initialState.timeSec must be nonnegative");
  if (
    Object.values(initial.volumes).some(
      (volume) => volume < params.solver.minimumBloodVolumeMl,
    )
  ) {
    throw new Error(
      "initialState contains a blood volume below the admissible minimum",
    );
  }
  if (
    Object.values(initial.calciumDrivers).some(
      (driver) => driver.riseState01 < 0 || driver.decayState01 < 0,
    )
  ) {
    throw new Error(
      "initialState contains a negative prescribed-calcium state",
    );
  }
  if (
    Object.values(initial.walls).some(
      (wall) => wall.caTroponin01 < 0 || wall.caTroponin01 > 1,
    )
  ) {
    throw new Error("initialState contains CaTRPN outside [0,1]");
  }
  const phaseSec = positiveModulo(initial.timeSec, params.cycleLengthSec);
  const phaseDistanceSec = Math.min(phaseSec, params.cycleLengthSec - phaseSec);
  if (phaseDistanceSec > Math.max(1e-9, params.cycleLengthSec * 1e-9)) {
    throw new Error(
      "initialState must be anchored at a cardiac-cycle boundary",
    );
  }

  const initialBloodVolumeMl = totalBloodVolumeMl(initial.volumes);
  const referenceBloodVolumeMl = totalBloodVolumeMl(coldInitial.volumes);
  const bloodToleranceMl = Math.max(
    params.solver.totalBloodVolumeToleranceMl,
    1e-6,
  );
  if (
    Math.abs(initialBloodVolumeMl - referenceBloodVolumeMl) > bloodToleranceMl
  ) {
    throw new Error(
      "initialState belongs to a different total-blood-volume class",
    );
  }
  if (provenance == null) return;
  if (
    provenance.sourceModelId !== NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_MODEL_ID_V1
  ) {
    throw new Error("warm-start model id is incompatible");
  }
  if (
    provenance.sourceEquationsVersionId !==
    NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_EQUATIONS_VERSION_ID_V1
  ) {
    throw new Error("warm-start equations version is incompatible");
  }
  if (
    provenance.sourceStateLayoutId !==
    NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_STATE_LAYOUT_ID_V1
  ) {
    throw new Error("warm-start state layout is incompatible");
  }
  if (
    provenance.sourceRhythmTopologyId !==
    NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_RHYTHM_TOPOLOGY_ID_V1
  ) {
    throw new Error("warm-start rhythm topology is incompatible");
  }
  if (
    Math.abs(provenance.sourceCycleLengthSec - params.cycleLengthSec) > 1e-12
  ) {
    throw new Error("warm-start cycle length is incompatible");
  }
  if (Math.abs(provenance.sourceDtSec - dtSec) > 1e-15) {
    throw new Error("warm-start time step is incompatible with exact resume");
  }
  if (
    Math.abs(provenance.sourceTotalBloodVolumeMl - initialBloodVolumeMl) >
    bloodToleranceMl
  ) {
    throw new Error(
      "warm-start total-blood-volume provenance does not match its state",
    );
  }
  for (const [field, value] of [
    ["sourceArtifactId", provenance.sourceArtifactId],
    ["sourceNormalizedSha256", provenance.sourceNormalizedSha256],
    ["sourceParameterSha256", provenance.sourceParameterSha256],
    ["sourceImplementationSha256", provenance.sourceImplementationSha256],
  ] as const) {
    if (value.trim().length === 0)
      throw new Error(`warm-start ${field} must be nonempty`);
  }
}

function exactIntegerStepsPerCycle(
  cycleLengthSec: number,
  dtSec: number,
): number | null {
  if (
    !Number.isFinite(cycleLengthSec) ||
    !Number.isFinite(dtSec) ||
    cycleLengthSec <= 0 ||
    dtSec <= 0
  ) {
    return null;
  }
  const ratio = cycleLengthSec / dtSec;
  const rounded = Math.round(ratio);
  const floatingPointTolerance = Math.max(
    1e-12,
    16 * Number.EPSILON * Math.max(1, Math.abs(ratio)),
  );
  return rounded >= 1 && Math.abs(ratio - rounded) <= floatingPointTolerance
    ? rounded
    : null;
}

function cycleCoordinateAtAcceptedStep(
  acceptedStepNumber: number,
  exactStepsPerCycle: number | null,
  elapsedRunSec: number,
  cycleLengthSec: number,
): { readonly beatIndex: number; readonly phase01: number } {
  if (exactStepsPerCycle !== null) {
    return {
      beatIndex: Math.floor(acceptedStepNumber / exactStepsPerCycle),
      phase01: (acceptedStepNumber % exactStepsPerCycle) / exactStepsPerCycle,
    };
  }
  return {
    beatIndex: Math.floor(elapsedRunSec / cycleLengthSec + 1e-12),
    phase01: positiveModulo(elapsedRunSec, cycleLengthSec) / cycleLengthSec,
  };
}

function summarizeExactBeatBoundaryReturnMap(
  retainedBoundaries: readonly NoAvpdFourChamberExactBoundaryStateV1[],
  totalBoundaryCountCaptured: number,
  cycleLengthSec: number,
  dtSec: number,
  stepsPerCycle: number | null,
): NoAvpdFourChamberBenchResultV1["reportOnlyExactBeatBoundaryReturnMap"] {
  const finalBoundary = retainedBoundaries.at(-1) ?? null;
  const previousBoundary = retainedBoundaries.at(-2) ?? null;
  const twoBeatsEarlierBoundary = retainedBoundaries.at(-3) ?? null;
  return {
    evidenceStatus: "report-only-not-an-acceptance-gate",
    availability:
      stepsPerCycle === null
        ? "unavailable-cycle-length-not-integer-multiple-of-dt"
        : "available-exact-integer-step-boundaries",
    boundaryDetectionMethod:
      "accepted-step-index-modulo-integer-steps-per-cycle-no-interpolation",
    stateDefinition:
      "all-accepted-state-components-except-absolute-time-including-triseg-continuation",
    cycleLengthOverDt: cycleLengthSec / dtSec,
    stepsPerCycle,
    totalBoundaryCountCaptured,
    retainedBoundaryCount: retainedBoundaries.length,
    lastBoundaryRunBeatIndex: finalBoundary?.runBeatIndex ?? null,
    oneBeatMapResidual:
      finalBoundary !== null && previousBoundary !== null
        ? compareExactBeatBoundaries(
            previousBoundary,
            finalBoundary,
            cycleLengthSec,
            1,
          )
        : null,
    twoBeatMapResidual:
      finalBoundary !== null && twoBeatsEarlierBoundary !== null
        ? compareExactBeatBoundaries(
            twoBeatsEarlierBoundary,
            finalBoundary,
            cycleLengthSec,
            2,
          )
        : null,
    comparisonSemantics: {
      oneBeat: "final-boundary-minus-one-beat-earlier-boundary",
      twoBeat: "final-boundary-minus-two-beats-earlier-boundary",
    },
    thresholdsApplied: false,
    periodClassification: "not-performed",
    interpretationBoundary:
      "small-residuals-alone-do-not-establish-stability-or-a-period-class",
  };
}

function compareExactBeatBoundaries(
  earlier: NoAvpdFourChamberExactBoundaryStateV1,
  later: NoAvpdFourChamberExactBoundaryStateV1,
  cycleLengthSec: number,
  beatSpan: 1 | 2,
): NoAvpdFourChamberReturnMapComparisonV1 {
  const earlierComponents = fullReturnMapStateComponents(earlier.state);
  const laterComponents = fullReturnMapStateComponents(later.state);
  if (earlierComponents.length !== laterComponents.length) {
    throw new Error("return-map state layouts differ between cycle boundaries");
  }
  const pairedComponents = laterComponents.map((laterComponent, index) => {
    const earlierComponent = earlierComponents[index];
    if (
      earlierComponent.path !== laterComponent.path ||
      earlierComponent.unitGroup !== laterComponent.unitGroup
    ) {
      throw new Error(
        "return-map state component ordering changed between boundaries",
      );
    }
    const delta = laterComponent.value - earlierComponent.value;
    const normalizationScale = Math.max(
      1,
      Math.abs(earlierComponent.value),
      Math.abs(laterComponent.value),
    );
    return {
      path: laterComponent.path,
      unitGroup: laterComponent.unitGroup,
      delta,
      normalizedAbsDelta: Math.abs(delta) / normalizationScale,
    };
  });
  const normalizedMaximum = pairedComponents.reduce((largest, component) =>
    component.normalizedAbsDelta > largest.normalizedAbsDelta
      ? component
      : largest,
  );
  const expectedSeparationSec = beatSpan * cycleLengthSec;
  const observedSeparationSec = later.state.timeSec - earlier.state.timeSec;
  return {
    beatSpan,
    earlierRunBeatIndex: earlier.runBeatIndex,
    laterRunBeatIndex: later.runBeatIndex,
    earlierBoundaryTimeSec: earlier.state.timeSec,
    laterBoundaryTimeSec: later.state.timeSec,
    expectedSeparationSec,
    observedSeparationSec,
    phaseAlignmentErrorSec: Math.abs(
      observedSeparationSec - expectedSeparationSec,
    ),
    rawDriftByNativeUnit: Object.fromEntries(
      RETURN_MAP_UNIT_GROUPS_V1.map((unitGroup) => [
        unitGroup,
        driftStats(
          pairedComponents
            .filter((component) => component.unitGroup === unitGroup)
            .map((component) => component.delta),
        ),
      ]),
    ) as Readonly<
      Record<
        NoAvpdFourChamberReturnMapUnitGroupV1,
        NoAvpdFourChamberReturnMapDriftStatsV1
      >
    >,
    normalizedFullStateDrift: {
      componentCount: pairedComponents.length,
      maxAbsDimensionless: normalizedMaximum.normalizedAbsDelta,
      rmsDimensionless: Math.sqrt(
        pairedComponents.reduce(
          (sum, component) => sum + component.normalizedAbsDelta ** 2,
          0,
        ) / pairedComponents.length,
      ),
      maximumComponentPath: normalizedMaximum.path,
      normalizationMethod:
        "abs-delta/max(1-native-unit,abs-earlier,abs-later)-per-component",
    },
  };
}

const RETURN_MAP_UNIT_GROUPS_V1: readonly NoAvpdFourChamberReturnMapUnitGroupV1[] =
  [
    "volumesMl",
    "flowsMlPerSec",
    "calciumDriverStates01",
    "wallStrains",
    "wallSlsOverstressPa",
    "wallCaTroponin01",
    "wallThinFilamentAvailability01",
    "triSegJunctionRadiusCm",
    "triSegSeptalCapVolumeMl",
  ];

type NoAvpdFourChamberReturnMapStateComponentV1 = {
  readonly path: string;
  readonly unitGroup: NoAvpdFourChamberReturnMapUnitGroupV1;
  readonly value: number;
};

function fullReturnMapStateComponents(
  state: NoAvpdFourChamberHillTriSegStateV1,
): readonly NoAvpdFourChamberReturnMapStateComponentV1[] {
  const components: NoAvpdFourChamberReturnMapStateComponentV1[] = [];
  const append = (
    path: string,
    unitGroup: NoAvpdFourChamberReturnMapUnitGroupV1,
    value: number,
  ) => components.push({ path, unitGroup, value });

  for (const [name, value] of Object.entries(state.volumes)) {
    append(`volumes.${name}`, "volumesMl", value);
  }
  append(
    "flows.mitralValve.qMlPerSec",
    "flowsMlPerSec",
    state.flows.mitralValve.qMlPerSec,
  );
  append(
    "flows.aorticValve.qMlPerSec",
    "flowsMlPerSec",
    state.flows.aorticValve.qMlPerSec,
  );
  append(
    "flows.tricuspidValve.qMlPerSec",
    "flowsMlPerSec",
    state.flows.tricuspidValve.qMlPerSec,
  );
  append(
    "flows.pulmonaryValve.qMlPerSec",
    "flowsMlPerSec",
    state.flows.pulmonaryValve.qMlPerSec,
  );
  append(
    "flows.pulmonaryVenousFlowMlPerSec",
    "flowsMlPerSec",
    state.flows.pulmonaryVenousFlowMlPerSec,
  );
  append(
    "flows.systemicVenousFlowMlPerSec",
    "flowsMlPerSec",
    state.flows.systemicVenousFlowMlPerSec,
  );
  for (const wallId of NO_AVPD_FOUR_CHAMBER_DYNAMIC_WALL_IDS_V1) {
    const driver = state.calciumDrivers[wallId];
    append(
      `calciumDrivers.${wallId}.riseState01`,
      "calciumDriverStates01",
      driver.riseState01,
    );
    append(
      `calciumDrivers.${wallId}.decayState01`,
      "calciumDriverStates01",
      driver.decayState01,
    );
    const wall = state.walls[wallId];
    append(`walls.${wallId}.totalStrain`, "wallStrains", wall.totalStrain);
    append(`walls.${wallId}.ceStrain`, "wallStrains", wall.ceStrain);
    append(
      `walls.${wallId}.slsOverstressPa`,
      "wallSlsOverstressPa",
      wall.slsOverstressPa,
    );
    append(
      `walls.${wallId}.caTroponin01`,
      "wallCaTroponin01",
      wall.caTroponin01,
    );
    if (wall.thinFilamentAvailability01 !== undefined) {
      append(
        `walls.${wallId}.thinFilamentAvailability01`,
        "wallThinFilamentAvailability01",
        wall.thinFilamentAvailability01,
      );
    }
  }
  append(
    "triSegContinuation.junctionRadiusCm",
    "triSegJunctionRadiusCm",
    state.triSegContinuation.junctionRadiusCm,
  );
  append(
    "triSegContinuation.septalCapVolumeMl",
    "triSegSeptalCapVolumeMl",
    state.triSegContinuation.septalCapVolumeMl,
  );
  return components;
}

function driftStats(
  values: readonly number[],
): NoAvpdFourChamberReturnMapDriftStatsV1 {
  if (values.length === 0) {
    return { componentCount: 0, maxAbs: 0, rms: 0 };
  }
  return {
    componentCount: values.length,
    maxAbs: maximum(values.map(Math.abs)),
    rms: Math.sqrt(
      values.reduce((sum, value) => sum + value ** 2, 0) / values.length,
    ),
  };
}

function summarizeCycleConvergence(
  samples: readonly NoAvpdFourChamberBenchSampleV1[],
  beatsCompleted: number,
  cycleLengthSec: number,
): NoAvpdFourChamberBenchResultV1["reportOnlyCycleConvergence"] {
  if (beatsCompleted < 2) return null;

  const previousBeatIndex = beatsCompleted - 2;
  const currentBeatIndex = beatsCompleted - 1;
  const previousBeatSamples = samples.filter(
    (sample) => sample.beatIndex === previousBeatIndex,
  );
  const currentBeatSamples = samples.filter(
    (sample) => sample.beatIndex === currentBeatIndex,
  );
  if (previousBeatSamples.length === 0 || currentBeatSamples.length === 0)
    return null;

  // Use the latest in-beat sample from the final complete beat, then select the
  // closest sampled phase in the prior beat. Reporting the residual phase
  // mismatch prevents sparse sampling from masquerading as cycle convergence.
  const currentSample = currentBeatSamples.reduce((latest, sample) =>
    sample.timeSec > latest.timeSec ? sample : latest,
  );
  const previousSample = previousBeatSamples.reduce((closest, sample) =>
    Math.abs(shortestPhaseDifference01(currentSample.phase01, sample.phase01)) <
    Math.abs(shortestPhaseDifference01(currentSample.phase01, closest.phase01))
      ? sample
      : closest,
  );
  const compartmentVolumeDriftMl = {
    leftAtriumMl:
      currentSample.volumesMl.leftAtriumMl -
      previousSample.volumesMl.leftAtriumMl,
    leftVentricleMl:
      currentSample.volumesMl.leftVentricleMl -
      previousSample.volumesMl.leftVentricleMl,
    systemicArteryMl:
      currentSample.volumesMl.systemicArteryMl -
      previousSample.volumesMl.systemicArteryMl,
    systemicVeinMl:
      currentSample.volumesMl.systemicVeinMl -
      previousSample.volumesMl.systemicVeinMl,
    rightAtriumMl:
      currentSample.volumesMl.rightAtriumMl -
      previousSample.volumesMl.rightAtriumMl,
    rightVentricleMl:
      currentSample.volumesMl.rightVentricleMl -
      previousSample.volumesMl.rightVentricleMl,
    pulmonaryArteryMl:
      currentSample.volumesMl.pulmonaryArteryMl -
      previousSample.volumesMl.pulmonaryArteryMl,
    pulmonaryVeinMl:
      currentSample.volumesMl.pulmonaryVeinMl -
      previousSample.volumesMl.pulmonaryVeinMl,
  };
  const previousDynamic = previousSample.acceptedDynamicState;
  const currentDynamic = currentSample.acceptedDynamicState;
  const dynamicStateDrift = {
    flowsMlPerSec: {
      mitralValve:
        currentDynamic.flows.mitralValve.qMlPerSec -
        previousDynamic.flows.mitralValve.qMlPerSec,
      aorticValve:
        currentDynamic.flows.aorticValve.qMlPerSec -
        previousDynamic.flows.aorticValve.qMlPerSec,
      tricuspidValve:
        currentDynamic.flows.tricuspidValve.qMlPerSec -
        previousDynamic.flows.tricuspidValve.qMlPerSec,
      pulmonaryValve:
        currentDynamic.flows.pulmonaryValve.qMlPerSec -
        previousDynamic.flows.pulmonaryValve.qMlPerSec,
      pulmonaryVenousFlow:
        currentDynamic.flows.pulmonaryVenousFlowMlPerSec -
        previousDynamic.flows.pulmonaryVenousFlowMlPerSec,
      systemicVenousFlow:
        currentDynamic.flows.systemicVenousFlowMlPerSec -
        previousDynamic.flows.systemicVenousFlowMlPerSec,
    },
    calciumDrivers: mapDynamicWallRecords(
      currentDynamic.calciumDrivers,
      previousDynamic.calciumDrivers,
      (current, previous) => ({
        riseState01: current.riseState01 - previous.riseState01,
        decayState01: current.decayState01 - previous.decayState01,
      }),
    ),
    walls: mapDynamicWallRecords(
      currentDynamic.walls,
      previousDynamic.walls,
      (current, previous) => {
        const currentThinFilament = current.thinFilamentAvailability01;
        const previousThinFilament = previous.thinFilamentAvailability01;
        if (
          (currentThinFilament === undefined) !==
          (previousThinFilament === undefined)
        ) {
          throw new Error(
            "sampled cycle comparison encountered different thin-filament state layouts",
          );
        }
        return {
          totalStrain: current.totalStrain - previous.totalStrain,
          ceStrain: current.ceStrain - previous.ceStrain,
          slsOverstressPa: current.slsOverstressPa - previous.slsOverstressPa,
          caTroponin01: current.caTroponin01 - previous.caTroponin01,
          ...(currentThinFilament === undefined
            ? {}
            : {
                thinFilamentAvailability01:
                  currentThinFilament - previousThinFilament!,
              }),
        };
      },
    ),
    triSegContinuation: {
      junctionRadiusCm:
        currentDynamic.triSegContinuation.junctionRadiusCm -
        previousDynamic.triSegContinuation.junctionRadiusCm,
      septalCapVolumeMl:
        currentDynamic.triSegContinuation.septalCapVolumeMl -
        previousDynamic.triSegContinuation.septalCapVolumeMl,
    },
  };
  return {
    previousBeatIndex,
    currentBeatIndex,
    previousSampleTimeSec: previousSample.timeSec,
    currentSampleTimeSec: currentSample.timeSec,
    previousPhase01: previousSample.phase01,
    currentPhase01: currentSample.phase01,
    comparedPhaseOffsetSec:
      shortestPhaseDifference01(currentSample.phase01, previousSample.phase01) *
      cycleLengthSec,
    compartmentVolumeDriftMl,
    maxAbsCompartmentVolumeDriftMl: maximum(
      Object.values(compartmentVolumeDriftMl).map(Math.abs),
    ),
    dynamicStateDrift,
    maxAbsFlowStateDriftMlPerSec: maximum(
      Object.values(dynamicStateDrift.flowsMlPerSec).map(Math.abs),
    ),
    maxAbsCalciumDriverStateDrift01: maximum(
      Object.values(dynamicStateDrift.calciumDrivers).flatMap((driver) => [
        Math.abs(driver.riseState01),
        Math.abs(driver.decayState01),
      ]),
    ),
    maxAbsWallStrainDrift: maximum(
      Object.values(dynamicStateDrift.walls).flatMap((wall) => [
        Math.abs(wall.totalStrain),
        Math.abs(wall.ceStrain),
      ]),
    ),
    maxAbsWallSlsOverstressDriftPa: maximum(
      Object.values(dynamicStateDrift.walls).map((wall) =>
        Math.abs(wall.slsOverstressPa),
      ),
    ),
    maxAbsWallCaTroponinDrift01: maximum(
      Object.values(dynamicStateDrift.walls).map((wall) =>
        Math.abs(wall.caTroponin01),
      ),
    ),
    maxAbsWallThinFilamentAvailabilityDrift01: maximumOrZero(
      Object.values(dynamicStateDrift.walls).flatMap((wall) =>
        wall.thinFilamentAvailability01 === undefined
          ? []
          : [Math.abs(wall.thinFilamentAvailability01)],
      ),
    ),
    absTriSegJunctionRadiusDriftCm: Math.abs(
      dynamicStateDrift.triSegContinuation.junctionRadiusCm,
    ),
    absTriSegSeptalCapVolumeDriftMl: Math.abs(
      dynamicStateDrift.triSegContinuation.septalCapVolumeMl,
    ),
  };
}

type UnwrappedLvpPoint = {
  readonly phase: number;
  readonly pressureMmHg: number;
};

type RawThresholdCrossings = {
  readonly risingPhase: number;
  readonly fallingPhase: number;
};

function summarizeLvpMorphology(
  samples: readonly NoAvpdFourChamberBenchSampleV1[],
  cycleLengthSec: number,
): NoAvpdFourChamberBenchResultV1["reportOnlyLvpMorphology"] {
  const ordered = samples
    .filter(
      (sample) =>
        Number.isFinite(sample.phase01) &&
        Number.isFinite(sample.pressuresMmHg.lv),
    )
    .slice()
    .sort((left, right) => left.phase01 - right.phase01);
  if (
    ordered.length < 4 ||
    !Number.isFinite(cycleLengthSec) ||
    cycleLengthSec <= 0
  ) {
    return null;
  }

  let peakIndex = 0;
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].pressuresMmHg.lv > ordered[peakIndex].pressuresMmHg.lv) {
      peakIndex = index;
    }
  }
  const baselineMinimumMmHg = minimum(
    ordered.map((sample) => sample.pressuresMmHg.lv),
  );
  const peakMmHg = ordered[peakIndex].pressuresMmHg.lv;
  const pulseAmplitudeMmHg = peakMmHg - baselineMinimumMmHg;
  if (!Number.isFinite(pulseAmplitudeMmHg) || pulseAmplitudeMmHg <= 0)
    return null;

  const unwrapped = unwrappedLvpPoints(ordered, peakIndex);
  const unwrappedPeakIndex = ordered.length;
  const threshold50 = baselineMinimumMmHg + 0.5 * pulseAmplitudeMmHg;
  const threshold80 = baselineMinimumMmHg + 0.8 * pulseAmplitudeMmHg;
  const threshold90 = baselineMinimumMmHg + 0.9 * pulseAmplitudeMmHg;
  const crossing50 = rawThresholdCrossings(
    unwrapped,
    unwrappedPeakIndex,
    threshold50,
  );
  const crossing80 = rawThresholdCrossings(
    unwrapped,
    unwrappedPeakIndex,
    threshold80,
  );
  const crossing90 = rawThresholdCrossings(
    unwrapped,
    unwrappedPeakIndex,
    threshold90,
  );
  const width50Sec = crossingWidthSec(crossing50, cycleLengthSec);
  const width80Sec = crossingWidthSec(crossing80, cycleLengthSec);
  const width90Sec = crossingWidthSec(crossing90, cycleLengthSec);
  const width80ToWidth50 = positiveRatio(width80Sec, width50Sec);
  const width90ToWidth50 = positiveRatio(width90Sec, width50Sec);
  const width90ToWidth80 = positiveRatio(width90Sec, width80Sec);

  const reversalToleranceMmHg = Math.max(1e-6, pulseAmplitudeMmHg * 1e-3);
  const peakPhase = unwrapped[unwrappedPeakIndex].phase;
  const windowStart = crossing50?.risingPhase ?? peakPhase;
  const windowEnd = crossing50?.fallingPhase ?? peakPhase;
  const risingPoints = unwrapped.filter(
    (point) => point.phase >= windowStart && point.phase <= peakPhase,
  );
  const fallingPoints = unwrapped.filter(
    (point) => point.phase >= peakPhase && point.phase <= windowEnd,
  );
  const maximumRisingSideReversalMmHg = maximumDirectionalReversal(
    risingPoints,
    "rising",
  );
  const maximumFallingSideReversalMmHg = maximumDirectionalReversal(
    fallingPoints,
    "falling",
  );
  const secondaryLocalPeakCountAbove50 = countSecondaryLocalPeaks(
    unwrapped,
    unwrappedPeakIndex,
    windowStart,
    windowEnd,
    threshold50,
    reversalToleranceMmHg,
  );
  const nonUnimodalityDetected =
    secondaryLocalPeakCountAbove50 > 0 ||
    maximumRisingSideReversalMmHg > reversalToleranceMmHg ||
    maximumFallingSideReversalMmHg > reversalToleranceMmHg;
  const classification = classifyLvpShape(
    nonUnimodalityDetected,
    width90ToWidth50,
  );

  return {
    evidenceStatus: "report-only-not-an-acceptance-gate",
    sampleTreatment: "raw-last-beat-samples-no-smoothing",
    thresholdCrossingMethod: "piecewise-linear-between-raw-samples",
    baselineMinimumMmHg,
    peakMmHg,
    pulseAmplitudeMmHg,
    peakPhase01: ordered[peakIndex].phase01,
    width50Sec,
    width80Sec,
    width90Sec,
    width50FractionOfCycle: positiveRatio(width50Sec, cycleLengthSec),
    width80FractionOfCycle: positiveRatio(width80Sec, cycleLengthSec),
    width90FractionOfCycle: positiveRatio(width90Sec, cycleLengthSec),
    width80ToWidth50,
    width90ToWidth50,
    width90ToWidth80,
    secondaryLocalPeakCountAbove50,
    maximumRisingSideReversalMmHg,
    maximumFallingSideReversalMmHg,
    reversalToleranceMmHg,
    nonUnimodalityDetected,
    classification,
    classificationRule:
      "descriptive-only:nonunimodal-first;otherwise-width90-to-width50",
    classificationScope: "upper-dome-above-50-percent-of-pulse-only",
    classificationCutoffs: {
      pointedUpperExclusive: 0.25,
      flatToppedLowerExclusive: 0.65,
    },
  };
}

function summarizeLvActivationTiming(
  samples: readonly NoAvpdFourChamberBenchSampleV1[],
  cycleLengthSec: number,
): NoAvpdFourChamberBenchResultV1["reportOnlyLvActivationTiming"] {
  if (
    samples.length === 0 ||
    !Number.isFinite(cycleLengthSec) ||
    cycleLengthSec <= 0
  ) {
    return null;
  }
  const freeCalciumPeakPhase01 = rawPeakPhase01(
    samples,
    (sample) => sample.freeCalciumUm.lvFreeWall,
  );
  const caTroponinPeakPhase01 = rawPeakPhase01(
    samples,
    (sample) => sample.caTroponin01.lvFreeWall,
  );
  const thinFilamentAvailabilityPeakPhase01 = rawPeakPhase01(
    samples,
    (sample) => sample.thinFilamentAvailability01.lvFreeWall,
  );
  const seriesTensionPeakPhase01 = rawPeakPhase01(
    samples,
    (sample) => sample.wallReadback.lvFreeWall.seriesTensionKPa,
  );
  const lvPressurePeakPhase01 = rawPeakPhase01(
    samples,
    (sample) => sample.pressuresMmHg.lv,
  );
  const phases = [
    freeCalciumPeakPhase01,
    caTroponinPeakPhase01,
    thinFilamentAvailabilityPeakPhase01,
    seriesTensionPeakPhase01,
    lvPressurePeakPhase01,
  ];
  if (phases.some((phase) => phase === null)) return null;

  const freeCa = freeCalciumPeakPhase01 as number;
  const caTroponin = caTroponinPeakPhase01 as number;
  const thinFilament = thinFilamentAvailabilityPeakPhase01 as number;
  const seriesTension = seriesTensionPeakPhase01 as number;
  const lvPressure = lvPressurePeakPhase01 as number;
  return {
    evidenceStatus: "report-only-not-an-acceptance-gate",
    peakMethod: "maximum-raw-sample-earliest-phase-on-tie",
    peakOffsetConvention: "signed-shortest-phase-difference",
    offsetInterpretation: "peak-phase-offset-not-causal-propagation-delay",
    freeCalciumPeakPhase01: freeCa,
    caTroponinPeakPhase01: caTroponin,
    thinFilamentAvailabilityPeakPhase01: thinFilament,
    seriesTensionPeakPhase01: seriesTension,
    lvPressurePeakPhase01: lvPressure,
    calciumToCaTroponinPeakOffsetSec:
      shortestPhaseDifference01(caTroponin, freeCa) * cycleLengthSec,
    caTroponinToThinFilamentPeakOffsetSec:
      shortestPhaseDifference01(thinFilament, caTroponin) * cycleLengthSec,
    thinFilamentToSeriesTensionPeakOffsetSec:
      shortestPhaseDifference01(seriesTension, thinFilament) * cycleLengthSec,
    seriesTensionToLvPressurePeakOffsetSec:
      shortestPhaseDifference01(lvPressure, seriesTension) * cycleLengthSec,
    calciumToLvPressurePeakOffsetSec:
      shortestPhaseDifference01(lvPressure, freeCa) * cycleLengthSec,
  };
}

function unwrappedLvpPoints(
  samples: readonly NoAvpdFourChamberBenchSampleV1[],
  peakIndex: number,
): readonly UnwrappedLvpPoint[] {
  const count = samples.length;
  const points: UnwrappedLvpPoint[] = [];
  for (let offset = -count; offset <= count; offset += 1) {
    const rawIndex = peakIndex + offset;
    const wrappedIndex = positiveModulo(rawIndex, count);
    const cycleOffset = Math.floor(rawIndex / count);
    points.push({
      phase: samples[wrappedIndex].phase01 + cycleOffset,
      pressureMmHg: samples[wrappedIndex].pressuresMmHg.lv,
    });
  }
  return points;
}

function rawThresholdCrossings(
  points: readonly UnwrappedLvpPoint[],
  peakIndex: number,
  thresholdMmHg: number,
): RawThresholdCrossings | null {
  let risingPhase: number | null = null;
  for (let index = peakIndex - 1; index >= 0; index -= 1) {
    if (points[index].pressureMmHg < thresholdMmHg) {
      risingPhase = interpolateThresholdPhase(
        points[index],
        points[index + 1],
        thresholdMmHg,
      );
      break;
    }
  }
  let fallingPhase: number | null = null;
  for (let index = peakIndex + 1; index < points.length; index += 1) {
    if (points[index].pressureMmHg < thresholdMmHg) {
      fallingPhase = interpolateThresholdPhase(
        points[index - 1],
        points[index],
        thresholdMmHg,
      );
      break;
    }
  }
  return risingPhase === null || fallingPhase === null
    ? null
    : { risingPhase, fallingPhase };
}

function interpolateThresholdPhase(
  left: UnwrappedLvpPoint,
  right: UnwrappedLvpPoint,
  thresholdMmHg: number,
): number {
  const pressureSpan = right.pressureMmHg - left.pressureMmHg;
  if (Math.abs(pressureSpan) <= Number.EPSILON)
    return (left.phase + right.phase) / 2;
  const fraction = (thresholdMmHg - left.pressureMmHg) / pressureSpan;
  return left.phase + fraction * (right.phase - left.phase);
}

function crossingWidthSec(
  crossings: RawThresholdCrossings | null,
  cycleLengthSec: number,
): number | null {
  if (crossings === null) return null;
  const widthSec =
    (crossings.fallingPhase - crossings.risingPhase) * cycleLengthSec;
  return Number.isFinite(widthSec) && widthSec >= 0 ? widthSec : null;
}

function maximumDirectionalReversal(
  points: readonly UnwrappedLvpPoint[],
  side: "rising" | "falling",
): number {
  let maximumReversalMmHg = 0;
  for (let index = 1; index < points.length; index += 1) {
    const increment =
      points[index].pressureMmHg - points[index - 1].pressureMmHg;
    const reversal = side === "rising" ? -increment : increment;
    maximumReversalMmHg = Math.max(maximumReversalMmHg, reversal);
  }
  return maximumReversalMmHg;
}

function countSecondaryLocalPeaks(
  points: readonly UnwrappedLvpPoint[],
  primaryPeakIndex: number,
  windowStartPhase: number,
  windowEndPhase: number,
  thresholdMmHg: number,
  toleranceMmHg: number,
): number {
  let count = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    if (
      index === primaryPeakIndex ||
      point.phase <= windowStartPhase ||
      point.phase >= windowEndPhase ||
      point.pressureMmHg < thresholdMmHg
    ) {
      continue;
    }
    const aboveLeft = point.pressureMmHg - points[index - 1].pressureMmHg;
    const aboveRight = point.pressureMmHg - points[index + 1].pressureMmHg;
    if (
      (aboveLeft > toleranceMmHg && aboveRight >= 0) ||
      (aboveRight > toleranceMmHg && aboveLeft >= 0)
    ) {
      count += 1;
    }
  }
  return count;
}

function classifyLvpShape(
  nonUnimodalityDetected: boolean,
  width90ToWidth50: number | null,
): NonNullable<
  NoAvpdFourChamberBenchResultV1["reportOnlyLvpMorphology"]
>["classification"] {
  if (nonUnimodalityDetected) return "multi-peaked-or-shouldered";
  if (width90ToWidth50 === null) return "incomplete-threshold-crossings";
  if (width90ToWidth50 < 0.25) return "pointed-single-dome";
  if (width90ToWidth50 > 0.65) return "flat-topped-single-dome";
  return "rounded-single-dome";
}

function rawPeakPhase01(
  samples: readonly NoAvpdFourChamberBenchSampleV1[],
  value: (sample: NoAvpdFourChamberBenchSampleV1) => number,
): number | null {
  const finite = samples
    .filter(
      (sample) =>
        Number.isFinite(sample.phase01) && Number.isFinite(value(sample)),
    )
    .slice()
    .sort((left, right) => left.phase01 - right.phase01);
  if (finite.length === 0) return null;
  return finite.reduce((peak, sample) =>
    value(sample) > value(peak) ? sample : peak,
  ).phase01;
}

function positiveRatio(
  numerator: number | null,
  denominator: number | null,
): number | null {
  return numerator !== null &&
    denominator !== null &&
    Number.isFinite(numerator) &&
    Number.isFinite(denominator) &&
    denominator > 0
    ? numerator / denominator
    : null;
}

function mapDynamicWallRecords<Current, Previous, Result>(
  current: Readonly<Record<NoAvpdFourChamberDynamicWallIdV1, Current>>,
  previous: Readonly<Record<NoAvpdFourChamberDynamicWallIdV1, Previous>>,
  map: (currentValue: Current, previousValue: Previous) => Result,
): Readonly<Record<NoAvpdFourChamberDynamicWallIdV1, Result>> {
  return Object.fromEntries(
    NO_AVPD_FOUR_CHAMBER_DYNAMIC_WALL_IDS_V1.map((wallId) => [
      wallId,
      map(current[wallId], previous[wallId]),
    ]),
  ) as Readonly<Record<NoAvpdFourChamberDynamicWallIdV1, Result>>;
}

function wallReadback(trial: {
  readonly readback: {
    readonly freeCalciumUm: number;
    readonly caTroponin01: number;
    readonly thinFilamentAvailability01: number;
    readonly calciumTroponinActivation: {
      readonly halfActivationCalciumUm: number;
      readonly midpointFreeCalciumUm?: number;
    } | null;
    readonly strains: {
      readonly total: number;
      readonly contractileElement: number;
    };
    readonly stresses: {
      readonly totalTransmittedPa: number;
      readonly contractileElementTensionPa: number;
      readonly seriesElasticTensionPa: number;
      readonly passiveEquilibriumPa: number;
      readonly slsOverstressPa: number;
    };
    readonly factors: {
      readonly activeLength: number;
      readonly forceVelocity: number;
    };
  };
}) {
  return {
    totalStrain: trial.readback.strains.total,
    ceStrain: trial.readback.strains.contractileElement,
    freeCalciumUm: trial.readback.freeCalciumUm,
    midpointFreeCalciumUm:
      trial.readback.calciumTroponinActivation?.midpointFreeCalciumUm ??
      trial.readback.freeCalciumUm,
    caTroponin01: trial.readback.caTroponin01,
    thinFilamentAvailability01: trial.readback.thinFilamentAvailability01,
    halfActivationCalciumUm:
      trial.readback.calciumTroponinActivation?.halfActivationCalciumUm ?? null,
    totalStressKPa: trial.readback.stresses.totalTransmittedPa / 1_000,
    contractileTensionKPa:
      trial.readback.stresses.contractileElementTensionPa / 1_000,
    seriesTensionKPa: trial.readback.stresses.seriesElasticTensionPa / 1_000,
    passiveStressKPa: trial.readback.stresses.passiveEquilibriumPa / 1_000,
    slsOverstressKPa: trial.readback.stresses.slsOverstressPa / 1_000,
    lengthFactor: trial.readback.factors.activeLength,
    forceVelocityFactor: trial.readback.factors.forceVelocity,
  };
}

function summarizePhysiology(
  samples: readonly NoAvpdFourChamberBenchSampleV1[],
): NoAvpdFourChamberBenchResultV1["reportOnlyPhysiology"] {
  if (samples.length === 0) {
    return {
      evidenceStatus: "fixed-phase-window-proxies-not-acceptance-gates",
      mitralPeakMethod: "fixed-phase-window-maximum-flow-proxy",
      pulmonaryVenousPeakMethod: "fixed-phase-window-extremum-flow-proxy",
      lvEndDiastolicVolumeMl: null,
      lvEndSystolicVolumeMl: null,
      lvEjectionFraction01: null,
      rvEndDiastolicVolumeMl: null,
      rvEndSystolicVolumeMl: null,
      rvEjectionFraction01: null,
      mitralEPeakMlPerSec: null,
      mitralAPeakMlPerSec: null,
      mitralEToA: null,
      pulmonaryVenousSPeakMlPerSec: null,
      pulmonaryVenousDPeakMlPerSec: null,
      pulmonaryVenousArMinMlPerSec: null,
    };
  }
  const lvVolumes = samples.map((sample) => sample.volumesMl.leftVentricleMl);
  const rvVolumes = samples.map((sample) => sample.volumesMl.rightVentricleMl);
  const lvEdv = maximum(lvVolumes);
  const lvEsv = minimum(lvVolumes);
  const rvEdv = maximum(rvVolumes);
  const rvEsv = minimum(rvVolumes);
  const eSamples = samples.filter(
    (sample) => sample.phase01 >= 0.32 && sample.phase01 < 0.76,
  );
  const aSamples = samples.filter(
    (sample) => sample.phase01 >= 0.76 || sample.phase01 < 0.02,
  );
  const systolicSamples = samples.filter((sample) => sample.phase01 < 0.36);
  const diastolicSamples = samples.filter(
    (sample) => sample.phase01 >= 0.36 && sample.phase01 < 0.76,
  );
  const ePeak = maximumOrNull(
    eSamples.map((sample) => sample.flowsMlPerSec.mv),
  );
  const aPeak = maximumOrNull(
    aSamples.map((sample) => sample.flowsMlPerSec.mv),
  );
  return {
    evidenceStatus: "fixed-phase-window-proxies-not-acceptance-gates",
    mitralPeakMethod: "fixed-phase-window-maximum-flow-proxy",
    pulmonaryVenousPeakMethod: "fixed-phase-window-extremum-flow-proxy",
    lvEndDiastolicVolumeMl: lvEdv,
    lvEndSystolicVolumeMl: lvEsv,
    lvEjectionFraction01: lvEdv > 0 ? (lvEdv - lvEsv) / lvEdv : null,
    rvEndDiastolicVolumeMl: rvEdv,
    rvEndSystolicVolumeMl: rvEsv,
    rvEjectionFraction01: rvEdv > 0 ? (rvEdv - rvEsv) / rvEdv : null,
    mitralEPeakMlPerSec: ePeak,
    mitralAPeakMlPerSec: aPeak,
    mitralEToA:
      ePeak !== null && aPeak !== null && aPeak > 0 ? ePeak / aPeak : null,
    pulmonaryVenousSPeakMlPerSec: maximumOrNull(
      systolicSamples.map((sample) => sample.flowsMlPerSec.pvf),
    ),
    pulmonaryVenousDPeakMlPerSec: maximumOrNull(
      diastolicSamples.map((sample) => sample.flowsMlPerSec.pvf),
    ),
    pulmonaryVenousArMinMlPerSec: minimumOrNull(
      aSamples.map((sample) => sample.flowsMlPerSec.pvf),
    ),
  };
}

function maximum(values: readonly number[]): number {
  return values.reduce(
    (result, value) => Math.max(result, value),
    Number.NEGATIVE_INFINITY,
  );
}

function minimum(values: readonly number[]): number {
  return values.reduce(
    (result, value) => Math.min(result, value),
    Number.POSITIVE_INFINITY,
  );
}

function maximumOrNull(values: readonly number[]): number | null {
  return values.length === 0 ? null : maximum(values);
}

function maximumOrZero(values: readonly number[]): number {
  return values.length === 0 ? 0 : maximum(values);
}

function minimumOrNull(values: readonly number[]): number | null {
  return values.length === 0 ? null : minimum(values);
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function shortestPhaseDifference01(current: number, previous: number): number {
  return positiveModulo(current - previous + 0.5, 1) - 0.5;
}
