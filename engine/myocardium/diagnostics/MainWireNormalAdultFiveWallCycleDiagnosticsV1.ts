/**
 * Pure, accepted-step diagnostics for one five-wall closed-loop cycle.
 *
 * The diagnostic owns no state, parameter fitting, smoothing, or interpolation.
 * Flow and stress work use backward-Euler endpoint quadrature so their ledger
 * follows the discrete scheme used by the experimental transaction.
 */

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_V1_ID =
  "main-wire-normal-adult-five-wall-cycle-diagnostics-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V1 =
  Object.freeze({
    input: "accepted-step-readback-only" as const,
    addsDynamicState: false as const,
    parameterFitting: false as const,
    smoothingOrInterpolation: false as const,
    phaseOwnership: "cyclic-half-open-exhaustive" as const,
    integration: "backward-Euler-endpoint" as const,
    valveEventOwnership:
      "explicit-flow-threshold-transitions" as const,
    mitralClosureAnchor:
      "first-closure-transition-at-or-after-atrial-calcium-onset" as const,
    mitralWaveSeparation:
      "strict-intervening-forward-flow-valley-between-window-peaks" as const,
    pulmonaryVenousSignal:
      "aggregate-PVein-to-LA-edge-not-separate-vein-measurements" as const,
    mitralVti:
      "modeled-bulk-flow-divided-by-modeled-instantaneous-physical-EOA" as const,
    relaxationTau:
      "report-only-fixed-asymptote-log-linear-fit-over-AoV-closure-to-MVO" as const,
    landThermodynamicStoredEnergyClaimed: false as const,
    cavityWorkSign: "positive-is-work-on-wall" as const,
    pericardialWorkSign: "positive-is-work-stored-in-common-bag" as const,
    pericardialWorkExcludedFromTransmuralWallWork: true as const,
  });

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1 =
  Object.freeze(["LA", "LVFW", "SEP", "RVFW", "RA"] as const);

export type MainWireNormalAdultFiveWallCycleWallIdV1 =
  (typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1)[number];
export type MainWireNormalAdultFiveWallCyclePhaseV1 =
  "reservoir" | "conduit" | "pumping";

type WallRecord<T> = Readonly<
  Record<MainWireNormalAdultFiveWallCycleWallIdV1, T>
>;
type ChamberRecord<T> = Readonly<Record<"LA" | "LV" | "RA" | "RV", T>>;

export type MainWireNormalAdultFiveWallCycleEnergyDensityReadbackV1 = Readonly<{
  equilibriumPassiveStoredEnergyDensityJPerM3: number;
  slsPreviousStoredEnergyDensityJPerM3: number;
  slsNextStoredEnergyDensityJPerM3: number;
  slsPhysicalDissipationIncrementDensityJPerM3: number;
  slsBackwardEulerNumericalDissipationIncrementDensityJPerM3: number;
  slsDiscreteEnergyBalanceResidualJPerM3: number;
}>;

/** Structural readback boundary; the experiment sample satisfies this type. */
export type MainWireNormalAdultFiveWallCycleSampleV1 = Readonly<{
  timeSec: number;
  cyclePhase01: number;
  nodeVolumeMl: ChamberRecord<number>;
  chamberTransmuralPressureMmHg: ChamberRecord<number>;
  commonPericardium: Readonly<{
    excessPressureMmHg: number;
    storedEnergyMilliJ: number;
  }>;
  flowMlPerSec: Readonly<{
    MV: number;
    AoV: number;
    PVein_LA: number;
  }>;
  wallStressPa: WallRecord<Readonly<{
    total: number;
    active: number;
    passive: number;
    sls: number;
  }>>;
  wallFiberLogStrain: WallRecord<number>;
  wallEnergyLedgerDensity:
    WallRecord<MainWireNormalAdultFiveWallCycleEnergyDensityReadbackV1>;
  valveHydraulics: Readonly<{
    MV: Readonly<{ physicalAreaCm2: number }>;
  }>;
}>;

export type MainWireNormalAdultFiveWallFlowWindowLedgerV1 = Readonly<{
  sampleCount: number;
  peakForwardMlPerSec: number;
  peakReverseMlPerSec: number;
  signedVolumeMl: number;
  forwardVolumeMl: number;
  reverseVolumeMl: number;
}>;

export type MainWireNormalAdultFiveWallMitralWaveLedgerV1 = Readonly<{
  sampleCount: number;
  peakForwardMlPerSec: number;
  forwardVolumeMl: number;
  modeledAreaVtiCm: number | null;
  positiveFlowSamplesWithoutPhysicalArea: number;
}>;

export type MainWireNormalAdultFiveWallCycleDiagnosticsInputV1 = Readonly<{
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[];
  /** Accepted sample immediately before samples[0], if available. */
  precedingSample?: MainWireNormalAdultFiveWallCycleSampleV1 | null;
  dtSec: number;
  atrialCalciumOnsetPhase01: number;
  wallMaterialVolumeMlByWall: WallRecord<number>;
  valveOpenThreshold?: Readonly<{
    peakFraction?: number;
    absoluteFloorMlPerSec?: number;
  }>;
}>;

export type MainWireNormalAdultFiveWallCycleEventV1 = Readonly<{
  sampleIndex: number;
  phase01: number;
  timeSec: number;
}>;

type StressWorkComponents = Readonly<{
  total: number;
  active: number;
  passive: number;
  sls: number;
}>;

