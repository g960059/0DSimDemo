import { evaluateIabpV1, validateIabpConfigV1 } from "@/engine/devices/iabpV1";
import { validateEcmoGasExchangeConfigV1 } from
  "@/engine/devices/gasExchangeV1";
import {
  emptyMechanicalSupportNodeRatesV1,
  evaluateRotaryPumpV1,
  validateRotaryPumpConfigV1,
} from "@/engine/devices/rotaryPumpV1";
import {
  MECHANICAL_SUPPORT_MODEL_V1_ID,
  MECHANICAL_SUPPORT_NODE_NAMES_V1,
  type MechanicalSupportConfigV1,
  type MechanicalSupportHydraulicEvaluationV1,
  type MechanicalSupportHydraulicInputV1,
  type MechanicalSupportNodeNameV1,
  type RotaryPumpEvaluationV1,
} from "@/engine/devices/typesV1";

const ML_PER_SEC_PER_L_MIN = 1000 / 60;

export function evaluateMechanicalSupportHydraulicsV1(
  config: MechanicalSupportConfigV1,
  input: MechanicalSupportHydraulicInputV1,
): MechanicalSupportHydraulicEvaluationV1 {
  validateMechanicalSupportConfigV1(config);
  validateInput(input);
  const iabp = evaluateIabpV1(config.iabp, input);
  const pump = Object.freeze({
    LVAD: evaluateConfiguredPump("LVAD", config.lvad, input),
    IMPELLA: evaluateConfiguredPump("IMPELLA", config.impella, input),
    VA_ECMO: evaluateConfiguredPump("VA_ECMO", config.vaEcmo, input),
    VV_ECMO: evaluateConfiguredPump("VV_ECMO", config.vvEcmo, input),
  });
  const nodeRates = emptyMechanicalSupportNodeRatesV1();
  for (const evaluation of Object.values(pump)) {
    if (evaluation.inletNode === evaluation.outletNode) continue;
    const flowMlPerSec = evaluation.flowLMin * ML_PER_SEC_PER_L_MIN;
    nodeRates[evaluation.inletNode] -= flowMlPerSec;
    nodeRates[evaluation.outletNode] += flowMlPerSec;
  }
  const conservationResidualMlPerSec = MECHANICAL_SUPPORT_NODE_NAMES_V1
    .reduce((sum, node) => sum + nodeRates[node], 0);
  return Object.freeze({
    modelId: MECHANICAL_SUPPORT_MODEL_V1_ID,
    pump,
    iabp,
    nodeNetVolumeRateMlPerSec: Object.freeze({ ...nodeRates }),
    totalLeftHeartBypassFlowLMin:
      pump.LVAD.flowLMin + pump.IMPELLA.flowLMin,
    totalExtracorporealFlowLMin:
      pump.VA_ECMO.flowLMin + pump.VV_ECMO.flowLMin,
    conservationResidualMlPerSec,
  });
}

