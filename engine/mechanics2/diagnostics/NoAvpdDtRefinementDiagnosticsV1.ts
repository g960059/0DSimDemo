import type {
  NoAvpdFourChamberBenchResultV1,
  NoAvpdFourChamberBenchSampleV1,
} from "@/engine/mechanics2/benches/NoAvpdFourChamberHillTriSegBenchV1";
import type {
  NoAvpdAtrialEventDiagnosticsV1,
  NoAvpdEventResolvedDiagnosticsV1,
  NoAvpdOperationalEventPointV1,
} from "@/engine/mechanics2/diagnostics/NoAvpdEventResolvedDiagnosticsV1";

export const NO_AVPD_DT_REFINEMENT_DIAGNOSTICS_ID_V1 =
  "no-avpd-four-chamber-dt-refinement-diagnostics-v1" as const;

export const NO_AVPD_DT_REFINEMENT_TRACE_COLUMNS_V1 = [
  "phase01",
  "leftAtriumVolumeMl",
  "leftAtriumPressureMmHg",
  "leftVentricleVolumeMl",
  "leftVentriclePressureMmHg",
  "rightAtriumVolumeMl",
  "rightAtriumPressureMmHg",
  "rightVentricleVolumeMl",
  "rightVentriclePressureMmHg",
  "mitralFlowMlPerSec",
  "tricuspidFlowMlPerSec",
  "pulmonaryVenousFlowMlPerSec",
  "leftAtriumFreeCalciumUm",
  "leftAtriumCaTroponin01",
  "leftAtriumThinFilament01",
  "leftAtriumSeriesTensionKPa",
  "rightAtriumFreeCalciumUm",
  "rightAtriumCaTroponin01",
  "rightAtriumThinFilament01",
  "rightAtriumSeriesTensionKPa",
  "leftAtriumCalciumRiseState01",
  "leftAtriumCalciumDecayState01",
  "leftAtriumMidpointFreeCalciumUm",
  "rightAtriumCalciumRiseState01",
  "rightAtriumCalciumDecayState01",
  "rightAtriumMidpointFreeCalciumUm",
] as const;

export type NoAvpdDtRefinementTraceColumnV1 =
  typeof NO_AVPD_DT_REFINEMENT_TRACE_COLUMNS_V1[number];

export type NoAvpdDtRefinementTracePointV1 = readonly number[];

export type NoAvpdDtRefinementSourceRunV1 = {
  readonly result: NoAvpdFourChamberBenchResultV1;
  readonly parameterSha256: string;
  readonly initialStateSha256: string;
  /** State-transition/equations implementation hash. */
  readonly implementationSha256: string;
  readonly harnessImplementationSha256: string;
  readonly sourceRunSha256: string;
};

type NoAvpdDtRefinementChannelStatsV1 = {
  readonly unit: "mL" | "mmHg" | "mL/s" | "uM" | "fraction" | "kPa";
  readonly commonNodeCount: number;
  readonly maxAbsNative: number;
  readonly rmsNative: number;
  readonly phaseAtMaxAbs01: number;
  readonly signedFineMinusCoarseAtMaxAbs: number;
  readonly jointCommonNodeSpanNative: number;
  readonly maxAbsOverJointSpan: number | null;
  readonly rmsOverJointSpan: number | null;
};

type NoAvpdDtRefinementEventShiftV1 = {
  readonly coarserPresent: boolean;
  readonly finerPresent: boolean;
  readonly topologyMatches: boolean;
  readonly signedShortestTimingShiftSec: number | null;
  readonly atrialPressureShiftMmHg: number | null;
  readonly atrialVolumeShiftMl: number | null;
  readonly atrioventricularFlowShiftMlPerSec: number | null;
};

