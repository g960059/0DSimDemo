import type {
  NoAvpdFourChamberBenchResultV1,
  NoAvpdFourChamberBenchSampleV1,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import type { SmoothInertialValveParamsV2 } from "@/engine/mechanics2/valve/SmoothInertialValveV2";
import {
  evaluateOneFiberVolumeGeometryV1,
  oneFiberCavityPressurePaV1,
} from "@/engine/mechanics2/geometry/OneFiberVolumeGeometryV1";

export const NO_AVPD_PHYSIOLOGY_MATRIX_DIAGNOSTICS_ID_V1 =
  "no-avpd-physiology-matrix-diagnostics-v1" as const;

export const NO_AVPD_PHYSIOLOGY_MATRIX_TRACE_COLUMNS_V1 = [
  "phase01",
  "leftAtriumVolumeMl",
  "leftAtriumPressureMmHg",
  "leftVentricleVolumeMl",
  "leftVentriclePressureMmHg",
  "mitralFlowMlPerSec",
  "pulmonaryVenousFlowMlPerSec",
  "pulmonaryVenousPressureMmHg",
  "leftAtriumPassiveStressKPa",
  "leftAtriumSlsOverstressKPa",
  "leftAtriumSeriesTensionKPa",
  "leftAtriumThinFilament01",
  "leftAtriumForceVelocityFactor",
  "leftAtriumLengthFactor",
  "leftVentricleSeriesTensionKPa",
  "leftVentriclePassiveStressKPa",
  "leftVentricleFreeCalciumUm",
  "leftVentricleThinFilament01",
] as const;

type CyclePointV1 = {
  readonly phase01: number;
  readonly sample: NoAvpdFourChamberBenchSampleV1;
};

type PressureFitV1 = {
  readonly availability:
    "available" | "insufficient-positive-points" | "nondecaying-fit";
  readonly tauSec: number | null;
  readonly asymptoteMmHg: number;
  readonly amplitudeMmHg: number | null;
  readonly rSquaredLogPressure: number | null;
  readonly pointCount: number;
};

export type NoAvpdPhysiologyMatrixDiagnosticsV1 = ReturnType<
  typeof summarizeNoAvpdPhysiologyMatrixDiagnosticsV1
>;

export function summarizeNoAvpdPhysiologyMatrixDiagnosticsV1(
  report: NoAvpdFourChamberBenchResultV1,
) {
  const cycle = finalCompleteCycle(report);
  const left = report.reportOnlyEventResolvedDiagnostics.left;
  const requiredEvents =
    left == null
      ? null
      : {
          mvo: left.valveTransitions.modelHalfOpen.opening,
          mvc: left.valveTransitions.modelHalfOpen.closure,
          ePeak: left.inflowEvents.ePeak,
          valley: left.inflowEvents.aStartInterpeakMinimum,
          aFlowPeak: left.inflowEvents.aPeak,
          aPressurePeak: left.pressureVolumeEvents.aPeak,
          volumeMinimum: left.pressureVolumeEvents.volumeMinimum,
          x: left.pressureVolumeEvents.xTrough,
          v: left.pressureVolumeEvents.vPeak,
          y: left.pressureVolumeEvents.yTrough,
          calciumRelease: left.prescribedCalciumReleaseOnset,
        };
  const eventsAvailable =
    requiredEvents != null &&
    Object.values(requiredEvents).every((event) => event != null);
  const complete = report.status === "pass" && cycle != null && eventsAvailable;
  const base = {
    diagnosticsId: NO_AVPD_PHYSIOLOGY_MATRIX_DIAGNOSTICS_ID_V1,
    evidenceStatus:
      "report-only-no-physiology-thresholds-or-acceptance" as const,
    sampleTreatment:
      "one-complete-anchor-cycle-every-accepted-step-raw-no-smoothing-no-decimation" as const,
    matchedVolumeMethod:
      "raw-piecewise-linear-unique-segment-intersections-no-isotonic-regression" as const,
    lvRelaxationFitBoundary:
      "model-readback-not-clinical-tau-calcium-decay-half-time-is-not-pressure-tau" as const,
    dynamicFillingBoundary:
      "single-closed-loop-dynamic-pv-readback-is-not-edpvr" as const,
    physiologyThresholdsApplied: false as const,
    changesStructuralStatus: false as const,
    availability: complete
      ? ("available" as const)
      : report.status !== "pass"
        ? ("unavailable-source-structural-fail" as const)
        : cycle == null
          ? ("unavailable-complete-raw-cycle" as const)
          : ("unavailable-required-left-events" as const),
    eventTopology:
      left == null
        ? null
        : {
            modelHalfOpenSelection:
              left.valveTransitions.modelHalfOpen.selectionStatus,
            modelHalfOpenOpeningCount:
              left.valveTransitions.modelHalfOpen.upwardCrossingCount,
            modelHalfOpenClosureCount:
              left.valveTransitions.modelHalfOpen.downwardCrossingCount,
            vPeakBoundaryCensored:
              left.pressureVolumeEvents.vPeak?.boundaryCensored ?? null,
          },
  };
  if (!complete || cycle == null || requiredEvents == null) {
    return {
      ...base,
      eaSeparation: null,
      pressureVolume: null,
      pumpingMorphology: null,
      matchedVolume: null,
      lvRelaxation: null,
      circulation: null,
      traceColumns: NO_AVPD_PHYSIOLOGY_MATRIX_TRACE_COLUMNS_V1,
      compactRawAnchorCycle: [] as readonly (readonly number[])[],
    };
  }
  const events = requiredEvents as {
    [Key in keyof typeof requiredEvents]-?: NonNullable<
      (typeof requiredEvents)[Key]
    >;
  };
  const eaSeparation = summarizeEa(events);
  const pressureVolume = summarizePressureVolume(
    events,
    report.runProtocol.cycleLengthSec,
  );
  const pumpingMorphology = summarizePumpingMorphology(
    cycle,
    events,
    report.runProtocol.cycleLengthSec,
    report.parameterSnapshot.atria.left.geometry,
  );
  const matchedVolume = summarizeMatchedVolume(
    cycle,
    events,
    report.parameterSnapshot.atria.left.geometry,
  );
  const lvRelaxation = summarizeLvRelaxation(cycle, events, report);
  const circulation = summarizeCirculation(
    cycle,
    report.runProtocol.cycleLengthSec,
  );
  return {
    ...base,
    eaSeparation,
    pressureVolume,
    pumpingMorphology,
    matchedVolume,
    lvRelaxation,
    circulation,
    traceColumns: NO_AVPD_PHYSIOLOGY_MATRIX_TRACE_COLUMNS_V1,
    compactRawAnchorCycle: cycle.map(
      ({ phase01, sample }) =>
        [
          phase01,
          sample.volumesMl.leftAtriumMl,
          sample.pressuresMmHg.la,
          sample.volumesMl.leftVentricleMl,
          sample.pressuresMmHg.lv,
          sample.flowsMlPerSec.mv,
          sample.flowsMlPerSec.pvf,
          sample.pressuresMmHg.pve,
          sample.wallReadback.la.passiveStressKPa,
          sample.wallReadback.la.slsOverstressKPa,
          sample.wallReadback.la.seriesTensionKPa,
          sample.wallReadback.la.thinFilamentAvailability01,
          sample.wallReadback.la.forceVelocityFactor,
          sample.wallReadback.la.lengthFactor,
          sample.wallReadback.lvFreeWall.seriesTensionKPa,
          sample.wallReadback.lvFreeWall.passiveStressKPa,
          sample.freeCalciumUm.lvFreeWall,
          sample.thinFilamentAvailability01.lvFreeWall,
        ] as const,
    ),
  };
}

function summarizeEa(events: {
  readonly mvo: NonNullable<
    NonNullable<
      NoAvpdFourChamberBenchResultV1["reportOnlyEventResolvedDiagnostics"]["left"]
    >["valveTransitions"]["modelHalfOpen"]["opening"]
  >;
  readonly ePeak: NonNullable<
    NonNullable<
      NoAvpdFourChamberBenchResultV1["reportOnlyEventResolvedDiagnostics"]["left"]
    >["inflowEvents"]["ePeak"]
  >;
  readonly valley: NonNullable<
    NonNullable<
      NoAvpdFourChamberBenchResultV1["reportOnlyEventResolvedDiagnostics"]["left"]
    >["inflowEvents"]["aStartInterpeakMinimum"]
  >;
  readonly aFlowPeak: NonNullable<
    NonNullable<
      NoAvpdFourChamberBenchResultV1["reportOnlyEventResolvedDiagnostics"]["left"]
    >["inflowEvents"]["aPeak"]
  >;
  readonly calciumRelease: NonNullable<
    NonNullable<
      NoAvpdFourChamberBenchResultV1["reportOnlyEventResolvedDiagnostics"]["left"]
    >["prescribedCalciumReleaseOnset"]
  >;
}) {
  const e = events.ePeak.atrioventricularFlowMlPerSec;
  const a = events.aFlowPeak.atrioventricularFlowMlPerSec;
  const valley = events.valley.atrioventricularFlowMlPerSec;
  return {
    ePeakMlPerSec: e,
    aPeakMlPerSec: a,
    eToA: safeRatio(e, a),
    interpeakValleyMlPerSec: valley,
    valleyOverE: safeRatio(valley, e),
    valleyOverA: safeRatio(valley, a),
    eRelativeProminence: safeRatio(e - valley, e),
    aRelativeProminence: safeRatio(a - valley, a),
    mvoToEPeakSec:
      events.ePeak.timeFromCycleStartSec - events.mvo.timeFromCycleStartSec,
    ePeakToValleySec:
      events.valley.timeFromCycleStartSec - events.ePeak.timeFromCycleStartSec,
    valleyToAPeakSec:
      events.aFlowPeak.timeFromCycleStartSec -
      events.valley.timeFromCycleStartSec,
    ePeakToAPeakSec:
      events.aFlowPeak.timeFromCycleStartSec -
      events.ePeak.timeFromCycleStartSec,
    flowAtCalciumReleaseOverE: safeRatio(
      events.calciumRelease.atrioventricularFlowMlPerSec,
      e,
    ),
    boundaryCensored: {
      ePeak: events.ePeak.boundaryCensored,
      valley: events.valley.boundaryCensored,
      aPeak: events.aFlowPeak.boundaryCensored,
    },
  };
}

function summarizePressureVolume(
  events: {
    readonly mvo: EventPoint;
    readonly mvc: EventPoint;
    readonly aFlowPeak: EventPoint;
    readonly aPressurePeak: EventPoint;
    readonly valley: EventPoint;
    readonly volumeMinimum: EventPoint;
    readonly x: EventPoint;
    readonly v: EventPoint;
    readonly y: EventPoint;
    readonly calciumRelease: EventPoint;
  },
  cycleLengthSec: number,
) {
  const preAVolume = events.valley.atrialVolumeMl;
  const volumeMinimum = events.volumeMinimum.atrialVolumeMl;
  return {
    pressureMmHg: {
      a: events.aPressurePeak.atrialPressureMmHg,
      x: events.x.atrialPressureMmHg,
      v: events.v.atrialPressureMmHg,
      y: events.y.atrialPressureMmHg,
    },
    volumeMl: {
      preA: preAVolume,
      a: events.aPressurePeak.atrialVolumeMl,
      minimum: volumeMinimum,
      x: events.x.atrialVolumeMl,
      v: events.v.atrialVolumeMl,
      y: events.y.atrialVolumeMl,
    },
    xDepthFromAPeakMmHg:
      events.aPressurePeak.atrialPressureMmHg - events.x.atrialPressureMmHg,
    reservoirXToVPressureRiseMmHg:
      events.v.atrialPressureMmHg - events.x.atrialPressureMmHg,
    yDepthFromVPeakMmHg:
      events.v.atrialPressureMmHg - events.y.atrialPressureMmHg,
    earlyReservoirFillingFraction: safeRatio(
      events.x.atrialVolumeMl - volumeMinimum,
      events.v.atrialVolumeMl - volumeMinimum,
    ),
    xToVDynamicComplianceMlPerMmHg: safeRatio(
      events.v.atrialVolumeMl - events.x.atrialVolumeMl,
      events.v.atrialPressureMmHg - events.x.atrialPressureMmHg,
    ),
    pumpingApexRemainingEmptyingFraction: safeRatio(
      events.aPressurePeak.atrialVolumeMl - volumeMinimum,
      preAVolume - volumeMinimum,
    ),
    aPressureMinusAFlowPeakSec:
      shortestPhaseDifference(
        events.aPressurePeak.phase01,
        events.aFlowPeak.phase01,
      ) * cycleLengthSec,
    mvcToXSec:
      forwardPhaseDifference(events.mvc.phase01, events.x.phase01) *
      cycleLengthSec,
    mvoToYSec:
      forwardPhaseDifference(events.mvo.phase01, events.y.phase01) *
      cycleLengthSec,
    yToCalciumReleaseSec:
      forwardPhaseDifference(events.y.phase01, events.calciumRelease.phase01) *
      cycleLengthSec,
    boundaryCensored: {
      a: events.aPressurePeak.boundaryCensored,
      x: events.x.boundaryCensored,
      v: events.v.boundaryCensored,
      y: events.y.boundaryCensored,
      volumeMinimum: events.volumeMinimum.boundaryCensored,
    },
  };
}

type PumpingRawPointV1 = CyclePointV1 & {
  readonly unwrappedPhase01: number;
};

function summarizePumpingMorphology(
  cycle: readonly CyclePointV1[],
  events: {
    readonly calciumRelease: EventPoint;
    readonly mvc: EventPoint;
    readonly volumeMinimum: EventPoint;
  },
  cycleLengthSec: number,
  geometryParams: NoAvpdFourChamberBenchResultV1["parameterSnapshot"]["atria"]["left"]["geometry"],
) {
  const startPhase01 = events.calciumRelease.phase01;
  const endPhase01 = events.volumeMinimum.phase01;
  const endUnwrappedPhase01 =
    startPhase01 < endPhase01 ? endPhase01 : endPhase01 + 1;
  const rawWindow = pumpingRawWindow(cycle, startPhase01, endUnwrappedPhase01);
  const localExtrema = rawLocalPressureExtrema(rawWindow).map((extremum) => ({
    type: extremum.type,
    ...pumpingPointReadback(
      extremum.point,
      startPhase01,
      cycleLengthSec,
      geometryParams,
    ),
  }));
  const primaryPeakIndex = localExtrema.findIndex(
    (point) => point.type === "maximum",
  );
  const troughIndex =
    primaryPeakIndex < 0
      ? -1
      : localExtrema.findIndex(
          (point, index) =>
            index > primaryPeakIndex && point.type === "minimum",
        );
  const latePeakIndex =
    troughIndex < 0
      ? -1
      : localExtrema.findIndex(
          (point, index) => index > troughIndex && point.type === "maximum",
        );
  const primaryPeak =
    primaryPeakIndex < 0 ? null : localExtrema[primaryPeakIndex]!;
  const interveningTrough = troughIndex < 0 ? null : localExtrema[troughIndex]!;
  const latePeak = latePeakIndex < 0 ? null : localExtrema[latePeakIndex]!;
  const reboundAmplitudeMmHg =
    interveningTrough == null || latePeak == null
      ? null
      : latePeak.pressureMmHg - interveningTrough.pressureMmHg;
  const primaryFallMmHg =
    primaryPeak == null || interveningTrough == null
      ? null
      : primaryPeak.pressureMmHg - interveningTrough.pressureMmHg;
  return {
    evidenceStatus:
      "report-only-raw-local-extrema-no-reference-shape-or-physiology-gate" as const,
    windowDefinition:
      "prescribed-la-calcium-release-to-la-volume-minimum-forward-across-cycle-boundary" as const,
    extremaDefinition:
      "strict-turns-of-consecutive-raw-accepted-step-pressure-vertices-endpoints-excluded" as const,
    sequenceSelection:
      "first-complete-local-maximum-minimum-maximum-sequence" as const,
    startPhase01,
    endPhase01,
    endUnwrappedPhase01,
    mvcPhase01: events.mvc.phase01,
    mvcUnwrappedPhase01: unwrapPhaseAfter(events.mvc.phase01, startPhase01),
    crossesCycleBoundary: endUnwrappedPhase01 > 1,
    rawWindowPointCount: rawWindow.length,
    localExtremaCount: localExtrema.length,
    localMaximumCount: localExtrema.filter((point) => point.type === "maximum")
      .length,
    localMinimumCount: localExtrema.filter((point) => point.type === "minimum")
      .length,
    localExtrema,
    primaryPeak,
    interveningTrough,
    latePeak,
    lateRebound: {
      availability:
        primaryPeak != null && interveningTrough != null && latePeak != null
          ? ("available" as const)
          : ("unavailable-no-complete-max-min-max-sequence" as const),
      amplitudeMmHg: reboundAmplitudeMmHg,
      durationSec:
        interveningTrough == null || latePeak == null
          ? null
          : (latePeak.unwrappedPhase01 - interveningTrough.unwrappedPhase01) *
            cycleLengthSec,
      recoveryFractionOfPrimaryFall:
        reboundAmplitudeMmHg == null || primaryFallMmHg == null
          ? null
          : safeRatio(reboundAmplitudeMmHg, primaryFallMmHg),
      primaryToLatePeakPressureDifferenceMmHg:
        primaryPeak == null || latePeak == null
          ? null
          : latePeak.pressureMmHg - primaryPeak.pressureMmHg,
      primaryToLatePeakVolumeShiftMl:
        primaryPeak == null || latePeak == null
          ? null
          : latePeak.volumeMl - primaryPeak.volumeMl,
    },
    boundaryCensoring: {
      calciumReleaseEvent: events.calciumRelease.boundaryCensored,
      mvcEvent: events.mvc.boundaryCensored,
      volumeMinimumEvent: events.volumeMinimum.boundaryCensored,
      rawWindowEndpointsExcludedFromExtrema: true as const,
      selectedSequenceTouchesWindowBoundary: false as const,
      sequenceIncomplete:
        primaryPeak == null || interveningTrough == null || latePeak == null,
    },
  };
}

function pumpingRawWindow(
  cycle: readonly CyclePointV1[],
  startPhase01: number,
  endUnwrappedPhase01: number,
): readonly PumpingRawPointV1[] {
  const crossesBoundary = endUnwrappedPhase01 > 1;
  const beforeBoundary = cycle
    .filter(
      (point) =>
        point.phase01 >= startPhase01 - 1e-12 &&
        point.phase01 <= Math.min(endUnwrappedPhase01, 1) + 1e-12,
    )
    .map((point) => ({ ...point, unwrappedPhase01: point.phase01 }));
  if (!crossesBoundary) return beforeBoundary;
  const wrappedEndPhase01 = endUnwrappedPhase01 - 1;
  const afterBoundary = cycle
    .filter(
      (point) =>
        point.phase01 > 1e-12 && point.phase01 <= wrappedEndPhase01 + 1e-12,
    )
    .map((point) => ({ ...point, unwrappedPhase01: point.phase01 + 1 }));
  return [...beforeBoundary, ...afterBoundary];
}

function rawLocalPressureExtrema(
  points: readonly PumpingRawPointV1[],
): readonly {
  readonly type: "maximum" | "minimum";
  readonly point: PumpingRawPointV1;
}[] {
  const extrema: Array<{
    readonly type: "maximum" | "minimum";
    readonly point: PumpingRawPointV1;
  }> = [];
  for (let index = 1; index < points.length - 1; index += 1) {
    const before = points[index - 1]!.sample.pressuresMmHg.la;
    const current = points[index]!.sample.pressuresMmHg.la;
    const after = points[index + 1]!.sample.pressuresMmHg.la;
    if (current > before && current >= after) {
      extrema.push({ type: "maximum", point: points[index]! });
    } else if (current < before && current <= after) {
      extrema.push({ type: "minimum", point: points[index]! });
    }
  }
  return extrema;
}

function pumpingPointReadback(
  point: PumpingRawPointV1,
  startPhase01: number,
  cycleLengthSec: number,
  geometryParams: NoAvpdFourChamberBenchResultV1["parameterSnapshot"]["atria"]["left"]["geometry"],
) {
  const sample = point.sample;
  const wall = sample.wallReadback.la;
  const pressureFactor = oneFiberPressureFactorMmHgPerKPa(
    sample.volumesMl.leftAtriumMl,
    geometryParams,
  );
  return {
    extractionMethod: "raw-accepted-step-local-extremum" as const,
    boundaryCensored: false as const,
    phase01: point.phase01,
    unwrappedPhase01: point.unwrappedPhase01,
    timeFromCalciumReleaseSec:
      (point.unwrappedPhase01 - startPhase01) * cycleLengthSec,
    volumeMl: sample.volumesMl.leftAtriumMl,
    pressureMmHg: sample.pressuresMmHg.la,
    componentReadback: {
      seriesTensionKPa: wall.seriesTensionKPa,
      passiveStressKPa: wall.passiveStressKPa,
      slsOverstressKPa: wall.slsOverstressKPa,
      thinFilamentAvailability01: wall.thinFilamentAvailability01,
      forceVelocityFactor: wall.forceVelocityFactor,
      lengthFactor: wall.lengthFactor,
      oneFiberPressureFactorMmHgPerKPa: pressureFactor,
      pressureContributionMmHg: {
        seriesTension: wall.seriesTensionKPa * pressureFactor,
        passive: wall.passiveStressKPa * pressureFactor,
        sls: wall.slsOverstressKPa * pressureFactor,
      },
    },
  };
}

function unwrapPhaseAfter(phase01: number, startPhase01: number): number {
  return phase01 >= startPhase01 ? phase01 : phase01 + 1;
}

function summarizeMatchedVolume(
  cycle: readonly CyclePointV1[],
  events: {
    readonly mvo: EventPoint;
    readonly volumeMinimum: EventPoint;
    readonly calciumRelease: EventPoint;
  },
  geometryParams: NoAvpdFourChamberBenchResultV1["parameterSnapshot"]["atria"]["left"]["geometry"],
) {
  const path = cycle.map(({ phase01, sample }) => ({
    phase01,
    volumeMl: sample.volumesMl.leftAtriumMl,
    pressureMmHg: sample.pressuresMmHg.la,
    passiveStressKPa: sample.wallReadback.la.passiveStressKPa,
    seriesTensionKPa: sample.wallReadback.la.seriesTensionKPa,
    slsOverstressKPa: sample.wallReadback.la.slsOverstressKPa,
  }));
  const reservoir = branch(
    path,
    events.volumeMinimum.phase01,
    events.mvo.phase01,
  );
  const conduit = branch(
    path,
    events.mvo.phase01,
    events.calciumRelease.phase01,
  );
  if (reservoir.length < 2 || conduit.length < 2) {
    return {
      availability: "unavailable-branch-samples" as const,
      targetCount: 41,
      validTargetCount: 0,
      ambiguousTargetCount: 0,
      overlapVolumeMl: null,
      reservoirVolumeReversalMl: null,
      conduitVolumeReversalMl: null,
      gapDefinition: "reservoir-minus-conduit" as const,
      gapMmHg: null,
      positiveFraction: null,
      integratedGapMmHgMl: null,
      gapTrace: [] as readonly (readonly [number, number])[],
      ...emptyMatchedVolumeDecomposition(),
    };
  }
  const low = Math.max(
    minimum(reservoir.map((point) => point.volumeMl)),
    minimum(conduit.map((point) => point.volumeMl)),
  );
  const high = Math.min(
    maximum(reservoir.map((point) => point.volumeMl)),
    maximum(conduit.map((point) => point.volumeMl)),
  );
  if (!(high > low)) {
    return {
      availability: "unavailable-no-volume-overlap" as const,
      targetCount: 41,
      validTargetCount: 0,
      ambiguousTargetCount: 0,
      overlapVolumeMl: 0,
      reservoirVolumeReversalMl: volumeReversal(reservoir),
      conduitVolumeReversalMl: volumeReversal(conduit),
      gapDefinition: "reservoir-minus-conduit" as const,
      gapMmHg: null,
      positiveFraction: null,
      integratedGapMmHgMl: null,
      gapTrace: [] as readonly (readonly [number, number])[],
      ...emptyMatchedVolumeDecomposition(),
    };
  }
  const targets = Array.from(
    { length: 41 },
    (_, index) => low + ((high - low) * (index + 1)) / 42,
  );
  const gaps: Array<readonly [number, number]> = [];
  const decompositionTrace: MatchedVolumeDecompositionPointV1[] = [];
  let ambiguousTargetCount = 0;
  for (const volume of targets) {
    const reservoirStates = statesAtVolume(reservoir, volume);
    const conduitStates = statesAtVolume(conduit, volume);
    if (reservoirStates.length !== 1 || conduitStates.length !== 1) {
      ambiguousTargetCount += 1;
      continue;
    }
    const reservoirState = reservoirStates[0]!;
    const conduitState = conduitStates[0]!;
    const totalGapMmHg =
      reservoirState.pressureMmHg - conduitState.pressureMmHg;
    gaps.push([volume, totalGapMmHg] as const);
    const pressureFactorMmHgPerKPa =
      geometryParams == null
        ? null
        : oneFiberPressureFactorMmHgPerKPa(volume, geometryParams);
    if (pressureFactorMmHgPerKPa == null) continue;
    const passiveGapMmHg =
      (reservoirState.passiveStressKPa - conduitState.passiveStressKPa) *
      pressureFactorMmHgPerKPa;
    const seriesTensionGapMmHg =
      (reservoirState.seriesTensionKPa - conduitState.seriesTensionKPa) *
      pressureFactorMmHgPerKPa;
    const slsGapMmHg =
      (reservoirState.slsOverstressKPa - conduitState.slsOverstressKPa) *
      pressureFactorMmHgPerKPa;
    const reconstructedGapMmHg =
      passiveGapMmHg + seriesTensionGapMmHg + slsGapMmHg;
    decompositionTrace.push({
      volumeMl: volume,
      totalGapMmHg,
      passiveGapMmHg,
      seriesTensionGapMmHg,
      slsGapMmHg,
      reconstructedGapMmHg,
      reconstructionResidualMmHg: totalGapMmHg - reconstructedGapMmHg,
    });
  }
  const values = gaps.map((entry) => entry[1]);
  return {
    availability:
      gaps.length >= 2
        ? ("available" as const)
        : ("unavailable-nonunique-volume-intersections" as const),
    targetCount: targets.length,
    validTargetCount: gaps.length,
    ambiguousTargetCount,
    overlapVolumeMl: high - low,
    reservoirVolumeReversalMl: volumeReversal(reservoir),
    conduitVolumeReversalMl: volumeReversal(conduit),
    gapDefinition: "reservoir-minus-conduit" as const,
    gapMmHg:
      values.length === 0
        ? null
        : {
            minimum: minimum(values),
            mean: mean(values),
            median: median(values),
            maximum: maximum(values),
          },
    positiveFraction:
      values.length === 0
        ? null
        : values.filter((value) => value > 0).length / values.length,
    integratedGapMmHgMl: gaps.length < 2 ? null : trapezoid(gaps),
    gapTrace: gaps,
    componentDecomposition: summarizeMatchedVolumeDecomposition(
      decompositionTrace,
      geometryParams != null,
    ),
  };
}

function summarizeLvRelaxation(
  cycle: readonly CyclePointV1[],
  events: {
    readonly mvo: EventPoint;
    readonly ePeak: EventPoint;
    readonly valley: EventPoint;
  },
  report: NoAvpdFourChamberBenchResultV1,
) {
  const peakIndex = cycle.reduce(
    (best, point, index) =>
      point.sample.pressuresMmHg.lv > cycle[best]!.sample.pressuresMmHg.lv
        ? index
        : best,
    0,
  );
  const mvoIndex = firstIndexAtOrAfter(cycle, events.mvo.phase01);
  let peakNegativeDpDtIndex = peakIndex;
  let peakNegativeDpDt = Number.POSITIVE_INFINITY;
  for (
    let index = Math.max(1, peakIndex);
    index < Math.min(cycle.length - 1, mvoIndex);
    index += 1
  ) {
    const left = cycle[index - 1]!;
    const right = cycle[index + 1]!;
    const dt =
      (right.phase01 - left.phase01) * report.runProtocol.cycleLengthSec;
    if (!(dt > 0)) continue;
    const derivative =
      (right.sample.pressuresMmHg.lv - left.sample.pressuresMmHg.lv) / dt;
    if (derivative < peakNegativeDpDt) {
      peakNegativeDpDt = derivative;
      peakNegativeDpDtIndex = index;
    }
  }
  const fitPoints = cycle
    .slice(peakNegativeDpDtIndex, Math.max(peakNegativeDpDtIndex + 1, mvoIndex))
    .map((point) => ({
      timeSec:
        (point.phase01 - cycle[peakNegativeDpDtIndex]!.phase01) *
        report.runProtocol.cycleLengthSec,
      pressureMmHg: point.sample.pressuresMmHg.lv,
    }));
  const zeroAsymptote = exponentialFit(fitPoints, 0);
  const freeAsymptote = bestFreeAsymptoteFit(fitPoints);
  const peakPressure = cycle[peakIndex]!.sample.pressuresMmHg.lv;
  const mvoPressure = events.mvo.ventricularPressureMmHg;
  const fallAmplitude = peakPressure - mvoPressure;
  const crossing90 = downwardPressureCrossing(
    cycle,
    peakIndex,
    mvoIndex,
    mvoPressure + 0.9 * fallAmplitude,
  );
  const crossing10 = downwardPressureCrossing(
    cycle,
    peakIndex,
    mvoIndex,
    mvoPressure + 0.1 * fallAmplitude,
  );
  const pressureFall90To10Sec =
    crossing90 == null || crossing10 == null
      ? null
      : (crossing10 - crossing90) * report.runProtocol.cycleLengthSec;
  const gradientSummary = summarizeEarlyGradient(
    cycle,
    events.mvo.phase01,
    events.ePeak.phase01,
    events.valley.phase01,
    report.runProtocol.cycleLengthSec,
    report.parameterSnapshot.valves.mitral,
  );
  const edv = report.reportOnlyPhysiology.lvEndDiastolicVolumeMl;
  const esv = report.reportOnlyPhysiology.lvEndSystolicVolumeMl;
  return {
    fitWindow: {
      definition: "peak-negative-dpdt-to-sample-before-mvo50" as const,
      startPhase01: cycle[peakNegativeDpDtIndex]!.phase01,
      endPhase01:
        fitPoints.length === 0
          ? null
          : cycle[Math.max(peakNegativeDpDtIndex, mvoIndex - 1)]!.phase01,
      pointCount: fitPoints.length,
    },
    zeroAsymptoteFit: zeroAsymptote,
    freeAsymptoteFit: freeAsymptote,
    peakNegativeDpDtMmHgPerSec: Number.isFinite(peakNegativeDpDt)
      ? peakNegativeDpDt
      : null,
    peakNegativeDpDtPhase01: cycle[peakNegativeDpDtIndex]!.phase01,
    pressureFall90To10Sec,
    pressureFallTauEquivalentSec:
      pressureFall90To10Sec == null
        ? null
        : pressureFall90To10Sec / Math.log(9),
    lvpMinimumMmHg: minimum(
      cycle.map((point) => point.sample.pressuresMmHg.lv),
    ),
    lvpMaximumMmHg: peakPressure,
    mvoLvpMmHg: mvoPressure,
    lvEndDiastolicVolumeMl: edv,
    lvEndSystolicVolumeMl: esv,
    lvStrokeVolumeMl: edv == null || esv == null ? null : edv - esv,
    lvEjectionFraction01: report.reportOnlyPhysiology.lvEjectionFraction01,
    earlyFillingPressureGradient: gradientSummary,
  };
}

function summarizeEarlyGradient(
  cycle: readonly CyclePointV1[],
  mvoPhase: number,
  ePhase: number,
  valleyPhase: number,
  cycleLengthSec: number,
  mitralParams: SmoothInertialValveParamsV2,
) {
  const points = cycle.filter(
    (point) =>
      point.phase01 >= mvoPhase - 1e-12 && point.phase01 <= valleyPhase + 1e-12,
  );
  const rawGradient = (point: CyclePointV1) =>
    point.sample.pressuresMmHg.la - point.sample.pressuresMmHg.lv;
  const accelerationHead = (point: CyclePointV1) => {
    const pressureGradientMmHg = rawGradient(point);
    const openFraction01 = sigmoid(
      (pressureGradientMmHg - mitralParams.openingMidpointMmHg) /
        Math.max(mitralParams.openingWidthMmHg, 1e-9),
    );
    const openAreaCm2 = Math.max(mitralParams.openAreaCm2, 1e-6);
    const leakAreaCm2 = Math.max(
      Math.min(mitralParams.leakAreaCm2, openAreaCm2),
      1e-6,
    );
    const effectiveAreaCm2 =
      leakAreaCm2 + (openAreaCm2 - leakAreaCm2) * openFraction01;
    const areaRatio = openAreaCm2 / Math.max(effectiveAreaCm2, 1e-6);
    const qMlPerSec = point.sample.flowsMlPerSec.mv;
    const smoothAbs = Math.sqrt(
      qMlPerSec ** 2 + mitralParams.flowSmoothingMlPerSec ** 2,
    );
    const resistiveLossMmHg =
      Math.max(mitralParams.openResistanceMmHgSecPerMl, 0) *
      areaRatio ** 2 *
      qMlPerSec;
    const bernoulliLossMmHg =
      Math.max(mitralParams.openBernoulliMmHgSec2PerMl2, 0) *
      areaRatio ** 2 *
      qMlPerSec *
      smoothAbs;
    return pressureGradientMmHg - resistiveLossMmHg - bernoulliLossMmHg;
  };
  const acceleration = points.filter(
    (point) => point.phase01 <= ePhase + 1e-12,
  );
  const rawCrossoverPhase01 = firstPositiveToNegativeCrossover(
    points,
    ePhase,
    rawGradient,
  );
  const effectiveCrossoverPhase01 = firstPositiveToNegativeCrossover(
    points,
    ePhase,
    accelerationHead,
  );
  const reverseRawGradientAreaMmHgSec = negativeArea(
    points,
    ePhase,
    cycleLengthSec,
    rawGradient,
  );
  const negativeAccelerationHeadAreaMmHgSec = negativeArea(
    points,
    ePhase,
    cycleLengthSec,
    accelerationHead,
  );
  return {
    interpretationBoundary:
      "raw-lap-minus-lvp-is-not-valve-acceleration-head-when-resistive-and-bernoulli-losses-are-nonzero" as const,
    accelerationHeadDefinition:
      "lap-minus-lvp-minus-model-mitral-resistive-and-bernoulli-losses-equals-inertance-times-qdot-up-to-valve-residual" as const,
    maximumPositiveLapMinusLvpMmHg:
      acceleration.length === 0 ? null : maximum(acceleration.map(rawGradient)),
    firstPostEPositiveToNegativeCrossoverPhase01: rawCrossoverPhase01,
    firstPostEPositiveToNegativeCrossoverAfterMvoSec:
      rawCrossoverPhase01 == null
        ? null
        : (rawCrossoverPhase01 - mvoPhase) * cycleLengthSec,
    reverseGradientAreaEToValleyMmHgSec: reverseRawGradientAreaMmHgSec,
    maximumPositiveValveAccelerationHeadMmHg:
      acceleration.length === 0
        ? null
        : maximum(acceleration.map(accelerationHead)),
    firstPostEAccelerationHeadCrossoverPhase01: effectiveCrossoverPhase01,
    firstPostEAccelerationHeadCrossoverAfterMvoSec:
      effectiveCrossoverPhase01 == null
        ? null
        : (effectiveCrossoverPhase01 - mvoPhase) * cycleLengthSec,
    negativeAccelerationHeadAreaEToValleyMmHgSec:
      negativeAccelerationHeadAreaMmHgSec,
    mvoToEPeakSec: (ePhase - mvoPhase) * cycleLengthSec,
    ePeakToValleySec: (valleyPhase - ePhase) * cycleLengthSec,
  };
}

function firstPositiveToNegativeCrossover(
  points: readonly CyclePointV1[],
  startPhase: number,
  selector: (point: CyclePointV1) => number,
): number | null {
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1]!;
    const right = points[index]!;
    const leftValue = selector(left);
    const rightValue = selector(right);
    if (
      right.phase01 < startPhase - 1e-12 ||
      leftValue < 0 ||
      rightValue >= 0
    ) {
      continue;
    }
    const phaseStart = Math.max(left.phase01, startPhase);
    const span = right.phase01 - left.phase01;
    const clippedLeftValue =
      span <= 1e-15 || phaseStart === left.phase01
        ? leftValue
        : leftValue +
          ((rightValue - leftValue) * (phaseStart - left.phase01)) / span;
    if (clippedLeftValue < 0) continue;
    const fraction =
      clippedLeftValue / Math.max(clippedLeftValue - rightValue, 1e-15);
    return phaseStart + (right.phase01 - phaseStart) * fraction;
  }
  return null;
}