export function validateMechanicalSupportConfigV1(
  config: MechanicalSupportConfigV1,
): void {
  if (config.modelId !== MECHANICAL_SUPPORT_MODEL_V1_ID) {
    throw new Error("mechanical support model identity mismatch");
  }
  validateRotaryPumpConfigV1(config.lvad, "lvad");
  validateRotaryPumpConfigV1(config.impella, "impella");
  validateRotaryPumpConfigV1(config.vaEcmo, "vaEcmo");
  validateRotaryPumpConfigV1(config.vvEcmo, "vvEcmo");
  if (!Number.isInteger(config.impella.performanceLevel)
      || config.impella.performanceLevel < 0
      || config.impella.performanceLevel > 9) {
    throw new Error("impella.performanceLevel must be an integer from P0 to P9");
  }
  if (config.vaEcmo.cannulation !== "peripheral"
      && config.vaEcmo.cannulation !== "central") {
    throw new Error("vaEcmo.cannulation must be peripheral or central");
  }
  const expectedVaNodes = config.vaEcmo.cannulation === "central"
    ? ["RA", "Ao"]
    : ["VC", "SA"];
  if (config.vaEcmo.inletNode !== expectedVaNodes[0]
      || config.vaEcmo.outletNode !== expectedVaNodes[1]) {
    throw new Error("VA-ECMO node pair does not match cannulation mode");
  }
  if (config.lvad.inletNode !== "LV" || config.lvad.outletNode !== "Ao") {
    throw new Error("LVAD must connect LV to Ao in V1");
  }
  if (config.impella.inletNode !== "LV" || config.impella.outletNode !== "Ao") {
    throw new Error("Impella must connect LV to Ao in V1");
  }
  if (config.vvEcmo.cannulation !== "femoral-jugular"
      && config.vvEcmo.cannulation !== "dual-lumen") {
    throw new Error("vvEcmo.cannulation is unsupported");
  }
  if (config.vvEcmo.hemodynamicCoupling !== "well-mixed-venous"
      && config.vvEcmo.hemodynamicCoupling !== "bicaval-pressure-resolved") {
    throw new Error("vvEcmo.hemodynamicCoupling is unsupported");
  }
  const expectedVvOutlet = config.vvEcmo.hemodynamicCoupling
    === "bicaval-pressure-resolved" ? "RA" : "VC";
  if (config.vvEcmo.inletNode !== "VC"
      || config.vvEcmo.outletNode !== expectedVvOutlet) {
    throw new Error("VV-ECMO node pair does not match hemodynamic coupling mode");
  }
  validateIabpConfigV1(config.iabp);
  validateEcmoGasExchangeConfigV1(config.gasExchange);
}

export function mechanicalSupportIsActiveV1(
  config: MechanicalSupportConfigV1 | undefined,
): boolean {
  return config !== undefined && (
    config.lvad.enabled
    || config.impella.enabled
    || config.vaEcmo.enabled
    || config.vvEcmo.enabled
    || config.iabp.enabled
  );
}

function evaluateConfiguredPump(
  deviceId: RotaryPumpEvaluationV1["deviceId"],
  config: MechanicalSupportConfigV1[
    "lvad" | "impella" | "vaEcmo" | "vvEcmo"
  ],
  input: MechanicalSupportHydraulicInputV1,
): RotaryPumpEvaluationV1 {
  return evaluateRotaryPumpV1(deviceId, config, {
    inletPressureMmHg: input.nodeAbsolutePressureMmHg[config.inletNode],
    outletPressureMmHg: input.nodeAbsolutePressureMmHg[config.outletNode],
    inletVolumeMl: input.nodeVolumeMl?.[config.inletNode],
  });
}

function validateInput(input: MechanicalSupportHydraulicInputV1): void {
  finite(input.timeSec, "timeSec");
  finite(input.cyclePhase01, "cyclePhase01");
  finite(input.beatIndex, "beatIndex");
  positive(input.heartRateBpm, "heartRateBpm");
  for (const node of MECHANICAL_SUPPORT_NODE_NAMES_V1) {
    finite(input.nodeAbsolutePressureMmHg[node], `${node} pressure`);
    const volume = input.nodeVolumeMl?.[node];
    if (volume !== undefined) nonnegative(volume, `${node} volume`);
  }
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function positive(value: number, label: string): number {
  finite(value, label);
  if (!(value > 0)) throw new Error(`${label} must be positive`);
  return value;
}

function nonnegative(value: number, label: string): number {
  finite(value, label);
  if (value < 0) throw new Error(`${label} must be nonnegative`);
  return value;
}

export function mechanicalSupportNodePressureRecordV1(
  values: Readonly<Record<MechanicalSupportNodeNameV1, number>>,
): Readonly<Record<MechanicalSupportNodeNameV1, number>> {
  return Object.freeze({ ...values });
}
