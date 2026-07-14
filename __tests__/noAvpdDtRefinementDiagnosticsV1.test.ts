import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  renderNoAvpdFourChamberDtRefinementV1,
} from "@/tools/mechanics2/renderNoAvpdFourChamberDtRefinementV1";
import {
  runNoAvpdFourChamberDtRefinementV1,
  type NoAvpdDtRefinementArtifactV1,
} from "@/tools/mechanics2/runNoAvpdFourChamberDtRefinementV1";

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

describe("NoAvpdDtRefinementDiagnosticsV1", () => {
  it("compares exact nested raw phase nodes and renders an untampered fragment", () => {
    const body = runNoAvpdFourChamberDtRefinementV1({
      beats: 3,
      stepsPerCycle: [200, 400],
    });
    const artifact: NoAvpdDtRefinementArtifactV1 = {
      ...body,
      normalizedSha256: sha256Json(body),
    };

    expect(artifact.statusScope).toBe("report-only-diagnostic-bundle");
    expect(artifact.runDefinition.initialization)
      .toBe("independent-cold-start-per-time-step");
    expect(artifact.runDefinition.parameterChangesAcrossRuns).toBe(false);
    expect(artifact.runDefinition.waveformInterpolationForComparison).toBe(false);
    expect(artifact.diagnostics.thresholdsApplied).toBe(false);
    expect(artifact.diagnostics.accuracyClassification).toBe("not-performed");
    expect(artifact.diagnostics.physiologyClassification).toBe("not-performed");
    expect(artifact.diagnostics.runs.map((run) => run.rawEndpointSampleCount))
      .toEqual([201, 401]);
    expect(artifact.diagnostics.runs.every(
      (run) => run.events.availability === "available-complete-raw-two-cycle-window",
    )).toBe(true);

    const pair = artifact.diagnostics.pairwise[0];
    expect(pair?.nestedGridRatio).toBe(2);
    expect(pair?.commonNodeComparison)
      .toBe("exact-nested-phase-nodes-no-interpolation");
    expect(pair?.channelDifferences.leftAtriumPressureMmHg.commonNodeCount).toBe(201);
    expect(pair?.channelDifferences.mitralFlowMlPerSec.maxAbsNative)
      .toBeGreaterThanOrEqual(0);
    expect(artifact.diagnostics.successiveChangeRatioFinePairOverCoarsePair).toBeNull();

    const fragment = renderNoAvpdFourChamberDtRefinementV1(artifact);
    expect(fragment).toContain('id="no-avpd-dt-refinement-v1"');
    expect(fragment).toContain(artifact.normalizedSha256);
    expect(fragment).not.toContain("__NO_AVPD_DT_REFINEMENT_DATA__");
    expect(fragment).not.toMatch(/<!doctype|<html|<body/i);

    const tampered: NoAvpdDtRefinementArtifactV1 = {
      ...artifact,
      runDefinition: {
        ...artifact.runDefinition,
        beatsPerRun: artifact.runDefinition.beatsPerRun + 1,
      },
    };
    expect(() => renderNoAvpdFourChamberDtRefinementV1(tampered))
      .toThrow("normalized hash does not match");
  }, 30_000);
});