export type NoAvpdDtRefinementRunV1 = {
  readonly stepsPerCycle: number;
  readonly dtSec: number;
  readonly rawAnchorCycleStepSampleCount: number;
  readonly rawEndpointSampleCount: number;
  readonly status: NoAvpdFourChamberBenchResultV1["status"];
  readonly failureReason: string | null;
  readonly initialization: NoAvpdFourChamberBenchResultV1["runProtocol"]["initialization"];
  readonly beatsCompleted: number;
  readonly parameterSha256: string;
  readonly implementationSha256: string;
  readonly harnessImplementationSha256: string;
  readonly sourceRunSha256: string;
  readonly eventAnchorBeatIndex: number;
  readonly hardDiagnostics: NoAvpdFourChamberBenchResultV1["hardDiagnostics"];
  readonly solverWork: NoAvpdFourChamberBenchResultV1["solverWork"];
  readonly exactReturnMap:
    NoAvpdFourChamberBenchResultV1["reportOnlyExactBeatBoundaryReturnMap"];
  readonly events: NoAvpdEventResolvedDiagnosticsV1;
  readonly trace: readonly NoAvpdDtRefinementTracePointV1[];
  readonly endpointMinusStartByChannel: Readonly<Record<
    Exclude<NoAvpdDtRefinementTraceColumnV1, "phase01">,
    number
  >>;
};

export type NoAvpdDtRefinementPairV1 = {
  readonly coarserStepsPerCycle: number;
  readonly finerStepsPerCycle: number;
  readonly nestedGridRatio: number;
  readonly commonNodeComparison: "exact-nested-phase-nodes-no-interpolation";
  readonly channelDifferences: Readonly<Record<
    Exclude<NoAvpdDtRefinementTraceColumnV1, "phase01">,
    NoAvpdDtRefinementChannelStatsV1
  >>;
  readonly eventTopologyMatches: boolean;
  readonly eventTopologyComparison:
    "crossing-count-selection-censoring-presence-and-inflow-readback-status-excluding-numerical-regularizer-tail";
  readonly auxiliaryNumericalRegularizerTailTopologyMatches: boolean;
  readonly eventShifts: Readonly<Record<string, NoAvpdDtRefinementEventShiftV1>>;
};

export type NoAvpdDtRefinementDiagnosticsV1 = {
  readonly diagnosticsId: typeof NO_AVPD_DT_REFINEMENT_DIAGNOSTICS_ID_V1;
  readonly evidenceStatus: "report-only-time-step-consistency-not-an-acceptance-gate";
  readonly timeStepRefinementPerformed: true;
  readonly comparisonMethod: "exact-nested-phase-nodes-no-waveform-interpolation";
  readonly sampleTreatment:
    "complete-event-anchor-cycle-every-accepted-step-no-smoothing-no-decimation";
  readonly thresholdsApplied: false;
  readonly accuracyClassification: "not-performed";
  readonly physiologyClassification: "not-performed";
  readonly claimBoundary:
    "agreement-does-not-establish-accuracy-or-physiological-normality-and-unsettled-return-maps-may-confound-differences";
  readonly commonProvenance: {
    readonly parameterSha256: string;
    readonly parameterSnapshot: NoAvpdFourChamberBenchResultV1["parameterSnapshot"];
    readonly initialStateSha256: string;
    /** State-transition/equations implementation hash. */
    readonly implementationSha256: string;
    readonly harnessImplementationSha256: string;
    readonly modelId: string;
    readonly equationsVersionId: string;
    readonly stateLayoutId: string;
    readonly rhythmTopologyId: string;
    readonly cycleLengthSec: number;
    readonly solverPolicyJson: string;
    readonly beatsRequested: number;
    readonly beatsCompleted: number;
    readonly sampleRetention: "last-two-complete-beats";
    readonly allRunsCold: boolean;
    readonly sourceResultBodiesEmbedded: false;
    readonly sourceRunSha256Interpretation:
      "content-address-requires-separate-full-source-result-for-recomputation";
  };
  readonly traceColumns: typeof NO_AVPD_DT_REFINEMENT_TRACE_COLUMNS_V1;
  readonly runs: readonly NoAvpdDtRefinementRunV1[];
  readonly pairwise: readonly NoAvpdDtRefinementPairV1[];
  readonly successiveChangeRatioFinePairOverCoarsePair: Readonly<Record<
    Exclude<NoAvpdDtRefinementTraceColumnV1, "phase01">,
    {
      readonly maxAbsRatio: number | null;
      readonly rmsRatio: number | null;
      readonly interpretation: "successive-change-ratio-not-observed-order-or-error-estimate";
    }
  >> | null;
};

