import { describe, expect, it } from "vitest";

import dt1 from "@/data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/periodic-summary-dt1ms.json";
import dt2 from "@/data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/periodic-summary-dt2ms.json";
import dt4 from "@/data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/periodic-summary-dt4ms.json";
import dt2ToDt1 from "@/data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/dt2ms-to-dt1ms.json";
import dt4ToDt2 from "@/data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/dt4ms-to-dt2ms.json";
import effusion from "@/data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/periodic-summary-effusion-dt4ms.json";
import globalCapacity from "@/data/myocardium/verification/mainwire-full-land-membrane-pericardium-v1/periodic-summary-global-capacity-dt4ms.json";

const HEALTHY_REFERENCE_HEART_VOLUME_M3 = 0.000600126543;

describe("main-wire membrane-TriSeg common-pericardium evidence V1", () => {
  it("commits only current period-1 identities and the phase-consistent reference", () => {
    for (const summary of [dt4, dt2, dt1, effusion, globalCapacity]) {
      expect(summary.source.terminationReason).toBe("period1-converged");
      expect(summary.convergence.periodicSteadyStateClaimed).toBe(true);
      expect(summary.protocol.identity.commonPericardium.bindingSnapshot
        .parameters.prescribedPressureOffsetPa).toBe(0);
      expect(JSON.stringify(summary)).not.toContain("effusionPressurePa");
      expect(JSON.stringify(summary)).not.toContain("constriction-vh0");
    }
    for (const summary of [dt4, dt2, dt1, effusion]) {
      expect(summary.protocol.identity.commonPericardium.bindingSnapshot
        .parameters.referenceHeartVolumeM3)
        .toBe(HEALTHY_REFERENCE_HEART_VOLUME_M3);
    }
    expect(globalCapacity.protocol.identity.commonPericardium.bindingSnapshot
      .parameters.referenceHeartVolumeM3).toBe(0.00043);
    expect(effusion.protocol.identity.commonPericardium.bindingSnapshot
      .prescribedPericardialFluidVolumeM3).toBe(0.0003);
  });

  it("keeps healthy slack and makes both fixed mechanism controls engage", () => {
    for (const summary of [dt4, dt2, dt1]) {
      expect(summary.ranges.commonPericardium.excessPressureMmHg)
        .toEqual({ minimum: 0, maximum: 0 });
      expect(summary.ranges.commonPericardium.elasticConstraintEngagedSampleCount)
        .toBe(0);
    }
    expect(globalCapacity.ranges.commonPericardium.excessPressureMmHg.maximum)
      .toBeGreaterThan(0);
    expect(effusion.ranges.commonPericardium.excessPressureMmHg.minimum)
      .toBeGreaterThan(0);
    expect(effusion.ranges.commonPericardium.totalOccupiedVolumeMl.minimum
      - effusion.ranges.commonPericardium.heartVolumeMl.minimum)
      .toBeCloseTo(300, 9);
    expect(effusion.hemodynamics.netAorticCardiacOutputLPerMin)
      .toBeLessThan(dt4.hemodynamics.netAorticCardiacOutputLPerMin);
  });

  it("retains interpretable no-interpolation dt-halving readbacks", () => {
    for (const comparison of [dt4ToDt2, dt2ToDt1]) {
      expect(comparison.interpretable).toBe(true);
      expect(comparison.claim).toMatchObject({
        comparisonKind: "dt-halving-difference-not-convergence-order",
        interpolationApplied: false,
        parameterSearch: false,
      });
    }
  });
});
