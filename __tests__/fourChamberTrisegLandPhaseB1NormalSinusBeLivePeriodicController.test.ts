import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB1NormalSinusBePeriodicConvergenceDefinitionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  PHASE_B1_NORMAL_SINUS_COMMITTED_SUPERCYCLE_AUDIT_V1_ID,
  assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1,
  assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleExpectationV1,
  buildPhaseB1NormalSinusCommittedSupercycleAuditV1,
  buildPhaseB1NormalSinusCommittedSupercycleExpectationV1,
  type PhaseB1NormalSinusCommittedSupercycleAuditV1,
  type PhaseB1NormalSinusCommittedSupercycleExpectationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusCommittedSupercycleAuditV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CONTROLLER_V1_ID,
  PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CLAIM_POLICY_V1,
  PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CYCLE_EVIDENCE_V1_ID,
  PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_FAILURE_V1_ID,
  PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_TERMINAL_RESULT_V1_ID,
  advancePhaseB1NormalSinusBeLivePeriodicControllerV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicFailureV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1,
  assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1,
  initializePhaseB1NormalSinusBeLivePeriodicControllerV1,
  type PhaseB1NormalSinusBeLivePeriodicControllerV1,
  type PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
  type PhaseB1NormalSinusBeLivePeriodicFailureV1,
  type PhaseB1NormalSinusBeLivePeriodicTerminalResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeLivePeriodicControllerV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1,
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";

