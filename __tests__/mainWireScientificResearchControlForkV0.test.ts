import { describe, expect, it } from "vitest";

import {
  createMainWireScientificResearchControlBaselineTargetStateV0,
  createMainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import {
  MainWireScientificSessionV1,
  type MainWireScientificResearchControlForkExpectedSourceIdentityV0,
} from "@/engine/scientific/runtime/MainWireScientificSessionV1";

describe("main-wire ScientificSession research-control fork V0", () => {
  it("clones the exact accepted state, replaces only resistance, and resets only the target tracker", async () => {
    const source = await MainWireScientificSessionV1.createCanonical();
    const initialTransient = source.runTransient({
      dtSec: 0.002,
      stepCount: 4,
    });
    expect(initialTransient.completed).toBe(true);
    const sourceSettlement = source.settlePeriodic();
    expect(sourceSettlement).toMatchObject({
      completed: true,
      trackerStartedThisCall: true,
      beatCompletedThisCall: true,
      completedBeatCount: 1,
    });

    const baseline =
      await createMainWireScientificResearchControlBaselineTargetStateV0();
    const target = await createMainWireScientificResearchControlTargetStateV0({
      "circulation.systemic-vascular-resistance-scale": 1.3333333333333333,
      "circulation.pulmonary-vascular-resistance-scale": 0.75,
    });
    const sourceIdentity = expectedIdentity(source, baseline.targetStateSha256, 0);
    const sourceCheckpointBefore = await source.checkpointExact();
    const sourceObservationBefore = source.observe();

    const forked = await source.forkResearchControlTargetV0({
      sourceControlState: baseline,
      targetControlState: target,
      expectedSourceIdentity: sourceIdentity,
    });

    expect(await source.checkpointExact()).toEqual(sourceCheckpointBefore);
    expect(source.observe()).toBe(sourceObservationBefore);
    expect(source.stateIdentity()).toEqual(forked.targetSession.stateIdentity());
    expect(forked.targetSession.observe()).toMatchObject({
      source: "research-control-state-fork",
      revision: sourceIdentity.revision,
      acceptedTimeSec: sourceIdentity.acceptedTimeSec,
      chamber: {
        LA: { volumeMl: sourceObservationBefore.chamber.LA.volumeMl },
        LV: { volumeMl: sourceObservationBefore.chamber.LV.volumeMl },
        RA: { volumeMl: sourceObservationBefore.chamber.RA.volumeMl },
        RV: { volumeMl: sourceObservationBefore.chamber.RV.volumeMl },
      },
    });
    expect(forked.receipt).toMatchObject({
      source: sourceIdentity,
      target: {
        revision: sourceIdentity.revision,
        acceptedTimeSec: sourceIdentity.acceptedTimeSec,
        totalBloodVolumeMl: sourceIdentity.totalBloodVolumeMl,
        parameterEpoch: 1,
        controlStateSha256: target.targetStateSha256,
      },
      resolvedRuntimeLosses: {
        systemicResistance: 1.3333333333333333,
        pulmonaryResistance: 0.46875,
      },
      transition: {
        transitionCompatibilityFingerprintPreserved: true,
        transitionCompatibilityFingerprintSemantics:
          "transition-compatibility-only-non-authoritative",
        canonicalTransactionCheckpointPreserved: true,
        sourceSessionUnchanged: true,
        periodicSettlementTrackerResetInTargetOnly: true,
      },
    });
    expect(forked.receipt.transition.targetTransitionCompatibilityFingerprint)
      .toBe(
        forked.receipt.transition.sourceTransitionCompatibilityFingerprint,
      );
    expect(forked.receipt.transition.sourceTransitionCompatibilityFingerprint)
      .toBe(sourceCheckpointBefore.transaction.checkpointFingerprint);
    await expect(forked.targetSession.checkpointExact()).rejects.toThrow(
      /control-state-aware checkpoint schema/,
    );
    await expect(
      forked.targetSession.checkpointLegacyCanonicalExactV2(),
    ).rejects.toThrow(/control-state-aware checkpoint schema/);

    const targetSettlement = forked.targetSession.settlePeriodic();
    expect(targetSettlement).toMatchObject({
      completed: true,
      trackerStartedThisCall: true,
      beatCompletedThisCall: true,
      completedBeatCount: 1,
    });
    const continuedSourceSettlement = source.settlePeriodic();
    expect(continuedSourceSettlement).toMatchObject({
      completed: true,
      trackerStartedThisCall: false,
      beatCompletedThisCall: true,
      completedBeatCount: 2,
    });
  }, 120_000);

  it("fails closed on stale CAS/digest/runtime identity and supports a valid chained fork", async () => {
    const source = await MainWireScientificSessionV1.createCanonical();
    const baseline =
      await createMainWireScientificResearchControlBaselineTargetStateV0();
    const highSystemic =
      await createMainWireScientificResearchControlTargetStateV0({
        "circulation.systemic-vascular-resistance-scale": 1.3333333333333333,
        "circulation.pulmonary-vascular-resistance-scale": 1,
      });
    const expected = expectedIdentity(source, baseline.targetStateSha256, 0);

    await expect(source.forkResearchControlTargetV0({
      sourceControlState: baseline,
      targetControlState: highSystemic,
      expectedSourceIdentity: {
        ...expected,
        controlStateSha256: highSystemic.targetStateSha256,
      },
    })).rejects.toThrow(/current control digest mismatch/);
    await expect(source.forkResearchControlTargetV0({
      sourceControlState: baseline,
      targetControlState: highSystemic,
      expectedSourceIdentity: { ...expected, revision: expected.revision + 1 },
    })).rejects.toThrow(/expected source identity mismatch/);

    const first = await source.forkResearchControlTargetV0({
      sourceControlState: baseline,
      targetControlState: highSystemic,
      expectedSourceIdentity: expected,
    });
    const highIdentity = expectedIdentity(
      first.targetSession,
      highSystemic.targetStateSha256,
      1,
    );
    await expect(first.targetSession.forkResearchControlTargetV0({
      sourceControlState: baseline,
      targetControlState: baseline,
      expectedSourceIdentity: {
        ...highIdentity,
        controlStateSha256: baseline.targetStateSha256,
      },
    })).rejects.toThrow(/current session runtime losses/);

    const second = await first.targetSession.forkResearchControlTargetV0({
      sourceControlState: highSystemic,
      targetControlState: baseline,
      expectedSourceIdentity: highIdentity,
    });
    expect(second.receipt.target).toMatchObject({
      parameterEpoch: 2,
      controlStateSha256: baseline.targetStateSha256,
    });
    expect(second.receipt.resolvedRuntimeLosses).toEqual({
      systemicResistance: 1,
      pulmonaryResistance: 0.625,
    });

    const forgedRelease = JSON.parse(JSON.stringify(baseline));
    forgedRelease.releaseRef.sha256 = "0".repeat(64);
    await expect(source.forkResearchControlTargetV0({
      sourceControlState: forgedRelease,
      targetControlState: highSystemic,
      expectedSourceIdentity: expected,
    })).rejects.toThrow(/release-bound catalog|target state payload/);
  }, 60_000);
});

function expectedIdentity(
  session: MainWireScientificSessionV1,
  controlStateSha256: string,
  parameterEpoch: number,
): MainWireScientificResearchControlForkExpectedSourceIdentityV0 {
  return Object.freeze({
    ...session.stateIdentity(),
    parameterEpoch,
    controlStateSha256,
  });
}
