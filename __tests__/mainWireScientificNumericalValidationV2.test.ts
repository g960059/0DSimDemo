import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  createMainWireAdultFiveWallNonCoronaryReleaseV1,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V2,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_ORACLE_EVIDENCE_SOURCE_V1,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ID,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_VERSION,
  MAIN_WIRE_ADULT_FIVE_WALL_NUMERICAL_RUNTIME_ABI_V2,
} from "@/engine/scientific/assembly";

type NumericalValidationV1 = Readonly<{
  artifactId: string;
  schemaVersion: number;
  candidateRelease: Readonly<{ id: string; version: string }>;
  numericalRuntime: Readonly<{
    runtimeVersion: string;
    solverVersion: string;
    abi: Readonly<{ id: string; version: string }>;
  }>;
  identityClassification: Readonly<{
    scientificEquationsOrParametersChanged: boolean;
    acceptedStateSchemaChanged: boolean;
    floatingPointAndNewtonPathChanged: boolean;
    bitwiseCompatibleWithRelease0_1_0: boolean;
    exactCheckpointCompatibility: string;
    executableBuildProvenance: string;
  }>;
  oracleEvidence: Readonly<{
    artifactPath: string;
    artifactSha256: string;
    source: Readonly<{
      commitSha: string;
      role: string;
    }>;
  }>;
  focusedDeterministicSuite: Readonly<{
    classification: string;
    testFiles: number;
    testsPassed: number;
    testsFailed: number;
    files: readonly Readonly<{ path: string; testsPassed: number }>[];
  }>;
  shadowMetrics: readonly Readonly<{
    metricId: string;
    classification: string;
  }>[];
  performance: Readonly<{
    classification: string;
    derivedComparison: Readonly<{
      throughputRatioVersusBaseline: number;
      mechanicsCallbackReductionFraction: number;
      local500StepsPerSecondTargetExceeded: boolean;
      formalMultiRunPerformanceGatePassed: boolean;
      browserEndToEndGatePassed: boolean;
    }>;
  }>;
  claims: Readonly<{
    clinicalValidationClaimed: boolean;
    patientSpecificFitClaimed: boolean;
    release0_1_0BitwiseParityClaimed: boolean;
    productionBrowserCutoverClaimed: boolean;
  }>;
}>;

const artifactPath = path.resolve(
  "data/scientific/releases/0.2.0/numerical-validation-v1.json",
);
const artifactBytes = readFileSync(artifactPath);
const artifact = JSON.parse(
  artifactBytes.toString("utf8"),
) as NumericalValidationV1;

describe("scientific release 0.2.0 numerical validation identity", () => {
  it("content-addresses a bounded non-clinical validation record", () => {
    expect(artifact.artifactId)
      .toBe("circleheart-mainwire-five-wall-numerical-validation-v1");
    expect(artifact.schemaVersion).toBe(1);
    expect(artifact.candidateRelease).toEqual({
      id: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ID,
      version: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_VERSION,
    });
    expect(artifact.numericalRuntime).toMatchObject({
      runtimeVersion: "0.2.0",
      solverVersion: "2.0.0",
      abi: {
        id: MAIN_WIRE_ADULT_FIVE_WALL_NUMERICAL_RUNTIME_ABI_V2.id,
        version: MAIN_WIRE_ADULT_FIVE_WALL_NUMERICAL_RUNTIME_ABI_V2.version,
      },
    });
    expect(createHash("sha256").update(artifactBytes).digest("hex"))
      .toBe(MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V2
        .numericalValidationArtifact.artifactSha256);

    expect(artifact.focusedDeterministicSuite).toMatchObject({
      classification: "passed-focused-numerical-and-transaction-suite",
      testFiles: 10,
      testsPassed: 77,
      testsFailed: 0,
    });
    expect(artifact.focusedDeterministicSuite.files.reduce(
      (sum, file) => sum + file.testsPassed,
      0,
    )).toBe(artifact.focusedDeterministicSuite.testsPassed);
    expect(artifact.shadowMetrics.length).toBeGreaterThanOrEqual(7);
    expect(artifact.shadowMetrics.every(({ classification }) =>
      classification === "passed")).toBe(true);

    expect(artifact.performance.classification).toBe(
      "local-single-run-smoke-exceeds-target-formal-acceptance-not-claimed",
    );
    expect(artifact.performance.derivedComparison).toEqual({
      throughputRatioVersusBaseline: 12.423221,
      mechanicsCallbackReductionFraction: 0.849807,
      local500StepsPerSecondTargetExceeded: true,
      formalMultiRunPerformanceGatePassed: false,
      browserEndToEndGatePassed: false,
    });
    expect(artifact.claims).toMatchObject({
      clinicalValidationClaimed: false,
      patientSpecificFitClaimed: false,
      release0_1_0BitwiseParityClaimed: false,
      productionBrowserCutoverClaimed: false,
    });
  });

  it("keeps #478 only in oracle lineage and executable provenance external", async () => {
    expect(artifact.oracleEvidence.source).toMatchObject({
      commitSha:
        MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_ORACLE_EVIDENCE_SOURCE_V1
          .commitSha,
      role: "oracle-evidence-generation-source",
    });
    expect(artifact.identityClassification).toMatchObject({
      scientificEquationsOrParametersChanged: false,
      acceptedStateSchemaChanged: false,
      floatingPointAndNewtonPathChanged: true,
      bitwiseCompatibleWithRelease0_1_0: false,
      exactCheckpointCompatibility:
        "identical-release-ref-only-old-checkpoints-fail-closed",
      executableBuildProvenance:
        "external-BuildArtifactRefV1-and-RunArtifactV1-only",
    });
    expect(artifact.numericalRuntime).not.toHaveProperty(
      "implementationProvenance",
    );
    expect(artifact.numericalRuntime).not.toHaveProperty("commitSha");
    expect(artifact.numericalRuntime).not.toHaveProperty("repository");

    const release = await createMainWireAdultFiveWallNonCoronaryReleaseV1();
    const numericalSnapshot = release.manifest.numericalRuntime.snapshot;
    expect(numericalSnapshot).not.toHaveProperty("implementationProvenance");
    expect(JSON.stringify(numericalSnapshot)).not.toContain("commitSha");
    expect(JSON.stringify(numericalSnapshot)).not.toContain("repository");
    expect(release.manifest.evidence.snapshot).toMatchObject({
      oracleArtifact: {
        oracleSource:
          MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_ORACLE_EVIDENCE_SOURCE_V1,
      },
      numericalValidationArtifact:
        MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V2
          .numericalValidationArtifact,
      executableBuildProvenanceEmbedded: false,
    });
  });
});
