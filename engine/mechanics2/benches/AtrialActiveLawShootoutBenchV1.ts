import {
  ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  initialPeriodicPrescribedCalciumDriverStateV2,
  trialPeriodicPrescribedCalciumDriverV2,
  type PeriodicPrescribedCalciumDriverParamsV2,
  type PeriodicPrescribedCalciumDriverStateV2,
} from "@/engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2";
import {
  equilibriumLandFormCaTroponinActivationStateV1,
} from "@/engine/mechanics2/activation/LandFormCaTroponinActivationV1";
import {
  DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1,
  commitLand2017ActiveOnlyTrialV1,
  initialLand2017ActiveOnlyStateV1,
  trialLand2017ActiveOnlyV1,
  type Land2017ActiveOnlyStateV1,
} from "@/engine/mechanics2/activation/Land2017ActiveOnlyV1";
import {
  commitHillCeSeeSlsTrialV1,
  initialHillCeSeeSlsStateV1,
  prepareHillCeSeeSlsParamsV1,
  trialHillCeSeeSlsV1,
  type HillCeSeeSlsParamsV1,
  type HillCeSeeSlsStateV1,
} from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";
import {
  evaluateOneFiberVolumeGeometryV1,
  oneFiberCavityPressurePaV1,
} from "@/engine/mechanics2/geometry/OneFiberVolumeGeometryV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";
import {
  LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1,
} from "@/engine/myocardium/atrialLandNiederer2018";
import { stableHash } from "@/engine/myocardium/myofilament/land2017";

const PA_PER_MMHG = 133.322;

export const ATRIAL_ACTIVE_LAW_SHOOTOUT_BENCH_ID_V1 =
  "atrial-active-law-common-ca-prescribed-strain-shootout-v1" as const;

export const ATRIAL_ACTIVE_LAW_VARIANTS_V1 = Object.freeze([
  "hill-algebraic-classical-fv",
  "hill-lag25-classical-fv",
  "hill-algebraic-fv-near-unity",
  "hill-lag25-fv-near-unity",
  "land2017-atrial-active-only",
] as const);

export type AtrialActiveLawVariantIdV1 =
  (typeof ATRIAL_ACTIVE_LAW_VARIANTS_V1)[number];

export const ATRIAL_ACTIVE_LAW_PROTOCOL_IDS_V1 = Object.freeze([
  "isometric-twitch",
  "a-wave-shortening-stop",
  "quick-release-hold",
  "eccentric-lengthening",
] as const);

export type AtrialActiveLawProtocolIdV1 =
  (typeof ATRIAL_ACTIVE_LAW_PROTOCOL_IDS_V1)[number];

export type AtrialActiveLawShootoutOptionsV1 = {
  readonly dtSec?: number;
  readonly warmupCycles?: number;
  readonly includeDtRefinement?: boolean;
};

type ProtocolDefinitionV1 = {
  readonly protocolId: AtrialActiveLawProtocolIdV1;
  readonly label: string;
  readonly strainAtPhase: (phase01: number) => number;
  readonly shorteningEndPhase01: number | null;
};

export type AtrialActiveLawCommonInputSampleV1 = {
  readonly absoluteTimeSec: number;
  readonly cycleIndex: number;
  readonly phase01: number;
  readonly dtSec: number;
  readonly previousFreeCalciumUm: number;
  readonly midpointFreeCalciumUm: number;
  readonly freeCalciumUm: number;
  readonly previousFiberLogStrain: number;
  readonly fiberLogStrain: number;
  readonly fiberLogStrainRatePerSec: number;
  readonly cavityVolumeMl: number;
};

export type AtrialActiveLawTraceSampleV1 = {
  readonly phase01: number;
  readonly freeCalciumUm: number;
  readonly fiberLogStrain: number;
  readonly fiberLogStrainRatePerSec: number;
  readonly cavityVolumeMl: number;
  readonly activeKirchhoffStressKPa: number;
  readonly sphereProjectedActivePressureMmHg: number;
  readonly activationProxy01: number;
  readonly forceVelocityFactor: number | null;
  readonly ceLogStrain: number | null;
  readonly seeLogStrain: number | null;
  readonly sourceNominalStressKPa: number | null;
};

export type AtrialActiveLawProtocolResultV1 = {
  readonly variantId: AtrialActiveLawVariantIdV1;
  readonly protocolId: AtrialActiveLawProtocolIdV1;
  readonly allStepsValid: boolean;
  readonly firstFailure: string | null;
  readonly peakActiveStressKPa: number;
  readonly peakActiveStressPhase01: number;
  readonly peakSphereActivePressureMmHg: number;
  readonly minimumFiberLogStrain: number;
  readonly maximumFiberLogStrain: number;
  readonly minimumCavityVolumeMl: number;
  readonly maximumCavityVolumeMl: number;
  readonly maximumAbsoluteSerialResidualPa: number | null;
  readonly maximumAbsoluteContinuousPowerResidualWPerM3: number | null;
  readonly maximumAbsoluteDiscretePowerResidualWPerM3: number | null;
  readonly maximumAbsoluteSourceReportedPowerResidualWPerM3: number | null;
  readonly maximumAbsoluteFiniteDifferenceWorkResidualPa: number | null;
  readonly minimumLandPopulation: number | null;
  readonly maximumLandConservationResidual: number | null;
  readonly landProjectionOccurred: boolean | null;
  readonly velocityStopDiagnostics: {
    readonly applicable: boolean;
    readonly fastestShorteningPhase01: number | null;
    readonly shorteningStopPhase01: number | null;
    readonly stressAtFastestShorteningKPa: number | null;
    readonly stressAtShorteningStopKPa: number | null;
    readonly maximumStressWithin100msAfterStopKPa: number | null;
    readonly recoveryFromFastestToStopNormalizedByPeak: number | null;
    readonly postStopGainNormalizedByPeak: number | null;
    readonly recoveryFromFastestToStopKPa: number | null;
    readonly postStopGainKPa: number | null;
    readonly remainingShorteningAtGlobalStressPeak01: number | null;
  };
  readonly trace: readonly AtrialActiveLawTraceSampleV1[];
};

