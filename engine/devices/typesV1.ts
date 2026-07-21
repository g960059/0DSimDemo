export const MECHANICAL_SUPPORT_MODEL_V1_ID =
  "circleheart-mechanical-circulatory-support-v1" as const;

export const MECHANICAL_SUPPORT_NODE_NAMES_V1 = Object.freeze([
  "LV", "Ao", "SA", "RA", "VC",
] as const);
export type MechanicalSupportNodeNameV1 =
  typeof MECHANICAL_SUPPORT_NODE_NAMES_V1[number];

export const ROTARY_SUPPORT_DEVICE_IDS_V1 = Object.freeze([
  "LVAD", "IMPELLA", "VA_ECMO", "VV_ECMO",
] as const);
export type RotarySupportDeviceIdV1 =
  typeof ROTARY_SUPPORT_DEVICE_IDS_V1[number];

export type RotaryPumpCurveV1 = Readonly<{
  /** Pump affinity-law reference speed. */
  referenceSpeedRpm: number;
  /** Zero-flow pressure head at reference speed. */
  shutoffHeadMmHg: number;
  /** Internal linear loss, scaled with rotor speed. */
  linearLossMmHgSecPerMl: number;
  /**
   * Exponent on |N/N0| for the linear loss. Affinity-scaled curves use 1;
   * regressions with a speed-independent q coefficient use 0.
   */
  linearLossSpeedExponent: 0 | 1;
  /** Internal quadratic loss on the H-Q curve. */
  quadraticLossMmHgSec2PerMl2: number;
}>;

export type HydraulicSegmentV1 = Readonly<{
  linearResistanceMmHgSecPerMl: number;
  quadraticResistanceMmHgSec2PerMl2: number;
}>;

/**
 * @deprecated Pre-discriminant field bundle retained only for migration/test
 * helpers. Runtime config must use RotaryPumpInletSuctionMechanismV1.
 */
export type InletCollapseV1 = Readonly<{
  collapsePressureMmHg: number;
  recoveredPressureMmHg: number;
  minimumVolumeMl: number | null;
  recoveredVolumeMl: number | null;
}>;

/**
 * Inlet suction is an explicit, fail-closed equation choice. The legacy
 * branch preserves the pre-existing smooth pressure/whole-source-volume
 * availability law. The pressure-dependent branch is a physical series
 * resistance and must not be represented as a constraint reaction.
 */
export type RotaryPumpInletSuctionMechanismV1 =
  | Readonly<{
    kind: "legacy-smooth-availability";
    collapsePressureMmHg: number;
    recoveredPressureMmHg: number;
    minimumVolumeMl: number | null;
    recoveredVolumeMl: number | null;
  }>
  | Readonly<{
    kind: "pressure-dependent-series-resistance";
    thresholdPressureMmHg: number;
    resistanceSlopeMmHgSecPerMlPerMmHg: number;
  }>
  | Readonly<{
    kind: "none";
  }>;

/** Evidence metadata is diagnostic only; it never clips instantaneous flow. */
export type RotaryPumpForwardFlowEvidenceDomainV1 = Readonly<{
  publishedExperimentalTraversalUpperLMin: number | null;
  advertisedCapacityLMin: number | null;
}>;

export type RotaryPumpForwardFlowEvidenceStatusV1 =
  | "not-declared"
  | "non-forward-flow-not-applicable"
  | "within-published-experimental-domain"
  | "above-published-experimental-domain-within-advertised-capacity"
  | "above-advertised-capacity";

export type RotaryPumpDeviceConfigV1 = Readonly<{
  enabled: boolean;
  /** A stopped rotary pump can back-flow; a clamped circuit cannot. */
  circuitClamped: boolean;
  speedRpm: number;
  inletNode: MechanicalSupportNodeNameV1;
  outletNode: MechanicalSupportNodeNameV1;
  curve: RotaryPumpCurveV1;
  drainage: HydraulicSegmentV1;
  oxygenator: HydraulicSegmentV1;
  returnPath: HydraulicSegmentV1;
  inletSuction: RotaryPumpInletSuctionMechanismV1;
  /** Null means that the H-Q equation is not given an artificial forward cap. */
  maximumForwardFlowLMin: number | null;
  maximumReverseFlowLMin: number;
  forwardFlowEvidenceDomain: RotaryPumpForwardFlowEvidenceDomainV1;
}>;

