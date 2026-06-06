import type { GateResult, VerificationSummary } from "@/engine/verification/gates";

export type HeadroomGateSnapshot = Pick<GateResult, "value" | "status" | "severity" | "threshold" | "score">;

export type HeadroomReviewInput = {
  id: string;
  pass: boolean;
  hardFailures: number;
  softFailures: number;
  score: number;
  failedGateIds: string[];
  gates: Record<string, HeadroomGateSnapshot | null>;
  summary?: VerificationSummary;
  efRight?: number | null;
  pvfSFraction?: number | null;
  pvfSOverD?: number | null;
  pvfReverseFraction?: number | null;
  rvEfHeadroom: number | null;
  pvfSFractionHeadroom: number | null;
  limitingHeadroom: number | null;
  cappedHeadroomScore: number | null;
};

export type HeadroomCandidateReview = {
  rank: number;
  id: string;
  pass: boolean;
  hardFailures: number;
  softFailures: number;
  score: number;
  failedGateIds: string[];
  gates: Record<string, HeadroomGateSnapshot | null>;
  efRight: number | null;
  pvfSFraction: number | null;
  pvfSOverD: number | null;
  pvfReverseFraction: number | null;
  rvEfHeadroom: number | null;
  pvfSFractionHeadroom: number | null;
  limitingHeadroom: number | null;
  cappedHeadroomScore: number | null;
  deltasVsBaseline: Record<string, number | null>;
  deltasVsRank1: Record<string, number | null>;
  artifactFiles: string[];
};

export type HeadroomReview = {
  generatedAt: string;
  title: string;
  topN: number;
  baselineId: string | null;
  rank1Id: string | null;
  candidates: HeadroomCandidateReview[];
};

const DELTA_FIELDS = [
  "score",
  "hardFailures",
  "softFailures",
  "efRight",
  "pvfSFraction",
  "pvfSOverD",
  "pvfReverseFraction",
  "rvEfHeadroom",
  "pvfSFractionHeadroom",
  "limitingHeadroom",
  "cappedHeadroomScore",
] as const;

export function buildHeadroomReview(
  rows: HeadroomReviewInput[],
  options: { title?: string; topN?: number; generatedAt?: Date } = {},
): HeadroomReview {
  const topN = options.topN ?? 5;
  const topRows = rows.slice(0, topN);
  const baseline = rows.find((row) => row.id === "baseline") ?? null;
  const rank1 = rows[0] ?? null;
  return {
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    title: options.title ?? "Headroom Candidate Review",
    topN,
    baselineId: baseline?.id ?? null,
    rank1Id: rank1?.id ?? null,
    candidates: topRows.map((row, index) => ({
      rank: index + 1,
      id: row.id,
      pass: row.pass,
      hardFailures: row.hardFailures,
      softFailures: row.softFailures,
      score: row.score,
      failedGateIds: row.failedGateIds,
      gates: row.gates,
      efRight: row.efRight ?? null,
      pvfSFraction: row.pvfSFraction ?? null,
      pvfSOverD: row.pvfSOverD ?? null,
      pvfReverseFraction: row.pvfReverseFraction ?? null,
      rvEfHeadroom: row.rvEfHeadroom,
      pvfSFractionHeadroom: row.pvfSFractionHeadroom,
      limitingHeadroom: row.limitingHeadroom,
      cappedHeadroomScore: row.cappedHeadroomScore,
      deltasVsBaseline: numericDeltas(row, baseline),
      deltasVsRank1: numericDeltas(row, rank1),
      artifactFiles: ["metadata.json", "report.json", "report.md", "waveforms.svg", "pv-loops.svg"],
    })),
  };
}

export function headroomReviewToMarkdown(review: HeadroomReview): string {
  const lines: string[] = [];
  lines.push(`# ${review.title}`);
  lines.push("");
  lines.push(`- Generated: ${review.generatedAt}`);
  lines.push(`- Top candidates: ${review.topN}`);
  lines.push(`- Baseline: ${review.baselineId ?? "n/a"}`);
  lines.push(`- Rank 1: ${review.rank1Id ?? "n/a"}`);
  lines.push("");
  lines.push("| Rank | Candidate | Pass | Hard | Soft | RVEF | PVF S frac | Limiting headroom | Score | Failed gates |");
  lines.push("|---:|---|---|---:|---:|---:|---:|---:|---:|---|");
  for (const row of review.candidates) {
    lines.push([
      row.rank,
      row.id,
      row.pass ? "yes" : "no",
      row.hardFailures,
      row.softFailures,
      format(row.efRight, 3),
      format(row.pvfSFraction, 3),
      format(row.limitingHeadroom, 3),
      format(row.score, 3),
      row.failedGateIds.length > 0 ? row.failedGateIds.join(" ") : "-",
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  for (const row of review.candidates) {
    lines.push(`## ${row.rank}. ${row.id}`);
    lines.push("");
    lines.push(`- Artifacts: ${row.artifactFiles.join(", ")}`);
    lines.push(`- Headroom: RVEF=${format(row.rvEfHeadroom, 3)}, PVF S fraction=${format(row.pvfSFractionHeadroom, 3)}, limiting=${format(row.limitingHeadroom, 3)}, cappedScore=${format(row.cappedHeadroomScore, 3)}`);
    lines.push(`- Delta vs baseline: ${formatDeltas(row.deltasVsBaseline)}`);
    lines.push(`- Delta vs rank 1: ${formatDeltas(row.deltasVsRank1)}`);
    lines.push("");
    lines.push("### Guard Gates");
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

function numericDeltas(row: HeadroomReviewInput, base: HeadroomReviewInput | null): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const field of DELTA_FIELDS) {
    const value = numericField(row, field);
    const baseValue = base ? numericField(base, field) : null;
    out[field] = value == null || baseValue == null ? null : value - baseValue;
  }
  return out;
}

function numericField(row: HeadroomReviewInput, field: typeof DELTA_FIELDS[number]): number | null {
  const value = row[field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatDeltas(deltas: Record<string, number | null>): string {
  return Object.entries(deltas)
    .map(([key, value]) => `${key}=${format(value, 3)}`)
    .join(", ");
}

function format(value: number | null | undefined, dp: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  const f = 10 ** dp;
  return String(Math.round(value * f) / f);
}
