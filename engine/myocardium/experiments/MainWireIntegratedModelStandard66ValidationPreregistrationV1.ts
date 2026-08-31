import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_INPUT_KEYS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
  MAIN_WIRE_VALVE_PA_PER_MMHG_V2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID =
  "main-wire-integrated-model-standard66-validation-preregistration-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1 =
  Object.freeze([
    Object.freeze({
      armId: "dt-2ms-production",
      requestedStepSec: 0.002,
      role: "production",
    }),
    Object.freeze({
      armId: "dt-1ms-intermediate",
      requestedStepSec: 0.001,
      role: "intermediate",
    }),
    Object.freeze({
      armId: "dt-0p5ms-reference",
      requestedStepSec: 0.0005,
      role: "reference",
    }),
  ] as const);

export type MainWireIntegratedModelStandard66ValidationClockArmIdV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1)[number]["armId"];

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_PAIR_IDS_V1 =
  Object.freeze([
    "dt-2ms-vs-dt-1ms",
    "dt-1ms-vs-dt-0p5ms",
    "dt-2ms-vs-dt-0p5ms",
  ] as const);

export type MainWireIntegratedModelStandard66ValidationClockPairIdV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_PAIR_IDS_V1)[number];

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_PAIRS_V1 =
  Object.freeze([
    clockPair("dt-2ms-vs-dt-1ms", "dt-2ms-production", "dt-1ms-intermediate"),
    clockPair(
      "dt-1ms-vs-dt-0p5ms",
      "dt-1ms-intermediate",
      "dt-0p5ms-reference",
    ),
    clockPair(
      "dt-2ms-vs-dt-0p5ms",
      "dt-2ms-production",
      "dt-0p5ms-reference",
    ),
  ] as const);

type DesignSignV1 = -1 | 1;

export type MainWireIntegratedModelStandard66ResolutionIvSignsV1 = Readonly<{
  AHeartRate: DesignSignV1;
  BSystemicResistance: DesignSignV1;
  CPulmonaryResistance: DesignSignV1;
  DTotalBloodVolume: DesignSignV1;
  EVenousTone: DesignSignV1;
  FArterialStiffness: DesignSignV1;
  GPeep: DesignSignV1;
}>;

type MainWireIntegratedModelStandard66ResolutionIvBaseRowV1 = Readonly<{
  rowId: `resolution-iv-${string}`;
  AHeartRate: DesignSignV1;
  BSystemicResistance: DesignSignV1;
  CPulmonaryResistance: DesignSignV1;
  DTotalBloodVolume: DesignSignV1;
}>;