function negativeArea(
  points: readonly CyclePointV1[],
  startPhase: number,
  cycleLengthSec: number,
  selector: (point: CyclePointV1) => number,
): number {
  let area = 0;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1]!;
    const right = points[index]!;
    if (right.phase01 <= startPhase + 1e-12) continue;
    const segmentStart = Math.max(left.phase01, startPhase);
    const span = right.phase01 - left.phase01;
    const fraction = span <= 1e-15 ? 0 : (segmentStart - left.phase01) / span;
    const leftValue = selector(left);
    const rightValue = selector(right);
    const clippedLeftValue = leftValue + (rightValue - leftValue) * fraction;
    const dt = (right.phase01 - segmentStart) * cycleLengthSec;
    area += piecewiseLinearNegativeArea(clippedLeftValue, rightValue, dt);
  }
  return area;
}

function piecewiseLinearNegativeArea(
  leftValue: number,
  rightValue: number,
  durationSec: number,
): number {
  if (!(durationSec > 0)) return 0;
  if (leftValue >= 0 && rightValue >= 0) return 0;
  if (leftValue <= 0 && rightValue <= 0) {
    return -0.5 * (leftValue + rightValue) * durationSec;
  }
  if (leftValue < 0) {
    const negativeFraction = -leftValue / (rightValue - leftValue);
    return 0.5 * -leftValue * negativeFraction * durationSec;
  }
  const positiveFraction = leftValue / (leftValue - rightValue);
  return 0.5 * -rightValue * (1 - positiveFraction) * durationSec;
}