export type AtrialActiveLawShootoutReportV1 = ReturnType<
  typeof runAtrialActiveLawShootoutBenchV1
>;

const CYCLE_LENGTH_SEC = 1;
const DEFAULT_DT_SEC = 0.001;
const DEFAULT_WARMUP_CYCLES = 6;
const TRACE_INTERVAL_SEC = 0.002;
const INITIAL_FREE_CALCIUM_UM = 0.1;

const PROTOCOLS: readonly ProtocolDefinitionV1[] = Object.freeze([
  Object.freeze({
    protocolId: "isometric-twitch",
    label: "isometric twitch at the pre-A-wave fiber length",
    strainAtPhase: () => 0.08,
    shorteningEndPhase01: null,
  }),
  Object.freeze({
    protocolId: "a-wave-shortening-stop",
    label:
      "smooth LA-like shortening from about 80 to 61 mL, followed by a hold",
    strainAtPhase: (phase01: number) =>
      cyclicMotion(phase01, 0.08, 0.005, 0.09, 0.30, 0.58, 0.94),
    shorteningEndPhase01: 0.30,
  }),
  Object.freeze({
    protocolId: "quick-release-hold",
    label: "15 ms rapid release followed by a fixed-length hold",
    strainAtPhase: (phase01: number) =>
      cyclicMotion(phase01, 0.08, 0.03, 0.10, 0.115, 0.58, 0.94),
    shorteningEndPhase01: 0.115,
  }),
  Object.freeze({
    protocolId: "eccentric-lengthening",
    label: "active lengthening followed by a hold and return",
    strainAtPhase: (phase01: number) =>
      cyclicMotion(phase01, 0.005, 0.065, 0.09, 0.27, 0.58, 0.94),
    shorteningEndPhase01: null,
  }),
]);

const COMMON_CALCIUM_PARAMS: PeriodicPrescribedCalciumDriverParamsV2 =
  Object.freeze({
    targetId: "atrial-active-law-shootout-common-ca",
    cycleLengthSec: CYCLE_LENGTH_SEC,
    eventOnsetSec: 0.08,
    eventStrength01: 1,
    calcium: ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
    minimumReleaseSamples: 4,
  });

const LA_GEOMETRY =
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.atria.left.geometry;

