import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  validateMainWireFourValveDiseaseResearchInputV1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";

export const MAIN_WIRE_VALVE_DISEASE_CYCLE_METRICS_V1_ID =
  "main-wire-valve-disease-cycle-metrics-v1" as const;

export const MAIN_WIRE_VALVE_DISEASE_CYCLE_METRICS_CLAIM_V1 = Object.freeze({
  source: "last-retained-complete-beat" as const,
  acceptedDiagnosticReadbackOnly: true as const,
  partialBeatUsed: false as const,
  computationRequiresPeriod1Convergence: false as const,
  interpretationEligibility:
    "exactly-the-periodicSteadyStateClaimed-readback" as const,
  integration:
    "accepted-end-step-rectangles-with-fixed-dt-no-interpolation" as const,
  volumeAccounting:
    "all-signed-algebraic-flow-samples-without-episode-thresholding" as const,
  gradientAccounting:
    "strictly-positive-forward-flow-samples-without-episode-thresholding" as const,
  jetVelocityConstruction:
    "absolute-directional-q-divided-by-100-times-direction-selected-active-EOA" as const,
  simplifiedDopplerGradient:
    "4-times-forward-jet-velocity-squared-distinct-from-node-pressure-gradient" as const,
  meanDopplerDecomposition:
    "fully-open-uniform-flow-lower-bound-times-dynamic-area-penalty-times-jet-velocity-waveform-nonuniformity" as const,
  meanDopplerDecompositionUsesSameStrictlyPositiveFlowSamples:
    true as const,
  episodeThreshold:
    "max-of-1-mL-per-sec-and-1-percent-of-same-valve-cycle-max-absolute-flow" as const,
  episodeCounting: "cyclic-binary-runs-no-smoothing" as const,
  openingActivityThreshold01: 0.01 as const,
  expectedReversePhaseOwner:
    "longest-cyclic-forward-flow-threshold-inactive-run" as const,
  expectedReversePhaseSemantics:
    "systolic-closure-for-AV-valves-diastolic-closure-for-semilunar-valves" as const,
  expectedReversePhaseIsProxyNotIndependentPhysiologicalEventOwner:
    true as const,
  smoothingUsed: false as const,
  clinicalThresholdOrPassFailJudgment: false as const,
});

export const MAIN_WIRE_VALVE_DISEASE_CYCLE_VALVE_IDS_V1 = Object.freeze([
  "MV",
  "AoV",
  "TV",
  "PV",
] as const);

export type MainWireValveDiseaseCycleValveIdV1 =
  (typeof MAIN_WIRE_VALVE_DISEASE_CYCLE_VALVE_IDS_V1)[number];

