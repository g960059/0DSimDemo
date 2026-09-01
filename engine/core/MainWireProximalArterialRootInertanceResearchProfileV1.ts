export const MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_INERTANCE_RESEARCH_PROFILE_V1_ID =
  "main-wire-proximal-arterial-root-inertance-research-profile-v1" as const;

export type MainWireProximalArterialRootInertanceResearchModeV1 =
  | "source-inertance"
  | "three-quarter-inertance"
  | "one-half-inertance"
  | "one-quarter-inertance"
  | "one-eighth-inertance"
  | "resistive-root";

export const MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_INERTANCE_RESEARCH_MODES_V1 =
  Object.freeze([
    "source-inertance",
    "three-quarter-inertance",
    "one-half-inertance",
    "one-quarter-inertance",
    "one-eighth-inertance",
    "resistive-root",
  ] as const satisfies readonly
    MainWireProximalArterialRootInertanceResearchModeV1[]);

export type MainWireProximalArterialRootInertanceResearchProfileV1 =
  Readonly<{
    profileId:
      typeof MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_INERTANCE_RESEARCH_PROFILE_V1_ID;
    aorticRootMode:
      MainWireProximalArterialRootInertanceResearchModeV1;
    pulmonaryRootMode:
      MainWireProximalArterialRootInertanceResearchModeV1;
  }>;

/**
 * Research-only causal bracket. Every non-source level scales the single
 * graph-owned proximal-root inertance in both the primal flow law and analytic
 * tangent while preserving R, B, compliance, and the valve law. A resistive
 * root sets L=0. Its accepted record still carries the resulting algebraic
 * flow as a compatibility cache; it is not used as q_n by that root.
 */
export function createMainWireProximalArterialRootInertanceResearchProfileV1(
  input: Readonly<{
    aorticRootMode:
      MainWireProximalArterialRootInertanceResearchModeV1;
    pulmonaryRootMode:
      MainWireProximalArterialRootInertanceResearchModeV1;
  }>,
): MainWireProximalArterialRootInertanceResearchProfileV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("proximal arterial root research profile must be an object");
  }
  const keys = Object.keys(input).sort();
  if (
    keys.length !== 2
    || keys[0] !== "aorticRootMode"
    || keys[1] !== "pulmonaryRootMode"
  ) {
    throw new Error("proximal arterial root research profile keys are invalid");
  }
  requireMode(input.aorticRootMode, "aorticRootMode");
  requireMode(input.pulmonaryRootMode, "pulmonaryRootMode");
  return Object.freeze({
    profileId:
      MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_INERTANCE_RESEARCH_PROFILE_V1_ID,
    aorticRootMode: input.aorticRootMode,
    pulmonaryRootMode: input.pulmonaryRootMode,
  });
}

export function validateMainWireProximalArterialRootInertanceResearchProfileV1(
  input: MainWireProximalArterialRootInertanceResearchProfileV1,
): readonly string[] {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return Object.freeze([
      "proximal arterial root research profile must be an object",
    ]);
  }
  const expectedKeys = [
    "aorticRootMode",
    "profileId",
    "pulmonaryRootMode",
  ];
  const actualKeys = Object.keys(input).sort();
  const issues: string[] = [];
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push("proximal arterial root research profile fields are invalid");
  }
  if (
    input.profileId
      !== MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_INERTANCE_RESEARCH_PROFILE_V1_ID
  ) {
    issues.push("proximal arterial root research profile id is invalid");
  }
  for (const [name, value] of [
    ["aorticRootMode", input.aorticRootMode],
    ["pulmonaryRootMode", input.pulmonaryRootMode],
  ] as const) {
    if (!MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_INERTANCE_RESEARCH_MODES_V1
      .includes(value)) {
      issues.push(`proximal arterial root research ${name} is invalid`);
    }
  }
  return Object.freeze(issues);
}

function requireMode(
  value: MainWireProximalArterialRootInertanceResearchModeV1,
  name: string,
): void {
  if (!MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_INERTANCE_RESEARCH_MODES_V1
    .includes(value)) {
    throw new Error(`proximal arterial root research ${name} is invalid`);
  }
}

export function mainWireProximalArterialRootInertanceScaleFromModeV1(
  mode: MainWireProximalArterialRootInertanceResearchModeV1,
): number {
  switch (mode) {
    case "source-inertance": return 1;
    case "three-quarter-inertance": return 0.75;
    case "one-half-inertance": return 0.5;
    case "one-quarter-inertance": return 0.25;
    case "one-eighth-inertance": return 0.125;
    case "resistive-root": return 0;
  }
}
