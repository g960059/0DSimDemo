import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_STANDARD66_VALIDATION_ARM_CLAIM_V1,
  MAIN_WIRE_STANDARD66_VALIDATION_COMPARISON_COHORT_V1_ID,
  mainWireStandard66ValidationArmTimestepComparisonInputV1,
  runMainWireStandard66ValidationArmV1,
} from "@/analysis/runtime/MainWireStandard66ValidationArmRunnerV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

describe("Standard66 integrated single-arm validation runner V1", () => {
  it("runs a real bounded smoke without manufacturing settlement, confirmation, or terminal outcomes", async () => {
    const result = await runMainWireStandard66ValidationArmV1({
      clockArmId: "dt-2ms-production",
      executionPurpose: "bounded-smoke",
      boundedSmokeHorizonSec: 0.01,
    });

    expect(result.status).toBe("bounded-smoke-complete");
    expect(result.executionPurpose).toBe("bounded-smoke");
    expect(result.modeEligibility).toEqual({
      testOnlyBoundedSmoke: true,
      eligibleForPreregisteredSingleArmMeasurement: false,
    });
    expect(result.settlement).toMatchObject({
      executionPurpose: "bounded-smoke",
      status: "bounded-smoke-complete",
      numericalPeriod1Established: false,
      terminalAcceptedTimeSec: 0.01,
      failure: null,
    });
    expect(result.confirmation).toBeNull();
    expect(result.outcomes).toBeNull();
    expect(result.failure).toBeNull();

    expect(result.configuredAorticValveAreaBinding).toEqual({
      source:
        "private-brand-live-session-construction.mechanismResearchInputs.valveAreas.AoV.maximumForwardEoaCm2",
      maximumForwardEoaCm2: 3.5,
    });
    expect(result.protocolIdentity.outcomePolicy).toEqual({
      terminalOutcomesRequireSettlingStatus: "period1-settled",
      terminalOutcomesRequireFreshConfirmationStatus: "period1-confirmed",
      boundedSmokeCanProduceTerminalOutcomes: false,
      partialTerminalOutcomesReturnedAfterAnalysisFailure: false,
    });
    expect(result.comparisonCohortIdentity).toMatchObject({
      identityId: MAIN_WIRE_STANDARD66_VALIDATION_COMPARISON_COHORT_V1_ID,
      preregistrationId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
      comparisonProtocol: {
        flowEventTimingMethodId:
          "main-wire-left-ventricular-flow-event-timing-v1",
        primaryPressureRateConfigurationIdentity:
          "main-wire-left-ventricular-absolute-pressure-central-secant-piecewise-linear-v1;windowSec=0.01",
      },
      excludedFromIdentity: [
        "clock-arm",
        "requested-step",
        "execution-purpose",
        "numerical-outcome",
      ],
    });
    expect(result.protocolIdentity.comparisonCohortIdentityHash).toBe(
      result.comparisonCohortIdentityHash,
    );
    expect(result.protocolIdentity.comparisonProtocolIdentityHash).toBe(
      result.comparisonProtocolIdentityHash,
    );
    expect(await sha256CanonicalJsonHex(result.protocolIdentity)).toBe(
      result.protocolIdentityHash,
    );
    expect(await sha256CanonicalJsonHex(result.comparisonCohortIdentity)).toBe(
      result.comparisonCohortIdentityHash,
    );
    expect(
      await sha256CanonicalJsonHex(
        result.comparisonCohortIdentity.comparisonProtocol,
      ),
    ).toBe(result.comparisonProtocolIdentityHash);
    expect(
      await sha256CanonicalJsonHex(result.protocolIdentity.exactConstruction),
    ).toBe(result.constructionIdentityHash);
    expect(result.claim).toBe(MAIN_WIRE_STANDARD66_VALIDATION_ARM_CLAIM_V1);
    expect(result.claim).toMatchObject({
      singleArmEstablishesNumericalResolutionValidation: false,
      physiologicalAcceptanceEstablished: false,
      independentValidationEstablished: false,
      releaseAcceptanceEstablished: false,
      causalAttributionClaimed: false,
      clinicalMeasurementEquivalenceClaimed: false,
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('"acceptedState"');
    expect(serialized).not.toContain('"endpoints"');
    expect(serialized).not.toContain('"session"');

    expect(
      mainWireStandard66ValidationArmTimestepComparisonInputV1(result),
    ).toMatchObject({
      armId: "dt-2ms-production",
      requestedStepSec: 0.002,
      executionPurpose: "bounded-smoke",
      compatibility: {
        preregistrationId:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
        comparisonProtocolIdentity: result.comparisonProtocolIdentityHash,
        comparisonCohortIdentity: result.comparisonCohortIdentityHash,
      },
      period1Settlement: {
        status: "unavailable",
        reason: "settling:bounded-smoke-complete",
      },
      freshPeriod1Confirmation: {
        status: "unavailable",
        reason: "confirmation:not-run",
      },
      terminalMeasurements: {
        status: "unavailable",
        reason: "terminal:bounded-smoke-complete",
      },
    });
  }, 120_000);

  it("keeps bounded-smoke and preregistered horizon controls disjoint", async () => {
    await expect(
      runMainWireStandard66ValidationArmV1({
        clockArmId: "dt-2ms-production",
        executionPurpose: "bounded-smoke",
      }),
    ).rejects.toThrow(/requires a positive finite horizon/);
    await expect(
      runMainWireStandard66ValidationArmV1({
        clockArmId: "dt-2ms-production",
        executionPurpose: "preregistered-validation",
        boundedSmokeHorizonSec: 0.01,
      }),
    ).rejects.toThrow(/cannot override settling horizons/);
  });
});