/**
 * Explicit 2^4 base table. Extension columns are generated only by
 * E=ABC, F=ABD, and G=ACD; they are not a seven-axis Cartesian product.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_RESOLUTION_IV_BASE_TABLE_V1 =
  Object.freeze([
    baseRow("resolution-iv-01", -1, -1, -1, -1),
    baseRow("resolution-iv-02", -1, -1, -1, 1),
    baseRow("resolution-iv-03", -1, -1, 1, -1),
    baseRow("resolution-iv-04", -1, -1, 1, 1),
    baseRow("resolution-iv-05", -1, 1, -1, -1),
    baseRow("resolution-iv-06", -1, 1, -1, 1),
    baseRow("resolution-iv-07", -1, 1, 1, -1),
    baseRow("resolution-iv-08", -1, 1, 1, 1),
    baseRow("resolution-iv-09", 1, -1, -1, -1),
    baseRow("resolution-iv-10", 1, -1, -1, 1),
    baseRow("resolution-iv-11", 1, -1, 1, -1),
    baseRow("resolution-iv-12", 1, -1, 1, 1),
    baseRow("resolution-iv-13", 1, 1, -1, -1),
    baseRow("resolution-iv-14", 1, 1, -1, 1),
    baseRow("resolution-iv-15", 1, 1, 1, -1),
    baseRow("resolution-iv-16", 1, 1, 1, 1),
  ] as const);

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_RESOLUTION_IV_LEVELS_V1 =
  Object.freeze({
    AHeartRate: Object.freeze({ low: 50, high: 90, unit: "bpm" }),
    BSystemicResistance: Object.freeze({ low: 0.8, high: 1.2, unit: "scale" }),
    CPulmonaryResistance: Object.freeze({ low: 0.5, high: 0.75, unit: "scale" }),
    DTotalBloodVolume: Object.freeze({ low: 5_000, high: 6_200, unit: "mL" }),
    EVenousTone: Object.freeze({ low: 0, high: 0.5, unit: "fraction" }),
    FArterialStiffness: Object.freeze({ low: 0.6, high: 0.9, unit: "scale" }),
    GPeep: Object.freeze({ low: 0, high: 10, unit: "cmH2O" }),
  } as const);

export type MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1 =
  Readonly<{
    caseId: "default" | `resolution-iv-${string}`;
    designKind: "default" | "resolution-iv-fraction";
    signs: MainWireIntegratedModelStandard66ResolutionIvSignsV1 | null;
    hemodynamicResearchInputs:
      MainWireIntegratedModelHemodynamicResearchInputsV3;
    claim: Readonly<{
      publicRangeEndpointStudy: false;
      fullCartesianStudy: false;
      coldConstructibilityClaimedByProtocol: false;
      exactColdFixtureAdmissionRequiredBeforeRun: true;
    }>;
  }>;

const ENVELOPE_CASE_CLAIM = Object.freeze({
  publicRangeEndpointStudy: false as const,
  fullCartesianStudy: false as const,
  coldConstructibilityClaimedByProtocol: false as const,
  exactColdFixtureAdmissionRequiredBeforeRun: true as const,
});

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1 =
  Object.freeze([
    Object.freeze({
      caseId: "default",
      designKind: "default",
      signs: null,
      hemodynamicResearchInputs:
        MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      claim: ENVELOPE_CASE_CLAIM,
    }),
    ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_RESOLUTION_IV_BASE_TABLE_V1.map(
      resolutionIvCase,
    ),
  ] satisfies readonly MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1[]);

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATE_REFERENCE_ARM_ID_V1 =
  "dt-0p5ms-reference" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1 =
  Object.freeze([
    dtGate("aortic-ejection-time", "s", 0.002, 0),
    dtGate("aortic-local-hydraulic-mean-gradient", "mmHg", 0.25, 0.02),
    dtGate("aortic-local-hydraulic-peak-gradient", "mmHg", 0.25, 0.02),
    dtGate(
      "aortic-vena-contracta-bernoulli-mean-gradient",
      "mmHg",
      0.25,
      0.02,
    ),
    dtGate(
      "aortic-vena-contracta-bernoulli-peak-gradient",
      "mmHg",
      0.25,
      0.02,
    ),
    dtGate("stroke-volume", "mL", 1, 0.01),
    dtGate("mean-arterial-pressure", "mmHg", 0.5, 0.01),
    dtGate("aortic-vmax", "m/s", 0.02, 0.01),
    dtGate("lv-pressure-maximum-dp-dt", "mmHg/s", 50, 0.03),
    dtGate("lv-pressure-minimum-dp-dt", "mmHg/s", 50, 0.03),
  ] as const);

/**
 * Analysis-owned measurement choices frozen before any envelope outcome is
 * inspected. Stable method IDs are repeated here to avoid an engine-to-analysis
 * runtime dependency; tests bind them to the analysis method constants.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_MEASUREMENT_BINDINGS_V1 =
  Object.freeze({
    aorticEjectionTime: Object.freeze({
      gateMetricId: "aortic-ejection-time",
      analysisMethodId: "main-wire-left-ventricular-flow-event-timing-v1",
      analysisMetric:
        "modelFlowEventAorticEjectionDurationSec",
      eventDefinition:
        "AVO-to-AVC-at-one-percent-of-same-beat-positive-AoV-flow-peak",
      peakFraction01: 0.01,
      excludedSubstituteOutputId:
        "hemodynamics.duration.valve-forward-flow.AoV",
      excludedSubstituteMeaning: "Q_AoV-strictly-positive-duration",
    }),
    aorticGradients: Object.freeze([
      gradientBinding(
        "aortic-local-hydraulic-mean-gradient",
        "local-hydraulic",
        "mean",
        "hemodynamics.pressure-gradient.valve.mean-local-hydraulic-forward.AoV",
      ),
      gradientBinding(
        "aortic-local-hydraulic-peak-gradient",
        "local-hydraulic",
        "peak",
        "hemodynamics.pressure-gradient.valve.peak-local-hydraulic-forward.AoV",
      ),
      gradientBinding(
        "aortic-vena-contracta-bernoulli-mean-gradient",
        "vena-contracta-bernoulli",
        "mean",
        "hemodynamics.pressure-gradient.valve.mean-vena-contracta-bernoulli-forward.AoV",
      ),
      gradientBinding(
        "aortic-vena-contracta-bernoulli-peak-gradient",
        "vena-contracta-bernoulli",
        "peak",
        "hemodynamics.pressure-gradient.valve.peak-vena-contracta-bernoulli-forward.AoV",
      ),
    ]),
    strokeVolume: Object.freeze({
      gateMetricId: "stroke-volume",
      primaryOutputId: "hemodynamics.valve-volume.forward.AoV",
      primaryMeaning: "completed-beat-AoV-forward-volume",
      auditOnlyOutputId: "hemodynamics.stroke-volume.LV-event-defined",
      auditOutputMayReplacePrimaryGate: false,
    }),
    meanArterialPressure: Object.freeze({
      gateMetricId: "mean-arterial-pressure",
      primaryOutputId: "hemodynamics.pressure.mean.SA",
      primaryMeaning: "mean-systemic-arterial-pressure-ABP",
      excludedHistoricalOutputId: "hemodynamics.pressure.mean.Ao",
      historicalAorticNodeMayReplacePrimaryGate: false,
    }),
    aorticVmax: Object.freeze({
      gateMetricId: "aortic-vmax",
      sourceOutputId:
        "hemodynamics.pressure-gradient.valve.peak-vena-contracta-bernoulli-forward.AoV",
      primaryFormula:
        "sqrt(2*valve-Pa-per-mmHg*peak-vena-contracta-Bernoulli-gradient-mmHg/valve-blood-density-kg-per-m3)",
      valveConstants: Object.freeze({
        pascalPerMmHg: MAIN_WIRE_VALVE_PA_PER_MMHG_V2,
        bloodDensityKgPerM3:
          MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
      }),
      outputUnit: "m/s",
      simplifiedBernoulliAudit: Object.freeze({
        formula: "sqrt(peak-vena-contracta-Bernoulli-gradient-mmHg/4)",
        mayReplacePrimaryGate: false,
      }),
      modeledDopplerLike: true,
      clinicalDopplerMeasurementClaimed: false,
    }),
    leftVentricularPressureRate: Object.freeze({
      gateMetricIds: Object.freeze([
        "lv-pressure-maximum-dp-dt",
        "lv-pressure-minimum-dp-dt",
      ] as const),
      analysisMethodId:
        "main-wire-left-ventricular-absolute-pressure-central-secant-piecewise-linear-v1",
      primaryConfigurationIdentity:
        "main-wire-left-ventricular-absolute-pressure-central-secant-piecewise-linear-v1;windowSec=0.01",
      pressureBasis: "absolute-left-ventricular",
      estimator: "centered-secant-over-full-window",
      primaryWindowSec: 0.01,
      sensitivityWindowsSec: Object.freeze([0.005, 0.02] as const),
      sensitivityMayReplacePrimaryGate: false,
      clinicalDpDtMeasurementClaimed: false,
    }),
    status: Object.freeze({
      analysisOwned: true,
      preregisteredBeforeOutcomeInspection: true,
      exactFrameOutputReserved: false,
      clinicalMeasurementEquivalenceClaimed: false,
    }),
  } as const);

export function deriveMainWireIntegratedModelStandard66ValidationAorticVmaxV1(
  peakVenaContractaBernoulliGradientMmHg: number,
): number {
  if (
    !Number.isFinite(peakVenaContractaBernoulliGradientMmHg)
    || peakVenaContractaBernoulliGradientMmHg < 0
  ) {
    throw new Error(
      "Standard66 validation peak vena-contracta gradient must be finite and nonnegative",
    );
  }
  return Math.sqrt(
    2
      * MAIN_WIRE_VALVE_PA_PER_MMHG_V2
      * peakVenaContractaBernoulliGradientMmHg
      / MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
  );
}

export type MainWireIntegratedModelStandard66ValidationDtMetricIdV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1)[number]["metricId"];

export type MainWireIntegratedModelStandard66ValidationDtGateEvaluationV1 =
  Readonly<{
    pairId: MainWireIntegratedModelStandard66ValidationClockPairIdV1;
    metricId: MainWireIntegratedModelStandard66ValidationDtMetricIdV1;
    absoluteDifference: number;
    referenceMagnitude: number;
    tolerance: number;
    floatingPointBoundaryAllowance: number;
    passed: boolean;
    semantics: Readonly<{
      difference: "absolute-and-invariant-to-pair-order";
      tolerance: "max-absolute-floor-or-fraction-of-fixed-reference-magnitude";
      referenceArmId:
        typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATE_REFERENCE_ARM_ID_V1;
      equalityPasses: true;
    }>;
  }>;

/**
 * The pair is unordered: swapping first and second cannot change the result.
 * Relative scaling is always the magnitude from the preregistered 0.5 ms arm,
 * never whichever arm happens to be passed second.
 */
