import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { renderNoAvpdAtrialThinFilamentSlsMatrixV1 } from "@/tools/mechanics2/renderNoAvpdAtrialThinFilamentSlsMatrixV1";
import type { NoAvpdAtrialThinFilamentSlsMatrixArtifactV1 } from "@/tools/mechanics2/runNoAvpdAtrialThinFilamentSlsMatrixV1";

const artifactPath = resolve(
  process.cwd(),
  "data/mechanics2/reports/no-avpd-atrial-thin-filament-sls-matrix-v1.json",
);

describe("NoAvpdAtrialThinFilamentSlsMatrixV1 renderer", () => {
  it("embeds four closed raw 5 ms cycles without smoothing, decimation, or E/A ranking", () => {
    const artifact = readArtifact();
    const rendered = renderNoAvpdAtrialThinFilamentSlsMatrixV1(artifact);
    const embedded = embeddedData(rendered);

    expect(rendered).toContain(
      'id="no-avpd-atrial-thin-filament-sls-matrix-v1"',
    );
    expect(rendered).not.toContain(
      "__NO_AVPD_ATRIAL_THIN_FILAMENT_SLS_MATRIX_DATA__",
    );
    expect(rendered).not.toMatch(/<!doctype|<html|<head|<body/i);
    expect(rendered).toContain("E/A is readback only");
    expect(rendered).toContain("never a rank or gate");
    expect(Buffer.byteLength(rendered)).toBeLessThan(2_000_000);

    expect(
      embedded.candidates.map((candidate) => candidate.candidateId),
    ).toEqual(["ALG_SLS4", "ALG_SLS8", "LAG25_SLS4", "LAG25_SLS8"]);
    expect(embedded.traceColumns).toEqual([
      "phase01",
      "laVolumeMl",
      "lapMmHg",
      "lvpMmHg",
      "mvFlowMlPerSec",
      "caTroponin01",
      "equilibriumGate01",
      "thinFilamentAvailability01",
      "seriesTensionKPa",
    ]);
    expect(
      embedded.candidates.map((candidate) => candidate.structuralStatus),
    ).toEqual(["pass", "pass", "pass", "pass"]);
    for (const candidate of embedded.candidates) {
      expect(candidate.trace).toHaveLength(201);
      expect(candidate.trace[0]?.[0]).toBe(0);
      expect(candidate.trace.at(-1)?.[0]).toBe(1);
    }
    for (const candidate of embedded.candidates.slice(0, 2)) {
      expect(
        Math.max(...candidate.trace.map((row) => Math.abs(row[6] - row[7]))),
      ).toBeLessThan(1e-12);
    }
    for (const candidate of embedded.candidates.slice(2)) {
      expect(
        Math.max(...candidate.trace.map((row) => Math.abs(row[6] - row[7]))),
      ).toBeGreaterThan(1e-4);
    }
    expect(embedded.visualizationProvenance).toMatchObject({
      rawAcceptedStepVertices: true,
      smoothingApplied: false,
      decimationApplied: false,
      dataValueRoundingAppliedBeforeProjection: false,
      physiologicalCurveFittingApplied: false,
      failedCandidateWaveformsFabricated: false,
      ledgerOwnedLaBloodVolume: true,
      eaUsedForRankingOrGating: false,
    });
    expect(embedded.protocol).toMatchObject({
      beats: 32,
      dtSec: 0.005,
      heartRateBpm: 60,
      jacobianReuseMaxAcceptedSteps: 0,
      automaticWinnerSelection: false,
      physiologyGateApplied: false,
    });
  });

  it("rejects compact-artifact tampering before source projection", () => {
    const artifact = structuredClone(
      readArtifact(),
    ) as unknown as DeepMutable<NoAvpdAtrialThinFilamentSlsMatrixArtifactV1>;
    artifact.protocol.beats += 1;
    expect(() =>
      renderNoAvpdAtrialThinFilamentSlsMatrixV1(
        artifact as unknown as NoAvpdAtrialThinFilamentSlsMatrixArtifactV1,
      ),
    ).toThrow(/normalized hash/);

    const { normalizedSha256: _oldHash, ...body } = artifact;
    artifact.normalizedSha256 = sha256Json(body);
    expect(() =>
      renderNoAvpdAtrialThinFilamentSlsMatrixV1(
        artifact as unknown as NoAvpdAtrialThinFilamentSlsMatrixArtifactV1,
      ),
    ).toThrow(/protocol hash/);
  });
});

function readArtifact(): NoAvpdAtrialThinFilamentSlsMatrixArtifactV1 {
  return JSON.parse(
    readFileSync(artifactPath, "utf8"),
  ) as NoAvpdAtrialThinFilamentSlsMatrixArtifactV1;
}

function embeddedData(rendered: string): {
  readonly traceColumns: readonly string[];
  readonly protocol: Record<string, unknown>;
  readonly candidates: readonly {
    readonly candidateId: string;
    readonly structuralStatus: string;
    readonly trace: readonly (readonly number[])[];
  }[];
  readonly visualizationProvenance: Record<string, unknown>;
} {
  const match = rendered.match(
    /id="no-avpd-atrial-thin-filament-sls-matrix-data"[^>]*>\s*([\s\S]*?)\s*<\/script>/,
  );
  expect(match).not.toBeNull();
  return JSON.parse(match![1]!);
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

type DeepMutable<T> = {
  -readonly [Key in keyof T]: T[Key] extends readonly (infer Item)[]
    ? DeepMutable<Item>[]
    : T[Key] extends object
      ? DeepMutable<T[Key]>
      : T[Key];
};
