import {
  buildNonCoronaryCirculationGraphV1,
  NON_CORONARY_CIRCULATION_SCOPE_V1,
  NON_CORONARY_NODE_NAMES_V1,
  resolveNonCoronaryCirculationColdSeedV1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryNodeNameV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  buildAuthoritativeCirculationGraphV1,
  effectiveUnstressedVolumeFromNodeV1,
  physicalColdSeedVolumeFromNodeV1,
  vascularPvLawFromNodeV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import { OFFICIAL_BASELINES } from "@/engine/caseBaselines";
import { stressedVolumeFromPtm } from "@/engine/vascularPv";

export const MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1_ID =
  "main-wire-normal-adult-blood-volume-operating-point-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_TOPOLOGY_SCOPE_V1_ID =
  "main-wire-noncoronary-15-node-no-coronary-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_STRESSED_VENOUS_VOLUME_RESEARCH_POINT_IDS_V1 =
  Object.freeze([
    "baseline",
    "stressed-venous-volume-low",
    "stressed-venous-volume-high",
  ] as const);

export type MainWireNormalAdultStressedVenousVolumeResearchPointIdV1 =
  (typeof MAIN_WIRE_NORMAL_ADULT_STRESSED_VENOUS_VOLUME_RESEARCH_POINT_IDS_V1)[number];

export type MainWireNormalAdultStressedVenousVolumeResearchPointV1 = Readonly<{
  pointId: MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
  canonicalAdditionalSvVcVolumeScale: number;
  fixedTotalBloodVolumeMl: number;
  claim: Readonly<{
    sourceResearchOnly: true;
    fixedPointNotGenericPatch: true;
    onlyCanonicalAdditionalSvVcVolumeScaled: true;
    initialDistributionPolicyHeldFixed: true;
    withinRunTotalBloodVolumeFixed: true;
    canonicalFullGraphReferenceClaimed: boolean;
  }>;
}>;

export type MainWireNormalAdultBloodVolumeOperatingPointIdentityV1 = Readonly<{
  ownerId: typeof MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1_ID;
  parameterSetId: string;
  topologyScopeId:
    typeof MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_TOPOLOGY_SCOPE_V1_ID;
  fixedTotalBloodVolumeMl: number;
  initialDistributionPolicyId: "shared-SV-VC-transmural-offset";
}>;

/**
 * The protocol identity deliberately contains only semantic owner inputs.
 * Root iterations, the resolved pressure offset, and audit readbacks are
 * deterministic derivatives and must not create a new protocol identity.
 */
export const MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1 =
  Object.freeze({
    ownerId: MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1_ID,
    parameterSetId:
      "main-wire-normal-adult-noncoronary-fixed-tbv-5522p11ml-v1",
    topologyScopeId:
      MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_TOPOLOGY_SCOPE_V1_ID,
    fixedTotalBloodVolumeMl: 5522.11,
    initialDistributionPolicyId:
      "shared-SV-VC-transmural-offset" as const,
  }) satisfies MainWireNormalAdultBloodVolumeOperatingPointIdentityV1;

/**
 * The source full-graph reference is 5600 mL. This owner is noncoronary, so
 * the 77.89 mL coronary cold-seed ledger is intentionally outside its scope:
 * 5600 - 77.89 = 5522.11 mL. This is provenance, not another fitted parameter.
 */
export const MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1 = Object.freeze({
  fullGraphReferenceBaselineId: "active-normal" as const,
  fullGraphReferenceTotalBloodVolumeMl:
    OFFICIAL_BASELINES["active-normal"]!.targetVolume,
  pinnedExcludedCoronaryColdSeedVolumeMl: 77.89,
  nonCoronaryFixedTotalBloodVolumeMl: 5522.11,
});

type NodeVolumeRecordV1 = Readonly<Record<NonCoronaryNodeNameV1, number>>;

export type MainWireNormalAdultBloodVolumeOperatingPointAuditV1 = Readonly<{
  coldSeedTotalBloodVolumeMl: number;
  resolvedTotalBloodVolumeMl: number;
  addedBloodVolumeMl: number;
  targetResidualMl: number;
  sharedTransmuralPressureOffsetMmHg: number;
  baselineTransmuralPressuresMmHg: Readonly<{ SV: number; VC: number }>;
  resolvedTransmuralPressuresMmHg: Readonly<{ SV: number; VC: number }>;
  resolvedTransmuralPressureOffsetsMmHg: Readonly<{ SV: number; VC: number }>;
  maximumSharedTransmuralPressureOffsetResidualMmHg: number;
  changedNodes: readonly ("SV" | "VC")[];
  unchangedNodeMaximumAbsoluteDeltaMl: number;
  fullGraphReferenceTotalBloodVolumeMl: number;
  excludedCoronaryColdSeedVolumeMl: number;
  pinnedExcludedCoronaryColdSeedVolumeMl: number;
  excludedCoronaryColdSeedResidualMl: number;
  fullGraphReferenceReconstructionResidualMl: number;
}>;

export type MainWireNormalAdultBloodVolumeOperatingPointResolvedV1 = Readonly<{
  identity: MainWireNormalAdultBloodVolumeOperatingPointIdentityV1;
  fixedTotalBloodVolumeMl: number;
  nodeVolumesMl: NodeVolumeRecordV1;
  audit: MainWireNormalAdultBloodVolumeOperatingPointAuditV1;
}>;

export type MainWireNormalAdultBloodVolumeResearchPointResolvedV1 = Readonly<{
  point: MainWireNormalAdultStressedVenousVolumeResearchPointV1;
  operatingPoint: MainWireNormalAdultBloodVolumeOperatingPointResolvedV1;
}>;

const ADJUSTED_NODES = Object.freeze(["SV", "VC"] as const);
// Arbitrary protocol targets exercise the nonlinear forward/inverse venous PV
// maps away from the canonical point. One nanolitre is still far below every
// physiological or solver scale while avoiding false rejection from a
// sub-nanolitre floating-point residual.
const TARGET_TOLERANCE_ML = 1e-6;
const PRESSURE_AUDIT_TOLERANCE_MMHG = 1e-8;

/**
 * Resolve the canonical noncoronary operating point without changing any
 * vascular law, tone, resistance, chamber cold volume, or material parameter.
 * Only SV and VC receive volume, and both receive the same transmural-pressure
 * offset under their current main-wire PV laws.
 */
export function resolveMainWireNormalAdultBloodVolumeOperatingPointV1(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): MainWireNormalAdultBloodVolumeOperatingPointResolvedV1 {
  return resolveBloodVolumeOperatingPoint(
    runtime,
    MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1,
    true,
  );
}

/**
 * Protocol-only fixed-TBV cold-start seam used by preload-family experiments.
 * It preserves the same SV/VC shared-transmural-pressure initialization rule
 * as the canonical operating point. The target is an experimental coordinate,
 * not a persistent case parameter and not a fitted patient blood volume.
 */
export function resolveMainWireNormalAdultBloodVolumeProtocolTargetV1(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  fixedTotalBloodVolumeMl: number,
): MainWireNormalAdultBloodVolumeOperatingPointResolvedV1 {
  if (!Number.isFinite(fixedTotalBloodVolumeMl) || fixedTotalBloodVolumeMl <= 0) {
    throw new Error("protocol fixed total blood volume must be positive and finite");
  }
  const identity = Object.freeze({
    ownerId: MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1_ID,
    parameterSetId:
      `main-wire-normal-adult-protocol-fixed-tbv-${
        fixedTotalBloodVolumeMl.toFixed(6).replace(".", "p")
      }ml-v1`,
    topologyScopeId:
      MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_TOPOLOGY_SCOPE_V1_ID,
    fixedTotalBloodVolumeMl,
    initialDistributionPolicyId:
      "shared-SV-VC-transmural-offset" as const,
  });
  return resolveBloodVolumeOperatingPoint(runtime, identity, false);
}

/** Fixed-ID-only preload seam for the source research runner. */
export function resolveMainWireNormalAdultBloodVolumeResearchPointV1(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  pointId: MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
): MainWireNormalAdultBloodVolumeResearchPointResolvedV1 {
  const point = stressedVenousVolumeResearchPoint(pointId);
  const identity = pointId === "baseline"
    ? MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1
    : Object.freeze({
      ownerId: MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1_ID,
      parameterSetId:
        `main-wire-normal-adult-fixed-tbv-source-research-${pointId}-v1`,
      topologyScopeId:
        MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_TOPOLOGY_SCOPE_V1_ID,
      fixedTotalBloodVolumeMl: point.fixedTotalBloodVolumeMl,
      initialDistributionPolicyId:
        "shared-SV-VC-transmural-offset" as const,
    });
  const operatingPoint = resolveBloodVolumeOperatingPoint(
    runtime,
    identity,
    pointId === "baseline",
  );
  const expectedTarget = operatingPoint.audit.coldSeedTotalBloodVolumeMl
    + point.canonicalAdditionalSvVcVolumeScale * (
      MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1
        .fixedTotalBloodVolumeMl
      - operatingPoint.audit.coldSeedTotalBloodVolumeMl
    );
  if (Math.abs(expectedTarget - point.fixedTotalBloodVolumeMl) > 1e-9) {
    throw new Error(
      "fixed stressed-venous-volume point drifted from the canonical additional SV/VC ledger",
    );
  }
  return Object.freeze({ point, operatingPoint });
}

function resolveBloodVolumeOperatingPoint(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  identity: MainWireNormalAdultBloodVolumeOperatingPointIdentityV1,
  requireCanonicalFullGraphReference: boolean,
): MainWireNormalAdultBloodVolumeOperatingPointResolvedV1 {
  const provenance = MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1;
  const excludedCoronaryColdSeedVolumeMl =
    authoritativeExcludedCoronaryColdSeedVolumeMl(runtime);
  const excludedCoronaryColdSeedResidualMl =
    excludedCoronaryColdSeedVolumeMl
    - provenance.pinnedExcludedCoronaryColdSeedVolumeMl;
  if (Math.abs(excludedCoronaryColdSeedResidualMl) > 1e-12) {
    throw new Error(
      "authoritative excluded-coronary cold-seed ledger drifted from its pinned provenance",
    );
  }
  const provenanceResidual = identity.fixedTotalBloodVolumeMl
    + excludedCoronaryColdSeedVolumeMl
    - provenance.fullGraphReferenceTotalBloodVolumeMl;
  if (
    requireCanonicalFullGraphReference
    && Math.abs(provenanceResidual) > 1e-12
  ) {
    throw new Error("noncoronary TBV provenance no longer reconstructs the full-graph reference");
  }

  const graph = buildNonCoronaryCirculationGraphV1();
  if (
    graph.scope.coronaryBloodVolumeIncluded !== false
    || graph.nodes.length !== NON_CORONARY_NODE_NAMES_V1.length
  ) throw new Error("blood-volume operating point topology scope mismatch");

  const coldSeed = resolveNonCoronaryCirculationColdSeedV1(runtime);
  const targetAdditionalVolumeMl = identity.fixedTotalBloodVolumeMl
    - coldSeed.fixedTotalBloodVolumeMl;
  if (targetAdditionalVolumeMl < -TARGET_TOLERANCE_ML) {
    throw new Error("fixed normal-adult TBV cannot be constructed by adding SV/VC volume");
  }

  const baselineTransmuralPressuresMmHg = Object.freeze({
    SV: baselineTransmuralPressureMmHg(
      "SV",
      coldSeed.nodeVolumesMl,
      runtime,
      graph,
    ),
    VC: baselineTransmuralPressureMmHg(
      "VC",
      coldSeed.nodeVolumesMl,
      runtime,
      graph,
    ),
  });
  const sharedTransmuralPressureOffsetMmHg = targetAdditionalVolumeMl
      <= TARGET_TOLERANCE_ML
    ? 0
    : solveSharedTransmuralPressureOffsetMmHg(
      coldSeed.nodeVolumesMl,
      targetAdditionalVolumeMl,
      runtime,
      graph,
      baselineTransmuralPressuresMmHg,
    );
  const nodeVolumesMl = nodeRecord((nodeName) => {
    if (nodeName !== "SV" && nodeName !== "VC") {
      return coldSeed.nodeVolumesMl[nodeName];
    }
    return physicalVolumeAtTransmuralPressureMmHg(
      nodeName,
      baselineTransmuralPressuresMmHg[nodeName]
        + sharedTransmuralPressureOffsetMmHg,
      runtime,
      graph,
    );
  });
  const resolvedTotalBloodVolumeMl = sumNodeVolumes(nodeVolumesMl);
  const targetResidualMl = resolvedTotalBloodVolumeMl
    - identity.fixedTotalBloodVolumeMl;
  if (Math.abs(targetResidualMl) > TARGET_TOLERANCE_ML) {
    throw new Error(`blood-volume operating point missed target by ${targetResidualMl} mL`);
  }
  const unchangedNodeMaximumAbsoluteDeltaMl = Math.max(
    ...NON_CORONARY_NODE_NAMES_V1
      .filter((nodeName) => nodeName !== "SV" && nodeName !== "VC")
      .map((nodeName) => Math.abs(
        nodeVolumesMl[nodeName] - coldSeed.nodeVolumesMl[nodeName],
      )),
  );
  if (unchangedNodeMaximumAbsoluteDeltaMl !== 0) {
    throw new Error("blood-volume operating point changed a cold-seed node outside SV/VC");
  }
  const changedNodes = Object.freeze(ADJUSTED_NODES.filter((nodeName) =>
    nodeVolumesMl[nodeName] !== coldSeed.nodeVolumesMl[nodeName]));
  const resolvedTransmuralPressuresMmHg = Object.freeze({
    SV: baselineTransmuralPressureMmHg(
      "SV",
      nodeVolumesMl,
      runtime,
      graph,
    ),
    VC: baselineTransmuralPressureMmHg(
      "VC",
      nodeVolumesMl,
      runtime,
      graph,
    ),
  });
  const resolvedTransmuralPressureOffsetsMmHg = Object.freeze({
    SV: resolvedTransmuralPressuresMmHg.SV
      - baselineTransmuralPressuresMmHg.SV,
    VC: resolvedTransmuralPressuresMmHg.VC
      - baselineTransmuralPressuresMmHg.VC,
  });
  const maximumSharedTransmuralPressureOffsetResidualMmHg = Math.max(
    Math.abs(
      resolvedTransmuralPressureOffsetsMmHg.SV
        - sharedTransmuralPressureOffsetMmHg,
    ),
    Math.abs(
      resolvedTransmuralPressureOffsetsMmHg.VC
        - sharedTransmuralPressureOffsetMmHg,
    ),
  );
  if (
    maximumSharedTransmuralPressureOffsetResidualMmHg
      > PRESSURE_AUDIT_TOLERANCE_MMHG
  ) {
    throw new Error(
      "blood-volume operating point forward/inverse pressure audit failed",
    );
  }

  const audit = Object.freeze({
    coldSeedTotalBloodVolumeMl: coldSeed.fixedTotalBloodVolumeMl,
    resolvedTotalBloodVolumeMl,
    addedBloodVolumeMl:
      resolvedTotalBloodVolumeMl - coldSeed.fixedTotalBloodVolumeMl,
    targetResidualMl,
    sharedTransmuralPressureOffsetMmHg,
    baselineTransmuralPressuresMmHg,
    resolvedTransmuralPressuresMmHg,
    resolvedTransmuralPressureOffsetsMmHg,
    maximumSharedTransmuralPressureOffsetResidualMmHg,
    changedNodes,
    unchangedNodeMaximumAbsoluteDeltaMl,
    fullGraphReferenceTotalBloodVolumeMl:
      provenance.fullGraphReferenceTotalBloodVolumeMl,
    excludedCoronaryColdSeedVolumeMl:
      excludedCoronaryColdSeedVolumeMl,
    pinnedExcludedCoronaryColdSeedVolumeMl:
      provenance.pinnedExcludedCoronaryColdSeedVolumeMl,
    excludedCoronaryColdSeedResidualMl,
    fullGraphReferenceReconstructionResidualMl: provenanceResidual,
  });
  return Object.freeze({
    identity,
    fixedTotalBloodVolumeMl: identity.fixedTotalBloodVolumeMl,
    nodeVolumesMl,
    audit,
  });
}

function stressedVenousVolumeResearchPoint(
  pointId: MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
): MainWireNormalAdultStressedVenousVolumeResearchPointV1 {
  if (!MAIN_WIRE_NORMAL_ADULT_STRESSED_VENOUS_VOLUME_RESEARCH_POINT_IDS_V1
    .includes(pointId)) {
    throw new Error(`unsupported fixed stressed venous volume research point: ${String(pointId)}`);
  }
  const canonicalColdSeedMl = 4589.457569593876;
  const canonicalAdditionalMl =
    MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1.fixedTotalBloodVolumeMl
    - canonicalColdSeedMl;
  const scale = pointId === "stressed-venous-volume-low"
    ? 0.75
    : pointId === "stressed-venous-volume-high" ? 4 / 3 : 1;
  return Object.freeze({
    pointId,
    canonicalAdditionalSvVcVolumeScale: scale,
    fixedTotalBloodVolumeMl: canonicalColdSeedMl + scale * canonicalAdditionalMl,
    claim: Object.freeze({
      sourceResearchOnly: true as const,
      fixedPointNotGenericPatch: true as const,
      onlyCanonicalAdditionalSvVcVolumeScaled: true as const,
      initialDistributionPolicyHeldFixed: true as const,
      withinRunTotalBloodVolumeFixed: true as const,
      canonicalFullGraphReferenceClaimed: pointId === "baseline",
    }),
  });
}

function baselineTransmuralPressureMmHg(
  nodeName: "SV" | "VC",
  coldSeedVolumesMl: NodeVolumeRecordV1,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  graph: ReturnType<typeof buildNonCoronaryCirculationGraphV1>,
): number {
  const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
  if (node.kind !== "venousPressure") {
    throw new Error(`${nodeName} is no longer a venous-pressure node`);
  }
  return vascularTransmuralPressureFromPhysicalVolumeV1(
    node,
    coldSeedVolumesMl[nodeName],
    runtime.vascular,
    "adaptive-volume-tolerance",
  );
}

function physicalVolumeAtTransmuralPressureMmHg(
  nodeName: "SV" | "VC",
  transmuralPressureMmHg: number,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  graph: ReturnType<typeof buildNonCoronaryCirculationGraphV1>,
): number {
  const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
  if (node.kind !== "venousPressure") {
    throw new Error(`${nodeName} is no longer a venous-pressure node`);
  }
  const law = vascularPvLawFromNodeV1(node, runtime.vascular);
  return effectiveUnstressedVolumeFromNodeV1(node, runtime.vascular)
    + stressedVolumeFromPtm(law, transmuralPressureMmHg);
}

function solveSharedTransmuralPressureOffsetMmHg(
  coldSeedVolumesMl: NodeVolumeRecordV1,
  targetAdditionalVolumeMl: number,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  graph: ReturnType<typeof buildNonCoronaryCirculationGraphV1>,
  baselineTransmuralPressuresMmHg: Readonly<{ SV: number; VC: number }>,
): number {
  const addedVolumeAtOffsetMl = (offsetMmHg: number): number =>
    ADJUSTED_NODES.reduce((sum, nodeName) => sum
      + physicalVolumeAtTransmuralPressureMmHg(
        nodeName,
        baselineTransmuralPressuresMmHg[nodeName] + offsetMmHg,
        runtime,
        graph,
      )
      - coldSeedVolumesMl[nodeName], 0);

  let lowerMmHg = 0;
  let upperMmHg = 1;
  while (addedVolumeAtOffsetMl(upperMmHg) < targetAdditionalVolumeMl) {
    upperMmHg *= 2;
    if (upperMmHg > 256) {
      throw new Error("fixed normal-adult TBV exceeds SV/VC PV-law support");
    }
  }
  for (let iteration = 0; iteration < 96; iteration += 1) {
    const midpointMmHg = 0.5 * (lowerMmHg + upperMmHg);
    if (addedVolumeAtOffsetMl(midpointMmHg) < targetAdditionalVolumeMl) {
      lowerMmHg = midpointMmHg;
    } else {
      upperMmHg = midpointMmHg;
    }
  }
  return 0.5 * (lowerMmHg + upperMmHg);
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

function authoritativeExcludedCoronaryColdSeedVolumeMl(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): number {
  const graph = buildAuthoritativeCirculationGraphV1();
  return NON_CORONARY_CIRCULATION_SCOPE_V1.excludedCoronaryNodes.reduce(
    (sum, nodeName) => {
      const node = graph.nodes[graph.nodeIndex.get(nodeName)!];
      if (node === undefined) {
        throw new Error(`excluded coronary node ${nodeName} is absent from the authoritative graph`);
      }
      return sum + physicalColdSeedVolumeFromNodeV1(node, runtime.vascular);
    },
    0,
  );
}
