import {
  buildNonCoronaryCirculationGraphV1,
  createInitialNonCoronaryCirculationStateV1,
  NON_CORONARY_NODE_NAMES_V1,
  type NonCoronaryNodeNameV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  effectiveUnstressedVolumeFromNodeV1,
  vascularPvLawFromNodeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  resolveMainWireNormalAdultCirculationConfigurationV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultCirculationConfigurationV1";
import {
  sanitizeForStableHash,
  stableCanonicalStringify,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import { stressedVolumeFromPtm } from "@/engine/vascularPv";

export const MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PRIOR_V1_ID =
  "main-wire-normal-adult-blood-volume-prior-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PRIOR_VARIANTS_V1 =
  Object.freeze([
    "cold-seed-control",
    "official-target-minus-excluded-coronary-cold-seed",
  ] as const);

export type MainWireNormalAdultBloodVolumePriorVariantV1 =
  (typeof MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PRIOR_VARIANTS_V1)[number];

type NodeVolumeRecordV1 = Readonly<
  Record<NonCoronaryNodeNameV1, number>
>;

export type MainWireNormalAdultBloodVolumePriorAuditV1 = Readonly<{
  baselineTotalBloodVolumeMl: number;
  targetTotalBloodVolumeMl: number;
  resolvedTotalBloodVolumeMl: number;
  addedBloodVolumeMl: number;
  targetResidualMl: number;
  changedNodes: readonly ["SV", "VC"] | readonly [];
  unchangedNodeMaximumAbsoluteDeltaMl: number;
  chamberVolumesChanged: false;
  vascularRuntimeChanged: false;
  venousToneChanged: false;
  venousPressureLawChanged: false;
  parameterSearchApplied: false;
}>;

export type MainWireNormalAdultBloodVolumePriorSnapshotV1 = Readonly<{
  priorId: typeof MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PRIOR_V1_ID;
  variant: MainWireNormalAdultBloodVolumePriorVariantV1;
  parameterSetId: string;
  source: Readonly<{
    coldSeedTotalBloodVolumeMl: number;
    fullGraphOfficialTargetBloodVolumeMl: number;
    excludedCoronaryColdSeedVolumeMl: number;
    officialTargetMinusExcludedCoronaryColdSeedVolumeMl: number;
  }>;
  construction: Readonly<{
    method:
      "unchanged-cold-seed"
      | "shared-SV-VC-transmural-pressure-offset";
    targetTotalBloodVolumeMl: number;
    adjustedNodes: readonly ["SV", "VC"] | readonly [];
    sharedTransmuralPressureOffsetMmHg: number;
    baselineTransmuralPressuresMmHg: Readonly<{ SV: number; VC: number }>;
    resolvedTransmuralPressuresMmHg: Readonly<{ SV: number; VC: number }>;
    nodeVolumesMl: NodeVolumeRecordV1;
    nodeVolumeDeltasMl: NodeVolumeRecordV1;
  }>;
  audit: MainWireNormalAdultBloodVolumePriorAuditV1;
  claim: Readonly<{
    operatingPointOwner: "fixed-initial-total-blood-volume";
    runtimeBloodVolumeProjectionApplied: false;
    vascularOrMaterialParameterChanged: false;
    venousToneOrUnstressedVolumeChanged: false;
    parameterSearchApplied: false;
    physiologicalNormalityClaimed: false;
    scopeCorrectionClaimed: false;
  }>;
}>;

export type MainWireNormalAdultBloodVolumePriorResolvedV1 = Readonly<{
  snapshot: MainWireNormalAdultBloodVolumePriorSnapshotV1;
  snapshotStableHash: string;
  nodeVolumesMl: NodeVolumeRecordV1;
  audit: MainWireNormalAdultBloodVolumePriorAuditV1;
}>;

const SV_VC_NODES = Object.freeze(["SV", "VC"] as const);
const TARGET_TOLERANCE_ML = 1e-8;

/**
 * Resolve one of two predeclared operating points without changing any
 * vascular or myocardial parameter.  The challenger adds blood volume to
 * the systemic venous reservoir by applying the same initial transmural
 * pressure offset to SV and VC.  This keeps the source venous PV laws and
 * venous tone fixed and avoids assigning the whole difference to one
 * arbitrary compartment.
 */
export function resolveMainWireNormalAdultBloodVolumePriorV1(
  variant: MainWireNormalAdultBloodVolumePriorVariantV1 = "cold-seed-control",
): MainWireNormalAdultBloodVolumePriorResolvedV1 {
  assertVariant(variant);
  const configuration =
    resolveMainWireNormalAdultCirculationConfigurationV1();
  const runtime = configuration.runtime;
  const source = configuration.snapshot.effective.initialVolumeConstruction;
  const baseline = createInitialNonCoronaryCirculationStateV1({
    timeSec: 0,
    runtime,
  });
  const targetTotalBloodVolumeMl = variant === "cold-seed-control"
    ? baseline.totalBloodVolumeMl
    : source.officialTargetMinusExcludedColdSeedVolumeMl;
  if (!(targetTotalBloodVolumeMl > 0)) {
    throw new Error("blood-volume prior target must be positive");
  }

  const graph = buildNonCoronaryCirculationGraphV1();
  const baselinePtm = Object.freeze({
    SV: graph.nodes[graph.nodeIndex.get("SV")!]!.x0,
    VC: graph.nodes[graph.nodeIndex.get("VC")!]!.x0,
  });
  const targetAdditionalVolumeMl =
    targetTotalBloodVolumeMl - baseline.totalBloodVolumeMl;
  if (targetAdditionalVolumeMl < -TARGET_TOLERANCE_ML) {
    throw new Error("V1 blood-volume challenger cannot remove cold-seed blood");
  }
  const sharedOffsetMmHg = targetAdditionalVolumeMl <= TARGET_TOLERANCE_ML
    ? 0
    : solveSharedVenousPressureOffset(
      baseline.nodeVolumesMl,
      targetAdditionalVolumeMl,
      runtime.vascular,
      graph,
      baselinePtm,
    );
  const nodeVolumesMl = nodeRecord((nodeName) => {
    if (nodeName !== "SV" && nodeName !== "VC") {
      return baseline.nodeVolumesMl[nodeName];
    }
    const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
    const law = vascularPvLawFromNodeV1(node, runtime.vascular);
    const unstressed = effectiveUnstressedVolumeFromNodeV1(
      node,
      runtime.vascular,
    );
    return unstressed + stressedVolumeFromPtm(
      law,
      baselinePtm[nodeName] + sharedOffsetMmHg,
    );
  });
  const resolvedTotalBloodVolumeMl = sumNodeVolumes(nodeVolumesMl);
  const targetResidualMl =
    resolvedTotalBloodVolumeMl - targetTotalBloodVolumeMl;
  if (Math.abs(targetResidualMl) > TARGET_TOLERANCE_ML) {
    throw new Error(
      `blood-volume prior missed target by ${targetResidualMl} mL`,
    );
  }
  const nodeVolumeDeltasMl = nodeRecord((nodeName) =>
    nodeVolumesMl[nodeName] - baseline.nodeVolumesMl[nodeName]);
  const unchangedNodeMaximumAbsoluteDeltaMl = Math.max(
    ...NON_CORONARY_NODE_NAMES_V1
      .filter((nodeName) => nodeName !== "SV" && nodeName !== "VC")
      .map((nodeName) => Math.abs(nodeVolumeDeltasMl[nodeName])),
  );
  if (unchangedNodeMaximumAbsoluteDeltaMl !== 0) {
    throw new Error("blood-volume prior changed a node outside SV/VC");
  }
  const changedNodes = sharedOffsetMmHg === 0
    ? Object.freeze([] as const)
    : SV_VC_NODES;
  const audit = deepFreeze({
    baselineTotalBloodVolumeMl: baseline.totalBloodVolumeMl,
    targetTotalBloodVolumeMl,
    resolvedTotalBloodVolumeMl,
    addedBloodVolumeMl:
      resolvedTotalBloodVolumeMl - baseline.totalBloodVolumeMl,
    targetResidualMl,
    changedNodes,
    unchangedNodeMaximumAbsoluteDeltaMl,
    chamberVolumesChanged: false as const,
    vascularRuntimeChanged: false as const,
    venousToneChanged: false as const,
    venousPressureLawChanged: false as const,
    parameterSearchApplied: false as const,
  }) as MainWireNormalAdultBloodVolumePriorAuditV1;
  const snapshot = deepFreeze({
    priorId: MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PRIOR_V1_ID,
    variant,
    parameterSetId: variant === "cold-seed-control"
      ? "main-wire-noncoronary-cold-seed-tbv-v1"
      : "main-wire-official-target-minus-coronary-cold-seed-tbv-v1",
    source: {
      coldSeedTotalBloodVolumeMl: source.coldSeedTotalBloodVolumeMl,
      fullGraphOfficialTargetBloodVolumeMl:
        configuration.snapshot.source.officialOperatingPoint
          .fullGraphTargetBloodVolumeMl,
      excludedCoronaryColdSeedVolumeMl:
        source.excludedCoronaryColdVolumeMl,
      officialTargetMinusExcludedCoronaryColdSeedVolumeMl:
        source.officialTargetMinusExcludedColdSeedVolumeMl,
    },
    construction: {
      method: sharedOffsetMmHg === 0
        ? "unchanged-cold-seed" as const
        : "shared-SV-VC-transmural-pressure-offset" as const,
      targetTotalBloodVolumeMl,
      adjustedNodes: changedNodes,
      sharedTransmuralPressureOffsetMmHg: sharedOffsetMmHg,
      baselineTransmuralPressuresMmHg: baselinePtm,
      resolvedTransmuralPressuresMmHg: {
        SV: baselinePtm.SV + sharedOffsetMmHg,
        VC: baselinePtm.VC + sharedOffsetMmHg,
      },
      nodeVolumesMl,
      nodeVolumeDeltasMl,
    },
    audit,
    claim: {
      operatingPointOwner: "fixed-initial-total-blood-volume" as const,
      runtimeBloodVolumeProjectionApplied: false as const,
      vascularOrMaterialParameterChanged: false as const,
      venousToneOrUnstressedVolumeChanged: false as const,
      parameterSearchApplied: false as const,
      physiologicalNormalityClaimed: false as const,
      scopeCorrectionClaimed: false as const,
    },
  }) as MainWireNormalAdultBloodVolumePriorSnapshotV1;
  return Object.freeze({
    snapshot,
    snapshotStableHash: stableHash(sanitizeForStableHash(snapshot)),
    nodeVolumesMl,
    audit,
  });
}

export function assertMainWireNormalAdultBloodVolumePriorMatchesFixedRegistryV1(
  snapshot: MainWireNormalAdultBloodVolumePriorSnapshotV1,
): void {
  if (
    snapshot === null
    || typeof snapshot !== "object"
    || snapshot.priorId !== MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PRIOR_V1_ID
  ) throw new Error("blood-volume prior snapshot is missing or malformed");
  const expected = resolveMainWireNormalAdultBloodVolumePriorV1(
    snapshot.variant,
  );
  const actualSanitized = sanitizeForStableHash(snapshot);
  const expectedSanitized = sanitizeForStableHash(expected.snapshot);
  if (
    stableHash(actualSanitized) !== expected.snapshotStableHash
    || stableCanonicalStringify(actualSanitized)
      !== stableCanonicalStringify(expectedSanitized)
  ) {
    throw new Error(
      "blood-volume prior snapshot does not match the fixed registry",
    );
  }
}

function solveSharedVenousPressureOffset(
  baselineVolumesMl: NodeVolumeRecordV1,
  targetAdditionalVolumeMl: number,
  vascularRuntime: Parameters<typeof vascularPvLawFromNodeV1>[1],
  graph: ReturnType<typeof buildNonCoronaryCirculationGraphV1>,
  baselinePtm: Readonly<{ SV: number; VC: number }>,
): number {
  const addedAt = (offsetMmHg: number): number => SV_VC_NODES.reduce(
    (sum, nodeName) => {
      const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
      const law = vascularPvLawFromNodeV1(node, vascularRuntime);
      const unstressed = effectiveUnstressedVolumeFromNodeV1(
        node,
        vascularRuntime,
      );
      const volume = unstressed + stressedVolumeFromPtm(
        law,
        baselinePtm[nodeName] + offsetMmHg,
      );
      return sum + volume - baselineVolumesMl[nodeName];
    },
    0,
  );

  let lower = 0;
  let upper = 1;
  while (addedAt(upper) < targetAdditionalVolumeMl) {
    upper *= 2;
    if (upper > 256) {
      throw new Error("blood-volume prior target exceeds SV/VC support");
    }
  }
  for (let iteration = 0; iteration < 96; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    if (addedAt(midpoint) < targetAdditionalVolumeMl) lower = midpoint;
    else upper = midpoint;
  }
  return 0.5 * (lower + upper);
}

function assertVariant(
  variant: MainWireNormalAdultBloodVolumePriorVariantV1,
): void {
  if (!MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PRIOR_VARIANTS_V1.includes(
    variant,
  )) {
    throw new Error(`unsupported blood-volume prior variant ${variant}`);
  }
}

function nodeRecord(
  build: (nodeName: NonCoronaryNodeNameV1) => number,
): NodeVolumeRecordV1 {
  return Object.freeze(Object.fromEntries(
    NON_CORONARY_NODE_NAMES_V1.map((nodeName) => [nodeName, build(nodeName)]),
  )) as NodeVolumeRecordV1;
}

function sumNodeVolumes(volumes: NodeVolumeRecordV1): number {
  return NON_CORONARY_NODE_NAMES_V1.reduce(
    (sum, nodeName) => sum + volumes[nodeName],
    0,
  );
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
