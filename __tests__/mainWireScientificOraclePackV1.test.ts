import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1,
} from "@/engine/scientific/assembly";

type OraclePackV1 = Readonly<{
  oraclePackId: string;
  schemaVersion: number;
  candidateReleaseVersion: string;
  evidenceStatus: string;
  sourceRevision: Readonly<{
    repository: string;
    commit: string;
    mergedPullRequests: readonly number[];
  }>;
  referenceCases: readonly Readonly<{
    caseId: string;
    summaryArtifact: string;
    valveMetricsArtifact: string;
  }>[];
  artifacts: readonly Readonly<{
    artifactId: string;
    role: string;
    path: string;
    sha256: string;
  }>[];
  acceptance: Readonly<{
    exactTrajectoryToleranceDefined: boolean;
    healthyLoadEnvelopeDefined: boolean;
    browserParityRequiredBeforeCutover: boolean;
    performanceBudgetRequiredBeforeCutover: boolean;
  }>;
}>;

const packPath = path.resolve("data/scientific/releases/0.1.0/oracle-pack-v1.json");
const packBytes = readFileSync(packPath);
const pack = JSON.parse(packBytes.toString("utf8")) as OraclePackV1;

describe("scientific release 0.1.0 migration oracle pack", () => {
  it("pins the source revision and bounded research evidence", () => {
    expect(pack.oraclePackId).toBe("circleheart-mainwire-five-wall-oracle-pack-v1");
    expect(pack.schemaVersion).toBe(1);
    expect(pack.candidateReleaseVersion).toBe("0.1.0");
    expect(pack.evidenceStatus).toBe("verified-research");
    expect(pack.sourceRevision).toEqual({
      repository: "g960059/0DSimDemo",
      commit: "f229143",
      mergedPullRequests: [475, 476, 477, 478],
    });
    expect(pack.referenceCases.map(({ caseId }) => caseId)).toEqual([
      "healthy",
      "AS-moderate",
      "AR-moderate",
      "MS-moderate",
      "MR-moderate",
      "TS-moderate",
      "TR-moderate",
      "PS-moderate",
      "PR-moderate",
    ]);
    expect(pack.acceptance).toMatchObject({
      exactTrajectoryToleranceDefined: false,
      healthyLoadEnvelopeDefined: false,
      browserParityRequiredBeforeCutover: true,
      performanceBudgetRequiredBeforeCutover: true,
    });
    expect(MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1).toMatchObject({
      evidenceSetId: pack.oraclePackId,
      artifactPath: "data/scientific/releases/0.1.0/oracle-pack-v1.json",
      artifactSha256: createHash("sha256").update(packBytes).digest("hex"),
      packLevelSha256Linked: true,
    });
  });

  it("fails when any curated source artifact drifts", () => {
    const artifacts = new Map(pack.artifacts.map((artifact) => [artifact.artifactId, artifact]));
    expect(artifacts.size).toBe(pack.artifacts.length);

    for (const reference of pack.referenceCases) {
      expect(artifacts.get(reference.summaryArtifact)?.role).toBe("periodic-summary");
      expect(artifacts.get(reference.valveMetricsArtifact)?.role).toBe("valve-metrics");
    }
    for (const artifact of pack.artifacts) {
      const bytes = readFileSync(path.resolve(artifact.path));
      expect(createHash("sha256").update(bytes).digest("hex"), artifact.path)
        .toBe(artifact.sha256);
    }
  });
});
