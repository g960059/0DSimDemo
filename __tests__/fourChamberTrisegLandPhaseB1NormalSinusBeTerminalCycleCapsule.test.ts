import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1,
  buildPhaseB1QuiescentReferenceEvidenceManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceEvidenceManifestV1";
import {
  assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1,
  buildPhaseB1QuiescentReferenceNumericalEvidenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1QuiescentReferenceNumericalEvidenceV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_EVIDENCE_V1_ID,
  PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_FAILURE_V1_ID,
  PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1,
  PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1,
  PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_AUDIT_V1_ID,
  PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_NORMALIZED_TOLERANCE_V1,
  PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_FAILURE_V1_ID,
  PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_POLICY_V1,
  PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_V1_ID,
  assertBuilderIssuedPhaseB1NormalSinusBePairedPeriodicEvidenceV1,
  assertBuilderIssuedPhaseB1NormalSinusBePairedPeriodicFailureV1,
  assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1,
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1,
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  buildPhaseB1NormalSinusBePairedSourceParityAuditV1,
  finalizePhaseB1NormalSinusBePairedPeriodicEvidenceFromRetainedCapsulesV1,
  finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1,
  runPhaseB1NormalSinusBePairedPeriodicEvidenceV1,
  runPhaseB1NormalSinusBeTerminalCycleCapsuleV1,
  type PhaseB1NormalSinusBePairedPeriodicEvidenceV1,
  type PhaseB1NormalSinusBePairedPeriodicFailureV1,
  type PhaseB1NormalSinusBePairedSourceParityAuditV1,
  type PhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1,
  type PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";

describe("four-chamber Phase B1 authenticated terminal-cycle capsule", () => {
  it("fixes paired evidence to 1 ms and keeps every broader claim outside scope", () => {
    expect(PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1)
      .toBe(0.001);
    expect(PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1)
      .toEqual(["off", "on"]);
    expect(Object.isFrozen(
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1,
    )).toBe(true);
    expect(
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_NORMALIZED_TOLERANCE_V1,
    ).toBe(1e-6);
    const policy =
      PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_POLICY_V1;
    expect(policy.liveControllerRunToTerminalRequired).toBe(true);
    expect(policy.finalBuilderIssuedRunnerAndLedgerRequired).toBe(true);
    expect(policy.terminalArtifactsRequiredToBeRetainedInProcess).toBe(true);
    expect(policy.serializationReauthenticationSupported).toBe(false);
    expect(policy.maximumSupercyclesExhaustedIsFailure).toBe(true);
    expect(policy.pairedComparisonRequiresOneMillisecondBackwardEuler)
      .toBe(true);
    expect(policy.pairedComparisonRequiresSameParentAndScheduleObjects)
      .toBe(true);
    expect(policy.pairedInitialCommonCoordinateParityAuditRequired).toBe(true);
    expect(policy.nonSlsClosedLoopParameterParityClaimed).toBe(false);
    expect(policy.causalSlsEffectClaimed).toBe(false);
    expect(policy.fullBeatAcceptanceClaimed).toBe(false);
    expect(policy.multiStartAcceptanceClaimed).toBe(false);
    expect(policy.timestepConvergenceClaimed).toBe(false);
    expect(policy.cycleEnergyAcceptanceClaimed).toBe(false);
    expect(policy.physiologicalValidationClaimed).toBe(false);
    expect(policy.phaseB1AcceptanceClaimed).toBe(false);
    expect(policy.releaseRuntimeReachable).toBe(false);
  });

  it("rejects caller-supplied gate booleans before parent construction or solve", () => {
    expect(() => runPhaseB1NormalSinusBeTerminalCycleCapsuleV1({
      parentManifest: Object.freeze({}),
      parentNumericalEvidence: Object.freeze({}),
      schedule: Object.freeze({}),
      slsMode: "off",
      nominalDtSec: 0.001,
      terminalCycleConvergencePass: true,
      sha256Hex: sha256,
    } as never)).toThrow(/must contain exactly/i);

    expect(() => runPhaseB1NormalSinusBePairedPeriodicEvidenceV1({
      parentManifest: Object.freeze({}),
      parentNumericalEvidence: Object.freeze({}),
      schedule: Object.freeze({}),
      pairedSourceParityPass: true,
      bothSingleStartPeriodOneCriteriaPass: true,
      sha256Hex: sha256,
    } as never)).toThrow(/must contain exactly/i);
    expect(() => buildPhaseB1NormalSinusBePairedSourceParityAuditV1({
      parentManifest: Object.freeze({}),
      parentNumericalEvidence: Object.freeze({}),
      schedule: Object.freeze({}),
      initialCommonCoordinateParityPass: true,
      sha256Hex: sha256,
    } as never)).toThrow(/must contain exactly/i);
    expect(() =>
      finalizePhaseB1NormalSinusBePairedPeriodicEvidenceFromRetainedCapsulesV1(
        {
          parentManifest: Object.freeze({}),
          parentNumericalEvidence: Object.freeze({}),
          schedule: Object.freeze({}),
          initialSourceParityAudit: Object.freeze({}),
          slsOff: Object.freeze({}),
          slsOn: Object.freeze({}),
          pairedOneMillisecondPeriodicEvidencePass: true,
          sha256Hex: sha256,
        } as never,
      )).toThrow(/must contain exactly/i);
    expect(() =>
      finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1({
        parentManifest: Object.freeze({}),
        parentNumericalEvidence: Object.freeze({}),
        schedule: Object.freeze({}),
        sourceCase: Object.freeze({}),
        terminalResult: Object.freeze({}),
        finalCommittedSupercycleAudit: Object.freeze({}),
        finalPeriodicCheckpoint: Object.freeze({}),
        finalCycleEvidence: Object.freeze({}),
        terminalCycleConvergencePass: true,
        sha256Hex: sha256,
      } as never)).toThrow(/must contain exactly/i);
  });

  it("does not expose mode, timestep, cap status, or a rerun switch at the retained-artifact boundary", () => {
    const base = {
      parentManifest: Object.freeze({}),
      parentNumericalEvidence: Object.freeze({}),
      schedule: Object.freeze({}),
      sourceCase: Object.freeze({}),
      terminalResult: Object.freeze({}),
      finalCommittedSupercycleAudit: Object.freeze({}),
      finalPeriodicCheckpoint: Object.freeze({}),
      finalCycleEvidence: Object.freeze({}),
      sha256Hex: sha256,
    };
    for (const undeclared of [
      { slsMode: "off" },
      { nominalDtSec: 0.001 },
      { terminalStatus: "converged" },
      { maximumSupercyclesExhaustedFailure: false },
      { rerunNumericalCycle: true },
    ]) {
      expect(() =>
        finalizePhaseB1NormalSinusBeTerminalCycleFromRetainedArtifactsV1({
          ...base,
          ...undeclared,
        } as never)).toThrow(/must contain exactly/i);
    }
  });

  it("has no caller-selectable timestep or mode inventory at the paired boundary", () => {
    expect(() => runPhaseB1NormalSinusBePairedPeriodicEvidenceV1({
      parentManifest: Object.freeze({}),
      parentNumericalEvidence: Object.freeze({}),
      schedule: Object.freeze({}),
      nominalDtSec: 0.0005,
      sha256Hex: sha256,
    } as never)).toThrow(/must contain exactly/i);
    expect(() => runPhaseB1NormalSinusBePairedPeriodicEvidenceV1({
      parentManifest: Object.freeze({}),
      parentNumericalEvidence: Object.freeze({}),
      schedule: Object.freeze({}),
      modeOrder: Object.freeze(["on", "off"]),
      sha256Hex: sha256,
    } as never)).toThrow(/must contain exactly/i);
    expect(() => runPhaseB1NormalSinusBePairedPeriodicEvidenceV1({
      parentManifest: Object.freeze({}),
      parentNumericalEvidence: Object.freeze({}),
      schedule: Object.freeze({}),
      initialSourceParityAudit: Object.freeze({
        initialCommonCoordinateParityPass: true,
      }),
      sha256Hex: sha256,
    } as never)).toThrow(/must contain exactly/i);

    const retainedBase = {
      parentManifest: Object.freeze({}),
      parentNumericalEvidence: Object.freeze({}),
      schedule: Object.freeze({}),
      initialSourceParityAudit: Object.freeze({}),
      slsOff: Object.freeze({}),
      slsOn: Object.freeze({}),
      sha256Hex: sha256,
    };
    for (const undeclared of [
      { modeOrder: Object.freeze(["on", "off"]) },
      { nominalDtSec: 0.0005 },
      { causalEffectOfSlsEstablished: true },
      { serializedCapsulesAccepted: true },
    ]) {
      expect(() =>
        finalizePhaseB1NormalSinusBePairedPeriodicEvidenceFromRetainedCapsulesV1(
          { ...retainedBase, ...undeclared } as never,
        )).toThrow(/must contain exactly/i);
    }
  });

  it("rejects reconstructed capsules, cap failures, paired evidence, and paired failures", () => {
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleV1(
        Object.freeze({
          capsuleId:
            PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_V1_ID,
          contentSha256: "0".repeat(64),
        }) as PhaseB1NormalSinusBeTerminalCycleCapsuleV1,
        sha256,
      )).toThrow(/not builder-issued/i);
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1(
        Object.freeze({
          failureId:
            PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_FAILURE_V1_ID,
          failureKind: "maximum-supercycles-exhausted",
          contentSha256: "0".repeat(64),
        }) as PhaseB1NormalSinusBeTerminalCycleCapsuleFailureV1,
        sha256,
      )).toThrow(/not builder-issued/i);
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusBePairedSourceParityAuditV1(
        Object.freeze({
          auditId:
            PHASE_B1_NORMAL_SINUS_BE_PAIRED_SOURCE_PARITY_AUDIT_V1_ID,
          comparedCommonScalarCount: 56,
          maximumNormalizedDistanceTolerance: 1e-6,
          initialCommonCoordinateParityPass: true,
          contentSha256: "0".repeat(64),
        }) as PhaseB1NormalSinusBePairedSourceParityAuditV1,
        sha256,
      )).toThrow(/not builder-issued/i);
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusBePairedPeriodicEvidenceV1(
        Object.freeze({
          evidenceId:
            PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_EVIDENCE_V1_ID,
          contentSha256: "0".repeat(64),
        }) as PhaseB1NormalSinusBePairedPeriodicEvidenceV1,
        sha256,
      )).toThrow(/not builder-issued/i);
    expect(() =>
      assertBuilderIssuedPhaseB1NormalSinusBePairedPeriodicFailureV1(
        Object.freeze({
          failureId:
            PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_FAILURE_V1_ID,
          contentSha256: "0".repeat(64),
        }) as PhaseB1NormalSinusBePairedPeriodicFailureV1,
        sha256,
      )).toThrow(/not builder-issued/i);
  });

  it.skipIf(
    process.env.CIRCLEHEART_PAIRED_PERIODIC_HEAVY_TESTS !== "1",
  )(
    "reaches the authentic success-only finalizer WeakSet boundary and rejects reconstructed capsules",
    () => {
      const manifest =
        assertCanonicalPhaseB1QuiescentReferenceEvidenceManifestV1(
          buildPhaseB1QuiescentReferenceEvidenceManifestV1(sha256),
        );
      const numerical =
        assertCanonicalPhaseB1QuiescentReferenceNumericalEvidenceV1(
          buildPhaseB1QuiescentReferenceNumericalEvidenceV1(manifest, sha256),
          manifest,
        );
      const schedule =
        buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
      const initialSourceParityAudit =
        buildPhaseB1NormalSinusBePairedSourceParityAuditV1({
          parentManifest: manifest,
          parentNumericalEvidence: numerical,
          schedule,
          sha256Hex: sha256,
        });
      const reconstructedCapsule = Object.freeze({
        capsuleId: PHASE_B1_NORMAL_SINUS_BE_TERMINAL_CYCLE_CAPSULE_V1_ID,
        contentSha256: "0".repeat(64),
      }) as PhaseB1NormalSinusBeTerminalCycleCapsuleV1;
      expect(() =>
        finalizePhaseB1NormalSinusBePairedPeriodicEvidenceFromRetainedCapsulesV1(
          {
            parentManifest: manifest,
            parentNumericalEvidence: numerical,
            schedule,
            initialSourceParityAudit,
            slsOff: reconstructedCapsule,
            slsOn: reconstructedCapsule,
            sha256Hex: sha256,
          },
        )).toThrow(/terminal-cycle capsule is not builder-issued/i);
    },
  );
});

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