export type MainWireValveDiseasePerValveCycleMetricsV1 = Readonly<{
  valveId: MainWireValveDiseaseCycleValveIdV1;
  configuredMaximumForwardEoaCm2: number;
  configuredClosedReverseEroaCm2: number;
  maximumAbsoluteFlowMlPerSec: number;
  episodeFlowThresholdMlPerSec: number;
  /** Integral of max(q, 0), including sub-threshold flow. */
  forwardVolumeMl: number;
  /** Positive magnitude of the integral of min(q, 0). */
  reverseVolumeMl: number;
  /** forwardVolumeMl - reverseVolumeMl. */
  netVolumeMl: number;
  /** V-/V+; null only when the same valve has no forward volume. */
  sameValveRegurgitantFraction: number | null;
  /** Duration of all samples with q > 0, used by the time mean below. */
  forwardFlowTimeSec: number;
  /** Time mean over the same strictly-positive-flow samples. */
  forwardFlowTimeMeanFlowMlPerSec: number;
  /** Node-to-node model gradient, not an echocardiographic Doppler gradient. */
  forwardFlowTimeMeanGradientMmHg: number;
  /** Node-to-node model gradient, flow-volume weighted. */
  forwardFlowWeightedMeanGradientMmHg: number;
  /** Peak node-to-node model gradient. */
  peakForwardGradientMmHg: number;
  peakForwardJetVelocityMPerSec: number;
  forwardFlowTimeMeanJetVelocityMPerSec: number;
  forwardFlowRmsJetVelocityMPerSec: number;
  /** Time mean of the clinical simplified-Bernoulli readback 4 v^2. */
  forwardFlowTimeMeanSimplifiedDopplerGradientMmHg: number;
  /**
   * 4 (mean(q)/(100 Amax))^2: the fixed-volume, fixed-duration lower bound
   * for a fully open valve with a uniform forward-flow waveform.
   */
  fullyOpenUniformFlowDopplerGradientLowerBoundMmHg: number;
  /** (mean(v)/(mean(q)/(100 Amax)))^2; at least one absent roundoff. */
  dynamicAreaDopplerPenaltyFactor: number;
  /** mean(v^2)/mean(v)^2; the Cauchy waveform nonuniformity factor. */
  jetVelocityWaveformNonuniformityFactor: number;
  /** Exact product of the dynamic-area and waveform factors. */
  meanDopplerExcessOverFullyOpenUniformFlowFactor: number;
  /** Peak clinical simplified-Bernoulli readback 4 v^2. */
  peakSimplifiedDopplerGradientMmHg: number;
  peakReverseJetVelocityMPerSec: number;
  forwardEpisodeCount: number;
  /** Total threshold-active sample duration across all cyclic episodes. */
  forwardEpisodeDurationSec: number;
  reverseEpisodeCount: number;
  /** Total threshold-active sample duration across all cyclic episodes. */
  reverseEpisodeDurationSec: number;
  expectedReversePhase:
    | "systolic-longest-forward-closed-run"
    | "diastolic-longest-forward-closed-run";
  expectedReversePhaseAvailable: boolean;
  expectedReversePhaseStartSampleIndex: number | null;
  expectedReversePhaseSampleCount: number | null;
  expectedReversePhaseDurationSec: number | null;
  reverseVolumeWithinExpectedPhaseMl: number | null;
  reverseVolumeOutsideExpectedPhaseMl: number | null;
  reverseVolumeWithinExpectedPhaseFraction: number | null;
  openingTargetEpisodeCount: number;
  leafletOpeningEpisodeCount: number;
  activeDirectionTransitionCount: number;
  competentReverseClosureEpisodeCount: number;
  subthresholdForwardSupportEpisodeCount: number;
  maximumAbsoluteOpeningEquationResidual01: number;
  dissipatedCycleEnergyMmHgMl: number;
  linearDissipatedCycleEnergyMmHgMl: number;
  bernoulliDissipatedCycleEnergyMmHgMl: number;
  linearFractionOfDissipatedCycleEnergy: number | null;
  peakAbsoluteLinearPressureLossMmHg: number;
  peakAbsoluteBernoulliPressureLossMmHg: number;
  maximumAbsoluteDissipatedPowerDecompositionResidualMmHgMlPerSec: number;
  minimumHydraulicInputPowerMmHgMlPerSec: number;
  maximumAbsolutePowerResidualMmHgMlPerSec: number;
}>;

export type MainWireValveDiseaseGlobalCycleMetricsV1 = Readonly<{
  netVolumeMlByValve: Readonly<Record<
    MainWireValveDiseaseCycleValveIdV1,
    number
  >>;
  /** Signed AoV net volume minus PV net volume. */
  aorticMinusPulmonaryNetStrokeVolumeMl: number;
  absoluteAorticPulmonaryNetStrokeMismatchMl: number;
  /** Signed MV net inflow minus AoV net outflow over the selected beat. */
  leftVentricularValveBalanceMl: number;
  /** Signed TV net inflow minus PV net outflow over the selected beat. */
  rightVentricularValveBalanceMl: number;
  /** Signed MV net volume minus TV net volume. */
  mitralMinusTricuspidNetStrokeVolumeMl: number;
}>;

export type MainWireValveDiseaseCycleMetricsV1 = Readonly<{
  metricsId: typeof MAIN_WIRE_VALVE_DISEASE_CYCLE_METRICS_V1_ID;
  source: Readonly<{
    beatIndex: number;
    startTimeSec: number;
    endTimeSec: number;
    sampleCount: number;
    dtSec: number;
    sampledCycleDurationSec: number;
    periodicSteadyStateClaimed: boolean;
    protocolIdentityHash: string;
    valveResearchInput: Readonly<{
      researchInputId: string;
      parameterSetId: string;
      parameterIdentityHash: string;
      bracketIds: readonly string[];
    }>;
  }>;
  /** Metrics are always computed; only interpretation is gated by periodicity. */
  interpretationEligible: boolean;
  valves: Readonly<Record<
    MainWireValveDiseaseCycleValveIdV1,
    MainWireValveDiseasePerValveCycleMetricsV1
  >>;
  global: MainWireValveDiseaseGlobalCycleMetricsV1;
  claim: typeof MAIN_WIRE_VALVE_DISEASE_CYCLE_METRICS_CLAIM_V1;
}>;