export type MainWireNormalAdultFiveWallCycleWallWorkLedgerV1 = Readonly<{
  stressWorkOnWallMilliJ: StressWorkComponents;
  stressAssemblyResidualMilliJ: number;
  equilibriumPassiveStoredEnergyChangeMilliJ: number;
  equilibriumPassiveBackwardEulerRemainderMilliJ: number;
  sls: Readonly<{
    storedEnergyChangeMilliJ: number;
    physicalDissipationMilliJ: number;
    backwardEulerNumericalDissipationMilliJ: number;
    reportedDiscreteBalanceResidualMilliJ: number;
    reconstructedDiscreteBalanceResidualMilliJ: number;
    readbackAgreementResidualMilliJ: number;
  }>;
}>;

export type MainWireNormalAdultFiveWallCycleDiagnosticsV1 = Readonly<{
  diagnosticsId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_V1_ID;
  sampleCount: number;
  dtSec: number;
  phaseBySample: readonly MainWireNormalAdultFiveWallCyclePhaseV1[];
  phaseSampleCount: Readonly<Record<
    MainWireNormalAdultFiveWallCyclePhaseV1,
    number
  >>;
  events: Readonly<{
    mitralValveOpening: MainWireNormalAdultFiveWallCycleEventV1;
    mitralValveClosure: MainWireNormalAdultFiveWallCycleEventV1;
    aorticValveClosure: MainWireNormalAdultFiveWallCycleEventV1;
    atrialCalciumOnset: MainWireNormalAdultFiveWallCycleEventV1;
    mitralEventSource: "flow-threshold";
    aorticEventSource: "flow-threshold";
    mitralOpenThresholdMlPerSec: number;
    aorticOpenThresholdMlPerSec: number;
  }>;
  pulmonaryVenous: Readonly<{
    S: MainWireNormalAdultFiveWallFlowWindowLedgerV1;
    D: MainWireNormalAdultFiveWallFlowWindowLedgerV1;
    Ar: MainWireNormalAdultFiveWallFlowWindowLedgerV1;
  }>;
  mitral: Readonly<{
    E: MainWireNormalAdultFiveWallMitralWaveLedgerV1;
    A: MainWireNormalAdultFiveWallMitralWaveLedgerV1;
    eFlowPeak: MainWireNormalAdultFiveWallCycleEventV1 &
      Readonly<{ flowMlPerSec: number }>;
    aFlowPeak: MainWireNormalAdultFiveWallCycleEventV1 &
      Readonly<{ flowMlPerSec: number }>;
    peakERatioToA: number | null;
    forwardVolumeERatioToA: number | null;
    flowAtAtrialCalciumOnsetMlPerSec: number;
    flowAtAtrialCalciumOnsetRatioToEPeak: number | null;
    waveSeparation: Readonly<{
      status: "separated" | "fused-or-unresolved";
      criterion:
        "strict-intervening-forward-flow-valley-between-window-peaks";
      valley: (MainWireNormalAdultFiveWallCycleEventV1 &
        Readonly<{ flowMlPerSec: number }>) | null;
      valleyToLowerPeakRatio: number | null;
    }>;
  }>;
  leftAtrialVolumes: Readonly<{
    maximumMl: number;
    preAMl: number;
    minimumMl: number;
    reservoirExpansionMl: number;
    conduitEmptyingMl: number;
    boosterEmptyingMl: number;
    conduitFractionOfTotalEmptying: number | null;
    boosterFractionOfTotalEmptying: number | null;
    eventAnchoredNetChangeMl: Readonly<Record<
      MainWireNormalAdultFiveWallCyclePhaseV1,
      number
    >>;
  }>;
  leftAtrialPressureWaves: Readonly<{
    aPeak: MainWireNormalAdultFiveWallCycleEventV1 &
      Readonly<{ pressureMmHg: number }>;
    xTrough: MainWireNormalAdultFiveWallCycleEventV1 &
      Readonly<{ pressureMmHg: number }>;
    vPeak: MainWireNormalAdultFiveWallCycleEventV1 &
      Readonly<{ pressureMmHg: number }>;
    yTrough: MainWireNormalAdultFiveWallCycleEventV1 &
      Readonly<{ pressureMmHg: number }>;
    xDescentMmHg: number;
    yDescentMmHg: number;
    volumeAtAPeakMl: number;
    aPeakDelayFromAtrialCalciumOnsetSec: number;
    /** Positive means the mitral A-flow peak follows the LA-pressure a peak. */
    aPressurePeakToMitralAFlowPeakSec: number;
    boosterEmptyingCompletedAtAPeakFraction: number | null;
    boosterEmptyingRemainingAtAPeakFraction: number | null;
    boosterEmptyingCompletedAtAPeakStatus:
      | "within-active-emptying"
      | "before-net-emptying"
      | "at-or-after-cycle-minimum"
      | "not-defined-no-net-booster-emptying";
    sequentialAcrossCycle: true;
  }>;
  ivrtLike: Readonly<{
    durationSec: number;
    sampleCount: number;
    relaxationTauSec: number | null;
    fitR2: number | null;
    fixedAsymptoteMmHg: number | null;
    reason: "available" | "insufficient-samples" | "non-decaying-fit";
  }>;
  workEnergy: Readonly<{
    stressWorkCoverageFraction: number;
    perWall: WallRecord<MainWireNormalAdultFiveWallCycleWallWorkLedgerV1>;
    laStressWorkOnWallByPhaseMilliJ: Readonly<Record<
      MainWireNormalAdultFiveWallCyclePhaseV1,
      StressWorkComponents
    >>;
    cavityWorkOnWallMilliJ: ChamberRecord<number>;
    commonPericardium: Readonly<{
      pressureWorkOnBagMilliJ: number;
      storedEnergyChangeMilliJ: number;
      backwardEulerRemainderMilliJ: number;
    }>;
    workConjugacyResidualMilliJ: Readonly<{
      leftAtrium: number;
      rightAtrium: number;
      ventriclesCombined: number;
      wholeHeart: number;
    }>;
  }>;
  claim:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V1;
}>;

