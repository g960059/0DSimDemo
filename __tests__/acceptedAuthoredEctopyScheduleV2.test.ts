import { describe, expect, it } from "vitest";

import {
  ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CLAIM_V2,
  canonicalAcceptedAuthoredEctopyScheduleIdentityV2,
  commitAcceptedAuthoredEctopyScheduleTrialV2,
  createAcceptedAuthoredEctopyScheduleConfigurationV2,
  evaluateAcceptedAuthoredEctopyScheduleTrialV2,
  initializeAcceptedAuthoredEctopyScheduleStateV2,
  maximumAcceptedAuthoredEctopyScheduleStepV2,
  rollbackAcceptedAuthoredEctopyScheduleTrialV2,
  sha256AcceptedAuthoredEctopyScheduleIdentityV2,
  type AcceptedAuthoredEctopyScheduleConfigurationV2,
  type AuthoredEctopyEventInputV2,
} from "@/engine/myocardium/rhythm/acceptedAuthoredEctopyScheduleV2";

describe("accepted authored ectopy schedule V2", () => {
  it("routes PAC/PVC proposals and preserves capture-contingent PAC reset metadata", () => {
    const configuration = makeConfiguration([
      pvc("pvc-one", "ventricular-focus", 0, 0.4),
      pac("pac-preserve", "atrial-focus", 1, 0.3, "preserve"),
      pac("pac-reset", "atrial-focus", 0, 0.2, "reset"),
    ]);
    const initial = initializeAcceptedAuthoredEctopyScheduleStateV2(
      configuration,
    );
    const trial = evaluateAcceptedAuthoredEctopyScheduleTrialV2(initial, 0.4);

    expect(trial.sourceImpulses.map((impulse) => [
      impulse.sourceId,
      impulse.chamber,
      impulse.sourceKind,
      impulse.parentCapturedActivationId,
    ])).toEqual([
      ["atrial-focus", "atrial", "authored-ectopy", null],
      ["atrial-focus", "atrial", "authored-ectopy", null],
      ["ventricular-focus", "ventricular", "authored-ectopy", null],
    ]);

    const metadata = trial.sourceImpulses.map((impulse) =>
      trial.metadataBySourceImpulseId[impulse.sourceImpulseId]);
    expect(metadata.map((entry) => entry?.authoredEctopyId)).toEqual([
      "pac-reset",
      "pac-preserve",
      "pvc-one",
    ]);
    expect(metadata[0]).toMatchObject({
      eventKind: "pac",
      sinusResetPolicy: "reset",
    });
    expect(metadata[1]).toMatchObject({
      eventKind: "pac",
      sinusResetPolicy: "preserve",
    });
    expect("sinusResetPolicy" in metadata[2]!).toBe(false);

    // Reset policy is not embedded in or applied by the source impulse owner.
    expect("sinusResetPolicy" in trial.sourceImpulses[0]!).toBe(false);
    expect(ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CLAIM_V2.sourceMutationClaimed)
      .toBe(false);
    expect(ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CLAIM_V2.captureClaimed)
      .toBe(false);
    expect(ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CLAIM_V2.refractoryClaimed)
      .toBe(false);
  });

  it("canonically orders and emits a complete same-time batch without truncation", () => {
    const unordered = makeConfiguration([
      pvc("b-zero", "source-b", 0, 0.5),
      pac("a-two", "source-a", 2, 0.5, "preserve"),
      pac("a-one", "source-a", 1, 0.5, "reset"),
    ]);
    expect(unordered.events.map((event) => event.authoredEctopyId)).toEqual([
      "a-one",
      "a-two",
      "b-zero",
    ]);

    const largeBatch = Array.from({ length: 4_097 }, (_, index) =>
      pvc(`pvc-${index}`, "large-authored-source", index, 0.75));
    const configuration = makeConfiguration(largeBatch, "complete-batch");
    const trial = evaluateAcceptedAuthoredEctopyScheduleTrialV2(
      initializeAcceptedAuthoredEctopyScheduleStateV2(configuration),
      0.75,
    );
    expect(trial.sourceImpulses).toHaveLength(4_097);
    expect(Object.keys(trial.metadataBySourceImpulseId)).toHaveLength(4_097);
    expect(trial.sourceImpulses.at(-1)?.sourceSequence).toBe(4_096);
  });

  it("uses open-start/closed-end ownership and clips off-grid steps by full batch", () => {
    const configuration = makeConfiguration([
      pac("pac-b", "source-b", 0, 0.235, "preserve"),
      pac("pac-a", "source-a", 0, 0.235, "reset"),
      pvc("later", "source-v", 0, 0.4),
    ]);
    const state = initializeAcceptedAuthoredEctopyScheduleStateV2(
      configuration,
      0.2,
    );
    const step = maximumAcceptedAuthoredEctopyScheduleStepV2(state, 0.1);
    expect(step.candidateTimeSec).toBe(0.235);
    expect(step.maximumStepSec).toBeCloseTo(0.035, 15);
    expect(step.clippedByEvent).toBe(true);
    expect(step.boundaryBatchEventCount).toBe(2);
    expect(step.boundaryAuthoredEctopyId).toBe("pac-a");

    const exact = evaluateAcceptedAuthoredEctopyScheduleTrialV2(
      state,
      step.candidateTimeSec,
    );
    expect(exact.sourceImpulses.map((impulse) => impulse.sourceId)).toEqual([
      "source-a",
      "source-b",
    ]);
    const accepted = commitAcceptedAuthoredEctopyScheduleTrialV2(state, exact);
    const after = evaluateAcceptedAuthoredEctopyScheduleTrialV2(accepted, 0.3);
    expect(after.sourceImpulses).toEqual([]);
  });

  it("does not synthesize a compensatory pause or any un-authored event", () => {
    const configuration = makeConfiguration([
      pvc("only-pvc", "ventricular-focus", 0, 0.25),
    ]);
    let state = initializeAcceptedAuthoredEctopyScheduleStateV2(configuration);
    const pvcTrial = evaluateAcceptedAuthoredEctopyScheduleTrialV2(state, 0.25);
    expect(pvcTrial.sourceImpulses).toHaveLength(1);
    state = commitAcceptedAuthoredEctopyScheduleTrialV2(state, pvcTrial);
    const longAfter = evaluateAcceptedAuthoredEctopyScheduleTrialV2(state, 10);
    expect(longAfter.sourceImpulses).toEqual([]);
    expect(longAfter.candidateCursor).toBe(1);
    expect(ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CLAIM_V2.compensatoryPauseClaimed)
      .toBe(false);
    expect(ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CLAIM_V2.retrogradeVaConductionClaimed)
      .toBe(false);
    expect(ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CLAIM_V2.fusionClaimed)
      .toBe(false);
    expect(ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CLAIM_V2.qrsMorphologyClaimed)
      .toBe(false);
  });

  it("is retry-pure, exact-recompute committed, and identity-rollback safe", () => {
    const configuration = makeConfiguration([
      pac("pac", "atrial-focus", 0, 0.2, "reset"),
      pvc("pvc", "ventricular-focus", 0, 0.3),
    ]);
    const accepted = initializeAcceptedAuthoredEctopyScheduleStateV2(
      configuration,
    );
    const first = evaluateAcceptedAuthoredEctopyScheduleTrialV2(accepted, 0.3);
    const retry = evaluateAcceptedAuthoredEctopyScheduleTrialV2(accepted, 0.3);
    expect(retry).toEqual(first);
    expect(rollbackAcceptedAuthoredEctopyScheduleTrialV2(accepted, retry))
      .toBe(accepted);

    const forged = jsonClone(first);
    const firstId = forged.sourceImpulses[0].sourceImpulseId;
    forged.metadataBySourceImpulseId[firstId].sinusResetPolicy = "preserve";
    expect(() => commitAcceptedAuthoredEctopyScheduleTrialV2(
      accepted,
      forged,
    )).toThrow(/does not match its accepted base/);

    const committed = commitAcceptedAuthoredEctopyScheduleTrialV2(
      accepted,
      first,
    );
    expect(committed.revision).toBe(1);
    expect(committed.acceptedEmittedImpulseCount).toBe(2);
  });

  it("consumes signed and boundary history exactly once at initialization", () => {
    const configuration = makeConfiguration([
      pac("negative", "atrial-focus", 0, -1, "preserve"),
      pvc("boundary", "ventricular-focus", 0, 0),
      pac("future", "atrial-focus", 1, 0.1, "reset"),
    ]);
    const state = initializeAcceptedAuthoredEctopyScheduleStateV2(
      configuration,
      0,
    );
    expect(state.initializedHistoryEventCount).toBe(2);
    expect(state.cursor).toBe(2);
    expect(state.acceptedEmittedImpulseCount).toBe(0);
    const trial = evaluateAcceptedAuthoredEctopyScheduleTrialV2(state, 0.1);
    expect(trial.sourceImpulses).toHaveLength(1);
    expect(trial.metadataBySourceImpulseId[
      trial.sourceImpulses[0]!.sourceImpulseId
    ]?.authoredEctopyId).toBe("future");
  });

  it("binds complete canonical content into an immutable SHA-256 identity", async () => {
    const events = [
      pvc("pvc", "source-v", 0, 0.4),
      pac("pac", "source-a", 0, 0.2, "reset"),
    ] as const;
    const baseline = makeConfiguration(events, "identity");
    const reordered = makeConfiguration([...events].reverse(), "identity");
    expect(canonicalAcceptedAuthoredEctopyScheduleIdentityV2(reordered))
      .toEqual(canonicalAcceptedAuthoredEctopyScheduleIdentityV2(baseline));
    expect(await sha256AcceptedAuthoredEctopyScheduleIdentityV2(reordered))
      .toBe(await sha256AcceptedAuthoredEctopyScheduleIdentityV2(baseline));

    const changed = makeConfiguration([
      pvc("pvc", "source-v", 0, 0.4),
      pac("pac", "source-a", 0, 0.2, "preserve"),
    ], "identity");
    expect(await sha256AcceptedAuthoredEctopyScheduleIdentityV2(changed))
      .not.toBe(await sha256AcceptedAuthoredEctopyScheduleIdentityV2(baseline));
    expect(Object.isFrozen(baseline)).toBe(true);
    expect(Object.isFrozen(baseline.events)).toBe(true);
    expect(Object.isFrozen(baseline.events[0])).toBe(true);
  });

  it("rejects malformed, nonfinite, duplicate, misrouted, and ambiguous events", () => {
    expect(() => makeConfiguration([
      { ...pac("pac", "a", 0, 0.2, "reset"), extra: true } as any,
    ])).toThrow(/keys are invalid/);
    expect(() => makeConfiguration([
      pac("pac", "a", 0, Number.NaN, "reset"),
    ])).toThrow(/finite/);
    expect(() => makeConfiguration([
      { ...pac("pac", "a", 0, 0.2, "reset"), chamber: "ventricular" } as any,
    ])).toThrow(/must be atrial/);
    expect(() => makeConfiguration([
      { ...pvc("pvc", "v", 0, 0.2), sinusResetPolicy: "reset" } as any,
    ])).toThrow(/keys are invalid/);
    expect(() => makeConfiguration([
      pac("same", "a", 0, 0.2, "reset"),
      pvc("same", "v", 0, 0.3),
    ])).toThrow(/duplicate authoredEctopyId/);
    expect(() => makeConfiguration([
      pac("one", "a", 0, 0.2, "reset"),
      pac("two", "a", 0, 0.3, "preserve"),
    ])).toThrow(/duplicate source sequence key/);
    expect(() => initializeAcceptedAuthoredEctopyScheduleStateV2(
      makeConfiguration([]),
      -0.1,
    )).toThrow(/nonnegative/);
    expect(() => evaluateAcceptedAuthoredEctopyScheduleTrialV2(
      initializeAcceptedAuthoredEctopyScheduleStateV2(makeConfiguration([])),
      0,
    )).toThrow(/must exceed/);
  });
});