export function runAtrialActiveLawShootoutBenchV1(
  options: AtrialActiveLawShootoutOptionsV1 = {},
) {
  const dtSec = options.dtSec ?? DEFAULT_DT_SEC;
  const warmupCycles = options.warmupCycles ?? DEFAULT_WARMUP_CYCLES;
  validateProtocolOptions(dtSec, warmupCycles);
  const commonInputs = PROTOCOLS.map((protocol) => ({
    protocol,
    samples: generateCommonInput(protocol, dtSec, warmupCycles),
  }));
  const results = commonInputs.flatMap(({ protocol, samples }) =>
    ATRIAL_ACTIVE_LAW_VARIANTS_V1.map((variantId) =>
      simulateVariant(variantId, protocol, samples, warmupCycles)
    )
  );
  const dtRefinement = options.includeDtRefinement === false
    ? []
    : runDtRefinement(results, warmupCycles, dtSec);
  const inputHashByProtocol = Object.freeze(Object.fromEntries(
    commonInputs.map(({ protocol, samples }) => [
      protocol.protocolId,
      stableHash(samples),
    ]),
  ));
  const commonCalciumValues = commonInputs[0]!.samples.map((sample) =>
    sample.freeCalciumUm
  );
  const commonBenchCalciumRangeUM = Object.freeze({
    minimum: Math.min(...commonCalciumValues),
    maximum: Math.max(...commonCalciumValues),
  });
  const allTrajectoriesComplete = results.every((result) => result.allStepsValid);
  const hillSerialForceBalancePass = results.every((result) =>
    result.maximumAbsoluteSerialResidualPa == null ||
    result.maximumAbsoluteSerialResidualPa <= 1e-3
  );
  const landStateHealthPass = results.every((result) =>
    result.minimumLandPopulation == null ||
    (result.minimumLandPopulation >= -1e-12 &&
      (result.maximumLandConservationResidual ?? Number.POSITIVE_INFINITY) <=
        1e-10 &&
      result.landProjectionOccurred === false)
  );
  const landWorkMappingPass = results.every((result) =>
    result.maximumAbsoluteContinuousPowerResidualWPerM3 == null ||
    (result.maximumAbsoluteContinuousPowerResidualWPerM3 <= 1e-8 &&
      (result.maximumAbsoluteDiscretePowerResidualWPerM3 ??
        Number.POSITIVE_INFINITY) <= 1e-8 &&
      (result.maximumAbsoluteSourceReportedPowerResidualWPerM3 ??
        Number.POSITIVE_INFINITY) <= 1e-8 &&
      (result.maximumAbsoluteFiniteDifferenceWorkResidualPa ??
        Number.POSITIVE_INFINITY) <= 1e-5)
  );
  const nearUnityAblationPass = results
    .filter((result) =>
      result.variantId === "hill-algebraic-fv-near-unity" ||
      result.variantId === "hill-lag25-fv-near-unity"
    )
    .every((result) =>
      result.trace.every((sample) =>
        sample.forceVelocityFactor != null &&
        Math.abs(sample.forceVelocityFactor - 1) <= 1e-6
      )
    );
  return Object.freeze({
    benchId: ATRIAL_ACTIVE_LAW_SHOOTOUT_BENCH_ID_V1,
    schemaVersion: 1 as const,
    evidenceStatus:
      "component-causal-screen-only-no-physiology-ranking-or-runtime-promotion" as const,
    decision: "no-winner-selected" as const,
    claimBoundary: Object.freeze({
      prescribedStrainNotClosedLoop: true as const,
      commonDimensionalCalciumTrace: true as const,
      prescribedCalciumIsSynthetic: true as const,
      landNiedererPaperBaselineReproduced: false as const,
      nearUnityForceVelocityIsAClassicalLawParameterLimit: true as const,
      exactForceVelocityUnityClaimed: false as const,
      passiveStressExcludedFromComparison: true as const,
      slsStressExcludedFromComparison: true as const,
      landExternalSeeAdded: false as const,
      landPostHocForceVelocityAdded: false as const,
      landStressGainAdded: false as const,
      spherePressureIsProjectionOnly: true as const,
      experimentalTargetsApplied: false as const,
      patientFitClaimed: false as const,
      automaticWinnerSelection: false as const,
    }),
    protocol: Object.freeze({
      cycleLengthSec: CYCLE_LENGTH_SEC,
      heartRateBpm: 60,
      dtSec,
      warmupCycles,
      traceIntervalSec: TRACE_INTERVAL_SEC,
      calciumDriver: COMMON_CALCIUM_PARAMS,
      commonBenchCalciumRangeUM,
      landNiedererPaperCalibrationCalciumContext:
        LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1.calciumContext,
      protocolDefinitions: PROTOCOLS.map((protocol) => Object.freeze({
        protocolId: protocol.protocolId,
        label: protocol.label,
        shorteningEndPhase01: protocol.shorteningEndPhase01,
      })),
      commonInputHashAlgorithm: "fnv1a32-stable-json" as const,
      commonInputHashByProtocol: inputHashByProtocol,
    }),
    variants: variantDefinitions(),
    factorialDesign: Object.freeze({
      hillTwoByTwoComplete: true as const,
      thinFilamentFactor: Object.freeze([
        "algebraic-equilibrium",
        "one-state-normalized-lag-25ms",
      ] as const),
      forceVelocityFactor: Object.freeze([
        "classical-hill",
        "near-unity-classical-parameter-limit-diagnostic",
      ] as const),
      landRole: "external-mechanistic-comparator-not-a-factorial-arm" as const,
      allFiveArmsUseTheSameCalciumAndStrainSamples: true as const,
    }),
    results: Object.freeze(results),
    factorialContrasts: summarizeFactorialContrasts(results),
    dtRefinement: Object.freeze(dtRefinement),
    numericalGates: Object.freeze({
      allTrajectoriesComplete,
      hillSerialForceBalancePass,
      landStateHealthPass,
      landWorkMappingPass,
      nearUnityAblationPass,
      allNumericalGatesPass:
        allTrajectoriesComplete &&
        hillSerialForceBalancePass &&
        landStateHealthPass &&
        landWorkMappingPass &&
        nearUnityAblationPass,
    }),
    interpretationBoundary: Object.freeze({
      primaryCausalDiagnostic:
        "velocity-stop recovery tests whether instantaneous fV unloading reverses while Ca and length remain controlled" as const,
      morphologyMetricsAreReportOnly: true as const,
      lowerReboundAloneCannotSelectWinner: true as const,
      nextGate:
        "digitized atrial twitch-force-calcium-length-step targets then LA-only closed-loop V2" as const,
      finiteRateReducedLawStatus:
        "deferred-until-Land-protocol-response-is-established-to-avoid-inventing-an-uncalibrated-state-law" as const,
      circAdaptStatus:
        "deferred-external-oracle-pending-version-license-and-stress-convention-lock" as const,
    }),
  });
}