export type ImpellaPerformanceLevelV1 =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type IabpConfigV1 = Readonly<{
  enabled: boolean;
  assistRatio: 1 | 2 | 3;
  balloonVolumeMl: number;
  inflationPhase01: number;
  deflationPhase01: number;
  inflationDurationSec: number;
  deflationDurationSec: number;
  placementNode: "SA";
}>;

export type EcmoGasExchangeConfigV1 = Readonly<{
  /** Clinical oxygen fraction in the sweep gas, constrained to [0.21, 1]. */
  fractionDeliveredOxygen01: number;
  sweepGasLMin: number;
  oxygenatorRatedFlowLMin: number;
  membraneOxygenTransferCoefficient: number;
  maximumOxygenTransferMlPerMin: number;
  membraneCo2RemovalMlPerMinAtSweep1: number;
  hemoglobinGPerDl: number;
  /** Fick-closed by default; prescribed mode treats SvO2 as a measured boundary. */
  venousOxygenMode: "fick-closed" | "prescribed-saturation";
  mixedVenousSaturation01: number;
  nativeLungShuntFraction01: number;
  nativeEndCapillarySaturation01: number;
  oxygenConsumptionMlPerMin: number;
  vvRecirculationFraction01: number;
  /** Beat-mean systemic-flow share used by the VA two-territory mixer. */
  upperBodyFlowFraction01: number;
}>;

export type MechanicalSupportConfigV1 = Readonly<{
  modelId: typeof MECHANICAL_SUPPORT_MODEL_V1_ID;
  lvad: RotaryPumpDeviceConfigV1;
  impella: Readonly<RotaryPumpDeviceConfigV1 & {
    performanceLevel: ImpellaPerformanceLevelV1;
  }>;
  vaEcmo: Readonly<RotaryPumpDeviceConfigV1 & {
    cannulation: "peripheral" | "central";
  }>;
  vvEcmo: Readonly<RotaryPumpDeviceConfigV1 & {
    cannulation: "femoral-jugular" | "dual-lumen";
    /**
     * well-mixed keeps net blood-volume rate at one venous 0D node;
     * bicaval resolves the VC-to-RA pressure redistribution explicitly.
     */
    hemodynamicCoupling: "well-mixed-venous" | "bicaval-pressure-resolved";
  }>;
  iabp: IabpConfigV1;
  gasExchange: EcmoGasExchangeConfigV1;
}>;

export type MechanicalSupportHydraulicInputV1 = Readonly<{
  timeSec: number;
  cyclePhase01: number;
  beatIndex: number;
  heartRateBpm: number;
  nodeAbsolutePressureMmHg: Readonly<Record<
    MechanicalSupportNodeNameV1,
    number
  >>;
  nodeVolumeMl?: Readonly<Partial<Record<
    MechanicalSupportNodeNameV1,
    number
  >>>;
}>;

export type RotaryPumpEvaluationV1 = Readonly<{
  deviceId: RotarySupportDeviceIdV1;
  enabled: boolean;
  circuitClamped: boolean;
  speedRpm: number;
  inletNode: MechanicalSupportNodeNameV1;
  outletNode: MechanicalSupportNodeNameV1;
  inletPressureMmHg: number;
  outletPressureMmHg: number;
  pressureRiseRequiredMmHg: number;
  idealPumpHeadMmHg: number;
  flowLMin: number;
  unrestrictedFlowLMin: number;
  dFlowMlPerSecDInletPressureMlPerSecPerMmHg: number;
  dFlowMlPerSecDOutletPressureMlPerSecPerMmHg: number;
  dFlowMlPerSecDInletVolumePerSec: number;
  inletAvailability01: number;
  inletCollapseActive: boolean;
  inletSuctionMechanismKind: RotaryPumpInletSuctionMechanismV1["kind"];
  inletSuctionResistanceMmHgSecPerMl: number;
  inletSuctionPressureDropMmHg: number;
  forwardFlowEvidenceStatus: RotaryPumpForwardFlowEvidenceStatusV1;
  forwardFlowPublishedExperimentalTraversalUpperLMin: number | null;
  forwardFlowAdvertisedCapacityLMin: number | null;
  drainagePressureDropMmHg: number;
  oxygenatorPressureDropMmHg: number;
  returnPathPressureDropMmHg: number;
  prePumpPressureMmHg: number;
  postPumpPressureMmHg: number;
  postOxygenatorPressureMmHg: number;
  /** Signed reaction from a legacy availability, capacity, or clamp limit. */
  flowLimitPressureReactionMmHg: number;
  hydraulicResidualMmHg: number;
}>;

