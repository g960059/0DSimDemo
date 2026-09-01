export const MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_INERTANCE_RESEARCH_PROFILE_V1_ID =
  "main-wire-proximal-arterial-root-inertance-research-profile-v1" as const;

export type MainWireProximalArterialRootInertanceResearchModeV1 =
  | "source-inertance"
  | "resistive-root";

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
 * Research-only causal ablation. A resistive root uses the same R and B but
 * sets L=0 in both the primal flow law and analytic tangent. The V1 accepted
 * record still carries the resulting algebraic flow as a compatibility cache;
 * it is not used as q_n by a resistive root. A promotable exact model requires
 * a new state/checkpoint schema that removes that redundant cache.
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
    if (value !== "source-inertance" && value !== "resistive-root") {
      issues.push(`proximal arterial root research ${name} is invalid`);
    }
  }
  return Object.freeze(issues);
}

function requireMode(
  value: MainWireProximalArterialRootInertanceResearchModeV1,
  name: string,
): void {
  if (value !== "source-inertance" && value !== "resistive-root") {
    throw new Error(`proximal arterial root research ${name} is invalid`);
  }
}
