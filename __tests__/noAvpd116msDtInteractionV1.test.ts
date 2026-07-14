import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import {
  NO_AVPD_116MS_DT_INTERACTION_PROTOCOL_V1,
  assembleNoAvpd116msDtInteractionArtifactV1,
  type NoAvpd116msDtInteractionRunSummaryV1,
} from "@/tools/mechanics2/runNoAvpd116msDtInteractionV1";

describe("NoAvpd116msDtInteractionV1", () => {
  it("fixes an independent-cold HR60 two-dt interaction protocol without order claims", () => {
    expect(NO_AVPD_116MS_DT_INTERACTION_PROTOCOL_V1).toMatchObject({
      candidateId: "lv-ca-decay-116ms",
      heartRateBpm: 60,
      beats: 32,
      initialization: "independent-cold-start-per-time-step",
      crossTimeStepWarmStartAllowed: false,
      dtSec: [0.005, 0.0025],
      convergenceOrderEstimated: false,
      waveformDifferenceComputed: false,
      physiologyThresholdsApplied: false,
    });
  });

  it("classifies only the reproduced fail/pass interaction and content-addresses the body", () => {
    const coarse = syntheticRun({
      dtSec: 0.005,
      status: "fail",
      failedStepIndex: 202,
      acceptedTimeSec: 1.01,
      stepsAttempted: 203,
      stepsAccepted: 202,
      oneBeatNormalizedMax: null,
    });
    const fine = syntheticRun({
      dtSec: 0.0025,
      status: "pass",
      failedStepIndex: null,
      acceptedTimeSec: 32,
      stepsAttempted: 12_800,
      stepsAccepted: 12_800,
      oneBeatNormalizedMax: 3.78066e-4,
    });
    const artifact = assembleNoAvpd116msDtInteractionArtifactV1(
      [fine, coarse],
      {
        parameterSha256: "parameter",
        implementationSha256: "implementation",
        sourceHarnessImplementationSha256: "source-harness",
        interactionHarnessImplementationSha256: "interaction-harness",
      },
    );

    expect(artifact.runs.map((run) => run.dtSec)).toEqual([0.005, 0.0025]);
    expect(artifact.comparison.reproducedExpectedInteraction).toBe(true);
    expect(artifact.comparison.convergenceOrderEstimated).toBe(false);
    expect(artifact.comparison.errorEstimateComputed).toBe(false);
    expect(artifact.comparison.physiologyClassificationPerformed).toBe(false);
    const { normalizedSha256, ...body } = artifact;
    expect(normalizedSha256).toBe(sha256Json(body));
  });

  it("does not call a nearby but different outcome a reproduction", () => {
    const coarse = syntheticRun({
      dtSec: 0.005,
      status: "fail",
      failedStepIndex: 203,
      acceptedTimeSec: 1.01,
      stepsAttempted: 204,
      stepsAccepted: 203,
      oneBeatNormalizedMax: null,
    });
    const fine = syntheticRun({
      dtSec: 0.0025,
      status: "pass",
      failedStepIndex: null,
      acceptedTimeSec: 32,
      stepsAttempted: 12_800,
      stepsAccepted: 12_800,
      oneBeatNormalizedMax: 3.78066e-4,
    });
    const artifact = assembleNoAvpd116msDtInteractionArtifactV1(
      [coarse, fine],
      {
        parameterSha256: "parameter",
        implementationSha256: "implementation",
        sourceHarnessImplementationSha256: "source-harness",
        interactionHarnessImplementationSha256: "interaction-harness",
      },
    );
    expect(artifact.comparison.reproducedExpectedInteraction).toBe(false);
  });

  it("verifies the checked-in compact artifact and its gzip source evidence", () => {
    const artifactPath = resolve(
      process.cwd(),
      "data/mechanics2/reports/no-avpd-lv-ca-decay-116ms-dt-interaction-v1.json",
    );
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as {
      readonly normalizedSha256: string;
      readonly comparison: { readonly reproducedExpectedInteraction: boolean };
      readonly provenance: { readonly parameterSha256: string };
      readonly runs: readonly {
        readonly dtSec: number;
        readonly rawEvidence: {
          readonly sourceReportPath: string;
          readonly sourcePlaintextSha256: string;
          readonly sourceCompressedSha256: string;
        };
      }[];
    };
    const { normalizedSha256, ...body } = artifact;
    expect(normalizedSha256).toBe(sha256Json(body));
    expect(artifact.comparison.reproducedExpectedInteraction).toBe(true);
    expect(artifact.runs.map((run) => run.dtSec)).toEqual([0.005, 0.0025]);

    for (const run of artifact.runs) {
      const compressed = readFileSync(resolve(process.cwd(), run.rawEvidence.sourceReportPath));
      expect(sha256Bytes(compressed)).toBe(
        run.rawEvidence.sourceCompressedSha256,
      );
      const plaintext = gunzipSync(compressed);
      expect(sha256Bytes(plaintext)).toBe(run.rawEvidence.sourcePlaintextSha256);
      const source = JSON.parse(plaintext.toString("utf8")) as {
        readonly normalizedSha256: string;
        readonly parameterSha256: string;
        readonly dtSec: number;
        readonly beatsRequested: number;
        readonly runProtocol: {
          readonly heartRateBpm: number;
          readonly initialization: { readonly mode: string };
        };
      };
      const { normalizedSha256: sourceHash, ...sourceBody } = source;
      expect(sourceHash).toBe(sha256Json(sourceBody));
      expect(source.parameterSha256).toBe(artifact.provenance.parameterSha256);
      expect(source.dtSec).toBe(run.dtSec);
      expect(source.beatsRequested).toBe(32);
      expect(source.runProtocol.heartRateBpm).toBe(60);
      expect(source.runProtocol.initialization.mode).toBe("cold");
    }
  });
});

