import type {
  MainWireNormalAdultFiveWallClosedLoopSampleV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  evaluateEnergyConjugateTriSegV1,
  evaluateTriSegGeometryV1,
  type TriSegGeometryV1,
  type TriSegWallRecordV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  MAIN_WIRE_VALVE_PA_PER_MMHG_V2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_OUTFLOW_CLOSURE_MECHANISM_AUDIT_V1_ID =
  "main-wire-aortic-outflow-closure-mechanism-audit-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_CLOSURE_MECHANISM_AUDIT_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-whole-heart-beat" as const,
    eventDefinition:
      "global-flow-peak-bounded-one-percent-peak-flow-episode-plus-first-nonpositive-flow-sample" as const,
    pressureDecomposition:
      "energy-conjugate-TriSeg-virtual-work-map-at-recorded-geometry" as const,
    pressureComponentsAreAdditiveAtOneRecordedGeometry: true as const,
    stressGeometrySplit:
      "exact-two-point-algebraic-split-with-end-geometry-first;counterfactual-intermediate-is-not-equilibrium" as const,
    pericardialPressureHandledSeparately: true as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    exactModelStateChanged: false as const,
    parameterSearchOrFitting: false as const,
    causalInterventionClaimed: false as const,
    clinicalValidationClaimed: false as const,
  });

type StressComponent = "active" | "passive" | "sls" | "total";
type VentricularWall = "LVFW" | "SEP" | "RVFW";

type PressureChangeSplitV1 = Readonly<{
  totalChange: number;
  stressAtEndGeometry: number;
  geometryAtStartStress: number;
  exactReconstructionResidual: number;
}>;

export type MainWireAorticOutflowClosureEventSnapshotV1 = Readonly<{
  sampleIndex: number;
  cyclePhase01: number;
  aorticFlowMlPerSec: number;
  aorticValveOpeningFraction01: number;
  leftVentricularFreeCalciumUM: number;
  leftVentricularVolumeMl: number;
  rightVentricularVolumeMl: number;
  leftVentricularAbsolutePressureMmHg: number;
  leftVentricularTransmuralPressureMmHg: number;
  aorticAbsolutePressureMmHg: number;
  leftVentricularToAorticAbsoluteGradientMmHg: number;
  commonPericardialPressureMmHg: number;
  triSegPressureContributionMmHg: Readonly<{
    active: number;
    passive: number;
    sls: number;
    total: number;
    componentSum: number;
    componentSumResidualFromRecordedTransmural: number;
  }>;
  triSegActivePressureContributionByWallMmHg: Readonly<{
    LVFW: number;
    SEP: number;
    RVFW: number;
    wallSum: number;
    wallSumResidualFromActive: number;
  }>;
  wallActiveStressKPa: Readonly<{
    LVFW: number;
    SEP: number;
    RVFW: number;
  }>;
  wallTotalStressKPa: Readonly<{
    LVFW: number;
    SEP: number;
    RVFW: number;
  }>;
}>;

export type MainWireAorticOutflowClosurePressureIntervalV1 = Readonly<{
  startSampleIndex: number;
  endSampleIndex: number;
  durationSec: number;
  leftVentricularVolumeChangeMl: number;
  leftVentricularAbsolutePressureChangeMmHg: number;
  leftVentricularTransmuralPressureChangeMmHg: number;
  aorticAbsolutePressureChangeMmHg: number;
  leftVentricularToAorticGradientChangeMmHg: number;
  commonPericardialPressureChangeMmHg: number;
  triSegTotalPressureChangeMmHg: number;
  triSegPressureChangeByComponentMmHg: Readonly<{
    active: number;
    passive: number;
    sls: number;
  }>;
  triSegPressureChangeSplitMmHg: Readonly<{
    stressAtEndGeometry: number;
    geometryAtStartStress: number;
    exactReconstructionResidual: number;
  }>;
  triSegPressureChangeSplitByComponentMmHg: Readonly<Record<
    "active" | "passive" | "sls",
    PressureChangeSplitV1
  >>;
  triSegActivePressureChangeSplitByWallMmHg: Readonly<Record<
    VentricularWall,
    PressureChangeSplitV1
  >>;
}>;

