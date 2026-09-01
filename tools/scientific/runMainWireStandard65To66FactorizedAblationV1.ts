import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import {
  createMainWireProximalArterialRootInertanceResearchProfileV1,
  type MainWireProximalArterialRootInertanceResearchModeV1,
} from "@/engine/core/MainWireProximalArterialRootInertanceResearchProfileV1";
import {
  MAIN_WIRE_PULMONARY_CHARACTERISTIC_RESISTANCE_RESEARCH_PROFILE_V1,
} from "@/engine/core/MainWirePulmonaryCharacteristicResistanceResearchProfileV1";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  createMainWireIntegratedModelSelectedAorticOutflowFixtureV1,
  createMainWireIntegratedModelStandard65To66FactorizedResearchFixtureV1,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  type MainWireIntegratedModelStandard65To66FactorizedResearchAxesV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import type {
  MainWireStandard65To66VentricularMaterialByWallResearchV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  resolveMainWirePulmonaryValveLocalInertanceResearchProfileV1,
  type MainWirePulmonaryValveLocalInertanceResearchProfileIdV1,
} from "@/engine/valves/MainWirePulmonaryValveLocalInertanceResearchV1";

export const MAIN_WIRE_STANDARD65_TO_66_FACTORIZED_ABLATION_V1_ID =
  "main-wire-standard65-to-66-factorized-ablation-v1" as const;

const valveIds = Object.freeze(["MV", "AoV", "TV", "PV"] as const);
type ValveId = (typeof valveIds)[number];
type Trace = readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
type AxisLevel = "standard65" | "standard66";
type SignalId =
  | "LAP" | "LVP" | "AoNode" | "AoP"
  | "RAP" | "RVP" | "PAP" | "PVein"
  | "MV" | "AoV" | "TV" | "PV";

const requestedArmId = argument("--arm");
const rootAblation = rootAblationArgument();
const customAorticRootMode = optionalRootModeArgument("--aortic-root-mode");
const customPulmonaryRootMode = optionalRootModeArgument(
  "--pulmonary-root-mode",
);
const rootModes = resolveRootModes(
  rootAblation,
  customAorticRootMode,
  customPulmonaryRootMode,
);
const pulmonaryRootResistance = pulmonaryRootResistanceArgument();
const pulmonaryValveLocalInertance = pulmonaryValveLocalInertanceArgument();
const ventricularMaterialByWall = ventricularMaterialByWallArgument();
const researchContext = resolveResearchContext(
  optionalArgument("--context") ?? "baseline",
);
const rightHeartMechanicsScreen = resolveRightHeartMechanicsScreen(
  numberArgument("--rvfw-active-scale", 1),
  numberArgument("--rvfw-passive-scale", 1),
);
const rootQualifiedArmId =
  customAorticRootMode === null && customPulmonaryRootMode === null
    ? rootAblation === "source"
      ? requestedArmId
      : `${requestedArmId}-root-${rootAblation}`
    : `${requestedArmId}-aortic-root-${rootModes.aorticRootMode}`
      + `-pulmonary-root-${rootModes.pulmonaryRootMode}`;
const resistanceQualifiedArmId = pulmonaryRootResistance === "source"
  ? rootQualifiedArmId
  : `${rootQualifiedArmId}-pulmonary-r-${pulmonaryRootResistance}`;
const mechanicsQualifiedArmId = rightHeartMechanicsScreen.isBaseline
  ? resistanceQualifiedArmId
  : `${resistanceQualifiedArmId}-rvfw-active-${scaleId(
      rightHeartMechanicsScreen.activeTensionScale,
    )}-passive-${scaleId(rightHeartMechanicsScreen.passiveStiffnessScale)}`;
const localInertanceQualifiedArmId = pulmonaryValveLocalInertance === "off"
  ? mechanicsQualifiedArmId
  : `${mechanicsQualifiedArmId}-pv-local-${pulmonaryValveLocalInertance}`;
const wallMaterialQualifiedArmId = ventricularMaterialByWall === null
  ? localInertanceQualifiedArmId
  : `${localInertanceQualifiedArmId}-material-by-wall-`
    + `l${levelId(ventricularMaterialByWall.LVFW)}-`
    + `s${levelId(ventricularMaterialByWall.SEP)}-`
    + `r${levelId(ventricularMaterialByWall.RVFW)}`;
const armId = researchContext.contextId === "baseline"
  ? wallMaterialQualifiedArmId
  : `${wallMaterialQualifiedArmId}-context-${researchContext.contextId}`;
const nominalDtSec = numberArgument("--dt", 0.002);
const cycleCount = integerArgument("--cycles", 12);
const outputPath = path.resolve(argument(
  "--output",
  `artifacts/standard65-to-66-factorized/${armId}.json`,
));
const construction = resolveConstruction(
  requestedArmId,
  rootModes,
  pulmonaryRootResistance,
  pulmonaryValveLocalInertance,
  ventricularMaterialByWall,
);
const fixture = construction.kind === "official-standard65-reference"
  ? createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
      researchContext.hemodynamicResearchInputs,
      researchContext.ventricularContractilityScale,
      rightHeartMechanicsScreen.mechanismResearchInputs,
    )
  : construction.kind === "official-standard66-reference"
    ? createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(
        researchContext.hemodynamicResearchInputs,
        researchContext.ventricularContractilityScale,
        rightHeartMechanicsScreen.mechanismResearchInputs,
      )
    : createMainWireIntegratedModelStandard65To66FactorizedResearchFixtureV1(
        construction.axes,
        researchContext.hemodynamicResearchInputs,
        researchContext.ventricularContractilityScale,
        rightHeartMechanicsScreen.mechanismResearchInputs,
        construction.proximalRootResearchProfile ?? undefined,
        construction.pulmonaryCharacteristicResistanceResearchProfile
          ?? undefined,
        construction.pulmonaryValveLocalInertanceResearchProfile ?? undefined,
        construction.ventricularMaterialByWallResearch ?? undefined,
      );
const cycleFixture = fixture as unknown as Parameters<
  typeof runMainWireIntegratedModelRegularSinusAllOffCycleV3
>[0];
let accepted = cycleFixture.cold.acceptedState;
let pulmonaryValveLocalInertanceAcceptedFlowMlPerSec =
  construction.pulmonaryValveLocalInertanceResearchProfile === null
    ? undefined
    : 0;
