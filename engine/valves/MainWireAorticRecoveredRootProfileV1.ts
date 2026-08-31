import { buildEdges } from "@/engine/core/topology";

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1_ID =
  "main-wire-aortic-recovered-root-profile-v1" as const;

export type MainWireAorticRecoveredRootProfileV1 = Readonly<{
  profileId: typeof MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1_ID;
  valveId: "AoV";
  sourceDynamicEdgeId: "Ao_SA";
  sourceTopologyResistanceMmHgSecPerMl: 0.0465088;
  characteristicImpedanceResistanceMmHgSecPerMl: 0.035;
  residualDownstreamResistanceMmHgSecPerMl: 0.0115088;
  downstreamResistanceScaleFromTopology: number;
  ascendingAorticDiameterCm: 3;
  ascendingAorticAreaCm2: number;
  referenceMaximumForwardEoaCm2: 3.5;
  openingDrivePressureStation: "LV-minus-proximal-constitutive-port";
  coupledUnknowns: "leaflet-opening-and-algebraic-flow";
  reducedSolve: "monotone-bisection-on-bounded-opening";
  maximumBisectionIterations: 80;
  openingResidualTolerance01: 1e-13;
  parameterSearchOrFitting: false;
}>;

const SOURCE_AO_SA_RESISTANCE_MMHG_SEC_PER_ML = 0.0465088 as const;
const CHARACTERISTIC_IMPEDANCE_MMHG_SEC_PER_ML = 0.035 as const;
const RESIDUAL_DOWNSTREAM_RESISTANCE_MMHG_SEC_PER_ML = 0.0115088 as const;
const ASCENDING_AORTIC_DIAMETER_CM = 3 as const;

const sourceAoSaEdge = buildEdges().find((edge) => edge.name === "Ao_SA");
if (
  sourceAoSaEdge === undefined
  || sourceAoSaEdge.kind !== "dynamic"
  || sourceAoSaEdge.R !== SOURCE_AO_SA_RESISTANCE_MMHG_SEC_PER_ML
) {
  throw new Error(
    "recovered-root profile requires the fixed Ao_SA topology resistance",
  );
}
if (
  CHARACTERISTIC_IMPEDANCE_MMHG_SEC_PER_ML
    + RESIDUAL_DOWNSTREAM_RESISTANCE_MMHG_SEC_PER_ML
  !== SOURCE_AO_SA_RESISTANCE_MMHG_SEC_PER_ML
) {
  throw new Error(
    "recovered-root characteristic and residual resistance must conserve Ao_SA resistance exactly",
  );
}

export const MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1 = Object.freeze({
  profileId: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1_ID,
  valveId: "AoV" as const,
  sourceDynamicEdgeId: "Ao_SA" as const,
  sourceTopologyResistanceMmHgSecPerMl:
    SOURCE_AO_SA_RESISTANCE_MMHG_SEC_PER_ML,
  characteristicImpedanceResistanceMmHgSecPerMl:
    CHARACTERISTIC_IMPEDANCE_MMHG_SEC_PER_ML,
  residualDownstreamResistanceMmHgSecPerMl:
    RESIDUAL_DOWNSTREAM_RESISTANCE_MMHG_SEC_PER_ML,
  downstreamResistanceScaleFromTopology:
    RESIDUAL_DOWNSTREAM_RESISTANCE_MMHG_SEC_PER_ML
    / SOURCE_AO_SA_RESISTANCE_MMHG_SEC_PER_ML,
  ascendingAorticDiameterCm: ASCENDING_AORTIC_DIAMETER_CM,
  ascendingAorticAreaCm2:
    Math.PI * (ASCENDING_AORTIC_DIAMETER_CM / 2) ** 2,
  referenceMaximumForwardEoaCm2: 3.5 as const,
  openingDrivePressureStation:
    "LV-minus-proximal-constitutive-port" as const,
  coupledUnknowns: "leaflet-opening-and-algebraic-flow" as const,
  reducedSolve: "monotone-bisection-on-bounded-opening" as const,
  maximumBisectionIterations: 80 as const,
  openingResidualTolerance01: 1e-13 as const,
  parameterSearchOrFitting: false as const,
}) satisfies MainWireAorticRecoveredRootProfileV1;

export function validateMainWireAorticRecoveredRootProfileV1(
  value: MainWireAorticRecoveredRootProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze(["recovered-root profile must be an object"]);
  }
  const expected = MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1;
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push("recovered-root profile fields differ from the fixed profile");
  }
  for (const key of expectedKeys) {
    if (
      value[key as keyof MainWireAorticRecoveredRootProfileV1]
      !== expected[key as keyof MainWireAorticRecoveredRootProfileV1]
    ) {
      issues.push(`recovered-root profile ${key} differs from its fixed value`);
    }
  }
  return Object.freeze(issues);
}
