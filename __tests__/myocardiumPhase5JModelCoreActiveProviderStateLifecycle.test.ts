import { describe, expect, it } from "vitest";
import {
  MODELCORE_ACTIVE_PROVIDER_STATE_LIFECYCLE_EVIDENCE_ID,
  MODELCORE_TEST_STATEFUL_ACTIVE_PROVIDER_ID,
  buildModelCoreActiveProviderStateLifecycleEvidence,
} from "@/tools/myocardium/buildModelCoreActiveProviderStateLifecycleEvidence";
import {
  validateModelCoreActiveProviderStateLifecycle,
} from "@/tools/myocardium/verifyModelCoreActiveProviderStateLifecycle";

describe("myocardium Phase 5C-J ModelCore active-provider state lifecycle", () => {
  it("validates the experimental lifecycle precondition without satisfying the Land route", () => {
    const validation = validateModelCoreActiveProviderStateLifecycle();

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.evidence.evidenceId).toBe(MODELCORE_ACTIVE_PROVIDER_STATE_LIFECYCLE_EVIDENCE_ID);
    expect(validation.evidence.statefulProviderId).toBe(MODELCORE_TEST_STATEFUL_ACTIVE_PROVIDER_ID);
    expect(validation.evidence.productionRuntimeStatus).toBe("not-production-runtime-replacement");
    expect(validation.evidence.lifecycleEvidence.oneCommitPerStepObserved).toBe(true);
    expect(validation.evidence.lifecycleEvidence.providerStateCloneOnCallObserved).toBe(true);
    expect(validation.evidence.lifecycleEvidence.readOnlyCloneLeakObserved).toBe(false);
    expect(validation.evidence.lifecycleEvidence.publicUnpackProviderStateResetObserved).toBe(true);
    expect(validation.evidence.routeAssessment.routeSatisfactionStatus)
      .toBe("partial-legacy-positive-control-pass-land-pairing-not-run");
    expect(validation.evidence.routeAssessment.sourceProviderDifferenceOnlyStatus)
      .toBe("not-yet-evaluated");
    expect(validation.evidence.routeAssessment.finalNoAlternansClaim).toBe("not-claimed");
  });

  it("emits stable live evidence for provider-state isolation", () => {
    const evidence = buildModelCoreActiveProviderStateLifecycleEvidence();

    expect(evidence.lifecycleEvidence.initialStateVersion).toBe(0);
    expect(evidence.lifecycleEvidence.afterOneStepStateVersion).toBe(1);
    expect(evidence.lifecycleEvidence.afterOneStepCommitCount).toBe(1);
    expect(evidence.lifecycleEvidence.afterOneStepPressureMutationCount).toBe(0);
    expect(evidence.lifecycleEvidence.readOnlyCloneParentStateVersionAfter)
      .toBe(evidence.lifecycleEvidence.readOnlyCloneParentStateVersionBefore);
    expect(evidence.lifecycleEvidence.publicUnpackAfterResetStateVersion).toBe(0);
    expect(evidence.lifecycleEvidence.publicUnpackAfterResetCommitCount).toBe(0);
    expect(evidence.lifecycleEvidence.sampleCount).toBeGreaterThan(0);
    expect(evidence.lifecycleEvidence.stableHash).toMatch(/^[0-9a-f]{8}$/);
  });
});