function sigmoid(value: number): number {
  if (value >= 40) return 1;
  if (value <= -40) return 0;
  return 1 / (1 + Math.exp(-value));
}

function summarizeCirculation(
  cycle: readonly CyclePointV1[],
  cycleLengthSec: number,
) {
  const samples = cycle.map((point) => point.sample);
  const pressure = (
    selector: (sample: NoAvpdFourChamberBenchSampleV1) => number,
  ) => {
    const values = samples.map(selector);
    return {
      minimum: minimum(values),
      mean: mean(values),
      maximum: maximum(values),
    };
  };
  const flow = (
    selector: (sample: NoAvpdFourChamberBenchSampleV1) => number,
  ) => {
    const values = samples.map(selector);
    return {
      minimum: minimum(values),
      mean: mean(values),
      maximum: maximum(values),
      netVolumeMl: integrateCycle(cycle, selector, cycleLengthSec),
    };
  };
  return {
    pressureMmHg: {
      la: pressure((sample) => sample.pressuresMmHg.la),
      lv: pressure((sample) => sample.pressuresMmHg.lv),
      ra: pressure((sample) => sample.pressuresMmHg.ra),
      rv: pressure((sample) => sample.pressuresMmHg.rv),
      systemicArtery: pressure((sample) => sample.pressuresMmHg.sa),
      pulmonaryArtery: pressure((sample) => sample.pressuresMmHg.pa),
      pulmonaryVein: pressure((sample) => sample.pressuresMmHg.pve),
    },
    flowMlPerSec: {
      mitral: flow((sample) => sample.flowsMlPerSec.mv),
      aortic: flow((sample) => sample.flowsMlPerSec.aov),
      pulmonaryVenous: flow((sample) => sample.flowsMlPerSec.pvf),
      pulmonaryValve: flow((sample) => sample.flowsMlPerSec.pulmonaryValve),
    },
  };
}