type ChannelDefinition = {
  readonly column: Exclude<NoAvpdDtRefinementTraceColumnV1, "phase01">;
  readonly index: number;
  readonly unit: NoAvpdDtRefinementChannelStatsV1["unit"];
};

const CHANNEL_DEFINITIONS: readonly ChannelDefinition[] = [
  { column: "leftAtriumVolumeMl", index: 1, unit: "mL" },
  { column: "leftAtriumPressureMmHg", index: 2, unit: "mmHg" },
  { column: "leftVentricleVolumeMl", index: 3, unit: "mL" },
  { column: "leftVentriclePressureMmHg", index: 4, unit: "mmHg" },
  { column: "rightAtriumVolumeMl", index: 5, unit: "mL" },
  { column: "rightAtriumPressureMmHg", index: 6, unit: "mmHg" },
  { column: "rightVentricleVolumeMl", index: 7, unit: "mL" },
  { column: "rightVentriclePressureMmHg", index: 8, unit: "mmHg" },
  { column: "mitralFlowMlPerSec", index: 9, unit: "mL/s" },
  { column: "tricuspidFlowMlPerSec", index: 10, unit: "mL/s" },
  { column: "pulmonaryVenousFlowMlPerSec", index: 11, unit: "mL/s" },
  { column: "leftAtriumFreeCalciumUm", index: 12, unit: "uM" },
  { column: "leftAtriumCaTroponin01", index: 13, unit: "fraction" },
  { column: "leftAtriumThinFilament01", index: 14, unit: "fraction" },
  { column: "leftAtriumSeriesTensionKPa", index: 15, unit: "kPa" },
  { column: "rightAtriumFreeCalciumUm", index: 16, unit: "uM" },
  { column: "rightAtriumCaTroponin01", index: 17, unit: "fraction" },
  { column: "rightAtriumThinFilament01", index: 18, unit: "fraction" },
  { column: "rightAtriumSeriesTensionKPa", index: 19, unit: "kPa" },
  { column: "leftAtriumCalciumRiseState01", index: 20, unit: "fraction" },
  { column: "leftAtriumCalciumDecayState01", index: 21, unit: "fraction" },
  { column: "leftAtriumMidpointFreeCalciumUm", index: 22, unit: "uM" },
  { column: "rightAtriumCalciumRiseState01", index: 23, unit: "fraction" },
  { column: "rightAtriumCalciumDecayState01", index: 24, unit: "fraction" },
  { column: "rightAtriumMidpointFreeCalciumUm", index: 25, unit: "uM" },
];