export type MainWireAorticOutflowClosureMechanismAuditV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_CLOSURE_MECHANISM_AUDIT_V1_ID;
  source: Readonly<{
    protocolIdentityHash: string;
    beatIndex: number;
    dtSec: number;
    sampleCount: number;
    periodicSteadyStateClaimed: boolean;
  }>;
  event: Readonly<{
    flowThresholdMlPerSec: number;
    peakFlowMlPerSec: number;
    thresholdOnsetSampleIndex: number;
    peakSampleIndex: number;
    thresholdEndSampleIndex: number;
    firstNonpositiveFlowSampleIndex: number;
    thresholdEjectionDurationSec: number;
    positiveFlowDurationSec: number;
  }>;
  atThresholdOnset: MainWireAorticOutflowClosureEventSnapshotV1;
  atFlowPeak: MainWireAorticOutflowClosureEventSnapshotV1;
  twentyMillisecondsBeforeThresholdEnd:
    MainWireAorticOutflowClosureEventSnapshotV1;
  atThresholdEnd: MainWireAorticOutflowClosureEventSnapshotV1;
  atFirstNonpositiveFlow:
    MainWireAorticOutflowClosureEventSnapshotV1;
  peakToThresholdEnd: MainWireAorticOutflowClosurePressureIntervalV1;
  finalTwentyMillisecondsToThresholdEnd:
    MainWireAorticOutflowClosurePressureIntervalV1;
  thresholdEndToFirstNonpositiveFlow:
    MainWireAorticOutflowClosurePressureIntervalV1;
  claim: typeof MAIN_WIRE_AORTIC_OUTFLOW_CLOSURE_MECHANISM_AUDIT_CLAIM_V1;
}>;

export function measureMainWireAorticOutflowClosureMechanismAuditV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticOutflowClosureMechanismAuditV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length < 3) {
    throw new Error("aortic closure audit requires one complete retained beat");
  }
  const samples = beat.samples;
  const flows = samples.map((sample) => sample.flowMlPerSec.AoV);
  const peakFlowMlPerSec = Math.max(...flows);
  if (!(peakFlowMlPerSec > 0)) {
    throw new Error("aortic closure audit requires positive aortic flow");
  }
  const peakSampleIndex = indexOfMaximum(flows);
  const flowThresholdMlPerSec = Math.max(1, 0.01 * peakFlowMlPerSec);
  const thresholdOnsetSampleIndex = scanBackwardWithinEpisode(
    flows,
    peakSampleIndex,
    (flow) => flow >= flowThresholdMlPerSec,
  );
  const thresholdEndSampleIndex = scanForwardWithinEpisode(
    flows,
    peakSampleIndex,
    (flow) => flow >= flowThresholdMlPerSec,
  );
  const positiveEndSampleIndex = scanForwardWithinEpisode(
    flows,
    peakSampleIndex,
    (flow) => flow > 0,
  );
  const firstNonpositiveFlowSampleIndex = cyclicIndex(
    positiveEndSampleIndex + 1,
    samples.length,
  );
  if (flows[firstNonpositiveFlowSampleIndex]! > 0) {
    throw new Error("aortic closure audit could not locate valve closure");
  }
  const twentyMillisecondSampleCount = Math.max(
    1,
    Math.round(0.02 / result.dtSec),
  );
  const beforeEndIndex = cyclicIndex(
    thresholdEndSampleIndex - twentyMillisecondSampleCount,
    samples.length,
  );
  const thresholdEjectionSampleCount = cyclicDistanceInclusive(
    thresholdOnsetSampleIndex,
    thresholdEndSampleIndex,
    samples.length,
  );
  const positiveFlowSampleCount = cyclicDistanceInclusive(
    scanBackwardWithinEpisode(flows, peakSampleIndex, (flow) => flow > 0),
    positiveEndSampleIndex,
    samples.length,
  );
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_CLOSURE_MECHANISM_AUDIT_V1_ID,
    source: Object.freeze({
      protocolIdentityHash: result.protocolIdentityHash,
      beatIndex: beat.beatIndex,
      dtSec: result.dtSec,
      sampleCount: samples.length,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    }),
    event: Object.freeze({
      flowThresholdMlPerSec,
      peakFlowMlPerSec,
      thresholdOnsetSampleIndex,
      peakSampleIndex,
      thresholdEndSampleIndex,
      firstNonpositiveFlowSampleIndex,
      thresholdEjectionDurationSec:
        thresholdEjectionSampleCount * result.dtSec,
      positiveFlowDurationSec: positiveFlowSampleCount * result.dtSec,
    }),
    atThresholdOnset: snapshot(samples, thresholdOnsetSampleIndex),
    atFlowPeak: snapshot(samples, peakSampleIndex),
    twentyMillisecondsBeforeThresholdEnd: snapshot(samples, beforeEndIndex),
    atThresholdEnd: snapshot(samples, thresholdEndSampleIndex),
    atFirstNonpositiveFlow: snapshot(samples, firstNonpositiveFlowSampleIndex),
    peakToThresholdEnd: interval(
      samples,
      peakSampleIndex,
      thresholdEndSampleIndex,
      result.dtSec,
    ),
    finalTwentyMillisecondsToThresholdEnd: interval(
      samples,
      beforeEndIndex,
      thresholdEndSampleIndex,
      result.dtSec,
    ),
    thresholdEndToFirstNonpositiveFlow: interval(
      samples,
      thresholdEndSampleIndex,
      firstNonpositiveFlowSampleIndex,
      result.dtSec,
    ),
    claim: MAIN_WIRE_AORTIC_OUTFLOW_CLOSURE_MECHANISM_AUDIT_CLAIM_V1,
  });
}