type EventPoint = NonNullable<
  NonNullable<
    NoAvpdFourChamberBenchResultV1["reportOnlyEventResolvedDiagnostics"]["left"]
  >["pressureVolumeEvents"]["aPeak"]
>;

function finalCompleteCycle(
  report: NoAvpdFourChamberBenchResultV1,
): readonly CyclePointV1[] | null {
  if (report.lastBeatSamples.length < 2) return null;
  const first = report.lastBeatSamples[0]!;
  if (Math.abs(first.phase01) > 1e-12) return null;
  const boundary = report.samples.find(
    (sample) =>
      sample.timeSec >
        report.lastBeatSamples[report.lastBeatSamples.length - 1]!.timeSec &&
      sample.beatIndex === first.beatIndex + 1 &&
      Math.abs(sample.phase01) <= 1e-12,
  );
  if (boundary == null) return null;
  return [
    ...report.lastBeatSamples.map((sample) => ({
      phase01: sample.phase01,
      sample,
    })),
    { phase01: 1, sample: boundary },
  ];
}

type PathPointV1 = {
  readonly phase01: number;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
  readonly passiveStressKPa: number;
  readonly seriesTensionKPa: number;
  readonly slsOverstressKPa: number;
};

type MatchedVolumeDecompositionPointV1 = {
  readonly volumeMl: number;
  readonly totalGapMmHg: number;
  readonly passiveGapMmHg: number;
  readonly seriesTensionGapMmHg: number;
  readonly slsGapMmHg: number;
  readonly reconstructedGapMmHg: number;
  readonly reconstructionResidualMmHg: number;
};