const PA_PER_MMHG = 133.322;
const MMHG_ML_TO_MILLIJ = PA_PER_MMHG * 1e-3;

export function measureMainWireNormalAdultFiveWallCycleDiagnosticsV1(
  input: MainWireNormalAdultFiveWallCycleDiagnosticsInputV1,
): MainWireNormalAdultFiveWallCycleDiagnosticsV1 {
  validateInput(input);
  const samples = input.samples;
  const thresholdFraction = input.valveOpenThreshold?.peakFraction ?? 0.01;
  const thresholdFloor =
    input.valveOpenThreshold?.absoluteFloorMlPerSec ?? 1;
  const atrialOnsetIndex = nearestPhaseAtOrAfter(
    samples,
    input.atrialCalciumOnsetPhase01,
  );
  const mitral = detectValveCycle(
    samples.map((sample) => sample.flowMlPerSec.MV),
    thresholdFraction,
    thresholdFloor,
    atrialOnsetIndex,
    "mitral",
  );
  const aortic = detectValveCycle(
    samples.map((sample) => sample.flowMlPerSec.AoV),
    thresholdFraction,
    thresholdFloor,
    null,
    "aortic",
  );

  const reservoirIndices = cyclicHalfOpenIndices(
    samples.length,
    mitral.closingIndex,
    mitral.openingIndex,
  );
  const conduitIndices = cyclicHalfOpenIndices(
    samples.length,
    mitral.openingIndex,
    atrialOnsetIndex,
  );
  const pumpingIndices = cyclicHalfOpenIndices(
    samples.length,
    atrialOnsetIndex,
    mitral.closingIndex,
  );
  const phaseBySample = assignExhaustivePhases(
    samples.length,
    reservoirIndices,
    conduitIndices,
    pumpingIndices,
  );
  const phaseSampleCount = Object.freeze({
    reservoir: reservoirIndices.length,
    conduit: conduitIndices.length,
    pumping: pumpingIndices.length,
  });

  const pulmonaryVenous = Object.freeze({
    S: flowLedger(samples, reservoirIndices, input.dtSec, "PVein_LA"),
    D: flowLedger(samples, conduitIndices, input.dtSec, "PVein_LA"),
    Ar: flowLedger(samples, pumpingIndices, input.dtSec, "PVein_LA"),
  });
  const eWave = mitralWaveLedger(samples, conduitIndices, input.dtSec);
  const aWave = mitralWaveLedger(samples, pumpingIndices, input.dtSec);
  const eFlowPeakIndex = extremumIndex(
    samples,
    conduitIndices,
    (sample) => Math.max(sample.flowMlPerSec.MV, 0),
    "maximum",
  );
  const aFlowPeakIndex = extremumIndex(
    samples,
    pumpingIndices,
    (sample) => Math.max(sample.flowMlPerSec.MV, 0),
    "maximum",
  );
  const waveSeparation = measureMitralWaveSeparation(
    samples,
    eFlowPeakIndex,
    aFlowPeakIndex,
  );

  const laVolumes = samples.map((sample) => sample.nodeVolumeMl.LA);
  const maximumMl = Math.max(...laVolumes);
  const minimumMl = Math.min(...laVolumes);
  const preAMl = samples[atrialOnsetIndex]!.nodeVolumeMl.LA;
  const totalEmptyingMl = maximumMl - minimumMl;

  const vIndex = extremumIndex(
    samples,
    reservoirIndices,
    (sample) => sample.chamberTransmuralPressureMmHg.LA,
    "maximum",
  );
  const aIndex = extremumIndex(
    samples,
    pumpingIndices,
    (sample) => sample.chamberTransmuralPressureMmHg.LA,
    "maximum",
  );
  const aToVIndices = cyclicHalfOpenIndices(samples.length, aIndex, vIndex);
  const xIndex = extremumIndex(
    samples,
    aToVIndices,
    (sample) => sample.chamberTransmuralPressureMmHg.LA,
    "minimum",
  );
  const yIndex = extremumIndex(
    samples,
    conduitIndices,
    (sample) => sample.chamberTransmuralPressureMmHg.LA,
    "minimum",
  );
  const aPressure = pressureEvent(samples, aIndex);
  const xPressure = pressureEvent(samples, xIndex);
  const vPressure = pressureEvent(samples, vIndex);
  const yPressure = pressureEvent(samples, yIndex);

  const ivrtIndices = cyclicHalfOpenIndices(
    samples.length,
    aortic.closingIndex,
    mitral.openingIndex,
  );
  const tau = fitReportOnlyRelaxationTau(samples, ivrtIndices, input.dtSec);
  const workEnergy = measureWorkEnergy(input, phaseBySample);
  const boosterEmptyingMl = preAMl - minimumMl;
  const volumeAtAPeakMl = samples[aIndex]!.nodeVolumeMl.LA;
  const boosterCompletedAtAPeak = safeRatio(
    preAMl - volumeAtAPeakMl,
    boosterEmptyingMl,
  );
  const minimumVolumeIndex = laVolumes.indexOf(minimumMl);
  const boosterCompletedAtAPeakStatus = boosterEmptyingAtAPeakStatus(
    boosterCompletedAtAPeak,
    atrialOnsetIndex,
    aIndex,
    minimumVolumeIndex,
    samples.length,
  );

  return Object.freeze({
    diagnosticsId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_V1_ID,
    sampleCount: samples.length,
    dtSec: input.dtSec,
    phaseBySample: Object.freeze(phaseBySample),
    phaseSampleCount,
    events: Object.freeze({
      mitralValveOpening: event(samples, mitral.openingIndex),
      mitralValveClosure: event(samples, mitral.closingIndex),
      aorticValveClosure: event(samples, aortic.closingIndex),
      atrialCalciumOnset: event(samples, atrialOnsetIndex),
      mitralEventSource: "flow-threshold" as const,
      aorticEventSource: "flow-threshold" as const,
      mitralOpenThresholdMlPerSec: mitral.thresholdMlPerSec,
      aorticOpenThresholdMlPerSec: aortic.thresholdMlPerSec,
    }),
    pulmonaryVenous,
    mitral: Object.freeze({
      E: eWave,
      A: aWave,
      eFlowPeak: flowEvent(samples, eFlowPeakIndex, "MV"),
      aFlowPeak: flowEvent(samples, aFlowPeakIndex, "MV"),
      peakERatioToA: safeRatio(
        eWave.peakForwardMlPerSec,
        aWave.peakForwardMlPerSec,
      ),
      forwardVolumeERatioToA: safeRatio(
        eWave.forwardVolumeMl,
        aWave.forwardVolumeMl,
      ),
      flowAtAtrialCalciumOnsetMlPerSec:
        samples[atrialOnsetIndex]!.flowMlPerSec.MV,
      flowAtAtrialCalciumOnsetRatioToEPeak: safeRatio(
        samples[atrialOnsetIndex]!.flowMlPerSec.MV,
        eWave.peakForwardMlPerSec,
      ),
      waveSeparation,
    }),
    leftAtrialVolumes: Object.freeze({
      maximumMl,
      preAMl,
      minimumMl,
      reservoirExpansionMl: totalEmptyingMl,
      conduitEmptyingMl: maximumMl - preAMl,
      boosterEmptyingMl,
      conduitFractionOfTotalEmptying: safeRatio(
        maximumMl - preAMl,
        totalEmptyingMl,
      ),
      boosterFractionOfTotalEmptying: safeRatio(
        preAMl - minimumMl,
        totalEmptyingMl,
      ),
      eventAnchoredNetChangeMl: Object.freeze({
        reservoir:
          samples[mitral.openingIndex]!.nodeVolumeMl.LA -
          samples[mitral.closingIndex]!.nodeVolumeMl.LA,
        conduit:
          samples[atrialOnsetIndex]!.nodeVolumeMl.LA -
          samples[mitral.openingIndex]!.nodeVolumeMl.LA,
        pumping:
          samples[mitral.closingIndex]!.nodeVolumeMl.LA -
          samples[atrialOnsetIndex]!.nodeVolumeMl.LA,
      }),
    }),
    leftAtrialPressureWaves: Object.freeze({
      aPeak: aPressure,
      xTrough: xPressure,
      vPeak: vPressure,
      yTrough: yPressure,
      xDescentMmHg: aPressure.pressureMmHg - xPressure.pressureMmHg,
      yDescentMmHg: vPressure.pressureMmHg - yPressure.pressureMmHg,
      volumeAtAPeakMl,
      aPeakDelayFromAtrialCalciumOnsetSec: cyclicForwardSampleDelta(
        atrialOnsetIndex,
        aIndex,
        samples.length,
      ) * input.dtSec,
      aPressurePeakToMitralAFlowPeakSec: signedCyclicSampleDelta(
        aIndex,
        aFlowPeakIndex,
        samples.length,
      ) * input.dtSec,
      boosterEmptyingCompletedAtAPeakFraction: boosterCompletedAtAPeak,
      boosterEmptyingRemainingAtAPeakFraction:
        boosterCompletedAtAPeak === null ? null : 1 - boosterCompletedAtAPeak,
      boosterEmptyingCompletedAtAPeakStatus:
        boosterCompletedAtAPeakStatus,
      sequentialAcrossCycle: true as const,
    }),
    ivrtLike: Object.freeze({
      durationSec: ivrtIndices.length * input.dtSec,
      sampleCount: ivrtIndices.length,
      relaxationTauSec: tau.tauSec,
      fitR2: tau.r2,
      fixedAsymptoteMmHg: tau.asymptoteMmHg,
      reason: tau.reason,
    }),
    workEnergy,
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V1,
  });
}

