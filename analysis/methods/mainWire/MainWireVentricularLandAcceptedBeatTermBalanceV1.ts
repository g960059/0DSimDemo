import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  initializeLandSlsWallAtFixedInputV1,
  type LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  LAND2017_STATE_INDEX,
  evaluateLand2017AlgebraicTerms,
  land2017GammaSu,
  land2017GammaWu,
  land2017StrongToBlockedDeactivationRatePerSec,
  solveLand2017BackwardEulerStep,
} from "@/engine/myocardium/myofilament/land2017";

export const MAIN_WIRE_VENTRICULAR_LAND_ACCEPTED_BEAT_TERM_BALANCE_V1_ID =
  "main-wire-ventricular-land-accepted-beat-term-balance-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_ACCEPTED_BEAT_TERM_BALANCE_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-whole-heart-beat" as const,
    wall: "LVFW" as const,
    replay:
      "accepted-calcium-and-fiber-strain-with-one-backward-Euler-Land-step-per-sample" as const,
    replayFeedsBackIntoExactModel: false as const,
    activeStressStateEquation:
      "h*Tref/rs-times-S-times-one-plus-zetaS-plus-W-times-zetaW" as const,
    eventSamples:
      "one-percent-peak-aortic-flow-onset-peak-and-end-plus-valve-event-closure-opening-and-LVFW-stress-peak" as const,
    postEjectionWindow:
      "aortic-valve-closure-inclusive-to-mitral-valve-opening-exclusive" as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireVentricularLandAcceptedBeatTermReadbackV1 = Readonly<{
  phase01: number;
  landStretch: number;
  landStretchRatePerSec: number;
  freeCalciumUM: number;
  CaTRPN: number;
  blockedPopulationB: number;
  weakPopulationW: number;
  strongPopulationS: number;
  unboundPopulationU: number;
  zetaW: number;
  zetaS: number;
  lengthFactorH: number;
  weakDistortionLossRatePerSec: number;
  strongDistortionLossRatePerSec: number;
  strongToBlockedDeactivationRatePerSec: number;
  undistortedStrongStateTerm: number;
  strongDistortionStateTerm: number;
  weakDistortionStateTerm: number;
  netActiveStateTerm: number;
  netActiveStateTermFractionOfUndistortedStrong: number;
  undistortedStrongActiveKirchhoffStressKPa: number;
  distortionActiveKirchhoffStressKPa: number;
  netActiveKirchhoffStressKPa: number;
}>;

