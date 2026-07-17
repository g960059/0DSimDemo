import { describe, expect, it } from "vitest";

import {
  assertMainWireNormalAdultBloodVolumePriorMatchesFixedRegistryV1,
  resolveMainWireNormalAdultBloodVolumePriorV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumePriorV1";

describe("main-wire normal-adult blood-volume prior V1", () => {
  it("keeps the control cold seed unchanged", () => {
    const resolved = resolveMainWireNormalAdultBloodVolumePriorV1(
      "cold-seed-control",
    );

    expect(resolved.audit.baselineTotalBloodVolumeMl)
      .toBeCloseTo(4589.457569593876, 9);
    expect(resolved.audit.resolvedTotalBloodVolumeMl)
      .toBe(resolved.audit.baselineTotalBloodVolumeMl);
    expect(resolved.audit.addedBloodVolumeMl).toBe(0);
    expect(resolved.audit.changedNodes).toEqual([]);
    expect(resolved.snapshot.construction.method)
      .toBe("unchanged-cold-seed");
    expect(resolved.snapshot.construction.sharedTransmuralPressureOffsetMmHg)
      .toBe(0);
    expect(resolved.snapshot.claim.parameterSearchApplied).toBe(false);
    expect(resolved.snapshot.claim.physiologicalNormalityClaimed).toBe(false);
    expect(Object.isFrozen(resolved.snapshot)).toBe(true);
    assertMainWireNormalAdultBloodVolumePriorMatchesFixedRegistryV1(
      resolved.snapshot,
    );
  });

  it("adds only the fixed main-wire-derived TBV difference through a shared SV/VC pressure offset", () => {
    const control = resolveMainWireNormalAdultBloodVolumePriorV1(
      "cold-seed-control",
    );
    const challenger = resolveMainWireNormalAdultBloodVolumePriorV1(
      "official-target-minus-excluded-coronary-cold-seed",
    );

    expect(challenger.audit.targetTotalBloodVolumeMl).toBeCloseTo(5522.11, 10);
    expect(challenger.audit.resolvedTotalBloodVolumeMl).toBeCloseTo(5522.11, 8);
    expect(challenger.audit.addedBloodVolumeMl).toBeCloseTo(
      5522.11 - 4589.457569593876,
      8,
    );
    expect(Math.abs(challenger.audit.targetResidualMl)).toBeLessThan(1e-8);
    expect(challenger.audit.changedNodes).toEqual(["SV", "VC"]);
    expect(challenger.audit.unchangedNodeMaximumAbsoluteDeltaMl).toBe(0);
    expect(challenger.audit.chamberVolumesChanged).toBe(false);
    expect(challenger.audit.venousToneChanged).toBe(false);
    expect(challenger.audit.venousPressureLawChanged).toBe(false);
    expect(challenger.snapshot.construction.method)
      .toBe("shared-SV-VC-transmural-pressure-offset");
    expect(challenger.snapshot.construction.sharedTransmuralPressureOffsetMmHg)
      .toBeCloseTo(6.051930745, 8);
    expect(challenger.snapshot.construction.nodeVolumeDeltasMl.SV)
      .toBeCloseTo(695.540461, 6);
    expect(challenger.snapshot.construction.nodeVolumeDeltasMl.VC)
      .toBeCloseTo(237.111969, 6);
    expect(
      challenger.snapshot.construction.resolvedTransmuralPressuresMmHg.SV
        - challenger.snapshot.construction.baselineTransmuralPressuresMmHg.SV,
    ).toBeCloseTo(
      challenger.snapshot.construction.sharedTransmuralPressureOffsetMmHg,
      12,
    );
    expect(
      challenger.snapshot.construction.resolvedTransmuralPressuresMmHg.VC
        - challenger.snapshot.construction.baselineTransmuralPressuresMmHg.VC,
    ).toBeCloseTo(
      challenger.snapshot.construction.sharedTransmuralPressureOffsetMmHg,
      12,
    );
    for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
      expect(challenger.nodeVolumesMl[chamber])
        .toBe(control.nodeVolumesMl[chamber]);
    }
    assertMainWireNormalAdultBloodVolumePriorMatchesFixedRegistryV1(
      challenger.snapshot,
    );
  });

  it("rejects values outside the closed registry and tampered snapshots", () => {
    expect(() => resolveMainWireNormalAdultBloodVolumePriorV1(
      "shape-fit" as never,
    )).toThrow(/unsupported blood-volume prior variant/);

    const resolved = resolveMainWireNormalAdultBloodVolumePriorV1(
      "official-target-minus-excluded-coronary-cold-seed",
    );
    const tampered = {
      ...resolved.snapshot,
      construction: {
        ...resolved.snapshot.construction,
        targetTotalBloodVolumeMl: 5600,
      },
    };
    expect(() =>
      assertMainWireNormalAdultBloodVolumePriorMatchesFixedRegistryV1(
        tampered,
      )).toThrow(/does not match the fixed registry/);
  });
});
