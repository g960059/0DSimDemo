import {
  resolveNonCoronaryCirculationColdSeedV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  mechanicalSupportAlertsV1,
  mechanicalSupportContextAlertsV1,
  type MechanicalSupportAlertV1,
} from
  "@/engine/devices/clinicalReadbackV1";
import { evaluateEcmoGasExchangeV1 } from "@/engine/devices/gasExchangeV1";
import {
  mechanicalSupportPatientCaseV1,
  type MechanicalSupportPatientCaseIdV1,
} from "@/engine/devices/presetsV1";
import type {
  EcmoGasExchangeEvaluationV1,
  MechanicalSupportConfigV1,
  MechanicalSupportHydraulicEvaluationV1,
} from "@/engine/devices/typesV1";
import {
  initializeMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
  type MainWireFiveWallNonCoronaryAcceptedStateV1,
  type MainWireFiveWallNonCoronaryStepSuccessV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  normalAdultMainWireRuntimeV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_MECHANICAL_SUPPORT_SIMULATION_V1_ID =
  "main-wire-mechanical-support-simulation-v1" as const;

type MechanicsState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireFiveWallNonCoronaryAcceptedStateV1<MechanicsState>;
type StepSuccess = MainWireFiveWallNonCoronaryStepSuccessV1<MechanicsState>;
type Provider = ReturnType<
  typeof createCanonicalMainWireNormalAdultFiveWallProviderV1
>;

export type MainWireMechanicalSupportSimulationOptionsV1 = Readonly<{
  patientCaseId: MechanicalSupportPatientCaseIdV1;
  support: MechanicalSupportConfigV1;
  dtSec?: number;
  baselineBeats?: number;
  supportBeats?: number;
  sampleEverySteps?: number;
}>;

export type MainWireMechanicalSupportSampleV1 = Readonly<{
  timeSec: number;
  cyclePhase01: number;
  pressureMmHg: Readonly<Record<
    "LV" | "LA" | "RV" | "RA" | "Ao" | "SA" | "VC" | "PA" | "PVein",
    number
  >>;
  volumeMl: Readonly<Record<"LV" | "LA" | "RV" | "RA" | "SA" | "VC", number>>;
  nativeFlowLMin: Readonly<Record<"AoV" | "MV" | "PV" | "TV", number>>;
  /** Downstream systemic perfusion on the SA-to-arterial edge. */
  systemicFlowLMin: number;
  pumpFlowLMin: Readonly<Record<"LVAD" | "IMPELLA" | "VA_ECMO" | "VV_ECMO", number>>;
  iabpBalloonVolumeMl: number;
  iabpActivation01: number;
  maximumContinuityResidualMl: number;
  totalBloodVolumeErrorMl: number;
}>;

export type MainWireMechanicalSupportBeatMetricsV1 = Readonly<{
  meanSystemicArterialPressureMmHg: number;
  /** Peak inside the model's ventricular-systolic phase window. */
  systemicSystolicPressureMmHg: number;
  /** Pre-systolic arterial trough, not the beat-global minimum. */
  systemicDiastolicPressureMmHg: number;
  systemicPulsePressureMmHg: number;
  globalSystemicArterialPeakMmHg: number;
  globalSystemicArterialTroughMmHg: number;
  augmentedDiastolicPressureMmHg: number;
  presystolicArterialTroughMmHg: number;
  /** Net signed native aortic-valve output (gross forward minus regurgitant). */
  nativeCardiacOutputLMin: number;
  grossForwardAorticFlowLMin: number;
  aorticRegurgitantFlowLMin: number;
  aorticRegurgitantFraction01: number;
  totalSystemicFlowLMin: number;
  meanPumpFlowLMin: Readonly<Record<
    "LVAD" | "IMPELLA" | "VA_ECMO" | "VV_ECMO",
    number
  >>;
  leftVentricularEndDiastolicVolumeMl: number;
  leftVentricularEndSystolicVolumeMl: number;
  leftVentricularStrokeVolumeMl: number;
  leftVentricularEndDiastolicPressureMmHg: number;
  meanLeftAtrialPressureMmHg: number;
  meanRightAtrialPressureMmHg: number;
  meanPulmonaryArterialPressureMmHg: number;
  peakRightVentricularPressureMmHg: number;
  pulmonaryFlowLMin: number;
  transpulmonaryGradientMmHg: number;
  pulmonaryVascularResistanceWoodUnits: number;
  nativeAorticValveOpenFraction01: number;
  leftVentricularPressureVolumeLoopAreaMmHgMl: number;
  maximumContinuityResidualMl: number;
  maximumAbsoluteTotalBloodVolumeErrorMl: number;
  closureMaximumRelativeNodeVolumeDifference: number | null;
}>;

export type MainWireMechanicalSupportSimulationResultV1 = Readonly<{
  simulationId: typeof MAIN_WIRE_MECHANICAL_SUPPORT_SIMULATION_V1_ID;
  completed: boolean;
  patientCaseId: MechanicalSupportPatientCaseIdV1;
  dtSec: number;
  baselineBeats: number;
  supportBeats: number;
  baselineSamples: readonly MainWireMechanicalSupportSampleV1[];
  supportSamples: readonly MainWireMechanicalSupportSampleV1[];
  baselineMetrics: MainWireMechanicalSupportBeatMetricsV1 | null;
  supportMetrics: MainWireMechanicalSupportBeatMetricsV1 | null;
  gasExchange: EcmoGasExchangeEvaluationV1 | null;
  alerts: readonly MechanicalSupportAlertV1[];
  failure: null | Readonly<{
    phase: "baseline" | "support";
    stepIndex: number;
    timeSec: number;
    message: string;
  }>;
  claim: Readonly<{
    intendedUse: "research-and-education-only";
    bloodVolumeConservation: "device-transfers-are-equal-and-opposite";
    rotaryPumpDynamics: "quasi-static-affinity-hq-with-signed-flow";
    iabpDynamics: "time-varying-aortic-displacement-volume";
    ecmoGasExchange: "beat-mean-content-balance-not-dynamic-blood-gas";
    parameterFittingToOutputWaveforms: false;
  }>;
}>;

export function runMainWireMechanicalSupportSimulationV1(
  options: MainWireMechanicalSupportSimulationOptionsV1,
): MainWireMechanicalSupportSimulationResultV1 {
  const dtSec = options.dtSec ?? 0.002;
  const baselineBeats = options.baselineBeats ?? 6;
  const supportBeats = options.supportBeats ?? 4;
  const sampleEverySteps = options.sampleEverySteps ?? 1;
  validateOptions(dtSec, baselineBeats, supportBeats, sampleEverySteps);
  if (options.support.vaEcmo.enabled && options.support.vvEcmo.enabled) {
    throw new Error("simultaneous VA and VV ECMO requires a hybrid gas model not present in V1");
  }
  const stepsPerBeat = Math.round(1 / dtSec);
  const patient = mechanicalSupportPatientCaseV1(options.patientCaseId);
  const baseRuntime = normalAdultMainWireRuntimeV1(
    patient.valveDiseaseBracketIds,
  );
  const runtime = Object.freeze({
    ...baseRuntime,
    vascular: Object.freeze({
      venousTone: baseRuntime.vascular.venousTone + patient.venousToneDelta,
      arterialStiffness:
        baseRuntime.vascular.arterialStiffness * patient.arterialStiffnessScale,
    }),
    losses: Object.freeze({
      ...baseRuntime.losses,
      systemicResistance:
        baseRuntime.losses.systemicResistance * patient.systemicResistanceScale,
      pulmonaryResistance:
        baseRuntime.losses.pulmonaryResistance * patient.pulmonaryResistanceScale,
    }),
  });
  const calciumDriveParams: FiveWallNormalCalciumDriveParamsV1 = Object.freeze({
    ...FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    parameterSetId: `mcs-patient-${patient.caseId}-activation-v1`,
    peakAmplitudeScaleByWall: patient.peakAmplitudeScaleByWall,
  });
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
  const pericardium = createMainWireNormalAdultCommonPericardiumV1(
    "on",
    "healthy-slack",
  );
  const coldSeed = resolveNonCoronaryCirculationColdSeedV1(runtime);
  const seededVolumes = Object.freeze({
    ...coldSeed.nodeVolumesMl,
    SV: coldSeed.nodeVolumesMl.SV + patient.bloodVolumeDeltaMl,
  });
  const cold = initializeMainWireFiveWallNonCoronaryV1({
    provider,
    runtime,
    calciumDriveParams,
    pericardium,
    circulationInitial: {
      fixedTotalBloodVolumeMl:
        coldSeed.fixedTotalBloodVolumeMl + patient.bloodVolumeDeltaMl,
      nodeVolumesMl: seededVolumes,
    },
  });
  const baseline = runPhase({
    provider,
    initialState: cold.acceptedState,
    dtSec,
    beatCount: baselineBeats,
    stepsPerBeat,
    sampleEverySteps,
    runtime,
    calciumDriveParams,
    pericardium,
    mechanicalSupport: undefined,
    phase: "baseline",
  });
  if (baseline.failure !== null) {
    return resultEnvelope({
      options,
      dtSec,
      baselineBeats,
      supportBeats,
      baseline,
      support: null,
      gasExchange: null,
      alerts: Object.freeze([]),
      failure: baseline.failure,
    });
  }
  const support = runPhase({
    provider,
    initialState: baseline.state,
    dtSec,
    beatCount: supportBeats,
    stepsPerBeat,
    sampleEverySteps,
    runtime,
    calciumDriveParams,
    pericardium,
    mechanicalSupport: Object.freeze({
      config: options.support,
      heartRateBpm: 60,
    }),
    phase: "support",
  });
  const supportMetrics = support.samples.length > 0
    ? metrics(support.samples, support.closure)
    : null;
  const severeArVaStressTest = options.support.vaEcmo.enabled
    && patient.valveDiseaseBracketIds.includes("AR-severe");
  const gasExchange = supportMetrics === null || severeArVaStressTest
    ? null
    : ecmoGasEvaluation(options.support, supportMetrics);
  const gasAlerts = support.lastHydraulics === null || gasExchange === null
    ? Object.freeze([])
    : mechanicalSupportAlertsV1(support.lastHydraulics, gasExchange)
      .filter((entry) => entry.device === "ECMO_GAS");
  const alerts = deduplicateAlerts([
    ...support.hydraulicAlerts,
    ...gasAlerts,
    ...mechanicalSupportContextAlertsV1(options.support, {
      severeAorticRegurgitation:
        patient.valveDiseaseBracketIds.includes("AR-severe"),
    }),
  ]);
  return resultEnvelope({
    options,
    dtSec,
    baselineBeats,
    supportBeats,
    baseline,
    support,
    gasExchange,
    alerts,
    failure: support.failure,
  });
}

type PhaseResult = Readonly<{
  state: AcceptedState;
  samples: readonly MainWireMechanicalSupportSampleV1[];
  closure: number | null;
  lastHydraulics: MechanicalSupportHydraulicEvaluationV1 | null;
  hydraulicAlerts: readonly MechanicalSupportAlertV1[];
  failure: MainWireMechanicalSupportSimulationResultV1["failure"];
}>;

function runPhase(input: Readonly<{
  provider: Provider;
  initialState: AcceptedState;
  dtSec: number;
  beatCount: number;
  stepsPerBeat: number;
  sampleEverySteps: number;
  runtime: Parameters<typeof initializeMainWireFiveWallNonCoronaryV1>[0]["runtime"];
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
  pericardium: Parameters<typeof initializeMainWireFiveWallNonCoronaryV1>[0]["pericardium"];
  mechanicalSupport: Parameters<typeof stepMainWireFiveWallNonCoronaryV1>[2]["mechanicalSupport"];
  phase: "baseline" | "support";
}>): PhaseResult {
  let state = input.initialState;
  const samples: MainWireMechanicalSupportSampleV1[] = [];
  let priorBeatBoundary: AcceptedState | null = null;
  let closure: number | null = null;
  let lastHydraulics: MechanicalSupportHydraulicEvaluationV1 | null = null;
  const hydraulicAlerts: MechanicalSupportAlertV1[] = [];
  const totalSteps = input.beatCount * input.stepsPerBeat;
  for (let stepIndex = 1; stepIndex <= totalSteps; stepIndex += 1) {
    const stepped = stepMainWireFiveWallNonCoronaryV1(input.provider, state, {
      dtSec: input.dtSec,
      runtime: input.runtime,
      calciumDriveParams: input.calciumDriveParams,
      pericardium: input.pericardium,
      mechanicalSupport: input.mechanicalSupport,
    });
    if (stepped.converged === false) {
      return Object.freeze({
        state,
        samples: Object.freeze(samples),
        closure,
        lastHydraulics,
        hydraulicAlerts: deduplicateAlerts(hydraulicAlerts),
        failure: Object.freeze({
          phase: input.phase,
          stepIndex,
          timeSec: state.acceptedTimeSec + input.dtSec,
          message: stepped.message,
        }),
      });
    }
    state = stepped.acceptedState;
    lastHydraulics = stepped.circulationTrial.mechanicalSupport ?? null;
    if (stepIndex % input.stepsPerBeat === 0) {
      if (priorBeatBoundary !== null) {
        closure = maximumRelativeNodeVolumeDifference(
          priorBeatBoundary,
          state,
        );
      }
      priorBeatBoundary = state;
    }
    const inLastBeat = stepIndex > totalSteps - input.stepsPerBeat;
    if (inLastBeat && lastHydraulics !== null) {
      hydraulicAlerts.push(...mechanicalSupportAlertsV1(lastHydraulics));
    }
    if (inLastBeat && stepIndex % input.sampleEverySteps === 0) {
      samples.push(sample(stepped));
    }
  }
  return Object.freeze({
    state,
    samples: Object.freeze(samples),
    closure,
    lastHydraulics,
    hydraulicAlerts: deduplicateAlerts(hydraulicAlerts),
    failure: null,
  });
}

function sample(step: StepSuccess): MainWireMechanicalSupportSampleV1 {
  const trial = step.circulationTrial;
  const pressure = trial.nodeAbsolutePressuresMmHg;
  const volume = trial.candidateNodeVolumesMl;
  const support = trial.mechanicalSupport;
  const phase = ((trial.candidateTimeSec % 1) + 1) % 1;
  return Object.freeze({
    timeSec: trial.candidateTimeSec,
    cyclePhase01: phase,
    pressureMmHg: Object.freeze({
      LV: pressure.LV,
      LA: pressure.LA,
      RV: pressure.RV,
      RA: pressure.RA,
      Ao: pressure.Ao,
      SA: pressure.SA,
      VC: pressure.VC,
      PA: pressure.PA,
      PVein: pressure.PVein,
    }),
    volumeMl: Object.freeze({
      LV: volume.LV,
      LA: volume.LA,
      RV: volume.RV,
      RA: volume.RA,
      SA: volume.SA,
      VC: volume.VC,
    }),
    nativeFlowLMin: Object.freeze({
      AoV: trial.edgeFlowsMlPerSec.AoV * 0.06,
      MV: trial.edgeFlowsMlPerSec.MV * 0.06,
      PV: trial.edgeFlowsMlPerSec.PV * 0.06,
      TV: trial.edgeFlowsMlPerSec.TV * 0.06,
    }),
    systemicFlowLMin: trial.edgeFlowsMlPerSec.SA_Art * 0.06,
    pumpFlowLMin: Object.freeze({
      LVAD: support?.pump.LVAD.flowLMin ?? 0,
      IMPELLA: support?.pump.IMPELLA.flowLMin ?? 0,
      VA_ECMO: support?.pump.VA_ECMO.flowLMin ?? 0,
      VV_ECMO: support?.pump.VV_ECMO.flowLMin ?? 0,
    }),
    iabpBalloonVolumeMl: support?.iabp.balloonVolumeMl ?? 0,
    iabpActivation01: support?.iabp.activation01 ?? 0,
    maximumContinuityResidualMl:
      trial.diagnostics.finalMaximumContinuityResidualMl,
    totalBloodVolumeErrorMl: trial.diagnostics.totalBloodVolumeErrorMl,
  });
}

function metrics(
  samples: readonly MainWireMechanicalSupportSampleV1[],
  closure: number | null,
): MainWireMechanicalSupportBeatMetricsV1 {
  if (samples.length === 0) throw new Error("beat metrics require samples");
  const sa = samples.map((entry) => entry.pressureMmHg.SA);
  const lvVolumes = samples.map((entry) => entry.volumeMl.LV);
  const edIndex = indexOfMaximum(lvVolumes);
  const meanPumpFlowLMin = Object.freeze({
    LVAD: mean(samples.map((entry) => entry.pumpFlowLMin.LVAD)),
    IMPELLA: mean(samples.map((entry) => entry.pumpFlowLMin.IMPELLA)),
    VA_ECMO: mean(samples.map((entry) => entry.pumpFlowLMin.VA_ECMO)),
    VV_ECMO: mean(samples.map((entry) => entry.pumpFlowLMin.VV_ECMO)),
  });
  const grossForwardAorticFlowLMin = mean(
    samples.map((entry) => Math.max(entry.nativeFlowLMin.AoV, 0)),
  );
  const aorticRegurgitantFlowLMin = mean(
    samples.map((entry) => Math.max(-entry.nativeFlowLMin.AoV, 0)),
  );
  const nativeCardiacOutputLMin = grossForwardAorticFlowLMin
    - aorticRegurgitantFlowLMin;
  const aorticRegurgitantFraction01 = grossForwardAorticFlowLMin > 0
    ? aorticRegurgitantFlowLMin / grossForwardAorticFlowLMin
    : aorticRegurgitantFlowLMin > 0 ? 1 : 0;
  const meanLeftAtrialPressureMmHg = mean(
    samples.map((entry) => entry.pressureMmHg.LA),
  );
  const meanPulmonaryArterialPressureMmHg = mean(
    samples.map((entry) => entry.pressureMmHg.PA),
  );
  const pulmonaryFlowLMin = mean(
    samples.map((entry) => Math.max(entry.nativeFlowLMin.PV, 0)),
  );
  const transpulmonaryGradientMmHg = meanPulmonaryArterialPressureMmHg
    - meanLeftAtrialPressureMmHg;
  const forwardAorticValveWindow = samples.filter((entry) =>
    entry.nativeFlowLMin.AoV > 1e-6
  );
  const systolicWindow = forwardAorticValveWindow.length > 0
    ? forwardAorticValveWindow
    : samples.filter((entry) =>
      entry.cyclePhase01 >= 0.05 && entry.cyclePhase01 <= 0.2
    );
  const aorticClosurePhase01 = lastForwardAorticValvePhaseOrDefault(
    samples,
    0.2,
  );
  const diastolicWindow = samples.filter((entry) =>
    entry.cyclePhase01 > aorticClosurePhase01
      && entry.cyclePhase01 <= 0.9
  );
  const presystolicWindow = samples.filter((entry) =>
    entry.cyclePhase01 >= 0.9 || entry.cyclePhase01 <= 0.05
  );
  const systolic = maximumPressureOrFallback(systolicWindow, sa);
  const presystolicTrough = minimumPressureOrFallback(
    presystolicWindow,
    sa,
  );
  const augmentedDiastolicPressure = maximumPressureOrFallback(
    diastolicWindow,
    sa,
  );
  return Object.freeze({
    meanSystemicArterialPressureMmHg: mean(sa),
    systemicSystolicPressureMmHg: systolic,
    systemicDiastolicPressureMmHg: presystolicTrough,
    systemicPulsePressureMmHg: systolic - presystolicTrough,
    globalSystemicArterialPeakMmHg: Math.max(...sa),
    globalSystemicArterialTroughMmHg: Math.min(...sa),
    augmentedDiastolicPressureMmHg: augmentedDiastolicPressure,
    presystolicArterialTroughMmHg: presystolicTrough,
    nativeCardiacOutputLMin,
    grossForwardAorticFlowLMin,
    aorticRegurgitantFlowLMin,
    aorticRegurgitantFraction01,
    totalSystemicFlowLMin: mean(
      samples.map((entry) => entry.systemicFlowLMin),
    ),
    meanPumpFlowLMin,
    leftVentricularEndDiastolicVolumeMl: Math.max(...lvVolumes),
    leftVentricularEndSystolicVolumeMl: Math.min(...lvVolumes),
    leftVentricularStrokeVolumeMl: Math.max(...lvVolumes) - Math.min(...lvVolumes),
    leftVentricularEndDiastolicPressureMmHg:
      samples[edIndex]!.pressureMmHg.LV,
    meanLeftAtrialPressureMmHg,
    meanRightAtrialPressureMmHg: mean(
      samples.map((entry) => entry.pressureMmHg.RA),
    ),
    meanPulmonaryArterialPressureMmHg,
    peakRightVentricularPressureMmHg: Math.max(
      ...samples.map((entry) => entry.pressureMmHg.RV),
    ),
    pulmonaryFlowLMin,
    transpulmonaryGradientMmHg,
    pulmonaryVascularResistanceWoodUnits: transpulmonaryGradientMmHg
      / Math.max(pulmonaryFlowLMin, 0.05),
    nativeAorticValveOpenFraction01: samples.filter(
      (entry) => entry.nativeFlowLMin.AoV > 1e-6,
    ).length / samples.length,
    leftVentricularPressureVolumeLoopAreaMmHgMl: polygonArea(
      samples.map((entry) => Object.freeze({
        x: entry.volumeMl.LV,
        y: entry.pressureMmHg.LV,
      })),
    ),
    maximumContinuityResidualMl: Math.max(
      ...samples.map((entry) => entry.maximumContinuityResidualMl),
    ),
    maximumAbsoluteTotalBloodVolumeErrorMl: Math.max(
      ...samples.map((entry) => Math.abs(entry.totalBloodVolumeErrorMl)),
    ),
    closureMaximumRelativeNodeVolumeDifference: closure,
  });
}

function ecmoGasEvaluation(
  config: MechanicalSupportConfigV1,
  metricsValue: MainWireMechanicalSupportBeatMetricsV1,
): EcmoGasExchangeEvaluationV1 | null {
  const mode = config.vaEcmo.enabled ? "VA" : config.vvEcmo.enabled ? "VV" : null;
  if (mode === null) return null;
  const ecmoFlowLMin = Math.max(
    mode === "VA"
      ? metricsValue.meanPumpFlowLMin.VA_ECMO
      : metricsValue.meanPumpFlowLMin.VV_ECMO,
    0,
  );
  const commonGasInput = {
    ecmoFlowLMin,
    nativeCardiacOutputLMin: mode === "VA"
      ? Math.max(metricsValue.nativeCardiacOutputLMin, 0)
      : Math.max(metricsValue.totalSystemicFlowLMin, 0.05),
    config: config.gasExchange,
  } as const;
  return mode === "VA"
    ? evaluateEcmoGasExchangeV1({
      ...commonGasInput,
      mode,
      vaCannulation: config.vaEcmo.cannulation,
    })
    : evaluateEcmoGasExchangeV1({ ...commonGasInput, mode });
}

function resultEnvelope(input: Readonly<{
  options: MainWireMechanicalSupportSimulationOptionsV1;
  dtSec: number;
  baselineBeats: number;
  supportBeats: number;
  baseline: PhaseResult;
  support: PhaseResult | null;
  gasExchange: EcmoGasExchangeEvaluationV1 | null;
  alerts: readonly MechanicalSupportAlertV1[];
  failure: MainWireMechanicalSupportSimulationResultV1["failure"];
}>): MainWireMechanicalSupportSimulationResultV1 {
  return Object.freeze({
    simulationId: MAIN_WIRE_MECHANICAL_SUPPORT_SIMULATION_V1_ID,
    completed: input.failure === null && input.support !== null,
    patientCaseId: input.options.patientCaseId,
    dtSec: input.dtSec,
    baselineBeats: input.baselineBeats,
    supportBeats: input.supportBeats,
    baselineSamples: input.baseline.samples,
    supportSamples: input.support?.samples ?? Object.freeze([]),
    baselineMetrics: input.baseline.samples.length > 0
      ? metrics(input.baseline.samples, input.baseline.closure)
      : null,
    supportMetrics: input.support !== null && input.support.samples.length > 0
      ? metrics(input.support.samples, input.support.closure)
      : null,
    gasExchange: input.gasExchange,
    alerts: input.alerts,
    failure: input.failure,
    claim: Object.freeze({
      intendedUse: "research-and-education-only" as const,
      bloodVolumeConservation: "device-transfers-are-equal-and-opposite" as const,
      rotaryPumpDynamics: "quasi-static-affinity-hq-with-signed-flow" as const,
      iabpDynamics: "time-varying-aortic-displacement-volume" as const,
      ecmoGasExchange: "beat-mean-content-balance-not-dynamic-blood-gas" as const,
      parameterFittingToOutputWaveforms: false as const,
    }),
  });
}

function maximumRelativeNodeVolumeDifference(
  previous: AcceptedState,
  current: AcceptedState,
): number {
  return Math.max(...Object.keys(current.circulation.nodeVolumesMl).map((key) => {
    const name = key as keyof typeof current.circulation.nodeVolumesMl;
    return Math.abs(
      current.circulation.nodeVolumesMl[name]
        - previous.circulation.nodeVolumesMl[name],
    ) / Math.max(Math.abs(previous.circulation.nodeVolumesMl[name]), 1);
  }));
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function indexOfMaximum(values: readonly number[]): number {
  let best = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index]! > values[best]!) best = index;
  }
  return best;
}