function makeConfiguration(
  events: readonly AuthoredEctopyEventInputV2[],
  suffix = "default",
): AcceptedAuthoredEctopyScheduleConfigurationV2 {
  return createAcceptedAuthoredEctopyScheduleConfigurationV2({
    configurationId: `authored-ectopy-configuration:${suffix}`,
    ownerInstanceId: `authored-ectopy-owner:${suffix}`,
    scheduleId: `authored-ectopy-schedule:${suffix}`,
    events,
  });
}

function pac(
  authoredEctopyId: string,
  sourceId: string,
  sourceSequence: number,
  activationTimeSec: number,
  sinusResetPolicy: "reset" | "preserve",
): AuthoredEctopyEventInputV2 {
  return Object.freeze({
    eventKind: "pac" as const,
    authoredEctopyId,
    sourceId,
    sourceSequence,
    activationTimeSec,
    chamber: "atrial" as const,
    sinusResetPolicy,
  });
}

function pvc(
  authoredEctopyId: string,
  sourceId: string,
  sourceSequence: number,
  activationTimeSec: number,
): AuthoredEctopyEventInputV2 {
  return Object.freeze({
    eventKind: "pvc" as const,
    authoredEctopyId,
    sourceId,
    sourceSequence,
    activationTimeSec,
    chamber: "ventricular" as const,
  });
}

function jsonClone<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}
