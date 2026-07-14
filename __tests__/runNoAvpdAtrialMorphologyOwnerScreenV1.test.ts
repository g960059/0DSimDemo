import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { assembleNoAvpdAtrialMorphologyOwnerScreenV1 } from "@/tools/mechanics2/runNoAvpdAtrialMorphologyOwnerScreenV1";

describe("runNoAvpdAtrialMorphologyOwnerScreenV1", () => {
  it("assembles the four provenance-checked candidates without declaring a winner", () => {
    const directory = mkdtempSync(
      resolve(tmpdir(), "no-avpd-la-owner-screen-"),
    );
    const outputPath = resolve(directory, "report.json");
    try {
      const artifact = assembleNoAvpdAtrialMorphologyOwnerScreenV1(outputPath);
      expect(
        artifact.candidates.map((candidate) => candidate.candidateId),
      ).toEqual(["B", "V1", "A1", "A2"]);
      expect(artifact.winnerSelection.status).toBe(
        "not-performed-evidence-only-screen",
      );
      expect(artifact.winnerSelection.promotedCandidateId).toBeNull();
      expect(artifact.timeStepConfirmation.status).toBe(
        "not-run-no-candidate-promoted",
      );
      expect(artifact.comparisonPolicy.eaSeparationObjectiveApplied).toBe(
        false,
      );
      expect(artifact.comparisonPolicy.eaSeparationGateApplied).toBe(false);
      expect(
        artifact.candidates
          .slice(0, 3)
          .every(
            (candidate) =>
              candidate.structuralStatus === "pass" &&
              candidate.diagnostics.availability === "available",
          ),
      ).toBe(true);
      expect(artifact.candidates[3]?.structuralStatus).toBe("fail");
      expect(artifact.candidates[3]?.failureReason).toContain(
        "global-solver:line-search-failed",
      );
      expect(JSON.parse(readFileSync(outputPath, "utf8"))).toEqual(artifact);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