const retainedCycleSummaries: ReturnType<typeof summarizeCycle>[] = [];
for (let cycleIndex = 1; cycleIndex <= cycleCount; cycleIndex += 1) {
  let run: ReturnType<
    typeof runMainWireIntegratedModelRegularSinusAllOffCycleV3
  >;
  try {
    run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      cycleFixture,
      accepted,
      cycleIndex,
      nominalDtSec,
      pulmonaryValveLocalInertanceAcceptedFlowMlPerSec,
    );
  } catch (error) {
    const window = accepted.coronary.coronaryAutoregulation;
    throw new Error(
      `${armId} failed at cycle ${cycleIndex}; acceptedTimeSec=`
        + `${accepted.acceptedTimeSec}; windowIndex=${window.windowIndex}; `
        + `windowStartAcceptedTimeSec=${window.windowStartAcceptedTimeSec}; `
        + `acceptedDurationSec=${window.acceptedDurationSec}; `
        + `acceptedStepCount=${window.acceptedStepCount}`,
      { cause: error },
    );
  }
  accepted = run.terminalAcceptedState;
  pulmonaryValveLocalInertanceAcceptedFlowMlPerSec =
    run.pulmonaryValveLocalInertanceTerminalAcceptedFlowMlPerSec;
  if (cycleIndex >= cycleCount - 2) {
    retainedCycleSummaries.push(summarizeCycle(
      run.traceSamples,
      construction.selectedAorticOutflow,
    ));
  }
}
const terminal = retainedCycleSummaries.at(-1)!;
const penultimate = retainedCycleSummaries.at(-2) ?? null;
const report = Object.freeze({
  artifactSchemaVersion: 2 as const,
  experimentId: MAIN_WIRE_STANDARD65_TO_66_FACTORIZED_ABLATION_V1_ID,
  armId,
  construction,
  protocol: Object.freeze({
    nominalDtSec,
    cycleCount,
    independentColdStart: true as const,
    fixedHorizonScreen: true as const,
    pulmonaryValveLocalInertanceAcceptedStateOwner:
      construction.pulmonaryValveLocalInertanceResearchProfile === null
        ? null
        : "research-runner-external-atomic-promotion" as const,
    pulmonaryValveLocalInertanceInitialFlowMlPerSec:
      construction.pulmonaryValveLocalInertanceResearchProfile === null
        ? null
        : 0,
    pulmonaryValveLocalInertanceTerminalFlowMlPerSec:
      pulmonaryValveLocalInertanceAcceptedFlowMlPerSec ?? null,
    periodicityClaimed: false as const,
    forwardGradientDomain: "strictly-positive-flow" as const,
    eventThreshold:
      "max-of-1-mL-per-sec-and-1-percent-of-valve-cycle-peak-forward-flow" as const,
    cyclicValveEpisodeSegmentation: true as const,
    acceptedEndpointQuadrature: true as const,
    smoothingApplied: false as const,
    parameterSearchOrFitting: false as const,
    researchContext,
    rightHeartMechanicsScreen,
  }),
  terminal,
  settlingReadback: penultimate === null
    ? null
    : keyMetricChange(penultimate, terminal),
  lastThreeCycleKeyMetrics: Object.freeze(retainedCycleSummaries.map(
    keyMetrics,
  )),
  interpretationBoundary: Object.freeze({
    exactModelChangedByAnalysis: false as const,
    canonicalAcceptedStateOrCheckpointChangedByPvLocalInertance: false as const,
    researchFixtureOnly: construction.kind === "factorized-research",
    localAorticGradientUsesRecoveredConstitutivePortWhenSelected: true as const,
    rawLvAoNodeGradientAlsoRetained: true as const,
    teiTimingUsesThresholdedValveFlowTransitions: true as const,
    pressureAndFlowMorphologyUsesRawAcceptedEndpoints: true as const,
    normalizedEjectionContourIsDescriptiveWithoutClinicalThreshold:
      true as const,
    morphologyPassFailThresholdApplied: false as const,
    clinicalValidationClaimed: false as const,
  }),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  armId,
  outputPath,
  keyMetrics: keyMetrics(terminal),
  settlingReadback: report.settlingReadback,
})}\n`);

function summarizeCycle(trace: Trace, selectedAorticOutflow: boolean) {
  if (trace.length < 3) throw new Error("terminal cycle trace is too short");
  const cycleDurationSec = trace.reduce(
    (sum, sample) => sum + sample.acceptedDtSec,
    0,
  );
  const valve = Object.freeze(Object.fromEntries(valveIds.map((valveId) => [
    valveId,
    summarizeValve(trace, valveId, selectedAorticOutflow),
  ])) as Record<ValveId, ReturnType<typeof summarizeValve>>);
  const leftTiming = ventricularTiming(trace, "MV", "AoV");
  const rightTiming = ventricularTiming(trace, "TV", "PV");
  const aorticEpisode = primaryForwardEpisode(trace, "AoV");
  const pulmonaryEpisode = primaryForwardEpisode(trace, "PV");
  return Object.freeze({
    cycleIndex: trace[0]!.cycleIndex,
    startTimeSec: trace[0]!.acceptedTimeSec - trace[0]!.acceptedDtSec,
    endTimeSec: trace.at(-1)!.acceptedTimeSec,
    cycleDurationSec,
    sampleCount: trace.length,
    chamber: Object.freeze({
      LV: chamberSummary(trace, "LV"),
      RV: chamberSummary(trace, "RV"),
    }),
    pressure: Object.freeze({
      LAP: signalCycleSummary(trace, "LAP", selectedAorticOutflow),
      LVP: signalCycleSummary(trace, "LVP", selectedAorticOutflow),
      AoNode: signalCycleSummary(trace, "AoNode", selectedAorticOutflow),
      AoP: signalCycleSummary(trace, "AoP", selectedAorticOutflow),
      RAP: signalCycleSummary(trace, "RAP", selectedAorticOutflow),
      RVP: signalCycleSummary(trace, "RVP", selectedAorticOutflow),
      PAP: signalCycleSummary(trace, "PAP", selectedAorticOutflow),
      PVein: signalCycleSummary(trace, "PVein", selectedAorticOutflow),
    }),
    pressureRateMmHgPerSec: Object.freeze({
      LV: pressureRateSummary(trace, "LVP", selectedAorticOutflow),
      RV: pressureRateSummary(trace, "RVP", selectedAorticOutflow),
    }),
    valve,
    ventricularTiming: Object.freeze({
      LV: leftTiming,
      RV: rightTiming,
    }),
    inflowWaves: Object.freeze({
      MV: inflowWaveSummary(trace, "MV", aorticEpisode),
      TV: inflowWaveSummary(trace, "TV", pulmonaryEpisode),
    }),
    morphology: Object.freeze({
      aorticEjection: ejectionMorphology(
        trace,
        aorticEpisode,
        ["AoV", "LVP", "AoP", "AoNode"],
        selectedAorticOutflow,
      ),
      pulmonaryEjection: ejectionMorphology(
        trace,
        pulmonaryEpisode,
        ["PV", "RVP", "PAP"],
        selectedAorticOutflow,
      ),
      pulmonaryArteryDiastolicRebound: pulmonaryArteryRebound(
        trace,
        pulmonaryEpisode,
        selectedAorticOutflow,
      ),
    }),
    calcium: Object.freeze({
      LVFW: finiteRange(trace.map((sample) =>
        sample.freeCalciumUMByWall.LVFW)),
      SEP: finiteRange(trace.map((sample) =>
        sample.freeCalciumUMByWall.SEP)),
      RVFW: finiteRange(trace.map((sample) =>
        sample.freeCalciumUMByWall.RVFW)),
    }),
  });
}

function summarizeValve(
  trace: Trace,
  valveId: ValveId,
  selectedAorticOutflow: boolean,
) {
  const flows = trace.map((sample) => sample.valveFlowMlPerSec[valveId]);
  const maximumForwardFlowMlPerSec = Math.max(...flows);
  const thresholdMlPerSec = Math.max(1, 0.01 * maximumForwardFlowMlPerSec);
  const thresholdMask = flows.map((flow) => flow > thresholdMlPerSec);
  let forwardVolumeMl = 0;
  let reverseVolumeMl = 0;
  let forwardFlowTimeSec = 0;
  let gradientTimeIntegralMmHgSec = 0;
  let gradientFlowIntegralMmHgMl = 0;
  let peakForwardGradientMmHg = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < trace.length; index += 1) {
    const sample = trace[index]!;
    const flow = flows[index]!;
    forwardVolumeMl += Math.max(0, flow) * sample.acceptedDtSec;
    reverseVolumeMl += Math.max(0, -flow) * sample.acceptedDtSec;
    if (flow > 0) {
      const gradient = valveGradient(
        sample,
        valveId,
        selectedAorticOutflow,
      );
      forwardFlowTimeSec += sample.acceptedDtSec;
      gradientTimeIntegralMmHgSec += gradient * sample.acceptedDtSec;
      gradientFlowIntegralMmHgMl += gradient * flow * sample.acceptedDtSec;
      peakForwardGradientMmHg = Math.max(peakForwardGradientMmHg, gradient);
    }
  }
  const primary = primaryForwardEpisode(trace, valveId);
  const rawLvAo = valveId === "AoV"
    ? forwardGradientSummary(trace, "raw-lv-minus-ao-node")
    : null;
  return Object.freeze({
    maximumForwardFlowMlPerSec,
    maximumReverseFlowMagnitudeMlPerSec: Math.max(0, ...flows.map((flow) => -flow)),
    forwardVolumeMl,
    reverseVolumeMl,
    netVolumeMl: forwardVolumeMl - reverseVolumeMl,
    forwardFlowTimeSec,
    forwardFlowTimeMeanGradientMmHg:
      gradientTimeIntegralMmHgSec / forwardFlowTimeSec,
    forwardFlowWeightedMeanGradientMmHg:
      gradientFlowIntegralMmHgMl / forwardVolumeMl,
    forwardPressureTimeIntegralMmHgSec: gradientTimeIntegralMmHgSec,
    peakForwardGradientMmHg,
    thresholdMlPerSec,
    thresholdEpisodeCount: cyclicTrueRunCount(thresholdMask),
    thresholdEpisodeDurationSec: integrateIndices(
      trace,
      thresholdMask.flatMap((active, index) => active ? [index] : []),
    ),
    primaryThresholdEpisode: Object.freeze({
      openingTimeSec: trace[primary.start]!.acceptedTimeSec,
      closingTimeSec: trace[primary.end]!.acceptedTimeSec,
      durationSec: integrateCyclicDt(trace, primary.start, primary.end),
    }),
    rawLvAoNodeForwardGradient: rawLvAo,
  });
}

function forwardGradientSummary(
  trace: Trace,
  kind: "raw-lv-minus-ao-node",
) {
  let duration = 0;
  let integral = 0;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const sample of trace) {
    if (sample.valveFlowMlPerSec.AoV <= 0) continue;
    const gradient = sample.absolutePressureMmHg.LV
      - sample.absolutePressureMmHg.Ao;
    duration += sample.acceptedDtSec;
    integral += gradient * sample.acceptedDtSec;
    maximum = Math.max(maximum, gradient);
  }
  return Object.freeze({
    kind,
    meanMmHg: integral / duration,
    peakMmHg: maximum,
    pressureTimeIntegralMmHgSec: integral,
  });
}

function chamberSummary(trace: Trace, chamber: "LV" | "RV") {
  const volumes = trace.map((sample) => sample.chamberVolumeMl[chamber]);
  const endDiastolicVolumeMl = Math.max(...volumes);
  const endSystolicVolumeMl = Math.min(...volumes);
  const strokeVolumeMl = endDiastolicVolumeMl - endSystolicVolumeMl;
  const durationSec = trace.reduce((sum, sample) =>
    sum + sample.acceptedDtSec, 0);
  return Object.freeze({
    endDiastolicVolumeMl,
    endSystolicVolumeMl,
    strokeVolumeMl,
    ejectionFraction01: strokeVolumeMl / endDiastolicVolumeMl,
    cardiacOutputLPerMin: strokeVolumeMl * (60 / durationSec) / 1000,
  });
}

function ventricularTiming(
  trace: Trace,
  inletValve: "MV" | "TV",
  outletValve: "AoV" | "PV",
) {
  const outlet = primaryForwardEpisode(trace, outletValve);
  const inletPeak = Math.max(...trace.map((sample) =>
    sample.valveFlowMlPerSec[inletValve]));
  const inletThreshold = Math.max(1, 0.01 * inletPeak);
  const inletOpen = trace.map((sample) =>
    sample.valveFlowMlPerSec[inletValve] > inletThreshold);
  const inletClosure = previousTransitionIndex(
    inletOpen,
    outlet.start,
    true,
    false,
  );
  const outletClosure = (outlet.end + 1) % trace.length;
  const inletOpening = nextTransitionIndex(
    inletOpen,
    outletClosure,
    false,
    true,
  );
  const cycleDurationSec = trace.reduce((sum, sample) =>
    sum + sample.acceptedDtSec, 0);
  const ivctSec = cyclicTimeDelta(
    phaseTimeSec(trace, inletClosure, cycleDurationSec),
    phaseTimeSec(trace, outlet.start, cycleDurationSec),
    cycleDurationSec,
  );
  const ejectionTimeSec = integrateCyclicDt(
    trace,
    outlet.start,
    outlet.end,
  );
  const ivrtSec = cyclicTimeDelta(
    phaseTimeSec(trace, outletClosure, cycleDurationSec),
    phaseTimeSec(trace, inletOpening, cycleDurationSec),
    cycleDurationSec,
  );
  return Object.freeze({
    isovolumicContractionTimeSec: ivctSec,
    ejectionTimeSec,
    isovolumicRelaxationTimeSec: ivrtSec,
    teiIndex: (ivctSec + ivrtSec) / ejectionTimeSec,
    thresholdEventEvidence: Object.freeze({
      inletThresholdMlPerSec: inletThreshold,
      outletThresholdMlPerSec: outlet.thresholdMlPerSec,
      inletClosureTimeSec: phaseTimeSec(trace, inletClosure, cycleDurationSec),
      outletOpeningTimeSec: phaseTimeSec(trace, outlet.start, cycleDurationSec),
      outletClosureTimeSec: phaseTimeSec(trace, outletClosure, cycleDurationSec),
      inletOpeningTimeSec: phaseTimeSec(trace, inletOpening, cycleDurationSec),
    }),
  });
}

function inflowWaveSummary(
  trace: Trace,
  inletValve: "MV" | "TV",
  outletEpisode: ReturnType<typeof primaryForwardEpisode>,
) {
  const outletClosure = (outletEpisode.end + 1) % trace.length;
  const flow = (index: number) =>
    trace[index]!.valveFlowMlPerSec[inletValve];
  const peak = Math.max(...trace.map((sample) =>
    sample.valveFlowMlPerSec[inletValve]));
  const threshold = Math.max(1, 0.01 * peak);
  const mask = trace.map((sample) =>
    sample.valveFlowMlPerSec[inletValve] > threshold);
  const opening = nextTransitionIndex(mask, outletClosure, false, true);
  const closure = nextTransitionIndex(mask, opening, true, false);
  const window = cyclicIndices(trace.length, opening, closure);
  const peaks = localExtremaIndicesCircularWindow(flow, window, "maximum")
    .filter((index) => flow(index) > threshold);
  const cycleDurationSec = trace.reduce((sum, sample) =>
    sum + sample.acceptedDtSec, 0);
  const detectedPeaks = Object.freeze(peaks.map((index, peakOffset) => {
    const windowOffset = window.indexOf(index);
    const leftBoundaryOffset = peakOffset === 0
      ? 0
      : window.indexOf(peaks[peakOffset - 1]!);
    const rightBoundaryOffset = peakOffset === peaks.length - 1
      ? window.length - 1
      : window.indexOf(peaks[peakOffset + 1]!);
    const leftMinimum = Math.min(...window
      .slice(leftBoundaryOffset, windowOffset + 1).map(flow));
    const rightMinimum = Math.min(...window
      .slice(windowOffset, rightBoundaryOffset + 1).map(flow));
    const prominenceMlPerSec = flow(index)
      - Math.max(leftMinimum, rightMinimum);
    return Object.freeze({
      timeSec: trace[index]!.acceptedTimeSec,
      phaseTimeSec: phaseTimeSec(trace, index, cycleDurationSec),
      flowMlPerSec: flow(index),
      prominenceMlPerSec,
      prominenceFractionOfDominantInflowPeak: prominenceMlPerSec / peak,
    });
  }));
  if (peaks.length < 2) {
    return Object.freeze({
      status: "fused-or-unresolved" as const,
      detectedPeakCount: peaks.length,
      detectedPeaks,
      peakEToA: null,
      forwardVolumeEToA: null,
      observedEPeakToInterwaveTroughSec: null,
      vtiRatioClaimed: false as const,
    });
  }
  const ePeak = peaks[0]!;
  const aPeak = peaks.at(-1)!;
  const between = cyclicIndices(trace.length, ePeak, aPeak);
  const trough = between.reduce((best, index) =>
    flow(index) < flow(best) ? index : best, between[0]!);
  const eIndices = cyclicIndices(trace.length, opening, trough);
  const aIndices = cyclicIndices(trace.length, trough, closure);
  const eVolume = integratePositiveIndices(trace, inletValve, eIndices);
  const aVolume = integratePositiveIndices(trace, inletValve, aIndices);
  return Object.freeze({
    status: "separated" as const,
    detectedPeakCount: peaks.length,
    detectedPeaks,
    peakEFlowMlPerSec: flow(ePeak),
    peakAFlowMlPerSec: flow(aPeak),
    peakEToA: flow(ePeak) / flow(aPeak),
    forwardVolumeEMl: eVolume,
    forwardVolumeAMl: aVolume,
    forwardVolumeEToA: eVolume / aVolume,
    interwaveTroughFlowMlPerSec: flow(trough),
    observedEPeakToInterwaveTroughSec: cyclicTimeDelta(
      phaseTimeSec(trace, ePeak, cycleDurationSec),
      phaseTimeSec(trace, trough, cycleDurationSec),
      cycleDurationSec,
    ),
    vtiRatioClaimed: false as const,
  });
}

function ejectionMorphology(
  trace: Trace,
  episode: ReturnType<typeof primaryForwardEpisode>,
  signalIds: readonly SignalId[],
  selectedAorticOutflow: boolean,
) {
  return Object.freeze(Object.fromEntries(signalIds.map((signalId) => [
    signalId,
    segmentMorphology(
      trace,
      signalId,
      episode.start,
      episode.end,
      selectedAorticOutflow,
    ),
  ])));
}

function pulmonaryArteryRebound(
  trace: Trace,
  pulmonaryEpisode: ReturnType<typeof primaryForwardEpisode>,
  selectedAorticOutflow: boolean,
) {
  const start = (pulmonaryEpisode.end + 1) % trace.length;
  const end = (pulmonaryEpisode.start - 1 + trace.length) % trace.length;
  const indices = cyclicIndicesInclusive(trace.length, start, end);
  const values = indices.map((index) =>
    signal(trace[index]!, "PAP", selectedAorticOutflow));
  const firstMinimumOffset = firstLocalExtremum(values, "minimum");
  if (firstMinimumOffset === null) {
    return Object.freeze({
      status: "no-postclosure-minimum" as const,
      reboundRiseMmHg: null,
    });
  }
  const laterValues = values.slice(firstMinimumOffset + 1);
  const maximumOffset = firstLocalExtremum(laterValues, "maximum");
  if (maximumOffset === null) {
    return Object.freeze({
      status: "no-diastolic-rebound-maximum" as const,
      postClosureMinimumMmHg: values[firstMinimumOffset]!,
      reboundRiseMmHg: 0,
    });
  }
  const absoluteMaximumOffset = firstMinimumOffset + 1 + maximumOffset;
  return Object.freeze({
    status: "rebound-observed" as const,
    postClosureMinimumTimeSec:
      trace[indices[firstMinimumOffset]!]!.acceptedTimeSec,
    postClosureMinimumMmHg: values[firstMinimumOffset]!,
    reboundMaximumTimeSec:
      trace[indices[absoluteMaximumOffset]!]!.acceptedTimeSec,
    reboundMaximumMmHg: values[absoluteMaximumOffset]!,
    reboundRiseMmHg:
      values[absoluteMaximumOffset]! - values[firstMinimumOffset]!,
  });
}

function signalCycleSummary(
  trace: Trace,
  signalId: SignalId,
  selectedAorticOutflow: boolean,
) {
  const values = trace.map((sample) =>
    signal(sample, signalId, selectedAorticOutflow));
  const duration = trace.reduce((sum, sample) =>
    sum + sample.acceptedDtSec, 0);
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
    timeWeightedMean: trace.reduce((sum, sample, index) =>
      sum + values[index]! * sample.acceptedDtSec, 0) / duration,
  });
}

function pressureRateSummary(
  trace: Trace,
  signalId: "LVP" | "RVP",
  selectedAorticOutflow: boolean,
) {
  const rates: number[] = [];
  for (let index = 1; index < trace.length; index += 1) {
    const current = trace[index]!;
    const previous = trace[index - 1]!;
    rates.push(
      (signal(current, signalId, selectedAorticOutflow)
        - signal(previous, signalId, selectedAorticOutflow))
      / current.acceptedDtSec,
    );
  }
  return Object.freeze({ maximum: Math.max(...rates), minimum: Math.min(...rates) });
}

function segmentMorphology(
  trace: Trace,
  signalId: SignalId,
  start: number,
  end: number,
  selectedAorticOutflow: boolean,
) {
  const indices = cyclicIndicesInclusive(trace.length, start, end);
  const values = indices.map((index) =>
    signal(trace[index]!, signalId, selectedAorticOutflow));
  const extrema = localExtrema(values).map((entry) => Object.freeze({
    ...entry,
    timeSec: trace[indices[entry.offset]!]!.acceptedTimeSec,
  }));
  const contour = normalizedEjectionContour(trace, indices, values);
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
    extrema: Object.freeze(extrema),
    normalizedContour: contour,
    largestPostPeakRebound: largestPostPeakRebound(values, trace, indices),
  });
}

function normalizedEjectionContour(
  trace: Trace,
  indices: readonly number[],
  values: readonly number[],
) {
  const durationSec = integrateIndices(trace, indices);
  const phaseAtOffset = indices.map((_, offset) => {
    const elapsedBeforeSec = integrateIndices(trace, indices.slice(0, offset));
    const sampleMidpointSec = trace[indices[offset]!]!.acceptedDtSec / 2;
    return Math.min(1, (elapsedBeforeSec + sampleMidpointSec) / durationSec);
  });
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum;
  const peakOffset = values.indexOf(maximum);
  const centralOffsets = phaseAtOffset.flatMap((phase, offset) =>
    phase >= 0.25 && phase <= 0.75 ? [offset] : []);
  const centralValues = centralOffsets.map((offset) => values[offset]!);
  const topNinetyThreshold = minimum + 0.9 * range;
  const topNinetyDurationSec = indices.reduce((sum, index, offset) =>
    sum + (values[offset]! >= topNinetyThreshold
      ? trace[index]!.acceptedDtSec
      : 0), 0);
  const phaseTargets = Object.freeze([0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]);
  return Object.freeze({
    durationSec,
    range,
    peakPhase01: phaseAtOffset[peakOffset]!,
    centralHalfRange: centralValues.length === 0
      ? null
      : Math.max(...centralValues) - Math.min(...centralValues),
    centralHalfRangeFractionOfFullRange: centralValues.length === 0 || range === 0
      ? null
      : (Math.max(...centralValues) - Math.min(...centralValues)) / range,
    topNinetyPercentRangeDurationFraction:
      topNinetyDurationSec / durationSec,
    phaseSamples: Object.freeze(phaseTargets.map((phase01) => Object.freeze({
      phase01,
      value: linearlyInterpolateByPhase(phaseAtOffset, values, phase01),
    }))),
  });
}

function linearlyInterpolateByPhase(
  phases: readonly number[],
  values: readonly number[],
  target: number,
) {
  if (target <= phases[0]!) return values[0]!;
  if (target >= phases.at(-1)!) return values.at(-1)!;
  const right = phases.findIndex((phase) => phase >= target);
  const left = right - 1;
  const span = phases[right]! - phases[left]!;
  const fraction = span === 0 ? 0 : (target - phases[left]!) / span;
  return values[left]! + fraction * (values[right]! - values[left]!);
}

function largestPostPeakRebound(
  values: readonly number[],
  trace: Trace,
  indices: readonly number[],
) {
  const globalPeak = values.indexOf(Math.max(...values));
  let minimumOffset = globalPeak;
  let best: Readonly<{
    troughTimeSec: number;
    troughValue: number;
    reboundPeakTimeSec: number;
    reboundPeakValue: number;
    rise: number;
  }> | null = null;
  for (let offset = globalPeak + 1; offset < values.length; offset += 1) {
    if (values[offset]! < values[minimumOffset]!) minimumOffset = offset;
    const rise = values[offset]! - values[minimumOffset]!;
    if (best === null || rise > best.rise) {
      best = Object.freeze({
        troughTimeSec: trace[indices[minimumOffset]!]!.acceptedTimeSec,
        troughValue: values[minimumOffset]!,
        reboundPeakTimeSec: trace[indices[offset]!]!.acceptedTimeSec,
        reboundPeakValue: values[offset]!,
        rise,
      });
    }
  }
  return best;
}

function localExtrema(values: readonly number[]) {
  const result: Array<Readonly<{
    kind: "maximum" | "minimum";
    offset: number;
    value: number;
  }>> = [];
  for (let index = 1; index < values.length - 1; index += 1) {
    if (values[index]! > values[index - 1]!
      && values[index]! >= values[index + 1]!) {
      result.push(Object.freeze({
        kind: "maximum" as const,
        offset: index,
        value: values[index]!,
      }));
    }
    if (values[index]! < values[index - 1]!
      && values[index]! <= values[index + 1]!) {
      result.push(Object.freeze({
        kind: "minimum" as const,
        offset: index,
        value: values[index]!,
      }));
    }
  }
  return result;
}

function firstLocalExtremum(
  values: readonly number[],
  kind: "maximum" | "minimum",
): number | null {
  for (let index = 1; index < values.length - 1; index += 1) {
    if (kind === "maximum"
      && values[index]! > values[index - 1]!
      && values[index]! >= values[index + 1]!) return index;
    if (kind === "minimum"
      && values[index]! < values[index - 1]!
      && values[index]! <= values[index + 1]!) return index;
  }
  return null;
}

function primaryForwardEpisode(trace: Trace, valveId: ValveId) {
  const peak = Math.max(...trace.map((sample) =>
    sample.valveFlowMlPerSec[valveId]));
  const thresholdMlPerSec = Math.max(1, 0.01 * peak);
  const runs = cyclicTrueRuns(trace.map((sample) =>
    sample.valveFlowMlPerSec[valveId] > thresholdMlPerSec));
  const run = runs.reduce<readonly [number, number] | null>((best, candidate) => {
    if (best === null) return candidate;
    return integrateCyclicDt(trace, candidate[0], candidate[1])
        > integrateCyclicDt(trace, best[0], best[1])
      ? candidate
      : best;
  }, null);
  if (run === null) throw new Error(`${valveId} has no threshold-forward episode`);
  return Object.freeze({
    start: run[0],
    end: run[1],
    thresholdMlPerSec,
  });
}

function cyclicTrueRuns(mask: readonly boolean[]) {
  if (mask.length === 0 || mask.every((active) => !active)) return [];
  if (mask.every(Boolean)) {
    return [Object.freeze([0, mask.length - 1] as const)];
  }
  const starts: number[] = [];
  for (let index = 0; index < mask.length; index += 1) {
    const previous = mask[(index - 1 + mask.length) % mask.length]!;
    if (!previous && mask[index]) starts.push(index);
  }
  return starts.map((start) => {
    let end = start;
    while (mask[(end + 1) % mask.length]) {
      end = (end + 1) % mask.length;
    }
    return Object.freeze([start, end] as const);
  });
}

function valveGradient(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  valveId: ValveId,
  selectedAorticOutflow: boolean,
): number {
  switch (valveId) {
    case "MV":
      return sample.absolutePressureMmHg.LA - sample.absolutePressureMmHg.LV;
    case "AoV":
      return sample.absolutePressureMmHg.LV
        - aorticProximalPressure(sample, selectedAorticOutflow);
    case "TV":
      return sample.absolutePressureMmHg.RA - sample.absolutePressureMmHg.RV;
    case "PV":
      return sample.absolutePressureMmHg.RV - sample.absolutePressureMmHg.PA;
  }
}

function signal(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  signalId: SignalId,
  selectedAorticOutflow: boolean,
): number {
  switch (signalId) {
    case "LAP": return sample.absolutePressureMmHg.LA;
    case "LVP": return sample.absolutePressureMmHg.LV;
    case "AoNode": return sample.absolutePressureMmHg.Ao;
    case "AoP": return aorticProximalPressure(sample, selectedAorticOutflow);
    case "RAP": return sample.absolutePressureMmHg.RA;
    case "RVP": return sample.absolutePressureMmHg.RV;
    case "PAP": return sample.absolutePressureMmHg.PA;
    case "PVein": return sample.absolutePressureMmHg.PVein;
    case "MV": return sample.valveFlowMlPerSec.MV;
    case "AoV": return sample.valveFlowMlPerSec.AoV;
    case "TV": return sample.valveFlowMlPerSec.TV;
    case "PV": return sample.valveFlowMlPerSec.PV;
  }
}

function aorticProximalPressure(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  selectedAorticOutflow: boolean,
): number {
  return sample.absolutePressureMmHg.Ao
    + (selectedAorticOutflow
      ? MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1
          .characteristicImpedanceResistanceMmHgSecPerMl
        * sample.valveFlowMlPerSec.AoV
      : 0);
}

function cyclicTrueRunCount(mask: readonly boolean[]): number {
  if (mask.every(Boolean)) return 1;
  let count = 0;
  for (let index = 0; index < mask.length; index += 1) {
    const previous = mask[(index - 1 + mask.length) % mask.length]!;
    if (!previous && mask[index]) count += 1;
  }
  return count;
}

function previousTransitionIndex(
  mask: readonly boolean[],
  beforeIndex: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 0; offset < mask.length; offset += 1) {
    const index = (beforeIndex - offset + mask.length) % mask.length;
    const previous = (index - 1 + mask.length) % mask.length;
    if (mask[previous] === from && mask[index] === to) return index;
  }
  throw new Error("required preceding valve transition was not observed");
}

function nextTransitionIndex(
  mask: readonly boolean[],
  fromIndex: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 0; offset < mask.length; offset += 1) {
    const index = (fromIndex + offset) % mask.length;
    const previous = (index - 1 + mask.length) % mask.length;
    if (mask[previous] === from && mask[index] === to) return index;
  }
  throw new Error("required following valve transition was not observed");
}

function cyclicIndices(length: number, start: number, endExclusive: number) {
  const result: number[] = [];
  for (let index = start; index !== endExclusive; index = (index + 1) % length) {
    result.push(index);
    if (result.length > length) throw new Error("cyclic interval did not close");
  }
  return result;
}

function cyclicIndicesInclusive(length: number, start: number, end: number) {
  const result = cyclicIndices(length, start, (end + 1) % length);
  return result;
}

function localExtremaIndicesCircularWindow(
  value: (index: number) => number,
  window: readonly number[],
  kind: "maximum" | "minimum",
) {
  const result: number[] = [];
  for (let offset = 1; offset < window.length - 1; offset += 1) {
    const previous = value(window[offset - 1]!);
    const current = value(window[offset]!);
    const next = value(window[offset + 1]!);
    if (kind === "maximum" && current > previous && current >= next) {
      result.push(window[offset]!);
    }
    if (kind === "minimum" && current < previous && current <= next) {
      result.push(window[offset]!);
    }
  }
  return result;
}

function integrateCyclicDt(trace: Trace, start: number, end: number): number {
  return integrateIndices(
    trace,
    cyclicIndicesInclusive(trace.length, start, end),
  );
}

function integrateIndices(trace: Trace, indices: readonly number[]): number {
  return indices.reduce((sum, index) => sum + trace[index]!.acceptedDtSec, 0);
}

function integratePositiveIndices(
  trace: Trace,
  valveId: "MV" | "TV",
  indices: readonly number[],
) {
  return indices.reduce((sum, index) =>
    sum + Math.max(0, trace[index]!.valveFlowMlPerSec[valveId])
      * trace[index]!.acceptedDtSec, 0);
}

function phaseTimeSec(trace: Trace, index: number, cycleDurationSec: number) {
  return trace[index]!.cyclePhase01 * cycleDurationSec;
}

function cyclicTimeDelta(from: number, to: number, cycleDurationSec: number) {
  const delta = to - from;
  return delta >= 0 ? delta : delta + cycleDurationSec;
}

function finiteRange(values: readonly number[]) {
  return Object.freeze({ minimum: Math.min(...values), maximum: Math.max(...values) });
}

function keyMetrics(summary: ReturnType<typeof summarizeCycle>) {
  return Object.freeze({
    cycleIndex: summary.cycleIndex,
    lvStrokeVolumeMl: summary.chamber.LV.strokeVolumeMl,
    rvStrokeVolumeMl: summary.chamber.RV.strokeVolumeMl,
    meanAoPMmHg: summary.pressure.AoP.timeWeightedMean,
    meanPAPMmHg: summary.pressure.PAP.timeWeightedMean,
    avEjectionTimeSec: summary.ventricularTiming.LV.ejectionTimeSec,
    pvEjectionTimeSec: summary.ventricularTiming.RV.ejectionTimeSec,
    avMeanLocalGradientMmHg:
      summary.valve.AoV.forwardFlowTimeMeanGradientMmHg,
    avMeanRawLvAoGradientMmHg:
      summary.valve.AoV.rawLvAoNodeForwardGradient!.meanMmHg,
    lvTeiIndex: summary.ventricularTiming.LV.teiIndex,
    rvTeiIndex: summary.ventricularTiming.RV.teiIndex,
    lvMaximumDpDtMmHgPerSec: summary.pressureRateMmHgPerSec.LV.maximum,
    lvMinimumDpDtMmHgPerSec: summary.pressureRateMmHgPerSec.LV.minimum,
    rvMaximumDpDtMmHgPerSec: summary.pressureRateMmHgPerSec.RV.maximum,
    rvMinimumDpDtMmHgPerSec: summary.pressureRateMmHgPerSec.RV.minimum,
    lvpEjectionReboundMmHg:
      summary.morphology.aorticEjection.LVP.largestPostPeakRebound?.rise ?? 0,
    lvpEjectionCentralHalfRangeFraction:
      summary.morphology.aorticEjection.LVP.normalizedContour
        .centralHalfRangeFractionOfFullRange,
    lvpEjectionTopNinetyDurationFraction:
      summary.morphology.aorticEjection.LVP.normalizedContour
        .topNinetyPercentRangeDurationFraction,
    lvpEjectionPeakPhase01:
      summary.morphology.aorticEjection.LVP.normalizedContour.peakPhase01,
    aopEjectionReboundMmHg:
      summary.morphology.aorticEjection.AoP.largestPostPeakRebound?.rise ?? 0,
    pvFlowEjectionReboundMlPerSec:
      summary.morphology.pulmonaryEjection.PV.largestPostPeakRebound?.rise ?? 0,
    papDiastolicReboundMmHg:
      summary.morphology.pulmonaryArteryDiastolicRebound.reboundRiseMmHg,
  });
}

function keyMetricChange(
  previous: ReturnType<typeof summarizeCycle>,
  current: ReturnType<typeof summarizeCycle>,
) {
  const before = keyMetrics(previous);
  const after = keyMetrics(current);
  return Object.freeze(Object.fromEntries(Object.keys(after).map((key) => {
    const currentValue = after[key as keyof typeof after];
    const previousValue = before[key as keyof typeof before];
    if (typeof currentValue !== "number" || typeof previousValue !== "number") {
      return [key, null];
    }
    return [key, Object.freeze({
      absolute: currentValue - previousValue,
      relative: previousValue === 0 ? null : (currentValue - previousValue) / previousValue,
    })];
  })));
}

function resolveConstruction(
  arm: string,
  rootModes: Readonly<{
    aorticRootMode: MainWireProximalArterialRootInertanceResearchModeV1;
    pulmonaryRootMode: MainWireProximalArterialRootInertanceResearchModeV1;
  }>,
  pulmonaryRootResistance: "source" | "normal-zc",
  pulmonaryValveLocalInertance:
    | "off"
    | MainWirePulmonaryValveLocalInertanceResearchProfileIdV1,
  ventricularMaterialByWall:
    MainWireStandard65To66VentricularMaterialByWallResearchV1 | null,
) {
  if (arm === "official-standard65") {
    if (
      rootModes.aorticRootMode !== "source-inertance"
      || rootModes.pulmonaryRootMode !== "source-inertance"
      || pulmonaryRootResistance !== "source"
      || pulmonaryValveLocalInertance !== "off"
      || ventricularMaterialByWall !== null
    ) {
      throw new Error(
        "official reference arms cannot enable root or resistance ablation",
      );
    }
    return Object.freeze({
      kind: "official-standard65-reference" as const,
      axes: null,
      selectedAorticOutflow: false,
      proximalRootResearchProfile: null,
      pulmonaryCharacteristicResistanceResearchProfile: null,
      pulmonaryValveLocalInertanceResearchProfile: null,
      ventricularMaterialByWallResearch: null,
    });
  }
  if (arm === "official-standard66") {
    if (
      rootModes.aorticRootMode !== "source-inertance"
      || rootModes.pulmonaryRootMode !== "source-inertance"
      || pulmonaryRootResistance !== "source"
      || pulmonaryValveLocalInertance !== "off"
      || ventricularMaterialByWall !== null
    ) {
      throw new Error(
        "official reference arms cannot enable root or resistance ablation",
      );
    }
    return Object.freeze({
      kind: "official-standard66-reference" as const,
      axes: null,
      selectedAorticOutflow: true,
      proximalRootResearchProfile: null,
      pulmonaryCharacteristicResistanceResearchProfile: null,
      pulmonaryValveLocalInertanceResearchProfile: null,
      ventricularMaterialByWallResearch: null,
    });
  }
  const match = /^m(65|66)-c(65|66)-t(65|66)-a(65|66)$/.exec(arm);
  if (match === null) {
    throw new Error(
      "--arm must be official-standard65, official-standard66, or m65-c65-t65-a65 form",
    );
  }
  const level = (value: string): AxisLevel =>
    value === "65" ? "standard65" : "standard66";
  const axes: MainWireIntegratedModelStandard65To66FactorizedResearchAxesV1 =
    Object.freeze({
      ventricularMaterial: level(match[1]!),
      calcium: level(match[2]!),
      rhythmTimingAndPeriodicSeed: level(match[3]!),
      aorticOutflow: level(match[4]!),
    });
  if (
    ventricularMaterialByWall !== null
    && axes.ventricularMaterial !== "standard66"
  ) {
    throw new Error(
      "wall-factorized material research uses the m66 arm as its declared superseded axis",
    );
  }
  const proximalRootResearchProfile =
    rootModes.aorticRootMode === "source-inertance"
      && rootModes.pulmonaryRootMode === "source-inertance"
    ? null
    : createMainWireProximalArterialRootInertanceResearchProfileV1(rootModes);
  if (
    pulmonaryRootResistance === "normal-zc"
    && rootModes.pulmonaryRootMode !== "resistive-root"
  ) {
    throw new Error(
      "normal pulmonary Zc resistance requires pulmonary-resistive or both-resistive root mode",
    );
  }
  if (
    pulmonaryValveLocalInertance !== "off"
    && rootModes.pulmonaryRootMode !== "resistive-root"
  ) {
    throw new Error(
      "PV local inertance requires pulmonary-resistive or both-resistive root mode",
    );
  }
  return Object.freeze({
    kind: "factorized-research" as const,
    axes,
    selectedAorticOutflow: axes.aorticOutflow === "standard66",
    proximalRootResearchProfile,
    pulmonaryCharacteristicResistanceResearchProfile:
      pulmonaryRootResistance === "normal-zc"
        ? MAIN_WIRE_PULMONARY_CHARACTERISTIC_RESISTANCE_RESEARCH_PROFILE_V1
        : null,
    pulmonaryValveLocalInertanceResearchProfile:
      pulmonaryValveLocalInertance === "off"
        ? null
        : resolveMainWirePulmonaryValveLocalInertanceResearchProfileV1(
            pulmonaryValveLocalInertance,
          ),
    ventricularMaterialByWallResearch: ventricularMaterialByWall,
  });
}

function rootAblationArgument():
  | "source"
  | "aortic-resistive"
  | "pulmonary-resistive"
  | "both-resistive" {
  const value = optionalArgument("--root") ?? "source";
  if (
    value !== "source"
    && value !== "aortic-resistive"
    && value !== "pulmonary-resistive"
    && value !== "both-resistive"
  ) {
    throw new Error(
      "--root must be source, aortic-resistive, pulmonary-resistive, or both-resistive",
    );
  }
  return value;
}

function resolveRootModes(
  rootAblation: ReturnType<typeof rootAblationArgument>,
  customAorticRootMode:
    MainWireProximalArterialRootInertanceResearchModeV1 | null,
  customPulmonaryRootMode:
    MainWireProximalArterialRootInertanceResearchModeV1 | null,
) {
  if (
    rootAblation !== "source"
    && (customAorticRootMode !== null || customPulmonaryRootMode !== null)
  ) {
    throw new Error(
      "--root cannot be combined with explicit --aortic-root-mode or --pulmonary-root-mode",
    );
  }
  if (customAorticRootMode !== null || customPulmonaryRootMode !== null) {
    return Object.freeze({
      aorticRootMode: customAorticRootMode ?? "source-inertance",
      pulmonaryRootMode: customPulmonaryRootMode ?? "source-inertance",
    });
  }
  return Object.freeze({
    aorticRootMode:
      rootAblation === "aortic-resistive" || rootAblation === "both-resistive"
        ? "resistive-root" as const
        : "source-inertance" as const,
    pulmonaryRootMode:
      rootAblation === "pulmonary-resistive" || rootAblation === "both-resistive"
        ? "resistive-root" as const
        : "source-inertance" as const,
  });
}

function optionalRootModeArgument(
  name: "--aortic-root-mode" | "--pulmonary-root-mode",
): MainWireProximalArterialRootInertanceResearchModeV1 | null {
  const value = optionalArgument(name);
  if (value === null) return null;
  if (
    value !== "source-inertance"
    && value !== "three-quarter-inertance"
    && value !== "one-half-inertance"
    && value !== "one-quarter-inertance"
    && value !== "one-eighth-inertance"
    && value !== "resistive-root"
  ) {
    throw new Error(
      `${name} must be source, three-quarter, one-half, one-quarter, one-eighth, or resistive`,
    );
  }
  return value;
}

function pulmonaryRootResistanceArgument(): "source" | "normal-zc" {
  const value = optionalArgument("--pulmonary-root-resistance") ?? "source";
  if (value !== "source" && value !== "normal-zc") {
    throw new Error(
      "--pulmonary-root-resistance must be source or normal-zc",
    );
  }
  return value;
}

function pulmonaryValveLocalInertanceArgument():
  | "off"
  | MainWirePulmonaryValveLocalInertanceResearchProfileIdV1 {
  const value = optionalArgument("--pulmonary-valve-local-inertance") ?? "off";
  if (
    value !== "off"
    && value !== "rvot-2cm-column-local-inertance"
    && value !== "rvot-4cm-column-local-inertance"
    && value !== "rvot-7cm-column-local-inertance"
  ) {
    throw new Error(
      "--pulmonary-valve-local-inertance must be off or a fixed rvot-{2,4,7}cm-column-local-inertance profile",
    );
  }
  return value;
}

function ventricularMaterialByWallArgument():
  MainWireStandard65To66VentricularMaterialByWallResearchV1 | null {
  const value = optionalArgument("--ventricular-material-by-wall") ?? "off";
  if (value === "off") return null;
  const match = /^l(65|66)-s(65|66)-r(65|66)$/.exec(value);
  if (match === null) {
    throw new Error(
      "--ventricular-material-by-wall must be off or l65-s65-r65 form",
    );
  }
  const level = (token: string): AxisLevel =>
    token === "65" ? "standard65" : "standard66";
  return Object.freeze({
    LVFW: level(match[1]!),
    SEP: level(match[2]!),
    RVFW: level(match[3]!),
  });
}

function resolveResearchContext(contextId: string) {
  const baseline = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3;
  const contexts = Object.freeze({
    baseline: Object.freeze({}),
    "heart-rate-40": Object.freeze({ heartRateBpm: 40 }),
    "heart-rate-100": Object.freeze({ heartRateBpm: 100 }),
    "systemic-resistance-0p75": Object.freeze({ systemicResistance: 0.75 }),
    "systemic-resistance-1p25": Object.freeze({ systemicResistance: 1.25 }),
    "pulmonary-resistance-0p45": Object.freeze({ pulmonaryResistance: 0.45 }),
    "pulmonary-resistance-0p8": Object.freeze({ pulmonaryResistance: 0.8 }),
    "arterial-stiffness-0p5": Object.freeze({ arterialStiffness: 0.5 }),
    "arterial-stiffness-1p0": Object.freeze({ arterialStiffness: 1 }),
    "total-blood-volume-4200": Object.freeze({ totalBloodVolumeMl: 4_200 }),
    "total-blood-volume-7000": Object.freeze({ totalBloodVolumeMl: 7_000 }),
    "venous-tone-0": Object.freeze({ venousTone: 0 }),
    "venous-tone-1": Object.freeze({ venousTone: 1 }),
    "peep-20": Object.freeze({ peepCmH2O: 20 }),
    "contractility-0p75": Object.freeze({}),
    "contractility-1p33": Object.freeze({}),
  } as const);
  if (!(contextId in contexts)) {
    throw new Error(`unsupported fixed research context ${contextId}`);
  }
  const hemodynamicOverride = contexts[contextId as keyof typeof contexts];
  const ventricularContractilityScale = contextId === "contractility-0p75"
    ? 0.75
    : contextId === "contractility-1p33"
      ? 1.33
      : 1;
  return Object.freeze({
    contextId,
    oneFactorAtATimeAroundBaseline: contextId !== "baseline",
    hemodynamicResearchInputs: Object.freeze({
      ...baseline,
      ...hemodynamicOverride,
    }),
    ventricularContractilityScale,
  });
}

function resolveRightHeartMechanicsScreen(
  activeTensionScale: number,
  passiveStiffnessScale: number,
) {
  for (const [label, value] of [
    ["--rvfw-active-scale", activeTensionScale],
    ["--rvfw-passive-scale", passiveStiffnessScale],
  ] as const) {
    if (value < 0.75 || value > 1.33) {
      throw new Error(`${label} must be within the preregistered [0.75, 1.33] screen`);
    }
  }
  const baseline =
    MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3;
  const chamberMechanics = baseline.chamberMechanics;
  return Object.freeze({
    screenId: "rvfw-active-passive-two-factor-bounded-screen-v1" as const,
    activeTensionScale,
    passiveStiffnessScale,
    isBaseline: activeTensionScale === 1 && passiveStiffnessScale === 1,
    wallIsolation: "RVFW-only-SEP-held-at-baseline" as const,
    parameterSearchOrFitting: false as const,
    mechanismResearchInputs: Object.freeze({
      ...baseline,
      chamberMechanics: Object.freeze({
        ...chamberMechanics,
        activeTensionScaleByWall: Object.freeze({
          ...chamberMechanics.activeTensionScaleByWall,
          RVFW: activeTensionScale,
        }),
        passiveStiffnessScaleByWall: Object.freeze({
          ...chamberMechanics.passiveStiffnessScaleByWall,
          RVFW: passiveStiffnessScale,
        }),
      }),
    }),
  });
}

function scaleId(value: number): string {
  return value.toFixed(2).replace(".", "p");
}

function levelId(value: AxisLevel): "65" | "66" {
  return value === "standard65" ? "65" : "66";
}

function argument(name: string, fallback?: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) {
    if (fallback !== undefined) return fallback;
    throw new Error(`${name} is required`);
  }
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function optionalArgument(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function numberArgument(name: string, fallback: number): number {
  const value = Number(argument(name, String(fallback)));
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be positive and finite`);
  }
  return value;
}

function integerArgument(name: string, fallback: number): number {
  const value = Number(argument(name, String(fallback)));
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}