function flowLedger(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  indices: readonly number[],
  dtSec: number,
  key: "PVein_LA",
): MainWireNormalAdultFiveWallFlowWindowLedgerV1 {
  let peakForwardMlPerSec = 0;
  let peakReverseMlPerSec = 0;
  let signedVolumeMl = 0;
  let forwardVolumeMl = 0;
  let reverseVolumeMl = 0;
  for (const index of indices) {
    const flow = samples[index]!.flowMlPerSec[key];
    peakForwardMlPerSec = Math.max(peakForwardMlPerSec, flow);
    peakReverseMlPerSec = Math.max(peakReverseMlPerSec, -flow);
    signedVolumeMl += flow * dtSec;
    forwardVolumeMl += Math.max(flow, 0) * dtSec;
    reverseVolumeMl += Math.max(-flow, 0) * dtSec;
  }
  return Object.freeze({
    sampleCount: indices.length,
    peakForwardMlPerSec,
    peakReverseMlPerSec,
    signedVolumeMl,
    forwardVolumeMl,
    reverseVolumeMl,
  });
}

function mitralWaveLedger(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  indices: readonly number[],
  dtSec: number,
): MainWireNormalAdultFiveWallMitralWaveLedgerV1 {
  let peakForwardMlPerSec = 0;
  let forwardVolumeMl = 0;
  let modeledAreaVtiCm = 0;
  let positiveFlowSamplesWithoutPhysicalArea = 0;
  for (const index of indices) {
    const sample = samples[index]!;
    const forwardFlow = Math.max(sample.flowMlPerSec.MV, 0);
    peakForwardMlPerSec = Math.max(peakForwardMlPerSec, forwardFlow);
    forwardVolumeMl += forwardFlow * dtSec;
    if (forwardFlow === 0) continue;
    const areaCm2 = sample.valveHydraulics.MV.physicalAreaCm2;
    if (areaCm2 > 0 && Number.isFinite(areaCm2)) {
      modeledAreaVtiCm += forwardFlow / areaCm2 * dtSec;
    } else {
      positiveFlowSamplesWithoutPhysicalArea += 1;
    }
  }
  return Object.freeze({
    sampleCount: indices.length,
    peakForwardMlPerSec,
    forwardVolumeMl,
    modeledAreaVtiCm:
      positiveFlowSamplesWithoutPhysicalArea === 0 ? modeledAreaVtiCm : null,
    positiveFlowSamplesWithoutPhysicalArea,
  });
}

