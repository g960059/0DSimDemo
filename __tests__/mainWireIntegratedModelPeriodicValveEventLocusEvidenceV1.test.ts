import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("retained periodic valve-event locus evidence V1", () => {
  it("retains the failed preregistered decision without discarding its nine passing P1 runs", async () => {
    const evidencePath = path.resolve(
      "docs/scientific-runtime/evidence/periodic-valve-event-locus-v1.json",
    );
    const artifact = JSON.parse(readFileSync(evidencePath, "utf8")) as Record<
      string,
      unknown
    >;
    const artifactPayloadSha256 = artifact.artifactPayloadSha256;
    const { artifactPayloadSha256: _storedHash, ...payload } = artifact;

    expect(artifactPayloadSha256).toBe(
      "685926b2427fa20045b267f4633a3797fe021ae75155ad47e16bfa0b6fbd9316",
    );
    expect(await sha256CanonicalJsonHex(payload)).toBe(artifactPayloadSha256);
    expect(payload).toMatchObject({
      artifactSchemaVersion: 1,
      artifactId:
        "main-wire-integrated-model-periodic-valve-event-locus-evidence-v1",
      declarationOrder:
        "preflight-corrected-policy-committed-before-first-nine-load-numerical-output",
      policy: {
        declarationStatus:
          "amended-after-input-preflight-rejection-before-first-numerical-output",
        totalBloodVolumeRatios: [
          0.75,
          0.82,
          0.9,
          0.96,
          1,
          1.06,
          1.12,
          1.18,
          1.24,
        ],
        preflightAmendment: {
          attemptedLowestRatio: 0.74,
          attemptedTotalBloodVolumeMl: 4144,
          acceptedInputLowerBoundMl: 4200,
          correctedLowestRatio: 0.75,
          rejectionStage: "input-validation-before-model-initialization",
          numericalOutputAvailableAtAmendment: false,
          numericalOutputUsedToChooseCorrection: false,
        },
      },
      assessment: {
        pointCount: 9,
        expectedLoadSetComplete: true,
        loadMagnitudesMatchBaselineRatios: true,
        bilateralLoadCoverage: true,
        conditionIdentitiesDistinct: true,
        protocolIdentitySharedAcrossLoads: true,
        allRunsQualified: false,
        allValveEventSequencesQualified: false,
        eventDefinedLocusEstablished: false,
        biventricularBothPressureBasesLinearDiagnosticPassed: false,
        officialExperimentEventLocusEligible: false,
        publicLiveOutputCatalogAdmissionEstablished: false,
        espvrAdmissionEstablished: false,
        edpvrAdmissionEstablished: false,
        potentialEnergyAdmissionEstablished: false,
        pvaAdmissionEstablished: false,
        physiologicalValidationEstablished: false,
        clinicalValidationClaimed: false,
      },
    });

    const typed = payload as {
      runEvidence: Array<{
        totalBloodVolumeRatio: number;
        completedCycleCount: number;
        numericalPeriod1Established: boolean;
        allCyclesFiniteConservedAndEventExact: boolean;
        modelConditionIdentityHash: string;
        protocolIdentityHash: string;
        terminalCycleStartTraceSampleSha256: string;
        terminalCycleTraceSha256: string;
        terminalCheckpointSha256: string;
        terminalCheckpointExactRoundTripVerified: boolean;
        periodicPressureBasisWork: { status: string };
      }>;
      assessment: {
        endEjectionLinearDiagnostics: unknown[];
        endDiastolicLocusDiagnostics: unknown[];
        points: Array<{
          totalBloodVolumeRatio: number;
          events: {
            leftVentricle: {
              inletClosureCrossingCount: number;
              semilunarClosureCrossingCount: number;
              eventSequenceQualified: boolean;
            };
            rightVentricle: {
              inletClosureCrossingCount: number;
              semilunarClosureCrossingCount: number;
              eventSequenceQualified: boolean;
            };
          };
        }>;
      };
    };
    expect(typed.runEvidence).toHaveLength(9);
    expect(typed.runEvidence.map(({ completedCycleCount }) =>
      completedCycleCount
    )).toEqual([188, 186, 108, 25, 71, 136, 150, 154, 151]);
    expect(typed.runEvidence.every((run) =>
      run.numericalPeriod1Established &&
      run.allCyclesFiniteConservedAndEventExact &&
      run.terminalCheckpointExactRoundTripVerified &&
      run.periodicPressureBasisWork.status === "qualified-biventricular" &&
      [
        run.modelConditionIdentityHash,
        run.protocolIdentityHash,
        run.terminalCycleStartTraceSampleSha256,
        run.terminalCycleTraceSha256,
        run.terminalCheckpointSha256,
      ].every((value) => /^[0-9a-f]{64}$/.test(value))
    )).toBe(true);
    expect(new Set(typed.runEvidence.map(({ modelConditionIdentityHash }) =>
      modelConditionIdentityHash
    )).size).toBe(9);
    expect(new Set(typed.runEvidence.map(({ protocolIdentityHash }) =>
      protocolIdentityHash
    )).size).toBe(1);

    expect(typed.assessment.endEjectionLinearDiagnostics).toEqual([]);
    expect(typed.assessment.endDiastolicLocusDiagnostics).toEqual([]);
    const ratio082 = typed.assessment.points.find((point) =>
      point.totalBloodVolumeRatio === 0.82
    )!;
    const baseline = typed.assessment.points.find((point) =>
      point.totalBloodVolumeRatio === 1
    )!;
    expect(ratio082.events.rightVentricle.semilunarClosureCrossingCount).toBe(2);
    expect(baseline.events.rightVentricle.inletClosureCrossingCount).toBe(2);
    expect(typed.assessment.points.every((point) =>
      !point.events.leftVentricle.eventSequenceQualified &&
      !point.events.rightVentricle.eventSequenceQualified
    )).toBe(true);
  });
});