export type MainWireVentricularLandAcceptedBeatTermBalanceV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_VENTRICULAR_LAND_ACCEPTED_BEAT_TERM_BALANCE_V1_ID;
  source: Readonly<{
    protocolIdentityHash: string;
    beatIndex: number;
    dtSec: number;
    sampleCount: number;
    mechanicsProviderParameterIdentityHash: string;
    wallMaterialParameterSetId: string;
    landEquationParameterSetStableHash: string;
    periodicSteadyStateClaimed: boolean;
  }>;
  parameters: Readonly<{
    Aeff: number;
    phi: number;
    TrefPa: number;
    Aw: number;
    As: number;
    cwPerSec: number;
    csPerSec: number;
    ksuPerSec: number;
    weakDistortionRecoveryTimeSec: number;
    strongDistortionRecoveryTimeSec: number;
    weakConstantRateDistortionGainSec: number;
    strongConstantRateDistortionGainSec: number;
    gammaWPerSec: number;
    gammaSPerSec: number;
    maximumStrongToBlockedDeactivationRatePerSec: number;
  }>;
  replay: Readonly<{
    simulatedCycleCount: number;
    maximumStateClosureResidual: number;
    converged: boolean;
    maximumLandSolverResidualNorm: number;
    maximumRelativeRecordedStressResidual: number;
  }>;
  aorticEjectionEpisode: Readonly<{
    flowThresholdMlPerSec: number;
    onsetPhase01: number;
    peakPhase01: number;
    endPhase01: number;
    durationSec: number;
    minimumLandStretchRatePerSec: number;
    maximumShorteningRatePerSec: number;
    minimumNetActiveStateTermFractionOfUndistortedStrong: number;
    meanNetActiveStateTermFractionOfUndistortedStrong: number;
    meanDistortionStressFractionOfUndistortedStrongStress: number;
  }>;
  postEjectionIsovolumicRelaxation: Readonly<{
    aorticValveClosurePhase01: number;
    mitralValveOpeningPhase01: number;
    durationSec: number;
    sampleCount: number;
    positiveStrongDistortionSampleFraction: number;
    maximumPositiveStrongDistortion: number;
    maximumLandLengtheningRatePerSec: number;
    positiveLandLengtheningSampleFraction: number;
    firstPositiveLandLengtheningPhase01: number | null;
    timeFromAorticClosureToFirstPositiveLandLengtheningSec: number | null;
    integratedPositiveLandLengtheningExposure: number;
    maximumStrongDistortionLossRatePerSec: number;
    meanStrongDistortionLossRatePerSec: number;
    integratedStrongDistortionLossExposure: number;
    integratedBaselineStrongDetachmentPopulation: number;
    integratedDistortionStrongDetachmentPopulation: number;
    integratedStrongToBlockedDeactivationPopulation: number;
    integratedTotalStrongExitPopulation: number;
    distortionToBaselineStrongDetachmentRatio: number;
    deactivationToBaselineStrongDetachmentRatio: number;
    strongPopulationChange: number;
    strongPopulationFractionRemainingAtMitralOpening: number;
    netActiveStressFractionRemainingAtMitralOpening: number;
  }>;
  atAorticFlowOnset: MainWireVentricularLandAcceptedBeatTermReadbackV1;
  atAorticFlowPeak: MainWireVentricularLandAcceptedBeatTermReadbackV1;
  atAorticFlowEnd: MainWireVentricularLandAcceptedBeatTermReadbackV1;
  atAorticValveClosure:
    MainWireVentricularLandAcceptedBeatTermReadbackV1;
  atMitralValveOpening:
    MainWireVentricularLandAcceptedBeatTermReadbackV1;
  atLvfwActiveStressPeak:
    MainWireVentricularLandAcceptedBeatTermReadbackV1;
  claim:
    typeof MAIN_WIRE_VENTRICULAR_LAND_ACCEPTED_BEAT_TERM_BALANCE_CLAIM_V1;
}>;

type ReplayTrace = Readonly<{
  states: readonly Float64Array[];
  readbacks: readonly MainWireVentricularLandAcceptedBeatTermReadbackV1[];
  simulatedCycleCount: number;
  maximumStateClosureResidual: number;
  maximumLandSolverResidualNorm: number;
}>;

const MINIMUM_REPLAY_CYCLES = 2;
const MAXIMUM_REPLAY_CYCLES = 20;
const REPLAY_CLOSURE_TOLERANCE = 1e-9;