export function measureMainWireValveDiseaseCycleMetricsV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireValveDiseaseCycleMetricsV1 {
  if (!(result.dtSec > 0) || !Number.isFinite(result.dtSec)) {
    throw new Error("periodic result dtSec must be finite and positive");
  }
  if (
    typeof result.protocolIdentityHash !== "string"
    || result.protocolIdentityHash.trim() === ""
  ) {
    throw new Error("periodic result protocolIdentityHash must be non-empty");
  }
  const valveResearchInputIssues = validateMainWireFourValveDiseaseResearchInputV1(
    result.valveResearchInput,
  );
  if (valveResearchInputIssues.length > 0) {
    throw new Error(`periodic result valveResearchInput is invalid: ${valveResearchInputIssues.join("; ")}`);
  }
  const selectedBeat = result.retainedCompleteBeats.at(-1);
  if (selectedBeat === undefined || selectedBeat.samples.length === 0) {
    throw new Error("a retained complete beat with accepted samples is required");
  }
  validateBeatMetadata(
    selectedBeat.startTimeSec,
    selectedBeat.endTimeSec,
    selectedBeat.samples.length,
    result.dtSec,
  );

  const valves = valveRecord((valveId) => measureValve(
    valveId,
    selectedBeat.samples,
    result.dtSec,
    result.valveResearchInput.valves[valveId].maximumForwardEoaCm2,
    result.valveResearchInput.valves[valveId].closedReverseEroaCm2,
  ));
  const netVolumeMlByValve = valveRecord((valveId) =>
    valves[valveId].netVolumeMl);
  const aorticMinusPulmonaryNetStrokeVolumeMl =
    netVolumeMlByValve.AoV - netVolumeMlByValve.PV;
  const global = Object.freeze({
    netVolumeMlByValve,
    aorticMinusPulmonaryNetStrokeVolumeMl,
    absoluteAorticPulmonaryNetStrokeMismatchMl:
      Math.abs(aorticMinusPulmonaryNetStrokeVolumeMl),
    leftVentricularValveBalanceMl:
      netVolumeMlByValve.MV - netVolumeMlByValve.AoV,
    rightVentricularValveBalanceMl:
      netVolumeMlByValve.TV - netVolumeMlByValve.PV,
    mitralMinusTricuspidNetStrokeVolumeMl:
      netVolumeMlByValve.MV - netVolumeMlByValve.TV,
  } satisfies MainWireValveDiseaseGlobalCycleMetricsV1);

  return Object.freeze({
    metricsId: MAIN_WIRE_VALVE_DISEASE_CYCLE_METRICS_V1_ID,
    source: Object.freeze({
      beatIndex: selectedBeat.beatIndex,
      startTimeSec: selectedBeat.startTimeSec,
      endTimeSec: selectedBeat.endTimeSec,
      sampleCount: selectedBeat.samples.length,
      dtSec: result.dtSec,
      sampledCycleDurationSec: selectedBeat.samples.length * result.dtSec,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
      protocolIdentityHash: result.protocolIdentityHash,
      valveResearchInput: Object.freeze({
        researchInputId: result.valveResearchInput.researchInputId,
        parameterSetId: result.valveResearchInput.parameterSetId,
        parameterIdentityHash: result.valveResearchInput.parameterIdentityHash,
        bracketIds: Object.freeze([...result.valveResearchInput.bracketIds]),
      }),
    }),
    interpretationEligible: result.periodicSteadyStateClaimed,
    valves,
    global,
    claim: MAIN_WIRE_VALVE_DISEASE_CYCLE_METRICS_CLAIM_V1,
  });
}

