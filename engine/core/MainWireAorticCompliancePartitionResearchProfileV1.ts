import { buildNodes, type NodeSpec } from "@/engine/core/topology";

export const MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILE_V1_ID =
  "main-wire-aortic-compliance-partition-research-profile-v1" as const;

export const MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILE_IDS_V1 =
  Object.freeze([
    "aortic-root-exponential-pv-capacity-one-third",
    "aortic-root-exponential-pv-capacity-half",
    "aortic-root-exponential-pv-capacity-low",
    "aortic-root-exponential-pv-capacity-high",
  ] as const);

export type MainWireAorticCompliancePartitionResearchProfileIdV1 =
  (typeof MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILE_IDS_V1)[number];

export type MainWireAorticCompliancePartitionResearchProfileV1 = Readonly<{
  profileId: MainWireAorticCompliancePartitionResearchProfileIdV1;
  aorticRootCapacityScaleFromTopology: number;
  compensationRule: "equal-and-opposite-Vs-transfer-from-Ao-to-SA";
  parameterSearchOrFitting: false;
}>;

const SOURCE_NODES = buildNodes();
const SOURCE_AO = requiredArterialNode("Ao");
const SOURCE_SA = requiredArterialNode("SA");
const SOURCE_AO_VS_ML = SOURCE_AO.Vs!;
const SOURCE_SA_VS_ML = SOURCE_SA.Vs!;

if (SOURCE_AO.P0 !== SOURCE_SA.P0) {
  throw new Error(
    "aortic compliance partition requires equal Ao and SA arterial P0",
  );
}

export const MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILES_V1 =
  Object.freeze({
    "aortic-root-exponential-pv-capacity-one-third": Object.freeze({
      profileId: "aortic-root-exponential-pv-capacity-one-third" as const,
      aorticRootCapacityScaleFromTopology: 1 / 3,
      compensationRule:
        "equal-and-opposite-Vs-transfer-from-Ao-to-SA" as const,
      parameterSearchOrFitting: false as const,
    }),
    "aortic-root-exponential-pv-capacity-half": Object.freeze({
      profileId: "aortic-root-exponential-pv-capacity-half" as const,
      aorticRootCapacityScaleFromTopology: 0.5,
      compensationRule:
        "equal-and-opposite-Vs-transfer-from-Ao-to-SA" as const,
      parameterSearchOrFitting: false as const,
    }),
    "aortic-root-exponential-pv-capacity-low": Object.freeze({
      profileId: "aortic-root-exponential-pv-capacity-low" as const,
      aorticRootCapacityScaleFromTopology: 0.75,
      compensationRule:
        "equal-and-opposite-Vs-transfer-from-Ao-to-SA" as const,
      parameterSearchOrFitting: false as const,
    }),
    "aortic-root-exponential-pv-capacity-high": Object.freeze({
      profileId: "aortic-root-exponential-pv-capacity-high" as const,
      aorticRootCapacityScaleFromTopology: 4 / 3,
      compensationRule:
        "equal-and-opposite-Vs-transfer-from-Ao-to-SA" as const,
      parameterSearchOrFitting: false as const,
    }),
  } satisfies Readonly<Record<
    MainWireAorticCompliancePartitionResearchProfileIdV1,
    MainWireAorticCompliancePartitionResearchProfileV1
  >>);