export function evaluateMainWireIntegratedModelStandard66ValidationDtGateV1(
  metricId: MainWireIntegratedModelStandard66ValidationDtMetricIdV1,
  firstArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1,
  secondArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1,
  valuesByArm: Readonly<Record<
    MainWireIntegratedModelStandard66ValidationClockArmIdV1,
    number
  >>,
): MainWireIntegratedModelStandard66ValidationDtGateEvaluationV1 {
  const pair = resolveClockPair(firstArmId, secondArmId);
  const gate = MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1
    .find((candidate) => candidate.metricId === metricId);
  if (gate === undefined) {
    throw new Error(`unsupported Standard66 validation metric: ${String(metricId)}`);
  }
  for (const arm of MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1) {
    const value = valuesByArm[arm.armId];
    if (!Number.isFinite(value)) {
      throw new Error(`Standard66 validation ${arm.armId} value must be finite`);
    }
  }
  const absoluteDifference = Math.abs(
    valuesByArm[firstArmId] - valuesByArm[secondArmId],
  );
  const referenceMagnitude = Math.abs(
    valuesByArm[
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATE_REFERENCE_ARM_ID_V1
    ],
  );
  const tolerance = Math.max(
    gate.absoluteFloor,
    gate.referenceRelativeFraction * referenceMagnitude,
  );
  const floatingPointBoundaryAllowance = 8 * Number.EPSILON * Math.max(
    1,
    Math.abs(valuesByArm[firstArmId]),
    Math.abs(valuesByArm[secondArmId]),
    tolerance,
  );
  return Object.freeze({
    pairId: pair.pairId,
    metricId,
    absoluteDifference,
    referenceMagnitude,
    tolerance,
    floatingPointBoundaryAllowance,
    passed: absoluteDifference <= tolerance + floatingPointBoundaryAllowance,
    semantics: Object.freeze({
      difference: "absolute-and-invariant-to-pair-order" as const,
      tolerance: "max-absolute-floor-or-fraction-of-fixed-reference-magnitude" as const,
      referenceArmId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATE_REFERENCE_ARM_ID_V1,
      equalityPasses: true as const,
    }),
  });
}

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1 =
  Object.freeze({
    protocolId: "standard66-production-envelope-settling-v1",
    initialHorizonSec: 48,
    extensionSec: 25,
    maximumHorizonSec: 250,
    evaluationHorizonsSec: Object.freeze([
      48, 73, 98, 123, 148, 173, 198, 223, 248,
    ]),
    extensionMayNotCrossMaximumHorizon: true,
    classifier: "full-accepted-state-period-1",
    consecutiveP1ClosuresRequired: 3,
    failedClosureResetsConsecutiveCount: true,
    claim: Object.freeze({
      protocolOnly: true,
      convergenceOfAnyEnvelopeCaseClaimed: false,
      shorterAcceptedEventSubstepsPermitted: true,
    }),
  } as const);

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_IDS_V1 =
  Object.freeze([
    "pressure-recovery",
    "aortic-opening-drive-raw-versus-local",
    "arterial-tangent-multiplier",
    "characteristic-impedance-resistance-split",
    "proximal-aortic-inertance",
    "land-active-tension-dynamics",
    "matched-alpha-aortic-valve-timing",
    "strong-bridge-exit",
  ] as const);

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_PROTOCOL_V1 =
  Object.freeze({
    protocolId: "standard66-aortic-mechanism-knockout-order-v1",
    orderedMechanismIds:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_IDS_V1,
    oneFactorAtATimeBeforeBundles: true,
    bundleStudyPermittedOnlyAfterOrderedKnockouts: true,
    status: "research-only",
  } as const);

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_STAGE_IDS_V1 =
  Object.freeze([
    "diameter-2p5cm",
    "diameter-3p0cm",
    "diameter-3p8cm",
    "held-out-load-default",
    "held-out-load-high-forward-flow-stress",
    "held-out-load-low-flow-high-afterload-stress",
  ] as const);

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_HELD_OUT_LOADS_V1 =
  Object.freeze([
    geometryLoad(
      "held-out-load-default",
      "default",
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    ),
    geometryLoad(
      "held-out-load-high-forward-flow-stress",
      "high-forward-flow-stress",
      Object.freeze({
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
        heartRateBpm: 90,
        systemicResistance: 0.8,
        pulmonaryResistance: 0.5,
        totalBloodVolumeMl: 6_200,
      }),
    ),
    geometryLoad(
      "held-out-load-low-flow-high-afterload-stress",
      "low-flow-high-afterload-stress",
      Object.freeze({
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
        heartRateBpm: 50,
        systemicResistance: 1.2,
        pulmonaryResistance: 0.75,
        totalBloodVolumeMl: 5_000,
      }),
    ),
  ] as const);

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_V1 =
  Object.freeze({
    profileId: "standard66-aortic-geometry-closed-profile-v1",
    orderedStages: Object.freeze([
      Object.freeze({
        stageId: "diameter-2p5cm",
        stageKind: "local-diameter-law",
        diameterCm: 2.5,
        heldOutLoadId: null,
      }),
      Object.freeze({
        stageId: "diameter-3p0cm",
        stageKind: "local-diameter-law",
        diameterCm: 3,
        heldOutLoadId: null,
      }),
      Object.freeze({
        stageId: "diameter-3p8cm",
        stageKind: "local-diameter-law",
        diameterCm: 3.8,
        heldOutLoadId: null,
      }),
      ...MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_HELD_OUT_LOADS_V1
        .map((load) => Object.freeze({
          stageId: load.loadId,
          stageKind: "held-out-load" as const,
          diameterCm: null,
          heldOutLoadId: load.loadId,
        })),
    ]),
    heldOutLoads:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_HELD_OUT_LOADS_V1,
    localGeometryLawGateRequiredBeforeHeldOutLoads: true,
    parameterFittingAtHeldOutLoadsPermitted: false,
    status: "research-only",
  } as const);

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1 =
  Object.freeze({
    preregistrationId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
    clockArms:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
    clockPairs:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_PAIRS_V1,
    heldOutEnvelope:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1,
    dtGates: MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1,
    measurementBindings:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_MEASUREMENT_BINDINGS_V1,
    settlingProtocol:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1,
    mechanismKnockoutProtocol:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_PROTOCOL_V1,
    geometryProfile:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_V1,
    status: Object.freeze({
      researchOnly: true,
      exactModelContract: false,
      outputRegistryContract: false,
      modelSurfaceContract: false,
      outcomeOrConvergenceClaim: false,
    }),
  } as const);