export function measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  material: LandSlsWallMaterialParamsV1,
  expectedMechanicsProviderParameterIdentityHash: string,
): MainWireVentricularLandAcceptedBeatTermBalanceV1 {
  if (
    result.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== expectedMechanicsProviderParameterIdentityHash
  ) throw new Error("Land term-balance mechanics provider identity mismatch");
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length < 3) {
    throw new Error("Land term balance requires a retained complete beat");
  }
  const samples = beat.samples;
  const cycle = summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(result)
    .cyclePhysiology;
  if (cycle === null) {
    throw new Error("Land term balance requires measurable valve events");
  }
  const flows = samples.map((sample) =>
    sample.valveHydraulics.AoV.flowMlPerSec);
  const maximumFlow = Math.max(...flows);
  const flowThresholdMlPerSec = Math.max(1, 0.01 * maximumFlow);
  const ejectionMask = flows.map((flow) =>
    flow > 0 && flow >= flowThresholdMlPerSec);
  const onsetIndex = ejectionMask.findIndex((active, index) =>
    active && !ejectionMask[cyclicIndex(index - 1, ejectionMask.length)]);
  const ejectionSampleCount = ejectionMask.filter(Boolean).length;
  if (onsetIndex < 0 || ejectionSampleCount === 0) {
    throw new Error("Land term balance requires one aortic ejection episode");
  }
  const endIndex = cyclicIndex(
    onsetIndex + ejectionSampleCount - 1,
    samples.length,
  );
  const flowPeakIndex = indexOfMaximum(flows);
  const recordedStressKPa = samples.map((sample) =>
    sample.wallStressPa.LVFW.active / 1000);
  const stressPeakIndex = indexOfMaximum(recordedStressKPa);
  const fiberLogStrains = samples.map((sample) =>
    sample.wallFiberLogStrain.LVFW);
  const calciumUM = samples.map((sample) => sample.freeCalciumUM.LVFW);
  const phases01 = samples.map((sample) => sample.cyclePhase01);
  const trace = replay(
    fiberLogStrains,
    calciumUM,
    phases01,
    result.dtSec,
    material,
  );
  const replayStressKPa = trace.readbacks.map((readback) =>
    readback.netActiveKirchhoffStressKPa);
  const maximumStressResidual = Math.max(...recordedStressKPa.map(
    (stress, index) => Math.abs(stress - replayStressKPa[index]!),
  ));
  const ejectionIndices = Array.from(
    { length: ejectionSampleCount },
    (_, offset) => cyclicIndex(onsetIndex + offset, samples.length),
  );
  const ejectionReadbacks = ejectionIndices.map((index) =>
    trace.readbacks[index]!);
  const aorticValveClosureIndex = cycle.events.aorticValveClosure.sampleIndex;
  const mitralValveOpeningIndex = cycle.events.mitralValveOpening.sampleIndex;
  const postEjectionIndices = cyclicHalfOpenIndices(
    samples.length,
    aorticValveClosureIndex,
    mitralValveOpeningIndex,
  );
  if (postEjectionIndices.length === 0) {
    throw new Error("Land term balance requires a post-ejection interval");
  }
  const postEjectionReadbacks = postEjectionIndices.map((index) =>
    trace.readbacks[index]!);
  const firstPositiveLengtheningOffset = postEjectionReadbacks.findIndex(
    (readback) => readback.landStretchRatePerSec > 0,
  );
  const atAorticValveClosure = trace.readbacks[aorticValveClosureIndex]!;
  const atMitralValveOpening = trace.readbacks[mitralValveOpeningIndex]!;
  const p = material.landEquationParameters.values;
  const d = material.landEquationParameters.derived;
  const integratedBaselineStrongDetachmentPopulation =
    postEjectionReadbacks.reduce((sum, readback) =>
      sum + d.ksu * readback.strongPopulationS * result.dtSec, 0);
  const integratedDistortionStrongDetachmentPopulation =
    postEjectionReadbacks.reduce((sum, readback) =>
      sum + readback.strongDistortionLossRatePerSec
        * readback.strongPopulationS * result.dtSec, 0);
  const integratedStrongToBlockedDeactivationPopulation =
    postEjectionReadbacks.reduce((sum, readback) =>
      sum + readback.strongToBlockedDeactivationRatePerSec
        * readback.strongPopulationS * result.dtSec, 0);
  return Object.freeze({
    methodId: MAIN_WIRE_VENTRICULAR_LAND_ACCEPTED_BEAT_TERM_BALANCE_V1_ID,
    source: Object.freeze({
      protocolIdentityHash: result.protocolIdentityHash,
      beatIndex: beat.beatIndex,
      dtSec: result.dtSec,
      sampleCount: samples.length,
      mechanicsProviderParameterIdentityHash:
        result.protocolIdentity.mechanicsProvider.parameterIdentityHash,
      wallMaterialParameterSetId: material.parameterSetId,
      landEquationParameterSetStableHash:
        material.landEquationParameters.parameterSetStableHash,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    }),
    parameters: Object.freeze({
      Aeff: p.Aeff,
      phi: p.phi,
      TrefPa: p.Tref,
      Aw: d.Aw,
      As: d.As,
      cwPerSec: d.cw,
      csPerSec: d.cs,
      ksuPerSec: d.ksu,
      weakDistortionRecoveryTimeSec: 1 / d.cw,
      strongDistortionRecoveryTimeSec: 1 / d.cs,
      weakConstantRateDistortionGainSec: d.Aw / d.cw,
      strongConstantRateDistortionGainSec: d.As / d.cs,
      gammaWPerSec: p.gammaW,
      gammaSPerSec: p.gammaS,
      maximumStrongToBlockedDeactivationRatePerSec:
        material.landEquationParameters.strongToBlockedDeactivation
          ?.maximumRatePerSec ?? 0,
    }),
    replay: Object.freeze({
      simulatedCycleCount: trace.simulatedCycleCount,
      maximumStateClosureResidual: trace.maximumStateClosureResidual,
      converged:
        trace.maximumStateClosureResidual <= REPLAY_CLOSURE_TOLERANCE,
      maximumLandSolverResidualNorm: trace.maximumLandSolverResidualNorm,
      maximumRelativeRecordedStressResidual:
        maximumStressResidual
        / Math.max(Math.max(...recordedStressKPa.map(Math.abs)), 1e-12),
    }),
    aorticEjectionEpisode: Object.freeze({
      flowThresholdMlPerSec,
      onsetPhase01: phases01[onsetIndex]!,
      peakPhase01: phases01[flowPeakIndex]!,
      endPhase01: phases01[endIndex]!,
      durationSec: ejectionSampleCount * result.dtSec,
      minimumLandStretchRatePerSec: Math.min(...ejectionReadbacks.map(
        (readback) => readback.landStretchRatePerSec)),
      maximumShorteningRatePerSec: Math.max(...ejectionReadbacks.map(
        (readback) => -readback.landStretchRatePerSec)),
      minimumNetActiveStateTermFractionOfUndistortedStrong:
        Math.min(...ejectionReadbacks.map((readback) =>
          readback.netActiveStateTermFractionOfUndistortedStrong)),
      meanNetActiveStateTermFractionOfUndistortedStrong:
        mean(ejectionReadbacks.map((readback) =>
          readback.netActiveStateTermFractionOfUndistortedStrong)),
      meanDistortionStressFractionOfUndistortedStrongStress:
        mean(ejectionReadbacks.map((readback) =>
          readback.distortionActiveKirchhoffStressKPa
          / Math.max(
            readback.undistortedStrongActiveKirchhoffStressKPa,
            1e-12,
        ))),
    }),
    postEjectionIsovolumicRelaxation: Object.freeze({
      aorticValveClosurePhase01: phases01[aorticValveClosureIndex]!,
      mitralValveOpeningPhase01: phases01[mitralValveOpeningIndex]!,
      durationSec: postEjectionIndices.length * result.dtSec,
      sampleCount: postEjectionIndices.length,
      positiveStrongDistortionSampleFraction:
        postEjectionReadbacks.filter((readback) => readback.zetaS > 0).length
        / postEjectionReadbacks.length,
      maximumPositiveStrongDistortion: Math.max(
        0,
        ...postEjectionReadbacks.map((readback) => readback.zetaS),
      ),
      maximumLandLengtheningRatePerSec: Math.max(
        ...postEjectionReadbacks.map((readback) =>
          readback.landStretchRatePerSec),
      ),
      positiveLandLengtheningSampleFraction:
        postEjectionReadbacks.filter((readback) =>
          readback.landStretchRatePerSec > 0).length
        / postEjectionReadbacks.length,
      firstPositiveLandLengtheningPhase01:
        firstPositiveLengtheningOffset < 0
          ? null
          : postEjectionReadbacks[firstPositiveLengtheningOffset]!.phase01,
      timeFromAorticClosureToFirstPositiveLandLengtheningSec:
        firstPositiveLengtheningOffset < 0
          ? null
          : firstPositiveLengtheningOffset * result.dtSec,
      integratedPositiveLandLengtheningExposure:
        postEjectionReadbacks.reduce((sum, readback) =>
          sum + Math.max(0, readback.landStretchRatePerSec) * result.dtSec,
        0),
      maximumStrongDistortionLossRatePerSec: Math.max(
        ...postEjectionReadbacks.map((readback) =>
          readback.strongDistortionLossRatePerSec),
      ),
      meanStrongDistortionLossRatePerSec: mean(
        postEjectionReadbacks.map((readback) =>
          readback.strongDistortionLossRatePerSec),
      ),
      integratedStrongDistortionLossExposure:
        postEjectionReadbacks.reduce((sum, readback) =>
          sum + readback.strongDistortionLossRatePerSec * result.dtSec, 0),
      integratedBaselineStrongDetachmentPopulation,
      integratedDistortionStrongDetachmentPopulation,
      integratedStrongToBlockedDeactivationPopulation,
      integratedTotalStrongExitPopulation:
        integratedBaselineStrongDetachmentPopulation
        + integratedDistortionStrongDetachmentPopulation
        + integratedStrongToBlockedDeactivationPopulation,
      distortionToBaselineStrongDetachmentRatio:
        integratedDistortionStrongDetachmentPopulation
        / Math.max(integratedBaselineStrongDetachmentPopulation, 1e-12),
      deactivationToBaselineStrongDetachmentRatio:
        integratedStrongToBlockedDeactivationPopulation
        / Math.max(integratedBaselineStrongDetachmentPopulation, 1e-12),
      strongPopulationChange:
        atMitralValveOpening.strongPopulationS
        - atAorticValveClosure.strongPopulationS,
      strongPopulationFractionRemainingAtMitralOpening:
        atMitralValveOpening.strongPopulationS
        / Math.max(atAorticValveClosure.strongPopulationS, 1e-12),
      netActiveStressFractionRemainingAtMitralOpening:
        atMitralValveOpening.netActiveKirchhoffStressKPa
        / Math.max(atAorticValveClosure.netActiveKirchhoffStressKPa, 1e-12),
    }),
    atAorticFlowOnset: trace.readbacks[onsetIndex]!,
    atAorticFlowPeak: trace.readbacks[flowPeakIndex]!,
    atAorticFlowEnd: trace.readbacks[endIndex]!,
    atAorticValveClosure,
    atMitralValveOpening,
    atLvfwActiveStressPeak: trace.readbacks[stressPeakIndex]!,
    claim: MAIN_WIRE_VENTRICULAR_LAND_ACCEPTED_BEAT_TERM_BALANCE_CLAIM_V1,
  });
}

