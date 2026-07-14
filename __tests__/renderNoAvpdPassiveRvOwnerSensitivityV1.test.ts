import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { renderNoAvpdPassiveRvOwnerSensitivityV1 } from "@/tools/mechanics2/renderNoAvpdPassiveRvOwnerSensitivityV1";
import type { NoAvpdPassiveRvOwnerSensitivityArtifactV1 } from "@/tools/mechanics2/runNoAvpdPassiveRvOwnerSensitivityV1";

const artifactPath = resolve(
  process.cwd(),
  "data/mechanics2/reports/no-avpd-passive-rv-owner-sensitivity-v1.json",
);

describe("NoAvpdPassiveRvOwnerSensitivityV1 renderer", () => {
  it("renders four raw panels, five toggles, and one explicit shared reference", () => {
    const artifact = readArtifact();
    const rendered = renderNoAvpdPassiveRvOwnerSensitivityV1(artifact);
    const embedded = embeddedData(rendered);

    expect(rendered).toContain('<meta charset="utf-8" />');
    expect(rendered).toContain('id="no-avpd-passive-rv-owner-sensitivity-v1"');
    for (const panel of [
      "required-rv-volume",
      "lv-pressure-volume",
      "septal-cap-volume",
      "centered-pressure-slope",
    ]) {
      expect(rendered).toContain(`data-plot="${panel}"`);
    }
    expect(rendered.match(/data-series-toggle=/g)).toHaveLength(5);
    expect(rendered).toContain('data-family="load"');
    expect(rendered).toContain('data-family="stiffness"');
    expect(rendered).toContain("no physiology gate");
    expect(rendered).toContain("cross-family ranking is prohibited");
    expect(rendered).toContain("Hover a raw marker");
    expect(rendered).not.toContain(
      "__NO_AVPD_PASSIVE_RV_OWNER_SENSITIVITY_DATA__",
    );
    expect(rendered).not.toContain("innerTriSegSolveCount");
    expect(Buffer.byteLength(rendered)).toBeLessThan(2_000_000);

    expect(embedded.series).toHaveLength(5);
    expect(
      embedded.series
        .filter(
          (series) =>
            series.visualFamily === "load" ||
            series.visualFamily === "shared-reference",
        )
        .map((series) => series.effectiveInputs.targetRvTransmuralPressureMmHg)
        .sort((left, right) => left - right),
    ).toEqual([1.5, 2, 5]);
    expect(
      embedded.series
        .filter(
          (series) =>
            series.visualFamily === "stiffness" ||
            series.visualFamily === "shared-reference",
        )
        .map(
          (series) =>
            series.declaration.rightFreeWallPassiveTangentModulusScale,
        )
        .sort((left, right) => left - right),
    ).toEqual([0.5, 1, 2]);
    expect(embedded.referenceIdentity).toMatchObject({
      visualSeriesId: "shared-reference",
      completeEdpvrReportsByteIdentical: true,
      loadFamilyCandidateId: "rv-load-5-mmHg-reference",
      stiffnessFamilyCandidateId: "rv-passive-tangent-1x-reference",
    });
    expect(embedded.visualizationProvenance).toMatchObject({
      fullRequestedLvVolumeGridRetainedPerVisualSeries: true,
      duplicatedReferenceRenderedOnce: true,
      rawIndependentEquilibriumPoints: true,
      smoothingApplied: false,
      decimationApplied: false,
      derivativeRecalculated: false,
      dataValueRoundingAppliedBeforeProjection: false,
    });
    for (const series of embedded.series) {
      expect(series.points).toHaveLength(25);
      expect(series.rootAvailability.allPointsAvailable).toBe(true);
      expect(series.points[0].centeredSecantPressureSlopeMmHgPerMl).toBeNull();
      expect(series.points[24].centeredSecantPressureSlopeMmHgPerMl).toBeNull();
      expect(
        series.points.filter(
          (point: { centeredSecantPressureSlopeMmHgPerMl: number | null }) =>
            point.centeredSecantPressureSlopeMmHgPerMl !== null,
        ),
      ).toHaveLength(23);
    }
  });

  it("rejects candidate content whose inner hash is invalid even after renormalization", () => {
    const changed = structuredClone(
      readArtifact(),
    ) as unknown as DeepMutable<NoAvpdPassiveRvOwnerSensitivityArtifactV1>;
    changed.families[0].candidates[0].hashes.completeCandidateReportSha256 =
      "0".repeat(64);
    const { normalizedSha256: _oldHash, ...body } = changed;
    changed.normalizedSha256 = sha256Json(body);

    expect(() =>
      renderNoAvpdPassiveRvOwnerSensitivityV1(
        changed as unknown as NoAvpdPassiveRvOwnerSensitivityArtifactV1,
      ),
    ).toThrow(/candidate report hash mismatch/);
  });
});

function readArtifact(): NoAvpdPassiveRvOwnerSensitivityArtifactV1 {
  return JSON.parse(
    readFileSync(artifactPath, "utf8"),
  ) as NoAvpdPassiveRvOwnerSensitivityArtifactV1;
}

function embeddedData(rendered: string): {
  readonly series: readonly {
    readonly visualFamily: "load" | "stiffness" | "shared-reference";
    readonly effectiveInputs: {
      readonly targetRvTransmuralPressureMmHg: number;
    };
    readonly declaration: {
      readonly rightFreeWallPassiveTangentModulusScale: number;
    };
    readonly points: readonly {
      readonly centeredSecantPressureSlopeMmHgPerMl: number | null;
    }[];
    readonly rootAvailability: { readonly allPointsAvailable: boolean };
  }[];
  readonly referenceIdentity: Record<string, unknown>;
  readonly visualizationProvenance: Record<string, unknown>;
} {
  const match = rendered.match(
    /id="no-avpd-passive-rv-owner-sensitivity-data"[^>]*>\s*([\s\S]*?)\s*<\/script>/,
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
