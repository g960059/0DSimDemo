import {
  HEARTMATE_II_CANNULA_SEGMENT_V1,
  HEARTMATE_II_CHOI_INLET_SUCTION_V1,
  HEARTMATE_II_FORWARD_FLOW_EVIDENCE_DOMAIN_V1,
  HEARTMATE_II_LITERATURE_CURVE_V1,
  createMechanicalSupportConfigV1,
} from "@/engine/devices/defaultsV1";
import type {
  MechanicalSupportConfigV1,
  RotaryPumpDeviceConfigV1,
} from "@/engine/devices/typesV1";
import type { MainWireFourValveDiseaseBracketIdV1 } from
  "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";

export const MECHANICAL_SUPPORT_PRESET_IDS_V1 = Object.freeze([
  "all-off",
  "lvad-hm3-5200",
  "lvad-hmii-9000",
  "impella-cp-p6",
  "va-ecmo-peripheral-3200",
  "va-ecmo-central-3200",
  "vv-ecmo-3200",
  "iabp-40cc-1-1",
] as const);
export type MechanicalSupportPresetIdV1 =
  typeof MECHANICAL_SUPPORT_PRESET_IDS_V1[number];

export function mechanicalSupportPresetV1(
  presetId: MechanicalSupportPresetIdV1,
): MechanicalSupportConfigV1 {
  switch (presetId) {
    case "all-off":
      return createMechanicalSupportConfigV1();
    case "lvad-hm3-5200":
      return createMechanicalSupportConfigV1({
        lvad: { enabled: true, speedRpm: 5_200 },
      });
    case "lvad-hmii-9000":
      return createMechanicalSupportConfigV1({
        lvad: {
          enabled: true,
          speedRpm: 9_000,
          curve: HEARTMATE_II_LITERATURE_CURVE_V1,
          drainage: HEARTMATE_II_CANNULA_SEGMENT_V1,
          returnPath: HEARTMATE_II_CANNULA_SEGMENT_V1,
          inletSuction: HEARTMATE_II_CHOI_INLET_SUCTION_V1,
          maximumForwardFlowLMin: null,
          forwardFlowEvidenceDomain:
            HEARTMATE_II_FORWARD_FLOW_EVIDENCE_DOMAIN_V1,
        },
      });
    case "impella-cp-p6":
      return createMechanicalSupportConfigV1({
        impella: { enabled: true, performanceLevel: 6 },
      });
    case "va-ecmo-peripheral-3200":
      return createMechanicalSupportConfigV1({
        vaEcmo: {
          enabled: true,
          speedRpm: 3_200,
          cannulation: "peripheral",
        },
      });
    case "va-ecmo-central-3200":
      return createMechanicalSupportConfigV1({
        vaEcmo: {
          enabled: true,
          speedRpm: 3_200,
          cannulation: "central",
        },
      });
    case "vv-ecmo-3200":
      return createMechanicalSupportConfigV1({
        vvEcmo: { enabled: true, speedRpm: 3_200 },
      });
    case "iabp-40cc-1-1":
      return createMechanicalSupportConfigV1({
        iabp: { enabled: true, assistRatio: 1, balloonVolumeMl: 40 },
      });
  }
}

export function updateMechanicalSupportConfigV1(
  base: MechanicalSupportConfigV1,
  overrides: Parameters<typeof createMechanicalSupportConfigV1>[0],
): MechanicalSupportConfigV1 {
  return createMechanicalSupportConfigV1({
    lvad: mergeExistingPump(base.lvad, overrides.lvad),
    impella: {
      ...mergeExistingPump(base.impella, overrides.impella),
      performanceLevel: overrides.impella?.performanceLevel
        ?? base.impella.performanceLevel,
    },
    vaEcmo: {
      ...mergeExistingPump(base.vaEcmo, overrides.vaEcmo),
      cannulation: overrides.vaEcmo?.cannulation ?? base.vaEcmo.cannulation,
    },
    vvEcmo: mergeExistingPump(base.vvEcmo, overrides.vvEcmo),
    iabp: { ...base.iabp, ...overrides.iabp },
    gasExchange: { ...base.gasExchange, ...overrides.gasExchange },
  });
}