function lastForwardAorticValvePhaseOrDefault(
  samples: readonly MainWireMechanicalSupportSampleV1[],
  fallback: number,
): number {
  const phases = samples
    .filter((entry) => entry.nativeFlowLMin.AoV > 1e-6)
    .map((entry) => entry.cyclePhase01);
  return phases.length > 0 ? Math.max(...phases) : fallback;
}

function maximumPressureOrFallback(
  samples: readonly MainWireMechanicalSupportSampleV1[],
  fallback: readonly number[],
): number {
  return Math.max(...(samples.length > 0
    ? samples.map((entry) => entry.pressureMmHg.SA)
    : fallback));
}

function minimumPressureOrFallback(
  samples: readonly MainWireMechanicalSupportSampleV1[],
  fallback: readonly number[],
): number {
  return Math.min(...(samples.length > 0
    ? samples.map((entry) => entry.pressureMmHg.SA)
    : fallback));
}

function deduplicateAlerts(
  alerts: readonly MechanicalSupportAlertV1[],
): readonly MechanicalSupportAlertV1[] {
  const byKey = new Map<string, MechanicalSupportAlertV1>();
  for (const candidate of alerts) {
    const key = `${candidate.device}:${candidate.code}`;
    const current = byKey.get(key);
    if (current === undefined || alertIsMoreConcerning(candidate, current)) {
      byKey.set(key, candidate);
    }
  }
  return Object.freeze([...byKey.values()]);
}