function summarizeFactorialContrasts(
  results: readonly AtrialActiveLawProtocolResultV1[],
) {
  const row = (variantId: AtrialActiveLawVariantIdV1) => results.find(
    (result) =>
      result.variantId === variantId &&
      result.protocolId === "a-wave-shortening-stop",
  )!;
  const algClassical = row("hill-algebraic-classical-fv");
  const lagClassical = row("hill-lag25-classical-fv");
  const algUnity = row("hill-algebraic-fv-near-unity");
  const lagUnity = row("hill-lag25-fv-near-unity");
  const phase = (result: AtrialActiveLawProtocolResultV1) =>
    result.peakActiveStressPhase01;
  const post = (result: AtrialActiveLawProtocolResultV1) =>
    result.velocityStopDiagnostics.postStopGainNormalizedByPeak ?? 0;
  const postKPa = (result: AtrialActiveLawProtocolResultV1) =>
    result.velocityStopDiagnostics.postStopGainKPa ?? 0;
  return Object.freeze({
    protocolId: "a-wave-shortening-stop" as const,
    status: "report-only-causal-attribution-not-physiology-ranking" as const,
    peakPhase: Object.freeze({
      lagEffectWithClassicalFv: phase(lagClassical) - phase(algClassical),
      lagEffectWithNearUnityFv: phase(lagUnity) - phase(algUnity),
      classicalFvEffectWithAlgebraicGate:
        phase(algClassical) - phase(algUnity),
      classicalFvEffectWithLag25: phase(lagClassical) - phase(lagUnity),
      differenceInDifferences:
        (phase(lagClassical) - phase(algClassical)) -
        (phase(lagUnity) - phase(algUnity)),
    }),
    postStopGainNormalizedByPeak: Object.freeze({
      lagEffectWithClassicalFv: post(lagClassical) - post(algClassical),
      lagEffectWithNearUnityFv: post(lagUnity) - post(algUnity),
      classicalFvEffectWithAlgebraicGate:
        post(algClassical) - post(algUnity),
      classicalFvEffectWithLag25: post(lagClassical) - post(lagUnity),
      differenceInDifferences:
        (post(lagClassical) - post(algClassical)) -
        (post(lagUnity) - post(algUnity)),
    }),
    postStopGainKPa: Object.freeze({
      lagEffectWithClassicalFv:
        postKPa(lagClassical) - postKPa(algClassical),
      lagEffectWithNearUnityFv: postKPa(lagUnity) - postKPa(algUnity),
      classicalFvEffectWithAlgebraicGate:
        postKPa(algClassical) - postKPa(algUnity),
      classicalFvEffectWithLag25:
        postKPa(lagClassical) - postKPa(lagUnity),
      differenceInDifferences:
        (postKPa(lagClassical) - postKPa(algClassical)) -
        (postKPa(lagUnity) - postKPa(algUnity)),
    }),
    interpretation:
      "peak-normalized and raw-kPa interactions are report-only; positive interaction means lag magnifies the late effect of the instantaneous classical fV branch under this fixed component protocol" as const,
  });
}

function generateCommonInput(
  protocol: ProtocolDefinitionV1,
  dtSec: number,
  cycles: number,
): readonly AtrialActiveLawCommonInputSampleV1[] {
  const stepsPerCycle = Math.round(CYCLE_LENGTH_SEC / dtSec);
  if (Math.abs(stepsPerCycle * dtSec - CYCLE_LENGTH_SEC) > 1e-12) {
    throw new Error("dtSec must divide the one-second component cycle exactly");
  }
  let calciumState: PeriodicPrescribedCalciumDriverStateV2 =
    initialPeriodicPrescribedCalciumDriverStateV2();
  let previousFreeCalciumUm = INITIAL_FREE_CALCIUM_UM;
  const samples: AtrialActiveLawCommonInputSampleV1[] = [];
  for (let cycleIndex = 0; cycleIndex < cycles; cycleIndex += 1) {
    for (let step = 1; step <= stepsPerCycle; step += 1) {
      const phase01 = step / stepsPerCycle;
      const previousPhase01 = (step - 1) / stepsPerCycle;
      const absoluteTimeSec = cycleIndex * CYCLE_LENGTH_SEC + step * dtSec;
      const calcium = trialPeriodicPrescribedCalciumDriverV2(
        calciumState,
        absoluteTimeSec,
        dtSec,
        COMMON_CALCIUM_PARAMS,
      );
      if (!calcium.valid) {
        throw new Error(`common calcium trace failed: ${calcium.issues.join("; ")}`);
      }
      const previousFiberLogStrain = protocol.strainAtPhase(previousPhase01);
      const fiberLogStrain = protocol.strainAtPhase(phase01);
      const cavityVolumeMl = cavityVolumeFromFiberStrain(fiberLogStrain);
      samples.push(Object.freeze({
        absoluteTimeSec,
        cycleIndex,
        phase01,
        dtSec,
        previousFreeCalciumUm,
        midpointFreeCalciumUm: calcium.midpointFreeCalciumUM,
        freeCalciumUm: calcium.freeCalciumUM,
        previousFiberLogStrain,
        fiberLogStrain,
        fiberLogStrainRatePerSec:
          (fiberLogStrain - previousFiberLogStrain) / dtSec,
        cavityVolumeMl,
      }));
      calciumState = calcium.nextState;
      previousFreeCalciumUm = calcium.freeCalciumUM;
    }
  }
  return Object.freeze(samples);
}

