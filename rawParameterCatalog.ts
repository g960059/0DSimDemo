import { HARD_CLAMP, type CoreRuntimeParams } from "./engine/protocol";

export type RawParamCategoryId =
  | "electricalTiming"
  | "respiratory"
  | "fluids"
  | "contractilityScaling"
  | "geometry"
  | "pericardium"
  | "septalCoupling"
  | "coronary";

export type RawParamEntry = {
  key: keyof CoreRuntimeParams;
  label: string;
  category: RawParamCategoryId;
  min: number;
  max: number;
  step: number;
  unit?: string;
};

export const RAW_PARAM_CATEGORY_LABELS: Record<RawParamCategoryId, string> = {
  electricalTiming: "Electrical/Timing",
  respiratory: "Respiratory",
  fluids: "Fluids",
  contractilityScaling: "Contractility scaling",
  geometry: "Geometry",
  pericardium: "Pericardium",
  septalCoupling: "Septal coupling",
  coronary: "Coronary",
};

function rawParam(
  key: keyof CoreRuntimeParams,
  label: string,
  category: RawParamCategoryId,
  step: number,
  unit?: string,
): RawParamEntry {
  const range = HARD_CLAMP[key];
  if (!range) throw new Error(`Missing HARD_CLAMP range for raw parameter "${String(key)}".`);
  return {
    key,
    label,
    category,
    min: range[0],
    max: range[1],
    step,
    ...(unit ? { unit } : {}),
  };
}

export const RAW_PARAM_CATALOG: RawParamEntry[] = [
  rawParam("avDelaySec", "AV delay", "electricalTiming", 0.01, "s"),
  rawParam("atrialElectromechanicalDelaySec", "Atrial electromechanical delay", "electricalTiming", 0.01, "s"),
  rawParam("ventricularElectromechanicalDelaySec", "Ventricular electromechanical delay", "electricalTiming", 0.01, "s"),

  rawParam("Pth0", "Base pleural pressure", "respiratory", 1, "cmH2O"),
  rawParam("respAmpTh", "Pleural respiratory amplitude", "respiratory", 1, "cmH2O"),
  rawParam("respAmpAlv", "Alveolar respiratory amplitude", "respiratory", 1, "cmH2O"),
  rawParam("respRate", "Respiratory rate", "respiratory", 0.01, "Hz"),

  rawParam("bleedRate", "Hemorrhage rate", "fluids", 25, "mL/min"),
  rawParam("fluidRate", "Fluid/transfusion rate", "fluids", 25, "mL/min"),

  rawParam("lvTmaxScale", "LV Tmax scale", "contractilityScaling", 0.05, "x"),
  rawParam("rvTmaxScale", "RV Tmax scale", "contractilityScaling", 0.05, "x"),
  rawParam("caReleaseScale", "LV calcium release scale", "contractilityScaling", 0.05, "x"),
  rawParam("rvCaReleaseScale", "RV calcium release scale", "contractilityScaling", 0.05, "x"),

  rawParam("lvGeomScale", "LV geometry scale", "geometry", 0.05, "x"),
  rawParam("rvGeomScale", "RV geometry scale", "geometry", 0.05, "x"),

  rawParam("pericardialPressureScaleMmHg", "Pericardial pressure scale", "pericardium", 0.25, "mmHg"),
  rawParam("pericardialSlackVolumeMl", "Pericardial slack volume", "pericardium", 10, "mL"),
  rawParam("pericardialVolumeScaleMl", "Pericardial volume scale", "pericardium", 1, "mL"),
  rawParam("pericardialSoftnessMl", "Pericardial softness", "pericardium", 1, "mL"),
  rawParam("pericardialBiasMmHg", "Pericardial pressure bias", "pericardium", 0.5, "mmHg"),
  rawParam("pericardialFluidMl", "Pericardial fluid", "pericardium", 10, "mL"),

  rawParam("septalStiffnessScale", "Septal stiffness scale", "septalCoupling", 0.05, "x"),
  rawParam("septalK1MmHgPerMl", "Septal linear stiffness", "septalCoupling", 0.05, "mmHg/mL"),
  rawParam("septalK3MmHgPerMl3", "Septal cubic stiffness", "septalCoupling", 0.001, "mmHg/mL3"),
  rawParam("septalDampingMmHgSecPerMl", "Septal damping", "septalCoupling", 0.25, "mmHg*s/mL"),
  rawParam("septalMaxShiftMl", "Septal max shift", "septalCoupling", 1, "mL"),
  rawParam("septalLvPressureWeight", "Septal LV pressure weight", "septalCoupling", 0.01),

  rawParam("coronaryResistanceScale", "Coronary resistance scale", "coronary", 0.05, "x"),
  rawParam("coronaryCompressionScale", "Myocardial compression scale", "coronary", 0.05, "x"),
  rawParam("coronaryVasodilator", "Coronary vasodilator", "coronary", 0.01),
  rawParam("coronaryReserveMax", "Coronary reserve max", "coronary", 0.1, "x"),
  rawParam("LADStenosis", "LAD stenosis", "coronary", 0.01),
  rawParam("LCxStenosis", "LCx stenosis", "coronary", 0.01),
  rawParam("RCAStenosis", "RCA stenosis", "coronary", 0.01),
];

export const RAW_PARAM_CATALOG_SECTIONS = Object.values(
  RAW_PARAM_CATALOG.reduce<Record<RawParamCategoryId, { title: RawParamCategoryId; controls: RawParamEntry[] }>>((sections, entry) => {
    sections[entry.category] ??= { title: entry.category, controls: [] };
    sections[entry.category].controls.push(entry);
    return sections;
  }, {} as Record<RawParamCategoryId, { title: RawParamCategoryId; controls: RawParamEntry[] }>),
);

const RAW_PARAM_CATALOG_BY_KEY = new Map<string, RawParamEntry>(
  RAW_PARAM_CATALOG.map((entry) => [entry.key, entry]),
);

export function rawParamCatalogEntry(key: string): RawParamEntry | undefined {
  return RAW_PARAM_CATALOG_BY_KEY.get(key);
}
