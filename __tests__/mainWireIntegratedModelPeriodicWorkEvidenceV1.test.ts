import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("retained periodic-work admission evidence V1", () => {
  it("keeps the preregistered policy, payload hash, and admission decision fail-closed", async () => {
    const evidencePath = path.resolve(
      "docs/scientific-runtime/evidence/periodic-work-admission-v1.json",
    );
    const artifact = JSON.parse(readFileSync(evidencePath, "utf8")) as Record<
      string,
      unknown
    >;
    const artifactPayloadSha256 = artifact.artifactPayloadSha256;
    const { artifactPayloadSha256: _storedHash, ...payload } = artifact;

    expect(artifactPayloadSha256).toBe(
      "276d11e9bfc1a9fc4da5a05a47aa12c52ad539fadf29fe2ee13988b3f01b3b81",
    );
    expect(await sha256CanonicalJsonHex(payload)).toBe(artifactPayloadSha256);
    expect(payload).toMatchObject({
      artifactSchemaVersion: 1,
      artifactId:
        "main-wire-integrated-model-periodic-work-admission-evidence-v1",
      declarationOrder:
        "policy-committed-before-first-new-0.5ms-execution",
      policy: {
        declarationStatus: "declared-before-new-0.5ms-output",
        coarseDtSec: 0.001,
        fineDtSec: 0.0005,
        maximumScaledDifference: 0.01,
        newFineOutputAvailableWhenDeclared: false,
        newFineOutputUsedToChooseTolerance: false,
      },
      numericalComparison: {
        numericalAdmissionPassed: true,
      },
      pressureBasisAdmission: {
        requiredConditionIdentitiesDistinct: true,
        requiredProtocolIdentitiesDistinct: true,
        requiredArmsPassed: true,
        pressureBasisAdmissionPassed: true,
        characterizationOnlyArmsGateAdmission: false,
      },
      admissionDecision: {
        numericalRefinementAdmissionPassed: true,
        pressureBasisAdmissionPassed: true,
        officialExperimentOutputAdmissionEligible: true,
        publicLiveOutputCatalogAdmissionEstablished: false,
        pvaAdmissionEstablished: false,
        physiologicalValidationEstablished: false,
        clinicalValidationClaimed: false,
      },
    });

    const typed = payload as {
      runEvidence: Array<{
        armId: string;
        nominalDtSec: number;
        modelConditionIdentityHash: string;
        protocolIdentityHash: string;
        numericalPeriod1Established: boolean;
        terminalCycleTraceSha256: string;
        terminalCheckpointSha256: string;
        terminalCheckpointExactRoundTripVerified: boolean;
      }>;
      numericalComparison: {
        metrics: Array<{ scaledDifference: number; passed: boolean }>;
      };
      pressureBasisAdmission: {
        arms: Array<{ armId: string; role: string; passed: boolean }>;
      };
    };
    expect(typed.runEvidence).toHaveLength(4);
    expect(typed.runEvidence.every((run) =>
      run.numericalPeriod1Established &&
      run.terminalCheckpointExactRoundTripVerified &&
      /^[0-9a-f]{64}$/.test(run.modelConditionIdentityHash) &&
      /^[0-9a-f]{64}$/.test(run.protocolIdentityHash) &&
      /^[0-9a-f]{64}$/.test(run.terminalCycleTraceSha256) &&
      /^[0-9a-f]{64}$/.test(run.terminalCheckpointSha256)
    )).toBe(true);
    const normalRuns = typed.runEvidence.filter((run) =>
      run.armId === "normal-default"
    );
    expect(normalRuns.map((run) => run.nominalDtSec)).toEqual([0.001, 0.0005]);
    expect(normalRuns[0]!.modelConditionIdentityHash).toBe(
      normalRuns[1]!.modelConditionIdentityHash,
    );
    expect(normalRuns[0]!.protocolIdentityHash).not.toBe(
      normalRuns[1]!.protocolIdentityHash,
    );
    expect(typed.numericalComparison.metrics).toHaveLength(4);
    expect(typed.numericalComparison.metrics.every((metric) =>
      metric.passed && metric.scaledDifference <= 0.01
    )).toBe(true);
    expect(typed.pressureBasisAdmission.arms).toEqual([
      expect.objectContaining({
        armId: "normal-default",
        role: "required",
        passed: true,
      }),
      expect.objectContaining({
        armId: "peep-10-cmh2o",
        role: "required",
        passed: true,
      }),
      expect.objectContaining({
        armId: "pericardial-effusion-200ml",
        role: "characterization-only",
        passed: true,
      }),
    ]);
  });
});
