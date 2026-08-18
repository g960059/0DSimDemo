import type {
  MainWireIntegratedModelPeriodicExecutionPurposeV3,
  MainWireIntegratedModelPeriodicTerminalCycleTraceV3,
  MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_V1_ID =
  "main-wire-integrated-model-periodic-valve-event-pv-locus-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_TBV_RATIOS_V1 =
  Object.freeze([
    0.75,
    0.82,
    0.9,
    0.96,
    1,
    1.06,
    1.12,
    1.18,
    1.24,
  ] as const);

/**
 * Frozen before the first canonical nine-load execution. These limits qualify
 * a reproducible valve-event locus and a descriptive straight-line summary.
 * They are numerical/semantic limits, not physiological normal ranges.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_POLICY_V1 =
  Object.freeze({
    policyId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_V1_ID,
    declarationStatus:
      "amended-after-input-preflight-rejection-before-first-numerical-output" as const,
    preflightAmendment: Object.freeze({
      attemptedLowestRatio: 0.74 as const,
      attemptedTotalBloodVolumeMl: 4144 as const,
      acceptedInputLowerBoundMl: 4200 as const,
      correctedLowestRatio: 0.75 as const,
      rejectionStage: "input-validation-before-model-initialization" as const,
      numericalOutputAvailableAtAmendment: false as const,
      numericalOutputUsedToChooseCorrection: false as const,
    }),
    nominalDtSec: 0.001 as const,
    maximumCycleCount: 250 as const,
    executionPurpose: "canonical-evidence" as const,
    branchConstruction: "independent-cold-start-per-load" as const,
    totalBloodVolumeRatios:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_TBV_RATIOS_V1,
    requiredLoadCount: 9 as const,
    requiredBilateralCoverageAroundBaseline: true as const,
    slowControllerPolicy: "fully-active" as const,
    requiredChambers: Object.freeze(["LV", "RV"] as const),
    retainedPressureBases: Object.freeze([
      "cavity-absolute-pressure",
      "ventricular-transmural-pressure",
    ] as const),
    eventDefinition: Object.freeze({
      method:
        "first-positive-to-nonpositive-valve-flow-zero-crossing-with-linear-accepted-endpoint-interpolation" as const,
      endDiastolic: "inlet-valve-closure" as const,
      endEjection: "semilunar-valve-closure" as const,
      requiredCrossingsPerValvePerCycle: 1 as const,
      requireEndDiastolicBeforeEndEjection: true as const,
      requireNonnegativeEventDefinedStrokeVolume: true as const,
      resamplingApplied: false as const,
    }),
    descriptiveEndEjectionLinearDiagnostic: Object.freeze({
      minimumPointCount: 9 as const,
      requirePositiveSlope: true as const,
      minimumRSquared: 0.98 as const,
      pressureRangeFloorMmHg: 1 as const,
      maximumNormalizedRootMeanSquareError: 0.08 as const,
      maximumNormalizedAbsoluteResidual: 0.15 as const,
      extrapolatedZeroPressureVolumeMayDefinePva: false as const,
    }),
    endDiastolicLocus: Object.freeze({
      representation: "measured-points-only" as const,
      interpolationAdmitted: false as const,
      extrapolationAdmitted: false as const,
      passiveEdpvrClaimed: false as const,
    }),
    namingBoundary: Object.freeze({
      semilunarClosureRelation:
        "event-defined-end-ejection-pv-locus-not-isochronal-emax-or-espvr" as const,
      inletClosureRelation:
        "event-defined-end-diastolic-pv-locus-not-passive-edpvr" as const,
    }),
    predecessorFormalWarmStartPvFamilyKnownWhenDeclared: true as const,
    predecessorFormalWarmStartOutputUsedToChooseDiagnosticLimits: false as const,
    newIndependentColdStartOutputAvailableWhenDeclared: false as const,
    espvrAdmissionEstablished: false as const,
    edpvrAdmissionEstablished: false as const,
    potentialEnergyAdmissionEstablished: false as const,
    pvaAdmissionEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireIntegratedModelPeriodicValveEventPressureBasisV1 =
  | "cavity-absolute-pressure"
  | "ventricular-transmural-pressure";

export type MainWireIntegratedModelPeriodicValveEventLandmarkV1 = Readonly<{
  event: "valve-closure-zero-flow-crossing";
  valveId: "MV" | "AoV" | "TV" | "PV";
  crossingOrdinal: number;
  sourceSegmentStartAcceptedTimeSec: number;
  sourceSegmentEndAcceptedTimeSec: number;
  crossingFraction: number;
  timeSec: number;
  volumeMl: number;
  absolutePressureMmHg: number;
  transmuralPressureMmHg: number;
}>;

export type MainWireIntegratedModelPeriodicVentricularValveEventsV1 =
  Readonly<{
    chamber: "LV" | "RV";
    inletValveId: "MV" | "TV";
    semilunarValveId: "AoV" | "PV";
    inletClosureCrossingCount: number;
    semilunarClosureCrossingCount: number;
    endDiastolic: MainWireIntegratedModelPeriodicValveEventLandmarkV1 | null;
    endEjection: MainWireIntegratedModelPeriodicValveEventLandmarkV1 | null;
    eventDefinedStrokeVolumeMl: number | null;
    eventSequenceQualified: boolean;
    failureReasons: readonly string[];
  }>;

export type MainWireIntegratedModelPeriodicValveEventExtractionV1 = Readonly<{
  extractionId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_V1_ID;
  status: "qualified-biventricular" | "not-qualified";
  sourceCycleIndex: number;
  sourceStartTimeSec: number;
  sourceEndTimeSec: number;
  sourceAcceptedSegmentCount: number;
  sourceTraceComplete: boolean;
  leftVentricle: MainWireIntegratedModelPeriodicVentricularValveEventsV1;
  rightVentricle: MainWireIntegratedModelPeriodicVentricularValveEventsV1;
  failureReasons: readonly string[];
}>;

export type MainWireIntegratedModelPeriodicValveEventLocusRunV1 = Readonly<{
  totalBloodVolumeRatio: number;
  totalBloodVolumeMl: number;
  nominalDtSec: number;
  executionPurpose: MainWireIntegratedModelPeriodicExecutionPurposeV3;
  modelConditionIdentityHash: string;
  protocolIdentityHash: string;
  numericalPeriod1Established: boolean;
  allCyclesFiniteConservedAndEventExact: boolean;
  terminalCheckpointSha256: string;
  terminalCheckpointExactRoundTripVerified: boolean;
  terminalCycleStartTraceSample:
    MainWireIntegratedModelPeriodicTerminalTraceSampleV3 | null;
  terminalCycleTrace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3;
}>;

export type MainWireIntegratedModelPeriodicValveEventLocusPointV1 = Readonly<{
  totalBloodVolumeRatio: number;
  totalBloodVolumeMl: number;
  modelConditionIdentityHash: string;
  protocolIdentityHash: string;
  terminalCheckpointSha256: string;
  runQualified: boolean;
  runFailureReasons: readonly string[];
  events: MainWireIntegratedModelPeriodicValveEventExtractionV1;
}>;

export type MainWireIntegratedModelPeriodicValveEventLinearDiagnosticV1 =
  Readonly<{
    chamber: "LV" | "RV";
    pressureBasis: MainWireIntegratedModelPeriodicValveEventPressureBasisV1;
    event: "semilunar-valve-closure-end-ejection";
    interpretation:
      "descriptive-event-defined-end-ejection-line-not-isochronal-emax-or-espvr";
    pointCount: number;
    fitAvailable: boolean;
    slopeMmHgPerMl: number | null;
    interceptMmHg: number | null;
    extrapolatedZeroPressureVolumeMl: number | null;
    rSquared: number | null;
    rootMeanSquareErrorMmHg: number | null;
    pressureNormalizationRangeMmHg: number | null;
    normalizedRootMeanSquareError: number | null;
    maximumAbsoluteResidualMmHg: number | null;
    maximumNormalizedAbsoluteResidual: number | null;
    diagnosticPassed: boolean;
    mayDefinePva: false;
  }>;

export type MainWireIntegratedModelPeriodicValveEventDiastolicLocusDiagnosticV1 =
  Readonly<{
    chamber: "LV" | "RV";
    pressureBasis: MainWireIntegratedModelPeriodicValveEventPressureBasisV1;
    event: "inlet-valve-closure-end-diastolic";
    interpretation:
      "measured-event-defined-end-diastolic-points-not-passive-edpvr";
    pointCount: number;
    volumeRangeMl: readonly [number, number];
    pressureRangeMmHg: readonly [number, number];
    minimumAdjacentVolumeIncrementMl: number;
    minimumAdjacentPressureIncrementMmHg: number;
    volumeStrictlyIncreasesWithTbv: boolean;
    pressureNondecreasesWithTbv: boolean;
    interpolationAdmitted: false;
    extrapolationAdmitted: false;
  }>;

export type MainWireIntegratedModelPeriodicValveEventLocusAssessmentV1 =
  Readonly<{
    assessmentId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_V1_ID;
    policy:
      typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_POLICY_V1;
    baselineTotalBloodVolumeMl: number | null;
    pointCount: number;
    expectedLoadSetComplete: boolean;
    loadMagnitudesMatchBaselineRatios: boolean;
    bilateralLoadCoverage: boolean;
    conditionIdentitiesDistinct: boolean;
    protocolIdentitySharedAcrossLoads: boolean;
    allRunsQualified: boolean;
    allValveEventSequencesQualified: boolean;
    eventDefinedLocusEstablished: boolean;
    points: readonly MainWireIntegratedModelPeriodicValveEventLocusPointV1[];
    endEjectionLinearDiagnostics:
      readonly MainWireIntegratedModelPeriodicValveEventLinearDiagnosticV1[];
    endDiastolicLocusDiagnostics:
      readonly MainWireIntegratedModelPeriodicValveEventDiastolicLocusDiagnosticV1[];
    biventricularBothPressureBasesLinearDiagnosticPassed: boolean;
    officialExperimentEventLocusEligible: boolean;
    publicLiveOutputCatalogAdmissionEstablished: false;
    espvrAdmissionEstablished: false;
    edpvrAdmissionEstablished: false;
    potentialEnergyAdmissionEstablished: false;
    pvaAdmissionEstablished: false;
    physiologicalValidationEstablished: false;
    clinicalValidationClaimed: false;
  }>;

export function extractMainWireIntegratedModelPeriodicValveEventsV1(
  startSample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3 | null,
  trace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3,
): MainWireIntegratedModelPeriodicValveEventExtractionV1 {
  const globalFailureReasons: string[] = [];
  const sourceTraceComplete =
    startSample !== null &&
    trace.samples.length === trace.sampleCount &&
    startSample.acceptedTimeSec === trace.startTimeSec &&
    trace.samples.at(-1)?.acceptedTimeSec === trace.endTimeSec &&
    strictlyIncreasingTimesV1([
      ...(startSample === null ? [] : [startSample]),
      ...trace.samples,
    ]);
  if (!sourceTraceComplete) {
    globalFailureReasons.push(
      "terminal cycle lacks a complete exact start-to-end accepted trace",
    );
  }
  const samples = startSample === null
    ? trace.samples
    : [startSample, ...trace.samples];
  const crossings = Object.freeze({
    MV: valveClosuresV1(samples, "MV"),
    AoV: valveClosuresV1(samples, "AoV"),
    TV: valveClosuresV1(samples, "TV"),
    PV: valveClosuresV1(samples, "PV"),
  });
  const leftVentricle = ventricularEventsV1(
    "LV",
    "MV",
    "AoV",
    crossings.MV,
    crossings.AoV,
  );
  const rightVentricle = ventricularEventsV1(
    "RV",
    "TV",
    "PV",
    crossings.TV,
    crossings.PV,
  );
  if (!leftVentricle.eventSequenceQualified) {
    globalFailureReasons.push("LV valve-event sequence is not qualified");
  }
  if (!rightVentricle.eventSequenceQualified) {
    globalFailureReasons.push("RV valve-event sequence is not qualified");
  }
  return deepFreezeV1({
    extractionId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_V1_ID,
    status:
      sourceTraceComplete &&
        leftVentricle.eventSequenceQualified &&
        rightVentricle.eventSequenceQualified
        ? ("qualified-biventricular" as const)
        : ("not-qualified" as const),
    sourceCycleIndex: trace.cycleIndex,
    sourceStartTimeSec: trace.startTimeSec,
    sourceEndTimeSec: trace.endTimeSec,
    sourceAcceptedSegmentCount: Math.max(0, samples.length - 1),
    sourceTraceComplete,
    leftVentricle,
    rightVentricle,
    failureReasons: globalFailureReasons,
  });
}

export function assessMainWireIntegratedModelPeriodicValveEventLocusV1(
  runs: readonly MainWireIntegratedModelPeriodicValveEventLocusRunV1[],
): MainWireIntegratedModelPeriodicValveEventLocusAssessmentV1 {
  const points = runs
    .map(pointFromRunV1)
    .sort((left, right) =>
      left.totalBloodVolumeRatio - right.totalBloodVolumeRatio
    );
  const baseline = points.find(({ totalBloodVolumeRatio }) =>
    Math.abs(totalBloodVolumeRatio - 1) <= 1e-12
  );
  const baselineTotalBloodVolumeMl = baseline?.totalBloodVolumeMl ?? null;
  const expectedLoadSetComplete = expectedLoadSetCompleteV1(points);
  const loadMagnitudesMatchBaselineRatios =
    baselineTotalBloodVolumeMl !== null &&
    baselineTotalBloodVolumeMl > 0 &&
    points.every(({ totalBloodVolumeMl, totalBloodVolumeRatio }) =>
      Math.abs(
        totalBloodVolumeMl -
          baselineTotalBloodVolumeMl * totalBloodVolumeRatio,
      ) <= 1e-9 * baselineTotalBloodVolumeMl
    );
  const bilateralLoadCoverage =
    points.some(({ totalBloodVolumeRatio }) => totalBloodVolumeRatio < 1) &&
    points.some(({ totalBloodVolumeRatio }) => totalBloodVolumeRatio > 1);
  const conditionHashes = points.map((point) =>
    point.modelConditionIdentityHash
  );
  const protocolHashes = points.map((point) => point.protocolIdentityHash);
  const conditionIdentitiesDistinct =
    conditionHashes.length ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_POLICY_V1
        .requiredLoadCount &&
    conditionHashes.every(validSha256V1) &&
    new Set(conditionHashes).size === conditionHashes.length;
  const protocolIdentitySharedAcrossLoads =
    protocolHashes.length ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_POLICY_V1
        .requiredLoadCount &&
    protocolHashes.every(validSha256V1) &&
    new Set(protocolHashes).size === 1;
  const allRunsQualified = points.length > 0 &&
    points.every(({ runQualified }) => runQualified);
  const allValveEventSequencesQualified = points.length > 0 &&
    points.every(({ events }) =>
      events.status === "qualified-biventricular"
    );
  const eventDefinedLocusEstablished =
    expectedLoadSetComplete &&
    loadMagnitudesMatchBaselineRatios &&
    bilateralLoadCoverage &&
    conditionIdentitiesDistinct &&
    protocolIdentitySharedAcrossLoads &&
    allRunsQualified &&
    allValveEventSequencesQualified;
  const endEjectionLinearDiagnostics = eventDefinedLocusEstablished
    ? Object.freeze(
        (["LV", "RV"] as const).flatMap((chamber) =>
          ([
            "cavity-absolute-pressure",
            "ventricular-transmural-pressure",
          ] as const).map((pressureBasis) =>
            linearEndEjectionDiagnosticV1(points, chamber, pressureBasis)
          )
        ),
      )
    : Object.freeze([]);
  const endDiastolicLocusDiagnostics = eventDefinedLocusEstablished
    ? Object.freeze(
        (["LV", "RV"] as const).flatMap((chamber) =>
          ([
            "cavity-absolute-pressure",
            "ventricular-transmural-pressure",
          ] as const).map((pressureBasis) =>
            diastolicLocusDiagnosticV1(points, chamber, pressureBasis)
          )
        ),
      )
    : Object.freeze([]);
  const biventricularBothPressureBasesLinearDiagnosticPassed =
    endEjectionLinearDiagnostics.length === 4 &&
    endEjectionLinearDiagnostics.every(({ diagnosticPassed }) =>
      diagnosticPassed
    );
  return deepFreezeV1({
    assessmentId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_V1_ID,
    policy:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_POLICY_V1,
    baselineTotalBloodVolumeMl,
    pointCount: points.length,
    expectedLoadSetComplete,
    loadMagnitudesMatchBaselineRatios,
    bilateralLoadCoverage,
    conditionIdentitiesDistinct,
    protocolIdentitySharedAcrossLoads,
    allRunsQualified,
    allValveEventSequencesQualified,
    eventDefinedLocusEstablished,
    points,
    endEjectionLinearDiagnostics,
    endDiastolicLocusDiagnostics,
    biventricularBothPressureBasesLinearDiagnosticPassed,
    officialExperimentEventLocusEligible: eventDefinedLocusEstablished,
    publicLiveOutputCatalogAdmissionEstablished: false as const,
    espvrAdmissionEstablished: false as const,
    edpvrAdmissionEstablished: false as const,
    potentialEnergyAdmissionEstablished: false as const,
    pvaAdmissionEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
  });
}

function pointFromRunV1(
  run: MainWireIntegratedModelPeriodicValveEventLocusRunV1,
): MainWireIntegratedModelPeriodicValveEventLocusPointV1 {
  const events = extractMainWireIntegratedModelPeriodicValveEventsV1(
    run.terminalCycleStartTraceSample,
    run.terminalCycleTrace,
  );
  const runFailureReasons: string[] = [];
  if (
    run.nominalDtSec !==
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_POLICY_V1
        .nominalDtSec
  ) {
    runFailureReasons.push("nominal dt differs from the frozen policy");
  }
  if (
    run.executionPurpose !==
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_POLICY_V1
        .executionPurpose
  ) {
    runFailureReasons.push("execution purpose is not canonical evidence");
  }
  if (!run.numericalPeriod1Established) {
    runFailureReasons.push("canonical full-state P1 was not established");
  }
  if (!run.allCyclesFiniteConservedAndEventExact) {
    runFailureReasons.push("finite, conservation, or event checks failed");
  }
  if (!run.terminalCheckpointExactRoundTripVerified) {
    runFailureReasons.push("terminal exact checkpoint round trip failed");
  }
  if (!validSha256V1(run.modelConditionIdentityHash)) {
    runFailureReasons.push("model-condition identity is invalid");
  }
  if (!validSha256V1(run.protocolIdentityHash)) {
    runFailureReasons.push("protocol identity is invalid");
  }
  if (!validSha256V1(run.terminalCheckpointSha256)) {
    runFailureReasons.push("terminal checkpoint identity is invalid");
  }
  if (events.status !== "qualified-biventricular") {
    runFailureReasons.push("biventricular valve-event extraction failed");
  }
  return deepFreezeV1({
    totalBloodVolumeRatio: run.totalBloodVolumeRatio,
    totalBloodVolumeMl: run.totalBloodVolumeMl,
    modelConditionIdentityHash: run.modelConditionIdentityHash,
    protocolIdentityHash: run.protocolIdentityHash,
    terminalCheckpointSha256: run.terminalCheckpointSha256,
    runQualified: runFailureReasons.length === 0,
    runFailureReasons,
    events,
  });
}

function valveClosuresV1(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  valveId: MainWireIntegratedModelPeriodicValveEventLandmarkV1["valveId"],
): readonly MainWireIntegratedModelPeriodicValveEventLandmarkV1[] {
  const closures: MainWireIntegratedModelPeriodicValveEventLandmarkV1[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const next = samples[index]!;
    const previousFlow = valveFlowV1(previous, valveId);
    const nextFlow = valveFlowV1(next, valveId);
    if (!(previousFlow > 0 && nextFlow <= 0)) continue;
    const denominator = previousFlow - nextFlow;
    const crossingFraction = denominator > 1e-12
      ? Math.max(0, Math.min(1, previousFlow / denominator))
      : 1;
    const interpolate = (left: number, right: number) =>
      left + crossingFraction * (right - left);
    const chamber = valveId === "MV" || valveId === "AoV" ? "LV" : "RV";
    closures.push(Object.freeze({
      event: "valve-closure-zero-flow-crossing" as const,
      valveId,
      crossingOrdinal: closures.length + 1,
      sourceSegmentStartAcceptedTimeSec: previous.acceptedTimeSec,
      sourceSegmentEndAcceptedTimeSec: next.acceptedTimeSec,
      crossingFraction,
      timeSec: interpolate(previous.acceptedTimeSec, next.acceptedTimeSec),
      volumeMl: interpolate(
        previous.chamberVolumeMl[chamber],
        next.chamberVolumeMl[chamber],
      ),
      absolutePressureMmHg: interpolate(
        previous.absolutePressureMmHg[chamber],
        next.absolutePressureMmHg[chamber],
      ),
      transmuralPressureMmHg: interpolate(
        previous.transmuralPressureMmHg[chamber],
        next.transmuralPressureMmHg[chamber],
      ),
    }));
  }
  return Object.freeze(closures);
}

function ventricularEventsV1(
  chamber: "LV" | "RV",
  inletValveId: "MV" | "TV",
  semilunarValveId: "AoV" | "PV",
  inletClosures: readonly MainWireIntegratedModelPeriodicValveEventLandmarkV1[],
  semilunarClosures: readonly MainWireIntegratedModelPeriodicValveEventLandmarkV1[],
): MainWireIntegratedModelPeriodicVentricularValveEventsV1 {
  const failureReasons: string[] = [];
  if (inletClosures.length !== 1) {
    failureReasons.push(
      `${inletValveId} has ${inletClosures.length} closure crossings, expected 1`,
    );
  }
  if (semilunarClosures.length !== 1) {
    failureReasons.push(
      `${semilunarValveId} has ${semilunarClosures.length} closure crossings, expected 1`,
    );
  }
  const endDiastolic = inletClosures[0] ?? null;
  const endEjection = semilunarClosures[0] ?? null;
  if (
    endDiastolic !== null &&
    endEjection !== null &&
    !(endDiastolic.timeSec < endEjection.timeSec)
  ) {
    failureReasons.push("inlet closure does not precede semilunar closure");
  }
  const eventDefinedStrokeVolumeMl =
    endDiastolic === null || endEjection === null
      ? null
      : endDiastolic.volumeMl - endEjection.volumeMl;
  if (
    eventDefinedStrokeVolumeMl !== null &&
    !(eventDefinedStrokeVolumeMl >= 0)
  ) {
    failureReasons.push("event-defined stroke volume is negative");
  }
  return deepFreezeV1({
    chamber,
    inletValveId,
    semilunarValveId,
    inletClosureCrossingCount: inletClosures.length,
    semilunarClosureCrossingCount: semilunarClosures.length,
    endDiastolic,
    endEjection,
    eventDefinedStrokeVolumeMl,
    eventSequenceQualified: failureReasons.length === 0,
    failureReasons,
  });
}

function linearEndEjectionDiagnosticV1(
  points: readonly MainWireIntegratedModelPeriodicValveEventLocusPointV1[],
  chamber: "LV" | "RV",
  pressureBasis: MainWireIntegratedModelPeriodicValveEventPressureBasisV1,
): MainWireIntegratedModelPeriodicValveEventLinearDiagnosticV1 {
  const samples = points.map((point) => {
    const events = chamberEventsV1(point, chamber);
    const event = events.endEjection!;
    return Object.freeze({
      volumeMl: event.volumeMl,
      pressureMmHg: pressureV1(event, pressureBasis),
    });
  });
  const meanVolume = meanV1(samples.map(({ volumeMl }) => volumeMl));
  const meanPressure = meanV1(samples.map(({ pressureMmHg }) => pressureMmHg));
  const volumeSumSquares = samples.reduce(
    (sum, { volumeMl }) => sum + Math.pow(volumeMl - meanVolume, 2),
    0,
  );
  if (!(volumeSumSquares > 0)) {
    return unavailableLinearDiagnosticV1(chamber, pressureBasis, samples.length);
  }
  const covariance = samples.reduce(
    (sum, { volumeMl, pressureMmHg }) =>
      sum + (volumeMl - meanVolume) * (pressureMmHg - meanPressure),
    0,
  );
  const slopeMmHgPerMl = covariance / volumeSumSquares;
  const interceptMmHg = meanPressure - slopeMmHgPerMl * meanVolume;
  const residuals = samples.map(({ volumeMl, pressureMmHg }) =>
    pressureMmHg - (slopeMmHgPerMl * volumeMl + interceptMmHg)
  );
  const residualSumSquares = residuals.reduce(
    (sum, residual) => sum + residual * residual,
    0,
  );
  const totalSumSquares = samples.reduce(
    (sum, { pressureMmHg }) =>
      sum + Math.pow(pressureMmHg - meanPressure, 2),
    0,
  );
  if (!(totalSumSquares > 0)) {
    return unavailableLinearDiagnosticV1(chamber, pressureBasis, samples.length);
  }
  const rSquared = 1 - residualSumSquares / totalSumSquares;
  const rootMeanSquareErrorMmHg = Math.sqrt(
    residualSumSquares / samples.length,
  );
  const pressures = samples.map(({ pressureMmHg }) => pressureMmHg);
  const pressureNormalizationRangeMmHg = Math.max(
    Math.max(...pressures) - Math.min(...pressures),
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_POLICY_V1
      .descriptiveEndEjectionLinearDiagnostic.pressureRangeFloorMmHg,
  );
  const normalizedRootMeanSquareError =
    rootMeanSquareErrorMmHg / pressureNormalizationRangeMmHg;
  const maximumAbsoluteResidualMmHg = Math.max(
    ...residuals.map(Math.abs),
  );
  const maximumNormalizedAbsoluteResidual =
    maximumAbsoluteResidualMmHg / pressureNormalizationRangeMmHg;
  const limits =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_LOCUS_POLICY_V1
      .descriptiveEndEjectionLinearDiagnostic;
  const diagnosticPassed =
    samples.length >= limits.minimumPointCount &&
    slopeMmHgPerMl > 0 &&
    rSquared >= limits.minimumRSquared &&
    normalizedRootMeanSquareError <=
      limits.maximumNormalizedRootMeanSquareError &&
    maximumNormalizedAbsoluteResidual <=
      limits.maximumNormalizedAbsoluteResidual;
  return deepFreezeV1({
    chamber,
    pressureBasis,
    event: "semilunar-valve-closure-end-ejection" as const,
    interpretation:
      "descriptive-event-defined-end-ejection-line-not-isochronal-emax-or-espvr" as const,
    pointCount: samples.length,
    fitAvailable: true,
    slopeMmHgPerMl,
    interceptMmHg,
    extrapolatedZeroPressureVolumeMl: -interceptMmHg / slopeMmHgPerMl,
    rSquared,
    rootMeanSquareErrorMmHg,
    pressureNormalizationRangeMmHg,
    normalizedRootMeanSquareError,
    maximumAbsoluteResidualMmHg,
    maximumNormalizedAbsoluteResidual,
    diagnosticPassed,
    mayDefinePva: false as const,
  });
}

function unavailableLinearDiagnosticV1(
  chamber: "LV" | "RV",
  pressureBasis: MainWireIntegratedModelPeriodicValveEventPressureBasisV1,
  pointCount: number,
): MainWireIntegratedModelPeriodicValveEventLinearDiagnosticV1 {
  return Object.freeze({
    chamber,
    pressureBasis,
    event: "semilunar-valve-closure-end-ejection" as const,
    interpretation:
      "descriptive-event-defined-end-ejection-line-not-isochronal-emax-or-espvr" as const,
    pointCount,
    fitAvailable: false,
    slopeMmHgPerMl: null,
    interceptMmHg: null,
    extrapolatedZeroPressureVolumeMl: null,
    rSquared: null,
    rootMeanSquareErrorMmHg: null,
    pressureNormalizationRangeMmHg: null,
    normalizedRootMeanSquareError: null,
    maximumAbsoluteResidualMmHg: null,
    maximumNormalizedAbsoluteResidual: null,
    diagnosticPassed: false,
    mayDefinePva: false as const,
  });
}

function diastolicLocusDiagnosticV1(
  points: readonly MainWireIntegratedModelPeriodicValveEventLocusPointV1[],
  chamber: "LV" | "RV",
  pressureBasis: MainWireIntegratedModelPeriodicValveEventPressureBasisV1,
): MainWireIntegratedModelPeriodicValveEventDiastolicLocusDiagnosticV1 {
  const samples = points.map((point) => {
    const event = chamberEventsV1(point, chamber).endDiastolic!;
    return Object.freeze({
      volumeMl: event.volumeMl,
      pressureMmHg: pressureV1(event, pressureBasis),
    });
  });
  const volumes = samples.map(({ volumeMl }) => volumeMl);
  const pressures = samples.map(({ pressureMmHg }) => pressureMmHg);
  const adjacentVolumeIncrements = samples.slice(1).map((sample, index) =>
    sample.volumeMl - samples[index]!.volumeMl
  );
  const adjacentPressureIncrements = samples.slice(1).map((sample, index) =>
    sample.pressureMmHg - samples[index]!.pressureMmHg
  );
  return deepFreezeV1({
    chamber,
    pressureBasis,
    event: "inlet-valve-closure-end-diastolic" as const,
    interpretation:
      "measured-event-defined-end-diastolic-points-not-passive-edpvr" as const,
    pointCount: samples.length,
    volumeRangeMl: [Math.min(...volumes), Math.max(...volumes)] as const,
    pressureRangeMmHg: [Math.min(...pressures), Math.max(...pressures)] as const,
    minimumAdjacentVolumeIncrementMl: Math.min(...adjacentVolumeIncrements),
    minimumAdjacentPressureIncrementMmHg: Math.min(
      ...adjacentPressureIncrements,
    ),
    volumeStrictlyIncreasesWithTbv:
      adjacentVolumeIncrements.every((increment) => increment > 0),
    pressureNondecreasesWithTbv:
      adjacentPressureIncrements.every((increment) => increment >= 0),
    interpolationAdmitted: false as const,
    extrapolationAdmitted: false as const,
  });
}

function expectedLoadSetCompleteV1(
  points: readonly MainWireIntegratedModelPeriodicValveEventLocusPointV1[],
): boolean {
  const expected =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_VALVE_EVENT_TBV_RATIOS_V1;
  if (points.length !== expected.length) return false;
  return expected.every((ratio, index) =>
    Math.abs(points[index]!.totalBloodVolumeRatio - ratio) <= 1e-12
  );
}

function chamberEventsV1(
  point: MainWireIntegratedModelPeriodicValveEventLocusPointV1,
  chamber: "LV" | "RV",
): MainWireIntegratedModelPeriodicVentricularValveEventsV1 {
  return chamber === "LV"
    ? point.events.leftVentricle
    : point.events.rightVentricle;
}

function pressureV1(
  event: MainWireIntegratedModelPeriodicValveEventLandmarkV1,
  pressureBasis: MainWireIntegratedModelPeriodicValveEventPressureBasisV1,
): number {
  return pressureBasis === "cavity-absolute-pressure"
    ? event.absolutePressureMmHg
    : event.transmuralPressureMmHg;
}

function valveFlowV1(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  valveId: MainWireIntegratedModelPeriodicValveEventLandmarkV1["valveId"],
): number {
  return sample.valveFlowMlPerSec[valveId];
}

function strictlyIncreasingTimesV1(
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
): boolean {
  return samples.length >= 2 && samples.slice(1).every((sample, index) =>
    sample.acceptedTimeSec > samples[index]!.acceptedTimeSec
  );
}

function meanV1(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function validSha256V1(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

function deepFreezeV1<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreezeV1(nested);
    }
    Object.freeze(value);
  }
  return value;
}
