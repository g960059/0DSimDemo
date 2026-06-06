import { describe, expect, it } from "vitest";
import {
  buildHeadroomReview,
  headroomReviewToMarkdown,
  type HeadroomReviewInput,
} from "@/engine/fitting/headroomReview";

describe("headroom review pack", () => {
  const rows: HeadroomReviewInput[] = [
    row("winner", 0.54, 0.45, 0, 0),
    row("baseline", 0.51, 0.415, 0, 0),
    row("failed", 0.49, 0.42, 1, 0, ["ef-right"]),
  ];

  it("keeps ranked order while comparing candidates against baseline and rank 1", () => {
    const review = buildHeadroomReview(rows, {
      topN: 3,
      generatedAt: new Date("2026-06-05T00:00:00.000Z"),
    });

    expect(review.candidates.map((candidate) => candidate.id)).toEqual(["winner", "baseline", "failed"]);
    expect(review.baselineId).toBe("baseline");
    expect(review.rank1Id).toBe("winner");
    expect(review.candidates[0].deltasVsBaseline.efRight).toBeCloseTo(0.03);
    expect(review.candidates[0].deltasVsBaseline.pvfSFraction).toBeCloseTo(0.035);
    expect(review.candidates[0].artifactFiles).toContain("waveforms.svg");
  });

  it("renders headroom and guard gates in markdown", () => {
    const review = buildHeadroomReview(rows, { topN: 2 });
    const markdown = headroomReviewToMarkdown(review);

    expect(markdown).toContain("Headroom Candidate Review");
    expect(markdown).toContain("winner");
    expect(markdown).toContain("limiting=");
    expect(markdown).toContain("pvf-s-fraction");
    expect(markdown).toContain("threshold=> 0.40");
  });
});

function row(
  id: string,
  efRight: number,
  pvfSFraction: number,
  hardFailures: number,
  softFailures: number,
  failedGateIds: string[] = [],
): HeadroomReviewInput {
  return {
    id,
    pass: hardFailures === 0,
    hardFailures,
    softFailures,
    score: 8,
    failedGateIds,
    efRight,
    pvfSFraction,
    pvfSOverD: 0.7,
    pvfReverseFraction: 0.035,
    rvEfHeadroom: efRight - 0.50,
    pvfSFractionHeadroom: pvfSFraction - 0.40,
    limitingHeadroom: Math.min(efRight - 0.50, pvfSFraction - 0.40),
    cappedHeadroomScore: 0.5,
    gates: {
      "ef-right": {
        value: efRight,
        status: efRight > 0.50 ? "pass" : "fail",
        severity: "hard",
        threshold: "> 0.50",
        score: 1,
      },
      "pvf-s-fraction": {
        value: pvfSFraction,
        status: pvfSFraction > 0.40 ? "pass" : "fail",
        severity: "hard",
        threshold: "> 0.40",
        score: 1,
      },
    },
  };
}