function measureValve(
  valveId: MainWireValveDiseaseCycleValveIdV1,
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  dtSec: number,
  configuredMaximumForwardEoaCm2: number,
  configuredClosedReverseEroaCm2: number,
): MainWireValveDiseasePerValveCycleMetricsV1 {
  positiveFinite(
    configuredMaximumForwardEoaCm2,
    `${valveId} configured maximum forward EOA`,
  );
  nonnegativeFinite(
    configuredClosedReverseEroaCm2,
    `${valveId} configured closed reverse EROA`,
  );
  const readbacks = samples.map((sample, sampleIndex) => {
    const valve = sample.valveHydraulics[valveId];
    for (const [name, value] of Object.entries({
      flowMlPerSec: valve.flowMlPerSec,
      physicalAreaCm2: valve.physicalAreaCm2,
      forwardActiveEoaCm2: valve.forwardActiveEoaCm2,
      closedReverseEroaCm2: valve.closedReverseEroaCm2,
      activeEoaCm2: valve.activeEoaCm2,
      pressureGradientMmHg: valve.pressureGradientMmHg,
      openingTarget01: valve.openingTarget01,
      openingEquationResidual01: valve.openingEquationResidual01,
      resistanceMmHgSecPerMl: valve.resistanceMmHgSecPerMl,
      bernoulliMmHgSec2PerMl2: valve.bernoulliMmHgSec2PerMl2,
      dissipativePowerProxyMmHgMlPerSec:
        valve.dissipativePowerProxyMmHgMlPerSec,
      powerBalanceResidualMmHgMlPerSec:
        valve.powerBalanceResidualMmHgMlPerSec,
    })) {
      if (!Number.isFinite(value)) {
        throw new Error(`${valveId} sample ${sampleIndex} ${name} must be finite`);
      }
    }
    if (valve.activeEoaCm2 < 0) {
      throw new Error(`${valveId} sample ${sampleIndex} active EOA must be nonnegative`);
    }
    if (valve.closedReverseEroaCm2 !== configuredClosedReverseEroaCm2) {
      throw new Error(
        `${valveId} sample ${sampleIndex} closed reverse EROA must equal the configured research input value`,
      );
    }
    if (
      valve.forwardActiveEoaCm2 < configuredClosedReverseEroaCm2
      || valve.forwardActiveEoaCm2 > configuredMaximumForwardEoaCm2
    ) {
      throw new Error(
        `${valveId} sample ${sampleIndex} forward active EOA must remain within the configured reverse-to-maximum area bounds`,
      );
    }
    if (
      valve.activeDirection !== "forward"
      && valve.activeDirection !== "reverse"
      && valve.activeDirection !== "zero-gradient"
    ) {
      throw new Error(`${valveId} sample ${sampleIndex} direction must be valid`);
    }
    const expectedActiveEoaCm2 = valve.activeDirection === "reverse"
      ? configuredClosedReverseEroaCm2
      : valve.forwardActiveEoaCm2;
    if (valve.activeEoaCm2 !== expectedActiveEoaCm2) {
      throw new Error(
        `${valveId} sample ${sampleIndex} active EOA must match the direction-selected EOA`,
      );
    }
    if (valve.physicalAreaCm2 !== valve.activeEoaCm2) {
      throw new Error(
        `${valveId} sample ${sampleIndex} physical-area compatibility alias must equal active EOA`,
      );
    }
    const openingFraction01 = sample.valveOpeningFraction01[valveId];
    if (
      !Number.isFinite(openingFraction01)
      || openingFraction01 < 0
      || openingFraction01 > 1
      || valve.openingTarget01 < 0
      || valve.openingTarget01 > 1
    ) {
      throw new Error(
        `${valveId} sample ${sampleIndex} opening state and target must be in [0, 1]`,
      );
    }
    if (
      (valve.activeDirection === "forward" && valve.flowMlPerSec < 0)
      || (valve.activeDirection === "reverse" && valve.flowMlPerSec > 0)
      || (valve.activeDirection === "zero-gradient" && valve.flowMlPerSec !== 0)
    ) {
      throw new Error(
        `${valveId} sample ${sampleIndex} flow sign must agree with active direction`,
      );
    }
    if (
      valve.resistanceMmHgSecPerMl < 0
      || valve.bernoulliMmHgSec2PerMl2 < 0
    ) {
      throw new Error(
        `${valveId} sample ${sampleIndex} loss coefficients must be nonnegative`,
      );
    }
    if (valve.flowMlPerSec !== 0 && !(valve.activeEoaCm2 > 0)) {
      throw new Error(
        `${valveId} sample ${sampleIndex} nonzero flow requires positive active EOA`,
      );
    }
    return valve;
  });
  const flows = readbacks.map((valve) => valve.flowMlPerSec);
  const maximumAbsoluteFlowMlPerSec = maximum(flows.map(Math.abs));
  const episodeFlowThresholdMlPerSec = Math.max(
    1,
    0.01 * maximumAbsoluteFlowMlPerSec,
  );
  const forwardEpisodeMask = flows.map((flow) =>
    flow > 0 && flow >= episodeFlowThresholdMlPerSec);
  const reverseEpisodeMask = flows.map((flow) =>
    flow < 0 && flow <= -episodeFlowThresholdMlPerSec);
  const expectedReversePhaseRun = longestCyclicInactiveRun(
    forwardEpisodeMask,
  );
  const expectedReversePhase = valveId === "MV" || valveId === "TV"
    ? "systolic-longest-forward-closed-run" as const
    : "diastolic-longest-forward-closed-run" as const;
  const openingTargetMask = readbacks.map((valve) =>
    valve.openingTarget01 > 0.01);
  const leafletOpeningMask = samples.map((sample) =>
    sample.valveOpeningFraction01[valveId] > 0.01);
  const competentReverseClosureMask = readbacks.map((valve) =>
    valve.competentReverseClosureActive);
  const subthresholdForwardSupportMask = readbacks.map((valve) =>
    valve.subthresholdForwardSupportActive);

  let forwardVolumeMl = 0;
  let reverseVolumeMl = 0;
  let reverseVolumeWithinExpectedPhaseMl = 0;
  let reverseVolumeOutsideExpectedPhaseMl = 0;
  let forwardFlowSampleCount = 0;
  let forwardGradientSumMmHg = 0;
  let forwardFlowWeightedGradientNumeratorMmHgMl = 0;
  let forwardSimplifiedDopplerGradientSumMmHg = 0;
  let forwardJetVelocitySumMPerSec = 0;
  let peakForwardGradientMmHg = Number.NEGATIVE_INFINITY;
  let peakForwardJetVelocityMPerSec = 0;
  let peakSimplifiedDopplerGradientMmHg = 0;
  let peakReverseJetVelocityMPerSec = 0;
  let dissipatedCycleEnergyMmHgMl = 0;
  let linearDissipatedCycleEnergyMmHgMl = 0;
  let bernoulliDissipatedCycleEnergyMmHgMl = 0;
  let peakAbsoluteLinearPressureLossMmHg = 0;
  let peakAbsoluteBernoulliPressureLossMmHg = 0;
  let maximumAbsoluteDissipatedPowerDecompositionResidualMmHgMlPerSec = 0;
  let minimumHydraulicInputPowerMmHgMlPerSec = Number.POSITIVE_INFINITY;
  let maximumAbsolutePowerResidualMmHgMlPerSec = 0;
  let maximumAbsoluteOpeningEquationResidual01 = 0;

  for (let sampleIndex = 0; sampleIndex < readbacks.length; sampleIndex += 1) {
    const valve = readbacks[sampleIndex]!;
    const flow = valve.flowMlPerSec;
    const gradient = valve.pressureGradientMmHg;
    if (flow > 0) {
      const forwardIncrementMl = flow * dtSec;
      forwardVolumeMl += forwardIncrementMl;
      forwardFlowSampleCount += 1;
      forwardGradientSumMmHg += gradient;
      forwardFlowWeightedGradientNumeratorMmHgMl +=
        gradient * forwardIncrementMl;
      peakForwardGradientMmHg = Math.max(peakForwardGradientMmHg, gradient);
      const forwardJetVelocityMPerSec =
        flow / (100 * valve.activeEoaCm2);
      const simplifiedDopplerGradientMmHg =
        4 * forwardJetVelocityMPerSec ** 2;
      forwardJetVelocitySumMPerSec += forwardJetVelocityMPerSec;
      forwardSimplifiedDopplerGradientSumMmHg +=
        simplifiedDopplerGradientMmHg;
      peakForwardJetVelocityMPerSec = Math.max(
        peakForwardJetVelocityMPerSec,
        forwardJetVelocityMPerSec,
      );
      peakSimplifiedDopplerGradientMmHg = Math.max(
        peakSimplifiedDopplerGradientMmHg,
        simplifiedDopplerGradientMmHg,
      );
    } else if (flow < 0) {
      const reverseIncrementMl = -flow * dtSec;
      reverseVolumeMl += reverseIncrementMl;
      if (expectedReversePhaseRun !== null) {
        if (expectedReversePhaseRun.mask[sampleIndex] === true) {
          reverseVolumeWithinExpectedPhaseMl += reverseIncrementMl;
        } else {
          reverseVolumeOutsideExpectedPhaseMl += reverseIncrementMl;
        }
      }
      peakReverseJetVelocityMPerSec = Math.max(
        peakReverseJetVelocityMPerSec,
        -flow / (100 * valve.activeEoaCm2),
      );
    }
    const linearPressureLossMmHg =
      valve.resistanceMmHgSecPerMl * flow;
    const bernoulliPressureLossMmHg =
      valve.bernoulliMmHgSec2PerMl2 * flow * Math.abs(flow);
    const linearDissipativePowerMmHgMlPerSec =
      linearPressureLossMmHg * flow;
    const bernoulliDissipativePowerMmHgMlPerSec =
      bernoulliPressureLossMmHg * flow;
    const decomposedDissipativePowerMmHgMlPerSec =
      linearDissipativePowerMmHgMlPerSec
      + bernoulliDissipativePowerMmHgMlPerSec;
    dissipatedCycleEnergyMmHgMl +=
      valve.dissipativePowerProxyMmHgMlPerSec * dtSec;
    linearDissipatedCycleEnergyMmHgMl +=
      linearDissipativePowerMmHgMlPerSec * dtSec;
    bernoulliDissipatedCycleEnergyMmHgMl +=
      bernoulliDissipativePowerMmHgMlPerSec * dtSec;
    peakAbsoluteLinearPressureLossMmHg = Math.max(
      peakAbsoluteLinearPressureLossMmHg,
      Math.abs(linearPressureLossMmHg),
    );
    peakAbsoluteBernoulliPressureLossMmHg = Math.max(
      peakAbsoluteBernoulliPressureLossMmHg,
      Math.abs(bernoulliPressureLossMmHg),
    );
    maximumAbsoluteDissipatedPowerDecompositionResidualMmHgMlPerSec =
      Math.max(
        maximumAbsoluteDissipatedPowerDecompositionResidualMmHgMlPerSec,
        Math.abs(
          valve.dissipativePowerProxyMmHgMlPerSec
          - decomposedDissipativePowerMmHgMlPerSec,
        ),
      );
    minimumHydraulicInputPowerMmHgMlPerSec = Math.min(
      minimumHydraulicInputPowerMmHgMlPerSec,
      gradient * flow,
    );
    maximumAbsolutePowerResidualMmHgMlPerSec = Math.max(
      maximumAbsolutePowerResidualMmHgMlPerSec,
      Math.abs(valve.powerBalanceResidualMmHgMlPerSec),
    );
    maximumAbsoluteOpeningEquationResidual01 = Math.max(
      maximumAbsoluteOpeningEquationResidual01,
      Math.abs(valve.openingEquationResidual01),
    );
  }

  const forwardFlowTimeSec = forwardFlowSampleCount * dtSec;
  const forwardFlowTimeMeanFlowMlPerSec = forwardFlowSampleCount > 0
    ? forwardVolumeMl / forwardFlowTimeSec
    : 0;
  const forwardFlowTimeMeanJetVelocityMPerSec = forwardFlowSampleCount > 0
    ? forwardJetVelocitySumMPerSec / forwardFlowSampleCount
    : 0;
  const forwardFlowTimeMeanSimplifiedDopplerGradientMmHg =
    forwardFlowSampleCount > 0
      ? forwardSimplifiedDopplerGradientSumMmHg / forwardFlowSampleCount
      : 0;
  const forwardFlowRmsJetVelocityMPerSec =
    Math.sqrt(forwardFlowTimeMeanSimplifiedDopplerGradientMmHg / 4);
  const fullyOpenUniformFlowVelocityMPerSec = forwardFlowSampleCount > 0
    ? forwardFlowTimeMeanFlowMlPerSec
      / (100 * configuredMaximumForwardEoaCm2)
    : 0;
  const fullyOpenUniformFlowDopplerGradientLowerBoundMmHg =
    4 * fullyOpenUniformFlowVelocityMPerSec ** 2;
  const dynamicAreaDopplerPenaltyFactor =
    fullyOpenUniformFlowVelocityMPerSec > 0
      ? (forwardFlowTimeMeanJetVelocityMPerSec
        / fullyOpenUniformFlowVelocityMPerSec) ** 2
      : 1;
  const jetVelocityWaveformNonuniformityFactor =
    forwardFlowTimeMeanJetVelocityMPerSec > 0
      ? (forwardFlowRmsJetVelocityMPerSec
        / forwardFlowTimeMeanJetVelocityMPerSec) ** 2
      : 1;
  const meanDopplerExcessOverFullyOpenUniformFlowFactor =
    fullyOpenUniformFlowDopplerGradientLowerBoundMmHg > 0
      ? forwardFlowTimeMeanSimplifiedDopplerGradientMmHg
        / fullyOpenUniformFlowDopplerGradientLowerBoundMmHg
      : 1;

  return Object.freeze({
    valveId,
    configuredMaximumForwardEoaCm2,
    configuredClosedReverseEroaCm2,
    maximumAbsoluteFlowMlPerSec,
    episodeFlowThresholdMlPerSec,
    forwardVolumeMl,
    reverseVolumeMl,
    netVolumeMl: forwardVolumeMl - reverseVolumeMl,
    sameValveRegurgitantFraction:
      forwardVolumeMl > 0 ? reverseVolumeMl / forwardVolumeMl : null,
    forwardFlowTimeSec,
    forwardFlowTimeMeanFlowMlPerSec,
    forwardFlowTimeMeanGradientMmHg: forwardFlowSampleCount > 0
      ? forwardGradientSumMmHg / forwardFlowSampleCount
      : 0,
    forwardFlowWeightedMeanGradientMmHg: forwardVolumeMl > 0
      ? forwardFlowWeightedGradientNumeratorMmHgMl / forwardVolumeMl
      : 0,
    peakForwardGradientMmHg: forwardFlowSampleCount > 0
      ? peakForwardGradientMmHg
      : 0,
    peakForwardJetVelocityMPerSec,
    forwardFlowTimeMeanJetVelocityMPerSec,
    forwardFlowRmsJetVelocityMPerSec,
    forwardFlowTimeMeanSimplifiedDopplerGradientMmHg,
    fullyOpenUniformFlowDopplerGradientLowerBoundMmHg,
    dynamicAreaDopplerPenaltyFactor,
    jetVelocityWaveformNonuniformityFactor,
    meanDopplerExcessOverFullyOpenUniformFlowFactor,
    peakSimplifiedDopplerGradientMmHg,
    peakReverseJetVelocityMPerSec,
    forwardEpisodeCount: countCyclicEpisodes(forwardEpisodeMask),
    forwardEpisodeDurationSec:
      countTrue(forwardEpisodeMask) * dtSec,
    reverseEpisodeCount: countCyclicEpisodes(reverseEpisodeMask),
    reverseEpisodeDurationSec:
      countTrue(reverseEpisodeMask) * dtSec,
    expectedReversePhase,
    expectedReversePhaseAvailable: expectedReversePhaseRun !== null,
    expectedReversePhaseStartSampleIndex:
      expectedReversePhaseRun?.startIndex ?? null,
    expectedReversePhaseSampleCount: expectedReversePhaseRun?.length ?? null,
    expectedReversePhaseDurationSec: expectedReversePhaseRun === null
      ? null
      : expectedReversePhaseRun.length * dtSec,
    reverseVolumeWithinExpectedPhaseMl: expectedReversePhaseRun === null
      ? null
      : reverseVolumeWithinExpectedPhaseMl,
    reverseVolumeOutsideExpectedPhaseMl: expectedReversePhaseRun === null
      ? null
      : reverseVolumeOutsideExpectedPhaseMl,
    reverseVolumeWithinExpectedPhaseFraction:
      expectedReversePhaseRun !== null && reverseVolumeMl > 0
        ? reverseVolumeWithinExpectedPhaseMl / reverseVolumeMl
        : null,
    openingTargetEpisodeCount: countCyclicEpisodes(openingTargetMask),
    leafletOpeningEpisodeCount: countCyclicEpisodes(leafletOpeningMask),
    activeDirectionTransitionCount: countCyclicTransitions(
      readbacks.map((valve) => valve.activeDirection),
    ),
    competentReverseClosureEpisodeCount:
      countCyclicEpisodes(competentReverseClosureMask),
    subthresholdForwardSupportEpisodeCount:
      countCyclicEpisodes(subthresholdForwardSupportMask),
    maximumAbsoluteOpeningEquationResidual01,
    dissipatedCycleEnergyMmHgMl,
    linearDissipatedCycleEnergyMmHgMl,
    bernoulliDissipatedCycleEnergyMmHgMl,
    linearFractionOfDissipatedCycleEnergy:
      dissipatedCycleEnergyMmHgMl > 0
        ? linearDissipatedCycleEnergyMmHgMl / dissipatedCycleEnergyMmHgMl
        : null,
    peakAbsoluteLinearPressureLossMmHg,
    peakAbsoluteBernoulliPressureLossMmHg,
    maximumAbsoluteDissipatedPowerDecompositionResidualMmHgMlPerSec,
    minimumHydraulicInputPowerMmHgMlPerSec,
    maximumAbsolutePowerResidualMmHgMlPerSec,
  });
}