function measureWorkEnergy(
  input: MainWireNormalAdultFiveWallCycleDiagnosticsInputV1,
  phaseBySample: readonly MainWireNormalAdultFiveWallCyclePhaseV1[],
): MainWireNormalAdultFiveWallCycleDiagnosticsV1["workEnergy"] {
  const samples = input.samples;
  const firstPairedIndex = input.precedingSample ? 0 : 1;
  const perWallMutable = Object.fromEntries(
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1.map((wallId) => [
      wallId,
      mutableWallLedger(),
    ]),
  ) as Record<MainWireNormalAdultFiveWallCycleWallIdV1, MutableWallLedger>;
  const laByPhase = {
    reservoir: mutableStressWork(),
    conduit: mutableStressWork(),
    pumping: mutableStressWork(),
  };
  const cavityWork: Record<"LA" | "LV" | "RA" | "RV", number> = {
    LA: 0,
    LV: 0,
    RA: 0,
    RV: 0,
  };
  let pericardialPressureWorkMilliJ = 0;

  for (let index = firstPairedIndex; index < samples.length; index += 1) {
    const next = samples[index]!;
    const previous = index === 0 ? input.precedingSample! : samples[index - 1]!;
    for (const wallId of MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1) {
      const factor = input.wallMaterialVolumeMlByWall[wallId] * 1e-3;
      const deltaStrain = next.wallFiberLogStrain[wallId] -
        previous.wallFiberLogStrain[wallId];
      const stress = next.wallStressPa[wallId];
      const target = perWallMutable[wallId];
      target.stress.total += stress.total * deltaStrain * factor;
      target.stress.active += stress.active * deltaStrain * factor;
      target.stress.passive += stress.passive * deltaStrain * factor;
      target.stress.sls += stress.sls * deltaStrain * factor;
      const energy = next.wallEnergyLedgerDensity[wallId];
      target.passiveStoredChange +=
        (energy.equilibriumPassiveStoredEnergyDensityJPerM3 -
          previous.wallEnergyLedgerDensity[wallId]
            .equilibriumPassiveStoredEnergyDensityJPerM3) * factor;
      target.slsStoredChange +=
        (energy.slsNextStoredEnergyDensityJPerM3 -
          energy.slsPreviousStoredEnergyDensityJPerM3) * factor;
      target.slsPhysical +=
        energy.slsPhysicalDissipationIncrementDensityJPerM3 * factor;
      target.slsNumerical +=
        energy.slsBackwardEulerNumericalDissipationIncrementDensityJPerM3 *
        factor;
      target.slsReportedResidual +=
        energy.slsDiscreteEnergyBalanceResidualJPerM3 * factor;
    }
    const phase = phaseBySample[index]!;
    const laFactor = input.wallMaterialVolumeMlByWall.LA * 1e-3;
    const laDeltaStrain = next.wallFiberLogStrain.LA -
      previous.wallFiberLogStrain.LA;
    for (const component of ["total", "active", "passive", "sls"] as const) {
      laByPhase[phase][component] +=
        next.wallStressPa.LA[component] * laDeltaStrain * laFactor;
    }
    for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
      cavityWork[chamber] += next.chamberTransmuralPressureMmHg[chamber] *
        (next.nodeVolumeMl[chamber] - previous.nodeVolumeMl[chamber]) *
        MMHG_ML_TO_MILLIJ;
    }
    const totalChamberVolumeChangeMl =
      (next.nodeVolumeMl.LA - previous.nodeVolumeMl.LA)
      + (next.nodeVolumeMl.LV - previous.nodeVolumeMl.LV)
      + (next.nodeVolumeMl.RA - previous.nodeVolumeMl.RA)
      + (next.nodeVolumeMl.RV - previous.nodeVolumeMl.RV);
    pericardialPressureWorkMilliJ +=
      next.commonPericardium.excessPressureMmHg
      * totalChamberVolumeChangeMl * MMHG_ML_TO_MILLIJ;
  }

  const perWall = wallRecord((wallId) => freezeWallLedger(perWallMutable[wallId]));
  const ventricularWallWork = perWall.LVFW.stressWorkOnWallMilliJ.total +
    perWall.SEP.stressWorkOnWallMilliJ.total +
    perWall.RVFW.stressWorkOnWallMilliJ.total;
  const ventricularCavityWork = cavityWork.LV + cavityWork.RV;
  const totalWallWork = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1
    .reduce((sum, wallId) =>
      sum + perWall[wallId].stressWorkOnWallMilliJ.total, 0);
  const totalCavityWork = cavityWork.LA + cavityWork.LV +
    cavityWork.RA + cavityWork.RV;
  const initialSample = input.precedingSample ?? samples[0]!;
  const finalSample = samples.at(-1)!;
  const pericardialStoredEnergyChangeMilliJ =
    finalSample.commonPericardium.storedEnergyMilliJ
    - initialSample.commonPericardium.storedEnergyMilliJ;
  return Object.freeze({
    stressWorkCoverageFraction:
      (samples.length - firstPairedIndex) / samples.length,
    perWall,
    laStressWorkOnWallByPhaseMilliJ: Object.freeze({
      reservoir: Object.freeze({ ...laByPhase.reservoir }),
      conduit: Object.freeze({ ...laByPhase.conduit }),
      pumping: Object.freeze({ ...laByPhase.pumping }),
    }),
    cavityWorkOnWallMilliJ: Object.freeze({ ...cavityWork }),
    commonPericardium: Object.freeze({
      pressureWorkOnBagMilliJ: pericardialPressureWorkMilliJ,
      storedEnergyChangeMilliJ: pericardialStoredEnergyChangeMilliJ,
      backwardEulerRemainderMilliJ:
        pericardialPressureWorkMilliJ
        - pericardialStoredEnergyChangeMilliJ,
    }),
    workConjugacyResidualMilliJ: Object.freeze({
      leftAtrium: perWall.LA.stressWorkOnWallMilliJ.total - cavityWork.LA,
      rightAtrium: perWall.RA.stressWorkOnWallMilliJ.total - cavityWork.RA,
      ventriclesCombined: ventricularWallWork - ventricularCavityWork,
      wholeHeart: totalWallWork - totalCavityWork,
    }),
  });
}

