import {
  countMainWireStrictLocalMaximaV1,
  mainWirePeriodicSpectralEnergyFractionV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";
import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  idealBernoulliLossFromEffectiveOrificeAreaV2,
  solveExactSignedLinearQuadraticValveFlowV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_REPLAY_V1_ID =
  "main-wire-aortic-valve-local-inertance-replay-v1" as const;

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_REPLAY_PROFILE_IDS_V1 =
  Object.freeze([
    "zero-local-inertance-control",
    "historical-topology-local-inertance",
  ] as const);

export type MainWireAorticValveLocalInertanceReplayProfileIdV1 =
  (typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_REPLAY_PROFILE_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_REPLAY_CLAIM_V1 =
  Object.freeze({
    role: "analysis-only-one-way-periodic-waveform-replay" as const,
    source: "last-retained-complete-beat" as const,
    prescribedInputs:
      "source-LV-minus-Ao-pressure-and-source-forward-active-EOA" as const,
    recurrence:
      "backward-Euler-L-dqdt-plus-current-linear-and-EOA-derived-quadratic-loss" as const,
    competentValveConstraint: "semismooth-q-greater-than-or-equal-to-zero" as const,
    closedZeroAreaContact: "flow-reset-to-zero" as const,
    closureImpactEnergyResolved: false as const,
    pressureOrMechanicsFeedbackApplied: false as const,
    leafletOpeningFeedbackApplied: false as const,
    exactModelStateOrCheckpointChanged: false as const,
    coupledModelAcceptanceEstablished: false as const,
    smoothingAppliedToWaveform: false as const,
    parameterSearchOrFitting: false as const,
  });

export type MainWireAorticValveLocalInertanceReplayMetricsV1 = Readonly<{
  profileId: MainWireAorticValveLocalInertanceReplayProfileIdV1;
  localInertanceMmHgSec2PerMl: number;
  periodicReplayIterationCount: number;
  periodicBoundaryResidualMlPerSec: number;
  maximumFlowMlPerSec: number;
  forwardVolumeMl: number;
  forwardFlowTimeSec: number;
  flowPeakCountAboveFivePercent: number;
  flowAcEnergyFraction10To50Hz: number;
  maximumPositiveFlowAccelerationMlPerSec2: number;
  centralFlowDerivativeAtMaximumMlPerSec2: number;
  peakAbsoluteLocalInertialPressureMmHg: number;
  localInertialPressureAtFlowMaximumMmHg: number;
  forwardFlowTimeMeanDopplerGradientMmHg: number;
  peakDopplerGradientMmHg: number;
  maximumAbsoluteMomentumResidualOnUnconstrainedSamplesMmHg: number;
  closureConstraintActiveSampleCount: number;
  maximumClosureProjectionDeltaMlPerSec: number;
  maximumAbsoluteFlowDifferenceFromExactSourceMlPerSec: number;
  rmsFlowDifferenceFromExactSourceMlPerSec: number;
}>;

export type MainWireAorticValveLocalInertanceReplayV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_REPLAY_V1_ID;
  source: Readonly<{
    protocolIdentityHash: string;
    beatIndex: number;
    dtSec: number;
    sampleCount: number;
    topologyHistoricalAorticValveInertanceMmHgSec2PerMl: number;
    configuredBackgroundLinearResistanceMmHgSecPerMl: number;
  }>;
  profiles: readonly MainWireAorticValveLocalInertanceReplayMetricsV1[];
  claim: typeof MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_REPLAY_CLAIM_V1;
}>;

type ReplayCycle = Readonly<{
  flowsMlPerSec: readonly number[];
  rawFlowsMlPerSec: readonly number[];
  momentumResidualsMmHg: readonly number[];
  constrained: readonly boolean[];
  finalFlowMlPerSec: number;
}>;

export function replayMainWireAorticValveLocalInertanceV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireAorticValveLocalInertanceReplayV1 {
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error("AoV local-inertance replay requires a complete beat");
  }
  const topologyEdge = result.protocolIdentity.circulation
    .topologyGraphSnapshot.edges.find((edge) => edge.name === "AoV");
  if (
    topologyEdge === undefined
    || topologyEdge.kind !== "valve"
    || topologyEdge.up !== "LV"
    || topologyEdge.down !== "Ao"
    || !(topologyEdge.L !== undefined && topologyEdge.L > 0)
  ) {
    throw new Error("AoV local-inertance replay requires historical topology L");
  }
  const linearResistance = result.valveResearchInput.valves.AoV
    .backgroundLinearResistanceMmHgSecPerMl;
  if (!(linearResistance >= 0) || !Number.isFinite(linearResistance)) {
    throw new Error("AoV replay linear resistance must be finite and nonnegative");
  }
  const sourceFlows = beat.samples.map((sample) =>
    sample.circulationEdgeFlowMlPerSec.AoV);
  const profiles = MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_REPLAY_PROFILE_IDS_V1
    .map((profileId) => measureProfile(
      profileId,
      profileId === "zero-local-inertance-control" ? 0 : topologyEdge.L!,
      beat.samples,
      sourceFlows,
      result.dtSec,
      linearResistance,
    ));
  const control = profiles[0]!;
  if (control.maximumAbsoluteFlowDifferenceFromExactSourceMlPerSec > 1e-8) {
    throw new Error(
      "zero-inertance replay does not reproduce the exact source valve law",
    );
  }
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_REPLAY_V1_ID,
    source: Object.freeze({
      protocolIdentityHash: result.protocolIdentityHash,
      beatIndex: beat.beatIndex,
      dtSec: result.dtSec,
      sampleCount: beat.samples.length,
      topologyHistoricalAorticValveInertanceMmHgSec2PerMl: topologyEdge.L,
      configuredBackgroundLinearResistanceMmHgSecPerMl: linearResistance,
    }),
    profiles: Object.freeze(profiles),
    claim: MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_REPLAY_CLAIM_V1,
  });
}

