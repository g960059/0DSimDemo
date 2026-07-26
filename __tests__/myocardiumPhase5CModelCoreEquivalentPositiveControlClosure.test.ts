import { describe, expect, it } from "vitest";
import {
  MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_PROVIDER_ID,
  buildModelCoreEquivalentPositiveControlClosureEvidence,
} from "@/tools/myocardium/buildModelCoreEquivalentPositiveControlClosureEvidence";
import {
  validateModelCoreEquivalentPositiveControlClosure,
} from "@/tools/myocardium/verifyModelCoreEquivalentPositiveControlClosure";

describe("myocardium Phase 5C-I ModelCore-equivalent positive-control closure", () => {
  it("validates owner-approved experimental source-provider prerequisite evidence", () => {
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
    // Where the legacy positive control actually sits, not just that it
    // alternates. The bounds above (adjacentDelta > 0.1, periodDelta < 0.05)
    // admit a wide band; these pin the measured operating point so a drift that
    // stays inside the band still fails.
    //
    // Pinned as physical values with float headroom rather than as the
    // stableHash literal. That hash is taken over vlvTrace — ~1150 raw
    // per-sample doubles rounded to 1e-12 absolute, in a period-2 alternans
    // regime — so one last-bit difference flips it entirely. The retired
    // Phase 5C-G audit reached the same conclusion and deliberately
    // shape-checked generated trajectory hashes instead of pinning them,
    // recording them as "audit context, not cross-platform acceptance pins".
    expect(evidence.legacyPositiveControl.adjacentDelta).toBeCloseTo(0.5745, 3);
    expect(evidence.legacyPositiveControl.periodDelta).toBeCloseTo(0.00789, 4);
    expect(evidence.legacyPositiveControl.stableHash).toMatch(/^[0-9a-f]{8}$/);
    expect(evidence.hookInvocationEvidence.totalInvocations).toBeGreaterThan(0);
    expect(evidence.hookInvocationEvidence.invocationCounts.initialInternal).toBeGreaterThan(0);
    expect(evidence.hookInvocationEvidence.invocationCounts.pressure).toBeGreaterThan(0);
    expect(evidence.hookInvocationEvidence.invocationCounts.internalDerivatives).toBeGreaterThan(0);
  });
});
