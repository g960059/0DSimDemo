import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type {
  PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1";
import type {
  PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  PHASE_B1_LIVE_PERIODIC_TERMINAL_EVIDENCE_SUMMARY_POLICY_V1,
  PHASE_B1_LIVE_PERIODIC_TERMINAL_EVIDENCE_SUMMARY_V1_ID,
  assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1,
  buildPhaseB1LivePeriodicTerminalEvidenceSummaryV1,
  decidePhaseB1LivePeriodicTerminalExitV1,
  type PhaseB1LivePeriodicTerminalEvidenceSummaryV1,
} from "@/tools/myocardium/phaseB1LivePeriodicTerminalEvidenceSummaryV1";

describe("four-chamber Phase B1 live-periodic terminal evidence summary", () => {
  it("requires retained terminal evidence and keeps every broader claim closed", () => {
    const policy =
      PHASE_B1_LIVE_PERIODIC_TERMINAL_EVIDENCE_SUMMARY_POLICY_V1;
    expect(policy.retainedBuilderIssuedTerminalArtifactsRequired).toBe(true);
    expect(policy.retainedLiveControllerSourceCaseRequired).toBe(true);
    expect(policy.numericalCycleRerunAllowed).toBe(false);
    expect(
      policy.committedCycleEnergyAuditRequiredBeforeTerminalEvidenceSerialization,
    )
      .toBe(true);
    expect(policy.builderIssuedAuthenticationSurvivesSerialization)
      .toBe(false);
    expect(policy.fullBeatAcceptanceClaimed).toBe(false);
    expect(policy.multiStartAcceptanceClaimed).toBe(false);
    expect(policy.timestepConvergenceClaimed).toBe(false);
    expect(policy.cycleEnergyAcceptanceClaimed).toBe(false);
    expect(policy.physiologicalValidationClaimed).toBe(false);
    expect(policy.phaseB1AcceptanceClaimed).toBe(false);
    expect(policy.modelCoreOrBrowserRuntimeAdopted).toBe(false);
    expect(policy.releaseRuntimeReachable).toBe(false);
  });

  it("rejects undeclared summary gates before inspecting source artifacts", () => {
    expect(() => buildPhaseB1LivePeriodicTerminalEvidenceSummaryV1({
      terminalCycleCapsule: Object.freeze({}),
      committedCycleMechanicalEnergyAudit: Object.freeze({}),
      cycleEnergyAcceptancePass: true,
      sha256Hex: sha256,
    } as never)).toThrow(/must contain exactly/i);
  });

  it("rejects reconstructed capsules, energy audits, and serialized summaries", () => {
    expect(() => buildPhaseB1LivePeriodicTerminalEvidenceSummaryV1({
      terminalCycleCapsule: Object.freeze({
        terminalStatus: "converged",
      }) as PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
      committedCycleMechanicalEnergyAudit: Object.freeze({}) as
        PhaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1,
      sha256Hex: sha256,
    })).toThrow(/terminal-cycle capsule is not builder-issued/i);

    const reconstructed = Object.freeze({
      summaryId: PHASE_B1_LIVE_PERIODIC_TERMINAL_EVIDENCE_SUMMARY_V1_ID,
      contentSha256: "0".repeat(64),
    }) as PhaseB1LivePeriodicTerminalEvidenceSummaryV1;
    expect(() =>
      assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1(
        reconstructed,
        sha256,
      )).toThrow(/not builder-issued/i);
    const serialized = JSON.parse(JSON.stringify(reconstructed)) as
      PhaseB1LivePeriodicTerminalEvidenceSummaryV1;
    expect(() =>
      assertBuilderIssuedPhaseB1LivePeriodicTerminalEvidenceSummaryV1(
        serialized,
        sha256,
      )).toThrow(/not builder-issued/i);
  });

  it("makes process success require capsule, energy, and summary in one converged process", () => {
    expect(decidePhaseB1LivePeriodicTerminalExitV1({
      terminalStatus: "converged",
      terminalCycleCapsuleFinalized: true,
      committedCycleMechanicalEnergyAuditBuilt: true,
      terminalEvidenceSummaryBuilt: true,
    })).toEqual({
      classification: "terminal-evidence-success",
      exitCode: 0,
      terminalStatus: "converged",
      terminalCycleCapsuleFinalized: true,
      committedCycleMechanicalEnergyAuditBuilt: true,
      terminalEvidenceSummaryBuilt: true,
    });
    expect(decidePhaseB1LivePeriodicTerminalExitV1({
      terminalStatus: "converged",
      terminalCycleCapsuleFinalized: true,
      committedCycleMechanicalEnergyAuditBuilt: false,
      terminalEvidenceSummaryBuilt: false,
    }).exitCode).toBe(1);
  });

  it("makes cap exhaustion a failure and rejects successful energy evidence on it", () => {
    expect(decidePhaseB1LivePeriodicTerminalExitV1({
      terminalStatus: "maximum-supercycles-exhausted",
      terminalCycleCapsuleFinalized: true,
      committedCycleMechanicalEnergyAuditBuilt: false,
      terminalEvidenceSummaryBuilt: false,
    })).toMatchObject({
      classification: "terminal-evidence-failure",
      exitCode: 1,
    });
    expect(() => decidePhaseB1LivePeriodicTerminalExitV1({
      terminalStatus: "maximum-supercycles-exhausted",
      terminalCycleCapsuleFinalized: true,
      committedCycleMechanicalEnergyAuditBuilt: true,
      terminalEvidenceSummaryBuilt: true,
    })).toThrow(/cap exhaustion cannot carry successful energy evidence/i);
  });

  it("rejects open or unfinalized exit decisions", () => {
    expect(() => decidePhaseB1LivePeriodicTerminalExitV1({
      terminalStatus: "converged",
      terminalCycleCapsuleFinalized: false,
      committedCycleMechanicalEnergyAuditBuilt: true,
      terminalEvidenceSummaryBuilt: true,
    })).toThrow(/requires capsule finalization/i);
    expect(() => decidePhaseB1LivePeriodicTerminalExitV1({
      terminalStatus: "converged",
      terminalCycleCapsuleFinalized: true,
      committedCycleMechanicalEnergyAuditBuilt: true,
      terminalEvidenceSummaryBuilt: true,
      exitCode: 0,
    } as never)).toThrow(/must contain exactly/i);
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