export function validateMainWireIntegratedModelStandard66ValidationEnvelopeV1(
  cases: readonly MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1[],
): void {
  if (cases.length !== 17) {
    throw new Error("Standard66 validation envelope must contain exactly 17 cases");
  }
  const ids = new Set<string>();
  const tuples = new Set<string>();
  for (const candidate of cases) {
    if (ids.has(candidate.caseId)) {
      throw new Error(`duplicate Standard66 validation case id: ${candidate.caseId}`);
    }
    ids.add(candidate.caseId);
    const tuple = MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_INPUT_KEYS_V3
      .map((key) => `${key}=${candidate.hemodynamicResearchInputs[key]}`)
      .join("|");
    if (tuples.has(tuple)) {
      throw new Error(`duplicate Standard66 validation input tuple: ${candidate.caseId}`);
    }
    tuples.add(tuple);
    if (candidate.designKind === "resolution-iv-fraction") {
      if (candidate.signs === null) {
        throw new Error(`missing Standard66 resolution-IV signs: ${candidate.caseId}`);
      }
      const { signs } = candidate;
      if (
        signs.EVenousTone
          !== multiplySigns(signs.AHeartRate, signs.BSystemicResistance, signs.CPulmonaryResistance)
        || signs.FArterialStiffness
          !== multiplySigns(signs.AHeartRate, signs.BSystemicResistance, signs.DTotalBloodVolume)
        || signs.GPeep
          !== multiplySigns(signs.AHeartRate, signs.CPulmonaryResistance, signs.DTotalBloodVolume)
      ) {
        throw new Error(`invalid Standard66 resolution-IV generator: ${candidate.caseId}`);
      }
    } else if (candidate.signs !== null) {
      throw new Error("Standard66 default validation case must not carry design signs");
    }
  }
}