function measureProfile(
  profileId: MainWireAorticValveLocalInertanceReplayProfileIdV1,
  localInertance: number,
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  sourceFlows: readonly number[],
  dtSec: number,
  linearResistance: number,
): MainWireAorticValveLocalInertanceReplayMetricsV1 {
  let boundaryFlow = 0;
  let cycle = replayCycle(
    samples,
    dtSec,
    linearResistance,
    localInertance,
    boundaryFlow,
  );
  let iterationCount = 1;
  while (
    Math.abs(cycle.finalFlowMlPerSec - boundaryFlow) > 1e-10
    && iterationCount < 256
  ) {
    boundaryFlow = cycle.finalFlowMlPerSec;
    cycle = replayCycle(
      samples,
      dtSec,
      linearResistance,
      localInertance,
      boundaryFlow,
    );
    iterationCount += 1;
  }
  const periodicBoundaryResidual = cycle.finalFlowMlPerSec - boundaryFlow;
  if (Math.abs(periodicBoundaryResidual) > 1e-8) {
    throw new Error(`${profileId} did not reach a periodic replay boundary`);
  }
  const flows = cycle.flowsMlPerSec;
  const derivatives = backwardDifferences(flows, dtSec, boundaryFlow);
  const maximumFlowIndex = indexOfMaximum(flows);
  const maximumFlow = flows[maximumFlowIndex]!;
  const forwardIndices = samples.flatMap((_, index) =>
    flows[index]! > 0 ? [index] : []);
  const dopplerGradients = forwardIndices.map((index) => {
    const area = samples[index]!.valveHydraulics.AoV.forwardActiveEoaCm2;
    return 4 * (flows[index]! / (100 * area)) ** 2;
  });
  const flowDifferences = flows.map((flow, index) =>
    flow - sourceFlows[index]!);
  const threshold = 0.05 * maximumFlow;
  return Object.freeze({
    profileId,
    localInertanceMmHgSec2PerMl: localInertance,
    periodicReplayIterationCount: iterationCount,
    periodicBoundaryResidualMlPerSec: periodicBoundaryResidual,
    maximumFlowMlPerSec: maximumFlow,
    forwardVolumeMl: flows.reduce((sum, flow) =>
      sum + Math.max(0, flow) * dtSec, 0),
    forwardFlowTimeSec: forwardIndices.length * dtSec,
    flowPeakCountAboveFivePercent:
      countMainWireStrictLocalMaximaV1(flows, threshold),
    flowAcEnergyFraction10To50Hz:
      mainWirePeriodicSpectralEnergyFractionV1(flows, dtSec, 10, 50),
    maximumPositiveFlowAccelerationMlPerSec2:
      Math.max(0, maximum(derivatives)),
    centralFlowDerivativeAtMaximumMlPerSec2:
      centralDerivative(flows, maximumFlowIndex, dtSec, boundaryFlow),
    peakAbsoluteLocalInertialPressureMmHg:
      localInertance * maximum(derivatives.map(Math.abs)),
    localInertialPressureAtFlowMaximumMmHg:
      localInertance
        * centralDerivative(flows, maximumFlowIndex, dtSec, boundaryFlow),
    forwardFlowTimeMeanDopplerGradientMmHg: mean(dopplerGradients),
    peakDopplerGradientMmHg: maximum(dopplerGradients),
    maximumAbsoluteMomentumResidualOnUnconstrainedSamplesMmHg: maximum(
      cycle.momentumResidualsMmHg.flatMap((residual, index) =>
        cycle.constrained[index]! ? [] : [Math.abs(residual)]),
    ),
    closureConstraintActiveSampleCount:
      cycle.constrained.filter(Boolean).length,
    maximumClosureProjectionDeltaMlPerSec: maximum(
      cycle.rawFlowsMlPerSec.map((raw, index) =>
        Math.abs(flows[index]! - raw)),
    ),
    maximumAbsoluteFlowDifferenceFromExactSourceMlPerSec:
      maximum(flowDifferences.map(Math.abs)),
    rmsFlowDifferenceFromExactSourceMlPerSec:
      rootMeanSquare(flowDifferences),
  });
}