describe("four-chamber Phase B1 live normal-sinus BE periodic boundary", () => {
  it("uses capability wording before a live cycle exists and keeps broad claims false", () => {
    const policy = PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CLAIM_POLICY_V1;
    expect(policy.liveCanonicalScheduleSolverRequiredForCycleEvidence).toBe(
      true,
    );
    expect(policy.liveCommittedIntervalLedgerRequiredForCycleEvidence).toBe(
      true,
    );
    expect("liveCanonicalScheduleSolverExecuted" in policy).toBe(false);
    expect("liveCommittedIntervalLedgerAuthenticated" in policy).toBe(false);
    expect(policy.fullBeatAcceptanceClaimed).toBe(false);
    expect(policy.multiStartAcceptanceClaimed).toBe(false);
    expect(policy.timestepConvergenceClaimed).toBe(false);
    expect(policy.cycleEnergyAcceptanceClaimed).toBe(false);
    expect(policy.physiologicalValidationClaimed).toBe(false);
    expect(policy.phaseB1AcceptanceClaimed).toBe(false);
    expect(policy.releaseRuntimeReachable).toBe(false);
  });

  it.each([0, 1, 2, 7, 99])(
    "builds exact integer-indexed cycle %i endpoints, durations, and events",
    (cycleIndex) => {
      const context = buildFastExpectationContext("on");
      const expectation =
        buildPhaseB1NormalSinusCommittedSupercycleExpectationV1({
          definition: context.definition,
          schedule: context.schedule,
          cycleIndex,
          sha256Hex: sha256,
        });
      expect(expectation.startTimeSec).toBe(
        cycleIndex * context.schedule.cycleLengthSec,
      );
      expect(expectation.endTimeSec).toBe(
        (cycleIndex + 1) * context.schedule.cycleLengthSec,
      );
      expect(expectation.durationSec).toBe(
        expectation.endTimeSec - expectation.startTimeSec,
      );
      expect(expectation.durationComputedAsEndTimeMinusStartTime).toBe(true);
      if ([2, 7, 99].includes(cycleIndex)) {
        expect(Object.is(
          expectation.durationSec,
          context.schedule.cycleLengthSec,
        )).toBe(false);
      }
      expect(expectation.expectedEvents).toHaveLength(5);
      expect(expectation.expectedEvents.map((event) => event.wallId)).toEqual(
        PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_ACTIVATION_ORDER_V1,
      );
      expect(expectation.expectedEvents.every((event) =>
        event.cycleIndex === cycleIndex
        && event.eventId.includes(`:cycle-${cycleIndex}:`))).toBe(true);
      if (cycleIndex > 0) {
        expect(expectation.expectedEvents.some((event) =>
          event.eventId.includes(":cycle-0:"))).toBe(false);
      }
      const canonical =
        generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
          context.schedule,
          expectation.startTimeSec,
          expectation.endTimeSec,
          sha256,
        );
      expect(expectation.expectedEvents.map((event) =>
        event.calciumDriveTimeSec)).toEqual(canonical.map((event) =>
          event.calciumDriveEvent.calciumDriveTimeSec));
      expect(expectation.cycleZeroSpecialCaseAllowed).toBe(false);
      expect(expectation.claimBoundary.periodicConvergenceClaimed).toBe(false);
      expect(expectation.claimBoundary.fullBeatAcceptanceClaimed).toBe(false);
      expect(expectation.claimBoundary.phaseB1AcceptanceClaimed).toBe(false);
      expect(
        assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleExpectationV1(
          expectation,
          sha256,
        ),
      ).toBe(expectation);
    },
  );

  it("rejects a rehashed serialized expectation with forged cycle times and cycle-zero events", () => {
    const context = buildFastExpectationContext("off");
    const expectation =
      buildPhaseB1NormalSinusCommittedSupercycleExpectationV1({
        definition: context.definition,
        schedule: context.schedule,
        cycleIndex: 2,
        sha256Hex: sha256,
      });
    const forged = structuredClone(expectation) as unknown as
      MutableRecord;
    forged.startTimeSec = 0;
    forged.endTimeSec = context.schedule.cycleLengthSec;
    forged.cycleIndex = 0;
    (forged.expectedEvents as MutableRecord[]).forEach((event) => {
      event.cycleIndex = 0;
      event.eventId = String(event.eventId).replace(":cycle-2:", ":cycle-0:");
      event.eventKey = String(event.eventKey).replace(":cycle-2:", ":cycle-0:");
    });
    const { contentSha256: _oldHash, ...payload } = forged;
    forged.contentSha256 = computeCanonicalSha256(payload, sha256);
    recursivelyFreeze(forged);
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleExpectationV1(
        forged as unknown as
          PhaseB1NormalSinusCommittedSupercycleExpectationV1,
        sha256,
      )).toThrow("not builder-issued");
  });

  it("rejects a cycle at or beyond the fixed one-hundred-supercycle cap", () => {
    const context = buildFastExpectationContext("on");
    expect(() =>
      buildPhaseB1NormalSinusCommittedSupercycleExpectationV1({
        definition: context.definition,
        schedule: context.schedule,
        cycleIndex: 100,
        sha256Hex: sha256,
      })).toThrow("exceeds the fixed cap");
  });

  it("does not expose caller-supplied observation, flow, or gate booleans at the audit boundary", () => {
    const context = buildFastExpectationContext("on");
    const forgedRunner = Object.freeze({
      completed: true,
      eventScheduleComponentPass: true,
    });
    expect(() => buildPhaseB1NormalSinusCommittedSupercycleAuditV1({
      definition: context.definition,
      schedule: context.schedule,
      cycleIndex: 0,
      scheduleRun: forgedRunner,
      observation: Object.freeze({
        exactOneScheduleSupercycleVerified: true,
        committedIntervalProvenanceVerified: true,
      }),
      sha256Hex: sha256,
    } as never)).toThrow();
    expect(() => buildPhaseB1NormalSinusCommittedSupercycleAuditV1({
      definition: context.definition,
      schedule: context.schedule,
      cycleIndex: 0,
      scheduleRun: forgedRunner,
      sha256Hex: sha256,
    } as never)).toThrow("live committed result");
  });

  it("rejects forged audit, compact evidence, terminal result, and failure objects", () => {
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1(
        Object.freeze({
          auditId:
            PHASE_B1_NORMAL_SINUS_COMMITTED_SUPERCYCLE_AUDIT_V1_ID,
        }) as PhaseB1NormalSinusCommittedSupercycleAuditV1,
        sha256,
      )).toThrow("not builder-issued");
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1(
        Object.freeze({
          evidenceId:
            PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CYCLE_EVIDENCE_V1_ID,
        }) as PhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
        sha256,
      )).toThrow("not builder-issued");
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1(
        Object.freeze({
          resultId:
            PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_TERMINAL_RESULT_V1_ID,
        }) as PhaseB1NormalSinusBeLivePeriodicTerminalResultV1,
        sha256,
      )).toThrow("not builder-issued");
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicFailureV1(
        Object.freeze({
          failureId: PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_FAILURE_V1_ID,
        }) as PhaseB1NormalSinusBeLivePeriodicFailureV1,
        sha256,
      )).toThrow("not builder-issued");
  });

  it("rejects serialized/replayed controllers before any numerical solve", () => {
    const replay = recursivelyFreeze({
      controllerId: PHASE_B1_NORMAL_SINUS_BE_LIVE_PERIODIC_CONTROLLER_V1_ID,
      status: "running",
      periodicState: Object.freeze({ terminalStatus: "running" }),
    }) as unknown as PhaseB1NormalSinusBeLivePeriodicControllerV1;
    expect(() =>
      assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1(replay)).toThrow(
        "forged, consumed, or terminal",
      );
    expect(() => advancePhaseB1NormalSinusBeLivePeriodicControllerV1({
      controller: replay,
      sha256Hex: sha256,
    })).toThrow("forged, consumed, or terminal");
    expect(() => advancePhaseB1NormalSinusBeLivePeriodicControllerV1({
      controller: replay,
      observation: Object.freeze({}),
      sha256Hex: sha256,
    } as never)).toThrow();
  });

  it("rejects a non-quiescent synthetic source rather than opening a test bypass", () => {
    const synthetic = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "on",
      sha256,
    );
    const schedule = buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
      sha256,
    );
    expect(() => initializePhaseB1NormalSinusBeLivePeriodicControllerV1({
      sourceCase: synthetic,
      schedule,
      nominalDtSec: 0.001,
      sha256Hex: sha256,
    } as never)).toThrow();
  });
});

function buildFastExpectationContext(slsMode: "on" | "off") {
  const source = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    slsMode,
    sha256,
  );
  const schedule = buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(
    sha256,
  );
  const definition =
    buildPhaseB1NormalSinusBePeriodicConvergenceDefinitionV1({
      schedule,
      sourceEndpoint: source.warmStart.endpoint,
      registry: source.model.newtonScaleRegistry,
      nominalDtSec: 0.001,
      sha256Hex: sha256,
    });
  return { source, schedule, definition };
}

function sha256(canonicalJson: string): string {
  return createHash("sha256").update(canonicalJson).digest("hex");
}

type MutableRecord = Record<string, unknown>;

function recursivelyFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      recursivelyFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