function simulateVariant(
  variantId: AtrialActiveLawVariantIdV1,
  protocol: ProtocolDefinitionV1,
  samples: readonly AtrialActiveLawCommonInputSampleV1[],
  warmupCycles: number,
): AtrialActiveLawProtocolResultV1 {
  const first = samples[0]!;
  const initialStrain = first.previousFiberLogStrain;
  let hillState: HillCeSeeSlsStateV1 | null = null;
  let hillParams: HillCeSeeSlsParamsV1 | null = null;
  let landState: Land2017ActiveOnlyStateV1 | null = null;
  if (variantId === "land2017-atrial-active-only") {
    landState = initialLand2017ActiveOnlyStateV1(
      initialStrain,
      INITIAL_FREE_CALCIUM_UM,
    );
  } else {
    hillParams = hillParamsFor(variantId);
    const activation = equilibriumLandFormCaTroponinActivationStateV1(
      INITIAL_FREE_CALCIUM_UM,
      initialStrain,
      hillParams.calciumTroponinActivation,
    );
    hillState = initialHillCeSeeSlsStateV1(
      initialStrain,
      initialStrain,
      0,
      activation.caTroponin01,
      activation.thinFilamentAvailability01,
    );
  }

  const trace: AtrialActiveLawTraceSampleV1[] = [];
  let firstFailure: string | null = null;
  let maximumSerialResidualPa: number | null = null;
  let maximumContinuousPowerResidual: number | null = null;
  let maximumDiscretePowerResidual: number | null = null;
  let maximumSourceReportedPowerResidual: number | null = null;
  let maximumFiniteDifferenceWorkResidual: number | null = null;
  let minimumLandPopulation: number | null = null;
  let maximumLandConservationResidual: number | null = null;
  let landProjectionOccurred: boolean | null = null;
  const finalCycle = warmupCycles - 1;
  const traceStride = Math.max(1, Math.round(TRACE_INTERVAL_SEC / first.dtSec));

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index]!;
    let activeStressPa: number;
    let activationProxy01: number;
    let forceVelocityFactor: number | null;
    let ceLogStrain: number | null;
    let seeLogStrain: number | null;
    let sourceNominalStressPa: number | null;
    if (variantId === "land2017-atrial-active-only") {
      const trial = trialLand2017ActiveOnlyV1(landState!, {
        dtSec: sample.dtSec,
        fiberLogStrain: sample.fiberLogStrain,
        freeCalciumUm: sample.freeCalciumUm,
      });
      if (!trial.valid || trial.readback == null) {
        firstFailure = trial.issues.join("; ");
        break;
      }
      landState = commitLand2017ActiveOnlyTrialV1(trial);
      activeStressPa = trial.readback.wallActiveKirchhoffStressPa;
      activationProxy01 = trial.readback.state.CaTRPN;
      forceVelocityFactor = null;
      ceLogStrain = null;
      seeLogStrain = null;
      sourceNominalStressPa = trial.readback.sourceNominalActiveStressPa;
      maximumContinuousPowerResidual = maximumAbsolute(
        maximumContinuousPowerResidual,
        trial.readback.continuousPowerResidualWPerM3,
      );
      maximumDiscretePowerResidual = maximumAbsolute(
        maximumDiscretePowerResidual,
        trial.readback.discretePowerResidualWPerM3,
      );
      maximumSourceReportedPowerResidual = maximumAbsolute(
        maximumSourceReportedPowerResidual,
        trial.readback.sourceReportedPowerResidualWPerM3,
      );
      maximumFiniteDifferenceWorkResidual = maximumAbsolute(
        maximumFiniteDifferenceWorkResidual,
        trial.readback.finiteDifferenceWorkConjugacyResidualPa,
      );
      minimumLandPopulation = minimumNullable(
        minimumLandPopulation,
        trial.readback.health.minimumPopulation,
      );
      maximumLandConservationResidual = maximumAbsolute(
        maximumLandConservationResidual,
        trial.readback.health.stateConservationResidual,
      );
      landProjectionOccurred =
        (landProjectionOccurred ?? false) || trial.readback.health.projectionUsed;
    } else {
      const trial = trialHillCeSeeSlsV1(
        hillState!,
        {
          dtSec: sample.dtSec,
          totalStrain: sample.fiberLogStrain,
          freeCalciumUm: sample.freeCalciumUm,
          midpointFreeCalciumUm: sample.midpointFreeCalciumUm,
        },
        hillParams!,
      );
      if (!trial.valid || !trial.finite || !trial.solver.converged) {
        firstFailure = trial.issues.map((issue) => issue.message).join("; ");
        break;
      }
      hillState = commitHillCeSeeSlsTrialV1(trial);
      activeStressPa = trial.readback.stresses.seriesElasticTensionPa;
      activationProxy01 = trial.readback.thinFilamentAvailability01;
      forceVelocityFactor = trial.readback.factors.forceVelocity;
      ceLogStrain = trial.readback.strains.contractileElement;
      seeLogStrain = trial.readback.strains.seriesElasticElement;
      sourceNominalStressPa = null;
      maximumSerialResidualPa = maximumAbsolute(
        maximumSerialResidualPa,
        trial.readback.stresses.serialEquilibriumResidualPa,
      );
    }
    if (sample.cycleIndex === finalCycle &&
        ((index + 1) % traceStride === 0 || sample.phase01 === 1)) {
      const geometry = evaluateOneFiberVolumeGeometryV1(
        sample.cavityVolumeMl,
        LA_GEOMETRY,
      );
      trace.push(Object.freeze({
        phase01: sample.phase01,
        freeCalciumUm: sample.freeCalciumUm,
        fiberLogStrain: sample.fiberLogStrain,
        fiberLogStrainRatePerSec: sample.fiberLogStrainRatePerSec,
        cavityVolumeMl: sample.cavityVolumeMl,
        activeKirchhoffStressKPa: activeStressPa / 1_000,
        sphereProjectedActivePressureMmHg:
          oneFiberCavityPressurePaV1(geometry, activeStressPa) / PA_PER_MMHG,
        activationProxy01,
        forceVelocityFactor,
        ceLogStrain,
        seeLogStrain,
        sourceNominalStressKPa:
          sourceNominalStressPa == null ? null : sourceNominalStressPa / 1_000,
      }));
    }
  }

  return summarizeResult(
    variantId,
    protocol,
    trace,
    firstFailure,
    maximumSerialResidualPa,
    maximumContinuousPowerResidual,
    maximumDiscretePowerResidual,
    maximumSourceReportedPowerResidual,
    maximumFiniteDifferenceWorkResidual,
    minimumLandPopulation,
    maximumLandConservationResidual,
    landProjectionOccurred,
  );
}

