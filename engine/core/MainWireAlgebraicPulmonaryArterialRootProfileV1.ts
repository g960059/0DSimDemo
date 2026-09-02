import { buildEdges } from "@/engine/core/topology";

export const MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1_ID =
  "main-wire-algebraic-pulmonary-arterial-root-profile-v1" as const;

export type MainWireAlgebraicPulmonaryArterialRootProfileV1 = Readonly<{
  profileId:
    typeof MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1_ID;
  pulmonaryRootEdgeId: "PA_PArt";
  flowLaw:
    | "same-candidate-algebraic-linear-quadratic"
    | "backward-euler-dynamic-linear-quadratic";
  inertanceMmHgSec2PerMl: number;
  rootResistanceMmHgSecPerMl: number;
  proximalPaStiffnessMultiplier: number;
  distalPArtStiffnessMultiplier: number;
  sourceResistanceAndQuadraticLossPreserved: boolean;
  sourcePulmonaryArterialComplianceDistributionPreserved: boolean;
  pulmonaryArterialPressureAnchor:
    "preserve-absent-profile-pressure-at-topology-x0";
  systemicRootMomentumUnchanged: true;
  acceptedRootFlowRecordRole:
    | "exact-accepted-algebraic-flow-readback-not-continuation-memory"
    | "exact-accepted-dynamic-flow-continuation-memory";
  parameterSearchOrFitting: boolean;
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
const SOURCE_PULMONARY_ROOT_RESISTANCE_MMHG_SEC_PER_ML =
  sourcePulmonaryRoot.R;

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
    rootResistanceMmHgSecPerMl:
      SOURCE_PULMONARY_ROOT_RESISTANCE_MMHG_SEC_PER_ML,
    proximalPaStiffnessMultiplier: 1 as const,
    distalPArtStiffnessMultiplier: 1 as const,
    sourceResistanceAndQuadraticLossPreserved: true as const,
    sourcePulmonaryArterialComplianceDistributionPreserved: true as const,
    pulmonaryArterialPressureAnchor:
      "preserve-absent-profile-pressure-at-topology-x0" as const,
    systemicRootMomentumUnchanged: true as const,
    acceptedRootFlowRecordRole:
      "exact-accepted-algebraic-flow-readback-not-continuation-memory" as const,
    parameterSearchOrFitting: false as const,
    physiologicalValidationClaimed: false as const,
  }) satisfies MainWireAlgebraicPulmonaryArterialRootProfileV1;

export function createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1(
  rootResistanceMmHgSecPerMl: number,
  inertanceMmHgSec2PerMl = 0,
  complianceDistribution: Readonly<{
    proximalPaStiffnessMultiplier: number;
    distalPArtStiffnessMultiplier: number;
  }> = Object.freeze({
    proximalPaStiffnessMultiplier: 1,
    distalPArtStiffnessMultiplier: 1,
  }),
): MainWireAlgebraicPulmonaryArterialRootProfileV1 {
  if (
    !Number.isFinite(rootResistanceMmHgSecPerMl)
    || rootResistanceMmHgSecPerMl < 0.005
    || rootResistanceMmHgSecPerMl > 0.2
  ) {
    throw new Error(
      "pulmonary root characteristic-resistance research value must be "
        + "finite within [0.005, 0.2] mmHg*s/mL",
    );
  }
  if (
    !Number.isFinite(inertanceMmHgSec2PerMl)
    || inertanceMmHgSec2PerMl < 0
    || inertanceMmHgSec2PerMl > 0.004
  ) {
    throw new Error(
      "pulmonary root inertance research value must be finite within "
        + "[0, 0.004] mmHg*s^2/mL",
    );
  }
  const sourceResistancePreserved =
    rootResistanceMmHgSecPerMl ===
      SOURCE_PULMONARY_ROOT_RESISTANCE_MMHG_SEC_PER_ML;
  for (const [label, value] of Object.entries(complianceDistribution)) {
    if (!Number.isFinite(value) || value < 0.25 || value > 4) {
      throw new Error(
        `pulmonary arterial ${label} must be finite within [0.25, 4]`,
      );
    }
  }
  const sourceComplianceDistributionPreserved =
    complianceDistribution.proximalPaStiffnessMultiplier === 1
    && complianceDistribution.distalPArtStiffnessMultiplier === 1;
  return Object.freeze({
    ...MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1,
    flowLaw: inertanceMmHgSec2PerMl === 0
      ? "same-candidate-algebraic-linear-quadratic" as const
      : "backward-euler-dynamic-linear-quadratic" as const,
    inertanceMmHgSec2PerMl,
    rootResistanceMmHgSecPerMl,
    proximalPaStiffnessMultiplier:
      complianceDistribution.proximalPaStiffnessMultiplier,
    distalPArtStiffnessMultiplier:
      complianceDistribution.distalPArtStiffnessMultiplier,
    sourceResistanceAndQuadraticLossPreserved: sourceResistancePreserved,
    sourcePulmonaryArterialComplianceDistributionPreserved:
      sourceComplianceDistributionPreserved,
    parameterSearchOrFitting:
      !sourceResistancePreserved
      || inertanceMmHgSec2PerMl !== 0
      || !sourceComplianceDistributionPreserved,
    acceptedRootFlowRecordRole: inertanceMmHgSec2PerMl === 0
      ? "exact-accepted-algebraic-flow-readback-not-continuation-memory" as const
      : "exact-accepted-dynamic-flow-continuation-memory" as const,
  });
}