function branch(
  path: readonly PathPointV1[],
  startPhase: number,
  endPhase: number,
): readonly PathPointV1[] {
  if (!(endPhase > startPhase)) return [];
  const start = interpolatePathAtPhase(path, startPhase);
  const end = interpolatePathAtPhase(path, endPhase);
  if (start == null || end == null) return [];
  return [
    start,
    ...path.filter(
      (point) =>
        point.phase01 > startPhase + 1e-12 && point.phase01 < endPhase - 1e-12,
    ),
    end,
  ];
}

function interpolatePathAtPhase(
  path: readonly PathPointV1[],
  phase: number,
): PathPointV1 | null {
  for (let index = 1; index < path.length; index += 1) {
    const left = path[index - 1]!;
    const right = path[index]!;
    if (left.phase01 > phase + 1e-12 || right.phase01 < phase - 1e-12) continue;
    const span = right.phase01 - left.phase01;
    const fraction = span <= 1e-15 ? 0 : (phase - left.phase01) / span;
    return {
      phase01: phase,
      volumeMl: left.volumeMl + (right.volumeMl - left.volumeMl) * fraction,
      pressureMmHg:
        left.pressureMmHg + (right.pressureMmHg - left.pressureMmHg) * fraction,
      passiveStressKPa:
        left.passiveStressKPa +
        (right.passiveStressKPa - left.passiveStressKPa) * fraction,
      seriesTensionKPa:
        left.seriesTensionKPa +
        (right.seriesTensionKPa - left.seriesTensionKPa) * fraction,
      slsOverstressKPa:
        left.slsOverstressKPa +
        (right.slsOverstressKPa - left.slsOverstressKPa) * fraction,
    };
  }
  return null;
}

