import {
  MECHANICAL_SUPPORT_MODEL_V1_ID,
  type ImpellaPerformanceLevelV1,
  type MechanicalSupportConfigV1,
  type RotaryPumpDeviceConfigV1,
} from "@/engine/devices/typesV1";
import {
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  type DynamicRotaryPumpCircuitInertanceV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import { validateMechanicalSupportConfigV1 } from "@/engine/devices/networkV1";

/** FDA Impella CP with SmartAssist P-level rotor speeds. */
export const IMPELLA_CP_SPEED_RPM_BY_LEVEL_V1 = Object.freeze({
  0: 0,
  1: 23_000,
  2: 31_000,
  3: 33_000,
  4: 35_000,
  5: 37_000,
  6: 39_000,
  7: 42_000,
  8: 44_000,
  9: 46_000,
} as const satisfies Readonly<Record<ImpellaPerformanceLevelV1, number>>);

/** FDA IFU expected mean-flow display ranges; actual flow remains pressure-dependent. */
export const IMPELLA_CP_MEAN_FLOW_RANGE_L_MIN_BY_LEVEL_V1 = Object.freeze({
  0: Object.freeze([0, 0] as const),
  1: Object.freeze([0, 0.9] as const),
  2: Object.freeze([1.1, 2.1] as const),
  3: Object.freeze([1.6, 2.3] as const),
  4: Object.freeze([2.0, 2.5] as const),
  5: Object.freeze([2.3, 2.7] as const),
  6: Object.freeze([2.5, 2.9] as const),
  7: Object.freeze([2.9, 3.3] as const),
  8: Object.freeze([3.1, 3.4] as const),
  9: Object.freeze([3.3, 3.7] as const),
} as const satisfies Readonly<Record<
  ImpellaPerformanceLevelV1,
  readonly [number, number]
>>);

/** Wang/Choi HeartMate-II steady H-Q reduction at 10,000 rpm. */
export const HEARTMATE_II_LITERATURE_CURVE_V1 = Object.freeze({
  referenceSpeedRpm: 10_000,
  shutoffHeadMmHg: 0.0000903 * (2 * Math.PI * 10_000 / 60) ** 2,
  linearLossMmHgSecPerMl: 0.1707,
  linearLossSpeedExponent: 0 as const,
  quadraticLossMmHgSec2PerMl2: 0,
});

export const HEARTMATE_II_CANNULA_SEGMENT_V1 = Object.freeze({
  linearResistanceMmHgSecPerMl: 0.0677,
  quadraticResistanceMmHgSec2PerMl2: 0,
});

/** Wang/Choi 2014 pressure-dependent inflow resistance; HMII only. */
export const HEARTMATE_II_CHOI_INLET_SUCTION_V1 = Object.freeze({
  kind: "pressure-dependent-series-resistance" as const,
  thresholdPressureMmHg: 1,
  resistanceSlopeMmHgSecPerMlPerMmHg: 3.5,
});

/**
 * Diagnostic domain, never a flow clamp: the cited independent experiment
 * traversed through 9 L/min and 10 L/min is advertised device capacity. This
 * metadata is not validation of this repository's implementation.
 */
export const HEARTMATE_II_FORWARD_FLOW_EVIDENCE_DOMAIN_V1 = Object.freeze({
  publishedExperimentalTraversalUpperLMin: 9,
  advertisedCapacityLMin: 10,
});

/**
 * Direct Wang/Choi HeartMate-II R-L transcription for verification work.
 * This is not a release-approved profile and must not be reused for HM3,
 * Impella, or ECMO circuits.
 */
export const HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1 = Object.freeze({
  unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  pumpInternalMmHgSec2PerMl: 0.02177,
  drainageMmHgSec2PerMl: 0.0127,
  oxygenatorMmHgSec2PerMl: 0,
  returnPathMmHgSec2PerMl: 0.0127,
}) satisfies DynamicRotaryPumpCircuitInertanceV1;

/** Girfoglio HM3 H-Q fit, with Q^2 extended as signed Q|Q| for back-flow. */
export const HEARTMATE_3_SIGNED_LITERATURE_CURVE_V1 = Object.freeze({
  referenceSpeedRpm: 5_200,
  shutoffHeadMmHg: 3.45e-6 * 5_200 ** 2,
  linearLossMmHgSecPerMl: 5.9e-5 * 5_200 * 0.06,
  linearLossSpeedExponent: 1 as const,
  quadraticLossMmHgSec2PerMl2: 1.45 * 0.06 ** 2,
});

/** Backward-compatible descriptive alias; the underlying profile is HM3-based. */
export const GENERIC_CENTRIFUGAL_LVAD_CURVE_V1 =
  HEARTMATE_3_SIGNED_LITERATURE_CURVE_V1;

export const IMPELLA_CP_CURVE_V1 = Object.freeze({
  referenceSpeedRpm: 46_000,
  shutoffHeadMmHg: 210,
  linearLossMmHgSecPerMl: 0.40,
  linearLossSpeedExponent: 1 as const,
  quadraticLossMmHgSec2PerMl2: 0.0314,
});

/** Takahashi 2026 Senko circuit pump curve at 3500 rpm, unit-converted. */
export const TAKAHASHI_SENKO_ECMO_CURVE_V1 = Object.freeze({
  referenceSpeedRpm: 3_500,
  shutoffHeadMmHg: 337,
  linearLossMmHgSecPerMl: 0.0864,
  linearLossSpeedExponent: 1 as const,
  quadraticLossMmHgSec2PerMl2: 0.003096,
});

const EMPTY_SEGMENT = Object.freeze({
  linearResistanceMmHgSecPerMl: 0,
  quadraticResistanceMmHgSec2PerMl2: 0,
});

const LVAD_BASE: RotaryPumpDeviceConfigV1 = Object.freeze({
  enabled: false,
  circuitClamped: false,
  speedRpm: 5_200,
  inletNode: "LV",
  outletNode: "Ao",
  curve: GENERIC_CENTRIFUGAL_LVAD_CURVE_V1,
  drainage: Object.freeze({
    linearResistanceMmHgSecPerMl: 0.015,
    quadraticResistanceMmHgSec2PerMl2: 0.0003,
  }),
  oxygenator: EMPTY_SEGMENT,
  returnPath: Object.freeze({
    linearResistanceMmHgSecPerMl: 0.015,
    quadraticResistanceMmHgSec2PerMl2: 0.0003,
  }),
  inletSuction: Object.freeze({
    kind: "legacy-smooth-availability" as const,
    collapsePressureMmHg: -5,
    recoveredPressureMmHg: 3,
    minimumVolumeMl: 20,
    recoveredVolumeMl: 55,
  }),
  maximumForwardFlowLMin: 10,
  maximumReverseFlowLMin: 3,
  forwardFlowEvidenceDomain: Object.freeze({
    publishedExperimentalTraversalUpperLMin: null,
    advertisedCapacityLMin: null,
  }),
});

const IMPELLA_BASE: MechanicalSupportConfigV1["impella"] = Object.freeze({
  enabled: false,
  circuitClamped: false,
  performanceLevel: 6 as ImpellaPerformanceLevelV1,
  speedRpm: IMPELLA_CP_SPEED_RPM_BY_LEVEL_V1[6],
  inletNode: "LV" as const,
  outletNode: "Ao" as const,
  curve: IMPELLA_CP_CURVE_V1,
  drainage: Object.freeze({
    linearResistanceMmHgSecPerMl: 0.03,
    quadraticResistanceMmHgSec2PerMl2: 0.001,
  }),
  oxygenator: EMPTY_SEGMENT,
  returnPath: Object.freeze({
    linearResistanceMmHgSecPerMl: 0.03,
    quadraticResistanceMmHgSec2PerMl2: 0.001,
  }),
  inletSuction: Object.freeze({
    kind: "legacy-smooth-availability" as const,
    collapsePressureMmHg: -4,
    recoveredPressureMmHg: 4,
    minimumVolumeMl: 18,
    recoveredVolumeMl: 50,
  }),
  maximumForwardFlowLMin: 4.3,
  maximumReverseFlowLMin: 2,
  forwardFlowEvidenceDomain: Object.freeze({
    publishedExperimentalTraversalUpperLMin: null,
    advertisedCapacityLMin: null,
  }),
});

const ECMO_DRAINAGE = Object.freeze({
  // Takahashi drain 22 Fr: 3.09 Q^2 - 0.54 Q, conservatively
  // represented with its measured quadratic term and no negative linear loss.
  linearResistanceMmHgSecPerMl: 0,
  quadraticResistanceMmHgSec2PerMl2: 0.011124,
});
const ECMO_OXYGENATOR = Object.freeze({
  linearResistanceMmHgSecPerMl: 0.9198,
  quadraticResistanceMmHgSec2PerMl2: 0.00198,
});
const ECMO_RETURN = Object.freeze({
  // Takahashi return 18 Fr: 5.01 Q^2 - 1.74 Q, with the same passive
  // nonnegative-loss restriction as the drainage cannula.
  linearResistanceMmHgSecPerMl: 0,
  quadraticResistanceMmHgSec2PerMl2: 0.018036,
});

const VA_ECMO_BASE: MechanicalSupportConfigV1["vaEcmo"] = Object.freeze({
  enabled: false,
  circuitClamped: false,
  cannulation: "peripheral" as const,
  speedRpm: 3_200,
  inletNode: "VC" as const,
  outletNode: "SA" as const,
  curve: TAKAHASHI_SENKO_ECMO_CURVE_V1,
  drainage: ECMO_DRAINAGE,
  oxygenator: ECMO_OXYGENATOR,
  returnPath: ECMO_RETURN,
  inletSuction: Object.freeze({
    kind: "legacy-smooth-availability" as const,
    collapsePressureMmHg: -8,
    recoveredPressureMmHg: 2,
    minimumVolumeMl: 25,
    recoveredVolumeMl: 100,
  }),
  maximumForwardFlowLMin: 7,
  maximumReverseFlowLMin: 7,
  forwardFlowEvidenceDomain: Object.freeze({
    publishedExperimentalTraversalUpperLMin: null,
    advertisedCapacityLMin: null,
  }),
});

const VV_ECMO_BASE: MechanicalSupportConfigV1["vvEcmo"] = Object.freeze({
  enabled: false,
  circuitClamped: false,
  cannulation: "femoral-jugular" as const,
  hemodynamicCoupling: "well-mixed-venous" as const,
  speedRpm: 3_200,
  inletNode: "VC" as const,
  outletNode: "VC" as const,
  curve: TAKAHASHI_SENKO_ECMO_CURVE_V1,
  drainage: ECMO_DRAINAGE,
  oxygenator: ECMO_OXYGENATOR,
  returnPath: ECMO_RETURN,
  inletSuction: Object.freeze({
    kind: "legacy-smooth-availability" as const,
    collapsePressureMmHg: -8,
    recoveredPressureMmHg: 2,
    minimumVolumeMl: 25,
    recoveredVolumeMl: 100,
  }),
  maximumForwardFlowLMin: 7,
  maximumReverseFlowLMin: 7,
  forwardFlowEvidenceDomain: Object.freeze({
    publishedExperimentalTraversalUpperLMin: null,
    advertisedCapacityLMin: null,
  }),
});

export function defaultMechanicalSupportConfigV1(): MechanicalSupportConfigV1 {
  return createMechanicalSupportConfigV1();
}

export function createMechanicalSupportConfigV1(
  overrides: Readonly<{
    lvad?: Partial<RotaryPumpDeviceConfigV1>;
    impella?: Partial<MechanicalSupportConfigV1["impella"]>;
    vaEcmo?: Partial<MechanicalSupportConfigV1["vaEcmo"]>;
    vvEcmo?: Partial<MechanicalSupportConfigV1["vvEcmo"]>;
    iabp?: Partial<MechanicalSupportConfigV1["iabp"]>;
    gasExchange?: Partial<MechanicalSupportConfigV1["gasExchange"]>;
  }> = {},
): MechanicalSupportConfigV1 {
  const impellaLevel = integerLevel(
    overrides.impella?.performanceLevel ?? IMPELLA_BASE.performanceLevel,
  );
  const vaCannulation = overrides.vaEcmo?.cannulation
    ?? VA_ECMO_BASE.cannulation;
  const config: MechanicalSupportConfigV1 = {
    modelId: MECHANICAL_SUPPORT_MODEL_V1_ID,
    lvad: mergePump(LVAD_BASE, overrides.lvad),
    impella: Object.freeze({
      ...mergePump(IMPELLA_BASE, overrides.impella),
      performanceLevel: impellaLevel,
      speedRpm: IMPELLA_CP_SPEED_RPM_BY_LEVEL_V1[impellaLevel],
    }),
    vaEcmo: Object.freeze({
      ...mergePump(VA_ECMO_BASE, overrides.vaEcmo),
      cannulation: vaCannulation,
      inletNode: vaCannulation === "central" ? "RA" : "VC",
      outletNode: vaCannulation === "central" ? "Ao" : "SA",
    }),
    vvEcmo: Object.freeze({
      ...mergePump(VV_ECMO_BASE, overrides.vvEcmo),
      cannulation: overrides.vvEcmo?.cannulation ?? VV_ECMO_BASE.cannulation,
      hemodynamicCoupling: overrides.vvEcmo?.hemodynamicCoupling
        ?? VV_ECMO_BASE.hemodynamicCoupling,
      inletNode: "VC" as const,
      outletNode: (overrides.vvEcmo?.hemodynamicCoupling
          ?? VV_ECMO_BASE.hemodynamicCoupling) === "bicaval-pressure-resolved"
        ? "RA" as const
        : "VC" as const,
    }),
    iabp: Object.freeze({
      enabled: false,
      assistRatio: 1,
      balloonVolumeMl: 40,
      inflationPhase01: 0.22,
      deflationPhase01: 0.90,
      inflationDurationSec: 0.08,
      deflationDurationSec: 0.08,
      placementNode: "SA" as const,
      ...overrides.iabp,
    }),
    gasExchange: Object.freeze({
      fractionDeliveredOxygen01: 1,
      sweepGasLMin: 4,
      oxygenatorRatedFlowLMin: 7,
      membraneOxygenTransferCoefficient: 2.5,
      maximumOxygenTransferMlPerMin: 220,
      membraneCo2RemovalMlPerMinAtSweep1: 80,
      hemoglobinGPerDl: 10,
      venousOxygenMode: "fick-closed" as const,
      mixedVenousSaturation01: 0.65,
      nativeLungShuntFraction01: 0.05,
      nativeEndCapillarySaturation01: 0.98,
      oxygenConsumptionMlPerMin: 250,
      vvRecirculationFraction01: 0.15,
      upperBodyFlowFraction01: 0.35,
      ...overrides.gasExchange,
    }),
  };
  validateMechanicalSupportConfigV1(config);
  return deepFreeze(config);
}

function mergePump<TBase extends RotaryPumpDeviceConfigV1>(
  base: TBase,
  override: Partial<TBase> | undefined,
): TBase {
  return Object.freeze({
    ...base,
    ...override,
    curve: Object.freeze({ ...base.curve, ...override?.curve }),
    drainage: Object.freeze({ ...base.drainage, ...override?.drainage }),
    oxygenator: Object.freeze({ ...base.oxygenator, ...override?.oxygenator }),
    returnPath: Object.freeze({ ...base.returnPath, ...override?.returnPath }),
    inletSuction: deepFreeze(
      override?.inletSuction ?? { ...base.inletSuction },
    ),
    forwardFlowEvidenceDomain: Object.freeze({
      ...base.forwardFlowEvidenceDomain,
      ...override?.forwardFlowEvidenceDomain,
    }),
  }) as TBase;
}

function integerLevel(value: number): ImpellaPerformanceLevelV1 {
  if (!Number.isInteger(value) || value < 0 || value > 9) {
    throw new Error("Impella performance level must be an integer from P0 to P9");
  }
  return value as ImpellaPerformanceLevelV1;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