type MutableWallLedger = {
  stress: { total: number; active: number; passive: number; sls: number };
  passiveStoredChange: number;
  slsStoredChange: number;
  slsPhysical: number;
  slsNumerical: number;
  slsReportedResidual: number;
};

function mutableStressWork() {
  return { total: 0, active: 0, passive: 0, sls: 0 };
}

function mutableWallLedger(): MutableWallLedger {
  return {
    stress: mutableStressWork(),
    passiveStoredChange: 0,
    slsStoredChange: 0,
    slsPhysical: 0,
    slsNumerical: 0,
    slsReportedResidual: 0,
  };
}

function freezeWallLedger(
  value: MutableWallLedger,
): MainWireNormalAdultFiveWallCycleWallWorkLedgerV1 {
  const stress = Object.freeze({ ...value.stress });
  const reconstructed = stress.sls - value.slsStoredChange -
    value.slsPhysical - value.slsNumerical;
  return Object.freeze({
    stressWorkOnWallMilliJ: stress,
    stressAssemblyResidualMilliJ:
      stress.total - stress.active - stress.passive - stress.sls,
    equilibriumPassiveStoredEnergyChangeMilliJ: value.passiveStoredChange,
    equilibriumPassiveBackwardEulerRemainderMilliJ:
      stress.passive - value.passiveStoredChange,
    sls: Object.freeze({
      storedEnergyChangeMilliJ: value.slsStoredChange,
      physicalDissipationMilliJ: value.slsPhysical,
      backwardEulerNumericalDissipationMilliJ: value.slsNumerical,
      reportedDiscreteBalanceResidualMilliJ: value.slsReportedResidual,
      reconstructedDiscreteBalanceResidualMilliJ: reconstructed,
      readbackAgreementResidualMilliJ:
        reconstructed - value.slsReportedResidual,
    }),
  });
}

function fitReportOnlyRelaxationTau(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  indices: readonly number[],
  dtSec: number,
) {
  if (indices.length < 3) return Object.freeze({
    tauSec: null,
    r2: null,
    asymptoteMmHg: null,
    reason: "insufficient-samples" as const,
  });
  const pressures = indices.map((index) =>
    samples[index]!.chamberTransmuralPressureMmHg.LV);
  const asymptoteMmHg = Math.min(...pressures) - 1;
  const points = indices.map((index, pointIndex) => Object.freeze({
    x: pointIndex,
    y: Math.log(Math.max(
      samples[index]!.chamberTransmuralPressureMmHg.LV - asymptoteMmHg,
      1e-12,
    )),
  }));
  const meanX = mean(points.map((point) => point.x));
  const meanY = mean(points.map((point) => point.y));
  let ssXX = 0;
  let ssXY = 0;
  let ssYY = 0;
  for (const point of points) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    ssXX += dx * dx;
    ssXY += dx * dy;
    ssYY += dy * dy;
  }
  if (ssXX <= 1e-12 || ssYY <= 1e-12 || !(ssXY < 0)) {
    return Object.freeze({
      tauSec: null,
      r2: null,
      asymptoteMmHg,
      reason: "non-decaying-fit" as const,
    });
  }
  const slopePerSample = ssXY / ssXX;
  return Object.freeze({
    tauSec: -dtSec / slopePerSample,
    r2: Math.min(1, Math.max(0, ssXY * ssXY / (ssXX * ssYY))),
    asymptoteMmHg,
    reason: "available" as const,
  });
}

