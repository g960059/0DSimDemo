import { describe, expect, it } from "vitest";
import {
  MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_EVIDENCE_ID,
  buildModelCoreActiveSourcePressureAdapterEvidence,
} from "@/tools/myocardium/buildModelCoreActiveSourcePressureAdapterEvidence";
import {
  MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_ID,
  MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID,
} from "@/tools/myocardium/modelCoreActiveSourcePressureAdapter";
import {
  validateModelCoreActiveSourcePressureAdapter,
} from "@/tools/myocardium/verifyModelCoreActiveSourcePressureAdapter";

describe("myocardium Phase 5C-K ModelCore active-source pressure adapter", () => {
  it("validates source-only adapter readiness without satisfying the Land route", () => {
    const validation = validateModelCoreActiveSourcePressureAdapter();

    expect(validation.errors).toEqual([]);
    expect(validation.pass).toBe(true);
    expect(validation.evidence.evidenceId).toBe(MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_EVIDENCE_ID);
    expect(validation.evidence.adapterBoundary.adapterId).toBe(MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_ID);
    expect(validation.evidence.adapterBoundary.sourceOnlyProviderId)
      .toBe(MODELCORE_EXPERIMENTAL_LEGACY_ACTIVE_STRESS_LV_SOURCE_ONLY_PROVIDER_ID);
    expect(validation.evidence.adapterBoundary.sourceProviderScope).toBe("LV-only-legacy-positive-control");
    expect(validation.evidence.adapterBoundary.sourceOnlyProviderHasPressureMethod).toBe(false);
    expect(validation.evidence.adapterBoundary.sourceOnlyProviderHasPassivePressureMethod).toBe(false);
    expect(validation.evidence.adapterBoundary.sourceOnlyProviderHasDebugPressureTermsMethod).toBe(false);
    expect(validation.evidence.adapterBoundary.sourceOnlyProviderHasSourceSpecificDebugActiveStressTerms).toBe(true);
    expect(validation.evidence.adapterBoundary.sourceActiveStressPathInvoked).toBe(true);
    expect(validation.evidence.adapterBoundary.providerObjectMutableSolverStateAllowed).toBe(false);
    expect(validation.evidence.adapterBoundary.mutableSolverStateMustLiveInProviderState).toBe(true);
    expect(validation.evidence.adapterBoundary.instrumentationCountersMayLiveOutsideProviderState).toBe(true);
    expect(validation.evidence.equivalenceEvidence.legacySourceOnlyPressureEquivalent).toBe(true);
    expect(validation.evidence.routeAssessment.routeSatisfactionStatus)
      .toBe("partial-legacy-positive-control-pass-land-pairing-not-run");
    expect(validation.evidence.routeAssessment.sourceProviderDifferenceOnlyStatus)
      .toBe("adapter-ready-land-not-yet-evaluated");
    expect(validation.evidence.routeAssessment.finalNoAlternansClaim).toBe("not-claimed");
  });

  it("reproduces the legacy period-2 branch through a source-only pressure adapter", () => {
    const evidence = buildModelCoreActiveSourcePressureAdapterEvidence();

    expect(evidence.fixedLowPreloadProtocol.baselineTotalBloodVolumeMl).toBe(5600);
    expect(evidence.fixedLowPreloadProtocol.deltaTotalBloodVolumeMl).toBe(-1250);
    expect(evidence.fixedLowPreloadProtocol.effectiveTotalBloodVolumeMl).toBe(4350);
    expect(evidence.fullPressureProviderPositiveControl.status).toBe("period-2-positive-control-pass");
    expect(evidence.sourceOnlyAdapterPositiveControl.status).toBe("period-2-positive-control-pass");
    expect(evidence.sourceOnlyAdapterPositiveControl.settled).toBe(true);
    expect(evidence.sourceOnlyAdapterPositiveControl.periodBeats).toBe(2);
    expect(evidence.sourceOnlyAdapterPositiveControl.adjacentDelta).toBeGreaterThan(0.1);
    expect(evidence.sourceOnlyAdapterPositiveControl.periodDelta).toBeLessThan(0.05);
    expect(evidence.sourceOnlyAdapterPositiveControl.tbvClassification).toBe("clean");
    expect(evidence.sourceOnlyAdapterPositiveControl.tbvSanitizeAbsMl).toBeLessThanOrEqual(0.05);
    expect(evidence.sourceOnlyAdapterPositiveControl.tbvProjectionAppliedMl).toBeLessThanOrEqual(0.05);
    expect(evidence.sourceOnlyAdapterPositiveControl.maxValveReverseMl).toBeLessThanOrEqual(0.05);
    expect(evidence.equivalenceEvidence.stableHashesMatch).toBe(true);
    expect(evidence.equivalenceEvidence.payloadStableHashFullPressure)
      .toBe(evidence.equivalenceEvidence.payloadStableHashSourceOnly);
    expect(evidence.equivalenceEvidence.maxAbsNumericDifference)
      .toBeLessThanOrEqual(evidence.equivalenceEvidence.tolerance);
    expect(evidence.hookInvocationEvidence.fullPressureInvocationCounts.pressure).toBeGreaterThan(0);
    expect(evidence.hookInvocationEvidence.sourceOnlyInvocationCounts.sourceActiveStressPa).toBeGreaterThan(0);
    expect(evidence.hookInvocationEvidence.sourceOnlyInvocationCounts.internalDerivatives).toBeGreaterThan(0);
  });
});
