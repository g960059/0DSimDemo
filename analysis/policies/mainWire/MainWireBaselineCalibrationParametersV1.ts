import {
  MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3,
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";

export const MAIN_WIRE_BASELINE_CALIBRATION_PARAMETER_POLICY_V1_ID =
  "main-wire-baseline-calibration-parameter-policy-v1" as const;

export const MAIN_WIRE_BASELINE_CALIBRATION_ALLOWED_HEART_RATES_BPM_V1 =
  Object.freeze([60, 70] as const);

export const MAIN_WIRE_BASELINE_CALIBRATION_PARAMETER_IDS_V1 = Object.freeze([
  "hemodynamics.total-blood-volume-ml",
  "hemodynamics.venous-tone",
  "hemodynamics.systemic-resistance",
  "hemodynamics.arterial-stiffness",
  "myocardium.common-ventricular-active-tension-scale",
  "myocardium.common-ventricular-passive-stiffness-scale",
] as const);

export type MainWireBaselineCalibrationParameterIdV1 =
  (typeof MAIN_WIRE_BASELINE_CALIBRATION_PARAMETER_IDS_V1)[number];

export type MainWireBaselineCalibrationCandidateInputsV1 = Readonly<{
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3;
  ventricularContractilityScale: number;
}>;

export type MainWireBaselineCalibrationParameterDescriptorV1 = Readonly<{
  parameterId: MainWireBaselineCalibrationParameterIdV1;
  unit: "mL" | "1";
  role:
    | "candidate-shared-phenotype"
    | "negative-control-only"
    | "diagnostic-only";
  scope: "hemodynamic" | "common-ventricular-material-scale";
  transform: "log" | "identity";
  minimum: number;
  maximum: number;
  finiteDifferenceStep: number;
  boundProvenance: "existing-exact-research-domain";
  confoundGroupIds: readonly string[];
}>;

const hemodynamic = MAIN_WIRE_INTEGRATED_MODEL_HEMODYNAMIC_RESEARCH_RANGES_V3;
const mechanics = MAIN_WIRE_FIVE_WALL_MECHANICS_RESEARCH_SCALE_RANGES_V1;

export const MAIN_WIRE_BASELINE_CALIBRATION_PARAMETERS_V1:
  readonly MainWireBaselineCalibrationParameterDescriptorV1[] = Object.freeze([
    descriptorV1(
      "hemodynamics.total-blood-volume-ml",
      "mL",
      "candidate-shared-phenotype",
      "hemodynamic",
      "log",
      hemodynamic.totalBloodVolumeMl,
      ["preload-volume-tone"],
    ),
    descriptorV1(
      "hemodynamics.venous-tone",
      "1",
      "negative-control-only",
      "hemodynamic",
      "identity",
      hemodynamic.venousTone,
      ["preload-volume-tone"],
    ),
    descriptorV1(
      "hemodynamics.systemic-resistance",
      "1",
      "candidate-shared-phenotype",
      "hemodynamic",
      "log",
      hemodynamic.systemicResistance,
      ["pressure-flow-resistance"],
    ),
    descriptorV1(
      "hemodynamics.arterial-stiffness",
      "1",
      "candidate-shared-phenotype",
      "hemodynamic",
      "log",
      hemodynamic.arterialStiffness,
      ["pulse-pressure-compliance"],
    ),
    descriptorV1(
      "myocardium.common-ventricular-active-tension-scale",
      "1",
      "candidate-shared-phenotype",
      "common-ventricular-material-scale",
      "log",
      mechanics.activeTensionScaleByWall,
      ["active-tension-calcium-viable-mass"],
    ),
    descriptorV1(
      "myocardium.common-ventricular-passive-stiffness-scale",
      "1",
      "candidate-shared-phenotype",
      "common-ventricular-material-scale",
      "log",
      mechanics.passiveStiffnessScaleByWall,
      ["unloaded-geometry-passive-stiffness"],
    ),
  ]);

const PARAMETER_BY_ID_V1 = new Map(
  MAIN_WIRE_BASELINE_CALIBRATION_PARAMETERS_V1.map((parameter) =>
    [parameter.parameterId, parameter] as const),
);

if (
  PARAMETER_BY_ID_V1.size
    !== MAIN_WIRE_BASELINE_CALIBRATION_PARAMETER_IDS_V1.length
) {
  throw new Error("baseline calibration parameter IDs must be unique");
}

export function mainWireBaselineCalibrationParameterV1(
  parameterId: MainWireBaselineCalibrationParameterIdV1,
): MainWireBaselineCalibrationParameterDescriptorV1 {
  const parameter = PARAMETER_BY_ID_V1.get(parameterId);
  if (parameter === undefined) {
    throw new Error(`baseline calibration parameter is unregistered: ${parameterId}`);
  }
  return parameter;
}

export function readMainWireBaselineCalibrationParameterV1(
  candidate: MainWireBaselineCalibrationCandidateInputsV1,
  parameterId: MainWireBaselineCalibrationParameterIdV1,
): number {
  switch (parameterId) {
    case "hemodynamics.total-blood-volume-ml":
      return candidate.hemodynamicResearchInputs.totalBloodVolumeMl;
    case "hemodynamics.venous-tone":
      return candidate.hemodynamicResearchInputs.venousTone;
    case "hemodynamics.systemic-resistance":
      return candidate.hemodynamicResearchInputs.systemicResistance;
    case "hemodynamics.arterial-stiffness":
      return candidate.hemodynamicResearchInputs.arterialStiffness;
    case "myocardium.common-ventricular-active-tension-scale":
      return commonVentricularScaleV1(
        candidate.mechanismResearchInputs,
        "activeTensionScaleByWall",
      );
    case "myocardium.common-ventricular-passive-stiffness-scale":
      return commonVentricularScaleV1(
        candidate.mechanismResearchInputs,
        "passiveStiffnessScaleByWall",
      );
  }
}

export function applyMainWireBaselineCalibrationParametersV1(
  base: MainWireBaselineCalibrationCandidateInputsV1,
  updates: readonly Readonly<{
    parameterId: MainWireBaselineCalibrationParameterIdV1;
    value: number;
  }>[],
): MainWireBaselineCalibrationCandidateInputsV1 {
  const seen = new Set<MainWireBaselineCalibrationParameterIdV1>();
  let candidate = base;
  for (const update of [...updates].sort((left, right) =>
    left.parameterId.localeCompare(right.parameterId))) {
    if (seen.has(update.parameterId)) {
      throw new Error(
        `baseline calibration update duplicates ${update.parameterId}`,
      );
    }
    seen.add(update.parameterId);
    const descriptor = mainWireBaselineCalibrationParameterV1(
      update.parameterId,
    );
    if (
      !Number.isFinite(update.value)
      || update.value < descriptor.minimum
      || update.value > descriptor.maximum
    ) {
      throw new Error(
        `${update.parameterId} must lie within `
          + `[${descriptor.minimum}, ${descriptor.maximum}]`,
      );
    }
    candidate = applyOneV1(candidate, update.parameterId, update.value);
  }
  return candidate;
}

export function transformMainWireBaselineCalibrationParameterV1(
  parameterId: MainWireBaselineCalibrationParameterIdV1,
  value: number,
): number {
  const parameter = mainWireBaselineCalibrationParameterV1(parameterId);
  if (
    !Number.isFinite(value)
    || value < parameter.minimum
    || value > parameter.maximum
  ) {
    throw new Error(`${parameterId} is outside its transform domain`);
  }
  if (parameter.transform === "log") {
    if (!(value > 0)) throw new Error(`${parameterId} log value must be positive`);
    return Math.log(value);
  }
  return value;
}

export function projectMainWireBaselineCalibrationParameterToReleaseLatticeV1(
  parameterId: MainWireBaselineCalibrationParameterIdV1,
  value: number,
): number {
  const parameter = mainWireBaselineCalibrationParameterV1(parameterId);
  if (!Number.isFinite(value)) {
    throw new Error(`${parameterId} release projection requires a finite value`);
  }
  const latticeIndex = Math.round(
    (value - parameter.minimum) / parameter.finiteDifferenceStep,
  );
  const projected = parameter.minimum
    + latticeIndex * parameter.finiteDifferenceStep;
  if (projected < parameter.minimum || projected > parameter.maximum) {
    throw new Error(`${parameterId} release projection is outside its domain`);
  }
  return Number(projected.toPrecision(15));
}

export function mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1(
  parameterId: MainWireBaselineCalibrationParameterIdV1,
  value: number,
): boolean {
  const parameter = mainWireBaselineCalibrationParameterV1(parameterId);
  if (
    !Number.isFinite(value)
    || value < parameter.minimum
    || value > parameter.maximum
  ) return false;
  const latticeIndex = (value - parameter.minimum)
    / parameter.finiteDifferenceStep;
  const tolerance = 64 * Number.EPSILON
    * Math.max(1, Math.abs(latticeIndex));
  return Math.abs(latticeIndex - Math.round(latticeIndex)) <= tolerance;
}

export function assertMainWireBaselineCalibrationCandidateOnReleaseLatticeV1(
  candidate: MainWireBaselineCalibrationCandidateInputsV1,
  parameterIds: readonly MainWireBaselineCalibrationParameterIdV1[],
): void {
  const offLattice = parameterIds.filter((parameterId) =>
    !mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1(
      parameterId,
      readMainWireBaselineCalibrationParameterV1(candidate, parameterId),
    ));
  if (offLattice.length > 0) {
    throw new Error(
      `baseline release candidate is off the exposed control lattice: `
        + offLattice.join(", "),
    );
  }
}

function applyOneV1(
  candidate: MainWireBaselineCalibrationCandidateInputsV1,
  parameterId: MainWireBaselineCalibrationParameterIdV1,
  value: number,
): MainWireBaselineCalibrationCandidateInputsV1 {
  if (parameterId.startsWith("hemodynamics.")) {
    const key = parameterId === "hemodynamics.total-blood-volume-ml"
      ? "totalBloodVolumeMl" as const
      : parameterId === "hemodynamics.venous-tone"
        ? "venousTone" as const
        : parameterId === "hemodynamics.systemic-resistance"
          ? "systemicResistance" as const
          : "arterialStiffness" as const;
    return Object.freeze({
      ...candidate,
      hemodynamicResearchInputs:
        validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3({
          ...candidate.hemodynamicResearchInputs,
          [key]: value,
        }),
    });
  }
  const kind = parameterId.endsWith("active-tension-scale")
    ? "activeTensionScaleByWall" as const
    : "passiveStiffnessScaleByWall" as const;
  const chamberMechanics = candidate.mechanismResearchInputs.chamberMechanics;
  return Object.freeze({
    ...candidate,
    mechanismResearchInputs:
      validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3({
        ...candidate.mechanismResearchInputs,
        chamberMechanics: {
          ...chamberMechanics,
          [kind]: {
            ...chamberMechanics[kind],
            LVFW: value,
            SEP: value,
            RVFW: value,
          },
        },
      }),
  });
}

function commonVentricularScaleV1(
  mechanism: MainWireIntegratedModelMechanismResearchInputsV3,
  kind: "activeTensionScaleByWall" | "passiveStiffnessScaleByWall",
): number {
  const values = mechanism.chamberMechanics[kind];
  if (values.LVFW !== values.SEP || values.LVFW !== values.RVFW) {
    throw new Error(`baseline calibration ${kind} is not common-ventricular`);
  }
  return values.LVFW;
}

function descriptorV1(
  parameterId: MainWireBaselineCalibrationParameterIdV1,
  unit: MainWireBaselineCalibrationParameterDescriptorV1["unit"],
  role: MainWireBaselineCalibrationParameterDescriptorV1["role"],
  scope: MainWireBaselineCalibrationParameterDescriptorV1["scope"],
  transform: MainWireBaselineCalibrationParameterDescriptorV1["transform"],
  range: Readonly<{ minimum: number; maximum: number; step: number }>,
  confoundGroupIds: readonly string[],
): MainWireBaselineCalibrationParameterDescriptorV1 {
  return Object.freeze({
    parameterId,
    unit,
    role,
    scope,
    transform,
    minimum: range.minimum,
    maximum: range.maximum,
    finiteDifferenceStep: range.step,
    boundProvenance: "existing-exact-research-domain" as const,
    confoundGroupIds: Object.freeze([...confoundGroupIds]),
  });
}