validateMainWireIntegratedModelStandard66ValidationEnvelopeV1(
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1,
);

function baseRow(
  rowId: `resolution-iv-${string}`,
  AHeartRate: DesignSignV1,
  BSystemicResistance: DesignSignV1,
  CPulmonaryResistance: DesignSignV1,
  DTotalBloodVolume: DesignSignV1,
): MainWireIntegratedModelStandard66ResolutionIvBaseRowV1 {
  return Object.freeze({
    rowId,
    AHeartRate,
    BSystemicResistance,
    CPulmonaryResistance,
    DTotalBloodVolume,
  });
}

function resolutionIvCase(
  row: MainWireIntegratedModelStandard66ResolutionIvBaseRowV1,
): MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1 {
  const signs = Object.freeze({
    AHeartRate: row.AHeartRate,
    BSystemicResistance: row.BSystemicResistance,
    CPulmonaryResistance: row.CPulmonaryResistance,
    DTotalBloodVolume: row.DTotalBloodVolume,
    EVenousTone: multiplySigns(
      row.AHeartRate,
      row.BSystemicResistance,
      row.CPulmonaryResistance,
    ),
    FArterialStiffness: multiplySigns(
      row.AHeartRate,
      row.BSystemicResistance,
      row.DTotalBloodVolume,
    ),
    GPeep: multiplySigns(
      row.AHeartRate,
      row.CPulmonaryResistance,
      row.DTotalBloodVolume,
    ),
  });
  const levels = MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_RESOLUTION_IV_LEVELS_V1;
  return Object.freeze({
    caseId: row.rowId,
    designKind: "resolution-iv-fraction",
    signs,
    hemodynamicResearchInputs: Object.freeze({
      heartRateBpm: pickLevel(signs.AHeartRate, levels.AHeartRate),
      systemicResistance: pickLevel(
        signs.BSystemicResistance,
        levels.BSystemicResistance,
      ),
      pulmonaryResistance: pickLevel(
        signs.CPulmonaryResistance,
        levels.CPulmonaryResistance,
      ),
      totalBloodVolumeMl: pickLevel(
        signs.DTotalBloodVolume,
        levels.DTotalBloodVolume,
      ),
      venousTone: pickLevel(signs.EVenousTone, levels.EVenousTone),
      arterialStiffness: pickLevel(
        signs.FArterialStiffness,
        levels.FArterialStiffness,
      ),
      peepCmH2O: pickLevel(signs.GPeep, levels.GPeep),
    }),
    claim: ENVELOPE_CASE_CLAIM,
  });
}

