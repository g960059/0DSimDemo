import { describe, expect, it } from "vitest";
import {
  buildLeftFillingReview,
  leftFillingReviewToMarkdown,
  type LeftFillingReviewInput,
} from "@/engine/fitting/leftFillingReview";

describe("left filling review pack", () => {
  const rows: LeftFillingReviewInput[] = [
    row("winner", 9.2, 0, 0, 0, 0.52),
    row("baseline", 8.0, 0, 0, 1, 0.50),
    row("failed", 2.0, 1, 0, 3, 0.48, ["qmv-extra-peaks"]),
  ];

  it("keeps ranked order while comparing candidates against baseline and rank 1", () => {
    const review = buildLeftFillingReview(rows, {
      topN: 3,
      generatedAt: new Date("2026-06-05T00:00:00.000Z"),
    });

    expect(review.candidates.map((candidate) => candidate.id)).toEqual(["winner", "baseline", "failed"]);
    expect(review.baselineId).toBe("baseline");
    expect(review.rank1Id).toBe("winner");
    expect(review.candidates[0].deltasVsBaseline.score).toBeCloseTo(1.2);
    expect(review.candidates[1].deltasVsRank1.score).toBeCloseTo(-1.2);
    expect(review.candidates[0].artifactFiles).toContain("waveforms.svg");
    expect(review.candidates[0].artifactFiles).toContain("pv-loops.svg");
  });

  it("preserves gate metadata and renders a markdown review", () => {
    const review = buildLeftFillingReview(rows, { topN: 2 });
    const markdown = leftFillingReviewToMarkdown(review);

    expect(review.candidates[0].gates["qmv-extra-peaks"]?.threshold).toBe("< 0.5");
    expect(review.candidates[0].gates["qmv-extra-peaks"]?.status).toBe("pass");
    expect(markdown).toContain("Left Filling Candidate Review");
    expect(markdown).toContain("winner");
    expect(markdown).toContain("qmv-extra-peaks");
    expect(markdown).toContain("threshold=< 0.5");
  });
});

function row(
  id: string,
  score: number,
  hardFailures: number,
  softFailures: number,
  ringingFailures: number,
  efRight: number,
  failedGateIds: string[] = [],
): LeftFillingReviewInput {
  return {
    id,
    pass: hardFailures === 0,
    hardFailures,
    softFailures,
    ringingFailures,
    score,
    failedGateIds,
    efRight,
    pvfDOverSPeak: 1.8,
    pvfSPeakTheta: 0.2,
    pvfDPeakTheta: 0.5,
    gates: {
      "qmv-extra-peaks": {
        value: ringingFailures,
        status: ringingFailures > 0 ? "fail" : "pass",
        severity: "hard",
        threshold: "< 0.5",
        score,
      },
      "lv-filling-edge-curvature": {
        value: 1.8 + ringingFailures,
        status: ringingFailures > 2 ? "fail" : "pass",
        severity: "hard",
        threshold: "< 2.4",
        score,
      },
    },
  };
}