export function buildNoAvpdDtRefinementDiagnosticsV1(
  sourceRuns: readonly NoAvpdDtRefinementSourceRunV1[],
): NoAvpdDtRefinementDiagnosticsV1 {
  if (sourceRuns.length < 2) throw new Error("dt refinement requires at least two runs");
  const sorted = sourceRuns.slice().sort((left, right) => (
    stepsPerCycle(left.result) - stepsPerCycle(right.result)
  ));
  validateCommonProvenance(sorted);
  const runs = sorted.map(compactRun);
  const pairwise = runs.slice(1).map((finer, index) => compareRuns(runs[index]!, finer));
  return {
    diagnosticsId: NO_AVPD_DT_REFINEMENT_DIAGNOSTICS_ID_V1,
    evidenceStatus: "report-only-time-step-consistency-not-an-acceptance-gate",
    timeStepRefinementPerformed: true,
    comparisonMethod: "exact-nested-phase-nodes-no-waveform-interpolation",
    sampleTreatment:
      "complete-event-anchor-cycle-every-accepted-step-no-smoothing-no-decimation",
    thresholdsApplied: false,
    accuracyClassification: "not-performed",
    physiologyClassification: "not-performed",
    claimBoundary:
      "agreement-does-not-establish-accuracy-or-physiological-normality-and-unsettled-return-maps-may-confound-differences",
    commonProvenance: {
      parameterSha256: sorted[0]!.parameterSha256,
      parameterSnapshot: sorted[0]!.result.parameterSnapshot,
      initialStateSha256: sorted[0]!.initialStateSha256,
      implementationSha256: sorted[0]!.implementationSha256,
      harnessImplementationSha256: sorted[0]!.harnessImplementationSha256,
      modelId: sorted[0]!.result.runProtocol.modelId,
      equationsVersionId: sorted[0]!.result.runProtocol.equationsVersionId,
      stateLayoutId: sorted[0]!.result.runProtocol.stateLayoutId,
      rhythmTopologyId: sorted[0]!.result.runProtocol.rhythmTopologyId,
      cycleLengthSec: sorted[0]!.result.runProtocol.cycleLengthSec,
      solverPolicyJson: JSON.stringify(sorted[0]!.result.parameterSnapshot.solver),
      beatsRequested: sorted[0]!.result.beatsRequested,
      beatsCompleted: sorted[0]!.result.beatsCompleted,
      sampleRetention: "last-two-complete-beats",
      allRunsCold: sorted.every((run) => run.result.runProtocol.initialization.mode === "cold"),
      sourceResultBodiesEmbedded: false,
      sourceRunSha256Interpretation:
        "content-address-requires-separate-full-source-result-for-recomputation",
    },
    traceColumns: NO_AVPD_DT_REFINEMENT_TRACE_COLUMNS_V1,
    runs,
    pairwise,
    successiveChangeRatioFinePairOverCoarsePair:
      pairwise.length === 2 ? successiveChangeRatios(pairwise[0]!, pairwise[1]!) : null,
  };
}

function compactRun(source: NoAvpdDtRefinementSourceRunV1): NoAvpdDtRefinementRunV1 {
  const result = source.result;
  const expectedSteps = stepsPerCycle(result);
  const eventAnchorBeatIndex = result.reportOnlyEventResolvedDiagnostics.eventAnchorBeatIndex;
  if (eventAnchorBeatIndex === null) {
    throw new Error("dt refinement requires an observed two-cycle event anchor");
  }
  const traceSamples = completeTraceSamples(result, eventAnchorBeatIndex);
  if (traceSamples.length !== expectedSteps + 1) {
    throw new Error(
      `N=${expectedSteps} raw endpoint trace has ${traceSamples.length} rather than ${expectedSteps + 1} points`,
    );
  }
  const trace = traceSamples.map(packSample);
  const first = trace[0]!;
  const last = trace[trace.length - 1]!;
  return {
    stepsPerCycle: expectedSteps,
    dtSec: result.dtSec,
    rawAnchorCycleStepSampleCount: traceSamples.length - 1,
    rawEndpointSampleCount: trace.length,
    status: result.status,
    failureReason: result.failureReason,
    initialization: result.runProtocol.initialization,
    beatsCompleted: result.beatsCompleted,
    parameterSha256: source.parameterSha256,
    implementationSha256: source.implementationSha256,
    harnessImplementationSha256: source.harnessImplementationSha256,
    sourceRunSha256: source.sourceRunSha256,
    eventAnchorBeatIndex,
    hardDiagnostics: result.hardDiagnostics,
    solverWork: result.solverWork,
    exactReturnMap: result.reportOnlyExactBeatBoundaryReturnMap,
    events: result.reportOnlyEventResolvedDiagnostics,
    trace,
    endpointMinusStartByChannel: Object.fromEntries(CHANNEL_DEFINITIONS.map((definition) => [
      definition.column,
      last[definition.index]! - first[definition.index]!,
    ])) as NoAvpdDtRefinementRunV1["endpointMinusStartByChannel"],
  };
}

