import { buildEdges } from "@/engine/core/topology";

export const MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1_ID =
  "main-wire-algebraic-proximal-arterial-roots-profile-v1" as const;

export type MainWireAlgebraicProximalArterialRootsProfileV1 = Readonly<{
  profileId:
    typeof MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1_ID;
  aorticRootEdgeId: "Ao_SA";
  pulmonaryRootEdgeId: "PA_PArt";
  flowLaw: "same-candidate-algebraic-linear-quadratic";
  inertanceMmHgSec2PerMl: 0;
  sourceResistanceAndQuadraticLossPreserved: true;
  acceptedRootFlowRecordRole:
    "exact-accepted-algebraic-flow-readback-not-continuation-memory";
  parameterSearchOrFitting: false;
  physiologicalValidationClaimed: false;
}>;

const sourceEdges = buildEdges();
for (const edgeId of ["Ao_SA", "PA_PArt"] as const) {
  const edge = sourceEdges.find((candidate) => candidate.name === edgeId);
  if (
    edge === undefined
    || edge.kind !== "dynamic"
    || !(edge.L !== undefined && edge.L > 0)
  ) {
    throw new Error(
      `algebraic proximal-root profile requires source dynamic edge ${edgeId}`,
    );
  }
}

/**
 * Fixed production candidate supported by the proximal-root causal ablation.
 * Only root momentum memory is removed. Existing resistance, quadratic loss,
 * node compliance, pressure stations, and valve laws remain authoritative.
 *
 * The V1 transaction record retains the accepted algebraic root flows as
 * exact same-step readbacks. They are deliberately ignored by the following
 * step and therefore do not reintroduce hidden root momentum memory.
 */
export const MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1 =
  Object.freeze({
    profileId:
      MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1_ID,
    aorticRootEdgeId: "Ao_SA" as const,
    pulmonaryRootEdgeId: "PA_PArt" as const,
    flowLaw: "same-candidate-algebraic-linear-quadratic" as const,
    inertanceMmHgSec2PerMl: 0 as const,
    sourceResistanceAndQuadraticLossPreserved: true as const,
    acceptedRootFlowRecordRole:
      "exact-accepted-algebraic-flow-readback-not-continuation-memory" as const,
    parameterSearchOrFitting: false as const,
    physiologicalValidationClaimed: false as const,
  }) satisfies MainWireAlgebraicProximalArterialRootsProfileV1;

export function validateMainWireAlgebraicProximalArterialRootsProfileV1(
  input: MainWireAlgebraicProximalArterialRootsProfileV1,
): readonly string[] {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return Object.freeze([
      "algebraic proximal arterial roots profile must be an object",
    ]);
  }
  const expected =
    MAIN_WIRE_ALGEBRAIC_PROXIMAL_ARTERIAL_ROOTS_PROFILE_V1;
  const actualKeys = Object.keys(input).sort();
  const expectedKeys = Object.keys(expected).sort();
  const issues: string[] = [];
  if (
    actualKeys.length !== expectedKeys.length
    || actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    issues.push("algebraic proximal arterial roots profile fields differ");
  }
  for (const key of expectedKeys) {
    if (input[key as keyof typeof input] !== expected[key as keyof typeof expected]) {
      issues.push(`algebraic proximal arterial roots profile ${key} differs`);
    }
  }
  return Object.freeze(issues);
}