export function validateMainWireAlgebraicPulmonaryArterialRootProfileV1(
  input: MainWireAlgebraicPulmonaryArterialRootProfileV1,
): readonly string[] {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return Object.freeze([
      "algebraic pulmonary arterial-root profile must be an object",
    ]);
  }
  const expected = MAIN_WIRE_ALGEBRAIC_PULMONARY_ARTERIAL_ROOT_PROFILE_V1;
  const actualKeys = Object.keys(input).sort();
  const expectedKeys = Object.keys(expected).sort();
  const issues: string[] = [];
  if (
    actualKeys.length !== expectedKeys.length
    || actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    issues.push("algebraic pulmonary arterial-root profile fields differ");
  }
  for (const key of expectedKeys.filter((candidate) => ![
    "flowLaw",
    "inertanceMmHgSec2PerMl",
    "rootResistanceMmHgSecPerMl",
    "proximalPaStiffnessMultiplier",
    "distalPArtStiffnessMultiplier",
    "sourceResistanceAndQuadraticLossPreserved",
    "sourcePulmonaryArterialComplianceDistributionPreserved",
    "parameterSearchOrFitting",
    "acceptedRootFlowRecordRole",
  ].includes(candidate))) {
    if (input[key as keyof typeof input] !== expected[key as keyof typeof expected]) {
      issues.push(`algebraic pulmonary arterial-root profile ${key} differs`);
    }
  }
  const resistance = input.rootResistanceMmHgSecPerMl;
  if (
    !Number.isFinite(resistance)
    || resistance < 0.005
    || resistance > 0.2
  ) issues.push("algebraic pulmonary arterial-root profile resistance is invalid");
  const sourceResistancePreserved =
    resistance === SOURCE_PULMONARY_ROOT_RESISTANCE_MMHG_SEC_PER_ML;
  if (
    input.sourceResistanceAndQuadraticLossPreserved
      !== sourceResistancePreserved
  ) {
    issues.push(
      "algebraic pulmonary arterial-root profile source-resistance claim differs",
    );
  }
  const proximalStiffness = input.proximalPaStiffnessMultiplier;
  const distalStiffness = input.distalPArtStiffnessMultiplier;
  if (
    !Number.isFinite(proximalStiffness)
    || proximalStiffness < 0.25
    || proximalStiffness > 4
  ) {
    issues.push(
      "algebraic pulmonary arterial-root profile proximal PA stiffness is invalid",
    );
  }
  if (
    !Number.isFinite(distalStiffness)
    || distalStiffness < 0.25
    || distalStiffness > 4
  ) {
    issues.push(
      "algebraic pulmonary arterial-root profile distal PArt stiffness is invalid",
    );
  }
  const sourceComplianceDistributionPreserved =
    proximalStiffness === 1 && distalStiffness === 1;
  if (
    input.sourcePulmonaryArterialComplianceDistributionPreserved
      !== sourceComplianceDistributionPreserved
  ) {
    issues.push(
      "algebraic pulmonary arterial-root profile compliance-distribution claim differs",
    );
  }
  if (
    input.parameterSearchOrFitting !== (
      !sourceResistancePreserved
      || input.inertanceMmHgSec2PerMl !== 0
      || !sourceComplianceDistributionPreserved
    )
  ) {
    issues.push(
      "algebraic pulmonary arterial-root profile parameter-search claim differs",
    );
  }
  const inertance = input.inertanceMmHgSec2PerMl;
  if (!Number.isFinite(inertance) || inertance < 0 || inertance > 0.004) {
    issues.push("algebraic pulmonary arterial-root profile inertance is invalid");
  }
  const dynamic = inertance > 0;
  if (input.flowLaw !== (dynamic
    ? "backward-euler-dynamic-linear-quadratic"
    : "same-candidate-algebraic-linear-quadratic")) {
    issues.push("algebraic pulmonary arterial-root profile flow law differs");
  }
  if (input.acceptedRootFlowRecordRole !== (dynamic
    ? "exact-accepted-dynamic-flow-continuation-memory"
    : "exact-accepted-algebraic-flow-readback-not-continuation-memory")) {
    issues.push(
      "algebraic pulmonary arterial-root profile accepted-flow role differs",
    );
  }
  return Object.freeze(issues);
}