function mergeExistingPump<T extends RotaryPumpDeviceConfigV1>(
  base: T,
  override: Partial<T> | undefined,
): T {
  return {
    ...base,
    ...override,
    curve: { ...base.curve, ...override?.curve },
    drainage: { ...base.drainage, ...override?.drainage },
    oxygenator: { ...base.oxygenator, ...override?.oxygenator },
    returnPath: { ...base.returnPath, ...override?.returnPath },
    inletSuction: override?.inletSuction === undefined
      ? { ...base.inletSuction }
      : { ...override.inletSuction },
    forwardFlowEvidenceDomain: {
      ...base.forwardFlowEvidenceDomain,
      ...override?.forwardFlowEvidenceDomain,
    },
  } as T;
}

export const MECHANICAL_SUPPORT_PATIENT_CASE_IDS_V1 = Object.freeze([
  "normal",
  "lv-systolic-failure",
  "biventricular-failure",
  "lv-failure-pulmonary-hypertension",
  "lv-failure-aortic-regurgitation",
  "vasoplegia",
  "hypovolemia",
  "hypervolemia",
] as const);
export type MechanicalSupportPatientCaseIdV1 =
  typeof MECHANICAL_SUPPORT_PATIENT_CASE_IDS_V1[number];

export type MechanicalSupportPatientCaseV1 = Readonly<{
  caseId: MechanicalSupportPatientCaseIdV1;
  label: string;
  systemicResistanceScale: number;
  pulmonaryResistanceScale: number;
  venousToneDelta: number;
  arterialStiffnessScale: number;
  bloodVolumeDeltaMl: number;
  peakAmplitudeScaleByWall: Readonly<Partial<Record<
    "LA" | "RA" | "LVFW" | "SEP" | "RVFW",
    number
  >>>;
  valveDiseaseBracketIds: readonly MainWireFourValveDiseaseBracketIdV1[];
}>;

export function mechanicalSupportPatientCaseV1(
  caseId: MechanicalSupportPatientCaseIdV1,
): MechanicalSupportPatientCaseV1 {
  const normal = {
    caseId,
    systemicResistanceScale: 1,
    pulmonaryResistanceScale: 1,
    venousToneDelta: 0,
    arterialStiffnessScale: 1,
    bloodVolumeDeltaMl: 0,
    peakAmplitudeScaleByWall: Object.freeze({}),
    valveDiseaseBracketIds: Object.freeze([]),
  } as const;
  switch (caseId) {
    case "normal":
      return Object.freeze({ ...normal, label: "Normal activation and loading" });
    case "lv-systolic-failure":
      return Object.freeze({
        ...normal,
        label: "LV-predominant low activation",
        peakAmplitudeScaleByWall: Object.freeze({ LVFW: 0.35, SEP: 0.60 }),
      });
    case "biventricular-failure":
      return Object.freeze({
        ...normal,
        label: "Biventricular low activation",
        peakAmplitudeScaleByWall: Object.freeze({
          LVFW: 0.35,
          SEP: 0.45,
          RVFW: 0.35,
        }),
      });
    case "lv-failure-pulmonary-hypertension":
      return Object.freeze({
        ...normal,
        label: "LV-predominant failure with high pulmonary resistance",
        pulmonaryResistanceScale: 5,
        peakAmplitudeScaleByWall: Object.freeze({ LVFW: 0.35, SEP: 0.60 }),
      });
    case "lv-failure-aortic-regurgitation":
      return Object.freeze({
        ...normal,
        label: "LV-predominant failure with severe aortic-regurgitation bracket",
        bloodVolumeDeltaMl: 500,
        peakAmplitudeScaleByWall: Object.freeze({ LVFW: 0.35, SEP: 0.60 }),
        valveDiseaseBracketIds: Object.freeze(["AR-severe"] as const),
      });
    case "vasoplegia":
      return Object.freeze({
        ...normal,
        label: "Low systemic resistance",
        systemicResistanceScale: 0.45,
      });
    case "hypovolemia":
      return Object.freeze({ ...normal, label: "Low preload", bloodVolumeDeltaMl: -750 });
    case "hypervolemia":
      return Object.freeze({ ...normal, label: "High preload", bloodVolumeDeltaMl: 750 });
  }
}