export const MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_CLAIM_V1 =
  Object.freeze({
    role: "fixed-profile-source-research-ablation" as const,
    affectedNodes: Object.freeze(["Ao", "SA"] as const),
    topologyOwnedExponentialPvCapacityRedistributed: true as const,
    aorticRootCapacityScaleAxis:
      Object.freeze([1 / 3, 0.5, 0.75, 4 / 3] as const),
    aorticRootPlusSystemicArteryVsSumPreservedExactly: true as const,
    aorticRootAndSystemicArteryP0Equal: true as const,
    equalPressureCombinedTangentCompliancePreservedExactly: true as const,
    actualPressureCombinedTangentComplianceNeedNotBeExact: true as const,
    globalArterialStiffnessChanged: false as const,
    arterialResistanceOrInertanceChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    parameterSearchOrFitting: false as const,
    lowerBracketExpansionInformedByObservedRootStorage: true as const,
    numericHemodynamicTargetFitApplied: false as const,
    anatomicalSupportLengthIdentified: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireAorticCompliancePartitionCapacitySnapshotV1 = Readonly<{
  sourceAorticRootVsMl: number;
  sourceSystemicArteryVsMl: number;
  resolvedAorticRootVsMl: number;
  resolvedSystemicArteryVsMl: number;
  sourceAoSaTotalVsMl: number;
  resolvedAoSaTotalVsMl: number;
  totalVsResidualMl: number;
}>;

export const MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_BASELINE_CAPACITY_SNAPSHOT_V1 =
  capacitySnapshot(1);

export function resolveMainWireAorticCompliancePartitionResearchProfileV1(
  profileId: MainWireAorticCompliancePartitionResearchProfileIdV1,
): MainWireAorticCompliancePartitionResearchProfileV1 {
  const profile =
    MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILES_V1[profileId];
  if (profile === undefined) {
    throw new Error(
      `unsupported aortic compliance partition profile: ${String(profileId)}`,
    );
  }
  return profile;
}

export function resolveMainWireAorticCompliancePartitionCapacitySnapshotV1(
  profile: MainWireAorticCompliancePartitionResearchProfileV1,
): MainWireAorticCompliancePartitionCapacitySnapshotV1 {
  const issues = validateMainWireAorticCompliancePartitionResearchProfileV1(
    profile,
  );
  if (issues.length > 0) {
    throw new Error(`invalid aortic compliance partition profile: ${
      issues.join("; ")}`);
  }
  return capacitySnapshot(profile.aorticRootCapacityScaleFromTopology);
}

function capacitySnapshot(
  aorticRootCapacityScaleFromTopology: number,
): MainWireAorticCompliancePartitionCapacitySnapshotV1 {
  const resolvedAorticRootVsMl = SOURCE_AO_VS_ML
    * aorticRootCapacityScaleFromTopology;
  const deltaMl = resolvedAorticRootVsMl - SOURCE_AO_VS_ML;
  const resolvedSystemicArteryVsMl = SOURCE_SA_VS_ML - deltaMl;
  const sourceAoSaTotalVsMl = SOURCE_AO_VS_ML + SOURCE_SA_VS_ML;
  const resolvedAoSaTotalVsMl =
    resolvedAorticRootVsMl + resolvedSystemicArteryVsMl;
  if (!(resolvedAorticRootVsMl > 0) || !(resolvedSystemicArteryVsMl > 0)) {
    throw new Error("aortic compliance partition produced nonpositive Vs");
  }
  return Object.freeze({
    sourceAorticRootVsMl: SOURCE_AO_VS_ML,
    sourceSystemicArteryVsMl: SOURCE_SA_VS_ML,
    resolvedAorticRootVsMl,
    resolvedSystemicArteryVsMl,
    sourceAoSaTotalVsMl,
    resolvedAoSaTotalVsMl,
    totalVsResidualMl: resolvedAoSaTotalVsMl - sourceAoSaTotalVsMl,
  });
}

export function resolveMainWireAorticCompliancePartitionNodeVsV1(
  node: NodeSpec,
  profile: MainWireAorticCompliancePartitionResearchProfileV1,
): number {
  const sourceVs = node.Vs ?? 100;
  if (node.name !== "Ao" && node.name !== "SA") return sourceVs;
  const capacity =
    resolveMainWireAorticCompliancePartitionCapacitySnapshotV1(profile);
  const expectedSource = node.name === "Ao"
    ? capacity.sourceAorticRootVsMl
    : capacity.sourceSystemicArteryVsMl;
  if (sourceVs !== expectedSource) {
    throw new Error(`${node.name} topology Vs drifted from partition source`);
  }
  return node.name === "Ao"
    ? capacity.resolvedAorticRootVsMl
    : capacity.resolvedSystemicArteryVsMl;
}

export function validateMainWireAorticCompliancePartitionResearchProfileV1(
  value: MainWireAorticCompliancePartitionResearchProfileV1,
): readonly string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return Object.freeze([
      "aortic compliance partition profile must be an object",
    ]);
  }
  const expected =
    MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILES_V1[value.profileId];
  if (expected === undefined) {
    return Object.freeze([
      "aortic compliance partition profileId is unsupported",
    ]);
  }
  const issues: string[] = [];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    issues.push(
      "aortic compliance partition profile fields differ from the fixed profile",
    );
  }
  for (const key of expectedKeys) {
    if (
      value[key as keyof MainWireAorticCompliancePartitionResearchProfileV1]
      !== expected[
        key as keyof MainWireAorticCompliancePartitionResearchProfileV1
      ]
    ) {
      issues.push(
        `aortic compliance partition profile ${key} differs from its fixed value`,
      );
    }
  }
  return Object.freeze(issues);
}

function requiredArterialNode(name: "Ao" | "SA"): NodeSpec {
  const node = SOURCE_NODES.find((candidate) => candidate.name === name);
  if (node === undefined || node.kind !== "arterial" || !(node.Vs! > 0)) {
    throw new Error(`${name} source topology lacks an arterial Vs`);
  }
  return node;
}