function statesAtVolume(
  path: readonly PathPointV1[],
  targetVolumeMl: number,
): readonly PathPointV1[] {
  const values: PathPointV1[] = [];
  for (let index = 1; index < path.length; index += 1) {
    const left = path[index - 1]!;
    const right = path[index]!;
    const low = Math.min(left.volumeMl, right.volumeMl);
    const high = Math.max(left.volumeMl, right.volumeMl);
    if (targetVolumeMl < low - 1e-12 || targetVolumeMl > high + 1e-12) continue;
    const span = right.volumeMl - left.volumeMl;
    if (Math.abs(span) <= 1e-12) continue;
    const fraction = (targetVolumeMl - left.volumeMl) / span;
    const state: PathPointV1 = {
      phase01: left.phase01 + (right.phase01 - left.phase01) * fraction,
      volumeMl: targetVolumeMl,
      pressureMmHg:
        left.pressureMmHg + (right.pressureMmHg - left.pressureMmHg) * fraction,
      passiveStressKPa:
        left.passiveStressKPa +
        (right.passiveStressKPa - left.passiveStressKPa) * fraction,
      seriesTensionKPa:
        left.seriesTensionKPa +
        (right.seriesTensionKPa - left.seriesTensionKPa) * fraction,
      slsOverstressKPa:
        left.slsOverstressKPa +
        (right.slsOverstressKPa - left.slsOverstressKPa) * fraction,
    };
    if (!values.some((value) => samePathState(value, state)))
      values.push(state);
  }
  return values;
}