function compareRuns(
  coarser: NoAvpdDtRefinementRunV1,
  finer: NoAvpdDtRefinementRunV1,
): NoAvpdDtRefinementPairV1 {
  const ratio = finer.stepsPerCycle / coarser.stepsPerCycle;
  if (!Number.isInteger(ratio) || ratio <= 1) {
    throw new Error(
      `N=${coarser.stepsPerCycle} and N=${finer.stepsPerCycle} are not nested grids`,
    );
  }
  const channelDifferences = Object.fromEntries(CHANNEL_DEFINITIONS.map((definition) => {
    const deltas: number[] = [];
    const jointValues: number[] = [];
    let phaseAtMaxAbs01 = 0;
    let signedAtMax = 0;
    for (let index = 0; index < coarser.trace.length; index += 1) {
      const coarsePoint = coarser.trace[index]!;
      const finePoint = finer.trace[index * ratio]!;
      if (Math.abs(coarsePoint[0]! - finePoint[0]!) > 1e-10) {
        throw new Error("nested phase nodes are not aligned");
      }
      const coarseValue = coarsePoint[definition.index]!;
      const fineValue = finePoint[definition.index]!;
      const delta = fineValue - coarseValue;
      deltas.push(delta);
      jointValues.push(coarseValue, fineValue);
      if (Math.abs(delta) > Math.abs(signedAtMax)) {
        signedAtMax = delta;
        phaseAtMaxAbs01 = coarsePoint[0]!;
      }
    }
    const span = Math.max(...jointValues) - Math.min(...jointValues);
    const maxAbs = Math.max(...deltas.map(Math.abs));
    const rms = Math.sqrt(deltas.reduce((sum, value) => sum + value * value, 0)
      / Math.max(deltas.length, 1));
    const stats: NoAvpdDtRefinementChannelStatsV1 = {
      unit: definition.unit,
      commonNodeCount: deltas.length,
      maxAbsNative: maxAbs,
      rmsNative: rms,
      phaseAtMaxAbs01,
      signedFineMinusCoarseAtMaxAbs: signedAtMax,
      jointCommonNodeSpanNative: span,
      maxAbsOverJointSpan: span > 1e-15 ? maxAbs / span : null,
      rmsOverJointSpan: span > 1e-15 ? rms / span : null,
    };
    return [definition.column, stats];
  })) as NoAvpdDtRefinementPairV1["channelDifferences"];
  const coarseEvents = eventPoints(coarser.events);
  const fineEvents = eventPoints(finer.events);
  const eventNames = [...new Set([...Object.keys(coarseEvents), ...Object.keys(fineEvents)])];
  const eventShifts = Object.fromEntries(eventNames.map((eventName) => {
    const coarsePoint = coarseEvents[eventName] ?? null;
    const finePoint = fineEvents[eventName] ?? null;
    const shift: NoAvpdDtRefinementEventShiftV1 = {
      coarserPresent: coarsePoint !== null,
      finerPresent: finePoint !== null,
      topologyMatches: (coarsePoint === null) === (finePoint === null),
      signedShortestTimingShiftSec: coarsePoint !== null && finePoint !== null
        ? shortestPhaseDifference(finePoint.phase01, coarsePoint.phase01)
          * coarser.events.cycleLengthSec
        : null,
      atrialPressureShiftMmHg: finiteShift(
        finePoint?.atrialPressureMmHg,
        coarsePoint?.atrialPressureMmHg,
      ),
      atrialVolumeShiftMl: finiteShift(
        finePoint?.atrialVolumeMl,
        coarsePoint?.atrialVolumeMl,
      ),
      atrioventricularFlowShiftMlPerSec: finiteShift(
        finePoint?.atrioventricularFlowMlPerSec,
        coarsePoint?.atrioventricularFlowMlPerSec,
      ),
    };
    return [eventName, shift];
  }));
  const detailedTopologyMatches = eventTopologyKey(coarser.events)
    === eventTopologyKey(finer.events);
  return {
    coarserStepsPerCycle: coarser.stepsPerCycle,
    finerStepsPerCycle: finer.stepsPerCycle,
    nestedGridRatio: ratio,
    commonNodeComparison: "exact-nested-phase-nodes-no-interpolation",
    channelDifferences,
    eventTopologyMatches: detailedTopologyMatches
      && Object.entries(eventShifts)
        .filter(([name]) => !name.endsWith(".eTailNumericalRegularizer"))
        .every(([, shift]) => shift.topologyMatches),
    eventTopologyComparison:
      "crossing-count-selection-censoring-presence-and-inflow-readback-status-excluding-numerical-regularizer-tail",
    auxiliaryNumericalRegularizerTailTopologyMatches:
      numericalRegularizerTailTopologyKey(coarser.events)
        === numericalRegularizerTailTopologyKey(finer.events),
    eventShifts,
  };
}