function snapshot(
  samples: readonly MainWireNormalAdultFiveWallClosedLoopSampleV1[],
  sampleIndex: number,
): MainWireAorticOutflowClosureEventSnapshotV1 {
  const sample = samples[sampleIndex]!;
  const geometry = geometryAt(sample);
  const active = triSegPressureMmHg(geometry, sample, "active");
  const passive = triSegPressureMmHg(geometry, sample, "passive");
  const sls = triSegPressureMmHg(geometry, sample, "sls");
  const total = triSegPressureMmHg(geometry, sample, "total");
  const componentSum = active + passive + sls;
  const activeByWall = activePressureByWallMmHg(geometry, sample);
  const activeWallSum =
    activeByWall.LVFW + activeByWall.SEP + activeByWall.RVFW;
  return Object.freeze({
    sampleIndex,
    cyclePhase01: sample.cyclePhase01,
    aorticFlowMlPerSec: sample.flowMlPerSec.AoV,
    aorticValveOpeningFraction01: sample.valveOpeningFraction01.AoV,
    leftVentricularFreeCalciumUM: sample.freeCalciumUM.LVFW,
    leftVentricularVolumeMl: sample.nodeVolumeMl.LV,
    rightVentricularVolumeMl: sample.nodeVolumeMl.RV,
    leftVentricularAbsolutePressureMmHg:
      sample.nodeAbsolutePressureMmHg.LV,
    leftVentricularTransmuralPressureMmHg:
      sample.chamberTransmuralPressureMmHg.LV,
    aorticAbsolutePressureMmHg: sample.nodeAbsolutePressureMmHg.Ao,
    leftVentricularToAorticAbsoluteGradientMmHg:
      sample.nodeAbsolutePressureMmHg.LV
      - sample.nodeAbsolutePressureMmHg.Ao,
    commonPericardialPressureMmHg: sample.commonPericardium.excessPressureMmHg,
    triSegPressureContributionMmHg: Object.freeze({
      active,
      passive,
      sls,
      total,
      componentSum,
      componentSumResidualFromRecordedTransmural:
        componentSum - sample.chamberTransmuralPressureMmHg.LV,
    }),
    triSegActivePressureContributionByWallMmHg: Object.freeze({
      ...activeByWall,
      wallSum: activeWallSum,
      wallSumResidualFromActive: activeWallSum - active,
    }),
    wallActiveStressKPa: ventricularStressKPa(sample, "active"),
    wallTotalStressKPa: ventricularStressKPa(sample, "total"),
  });
}