function summarizeResult(
  variantId: AtrialActiveLawVariantIdV1,
  protocol: ProtocolDefinitionV1,
  trace: readonly AtrialActiveLawTraceSampleV1[],
  firstFailure: string | null,
  maximumSerialResidualPa: number | null,
  maximumContinuousPowerResidual: number | null,
  maximumDiscretePowerResidual: number | null,
  maximumSourceReportedPowerResidual: number | null,
  maximumFiniteDifferenceWorkResidual: number | null,
  minimumLandPopulation: number | null,
  maximumLandConservationResidual: number | null,
  landProjectionOccurred: boolean | null,
): AtrialActiveLawProtocolResultV1 {
  if (trace.length === 0) {
    return Object.freeze({
      variantId,
      protocolId: protocol.protocolId,
      allStepsValid: false,
      firstFailure: firstFailure ?? "no retained complete-cycle trace",
      peakActiveStressKPa: Number.NaN,
      peakActiveStressPhase01: Number.NaN,
      peakSphereActivePressureMmHg: Number.NaN,
      minimumFiberLogStrain: Number.NaN,
      maximumFiberLogStrain: Number.NaN,
      minimumCavityVolumeMl: Number.NaN,
      maximumCavityVolumeMl: Number.NaN,
      maximumAbsoluteSerialResidualPa: maximumSerialResidualPa,
      maximumAbsoluteContinuousPowerResidualWPerM3:
        maximumContinuousPowerResidual,
      maximumAbsoluteDiscretePowerResidualWPerM3:
        maximumDiscretePowerResidual,
      maximumAbsoluteSourceReportedPowerResidualWPerM3:
        maximumSourceReportedPowerResidual,
      maximumAbsoluteFiniteDifferenceWorkResidualPa:
        maximumFiniteDifferenceWorkResidual,
      minimumLandPopulation,
      maximumLandConservationResidual,
      landProjectionOccurred,
      velocityStopDiagnostics: emptyVelocityStopDiagnostics(),
      trace: Object.freeze([]),
    });
  }
  const peakIndex = indexOfMaximum(trace, (sample) => sample.activeKirchhoffStressKPa);
  const pressurePeakIndex = indexOfMaximum(
    trace,
    (sample) => sample.sphereProjectedActivePressureMmHg,
  );
  return Object.freeze({
    variantId,
    protocolId: protocol.protocolId,
    allStepsValid: firstFailure == null,
    firstFailure,
    peakActiveStressKPa: trace[peakIndex]!.activeKirchhoffStressKPa,
    peakActiveStressPhase01: trace[peakIndex]!.phase01,
    peakSphereActivePressureMmHg:
      trace[pressurePeakIndex]!.sphereProjectedActivePressureMmHg,
    minimumFiberLogStrain: Math.min(...trace.map((sample) => sample.fiberLogStrain)),
    maximumFiberLogStrain: Math.max(...trace.map((sample) => sample.fiberLogStrain)),
    minimumCavityVolumeMl: Math.min(...trace.map((sample) => sample.cavityVolumeMl)),
    maximumCavityVolumeMl: Math.max(...trace.map((sample) => sample.cavityVolumeMl)),
    maximumAbsoluteSerialResidualPa: maximumSerialResidualPa,
    maximumAbsoluteContinuousPowerResidualWPerM3:
      maximumContinuousPowerResidual,
    maximumAbsoluteDiscretePowerResidualWPerM3:
      maximumDiscretePowerResidual,
    maximumAbsoluteSourceReportedPowerResidualWPerM3:
      maximumSourceReportedPowerResidual,
    maximumAbsoluteFiniteDifferenceWorkResidualPa:
      maximumFiniteDifferenceWorkResidual,
    minimumLandPopulation,
    maximumLandConservationResidual,
    landProjectionOccurred,
    velocityStopDiagnostics: velocityStopDiagnostics(
      trace,
      protocol.shorteningEndPhase01,
      peakIndex,
    ),
    trace: Object.freeze(trace),
  });
}

function velocityStopDiagnostics(
  trace: readonly AtrialActiveLawTraceSampleV1[],
  stopPhase01: number | null,
  peakIndex: number,
): AtrialActiveLawProtocolResultV1["velocityStopDiagnostics"] {
  if (stopPhase01 == null) return emptyVelocityStopDiagnostics();
  const fastestIndex = indexOfMinimum(
    trace,
    (sample) => sample.fiberLogStrainRatePerSec,
  );
  const stopIndex = nearestPhaseIndex(trace, stopPhase01);
  const postStop = trace.filter((sample) =>
    sample.phase01 >= stopPhase01 && sample.phase01 <= stopPhase01 + 0.1
  );
  const postStopMax = Math.max(
    ...postStop.map((sample) => sample.activeKirchhoffStressKPa),
  );
  const peak = Math.max(1e-9, trace[peakIndex]!.activeKirchhoffStressKPa);
  const fastestStress = trace[fastestIndex]!.activeKirchhoffStressKPa;
  const stopStress = trace[stopIndex]!.activeKirchhoffStressKPa;
  const minimumVolume = Math.min(...trace.map((sample) => sample.cavityVolumeMl));
  const maximumVolume = Math.max(...trace.map((sample) => sample.cavityVolumeMl));
  const volumeSpan = maximumVolume - minimumVolume;
  return Object.freeze({
    applicable: true,
    fastestShorteningPhase01: trace[fastestIndex]!.phase01,
    shorteningStopPhase01: trace[stopIndex]!.phase01,
    stressAtFastestShorteningKPa: fastestStress,
    stressAtShorteningStopKPa: stopStress,
    maximumStressWithin100msAfterStopKPa: postStopMax,
    recoveryFromFastestToStopNormalizedByPeak:
      (stopStress - fastestStress) / peak,
    postStopGainNormalizedByPeak: (postStopMax - stopStress) / peak,
    recoveryFromFastestToStopKPa: stopStress - fastestStress,
    postStopGainKPa: postStopMax - stopStress,
    remainingShorteningAtGlobalStressPeak01:
      volumeSpan <= 0
        ? null
        : (trace[peakIndex]!.cavityVolumeMl - minimumVolume) / volumeSpan,
  });
}

