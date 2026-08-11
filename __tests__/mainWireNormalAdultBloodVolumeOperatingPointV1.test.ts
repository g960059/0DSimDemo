import { describe, expect, it } from "vitest";

import {
  buildNonCoronaryCirculationGraphV1,
  NON_CORONARY_NODE_NAMES_V1,
  resolveNonCoronaryCirculationColdSeedV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  vascularTransmuralPressureFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1,
  MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1,
  resolveMainWireNormalAdultBloodVolumeOperatingPointV1,
  resolveMainWireNormalAdultBloodVolumeProtocolTargetV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

describe("main-wire normal-adult blood-volume operating point V1", () => {
  it("keeps a compact semantic identity separate from derived construction data", () => {
    expect(MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1).toEqual({
      ownerId: "main-wire-normal-adult-blood-volume-operating-point-v1",
      parameterSetId:
        "main-wire-normal-adult-noncoronary-fixed-tbv-5522p11ml-v1",
      topologyScopeId: "main-wire-noncoronary-15-node-no-coronary-v1",
      fixedTotalBloodVolumeMl: 5522.11,
      initialDistributionPolicyId: "shared-SV-VC-transmural-offset",
    });
    expect(Object.keys(MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1))
      .toEqual([
        "ownerId",
        "parameterSetId",
        "topologyScopeId",
        "fixedTotalBloodVolumeMl",
        "initialDistributionPolicyId",
      ]);
    expect(Object.isFrozen(
      MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1,
    )).toBe(true);
  });

  it("adds the fixed noncoronary difference only through one shared SV/VC pressure offset", () => {
    const runtime = normalAdultMainWireRuntimeV1();
    const runtimeBefore = JSON.stringify(runtime);
    const coldSeed = resolveNonCoronaryCirculationColdSeedV1(runtime);
    const resolved =
      resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
    const graph = buildNonCoronaryCirculationGraphV1();

    expect(JSON.stringify(runtime)).toBe(runtimeBefore);
    expect(resolved.fixedTotalBloodVolumeMl).toBe(5522.11);
    expect(resolved.audit.resolvedTotalBloodVolumeMl).toBeCloseTo(5522.11, 8);
    expect(resolved.audit.coldSeedTotalBloodVolumeMl)
      .toBeCloseTo(4589.457569593876, 9);
    expect(resolved.audit.addedBloodVolumeMl).toBeCloseTo(
      5522.11 - 4589.457569593876,
      8,
    );
    expect(Math.abs(resolved.audit.targetResidualMl)).toBeLessThan(1e-8);
    expect(resolved.audit.changedNodes).toEqual(["SV", "VC"]);
    expect(resolved.audit.unchangedNodeMaximumAbsoluteDeltaMl).toBe(0);
    expect(resolved.audit.sharedTransmuralPressureOffsetMmHg)
      .toBeCloseTo(6.051930745, 8);
    expect(resolved.audit.resolvedTransmuralPressureOffsetsMmHg.SV)
      .toBeCloseTo(resolved.audit.sharedTransmuralPressureOffsetMmHg, 8);
    expect(resolved.audit.resolvedTransmuralPressureOffsetsMmHg.VC)
      .toBeCloseTo(resolved.audit.sharedTransmuralPressureOffsetMmHg, 8);
    expect(resolved.audit.maximumSharedTransmuralPressureOffsetResidualMmHg)
      .toBeLessThan(1e-8);
    expect(resolved.nodeVolumesMl.SV - coldSeed.nodeVolumesMl.SV)
      .toBeCloseTo(695.540461, 6);
    expect(resolved.nodeVolumesMl.VC - coldSeed.nodeVolumesMl.VC)
      .toBeCloseTo(237.111969, 6);

    for (const nodeName of NON_CORONARY_NODE_NAMES_V1) {
      if (nodeName === "SV" || nodeName === "VC") continue;
      expect(resolved.nodeVolumesMl[nodeName])
        .toBe(coldSeed.nodeVolumesMl[nodeName]);
    }
    for (const nodeName of ["SV", "VC"] as const) {
      const node = graph.nodes[graph.nodeIndex.get(nodeName)!]!;
      const resolvedPressure = vascularTransmuralPressureFromPhysicalVolumeV1(
        node,
        resolved.nodeVolumesMl[nodeName],
        runtime.vascular,
        "adaptive-volume-tolerance",
      );
      expect(
        resolvedPressure
          - resolved.audit.baselineTransmuralPressuresMmHg[nodeName],
      ).toBeCloseTo(
        resolved.audit.sharedTransmuralPressureOffsetMmHg,
        8,
      );
    }
    expect(resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime))
      .toEqual(resolved);
  });

  it("records the 77.89 mL excluded coronary ledger without claiming 5600 mL in noncoronary scope", () => {
    const resolved = resolveMainWireNormalAdultBloodVolumeOperatingPointV1(
      normalAdultMainWireRuntimeV1(),
    );

    expect(MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1).toEqual({
      fullGraphReferenceBaselineId: "normal-adult-active-v1",
      fullGraphReferenceTotalBloodVolumeMl: 5600,
      pinnedExcludedCoronaryColdSeedVolumeMl: 77.89,
      nonCoronaryFixedTotalBloodVolumeMl: 5522.11,
    });
    expect(resolved.audit.fullGraphReferenceTotalBloodVolumeMl).toBe(5600);
    expect(resolved.audit.excludedCoronaryColdSeedVolumeMl).toBe(77.89);
    expect(resolved.audit.pinnedExcludedCoronaryColdSeedVolumeMl).toBe(77.89);
    expect(resolved.audit.excludedCoronaryColdSeedResidualMl).toBe(0);
    expect(resolved.audit.fullGraphReferenceReconstructionResidualMl).toBe(0);
    expect(resolved.fixedTotalBloodVolumeMl + 77.89).toBe(5600);
  });

  it("resolves arbitrary protocol-only TBV targets with the same shared SV/VC pressure-offset construction", () => {
    const runtime = normalAdultMainWireRuntimeV1();
    const runtimeBefore = JSON.stringify(runtime);
    const coldSeed = resolveNonCoronaryCirculationColdSeedV1(runtime);
    const targetsMl = [
      4_200 - MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1
        .pinnedExcludedCoronaryColdSeedVolumeMl,
      4_500 - MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1
        .pinnedExcludedCoronaryColdSeedVolumeMl,
      coldSeed.fixedTotalBloodVolumeMl,
      0.9 * MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1
        .fixedTotalBloodVolumeMl,
      1.1 * MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_OPERATING_POINT_V1
        .fixedTotalBloodVolumeMl,
    ];

    for (const targetMl of targetsMl) {
      const resolved = resolveMainWireNormalAdultBloodVolumeProtocolTargetV1(
        runtime,
        targetMl,
      );
      const sumMl = NON_CORONARY_NODE_NAMES_V1.reduce(
        (sum, nodeName) => sum + resolved.nodeVolumesMl[nodeName],
        0,
      );

      expect(resolved.fixedTotalBloodVolumeMl).toBe(targetMl);
      expect(resolved.identity.fixedTotalBloodVolumeMl).toBe(targetMl);
      expect(resolved.identity.parameterSetId).toContain("protocol-fixed-tbv");
      expect(Math.abs(sumMl - targetMl)).toBeLessThan(1e-6);
      expect(Math.abs(
        resolved.audit.resolvedTotalBloodVolumeMl - targetMl,
      )).toBeLessThan(1e-6);
      expect(Math.abs(resolved.audit.targetResidualMl)).toBeLessThan(1e-6);
      expect(resolved.audit.changedNodes).toEqual(["SV", "VC"]);
      expect(resolved.audit.unchangedNodeMaximumAbsoluteDeltaMl).toBe(0);
      expect(resolved.audit.maximumSharedTransmuralPressureOffsetResidualMmHg)
        .toBeLessThan(1e-8);
      for (const nodeName of NON_CORONARY_NODE_NAMES_V1) {
        if (nodeName === "SV" || nodeName === "VC") continue;
        expect(resolved.nodeVolumesMl[nodeName])
          .toBe(coldSeed.nodeVolumesMl[nodeName]);
      }
    }
    const hypovolemic = resolveMainWireNormalAdultBloodVolumeProtocolTargetV1(
      runtime,
      4_200 - MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1
        .pinnedExcludedCoronaryColdSeedVolumeMl,
    );
    expect(hypovolemic.audit.addedBloodVolumeMl).toBeLessThan(0);
    expect(hypovolemic.audit.sharedTransmuralPressureOffsetMmHg).toBeLessThan(0);
    expect(JSON.stringify(runtime)).toBe(runtimeBefore);
  });

  it("rejects non-finite, non-positive, and unsupported protocol TBV targets", () => {
    const runtime = normalAdultMainWireRuntimeV1();
    for (const targetMl of [
      0,
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      1_000,
    ]) {
      expect(() => resolveMainWireNormalAdultBloodVolumeProtocolTargetV1(
        runtime,
        targetMl,
      )).toThrow();
    }
  });
});
