import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import { writeNoAvpdTriSegMappingAbArtifactV1 } from "@/tools/mechanics2/runNoAvpdTriSegMappingAbV1";

describe("NoAvpdTriSegMappingAbV1 report runner", () => {
  it("writes a deterministic compact artifact and one retained gzip report per available arm", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "triseg-mapping-ab-"));
    const destination = resolve(directory, "report.json");
    try {
      const artifact = writeNoAvpdTriSegMappingAbArtifactV1(
        { beats: 1, dtSec: 0.01, sampleEverySteps: 1 },
        destination,
      );
      const persisted = JSON.parse(readFileSync(destination, "utf8"));
      const { normalizedSha256, ...body } = persisted;

      expect(normalizedSha256).toBe(
        createHash("sha256").update(JSON.stringify(body)).digest("hex"),
      );
      expect(artifact.normalizedSha256).toBe(normalizedSha256);
      expect(
        artifact.diagnostic.parameterIsolation.nonMappingParametersIdentical,
      ).toBe(true);
      expect(artifact.diagnostic.interpretation.physiologyWinnerSelected).toBe(
        false,
      );
      expect(artifact.provenance.crossMappingWarmCheckpointUsed).toBe(false);

      for (const candidate of artifact.candidateEvidence) {
        expect(candidate.mappingIdIncludedInStateAndParameters).toBe(true);
        expect(candidate.sourceReportAvailability).toBe("available");
        const sourcePath = resolve(
          directory,
          "no-avpd-triseg-mapping-ab-v1/candidates",
          `${candidate.mappingMode}.json.gz`,
        );
        expect(existsSync(sourcePath)).toBe(true);
        const source = JSON.parse(
          gunzipSync(readFileSync(sourcePath)).toString("utf8"),
        );
        expect(source.parameterSnapshot.triSegGeneralizedForceMapping).toBe(
          candidate.mappingMode,
        );
        expect(source.finalState.triSegGeneralizedForceMapping).toBe(
          candidate.mappingMode,
        );
      }
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});
