import { readFileSync, rmSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { renderNoAvpdFourChamberAtrialLandTriSegV2 } from "@/tools/mechanics2/renderNoAvpdFourChamberAtrialLandTriSegV2";
import { DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2 } from
  "@/engine/mechanics2/subsystems/NoAvpdFourChamberAtrialLandTriSegV2";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
  loadAcceptedNoAvpdFourChamberAtrialLandCheckpointV2,
  loadNoAvpdFourChamberAtrialLandTriSegReportV2,
  noAvpdFourChamberAtrialLandTriSegCliExitCodeV2,
  NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_STATE_TRANSITION_PATHS_V2,
  writeNoAvpdFourChamberAtrialLandTriSegReportV2,
} from "@/tools/mechanics2/runNoAvpdFourChamberAtrialLandTriSegBenchV2";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_DT_REFINEMENT_REPORT_PATH_V2,
  loadNoAvpdFourChamberAtrialLandTriSegDtRefinementV2,
} from "@/tools/mechanics2/runNoAvpdFourChamberAtrialLandTriSegDtRefinementV2";

const committedVisualPath = resolve(
  process.cwd(),
  "data/mechanics2/visuals/no-avpd-four-chamber-atrial-land-triseg-v2.html",
);

describe("No-AVPD four-chamber atrial Land V2 artifacts", () => {
  it("hashes direct calcium-driver and dimensional validation dependencies", () => {
    expect(
      NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_STATE_TRANSITION_PATHS_V2,
    ).toEqual(expect.arrayContaining([
      "engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV1.ts",
      "engine/myocardium/contracts.ts",
      "engine/myocardium/units.ts",
    ]));
  });

  it("loads the committed structural report with current provenance and an exact checkpoint", () => {
    const report = loadNoAvpdFourChamberAtrialLandTriSegReportV2(
      DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
      {
        requireAcceptedStructuralRun: true,
        requireCurrentImplementation: true,
        requireCurrentHarness: true,
      },
    );
    expect(report.status).toBe("pass");
    expect(report.parameterSnapshot).toEqual(
      DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
    );
    expect(report.provenance.executionEnvironment).toMatchObject({
      nodeVersion: expect.stringMatching(/^v/),
      platform: expect.any(String),
      architecture: expect.any(String),
      packageLockSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(report.protocol).toMatchObject({
      beatsRequested: 30,
      dtSec: 0.001,
      stepsPerCycle: 1_000,
      limitCycleGateApplied: true,
    });
    expect(report.continuationProtocol).toMatchObject({
      periodicToleranceMaxAbsDimensionless: 1e-4,
      periodicClassification: "within-caller-one-beat-return-tolerance",
      periodicConvergenceRequiredForCliSuccess: true,
    });
    expect(report.exactOneBeatFullStateReturnMap).toMatchObject({
      componentCount: 52,
      allComponentsFinite: true,
    });
    expect(
      report.exactOneBeatFullStateReturnMap!.maxAbsDimensionless,
    ).toBeLessThanOrEqual(
      report.continuationProtocol.periodicToleranceMaxAbsDimensionless,
    );
    expect(
      report.exactOneBeatFullStateReturnMap!.maximumComponentPath.length,
    ).toBeGreaterThan(0);
    expect(report.lastBeatSamples.length).toBe(
      report.protocol.stepsPerCycle + 1,
    );
    expect(report.numericalGates).toMatchObject({
      allRequestedStepsAccepted: true,
      bloodVolumeLedger: true,
      positiveCompartmentVolumes: true,
      landStateHealth: true,
      landWorkMapping: true,
    });
    const checkpoint =
      loadAcceptedNoAvpdFourChamberAtrialLandCheckpointV2(
        DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
        report.parameterSha256,
        report.protocol.dtSec,
      );
    expect(checkpoint.initialState).toEqual(report.finalState);
    expect(checkpoint.provenance.sourceNormalizedSha256).toBe(
      report.normalizedSha256,
    );
  });

  it("pre-renders every standard plot without relying on inline JavaScript", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "atrial-land-v2-visual-"));
    const destination = resolve(directory, "visual.html");
    try {
      const rendered = renderNoAvpdFourChamberAtrialLandTriSegV2(
        DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
        destination,
      );
      const html = readFileSync(destination, "utf8");
      expect(rendered.finalBeatRawVertexCount).toBeGreaterThan(500);
      expect(html).not.toContain("<script");
      expect(html).not.toContain("__NO_AVPD_ATRIAL_LAND_V2_");
      expect(html.match(/<svg\b/g)).toHaveLength(7);
      expect(html.match(/<path\b/g)?.length).toBeGreaterThanOrEqual(14);
      expect(html).toContain("series-reservoir");
      expect(html).toContain("series-conduit");
      expect(html).toContain("series-pumping");
      expect(html).toContain("Morphology remains report-only");
      expect(html).toContain("unresolved (no interior local minimum)");
      expect(html).toContain("no smoothing or resampling");
      expect(html).toBe(readFileSync(committedVisualPath, "utf8"));
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("pins a current, repository-owned gzip fine source for dt refinement", () => {
    const artifact = loadNoAvpdFourChamberAtrialLandTriSegDtRefinementV2(
      DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_DT_REFINEMENT_REPORT_PATH_V2,
      true,
    );
    expect(artifact.sources.coarse.path).not.toMatch(/^\//);
    expect(artifact.sources.fine.path).not.toMatch(/^\//);
    expect(artifact.sources.fine.contentEncoding).toBe("gzip");
    expect(artifact.sources.fine.path).toMatch(/dt0p5ms-v2\.json\.gz$/);
    expect(artifact.protocol).toMatchObject({
      coarseDtSec: 0.001,
      fineDtSec: 0.0005,
      refinementRatio: 2,
      commonRawVertexCount: 1_001,
    });
  });

  it("rejects a tampered dt-refinement normalized hash", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "atrial-land-v2-dt-"));
    const destination = resolve(directory, "tampered.json");
    try {
      const artifact = JSON.parse(readFileSync(
        DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_DT_REFINEMENT_REPORT_PATH_V2,
        "utf8",
      ));
      artifact.status = "tampered";
      writeFileSync(destination, JSON.stringify(artifact));
      expect(() =>
        loadNoAvpdFourChamberAtrialLandTriSegDtRefinementV2(destination)
      ).toThrow(/normalized hash does not match/);
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("guards the canonical report path against weaker protocols", () => {
    expect(() => writeNoAvpdFourChamberAtrialLandTriSegReportV2({
      beats: 12,
      dtSec: 0.001,
    })).toThrow(/canonical V2 report requires/);
  });

  it("fails CLI acceptance only when structural or requested periodic evidence fails", () => {
    const report = loadNoAvpdFourChamberAtrialLandTriSegReportV2(
      DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_REPORT_PATH_V2,
    );
    expect(noAvpdFourChamberAtrialLandTriSegCliExitCodeV2(report)).toBe(0);
    expect(noAvpdFourChamberAtrialLandTriSegCliExitCodeV2({
      ...report,
      status: "fail",
    })).toBe(1);
    expect(noAvpdFourChamberAtrialLandTriSegCliExitCodeV2({
      ...report,
      continuationProtocol: {
        ...report.continuationProtocol,
        periodicConvergenceRequiredForCliSuccess: true,
        periodicClassification: "outside-caller-one-beat-return-tolerance",
      },
    })).toBe(1);
  });
});
