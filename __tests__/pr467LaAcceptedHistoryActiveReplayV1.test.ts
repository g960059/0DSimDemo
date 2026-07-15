import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  pr467LaAcceptedHistoryActiveReplayCliExitCodeV1,
  writePr467LaAcceptedHistoryActiveReplayV1,
} from "@/tools/mechanics2/runPr467LaAcceptedHistoryActiveReplayV1";
import { renderPr467LaAcceptedHistoryActiveReplayV1 } from "@/tools/mechanics2/renderPr467LaAcceptedHistoryActiveReplayV1";

describe("PR #467 LA accepted-history active replay V1", () => {
  it("closes the source Hill trajectory and replays active-only Land on every accepted endpoint", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "pr467-la-replay-"));
    const destination = resolve(directory, "report.json");
    try {
      const artifact = writePr467LaAcceptedHistoryActiveReplayV1(destination);
      const persisted = JSON.parse(readFileSync(destination, "utf8"));
      const { normalizedSha256, ...body } = persisted;

      expect(normalizedSha256).toBe(
        createHash("sha256").update(JSON.stringify(body)).digest("hex"),
      );
      expect(artifact.status).toBe("pass");
      expect(pr467LaAcceptedHistoryActiveReplayCliExitCodeV1(artifact)).toBe(0);
      expect(artifact.results).toHaveLength(4);
      expect(artifact.claim.closedLoopFeedbackOfLandStress).toBe(false);
      expect(artifact.claim.externalSeriesElasticElementAddedToLand).toBe(false);
      expect(artifact.claim.postHocForceVelocityMultiplierAddedToLand).toBe(
        false,
      );
      expect(artifact.claim.activeStressGainAddedToLand).toBe(false);

      for (const result of artifact.results) {
        expect(result.status).toBe("pass");
        expect(result.sourceSampleCount).toBe(401);
        expect(result.replayedTransitionCount).toBe(400);
        expect(result.finalBeatRawVertexCount).toBe(201);
        expect(result.trace[0]!.plotPhase01).toBe(0);
        expect(result.trace.at(-1)!.plotPhase01).toBe(1);
        expect(result.gates).toEqual({
          hillClosurePass: true,
          landStateHealthPass: true,
          landWorkMappingPass: true,
          finalBeatHasAllAcceptedStepEndpoints: true,
        });
        expect(
          result.diagnostics.maximumAbsoluteHillStateClosureError,
        ).toBeLessThanOrEqual(1e-12);
        expect(
          result.diagnostics.maximumAbsoluteHillTotalStressClosurePa,
        ).toBeLessThanOrEqual(1e-8);
        expect(result.diagnostics.landProjectionOccurred).toBe(false);
        expect(result.summary.landToHillPeakActiveStressRatio).toBeGreaterThan(
          1,
        );
      }
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("returns nonzero for failed evidence", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "pr467-la-exit-"));
    try {
      const artifact = writePr467LaAcceptedHistoryActiveReplayV1(
        resolve(directory, "report.json"),
      );
      expect(
        pr467LaAcceptedHistoryActiveReplayCliExitCodeV1({
          ...artifact,
          status: "fail",
        }),
      ).toBe(1);
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("contains a complete static baseline when inline JavaScript is unavailable", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "pr467-la-visual-"));
    const destination = resolve(directory, "visual.html");
    try {
      renderPr467LaAcceptedHistoryActiveReplayV1(destination);
      const html = readFileSync(destination, "utf8");
      const staticBaseline = html.split("<script>")[0] ?? "";

      expect(staticBaseline.match(/<option\b/g)).toHaveLength(4);
      expect(staticBaseline).toContain('<select id="candidate" disabled>');
      expect(staticBaseline).toContain("replay gates: PASS");
      expect(staticBaseline).toContain("Static baseline: ALG_SLS4");
      expect(staticBaseline).not.toContain("__PR467_LA_REPLAY_");
      expect(html).not.toContain("__PR467_LA_ACCEPTED_HISTORY_REPLAY_DATA__");

      for (const svgId of ["lapv", "stress", "activepv", "forcing"]) {
        const svgMarkup = staticBaseline.match(
          new RegExp(`<svg\\b[^>]*id="${svgId}"[^>]*>([\\s\\S]*?)<\\/svg>`),
        )?.[1];
        expect(svgMarkup).toBeDefined();
        expect(svgMarkup).toContain("<path");
        expect(svgMarkup).toContain("<line");
        expect(svgMarkup).toContain("<text");
      }
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});