function emptyVelocityStopDiagnostics():
AtrialActiveLawProtocolResultV1["velocityStopDiagnostics"] {
  return Object.freeze({
    applicable: false,
    fastestShorteningPhase01: null,
    shorteningStopPhase01: null,
    stressAtFastestShorteningKPa: null,
    stressAtShorteningStopKPa: null,
    maximumStressWithin100msAfterStopKPa: null,
    recoveryFromFastestToStopNormalizedByPeak: null,
    postStopGainNormalizedByPeak: null,
    recoveryFromFastestToStopKPa: null,
    postStopGainKPa: null,
    remainingShorteningAtGlobalStressPeak01: null,
  });
}

function runDtRefinement(
  coarseResults: readonly AtrialActiveLawProtocolResultV1[],
  warmupCycles: number,
  coarseDtSec: number,
) {
  const protocol = PROTOCOLS.find(
    (entry) => entry.protocolId === "a-wave-shortening-stop",
  )!;
  const fineDtSec = coarseDtSec / 2;
  const fineSamples = generateCommonInput(protocol, fineDtSec, warmupCycles);
  return ATRIAL_ACTIVE_LAW_VARIANTS_V1.map((variantId) => {
    const coarse = coarseResults.find((result) =>
      result.variantId === variantId && result.protocolId === protocol.protocolId
    )!;
    const fine = simulateVariant(
      variantId,
      protocol,
      fineSamples,
      warmupCycles,
    );
    return Object.freeze({
      variantId,
      protocolId: protocol.protocolId,
      coarseDtSec,
      fineDtSec,
      fineAllStepsValid: fine.allStepsValid,
      peakStressRelativeDifference: normalizedDifference(
        coarse.peakActiveStressKPa,
        fine.peakActiveStressKPa,
      ),
      peakPhaseAbsoluteDifference:
        Math.abs(coarse.peakActiveStressPhase01 - fine.peakActiveStressPhase01),
      velocityStopRecoveryAbsoluteDifference: Math.abs(
        (coarse.velocityStopDiagnostics
          .recoveryFromFastestToStopNormalizedByPeak ?? 0) -
        (fine.velocityStopDiagnostics
          .recoveryFromFastestToStopNormalizedByPeak ?? 0),
      ),
      status: "report-only-not-a-physiology-gate" as const,
    });
  });
}

function hillParamsFor(
  variantId: Exclude<AtrialActiveLawVariantIdV1, "land2017-atrial-active-only">,
): HillCeSeeSlsParamsV1 {
  const source =
    DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.atria.left.material;
  const {
    thinFilamentDynamics: _thinFilamentDynamics,
    ...activationWithoutDynamics
  } = source.calciumTroponinActivation;
  const lag =
    variantId === "hill-lag25-classical-fv" ||
    variantId === "hill-lag25-fv-near-unity";
  const unity =
    variantId === "hill-algebraic-fv-near-unity" ||
    variantId === "hill-lag25-fv-near-unity";
  return prepareHillCeSeeSlsParamsV1({
    ...source,
    parameterSetId: `${source.parameterSetId}::active-law-shootout::${variantId}`,
    calciumTroponinActivation: {
      ...activationWithoutDynamics,
      parameterSetId:
        `${activationWithoutDynamics.parameterSetId}::active-law-shootout::${variantId}`,
      ...(lag
        ? {
            thinFilamentDynamics: {
              mode: "one-state-normalized-lag" as const,
              timeConstantSec: 0.025,
            },
          }
        : {}),
    },
    contractileElement: {
      ...source.contractileElement,
      ...(unity
        ? {
            hillCurvatureRatio: 1e6,
            maximumShorteningVelocityPerSec: 1e9,
            maximumLengtheningForceVelocityFactor: 1,
          }
        : {}),
    },
    sls: {
      enabled: false,
      modulusPa: 0,
      relaxationTimeSec: source.sls.relaxationTimeSec,
    },
  });
}