function samePathState(left: PathPointV1, right: PathPointV1): boolean {
  return (
    Math.abs(left.pressureMmHg - right.pressureMmHg) <= 1e-9 &&
    Math.abs(left.passiveStressKPa - right.passiveStressKPa) <= 1e-9 &&
    Math.abs(left.seriesTensionKPa - right.seriesTensionKPa) <= 1e-9 &&
    Math.abs(left.slsOverstressKPa - right.slsOverstressKPa) <= 1e-9
  );
}

function emptyMatchedVolumeDecomposition() {
  return {
    componentDecomposition: {
      availability: "unavailable-matched-volume-path" as const,
      evidenceStatus:
        "report-only-same-volume-one-fiber-pressure-factor-no-causal-acceptance" as const,
      pressureFactorDefinition:
        "P_component=V_wall*sigma_component*d_epsilon_f/dV/133.322-at-the-same-blood-volume" as const,
      componentsAreParallelTransmittedStressTerms: true as const,
      trace: [] as readonly MatchedVolumeDecompositionPointV1[],
      summary: null,
      reconstructionResidual: null,
    },
  };
}

function summarizeMatchedVolumeDecomposition(
  trace: readonly MatchedVolumeDecompositionPointV1[],
  geometryAvailable: boolean,
) {
  const common = {
    evidenceStatus:
      "report-only-same-volume-one-fiber-pressure-factor-no-causal-acceptance" as const,
    pressureFactorDefinition:
      "P_component=V_wall*sigma_component*d_epsilon_f/dV/133.322-at-the-same-blood-volume" as const,
    componentsAreParallelTransmittedStressTerms: true as const,
    trace,
  };
  if (!geometryAvailable || trace.length < 2) {
    return {
      ...common,
      availability: geometryAvailable
        ? ("unavailable-insufficient-unique-matched-volumes" as const)
        : ("unavailable-left-atrial-geometry" as const),
      summary: null,
      reconstructionResidual: null,
    };
  }
  const componentSummary = (
    selector: (point: MatchedVolumeDecompositionPointV1) => number,
  ) => {
    const values = trace.map(selector);
    return {
      minimumMmHg: minimum(values),
      meanMmHg: mean(values),
      medianMmHg: median(values),
      maximumMmHg: maximum(values),
      integratedMmHgMl: trapezoid(
        trace.map((point) => [point.volumeMl, selector(point)] as const),
      ),
    };
  };
  const residualValues = trace.map((point) => point.reconstructionResidualMmHg);
  return {
    ...common,
    availability: "available" as const,
    summary: {
      total: componentSummary((point) => point.totalGapMmHg),
      passive: componentSummary((point) => point.passiveGapMmHg),
      seriesTension: componentSummary((point) => point.seriesTensionGapMmHg),
      sls: componentSummary((point) => point.slsGapMmHg),
      reconstructed: componentSummary((point) => point.reconstructedGapMmHg),
    },
    reconstructionResidual: {
      minimumMmHg: minimum(residualValues),
      meanMmHg: mean(residualValues),
      maximumMmHg: maximum(residualValues),
      meanAbsoluteMmHg: mean(residualValues.map(Math.abs)),
      maximumAbsoluteMmHg: maximum(residualValues.map(Math.abs)),
      integratedSignedMmHgMl: trapezoid(
        trace.map(
          (point) =>
            [point.volumeMl, point.reconstructionResidualMmHg] as const,
        ),
      ),
      integratedAbsoluteMmHgMl: trapezoid(
        trace.map(
          (point) =>
            [
              point.volumeMl,
              Math.abs(point.reconstructionResidualMmHg),
            ] as const,
        ),
      ),
    },
  };
}