function detectValveCycle(
  flows: readonly number[],
  flowThresholdFraction: number,
  flowThresholdFloor: number,
  closureSearchStartIndex: number | null,
  label: string,
) {
  const peak = Math.max(...flows);
  const thresholdMlPerSec = Math.max(
    flowThresholdFloor,
    flowThresholdFraction * peak,
  );
  const transition = detectBinaryValveCycle(
    flows.map((flow) => flow > thresholdMlPerSec),
    closureSearchStartIndex,
    label,
  );
  if (transition === null) {
    throw new Error(`${label} signal has no cyclic opening and closing transition`);
  }
  return Object.freeze({
    ...transition,
    thresholdMlPerSec,
  });
}

function detectBinaryValveCycle(
  open: readonly boolean[],
  closureSearchStartIndex: number | null,
  label: string,
): Readonly<{ openingIndex: number; closingIndex: number }> | null {
  if (open.every(Boolean) || open.every((value) => !value)) {
    return null;
  }
  let openingIndex = -1;
  let bestClosedRun = -1;
  for (let index = 0; index < open.length; index += 1) {
    const previous = positiveModulo(index - 1, open.length);
    if (!open[index] || open[previous]) continue;
    let closedRun = 0;
    let cursor = previous;
    while (!open[cursor] && closedRun < open.length) {
      closedRun += 1;
      cursor = positiveModulo(cursor - 1, open.length);
    }
    if (closedRun > bestClosedRun) {
      bestClosedRun = closedRun;
      openingIndex = index;
    }
  }
  let closingIndex = -1;
  let cursor = closureSearchStartIndex === null
    ? openingIndex
    : closureSearchStartIndex;
  for (let guard = 0; guard < open.length; guard += 1) {
    const next = (cursor + 1) % open.length;
    if (closureSearchStartIndex !== null && next === openingIndex) break;
    if (open[cursor] && !open[next]) {
      closingIndex = next;
      break;
    }
    cursor = next;
  }
  if (openingIndex < 0 || closingIndex < 0) {
    throw new Error(`${label} transition detection failed`);
  }
  return Object.freeze({ openingIndex, closingIndex });
}

function measureMitralWaveSeparation(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  ePeakIndex: number,
  aPeakIndex: number,
): MainWireNormalAdultFiveWallCycleDiagnosticsV1["mitral"]["waveSeparation"] {
  const between = cyclicHalfOpenIndices(
    samples.length,
    (ePeakIndex + 1) % samples.length,
    aPeakIndex,
  );
  if (between.length === 0) return unresolvedMitralWaveSeparation();
  const valleyIndex = extremumIndex(
    samples,
    between,
    (sample) => Math.max(sample.flowMlPerSec.MV, 0),
    "minimum",
  );
  const ePeak = Math.max(samples[ePeakIndex]!.flowMlPerSec.MV, 0);
  const aPeak = Math.max(samples[aPeakIndex]!.flowMlPerSec.MV, 0);
  const valleyFlow = Math.max(samples[valleyIndex]!.flowMlPerSec.MV, 0);
  if (!(ePeak > 0 && aPeak > 0 && valleyFlow < ePeak && valleyFlow < aPeak)) {
    return unresolvedMitralWaveSeparation();
  }
  return Object.freeze({
    status: "separated" as const,
    criterion:
      "strict-intervening-forward-flow-valley-between-window-peaks" as const,
    valley: flowEvent(samples, valleyIndex, "MV"),
    valleyToLowerPeakRatio: valleyFlow / Math.min(ePeak, aPeak),
  });
}

function unresolvedMitralWaveSeparation():
MainWireNormalAdultFiveWallCycleDiagnosticsV1["mitral"]["waveSeparation"] {
  return Object.freeze({
    status: "fused-or-unresolved" as const,
    criterion:
      "strict-intervening-forward-flow-valley-between-window-peaks" as const,
    valley: null,
    valleyToLowerPeakRatio: null,
  });
}

function boosterEmptyingAtAPeakStatus(
  fraction: number | null,
  atrialOnsetIndex: number,
  aPeakIndex: number,
  minimumVolumeIndex: number,
  sampleCount: number,
): MainWireNormalAdultFiveWallCycleDiagnosticsV1[
  "leftAtrialPressureWaves"
]["boosterEmptyingCompletedAtAPeakStatus"] {
  if (fraction === null) return "not-defined-no-net-booster-emptying";
  if (fraction < 0) return "before-net-emptying";
  const aPeakProgress = cyclicForwardSampleDelta(
    atrialOnsetIndex,
    aPeakIndex,
    sampleCount,
  );
  const minimumProgress = cyclicForwardSampleDelta(
    atrialOnsetIndex,
    minimumVolumeIndex,
    sampleCount,
  );
  return aPeakProgress >= minimumProgress
    ? "at-or-after-cycle-minimum"
    : "within-active-emptying";
}