function replay(
  fiberLogStrains: readonly number[],
  calciumUM: readonly number[],
  phases01: readonly number[],
  dtSec: number,
  material: LandSlsWallMaterialParamsV1,
): ReplayTrace {
  const initialFiberLogStrain = fiberLogStrains.at(-1)!;
  const cold = initializeLandSlsWallAtFixedInputV1(
    initialFiberLogStrain,
    calciumUM.at(-1)!,
    material,
  );
  if (!cold.converged) {
    throw new Error("Land term-balance cold initialization failed");
  }
  let state = cold.state.landState;
  let maximumStateClosureResidual = Number.POSITIVE_INFINITY;
  let maximumLandSolverResidualNorm = 0;
  let simulatedCycleCount = 0;
  let finalStates: Float64Array[] = [];
  let finalReadbacks:
    MainWireVentricularLandAcceptedBeatTermReadbackV1[] = [];
  for (let cycleIndex = 0; cycleIndex < MAXIMUM_REPLAY_CYCLES; cycleIndex += 1) {
    const cycleStart = Float64Array.from(state);
    let previousLandStretch =
      Math.exp(initialFiberLogStrain) * material.landSlackStretch;
    const states: Float64Array[] = [];
    const readbacks:
      MainWireVentricularLandAcceptedBeatTermReadbackV1[] = [];
    let cycleMaximumResidual = 0;
    for (let index = 0; index < fiberLogStrains.length; index += 1) {
      const landStretch =
        Math.exp(fiberLogStrains[index]!) * material.landSlackStretch;
      const landStretchRatePerSec =
        (landStretch - previousLandStretch) / dtSec;
      const solved = solveLand2017BackwardEulerStep(
        state,
        {
          freeCalciumUM: calciumUM[index]!,
          previousFiberEngineeringStrain: previousLandStretch - 1,
          stageFiberEngineeringStrain: landStretch - 1,
          dtSec,
          stage: { scheme: "BE", stageIndex: 0 },
        },
        {
          maxIterations: 20,
          residualTolerance: 1e-9,
          lineSearchMinStep: 1 / 4096,
        },
        material.landEquationParameters,
      );
      if (!solved.ok || solved.output === undefined) {
        throw new Error(
          `Land term-balance replay failed: ${solved.failureReason ?? "unknown"}`,
        );
      }
      state = solved.nextState;
      states.push(Float64Array.from(state));
      readbacks.push(readback(
        state,
        phases01[index]!,
        landStretch,
        landStretchRatePerSec,
        calciumUM[index]!,
        material,
      ));
      previousLandStretch = landStretch;
      cycleMaximumResidual = Math.max(
        cycleMaximumResidual,
        solved.residualNorm,
      );
    }
    simulatedCycleCount = cycleIndex + 1;
    maximumStateClosureResidual = maximumArrayDifference(cycleStart, state);
    maximumLandSolverResidualNorm = cycleMaximumResidual;
    finalStates = states;
    finalReadbacks = readbacks;
    if (
      simulatedCycleCount >= MINIMUM_REPLAY_CYCLES
      && maximumStateClosureResidual <= REPLAY_CLOSURE_TOLERANCE
    ) break;
  }
  return Object.freeze({
    states: Object.freeze(finalStates),
    readbacks: Object.freeze(finalReadbacks),
    simulatedCycleCount,
    maximumStateClosureResidual,
    maximumLandSolverResidualNorm,
  });
}