function oneFiberPressureFactorMmHgPerKPa(
  volumeMl: number,
  geometryParams: NoAvpdFourChamberBenchResultV1["parameterSnapshot"]["atria"]["left"]["geometry"],
): number {
  const geometry = evaluateOneFiberVolumeGeometryV1(volumeMl, geometryParams);
  return oneFiberCavityPressurePaV1(geometry, 1_000) / 133.322;
}

function volumeReversal(path: readonly PathPointV1[]): number {
  const direction =
    path[path.length - 1]!.volumeMl >= path[0]!.volumeMl ? 1 : -1;
  let reversal = 0;
  for (let index = 1; index < path.length; index += 1) {
    const directed =
      direction * (path[index]!.volumeMl - path[index - 1]!.volumeMl);
    if (directed < 0) reversal -= directed;
  }
  return reversal;
}

function exponentialFit(
  points: readonly {
    readonly timeSec: number;
    readonly pressureMmHg: number;
  }[],
  asymptoteMmHg: number,
): PressureFitV1 {
  const transformed = points.flatMap((point) => {
    const shifted = point.pressureMmHg - asymptoteMmHg;
    return shifted > 0 && Number.isFinite(shifted)
      ? [{ x: point.timeSec, y: Math.log(shifted) }]
      : [];
  });
  if (transformed.length < 3) {
    return {
      availability: "insufficient-positive-points",
      tauSec: null,
      asymptoteMmHg,
      amplitudeMmHg: null,
      rSquaredLogPressure: null,
      pointCount: transformed.length,
    };
  }
  const regression = linearRegression(transformed);
  if (!(regression.slope < 0)) {
    return {
      availability: "nondecaying-fit",
      tauSec: null,
      asymptoteMmHg,
      amplitudeMmHg: Math.exp(regression.intercept),
      rSquaredLogPressure: regression.rSquared,
      pointCount: transformed.length,
    };
  }
  return {
    availability: "available",
    tauSec: -1 / regression.slope,
    asymptoteMmHg,
    amplitudeMmHg: Math.exp(regression.intercept),
    rSquaredLogPressure: regression.rSquared,
    pointCount: transformed.length,
  };
}

function bestFreeAsymptoteFit(
  points: readonly {
    readonly timeSec: number;
    readonly pressureMmHg: number;
  }[],
): PressureFitV1 & { readonly searchBoundsMmHg: readonly [number, number] } {
  if (points.length < 3) {
    return {
      ...exponentialFit(points, 0),
      searchBoundsMmHg: [0, 0],
    };
  }
  const pressures = points.map((point) => point.pressureMmHg);
  const lowPressure = minimum(pressures);
  const span = Math.max(maximum(pressures) - lowPressure, 1);
  const lowBound = lowPressure - 2 * span;
  const highBound = lowPressure - 1e-6;
  let best = exponentialFit(points, lowBound);
  for (let index = 1; index <= 400; index += 1) {
    const asymptote = lowBound + ((highBound - lowBound) * index) / 400;
    const fit = exponentialFit(points, asymptote);
    if (
      fit.rSquaredLogPressure != null &&
      (best.rSquaredLogPressure == null ||
        fit.rSquaredLogPressure > best.rSquaredLogPressure)
    ) {
      best = fit;
    }
  }
  return { ...best, searchBoundsMmHg: [lowBound, highBound] };
}

function linearRegression(
  points: readonly { readonly x: number; readonly y: number }[],
) {
  const meanX = mean(points.map((point) => point.x));
  const meanY = mean(points.map((point) => point.y));
  let xx = 0;
  let xy = 0;
  let yy = 0;
  for (const point of points) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  }
  const slope = xx > 0 ? xy / xx : 0;
  const intercept = meanY - slope * meanX;
  let residual = 0;
  for (const point of points) {
    const error = point.y - (intercept + slope * point.x);
    residual += error * error;
  }
  return {
    slope,
    intercept,
    rSquared: yy > 0 ? 1 - residual / yy : 1,
  };
}

function downwardPressureCrossing(
  cycle: readonly CyclePointV1[],
  startIndex: number,
  endIndex: number,
  levelMmHg: number,
): number | null {
  for (let index = Math.max(1, startIndex + 1); index <= endIndex; index += 1) {
    const left = cycle[index - 1]!;
    const right = cycle[index]!;
    const leftValue = left.sample.pressuresMmHg.lv - levelMmHg;
    const rightValue = right.sample.pressuresMmHg.lv - levelMmHg;
    if (leftValue < 0 || rightValue > 0) continue;
    const fraction = leftValue / Math.max(leftValue - rightValue, 1e-15);
    return left.phase01 + (right.phase01 - left.phase01) * fraction;
  }
  return null;
}

function firstIndexAtOrAfter(
  cycle: readonly CyclePointV1[],
  phase: number,
): number {
  const index = cycle.findIndex((point) => point.phase01 >= phase - 1e-12);
  return index < 0 ? cycle.length - 1 : index;
}

function integrateCycle(
  cycle: readonly CyclePointV1[],
  selector: (sample: NoAvpdFourChamberBenchSampleV1) => number,
  cycleLengthSec: number,
): number {
  let integral = 0;
  for (let index = 1; index < cycle.length; index += 1) {
    const left = cycle[index - 1]!;
    const right = cycle[index]!;
    const dt = (right.phase01 - left.phase01) * cycleLengthSec;
    integral += 0.5 * (selector(left.sample) + selector(right.sample)) * dt;
  }
  return integral;
}

function trapezoid(points: readonly (readonly [number, number])[]): number {
  let integral = 0;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1]!;
    const right = points[index]!;
    integral += 0.5 * (left[1] + right[1]) * (right[0] - left[0]);
  }
  return integral;
}

function safeRatio(numerator: number, denominator: number): number | null {
  return Number.isFinite(numerator) &&
    Number.isFinite(denominator) &&
    Math.abs(denominator) > 1e-15
    ? numerator / denominator
    : null;
}

function forwardPhaseDifference(start: number, end: number): number {
  const difference = end - start;
  return difference >= 0 ? difference : difference + 1;
}

function shortestPhaseDifference(later: number, earlier: number): number {
  let difference = later - earlier;
  while (difference > 0.5) difference -= 1;
  while (difference <= -0.5) difference += 1;
  return difference;
}

function minimum(values: readonly number[]): number {
  return Math.min(...values);
}

function maximum(values: readonly number[]): number {
  return Math.max(...values);
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? 0.5 * (sorted[middle - 1]! + sorted[middle]!)
    : sorted[middle]!;
}