export type IabpEvaluationV1 = Readonly<{
  enabled: boolean;
  assistedBeat: boolean;
  assistRatio: 1 | 2 | 3;
  cyclePhase01: number;
  activation01: number;
  balloonVolumeMl: number;
  placementNode: "SA";
}>;

export type MechanicalSupportHydraulicEvaluationV1 = Readonly<{
  modelId: typeof MECHANICAL_SUPPORT_MODEL_V1_ID;
  pump: Readonly<Record<RotarySupportDeviceIdV1, RotaryPumpEvaluationV1>>;
  iabp: IabpEvaluationV1;
  nodeNetVolumeRateMlPerSec: Readonly<Record<
    MechanicalSupportNodeNameV1,
    number
  >>;
  totalLeftHeartBypassFlowLMin: number;
  totalExtracorporealFlowLMin: number;
  conservationResidualMlPerSec: number;
}>;

type EcmoGasExchangeInputBaseV1 = Readonly<{
  ecmoFlowLMin: number;
  nativeCardiacOutputLMin: number;
  config: EcmoGasExchangeConfigV1;
}>;

export type EcmoGasExchangeInputV1 =
  | Readonly<EcmoGasExchangeInputBaseV1 & {
    mode: "VV";
  }>
  | Readonly<EcmoGasExchangeInputBaseV1 & {
    mode: "VA";
    vaCannulation: "peripheral" | "central";
  }>;

export type EcmoGasExchangeEvaluationV1 = Readonly<{
  mode: "VA" | "VV";
  venousOxygenMode: EcmoGasExchangeConfigV1["venousOxygenMode"];
  ecmoFlowLMin: number;
  effectiveEcmoFlowLMin: number;
  recirculationFlowLMin: number;
  configuredVvRecirculationFraction01: number;
  totalRecirculationFraction01: number;
  nativeCardiacOutputLMin: number;
  /** Null when native cardiac output is zero. */
  ecmoToCardiacOutputRatio: number | null;
  preOxygenatorSaturation01: number;
  postOxygenatorSaturation01: number;
  resolvedMixedVenousSaturation01: number;
  resolvedMixedVenousPo2MmHg: number;
  preOxygenatorPo2MmHg: number;
  postOxygenatorPo2MmHg: number;
  nativeArterialSaturation01: number;
  estimatedSystemicArterialSaturation01: number;
  estimatedSystemicArterialPo2MmHg: number;
  rightRadialArterialSaturation01: number;
  femoralArterialSaturation01: number;
  rightRadialArterialPo2MmHg: number;
  femoralArterialPo2MmHg: number;
  preOxygenatorOxygenContentMlPerDl: number;
  postOxygenatorOxygenContentMlPerDl: number;
  mixedVenousOxygenContentMlPerDl: number;
  estimatedArterialOxygenContentMlPerDl: number;
  rightRadialOxygenContentMlPerDl: number;
  femoralOxygenContentMlPerDl: number;
  membraneOxygenTransferMlPerMin: number;
  membraneCo2RemovalMlPerMin: number;
  estimatedSystemicOxygenDeliveryMlPerMin: number;
  oxygenDeliveryToConsumptionRatio: number;
  impliedFickOxygenConsumptionMlPerMin: number;
  oxygenConsumptionResidualMlPerMin: number;
  oxygenDemandMetFraction01: number;
  vaMixingRegime:
    | "not-applicable-vv"
    | "central-return-well-mixed"
    | "native-flow-reaches-distal-aorta"
    | "ecmo-flow-reaches-aortic-arch";
  assumptions: readonly string[];
}>;