function countCyclicEpisodes(active: readonly boolean[]): number {
  if (active.length === 0 || !active.some(Boolean)) return 0;
  if (active.every(Boolean)) return 1;
  let count = 0;
  for (let index = 0; index < active.length; index += 1) {
    const previousIndex = (index + active.length - 1) % active.length;
    if (active[index] === true && active[previousIndex] === false) count += 1;
  }
  return count;
}

function countTrue(values: readonly boolean[]): number {
  return values.reduce((count, value) => count + (value ? 1 : 0), 0);
}

function countCyclicTransitions<T>(values: readonly T[]): number {
  if (values.length <= 1) return 0;
  let count = 0;
  for (let index = 0; index < values.length; index += 1) {
    const previousIndex = (index + values.length - 1) % values.length;
    if (values[index] !== values[previousIndex]) count += 1;
  }
  return count;
}

function longestCyclicInactiveRun(
  active: readonly boolean[],
): Readonly<{
  startIndex: number;
  length: number;
  mask: readonly boolean[];
}> | null {
  if (active.length === 0 || active.every(Boolean) || !active.some(Boolean)) {
    return null;
  }
  let bestStartIndex = -1;
  let bestLength = -1;
  for (let index = 0; index < active.length; index += 1) {
    const previousIndex = (index + active.length - 1) % active.length;
    if (active[index] || !active[previousIndex]) continue;
    let length = 0;
    while (length < active.length && !active[(index + length) % active.length]) {
      length += 1;
    }
    if (length > bestLength) {
      bestStartIndex = index;
      bestLength = length;
    }
  }
  if (bestStartIndex < 0 || bestLength <= 0) return null;
  const mask = Array.from({ length: active.length }, () => false);
  for (let offset = 0; offset < bestLength; offset += 1) {
    mask[(bestStartIndex + offset) % active.length] = true;
  }
  return Object.freeze({
    startIndex: bestStartIndex,
    length: bestLength,
    mask: Object.freeze(mask),
  });
}