function alertIsMoreConcerning(
  candidate: MechanicalSupportAlertV1,
  current: MechanicalSupportAlertV1,
): boolean {
  const rank = { advisory: 0, warning: 1, critical: 2 } as const;
  if (rank[candidate.severity] !== rank[current.severity]) {
    return rank[candidate.severity] > rank[current.severity];
  }
  switch (candidate.code) {
    case "INLET_COLLAPSE":
    case "EXCESSIVE_NEGATIVE_DRAINAGE_PRESSURE":
    case "ROTARY_PUMP_BACKFLOW":
    case "LOW_VV_EFFECTIVE_FLOW_RATIO":
    case "LOW_RIGHT_RADIAL_OXYGENATION":
    case "LOW_OXYGEN_DELIVERY_RATIO":
    case "OXYGEN_DEMAND_NOT_MET":
      return candidate.observedValue < current.observedValue;
    case "RUNNING_AGAINST_CLAMP":
    case "VA_DIFFERENTIAL_HYPOXEMIA":
    case "VA_ECMO_SEVERE_AORTIC_REGURGITATION":
      return candidate.observedValue > current.observedValue;
  }
}

function polygonArea(points: readonly Readonly<{ x: number; y: number }>[]): number {
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    twiceArea += current.x * next.y - next.x * current.y;
  }
  return Math.abs(twiceArea) / 2;
}

function validateOptions(
  dtSec: number,
  baselineBeats: number,
  supportBeats: number,
  sampleEverySteps: number,
): void {
  if (!(dtSec > 0) || !Number.isFinite(dtSec)) throw new Error("dtSec must be positive");
  if (Math.abs(Math.round(1 / dtSec) * dtSec - 1) > 1e-12) {
    throw new Error("dtSec must divide the one-second cardiac cycle exactly");
  }
  for (const [label, value] of [
    ["baselineBeats", baselineBeats],
    ["supportBeats", supportBeats],
    ["sampleEverySteps", sampleEverySteps],
  ] as const) {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`${label} must be a positive integer`);
    }
  }
}