function validateCommonProvenance(sourceRuns: readonly NoAvpdDtRefinementSourceRunV1[]): void {
  const first = sourceRuns[0]!;
  const key = (source: NoAvpdDtRefinementSourceRunV1) => JSON.stringify({
    parameterSha256: source.parameterSha256,
    parameterSnapshot: source.result.parameterSnapshot,
    initialStateSha256: source.initialStateSha256,
    implementationSha256: source.implementationSha256,
    harnessImplementationSha256: source.harnessImplementationSha256,
    modelId: source.result.runProtocol.modelId,
    equationsVersionId: source.result.runProtocol.equationsVersionId,
    stateLayoutId: source.result.runProtocol.stateLayoutId,
    rhythmTopologyId: source.result.runProtocol.rhythmTopologyId,
    cycleLengthSec: source.result.runProtocol.cycleLengthSec,
    beatsRequested: source.result.beatsRequested,
    beatsCompleted: source.result.beatsCompleted,
    sampleRetention: source.result.runProtocol.sampleRetention,
    initialization: source.result.runProtocol.initialization,
  });
  const expected = key(first);
  for (const source of sourceRuns) {
    if (key(source) !== expected) {
      throw new Error("dt refinement runs do not share parameter/initial-state/protocol provenance");
    }
    if (
      source.result.runProtocol.initialization.mode !== "cold"
      || source.result.runProtocol.initialization.initialTimeSec !== 0
      || source.result.runProtocol.initialization.provenance !== null
    ) {
      throw new Error("dt refinement requires independent cycle-boundary cold starts");
    }
    if (source.result.runProtocol.sampleRetention !== "last-two-complete-beats") {
      throw new Error("dt refinement requires last-two-complete-beats retention");
    }
    if (source.result.runProtocol.sampleEverySteps !== 1) {
      throw new Error("dt refinement requires every accepted step to be sampled");
    }
    if (source.result.reportOnlyEventResolvedDiagnostics.availability
      !== "available-complete-raw-two-cycle-window") {
      throw new Error("dt refinement requires an observed two-cycle raw event window");
    }
    if (source.result.status !== "pass") {
      throw new Error(`dt refinement source N=${stepsPerCycle(source.result)} did not pass structural gates`);
    }
  }
  const steps = sourceRuns.map((source) => stepsPerCycle(source.result));
  if (new Set(steps).size !== steps.length) throw new Error("dt refinement steps/cycle must be unique");
}

function completeTraceSamples(
  result: NoAvpdFourChamberBenchResultV1,
  eventAnchorBeatIndex: number,
): readonly NoAvpdFourChamberBenchSampleV1[] {
  const anchorBeat = result.samples
    .filter((sample) => sample.beatIndex === eventAnchorBeatIndex)
    .slice()
    .sort((left, right) => left.phase01 - right.phase01);
  if (anchorBeat.length === 0 || Math.abs(anchorBeat[0]!.phase01) > 1e-12) {
    throw new Error("event-anchor beat does not begin at an exact phase-zero boundary");
  }
  const boundary = result.samples.find((sample) => (
    sample.beatIndex === eventAnchorBeatIndex + 1 && Math.abs(sample.phase01) <= 1e-12
  ));
  if (boundary === undefined) throw new Error("distinct event-anchor cycle boundary is not retained");
  return [...anchorBeat, { ...boundary, phase01: 1 }];
}