function assignExhaustivePhases(
  length: number,
  reservoir: readonly number[],
  conduit: readonly number[],
  pumping: readonly number[],
): MainWireNormalAdultFiveWallCyclePhaseV1[] {
  const output = Array<MainWireNormalAdultFiveWallCyclePhaseV1 | undefined>(
    length,
  );
  for (const [phase, indices] of Object.entries({
    reservoir,
    conduit,
    pumping,
  }) as [MainWireNormalAdultFiveWallCyclePhaseV1, readonly number[]][]) {
    for (const index of indices) {
      if (output[index] !== undefined) {
        throw new Error(`cycle phase windows overlap at sample ${index}`);
      }
      output[index] = phase;
    }
  }
  if (output.some((phase) => phase === undefined)) {
    throw new Error("cycle phase windows are not exhaustive");
  }
  return output as MainWireNormalAdultFiveWallCyclePhaseV1[];
}

function cyclicHalfOpenIndices(
  length: number,
  startIndex: number,
  endIndex: number,
): readonly number[] {
  if (startIndex === endIndex) return [];
  const output: number[] = [];
  let cursor = startIndex;
  for (let guard = 0; guard < length; guard += 1) {
    if (cursor === endIndex) return Object.freeze(output);
    output.push(cursor);
    cursor = (cursor + 1) % length;
  }
  throw new Error("cyclic half-open interval did not terminate");
}

function nearestPhaseAtOrAfter(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  targetPhase01: number,
): number {
  let bestIndex = 0;
  let bestProgress = Number.POSITIVE_INFINITY;
  for (let index = 0; index < samples.length; index += 1) {
    const progress = positiveModulo(
      samples[index]!.cyclePhase01 - targetPhase01,
      1,
    );
    if (progress < bestProgress) {
      bestProgress = progress;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function extremumIndex(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  indices: readonly number[],
  read: (sample: MainWireNormalAdultFiveWallCycleSampleV1) => number,
  kind: "minimum" | "maximum",
): number {
  if (indices.length === 0) throw new Error(`cannot measure ${kind} in empty window`);
  let best = indices[0]!;
  for (const index of indices.slice(1)) {
    const value = read(samples[index]!);
    const bestValue = read(samples[best]!);
    if ((kind === "minimum" && value < bestValue) ||
        (kind === "maximum" && value > bestValue)) best = index;
  }
  return best;
}

function event(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  sampleIndex: number,
): MainWireNormalAdultFiveWallCycleEventV1 {
  const sample = samples[sampleIndex]!;
  return Object.freeze({
    sampleIndex,
    phase01: sample.cyclePhase01,
    timeSec: sample.timeSec,
  });
}

function pressureEvent(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  sampleIndex: number,
) {
  return Object.freeze({
    ...event(samples, sampleIndex),
    pressureMmHg: samples[sampleIndex]!.chamberTransmuralPressureMmHg.LA,
  });
}

function flowEvent(
  samples: readonly MainWireNormalAdultFiveWallCycleSampleV1[],
  sampleIndex: number,
  flowId: "MV",
) {
  return Object.freeze({
    ...event(samples, sampleIndex),
    flowMlPerSec: samples[sampleIndex]!.flowMlPerSec[flowId],
  });
}

function cyclicForwardSampleDelta(
  startIndex: number,
  endIndex: number,
  sampleCount: number,
): number {
  return positiveModulo(endIndex - startIndex, sampleCount);
}

function signedCyclicSampleDelta(
  startIndex: number,
  endIndex: number,
  sampleCount: number,
): number {
  let delta = endIndex - startIndex;
  if (delta > sampleCount / 2) delta -= sampleCount;
  if (delta < -sampleCount / 2) delta += sampleCount;
  return delta;
}

function wallRecord<T>(
  build: (wallId: MainWireNormalAdultFiveWallCycleWallIdV1) => T,
): WallRecord<T> {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1.map((wallId) =>
      [wallId, build(wallId)]),
  )) as WallRecord<T>;
}

function safeRatio(numerator: number, denominator: number): number | null {
  return denominator > 0 && Number.isFinite(numerator) &&
    Number.isFinite(denominator) ? numerator / denominator : null;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}

function validateInput(
  input: MainWireNormalAdultFiveWallCycleDiagnosticsInputV1,
): void {
  if (input.samples.length < 4) throw new Error("cycle requires at least four samples");
  if (!(input.dtSec > 0) || !Number.isFinite(input.dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  if (!(input.atrialCalciumOnsetPhase01 >= 0 &&
      input.atrialCalciumOnsetPhase01 < 1)) {
    throw new Error("atrialCalciumOnsetPhase01 must lie in [0, 1)");
  }
  const peakFraction = input.valveOpenThreshold?.peakFraction ?? 0.01;
  const floor = input.valveOpenThreshold?.absoluteFloorMlPerSec ?? 1;
  if (!(peakFraction >= 0 && peakFraction < 1) || !Number.isFinite(peakFraction)) {
    throw new Error("valve peakFraction must lie in [0, 1)");
  }
  if (!(floor >= 0) || !Number.isFinite(floor)) {
    throw new Error("valve absolute floor must be nonnegative and finite");
  }
  for (const wallId of MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1) {
    const volume = input.wallMaterialVolumeMlByWall[wallId];
    if (!(volume > 0) || !Number.isFinite(volume)) {
      throw new Error(`${wallId} wall material volume must be positive and finite`);
    }
  }
  const values: number[] = [];
  for (const sample of input.samples) collectNumericLeaves(sample, values);
  if (input.precedingSample) collectNumericLeaves(input.precedingSample, values);
  if (!values.every(Number.isFinite)) throw new Error("cycle readback must be finite");
}

function collectNumericLeaves(value: unknown, target: number[]): void {
  if (typeof value === "number") {
    target.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectNumericLeaves(entry, target));
    return;
  }
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((entry) =>
      collectNumericLeaves(entry, target));
  }
}
