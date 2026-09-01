export const MAIN_WIRE_AORTIC_OUTFLOW_COMPONENT_FACTORIAL_RESEARCH_PROFILE_V1_ID =
  "main-wire-aortic-outflow-component-factorial-research-profile-v1" as const;

export type MainWireAorticOutflowComponentFactorialResearchLevelV1 =
  | "standard65"
  | "standard66";

const LEVELS = Object.freeze([
  "standard65",
  "standard66",
] as const satisfies readonly
  MainWireAorticOutflowComponentFactorialResearchLevelV1[]);

/**
 * Research-only decomposition of the bundled Standard65 -> Standard66 aortic
 * outflow change. The valve/pressure-station level also owns the resistance
 * placement: Standard65 keeps the complete topology resistance on Ao_SA,
 * whereas Standard66 moves the fixed characteristic part into the recovered
 * AoV port and leaves only the residual on Ao_SA. This keeps total proximal
 * resistance conserved in every admitted factorial arm.
 *
 * Absence of this profile preserves the selected production construction
 * exactly (all three components at Standard66). It is not an exact model,
 * registry surface, fitting axis, or clinical parameter.
 */
export type MainWireAorticOutflowComponentFactorialResearchProfileV1 =
  Readonly<{
    profileId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_COMPONENT_FACTORIAL_RESEARCH_PROFILE_V1_ID;
    valvePressureStationAndResistancePlacement:
      MainWireAorticOutflowComponentFactorialResearchLevelV1;
    systemicArterialPvLaw:
      MainWireAorticOutflowComponentFactorialResearchLevelV1;
    aorticRootInertance:
      MainWireAorticOutflowComponentFactorialResearchLevelV1;
    totalProximalResistanceConserved: true;
    parameterSearchOrFitting: false;
  }>;

export function createMainWireAorticOutflowComponentFactorialResearchProfileV1(
  input: Readonly<{
    valvePressureStationAndResistancePlacement:
      MainWireAorticOutflowComponentFactorialResearchLevelV1;
    systemicArterialPvLaw:
      MainWireAorticOutflowComponentFactorialResearchLevelV1;
    aorticRootInertance:
      MainWireAorticOutflowComponentFactorialResearchLevelV1;
  }>,
): MainWireAorticOutflowComponentFactorialResearchProfileV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("aortic outflow component research profile must be an object");
  }
  const keys = Object.keys(input).sort();
  const expectedKeys = [
    "aorticRootInertance",
    "systemicArterialPvLaw",
    "valvePressureStationAndResistancePlacement",
  ];
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    throw new Error("aortic outflow component research profile keys are invalid");
  }
  for (const [name, value] of Object.entries(input)) {
    if (!LEVELS.includes(
      value as MainWireAorticOutflowComponentFactorialResearchLevelV1,
    )) {
      throw new Error(`aortic outflow component research ${name} is invalid`);
    }
  }
  return Object.freeze({
    profileId:
      MAIN_WIRE_AORTIC_OUTFLOW_COMPONENT_FACTORIAL_RESEARCH_PROFILE_V1_ID,
    valvePressureStationAndResistancePlacement:
      input.valvePressureStationAndResistancePlacement,
    systemicArterialPvLaw: input.systemicArterialPvLaw,
    aorticRootInertance: input.aorticRootInertance,
    totalProximalResistanceConserved: true as const,
    parameterSearchOrFitting: false as const,
  });
}

export function validateMainWireAorticOutflowComponentFactorialResearchProfileV1(
  input: MainWireAorticOutflowComponentFactorialResearchProfileV1,
): readonly string[] {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return Object.freeze([
      "aortic outflow component research profile must be an object",
    ]);
  }
  const expectedKeys = [
    "aorticRootInertance",
    "parameterSearchOrFitting",
    "profileId",
    "systemicArterialPvLaw",
    "totalProximalResistanceConserved",
    "valvePressureStationAndResistancePlacement",
  ];
  const issues: string[] = [];
  if (JSON.stringify(Object.keys(input).sort()) !== JSON.stringify(expectedKeys)) {
    issues.push("aortic outflow component research profile fields are invalid");
  }
  if (
    input.profileId
      !== MAIN_WIRE_AORTIC_OUTFLOW_COMPONENT_FACTORIAL_RESEARCH_PROFILE_V1_ID
  ) {
    issues.push("aortic outflow component research profile id is invalid");
  }
  for (const [name, value] of [
    [
      "valvePressureStationAndResistancePlacement",
      input.valvePressureStationAndResistancePlacement,
    ],
    ["systemicArterialPvLaw", input.systemicArterialPvLaw],
    ["aorticRootInertance", input.aorticRootInertance],
  ] as const) {
    if (!LEVELS.includes(value)) {
      issues.push(`aortic outflow component research ${name} is invalid`);
    }
  }
  if (input.totalProximalResistanceConserved !== true) {
    issues.push("aortic outflow component research must conserve total resistance");
  }
  if (input.parameterSearchOrFitting !== false) {
    issues.push("aortic outflow component research cannot enable fitting");
  }
  return Object.freeze(issues);
}

export function mainWireAorticOutflowComponentUsesStandard66V1(
  profile:
    MainWireAorticOutflowComponentFactorialResearchProfileV1 | undefined,
  component:
    | "valvePressureStationAndResistancePlacement"
    | "systemicArterialPvLaw"
    | "aorticRootInertance",
): boolean {
  return profile === undefined || profile[component] === "standard66";
}