function packSample(sample: NoAvpdFourChamberBenchSampleV1): NoAvpdDtRefinementTracePointV1 {
  return [
    sample.phase01,
    sample.volumesMl.leftAtriumMl,
    sample.pressuresMmHg.la,
    sample.volumesMl.leftVentricleMl,
    sample.pressuresMmHg.lv,
    sample.volumesMl.rightAtriumMl,
    sample.pressuresMmHg.ra,
    sample.volumesMl.rightVentricleMl,
    sample.pressuresMmHg.rv,
    sample.flowsMlPerSec.mv,
    sample.flowsMlPerSec.tv,
    sample.flowsMlPerSec.pvf,
    sample.freeCalciumUm.la,
    sample.caTroponin01.la,
    sample.thinFilamentAvailability01.la,
    sample.wallReadback.la.seriesTensionKPa,
    sample.freeCalciumUm.ra,
    sample.caTroponin01.ra,
    sample.thinFilamentAvailability01.ra,
    sample.wallReadback.ra.seriesTensionKPa,
    sample.acceptedDynamicState.calciumDrivers.leftAtrium.riseState01,
    sample.acceptedDynamicState.calciumDrivers.leftAtrium.decayState01,
    sample.wallReadback.la.midpointFreeCalciumUm,
    sample.acceptedDynamicState.calciumDrivers.rightAtrium.riseState01,
    sample.acceptedDynamicState.calciumDrivers.rightAtrium.decayState01,
    sample.wallReadback.ra.midpointFreeCalciumUm,
  ];
}

function stepsPerCycle(result: NoAvpdFourChamberBenchResultV1): number {
  const ratio = result.runProtocol.cycleLengthSec / result.dtSec;
  const rounded = Math.round(ratio);
  if (Math.abs(ratio - rounded) > 1e-10) {
    throw new Error("dt refinement requires an integer number of steps per cycle");
  }
  return rounded;
}

function eventPoints(
  diagnostics: NoAvpdEventResolvedDiagnosticsV1,
): Readonly<Record<string, NoAvpdOperationalEventPointV1 | null>> {
  return {
    ...sideEventPoints("left", diagnostics.left),
    ...sideEventPoints("right", diagnostics.right),
  };
}

function eventTopologyKey(diagnostics: NoAvpdEventResolvedDiagnosticsV1): string {
  const point = (value: NoAvpdOperationalEventPointV1 | null) => ({
    present: value !== null,
    boundaryCensored: value?.boundaryCensored ?? null,
  });
  const side = (value: NoAvpdAtrialEventDiagnosticsV1 | null) => {
    if (value === null) return null;
    const transition = (pair: NoAvpdAtrialEventDiagnosticsV1["valveTransitions"]["modelHalfOpen"]
    ) => ({
      upwardCrossingCount: pair.upwardCrossingCount,
      downwardCrossingCount: pair.downwardCrossingCount,
      selectionStatus: pair.selectionStatus,
      opening: point(pair.opening),
      closure: point(pair.closure),
    });
    return {
      modelHalfOpen: transition(value.valveTransitions.modelHalfOpen),
      pressureCrossover: transition(value.valveTransitions.pressureCrossover),
      flowZero: transition(value.valveTransitions.flowZero),
      pressureVolumeEvents: Object.fromEntries(Object.entries(
        value.pressureVolumeEvents,
      ).map(([name, event]) => [name, point(event)])),
      inflowEvents: Object.fromEntries(Object.entries(value.inflowEvents)
        .filter(([name]) => name !== "eTailCrossingAtValveNumericalRegularizationScale")
        .map(([name, event]) => [name, point(event)])),
      inflowReadbackStatus: value.inflowSeparationReadback.status,
    };
  };
  return JSON.stringify({
    availability: diagnostics.availability,
    left: side(diagnostics.left),
    right: side(diagnostics.right),
  });
}

