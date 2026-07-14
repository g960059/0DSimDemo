import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { writeNoAvpdPassiveRvOwnerSensitivityReportV1 } from "@/tools/mechanics2/runNoAvpdPassiveRvOwnerSensitivityV1";

describe("NoAvpdPassiveRvOwnerSensitivityV1 report runner", () => {
  it("writes deterministic full-grid candidate reports with source and parameter hashes", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "passive-rv-owner-"));
    const destination = resolve(directory, "report.json");
    try {
      const artifact =
        writeNoAvpdPassiveRvOwnerSensitivityReportV1(destination);
      const persisted = JSON.parse(readFileSync(destination, "utf8"));
      const { normalizedSha256, ...artifactBody } = artifact;

      expect(persisted).toEqual(artifact);
      expect(sha256Json(artifactBody)).toBe(normalizedSha256);
      expect(artifact.summary).toEqual({
        familyCount: 2,
        candidateDeclarationCountIncludingFamilyReferences: 6,
        uniqueBenchExecutionCount: 5,
        reusedEffectiveInputCount: 1,
        allCandidatePointsAvailable: true,
        scalarWinnerSelected: false,
        physiologyGateApplied: false,
      });
      expect(artifact.provenance.deterministic).toBe(true);
      expect(artifact.provenance.generatedAtIncluded).toBe(false);
      expect(artifact.provenance.familyComparisonBoundary).toMatch(
        /within-declared-one-factor-family-only/,
      );
      expect(artifact.provenance.duplicateReferenceTreatment).toMatch(
        /share-one-bench-execution/,
      );
      expect(artifact.provenance.completenessBoundary).toMatch(
        /structural-artifact-completeness-check-not-a-physiology-gate/,
      );
      expect(JSON.stringify(artifact)).not.toContain('"generatedAt":');

      for (const family of artifact.families) {
        for (const candidate of family.candidates) {
          const { hashes, ...candidateBody } = candidate;
          expect(hashes.declarationSha256).toBe(
            sha256Json(candidate.declaration),
          );
          expect(hashes.effectiveParameterSha256).toBe(
            sha256Json({
              boundary: candidate.edpvr.boundary,
              model: candidate.edpvr.parameterSnapshot,
            }),
          );
          expect(hashes.completeCandidateReportSha256).toBe(
            sha256Json(candidateBody),
          );
          expect(candidate.edpvr.points).toHaveLength(25);
        }
      }
      const loadReference = artifact.families[0]!.candidates[2]!;
      const materialReference = artifact.families[1]!.candidates[1]!;
      expect(loadReference.hashes.effectiveParameterSha256).toBe(
        materialReference.hashes.effectiveParameterSha256,
      );
      expect(loadReference.hashes.declarationSha256).not.toBe(
        materialReference.hashes.declarationSha256,
      );
      for (const source of artifact.provenance.sourceFiles) {
        expect(source.sha256).toBe(
          createHash("sha256")
            .update(readFileSync(resolve(process.cwd(), source.path)))
            .digest("hex"),
        );
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
