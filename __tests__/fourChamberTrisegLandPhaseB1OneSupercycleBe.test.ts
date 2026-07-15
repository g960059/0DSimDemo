import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildPhaseB1BackwardEulerCommittedIntervalLedgerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerCommittedIntervalLedgerV1";
import {
  runPhaseB1BackwardEulerEventScheduleRunnerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerEventScheduleRunnerV1";
import {
  buildPhaseB1ProjectSyntheticOneSupercycleIntervalAuditV1,
  runPhaseB1ProjectSyntheticOneSupercycleBeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticOneSupercycleBeV1";
import {
  advancePhaseB1NormalSinusBeLivePeriodicControllerV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1,
  assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1,
  assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1,
  initializePhaseB1NormalSinusBeLivePeriodicControllerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeLivePeriodicControllerV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusCommittedSupercycleAuditV1";
import {
  assertBuilderIssuedPhaseB1ProjectSyntheticFiveWallResponseResultV1,
  type PhaseB1ProjectSyntheticFiveWallResponseResultV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticFiveWallResponseProtocolV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
  generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";

describe("four-chamber Phase B1 exact one-supercycle BE scope", () => {
  it("does not promote an authenticated short interval to one supercycle", () => {
    const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
      "off",
      sha256,
    );
    const schedule =
      buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
    const shortRun = runPhaseB1BackwardEulerEventScheduleRunnerV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      endTimeSec: 0.001,
      nominalDtSec: 0.0005,
      orderedEvents: [],
    });
    if (shortRun.completed === false) {
      throw new Error(`${shortRun.failureStage}: ${shortRun.failureReason}`);
    }
    const intervalLedger =
      buildPhaseB1BackwardEulerCommittedIntervalLedgerV1({
        scheduleRun: shortRun,
      });
    const cycleZeroEvents =
      generatePhaseB1ProjectSyntheticNormalSinusEventsInWindowV1(
        schedule,
        0,
        schedule.cycleLengthSec,
        sha256,
      );

    expect(intervalLedger.temporalScope)
      .toBe("runner-committed-interval-not-cycle-certified");
    expect(() =>
      buildPhaseB1ProjectSyntheticOneSupercycleIntervalAuditV1(
        schedule,
        cycleZeroEvents,
        shortRun,
        intervalLedger,
        true,
      )).toThrow(/not exactly schedule supercycle zero/i);
  }, 60_000);

  it.skipIf(process.env.CIRCLEHEART_HEAVY_TESTS !== "1")(
    "certifies only execution of the exact five-event 0.8 s interval",
    () => {
      const parentNumerical = getHeavyParentNumericalEvidence();
      const schedule =
        buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
      const result = runPhaseB1ProjectSyntheticOneSupercycleBeV1({
        sourceCase: parentNumerical.results.off.eventFreeCase,
        schedule,
        nominalDtSec: 0.001,
        sha256Hex: sha256,
      });
      if (result.completed === false) {
        throw new Error(`${result.failureStage}: ${result.failureReason}`);
      }

      expect(result.committedIntervalLedger.temporalScope)
        .toBe("runner-committed-interval-not-cycle-certified");
      expect(result.oneSupercycleIntervalAudit
        .exactOneScheduleSupercycleVerified).toBe(true);
      expect(result.oneSupercycleIntervalAudit.periodOneEndpointStateClaimed)
        .toBe(false);
      expect(result.traceBindings.eventTransactionCount).toBe(5);
      expect(result.fiveWallResponseProtocol).not.toBeNull();
      expect(result.fiveWallScaleSeparatedResponseDetected).toBe(true);
      expect(result.fiveWallResponseProtocol?.response
        .perWallEventCausalEffectClaimed).toBe(false);
      if (result.fiveWallResponseProtocol === null) {
        throw new Error("reference response protocol was not built");
      }
      const reconstructedResponse = Object.freeze({
        ...result.fiveWallResponseProtocol,
      }) as PhaseB1ProjectSyntheticFiveWallResponseResultV1;
      expect(() =>
        assertBuilderIssuedPhaseB1ProjectSyntheticFiveWallResponseResultV1(
          reconstructedResponse,
          sha256,
        )).toThrow(/live builder-issued object/i);
      expect(result.periodicityAcceptancePass).toBe(false);
      expect(result.periodOneAttractorAcceptancePass).toBe(false);
      expect(result.fullBeatAcceptancePass).toBe(false);
      expect(result.phaseB1AcceptancePass).toBe(false);
      expect(result.projectSyntheticOneSupercycleBeExecutionPass).toBe(true);
      expect(result.referenceDtFiveWallResponsePass).toBe(true);
      expect(result.responseEvidenceBindingPolicyPass).toBe(true);
      expect(result.oneSupercycleEvidenceBundleContentSha256)
        .toMatch(/^[0-9a-f]{64}$/);
    },
    600_000,
  );

  it.skipIf(process.env.CIRCLEHEART_HEAVY_TESTS !== "1")(
    "advances one authenticated SLS-off cycle and consumes its controller",
    () => {
      const parentNumerical = getHeavyParentNumericalEvidence();
      const sourceCase = parentNumerical.results.off.eventFreeCase;
      const schedule =
        buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
      const controller =
        initializePhaseB1NormalSinusBeLivePeriodicControllerV1({
          sourceCase,
          schedule,
          nominalDtSec: 0.001,
          sha256Hex: sha256,
        });

      expect(controller.slsMode).toBe("off");
      const result = advancePhaseB1NormalSinusBeLivePeriodicControllerV1({
        controller,
        sha256Hex: sha256,
      });
      if (result.completedCycle === false) {
        throw new Error(
          `${result.failure.failureStage}: ${result.failure.failureReason}`,
        );
      }

      expect(
        assertBuilderIssuedPhaseB1NormalSinusCommittedSupercycleAuditV1(
          result.committedSupercycleAudit,
          sha256,
        ),
      ).toBe(result.committedSupercycleAudit);
      expect(result.committedSupercycleAudit.slsMode).toBe("off");
      expect(result.committedSupercycleAudit.committedSupercycleAuditPass)
        .toBe(true);
      expect(
        assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicCycleEvidenceV1(
          result.cycleEvidence,
          sha256,
        ),
      ).toBe(result.cycleEvidence);
      expect(result.cycleEvidence.cycleIndex).toBe(0);
      expect(result.cycleEvidence.previousCycleEvidenceContentSha256)
        .toBeNull();
      expect(result.cycleEvidence.committedSupercycleAuditContentSha256)
        .toBe(result.committedSupercycleAudit.contentSha256);
      expect(result.cycleEvidence.periodicCheckpointContentSha256)
        .toBe(result.periodicCheckpoint.contentSha256);

      expect(result.controller === null).not.toBe(
        result.terminalResult === null,
      );
      if (result.controller !== null) {
        expect(
          assertLivePhaseB1NormalSinusBeLivePeriodicControllerV1(
            result.controller,
          ),
        ).toBe(result.controller);
        expect(result.controller.completedCycleEvidenceCount).toBe(1);
        expect(result.controller.cycleEvidenceChainHeadContentSha256)
          .toBe(result.cycleEvidence.contentSha256);
      } else if (result.terminalResult !== null) {
        expect(
          assertBuilderIssuedPhaseB1NormalSinusBeLivePeriodicTerminalResultV1(
            result.terminalResult,
            sha256,
          ),
        ).toBe(result.terminalResult);
        expect(result.terminalResult.completedSupercycleCount).toBe(1);
        expect(result.terminalResult.cycleEvidenceChainHeadContentSha256)
          .toBe(result.cycleEvidence.contentSha256);
      }

      expect(() =>
        advancePhaseB1NormalSinusBeLivePeriodicControllerV1({
          controller,
          sha256Hex: sha256,
        })).toThrow(/forged, consumed, or terminal/i);
    },
    600_000,
  );
});

let heavyParentNumericalEvidence: ReturnType<
  typeof buildPhaseB1QuiescentReferenceNumericalEvidenceV1
> | null = null;

function getHeavyParentNumericalEvidence(): ReturnType<
  typeof buildPhaseB1QuiescentReferenceNumericalEvidenceV1
> {
  if (heavyParentNumericalEvidence === null) {
    const parentManifest =
      buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256);
    heavyParentNumericalEvidence =
      buildPhaseB1QuiescentReferenceNumericalEvidenceV1(
        parentManifest,
        sha256,
      );
  }
  return heavyParentNumericalEvidence;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