function interval(
  samples: readonly MainWireNormalAdultFiveWallClosedLoopSampleV1[],
  startSampleIndex: number,
  endSampleIndex: number,
  dtSec: number,
): MainWireAorticOutflowClosurePressureIntervalV1 {
  const start = samples[startSampleIndex]!;
  const end = samples[endSampleIndex]!;
  const startGeometry = geometryAt(start);
  const endGeometry = geometryAt(end);
  const byComponent = Object.freeze({
    active: pressureChangeSplit(startGeometry, endGeometry, start, end, "active"),
    passive: pressureChangeSplit(startGeometry, endGeometry, start, end, "passive"),
    sls: pressureChangeSplit(startGeometry, endGeometry, start, end, "sls"),
  });
  const activeByWall = Object.freeze({
    LVFW: pressureChangeSplitByWall(
      startGeometry,
      endGeometry,
      start,
      end,
      "active",
      "LVFW",
    ),
    SEP: pressureChangeSplitByWall(
      startGeometry,
      endGeometry,
      start,
      end,
      "active",
      "SEP",
    ),
    RVFW: pressureChangeSplitByWall(
      startGeometry,
      endGeometry,
      start,
      end,
      "active",
      "RVFW",
    ),
  });
  const totalSplit = pressureChangeSplit(
    startGeometry,
    endGeometry,
    start,
    end,
    "total",
  );
  const startGradient = start.nodeAbsolutePressureMmHg.LV
    - start.nodeAbsolutePressureMmHg.Ao;
  const endGradient = end.nodeAbsolutePressureMmHg.LV
    - end.nodeAbsolutePressureMmHg.Ao;
  return Object.freeze({
    startSampleIndex,
    endSampleIndex,
    durationSec: cyclicDistanceExclusive(
      startSampleIndex,
      endSampleIndex,
      samples.length,
    ) * dtSec,
    leftVentricularVolumeChangeMl:
      end.nodeVolumeMl.LV - start.nodeVolumeMl.LV,
    leftVentricularAbsolutePressureChangeMmHg:
      end.nodeAbsolutePressureMmHg.LV - start.nodeAbsolutePressureMmHg.LV,
    leftVentricularTransmuralPressureChangeMmHg:
      end.chamberTransmuralPressureMmHg.LV
      - start.chamberTransmuralPressureMmHg.LV,
    aorticAbsolutePressureChangeMmHg:
      end.nodeAbsolutePressureMmHg.Ao - start.nodeAbsolutePressureMmHg.Ao,
    leftVentricularToAorticGradientChangeMmHg: endGradient - startGradient,
    commonPericardialPressureChangeMmHg:
      end.commonPericardium.excessPressureMmHg
      - start.commonPericardium.excessPressureMmHg,
    triSegTotalPressureChangeMmHg: totalSplit.totalChange,
    triSegPressureChangeByComponentMmHg: Object.freeze({
      active: byComponent.active.totalChange,
      passive: byComponent.passive.totalChange,
      sls: byComponent.sls.totalChange,
    }),
    triSegPressureChangeSplitMmHg: Object.freeze({
      stressAtEndGeometry: totalSplit.stressAtEndGeometry,
      geometryAtStartStress: totalSplit.geometryAtStartStress,
      exactReconstructionResidual: totalSplit.exactReconstructionResidual,
    }),
    triSegPressureChangeSplitByComponentMmHg: byComponent,
    triSegActivePressureChangeSplitByWallMmHg: activeByWall,
  });
}

function pressureChangeSplit(
  startGeometry: TriSegGeometryV1,
  endGeometry: TriSegGeometryV1,
  start: MainWireNormalAdultFiveWallClosedLoopSampleV1,
  end: MainWireNormalAdultFiveWallClosedLoopSampleV1,
  component: StressComponent,
): PressureChangeSplitV1 {
  const startPressure = triSegPressureMmHg(startGeometry, start, component);
  const endPressure = triSegPressureMmHg(endGeometry, end, component);
  const startStressAtEndGeometry = triSegPressureMmHg(
    endGeometry,
    start,
    component,
  );
  const totalChange = endPressure - startPressure;
  const stressAtEndGeometry = endPressure - startStressAtEndGeometry;
  const geometryAtStartStress = startStressAtEndGeometry - startPressure;
  return Object.freeze({
    totalChange,
    stressAtEndGeometry,
    geometryAtStartStress,
    exactReconstructionResidual:
      totalChange - stressAtEndGeometry - geometryAtStartStress,
  });
}

function pressureChangeSplitByWall(
  startGeometry: TriSegGeometryV1,
  endGeometry: TriSegGeometryV1,
  start: MainWireNormalAdultFiveWallClosedLoopSampleV1,
  end: MainWireNormalAdultFiveWallClosedLoopSampleV1,
  component: StressComponent,
  wall: VentricularWall,
): PressureChangeSplitV1 {
  const startPressure = triSegPressureMmHgForWall(
    startGeometry,
    start,
    component,
    wall,
  );
  const endPressure = triSegPressureMmHgForWall(
    endGeometry,
    end,
    component,
    wall,
  );
  const startStressAtEndGeometry = triSegPressureMmHgForWall(
    endGeometry,
    start,
    component,
    wall,
  );
  const totalChange = endPressure - startPressure;
  const stressAtEndGeometry = endPressure - startStressAtEndGeometry;
  const geometryAtStartStress = startStressAtEndGeometry - startPressure;
  return Object.freeze({
    totalChange,
    stressAtEndGeometry,
    geometryAtStartStress,
    exactReconstructionResidual:
      totalChange - stressAtEndGeometry - geometryAtStartStress,
  });
}

