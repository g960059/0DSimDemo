import {
  measureLaPvReservoirConduitOrderV1,
  type LaPvReservoirConduitOrderV1,
} from "@/engine/mechanics2/diagnostics/LaPvReservoirConduitOrderV1";
import {
  measureLaPvTwoLobesV2,
  type LaPvLobeMeasurementV2,
  type LaPvMeasuredLobeV2,
} from "@/engine/mechanics2/diagnostics/LaPvLobeMeasurementV2";
import {
  assertFiveWallNormalCalciumDriveMatchesFixedRegistryV1,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
  resolveFiveWallNormalCalciumDriveFixedPriorV1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  measureMainWireNormalAdultFiveWallCycleDiagnosticsV1,
  type MainWireNormalAdultFiveWallCycleDiagnosticsV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV1";
import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import type {
  MainWireFiveWallPeriodicClosureGroupV1,
  MainWireFiveWallPeriodicClosureReportV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import {
  assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1,
  type MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_V1_ID =
  "main-wire-normal-adult-five-wall-periodic-summary-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V1 =
  Object.freeze({
    input: "periodic-runner-accepted-readback-only" as const,
    selectedCycle: "last-retained-complete-beat" as const,
    addsDynamicState: false as const,
    changesPhysiologyOrMaterialParameters: false as const,
    parameterSearchOrTuning: false as const,
    timeSeriesSmoothingApplied: false as const,
    timeSeriesResamplingOrInterpolationApplied: false as const,
    piecewiseLinearPvGeometryInterpolationApplied: true as const,
    morphologyMetricsComputedWhenNotPeriodic: true as const,
    morphologyInterpretationRequiresPeriod1Convergence: true as const,
    morphologyMetricAcceptanceThresholdApplied: false as const,
    timeStepRobustnessAssessedBySummary: false as const,
  });

type ChamberId = "LA" | "LV" | "RA" | "RV";
type FlowId = "MV" | "AoV" | "TV" | "PV" | "PVein_LA";
type AbsolutePressureId = "Ao" | "PA" | "PVein";
type ValveId = "MV" | "AoV" | "TV" | "PV";

export type MainWireNormalAdultFiveWallRangeV1 = Readonly<{
  minimum: number;
  maximum: number;
}>;

export type MainWireNormalAdultFiveWallCompactLobeV1 = Readonly<
  Omit<LaPvMeasuredLobeV2, "path"> & { pointCount: number }
>;

export type MainWireNormalAdultFiveWallCompactTwoLobesV1 =
  | Readonly<
    Omit<
      Extract<LaPvLobeMeasurementV2, { status: "measurable" }>,
      "aLobe" | "vLobe"
    > & {
      aLobe: MainWireNormalAdultFiveWallCompactLobeV1;
      vLobe: MainWireNormalAdultFiveWallCompactLobeV1;
    }
  >
  | Extract<LaPvLobeMeasurementV2, { status: "not-measurable" }>;

export type MainWireNormalAdultFiveWallCompactBranchOrderV1 = Readonly<
  Omit<LaPvReservoirConduitOrderV1, "probes">
>;

export type MainWireNormalAdultFiveWallCompactClosureV1 = Readonly<{
  elapsedTimeSec: number;
  entryCount: number;
  maximumNormalizedDelta: number;
  worstGroup: MainWireFiveWallPeriodicClosureGroupV1;
  worstPath: string;
  groupMaximumNormalizedDelta: Readonly<Record<
    MainWireFiveWallPeriodicClosureGroupV1,
    Readonly<{ maximumNormalizedDelta: number; worstPath: string }>
  >>;
}>;

export type MainWireNormalAdultFiveWallClassifierEvidenceClosureV1 = Readonly<{
  beatIndex: number;
  period1MaximumNormalizedDelta: number | null;
  period2MaximumNormalizedDelta: number | null;
}>;

export type MainWireNormalAdultFiveWallJacobianWidthHistogramEntryV1 = Readonly<{
  absoluteScaledStep: number;
  count: number;
  classification: "nominal" | "alternate";
}>;

export type MainWireNormalAdultFiveWallJacobianWidthAuditV1 = Readonly<{
  nominalScaledStep: number;
  acceptedStepCount: number;
  nominalStepCount: number;
  alternateStepCount: number;
  histogram:
    readonly MainWireNormalAdultFiveWallJacobianWidthHistogramEntryV1[];
}>;

export type MainWireNormalAdultFiveWallPeriodicSummaryV1 = Readonly<{
  summaryId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_V1_ID;
  protocol: Readonly<{
    identity: MainWireNormalAdultFiveWallPeriodicResultV1["protocolIdentity"];
    identityHash: string;
    componentHashes:
      MainWireNormalAdultFiveWallPeriodicResultV1["protocolComponentHashes"];
  }>;
  source: Readonly<{
    experimentId: MainWireNormalAdultFiveWallPeriodicResultV1["experimentId"];
    initialization: MainWireNormalAdultFiveWallPeriodicResultV1["initialization"];
    laSlsMode: MainWireNormalAdultFiveWallPeriodicResultV1["laSlsMode"];
    calciumDrivePriorVariant:
      MainWireNormalAdultFiveWallPeriodicResultV1["calciumDrivePriorVariant"];
    dtSec: number;
    requestedMaximumBeatCount: number;
    completedBeatCount: number;
    terminationReason: MainWireNormalAdultFiveWallPeriodicResultV1["terminationReason"];
    integrationCompletedWithoutFailure: boolean;
    failure: MainWireNormalAdultFiveWallPeriodicResultV1["failure"];
  }>;
  convergence: Readonly<{
    policy: MainWireNormalAdultFiveWallPeriodicResultV1["policy"];
    classifier: MainWireNormalAdultFiveWallPeriodicResultV1["periodicity"];
    evidenceClosures:
      readonly MainWireNormalAdultFiveWallClassifierEvidenceClosureV1[];
    evidenceJacobianFiniteDifferenceWidthAudits: readonly Readonly<{
      beatIndex: number;
      audit: MainWireNormalAdultFiveWallJacobianWidthAuditV1;
    }>[];
    periodicSteadyStateClaimed: boolean;
    period2OrbitSuspected: boolean;
    latestPeriod1Closure: MainWireNormalAdultFiveWallCompactClosureV1 | null;
    latestPeriod2Closure: MainWireNormalAdultFiveWallCompactClosureV1 | null;
  }>;
  morphologyInterpretation: Readonly<{
    eligible: boolean;
    scope: "current-dt-period1-only";
    timeStepRobustnessEstablished: false;
    reason:
      | "eligible-current-dt-period1-only"
      | "ineligible-period2-suspect"
      | "ineligible-period1-not-converged";
  }>;
  selectedBeat: Readonly<{
    beatIndex: number;
    startTimeSec: number;
    endTimeSec: number;
    sampleCount: number;
    precedingAcceptedSampleAvailable: boolean;
    precedingBeatIndex: number | null;
    jacobianFiniteDifferenceWidthAudit:
      MainWireNormalAdultFiveWallJacobianWidthAuditV1;
  }>;
  fixedActivationPrior: Readonly<{
    variant:
      MainWireNormalAdultFiveWallPeriodicResultV1["calciumDrivePriorVariant"];
    parameterSetId: string;
    atrialRiseTimeConstantSec: number;
    atrialDecayTimeConstantSec: number;
    atrialCalciumOnsetPhase01: number;
    purpose:
      "normalized-Ca-lobe-selection-proxy-not-Land-activation-or-tension-law";
    activationNormalization:
      "clamp((freeCa-diastolicCa)/peakAmplitude,0,1)";
  }>;
  ranges: Readonly<{
    chamberVolumeMl: Readonly<Record<ChamberId,
      MainWireNormalAdultFiveWallRangeV1>>;
    chamberTransmuralPressureMmHg: Readonly<Record<ChamberId,
      MainWireNormalAdultFiveWallRangeV1>>;
    absolutePressureMmHg: Readonly<Record<AbsolutePressureId,
      MainWireNormalAdultFiveWallRangeV1>>;
    flowMlPerSec: Readonly<Record<FlowId,
      MainWireNormalAdultFiveWallRangeV1>>;
  }>;
  hemodynamics: Readonly<{
    leftVentricularEjectionFraction01: number;
    rightVentricularEjectionFraction01: number;
    netAorticStrokeVolumeMl: number;
    forwardAorticStrokeVolumeMl: number;
    netAorticCardiacOutputLPerMin: number;
    cardiacIndexLPerMinPerM2: number;
    meanAorticAbsolutePressureMmHg: number;
  }>;
  cyclePhysiology: Omit<
    MainWireNormalAdultFiveWallCycleDiagnosticsV1,
    "phaseBySample"
  >;
  laPvMorphology: Readonly<{
    twoLobes: MainWireNormalAdultFiveWallCompactTwoLobesV1;
    reservoirConduitEqualVolumeOrder:
      MainWireNormalAdultFiveWallCompactBranchOrderV1;
  }>;
  residualMaxima: Readonly<{
    mechanicsResidualNorm: number;
    circulationScaledResidualInfinityNorm: number;
    absoluteContinuityResidualMl: number;
    absoluteTotalBloodVolumeErrorMl: number;
    absoluteValvePowerBalanceResidualMmHgMlPerSec: Readonly<Record<
      ValveId,
      number
    >>;
  }>;
  claim:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V1;
}>;

/**
 * Produces a compact, pure readback of the last retained complete beat.
 * Morphology is still measured for debugging before closure, but it is marked
 * interpretable only after the runner has established a period-1 orbit.
 */
export function summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultFiveWallPeriodicSummaryV1 {
  const selectedBeat = result.retainedCompleteBeats.at(-1);
  if (selectedBeat === undefined || selectedBeat.samples.length === 0) {
    throw new Error("periodic result has no retained complete beat to summarize");
  }
  if (selectedBeat.samples.length !== result.stepsPerBeat) {
    throw new Error("retained complete beat does not match stepsPerBeat");
  }
  const precedingBeat = result.retainedCompleteBeats.at(-2);
  const precedingSample = precedingBeat !== undefined
      && precedingBeat.beatIndex + 1 === selectedBeat.beatIndex
    ? precedingBeat.samples.at(-1) ?? null
    : null;
  const samples = selectedBeat.samples;
  const calciumDriveParams = result.calciumDriveFixedParams;
  assertCalciumDriveIdentity(result, calciumDriveParams);
  assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV1({
    identity: result.protocolIdentity,
    identityHash: result.protocolIdentityHash,
    componentHashes: result.protocolComponentHashes,
    periodicPolicy: result.policy,
  });
  assertClosureReferenceScaleSetMatchesPolicy(result);
  const evidenceClosures = classifierEvidenceClosures(result);
  const evidenceJacobianAudits = classifierEvidenceJacobianAudits(result);
  const atrialOnsetPhase01 = atrialCalciumOnsetPhase01(calciumDriveParams);
  const cycle = measureMainWireNormalAdultFiveWallCycleDiagnosticsV1({
    samples,
    precedingSample,
    dtSec: result.dtSec,
    atrialCalciumOnsetPhase01: atrialOnsetPhase01,
    wallMaterialVolumeMlByWall: wallMaterialVolumesMl(),
  });
  const lobeMeasurement = measureLaPvTwoLobesV2(samples.map((sample, index) =>
    Object.freeze({
      theta: sample.cyclePhase01,
      laVolumeMl: sample.nodeVolumeMl.LA,
      laPressureMmHg: sample.chamberTransmuralPressureMmHg.LA,
      laActivation01: atrialActivation01(sample, calciumDriveParams),
      phase: cycle.phaseBySample[index]!,
    })));
  const branchOrder = measureLaPvReservoirConduitOrderV1({
    reservoir: cyclicSegmentInclusive(
      samples,
      cycle.events.mitralValveClosure.sampleIndex,
      cycle.events.mitralValveOpening.sampleIndex,
    ).map(pvPoint),
    conduit: cyclicSegmentInclusive(
      samples,
      cycle.events.mitralValveOpening.sampleIndex,
      cycle.events.atrialCalciumOnset.sampleIndex,
    ).map(pvPoint),
  });
  const latestClosure = result.beatClosure.at(-1) ?? null;
  const morphologyEligibility = morphologyInterpretation(result);
  const netAorticStrokeVolumeMl = samples.reduce(
    (sum, sample) => sum + sample.flowMlPerSec.AoV * result.dtSec,
    0,
  );
  const forwardAorticStrokeVolumeMl = samples.reduce(
    (sum, sample) =>
      sum + Math.max(sample.flowMlPerSec.AoV, 0) * result.dtSec,
    0,
  );
  const { phaseBySample: _phaseBySample, ...compactCycle } = cycle;

  return Object.freeze({
    summaryId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_V1_ID,
    protocol: Object.freeze({
      identity: result.protocolIdentity,
      identityHash: result.protocolIdentityHash,
      componentHashes: result.protocolComponentHashes,
    }),
    source: Object.freeze({
      experimentId: result.experimentId,
      initialization: result.initialization,
      laSlsMode: result.laSlsMode,
      calciumDrivePriorVariant: result.calciumDrivePriorVariant,
      dtSec: result.dtSec,
      requestedMaximumBeatCount: result.requestedMaximumBeatCount,
      completedBeatCount: result.completedBeatCount,
      terminationReason: result.terminationReason,
      integrationCompletedWithoutFailure:
        result.integrationCompletedWithoutFailure,
      failure: result.failure,
    }),
    convergence: Object.freeze({
      policy: result.policy,
      classifier: result.periodicity,
      evidenceClosures,
      evidenceJacobianFiniteDifferenceWidthAudits: evidenceJacobianAudits,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
      period2OrbitSuspected: result.period2OrbitSuspected,
      latestPeriod1Closure: latestClosure?.period1 === null
        || latestClosure === null
        ? null
        : compactClosure(latestClosure.period1),
      latestPeriod2Closure: latestClosure?.period2 === null
        || latestClosure === null
        ? null
        : compactClosure(latestClosure.period2),
    }),
    morphologyInterpretation: morphologyEligibility,
    selectedBeat: Object.freeze({
      beatIndex: selectedBeat.beatIndex,
      startTimeSec: selectedBeat.startTimeSec,
      endTimeSec: selectedBeat.endTimeSec,
      sampleCount: samples.length,
      precedingAcceptedSampleAvailable: precedingSample !== null,
      precedingBeatIndex: precedingSample === null
        ? null
        : precedingBeat!.beatIndex,
      jacobianFiniteDifferenceWidthAudit:
        summarizeJacobianFiniteDifferenceWidths(samples),
    }),
    fixedActivationPrior: Object.freeze({
      variant: result.calciumDrivePriorVariant,
      parameterSetId: calciumDriveParams.parameterSetId,
      atrialRiseTimeConstantSec:
        calciumDriveParams.atrial.riseTimeConstantSec,
      atrialDecayTimeConstantSec:
        calciumDriveParams.atrial.decayTimeConstantSec,
      atrialCalciumOnsetPhase01: atrialOnsetPhase01,
      purpose:
        "normalized-Ca-lobe-selection-proxy-not-Land-activation-or-tension-law" as const,
      activationNormalization:
        "clamp((freeCa-diastolicCa)/peakAmplitude,0,1)" as const,
    }),
    ranges: Object.freeze({
      chamberVolumeMl: chamberRecord((chamber) =>
        range(samples.map((sample) => sample.nodeVolumeMl[chamber]))),
      chamberTransmuralPressureMmHg: chamberRecord((chamber) =>
        range(samples.map((sample) =>
          sample.chamberTransmuralPressureMmHg[chamber]))),
      absolutePressureMmHg: absolutePressureRecord((node) =>
        range(samples.map((sample) => sample.nodeAbsolutePressureMmHg[node]))),
      flowMlPerSec: flowRecord((flow) =>
        range(samples.map((sample) => sample.flowMlPerSec[flow]))),
    }),
    hemodynamics: Object.freeze({
      leftVentricularEjectionFraction01: ejectionFraction(
        samples.map((sample) => sample.nodeVolumeMl.LV),
      ),
      rightVentricularEjectionFraction01: ejectionFraction(
        samples.map((sample) => sample.nodeVolumeMl.RV),
      ),
      netAorticStrokeVolumeMl,
      forwardAorticStrokeVolumeMl,
      netAorticCardiacOutputLPerMin:
        netAorticStrokeVolumeMl / (samples.length * result.dtSec) * 60 / 1000,
      cardiacIndexLPerMinPerM2:
        netAorticStrokeVolumeMl / (samples.length * result.dtSec) * 60 / 1000
        / NORMAL_ADULT_FIVE_WALL_PRIOR_V1.bodySurfaceAreaM2,
      meanAorticAbsolutePressureMmHg: mean(samples.map((sample) =>
        sample.nodeAbsolutePressureMmHg.Ao)),
    }),
    cyclePhysiology: Object.freeze(compactCycle),
    laPvMorphology: Object.freeze({
      twoLobes: compactTwoLobes(lobeMeasurement),
      reservoirConduitEqualVolumeOrder: compactBranchOrder(branchOrder),
    }),
    residualMaxima: Object.freeze({
      mechanicsResidualNorm: maximumAbsolute(samples.map((sample) =>
        sample.diagnostics.mechanicsResidualNorm)),
      circulationScaledResidualInfinityNorm:
        maximumAbsolute(samples.map((sample) =>
          sample.diagnostics.circulationScaledResidualInfinityNorm)),
      absoluteContinuityResidualMl: maximumAbsolute(samples.map((sample) =>
        sample.diagnostics.maximumContinuityResidualMl)),
      absoluteTotalBloodVolumeErrorMl: maximumAbsolute(samples.map((sample) =>
        sample.diagnostics.totalBloodVolumeErrorMl)),
      absoluteValvePowerBalanceResidualMmHgMlPerSec: valveRecord((valve) =>
        maximumAbsolute(samples.map((sample) =>
          sample.valveHydraulics[valve]
            .powerBalanceResidualMmHgMlPerSec))),
    }),
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V1,
  });
}

function assertClosureReferenceScaleSetMatchesPolicy(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): void {
  const expected = result.policy.referenceScaleSetId;
  for (const observation of result.beatClosure) {
    for (const [period, closure] of [
      ["period1", observation.period1],
      ["period2", observation.period2],
    ] as const) {
      if (closure !== null && closure.referenceScaleSetId !== expected) {
        throw new Error(
          `beat ${observation.beatIndex} ${period} referenceScaleSetId `
            + `does not match periodic policy ${expected}`,
        );
      }
    }
  }
}

function classifierEvidenceClosures(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): readonly MainWireNormalAdultFiveWallClassifierEvidenceClosureV1[] {
  const closureByBeat = new Map(result.beatClosure.map((observation) =>
    [observation.beatIndex, observation] as const));
  return Object.freeze(result.periodicity.evidenceBeatIndices.map((beatIndex) => {
    const observation = closureByBeat.get(beatIndex);
    if (observation === undefined) {
      throw new Error(
        `periodicity evidence beat ${beatIndex} has no closure observation`,
      );
    }
    return Object.freeze({
      beatIndex,
      period1MaximumNormalizedDelta:
        observation.period1?.overall.maximumNormalizedDelta ?? null,
      period2MaximumNormalizedDelta:
        observation.period2?.overall.maximumNormalizedDelta ?? null,
    });
  }));
}

function classifierEvidenceJacobianAudits(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): readonly Readonly<{
  beatIndex: number;
  audit: MainWireNormalAdultFiveWallJacobianWidthAuditV1;
}>[] {
  const retainedByBeat = new Map(result.retainedCompleteBeats.map((beat) =>
    [beat.beatIndex, beat] as const));
  return Object.freeze(result.periodicity.evidenceBeatIndices.map((beatIndex) => {
    const beat = retainedByBeat.get(beatIndex);
    if (beat === undefined) {
      throw new Error(
        `periodicity evidence beat ${beatIndex} has no retained complete beat`,
      );
    }
    return Object.freeze({
      beatIndex,
      audit: summarizeJacobianFiniteDifferenceWidths(beat.samples),
    });
  }));
}

function summarizeJacobianFiniteDifferenceWidths(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
): MainWireNormalAdultFiveWallJacobianWidthAuditV1 {
  const nominalScaledStep =
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1;
  const counts = new Map<number, number>();
  for (const sample of samples) {
    const absoluteScaledStep = Math.abs(
      sample.acceptedMechanicsJacobianAudit.finiteDifferenceScaledStepUsed,
    );
    if (!(absoluteScaledStep > 0) || !Number.isFinite(absoluteScaledStep)) {
      throw new Error(
        "accepted mechanics Jacobian finite-difference step must be positive and finite",
      );
    }
    counts.set(absoluteScaledStep, (counts.get(absoluteScaledStep) ?? 0) + 1);
  }
  const histogram = Object.freeze(Array.from(counts, ([absoluteScaledStep, count]) =>
    Object.freeze({
      absoluteScaledStep,
      count,
      classification: absoluteScaledStep === nominalScaledStep
        ? "nominal" as const
        : "alternate" as const,
    })).sort((left, right) =>
      left.absoluteScaledStep - right.absoluteScaledStep));
  const nominalStepCount = histogram
    .filter((entry) => entry.classification === "nominal")
    .reduce((sum, entry) => sum + entry.count, 0);
  return Object.freeze({
    nominalScaledStep,
    acceptedStepCount: samples.length,
    nominalStepCount,
    alternateStepCount: samples.length - nominalStepCount,
    histogram,
  });
}

function compactClosure(
  closure: MainWireFiveWallPeriodicClosureReportV1,
): MainWireNormalAdultFiveWallCompactClosureV1 {
  return Object.freeze({
    elapsedTimeSec: closure.elapsedTimeSec,
    entryCount: closure.overall.entryCount,
    maximumNormalizedDelta: closure.overall.maximumNormalizedDelta,
    worstGroup: closure.overall.worstGroup,
    worstPath: closure.overall.worstPath,
    groupMaximumNormalizedDelta: Object.freeze(Object.fromEntries(
      Object.entries(closure.groups).map(([group, report]) => [
        group,
        Object.freeze({
          maximumNormalizedDelta: report.maximumNormalizedDelta,
          worstPath: report.worstPath,
        }),
      ]),
    )) as MainWireNormalAdultFiveWallCompactClosureV1[
      "groupMaximumNormalizedDelta"
    ],
  });
}

function morphologyInterpretation(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultFiveWallPeriodicSummaryV1[
  "morphologyInterpretation"
] {
  const eligible = result.integrationCompletedWithoutFailure
    && result.terminationReason === "period1-converged"
    && result.periodicity.status === "period1-converged"
    && result.periodicSteadyStateClaimed;
  return Object.freeze({
    eligible,
    scope: "current-dt-period1-only" as const,
    timeStepRobustnessEstablished: false as const,
    reason: eligible
      ? "eligible-current-dt-period1-only" as const
      : result.terminationReason === "period2-suspect"
          || result.periodicity.status === "period2-suspect"
        ? "ineligible-period2-suspect" as const
        : "ineligible-period1-not-converged" as const,
  });
}

function compactTwoLobes(
  measured: LaPvLobeMeasurementV2,
): MainWireNormalAdultFiveWallCompactTwoLobesV1 {
  if (measured.status === "not-measurable") return measured;
  return Object.freeze({
    ...measured,
    aLobe: compactLobe(measured.aLobe),
    vLobe: compactLobe(measured.vLobe),
  });
}

function compactLobe(
  lobe: LaPvMeasuredLobeV2,
): MainWireNormalAdultFiveWallCompactLobeV1 {
  const { path, ...withoutPath } = lobe;
  return Object.freeze({ ...withoutPath, pointCount: path.length });
}

function compactBranchOrder(
  measured: LaPvReservoirConduitOrderV1,
): MainWireNormalAdultFiveWallCompactBranchOrderV1 {
  const { probes: _probes, ...withoutProbes } = measured;
  return Object.freeze(withoutProbes);
}

function atrialActivation01(
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV2,
  prior: FiveWallNormalCalciumDriveParamsV1,
): number {
  const atrial = prior.atrial;
  return clamp01(
    (sample.freeCalciumUM.LA - atrial.diastolicCalciumUM)
      / atrial.peakAmplitudeUM,
  );
}

function atrialCalciumOnsetPhase01(
  prior: FiveWallNormalCalciumDriveParamsV1,
): number {
  return positiveModulo(
    prior.cycleLengthSec - prior.atrioventricularDelaySec
      + prior.atrial.electricalToCalciumDelaySec,
    prior.cycleLengthSec,
  ) / prior.cycleLengthSec;
}

function assertCalciumDriveIdentity(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  prior: FiveWallNormalCalciumDriveParamsV1,
): void {
  const expected = resolveFiveWallNormalCalciumDriveFixedPriorV1(
    result.calciumDrivePriorVariant,
  );
  assertFiveWallNormalCalciumDriveMatchesFixedRegistryV1(
    result.calciumDrivePriorVariant,
    prior,
  );
  const expectedHash = stableHash(sanitizeForStableHash(expected));
  const actualHash = stableHash(sanitizeForStableHash(prior));
  const identity = result.protocolIdentity.calciumDrive;
  const componentHash =
    result.protocolComponentHashes.calciumDriveFixedParamsStableHash;
  if (
    actualHash !== expectedHash
    || prior.parameterSetId !== expected.parameterSetId
  ) {
    throw new Error(
      "periodic result calcium fixed params do not match registry variant",
    );
  }
  if (
    identity.driveId !== FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID
    || identity.parameterSetId !== prior.parameterSetId
  ) {
    throw new Error(
      "periodic result calcium identity does not match its fixed params",
    );
  }
  if (
    componentHash !== expectedHash
    || identity.fixedParamsStableHash !== componentHash
  ) {
    throw new Error(
      "periodic result calcium hash does not match its fixed params",
    );
  }
}

function wallMaterialVolumesMl() {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  const ventricular = prior.anatomy.triSeg.wallGeometryParameters;
  return Object.freeze({
    LA: prior.anatomy.atria.LA.wallMaterialVolumeMl,
    LVFW: ventricular.LVFW.wallMaterialVolumeM3 * 1e6,
    SEP: ventricular.SEP.wallMaterialVolumeM3 * 1e6,
    RVFW: ventricular.RVFW.wallMaterialVolumeM3 * 1e6,
    RA: prior.anatomy.atria.RA.wallMaterialVolumeMl,
  });
}

function cyclicSegmentInclusive<T>(
  values: readonly T[],
  startIndex: number,
  endIndex: number,
): readonly T[] {
  const segment: T[] = [];
  let index = startIndex;
  for (let guard = 0; guard <= values.length; guard += 1) {
    segment.push(values[index]!);
    if (index === endIndex) return Object.freeze(segment);
    index = (index + 1) % values.length;
  }
  throw new Error("cyclic event segment did not terminate");
}

function pvPoint(sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) {
  return Object.freeze({
    laVolumeMl: sample.nodeVolumeMl.LA,
    laPressureMmHg: sample.chamberTransmuralPressureMmHg.LA,
  });
}

function ejectionFraction(values: readonly number[]): number {
  const measured = range(values);
  return (measured.maximum - measured.minimum) / measured.maximum;
}

function range(values: readonly number[]): MainWireNormalAdultFiveWallRangeV1 {
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maximumAbsolute(values: readonly number[]): number {
  return Math.max(...values.map(Math.abs));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}

function chamberRecord<T>(
  build: (chamber: ChamberId) => T,
): Readonly<Record<ChamberId, T>> {
  return Object.freeze(Object.fromEntries(
    (["LA", "LV", "RA", "RV"] as const).map((chamber) =>
      [chamber, build(chamber)]),
  )) as Readonly<Record<ChamberId, T>>;
}

function absolutePressureRecord<T>(
  build: (node: AbsolutePressureId) => T,
): Readonly<Record<AbsolutePressureId, T>> {
  return Object.freeze(Object.fromEntries(
    (["Ao", "PA", "PVein"] as const).map((node) => [node, build(node)]),
  )) as Readonly<Record<AbsolutePressureId, T>>;
}

function flowRecord<T>(
  build: (flow: FlowId) => T,
): Readonly<Record<FlowId, T>> {
  return Object.freeze(Object.fromEntries(
    (["MV", "AoV", "TV", "PV", "PVein_LA"] as const).map((flow) =>
      [flow, build(flow)]),
  )) as Readonly<Record<FlowId, T>>;
}

function valveRecord<T>(
  build: (valve: ValveId) => T,
): Readonly<Record<ValveId, T>> {
  return Object.freeze(Object.fromEntries(
    (["MV", "AoV", "TV", "PV"] as const).map((valve) =>
      [valve, build(valve)]),
  )) as Readonly<Record<ValveId, T>>;
}
