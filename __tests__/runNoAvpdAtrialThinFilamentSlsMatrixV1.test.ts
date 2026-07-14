import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import {
  assembleNoAvpdAtrialThinFilamentSlsMatrixV1,
  noAvpdAtrialThinFilamentSlsCandidateCliExitCodeV1,
  noAvpdAtrialThinFilamentSlsMatrixCliExitCodeV1,
} from "@/tools/mechanics2/runNoAvpdAtrialThinFilamentSlsMatrixV1";

describe("NoAvpdAtrialThinFilamentSlsMatrixV1 report runner", () => {
  it("assembles hash-checked cold-start evidence with complete compressed sources", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "la-thin-sls-matrix-"));
    const destination = resolve(directory, "report.json");
    try {
      const artifact = assembleNoAvpdAtrialThinFilamentSlsMatrixV1(destination);
      const persisted = JSON.parse(readFileSync(destination, "utf8"));
      const { normalizedSha256, ...body } = persisted;

      expect(normalizedSha256).toBe(
        createHash("sha256").update(JSON.stringify(body)).digest("hex"),
      );
      expect(artifact.normalizedSha256).toBe(normalizedSha256);
      expect(artifact.protocol.protocolId).toContain("fresh-jacobian-v2");
      expect(artifact.parameterIsolation).toMatchObject({
        nonFactorParametersIdentical: true,
        allCandidatesUseLumensDefaultMapping: true,
        allCandidatesUseIndependentColdStart: true,
        allCandidatesUseFixedNumericalProtocol: true,
        crossCandidateWarmStartUsed: false,
      });
      expect(artifact.matrixDiagnostics).toMatchObject({
        allFourCandidatesPresent: true,
        allStructuralPass: true,
        allReadyForBetweenCandidateDescription: true,
      });
      expect(artifact.winnerSelection.promotedCandidateId).toBeNull();
      expect(artifact.matrixDiagnostics.eaTreatment).toMatchObject({
        includedInFactorContrasts: false,
        objectiveApplied: false,
        gateApplied: false,
        rankingApplied: false,
      });
      expect(
        artifact.numericalProtocolProvenance.priorProtocolEvidenceRetained
          .candidates,
      ).toHaveLength(4);

      for (const candidate of artifact.candidates) {
        expect(candidate.structuralStatus).toBe("pass");
        expect(candidate.beatsCompleted).toBe(32);
        expect(candidate.initialization.mode).toBe("cold");
        expect(candidate.parameterSnapshot.solver.maxIterations).toBe(14);
        expect(
          candidate.parameterSnapshot.solver.jacobianReuse.maxAcceptedSteps,
        ).toBe(0);
        const sourcePath = resolve(process.cwd(), candidate.sourceReportPath);
        expect(existsSync(sourcePath)).toBe(true);
        const compressed = readFileSync(sourcePath);
        expect(createHash("sha256").update(compressed).digest("hex")).toBe(
          candidate.sourceCompressedSha256,
        );
        const source = JSON.parse(gunzipSync(compressed).toString("utf8"));
        expect(source.runProtocol.sampleRetention).toBe(
          "last-two-complete-beats",
        );
        expect(source.samples).toHaveLength(401);
        expect(source.samples[0]).toHaveProperty("volumesMl.leftAtriumMl");
        expect(source.samples[0]).toHaveProperty("volumesMl.leftVentricleMl");
        expect(source.samples[0]).toHaveProperty("pressuresMmHg.la");
        expect(source.samples[0]).toHaveProperty("pressuresMmHg.lv");
        expect(source.samples[0]).toHaveProperty("flowsMlPerSec.mv");
        expect(source.samples[0]).toHaveProperty("freeCalciumUm.la");
        expect(source.samples[0]).toHaveProperty("caTroponin01.la");
        expect(source.samples[0]).toHaveProperty(
          "thinFilamentAvailability01.la",
        );
        expect(source.samples[0]).toHaveProperty(
          "wallReadback.la.seriesTensionKPa",
        );
      }
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("returns a failing CLI status for structural or provenance failure", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "la-thin-sls-exit-"));
    try {
      const artifact = assembleNoAvpdAtrialThinFilamentSlsMatrixV1(
        resolve(directory, "report.json"),
      );
      expect(
        noAvpdAtrialThinFilamentSlsCandidateCliExitCodeV1({
          structuralStatus: "pass",
        }),
      ).toBe(0);
      expect(
        noAvpdAtrialThinFilamentSlsCandidateCliExitCodeV1({
          structuralStatus: "fail",
        }),
      ).toBe(1);
      expect(noAvpdAtrialThinFilamentSlsMatrixCliExitCodeV1(artifact)).toBe(0);
      expect(
        noAvpdAtrialThinFilamentSlsMatrixCliExitCodeV1({
          ...artifact,
          parameterIsolation: {
            ...artifact.parameterIsolation,
            allCandidatesUseIndependentColdStart: false,
          },
        }),
      ).toBe(1);
      expect(
        noAvpdAtrialThinFilamentSlsMatrixCliExitCodeV1({
          ...artifact,
          matrixDiagnostics: {
            ...artifact.matrixDiagnostics,
            allStructuralPass: false,
          },
        }),
      ).toBe(1);
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});