function variantDefinitions() {
  const hillSource =
    DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1.atria.left.material;
  return Object.freeze([
    Object.freeze({
      variantId: "hill-algebraic-classical-fv" as const,
      role: "PR467-current-active-closure-control" as const,
      activation: "Land-form-CaTRPN-plus-normalized-algebraic-gate" as const,
      explicitClassicalForceVelocity: true,
      externalSeriesElasticElement: true,
      passiveIncludedInComparedStress: false,
      slsIncludedInComparedStress: false,
      parameterSetId: hillSource.parameterSetId,
      effectiveParameterHash:
        stableHash(hillParamsFor("hill-algebraic-classical-fv")),
    }),
    Object.freeze({
      variantId: "hill-lag25-classical-fv" as const,
      role: "PR467-lag25-known-failure-control" as const,
      activation: "project-engineering-25ms-normalized-availability-lag" as const,
      explicitClassicalForceVelocity: true,
      externalSeriesElasticElement: true,
      passiveIncludedInComparedStress: false,
      slsIncludedInComparedStress: false,
      parameterSetId: hillSource.parameterSetId,
      effectiveParameterHash:
        stableHash(hillParamsFor("hill-lag25-classical-fv")),
    }),
    Object.freeze({
      variantId: "hill-algebraic-fv-near-unity" as const,
      role: "single-factor-near-unity-fV-causal-ablation" as const,
      activation: "Land-form-CaTRPN-plus-normalized-algebraic-gate" as const,
      explicitClassicalForceVelocity: false,
      externalSeriesElasticElement: true,
      passiveIncludedInComparedStress: false,
      slsIncludedInComparedStress: false,
      parameterSetId: hillSource.parameterSetId,
      effectiveParameterHash:
        stableHash(hillParamsFor("hill-algebraic-fv-near-unity")),
    }),
    Object.freeze({
      variantId: "hill-lag25-fv-near-unity" as const,
      role: "lag25-with-near-unity-fV-factorial-arm" as const,
      activation: "project-engineering-25ms-normalized-availability-lag" as const,
      explicitClassicalForceVelocity: false,
      externalSeriesElasticElement: true,
      passiveIncludedInComparedStress: false,
      slsIncludedInComparedStress: false,
      parameterSetId: hillSource.parameterSetId,
      effectiveParameterHash:
        stableHash(hillParamsFor("hill-lag25-fv-near-unity")),
    }),
    Object.freeze({
      variantId: "land2017-atrial-active-only" as const,
      role: "mechanistic-crossbridge-state-comparator" as const,
      activation: "Land2017-CaTRPN-B-W-S-zetaW-zetaS" as const,
      explicitClassicalForceVelocity: false,
      externalSeriesElasticElement: false,
      passiveIncludedInComparedStress: false,
      slsIncludedInComparedStress: false,
      parameterSetId:
        DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1.parameterPackId,
      effectiveParameterHash:
        DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1
          .parameterPackStableHash,
    }),
  ]);
}

function cavityVolumeFromFiberStrain(fiberLogStrain: number): number {
  const referenceMidwallVolumeMl =
    LA_GEOMETRY.referenceCavityVolumeMl +
    LA_GEOMETRY.midwallFraction01 * LA_GEOMETRY.wallVolumeMl;
  const midwallVolumeMl = referenceMidwallVolumeMl * Math.exp(3 * fiberLogStrain);
  const cavityVolumeMl =
    midwallVolumeMl - LA_GEOMETRY.midwallFraction01 * LA_GEOMETRY.wallVolumeMl;
  if (!(cavityVolumeMl > 0) || !Number.isFinite(cavityVolumeMl)) {
    throw new Error("prescribed fiber strain maps outside positive LA volume");
  }
  return cavityVolumeMl;
}

function cyclicMotion(
  phase01: number,
  start: number,
  moved: number,
  moveStart: number,
  moveEnd: number,
  returnStart: number,
  returnEnd: number,
): number {
  if (phase01 <= moveStart) return start;
  if (phase01 < moveEnd) {
    return cosineInterpolate(start, moved, (phase01 - moveStart) / (moveEnd - moveStart));
  }
  if (phase01 <= returnStart) return moved;
  if (phase01 < returnEnd) {
    return cosineInterpolate(moved, start, (phase01 - returnStart) / (returnEnd - returnStart));
  }
  return start;
}

function cosineInterpolate(start: number, end: number, fraction01: number): number {
  const weight = 0.5 - 0.5 * Math.cos(Math.PI * fraction01);
  return start + (end - start) * weight;
}

function indexOfMaximum<T>(values: readonly T[], valueAt: (value: T) => number): number {
  let selected = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (valueAt(values[index]!) > valueAt(values[selected]!)) selected = index;
  }
  return selected;
}

function indexOfMinimum<T>(values: readonly T[], valueAt: (value: T) => number): number {
  let selected = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (valueAt(values[index]!) < valueAt(values[selected]!)) selected = index;
  }
  return selected;
}

function nearestPhaseIndex(
  trace: readonly AtrialActiveLawTraceSampleV1[],
  phase01: number,
): number {
  let selected = 0;
  for (let index = 1; index < trace.length; index += 1) {
    if (Math.abs(trace[index]!.phase01 - phase01) <
        Math.abs(trace[selected]!.phase01 - phase01)) selected = index;
  }
  return selected;
}

function maximumAbsolute(current: number | null, value: number): number {
  return Math.max(current ?? 0, Math.abs(value));
}

function minimumNullable(current: number | null, value: number): number {
  return current == null ? value : Math.min(current, value);
}

function normalizedDifference(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(1e-9, Math.abs(a), Math.abs(b));
}

function validateProtocolOptions(dtSec: number, warmupCycles: number): void {
  if (!(dtSec > 0) || !Number.isFinite(dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  if (!Number.isInteger(warmupCycles) || warmupCycles < 2) {
    throw new Error("warmupCycles must be an integer of at least two");
  }
}