function pickLevel(
  sign: DesignSignV1,
  levels: Readonly<{ low: number; high: number }>,
): number {
  return sign === -1 ? levels.low : levels.high;
}

function multiplySigns(
  first: DesignSignV1,
  second: DesignSignV1,
  third: DesignSignV1,
): DesignSignV1 {
  return (first * second * third) as DesignSignV1;
}

function clockPair(
  pairId: MainWireIntegratedModelStandard66ValidationClockPairIdV1,
  firstArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1,
  secondArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1,
) {
  return Object.freeze({ pairId, firstArmId, secondArmId });
}

function resolveClockPair(
  firstArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1,
  secondArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1,
) {
  const pair = MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_PAIRS_V1
    .find((candidate) => (
      candidate.firstArmId === firstArmId
        && candidate.secondArmId === secondArmId
    ) || (
      candidate.firstArmId === secondArmId
        && candidate.secondArmId === firstArmId
    ));
  if (pair === undefined) {
    throw new Error(
      `unsupported Standard66 validation clock pair: ${firstArmId}, ${secondArmId}`,
    );
  }
  return pair;
}

function dtGate<
  MetricId extends string,
  Unit extends string,
>(
  metricId: MetricId,
  unit: Unit,
  absoluteFloor: number,
  referenceRelativeFraction: number,
) {
  return Object.freeze({
    metricId,
    unit,
    absoluteFloor,
    referenceRelativeFraction,
  });
}

function gradientBinding<
  MetricId extends string,
  Station extends string,
  Statistic extends string,
  OutputId extends string,
>(
  gateMetricId: MetricId,
  station: Station,
  statistic: Statistic,
  exactOutputId: OutputId,
) {
  return Object.freeze({
    gateMetricId,
    station,
    statistic,
    exactOutputId,
  });
}

function geometryLoad<
  LoadId extends string,
  Physiology extends string,
>(
  loadId: LoadId,
  physiology: Physiology,
  hemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3,
) {
  return Object.freeze({
    loadId,
    physiology,
    hemodynamicResearchInputs,
    heldOutFromLocalGeometryLawFit: true as const,
  });
}