function replayCycle(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  dtSec: number,
  linearResistance: number,
  localInertance: number,
  initialFlowMlPerSec: number,
): ReplayCycle {
  const flows: number[] = [];
  const rawFlows: number[] = [];
  const residuals: number[] = [];
  const constrained: boolean[] = [];
  let previousFlow = initialFlowMlPerSec;
  for (const sample of samples) {
    const pressureGradient = sample.circulationNodeAbsolutePressureMmHg.LV
      - sample.circulationNodeAbsolutePressureMmHg.Ao;
    const area = sample.valveHydraulics.AoV.forwardActiveEoaCm2;
    if (!(area > 0)) {
      rawFlows.push(0);
      flows.push(0);
      residuals.push(0);
      constrained.push(previousFlow !== 0 || pressureGradient !== 0);
      previousFlow = 0;
      continue;
    }
    const bernoulli = idealBernoulliLossFromEffectiveOrificeAreaV2(area);
    const effectiveGradient = pressureGradient
      + localInertance * previousFlow / dtSec;
    const effectiveResistance = linearResistance + localInertance / dtSec;
    const rawFlow = solveExactSignedLinearQuadraticValveFlowV2(
      effectiveGradient,
      effectiveResistance,
      bernoulli,
    );
    const flow = Math.max(0, rawFlow);
    const momentumResidual = localInertance * (flow - previousFlow) / dtSec
      + linearResistance * flow + bernoulli * flow * Math.abs(flow)
      - pressureGradient;
    rawFlows.push(rawFlow);
    flows.push(flow);
    residuals.push(momentumResidual);
    constrained.push(flow !== rawFlow);
    previousFlow = flow;
  }
  return Object.freeze({
    flowsMlPerSec: Object.freeze(flows),
    rawFlowsMlPerSec: Object.freeze(rawFlows),
    momentumResidualsMmHg: Object.freeze(residuals),
    constrained: Object.freeze(constrained),
    finalFlowMlPerSec: previousFlow,
  });
}

function backwardDifferences(
  values: readonly number[],
  dtSec: number,
  precedingValue: number,
): readonly number[] {
  return Object.freeze(values.map((value, index) =>
    (value - (index === 0 ? precedingValue : values[index - 1]!)) / dtSec));
}

function centralDerivative(
  values: readonly number[],
  index: number,
  dtSec: number,
  precedingValue: number,
): number {
  const previous = index === 0 ? precedingValue : values[index - 1]!;
  const next = index === values.length - 1 ? values[0]! : values[index + 1]!;
  return (next - previous) / (2 * dtSec);
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  return result === Number.NEGATIVE_INFINITY ? 0 : result;
}

function indexOfMaximum(values: readonly number[]): number {
  let index = 0;
  for (let candidate = 1; candidate < values.length; candidate += 1) {
    if (values[candidate]! > values[index]!) index = candidate;
  }
  return index;
}

function mean(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rootMeanSquare(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : Math.sqrt(
      values.reduce((sum, value) => sum + value ** 2, 0) / values.length,
    );
}
