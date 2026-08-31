import { describe, expect, it } from "vitest";

import {
  buildMainWireStandard66SettlingEvaluationHorizonsV1,
  confirmMainWireStandard66P1OnLiveSessionV1,
  nextMainWireStandard66ConsecutiveP1CountV1,
  resolveMainWireStandard66AnchoredAdvanceTargetV1,
  runMainWireStandard66P1SettlingV1,
  runMainWireStandard66P1SettlingOnLiveSessionV1,
} from "@/analysis/runtime/MainWireStandard66P1SettlingRunnerV1";
import { createMainWireStandard66SelectedTraceLiveSessionV1 } from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";

describe("Standard66 full accepted-state P1 settling runner V1", () => {
  it("constructs the preregistered horizons with the explicit 250 s clamp", () => {
    expect(buildMainWireStandard66SettlingEvaluationHorizonsV1()).toEqual([
      48, 73, 98, 123, 148, 173, 198, 223, 248, 250,
    ]);
  });

  it.each([0.002, 0.001, 0.0005] as const)(
    "inserts a coronary event into the %s s grid without resetting its phase",
    (requestedStepSec) => {
      const windowTimeSec = 2 / 3;
      const priorOrdinal = Math.floor(windowTimeSec / requestedStepSec);
      const priorGridTimeSec = priorOrdinal * requestedStepSec;
      expect(priorGridTimeSec).toBeLessThan(windowTimeSec);

      const event = resolveMainWireStandard66AnchoredAdvanceTargetV1({
        currentTimeSec: priorGridTimeSec,
        requestedGridOriginSec: 0,
        requestedStepSec,
        nextRequestedBoundaryOrdinal: priorOrdinal + 1,
        nextCoronaryWindowBoundaryTimeSec: windowTimeSec,
        nextEvaluationHorizonSec: 48,
      });
      expect(event).toMatchObject({
        targetTimeSec: windowTimeSec,
        landsOnRequestedGrid: false,
        landsOnCoronaryWindowBoundary: true,
        landsOnEvaluationHorizon: false,
      });

      const afterEvent = resolveMainWireStandard66AnchoredAdvanceTargetV1({
        currentTimeSec: windowTimeSec,
        requestedGridOriginSec: 0,
        requestedStepSec,
        nextRequestedBoundaryOrdinal: priorOrdinal + 1,
        nextCoronaryWindowBoundaryTimeSec: 4 / 3,
        nextEvaluationHorizonSec: 48,
      });
      expect(afterEvent.targetTimeSec).toBe(
        (priorOrdinal + 1) * requestedStepSec,
      );
      expect(afterEvent).toMatchObject({
        landsOnRequestedGrid: true,
        landsOnCoronaryWindowBoundary: false,
        landsOnEvaluationHorizon: false,
      });
    },
  );

  it("counts only a consecutive P1 suffix and resets immediately on failure", () => {
    let count = 0;
    for (const passed of [true, true, false, true, true, true]) {
      count = nextMainWireStandard66ConsecutiveP1CountV1(count, passed);
    }
    expect(count).toBe(3);
    expect(nextMainWireStandard66ConsecutiveP1CountV1(count, false)).toBe(0);
    expect(() => nextMainWireStandard66ConsecutiveP1CountV1(-1, true)).toThrow(
      /count is invalid/,
    );
  });

  it("compares the actual Standard66 full state only at an empty nT window boundary", async () => {
    const liveSession =
      await createMainWireStandard66SelectedTraceLiveSessionV1();
    const result = await runMainWireStandard66P1SettlingOnLiveSessionV1({
      liveSession,
      clockArmId: "dt-2ms-production",
      executionPurpose: "bounded-smoke",
      boundedSmokeHorizonSec: 1,
    });

    expect(result.status).toBe("bounded-smoke-complete");
    expect(result.protocolIdentityHash).toMatch(/^[0-9a-f]{64}$/);
    expect(await sha256CanonicalJsonHex(result.protocolIdentity)).toBe(
      result.protocolIdentityHash,
    );
    expect(result.protocolIdentity).toMatchObject({
      executionPurpose: "bounded-smoke",
      clock: {
        armId: "dt-2ms-production",
        requestedStepSec: 0.002,
        requestedGridOriginSec: 0,
      },
      evaluationHorizonsSec: [1],
      exactConstruction: {
        ventricularContractilityScale: 1,
        hemodynamicResearchInputs:
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      },
    });
    expect(result.failure).toBeNull();
    expect(result.terminalAcceptedTimeSec).toBeCloseTo(1, 14);
    expect(result.counters.completedCoronaryWindowCount).toBe(1);
    expect(result.counters.completedPeriod1ComparisonCount).toBe(1);
    expect(result.counters.requestedGridLandingCount).toBe(500);
    expect(result.counters.eventClippedAcceptedCommitCount).toBeGreaterThan(0);
    expect(result.retainedWindowBoundaries).toHaveLength(2);
    expect(result.retainedPeriod1Observations).toHaveLength(1);
    expect(result.retainedWindowBoundaries.at(-1)).toMatchObject({
      windowIndex: 1,
      acceptedTimeSec: 1,
    });
    expect(result.retainedPeriod1Observations[0]?.period1.gates).toEqual({
      ownerClocksAndRevisionsValid: true,
      modelConfigurationsExact: true,
      regularSinusLineageAdvancesByPeriodLag: true,
      captureAvDistalBackupAndIntervalCountersAdvanceByPeriodLag: true,
      withinStateVentricularLineageExact: true,
      pendingQueuesCompletelyPaired: true,
      dynamicMcsAllOffAndZero: true,
      coronaryV3CompatibilityAndEmptyWindowsSatisfied: true,
    });
    expect(result.horizons.evaluated[0]).toMatchObject({
      horizonSec: 1,
      latestWindowIndex: 1,
      preregisteredPeriod1EstablishedAtThisHorizon: false,
    });
    expect(result.numericalPeriod1Established).toBe(false);
    expect(result.physiologicalAcceptanceEstablished).toBe(false);
    expect(result.independentValidationEstablished).toBe(false);
    expect(result.releaseAcceptanceEstablished).toBe(false);
    expect(liveSession.session.currentAcceptedState()).toMatchObject({
      acceptedTimeSec: result.terminalAcceptedTimeSec,
      revision: result.terminalAcceptedRevision,
    });
    await expect(
      runMainWireStandard66P1SettlingOnLiveSessionV1({
        liveSession,
        clockArmId: "dt-2ms-production",
        executionPurpose: "bounded-smoke",
        boundedSmokeHorizonSec: 1,
      }),
    ).rejects.toThrow(/unadvanced cold window-zero state/);
  }, 120_000);

  it.each([
    [50, 7.202],
    [90, 4.002],
  ] as const)(
    "keeps six consecutive HR %s cycle boundaries structurally empty",
    async (heartRateBpm, boundedSmokeHorizonSec) => {
      const liveSession =
        await createMainWireStandard66SelectedTraceLiveSessionV1({
          hemodynamicResearchInputs: Object.freeze({
            ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
            heartRateBpm,
          }),
        });
      const result = await runMainWireStandard66P1SettlingOnLiveSessionV1({
        liveSession,
        clockArmId: "dt-2ms-production",
        executionPurpose: "bounded-smoke",
        boundedSmokeHorizonSec,
      });

      expect(result.status).toBe("bounded-smoke-complete");
      expect(result.failure).toBeNull();
      expect(result.counters.completedCoronaryWindowCount).toBe(6);
      expect(
        result.retainedWindowBoundaries.at(-1)?.acceptedState.composedRhythm,
      ).toMatchObject({
        acceptedAtrialCaptureCount: 6,
        acceptedVentricularCaptureCount: 6,
        deliveredCalciumDepositCount: 12,
        pendingCalciumDeposits: [],
      });
    },
    120_000,
  );

  it.each([
    ["dt-2ms-production", 0.002],
    ["dt-1ms-intermediate", 0.001],
    ["dt-0p5ms-reference", 0.0005],
  ] as const)(
    "keeps the %s split-at-window path checkpoint-identical to the ordinary anchored grid",
    async (clockArmId, requestedStepSec) => {
      const hemodynamicResearchInputs = Object.freeze({
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
        heartRateBpm: 90,
      });
      const split = await createMainWireStandard66SelectedTraceLiveSessionV1({
        hemodynamicResearchInputs,
      });
      const ordinary = await createMainWireStandard66SelectedTraceLiveSessionV1(
        {
          hemodynamicResearchInputs,
        },
      );
      const commonEndpointSec = 1.34;
      const splitResult = await runMainWireStandard66P1SettlingOnLiveSessionV1({
        liveSession: split,
        clockArmId,
        executionPurpose: "bounded-smoke",
        boundedSmokeHorizonSec: commonEndpointSec,
      });
      expect(splitResult.status).toBe("bounded-smoke-complete");
      expect(splitResult.protocolIdentityHash).toMatch(/^[0-9a-f]{64}$/);
      expect(splitResult.protocolIdentity).toMatchObject({
        clock: { armId: clockArmId, requestedStepSec },
        exactConstruction: {
          hemodynamicResearchInputs: { heartRateBpm: 90 },
        },
      });
      expect(splitResult.failure).toBeNull();
      expect(splitResult.counters.completedCoronaryWindowCount).toBe(2);
      expect(
        splitResult.retainedWindowBoundaries.at(-1)?.acceptedTimeSec,
      ).toBeCloseTo(4 / 3, 14);
      expect(
        splitResult.retainedWindowBoundaries.at(-1)?.acceptedState
          .composedRhythm,
      ).toMatchObject({
        acceptedAtrialCaptureCount: 2,
        acceptedVentricularCaptureCount: 2,
        deliveredCalciumDepositCount: 4,
        pendingCalciumDeposits: [],
      });

      const requestedBoundaryCount = Math.round(
        commonEndpointSec / requestedStepSec,
      );
      expect(requestedBoundaryCount * requestedStepSec).toBeCloseTo(
        commonEndpointSec,
        14,
      );
      for (let ordinal = 1; ordinal <= requestedBoundaryCount; ordinal += 1) {
        const advanced =
          ordinary.session.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
            ordinal * requestedStepSec,
            Object.freeze([]),
          ).advance;
        expect(advanced.status).toBe("advanced");
      }

      expect(split.session.currentAcceptedState()).toEqual(
        ordinary.session.currentAcceptedState(),
      );
      expect(
        await split.session.checkpointStandard66CanonicalBinaryV3(),
      ).toEqual(await ordinary.session.checkpointStandard66CanonicalBinaryV3());
    },
    120_000,
  );

  it("rejects a public-field copy that lacks the private production-route brand", async () => {
    const liveSession =
      await createMainWireStandard66SelectedTraceLiveSessionV1();
    const forged = {
      routeIdentity: liveSession.routeIdentity,
      construction: liveSession.construction,
      session: liveSession.session,
    } as typeof liveSession;
    await expect(
      runMainWireStandard66P1SettlingOnLiveSessionV1({
        liveSession: forged,
        clockArmId: "dt-2ms-production",
        executionPurpose: "bounded-smoke",
        boundedSmokeHorizonSec: 0.01,
      }),
    ).rejects.toThrow(/privately branded production-route/);
  });

  it("rejects a public settled-result forgery that lacks same-session settling provenance", async () => {
    const liveSession =
      await createMainWireStandard66SelectedTraceLiveSessionV1();
    const smoke = await runMainWireStandard66P1SettlingOnLiveSessionV1({
      liveSession,
      clockArmId: "dt-2ms-production",
      executionPurpose: "bounded-smoke",
      boundedSmokeHorizonSec: 0.01,
    });
    const forged = Object.freeze({
      ...smoke,
      executionPurpose: "preregistered-settling" as const,
      status: "period1-settled" as const,
      numericalPeriod1Established: true,
    });

    await expect(
      confirmMainWireStandard66P1OnLiveSessionV1({
        liveSession,
        settled: forged,
      }),
    ).rejects.toThrow(/not privately bound to this live Session/);
  });

  it("fails closed when a smoke override is missing or enters the preregistered lane", async () => {
    await expect(
      runMainWireStandard66P1SettlingV1({
        clockArmId: "dt-2ms-production",
        executionPurpose: "bounded-smoke",
      }),
    ).rejects.toThrow(/bounded-smoke horizon is invalid/);
    await expect(
      runMainWireStandard66P1SettlingV1({
        clockArmId: "dt-2ms-production",
        boundedSmokeHorizonSec: 1,
      }),
    ).rejects.toThrow(/cannot override its horizons/);
    await expect(
      runMainWireStandard66P1SettlingV1({
        clockArmId: "dt-2ms-production",
        executionPurpose: "research-eager",
        boundedSmokeHorizonSec: 1,
      }),
    ).rejects.toThrow(/cannot override its maximum horizon/);
  });
});