function maximum(values: readonly number[]): number {
  return values.reduce((current, value) => Math.max(current, value), 0);
}

function valveRecord<T>(
  build: (valveId: MainWireValveDiseaseCycleValveIdV1) => T,
): Readonly<Record<MainWireValveDiseaseCycleValveIdV1, T>> {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_VALVE_DISEASE_CYCLE_VALVE_IDS_V1.map((valveId) =>
      [valveId, build(valveId)]),
  )) as Readonly<Record<MainWireValveDiseaseCycleValveIdV1, T>>;
}

function validateBeatMetadata(
  startTimeSec: number,
  endTimeSec: number,
  sampleCount: number,
  dtSec: number,
): void {
  if (
    !Number.isFinite(startTimeSec) ||
    !Number.isFinite(endTimeSec) ||
    !(endTimeSec > startTimeSec)
  ) {
    throw new Error("retained complete beat must have finite increasing times");
  }
  if (!Number.isInteger(sampleCount) || sampleCount <= 0) {
    throw new Error("retained complete beat sample count must be positive");
  }
  const recordedDurationSec = endTimeSec - startTimeSec;
  const sampledDurationSec = sampleCount * dtSec;
  if (Math.abs(recordedDurationSec - sampledDurationSec) > 1e-9) {
    throw new Error(
      "retained complete beat duration must equal accepted sample count times dtSec",
    );
  }
}

function positiveFinite(value: number, name: string): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be finite and positive`);
  }
}

function nonnegativeFinite(value: number, name: string): void {
  if (!(value >= 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be finite and nonnegative`);
  }
}