function numericalRegularizerTailTopologyKey(
  diagnostics: NoAvpdEventResolvedDiagnosticsV1,
): string {
  const topology = (side: NoAvpdAtrialEventDiagnosticsV1 | null) => {
    const point = side?.inflowEvents.eTailCrossingAtValveNumericalRegularizationScale
      ?? null;
    return {
      present: point !== null,
      boundaryCensored: point?.boundaryCensored ?? null,
    };
  };
  return JSON.stringify({ left: topology(diagnostics.left), right: topology(diagnostics.right) });
}

function sideEventPoints(
  prefix: "left" | "right",
  side: NoAvpdAtrialEventDiagnosticsV1 | null,
): Readonly<Record<string, NoAvpdOperationalEventPointV1 | null>> {
  if (side === null) return { [`${prefix}.unavailable`]: null };
  return {
    [`${prefix}.activationEvent`]: side.scheduledActivationEvent,
    [`${prefix}.calciumReleaseOnset`]: side.prescribedCalciumReleaseOnset,
    [`${prefix}.modelHalfOpen.opening`]: side.valveTransitions.modelHalfOpen.opening,
    [`${prefix}.modelHalfOpen.closure`]: side.valveTransitions.modelHalfOpen.closure,
    [`${prefix}.pressureCrossover.opening`]: side.valveTransitions.pressureCrossover.opening,
    [`${prefix}.pressureCrossover.closure`]: side.valveTransitions.pressureCrossover.closure,
    [`${prefix}.flowZero.opening`]: side.valveTransitions.flowZero.opening,
    [`${prefix}.flowZero.closure`]: side.valveTransitions.flowZero.closure,
    [`${prefix}.ePeak`]: side.inflowEvents.ePeak,
    [`${prefix}.eTailNumericalRegularizer`]:
      side.inflowEvents.eTailCrossingAtValveNumericalRegularizationScale,
    [`${prefix}.aStart`]: side.inflowEvents.aStartInterpeakMinimum,
    [`${prefix}.aFlowPeak`]: side.inflowEvents.aPeak,
    [`${prefix}.aPressurePeak`]: side.pressureVolumeEvents.aPeak,
    [`${prefix}.volumeMinimum`]: side.pressureVolumeEvents.volumeMinimum,
    [`${prefix}.xTrough`]: side.pressureVolumeEvents.xTrough,
    [`${prefix}.vPeak`]: side.pressureVolumeEvents.vPeak,
    [`${prefix}.yTrough`]: side.pressureVolumeEvents.yTrough,
  };
}

function successiveChangeRatios(
  coarsePair: NoAvpdDtRefinementPairV1,
  finePair: NoAvpdDtRefinementPairV1,
): NoAvpdDtRefinementDiagnosticsV1["successiveChangeRatioFinePairOverCoarsePair"] {
  return Object.fromEntries(CHANNEL_DEFINITIONS.map((definition) => {
    const coarse = coarsePair.channelDifferences[definition.column];
    const fine = finePair.channelDifferences[definition.column];
    return [definition.column, {
      maxAbsRatio: ratioOrNull(fine.maxAbsNative, coarse.maxAbsNative),
      rmsRatio: ratioOrNull(fine.rmsNative, coarse.rmsNative),
      interpretation: "successive-change-ratio-not-observed-order-or-error-estimate" as const,
    }];
  })) as NonNullable<
    NoAvpdDtRefinementDiagnosticsV1["successiveChangeRatioFinePairOverCoarsePair"]
  >;
}

function ratioOrNull(numerator: number, denominator: number): number | null {
  return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0
    ? numerator / denominator
    : null;
}

function finiteShift(finer: number | undefined, coarser: number | undefined): number | null {
  return finer !== undefined
    && coarser !== undefined
    && Number.isFinite(finer)
    && Number.isFinite(coarser)
    ? finer - coarser
    : null;
}

function shortestPhaseDifference(current: number, previous: number): number {
  return ((current - previous + 0.5) % 1 + 1) % 1 - 0.5;
}
