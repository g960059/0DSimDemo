import type { GateResult, VerificationSummary } from "@/engine/verification/gates";

export type LeftFillingGateSnapshot = Pick<GateResult, "value" | "status" | "severity" | "threshold" | "score">;

export type LeftFillingReviewInput = {
  id: string;
  pass: boolean;
  hardFailures: number;
  softFailures: number;
  ringingFailures: number;
  score: number;
  failedGateIds: string[];
  gates: Record<string, LeftFillingGateSnapshot | null>;
  summary?: VerificationSummary;
  efRight?: number | null;
  pvfDOverSPeak?: number | null;
  pvfSPeakTheta?: number | null;
  pvfDPeakTheta?: number | null;
};

export type LeftFillingCandidateReview = {
  rank: number;
  id: string;
  pass: boolean;
  hardFailures: number;
  softFailures: number;
  ringingFailures: number;
  score: number;
  failedGateIds: string[];
  gates: Record<string, LeftFillingGateSnapshot | null>;
  deltasVsBaseline: Record<string, number | null>;
  deltasVsRank1: Record<string, number | null>;
  artifactFiles: string[];
};

export type LeftFillingReview = {
  generatedAt: string;
  topN: number;
  baselineId: string | null;
  rank1Id: string | null;
  candidates: LeftFillingCandidateReview[];
};

const DELTA_FIELDS = [
  "score",
  "hardFailures",
  "softFailures",
  "ringingFailures",
  "efRight",
  "pvfDOverSPeak",
  "pvfSPeakTheta",
  "pvfDPeakTheta",
] as const;

export function buildLeftFillingReview(
  rows: LeftFillingReviewInput[],
  options: { topN?: number; generatedAt?: Date } = {},
): LeftFillingReview {
  const topN = options.topN ?? 5;
  const topRows = rows.slice(0, topN);
  const baseline = rows.find((row) => row.id === "baseline") ?? null;
  const rank1 = rows[0] ?? null;
  return {
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    topN,
    baselineId: baseline?.id ?? null,
    rank1Id: rank1?.id ?? null,
    candidates: topRows.map((row, index) => ({
      rank: index + 1,
      id: row.id,
      pass: row.pass,
      hardFailures: row.hardFailures,
      softFailures: row.softFailures,
      ringingFailures: row.ringingFailures,
      score: row.score,
      failedGateIds: row.failedGateIds,
      gates: row.gates,
      deltasVsBaseline: numericDeltas(row, baseline),
      deltasVsRank1: numericDeltas(row, rank1),
      artifactFiles: ["metadata.json", "report.json", "report.md", "waveforms.svg", "pv-loops.svg"],
    })),
  };
}

export function leftFillingReviewToMarkdown(review: LeftFillingReview): string {
  const lines: string[] = [];
  lines.push("# Left Filling Candidate Review");
  lines.push("");
  lines.push(`- Generated: ${review.generatedAt}`);
  lines.push(`- Top candidates: ${review.topN}`);
  lines.push(`- Baseline: ${review.baselineId ?? "n/a"}`);
  lines.push(`- Rank 1: ${review.rank1Id ?? "n/a"}`);
  lines.push("");
  lines.push("| Rank | Candidate | Pass | Hard | Soft | Ringing | Score | Failed gates |");
  lines.push("|---:|---|---|---:|---:|---:|---:|---|");
  for (const row of review.candidates) {
    lines.push([
      row.rank,
      row.id,
      row.pass ? "yes" : "no",
      row.hardFailures,
      row.softFailures,
      row.ringingFailures,
      round(row.score, 3),
      row.failedGateIds.length > 0 ? row.failedGateIds.join(" ") : "-",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  for (const row of review.candidates) {
    lines.push(`## ${row.rank}. ${row.id}`);
    lines.push("");
    lines.push(`- Artifacts: ${row.artifactFiles.join(", ")}`);
    lines.push(`- Delta vs baseline: ${formatDeltas(row.deltasVsBaseline)}`);
    lines.push(`- Delta vs rank 1: ${formatDeltas(row.deltasVsRank1)}`);
    lines.push("");
    lines.push("### Morphology Gates");
    lines.push("");
    for (const [id, gate] of Object.entries(row.gates)) {
      if (!gate) {
        lines.push(`- ${id}: n/a`);
        continue;
      }
      lines.push(`- ${id}: ${gate.status} value=${String(gate.value ?? "n/a")} threshold=${gate.threshold ?? "n/a"}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function numericDeltas(row: LeftFillingReviewInput, base: LeftFillingReviewInput | null): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const field of DELTA_FIELDS) {
    const value = numericField(row, field);
    const baseValue = base ? numericField(base, field) : null;
    out[field] = value == null || baseValue == null ? null : value - baseValue;
  }
  return out;
}

function numericField(row: LeftFillingReviewInput, field: typeof DELTA_FIELDS[number]): number | null {
  const value = row[field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatDeltas(deltas: Record<string, number | null>): string {
  return Object.entries(deltas)
    .map(([key, value]) => `${key}=${value == null ? "n/a" : round(value, 3)}`)
    .join(", ");
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}
