import { describe, expect, it } from "vitest";
import {
  MODELCORE_PAIRED_LAND_SOURCE_PROVIDER_EVIDENCE_ID,
  buildModelCorePairedLandSourceProviderEvidence,
} from "@/tools/myocardium/buildModelCorePairedLandSourceProviderEvidence";
import {
  MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
} from "@/tools/myocardium/modelCoreActiveSourcePressureAdapter";
import {
  MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
  createModelCoreLand2017LvSourceProviderInstrumentation,
  land2017LvSourceOnlyProvider,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";
import {
  validateModelCorePairedLandSourceProvider,
} from "@/tools/myocardium/verifyModelCorePairedLandSourceProvider";

describe("myocardium Phase 5C-L ModelCore paired Land source-provider run", () => {
  it("runs the paired Land experiment and records the outcome without acceptance overclaim", () => {
    const validation = validateModelCorePairedLandSourceProvider();

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.evidence.evidenceId).toBe(MODELCORE_PAIRED_LAND_SOURCE_PROVIDER_EVIDENCE_ID);
    expect(validation.evidence.pairedRunBoundary.legacyProviderId)
      .toBe(MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID);
    expect(validation.evidence.pairedRunBoundary.landProviderId)
      .toBe(MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID);
    expect(validation.evidence.pairedRunBoundary.sourceProviderDifferenceOnly).toBe(true);
    expect(validation.evidence.closureEquivalenceEvidence.stableHashesMatch).toBe(true);
    expect(validation.evidence.legacyPositiveControl.status).toBe("period-2-positive-control-pass");
    expect(validation.evidence.legacyPositiveControl.periodBeats).toBe(2);
    expect(validation.evidence.landRun.status).toBe("finite-period-1");
    expect(validation.evidence.landRun.periodBeats).toBe(1);
    expect(validation.evidence.outcomeInterpretation.outcomeClass).toBe("A");
    expect(validation.evidence.outcomeInterpretation.finalNoAlternansClaim).toBe("not-claimed");
    expect(validation.evidence.outcomeInterpretation.officialMorphologyAcceptance).toBe("not-claimed");
    expect(validation.evidence.routeAssessment.secondOrderReferenceStillRequired).toBe(true);
  });

  it("invokes the Land source, debug, and commit paths with zero Land solver failures", () => {
    const evidence = buildModelCorePairedLandSourceProviderEvidence();
    const instrumentation = evidence.landSourceProviderEvidence.instrumentation;

    expect(evidence.landSourceProviderEvidence.sourceActiveStressPathInvoked).toBe(true);
    expect(evidence.landSourceProviderEvidence.internalDerivativesPathInvoked).toBe(true);
    expect(evidence.landSourceProviderEvidence.debugActiveStressTermsInvoked).toBe(true);
    expect(evidence.landSourceProviderEvidence.commitPathInvoked).toBe(true);
    expect(evidence.landSourceProviderEvidence.landSolverFailureObserved).toBe(false);
    expect(evidence.landSourceProviderEvidence.sourceDebugStressCoherencePass).toBe(true);
    expect(instrumentation.landSolveFailureCount).toBe(0);
    expect(instrumentation.landSolveOkCount).toBeGreaterThan(0);
    expect(instrumentation.maxSourceDebugStressDifferencePa).toBeLessThanOrEqual(1e-9);
  });

  it("keeps the Land provider source-only and ModelCore-stateful", () => {
    const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const provider = land2017LvSourceOnlyProvider(instrumentation);

    expect(provider.sourceProviderId).toBe(MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID);
    expect(typeof provider.sourceActiveStressPa).toBe("function");
    expect(typeof provider.initialProviderState).toBe("function");
    expect(typeof provider.cloneProviderState).toBe("function");
    expect(typeof provider.commitProviderStateAfterStep).toBe("function");
    expect(typeof provider.debugActiveStressTerms).toBe("function");
    expect(provider.pressure).toBeUndefined();
    expect(provider.passivePressure).toBeUndefined();
    expect(provider.debugPressureTerms).toBeUndefined();
  });
});