function readback(
  state: ArrayLike<number>,
  phase01: number,
  landStretch: number,
  landStretchRatePerSec: number,
  freeCalciumUM: number,
  material: LandSlsWallMaterialParamsV1,
): MainWireVentricularLandAcceptedBeatTermReadbackV1 {
  const p = material.landEquationParameters.values;
  const terms = evaluateLand2017AlgebraicTerms(
    state,
    { fiberEngineeringStrain: landStretch - 1 },
    material.landEquationParameters,
  );
  const CaTRPN = state[LAND2017_STATE_INDEX.CaTRPN]!;
  const blockedPopulationB = state[LAND2017_STATE_INDEX.B]!;
  const weakPopulationW = state[LAND2017_STATE_INDEX.W]!;
  const strongPopulationS = state[LAND2017_STATE_INDEX.S]!;
  const zetaW = state[LAND2017_STATE_INDEX.zetaW]!;
  const zetaS = state[LAND2017_STATE_INDEX.zetaS]!;
  const unboundPopulationU =
    1 - blockedPopulationB - weakPopulationW - strongPopulationS;
  const undistortedStrongStateTerm = strongPopulationS;
  const strongDistortionStateTerm = strongPopulationS * zetaS;
  const weakDistortionStateTerm = weakPopulationW * zetaW;
  const netActiveStateTerm = undistortedStrongStateTerm
    + strongDistortionStateTerm + weakDistortionStateTerm;
  const stressScaleKPa = landStretch
    * material.orientationFraction01
    * material.viableActiveFraction01
    * terms.h * p.Tref / p.rs / 1000;
  return Object.freeze({
    phase01,
    landStretch,
    landStretchRatePerSec,
    freeCalciumUM,
    CaTRPN,
    blockedPopulationB,
    weakPopulationW,
    strongPopulationS,
    unboundPopulationU,
    zetaW,
    zetaS,
    lengthFactorH: terms.h,
    weakDistortionLossRatePerSec: land2017GammaWu(zetaW, p),
    strongDistortionLossRatePerSec: land2017GammaSu(zetaS, p),
    strongToBlockedDeactivationRatePerSec:
      land2017StrongToBlockedDeactivationRatePerSec(
        CaTRPN,
        material.landEquationParameters,
        {
          freeCalciumUM,
          fiberEngineeringStrain: landStretch - 1,
        },
      ),
    undistortedStrongStateTerm,
    strongDistortionStateTerm,
    weakDistortionStateTerm,
    netActiveStateTerm,
    netActiveStateTermFractionOfUndistortedStrong:
      netActiveStateTerm / Math.max(strongPopulationS, 1e-12),
    undistortedStrongActiveKirchhoffStressKPa:
      stressScaleKPa * undistortedStrongStateTerm,
    distortionActiveKirchhoffStressKPa:
      stressScaleKPa
      * (strongDistortionStateTerm + weakDistortionStateTerm),
    netActiveKirchhoffStressKPa: stressScaleKPa * netActiveStateTerm,
  });
}

function cyclicIndex(index: number, count: number): number {
  const resolved = index % count;
  return resolved < 0 ? resolved + count : resolved;
}

function cyclicHalfOpenIndices(
  count: number,
  startInclusive: number,
  endExclusive: number,
): readonly number[] {
  const length = cyclicIndex(endExclusive - startInclusive, count);
  return Object.freeze(Array.from(
    { length },
    (_, offset) => cyclicIndex(startInclusive + offset, count),
  ));
}

function indexOfMaximum(values: readonly number[]): number {
  if (values.length === 0) throw new Error("indexOfMaximum requires values");
  let maximumIndex = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index]! > values[maximumIndex]!) maximumIndex = index;
  }
  return maximumIndex;
}

function maximumArrayDifference(
  first: ArrayLike<number>,
  second: ArrayLike<number>,
): number {
  if (first.length !== second.length) {
    throw new Error("Land term-balance state lengths differ");
  }
  let maximumDifference = 0;
  for (let index = 0; index < first.length; index += 1) {
    maximumDifference = Math.max(
      maximumDifference,
      Math.abs(first[index]! - second[index]!),
    );
  }
  return maximumDifference;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("mean requires values");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
