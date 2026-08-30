import { buildEdges } from "@/engine/core/topology";
import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1,
  validateMainWireAorticRecoveredRootProfileV1,
  type MainWireAorticRecoveredRootProfileV1,
} from "@/engine/valves/MainWireAorticRecoveredRootProfileV1";

export const MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1_ID =
  "main-wire-selected-aortic-outflow-circulation-profile-v1" as const;

export type MainWireSelectedAorticOutflowCirculationProfileV1 = Readonly<{
  profileId:
    typeof MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1_ID;
  aorticValveProfile: MainWireAorticRecoveredRootProfileV1;
  systemicArterialNodeIds: readonly ["Ao", "SA", "Art"];
  pulmonaryArterialNodeIds: readonly ["PA", "PArt"];
  systemicArterialTangentStiffnessMultiplier: 2;
  pulmonaryArterialTangentStiffnessMultiplier: 1;
  systemicArterialPressureAnchor:
    "preserve-absent-profile-pressure-at-topology-x0";
  systemicArterialTangentClaim:
    "twice-absent-profile-local-volume-tangent-at-topology-x0";
  pulmonaryArterialClaim: "absent-profile-law-bit-identical";
  sourceDynamicEdgeId: "Ao_SA";
  sourceTopologyResistanceMmHgSecPerMl: 0.0465088;
  characteristicImpedanceResistanceMmHgSecPerMl: 0.035;
  residualDownstreamResistanceMmHgSecPerMl: 0.0115088;
  sourceTopologyInertanceMmHgSec2PerMl: 0.002;
  ascendingAorticInertanceMmHgSec2PerMl: 0.0008;
  ascendingAorticInertanceScaleFromTopology: 0.4;
  parameterSearchOrFitting: false;
}>;

const SOURCE_TOPOLOGY_INERTANCE_MMHG_SEC2_PER_ML = 0.002 as const;
const ASCENDING_AORTIC_INERTANCE_MMHG_SEC2_PER_ML = 0.0008 as const;
const ASCENDING_AORTIC_INERTANCE_SCALE_FROM_TOPOLOGY = 0.4 as const;

const sourceAoSaEdge = buildEdges().find((edge) => edge.name === "Ao_SA");
if (
  sourceAoSaEdge === undefined
  || sourceAoSaEdge.kind !== "dynamic"
  || sourceAoSaEdge.L !== SOURCE_TOPOLOGY_INERTANCE_MMHG_SEC2_PER_ML
) {
  throw new Error(
    "selected aortic-outflow circulation profile requires the fixed Ao_SA topology inertance",
  );
}
if (
  SOURCE_TOPOLOGY_INERTANCE_MMHG_SEC2_PER_ML
    * ASCENDING_AORTIC_INERTANCE_SCALE_FROM_TOPOLOGY
  !== ASCENDING_AORTIC_INERTANCE_MMHG_SEC2_PER_ML
) {
  throw new Error(
    "selected aortic-outflow circulation profile inertance scale is inconsistent",
  );
}

export const MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1 =
  Object.freeze({
    profileId:
      MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1_ID,
    aorticValveProfile: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1,
    systemicArterialNodeIds: Object.freeze([
      "Ao",
      "SA",
      "Art",
    ] as const),
    pulmonaryArterialNodeIds: Object.freeze(["PA", "PArt"] as const),
    systemicArterialTangentStiffnessMultiplier: 2 as const,
    pulmonaryArterialTangentStiffnessMultiplier: 1 as const,
    systemicArterialPressureAnchor:
      "preserve-absent-profile-pressure-at-topology-x0" as const,
    systemicArterialTangentClaim:
      "twice-absent-profile-local-volume-tangent-at-topology-x0" as const,
    pulmonaryArterialClaim: "absent-profile-law-bit-identical" as const,
    sourceDynamicEdgeId: "Ao_SA" as const,
    sourceTopologyResistanceMmHgSecPerMl:
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1
        .sourceTopologyResistanceMmHgSecPerMl,
    characteristicImpedanceResistanceMmHgSecPerMl:
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1
        .characteristicImpedanceResistanceMmHgSecPerMl,
    residualDownstreamResistanceMmHgSecPerMl:
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1
        .residualDownstreamResistanceMmHgSecPerMl,
    sourceTopologyInertanceMmHgSec2PerMl:
      SOURCE_TOPOLOGY_INERTANCE_MMHG_SEC2_PER_ML,
    ascendingAorticInertanceMmHgSec2PerMl:
      ASCENDING_AORTIC_INERTANCE_MMHG_SEC2_PER_ML,
    ascendingAorticInertanceScaleFromTopology:
      ASCENDING_AORTIC_INERTANCE_SCALE_FROM_TOPOLOGY,
    parameterSearchOrFitting: false as const,
  }) satisfies MainWireSelectedAorticOutflowCirculationProfileV1;

export function validateMainWireSelectedAorticOutflowCirculationProfileV1(
  value: MainWireSelectedAorticOutflowCirculationProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze([
      "selected aortic-outflow circulation profile must be an object",
    ]);
  }
  const expected =
    MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1;
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push(
      "selected aortic-outflow circulation profile fields differ from the fixed profile",
    );
  }
  for (const key of expectedKeys) {
    if (key === "aorticValveProfile") {
      for (const issue of validateMainWireAorticRecoveredRootProfileV1(
        value.aorticValveProfile,
      )) {
        issues.push(`selected aortic-outflow ${issue}`);
      }
      continue;
    }
    if (
      key === "systemicArterialNodeIds"
      || key === "pulmonaryArterialNodeIds"
    ) {
      if (
        JSON.stringify(value[key])
        !== JSON.stringify(expected[key])
      ) {
        issues.push(
          `selected aortic-outflow circulation profile ${key} differs from its fixed value`,
        );
      }
      continue;
    }
    if (value[key] !== expected[key]) {
      issues.push(
        `selected aortic-outflow circulation profile ${key} differs from its fixed value`,
      );
    }
  }
  return Object.freeze(issues);
}