function syntheticRun(input: {
  readonly dtSec: 0.005 | 0.0025;
  readonly status: "pass" | "fail";
  readonly failedStepIndex: number | null;
  readonly acceptedTimeSec: number;
  readonly stepsAttempted: number;
  readonly stepsAccepted: number;
  readonly oneBeatNormalizedMax: number | null;
}): NoAvpd116msDtInteractionRunSummaryV1 {
  return {
    dtSec: input.dtSec,
    stepsPerCycle: 1 / input.dtSec,
    requestedBeats: 32,
    requestedDurationSec: 32,
    structuralStatus: input.status,
    failureReason: input.failedStepIndex == null
      ? null
      : `step-${input.failedStepIndex}:synthetic`,
    failureLocalization: {
      failedStepIndex: input.failedStepIndex,
      failedStepNumberOneBased:
        input.failedStepIndex == null ? null : input.failedStepIndex + 1,
      acceptedTimeSec: input.acceptedTimeSec,
      acceptedBeatsCompleted: Math.floor(input.acceptedTimeSec),
    },
    initialization: {
      mode: "cold",
      initialTimeSec: 0,
      phaseAnchor: "cycle-boundary",
      warmStartIsAcceptanceEvidence: false,
      provenanceVerification: "caller-owned-runner-may-verify",
      provenance: null,
    },
    solverWork: {
      stepsAttempted: input.stepsAttempted,
      stepsAccepted: input.stepsAccepted,
      totalGlobalIterations: 0,
      totalGlobalResidualEvaluations: 0,
      totalGlobalJacobianEvaluations: 0,
      totalGlobalJacobianReusedIterations: 0,
      totalGlobalFreshJacobianRetries: 0,
      totalGlobalLineSearchBacktracks: 0,
      maximumGlobalIterationsPerStep: 0,
      maximumGlobalResidualEvaluationsPerStep: 0,
      meanGlobalIterationsPerAcceptedStep: null,
      meanGlobalResidualEvaluationsPerAcceptedStep: null,
    },
    hardDiagnostics: {
      allStepsAccepted: input.status === "pass",
      maxAbsTotalBloodVolumeDriftMl: 0,
      maxAbsStepBloodVolumeResidualMl: 0,
      maxGlobalScaledResidual: 0,
      maxTriSegRelativeResidual: 0,
      maxSerialEquilibriumResidualPa: 0,
      maxSlsBalanceResidualJPerM3: 0,
      maxSerialWorkBalanceResidualJPerM3: 0,
    },
    exactReturnMap: {
      availability: input.status === "pass"
        ? "available-exact-integer-step-boundaries"
        : "available-exact-integer-step-boundaries",
      oneBeatNormalizedMax: input.oneBeatNormalizedMax,
      twoBeatNormalizedMax: input.oneBeatNormalizedMax,
      thresholdsApplied: false,
    },
    retainedRawSampleCount: 0,
    rawEvidence: {
      storage:
        "gzip-full-source-report-including-raw-retained-samples-no-smoothing-no-decimation",
      sourceReportPath: "synthetic.json.gz",
      sourceNormalizedSha256: "source-normalized",
      sourcePlaintextSha256: "source-plain",
      sourceCompressedSha256: "source-compressed",
      compressedByteLength: 0,
    },
  };
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function sha256Bytes(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
