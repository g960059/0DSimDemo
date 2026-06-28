import { describe, expect, it } from "vitest";
import {
  MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID,
  buildModelCoreEquivalentPositiveControlClosureEvidence,
} from "@/tools/myocardium/buildModelCoreEquivalentPositiveControlClosureEvidence";
import {
  validateModelCoreEquivalentPositiveControlClosure,
} from "@/tools/myocardium/verifyModelCoreEquivalentPositiveControlClosure";

describe("myocardium Phase 5C-I ModelCore-equivalent positive-control closure", () => {
  it("validates owner-approved experimental source-provider evidence without satisfying the route", () => {
    const validation = validateModelCoreEquivalentPositiveControlClosure();

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.evidence.sourceProviderIds.LV)
      .toBe(MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID);
    expect(validation.evidence.productionRuntimeStatus).toBe("not-production-runtime-replacement");
    expect(validation.evidence.hookInvocationEvidence.initialStatePathInvoked).toBe(true);
    expect(validation.evidence.hookInvocationEvidence.pressurePathInvoked).toBe(true);
    expect(validation.evidence.hookInvocationEvidence.derivativePathInvoked).toBe(true);
    expect(validation.evidence.routeAssessment.routeSatisfactionStatus)
      .toBe("partial-legacy-positive-control-pass-land-pairing-not-run");
    expect(validation.evidence.routeAssessment.sourceProviderDifferenceOnlyStatus)
      .toBe("not-yet-evaluated");
    expect(validation.evidence.routeAssessment.finalNoAlternansClaim).toBe("not-claimed");
  });

  it("reproduces the pinned low-preload period-2 positive control through the ModelCore source-provider hook", () => {
    const evidence = buildModelCoreEquivalentPositiveControlClosureEvidence();

    expect(evidence.fixedLowPreloadProtocol.baselineTotalBloodVolumeMl).toBe(5600);
    expect(evidence.fixedLowPreloadProtocol.deltaTotalBloodVolumeMl).toBe(-1250);
    expect(evidence.fixedLowPreloadProtocol.effectiveTotalBloodVolumeMl).toBe(4350);
    expect(evidence.legacyPositiveControl.status).toBe("period-2-positive-control-pass");
    expect(evidence.legacyPositiveControl.settled).toBe(true);
    expect(evidence.legacyPositiveControl.periodBeats).toBe(2);
    expect(evidence.legacyPositiveControl.adjacentDelta).toBeGreaterThan(0.1);
    expect(evidence.legacyPositiveControl.periodDelta).toBeLessThan(0.05);
    expect(evidence.legacyPositiveControl.tbvClassification).toBe("clean");
    expect(evidence.legacyPositiveControl.tbvSanitizeAbsMl).toBeLessThanOrEqual(0.05);
    expect(evidence.legacyPositiveControl.tbvProjectionAppliedMl).toBeLessThanOrEqual(0.05);
    expect(evidence.legacyPositiveControl.maxValveReverseMl).toBeLessThanOrEqual(0.05);
    expect(evidence.legacyPositiveControl.stableHash).toMatch(/^[0-9a-f]{8}$/);
    expect(evidence.hookInvocationEvidence.totalInvocations).toBeGreaterThan(0);
    expect(evidence.hookInvocationEvidence.invocationCounts.initialInternal).toBeGreaterThan(0);
    expect(evidence.hookInvocationEvidence.invocationCounts.pressure).toBeGreaterThan(0);
    expect(evidence.hookInvocationEvidence.invocationCounts.internalDerivatives).toBeGreaterThan(0);
  });
});
