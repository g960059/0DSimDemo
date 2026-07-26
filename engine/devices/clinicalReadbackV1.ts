import type {
  EcmoGasExchangeEvaluationV1,
  MechanicalSupportConfigV1,
  MechanicalSupportHydraulicEvaluationV1,
  RotarySupportDeviceIdV1,
} from "@/engine/devices/typesV1";

export type MechanicalSupportAlertSeverityV1 = "advisory" | "warning" | "critical";

export type MechanicalSupportAlertV1 = Readonly<{
  code:
    | "INLET_COLLAPSE"
    | "EXCESSIVE_NEGATIVE_DRAINAGE_PRESSURE"
    | "ROTARY_PUMP_BACKFLOW"
    | "RUNNING_AGAINST_CLAMP"
    | "LOW_VV_EFFECTIVE_FLOW_RATIO"
    | "LOW_RIGHT_RADIAL_OXYGENATION"
    | "VA_DIFFERENTIAL_HYPOXEMIA"
    | "VA_ECMO_SEVERE_AORTIC_REGURGITATION"
    | "LOW_OXYGEN_DELIVERY_RATIO"
    | "OXYGEN_DEMAND_NOT_MET";
  severity: MechanicalSupportAlertSeverityV1;
  device: RotarySupportDeviceIdV1 | "IABP" | "ECMO_GAS";
  message: string;
  observedValue: number;
  unit: "mmHg" | "L/min" | "fraction" | "rpm";
}>;

/**
 * Deterministic safety-oriented readbacks, not treatment recommendations.
 * Thresholds intentionally cover only relationships supported by the model.
 */
export function mechanicalSupportAlertsV1(
  hydraulics: MechanicalSupportHydraulicEvaluationV1,
  gas?: EcmoGasExchangeEvaluationV1,
): readonly MechanicalSupportAlertV1[] {
  const alerts: MechanicalSupportAlertV1[] = [];
  for (const pump of Object.values(hydraulics.pump)) {
    if (!pump.enabled) continue;
    if (pump.circuitClamped && pump.speedRpm > 0) {
      alerts.push(alert(
        "RUNNING_AGAINST_CLAMP",
        "warning",
        pump.deviceId,
        "The rotor is commanded while the modeled circuit is clamped.",
        pump.speedRpm,
        "rpm",
      ));
    }
    if (!pump.circuitClamped
        && pump.inletCollapseActive
        && pump.inletSuctionMechanismKind
          === "legacy-smooth-availability") {
      alerts.push(alert(
        "INLET_COLLAPSE",
        pump.inletAvailability01 < 0.25 ? "critical" : "warning",
        pump.deviceId,
        "Inlet pressure or source volume is limiting drainage; suction/chatter is possible.",
        pump.inletAvailability01,
        "fraction",
      ));
    }
    // Pressure-dependent series resistance is a mechanistic diagnostic. No
    // severity threshold for its coefficient/drop has been independently
    // validated, so it must not inherit the legacy availability alert.
    if (
      (pump.deviceId === "VA_ECMO" || pump.deviceId === "VV_ECMO")
      && pump.prePumpPressureMmHg < -75
    ) {
      alerts.push(alert(
        "EXCESSIVE_NEGATIVE_DRAINAGE_PRESSURE",
        pump.prePumpPressureMmHg < -100 ? "critical" : "warning",
        pump.deviceId,
        "Pre-pump drainage pressure is below the modeled ECMO caution threshold.",
        pump.prePumpPressureMmHg,
        "mmHg",
      ));
    }
    if (!pump.circuitClamped && pump.flowLMin < -0.05) {
      alerts.push(alert(
        "ROTARY_PUMP_BACKFLOW",
        pump.deviceId === "VA_ECMO" || pump.deviceId === "VV_ECMO"
          ? "critical"
          : "warning",
        pump.deviceId,
        "The pressure gradient is driving reverse flow through the stopped or low-speed pump.",
        pump.flowLMin,
        "L/min",
      ));
    }
  }
  if (gas !== undefined) {
    if (gas.oxygenDeliveryToConsumptionRatio < 3) {
      alerts.push(alert(
        "LOW_OXYGEN_DELIVERY_RATIO",
        gas.oxygenDeliveryToConsumptionRatio < 2 ? "critical" : "warning",
        "ECMO_GAS",
        "Modeled systemic oxygen-delivery to consumption ratio is below three.",
        gas.oxygenDeliveryToConsumptionRatio,
        "fraction",
      ));
    }
    if (gas.venousOxygenMode === "fick-closed"
        && gas.oxygenDemandMetFraction01 < 0.99) {
      alerts.push(alert(
        "OXYGEN_DEMAND_NOT_MET",
        "critical",
        "ECMO_GAS",
        "Even zero mixed-venous saturation cannot close the requested steady Fick oxygen balance.",
        gas.oxygenDemandMetFraction01,
        "fraction",
      ));
    }
    if (gas.mode === "VV"
        && gas.ecmoToCardiacOutputRatio !== null
        && gas.ecmoToCardiacOutputRatio < 0.6) {
      alerts.push(alert(
        "LOW_VV_EFFECTIVE_FLOW_RATIO",
        "advisory",
        "ECMO_GAS",
        "Effective VV flow is below 60% of native cardiac output; arterial saturation may remain below 90%.",
        gas.ecmoToCardiacOutputRatio,
        "fraction",
      ));
    }
    if (gas.mode === "VA" && gas.rightRadialArterialSaturation01 < 0.9) {
      alerts.push(alert(
        "LOW_RIGHT_RADIAL_OXYGENATION",
        gas.rightRadialArterialSaturation01 < 0.8 ? "critical" : "warning",
        "ECMO_GAS",
        "Modeled right-radial/upper-body oxygenation is low.",
        gas.rightRadialArterialSaturation01,
        "fraction",
      ));
    }
    if (
      gas.mode === "VA"
      && gas.femoralArterialSaturation01
        - gas.rightRadialArterialSaturation01 > 0.05
    ) {
      alerts.push(alert(
        "VA_DIFFERENTIAL_HYPOXEMIA",
        "warning",
        "ECMO_GAS",
        "Femoral oxygenation exceeds right-radial oxygenation by more than five percentage points.",
        gas.femoralArterialSaturation01
          - gas.rightRadialArterialSaturation01,
        "fraction",
      ));
    }
  }
  return Object.freeze(alerts);
}

export function mechanicalSupportContextAlertsV1(
  config: MechanicalSupportConfigV1,
  context: Readonly<{ severeAorticRegurgitation: boolean }>,
): readonly MechanicalSupportAlertV1[] {
  if (!context.severeAorticRegurgitation || !config.vaEcmo.enabled) {
    return Object.freeze([]);
  }
  return Object.freeze([alert(
    "VA_ECMO_SEVERE_AORTIC_REGURGITATION",
    "critical",
    "VA_ECMO",
    "Severe aortic regurgitation with VA-ECMO is modeled only as a contraindication stress test; arterial return can worsen LV distension and pulmonary edema.",
    1,
    "fraction",
  )]);
}

function alert(
  code: MechanicalSupportAlertV1["code"],
  severity: MechanicalSupportAlertSeverityV1,
  device: MechanicalSupportAlertV1["device"],
  message: string,
  observedValue: number,
  unit: MechanicalSupportAlertV1["unit"],
): MechanicalSupportAlertV1 {
  return Object.freeze({ code, severity, device, message, observedValue, unit });
}
