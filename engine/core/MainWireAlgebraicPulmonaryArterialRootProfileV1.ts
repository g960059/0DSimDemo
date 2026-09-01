import { buildEdges } from "@/engine/core/topology";

export const MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1_ID =
  "main-wire-algebraic-pulmonary-arterial-root-profile-v1" as const;

export type MainWireAlgebraicPulmonaryArterialRootProfileV1 = Readonly<{
  profileId:
    typeof MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1_ID;
  pulmonaryRootEdgeId: "PA_PArt";
  flowLaw: "same-candidate-algebraic-linear-quadratic";
  inertanceMmHgSec2PerMl: 0;
  sourceResistanceAndQuadraticLossPreserved: true;
  systemicRootMomentumUnchanged: true;
  acceptedRootFlowRecordRole:
    "exact-accepted-algebraic-flow-readback-not-continuation-memory";
  parameterSearchOrFitting: false;
  physiologicalValidationClaimed: false;
}>;

const sourcePulmonaryRoot = buildEdges().find(
  (edge) => edge.name === "PA_PArt",
);
if (
  sourcePulmonaryRoot === undefined
  || sourcePulmonaryRoot.kind !== "dynamic"
  || !(sourcePulmonaryRoot.L !== undefined && sourcePulmonaryRoot.L > 0)
) {
  throw new Error(
    "algebraic pulmonary-root profile requires source dynamic PA_PArt edge",
  );
}

/**
 * Fixed causal-ablation profile. It removes only PA_PArt momentum memory while
 * preserving the source pulmonary resistance, quadratic loss, node
 * compliances, pulmonary valve law, and the entire systemic/aortic branch.
 *
 * The profile is opt-in. Absence is bit-identical to the source construction.
 */
export const MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1 =
  Object.freeze({
    profileId:
      MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1_ID,
    pulmonaryRootEdgeId: "PA_PArt" as const,
    flowLaw: "same-candidate-algebraic-linear-quadratic" as const,
    inertanceMmHgSec2PerMl: 0 as const,
    sourceResistanceAndQuadraticLossPreserved: true as const,
    systemicRootMomentumUnchanged: true as const,
    acceptedRootFlowRecordRole:
      "exact-accepted-algebraic-flow-readback-not-continuation-memory" as const,
    parameterSearchOrFitting: false as const,
    physiologicalValidationClaimed: false as const,
  }) satisfies MainWireAlgebraicPulmonaryArterialRootProfileV1;

export function validateMainWireAlgebraicPulmonaryArterialRootProfileV1(
  input: MainWireAlgebraicPulmonaryArterialRootProfileV1,
): readonly string[] {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return Object.freeze([
      "algebraic pulmonary arterial-root profile must be an object",
    ]);
  }
  const expected =
    MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1;
  const actualKeys = Object.keys(input).sort();
  const expectedKeys = Object.keys(expected).sort();
  const issues: string[] = [];
  if (
    actualKeys.length !== expectedKeys.length
    || actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    issues.push("algebraic pulmonary arterial-root profile fields differ");
  }
  for (const key of expectedKeys) {
    if (input[key as keyof typeof input] !== expected[key as keyof typeof expected]) {
      issues.push(`algebraic pulmonary arterial-root profile ${key} differs`);
    }
  }
  return Object.freeze(issues);
}
