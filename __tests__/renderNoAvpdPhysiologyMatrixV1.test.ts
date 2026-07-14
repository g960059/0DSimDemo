import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { renderNoAvpdPhysiologyMatrixV1 } from "@/tools/mechanics2/renderNoAvpdPhysiologyMatrixV1";
import type { NoAvpdPhysiologyMatrixArtifactV1 } from "@/tools/mechanics2/runNoAvpdPhysiologyMatrixV1";

const artifactPath = resolve(
  process.cwd(),
  "data/mechanics2/reports/no-avpd-physiology-matrix-v1.json",
);

describe("NoAvpdPhysiologyMatrixV1 renderer", () => {
  it("embeds raw passing cycles and leaves the failed candidate without a waveform", () => {
    const artifact = JSON.parse(
      readFileSync(artifactPath, "utf8"),
    ) as NoAvpdPhysiologyMatrixArtifactV1;
    const rendered = renderNoAvpdPhysiologyMatrixV1(artifact);

    expect(rendered).toContain('id="no-avpd-physiology-matrix-v1"');
    expect(rendered).toContain('data-plot="mitral-head"');
    expect(rendered).toContain("matched-volume gap decomposition");
    expect(rendered).toContain("P2 +");
    expect(rendered).toContain("seriesTensionGapMmHg");
    expect(rendered).toContain("wave-separation gate is applied");
    expect(rendered).toContain("rawAcceptedStepVertices");
    expect(rendered).toContain('"smoothingApplied":false');
    expect(rendered).toContain('"decimationApplied":false');
    expect(rendered).toContain('"structuralFailureWaveformsFabricated":false');
    expect(rendered).not.toContain("__NO_AVPD_PHYSIOLOGY_MATRIX_DATA__");

    const failed = artifact.candidates.find(
      (candidate) => candidate.candidateId === "lv-ca-decay-116ms",
    );
    const baseline = artifact.candidates.find(
      (candidate) => candidate.candidateId === "lv-ca-decay-155ms-baseline",
    );
    expect(baseline?.diagnostics.pumpingMorphology?.localExtremaCount).toBe(3);
    expect(
      baseline?.diagnostics.pumpingMorphology?.lateRebound.amplitudeMmHg,
    ).toBeCloseTo(0.716846, 5);
    expect(
      baseline?.diagnostics.matchedVolume?.componentDecomposition.summary
        ?.seriesTension.meanMmHg,
    ).toBeCloseTo(0.202792, 5);
    expect(
      baseline?.diagnostics.matchedVolume?.componentDecomposition
        .reconstructionResidual?.maximumAbsoluteMmHg,
    ).toBeLessThan(2e-4);
    expect(failed?.structuralStatus).toBe("fail");
    expect(failed?.diagnostics.compactRawAnchorCycle).toEqual([]);
  });

  it("rejects an artifact whose normalized body was changed", () => {
    const artifact = JSON.parse(
      readFileSync(artifactPath, "utf8"),
    ) as NoAvpdPhysiologyMatrixArtifactV1;
    const changed = {
      ...artifact,
      evidenceStatus: "changed-after-hash",
    } as unknown as NoAvpdPhysiologyMatrixArtifactV1;

    expect(() => renderNoAvpdPhysiologyMatrixV1(changed)).toThrow(
      /normalized hash/,
    );
  });
});