function geometryAt(
  sample: MainWireNormalAdultFiveWallClosedLoopSampleV1,
): TriSegGeometryV1 {
  return evaluateTriSegGeometryV1({
    leftVentricularCavityVolumeM3: sample.nodeVolumeMl.LV * 1e-6,
    rightVentricularCavityVolumeM3: sample.nodeVolumeMl.RV * 1e-6,
    coordinates: Object.freeze({
      septalMidwallCapVolumeM3:
        sample.internalCoordinates.septalMidwallCapVolumeMl * 1e-6,
      junctionRadiusM: sample.internalCoordinates.junctionRadiusM,
    }),
    walls: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg
      .wallGeometryParameters,
  });
}

function triSegPressureMmHg(
  geometry: TriSegGeometryV1,
  stressSource: MainWireNormalAdultFiveWallClosedLoopSampleV1,
  component: StressComponent,
): number {
  const stress = stressRecord(stressSource, component);
  return evaluateEnergyConjugateTriSegV1({
    geometry,
    fiberKirchhoffStressPaByWall: stress,
  }).cavityTransmuralPressuresPa.LV / MAIN_WIRE_VALVE_PA_PER_MMHG_V2;
}

function triSegPressureMmHgForWall(
  geometry: TriSegGeometryV1,
  stressSource: MainWireNormalAdultFiveWallClosedLoopSampleV1,
  component: StressComponent,
  wall: VentricularWall,
): number {
  const stress = stressRecord(stressSource, component);
  return evaluateEnergyConjugateTriSegV1({
    geometry,
    fiberKirchhoffStressPaByWall: Object.freeze({
      LVFW: wall === "LVFW" ? stress.LVFW : 0,
      SEP: wall === "SEP" ? stress.SEP : 0,
      RVFW: wall === "RVFW" ? stress.RVFW : 0,
    }),
  }).cavityTransmuralPressuresPa.LV / MAIN_WIRE_VALVE_PA_PER_MMHG_V2;
}

function activePressureByWallMmHg(
  geometry: TriSegGeometryV1,
  sample: MainWireNormalAdultFiveWallClosedLoopSampleV1,
): Readonly<Record<VentricularWall, number>> {
  return Object.freeze({
    LVFW: triSegPressureMmHgForWall(geometry, sample, "active", "LVFW"),
    SEP: triSegPressureMmHgForWall(geometry, sample, "active", "SEP"),
    RVFW: triSegPressureMmHgForWall(geometry, sample, "active", "RVFW"),
  });
}

function stressRecord(
  sample: MainWireNormalAdultFiveWallClosedLoopSampleV1,
  component: StressComponent,
): TriSegWallRecordV1<number> {
  return Object.freeze({
    LVFW: sample.wallStressPa.LVFW[component],
    SEP: sample.wallStressPa.SEP[component],
    RVFW: sample.wallStressPa.RVFW[component],
  });
}

function ventricularStressKPa(
  sample: MainWireNormalAdultFiveWallClosedLoopSampleV1,
  component: StressComponent,
): Readonly<{ LVFW: number; SEP: number; RVFW: number }> {
  return Object.freeze({
    LVFW: sample.wallStressPa.LVFW[component] / 1000,
    SEP: sample.wallStressPa.SEP[component] / 1000,
    RVFW: sample.wallStressPa.RVFW[component] / 1000,
  });
}

function scanBackwardWithinEpisode(
  values: readonly number[],
  centerIndex: number,
  included: (value: number) => boolean,
): number {
  let index = centerIndex;
  for (let count = 1; count < values.length; count += 1) {
    const previous = cyclicIndex(index - 1, values.length);
    if (!included(values[previous]!)) return index;
    index = previous;
  }
  throw new Error("aortic flow episode occupies the complete cycle");
}

function scanForwardWithinEpisode(
  values: readonly number[],
  centerIndex: number,
  included: (value: number) => boolean,
): number {
  let index = centerIndex;
  for (let count = 1; count < values.length; count += 1) {
    const next = cyclicIndex(index + 1, values.length);
    if (!included(values[next]!)) return index;
    index = next;
  }
  throw new Error("aortic flow episode occupies the complete cycle");
}

function cyclicDistanceInclusive(start: number, end: number, length: number): number {
  return cyclicDistanceExclusive(start, end, length) + 1;
}

function cyclicDistanceExclusive(start: number, end: number, length: number): number {
  return end >= start ? end - start : length - start + end;
}

function cyclicIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

function indexOfMaximum(values: readonly number[]): number {
  let selected = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index]! > values[selected]!) selected = index;
  }
  return selected;
}
